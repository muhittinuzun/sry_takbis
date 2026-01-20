/**
 * Suriye TAKBIS - OCR İşlemleri
 * ==============================
 */

const OcrManager = {
    /**
     * Görsel dosyasını n8n webhook'una gönderir ve OCR sonucunu alır
     * @param {File} file - Görsel dosyası
     * @param {string} mode - 'prod' veya 'test'
     * @returns {Promise<Object>}
     */
    async processImage(file, mode = 'prod') {
        console.log('OCR: Dosya yüklendi:', file.name, file.type, file.size, 'bytes');

        // Base64'e çevir
        const base64 = await Utils.fileToBase64(file);

        // Webhook URL'sini al
        const webhookUrl = Utils.resolveWebhookUrl(mode);
        console.log('OCR: Webhook\'a gönderiliyor...', webhookUrl);

        // İsteği gönder
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: base64 })
        });

        console.log('OCR: Webhook yanıtı:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OCR: Webhook hatası:', response.status, errorText);
            throw new OcrError(response.status, errorText);
        }

        const result = await response.json();
        console.log('OCR: Raw data:', result);

        return this.parseResult(result);
    },

    /**
     * n8n'den gelen sonucu parse eder
     * @param {Object} result 
     * @returns {Object}
     */
    parseResult(result) {
        // n8n bazen [{json:{...}}] veya {...} döner
        let data = result;
        if (Array.isArray(data)) data = data[0];
        if (data && data.json) data = data.json;

        console.log('OCR: Processed data:', data);

        const parsed = this.parseNestedStructure(data);

        // Eski yapı veya farklı n8n formatları için fallback
        if (!parsed.property_number || parsed.owner_name === '') {
            console.log('OCR: Gelişmiş yapı tam eşleşmedi, derin arama (deep search) deneniyor...');
            const getV = (key, aliases = []) => {
                let val = Utils.findDeep(data, key);
                if (val) return val;
                for (let a of aliases) {
                    val = Utils.findDeep(data, a);
                    if (val) return val;
                }
                return '';
            };

            const fallback = {
                owner_name: getV('owner_name', ['malik', 'fullname', 'name', 'isim_soyisim', 'name_ar']),
                signature_date: getV('signature_date', ['tarih', 'date', 'islem_tarihi', 'transaction_date']),
                share_text: getV('share_text', ['hisse', 'pay', 'share']),
                province: getV('province', ['il', 'bolge', 'city', 'muhafaza']),
                district: getV('district', ['ilce', 'semt', 'mıntıka', 'bolge_semt']),
                directorate: getV('directorate', ['mudurluk', 'daire', 'office', 'register_office']),
                property_number: getV('property_number', ['parsel', 'ada_parsel', 'no', 'property_id']),
                property_type: getV('property_type', ['cins', 'nitelik', 'type', 'cins_kisa']),
                area_text: getV('area_text', ['alan', 'yuzolcumu', 'size', 'm2']),
                daily_register_no: getV('daily_register_no', ['yevmiye', 'yevmiye_no', 'reg_no']),
                transaction_type: getV('transaction_type', ['islem', 'islem_turu', 'type_of_transaction']),
                description: getV('description', ['aciklama', 'not', 'beyanlar', 'note'])
            };

            // Eğer fallback bir şeyler bulduysa onu kullan
            if (fallback.owner_name || fallback.property_number) {
                console.log('OCR: Fallback başarılı:', fallback);
                // Boş olanları doldur
                for (let k in fallback) {
                    if (fallback[k] && !parsed[k]) parsed[k] = fallback[k];
                }
            }
        }

        // Final Temizlik: Hala boşsa varsayılan değerler
        if (!parsed.owner_name) parsed.owner_name = 'Unknown';

        console.log('OCR: Final işlenmiş veri:', parsed);
        return parsed;
    },

    /**
     * Yeni nested yapıyı parse eder (pages -> sections -> fields)
     * @param {Object} data 
     * @returns {Object}
     */
    parseNestedStructure(data) {
        const result = {
            owner_name: '',
            signature_date: '',
            share_text: '',
            province: '',
            district: '',
            directorate: '',
            property_number: '',
            property_type: '',
            area_text: '',
            daily_register_no: '',
            transaction_type: '',
            description: ''
        };

        // Pages yoksa eski yapı
        if (!data.pages || !Array.isArray(data.pages)) {
            return result;
        }

        // Her page'i iterate et
        data.pages.forEach(page => {
            if (!page.sections || !Array.isArray(page.sections)) return;

            page.sections.forEach(section => {
                // Repeatable section (Kayıt Tablosu gibi)
                if (section.repeatable && section.fields && Array.isArray(section.fields)) {
                    // En son kaydı al (en güncel bilgi)
                    const lastRecord = section.fields[section.fields.length - 1];
                    if (lastRecord) {
                        if (lastRecord.owner_name && !result.owner_name) {
                            result.owner_name = lastRecord.owner_name;
                        }
                        if (lastRecord.daily_register_no && !result.daily_register_no) {
                            result.daily_register_no = lastRecord.daily_register_no;
                        }
                        if (lastRecord.transaction_date && !result.signature_date) {
                            result.signature_date = lastRecord.transaction_date;
                        }
                        if (lastRecord.share_text && !result.share_text) {
                            result.share_text = lastRecord.share_text;
                        }
                        if (lastRecord.transaction_type && !result.transaction_type) {
                            result.transaction_type = lastRecord.transaction_type;
                        }
                    }
                }
                // Normal field-based section
                else if (section.fields && Array.isArray(section.fields)) {
                    section.fields.forEach(field => {
                        // Field objesi key-value yapısında
                        if (field.key && field.value !== undefined && field.value !== null && field.value !== '') {
                            const key = field.key;
                            const value = String(field.value).trim();

                            // Field mapping
                            switch (key) {
                                case 'province':
                                    if (!result.province) result.province = value;
                                    break;
                                case 'district':
                                    if (!result.district) result.district = value;
                                    break;
                                case 'directorate':
                                    if (!result.directorate) result.directorate = value;
                                    break;
                                case 'office_or_circle':
                                    if (!result.directorate) result.directorate = value;
                                    break;
                                case 'property_number':
                                    if (!result.property_number) result.property_number = value;
                                    break;
                                case 'property_type':
                                    if (!result.property_type) result.property_type = value;
                                    break;
                                case 'area_text':
                                    if (!result.area_text) result.area_text = value;
                                    break;
                                case 'description':
                                    if (!result.description) result.description = value;
                                    break;
                                case 'signature_date':
                                    if (!result.signature_date) result.signature_date = value;
                                    break;
                            }
                        }
                        // Direkt field property'leri (eski format)
                        else {
                            if (field.owner_name && !result.owner_name) {
                                result.owner_name = field.owner_name;
                            }
                            if (field.daily_register_no && !result.daily_register_no) {
                                result.daily_register_no = field.daily_register_no;
                            }
                            if (field.property_number && !result.property_number) {
                                result.property_number = field.property_number;
                            }
                            // ... diğer field'lar
                        }
                    });
                }
            });
        });

        // Tarih formatını düzelt (YYYY-MM-DD -> DD/MM/YYYY)
        if (result.signature_date && result.signature_date.includes('-')) {
            const dateParts = result.signature_date.split('-');
            if (dateParts.length === 3) {
                result.signature_date = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        }

        // Owner name yoksa 'Unknown' koy
        if (!result.owner_name) {
            result.owner_name = 'Unknown';
        }

        return result;
    },

    /**
     * OCR form verilerini mülk objesine dönüştürür
     * @param {Object} ocrForm 
     * @returns {Object}
     */
    formToProperty(ocrForm) {
        const parts = (ocrForm.property_number || '').split('/');
        return {
            id: Date.now(),
            ada: parts[0] || '---',
            parsel: parts[1] || '---',
            location: `${ocrForm.province || '---'} / ${ocrForm.district || '---'}`,
            directorate: ocrForm.directorate || '---',
            type: ocrForm.property_type || '---',
            area_text: ocrForm.area_text || '---',
            owner: ocrForm.owner_name || '---',
            owner_name: ocrForm.owner_name || '---',
            share_text: ocrForm.share_text || '---',
            signature_date: ocrForm.signature_date || '---',
            daily_register_no: ocrForm.daily_register_no || '---',
            transaction_type: ocrForm.transaction_type || '---',
            description: ocrForm.description || '---'
        };
    },

    /**
     * Boş OCR form objesi döndürür
     * @returns {Object}
     */
    getEmptyForm() {
        return {
            owner_name: '',
            signature_date: '',
            share_text: '',
            province: '',
            district: '',
            directorate: '',
            property_number: '',
            property_type: '',
            area_text: '',
            daily_register_no: '',
            transaction_type: '',
            description: ''
        };
    }
};

/**
 * OCR Hata sınıfı
 */
class OcrError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'OcrError';
        this.status = status;

        // Hata türünü belirle
        if (message.includes('POST requests') || message.includes('Method not allowed')) {
            this.type = 'METHOD_ERROR';
            this.userMessage = 'n8n Webhook node\'u "GET" modunda kalmış. Lütfen n8n\'de Method\'u "POST" yapın.';
        } else if (status === 404) {
            this.type = 'NOT_FOUND';
            this.userMessage = 'Webhook bulunamadı (404). n8n\'de "Listen for test event" butonuna bastınız mı?';
        } else if (message.includes('CORS') || message.includes('Failed to fetch')) {
            this.type = 'CORS_ERROR';
            this.userMessage = 'CORS hatası. Webhook\'a erişilemiyor.';
        } else {
            this.type = 'UNKNOWN';
            this.userMessage = `OCR işlemi başarısız: ${message}`;
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OcrManager, OcrError };
}

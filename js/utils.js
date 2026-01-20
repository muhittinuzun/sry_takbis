/**
 * Suriye TAKBIS - Yardımcı Fonksiyonlar
 * ======================================
 */

const Utils = {
    /**
     * İlk harfi büyük yapar
     * @param {string} str 
     * @returns {string}
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Tab ikonunu döndürür
     * @param {string} tab 
     * @returns {string}
     */
    getIcon(tab) {
        const icons = {
            dashboard: 'fa-map-location-dot',
            properties: 'fa-list-check',
            transfer: 'fa-handshake-simple',
            valuation: 'fa-calculator',
            expropriation: 'fa-gavel',
            logs: 'fa-shield-cat',
            ocr: 'fa-wand-magic-sparkles'
        };
        return 'fa-solid ' + (icons[tab] || 'fa-circle');
    },

    /**
     * Toast mesajı gösterir
     * @param {Object} toastRef - Vue ref objesi
     * @param {string} title 
     * @param {string} message 
     * @param {number} duration - ms cinsinden süre
     */
    showToast(toastRef, title, message, duration = 3000) {
        toastRef.value = { show: true, title, message };
        setTimeout(() => {
            toastRef.value.show = false;
        }, duration);
    },

    /**
     * Dil yönünü ayarlar
     * @param {string} lang 
     */
    setDirection(lang) {
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.body.setAttribute('dir', dir);
    },

    /**
     * Amenity stili döndürür
     * @param {string} shadow 
     * @returns {Object}
     */
    getAmenityStyle(shadow) {
        const colors = {
            emerald: { color: '#059669', bg: '#ecfdf5' },
            blue: { color: '#2563eb', bg: '#eff6ff' },
            red: { color: '#dc2626', bg: '#fef2f2' },
            amber: { color: '#d97706', bg: '#fffbeb' }
        };
        const c = colors[shadow] || colors.emerald;
        return {
            color: c.color,
            backgroundColor: c.bg
        };
    },

    /**
     * Dosyadan base64 string oluşturur
     * @param {File} file 
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Dosyayı DataURL olarak okur
     * @param {File} file 
     * @returns {Promise<string>}
     */
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Dosyayı ArrayBuffer olarak okur
     * @param {File} file 
     * @returns {Promise<ArrayBuffer>}
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Webhook URL'sini çözer
     * @param {string} mode - 'prod' veya 'test'
     * @returns {string}
     */
    resolveWebhookUrl(mode = 'prod') {
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        // Query param override
        try {
            const qp = new URLSearchParams(location.search);
            const override = qp.get('n8n');
            if (override) return override;
        } catch (_) {}

        let url = mode === 'test' ? CONFIG.N8N_WEBHOOK_URL_TEST : CONFIG.N8N_WEBHOOK_URL_PROD;

        // Localhost için proxy kullan
        if (isLocalhost) {
            url = url.replace(`https://${CONFIG.N8N_HOST}`, '/n8n-proxy');
        }

        return url;
    },

    /**
     * Derin obje araması yapar
     * @param {Object} obj 
     * @param {string} key 
     * @returns {any}
     */
    findDeep(obj, key) {
        if (!obj || typeof obj !== 'object') return null;
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];

        if (Array.isArray(obj)) {
            for (const item of obj) {
                const found = this.findDeep(item, key);
                if (found !== null) return found;
            }
        } else {
            // Önce bilinen dalları ara
            const priorityKeys = ['pages', 'sections', 'data'];
            for (const k of priorityKeys) {
                if (obj[k]) {
                    const found = this.findDeep(obj[k], key);
                    if (found !== null) return found;
                }
            }
            // Diğer dalları ara
            for (const k in obj) {
                if (!priorityKeys.includes(k)) {
                    const found = this.findDeep(obj[k], key);
                    if (found !== null) return found;
                }
            }
        }
        return null;
    },

    /**
     * Rastgele ID üretir
     * @param {number} length 
     * @returns {string}
     */
    generateId(length = 8) {
        return Math.random().toString(36).substring(2, 2 + length);
    },

    /**
     * Tarih formatlar
     * @param {Date|string} date 
     * @returns {string}
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('tr-TR');
    },

    /**
     * Para formatlar
     * @param {number} amount 
     * @returns {string}
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number') return '$0';
        return '$' + amount.toLocaleString('en-US');
    },

    /**
     * Debounce fonksiyonu
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Freeze Utils
Object.freeze(Utils);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

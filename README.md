# 🏛️ Suriye Tapu ve Kadastro Bilgi Sistemi (TAKBIS)

## 📋 Proje Hakkında

Bu proje, **Suriye için dijital bir Tapu Kadastro Bilgi Sistemi** web uygulamasıdır. Osmanlı/Arap döneminden kalma tarihi tapu belgelerini yapay zeka ile okuyarak modern dijital kayıtlara dönüştürmeyi hedefleyen kapsamlı bir e-devlet benzeri sistemdir.

### 🎯 Temel Özellikler

- ✅ İnteraktif CBS (GIS) harita sistemi
- ✅ KMZ/KML dosyası yükleme ve parsel görselleştirme
- ✅ AI destekli OCR ile tarihi tapu belgelerini dijitalleştirme
- ✅ Çok dilli destek (Türkçe, Arapça, İngilizce)
- ✅ RTL (sağdan sola) yazım desteği
- ✅ Resmi tapu senedi oluşturma ve yazdırma
- ✅ Mülk devir/satış işlemleri
- ✅ Gayrimenkul değer hesaplama
- ✅ Kamulaştırma sorgusu

---

## 🛠️ Teknoloji Yığını

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Vue.js** | 3.x | Frontend framework (Composition API) |
| **Tailwind CSS** | 3.x (CDN) | Styling ve responsive tasarım |
| **Leaflet.js** | 1.9.4 | İnteraktif harita ve CBS sistemi |
| **JSZip** | 3.10.1 | KMZ dosyalarını açma |
| **toGeoJSON** | 0.16.0 | KML → GeoJSON dönüşümü |
| **Font Awesome** | 6.4.0 | İkonlar |
| **Google Fonts** | - | Cairo, Inter, Amiri fontları |
| **n8n** | - | Workflow otomasyon (OCR backend) |
| **Google Cloud Vision API** | v1 | OCR (metin çıkarma) |
| **Google Gemini AI** | 2.5 Flash | Akıllı veri yapılandırma |
| **Node.js** | 18+ | Proxy sunucu |
| **Supabase** | 2.x | Veritabanı (entegre, aktif değil) |

---

## 📂 Dosya Yapısı

```
WebTapu_ydk/
├── index.html                    # Ana uygulama (Frontend - tek dosya)
├── server.js                     # Node.js proxy sunucusu
├── start_server.sh               # Sunucu başlatma scripti
├── n8n_ocr_tapu_okuma.json       # n8n workflow tanımı (import için)
├── 13.kmz                        # Örnek parsel verileri (Halep)
├── halep_kadastro_listesi.xlsx   # Excel kadastro listesi
├── temp_check.js                 # Geçici test dosyası
└── README.md                     # Bu dosya
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 18 veya üzeri
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- n8n instance (OCR özelliği için)

### Yerel Sunucuyu Başlatma

```bash
# 1. Proje dizinine git
cd WebTapu_ydk

# 2. Sunucuyu başlat
./start_server.sh
# veya doğrudan
node server.js

# 3. Tarayıcıda aç
open http://localhost:8000
```

### Sunucu Bilgileri

- **Local Server:** `http://localhost:8000/`
- **n8n Proxy:** `http://localhost:8000/n8n-proxy/`
- **Port:** 8000

---

## 🧩 Modüller ve Özellikler

### 1. Giriş Sistemi (Login)

- Kullanıcı adı/şifre ile giriş
- 3 dil seçeneği (TR, AR, EN)
- Suriye arması ve resmi görünüm
- Demo için herhangi bir kullanıcı adı/şifre ile giriş yapılabilir

### 2. CBS Paneli (Dashboard)

- **Leaflet.js** tabanlı uydu haritası
- KMZ/KML dosyası yükleme butonu
- Parsel arama (ada/parsel, koordinat, konum)
- Harita stili ayarları:
  - Çizgi rengi (6 renk seçeneği)
  - Çizgi kalınlığı (1-10px)
  - Dolgu şeffaflığı (0-100%)
- Parsel üzerine tıklayınca:
  - Tapu Senedi görüntüleme
  - AI Analizi başlatma

### 3. Akıllı Tapu (AI-OCR) ⭐

En önemli özellik - tarihi belgeleri dijitalleştirir:

**İş Akışı:**
```
Belge Yükleme → Google Vision OCR → Gemini AI → JSON → Form → Tapu Senedi
```

**Desteklenen Formatlar:** JPG, PNG, GIF, WebP, PDF

**Çıkarılan Veriler:**
- Malik Adı Soyadı
- Hisse oranı
- İşlem Tarihi
- Yevmiye No / İşlem Türü
- İl / Bölge
- İlçe / Semt
- Müdürlük / Daire
- Ada / Parsel No
- Nitelik / Cins
- Yüzölçümü
- Açıklama

**Görüntüleyici Özellikleri:**
- Yakınlaştırma/Uzaklaştırma (mouse wheel + butonlar)
- Kaydırma modu (el simgesi)
- Seçerek zoom modu (kare seçimi)
- Sıfırlama

### 4. Mülk Listesi (Properties)

- Tüm parsellerin tablo görünümü
- Toplam mülk sayısı
- Toplam değer hesaplama
- Her parsel için "Tapu" butonu

### 5. Tapu Devir/Satış (Transfer)

- Mülk seçimi (dropdown)
- Alıcı Kimlik No girişi
- Seçili mülk özeti (malik, alan, rayiç bedel)
- Başvuru butonu

### 6. Değer Hesaplama (Valuation)

- Bölge seçimi:
  - Damascus / Mezzeh
  - Damascus / Kafr Souseh
  - Aleppo / Shahba
- Alan (m²) girişi
- Otomatik değer hesaplama (alan × 2000 USD)

### 7. Kamulaştırma Sorgusu (Expropriation)

- Resmi kısıtlama ve kamulaştırma kararı sorgulama
- Şu an aktif kamulaştırma kaydı yok mesajı

---

## 🧠 n8n Workflow Kurulumu

### Workflow İçe Aktarma

1. n8n instance'ınıza giriş yapın
2. **Workflows** → **Import from File**
3. `n8n_ocr_tapu_okuma.json` dosyasını seçin
4. Workflow'u aktifleştirin

### Workflow Yapısı

```
Webhook (POST) 
    ↓
Google Vision OCR (TEXT_DETECTION + DOCUMENT_TEXT_DETECTION)
    ↓
Code: Prompt Hazırlama
    ↓
Gemini 2.5 Flash (JSON output)
    ↓
Code: JSON Parsing
    ↓
Respond to Webhook
```

### Gerekli Credentials

1. **Google Cloud Vision API Key:**
   - Google Cloud Console'da Vision API'yi etkinleştirin
   - API key oluşturun
   - Workflow'daki URL'de key parametresini güncelleyin

2. **Google Gemini API (PaLM):**
   - n8n'de "Google PaLM Api" credential oluşturun
   - Gemini API key'inizi ekleyin

### Webhook URL'leri

- **Production:** `https://n8n.ittyazilim.com/webhook/6a41b4a1-abcb-4610-85c8-8b2ac4cb680a`
- **Test:** `https://n8n.ittyazilim.com/webhook-test/6a41b4a1-abcb-4610-85c8-8b2ac4cb680a`

> **Not:** Test URL'si sadece n8n editöründe "Listen for test event" açıkken çalışır.

### CORS Ayarları

n8n Webhook node'unda şu header'lar otomatik eklenir (server.js proxy kullanılıyorsa):
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 📜 Tapu Senedi Şablonu

Oluşturulan tapu senedi şu bilgileri içerir:

**Başlık:**
- Suriye Cumhuriyeti Arması
- "SURIYE CUMHURIYETI" yazısı
- "Tapu ve Kadastro Müdürlüğü" alt başlığı
- "TAPU SENEDİ" ana başlık

**Taşınmaz Bilgileri:**
- İl/İlçe
- Müdürlük
- Ada/Parsel
- Nitelik
- Yüzölçümü

**Mülkiyet Bilgileri:**
- Malik Adı
- Hisse
- İşlem Detayı (Tür + Yevmiye)
- Tarih
- Elektronik Doğrulama Kodu

**Alt Kısım:**
- QR Kod (e-Devlet doğrulama)
- Resmi mühür
- Yetkili imza
- Yazdır butonu

---

## 🌐 Çok Dilli Destek

### Desteklenen Diller

| Kod | Dil | Yön |
|-----|-----|-----|
| tr | Türkçe | LTR |
| ar | Arapça | RTL |
| en | İngilizce | LTR |

### Dil Değiştirme

- Login ekranında sağ üst köşedeki dil butonları
- `setLang('tr')` / `setLang('ar')` / `setLang('en')` fonksiyonları

### Çeviri Anahtarları

Tüm çeviriler `translations` objesi içinde tanımlıdır:

```javascript
const translations = {
    tr: {
        loading: 'YUKLENIYOR...',
        navMap: 'Harita & CBS',
        navOcr: 'Akilli Tapu (AI)',
        // ... diğer anahtarlar
    },
    ar: { /* Arapça çeviriler */ },
    en: { /* İngilizce çeviriler */ }
};
```

---

## 🎨 UI/UX Özellikleri

### Renk Paleti

```css
/* Ana Renkler */
--emerald-600: #059669  /* Primary */
--slate-900: #0f172a    /* Dark Background */
--slate-50: #f8fafc     /* Light Background */
--red-600: #dc2626      /* Accent */
--gold-500: #D4AF37     /* Decorative */

/* Harita Varsayılan */
--stroke: #e11d48       /* Rose 600 */
```

### Fontlar

- **Cairo** - Arapça metin için
- **Inter** - Genel UI için
- **Amiri** - Tapu senedi (serif/resmi görünüm)

### Animasyonlar

- `animate-fade-in` - Sayfa geçişleri
- `animate-scan` - OCR tarama efekti
- `animate-spin` - Loading spinner
- `pulse-loader` - Yükleme göstergesi

---

## 🔧 Proxy Sunucu (server.js)

### Özellikler

- Statik dosya sunucu (index.html, vb.)
- n8n webhook proxy (CORS bypass)
- CORS headers otomatik ekleme

### Yapılandırma

```javascript
const PORT = 8000;
const N8N_HOST = 'n8n.ittyazilim.com';
```

### Endpoint'ler

| Path | Açıklama |
|------|----------|
| `/` | index.html |
| `/n8n-proxy/*` | n8n'e proxy |
| `/*.html, *.js, *.css, *.json, *.png, *.jpg, *.svg` | Statik dosyalar |

---

## 📊 Veri Yapıları

### Property (Mülk) Objesi

```javascript
{
    id: 1,
    ada: "101",
    parsel: "5",
    location: "Damascus / Mezzeh",
    type: "Arsa",
    owner: "Ahmet Yılmaz",
    owner_name: "Ahmet Yılmaz",
    area: 500,
    area_text: "500 m²",
    price: 250000,
    share_text: "Tamamı (1/1)",
    signature_date: "2024-01-15",
    daily_register_no: "2024/1234",
    transaction_type: "Satış",
    directorate: "Şam Tapu Müdürlüğü",
    description: "Açıklama metni",
    geometry: {
        type: "Polygon",
        coordinates: [[[lng, lat], ...]]
    }
}
```

### OCR Form Objesi

```javascript
{
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
}
```

### n8n OCR Şeması

```json
{
    "schema_id": "tapu_sy_form_v1",
    "document_type": "property_registry_form",
    "pages": [
        {
            "page_no": 1,
            "page_name": "Kayıt Tablosu (Sol Sayfa)",
            "sections": [
                {
                    "section_id": "p1_registry_table",
                    "title_tr": "Kayıt Tablosu",
                    "repeatable": true,
                    "fields": [
                        { "key": "row_sequence", "type": "integer" },
                        { "key": "daily_register_no", "type": "string" },
                        { "key": "transaction_date", "type": "date" },
                        { "key": "owner_name", "type": "string" },
                        { "key": "share_text", "type": "string" },
                        { "key": "transaction_type", "type": "string" }
                    ]
                }
            ]
        },
        {
            "page_no": 2,
            "page_name": "Taşınmaz Kimliği (Sağ Sayfa)",
            "sections": [
                {
                    "section_id": "p2_institution",
                    "fields": [
                        { "key": "province", "type": "string" },
                        { "key": "directorate", "type": "string" },
                        { "key": "office_or_circle", "type": "string" }
                    ]
                },
                {
                    "section_id": "p2_property_identity",
                    "fields": [
                        { "key": "district", "type": "string" },
                        { "key": "property_number", "type": "string" },
                        { "key": "property_type", "type": "string" },
                        { "key": "description", "type": "string" }
                    ]
                },
                {
                    "section_id": "p2_details",
                    "fields": [
                        { "key": "area_text", "type": "string" },
                        { "key": "signature_date", "type": "date" }
                    ]
                }
            ]
        }
    ]
}
```

---

## 🔑 API Anahtarları ve Credentials

> ⚠️ **Güvenlik Uyarısı:** Production'da bu anahtarları environment variable olarak saklayın!

### Google Cloud Vision API

```
API Key: AIzaSyBltZRduPsCwMxqTP1-AwQqBHvS2fHjHt4
Endpoint: https://vision.googleapis.com/v1/images:annotate
```

### n8n Gemini Credential

```
Credential ID: PaW494fBLuU3Mpnc
Credential Name: ITT gemini pro
Model: models/gemini-2.5-flash
```

---

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. CORS Hatası

**Sorun:** `Failed to fetch` veya CORS hatası

**Çözüm:** 
- Yerel geliştirmede `server.js` proxy'sini kullanın
- n8n'de webhook CORS ayarlarını kontrol edin

### 2. n8n 404 Hatası

**Sorun:** Webhook bulunamadı (404)

**Çözüm:**
- Test URL kullanıyorsanız n8n'de "Listen for test event" açık olmalı
- Production URL için workflow aktif olmalı

### 3. OCR Boş Dönüyor

**Sorun:** Veri çıkarılamıyor

**Çözüm:**
- Görsel kalitesini kontrol edin
- Desteklenen format olduğundan emin olun
- n8n workflow loglarını inceleyin

### 4. Harita Yüklenmiyor

**Sorun:** Leaflet haritası boş görünüyor

**Çözüm:**
- İnternet bağlantısını kontrol edin (Esri tile server)
- Browser console'da hata mesajlarını inceleyin

---

## 📈 Gelecek Geliştirmeler

- [ ] Supabase veritabanı entegrasyonu
- [ ] Gerçek kullanıcı kimlik doğrulama
- [ ] PDF export özelliği
- [ ] Toplu belge işleme
- [ ] Mobil uygulama (PWA)
- [ ] Offline çalışma desteği
- [ ] Parsel düzenleme araçları
- [ ] Çoklu kullanıcı rolleri (Vatandaş, Memur, Emlakçı)

---

## 👥 Katkıda Bulunanlar

- **Geliştirici:** ITT Yazılım
- **n8n Instance:** n8n.ittyazilim.com

---

## 📄 Lisans

Bu proje özel kullanım içindir. Tüm hakları saklıdır.

---

## 📞 İletişim

Sorularınız için: [n8n.ittyazilim.com](https://n8n.ittyazilim.com)

---

*Son Güncelleme: Ocak 2026*

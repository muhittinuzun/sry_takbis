/**
 * Suriye TAKBIS - Yapılandırma Dosyası
 * =====================================
 */

const CONFIG = {
    // Uygulama Bilgileri
    APP_NAME: 'Suriye TAKBIS',
    APP_VERSION: '1.0.0',
    
    // Sunucu Ayarları
    SERVER_PORT: 8000,
    
    // n8n Webhook URL'leri
    N8N_HOST: 'n8n.ittyazilim.com',
    N8N_WEBHOOK_ID: '6a41b4a1-abcb-4610-85c8-8b2ac4cb680a',
    
    get N8N_WEBHOOK_URL_PROD() {
        return `https://${this.N8N_HOST}/webhook/${this.N8N_WEBHOOK_ID}`;
    },
    
    get N8N_WEBHOOK_URL_TEST() {
        return `https://${this.N8N_HOST}/webhook-test/${this.N8N_WEBHOOK_ID}`;
    },
    
    // Harita Ayarları
    MAP: {
        DEFAULT_CENTER: [33.5138, 36.29], // Şam koordinatları
        DEFAULT_ZOOM: 14,
        TILE_URL: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        TILE_ATTRIBUTION: 'Tiles &copy; Esri'
    },
    
    // Varsayılan Harita Stili
    DEFAULT_MAP_STYLE: {
        color: '#e11d48',      // Rose 600
        weight: 2,
        fillOpacity: 0.2
    },
    
    // Renk Seçenekleri
    COLOR_OPTIONS: [
        '#e11d48', // Rose
        '#2563eb', // Blue
        '#16a34a', // Green
        '#d97706', // Amber
        '#7c3aed', // Violet
        '#000000'  // Black
    ],
    
    // Bölgeler (Valuation için)
    REGIONS: [
        { value: 'mezzeh', label: 'Damascus / Mezzeh' },
        { value: 'kafr-souseh', label: 'Damascus / Kafr Souseh' },
        { value: 'shahba', label: 'Aleppo / Shahba' }
    ],
    
    // Varsayılan Dosyalar
    DEFAULT_KMZ_FILE: '13.kmz',
    
    // Toast Süresi (ms)
    TOAST_DURATION: 3000,
    
    // AI Analiz Verileri (Demo)
    AI_TREND_DATA: [40, 45, 42, 55, 65, 60, 75, 80, 78, 85, 95, 100],
    
    AI_AMENITIES: [
        { icon: 'fa-mosque', label: 'Cami', dist: '150m', shadow: 'emerald' },
        { icon: 'fa-school', label: 'Okul / Egitim', dist: '400m', shadow: 'blue' },
        { icon: 'fa-hospital', label: 'Hastane', dist: '1.2km', shadow: 'red' },
        { icon: 'fa-bus', label: 'Toplu Tasima', dist: '300m', shadow: 'amber' }
    ]
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.MAP);
Object.freeze(CONFIG.DEFAULT_MAP_STYLE);

// Export for ES modules (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

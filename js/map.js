/**
 * Suriye TAKBIS - Harita İşlemleri
 * =================================
 */

const MapManager = {
    map: null,
    ocrMap: null,
    geoJsonLayer: null,
    ocrGeoJsonLayer: null,

    /**
     * Ana haritayı başlatır
     * @param {string} containerId - Harita container ID'si
     * @param {Object} options - Leaflet map options
     * @returns {L.Map}
     */
    initMap(containerId = 'map', options = {}) {
        if (this.map) return this.map;

        const defaultOptions = {
            center: CONFIG.MAP.DEFAULT_CENTER,
            zoom: CONFIG.MAP.DEFAULT_ZOOM,
            zoomControl: false
        };

        const satelliteLayer = L.tileLayer(CONFIG.MAP.TILE_URL, {
            attribution: CONFIG.MAP.TILE_ATTRIBUTION
        });

        this.map = L.map(containerId, {
            ...defaultOptions,
            ...options,
            layers: [satelliteLayer]
        });

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        return this.map;
    },

    /**
     * OCR haritasını başlatır
     * @param {string} containerId 
     * @returns {L.Map}
     */
    initOcrMap(containerId = 'ocr-map-picker') {
        // Mevcut varsa temizle
        if (this.ocrMap) {
            this.ocrMap.remove();
            this.ocrMap = null;
        }

        const satelliteLayer = L.tileLayer(CONFIG.MAP.TILE_URL, {
            attribution: CONFIG.MAP.TILE_ATTRIBUTION
        });

        this.ocrMap = L.map(containerId, {
            center: CONFIG.MAP.DEFAULT_CENTER,
            zoom: CONFIG.MAP.DEFAULT_ZOOM,
            layers: [satelliteLayer],
            renderer: L.canvas(),
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(this.ocrMap);

        return this.ocrMap;
    },

    /**
     * GeoJSON verilerini haritaya ekler
     * @param {Array} properties - Mülk listesi
     * @param {Object} style - Harita stili
     * @param {Function} onFeatureClick - Tıklama callback'i
     */
    renderGeoJSON(properties, style, onFeatureClick, translations = {}, translateFn = (k, v) => v) {
        if (!this.map) return;

        // Mevcut layer'ı kaldır
        if (this.geoJsonLayer) {
            this.map.removeLayer(this.geoJsonLayer);
        }

        const featureCollection = {
            type: "FeatureCollection",
            features: properties.map(p => ({
                type: "Feature",
                properties: { id: p.id, ...p },
                geometry: p.geometry
            }))
        };

        this.geoJsonLayer = L.geoJSON(featureCollection, {
            style: (feature) => ({
                color: style.color,
                weight: style.weight,
                fillOpacity: style.fillOpacity,
                fillColor: style.color,
                interactive: true
            }),
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                const isArabic = translations.loading === 'جari التحميل...' || translations.loading === 'جاري التحميل...';
                const parselNo = props.ada && props.parsel ? `${props.ada}/${props.parsel}` : '---';

                // Malik ismi yerelleştirmesi
                let owner = props.owner_name || props.owner;
                if (isArabic && props.owner_name_ar) {
                    owner = props.owner_name_ar;
                }

                if (!owner) {
                    owner = isArabic ? 'مالك مجهول' : (translations.loading === 'LOADING...' ? 'Unknown Owner' : 'Mechul Malik');
                }

                const area = props.area_text || (props.area ? `${props.area} m²` : '---');

                // Popup içeriği (Profesyonel Veri Ekranı)
                const popupContent = `
                    <div class="parcel-popup-content" style="min-width: 280px; font-family: 'Cairo', sans-serif; direction: ${isArabic ? 'rtl' : 'ltr'}; text-align: ${isArabic ? 'right' : 'left'};">
                        <div style="background: #1e293b; color: white; padding: 12px; padding-right: 32px; border-radius: 12px 12px 0 0; margin: -14px -14px 10px -14px; position: relative; overflow: hidden;">
                            <div style="position: absolute; top: 0; ${isArabic ? 'left' : 'right'}: 0; width: 60px; height: 60px; background: rgba(5, 150, 105, 0.2); border-radius: 0 0 0 60px;"></div>
                            <strong style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                <span>📍</span>
                                <span>${translations.lblParcel || 'Parsel'} #${parselNo}</span>
                            </strong>
                            <span style="font-size: 10px; color: #94a3b8; font-weight: bold; display: block; margin-top: 4px;">${translateFn('directorates', props.directorate) || (isArabic ? 'مديرية السجل العقاري بحلب' : 'Aleppo Land Registry')}</span>
                        </div>
                        
                        <div style="padding: 5px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <div style="width: 32px; height: 32px; background: #ecfdf5; color: #059669; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <span style="color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; display: block;">${translations.lblOwner || 'Malik'}:</span>
                                    <strong style="color: #1e293b; font-size: 13px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${owner}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- 3 Butonlu Aksiyon Alanı -->
                        <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 10px;">
                            <button onclick="window.dispatchParcelAction('${props.id}', 'ai')" 
                                style="width: 100%; background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                                <i class="fa-solid fa-microchip"></i> <span>${translations.btnAiAnalysis || 'Yapay Zeka Analizi'}</span>
                            </button>
                            <button onclick="window.dispatchParcelAction('${props.id}', 'deed')" 
                                style="width: 100%; background: #fdf2f8; color: #db2777; border: 1px solid #fce7f3; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                                <i class="fa-solid fa-file-invoice"></i> <span>${translations.btnDeedImage || 'Tapu Görseli'}</span>
                            </button>
                            <button onclick="window.dispatchParcelAction('${props.id}', 'info')" 
                                style="width: 100%; background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                                <i class="fa-solid fa-circle-info"></i> <span>${translations.btnInfoDetails || 'Bilgi Ekranı'}</span>
                            </button>
                        </div>
                    </div>
                `;

                layer.bindPopup(popupContent, {
                    maxWidth: 250,
                    className: 'parcel-popup'
                });

                layer.on({
                    click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        // Tıklamada sadece popup açılsın, butonlar aksiyon alsın
                        layer.openPopup();
                    },
                    mouseover: (e) => {
                        e.target.setStyle({
                            weight: style.weight + 2,
                            fillOpacity: Math.min(style.fillOpacity + 0.2, 1)
                        });
                    },
                    mouseout: (e) => {
                        this.geoJsonLayer.resetStyle(e.target);
                    }
                });
            }
        }).addTo(this.map);

        // Bounds'a fit et
        try {
            const bounds = this.geoJsonLayer.getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds);
            }
        } catch (e) {
            console.warn('Bounds fit edilemedi:', e);
        }
    },

    /**
     * OCR haritasına GeoJSON ekler
     * @param {Array} properties 
     * @param {Function} onFeatureClick 
     */
    renderOcrGeoJSON(properties, onFeatureClick) {
        if (!this.ocrMap) return;

        const featureCollection = {
            type: "FeatureCollection",
            features: properties.map(p => ({
                type: "Feature",
                properties: { id: p.id, ...p },
                geometry: p.geometry
            }))
        };

        const layer = L.geoJSON(featureCollection, {
            style: { color: '#3b82f6', weight: 2, fillOpacity: 0.1 },
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (onFeatureClick) {
                        onFeatureClick(feature.properties);
                    }
                });
            }
        }).addTo(this.ocrMap);

        // Bounds'a fit et
        try {
            this.ocrMap.fitBounds(layer.getBounds());
        } catch (e) { }
    },

    /**
     * Haritayı yeniden boyutlandırır
     */
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    },

    /**
     * Belirli bir noktaya zoom yapar
     * @param {Array} coords - [lat, lng]
     * @param {number} zoom 
     */
    flyTo(coords, zoom = 16) {
        if (this.map && coords) {
            this.map.flyTo(coords, zoom);
        }
    },

    /**
     * Haritayı temizler
     */
    clearLayers() {
        if (this.geoJsonLayer && this.map) {
            this.map.removeLayer(this.geoJsonLayer);
            this.geoJsonLayer = null;
        }
    },

    /**
     * Popup gösterir
     * @param {Array} coords 
     * @param {string} content 
     */
    showPopup(coords, content) {
        if (this.map) {
            L.popup()
                .setLatLng(coords)
                .setContent(content)
                .openOn(this.map);
        }
    },

    /**
     * Belirli bir parseli vurgular ve popup'ını açar
     * @param {string|number} id 
     */
    highlightParcel(id) {
        if (!this.geoJsonLayer || !this.map) return;

        let foundLayer = null;
        this.geoJsonLayer.eachLayer(layer => {
            // Reset style for all
            this.geoJsonLayer.resetStyle(layer);

            if (layer.feature.properties.id == id) {
                foundLayer = layer;
            }
        });

        if (foundLayer) {
            // Vurgula (Örn: Altın sarısı)
            foundLayer.setStyle({
                color: '#facc15', // Yellow 400
                weight: 5,
                fillOpacity: 0.6,
                fillColor: '#fef08a' // Yellow 200
            });
            foundLayer.bringToFront();

            // Popup'ı aç
            foundLayer.openPopup();

            // Merkeze al
            const bounds = foundLayer.getBounds();
            this.map.flyToBounds(bounds, { maxZoom: 18, duration: 1.5 });
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
}

/**
 * Suriye TAKBIS - KMZ/KML Dosya İşlemleri
 * ========================================
 */

const KmzManager = {
    /**
     * KMZ veya KML dosyasını işler
     * @param {ArrayBuffer} arrayBuffer - Dosya içeriği
     * @param {boolean} isKmz - KMZ mi KML mi
     * @returns {Promise<Object>} - { properties, geoJson }
     */
    async processFile(arrayBuffer, isKmz) {
        let kmlText;

        if (isKmz) {
            // KMZ dosyasını aç
            const zip = await JSZip.loadAsync(arrayBuffer);
            const kmlFile = Object.keys(zip.files).find(f => f.endsWith('.kml'));

            if (!kmlFile) {
                throw new Error('KMZ içinde KML dosyası bulunamadı.');
            }

            kmlText = await zip.files[kmlFile].async('string');
        } else {
            // Direkt KML metni
            kmlText = new TextDecoder().decode(arrayBuffer);
        }

        // KML'i DOM olarak parse et
        const kmlDom = new DOMParser().parseFromString(kmlText, 'text/xml');

        // Namespace kontrolü
        const hasNamespace = kmlDom.documentElement.namespaceURI || kmlText.includes('xmlns');
        const nsPrefix = hasNamespace ? 'kml:' : '';
        const nsURI = 'http://www.opengis.net/kml/2.2';

        console.log(`KML namespace: ${hasNamespace ? 'yes' : 'no'}, URI: ${nsURI}`);

        // GeoJSON'a dönüştür
        let geoJson;
        try {
            geoJson = toGeoJSON.kml(kmlDom);
            console.log(`GeoJSON features: ${geoJson.features?.length || 0}`);
        } catch (error) {
            console.error('toGeoJSON error:', error);
            // Fallback: Manuel parse
            geoJson = { features: [] };
        }

        // Eğer features boşsa, manuel olarak parse et
        if (!geoJson.features || geoJson.features.length === 0) {
            console.warn('toGeoJSON returned no features, trying manual parse...');
            geoJson = this.manualKmlParse(kmlDom, nsURI, hasNamespace);
            console.log(`Manual parse features: ${geoJson.features?.length || 0}`);
        }

        // Point'leri filtrele (sadece polygon ve line'lar)
        const filteredFeatures = geoJson.features.filter(f =>
            f.geometry && (
                f.geometry.type === 'Polygon' ||
                f.geometry.type === 'MultiPolygon' ||
                f.geometry.type === 'LineString' ||
                f.geometry.type === 'MultiLineString'
            )
        );

        console.log(`Filtered features: ${filteredFeatures.length}`);

        // KML DOM'dan ExtendedData ve description'ları çıkar
        // Namespace'li veya namespace'siz Placemark'ları bul
        let placemarks;

        // Önce namespace ile dene
        if (hasNamespace) {
            placemarks = kmlDom.getElementsByTagNameNS(nsURI, 'Placemark');
        }

        // Eğer bulunamadıysa, tüm elementleri iterate et
        if (!placemarks || placemarks.length === 0) {
            const allElements = kmlDom.getElementsByTagName('*');
            placemarks = Array.from(allElements).filter(el => {
                // Local name kontrolü (namespace prefix olmadan)
                const localName = el.localName || el.tagName.split(':').pop();
                return localName === 'Placemark';
            });
        }

        // Hala bulunamadıysa normal selector dene
        if (!placemarks || placemarks.length === 0) {
            placemarks = kmlDom.querySelectorAll('Placemark');
        }

        console.log(`Placemarks found: ${placemarks.length}`);
        const placemarkData = Array.from(placemarks).map((pm, idx) => {
            const data = {};

            // Name (parsel numarası) - namespace'li veya namespace'siz
            let nameElem = null;
            if (hasNamespace) {
                nameElem = pm.getElementsByTagNameNS(nsURI, 'name')[0];
            }
            if (!nameElem) {
                // Tüm child elementleri kontrol et
                const children = pm.getElementsByTagName('*');
                for (let child of children) {
                    const localName = child.localName || child.tagName.split(':').pop();
                    if (localName === 'name') {
                        nameElem = child;
                        break;
                    }
                }
            }
            if (!nameElem) {
                nameElem = pm.querySelector('name');
            }
            if (nameElem) {
                const parselNo = nameElem.textContent.trim();
                const parts = parselNo.split('/');
                data.parcel_no = parselNo;
                data.ada = parts[0] || '---';
                data.parsel = parts[1] || '---';
            }

            // ExtendedData - namespace'li veya namespace'siz
            let extendedData = null;
            if (hasNamespace) {
                extendedData = pm.getElementsByTagNameNS(nsURI, 'ExtendedData')[0];
            }
            if (!extendedData) {
                // Tüm child elementleri kontrol et
                const children = pm.getElementsByTagName('*');
                for (let child of children) {
                    const localName = child.localName || child.tagName.split(':').pop();
                    if (localName === 'ExtendedData') {
                        extendedData = child;
                        break;
                    }
                }
            }
            if (!extendedData) {
                extendedData = pm.querySelector('ExtendedData');
            }

            if (extendedData) {
                let dataElems = [];
                if (hasNamespace) {
                    dataElems = extendedData.getElementsByTagNameNS(nsURI, 'Data');
                }
                if (dataElems.length === 0) {
                    // Tüm child elementleri kontrol et
                    const children = extendedData.getElementsByTagName('*');
                    dataElems = Array.from(children).filter(el => {
                        const localName = el.localName || el.tagName.split(':').pop();
                        return localName === 'Data';
                    });
                }
                if (dataElems.length === 0) {
                    dataElems = extendedData.querySelectorAll('Data');
                }

                dataElems.forEach(de => {
                    const name = de.getAttribute('name');
                    let valueElem = null;
                    if (hasNamespace) {
                        valueElem = de.getElementsByTagNameNS(nsURI, 'value')[0];
                    }
                    if (!valueElem) {
                        const children = de.getElementsByTagName('*');
                        for (let child of children) {
                            const localName = child.localName || child.tagName.split(':').pop();
                            if (localName === 'value') {
                                valueElem = child;
                                break;
                            }
                        }
                    }
                    if (!valueElem) {
                        valueElem = de.querySelector('value');
                    }
                    const value = valueElem?.textContent || '';
                    if (name) data[name] = value;
                });
            }

            // Description'dan HTML parse et (fallback)
            let descElem = null;
            if (hasNamespace) {
                descElem = pm.getElementsByTagNameNS(nsURI, 'description')[0];
            }
            if (!descElem) {
                // Tüm child elementleri kontrol et
                const children = pm.getElementsByTagName('*');
                for (let child of children) {
                    const localName = child.localName || child.tagName.split(':').pop();
                    if (localName === 'description') {
                        descElem = child;
                        break;
                    }
                }
            }
            if (!descElem) {
                descElem = pm.querySelector('description');
            }
            if (descElem && descElem.textContent) {
                const descHtml = descElem.textContent;
                // Regex ile bilgileri çıkar
                const ownerMatch = descHtml.match(/Malik \(TR\):.*?<td[^>]*>([^<]+)<\/td>/s);
                const ownerArMatch = descHtml.match(/Malik \(AR\):.*?<td[^>]*>([^<]+)<\/td>/s);
                const areaMatch = descHtml.match(/Yüzölçümü:.*?<td[^>]*>([^<]+)<\/td>/s);
                const priceMatch = descHtml.match(/\$([\d,]+)/);
                const yevmiyeMatch = descHtml.match(/Yevmiye No:.*?<td[^>]*>([^<]+)<\/td>/s);
                const dateMatch = descHtml.match(/Tescil Tarihi:.*?<td[^>]*>([^<]+)<\/td>/s);

                if (ownerMatch && !data.owner_name) data.owner_name = ownerMatch[1].trim();
                if (ownerArMatch && !data.owner_name_ar) data.owner_name_ar = ownerArMatch[1].trim();
                if (areaMatch && !data.area) {
                    const areaText = areaMatch[1].trim();
                    data.area_text = areaText;
                    data.area = parseFloat(areaText.replace(/[^\d.]/g, '')) || 0;
                }
                if (priceMatch && !data.price) {
                    data.price = parseInt(priceMatch[1].replace(/,/g, '')) || 0;
                }
                if (yevmiyeMatch && !data.daily_register_no) data.daily_register_no = yevmiyeMatch[1].trim();
                if (dateMatch && !data.registration_date) data.signature_date = dateMatch[1].trim();
            }

            return data;
        });

        // Properties'e dönüştür
        const properties = filteredFeatures.map((f, index) => {
            const p = f.properties || {};
            const pmData = placemarkData[index] || {};

            // Parsel numarasını parse et
            let ada = pmData.ada || p.ada || p.PARSEL_NO?.split('/')[0];
            let parsel = pmData.parsel || p.parsel || p.PARSEL_NO?.split('/')[1];

            // Eğer name'den parse edilemediyse, parcel_no'dan dene
            if ((!ada || ada === '---') && pmData.parcel_no) {
                const parts = pmData.parcel_no.split('/');
                ada = parts[0] || '---';
                parsel = parts[1] || '---';
            }

            // Alan bilgisini parse et
            let area = pmData.area || p.area || p.ALAN;
            if (typeof area === 'string') {
                area = parseFloat(area.replace(/[^\d.]/g, '')) || 0;
            }
            // area_text varsa kullan, yoksa area'dan oluştur
            let areaText = pmData.area_text;
            if (!areaText && area) {
                areaText = `${area} m²`;
            } else if (!areaText) {
                areaText = '---';
            }

            return {
                id: p.id || index + 1,
                ada: ada || '---',
                parsel: parsel || '---',
                location: pmData.district || p.location || p.MAHALLE || 'Halep / Merkez',
                type: pmData.property_type || p.type || p.CINSI || 'Arsa',
                price: pmData.price ? parseInt(pmData.price) : (p.price || Math.floor(Math.random() * 500000) + 100000),
                owner: pmData.owner_name || p.owner || p.AD_SOYAD || 'Mechul Malik',
                owner_name: pmData.owner_name || p.owner || p.AD_SOYAD || 'Mechul Malik',
                owner_name_ar: pmData.owner_name_ar || '',
                area: area || 0,
                area_text: areaText,
                province: pmData.province || 'Halep',
                district: pmData.district || '',
                directorate: pmData.directorate || 'Halep Kadastro Müdürlüğü',
                street: pmData.street || '',
                full_address: pmData.full_address || '',
                registration_date: pmData.registration_date || pmData.signature_date || '',
                signature_date: pmData.signature_date || pmData.registration_date || '',
                daily_register_no: pmData.daily_register_no || '',
                share_text: pmData.share_text || 'Tamamı (1/1)',
                transaction_type: pmData.transaction_type || 'Kayıt',
                geometry: f.geometry
            };
        });

        return {
            properties,
            geoJson: {
                type: "FeatureCollection",
                features: filteredFeatures
            },
            count: properties.length
        };
    },

    /**
     * Dosya yükleme olayını işler
     * @param {Event} event - Input change event
     * @returns {Promise<Object>}
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return null;

        const isKmz = file.name.toLowerCase().endsWith('.kmz');
        const isKml = file.name.toLowerCase().endsWith('.kml');
        const isGeoJson = file.name.toLowerCase().endsWith('.json') ||
            file.name.toLowerCase().endsWith('.geojson');

        if (!isKmz && !isKml && !isGeoJson) {
            throw new Error('Desteklenmeyen dosya formatı. KMZ, KML veya GeoJSON kullanın.');
        }

        const arrayBuffer = await Utils.fileToArrayBuffer(file);

        if (isGeoJson) {
            // GeoJSON dosyası
            const text = new TextDecoder().decode(arrayBuffer);
            const geoJson = JSON.parse(text);
            return this.processGeoJson(geoJson);
        }

        return this.processFile(arrayBuffer, isKmz);
    },

    /**
     * GeoJSON dosyasını işler
     * @param {Object} geoJson 
     * @returns {Object}
     */
    processGeoJson(geoJson) {
        const features = geoJson.features || [];

        const filteredFeatures = features.filter(f =>
            f.geometry && (
                f.geometry.type === 'Polygon' ||
                f.geometry.type === 'MultiPolygon'
            )
        );

        const properties = filteredFeatures.map((f, index) => {
            const p = f.properties || {};
            return {
                id: p.id || index + 1,
                ada: p.ada || '---',
                parsel: p.parsel || '---',
                location: p.location || 'Sam / Merkez',
                type: p.type || 'Arsa',
                price: p.price || Math.floor(Math.random() * 500000) + 100000,
                owner: p.owner || 'Mechul Malik',
                area: p.area || '---',
                geometry: f.geometry
            };
        });

        return {
            properties,
            geoJson: {
                type: "FeatureCollection",
                features: filteredFeatures
            },
            count: properties.length
        };
    },

    /**
     * URL'den otomatik KMZ yükler
     * @param {string} filename 
     * @returns {Promise<Object>}
     */
    async autoLoadKMZ(filename) {
        console.log(`Otomatik yükleme başlatıldı: ${filename}`);

        try {
            const response = await fetch(filename);
            if (!response.ok) {
                console.error(`KMZ yükleme hatası: ${response.status} ${response.statusText}`);
                throw new Error(`Dosya sunucuda bulunamadı: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            console.log(`KMZ dosyası yüklendi: ${buffer.byteLength} bytes`);
            const result = await this.processFile(buffer, true);
            console.log(`KMZ işlendi: ${result.count} parsel bulundu`);
            return result;
        } catch (error) {
            console.error('autoLoadKMZ hatası:', error);
            throw error;
        }
    },

    /**
     * Manuel KML parse (toGeoJSON başarısız olduğunda)
     * @param {Document} kmlDom 
     * @param {string} nsURI 
     * @param {boolean} hasNamespace 
     * @returns {Object}
     */
    manualKmlParse(kmlDom, nsURI, hasNamespace) {
        const features = [];
        let placemarks;

        if (hasNamespace) {
            placemarks = kmlDom.getElementsByTagNameNS(nsURI, 'Placemark');
        } else {
            placemarks = kmlDom.getElementsByTagName('Placemark');
        }

        Array.from(placemarks).forEach((pm, idx) => {
            // Polygon'u bul
            let polygon = null;
            if (hasNamespace) {
                polygon = pm.getElementsByTagNameNS(nsURI, 'Polygon')[0];
            } else {
                polygon = pm.getElementsByTagName('Polygon')[0];
            }

            if (!polygon) return;

            // Coordinates'ı bul
            let coordsElem = null;
            if (hasNamespace) {
                coordsElem = polygon.getElementsByTagNameNS(nsURI, 'coordinates')[0];
            } else {
                coordsElem = polygon.getElementsByTagName('coordinates')[0];
            }

            if (!coordsElem) return;

            const coordsText = coordsElem.textContent.trim();
            const coords = coordsText.split(/\s+/).filter(c => c.trim()).map(c => {
                const parts = c.split(',');
                if (parts.length >= 2) {
                    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2] || 0)];
                }
                return null;
            }).filter(c => c !== null);

            if (coords.length < 3) return;

            // Polygon'u kapat (ilk nokta = son nokta)
            if (coords[0][0] !== coords[coords.length - 1][0] ||
                coords[0][1] !== coords[coords.length - 1][1]) {
                coords.push(coords[0]);
            }

            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coords]
                },
                properties: {}
            });
        });

        return {
            type: 'FeatureCollection',
            features: features
        };
    },

    /**
     * Mock parsel verileri üretir
     * @param {number} count - Parsel sayısı
     * @param {Array} center - [lat, lng]
     * @param {string} regionName - Bölge adı
     * @returns {Array}
     */
    generateMockParcels(count = 50, center = [33.5138, 36.2900], regionName = 'Damascus / Mezzeh') {
        const [centerLat, centerLng] = center;
        const properties = [];
        // Test için semt ve mahalle listeleri
        const neighborhoods = ['Mezzeh', 'Abu Rummaneh', 'Kفر Souseh', 'Baramkeh'];
        const streets = ['Al-Jalaa St', 'Fayez Mansour St', 'Baghdad St', 'Saadallah al-Jabiri St'];

        for (let i = 0; i < count; i++) {
            const lat = centerLat + (Math.random() - 0.5) * 0.02;
            const lng = centerLng + (Math.random() - 0.5) * 0.03;
            const size = 0.0005;

            const neighborhood = neighborhoods[i % neighborhoods.length];
            const street = streets[i % streets.length];

            properties.push({
                id: 1000 + i,
                ada: 100 + (i % 5),
                parsel: i + 1,
                location: regionName,
                neighborhood: neighborhood,
                street: street,
                type: (i % 5 === 0) ? 'Commercial' : (i % 3 === 0) ? 'Industrial' : 'Residential',
                owner: 'MOCK OWNER ' + (i + 1),
                area: 100 + Math.floor(Math.random() * 900),
                price: Math.floor(Math.random() * 800000) + 100000,
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [lng - size, lat - size],
                        [lng + size, lat - size],
                        [lng + size, lat + size],
                        [lng - size, lat + size],
                        [lng - size, lat - size]
                    ]]
                }
            });
        }

        return properties;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KmzManager;
}

/**
 * Suriye TAKBIS - Ana Vue Uygulaması
 * ====================================
 */

const { createApp, ref, computed, onMounted, nextTick, watch } = Vue;

createApp({
    setup() {
        // ==================== STATE ====================

        // Genel
        const loading = ref(false);
        const loadingMsg = ref('');
        const lang = ref('tr');
        const toast = ref({ show: false, title: '', message: '' });

        // Auth
        const isLoggedIn = ref(false);
        const loginCreds = ref({ username: '', password: '' });
        const loginProcessing = ref(false);
        const loginRole = ref('citizen');
        const auditLogs = ref([]);

        // UI
        const isMobileMenuOpen = ref(false);
        const currentTab = ref('dashboard');
        const showMapSettings = ref(false);

        // Harita
        const searchQuery = ref('');
        const mapStyle = ref({ ...CONFIG.DEFAULT_MAP_STYLE });
        const kmzLoading = ref(false);

        // Mülkler
        const properties = ref([]);
        const selectedPropertyId = ref(null);
        const buyerName = ref('');
        const activeRegionName = ref('Damascus / Mezzeh');
        const transferStep = ref(1);
        const simProgress = ref(0);
        const simulating = ref(false);

        // Kamulaştırma State
        const exproSelectedId = ref('');
        const exproQuerying = ref(false);
        const exproProgress = ref(0);
        const exproResult = ref(null);

        // Gelişmiş Filtreler
        const filters = ref({
            city: '',
            neighborhood: '',
            street: '',
            parcel: ''
        });

        // OCR
        const ocrImage = ref(null);
        const ocrScanning = ref(false);
        const ocrData = ref(null);
        const ocrForm = ref(OcrManager.getEmptyForm());
        const ocrWebhookMode = ref('prod');
        const ocrInput = ref(null);

        // Viewer State
        const viewerScale = ref(1);
        const viewerPanX = ref(0);
        const viewerPanY = ref(0);
        const viewerMode = ref('pan');
        const isPanning = ref(false);
        const isSelecting = ref(false);
        const selectionStart = ref({ x: 0, y: 0 });
        const selectionRect = ref({ top: 0, left: 0, width: 0, height: 0 });
        const viewerContainer = ref(null);

        // Modal parsel seçimi
        const tempSelectedParcel = ref(null);

        // Modals
        const modals = ref({
            deed: false,
            ocrPicker: false,
            activeProp: null,
            propInfo: false,
            ocrMap: false,
            parcelAction: false,
            aiAnalysis: false
        });

        // Valuation
        const valRegion = ref('mezzeh');
        const valArea = ref(150);

        // AI Demo Data
        const aiTrendData = ref(CONFIG.AI_TREND_DATA);
        const aiAmenities = ref(CONFIG.AI_AMENITIES);

        // ==================== COMPUTED ====================

        const t = computed(() => TRANSLATIONS[lang.value] || TRANSLATIONS.tr);

        const selectedProperty = computed(() =>
            properties.value.find(p => p.id === selectedPropertyId.value)
        );

        const totalValue = computed(() => {
            const sum = properties.value.reduce((acc, p) => acc + (p.price || 0), 0);
            return '$' + (sum / 1000000).toFixed(1) + 'M';
        });

        const filteredProperties = computed(() => {
            let list = properties.value;

            // Hızlı Arama
            if (searchQuery.value) {
                const q = searchQuery.value.toLowerCase().trim();
                list = list.filter(p => {
                    const adaParsel = `${p.ada}/${p.parsel}`;
                    return (
                        p.ada?.toString().includes(q) ||
                        p.parsel?.toString().includes(q) ||
                        adaParsel.includes(q) ||
                        p.owner?.toLowerCase().includes(q) ||
                        p.location?.toLowerCase().includes(q)
                    );
                });
            }

            // Gelişmiş Filtreler
            if (filters.value.city) {
                list = list.filter(p => p.location === filters.value.city);
            }
            if (filters.value.neighborhood) {
                list = list.filter(p => p.neighborhood === filters.value.neighborhood);
            }
            if (filters.value.street) {
                list = list.filter(p => p.street === filters.value.street);
            }
            if (filters.value.parcel) {
                const q = filters.value.parcel.toLowerCase().trim();
                list = list.filter(p => {
                    const adaParsel = `${p.ada}/${p.parsel}`;
                    return p.ada?.toString().includes(q) || p.parsel?.toString().includes(q) || adaParsel.includes(q);
                });
            }

            return list;
        });

        // Maskelenmiş Mülk Listesi (Emlakçı için)
        const maskedProperties = computed(() => {
            const list = filteredProperties.value;
            if (loginRole.value === 'realtor') {
                return list.map(p => ({
                    ...p,
                    owner: t.value.maskedOwner,
                    owner_name: t.value.maskedOwner
                }));
            }
            return list;
        });

        const valuationResult = computed(() => {
            return `$${(valArea.value * 2000).toLocaleString()}`;
        });

        const translateData = (category, value) => {
            if (!value) return '---';
            const mapping = t.value.data?.[category];
            return mapping?.[value] || value;
        };

        const translatedAmenities = computed(() => {
            return aiAmenities.value.map(a => ({
                ...a,
                label: translateData('amenities', a.label)
            }));
        });

        // ==================== METHODS ====================

        // Dil
        const setLang = (code) => {
            lang.value = code;
            Utils.setDirection(code);
        };

        // Yardımcılar
        const capitalize = Utils.capitalize;
        const getIcon = Utils.getIcon;
        const getAmenityStyle = Utils.getAmenityStyle;

        const showSuccess = (title, msg) => {
            Utils.showToast(toast, title, msg, CONFIG.TOAST_DURATION);
        };

        // Log Ekleme
        const addLog = (action, detail = '') => {
            const now = new Date();
            const logEntry = {
                id: Date.now(),
                user: loginCreds.value.username || 'Sistem',
                role: loginRole.value,
                action: action,
                detail: detail,
                date: now.toLocaleString(),
                ip: '192.168.1.' + Math.floor(Math.random() * 255) // Mock IP
            };
            auditLogs.value.unshift(logEntry);
            console.log('LOG:', logEntry);
        };

        // Tab değiştirme
        const changeTab = (tab) => {
            currentTab.value = tab;
            isMobileMenuOpen.value = false;
            if (tab === 'dashboard') {
                nextTick(() => MapManager.invalidateSize());
            }
        };

        // Login
        const handleLogin = () => {
            if (!loginCreds.value.username) return;
            loginProcessing.value = true;

            setTimeout(() => {
                // Rol Belirleme (ID'ye göre demo)
                const user = loginCreds.value.username;
                if (user.startsWith('99')) loginRole.value = 'officer';
                else if (user.startsWith('88')) loginRole.value = 'realtor';
                else loginRole.value = 'citizen';

                isLoggedIn.value = true;
                loginProcessing.value = false;

                addLog(t.value.logLogin, `Rol: ${loginRole.value}`);

                loading.value = true;
                loadingMsg.value = t.value.processingKMZ;

                // KMZ dosyasını yükle
                autoLoadKMZ(CONFIG.DEFAULT_KMZ_FILE).then(() => {
                    loading.value = false;
                    loadingMsg.value = '';
                    nextTick(() => {
                        initMap();
                        if (properties.value.length > 0) {
                            showSuccess(t.value.successTitle, `${properties.value.length} ${t.value.kmzUploaded}`);
                        }
                    });
                }).catch((err) => {
                    console.warn(t.value.kmzUploadError, err);
                    // Hata durumunda mock parsel oluştur
                    if (properties.value.length === 0) {
                        properties.value = KmzManager.generateMockParcels(50, CONFIG.MAP.DEFAULT_CENTER, activeRegionName.value);
                        if (properties.value.length > 0) {
                            selectedPropertyId.value = properties.value[0].id;
                        }
                    }
                    loading.value = false;
                    loadingMsg.value = '';
                    nextTick(() => initMap());
                });
            }, 1000);
        };

        const handleLogout = () => {
            addLog(t.value.logLogout);
            isLoggedIn.value = false;
            loginCreds.value = { username: '', password: '' };
        };

        // Harita başlatma
        const initMap = () => {
            MapManager.initMap('map');

            if (properties.value.length > 0) {
                nextTick(() => renderGeoJSON());
            }
        };

        // GeoJSON render
        const renderGeoJSON = () => {
            MapManager.renderGeoJSON(
                properties.value,
                mapStyle.value,
                (props) => {
                    const p = properties.value.find(x => x.id === props.id);
                    if (p) {
                        selectedPropertyId.value = p.id;
                        modals.value.activeProp = p;
                        modals.value.parcelAction = true;
                    }
                },
                t.value,
                translateData
            );
        };

        // Harita stili değişince yeniden render
        watch(mapStyle, () => {
            renderGeoJSON();
        });

        // Dil değişince haritayı (popup'ları) güncelle
        watch(lang, () => renderGeoJSON());

        // OCR Map Modal
        const initOcrMap = () => {
            MapManager.initOcrMap('ocr-map-picker');

            MapManager.renderOcrGeoJSON(properties.value, (props) => {
                const p = properties.value.find(x => x.id === props.id);
                if (p) {
                    selectedPropertyId.value = p.id;
                    modals.value.activeProp = p;
                    tempSelectedParcel.value = `${p.ada}/${p.parsel}`;
                }
            });
        };

        const openOcrMapModal = () => {
            modals.value.ocrMap = true;
            tempSelectedParcel.value = null;
            nextTick(() => {
                setTimeout(() => initOcrMap(), 100);
            });
        };

        const confirmOcrMapSelection = () => {
            modals.value.ocrMap = false;
            showSuccess(t.value.matchSuccess, t.value.matchSuccessDesc);
        };

        // KMZ Yükleme
        const handleFileUpload = async (event) => {
            kmzLoading.value = true;
            loadingMsg.value = t.value.processingKMZ;

            try {
                const result = await KmzManager.handleFileUpload(event);
                if (result) {
                    properties.value = result.properties;

                    if (MapManager.map) {
                        renderGeoJSON();
                    }

                    showSuccess(t.value.successTitle, `${result.count} ${t.value.kmzUploaded}`);
                }
            } catch (err) {
                console.error('File Error:', err);
                showSuccess(t.value.errorTitle, t.value.kmzUploadError + ' ' + err.message);
            } finally {
                kmzLoading.value = false;
                loadingMsg.value = '';
            }
        };

        // Otomatik KMZ yükleme
        const autoLoadKMZ = async (filename) => {
            try {
                const result = await KmzManager.autoLoadKMZ(filename);
                properties.value = result.properties;
                console.log(`${result.count} ${t.value.kmzAutoLoaded}`);
            } catch (err) {
                console.warn('Auto-load KMZ failed:', err.message);
            }
        };

        // OCR İşlemleri
        const openOcrPicker = (e) => {
            ocrWebhookMode.value = e?.shiftKey ? 'test' : 'prod';
            console.log(`OCR: Mod seçildi: ${ocrWebhookMode.value.toUpperCase()}`);

            if (!ocrInput.value) {
                console.error(t.value.ocrInputError);
                return;
            }

            ocrInput.value.value = '';
            ocrInput.value.click();
        };

        const populateOcrForm = () => {
            if (!ocrData.value) return;
            const data = { ...ocrData.value };

            // Çeviriler (Translations)
            if (data.province) data.province = translateData('locations', data.province);
            if (data.district) data.district = translateData('locations', data.district);
            if (data.property_type) data.property_type = translateData('types', data.property_type);

            // Mock Description Translation
            // "Sokak 8" ile başlıyorsa çeviri anahtarını kullan
            if (data.description && data.description.trim().startsWith('Sokak 8')) {
                data.description = t.value.ocrMockDesc || data.description;
            }

            ocrForm.value = data;
        };

        // Dil değişirse formu güncelle
        watch(lang, () => {
            if (ocrData.value) populateOcrForm();
        });

        const handleOcrUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Önizleme
            ocrImage.value = await Utils.fileToDataURL(file);
            ocrScanning.value = true;
            ocrData.value = null;

            try {
                const result = await OcrManager.processImage(file, ocrWebhookMode.value);

                ocrData.value = result;
                populateOcrForm();

                showSuccess(t.value.successTitle, t.value.ocrSuccess);
            } catch (error) {
                console.error('OCR Error:', error);

                if (error instanceof OcrError) {
                    showSuccess(t.value.errorTitle, error.userMessage);
                } else {
                    showSuccess(t.value.errorTitle, t.value.ocrError + error.message);
                }
            } finally {
                ocrScanning.value = false;
            }
        };

        // Viewer fonksiyonları
        const resetViewer = () => {
            viewerScale.value = 1;
            viewerPanX.value = 0;
            viewerPanY.value = 0;
        };

        const handleViewerWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const nextScale = viewerScale.value * delta;
            if (nextScale > 0.1 && nextScale < 20) {
                viewerScale.value = nextScale;
            }
        };

        const handleViewerMouseDown = (e) => {
            if (viewerMode.value === 'pan') {
                isPanning.value = true;
            } else {
                isSelecting.value = true;
                const rect = viewerContainer.value.getBoundingClientRect();
                selectionStart.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                selectionRect.value = {
                    top: selectionStart.value.y,
                    left: selectionStart.value.x,
                    width: 0,
                    height: 0
                };
            }
        };

        const handleViewerMouseMove = (e) => {
            if (isPanning.value) {
                viewerPanX.value += e.movementX;
                viewerPanY.value += e.movementY;
            } else if (isSelecting.value) {
                const rect = viewerContainer.value.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;

                selectionRect.value = {
                    left: Math.min(selectionStart.value.x, currentX),
                    top: Math.min(selectionStart.value.y, currentY),
                    width: Math.abs(currentX - selectionStart.value.x),
                    height: Math.abs(currentY - selectionStart.value.y)
                };
            }
        };

        const handleViewerMouseUp = () => {
            if (isSelecting.value && selectionRect.value.width > 10) {
                const containerRect = viewerContainer.value.getBoundingClientRect();
                const scaleX = containerRect.width / selectionRect.value.width;
                const scaleY = containerRect.height / selectionRect.value.height;
                const newScale = Math.min(scaleX, scaleY) * 0.9;

                const centerX = selectionRect.value.left + selectionRect.value.width / 2;
                const centerY = selectionRect.value.top + selectionRect.value.height / 2;

                viewerScale.value *= newScale;
                viewerPanX.value = (containerRect.width / 2 - centerX) * viewerScale.value;
                viewerPanY.value = (containerRect.height / 2 - centerY) * viewerScale.value;

                viewerMode.value = 'pan';
            }
            isPanning.value = false;
            isSelecting.value = false;
        };

        // Tapu oluştur
        const saveAndGenerateDeed = () => {
            const newProp = OcrManager.formToProperty(ocrForm.value);
            modals.value.activeProp = newProp;
            modals.value.deed = true;
            showSuccess(t.value.recordSuccess, t.value.deedCreated);
        };

        // Arama
        const locateProperty = () => {
            const q = searchQuery.value.trim().toLowerCase();
            if (!q) return;

            const found = properties.value.find(p => {
                const adaParsel = `${p.ada}/${p.parsel}`;
                const owner = (p.owner_name || p.owner || '').toLowerCase();
                const ownerAr = (p.owner_name_ar || '').toLowerCase();
                const location = (p.location || '').toLowerCase();

                return adaParsel.includes(q) ||
                    p.ada?.toString() === q ||
                    owner.includes(q) ||
                    ownerAr.includes(q) ||
                    location.includes(q);
            });

            if (found && found.geometry) {
                const coords = found.geometry.type === 'Point'
                    ? found.geometry.coordinates
                    : found.geometry.coordinates[0][0];

                if (coords) {
                    // Haritada vurgula ve popup aç
                    MapManager.highlightParcel(found.id);

                    // Seçili parseli ve modal bilgisini güncelle
                    selectedPropertyId.value = found.id;
                    modals.value.activeProp = found;
                }
            } else {
                // Toaster ile bildirim verebiliriz
                toast.show = true;
                toast.title = t.value.errorTitle;
                toast.message = t.value.selectParcel;
                setTimeout(() => toast.show = false, 3000);
            }
        };

        // Global Dispatcher for Map Actions
        window.dispatchParcelAction = (id, type) => {
            const found = properties.value.find(p => p.id == id);
            if (!found) return;

            selectedPropertyId.value = found.id;
            modals.value.activeProp = found;

            if (type === 'ai') {
                modals.value.aiAnalysis = true;
            } else if (type === 'deed') {
                modals.value.deed = true;
            } else if (type === 'info') {
                modals.value.propInfo = true;
            }
        };

        const resetFilters = () => {
            filters.value = { city: '', neighborhood: '', street: '', parcel: '' };
            searchQuery.value = '';
        };

        const startTransferProcess = () => {
            if (!selectedPropertyId.value) {
                Utils.showToast(toast, t.value.labelSelectProp, 'error');
                return;
            }
            if (!buyerName.value) {
                Utils.showToast(toast, t.value.buyerName, 'error');
                return;
            }

            // Start simulation from Step 1 to Step 2
            simulating.value = true;
            simProgress.value = 0;

            const interval = setInterval(() => {
                simProgress.value += 5;
                if (simProgress.value >= 100) {
                    clearInterval(interval);
                    simulating.value = false;
                    transferStep.value = 2;
                    Utils.showToast(toast, t.value.transferStep2, t.value.simVerifyingId, 3000);
                }
            }, 50);
        };

        const nextTransferStep = () => {
            if (transferStep.value >= 5) return;

            simulating.value = true;
            simProgress.value = 0;

            const interval = setInterval(() => {
                simProgress.value += 4;
                if (simProgress.value >= 100) {
                    clearInterval(interval);
                    simulating.value = false;
                    transferStep.value++;

                    const msgs = {
                        2: { title: t.value.transferStep2, desc: t.value.simIdMatch },
                        3: { title: t.value.transferStep3, desc: t.value.simCalculatingFees },
                        4: { title: t.value.transferStep4, desc: t.value.simBlockchainHasing },
                        5: { title: t.value.transferStep5, desc: t.value.simDeedReady }
                    };
                    const m = msgs[transferStep.value];
                    if (m) Utils.showToast(toast, m.title, m.desc, 4000);
                }
            }, 40);
        };

        const resetTransfer = () => {
            transferStep.value = 1;
            buyerName.value = '';
            simProgress.value = 0;
            simulating.value = false;
        };

        const startExproQuery = () => {
            if (!exproSelectedId.value) return;

            exproQuerying.value = true;
            exproProgress.value = 0;
            exproResult.value = null;

            const interval = setInterval(() => {
                exproProgress.value += 4;
                if (exproProgress.value >= 100) {
                    clearInterval(interval);

                    // Rastgele kısıtlama (Demo için)
                    const hasRestriction = Math.random() > 0.5;

                    if (hasRestriction) {
                        exproResult.value = {
                            hasRestriction: true,
                            annotations: [
                                { type: t.value.annoType1, date: '12/05/2023', number: '2023/1142' },
                                { type: t.value.annoType3, date: '08/02/2024', number: 'Ref: Bank-772' }
                            ]
                        };
                        Utils.showToast(toast, t.value.exproFound, t.value.exproActiveRecord, 5000);
                    } else {
                        exproResult.value = {
                            hasRestriction: false,
                            annotations: []
                        };
                    }

                    exproQuerying.value = false;
                }
            }, 50);
        };

        watch(selectedPropertyId, () => {
            buyerName.value = '';
        });

        // ==================== LIFECYCLE ====================

        onMounted(() => {
            setLang('tr');
            // KMZ dosyası giriş yapıldıktan sonra yüklenecek (handleLogin içinde)
        });

        // ==================== RETURN ====================

        return {
            // State
            loading, loadingMsg, lang, toast,
            isLoggedIn, loginCreds, loginProcessing, loginRole, auditLogs,
            isMobileMenuOpen, currentTab, showMapSettings,
            searchQuery, mapStyle, kmzLoading,
            properties, selectedPropertyId, activeRegionName,
            ocrImage, ocrScanning, ocrData, ocrForm, ocrInput,
            viewerScale, viewerPanX, viewerPanY, viewerMode,
            isPanning, isSelecting, selectionRect, viewerContainer,
            tempSelectedParcel, modals,
            valRegion, valArea,
            aiTrendData, aiAmenities,
            exproSelectedId, exproQuerying, exproProgress, exproResult,

            // Computed
            t, selectedProperty, totalValue, filteredProperties, maskedProperties, valuationResult,
            translateData, translatedAmenities,

            // Methods
            setLang, capitalize, getIcon, getAmenityStyle,
            changeTab, handleLogin, handleLogout, handleFileUpload, addLog,
            openOcrPicker, handleOcrUpload, openOcrMapModal, confirmOcrMapSelection,
            resetViewer, handleViewerWheel, handleViewerMouseDown,
            handleViewerMouseMove, handleViewerMouseUp,
            saveAndGenerateDeed, locateProperty,
            startTransferProcess, buyerName, dispatchParcelAction,
            filters, resetFilters, transferStep, simProgress, simulating,
            nextTransferStep, resetTransfer, startExproQuery
        };
    }
}).mount('#app');

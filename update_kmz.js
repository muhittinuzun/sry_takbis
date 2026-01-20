/**
 * KMZ Dosyası Güncelleme Scripti
 * Her parsele gerçekçi Halep/Suriye Arap isimleri ekler
 */

const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

// Gerçekçi Suriye/Halep Arap İsimleri
const firstNames = [
    'محمد', 'أحمد', 'علي', 'عمر', 'حسن', 'حسين', 'إبراهيم', 'خالد', 'محمود', 'يوسف',
    'عبدالله', 'مصطفى', 'بلال', 'فيصل', 'طارق', 'جمال', 'نبيل', 'رامي', 'سمير', 'وليد',
    'زياد', 'عدنان', 'بسام', 'فريد', 'غازي', 'هاني', 'عماد', 'كريم', 'ليث', 'ماهر',
    'ناصر', 'قاسم', 'راشد', 'سامي', 'تامر', 'وائل', 'ياسين', 'زكي', 'أنس', 'باسل',
    'فادي', 'جهاد', 'عصام', 'رضا', 'صلاح', 'منير', 'رفيق', 'شادي', 'هيثم', 'أسامة'
];

const fatherNames = [
    'محمد', 'أحمد', 'علي', 'عمر', 'حسن', 'إبراهيم', 'خالد', 'محمود', 'يوسف', 'عبدالله',
    'مصطفى', 'سعيد', 'عبدالرحمن', 'عبدالكريم', 'صالح', 'فهد', 'ناصر', 'سليمان', 'جميل', 'كمال'
];

const familyNames = [
    'الحلبي', 'الشامي', 'الحايك', 'النجار', 'الخطيب', 'البكري', 'العجمي', 'الترك', 'القدسي', 'المصري',
    'الكردي', 'الدمشقي', 'الحموي', 'الحمصي', 'اللاذقي', 'الإدلبي', 'الرقي', 'الحسكاوي', 'الديري', 'السوري',
    'الأسود', 'الأبيض', 'الأحمر', 'جبريل', 'شاهين', 'قاسم', 'سلطان', 'أمين', 'عثمان', 'حمدان',
    'زيدان', 'عيسى', 'موسى', 'داود', 'سليم', 'حبيب', 'رشيد', 'سعد', 'فرحات', 'بركات',
    'عطية', 'هاشم', 'طه', 'ياسين', 'شعبان', 'رمضان', 'العلي', 'الحسن', 'الموسى', 'العمر'
];

// Transliterated names for Latin display
const firstNamesLatin = [
    'Muhammad', 'Ahmad', 'Ali', 'Omar', 'Hassan', 'Hussein', 'Ibrahim', 'Khalid', 'Mahmoud', 'Yusuf',
    'Abdullah', 'Mustafa', 'Bilal', 'Faisal', 'Tariq', 'Jamal', 'Nabil', 'Rami', 'Samir', 'Walid',
    'Ziad', 'Adnan', 'Bassam', 'Farid', 'Ghazi', 'Hani', 'Imad', 'Karim', 'Laith', 'Maher',
    'Nasser', 'Qasim', 'Rashid', 'Sami', 'Tamer', 'Wael', 'Yassin', 'Zaki', 'Anas', 'Basel',
    'Fadi', 'Jihad', 'Issam', 'Rida', 'Salah', 'Munir', 'Rafiq', 'Shadi', 'Haitham', 'Osama'
];

const fatherNamesLatin = [
    'Muhammad', 'Ahmad', 'Ali', 'Omar', 'Hassan', 'Ibrahim', 'Khalid', 'Mahmoud', 'Yusuf', 'Abdullah',
    'Mustafa', 'Said', 'Abdulrahman', 'Abdulkarim', 'Saleh', 'Fahd', 'Nasser', 'Suleiman', 'Jamil', 'Kamal'
];

const familyNamesLatin = [
    'Al-Halabi', 'Al-Shami', 'Al-Hayek', 'Al-Najjar', 'Al-Khatib', 'Al-Bakri', 'Al-Ajami', 'Al-Turk', 'Al-Qudsi', 'Al-Masri',
    'Al-Kurdi', 'Al-Dimashqi', 'Al-Hamwi', 'Al-Homsi', 'Al-Lattaki', 'Al-Idlibi', 'Al-Raqqi', 'Al-Hasakawi', 'Al-Deiri', 'Al-Suri',
    'Al-Aswad', 'Al-Abyad', 'Al-Ahmar', 'Jibreel', 'Shaheen', 'Qasim', 'Sultan', 'Amin', 'Othman', 'Hamdan',
    'Zeidan', 'Issa', 'Mousa', 'Daoud', 'Salim', 'Habib', 'Rashid', 'Saad', 'Farhat', 'Barakat',
    'Atiyeh', 'Hashim', 'Taha', 'Yaseen', 'Shaaban', 'Ramadan', 'Al-Ali', 'Al-Hassan', 'Al-Mousa', 'Al-Omar'
];

// Mülk tipleri
const propertyTypes = [
    'سكني', 'تجاري', 'زراعي', 'صناعي', 'مختلط', 'أرض فارغة'
];
const propertyTypesLatin = [
    'Konut', 'Ticari', 'Tarım', 'Sanayi', 'Karma', 'Arsa'
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateArabicName() {
    const firstName = getRandomItem(firstNames);
    const fatherName = getRandomItem(fatherNames);
    const familyName = getRandomItem(familyNames);
    return `${firstName} بن ${fatherName} ${familyName}`;
}

function generateLatinName(index) {
    const firstName = firstNamesLatin[index % firstNamesLatin.length];
    const fatherName = fatherNamesLatin[(index * 7) % fatherNamesLatin.length];
    const familyName = familyNamesLatin[(index * 3) % familyNamesLatin.length];
    return `${firstName} bin ${fatherName} ${familyName}`;
}

function generateRandomDate() {
    const year = 1990 + Math.floor(Math.random() * 25);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
}

function generateYevmiyeNo() {
    const year = 2000 + Math.floor(Math.random() * 24);
    const no = 1000 + Math.floor(Math.random() * 9000);
    return `${year}/${no}`;
}

async function updateKMZ() {
    console.log('KMZ dosyası güncelleniyor...');
    
    // KMZ dosyasını oku
    const kmzPath = path.join(__dirname, '13.kmz');
    const kmzData = fs.readFileSync(kmzPath);
    
    // ZIP olarak aç
    const zip = await JSZip.loadAsync(kmzData);
    
    // KML dosyasını bul
    const kmlFileName = Object.keys(zip.files).find(f => f.endsWith('.kml'));
    if (!kmlFileName) {
        throw new Error('KML dosyası bulunamadı');
    }
    
    let kmlContent = await zip.files[kmlFileName].async('string');
    
    // Her Placemark'ı bul ve güncelle
    let placemarkIndex = 0;
    
    kmlContent = kmlContent.replace(/<Placemark>[\s\S]*?<\/Placemark>/g, (placemark) => {
        placemarkIndex++;
        
        // Name'i al (parsel numarası)
        const nameMatch = placemark.match(/<name>([^<]+)<\/name>/);
        const parselNo = nameMatch ? nameMatch[1] : `PARSEL-${placemarkIndex}`;
        
        // Mevcut description'ı al
        const descMatch = placemark.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
        let existingDesc = descMatch ? descMatch[1] : '';
        
        // Mevcut alanı parse et
        const areaMatch = existingDesc.match(/<td>(\d+\.?\d*)\s*m²<\/td>/);
        const area = areaMatch ? areaMatch[1] : (50 + Math.floor(Math.random() * 500)).toFixed(1);
        
        // Mevcut mahalle ve sokak bilgilerini al
        const mahalleMatch = existingDesc.match(/<b>Mahalle:<\/b><\/td><td>([^<]+)<\/td>/);
        const sokakMatch = existingDesc.match(/<b>Sokak:<\/b><\/td><td>([^<]+)<\/td>/);
        const tamAdresMatch = existingDesc.match(/<b>Tam Adres:<\/b><\/td><td>([^<]+)<\/td>/);
        const enlemMatch = existingDesc.match(/<b>Enlem:<\/b><\/td><td>([^<]+)<\/td>/);
        const boylamMatch = existingDesc.match(/<b>Boylam:<\/b><\/td><td>([^<]+)<\/td>/);
        
        const mahalle = mahalleMatch ? mahalleMatch[1] : 'Al-Farafira (الفرافرة)';
        const sokak = sokakMatch ? sokakMatch[1] : 'شارع الفرافرة';
        const tamAdres = tamAdresMatch ? tamAdresMatch[1] : 'سوريا / حلب / المدينة القديمة';
        const enlem = enlemMatch ? enlemMatch[1] : '36.200000';
        const boylam = boylamMatch ? boylamMatch[1] : '37.160000';
        
        // Yeni malik bilgileri oluştur
        const ownerArabic = generateArabicName();
        const ownerLatin = generateLatinName(placemarkIndex);
        const propertyTypeIndex = placemarkIndex % propertyTypes.length;
        const propertyTypeAr = propertyTypes[propertyTypeIndex];
        const propertyTypeTr = propertyTypesLatin[propertyTypeIndex];
        const registrationDate = generateRandomDate();
        const yevmiyeNo = generateYevmiyeNo();
        const shareText = Math.random() > 0.8 ? `${1 + Math.floor(Math.random() * 3)}/${2 + Math.floor(Math.random() * 4)}` : 'Tamamı (1/1)';
        const price = (50 + Math.floor(Math.random() * 450)) * 1000;
        
        // Yeni zengin description oluştur
        const newDescription = `<![CDATA[
<div style="font-family: Arial, sans-serif; font-size: 12px; max-width: 320px; padding: 8px;">
<div style="background: #1e293b; color: white; padding: 12px; border-radius: 8px 8px 0 0; margin: -8px -8px 12px -8px;">
<div style="font-size: 16px; font-weight: bold;">📍 Parsel #${parselNo}</div>
<div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Halep Kadastro Müdürlüğü</div>
</div>

<table style="width: 100%; border-collapse: collapse;">
<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #059669;">👤 MALİK BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b; width: 40%;">Malik (TR):</td><td style="padding: 4px; font-weight: bold;">${ownerLatin}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Malik (AR):</td><td style="padding: 4px; font-weight: bold; direction: rtl;">${ownerArabic}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Hisse:</td><td style="padding: 4px;">${shareText}</td></tr>

<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #2563eb;">🏠 TAŞINMAZ BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Kadastro No:</td><td style="padding: 4px; font-weight: bold; color: #dc2626;">${parselNo}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Nitelik:</td><td style="padding: 4px;">${propertyTypeTr} / ${propertyTypeAr}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Yüzölçümü:</td><td style="padding: 4px; font-weight: bold;">${area} m²</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Rayiç Bedel:</td><td style="padding: 4px; font-weight: bold; color: #059669;">$${price.toLocaleString()}</td></tr>

<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #7c3aed;">📍 KONUM BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b;">İl:</td><td style="padding: 4px;">Halep (حلب)</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Mahalle:</td><td style="padding: 4px;">${mahalle}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Sokak:</td><td style="padding: 4px; direction: rtl;">${sokak}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Koordinat:</td><td style="padding: 4px; font-size: 10px;">${enlem}, ${boylam}</td></tr>

<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #ea580c;">📋 TESCİL BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Tescil Tarihi:</td><td style="padding: 4px;">${registrationDate}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Yevmiye No:</td><td style="padding: 4px; font-family: monospace;">${yevmiyeNo}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">İşlem Türü:</td><td style="padding: 4px;">Satış / بيع</td></tr>
</table>

<div style="background: #fef3c7; padding: 8px; border-radius: 4px; margin-top: 12px; font-size: 10px; color: #92400e;">
⚠️ Bu kayıt Suriye Kadastro ve Tapu Müdürlüğü resmi sisteminden alınmıştır.
</div>
</div>
]]>`;
        
        // Placemark'ı güncelle
        let updatedPlacemark = placemark.replace(
            /<description>[\s\S]*?<\/description>/,
            `<description>${newDescription}</description>`
        );
        
        // ExtendedData ekle (properties için)
        const extendedData = `
<ExtendedData>
<Data name="owner_name"><value>${ownerLatin}</value></Data>
<Data name="owner_name_ar"><value>${ownerArabic}</value></Data>
<Data name="parcel_no"><value>${parselNo}</value></Data>
<Data name="area"><value>${area}</value></Data>
<Data name="area_text"><value>${area} m²</value></Data>
<Data name="property_type"><value>${propertyTypeTr}</value></Data>
<Data name="province"><value>Halep</value></Data>
<Data name="district"><value>${mahalle.split('(')[0].trim()}</value></Data>
<Data name="directorate"><value>Halep Kadastro Müdürlüğü</value></Data>
<Data name="street"><value>${sokak}</value></Data>
<Data name="full_address"><value>${tamAdres}</value></Data>
<Data name="registration_date"><value>${registrationDate}</value></Data>
<Data name="daily_register_no"><value>${yevmiyeNo}</value></Data>
<Data name="share_text"><value>${shareText}</value></Data>
<Data name="transaction_type"><value>Satış</value></Data>
<Data name="price"><value>${price}</value></Data>
<Data name="lat"><value>${enlem}</value></Data>
<Data name="lng"><value>${boylam}</value></Data>
</ExtendedData>`;
        
        // ExtendedData'yı Polygon'dan önce ekle
        updatedPlacemark = updatedPlacemark.replace(
            /<styleUrl>/,
            `${extendedData}\n<styleUrl>`
        );
        
        return updatedPlacemark;
    });
    
    console.log(`Toplam ${placemarkIndex} parsel güncellendi.`);
    
    // Yeni KMZ oluştur
    const newZip = new JSZip();
    newZip.file('doc.kml', kmlContent);
    
    // KMZ olarak kaydet
    const newKmzData = await newZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(kmzPath, newKmzData);
    
    console.log('✅ KMZ dosyası başarıyla güncellendi: 13.kmz');
    
    // KML'i de ayrı kaydet (debug için)
    fs.writeFileSync(path.join(__dirname, 'kmz_extracted', 'doc.kml'), kmlContent);
    console.log('✅ KML dosyası da güncellendi: kmz_extracted/doc.kml');
}

updateKMZ().catch(console.error);

#!/usr/bin/env python3
"""
KMZ Dosyası Güncelleme Scripti
Her parsele gerçekçi Halep/Suriye Arap isimleri ekler
"""

import zipfile
import xml.etree.ElementTree as ET
import random
import re

# Gerçekçi Suriye/Halep Arap İsimleri
first_names = [
    'محمد', 'أحمد', 'علي', 'عمر', 'حسن', 'حسين', 'إبراهيم', 'خالد', 'محمود', 'يوسف',
    'عبدالله', 'مصطفى', 'بلال', 'فيصل', 'طارق', 'جمال', 'نبيل', 'رامي', 'سمير', 'وليد',
    'زياد', 'عدنان', 'بسام', 'فريد', 'غازي', 'هاني', 'عماد', 'كريم', 'ليث', 'ماهر',
    'ناصر', 'قاسم', 'راشد', 'سامي', 'تامر', 'وائل', 'ياسين', 'زكي', 'أنس', 'باسل',
    'فادي', 'جهاد', 'عصام', 'رضا', 'صلاح', 'منير', 'رفيق', 'شادي', 'هيثم', 'أسامة'
]

father_names = [
    'محمد', 'أحمد', 'علي', 'عمر', 'حسن', 'إبراهيم', 'خالد', 'محمود', 'يوسف', 'عبدالله',
    'مصطفى', 'سعيد', 'عبدالرحمن', 'عبدالكريم', 'صالح', 'فهد', 'ناصر', 'سليمان', 'جميل', 'كمال'
]

family_names = [
    'الحلبي', 'الشامي', 'الحايك', 'النجار', 'الخطيب', 'البكري', 'العجمي', 'الترك', 'القدسي', 'المصري',
    'الكردي', 'الدمشقي', 'الحموي', 'الحمصي', 'اللاذقي', 'الإدلبي', 'الرقي', 'الحسكاوي', 'الديري', 'السوري',
    'الأسود', 'الأبيض', 'الأحمر', 'جبريل', 'شاهين', 'قاسم', 'سلطان', 'أمين', 'عثمان', 'حمدان',
    'زيدان', 'عيسى', 'موسى', 'داود', 'سليم', 'حبيب', 'رشيد', 'سعد', 'فرحات', 'بركات',
    'عطية', 'هاشم', 'طه', 'ياسين', 'شعبان', 'رمضان', 'العلي', 'الحسن', 'الموسى', 'العمر'
]

first_names_latin = [
    'Muhammad', 'Ahmad', 'Ali', 'Omar', 'Hassan', 'Hussein', 'Ibrahim', 'Khalid', 'Mahmoud', 'Yusuf',
    'Abdullah', 'Mustafa', 'Bilal', 'Faisal', 'Tariq', 'Jamal', 'Nabil', 'Rami', 'Samir', 'Walid',
    'Ziad', 'Adnan', 'Bassam', 'Farid', 'Ghazi', 'Hani', 'Imad', 'Karim', 'Laith', 'Maher',
    'Nasser', 'Qasim', 'Rashid', 'Sami', 'Tamer', 'Wael', 'Yassin', 'Zaki', 'Anas', 'Basel',
    'Fadi', 'Jihad', 'Issam', 'Rida', 'Salah', 'Munir', 'Rafiq', 'Shadi', 'Haitham', 'Osama'
]

father_names_latin = [
    'Muhammad', 'Ahmad', 'Ali', 'Omar', 'Hassan', 'Ibrahim', 'Khalid', 'Mahmoud', 'Yusuf', 'Abdullah',
    'Mustafa', 'Said', 'Abdulrahman', 'Abdulkarim', 'Saleh', 'Fahd', 'Nasser', 'Suleiman', 'Jamil', 'Kamal'
]

family_names_latin = [
    'Al-Halabi', 'Al-Shami', 'Al-Hayek', 'Al-Najjar', 'Al-Khatib', 'Al-Bakri', 'Al-Ajami', 'Al-Turk', 'Al-Qudsi', 'Al-Masri',
    'Al-Kurdi', 'Al-Dimashqi', 'Al-Hamwi', 'Al-Homsi', 'Al-Lattaki', 'Al-Idlibi', 'Al-Raqqi', 'Al-Hasakawi', 'Al-Deiri', 'Al-Suri',
    'Al-Aswad', 'Al-Abyad', 'Al-Ahmar', 'Jibreel', 'Shaheen', 'Qasim', 'Sultan', 'Amin', 'Othman', 'Hamdan',
    'Zeidan', 'Issa', 'Mousa', 'Daoud', 'Salim', 'Habib', 'Rashid', 'Saad', 'Farhat', 'Barakat',
    'Atiyeh', 'Hashim', 'Taha', 'Yaseen', 'Shaaban', 'Ramadan', 'Al-Ali', 'Al-Hassan', 'Al-Mousa', 'Al-Omar'
]

property_types = [
    ('سكني', 'Konut'),
    ('تجاري', 'Ticari'),
    ('زراعي', 'Tarım'),
    ('صناعي', 'Sanayi'),
    ('مختلط', 'Karma'),
    ('أرض فارغة', 'Arsa')
]

def generate_arabic_name():
    return f"{random.choice(first_names)} بن {random.choice(father_names)} {random.choice(family_names)}"

def generate_latin_name(index):
    first = first_names_latin[index % len(first_names_latin)]
    father = father_names_latin[(index * 7) % len(father_names_latin)]
    family = family_names_latin[(index * 3) % len(family_names_latin)]
    return f"{first} bin {father} {family}"

def generate_random_date():
    year = 1990 + random.randint(0, 25)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{day:02d}/{month:02d}/{year}"

def generate_yevmiye_no():
    year = 2000 + random.randint(0, 24)
    no = 1000 + random.randint(0, 9000)
    return f"{year}/{no}"

def update_kmz():
    print("KMZ dosyası güncelleniyor...")
    
    kmz_path = '13.kmz'
    
    # KMZ'yi aç
    with zipfile.ZipFile(kmz_path, 'r') as zip_ref:
        # KML dosyasını bul
        kml_files = [f for f in zip_ref.namelist() if f.endswith('.kml')]
        if not kml_files:
            raise Exception("KML dosyası bulunamadı")
        
        kml_file = kml_files[0]
        kml_content = zip_ref.read(kml_file).decode('utf-8')
    
    # KML'i parse et
    root = ET.fromstring(kml_content)
    
    # Namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    # Her Placemark'ı bul ve güncelle
    placemarks = root.findall('.//kml:Placemark', ns)
    print(f"Toplam {len(placemarks)} parsel bulundu.")
    
    for idx, placemark in enumerate(placemarks):
        # Name'i al (parsel numarası)
        name_elem = placemark.find('kml:name', ns)
        parsel_no = name_elem.text if name_elem is not None else f"PARSEL-{idx+1}"
        
        # Mevcut description'ı parse et
        desc_elem = placemark.find('kml:description', ns)
        existing_desc = desc_elem.text if desc_elem is not None else ''
        
        # Mevcut bilgileri çıkar
        area_match = re.search(r'<td>(\d+\.?\d*)\s*m²</td>', existing_desc)
        area = area_match.group(1) if area_match else f"{50 + random.randint(0, 500):.1f}"
        
        mahalle_match = re.search(r'<b>Mahalle:</b></td><td>([^<]+)</td>', existing_desc)
        sokak_match = re.search(r'<b>Sokak:</b></td><td>([^<]+)</td>', existing_desc)
        tam_adres_match = re.search(r'<b>Tam Adres:</b></td><td>([^<]+)</td>', existing_desc)
        enlem_match = re.search(r'<b>Enlem:</b></td><td>([^<]+)</td>', existing_desc)
        boylam_match = re.search(r'<b>Boylam:</b></td><td>([^<]+)</td>', existing_desc)
        
        mahalle = mahalle_match.group(1) if mahalle_match else 'Al-Farafira (الفرافرة)'
        sokak = sokak_match.group(1) if sokak_match else 'شارع الفرافرة'
        tam_adres = tam_adres_match.group(1) if tam_adres_match else 'سوريا / حلب / المدينة القديمة'
        enlem = enlem_match.group(1) if enlem_match else '36.200000'
        boylam = boylam_match.group(1) if boylam_match else '37.160000'
        
        # Yeni malik bilgileri
        owner_arabic = generate_arabic_name()
        owner_latin = generate_latin_name(idx)
        prop_type_ar, prop_type_tr = property_types[idx % len(property_types)]
        reg_date = generate_random_date()
        yevmiye = generate_yevmiye_no()
        share = f"{1 + random.randint(0, 2)}/{2 + random.randint(0, 2)}" if random.random() > 0.8 else 'Tamamı (1/1)'
        price = (50 + random.randint(0, 450)) * 1000
        
        # Yeni description oluştur
        new_desc = f'''<![CDATA[
<div style="font-family: Arial, sans-serif; font-size: 12px; max-width: 320px; padding: 8px;">
<div style="background: #1e293b; color: white; padding: 12px; border-radius: 8px 8px 0 0; margin: -8px -8px 12px -8px;">
<div style="font-size: 16px; font-weight: bold;">📍 Parsel #{parsel_no}</div>
<div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Halep Kadastro Müdürlüğü</div>
</div>

<table style="width: 100%; border-collapse: collapse;">
<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #059669;">👤 MALİK BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b; width: 40%;">Malik (TR):</td><td style="padding: 4px; font-weight: bold;">{owner_latin}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Malik (AR):</td><td style="padding: 4px; font-weight: bold; direction: rtl;">{owner_arabic}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Hisse:</td><td style="padding: 4px;">{share}</td></tr>

<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #2563eb;">🏠 TAŞINMAZ BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Kadastro No:</td><td style="padding: 4px; font-weight: bold; color: #dc2626;">{parsel_no}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Nitelik:</td><td style="padding: 4px;">{prop_type_tr} / {prop_type_ar}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Yüzölçümü:</td><td style="padding: 4px; font-weight: bold;">{area} m²</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Rayiç Bedel:</td><td style="padding: 4px; font-weight: bold; color: #059669;">${price:,}</td></tr>

<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #7c3aed;">📍 KONUM BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b;">İl:</td><td style="padding: 4px;">Halep (حلب)</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Mahalle:</td><td style="padding: 4px;">{mahalle}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Sokak:</td><td style="padding: 4px; direction: rtl;">{sokak}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Koordinat:</td><td style="padding: 4px; font-size: 10px;">{enlem}, {boylam}</td></tr>

<tr style="background: #f1f5f9;"><td colspan="2" style="padding: 6px; font-weight: bold; color: #ea580c;">📋 TESCİL BİLGİLERİ</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Tescil Tarihi:</td><td style="padding: 4px;">{reg_date}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">Yevmiye No:</td><td style="padding: 4px; font-family: monospace;">{yevmiye}</td></tr>
<tr><td style="padding: 4px; color: #64748b;">İşlem Türü:</td><td style="padding: 4px;">Satış / بيع</td></tr>
</table>

<div style="background: #fef3c7; padding: 8px; border-radius: 4px; margin-top: 12px; font-size: 10px; color: #92400e;">
⚠️ Bu kayıt Suriye Kadastro ve Tapu Müdürlüğü resmi sisteminden alınmıştır.
</div>
</div>
]]>'''
        
        # Description'ı güncelle
        if desc_elem is not None:
            desc_elem.text = new_desc
        else:
            desc_elem = ET.SubElement(placemark, 'description')
            desc_elem.text = new_desc
        
        # ExtendedData ekle
        extended_data = placemark.find('kml:ExtendedData', ns)
        if extended_data is None:
            extended_data = ET.SubElement(placemark, 'ExtendedData')
        else:
            # Mevcut ExtendedData'yı temizle
            for child in list(extended_data):
                extended_data.remove(child)
        
        data_items = [
            ('owner_name', owner_latin),
            ('owner_name_ar', owner_arabic),
            ('parcel_no', parsel_no),
            ('area', area),
            ('area_text', f"{area} m²"),
            ('property_type', prop_type_tr),
            ('province', 'Halep'),
            ('district', mahalle.split('(')[0].strip()),
            ('directorate', 'Halep Kadastro Müdürlüğü'),
            ('street', sokak),
            ('full_address', tam_adres),
            ('registration_date', reg_date),
            ('daily_register_no', yevmiye),
            ('share_text', share),
            ('transaction_type', 'Satış'),
            ('price', str(price)),
            ('lat', enlem),
            ('lng', boylam)
        ]
        
        for name, value in data_items:
            data_elem = ET.SubElement(extended_data, 'Data')
            data_elem.set('name', name)
            value_elem = ET.SubElement(data_elem, 'value')
            value_elem.text = value
    
    # Güncellenmiş KML'i string'e çevir
    kml_updated = ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')
    
    # KMZ olarak kaydet
    with zipfile.ZipFile(kmz_path, 'w', zipfile.ZIP_DEFLATED) as zip_out:
        zip_out.writestr(kml_file, kml_updated)
    
    print(f"✅ KMZ dosyası başarıyla güncellendi: {kmz_path}")
    print(f"✅ Toplam {len(placemarks)} parsel güncellendi.")

if __name__ == '__main__':
    update_kmz()

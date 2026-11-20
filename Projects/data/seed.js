// data/seed.js - Seed data initialization for Pipri Gram Panchayat
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'gramaglow.db');

function initDatabase() {
  console.log('Initializing SQLite database at:', DB_PATH);
  const db = new DatabaseSync(DB_PATH);

  // Enable foreign keys and WAL mode if possible
  db.exec('PRAGMA foreign_keys = ON;');

  // Create Tables
  db.exec(`
    DROP TABLE IF EXISTS village_profile;
    CREATE TABLE village_profile (
      id INTEGER PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      block_en TEXT,
      block_hi TEXT,
      district_en TEXT,
      district_hi TEXT,
      state_en TEXT,
      state_hi TEXT,
      pin_code TEXT,
      population INTEGER,
      households INTEGER,
      male_pop INTEGER,
      female_pop INTEGER,
      literacy_rate REAL,
      total_area_sqkm REAL,
      wards_count INTEGER,
      sarpanch_name_en TEXT,
      sarpanch_name_hi TEXT,
      sarpanch_phone TEXT,
      sarpanch_bio_en TEXT,
      sarpanch_bio_hi TEXT,
      secretary_name_en TEXT,
      secretary_name_hi TEXT,
      secretary_phone TEXT,
      office_timing_en TEXT,
      office_timing_hi TEXT,
      panchayat_bhavan_address_en TEXT,
      panchayat_bhavan_address_hi TEXT
    );

    DROP TABLE IF EXISTS ward_members;
    CREATE TABLE ward_members (
      id INTEGER PRIMARY KEY,
      ward_number INTEGER UNIQUE,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      phone TEXT,
      area_name_en TEXT,
      area_name_hi TEXT,
      voters_count INTEGER,
      focus_area_en TEXT,
      focus_area_hi TEXT
    );

    DROP TABLE IF EXISTS notices;
    CREATE TABLE notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      category TEXT NOT NULL, -- 'meeting', 'health', 'agriculture', 'education', 'general'
      priority TEXT DEFAULT 'normal', -- 'urgent', 'normal'
      issue_date TEXT NOT NULL,
      authority_en TEXT,
      authority_hi TEXT,
      content_en TEXT NOT NULL,
      content_hi TEXT NOT NULL,
      meeting_datetime TEXT,
      venue_en TEXT,
      venue_hi TEXT,
      audio_text_en TEXT,
      audio_text_hi TEXT
    );

    DROP TABLE IF EXISTS projects;
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      category TEXT NOT NULL, -- 'roads', 'lighting', 'sanitation', 'water', 'building'
      ward_number INTEGER,
      sanctioned_budget REAL NOT NULL,
      spent_amount REAL NOT NULL,
      completion_pct INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'Planning', 'In Progress', 'Near Completion', 'Completed'
      contractor_name TEXT,
      start_date TEXT,
      target_date TEXT,
      description_en TEXT,
      description_hi TEXT,
      milestones TEXT, -- JSON array of milestones
      before_img TEXT,
      current_img TEXT
    );

    DROP TABLE IF EXISTS grievances;
    CREATE TABLE grievances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      citizen_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      ward_number INTEGER NOT NULL,
      category TEXT NOT NULL, -- 'water', 'sanitation', 'streetlights', 'roads', 'ration', 'health'
      landmark TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_url TEXT,
      urgency TEXT DEFAULT 'Normal', -- 'Normal', 'High', 'Critical'
      status TEXT DEFAULT 'Submitted', -- 'Submitted', 'Assigned', 'In Progress', 'Resolved'
      assigned_ward_member_id INTEGER,
      assigned_to_name TEXT,
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sla_days INTEGER DEFAULT 3,
      is_escalated INTEGER DEFAULT 0,
      escalation_reason TEXT,
      resolution_remarks TEXT,
      resolution_photo_url TEXT
    );

    DROP TABLE IF EXISTS schemes;
    CREATE TABLE schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      department_en TEXT,
      department_hi TEXT,
      category TEXT,
      financial_aid_en TEXT,
      financial_aid_hi TEXT,
      eligibility_en TEXT,
      eligibility_hi TEXT,
      documents_en TEXT,
      documents_hi TEXT,
      apply_url TEXT
    );

    DROP TABLE IF EXISTS agenda_votes;
    CREATE TABLE agenda_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_hi TEXT NOT NULL,
      submitted_by TEXT,
      ward_number INTEGER,
      description_en TEXT,
      description_hi TEXT,
      votes_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Open For Voting',
      created_at TEXT
    );

    DROP TABLE IF EXISTS village_assets;
    CREATE TABLE village_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_hi TEXT NOT NULL,
      category TEXT NOT NULL,
      ward_number INTEGER,
      condition TEXT, -- 'Excellent', 'Functional', 'Needs Repair', 'Critical'
      coords_x INTEGER,
      coords_y INTEGER,
      lat REAL,
      lng REAL,
      last_inspected TEXT,
      in_charge TEXT
    );
  `);

  console.log('Tables created. Populating seed data for Pipri Gram Panchayat...');

  // 1. Village Profile
  const insertProfile = db.prepare(`
    INSERT INTO village_profile (
      id, name_en, name_hi, block_en, block_hi, district_en, district_hi, state_en, state_hi,
      pin_code, population, households, male_pop, female_pop, literacy_rate, total_area_sqkm,
      wards_count, sarpanch_name_en, sarpanch_name_hi, sarpanch_phone, sarpanch_bio_en, sarpanch_bio_hi,
      secretary_name_en, secretary_name_hi, secretary_phone, office_timing_en, office_timing_hi,
      panchayat_bhavan_address_en, panchayat_bhavan_address_hi
    ) VALUES (
      1, 'Pipri Gram Panchayat', 'पिपरी ग्राम पंचायत',
      'Chunar', 'चुनार', 'Mirzapur', 'मिर्ज़ापुर', 'Uttar Pradesh', 'उत्तर प्रदेश',
      '231304', 3420, 680, 1780, 1640, 78.4, 14.2,
      8, 'Smt. Savita Devi', 'श्रीमती सविता देवी', '+91 94520 18321',
      'Serving as elected Sarpanch since 2021. Championing solar electrification, digital governance, and clean tap water for every household.',
      'वर्ष 2021 से निर्वाचित सरपंच। सौर विद्युतीकरण, डिजिटल सुशासन और हर घर नल जल अभियान की सक्रिय संवाहक।',
      'Shri Rajesh Kumar Sharma', 'श्री राजेश कुमार शर्मा', '+91 98391 44520',
      'Monday to Saturday: 10:00 AM – 5:00 PM', 'सोमवार से शनिवार: सुबह 10:00 बजे से शाम 5:00 बजे तक',
      'Panchayat Bhavan, Near Primary Health Sub-Centre, Main Road, Pipri, Ward 4',
      'पंचायत भवन, प्राथमिक स्वास्थ्य उप-केंद्र के पास, मुख्य मार्ग, पिपरी, वार्ड 4'
    )
  `);
  insertProfile.run();

  // 2. Ward Members (8 Wards)
  const wardMembers = [
    { ward: 1, en: 'Shri Ramswaroop Bind', hi: 'श्री रामस्वरूप बिंद', phone: '+91 91250 11001', area_en: 'Purva Mohalla', area_hi: 'पुरवा मोहल्ला', voters: 430, focus_en: 'Drinking Water & Handpumps', focus_hi: 'पेयजल एवं हैंडपंप रख-रखाव' },
    { ward: 2, en: 'Smt. Malti Devi Patel', hi: 'श्रीमती मालती देवी पटेल', phone: '+91 91250 11002', area_en: 'Kisan Basti & Mandi Road', area_hi: 'किसान बस्ती व मंडी मार्ग', voters: 395, focus_en: 'Agricultural Subsidies & Soil Health', focus_hi: 'कृषि अनुदान एवं मृदा स्वास्थ्य' },
    { ward: 3, en: 'Shri Manoj Kumar Yadav', hi: 'श्री मनोज कुमार यादव', phone: '+91 91250 11003', area_en: 'Harijan Basti & Canal Bank', area_hi: 'हरिजन बस्ती व नहर पटरी', voters: 460, focus_en: 'Concrete Roads & Drainage Work', focus_hi: 'पक्की सीसी रोड एवं नाली निर्माण' },
    { ward: 4, en: 'Shri Dayaram Yadav (Upsarpanch)', hi: 'श्री दयाराम यादव (उपसरपंच)', phone: '+91 91250 11004', area_en: 'Panchayat Chowk & Bazaar', area_hi: 'पंचायत चौक व मुख्य बाज़ार', voters: 490, focus_en: 'Market Infrastructure & Solar Lights', focus_hi: 'बाज़ार व्यवस्था एवं सौर लाइट' },
    { ward: 5, en: 'Smt. Geeta Kushwaha', hi: 'श्रीमती गीता कुशवाहा', phone: '+91 91250 11005', area_en: 'Primary School Tola', area_hi: 'प्राथमिक विद्यालय टोला', voters: 410, focus_en: 'Primary Education & Midday Meal', focus_hi: 'प्राथमिक शिक्षा व मिड-डे मील' },
    { ward: 6, en: 'Shri Akhtar Ali', hi: 'श्री अख़्तर अली', phone: '+91 91250 11006', area_en: 'Naya Tola & Weavers Colony', area_hi: 'नया टोला व बुनकर कॉलोनी', voters: 415, focus_en: 'Sanitation & Solid Waste Management', focus_hi: 'स्वच्छता एवं ठोस कचरा प्रबंधन' },
    { ward: 7, en: 'Smt. Sushila Prajapati', hi: 'श्रीमती सुशीला प्रजापति', phone: '+91 91250 11007', area_en: 'Kumhar Basti & Pond Area', area_hi: 'कुम्हार बस्ती व तालाब क्षेत्र', voters: 380, focus_en: 'Pond Rejuvenation & Women SHGs', focus_hi: 'तालाब जीर्णोद्धार व महिला स्वयं सहायता समूह' },
    { ward: 8, en: 'Shri Dinesh Chandra Mishra', hi: 'श्री दिनेश चंद्र मिश्रा', phone: '+91 91250 11008', area_en: 'Station Road & Temple Sector', area_hi: 'स्टेशन मार्ग व मंदिर परिसर', voters: 440, focus_en: 'Public Health, Anganwadi & Streetlights', focus_hi: 'जन स्वास्थ्य, आंगनवाड़ी व स्ट्रीट लाइट' }
  ];

  const insertWard = db.prepare(`
    INSERT INTO ward_members (
      ward_number, name_en, name_hi, phone, area_name_en, area_name_hi, voters_count, focus_area_en, focus_area_hi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const w of wardMembers) {
    insertWard.run(w.ward, w.en, w.hi, w.phone, w.area_en, w.area_hi, w.voters, w.focus_en, w.focus_hi);
  }

  // 3. Official Notices / Announcements (with bilingual text and audio broadcaster strings)
  const notices = [
    {
      title_en: 'Gram Sabha General Meeting - Next Tuesday at 10:00 AM',
      title_hi: 'ग्राम सभा की आम बैठक - आगामी मंगलवार प्रातः 10:00 बजे',
      category: 'meeting',
      priority: 'urgent',
      issue_date: '2026-11-14',
      authority_en: 'Office of the Sarpanch & Secretary',
      authority_hi: 'कार्यालय सरपंच एवं ग्राम पंचायत सचिव',
      content_en: 'All adult villagers of Pipri Gram Panchayat are earnestly requested to attend the upcoming quarterly Gram Sabha meeting at Panchayat Bhavan. Key agenda items include approving the 2026-27 Village Development Plan (VDP), social audit of Jal Jeevan Mission, allocation of PM Awas beneficiary slots, and prioritizing the new bypass culvert.',
      content_hi: 'पिपरी ग्राम पंचायत के सभी वयस्क ग्रामवासियों से सादर अनुरोध है कि वे आगामी मंगलवार को पंचायत भवन में आयोजित त्रैमासिक ग्राम सभा बैठक में अवश्य पधारें। मुख्य एजेंडे में वित्तीय वर्ष 2026-27 की ग्राम विकास योजना, जल जीवन मिशन का सामाजिक अंकेक्षण, पीएम आवास योजना के नए लाभार्थियों का सत्यापन एवं नहर पुलिया निर्माण शामिल है।',
      meeting_datetime: '2026-11-18 10:00 AM',
      venue_en: 'Panchayat Bhavan Hall, Pipri',
      venue_hi: 'पंचायत भवन प्रांगण, पिपरी',
      audio_text_en: 'Important notice for all residents of Pipri. The general Gram Sabha meeting will be held next Tuesday at 10 AM at Panchayat Bhavan. Please participate in village development decisions.',
      audio_text_hi: 'पिपरी के सभी ग्रामवासियों के लिए महत्वपूर्ण सूचना। ग्राम सभा की आम बैठक आगामी मंगलवार को सुबह 10 बजे पंचायत भवन में होगी। गांव के विकास निर्णयों में अपनी भागीदारी सुनिश्चित करें।'
    },
    {
      title_en: 'Free Cattle & Livestock Foot-and-Mouth Vaccination Drive',
      title_hi: 'पशुधन खुरपका-मुंहपका निःशुल्क टीकाकरण शिविर',
      category: 'health',
      priority: 'normal',
      issue_date: '2026-11-12',
      authority_en: 'Animal Husbandry Department & PHC Pipri',
      authority_hi: 'पशुपालन विभाग एवं प्राथमिक स्वास्थ्य उप-केंद्र',
      content_en: 'A mobile veterinary veterinary medical team will be visiting Wards 1, 2, and 7 on Thursday to administer free prophylactic vaccinations for milch cattle against Foot and Mouth Disease (FMD). Farmers and cattle rearers are advised to bring their cattle to the respective ward collection points between 8:00 AM and 1:00 PM.',
      content_hi: 'गुरुवार को पशु चिकित्सा विभाग की मोबाइल टीम द्वारा वार्ड 1, 2 और 7 में सभी दुधारू पशुओं के लिए खुरपका-मुंहपका रोग से बचाव हेतु निःशुल्क टीकाकरण किया जाएगा। सभी पशुपालक किसान भाई अपने मवेशियों को सुबह 8 बजे से दोपहर 1 बजे के मध्य निर्धारित कैंप स्थल पर लेकर आएं।',
      meeting_datetime: '2026-11-20 08:00 AM',
      venue_en: 'Ward 1 Handpump Chowk & Ward 7 Pond Ground',
      venue_hi: 'वार्ड 1 हैंडपंप चौक एवं वार्ड 7 तालाब प्रांगण',
      audio_text_en: 'Attention cattle owners: Free Foot and Mouth Disease vaccination drive on Thursday in wards 1, 2, and 7 from 8 AM to 1 PM.',
      audio_text_hi: 'पशुपालक ध्यान दें: गुरुवार को वार्ड 1, 2 और 7 में पशुओं का मुफ्त टीकाकरण शिविर लगाया जाएगा। सुबह 8 बजे अपने पशु अवश्य लाएं।'
    },
    {
      title_en: 'PM-Kisan Samman Nidhi 18th Installment e-KYC Verification Camp',
      title_hi: 'प्रधानमंत्री किसान सम्मान निधि 18वीं किस्त: बायोमेट्रिक ई-केवाईसी शिविर',
      category: 'agriculture',
      priority: 'urgent',
      issue_date: '2026-11-10',
      authority_en: 'Common Service Centre (CSC) & Panchayat Sahayak',
      authority_hi: 'जन सेवा केंद्र (CSC) एवं पंचायत सहायक',
      content_en: 'Beneficiary farmers who have not completed biometric iris or fingerprint e-KYC for PM-Kisan Samman Nidhi will not receive their upcoming Rs 2,000 installment. A dedicated 3-day desk is active at Panchayat Bhavan from 9:00 AM to 4:00 PM. Please bring Aadhaar card and linked mobile.',
      content_hi: 'जिन किसान भाइयों का पीएम किसान सम्मान निधि का ई-केवाईसी अभी तक अधूरा है, वे तत्काल पंचायत भवन पहुंचकर बायोमेट्रिक सत्यापन करा लें अन्यथा अगली किस्त रुक सकती है। यह शिविर प्रतिदिन सुबह 9 बजे से शाम 4 बजे तक खुला है। आधार कार्ड और बैंक पासबुक साथ लाएं।',
      meeting_datetime: '2026-11-11 to 2026-11-14',
      venue_en: 'Panchayat Bhavan CSC Counter',
      venue_hi: 'पंचायत भवन जन सेवा केंद्र काउंटर',
      audio_text_en: 'Farmers alert: Complete your PM Kisan e-KYC verification at the Panchayat Bhavan counter to receive your next financial installment.',
      audio_text_hi: 'किसान बंधु ध्यान दें: पीएम किसान की अगली किस्त पाने हेतु पंचायत भवन में अपना ई-केवाईसी अनिवार्य रूप से पूरा करा लें।'
    },
    {
      title_en: 'Mission Indradhanush: Child Immunization & Nutrition Day',
      title_hi: 'मिशन इंद्रधनुष: बाल टीकाकरण एवं पोषण दिवस',
      category: 'health',
      priority: 'normal',
      issue_date: '2026-11-08',
      authority_en: 'Anganwadi Workers & ASHA Sangini Team',
      authority_hi: 'आंगनवाड़ी कार्यकर्ती एवं आशा संगिनी टीम',
      content_en: 'Every Wednesday is village immunization day. Children aged 0 to 5 years will receive measles, rubella, and polio booster doses. Pregnant and lactating mothers will also receive iron-folic supplements and health counseling at Anganwadi Centre #1 (Ward 5).',
      content_hi: 'आगामी बुधवार को वार्ड 5 स्थित आंगनवाड़ी केंद्र 1 पर 0 से 5 वर्ष के शिशुओं हेतु नियमित टीकाकरण एवं गर्भवती माताओं हेतु स्वास्थ्य जांच व पोषण परामर्श शिविर आयोजित किया जाएगा। समय: सुबह 9:30 से दोपहर 2:00 बजे।',
      meeting_datetime: 'Every Wednesday',
      venue_en: 'Anganwadi Centre #1 (Ward 5)',
      venue_hi: 'आंगनवाड़ी केंद्र संख्या 1 (वार्ड 5)',
      audio_text_en: 'Child Immunization day this Wednesday at Anganwadi Centre 1. Bring infants for scheduled vaccines.',
      audio_text_hi: 'बुधवार को आंगनवाड़ी केंद्र 1 पर बच्चों का नियमित टीकाकरण दिवस है। 0 से 5 साल के बच्चों को समय पर टीका लगवाएं।'
    },
    {
      title_en: 'Free Solar Lamp Subsidy Registration for BPL Families',
      title_hi: 'बीपीएल परिवारों हेतु निःशुल्क सौर लालटेन एवं होम लाइटिंग पंजीकरण',
      category: 'subsidy',
      priority: 'normal',
      issue_date: '2026-11-05',
      authority_en: 'Renewable Energy Agency (UPNEDA) & Gram Panchayat',
      authority_hi: 'नवीन एवं नवीकरणीय ऊर्जा विकास अभिकरण व ग्राम पंचायत',
      content_en: 'Under the state off-grid solar scheme, 120 Antyodaya and BPL families are eligible for solar home LED kits and emergency lantern units. Submit ration card copy and electricity absence declaration to Ward Member #6 or the Panchayat Secretary before end of month.',
      content_hi: 'राज्य नवीकरणीय ऊर्जा योजना अंतर्गत 120 निर्धन व अंत्योदय कार्डधारक परिवारों को सोलर होम लाइट किट उपलब्ध कराई जा रही है। पात्र परिवार अपने राशन कार्ड की प्रतिलिपि पंचायत सचिव को प्रस्तुत करें।',
      meeting_datetime: 'Till 2026-11-30',
      venue_en: 'Ward 6 Office & Panchayat Bhavan',
      venue_hi: 'वार्ड 6 कार्यालय एवं पंचायत भवन',
      audio_text_en: 'Solar home light applications are now open for BPL families. Submit ration card copy at Panchayat Bhavan.',
      audio_text_hi: 'बीपीएल परिवारों के लिए सोलर होम लाइट योजना का आवेदन शुरू है। राशन कार्ड की प्रति के साथ पंचायत भवन में आवेदन करें।'
    }
  ];

  const insertNotice = db.prepare(`
    INSERT INTO notices (
      title_en, title_hi, category, priority, issue_date, authority_en, authority_hi,
      content_en, content_hi, meeting_datetime, venue_en, venue_hi, audio_text_en, audio_text_hi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const n of notices) {
    insertNotice.run(
      n.title_en, n.title_hi, n.category, n.priority, n.issue_date, n.authority_en, n.authority_hi,
      n.content_en, n.content_hi, n.meeting_datetime, n.venue_en, n.venue_hi, n.audio_text_en, n.audio_text_hi
    );
  }

  // 4. Village Development Projects & Budget Tracker (6 Projects, itemized budgets)
  const projects = [
    {
      title_en: 'Paved Concrete Road Construction (Ward 3 to Canal Bridge)',
      title_hi: 'पक्की सीसी सड़क निर्माण कार्य (वार्ड 3 से नहर पुल तक)',
      category: 'roads',
      ward: 3,
      sanctioned_budget: 450000,
      spent_amount: 360000,
      completion_pct: 80,
      status: 'In Progress',
      contractor: 'M/s Maa Vindhyavasini Infracon',
      start_date: '2026-08-15',
      target_date: '2026-12-15',
      desc_en: '850-meter heavy-duty interlocking concrete road with reinforced side shoulders connecting Harijan Basti to the main canal road, facilitating tractor movement during paddy harvesting.',
      desc_hi: '850 मीटर लंबी इंटरलॉकिंग सीमेंट कंक्रीट सड़क का निर्माण, जिससे धान कटाई के समय किसानों के ट्रैक्टर व वाहन बिना कीचड़ के मुख्य नहर मार्ग तक सुगमता से पहुंच सकें।',
      milestones: JSON.stringify([
        { name: 'Earth leveling & sub-base grading', done: true, date: '2026-09-02' },
        { name: 'Gravel laying & compaction', done: true, date: '2026-10-10' },
        { name: 'CC interlocking block placement (680m)', done: true, date: '2026-11-05' },
        { name: 'Side drain integration & curing', done: false, date: 'Target: 2026-12-10' }
      ]),
      before_img: 'road_before.jpg',
      current_img: 'road_progress.jpg'
    },
    {
      title_en: 'Solar High-Mast & Streetlight Installation (40 Units)',
      title_hi: 'सौर हाई-मास्ट एवं स्ट्रीट लाइट स्थापना (40 इकाइयां)',
      category: 'lighting',
      ward: 0, // All Wards
      sanctioned_budget: 320000,
      spent_amount: 304000,
      completion_pct: 95,
      status: 'Near Completion',
      contractor: 'Surya Urja Vikas LLP',
      start_date: '2026-09-01',
      target_date: '2026-11-25',
      desc_en: 'Erection of 2 high-mast solar towers at Panchayat Chowk and Mandi, plus 38 standalone 40W dusk-to-dawn LED pole lights across dark alleyways in Wards 1, 4, 6, and 8.',
      desc_hi: 'पंचायत चौक व मंडी में 2 हाई-मास्ट सोलर टावर तथा वार्ड 1, 4, 6 एवं 8 की अंधेरी गलियों में 38 सोलर स्ट्रीट लाइट की स्थापना। 38 खंभे क्रियाशील हो चुके हैं।',
      milestones: JSON.stringify([
        { name: 'Pole foundation casting', done: true, date: '2026-09-20' },
        { name: 'PV panel & battery installation', done: true, date: '2026-10-18' },
        { name: 'Trial illumination & sensor calibration', done: true, date: '2026-11-02' },
        { name: 'Final hand-over & warranty certification', done: false, date: 'Target: 2026-11-25' }
      ]),
      before_img: 'lights_before.jpg',
      current_img: 'lights_after.jpg'
    },
    {
      title_en: 'Composite School Modern Sanitation Block & Running Tap Water',
      title_hi: 'कंपोजिट विद्यालय आधुनिक स्वच्छता परिसर एवं नल-जल व्यवस्था',
      category: 'sanitation',
      ward: 5,
      sanctioned_budget: 280000,
      spent_amount: 196000,
      completion_pct: 70,
      status: 'In Progress',
      contractor: 'Pipri Village Construction Committee',
      start_date: '2026-09-10',
      target_date: '2026-12-30',
      desc_en: 'Construction of segregated 4-stall sanitation facility (2 for girls, 2 for boys) with incinerator, tiled handwashing stations, overhead 1000L Sintex tank, and submersible pump.',
      desc_hi: 'बालक व बालिकाओं हेतु अलग-अलग 4-शौचालय परिसर, इंसिनरेटर, टाइल युक्त हाथ धुलाई स्टेशन, 1000 लीटर ओवरहेड टंकी और सबमर्सिबल पंप की स्थापना।',
      milestones: JSON.stringify([
        { name: 'Foundation masonry & septic pit excavation', done: true, date: '2026-09-28' },
        { name: 'Brickwork & roof slab casting', done: true, date: '2026-10-25' },
        { name: 'Plumbing & sanitary ware fittings', done: false, date: 'In Progress' },
        { name: 'Wall tiling, painting & solar motor link', done: false, date: 'Target: 2026-12-25' }
      ]),
      before_img: 'school_before.jpg',
      current_img: 'school_progress.jpg'
    },
    {
      title_en: 'Underground Covered Drainage Canal (Purva to River Outfall)',
      title_hi: 'भूमिगत पक्की नाली एवं जलनिकासी चैनल (पुरवा से नदी निकास)',
      category: 'sanitation',
      ward: 1,
      sanctioned_budget: 520000,
      spent_amount: 260000,
      completion_pct: 50,
      status: 'In Progress',
      contractor: 'Gram Vikas Thekedar Sangh',
      start_date: '2026-10-01',
      target_date: '2027-01-20',
      desc_en: 'Permanent covered brick-mortar drainage channel to eliminate monsoon stagnation, mosquito breeding, and wastewater overflow across 60 residential houses.',
      desc_hi: 'बरसात के पानी और घरेलू गंदे पानी के निकास हेतु 1.2 किमी लंबी आरसीसी ढकी हुई नाली का निर्माण, जिससे संक्रामक बीमारियों की रोकथाम होगी।',
      milestones: JSON.stringify([
        { name: 'Survey & trench grading', done: true, date: '2026-10-12' },
        { name: 'Base PCC and side wall masonry', done: true, date: '2026-11-04' },
        { name: 'Pre-cast RCC cover slab casting', done: false, date: 'In Progress' },
        { name: 'Silt trap chamber & outfall weir', done: false, date: 'Target: 2027-01-15' }
      ]),
      before_img: 'drain_before.jpg',
      current_img: 'drain_progress.jpg'
    },
    {
      title_en: 'Jal Jeevan Mission Solar RO Water ATM & Pipeline Extension',
      title_hi: 'जल जीवन मिशन सौर आरओ वॉटर एटीएम एवं पाइपलाइन विस्तार',
      category: 'water',
      ward: 4,
      sanctioned_budget: 680000,
      spent_amount: 680000,
      completion_pct: 100,
      status: 'Completed',
      contractor: 'UP Jal Nigam & Gram Panchayat',
      start_date: '2026-05-01',
      target_date: '2026-10-15',
      desc_en: '1000 LPH multi-stage Reverse Osmosis filtration unit operating on 5kW rooftop solar panels, dispensing chilled, mineral-tested safe water at 20 paise per litre with smart card.',
      desc_hi: '5 किलोवाट सोलर संयंत्र से संचालित 1000 लीटर प्रति घंटा क्षमता का आरओ वाटर एटीएम। स्मार्ट कार्ड से 20 पैसे प्रति लीटर की दर से शुद्ध व शीतल पेयजल उपलब्ध।',
      milestones: JSON.stringify([
        { name: 'Borewell drilling (220 ft)', done: true, date: '2026-05-20' },
        { name: 'Water testing lab approval', done: true, date: '2026-06-15' },
        { name: 'RO plant housing & solar array', done: true, date: '2026-08-30' },
        { name: 'Public inauguration & smart card rollout', done: true, date: '2026-10-15' }
      ]),
      before_img: 'water_before.jpg',
      current_img: 'water_after.jpg'
    },
    {
      title_en: 'Anganwadi Model Child Development Centre Renovation',
      title_hi: 'आंगनवाड़ी मॉडल बाल विकास केंद्र का कायाकल्प एवं नवीनीकरण',
      category: 'building',
      ward: 7,
      sanctioned_budget: 180000,
      spent_amount: 72000,
      completion_pct: 40,
      status: 'In Progress',
      contractor: 'Mahila Utthan Sahakari Samiti',
      start_date: '2026-10-20',
      target_date: '2026-12-31',
      desc_en: 'Child-friendly Bala painting, waterproof roofing, anti-skid rubber flooring, toddler toilet, educational charts, and nutrition storage cupboard.',
      desc_hi: 'बच्चों हेतु बाल-मित्र बाला पेंटिंग, वाटरप्रूफिंग छत, रबर मैट फ़्लोरिंग, बाल सुलभ शौचालय तथा पोषण सामग्री हेतु अलमारी की व्यवस्था।',
      milestones: JSON.stringify([
        { name: 'Roof plastering & damp proofing', done: true, date: '2026-10-31' },
        { name: 'Window grille & door replacement', done: true, date: '2026-11-09' },
        { name: 'Wall art & interior rubber flooring', done: false, date: 'In Progress' },
        { name: 'Play learning materials setup', done: false, date: 'Target: 2026-12-25' }
      ]),
      before_img: 'angan_before.jpg',
      current_img: 'angan_progress.jpg'
    }
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (
      title_en, title_hi, category, ward_number, sanctioned_budget, spent_amount,
      completion_pct, status, contractor_name, start_date, target_date,
      description_en, description_hi, milestones, before_img, current_img
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of projects) {
    insertProject.run(
      p.title_en, p.title_hi, p.category, p.ward, p.sanctioned_budget, p.spent_amount,
      p.completion_pct, p.status, p.contractor, p.start_date, p.target_date,
      p.desc_en, p.desc_hi, p.milestones, p.before_img, p.current_img
    );
  }

  // 5. Citizen Grievances (8 Realistic Complaints, various stages & SLA status)
  const grievances = [
    {
      token: 'GP-PIPRI-2026-8012',
      name: 'Rameshwar Prasad Bind',
      phone: '+91 94152 77011',
      ward: 1,
      category: 'water',
      landmark: 'Near Old Banyan Tree, Purva',
      desc: 'Community handpump handle is loose and pumping muddy brownish water for 3 days. 25 families rely on this for cattle and washing.',
      urgency: 'Critical',
      status: 'In Progress',
      assigned_id: 1,
      assigned_name: 'Shri Ramswaroop Bind (Ward 1)',
      submitted_at: '2026-11-13 09:30:00',
      updated_at: '2026-11-14 11:20:00',
      sla_days: 2,
      escalated: 0,
      esc_reason: null,
      remarks: 'Jal Nigam mechanic deputed with replacement cylinder and washer gasket. Work underway.',
      res_photo: null
    },
    {
      token: 'GP-PIPRI-2026-8025',
      name: 'Santosh Kumar Maurya',
      phone: '+91 98380 44122',
      ward: 4,
      category: 'streetlights',
      landmark: 'Bazaar Chowk, in front of Gupta General Store',
      desc: 'Solar pole streetlight LED bulb flickering erratically and turning off completely after 8 PM, leaving the main market alley pitch dark.',
      urgency: 'High',
      status: 'Submitted',
      assigned_id: null,
      assigned_name: null,
      submitted_at: '2026-11-15 16:45:00',
      updated_at: '2026-11-15 16:45:00',
      sla_days: 3,
      escalated: 0,
      esc_reason: null,
      remarks: null,
      res_photo: null
    },
    {
      token: 'GP-PIPRI-2026-7954',
      name: 'Kamla Devi',
      phone: '+91 99360 88231',
      ward: 3,
      category: 'roads',
      landmark: 'Behind Primary School boundary, Ward 3',
      desc: 'Contractor dumped leftover gravel heap blocking the pedestrian cart track. School children and elders slipping during night.',
      urgency: 'Normal',
      status: 'Assigned',
      assigned_id: 3,
      assigned_name: 'Shri Manoj Kumar Yadav (Ward 3)',
      submitted_at: '2026-11-14 10:15:00',
      updated_at: '2026-11-15 08:30:00',
      sla_days: 7,
      escalated: 0,
      esc_reason: null,
      remarks: 'Notice issued to contractor Maa Vindhyavasini Infracon to clear debris within 24 hours.',
      res_photo: null
    },
    {
      token: 'GP-PIPRI-2026-7880',
      name: 'Harishankar Tiwari',
      phone: '+91 91400 33890',
      ward: 6,
      category: 'sanitation',
      landmark: 'Near Weavers Community Shed, Naya Tola',
      desc: 'Open drain overflowing onto the unpaved street due to plastic blockage. Foul smell and dengue mosquito breeding hazard.',
      urgency: 'Critical',
      status: 'In Progress',
      assigned_id: 6,
      assigned_name: 'Shri Akhtar Ali (Ward 6)',
      submitted_at: '2026-11-10 14:00:00',
      updated_at: '2026-11-12 10:00:00',
      sla_days: 4,
      escalated: 1, // Exceeded 4 days
      esc_reason: 'SLA Escalation: Over 5 days since filing without resolution. Alert dispatched to Block Development Officer (BDO).',
      remarks: 'Sanitation safai karmi team dispatched with desilting equipment and anti-larval spray.',
      res_photo: null
    },
    {
      token: 'GP-PIPRI-2026-7721',
      name: 'Phoolmati Devi',
      phone: '+91 94500 55182',
      ward: 2,
      category: 'ration',
      landmark: 'Fair Price Ration Shop (Kisan Basti)',
      desc: 'Ration dealer refused foodgrains claiming biometric machine network error for 4 days in a row.',
      urgency: 'High',
      status: 'Resolved',
      assigned_id: 2,
      assigned_name: 'Smt. Malti Devi Patel (Ward 2)',
      submitted_at: '2026-11-06 11:00:00',
      updated_at: '2026-11-08 17:00:00',
      sla_days: 5,
      escalated: 0,
      esc_reason: null,
      remarks: 'Ward member accompanied citizen. Dealer issued manual register receipt and provided full 35kg grain quota in presence of Food Inspector.',
      res_photo: 'ration_resolved.jpg'
    },
    {
      token: 'GP-PIPRI-2026-7640',
      name: 'Mohammad Shamim',
      phone: '+91 97920 66319',
      ward: 8,
      category: 'streetlights',
      landmark: 'Station link road, near Shiv Temple gate',
      desc: 'Two sodium lamps burnt out during lightning storm last week. Dark spot near women bathing ghat.',
      urgency: 'Normal',
      status: 'Resolved',
      assigned_id: 8,
      assigned_name: 'Shri Dinesh Chandra Mishra (Ward 8)',
      submitted_at: '2026-11-04 15:30:00',
      updated_at: '2026-11-07 14:15:00',
      sla_days: 3,
      escalated: 0,
      esc_reason: null,
      remarks: 'Both fittings replaced with energy efficient 40W Surya Urja LED units. Checked working.',
      res_photo: 'light_fixed.jpg'
    },
    {
      token: 'GP-PIPRI-2026-8039',
      name: 'Lalji Prajapati',
      phone: '+91 93350 12847',
      ward: 7,
      category: 'water',
      landmark: 'Near Ward 7 Pond ghat, Kumhar Mohalla',
      desc: 'Standpost tap pipe cracked by passing tractor, clean drinking water continuously leaking on the road.',
      urgency: 'High',
      status: 'Submitted',
      assigned_id: null,
      assigned_name: null,
      submitted_at: '2026-11-16 08:10:00',
      updated_at: '2026-11-16 08:10:00',
      sla_days: 2,
      escalated: 0,
      esc_reason: null,
      remarks: null,
      res_photo: null
    },
    {
      token: 'GP-PIPRI-2026-7815',
      name: 'Sunita Kushwaha',
      phone: '+91 96210 99403',
      ward: 5,
      category: 'health',
      landmark: 'Near Anganwadi Centre 2',
      desc: 'Stock of iron folic acid syrup and baby weighing scale unavailable for 3 weeks.',
      urgency: 'Normal',
      status: 'Resolved',
      assigned_id: 5,
      assigned_name: 'Smt. Geeta Kushwaha (Ward 5)',
      submitted_at: '2026-11-07 09:00:00',
      updated_at: '2026-11-11 12:00:00',
      sla_days: 3,
      escalated: 0,
      esc_reason: null,
      remarks: 'Fresh medical nutrition inventory requisitioned and received from Block PHC Chunar. Distributed to mothers.',
      res_photo: 'health_resolved.jpg'
    }
  ];

  const insertGrievance = db.prepare(`
    INSERT INTO grievances (
      token, citizen_name, phone, ward_number, category, landmark, description,
      urgency, status, assigned_ward_member_id, assigned_to_name,
      submitted_at, updated_at, sla_days, is_escalated, escalation_reason,
      resolution_remarks, resolution_photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const g of grievances) {
    insertGrievance.run(
      g.token, g.name, g.phone, g.ward, g.category, g.landmark, g.desc,
      g.urgency, g.status, g.assigned_id, g.assigned_name,
      g.submitted_at, g.updated_at, g.sla_days, g.escalated, g.esc_reason,
      g.remarks, g.res_photo
    );
  }

  // 6. Schemes Directory
  const schemes = [
    {
      name_en: 'Pradhan Mantri Awas Yojana (PMAY-Gramin)',
      name_hi: 'प्रधानमंत्री आवास योजना (ग्रामीण)',
      dept_en: 'Ministry of Rural Development',
      dept_hi: 'ग्रामीण विकास मंत्रालय',
      cat: 'Housing',
      aid_en: '₹1,20,000 direct subsidy + 90 days MGNREGA wages (₹21,000) + ₹12,000 for toilet',
      aid_hi: '₹1,20,000 सीधी सब्सिडी + 90 दिन मनरेगा मजदूरी (₹21,000) + ₹12,000 शौचालय निर्माण',
      elig_en: 'Houseless households and families living in kutcha/dilapidated homes as per SECC 2011 & Awas+ list.',
      elig_hi: 'कच्चे या जीर्ण-शीर्ण मकानों में रहने वाले बीपीएल परिवार जिनका नाम आवास+ सूची में दर्ज है।',
      docs_en: 'Aadhaar Card, Bank Passbook, Ration Card, Land possession certificate, Photo of kutcha house.',
      docs_hi: 'आधार कार्ड, बैंक पासबुक, राशन कार्ड, भूमि दस्तावेज, वर्तमान कच्चे घर का फोटो।',
      apply_url: 'https://pmayg.nic.in'
    },
    {
      name_en: 'Jal Jeevan Mission (Har Ghar Jal)',
      name_hi: 'जल जीवन मिशन (हर घर जल योजना)',
      dept_en: 'Department of Drinking Water and Sanitation',
      dept_hi: 'पेयजल एवं स्वच्छता विभाग',
      cat: 'Water',
      aid_en: '100% free individual Functional Household Tap Connection (FHTC) providing 55 LPCD potable water.',
      aid_hi: 'प्रत्येक ग्रामीण घर को निःशुल्क नल कनेक्शन, प्रतिदिन 55 लीटर प्रति व्यक्ति शुद्ध पेयजल।',
      elig_en: 'Every rural household in Pipri Gram Panchayat without an existing piped metered connection.',
      elig_hi: 'पिपरी ग्राम पंचायत का प्रत्येक परिवार जिसके घर में पहले से नल कनेक्शन नहीं है।',
      docs_en: 'Aadhaar Card, Electricity Bill/Gram Panchayat Tax Receipt, Mobile Number.',
      docs_hi: 'आधार कार्ड, बिजली बिल या पंचायत टैक्स रसीद, मोबाइल नंबर।',
      apply_url: 'https://ejalshakti.gov.in'
    },
    {
      name_en: 'Mahatma Gandhi NREGA (100 Days Guaranteed Wage Employment)',
      name_hi: 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी (मनरेगा)',
      dept_en: 'Ministry of Rural Development',
      dept_hi: 'ग्रामीण विकास मंत्रालय',
      cat: 'Livelihood',
      aid_en: '100 days guaranteed unskilled manual work @ ₹237/day, direct bank credit within 15 days.',
      aid_hi: 'प्रत्येक परिवार को 100 दिन अकुशल शारीरिक श्रम रोजगार @ ₹237 प्रतिदिन, सीधे बैंक खाते में भुगतान।',
      elig_en: 'Any adult rural resident willing to do manual unskilled work within 5 km of village.',
      elig_hi: 'गांव का कोई भी वयस्क नागरिक जो अकुशल मजदूरी कार्य करने का इच्छुक हो।',
      docs_en: 'Family Job Card, Aadhaar Card, Active Bank Account with DBT enabled.',
      docs_hi: 'परिवार जॉब कार्ड, आधार कार्ड, डीबीटी सक्रिय बैंक खाता।',
      apply_url: 'https://nrega.nic.in'
    },
    {
      name_en: 'PM-Kisan Samman Nidhi Yojana',
      name_hi: 'पीएम किसान सम्मान निधि योजना',
      dept_en: 'Ministry of Agriculture and Farmers Welfare',
      dept_hi: 'कृषि एवं किसान कल्याण मंत्रालय',
      cat: 'Agriculture',
      aid_en: '₹6,000 per year paid in three equal installments of ₹2,000 directly via DBT.',
      aid_hi: '₹6,000 प्रतिवर्ष (₹2,000 की तीन समान किस्तों में) सीधे बैंक खाते में।',
      elig_en: 'Small and marginal landholder farmer families with cultivable land up to 2 hectares.',
      elig_hi: 'खेती योग्य भूमि रखने वाले सभी पात्र कृषक परिवार।',
      docs_en: 'Land Khatauni (Khasra/Khata), Aadhaar Card, Bank Passbook, Mobile linked with Aadhaar.',
      docs_hi: 'भूलेख खतौनी, आधार कार्ड, बैंक पासबुक, आधार लिंक मोबाइल।',
      apply_url: 'https://pmkisan.gov.in'
    },
    {
      name_en: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
      name_hi: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (गोल्डन कार्ड)',
      dept_en: 'National Health Authority',
      dept_hi: 'राष्ट्रीय स्वास्थ्य प्राधिकरण',
      cat: 'Health',
      aid_en: 'Free cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per year.',
      aid_hi: 'प्रति परिवार प्रति वर्ष ₹5,00,000 तक का निःशुल्क कैशलेस अस्पताल उपचार कवर।',
      elig_en: 'Deprived rural households identified under Socio-Economic Caste Census (SECC 2011).',
      elig_hi: 'सामाजिक आर्थिक जनगणना (SECC) में सूचीबद्ध चिन्हित ग्रामीण परिवार।',
      docs_en: 'Ration Card, Aadhaar Card of all family members, Mobile OTP.',
      docs_hi: 'राशन कार्ड, परिवार के सभी सदस्यों का आधार कार्ड, मोबाइल।',
      apply_url: 'https://beneficiary.nha.gov.in'
    },
    {
      name_en: 'Swachh Bharat Mission (Gramin) Individual Household Latrine (IHHL)',
      name_hi: 'स्वच्छ भारत मिशन (ग्रामीण) व्यक्तिगत शौचालय निर्माण प्रोत्साहन',
      dept_en: 'Ministry of Jal Shakti',
      dept_hi: 'जल शक्ति मंत्रालय',
      cat: 'Sanitation',
      aid_en: '₹12,000 incentive for constructing twin-pit water-seal eco-friendly household latrine.',
      aid_hi: 'व्यक्तिगत घरेलू शौचालय निर्माण हेतु ₹12,000 की प्रोत्साहन राशि।',
      elig_en: 'Rural households without an existing toilet facility or newly separated joint families.',
      elig_hi: 'ऐसे ग्रामीण परिवार जिनके घर में अभी तक शौचालय नहीं है।',
      docs_en: 'Aadhaar Card, Bank Account details, Photo of newly constructed latrine with beneficiary.',
      docs_hi: 'आधार कार्ड, बैंक खाता विवरण, निर्मित शौचालय के साथ लाभार्थी का फोटो।',
      apply_url: 'https://sbm.gov.in'
    }
  ];

  const insertScheme = db.prepare(`
    INSERT INTO schemes (
      name_en, name_hi, department_en, department_hi, category, financial_aid_en, financial_aid_hi,
      eligibility_en, eligibility_hi, documents_en, documents_hi, apply_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of schemes) {
    insertScheme.run(
      s.name_en, s.name_hi, s.dept_en, s.dept_hi, s.cat, s.aid_en, s.aid_hi,
      s.elig_en, s.elig_hi, s.docs_en, s.docs_hi, s.apply_url
    );
  }

  // 7. Gram Sabha Community Agenda Proposals & Voting (Stretch Feature)
  const agendas = [
    {
      title_en: 'Solar-Powered Irrigation Borewell for Small Farmers in Ward 2',
      title_hi: 'वार्ड 2 में लघु किसानों हेतु सौर ऊर्जा चालित सामुदायिक सिंचाई नलकूप',
      submitted_by: 'Bhairo Nath Patel',
      ward: 2,
      desc_en: 'Over 40 marginal farmers face parched crops during summer due to erratic grid electricity. A 10HP solar pump near the pond can irrigate 65 acres sustainably.',
      desc_hi: 'गर्मी के मौसम में बिजली कटौती के कारण फसलें सूख जाती हैं। तालाब के पास 10HP सोलर पंप लगाने से 65 एकड़ भूमि को भरपूर पानी मिलेगा।',
      votes: 142,
      status: 'Included in Agenda',
      created_at: '2026-11-01'
    },
    {
      title_en: 'Digital Village Library & Competitive Exam Reading Room at Panchayat Bhavan',
      title_hi: 'पंचायत भवन में डिजिटल ग्रामीण पुस्तकालय एवं प्रतियोगी परीक्षा वाचनालय',
      submitted_by: 'Ankit Bind (Youth Representative)',
      ward: 4,
      desc_en: 'Rural youth have to travel 18 km to Chunar town for internet and books. Allocating the first-floor hall with 6 computers and competitive books will benefit 200+ students.',
      desc_hi: 'गांव के युवाओं को पढ़ाई के लिए 18 किमी दूर चुनार जाना पड़ता है। पहली मंजिल पर 6 कंप्यूटर व पुस्तकों के साथ पुस्तकालय स्थापित किया जाए।',
      votes: 188,
      status: 'Open For Voting',
      created_at: '2026-11-05'
    },
    {
      title_en: 'CCTV Surveillance & High-Mast Floodlight at Weekly Village Haat',
      title_hi: 'साप्ताहिक ग्रामीण हाट-बाज़ार में सीसीटीवी कैमरे एवं हाई-मास्ट फ्लडलाइट',
      submitted_by: 'Mata Prasad Gupta',
      ward: 4,
      desc_en: 'Prevent petty thefts, pickpocketing, and ensure safety for women vegetable vendors during evening haat hours on Mondays and Fridays.',
      desc_hi: 'सोमवार व शुक्रवार के साप्ताहिक हाट में महिलाओं की सुरक्षा एवं चोरी की घटनाओं की रोकथाम हेतु सीसीटीवी व फ्लडलाइट आवश्यक है।',
      votes: 95,
      status: 'Open For Voting',
      created_at: '2026-11-08'
    },
    {
      title_en: 'Veterinary First-Aid Medicine Stock & Mobile Doctor Visit Twice a Month',
      title_hi: 'पशु प्राथमिक चिकित्सा दवा स्टॉक एवं महीने में दो बार मोबाइल डॉक्टर भ्रमण',
      submitted_by: 'Santosh Yadav',
      ward: 8,
      desc_en: 'Emergency treatment for bloat and milk fever in cows/buffaloes often gets delayed, causing livestock mortality. Village stock of life-saving injectables needed.',
      desc_hi: 'पशुओं में अचानक होने वाली गंभीर बीमारियों में समय पर डॉक्टर न मिलने से भारी हानि होती है। गांव में आवश्यक दवाओं का स्टॉक रखा जाए।',
      votes: 114,
      status: 'Open For Voting',
      created_at: '2026-11-10'
    }
  ];

  const insertAgenda = db.prepare(`
    INSERT INTO agenda_votes (
      title_en, title_hi, submitted_by, ward_number, description_en, description_hi, votes_count, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of agendas) {
    insertAgenda.run(a.title_en, a.title_hi, a.submitted_by, a.ward, a.desc_en, a.desc_hi, a.votes, a.status, a.created_at);
  }

  // 8. Village Assets Geo-Inventory (Stretch Feature: Interactive Map)
  const assets = [
    {
      name_en: 'Panchayat Bhavan & Digital Seva Kendra',
      name_hi: 'पंचायत भवन एवं डिजिटल सेवा केंद्र',
      category: 'governance',
      ward: 4,
      condition: 'Excellent',
      coords_x: 50,
      coords_y: 45,
      lat: 25.1245,
      lng: 82.8710,
      inspected: '2026-11-01',
      in_charge: 'Rajesh Kumar Sharma (Secretary)'
    },
    {
      name_en: 'Primary Health Sub-Centre (PHSC Pipri)',
      name_hi: 'प्राथमिक स्वास्थ्य उप-केंद्र (पीएचएससी पिपरी)',
      category: 'health',
      ward: 4,
      condition: 'Functional',
      coords_x: 44,
      coords_y: 42,
      lat: 25.1238,
      lng: 82.8702,
      inspected: '2026-10-25',
      in_charge: 'Dr. ANM Sunita Rao'
    },
    {
      name_en: 'Government Composite Primary & Junior School',
      name_hi: 'शासकीय कंपोजिट प्राथमिक एवं पूर्व माध्यमिक विद्यालय',
      category: 'education',
      ward: 5,
      condition: 'Needs Repair',
      coords_x: 68,
      coords_y: 35,
      lat: 25.1280,
      lng: 82.8765,
      inspected: '2026-11-05',
      in_charge: 'Principal Brijesh Tiwari'
    },
    {
      name_en: 'Anganwadi Model Centre #1',
      name_hi: 'आंगनवाड़ी मॉडल केंद्र संख्या 1',
      category: 'education',
      ward: 5,
      condition: 'Excellent',
      coords_x: 72,
      coords_y: 38,
      lat: 25.1285,
      lng: 82.8772,
      inspected: '2026-11-08',
      in_charge: 'Shashi Devi (Anganwadi Worker)'
    },
    {
      name_en: 'Jal Jeevan Mission Solar RO Water ATM',
      name_hi: 'जल जीवन मिशन सौर आरओ वॉटर एटीएम प्लांट',
      category: 'water',
      ward: 4,
      condition: 'Excellent',
      coords_x: 52,
      coords_y: 50,
      lat: 25.1248,
      lng: 82.8715,
      inspected: '2026-11-12',
      in_charge: 'Kailash Bind (Plant Operator)'
    },
    {
      name_en: 'Deep Borewell Community Pump #4',
      name_hi: 'सामुदायिक गहरा नलकूप पंप संख्या 4',
      category: 'water',
      ward: 1,
      condition: 'Critical',
      coords_x: 25,
      coords_y: 60,
      lat: 25.1210,
      lng: 82.8640,
      inspected: '2026-11-14',
      in_charge: 'Ramswaroop Bind (Ward Member)'
    },
    {
      name_en: 'Solar Micro-Grid Power Station (25 kW)',
      name_hi: 'सौर मिनी-ग्रिड विद्युत उत्पादन केंद्र (25 kW)',
      category: 'power',
      ward: 8,
      condition: 'Functional',
      coords_x: 82,
      coords_y: 75,
      lat: 25.1298,
      lng: 82.8820,
      inspected: '2026-10-30',
      in_charge: 'Surya Urja Vikas Technician'
    },
    {
      name_en: 'Solid & Liquid Waste Resource Centre (SLWM)',
      name_hi: 'ठोस एवं तरल अपशिष्ट संसाधन प्रबंधन केंद्र',
      category: 'sanitation',
      ward: 6,
      condition: 'Functional',
      coords_x: 35,
      coords_y: 28,
      lat: 25.1220,
      lng: 82.8680,
      inspected: '2026-11-03',
      in_charge: 'Akhtar Ali (Ward Member)'
    }
  ];

  const insertAsset = db.prepare(`
    INSERT INTO village_assets (
      name_en, name_hi, category, ward_number, condition, coords_x, coords_y, lat, lng, last_inspected, in_charge
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const as of assets) {
    insertAsset.run(as.name_en, as.name_hi, as.category, as.ward, as.condition, as.coords_x, as.coords_y, as.lat, as.lng, as.inspected, as.in_charge);
  }

  console.log('Seed completed successfully for Pipri Gram Panchayat!');
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, DB_PATH };

// public/js/data.js - Data Store, API Client, and Fallback Mock Repository
const DEFAULT_VILLAGE_DATA = {
  profile: {
    id: 1,
    name_en: "Pipri Gram Panchayat",
    name_hi: "पिपरी ग्राम पंचायत",
    block_en: "Chunar",
    block_hi: "चुनार",
    district_en: "Mirzapur",
    district_hi: "मिर्ज़ापुर",
    state_en: "Uttar Pradesh",
    state_hi: "उत्तर प्रदेश",
    pin_code: "231304",
    population: 3420,
    households: 680,
    male_pop: 1780,
    female_pop: 1640,
    literacy_rate: 78.4,
    total_area_sqkm: 14.2,
    wards_count: 8,
    sarpanch_name_en: "Smt. Savita Devi",
    sarpanch_name_hi: "श्रीमती सविता देवी",
    sarpanch_phone: "+91 94520 18321",
    sarpanch_bio_en: "Serving as elected Sarpanch since 2021. Championing solar electrification, digital governance, and clean tap water for every household.",
    sarpanch_bio_hi: "वर्ष 2021 से निर्वाचित सरपंच। सौर विद्युतीकरण, डिजिटल सुशासन और हर घर नल जल अभियान की सक्रिय संवाहक।",
    secretary_name_en: "Shri Rajesh Kumar Sharma",
    secretary_name_hi: "श्री राजेश कुमार शर्मा",
    secretary_phone: "+91 98391 44520",
    office_timing_en: "Monday to Saturday: 10:00 AM – 5:00 PM",
    office_timing_hi: "सोमवार से शनिवार: सुबह 10:00 बजे से शाम 5:00 बजे तक",
    panchayat_bhavan_address_en: "Panchayat Bhavan, Near Primary Health Sub-Centre, Main Road, Pipri, Ward 4",
    panchayat_bhavan_address_hi: "पंचायत भवन, प्राथमिक स्वास्थ्य उप-केंद्र के पास, मुख्य मार्ग, पिपरी, वार्ड 4"
  },

  wards: [
    { id: 1, ward_number: 1, name_en: "Shri Ramswaroop Bind", name_hi: "श्री रामस्वरूप बिंद", phone: "+91 91250 11001", area_name_en: "Purva Mohalla", area_name_hi: "पुरवा मोहल्ला", voters_count: 430, focus_area_en: "Drinking Water & Handpumps", focus_area_hi: "पेयजल एवं हैंडपंप रख-रखाव" },
    { id: 2, ward_number: 2, name_en: "Smt. Malti Devi Patel", name_hi: "श्रीमती मालती देवी पटेल", phone: "+91 91250 11002", area_name_en: "Kisan Basti & Mandi Road", area_name_hi: "किसान बस्ती व मंडी मार्ग", voters_count: 395, focus_area_en: "Agricultural Subsidies & Soil Health", focus_area_hi: "कृषि अनुदान एवं मृदा स्वास्थ्य" },
    { id: 3, ward_number: 3, name_en: "Shri Manoj Kumar Yadav", name_hi: "श्री मनोज कुमार यादव", phone: "+91 91250 11003", area_name_en: "Harijan Basti & Canal Bank", area_name_hi: "हरिजन बस्ती व नहर पटरी", voters_count: 460, focus_area_en: "Concrete Roads & Drainage Work", focus_area_hi: "पक्की सीसी रोड एवं नाली निर्माण" },
    { id: 4, ward_number: 4, name_en: "Shri Dayaram Yadav (Upsarpanch)", name_hi: "श्री दयाराम यादव (उपसरपंच)", phone: "+91 91250 11004", area_name_en: "Panchayat Chowk & Bazaar", area_name_hi: "पंचायत चौक व मुख्य बाज़ार", voters_count: 490, focus_area_en: "Market Infrastructure & Solar Lights", focus_area_hi: "बाज़ार व्यवस्था एवं सौर लाइट" },
    { id: 5, ward_number: 5, name_en: "Smt. Geeta Kushwaha", name_hi: "श्रीमती गीता कुशवाहा", phone: "+91 91250 11005", area_name_en: "Primary School Tola", area_name_hi: "प्राथमिक विद्यालय टोला", voters_count: 410, focus_area_en: "Primary Education & Midday Meal", focus_area_hi: "प्राथमिक शिक्षा व मिड-डे मील" },
    { id: 6, ward_number: 6, name_en: "Shri Akhtar Ali", name_hi: "श्री अख़्तर अली", phone: "+91 91250 11006", area_name_en: "Naya Tola & Weavers Colony", area_name_hi: "नया टोला व बुनकर कॉलोनी", voters_count: 415, focus_area_en: "Sanitation & Solid Waste Management", focus_area_hi: "स्वच्छता एवं ठोस कचरा प्रबंधन" },
    { id: 7, ward_number: 7, name_en: "Smt. Sushila Prajapati", name_hi: "श्रीमती सुशीला प्रजापति", phone: "+91 91250 11007", area_name_en: "Kumhar Basti & Pond Area", area_name_hi: "कुम्हार बस्ती व तालाब क्षेत्र", voters_count: 380, focus_area_en: "Pond Rejuvenation & Women SHGs", focus_area_hi: "तालाब जीर्णोद्धार व महिला स्वयं सहायता समूह" },
    { id: 8, ward_number: 8, name_en: "Shri Dinesh Chandra Mishra", name_hi: "श्री दिनेश चंद्र मिश्रा", phone: "+91 91250 11008", area_name_en: "Station Road & Temple Sector", area_name_hi: "स्टेशन मार्ग व मंदिर परिसर", voters_count: 440, focus_area_en: "Public Health, Anganwadi & Streetlights", focus_area_hi: "जन स्वास्थ्य, आंगनवाड़ी व स्ट्रीट लाइट" }
  ],

  notices: [
    {
      id: 1,
      title_en: "Gram Sabha General Meeting - Next Tuesday at 10:00 AM",
      title_hi: "ग्राम सभा की आम बैठक - आगामी मंगलवार प्रातः 10:00 बजे",
      category: "meeting",
      priority: "urgent",
      issue_date: "2026-11-14",
      authority_en: "Office of the Sarpanch & Secretary",
      authority_hi: "कार्यालय सरपंच एवं ग्राम पंचायत सचिव",
      content_en: "All adult villagers of Pipri Gram Panchayat are earnestly requested to attend the upcoming quarterly Gram Sabha meeting at Panchayat Bhavan. Key agenda items include approving the 2026-27 Village Development Plan (VDP), social audit of Jal Jeevan Mission, allocation of PM Awas beneficiary slots, and prioritizing the new bypass culvert.",
      content_hi: "पिपरी ग्राम पंचायत के सभी वयस्क ग्रामवासियों से सादर अनुरोध है कि वे आगामी मंगलवार को पंचायत भवन में आयोजित त्रैमासिक ग्राम सभा बैठक में अवश्य पधारें। मुख्य एजेंडे में वित्तीय वर्ष 2026-27 की ग्राम विकास योजना, जल जीवन मिशन का सामाजिक अंकेक्षण, पीएम आवास योजना के नए लाभार्थियों का सत्यापन एवं नहर पुलिया निर्माण शामिल है।",
      meeting_datetime: "2026-11-18 10:00 AM",
      venue_en: "Panchayat Bhavan Hall, Pipri",
      venue_hi: "पंचायत भवन प्रांगण, पिपरी",
      audio_text_en: "Important notice for all residents of Pipri. The general Gram Sabha meeting will be held next Tuesday at 10 AM at Panchayat Bhavan. Please participate in village development decisions.",
      audio_text_hi: "पिपरी के सभी ग्रामवासियों के लिए महत्वपूर्ण सूचना। ग्राम सभा की आम बैठक आगामी मंगलवार को सुबह 10 बजे पंचायत भवन में होगी। गांव के विकास निर्णयों में अपनी भागीदारी सुनिश्चित करें।"
    },
    {
      id: 2,
      title_en: "Free Cattle & Livestock Foot-and-Mouth Vaccination Drive",
      title_hi: "पशुधन खुरपका-मुंहपका निःशुल्क टीकाकरण शिविर",
      category: "health",
      priority: "normal",
      issue_date: "2026-11-12",
      authority_en: "Animal Husbandry Department & PHC Pipri",
      authority_hi: "पशुपालन विभाग एवं प्राथमिक स्वास्थ्य उप-केंद्र",
      content_en: "A mobile veterinary medical team will be visiting Wards 1, 2, and 7 on Thursday to administer free prophylactic vaccinations for milch cattle against Foot and Mouth Disease (FMD). Farmers and cattle rearers are advised to bring their cattle to the respective ward collection points between 8:00 AM and 1:00 PM.",
      content_hi: "गुरुवार को पशु चिकित्सा विभाग की मोबाइल टीम द्वारा वार्ड 1, 2 और 7 में सभी दुधारू पशुओं के लिए खुरपका-मुंहपका रोग से बचाव हेतु निःशुल्क टीकाकरण किया जाएगा। सभी पशुपालक किसान भाई अपने मवेशियों को सुबह 8 बजे से दोपहर 1 बजे के मध्य निर्धारित कैंप स्थल पर लेकर आएं।",
      meeting_datetime: "2026-11-20 08:00 AM",
      venue_en: "Ward 1 Handpump Chowk & Ward 7 Pond Ground",
      venue_hi: "वार्ड 1 हैंडपंप चौक एवं वार्ड 7 तालाब प्रांगण",
      audio_text_en: "Attention cattle owners: Free Foot and Mouth Disease vaccination drive on Thursday in wards 1, 2, and 7 from 8 AM to 1 PM.",
      audio_text_hi: "पशुपालक ध्यान दें: गुरुवार को वार्ड 1, 2 और 7 में पशुओं का मुफ्त टीकाकरण शिविर लगाया जाएगा। सुबह 8 बजे अपने पशु अवश्य लाएं।"
    },
    {
      id: 3,
      title_en: "PM-Kisan Samman Nidhi 18th Installment e-KYC Verification Camp",
      title_hi: "प्रधानमंत्री किसान सम्मान निधि 18वीं किस्त: बायोमेट्रिक ई-केवाईसी शिविर",
      category: "agriculture",
      priority: "urgent",
      issue_date: "2026-11-10",
      authority_en: "Common Service Centre (CSC) & Panchayat Sahayak",
      authority_hi: "जन सेवा केंद्र (CSC) एवं पंचायत सहायक",
      content_en: "Beneficiary farmers who have not completed biometric iris or fingerprint e-KYC for PM-Kisan Samman Nidhi will not receive their upcoming Rs 2,000 installment. A dedicated 3-day desk is active at Panchayat Bhavan from 9:00 AM to 4:00 PM. Please bring Aadhaar card and linked mobile.",
      content_hi: "जिन किसान भाइयों का पीएम किसान सम्मान निधि का ई-केवाईसी अभी तक अधूरा है, वे तत्काल पंचायत भवन पहुंचकर बायोमेट्रिक सत्यापन करा लें अन्यथा अगली किस्त रुक सकती है। यह शिविर प्रतिदिन सुबह 9 बजे से शाम 4 बजे तक खुला है। आधार कार्ड और बैंक पासबुक साथ लाएं।",
      meeting_datetime: "2026-11-11 to 2026-11-14",
      venue_en: "Panchayat Bhavan CSC Counter",
      venue_hi: "पंचायत भवन जन सेवा केंद्र काउंटर",
      audio_text_en: "Farmers alert: Complete your PM Kisan e-KYC verification at the Panchayat Bhavan counter to receive your next financial installment.",
      audio_text_hi: "किसान बंधु ध्यान दें: पीएम किसान की अगली किस्त पाने हेतु पंचायत भवन में अपना ई-केवाईसी अनिवार्य रूप से पूरा करा लें।"
    },
    {
      id: 4,
      title_en: "Mission Indradhanush: Child Immunization & Nutrition Day",
      title_hi: "मिशन इंद्रधनुष: बाल टीकाकरण एवं पोषण दिवस",
      category: "health",
      priority: "normal",
      issue_date: "2026-11-08",
      authority_en: "Anganwadi Workers & ASHA Sangini Team",
      authority_hi: "आंगनवाड़ी कार्यकर्ती एवं आशा संगिनी टीम",
      content_en: "Every Wednesday is village immunization day. Children aged 0 to 5 years will receive measles, rubella, and polio booster doses. Pregnant and lactating mothers will also receive iron-folic supplements and health counseling at Anganwadi Centre #1 (Ward 5).",
      content_hi: "आगामी बुधवार को वार्ड 5 स्थित आंगनवाड़ी केंद्र 1 पर 0 से 5 वर्ष के शिशुओं हेतु नियमित टीकाकरण एवं गर्भवती माताओं हेतु स्वास्थ्य जांच व पोषण परामर्श शिविर आयोजित किया जाएगा। समय: सुबह 9:30 से दोपहर 2:00 बजे।",
      meeting_datetime: "Every Wednesday",
      venue_en: "Anganwadi Centre #1 (Ward 5)",
      venue_hi: "आंगनवाड़ी केंद्र संख्या 1 (वार्ड 5)",
      audio_text_en: "Child Immunization day this Wednesday at Anganwadi Centre 1. Bring infants for scheduled vaccines.",
      audio_text_hi: "बुधवार को आंगनवाड़ी केंद्र 1 पर बच्चों का नियमित टीकाकरण दिवस है। 0 से 5 साल के बच्चों को समय पर टीका लगवाएं।"
    },
    {
      id: 5,
      title_en: "Free Solar Lamp Subsidy Registration for BPL Families",
      title_hi: "बीपीएल परिवारों हेतु निःशुल्क सौर लालटेन एवं होम लाइटिंग पंजीकरण",
      category: "subsidy",
      priority: "normal",
      issue_date: "2026-11-05",
      authority_en: "Renewable Energy Agency (UPNEDA) & Gram Panchayat",
      authority_hi: "नवीन एवं नवीकरणीय ऊर्जा विकास अभिकरण व ग्राम पंचायत",
      content_en: "Under the state off-grid solar scheme, 120 Antyodaya and BPL families are eligible for solar home LED kits and emergency lantern units. Submit ration card copy and electricity absence declaration to Ward Member #6 or the Panchayat Secretary before end of month.",
      content_hi: "राज्य नवीकरणीय ऊर्जा योजना अंतर्गत 120 निर्धन व अंत्योदय कार्डधारक परिवारों को सोलर होम लाइट किट उपलब्ध कराई जा रही है। पात्र परिवार अपने राशन कार्ड की प्रतिलिपि पंचायत सचिव को प्रस्तुत करें।",
      meeting_datetime: "Till 2026-11-30",
      venue_en: "Ward 6 Office & Panchayat Bhavan",
      venue_hi: "वार्ड 6 कार्यालय एवं पंचायत भवन",
      audio_text_en: "Solar home light applications are now open for BPL families. Submit ration card copy at Panchayat Bhavan.",
      audio_text_hi: "बीपीएल परिवारों के लिए सोलर होम लाइट योजना का आवेदन शुरू है। राशन कार्ड की प्रति के साथ पंचायत भवन में आवेदन करें।"
    }
  ],

  projects: [
    {
      id: 1,
      title_en: "Paved Concrete Road Construction (Ward 3 to Canal Bridge)",
      title_hi: "पक्की सीसी सड़क निर्माण कार्य (वार्ड 3 से नहर पुल तक)",
      category: "roads",
      ward_number: 3,
      sanctioned_budget: 450000,
      spent_amount: 360000,
      completion_pct: 80,
      status: "In Progress",
      contractor_name: "M/s Maa Vindhyavasini Infracon",
      start_date: "2026-08-15",
      target_date: "2026-12-15",
      description_en: "850-meter heavy-duty interlocking concrete road with reinforced side shoulders connecting Harijan Basti to the main canal road, facilitating tractor movement during paddy harvesting.",
      description_hi: "850 मीटर लंबी इंटरलॉकिंग सीमेंट कंक्रीट सड़क का निर्माण, जिससे धान कटाई के समय किसानों के ट्रैक्टर व वाहन बिना कीचड़ के मुख्य नहर मार्ग तक सुगमता से पहुंच सकें।",
      milestones: [
        { name: "Earth leveling & sub-base grading", done: true, date: "2026-09-02" },
        { name: "Gravel laying & compaction", done: true, date: "2026-10-10" },
        { name: "CC interlocking block placement (680m)", done: true, date: "2026-11-05" },
        { name: "Side drain integration & curing", done: false, date: "Target: 2026-12-10" }
      ],
      balance_budget: 90000,
      spent_percentage: 80
    },
    {
      id: 2,
      title_en: "Solar High-Mast & Streetlight Installation (40 Units)",
      title_hi: "सौर हाई-मास्ट एवं स्ट्रीट लाइट स्थापना (40 इकाइयां)",
      category: "lighting",
      ward_number: 0,
      sanctioned_budget: 320000,
      spent_amount: 304000,
      completion_pct: 95,
      status: "Near Completion",
      contractor_name: "Surya Urja Vikas LLP",
      start_date: "2026-09-01",
      target_date: "2026-11-25",
      description_en: "Erection of 2 high-mast solar towers at Panchayat Chowk and Mandi, plus 38 standalone 40W dusk-to-dawn LED pole lights across dark alleyways in Wards 1, 4, 6, and 8.",
      description_hi: "पंचायत चौक व मंडी में 2 हाई-मास्ट सोलर टावर तथा वार्ड 1, 4, 6 एवं 8 की अंधेरी गलियों में 38 सोलर स्ट्रीट लाइट की स्थापना। 38 खंभे क्रियाशील हो चुके हैं।",
      milestones: [
        { name: "Pole foundation casting", done: true, date: "2026-09-20" },
        { name: "PV panel & battery installation", done: true, date: "2026-10-18" },
        { name: "Trial illumination & sensor calibration", done: true, date: "2026-11-02" },
        { name: "Final hand-over & warranty certification", done: false, date: "Target: 2026-11-25" }
      ],
      balance_budget: 16000,
      spent_percentage: 95
    },
    {
      id: 3,
      title_en: "Composite School Modern Sanitation Block & Running Tap Water",
      title_hi: "कंपोजिट विद्यालय आधुनिक स्वच्छता परिसर एवं नल-जल व्यवस्था",
      category: "sanitation",
      ward_number: 5,
      sanctioned_budget: 280000,
      spent_amount: 196000,
      completion_pct: 70,
      status: "In Progress",
      contractor_name: "Pipri Village Construction Committee",
      start_date: "2026-09-10",
      target_date: "2026-12-30",
      description_en: "Construction of segregated 4-stall sanitation facility (2 for girls, 2 for boys) with incinerator, tiled handwashing stations, overhead 1000L Sintex tank, and submersible pump.",
      description_hi: "बालक व बालिकाओं हेतु अलग-अलग 4-शौचालय परिसर, इंसिनरेटर, टाइल युक्त हाथ धुलाई स्टेशन, 1000 लीटर ओवरहेड टंकी और सबमर्सिबल पंप की स्थापना।",
      milestones: [
        { name: "Foundation masonry & septic pit excavation", done: true, date: "2026-09-28" },
        { name: "Brickwork & roof slab casting", done: true, date: "2026-10-25" },
        { name: "Plumbing & sanitary ware fittings", done: false, date: "In Progress" },
        { name: "Wall tiling, painting & solar motor link", done: false, date: "Target: 2026-12-25" }
      ],
      balance_budget: 84000,
      spent_percentage: 70
    },
    {
      id: 4,
      title_en: "Underground Covered Drainage Canal (Purva to River Outfall)",
      title_hi: "भूमिगत पक्की नाली एवं जलनिकासी चैनल (पुरवा से नदी निकास)",
      category: "sanitation",
      ward_number: 1,
      sanctioned_budget: 520000,
      spent_amount: 260000,
      completion_pct: 50,
      status: "In Progress",
      contractor_name: "Gram Vikas Thekedar Sangh",
      start_date: "2026-10-01",
      target_date: "2027-01-20",
      description_en: "Permanent covered brick-mortar drainage channel to eliminate monsoon stagnation, mosquito breeding, and wastewater overflow across 60 residential houses.",
      description_hi: "बरसात के पानी और घरेलू गंदे पानी के निकास हेतु 1.2 किमी लंबी आरसीसी ढकी हुई नाली का निर्माण, जिससे संक्रामक बीमारियों की रोकथाम होगी।",
      milestones: [
        { name: "Survey & trench grading", done: true, date: "2026-10-12" },
        { name: "Base PCC and side wall masonry", done: true, date: "2026-11-04" },
        { name: "Pre-cast RCC cover slab casting", done: false, date: "In Progress" },
        { name: "Silt trap chamber & outfall weir", done: false, date: "Target: 2027-01-15" }
      ],
      balance_budget: 260000,
      spent_percentage: 50
    },
    {
      id: 5,
      title_en: "Jal Jeevan Mission Solar RO Water ATM & Pipeline Extension",
      title_hi: "जल जीवन मिशन सौर आरओ वॉटर एटीएम एवं पाइपलाइन विस्तार",
      category: "water",
      ward_number: 4,
      sanctioned_budget: 680000,
      spent_amount: 680000,
      completion_pct: 100,
      status: "Completed",
      contractor_name: "UP Jal Nigam & Gram Panchayat",
      start_date: "2026-05-01",
      target_date: "2026-10-15",
      description_en: "1000 LPH multi-stage Reverse Osmosis filtration unit operating on 5kW rooftop solar panels, dispensing chilled, mineral-tested safe water at 20 paise per litre with smart card.",
      description_hi: "5 किलोवाट सोलर संयंत्र से संचालित 1000 लीटर प्रति घंटा क्षमता का आरओ वाटर एटीएम। स्मार्ट कार्ड से 20 पैसे प्रति लीटर की दर से शुद्ध व शीतल पेयजल उपलब्ध।",
      milestones: [
        { name: "Borewell drilling (220 ft)", done: true, date: "2026-05-20" },
        { name: "Water testing lab approval", done: true, date: "2026-06-15" },
        { name: "RO plant housing & solar array", done: true, date: "2026-08-30" },
        { name: "Public inauguration & smart card rollout", done: true, date: "2026-10-15" }
      ],
      balance_budget: 0,
      spent_percentage: 100
    },
    {
      id: 6,
      title_en: "Anganwadi Model Child Development Centre Renovation",
      title_hi: "आंगनवाड़ी मॉडल बाल विकास केंद्र का कायाकल्प एवं नवीनीकरण",
      category: "building",
      ward_number: 7,
      sanctioned_budget: 180000,
      spent_amount: 72000,
      completion_pct: 40,
      status: "In Progress",
      contractor_name: "Mahila Utthan Sahakari Samiti",
      start_date: "2026-10-20",
      target_date: "2026-12-31",
      description_en: "Child-friendly Bala painting, waterproof roofing, anti-skid rubber flooring, toddler toilet, educational charts, and nutrition storage cupboard.",
      description_hi: "बच्चों हेतु बाल-मित्र बाला पेंटिंग, वाटरप्रूफिंग छत, रबर मैट फ़्लोरिंग, बाल सुलभ शौचालय तथा पोषण सामग्री हेतु अलमारी की व्यवस्था।",
      milestones: [
        { name: "Roof plastering & damp proofing", done: true, date: "2026-10-31" },
        { name: "Window grille & door replacement", done: true, date: "2026-11-09" },
        { name: "Wall art & interior rubber flooring", done: false, date: "In Progress" },
        { name: "Play learning materials setup", done: false, date: "Target: 2026-12-25" }
      ],
      balance_budget: 108000,
      spent_percentage: 40
    }
  ],

  grievances: [
    {
      id: 1,
      token: "GP-PIPRI-2026-8012",
      citizen_name: "Rameshwar Prasad Bind",
      phone: "+91 94152 77011",
      ward_number: 1,
      category: "water",
      landmark: "Near Old Banyan Tree, Purva",
      description: "Community handpump handle is loose and pumping muddy brownish water for 3 days. 25 families rely on this for cattle and washing.",
      urgency: "Critical",
      status: "In Progress",
      assigned_ward_member_id: 1,
      assigned_to_name: "Shri Ramswaroop Bind (Ward 1)",
      submitted_at: "2026-11-13 09:30:00",
      updated_at: "2026-11-14 11:20:00",
      sla_days: 2,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: "Jal Nigam mechanic deputed with replacement cylinder and washer gasket. Work underway.",
      resolution_photo_url: null
    },
    {
      id: 2,
      token: "GP-PIPRI-2026-8025",
      citizen_name: "Santosh Kumar Maurya",
      phone: "+91 98380 44122",
      ward_number: 4,
      category: "streetlights",
      landmark: "Bazaar Chowk, in front of Gupta General Store",
      description: "Solar pole streetlight LED bulb flickering erratically and turning off completely after 8 PM, leaving the main market alley pitch dark.",
      urgency: "High",
      status: "Submitted",
      assigned_ward_member_id: null,
      assigned_to_name: null,
      submitted_at: "2026-11-15 16:45:00",
      updated_at: "2026-11-15 16:45:00",
      sla_days: 3,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: null,
      resolution_photo_url: null
    },
    {
      id: 3,
      token: "GP-PIPRI-2026-7954",
      citizen_name: "Kamla Devi",
      phone: "+91 99360 88231",
      ward_number: 3,
      category: "roads",
      landmark: "Behind Primary School boundary, Ward 3",
      description: "Contractor dumped leftover gravel heap blocking the pedestrian cart track. School children and elders slipping during night.",
      urgency: "Normal",
      status: "Assigned",
      assigned_ward_member_id: 3,
      assigned_to_name: "Shri Manoj Kumar Yadav (Ward 3)",
      submitted_at: "2026-11-14 10:15:00",
      updated_at: "2026-11-15 08:30:00",
      sla_days: 7,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: "Notice issued to contractor Maa Vindhyavasini Infracon to clear debris within 24 hours.",
      resolution_photo_url: null
    },
    {
      id: 4,
      token: "GP-PIPRI-2026-7880",
      citizen_name: "Harishankar Tiwari",
      phone: "+91 91400 33890",
      ward_number: 6,
      category: "sanitation",
      landmark: "Near Weavers Community Shed, Naya Tola",
      description: "Open drain overflowing onto the unpaved street due to plastic blockage. Foul smell and dengue mosquito breeding hazard.",
      urgency: "Critical",
      status: "In Progress",
      assigned_ward_member_id: 6,
      assigned_to_name: "Shri Akhtar Ali (Ward 6)",
      submitted_at: "2026-11-10 14:00:00",
      updated_at: "2026-11-12 10:00:00",
      sla_days: 4,
      is_escalated: 1,
      escalation_reason: "SLA Escalation: Over 5 days since filing without resolution. Alert dispatched to Block Development Officer (BDO).",
      resolution_remarks: "Sanitation safai karmi team dispatched with desilting equipment and anti-larval spray.",
      resolution_photo_url: null
    },
    {
      id: 5,
      token: "GP-PIPRI-2026-7721",
      citizen_name: "Phoolmati Devi",
      phone: "+91 94500 55182",
      ward_number: 2,
      category: "ration",
      landmark: "Fair Price Ration Shop (Kisan Basti)",
      description: "Ration dealer refused foodgrains claiming biometric machine network error for 4 days in a row.",
      urgency: "High",
      status: "Resolved",
      assigned_ward_member_id: 2,
      assigned_to_name: "Smt. Malti Devi Patel (Ward 2)",
      submitted_at: "2026-11-06 11:00:00",
      updated_at: "2026-11-08 17:00:00",
      sla_days: 5,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: "Ward member accompanied citizen. Dealer issued manual register receipt and provided full 35kg grain quota in presence of Food Inspector.",
      resolution_photo_url: null
    },
    {
      id: 6,
      token: "GP-PIPRI-2026-7640",
      citizen_name: "Mohammad Shamim",
      phone: "+91 97920 66319",
      ward_number: 8,
      category: "streetlights",
      landmark: "Station link road, near Shiv Temple gate",
      description: "Two sodium lamps burnt out during lightning storm last week. Dark spot near women bathing ghat.",
      urgency: "Normal",
      status: "Resolved",
      assigned_ward_member_id: 8,
      assigned_to_name: "Shri Dinesh Chandra Mishra (Ward 8)",
      submitted_at: "2026-11-04 15:30:00",
      updated_at: "2026-11-07 14:15:00",
      sla_days: 3,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: "Both fittings replaced with energy efficient 40W Surya Urja LED units. Checked working.",
      resolution_photo_url: null
    },
    {
      id: 7,
      token: "GP-PIPRI-2026-8039",
      citizen_name: "Lalji Prajapati",
      phone: "+91 93350 12847",
      ward_number: 7,
      category: "water",
      landmark: "Near Ward 7 Pond ghat, Kumhar Mohalla",
      description: "Standpost tap pipe cracked by passing tractor, clean drinking water continuously leaking on the road.",
      urgency: "High",
      status: "Submitted",
      assigned_ward_member_id: null,
      assigned_to_name: null,
      submitted_at: "2026-11-16 08:10:00",
      updated_at: "2026-11-16 08:10:00",
      sla_days: 2,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: null,
      resolution_photo_url: null
    },
    {
      id: 8,
      token: "GP-PIPRI-2026-7815",
      citizen_name: "Sunita Kushwaha",
      phone: "+91 96210 99403",
      ward_number: 5,
      category: "health",
      landmark: "Near Anganwadi Centre 2",
      description: "Stock of iron folic acid syrup and baby weighing scale unavailable for 3 weeks.",
      urgency: "Normal",
      status: "Resolved",
      assigned_ward_member_id: 5,
      assigned_to_name: "Smt. Geeta Kushwaha (Ward 5)",
      submitted_at: "2026-11-07 09:00:00",
      updated_at: "2026-11-11 12:00:00",
      sla_days: 3,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: "Fresh medical nutrition inventory requisitioned and received from Block PHC Chunar. Distributed to mothers.",
      resolution_photo_url: null
    }
  ],

  schemes: [
    {
      id: 1,
      name_en: "Pradhan Mantri Awas Yojana (PMAY-Gramin)",
      name_hi: "प्रधानमंत्री आवास योजना (ग्रामीण)",
      department_en: "Ministry of Rural Development",
      department_hi: "ग्रामीण विकास मंत्रालय",
      category: "Housing",
      financial_aid_en: "₹1,20,000 direct subsidy + 90 days MGNREGA wages (₹21,000) + ₹12,000 for toilet",
      financial_aid_hi: "₹1,20,000 सीधी सब्सिडी + 90 दिन मनरेगा मजदूरी (₹21,000) + ₹12,000 शौचालय निर्माण",
      eligibility_en: "Houseless households and families living in kutcha/dilapidated homes as per SECC 2011 & Awas+ list.",
      eligibility_hi: "कच्चे या जीर्ण-शीर्ण मकानों में रहने वाले बीपीएल परिवार जिनका नाम आवास+ सूची में दर्ज है।",
      documents_en: "Aadhaar Card, Bank Passbook, Ration Card, Land possession certificate, Photo of kutcha house.",
      documents_hi: "आधार कार्ड, बैंक पासबुक, राशन कार्ड, भूमि दस्तावेज, वर्तमान कच्चे घर का फोटो।",
      apply_url: "https://pmayg.nic.in"
    },
    {
      id: 2,
      name_en: "Jal Jeevan Mission (Har Ghar Jal)",
      name_hi: "जल जीवन मिशन (हर घर जल योजना)",
      department_en: "Department of Drinking Water and Sanitation",
      department_hi: "पेयजल एवं स्वच्छता विभाग",
      category: "Water",
      financial_aid_en: "100% free individual Functional Household Tap Connection (FHTC) providing 55 LPCD potable water.",
      financial_aid_hi: "प्रत्येक ग्रामीण घर को निःशुल्क नल कनेक्शन, प्रतिदिन 55 लीटर प्रति व्यक्ति शुद्ध पेयजल।",
      eligibility_en: "Every rural household in Pipri Gram Panchayat without an existing piped metered connection.",
      eligibility_hi: "पिपरी ग्राम पंचायत का प्रत्येक परिवार जिसके घर में पहले से नल कनेक्शन नहीं है।",
      documents_en: "Aadhaar Card, Electricity Bill/Gram Panchayat Tax Receipt, Mobile Number.",
      documents_hi: "आधार कार्ड, बिजली बिल या पंचायत टैक्स रसीद, मोबाइल नंबर।",
      apply_url: "https://ejalshakti.gov.in"
    },
    {
      id: 3,
      name_en: "Mahatma Gandhi NREGA (100 Days Guaranteed Wage Employment)",
      name_hi: "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी (मनरेगा)",
      department_en: "Ministry of Rural Development",
      department_hi: "ग्रामीण विकास मंत्रालय",
      category: "Livelihood",
      financial_aid_en: "100 days guaranteed unskilled manual work @ ₹237/day, direct bank credit within 15 days.",
      financial_aid_hi: "प्रत्येक परिवार को 100 दिन अकुशल शारीरिक श्रम रोजगार @ ₹237 प्रतिदिन, सीधे बैंक खाते में भुगतान।",
      eligibility_en: "Any adult rural resident willing to do manual unskilled work within 5 km of village.",
      eligibility_hi: "गांव का कोई भी वयस्क नागरिक जो अकुशल मजदूरी कार्य करने का इच्छुक हो।",
      documents_en: "Family Job Card, Aadhaar Card, Active Bank Account with DBT enabled.",
      documents_hi: "परिवार जॉब कार्ड, आधार कार्ड, डीबीटी सक्रिय बैंक खाता।",
      apply_url: "https://nrega.nic.in"
    },
    {
      id: 4,
      name_en: "PM-Kisan Samman Nidhi Yojana",
      name_hi: "पीएम किसान सम्मान निधि योजना",
      department_en: "Ministry of Agriculture and Farmers Welfare",
      department_hi: "कृषि एवं किसान कल्याण मंत्रालय",
      category: "Agriculture",
      financial_aid_en: "₹6,000 per year paid in three equal installments of ₹2,000 directly via DBT.",
      financial_aid_hi: "₹6,000 प्रतिवर्ष (₹2,000 की तीन समान किस्तों में) सीधे बैंक खाते में।",
      eligibility_en: "Small and marginal landholder farmer families with cultivable land up to 2 hectares.",
      eligibility_hi: "खेती योग्य भूमि रखने वाले सभी पात्र कृषक परिवार।",
      documents_en: "Land Khatauni (Khasra/Khata), Aadhaar Card, Bank Passbook, Mobile linked with Aadhaar.",
      documents_hi: "भूलेख खतौनी, आधार कार्ड, बैंक पासबुक, आधार लिंक मोबाइल।",
      apply_url: "https://pmkisan.gov.in"
    },
    {
      id: 5,
      name_en: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
      name_hi: "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (गोल्डन कार्ड)",
      department_en: "National Health Authority",
      department_hi: "राष्ट्रीय स्वास्थ्य प्राधिकरण",
      category: "Health",
      financial_aid_en: "Free cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per year.",
      financial_aid_hi: "प्रति परिवार प्रति वर्ष ₹5,00,000 तक का निःशुल्क कैशलेस अस्पताल उपचार कवर।",
      eligibility_en: "Deprived rural households identified under Socio-Economic Caste Census (SECC 2011).",
      eligibility_hi: "सामाजिक आर्थिक जनगणना (SECC) में सूचीबद्ध चिन्हित ग्रामीण परिवार।",
      documents_en: "Ration Card, Aadhaar Card of all family members, Mobile OTP.",
      documents_hi: "राशन कार्ड, परिवार के सभी सदस्यों का आधार कार्ड, मोबाइल।",
      apply_url: "https://beneficiary.nha.gov.in"
    },
    {
      id: 6,
      name_en: "Swachh Bharat Mission (Gramin) Individual Household Latrine (IHHL)",
      name_hi: "स्वच्छ भारत मिशन (ग्रामीण) व्यक्तिगत शौचालय निर्माण प्रोत्साहन",
      department_en: "Ministry of Jal Shakti",
      department_hi: "जल शक्ति मंत्रालय",
      category: "Sanitation",
      financial_aid_en: "₹12,000 incentive for constructing twin-pit water-seal eco-friendly household latrine.",
      financial_aid_hi: "व्यक्तिगत घरेलू शौचालय निर्माण हेतु ₹12,000 की प्रोत्साहन राशि।",
      eligibility_en: "Rural households without an existing toilet facility or newly separated joint families.",
      eligibility_hi: "ऐसे ग्रामीण परिवार जिनके घर में अभी तक शौचालय नहीं है।",
      documents_en: "Aadhaar Card, Bank Account details, Photo of newly constructed latrine with beneficiary.",
      documents_hi: "आधार कार्ड, बैंक खाता विवरण, निर्मित शौचालय के साथ लाभार्थी का फोटो।",
      apply_url: "https://sbm.gov.in"
    }
  ],

  agenda_votes: [
    {
      id: 1,
      title_en: "Solar-Powered Irrigation Borewell for Small Farmers in Ward 2",
      title_hi: "वार्ड 2 में लघु किसानों हेतु सौर ऊर्जा चालित सामुदायिक सिंचाई नलकूप",
      submitted_by: "Bhairo Nath Patel",
      ward_number: 2,
      description_en: "Over 40 marginal farmers face parched crops during summer due to erratic grid electricity. A 10HP solar pump near the pond can irrigate 65 acres sustainably.",
      description_hi: "गर्मी के मौसम में बिजली कटौती के कारण फसलें सूख जाती हैं। तालाब के पास 10HP सोलर पंप लगाने से 65 एकड़ भूमि को भरपूर पानी मिलेगा।",
      votes_count: 142,
      status: "Included in Agenda",
      created_at: "2026-11-01"
    },
    {
      id: 2,
      title_en: "Digital Village Library & Competitive Exam Reading Room at Panchayat Bhavan",
      title_hi: "पंचायत भवन में डिजिटल ग्रामीण पुस्तकालय एवं प्रतियोगी परीक्षा वाचनालय",
      submitted_by: "Ankit Bind (Youth Representative)",
      ward_number: 4,
      description_en: "Rural youth have to travel 18 km to Chunar town for internet and books. Allocating the first-floor hall with 6 computers and competitive books will benefit 200+ students.",
      description_hi: "गांव के युवाओं को पढ़ाई के लिए 18 किमी दूर चुनार जाना पड़ता है। पहली मंजिल पर 6 कंप्यूटर व पुस्तकों के साथ पुस्तकालय स्थापित किया जाए।",
      votes_count: 188,
      status: "Open For Voting",
      created_at: "2026-11-05"
    },
    {
      id: 3,
      title_en: "CCTV Surveillance & High-Mast Floodlight at Weekly Village Haat",
      title_hi: "साप्ताहिक ग्रामीण हाट-बाज़ार में सीसीटीवी कैमरे एवं हाई-मास्ट फ्लडलाइट",
      submitted_by: "Mata Prasad Gupta",
      ward_number: 4,
      description_en: "Prevent petty thefts, pickpocketing, and ensure safety for women vegetable vendors during evening haat hours on Mondays and Fridays.",
      description_hi: "सोमवार व शुक्रवार के साप्ताहिक हाट में महिलाओं की सुरक्षा एवं चोरी की घटनाओं की रोकथाम हेतु सीसीटीवी व फ्लडलाइट आवश्यक है।",
      votes_count: 95,
      status: "Open For Voting",
      created_at: "2026-11-08"
    },
    {
      id: 4,
      title_en: "Veterinary First-Aid Medicine Stock & Mobile Doctor Visit Twice a Month",
      title_hi: "पशु प्राथमिक चिकित्सा दवा स्टॉक एवं महीने में दो बार मोबाइल डॉक्टर भ्रमण",
      submitted_by: "Santosh Yadav",
      ward_number: 8,
      description_en: "Emergency treatment for bloat and milk fever in cows/buffaloes often gets delayed, causing livestock mortality. Village stock of life-saving injectables needed.",
      description_hi: "पशुओं में अचानक होने वाली गंभीर बीमारियों में समय पर डॉक्टर न मिलने से भारी हानि होती है। गांव में आवश्यक दवाओं का स्टॉक रखा जाए।",
      votes_count: 114,
      status: "Open For Voting",
      created_at: "2026-11-10"
    }
  ],

  village_assets: [
    {
      id: 1,
      name_en: "Panchayat Bhavan & Digital Seva Kendra",
      name_hi: "पंचायत भवन एवं डिजिटल सेवा केंद्र",
      category: "governance",
      ward_number: 4,
      condition: "Excellent",
      coords_x: 50,
      coords_y: 45,
      lat: 25.1245,
      lng: 82.8710,
      last_inspected: "2026-11-01",
      in_charge: "Rajesh Kumar Sharma (Secretary)"
    },
    {
      id: 2,
      name_en: "Primary Health Sub-Centre (PHSC Pipri)",
      name_hi: "प्राथमिक स्वास्थ्य उप-केंद्र (पीएचएससी पिपरी)",
      category: "health",
      ward_number: 4,
      condition: "Functional",
      coords_x: 44,
      coords_y: 42,
      lat: 25.1238,
      lng: 82.8702,
      last_inspected: "2026-10-25",
      in_charge: "Dr. ANM Sunita Rao"
    },
    {
      id: 3,
      name_en: "Government Composite Primary & Junior School",
      name_hi: "शासकीय कंपोजिट प्राथमिक एवं पूर्व माध्यमिक विद्यालय",
      category: "education",
      ward_number: 5,
      condition: "Needs Repair",
      coords_x: 68,
      coords_y: 35,
      lat: 25.1280,
      lng: 82.8765,
      last_inspected: "2026-11-05",
      in_charge: "Principal Brijesh Tiwari"
    },
    {
      id: 4,
      name_en: "Anganwadi Model Centre #1",
      name_hi: "आंगनवाड़ी मॉडल केंद्र संख्या 1",
      category: "education",
      ward_number: 5,
      condition: "Excellent",
      coords_x: 72,
      coords_y: 38,
      lat: 25.1285,
      lng: 82.8772,
      last_inspected: "2026-11-08",
      in_charge: "Shashi Devi (Anganwadi Worker)"
    },
    {
      id: 5,
      name_en: "Jal Jeevan Mission Solar RO Water ATM",
      name_hi: "जल जीवन मिशन सौर आरओ वॉटर एटीएम प्लांट",
      category: "water",
      ward_number: 4,
      condition: "Excellent",
      coords_x: 52,
      coords_y: 50,
      lat: 25.1248,
      lng: 82.8715,
      last_inspected: "2026-11-12",
      in_charge: "Kailash Bind (Plant Operator)"
    },
    {
      id: 6,
      name_en: "Deep Borewell Community Pump #4",
      name_hi: "सामुदायिक गहरा नलकूप पंप संख्या 4",
      category: "water",
      ward_number: 1,
      condition: "Critical",
      coords_x: 25,
      coords_y: 60,
      lat: 25.1210,
      lng: 82.8640,
      last_inspected: "2026-11-14",
      in_charge: "Ramswaroop Bind (Ward Member)"
    },
    {
      id: 7,
      name_en: "Solar Micro-Grid Power Station (25 kW)",
      name_hi: "सौर मिनी-ग्रिड विद्युत उत्पादन केंद्र (25 kW)",
      category: "power",
      ward_number: 8,
      condition: "Functional",
      coords_x: 82,
      coords_y: 75,
      lat: 25.1298,
      lng: 82.8820,
      last_inspected: "2026-10-30",
      in_charge: "Surya Urja Vikas Technician"
    },
    {
      id: 8,
      name_en: "Solid & Liquid Waste Resource Centre (SLWM)",
      name_hi: "ठोस एवं तरल अपशिष्ट संसाधन प्रबंधन केंद्र",
      category: "sanitation",
      ward_number: 6,
      condition: "Functional",
      coords_x: 35,
      coords_y: 28,
      lat: 25.1220,
      lng: 82.8680,
      last_inspected: "2026-11-03",
      in_charge: "Akhtar Ali (Ward Member)"
    }
  ]
};

// LocalStorage Persistence Wrapper for Offline Mode
class OfflineStorage {
  static get(key, defaultVal) {
    try {
      const val = localStorage.getItem('gramaglow_' + key);
      return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  static set(key, val) {
    try {
      localStorage.setItem('gramaglow_' + key, JSON.stringify(val));
    } catch (e) {}
  }
}

// Universal API Client with automatic fallbacks
const ApiClient = {
  async loginAdmin(password) {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Sign-in failed.');
    return json;
  },
  async logoutAdmin() {
    await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  },
  async checkAdminSession() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.authenticated);
  },
  baseUrl: (window.location.protocol === 'file:' || !window.location.host) ? '' : window.location.origin,

  async fetchVillage() {
    try {
      const res = await fetch(`${this.baseUrl}/api/village`);
      if (res.ok) {
        const json = await res.json();
        return { profile: json.profile, wards: json.wards };
      }
    } catch (e) {}
    return {
      profile: OfflineStorage.get('profile', DEFAULT_VILLAGE_DATA.profile),
      wards: OfflineStorage.get('wards', DEFAULT_VILLAGE_DATA.wards)
    };
  },

  async fetchNotices(category = 'all') {
    try {
      const url = category && category !== 'all' ? `${this.baseUrl}/api/notices?category=${category}` : `${this.baseUrl}/api/notices`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.notices;
      }
    } catch (e) {}
    const list = OfflineStorage.get('notices', DEFAULT_VILLAGE_DATA.notices);
    if (category && category !== 'all') {
      return list.filter(n => n.category === category);
    }
    return list;
  },

  async createNotice(noticeData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeData)
      });
      if (res.status === 401) throw Object.assign(new Error('Administrator sign-in expired. Please sign in again.'), { status: 401 });
      if (res.ok) return await res.json();
    } catch (e) { if (e.status === 401) throw e; }

    // Offline fallback
    const notices = OfflineStorage.get('notices', DEFAULT_VILLAGE_DATA.notices);
    const newNotice = {
      ...noticeData,
      id: notices.length + 1,
      issue_date: new Date().toISOString().split('T')[0]
    };
    notices.unshift(newNotice);
    OfflineStorage.set('notices', notices);
    return { success: true, notice: newNotice };
  },

  async fetchProjects() {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects`);
      if (res.ok) {
        const json = await res.json();
        return json.projects;
      }
    } catch (e) {}
    return OfflineStorage.get('projects', DEFAULT_VILLAGE_DATA.projects);
  },

  async updateProject(id, updateData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.status === 401) throw Object.assign(new Error('Administrator sign-in expired. Please sign in again.'), { status: 401 });
      if (res.ok) return await res.json();
    } catch (e) { if (e.status === 401) throw e; }

    // Offline fallback
    const projects = OfflineStorage.get('projects', DEFAULT_VILLAGE_DATA.projects);
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...updateData };
      projects[idx].balance_budget = projects[idx].sanctioned_budget - projects[idx].spent_amount;
      projects[idx].spent_percentage = Math.round((projects[idx].spent_amount / projects[idx].sanctioned_budget) * 100);
      OfflineStorage.set('projects', projects);
      return { success: true };
    }
    return { success: false };
  },

  async fetchGrievances(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.ward && filters.ward !== 'all') params.set('ward', filters.ward);
      if (filters.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`${this.baseUrl}/api/grievances?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.grievances;
      }
    } catch (e) {}

    // Offline fallback filtering
    let list = OfflineStorage.get('grievances', DEFAULT_VILLAGE_DATA.grievances);
    if (filters.ward && filters.ward !== 'all') {
      list = list.filter(g => g.ward_number === parseInt(filters.ward, 10));
    }
    if (filters.category && filters.category !== 'all') {
      list = list.filter(g => g.category === filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(g => g.status === filters.status);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(g => 
        g.token.toLowerCase().includes(s) ||
        g.citizen_name.toLowerCase().includes(s) ||
        g.landmark.toLowerCase().includes(s) ||
        g.description.toLowerCase().includes(s)
      );
    }
    return list;
  },

  async lodgeGrievance(data) {
    try {
      const res = await fetch(`${this.baseUrl}/api/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Offline fallback
    const list = OfflineStorage.get('grievances', DEFAULT_VILLAGE_DATA.grievances);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const token = `GP-PIPRI-2026-${randNum}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const slaMap = { 'water': 2, 'streetlights': 3, 'health': 3, 'sanitation': 4, 'ration': 5, 'roads': 7 };
    const sla_days = slaMap[data.category] || 3;

    const newG = {
      id: list.length + 1,
      token,
      ...data,
      status: 'Submitted',
      submitted_at: now,
      updated_at: now,
      sla_days,
      is_escalated: 0,
      escalation_reason: null,
      resolution_remarks: null,
      resolution_photo_url: null
    };

    list.unshift(newG);
    OfflineStorage.set('grievances', list);
    return { success: true, token, grievance: newG };
  },

  async updateGrievanceStatus(token, updateData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/grievances/${token}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.status === 401) throw Object.assign(new Error('Administrator sign-in expired. Please sign in again.'), { status: 401 });
      if (res.ok) return await res.json();
    } catch (e) { if (e.status === 401) throw e; }

    // Offline fallback
    const list = OfflineStorage.get('grievances', DEFAULT_VILLAGE_DATA.grievances);
    const idx = list.findIndex(g => g.token === token);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...updateData,
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      OfflineStorage.set('grievances', list);
      return { success: true, grievance: list[idx] };
    }
    return { success: false };
  },

  async fetchSchemes() {
    try {
      const res = await fetch(`${this.baseUrl}/api/schemes`);
      if (res.ok) {
        const json = await res.json();
        return json.schemes;
      }
    } catch (e) {}
    return OfflineStorage.get('schemes', DEFAULT_VILLAGE_DATA.schemes);
  },

  async fetchAgendaVotes() {
    try {
      const res = await fetch(`${this.baseUrl}/api/agenda-votes`);
      if (res.ok) {
        const json = await res.json();
        return json.agendas;
      }
    } catch (e) {}
    return OfflineStorage.get('agenda_votes', DEFAULT_VILLAGE_DATA.agenda_votes);
  },

  async voteAgenda(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/agenda-votes/${id}/vote`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {}

    const list = OfflineStorage.get('agenda_votes', DEFAULT_VILLAGE_DATA.agenda_votes);
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].votes_count += 1;
      OfflineStorage.set('agenda_votes', list);
      return { success: true, votes_count: list[idx].votes_count };
    }
    return { success: false };
  },

  async submitAgenda(agendaData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/agenda-votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendaData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const list = OfflineStorage.get('agenda_votes', DEFAULT_VILLAGE_DATA.agenda_votes);
    const newA = {
      id: list.length + 1,
      ...agendaData,
      votes_count: 1,
      status: 'Open For Voting',
      created_at: new Date().toISOString().split('T')[0]
    };
    list.unshift(newA);
    OfflineStorage.set('agenda_votes', list);
    return { success: true };
  },

  async fetchAssets() {
    try {
      const res = await fetch(`${this.baseUrl}/api/assets`);
      if (res.ok) {
        const json = await res.json();
        return json.assets;
      }
    } catch (e) {}
    return OfflineStorage.get('village_assets', DEFAULT_VILLAGE_DATA.village_assets);
  }
};

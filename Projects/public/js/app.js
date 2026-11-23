// public/js/app.js - GramaGlow: Digital Panchayat Reactive Single-Page Application
// Built with React pattern (Store, State hooks, Router, Context, Components)

(function () {
  'use strict';

  // --- Central Reactive App Store ---
  const AppState = {
    lang: localStorage.getItem('gramaglow_lang') || 'en',
    theme: localStorage.getItem('gramaglow_theme') || 'light',
    fontSize: localStorage.getItem('gramaglow_font') || 'medium',
    contrast: localStorage.getItem('gramaglow_contrast') || 'normal',
    currentRoute: window.location.hash.replace(/^#\/?/, '') || 'home',
    role: localStorage.getItem('gramaglow_role') || 'citizen', // 'citizen' | 'admin'

    // Data cache
    village: null,
    wards: [],
    notices: [],
    projects: [],
    grievances: [],
    schemes: [],
    agendas: [],
    assets: [],

    // Active UI states
    activeCategoryFilter: 'all',
    activeGrievanceFilter: 'all',
    activeWardFilter: 'all',
    searchQuery: '',
    selectedAsset: null,
    audioPlayingId: null,
    speechInstance: null,
    lastSubmittedToken: null,

    // Admin filter
    adminTab: 'grievances', // 'grievances' | 'projects' | 'broadcast' | 'audit'

    listeners: [],

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    },

    notify() {
      for (const fn of this.listeners) {
        fn(this);
      }
    },

    setState(patch) {
      Object.assign(this, patch);
      this.notify();
    }
  };

  // Translation helper
  function t(key) {
    const lang = AppState.lang;
    return (translations[lang] && translations[lang][key]) ||
           (translations['en'] && translations['en'][key]) ||
           key;
  }

  // --- Audio Broadcaster (Web Speech API) ---
  const AudioBroadcaster = {
    synth: window.speechSynthesis,

    play(noticeId, text, langCode) {
      if (!this.synth) {
        alert(AppState.lang === 'hi' ? 'आपके ब्राउज़र में आवाज़ वाचक उपलब्ध नहीं है।' : 'Text-to-speech not supported in this browser.');
        return;
      }

      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Try selecting suitable voice
      const voices = this.synth.getVoices();
      if (langCode === 'hi') {
        const hiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.lang.includes('IN'));
        if (hiVoice) utterance.voice = hiVoice;
      } else {
        const inVoice = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'));
        if (inVoice) utterance.voice = inVoice;
      }

      utterance.onend = () => {
        AppState.setState({ audioPlayingId: null });
      };

      utterance.onerror = () => {
        AppState.setState({ audioPlayingId: null });
      };

      AppState.setState({ audioPlayingId: noticeId, speechInstance: utterance });
      this.synth.speak(utterance);
    },

    stop() {
      if (this.synth) {
        this.synth.cancel();
      }
      AppState.setState({ audioPlayingId: null, speechInstance: null });
    }
  };

  // --- Currency & Date Formatters ---
  function formatRupees(amount) {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return d.toLocaleDateString(AppState.lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // Category Icon & Name Helper
  function getCategoryMeta(cat) {
    const isHi = AppState.lang === 'hi';
    switch (cat) {
      case 'water':
        return { icon: '💧', name: isHi ? 'पेयजल एवं नल' : 'Drinking Water / Tap', color: '#0284C7' };
      case 'sanitation':
        return { icon: '🧹', name: isHi ? 'सफाई एवं जल निकासी' : 'Drainage & Cleanliness', color: '#10B981' };
      case 'streetlights':
        return { icon: '💡', name: isHi ? 'स्ट्रीट लाइट' : 'Street Lighting', color: '#F59E0B' };
      case 'roads':
        return { icon: '🛣️', name: isHi ? 'सड़क एवं खडंजा' : 'Roads & Pavements', color: '#8B5CF6' };
      case 'ration':
        return { icon: '🌾', name: isHi ? 'राशन / कोटेदार' : 'Ration / PDS Shop', color: '#EF4444' };
      case 'health':
      case 'healthAngan':
        return { icon: '🏥', name: isHi ? 'स्वास्थ्य / आंगनवाड़ी' : 'Health / Anganwadi', color: '#EC4899' };
      case 'meeting':
        return { icon: '📢', name: isHi ? 'ग्राम सभा' : 'Gram Sabha', color: '#C85A32' };
      case 'agriculture':
        return { icon: '🚜', name: isHi ? 'कृषि एवं ई-केवाईसी' : 'Agriculture & e-KYC', color: '#16A34A' };
      case 'subsidy':
        return { icon: '⚡', name: isHi ? 'अनुदान योजना' : 'Govt Subsidy', color: '#6366F1' };
      default:
        return { icon: '🏛️', name: isHi ? 'सामान्य' : 'General', color: '#6B7280' };
    }
  }

  // Status Badge Helper
  function getStatusBadge(status, isEscalated) {
    if (isEscalated) {
      return `<span class="badge badge-escalated">⚠️ ${t('statusEscalated')}</span>`;
    }
    switch (status) {
      case 'Submitted':
        return `<span class="badge badge-submitted">📝 ${t('statusSubmitted')}</span>`;
      case 'Assigned':
        return `<span class="badge badge-assigned">👤 ${t('statusAssigned')}</span>`;
      case 'In Progress':
        return `<span class="badge badge-progress">⚙️ ${t('statusProgress')}</span>`;
      case 'Resolved':
        return `<span class="badge badge-resolved">✅ ${t('statusResolved')}</span>`;
      default:
        return `<span class="badge">${status}</span>`;
    }
  }

  // --- Router & Data Fetcher ---
  async function loadInitialData() {
    try {
      const [vData, notices, projects, grievances, schemes, agendas, assets] = await Promise.all([
        ApiClient.fetchVillage(),
        ApiClient.fetchNotices(),
        ApiClient.fetchProjects(),
        ApiClient.fetchGrievances(),
        ApiClient.fetchSchemes(),
        ApiClient.fetchAgendaVotes(),
        ApiClient.fetchAssets()
      ]);

      AppState.setState({
        village: vData.profile,
        wards: vData.wards,
        notices,
        projects,
        grievances,
        schemes,
        agendas,
        assets
      });
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  }

  function navigateTo(route) {
    window.location.hash = route;
    AppState.setState({ currentRoute: route, searchQuery: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', () => {
    const route = window.location.hash.replace(/^#\/?/, '') || 'home';
    if (route !== AppState.currentRoute) {
      AppState.setState({ currentRoute: route });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Apply Theme & Font to DOM
  function syncDomSettings() {
    document.documentElement.setAttribute('data-theme', AppState.theme);
    document.documentElement.setAttribute('data-font', AppState.fontSize);
    document.documentElement.setAttribute('data-contrast', AppState.contrast);
  }

  // --- Component Renderers ---

  // 1. Top Bar & Header Component
  function renderHeader() {
    const isHi = AppState.lang === 'hi';
    const isDark = AppState.theme === 'dark';
    const isHighContrast = AppState.contrast === 'high';

    return `
      <div class="gov-strip"></div>
      <div class="top-bar">
        <div class="container top-bar-inner">
          <div class="top-bar-left">
            <span class="emblem-pill">🇮🇳 ${t('govIndia')}</span>
            <span>•</span>
            <span>${t('stateGov')}</span>
          </div>
          <div class="top-bar-controls">
            <!-- Language Switcher -->
            <button class="control-btn" id="lang-btn" title="Toggle Language">
              🌐 <b>${t('langToggle')}</b>
            </button>

            <!-- Contrast Toggle -->
            <button class="control-btn" id="contrast-btn" title="High Contrast Mode">
              🌓 ${t('highContrast')} ${isHighContrast ? '✓' : ''}
            </button>

            <!-- Theme Toggle -->
            <button class="control-btn" id="theme-btn" title="Dark / Light Mode">
              ${isDark ? '☀️' : '🌙'}
            </button>

            <!-- Font Resizer -->
            <div class="font-btn-group" title="${t('fontSize')}">
              <button class="font-btn ${AppState.fontSize === 'small' ? 'active' : ''}" data-font="small">A-</button>
              <button class="font-btn ${AppState.fontSize === 'medium' ? 'active' : ''}" data-font="medium">A</button>
              <button class="font-btn ${AppState.fontSize === 'large' ? 'active' : ''}" data-font="large">A+</button>
              <button class="font-btn ${AppState.fontSize === 'xlarge' ? 'active' : ''}" data-font="xlarge">A++</button>
            </div>
          </div>
        </div>
      </div>

      <header class="main-header">
        <div class="container header-inner">
          <a href="#home" class="brand-wrapper">
            <div class="brand-emblem">🌾</div>
            <div class="brand-title-group">
              <h1>${t('portalTitle')}</h1>
              <div class="panchayat-sub">${t('portalSubtitle')}</div>
            </div>
          </a>

          <!-- Role Switcher -->
          <div class="role-toggle-wrapper">
            <button class="role-tab-btn ${AppState.role === 'citizen' ? 'active' : ''}" id="role-citizen-btn">
              👤 ${t('citizenView')}
            </button>
            <button class="role-tab-btn admin-mode ${AppState.role === 'admin' ? 'active' : ''}" id="role-admin-btn">
              🛡️ ${t('adminView')}
            </button>
          </div>
        </div>

        <!-- Navigation Strip -->
        <nav class="nav-bar">
          <div class="container">
            <ul class="nav-list">
              <li><a href="#home" class="nav-link ${AppState.currentRoute === 'home' ? 'active' : ''}">🏠 ${t('navHome')}</a></li>
              <li><a href="#profile" class="nav-link ${AppState.currentRoute === 'profile' ? 'active' : ''}">🏛️ ${t('navProfile')}</a></li>
              <li><a href="#notices" class="nav-link ${AppState.currentRoute === 'notices' ? 'active' : ''}">📢 ${t('navNotices')}</a></li>
              <li><a href="#projects" class="nav-link ${AppState.currentRoute === 'projects' ? 'active' : ''}">🏗️ ${t('navProjects')}</a></li>
              <li><a href="#grievance-new" class="nav-link ${AppState.currentRoute === 'grievance-new' ? 'active' : ''}">✍️ ${t('navGrievanceNew')}</a></li>
              <li><a href="#grievance-track" class="nav-link ${AppState.currentRoute === 'grievance-track' ? 'active' : ''}">📋 ${t('navGrievanceTrack')}</a></li>
              <li><a href="#schemes" class="nav-link ${AppState.currentRoute === 'schemes' ? 'active' : ''}">📑 ${t('navSchemes')}</a></li>
              <li><a href="#voting" class="nav-link ${AppState.currentRoute === 'voting' ? 'active' : ''}">🗳️ ${t('navVoting')}</a></li>
              <li><a href="#map" class="nav-link ${AppState.currentRoute === 'map' ? 'active' : ''}">🗺️ ${t('navMap')}</a></li>
              ${AppState.role === 'admin' ? `<li><a href="#admin" class="nav-link ${AppState.currentRoute === 'admin' ? 'active' : ''}" style="color:var(--terracotta);">⚙️ ${t('navAdmin')}</a></li>` : ''}
            </ul>
          </div>
        </nav>
      </header>
    `;
  }

  // 2. View: Home / Overview
  function renderHomeView() {
    const isHi = AppState.lang === 'hi';
    const profile = AppState.village || DEFAULT_VILLAGE_DATA.profile;
    const latestUrgentNotice = AppState.notices.find(n => n.priority === 'urgent') || AppState.notices[0];

    // Compute stats
    const totalProjects = AppState.projects.length;
    const totalBudget = AppState.projects.reduce((sum, p) => sum + p.sanctioned_budget, 0);
    const totalSpent = AppState.projects.reduce((sum, p) => sum + p.spent_amount, 0);
    const totalGrievances = AppState.grievances.length;
    const resolvedGrievances = AppState.grievances.filter(g => g.status === 'Resolved').length;
    const resolutionRate = totalGrievances ? Math.round((resolvedGrievances / totalGrievances) * 100) : 100;

    const isAudioPlaying = latestUrgentNotice && AppState.audioPlayingId === latestUrgentNotice.id;

    return `
      <div class="animate-slide-up">
        <!-- Hero Banner -->
        <section class="hero-banner">
          <div class="hero-tag">🌟 ${t('heroBadge')}</div>
          <h2 class="hero-title">${t('heroTitle')}</h2>
          <p class="hero-desc">${t('heroDesc')}</p>
          <div class="hero-actions">
            <a href="#grievance-new" class="btn btn-terracotta btn-lg">✍️ ${t('heroBtnFile')}</a>
            <a href="#projects" class="btn btn-outline btn-lg" style="color:#FFF; border-color:rgba(255,255,255,0.6);">📊 ${t('heroBtnTrack')}</a>
            ${latestUrgentNotice ? `
              <button class="audio-bar-control ${isAudioPlaying ? 'playing' : ''}" id="hero-listen-btn">
                <span class="audio-wave"><span></span><span></span><span></span><span></span></span>
                ${isAudioPlaying ? t('stopAudio') : t('heroBtnAudio')}
              </button>
            ` : ''}
          </div>
        </section>

        <!-- Demographics Quick KPI Strip -->
        <div class="grid-4" style="margin-bottom: 2rem;">
          <div class="card" style="border-left: 4px solid var(--primary-green);">
            <div class="card-subtitle">${t('statPop')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-green);">${profile.population.toLocaleString('en-IN')}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${profile.households} ${t('statHouseholds')} • ${profile.literacy_rate}% ${isHi ? 'साक्षरता' : 'Literacy'}</div>
          </div>

          <div class="card" style="border-left: 4px solid var(--terracotta);">
            <div class="card-subtitle">${t('statWards')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--terracotta);">${profile.wards_count} ${isHi ? 'वार्ड' : 'Wards'}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${isHi ? 'सरपंच: श्रीमती सविता देवी' : 'Sarpanch: Smt. Savita Devi'}</div>
          </div>

          <div class="card" style="border-left: 4px solid var(--khaki-gold);">
            <div class="card-subtitle">${t('statActiveProjects')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--khaki-gold);">${totalProjects} ${isHi ? 'कार्य' : 'Works'}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${formatRupees(totalSpent)} / ${formatRupees(totalBudget)}</div>
          </div>

          <div class="card" style="border-left: 4px solid #10B981;">
            <div class="card-subtitle">${t('statGrievancesResolved')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #10B981;">${resolutionRate}%</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${resolvedGrievances} ${isHi ? 'निस्तारित' : 'Resolved'} / ${totalGrievances} ${isHi ? 'कुल' : 'Total'}</div>
          </div>
        </div>

        <!-- Quick Action Tiles -->
        <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">⚡ ${isHi ? 'नागरिक त्वरित सेवाएं' : 'Quick Citizen Portals'}</h3>
        <div class="action-grid">
          <a href="#grievance-new" class="action-tile">
            <div class="action-tile-icon" style="background:#FEE2E2; color:#DC2626;">📝</div>
            <div class="action-tile-content">
              <h3>${t('actionLodgeTitle')}</h3>
              <p>${t('actionLodgeDesc')}</p>
            </div>
          </a>

          <a href="#projects" class="action-tile">
            <div class="action-tile-icon" style="background:#E0E7FF; color:#4338CA;">🏗️</div>
            <div class="action-tile-content">
              <h3>${t('actionBudgetTitle')}</h3>
              <p>${t('actionBudgetDesc')}</p>
            </div>
          </a>

          <a href="#voting" class="action-tile">
            <div class="action-tile-icon" style="background:#FEF3C7; color:#B45309;">🗳️</div>
            <div class="action-tile-content">
              <h3>${t('actionSabhaTitle')}</h3>
              <p>${t('actionSabhaDesc')}</p>
            </div>
          </a>

          <a href="#notices" class="action-tile">
            <div class="action-tile-icon" style="background:#D1FAE5; color:#047857;">📢</div>
            <div class="action-tile-content">
              <h3>${t('actionNoticesTitle')}</h3>
              <p>${t('actionNoticesDesc')}</p>
            </div>
          </a>
        </div>

        <!-- Latest Announcement Card Preview -->
        ${latestUrgentNotice ? `
          <div class="card" style="border: 2px solid var(--terracotta); background: var(--terracotta-subtle); margin-top: 2rem;">
            <div class="card-header">
              <div>
                <span class="badge badge-urgent">🚨 ${t('urgentNotice')}</span>
                <h3 style="margin-top:0.4rem; color:var(--text-primary); font-size:1.2rem;">
                  ${isHi ? latestUrgentNotice.title_hi : latestUrgentNotice.title_en}
                </h3>
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">
                  🗓️ ${t('dateLabel')} ${formatDate(latestUrgentNotice.issue_date)} • 🏛️ ${isHi ? latestUrgentNotice.authority_hi : latestUrgentNotice.authority_en}
                </div>
              </div>
              <button class="audio-bar-control ${isAudioPlaying ? 'playing' : ''}" data-notice-id="${latestUrgentNotice.id}" data-audio-text="${isHi ? latestUrgentNotice.audio_text_hi : latestUrgentNotice.audio_text_en}">
                <span class="audio-wave"><span></span><span></span><span></span><span></span></span>
                ${isAudioPlaying ? t('stopAudio') : t('listenNotice')}
              </button>
            </div>
            <p style="font-size:0.95rem; color:var(--text-primary); line-height:1.6;">
              ${isHi ? latestUrgentNotice.content_hi : latestUrgentNotice.content_en}
            </p>
            ${latestUrgentNotice.venue_en ? `
              <div style="margin-top:0.8rem; font-size:0.85rem; font-weight:600; color:var(--terracotta-dark);">
                📍 ${t('venueLabel')} ${isHi ? latestUrgentNotice.venue_hi : latestUrgentNotice.venue_en} (${latestUrgentNotice.meeting_datetime})
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // 3. View: Gram Panchayat Profile & Governance Board
  function renderProfileView() {
    const isHi = AppState.lang === 'hi';
    const p = AppState.village || DEFAULT_VILLAGE_DATA.profile;
    const wards = AppState.wards.length ? AppState.wards : DEFAULT_VILLAGE_DATA.wards;

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.6rem; color: var(--primary-green);">🏛️ ${isHi ? 'ग्राम पंचायत पिपरी - परिचय एवं निर्वाचित प्रतिनिधि' : 'Gram Panchayat Pipri - Profile & Elected Leadership'}</h2>
          <p style="color: var(--text-secondary);">${isHi ? 'खंड चुनार, जनपद मिर्ज़ापुर, उत्तर प्रदेश (पिन: 231304)' : 'Block Chunar, District Mirzapur, Uttar Pradesh (PIN: 231304)'}</p>
        </div>

        <!-- Leadership Highlight Cards -->
        <div class="grid-2" style="margin-bottom: 2rem;">
          <!-- Sarpanch Card -->
          <div class="card" style="border-top: 4px solid var(--terracotta);">
            <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1rem;">
              <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--terracotta), var(--khaki-gold)); color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; box-shadow: var(--shadow-md);">
                👩‍💼
              </div>
              <div>
                <span class="badge badge-assigned" style="margin-bottom: 0.3rem;">👑 ${isHi ? 'ग्राम प्रधान / सरपंच' : 'Elected Sarpanch'}</span>
                <h3 style="font-size: 1.3rem;">${isHi ? p.sarpanch_name_hi : p.sarpanch_name_en}</h3>
                <div style="font-size: 0.88rem; color: var(--text-secondary);">📞 <a href="tel:${p.sarpanch_phone}">${p.sarpanch_phone}</a></div>
              </div>
            </div>
            <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.8rem;">
              "${isHi ? p.sarpanch_bio_hi : p.sarpanch_bio_en}"
            </p>
            <div style="font-size: 0.82rem; background: var(--bg-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
              ⏰ <b>${isHi ? 'जनसुनवाई समय:' : 'Public Hearing:'}</b> ${isHi ? p.office_timing_hi : p.office_timing_en}
            </div>
          </div>

          <!-- Panchayat Secretary Card -->
          <div class="card" style="border-top: 4px solid var(--primary-green);">
            <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1rem;">
              <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-green), #0284C7); color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; box-shadow: var(--shadow-md);">
                👨‍💼
              </div>
              <div>
                <span class="badge badge-progress" style="margin-bottom: 0.3rem;">📜 ${isHi ? 'ग्राम पंचायत सचिव (VDO)' : 'Panchayat Secretary (VDO)'}</span>
                <h3 style="font-size: 1.3rem;">${isHi ? p.secretary_name_hi : p.secretary_name_en}</h3>
                <div style="font-size: 0.88rem; color: var(--text-secondary);">📞 <a href="tel:${p.secretary_phone}">${p.secretary_phone}</a></div>
              </div>
            </div>
            <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.8rem;">
              ${isHi ? 'जन्म-मृत्यु प्रमाण पत्र, परिवार रजिस्टर नकल, राशन कार्ड सत्यापन एवं विकास योजनाओं के प्रशासनिक प्रभारी।' : 'Administrative officer for birth/death certificates, family register copies, ration card endorsement, and government grant disbursement.'}
            </p>
            <div style="font-size: 0.82rem; background: var(--bg-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
              📍 <b>${isHi ? 'कार्यालय पता:' : 'Office:'}</b> ${isHi ? p.panchayat_bhavan_address_hi : p.panchayat_bhavan_address_en}
            </div>
          </div>
        </div>

        <!-- Village Demographics Metric Grid -->
        <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">📊 ${isHi ? 'जनसांख्यिकीय एवं भौगोलिक विवरण' : 'Demographic & Geographical Metrics'}</h3>
        <div class="grid-4" style="margin-bottom: 2.5rem;">
          <div class="card" style="text-align: center;">
            <div style="font-size: 2rem;">👥</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary-green); margin: 0.3rem 0;">${p.population}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${isHi ? 'कुल ग्रामीण जनसंख्या' : 'Total Village Population'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${p.male_pop} ♂ | ${p.female_pop} ♀</div>
          </div>

          <div class="card" style="text-align: center;">
            <div style="font-size: 2rem;">🏡</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--terracotta); margin: 0.3rem 0;">${p.households}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${isHi ? 'आवासीय परिवार (Households)' : 'Total Households'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${isHi ? '8 वार्डों में विभक्त' : 'Spanned across 8 Wards'}</div>
          </div>

          <div class="card" style="text-align: center;">
            <div style="font-size: 2rem;">📖</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--khaki-gold); margin: 0.3rem 0;">${p.literacy_rate}%</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${isHi ? 'साक्षरता दर (Literacy)' : 'Literacy Rate'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${isHi ? '2 प्राथमिक विद्यालय + 2 आंगनवाड़ी' : '2 Schools + 2 Anganwadis'}</div>
          </div>

          <div class="card" style="text-align: center;">
            <div style="font-size: 2rem;">🗺️</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #0284C7; margin: 0.3rem 0;">${p.total_area_sqkm} sq km</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${isHi ? 'कुल भौगोलिक क्षेत्रफल' : 'Geographical Land Area'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">${isHi ? 'कृषि भूमि: 68% | रिहायशी: 22%' : '68% Agri | 22% Residential'}</div>
          </div>
        </div>

        <!-- 8 Ward Members Roster Table/Grid -->
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">🗳️ ${isHi ? 'वार्ड सदस्य नामावली (सभी 8 वार्ड प्रतिनिधि)' : 'Elected Ward Members Roster (8 Wards)'}</h3>
              <p class="card-subtitle">${isHi ? 'नागरिक अपनी समस्या के त्वरित समाधान हेतु सीधे अपने वार्ड सदस्य से संपर्क कर सकते हैं' : 'Citizens can contact their designated Ward Member directly for local complaints'}</p>
            </div>
            <span class="badge badge-progress">${wards.length} ${isHi ? 'सक्रिय वार्ड' : 'Active Wards'}</span>
          </div>

          <div class="grid-2" style="margin-top: 1rem;">
            ${wards.map(w => `
              <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; background: var(--bg-surface); display: flex; gap: 1rem; align-items: flex-start;">
                <div style="width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--primary-green-subtle); color: var(--primary-green); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0;">
                  #${w.ward_number}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4 style="font-size: 1rem; color: var(--text-primary);">${isHi ? w.name_hi : w.name_en}</h4>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${w.voters_count} ${isHi ? 'मतदाता' : 'Voters'}</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--terracotta); font-weight: 600; margin-top: 2px;">
                    📍 ${isHi ? w.area_name_hi : w.area_name_en}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                    🎯 <b>${isHi ? 'प्राथमिकता:' : 'Focus:'}</b> ${isHi ? w.focus_area_hi : w.focus_area_en}
                  </div>
                  <div style="margin-top: 8px;">
                    <a href="tel:${w.phone}" class="btn btn-outline btn-sm" style="font-size: 0.78rem; padding: 0.2rem 0.6rem;">
                      📞 ${w.phone}
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // 4. View: Official Notices & Announcement Feed
  function renderNoticesView() {
    const isHi = AppState.lang === 'hi';
    const notices = AppState.notices.length ? AppState.notices : DEFAULT_VILLAGE_DATA.notices;

    // Filter by category
    const cat = AppState.activeCategoryFilter;
    const filtered = cat === 'all' ? notices : notices.filter(n => n.category === cat);

    const categories = [
      { id: 'all', label: t('allCategories') },
      { id: 'meeting', label: t('catMeeting') },
      { id: 'health', label: t('catHealth') },
      { id: 'agriculture', label: t('catAgri') },
      { id: 'subsidy', label: t('catSubsidy') }
    ];

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.6rem; color: var(--primary-green);">📢 ${t('noticesHeading')}</h2>
            <p style="color: var(--text-secondary);">${t('noticesSub')}</p>
          </div>
          ${AppState.role === 'admin' ? `
            <a href="#admin" class="btn btn-terracotta btn-sm">➕ ${isHi ? 'नई घोषणा प्रकाशित करें' : 'Broadcast New Notice'}</a>
          ` : ''}
        </div>

        <!-- Filter Pills -->
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
          ${categories.map(c => `
            <button class="btn btn-sm ${AppState.activeCategoryFilter === c.id ? 'btn-primary' : 'btn-outline'}" data-notice-cat="${c.id}">
              ${c.label}
            </button>
          `).join('')}
        </div>

        <!-- Notices Cards List -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${filtered.map(n => {
            const isPlaying = AppState.audioPlayingId === n.id;
            const meta = getCategoryMeta(n.category);
            const audioText = isHi ? n.audio_text_hi : n.audio_text_en;

            return `
              <div class="card" style="border-left: 5px solid ${n.priority === 'urgent' ? '#EF4444' : meta.color};">
                <div class="card-header">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
                      <span class="badge" style="background: ${meta.color}20; color: ${meta.color}; font-weight: 700;">
                        ${meta.icon} ${meta.name}
                      </span>
                      ${n.priority === 'urgent' ? `<span class="badge badge-urgent">🚨 ${t('urgentNotice')}</span>` : ''}
                      <span style="font-size: 0.8rem; color: var(--text-muted);">
                        🗓️ ${t('dateLabel')} ${formatDate(n.issue_date)}
                      </span>
                    </div>
                    <h3 style="font-size: 1.2rem; color: var(--text-primary);">
                      ${isHi ? n.title_hi : n.title_en}
                    </h3>
                    <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem;">
                      🏛️ <b>${t('authorityLabel')}</b> ${isHi ? n.authority_hi : n.authority_en}
                    </div>
                  </div>

                  <!-- Audio Read Button -->
                  <button class="audio-bar-control ${isPlaying ? 'playing' : ''}" data-notice-id="${n.id}" data-audio-text="${audioText}">
                    <span class="audio-wave"><span></span><span></span><span></span><span></span></span>
                    ${isPlaying ? t('stopAudio') : t('listenNotice')}
                  </button>
                </div>

                <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.6; margin-bottom: 0.85rem;">
                  ${isHi ? n.content_hi : n.content_en}
                </p>

                ${n.venue_en || n.meeting_datetime ? `
                  <div style="background: var(--bg-subtle); padding: 0.6rem 0.9rem; border-radius: var(--radius-md); font-size: 0.85rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
                    ${n.venue_en ? `<div>📍 <b>${t('venueLabel')}</b> ${isHi ? n.venue_hi : n.venue_en}</div>` : ''}
                    ${n.meeting_datetime ? `<div>⏰ <b>${isHi ? 'समय:' : 'Schedule:'}</b> ${n.meeting_datetime}</div>` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 5. View: Village Development Project & Budget Tracker
  function renderProjectsView() {
    const isHi = AppState.lang === 'hi';
    const projects = AppState.projects.length ? AppState.projects : DEFAULT_VILLAGE_DATA.projects;

    // Financial totals
    const totalSanctioned = projects.reduce((s, p) => s + p.sanctioned_budget, 0);
    const totalSpent = projects.reduce((s, p) => s + p.spent_amount, 0);
    const totalBalance = totalSanctioned - totalSpent;
    const overallPct = Math.round((totalSpent / totalSanctioned) * 100);

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.6rem; color: var(--primary-green);">🏗️ ${t('projectsHeading')}</h2>
          <p style="color: var(--text-secondary);">${t('projectsSub')}</p>
        </div>

        <!-- Overall Budget Financial Summary Card -->
        <div class="card" style="background: linear-gradient(135deg, var(--bg-card) 0%, var(--primary-green-subtle) 100%); border-top: 4px solid var(--primary-green); margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <span class="badge badge-progress" style="margin-bottom: 0.3rem;">💰 ${isHi ? '15वां वित्त आयोग सार्वजनिक निधि सारांश' : '15th Finance Commission Public Fund Audit'}</span>
              <h3 style="font-size: 1.35rem; color: var(--text-primary);">${isHi ? 'कुल स्वीकृत विकास बजट एवं वास्तविक व्यय' : 'Total Approved Capital Budget vs Actual Expenditure'}</h3>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-green);">${overallPct}%</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">${isHi ? 'समग्र निधि उपयोग' : 'Overall Fund Utilization'}</div>
            </div>
          </div>

          <!-- Overall Progress Bar -->
          <div class="progress-bar-container" style="height: 14px;">
            <div class="progress-bar-fill" style="width: ${overallPct}%;"></div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${t('sanctionedBudget')}:</span>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">${formatRupees(totalSanctioned)}</div>
            </div>
            <div>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${t('spentAmount')}:</span>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-green);">${formatRupees(totalSpent)}</div>
            </div>
            <div>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${t('balanceAmount')}:</span>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--terracotta);">${formatRupees(totalBalance)}</div>
            </div>
          </div>
        </div>

        <!-- Itemized Project Cards List -->
        <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">📋 ${isHi ? 'सक्रिय एवं पूर्ण हुई ग्राम निर्माण परियोजनाएं' : 'Ongoing & Completed Village Works'}</h3>
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${projects.map(p => {
            const balance = p.sanctioned_budget - p.spent_amount;
            const spentPct = Math.round((p.spent_amount / p.sanctioned_budget) * 100);
            const isCompleted = p.status === 'Completed' || p.completion_pct >= 100;
            const meta = getCategoryMeta(p.category);

            return `
              <div class="card" style="border-left: 5px solid ${isCompleted ? '#10B981' : 'var(--terracotta)'};">
                <div class="card-header">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
                      <span class="badge" style="background: ${meta.color}20; color: ${meta.color}; font-weight: 700;">
                        ${meta.icon} ${meta.name}
                      </span>
                      <span class="badge ${isCompleted ? 'badge-resolved' : 'badge-progress'}">
                        ${isCompleted ? '✅ ' + (isHi ? 'पूर्ण' : 'Completed') : '⚙️ ' + (isHi ? 'प्रगति पर' : 'In Progress')}
                      </span>
                      <span style="font-size: 0.82rem; color: var(--text-secondary);">
                        📍 <b>${isHi ? 'वार्ड:' : 'Ward:'}</b> ${p.ward_number === 0 ? (isHi ? 'संपूर्ण ग्राम' : 'All Wards') : `Ward ${p.ward_number}`}
                      </span>
                    </div>

                    <h3 style="font-size: 1.2rem; color: var(--text-primary);">
                      ${isHi ? p.title_hi : p.title_en}
                    </h3>
                  </div>

                  <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 800; color: ${isCompleted ? '#10B981' : 'var(--primary-green)'};">
                      ${p.completion_pct}%
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${t('progressPct')}</div>
                  </div>
                </div>

                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
                  ${isHi ? p.description_hi : p.description_en}
                </p>

                <!-- Financial Progress Bar -->
                <div style="margin-bottom: 1rem;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                    <span><b>${t('spentAmount')}:</b> ${formatRupees(p.spent_amount)} (${spentPct}%)</span>
                    <span><b>${t('sanctionedBudget')}:</b> ${formatRupees(p.sanctioned_budget)}</span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${p.completion_pct}%;"></div>
                  </div>
                  <div class="budget-stats-strip">
                    <span>${isHi ? 'अवशेष राशि:' : 'Balance Available:'} <b>${formatRupees(balance)}</b></span>
                    <span>${t('targetDate')}: <b>${p.target_date}</b></span>
                  </div>
                </div>

                <!-- Milestones Stepper Checklist -->
                ${p.milestones && p.milestones.length ? `
                  <div style="background: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-md); margin-top: 0.75rem;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
                      📌 ${t('milestoneProgress')}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem;">
                      ${p.milestones.map(m => `
                        <div style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.82rem;">
                          <span>${m.done ? '🟢' : '⚪'}</span>
                          <span style="${m.done ? 'text-decoration: line-through; opacity: 0.85;' : 'font-weight: 600;'}">
                            ${m.name}
                          </span>
                          <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">${m.date}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.9rem; font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap; gap: 0.5rem;">
                  <div>🏢 <b>${t('contractorLabel')}:</b> ${p.contractor_name}</div>
                  ${AppState.role === 'admin' ? `
                    <button class="btn btn-outline btn-sm admin-update-project-btn" data-project-id="${p.id}" data-project-title="${p.title_en}">
                      ✏️ ${isHi ? 'प्रगति अपडेट करें' : 'Update Milestone'}
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 6. View: Citizen Grievance Lodging Portal
  function renderGrievanceNewView() {
    const isHi = AppState.lang === 'hi';
    const wards = AppState.wards.length ? AppState.wards : DEFAULT_VILLAGE_DATA.wards;

    const categories = [
      { id: 'water', icon: '💧', name: isHi ? 'पेयजल / नल' : 'Drinking Water' },
      { id: 'streetlights', icon: '💡', name: isHi ? 'स्ट्रीट लाइट' : 'Streetlights' },
      { id: 'sanitation', icon: '🧹', name: isHi ? 'सफाई व नाली' : 'Sanitation / Drain' },
      { id: 'roads', icon: '🛣️', name: isHi ? 'सड़क व खडंजा' : 'Roads / Path' },
      { id: 'ration', icon: '🌾', name: isHi ? 'राशन दुकान' : 'Ration / PDS' },
      { id: 'health', icon: '🏥', name: isHi ? 'स्वास्थ्य केंद्र' : 'Health / Angan' }
    ];

    // If just submitted
    if (AppState.lastSubmittedToken) {
      const token = AppState.lastSubmittedToken;
      return `
        <div class="card animate-slide-up" style="max-width: 680px; margin: 2rem auto; text-align: center; padding: 2.5rem 1.5rem; border-top: 5px solid var(--primary-green);">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #D1FAE5; color: #047857; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.25rem auto;">
            ✅
          </div>
          <h2 style="font-size: 1.6rem; color: var(--primary-green); margin-bottom: 0.5rem;">
            ${t('complaintSuccess')}
          </h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
            ${t('tokenNote')}
          </p>

          <div style="background: var(--bg-subtle); border: 2px dashed var(--primary-green); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${t('tokenDisplay')}</div>
            <div style="font-size: 2rem; font-weight: 800; color: var(--terracotta); letter-spacing: 1px; margin: 0.35rem 0;">
              ${token}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              📲 ${isHi ? 'टोकन विवरण एसएमएस द्वारा आपके मोबाइल पर भी भेजा गया है।' : 'Confirmation SMS dispatched to your registered mobile.'}
            </div>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" id="track-token-btn" data-token="${token}">
              📋 ${isHi ? 'शिकायत की स्थिति ट्रैक करें' : 'Track This Complaint'}
            </button>
            <button class="btn btn-outline" id="file-another-btn">
              ✍️ ${isHi ? 'दूसरी शिकायत दर्ज करें' : 'Lodge Another Complaint'}
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="animate-slide-up" style="max-width: 780px; margin: 0 auto;">
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <h2 style="font-size: 1.7rem; color: var(--primary-green);">✍️ ${t('grievanceHeading')}</h2>
          <p style="color: var(--text-secondary); max-width: 600px; margin: 0.4rem auto 0 auto;">
            ${t('grievanceSub')}
          </p>
        </div>

        <form id="grievance-form" class="card" style="box-shadow: var(--shadow-md);">
          <!-- Step 1: Category Picker -->
          <div class="form-group">
            <label class="form-label">
              ${t('chooseCategory')} <span class="required">*</span>
            </label>
            <div class="category-picker-grid" id="cat-picker">
              ${categories.map((c, i) => `
                <div class="category-card-btn ${i === 0 ? 'selected' : ''}" data-cat="${c.id}">
                  <span class="cat-icon">${c.icon}</span>
                  <span class="cat-name">${c.name}</span>
                </div>
              `).join('')}
            </div>
            <input type="hidden" id="selected-category" value="water" />
          </div>

          <!-- Step 2: Citizen Details -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="citizen-name">
                👤 ${t('citizenName')} <span class="required">*</span>
              </label>
              <input type="text" id="citizen-name" class="form-control" placeholder="${isHi ? 'उदा. रामस्वरूप बिंद' : 'e.g. Rameshwar Bind'}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="citizen-phone">
                📱 ${t('mobilePhone')} <span class="required">*</span>
              </label>
              <input type="tel" id="citizen-phone" class="form-control" placeholder="94XXXXXXXX" pattern="[0-9]{10}" maxlength="10" required />
            </div>
          </div>

          <!-- Step 3: Ward and Location -->
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="ward-select">
                📍 ${t('selectWard')} <span class="required">*</span>
              </label>
              <select id="ward-select" class="form-control" required>
                ${wards.map(w => `
                  <option value="${w.ward_number}">
                    Ward ${w.ward_number}: ${isHi ? w.area_name_hi : w.area_name_en} (${isHi ? w.name_hi : w.name_en})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="urgency-select">
                ⚡ ${t('urgencyLevel')}
              </label>
              <select id="urgency-select" class="form-control">
                <option value="Normal">${t('urgencyNormal')} (SLA 3-7 days)</option>
                <option value="High">${t('urgencyHigh')} (SLA 2-3 days)</option>
                <option value="Critical">${t('urgencyCritical')} (SLA 24-48 hrs)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="landmark-input">
              🏠 ${t('landmarkAddr')} <span class="required">*</span>
            </label>
            <input type="text" id="landmark-input" class="form-control" placeholder="${isHi ? 'उदा. पुराने बरगद के पेड़ के पास, पुरवा टोला' : 'e.g. Near Old Banyan Tree, Purva Tola'}" required />
          </div>

          <!-- Step 4: Description -->
          <div class="form-group">
            <label class="form-label" for="problem-desc">
              📝 ${t('problemDesc')} <span class="required">*</span>
            </label>
            <textarea id="problem-desc" class="form-control" placeholder="${isHi ? 'समस्या का विस्तार से वर्णन करें, जैसे कब से खराब है, कितने लोगों को समस्या हो रही है...' : 'Explain the issue clearly (e.g. tap pumping muddy water for 3 days, 20 families affected)...'}" required></textarea>
          </div>

          <!-- Step 5: Photo Proof Simulation / Quick Pick -->
          <div class="form-group">
            <label class="form-label">
              📷 ${t('photoProof')}
            </label>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
              <button type="button" class="btn btn-outline btn-sm quick-sample-photo" data-photo="sample_water.jpg">
                💧 ${t('sampleWater')}
              </button>
              <button type="button" class="btn btn-outline btn-sm quick-sample-photo" data-photo="sample_light.jpg">
                💡 ${t('sampleLight')}
              </button>
              <button type="button" class="btn btn-outline btn-sm quick-sample-photo" data-photo="sample_road.jpg">
                🛣️ ${t('sampleRoad')}
              </button>
            </div>

            <div id="photo-preview-wrap" style="display: none; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); align-items: center; gap: 0.75rem;">
              <span style="font-size: 1.5rem;">📸</span>
              <span id="photo-filename" style="font-size: 0.85rem; font-weight: 600;"></span>
              <button type="button" id="remove-photo-btn" class="btn btn-outline btn-sm" style="margin-left: auto; padding: 0.15rem 0.5rem;">✕</button>
            </div>
            <input type="hidden" id="photo-url" value="" />
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-terracotta btn-lg" style="width: 100%; margin-top: 0.5rem;">
            🚀 ${t('submitComplaintBtn')}
          </button>
        </form>
      </div>
    `;
  }

  // 7. View: Grievance Resolution & Ward Status Board
  function renderGrievanceTrackView() {
    const isHi = AppState.lang === 'hi';
    const grievances = AppState.grievances.length ? AppState.grievances : DEFAULT_VILLAGE_DATA.grievances;
    const wards = AppState.wards.length ? AppState.wards : DEFAULT_VILLAGE_DATA.wards;

    // Filters
    const query = AppState.searchQuery.toLowerCase().trim();
    const statusFilter = AppState.activeGrievanceFilter;
    const wardFilter = AppState.activeWardFilter;

    let filtered = grievances.filter(g => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (wardFilter !== 'all' && g.ward_number !== parseInt(wardFilter, 10)) return false;
      if (query) {
        return g.token.toLowerCase().includes(query) ||
               g.citizen_name.toLowerCase().includes(query) ||
               g.landmark.toLowerCase().includes(query) ||
               g.description.toLowerCase().includes(query);
      }
      return true;
    });

    const statusOptions = [
      { id: 'all', label: isHi ? 'सभी शिकायतें' : 'All Complaints' },
      { id: 'Submitted', label: t('statusSubmitted') },
      { id: 'Assigned', label: t('statusAssigned') },
      { id: 'In Progress', label: t('statusProgress') },
      { id: 'Resolved', label: t('statusResolved') }
    ];

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.6rem; color: var(--primary-green);">📋 ${t('trackingHeading')}</h2>
            <p style="color: var(--text-secondary);">${t('trackingSub')}</p>
          </div>
          <a href="#grievance-new" class="btn btn-terracotta btn-sm">➕ ${isHi ? 'नई शिकायत दर्ज करें' : 'File New Grievance'}</a>
        </div>

        <!-- Search & Filter Controls Card -->
        <div class="card" style="margin-bottom: 1.5rem; padding: 1.2rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: center;">
            <!-- Search Input -->
            <div>
              <input type="text" id="grievance-search" class="form-control" placeholder="🔍 ${t('searchPlaceholder')}" value="${AppState.searchQuery}" />
            </div>

            <!-- Status Filter -->
            <div>
              <select id="grievance-status-select" class="form-control">
                ${statusOptions.map(s => `
                  <option value="${s.id}" ${AppState.activeGrievanceFilter === s.id ? 'selected' : ''}>${s.label}</option>
                `).join('')}
              </select>
            </div>

            <!-- Ward Filter -->
            <div>
              <select id="grievance-ward-select" class="form-control">
                <option value="all">${isHi ? 'सभी वार्ड (वार्ड 1 से 8)' : 'All Wards (Ward 1 to 8)'}</option>
                ${wards.map(w => `
                  <option value="${w.ward_number}" ${AppState.activeWardFilter === String(w.ward_number) ? 'selected' : ''}>
                    Ward ${w.ward_number}: ${isHi ? w.area_name_hi : w.area_name_en}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Grievances List Cards -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${filtered.length === 0 ? `
            <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
              <h3 style="color: var(--text-secondary);">${isHi ? 'कोई शिकायत नहीं मिली' : 'No matching grievances found'}</h3>
              <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">${isHi ? 'कृपया खोज शब्द या फिल्टर बदलकर देखें।' : 'Try adjusting your search criteria or filter.'}</p>
            </div>
          ` : filtered.map(g => {
            const meta = getCategoryMeta(g.category);

            // Stepper status index
            const stepIndex = g.status === 'Submitted' ? 0 : (g.status === 'Assigned' ? 1 : (g.status === 'In Progress' ? 2 : 3));

            return `
              <div class="card" style="border-left: 5px solid ${g.is_escalated ? '#EF4444' : (g.status === 'Resolved' ? '#10B981' : 'var(--terracotta)')};">
                <div class="card-header">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
                      <span class="badge" style="background: ${meta.color}20; color: ${meta.color}; font-weight: 700;">
                        ${meta.icon} ${meta.name}
                      </span>
                      ${getStatusBadge(g.status, g.is_escalated)}
                      <span style="font-size: 0.85rem; font-weight: 700; color: var(--terracotta);">
                        🎫 ${g.token}
                      </span>
                    </div>

                    <h3 style="font-size: 1.15rem; color: var(--text-primary);">
                      ${g.landmark}
                    </h3>
                    <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem;">
                      👤 <b>${g.citizen_name}</b> (Ward ${g.ward_number}) • 🗓️ ${formatDate(g.submitted_at)}
                    </div>
                  </div>

                  <div style="text-align: right;">
                    <span class="badge" style="background: var(--bg-subtle); color: var(--text-secondary);">
                      ⏱️ ${t('slaDays')} ${g.sla_days} ${t('days')}
                    </span>
                  </div>
                </div>

                <!-- Problem Description -->
                <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.5; margin-bottom: 1rem;">
                  "${g.description}"
                </p>

                <!-- SLA Escalation Warning Banner -->
                ${g.is_escalated ? `
                  <div style="background: var(--status-escalated-bg); color: var(--status-escalated-text); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1rem; border: 1px solid #EF4444; display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.3rem;">⚠️</span>
                    <div>
                      <b>${t('escalationAlert')}</b><br/>
                      <span style="font-size: 0.8rem;">${g.escalation_reason || 'Escalated to Block Development Officer (BDO) Chunar'}</span>
                    </div>
                  </div>
                ` : ''}

                <!-- Timeline Stepper -->
                <div class="timeline-stepper">
                  <div class="timeline-step ${stepIndex >= 0 ? (stepIndex === 0 ? 'current' : 'completed') : ''}">
                    <div class="step-node">${stepIndex > 0 ? '✓' : '1'}</div>
                    <div class="step-label">${t('statusSubmitted')}</div>
                  </div>
                  <div class="timeline-step ${stepIndex >= 1 ? (stepIndex === 1 ? 'current' : 'completed') : ''}">
                    <div class="step-node">${stepIndex > 1 ? '✓' : '2'}</div>
                    <div class="step-label">${isHi ? 'वार्ड सदस्य' : 'Assigned'}</div>
                  </div>
                  <div class="timeline-step ${stepIndex >= 2 ? (stepIndex === 2 ? 'current' : 'completed') : ''}">
                    <div class="step-node">${stepIndex > 2 ? '✓' : '3'}</div>
                    <div class="step-label">${t('statusProgress')}</div>
                  </div>
                  <div class="timeline-step ${stepIndex >= 3 ? 'completed' : ''}">
                    <div class="step-node">${stepIndex >= 3 ? '✓' : '4'}</div>
                    <div class="step-label">${t('statusResolved')}</div>
                  </div>
                </div>

                <!-- Resolution Remarks / Assignment Info -->
                <div style="background: var(--bg-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem;">
                  <div>
                    👤 <b>${t('assignedTo')}</b> ${g.assigned_to_name || (isHi ? 'प्रक्रियाधीन' : 'Pending Assignment')}
                  </div>
                  ${g.resolution_remarks ? `
                    <div style="color: #047857;">
                      ✅ <b>${t('resolutionRemarks')}</b> ${g.resolution_remarks}
                    </div>
                  ` : ''}
                </div>

                ${AppState.role === 'admin' ? `
                  <div style="margin-top: 0.85rem; display: flex; justify-content: flex-end;">
                    <button class="btn btn-outline btn-sm admin-resolve-grievance-btn" data-token="${g.token}">
                      🛡️ ${isHi ? 'सरपंच कार्यवाही करें' : 'Admin Action'}
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 8. View: Government Schemes Catalog
  function renderSchemesView() {
    const isHi = AppState.lang === 'hi';
    const schemes = AppState.schemes.length ? AppState.schemes : DEFAULT_VILLAGE_DATA.schemes;

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.6rem; color: var(--primary-green);">📑 ${t('schemesHeading')}</h2>
          <p style="color: var(--text-secondary);">${t('schemesSub')}</p>
        </div>

        <div class="grid-2">
          ${schemes.map(s => `
            <div class="card" style="border-top: 4px solid var(--khaki-gold); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <span class="badge" style="background: var(--khaki-subtle); color: var(--khaki-gold); font-weight: 700; margin-bottom: 0.4rem;">
                  🏛️ ${s.category} • ${isHi ? s.department_hi : s.department_en}
                </span>
                <h3 style="font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.6rem;">
                  ${isHi ? s.name_hi : s.name_en}
                </h3>

                <div style="background: var(--primary-green-subtle); color: var(--primary-green-dark); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 0.85rem; font-weight: 600;">
                  💰 <b>${t('financialAid')}:</b><br/>
                  ${isHi ? s.financial_aid_hi : s.financial_aid_en}
                </div>

                <div style="font-size: 0.85rem; margin-bottom: 0.65rem;">
                  <b>🎯 ${t('eligibility')}:</b>
                  <p style="color: var(--text-secondary); margin-top: 2px;">
                    ${isHi ? s.eligibility_hi : s.eligibility_en}
                  </p>
                </div>

                <div style="font-size: 0.82rem; margin-bottom: 1rem;">
                  <b>📄 ${t('docsNeeded')}:</b>
                  <p style="color: var(--text-muted); margin-top: 2px;">
                    ${isHi ? s.documents_hi : s.documents_en}
                  </p>
                </div>
              </div>

              <div>
                <a href="#grievance-new" class="btn btn-outline btn-sm" style="width: 100%;">
                  🤝 ${t('applyHelp')}
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 9. View: Gram Sabha Digital Voting & Agenda Suggestion (Stretch Feature)
  function renderVotingView() {
    const isHi = AppState.lang === 'hi';
    const agendas = AppState.agendas.length ? AppState.agendas : DEFAULT_VILLAGE_DATA.agenda_votes;

    // Total votes cast
    const totalVotes = agendas.reduce((s, a) => s + a.votes_count, 0);

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="badge badge-progress" style="margin-bottom: 0.3rem;">🗳️ ${isHi ? 'डिजिटल लोकतंत्र एवं जनभागीदारी' : 'Digital Democracy & Citizen Participation'}</span>
            <h2 style="font-size: 1.6rem; color: var(--primary-green);">${t('votingHeading')}</h2>
            <p style="color: var(--text-secondary);">${t('votingSub')}</p>
          </div>
          <button class="btn btn-terracotta" id="propose-agenda-btn">
            ${t('suggestAgendaBtn')}
          </button>
        </div>

        <!-- Community Proposals List -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          ${agendas.map(a => {
            const pct = totalVotes > 0 ? Math.round((a.votes_count / totalVotes) * 100) : 0;
            const isApproved = a.status === 'Included in Agenda';

            return `
              <div class="card" style="border-left: 5px solid ${isApproved ? 'var(--primary-green)' : 'var(--khaki-gold)'};">
                <div class="card-header">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                      <span class="badge ${isApproved ? 'badge-resolved' : 'badge-progress'}">
                        ${isApproved ? '📜 ' + (isHi ? 'आधिकारिक एजेंडा में स्वीकृत' : 'Approved in Agenda') : '🗳️ ' + (isHi ? 'वोटिंग हेतु खुला' : 'Open For Voting')}
                      </span>
                      <span style="font-size: 0.8rem; color: var(--text-muted);">
                        📍 Ward ${a.ward_number} • 👤 ${a.submitted_by}
                      </span>
                    </div>

                    <h3 style="font-size: 1.2rem; color: var(--text-primary);">
                      ${isHi ? a.title_hi : a.title_en}
                    </h3>
                  </div>

                  <div style="text-align: right;">
                    <div style="font-size: 1.6rem; font-weight: 800; color: var(--terracotta);">
                      ${a.votes_count}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${t('votesCount')}</div>
                  </div>
                </div>

                <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.85rem;">
                  ${isHi ? a.description_hi : a.description_en}
                </p>

                <!-- Vote Distribution Bar -->
                <div style="margin-bottom: 0.85rem;">
                  <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                    <span>${pct}% ${isHi ? 'ग्रामवासियों की प्राथमिकता' : 'of community support'}</span>
                    <span>${isHi ? 'दिनांक:' : 'Proposed on:'} ${a.created_at}</span>
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end;">
                  <button class="btn btn-outline btn-sm cast-vote-btn" data-agenda-id="${a.id}">
                    👍 ${t('voteNowBtn')} (+1)
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // 10. View: Village Assets Geo-Inventory Interactive Map (Stretch Feature)
  function renderMapView() {
    const isHi = AppState.lang === 'hi';
    const assets = AppState.assets.length ? AppState.assets : DEFAULT_VILLAGE_DATA.village_assets;
    const selected = AppState.selectedAsset || assets[0];

    return `
      <div class="animate-slide-up">
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.6rem; color: var(--primary-green);">🗺️ ${t('mapHeading')}</h2>
          <p style="color: var(--text-secondary);">${t('mapSub')}</p>
        </div>

        <div class="grid-2">
          <!-- Interactive SVG Village Map Container -->
          <div class="village-map-container">
            <div class="map-svg-wrap">
              <svg viewBox="0 0 100 100" width="100%" height="100%" style="display: block;">
                <!-- Village Terrain & Green Fields -->
                <defs>
                  <pattern id="cropPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 0,10 L 10,0 M 0,0 L 10,10" stroke="rgba(30,86,49,0.06)" stroke-width="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#cropPattern)" />

                <!-- Canal River Curve -->
                <path d="M 0,20 Q 35,40 50,25 T 100,30" fill="none" stroke="#7DD3FC" stroke-width="4" stroke-linecap="round" />
                <text x="85" y="27" font-size="2" fill="#0284C7" font-weight="bold">Canal</text>

                <!-- Village Main Roads Grid -->
                <path d="M 50,0 L 50,100" stroke="#D1D5DB" stroke-width="3" stroke-dasharray="2,1" />
                <path d="M 0,50 L 100,50" stroke="#D1D5DB" stroke-width="3" stroke-dasharray="2,1" />

                <!-- Village Border Line -->
                <rect x="5" y="5" width="90" height="90" rx="4" fill="none" stroke="rgba(200,90,50,0.3)" stroke-width="0.75" stroke-dasharray="3,2" />
                <text x="8" y="10" font-size="2.2" fill="var(--terracotta)" font-weight="bold">Pipri Gram Boundary</text>

                <!-- Asset Pins -->
                ${assets.map(a => {
                  const isCur = selected && selected.id === a.id;
                  const condColor = a.condition === 'Excellent' ? '#10B981' : (a.condition === 'Functional' ? '#0284C7' : (a.condition === 'Needs Repair' ? '#F59E0B' : '#EF4444'));

                  return `
                    <g class="asset-pin" data-asset-id="${a.id}" transform="translate(${a.coords_x}, ${a.coords_y})">
                      <circle cx="0" cy="0" r="${isCur ? 3.5 : 2.5}" fill="${condColor}" stroke="#FFF" stroke-width="0.6" />
                      ${isCur ? `<circle cx="0" cy="0" r="5" fill="none" stroke="${condColor}" stroke-width="0.4" opacity="0.8" />` : ''}
                      <text x="0" y="4.5" font-size="2" fill="currentColor" text-anchor="middle" font-weight="600">
                        ${a.ward_number ? 'W' + a.ward_number : ''}
                      </text>
                    </g>
                  `;
                }).join('')}
              </svg>
            </div>
            <div style="padding: 0.75rem 1rem; background: var(--bg-surface); border-top: 1px solid var(--border-color); font-size: 0.8rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <span>💡 ${isHi ? 'मानचित्र पर किसी भी पिन पर क्लिक करें' : 'Click on any marker pin to inspect details'}</span>
              <div style="display: flex; gap: 0.75rem;">
                <span style="color:#10B981;">● ${isHi ? 'उत्कृष्ट' : 'Excellent'}</span>
                <span style="color:#0284C7;">● ${isHi ? 'क्रियाशील' : 'Functional'}</span>
                <span style="color:#F59E0B;">● ${isHi ? 'मरम्मत योग्य' : 'Needs Repair'}</span>
                <span style="color:#EF4444;">● ${isHi ? 'आपातकाल' : 'Critical'}</span>
              </div>
            </div>
          </div>

          <!-- Selected Asset Detail Card -->
          <div>
            ${selected ? `
              <div class="card" style="border-top: 4px solid var(--primary-green);">
                <div class="card-header">
                  <div>
                    <span class="badge badge-progress" style="margin-bottom: 0.35rem;">📍 Ward ${selected.ward_number}</span>
                    <h3 style="font-size: 1.3rem; color: var(--text-primary);">
                      ${isHi ? selected.name_hi : selected.name_en}
                    </h3>
                  </div>
                  <span class="badge" style="background: ${selected.condition === 'Excellent' ? '#D1FAE5' : (selected.condition === 'Functional' ? '#DBEAFE' : (selected.condition === 'Needs Repair' ? '#FEF3C7' : '#FEE2E2'))}; color: ${selected.condition === 'Critical' ? '#991B1B' : '#065F46'}; font-weight: 700;">
                    ${selected.condition}
                  </span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.9rem; margin-top: 0.5rem;">
                  <div>
                    <b>${t('inChargePerson')}</b>
                    <div style="color: var(--text-secondary); margin-top: 2px;">${selected.in_charge}</div>
                  </div>

                  <div>
                    <b>${t('lastInspection')}</b>
                    <div style="color: var(--text-secondary); margin-top: 2px;">${formatDate(selected.last_inspected)}</div>
                  </div>

                  <div>
                    <b>${isHi ? 'जियो कोऑर्डिनेट्स (GPS):' : 'Geo Coordinates (GPS):'}</b>
                    <div style="color: var(--text-muted); font-family: monospace; margin-top: 2px;">
                      Lat: ${selected.lat}° N, Lng: ${selected.lng}° E
                    </div>
                  </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
                  <a href="#grievance-new" class="btn btn-terracotta btn-sm" style="flex: 1;">
                    ⚠️ ${isHi ? 'इस संपदा हेतु शिकायत दर्ज करें' : 'Report Issue on this Asset'}
                  </a>
                </div>
              </div>
            ` : ''}

            <!-- Assets List Quick Picker -->
            <div class="card" style="margin-top: 1.25rem;">
              <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem;">📋 ${isHi ? 'ग्राम संपदा सूची' : 'Village Public Assets Roster'}</h4>
              <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 220px; overflow-y: auto;">
                ${assets.map(a => `
                  <button class="btn btn-outline btn-sm asset-select-row ${selected && selected.id === a.id ? 'active' : ''}" data-asset-id="${a.id}" style="text-align: left; justify-content: space-between; font-size: 0.82rem;">
                    <span>${isHi ? a.name_hi : a.name_en}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Ward ${a.ward_number}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 11. View: Panchayat Admin / Sarpanch Dashboard
  function renderAdminView() {
    const isHi = AppState.lang === 'hi';
    const profile = AppState.village || DEFAULT_VILLAGE_DATA.profile;
    const grievances = AppState.grievances.length ? AppState.grievances : DEFAULT_VILLAGE_DATA.grievances;
    const projects = AppState.projects.length ? AppState.projects : DEFAULT_VILLAGE_DATA.projects;
    const wards = AppState.wards.length ? AppState.wards : DEFAULT_VILLAGE_DATA.wards;

    // Metrics
    const totalGrievances = grievances.length;
    const pendingGrievances = grievances.filter(g => g.status !== 'Resolved').length;
    const overdueSlas = grievances.filter(g => g.is_escalated === 1).length;
    const totalSanctioned = projects.reduce((s, p) => s + p.sanctioned_budget, 0);
    const totalSpent = projects.reduce((s, p) => s + p.spent_amount, 0);
    const budgetPct = Math.round((totalSpent / totalSanctioned) * 100);

    return `
      <div class="animate-slide-up">
        <!-- Admin Header -->
        <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="badge badge-urgent" style="margin-bottom: 0.35rem;">🛡️ ${isHi ? 'प्रशासनिक विशेषाधिकार सत्र' : 'Administrative Privileged Session'}</span>
            <h2 style="font-size: 1.7rem; color: var(--terracotta);">${t('adminHeading')}</h2>
            <p style="color: var(--text-secondary);">${t('adminSub')}</p>
          </div>
          <button class="btn btn-outline btn-sm" id="switch-back-citizen-btn">
            👤 ${isHi ? 'नागरिक दृश्य में वापस जाएं' : 'Switch to Citizen View'}
          </button>
        </div>

        <!-- KPI Strip -->
        <div class="grid-4" style="margin-bottom: 2rem;">
          <div class="card" style="border-left: 4px solid var(--terracotta);">
            <div class="card-subtitle">${t('kpiTotalGrievances')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--terracotta);">${totalGrievances}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${pendingGrievances} ${t('kpiPendingResolution')}</div>
          </div>

          <div class="card" style="border-left: 4px solid #EF4444;">
            <div class="card-subtitle">${t('kpiOverdueSLA')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #EF4444;">${overdueSlas}</div>
            <div style="font-size: 0.78rem; color: #EF4444; font-weight: 600;">⚠️ ${isHi ? 'बी.डी.ओ. को अलर्ट प्रेषित' : 'Dispatched to BDO'}</div>
          </div>

          <div class="card" style="border-left: 4px solid var(--primary-green);">
            <div class="card-subtitle">${t('kpiBudgetUtilized')}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary-green);">${budgetPct}%</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${formatRupees(totalSpent)} / ${formatRupees(totalSanctioned)}</div>
          </div>

          <div class="card" style="border-left: 4px solid var(--khaki-gold);">
            <div class="card-subtitle">${isHi ? 'ग्राम सभा कोरम' : 'Sabha Quorum'}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--khaki-gold);">680</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${profile.population} ${isHi ? 'कुल नागरिक' : 'Citizens'}</div>
          </div>
        </div>

        <!-- Admin Tabs Header -->
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem;">
          <button class="btn btn-sm ${AppState.adminTab === 'grievances' ? 'btn-primary' : 'btn-outline'}" data-adm-tab="grievances">
            📋 ${t('adminGrievanceTab')} (${pendingGrievances})
          </button>
          <button class="btn btn-sm ${AppState.adminTab === 'projects' ? 'btn-primary' : 'btn-outline'}" data-adm-tab="projects">
            🏗️ ${t('adminProjectsTab')}
          </button>
          <button class="btn btn-sm ${AppState.adminTab === 'broadcast' ? 'btn-primary' : 'btn-outline'}" data-adm-tab="broadcast">
            📢 ${t('adminBroadcastTab')}
          </button>
          <button class="btn btn-sm ${AppState.adminTab === 'audit' ? 'btn-primary' : 'btn-outline'}" data-adm-tab="audit">
            🖨️ ${t('adminAuditTab')}
          </button>
        </div>

        <!-- Admin Tab 1: Grievance Action Hub -->
        ${AppState.adminTab === 'grievances' ? `
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;">⚖️ ${isHi ? 'नागरिक शिकायतों का त्वरित निस्तारण एवं वार्ड आवंटन' : 'Grievance Triage & Ward Member Assignment'}</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${grievances.map(g => `
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; background: var(--bg-surface);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                      <span style="font-weight: 800; color: var(--terracotta);">${g.token}</span>
                      <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">
                        👤 ${g.citizen_name} (📞 <a href="tel:${g.phone}">${g.phone}</a>) • Ward ${g.ward_number}
                      </span>
                    </div>
                    <div>${getStatusBadge(g.status, g.is_escalated)}</div>
                  </div>

                  <p style="font-size: 0.9rem; margin: 0.5rem 0; color: var(--text-primary);">
                    "${g.description}"
                  </p>
                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                    📍 ${g.landmark} • 🗓️ ${formatDate(g.submitted_at)}
                  </div>

                  <!-- Admin Action Row -->
                  <div style="background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm); display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
                    <div style="flex: 1; min-width: 180px;">
                      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">${t('assignMember')}</label>
                      <select class="form-control admin-assign-select" data-token="${g.token}" style="padding: 0.35rem 0.6rem; font-size: 0.82rem;">
                        <option value="">${isHi ? '-- वार्ड सदस्य चुनें --' : '-- Choose Ward Member --'}</option>
                        ${wards.map(w => `
                          <option value="${w.ward_number}" ${g.assigned_ward_member_id === w.ward_number ? 'selected' : ''}>
                            Ward ${w.ward_number}: ${isHi ? w.name_hi : w.name_en}
                          </option>
                        `).join('')}
                      </select>
                    </div>

                    <div style="flex: 1; min-width: 150px;">
                      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">${isHi ? 'स्थिति बदलें' : 'Update Status'}</label>
                      <select class="form-control admin-status-select" data-token="${g.token}" style="padding: 0.35rem 0.6rem; font-size: 0.82rem;">
                        <option value="Submitted" ${g.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                        <option value="Assigned" ${g.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
                        <option value="In Progress" ${g.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${g.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                      </select>
                    </div>

                    <div style="flex: 2; min-width: 220px;">
                      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">${isHi ? 'निस्तारण टिप्पणी (Remarks)' : 'Resolution Remarks'}</label>
                      <input type="text" class="form-control admin-remarks-input" data-token="${g.token}" placeholder="${isHi ? 'कार्यवाही विवरण दर्ज करें...' : 'Enter resolution notes...'}" value="${g.resolution_remarks || ''}" style="padding: 0.35rem 0.6rem; font-size: 0.82rem;" />
                    </div>

                    <button class="btn btn-primary btn-sm admin-save-grievance-btn" data-token="${g.token}" style="align-self: flex-end;">
                      💾 ${isHi ? 'सुरक्षित करें' : 'Save'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Admin Tab 2: Project Milestones & Budget -->
        ${AppState.adminTab === 'projects' ? `
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1rem;">🏗️ ${isHi ? 'विकास परियोजना प्रगति व व्यय समायोजन' : 'Public Works Milestone & Expenditure Controller'}</h3>
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              ${projects.map(p => `
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; background: var(--bg-surface);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div>
                      <h4 style="font-size: 1.1rem; color: var(--text-primary);">${isHi ? p.title_hi : p.title_en}</h4>
                      <div style="font-size: 0.82rem; color: var(--text-muted);">🏢 ${p.contractor_name} • Ward ${p.ward_number}</div>
                    </div>
                    <span class="badge badge-progress">${p.completion_pct}% ${isHi ? 'पूर्ण' : 'Done'}</span>
                  </div>

                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
                    <div>
                      <span style="font-size: 0.75rem; color: var(--text-secondary);">${t('sanctionedBudget')}</span>
                      <div style="font-weight: 700;">${formatRupees(p.sanctioned_budget)}</div>
                    </div>
                    <div>
                      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">${t('spentAmount')} (₹)</label>
                      <input type="number" class="form-control admin-project-spent-input" data-project-id="${p.id}" value="${p.spent_amount}" style="padding: 0.35rem 0.6rem; font-size: 0.85rem;" />
                    </div>
                    <div>
                      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block;">${t('progressPct')} (%)</label>
                      <input type="number" min="0" max="100" class="form-control admin-project-pct-input" data-project-id="${p.id}" value="${p.completion_pct}" style="padding: 0.35rem 0.6rem; font-size: 0.85rem;" />
                    </div>
                    <div style="display: flex; align-items: flex-end;">
                      <button class="btn btn-primary btn-sm admin-save-project-btn" data-project-id="${p.id}" style="width: 100%;">
                        💾 ${t('updateProgressBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Admin Tab 3: Broadcast New Announcement -->
        ${AppState.adminTab === 'broadcast' ? `
          <div class="card" style="max-width: 720px; margin: 0 auto;">
            <h3 class="card-title" style="margin-bottom: 0.5rem;">📢 ${isHi ? 'आधिकारिक ग्राम घोषणा एवं ग्राम सभा नोटिस जारी करें' : 'Publish Official Village Announcement'}</h3>
            <p class="card-subtitle" style="margin-bottom: 1.5rem;">${isHi ? 'यह सूचना तुरंत ग्राम सूचना पटल, ऑडियो वाचक एवं नागरिक फोन पर प्रसारित की जाएगी' : 'This announcement is broadcasted to the notice feed and audio reader immediately'}</p>

            <form id="admin-broadcast-form">
              <div class="form-group">
                <label class="form-label">${isHi ? 'घोषणा शीर्षक (अंग्रेजी)' : 'Notice Title (English)'} *</label>
                <input type="text" id="notice-title-en" class="form-control" placeholder="e.g. Special Gram Sabha on Sanitation" required />
              </div>

              <div class="form-group">
                <label class="form-label">${isHi ? 'घोषणा शीर्षक (हिन्दी)' : 'Notice Title (Hindi)'}</label>
                <input type="text" id="notice-title-hi" class="form-control" placeholder="उदा. स्वच्छता अभियान हेतु विशेष ग्राम सभा बैठक" />
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">${isHi ? 'श्रेणी' : 'Category'}</label>
                  <select id="notice-category" class="form-control">
                    <option value="meeting">Gram Sabha Meeting</option>
                    <option value="health">Health & Vaccination</option>
                    <option value="agriculture">Agriculture & e-KYC</option>
                    <option value="subsidy">Government Subsidies</option>
                    <option value="general">General Village Notice</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">${isHi ? 'प्राथमिकता' : 'Priority'}</label>
                  <select id="notice-priority" class="form-control">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent Red Alert</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">${isHi ? 'घोषणा विवरण (English)' : 'Notice Content (English)'} *</label>
                <textarea id="notice-content-en" class="form-control" rows="3" placeholder="Enter notice details..." required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">${isHi ? 'घोषणा विवरण (हिन्दी)' : 'Notice Content (Hindi)'}</label>
                <textarea id="notice-content-hi" class="form-control" rows="3" placeholder="विस्तृत सूचना विवरण लिखें..."></textarea>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">${isHi ? 'बैठक दिनांक/समय' : 'Meeting Date/Time'}</label>
                  <input type="text" id="notice-datetime" class="form-control" placeholder="e.g. 2026-11-24 10:00 AM" />
                </div>
                <div class="form-group">
                  <label class="form-label">${isHi ? 'स्थान' : 'Venue'}</label>
                  <input type="text" id="notice-venue" class="form-control" placeholder="Panchayat Bhavan Hall" />
                </div>
              </div>

              <button type="submit" class="btn btn-terracotta btn-lg" style="width: 100%;">
                📢 ${t('publishNoticeBtn')}
              </button>
            </form>
          </div>
        ` : ''}

        <!-- Admin Tab 4: Formatted Monthly Transparency Audit Report -->
        ${AppState.adminTab === 'audit' ? `
          <div class="card" id="printable-audit-report" style="border: 2px solid var(--border-color); background: #FFF; color: #111;">
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem;">
              <h2 style="font-size: 1.5rem; text-transform: uppercase; color: #1E5631;">कार्यालय ग्राम पंचायत पिपरी, चुनार (मिर्ज़ापुर)</h2>
              <div style="font-size: 0.95rem; font-weight: bold; margin: 4px 0;">मासिक सामाजिक अंकेक्षण एवं पारदर्शी सार्वजनिक व्यय विवरणी</div>
              <div style="font-size: 0.8rem; color: #555;">वित्तीय वर्ष 2026-27 • 15वां वित्त आयोग सार्वजनिक निधि रिपोर्ट</div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
              <div><b>कुल ग्रामीण जनसंख्या:</b> 3,420</div>
              <div><b>निर्वाचित वार्ड:</b> 8 वार्ड</div>
              <div><b>कुल परिवार:</b> 680</div>
              <div><b>कुल स्वीकृत बजट:</b> ${formatRupees(totalSanctioned)}</div>
              <div><b>कुल व्यय धनराशि:</b> ${formatRupees(totalSpent)}</div>
              <div><b>निधि उपयोग दर:</b> ${budgetPct}%</div>
            </div>

            <h4 style="border-bottom: 1px solid #777; padding-bottom: 4px; margin-bottom: 8px;">सार्वजनिक निर्माण कार्यों का मदवार विवरण</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 1.5rem;">
              <thead>
                <tr style="background: #EEE; border-bottom: 1px solid #999;">
                  <th style="padding: 6px; text-align: left;">क्र.सं.</th>
                  <th style="padding: 6px; text-align: left;">कार्य का नाम</th>
                  <th style="padding: 6px; text-align: center;">वार्ड</th>
                  <th style="padding: 6px; text-align: right;">स्वीकृत बजट</th>
                  <th style="padding: 6px; text-align: right;">व्यय</th>
                  <th style="padding: 6px; text-align: center;">प्रगति</th>
                </tr>
              </thead>
              <tbody>
                ${projects.map((p, idx) => `
                  <tr style="border-bottom: 1px solid #DDD;">
                    <td style="padding: 6px;">${idx + 1}</td>
                    <td style="padding: 6px;">${p.title_en}</td>
                    <td style="padding: 6px; text-align: center;">W-${p.ward_number}</td>
                    <td style="padding: 6px; text-align: right;">${formatRupees(p.sanctioned_budget)}</td>
                    <td style="padding: 6px; text-align: right;">${formatRupees(p.spent_amount)}</td>
                    <td style="padding: 6px; text-align: center;"><b>${p.completion_pct}%</b></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h4 style="border-bottom: 1px solid #777; padding-bottom: 4px; margin-bottom: 8px;">जन शिकायत निवारण स्थिति</h4>
            <div style="font-size: 0.85rem; margin-bottom: 2rem;">
              कुल दर्ज शिकायतें: <b>${totalGrievances}</b> | 
              सफलतापूर्वक निस्तारित: <b>${grievances.filter(g => g.status === 'Resolved').length}</b> | 
              लंबित: <b>${pendingGrievances}</b> | 
              समय सीमा पार (एस.एल.ए.): <b>${overdueSlas}</b>
            </div>

            <!-- Signatures Strip -->
            <div style="display: flex; justify-content: space-between; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #999; font-size: 0.85rem; text-align: center;">
              <div>
                _______________________<br/>
                <b>श्रीमती सविता देवी</b><br/>
                ग्राम प्रधान / सरपंच
              </div>
              <div>
                _______________________<br/>
                <b>श्री राजेश कुमार शर्मा</b><br/>
                ग्राम पंचायत सचिव (VDO)
              </div>
              <div>
                _______________________<br/>
                <b>सामाजिक अंकेक्षण टीम</b><br/>
                ग्राम सभा पिपरी
              </div>
            </div>

            <div style="margin-top: 1.5rem; text-align: right;">
              <button class="btn btn-primary btn-sm" onclick="window.print()">
                🖨️ ${t('printReportBtn')}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 12. Main App Shell & Footer
  function renderAppShell() {
    const route = AppState.currentRoute;
    let mainViewHtml = '';

    switch (route) {
      case 'home':
        mainViewHtml = renderHomeView();
        break;
      case 'profile':
        mainViewHtml = renderProfileView();
        break;
      case 'notices':
        mainViewHtml = renderNoticesView();
        break;
      case 'projects':
        mainViewHtml = renderProjectsView();
        break;
      case 'grievance-new':
        mainViewHtml = renderGrievanceNewView();
        break;
      case 'grievance-track':
        mainViewHtml = renderGrievanceTrackView();
        break;
      case 'schemes':
        mainViewHtml = renderSchemesView();
        break;
      case 'voting':
        mainViewHtml = renderVotingView();
        break;
      case 'map':
        mainViewHtml = renderMapView();
        break;
      case 'admin':
        mainViewHtml = renderAdminView();
        break;
      default:
        mainViewHtml = renderHomeView();
    }

    return `
      ${renderHeader()}
      <main class="main-content">
        <div class="container">
          ${mainViewHtml}
        </div>
      </main>
      <footer class="main-footer">
        <div class="container">
          <div class="footer-inner">
            <div class="footer-col">
              <h4>${t('portalTitle')}</h4>
              <p style="margin-bottom: 0.75rem;">${t('footerAbout')}</p>
              <div style="font-size: 0.82rem; color: var(--terracotta);">
                🏛️ ${AppState.lang === 'hi' ? 'कार्यालय: पंचायत भवन, पिपरी, वार्ड 4' : 'Panchayat Bhavan, Pipri, Ward 4'}
              </div>
            </div>

            <div class="footer-col">
              <h4>${AppState.lang === 'hi' ? 'महत्वपूर्ण पोर्टल लिंक' : 'Quick Navigation'}</h4>
              <ul class="footer-links">
                <li><a href="#notices">📢 ${t('navNotices')}</a></li>
                <li><a href="#projects">🏗️ ${t('navProjects')}</a></li>
                <li><a href="#grievance-new">✍️ ${t('navGrievanceNew')}</a></li>
                <li><a href="#grievance-track">📋 ${t('navGrievanceTrack')}</a></li>
                <li><a href="#schemes">📑 ${t('navSchemes')}</a></li>
                <li><a href="/static.html">🎨 ${AppState.lang === 'hi' ? 'स्थैतिक पृष्ठ प्रदर्शन (Modules 1-2)' : 'Static Phase Showcase (Modules 1-2)'}</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>${t('footerHelpdesk')}</h4>
              <p style="margin-bottom: 0.4rem;">📞 <b>${AppState.lang === 'hi' ? 'सरपंच हेल्पलाइन:' : 'Sarpanch Help:'}</b> +91 94520 18321</p>
              <p style="margin-bottom: 0.4rem;">📞 <b>${AppState.lang === 'hi' ? 'पंचायत सचिव:' : 'Secretary:'}</b> +91 98391 44520</p>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.6rem;">${t('emergencyContact')}</p>
            </div>
          </div>

          <div class="footer-bottom">
            <div>${t('copyrightText')}</div>
            <div style="margin-top: 0.3rem;">
              <a href="/static.html" style="color: var(--terracotta); font-weight: 600;">
                👉 ${AppState.lang === 'hi' ? 'मॉड्यूल 1-2 स्थैतिक प्रदर्शन (CSS Custom Properties & Animations)' : 'View Static Phase Showcase (HTML/CSS, Dark Mode & Custom Properties)'}
              </a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // --- Attach Interactive Event Handlers ---
  function attachEventHandlers() {
    // 1. Language Toggle
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const newLang = AppState.lang === 'en' ? 'hi' : 'en';
        localStorage.setItem('gramaglow_lang', newLang);
        AppState.setState({ lang: newLang });
      });
    }

    // 2. Theme Toggle
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('gramaglow_theme', newTheme);
        AppState.setState({ theme: newTheme });
        syncDomSettings();
      });
    }

    // 3. Contrast Toggle
    const contrastBtn = document.getElementById('contrast-btn');
    if (contrastBtn) {
      contrastBtn.addEventListener('click', () => {
        const newC = AppState.contrast === 'normal' ? 'high' : 'normal';
        localStorage.setItem('gramaglow_contrast', newC);
        AppState.setState({ contrast: newC });
        syncDomSettings();
      });
    }

    // 4. Font Size Scaler Buttons
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-font');
        localStorage.setItem('gramaglow_font', size);
        AppState.setState({ fontSize: size });
        syncDomSettings();
      });
    });

    // 5. Role Toggle
    const roleCitizenBtn = document.getElementById('role-citizen-btn');
    const roleAdminBtn = document.getElementById('role-admin-btn');
    if (roleCitizenBtn) {
      roleCitizenBtn.addEventListener('click', async () => {
        if (AppState.role === 'admin') { try { await ApiClient.logoutAdmin(); } catch (_) {} }
        localStorage.setItem('gramaglow_role', 'citizen');
        AppState.setState({ role: 'citizen' });
        if (AppState.currentRoute === 'admin') navigateTo('home');
      });
    }
    if (roleAdminBtn) {
      roleAdminBtn.addEventListener('click', async () => {
        if (AppState.role === 'admin') { navigateTo('admin'); return; }
        const password = window.prompt('Administrator password:');
        if (!password) return;
        try {
          await ApiClient.loginAdmin(password);
          localStorage.setItem('gramaglow_role', 'admin');
          AppState.setState({ role: 'admin' });
          navigateTo('admin');
        } catch (error) {
          alert(error.message || 'Administrator sign-in failed.');
        }
      });
    }

    const switchBackCitizen = document.getElementById('switch-back-citizen-btn');
    if (switchBackCitizen) {
      switchBackCitizen.addEventListener('click', async () => {
        try { await ApiClient.logoutAdmin(); } catch (_) {}
        localStorage.setItem('gramaglow_role', 'citizen');
        AppState.setState({ role: 'citizen' });
        navigateTo('home');
      });
    }

    // 6. Audio Broadcaster Buttons
    document.querySelectorAll('.audio-bar-control').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const noticeId = parseInt(btn.getAttribute('data-notice-id'), 10);
        const text = btn.getAttribute('data-audio-text');

        if (AppState.audioPlayingId === noticeId) {
          AudioBroadcaster.stop();
        } else {
          AudioBroadcaster.play(noticeId, text, AppState.lang);
        }
      });
    });

    const heroListenBtn = document.getElementById('hero-listen-btn');
    if (heroListenBtn) {
      heroListenBtn.addEventListener('click', () => {
        const latest = AppState.notices.find(n => n.priority === 'urgent') || AppState.notices[0];
        if (latest) {
          if (AppState.audioPlayingId === latest.id) {
            AudioBroadcaster.stop();
          } else {
            const text = AppState.lang === 'hi' ? latest.audio_text_hi : latest.audio_text_en;
            AudioBroadcaster.play(latest.id, text, AppState.lang);
          }
        }
      });
    }

    // 7. Notice Category Filter
    document.querySelectorAll('[data-notice-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-notice-cat');
        AppState.setState({ activeCategoryFilter: cat });
      });
    });

    // 8. Grievance Form Category Picker
    document.querySelectorAll('.category-card-btn').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.category-card-btn').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const cat = card.getAttribute('data-cat');
        const hiddenInput = document.getElementById('selected-category');
        if (hiddenInput) hiddenInput.value = cat;
      });
    });

    // 9. Quick Sample Photo Buttons
    document.querySelectorAll('.quick-sample-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const photo = btn.getAttribute('data-photo');
        const hiddenInput = document.getElementById('photo-url');
        const previewWrap = document.getElementById('photo-preview-wrap');
        const fileNameSpan = document.getElementById('photo-filename');
        if (hiddenInput && previewWrap && fileNameSpan) {
          hiddenInput.value = photo;
          fileNameSpan.textContent = photo;
          previewWrap.style.display = 'flex';
        }
      });
    });

    const removePhotoBtn = document.getElementById('remove-photo-btn');
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        const hiddenInput = document.getElementById('photo-url');
        const previewWrap = document.getElementById('photo-preview-wrap');
        if (hiddenInput && previewWrap) {
          hiddenInput.value = '';
          previewWrap.style.display = 'none';
        }
      });
    }

    // 10. Grievance Form Submission
    const grievanceForm = document.getElementById('grievance-form');
    if (grievanceForm) {
      grievanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('selected-category').value;
        const citizen_name = document.getElementById('citizen-name').value.trim();
        const phone = document.getElementById('citizen-phone').value.trim();
        const ward_number = parseInt(document.getElementById('ward-select').value, 10);
        const urgency = document.getElementById('urgency-select').value;
        const landmark = document.getElementById('landmark-input').value.trim();
        const description = document.getElementById('problem-desc').value.trim();
        const photo_url = document.getElementById('photo-url').value;

        if (!citizen_name || !phone || !landmark || !description) {
          alert('Please fill all required fields');
          return;
        }

        const res = await ApiClient.lodgeGrievance({
          citizen_name,
          phone,
          ward_number,
          category,
          landmark,
          description,
          urgency,
          photo_url
        });

        if (res && res.success) {
          // Refresh grievances list
          const updated = await ApiClient.fetchGrievances();
          AppState.setState({
            grievances: updated,
            lastSubmittedToken: res.token
          });
        }
      });
    }

    const trackTokenBtn = document.getElementById('track-token-btn');
    if (trackTokenBtn) {
      trackTokenBtn.addEventListener('click', () => {
        const token = trackTokenBtn.getAttribute('data-token');
        AppState.setState({ lastSubmittedToken: null, searchQuery: token });
        navigateTo('grievance-track');
      });
    }

    const fileAnotherBtn = document.getElementById('file-another-btn');
    if (fileAnotherBtn) {
      fileAnotherBtn.addEventListener('click', () => {
        AppState.setState({ lastSubmittedToken: null });
        navigateTo('grievance-new');
      });
    }

    // 11. Grievance Track Search & Filters
    const grievanceSearch = document.getElementById('grievance-search');
    if (grievanceSearch) {
      grievanceSearch.addEventListener('input', (e) => {
        AppState.setState({ searchQuery: e.target.value });
      });
    }

    const grievanceStatusSelect = document.getElementById('grievance-status-select');
    if (grievanceStatusSelect) {
      grievanceStatusSelect.addEventListener('change', (e) => {
        AppState.setState({ activeGrievanceFilter: e.target.value });
      });
    }

    const grievanceWardSelect = document.getElementById('grievance-ward-select');
    if (grievanceWardSelect) {
      grievanceWardSelect.addEventListener('change', (e) => {
        AppState.setState({ activeWardFilter: e.target.value });
      });
    }

    // 12. Voting: Cast Vote
    document.querySelectorAll('.cast-vote-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-agenda-id'), 10);
        btn.disabled = true;
        btn.textContent = '✓ Supported';
        await ApiClient.voteAgenda(id);
        const updated = await ApiClient.fetchAgendaVotes();
        AppState.setState({ agendas: updated });
      });
    });

    const proposeAgendaBtn = document.getElementById('propose-agenda-btn');
    if (proposeAgendaBtn) {
      proposeAgendaBtn.addEventListener('click', () => {
        const title = prompt(AppState.lang === 'hi' ? 'प्रस्तावित एजेंडा शीर्षक दर्ज करें:' : 'Enter proposed agenda title:');
        if (!title) return;
        const desc = prompt(AppState.lang === 'hi' ? 'संक्षिप्त विवरण लिखें:' : 'Enter description:');
        if (!desc) return;

        ApiClient.submitAgenda({
          title_en: title,
          title_hi: title,
          submitted_by: 'Citizen Participant',
          ward_number: 1,
          description_en: desc,
          description_hi: desc
        }).then(async () => {
          const updated = await ApiClient.fetchAgendaVotes();
          AppState.setState({ agendas: updated });
        });
      });
    }

    // 13. Map Asset Selection
    document.querySelectorAll('.asset-pin, .asset-select-row').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.getAttribute('data-asset-id'), 10);
        const target = AppState.assets.find(a => a.id === id);
        if (target) {
          AppState.setState({ selectedAsset: target });
        }
      });
    });

    // 14. Admin Tab Switching
    document.querySelectorAll('[data-adm-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-adm-tab');
        AppState.setState({ adminTab: tab });
      });
    });

    // 15. Admin Save Grievance Action
    document.querySelectorAll('.admin-save-grievance-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const token = btn.getAttribute('data-token');
        const assignSelect = document.querySelector(`.admin-assign-select[data-token="${token}"]`);
        const statusSelect = document.querySelector(`.admin-status-select[data-token="${token}"]`);
        const remarksInput = document.querySelector(`.admin-remarks-input[data-token="${token}"]`);

        const wardId = assignSelect ? parseInt(assignSelect.value, 10) : null;
        const status = statusSelect ? statusSelect.value : null;
        const remarks = remarksInput ? remarksInput.value.trim() : null;

        btn.disabled = true;
        btn.textContent = 'Saving...';

        await ApiClient.updateGrievanceStatus(token, {
          assigned_ward_member_id: wardId,
          status,
          resolution_remarks: remarks
        });

        const updated = await ApiClient.fetchGrievances();
        AppState.setState({ grievances: updated });
        alert(AppState.lang === 'hi' ? 'शिकायत कार्यवाही सफलतापूर्वक अपडेट की गई!' : 'Grievance updated successfully!');
      });
    });

    // 16. Admin Update Project Spending & Percentage
    document.querySelectorAll('.admin-save-project-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-project-id'), 10);
        const spentInput = document.querySelector(`.admin-project-spent-input[data-project-id="${id}"]`);
        const pctInput = document.querySelector(`.admin-project-pct-input[data-project-id="${id}"]`);

        const spent = spentInput ? parseFloat(spentInput.value) : undefined;
        const pct = pctInput ? parseInt(pctInput.value, 10) : undefined;

        btn.disabled = true;
        btn.textContent = 'Saving...';

        await ApiClient.updateProject(id, {
          spent_amount: spent,
          completion_pct: pct
        });

        const updated = await ApiClient.fetchProjects();
        AppState.setState({ projects: updated });
        alert(AppState.lang === 'hi' ? 'परियोजना की प्रगति सुरक्षित की गई!' : 'Project progress updated successfully!');
      });
    });

    // 17. Admin Broadcast Announcement Form
    const broadcastForm = document.getElementById('admin-broadcast-form');
    if (broadcastForm) {
      broadcastForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title_en = document.getElementById('notice-title-en').value.trim();
        const title_hi = document.getElementById('notice-title-hi').value.trim();
        const category = document.getElementById('notice-category').value;
        const priority = document.getElementById('notice-priority').value;
        const content_en = document.getElementById('notice-content-en').value.trim();
        const content_hi = document.getElementById('notice-content-hi').value.trim();
        const meeting_datetime = document.getElementById('notice-datetime').value.trim();
        const venue_en = document.getElementById('notice-venue').value.trim();

        const res = await ApiClient.createNotice({
          title_en,
          title_hi,
          category,
          priority,
          content_en,
          content_hi,
          meeting_datetime,
          venue_en,
          venue_hi: venue_en,
          audio_text_en: content_en,
          audio_text_hi: content_hi || content_en
        });

        if (res && res.success) {
          const updated = await ApiClient.fetchNotices();
          AppState.setState({ notices: updated });
          alert(AppState.lang === 'hi' ? 'आधिकारिक सूचना सफलता से जारी कर दी गई!' : 'Notice broadcasted successfully!');
          navigateTo('notices');
        }
      });
    }

    // Admin direct shortcut from grievance track
    document.querySelectorAll('.admin-resolve-grievance-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.setState({ role: 'admin', adminTab: 'grievances' });
        navigateTo('admin');
      });
    });
  }

  // --- Main Render Engine ---
  function render() {
    syncDomSettings();
    const appEl = document.getElementById('app');
    if (!appEl) return;
    appEl.innerHTML = renderAppShell();
    attachEventHandlers();
  }

  // Initialize
  AppState.subscribe(() => {
    render();
  });

  document.addEventListener('DOMContentLoaded', async () => {
    syncDomSettings();
    try {
      const authenticated = await ApiClient.checkAdminSession();
      if (!authenticated && AppState.role === 'admin') {
        localStorage.setItem('gramaglow_role', 'citizen');
        AppState.role = 'citizen';
        if (AppState.currentRoute === 'admin') AppState.currentRoute = 'home';
      }
    } catch (_) {
      localStorage.setItem('gramaglow_role', 'citizen');
      AppState.role = 'citizen';
    }
    render();
    await loadInitialData();
  });

})();

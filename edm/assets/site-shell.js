/* Global Manila EDM shell renderer.
   One focused route model renders the mobile launcher, desktop navigation, and
   floating menu. Pages own their content; this file owns only shared navigation,
   and lightweight public counts. */
(function () {
  const CACHE_KEY = 'manila-edm-shell-counts';
  const SCRIPT_URL = new URL(document.currentScript?.src || 'assets/site-shell.js', document.baseURI);
  const SITE_ROOT = new URL('../', SCRIPT_URL);

  const COPY = {
    en: {
      menu: 'Menu',
      closeMenu: 'Close menu',
      dark: 'Switch to dark mode',
      light: 'Switch to light mode',
      langToFr: 'Switch language to French',
      langToEn: 'Switch language to English',
      remembrance: 'Remembrance',
      headerBanner: (entries, events) => `${entries} Entries · Manila EDM · ${events} Events`,
      routes: {
        home: 'Home', directory: 'Directory', events: 'Events', search: 'Search',
        photos: 'Photos', community: 'Community', updates: 'Updates',
        support: 'Support', about: 'About', extras: 'Extras'
      }
    },
    fr: {
      menu: 'Menu',
      closeMenu: 'Fermer le menu',
      dark: 'Passer en mode sombre',
      light: 'Passer en mode clair',
      langToFr: 'Passer en français',
      langToEn: 'Passer en anglais',
      remembrance: 'Souvenirs',
      headerBanner: (entries, events) => `${entries} Entries · Manila EDM · ${events} Events`,
      routes: {
        home: 'Accueil', directory: 'Répertoire', events: 'Événements', search: 'Recherche',
        photos: 'Photos', community: 'Communauté', updates: 'Mises à jour',
        support: 'Soutien', about: 'À propos', extras: 'Extras'
      }
    }
  };

  const ROUTES = {
    home: { href: 'index.html', icon: '⌂' },
    directory: { href: 'directory.html#browse', icon: '⌕' },
    events: { href: 'events.html', icon: '◷' },
    search: { href: 'search.html', icon: '⌕' },
    photos: { href: 'photos/index.html', icon: '▧' },
    community: { href: 'community.html', icon: '✦' },
    updates: { href: 'home-feed.html', icon: '↻' },
    support: { href: 'support.html', icon: '◇' },
    about: { href: 'about.html', icon: '⁜' },
    extras: { href: 'extras.html', icon: '＋' }
  };

  // Keep the everyday shell focused: the drawer owns the few routes needed for this early niche release.
  const DESKTOP_KEYS = ['home', 'search', 'photos'];
  const MENU_KEYS = ['home', 'directory', 'search', 'about'];
  const SHELL_DATA = { entryCount: null, eventCount: null };

  function siteUrl(path = '') {
    return new URL(path, SITE_ROOT).href;
  }

  function currentLang() {
    // The first Manila EDM release is English-first; Tagalog can be added from steward-provided copy later.
    return 'en';
  }

  function routeLink(key, className = '') {
    const route = ROUTES[key];
    return `<a class="${className}" href="${siteUrl(route.href)}" data-route-key="${key}">
      <span class="route-icon" aria-hidden="true">${route.icon}</span>
      <span class="route-label">${key}</span>
    </a>`;
  }

  function activeRouteKey() {
    const path = location.pathname;
    if (/\/photos\//.test(path)) return 'photos';
    if (/community\.html$/.test(path)) return 'community';
    if (/events\.html$/.test(path)) return 'events';
    if (/search\.html$/.test(path)) return 'search';
    if (/directory\.html$/.test(path) || /entry\.html$/.test(path)) return 'directory';
    if (/home-feed\.html$/.test(path) || /recents\.html$/.test(path)) return 'updates';
    if (/support\.html$/.test(path)) return 'support';
    if (/about\.html$/.test(path)) return 'about';
    if (/extras\.html$/.test(path)) return 'extras';
    return 'home';
  }

  function readCachedCounts() {
    try {
      const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return Number.isFinite(data?.entryCount) && Number.isFinite(data?.eventCount) ? data : null;
    } catch (_) { return null; }
  }

  function writeCachedCounts(entryCount, eventCount) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ entryCount, eventCount, ts: Date.now() })); }
    catch (_) { /* storage unavailable */ }
  }

  function syncShell() {
    const lang = currentLang();
    const copy = COPY[lang] || COPY.en;
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;

    document.querySelectorAll('[data-route-key]').forEach(link => {
      const key = link.dataset.routeKey;
      const label = copy.routes[key] || key;
      const text = link.querySelector('.route-label');
      if (text) text.textContent = label;
      link.setAttribute('aria-label', label);
      link.setAttribute('title', label);
      const active = key === activeRouteKey() || (key === 'directory' && activeRouteKey() === 'search');
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.querySelectorAll('[data-menu-label]').forEach(el => {
      el.setAttribute('aria-label', copy.menu);
      el.setAttribute('title', copy.menu);
      const text = el.querySelector('.route-label');
      if (text) text.textContent = copy.menu;
    });

    const themeButton = document.getElementById('theme-toggle');
    if (themeButton) {
      const label = isDark ? copy.light : copy.dark;
      themeButton.textContent = isDark ? '☼' : '☾';
      themeButton.setAttribute('aria-label', label);
      themeButton.setAttribute('title', label);
    }

    const langButton = document.getElementById('lang-toggle');
    if (langButton) {
      const isFr = lang === 'fr';
      const label = isFr ? copy.langToEn : copy.langToFr;
      langButton.setAttribute('aria-label', label);
      langButton.setAttribute('title', label);
    }

    const close = document.querySelector('.drawer-backdrop');
    if (close) close.setAttribute('aria-label', copy.closeMenu);
    const drawerClose = document.getElementById('drawer-close');
    if (drawerClose) {
      drawerClose.setAttribute('aria-label', copy.closeMenu);
      drawerClose.setAttribute('title', copy.closeMenu);
    }

    const { entryCount, eventCount } = SHELL_DATA;
    const headerText = document.getElementById('global-header-text');
    if (headerText) headerText.textContent = "Manila EDM";

    const homeEntryCount = document.getElementById('home-entry-count');
    const homeEventCount = document.getElementById('home-event-count');
    if (homeEntryCount) homeEntryCount.textContent = Number.isFinite(entryCount) ? String(entryCount) : '…';
    if (homeEventCount) homeEventCount.textContent = Number.isFinite(eventCount) ? String(eventCount) : '…';
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('acadie-theme', theme);
    syncShell();
    window.dispatchEvent(new CustomEvent('acadie:themechange', { detail: { theme } }));
  }

  function setLang(lang) {
    localStorage.setItem('acadie-lang', lang);
    syncShell();
    window.dispatchEvent(new CustomEvent('acadie:languagechange', { detail: { lang } }));
  }

  async function loadShellCounts() {
    const cached = readCachedCounts();
    if (cached) Object.assign(SHELL_DATA, cached);
    syncShell();
    try {
      const [directoryResponse, eventsResponse] = await Promise.all([
        fetch(siteUrl('assets/directory-data.json'), { cache: 'no-cache' }),
        fetch(siteUrl('assets/events-data.json'), { cache: 'no-cache' })
      ]);
      if (!directoryResponse.ok || !eventsResponse.ok) throw new Error('Failed to load shell counts');
      const [directoryPayload, eventsPayload] = await Promise.all([directoryResponse.json(), eventsResponse.json()]);
      const entryCount = Number(directoryPayload.published_count ?? directoryPayload.entry_count ?? directoryPayload.items?.length ?? 0);
      const eventCount = Number(eventsPayload.active_count ?? eventsPayload.event_count ?? eventsPayload.items?.length ?? 0);
      if (SHELL_DATA.entryCount !== entryCount || SHELL_DATA.eventCount !== eventCount) {
        SHELL_DATA.entryCount = entryCount;
        SHELL_DATA.eventCount = eventCount;
        writeCachedCounts(entryCount, eventCount);
        syncShell();
      }
    } catch (error) {
      console.warn('Shell counts unavailable:', error);
    }
  }

  const savedTheme = localStorage.getItem('acadie-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  document.documentElement.dataset.lang = currentLang();

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site-header" aria-label="Manila EDM banner"><span id="global-header-text">Manila EDM</span></header>
    <nav class="site-desktop-nav" aria-label="Primary navigation">
      <a class="desktop-wordmark" href="${siteUrl('index.html')}" aria-label="Manila EDM home">MANILA EDM</a>
      <div class="desktop-route-list">${DESKTOP_KEYS.map(key => routeLink(key, 'desktop-route')).join('')}</div>
      <label class="desktop-menu-launch" for="menu-toggle" data-menu-label role="button" tabindex="0" aria-controls="site-menu-drawer" aria-expanded="false">
        <span class="route-icon" aria-hidden="true">☰</span><span class="route-label">Menu</span>
      </label>
    </nav>
    <input class="menu-toggle" type="checkbox" id="menu-toggle" aria-hidden="true" />
    <label class="drawer-backdrop" for="menu-toggle" aria-label="Close menu"></label>
    <aside class="drawer" id="site-menu-drawer" aria-label="Menu">
      <div class="drawer-controls" aria-label="Display and language controls">
        <button class="menu-control theme-button" type="button" id="theme-toggle">☾</button>
        <button class="drawer-close" type="button" id="drawer-close">×</button>
        <button class="menu-control lang-button" type="button" id="lang-toggle"><span class="lang-en">EN</span><span class="lang-sep">/</span><span class="lang-fr">FR</span></button>
      </div>
      <nav class="drawer-nav">${MENU_KEYS.map(key => routeLink(key, 'drawer-route')).join('')}</nav>
    </aside>
    <label class="site-menu-fab" for="menu-toggle" data-menu-label role="button" tabindex="0" aria-controls="site-menu-drawer" aria-expanded="false">
      <span class="route-icon" aria-hidden="true">☰</span><span class="route-label shell-visually-hidden">Menu</span>
    </label>
  `);

  window.ManilaEdmShell = window.AcadieShell = { currentLang, setTheme, setLang, sync: syncShell, loadShellCounts, url: siteUrl };

  document.addEventListener('DOMContentLoaded', () => {
    syncShell();
    loadShellCounts();
    const menuToggle = document.getElementById('menu-toggle');
    const menuDrawer = document.getElementById('site-menu-drawer');
    const menuLaunchers = document.querySelectorAll('[data-menu-label]');
    let activeMenuLauncher = [...menuLaunchers].find(launcher => launcher.offsetParent !== null);
    let menuWasOpen = false;
    const backgroundInertState = new Map();
    const drawerFocusables = () => [...(menuDrawer?.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])]
      .filter(control => control.offsetParent !== null);
    const setBackgroundInert = inert => {
      const background = [...document.body.children].filter(element =>
        !element.matches('#menu-toggle, .drawer-backdrop, .drawer, script, style')
      );
      if (inert) {
        background.forEach(element => {
          backgroundInertState.set(element, element.inert);
          element.inert = true;
        });
        return;
      }
      backgroundInertState.forEach((wasInert, element) => { element.inert = wasInert; });
      backgroundInertState.clear();
    };
    const syncMenuState = () => {
      const isOpen = Boolean(menuToggle?.checked);
      menuLaunchers.forEach(launcher => launcher.setAttribute('aria-expanded', isOpen ? 'true' : 'false'));
      if (isOpen && !menuWasOpen) {
        setBackgroundInert(true);
        requestAnimationFrame(() => drawerFocusables()[0]?.focus());
      } else if (!isOpen && menuWasOpen) {
        setBackgroundInert(false);
        requestAnimationFrame(() => activeMenuLauncher?.focus());
      }
      menuWasOpen = isOpen;
    };
    menuToggle?.addEventListener('change', syncMenuState);
    menuLaunchers.forEach(launcher => {
      launcher.addEventListener('click', () => { activeMenuLauncher = launcher; });
      launcher.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!menuToggle) return;
        activeMenuLauncher = launcher;
        menuToggle.checked = !menuToggle.checked;
        menuToggle.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Tab' && menuToggle?.checked) {
        const controls = drawerFocusables();
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !menuDrawer?.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !menuDrawer?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key !== 'Escape' || !menuToggle?.checked) return;
      event.preventDefault();
      menuToggle.checked = false;
      menuToggle.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.getElementById('drawer-close')?.addEventListener('click', () => {
      const toggle = document.getElementById('menu-toggle');
      if (!toggle) return;
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      setLang(currentLang() === 'fr' ? 'en' : 'fr');
    });
    document.querySelectorAll('.drawer-nav a').forEach(link => link.addEventListener('click', () => {
      const toggle = document.getElementById('menu-toggle');
      if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }));
  });
})();

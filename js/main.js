/**
 * Portfolio interactive behaviors
 * - Bilingual UI strings (TR / EN based on <html lang>)
 * - Theme switcher (dark default, persisted in localStorage, synced with theme-color & cross-tab)
 * - Mobile navigation with outside-click, focusout, and Escape handling
 * - Reading progress bar (case study pages) and scroll-spy for in-page nav
 * - Scroll reveal (skipped for reduced motion and settled immediately on hash jumps)
 * - Project multi-category filter with URL sync and live-region announcement
 * - Screenshot lightbox using <dialog>
 * - One-click email copy with toast feedback
 */

(() => {
  'use strict';

  const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const i18n = isEn
    ? {
        themeToDark: 'Switch to dark theme',
        themeToLight: 'Switch to light theme',
        menuOpen: 'Open menu',
        menuClose: 'Close menu',
        filterStatus: (n) => `Showing ${n} ${n === 1 ? 'project' : 'projects'}.`,
        lightboxLabel: 'Enlarged screenshot',
        lightboxClose: 'Close',
        emailCopied: 'Email copied.',
        emailCopyError: (email) => `Could not copy. Email: ${email}`,
      }
    : {
        themeToDark: 'Koyu temaya geç',
        themeToLight: 'Açık temaya geç',
        menuOpen: 'Menüyü aç',
        menuClose: 'Menüyü kapat',
        filterStatus: (n) => `${n} proje gösteriliyor.`,
        lightboxLabel: 'Büyütülmüş ekran görüntüsü',
        lightboxClose: 'Kapat',
        emailCopied: 'Adres kopyalandı.',
        emailCopyError: (email) => `Kopyalanamadı. Adres: ${email}`,
      };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. Theme
     ------------------------------------------------------------------------ */
  const THEME_KEY = 'portfolio-theme';
  const root = document.documentElement;
  const themeToggleBtn = document.querySelector('[data-theme-toggle]');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const getStoredTheme = () => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage may be blocked; theme still applies for this page view
    }
  };

  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    if (isLight) {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isLight ? '#F7F8FA' : '#0B1220');
    }
    if (themeToggleBtn) {
      const label = isLight ? i18n.themeToDark : i18n.themeToLight;
      themeToggleBtn.setAttribute('aria-label', label);
      themeToggleBtn.setAttribute('title', label);
    }
  };

  applyTheme(getStoredTheme() === 'light' ? 'light' : 'dark');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      setStoredTheme(nextTheme);
      applyTheme(nextTheme);
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === THEME_KEY) {
      applyTheme(event.newValue === 'light' ? 'light' : 'dark');
    }
  });

  /* ------------------------------------------------------------------------
     2. Mobile navigation
     ------------------------------------------------------------------------ */
  const menuBtn = document.querySelector('[data-mobile-menu-btn]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  const closeMobileNav = (restoreFocus = false) => {
    if (!menuBtn || !mobileNav || !mobileNav.classList.contains('is-open')) return;
    mobileNav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', i18n.menuOpen);
    if (restoreFocus) menuBtn.focus();
  };

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      menuBtn.setAttribute('aria-label', isOpen ? i18n.menuClose : i18n.menuOpen);
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMobileNav(false));
    });

    mobileNav.addEventListener('focusout', (event) => {
      if (!mobileNav.classList.contains('is-open')) return;
      const nextTarget = event.relatedTarget;
      if (nextTarget && !mobileNav.contains(nextTarget) && !menuBtn.contains(nextTarget)) {
        closeMobileNav(false);
      }
    });

    document.addEventListener('click', (event) => {
      if (!mobileNav.classList.contains('is-open')) return;
      if (!mobileNav.contains(event.target) && !menuBtn.contains(event.target)) {
        closeMobileNav(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileNav(true);
    });

    const desktopQuery = window.matchMedia('(min-width: 768px)');
    desktopQuery.addEventListener?.('change', (event) => {
      if (event.matches) closeMobileNav(false);
    });
  }

  /* ------------------------------------------------------------------------
     3. Reading progress & scroll-spy
     ------------------------------------------------------------------------ */
  const progressBar = document.querySelector('.scroll-progress');
  const hashLinks = Array.from(document.querySelectorAll('.site-nav .nav-link[href^="#"], .mobile-nav .nav-link[href^="#"]'));

  const getSectionTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  const sections = Array.from(
    new Set(hashLinks.map((link) => link.getAttribute('href')))
  )
    .map((hash) => (hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null))
    .filter(Boolean);

  const updateScrollState = () => {
    if (progressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
    }

    if (sections.length === 0) return;

    const orderedSections = [...sections].sort((a, b) => getSectionTop(a) - getSectionTop(b));
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
    const scrollPos = window.scrollY + 160;
    let activeId = null;

    if (atBottom) {
      activeId = orderedSections[orderedSections.length - 1].id;
    } else {
      for (const section of orderedSections) {
        if (getSectionTop(section) <= scrollPos) activeId = section.id;
      }
    }

    hashLinks.forEach((link) => {
      const isMatch = activeId !== null && link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  let scrollRafId = null;
  const scheduleScrollUpdate = () => {
    if (scrollRafId) return;
    scrollRafId = window.requestAnimationFrame(() => {
      updateScrollState();
      scrollRafId = null;
    });
  };

  if (progressBar || sections.length > 0) {
    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
    updateScrollState();
  }

  /* ------------------------------------------------------------------------
     4. Scroll reveal
     ------------------------------------------------------------------------ */
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  let revealObserver = null;

  const settleReveal = (el) => {
    el.classList.remove('reveal', 'is-visible');
    el.style.removeProperty('--reveal-delay');
  };

  const settleVisibleOrAbove = () => {
    const thresholdY = window.innerHeight + 48;
    revealElements.forEach((el) => {
      if (!el.classList.contains('reveal')) return;
      if (el.getBoundingClientRect().top <= thresholdY) {
        revealObserver?.unobserve(el);
        settleReveal(el);
      }
    });
  };

  if (revealElements.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(settleReveal);
    } else {
      // Immediately reveal elements already in or above the viewport (including hash jumps)
      settleVisibleOrAbove();

      const remaining = revealElements.filter((el) => el.classList.contains('reveal'));
      if (remaining.length > 0) {
        revealObserver = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target;
              obs.unobserve(el);
              el.classList.add('is-visible');
              const delay = parseInt(el.style.getPropertyValue('--reveal-delay') || '0', 10);
              window.setTimeout(() => settleReveal(el), delay + 640);
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -16px 0px' }
        );

        const siblingCounts = new Map();
        remaining.forEach((el) => {
          const parent = el.parentElement || document.body;
          const index = siblingCounts.get(parent) || 0;
          siblingCounts.set(parent, index + 1);
          el.style.setProperty('--reveal-delay', `${Math.min((index % 3) * 60, 120)}ms`);
          revealObserver.observe(el);
        });

        window.addEventListener('hashchange', () => {
          window.requestAnimationFrame(settleVisibleOrAbove);
        });
      }
    }
  }

  /* ------------------------------------------------------------------------
     5. Project filter (supports multi-category cards and URL persistence)
     ------------------------------------------------------------------------ */
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const projectCards = Array.from(document.querySelectorAll('[data-category]'));
  const filterStatusEl = document.querySelector('[data-filter-status]');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    const applyFilter = (selected, { updateUrl = true, announce = true } = {}) => {
      const targetBtn = filterButtons.find((b) => b.getAttribute('data-filter') === selected) || filterButtons[0];
      const activeKey = targetBtn.getAttribute('data-filter') || 'all';

      filterButtons.forEach((b) => {
        const active = b === targetBtn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      const visibleCards = [];
      projectCards.forEach((card) => {
        const categories = (card.getAttribute('data-category') || '').trim().split(/\s+/);
        const matches = activeKey === 'all' || categories.includes(activeKey);
        card.classList.remove('is-filter-wide', 'is-filter-half');
        card.classList.toggle('is-hidden', !matches);
        if (matches) {
          revealObserver?.unobserve(card);
          settleReveal(card);
          visibleCards.push(card);
        }
      });

      // Keep the grid free of orphan gaps when a subset is shown
      if (activeKey !== 'all') {
        const oddTrailing = visibleCards.length % 2 === 1;
        visibleCards.forEach((card, idx) => {
          const isLast = idx === visibleCards.length - 1;
          card.classList.add(oddTrailing && isLast ? 'is-filter-wide' : 'is-filter-half');
        });
      }

      if (updateUrl && window.history?.replaceState) {
        const url = new URL(window.location.href);
        if (activeKey === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', activeKey);
        }
        window.history.replaceState(null, '', url.toString());
      }

      if (announce && filterStatusEl) {
        filterStatusEl.textContent = i18n.filterStatus(visibleCards.length);
      }
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-active')) return;
        applyFilter(btn.getAttribute('data-filter') || 'all');
      });
    });

    // Restore filter from URL query when returning from a case study
    const initialCategory = new URLSearchParams(window.location.search).get('category');
    if (initialCategory && filterButtons.some((b) => b.getAttribute('data-filter') === initialCategory)) {
      applyFilter(initialCategory, { updateUrl: false, announce: false });
    }
  }

  /* ------------------------------------------------------------------------
     6. Screenshot lightbox
     ------------------------------------------------------------------------ */
  const zoomTriggers = document.querySelectorAll('[data-zoom]');
  const supportsDialog =
    typeof HTMLDialogElement === 'function' && 'showModal' in HTMLDialogElement.prototype;

  if (zoomTriggers.length > 0 && supportsDialog) {
    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', i18n.lightboxLabel);

    const dialogImg = document.createElement('img');
    dialogImg.alt = '';
    dialogImg.decoding = 'async';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
    closeBtn.textContent = i18n.lightboxClose;
    closeBtn.addEventListener('click', () => dialog.close());

    dialog.append(dialogImg, closeBtn);
    document.body.append(dialog);

    // Close when clicking the backdrop (outside the image and button)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    let lastTrigger = null;
    dialog.addEventListener('close', () => {
      lastTrigger?.focus();
    });

    zoomTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const img = trigger.querySelector('img');
        if (!img) return;
        dialogImg.src = img.currentSrc || img.src;
        dialogImg.alt = img.alt;
        lastTrigger = trigger;
        dialog.showModal();
        closeBtn.focus();
      });
    });
  }

  /* ------------------------------------------------------------------------
     7. Email copy
     ------------------------------------------------------------------------ */
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer = null;

  const showToast = (message) => {
    if (!toastEl) return;
    toastEl.textContent = '';
    window.requestAnimationFrame(() => {
      toastEl.textContent = message;
      toastEl.classList.add('is-visible');
    });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 2400);
  };

  document.querySelectorAll('[data-copy-email]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.getAttribute('data-copy-email');
      if (!email) return;
      try {
        await navigator.clipboard.writeText(email);
        showToast(i18n.emailCopied);
      } catch {
        showToast(i18n.emailCopyError(email));
      }
    });
  });
})();

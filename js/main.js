(function(window, document) {
  'use strict';

  const THEME_KEY = 'authyntic.theme-preference';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const canUseStorage = (() => {
    try {
      const key = '__theme_test__';
      window.localStorage.setItem(key, key);
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  })();

  function readThemePreference() {
    if (canUseStorage) {
      const value = window.localStorage.getItem(THEME_KEY);
      if (value === 'light' || value === 'dark') {
        return value;
      }
    }
    return prefersDark ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.body.dataset.theme = normalized;
    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-pressed', normalized === 'light');
      toggle.setAttribute('data-theme-state', normalized);
    }
  }

  function persistTheme(theme) {
    if (canUseStorage) {
      try {
        window.localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        // ignore write failures
      }
    }
  }

  function toggleTheme() {
    const current = document.body.dataset.theme || readThemePreference();
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    persistTheme(next);
  }

  function bindThemeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) {
      return;
    }
    toggle.addEventListener('click', () => {
      toggleTheme();
    });
  }

  function closeMenuOutside(event, state) {
    if (!state.primaryNav.contains(event.target) && !state.mobileMenuToggle.contains(event.target)) {
      state.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      state.primaryNav.classList.remove('active');
      document.removeEventListener('click', state.boundCloseHandler);
    }
  }

  function bindMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const primaryNav = document.querySelector('.primary-nav');
    if (!mobileMenuToggle || !primaryNav) {
      return;
    }
    const state = { mobileMenuToggle, primaryNav, boundCloseHandler: null };
    state.boundCloseHandler = (event) => closeMenuOutside(event, state);

    mobileMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const expanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      mobileMenuToggle.setAttribute('aria-expanded', (!expanded).toString());
      primaryNav.classList.toggle('active');

      if (!expanded) {
        document.addEventListener('click', state.boundCloseHandler);
      } else {
        document.removeEventListener('click', state.boundCloseHandler);
      }
    });

    primaryNav.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    const navLinks = primaryNav.querySelectorAll('a');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('active');
        document.removeEventListener('click', state.boundCloseHandler);
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 920) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('active');
        document.removeEventListener('click', state.boundCloseHandler);
      }
    });
  }

  function animateCounter(element) {
    const target = Number(element.getAttribute('data-count'));
    if (!Number.isFinite(target)) {
      return;
    }
    const duration = 2200;
    const start = performance.now();

    function update(now) {
      const elapsed = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const value = target * eased;
      if (Number.isInteger(target)) {
        element.textContent = Math.round(value).toLocaleString();
      } else {
        element.textContent = value.toFixed(1);
      }
      if (elapsed < 1) {
        window.requestAnimationFrame(update);
      }
    }

    window.requestAnimationFrame(update);
  }

  function observeAnimatedElements() {
    const counters = document.querySelectorAll('.counter');
    const bars = document.querySelectorAll('.bar-fill');
    const reveals = document.querySelectorAll('.reveal');
    const metricCards = document.querySelectorAll('[data-animate-metric]');

    const options = { threshold: 0.4 };

    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    counters.forEach((element) => counterObserver.observe(element));

    const barObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const element = entry.target;
        const percent = element.getAttribute('data-percent');
        element.style.width = `${percent}%`;
        observer.unobserve(element);
      });
    }, options);

    bars.forEach((element) => barObserver.observe(element));

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    reveals.forEach((element) => revealObserver.observe(element));

    const metricObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const card = entry.target;
        const progress = Number(card.getAttribute('data-progress'));
        if (Number.isFinite(progress)) {
          card.style.setProperty('--metric-progress', Math.max(0, Math.min(1, progress / 100)));
        }
        card.classList.add('is-active');
        observer.unobserve(card);
      });
    }, { threshold: 0.6 });

    metricCards.forEach((card) => metricObserver.observe(card));
  }

  function markActiveNavLink() {
    const currentPath = window.location.pathname.replace(/index\.html$/, '');
    const navLinks = document.querySelectorAll('.primary-nav a');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) {
        return;
      }
      const url = new URL(href, window.location.origin);
      if (currentPath.endsWith(url.pathname.replace(/index\.html$/, ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function bindLoginButtons() {
    document.querySelectorAll('[data-auth="login"]').forEach((element) => {
      if (element.dataset.authBound === 'true') {
        return;
      }
      element.dataset.authBound = 'true';
      element.addEventListener('click', (event) => {
        if (element.tagName === 'A') {
          return;
        }
        event.preventDefault();
        if (window.AuthManager && typeof window.AuthManager.openLogin === 'function') {
          window.AuthManager.openLogin(element.dataset.authTarget);
        } else {
          window.location.href = element.dataset.authTarget || '/pages/login.html';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(readThemePreference());
    bindThemeToggle();
    bindMobileMenu();
    observeAnimatedElements();
    markActiveNavLink();
    bindLoginButtons();
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (canUseStorage && window.localStorage.getItem(THEME_KEY)) {
        return;
      }
      applyTheme(event.matches ? 'dark' : 'light');
    });
  }
})(window, document);

(function(window, document) {
  'use strict';

  const SESSION_KEY = 'authyntic.session';
  const CSRF_KEY = 'authyntic.csrfToken';
  const ATTEMPT_KEY = 'authyntic.loginAttempts';
  const MESSAGE_KEY = 'authyntic.authMessage';
  const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const CSRF_ROTATION_MS = 12 * 60 * 60 * 1000; // 12 hours
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const LOGIN_PATH = '/pages/login.html';

  const APPROVED_USERS = {
    justin: {
      displayName: 'Justin',
      roles: ['operator', 'commander']
    },
    zach: {
      displayName: 'Zach',
      roles: ['operator', 'analyst']
    }
  };

  const memoryStore = new Map();
  let logoutTimer = null;

  function storageAvailable() {
    try {
      const testKey = '__auth_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  const canUseLocalStorage = storageAvailable();

  function readStore(key) {
    if (canUseLocalStorage) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (error) {
        console.warn('[Authyntic] Failed to read from storage', error);
        return null;
      }
    }
    return memoryStore.get(key) || null;
  }

  function writeStore(key, value) {
    if (canUseLocalStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn('[Authyntic] Failed to persist storage, falling back to memory store', error);
        memoryStore.set(key, value);
        return;
      }
    }
    memoryStore.set(key, value);
  }

  function removeStore(key) {
    if (canUseLocalStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn('[Authyntic] Failed to remove storage key', error);
      }
    }
    memoryStore.delete(key);
  }

  function now() {
    return Date.now();
  }

  function generateToken(length = 32) {
    if (window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    let fallback = '';
    for (let index = 0; index < length; index += 1) {
      fallback += Math.floor(Math.random() * 16).toString(16);
    }
    return fallback;
  }

  function parseRoles(input) {
    if (!input) {
      return [];
    }
    if (Array.isArray(input)) {
      return input.filter(Boolean).map((role) => role.toString().trim().toLowerCase()).filter(Boolean);
    }
    return input
      .toString()
      .split(',')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);
  }

  function hasRequiredRoles(session, requiredRoles) {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    if (!session || !Array.isArray(session.roles)) {
      return false;
    }
    const normalized = session.roles.map((role) => role.toString().toLowerCase());
    return requiredRoles.every((role) => normalized.includes(role));
  }

  function scheduleLogoutTimer(session) {
    if (logoutTimer) {
      window.clearTimeout(logoutTimer);
      logoutTimer = null;
    }
    if (!session) {
      return;
    }
    const delay = Math.max(0, session.expiresAt - now());
    logoutTimer = window.setTimeout(() => {
      AuthManager.clearSession(true);
    }, delay);
  }

  function digestSHA256(value) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.resolve(null);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    return window.crypto.subtle.digest('SHA-256', data).then((buffer) => {
      const bytes = new Uint8Array(buffer);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    });
  }

  function safeRedirectPath(target) {
    if (!target) return null;
    try {
      const destination = new URL(target, window.location.origin);
      if (destination.origin !== window.location.origin) {
        return null;
      }
      return destination.pathname + destination.search + destination.hash;
    } catch (error) {
      return null;
    }
  }

  function getLoginUrl(next) {
    const url = new URL(LOGIN_PATH, window.location.origin);
    const safeNext = safeRedirectPath(next);
    if (safeNext) {
      url.searchParams.set('next', safeNext);
    }
    return url.toString();
  }

  const AuthManager = {
    initialize() {
      this.csrfToken = this.ensureCsrfToken();
      this.attachStorageListener();
      this.updateAuthUI();
      this.bindLoginControls();
      this.bindLogoutControls();
      this.guardProtectedLinks();
      this.scheduleSessionWatcher();
      this.renderQueuedMessage();
      this.enforcePageRequirement();
      if (document.body && document.body.hasAttribute('data-login-page')) {
        this.prepareLoginPage();
      }
    },

    ensureCsrfToken() {
      const record = readStore(CSRF_KEY);
      const timestamp = now();
      if (record && record.token && record.issuedAt && (timestamp - record.issuedAt) < CSRF_ROTATION_MS) {
        this.syncMetaToken(record.token);
        return record.token;
      }
      const token = generateToken(32);
      writeStore(CSRF_KEY, { token, issuedAt: timestamp });
      this.syncMetaToken(token);
      return token;
    },

    syncMetaToken(token) {
      const meta = document.querySelector('meta[name="csrf-token"]');
      if (meta) {
        meta.setAttribute('content', token);
      }
      const hiddenInputs = document.querySelectorAll('input[name="csrf_token"]');
      hiddenInputs.forEach((input) => {
        input.value = token;
      });
    },

    attachStorageListener() {
      window.addEventListener('storage', (event) => {
        if (!event) return;
        if (event.key === SESSION_KEY || event.key === ATTEMPT_KEY) {
          this.updateAuthUI();
          this.scheduleSessionWatcher();
        }
        if (event.key === CSRF_KEY) {
          const data = readStore(CSRF_KEY);
          if (data && data.token) {
            this.syncMetaToken(data.token);
          }
        }
      });
    },

    getSession() {
      const session = readStore(SESSION_KEY);
      if (!session || !session.expiresAt) {
        return null;
      }
      if (session.expiresAt <= now()) {
        this.clearSession();
        return null;
      }
      return session;
    },

    createSession(serverResponse) {
      if (!serverResponse || typeof serverResponse !== 'object') {
        return null;
      }
      const { session, signature } = serverResponse;
      if (!session || typeof session !== 'object') {
        return null;
      }
      const {
        username,
        displayName,
        issuedAt,
        expiresAt,
        sessionId,
        roles
      } = session;
      if (!username || !issuedAt || !expiresAt || !sessionId) {
        return null;
      }
      const profile = APPROVED_USERS[username];
      const normalizedRoles = parseRoles(Array.isArray(roles) && roles.length ? roles : profile ? profile.roles : []);
      const record = {
        username,
        displayName: displayName || (profile ? profile.displayName : username),
        issuedAt,
        expiresAt,
        sessionId,
        roles: normalizedRoles,
        signature: signature || null
      };
      writeStore(SESSION_KEY, record);
      scheduleLogoutTimer(record);
      return record;
    },

    clearSession(isExpired = false) {
      removeStore(SESSION_KEY);
      scheduleLogoutTimer(null);
      this.updateAuthUI();
      if (isExpired) {
        this.queueMessage('warning', 'Your session has expired. Please sign in again to continue.');
        const currentPath = window.location.pathname;
        if (currentPath !== LOGIN_PATH) {
          window.location.href = getLoginUrl(currentPath + window.location.search + window.location.hash);
        }
      }
    },

    scheduleSessionWatcher() {
      const session = this.getSession();
      scheduleLogoutTimer(session);
    },

    updateAuthUI() {
      const session = this.getSession();
      const isAuthenticated = Boolean(session);
      if (document.body) {
        document.body.classList.toggle('is-authenticated', isAuthenticated);
        document.body.setAttribute('data-authenticated', isAuthenticated ? 'true' : 'false');
        if (session && Array.isArray(session.roles)) {
          document.body.setAttribute('data-auth-roles', session.roles.join(','));
        } else {
          document.body.removeAttribute('data-auth-roles');
        }
      }
      const loginControls = document.querySelectorAll('[data-auth="login"]');
      const logoutControls = document.querySelectorAll('[data-auth="logout"]');
      const statusBadges = document.querySelectorAll('[data-auth-status]');
      const userLabels = document.querySelectorAll('[data-auth-user]');
      const gatedLinks = document.querySelectorAll('[data-requires-auth]');
      loginControls.forEach((control) => {
        control.hidden = isAuthenticated;
      });
      logoutControls.forEach((control) => {
        control.hidden = !isAuthenticated;
        if (isAuthenticated && control.tagName === 'BUTTON') {
          control.setAttribute('aria-label', `Log out ${session.displayName}`);
        }
      });
      statusBadges.forEach((badge) => {
        badge.hidden = !isAuthenticated;
        if (isAuthenticated) {
          badge.setAttribute('data-authenticated', 'true');
        } else {
          badge.removeAttribute('data-authenticated');
        }
      });
      userLabels.forEach((label) => {
        label.textContent = isAuthenticated ? session.displayName : '';
      });
      gatedLinks.forEach((link) => {
        const requiredRoles = parseRoles(link.dataset.authRole);
        if (!isAuthenticated) {
          link.classList.add('requires-auth');
          link.dataset.authState = 'locked';
          return;
        }
        const hasRoles = hasRequiredRoles(session, requiredRoles);
        if (!hasRoles) {
          link.classList.add('requires-auth');
          link.dataset.authState = 'insufficient-role';
        } else {
          link.classList.remove('requires-auth');
          delete link.dataset.authState;
        }
      });
      this.applyRoleVisibility(session);
    },

    applyRoleVisibility(session) {
      const roleTargets = document.querySelectorAll('[data-auth-role]');
      roleTargets.forEach((element) => {
        const requiredRoles = parseRoles(element.dataset.authRole);
        const visibility = element.getAttribute('data-auth-visibility') || 'disable';
        const hasRoles = hasRequiredRoles(session, requiredRoles);
        if (hasRoles) {
          element.hidden = false;
          element.removeAttribute('aria-disabled');
          element.classList.remove('requires-auth');
          delete element.dataset.authState;
          return;
        }
        if (visibility === 'hide') {
          element.hidden = true;
        } else {
          element.hidden = false;
          element.setAttribute('aria-disabled', 'true');
          element.classList.add('requires-auth');
          element.dataset.authState = 'locked';
        }
      });
    },

    bindLoginControls() {
      document.querySelectorAll('[data-auth="login"]').forEach((control) => {
        if (control.dataset.authListener === 'true') {
          return;
        }
        control.dataset.authListener = 'true';
        if (control.tagName === 'A') {
          return;
        }
        control.addEventListener('click', (event) => {
          event.preventDefault();
          const target = control.getAttribute('data-auth-target') || (control.getAttribute('href') || '');
          this.openLogin(target);
        });
      });
    },

    bindLogoutControls() {
      document.querySelectorAll('[data-auth="logout"]').forEach((control) => {
        control.addEventListener('click', (event) => {
          event.preventDefault();
          const currentLocation = window.location.pathname + window.location.search + window.location.hash;
          const shouldResetToHome = document.body && document.body.hasAttribute('data-login-page');
          const redirectTarget = shouldResetToHome ? '/' : safeRedirectPath(currentLocation);
          this.clearSession();
          this.queueMessage('success', 'You have been securely signed out.');
          window.location.href = getLoginUrl(redirectTarget || '/');
        });
      });
    },

    openLogin(target) {
      const currentLocation = window.location.pathname + window.location.search + window.location.hash;
      const nextTarget = safeRedirectPath(target) || currentLocation;
      window.location.href = getLoginUrl(nextTarget);
    },

    guardProtectedLinks() {
      document.querySelectorAll('[data-requires-auth]').forEach((link) => {
        if (link.dataset.authBound === 'true') {
          return;
        }
        link.dataset.authBound = 'true';
        link.addEventListener('click', (event) => {
          const session = this.getSession();
          const requiredRoles = parseRoles(link.dataset.authRole);
          if (!session) {
            event.preventDefault();
            const nextTarget = link.getAttribute('data-auth-next') || link.getAttribute('href') || window.location.href;
            const message = link.getAttribute('data-auth-message') || 'Please sign in with authorized credentials to open the secure demo environment.';
            this.queueMessage('warning', message);
            window.location.href = getLoginUrl(nextTarget);
            return;
          }
          if (!hasRequiredRoles(session, requiredRoles)) {
            event.preventDefault();
            const deniedMessage = link.getAttribute('data-auth-denied') || 'Your current authorization level does not permit access to this asset.';
            this.queueMessage('warning', deniedMessage);
            return;
          }
        });
      });
    },

    enforcePageRequirement() {
      const page = document.body;
      if (!page || !page.hasAttribute('data-requires-auth')) {
        return;
      }
      const session = this.getSession();
      const redirectTarget = page.getAttribute('data-auth-redirect') || (window.location.pathname + window.location.search + window.location.hash);
      if (!session) {
        this.queueMessage('warning', page.getAttribute('data-auth-message') || 'Authenticate to continue to the protected console.');
        window.location.href = getLoginUrl(redirectTarget);
        return;
      }
      const requiredRoles = parseRoles(page.getAttribute('data-requires-role'));
      if (!hasRequiredRoles(session, requiredRoles)) {
        this.queueMessage('warning', page.getAttribute('data-auth-denied') || 'This console requires an elevated authorization tier.');
        window.location.href = '/';
      }
    },

    prepareLoginPage() {
      const form = document.getElementById('login-form');
      const errorAlert = document.querySelector('[data-auth-error]');
      const flashAlert = document.querySelector('[data-auth-flash]');
      const rateAlert = document.querySelector('[data-auth-rate]');
      const sessionIndicator = document.querySelector('[data-session-indicator]');
      const session = this.getSession();

      this.syncMetaToken(this.csrfToken);

      if (session && sessionIndicator) {
        sessionIndicator.hidden = false;
        if (form) {
          form.setAttribute('aria-disabled', 'true');
          Array.from(form.elements).forEach((element) => {
            element.setAttribute('disabled', 'disabled');
          });
        }
        return;
      }

      if (form) {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity || form.reportValidity()) {
            await this.handleLoginSubmission(form, { errorAlert, flashAlert, rateAlert });
          }
        });
      }
    },

    async handleLoginSubmission(form, alerts) {
      const { errorAlert, flashAlert, rateAlert } = alerts;
      this.hideAlert(errorAlert);
      this.hideAlert(flashAlert);
      this.hideAlert(rateAlert);

      const formData = new FormData(form);
      const username = (formData.get('username') || '').toString().trim().toLowerCase();
      const password = (formData.get('password') || '').toString();
      const csrfToken = (formData.get('csrf_token') || '').toString();

      if (!csrfToken || csrfToken !== this.csrfToken) {
        this.showAlert(errorAlert, 'The security token for this session is invalid or missing. Reload the page and try again.');
        return;
      }

      if (!username || !password) {
        this.showAlert(errorAlert, 'Enter both your authorized operator ID and access phrase.');
        return;
      }

      if (this.isRateLimited(rateAlert)) {
        return;
      }

      let response;
      try {
        response = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          credentials: 'same-origin',
          body: JSON.stringify({ username, password, csrfToken })
        });
      } catch (networkError) {
        console.error('[Authyntic] Authentication request failed', networkError);
        this.showAlert(errorAlert, 'Unable to reach the authentication service. Check your network connection and try again.');
        return;
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch (parseError) {
        console.error('[Authyntic] Failed to parse authentication response', parseError);
      }

      if (!response.ok || !payload) {
        this.registerFailedAttempt();
        const message = payload && payload.error ? payload.error : 'Access denied. The supplied credentials are invalid.';
        this.showAlert(errorAlert, message);
        this.isRateLimited(rateAlert);
        return;
      }

      const session = this.createSession(payload);
      if (!session) {
        this.showAlert(errorAlert, 'Unable to establish a secure session. Refresh the page and try again.');
        return;
      }

      this.resetAttempts();
      this.showAlert(flashAlert, `Welcome back, ${session.displayName}. Establishing secure session...`, 'success');
      this.updateAuthUI();

      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get('next');
      const redirectPath = safeRedirectPath(nextParam) || '/';

      window.setTimeout(() => {
        window.location.href = redirectPath;
      }, 800);
    },

    isRateLimited(rateAlert) {
      const attempts = this.getRecentAttempts();
      if (attempts.length < RATE_LIMIT_MAX) {
        return false;
      }
      const firstAttempt = attempts[0];
      const waitMs = RATE_LIMIT_WINDOW_MS - (now() - firstAttempt);
      if (waitMs <= 0) {
        this.resetAttempts();
        return false;
      }
      const minutes = Math.ceil(waitMs / 60000);
      const message = `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
      if (rateAlert) {
        this.showAlert(rateAlert, message, 'warning');
      } else {
        alert(message); // fallback
      }
      return true;
    },

    getRecentAttempts() {
      const attempts = readStore(ATTEMPT_KEY);
      const threshold = now() - RATE_LIMIT_WINDOW_MS;
      if (!Array.isArray(attempts)) {
        return [];
      }
      const filtered = attempts.filter((timestamp) => typeof timestamp === 'number' && timestamp > threshold);
      if (filtered.length !== attempts.length) {
        writeStore(ATTEMPT_KEY, filtered);
      }
      return filtered;
    },

    registerFailedAttempt() {
      const attempts = this.getRecentAttempts();
      attempts.push(now());
      writeStore(ATTEMPT_KEY, attempts);
    },

    resetAttempts() {
      removeStore(ATTEMPT_KEY);
    },

    hideAlert(element) {
      if (!element) return;
      element.hidden = true;
      element.classList.remove('is-visible', 'alert--success', 'alert--warning', 'alert--error', 'alert--info');
    },

    showAlert(element, message, variant = 'error') {
      if (!element) return;
      element.textContent = message;
      element.hidden = false;
      element.classList.add('is-visible');
      element.classList.remove('alert--error', 'alert--info', 'alert--success', 'alert--warning');
      if (variant === 'success') {
        element.classList.add('alert--success');
      } else if (variant === 'warning') {
        element.classList.add('alert--warning');
      } else if (variant === 'info') {
        element.classList.add('alert--info');
      } else {
        element.classList.add('alert--error');
      }
    },

    queueMessage(type, message) {
      const payload = { type, message, timestamp: now() };
      try {
        window.sessionStorage.setItem(MESSAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        memoryStore.set(MESSAGE_KEY, payload);
      }
    },

    consumeQueuedMessage() {
      let payload = null;
      try {
        const raw = window.sessionStorage.getItem(MESSAGE_KEY);
        if (raw) {
          payload = JSON.parse(raw);
          window.sessionStorage.removeItem(MESSAGE_KEY);
        }
      } catch (error) {
        payload = memoryStore.get(MESSAGE_KEY) || null;
        memoryStore.delete(MESSAGE_KEY);
      }
      return payload;
    },

    renderQueuedMessage() {
      const payload = this.consumeQueuedMessage();
      if (!payload) return;
      const flashAlert = document.querySelector('[data-auth-flash]');
      if (!flashAlert) return;
      const variant = payload.type === 'success' ? 'success' : payload.type === 'warning' ? 'warning' : 'info';
      this.showAlert(flashAlert, payload.message, variant);
    }
  };

  window.AuthManager = AuthManager;

  document.addEventListener('DOMContentLoaded', () => {
    AuthManager.initialize();
  });

})(window, document);

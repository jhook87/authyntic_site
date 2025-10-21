/**
 * UX Enhancement Module
 * Provides security-focused UI improvements, accessibility features,
 * and enhanced user experience patterns for the Authyntic platform.
 */
(function(window, document) {
  'use strict';

  const UXEnhancements = {
    /**
     * Initialize all UX enhancements
     */
    initialize() {
      this.setupOfflineDetection();
      this.setupKeyboardNavigation();
      this.setupPasswordStrengthIndicator();
      this.setupFormValidation();
      this.setupLoadingStates();
      this.setupAccessibilityAnnouncements();
      this.setupSecurityIndicators();
      this.enhanceAuthFlows();
    },

    /**
     * Detect and indicate offline status
     */
    setupOfflineDetection() {
      const createIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.textContent = 'Offline Mode';
        document.body.appendChild(indicator);
        return indicator;
      };

      let indicator = document.querySelector('.offline-indicator');
      if (!indicator) {
        indicator = createIndicator();
      }

      const updateStatus = () => {
        const isOnline = navigator.onLine;
        document.body.classList.toggle('is-offline', !isOnline);
        
        if (!isOnline) {
          indicator.textContent = 'Offline Mode - Limited Functionality';
          indicator.classList.add('is-visible');
        } else {
          indicator.textContent = 'Connection Restored';
          setTimeout(() => {
            indicator.classList.remove('is-visible');
          }, 3000);
        }
      };

      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
      updateStatus();
    },

    /**
     * Enhanced keyboard navigation with visible focus indicators
     */
    setupKeyboardNavigation() {
      // Add skip link if not present
      if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
      }

      // Ensure main content has ID
      const main = document.querySelector('main');
      if (main && !main.id) {
        main.id = 'main';
      }

      // Track keyboard usage for focus styling
      let isKeyboardUser = false;
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          isKeyboardUser = true;
          document.body.classList.add('keyboard-user');
        }
      });

      document.addEventListener('mousedown', () => {
        isKeyboardUser = false;
        document.body.classList.remove('keyboard-user');
      });

      // Escape key handling for modals and menus
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const mobileMenu = document.querySelector('.primary-nav.active');
          if (mobileMenu) {
            const toggle = document.querySelector('.mobile-menu-toggle');
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'false');
              mobileMenu.classList.remove('active');
            }
          }
        }
      });
    },

    /**
     * Password strength indicator
     */
    setupPasswordStrengthIndicator() {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      
      passwordInputs.forEach((input) => {
        if (input.name === 'password' && !input.nextElementSibling?.classList.contains('password-strength')) {
          const strengthMeter = document.createElement('div');
          strengthMeter.className = 'password-strength';
          strengthMeter.setAttribute('role', 'status');
          strengthMeter.setAttribute('aria-live', 'polite');
          strengthMeter.setAttribute('aria-label', 'Password strength indicator');
          
          for (let i = 0; i < 4; i++) {
            const segment = document.createElement('div');
            segment.className = 'password-strength__segment';
            strengthMeter.appendChild(segment);
          }
          
          input.parentNode.appendChild(strengthMeter);
          
          input.addEventListener('input', () => {
            const strength = this.calculatePasswordStrength(input.value);
            strengthMeter.setAttribute('data-strength', strength);
            
            // Update ARIA label
            const strengthText = strength === 'strong' ? 'Strong password' :
                                strength === 'medium' ? 'Medium strength password' :
                                strength === 'weak' ? 'Weak password' : 'No password';
            strengthMeter.setAttribute('aria-label', strengthText);
          });
        }
      });
    },

    /**
     * Calculate password strength
     */
    calculatePasswordStrength(password) {
      if (!password) return 'none';
      
      let strength = 0;
      
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;
      
      if (strength >= 4) return 'strong';
      if (strength >= 2) return 'medium';
      return 'weak';
    },

    /**
     * Enhanced form validation with real-time feedback
     */
    setupFormValidation() {
      const forms = document.querySelectorAll('form');
      
      forms.forEach((form) => {
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach((input) => {
          // Add validation on blur
          input.addEventListener('blur', () => {
            this.validateInput(input);
          });
          
          // Add validation on input for better UX
          input.addEventListener('input', () => {
            if (input.value.length > 0) {
              this.validateInput(input);
            }
          });
        });
      });
    },

    /**
     * Validate individual input
     */
    validateInput(input) {
      const isValid = input.checkValidity();
      const inputGroup = input.closest('.input-group');
      
      if (inputGroup) {
        inputGroup.setAttribute('data-valid', isValid);
        input.setAttribute('aria-invalid', !isValid);
        
        // Add/remove validation icon
        let icon = inputGroup.querySelector('.input-group__icon');
        if (!icon && input.value.length > 0) {
          icon = document.createElement('span');
          icon.className = 'input-group__icon';
          icon.setAttribute('aria-hidden', 'true');
          inputGroup.appendChild(icon);
        }
        
        if (icon) {
          icon.textContent = isValid ? '✓' : '✗';
        }
      }
      
      return isValid;
    },

    /**
     * Setup loading states for async operations
     */
    setupLoadingStates() {
      // Create loading overlay if not present
      if (!document.querySelector('.loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.innerHTML = `
          <div class="loading-spinner"></div>
          <div class="loading-message">Loading...</div>
        `;
        document.body.appendChild(overlay);
      }

      // Add loading state to forms on submit
      document.querySelectorAll('form').forEach((form) => {
        form.addEventListener('submit', (e) => {
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton && !submitButton.classList.contains('is-loading')) {
            submitButton.classList.add('is-loading');
            submitButton.setAttribute('aria-busy', 'true');
            
            // Remove loading state after a reasonable timeout
            setTimeout(() => {
              submitButton.classList.remove('is-loading');
              submitButton.removeAttribute('aria-busy');
            }, 10000);
          }
        });
      });
    },

    /**
     * Setup accessibility announcements for dynamic content
     */
    setupAccessibilityAnnouncements() {
      // Create announcement region if not present
      if (!document.querySelector('[role="status"][aria-live="polite"]')) {
        const announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.id = 'accessibility-announcer';
        document.body.appendChild(announcer);
      }
    },

    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
      let announcer = document.getElementById('accessibility-announcer');
      
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.id = 'accessibility-announcer';
        document.body.appendChild(announcer);
      }
      
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = '';
      
      // Small delay to ensure screen readers pick up the change
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    },

    /**
     * Setup security status indicators
     */
    setupSecurityIndicators() {
      // Monitor authentication state changes
      if (window.AuthManager) {
        const originalUpdateAuthUI = window.AuthManager.updateAuthUI;
        
        window.AuthManager.updateAuthUI = function() {
          originalUpdateAuthUI.call(this);
          
          const session = this.getSession();
          const statusMessage = session 
            ? `Authenticated as ${session.displayName}` 
            : 'Not authenticated';
          
          UXEnhancements.announce(statusMessage);
        };
      }
    },

    /**
     * Enhance authentication flows with better visual feedback
     */
    enhanceAuthFlows() {
      // Add visual feedback for authentication state changes
      const authIndicators = document.querySelectorAll('[data-auth-status]');
      
      authIndicators.forEach((indicator) => {
        // Add transition classes for smooth state changes
        indicator.style.transition = 'all 0.3s ease';
      });

      // Enhance login buttons with security indicators
      const loginButtons = document.querySelectorAll('[data-auth="login"]');
      
      loginButtons.forEach((button) => {
        if (!button.querySelector('.security-status')) {
          const securityBadge = document.createElement('span');
          securityBadge.className = 'security-status security-status--info';
          securityBadge.textContent = 'Secure';
          securityBadge.setAttribute('aria-label', 'Secure connection');
          securityBadge.style.fontSize = '0.65em';
          securityBadge.style.marginLeft = 'var(--space-1)';
          
          // Add after existing content
          if (button.tagName === 'BUTTON') {
            button.appendChild(securityBadge);
          }
        }
      });
    },

    /**
     * Show loading overlay with message
     */
    showLoading(message = 'Loading...') {
      const overlay = document.querySelector('.loading-overlay');
      const messageElement = overlay?.querySelector('.loading-message');
      
      if (overlay) {
        if (messageElement) {
          messageElement.textContent = message;
        }
        overlay.classList.add('is-visible');
        this.announce(message);
      }
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
      const overlay = document.querySelector('.loading-overlay');
      if (overlay) {
        overlay.classList.remove('is-visible');
      }
    }
  };

  // Expose to global scope
  window.UXEnhancements = UXEnhancements;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      UXEnhancements.initialize();
    });
  } else {
    UXEnhancements.initialize();
  }

})(window, document);

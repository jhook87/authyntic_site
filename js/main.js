
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu functionality
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const primaryNav = document.querySelector('.primary-nav');
  
  if (mobileMenuToggle && primaryNav) {
    mobileMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const expanded = this.getAttribute('aria-expanded') === 'true' || false;
      this.setAttribute('aria-expanded', !expanded);
      primaryNav.classList.toggle('active');
      
      // Close menu when clicking outside
      if (!expanded) {
        setTimeout(() => {
          document.addEventListener('click', closeMenuOutside);
        }, 10);
      } else {
        document.removeEventListener('click', closeMenuOutside);
      }
    });
    
    // Prevent clicks inside the nav from closing the menu
    primaryNav.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Close menu when clicking on nav links
    const navLinks = primaryNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('active');
      });
    });
    
    // Close menu on window resize if width is greater than mobile breakpoint
    window.addEventListener('resize', function() {
      if (window.innerWidth > 920) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('active');
        document.removeEventListener('click', closeMenuOutside);
      }
    });
  }
  
  function closeMenuOutside(event) {
    if (!primaryNav.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('active');
      document.removeEventListener('click', closeMenuOutside);
    }
  }
  
  const counters = document.querySelectorAll('.counter');
  const bars = document.querySelectorAll('.bar-fill');
  const reveals = document.querySelectorAll('.reveal');

  const options = { threshold: 0.4 };

  const counterObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        let current = 0;
        const duration = 2000;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;
        function updateCounter() {
          current += increment;
          if(current >= target) {
            el.textContent = Number.isInteger(target) ? target.toLocaleString() : target.toFixed(1);
          } else {
            el.textContent = Number.isInteger(target) ? Math.floor(current).toLocaleString() : current.toFixed(1);
            requestAnimationFrame(updateCounter);
          }
        }
        updateCounter();
        observer.unobserve(el);
      }
    });
  }, options);

  counters.forEach(counter => counterObserver.observe(counter));

  const barObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        const el = entry.target;
        const percent = el.getAttribute('data-percent');
        el.style.width = percent + '%';
        observer.unobserve(el);
      }
    });
  }, options);

  bars.forEach(bar => barObserver.observe(bar));

  const revealObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  reveals.forEach(el => revealObserver.observe(el));
});

document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('.counter');
  const nav = document.getElementById('primary-nav');
  const toggle = document.querySelector('.menu-toggle');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      toggle.classList.toggle('is-open');
      nav.classList.toggle('is-open');
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          toggle.click();
        }
      });
    });
  }

  if (counters.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-count'));
          const isDecimal = !Number.isInteger(target);
          const duration = 2000;
          const steps = 60;
          let current = 0;
          const increment = target / steps;

          const update = () => {
            current += increment;
            if (current >= target) {
              el.textContent = isDecimal ? target.toFixed(2) : Math.round(target).toLocaleString();
              observer.unobserve(el);
              return;
            }
            el.textContent = isDecimal ? current.toFixed(2) : Math.round(current).toLocaleString();
            requestAnimationFrame(update);
          };

          requestAnimationFrame(update);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }
});

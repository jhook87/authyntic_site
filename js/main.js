
document.addEventListener('DOMContentLoaded', function() {
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

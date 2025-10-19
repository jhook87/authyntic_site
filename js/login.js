document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('demo-login-form');
  const message = document.getElementById('login-message');

  if (!form || !message) {
    return;
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.classList.remove('alert--error', 'alert--success', 'is-visible');
    if (type === 'error') {
      message.classList.add('alert--error');
    } else {
      message.classList.add('alert--success');
    }
    message.classList.add('is-visible');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      showMessage('Enter both your email and password to continue.', 'error');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showMessage('Provide a valid email address.', 'error');
      return;
    }

    if (password.length < 8) {
      showMessage('Passwords must contain at least 8 characters.', 'error');
      return;
    }

    const demoAccounts = [
      { email: 'mission.lead@authynticdemo.com', password: 'MissionReady!1' },
      { email: 'intel.ops@authynticdemo.com', password: 'Integrity#9' }
    ];

    const isValid = demoAccounts.some(account => account.email === email && account.password === password);

    if (isValid) {
      showMessage('Credentials verified. Redirecting to AuthynticDemo…', 'success');
      setTimeout(() => {
        window.location.href = 'https://demo.authynticdefense.com';
      }, 1400);
    } else {
      showMessage('Authentication failed. Check your credentials or contact Authyntic operations.', 'error');
    }
  });
});

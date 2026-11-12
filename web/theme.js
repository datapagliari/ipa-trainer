(() => {
  const key = 'ipa-lab-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem(key); } catch {}
  function render() {
    const dark = preference === 'dark' || (preference !== 'light' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.textContent = dark ? '☀' : '☾';
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }
  render();
  system.addEventListener('change', render);
  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.getElementById('theme-toggle').onclick = () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      render();
    };
  });
})();

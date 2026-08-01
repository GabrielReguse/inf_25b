(() => {
  window.INF25B.ready(() => {
    const activate = tab => {
      document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
      document.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== tab);
    };
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => activate(button.dataset.tab)));
    document.querySelectorAll('[data-open-tab]').forEach(button => button.addEventListener('click', () => activate(button.dataset.openTab)));
  });
})();

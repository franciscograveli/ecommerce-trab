const Modal = {
  // ── Classe base para campos de formulário ──────────────────────
  INPUT:   'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors',
  SELECT:  'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors',
  TEXTAREA:'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors',
  LABEL:   'block text-xs font-medium text-gray-600 mb-1.5',
  SECTION: 'text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3',
  DIVIDER: 'border-t border-gray-100',
  BTN_CANCEL:  'px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors',
  BTN_PRIMARY: 'px-4 py-2 text-xs font-semibold bg-brand-primary hover:bg-amber-700 text-white rounded-lg transition-colors',

  // ── build: cria/substitui um modal no DOM ─────────────────────
  // id      — ID único do elemento (ex.: 'modal-empresa')
  // title   — texto do cabeçalho (pode ser atualizado via #id-title)
  // width   — classe Tailwind max-w-* (padrão: 'max-w-lg')
  // content — HTML interno (formulário, listas, etc.)
  build(id, { title, width = 'max-w-lg', content }) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    el.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4';
    el.innerHTML = `
      <div class="bg-white border border-brand-primary/30 rounded-2xl shadow-xl w-full ${width} p-7">
        <div class="flex items-center justify-between mb-6">
          <h3 id="${id}-title" class="text-gray-900 text-sm font-semibold">${title}</h3>
          <button type="button" onclick="Modal.close('${id}')"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        ${content}
      </div>`;
    el.addEventListener('click', (e) => { if (e.target === el) Modal.close(id); });
  },

  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  },
};

// Fechar modal aberto com Escape (sem interferir no sidebar do layout.js)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('[id^="modal"]').forEach((el) => {
    if (!el.classList.contains('hidden')) Modal.close(el.id);
  });
});

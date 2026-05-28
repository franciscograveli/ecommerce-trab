// Nav items por perfil — ícones via lucide (data-lucide)
const NAV = {
  admin: [
    { label: 'Dashboard',   href: '/pages/dashboard.html',   icon: 'layout-dashboard' },
    { label: 'Usuários',    href: '/pages/usuarios.html',    icon: 'users' },
    { label: 'Empresas',    href: '/pages/empresas.html',    icon: 'building-2' },
    { label: 'Produtos',    href: '/pages/produtos.html',    icon: 'package' },
    { label: 'Preços',      href: '/pages/precos.html',      icon: 'tags' },
    { label: 'Estoque',     href: '/pages/estoque.html',     icon: 'warehouse' },
    { label: 'Pedidos',     href: '/pages/pedidos.html',     icon: 'file-text' },
    { label: 'Aprovação',   href: '/pages/aprovacao.html',   icon: 'shield-check' },
    { label: 'Expedição',   href: '/pages/expedicao.html',   icon: 'truck' },
    { label: 'RMA',         href: '/pages/rma-admin.html',   icon: 'rotate-ccw' },
  ],
  representante: [
    { label: 'Dashboard',   href: '/pages/dashboard.html',   icon: 'layout-dashboard' },
    { label: 'Empresas',    href: '/pages/empresas.html',    icon: 'building-2' },
    { label: 'Pedidos',     href: '/pages/pedidos.html',     icon: 'file-text' },
  ],
  comprador: [
    { label: 'Pedidos',    href: '/pages/pedidos.html', icon: 'file-text' },
    { label: 'Devoluções', href: '/pages/rma.html',     icon: 'package-x' },
  ],
};

function Layout(pageTitle) {
  // Auth guard
  if (!localStorage.getItem('token')) {
    window.location.href = '/index.html';
    return;
  }

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const perfil  = (usuario.perfil?.nome ?? usuario.perfil ?? 'comprador').toLowerCase();
  const items   = NAV[perfil] || NAV.comprador;
  const current = window.location.pathname;

  // ── Sidebar ──────────────────────────────────────────────────
  const links = items.map(({ label, href, icon }) => {
    const active = current === href || current.endsWith(href.split('/').pop());
    return `
      <a href="${href}"
         class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium
                transition-colors no-underline
                ${active
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-tan hover:bg-brand-brown hover:text-brand-cream'}">
        <i data-lucide="${icon}" class="w-3.5 h-3.5 shrink-0"></i>
        ${label}
      </a>`;
  }).join('');

  document.getElementById('sidebar').innerHTML = `
    <div class="flex flex-col h-full bg-brand-dark">
      <!-- Logo + fechar (mobile) -->
      <div class="px-5 py-5 border-b border-brand-brown flex items-center justify-between">
        <div>
          <span class="text-brand-gold font-bold text-base tracking-wide">B2B Atacado</span>
          <p class="text-brand-tan text-[10px] tracking-widest uppercase mt-0.5">Destilados & Spirits</p>
        </div>
        <button onclick="Layout.closeSidebar()" id="btn-close-sidebar"
          class="lg:hidden text-brand-tan hover:text-brand-cream transition-colors -mr-1">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <p class="text-[10px] font-semibold text-brand-brown uppercase tracking-widest px-3 py-2">
          Menu
        </p>
        ${links}
      </nav>

      <!-- Perfil -->
      <div class="px-4 py-4 border-t border-brand-brown">
        <p class="text-brand-cream text-xs font-medium truncate">${usuario.nome || ''}</p>
        <span class="text-brand-tan text-[10px] capitalize">${perfil}</span>
      </div>
    </div>`;

  // Backdrop para fechar sidebar no mobile
  const backdrop = document.createElement('div');
  backdrop.id = 'sidebar-backdrop';
  backdrop.onclick = Layout.closeSidebar;
  document.body.appendChild(backdrop);

  // ── Topbar ────────────────────────────────────────────────────
  document.getElementById('topbar').innerHTML = `
    <div class="flex items-center justify-between h-full px-4 lg:px-6
                bg-brand-black border-b border-brand-brown">
      <div class="flex items-center gap-3">
        <button onclick="Layout.toggleSidebar()" id="btn-hamburger"
          class="lg:hidden text-brand-tan hover:text-brand-cream transition-colors">
          <i data-lucide="menu" class="w-4 h-4"></i>
        </button>
        <h1 class="text-brand-cream text-sm font-semibold">${pageTitle}</h1>
      </div>
      <button onclick="Layout.logout()"
        class="text-brand-tan hover:text-red-400 text-xs font-medium transition-colors flex items-center gap-1.5">
        <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
        <span class="hidden sm:inline">Sair</span>
      </button>
    </div>`;

  // Renderiza ícones lucide
  if (window.lucide) lucide.createIcons();

}

Layout.toggleSidebar = function () {
  const open = document.body.classList.toggle('sidebar-open');
  const hamburger = document.getElementById('btn-hamburger');
  if (hamburger) {
    hamburger.querySelector('i').setAttribute('data-lucide', open ? 'x' : 'menu');
    if (window.lucide) lucide.createIcons();
  }
};

Layout.closeSidebar = function () {
  document.body.classList.remove('sidebar-open');
  const hamburger = document.getElementById('btn-hamburger');
  if (hamburger) {
    hamburger.querySelector('i').setAttribute('data-lucide', 'menu');
    if (window.lucide) lucide.createIcons();
  }
};

Layout.logout = async function () {
  try { await Api.del('/auth/logout'); } catch (_) { /* ignora */ }
  Api.clearToken();
  localStorage.removeItem('usuario');
  window.location.href = '/index.html';
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') Layout.closeSidebar();
});

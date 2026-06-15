// ── Modais ────────────────────────────────────────────────────────

Modal.build('modal-pedido', {
  title: 'Novo Orçamento',
  width: 'max-w-md',
  content: `
    <form id="form-pedido" class="flex flex-col gap-4">
      <div id="f-empresa-wrap">
        <label class="${Modal.LABEL}">Empresa *</label>
        <select id="f-empresa" required class="${Modal.SELECT}" onchange="carregarCompradores(this.value)">
          <option value="">Selecione…</option>
        </select>
      </div>
      <div id="f-comprador-wrap" class="hidden">
        <label class="${Modal.LABEL}">Comprador *</label>
        <select id="f-comprador" class="${Modal.SELECT}">
          <option value="">Selecione…</option>
        </select>
      </div>
      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="Modal.close('modal-pedido')" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-salvar-pedido" class="${Modal.BTN_PRIMARY}">Criar Orçamento</button>
      </div>
    </form>`,
});

Modal.build('modal-itens', {
  title: 'Itens do Pedido',
  width: 'max-w-2xl',
  content: `
    <div id="itens-info" class="mb-4 text-xs text-gray-500"></div>
    <div id="lista-itens" class="mb-5"></div>

    <div id="add-item-wrap" class="hidden">
      <p class="${Modal.SECTION}">Adicionar Item</p>
      <form id="form-item" class="flex flex-col gap-3">
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-1">
            <label class="${Modal.LABEL}">Grade / SKU *</label>
            <select id="f-grade" required class="${Modal.SELECT}">
              <option value="">Selecione…</option>
            </select>
          </div>
          <div>
            <label class="${Modal.LABEL}">Quantidade *</label>
            <input type="number" id="f-qtd" min="1" required class="${Modal.INPUT}">
          </div>
          <div>
            <label class="${Modal.LABEL}">Preço Unit. (R$) *</label>
            <input type="number" id="f-preco" min="0" step="0.01" required class="${Modal.INPUT}">
          </div>
        </div>
        <div class="flex justify-end">
          <button type="submit" class="${Modal.BTN_PRIMARY}">Adicionar</button>
        </div>
      </form>
    </div>

    <div class="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
      <span id="itens-total" class="text-sm font-semibold text-gray-800"></span>
      <div class="flex gap-3">
        <button type="button" onclick="Modal.close('modal-itens')" class="${Modal.BTN_CANCEL}">Fechar</button>
        <button type="button" id="btn-confirmar" onclick="confirmarOrcamento()"
          class="hidden px-4 py-2 text-xs font-semibold bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
          Confirmar Pedido
        </button>
      </div>
    </div>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _pedidos   = [];
let _empresas  = [];
let _produtos  = [];
let _rmas      = [];
let _filtro    = '';
let _pedidoAtivoId = null;
const _usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  const perfil = (_usuario.perfil?.nome ?? _usuario.perfil ?? '').toLowerCase();

  // Comprador não cria orçamento diretamente nesta tela
  if (perfil === 'comprador') {
    document.getElementById('btn-novo').classList.add('hidden');
  }

  try {
    const [pedidos, empresas, produtos, rmas] = await Promise.all([
      Api.get('/pedidos'),
      perfil !== 'comprador' ? Api.get('/empresas') : Promise.resolve([]),
      Api.get('/produtos'),
      Api.get('/rma'),
    ]);
    _pedidos  = pedidos;
    _empresas = empresas;
    _produtos = produtos;
    _rmas     = rmas;
    renderTabela();
    _preencherSelectEmpresas();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

// ── Filtro de status ──────────────────────────────────────────────
function filtrar(status) {
  _filtro = status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-ativo'));
  document.getElementById(`tab-${status}`).classList.add('tab-ativo');
  renderTabela();
}

// ── Badges de status ──────────────────────────────────────────────
const STATUS_BADGE = {
  orcamento:                    'bg-gray-100 text-gray-600',
  aguardando_aprovacao_credito: 'bg-yellow-100 text-yellow-700',
  aprovado:                     'bg-green-100 text-green-700',
  em_separacao:                 'bg-blue-100 text-blue-700',
  enviado:                      'bg-indigo-100 text-indigo-700',
  entregue:                     'bg-emerald-100 text-emerald-700',
  cancelado:                    'bg-red-100 text-red-600',
};
const STATUS_LABEL = {
  orcamento:                    'Orçamento',
  aguardando_aprovacao_credito: 'Aguard. Aprovação',
  aprovado:                     'Aprovado',
  em_separacao:                 'Em Separação',
  enviado:                      'Enviado',
  entregue:                     'Entregue',
  cancelado:                    'Cancelado',
};

// ── Render principal ──────────────────────────────────────────────
function renderTabela() {
  const lista = _filtro
    ? _pedidos.filter(p => p.status === _filtro)
    : _pedidos;

  const tbody = document.getElementById('tbody');

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-12 text-center text-brand-tan">Nenhum pedido encontrado.</td></tr>`;
    return;
  }

  const podeEditar = ['admin', 'representante'].includes((_usuario.perfil?.nome ?? _usuario.perfil ?? '').toLowerCase());
  const podeCancelar = ['orcamento', 'aguardando_aprovacao_credito'];

  tbody.innerHTML = lista.map(p => {
    const empresa = p.cliente?.razao_social ?? '—';
    const valor   = Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const data    = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—';
    const badge   = STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-500';
    const label   = STATUS_LABEL[p.status] ?? p.status;

    const btnItens = `<button onclick="openModalItens(${p.id})"
      class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-brown/30 text-brand-tan hover:bg-brand-brown/60 transition-colors">
      Itens
    </button>`;

    const btnCancelar = podeCancelar.includes(p.status)
      ? `<button onclick="cancelar(${p.id})"
          class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
          Cancelar
         </button>`
      : '';

    // Verifica se já existe um RMA não rejeitado para este pedido
    const temRmaAtivo = _rmas.some(r => r.pedido_id === p.id && r.status !== 'rejeitado');

    const btnRMA = ['enviado', 'entregue'].includes(String(p.status).toLowerCase()) 
      && (_usuario.perfil?.nome ?? _usuario.perfil ?? '').toLowerCase() === 'comprador'
      && !temRmaAtivo
      ? `<button onclick="solicitarRMA(${p.id})"
          class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-primary/20 text-brand-amber hover:bg-brand-primary/40 transition-colors">
          Devolver
         </button>`
      : '';

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-tan font-mono">#${p.id}</td>
        <td class="px-5 py-3.5 text-brand-cream font-medium">${empresa}</td>
        <td class="px-5 py-3.5 text-brand-cream">${valor}</td>
        <td class="px-5 py-3.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${badge}">${label}</span>
        </td>
        <td class="px-5 py-3.5 text-brand-tan">${data}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-2">${btnItens}${btnRMA}${btnCancelar}</div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Modal criar orçamento ──────────────────────────────────────────
function _preencherSelectEmpresas() {
  const sel = document.getElementById('f-empresa');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione…</option>' +
    _empresas.map(e => `<option value="${e.id}">${e.razao_social}</option>`).join('');
}

async function carregarCompradores(clienteId) {
  const wrap = document.getElementById('f-comprador-wrap');
  const sel  = document.getElementById('f-comprador');
  const perfil = (_usuario.perfil?.nome ?? _usuario.perfil ?? '').toLowerCase();

  if (!clienteId || perfil === 'comprador') {
    wrap.classList.add('hidden');
    return;
  }

  sel.innerHTML = '<option value="">Carregando…</option>';
  wrap.classList.remove('hidden');

  try {
    const empresa = await Api.get(`/empresas/${clienteId}`);
    const compradores = empresa.compradores ?? [];
    if (compradores.length === 0) {
      sel.innerHTML = '<option value="">Nenhum comprador cadastrado</option>';
    } else {
      sel.innerHTML = '<option value="">Selecione…</option>' +
        compradores.map(c => `<option value="${c.id}">${c.usuario?.nome ?? `Comprador #${c.id}`}</option>`).join('');
    }
  } catch {
    sel.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

function openModalPedido() {
  document.getElementById('form-pedido').reset();
  document.getElementById('f-comprador-wrap').classList.add('hidden');
  document.getElementById('f-comprador').innerHTML = '<option value="">Selecione…</option>';
  Modal.open('modal-pedido');
}

document.getElementById('form-pedido').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-salvar-pedido');
  const clienteId = document.getElementById('f-empresa').value;

  const resolvedClienteId = clienteId || _usuario.comprador?.cliente_id;
  if (!resolvedClienteId) {
    showAlert('Selecione uma empresa.', 'error');
    return;
  }

  const compradorId = _usuario.comprador?.id
    ?? (parseInt(document.getElementById('f-comprador')?.value) || null);

  if (!compradorId) {
    showAlert('Selecione um comprador.', 'error');
    return;
  }

  const body = {
    cliente_id:   resolvedClienteId,
    comprador_id: compradorId,
  };

  btn.disabled = true;
  btn.textContent = 'Criando…';
  try {
    const pedido = await Api.post('/pedidos', body);
    Modal.close('modal-pedido');
    _pedidos = await Api.get('/pedidos');
    renderTabela();
    showAlert('Orçamento criado.', 'success');
    openModalItens(pedido.id);
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao criar orçamento.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Orçamento';
  }
});

// ── Modal itens ───────────────────────────────────────────────────
async function openModalItens(pedidoId) {
  _pedidoAtivoId = pedidoId;
  document.getElementById('modal-itens-title').textContent = `Itens do Pedido #${pedidoId}`;
  document.getElementById('lista-itens').innerHTML = '<p class="text-xs text-gray-400">Carregando…</p>';
  Modal.open('modal-itens');

  try {
    const [pedido, itens] = await Promise.all([
      Api.get(`/pedidos/${pedidoId}`),
      Api.get(`/pedidos/${pedidoId}/itens`),
    ]);
    _renderItens(pedido, itens);
    _preencherSelectGrades(pedido);
  } catch {
    document.getElementById('lista-itens').innerHTML = '<p class="text-xs text-red-400">Erro ao carregar itens.</p>';
  }
}

function _renderItens(pedido, itens) {
  const isOrcamento = pedido.status === 'orcamento';
  const addWrap = document.getElementById('add-item-wrap');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const infoEl = document.getElementById('itens-info');

  addWrap.classList.toggle('hidden', !isOrcamento);
  btnConfirmar.classList.toggle('hidden', !isOrcamento);

  const statusLabel = STATUS_LABEL[pedido.status] ?? pedido.status;
  infoEl.textContent = `Status: ${statusLabel} · Empresa: ${pedido.cliente?.razao_social ?? '—'}`;

  const total = Number(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById('itens-total').textContent = `Total: ${total}`;

  if (itens.length === 0) {
    document.getElementById('lista-itens').innerHTML =
      '<p class="text-xs text-gray-400 mb-2">Nenhum item adicionado.</p>';
    return;
  }

  document.getElementById('lista-itens').innerHTML = `
    <table class="w-full text-xs border border-gray-100 rounded-lg overflow-hidden mb-2">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-3 py-2 text-left text-gray-500">SKU</th>
          <th class="px-3 py-2 text-left text-gray-500">Produto</th>
          <th class="px-3 py-2 text-right text-gray-500">Qtd</th>
          <th class="px-3 py-2 text-right text-gray-500">Preço Unit.</th>
          <th class="px-3 py-2 text-right text-gray-500">Subtotal</th>
          ${isOrcamento ? '<th class="px-3 py-2"></th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${itens.map(it => {
          const subtotal = (it.quantidade * it.preco_unitario)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const preco = Number(it.preco_unitario)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const produto = it.grade?.produto?.nome ?? '—';
          return `
            <tr class="border-t border-gray-100">
              <td class="px-3 py-2 font-mono text-gray-600">${it.grade?.sku ?? '—'}</td>
              <td class="px-3 py-2 text-gray-800">${produto}</td>
              <td class="px-3 py-2 text-right text-gray-700">${it.quantidade}</td>
              <td class="px-3 py-2 text-right text-gray-700">${preco}</td>
              <td class="px-3 py-2 text-right font-semibold text-gray-800">${subtotal}</td>
              ${isOrcamento ? `<td class="px-3 py-2 text-right">
                <button onclick="removerItem(${it.id})"
                  class="text-red-400 hover:text-red-600 transition-colors">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
              </td>` : ''}
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  if (window.lucide) lucide.createIcons();
}

function _preencherSelectGrades(pedido) {
  const sel = document.getElementById('f-grade');
  const grades = _produtos.flatMap(p =>
    (p.grades ?? []).map(g => ({
      id:    g.id,
      label: `${p.nome} — ${g.sku}${g.tamanho ? ' / ' + g.tamanho : ''}${g.cor ? ' / ' + g.cor : ''}`,
    }))
  );
  sel.innerHTML = '<option value="">Selecione…</option>' +
    grades.map(g => `<option value="${g.id}">${g.label}</option>`).join('');
}

document.getElementById('form-item').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const body = {
    grade_id:       parseInt(document.getElementById('f-grade').value),
    quantidade:     parseInt(document.getElementById('f-qtd').value),
    preco_unitario: parseFloat(document.getElementById('f-preco').value),
  };
  try {
    await Api.post(`/pedidos/${_pedidoAtivoId}/itens`, body);
    document.getElementById('form-item').reset();
    const [pedido, itens] = await Promise.all([
      Api.get(`/pedidos/${_pedidoAtivoId}`),
      Api.get(`/pedidos/${_pedidoAtivoId}/itens`),
    ]);
    _renderItens(pedido, itens);
    _pedidos = await Api.get('/pedidos');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao adicionar item.', 'error');
  }
});

async function removerItem(itemId) {
  try {
    await Api.del(`/pedidos/${_pedidoAtivoId}/itens/${itemId}`);
    const [pedido, itens] = await Promise.all([
      Api.get(`/pedidos/${_pedidoAtivoId}`),
      Api.get(`/pedidos/${_pedidoAtivoId}/itens`),
    ]);
    _renderItens(pedido, itens);
    _pedidos = await Api.get('/pedidos');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao remover item.', 'error');
  }
}

// ── Confirmar orçamento → pedido ──────────────────────────────────
async function confirmarOrcamento() {
  if (!confirm('Confirmar orçamento? O pedido será enviado para aprovação ou aprovado automaticamente conforme o limite de crédito.')) return;
  try {
    const pedido = await Api.put(`/pedidos/${_pedidoAtivoId}`, { status: 'aprovado' });
    Modal.close('modal-itens');
    _pedidos = await Api.get('/pedidos');
    renderTabela();
    if (pedido.status === 'aguardando_aprovacao_credito') {
      showAlert('Pedido enviado para aprovação de crédito.', 'success');
    } else {
      showAlert('Pedido aprovado com sucesso.', 'success');
    }
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao confirmar pedido.', 'error');
  }
}

// ── Cancelar pedido ───────────────────────────────────────────────
async function cancelar(id) {
  if (!confirm('Cancelar este pedido?')) return;
  try {
    await Api.del(`/pedidos/${id}`);
    _pedidos = await Api.get('/pedidos');
    renderTabela();
    showAlert('Pedido cancelado.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao cancelar pedido.', 'error');
  }
}

function solicitarRMA(pedidoId) {
  window.location.href = `/pages/rma.html?pedido_id=${pedidoId}`;
}

// ── Alerta ────────────────────────────────────────────────────────
function showAlert(msg, type) {
  const cls = type === 'success'
    ? 'bg-green-950 border border-green-800 text-green-300'
    : 'bg-red-950 border border-red-800 text-red-300';
  const el = document.getElementById('alert');
  el.innerHTML = `<div class="${cls} text-xs rounded-lg px-4 py-2.5">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

init();

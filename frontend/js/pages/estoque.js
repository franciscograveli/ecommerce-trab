// ── Modais ────────────────────────────────────────────────────────
Modal.build('modal-ajuste', {
  title: 'Ajustar Estoque',
  width: 'max-w-md',
  content: `
    <form id="form-ajuste" class="flex flex-col gap-4">
      <input type="hidden" id="aj-grade-id">
      <input type="hidden" id="aj-deposito-id-fixed">

      <div id="fields-livre">
        <div class="mb-4">
          <label class="${Modal.LABEL}">Produto</label>
          <select id="aj-produto" onchange="onProdutoChange()" class="${Modal.SELECT}">
            <option value="">Selecione…</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="${Modal.LABEL}">Grade (SKU)</label>
            <select id="aj-grade" class="${Modal.SELECT}">
              <option value="">Selecione…</option>
            </select>
          </div>
          <div>
            <label class="${Modal.LABEL}">Depósito</label>
            <select id="aj-deposito" class="${Modal.SELECT}">
              <option value="">Selecione…</option>
            </select>
          </div>
        </div>
      </div>

      <div id="fields-fixo" class="hidden">
        <div class="bg-gray-100 border border-gray-100 rounded-lg px-4 py-3 mb-1">
          <p id="fixo-label" class="text-gray-700 text-xs font-medium"></p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">Quantidade</label>
          <input type="number" id="aj-quantidade" required min="0" step="1" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Operação</label>
          <select id="aj-operacao" class="${Modal.SELECT}">
            <option value="entrada">Entrada (+)</option>
            <option value="saida">Saída (−)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModalAjuste()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-ajuste" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

Modal.build('modal-deposito', {
  title: 'Novo Depósito',
  width: 'max-w-sm',
  content: `
    <form id="form-deposito" class="flex flex-col gap-4">
      <div>
        <label class="${Modal.LABEL}">Nome *</label>
        <input type="text" id="dep-nome" required class="${Modal.INPUT}">
      </div>
      <div>
        <label class="${Modal.LABEL}">Localização</label>
        <input type="text" id="dep-local" class="${Modal.INPUT}">
      </div>
      <div class="flex justify-end gap-3 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModalDeposito()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-deposito" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _estoque   = [];
let _depositos = [];
let _produtos  = [];

// ── Submits ───────────────────────────────────────────────────────
document.getElementById('form-ajuste').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-ajuste');

  const fixo    = !document.getElementById('fields-fixo').classList.contains('hidden');
  const gradeId = fixo
    ? parseInt(document.getElementById('aj-grade-id').value)
    : parseInt(document.getElementById('aj-grade').value);
  const depId   = fixo
    ? parseInt(document.getElementById('aj-deposito-id-fixed').value)
    : parseInt(document.getElementById('aj-deposito').value);

  const operacao = document.getElementById('aj-operacao').value;
  const body = {
    grade_id:    gradeId,
    deposito_id: depId,
    quantidade:  parseInt(document.getElementById('aj-quantidade').value),
  };

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    await Api.post(`/estoque/${operacao}`, body);
    showAlert('Estoque atualizado com sucesso.', 'success');
    closeModalAjuste();
    _estoque = await Api.get('/estoque');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao ajustar estoque.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

document.getElementById('form-deposito').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-deposito');
  const body = {
    nome:        document.getElementById('dep-nome').value.trim(),
    localizacao: document.getElementById('dep-local').value.trim() || null,
  };

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    await Api.post('/depositos', body);
    showAlert('Depósito criado com sucesso.', 'success');
    closeModalDeposito();
    _depositos = await Api.get('/depositos');
    renderDepositos();

    const filtro = document.getElementById('filtro-deposito');
    filtro.innerHTML = `<option value="">Todos os depósitos</option>`
      + _depositos.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
    const selDep = document.getElementById('aj-deposito');
    selDep.innerHTML = `<option value="">Selecione…</option>`
      + _depositos.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao criar depósito.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

// ── Inicialização ────────────────────────────────────────────────
async function init() {
  try {
    const [estoque, depositos, produtos] = await Promise.all([
      Api.get('/estoque'),
      Api.get('/depositos'),
      Api.get('/produtos'),
    ]);
    _estoque   = estoque;
    _depositos = depositos;
    _produtos  = produtos;

    const filtro = document.getElementById('filtro-deposito');
    filtro.innerHTML = `<option value="">Todos os depósitos</option>`
      + depositos.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');

    const selDep = document.getElementById('aj-deposito');
    selDep.innerHTML = `<option value="">Selecione…</option>`
      + depositos.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');

    const selProd = document.getElementById('aj-produto');
    selProd.innerHTML = `<option value="">Selecione…</option>`
      + produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

    renderTabela();
    renderDepositos();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

// ── Tabela ────────────────────────────────────────────────────────
function renderTabela() {
  const tbody    = document.getElementById('tbody');
  const filtroId = parseInt(document.getElementById('filtro-deposito').value) || null;
  const lista    = filtroId ? _estoque.filter(e => e.deposito_id === filtroId) : _estoque;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-5 py-12 text-center text-brand-tan">
          Nenhum registro de estoque encontrado.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(e => {
    const produto  = e.grade?.produto?.nome ?? '—';
    const volume   = e.grade?.volume ?? '—';
    const deposito = e.deposito?.nome ?? '—';
    const qtd      = e.quantidade ?? 0;
    const qtdCls   = qtd === 0 ? 'text-red-400' : qtd < 10 ? 'text-brand-amber' : 'text-brand-cream';

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-cream font-medium">${produto}</td>
        <td class="px-5 py-3.5 text-brand-tan font-mono">${volume}</td>
        <td class="px-5 py-3.5 text-brand-tan">${deposito}</td>
        <td class="px-5 py-3.5 text-right font-semibold ${qtdCls}">${qtd}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end">
            <button onclick="openModalAjusteFixo(${e.grade_id}, ${e.deposito_id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Ajustar">
              <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function renderDepositos() {
  const el = document.getElementById('lista-depositos');
  if (_depositos.length === 0) {
    el.innerHTML = `<p class="px-5 py-4 text-brand-tan text-xs">Nenhum depósito cadastrado.</p>`;
    return;
  }
  el.innerHTML = _depositos.map(d => `
    <div class="px-5 py-3.5 flex items-center justify-between">
      <div>
        <p class="text-brand-cream text-xs font-medium">${d.nome}</p>
        ${d.localizacao ? `<p class="text-brand-tan text-[11px] mt-0.5">${d.localizacao}</p>` : ''}
      </div>
    </div>`).join('');
}

// ── Modal ajuste livre ────────────────────────────────────────────
function openModalAjuste() {
  document.getElementById('fields-livre').classList.remove('hidden');
  document.getElementById('fields-fixo').classList.add('hidden');
  document.getElementById('aj-grade-id').value           = '';
  document.getElementById('aj-deposito-id-fixed').value  = '';
  document.getElementById('aj-quantidade').value         = '';
  document.getElementById('aj-operacao').value           = 'entrada';
  document.getElementById('modal-ajuste-title').textContent = 'Ajustar Estoque';
  Modal.open('modal-ajuste');
}

// ── Modal ajuste fixo (linha existente) ──────────────────────────
function openModalAjusteFixo(gradeId, depositoId) {
  const entry    = _estoque.find(e => e.grade_id === gradeId && e.deposito_id === depositoId);
  const produto  = entry?.grade?.produto?.nome ?? '';
  const volume   = entry?.grade?.volume ?? '';
  const deposito = entry?.deposito?.nome ?? '';

  document.getElementById('fields-livre').classList.add('hidden');
  document.getElementById('fields-fixo').classList.remove('hidden');
  document.getElementById('fixo-label').textContent         = `${produto} ${volume} — ${deposito}`;
  document.getElementById('aj-grade-id').value              = gradeId;
  document.getElementById('aj-deposito-id-fixed').value     = depositoId;
  document.getElementById('aj-quantidade').value            = '';
  document.getElementById('aj-operacao').value              = 'entrada';
  document.getElementById('modal-ajuste-title').textContent = 'Ajustar Estoque';
  Modal.open('modal-ajuste');
}

function closeModalAjuste() {
  Modal.close('modal-ajuste');
  document.getElementById('form-ajuste').reset();
}

async function onProdutoChange() {
  const produtoId = document.getElementById('aj-produto').value;
  const sel       = document.getElementById('aj-grade');
  sel.innerHTML   = `<option value="">Selecione…</option>`;
  if (!produtoId) return;

  try {
    const grades = await Api.get(`/produtos/${produtoId}/grades`);
    sel.innerHTML = `<option value="">Selecione…</option>`
      + grades.map(g => `<option value="${g.id}">${g.sku}</option>`).join('');
  } catch {
    showAlert('Erro ao carregar grades.', 'error');
  }
}

// ── Modal depósito ────────────────────────────────────────────────
function openModalDeposito() {
  Modal.open('modal-deposito');
}

function closeModalDeposito() {
  Modal.close('modal-deposito');
  document.getElementById('form-deposito').reset();
}

// ── Alert ─────────────────────────────────────────────────────────
function showAlert(msg, type) {
  const cls = type === 'success'
    ? 'bg-green-950 border border-green-800 text-green-300'
    : 'bg-red-950 border border-red-800 text-red-300';
  const el = document.getElementById('alert');
  el.innerHTML = `<div class="${cls} text-xs rounded-lg px-4 py-2.5">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ── Boot ──────────────────────────────────────────────────────────
init();

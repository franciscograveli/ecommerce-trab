// ── Modais ────────────────────────────────────────────────────────
Modal.build('modal-produto', {
  title: 'Novo Produto',
  width: 'max-w-md',
  content: `
    <form id="form-produto" class="flex flex-col gap-4">
      <input type="hidden" id="f-id">
      <div>
        <label class="${Modal.LABEL}">Nome *</label>
        <input type="text" id="f-nome" required class="${Modal.INPUT}">
      </div>
      <div>
        <label class="${Modal.LABEL}">Descrição</label>
        <textarea id="f-descricao" rows="3" class="${Modal.TEXTAREA}"></textarea>
      </div>
      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModalProduto()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-salvar-produto" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

Modal.build('modal-grades', {
  title: 'Grades',
  width: 'max-w-xl',
  content: `
    <div id="alert-grades" class="mb-3"></div>
    <div id="lista-grades" class="mb-5 space-y-2 max-h-52 overflow-y-auto"></div>
    <form id="form-grade" class="border-t border-gray-100 pt-4">
      <p class="${Modal.SECTION}">Adicionar Grade</p>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">SKU *</label>
          <input type="text" id="g-sku" required placeholder="ex.: PROD-001-AZ-P" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Cor</label>
          <input type="text" id="g-cor" placeholder="ex.: Azul" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Tamanho</label>
          <input type="text" id="g-tamanho" placeholder="ex.: P / M / G" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Voltagem</label>
          <input type="text" id="g-voltagem" placeholder="ex.: 110V / 220V" class="${Modal.INPUT}">
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" id="btn-add-grade" class="${Modal.BTN_PRIMARY}">Adicionar Grade</button>
      </div>
    </form>`,
});

Modal.build('modal-precos', {
  title: 'Preços',
  width: 'max-w-xl',
  content: `
    <div id="alert-precos" class="mb-3"></div>
    <div id="lista-precos" class="mb-5 space-y-2 max-h-48 overflow-y-auto"></div>
    <form id="form-preco" class="border-t border-gray-100 pt-4">
      <p class="${Modal.SECTION}">Definir / Atualizar Preço</p>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">Tabela de Preço *</label>
          <select id="p-tabela" class="${Modal.SELECT}">
            <option value="">Selecione…</option>
          </select>
        </div>
        <div>
          <label class="${Modal.LABEL}">Preço (R$) *</label>
          <input type="number" id="p-preco" min="0" step="0.01" placeholder="0,00" class="${Modal.INPUT}">
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" id="btn-salvar-preco" class="${Modal.BTN_PRIMARY}">Salvar Preço</button>
      </div>
    </form>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _produtos = [];
let _tabelas  = [];

// ── Submits ───────────────────────────────────────────────────────
document.getElementById('form-produto').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('f-id').value;
  const btn = document.getElementById('btn-salvar-produto');

  const body = {
    nome:      document.getElementById('f-nome').value.trim(),
    descricao: document.getElementById('f-descricao').value.trim() || null,
  };

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    if (id) {
      await Api.put(`/produtos/${id}`, body);
      showAlert('Produto atualizado com sucesso.', 'success');
    } else {
      await Api.post('/produtos', body);
      showAlert('Produto cadastrado com sucesso.', 'success');
    }
    closeModalProduto();
    _produtos = await Api.get('/produtos');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao salvar produto.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

document.getElementById('form-grade').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-add-grade');

  const body = {
    sku:      document.getElementById('g-sku').value.trim(),
    cor:      document.getElementById('g-cor').value.trim() || null,
    tamanho:  document.getElementById('g-tamanho').value.trim() || null,
    voltagem: document.getElementById('g-voltagem').value.trim() || null,
  };

  btn.disabled = true;
  btn.textContent = 'Adicionando…';

  try {
    await Api.post(`/produtos/${_gradeProdutoId}/grades`, body);
    document.getElementById('form-grade').reset();
    await renderGrades();
    _produtos = await Api.get('/produtos');
    renderTabela();
  } catch (err) {
    showInlineAlert('alert-grades', err.erro ?? 'Erro ao adicionar grade.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Adicionar Grade';
  }
});

document.getElementById('form-preco').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn      = document.getElementById('btn-salvar-preco');
  const tabelaId = document.getElementById('p-tabela').value;
  const preco    = document.getElementById('p-preco').value;

  if (!tabelaId) {
    showInlineAlert('alert-precos', 'Selecione uma tabela de preço.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    await Api.post(`/produtos/${_precoProdutoId}/precos`, {
      tabela_preco_id: parseInt(tabelaId),
      preco: parseFloat(preco),
    });
    document.getElementById('form-preco').reset();
    await renderPrecos();
  } catch (err) {
    showInlineAlert('alert-precos', err.erro ?? 'Erro ao salvar preço.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Preço';
  }
});

// ── Inicialização ────────────────────────────────────────────────
async function init() {
  try {
    const [produtos, tabelas] = await Promise.all([
      Api.get('/produtos'),
      Api.get('/produtos/tabelas'),
    ]);
    _produtos = produtos;
    _tabelas  = tabelas;

    const sel = document.getElementById('p-tabela');
    sel.innerHTML = '<option value="">Selecione…</option>'
      + tabelas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');

    renderTabela();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

// ── Tabela principal ─────────────────────────────────────────────
function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_produtos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-5 py-12 text-center text-brand-tan">
          Nenhum produto cadastrado ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _produtos.map(p => {
    const desc   = p.descricao ? p.descricao.substring(0, 60) + (p.descricao.length > 60 ? '…' : '') : '—';
    const grades = p.grades?.length ?? 0;
    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-cream font-medium">${p.nome}</td>
        <td class="px-5 py-3.5 text-brand-tan">${desc}</td>
        <td class="px-5 py-3.5 text-brand-tan">${grades}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-4">
            <button onclick="openModalGrades(${p.id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Grades">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="openModalPrecos(${p.id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Preços">
              <i data-lucide="tag" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="openModalProduto(${p.id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Editar">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="excluir(${p.id})"
              class="text-brand-tan hover:text-red-400 transition-colors" title="Excluir">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Modal Produto ─────────────────────────────────────────────────
function openModalProduto(id = null) {
  const p = id ? _produtos.find(x => x.id === id) : null;
  document.getElementById('modal-produto-title').textContent = p ? 'Editar Produto' : 'Novo Produto';
  document.getElementById('f-id').value        = p?.id ?? '';
  document.getElementById('f-nome').value      = p?.nome ?? '';
  document.getElementById('f-descricao').value = p?.descricao ?? '';
  Modal.open('modal-produto');
}

function closeModalProduto() {
  Modal.close('modal-produto');
  document.getElementById('form-produto').reset();
}

async function excluir(id) {
  const p = _produtos.find(x => x.id === id);
  if (!confirm(`Excluir "${p?.nome}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    await Api.del(`/produtos/${id}`);
    _produtos = _produtos.filter(x => x.id !== id);
    renderTabela();
    showAlert('Produto excluído com sucesso.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao excluir produto.', 'error');
  }
}

// ── Modal Grades ──────────────────────────────────────────────────
let _gradeProdutoId = null;

async function openModalGrades(produtoId) {
  _gradeProdutoId = produtoId;
  const p = _produtos.find(x => x.id === produtoId);
  document.getElementById('modal-grades-title').textContent = `Grades — ${p?.nome ?? ''}`;
  document.getElementById('form-grade').reset();
  document.getElementById('alert-grades').innerHTML = '';
  Modal.open('modal-grades');
  await renderGrades();
}

function closeModalGrades() {
  Modal.close('modal-grades');
  _gradeProdutoId = null;
}

async function renderGrades() {
  const lista = document.getElementById('lista-grades');
  lista.innerHTML = '<p class="text-gray-400 text-xs">Carregando…</p>';

  try {
    const grades = await Api.get(`/produtos/${_gradeProdutoId}/grades`);

    if (grades.length === 0) {
      lista.innerHTML = '<p class="text-gray-400 text-xs">Nenhuma grade cadastrada.</p>';
      return;
    }

    lista.innerHTML = grades.map(g => {
      const detalhes = [g.cor, g.tamanho, g.voltagem].filter(Boolean).join(' · ');
      return `
        <div class="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
          <div>
            <span class="text-gray-800 text-xs font-mono font-medium">${g.sku}</span>
            ${detalhes ? `<span class="text-gray-500 text-[11px] ml-2">${detalhes}</span>` : ''}
          </div>
          <button onclick="removerGrade(${g.id})"
            class="text-gray-400 hover:text-red-500 transition-colors ml-4" title="Remover">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch {
    lista.innerHTML = '<p class="text-red-500 text-xs">Erro ao carregar grades.</p>';
  }
}

async function removerGrade(gradeId) {
  if (!confirm('Remover esta grade?')) return;

  try {
    await Api.del(`/produtos/${_gradeProdutoId}/grades/${gradeId}`);
    await renderGrades();
    _produtos = await Api.get('/produtos');
    renderTabela();
  } catch (err) {
    showInlineAlert('alert-grades', err.erro ?? 'Erro ao remover grade.');
  }
}

// ── Modal Preços ──────────────────────────────────────────────────
let _precoProdutoId = null;

async function openModalPrecos(produtoId) {
  _precoProdutoId = produtoId;
  const p = _produtos.find(x => x.id === produtoId);
  document.getElementById('modal-precos-title').textContent = `Preços — ${p?.nome ?? ''}`;
  document.getElementById('form-preco').reset();
  document.getElementById('alert-precos').innerHTML = '';
  Modal.open('modal-precos');
  await renderPrecos();
}

function closeModalPrecos() {
  Modal.close('modal-precos');
  _precoProdutoId = null;
}

async function renderPrecos() {
  const lista = document.getElementById('lista-precos');
  lista.innerHTML = '<p class="text-gray-400 text-xs">Carregando…</p>';

  try {
    const precos = await Api.get(`/produtos/${_precoProdutoId}/precos`);

    if (precos.length === 0) {
      lista.innerHTML = '<p class="text-gray-400 text-xs">Nenhum preço definido.</p>';
      return;
    }

    lista.innerHTML = precos.map(pr => {
      const valor  = Number(pr.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const tabela = pr.tabela_preco?.nome ?? `Tabela #${pr.tabela_preco_id}`;
      return `
        <div class="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
          <span class="text-gray-600 text-xs">${tabela}</span>
          <span class="text-gray-800 text-xs font-semibold">${valor}</span>
        </div>`;
    }).join('');
  } catch {
    lista.innerHTML = '<p class="text-red-500 text-xs">Erro ao carregar preços.</p>';
  }
}

// ── Excluir ───────────────────────────────────────────────────────

// ── Alerts ────────────────────────────────────────────────────────
function showAlert(msg, type) {
  const cls = type === 'success'
    ? 'bg-green-950 border border-green-800 text-green-300'
    : 'bg-red-950 border border-red-800 text-red-300';
  const el = document.getElementById('alert');
  el.innerHTML = `<div class="${cls} text-xs rounded-lg px-4 py-2.5">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

function showInlineAlert(elementId, msg) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ── Boot ──────────────────────────────────────────────────────────
init();

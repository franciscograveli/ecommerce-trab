// ── Modais — Produto ──────────────────────────────────────────────
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

// ── Modais — Grades ───────────────────────────────────────────────
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
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" id="btn-add-grade" class="${Modal.BTN_PRIMARY}">Adicionar Grade</button>
      </div>
    </form>`,
});

// ── Modais — Preços ───────────────────────────────────────────────
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
          <input type="text" id="p-preco" class="${Modal.INPUT}">
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button type="submit" id="btn-salvar-preco" class="${Modal.BTN_PRIMARY}">Salvar Preço</button>
      </div>
    </form>`,
});

// ── Modais — Tabela de Preço ──────────────────────────────────────
Modal.build('modal-tabela', {
  title: 'Nova Tabela de Preço',
  width: 'max-w-md',
  content: `
    <form id="form-tabela" class="flex flex-col gap-4">
      <input type="hidden" id="t-id">
      <div>
        <label class="${Modal.LABEL}">Nome *</label>
        <input type="text" id="t-nome" required class="${Modal.INPUT}">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">Região</label>
          <input type="text" id="t-regiao" placeholder="Ex: Sudeste" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Volume Mínimo</label>
          <input type="number" id="t-volume" min="1" step="1" value="1" class="${Modal.INPUT}">
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModalTabela()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-salvar-tabela" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

// ── Máscaras ──────────────────────────────────────────────────────
Mask.currency(document.getElementById('p-preco'));

// ── Estado ────────────────────────────────────────────────────────
let _produtos = [];
let _tabelas  = [];

// ── Inicialização ─────────────────────────────────────────────────
async function init() {
  try {
    [_produtos, _tabelas] = await Promise.all([
      Api.get('/produtos'),
      Api.get('/produtos/tabelas'),
    ]);
    _preencherSelectTabelas();
    renderTabela();
    renderTabelas();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

// ── Tabela de produtos ────────────────────────────────────────────
function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_produtos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-5 py-12 text-center text-brand-tan">
      Nenhum produto cadastrado ainda.</td></tr>`;
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

// ── Tabela de preços ──────────────────────────────────────────────
function renderTabelas() {
  const tbody = document.getElementById('tbody-tabelas');

  if (_tabelas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-5 py-8 text-center text-brand-tan">
      Nenhuma tabela cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = _tabelas.map(t => `
    <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
      <td class="px-5 py-3.5 text-brand-cream font-medium">${t.nome}</td>
      <td class="px-5 py-3.5 text-brand-tan">${t.regiao ?? '—'}</td>
      <td class="px-5 py-3.5 text-brand-tan">${t.regra_volume_minimo ?? 1} un.</td>
      <td class="px-5 py-3.5">
        <div class="flex items-center justify-end gap-4">
          <button onclick="openModalTabela(${t.id})"
            class="text-brand-tan hover:text-brand-amber transition-colors" title="Editar">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="excluirTabela(${t.id}, '${t.nome.replace(/'/g, "\\'")}')"
            class="text-brand-tan hover:text-red-400 transition-colors" title="Excluir">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');

  if (window.lucide) lucide.createIcons();
}

function _preencherSelectTabelas() {
  const sel = document.getElementById('p-tabela');
  sel.innerHTML = '<option value="">Selecione…</option>'
    + _tabelas.map(t => `<option value="${t.id}">${t.nome}${t.regiao ? ' — ' + t.regiao : ''}</option>`).join('');
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
      const detalhes = [g.cor, g.tamanho].filter(Boolean).join(' · ');
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

document.getElementById('form-grade').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-add-grade');
  const body = {
    sku:      document.getElementById('g-sku').value.trim(),
    cor:      document.getElementById('g-cor').value.trim() || null,
    tamanho:  document.getElementById('g-tamanho').value.trim() || null,
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

    const formPreco = document.getElementById('form-preco');
    formPreco.classList.toggle('hidden', precos.length > 0);

    if (precos.length === 0) {
      lista.innerHTML = '<p class="text-gray-400 text-xs">Nenhum preço definido.</p>';
      return;
    }

    lista.innerHTML = precos.map(pr => {
      const valor  = Number(pr.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const tabela = pr.tabela_preco?.nome ?? `Tabela #${pr.tabela_preco_id}`;
      const regiao = pr.tabela_preco?.regiao ? ` — ${pr.tabela_preco.regiao}` : '';
      return `
        <div class="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
          <span class="text-gray-600 text-xs">${tabela}${regiao}</span>
          <div class="flex items-center gap-3">
            <span class="text-gray-800 text-xs font-semibold">${valor}</span>
            <button onclick="removerPreco(${pr.id})"
              class="text-gray-400 hover:text-red-500 transition-colors" title="Remover">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch {
    lista.innerHTML = '<p class="text-red-500 text-xs">Erro ao carregar preços.</p>';
  }
}

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
      preco:           Mask.parseCurrency(preco),
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

async function removerPreco(precoId) {
  if (!confirm('Remover este preço?')) return;
  try {
    await Api.del(`/produtos/${_precoProdutoId}/precos/${precoId}`);
    await renderPrecos();
  } catch (err) {
    showInlineAlert('alert-precos', err.erro ?? 'Erro ao remover preço.');
  }
}

// ── Modal Tabela de Preço ─────────────────────────────────────────
function openModalTabela(id = null) {
  const t = id ? _tabelas.find(x => x.id === id) : null;
  document.getElementById('modal-tabela-title').textContent = t ? 'Editar Tabela' : 'Nova Tabela de Preço';
  document.getElementById('t-id').value     = t?.id ?? '';
  document.getElementById('t-nome').value   = t?.nome ?? '';
  document.getElementById('t-regiao').value = t?.regiao ?? '';
  document.getElementById('t-volume').value = t?.regra_volume_minimo ?? 1;
  Modal.open('modal-tabela');
}

function closeModalTabela() {
  Modal.close('modal-tabela');
  document.getElementById('form-tabela').reset();
}

document.getElementById('form-tabela').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('t-id').value;
  const btn = document.getElementById('btn-salvar-tabela');
  const body = {
    nome:                document.getElementById('t-nome').value.trim(),
    regiao:              document.getElementById('t-regiao').value.trim() || null,
    regra_volume_minimo: parseInt(document.getElementById('t-volume').value) || 1,
  };

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    if (id) {
      await Api.put(`/produtos/tabelas/${id}`, body);
      showAlert('Tabela atualizada com sucesso.', 'success');
    } else {
      await Api.post('/produtos/tabelas', body);
      showAlert('Tabela criada com sucesso.', 'success');
    }
    closeModalTabela();
    _tabelas = await Api.get('/produtos/tabelas');
    _preencherSelectTabelas();
    renderTabelas();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao salvar tabela.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

async function excluirTabela(id, nome) {
  if (!confirm(`Excluir a tabela "${nome}"?\nOs preços vinculados a ela serão removidos.`)) return;
  try {
    await Api.del(`/produtos/tabelas/${id}`);
    _tabelas = _tabelas.filter(x => x.id !== id);
    _preencherSelectTabelas();
    renderTabelas();
    showAlert('Tabela excluída.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao excluir tabela.', 'error');
  }
}

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

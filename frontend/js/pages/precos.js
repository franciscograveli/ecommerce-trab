// ── Utilitários ───────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Modal ─────────────────────────────────────────────────────────
Modal.build('modal-tabela', {
  title: 'Nova Tabela de Preço',
  width: 'max-w-md',
  content: `
    <form id="form-tabela" class="flex flex-col gap-4">
      <input type="hidden" id="f-id">
      <div>
        <label class="${Modal.LABEL}">Nome *</label>
        <input type="text" id="f-nome" required placeholder="ex.: Varejo, Atacado A" class="${Modal.INPUT}">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">Região</label>
          <input type="text" id="f-regiao" placeholder="ex.: Sudeste" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Volume Mínimo</label>
          <input type="number" id="f-volume" min="1" step="1" value="1" class="${Modal.INPUT}">
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModal()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-salvar" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _tabelas = [];

// ── Submit ────────────────────────────────────────────────────────
document.getElementById('form-tabela').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('f-id').value;
  const btn = document.getElementById('btn-salvar');

  const body = {
    nome:                document.getElementById('f-nome').value.trim(),
    regiao:              document.getElementById('f-regiao').value.trim() || null,
    regra_volume_minimo: parseInt(document.getElementById('f-volume').value) || 1,
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
    closeModal();
    _tabelas = await Api.get('/produtos/tabelas');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao salvar tabela.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

// ── Inicialização ─────────────────────────────────────────────────
async function init() {
  try {
    _tabelas = await Api.get('/produtos/tabelas');
    renderTabela();
  } catch {
    showAlert('Erro ao carregar tabelas de preço.', 'error');
  }
}

// ── Tabela ────────────────────────────────────────────────────────
function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_tabelas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-5 py-12 text-center text-brand-tan">
          Nenhuma tabela de preço cadastrada ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _tabelas.map(t => `
    <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
      <td class="px-5 py-3.5 text-brand-cream font-medium">${escapeHtml(t.nome)}</td>
      <td class="px-5 py-3.5 text-brand-tan">${t.regiao ? escapeHtml(t.regiao) : '—'}</td>
      <td class="px-5 py-3.5 text-brand-tan">${t.regra_volume_minimo ?? 1} un.</td>
      <td class="px-5 py-3.5">
        <div class="flex items-center justify-end gap-4">
          <button onclick="openModal(${t.id})"
            class="text-brand-tan hover:text-brand-amber transition-colors" title="Editar">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="excluir(${t.id})"
            class="text-brand-tan hover:text-red-400 transition-colors" title="Excluir">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Modal ─────────────────────────────────────────────────────────
function openModal(id = null) {
  const t = id ? _tabelas.find(x => x.id === id) : null;
  document.getElementById('modal-tabela-title').textContent = t ? 'Editar Tabela' : 'Nova Tabela de Preço';
  document.getElementById('f-id').value     = t?.id ?? '';
  document.getElementById('f-nome').value   = t?.nome ?? '';
  document.getElementById('f-regiao').value = t?.regiao ?? '';
  document.getElementById('f-volume').value = t?.regra_volume_minimo ?? 1;
  Modal.open('modal-tabela');
}

function closeModal() {
  Modal.close('modal-tabela');
  document.getElementById('form-tabela').reset();
}

async function excluir(id) {
  const nome = _tabelas.find(x => x.id === id)?.nome ?? '';
  if (!confirm(`Excluir a tabela "${nome}"?\nOs preços vinculados a ela serão removidos.`)) return;
  try {
    await Api.del(`/produtos/tabelas/${id}`);
    _tabelas = _tabelas.filter(x => x.id !== id);
    renderTabela();
    showAlert('Tabela excluída.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao excluir tabela.', 'error');
  }
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

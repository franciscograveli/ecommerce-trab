let _tabelas = [];

// ── Inicialização ────────────────────────────────────────────────
async function init() {
  try {
    _tabelas = await Api.get('/produtos/tabelas');
    renderTabela();
  } catch {
    showAlert('Erro ao carregar tabelas de preço.', 'error');
  }
}

// ── Tabela ───────────────────────────────────────────────────────
function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_tabelas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="px-5 py-12 text-center text-brand-tan">
          Nenhuma tabela de preço cadastrada ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _tabelas.map(t => `
    <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
      <td class="px-5 py-3.5 text-brand-cream font-medium">${t.nome}</td>
      <td class="px-5 py-3.5 text-brand-tan">${t.regra_volume_minimo ?? 1}</td>
    </tr>`).join('');
}

// ── Modal ─────────────────────────────────────────────────────────
function openModal() {
  document.getElementById('modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('form-tabela').reset();
}

document.getElementById('form-tabela').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-salvar');

  const body = {
    nome:                 document.getElementById('f-nome').value.trim(),
    regra_volume_minimo:  parseInt(document.getElementById('f-volume').value) || 1,
  };

  btn.disabled = true;
  btn.textContent = 'Criando…';

  try {
    await Api.post('/produtos/tabelas', body);
    showAlert('Tabela criada com sucesso.', 'success');
    closeModal();
    _tabelas = await Api.get('/produtos/tabelas');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao criar tabela.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Tabela';
  }
});

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

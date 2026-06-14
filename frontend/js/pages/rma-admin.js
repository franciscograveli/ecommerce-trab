// ── Modais ────────────────────────────────────────────────────────

Modal.build('modal-rma-analise', {
  title: 'Análise de Solicitação RMA',
  width: 'max-w-lg',
  content: `
    <div id="rma-info" class="flex flex-col gap-4 text-xs">
      <input type="hidden" id="rma-id">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="${Modal.LABEL}">Solicitante</label>
          <p id="d-usuario" class="text-brand-cream font-medium"></p>
        </div>
        <div>
          <label class="${Modal.LABEL}">Cliente</label>
          <p id="d-cliente" class="text-brand-cream font-medium"></p>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="${Modal.LABEL}">Pedido</label>
          <p id="d-pedido" class="text-brand-tan font-mono"></p>
        </div>
        <div>
          <label class="${Modal.LABEL}">Tipo</label>
          <p id="d-tipo" class="text-brand-cream capitalize"></p>
        </div>
      </div>

      <div>
        <label class="${Modal.LABEL}">Motivo do Cliente</label>
        <div id="d-motivo" class="bg-brand-black/40 border border-brand-brown/30 rounded-lg p-3 text-brand-tan italic"></div>
      </div>

      <div class="border-t border-brand-brown/30 pt-4 mt-2">
        <label class="${Modal.LABEL}">Alterar Status para:</label>
        <div class="grid grid-cols-2 gap-2 mt-2" id="acoes-status">
          <!-- Botões de ação dinâmicos -->
        </div>
      </div>

      <div class="flex justify-end mt-4 pt-4 ${Modal.DIVIDER}">
        <button type="button" onclick="Modal.close('modal-rma-analise')" class="${Modal.BTN_CANCEL}">Fechar</button>
      </div>
    </div>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _rmas   = [];
let _filtro = '';

const STATUS_BADGE = {
  aberto:     'bg-blue-100 text-blue-700',
  em_analise: 'bg-yellow-100 text-yellow-700',
  aprovado:   'bg-green-100 text-green-700',
  rejeitado:  'bg-red-100 text-red-700',
  concluido:  'bg-emerald-100 text-emerald-700',
};

const STATUS_LABEL = {
  aberto:     'Aberto',
  em_analise: 'Em análise',
  aprovado:   'Aprovado',
  rejeitado:  'Rejeitado',
  concluido:  'Concluído',
};

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  try {
    _rmas = await Api.get('/rma');
    renderTabela();
  } catch {
    showAlert('Erro ao carregar solicitações.', 'error');
  }
}

// ── Filtro ────────────────────────────────────────────────────────
function filtrar(status) {
  _filtro = status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-ativo'));
  document.getElementById(`tab-${status}`).classList.add('tab-ativo');
  renderTabela();
}

// ── Render ────────────────────────────────────────────────────────
function renderTabela() {
  const lista = _filtro ? _rmas.filter(r => r.status === _filtro) : _rmas;
  const tbody = document.getElementById('tbody');

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-12 text-center text-brand-tan">Nenhuma solicitação pendente.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(r => {
    const data    = new Date(r.created_at).toLocaleDateString('pt-BR');
    const badge   = STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-500';
    const label   = STATUS_LABEL[r.status] || r.status;
    const cliente = r.pedido?.cliente?.razao_social ?? '—';

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-tan font-mono">#${r.id}</td>
        <td class="px-5 py-3.5">
          <div class="text-brand-cream font-medium">${cliente}</div>
          <div class="text-brand-tan text-[10px]">Pedido #${r.pedido_id}</div>
        </td>
        <td class="px-5 py-3.5 text-brand-cream capitalize">${r.tipo}</td>
        <td class="px-5 py-3.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${badge}">${label}</span>
        </td>
        <td class="px-5 py-3.5 text-brand-tan">${data}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end">
            <button onclick="openAnalise(${r.id})"
              class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-primary/20 text-brand-amber hover:bg-brand-primary/40 transition-colors">
              Analisar
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ── Ações ─────────────────────────────────────────────────────────
async function openAnalise(id) {
  try {
    const rma = await Api.get(`/rma/${id}`);
    
    document.getElementById('rma-id').value = rma.id;
    document.getElementById('d-usuario').textContent = rma.comprador?.usuario?.nome ?? '—';
    document.getElementById('d-cliente').textContent = rma.pedido?.cliente?.razao_social ?? '—';
    document.getElementById('d-pedido').textContent  = `#${rma.pedido_id}`;
    document.getElementById('d-tipo').textContent    = rma.tipo;
    document.getElementById('d-motivo').textContent  = rma.motivo;

    const divAcoes = document.getElementById('acoes-status');
    divAcoes.innerHTML = '';

    const transicoes = {
      aberto:     ['em_analise', 'rejeitado'],
      em_analise: ['aprovado', 'rejeitado'],
      aprovado:   ['concluido'],
    };

    const labels = {
      em_analise: ['Iniciar Análise', 'bg-yellow-600 hover:bg-yellow-500'],
      aprovado:   ['Aprovar',        'bg-green-700 hover:bg-green-600'],
      rejeitado:  ['Rejeitar',       'bg-red-700 hover:bg-red-600'],
      concluido:  ['Concluir (Gera Estoque)', 'bg-emerald-700 hover:bg-emerald-600'],
    };

    const proximos = transicoes[rma.status] ?? [];
    
    if (proximos.length === 0) {
      divAcoes.innerHTML = '<p class="text-brand-tan italic col-span-2">Nenhuma ação disponível para este status.</p>';
    } else {
      proximos.forEach(status => {
        const [label, cls] = labels[status];
        divAcoes.innerHTML += `
          <button onclick="atualizarStatus(${rma.id}, '${status}')"
            class="px-3 py-2 rounded-lg text-white text-[10px] font-bold uppercase transition-colors ${cls}">
            ${label}
          </button>`;
      });
    }

    Modal.open('modal-rma-analise');
  } catch {
    showAlert('Erro ao carregar detalhes.', 'error');
  }
}

async function atualizarStatus(id, novoStatus) {
  if (!confirm(`Deseja alterar o status para ${novoStatus}?`)) return;
  
  try {
    await Api.put(`/rma/${id}/status`, { status: novoStatus });
    showAlert('Status atualizado com sucesso.', 'success');
    Modal.close('modal-rma-analise');
    _rmas = await Api.get('/rma');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao atualizar status.', 'error');
  }
}

function showAlert(msg, type) {
  const cls = type === 'success' ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100';
  const el = document.getElementById('alert');
  el.innerHTML = `<div class="${cls} text-xs rounded-lg px-4 py-2.5 mb-4">${msg}</div>`;
  setTimeout(() => el.innerHTML = '', 4000);
}

init();

// ── Modais ────────────────────────────────────────────────────────

Modal.build('modal-rma-detalhes', {
  title: 'Detalhes da Devolução',
  width: 'max-w-md',
  content: `
    <div id="rma-info" class="flex flex-col gap-4 text-xs">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="${Modal.LABEL}">ID do RMA</label>
          <p id="d-id" class="text-gray-900 font-mono"></p>
        </div>
        <div>
          <label class="${Modal.LABEL}">Status</label>
          <p id="d-status" class="font-bold uppercase"></p>
        </div>
      </div>
      <div>
        <label class="${Modal.LABEL}">Pedido Relacionado</label>
        <p id="d-pedido" class="text-gray-900"></p>
      </div>
      <div>
        <label class="${Modal.LABEL}">Tipo</label>
        <p id="d-tipo" class="text-gray-900 capitalize"></p>
      </div>
      <div>
        <label class="${Modal.LABEL}">Motivo</label>
        <div id="d-motivo" class="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-700 italic"></div>
      </div>
      <div class="flex justify-end mt-4 pt-4 ${Modal.DIVIDER}">
        <button type="button" onclick="Modal.close('modal-rma-detalhes')" class="${Modal.BTN_CANCEL}">Fechar</button>
      </div>
    </div>`,
});

Modal.build('modal-novo-rma', {
  title: 'Nova Solicitação de Devolução/Troca',
  width: 'max-w-md',
  content: `
    <form id="form-rma" class="flex flex-col gap-4">
      <div>
        <label class="${Modal.LABEL}">Pedido Elegível *</label>
        <select id="f-pedido" required class="${Modal.SELECT}">
          <option value="">Selecione um pedido enviado/entregue…</option>
        </select>
        <p class="text-[10px] text-gray-400 mt-1">Apenas pedidos enviados ou entregues podem ser devolvidos.</p>
      </div>
      
      <div>
        <label class="${Modal.LABEL}">Tipo de Solicitação *</label>
        <select id="f-tipo" required class="${Modal.SELECT}">
          <option value="devolucao">Devolução (Estorno/Crédito)</option>
          <option value="troca">Troca (Substituição de Produto)</option>
        </select>
      </div>

      <div>
        <label class="${Modal.LABEL}">Motivo detalhado *</label>
        <textarea id="f-motivo" required class="${Modal.INPUT} min-h-[100px]" placeholder="Descreva o motivo da devolução ou troca..."></textarea>
      </div>

      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="Modal.close('modal-novo-rma')" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-salvar-rma" class="${Modal.BTN_PRIMARY}">Enviar Solicitação</button>
      </div>
    </form>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _rmas   = [];
let _pedidosElegiveis = [];
let _filtro = '';
const _usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  try {
    const [rmas, pedidos] = await Promise.all([
      Api.get('/rma'),
      Api.get('/pedidos')
    ]);
    
    _rmas = rmas;
    
    // Filtra pedidos elegíveis: Enviados/Entregues que NÃO possuem RMA ativo ou concluído
    const idsComRmaAtivo = new Set(rmas.filter(r => r.status !== 'rejeitado').map(r => r.pedido_id));
    _pedidosElegiveis = pedidos.filter(p => 
      ['enviado', 'entregue'].includes(p.status) && !idsComRmaAtivo.has(p.id)
    );
    
    renderTabela();
    _preencherSelectPedidos();
    
    // Se vier pedido_id via URL (atalho da tela de pedidos)
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('pedido_id');
    if (pedidoId) {
      openModalNovoRMA(pedidoId);
      // Limpa URL para não reabrir ao dar F5
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch {
    showAlert('Erro ao carregar devoluções.', 'error');
  }
}

function _preencherSelectPedidos() {
  const sel = document.getElementById('f-pedido');
  if (!sel) return;
  
  sel.innerHTML = '<option value="">Selecione um pedido enviado/entregue…</option>' +
    _pedidosElegiveis.map(p => {
      const valor = Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const data = new Date(p.created_at).toLocaleDateString('pt-BR');
      return `<option value="${p.id}">Pedido #${p.id} — ${valor} (${data})</option>`;
    }).join('');
}

function openModalNovoRMA(pedidoId = null) {
  document.getElementById('form-rma').reset();
  if (pedidoId) {
    document.getElementById('f-pedido').value = pedidoId;
  }
  Modal.open('modal-novo-rma');
}

document.getElementById('form-rma').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-salvar-rma');
  
  const pedidoId = parseInt(document.getElementById('f-pedido').value);
  const pedido   = _pedidosElegiveis.find(p => p.id === pedidoId);

  const body = {
    pedido_id:    pedidoId,
    tipo:         document.getElementById('f-tipo').value,
    motivo:       document.getElementById('f-motivo').value,
    comprador_id: pedido?.comprador_id || _usuario.comprador?.id
  };

  btn.disabled = true;
  btn.textContent = 'Enviando…';
  
  try {
    await Api.post('/rma', body);
    Modal.close('modal-novo-rma');
    _rmas = await Api.get('/rma');
    renderTabela();
    showAlert('Solicitação de RMA enviada com sucesso.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao enviar solicitação.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar Solicitação';
  }
});

// ── Filtro de status ──────────────────────────────────────────────
function filtrar(status) {
  _filtro = status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-ativo'));
  document.getElementById(`tab-${status}`).classList.add('tab-ativo');
  renderTabela();
}

// ── Badges de status ──────────────────────────────────────────────
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

// ── Render principal ──────────────────────────────────────────────
function renderTabela() {
  const lista = _filtro
    ? _rmas.filter(r => r.status === _filtro)
    : _rmas;

  const tbody = document.getElementById('tbody');

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-12 text-center text-brand-tan">Nenhuma solicitação encontrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(r => {
    const data  = r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '—';
    const badge = STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-500';
    const label = STATUS_LABEL[r.status] ?? r.status;

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-tan font-mono">#${r.id}</td>
        <td class="px-5 py-3.5 text-brand-cream font-medium">Pedido #${r.pedido_id}</td>
        <td class="px-5 py-3.5 text-brand-cream capitalize">${r.tipo}</td>
        <td class="px-5 py-3.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${badge}">${label}</span>
        </td>
        <td class="px-5 py-3.5 text-brand-tan">${data}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-2">
            <button onclick="openDetalhes(${r.id})"
              class="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-brand-brown/30 text-brand-tan hover:bg-brand-brown/60 transition-colors">
              Ver Detalhes
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Detalhes ──────────────────────────────────────────────────────
async function openDetalhes(id) {
  try {
    const rma = await Api.get(`/rma/${id}`);
    
    document.getElementById('d-id').textContent = `#${rma.id}`;
    document.getElementById('d-status').textContent = STATUS_LABEL[rma.status] ?? rma.status;
    document.getElementById('d-status').className = `font-bold uppercase ${STATUS_BADGE[rma.status]?.split(' ')[1] || 'text-gray-500'}`;
    document.getElementById('d-pedido').textContent = `Pedido #${rma.pedido_id} (${rma.pedido?.cliente?.razao_social ?? '—'})`;
    document.getElementById('d-tipo').textContent = rma.tipo;
    document.getElementById('d-motivo').textContent = rma.motivo || 'Nenhum motivo informado.';

    Modal.open('modal-rma-detalhes');
  } catch (err) {
    showAlert('Erro ao carregar detalhes.', 'error');
  }
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

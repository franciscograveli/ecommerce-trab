let _expedicoes = [];
let _filtro     = '';

const STATUS_LABEL = {
  picking_pendente:  ['Picking Pendente', 'bg-yellow-900/60 text-yellow-300'],
  picking_concluido: ['Picking OK',       'bg-blue-900/60 text-blue-300'],
  packing:           ['Packing',          'bg-indigo-900/60 text-indigo-300'],
  pronto_envio:      ['Pronto p/ Envio',  'bg-brand-primary/20 text-brand-amber'],
  em_transito:       ['Em Trânsito',      'bg-emerald-900/60 text-emerald-300'],
};

async function init() {
  try {
    const [expedicoes, pedidos] = await Promise.all([
      Api.get('/expedicao'),
      Api.get('/pedidos'),
    ]);
    _expedicoes = expedicoes;

    // Pedidos aprovados sem expedição
    const idsComExp = new Set(expedicoes.map(e => e.pedido_id));
    const aprovados = pedidos.filter(p => p.status === 'aprovado' && !idsComExp.has(p.id));
    const sel = document.getElementById('nova-pedido');
    sel.innerHTML = `<option value="">Selecione…</option>`
      + aprovados.map(p => {
          const empresa = p.cliente?.razao_social ?? `Pedido #${p.id}`;
          const valor   = Number(p.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          return `<option value="${p.id}">#${p.id} — ${empresa} (${valor})</option>`;
        }).join('');

    renderTabela();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

function setFiltro(status) {
  _filtro = status;
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.toggle('filtro-ativo', btn.dataset.f === status);
  });
  renderTabela();
}

function renderTabela() {
  const tbody = document.getElementById('tbody');
  const lista = _filtro
    ? _expedicoes.filter(e => e.status_logistica === _filtro)
    : _expedicoes;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-5 py-12 text-center text-brand-tan">
          Nenhuma expedição encontrada.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(e => {
    const empresa      = e.pedido?.cliente?.razao_social ?? '—';
    const [label, cls] = STATUS_LABEL[e.status_logistica] || ['—', 'bg-brand-brown text-brand-tan'];
    const transp       = e.transportadora ?? '—';
    const rastreio     = e.codigo_rastreio ?? '—';

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-tan font-mono">#${e.pedido_id}</td>
        <td class="px-5 py-3.5 text-brand-cream font-medium">${empresa}</td>
        <td class="px-5 py-3.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}">
            ${label}
          </span>
        </td>
        <td class="px-5 py-3.5 text-brand-tan">${transp}</td>
        <td class="px-5 py-3.5 text-brand-tan font-mono">${rastreio}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end">
            <button onclick="openModalExp(${e.id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Editar">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Modal atualizar expedição ────────────────────────────────
function openModalExp(id) {
  const e = _expedicoes.find(x => x.id === id);
  document.getElementById('exp-id').value             = id;
  document.getElementById('exp-status').value         = e?.status_logistica ?? 'picking_pendente';
  document.getElementById('exp-transportadora').value = e?.transportadora ?? '';
  document.getElementById('exp-rastreio').value       = e?.codigo_rastreio ?? '';
  document.getElementById('exp-frete').value          = e?.valor_frete ?? '';
  document.getElementById('bol-linha').value          = '';
  document.getElementById('bol-url').value            = '';
  document.getElementById('bol-vencimento').value     = '';
  document.getElementById('modal-exp').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeModalExp() {
  document.getElementById('modal-exp').classList.add('hidden');
}

document.getElementById('form-exp').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('exp-id').value;
  const btn = document.getElementById('btn-exp');

  const body = {
    status_logistica: document.getElementById('exp-status').value,
    transportadora:   document.getElementById('exp-transportadora').value.trim() || null,
    codigo_rastreio:  document.getElementById('exp-rastreio').value.trim() || null,
    valor_frete:      parseFloat(document.getElementById('exp-frete').value) || null,
  };

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    await Api.put(`/expedicao/${id}`, body);
    showAlert('Expedição atualizada.', 'success');
    closeModalExp();
    _expedicoes = await Api.get('/expedicao');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao atualizar expedição.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

async function emitirBoleto() {
  const id      = document.getElementById('exp-id').value;
  const linha   = document.getElementById('bol-linha').value.trim();
  const url     = document.getElementById('bol-url').value.trim();
  const venc    = document.getElementById('bol-vencimento').value;

  if (!linha || !url || !venc) {
    showAlert('Preencha linha digitável, URL e vencimento.', 'error');
    return;
  }

  try {
    await Api.post(`/expedicao/${id}/boleto`, {
      linha_digitavel:  linha,
      url_pdf:          url,
      data_vencimento:  venc,
    });
    showAlert('Boleto emitido com sucesso.', 'success');
    document.getElementById('bol-linha').value      = '';
    document.getElementById('bol-url').value        = '';
    document.getElementById('bol-vencimento').value = '';
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao emitir boleto.', 'error');
  }
}

// ── Modal nova expedição ─────────────────────────────────────
function openModalNovaExp() {
  document.getElementById('modal-nova').classList.remove('hidden');
}

function closeModalNovaExp() {
  document.getElementById('modal-nova').classList.add('hidden');
  document.getElementById('form-nova').reset();
}

document.getElementById('form-nova').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = document.getElementById('btn-nova');
  const body = {
    pedido_id:      parseInt(document.getElementById('nova-pedido').value),
    transportadora: document.getElementById('nova-transportadora').value.trim() || null,
  };

  btn.disabled = true;
  btn.textContent = 'Criando…';

  try {
    await Api.post('/expedicao', body);
    showAlert('Expedição criada com sucesso.', 'success');
    closeModalNovaExp();
    _expedicoes = await Api.get('/expedicao');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao criar expedição.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar';
  }
});

function showAlert(msg, type) {
  const cls = type === 'success'
    ? 'bg-green-950 border border-green-800 text-green-300'
    : 'bg-red-950 border border-red-800 text-red-300';
  const el = document.getElementById('alert');
  el.innerHTML = `<div class="${cls} text-xs rounded-lg px-4 py-2.5">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

init();

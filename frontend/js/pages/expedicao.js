// ── Modais ────────────────────────────────────────────────────────
Modal.build('modal-exp', {
  title: 'Atualizar Expedição',
  width: 'max-w-lg',
  content: `
    <form id="form-exp" class="flex flex-col gap-4">
      <input type="hidden" id="exp-id">

      <div>
        <label class="${Modal.LABEL}">Status Logístico</label>
        <select id="exp-status" class="${Modal.SELECT}">
          <option value="picking_pendente">Picking Pendente</option>
          <option value="picking_concluido">Picking Concluído</option>
          <option value="packing">Packing</option>
          <option value="pronto_envio">Pronto para Envio</option>
          <option value="em_transito">Em Trânsito</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">Transportadora</label>
          <input type="text" id="exp-transportadora" placeholder="Ex: Correios" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Código de Rastreio</label>
          <input type="text" id="exp-rastreio" placeholder="AA000000000BR" class="${Modal.INPUT}">
        </div>
      </div>

      <div>
        <label class="${Modal.LABEL}">Valor do Frete (R$)</label>
        <input type="text" id="exp-frete" class="${Modal.INPUT}">
      </div>

      <div id="section-boleto" class="border-t border-gray-100 pt-4">
        <p class="${Modal.SECTION}">Emitir Boleto</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="${Modal.LABEL}">Linha Digitável</label>
            <input type="text" id="bol-linha" class="${Modal.INPUT}">
          </div>
          <div>
            <label class="${Modal.LABEL}">URL PDF</label>
            <input type="url" id="bol-url" class="${Modal.INPUT}">
          </div>
          <div>
            <label class="${Modal.LABEL}">Vencimento</label>
            <input type="date" id="bol-vencimento" class="${Modal.INPUT}">
          </div>
        </div>
        <button type="button" onclick="emitirBoleto()"
          class="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-amber hover:text-brand-gold transition-colors">
          <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
          Emitir boleto
        </button>
      </div>

      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModalExp()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-exp" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

Modal.build('modal-nova', {
  title: 'Nova Expedição',
  width: 'max-w-sm',
  content: `
    <form id="form-nova" class="flex flex-col gap-4">
      <div>
        <label class="${Modal.LABEL}">Pedido aprovado *</label>
        <select id="nova-pedido" required class="${Modal.SELECT}">
          <option value="">Selecione…</option>
        </select>
      </div>
      <div>
        <label class="${Modal.LABEL}">Transportadora</label>
        <input type="text" id="nova-transportadora" class="${Modal.INPUT}">
      </div>
      <div class="flex justify-end gap-3 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModalNovaExp()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-nova" class="${Modal.BTN_PRIMARY}">Criar</button>
      </div>
    </form>`,
});

// ── Máscaras ──────────────────────────────────────────────────────
Mask.currency(document.getElementById('exp-frete'));
Mask.boletoLine(document.getElementById('bol-linha'));

// ── Estado ────────────────────────────────────────────────────────
let _expedicoes = [];
let _filtro     = '';

const STATUS_LABEL = {
  picking_pendente:  ['Picking Pendente', 'bg-yellow-900/60 text-yellow-300'],
  picking_concluido: ['Picking OK',       'bg-blue-900/60 text-blue-300'],
  packing:           ['Packing',          'bg-indigo-900/60 text-indigo-300'],
  pronto_envio:      ['Pronto p/ Envio',  'bg-brand-primary/20 text-brand-amber'],
  em_transito:       ['Em Trânsito',      'bg-emerald-900/60 text-emerald-300'],
};

// ── Submits ───────────────────────────────────────────────────────
document.getElementById('form-exp').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('exp-id').value;
  const btn = document.getElementById('btn-exp');

  const body = {
    status_logistica: document.getElementById('exp-status').value,
    transportadora:   document.getElementById('exp-transportadora').value.trim() || null,
    codigo_rastreio:  document.getElementById('exp-rastreio').value.trim() || null,
    valor_frete:      Mask.parseCurrency(document.getElementById('exp-frete').value),
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

// ── Inicialização ────────────────────────────────────────────────
async function init() {
  try {
    const [expedicoes, pedidos] = await Promise.all([
      Api.get('/expedicao'),
      Api.get('/pedidos'),
    ]);
    _expedicoes = expedicoes;

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

// ── Tabela ────────────────────────────────────────────────────────
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

// ── Modal expedição ───────────────────────────────────────────────
function openModalExp(id) {
  const e = _expedicoes.find(x => x.id === id);
  document.getElementById('exp-id').value             = id;
  document.getElementById('exp-status').value         = e?.status_logistica ?? 'picking_pendente';
  document.getElementById('exp-transportadora').value = e?.transportadora ?? '';
  document.getElementById('exp-rastreio').value       = e?.codigo_rastreio ?? '';
  Mask.setCurrency(document.getElementById('exp-frete'), e?.valor_frete ?? '');
  document.getElementById('bol-linha').value          = '';
  document.getElementById('bol-url').value            = '';
  document.getElementById('bol-vencimento').value     = '';
  Modal.open('modal-exp');
}

function closeModalExp() {
  Modal.close('modal-exp');
}

async function emitirBoleto() {
  const id    = document.getElementById('exp-id').value;
  const linha = document.getElementById('bol-linha').value.trim();
  const url   = document.getElementById('bol-url').value.trim();
  const venc  = document.getElementById('bol-vencimento').value;

  if (!linha || !url || !venc) {
    showAlert('Preencha linha digitável, URL e vencimento.', 'error');
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (new Date(venc + 'T00:00:00') <= hoje) {
    showAlert('Data de vencimento deve ser no futuro.', 'error');
    return;
  }

  try {
    await Api.post(`/expedicao/${id}/boleto`, {
      linha_digitavel: linha,
      url_pdf:         url,
      data_vencimento: venc,
    });
    showAlert('Boleto emitido com sucesso.', 'success');
    document.getElementById('bol-linha').value      = '';
    document.getElementById('bol-url').value        = '';
    document.getElementById('bol-vencimento').value = '';
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao emitir boleto.', 'error');
  }
}

// ── Modal nova expedição ──────────────────────────────────────────
function openModalNovaExp() {
  Modal.open('modal-nova');
}

function closeModalNovaExp() {
  Modal.close('modal-nova');
  document.getElementById('form-nova').reset();
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

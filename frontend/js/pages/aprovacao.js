let _pedidos  = [];
let _empresas = [];

async function init() {
  try {
    const [pedidos, empresas] = await Promise.all([
      Api.get('/pedidos'),
      Api.get('/empresas'),
    ]);
    _pedidos  = pedidos.filter(p => ['aguardando_aprovacao_credito', 'aguardando_estoque'].includes(p.status));
    _empresas = empresas;

    document.getElementById('stat-count').textContent = _pedidos.length;
    renderTabela();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_pedidos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-5 py-12 text-center text-brand-tan">
          Nenhum pedido aguardando aprovação.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _pedidos.map(p => {
    const empresa = _empresas.find(e => e.id === p.cliente_id);
    const razao   = empresa?.razao_social ?? p.cliente?.razao_social ?? '—';
    const limite  = Number(empresa?.limite_credito ?? 0)
      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valor   = Number(p.valor_total)
      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const data    = p.created_at
      ? new Date(p.created_at).toLocaleDateString('pt-BR')
      : '—';
    const motivo  = p.status === 'aguardando_estoque'
      ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-900/60 text-orange-300">Estoque</span>'
      : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-900/60 text-yellow-300">Crédito</span>';

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-tan font-mono">#${p.id}</td>
        <td class="px-5 py-3.5 text-brand-cream font-medium">${razao}</td>
        <td class="px-5 py-3.5 text-brand-tan">${motivo}</td>
        <td class="px-5 py-3.5 font-semibold text-brand-cream">${valor}</td>
        <td class="px-5 py-3.5 text-brand-tan">${limite}</td>
        <td class="px-5 py-3.5 text-brand-tan">${data}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-3">
            <button onclick="aprovar(${p.id})"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                     bg-green-950 text-green-300 hover:bg-green-900 transition-colors">
              <i data-lucide="check" class="w-3 h-3"></i> Aprovar
            </button>
            <button onclick="rejeitar(${p.id})"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                     bg-red-950 text-red-400 hover:bg-red-900 transition-colors">
              <i data-lucide="x" class="w-3 h-3"></i> Rejeitar
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

async function aprovar(id) {
  if (!confirm('Aprovar este pedido?')) return;
  await atualizarStatus(id, 'aprovado', 'Pedido aprovado com sucesso.');
}

async function rejeitar(id) {
  if (!confirm('Rejeitar e cancelar este pedido?')) return;
  await atualizarStatus(id, 'cancelado', 'Pedido rejeitado.');
}

async function atualizarStatus(id, status, msg) {
  try {
    await Api.put(`/pedidos/${id}`, { status });
    _pedidos = _pedidos.filter(p => p.id !== id);
    document.getElementById('stat-count').textContent = _pedidos.length;
    renderTabela();
    showAlert(msg, 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao atualizar pedido.', 'error');
  }
}

function showAlert(msg, type) {
  const cls = type === 'success'
    ? 'bg-green-950 border border-green-800 text-green-300'
    : 'bg-red-950 border border-red-800 text-red-300';
  const el = document.getElementById('alert');
  el.innerHTML = `<div class="${cls} text-xs rounded-lg px-4 py-2.5">${msg}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

init();

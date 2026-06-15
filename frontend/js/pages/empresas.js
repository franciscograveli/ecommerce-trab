// ── Modal ─────────────────────────────────────────────────────────
Modal.build('modal-empresa', {
  title: 'Nova Empresa',
  width: 'max-w-lg',
  content: `
    <form id="form-empresa" class="flex flex-col gap-4">
      <input type="hidden" id="f-id">

      <div>
        <label class="${Modal.LABEL}">Razão Social *</label>
        <input type="text" id="f-razao" required class="${Modal.INPUT}">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="${Modal.LABEL}">CNPJ *</label>
          <input type="text" id="f-cnpj" required placeholder="00.000.000/0001-00" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Inscrição Estadual</label>
          <input type="text" id="f-ie" class="${Modal.INPUT}">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label id="f-limite-label" class="${Modal.LABEL}">Limite de Crédito (R$)</label>
          <input type="number" id="f-limite" min="0" step="0.01" placeholder="0,00" class="${Modal.INPUT}">
        </div>
        <div>
          <label class="${Modal.LABEL}">Representante</label>
          <select id="f-rep" class="${Modal.SELECT}">
            <option value="">Sem representante</option>
          </select>
        </div>
      </div>

      <div id="row-proposta" class="hidden bg-yellow-950/60 border border-yellow-800/60 rounded-lg px-4 py-3">
        <p class="text-yellow-300 text-[11px] font-semibold uppercase tracking-wider mb-1">Proposta do representante</p>
        <div class="flex items-center justify-between">
          <span id="val-proposta" class="text-yellow-200 text-xs font-mono"></span>
          <button type="button" onclick="usarProposta()"
            class="text-yellow-300 hover:text-yellow-100 text-[11px] font-medium transition-colors">
            Usar este valor
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-2 pt-2 ${Modal.DIVIDER}">
        <button type="button" onclick="closeModal()" class="${Modal.BTN_CANCEL}">Cancelar</button>
        <button type="submit" id="btn-salvar" class="${Modal.BTN_PRIMARY}">Salvar</button>
      </div>
    </form>`,
});

// ── Estado ────────────────────────────────────────────────────────
let _empresas = [];
let _isRep    = false;

// ── Máscara CNPJ ─────────────────────────────────────────────────
document.getElementById('f-cnpj').addEventListener('input', (ev) => {
  let v = ev.target.value.replace(/\D/g, '').slice(0, 14);
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/,    '$1.$2.$3/$4');
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/,            '$1.$2.$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/,                   '$1.$2');
  ev.target.value = v;
});

// ── Submit ────────────────────────────────────────────────────────
document.getElementById('form-empresa').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('f-id').value;
  const btn = document.getElementById('btn-salvar');
  const rawVal = document.getElementById('f-limite').value;
  const val    = rawVal === '' ? null : (parseFloat(rawVal) || 0);

  const body = {
    razao_social:       document.getElementById('f-razao').value.trim(),
    cnpj:               document.getElementById('f-cnpj').value.trim(),
    inscricao_estadual: document.getElementById('f-ie').value.trim() || null,
    representante_id:   document.getElementById('f-rep').value || null,
  };

  if (_isRep) {
    // Vazio ou zero não conta como proposta
    body.limite_credito_proposto = val && val > 0 ? val : null;
  } else {
    body.limite_credito = val ?? 0;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    if (id) {
      await Api.put(`/empresas/${id}`, body);
      showAlert('Empresa atualizada com sucesso.', 'success');
    } else {
      await Api.post('/empresas', body);
      showAlert('Empresa cadastrada com sucesso.', 'success');
    }
    closeModal();
    _empresas = await Api.get('/empresas');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao salvar empresa.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

// ── Inicialização ────────────────────────────────────────────────
async function init() {
  const _usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const perfil   = (_usuario.perfil?.nome ?? _usuario.perfil ?? '').toLowerCase();
  _isRep = perfil === 'representante';

  if (_isRep) {
    document.getElementById('f-limite-label').textContent = 'Limite Proposto (R$)';
  }

  try {
    const [rEmpresa, rUsuarios] = await Promise.allSettled([
      Api.get('/empresas'),
      _isRep ? Promise.resolve([]) : Api.get('/usuarios'),
    ]);

    _empresas = rEmpresa.status === 'fulfilled' ? rEmpresa.value : [];

    const sel = document.getElementById('f-rep');
    if (_isRep) {
      sel.innerHTML = `<option value="${_usuario.representante?.id ?? ''}">${_usuario.nome}</option>`;
      sel.disabled  = true;
    } else {
      const usuarios = rUsuarios.status === 'fulfilled' ? rUsuarios.value : [];
      const reps     = usuarios.filter(u => u.perfil?.nome === 'representante' && u.representante);
      sel.innerHTML  = `<option value="">Sem representante</option>`
        + reps.map(u => `<option value="${u.representante.id}">${u.nome}</option>`).join('');
    }

    renderTabela();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

// ── Tabela ────────────────────────────────────────────────────────
function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_empresas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-5 py-12 text-center text-brand-tan">
          Nenhuma empresa cadastrada ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _empresas.map(e => {
    const rep          = e.representante?.usuario?.nome ?? '—';
    const temProposta  = e.limite_credito_proposto != null;
    const valorExibido = temProposta ? e.limite_credito_proposto : e.limite_credito;
    const limite       = Number(valorExibido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const badge        = temProposta
      ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-900/60 text-yellow-300" title="Proposta pendente de aprovação">proposta</span>`
      : '';
    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-cream font-medium">${e.razao_social}</td>
        <td class="px-5 py-3.5 text-brand-tan font-mono">${e.cnpj}</td>
        <td class="px-5 py-3.5 text-brand-cream">${limite}${badge}</td>
        <td class="px-5 py-3.5 text-brand-tan">${rep}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-4">
            <button onclick="openModal(${e.id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Editar">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="excluir(${e.id})"
              class="text-brand-tan hover:text-red-400 transition-colors" title="Excluir">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Abrir / fechar modal ──────────────────────────────────────────
function openModal(id = null) {
  const e = id ? _empresas.find(x => x.id === id) : null;

  document.getElementById('modal-empresa-title').textContent = e ? 'Editar Empresa' : 'Nova Empresa';
  document.getElementById('f-id').value    = e?.id ?? '';
  document.getElementById('f-razao').value = e?.razao_social ?? '';
  document.getElementById('f-cnpj').value  = e?.cnpj ?? '';
  document.getElementById('f-ie').value    = e?.inscricao_estadual ?? '';
  document.getElementById('f-rep').value   = e?.representante_id ?? '';

  if (_isRep) {
    document.getElementById('f-limite').value = e?.limite_credito_proposto ?? '';
    document.getElementById('row-proposta').classList.add('hidden');
  } else {
    document.getElementById('f-limite').value = e?.limite_credito ?? '';
    const proposto = e?.limite_credito_proposto;
    const rowProposta = document.getElementById('row-proposta');
    if (proposto != null) {
      const fmt = Number(proposto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      document.getElementById('val-proposta').textContent = fmt;
      rowProposta.classList.remove('hidden');
    } else {
      rowProposta.classList.add('hidden');
    }
  }

  Modal.open('modal-empresa');
}

function closeModal() {
  Modal.close('modal-empresa');
  document.getElementById('form-empresa').reset();
  document.getElementById('row-proposta').classList.add('hidden');
}

function usarProposta() {
  const id = document.getElementById('f-id').value;
  const e  = _empresas.find(x => x.id === Number(id));
  if (e?.limite_credito_proposto != null) {
    document.getElementById('f-limite').value = e.limite_credito_proposto;
  }
}

// ── Excluir ───────────────────────────────────────────────────────
async function excluir(id) {
  const e = _empresas.find(x => x.id === id);
  if (!confirm(`Excluir "${e?.razao_social}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    await Api.del(`/empresas/${id}`);
    _empresas = _empresas.filter(x => x.id !== id);
    renderTabela();
    showAlert('Empresa excluída com sucesso.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao excluir empresa.', 'error');
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

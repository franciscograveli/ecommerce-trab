let _usuarios = [];
let _empresas  = [];

const PERFIL_BADGE = {
  admin:          'bg-brand-primary/20 text-brand-amber',
  representante:  'bg-blue-900/60 text-blue-300',
  comprador:      'bg-emerald-900/60 text-emerald-300',
};

async function init() {
  try {
    const [usuarios, empresas] = await Promise.all([
      Api.get('/usuarios'),
      Api.get('/empresas'),
    ]);
    _usuarios = usuarios;
    _empresas = empresas;

    const sel = document.getElementById('f-empresa');
    sel.innerHTML = `<option value="">Selecione…</option>`
      + empresas.map(e => `<option value="${e.id}">${e.razao_social}</option>`).join('');

    renderTabela();
  } catch {
    showAlert('Erro ao carregar dados.', 'error');
  }
}

function renderTabela() {
  const tbody = document.getElementById('tbody');

  if (_usuarios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-5 py-12 text-center text-brand-tan">
          Nenhum usuário cadastrado ainda.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _usuarios.map(u => {
    const perfilNome = u.perfil?.nome ?? '—';
    const badgeCls   = PERFIL_BADGE[perfilNome] ?? 'bg-brand-brown/40 text-brand-tan';

    let info = '—';
    if (perfilNome === 'representante' && u.representante) {
      info = `${Number(u.representante.percentual_comissao).toFixed(2)}% comissão`;
    } else if (perfilNome === 'comprador' && u.comprador) {
      const emp = _empresas.find(e => e.id === u.comprador.cliente_id);
      info = emp?.razao_social ?? `Empresa #${u.comprador.cliente_id}`;
    }

    return `
      <tr class="border-b border-brand-brown last:border-0 hover:bg-brand-brown/20 transition-colors">
        <td class="px-5 py-3.5 text-brand-cream font-medium">${u.nome}</td>
        <td class="px-5 py-3.5 text-brand-tan font-mono">${u.email}</td>
        <td class="px-5 py-3.5">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${badgeCls}">
            ${perfilNome}
          </span>
        </td>
        <td class="px-5 py-3.5 text-brand-tan">${info}</td>
        <td class="px-5 py-3.5">
          <div class="flex items-center justify-end gap-4">
            <button onclick="openModal(${u.id})"
              class="text-brand-tan hover:text-brand-amber transition-colors" title="Editar">
              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="excluir(${u.id})"
              class="text-brand-tan hover:text-red-400 transition-colors" title="Excluir">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function openModal(id = null) {
  const u = id ? _usuarios.find(x => x.id === id) : null;

  document.getElementById('modal-title').textContent = u ? 'Editar Usuário' : 'Novo Usuário';
  document.getElementById('f-id').value     = u?.id ?? '';
  document.getElementById('f-nome').value   = u?.nome ?? '';
  document.getElementById('f-email').value  = u?.email ?? '';
  document.getElementById('f-senha').value  = '';
  document.getElementById('f-perfil').value = u?.perfil_id ?? '';

  const labelSenha = document.getElementById('label-senha');
  const fSenha     = document.getElementById('f-senha');
  if (u) {
    labelSenha.textContent = 'Senha (deixe em branco para manter)';
    fSenha.removeAttribute('required');
    fSenha.placeholder = '••••••••';
  } else {
    labelSenha.textContent = 'Senha *';
    fSenha.setAttribute('required', '');
    fSenha.placeholder = '';
  }

  document.getElementById('f-comissao').value = u?.representante?.percentual_comissao ?? '';
  document.getElementById('f-empresa').value  = u?.comprador?.cliente_id ?? '';

  onPerfilChange();
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('form-usuario').reset();
  onPerfilChange();
}

function onPerfilChange() {
  const perfil = document.getElementById('f-perfil').value;
  document.getElementById('field-comissao').classList.toggle('hidden', perfil !== '2');
  document.getElementById('field-empresa').classList.toggle('hidden', perfil !== '3');
}

document.getElementById('form-usuario').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id  = document.getElementById('f-id').value;
  const btn = document.getElementById('btn-salvar');
  const perfil = document.getElementById('f-perfil').value;

  const body = {
    perfil_id: parseInt(perfil),
    nome:      document.getElementById('f-nome').value.trim(),
    email:     document.getElementById('f-email').value.trim(),
    senha:     document.getElementById('f-senha').value || undefined,
  };

  if (perfil === '2') {
    body.percentual_comissao = parseFloat(document.getElementById('f-comissao').value) || 0;
  }
  if (perfil === '3') {
    body.cliente_id = parseInt(document.getElementById('f-empresa').value) || undefined;
  }

  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    if (id) {
      await Api.put(`/usuarios/${id}`, body);
      showAlert('Usuário atualizado com sucesso.', 'success');
    } else {
      await Api.post('/usuarios', body);
      showAlert('Usuário cadastrado com sucesso.', 'success');
    }
    closeModal();
    _usuarios = await Api.get('/usuarios');
    renderTabela();
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao salvar usuário.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

async function excluir(id) {
  const u = _usuarios.find(x => x.id === id);
  if (!confirm(`Excluir "${u?.nome}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    await Api.del(`/usuarios/${id}`);
    _usuarios = _usuarios.filter(x => x.id !== id);
    renderTabela();
    showAlert('Usuário excluído com sucesso.', 'success');
  } catch (err) {
    showAlert(err.erro ?? 'Erro ao excluir usuário.', 'error');
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

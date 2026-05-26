const form   = document.getElementById('form-login');
const alertEl = document.getElementById('alert');
const btnLogin = document.getElementById('btn-login');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.innerHTML = '';
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando…';

  try {
    const res = await Api.post('/auth/login', {
      email: document.getElementById('email').value,
      senha: document.getElementById('senha').value,
    });

    Api.setToken(res.token);
    localStorage.setItem('usuario', JSON.stringify(res.usuario));

    const perfil = (res.usuario.perfil?.nome ?? res.usuario.perfil ?? '').toLowerCase();
    window.location.href = perfil === 'comprador'
      ? '/pages/portal-pedidos.html'
      : '/pages/dashboard.html';

  } catch (err) {
    alertEl.innerHTML = `
      <div class="bg-red-950 border border-red-800 text-red-300 text-xs rounded-lg px-3 py-2.5 mb-2">
        ${err.erro || 'Credenciais inválidas. Tente novamente.'}
      </div>`;
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
});

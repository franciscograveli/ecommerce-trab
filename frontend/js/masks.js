// Máscaras de input reutilizáveis
const Mask = (() => {

  // ── CNPJ: 00.000.000/0001-00 ─────────────────────────────────────
  function cnpj(el) {
    el.setAttribute('placeholder', '00.000.000/0001-00');
    el.setAttribute('maxlength', '18');
    el.addEventListener('input', ev => {
      let v = ev.target.value.replace(/\D/g, '').slice(0, 14);
      if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
      else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
      else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
      ev.target.value = v;
    });
  }

  // ── Moeda (R$): foco edita número, blur formata ───────────────────
  function currency(el) {
    el.setAttribute('placeholder', 'R$ 0,00');
    el.addEventListener('focus', ev => {
      const val = parseCurrency(ev.target.value);
      ev.target.value = val != null ? val.toFixed(2).replace('.', ',') : '';
      ev.target.select();
    });
    el.addEventListener('blur', ev => {
      const val = parseCurrency(ev.target.value);
      ev.target.value = val != null ? _fmtCurrency(val) : '';
    });
  }

  function setCurrency(el, value) {
    const n = parseFloat(value);
    el.value = (!isNaN(n) && value !== '' && value != null) ? _fmtCurrency(n) : '';
  }

  function parseCurrency(value) {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    const cleaned = String(value)
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  }

  function _fmtCurrency(n) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // ── Percentual: foco edita número, blur formata ───────────────────
  function percent(el) {
    el.setAttribute('placeholder', '0,00%');
    el.setAttribute('maxlength', '7');
    el.addEventListener('focus', ev => {
      const val = parsePercent(ev.target.value);
      ev.target.value = val != null ? val.toFixed(2).replace('.', ',') : '';
      ev.target.select();
    });
    el.addEventListener('blur', ev => {
      const val = parsePercent(ev.target.value);
      ev.target.value = val != null ? val.toFixed(2).replace('.', ',') + '%' : '';
    });
  }

  function setPercent(el, value) {
    const n = parseFloat(value);
    el.value = (!isNaN(n) && value !== '' && value != null) ? n.toFixed(2).replace('.', ',') + '%' : '';
  }

  function parsePercent(value) {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace('%', '').replace(',', '.').trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : Math.min(n, 100);
  }

  // ── Linha digitável de boleto ─────────────────────────────────────
  // Formato: DDDDD.DDDDD DDDDD.DDDDDD DDDDD.DDDDDD D DDDDDDDDDDDDDD
  function boletoLine(el) {
    el.setAttribute('placeholder', '00000.00000 00000.000000 00000.000000 0 00000000000000');
    el.setAttribute('maxlength', '54');
    el.addEventListener('input', ev => {
      const d = ev.target.value.replace(/\D/g, '').slice(0, 47);
      let v = '';
      if (d.length <= 5)       v = d;
      else if (d.length <= 10) v = `${d.slice(0,5)}.${d.slice(5)}`;
      else if (d.length <= 15) v = `${d.slice(0,5)}.${d.slice(5,10)} ${d.slice(10)}`;
      else if (d.length <= 21) v = `${d.slice(0,5)}.${d.slice(5,10)} ${d.slice(10,15)}.${d.slice(15)}`;
      else if (d.length <= 26) v = `${d.slice(0,5)}.${d.slice(5,10)} ${d.slice(10,15)}.${d.slice(15,21)} ${d.slice(21)}`;
      else if (d.length <= 32) v = `${d.slice(0,5)}.${d.slice(5,10)} ${d.slice(10,15)}.${d.slice(15,21)} ${d.slice(21,26)}.${d.slice(26)}`;
      else if (d.length <= 33) v = `${d.slice(0,5)}.${d.slice(5,10)} ${d.slice(10,15)}.${d.slice(15,21)} ${d.slice(21,26)}.${d.slice(26,32)} ${d.slice(32)}`;
      else                      v = `${d.slice(0,5)}.${d.slice(5,10)} ${d.slice(10,15)}.${d.slice(15,21)} ${d.slice(21,26)}.${d.slice(26,32)} ${d.slice(32,33)} ${d.slice(33)}`;
      ev.target.value = v;
    });
  }

  return { cnpj, currency, setCurrency, parseCurrency, percent, setPercent, parsePercent, boletoLine };
})();

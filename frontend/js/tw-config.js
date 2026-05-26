// Tailwind custom config — loaded before cdn.tailwindcss.com on every page.
// As cores referenciam as variáveis CSS de base.css via canais RGB,
// o que permite usar modificadores de opacidade (ex: bg-brand-brown/20)
// e que as classes respondam à troca de tema via data-theme.
window.tailwind = window.tailwind || {};
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          black:   'rgb(var(--brand-black-rgb)   / <alpha-value>)',
          dark:    'rgb(var(--brand-dark-rgb)     / <alpha-value>)',
          primary: 'rgb(var(--brand-primary-rgb)  / <alpha-value>)',
          gold:    'rgb(var(--brand-gold-rgb)     / <alpha-value>)',
          amber:   'rgb(var(--brand-amber-rgb)    / <alpha-value>)',
          brown:   'rgb(var(--brand-brown-rgb)    / <alpha-value>)',
          tan:     'rgb(var(--brand-tan-rgb)      / <alpha-value>)',
          cream:   'rgb(var(--brand-cream-rgb)    / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

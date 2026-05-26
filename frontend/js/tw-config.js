// Tailwind custom config — loaded before cdn.tailwindcss.com on every page
window.tailwind = window.tailwind || {};
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          black:   '#12100D',
          dark:    '#2C1A06',
          primary: '#C8721A',
          gold:    '#E8C882',
          amber:   '#E8A84A',
          brown:   '#6B4226',
          tan:     '#8B6040',
          cream:   '#FDFAF5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

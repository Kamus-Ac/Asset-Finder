/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'seed': ['LINESeedJP_Regular'],
        'seed-extrabold': ['LINESeedJP_ExtraBold'],
        sans: ['LINESeedJP_Regular'],
        'sans-medium': ['LINESeedJP_Regular'],
        'sans-semibold': ['LINESeedJP_Bold'],
        'sans-bold': ['LINESeedJP_Bold'],
      },
    },
  },
  plugins: [],
};

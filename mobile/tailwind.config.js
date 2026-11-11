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
        sans: ['Urbanist_400Regular'],
        'sans-medium': ['Urbanist_500Medium'],
        'sans-semibold': ['Urbanist_600SemiBold'],
        'sans-bold': ['Urbanist_700Bold'],
      },
    },
  },
  plugins: [],
};

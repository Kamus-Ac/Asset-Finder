/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Urbanist_400Regular'],
        'sans-medium': ['Urbanist_500Medium'],
        'sans-semibold': ['Urbanist_600SemiBold'],
        'sans-bold': ['Urbanist_700Bold'],
      },
    },
  },
  plugins: [],
};

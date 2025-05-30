/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ml-yellow': '#FFE600',
        'ml-blue': '#3483FA',
        'ml-light-blue': '#8BB6FC',
        'ml-dark-blue': '#2968C8',
        'ml-black': '#333333',
        'ml-gray': '#EEEEEE',
        'ml-light-gray': '#F5F5F5',
        'ml-success': '#00A650',
        'ml-warning': '#FFA500',
        'ml-error': '#FF0000',
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
      },
      boxShadow: {
        'ml': '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
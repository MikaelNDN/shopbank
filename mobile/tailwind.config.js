/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ad',
          300: '#f6ba79',
          400: '#f19342',
          500: '#ed751e',
          600: '#de5c14',
          700: '#b84613',
          800: '#923917',
          900: '#763015',
          950: '#401709',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626',
        info: '#2563eb',
        background: '#ffffff',
        surface: '#f9fafb',
        muted: '#6b7280',
        border: '#e5e7eb',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};

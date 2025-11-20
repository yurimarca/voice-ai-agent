/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        secondary: '#64748b',
        success: '#10b981',
        danger: '#ef4444',
        background: '#f8fafc',
        surface: '#ffffff',
        text: {
          primary: '#1e293b',
          secondary: '#64748b',
        },
        border: '#e2e8f0',
      },
      boxShadow: {
        'custom': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'custom-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", "'Roboto'", "'Oxygen'", "'Ubuntu'", "'Cantarell'", "'Fira Sans'", "'Droid Sans'", "'Helvetica Neue'", 'sans-serif'],
        'mono': ["'Monaco'", "'Menlo'", 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'recording-pulse': 'recording-pulse 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'cost-pulse': 'costPulse 0.5s ease',
      },
      keyframes: {
        'recording-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)',
          },
        },
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          'from': {
            opacity: '0',
          },
          'to': {
            opacity: '0.8',
          },
        },
        costPulse: {
          '0%': {
            transform: 'scale(1)',
            borderColor: '#e2e8f0',
          },
          '50%': {
            transform: 'scale(1.02)',
            borderColor: '#10b981',
          },
          '100%': {
            transform: 'scale(1)',
            borderColor: '#e2e8f0',
          },
        },
      },
    },
  },
  plugins: [],
}
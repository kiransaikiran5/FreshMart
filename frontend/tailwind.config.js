export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f0fdf4',
          DEFAULT: '#16a34a',
          dark: '#15803d',
          darker: '#166534',
        },
        surface: '#f9fafb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      // 👇 Add these keyframes and animation
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
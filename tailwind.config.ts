import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: '#FF6B35',
        teal: '#4ECDC4',
        lavender: '#C7B8EA',
        'bg-warm': '#FFF9F0',
        'parent-indigo': '#4F46E5',
      },
      spacing: {
        base: '4px',
      },
      fontFamily: {
        nunito: ['var(--font-nunito)', 'sans-serif'],
        fredoka: ['var(--font-fredoka)', 'cursive'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
        'pulse-ring': 'pulse-ring 1s ease-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

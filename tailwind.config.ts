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
        // 배경
        'bg-primary': '#1a1a2e',
        'bg-secondary': '#16213e',

        // 강조색
        accent: {
          DEFAULT: '#4fc3f7',
          light: '#81d4fa',
          dark: '#29b6f6',
        },

        // 시장 색상
        market: {
          kr: '#2196f3',
          us: '#4caf50',
          crypto: '#ff9800',
          cash: '#9e9e9e',
        },

        // 손익 색상
        profit: {
          positive: '#66bb6a',
          negative: '#ef5350',
        },

        // 매수/매도 색상 (한국식)
        trade: {
          buy: '#e53935',
          sell: '#1e88e5',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        'gradient-primary': 'linear-gradient(135deg, #4fc3f7, #29b6f6)',
      },
    },
  },
  plugins: [],
};

export default config;

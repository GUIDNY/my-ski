import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '10': '48px',
        '12': '64px',
      },
      fontSize: {
        'sm': ['14px', { lineHeight: '1.43' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'lg': ['20px', { lineHeight: '1.4' }],
        'xl': ['24px', { lineHeight: '1.33' }],
        '2xl': ['32px', { lineHeight: '1.25' }],
        '3xl': ['48px', { lineHeight: '1.17' }],
      },
      colors: {
        // Backgrounds
        'bg': '#FFFFFF',
        'bg-secondary': '#F7F7F8',
        'bg-tertiary': '#F0F0F1',

        // Text
        'text': '#111111',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',
        'text-inverse': '#FFFFFF',

        // Accents
        'primary': '#0053DB',
        'primary-light': '#2563EB',
        'primary-dark': '#003D99',

        // States
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#D32F2F',

        // Borders
        'border': '#E5E5E5',
        'border-secondary': '#D0D0D0',
        'divider': '#E5E5E5',

        // Surface
        'surface': '#FFFFFF',
        'surface-hover': '#F7F7F8',
        'surface-active': '#F0F0F1',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.10)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'xl': '0 12px 32px rgba(0, 0, 0, 0.15)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'ease': 'ease',
      },
      screens: {
        'sm': '375px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      fontWeight: {
        'regular': '400',
        'semibold': '600',
        'bold': '700',
        'black': '900',
      },
    },
  },
  plugins: [],
};

export default config;

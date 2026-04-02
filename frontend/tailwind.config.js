/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#07111f',
        night: '#081223',
        surface: 'rgba(255,255,255,0.04)',
        'surface-elevated': 'rgba(255,255,255,0.07)',
        glow: '#5eead4',
        violet: '#8b5cf6',
        danger: '#f43f5e',
        warn: '#f59e0b',
        success: '#22c55e',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        panel: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        modal: '0 25px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(94,234,212,0.25), 0 0 60px rgba(94,234,212,0.1)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
        button: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        hero: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(94,234,212,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 50%), linear-gradient(180deg, #07111f 0%, #0b1730 100%)',
        'card-teal': 'linear-gradient(135deg, rgba(94,234,212,0.08) 0%, transparent 60%)',
        'card-violet': 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 60%)',
        'button-primary': 'linear-gradient(135deg, #5eead4 0%, #8b5cf6 100%)',
        'button-primary-hover': 'linear-gradient(135deg, #7ef4df 0%, #9d72f8 100%)',
      },
      borderRadius: {
        card: '20px',
        'card-lg': '28px',
        button: '12px',
        input: '12px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        glowPulse: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
      },
    },
  },
  plugins: [],
};

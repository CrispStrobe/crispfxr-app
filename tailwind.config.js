/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // Custom colors for CrispFXR
      colors: {
        'audio-blue': {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        'audio-purple': {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        },
        'audio-pink': {
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        'synth-gray': {
          800: '#1f2937',
          850: '#1a222e',
          900: '#111827',
          950: '#030712',
        }
      },
      // Custom gradients
      backgroundImage: {
        'audio-gradient': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        'synth-gradient': 'linear-gradient(to bottom right, #030712, #111827, #172554)',
      },
      // Custom animations for audio visualization
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'waveform': 'waveform 2s ease-in-out infinite',
      },
      keyframes: {
        waveform: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.2)' },
        }
      },
      // Custom spacing for audio controls
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Custom font sizes for mobile
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      // Custom shadows for buttons and cards
      boxShadow: {
        'audio': '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
        'audio-lg': '0 10px 25px 0 rgba(59, 130, 246, 0.35)',
        'synth': '0 4px 14px 0 rgba(0, 0, 0, 0.5)',
        'synth-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.25)',
      },
      // Custom border radius for audio components
      borderRadius: {
        'audio': '0.75rem',
        'synth': '1rem',
      },
      // Custom backdrop blur
      backdropBlur: {
        'audio': '12px',
      }
    },
  },
  plugins: [
    // Add custom utility classes for audio components
    function({ addUtilities }) {
      const audioUtilities = {
        '.slider-thumb': {
          '-webkit-appearance': 'none',
          'appearance': 'none',
          'height': '20px',
          'width': '20px',
          'border-radius': '50%',
          'background': 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          'cursor': 'pointer',
          'border': '2px solid #1e40af',
          'box-shadow': '0 2px 4px rgba(0,0,0,0.3)',
          'transition': 'all 0.2s ease',
        },
        '.slider-thumb:hover': {
          'box-shadow': '0 4px 8px rgba(59, 130, 246, 0.4)',
          'transform': 'scale(1.1)',
        },
        '.slider-track': {
          'background': 'linear-gradient(90deg, #374151 0%, #3b82f6 50%, #8b5cf6 100%)',
          '-webkit-appearance': 'none',
          'appearance': 'none',
          'height': '8px',
          'border-radius': '4px',
          'outline': 'none',
        },
        '.audio-button': {
          'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          'transform': 'translateZ(0)', // Hardware acceleration
        },
        '.audio-button:active': {
          'transform': 'scale(0.95)',
        },
        '.glass-effect': {
          'backdrop-filter': 'blur(12px)',
          'background': 'rgba(17, 24, 39, 0.8)',
          'border': '1px solid rgba(75, 85, 99, 0.3)',
        },
        '.mobile-touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.prevent-zoom': {
          'touch-action': 'manipulation',
        }
      }
      addUtilities(audioUtilities)
    }
  ],
  // Optimize for production
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Disable features not needed for better performance
  corePlugins: {
    preflight: true,
    container: false, // We don't use container
  }
}

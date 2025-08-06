import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		screens: {
			'mobile-sm': '480px',
			'mobile-md': '768px',
			'tablet': '1024px',
			'desktop': '1280px',
			'2xl': '1400px'
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Custom depth design tokens
				surface: {
					elevated: 'hsl(var(--surface-elevated))',
					float: 'hsl(var(--surface-float))'
				},
				text: {
					subtle: 'hsl(var(--text-subtle))',
					primary: 'hsl(var(--text-primary))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.1)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.3)' }
				},
				'backgroundFloat': {
					'0%, 100%': { opacity: '1', transform: 'scale(1)' },
					'50%': { opacity: '0.8', transform: 'scale(1.05)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: '0.3' },
					'25%': { transform: 'translateY(-20px) rotate(90deg)', opacity: '0.6' },
					'50%': { transform: 'translateY(-40px) rotate(180deg)', opacity: '0.3' },
					'75%': { transform: 'translateY(-20px) rotate(270deg)', opacity: '0.6' }
				},
				'slideInLeft': {
					from: { opacity: '0', transform: 'translateX(-30px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'slideInRight': {
					from: { opacity: '0', transform: 'translateX(30px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'textGlow': {
					'0%, 100%': { textShadow: '0 0 5px rgba(32, 128, 141, 0.3)' },
					'50%': { textShadow: '0 0 15px rgba(32, 128, 141, 0.5), 0 0 20px rgba(32, 128, 141, 0.3)' }
				},
				'dotPulse': {
					'0%, 100%': { opacity: '1', transform: 'scale(1)' },
					'50%': { opacity: '0.6', transform: 'scale(0.8)' }
				},
				'searchPulse': {
					'0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
					'50%': { opacity: '1', transform: 'scale(1.1)' }
				},
				'blink': {
					'0%, 50%': { opacity: '1' },
					'51%, 100%': { opacity: '0' }
				},
				'pillFloat': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'iconBounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
					'100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' }
				},
				'fadeInUp': {
					from: { opacity: '0', transform: 'translateX(-50%) translateY(20px)' },
					to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'glow': 'glow 2s ease-in-out infinite',
				'backgroundFloat': 'backgroundFloat 20s ease-in-out infinite',
				'float': 'float 15s infinite ease-in-out',
				'slideInLeft': 'slideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
				'slideInRight': 'slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both',
				'textGlow': 'textGlow 3s ease-in-out infinite',
				'dotPulse': 'dotPulse 2s ease-in-out infinite',
				'searchPulse': 'searchPulse 2s ease-in-out infinite',
				'blink': 'blink 1s infinite',
				'pillFloat': 'pillFloat 0.6s ease-out',
				'iconBounce': 'iconBounce 2s ease-in-out infinite',
				'shimmer': 'shimmer 4s infinite',
				'fadeInUp': 'fadeInUp 1s ease-out 1s both'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-accent': 'var(--gradient-accent)',
				'gradient-surface': 'var(--gradient-surface)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'float': 'var(--shadow-float)',
				'glow': 'var(--shadow-glow)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  			
  			// Urdu Nasta'liq Fonts - Google Fonts
  			'nastaliq': ['Noto Nastaliq Urdu', 'serif'],
  			'gulzar': ['Gulzar', 'serif'],
  			
  			// Urdu Nasta'liq Fonts - Self-hosted
  			'jameel-noori': ['Jameel Noori Nastaleeq', 'serif'],
  			'al-qalam': ['Al Qalam Taj Nastaleeq', 'serif'],
  			'alvi-nastaleeq': ['Alvi Nastaleeq', 'serif'],
  			'nafees-nastaleeq': ['Nafees Nastaleeq', 'serif'],
  			'fajer-noori': ['Fajer Noori Nastalique', 'serif'],
  			'aasar-unicode': ['Aasar Unicode', 'serif'],
  			
  			// Arabic Naskh Fonts - Google Fonts
  			'naskh': ['Noto Naskh Arabic', 'serif'],
  			'naskh-sans': ['Noto Sans Arabic', 'sans-serif'],
  			'naskh-serif': ['Noto Serif Arabic', 'serif'],
  			'paktype-naskh': ['PakType Naskh Basic', 'serif'],
  			
  			// Traditional Arabic Fonts - Google Fonts
  			'amiri': ['Amiri', 'serif'],
  			'amiri-quran': ['Amiri Quran', 'serif'],
  			'scheherazade': ['Scheherazade New', 'serif'],
  			'scheherazade-old': ['Scheherazade', 'serif'],
  			
  			// Modern Arabic Fonts - Google Fonts
  			'cairo': ['Cairo', 'sans-serif'],
  			'tajawal': ['Tajawal', 'sans-serif'],
  			'ibm-sans-arabic': ['IBM Plex Sans Arabic', 'sans-serif'],
  			'ibm-serif-arabic': ['IBM Plex Serif', 'serif'],
  			'changa': ['Changa', 'sans-serif'],
  			'el-messiri': ['El Messiri', 'serif'],
  			'harmattan': ['Harmattan', 'serif'],
  			'lalezar': ['Lalezar', 'serif'],
  			'mada': ['Mada', 'sans-serif'],
  			'mirza': ['Mirza', 'serif'],
  			'noto-kufi': ['Noto Kufi Arabic', 'sans-serif'],
  			'rakkas': ['Rakkas', 'serif'],
  			
  			// Persian Fonts - Google Fonts
  			'vazirmatn': ['Vazirmatn', 'sans-serif'],
  			'estedad': ['Estedad', 'sans-serif'],
  			
  			// Calligraphic Fonts - Google Fonts
  			'reem-kufi': ['Reem Kufi', 'sans-serif'],
  			'markazi': ['Markazi Text', 'serif'],
  			
  			// Baloo Font Family - Google Fonts (Supports Urdu)
  			'baloo-2': ['Baloo 2', 'sans-serif'],
  			'baloo-bhaijaan': ['Baloo Bhaijaan 2', 'sans-serif'],
  			'baloo-tamma': ['Baloo Tamma 2', 'sans-serif'],
  			'baloo-thambi': ['Baloo Thambi 2', 'sans-serif'],
  			
  			// Additional Modern Fonts - Google Fonts
  			'rubik': ['Rubik', 'sans-serif'],
  			'oswald': ['Oswald', 'sans-serif'],
  			'quicksand': ['Quicksand', 'sans-serif'],
  			'source-sans': ['Source Sans 3', 'sans-serif'],
  			'source-serif': ['Source Serif 4', 'serif'],
  			'work-sans': ['Work Sans', 'sans-serif'],
  			
  			// Sameer Font Family - Self-hosted
  			'sameer-tasmeem': ['Sameer Tasmeem Bold', 'serif'],
  			'sameer-rafiya': ['Sameer Rafiya Unicode', 'serif'],
  			'sameer-qamri': ['Sameer Qamri', 'serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

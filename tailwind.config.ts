import type { Config } from 'tailwindcss'

// Paleta sóbria e executiva: preto, cinzas, prata e branco — sem cores de
// destaque saturadas. Qualquer "cor" de status (atrasado, em dia) usa apenas
// variações de tom, nunca vermelho/verde/azul vivos, para manter a
// identidade minimalista pedida.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // "grafite": tons de preto usados em texto e superfícies escuras
        grafite: {
          950: '#0a0a0b',
          900: '#131316',
          800: '#1e1e22',
          700: '#2b2b30',
        },
        // "prata": cinzas médios usados em bordas, ícones e texto secundário
        prata: {
          600: '#6b6d74',
          500: '#8b8d94',
          400: '#b3b5bb',
          300: '#d4d5d9',
          200: '#e7e8ea',
          100: '#f3f3f5',
        },
        marfim: '#fafafa',
      },
      fontFamily: {
        // Pilha de fontes sans-serif do próprio sistema operacional — sem
        // depender de baixar uma fonte externa (Google Fonts etc.), o que
        // manteria o build mais simples e sem dependência de rede.
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        // Botões redondos/ovalados: raio muito alto força a forma de pílula
        // independente da largura do botão.
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 10, 11, 0.06), 0 1px 3px rgba(10, 10, 11, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config

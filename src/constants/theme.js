/**
 * Constantes centralizadas de clases CSS por tema.
 * Elimina los ternarios repetitivos theme === 'dark' ? ... : theme === 'medical' ? ... : ...
 *
 * Uso:
 *   import { tc } from '@/constants/theme'
 *   <div className={tc(theme).card}>...</div>
 *
 * O desestructurando:
 *   const t = tc(theme)
 *   <div className={t.card}>...</div>
 */

const themes = {
  light: {
    // Fondos principales
    pageBg: 'bg-slate-50',
    surfaceBg: 'bg-white',
    cardBg: 'bg-white',
    sidebarBg: 'bg-slate-900',
    headerBg: 'bg-white',
    inputBg: 'bg-white',
    modalBg: 'bg-white',
    dropdownBg: 'bg-white',
    badgeBg: 'bg-slate-100',
    metricBg: 'bg-white',
    tableRowHover: 'hover:bg-slate-50',
    tableHeaderBg: 'bg-slate-50',

    // Textos
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    textLabel: 'text-slate-700',
    textHeading: 'text-slate-900',
    sidebarText: 'text-slate-300',
    sidebarTextActive: 'text-white',

    // Bordes
    border: 'border-slate-200',
    borderInput: 'border-slate-300',
    divider: 'divide-slate-100',

    // Botones
    btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    btnDanger: 'bg-red-600 hover:bg-red-700 text-white',

    // Estado activo en sidebar
    sidebarActive: 'bg-blue-600 text-white',
    sidebarHover: 'hover:bg-slate-800 text-slate-300',

    // Scrollbar
    scrollbar: 'scrollbar-light',
  },

  dark: {
    // Fondos principales
    pageBg: 'bg-slate-900',
    surfaceBg: 'bg-slate-800',
    cardBg: 'bg-slate-800',
    sidebarBg: 'bg-slate-950',
    headerBg: 'bg-slate-800',
    inputBg: 'bg-slate-700',
    modalBg: 'bg-slate-800',
    dropdownBg: 'bg-slate-800',
    badgeBg: 'bg-slate-700',
    metricBg: 'bg-slate-800',
    tableRowHover: 'hover:bg-slate-700',
    tableHeaderBg: 'bg-slate-700',

    // Textos
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    textLabel: 'text-slate-300',
    textHeading: 'text-white',
    sidebarText: 'text-slate-400',
    sidebarTextActive: 'text-white',

    // Bordes
    border: 'border-slate-700',
    borderInput: 'border-slate-600',
    divider: 'divide-slate-700',

    // Botones
    btnPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
    btnSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    btnDanger: 'bg-red-500 hover:bg-red-600 text-white',

    // Estado activo en sidebar
    sidebarActive: 'bg-blue-600 text-white',
    sidebarHover: 'hover:bg-slate-800 text-slate-400',

    // Scrollbar
    scrollbar: 'scrollbar-dark',
  },

  medical: {
    // Fondos principales
    pageBg: 'bg-blue-50',
    surfaceBg: 'bg-white',
    cardBg: 'bg-white',
    sidebarBg: 'bg-blue-900',
    headerBg: 'bg-white',
    inputBg: 'bg-white',
    modalBg: 'bg-white',
    dropdownBg: 'bg-white',
    badgeBg: 'bg-blue-50',
    metricBg: 'bg-white',
    tableRowHover: 'hover:bg-blue-50',
    tableHeaderBg: 'bg-blue-50',

    // Textos
    textPrimary: 'text-blue-900',
    textSecondary: 'text-blue-700',
    textMuted: 'text-blue-400',
    textLabel: 'text-blue-800',
    textHeading: 'text-blue-900',
    sidebarText: 'text-blue-200',
    sidebarTextActive: 'text-white',

    // Bordes
    border: 'border-blue-100',
    borderInput: 'border-blue-200',
    divider: 'divide-blue-100',

    // Botones
    btnPrimary: 'bg-blue-700 hover:bg-blue-800 text-white',
    btnSecondary: 'bg-blue-50 hover:bg-blue-100 text-blue-800',
    btnDanger: 'bg-red-600 hover:bg-red-700 text-white',

    // Estado activo en sidebar
    sidebarActive: 'bg-blue-700 text-white',
    sidebarHover: 'hover:bg-blue-800 text-blue-200',

    // Scrollbar
    scrollbar: 'scrollbar-light',
  },
}

/**
 * Devuelve las clases del tema actual.
 * @param {string} theme - 'light' | 'dark' | 'medical'
 * @returns {Object} Objeto con clases CSS para el tema
 */
export const tc = (theme) => themes[theme] ?? themes.light

export default themes

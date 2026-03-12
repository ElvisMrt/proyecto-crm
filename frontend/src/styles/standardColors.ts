/**
 * Paleta de colores estandarizada para todo el sistema
 * Usar estos colores en todos los módulos para mantener consistencia
 */

export const standardColors = {
  // Colores primarios
  primary: {
    brand: {
      bg: 'bg-slate-900',
      hover: 'hover:bg-slate-800',
      text: 'text-slate-900',
      border: 'border-slate-700',
      light: 'bg-slate-100',
      lightText: 'text-slate-800',
    },
  },

  // Estados
  status: {
    success: {
      bg: 'bg-emerald-700',
      hover: 'hover:bg-emerald-800',
      text: 'text-emerald-700',
      light: 'bg-emerald-50',
      lightText: 'text-emerald-900',
      border: 'border-emerald-200',
    },
    error: {
      bg: 'bg-rose-700',
      hover: 'hover:bg-rose-800',
      text: 'text-rose-700',
      light: 'bg-rose-50',
      lightText: 'text-rose-900',
      border: 'border-rose-200',
    },
    warning: {
      bg: 'bg-amber-700',
      hover: 'hover:bg-amber-800',
      text: 'text-amber-700',
      light: 'bg-amber-50',
      lightText: 'text-amber-900',
      border: 'border-amber-200',
    },
    info: {
      bg: 'bg-slate-900',
      hover: 'hover:bg-slate-800',
      text: 'text-slate-900',
      light: 'bg-slate-100',
      lightText: 'text-slate-800',
      border: 'border-slate-200',
    },
  },

  // Colores de texto
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-400',
  },

  // Colores de fondo
  background: {
    white: 'bg-white',
    gray: 'bg-gray-50',
    light: 'bg-gray-100',
  },

  // Bordes
  border: {
    default: 'border-gray-200',
    light: 'border-gray-100',
    dark: 'border-gray-300',
  },
};

// Fondos con gradientes suaves
export const gradientBackgrounds = {
  blue: 'bg-gradient-to-br from-slate-50 to-slate-100',
  green: 'bg-gradient-to-br from-emerald-50 to-teal-100',
  red: 'bg-gradient-to-br from-rose-50 to-stone-100',
  orange: 'bg-gradient-to-br from-amber-50 to-stone-100',
  purple: 'bg-gradient-to-br from-slate-50 to-indigo-100',
  gray: 'bg-gradient-to-br from-gray-50 to-slate-100',
};

// Bordes de color
export const colorBorders = {
  blue: 'border-slate-200',
  green: 'border-emerald-200',
  red: 'border-rose-200',
  orange: 'border-amber-200',
  purple: 'border-indigo-200',
  gray: 'border-gray-200',
};

// Iconos de color
export const colorIcons = {
  blue: 'text-slate-700',
  green: 'text-emerald-700',
  red: 'text-rose-700',
  orange: 'text-amber-700',
  purple: 'text-indigo-700',
  gray: 'text-gray-700',
};

// Títulos de color
export const colorTitles = {
  blue: 'text-slate-700',
  green: 'text-emerald-700',
  red: 'text-rose-700',
  orange: 'text-amber-700',
  purple: 'text-indigo-700',
  gray: 'text-gray-600',
};

/**
 * Clases de botones estandarizadas
 */
export const standardButtons = {
  primary: 'bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  danger: 'bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors',
  success: 'bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors',
  ghost: 'hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors dark:hover:bg-slate-800 dark:text-slate-100',
  outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-100',
};

/**
 * Clases de inputs estandarizadas
 */
export const standardInputs = {
  base: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm',
  error: 'w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm',
  disabled: 'w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed',
};

/**
 * Clases de badges estandarizadas
 */
export const standardBadges = {
  success: 'px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200',
  error: 'px-2 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200',
  warning: 'px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  info: 'px-2 py-1 text-xs font-medium rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  neutral: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200',
};

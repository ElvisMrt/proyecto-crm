/**
 * Paleta de colores estandarizada para todo el sistema
 * Usar estos colores en todos los módulos para mantener consistencia
 */

export const standardColors = {
  // Colores primarios
  primary: {
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      border: 'border-blue-500',
      light: 'bg-blue-50',
      lightText: 'text-blue-800',
    },
  },

  // Estados
  status: {
    success: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      text: 'text-green-600',
      light: 'bg-green-50',
      lightText: 'text-green-800',
      border: 'border-green-200',
    },
    error: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      text: 'text-red-600',
      light: 'bg-red-50',
      lightText: 'text-red-800',
      border: 'border-red-200',
    },
    warning: {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      text: 'text-orange-600',
      light: 'bg-orange-50',
      lightText: 'text-orange-800',
      border: 'border-orange-200',
    },
    info: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      light: 'bg-blue-50',
      lightText: 'text-blue-800',
      border: 'border-blue-200',
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
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100',
  green: 'bg-gradient-to-br from-green-50 to-emerald-100',
  red: 'bg-gradient-to-br from-red-50 to-rose-100',
  orange: 'bg-gradient-to-br from-orange-50 to-amber-100',
  purple: 'bg-gradient-to-br from-purple-50 to-violet-100',
  gray: 'bg-gradient-to-br from-gray-50 to-gray-100',
};

// Bordes de color
export const colorBorders = {
  blue: 'border-blue-200',
  green: 'border-green-200',
  red: 'border-red-200',
  orange: 'border-orange-200',
  purple: 'border-purple-200',
  gray: 'border-gray-200',
};

// Iconos de color
export const colorIcons = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  red: 'text-red-700',
  orange: 'text-orange-700',
  purple: 'text-purple-700',
  gray: 'text-gray-700',
};

// Títulos de color
export const colorTitles = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
  gray: 'text-gray-600',
};

/**
 * Clases de botones estandarizadas
 */
export const standardButtons = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
  danger: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors',
  success: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors',
  ghost: 'hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
  success: 'px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800',
  error: 'px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800',
  warning: 'px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800',
  info: 'px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800',
  neutral: 'px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800',
};

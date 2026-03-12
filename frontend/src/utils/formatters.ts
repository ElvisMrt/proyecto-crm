// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-DO');
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('es-DO');
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

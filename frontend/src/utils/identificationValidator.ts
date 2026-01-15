/**
 * Utilidades para validar RNC y Cédula de la República Dominicana (Frontend)
 */

/**
 * Valida el formato de RNC o Cédula
 */
export const validateIdentificationFormat = (identification: string): {
  isValid: boolean;
  type: 'RNC' | 'CEDULA' | 'UNKNOWN';
  error?: string;
} => {
  // Eliminar espacios y guiones
  const cleanId = identification.replace(/[\s-]/g, '');

  // Solo debe contener números
  if (!/^\d+$/.test(cleanId)) {
    return {
      isValid: false,
      type: 'UNKNOWN',
      error: 'La identificación solo debe contener números',
    };
  }

  // Validar longitud
  if (cleanId.length === 9) {
    // RNC de 9 dígitos (persona jurídica)
    return {
      isValid: true,
      type: 'RNC',
    };
  } else if (cleanId.length === 11) {
    // Puede ser RNC de 11 dígitos o Cédula
    if (cleanId.startsWith('0') || cleanId.startsWith('1') || cleanId.startsWith('2')) {
      return {
        isValid: true,
        type: 'CEDULA',
      };
    } else {
      return {
        isValid: true,
        type: 'RNC',
      };
    }
  } else if (cleanId.length === 10) {
    // RNC de 10 dígitos (formato antiguo)
    return {
      isValid: true,
      type: 'RNC',
    };
  } else {
    return {
      isValid: false,
      type: 'UNKNOWN',
      error: 'La identificación debe tener 9, 10 u 11 dígitos',
    };
  }
};

/**
 * Valida RNC usando algoritmo de dígito verificador
 */
export const validateRNC = (rnc: string): boolean => {
  const cleanRNC = rnc.replace(/[\s-]/g, '');
  
  if (cleanRNC.length !== 9 && cleanRNC.length !== 11) {
    return false;
  }

  // Para RNC de 9 dígitos, validar dígito verificador
  if (cleanRNC.length === 9) {
    const multipliers = [7, 9, 8, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(cleanRNC[i]) * multipliers[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return checkDigit === parseInt(cleanRNC[8]);
  }

  // Para RNC de 11 dígitos, validación básica (formato)
  return true;
};

/**
 * Valida Cédula usando algoritmo de dígito verificador
 */
export const validateCedula = (cedula: string): boolean => {
  const cleanCedula = cedula.replace(/[\s-]/g, '');
  
  if (cleanCedula.length !== 11) {
    return false;
  }

  // Algoritmo de validación de cédula dominicana
  const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    let product = parseInt(cleanCedula[i]) * multipliers[i];
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10);
    }
    sum += product;
  }
  
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  
  return checkDigit === parseInt(cleanCedula[10]);
};

/**
 * Valida identificación (RNC o Cédula) con algoritmo completo
 */
export const validateIdentification = (identification: string): {
  isValid: boolean;
  type: 'RNC' | 'CEDULA' | 'UNKNOWN';
  error?: string;
} => {
  // Primero validar formato
  const formatValidation = validateIdentificationFormat(identification);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  const cleanId = identification.replace(/[\s-]/g, '');

  // Validar con algoritmo según el tipo
  if (formatValidation.type === 'RNC') {
    const isValid = validateRNC(cleanId);
    return {
      isValid,
      type: 'RNC',
      error: isValid ? undefined : 'RNC inválido (dígito verificador incorrecto)',
    };
  } else if (formatValidation.type === 'CEDULA') {
    const isValid = validateCedula(cleanId);
    return {
      isValid,
      type: 'CEDULA',
      error: isValid ? undefined : 'Cédula inválida (dígito verificador incorrecto)',
    };
  }

  return formatValidation;
};

/**
 * Normaliza la identificación (elimina espacios y guiones)
 */
export const normalizeIdentification = (identification: string): string => {
  return identification.replace(/[\s-]/g, '');
};












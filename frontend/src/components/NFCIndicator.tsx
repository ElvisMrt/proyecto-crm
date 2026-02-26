import React from 'react';

interface NFCIndicatorProps {
  isSupported: boolean;
  isReading: boolean;
  className?: string;
}

export const NFCIndicator: React.FC<NFCIndicatorProps> = ({ 
  isSupported, 
  isReading,
  className = ''
}) => {
  if (!isSupported) {
    return null;
  }

  return (
    <div className={`px-4 py-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
      isReading 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-gray-50 border-gray-200 text-gray-600'
    } ${className}`}>
      <span className={`w-2 h-2 rounded-full ${
        isReading ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
      }`}></span>
      <span>NFC {isReading ? 'Activo' : 'Inactivo'}</span>
    </div>
  );
};

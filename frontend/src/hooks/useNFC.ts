import { useState, useEffect, useCallback } from 'react';

interface NFCReaderOptions {
  onRead: (data: string) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export const useNFC = ({ onRead, onError, enabled = true }: NFCReaderOptions) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if NFC is supported
    if ('NDEFReader' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const startReading = useCallback(async () => {
    if (!isSupported || !enabled) {
      return;
    }

    try {
      setIsReading(true);
      setError(null);

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      
      await ndef.scan();
      
      ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
        console.log('NFC tag detected:', serialNumber);
        
        // Read the first text record
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
            const text = textDecoder.decode(record.data);
            onRead(text);
            break;
          } else if (record.recordType === 'url') {
            const textDecoder = new TextDecoder('utf-8');
            const url = textDecoder.decode(record.data);
            onRead(url);
            break;
          }
        }
        
        // If no text/url record, use serial number
        if (message.records.length === 0) {
          onRead(serialNumber);
        }
      });

      ndef.addEventListener('readingerror', () => {
        const err = new Error('Error al leer la tarjeta NFC');
        setError(err.message);
        if (onError) onError(err);
      });

    } catch (err: any) {
      console.error('NFC Error:', err);
      setError(err.message || 'Error al iniciar lectura NFC');
      setIsReading(false);
      if (onError) onError(err);
    }
  }, [isSupported, enabled, onRead, onError]);

  const stopReading = useCallback(() => {
    setIsReading(false);
    setError(null);
  }, []);

  // Auto-start reading when enabled
  useEffect(() => {
    if (enabled && isSupported && !isReading) {
      startReading();
    }
    
    return () => {
      if (isReading) {
        stopReading();
      }
    };
  }, [enabled, isSupported, isReading, startReading, stopReading]);

  return {
    isSupported,
    isReading,
    error,
    startReading,
    stopReading,
  };
};

// Hook simplificado para búsqueda por código
export const useNFCSearch = (onCodeDetected: (code: string) => void, enabled = true) => {
  const handleRead = useCallback((data: string) => {
    // Clean and process the data
    const code = data.trim();
    if (code) {
      onCodeDetected(code);
    }
  }, [onCodeDetected]);

  return useNFC({
    onRead: handleRead,
    onError: (error) => {
      console.error('NFC Search Error:', error);
    },
    enabled,
  });
};

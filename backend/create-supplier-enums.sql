-- Crear ENUMs necesarios para el módulo de proveedores

-- ENUM para estado de facturas de proveedores
DO $$ BEGIN
    CREATE TYPE "SupplierInvoiceStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ENUM para estado de compras
DO $$ BEGIN
    CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ENUM para métodos de pago
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CHECK', 'CARD', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verificar que se crearon correctamente
SELECT typname FROM pg_type WHERE typname IN ('SupplierInvoiceStatus', 'PurchaseStatus', 'PaymentMethod');

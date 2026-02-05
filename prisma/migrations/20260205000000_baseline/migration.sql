-- CreateTable
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Stock" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holdingQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CashHolding" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CashHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Trade" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "market" TEXT,
    "code" TEXT,
    "name" TEXT,
    "price" DOUBLE PRECISION,
    "qty" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "pnl" DOUBLE PRECISION,
    "buyPrice" DOUBLE PRECISION,
    "direction" TEXT,
    "fromAmount" DOUBLE PRECISION,
    "toAmount" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RealizedPnL" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RealizedPnL_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JournalEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Sector" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Snapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAsset" DOUBLE PRECISION NOT NULL,
    "totalAssetChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jinwonAsset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jinwonChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dadAsset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dadChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lionAsset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lionChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1400,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Account_accountId_key" ON "Account"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Stock_accountId_code_market_key" ON "Stock"("accountId", "code", "market");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CashHolding_accountId_market_key" ON "CashHolding"("accountId", "market");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RealizedPnL_accountId_market_key" ON "RealizedPnL"("accountId", "market");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JournalEntry_date_key" ON "JournalEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExchangeRate_currency_key" ON "ExchangeRate"("currency");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Sector_code_key" ON "Sector"("code");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Stock_accountId_fkey'
    ) THEN
        ALTER TABLE "Stock" ADD CONSTRAINT "Stock_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CashHolding_accountId_fkey'
    ) THEN
        ALTER TABLE "CashHolding" ADD CONSTRAINT "CashHolding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Trade_accountId_fkey'
    ) THEN
        ALTER TABLE "Trade" ADD CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RealizedPnL_accountId_fkey'
    ) THEN
        ALTER TABLE "RealizedPnL" ADD CONSTRAINT "RealizedPnL_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

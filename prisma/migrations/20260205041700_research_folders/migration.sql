-- DropTable
DROP TABLE IF EXISTS "ResearchNote";

-- CreateTable
CREATE TABLE "ResearchFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchStock" (
    "id" TEXT NOT NULL,
    "folderId" TEXT,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResearchStock_ticker_market_key" ON "ResearchStock"("ticker", "market");

-- AddForeignKey
ALTER TABLE "ResearchStock" ADD CONSTRAINT "ResearchStock_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ResearchFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

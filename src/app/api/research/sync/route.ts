import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Force Node.js runtime (required for fs operations)
export const runtime = 'nodejs';

interface ParsedStock {
  ticker: string;
  name: string;
  market: 'US' | 'KR';
  category: string; // "(1) 보유 종목", "(2) 관심 종목", "(3) 보류"
  marketType: '미장' | '국장';
}

interface SyncResult {
  added: number;
  skipped: number;
  errors: string[];
  details: {
    foldersCreated: string[];
    stocksAdded: string[];
    stocksSkipped: string[];
  };
}

/**
 * Parse markdown file to extract stocks and categories
 */
function parseMarkdown(content: string, marketType: '미장' | '국장'): ParsedStock[] {
  const stocks: ParsedStock[] = [];
  const lines = content.split('\n');
  
  let currentCategory = '';
  const market = marketType === '미장' ? 'US' : 'KR';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Section header: ## (1) 보유 종목
    if (line.startsWith('## (')) {
      const match = line.match(/^## (\([0-9]\) .+)/);
      if (match) {
        currentCategory = match[1].trim();
      }
      continue;
    }

    // Stock header: ### TICKER (Name) or ### Name (Code)
    if (line.startsWith('### ') && currentCategory) {
      const stockLine = line.substring(4).trim();
      
      let ticker = '';
      let name = '';

      if (marketType === '미장') {
        // US format: ### INTC (Intel)
        const usMatch = stockLine.match(/^([A-Z]+)\s+\((.+?)\)/);
        if (usMatch) {
          ticker = usMatch[1];
          name = usMatch[2];
        }
      } else {
        // KR format: ### 삼성전자 (005930) or just ### 삼성전자
        const krMatch = stockLine.match(/^(.+?)\s+\(([0-9]+)\)/);
        if (krMatch) {
          name = krMatch[1];
          ticker = krMatch[2];
        } else {
          // No code provided, use name as ticker
          name = stockLine;
          ticker = stockLine;
        }
      }

      if (ticker && name) {
        stocks.push({
          ticker,
          name,
          market,
          category: currentCategory,
          marketType,
        });
      }
    }
  }

  return stocks;
}

/**
 * GET /api/research/sync-watchlist
 * Sync watchlist markdown files to research database
 * Updated: 2026-02-06 14:50 KST (force redeploy)
 */
export async function GET() {
  const result: SyncResult = {
    added: 0,
    skipped: 0,
    errors: [],
    details: {
      foldersCreated: [],
      stocksAdded: [],
      stocksSkipped: [],
    },
  };

  try {
    // Read markdown files from data folder (repo root)
    const dataDir = join(process.cwd(), 'data');
    const usFilePath = join(dataDir, '관심종목-미장.md');
    const krFilePath = join(dataDir, '관심종목-국장.md');

    let usContent = '';
    let krContent = '';

    try {
      usContent = await readFile(usFilePath, 'utf-8');
    } catch (error) {
      result.errors.push(`Failed to read 관심종목-미장.md: ${error}`);
    }

    try {
      krContent = await readFile(krFilePath, 'utf-8');
    } catch (error) {
      result.errors.push(`Failed to read 관심종목-국장.md: ${error}`);
    }

    // Parse stocks
    const usStocks = usContent ? parseMarkdown(usContent, '미장') : [];
    const krStocks = krContent ? parseMarkdown(krContent, '국장') : [];
    const allStocks = [...usStocks, ...krStocks];

    if (allStocks.length === 0) {
      result.errors.push('No stocks found in markdown files');
      return NextResponse.json(result);
    }

    // Group stocks by folder path: "미장 > (1) 보유 종목"
    const folderMap = new Map<string, ParsedStock[]>();

    for (const stock of allStocks) {
      const folderPath = `${stock.marketType} > ${stock.category}`;
      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, []);
      }
      folderMap.get(folderPath)!.push(stock);
    }

    // Process each folder
    for (const [folderPath, stocks] of Array.from(folderMap.entries())) {
      try {
        // Find or create folder
        let folder = await prisma.researchFolder.findFirst({
          where: { name: folderPath },
        });

        if (!folder) {
          folder = await prisma.researchFolder.create({
            data: { name: folderPath },
          });
          result.details.foldersCreated.push(folderPath);
        }

        // Add stocks to folder
        for (const stock of stocks) {
          try {
            // Check if stock already exists
            const existing = await prisma.researchStock.findUnique({
              where: {
                ticker_market: {
                  ticker: stock.ticker,
                  market: stock.market,
                },
              },
            });

            if (existing) {
              result.skipped++;
              result.details.stocksSkipped.push(`${stock.ticker} (${stock.name})`);
              continue;
            }

            // Create new stock
            await prisma.researchStock.create({
              data: {
                ticker: stock.ticker,
                name: stock.name,
                market: stock.market,
                folderId: folder.id,
              },
            });

            result.added++;
            result.details.stocksAdded.push(`${stock.ticker} (${stock.name})`);
          } catch (error) {
            result.errors.push(`Failed to add ${stock.ticker}: ${error}`);
          }
        }
      } catch (error) {
        result.errors.push(`Failed to process folder ${folderPath}: ${error}`);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync watchlist error:', error);
    result.errors.push(`Unexpected error: ${error}`);
    return NextResponse.json(result, { status: 500 });
  }
}

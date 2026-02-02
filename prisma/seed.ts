import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface PortfolioItem {
  id: number;
  market: string;
  sector: string;
  code: string;
  name: string;
  targetWeight: number;
  buyPrice?: number;
  currentPrice: number;
  holdingQty: number;
  memo?: string;
}

interface AccountData {
  portfolio: PortfolioItem[];
  totalInvestment: string;
  cash: Record<string, number>;
  cashTargetWeights: Record<string, number>;
  cashMemos: Record<string, string>;
}

interface ImportData {
  accountData: Record<string, AccountData>;
  exchangeRateUSD: number;
  exportedAt: string;
}

const ACCOUNT_NAMES: Record<string, string> = {
  jinwon: '진원',
  dad: '아빠',
  lion: '리온',
};

async function main() {
  console.log('Starting seed...');

  // JSON 파일 읽기
  const jsonPath = path.resolve(__dirname, '../../portfolio_modified.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`JSON file not found: ${jsonPath}`);
    console.log('Looking in current directory...');
    const altPath = path.resolve(process.cwd(), '../portfolio_modified.json');
    if (!fs.existsSync(altPath)) {
      console.error('Portfolio JSON file not found');
      return;
    }
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data: ImportData = JSON.parse(rawData);

  console.log(`Found ${Object.keys(data.accountData).length} accounts`);

  // 기존 데이터 삭제
  console.log('Clearing existing data...');
  await prisma.trade.deleteMany();
  await prisma.realizedPnL.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.cashHolding.deleteMany();
  await prisma.account.deleteMany();
  await prisma.exchangeRate.deleteMany();

  // 환율 저장
  console.log('Saving exchange rate...');
  await prisma.exchangeRate.create({
    data: {
      currency: 'USD',
      rate: data.exchangeRateUSD,
    },
  });

  // 계정별 데이터 저장
  for (const [accountId, accountData] of Object.entries(data.accountData)) {
    console.log(`Processing account: ${accountId}`);

    // 계정 생성
    const account = await prisma.account.create({
      data: {
        accountId,
        name: ACCOUNT_NAMES[accountId] || accountId,
      },
    });

    // 포트폴리오 종목 저장
    for (const stock of accountData.portfolio) {
      await prisma.stock.create({
        data: {
          accountId: account.id,
          market: stock.market,
          sector: stock.sector,
          code: stock.code,
          name: stock.name,
          targetWeight: stock.targetWeight || 0,
          buyPrice: stock.buyPrice || 0,
          currentPrice: stock.currentPrice || 0,
          holdingQty: stock.holdingQty || 0,
          memo: stock.memo || null,
        },
      });
    }

    console.log(`  - Added ${accountData.portfolio.length} stocks`);

    // 현금 저장
    const markets = ['KR', 'US', 'CRYPTO'];
    for (const market of markets) {
      const amount = accountData.cash[market] || 0;
      const targetWeight = accountData.cashTargetWeights?.[market] || 0;
      const memo = accountData.cashMemos?.[market] || null;

      await prisma.cashHolding.create({
        data: {
          accountId: account.id,
          market,
          amount,
          targetWeight,
          memo,
        },
      });
    }

    console.log(`  - Added cash holdings`);

    // 실현손익 초기화
    await prisma.realizedPnL.create({
      data: {
        accountId: account.id,
        market: 'KR',
        amount: 0,
      },
    });
    await prisma.realizedPnL.create({
      data: {
        accountId: account.id,
        market: 'US',
        amount: 0,
      },
    });

    console.log(`  - Initialized realized PnL`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

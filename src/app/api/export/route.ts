import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/export - 전체 데이터 내보내기
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        portfolio: true,
        cashHoldings: true,
        realizedPnL: true,
      },
    });

    const trades = await prisma.trade.findMany({
      orderBy: { date: 'desc' },
    });

    const journal = await prisma.journalEntry.findMany();

    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: { currency: 'USD' },
    });

    // 기존 형식과 호환되는 형태로 변환
    const accountData: Record<string, unknown> = {};

    for (const account of accounts) {
      accountData[account.accountId] = {
        accountName: account.name, // 계정 표시 이름 추가
        portfolio: account.portfolio.map((stock) => ({
          id: stock.id,
          market: stock.market,
          sector: stock.sector,
          code: stock.code,
          name: stock.name,
          targetWeight: stock.targetWeight,
          buyPrice: stock.buyPrice,
          currentPrice: stock.currentPrice,
          holdingQty: stock.holdingQty,
          memo: stock.memo,
        })),
        cash: account.cashHoldings.reduce((acc, c) => {
          acc[c.market] = c.amount;
          return acc;
        }, {} as Record<string, number>),
        cashTargetWeights: account.cashHoldings.reduce((acc, c) => {
          acc[c.market] = c.targetWeight;
          return acc;
        }, {} as Record<string, number>),
        cashMemos: account.cashHoldings.reduce((acc, c) => {
          acc[c.market] = c.memo || '';
          return acc;
        }, {} as Record<string, string>),
        realizedPnL: account.realizedPnL.reduce((acc, r) => {
          acc[r.market] = r.amount;
          return acc;
        }, {} as Record<string, number>),
      };
    }

    const journalData: Record<string, string> = {};
    journal.forEach((entry) => {
      journalData[entry.date] = entry.content;
    });

    const exportData = {
      accountData,
      journalData,
      tradeHistory: trades.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        account: accounts.find((a) => a.id === t.accountId)?.accountId,
        type: t.type,
        market: t.market,
        code: t.code,
        name: t.name,
        price: t.price,
        qty: t.qty,
        amount: t.amount,
        pnl: t.pnl,
      })),
      exchangeRateUSD: exchangeRate?.rate || 1350,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Failed to export data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

// DELETE /api/export - 전체 데이터 삭제
export async function DELETE() {
  try {
    // 순서대로 삭제 (외래키 제약조건 고려)
    await prisma.trade.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.cashHolding.deleteMany();
    await prisma.realizedPnL.deleteMany();
    await prisma.journalEntry.deleteMany();
    await prisma.snapshot.deleteMany();
    await prisma.account.deleteMany();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete all data:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}

// POST /api/export - 데이터 가져오기 (import)
// mode: 'overwrite' (기본) - 기존 데이터 덮어쓰기
// mode: 'merge' - 기존 데이터 유지, 새 데이터만 추가
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { accountData, journalData, exchangeRateUSD, mode = 'overwrite' } = data;
    const isMergeMode = mode === 'merge';

    // 계정 데이터 가져오기
    if (accountData) {
      for (const [accountId, accData] of Object.entries(accountData)) {
        const acc = accData as {
          accountName?: string; // 계정 표시 이름
          portfolio?: Array<{
            market: string;
            sector: string;
            code: string;
            name: string;
            targetWeight?: number;
            buyPrice?: number;
            currentPrice?: number;
            holdingQty?: number;
            memo?: string;
          }>;
          cash?: Record<string, number>;
          cashTargetWeights?: Record<string, number>;
          cashMemos?: Record<string, string>;
          realizedPnL?: Record<string, number>;
        };

        // 계정 표시 이름 결정 (JSON에 있으면 사용, 없으면 기본값)
        const displayName = acc.accountName ||
          (accountId === 'jinwon' ? '진원' :
           accountId === 'dad' ? '아빠' :
           accountId === 'lion' ? '리온' : accountId);

        // 계정 생성 또는 조회
        let account = await prisma.account.findUnique({
          where: { accountId },
        });

        if (!account) {
          account = await prisma.account.create({
            data: { accountId, name: displayName },
          });
        } else if (acc.accountName && account.name !== acc.accountName) {
          // 이름이 다르면 업데이트
          account = await prisma.account.update({
            where: { accountId },
            data: { name: acc.accountName },
          });
        }

        // 포트폴리오 가져오기
        if (acc.portfolio) {
          for (const stock of acc.portfolio) {
            // 병합 모드: 기존 종목이 있으면 건너뛰기
            if (isMergeMode) {
              const existing = await prisma.stock.findUnique({
                where: {
                  accountId_code_market: {
                    accountId: account.id,
                    code: stock.code,
                    market: stock.market,
                  },
                },
              });
              if (existing) continue; // 기존 데이터 유지
            }

            await prisma.stock.upsert({
              where: {
                accountId_code_market: {
                  accountId: account.id,
                  code: stock.code,
                  market: stock.market,
                },
              },
              create: {
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
              update: {
                sector: stock.sector,
                name: stock.name,
                targetWeight: stock.targetWeight || 0,
                buyPrice: stock.buyPrice || 0,
                currentPrice: stock.currentPrice || 0,
                holdingQty: stock.holdingQty || 0,
                memo: stock.memo || null,
              },
            });
          }
        }

        // 현금 가져오기
        const markets = ['KR', 'US', 'CRYPTO'];
        for (const market of markets) {
          // 병합 모드: 기존 현금 데이터가 있으면 건너뛰기
          if (isMergeMode) {
            const existing = await prisma.cashHolding.findUnique({
              where: { accountId_market: { accountId: account.id, market } },
            });
            if (existing && existing.amount > 0) continue;
          }

          await prisma.cashHolding.upsert({
            where: {
              accountId_market: { accountId: account.id, market },
            },
            create: {
              accountId: account.id,
              market,
              amount: acc.cash?.[market] || 0,
              targetWeight: acc.cashTargetWeights?.[market] || 0,
              memo: acc.cashMemos?.[market] || null,
            },
            update: {
              amount: acc.cash?.[market] || 0,
              targetWeight: acc.cashTargetWeights?.[market] || 0,
              memo: acc.cashMemos?.[market] || null,
            },
          });
        }

        // 실현손익 가져오기
        for (const market of ['KR', 'US']) {
          if (acc.realizedPnL?.[market] !== undefined) {
            await prisma.realizedPnL.upsert({
              where: {
                accountId_market: { accountId: account.id, market },
              },
              create: {
                accountId: account.id,
                market,
                amount: acc.realizedPnL[market],
              },
              update: {
                amount: acc.realizedPnL[market],
              },
            });
          }
        }
      }
    }

    // 매매일지 가져오기
    if (journalData) {
      for (const [date, content] of Object.entries(journalData)) {
        if (content && typeof content === 'string') {
          // 병합 모드: 기존 일지가 있으면 건너뛰기
          if (isMergeMode) {
            const existing = await prisma.journalEntry.findUnique({
              where: { date },
            });
            if (existing) continue;
          }

          await prisma.journalEntry.upsert({
            where: { date },
            create: { date, content },
            update: { content },
          });
        }
      }
    }

    // 환율 저장
    if (exchangeRateUSD) {
      await prisma.exchangeRate.upsert({
        where: { currency: 'USD' },
        create: { currency: 'USD', rate: exchangeRateUSD },
        update: { rate: exchangeRateUSD },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to import data:', error);
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}

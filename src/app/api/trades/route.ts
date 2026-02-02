import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// KST 기준 거래일 계산 (오전 8시 기준)
function getTradingDate(date: Date): string {
  // UTC를 KST로 변환 (UTC+9)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const hours = kstDate.getUTCHours();

  // 8시 이전이면 전날로 처리
  if (hours < 8) {
    kstDate.setUTCDate(kstDate.getUTCDate() - 1);
  }

  return kstDate.toISOString().split('T')[0];
}

// GET /api/trades?accountId=xxx&date=xxx&startDate=xxx&endDate=xxx - 거래 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const date = searchParams.get('date'); // 특정 날짜
    const startDate = searchParams.get('startDate'); // 시작 날짜
    const endDate = searchParams.get('endDate'); // 종료 날짜
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { accountId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 날짜 필터 조건 생성
    let dateFilter = {};
    if (date) {
      // 특정 날짜의 거래 (KST 8시 기준)
      const startOfDay = new Date(`${date}T00:00:00+09:00`);
      startOfDay.setHours(startOfDay.getHours() - 1); // 전날 23:00 KST = 8:00 KST 시작점
      const endOfDay = new Date(`${date}T00:00:00+09:00`);
      endOfDay.setDate(endOfDay.getDate() + 1);
      endOfDay.setHours(endOfDay.getHours() - 1); // 당일 23:00 KST = 다음날 8:00 KST 시작점

      dateFilter = {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      };
    } else if (startDate || endDate) {
      dateFilter = {
        date: {
          ...(startDate && { gte: new Date(`${startDate}T00:00:00+09:00`) }),
          ...(endDate && { lt: new Date(`${endDate}T23:59:59+09:00`) }),
        },
      };
    }

    const trades = await prisma.trade.findMany({
      where: {
        accountId: account.id,
        ...dateFilter,
      },
      orderBy: { date: 'desc' },
      take: limit,
    });

    // 각 거래에 거래일(tradingDate) 추가
    const tradesWithTradingDate = trades.map((trade) => ({
      ...trade,
      tradingDate: getTradingDate(trade.date),
    }));

    return NextResponse.json(tradesWithTradingDate);
  } catch (error) {
    console.error('Failed to fetch trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

// POST /api/trades - 거래 기록 (매수/매도/입금/출금/환전)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, type, ...tradeData } = body;

    if (!accountId || !type) {
      return NextResponse.json({ error: 'accountId and type are required' }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { accountId },
      include: { cashHoldings: true, realizedPnL: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 거래 기록 생성 (사용자 지정 날짜 또는 현재 시간)
    const tradeDate = tradeData.date ? new Date(tradeData.date) : new Date();
    delete tradeData.date; // date는 별도로 처리했으므로 제거

    // 매수/매도 시 Stock 업데이트 및 실현손익 계산
    let calculatedPnl = tradeData.pnl;
    let tradeBuyPrice = tradeData.buyPrice;

    if ((type === 'buy' || type === 'sell') && tradeData.code && tradeData.market) {
      const { code, market, price, qty, sector, name } = tradeData;

      // 기존 Stock 조회
      const existingStock = await prisma.stock.findUnique({
        where: {
          accountId_code_market: {
            accountId: account.id,
            code,
            market,
          },
        },
      });

      if (type === 'buy') {
        if (existingStock) {
          // 기존 보유 종목 - 평균매수가 재계산
          const totalCost = existingStock.buyPrice * existingStock.holdingQty + price * qty;
          const totalQty = existingStock.holdingQty + qty;
          const newAvgPrice = totalQty > 0 ? totalCost / totalQty : price;

          await prisma.stock.update({
            where: {
              accountId_code_market: {
                accountId: account.id,
                code,
                market,
              },
            },
            data: {
              buyPrice: newAvgPrice,
              holdingQty: totalQty,
            },
          });
        } else {
          // 신규 종목 추가
          await prisma.stock.create({
            data: {
              accountId: account.id,
              market,
              sector: sector || 'ETC',
              code,
              name,
              buyPrice: price,
              holdingQty: qty,
              currentPrice: price,
            },
          });
        }
      } else if (type === 'sell') {
        if (existingStock) {
          // 매도 시 실현손익 계산
          tradeBuyPrice = existingStock.buyPrice;
          calculatedPnl = (price - existingStock.buyPrice) * qty;

          // 보유수량 감소
          const newQty = existingStock.holdingQty - qty;

          if (newQty <= 0) {
            // 전량 매도 시 수량 0으로 (종목은 유지)
            await prisma.stock.update({
              where: {
                accountId_code_market: {
                  accountId: account.id,
                  code,
                  market,
                },
              },
              data: {
                holdingQty: 0,
              },
            });
          } else {
            await prisma.stock.update({
              where: {
                accountId_code_market: {
                  accountId: account.id,
                  code,
                  market,
                },
              },
              data: {
                holdingQty: newQty,
              },
            });
          }
        }
      }
    }

    // 거래 기록 생성 (계산된 pnl과 buyPrice 포함)
    // sector는 Stock용이므로 Trade에서 제외
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sector: _sector, ...tradeDataWithoutSector } = tradeData;
    const trade = await prisma.trade.create({
      data: {
        accountId: account.id,
        type,
        date: tradeDate,
        ...tradeDataWithoutSector,
        pnl: calculatedPnl,
        buyPrice: tradeBuyPrice,
      },
    });

    // 매도 시 실현손익 업데이트
    if (type === 'sell' && calculatedPnl !== undefined && calculatedPnl !== null) {
      const market = tradeData.market;
      await prisma.realizedPnL.upsert({
        where: {
          accountId_market: { accountId: account.id, market },
        },
        create: {
          accountId: account.id,
          market,
          amount: calculatedPnl,
        },
        update: {
          amount: { increment: calculatedPnl },
        },
      });
    }

    // 입금/출금/환전 시 현금 업데이트
    if (type === 'deposit') {
      const market = tradeData.market;
      await prisma.cashHolding.upsert({
        where: {
          accountId_market: { accountId: account.id, market },
        },
        create: {
          accountId: account.id,
          market,
          amount: tradeData.amount,
        },
        update: {
          amount: { increment: tradeData.amount },
        },
      });
    }

    if (type === 'withdraw') {
      const market = tradeData.market;
      await prisma.cashHolding.update({
        where: {
          accountId_market: { accountId: account.id, market },
        },
        data: {
          amount: { decrement: tradeData.amount },
        },
      });
    }

    if (type === 'exchange') {
      const { direction, fromAmount, toAmount } = tradeData;
      if (direction === 'KR_TO_US') {
        await prisma.cashHolding.update({
          where: { accountId_market: { accountId: account.id, market: 'KR' } },
          data: { amount: { decrement: fromAmount } },
        });
        await prisma.cashHolding.update({
          where: { accountId_market: { accountId: account.id, market: 'US' } },
          data: { amount: { increment: toAmount } },
        });
      } else {
        await prisma.cashHolding.update({
          where: { accountId_market: { accountId: account.id, market: 'US' } },
          data: { amount: { decrement: fromAmount } },
        });
        await prisma.cashHolding.update({
          where: { accountId_market: { accountId: account.id, market: 'KR' } },
          data: { amount: { increment: toAmount } },
        });
      }
    }

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error('Failed to create trade:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}

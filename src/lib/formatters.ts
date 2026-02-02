// 숫자 포맷팅 유틸리티

export function formatKRW(num: number): string {
  return Math.round(num).toLocaleString('ko-KR') + ' 원';
}

export function formatUSD(num: number): string {
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

export function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return sign + num.toFixed(2) + '%';
}

export function parseNumberInput(str: string): number {
  if (!str) return 0;
  return Number(str.replace(/[^\d.]/g, '')) || 0;
}

export function formatCurrency(value: number, market: string): string {
  if (market === 'US') {
    return formatUSD(Math.abs(value));
  }
  return formatKRW(Math.abs(value));
}

export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

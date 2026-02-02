'use client';

import { useSectorStore } from '@/stores/useSectorStore';

interface BadgeProps {
  type: 'market' | 'sector';
  value: string;
}

const marketStyles: Record<string, { background: string }> = {
  KR: { background: '#2196f3' },
  US: { background: '#4caf50' },
  CRYPTO: { background: '#ff9800' },
};

const marketLabels: Record<string, string> = {
  KR: '국내',
  US: '해외',
  CRYPTO: '크립토',
};

// 색상을 어둡게 만드는 함수
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export function Badge({ type, value }: BadgeProps) {
  const { getSectorName, getSectorColor } = useSectorStore();

  if (type === 'market') {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={marketStyles[value] || { background: '#6b7280' }}
      >
        {marketLabels[value] || value}
      </span>
    );
  }

  const sectorColor = getSectorColor(value);
  const sectorName = getSectorName(value);
  const gradient = `linear-gradient(to right, ${sectorColor}, ${darkenColor(sectorColor, 15)})`;

  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ background: gradient }}
    >
      {sectorName}
    </span>
  );
}

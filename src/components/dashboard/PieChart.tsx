'use client';

interface PieChartItem {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  items: PieChartItem[];
  total: number;
  centerLabel?: string;
  centerValue?: string;
  gridLegend?: boolean; // 범례를 그리드로 표시 (종목이 많을 때)
  maxLegendHeight?: number; // 범례 최대 높이 (px)
}

export function PieChart({ items, total, centerLabel, centerValue, gridLegend, maxLegendHeight }: PieChartProps) {
  if (total === 0 || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#666]">
        데이터 없음
      </div>
    );
  }

  // 그라데이션 생성
  let currentAngle = 0;
  const gradientParts: string[] = [];

  items.forEach((item) => {
    if (item.value > 0) {
      const pct = (item.value / total) * 100;
      const startAngle = currentAngle;
      const endAngle = currentAngle + pct * 3.6;
      gradientParts.push(`${item.color} ${startAngle}deg ${endAngle}deg`);
      currentAngle = endAngle;
    }
  });

  const gradient =
    gradientParts.length > 0
      ? `conic-gradient(${gradientParts.join(', ')})`
      : 'rgba(255,255,255,0.1)';

  const visibleItems = items.filter((item) => item.value > 0);

  return (
    <div className="flex items-center justify-center gap-6">
      {/* 파이 차트 */}
      <div
        className="w-36 h-36 rounded-full relative shrink-0"
        style={{ background: gradient }}
      >
        {/* 중앙 원 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70px] h-[70px] bg-[#1a1a2e] rounded-full flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-base font-semibold text-[#4fc3f7]">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[10px] text-[#888]">{centerLabel}</span>
          )}
        </div>
      </div>

      {/* 범례 */}
      <div
        className={gridLegend
          ? "grid grid-cols-2 gap-x-3 gap-y-1 overflow-y-auto"
          : "flex flex-col gap-2 overflow-y-auto"
        }
        style={{ maxHeight: maxLegendHeight ? `${maxLegendHeight}px` : gridLegend ? '120px' : '140px' }}
      >
        {visibleItems.map((item) => {
          const pct = (item.value / total) * 100;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-xs text-[#aaa] truncate max-w-[60px]" title={item.label}>
                {item.label.length > 8 ? item.label.substring(0, 8) : item.label}
              </span>
              <span className="text-xs font-medium text-white whitespace-nowrap">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

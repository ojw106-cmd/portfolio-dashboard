'use client';

export function InvestmentPrinciplesView() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">투자 원칙</h1>
        <p className="text-[#888]">투자 대전제 & 룰북</p>
      </div>

      {/* 1. 투자 대전제 Thesis */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">💡 투자 대전제 Thesis</h2>
        <div className="space-y-4 text-[#ccc]">
          <div>
            <h3 className="text-lg font-semibold text-[#4fc3f7] mb-2">
              내 장점이 있는 장기 세상변화 인사이트
            </h3>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-sm text-[#888]">
                (여기에 형의 인사이트를 작성합니다)
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>AI 발전 → 메모리/반도체 수요 폭발</li>
                <li>미중 갈등 → 미국 생산기지화 → 로봇 자동화 필수</li>
                <li>광학 기술의 중요성 증대 (AI 병목)</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#4fc3f7] mb-2">
              레짐 변화 뷰
            </h3>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-sm text-[#888]">
                (현재 시장 레짐에 대한 뷰를 작성합니다)
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>국장: 코스닥 3000 정책 → 미드베타로 자금 이동</li>
                <li>미장: AI 투자 Capex 지속 → 성장주 선호</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 투자 룰북 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">📋 투자 룰북</h2>
        <div className="space-y-4">
          {/* 자금 관리 */}
          <div>
            <h3 className="text-lg font-semibold text-[#4fc3f7] mb-2">자금 관리</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-[#ccc]">
                <li>예비비: 총 자금의 일정 비율 고정 (고정 예비비 절대 손대지 않음 🔒)</li>
                <li>투자 시드: 미장 50% / 국장 50%</li>
                <li>각 시장별 배분: 장기 60% / 중단타 30% / 현금 10%</li>
              </ul>
            </div>
          </div>

          {/* 비중 제한 */}
          <div>
            <h3 className="text-lg font-semibold text-[#4fc3f7] mb-2">비중 제한</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-[#ccc]">
                <li><strong>장기투자:</strong> 1종목 최대 40% / 1테마 최대 50%</li>
                <li><strong>중단타:</strong> 1종목 최대 25%</li>
                <li><strong>현금:</strong> 1종목 최대 50% (별도 슬롯)</li>
              </ul>
            </div>
          </div>

          {/* 슬롯 관리 */}
          <div>
            <h3 className="text-lg font-semibold text-[#4fc3f7] mb-2">슬롯 관리</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-[#ccc]">
                <li>장기투자: 최대 5개 슬롯</li>
                <li>중단타: 최대 7개 슬롯</li>
                <li>현금: 최대 3개 슬롯</li>
              </ul>
            </div>
          </div>

          {/* 매매 원칙 */}
          <div>
            <h3 className="text-lg font-semibold text-[#4fc3f7] mb-2">매매 원칙</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-[#ccc]">
                <li>액션 전 다송과 최소 2번 이상 논의 ✅</li>
                <li>테시스 기반 투자 (확신도 7/10 이상)</li>
                <li>손절 라인 사전 설정 필수</li>
                <li>2배 레버리지 ETF 사용 금지 (승률 25%)</li>
                <li>분할 매수/매도 원칙</li>
              </ul>
            </div>
          </div>

          {/* 금지 사항 */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">🚫 금지 사항</h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-red-300">
                <li>충동 매수 (리얼치킨보이 포스팅 보고 딸깍)</li>
                <li>테시스 불명확한 투자 ("잘 모르겠음")</li>
                <li>손절 라인 없는 투자</li>
                <li>2x 레버리지 ETF 남용</li>
                <li>FOMO 매매</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">📝 편집 안내</h3>
        <p className="text-sm text-[#888]">
          이 페이지의 내용은 <code className="bg-white/10 px-2 py-1 rounded text-[#4fc3f7]">투자-룰북.txt</code> 파일과 동기화됩니다.
          <br />
          내용 수정은 다송에게 요청하거나 파일을 직접 편집하세요.
        </p>
      </div>
    </div>
  );
}

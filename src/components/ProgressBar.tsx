import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface ProgressBarProps {
  total: number;
  current: number;
  currentMarket?: string;
  completedMarkets?: string[];
}

export function ProgressBar({
  total,
  current,
  currentMarket,
  completedMarkets = [],
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          백테스트 진행 중
        </h4>
        <span className="text-gray-300 text-sm">
          {current} / {total} 마켓
        </span>
      </div>

      {/* 프로그래스 바 */}
      <div className="relative w-full h-3 bg-gray-600 rounded-full overflow-hidden mb-3">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">진행률</span>
        <span className="text-white font-semibold">{percentage}%</span>
      </div>

      {/* 현재 처리 중인 마켓 */}
      {currentMarket && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-gray-400 text-xs mb-1">현재 처리 중</p>
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
            <span className="text-white text-sm font-medium">{currentMarket}</span>
          </div>
        </div>
      )}

      {/* 완료된 마켓 목록 (최근 5개만) */}
      {completedMarkets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-gray-400 text-xs mb-2">최근 완료</p>
          <div className="flex flex-wrap gap-1">
            {completedMarkets.slice(-5).map((market, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 rounded px-2 py-0.5"
              >
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-300 text-xs">
                  {market.replace("KRW-", "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대기 중인 마켓 수 */}
      {total - current > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Circle className="w-3 h-3 text-gray-500" />
          <span className="text-gray-400">대기 중: {total - current}개</span>
        </div>
      )}
    </div>
  );
}

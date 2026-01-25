import React, { useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { BacktestForm } from "./BacktestForm";
import { BacktestResultPanel } from "./BacktestResultPanel";
import type { BacktestResult } from "../../types";

export const BacktestPage: React.FC = () => {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">백테스트</h1>
      </div>

      {/* 백테스트 폼 */}
      <BacktestForm onResult={setResult} onLoading={setLoading} />

      {/* 로딩 상태 */}
      {loading && (
        <div className="bg-gray-800 rounded-xl p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <p className="mt-4 text-gray-400">백테스트 실행 중...</p>
            <p className="text-sm text-gray-500 mt-2">
              데이터 양에 따라 시간이 소요될 수 있습니다
            </p>
          </div>
        </div>
      )}

      {/* 결과 */}
      {!loading && result && <BacktestResultPanel result={result} />}

      {/* 초기 상태 */}
      {!loading && !result && (
        <div className="bg-gray-800 rounded-xl p-12">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">백테스트를 실행하여 결과를 확인하세요</p>
            <p className="text-sm mt-2 text-gray-500">
              전략, 마켓, 기간을 선택하고 실행 버튼을 클릭하세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestPage;

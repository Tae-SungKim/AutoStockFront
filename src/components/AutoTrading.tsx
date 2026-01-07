import { useState } from 'react';
import { Bot, Play, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { upbitApi } from '../api/upbitApi';

export function AutoTrading() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await upbitApi.executeAutoTrading();
      setResult(response);
    } catch (err: any) {
      setResult({ status: 'error', message: err.response?.data?.message || '자동매매 실행 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">자동매매</h2>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="mb-2">자동매매는 다음 전략들을 분석하여 매매 신호를 생성합니다:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>골든크로스 전략 (단기/장기 이동평균선)</li>
              <li>볼린저밴드 전략 (상/하단 터치)</li>
              <li>RSI 전략 (과매수/과매도 구간)</li>
            </ul>
            <p className="mt-2 text-yellow-400">과반수 이상의 전략이 동일한 신호를 보내면 매매가 실행됩니다.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">대상 마켓</p>
          <p className="text-white font-bold">KRW-BTC</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">투자 비율</p>
          <p className="text-white font-bold">10%</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">최소 주문</p>
          <p className="text-white font-bold">₩5,000</p>
        </div>
      </div>

      {result && (
        <div className={'flex items-center gap-3 p-4 rounded-lg mb-6 ' + (result.status === 'executed' || result.status === 'success' ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50')}>
          {result.status === 'executed' || result.status === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <p className={'text-sm ' + (result.status === 'executed' || result.status === 'success' ? 'text-green-400' : 'text-red-400')}>{result.message}</p>
        </div>
      )}

      <button
        onClick={handleExecute}
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-800 disabled:to-blue-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>분석 중...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>자동매매 실행</span>
          </>
        )}
      </button>

      <p className="text-center text-gray-500 text-xs mt-4">* 자동매매 실행 결과는 서버 로그에서 확인할 수 있습니다.</p>
    </div>
  );
}

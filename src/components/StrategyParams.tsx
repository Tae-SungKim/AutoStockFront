import React, { useState, useEffect } from "react";
import { strategyParamService } from "../api/upbitApi";
import type { StrategyParamDetail, StrategyParamSummary } from "../types";
import {
  Settings,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

const StrategyParams: React.FC = () => {
  const [strategies, setStrategies] = useState<string[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [params, setParams] = useState<StrategyParamDetail[]>([]);
  const [summary, setSummary] = useState<StrategyParamSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, string>>({});

  const fetchStrategies = async () => {
    try {
      const data = await strategyParamService.getStrategies();
      setStrategies(data);
      if (data.length > 0 && !selectedStrategy) {
        setSelectedStrategy(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await strategyParamService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  const fetchParams = async (strategyName: string) => {
    try {
      setLoading(true);
      const data = await strategyParamService.getParamDetails(strategyName);
      setParams(data);
      setEditedParams({});
    } catch (error) {
      console.error("Failed to fetch params:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedStrategy) {
      fetchParams(selectedStrategy);
      setExpandedStrategy(selectedStrategy);
    }
  }, [selectedStrategy]);

  const handleParamChange = (key: string, value: string) => {
    setEditedParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveParam = async (key: string) => {
    if (!editedParams[key]) return;

    try {
      setSaving(true);
      const result = await strategyParamService.updateParam(
        selectedStrategy,
        key,
        editedParams[key]
      );
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        fetchParams(selectedStrategy);
        fetchSummary();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "파라미터 저장에 실패했습니다." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveAll = async () => {
    if (Object.keys(editedParams).length === 0) return;

    try {
      setSaving(true);
      const result = await strategyParamService.updateParams(
        selectedStrategy,
        editedParams
      );
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        fetchParams(selectedStrategy);
        fetchSummary();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "파라미터 저장에 실패했습니다." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleResetAll = async () => {
    if (!confirm("모든 파라미터를 기본값으로 초기화하시겠습니까?")) return;

    try {
      setSaving(true);
      const result = await strategyParamService.resetParams(selectedStrategy);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        fetchParams(selectedStrategy);
        fetchSummary();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "초기화에 실패했습니다." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleResetParam = async (key: string) => {
    try {
      setSaving(true);
      const result = await strategyParamService.resetParam(
        selectedStrategy,
        key
      );
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        fetchParams(selectedStrategy);
        fetchSummary();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "초기화에 실패했습니다." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getParamValue = (param: StrategyParamDetail) => {
    return editedParams[param.key] !== undefined
      ? editedParams[param.key]
      : param.value;
  };

  const isParamEdited = (key: string) => {
    return editedParams[key] !== undefined;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-purple-500" />
          전략 파라미터 설정
        </h1>
        {Object.keys(editedParams).length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditedParams({})}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <X size={18} /> 취소
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              <Save size={18} /> 전체 저장
            </button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message.type === "success" ? (
            <Check size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          {message.text}
        </div>
      )}

      {/* Strategy Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {strategies.map((strategy) => {
            const info = summary[strategy];
            return (
              <button
                key={strategy}
                onClick={() => setSelectedStrategy(strategy)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedStrategy === strategy
                    ? "bg-purple-50 border-purple-300 shadow-md"
                    : "bg-white border-gray-200 hover:border-purple-200"
                }`}
              >
                <p className="font-medium text-gray-800 text-sm truncate">
                  {strategy.replace("Strategy", "")}
                </p>
                {info && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>파라미터: {info.totalParams}개</p>
                    <p
                      className={
                        info.customParams > 0
                          ? "text-purple-600"
                          : "text-gray-400"
                      }
                    >
                      커스텀: {info.customParams}개
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Parameter Editor */}
      {selectedStrategy && (
        <div className="bg-white rounded-lg shadow border border-gray-100">
          <div
            className="flex justify-between items-center p-4 border-b cursor-pointer"
            onClick={() =>
              setExpandedStrategy(
                expandedStrategy === selectedStrategy ? null : selectedStrategy
              )
            }
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedStrategy}
              </h2>
              {summary && summary[selectedStrategy] && (
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                  {summary[selectedStrategy].customParams}개 커스텀
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetAll();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <RotateCcw size={14} /> 전체 초기화
              </button>
              {expandedStrategy === selectedStrategy ? (
                <ChevronUp className="text-gray-400" />
              ) : (
                <ChevronDown className="text-gray-400" />
              )}
            </div>
          </div>

          {expandedStrategy === selectedStrategy && (
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  파라미터 로딩 중...
                </div>
              ) : params.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  설정 가능한 파라미터가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {params.map((param) => (
                    <div
                      key={param.key}
                      className={`p-4 rounded-lg border ${
                        param.isCustom
                          ? "bg-purple-50 border-purple-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <label className="font-medium text-gray-800">
                            {param.name}
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {param.description}
                          </p>
                        </div>
                        {param.isCustom && (
                          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded">
                            커스텀
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        {param.type === "BOOLEAN" ? (
                          <select
                            value={getParamValue(param)}
                            onChange={(e) =>
                              handleParamChange(param.key, e.target.value)
                            }
                            className="flex-1 p-2 border rounded bg-white"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <input
                            type={
                              param.type === "INTEGER" || param.type === "DOUBLE"
                                ? "number"
                                : "text"
                            }
                            step={param.type === "DOUBLE" ? "0.1" : "1"}
                            min={param.minValue}
                            max={param.maxValue}
                            value={getParamValue(param)}
                            onChange={(e) =>
                              handleParamChange(param.key, e.target.value)
                            }
                            className="flex-1 p-2 border rounded"
                          />
                        )}

                        <div className="flex items-center gap-1">
                          {isParamEdited(param.key) && (
                            <button
                              onClick={() => handleSaveParam(param.key)}
                              disabled={saving}
                              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                              title="저장"
                            >
                              <Save size={16} />
                            </button>
                          )}
                          {param.isCustom && (
                            <button
                              onClick={() => handleResetParam(param.key)}
                              disabled={saving}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                              title="기본값으로 복원"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>기본값: {param.defaultValue}</span>
                        {param.minValue !== undefined &&
                          param.maxValue !== undefined && (
                            <span>
                              범위: {param.minValue} ~ {param.maxValue}
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StrategyParams;

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userApi } from "../api/authApi";
import { strategyService } from "../api/upbitApi";
import type { UserStrategy } from "../types";
import {
  Settings,
  Key,
  Lock,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  RefreshCw,
} from "lucide-react";

export function UserSettings() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "keys" | "autotrading" | "password" | "strategies"
  >("keys");

  // Upbit Keys
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysMessage, setKeysMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto Trading
  const [autoTradingLoading, setAutoTradingLoading] = useState(false);
  const [autoTradingMessage, setAutoTradingMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Strategies
  /*const [availableStrategies, setAvailableStrategies] = useState<
    AvailableStrategy[]
  >([]);*/
  const [userStrategies, setUserStrategies] = useState<UserStrategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [strategiesMessage, setStrategiesMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 전략 목록 로드
  const fetchStrategies = async () => {
    try {
      setStrategiesLoading(true);
      setStrategiesMessage(null);
      console.log("Fetching strategies...");

      const [available, userStrats] = await Promise.all([
        strategyService.getAvailableStrategies(),
        strategyService.getUserStrategies(),
      ]);

      console.log("Available strategies:", available);
      console.log("User strategies:", userStrats);

      //setAvailableStrategies(available || []);
      setUserStrategies(userStrats || []);
    } catch (error) {
      console.error("Failed to fetch strategies:", error);
      setStrategiesMessage({
        type: "error",
        text: `전략 목록을 불러오는데 실패했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      });
    } finally {
      setStrategiesLoading(false);
    }
  };

  // 전략 탭 선택 시 데이터 로드
  useEffect(() => {
    if (activeSection === "strategies") {
      fetchStrategies();
    }
  }, [activeSection]);

  // 전략 토글
  const handleToggleStrategy = async (
    strategyName: string,
    enabled: boolean
  ) => {
    try {
      setStrategiesLoading(true);
      await strategyService.toggleStrategy(strategyName, enabled);
      setStrategiesMessage({
        type: "success",
        text: enabled
          ? `${strategyName} 전략이 활성화되었습니다.`
          : `${strategyName} 전략이 비활성화되었습니다.`,
      });
      await fetchStrategies();
    } catch {
      setStrategiesMessage({
        type: "error",
        text: "전략 설정 변경에 실패했습니다.",
      });
    } finally {
      setStrategiesLoading(false);
    }
  };

  // 전략 초기화
  const handleResetStrategies = async () => {
    if (!confirm("정말로 모든 전략 설정을 초기화하시겠습니까?")) return;

    try {
      setStrategiesLoading(true);
      await strategyService.resetStrategies();
      setStrategiesMessage({
        type: "success",
        text: "전략 설정이 초기화되었습니다.",
      });
      await fetchStrategies();
    } catch {
      setStrategiesMessage({
        type: "error",
        text: "전략 초기화에 실패했습니다.",
      });
    } finally {
      setStrategiesLoading(false);
    }
  };

  // 전략이 활성화되어 있는지 확인
  /*const isStrategyEnabled = (strategyName: string): boolean => {
    const userStrategy = userStrategies.find(
      (s) => s.strategyName === strategyName
    );
    return userStrategy?.enabled ?? false;
  };*/

  const handleUpdateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim() || !secretKey.trim()) {
      setKeysMessage({ type: "error", text: "모든 필드를 입력해주세요." });
      return;
    }

    try {
      setKeysLoading(true);
      await userApi.updateUpbitKeys({ accessKey, secretKey });
      setKeysMessage({ type: "success", text: "API 키가 등록되었습니다." });
      setAccessKey("");
      setSecretKey("");
      await refreshUser();
    } catch {
      setKeysMessage({ type: "error", text: "API 키 등록에 실패했습니다." });
    } finally {
      setKeysLoading(false);
    }
  };

  const handleDeleteKeys = async () => {
    if (!confirm("정말로 API 키를 삭제하시겠습니까?")) return;

    try {
      setKeysLoading(true);
      await userApi.deleteUpbitKeys();
      setKeysMessage({ type: "success", text: "API 키가 삭제되었습니다." });
      await refreshUser();
    } catch {
      setKeysMessage({ type: "error", text: "API 키 삭제에 실패했습니다." });
    } finally {
      setKeysLoading(false);
    }
  };

  const handleToggleAutoTrading = async () => {
    try {
      setAutoTradingLoading(true);
      const newEnabled = !user?.autoTradingEnabled;
      await userApi.updateAutoTrading({ enabled: newEnabled });
      setAutoTradingMessage({
        type: "success",
        text: newEnabled
          ? "자동매매가 활성화되었습니다."
          : "자동매매가 비활성화되었습니다.",
      });
      await refreshUser();
    } catch {
      setAutoTradingMessage({
        type: "error",
        text: "자동매매 설정 변경에 실패했습니다.",
      });
    } finally {
      setAutoTradingLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordMessage({ type: "error", text: "모든 필드를 입력해주세요." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "새 비밀번호는 8자 이상이어야 합니다.",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({
        type: "error",
        text: "새 비밀번호가 일치하지 않습니다.",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      await userApi.changePassword({ currentPassword, newPassword });
      setPasswordMessage({
        type: "success",
        text: "비밀번호가 변경되었습니다.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setPasswordMessage({
        type: "error",
        text: "비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderMessage = (
    message: { type: "success" | "error"; text: string } | null
  ) => {
    if (!message) return null;
    return (
      <div
        className={
          "flex items-center gap-2 p-3 rounded-lg mb-4 " +
          (message.type === "success"
            ? "bg-green-500/10 border border-green-500/50"
            : "bg-red-500/10 border border-red-500/50")
        }
      >
        {message.type === "success" ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
        <span
          className={
            "text-sm " +
            (message.type === "success" ? "text-green-400" : "text-red-400")
          }
        >
          {message.text}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">사용자 설정</h2>
      </div>

      {/* 사용자 정보 */}
      <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">아이디</p>
            <p className="text-white font-medium">{user?.username}</p>
          </div>
          <div>
            <p className="text-gray-400">이메일</p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-400">API 키</p>
            <p
              className={
                "font-medium " +
                (user?.hasUpbitKeys ? "text-green-400" : "text-gray-500")
              }
            >
              {user?.hasUpbitKeys ? "등록됨" : "미등록"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">자동매매</p>
            <p
              className={
                "font-medium " +
                (user?.autoTradingEnabled ? "text-green-400" : "text-gray-500")
              }
            >
              {user?.autoTradingEnabled ? "활성화" : "비활성화"}
            </p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection("keys")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 " +
            (activeSection === "keys"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          <Key className="w-4 h-4" />
          API 키
        </button>
        <button
          onClick={() => setActiveSection("autotrading")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 " +
            (activeSection === "autotrading"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          {user?.autoTradingEnabled ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          자동매매
        </button>
        <button
          onClick={() => setActiveSection("password")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 " +
            (activeSection === "password"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          <Lock className="w-4 h-4" />
          비밀번호
        </button>
        <button
          onClick={() => setActiveSection("strategies")}
          className={
            "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 " +
            (activeSection === "strategies"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600")
          }
        >
          <Zap className="w-4 h-4" />
          매매전략
        </button>
      </div>

      {/* API 키 섹션 */}
      {activeSection === "keys" && (
        <div className="space-y-4">
          {renderMessage(keysMessage)}

          {user?.hasUpbitKeys ? (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    API 키가 등록되어 있습니다
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    새로운 키를 등록하면 기존 키가 교체됩니다.
                  </p>
                </div>
                <button
                  onClick={handleDeleteKeys}
                  disabled={keysLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleUpdateKeys} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Access Key
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="Upbit Access Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secret Key
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-12 border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="Upbit Secret Key"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSecretKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={keysLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {keysLoading ? "등록 중..." : "API 키 등록"}
            </button>
          </form>
        </div>
      )}

      {/* 자동매매 섹션 */}
      {activeSection === "autotrading" && (
        <div className="space-y-4">
          {renderMessage(autoTradingMessage)}

          <div className="bg-gray-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-lg">자동매매</p>
                <p className="text-sm text-gray-400 mt-1">
                  {user?.autoTradingEnabled
                    ? "자동매매가 활성화되어 있습니다. 설정된 전략에 따라 자동으로 매매가 진행됩니다."
                    : "자동매매가 비활성화되어 있습니다. 활성화하면 자동으로 매매가 진행됩니다."}
                </p>
              </div>
              <button
                onClick={handleToggleAutoTrading}
                disabled={autoTradingLoading || !user?.hasUpbitKeys}
                className={
                  "relative w-16 h-8 rounded-full transition-colors " +
                  (user?.autoTradingEnabled ? "bg-green-600" : "bg-gray-600") +
                  " " +
                  (!user?.hasUpbitKeys ? "opacity-50 cursor-not-allowed" : "")
                }
              >
                <span
                  className={
                    "absolute top-1 w-6 h-6 bg-white rounded-full transition-transform " +
                    (user?.autoTradingEnabled ? "left-9" : "left-1")
                  }
                />
              </button>
            </div>

            {!user?.hasUpbitKeys && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  자동매매를 사용하려면 먼저 Upbit API 키를 등록해주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 비밀번호 섹션 */}
      {activeSection === "password" && (
        <div className="space-y-4">
          {renderMessage(passwordMessage)}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="현재 비밀번호"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="8자 이상"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500"
                placeholder="새 비밀번호 확인"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {passwordLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      )}

      {/* 매매전략 섹션 */}
      {activeSection === "strategies" && (
        <div className="space-y-4">
          {renderMessage(strategiesMessage)}

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium">매매 전략 설정</p>
              <p className="text-sm text-gray-400 mt-1">
                자동매매에 사용할 전략을 선택하세요. 여러 전략을 동시에 활성화할
                수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchStrategies}
                disabled={strategiesLoading}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="새로고침"
              >
                <RefreshCw
                  className={
                    "w-5 h-5 text-gray-400 " +
                    (strategiesLoading ? "animate-spin" : "")
                  }
                />
              </button>
              <button
                onClick={handleResetStrategies}
                disabled={strategiesLoading}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                초기화
              </button>
            </div>
          </div>

          {userStrategies && userStrategies.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">전략 목록을 불러오는 중...</p>
            </div>
          ) : userStrategies.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              사용 가능한 전략이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {/* 전략 목록 */}
              <div className="grid gap-3">
                {userStrategies.map((strategy) => {
                  const enabled = strategy.enabled;
                  return (
                    <div
                      key={strategy.className}
                      className={
                        "bg-gray-700/50 rounded-lg p-4 border transition-colors " +
                        (enabled ? "border-blue-500/50" : "border-gray-600")
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">
                              {strategy.name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {strategy.className}
                            </span>
                            {enabled && (
                              <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                                활성화
                              </span>
                            )}
                          </div>
                          {strategy.description && (
                            <p className="text-sm text-gray-400 mt-1">
                              {strategy.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleToggleStrategy(strategy.className, !enabled)
                          }
                          disabled={strategiesLoading}
                          className={
                            "relative w-14 h-7 rounded-full transition-colors " +
                            (enabled ? "bg-blue-600" : "bg-gray-600")
                          }
                        >
                          <span
                            className={
                              "absolute top-1 w-5 h-5 bg-white rounded-full transition-transform " +
                              (enabled ? "left-8" : "left-1")
                            }
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 활성화된 전략 요약 */}
              <div className="mt-6 bg-gray-700/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">활성화된 전략</p>
                <div className="flex flex-wrap gap-2">
                  {userStrategies.filter((s) => s.enabled).length === 0 ? (
                    <span className="text-gray-500 text-sm">
                      활성화된 전략이 없습니다.
                    </span>
                  ) : (
                    userStrategies
                      .filter((s) => s.enabled)
                      .map((s) => (
                        <span
                          key={s.strategyName}
                          className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400"
                        >
                          {s.strategyName}
                        </span>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

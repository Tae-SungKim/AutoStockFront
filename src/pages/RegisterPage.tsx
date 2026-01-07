import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserPlus, Eye, EyeOff, AlertCircle, Key, ChevronDown, ChevronUp } from "lucide-react";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showUpbitKeys, setShowUpbitKeys] = useState(false);
  const [upbitAccessKey, setUpbitAccessKey] = useState("");
  const [upbitSecretKey, setUpbitSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!username.trim()) return "아이디를 입력해주세요.";
    if (username.length < 4) return "아이디는 4자 이상이어야 합니다.";
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식이 아닙니다.";
    if (!password.trim()) return "비밀번호를 입력해주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (password !== confirmPassword) return "비밀번호가 일치하지 않습니다.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await register({
        username,
        email,
        password,
        upbitAccessKey: upbitAccessKey || undefined,
        upbitSecretKey: upbitSecretKey || undefined,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">회원가입</h1>
            <p className="text-gray-400 mt-2">Upbit 자동매매 시스템</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                아이디 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="4자 이상 입력"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                이메일 <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-12 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="8자 이상 입력"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="비밀번호를 다시 입력"
                autoComplete="new-password"
              />
            </div>

            {/* Upbit API 키 (선택) */}
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowUpbitKeys(!showUpbitKeys)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-700/50 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Upbit API 키 (선택)</span>
                </div>
                {showUpbitKeys ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showUpbitKeys && (
                <div className="p-4 space-y-4 bg-gray-700/30">
                  <p className="text-xs text-gray-400">
                    나중에 설정 페이지에서 등록할 수도 있습니다.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Access Key
                    </label>
                    <input
                      type="text"
                      value={upbitAccessKey}
                      onChange={(e) => setUpbitAccessKey(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      placeholder="Upbit Access Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      value={upbitSecretKey}
                      onChange={(e) => setUpbitSecretKey(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      placeholder="Upbit Secret Key"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={
                "w-full py-3 rounded-lg font-medium transition-colors " +
                (loading
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700")
              }
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              이미 계정이 있으신가요?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

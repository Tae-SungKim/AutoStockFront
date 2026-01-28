import { Activity, User, LogOut, Settings, Sun, Moon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface-secondary border-b border-line">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 sm:p-2 rounded-lg">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-content">AutoStock</h1>
              <p className="text-xs text-content-secondary hidden sm:block">업비트 자동매매 시스템</p>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Connection Status - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 bg-surface-tertiary/50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-content-secondary">연결됨</span>
            </div>

            {user && (
              <>
                {/* Username - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2 text-content-secondary">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.username}</span>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  title={theme === "dark" ? "라이트 모드" : "다크 모드"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-content-secondary hover:text-content" />
                  ) : (
                    <Moon className="w-5 h-5 text-content-secondary hover:text-content" />
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={onSettingsClick}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                  title="설정"
                >
                  <Settings className="w-5 h-5 text-content-secondary hover:text-content" />
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-surface-tertiary hover:bg-surface-hover text-content-secondary hover:text-content rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">로그아웃</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { Activity, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onSettingsClick?: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AutoStock</h1>
              <p className="text-xs text-gray-400">업비트 자동매매 시스템</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-700/50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">연결됨</span>
            </div>

            {user && (
              <>
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.username}</span>
                </div>

                <button
                  onClick={onSettingsClick}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="설정"
                >
                  <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">로그아웃</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

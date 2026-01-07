import axios from "axios";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserInfo,
  AutoTradingRequest,
  AutoTradingResponse,
  UpbitKeysRequest,
  UpbitKeysResponse,
  PasswordChangeRequest,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: 401 시 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post<AuthResponse>("/api/auth/refresh", {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>("/api/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>("/api/auth/login", data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>("/api/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },
};

export const userApi = {
  getMe: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>("/user/me");
    return response.data;
  },

  updateAutoTrading: async (
    data: AutoTradingRequest
  ): Promise<AutoTradingResponse> => {
    const response = await api.put<AutoTradingResponse>(
      "/user/auto-trading",
      data
    );
    return response.data;
  },

  updateUpbitKeys: async (data: UpbitKeysRequest): Promise<UpbitKeysResponse> => {
    const response = await api.put<UpbitKeysResponse>("/user/upbit-keys", data);
    return response.data;
  },

  deleteUpbitKeys: async (): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>("/user/upbit-keys");
    return response.data;
  },

  changePassword: async (
    data: PasswordChangeRequest
  ): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>("/user/password", data);
    return response.data;
  },
};

export { api };

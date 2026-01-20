# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

업비트(Upbit) 거래소 기반 암호화폐 자동매매 프론트엔드 시스템. React 18 + TypeScript + Vite로 구축되었으며, 별도의 Spring Boot 백엔드 서버(localhost:8080)와 통신합니다.

## Commands

```bash
npm run dev      # 개발 서버 실행 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (tsc -b && vite build)
npm run lint     # ESLint 검사
npm run preview  # 빌드 미리보기
```

## Architecture

### Entry Point
- `src/main.tsx` → `src/App.tsx` → `AuthProvider`로 감싸진 `MainApp`
- 인증 상태에 따라 `LoginPage`/`RegisterPage` 또는 메인 앱 렌더링

### Tab-Based Navigation (App.tsx)
6개 탭: trading | dashboard | alerts | rebalance | strategy-params | optimizer

### API Layer (`src/api/`)

**authApi.ts**
- `authApi`: 로그인, 회원가입, 토큰 갱신
- `userApi`: 사용자 정보, 자동매매 설정, 업비트 API 키 관리

**upbitApi.ts** - 모든 비즈니스 API를 포함하는 메인 모듈
- `upbitApi` (`/api/upbit`): 계좌, 시세, 캔들, 주문, 자동매매
- `backtest` (`/api/backtest`): 단일/멀티 백테스트, 시각화, 전략 비교
- `tradeHistory` (`/api/trade-history`): 매매 손익 조회
- `strategyService` (`/api/user/strategies`): 전략 활성화/비활성화
- `strategyParamService` (`/api/strategy-params`): 전략 파라미터 CRUD
- `strategyOptimizerService` (`/api/strategy-optimizer`): 동기/비동기 최적화
- `alertService` (`/api/alerts`): 급등/급락 알림, 마켓 스캔
- `dashboardService` (`/api/dashboard`): 대시보드 데이터
- `rebalanceService` (`/api/rebalance`): 포트폴리오 리밸런싱

**공통 인터셉터 패턴**
```typescript
const someApi = axios.create({ baseURL: "/api/some-path" });
setupAuthInterceptor(someApi); // JWT 토큰 자동 첨부 + 401 시 자동 갱신
```

### State Management
- **AuthContext** (`src/contexts/AuthContext.tsx`): 전역 인증 상태
  - `useAuth()` 훅으로 접근
  - localStorage에 accessToken/refreshToken 저장
  - 401 응답 시 자동 토큰 갱신 또는 로그아웃

### Type Definitions (`src/types/index.ts`)

주요 타입 카테고리:
- **업비트 API**: Account, Market, Ticker, Candle, OrderResponse
- **백테스트**: BacktestResult, SimulationResult, TradeHistoryItem, ExitReason
- **매매 손익**: TradeProfitRecord, TradeProfitSummary (totalBuyAmount, totalSellAmount 포함)
- **전략**: AvailableStrategy, UserStrategy, StrategyParamDefinition, OptimizedParams
- **비동기 작업**: SimulationTask, SimulationTaskStatus, SimulationStatus

### Components (`src/components/`)

**Trading Tab**
- MarketList: KRW 마켓 목록, 실시간 시세
- PriceChart: Recharts 기반 캔들 차트
- AccountInfo: 보유 자산 현황
- OrderPanel: 시장가/지정가 주문
- AutoTrading: 자동매매 실행
- Backtest: 단일/멀티 백테스트 UI
- TradeHistory: 손익 요약, 매매 내역, 일자별 수익률 (3탭 구조)

**Other Tabs**
- Dashboard: 자산 현황, 수익률 차트
- Alerts: 급등/급락 알림, Top Gainer/Loser
- Rebalance: 포트폴리오 리밸런싱
- StrategyParams: 전략 파라미터 수정
- StrategyOptimizer: 비동기 최적화, 파라미터 적용

## Key Implementation Patterns

### 멀티 코인 백테스트 (청크 처리)
`backtest.multiDbWithProgress()`는 대량 마켓을 chunkSize 단위로 나누어 순차 처리하고, `onProgress` 콜백으로 진행률 전달. 실패 마켓이 있어도 나머지 결과 반환.

### 비동기 최적화 폴링
```typescript
const task = await strategyOptimizerService.startAsyncOptimization();
// 폴링으로 진행 상황 확인
const status = await strategyOptimizerService.getTaskStatus(task.taskId);
// 완료 시 결과 조회
const result = await strategyOptimizerService.getTaskResult(task.taskId);
```

### TradeHistory 손익 계산 (프론트엔드 필터링)
날짜 필터 적용 시 `filteredSummary`를 useMemo로 계산:
- totalBuyAmount, totalSellAmount: MATCHED 거래만 합산
- grossProfit: totalSellAmount - totalBuyAmount (수수료 제외 전)
- totalNetProfit: 수수료 차감 후 순이익

## Backend Proxy

개발 시 `/api/*` 요청은 `http://localhost:8080`으로 프록시됨 (vite.config.ts)

## Tech Stack

- React 18.2.0 + TypeScript 5.9.3
- Vite 7.2.4 + Tailwind CSS 4.1.18
- Recharts 3.6.0 (차트)
- Axios 1.13.2 (HTTP)
- Lucide React 0.562.0 (아이콘)

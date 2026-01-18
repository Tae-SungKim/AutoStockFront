# Upbit Auto Trading System

업비트(Upbit) 거래소 기반 암호화폐 자동매매 시스템입니다. 실시간 시세 모니터링, 다양한 매매 전략, 백테스트, 전략 최적화 기능을 제공합니다.

## 주요 기능

### 1. 트레이딩
- **실시간 차트**: 분/일봉 캔들 차트 (Recharts 기반)
- **마켓 리스트**: KRW 마켓 코인 목록 및 실시간 시세
- **계좌 정보**: 보유 자산 현황 및 평가손익
- **수동 주문**: 시장가/지정가 매수/매도
- **자동매매**: 전략 기반 자동 매매 실행

### 2. 대시보드
- 총 자산 현황 및 수익률
- 보유 코인별 평가손익
- 일별 수익 차트
- 최근 거래 내역

### 3. 급등/급락 알림
- 실시간 마켓 스캔 (Top N 마켓)
- 급등/급락 코인 감지
- Top Gainer / Top Loser 목록
- 시장 상황 판단 (BULL/BEAR/NEUTRAL)

### 4. 리밸런싱
- 포트폴리오 목표 비중 설정
- 현재 vs 목표 비중 비교
- 균등 배분 계산
- 리밸런싱 계획 생성 및 실행

### 5. 백테스트
- **단일 코인 백테스트**: 특정 코인에 대한 전략 테스트
- **멀티 코인 시뮬레이션**: 여러 코인 동시 백테스트 (청크 단위 진행)
- **시각화**: 수익률 차트, 거래 마커, 시간대별 분석
- **전략 비교**: 여러 전략 성과 비교
- **코인 히트맵**: 코인별 수익률 히트맵

### 6. 전략 설정
- 사용 가능한 전략 목록 조회
- 전략별 파라미터 조회/수정
- 파라미터 초기화
- 전략 활성화/비활성화

### 7. 전략 최적화
- 데이터 기반 파라미터 최적화
- 비동기 최적화 (장시간 작업 지원)
- 최적화 결과 미리보기 및 적용
- 현재 파라미터 vs 최적 파라미터 비교

## 기술 스택

### Frontend
| 기술 | 버전 | 설명 |
|------|------|------|
| React | 18.2.0 | UI 라이브러리 |
| TypeScript | 5.9.3 | 타입 안전성 |
| Vite | 7.2.4 | 빌드 도구 |
| Tailwind CSS | 4.1.18 | 스타일링 |
| Recharts | 3.6.0 | 차트 라이브러리 |
| Axios | 1.13.2 | HTTP 클라이언트 |
| Lucide React | 0.562.0 | 아이콘 |

### Backend (별도 프로젝트)
- Spring Boot (Java)
- 업비트 API 연동
- JWT 인증

## 프로젝트 구조

```
src/
├── api/
│   ├── authApi.ts          # 인증 API
│   └── upbitApi.ts         # 업비트/백테스트/전략 API
├── components/
│   ├── AccountInfo.tsx     # 계좌 정보
│   ├── Alerts.tsx          # 급등/급락 알림
│   ├── AutoTrading.tsx     # 자동매매 패널
│   ├── Backtest.tsx        # 백테스트 패널
│   ├── Dashboard.tsx       # 대시보드
│   ├── Header.tsx          # 헤더
│   ├── MarketList.tsx      # 마켓 목록
│   ├── OrderPanel.tsx      # 주문 패널
│   ├── PriceChart.tsx      # 가격 차트
│   ├── Rebalance.tsx       # 리밸런싱
│   ├── StrategyOptimizer.tsx # 전략 최적화
│   ├── StrategyParams.tsx  # 전략 파라미터
│   ├── TradeHistory.tsx    # 거래 내역
│   └── UserSettings.tsx    # 사용자 설정
├── contexts/
│   └── AuthContext.tsx     # 인증 컨텍스트
├── hooks/                  # 커스텀 훅
├── pages/
│   ├── LoginPage.tsx       # 로그인 페이지
│   └── RegisterPage.tsx    # 회원가입 페이지
├── types/
│   └── index.ts            # TypeScript 타입 정의
├── utils/                  # 유틸리티 함수
├── App.tsx                 # 메인 앱 컴포넌트
└── main.tsx                # 엔트리 포인트
```

## API 엔드포인트

### 인증 (`/api/auth`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/login` | 로그인 |
| POST | `/register` | 회원가입 |
| POST | `/refresh` | 토큰 갱신 |

### 업비트 (`/api/upbit`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/accounts` | 계좌 조회 |
| GET | `/markets` | 마켓 목록 |
| GET | `/ticker` | 현재가 정보 |
| GET | `/candles/minutes/{unit}` | 분봉 데이터 |
| GET | `/candles/days` | 일봉 데이터 |
| POST | `/orders/buy/market` | 시장가 매수 |
| POST | `/orders/sell/market` | 시장가 매도 |
| POST | `/orders/buy/limit` | 지정가 매수 |
| POST | `/orders/sell/limit` | 지정가 매도 |
| DELETE | `/orders/{uuid}` | 주문 취소 |
| GET | `/trading/status` | 자동매매 상태 |
| POST | `/trading/execute` | 자동매매 실행 |

### 백테스트 (`/api/backtest`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/run/db/{strategy}` | 단일 전략 백테스트 |
| GET | `/multi/db` | 멀티 코인 백테스트 |
| GET | `/markets/db` | DB 저장 마켓 목록 |
| GET | `/visualization/single` | 백테스트 시각화 |
| GET | `/visualization/compare-strategies` | 전략 비교 |
| POST | `/visualization/coin-heatmap` | 코인 히트맵 |

### 알림 (`/api/alerts`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/market/{market}` | 마켓별 알림 |
| GET | `/scan` | 마켓 스캔 |
| GET | `/top-gainers` | 급등 코인 |
| GET | `/top-losers` | 급락 코인 |

### 대시보드 (`/api/dashboard`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` | 대시보드 데이터 |
| GET | `/summary` | 요약 정보 |

### 리밸런싱 (`/api/rebalance`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/status` | 현재 상태 조회 |
| POST | `/plan` | 리밸런싱 계획 |
| POST | `/execute` | 리밸런싱 실행 |
| POST | `/equal-allocation` | 균등 배분 계산 |

### 전략 파라미터 (`/api/strategy-params`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/strategies` | 전략 목록 |
| GET | `/definitions/{strategy}` | 파라미터 정의 |
| GET | `/{strategy}` | 파라미터 조회 |
| PUT | `/{strategy}` | 파라미터 일괄 수정 |
| PUT | `/{strategy}/{key}` | 개별 파라미터 수정 |
| DELETE | `/{strategy}` | 파라미터 초기화 |

### 전략 최적화 (`/api/strategy-optimizer`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/stats` | 최적화 통계 |
| POST | `/optimize` | 최적화 실행 |
| POST | `/optimize-and-apply` | 최적화 및 적용 |
| GET | `/current-params` | 현재 파라미터 |
| POST | `/apply-params` | 파라미터 적용 |
| POST | `/async/optimize-and-apply` | 비동기 최적화 |
| GET | `/tasks/{taskId}` | 태스크 상태 조회 |
| GET | `/result/{taskId}` | 결과 조회 |
| POST | `/tasks/{taskId}/cancel` | 태스크 취소 |

### 거래 내역 (`/api/trade-history`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/profit` | 전체 손익 내역 |
| GET | `/profit/market/{market}` | 마켓별 손익 |
| GET | `/profit/summary` | 손익 요약 |
| GET | `/profit/summary/{market}` | 마켓별 요약 |

## 설치 및 실행

### 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 미리보기
```bash
npm run preview
```

### 린트 검사
```bash
npm run lint
```

## 환경 설정

백엔드 서버 주소는 `vite.config.ts`에서 프록시 설정을 통해 관리됩니다:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 백엔드 서버 주소
        changeOrigin: true,
      },
    },
  },
});
```

## 주요 매매 전략

시스템은 다양한 매매 전략을 지원합니다:

| 전략 | 설명 |
|------|------|
| 볼린저 밴드 | 볼린저 밴드 상/하단 돌파 시 매매 |
| RSI | RSI 과매수/과매도 구간 기반 매매 |
| 거래량 급증 | 거래량 급증 감지 시 매매 |
| 복합 전략 | 여러 지표 조합 |

### 최적화 파라미터
```typescript
interface OptimizedParams {
  bollingerPeriod: number;      // 볼린저 밴드 기간
  bollingerMultiplier: number;  // 볼린저 밴드 배수
  rsiPeriod: number;            // RSI 기간
  rsiBuyThreshold: number;      // RSI 매수 임계값
  rsiSellThreshold: number;     // RSI 매도 임계값
  volumeIncreaseRate: number;   // 거래량 증가율
  stopLossRate: number;         // 손절률
  takeProfitRate: number;       // 익절률
  trailingStopRate: number;     // 트레일링 스탑률
}
```

### 청산 조건 (Exit Reason)
| Exit Reason | 설명 |
|-------------|------|
| `STOP_LOSS_FIXED` | 고정 손절 |
| `STOP_LOSS_ATR` | ATR 기반 손절 |
| `TRAILING_STOP` | 트레일링 스탑 |
| `TAKE_PROFIT` | 익절 |
| `SIGNAL_INVALID` | 시그널 무효화 |
| `FAKE_REBOUND` | 가짜 반등 |
| `VOLUME_DROP` | 거래량 감소 |
| `OVERHEATED` | 과열 |
| `TIMEOUT` | 타임아웃 |

## 화면 구성

### 탭 메뉴
1. **트레이딩**: 실시간 트레이딩 화면 (차트, 주문, 자동매매)
2. **대시보드**: 자산 현황 및 수익률 대시보드
3. **급등/급락**: 마켓 스캔 및 알림
4. **리밸런싱**: 포트폴리오 리밸런싱
5. **전략 설정**: 전략 파라미터 설정
6. **전략 최적화**: 자동 파라미터 최적화

## 인증 흐름

1. 로그인/회원가입 시 JWT 토큰 발급
2. `accessToken`/`refreshToken` localStorage 저장
3. API 요청 시 Authorization 헤더에 토큰 자동 첨부
4. 401 응답 시 refreshToken으로 자동 갱신
5. 갱신 실패 시 로그인 페이지로 리다이렉트

## 라이선스

Private Project

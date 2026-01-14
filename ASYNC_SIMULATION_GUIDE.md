# 비동기 전략 시뮬레이션 시스템 가이드

## 📋 개요

장시간 소요되는 전략 최적화 작업을 비동기로 처리하고, 실시간 진행 상황을 사용자에게 제공하는 시스템입니다.

## 🏗️ 아키텍처

### 1. 백엔드 API 구조

```
POST /api/strategy-optimizer/async/optimize-and-apply
→ 작업 시작, taskId 반환

GET /api/strategy-optimizer/tasks/{taskId}
→ 작업 상태 조회 (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)

GET /api/strategy-optimizer/result/{taskId}
→ 완료된 작업의 결과 조회

POST /api/strategy-optimizer/tasks/{taskId}/cancel
→ 실행 중인 작업 취소
```

### 2. 프론트엔드 구조

```
src/
├── types/index.ts                    # 타입 정의
│   ├── SimulationStatus
│   ├── SimulationTask
│   ├── SimulationTaskStatus
│   └── SimulationResult
│
├── api/upbitApi.ts                   # API 함수
│   ├── startAsyncOptimization()
│   ├── getTaskStatus()
│   ├── getTaskResult()
│   └── cancelTask()
│
├── hooks/
│   └── useSimulationPolling.ts       # Polling 로직
│
└── components/
    ├── SimulationProgressView.tsx    # 진행 상태 UI
    └── StrategyOptimizer.tsx         # 메인 컴포넌트
```

## 🔄 작업 흐름 (Flow)

```
[1단계] 사용자가 "전체 최적화 실행" 버튼 클릭
         ↓
[2단계] startAsyncOptimization() → taskId 받음
         ↓
[3단계] startPolling(taskId) → 2.5초마다 상태 조회
         ↓
[4단계] SimulationProgressView 표시
         - 진행률 (0-100%)
         - 현재 단계 텍스트
         - 경과/예상 시간
         - 취소 버튼
         ↓
[5단계] 상태가 COMPLETED면 결과 조회 → 화면에 표시
         상태가 FAILED면 에러 메시지 표시
```

## 🎯 핵심 기능

### 1. Polling 시스템 (useSimulationPolling)

**특징:**
- 2.5초 간격으로 상태 조회
- 네트워크 오류 시 최대 3회 재시도
- 실패 시 5초 간격으로 재시도

**주요 함수:**
```typescript
const {
  status,         // 현재 작업 상태
  result,         // 완료된 결과
  error,          // 에러 메시지
  isPolling,      // 폴링 중 여부
  startPolling,   // 폴링 시작
  stopPolling,    // 폴링 중지
  cancelTask,     // 작업 취소
} = useSimulationPolling();
```

### 2. 새로고침 복구 (localStorage)

**저장 데이터:**
```typescript
localStorage.setItem("sim_task_id", taskId);
localStorage.setItem("sim_start_time", Date.now());
```

**복구 로직:**
```typescript
useEffect(() => {
  const savedTaskId = localStorage.getItem("sim_task_id");
  const startTime = localStorage.getItem("sim_start_time");

  if (savedTaskId && startTime) {
    const elapsed = (Date.now() - parseInt(startTime)) / 1000;

    // 24시간 이내의 작업만 복구
    if (elapsed < 86400) {
      startPolling(savedTaskId);
    }
  }
}, []);
```

### 3. 페이지 이탈 방지

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isPolling) {
      e.preventDefault();
      e.returnValue = "작업이 진행 중입니다. 페이지를 나가시겠습니까?";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isPolling]);
```

### 4. 모드 전환 (동기/비동기)

```typescript
const [useAsyncMode, setUseAsyncMode] = useState(true);

// 비동기 모드
if (useAsyncMode) {
  const task = await startAsyncOptimization();
  startPolling(task.taskId);
}
// 동기 모드 (기존)
else {
  const result = await optimizeAndApply();
  setResult(result);
}
```

## 🎨 UI 컴포넌트

### SimulationProgressView

**표시 정보:**
- ✅ 상태 아이콘 (대기/실행/완료/실패/취소)
- 📊 진행률 바 (0-100%)
- 📝 현재 단계 텍스트
- ⏱️ 경과 시간
- ⏰ 예상 남은 시간
- ⏲️ 예상 총 시간
- ❌ 취소 버튼

**색상 구분:**
- PENDING: 노란색
- RUNNING: 파란색
- COMPLETED: 초록색
- FAILED: 빨간색
- CANCELLED: 회색

## 🔒 에러 처리

### 1. 네트워크 오류
```typescript
// 최대 3회 재시도
if (retryCount < MAX_RETRIES) {
  setRetryCount(prev => prev + 1);
  setTimeout(pollStatus, POLLING_INTERVAL * 2);
} else {
  stopPolling();
  setError("네트워크를 확인해주세요.");
}
```

### 2. 작업 실패
```typescript
if (statusData.status === "FAILED") {
  stopPolling();
  setError(statusData.errorMessage || "작업이 실패했습니다.");
}
```

### 3. 작업 취소
```typescript
const handleCancelSimulation = async () => {
  if (!confirm("작업을 취소하시겠습니까?")) return;

  try {
    await cancelTask();
    setMessage({ type: "success", text: "작업이 취소되었습니다." });
  } catch (error) {
    setMessage({ type: "error", text: "취소 요청에 실패했습니다." });
  }
};
```

## 📱 사용자 시나리오

### 시나리오 1: 정상 완료
1. 사용자가 "전체 최적화 실행" 클릭
2. 진행 상태 화면이 나타남 (0% → 100%)
3. 완료 후 결과 화면 자동 전환
4. 성공 메시지 표시

### 시나리오 2: 중간에 페이지 새로고침
1. 작업 실행 중 (예: 45% 진행)
2. 사용자가 F5로 새로고침
3. localStorage에서 taskId 복구
4. 자동으로 폴링 재개
5. 진행 상태 계속 표시

### 시나리오 3: 작업 취소
1. 작업 실행 중
2. 사용자가 "작업 취소" 버튼 클릭
3. 확인 다이얼로그 표시
4. 백엔드에 취소 요청
5. 취소 완료 메시지 표시

### 시나리오 4: 네트워크 오류
1. 작업 실행 중 네트워크 끊김
2. 자동으로 3회 재시도
3. 모두 실패 시 에러 메시지 표시
4. 사용자가 네트워크 복구 후 새로고침
5. taskId 복구로 계속 진행

## 🛠️ 설정 및 커스터마이징

### Polling 간격 조정
```typescript
// src/hooks/useSimulationPolling.ts
const POLLING_INTERVAL = 2500; // 2.5초 (기본값)
```

### 재시도 횟수 조정
```typescript
const MAX_RETRIES = 3; // 3회 (기본값)
```

### 복구 시간 제한 조정
```typescript
// 24시간 → 12시간으로 변경
if (elapsed < 43200) { // 12 * 60 * 60
  startPolling(savedTaskId);
}
```

## 🧪 테스트 시나리오

### 1. 기본 동작
- [ ] 최적화 시작 → 진행 → 완료
- [ ] 진행률이 0%에서 100%로 증가하는지 확인
- [ ] 완료 후 결과가 정상 표시되는지 확인

### 2. 새로고침
- [ ] 작업 중 F5 → 자동 복구 확인
- [ ] 복구 후 진행률이 이어지는지 확인

### 3. 페이지 이탈
- [ ] 작업 중 탭 닫기 시도 → 경고 메시지 확인

### 4. 취소
- [ ] 취소 버튼 클릭 → 작업 중지 확인
- [ ] 취소 후 재실행 가능한지 확인

### 5. 에러 처리
- [ ] 네트워크 끊김 → 재시도 → 에러 메시지 확인
- [ ] 백엔드 실패 → 에러 메시지 표시 확인

## 💡 Best Practices

### 1. 사용자 피드백
- ✅ 진행 상황을 명확히 표시
- ✅ 예상 시간 제공
- ✅ 현재 단계를 텍스트로 설명
- ✅ 취소 옵션 제공

### 2. 상태 관리
- ✅ localStorage로 영속성 보장
- ✅ useEffect로 생명주기 관리
- ✅ cleanup 함수로 메모리 누수 방지

### 3. 에러 처리
- ✅ 네트워크 오류 재시도
- ✅ 명확한 에러 메시지
- ✅ 복구 가능한 상태 유지

### 4. 성능
- ✅ 적절한 폴링 간격 (2.5초)
- ✅ 불필요한 API 호출 방지
- ✅ 컴포넌트 언마운트 시 정리

## 🚀 배포 체크리스트

- [ ] 백엔드 API 엔드포인트 확인
- [ ] Polling 간격 최적화
- [ ] 에러 메시지 다국어 지원 (선택)
- [ ] 로그 수집 설정
- [ ] 모니터링 대시보드 구성
- [ ] 부하 테스트 완료

---

## 📚 참고 자료

**관련 파일:**
- [src/types/index.ts](src/types/index.ts) - 타입 정의
- [src/api/upbitApi.ts](src/api/upbitApi.ts) - API 함수
- [src/hooks/useSimulationPolling.ts](src/hooks/useSimulationPolling.ts) - Polling 훅
- [src/components/SimulationProgressView.tsx](src/components/SimulationProgressView.tsx) - 진행 상태 UI
- [src/components/StrategyOptimizer.tsx](src/components/StrategyOptimizer.tsx) - 메인 컴포넌트

**구현 완료일:** 2026-01-13

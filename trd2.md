createBooking 함수 기술 사양서 (TRD) - 소스코드 기준 최종본
1. 목적
신규 시설 대관(Booking) 생성 시, Firestore 트랜잭션을 통해 시간 겹침 및 버퍼 시간 규칙을 원자적으로 검증하여 데이터 정합성을 100% 보장합니다.

2. 인터페이스
유형: Callable HTTPS Cloud Function

경로: createBooking

입력 (payload): (CreateBookingData 타입 참고)

facilityId: string - 예약할 시설의 고유 ID

startDate: string - 예약 시작일 (형식: "YYYY-MM-DD")

endDate: string - 예약 종료일 (형식: "YYYY-MM-DD")

startTime: string - 예약 시작 시간 (형식: "HH:MM")

endTime: string - 예약 종료 시간 (형식: "HH:MM")

purpose: string - 대관 목적

category: 'personal' | 'club' | 'event' | 'class' - 예약 종류

organization?: string - 관련 단체명 (선택)

출력 (result):

성공 시: { ok: true, bookingId: "new-booking-id" }

실패 시: { ok: false, error: { code: "error-code", message: "error-message" } }

3. 오류 코드
invalid-argument: startTime이 endTime보다 늦는 등 입력값이 유효하지 않음.

not-found: 요청된 facilityId가 facilities 컬렉션에 존재하지 않음.

failed-precondition: 요청된 시간이 기존 approved 상태의 예약 또는 버퍼 시간과 겹침.

permission-denied: 인증되지 않은 사용자가 예약을 시도함.

4. 데이터 모델 (types.ts 기준)
facilities/{facilityId}:

name: string

capacity: number

bufferMinutes: number (TRD에서 사용하는 가상 필드, 실제 DB에 추가 필요)

bookings/{bookingId}:

userId: string

userName: string

facilityId: string (TRD에서 사용하는 가상 필드, 실제 DB에 추가 필요)

startDate: string ("YYYY-MM-DD")

endDate: string ("YYYY-MM-DD")

startTime: string ("HH:MM")

endTime: string ("HH:MM")

purpose: string

category: string

organization?: string

status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'

5. Firestore 색인 (firestore.indexes.json 기준)
bookings 컬렉션:

(facilityId ASC, startDate ASC, startTime ASC)

(facilityId ASC, startDate ASC, status ASC, startTime ASC)

6. 핵심 로직 상세 분해 (트랜잭션 내부)
Phase 1: 준비 및 데이터 로드
함수 시작 및 인증 확인: context.auth 객체로 로그인 여부 검증.

입력 페이로드 유효성 검증: 날짜/시간 형식, 필수 필드 존재 여부 검증.

Firestore 트랜잭션 시작: 동시성 제어를 위해 트랜잭션 개시.

시설(Facility) 데이터 조회: facilities/{facilityId} 문서를 조회하여 bufferMinutes 값을 가져옴.

Phase 2: 검증 로직
날짜-시간 문자열을 Date 객체로 변환:

newBookingStartDateTime = new Date(payload.startDate + 'T' + payload.startTime)

newBookingEndDateTime = new Date(payload.endDate + 'T' + payload.endTime)

유효 점유 시간(Effective Occupancy Time) 계산:

5번에서 생성한 Date 객체에 bufferMinutes를 더하고 빼서 실제 점유 시간(effectiveStart, effectiveEnd)을 계산.

중복 가능성 있는 예약 후보군 쿼리:

where('facilityId', '==', payload.facilityId)

where('startDate', '<=', payload.endDate)

where('status', '==', 'approved')

위 조건으로 겹칠 가능성이 있는 approved 상태의 예약들을 1차 조회.

서버 내 정밀 검증 루프:

조회된 예약 후보(existingBooking)들을 순회.

각 existingBooking의 startDate, startTime 등을 Date 객체로 변환.

effectiveStart < existingEndDateTime && effectiveEnd > existingStartDateTime 공식을 사용하여 메모리에서 정밀한 시간 중복 여부 판별.

겹치는 예약이 하나라도 발견되면 즉시 failed-precondition 오류를 발생시키고 트랜잭션 중단.

Phase 3: 데이터 생성 및 완료
신규 예약 문서 생성:

모든 검증을 통과하면, 트랜잭션 내에서 bookings 컬렉션에 새로운 예약 문서를 생성. status는 'pending'으로 설정.

트랜잭션 커밋:

모든 DB 변경사항을 원자적으로 반영.

성공 응답 반환:

클라이언트에 성공 결과와 새로운 bookingId를 반환.

7. 권한
인증된 모든 사용자는 createBooking 함수를 호출할 수 있다.

8. 테스트 케이스
TC1 (성공): 비어 있는 시간에 예약 시 pending 상태로 성공적으로 생성되는가?

TC2 (실패): approved 상태의 예약과 정확히 겹치는 예약을 시도 시 failed-precondition 오류가 발생하는가?

TC3 (실패): approved 상태의 예약의 버퍼 시간과 겹치는 예약을 시도 시 failed-precondition 오류가 발생하는가?

TC4 (성공): pending 상태 또는 rejected 상태의 예약과는 시간이 겹쳐도 예약 신청이 성공하는가?
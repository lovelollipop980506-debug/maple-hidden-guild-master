/** 콘텐츠 영역 전체를 채우는 공통 로딩 스피너. 데이터가 다 모이기 전 한 번만 표시. */
export function Loading() {
  return (
    <div className="loader">
      <div className="spinner" />
    </div>
  );
}

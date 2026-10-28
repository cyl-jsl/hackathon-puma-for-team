// 桶緝犯圖形標：path 與 assets/logo/logo-mark.svg 相同（由 build_logo.py 產生），改那邊時這裡也要跟著改。
// 顏色跟著 currentColor，深色底自動變白。
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M26 4a22 22 0 1 1 0 44a22 22 0 1 1 0-44ZM18 15a2 2 0 0 0 0 4H34a2 2 0 0 0 0-4ZM18 21L19.7 35.2Q20 37 21.8 37H30.2Q32 37 32.3 35.2L34 21Z"
      />
      <path fill="currentColor" d="M43.83 38.17L57.83 52.17A4 4 0 0 1 52.17 57.83L38.17 43.83A4 4 0 0 1 43.83 38.17Z" />
    </svg>
  );
}

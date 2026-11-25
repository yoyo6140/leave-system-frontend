import { useSyncExternalStore } from "react";

// 永不觸發更新的訂閱來源：只是借用 useSyncExternalStore 的雙 snapshot 機制
// （server snapshot 回 false、client snapshot 回 true）在 hydrate 後翻成 true，
// 取代「useState(false) + useEffect(() => setState(true))」的寫法，避免在 effect
// 裡 setState 觸發多一次渲染。
const subscribe = () => () => {};

// 用於 createPortal 之類只能在瀏覽器執行的邏輯：SSR 與 hydrate 前的第一次
// client render 都回傳 false（跟伺服器輸出一致，不會有 hydration mismatch），
// hydrate 完成後 React 會自動重新渲染一次，這次回傳 true。
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

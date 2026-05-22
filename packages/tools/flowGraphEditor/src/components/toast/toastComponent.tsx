import { type GlobalState } from "../../globalState";
import { LogEntry } from "../log/logComponent";

export type ToastSeverity = "info" | "success" | "error" | "warning";

/**
 * Helper to show a toast notification through globalState. The actual toast UI
 * is rendered by the modular tool framework via `toastBridgeService`.
 * @param globalState - the global state to notify
 * @param message - the text to display
 * @param severity - the toast severity (defaults to "info")
 */
export function ShowToast(globalState: GlobalState, message: string, severity: ToastSeverity = "info"): void {
    globalState.onToastNotification.notifyObservers({ message, severity });
    // Also emit to the log panel for persistence
    globalState.onLogRequiredObservable.notifyObservers(new LogEntry(message, severity === "error"));
}

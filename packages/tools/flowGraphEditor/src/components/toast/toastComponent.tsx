import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { LogEntry } from "../log/logComponent";
import "./toast.scss";

export type ToastSeverity = "info" | "success" | "error" | "warning";

interface IToastEntry {
    id: number;
    message: string;
    severity: ToastSeverity;
    timerId: Nullable<ReturnType<typeof setTimeout>>;
    startedAt: number;
    remainingDuration: number;
}

interface IToastContainerProps {
    globalState: GlobalState;
}

interface IToastContainerState {
    toasts: IToastEntry[];
}

const SEVERITY_ICONS: Record<ToastSeverity, string> = {
    info: "ℹ",
    success: "✓",
    error: "✕",
    warning: "⚠",
};

/** Auto-dismiss duration in ms */
const TOAST_DURATION_MS = 4000;

/**
 * Container component that renders brief auto-dismissing toast notifications.
 * Listens to `globalState.onToastNotification` for incoming messages.
 */
export class ToastContainerComponent extends React.Component<IToastContainerProps, IToastContainerState> {
    private _observer: Nullable<Observer<{ message: string; severity: ToastSeverity }>> = null;
    private _nextId = 0;

    /** @internal */
    constructor(props: IToastContainerProps) {
        super(props);
        this.state = { toasts: [] };
    }

    /** @internal */
    override componentDidMount() {
        this._observer = this.props.globalState.onToastNotification.add((data) => {
            const id = this._nextId++;
            const timerId = this._createDismissTimer(id, TOAST_DURATION_MS);
            this.setState((prev) => ({
                toasts: [...prev.toasts, { id, message: data.message, severity: data.severity, timerId, startedAt: Date.now(), remainingDuration: TOAST_DURATION_MS }],
            }));
        });
    }

    /** @internal */
    override componentWillUnmount() {
        this._observer?.remove();
        this._observer = null;
        // Clear all pending timers
        for (const t of this.state.toasts) {
            if (t.timerId) {
                clearTimeout(t.timerId);
            }
        }
    }

    private _createDismissTimer(id: number, duration: number) {
        return setTimeout(() => this._dismiss(id), duration);
    }

    private _pauseDismiss(id: number) {
        this.setState((prev) => ({
            toasts: prev.toasts.map((toast) => {
                if (toast.id !== id || !toast.timerId) {
                    return toast;
                }
                clearTimeout(toast.timerId);
                const elapsed = Date.now() - toast.startedAt;
                return {
                    ...toast,
                    timerId: null,
                    remainingDuration: Math.max(0, toast.remainingDuration - elapsed),
                };
            }),
        }));
    }

    private _resumeDismiss(id: number) {
        this.setState((prev) => ({
            toasts: prev.toasts.map((toast) => {
                if (toast.id !== id || toast.timerId) {
                    return toast;
                }
                const remainingDuration = Math.max(1, toast.remainingDuration);
                return {
                    ...toast,
                    timerId: this._createDismissTimer(id, remainingDuration),
                    startedAt: Date.now(),
                    remainingDuration,
                };
            }),
        }));
    }

    private _dismiss(id: number) {
        this.setState((prev) => ({
            toasts: prev.toasts.filter((t) => {
                if (t.id === id) {
                    if (t.timerId) {
                        clearTimeout(t.timerId);
                    }
                    return false;
                }
                return true;
            }),
        }));
    }

    /** @internal */
    override render() {
        return (
            <div className="fge-toast-container">
                {this.state.toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`fge-toast fge-toast-${toast.severity}`}
                        role="status"
                        aria-live="polite"
                        onMouseEnter={() => this._pauseDismiss(toast.id)}
                        onMouseLeave={() => this._resumeDismiss(toast.id)}
                    >
                        <span className="fge-toast-icon">{SEVERITY_ICONS[toast.severity]}</span>
                        <span className="fge-toast-message">{toast.message}</span>
                        <button className="fge-toast-close" aria-label="Dismiss" onClick={() => this._dismiss(toast.id)}>
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        );
    }
}

/**
 * Helper to show a toast notification through globalState.
 * @param globalState - the global state to notify
 * @param message - the text to display
 * @param severity - the toast severity (defaults to "info")
 */
export function ShowToast(globalState: GlobalState, message: string, severity: ToastSeverity = "info"): void {
    globalState.onToastNotification.notifyObservers({ message, severity });
    // Also emit to the log panel for persistence
    globalState.onLogRequiredObservable.notifyObservers(new LogEntry(message, severity === "error"));
}

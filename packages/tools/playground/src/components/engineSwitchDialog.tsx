import * as React from "react";
import type { GlobalState, IEngineSwitchDialogRequest } from "../globalState";
import { Utilities } from "../tools/utilities";
import "../scss/dialogs.scss";

interface IEngineSwitchDialogProps {
    globalState: GlobalState;
    request: IEngineSwitchDialogRequest | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export const EngineSwitchDialog: React.FC<IEngineSwitchDialogProps> = ({ globalState, request, onCancel, onConfirm }) => {
    const [theme, setTheme] = React.useState<"dark" | "light">(() => {
        return Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
    });
    const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        const updateTheme = () => {
            const newTheme = Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
            setTheme(newTheme);
        };

        globalState.onThemeChangedObservable.add(updateTheme);
        return () => {
            globalState.onThemeChangedObservable.removeCallback(updateTheme);
        };
    }, [globalState]);

    React.useEffect(() => {
        if (!request) {
            return;
        }

        const focusTimer = window.setTimeout(() => {
            confirmButtonRef.current?.focus();
        }, 0);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [request, onCancel, onConfirm]);

    if (!request) {
        return null;
    }

    const { currentEngine, targetEngine } = request;

    return (
        <div className={`dialog-overlay${theme === "dark" ? " dialog-theme-dark" : ""}`}>
            <div
                className="dialog dialog--small"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="engine-switch-dialog-title"
                aria-describedby="engine-switch-dialog-description"
            >
                <div className="dialog__header">
                    <h3 id="engine-switch-dialog-title">This playground uses a different rendering engine</h3>
                </div>
                <div className="dialog__content">
                    <p className="dialog__info dialog__info--spaced">
                        This playground was saved to run with <strong>{targetEngine}</strong>, but your Playground is currently using <strong>{currentEngine}</strong>.
                    </p>
                    <p id="engine-switch-dialog-description" className="dialog__description">
                        Choose <strong>Use {targetEngine}</strong> to switch engines before loading this playground, or choose <strong>Use {currentEngine}</strong> to keep your
                        current engine.
                    </p>
                </div>
                <div className="dialog__actions">
                    <button type="button" onClick={onCancel} className="dialog__button dialog__button--secondary">
                        Use {currentEngine}
                    </button>
                    <button type="button" ref={confirmButtonRef} onClick={onConfirm} className="dialog__button dialog__button--primary">
                        Use {targetEngine}
                    </button>
                </div>
            </div>
        </div>
    );
};

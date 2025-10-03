import * as React from "react";
import type { GlobalState } from "../../globalState";
import { Utilities } from "../../tools/utilities";
import "../../scss/dialogs.scss";

interface IFileDialogProps {
    globalState: GlobalState;
    isOpen: boolean;
    title: string;
    initialValue?: string;
    placeholder?: string;
    submitLabel?: string;
    onConfirm: (filename: string) => void;
    onCancel: () => void;
}

/**
 * @param param0  Props for the file dialog
 * @returns JSX.Element
 */
export const FileDialog: React.FC<IFileDialogProps> = ({
    globalState,
    isOpen,
    title,
    initialValue = "",
    placeholder = "Enter filename...",
    submitLabel = "Create",
    onConfirm,
    onCancel,
}) => {
    const [filename, setFilename] = React.useState(initialValue);
    const [theme, setTheme] = React.useState<"dark" | "light">(() => {
        return Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
    });
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            setFilename(initialValue);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 0);
        }
    }, [isOpen, initialValue]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filename.trim()) {
            onConfirm(filename.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onCancel();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={`dialog-overlay${theme === "dark" ? " dialog-theme-dark" : ""}`} onClick={onCancel}>
            <div className="dialog dialog--small" onClick={(e) => e.stopPropagation()}>
                <div className="dialog__header">
                    <h3>{title}</h3>
                    <button className="dialog__close" onClick={onCancel} aria-label="Close">
                        ✕
                    </button>
                </div>
                <div className="dialog__content">
                    <form onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="dialog__input"
                            autoComplete="off"
                        />
                    </form>
                </div>
                <div className="dialog__actions">
                    <button type="button" onClick={onCancel} className="dialog__button dialog__button--secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={!filename.trim()} onClick={handleSubmit} className="dialog__button dialog__button--primary">
                        {submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

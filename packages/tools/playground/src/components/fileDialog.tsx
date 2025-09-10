import * as React from "react";
import "../scss/fileDialog.scss";

interface IFileDialogProps {
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
export const FileDialog: React.FC<IFileDialogProps> = ({ isOpen, title, initialValue = "", placeholder = "Enter filename...", submitLabel = "Create", onConfirm, onCancel }) => {
    const [filename, setFilename] = React.useState(initialValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            setFilename(initialValue);
            // Focus input after dialog appears
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 0);
        }
    }, [isOpen, initialValue]);

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
        <div className="file-dialog-overlay" onClick={onCancel}>
            <div className="file-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="file-dialog__header">
                    <h3>{title}</h3>
                    <button className="file-dialog__close" onClick={onCancel} aria-label="Close">
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="file-dialog__form">
                    <input
                        ref={inputRef}
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="file-dialog__input"
                        autoComplete="off"
                    />
                    <div className="file-dialog__actions">
                        <button type="button" onClick={onCancel} className="file-dialog__button file-dialog__button--secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={!filename.trim()} className="file-dialog__button file-dialog__button--primary">
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

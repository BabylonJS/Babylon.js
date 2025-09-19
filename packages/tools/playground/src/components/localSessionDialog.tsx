import { useState, useEffect } from "react";
import * as React from "react";
import type { GlobalState } from "../globalState";
import type { FileChange, SnippetRevision } from "../tools/localSession";
import { LoadFileRevisions, RemoveFileRevision } from "../tools/localSession";
import { Utilities } from "../tools/utilities";
import "../scss/dialogs.scss";
import type { V2Manifest } from "../tools/monaco/run/runner";

interface ILocalSessionDialogProps {
    globalState: GlobalState;
    isOpen: boolean;
    onCancel: () => void;
}

/**
 * @param param0  Props for the local session revisions dialog
 * @returns JSX.Element
 */
export const LocalSessionDialog: React.FC<ILocalSessionDialogProps> = ({ globalState, isOpen, onCancel }) => {
    const [fileRevisions, setFileRevisions] = useState<SnippetRevision[]>([]);
    const [theme, setTheme] = useState<"dark" | "light">(() => {
        return Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
    });

    useEffect(() => {
        if (isOpen) {
            const revisions = LoadFileRevisions(globalState);
            setFileRevisions(revisions);
        }
    }, [isOpen, globalState]);

    useEffect(() => {
        const updateTheme = () => {
            const newTheme = Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
            setTheme(newTheme);
        };

        globalState.onThemeChangedObservable.add(updateTheme);
        return () => {
            globalState.onThemeChangedObservable.removeCallback(updateTheme);
        };
    }, [globalState]);

    const fileChangeBadge = (c: FileChange) => {
        const symbol = c.type === "added" ? "+" : c.type === "removed" ? "–" : "∼";
        const sizeText = (() => {
            const fmt = (n: number | null) => (n == null ? "—" : `${n} B`);
            return `${fmt(c.beforeSize)} → ${fmt(c.afterSize)}`;
        })();

        const title = `${c.type.toUpperCase()} • ${c.file} • ${sizeText}`;
        return (
            <span key={c.file} className={`lsd__change lsd__change--${c.type}`} title={title}>
                <span className="lsd__change-symbol">{symbol}</span> {c.file}
            </span>
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit", // include seconds
        });
    };

    const restoreRevision = (manifest: V2Manifest) => {
        globalState.onV2HydrateRequiredObservable.notifyObservers(manifest);
        onCancel();
    };

    const removeRevision = (index: number) => {
        RemoveFileRevision(globalState, index);
        const revisions = LoadFileRevisions(globalState);
        setFileRevisions(revisions);
    };

    if (!isOpen) {
        return null;
    }

    const hasRevisions = fileRevisions.length > 0;

    return (
        <div className={`dialog-overlay${theme === "dark" ? " dialog-theme-dark" : ""}`} onClick={onCancel}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog__header">
                    <h3>Session Revisions</h3>
                    <button className="dialog__close" onClick={onCancel} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="dialog__content">
                    <p className="dialog__description">
                        Up to 10 local sessions are retained per snippet context, or local context if unsaved, and are stored when the Playground is run with changes to the code.
                    </p>

                    {hasRevisions ? (
                        <>
                            <p className="dialog__info">Select a revision to restore your session:</p>
                            <div className="dialog__table-container">
                                <table className="dialog__table">
                                    <thead>
                                        <tr>
                                            <th className="dialog__title-header">Title</th>
                                            <th className="dialog__files-header">Files</th>
                                            <th className="dialog__date-header">Date</th>
                                            <th className="dialog__action-header">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fileRevisions.map((revision, index) => {
                                            const changes = revision.filesChanged ?? [];
                                            const maxInline = 3;
                                            const shown = changes.slice(0, maxInline);
                                            const hiddenCount = Math.max(0, changes.length - shown.length);

                                            return (
                                                <tr key={revision.date} className="dialog__row">
                                                    <td className="dialog__title-cell">
                                                        <span className="dialog__title-text">{revision.title}</span>
                                                    </td>
                                                    <td className="dialog__files-cell">
                                                        <div className="dialog__changes-wrap">
                                                            {shown.map(fileChangeBadge)}
                                                            {hiddenCount > 0 && (
                                                                <span className="dialog__more" title={`${hiddenCount} more changes`}>
                                                                    +{hiddenCount} more
                                                                </span>
                                                            )}
                                                            {changes.length === 0 && <span className="dialog__none">No file changes</span>}
                                                        </div>
                                                    </td>
                                                    <td className="dialog__date-cell">
                                                        <span className="dialog__date-text">{formatDate(revision.date)}</span>
                                                    </td>
                                                    <td className="dialog__action-cell">
                                                        <button
                                                            className="dialog__button dialog__button--primary"
                                                            onClick={() => restoreRevision(revision.manifest)}
                                                            aria-label={`Restore revision ${revision.title} from ${formatDate(revision.date)}`}
                                                        >
                                                            <span>Restore</span>
                                                        </button>
                                                        <button
                                                            className="dialog__button dialog__button--secondary"
                                                            onClick={() => removeRevision(index)}
                                                            aria-label={`Remove revision ${revision.title} from ${formatDate(revision.date)}`}
                                                        >
                                                            <span>Remove</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="dialog__empty-state">
                            <div className="dialog__empty-icon">📝</div>
                            <h4 className="dialog__empty-title">No revisions found</h4>
                            <p className="dialog__empty-description">This session doesn't have any saved revisions yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

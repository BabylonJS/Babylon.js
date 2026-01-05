import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { FileChange, RevisionContext, SnippetRevision } from "../../tools/localSession";
import { ListRevisionContexts, LoadFileRevisionsForToken, MaxRevisions, RemoveFileRevisionForToken } from "../../tools/localSession";
import { Utilities } from "../../tools/utilities";
import type { V2Manifest } from "../../tools/snippet";
import "../../scss/dialogs.scss";

interface ILocalSessionDialogProps {
    globalState: GlobalState;
    isOpen: boolean;
    onCancel: () => void;
}

/**
 *
 * @param param0
 * @returns
 */
export const LocalSessionDialog: React.FC<ILocalSessionDialogProps> = ({ globalState, isOpen, onCancel }) => {
    const [fileRevisions, setFileRevisions] = React.useState<SnippetRevision[]>([]);
    const [contexts, setContexts] = React.useState<RevisionContext[]>([]);

    const [selectedToken, setSelectedToken] = React.useState<string>("");
    const [theme, setTheme] = React.useState<"dark" | "light">(() => {
        return Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
    });

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const ctxs = ListRevisionContexts(globalState);
        setContexts(ctxs);
        const defaultToken = globalState.currentSnippetToken || "local-session";
        const effective = ctxs.find((c) => c.token === defaultToken)?.token ?? ctxs[0]?.token ?? defaultToken;
        setSelectedToken(effective);

        const revs = LoadFileRevisionsForToken(globalState, effective);
        setFileRevisions(revs);
    }, [isOpen, globalState]);

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

    const onSelectContext = (token: string) => {
        setSelectedToken(token);
        const revs = LoadFileRevisionsForToken(globalState, token);
        setFileRevisions(revs);
    };

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

    const formatDate = (timestamp: number) =>
        new Date(timestamp).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

    const restoreRevision = (manifest: V2Manifest) => {
        globalState.onV2HydrateRequiredObservable.notifyObservers(manifest);
        onCancel();
    };

    const removeRevision = (index: number) => {
        RemoveFileRevisionForToken(globalState, selectedToken, index);
        const revs = LoadFileRevisionsForToken(globalState, selectedToken);
        setFileRevisions(revs);
        setContexts(ListRevisionContexts(globalState));
    };

    if (!isOpen) {
        return null;
    }
    const hasRevisions = fileRevisions.length > 0;

    return (
        <div className={`dialog-overlay${theme === "dark" ? " dialog-theme-dark" : ""}`} onClick={onCancel}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog__header">
                    <div className="dialog__header-left">
                        <h3>Playground Session History</h3>

                        {/* Context select */}
                        <div className="dialog__context-select">
                            <select
                                id="session-context"
                                className="dialog__select"
                                title="Select a snippet session context"
                                value={selectedToken}
                                onChange={(e) => onSelectContext(e.target.value)}
                            >
                                {contexts.map((c) => {
                                    const isSnippetContext = c.token !== "local-session";
                                    const displayText = isSnippetContext ? `${c.title} (${c.token})` : c.title;
                                    const countText = c.count ? ` - ${c.count} revision${c.count === 1 ? "" : "s"}` : "";

                                    return (
                                        <option key={c.token} value={c.token} title={c.token}>
                                            {displayText}
                                            {countText}
                                        </option>
                                    );
                                })}
                            </select>
                            <span className="dialog__select-caret">▼</span>
                        </div>
                    </div>

                    <button className="dialog__close" onClick={onCancel} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="dialog__content">
                    {hasRevisions ? (
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
                                        const maxInline = 1;
                                        const shown = changes.slice(0, maxInline);
                                        const notShown = changes.slice(maxInline);
                                        const hiddenCount = Math.max(0, changes.length - shown.length);

                                        return (
                                            <tr key={revision.date} className="dialog__row">
                                                <td className="dialog__title-cell">
                                                    <span className="dialog__title-text">{revision.title}</span>
                                                    {revision.link && (
                                                        <span className="dialog__link">
                                                            <a target="_new" href={"/" + location.search + revision.link} title="Open Playground">
                                                                {revision.link}
                                                            </a>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="dialog__files-cell">
                                                    <div className="dialog__changes-wrap">
                                                        {shown.map(fileChangeBadge)}
                                                        {hiddenCount > 0 && (
                                                            <span className="dialog__more" title={notShown.map((f) => `${f.type.toUpperCase()} • ${f.file}`).join("\n")}>
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
                    ) : (
                        <div className="dialog__empty-state">
                            <div className="dialog__empty-icon">📝</div>
                            <h4 className="dialog__empty-title">No revisions found</h4>
                            <p className="dialog__empty-description">This session doesn't have any saved revisions yet.</p>
                        </div>
                    )}
                </div>

                <div className="dialog__footer">
                    <p className="dialog__footer-description">
                        Up to {MaxRevisions} local sessions are retained per snippet context, or local context if unsaved, and are stored when the Playground is run with changes to
                        the code.
                    </p>
                </div>
            </div>
        </div>
    );
};

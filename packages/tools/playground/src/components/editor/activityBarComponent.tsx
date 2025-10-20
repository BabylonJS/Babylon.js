/* eslint-disable jsdoc/require-jsdoc */
// activityBarComponent.tsx
import * as React from "react";
import type { GlobalState } from "../../globalState";
import HistoryIcon from "./icons/history.svg";
import FilesIcon from "./icons/files.svg";
import SearchIcon from "./icons/search.svg";
import { FileDialog } from "./fileDialog";
import { LocalSessionDialog } from "./localSessionDialog";
import { Utilities } from "../../tools/utilities";
import { Icon } from "./iconComponent";

type DialogKind = "create" | "rename" | "duplicate";
type DialogState = {
    open: boolean;
    type: DialogKind | null;
    title: string;
    initialValue: string;
    targetPath?: string;
};

export type ActivityBarHandle = {
    openCreateDialog: (suggestedName?: string) => void;
    openRenameDialog: (targetPath: string, initialDisplay?: string) => void;
    openDuplicateDialog: (targetPath: string, suggestedName?: string) => void;
    toggleSessionDialog: () => void;
};

interface IActivityBarProps {
    globalState: GlobalState;

    // Monaco owns mutations
    onConfirmFileDialog: (type: DialogKind, filename: string, targetPath?: string) => void;

    // Lifted layout state
    explorerOpen: boolean;
    onToggleExplorer: () => void;

    sessionOpen: boolean;
    onToggleSession: () => void;

    searchOpen: boolean;
    onToggleSearch: () => void;
}

export const ActivityBar = React.forwardRef<ActivityBarHandle, IActivityBarProps>(function activityBar(
    { globalState, onConfirmFileDialog, explorerOpen, onToggleExplorer, sessionOpen, onToggleSession, searchOpen, onToggleSearch },
    ref
) {
    const [theme, setTheme] = React.useState<"dark" | "light">(() => (Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light"));

    const [fileDialog, setFileDialog] = React.useState<DialogState>({
        open: false,
        type: null,
        title: "",
        initialValue: "",
    });

    // helpers
    const toDisplay = (path: string) => path.replace(/^\/?src\//, "");
    const toInternal = (displayPath: string) => (displayPath?.startsWith("/") ? displayPath.slice(1) : displayPath || "");
    const defaultNewFileName = (): string => {
        const isTS = globalState.language !== "JS";
        const base = isTS ? "new.ts" : "new.js";
        let idx = 0;
        let candidate = base;
        const files = globalState.files || {};
        while (Object.prototype.hasOwnProperty.call(files, toInternal(candidate))) {
            idx++;
            const parts = base.split(".");
            const ext = parts.pop();
            candidate = `${parts.join(".")}${idx}.${ext}`;
        }
        return candidate;
    };
    const defaultDuplicateName = (path: string): string => {
        const baseFull = path.replace(/\.(\w+)$/, "");
        const ext = (path.match(/\.(\w+)$/) || ["", ""])[1];
        let i = 1;
        let candidate = `${baseFull}.copy${i}${ext ? "." + ext : ""}`;
        const files = globalState.files || {};
        while (Object.prototype.hasOwnProperty.call(files, candidate)) {
            i++;
            candidate = `${baseFull}.copy${i}${ext ? "." + ext : ""}`;
        }
        return toDisplay(candidate);
    };

    // imperative API
    React.useImperativeHandle(ref, () => ({
        openCreateDialog: (suggestedName?: string) => {
            setFileDialog({ open: true, type: "create", title: "New file", initialValue: suggestedName ?? defaultNewFileName() });
        },
        openRenameDialog: (targetPath: string, initialDisplay?: string) => {
            setFileDialog({
                open: true,
                type: "rename",
                title: "Rename file",
                initialValue: initialDisplay ?? toDisplay(targetPath),
                targetPath,
            });
        },
        openDuplicateDialog: (targetPath: string, suggestedName?: string) => {
            setFileDialog({
                open: true,
                type: "duplicate",
                title: "Duplicate file",
                initialValue: suggestedName ?? defaultDuplicateName(targetPath),
                targetPath,
            });
        },
        toggleSessionDialog: () => onToggleSession(),
    }));

    // theme sync
    React.useEffect(() => {
        const updateTheme = () => {
            setTheme(Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light");
        };
        globalState.onThemeChangedObservable.add(updateTheme);
        return () => {
            globalState.onThemeChangedObservable.removeCallback(updateTheme);
        };
    }, [globalState]);

    // dialog handlers
    const closeFileDialog = () => setFileDialog({ open: false, type: null, title: "", initialValue: "" });
    const confirmFileDialog = (filename: string) => {
        if (!fileDialog.type) {
            return;
        }
        onConfirmFileDialog(fileDialog.type, filename, fileDialog.targetPath);
        closeFileDialog();
    };

    return (
        <div className={`pg-activity-bar-col pg-theme-${theme}`}>
            {/* Vertical Activity Bar (far left) */}
            <div className="pg-activity-bar">
                <button className={`pg-activity-item ${explorerOpen ? "active" : ""}`} onClick={onToggleExplorer} title="Explorer">
                    <Icon size={20}>
                        <FilesIcon />
                    </Icon>
                </button>
                <button className={`pg-activity-item ${searchOpen ? "active" : ""}`} onClick={onToggleSearch} title="Search">
                    <Icon size={20}>
                        <SearchIcon />
                    </Icon>
                </button>
                <button className={`pg-activity-item ${sessionOpen ? "active" : ""}`} onClick={onToggleSession} title="Session">
                    <Icon size={24}>
                        <HistoryIcon />
                    </Icon>
                </button>
            </div>

            {/* File Dialog */}
            <FileDialog
                globalState={globalState}
                isOpen={fileDialog.open}
                title={fileDialog.title}
                initialValue={fileDialog.initialValue}
                placeholder="Enter filename..."
                submitLabel={fileDialog.type === "rename" ? "Rename" : fileDialog.type === "duplicate" ? "Duplicate" : "Create"}
                onConfirm={confirmFileDialog}
                onCancel={closeFileDialog}
            />

            {/* Local Session Dialog */}
            <LocalSessionDialog onCancel={onToggleSession} isOpen={sessionOpen} globalState={globalState} />
        </div>
    );
});

import * as React from "react";
import { MonacoManager } from "../tools/monaco/monacoManager";
import { Utilities } from "../tools/utilities";
import type { GlobalState } from "../globalState";
import { FileDialog } from "./fileDialog";
import DiffIcon from "../../public/imgs/diff.svg";
import NewIcon from "../../public/imgs/new.svg";
import { LocalSessionDialog } from "./localSessionDialog";
import type { Observer } from "core/Misc";

import "../scss/monaco.scss";
import "../scss/pgTabs.scss";

interface IMonacoComponentProps {
    className?: string;
    refObject: React.RefObject<HTMLDivElement>;
    globalState: GlobalState;
}

type CtxMenuState = { open: boolean; x: number; y: number; path: string | null };
type DialogKind = "create" | "rename" | "duplicate";
type DialogState = {
    open: boolean;
    type: DialogKind | null;
    title: string;
    initialValue: string;
    targetPath?: string;
};

interface IComponentState {
    files: string[];
    active: string;
    order: string[];
    ctx: CtxMenuState;
    fileDialog: DialogState;
    sessionDialogOpen: boolean;
    theme: "dark" | "light";
    dragOverIndex: number;
}

/**
 * Monaco component with tabs, context menu, and file operations.
 * Native scrolling (no custom scroll sync).
 */
export class MonacoComponent extends React.Component<IMonacoComponentProps, IComponentState> {
    private readonly _mutationObserver: MutationObserver;
    private _monacoManager: MonacoManager;
    private _draggingPath: string | null = null;
    private _menuRef: React.RefObject<HTMLDivElement> = React.createRef();
    private _tabsHostRef = React.createRef<HTMLDivElement>();
    private _tabsContentRef = React.createRef<HTMLDivElement>();
    private _disposableObservers: Observer<any>[] = [];

    public constructor(props: IMonacoComponentProps) {
        super(props);
        const gs = props.globalState;
        const files = Object.keys(gs.files || {});
        const order = gs.filesOrder?.length ? gs.filesOrder.slice() : files.slice();
        this.state = {
            files,
            active: gs.activeFilePath,
            order,
            ctx: { open: false, x: 0, y: 0, path: null },
            sessionDialogOpen: false,
            fileDialog: { open: false, type: null, title: "", initialValue: "" },
            theme: this._getCurrentTheme(),
            dragOverIndex: -1,
        };

        this._monacoManager = new MonacoManager(gs);
        this._mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if ((node as HTMLElement).tagName === "TEXTAREA") {
                            (node as HTMLTextAreaElement).contentEditable = "true";
                        }
                        (node as HTMLElement).querySelectorAll?.("textarea").forEach((textArea) => ((textArea as HTMLTextAreaElement).contentEditable = "true"));
                    }
                }
            }
        });
    }

    override componentDidMount() {
        // Event handlers
        const gs = this.props.globalState;
        this._disposableObservers.push(
            gs.onEditorFullcreenRequiredObservable.add(async () => {
                const editorDiv = this.props.refObject.current! as HTMLElement & {
                    webkitRequestFullscreen?: (opts?: FullscreenOptions) => Promise<void> | void;
                    msRequestFullscreen?: () => Promise<void> | void;
                    mozRequestFullScreen?: () => Promise<void> | void;
                };

                if (editorDiv.requestFullscreen) {
                    await editorDiv.requestFullscreen();
                } else if (editorDiv.webkitRequestFullscreen) {
                    await editorDiv.webkitRequestFullscreen();
                }
            })
        );

        this._disposableObservers.push(
            gs.onManifestChangedObservable.add(() => {
                this.setState((s) => ({ ...s }));
            })
        );

        // Sync from GS
        this._disposableObservers.push(
            gs.onFilesChangedObservable.add(() => {
                const f = Object.keys(gs.files || {});
                const nextOrder = this._mergeOrder(this.state.order, f);
                this.setState({ files: f, order: nextOrder }, this._scrollActiveIntoView);
            })
        );

        this._disposableObservers.push(
            gs.onActiveFileChangedObservable.add(() => {
                this.setState({ active: gs.activeFilePath }, this._scrollActiveIntoView);
            })
        );

        this._disposableObservers.push(
            gs.onFilesOrderChangedObservable?.add(() => {
                const ord = gs.filesOrder?.slice() || [];
                this.setState({ order: this._mergeOrder(ord, Object.keys(gs.files || {})) }, this._scrollActiveIntoView);
            })
        );

        // Theme
        this._disposableObservers.push(
            gs.onThemeChangedObservable.add(() => {
                this.setState({ theme: this._getCurrentTheme() });
            })
        );

        // Close ctx menu on outside click
        window.addEventListener("click", this._closeCtxMenu, { capture: true });
        const hostElement = this.props.refObject.current!;
        this._mutationObserver.observe(hostElement, { childList: true, subtree: true });
        void this._monacoManager.setupMonacoAsync(hostElement);

        // first paint: ensure active is in view
        requestAnimationFrame(this._scrollActiveIntoView);
    }

    override componentWillUnmount(): void {
        this._mutationObserver.disconnect();
        window.removeEventListener("click", this._closeCtxMenu, { capture: true });
        for (const d of this._disposableObservers) {
            d.remove();
        }
        this._disposableObservers = [];
        this._monacoManager?.dispose();
    }

    override componentDidUpdate(_prevprops: IMonacoComponentProps, prevState: IComponentState): void {
        // Update context menu position
        if (this.state.ctx.open && this._menuRef.current) {
            const { x, y } = this.state.ctx;
            const el = this._menuRef.current;
            el.style.left = x + "px";
            el.style.top = y + "px";
            el.style.position = "fixed";
        }

        // Ensure theme stays in sync
        const currentTheme = this._getCurrentTheme();
        if (this.state.theme !== currentTheme) {
            this.setState({ theme: currentTheme });
        }

        // If tabs set changed or active changed, nudge into view
        if (prevState.active !== this.state.active || prevState.files.length !== this.state.files.length || prevState.order.join("|") !== this.state.order.join("|")) {
            this._scrollActiveIntoView();
        }
    }

    private _getCurrentTheme(): "dark" | "light" {
        return Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
    }

    private _mergeOrder(order: string[], files: string[]) {
        const set = new Set(files);
        const kept: string[] = [];
        const seen = new Set<string>();
        for (const p of order) {
            if (set.has(p) && !seen.has(p)) {
                kept.push(p);
                seen.add(p);
            }
        }
        const extras = files.filter((p) => !seen.has(p));
        return kept.concat(extras);
    }

    private _orderedFiles(): string[] {
        const { files, order } = this.state;
        if (!order.length) {
            return files;
        }
        const inSet = new Set(files);
        const merged = order.filter((p) => inSet.has(p));
        for (const f of files) {
            if (!merged.includes(f)) {
                merged.push(f);
            }
        }
        return merged;
    }

    private _toDisplay(path: string): string {
        return path.replace(/^\/?src\//, "");
    }
    private _toInternal(displayPath: string): string {
        if (!displayPath) {
            return displayPath;
        }
        return displayPath.startsWith("/") ? displayPath.slice(1) : displayPath;
    }

    private _scrollActiveIntoView = () => {
        const host = this._tabsHostRef.current;
        const content = this._tabsContentRef.current;
        if (!host || !content) {
            return;
        }
        const el = content.querySelector<HTMLDivElement>(`.pg-tab[data-path="${CSS.escape(this.state.active)}"]`);
        el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    };

    private _defaultNewFileName(): string {
        const isTS = this.props.globalState.language !== "JS";
        const base = isTS ? "new.ts" : "new.js";
        let idx = 0;
        let candidate = base;
        const files = this.props.globalState.files || {};
        while (Object.prototype.hasOwnProperty.call(files, this._toInternal(candidate))) {
            idx++;
            const parts = base.split(".");
            const ext = parts.pop();
            candidate = `${parts.join(".")}${idx}.${ext}`;
        }
        return candidate;
    }

    private _defaultDuplicateName(path: string): string {
        const baseFull = path.replace(/\.(\w+)$/, "");
        const ext = (path.match(/\.(\w+)$/) || ["", ""])[1];
        let i = 1;
        let candidate = `${baseFull}.copy${i}${ext ? "." + ext : ""}`;
        const files = this.props.globalState.files || {};
        while (Object.prototype.hasOwnProperty.call(files, candidate)) {
            i++;
            candidate = `${baseFull}.copy${i}${ext ? "." + ext : ""}`;
        }
        return this._toDisplay(candidate);
    }

    private _openLocalSessionDialog = () => this.setState({ sessionDialogOpen: true });
    private _closeLocalSessionDialog = () => this.setState({ sessionDialogOpen: false });

    private _openDialog(type: DialogKind, title: string, initialValue: string, targetPath?: string) {
        this._closeCtxMenu();
        this.setState({ fileDialog: { open: true, type, title, initialValue, targetPath } });
    }
    private _closeFileDialog = () => this.setState({ fileDialog: { open: false, type: null, title: "", initialValue: "" } });

    private _confirmFileDialog = (filename: string) => {
        const { type, targetPath } = this.state.fileDialog;
        if (!type) {
            return;
        }

        const internal = this._toInternal(filename.trim());
        const filesMap = this.props.globalState.files || {};
        const exists = Object.prototype.hasOwnProperty.call(filesMap, internal);

        if (type === "create") {
            if (!internal) {
                return alert("Please enter a file name.");
            }
            if (exists) {
                return alert("A file with that name already exists.");
            }
            this._monacoManager.addFile(internal, `// ${filename}`);

            if (Object.prototype.hasOwnProperty.call(this.props.globalState.files || {}, internal)) {
                const next = this._dedupeOrder(this.state.order.concat(internal));
                this._commitOrder(next);
                this._monacoManager.switchActiveFile(internal);
            }
        }

        if (type === "rename" && targetPath) {
            if (internal === targetPath || this._toDisplay(targetPath) === filename.trim()) {
                return this._closeFileDialog();
            }
            if (exists) {
                return alert("A file with that name already exists.");
            }

            this._monacoManager.renameFile(targetPath, internal);
            const order = this.state.order.map((p: string) => (p === targetPath ? internal : p));
            this._commitOrder(order);
            if (this.props.globalState.entryFilePath === targetPath) {
                this.props.globalState.entryFilePath = internal;
                this.props.globalState.onManifestChangedObservable.notifyObservers();
            }
        }

        if (type === "duplicate" && targetPath) {
            if (exists) {
                return alert("A file with that name already exists.");
            }
            const content = this.props.globalState.files[targetPath] ?? "";
            this._monacoManager.addFile(internal, content);

            if (Object.prototype.hasOwnProperty.call(this.props.globalState.files || {}, internal)) {
                const next = this.state.order.slice();
                const idxInOrder = next.indexOf(targetPath);
                const insertAt = idxInOrder === -1 ? next.length : idxInOrder + 1;
                next.splice(insertAt, 0, internal);
                this._commitOrder(this._dedupeOrder(next));
                this._monacoManager.switchActiveFile(internal);
            }
        }

        this._closeFileDialog();
    };

    private _dedupeOrder(arr: string[]): string[] {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const p of arr) {
            if (!seen.has(p)) {
                seen.add(p);
                out.push(p);
            }
        }
        return out;
    }

    // ---------- File ops ----------
    private _addFile = () => this._openDialog("create", "New file", this._defaultNewFileName());
    private _removeFile = (path: string) => {
        if (this.props.globalState.entryFilePath === path) {
            return alert("You can’t delete the entry file.");
        }
        const disp = this._toDisplay(path);
        if (!confirm(`Delete ${disp}?`)) {
            return;
        }
        this._monacoManager.removeFile(path);
        const next = this.state.order.filter((p: string) => p !== path);
        this._commitOrder(next);
    };
    private _renameFile = (path: string) => this._openDialog("rename", "Rename file", this._toDisplay(path), path);
    private _duplicateFile = (path: string) => this._openDialog("duplicate", "Duplicate file", this._defaultDuplicateName(path), path);
    private _setEntry = (path: string) => {
        this.props.globalState.entryFilePath = path;
        this.props.globalState.onManifestChangedObservable.notifyObservers();
    };
    private _switchFile = (path: string) => this._monacoManager.switchActiveFile(path);

    // ---------- Context menu ----------
    private _openCtxMenu = (e: React.MouseEvent, path: string) => {
        e.preventDefault();
        this.setState({ ctx: { open: true, x: e.clientX, y: e.clientY, path } });
    };
    private _closeCtxMenu = (e?: MouseEvent) => {
        if (!this.state.ctx.open) {
            return;
        }
        if (e && (e.target as HTMLElement).closest(".pg-tab-menu")) {
            return;
        }
        this.setState({ ctx: { open: false, x: 0, y: 0, path: null } });
    };

    // ---------- Drag & drop ----------
    private _onDragStart = (e: React.DragEvent, path: string) => {
        this._draggingPath = path;
        e.dataTransfer.setData("text/plain", path);
        e.dataTransfer.effectAllowed = "move";
        const target = e.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
    };
    private _onDragOver = (e: React.DragEvent, targetPath: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (this._draggingPath && this._draggingPath !== targetPath) {
            const files = this._orderedFiles();
            const targetIndex = files.indexOf(targetPath);
            this.setState({ dragOverIndex: targetIndex });
        }
    };
    private _onDrop = (e: React.DragEvent, targetPath: string) => {
        e.preventDefault();
        const src = this._draggingPath || e.dataTransfer.getData("text/plain");
        this._draggingPath = null;
        this.setState({ dragOverIndex: -1 });
        if (!src || src === targetPath) {
            return;
        }

        const order = this._orderedFiles();
        const from = order.indexOf(src);
        const to = order.indexOf(targetPath);
        if (from === -1 || to === -1) {
            return;
        }

        const next = order.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        this._commitOrder(next);
    };
    private _onDragEnd = () => {
        this._draggingPath = null;
        this.setState({ dragOverIndex: -1 });
    };
    private _commitOrder(next: string[]) {
        const deduped = this._dedupeOrder(next);
        this.setState({ order: deduped });
        this.props.globalState.filesOrder = deduped.slice();
        this.props.globalState.onFilesOrderChangedObservable?.notifyObservers();
    }

    private _onMouseDownTab = (e: React.MouseEvent, path: string) => {
        if (e.button === 1) {
            e.preventDefault();
            if (this.props.globalState.entryFilePath === path) {
                return;
            }
            this._removeFile(path);
        }
    };

    public override render() {
        const { active, theme, dragOverIndex } = this.state;
        const files = this._orderedFiles();
        const submitLabel = this.state.fileDialog.type === "rename" ? "Rename" : this.state.fileDialog.type === "duplicate" ? "Duplicate" : "Create";
        const entry = this.props.globalState.entryFilePath;

        return (
            <div id="monacoHost" ref={this.props.refObject} className={`pg-monaco-wrapper ${this.props.className || ""} pg-theme-${theme}`}>
                <div className="pg-tabs-bar">
                    <div className="pg-tabs-host" ref={this._tabsHostRef} aria-label="Files container">
                        <div className="pg-tabs" ref={this._tabsContentRef} aria-label="Files">
                            {files.map((p, index) => {
                                const isActive = p === active;
                                const isDragging = this._draggingPath === p;
                                const isDragOver = dragOverIndex === index;
                                const isEntry = p === entry;
                                const display = this._toDisplay(p);
                                return (
                                    <div
                                        key={p}
                                        className={`pg-tab ${isActive ? "active" : ""} ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over" : ""}`}
                                        data-path={p}
                                        data-active={isActive ? "true" : "false"}
                                        draggable
                                        title={display + (isEntry ? " (entry)" : "")}
                                        onClick={() => this._switchFile(p)}
                                        onMouseDown={(e) => this._onMouseDownTab(e, p)}
                                        onContextMenu={(e) => this._openCtxMenu(e, p)}
                                        onDragStart={(e) => this._onDragStart(e, p)}
                                        onDragOver={(e) => this._onDragOver(e, p)}
                                        onDrop={(e) => this._onDrop(e, p)}
                                        onDragEnd={this._onDragEnd}
                                    >
                                        {isEntry && (
                                            <span className="pg-tab__entry" aria-label="Entry file" title="Entry file">
                                                ★
                                            </span>
                                        )}
                                        <span className="pg-tab__name">{display}</span>
                                        <button
                                            type="button"
                                            className="pg-tab__close"
                                            aria-label={isEntry ? "Entry file (cannot delete)" : `Close ${display}`}
                                            title={isEntry ? "Entry file (cannot delete)" : "Close"}
                                            disabled={isEntry}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isEntry) {
                                                    this._removeFile(p);
                                                }
                                            }}
                                        >
                                            <svg
                                                aria-hidden="true"
                                                focusable="false"
                                                data-prefix="fas"
                                                data-icon="xmark"
                                                className="svg-inline--fa fa-xmark "
                                                role="img"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 384 512"
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
                                                ></path>
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <button type="button" className="pg-tab__code" onClick={this._openLocalSessionDialog} aria-label="Open Session Dialog" title="Open Session Dialog">
                        <DiffIcon />
                    </button>
                    <button type="button" className="pg-tab__code" onClick={this._addFile} aria-label="New file" title="New file">
                        <NewIcon />
                    </button>
                </div>

                <div style={{ height: "2px", backgroundColor: "var(--pg-tab-active)" }} />

                {/* Context menu */}
                {this.state.ctx.open &&
                    this.state.ctx.path &&
                    (() => {
                        const isEntryTarget = this.state.ctx.path === entry;
                        return (
                            <div className="pg-tab-menu" ref={this._menuRef} onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => {
                                        this._switchFile(this.state.ctx.path!);
                                        this._closeCtxMenu();
                                    }}
                                >
                                    Open
                                </button>
                                <button
                                    onClick={() => {
                                        this._renameFile(this.state.ctx.path!);
                                    }}
                                >
                                    Rename…
                                </button>
                                <button
                                    onClick={() => {
                                        this._duplicateFile(this.state.ctx.path!);
                                    }}
                                >
                                    Duplicate…
                                </button>
                                <hr />
                                <button
                                    disabled={isEntryTarget}
                                    onClick={() => {
                                        if (!isEntryTarget) {
                                            this._setEntry(this.state.ctx.path!);
                                            this._closeCtxMenu();
                                        }
                                    }}
                                    title={isEntryTarget ? "Already the entry file" : "Set as entry"}
                                >
                                    Set as entry
                                </button>
                                <hr />
                                <button
                                    className="danger"
                                    disabled={isEntryTarget}
                                    onClick={() => {
                                        if (!isEntryTarget) {
                                            this._removeFile(this.state.ctx.path!);
                                            this._closeCtxMenu();
                                        }
                                    }}
                                    title={isEntryTarget ? "Entry file cannot be deleted" : "Delete"}
                                >
                                    Delete
                                </button>
                            </div>
                        );
                    })()}

                {/* File Dialog */}
                <FileDialog
                    globalState={this.props.globalState}
                    isOpen={this.state.fileDialog.open}
                    title={this.state.fileDialog.title}
                    initialValue={this.state.fileDialog.initialValue}
                    placeholder="Enter filename..."
                    submitLabel={submitLabel}
                    onConfirm={this._confirmFileDialog}
                    onCancel={this._closeFileDialog}
                />

                {/* Local Session Dialog */}
                <LocalSessionDialog onCancel={this._closeLocalSessionDialog} isOpen={this.state.sessionDialogOpen} globalState={this.props.globalState} />
            </div>
        );
    }
}

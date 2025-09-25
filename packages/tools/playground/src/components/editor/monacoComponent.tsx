// monacoComponent.tsx
import * as React from "react";
import { MonacoManager } from "../../tools/monaco/monacoManager";
import { Utilities } from "../../tools/utilities";
import type { GlobalState } from "../../globalState";
import type { Observer } from "core/Misc";

import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { Splitter } from "shared-ui-components/split/splitter";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";

import type { ActivityBarHandle } from "./activityBarComponent";
import { ActivityBar } from "./activityBarComponent";
import { FileExplorer } from "./fileExplorerComponent";
import AddFileIcon from "./icons/newFile.svg";
import { SearchPanel } from "./searchPanelComponent";

import "../../scss/monaco.scss";
import "../../scss/editor.scss";

interface IMonacoComponentProps {
    className?: string;
    refObject: React.RefObject<HTMLDivElement>;
    globalState: GlobalState;
}

type CtxMenuState = { open: boolean; x: number; y: number; path: string | null };
type DialogKind = "create" | "rename" | "duplicate";

interface IComponentState {
    files: string[];
    active: string;
    order: string[];
    /** Local (non-serialized) ordering of open editor tabs */
    tabOrder: string[];
    ctx: CtxMenuState;
    theme: "dark" | "light";
    dragOverIndex: number;
    explorerOpen: boolean;
    searchOpen: boolean;
    sessionOpen: boolean;
}

/**
 *
 */
export class MonacoComponent extends React.Component<IMonacoComponentProps, IComponentState> {
    private readonly _mutationObserver: MutationObserver;
    private _monacoManager: MonacoManager;
    private _draggingPath: string | null = null;
    private _menuRef: React.RefObject<HTMLDivElement> = React.createRef();
    private _monacoRef: React.RefObject<HTMLDivElement> = React.createRef();
    private _tabsHostRef = React.createRef<HTMLDivElement>();
    private _tabsContentRef = React.createRef<HTMLDivElement>();
    private _disposableObservers: Observer<any>[] = [];
    private _activityBarRef = React.createRef<ActivityBarHandle>();

    public constructor(props: IMonacoComponentProps) {
        super(props);
        const gs = props.globalState;
        const files = Object.keys(gs.files || {});
        const order = gs.filesOrder?.length ? gs.filesOrder.slice() : files.slice();

        if (!gs.openEditors || gs.openEditors.length === 0) {
            const defaultFile = gs.activeFilePath || gs.entryFilePath || files[0];
            if (defaultFile) {
                gs.openEditors = [defaultFile];
                gs.activeEditorPath = defaultFile;
            }
        }

        this.state = {
            files,
            active: gs.activeFilePath,
            order,
            tabOrder: (gs.openEditors || []).slice(),
            ctx: { open: false, x: 0, y: 0, path: null },
            theme: this._getCurrentTheme(),
            dragOverIndex: -1,
            explorerOpen: false,
            sessionOpen: false,
            searchOpen: false,
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

        this._disposableObservers.push(gs.onManifestChangedObservable.add(() => this.setState((s) => ({ ...s }))));

        this._disposableObservers.push(
            gs.onFilesChangedObservable.add(() => {
                const existing = new Set(Object.keys(gs.files));
                const filtered = gs.openEditors.filter((p) => existing.has(p));
                if (filtered.length !== gs.openEditors.length) {
                    gs.openEditors = filtered;
                    gs.onOpenEditorsChangedObservable?.notifyObservers();
                }

                if (gs.activeEditorPath && !existing.has(gs.activeEditorPath)) {
                    gs.activeEditorPath = filtered[0] ?? gs.entryFilePath ?? Object.keys(gs.files)[0];
                    gs.onActiveEditorChangedObservable?.notifyObservers();
                    if (gs.activeEditorPath) {
                        this._monacoManager.switchActiveFile(gs.activeEditorPath);
                    }
                }

                const f = Object.keys(gs.files || {});
                const nextOrder = this._mergeOrder(this.state.order, f);
                this.setState({ files: f, order: nextOrder }, this._scrollActiveIntoView);
            })
        );

        this._disposableObservers.push(
            gs.onActiveFileChangedObservable.add(() => {
                const p = this.props.globalState.activeFilePath;
                if (!p) {
                    return;
                }
                if (!gs.openEditors.includes(p)) {
                    gs.openEditors = [...gs.openEditors, p];
                    gs.onOpenEditorsChangedObservable?.notifyObservers();
                }
                if (gs.activeEditorPath !== p) {
                    gs.activeEditorPath = p;
                    gs.onActiveEditorChangedObservable?.notifyObservers();
                }
                this.setState((s) => ({ ...s }));
            })
        );

        this._disposableObservers.push(
            gs.onOpenEditorsChangedObservable.add(() => {
                // Reconcile local tab order with new open editors set
                const open = gs.openEditors || [];
                this.setState((s) => ({
                    ...s,
                    tabOrder: this._mergeTabOrder(s.tabOrder, open),
                }));
            })
        );
        this._disposableObservers.push(
            gs.onActiveEditorChangedObservable.add(() => {
                const open = gs.openEditors || [];
                this.setState((s) => ({
                    ...s,
                    tabOrder: this._mergeTabOrder(s.tabOrder, open),
                }));
            })
        );

        this._disposableObservers.push(
            gs.onFilesOrderChangedObservable?.add(() => {
                const ord = gs.filesOrder?.slice() || [];
                this.setState({ order: this._mergeOrder(ord, Object.keys(gs.files || {})) }, this._scrollActiveIntoView);
            })
        );

        this._disposableObservers.push(gs.onThemeChangedObservable.add(() => this.setState({ theme: this._getCurrentTheme() })));

        window.addEventListener("click", this._closeCtxMenu, { capture: true });
        window.addEventListener("keydown", this._handleKeyDown, { capture: true });

        const hostElement = this._monacoRef.current!;
        this._mutationObserver.observe(hostElement, { childList: true, subtree: true });
        void this._monacoManager.setupMonacoAsync(hostElement);
        requestAnimationFrame(this._scrollActiveIntoView);
    }

    override componentWillUnmount(): void {
        this._mutationObserver.disconnect();
        window.removeEventListener("click", this._closeCtxMenu, { capture: true });
        window.removeEventListener("keydown", this._handleKeyDown, { capture: true });
        for (const d of this._disposableObservers) {
            d.remove();
        }
        this._disposableObservers = [];
        this._monacoManager?.dispose();
    }

    override componentDidUpdate(_prevProps: any, prevState: IComponentState): void {
        if (this.state.ctx.open && this._menuRef.current) {
            const { x, y } = this.state.ctx;
            const el = this._menuRef.current;
            el.style.left = x + "px";
            el.style.top = y + "px";
            el.style.position = "fixed";
        }
        const currentTheme = this._getCurrentTheme();
        if (this.state.theme !== currentTheme) {
            this.setState({ theme: currentTheme });
        }
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
        const content = this._tabsContentRef.current;
        if (!content) {
            return;
        }
        const el = content.querySelector<HTMLDivElement>(`.pg-tab[data-path="${CSS.escape(this.props.globalState.activeEditorPath || "")}"]`);
        el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    };

    // ---------- Monaco-owned file ops ----------
    private _commitOrder(next: string[]) {
        const deduped = this._dedupeOrder(next);
        this.setState({ order: deduped });
        this.props.globalState.filesOrder = deduped.slice();
        this.props.globalState.onFilesOrderChangedObservable?.notifyObservers();
    }
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

    /**
     * Merge existing local tab order with the current set of open editors.
     * - Preserves relative order of already tracked tabs.
     * - Appends any new open editors at the end.
     * - Removes tabs that were closed.
     * @param current Current local tab order array
     * @param openEditors Current open editors from global state
     * @returns New merged tab order array
     */
    private _mergeTabOrder(current: string[], openEditors: string[]): string[] {
        const openSet = new Set(openEditors);
        const kept = current.filter((p) => openSet.has(p));
        for (const p of openEditors) {
            if (!kept.includes(p)) {
                kept.push(p);
            }
        }
        return kept;
    }

    private _openEditor = (path: string) => {
        const gs = this.props.globalState;
        if (!gs.openEditors.includes(path)) {
            gs.openEditors = [...gs.openEditors, path];
            gs.onOpenEditorsChangedObservable?.notifyObservers();
        }
        gs.activeEditorPath = path;
        gs.onActiveEditorChangedObservable?.notifyObservers();
        this._monacoManager.switchActiveFile(path);
        this.setState((s) => ({ tabOrder: this._mergeTabOrder(s.tabOrder, gs.openEditors) }));
    };

    private _closeEditor = (path: string) => {
        const gs = this.props.globalState;
        const idx = gs.openEditors.indexOf(path);
        if (idx === -1) {
            return;
        }

        const wasActive = gs.activeEditorPath === path;
        const next = gs.openEditors.filter((p) => p !== path);
        gs.openEditors = next;
        gs.onOpenEditorsChangedObservable?.notifyObservers();
        this.setState((s) => ({ tabOrder: s.tabOrder.filter((p) => p !== path) }));

        if (wasActive) {
            const fallback = next[idx - 1] ?? next[idx] ?? Object.keys(gs.files)[0] ?? undefined;
            gs.activeEditorPath = fallback;
            gs.onActiveEditorChangedObservable?.notifyObservers();
            if (fallback) {
                this._monacoManager.switchActiveFile(fallback);
            }
        }
    };

    private _closeOthers = (path: string) => {
        const gs = this.props.globalState;
        gs.openEditors = [path];
        gs.onOpenEditorsChangedObservable?.notifyObservers();
        if (gs.activeEditorPath !== path) {
            gs.activeEditorPath = path;
            gs.onActiveEditorChangedObservable?.notifyObservers();
            this._monacoManager.switchActiveFile(path);
        }
        this.setState({ tabOrder: [path] });
    };

    private _closeAll = () => {
        const gs = this.props.globalState;
        gs.openEditors = [];
        gs.activeEditorPath = undefined;
        gs.onOpenEditorsChangedObservable?.notifyObservers();
        gs.onActiveEditorChangedObservable?.notifyObservers();
        const entry = gs.entryFilePath;
        if (entry) {
            this._openEditor(entry);
        }
        this.setState({ tabOrder: entry ? [entry] : [] });
    };

    private _removeFile = (path: string) => {
        if (this.props.globalState.entryFilePath === path) {
            alert("You can’t delete the entry file.");
            return;
        }
        const disp = this._toDisplay(path);
        if (!confirm(`Delete ${disp}?`)) {
            return;
        }
        this._monacoManager.removeFile(path);
        const next = this.state.order.filter((p: string) => p !== path);
        this._commitOrder(next);
    };

    private _setEntry = (path: string) => {
        this.props.globalState.entryFilePath = path;
        this.props.globalState.onManifestChangedObservable.notifyObservers();
    };

    // Dialog confirm path (from ActivityBar)
    private _confirmFileDialog = (type: DialogKind, filename: string, targetPath?: string) => {
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
            return;
        }

        if (type === "rename" && targetPath) {
            if (internal === targetPath || this._toDisplay(targetPath) === filename.trim()) {
                return;
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
            return;
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
            return;
        }
    };

    // ---------- Keyboard ----------
    private _handleKeyDown = (e: KeyboardEvent) => {
        // New file
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "g") {
            e.preventDefault();
            e.stopPropagation();
            this._activityBarRef.current?.openCreateDialog();
            return;
        }
        // Open search
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
            e.preventDefault();
            e.stopPropagation();
            this.setState({
                searchOpen: true,
                explorerOpen: false,
                sessionOpen: false,
            });
            return;
        }
        // Open File Explorer
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
            e.preventDefault();
            e.stopPropagation();
            this.setState({
                searchOpen: false,
                explorerOpen: true,
                sessionOpen: false,
            });
            return;
        }
        // Toggle Activity Bar
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            e.stopPropagation();
            this.setState((s) => ({
                searchOpen: false,
                explorerOpen: !s.explorerOpen,
                sessionOpen: false,
            }));
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            const handleSecondKey = (e2: KeyboardEvent) => {
                if (e2.key.toLowerCase() === "w") {
                    e2.preventDefault();
                    const activeTab = this.props.globalState.activeEditorPath;
                    if (activeTab) {
                        this._closeOthers(activeTab);
                    }
                }
                if ((e2.metaKey || e2.ctrlKey) && e2.key.toLowerCase() === "w") {
                    e2.preventDefault();
                    this._closeAll();
                }
                window.removeEventListener("keydown", handleSecondKey);
            };
            window.addEventListener("keydown", handleSecondKey);
        }
    };

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

    // ---------- Drag & drop (tabs) ----------
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
            const targetIndex = this.state.tabOrder.indexOf(targetPath);
            if (targetIndex !== -1) {
                this.setState({ dragOverIndex: targetIndex });
            }
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
        // Reorder open editor tabs (visual tab order) instead of full file order.
        const order = [...this.state.tabOrder];
        const from = order.indexOf(src);
        const to = order.indexOf(targetPath);
        if (from === -1 || to === -1 || from === to) {
            return;
        }
        const [moved] = order.splice(from, 1);
        order.splice(to, 0, moved);
        this.setState({ tabOrder: order, dragOverIndex: -1 });
    };
    private _onDragEnd = () => {
        this._draggingPath = null;
        this.setState({ dragOverIndex: -1 });
    };
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
        const { theme, explorerOpen, searchOpen, sessionOpen } = this.state;
        const entry = this.props.globalState.entryFilePath;

        return (
            <div ref={this.props.refObject} id="monacoHost" className={`pg-monaco-wrapper ${this.props.className || ""} pg-theme-${theme}`}>
                <div className="pg-vscode-layout">
                    {/* Far-left Activity Bar */}
                    <ActivityBar
                        ref={this._activityBarRef}
                        globalState={this.props.globalState}
                        onConfirmFileDialog={this._confirmFileDialog}
                        searchOpen={searchOpen}
                        onToggleSearch={() => this.setState((s) => ({ searchOpen: !s.searchOpen, explorerOpen: false, sessionOpen: false }))}
                        explorerOpen={explorerOpen}
                        onToggleExplorer={() => this.setState((s) => ({ explorerOpen: !s.explorerOpen, sessionOpen: false, searchOpen: false }))}
                        sessionOpen={sessionOpen}
                        onToggleSession={() => this.setState((s) => ({ sessionOpen: !s.sessionOpen, explorerOpen: false, searchOpen: false }))}
                    />

                    {/* Split between Explorer (left) and Main (right) */}
                    <SplitContainer direction={SplitDirection.Horizontal} className="pg-split-main">
                        {/* Left: Explorer panel (can be hidden) */}
                        {explorerOpen ? (
                            <div className="pg-explorer-panel">
                                <div className="pg-panel-header">
                                    <span>EXPLORER</span>
                                    <div className="pg-panel-actions">
                                        <button className="pg-panel-action" onClick={() => this._activityBarRef.current?.openCreateDialog()} title="New File">
                                            <AddFileIcon />
                                        </button>
                                    </div>
                                </div>
                                <FileExplorer
                                    globalState={this.props.globalState}
                                    files={this.props.globalState.files}
                                    openFiles={this.props.globalState.openEditors || []}
                                    active={this.props.globalState.activeEditorPath}
                                    onOpen={this._openEditor}
                                    onClose={this._closeEditor}
                                    onCreate={() => this._activityBarRef.current?.openCreateDialog()}
                                    onRename={(oldPath) => this._activityBarRef.current?.openRenameDialog(oldPath, this._toDisplay(oldPath))}
                                    onDelete={(p) => this._removeFile(p)}
                                />
                            </div>
                        ) : searchOpen ? (
                            <div className="pg-explorer-panel">
                                <div className="pg-panel-header">
                                    <span>SEARCH</span>
                                    <div className="pg-panel-actions"></div>
                                </div>
                                <SearchPanel
                                    onOpenAt={(path, range) => {
                                        const p = path;
                                        this._openEditor(p);
                                        const ed = this._monacoManager.editorHost.editor;
                                        if (ed) {
                                            ed.revealRangeInCenter(range, 0 /** ScrollType::Smooth */);
                                            ed.setSelection(range);
                                            ed.focus();
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="pg-explorer-panel-collapsed" />
                        )}
                        {explorerOpen || searchOpen ? <Splitter size={3} minSize={20} initialSize={180} controlledSide={ControlledSize.First} /> : <div />}

                        {/* Right: Tabs (top) + Monaco (below) */}
                        <div className="pg-main-content">
                            {/* Tabs Bar */}
                            <div className="pg-tabs-bar">
                                <div
                                    className="pg-tabs-host"
                                    onDoubleClick={(e) => {
                                        this._activityBarRef.current?.openCreateDialog();
                                        e.stopPropagation();
                                    }}
                                    ref={this._tabsHostRef}
                                >
                                    <div className="pg-tabs" ref={this._tabsContentRef}>
                                        {this.state.tabOrder
                                            .filter((p) => (this.props.globalState.openEditors || []).includes(p))
                                            .map((p) => {
                                                const isActive = p === this.props.globalState.activeEditorPath;
                                                const display = this._toDisplay(p);
                                                const isEntry = p === entry;
                                                return (
                                                    <div
                                                        key={p}
                                                        className={`pg-tab ${isActive ? "active" : ""} ${isEntry ? "entry" : ""} ${this._draggingPath === p ? "dragging" : ""} ${
                                                            this.state.dragOverIndex === this.state.tabOrder.indexOf(p) ? "drag-over" : ""
                                                        }`}
                                                        data-path={p}
                                                        draggable={true}
                                                        onClick={() => this._openEditor(p)}
                                                        onContextMenu={(e) => this._openCtxMenu(e, p)}
                                                        onMouseDown={(e) => this._onMouseDownTab(e, p)}
                                                        onDragStart={(e) => this._onDragStart(e, p)}
                                                        onDragOver={(e) => this._onDragOver(e, p)}
                                                        onDrop={(e) => this._onDrop(e, p)}
                                                        onDragEnd={this._onDragEnd}
                                                        title={`${display}${isEntry ? " (entry)" : ""}${isActive ? " (active)" : ""}`}
                                                    >
                                                        {isEntry && (
                                                            <span className="pg-tab__entry" aria-label="Entry file" title="Entry file">
                                                                {"★"}
                                                            </span>
                                                        )}
                                                        <span className="pg-tab__name">{display}</span>
                                                        <button
                                                            type="button"
                                                            className="pg-tab__close"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                this._closeEditor(p);
                                                            }}
                                                            title="Close tab"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            {/* Editor host */}
                            <div ref={this._monacoRef} className="pg-editor-host" />
                        </div>
                    </SplitContainer>
                </div>

                {/* Tab context menu */}
                {this.state.ctx.open &&
                    this.state.ctx.path &&
                    (() => {
                        const isEntryTarget = this.state.ctx.path === entry;
                        return (
                            <div className="pg-tab-menu" ref={this._menuRef} onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => {
                                        this._openEditor(this.state.ctx.path!);
                                        this._closeCtxMenu();
                                    }}
                                >
                                    Open
                                </button>
                                <button onClick={() => this._activityBarRef.current?.openRenameDialog(this.state.ctx.path!, this._toDisplay(this.state.ctx.path!))}>Rename…</button>
                                <button onClick={() => this._activityBarRef.current?.openDuplicateDialog(this.state.ctx.path!)}>Duplicate…</button>
                                <hr />
                                <button
                                    onClick={() => {
                                        this._closeOthers(this.state.ctx.path!);
                                        this._closeCtxMenu();
                                    }}
                                >
                                    Close Others
                                </button>
                                <button
                                    onClick={() => {
                                        this._closeAll();
                                        this._closeCtxMenu();
                                    }}
                                >
                                    Close All
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
            </div>
        );
    }
}

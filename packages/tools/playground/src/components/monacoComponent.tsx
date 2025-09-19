import * as React from "react";
import { MonacoManager } from "../tools/monaco/monacoManager";
import { Utilities } from "../tools/utilities";
import type { GlobalState } from "../globalState";
import { FileDialog } from "./fileDialog";
// eslint-disable-next-line
import { ScrollbarVisibility } from "monaco-editor/esm/vs/base/common/scrollable";
import { ScrollableElement } from "monaco-editor/esm/vs/base/browser/ui/scrollbar/scrollableElement";
import DiffIcon from "../../public/imgs/diff.svg";
import NewIcon from "../../public/imgs/new.svg";
import { LocalSessionDialog } from "./localSessionDialog";

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
 */
export class MonacoComponent extends React.Component<IMonacoComponentProps, IComponentState> {
    private readonly _mutationObserver: MutationObserver;
    private _monacoManager: MonacoManager;
    private _draggingPath: string | null = null;
    private _menuRef: React.RefObject<HTMLDivElement> = React.createRef();
    private _tabsHostRef = React.createRef<HTMLDivElement>();
    private _tabsContentRef = React.createRef<HTMLDivElement>();
    private _scrollable: ScrollableElement | null = null;
    private _ro?: ResizeObserver;
    private _ptrActive = false;
    private _ptrId = -1;
    private _ptrStartX = 0;
    private _ptrStartY = 0;
    private _ptrStartScrollLeft = 0;

    /**
     * Creates a new MonacoComponent instance.
     * @param props Component props
     */
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

        gs.onEditorFullcreenRequiredObservable.add(() => {
            const editorDiv = this.props.refObject.current! as any;
            if (editorDiv.requestFullscreen) {
                editorDiv.requestFullscreen();
            } else if (editorDiv.webkitRequestFullscreen) {
                editorDiv.webkitRequestFullscreen();
            }
        });

        props.globalState.onManifestChangedObservable.add(() => {
            this.setState((s) => ({ ...s }));
        });

        // Workaround for Fluent focus manager
        this._mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if ((node as HTMLElement).tagName === "TEXTAREA") {
                            (node as HTMLTextAreaElement).contentEditable = "true";
                        }
                        (node as HTMLElement).querySelectorAll?.("textarea").forEach((textArea) => {
                            textArea.contentEditable = "true";
                        });
                    }
                }
            }
        });

        // Sync from GS
        gs.onFilesChangedObservable.add(() => {
            const f = Object.keys(gs.files || {});
            const nextOrder = this._mergeOrder(this.state.order, f);
            this.setState({ files: f, order: nextOrder });
        });
        gs.onActiveFileChangedObservable.add(() => {
            this.setState({ active: gs.activeFilePath });
            requestAnimationFrame(() => {
                this._layoutTabsScrollbar();
                this._syncTabsTransformFromScrollable();
            });
        });
        gs.onFilesOrderChangedObservable?.add(() => {
            const ord = gs.filesOrder?.slice() || [];
            this.setState({ order: this._mergeOrder(ord, Object.keys(gs.files || {})) });
        });

        // Listen for theme changes
        gs.onThemeChangedObservable.add(() => {
            this.setState({ theme: this._getCurrentTheme() });
        });

        // Close ctx menu on click elsewhere if not clicking on the menu itself (guard in handler)
        window.addEventListener("click", this._closeCtxMenu, { capture: true });
    }

    /** Lifecycle: component did mount */
    override componentDidMount() {
        const hostElement = this.props.refObject.current!;
        this._mutationObserver.observe(hostElement, { childList: true, subtree: true });
        void this._monacoManager.setupMonacoAsync(hostElement);

        const host = this._tabsHostRef.current!;
        const content = this._tabsContentRef.current!;
        content.style.willChange = "transform";
        content.style.position = "relative";
        this._scrollable = new ScrollableElement(content, {
            className: "pg-tabs-scrollable",
            horizontal: ScrollbarVisibility.Auto,
            vertical: ScrollbarVisibility.Hidden,
            useShadows: false,
            alwaysConsumeMouseWheel: true,
            handleMouseWheel: true,
            horizontalSliderSize: 3,
            horizontalHasArrows: false,
        });

        this._scrollable.onScroll(this._onTabsScroll);

        const node = this._scrollable.getDomNode();
        host.appendChild(node);
        node.appendChild(content);

        this._layoutTabsScrollbar();
        this._syncTabsTransformFromScrollable();

        this._ro = new ResizeObserver(() => this._layoutTabsScrollbar());
        this._ro.observe(host);
        this._ro.observe(content);

        this._scrollActiveIntoView();

        window.addEventListener("resize", this._layoutTabsScrollbar, { passive: true } as any);

        this.props.globalState.onFilesChangedObservable.add(this._layoutTabsScrollbar);
        this.props.globalState.onFilesOrderChangedObservable?.add(this._layoutTabsScrollbar);

        const wrapper = this._scrollable!.getDomNode();
        wrapper.addEventListener("pointerdown", this._onPtrDown, { passive: false });
        window.addEventListener("pointermove", this._onPtrMove, { passive: false });
        window.addEventListener("pointerup", this._onPtrUp, { passive: true });
        window.addEventListener("pointercancel", this._onPtrUp, { passive: true });
    }

    /** Lifecycle: component will unmount */
    override componentWillUnmount(): void {
        this._mutationObserver.disconnect();
        window.removeEventListener("click", this._closeCtxMenu, { capture: true } as any);
        window.removeEventListener("resize", this._layoutTabsScrollbar as any);

        this.props.globalState.onFilesChangedObservable.removeCallback?.(this._layoutTabsScrollbar as any);
        this.props.globalState.onFilesOrderChangedObservable?.removeCallback?.(this._layoutTabsScrollbar as any);
        const wrapper = (this._scrollable as any)?.getDomNode();
        if (wrapper) {
            wrapper.removeEventListener("pointerdown", this._onPtrDown as any);
        }
        window.removeEventListener("pointermove", this._onPtrMove as any);
        window.removeEventListener("pointerup", this._onPtrUp as any);
        window.removeEventListener("pointercancel", this._onPtrUp as any);
        this._ro?.disconnect();
        this._scrollable?.dispose();
        this._scrollable = null;

        // Dispose Monaco manager to clean up TypeScript workers and services
        this._monacoManager?.dispose();
    }

    private _onPtrDown = (e: PointerEvent) => {
        if (e.pointerType !== "touch" && e.pointerType !== "pen") {
            return;
        }

        this._ptrActive = true;
        this._ptrId = e.pointerId;
        this._ptrStartX = e.clientX;
        this._ptrStartY = e.clientY;

        const pos = (this._scrollable as any).getScrollPosition?.() || { scrollLeft: 0 };
        this._ptrStartScrollLeft = pos.scrollLeft || 0;

        try {
            (e.target as Element).setPointerCapture?.(e.pointerId);
        } catch {}

        e.preventDefault();
    };

    private _onPtrMove = (e: PointerEvent) => {
        if (!this._ptrActive || e.pointerId !== this._ptrId) {
            return;
        }

        const dx = e.clientX - this._ptrStartX;
        const dy = e.clientY - this._ptrStartY;
        if (Math.abs(dx) < Math.abs(dy) * 1.2) {
            return;
        }

        const wrapper = this._scrollable!.getDomNode();
        const width = wrapper.clientWidth;
        const content = this._tabsContentRef.current!;
        let scrollWidth = content.scrollWidth;
        if (scrollWidth <= width) {
            scrollWidth = Array.from(content.children).reduce((s, el) => s + (el as HTMLElement).offsetWidth, 0);
        }

        const max = Math.max(0, scrollWidth - width);
        const next = this._clamp(this._ptrStartScrollLeft - dx, 0, max);

        (this._scrollable as any).setScrollPositionNow?.({ scrollLeft: next });
        this._onTabsScroll({ scrollLeft: next });

        e.preventDefault();
    };

    private _onPtrUp = (e: PointerEvent) => {
        if (e.pointerId !== this._ptrId) {
            return;
        }
        this._ptrActive = false;
        this._ptrId = -1;
    };

    private _clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n));
    }

    private _measureTabsWidth(): number {
        const content = this._tabsContentRef.current!;
        let w = 0;
        // force layout by reading offsetWidth
        const tabs = content.querySelectorAll<HTMLElement>(".pg-tab");
        tabs.forEach((t) => {
            w += t.offsetWidth;
        });
        // account for subpixel/borders
        return Math.ceil(w);
    }

    private _onTabsScroll = (e: { scrollLeft: number }) => {
        const content = this._tabsContentRef.current!;
        content.style.transform = `translateX(${-e.scrollLeft}px)`;
    };

    private _syncTabsTransformFromScrollable() {
        const content = this._tabsContentRef.current!;
        if (!content) {
            return;
        }
        const pos = (this._scrollable as any)?.getScrollPosition?.();
        const scrollLeft = pos?.scrollLeft ?? 0;
        content.style.transform = `translateX(${-scrollLeft}px)`;
    }

    private _layoutTabsScrollbar = () => {
        if (!this._scrollable) {
            return;
        }

        const viewport = this._scrollable.getDomNode();
        const content = this._tabsContentRef.current!;
        const width = viewport.clientWidth;
        const height = viewport.clientHeight || this._tabsHostRef.current!.clientHeight || 0;

        const measured = this._measureTabsWidth();
        content.style.width = measured + "px";

        const scrollWidth = measured;
        const scrollHeight = content.scrollHeight;

        (this._scrollable as any).setScrollDimensions?.({ width, height, scrollWidth, scrollHeight });

        const maxScrollLeft = Math.max(0, scrollWidth - width);

        if (maxScrollLeft === 0) {
            (this._scrollable as any).setScrollPositionNow?.({ scrollLeft: 0 });
            content.style.transform = "translateX(0)";
            return;
        }

        const activeEl = content.querySelector<HTMLElement>(`.pg-tab[data-path="${CSS.escape(this.state.active)}"]`);
        const pos = (this._scrollable as any).getScrollPosition?.() || { scrollLeft: 0 };
        const curLeft = pos.scrollLeft ?? 0;

        let nextLeft = curLeft;
        if (activeEl) {
            const left = activeEl.offsetLeft;
            const right = left + activeEl.offsetWidth;
            const viewRight = curLeft + width;
            if (left < curLeft) {
                nextLeft = left;
            } else if (right > viewRight) {
                nextLeft = right - width;
            }
        }

        nextLeft = Math.max(0, Math.min(nextLeft, maxScrollLeft));

        if (Math.abs(nextLeft - curLeft) > 0.5) {
            (this._scrollable as any).setScrollPositionNow?.({ scrollLeft: nextLeft });
        }

        this._syncTabsTransformFromScrollable();
    };

    /**
     *
     * @param _prevprops
     * @param prevState
     */
    override componentDidUpdate(_prevprops: IMonacoComponentProps, prevState: IComponentState): void {
        // Update context menu position
        if (this.state.ctx.open && this._menuRef.current) {
            if (this.state.ctx.open && this._menuRef.current) {
                const { x, y } = this.state.ctx;
                const el = this._menuRef.current;
                el.style.left = x + "px";
                el.style.top = y + "px";
                el.style.position = "fixed";
            }
        }

        // Ensure theme is in sync
        const currentTheme = this._getCurrentTheme();
        if (this.state.theme !== currentTheme) {
            this.setState({ theme: currentTheme });
        }

        if (prevState.active !== this.state.active || prevState.files.length !== this.state.files.length || prevState.order.join("|") !== this.state.order.join("|")) {
            requestAnimationFrame(() => {
                this._layoutTabsScrollbar();
                this._syncTabsTransformFromScrollable();
            });
        }
    }

    // ---------- Path helpers ----------
    /**
     * Normalize a stored path to a display path (strip any legacy /src/ prefix if present).
     * @param path Path possibly containing legacy prefix.
     * @returns Display path without legacy prefix.
     */
    private _toDisplay(path: string): string {
        return path.replace(/^\/?src\//, "");
    }
    /**
     * Convert a user entered filename to our internal representation (root‑relative).
     * @param displayPath User supplied path.
     * @returns Normalized internal path.
     */
    private _toInternal(displayPath: string): string {
        if (!displayPath) {
            return displayPath;
        }
        return displayPath.startsWith("/") ? displayPath.slice(1) : displayPath;
    }

    // ---------- Utilities ----------
    private _getCurrentTheme(): "dark" | "light" {
        return Utilities.ReadStringFromStore("theme", "Light") === "Dark" ? "dark" : "light";
    }

    private _mergeOrder(order: string[], files: string[]) {
        const set = new Set(files);
        const kept = order.filter((p: string) => set.has(p));
        const extras = files.filter((p: string) => !kept.includes(p));
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

    private _scrollActiveIntoView() {
        const el = document.querySelector<HTMLDivElement>(`.pg-tab[data-path="${CSS.escape(this.state.active)}"]`);
        el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    }

    private _defaultNewFileName(): string {
        const isTS = this.props.globalState.language !== "JS";
        const base = isTS ? "new.ts" : "new.js";
        let idx = 0;
        let candidate = base;
        while ((this.props.globalState.files as any)[this._toInternal(candidate)]) {
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
        while ((this.props.globalState.files as any)[candidate]) {
            i++;
            candidate = `${baseFull}.copy${i}${ext ? "." + ext : ""}`;
        }
        return this._toDisplay(candidate);
    }

    private _openLocalSessionDialog = () => {
        this.setState({ sessionDialogOpen: true });
    };

    private _closeLocalSessionDialog = () => {
        this.setState({ sessionDialogOpen: false });
    };

    private _openDialog(type: DialogKind, title: string, initialValue: string, targetPath?: string) {
        this._closeCtxMenu();
        this.setState({
            fileDialog: { open: true, type, title, initialValue, targetPath },
        });
    }

    private _closeFileDialog = () => {
        this.setState({ fileDialog: { open: false, type: null, title: "", initialValue: "" } });
    };

    private _confirmFileDialog = (filename: string) => {
        const { type, targetPath } = this.state.fileDialog;
        if (!type) {
            return;
        }

        const internal = this._toInternal(filename.trim());
        const exists = (this.props.globalState.files as any)[internal];

        if (type === "create") {
            if (exists) {
                alert("A file with that name already exists.");
                return;
            }
            this._monacoManager.addFile(internal, "");
            const next = this.state.order.slice();
            next.push(internal);
            this._commitOrder(next);
            this._monacoManager.switchActiveFile(internal);
        }

        if (type === "rename" && targetPath) {
            if (internal === targetPath || this._toDisplay(targetPath) === filename.trim()) {
                this._closeFileDialog();
                return;
            }
            if (exists) {
                alert("A file with that name already exists.");
                return;
            }
            if ((this._monacoManager as any).renameFile) {
                (this._monacoManager as any).renameFile(targetPath, internal);
            } else {
                const content = this.props.globalState.files[targetPath] ?? "";
                this._monacoManager.addFile(internal, content);
                if (this.state.active === targetPath) {
                    this._monacoManager.switchActiveFile(internal);
                }
                this._monacoManager.removeFile(targetPath);
            }
            const order = this.state.order.map((p: string) => (p === targetPath ? internal : p));
            this._commitOrder(order);
            if (this.props.globalState.entryFilePath === targetPath) {
                this.props.globalState.entryFilePath = internal;
                this.props.globalState.onManifestChangedObservable.notifyObservers();
            }
        }

        if (type === "duplicate" && targetPath) {
            if (exists) {
                alert("A file with that name already exists.");
                return;
            }
            this._monacoManager.addFile(internal, this.props.globalState.files[targetPath] ?? "");
            const next = this.state.order.slice();
            next.splice(this._orderedFiles().indexOf(targetPath) + 1, 0, internal);
            this._commitOrder(next);
            this._monacoManager.switchActiveFile(internal);
        }

        this._closeFileDialog();
    };

    // ---------- File ops ----------
    private _addFile = () => {
        const candidate = this._defaultNewFileName();
        this._openDialog("create", "New file", candidate);
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

    private _renameFile = (path: string) => {
        this._openDialog("rename", "Rename file", this._toDisplay(path), path);
    };

    private _duplicateFile = (path: string) => {
        const candidate = this._defaultDuplicateName(path);
        this._openDialog("duplicate", "Duplicate file", candidate, path);
    };

    private _setEntry = (path: string) => {
        this.props.globalState.entryFilePath = path;
        this.props.globalState.onManifestChangedObservable.notifyObservers();
    };

    private _switchFile = (path: string) => {
        this._monacoManager.switchActiveFile(path);
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
            // If clicking inside the context menu, do not close it
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
        this.setState({ order: next });
        this.props.globalState.filesOrder = next.slice();
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

    /**
     * Render component
     * @returns JSX element
     */
    public override render() {
        const { active, theme, dragOverIndex } = this.state;
        const files = this._orderedFiles();
        const submitLabel = this.state.fileDialog.type === "rename" ? "Rename" : this.state.fileDialog.type === "duplicate" ? "Duplicate" : "Create";
        const entry = this.props.globalState.entryFilePath;
        return (
            <div ref={this.props.refObject} className={`pg-monaco-wrapper ${this.props.className || ""} pg-theme-${theme}`}>
                <div className="pg-tabs-bar">
                    <div className="pg-tabs-host" ref={this._tabsHostRef}>
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
                                                if (isEntry) {
                                                    return;
                                                }
                                                this._removeFile(p);
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
                            <div className="pg-tab-menu" ref={this._menuRef} data-x={this.state.ctx.x} data-y={this.state.ctx.y} onClick={(e) => e.stopPropagation()}>
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
                                        if (isEntryTarget) {
                                            return;
                                        }
                                        this._setEntry(this.state.ctx.path!);
                                        this._closeCtxMenu();
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
                                        if (isEntryTarget) {
                                            return;
                                        }
                                        this._removeFile(this.state.ctx.path!);
                                        this._closeCtxMenu();
                                    }}
                                    title={isEntryTarget ? "Entry file cannot be deleted" : "Delete"}
                                >
                                    Delete
                                </button>
                            </div>
                        );
                    })()}

                {/* File Dialog (Create / Rename / Duplicate) */}
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

                {/* Local Session Dialog for Rehydration */}
                <LocalSessionDialog onCancel={this._closeLocalSessionDialog} isOpen={this.state.sessionDialogOpen} globalState={this.props.globalState} />
            </div>
        );
    }
}

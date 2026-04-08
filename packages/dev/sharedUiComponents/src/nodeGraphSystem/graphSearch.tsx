import * as React from "react";
import * as styles from "./graphSearch.module.scss";
import { type GraphCanvasComponent } from "./graphCanvas";
import { type GraphNode } from "./graphNode";
import { type GraphFrame } from "./graphFrame";

/** A search result pointing to either a node or a frame. */
interface ISearchResult {
    node?: GraphNode;
    frame?: GraphFrame;
    label: string;
}

/**
 * Props for the GraphSearchComponent.
 */
export interface IGraphSearchComponentProps {
    /** The graph canvas to search within */
    canvas: GraphCanvasComponent;
}

/** Internal state for GraphSearchComponent. */
interface IGraphSearchState {
    /** Whether the search overlay is visible */
    visible: boolean;
    /** The current search query */
    query: string;
    /** Index of the currently focused result */
    currentIndex: number;
    /** Matching search results */
    results: ISearchResult[];
}

/**
 * An overlay search bar for finding nodes and frames in the graph by name or type.
 * Triggered via an observable; press Escape or the close button to dismiss.
 */
export class GraphSearchComponent extends React.Component<IGraphSearchComponentProps, IGraphSearchState> {
    private _inputRef = React.createRef<HTMLInputElement>();
    private _escHandler: ((evt: KeyboardEvent) => void) | null = null;

    /** @internal */
    constructor(props: IGraphSearchComponentProps) {
        super(props);
        this.state = { visible: false, query: "", currentIndex: 0, results: [] };
    }

    /** Show the search bar and focus the input. */
    show() {
        if (this._escHandler) {
            this.props.canvas.stateManager.hostDocument.removeEventListener("keydown", this._escHandler);
            this._escHandler = null;
        }
        this.setState({ visible: true, query: "", currentIndex: 0, results: [] }, () => {
            this._inputRef.current?.focus();
        });
        this._escHandler = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") {
                this.hide();
            }
        };
        this.props.canvas.stateManager.hostDocument.addEventListener("keydown", this._escHandler);
    }

    /** Hide the search bar and clear highlights. */
    hide() {
        this._clearHighlights(this.state.results);
        this.setState({ visible: false, query: "", currentIndex: 0, results: [] });
        if (this._escHandler) {
            this.props.canvas.stateManager.hostDocument.removeEventListener("keydown", this._escHandler);
            this._escHandler = null;
        }
    }

    private _search(query: string) {
        if (!query.trim()) {
            this._clearHighlights(this.state.results);
            this.setState({ query, results: [], currentIndex: 0 });
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results: ISearchResult[] = [];

        for (const node of this.props.canvas.nodes) {
            const name = node.name || "";
            const className = node.content.getClassName ? node.content.getClassName() : "";
            if (name.toLowerCase().includes(lowerQuery) || className.toLowerCase().includes(lowerQuery)) {
                results.push({ node, label: name || className });
            }
        }

        for (const frame of this.props.canvas.frames) {
            if (frame.name.toLowerCase().includes(lowerQuery)) {
                results.push({ frame, label: frame.name });
            }
        }

        // Clear old highlights, apply new
        this._clearHighlights(this.state.results);
        this._applyHighlights(results);

        const newIndex = results.length > 0 ? 0 : 0;
        this.setState({ query, results, currentIndex: newIndex }, () => {
            if (results.length > 0) {
                this._navigateTo(0);
            }
        });
    }

    private _applyHighlights(results: ISearchResult[]) {
        for (const r of results) {
            if (r.node) {
                r.node.rootElement.classList.add(styles["search-match"]);
            } else if (r.frame) {
                r.frame.element.classList.add(styles["search-match"]);
            }
        }
    }

    private _clearHighlights(results: ISearchResult[]) {
        for (const r of results) {
            if (r.node) {
                r.node.rootElement.classList.remove(styles["search-match"]);
                r.node.rootElement.classList.remove(styles["search-current"]);
            } else if (r.frame) {
                r.frame.element.classList.remove(styles["search-match"]);
                r.frame.element.classList.remove(styles["search-current"]);
            }
        }
    }

    private _navigateTo(index: number) {
        const { results } = this.state;
        if (results.length === 0) {
            return;
        }

        // Remove current highlight from previous
        const prev = results[this.state.currentIndex];
        if (prev) {
            if (prev.node) {
                prev.node.rootElement.classList.remove(styles["search-current"]);
            } else if (prev.frame) {
                prev.frame.element.classList.remove(styles["search-current"]);
            }
        }

        const result = results[index];
        if (result.node) {
            result.node.rootElement.classList.add(styles["search-current"]);
            this.props.canvas.zoomToNode(result.node);
            this.props.canvas.stateManager.onSelectionChangedObservable.notifyObservers({ selection: result.node });
        } else if (result.frame) {
            result.frame.element.classList.add(styles["search-current"]);
            // Center on frame
            const canvas = this.props.canvas;
            const hostWidth = (canvas as any)._rootContainer?.clientWidth || 800;
            const hostHeight = (canvas as any)._rootContainer?.clientHeight || 600;
            canvas.x = -result.frame.x + hostWidth / (2 * canvas.zoom) - (result.frame.width || 200) / 2;
            canvas.y = -result.frame.y + hostHeight / (2 * canvas.zoom) - 20;
            this.props.canvas.stateManager.onSelectionChangedObservable.notifyObservers({ selection: result.frame });
        }

        this.setState({ currentIndex: index });
    }

    private _goNext() {
        const { results, currentIndex } = this.state;
        if (results.length === 0) {
            return;
        }
        const next = (currentIndex + 1) % results.length;
        this._navigateTo(next);
    }

    private _goPrev() {
        const { results, currentIndex } = this.state;
        if (results.length === 0) {
            return;
        }
        const prev = (currentIndex - 1 + results.length) % results.length;
        this._navigateTo(prev);
    }

    private _onKeyDown = (evt: React.KeyboardEvent) => {
        if (evt.key === "Enter") {
            evt.preventDefault();
            if (evt.shiftKey) {
                this._goPrev();
            } else {
                this._goNext();
            }
        } else if (evt.key === "ArrowDown") {
            evt.preventDefault();
            this._goNext();
        } else if (evt.key === "ArrowUp") {
            evt.preventDefault();
            this._goPrev();
        }
        // Stop propagation so the canvas doesn't handle it
        evt.stopPropagation();
    };

    /** @internal */
    override componentWillUnmount() {
        this._clearHighlights(this.state.results);
        if (this._escHandler) {
            this.props.canvas.stateManager.hostDocument.removeEventListener("keydown", this._escHandler);
            this._escHandler = null;
        }
    }

    /** @internal */
    override render() {
        if (!this.state.visible) {
            return null;
        }

        const { results, currentIndex, query } = this.state;
        const hasResults = results.length > 0;

        return (
            <div className={styles["search-overlay"]}>
                <input
                    ref={this._inputRef}
                    className={styles["search-input"]}
                    type="text"
                    placeholder="Find in graph..."
                    value={query}
                    onChange={(e) => this._search(e.target.value)}
                    onKeyDown={this._onKeyDown}
                    autoFocus
                />
                <span className={styles["result-count"]}>{query ? (hasResults ? `${currentIndex + 1} of ${results.length}` : "No results") : ""}</span>
                <button className={styles["nav-btn"]} disabled={!hasResults} onClick={() => this._goPrev()} title="Previous match (Shift+Enter)">
                    &#9650;
                </button>
                <button className={styles["nav-btn"]} disabled={!hasResults} onClick={() => this._goNext()} title="Next match (Enter)">
                    &#9660;
                </button>
                <button className={styles["close-btn"]} onClick={() => this.hide()} title="Close (Escape)">
                    &#10005;
                </button>
            </div>
        );
    }
}

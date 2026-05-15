import * as React from "react";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { type GlobalState } from "../../globalState";

import "./graphTabBar.scss";

interface IGraphTabBarProps {
    globalState: GlobalState;
}

interface IGraphTabBarState {
    graphs: Array<{ name: string; uniqueId: string }>;
    activeIndex: number;
    editingIndex: number | null;
    editingName: string;
}

/**
 * Tab bar component for switching between multiple flow graphs in the coordinator.
 */
export class GraphTabBarComponent extends React.Component<IGraphTabBarProps, IGraphTabBarState> {
    private _graphListObserver: Nullable<Observer<void>> = null;
    private _activeGraphObserver: Nullable<Observer<FlowGraph>> = null;
    private _scrollRef = React.createRef<HTMLDivElement>();

    constructor(props: IGraphTabBarProps) {
        super(props);
        this.state = {
            graphs: this._getGraphList(),
            activeIndex: props.globalState.activeGraphIndex,
            editingIndex: null,
            editingName: "",
        };
    }

    private _getGraphList(): Array<{ name: string; uniqueId: string }> {
        const coordinator = this.props.globalState.coordinator;
        if (!coordinator) {
            return [];
        }
        return coordinator.flowGraphs.map((g) => ({ name: g.name, uniqueId: g.uniqueId }));
    }

    override componentDidMount() {
        this._graphListObserver = this.props.globalState.onGraphListChanged.add(() => {
            this.setState({ graphs: this._getGraphList() });
        });
        this._activeGraphObserver = this.props.globalState.onActiveGraphChanged.add(() => {
            this.setState({
                activeIndex: this.props.globalState.activeGraphIndex,
                graphs: this._getGraphList(),
            });
        });
    }

    override componentWillUnmount() {
        if (this._graphListObserver) {
            this.props.globalState.onGraphListChanged.remove(this._graphListObserver);
        }
        if (this._activeGraphObserver) {
            this.props.globalState.onActiveGraphChanged.remove(this._activeGraphObserver);
        }
    }

    private _onTabClick(index: number) {
        if (index === this.state.activeIndex) {
            return;
        }
        this.props.globalState.activeGraphIndex = index;
    }

    private _onTabDoubleClick(index: number) {
        const graph = this.state.graphs[index];
        if (!graph) {
            return;
        }
        this.setState({ editingIndex: index, editingName: graph.name });
    }

    private _commitRename() {
        const { editingIndex, editingName } = this.state;
        if (editingIndex === null) {
            return;
        }
        const trimmed = editingName.trim();
        if (trimmed) {
            this.props.globalState.renameGraph(editingIndex, trimmed);
        }
        this.setState({ editingIndex: null, editingName: "" });
    }

    private _onAddGraph() {
        this.props.globalState.addGraph();
        this.props.globalState.onResetRequiredObservable.notifyObservers(true);
        this.props.globalState.onClearUndoStack.notifyObservers();
    }

    private _onCloseTab(index: number, evt: React.MouseEvent) {
        evt.stopPropagation();
        if (this.state.graphs.length <= 1) {
            return;
        }
        this.props.globalState.removeGraph(index);
        this.props.globalState.onResetRequiredObservable.notifyObservers(true);
        this.props.globalState.onClearUndoStack.notifyObservers();
    }

    override render() {
        const { graphs, activeIndex, editingIndex, editingName } = this.state;

        if (graphs.length === 0) {
            return null;
        }

        return (
            <div className="fge-graph-tab-bar" role="tablist">
                <div className="fge-tab-scroll-area" ref={this._scrollRef}>
                    {graphs.map((graph, index) => (
                        <div
                            key={graph.uniqueId}
                            className={`fge-tab${index === activeIndex ? " fge-tab-active" : ""}`}
                            role="tab"
                            tabIndex={index === activeIndex ? 0 : -1}
                            aria-selected={index === activeIndex}
                            aria-label={graph.name}
                            onClick={() => this._onTabClick(index)}
                            onDoubleClick={() => this._onTabDoubleClick(index)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    this._onTabClick(index);
                                } else if (e.key === "ArrowRight") {
                                    e.preventDefault();
                                    const next = (index + 1) % graphs.length;
                                    (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
                                } else if (e.key === "ArrowLeft") {
                                    e.preventDefault();
                                    const prev = (index - 1 + graphs.length) % graphs.length;
                                    (e.currentTarget.parentElement?.children[prev] as HTMLElement)?.focus();
                                }
                            }}
                            title={graph.name}
                        >
                            {editingIndex === index ? (
                                <input
                                    className="fge-tab-name-input"
                                    value={editingName}
                                    onChange={(e) => this.setState({ editingName: e.target.value })}
                                    onBlur={() => this._commitRename()}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            this._commitRename();
                                        } else if (e.key === "Escape") {
                                            this.setState({ editingIndex: null, editingName: "" });
                                        }
                                    }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="fge-tab-name">{graph.name}</span>
                            )}
                            {graphs.length > 1 && (
                                <button className="fge-tab-close" onClick={(evt) => this._onCloseTab(index, evt)} title="Close graph" aria-label={`Close ${graph.name}`}>
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button className="fge-tab-add" onClick={() => this._onAddGraph()} title="Add new graph" aria-label="Add new graph">
                    +
                </button>
            </div>
        );
    }
}

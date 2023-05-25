import * as React from "react";
import type { StateManager } from "./stateManager";
import "./searchBox.scss";
import { NodeLedger } from "./nodeLedger";

export interface ISearchBoxComponentProps {
    stateManager: StateManager;
}

/**
 * The search box component.
 */
export class SearchBoxComponent extends React.Component<ISearchBoxComponentProps, { isVisible: boolean; filter: string; selectedIndex: number }> {
    private _handleEscKey: (evt: KeyboardEvent) => void;
    private _targetX: number;
    private _targetY: number;
    private _nodes: string[];

    constructor(props: ISearchBoxComponentProps) {
        super(props);

        this.state = { isVisible: false, filter: "", selectedIndex: 0 };

        this._handleEscKey = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") {
                this.hide();
            }
        };

        this.props.stateManager.onSearchBoxRequiredObservable.add((loc) => {
            this._targetX = loc.x;
            this._targetY = loc.y;
            this.setState({ isVisible: true, filter: "", selectedIndex: 0 });
            this.props.stateManager.hostDocument!.addEventListener("keydown", this._handleEscKey);
        });
    }

    hide() {
        this.setState({ isVisible: false });
        this.props.stateManager.modalIsDisplayed = false;
        this.props.stateManager.hostDocument!.removeEventListener("keydown", this._handleEscKey);
    }

    onFilterChange(evt: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ filter: evt.target.value });
    }

    onNewNodeRequested(name: string) {
        this.props.stateManager.onNewBlockRequiredObservable.notifyObservers({
            type: name,
            targetX: this._targetX,
            targetY: this._targetY,
            needRepositioning: true,
            smartAdd: true,
        });

        this.hide();
    }

    onKeyDown(evt: React.KeyboardEvent) {
        if (evt.code === "Enter" && this._nodes.length > 0) {
            this.onNewNodeRequested(this._nodes[this.state.selectedIndex]);
            return;
        }

        if (evt.code === "ArrowDown" && this._nodes.length > 0) {
            this.setState({ selectedIndex: Math.min(this.state.selectedIndex + 1, this._nodes.length - 1) });
            return;
        }

        if (evt.code === "ArrowUp" && this._nodes.length > 0) {
            this.setState({ selectedIndex: Math.max(this.state.selectedIndex - 1, 0) });
            return;
        }
    }

    render() {
        if (!this.state.isVisible) {
            return null;
        }

        const expectedWidth = 300;
        const expectedHeight = 400;

        // Sort and deduplicate the node names.
        this._nodes = Array.from(new Set(NodeLedger.RegisteredNodeNames.sort()));

        if (this.state.filter) {
            const filter = this.state.filter.toLowerCase().trim();
            this._nodes = this._nodes.filter((name) => NodeLedger.NameFormatter(name).toLowerCase().includes(filter));
        }

        const containerRect = this.props.stateManager.hostDocument.getElementById("graph-canvas")!.getBoundingClientRect();
        const targetX = this._targetX - (expectedWidth / 2 + containerRect.x);
        const targetY = this._targetY - (expectedHeight / 2 + containerRect.y);
        const locStyle = {
            left: targetX + "px",
            top: targetY + "px",
        };

        if (targetX + expectedWidth > containerRect.width) {
            locStyle.left = containerRect.width - expectedWidth - 10 + "px";
        } else if (targetX < 10) {
            locStyle.left = "10px";
        }

        if (targetY + expectedHeight > containerRect.height) {
            locStyle.top = containerRect.height - expectedHeight - 10 + "px";
        } else if (targetY < 10) {
            locStyle.top = "10px";
        }

        return (
            <div id="graph-search-container">
                <div id="graph-search-picking-blocker" onClick={() => this.hide()}></div>
                <div id="graph-search-box" style={locStyle}>
                    <div className="graph-search-box-title">Add a node</div>
                    <input
                        type="text"
                        placeholder="Search..."
                        onChange={(evt) => this.onFilterChange(evt)}
                        onKeyDown={(evt) => this.onKeyDown(evt)}
                        value={this.state.filter}
                        className="graph-search-box-filter"
                        autoFocus={true}
                        tabIndex={0}
                    />
                    <div className="graph-search-box-list">
                        {this._nodes.map((name, i) => {
                            return (
                                <div
                                    className={"graph-search-box-list-item " + (this.state.selectedIndex === i ? "selected " : "")}
                                    onClick={() => this.onNewNodeRequested(name)}
                                    key={name}
                                >
                                    {NodeLedger.NameFormatter(name)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

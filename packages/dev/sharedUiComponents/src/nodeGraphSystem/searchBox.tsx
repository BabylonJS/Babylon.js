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
export class SearchBoxComponent extends React.Component<ISearchBoxComponentProps, {isVisible: boolean, filter: string}> {
    private _handleEscKey: (evt: KeyboardEvent) => void;
    private _targetX: number;
    private _targetY: number;
    private _nodes: string[];

    constructor(props: ISearchBoxComponentProps) {
        super(props);

        this.state = { isVisible: false, filter: "" };

        this._handleEscKey = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") {
                this.hide();
            }
        };

        this.props.stateManager.onSearchBoxRequiredObservable.add((loc) => {
            this._targetX = loc.x;
            this._targetY = loc.y;
            this.setState({ isVisible: true, filter: "" });
            this.props.stateManager.hostDocument!.addEventListener("keydown", this._handleEscKey);
        });
    }

    hide() {
        this.setState({ isVisible: false });
        this.props.stateManager.modalIsDisplayed = false;
        this.props.stateManager.hostDocument!.removeEventListener("keydown", this._handleEscKey);
    }

    onFilterChange(evt: React.ChangeEvent<HTMLInputElement>) {
        this.setState({filter: evt.target.value});
    }

    onNewNodeRequested(name: string) {
        this.props.stateManager.onNewBlockRequiredObservable.notifyObservers({
            type: name,
            targetX: this._targetX,
            targetY: this._targetY,
            needRepositioning: true,
        });

        this.hide();
    }

    onKeyDown(evt: React.KeyboardEvent) {
        if (evt.code === "Enter" && this._nodes.length > 0) {
            this.onNewNodeRequested(this._nodes[0]);
            return;
        }
    }

    render() {
        if (!this.state.isVisible) {
            return null;
        }

        // Sort and deduplicate the node names.
        this._nodes = Array.from(new Set(NodeLedger.RegisteredNodeNames.sort()));

        if (this.state.filter) {
            const filter = this.state.filter.toLowerCase().trim();
            this._nodes = this._nodes.filter((name) => NodeLedger.NameFormatter(name).toLowerCase().includes(filter));
        }

        return (
            <div
                id="graph-search-container">
                <div id="graph-search-picking-blocker" onClick={() => this.hide()}></div>
                <div
                    id="graph-search-box">
                        <div className="graph-search-box-title">Add a node</div>
                        <input type="text" placeholder="Search..." 
                            onChange={(evt) => this.onFilterChange(evt)}
                            onKeyDown={(evt) => this.onKeyDown(evt)}
                            value={this.state.filter}
                            className="graph-search-box-filter" autoFocus={true} tabIndex={0}/>
                        <div className="graph-search-box-list">
                        {
                            this._nodes.map((name) => {
                                return (
                                    <div className="graph-search-box-list-item " 
                                        onClick={() => this.onNewNodeRequested(name)}
                                        key={name}>
                                        {NodeLedger.NameFormatter(name)}</div>
                                )
                            })
                        }
                        </div>
                </div>
            </div>
        );
    }
}
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
export class SearchBoxComponent extends React.Component<ISearchBoxComponentProps, {isVisible: boolean}> {
    private _handleEscKey: (evt: KeyboardEvent) => void;

    constructor(props: ISearchBoxComponentProps) {
        super(props);

        this.state = { isVisible: false };

        this._handleEscKey = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") {
                this.hide();
            }
        };

        this.props.stateManager.onSearchBoxRequiredObservable.add(() => {
            this.setState({ isVisible: true });
            this.props.stateManager.hostDocument!.addEventListener("keydown", this._handleEscKey);
        });
    }

    hide() {
        this.setState({ isVisible: false });
        this.props.stateManager.modalIsDisplayed = false;
        this.props.stateManager.hostDocument!.removeEventListener("keydown", this._handleEscKey);
    }

    render() {
        if (!this.state.isVisible) {
            return null;
        }

        // Sort and deduplicate the node names.
        const nodes = Array.from(new Set(NodeLedger.RegisteredNodeNames.sort()));

        return (
            <div
                id="graph-search-container">
                <div id="graph-search-picking-blocker" onClick={() => this.hide()}></div>
                <div
                    id="graph-search-box">
                        <div className="graph-search-box-title">Add a node</div>
                        <input type="text" placeholder="Search..." className="graph-search-box-filter"/>
                        <div className="graph-search-box-list">
                        {
                            nodes.map((name) => {
                                return (
                                    <div className="graph-search-box-list-item " key={name}>{name}</div>
                                )
                            })
                        }
                        </div>
                </div>
            </div>
        );
    }
}
import type { Nullable } from "core/types";
import type { Camera } from "core/Cameras/camera";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";

import { TreeItemSpecializedComponent } from "./treeItemSpecializedComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Tools } from "../../tools";
import * as React from "react";
import type { GlobalState } from "../globalState";

import { setDebugNode } from "./treeNodeDebugger";

export interface ITreeItemSelectableComponentProps {
    entity: any;
    selectedEntity?: any;
    mustExpand?: boolean;
    offset: number;
    globalState: GlobalState;
    gizmoCamera?: Camera;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    filter: Nullable<string>;
}

export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, { isExpanded: boolean; mustExpand: boolean; isSelected: boolean }> {
    private _wasSelected = false;
    private _thisRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();

    constructor(props: ITreeItemSelectableComponentProps) {
        super(props);

        this.state = {
            isSelected: this.props.entity === this.props.selectedEntity,
            isExpanded: this.props.mustExpand || Tools.LookForItem(this.props.entity, this.props.selectedEntity),
            mustExpand: this.props.mustExpand || false,
        };
    }

    switchExpandedState(mustExpand: boolean): void {
        this.setState({ isExpanded: !this.state.isExpanded, mustExpand: mustExpand });
    }

    override shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: { isExpanded: boolean; isSelected: boolean }) {
        if (!nextState.isExpanded && this.state.isExpanded) {
            return true;
        }

        if (nextProps.selectedEntity) {
            if (nextProps.entity === nextProps.selectedEntity) {
                nextState.isSelected = true;
                return true;
            } else {
                nextState.isSelected = false;
            }

            if (Tools.LookForItem(nextProps.entity, nextProps.selectedEntity)) {
                nextState.isExpanded = true;
                return true;
            }
        }

        return true;
    }

    scrollIntoView() {
        const element = this._thisRef.current;

        if (element) {
            element.scrollIntoView(false);
        }
    }

    override componentDidMount() {
        if (this.state.isSelected) {
            this.scrollIntoView();
        }
    }

    override componentDidUpdate() {
        if (this.state.isSelected && !this._wasSelected) {
            this.scrollIntoView();
        }
        this._wasSelected = false;
    }

    onSelect() {
        if (!this.props.globalState.onSelectionChangedObservable) {
            return;
        }
        this._wasSelected = true;
        const entity = this.props.entity;
        // Put selected node into window.debugNode
        setDebugNode(entity);
        this.props.globalState.onSelectionChangedObservable.notifyObservers(entity);
    }

    renderChildren() {
        const entity = this.props.entity;
        if ((!entity.getChildren && !entity.children) || !this.state.isExpanded) {
            return null;
        }

        const children = Tools.SortAndFilter(entity, entity.getChildren ? entity.getChildren() : entity.children);
        return children.map((item, i) => {
            return (
                <TreeItemSelectableComponent
                    globalState={this.props.globalState}
                    gizmoCamera={this.props.gizmoCamera}
                    mustExpand={this.state.mustExpand}
                    extensibilityGroups={this.props.extensibilityGroups}
                    selectedEntity={this.props.selectedEntity}
                    key={i}
                    offset={this.props.offset + 2}
                    entity={item}
                    filter={this.props.filter}
                />
            );
        });
    }

    override render() {
        const marginStyle = {
            paddingLeft: 10 * (this.props.offset + 0.5) + "px",
        };
        const entity = this.props.entity;

        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;
        const children = entity.getClassName() === "MultiMaterial" ? [] : Tools.SortAndFilter(entity, entity.getChildren ? entity.getChildren() : entity.children);
        const hasChildren = children.length > 0;

        if (!entity.reservedDataStore) {
            entity.reservedDataStore = {};
        }

        entity.reservedDataStore.setExpandedState = (value: boolean) => {
            this.setState({ isExpanded: value });
        };
        entity.reservedDataStore.isExpanded = this.state.isExpanded;

        if (this.props.filter) {
            const lowerCaseFilter = this.props.filter.toLowerCase();
            if (!entity.name || entity.name.toLowerCase().indexOf(lowerCaseFilter) === -1) {
                if (!hasChildren) {
                    return null;
                }

                if (entity.getDescendants) {
                    if (
                        entity.getDescendants(false, (n: any) => {
                            return n.name && n.name.toLowerCase().indexOf(lowerCaseFilter) !== -1;
                        }).length === 0
                    ) {
                        return null;
                    }
                }
            }
        }

        return (
            <div ref={this._thisRef}>
                <div className={this.state.isSelected ? "itemContainer selected" : "itemContainer"} style={marginStyle}>
                    {hasChildren && (
                        <div
                            className="arrow icon"
                            onClick={(event) => {
                                const expandChildren = event.shiftKey;
                                this.switchExpandedState(expandChildren);
                            }}
                        >
                            {chevron}
                        </div>
                    )}
                    <TreeItemSpecializedComponent
                        globalState={this.props.globalState}
                        gizmoCamera={this.props.gizmoCamera}
                        extensibilityGroups={this.props.extensibilityGroups}
                        label={entity.name}
                        entity={entity}
                        onClick={() => this.onSelect()}
                    />
                </div>
                {this.renderChildren()}
            </div>
        );
    }
}

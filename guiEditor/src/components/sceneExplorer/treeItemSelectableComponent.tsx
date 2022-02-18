import { Nullable } from "babylonjs/types";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { Tools } from "../../tools";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { DragOverLocation, GlobalState } from "../../globalState";
import { ControlTreeItemComponent } from "./entities/gui/controlTreeItemComponent";
import { Observer } from "babylonjs/Misc/observable";
import { Container } from "babylonjs-gui/2D/controls/container";

const expandedIcon: string = require("../../../public/imgs/expandedIcon.svg");
const collapsedIcon: string = require("../../../public/imgs/collapsedIcon.svg");
const CONTROL_HEIGHT = 32;

export interface ITreeItemSelectableComponentProps {
    entity: any;
    selectedEntities: any[];
    mustExpand?: boolean;
    offset: number;
    globalState: GlobalState;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    filter: Nullable<string>;
}

export interface ITreeItemSelectableComponentState {
    dragOver: boolean;
    isSelected: boolean;
    isHovered: boolean;
    dragOverLocation: DragOverLocation;
}

export class TreeItemSelectableComponent extends React.Component<
    ITreeItemSelectableComponentProps,
    ITreeItemSelectableComponentState
> {
    private _onSelectionChangedObservable: Nullable<Observer<any>>;
    private _onDraggingEndObservable: Nullable<Observer<any>>;
    private _onDraggingStartObservable: Nullable<Observer<any>>;
    /** makes dragging behavior work correctly
     * see: https://github.com/transformation-dev/matrx/tree/master/packages/dragster
     */
    private _first = false;
    private _second = false;
    constructor(props: ITreeItemSelectableComponentProps) {
        super(props);

        this.state = { dragOver: false, dragOverLocation: DragOverLocation.NONE, isHovered: false, isSelected: this.props.selectedEntities.includes(this.props.entity) };

        this._onSelectionChangedObservable = props.globalState.onSelectionChangedObservable.add((selection) => {
            this.setState({ isSelected: selection === this.props.entity });
        });

        this._onDraggingEndObservable = props.globalState.onDraggingEndObservable.add(() => {
            this.setState({ dragOverLocation: DragOverLocation.NONE });
        });
        this._onDraggingStartObservable = props.globalState.onDraggingStartObservable.add(() => {
            this.forceUpdate();
        });
    }

    switchExpandedState(): void {
        this.props.entity.reservedDataStore.setExpandedState(!this.props.entity.reservedDataStore.isExpanded);
    }

    shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: { isSelected: boolean }) {
        //if the next entity is going to be selected then we want to highlight it so update
        if (nextProps.selectedEntities.includes(nextProps.entity)) {
            nextState.isSelected = true;
            return true;
        } else {
            nextState.isSelected = false;
        }
        if (Tools.LookForItems(nextProps.entity, nextProps.selectedEntities)) {
            return true;
        }

        return true;
    }

    scrollIntoView() {
        const element = ReactDOM.findDOMNode(this) as Element;

        if (element) {
            element.scrollIntoView(false);
        }
    }

    componentWillUnmount() {
        this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObservable);
        this.props.globalState.onParentingChangeObservable.remove(this._onDraggingEndObservable);
        this.props.globalState.onParentingChangeObservable.remove(this._onDraggingStartObservable);
    }

    onSelect() {
        if (!this.props.globalState.onSelectionChangedObservable) {
            return;
        }
        const entity = this.props.entity;
        this.props.globalState.onSelectionChangedObservable.notifyObservers(entity);
        this.props.globalState.selectionLock = true;
    }

    renderChildren(isExpanded: boolean, offset = true) {
        const entity = this.props.entity;
        if ((!entity.getChildren && !entity.children) || !isExpanded) {
            return null;
        }

        let children = Tools.SortAndFilter(entity, entity.getChildren ? entity.getChildren() : entity.children);
        if (entity.typeName === "StackPanel" || entity.typeName === "VirtualKeyboard") {
            children.reverse();
        }
        return children.map((item, i) => {
            if (item.name == "Art-Board-Background") {
                return null;
            }
            return (
                <TreeItemSelectableComponent
                    globalState={this.props.globalState}
                    mustExpand={this.props.mustExpand}
                    extensibilityGroups={this.props.extensibilityGroups}
                    selectedEntities={this.props.selectedEntities}
                    key={i}
                    offset={this.props.offset + (offset ? 2 : 0)}
                    entity={item}
                    filter={this.props.filter}
                />
            );
        });
    }

    render() {
        if (
            this.props.entity === this.props.globalState.workbench.trueRootContainer ||
            this.props.entity === this.props.globalState.workbench.visibleRegionContainer ||
            this.props.entity === this.props.globalState.workbench.panAndZoomContainer
        ) {
            return this.renderChildren(true, false);
        }
        const marginStyle = {
            paddingLeft: 10 * (this.props.offset + 0.5) - 20 + "px",
        };
        const entity = this.props.entity;

        if (!entity.reservedDataStore) {
            entity.reservedDataStore = {
                isExpanded: true,
                setExpandedState: (expanded: boolean) => entity.reservedDataStore.isExpanded = expanded
            };
        }
        let isExpanded = entity.reservedDataStore.isExpanded || Tools.LookForItems(this.props.entity, this.props.selectedEntities);
        entity.reservedDataStore.isExpanded = isExpanded;

        const chevron = isExpanded ? <img src={expandedIcon} className="icon" /> : <img src={collapsedIcon} className="icon" />;
        const children = entity.getClassName() === "MultiMaterial" ? [] : Tools.SortAndFilter(entity, entity.getChildren ? entity.getChildren() : entity.children);
        const hasChildren = children.length > 0;

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

        let className = "itemContainer"; //setting class name plus whatever extras based on states
        className += this.state.isSelected && this.props.globalState.draggedControl === null ? " selected" : "";
        className += this.state.isHovered && this.props.globalState.draggedControl === null ? " hover" : "";
        className += this.state.dragOver && this.state.dragOverLocation == DragOverLocation.CENTER && entity instanceof Container ? " parent" : "";
        className += this.props.globalState.draggedControl === this.props.entity ? " dragged" : "";
        className +=
            this.state.dragOver && this.state.dragOverLocation == DragOverLocation.ABOVE && entity.parent ? " seAbove" : "";
        className +=
            this.state.dragOver && this.state.dragOverLocation == DragOverLocation.BELOW && entity.parent ? " seBelow" : "";

        return (
            <div>
                <div
                    className={className}
                    style={marginStyle}
                    onClick={() => {
                        this.onSelect();
                    }}
                    onPointerEnter={() => this.setState({ isHovered: true })}
                    onPointerLeave={() => this.setState({ isHovered: false })}
                    onDragStart={(event) => {
                        this.props.globalState.draggedControl = this.props.entity;
                        this.props.globalState.onDraggingStartObservable.notifyObservers();
                    }}
                    onDragEnd={(event) => {
                        this.props.globalState.onDraggingEndObservable.notifyObservers();
                    }}
                    draggable={entity.parent ? true: false}        
                    onDrop={event => {
                        this.drop();
                        event.preventDefault();
                    }}
                    onDragEnter={event => {
                        event.preventDefault();
                        this.dragOver(event);
                    }}
                    onDragLeave={() => {
                        if (this._second) {
                            this._second = false;
                        } else if (this._first) {
                            this._first = false;
                        }
                        if (!this._first && !this._second) {
                            this.setState({dragOver: false});
                        }
                    }}
                >
                    {hasChildren && (
                        <div className="arrow icon" onClick={() => this.switchExpandedState()}>
                            {chevron}
                        </div>
                    )}
                    <ControlTreeItemComponent
                        globalState={this.props.globalState}
                        extensibilityGroups={this.props.extensibilityGroups}
                        control={entity}
                        onClick={() => {}}
                        isHovered={this.state.isHovered}
                        isDragOver={this.state.dragOver}
                        dragOverLocation={this.state.dragOverLocation}
                    />
                </div>
                {this.renderChildren(isExpanded)}
            </div>
        );
    }

    dragOver(event: React.DragEvent<HTMLDivElement>): void {
        //check the positiions of the mouse cursor.
        var target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = event.clientY - rect.top;

        if (this.props.entity instanceof Container) {
            if (y < CONTROL_HEIGHT / 5) {
                //split in fifths
                this.setState({ dragOverLocation: DragOverLocation.ABOVE });
            } else if (y > (4 * CONTROL_HEIGHT) / 5) {
                this.setState({ dragOverLocation: DragOverLocation.BELOW });
            } else {
                this.setState({ dragOverLocation: DragOverLocation.CENTER });
            }
        } else {
            if (y < CONTROL_HEIGHT / 2) {
                //split in half
                this.setState({ dragOverLocation: DragOverLocation.ABOVE });
            } else {
                this.setState({ dragOverLocation: DragOverLocation.BELOW });
            }
        }
        if (this._first) {
            this._second = true;
        } else {
            this._first = true;
            this.setState({ dragOver: true });
        }
    }

    drop(): void {
        this.props.globalState.onDropObservable.notifyObservers();
        const control = this.props.entity;
        if (this.props.globalState.draggedControl != control) {
            this.props.globalState.draggedControlDirection = this.state.dragOverLocation;
            this.props.globalState.onParentingChangeObservable.notifyObservers(this.props.entity);
        }
        this.props.globalState.draggedControl = null;
        this.setState({ dragOverLocation: DragOverLocation.NONE, dragOver: false });
        this._first = false;
        this._second = false;
    }
}

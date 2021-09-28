import { Nullable } from "babylonjs/types";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { Tools } from "../../tools";
import * as ReactDOM from "react-dom";
import * as React from "react";
import { DragOverLocation, GlobalState } from "../../globalState";
import { ControlTreeItemComponent } from "./entities/gui/controlTreeItemComponent";
import { Observer } from "babylonjs/Misc/observable";

const expandedIcon: string = require("../../../public/imgs/expandedIcon.svg");
const collapsedIcon: string = require("../../../public/imgs/collapsedIcon.svg");
const CONTROL_HEIGHT = 32;

export interface ITreeItemSelectableComponentProps {
    entity: any,
    selectedEntity?: any,
    mustExpand?: boolean,
    offset: number,
    globalState: GlobalState,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    filter: Nullable<string>
}

export class TreeItemSelectableComponent extends React.Component<ITreeItemSelectableComponentProps, { isExpanded: boolean, isSelected: boolean, isHovered: boolean, dragOverLocation: DragOverLocation }> {
    dragOverHover: boolean;
    private _onSelectionChangedObservable: Nullable<Observer<any>>;
    private _onDraggingEndObservable: Nullable<Observer<any>>;
    private _onDraggingStartObservable: Nullable<Observer<any>>;
    constructor(props: ITreeItemSelectableComponentProps) {
        super(props);

        this.state = { dragOverLocation: DragOverLocation.NONE, isHovered: false, isSelected: this.props.entity === this.props.selectedEntity, isExpanded: this.props.mustExpand || Tools.LookForItem(this.props.entity, this.props.selectedEntity) };

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
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    shouldComponentUpdate(nextProps: ITreeItemSelectableComponentProps, nextState: { isExpanded: boolean, isSelected: boolean }) {
        if (!nextState.isExpanded && this.state.isExpanded) {
            return true;
        }

        //if the next entity is going to be selected then we want to highlight it so update
        if (nextProps.entity === nextProps.selectedEntity) {
            nextState.isSelected = true;
            return true;
        } else {
            nextState.isSelected = false;
        }
        if (nextProps.selectedEntity) {
            if (Tools.LookForItem(nextProps.entity, nextProps.selectedEntity)) {
                nextState.isExpanded = true;
                return true;
            }
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

    renderChildren() {
        const entity = this.props.entity;
        if (!entity.getChildren && !entity.children || !this.state.isExpanded) {
            return null;
        }

        let children = Tools.SortAndFilter(entity, entity.getChildren ? entity.getChildren() : entity.children);
        if(entity.typeName === "StackPanel") {
            children.reverse();
        }
        return (
            children.map((item, i) => {
                if (item.name == "Art-Board-Background") {
                    return (null);
                }
                return (
                    <TreeItemSelectableComponent globalState={this.props.globalState} mustExpand={this.props.mustExpand} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.props.selectedEntity}
                        key={i} offset={this.props.offset + 2} entity={item} filter={this.props.filter} />
                );
            })
        )
    }

    render() {
        const marginStyle = {
            paddingLeft: (10 * (this.props.offset + 0.5)) - 20 + "px"
        };
        const entity = this.props.entity;

        const chevron = this.state.isExpanded ? <img src={expandedIcon} className="icon" /> : <img src={collapsedIcon} className="icon" />
        const children = entity.getClassName() === "MultiMaterial" ? [] : Tools.SortAndFilter(entity, entity.getChildren ? entity.getChildren() : entity.children);
        const hasChildren = children.length > 0;

        if (!entity.reservedDataStore) {
            entity.reservedDataStore = {};
        }

        entity.reservedDataStore.setExpandedState = (value: boolean) => {
            this.setState({ isExpanded: value });
        }
        entity.reservedDataStore.isExpanded = this.state.isExpanded;

        if (this.props.filter) {
            const lowerCaseFilter = this.props.filter.toLowerCase();
            if (!entity.name || entity.name.toLowerCase().indexOf(lowerCaseFilter) === -1) {
                if (!hasChildren) {
                    return null;
                }

                if (entity.getDescendants) {
                    if (entity.getDescendants(false, (n: any) => {
                        return n.name && n.name.toLowerCase().indexOf(lowerCaseFilter) !== -1
                    }).length === 0) {
                        return null;
                    }
                }
            }
        }

        let className = "itemContainer"; //setting class name plus whatever extras based on states
        className += this.state.isSelected && this.props.globalState.draggedControl === null ? " selected" : "";
        className += this.state.isHovered && this.props.globalState.draggedControl === null ? " hover" : "";
        className += this.dragOverHover && this.state.dragOverLocation == DragOverLocation.CENTER && this.props.globalState.workbench.isContainer(entity) ? " parent" : ""
        className += this.props.globalState.draggedControl === this.props.entity ? " dragged" : "";
        className += (this.dragOverHover && this.state.dragOverLocation == DragOverLocation.ABOVE && this.props.globalState.draggedControl != null && entity.parent) ? " seAbove" : "";
        className += (this.dragOverHover && this.state.dragOverLocation == DragOverLocation.BELOW && this.props.globalState.draggedControl != null && entity.parent) ? " seBelow" : "";

        return (
            <div>
                <div className={className} style={marginStyle} draggable={entity.parent ? true : false}
                    onMouseOver={() => this.setState({ isHovered: true })} onMouseLeave={() => this.setState({ isHovered: false })}
                    onClick={() => { this.onSelect() }}
                    onDragStart={event => {
                        this.props.globalState.draggedControl = entity;
                        this.props.globalState.onDraggingStartObservable.notifyObservers();
                    }}
                    onDrop={event => {
                        this.drop();
                    }}
                    onDragEnd={event => {
                        this.props.globalState.onDraggingEndObservable.notifyObservers();
                    }}
                    onDragOver={event => {
                        this.dragOver(event);
                    }}
                    onDragLeave={event => {
                        this.dragOverHover = false;
                        this.forceUpdate();
                    }}>
                    {
                        hasChildren &&
                        <div className="arrow icon" onClick={() => this.switchExpandedState()}>
                            {chevron}
                        </div>
                    }
                    <ControlTreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} control={entity}
                        onClick={() => { }}
                        isHovered={this.state.isHovered}
                        dragOverHover={this.dragOverHover}
                        dragOverLocation={this.state.dragOverLocation}
                    />
                </div>
                {
                    this.renderChildren()
                }
            </div >
        );
    }

    dragOver(event: React.DragEvent<HTMLDivElement>): void {
        //check the positiions of the mouse cursor.
        var target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = event.clientY - rect.top;

        if (this.props.globalState.workbench.isContainer(this.props.entity)) {
            if (y < CONTROL_HEIGHT / 3) { //split in thirds
                this.setState({ dragOverLocation: DragOverLocation.ABOVE });
            }
            else if (y > (2 * CONTROL_HEIGHT / 3)) {
                this.setState({ dragOverLocation: DragOverLocation.BELOW });
            }
            else {
                this.setState({ dragOverLocation: DragOverLocation.CENTER });
            }
        }
        else {
            if (y < CONTROL_HEIGHT / 2) { //split in half
                this.setState({ dragOverLocation: DragOverLocation.ABOVE });
            }
            else {
                this.setState({ dragOverLocation: DragOverLocation.BELOW });
            }
        }

        event.preventDefault();
        this.dragOverHover = true;
        this.forceUpdate();
    }

    drop(): void {
        const control = this.props.entity;
        if (this.props.globalState.draggedControl != control) {
            this.dragOverHover = false;
            this.props.globalState.draggedControlDirection = this.state.dragOverLocation;
            this.props.globalState.onParentingChangeObservable.notifyObservers(this.props.entity);
        }
        this.props.globalState.draggedControl = null;
        this.setState({ dragOverLocation: DragOverLocation.NONE });
    }
}

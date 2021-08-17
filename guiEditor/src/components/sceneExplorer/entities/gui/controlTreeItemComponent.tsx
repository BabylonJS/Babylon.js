import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from 'react';
import { DragOverLocation, GlobalState } from "../../../../globalState";
import { Nullable, Observer } from "babylonjs/Legacy/legacy";
import { Grid } from "babylonjs-gui/2D/controls/grid";

const visibilityNotActiveIcon: string = require("../../../../../public/imgs/visibilityNotActiveIcon.svg");
const visibilityActiveIcon: string = require("../../../../../public/imgs/visibilityActiveIcon.svg");
const makeComponentIcon: string = require("../../../../../public/imgs/makeComponentIcon.svg");
const makeChildOfContainerIcon: string = require("../../../../../public/imgs/makeChildOfContainerIcon.svg");
const CONTROL_HEIGHT = 30;

interface IControlTreeItemComponentProps {
    control: Control;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
}

export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, { isActive: boolean, isVisible: boolean, isHovered: boolean, isSelected: boolean }> {
    dragOverHover: boolean;
    dragOverLocation: DragOverLocation;
    private _onSelectionChangedObservable: Nullable<Observer<any>>;
    private _onDraggingEndObservable: Nullable<Observer<any>>;

    constructor(props: IControlTreeItemComponentProps) {
        super(props);

        const control = this.props.control;
        this.dragOverHover = false;
        this._onSelectionChangedObservable = props.globalState.onSelectionChangedObservable.add((selection) => {
            this.setState({ isSelected: selection === this.props.control });
        });

        this._onDraggingEndObservable = props.globalState.onDraggingEndObservable.add(() => {
            this.dragOverLocation = DragOverLocation.NONE;
        });
        this.state = { isActive: control.isHighlighted, isVisible: control.isVisible, isHovered: false, isSelected: false };
    }

    componentWillUnmount() {
        this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObservable);
        this.props.globalState.onParentingChangeObservable.remove(this._onDraggingEndObservable);
    }

    highlight() {
        const control = this.props.control;
        control.isHighlighted = !control.isHighlighted;

        this.setState({ isActive: control.isHighlighted });
    }

    switchVisibility(): void {
        const newState = !this.state.isVisible;
        this.setState({ isVisible: newState });
        this.props.control.isVisible = newState;

    }

    dragOver(event: React.DragEvent<HTMLDivElement>): void {
        //check the positiions of the mouse cursor.
        var target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        const y = event.clientY - rect.top;
        if (y < CONTROL_HEIGHT / 3) { // one third
            this.dragOverLocation = DragOverLocation.ABOVE;
        }
        else if (y > (2 * (CONTROL_HEIGHT / 3))) { //two thirds
            this.dragOverLocation = DragOverLocation.BELOW;
        }
        else {
            this.dragOverLocation = DragOverLocation.CENTER;
        }
        event.preventDefault();
        this.dragOverHover = true;
        this.forceUpdate();
    }

    drop(): void {
        const control = this.props.control;
        if (this.props.globalState.draggedControl != control) {
            this.dragOverHover = false;
            this.props.globalState.draggedControlDirection = this.dragOverLocation;
            this.props.globalState.onParentingChangeObservable.notifyObservers(this.props.control);
        }
        this.props.globalState.draggedControl = null;
        this.dragOverLocation = DragOverLocation.NONE;
    }

    render() {
        const control = this.props.control;

        let name = `${control.name || "No name"} [${control.getClassName()}]`;
        if(control.parent?.typeName === "Grid"){
            name += ` [${(control.parent as Grid).getChildCellInfo(this.props.control)}]`;
        }
        return (
            <div className="controlTools" onMouseOver={() => this.setState({ isHovered: true })} onMouseLeave={() => this.setState({ isHovered: false })}
                draggable={control.parent? true : false}
                onDragStart={event => {
                    this.props.globalState.draggedControl = control;
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
                {(this.dragOverLocation == DragOverLocation.ABOVE && control.parent) &&
                    <hr className="ge" />
                }
                <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} color="greenyellow" />
                {(this.dragOverLocation == DragOverLocation.CENTER && this.props.globalState.workbench.isContainer(control)) && <>
                    <div className="makeChild icon" onClick={() => this.highlight()} title="Make Child">
                        <img src={makeChildOfContainerIcon} />
                    </div>
                </>}
                {(this.state.isHovered && this.dragOverLocation == DragOverLocation.NONE) && <>
                    <div className="addComponent icon" onClick={() => this.highlight()} title="Add component (Not Implemented)">
                        <img src={makeComponentIcon} />
                    </div>
                    <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide control">
                        <img src={this.state.isVisible ? visibilityActiveIcon : visibilityNotActiveIcon} />
                    </div>
                </>}
                <ExtensionsComponent target={control} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        );
    }

}

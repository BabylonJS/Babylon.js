import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from 'react';
import { DragOverLocation, GlobalState } from "../../../../globalState";
import { Nullable, Observer } from "babylonjs/Legacy/legacy";

const visibilityNotActiveIcon: string = require("../../../../../public/imgs/visibilityNotActiveIcon.svg");
const visibilityActiveIcon: string = require("../../../../../public/imgs/visibilityActiveIcon.svg");
const makeComponentIcon: string = require("../../../../../public/imgs/makeComponentIcon.svg");
const makeChildOfContainerIcon: string = require("../../../../../public/imgs/makeChildOfContainerIcon.svg");

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
            this.forceUpdate();
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

    render() {
        const control = this.props.control;

        const name = `${control.name || "No name"} [${control.getClassName()}]`;

        return (
            <div className="controlTools" onMouseOver={() => this.setState({ isHovered: true })} onMouseLeave={() => this.setState({ isHovered: false })}
                draggable={true}
                onDragStart={event => {
                    this.props.globalState.draggedControl = control;
                }} 
                onDrop={event => {
                    if (this.props.globalState.draggedControl != control) {
                        this.dragOverHover = false;
                        this.props.globalState.draggedControlDirection = this.dragOverLocation;
                        this.props.globalState.onParentingChangeObservable.notifyObservers(this.props.control);
                        this.forceUpdate();
                    }
                    this.props.globalState.draggedControl = null;
                    this.dragOverLocation = DragOverLocation.NONE;
                }}
                onDragEnd={event => {
                    this.props.globalState.onDraggingEndObservable.notifyObservers();
                }}
                onDragOver={event => {
                    //check the positiions of the mouse cursor.
                    var target = event.target as HTMLElement;
                    const rect = target.getBoundingClientRect();
                    const y = event.clientY - rect.top;
                    if (y < 10) {
                        this.dragOverLocation = DragOverLocation.ABOVE;
                    }
                    else if (y > 20) {
                        this.dragOverLocation = DragOverLocation.BELOW;
                    }
                    else {
                        this.dragOverLocation = DragOverLocation.CENTER;
                    }
                    event.preventDefault();
                    this.dragOverHover = true;
                    this.forceUpdate();
                }}
                onDragLeave={event => {
                    this.dragOverHover = false;
                    this.forceUpdate();
                }}>  
                {(this.dragOverLocation == DragOverLocation.ABOVE) &&
                <hr></hr>
                }
                <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} color="greenyellow" />
                {(this.dragOverLocation == DragOverLocation.CENTER && this.props.globalState.workbench.isContainer(control)) && <>
                    <div className="makeChild icon" onClick={() => this.highlight()} title="Add component (Not Implemented)">
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

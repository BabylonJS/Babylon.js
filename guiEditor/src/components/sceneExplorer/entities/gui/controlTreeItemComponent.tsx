import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from 'react';
import { DragOverLocation, GlobalState } from "../../../../globalState";
import { Grid } from "babylonjs-gui/2D/controls/grid";

const visibilityNotActiveIcon: string = require("../../../../../public/imgs/visibilityNotActiveIcon.svg");
const visibilityActiveIcon: string = require("../../../../../public/imgs/visibilityActiveIcon.svg");
const makeComponentIcon: string = require("../../../../../public/imgs/makeComponentIcon.svg");
const makeChildOfContainerIcon: string = require("../../../../../public/imgs/makeChildOfContainerIcon.svg");

interface IControlTreeItemComponentProps {
    control: Control;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
    isHovered: boolean;
    dragOverLocation: DragOverLocation
}

export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, { isActive: boolean, isVisible: boolean }> {
    constructor(props: IControlTreeItemComponentProps) {
        super(props);

        const control = this.props.control;

        this.state = { isActive: control.isHighlighted, isVisible: control.isVisible };
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

        let name = `${control.name || "No name"} [${control.getClassName()}]`;
        if (control.parent?.typeName === "Grid") {
            name += ` [${(control.parent as Grid).getChildCellInfo(this.props.control)}]`;
        }
        return (
            <div className="controlTools" >
                <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} color="greenyellow" />
                {(this.props.dragOverLocation == DragOverLocation.CENTER && this.props.globalState.workbench.isContainer(control)) && <>
                    <div className="makeChild icon" onClick={() => this.highlight()} title="Make Child">
                        <img src={makeChildOfContainerIcon} />
                    </div>
                </>}
                {(this.props.isHovered && this.props.dragOverLocation == DragOverLocation.NONE) && <>
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

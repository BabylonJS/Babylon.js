import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from 'react';
import { GlobalState } from "../../../../globalState";

const visibilityNotActiveIcon: string = require("../../../../../public/imgs/visibilityNotActiveIcon.svg");
const visibilityActiveIcon: string = require("../../../../../public/imgs/visibilityActiveIcon.svg");
const makeComponentIcon: string = require("../../../../../public/imgs/makeComponentIcon.svg");

interface IControlTreeItemComponentProps {
    control: Control;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
    globalState: GlobalState;
}

export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, { isActive: boolean, isVisible: boolean, isHovered: boolean, isSelected: boolean }> {
    constructor(props: IControlTreeItemComponentProps) {
        super(props);

        const control = this.props.control;

        props.globalState.onSelectionChangedObservable.add((selection) => {
                this.setState({ isSelected: selection === this.props.control });
        });
        this.state = { isActive: control.isHighlighted, isVisible: control.isVisible, isHovered: false, isSelected: false };
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
        const name = (control.name || "No name") + ` [${control.getClassName()}]`;

        return (
            <div className="controlTools" onMouseOver={() => this.setState({ isHovered: true })} onMouseLeave={() => this.setState({ isHovered: false })}>

                <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} color="greenyellow" />
                {(this.state.isHovered || this.state.isSelected) && <>
                    <div className="addComponent icon" onClick={() => this.highlight()} title="Add component (Not Implemented)">
                        <img src={makeComponentIcon} />
                    </div>
                    <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide control">
                        <img src={this.state.isVisible ? visibilityActiveIcon : visibilityNotActiveIcon }/>
                    </div>
                </>}
                <ExtensionsComponent target={control} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        );
    }

}
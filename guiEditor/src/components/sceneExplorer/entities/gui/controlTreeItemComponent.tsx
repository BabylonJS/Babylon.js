import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from 'react';

interface IControlTreeItemComponentProps {
    control: Control;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class ControlTreeItemComponent extends React.Component<IControlTreeItemComponentProps, { isActive: boolean, isVisible: boolean, isHovered: boolean}> {
    constructor(props: IControlTreeItemComponentProps) {
        super(props);

        const control = this.props.control;
        this.state = { isActive: control.isHighlighted, isVisible: control.isVisible, isHovered: false };
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
        //const isActiveElement = this.state.isActive ? <FontAwesomeIcon icon={faHighlighter} /> : <FontAwesomeIcon icon={faHighlighter} className="isNotActive" />;
        //const visibilityElement = this.state.isVisible ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} className="isNotActive" />;

        if (true) {
            return (
                <div className="controlTools" onMouseOut={ () =>  this.setState({ isHovered: false})}>
                    <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} color="greenyellow" />
                    <div className="addComponent icon" onClick={() => this.highlight()} title="Add component (Not Implemented)">
                        <img src={"./imgs/makeComponentIcon.svg"} color="black" className=""/>
                    </div>
                    <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide control">
                        <img src={"./imgs/visibilityIcon.svg"} color="black" className=""/>
                    </div>
                    <ExtensionsComponent target={control} extensibilityGroups={this.props.extensibilityGroups} />
                </div>
            );
        }
        else {
            return (
                <div className="controlTools" onMouseEnter={ () =>  this.setState({ isHovered: true})}>
                    <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} color="greenyellow" />
                    <ExtensionsComponent target={control} extensibilityGroups={this.props.extensibilityGroups} />
                </div>
            );
        }
    }
}
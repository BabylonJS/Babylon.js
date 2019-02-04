import { faObjectGroup, faHighlighter, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Control } from "babylonjs-gui/2D/controls/control";
import { TreeItemLabelComponent } from "../../treeItemLabelComponent";
import { ExtensionsComponent } from "../../extensionsComponent";
import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IControlTreeItemComponentProps {
    control: Control;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
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
        const name = (control.name || "No name") + ` [${control.getClassName()}]`;
        const isActiveElement = this.state.isActive ? <FontAwesomeIcon icon={faHighlighter} /> : <FontAwesomeIcon icon={faHighlighter} className="isNotActive" />;
        const visibilityElement = this.state.isVisible ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} className="isNotActive" />;

        return (
            <div className="controlTools">
                <TreeItemLabelComponent label={name} onClick={() => this.props.onClick()} icon={faObjectGroup} color="greenyellow" />
                <div className="highlight icon" onClick={() => this.highlight()} title="Highlight this control">
                    {isActiveElement}
                </div>
                <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide control">
                    {visibilityElement}
                </div>
                <ExtensionsComponent target={control} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        );
    }
}
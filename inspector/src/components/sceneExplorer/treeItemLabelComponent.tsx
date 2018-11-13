import * as React from "react";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ITreeItemLabelComponentProps {
    label: string,
    onClick?: () => void,
    icon: IconDefinition,
    color: string
}

export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps> {
    constructor(props: ITreeItemLabelComponentProps) {
        super(props);
    }

    onClick() {
        if (!this.props.onClick) {
            return;
        }

        this.props.onClick()
    }

    render() {
        return (
            <div className="title" onClick={() => this.onClick()}>
                <div className="titleIcon">
                    <FontAwesomeIcon icon={this.props.icon} color={this.props.color} />
                </div>
                <div className="titleText">
                    {this.props.label || "no name"}
                </div>
            </div>
        )
    }
}
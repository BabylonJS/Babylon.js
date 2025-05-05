import * as React from "react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ITreeItemLabelComponentProps {
    label: string;
    onClick?: () => void;
    icon?: IconDefinition;
    iconBase64?: string;
    color: string;
}

export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps> {
    constructor(props: ITreeItemLabelComponentProps) {
        super(props);
    }

    onClick() {
        if (!this.props.onClick) {
            return;
        }

        this.props.onClick();
    }

    override render() {
        return (
            <div className="title" title={this.props.label} onClick={() => this.onClick()}>
                <div className="titleIcon">
                    {this.props.iconBase64 && <img src={this.props.iconBase64} />}
                    {this.props.icon && <FontAwesomeIcon icon={this.props.icon} color={this.props.color} />}
                </div>
                <div className="titleText">{this.props.label || "no name"}</div>
            </div>
        );
    }
}

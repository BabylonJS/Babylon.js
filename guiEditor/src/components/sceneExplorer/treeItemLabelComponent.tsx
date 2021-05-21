import * as React from "react";

interface ITreeItemLabelComponentProps {
    label: string,
    onClick?: () => void,
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
                <div className="titleText">
                    {this.props.label || "no name"}
                </div>
            </div>
        )
    }
}
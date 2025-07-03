import * as React from "react";

export interface IButtonLineComponentProps {
    format: string;
    data: string;
    tooltip: string;
}

export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    override render() {
        return (
            <div
                className="draggableLine"
                title={this.props.tooltip}
                draggable={true}
                onDragStart={(event) => {
                    event.dataTransfer.setData(this.props.format, this.props.data);
                }}
            >
                {this.props.data.replace("Block", "")}
            </div>
        );
    }
}

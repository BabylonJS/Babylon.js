import * as React from "react";

export interface IButtonLineComponentProps {
    data: string;
    tooltip: string;
    /** Optional accent color shown as a left border strip. */
    color?: string;
}

export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    override render() {
        const borderStyle = this.props.color ? { borderLeft: `4px solid ${this.props.color}` } : undefined;
        return (
            <div
                className="draggableLine"
                title={this.props.tooltip}
                style={borderStyle}
                draggable={true}
                onDragStart={(event) => {
                    event.dataTransfer.setData("babylonjs-flow-graph-node", this.props.data);
                }}
            >
                {this.props.data.startsWith("FlowGraph") ? this.props.data.slice(9).replace("Block", "") : this.props.data.replace("Block", "")}
            </div>
        );
    }
}

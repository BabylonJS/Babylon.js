import * as React from "react";

export interface IButtonLineComponentProps {
    data: string;
}

export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="draggableLine"
                draggable={true}
                onDragStart={event => {
                    event.dataTransfer.setData("babylonjs-material-node", this.props.data);
                }}>
                {this.props.data}
            </div>
        );
    }
}

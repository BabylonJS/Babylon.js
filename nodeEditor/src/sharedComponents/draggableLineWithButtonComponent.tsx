import * as React from "react";

export interface IDraggableLineWithButtonComponent {
    data: string;
    tooltip: string;
    iconImage: any;
    onIconClick: (value: string) => void;
    iconTitle: string;
}

export class DraggableLineWithButtonComponent extends React.Component<IDraggableLineWithButtonComponent> {
    constructor(props: IDraggableLineWithButtonComponent) {
        super(props);
    }

    render() { 
        return (
            <div className="draggableLine withButton" 
                title={this.props.tooltip}
                draggable={true}
                onDragStart={event => {
                    event.dataTransfer.setData("babylonjs-material-node", this.props.data);
                }}>
                {this.props.data.substr(0, this.props.data.length - 6)}
                <div className="icon" onClick={() => { this.props.onIconClick(this.props.data); }} title={this.props.iconTitle}>
                    <img title={this.props.iconTitle} src={this.props.iconImage}/>
                </div>
            </div>
        );
    }
}

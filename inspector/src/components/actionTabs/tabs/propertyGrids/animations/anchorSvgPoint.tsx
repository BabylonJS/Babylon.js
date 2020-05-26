
import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';

interface IAnchorSvgPointProps {
   control: Vector2;
   anchor: Vector2;
   active: boolean;
   type: string;
   index: string;
   selected: boolean;
   selectControlPoint: (id: string) => void;
}


export class AnchorSvgPoint extends React.Component<IAnchorSvgPointProps>{ 
    constructor(props: IAnchorSvgPointProps) {
        super(props);
    }

    select(){
        this.props.selectControlPoint(this.props.type);
    }
    
    render() {
        return (
        <>
            <svg x={this.props.control.x} y={this.props.control.y} style={{overflow:'visible'}} onClick={() => this.select()}>
                <circle type={this.props.type} data-id={this.props.index} className={`draggable control-point ${this.props.active ? 'active' : ''}`} cx="0" cy="0"  r="2" stroke="white" strokeWidth={this.props.selected ? 1 : 0}  fill={this.props.active ? "blue" : "black"}   />
            </svg>
            <line className={`control-point ${this.props.active ? 'active' : ''}`} x1={this.props.anchor.x} y1={this.props.anchor.y} x2={this.props.control.x} y2={this.props.control.y} strokeWidth="1" />
        </>
        )
    }
} 


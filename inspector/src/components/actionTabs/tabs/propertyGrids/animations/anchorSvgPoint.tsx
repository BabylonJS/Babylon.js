
import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';

interface IAnchorSvgPointProps {
   point: Vector2;
   anchor: Vector2;
}


export class AnchorSvgPoint extends React.Component<IAnchorSvgPointProps>{ 
    constructor(props: IAnchorSvgPointProps) {
        super(props);
    }
    render() {
        return (
        <>
            <svg x={this.props.anchor.x} y={this.props.anchor.y} style={{overflow:'visible'}}>
                <circle cx="0" cy="0"  r="0.75" stroke="none" strokeWidth="0" fill="blue" />
            </svg>
            <line x1={this.props.point.x} y1={this.props.point.y} x2={this.props.anchor.x} y2={this.props.anchor.y} stroke="green" strokeWidth="0.75" />
        </>
        )
    }
} 
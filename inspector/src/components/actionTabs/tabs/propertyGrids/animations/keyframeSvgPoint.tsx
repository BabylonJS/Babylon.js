import * as React from "react";
import { Vector2 } from 'babylonjs';

interface IKeyframeSvgPointProps {
    point: Vector2;
}

export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps>{ 
    constructor(props: IKeyframeSvgPointProps) {
        super(props);
    }
    render() {
        return (
        <>
            <svg x={this.props.point.x} y={this.props.point.y} style={{overflow:'visible'}}>
                <circle cx="0" cy="0"  r="0.75" stroke="none" strokeWidth="0" fill="red" />
            </svg>
        </>
        )
    }
} 
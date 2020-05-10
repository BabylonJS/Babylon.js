import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { AnchorSvgPoint } from './anchorSvgPoint';

export interface IKeyframeSvgPoint {
    keyframePoint: Vector2;
    rightControlPoint: Vector2 | null;
    leftControlPoint: Vector2 | null;
    id: string;
}

interface IKeyframeSvgPointProps {
    keyframePoint: Vector2;
    leftControlPoint: Vector2 | null;
    rightControlPoint: Vector2 | null;
    id: string;
}

export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps>{ 
 
    constructor(props: IKeyframeSvgPointProps) {
        super(props);
    }

    render() {
        return (
            <>
                <svg className="draggable" x={this.props.keyframePoint.x} y={this.props.keyframePoint.y} style={{overflow:'visible'}}>
                    <circle data-id={this.props.id} className="draggable" cx="0" cy="0"  r="2" stroke="none" strokeWidth="0" fill="red" />
                </svg>
               { this.props.leftControlPoint && <AnchorSvgPoint type="left" index={this.props.id} control={this.props.leftControlPoint} anchor={this.props.keyframePoint} active={false}/>} 
               { this.props.rightControlPoint &&  <AnchorSvgPoint type="right" index={this.props.id} control={this.props.rightControlPoint} anchor={this.props.keyframePoint} active={false}/>}
            </>
        )
    }
} 
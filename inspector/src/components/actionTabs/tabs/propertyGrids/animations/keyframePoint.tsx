import * as React from "react";

interface Point {
    x: number;
    y: number;
}


interface IKeyframeProps {
    point: Point;
}

export class KeyframePoint extends React.Component<IKeyframeProps>{ 
    constructor(props: IKeyframeProps) {
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
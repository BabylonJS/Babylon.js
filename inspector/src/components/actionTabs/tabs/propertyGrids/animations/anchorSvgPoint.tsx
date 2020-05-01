
import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';

interface IAnchorSvgPointProps {
   point: Vector2;
   anchor: Vector2;
}


export class AnchorSvgPoint extends React.Component<IAnchorSvgPointProps, { position: Vector2, active: boolean, offset: Vector2 } >{ 
    constructor(props: IAnchorSvgPointProps) {
        super(props);

        this.state = { offset: new Vector2(this.props.anchor.x,this.props.anchor.y), position: new Vector2(this.props.anchor.x,this.props.anchor.y), active: false }
    }

    handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
        const el = e.target as SVGSVGElement;
        const bbox = el.getBoundingClientRect();
        const x = e.clientX - bbox.left;
        const y = e.clientY - bbox.top;
        el.setPointerCapture(e.pointerId);
        this.setState({ active: true, position: new Vector2(x,y), offset: new Vector2(x, y) });
      };

    handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
        const el = e.target as SVGSVGElement;
        const bbox = el.getBoundingClientRect();
        const x = e.clientX - bbox.left;
        const y = e.clientY - bbox.top;
        if (this.state.active) {

            
            this.setState({ 
                active: true, 
                position: new Vector2(this.state.position.x - (this.state.offset.x - x), this.state.position.y - (this.state.offset.y - y))
            })

        }
      };

    handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
        this.setState({ active: false})
      };

    render() {
        return (
        <>
            <svg x={this.props.anchor.x} y={this.props.anchor.y} style={{overflow:'visible'}}       
            onPointerDown={(e) => this.handlePointerDown(e)}
            onPointerUp={(e) => this.handlePointerUp(e)}
            onPointerMove={(e) => this.handlePointerMove(e)}>
                <circle cx="0" cy="0"  r="0.75" stroke="none" strokeWidth="0" fill={this.state.active ? "blue" : "black"}   />
            </svg>
            <line x1={this.props.point.x} y1={this.props.point.y} x2={this.props.anchor.x} y2={this.props.anchor.y} stroke="green" strokeWidth="0.75" />
        </>
        )
    }
} 


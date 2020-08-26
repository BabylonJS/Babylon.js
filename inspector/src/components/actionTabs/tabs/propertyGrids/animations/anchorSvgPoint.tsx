import * as React from "react";
import { Vector2 } from "babylonjs/Maths/math.vector";

interface IAnchorSvgPointProps {
    control: Vector2;
    anchor: Vector2;
    active: boolean;
    type: string;
    index: string;
    selected: boolean;
    selectControlPoint: (id: string) => void;
}

export class AnchorSvgPoint extends React.Component<IAnchorSvgPointProps, { visiblePoint: Vector2 }> {
    constructor(props: IAnchorSvgPointProps) {
        super(props);
        this.state = { visiblePoint: this.setVisiblePoint() };
    }

    componentDidUpdate(prevProps: IAnchorSvgPointProps, prevState: any) {
        if (prevProps.control !== this.props.control) {
            this.setState({ visiblePoint: this.setVisiblePoint() });
        }
    }

    select = () => {
        this.props.selectControlPoint(this.props.type);
    };

    setVisiblePoint() {
        const quarterDistance = 0.5;
        const distanceOnFlat = Math.abs(this.props.anchor.x - this.props.control.x);
        const currentDistance = Vector2.Distance(this.props.anchor, this.props.control);
        const percentageChange = ((currentDistance - distanceOnFlat) * 100) / currentDistance;
        const updateAmount = quarterDistance - (quarterDistance * percentageChange) / 100;
        return Vector2.Lerp(this.props.anchor, this.props.control, updateAmount);
    }

    render() {
        const visibleCircleClass = `draggable control-point ${this.props.active ? "active" : ""}`;
        const nonVisibleCircleClass = `control-point ${this.props.active ? "active" : ""}`;
        const strokeVisibleCircle = this.props.selected ? 1 : 0;
        const visibleCircle = this.props.selected ? "#ffc017" : "black";
        return (
            <>
                <line
                    className={`control-point ${this.props.active ? "active" : ""}`}
                    x1={this.props.anchor.x}
                    y1={this.props.anchor.y}
                    x2={this.state.visiblePoint.x}
                    y2={this.state.visiblePoint.y}
                    strokeWidth="0.8%"
                />
                <svg
                    x={this.state.visiblePoint.x}
                    y={this.state.visiblePoint.y}
                    style={{ overflow: "visible" }}
                    onClick={this.select}>
                    <circle
                        type={this.props.type}
                        data-id={this.props.index}
                        className={visibleCircleClass}
                        cx="0"
                        cy="0"
                        r="0.75%"
                        stroke="aqua"
                        strokeWidth={strokeVisibleCircle}
                        fill={visibleCircle}
                    />
                </svg>
                <svg x={this.props.control.x} y={this.props.control.y} style={{ overflow: "visible", display: "none" }}>
                    <circle
                        type={this.props.type}
                        data-id={this.props.index}
                        className={nonVisibleCircleClass}
                        cx="0"
                        cy="0"
                        r="0.7%"
                        stroke="white"
                        strokeWidth={0}
                        fill={"white"}
                    />
                </svg>
            </>
        );
    }
}

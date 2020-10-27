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
    framesInCanvasView: { from: number; to: number };
}

/**
 * Renders the control point to a keyframe.
 * Each keyframe has left and right control points to control de tangent of the curve
 * This controls the inTangent and outTangent values for the keyframe in the animation.
 * @property {Vector2} control is the control point to control de curve tangent
 * @property {Vector2} anchor represents the Keyframe point which acts origin point.
 * @property {boolen} active tells the component if the control point is currently active
 * @property {string} type (left/right) if the control will be the left or right control point
 * @property {boolean} selected if the control point is currently selected. If selected we can move the control point and will become active
 * @property {(id: string) => void;} selectControlPoint sends the id of the control point to the parent component to tell if it is selected
 * @property {{ from: number; to: number }} framesInCanvasView controls from/to which keyframe should the control point can expand and control de curve
 * The frames in canvas tells us how many frames are currently visible in the canvas and therefore control the width of the line between the control and anchor point
 */
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

    /**
     * Controls where should we render the visible point (representing the control point)
     * The visible control point differs from the control point for UX reasons. The control point
     * expands beyond the visible canvas.
     */
    setVisiblePoint() {
        const quarterDistance = (this.props.framesInCanvasView.to - this.props.framesInCanvasView.from) / 10;
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
                    onClick={this.select}
                >
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

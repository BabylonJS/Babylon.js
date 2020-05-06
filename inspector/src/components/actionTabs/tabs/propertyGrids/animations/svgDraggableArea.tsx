import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { KeyframeSvgPoint, IKeyframeSvgPoint } from './keyframeSvgPoint';

interface ISvgDraggableAreaProps {
    keyframeSvgPoints: IKeyframeSvgPoint[];
    updatePosition: (updatedKeyframe: IKeyframeSvgPoint, index: number) => void
}

export class SvgDraggableArea extends React.Component<ISvgDraggableAreaProps>{

    private _active: boolean;
    private _isCurrentPointControl: string;
    private _currentPointIndex: number;
    private _draggableArea: React.RefObject<SVGSVGElement>;

    constructor(props: ISvgDraggableAreaProps) {
        super(props);
        this._currentPointIndex = -1;
        this._isCurrentPointControl = "";
        this._draggableArea = React.createRef();
    }

    dragStart(e: React.TouchEvent<SVGSVGElement>): void;
    dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
    dragStart(e: any): void {
        e.preventDefault();
        if (e.target.classList.contains("draggable")) {
            this._active = true;
            this._currentPointIndex = parseInt(e.target.getAttribute('data-id'));

            if (e.target.classList.contains("control-point")) {
                this._isCurrentPointControl = e.target.getAttribute("type");
            }
        }
    }

    drag(e: React.TouchEvent<SVGSVGElement>): void;
    drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
    drag(e: any): void {
        if (this._active) {

            e.preventDefault();

            var coord = this.getMousePosition(e);

            if (coord !== undefined) {

                var newPoints = [...this.props.keyframeSvgPoints];

                if (this._isCurrentPointControl === "left") {
                    newPoints[this._currentPointIndex].leftControlPoint = coord;
                } else if (this._isCurrentPointControl === "right") {
                    newPoints[this._currentPointIndex].rightControlPoint = coord;
                } else {
                    newPoints[this._currentPointIndex].keyframePoint = coord;
                }

                this.props.updatePosition(newPoints[this._currentPointIndex], this._currentPointIndex);

            }
        }
    }

    dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
    dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
    dragEnd(e: any): void {
        e.preventDefault();
        this._active = false;
        this._currentPointIndex = -1;
        this._isCurrentPointControl = "";
    }

    getMousePosition(e: React.TouchEvent<SVGSVGElement>): Vector2 | undefined;
    getMousePosition(e: React.MouseEvent<SVGSVGElement, MouseEvent>): Vector2 | undefined;
    getMousePosition(e: any): Vector2 | undefined {

        if (e.touches) { e = e.touches[0]; }

        if (this._draggableArea.current) {
            var svg = this._draggableArea.current as SVGSVGElement;
            var CTM = svg.getScreenCTM();
            if (CTM) {
                return new Vector2((e.clientX - CTM.e) / CTM.a, (e.clientY - CTM.f) / CTM.d);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    render() {
        return (
            <>
                <svg className="linear" style={{ border: '1px solid black' }} ref={this._draggableArea}

                    onMouseMove={(e) => this.drag(e)}
                    onTouchMove={(e) => this.drag(e)}
                    onTouchStart={(e) => this.dragStart(e)}
                    onTouchEnd={(e) => this.dragEnd(e)}

                    onMouseDown={(e) => this.dragStart(e)}
                    onMouseUp={(e) => this.dragEnd(e)}
                    onMouseLeave={(e) => this.dragEnd(e)}
                    // Add way to add new keyframe

                    viewBox="0 0 100 100" preserveAspectRatio="none">

                    {this.props.children}
                    {this.props.keyframeSvgPoints.map((keyframe, i) =>
                        <KeyframeSvgPoint key={i} id={i.toString()} keyframePoint={keyframe.keyframePoint} leftControlPoint={keyframe.leftControlPoint} rightControlPoint={keyframe.rightControlPoint} />
                    )}
                </svg>
            </>)
    }
}






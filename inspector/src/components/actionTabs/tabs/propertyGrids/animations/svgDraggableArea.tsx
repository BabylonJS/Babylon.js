import * as React from "react";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { IKeyframeSvgPoint } from "./keyframeSvgPoint";

interface ISvgDraggableAreaProps {
    // List of SVG Points in curve
    keyframeSvgPoints: IKeyframeSvgPoint[];
    // Update the position of the selected SVG Point
    updatePosition: (updatedKeyframe: IKeyframeSvgPoint, id: string) => void;
    // The scale of the curve respect to the visible canvas
    scale: number;
    // The SVG canvas viewBox
    viewBoxScale: number;
    // Deselects all keyframes
    deselectKeyframes: () => void;
    // Remove the selected keyframes
    removeSelectedKeyframes: (points: IKeyframeSvgPoint[]) => void;
    // How much y panning the user has done to move the canvas (relative to canvas)
    panningY: (panningY: number) => void;
    // How much x panning the user has done to move the canvas (relative to canvas)
    panningX: (panningX: number) => void;
    // Moves the current selected frame back and forth depending on number of frames
    setCurrentFrame: (direction: number) => void;
    // The anchor point of the canvas to center it
    positionCanvas?: Vector2;
    // If the canvas is set to reposition
    repositionCanvas?: boolean;
    // If the canvas reposition event has ended
    canvasPositionEnded: () => void;
    // Resets the selected keyframe
    resetActionableKeyframe: () => void;
    // How many frames should be visible in the current canvas scale
    framesInCanvasView: { from: number; to: number };
    // How many frames has the canvas added or removed depending on window resize event
    framesResized: number;
}

/**
 * The SvgDraggableArea is a wrapper for SVG Canvas the interaction
 *
 * Here we control the drag and key behavior for the SVG components.
 */
export class SvgDraggableArea extends React.Component<ISvgDraggableAreaProps, { panX: number; panY: number }> {
    private _active: boolean;
    private _isCurrentPointControl: string;
    private _currentPointId: string;
    private _draggableArea: React.RefObject<SVGSVGElement>;
    private _panStart: Vector2;
    private _panStop: Vector2;
    private _playheadDrag: number;
    private _playheadSelected: boolean;
    private _movedX: number;
    private _movedY: number;
    private _isControlKeyPress: boolean;
    readonly _dragBuffer: number;
    readonly _draggingMultiplier: number;

    constructor(props: ISvgDraggableAreaProps) {
        super(props);
        this._currentPointId = "";
        this._isCurrentPointControl = "";
        this._draggableArea = React.createRef();
        this._panStart = new Vector2(0, 0);
        this._panStop = new Vector2(0, 0);
        this._playheadDrag = 0;
        this._playheadSelected = false;
        this._movedX = 0;
        this._movedY = 0;
        this._dragBuffer = 3;
        this._draggingMultiplier = 10;
        this._isControlKeyPress = false;

        this.state = { panX: 0, panY: 0 };
    }

    /**
     * Listen to key events to be able to drag and set the correct canvas client width
    */
    componentDidMount() {
        this._draggableArea.current?.addEventListener("keydown", this.keyDown.bind(this));
        this._draggableArea.current?.addEventListener("keyup", this.keyUp.bind(this));
        setTimeout(() => {
            this._draggableArea.current?.clientWidth !== undefined ? this._draggableArea.current?.clientWidth : 0;
        }, 500);
    }

    /**
     * Makes sure the canvas has resposition correctly
     * @param prevProps previous props
     */
    componentDidUpdate(prevProps: ISvgDraggableAreaProps) {
        if (
            this.props.positionCanvas !== prevProps.positionCanvas &&
            this.props.positionCanvas !== undefined &&
            this.props.repositionCanvas
        ) {
            this.setState(
                {
                    panX: this.props.positionCanvas.x,
                    panY: this.props.positionCanvas.y,
                },
                () => {
                    this.props.canvasPositionEnded();
                }
            );
        }
    }

    /**
     * Identify the type of target of the mouse event
     * @param e SVG Mouse Event
     */
    dragStart = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
        e.preventDefault();
        if ((e.target as SVGSVGElement).classList.contains("draggable")) {
            // Set dragging as active
            this._active = true;
            // If we are trying to move a keyframe, set the current dragging point being moved
            const dataId = (e.target as SVGSVGElement).getAttribute("data-id");
            if (dataId !== null) {
                this._currentPointId = dataId;
            }

            // If we are trying to move a keyframe control point, set the dragging control point
            if ((e.target as SVGSVGElement).classList.contains("control-point")) {
                const type = (e.target as SVGSVGElement).getAttribute("type");
                if (type !== null) {
                    this._isCurrentPointControl = type;
                }
            }
        }

        // Controls if we are trying to drag the playhead
        if ((e.target as SVGSVGElement).classList.contains("svg-playhead")) {
            this._active = true;
            this._playheadSelected = true;
            this._playheadDrag = e.clientX - e.currentTarget.getBoundingClientRect().left;
        }

        // Controls if we are trying to pan the content in the canvas
        if ((e.target as SVGSVGElement).classList.contains("pannable")) {
            if (this._isControlKeyPress) {
                this._active = true;
                this._panStart.set(
                    e.clientX - e.currentTarget.getBoundingClientRect().left,
                    e.clientY - e.currentTarget.getBoundingClientRect().top
                );
            }
        }
    };

    /**
     * Handle dragging
     * @param e SVG Mouse Event
     */
    drag = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
        if (this._active) {
            e.preventDefault();

            var coord = this.getMousePosition(e);

            if (coord !== undefined) {
                // Handles the canvas panning
                if ((e.target as SVGSVGElement).classList.contains("pannable")) {
                    if (this._isControlKeyPress) {
                        if (this._panStart.x !== 0 && this._panStart.y !== 0) {
                            this._panStop.set(
                                e.clientX - e.currentTarget.getBoundingClientRect().left,
                                e.clientY - e.currentTarget.getBoundingClientRect().top
                            );
                            this.panDirection();
                        }
                    }
                }
                // Handles the playhead dragging
                if (
                    e.currentTarget.classList.contains("linear") &&
                    this._playheadDrag !== 0 &&
                    this._playheadSelected
                ) {
                    const moving = e.clientX - e.currentTarget.getBoundingClientRect().left;

                    const draggableAreaWidth = e.currentTarget.clientWidth;

                    const initialFrame = this.props.framesInCanvasView.from;

                    const lastFrame = this.props.framesInCanvasView.to;

                    const framesInCanvas = lastFrame - initialFrame;

                    const unit = draggableAreaWidth / framesInCanvas;

                    const newFrame = Math.round(moving / unit) + initialFrame;
                    this.props.setCurrentFrame(newFrame);
                } else {
                    // Handles the control point dragging
                    var newPoints = [...this.props.keyframeSvgPoints];
                    let point = newPoints.find((kf) => kf.id === this._currentPointId);
                    if (point) {
                        if (this._isCurrentPointControl === "left") {
                            point.leftControlPoint = coord;
                            point.isLeftActive = true;
                            point.isRightActive = false;
                        } else if (this._isCurrentPointControl === "right") {
                            point.rightControlPoint = coord;
                            point.isRightActive = true;
                            point.isLeftActive = false;
                        } else {
                            point.keyframePoint = coord;
                            point.isRightActive = false;
                            point.isLeftActive = false;
                        }
                        this.props.updatePosition(point, this._currentPointId);
                    }
                }
            }
        }
    };

    /**
     *  Resets the dragging state
     * @param e Drag event
     */
    dragEnd = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
        e.preventDefault();
        this._active = false;
        this._currentPointId = "";
        this._isCurrentPointControl = "";
        this._panStart.set(0, 0);
        this._panStop.set(0, 0);
        this._playheadDrag = 0;
        this._playheadSelected = false;
        this._movedX = 0;
        this._movedY = 0;
    };

    /**
     * Gets the current position of the mouse in a SVG Canvas
     * @param e Mouse event
     */
    getMousePosition = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): Vector2 | undefined => {
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
    };

    /**
     * Handles the canvas panning direction and sets the X and Y values to move the
     * SVG canvas
     */
    panDirection() {
        let directionX = 1;
        if (this._movedX < this._panStop.x) {
            directionX = -1; //left
        } else {
            directionX = 1; //right
        }

        let directionY = 1;
        if (this._movedY < this._panStop.y) {
            directionY = -1; //top
        } else {
            directionY = 1; //bottom
        }

        // Establish the pan buffer we have to start moving the canvas
        const bufferX = this._movedX === 0 ? 1 : Math.abs(this._movedX - this._panStop.x);
        const bufferY = this._movedY === 0 ? 1 : Math.abs(this._movedY - this._panStop.y);

        let xMulti = 0;
        // Evaluate if mouse move is too little to move the canvas
        if (bufferX >= this._dragBuffer) {
            xMulti = Math.round(Math.abs(bufferX - this._dragBuffer) / 2.5);
        }
        // Evaluate if mouse move is too little to move the canvas
        let yMulti = 0;
        if (bufferY >= this._dragBuffer) {
            yMulti = Math.round(Math.abs(bufferY - this._dragBuffer) / 2.5);
        }

        // Set last moved value
        this._movedX = this._panStop.x;
        this._movedY = this._panStop.y;

        // Establish new pan value
        let newX = this.state.panX + directionX * xMulti;
        let newY = this.state.panY + directionY * yMulti;

        this.setState({
            panX: Math.round(newX),
            panY: Math.round(newY),
        });

        this.props.panningY(Math.round(newY));
        this.props.panningX(Math.round(newX));
    }

    /**
     * Allows dragging
     * @param e Keyboard event
     */
    keyDown(e: KeyboardEvent) {
        e.preventDefault();
        if (e.keyCode === 17 || e.keyCode === 32) {
            this._draggableArea.current?.style.setProperty("cursor", "grab");
            this._isControlKeyPress = true;
        }
    }

    /**
     * Allows multiple selection
     * @param e Keyboard event
     */
    keyUp(e: KeyboardEvent) {
        e.preventDefault();
        if (e.keyCode === 17 || e.keyCode === 32) {
            this._draggableArea.current?.style.setProperty("cursor", "initial");
            this._isControlKeyPress = false;
            this._active = false;
            this._panStart.set(0, 0);
            this._panStop.set(0, 0);
            this._movedX = 0;
            this._movedY = 0;
        }

        if (e.keyCode === 8 || e.keyCode === 46) {
            const pointsToDelete = this.props.keyframeSvgPoints.filter((kf) => kf.selected);
            this.props.removeSelectedKeyframes(pointsToDelete);
        }
    }

    /**
     * Focus on the SVG canvas
     * @param e Mouse event
     */
    focus = (e: React.MouseEvent<SVGSVGElement>) => {
        e.preventDefault();
        this._draggableArea.current?.focus();

        if ((e.target as SVGSVGElement).className.baseVal == "linear pannable") {
            if (this.isNotControlPointActive()) {
                this.props.deselectKeyframes();
            }

            this.props.resetActionableKeyframe();
        }
    };

    /**
     * Is the control point active or not
     */
    isNotControlPointActive() {
        const activeControlPoints = this.props.keyframeSvgPoints.filter((x) => x.isLeftActive || x.isRightActive);
        if (activeControlPoints.length !== 0) {
            return false;
        } else {
            return true;
        }
    }

    render() {
        const viewBoxScaling = `${this.props.positionCanvas?.x} ${this.props.positionCanvas?.y} ${Math.round(
            this.props.scale * 200
        )} ${Math.round(this.props.scale * 100)}`;
        return (
            <>
                <svg
                    className="linear pannable"
                    ref={this._draggableArea}
                    tabIndex={0}
                    onMouseMove={this.drag}
                    onMouseDown={this.dragStart}
                    onMouseUp={this.dragEnd}
                    onMouseLeave={this.dragEnd}
                    onClick={this.focus}
                    viewBox={viewBoxScaling}
                >
                    {this.props.children}
                </svg>
            </>
        );
    }
}

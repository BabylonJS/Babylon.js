import * as React from "react";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { AnchorSvgPoint } from "./anchorSvgPoint";

const keyInactive = require("./assets/keyInactiveIcon.svg") as string;
const keySelected = require("./assets/keySelectedIcon.svg") as string;

export interface IKeyframeSvgPoint {
    // Keyframe point to render in svg canvas
    keyframePoint: Vector2;
    // Right control point (controls curve)
    rightControlPoint: Vector2 | null;
    // Left control point (controls curve)
    leftControlPoint: Vector2 | null;
    // svg keyframe id
    id: string;
    // If the keyframe is selected on canvas
    selected: boolean;
    // I the left control point is being dragged or active
    isLeftActive: boolean;
    // I the right control point is being dragged or active
    isRightActive: boolean;
    // The parent curve id
    curveId?: ICurveMetaData;
}

export interface ICurveMetaData {
    id: number;
    animationName: string;
    property: string;
}

interface IKeyframeSvgPointProps {
    // Keyframe point to render in svg canvas
    keyframePoint: Vector2;
    // Left control point (controls curve)
    leftControlPoint: Vector2 | null;
    // Right control point (controls curve)
    rightControlPoint: Vector2 | null;
    // svg keyframe id
    id: string;
    // If the keyframe is selected on canvas
    selected: boolean;
    // Select keyframe and mode of selection
    selectKeyframe: (id: string, multiselect: boolean) => void;
    // Returns the id of the selected keyframe and its animation property type
    selectedControlPoint: (type: string, id: string) => void;
    // I the left control point is being dragged or active
    isLeftActive: boolean;
    // I the right control point is being dragged or active
    isRightActive: boolean;
    // Current visible frames in canvas
    framesInCanvasView: { from: number; to: number };
}

/**
 * Renders the Keyframe as an SVG Element for the Canvas component.
 * Holds the two control points to generate the proper curve.
 */
export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps> {
    constructor(props: IKeyframeSvgPointProps) {
        super(props);
    }

    /**
     * Select a keyframe. If the control key is pressed, multiselect keyframes
     * @param e Mouse event
     */
    select = (e: React.MouseEvent<SVGImageElement>) => {
        e.preventDefault();
        let multiSelect = false;
        if (e.buttons === 0 && e.ctrlKey) {
            multiSelect = true;
        }
        this.props.selectKeyframe(this.props.id, multiSelect);
    };

    /**
     * Send the ID of the selected keyframe
     * @param type Type of selected keyframe
     */
    selectedControlPointId = (type: string) => {
        this.props.selectedControlPoint(type, this.props.id);
    };

    render() {
        const svgImageIcon = this.props.selected ? keySelected : keyInactive;
        return (
            <>
                <svg
                    className="draggable"
                    x={this.props.keyframePoint.x}
                    y={this.props.keyframePoint.y}
                    style={{ overflow: "visible", cursor: "pointer" }}
                >
                    <image
                        data-id={this.props.id}
                        className="draggable"
                        x="-1"
                        y="-1.5"
                        width="3"
                        height="3"
                        href={svgImageIcon}
                        onClick={this.select}
                    />
                </svg>
                {this.props.leftControlPoint && (
                    <AnchorSvgPoint
                        type="left"
                        index={this.props.id}
                        control={this.props.leftControlPoint}
                        anchor={this.props.keyframePoint}
                        active={this.props.selected}
                        selected={this.props.isLeftActive}
                        selectControlPoint={this.selectedControlPointId}
                        framesInCanvasView={this.props.framesInCanvasView}
                    />
                )}
                {this.props.rightControlPoint && (
                    <AnchorSvgPoint
                        type="right"
                        index={this.props.id}
                        control={this.props.rightControlPoint}
                        anchor={this.props.keyframePoint}
                        active={this.props.selected}
                        selected={this.props.isRightActive}
                        selectControlPoint={this.selectedControlPointId}
                        framesInCanvasView={this.props.framesInCanvasView}
                    />
                )}
            </>
        );
    }
}

import * as React from "react";
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { AnchorSvgPoint } from './anchorSvgPoint';

const keyInactive = require("./assets/keyInactiveIcon.svg") as string;
//const keyActive = require("./assets/keyActiveIcon.svg") as string; uncomment when setting active multiselect
const keySelected = require("./assets/keySelectedIcon.svg") as string;

export interface IKeyframeSvgPoint {
    keyframePoint: Vector2;
    rightControlPoint: Vector2 | null;
    leftControlPoint: Vector2 | null;
    id: string;
    selected: boolean;
    isLeftActive: boolean;
    isRightActive: boolean;
    curveId?: ICurveMetaData;
}

export interface ICurveMetaData {
    id: number;
    animationName: string;
    property: string;
}

interface IKeyframeSvgPointProps {
    keyframePoint: Vector2;
    leftControlPoint: Vector2 | null;
    rightControlPoint: Vector2 | null;
    id: string;
    selected: boolean;
    selectKeyframe: (id: string) => void;
    selectedControlPoint: (type: string, id: string) => void;
    isLeftActive: boolean;
    isRightActive: boolean;
}

export class KeyframeSvgPoint extends React.Component<IKeyframeSvgPointProps>{

    constructor(props: IKeyframeSvgPointProps) {
        super(props);
    }

    select() {
        this.props.selectKeyframe(this.props.id);
    }

    render() {
        return (
            <>
                <svg className="draggable" x={this.props.keyframePoint.x} y={this.props.keyframePoint.y} style={{ overflow: 'visible', cursor: 'pointer' }} >
                    <image data-id={this.props.id} className="draggable" x="-1" y="-1.5" width="3" height="3" href={this.props.selected ? keySelected : keyInactive} onClick={() => this.select()} />
                </svg>
                {this.props.leftControlPoint && <AnchorSvgPoint type="left" index={this.props.id} control={this.props.leftControlPoint} anchor={this.props.keyframePoint} active={this.props.selected} selected={this.props.isLeftActive} selectControlPoint={(type: string) => this.props.selectedControlPoint(type, this.props.id)} />}
                {this.props.rightControlPoint && <AnchorSvgPoint type="right" index={this.props.id} control={this.props.rightControlPoint} anchor={this.props.keyframePoint} active={this.props.selected} selected={this.props.isRightActive} selectControlPoint={(type: string) => this.props.selectedControlPoint(type, this.props.id)} />}
            </>
        )
    }
} 
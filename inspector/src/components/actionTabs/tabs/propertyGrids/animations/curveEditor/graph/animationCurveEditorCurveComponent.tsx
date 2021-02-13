import * as React from "react";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { AnimationCurveEditorCurve } from "./animationCurveEditorCurve";

interface IAnimationCurveEditorCurveComponentProps {
    curve: AnimationCurveEditorCurve;
    convertX:(x: number) => number;
    convertY:(x: number) => number;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorCurveComponentState {
    isSelected: boolean;
}

export class AnimationCurveEditorCurveComponent extends React.Component<
IAnimationCurveEditorCurveComponentProps,
IAnimationCurveEditorCurveComponentState
> {    
    constructor(props: IAnimationCurveEditorCurveComponentProps) {
        super(props);

        this.state = { isSelected: false };
    }

    public render() {
        return (
            <svg
                style={{ cursor: "pointer", overflow: "auto" }}>            
            <path
                d={this.props.curve.gePathData(this.props.convertX, this.props.convertY)}
                style={{
                    stroke: this.props.curve.color,
                    fill: "none",
                    strokeWidth: "1",
                }}
            ></path>
        </svg>
        );
    }
}
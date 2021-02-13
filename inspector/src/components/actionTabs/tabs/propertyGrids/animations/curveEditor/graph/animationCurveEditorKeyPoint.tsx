import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";

const keyInactive = require("../assets/keyInactiveIcon.svg") as string;
const keySelected = require("../assets/keySelectedIcon.svg") as string;

interface IAnimationCurveEditorKeyPointComponentProps {
    x: number;
    y: number;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorKeyPointComponentState {
    isSelected: boolean;
}

export class AnimationCurveEditorKeyPointComponent extends React.Component<
IAnimationCurveEditorKeyPointComponentProps,
IAnimationCurveEditorKeyPointComponentState
> {    
    private _onActiveKeyPointChangedObserver: Nullable<Observer<Nullable<AnimationCurveEditorKeyPointComponent>>>;

    constructor(props: IAnimationCurveEditorKeyPointComponentProps) {
        super(props);

        this.state = { isSelected: false };

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(keyPoint => {
            this.setState({isSelected: keyPoint === this});
        });
    }

    componentWillUnmount() {
        if (this._onActiveKeyPointChangedObserver) {
            this.props.context.onActiveKeyPointChanged.remove(this._onActiveKeyPointChangedObserver);
        }
    }

    public render() {
        const svgImageIcon = this.state.isSelected ? keySelected : keyInactive;

        return (
            <svg
                x={this.props.x}
                y={this.props.y}
                onClick={() => {
                    this.props.context.onActiveKeyPointChanged.notifyObservers(this);
                }}
                style={{ cursor: "pointer", overflow: "auto" }}
        >
            <image
                x="-8"
                y="-8"
                width="16"
                height="16"
                href={svgImageIcon}
            />
        </svg>
        );
    }
}
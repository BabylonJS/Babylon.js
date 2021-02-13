import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";

const keyInactive = require("../assets/keyInactiveIcon.svg") as string;
const keySelected = require("../assets/keySelectedIcon.svg") as string;

interface IAnimationCurveEditorKeyPointComponentProps {
    x: number;
    y: number;
    scale: number;
    context: AnimationCurveEditorContext;
    channel: string;
}

interface IAnimationCurveEditorKeyPointComponentState {
    isSelected: boolean;
}

export class AnimationCurveEditorKeyPointComponent extends React.Component<
IAnimationCurveEditorKeyPointComponentProps,
IAnimationCurveEditorKeyPointComponentState
> {    
    private _onActiveKeyPointChangedObserver: Nullable<Observer<Nullable<{keyPoint: AnimationCurveEditorKeyPointComponent, channel: string}>>>;

    constructor(props: IAnimationCurveEditorKeyPointComponentProps) {
        super(props);

        this.state = { isSelected: false };

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(data => {
            this.setState({isSelected: data?.keyPoint === this});
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
                    this.props.context.onActiveKeyPointChanged.notifyObservers({
                        keyPoint: this,
                        channel: this.props.channel
                    });
                }}
                style={{ cursor: "pointer", overflow: "auto" }}
        >
            <image
                x={`-${8 * this.props.scale}`}
                y={`-${8 * this.props.scale}`}
                width={`${16 * this.props.scale}`}
                height={`${16 * this.props.scale}`}
                href={svgImageIcon}
            />
        </svg>
        );
    }
}
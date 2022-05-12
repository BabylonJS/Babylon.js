import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import * as React from "react";
import type { Context, IActiveAnimationChangedOptions } from "../context";
import type { Curve } from "./curve";
import type { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { Animation } from "core/Animations/animation";

interface ICurveComponentProps {
    curve: Curve;
    convertX: (x: number) => number;
    convertY: (x: number) => number;
    context: Context;
}

interface ICurveComponentState {
    isSelected: boolean;
}

export class CurveComponent extends React.Component<ICurveComponentProps, ICurveComponentState> {
    private _onDataUpdatedObserver: Nullable<Observer<void>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<IActiveAnimationChangedOptions>>;
    private _onInterpolationModeSetObserver: Nullable<Observer<{ keyId: number; value: AnimationKeyInterpolation }>>;

    constructor(props: ICurveComponentProps) {
        super(props);

        this.state = { isSelected: false };

        this._onDataUpdatedObserver = this.props.curve.onDataUpdatedObservable.add(() => this.forceUpdate());

        this._onActiveAnimationChangedObserver = props.context.onActiveAnimationChanged.add(() => {
            if (this._onDataUpdatedObserver) {
                this.props.curve.onDataUpdatedObservable.remove(this._onDataUpdatedObserver);
            }
            this._onDataUpdatedObserver = null;
            this.forceUpdate();
        });

        this._onInterpolationModeSetObserver = props.context.onInterpolationModeSet.add(({ keyId, value }) => {
            this.props.curve.updateInterpolationMode(keyId, value);
        });
    }

    componentWillUnmount() {
        if (this._onDataUpdatedObserver) {
            this.props.curve.onDataUpdatedObservable.remove(this._onDataUpdatedObserver);
        }

        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }

        if (this._onInterpolationModeSetObserver) {
            this.props.context.onInterpolationModeSet.remove(this._onInterpolationModeSetObserver);
        }
    }

    componentDidUpdate() {
        if (!this._onDataUpdatedObserver) {
            this._onDataUpdatedObserver = this.props.curve.onDataUpdatedObservable.add(() => this.forceUpdate());
        }

        return true;
    }

    public render() {
        if (!this.props.context.isChannelEnabled(this.props.curve.animation, this.props.curve.color)) {
            return null;
        }
        const pathStyle: any = {
            stroke: this.props.curve.color,
            fill: "none",
            strokeWidth: "1",
        };

        if (this.props.curve.animation.dataType === Animation.ANIMATIONTYPE_QUATERNION) {
            pathStyle["stroke-dasharray"] = "5";
            pathStyle["stroke-opacity"] = "0.5";
        }

        return (
            <svg style={{ cursor: "pointer", overflow: "auto" }}>
                <path d={this.props.curve.getPathData(this.props.convertX, this.props.convertY)} style={pathStyle}></path>
            </svg>
        );
    }
}

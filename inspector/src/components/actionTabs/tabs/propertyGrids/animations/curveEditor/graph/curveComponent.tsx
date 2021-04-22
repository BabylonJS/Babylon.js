import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { Context } from "../context";
import { Curve } from "./curve";

interface ICurveComponentProps {
    curve: Curve;
    convertX:(x: number) => number;
    convertY:(x: number) => number;
    context: Context;
}

interface ICurveComponentState {
    isSelected: boolean;
}

export class CurveComponent extends React.Component<
ICurveComponentProps,
ICurveComponentState
> {    
    private _onDataUpdatedObserver: Nullable<Observer<void>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;

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
    }

    componentWillUnmount() {
        if (this._onDataUpdatedObserver) {
            this.props.curve.onDataUpdatedObservable.remove(this._onDataUpdatedObserver);
        }

        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
    }

    componentDidUpdate() {
        if (!this._onDataUpdatedObserver) {            
            this._onDataUpdatedObserver = this.props.curve.onDataUpdatedObservable.add(() => this.forceUpdate());
        }

        return true;
    }

    public render() {
        if (this.props.context.activeColor && this.props.context.activeColor !== this.props.curve.color) {
            return null;
        }

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
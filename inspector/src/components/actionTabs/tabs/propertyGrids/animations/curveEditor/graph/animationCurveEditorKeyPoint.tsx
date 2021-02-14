import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";

const keyInactive = require("../assets/keyInactiveIcon.svg") as string;
const keySelected = require("../assets/keySelectedIcon.svg") as string;

interface IAnimationCurveEditorKeyPointComponentProps {
    x: number;
    y: number;
    getPreviousX: () => Nullable<number>;
    getNextX: () => Nullable<number>;
    nextX?: number;
    scale: number;
    context: AnimationCurveEditorContext;
    channel: string;
    onFrameValueChanged: (value: number) => void;
    onKeyValueChanged: (value: number) => void;
}

interface IAnimationCurveEditorKeyPointComponentState {
    isSelected: boolean;    
    x: number;
    y: number;
}

export class AnimationCurveEditorKeyPointComponent extends React.Component<
IAnimationCurveEditorKeyPointComponentProps,
IAnimationCurveEditorKeyPointComponentState
> {    
    private _onActiveKeyPointChangedObserver: Nullable<Observer<Nullable<{keyPoint: AnimationCurveEditorKeyPointComponent, channel: string}>>>;
    private _pointerIsDown: boolean;
    private _sourcePointerX: number;
    private _sourcePointerY: number;

    constructor(props: IAnimationCurveEditorKeyPointComponentProps) {
        super(props);

        this.state = { isSelected: false, x: this.props.x, y: this.props.y };

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(data => {
            this.setState({isSelected: data?.keyPoint === this});
        });
    }

    componentWillUnmount() {
        if (this._onActiveKeyPointChangedObserver) {
            this.props.context.onActiveKeyPointChanged.remove(this._onActiveKeyPointChangedObserver);
        }
    }

    shouldComponentUpdate(newProps: IAnimationCurveEditorKeyPointComponentProps, newState: IAnimationCurveEditorKeyPointComponentState) {
        if (newProps !== this.props) {
            newState.x = newProps.x;
            newState.y = newProps.y;
        }

        return true;
    }

    private _onPointerDown(evt: React.PointerEvent<SVGSVGElement>) {
        this.props.context.onActiveKeyPointChanged.notifyObservers({
            keyPoint: this,
            channel: this.props.channel
        });

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;

        evt.stopPropagation();
    }

    private _onPointerMove(evt: React.PointerEvent<SVGSVGElement>) {
        if (!this._pointerIsDown) {
            return;
        }

        let newX = this.state.x + (evt.nativeEvent.offsetX - this._sourcePointerX) * this.props.scale;
        let newY = this.state.y + (evt.nativeEvent.offsetY - this._sourcePointerY) * this.props.scale;
        let previousX = this.props.getPreviousX();
        let nextX = this.props.getNextX();


        if (previousX !== null) {
            newX = Math.max(previousX, newX);
        }

        if (nextX !== null) {
            newX = Math.min(nextX, newX);
        }

        this.props.onFrameValueChanged(newX);
        this.props.onKeyValueChanged(newY);
              
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;

        this.setState({x: newX, y: newY});

        evt.stopPropagation();
    }

    private _onPointerUp(evt: React.PointerEvent<SVGSVGElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);

        evt.stopPropagation();
    }

    public render() {
        const svgImageIcon = this.state.isSelected ? keySelected : keyInactive;

        return (
            <svg
                onPointerDown={evt => this._onPointerDown(evt)}
                onPointerMove={evt => this._onPointerMove(evt)}
                onPointerUp={evt => this._onPointerUp(evt)}
                x={this.state.x}
                y={this.state.y}
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
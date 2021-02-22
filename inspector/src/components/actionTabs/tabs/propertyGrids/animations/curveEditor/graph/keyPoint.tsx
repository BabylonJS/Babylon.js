import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { Context } from "../context";
import { Curve } from "./curve";

const keyInactive = require("../assets/keyInactiveIcon.svg") as string;
const keySelected = require("../assets/keySelectedIcon.svg") as string;
const keyActive = require("../assets/keyActiveIcon.svg") as string;

interface IKeyPointComponentProps {
    x: number;
    y: number;
    getPreviousX: () => Nullable<number>;
    getNextX: () => Nullable<number>;
    invertX:(x: number) => number;
    invertY:(y: number) => number;
    convertX:(x: number) => number;
    convertY:(y: number) => number;
    nextX?: number;
    scale: number;
    keyId: number;
    curve: Curve;
    context: Context;
    channel: string;
    onFrameValueChanged: (value: number) => void;
    onKeyValueChanged: (value: number) => void;
}

interface IKeyPointComponentState {
    selectedState: SelectionState;    
    x: number;
    y: number;
}

enum SelectionState {
    None,
    Selected,
    Siblings
}

export class KeyPointComponent extends React.Component<
IKeyPointComponentProps,
IKeyPointComponentState
> {    
    private _onActiveKeyPointChangedObserver: Nullable<Observer<Nullable<{keyPoint: KeyPointComponent, channel: string}>>>;
    private _onActiveKeyFrameChangedObserver: Nullable<Observer<number>>;
    private _onFrameManuallyEnteredObserver: Nullable<Observer<number>>;
    private _onValueManuallyEnteredObserver: Nullable<Observer<number>>;

    private _pointerIsDown: boolean;
    private _sourcePointerX: number;
    private _sourcePointerY: number;

    constructor(props: IKeyPointComponentProps) {
        super(props);

        this.state = { selectedState: SelectionState.None, x: this.props.x, y: this.props.y };

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(data => {
            const isSelected = data?.keyPoint === this;

            this.setState({selectedState: isSelected ? SelectionState.Selected : 
                (data?.keyPoint.props.curve !== this.props.curve && data?.keyPoint.props.keyId === this.props.keyId ? SelectionState.Siblings : SelectionState.None)});

            if (isSelected) {
                this.props.context.onFrameSet.notifyObservers(this.props.invertX(this.state.x));
                this.props.context.onValueSet.notifyObservers(this.props.invertY(this.state.y));
            }
        });

        this._onActiveKeyFrameChangedObserver = this.props.context.onActiveKeyFrameChanged.add(newFrameValue => {
            if (this.state.selectedState !== SelectionState.Siblings) {
                return;
            }

            this.setState({x: newFrameValue});
            this.props.onFrameValueChanged(this.props.invertX(newFrameValue));
        });

        this._onFrameManuallyEnteredObserver = this.props.context.onFrameManuallyEntered.add(newValue => {
            if (this.state.selectedState === SelectionState.None) {
                return;
            }

            let newX = this.props.convertX(newValue);

            // Checks
            let previousX = this.props.getPreviousX();
            let nextX = this.props.getNextX();
            if (previousX !== null) {
                newX = Math.max(previousX, newX);
            }
    
            if (nextX !== null) {
                newX = Math.min(nextX, newX);
            }

            const frame = this.props.invertX(newX);
            this.setState({x: newX});
            this.props.onFrameValueChanged(frame);    
        });

        this._onValueManuallyEnteredObserver = this.props.context.onValueManuallyEntered.add(newValue => {
            if (this.state.selectedState !== SelectionState.Selected) {
                return;
            }

            let newY = this.props.convertY(newValue);
            this.setState({y: newY});            
            this.props.onKeyValueChanged(newValue);
        });
    }

    componentWillUnmount() {
        if (this._onActiveKeyPointChangedObserver) {
            this.props.context.onActiveKeyPointChanged.remove(this._onActiveKeyPointChangedObserver);
        }

        if (this._onActiveKeyFrameChangedObserver) {
            this.props.context.onActiveKeyFrameChanged.remove(this._onActiveKeyFrameChangedObserver);
        }

        if (this._onFrameManuallyEnteredObserver) {
            this.props.context.onFrameManuallyEntered.remove(this._onFrameManuallyEnteredObserver);
        }

        if (this._onValueManuallyEnteredObserver) {
            this.props.context.onValueManuallyEntered.remove(this._onValueManuallyEnteredObserver);
        }
    }

    shouldComponentUpdate(newProps: IKeyPointComponentProps, newState: IKeyPointComponentState) {
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

        if (this.props.keyId !== 0) {
            let frame = this.props.invertX(newX);
            this.props.onFrameValueChanged(frame);
            this.props.context.onFrameSet.notifyObservers(frame);

            if (newX !== this.state.x) {
                this.props.context.onActiveKeyFrameChanged.notifyObservers(newX);
            }
        } else {
            newX = this.state.x;
        }

        let value = this.props.invertY(newY);
        this.props.onKeyValueChanged(value);
        this.props.context.onValueSet.notifyObservers(value);
              
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
        const svgImageIcon = this.state.selectedState === SelectionState.Selected ? keySelected : (this.state.selectedState === SelectionState.Siblings ? keyActive : keyInactive);

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
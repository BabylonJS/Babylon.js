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

export enum SelectionState {
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
    private _onMainKeyPointSetObserver: Nullable<Observer<void>>;
    private _onMainKeyPointMovedObserver: Nullable<Observer<void>>;

    private _pointerIsDown: boolean;
    private _sourcePointerX: number;
    private _sourcePointerY: number;

    private _offsetXToMain: number;
    private _offsetYToMain: number;

    constructor(props: IKeyPointComponentProps) {
        super(props);

        this.state = { selectedState: SelectionState.None, x: this.props.x, y: this.props.y };
        
        this._onMainKeyPointSetObserver = this.props.context.onMainKeyPointSet.add(() => {
            if (!this.props.context.mainKeyPoint || this.props.context.mainKeyPoint === this) {
                return;
            }
            this._offsetXToMain = this.state.x - this.props.context.mainKeyPoint?.state.x;
            this._offsetYToMain = this.state.y - this.props.context.mainKeyPoint?.state.y;
        });

        this._onMainKeyPointMovedObserver = this.props.context.onMainKeyPointMoved.add(() => {
            let mainKeyPoint = this.props.context.mainKeyPoint!;
            if (mainKeyPoint === this) {
                return;
            }

            if (this.state.selectedState !== SelectionState.None) { // Move frame for every selected or siblins
                let newFrameValue = mainKeyPoint.state.x + this._offsetXToMain;

                this.setState({x: newFrameValue});
                this.props.onFrameValueChanged(this.props.invertX(newFrameValue));
            }
            
            if (this.state.selectedState === SelectionState.Selected) { // Move value only for selected
                let newY = mainKeyPoint.state.y + this._offsetYToMain;
                this.setState({y: newY});            
                this.props.onKeyValueChanged(this.props.invertY(newY));
            }
        });

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(data => {
            const isSelected = this.props.context.activeKeyPoints?.indexOf(this) !== -1;
            
            if (!isSelected && this.props.context.activeKeyPoints) {
                let curve = this.props.curve;
                let state = SelectionState.None;

                for (let activeKeyPoint of this.props.context.activeKeyPoints) {
                    if (activeKeyPoint.props.keyId === this.props.keyId && curve !== activeKeyPoint.props.curve) {
                        state = SelectionState.Siblings;
                        break;
                    }
                }

                this.setState({selectedState: state});

            } else {
                this.setState({selectedState: SelectionState.Selected});
            }

            if (isSelected) {
                this.props.context.onFrameSet.notifyObservers(this.props.invertX(this.state.x));
                this.props.context.onValueSet.notifyObservers(this.props.invertY(this.state.y));
            }
        });

        this._onActiveKeyFrameChangedObserver = this.props.context.onActiveKeyFrameChanged.add(newFrameValue => {
            if (this.state.selectedState !== SelectionState.Siblings || this.props.context.mainKeyPoint) {
                return;
            }

            this.setState({x: newFrameValue});
            this.props.onFrameValueChanged(this.props.invertX(newFrameValue));
        });

        // Values set via the UI
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
        if (this._onMainKeyPointSetObserver) {
            this.props.context.onMainKeyPointSet.remove(this._onMainKeyPointSetObserver);
        }

        if (this._onMainKeyPointMovedObserver) {
            this.props.context.onMainKeyPointMoved.remove(this._onMainKeyPointMovedObserver);
        }

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
        if (!this.props.context.activeKeyPoints) {
            this.props.context.activeKeyPoints = [];
        }

        let index = this.props.context.activeKeyPoints.indexOf(this);
        if (index === -1) {            
            if (!evt.nativeEvent.ctrlKey) {
                this.props.context.activeKeyPoints = [];
            }
            this.props.context.activeKeyPoints.push(this);

            if (this.props.context.activeKeyPoints.length > 1 ) { // multi selection is engaged
                this.props.context.mainKeyPoint = this;
                this.props.context.onMainKeyPointSet.notifyObservers();   
            } else {
                this.props.context.mainKeyPoint = null;
            }
        } else {
            if (evt.nativeEvent.ctrlKey) {
                this.props.context.activeKeyPoints.splice(index, 1);
                this.props.context.mainKeyPoint = null;
            } else {
                if (this.props.context.activeKeyPoints.length > 1 ) {
                    this.props.context.mainKeyPoint = this;
                    this.props.context.onMainKeyPointSet.notifyObservers();
                } else {
                    this.props.context.mainKeyPoint = null;
                }
            }
        }

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

        if (this.props.context.activeKeyPoints!.length > 1) {
            setTimeout(() => {
                this.props.context.onMainKeyPointMoved.notifyObservers();
            });
        }

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
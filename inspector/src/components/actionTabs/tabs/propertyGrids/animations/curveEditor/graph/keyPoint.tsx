import { TmpVectors, Vector2 } from "babylonjs/Maths/math.vector";
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
    tangentSelectedIndex: number;  
    x: number;
    y: number;
}

export enum SelectionState {
    None,
    Selected,
    Siblings
}

enum ControlMode {
    None,
    Key,
    TangentLeft,
    TangentRight
}

export class KeyPointComponent extends React.Component<
IKeyPointComponentProps,
IKeyPointComponentState
> {    
    private _onActiveKeyPointChangedObserver: Nullable<Observer<void>>;
    private _onActiveKeyFrameChangedObserver: Nullable<Observer<number>>;
    private _onFrameManuallyEnteredObserver: Nullable<Observer<number>>;
    private _onValueManuallyEnteredObserver: Nullable<Observer<number>>;
    private _onMainKeyPointSetObserver: Nullable<Observer<void>>;
    private _onMainKeyPointMovedObserver: Nullable<Observer<void>>;
    private _onSelectionRectangleMovedObserver: Nullable<Observer<DOMRect>>;
    private _onFlattenTangentRequiredObserver: Nullable<Observer<void>>;
    private _onLinearTangentRequiredObserver: Nullable<Observer<void>>;
    private _onBreakTangentRequiredObserver: Nullable<Observer<void>>;
    private _onUnifyTangentRequiredObserver: Nullable<Observer<void>>;

    private _pointerIsDown: boolean;
    private _sourcePointerX: number;
    private _sourcePointerY: number;

    private _offsetXToMain: number;
    private _offsetYToMain: number;
    
    private _svgHost: React.RefObject<SVGSVGElement>;
    private _keyPointSVG: React.RefObject<SVGImageElement>;

    private _controlMode = ControlMode.None;

    private _storedLengthIn: number;
    private _storedLengthOut: number;

    private _inVec: Vector2;
    private _outVec: Vector2;

    constructor(props: IKeyPointComponentProps) {
        super(props);

        this.state = { selectedState: SelectionState.None, x: this.props.x, y: this.props.y, tangentSelectedIndex: -1 };
        
        this._svgHost = React.createRef();
        this._keyPointSVG = React.createRef();

        this._onUnifyTangentRequiredObserver = this.props.context.onUnifyTangentRequired.add(() => {
            const isSelected = this.props.context.activeKeyPoints?.indexOf(this) !== -1;

            if (!isSelected) {
                return;
            }

            this._unifyTangent();
        });

        this._onBreakTangentRequiredObserver = this.props.context.onBreakTangentRequired.add(() => {
            const isSelected = this.props.context.activeKeyPoints?.indexOf(this) !== -1;

            if (!isSelected) {
                return;
            }

            this._breakTangent();
        });

        this._onFlattenTangentRequiredObserver = this.props.context.onFlattenTangentRequired.add(() => {
            const isSelected = this.props.context.activeKeyPoints?.indexOf(this) !== -1;

            if (!isSelected) {
                return;
            }

            this._flattenTangent();
        });

        this._onLinearTangentRequiredObserver = this.props.context.onLinearTangentRequired.add(() => {
            const isSelected = this.props.context.activeKeyPoints?.indexOf(this) !== -1;

            if (!isSelected) {
                return;
            }

            this._linearTangent();
        });

        this._onSelectionRectangleMovedObserver = this.props.context.onSelectionRectangleMoved.add(rect1 => {
            if (!this._svgHost.current) {
                return;
            }
            const rect2 = this._svgHost.current.getBoundingClientRect();
            var overlap = !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);

            if (!this.props.context.activeKeyPoints) {
                this.props.context.activeKeyPoints = [];
            }

            let index = this.props.context.activeKeyPoints.indexOf(this);
            if (overlap) {
                if (index === -1) {
                    this.props.context.activeKeyPoints.push(this);

                    this.props.context.onActiveKeyPointChanged.notifyObservers();
                }
            } else {
                if (index > -1) {
                    this.props.context.activeKeyPoints.splice(index, 1);
                    this.props.context.onActiveKeyPointChanged.notifyObservers();
                }
            }
        });
        
        this._onMainKeyPointSetObserver = this.props.context.onMainKeyPointSet.add(() => {
            if (!this.props.context.mainKeyPoint || this.props.context.mainKeyPoint === this) {
                return;
            }
            this._offsetXToMain = this.state.x - this.props.context.mainKeyPoint?.state.x;
            this._offsetYToMain = this.state.y - this.props.context.mainKeyPoint?.state.y;
        });

        this._onMainKeyPointMovedObserver = this.props.context.onMainKeyPointMoved.add(() => {
            let mainKeyPoint = this.props.context.mainKeyPoint;
            if (mainKeyPoint === this || !mainKeyPoint) {
                return;
            }

            if (this.state.selectedState !== SelectionState.None && this.props.keyId !== 0) { // Move frame for every selected or siblins
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

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(() => {
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

                this.setState({selectedState: state, tangentSelectedIndex: -1});

            } else {
                this.setState({selectedState: SelectionState.Selected, tangentSelectedIndex: -1});
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
        if (this._onUnifyTangentRequiredObserver) {
            this.props.context.onUnifyTangentRequired.remove(this._onUnifyTangentRequiredObserver);
        }

        if (this._onBreakTangentRequiredObserver) {
            this.props.context.onBreakTangentRequired.remove(this._onBreakTangentRequiredObserver);
        }

        if (this._onFlattenTangentRequiredObserver) {
            this.props.context.onFlattenTangentRequired.remove(this._onFlattenTangentRequiredObserver);
        }

        if (this._onLinearTangentRequiredObserver) {
            this.props.context.onLinearTangentRequired.remove(this._onLinearTangentRequiredObserver);
        }

        if (this._onSelectionRectangleMovedObserver) {
            this.props.context.onSelectionRectangleMoved.remove(this._onSelectionRectangleMovedObserver);
        }

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

    private _breakTangent() {
        this.props.curve.updateLockedTangentMode(this.props.keyId, false);
        this.forceUpdate();
    }

    private _unifyTangent() {
        this.props.curve.updateLockedTangentMode(this.props.keyId, true);
        this.forceUpdate();
    }

    private _flattenTangent() {
        if (this.state.tangentSelectedIndex === -1 || this.state.tangentSelectedIndex === 0) {
            if (this.props.keyId !== 0) {
                this.props.curve.updateInTangentFromControlPoint(this.props.keyId, 0);
            }
        }

        if (this.state.tangentSelectedIndex === -1 || this.state.tangentSelectedIndex === 1) {
            if (this.props.keyId !== this.props.curve.keys.length - 1) {
                this.props.curve.updateOutTangentFromControlPoint(this.props.keyId, 0);
            }
        }

        this.forceUpdate();
    }

    private _linearTangent() {
        if (this.state.tangentSelectedIndex === -1 || this.state.tangentSelectedIndex === 0) {
            if (this.props.keyId !== 0) {
                this.props.curve.storeDefaultInTangent(this.props.keyId);
            }
        }

        if (this.state.tangentSelectedIndex === -1 || this.state.tangentSelectedIndex === 1) {
            if (this.props.keyId !== this.props.curve.keys.length - 1) {
                this.props.curve.storeDefaultOutTangent(this.props.keyId);
            }
        }

        this.props.curve.onDataUpdatedObservable.notifyObservers();
        this.forceUpdate();
    }

    private _select(allowMultipleSelection: boolean) {
        if (!this.props.context.activeKeyPoints) {
            return;
        }

        let index = this.props.context.activeKeyPoints.indexOf(this);
        if (index === -1) {            
            if (!allowMultipleSelection) {
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
            if (allowMultipleSelection) {
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
    }

    private _onPointerDown(evt: React.PointerEvent<SVGSVGElement>) {
        if (!this.props.context.activeKeyPoints) {
            this.props.context.activeKeyPoints = [];
        }

        this._select(evt.nativeEvent.ctrlKey);

        this.props.context.onActiveKeyPointChanged.notifyObservers();

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;

        const target = evt.nativeEvent.target as HTMLElement;
        if (target.tagName === "image") {
            this._controlMode = ControlMode.Key;
            this.setState({tangentSelectedIndex: -1});
        } else if (target.classList.contains("left-tangent")) {
            this._controlMode = ControlMode.TangentLeft;
            this.setState({tangentSelectedIndex: 0});
        } else if (target.classList.contains("right-tangent")) {
            this._controlMode = ControlMode.TangentRight;
            this.setState({tangentSelectedIndex: 1});
        }

        evt.stopPropagation();
    }

    private _extractSlope(vec: Vector2, storedLength: number, isIn: boolean) {
        if (isIn && vec.x >= 0) {
            vec.x = -0.01;
        } else if (!isIn && vec.x <= 0) {
            vec.x = 0.01;
        }       

        let currentPosition = vec.clone();

        currentPosition.normalize();
        currentPosition.scaleInPlace(storedLength);
        
        const keys = this.props.curve.keys;
        const value = isIn ? keys[this.props.keyId].value - this.props.invertY(currentPosition.y + this.state.y) : this.props.invertY(currentPosition.y + this.state.y) - keys[this.props.keyId].value;
        const frame = isIn ? keys[this.props.keyId].frame - this.props.invertX(currentPosition.x + this.state.x) : this.props.invertX(currentPosition.x + this.state.x) - keys[this.props.keyId].frame;

        return value / frame;
    }

    private _processTangentMove(evt: React.PointerEvent<SVGSVGElement>, vec: Vector2, storedLength: number, isIn: boolean) {
        vec.x += (evt.nativeEvent.offsetX - this._sourcePointerX) * this.props.scale;
        vec.y += (evt.nativeEvent.offsetY - this._sourcePointerY) * this.props.scale; 

        return this._extractSlope(vec, storedLength, isIn);
    }

    private _onPointerMove(evt: React.PointerEvent<SVGSVGElement>) {
        if (!this._pointerIsDown || this.state.selectedState !==  SelectionState.Selected) {
            return;
        }

        if (this._controlMode === ControlMode.Key) {

            let newX = this.state.x + (evt.nativeEvent.offsetX - this._sourcePointerX) * this.props.scale;
            let newY = this.state.y + (evt.nativeEvent.offsetY - this._sourcePointerY) * this.props.scale;
            let previousX = this.props.getPreviousX();
            let nextX = this.props.getNextX();
            const epsilon = 0.01;

            if (previousX !== null) {
                newX = Math.max(previousX + epsilon, newX);
            }

            if (nextX !== null) {
                newX = Math.min(nextX - epsilon, newX);
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
                
            this.setState({x: newX, y: newY});

            if (this.props.context.activeKeyPoints!.length > 1) {
                setTimeout(() => {
                    if (this.props.context.mainKeyPoint) {
                        this.props.context.onMainKeyPointMoved.notifyObservers();
                    }
                });
            }
        } else {                        
            const keys = this.props.curve.keys;
            const isLockedTangent = keys[this.props.keyId].lockedTangent && this.props.keyId !== 0 && this.props.keyId !== keys.length - 1
                                    && keys[this.props.keyId].inTangent !== undefined && keys[this.props.keyId].outTangent !== undefined;

            let angleDiff = 0;
            let tmpVector = TmpVectors.Vector2[0];            

            if (isLockedTangent) {
                const va = TmpVectors.Vector2[1];  
                const vb = TmpVectors.Vector2[2];  

                Vector2.NormalizeToRef(this._inVec, va);
                Vector2.NormalizeToRef(this._outVec, vb);
                angleDiff = Math.acos(Math.min(1.0, Math.max(-1, Vector2.Dot(va, vb))));

                this._inVec.rotateToRef(-angleDiff, tmpVector);  
                if (Vector2.Distance(tmpVector, this._outVec) > 0.01) {
                    angleDiff = -angleDiff;
                }
            }

            if (this._controlMode === ControlMode.TangentLeft) {
                this.props.curve.updateInTangentFromControlPoint(this.props.keyId, this._processTangentMove(evt, this._inVec, this._storedLengthIn, true));

                if (isLockedTangent) {
                    this._inVec.rotateToRef(-angleDiff, tmpVector);                   
                    tmpVector.x = Math.abs(tmpVector.x);

                    this.props.curve.updateOutTangentFromControlPoint(this.props.keyId, this._extractSlope(tmpVector, this._storedLengthOut, false));
                }

            } else if (this._controlMode === ControlMode.TangentRight) {
                this.props.curve.updateOutTangentFromControlPoint(this.props.keyId, this._processTangentMove(evt, this._outVec, this._storedLengthOut, false));

                if (isLockedTangent) {
                    this._outVec.rotateToRef(angleDiff, tmpVector);
                    tmpVector.x = -Math.abs(tmpVector.x);

                    this.props.curve.updateInTangentFromControlPoint(this.props.keyId, this._extractSlope(tmpVector, this._storedLengthIn, true));
                }
            }  
            this.forceUpdate();
        }

        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;
        evt.stopPropagation();
    }

    private _onPointerUp(evt: React.PointerEvent<SVGSVGElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);

        evt.stopPropagation();

        this._controlMode = ControlMode.None;
    }

    public render() {
        if (this.props.context.activeColor && this.props.context.activeColor !== this.props.curve.color) {
            return null;
        }

        const svgImageIcon = this.state.selectedState === SelectionState.Selected ? keySelected : (this.state.selectedState === SelectionState.Siblings ? keyActive : keyInactive);
        const keys = this.props.curve.keys;

        const isLockedTangent = keys[this.props.keyId].lockedTangent ?? true;

        const convertedX = this.props.invertX(this.state.x);
        const convertedY = this.props.invertY(this.state.y);
        const inControlPointValue = convertedY - this.props.curve.getInControlPoint(this.props.keyId);
        const outControlPointValue = convertedY + this.props.curve.getOutControlPoint(this.props.keyId);
       
        // We want to store the delta in the key local space
        this._outVec = new Vector2(this.props.convertX(convertedX + 1) - this.state.x, this.props.convertY(outControlPointValue) - this.state.y);
        this._inVec = new Vector2(this.props.convertX(convertedX - 1) - this.state.x, this.props.convertY(inControlPointValue) - this.state.y);
        this._storedLengthIn = this._inVec.length();
        this._storedLengthOut = this._outVec.length();

        this._inVec.normalize();
        this._inVec.scaleInPlace(100 * this.props.scale);

        this._outVec.normalize();
        this._outVec.scaleInPlace(100 * this.props.scale);

        return (
            <svg
                ref={this._svgHost}
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
                ref={this._keyPointSVG}
                href={svgImageIcon}                
            />
            {
                this.state.selectedState === SelectionState.Selected && 
                <g>
                    {
                        this.props.keyId !== 0 &&
                        <>
                            <line
                                x1={0}
                                y1={0}
                                x2={`${this._inVec.x}px`}
                                y2={`${this._inVec.y}px`}
                                style={{
                                    stroke: this.state.tangentSelectedIndex === 0 || this.state.tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA",
                                    strokeWidth: `${1 * this.props.scale}`,
                                    strokeDasharray: isLockedTangent ? "" : "2, 2"
                                }}>
                            </line>
                            <circle
                                className="left-tangent"
                                cx={`${this._inVec.x}px`}
                                cy={`${this._inVec.y}px`}
                                r={`${4 * this.props.scale}`}
                                style={{
                                    fill: this.state.tangentSelectedIndex === 0 || this.state.tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA"
                                }}>
                            </circle>
                        </>
                    }
                    {
                        this.props.keyId !== keys.length - 1 &&
                        <>
                            <line
                                x1={0}
                                y1={0}
                                x2={`${this._outVec.x}px`}
                                y2={`${this._outVec.y}px`}
                                style={{
                                    stroke: this.state.tangentSelectedIndex === 1 || this.state.tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA",
                                    strokeWidth: `${1 * this.props.scale}`,
                                    strokeDasharray: isLockedTangent ? "" : "2, 2"
                                }}>
                            </line>                        
                            <circle
                                className="right-tangent"
                                cx={`${this._outVec.x}px`}
                                cy={`${this._outVec.y}px`}
                                r={`${4 * this.props.scale}`}
                                style={{
                                    fill: this.state.tangentSelectedIndex === 1 || this.state.tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA"
                                }}>
                            </circle>
                        </>
                    }
                </g>
            }
        </svg>
        );
    }
}
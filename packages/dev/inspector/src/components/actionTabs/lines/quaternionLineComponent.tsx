import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { Quaternion, Vector3 } from "core/Maths/math.vector";
import { NumericInput } from "shared-ui-components/lines/numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { PropertyChangedEvent } from "../../propertyChangedEvent";
import { Tools } from "core/Misc/tools";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { copyCommandToClipboard, getClassNameWithNamespace } from "shared-ui-components/copyCommandToClipboard";
import copyIcon from "shared-ui-components/imgs/copy.svg";

interface IQuaternionLineComponentProps {
    label: string;
    target: any;
    useEuler?: boolean;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    lockObject: LockObject;
}

export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, { isExpanded: boolean; value: Quaternion; eulerValue: Vector3 }> {
    private _localChange = false;

    constructor(props: IQuaternionLineComponentProps) {
        super(props);

        const quat = this.props.target[this.props.propertyName].clone();

        this.state = { isExpanded: false, value: quat, eulerValue: quat.toEulerAngles() };
    }

    _checkRoundCircle(a: number, b: number) {
        return Math.abs(Tools.ToDegrees(a)) + Math.abs(Tools.ToDegrees(b)) === 360;
    }

    override shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: { isExpanded: boolean; value: Quaternion; eulerValue: Vector3 }) {
        const nextPropsValue = nextProps.target[nextProps.propertyName];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue.clone();
            nextState.eulerValue = nextPropsValue.toEulerAngles();

            // Let's make sure we are not going on the opposite (but correct) value
            if (this._checkRoundCircle(nextState.eulerValue.x, this.state.eulerValue.x)) {
                nextState.eulerValue.x = this.state.eulerValue.x;
            }
            if (this._checkRoundCircle(nextState.eulerValue.y, this.state.eulerValue.y)) {
                nextState.eulerValue.y = this.state.eulerValue.y;
            }
            if (this._checkRoundCircle(nextState.eulerValue.z, this.state.eulerValue.z)) {
                nextState.eulerValue.z = this.state.eulerValue.z;
            }
            this._localChange = false;
            return true;
        }
        return false;
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(currentValue: Quaternion, previousValue: Quaternion) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: currentValue,
            initialValue: previousValue,
        });
    }

    updateQuaternion() {
        const store = this.props.target[this.props.propertyName].clone();
        this.props.target[this.props.propertyName] = this.state.value;

        this.setState({ value: store });

        this.raiseOnPropertyChanged(this.state.value, store);
    }

    updateStateX(value: number) {
        this._localChange = true;

        this.state.value.x = value;
        this.updateQuaternion();
    }

    updateStateY(value: number) {
        this._localChange = true;

        this.state.value.y = value;
        this.updateQuaternion();
    }

    updateStateZ(value: number) {
        this._localChange = true;

        this.state.value.z = value;
        this.updateQuaternion();
    }

    updateStateW(value: number) {
        this._localChange = true;

        this.state.value.w = value;
        this.updateQuaternion();
    }

    updateQuaternionFromEuler() {
        const quat = this.state.eulerValue.toQuaternion();
        this.state.value.x = quat.x;
        this.state.value.y = quat.y;
        this.state.value.z = quat.z;
        this.state.value.w = quat.w;

        this.updateQuaternion();
    }

    updateStateEulerX(value: number) {
        this._localChange = true;

        this.state.eulerValue.x = Tools.ToRadians(value);
        this.updateQuaternionFromEuler();
    }

    updateStateEulerY(value: number) {
        this._localChange = true;

        this.state.eulerValue.y = Tools.ToRadians(value);
        this.updateQuaternionFromEuler();
    }

    updateStateEulerZ(value: number) {
        this._localChange = true;

        this.state.eulerValue.z = Tools.ToRadians(value);
        this.updateQuaternionFromEuler();
    }

    // Copy to clipboard the code this Quaternion actually does
    // Example : cube.rotationQuaternion = new BABYLON.Quaternion(0,0,0,1)// cube as BABYLON.Mesh;
    onCopyClick() {
        if (this.props && this.props.target) {
            const { className, babylonNamespace } = getClassNameWithNamespace(this.props.target);
            const targetName = "globalThis.debugNode";
            const targetProperty = this.props.propertyName;
            const value = this.props.target[this.props.propertyName];
            const strVector = "new " + babylonNamespace + "Quaternion(" + value.x + ", " + value.y + ", " + value.z + ", " + value.w + ")";
            const strCommand = targetName + "." + targetProperty + " = " + strVector + ";// (debugNode as " + babylonNamespace + className + ")";
            copyCommandToClipboard(strCommand);
        } else {
            copyCommandToClipboard("undefined");
        }
    }

    override render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;

        const quat = this.state.value;
        const eulerDegrees = this.state.eulerValue.clone();
        eulerDegrees.x = Tools.ToDegrees(eulerDegrees.x);
        eulerDegrees.y = Tools.ToDegrees(eulerDegrees.y);
        eulerDegrees.z = Tools.ToDegrees(eulerDegrees.z);

        return (
            <div className="vector3Line">
                <div className="firstLine" title={this.props.label + " (Using Quaternion)"}>
                    <div className="label">{this.props.label + " (Using Quaternion)"}</div>
                    <div className="vector">
                        {!this.props.useEuler && `X: ${quat.x.toFixed(1)}, Y: ${quat.y.toFixed(1)}, Z: ${quat.z.toFixed(1)}, W: ${quat.w.toFixed(1)}`}
                        {this.props.useEuler && `X: ${eulerDegrees.x.toFixed(2)}, Y: ${eulerDegrees.y.toFixed(2)}, Z: ${eulerDegrees.z.toFixed(2)}`}
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                    <div className="copy hoverIcon" onClick={() => this.onCopyClick()} title="Copy to clipboard">
                        <img src={copyIcon} alt="Copy" />
                    </div>
                </div>
                {this.state.isExpanded && !this.props.useEuler && (
                    <div className="secondLine">
                        <NumericInput lockObject={this.props.lockObject} label="x" value={quat.x} onChange={(value) => this.updateStateX(value)} />
                        <NumericInput lockObject={this.props.lockObject} label="y" value={quat.y} onChange={(value) => this.updateStateY(value)} />
                        <NumericInput lockObject={this.props.lockObject} label="z" value={quat.z} onChange={(value) => this.updateStateZ(value)} />
                        <NumericInput lockObject={this.props.lockObject} label="w" value={quat.w} onChange={(value) => this.updateStateW(value)} />
                    </div>
                )}
                {this.state.isExpanded && this.props.useEuler && (
                    <div className="secondLine">
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="x"
                            target={eulerDegrees}
                            propertyName="x"
                            onChange={(value) => {
                                this.updateStateEulerX(value);
                            }}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="y"
                            target={eulerDegrees}
                            propertyName="y"
                            onChange={(value) => {
                                this.updateStateEulerY(value);
                            }}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="z"
                            target={eulerDegrees}
                            propertyName="z"
                            onChange={(value) => {
                                this.updateStateEulerZ(value);
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }
}

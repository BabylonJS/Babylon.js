import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Quaternion, Vector3 } from "babylonjs/Maths/math.vector";
import { NumericInputComponent } from "../../../sharedUiComponents/lines/numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { Tools } from 'babylonjs/Misc/tools';
import { FloatLineComponent } from '../../../sharedUiComponents/lines/floatLineComponent';

interface IQuaternionLineComponentProps {
    label: string;
    target: any;
    useEuler?: boolean;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, { isExpanded: boolean, value: Quaternion, eulerValue: Vector3 }> {
    private _localChange = false;

    constructor(props: IQuaternionLineComponentProps) {
        super(props);

        let quat = this.props.target[this.props.propertyName].clone();

        this.state = { isExpanded: false, value: quat, eulerValue: quat.toEulerAngles() }
    }

    _checkRoundCircle(a: number, b: number) {
        return Math.abs(Tools.ToDegrees(a)) + Math.abs(Tools.ToDegrees(b)) === 360
    }

    shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: { isExpanded: boolean, value: Quaternion, eulerValue: Vector3 }) {
        const nextPropsValue = nextProps.target[nextProps.propertyName];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue.clone();
            nextState.eulerValue = nextPropsValue.toEulerAngles();

            // Let's make sure we are not going on the opposite (but correct) value
            if (this. _checkRoundCircle(nextState.eulerValue.x, this.state.eulerValue.x)) {
                nextState.eulerValue.x = this.state.eulerValue.x;
            }
            if (this. _checkRoundCircle(nextState.eulerValue.y, this.state.eulerValue.y)) {
                nextState.eulerValue.y = this.state.eulerValue.y;
            }
            if (this. _checkRoundCircle(nextState.eulerValue.z, this.state.eulerValue.z)) {
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
            initialValue: previousValue
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
        let quat = this.state.eulerValue.toQuaternion();
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

    render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />

        let quat = this.state.value;
        let eulerDegrees = this.state.eulerValue.clone();
        eulerDegrees.x = Tools.ToDegrees(eulerDegrees.x);
        eulerDegrees.y = Tools.ToDegrees(eulerDegrees.y);
        eulerDegrees.z = Tools.ToDegrees(eulerDegrees.z);

        return (
            <div className="vector3Line">
                <div className="firstLine" title={this.props.label + (" (Using Quaternion)")}>
                    <div className="label">
                        {this.props.label + (" (Using Quaternion)")} 
                    </div>
                    <div className="vector">
                        {
                            !this.props.useEuler &&
                            `X: ${quat.x.toFixed(1)}, Y: ${quat.y.toFixed(1)}, Z: ${quat.z.toFixed(1)}, W: ${quat.w.toFixed(1)}`
                        }
                        {
                            this.props.useEuler &&
                            `X: ${eulerDegrees.x.toFixed(2)}, Y: ${eulerDegrees.y.toFixed(2)}, Z: ${eulerDegrees.z.toFixed(2)}`
                        }
                    </div>
                    <div className="expand" onClick={() => this.switchExpandState()}>
                        {chevron}
                    </div>
                </div>
                {
                    this.state.isExpanded && !this.props.useEuler &&
                    <div className="secondLine">
                        <NumericInputComponent label="x" value={quat.x} onChange={value => this.updateStateX(value)} />
                        <NumericInputComponent label="y" value={quat.y} onChange={value => this.updateStateY(value)} />
                        <NumericInputComponent label="z" value={quat.z} onChange={value => this.updateStateZ(value)} />
                        <NumericInputComponent label="w" value={quat.w} onChange={value => this.updateStateW(value)} />
                    </div>
                }
                {
                    this.state.isExpanded && this.props.useEuler &&
                    <div className="secondLine">
                        <FloatLineComponent label="x" target={eulerDegrees} propertyName='x' onChange={value => {this.updateStateEulerX(value)} } />
                        <FloatLineComponent label="y" target={eulerDegrees} propertyName='y' onChange={value => {this.updateStateEulerY(value)} } />
                        <FloatLineComponent label="z" target={eulerDegrees} propertyName='z' onChange={value => {this.updateStateEulerZ(value)} } />
                    </div>
                }
            </div>
        );
    }
}

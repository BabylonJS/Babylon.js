import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Quaternion, Vector3 } from "babylonjs/Maths/math.vector";
import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { Tools } from 'babylonjs/Misc/tools';
import { SliderLineComponent } from './sliderLineComponent';

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

    shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: { isExpanded: boolean, value: Quaternion }) {
        const nextPropsValue = nextProps.target[nextProps.propertyName];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue.clone();
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
        let euler = this.state.eulerValue;

        return (
            <div className="vector3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="vector">
                        {
                            !this.props.useEuler &&
                            `X: ${quat.x.toFixed(1)}, Y: ${quat.y.toFixed(1)}, Z: ${quat.z.toFixed(1)}, W: ${quat.w.toFixed(1)}`
                        }
                        {
                            this.props.useEuler &&
                            `X: ${Tools.ToDegrees(euler.x).toFixed(2)}, Y: ${Tools.ToDegrees(euler.y).toFixed(2)}, Z: ${Tools.ToDegrees(euler.z).toFixed(2)}`
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
                        <SliderLineComponent label="x" minimum={0} maximum={360} step={0.1} directValue={Tools.ToDegrees(euler.x)} onChange={value => this.updateStateEulerX(value)} />
                        <SliderLineComponent label="y" minimum={0} maximum={360} step={0.1} directValue={Tools.ToDegrees(euler.y)} onChange={value => this.updateStateEulerY(value)} />
                        <SliderLineComponent label="z" minimum={0} maximum={360} step={0.1} directValue={Tools.ToDegrees(euler.z)} onChange={value => this.updateStateEulerZ(value)} />
                    </div>
                }
            </div>
        );
    }
}

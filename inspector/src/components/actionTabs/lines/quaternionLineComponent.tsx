import * as React from "react";
import { Observable, Quaternion, Vector3 } from "babylonjs";
import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

interface IQuaternionLineComponentProps {
    label: string,
    target: any,
    propertyName: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class QuaternionLineComponent extends React.Component<IQuaternionLineComponentProps, { isExpanded: boolean, value: Quaternion }> {
    private _localChange = false;
    private _eulerValue: Vector3;

    constructor(props: IQuaternionLineComponentProps) {
        super(props);

        this.state = { isExpanded: false, value: this.props.target[this.props.propertyName] }
    }

    shouldComponentUpdate(nextProps: IQuaternionLineComponentProps, nextState: { isExpanded: boolean, value: Quaternion }) {
        const nextPropsValue = nextProps.target[nextProps.propertyName];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue;
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
        const store = this.state.value.clone();
        const quaternion = this._eulerValue.toQuaternion();
        this.props.target[this.props.propertyName] = quaternion;

        this.setState({ value: quaternion });

        this.raiseOnPropertyChanged(quaternion, store);
    }

    updateStateX(value: number) {
        this._localChange = true;

        this._eulerValue.x = value;
        this.updateQuaternion();
    }

    updateStateY(value: number) {
        this._localChange = true;

        this._eulerValue.y = value;
        this.updateQuaternion();
    }

    updateStateZ(value: number) {
        this._localChange = true;

        this._eulerValue.z = value;
        this.updateQuaternion();
    }

    render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />

        this._eulerValue = this.state.value.toEulerAngles();

        return (
            <div className="vector3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="vector">
                        {`X: ${this._eulerValue.x.toFixed(2)}, Y: ${this._eulerValue.y.toFixed(2)}, Z: ${this._eulerValue.z.toFixed(2)}`}
                    </div>
                    <div className="expand" onClick={() => this.switchExpandState()}>
                        {chevron}
                    </div>
                </div>
                {
                    this.state.isExpanded &&
                    <div className="secondLine">
                        <NumericInputComponent label="x" value={this._eulerValue.x} onChange={value => this.updateStateX(value)} />
                        <NumericInputComponent label="y" value={this._eulerValue.y} onChange={value => this.updateStateY(value)} />
                        <NumericInputComponent label="z" value={this._eulerValue.z} onChange={value => this.updateStateZ(value)} />
                    </div>
                }
            </div>
        );
    }
}

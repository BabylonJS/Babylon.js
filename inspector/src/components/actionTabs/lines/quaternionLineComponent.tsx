import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { Quaternion } from "babylonjs/Maths/math";
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

    render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />

        let quat = this.state.value;

        return (
            <div className="vector3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="vector">
                        {`X: ${quat.x.toFixed(2)}, Y: ${quat.y.toFixed(2)}, Z: ${quat.z.toFixed(2)}, W: ${quat.w.toFixed(2)}`}
                    </div>
                    <div className="expand" onClick={() => this.switchExpandState()}>
                        {chevron}
                    </div>
                </div>
                {
                    this.state.isExpanded &&
                    <div className="secondLine">
                        <NumericInputComponent label="x" value={quat.x} onChange={value => this.updateStateX(value)} />
                        <NumericInputComponent label="y" value={quat.y} onChange={value => this.updateStateY(value)} />
                        <NumericInputComponent label="z" value={quat.z} onChange={value => this.updateStateZ(value)} />
                        <NumericInputComponent label="w" value={quat.w} onChange={value => this.updateStateW(value)} />
                    </div>
                }
            </div>
        );
    }
}

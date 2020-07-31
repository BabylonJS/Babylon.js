import * as React from "react";
import { Vector4 } from "babylonjs/Maths/math.vector";
import { Observable } from "babylonjs/Misc/observable";

import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

interface IVector4LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    step?: number;
    onChange?: (newvalue: Vector4) => void;
    useEuler?: boolean,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class Vector4LineComponent extends React.Component<IVector4LineComponentProps, { isExpanded: boolean, value: Vector4 }> {

    static defaultProps = {
        step: 0.001, // cm
    };

    private _localChange = false;

    constructor(props: IVector4LineComponentProps) {
        super(props);

        this.state = { isExpanded: false, value: this.getCurrentValue().clone() }
    }

    getCurrentValue() {
        return this.props.target[this.props.propertyName];
    }

    shouldComponentUpdate(nextProps: IVector4LineComponentProps, nextState: { isExpanded: boolean, value: Vector4 }) {
        const nextPropsValue = this.getCurrentValue();

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

    raiseOnPropertyChanged(previousValue: Vector4) {
        if (this.props.onChange) {
            this.props.onChange(this.state.value);
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: this.state.value,
            initialValue: previousValue
        });
    }

    updateVector4() {
        const store = this.props.target[this.props.propertyName].clone();
        this.props.target[this.props.propertyName] = this.state.value;

        this.setState({ value: store });

        this.raiseOnPropertyChanged(store);
    }

    updateStateX(value: number) {
        this._localChange = true;

        this.state.value.x = value;
        this.updateVector4();
    }

    updateStateY(value: number) {
        this._localChange = true;

        this.state.value.y = value;
        this.updateVector4();
    }

    updateStateZ(value: number) {
        this._localChange = true;

        this.state.value.z = value;
        this.updateVector4();
    }

    updateStateW(value: number) {
        this._localChange = true;

        this.state.value.w = value;
        this.updateVector4();
    }

    render() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />

        return (
            <div className="vector3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                    <div className="vector">
                        {
                            `X: ${this.state.value.x.toFixed(2)}, Y: ${this.state.value.y.toFixed(2)}, Z: ${this.state.value.z.toFixed(2)}, W: ${this.state.value.w.toFixed(2)}`
                        }
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                </div>
                {
                    <div className="secondLine">
                        <NumericInputComponent label="x" step={this.props.step} value={this.state.value.x} onChange={value => this.updateStateX(value)} />
                        <NumericInputComponent label="y" step={this.props.step} value={this.state.value.y} onChange={value => this.updateStateY(value)} />
                        <NumericInputComponent label="z" step={this.props.step} value={this.state.value.z} onChange={value => this.updateStateZ(value)} />
                        <NumericInputComponent label="w" step={this.props.step} value={this.state.value.w} onChange={value => this.updateStateW(value)} />
                    </div>
                }
            </div>
        );
    }
}

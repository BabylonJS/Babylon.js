import * as React from "react";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Observable } from "babylonjs/Misc/observable";

import { NumericInputComponent } from "./numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

interface IVector2LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    step?: number;
    onChange?: (newvalue: Vector2) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class Vector2LineComponent extends React.Component<IVector2LineComponentProps, { isExpanded: boolean, value: Vector2 }> {

    static defaultProps = {
        step: 0.001, // cm
    };

    private _localChange = false;

    constructor(props: IVector2LineComponentProps) {
        super(props);

        this.state = { isExpanded: false, value: this.props.target[this.props.propertyName].clone() }
    }

    shouldComponentUpdate(nextProps: IVector2LineComponentProps, nextState: { isExpanded: boolean, value: Vector2 }) {
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

    raiseOnPropertyChanged(previousValue: Vector2) {
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

    updateStateX(value: number) {
        this._localChange = true;

        const store = this.state.value.clone();
        this.props.target[this.props.propertyName].x = value;
        this.state.value.x = value;
        this.setState({ value: this.state.value });

        this.raiseOnPropertyChanged(store);
    }

    updateStateY(value: number) {
        this._localChange = true;

        const store = this.state.value.clone();
        this.props.target[this.props.propertyName].y = value;
        this.state.value.y = value;
        this.setState({ value: this.state.value });

        this.raiseOnPropertyChanged(store);
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
                        {`X: ${this.state.value.x.toFixed(2)}, Y: ${this.state.value.y.toFixed(2)}`}

                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                </div>
                {
                    this.state.isExpanded &&
                    <div className="secondLine">
                        <NumericInputComponent label="x" step={this.props.step} value={this.state.value.x} onChange={value => this.updateStateX(value)} />
                        <NumericInputComponent label="y" step={this.props.step} value={this.state.value.y} onChange={value => this.updateStateY(value)} />
                    </div>
                }
            </div>
        );
    }
}

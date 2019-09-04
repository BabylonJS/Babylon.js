import * as React from "react";
import { Vector3, Matrix, Vector4 } from "babylonjs/Maths/math";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { Vector4LineComponent } from './vector4LineComponent';

interface IMatrixLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    step?: number;
    onChange?: (newValue: Matrix) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MatrixLineComponent extends React.Component<IMatrixLineComponentProps, { value: Matrix}> {
   private _localChange = false;

    constructor(props: IMatrixLineComponentProps) {
        super(props);

        let matrix: Matrix = this.props.target[this.props.propertyName].clone();

        this.state = { value:matrix }
    }

    shouldComponentUpdate(nextProps: IMatrixLineComponentProps, nextState: { value: Matrix }) {
        const nextPropsValue = nextProps.target[nextProps.propertyName];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    raiseOnPropertyChanged(previousValue: Vector3) {
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

    updateMatrix() {
        const store = this.props.target[this.props.propertyName].clone();
        this.props.target[this.props.propertyName] = this.state.value;

        this.setState({ value: store });

        this.raiseOnPropertyChanged(store);
    }

    updateRow(value: Vector4, row: number) {
        this._localChange = true;

        this.state.value.setRow(row, value);
        this.updateMatrix();
    }

    render() {
        return (
            <div className="vector3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                </div>
                <div className="secondLine">
                    <Vector4LineComponent label="Row #0" value={this.state.value.getRow(0)!} onChange={value => this.updateRow(value, 0)}/>
                    <Vector4LineComponent label="Row #1" value={this.state.value.getRow(1)!} onChange={value => this.updateRow(value, 1)}/>
                    <Vector4LineComponent label="Row #2" value={this.state.value.getRow(2)!} onChange={value => this.updateRow(value, 2)}/>
                    <Vector4LineComponent label="Row #3" value={this.state.value.getRow(3)!} onChange={value => this.updateRow(value, 3)}/>
                </div>
            </div>
        );
    }
}

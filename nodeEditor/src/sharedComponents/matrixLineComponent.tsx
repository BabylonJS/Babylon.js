import * as React from "react";
import { Vector3, Matrix, Vector4, Quaternion } from "babylonjs/Maths/math.vector";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { Vector4LineComponent } from './vector4LineComponent';
import { OptionsLineComponent } from './optionsLineComponent';
import { SliderLineComponent } from './sliderLineComponent';
import { GlobalState } from '../globalState';

interface IMatrixLineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    step?: number;
    onChange?: (newValue: Matrix) => void;
    onModeChange?: (mode: number) => void;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    mode?: number;
    globalState: GlobalState;
}

export class MatrixLineComponent extends React.Component<IMatrixLineComponentProps, { value: Matrix, mode: number, angle: number}> {
   private _localChange = false;

    constructor(props: IMatrixLineComponentProps) {
        super(props);

        let matrix: Matrix = this.props.target[this.props.propertyName].clone();

        let angle = 0;

        if (this.props.mode) {
            let quat = new Quaternion();
            matrix.decompose(undefined, quat);

            let euler = quat.toEulerAngles();

            switch (this.props.mode) {
                case 1:
                    angle = euler.x;
                    break;
                case 2:
                    angle = euler.y;
                    break;
                case 3:
                    angle = euler.z;
                    break;
            }
        }

        this.state = { value:matrix, mode: this.props.mode || 0, angle: angle };
    }

    shouldComponentUpdate(nextProps: IMatrixLineComponentProps, nextState: { value: Matrix, mode: number, angle: number }) {
        const nextPropsValue = nextProps.target[nextProps.propertyName];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue.clone();
            this._localChange = false;
            return true;
        }
        return nextState.mode !== this.state.mode || nextState.angle !== this.state.angle;
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

    updateBasedOnMode(value: number) {

        switch (this.state.mode) {
            case 1: {
                Matrix.RotationXToRef(this.state.angle, this.state.value);
                break;
            }
            case 2: {
                Matrix.RotationYToRef(this.state.angle, this.state.value);
                break;
            }
            case 3: {
                Matrix.RotationZToRef(this.state.angle, this.state.value);
                break;
            }
        }
        this.updateMatrix();

        this.setState({angle: value});
    }

    render() {
        var modeOptions = [
            { label: "User-defined", value: 0 },
            { label: "Rotation over X axis", value: 1 },
            { label: "Rotation over Y axis", value: 2 },
            { label: "Rotation over Z axis", value: 3 },
        ];

        return (
            <div className="vector3Line">
                <div className="firstLine">
                    <div className="label">
                        {this.props.label}
                    </div>
                </div>
                <div className="secondLine">
                    <OptionsLineComponent label="Mode"
                        className="no-right-margin"
                        options={modeOptions} target={this} 
                        noDirectUpdate={true}
                        getSelection={() => {
                            return this.state.mode;
                        }}
                        onSelect={(value: any) => {
                            this.props.target[this.props.propertyName] = Matrix.Identity();
                            Matrix.IdentityToRef(this.state.value);
                            this.setState({mode: value, angle: 0});
                            
                            this.updateMatrix();

                            if (this.props.onModeChange) {
                                this.props.onModeChange(value);
                            }
                        }} />                
                    </div>
                {
                    this.state.mode === 0 &&
                    <div className="secondLine">
                        <Vector4LineComponent globalState={this.props.globalState} label="Row #0" value={this.state.value.getRow(0)!} onChange={value => this.updateRow(value, 0)}/>
                        <Vector4LineComponent globalState={this.props.globalState} label="Row #1" value={this.state.value.getRow(1)!} onChange={value => this.updateRow(value, 1)}/>
                        <Vector4LineComponent globalState={this.props.globalState} label="Row #2" value={this.state.value.getRow(2)!} onChange={value => this.updateRow(value, 2)}/>
                        <Vector4LineComponent globalState={this.props.globalState} label="Row #3" value={this.state.value.getRow(3)!} onChange={value => this.updateRow(value, 3)}/>
                    </div>
                }
                {
                    this.state.mode !== 0 &&
                    <div className="secondLine">
                        <SliderLineComponent label="Angle" minimum={0} maximum={2 * Math.PI} useEuler={true} step={0.1} directValue={this.state.angle} onChange={value => this.updateBasedOnMode(value)}/>
                    </div>
                }
            </div>
        );
    }
}

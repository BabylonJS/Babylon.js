import * as React from "react";
import { Observable, Color3 } from "babylonjs";
import { PropertyChangedEvent } from "../../propertyChangedEvent";

export interface IColor3LineComponentProps {
    label: string,
    target: any,
    propertyName: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class Color3LineComponent extends React.Component<IColor3LineComponentProps, { color: Color3 }> {
    private _localChange = false;
    constructor(props: IColor3LineComponentProps) {
        super(props);

        this.state = { color: this.props.target[this.props.propertyName].clone() };
    }

    shouldComponentUpdate(nextProps: IColor3LineComponentProps, nextState: { color: Color3 }) {
        const currentState = nextProps.target[nextProps.propertyName];

        if (!currentState.equals(nextState.color) || this._localChange) {
            nextState.color = currentState.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    onChange(newValue: string) {
        this._localChange = true;
        const newColor = BABYLON.Color3.FromHexString(newValue);

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                value: newColor,
                initialValue: this.state.color
            });
        }

        this.props.target[this.props.propertyName] = newColor;

        this.setState({ color: newColor });
    }

    render() {
        return (
            <div className="color3Line">
                <div className="label">
                    {this.props.label}
                </div>
                <div className="color3">
                    <input type="color" value={this.state.color.toHexString()} onChange={(evt) => this.onChange(evt.target.value)} />
                </div>
            </div>
        );
    }
}

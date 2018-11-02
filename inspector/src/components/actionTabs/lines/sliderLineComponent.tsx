import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../propertyChangedEvent";
import { Slider } from 'office-ui-fabric-react/lib/Slider';

interface ISliderLineComponentProps {
    label: string,
    target: any,
    propertyName: string,
    minimum: number,
    maximum: number,
    step: number,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SliderLineComponent extends React.Component<ISliderLineComponentProps, { value: number }> {
    private _localChange = false;
    constructor(props: ISliderLineComponentProps) {
        super(props);

        this.state = { value: this.props.target[this.props.propertyName] };
    }

    shouldComponentUpdate(nextProps: ISliderLineComponentProps, nextState: { value: number }) {
        const currentState = nextProps.target[nextProps.propertyName];

        if (currentState !== nextState.value || this._localChange) {
            nextState.value = currentState;
            this._localChange = false;
            return true;
        }
        return false;
    }

    onChange(newValue: any) {
        this._localChange = true;

        if (this.props.onPropertyChangedObservable) {
            this.props.onPropertyChangedObservable.notifyObservers({
                object: this.props.target,
                property: this.props.propertyName,
                value: newValue,
                initialValue: this.state.value
            });
        }

        this.props.target[this.props.propertyName] = newValue;

        this.setState({ value: newValue });
    }

    render() {
        return (
            <div className="sliderLine">
                <div className="label">
                    {this.props.label}
                </div>

                <div className="slider-value">
                    {this.state.value.toFixed(2)}
                </div>
                <Slider
                    className="slider"
                    label=""
                    min={this.props.minimum}
                    max={this.props.maximum}
                    step={this.props.step}
                    defaultValue={this.state.value}
                    showValue={false}
                    onChange={(value: any) => this.onChange(value)}
                />
            </div>
        );
    }
}

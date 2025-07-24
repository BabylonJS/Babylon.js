/* eslint-disable jsdoc/require-jsdoc */
import { Component } from "react";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent.js";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent.js";
import type { Nullable } from "core/types.js";

export interface IFloatSliderComponentProps {
    lockObject: any;
    label: string;
    target: any;
    propertyName: string;
    min: Nullable<number>;
    max: Nullable<number>;
    onChange: () => void;
    forceSliderOff?: boolean;
}

/**
 * A simple float slider component
 */
export class FloatSliderComponent extends Component<IFloatSliderComponentProps> {
    // eslint-disable-next-line babylonjs/available
    constructor(props: IFloatSliderComponentProps) {
        super(props);
        this.state = { displaySlider: false };
    }

    /**
     * Trigger update when props change
     * @param prevProps - The previous props
     */
    override componentDidUpdate(prevProps: IFloatSliderComponentProps) {
        if (prevProps !== this.props) {
            this.forceUpdate();
        }
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        const canUseSlider = !this.props.forceSliderOff && this.props.min !== null && this.props.max !== null && this.props.min < this.props.max;

        // Ensure the value is within the min/max range
        if (canUseSlider) {
            this.props.target[this.props.propertyName] = Math.max(this.props.min, Math.min(this.props.max, this.props.target[this.props.propertyName]));
        }

        return (
            <>
                {!canUseSlider && (
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label={this.props.label}
                        target={this.props.target}
                        propertyName={this.props.propertyName}
                        onChange={() => {
                            this.props.onChange();
                        }}
                    ></FloatLineComponent>
                )}
                {canUseSlider && (
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label={this.props.label}
                        target={this.props.target}
                        propertyName={this.props.propertyName}
                        step={Math.abs(this.props.max - this.props.min) / 100.0}
                        minimum={this.props.min}
                        maximum={this.props.max}
                        onChange={() => {
                            this.props.onChange();
                        }}
                    ></SliderLineComponent>
                )}
            </>
        );
    }
}

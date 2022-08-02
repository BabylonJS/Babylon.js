import * as React from "react";
import { Color3 } from "core/Maths/math.color";
import type { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";
import deleteButton from "../../imgs/delete.svg";
import copyIcon from "../../sharedComponents/copy.svg";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { ColorPickerLineComponent } from "shared-ui-components/lines/colorPickerComponent";

interface IGradientStepComponentProps {
    stateManager: StateManager;
    step: GradientBlockColorStep;
    lineIndex: number;
    onDelete: () => void;
    onUpdateStep: () => void;
    onCheckForReOrder: () => void;
    onCopy?: () => void;
}

export class GradientStepComponent extends React.Component<IGradientStepComponentProps, { gradient: number }> {
    constructor(props: IGradientStepComponentProps) {
        super(props);

        this.state = { gradient: props.step.step };
    }

    updateColor(color: string) {
        this.props.step.color = Color3.FromHexString(color);

        this.props.onUpdateStep();
        this.forceUpdate();
    }

    updateStep(gradient: number) {
        this.props.step.step = gradient;

        this.setState({ gradient: gradient });

        this.props.onUpdateStep();
    }

    onPointerUp() {
        this.props.onCheckForReOrder();
    }

    render() {
        const step = this.props.step;

        return (
            <div className="gradient-step">
                <div className="step">{`#${this.props.lineIndex}`}</div>
                <div className="color">
                    <ColorPickerLineComponent
                        lockObject={this.props.stateManager.lockObject}
                        value={step.color}
                        onColorChanged={(color) => {
                            this.updateColor(color);
                        }}
                    />
                </div>
                <div className="step-value">
                    <FloatLineComponent
                        lockObject={this.props.stateManager.lockObject}
                        smallUI={true}
                        label=""
                        target={step}
                        propertyName="step"
                        min={0}
                        max={1}
                        onEnter={() => {
                            this.props.onUpdateStep();
                            this.props.onCheckForReOrder();
                            this.forceUpdate();
                        }}
                    ></FloatLineComponent>
                </div>
                <div className="step-slider">
                    <input
                        className="range"
                        type="range"
                        step={0.01}
                        min={0}
                        max={1.0}
                        value={step.step}
                        onPointerUp={() => this.onPointerUp()}
                        onChange={(evt) => this.updateStep(parseFloat(evt.target.value))}
                    />
                </div>
                <div
                    className="gradient-copy"
                    onClick={() => {
                        if (this.props.onCopy) this.props.onCopy();
                    }}
                    title="Copy Step"
                >
                    <img className="img" src={copyIcon} />
                </div>
                <div className="gradient-delete" onClick={() => this.props.onDelete()} title={"Delete Step"}>
                    <img className="img" src={deleteButton} />
                </div>
            </div>
        );
    }
}

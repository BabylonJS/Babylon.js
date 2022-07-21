import * as React from "react";
import type { GlobalState } from "../../globalState";
import { Color3 } from "core/Maths/math.color";
import type { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";
import { ColorPickerLineComponent } from "shared-ui-components/lines/colorPickerComponent";

import deleteButton from "../lines/delete.svg";
import copyIcon from "../lines/copyStep.svg";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

interface IGradientStepComponentProps {
    globalState: GlobalState;
    step: GradientBlockColorStep;
    lineIndex: number;
    lockObject?: LockObject;
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
                        lockObject={this.props.lockObject}
                        value={step.color}
                        onColorChanged={(color) => {
                            this.updateColor(color);
                        }}
                    />
                </div>
                <div className="step-value">{step.step.toFixed(2)}</div>
                <div className="step-slider slider">
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

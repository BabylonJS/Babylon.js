import * as React from "react";
import type { GradientBlock } from "core/Materials/Node/Blocks/gradientBlock";
import { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";
import { GradientStepComponent } from "./gradientStepComponent";
import { Color3 } from "core/Maths/math.color";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { IPropertyComponentProps } from "./propertyComponentProps";

export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _gradientBlock: GradientBlock;
    constructor(props: IPropertyComponentProps) {
        super(props);
        this._gradientBlock = this.props.block as GradientBlock;
    }

    forceRebuild() {
        this._gradientBlock.colorStepsUpdated();
        this.forceUpdate();
    }

    deleteStep(step: GradientBlockColorStep) {
        const index = this._gradientBlock.colorSteps.indexOf(step);

        if (index > -1) {
            this._gradientBlock.colorSteps.splice(index, 1);
            this.forceRebuild();
        }
    }

    copyStep(step: GradientBlockColorStep) {
        const gradientBlock = this.props.block as GradientBlock;

        const newStep = new GradientBlockColorStep(1.0, step.color);
        gradientBlock.colorSteps.push(newStep);
        gradientBlock.colorStepsUpdated();
        this.forceRebuild();
        this.forceUpdate();
    }

    addNewStep() {
        const newStep = new GradientBlockColorStep(1.0, Color3.White());
        this._gradientBlock.colorSteps.push(newStep);
        this.forceRebuild();
    }

    checkForReOrder() {
        this._gradientBlock.colorSteps.sort((a, b) => {
            return a.step - b.step;
        });
        this.forceRebuild();
    }

    render() {
        return (
            <div>
                <ButtonLineComponent label="Add new step" onClick={() => this.addNewStep()} />
                {this._gradientBlock.colorSteps.map((c, i) => {
                    return (
                        <GradientStepComponent
                            globalState={this.props.globalState}
                            onCheckForReOrder={() => this.checkForReOrder()}
                            onUpdateStep={() => this.forceRebuild()}
                            key={"step-" + i}
                            lineIndex={i}
                            step={c}
                            onCopy={() => this.copyStep(c)}
                            onDelete={() => this.deleteStep(c)}
                        />
                    );
                })}
            </div>
        );
    }
}


import * as React from "react";
import { GradientBlockColorStep, GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { GradientStepComponent } from './gradientStepComponent';
import { Color3 } from 'babylonjs/Maths/math.color';
import { ButtonLineComponent } from '../lines/buttonLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';

export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    forceRebuild() {
        let gradientBlock = this.props.block as GradientBlock;
        gradientBlock.colorStepsUpdated();
        this.forceUpdate();
    }

    deleteStep(step: GradientBlockColorStep) {
        let gradientBlock = this.props.block as GradientBlock;

        let index = gradientBlock.colorSteps.indexOf(step);

        if (index > -1) {
            gradientBlock.colorSteps.splice(index, 1);
            this.forceRebuild();
            this.forceUpdate();
        }
    }

    addNewStep() {
        let gradientBlock = this.props.block as GradientBlock;
        let newStep = new GradientBlockColorStep(gradientBlock, 1.0, Color3.White());
        gradientBlock.colorSteps.push(newStep);
        this.forceRebuild();
    }

    checkForReOrder() {
        let gradientBlock = this.props.block as GradientBlock;
        gradientBlock.colorSteps.sort((a, b) => {
            if (a.step === b.step) {
                return 0;
            }

            if (a.step > b.step) {
                return 1;
            }

            return -1;
        });

        this.forceUpdate();
    }

    render() {
        let gradientBlock = this.props.block as GradientBlock;

        return (
            <div>
               
                <ButtonLineComponent label="Add new step" onClick={() => this.addNewStep()} />
                {
                    gradientBlock.colorSteps.map((c, i) => {
                        return (
                            <GradientStepComponent globalState={this.props.globalState} 
                            onCheckForReOrder={() => this.checkForReOrder()}
                            onUpdateStep={() => this.forceRebuild()}
                            key={"step-" + i} lineIndex={i} step={c} onDelete={() => this.deleteStep(c)}/>
                        )
                    })
                    }
            </div>
        );
    }
}
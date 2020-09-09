
import * as React from "react";
import { GradientBlockColorStep, GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { GradientStepComponent } from './gradientStepComponent';
import { Color3 } from 'babylonjs/Maths/math.color';
import { ButtonLineComponent } from '../lines/buttonLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';

export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    private _gradientBlock: GradientBlock;
    constructor(props: IPropertyComponentProps) {
        super(props)
        this._gradientBlock =  this.props.block as GradientBlock;
    }

    forceRebuild() {
        this._gradientBlock.colorStepsUpdated();
        this.forceUpdate();
    }

    deleteStep(step: GradientBlockColorStep) {
        let index =  this._gradientBlock.colorSteps.indexOf(step);

        if (index > -1) {
            this._gradientBlock.colorSteps.splice(index, 1);
            this.forceRebuild();
        }
    }

    addNewStep() {
        let newStep = new GradientBlockColorStep(1.0, Color3.White());
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
                {
                     this._gradientBlock.colorSteps.map((c, i) => {
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
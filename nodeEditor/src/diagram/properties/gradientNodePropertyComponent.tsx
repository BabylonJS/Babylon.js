
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GradientBlockColorStep, GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { GradientStepComponent } from './gradientStepComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { Color3 } from 'babylonjs/Maths/math.color';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GenericPropertyTabComponent } from './genericNodePropertyComponent';

export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
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

        let newStep = new GradientBlockColorStep(1.0, Color3.White());
        gradientBlock.colorSteps.push(newStep);

        this.forceRebuild();
        this.forceUpdate();
    }

    render() {
        let gradientBlock = this.props.block as GradientBlock;
      
        return (
            <div>
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="STEPS">
                    <ButtonLineComponent label="Add new step" onClick={() => this.addNewStep()} />
                    {
                        gradientBlock.colorSteps.map((c, i) => {
                            return (
                                <GradientStepComponent globalState={this.props.globalState} 
                                onUpdateStep={() => this.forceRebuild()}
                                key={c.step} lineIndex={i} step={c} onDelete={() => this.deleteStep(c)}/>
                            )
                        })
                    }
                </LineContainerComponent>
            </div>
        );
    }
}

import * as React from "react";
import { GlobalState } from '../../../globalState';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { GradientNodeModel } from './gradientNodeModel';
import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { GradientStepComponent } from './gradientStepComponent';
import { ButtonLineComponent } from '../../../sharedComponents/buttonLineComponent';
import { Color3 } from 'babylonjs/Maths/math.color';

interface IGradientPropertyTabComponentProps {
    globalState: GlobalState;
    gradientNode: GradientNodeModel;
}

export class GradientPropertyTabComponentProps extends React.Component<IGradientPropertyTabComponentProps> {

    constructor(props: IGradientPropertyTabComponentProps) {
        super(props)
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
    }

    deleteStep(step: GradientBlockColorStep) {
        let gradientBlock = this.props.gradientNode.gradientBlock;

        let index = gradientBlock.colorSteps.indexOf(step);

        if (index > -1) {
            gradientBlock.colorSteps.splice(index, 1);
            this.forceRebuild();
            this.forceUpdate();
        }
    }

    addNewStep() {
        let gradientBlock = this.props.gradientNode.gradientBlock;

        let newStep = new GradientBlockColorStep(1.0, Color3.White());
        gradientBlock.colorSteps.push(newStep);

        this.forceRebuild();
        this.forceUpdate();
    }

    render() {
        let gradientBlock = this.props.gradientNode.gradientBlock;
      
        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={gradientBlock} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    <TextLineComponent label="Type" value={gradientBlock.getClassName()} />
                </LineContainerComponent>
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

import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GradientBlockColorStep, GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { GradientStepComponent } from './gradientStepComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { Color3 } from 'babylonjs/Maths/math.color';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';

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

        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        this.forceUpdate();
    }

    render() {
        let gradientBlock = this.props.block as GradientBlock;
      
        var typeOptions = [
            { label: "None", value: 0 },
            { label: "Visible in the inspector", value: 1 },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                <OptionsLineComponent label="Type" options={typeOptions} target={this.props.block} 
                            noDirectUpdate={true}
                            getSelection={(block) => {
                                if (block.visibleInInspector) {
                                    return 1;
                                }

                                if (block.isConstant) {
                                    return 2;
                                }

                                return 0;
                            }}
                            onSelect={(value: any) => {
                                switch (value) {
                                    case 0:
                                        this.props.block.visibleInInspector = false;
                                        break;
                                    case 1:
                                        this.props.block.visibleInInspector = true;
                                        break;
                                }
                                this.forceUpdate();
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            }} />                        
                </LineContainerComponent>
                <LineContainerComponent title="STEPS">
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
                </LineContainerComponent>
            </div>
        );
    }
}
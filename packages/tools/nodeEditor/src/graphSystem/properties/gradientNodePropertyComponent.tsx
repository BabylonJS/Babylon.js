import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { GradientBlock } from "core/Materials/Node/Blocks/gradientBlock";
import { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";
import { GradientStepComponent } from "./gradientStepComponent";
import { ButtonLineComponent } from "../../sharedComponents/buttonLineComponent";
import { Color3 } from "core/Maths/math.color";
import type { IPropertyComponentProps } from "../../../../../dev/sharedUiComponents/src/nodeGraphSystem/interfaces/propertyComponentProps";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { OptionsLineComponent } from "../../sharedComponents/optionsLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";

export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<GradientBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    componentDidMount() {
        const gradientBlock = this.props.data as GradientBlock;
        this._onValueChangedObserver = gradientBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.globalState.onUpdateRequiredObservable.notifyObservers(gradientBlock);
        });
    }

    componentWillUnmount() {
        const gradientBlock = this.props.data as GradientBlock;
        if (this._onValueChangedObserver) {
            gradientBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    forceRebuild() {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.data as GradientBlock);
        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
    }

    deleteStep(step: GradientBlockColorStep) {
        const gradientBlock = this.props.data as GradientBlock;

        const index = gradientBlock.colorSteps.indexOf(step);

        if (index > -1) {
            gradientBlock.colorSteps.splice(index, 1);
            gradientBlock.colorStepsUpdated();
            this.forceRebuild();
            this.forceUpdate();
        }
    }

    copyStep(step: GradientBlockColorStep) {
        const gradientBlock = this.props.data as GradientBlock;

        const newStep = new GradientBlockColorStep(1.0, step.color);
        gradientBlock.colorSteps.push(newStep);
        gradientBlock.colorStepsUpdated();
        this.forceRebuild();
        this.forceUpdate();
    }

    addNewStep() {
        const gradientBlock = this.props.data as GradientBlock;

        const newStep = new GradientBlockColorStep(1.0, Color3.White());
        gradientBlock.colorSteps.push(newStep);
        gradientBlock.colorStepsUpdated();

        this.forceRebuild();
        this.forceUpdate();
    }

    checkForReOrder() {
        const gradientBlock = this.props.data as GradientBlock;
        gradientBlock.colorSteps.sort((a, b) => {
            if (a.step === b.step) {
                return 0;
            }

            if (a.step > b.step) {
                return 1;
            }

            return -1;
        });
        gradientBlock.colorStepsUpdated();

        this.props.globalState.onUpdateRequiredObservable.notifyObservers(gradientBlock);
        this.forceUpdate();
    }

    render() {
        const gradientBlock = this.props.data as GradientBlock;

        const typeOptions = [
            { label: "None", value: 0 },
            { label: "Visible in the inspector", value: 1 },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} globalState={this.props.globalState} data={this.props.data} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent
                        label="Type"
                        options={typeOptions}
                        target={gradientBlock}
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
                                    gradientBlock.visibleInInspector = false;
                                    break;
                                case 1:
                                    gradientBlock.visibleInInspector = true;
                                    break;
                            }
                            this.forceUpdate();
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(gradientBlock);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        }}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="STEPS">
                    <ButtonLineComponent label="Add new step" onClick={() => this.addNewStep()} />
                    {gradientBlock.colorSteps.map((c, i) => {
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
                </LineContainerComponent>
            </div>
        );
    }
}

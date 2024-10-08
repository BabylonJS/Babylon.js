import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { GradientBlock } from "core/Materials/Node/Blocks/gradientBlock";
import { GradientBlockColorStep } from "core/Materials/Node/Blocks/gradientBlock";
import { GradientStepComponent } from "./gradientStepComponent";
import { Color3 } from "core/Maths/math.color";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

export class GradientPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<GradientBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        const gradientBlock = this.props.nodeData.data as GradientBlock;
        this._onValueChangedObserver = gradientBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(gradientBlock);
        });
    }

    override componentWillUnmount() {
        const gradientBlock = this.props.nodeData.data as GradientBlock;
        if (this._onValueChangedObserver) {
            gradientBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    forceRebuild() {
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.nodeData.data as GradientBlock);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    deleteStep(step: GradientBlockColorStep) {
        const gradientBlock = this.props.nodeData.data as GradientBlock;

        const index = gradientBlock.colorSteps.indexOf(step);

        if (index > -1) {
            gradientBlock.colorSteps.splice(index, 1);
            gradientBlock.colorStepsUpdated();
            this.forceRebuild();
            this.forceUpdate();
        }
    }

    copyStep(step: GradientBlockColorStep) {
        const gradientBlock = this.props.nodeData.data as GradientBlock;

        const newStep = new GradientBlockColorStep(1.0, step.color);
        gradientBlock.colorSteps.push(newStep);
        gradientBlock.colorStepsUpdated();
        this.forceRebuild();
        this.forceUpdate();
    }

    addNewStep() {
        const gradientBlock = this.props.nodeData.data as GradientBlock;

        const newStep = new GradientBlockColorStep(1.0, Color3.White());
        gradientBlock.colorSteps.push(newStep);
        gradientBlock.colorStepsUpdated();

        this.forceRebuild();
        this.forceUpdate();
    }

    checkForReOrder() {
        const gradientBlock = this.props.nodeData.data as GradientBlock;
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

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(gradientBlock);
        this.forceUpdate();
    }

    override render() {
        const gradientBlock = this.props.nodeData.data as GradientBlock;

        const typeOptions = [
            { label: "None", value: 0 },
            { label: "Visible in the inspector", value: 1 },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLine
                        label="Type"
                        options={typeOptions}
                        target={gradientBlock}
                        noDirectUpdate={true}
                        extractValue={(block: InputBlock) => {
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
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(gradientBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                        propertyName={""}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="STEPS">
                    <ButtonLineComponent label="Add new step" onClick={() => this.addNewStep()} />
                    {gradientBlock.colorSteps.map((c, i) => {
                        return (
                            <GradientStepComponent
                                stateManager={this.props.stateManager}
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

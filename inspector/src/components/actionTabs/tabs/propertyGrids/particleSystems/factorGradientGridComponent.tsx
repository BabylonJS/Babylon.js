import * as React from "react";
import { Observable } from 'babylonjs/Misc/observable';
import { PropertyChangedEvent } from '../../../../propertyChangedEvent';
import { GlobalState } from '../../../../globalState';
import { FactorGradient } from 'babylonjs/Misc/gradients';
import { LockObject } from '../lockObject';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { FactorGradientStepGridComponent } from './factorGradientStepGridComponent';
import { Nullable } from 'babylonjs/types';

interface IFactorGradientGridComponent {
    globalState: GlobalState;
    label: string;
    gradients: Nullable<Array<FactorGradient>>,
    lockObject: LockObject,
    replaySourceReplacement?: string,
    onCreateRequired: () => void,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class FactorGradientGridComponent extends React.Component<IFactorGradientGridComponent> {

    constructor(props: IFactorGradientGridComponent) {
        super(props)
    }

    deleteStep(step: FactorGradient) {
        let gradients = this.props.gradients as Array<FactorGradient>;

        let index = gradients.indexOf(step);

        if (index > -1) {
            gradients.splice(index, 1);
            this.forceUpdate();
        }
    }

    addNewStep() {
        let gradients = this.props.gradients as Array<FactorGradient>;

        let newStep = new FactorGradient();
        newStep.gradient = 1.0;
        newStep.factor1 = 0.0;
        newStep.factor2 = 1.0;

        gradients.push(newStep);

        this.forceUpdate();
    }

    checkForReOrder() {
        let gradients = this.props.gradients as Array<FactorGradient>;
        gradients.sort((a, b) => {
            if (a.gradient === b.gradient) {
                return 0;
            }

            if (a.gradient > b.gradient) {
                return 1;
            }

            return -1;
        });

        this.forceUpdate();
    }

    render() {
        let gradients = this.props.gradients as Nullable<Array<FactorGradient>>;
      
        return (
            <div>
                {
                    gradients &&
                    <div className="gradient-container">
                        <div className="gradient-label">{this.props.label}</div>
                        <ButtonLineComponent label="Add new step" onClick={() => this.addNewStep()} />
                        {
                            gradients.map((g, i) => {
                                return (
                                    <FactorGradientStepGridComponent globalState={this.props.globalState} 
                                    lockObject={this.props.lockObject}
                                    onCheckForReOrder={() => this.checkForReOrder()}
                                    onUpdateGradient={() => this.forceUpdate()}
                                    key={"step-" + i} lineIndex={i} gradient={g} onDelete={() => this.deleteStep(g)}/>
                                )
                            })
                        }
                    </div>
                }
                {
                    !gradients &&                    
                    <ButtonLineComponent label={"Use " + this.props.label} onClick={() => {
                        this.props.onCreateRequired();
                        this.forceUpdate();
                    }} />
                }
            </div>
        );
    }
}
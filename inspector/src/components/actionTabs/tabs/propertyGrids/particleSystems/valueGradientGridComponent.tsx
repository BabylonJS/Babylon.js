import * as React from "react";
import { GlobalState } from '../../../../globalState';
import { IValueGradient, FactorGradient, ColorGradient, Color3Gradient } from 'babylonjs/Misc/gradients';
import { LockObject } from '../lockObject';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { FactorGradientStepGridComponent } from './factorGradientStepGridComponent';
import { Nullable } from 'babylonjs/types';
import { ColorGradientStepGridComponent } from './colorGradientStepGridComponent';
import { Color4, Color3 } from 'babylonjs/Maths/math.color';
import { LinkButtonComponent } from '../../../lines/linkButtonComponent';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

export enum GradientGridMode {
    Factor,
    Color3,
    Color4
}

interface IValueGradientGridComponent {
    globalState: GlobalState;
    label: string;
    gradients: Nullable<Array<IValueGradient>>,
    lockObject: LockObject,
    docLink?: string,
    mode: GradientGridMode,
    host: IParticleSystem,
    codeRecorderPropertyName: string,
    onCreateRequired: () => void
}

export class ValueGradientGridComponent extends React.Component<IValueGradientGridComponent> {

    constructor(props: IValueGradientGridComponent) {
        super(props)
    }

    deleteStep(step: IValueGradient) {
        let gradients = this.props.gradients as Array<IValueGradient>;

        let index = gradients.indexOf(step);

        if (index > -1) {
            gradients.splice(index, 1);
            this.updateAndSync();

            this.props.globalState.onCodeChangedObservable.notifyObservers({
                object: this.props.host,
                code: `TARGET.${this.props.codeRecorderPropertyName}.splice(${index}, 1);`
            });
        }
    }

    addNewStep() {
        let gradients = this.props.gradients as Array<IValueGradient>;

        switch(this.props.mode) {
            case GradientGridMode.Factor:
                let newStep = new FactorGradient(1, 1, 1);
                gradients.push(newStep);
                this.props.globalState.onCodeChangedObservable.notifyObservers({
                    object: this.props.host,
                    code: `TARGET.${this.props.codeRecorderPropertyName}.push(new BABYLON.FactorGradient(1, 1, 1));`
                });
                break;
            case GradientGridMode.Color4:
                let newStepColor = new ColorGradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1));
                gradients.push(newStepColor);
                this.props.globalState.onCodeChangedObservable.notifyObservers({
                    object: this.props.host,
                    code: `TARGET.${this.props.codeRecorderPropertyName}.push(new BABYLON.ColorGradient(1, new BABYLON.Color4(1, 1, 1, 1), new BABYLON.Color4(1, 1, 1, 1)));`
                });
                break;    
            case GradientGridMode.Color3:
                let newStepColor3 = new Color3Gradient(1, Color3.White());
                gradients.push(newStepColor3);
                this.props.globalState.onCodeChangedObservable.notifyObservers({
                    object: this.props.host,
                    code: `TARGET.${this.props.codeRecorderPropertyName}.push(new BABYLON.Color3Gradient(1, BABYLON.Color3.White()));`
                });
                break;              
        }

        this.props.host.forceRefreshGradients();

        this.forceUpdate();
    }

    checkForReOrder() {
        let gradients = this.props.gradients as Array<IValueGradient>;
        gradients.sort((a, b) => {
            if (a.gradient === b.gradient) {
                return 0;
            }

            if (a.gradient > b.gradient) {
                return 1;
            }

            return -1;
        });

        this.props.globalState.onCodeChangedObservable.notifyObservers({
            object: this.props.host,
            code: `TARGET.${this.props.codeRecorderPropertyName}.sort((a, b) => {
                if (a.gradient === b.gradient) {
                    return 0;
                }
    
                if (a.gradient > b.gradient) {
                    return 1;
                }
    
                return -1;
            });`
        });        

        this.forceUpdate();
    }

    updateAndSync() {
        this.props.host.forceRefreshGradients();
        
        this.forceUpdate();         
    }

    render() {
        let gradients = this.props.gradients as Nullable<Array<IValueGradient>>;
      
        return (
            <div>
                {
                    gradients && gradients.length > 0 &&
                    <div className="gradient-container">
                        <LinkButtonComponent label={this.props.label} url={this.props.docLink} 
                            icon={faTrash}
                            onIconClick={() => {
                                gradients!.length = 0;
                                this.updateAndSync();
                    
                                this.props.globalState.onCodeChangedObservable.notifyObservers({
                                    object: this.props.host,
                                    code: `TARGET.${this.props.codeRecorderPropertyName}.length = 0;`
                                });
                            }}
                            buttonLabel="Add new step" onClick={() => this.addNewStep()} />
                        {
                            gradients.map((g, i) => {
                                let codeRecorderPropertyName = this.props.codeRecorderPropertyName + `[${i}]`;
                                switch(this.props.mode) {
                                    case GradientGridMode.Factor:
                                        return (
                                            <FactorGradientStepGridComponent globalState={this.props.globalState} 
                                                lockObject={this.props.lockObject}
                                                onCheckForReOrder={() => this.checkForReOrder()}
                                                onUpdateGradient={() => this.updateAndSync()}
                                                host={this.props.host}
                                                codeRecorderPropertyName={codeRecorderPropertyName}
                                                key={"step-" + i} lineIndex={i} gradient={g as FactorGradient} onDelete={() => this.deleteStep(g)}/>
                                        );
                                    case GradientGridMode.Color4:
                                        return (
                                            <ColorGradientStepGridComponent globalState={this.props.globalState} 
                                                host={this.props.host}
                                                codeRecorderPropertyName={codeRecorderPropertyName}
                                                lockObject={this.props.lockObject}
                                                isColor3={false}
                                                onCheckForReOrder={() => this.checkForReOrder()}
                                                onUpdateGradient={() => this.updateAndSync()}
                                                key={"step-" + i} lineIndex={i} gradient={g as ColorGradient} onDelete={() => this.deleteStep(g)}/>
                                        );   
                                    case GradientGridMode.Color3:
                                        return (
                                            <ColorGradientStepGridComponent globalState={this.props.globalState} 
                                                host={this.props.host}
                                                codeRecorderPropertyName={codeRecorderPropertyName}
                                                lockObject={this.props.lockObject}
                                                isColor3={true}
                                                onCheckForReOrder={() => this.checkForReOrder()}
                                                onUpdateGradient={() => this.updateAndSync()}
                                                key={"step-" + i} lineIndex={i} gradient={g as Color3Gradient} onDelete={() => this.deleteStep(g)}/>
                                        );                                      
                                }
                            })
                        }
                    </div>
                }
                {
                    (!gradients || gradients.length === 0) &&                    
                    <ButtonLineComponent label={"Use " + this.props.label} onClick={() => {
                        this.props.onCreateRequired();
                        this.forceUpdate();
                    }} />
                }
            </div>
        );
    }
}
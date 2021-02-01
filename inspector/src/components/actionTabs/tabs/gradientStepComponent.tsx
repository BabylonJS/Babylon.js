import * as React from 'react';
import { GlobalState } from '../../globalState';
import { Color3 } from 'babylonjs/Maths/math.color';
import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { ColorPickerLineComponent } from '../../../sharedUiComponents/lines/colorPickerComponent';

const deleteButton = require('../lines/delete.svg');
const copyIcon = require('../lines/copyStep.svg');

interface IGradientStepComponentProps {
    globalState: GlobalState;
    step: GradientBlockColorStep;
    lineIndex: number;
    onDelete: () => void;
    onUpdateStep: () => void;
    onCheckForReOrder: () => void;
    onCopy?: () => void;
}

export class GradientStepComponent extends React.Component<IGradientStepComponentProps, {gradient: number}> {

    constructor(props: IGradientStepComponentProps) {
        super(props);

        this.state={gradient: props.step.step};
    }

    updateColor(color: string) {
        this.props.step.color = Color3.FromHexString(color);
        
        this.props.onUpdateStep();
        this.forceUpdate();
    }    
    
    updateStep(gradient: number) {
        this.props.step.step = gradient;

        this.setState({gradient: gradient});

        this.props.onUpdateStep();
    }

    onPointerUp() {
        this.props.onCheckForReOrder();
    }

    render() {
        let step = this.props.step;

        return (
            <div className="gradient-step">
                <div className="step">
                    {`#${this.props.lineIndex}`}
                </div>
                <div className="color">
                    <ColorPickerLineComponent value={step.color}
                            onColorChanged={color => {
                                    this.updateColor(color);
                            }} 
                    />  
                </div>
                <div className="step-value">
                    {step.step.toFixed(2)}
                </div>
                <div className="step-slider slider">
                    <input className="range" type="range" step={0.01} min={0} max={1.0} value={step.step}
                        onPointerUp={evt => this.onPointerUp()}
                        onChange={evt => this.updateStep(parseFloat(evt.target.value))} />
                </div>
                <div className="gradient-copy" onClick={() => {if(this.props.onCopy) this.props.onCopy()}} title="Copy Step">
                    <img className="img" src={copyIcon} />
                </div>
                <div className="gradient-delete" onClick={() => this.props.onDelete()} title={"Delete Step"}>
                    <img className="img" src={deleteButton}/>
                </div>
            </div>
        )
    }
}
import * as React from 'react';
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Color3 } from 'babylonjs/Maths/math.color';
import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';
import { ColorPickerLineComponent } from '../../sharedComponents/colorPickerComponent';

interface IGradientStepComponentProps {
    globalState: GlobalState;
    step: GradientBlockColorStep;
    lineIndex: number;
    onDelete: () => void;
    onUpdateStep: () => void;
    onCheckForReOrder: () => void;
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
                    <ColorPickerLineComponent value={step.color} disableAlpha={true} globalState={this.props.globalState} 
                            onColorChanged={color => {
                                    this.updateColor(color);
                            }} 
                    />  
                </div>
                <div className="step-value">
                    {step.step.toFixed(2)}
                </div>
                <div className="step-slider">
                    <input className="range" type="range" step={0.01} min={0} max={1.0} value={step.step}
                        onPointerUp={evt => this.onPointerUp()}
                        onChange={evt => this.updateStep(parseFloat(evt.target.value))} />
                </div>
                <div className="gradient-delete" onClick={() => this.props.onDelete()}>
                    <FontAwesomeIcon icon={faTrash} />
                </div>
            </div>
        )
    }
}
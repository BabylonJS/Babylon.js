import * as React from 'react';
import { GlobalState } from '../../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Color3 } from 'babylonjs/Maths/math.color';
import { GradientBlockColorStep } from 'babylonjs/Materials/Node/Blocks/gradientBlock';

interface IGradientStepComponentProps {
    globalState: GlobalState;
    step: GradientBlockColorStep;
    lineIndex: number;
    onDelete: () => void;
    onUpdateStep: () => void;
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

    render() {
        let step = this.props.step;

        return (
            <div className="gradient-step">
                <div className="step">
                    {`#${this.props.lineIndex}`}
                </div>
                <input type="color" value={step.color.toHexString()} onChange={(evt) => this.updateColor(evt.target.value)} />
                <div className="step-value">
                    {step.step.toFixed(2)}
                </div>
                <div className="step-slider">
                    <input className="range" type="range" step={0.01} min={0} max={1.0} value={step.step}
                        onChange={evt => this.updateStep(parseFloat(evt.target.value))} />
                </div>
                <div className="gradient-delete" onClick={() => this.props.onDelete()}>
                    <FontAwesomeIcon icon={faTrash} />
                </div>
            </div>
        )
    }
}
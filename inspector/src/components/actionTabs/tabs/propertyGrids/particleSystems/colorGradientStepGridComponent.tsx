import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { GlobalState } from '../../../../globalState';
import { ColorGradient, Color3Gradient } from 'babylonjs/Misc/gradients';
import { LockObject } from '../lockObject';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
import { ParticleSystem } from 'babylonjs/Particles/particleSystem';
import { ColorPickerLineComponent } from '../../../lines/colorPickerComponent';

interface IColorGradientStepGridComponent {
    globalState: GlobalState;
    gradient: ColorGradient | Color3Gradient;
    lockObject: LockObject;
    lineIndex: number;
    isColor3: boolean;
    onDelete: () => void;
    onUpdateGradient: () => void;
    onCheckForReOrder: () => void;
    host: IParticleSystem,
    codeRecorderPropertyName: string,
}

export class ColorGradientStepGridComponent extends React.Component<IColorGradientStepGridComponent, {gradient: number}> {

    constructor(props: IColorGradientStepGridComponent) {
        super(props);

        this.state={gradient: props.gradient.gradient};
    }

    updateColor1(color: string) {
        if (this.props.gradient instanceof ColorGradient) {
            this.props.gradient.color1 = Color4.FromHexString(color);
            
            this.props.globalState.onCodeChangedObservable.notifyObservers({
                object: this.props.host,
                code: `TARGET.${this.props.codeRecorderPropertyName}.color1 = BABYLON.Color4.FromHexString(${color});`
            });              
        } else {
            this.props.gradient.color = Color3.FromHexString(color);

            this.props.globalState.onCodeChangedObservable.notifyObservers({
                object: this.props.host,
                code: `TARGET.${this.props.codeRecorderPropertyName}.color = BABYLON.Color3.FromHexString(${color});`
            });              
        }

        this.props.onUpdateGradient();
        this.forceUpdate();
    }    

    updateColor2(color: string) {
        if (this.props.gradient instanceof ColorGradient) {
            this.props.gradient.color2 = Color4.FromHexString(color);

            this.props.globalState.onCodeChangedObservable.notifyObservers({
                object: this.props.host,
                code: `TARGET.${this.props.codeRecorderPropertyName}.color2 = BABYLON.Color4.FromHexString(${color});`
            });              
        }

        this.props.onUpdateGradient();
        this.forceUpdate();
    }   
    
    updateGradient(gradient: number) {
        this.props.gradient.gradient = gradient;

        this.setState({gradient: gradient});

        this.props.globalState.onCodeChangedObservable.notifyObservers({
            object: this.props.host,
            code: `TARGET.${this.props.codeRecorderPropertyName}.gradient = ${gradient};`
        });         

        this.props.onUpdateGradient();
    }

    onPointerUp() {
        this.props.onCheckForReOrder();
    }

    lock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = true;
        }
    }

    unlock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    render() {
        let gradient = this.props.gradient;

        return (
            <div className="gradient-step">
                <div className="step">
                    {`#${this.props.lineIndex}`}
                </div>
                <div className="color1">
                    <ColorPickerLineComponent value={gradient instanceof Color3Gradient ? gradient.color : gradient.color1} onColorChanged={color => {
                        this.updateColor1(color);
                    }} disableAlpha={gradient instanceof Color3Gradient}/>
                </div>
                {
                    this.props.host instanceof ParticleSystem && gradient instanceof ColorGradient &&
                    <div className="color2">
                       <ColorPickerLineComponent value={gradient.color2 ? gradient.color2 : new Color4()} onColorChanged={color => {
                            this.updateColor2(color);
                       }}/>                        
                    </div>
                }
                <div className="step-value">
                    {gradient.gradient.toFixed(2)}
                </div>
                <div className="step-slider">
                    <input className="range" type="range" step={0.01} min={0} max={1.0} value={gradient.gradient}
                        onPointerUp={evt => this.onPointerUp()}
                        onChange={evt => this.updateGradient(parseFloat(evt.target.value))} />
                </div>
                <div className="gradient-delete hoverIcon" onClick={() => this.props.onDelete()}>
                    <FontAwesomeIcon icon={faTrash} />
                </div>
            </div>
        )
    }
}
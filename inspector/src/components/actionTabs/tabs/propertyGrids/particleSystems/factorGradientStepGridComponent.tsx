import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { GlobalState } from '../../../../globalState';
import { FactorGradient } from 'babylonjs/Misc/gradients';
import { LockObject } from '../lockObject';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
import { ParticleSystem } from 'babylonjs/Particles/particleSystem';

interface IFactorGradientStepGridComponent {
    globalState: GlobalState;
    gradient: FactorGradient;
    lockObject: LockObject;
    lineIndex: number;
    onDelete: () => void;
    onUpdateGradient: () => void;
    onCheckForReOrder: () => void;
    host: IParticleSystem,
    codeRecorderPropertyName: string,
}

export class FactorGradientStepGridComponent extends React.Component<IFactorGradientStepGridComponent, {gradient: number, factor1: string, factor2?: string}> {

    constructor(props: IFactorGradientStepGridComponent) {
        super(props);

        this.state={gradient: props.gradient.gradient, factor1: this.props.gradient.factor1.toString(), factor2: this.props.gradient.factor2?.toString()};
    }

    shouldComponentUpdate(nextProps: IFactorGradientStepGridComponent, nextState: {gradient: number, factor1: string, factor2?: string}) {
        if (nextProps.gradient !== this.props.gradient) {
            nextState.gradient = nextProps.gradient.gradient;
            nextState.factor1 = nextProps.gradient.factor1.toString();
            nextState.factor2 = nextProps.gradient.factor2?.toString();
        }

        return true;
    }

    updateFactor1(valueString: string) {
        if (/[^0-9\.\-]/g.test(valueString)) {
            return;
        }

        let valueAsNumber = parseFloat(valueString);

        this.setState({factor1: valueString});

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.props.gradient.factor1 = valueAsNumber;

        this.props.globalState.onCodeChangedObservable.notifyObservers({
            object: this.props.host,
            code: `TARGET.${this.props.codeRecorderPropertyName}.factor1 = ${valueAsNumber};`
        });                 

        this.props.onUpdateGradient();
        this.forceUpdate();
    }    

    updateFactor2(valueString: string) {
        if (/[^0-9\.\-]/g.test(valueString)) {
            return;
        }

        let valueAsNumber = parseFloat(valueString);

        this.setState({factor2: valueString});

        if (isNaN(valueAsNumber)) {
            return;
        }

        this.props.gradient.factor2 = valueAsNumber;

        this.props.globalState.onCodeChangedObservable.notifyObservers({
            object: this.props.host,
            code: `TARGET.${this.props.codeRecorderPropertyName}.factor2 = ${valueAsNumber};`
        });         

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
                <div className="factor1">
                    <input type="number" step={"0.01"} className="numeric-input" value={this.state.factor1} onBlur={() => this.unlock()} onFocus={() => this.lock()}
                        onChange={evt => this.updateFactor1(evt.target.value)} />
                </div>
                {
                    this.props.host instanceof ParticleSystem &&
                    <div className="factor2">
                        <input type="number" step={"0.01"} className={"numeric-input" + ((this.state.factor1 === this.state.factor2 || gradient.factor2 === undefined) ? " grayed" : "")} value={this.state.factor2} onBlur={() => this.unlock()} onFocus={() => this.lock()} 
                            onChange={evt => this.updateFactor2(evt.target.value)} />
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
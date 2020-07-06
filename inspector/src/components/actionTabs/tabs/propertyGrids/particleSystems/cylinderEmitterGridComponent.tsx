import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { GlobalState } from '../../../../globalState';
import { PropertyChangedEvent } from '../../../../propertyChangedEvent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { CylinderParticleEmitter } from 'babylonjs/Particles/EmitterTypes/cylinderParticleEmitter';
import { FloatLineComponent } from '../../../lines/floatLineComponent';
import { LockObject } from '../lockObject';

interface ICylinderEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: CylinderParticleEmitter,
    lockObject: LockObject,
    replaySourceReplacement?: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class CylinderEmitterGridComponent extends React.Component<ICylinderEmitterGridComponentProps> {
    constructor(props: ICylinderEmitterGridComponentProps) {
        super(props);

    }

    render() {
        let emitter = this.props.emitter;
        return (
            <>                    
                <FloatLineComponent replaySourceReplacement={this.props.replaySourceReplacement} lockObject={this.props.lockObject} label="Radius" target={emitter} propertyName="radius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent replaySourceReplacement={this.props.replaySourceReplacement} lockObject={this.props.lockObject} label="Height" target={emitter} propertyName="height" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <SliderLineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Radius range" target={emitter} propertyName="radiusRange" minimum={0} maximum={1} step={0.01} 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <SliderLineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Direction randomizer" target={emitter} propertyName="directionRandomizer" minimum={0} maximum={1} step={0.01} 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </>
        );
    }
}
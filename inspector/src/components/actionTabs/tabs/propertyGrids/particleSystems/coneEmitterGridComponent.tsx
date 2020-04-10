import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { GlobalState } from '../../../../globalState';
import { PropertyChangedEvent } from '../../../../propertyChangedEvent';
import { ConeParticleEmitter } from 'babylonjs/Particles/EmitterTypes/coneParticleEmitter';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';

interface IConeEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: ConeParticleEmitter,
    onSelectionChangedObservable?: Observable<any>,
    replaySourceReplacement?: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ConeEmitterGridComponent extends React.Component<IConeEmitterGridComponentProps> {
    constructor(props: IConeEmitterGridComponentProps) {
        super(props);

    }

    render() {
        let emitter = this.props.emitter;
        return (
            <>
                <SliderLineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Radius range" target={emitter} propertyName="radiusRange" minimum={0} maximum={1} step={0.01} 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <SliderLineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Height range" target={emitter} propertyName="heightRange" minimum={0} maximum={1} step={0.01} 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Emit from spawn point only" target={emitter} propertyName="emitFromSpawnPointOnly" 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />                    
                <SliderLineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Direction randomizer" target={emitter} propertyName="directionRandomizer" minimum={0} maximum={1} step={0.01} 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </>
        );
    }
}
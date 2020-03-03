import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { GlobalState } from '../../../../globalState';
import { PropertyChangedEvent } from '../../../../propertyChangedEvent';
import { BoxParticleEmitter } from 'babylonjs/Particles/EmitterTypes/boxParticleEmitter';
import { Vector3LineComponent } from '../../../lines/vector3LineComponent';

interface IBoxEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: BoxParticleEmitter,
    replaySourceReplacement?: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class BoxEmitterGridComponent extends React.Component<IBoxEmitterGridComponentProps> {
    constructor(props: IBoxEmitterGridComponentProps) {
        super(props);

    }

    render() {
        let emitter = this.props.emitter;
        return (
            <>
                <Vector3LineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Direction 1" target={emitter} propertyName="direction1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Vector3LineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Direction 2" target={emitter} propertyName="direction2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Vector3LineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Min emit box" target={emitter} propertyName="minEmitBox"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Vector3LineComponent replaySourceReplacement={this.props.replaySourceReplacement} label="Max emit box" target={emitter} propertyName="maxEmitBox"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </>
        );
    }
}
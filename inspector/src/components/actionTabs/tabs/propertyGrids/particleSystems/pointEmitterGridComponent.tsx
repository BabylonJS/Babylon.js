import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { GlobalState } from '../../../../globalState';
import { PropertyChangedEvent } from '../../../../propertyChangedEvent';
import { LockObject } from '../lockObject';
import { PointParticleEmitter } from 'babylonjs/Particles/EmitterTypes/pointParticleEmitter';
import { Vector3LineComponent } from '../../../lines/vector3LineComponent';

interface IPointEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: PointParticleEmitter,
    lockObject: LockObject,
    replaySourceReplacement?: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class PointEmitterGridComponent extends React.Component<IPointEmitterGridComponentProps> {
    constructor(props: IPointEmitterGridComponentProps) {
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
            </>
        );
    }
}
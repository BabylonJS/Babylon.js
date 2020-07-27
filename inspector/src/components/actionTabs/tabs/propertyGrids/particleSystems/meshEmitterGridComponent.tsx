import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { GlobalState } from '../../../../globalState';
import { PropertyChangedEvent } from '../../../../propertyChangedEvent';
import { LockObject } from '../lockObject';
import { Vector3LineComponent } from '../../../lines/vector3LineComponent';
import { MeshParticleEmitter } from 'babylonjs/Particles/EmitterTypes/meshParticleEmitter';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { MeshPickerComponent } from '../../../lines/meshPickerComponent';
import { Scene } from 'babylonjs/scene';

interface IMeshEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: MeshParticleEmitter,
    scene: Scene,
    lockObject: LockObject,
    onSelectionChangedObservable?: Observable<any>,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class MeshEmitterGridComponent extends React.Component<IMeshEmitterGridComponentProps> {
    constructor(props: IMeshEmitterGridComponentProps) {
        super(props);

    }

    render() {
        let emitter = this.props.emitter;    

        return (
            <>        
                <MeshPickerComponent globalState={this.props.globalState} label="Source" scene={this.props.scene} 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    target={this.props.emitter} property="mesh"/>       
                {
                    !emitter.useMeshNormalsForDirection &&
                    <Vector3LineComponent label="Direction 1" target={emitter} propertyName="direction1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
                {
                    !emitter.useMeshNormalsForDirection &&
                    <Vector3LineComponent label="Direction 2" target={emitter} propertyName="direction2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />      
                }
                <CheckBoxLineComponent label="Use normals for direction" target={emitter} propertyName="useMeshNormalsForDirection" 
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />                                    
            </>
        );
    }
}
import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { GlobalState } from "../../../../globalState";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { MeshParticleEmitter } from "core/Particles/EmitterTypes/meshParticleEmitter";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { MeshPickerComponent } from "../../../lines/meshPickerComponent";
import type { Scene } from "core/scene";

interface IMeshEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: MeshParticleEmitter;
    scene: Scene;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MeshEmitterGridComponent extends React.Component<IMeshEmitterGridComponentProps> {
    constructor(props: IMeshEmitterGridComponentProps) {
        super(props);
    }

    render() {
        const emitter = this.props.emitter;

        return (
            <>
                <MeshPickerComponent
                    globalState={this.props.globalState}
                    label="Source"
                    scene={this.props.scene}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    target={this.props.emitter}
                    property="mesh"
                />
                {!emitter.useMeshNormalsForDirection && (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Direction 1"
                        target={emitter}
                        propertyName="direction1"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
                {!emitter.useMeshNormalsForDirection && (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Direction 2"
                        target={emitter}
                        propertyName="direction2"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
                <CheckBoxLineComponent
                    label="Use normals for direction"
                    target={emitter}
                    propertyName="useMeshNormalsForDirection"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </>
        );
    }
}

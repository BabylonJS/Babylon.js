import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { GlobalState } from "../../../../globalState";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";

interface IPointEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: PointParticleEmitter;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class PointEmitterGridComponent extends React.Component<IPointEmitterGridComponentProps> {
    constructor(props: IPointEmitterGridComponentProps) {
        super(props);
    }

    render() {
        const emitter = this.props.emitter;
        return (
            <>
                <Vector3LineComponent
                    lockObject={this.props.lockObject}
                    label="Direction 1"
                    target={emitter}
                    propertyName="direction1"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <Vector3LineComponent
                    lockObject={this.props.lockObject}
                    label="Direction 2"
                    target={emitter}
                    propertyName="direction2"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </>
        );
    }
}

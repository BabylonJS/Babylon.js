import * as React from "react";

import { Observable } from "core/Misc/observable";
import { GlobalState } from "../../../../globalState";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { PointParticleEmitter } from "core/Particles/EmitterTypes/pointParticleEmitter";
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
                <Vector3LineComponent label="Direction 1" target={emitter} propertyName="direction1" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Vector3LineComponent label="Direction 2" target={emitter} propertyName="direction2" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </>
        );
    }
}

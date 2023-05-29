import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { GlobalState } from "../../../../globalState";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { BoxParticleEmitter } from "core/Particles/EmitterTypes/boxParticleEmitter";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

interface IBoxEmitterGridComponentProps {
    globalState: GlobalState;
    emitter: BoxParticleEmitter;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    lockObject: LockObject;
}

export class BoxEmitterGridComponent extends React.Component<IBoxEmitterGridComponentProps> {
    constructor(props: IBoxEmitterGridComponentProps) {
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
                <Vector3LineComponent
                    lockObject={this.props.lockObject}
                    label="Min emit box"
                    target={emitter}
                    propertyName="minEmitBox"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <Vector3LineComponent
                    lockObject={this.props.lockObject}
                    label="Max emit box"
                    target={emitter}
                    propertyName="maxEmitBox"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </>
        );
    }
}

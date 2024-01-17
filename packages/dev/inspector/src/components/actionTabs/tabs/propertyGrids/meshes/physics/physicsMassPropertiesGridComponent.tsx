import type { Observable } from "core/Misc/observable";
import type { PhysicsBody } from "core/Physics/v2/physicsBody";
import type { GlobalState } from "inspector/components/globalState";
import type { PropertyChangedEvent } from "inspector/components/propertyChangedEvent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

/**
 * Component that displays the mass properties of a physics body.
 */
export interface IPhysicsMassPropertiesGridComponentProps {
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    body: PhysicsBody;
    globalState: GlobalState;
}

export function PhysicsMassPropertiesGridComponent(props: IPhysicsMassPropertiesGridComponentProps) {
    const massProperties = props.body.getMassProperties();

    return (
        <>
            <FloatLineComponent
                lockObject={props.lockObject}
                label="Mass"
                target={massProperties}
                propertyName="mass"
                onPropertyChangedObservable={props.onPropertyChangedObservable}
            />
        </>
    );
}

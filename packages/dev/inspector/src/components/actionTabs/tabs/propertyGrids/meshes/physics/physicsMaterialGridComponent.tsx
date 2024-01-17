import type { Observable } from "core/Misc/observable";
import type { PhysicsBody } from "core/Physics/v2/physicsBody";
import type { GlobalState } from "inspector/components/globalState";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

/**
 * Component that displays the physic material properties of a physics body.
 */
export interface IPhysicsMaterialGridComponentProps {
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    body: PhysicsBody;
    globalState: GlobalState;
}
export function PhysicsMaterialGridComponent(props: IPhysicsMaterialGridComponentProps) {
    const material = props.body.shape?.material;
    return (
        <>
            <FloatLineComponent
                lockObject={props.lockObject}
                label="Dynamic Friction"
                target={material}
                propertyName="friction"
                onPropertyChangedObservable={props.onPropertyChangedObservable}
            />
            <FloatLineComponent
                lockObject={props.lockObject}
                label="Restitution"
                target={material}
                propertyName="restitution"
                onPropertyChangedObservable={props.onPropertyChangedObservable}
            />
            <FloatLineComponent
                lockObject={props.lockObject}
                label="Static Friction"
                target={material}
                propertyName="staticFriction"
                onPropertyChangedObservable={props.onPropertyChangedObservable}
            />
        </>
    );
}

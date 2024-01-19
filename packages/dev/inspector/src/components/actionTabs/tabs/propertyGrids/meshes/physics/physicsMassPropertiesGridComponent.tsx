import type { Observable } from "core/Misc/observable";
import type { PhysicsBody } from "core/Physics/v2/physicsBody";
import type { GlobalState } from "inspector/components/globalState";
import type { PropertyChangedEvent } from "inspector/components/propertyChangedEvent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

/**
 * Properties of the physics mass properties grid component.
 */
export interface IPhysicsMassPropertiesGridComponentProps {
    /**
     * Lock object
     */
    lockObject: LockObject;
    /**
     * Callback raised on the property changed event
     */
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    /**
     * Physics body to edit
     */
    body: PhysicsBody;
    /**
     * Global state
     */
    globalState: GlobalState;
    /**
     * Index of the instance to edit
     */
    instanceIndex?: number;
}

/**
 * Component that displays the mass properties of a physics body.
 * @param props the component props
 * @returns the component
 */
export function PhysicsMassPropertiesGridComponent(props: IPhysicsMassPropertiesGridComponentProps) {
    const massProperties = props.body.getMassProperties(props.instanceIndex);

    const changeMass = (value: number) => {
        massProperties.mass = value;
        props.body.setMassProperties(massProperties, props.instanceIndex);
    };

    return (
        <>
            <FloatLineComponent
                lockObject={props.lockObject}
                label="Mass"
                target={massProperties}
                propertyName="mass"
                onPropertyChangedObservable={props.onPropertyChangedObservable}
                onChange={changeMass}
            />
        </>
    );
}

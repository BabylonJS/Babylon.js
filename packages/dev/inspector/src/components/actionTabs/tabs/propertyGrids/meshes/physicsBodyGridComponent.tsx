/**
 * Component that allows displaying and tweaking a physics body's properties.
 */

import type { Observable } from "core/Misc/observable";
import { PhysicsShapeType } from "core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsBody } from "core/Physics/v2/physicsBody";
import type { GlobalState } from "inspector/components/globalState";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

export interface IPhysicsBodyGridComponentProps {
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    body: PhysicsBody;
    globalState: GlobalState;
}

export function PhysicsBodyGridComponent(props: IPhysicsBodyGridComponentProps) {
    const massProperties = props.body.getMassProperties();
    const material = props.body.shape?.material;

    return (
        <LineContainerComponent title="PHYSICS" closed={true} selection={props.globalState}>
            <FloatLineComponent
                lockObject={props.lockObject}
                label="Mass"
                target={massProperties}
                propertyName="mass"
                onPropertyChangedObservable={props.onPropertyChangedObservable}
            />
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

            <TextLineComponent label="Type" value={_convertPhysicsShapeTypeToString(props.body.shape?.type)} />
        </LineContainerComponent>
    );
}

function _convertPhysicsShapeTypeToString(type?: PhysicsShapeType) {
    switch (type) {
        case PhysicsShapeType.BOX:
            return "Box";
        case PhysicsShapeType.SPHERE:
            return "Sphere";
        case PhysicsShapeType.CYLINDER:
            return "Cylinder";
        case PhysicsShapeType.CAPSULE:
            return "Capsule";
        case PhysicsShapeType.CONTAINER:
            return "Container";
        case PhysicsShapeType.CONVEX_HULL:
            return "Convex Hull";
        case PhysicsShapeType.MESH:
            return "Mesh";
        case PhysicsShapeType.HEIGHTFIELD:
            return "Heightfield";
        default:
            return "Unknown";
    }
}

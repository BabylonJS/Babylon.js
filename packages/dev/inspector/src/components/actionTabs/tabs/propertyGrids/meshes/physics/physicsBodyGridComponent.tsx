/**
 * Component that allows displaying and tweaking a physics body's properties.
 */

import type { Observable } from "core/Misc/observable";
import { PhysicsShapeType } from "core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsBody } from "core/Physics/v2/physicsBody";
import type { GlobalState } from "inspector/components/globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { PhysicsMassPropertiesGridComponent } from "./physicsMassPropertiesGridComponent";
import { PhysicsMaterialGridComponent } from "./physicsMaterialGridComponent";

export interface IPhysicsBodyGridComponentProps {
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    body: PhysicsBody;
    globalState: GlobalState;
}

export function PhysicsBodyGridComponent(props: IPhysicsBodyGridComponentProps) {
    return (
        <LineContainerComponent title="PHYSICS" closed={true} selection={props.globalState}>
            <PhysicsMassPropertiesGridComponent
                lockObject={props.lockObject}
                onPropertyChangedObservable={props.onPropertyChangedObservable}
                body={props.body}
                globalState={props.globalState}
            />
            <PhysicsMaterialGridComponent
                lockObject={props.lockObject}
                onPropertyChangedObservable={props.onPropertyChangedObservable}
                body={props.body}
                globalState={props.globalState}
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

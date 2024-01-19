import type { Observable } from "core/Misc/observable";
import { PhysicsMotionType, PhysicsShapeType } from "core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsBody } from "core/Physics/v2/physicsBody";
import type { GlobalState } from "inspector/components/globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { PhysicsMassPropertiesGridComponent } from "./physicsMassPropertiesGridComponent";
import { PhysicsMaterialGridComponent } from "./physicsMaterialGridComponent";
import { useState } from "react";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";

/**
 * Properties of the physics body grid component.
 */
export interface IPhysicsBodyGridComponentProps {
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
}

/**
 * Component that allows displaying and tweaking a physics body's properties.
 * @param props the component props
 * @returns the component
 */
export function PhysicsBodyGridComponent(props: IPhysicsBodyGridComponentProps) {
    const numInstances = props.body._pluginDataInstances?.length ?? 0;
    const [selectedInstance, setSelectedInstance] = useState<{ selected: number }>({ selected: 0 });

    const onChangeSelectedInstance = (value: number) => {
        setSelectedInstance({ selected: value });
    };

    return (
        <LineContainerComponent title="PHYSICS" closed={true} selection={props.globalState}>
            {numInstances > 0 && (
                <FloatLineComponent
                    label="Selected instance"
                    lockObject={props.lockObject}
                    target={selectedInstance}
                    propertyName="selected"
                    onChange={onChangeSelectedInstance}
                    min={0}
                    max={numInstances - 1}
                    isInteger={true}
                />
            )}
            <PhysicsMassPropertiesGridComponent
                lockObject={props.lockObject}
                onPropertyChangedObservable={props.onPropertyChangedObservable}
                body={props.body}
                globalState={props.globalState}
                instanceIndex={selectedInstance.selected}
            />
            <PhysicsMaterialGridComponent
                lockObject={props.lockObject}
                onPropertyChangedObservable={props.onPropertyChangedObservable}
                body={props.body}
                globalState={props.globalState}
            />
            <TextLineComponent label="Motion Type" value={_convertPhysicsMotionTypeToString(props.body.motionType)} />
            <TextLineComponent label="Shape Type" value={_convertPhysicsShapeTypeToString(props.body.shape?.type)} />
        </LineContainerComponent>
    );
}

function _convertPhysicsMotionTypeToString(type?: PhysicsMotionType) {
    switch (type) {
        case PhysicsMotionType.DYNAMIC:
            return "Dynamic";
        case PhysicsMotionType.STATIC:
            return "Static";
        case PhysicsMotionType.ANIMATED:
            return "Animated";
        default:
            return "Unknown";
    }
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

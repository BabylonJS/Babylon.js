// eslint-disable-next-line import/no-internal-modules
import { PhysicsMotionType, PhysicsPrestepType, type TransformNode } from "core/index";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";

import type { FunctionComponent } from "react";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/dropdownPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { Vector3 } from "core/Maths/math.vector";

type Vector3Keys<T> = { [P in keyof T]: T[P] extends Vector3 ? P : never }[keyof T];

// This helper hook gets the value of a Vector3 property from a target object and causes the component
// to re-render when the property changes or when the x/y/z components of the Vector3 change.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useVector3Property<T extends object, K extends Vector3Keys<T>>(target: T, propertyKey: K): Vector3 {
    const position = useObservableState(() => target[propertyKey] as Vector3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => position.x, useInterceptObservable("property", position, "x"));
    useObservableState(() => position.y, useInterceptObservable("property", position, "y"));
    useObservableState(() => position.z, useInterceptObservable("property", position, "z"));
    return position;
}

const MotionOptions: DropdownOption[] = [
    { label: "Static", value: PhysicsMotionType.STATIC },
    { label: "Animated", value: PhysicsMotionType.ANIMATED },
    { label: "Dynamic", value: PhysicsMotionType.DYNAMIC },
];

const PrestepOptions: DropdownOption[] = [
    { label: "Disabled", value: PhysicsPrestepType.DISABLED },
    { label: "Teleport", value: PhysicsPrestepType.TELEPORT },
    { label: "Action", value: PhysicsPrestepType.ACTION },
];

/**
 * Physics properties
 * @param props transform node
 * @returns controls
 */
export const TransformNodePhysicsProperties: FunctionComponent<{ node: TransformNode }> = (props) => {
    const { node } = props;

    if (!node.physicsBody) {
        return <></>;
    }

    const massProps = node.physicsBody.getMassProperties() as any;
    const centerOfMass = useVector3Property(massProps, "centerOfMass");
    const inertia = useVector3Property(massProps, "inertia");

    // Get current damping values
    const linearDamping = node.physicsBody.getLinearDamping();
    const angularDamping = node.physicsBody.getAngularDamping();

    // Get current velocities (read-only)
    const linearVelocity = node.physicsBody.getLinearVelocity();
    const angularVelocity = node.physicsBody.getAngularVelocity();

    return (
        <>
            <DropdownPropertyLine
                label="Motion Type"
                options={MotionOptions}
                value={MotionOptions.find((opt) => opt.value === (node.physicsBody as any)._motionType) ?? MotionOptions[0]}
                onChange={(option) => {
                    return node.physicsBody?.setMotionType(option.value as PhysicsMotionType);
                }}
            />
            <DropdownPropertyLine
                label="Prestep Type"
                options={PrestepOptions}
                value={PrestepOptions.find((opt) => opt.value === (node.physicsBody as any)._prestepType) ?? PrestepOptions[0]}
                onChange={(option) => {
                    return node.physicsBody?.setPrestepType(option.value as PhysicsPrestepType);
                }}
            />
            {/* Linear Damping */}
            <FloatInputPropertyLine
                label="Linear Damping"
                min={0}
                max={1}
                step={0.01}
                value={linearDamping}
                onChange={(e) => {
                    node.physicsBody!.setLinearDamping(e);
                }}
            />
            {/* Angular Damping */}
            <FloatInputPropertyLine
                label="Angular Damping"
                min={0}
                max={1}
                step={0.01}
                value={angularDamping}
                onChange={(e) => {
                    node.physicsBody!.setAngularDamping(e);
                }}
            />
            <Vector3PropertyLine label="Linear Velocity" value={linearVelocity} onChange={() => {}} />
            <Vector3PropertyLine label="Angular Velocity" value={angularVelocity} onChange={() => {}} />
            {/* Physics Mass Properties Controls */}
            {massProps && (
                <PropertyLine label="Mass">
                    <div style={{ marginTop: 12 }}>
                        <FloatInputPropertyLine
                            label="Value"
                            value={massProps.mass ?? ""}
                            min={0}
                            step={0.01}
                            onChange={(e) => {
                                massProps.mass = e;
                                node.physicsBody?.setMassProperties(massProps);
                            }}
                        />
                        <Vector3PropertyLine
                            label="Center"
                            value={centerOfMass}
                            onChange={(v) => {
                                massProps.centerOfMass = v;
                                node.physicsBody?.setMassProperties(massProps);
                            }}
                        />
                        <Vector3PropertyLine
                            label="Inertia"
                            value={inertia}
                            onChange={(v) => {
                                massProps.inertia = v;
                                node.physicsBody?.setMassProperties(massProps);
                            }}
                        />
                    </div>
                </PropertyLine>
            )}
        </>
    );
};

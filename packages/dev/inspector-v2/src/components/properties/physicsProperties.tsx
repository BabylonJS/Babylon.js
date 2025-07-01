import type { FunctionComponent } from "react";

import type { TransformNode } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { Vector3 } from "core/Maths/math.vector";
import { PhysicsMotionType, PhysicsPrestepType } from "core/Physics/v2/IPhysicsEnginePlugin";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/dropdownPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/vectorPropertyLine";
import { useProperty, useVector3Property } from "../../hooks/compoundPropertyHooks";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

import "core/Physics/v2/physicsEngineComponent";

const MotionOptions = [
    { label: "Static", value: PhysicsMotionType.STATIC },
    { label: "Animated", value: PhysicsMotionType.ANIMATED },
    { label: "Dynamic", value: PhysicsMotionType.DYNAMIC },
] as const satisfies readonly DropdownOption[];

const PrestepOptions = [
    { label: "Disabled", value: PhysicsPrestepType.DISABLED },
    { label: "Teleport", value: PhysicsPrestepType.TELEPORT },
    { label: "Action", value: PhysicsPrestepType.ACTION },
] as const satisfies readonly DropdownOption[];

export type PhysicsTransformNode = TransformNode & { physicsBody: NonNullable<TransformNode["physicsBody"]> };

/**
 * Physics properties
 * @param props transform node
 * @returns controls
 */
export const TransformNodePhysicsProperties: FunctionComponent<{ node: PhysicsTransformNode }> = (props) => {
    const { node } = props;

    // TODO: This component will only even be rendered if physicsBody is defined, so it doesn't really handle physicsBody changing to/from undefined.
    const physicsBody = useProperty(node, "physicsBody");
    const massProperties = useObservableState(() => physicsBody.getMassProperties(), useInterceptObservable("function", physicsBody, "setMassProperties"));

    const centerOfMass = useVector3Property(massProperties, "centerOfMass") ?? Vector3.Zero();
    const inertia = useVector3Property(massProperties, "inertia") ?? Vector3.Zero();

    // Get current damping values
    const linearDamping = useObservableState(() => physicsBody.getLinearDamping(), useInterceptObservable("function", physicsBody, "setLinearDamping"));
    const angularDamping = useObservableState(() => physicsBody.getAngularDamping(), useInterceptObservable("function", physicsBody, "setAngularDamping"));

    // Get motion and prestep types
    const motionType = useObservableState(() => physicsBody.getMotionType(), useInterceptObservable("function", physicsBody, "setMotionType"));
    const prestepType = useObservableState(() => physicsBody.getPrestepType(), useInterceptObservable("function", physicsBody, "setPrestepType"));

    // Get current velocities
    const linearVelocity = useObservableState(() => physicsBody.getLinearVelocity(), useInterceptObservable("function", physicsBody, "setLinearVelocity"));
    const angularVelocity = useObservableState(() => physicsBody.getAngularVelocity(), useInterceptObservable("function", physicsBody, "setAngularVelocity"));

    return (
        <>
            <NumberDropdownPropertyLine
                key="MotionType"
                label="Motion Type"
                options={MotionOptions}
                value={motionType}
                onChange={(value) => {
                    return physicsBody.setMotionType(value as PhysicsMotionType);
                }}
            />
            <NumberDropdownPropertyLine
                label="Prestep Type"
                options={PrestepOptions}
                value={prestepType}
                onChange={(value) => {
                    return node.physicsBody.setPrestepType(value as PhysicsPrestepType);
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
                    physicsBody.setLinearDamping(e);
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
                    physicsBody.setAngularDamping(e);
                }}
            />
            <Vector3PropertyLine label="Linear Velocity" value={linearVelocity} onChange={(value) => physicsBody.setLinearVelocity(value)} />
            <Vector3PropertyLine label="Angular Velocity" value={angularVelocity} onChange={(value) => physicsBody.setAngularVelocity(value)} />
            {/* Physics Mass Properties Controls */}
            {massProperties && (
                <PropertyLine label="Mass">
                    <div style={{ marginTop: 12 }}>
                        <FloatInputPropertyLine
                            label="Value"
                            value={massProperties.mass ?? 0}
                            min={0}
                            step={0.01}
                            onChange={(value) => {
                                node.physicsBody.setMassProperties({ ...massProperties, mass: value });
                            }}
                        />
                        <Vector3PropertyLine
                            label="Center"
                            value={centerOfMass}
                            onChange={(value) => {
                                node.physicsBody.setMassProperties({ ...massProperties, centerOfMass: value });
                            }}
                        />
                        <Vector3PropertyLine
                            label="Inertia"
                            value={inertia}
                            onChange={(value) => {
                                node.physicsBody.setMassProperties({ ...massProperties, inertia: value });
                            }}
                        />
                    </div>
                </PropertyLine>
            )}
        </>
    );
};

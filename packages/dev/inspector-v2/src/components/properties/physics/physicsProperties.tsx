import type { FunctionComponent } from "react";

import type { PhysicsBody, TransformNode } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { useCallback } from "react";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

import { Vector3 } from "core/Maths/math.vector";
import { PhysicsMotionType, PhysicsPrestepType } from "core/Physics/v2/IPhysicsEnginePlugin";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty, useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";

import "core/Physics/v2/physicsEngineComponent";

const MotionOptions = [
    { label: "Static", value: PhysicsMotionType.STATIC },
    { label: "Animated", value: PhysicsMotionType.ANIMATED },
    { label: "Dynamic", value: PhysicsMotionType.DYNAMIC },
] as const satisfies readonly DropdownOption<number>[];

const PrestepOptions = [
    { label: "Disabled", value: PhysicsPrestepType.DISABLED },
    { label: "Teleport", value: PhysicsPrestepType.TELEPORT },
    { label: "Action", value: PhysicsPrestepType.ACTION },
] as const satisfies readonly DropdownOption<number>[];

export const TransformNodePhysicsProperties: FunctionComponent<{ node: TransformNode }> = (props) => {
    const { node } = props;

    const physicsBody = useProperty(node, "physicsBody");

    if (!physicsBody) {
        return (
            <MessageBar
                intent="info"
                title="No Physics Body"
                message="To modify physics properties, attach a physics body to this node."
                docLink="https://doc.babylonjs.com/features/featuresDeepDive/physics/rigidBodies"
            />
        );
    }

    return <PhysicsBodyProperties physicsBody={physicsBody} />;
};

/**
 * Physics properties
 * @param props transform node
 * @returns controls
 */
const PhysicsBodyProperties: FunctionComponent<{ physicsBody: PhysicsBody }> = (props) => {
    const { physicsBody } = props;

    const massProperties = useObservableState(
        useCallback(() => physicsBody.getMassProperties(), [physicsBody]),
        useInterceptObservable("function", physicsBody, "setMassProperties")
    );

    const centerOfMass = useVector3Property(massProperties, "centerOfMass") ?? Vector3.Zero();
    const inertia = useVector3Property(massProperties, "inertia") ?? Vector3.Zero();

    // Get current damping values
    const linearDamping = useObservableState(() => physicsBody.getLinearDamping(), useInterceptObservable("function", physicsBody, "setLinearDamping"));
    const angularDamping = useObservableState(() => physicsBody.getAngularDamping(), useInterceptObservable("function", physicsBody, "setAngularDamping"));

    // Get motion and prestep types
    const motionType = useObservableState(() => physicsBody.getMotionType(), useInterceptObservable("function", physicsBody, "setMotionType"));
    const prestepType = useObservableState(() => physicsBody.getPrestepType(), useInterceptObservable("function", physicsBody, "setPrestepType"));

    // Get current velocities
    const linearVelocity = useObservableState(
        useCallback(() => physicsBody.getLinearVelocity(), [physicsBody]),
        useInterceptObservable("function", physicsBody, "setLinearVelocity")
    );
    const angularVelocity = useObservableState(
        useCallback(() => physicsBody.getAngularVelocity(), [physicsBody]),
        useInterceptObservable("function", physicsBody, "setAngularVelocity")
    );

    return (
        <>
            <NumberDropdownPropertyLine
                key="MotionType"
                label="Motion Type"
                options={MotionOptions}
                value={motionType}
                onChange={(value) => {
                    return physicsBody.setMotionType(value);
                }}
            />
            <NumberDropdownPropertyLine
                label="Prestep Type"
                options={PrestepOptions}
                value={prestepType}
                onChange={(value) => {
                    return physicsBody.setPrestepType(value);
                }}
            />
            {/* Linear Damping */}
            <NumberInputPropertyLine
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
            <NumberInputPropertyLine
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
                <>
                    <NumberInputPropertyLine
                        label="Mass"
                        value={massProperties.mass ?? 0}
                        min={0}
                        step={0.01}
                        onChange={(value) => {
                            physicsBody.setMassProperties({ ...massProperties, mass: value });
                        }}
                    />
                    <Vector3PropertyLine
                        label="Center of Mass"
                        value={centerOfMass}
                        onChange={(value) => {
                            physicsBody.setMassProperties({ ...massProperties, centerOfMass: value });
                        }}
                    />
                    <Vector3PropertyLine
                        label="Inertia"
                        value={inertia}
                        onChange={(value) => {
                            physicsBody.setMassProperties({ ...massProperties, inertia: value });
                        }}
                    />
                </>
            )}
        </>
    );
};

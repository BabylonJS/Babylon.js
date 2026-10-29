import {
    getPhysicsBodyInstanceCount,
    getPhysicsBodyPrestepType,
    getPhysicsBodyShape,
    getPhysicsBodyMassPropertiesToRef,
    getPhysicsBodyLinearDamping,
    getPhysicsBodyAngularDamping,
    getPhysicsBodyGravityFactor,
    getPhysicsBodyLinearVelocityToRef,
    getPhysicsBodyAngularVelocityToRef,
    getPhysicsGravity,
    getPhysicsTimestep,
    getPhysicsVelocityLimits,
    getPhysicsShapeType,
    getPhysicsShapeParameters,
    getPhysicsShapeMaterialToRef,
    getPhysicsShapeFilterMembershipMask,
    getPhysicsShapeFilterCollideMask,
    getPhysicsShapeDensity,
    getPhysicsShapeChildCount,
    isPhysicsConstraintEnabled,
    setPhysicsConstraintEnabled,
    setPhysicsGravity,
    setPhysicsTimestep,
    setPhysicsVelocityLimits,
    setPhysicsBodyMotionType,
    setPhysicsBodyPrestepType,
    setPhysicsBodyMassProperties,
    setPhysicsBodyLinearDamping,
    setPhysicsBodyAngularDamping,
    setPhysicsBodyGravityFactor,
    setPhysicsBodyLinearVelocity,
    setPhysicsBodyAngularVelocity,
    setPhysicsShapeMaterial,
    setPhysicsShapeFilterMembershipMask,
    setPhysicsShapeFilterCollideMask,
    PhysicsMotionType,
    PhysicsPrestepType,
    PhysicsShapeType,
    PhysicsConstraintType,
    type SceneContext,
    type SceneNode,
    type PhysicsWorld,
    type PhysicsBody,
    type PhysicsConstraint,
    type PhysicsMassProperties,
    type PhysicsShapeMaterial,
    type Vec3,
} from "@babylonjs/lite";
import { type FunctionComponent, type ReactNode, useCallback, useState } from "react";

import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { QuaternionPropertyLine, Vector3PropertyLine, type Vector3Value } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

import { GetEntityId } from "../../../components/explorer/explorerModel";
import { useWatchedValue, useWatcher } from "../../../contexts/watcherContext";
import { type ISelectionService } from "../../../services/selectionService";
import {
    GetBodyConstraints,
    GetNodePhysicsBodies,
    GetPhysicsBodyDisplayName,
    GetPhysicsBodyWorld,
    GetPhysicsConstraintAxisName,
    GetPhysicsConstraintDisplayName,
    GetPhysicsConstraintTypeName,
    GetPhysicsEnumName,
    GetPhysicsShapeTypeName,
    GetPhysicsWorldBodies,
    GetPhysicsWorldConstraints,
    GetPhysicsWorldDisplayName,
    GetShapeUserCount,
    GetScenePhysicsWorlds,
    IsPhysicsBodyLive,
    IsPhysicsConstraintLive,
    IsPhysicsWorldLive,
    PhysicsMotionTypeOptions,
    PhysicsPrestepTypeOptions,
} from "../../physicsUtils";

// Native ToRef reads reuse storage. Only serialized values escape into React;
// scratch vectors, mass structs, materials and shapes never survive a read.
const VectorScratch: Vec3 = { x: 0, y: 0, z: 0 };
const MassScratch: Required<PhysicsMassProperties> = {
    mass: 0,
    centerOfMass: { x: 0, y: 0, z: 0 },
    inertia: { x: 0, y: 0, z: 0 },
    inertiaOrientation: { x: 0, y: 0, z: 0, w: 1 },
};
const MaterialScratch: PhysicsShapeMaterial = { friction: 0, staticFriction: 0, restitution: 0 };
const ShapeScratch: { type: number; parameters: ReturnType<typeof getPhysicsShapeParameters>; users: number } = { type: PhysicsShapeType.SPHERE, parameters: null, users: 0 };
const Zero: Vec3 = { x: 0, y: 0, z: 0 };
// Tensor controls require a callback even when all of their inputs are disabled.
const ReadOnly = () => undefined;

function ToVec3(value: Vector3Value): Vec3 {
    return "x" in value ? value : { x: value[0], y: value[1], z: value[2] };
}

function IsFiniteVector3(value: Vec3): boolean {
    return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function EditMassProperties(world: PhysicsWorld, body: PhysicsBody, edited: PhysicsMassProperties): void {
    const checkInertia = (properties: Required<PhysicsMassProperties>) => {
        if (properties.inertia.x === 0 || properties.inertia.y === 0 || properties.inertia.z === 0) {
            // Readback contains the locked tensor, not Lite's hidden pre-lock
            // tensor. Feeding it back would permanently zero axes on unlock.
            throw new Error("Cannot safely edit mass properties with zero inertia. Lite does not expose the original inertia needed to preserve rotation-lock restoration.");
        }
    };
    // Lite rebuilds omitted fields from the shape, rather than the current body.
    const current = structuredClone(getPhysicsBodyMassPropertiesToRef(world, body, MassScratch, 0));
    checkInertia(current);
    const next = { ...current, ...edited };
    // There is no public per-instance setter. Preflight every instance before any
    // write so a fan-out edit cannot replace another instance's unedited values.
    for (let index = 1; index < getPhysicsBodyInstanceCount(body); index++) {
        const instance = getPhysicsBodyMassPropertiesToRef(world, body, MassScratch, index);
        checkInertia(instance);
        for (const field of ["mass", "centerOfMass", "inertia", "inertiaOrientation"] as const) {
            if (!(field in edited) && JSON.stringify(instance[field]) !== JSON.stringify(current[field])) {
                throw new Error("Cannot edit mass properties: instances have different unedited values. Lite only supports writing mass properties to all instances.");
            }
        }
    }
    setPhysicsBodyMassProperties(world, body, next);
}

type WorldProps = { scene: SceneContext; world: PhysicsWorld; selectionService: ISelectionService };
type BodyProps = WorldProps & { body: PhysicsBody };
type ConstraintProps = WorldProps & { constraint: PhysicsConstraint };
type Mutate = (operation: () => void) => void;

function ErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Watches a guarded, serialized read. ToRef scratch is copied only when rendering,
 * not retained by the watcher. Failed reads and writes stay local to their section.
 * @param props The liveness guard, read operation and value renderer.
 * @returns The watched content or a local error message.
 */
const PhysicsRead: FunctionComponent<{
    live: () => boolean;
    read: () => unknown;
    children: (value: string, mutate: Mutate) => ReactNode;
}> = (props) => {
    const { live, read, children } = props;
    const watcher = useWatcher();
    const [writeError, setWriteError] = useState<string>();
    const getValue = useCallback(() => {
        if (!live()) {
            return "gone";
        }
        try {
            return `value:${JSON.stringify(read())}`;
        } catch (error) {
            return `error:${ErrorMessage(error)}`;
        }
    }, [live, read]);
    const value = useWatchedValue(null, getValue);
    const mutate: Mutate = (operation) => {
        try {
            setWriteError(undefined);
            // Never use the last render's liveness or shape as permission to write.
            if (live()) {
                operation();
            }
        } catch (error) {
            setWriteError(ErrorMessage(error));
        } finally {
            watcher.refresh();
        }
    };
    if (!live() || value === "gone") {
        return null;
    }
    return (
        <>
            {writeError ? <MessageBar intent="error" message={writeError} /> : null}
            {value.startsWith("error:") ? <MessageBar intent="error" message={value.slice(6)} /> : children(value.slice(6), mutate)}
        </>
    );
};

const PhysicsNumber: FunctionComponent<{
    label: string;
    live: () => boolean;
    read: () => number;
    write?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    description?: string;
}> = (props) => {
    const { label, live, read, write, ...presentation } = props;
    return (
        <PhysicsRead live={live} read={read}>
            {(value, mutate) =>
                write ? (
                    <NumberInputPropertyLine
                        label={label}
                        value={JSON.parse(value)}
                        onChange={(next) => {
                            if (Number.isFinite(next)) {
                                mutate(() => write(next));
                            }
                        }}
                        {...presentation}
                    />
                ) : (
                    <TextPropertyLine label={label} value={value} />
                )
            }
        </PhysicsRead>
    );
};

const PhysicsVector: FunctionComponent<{
    label: string;
    live: () => boolean;
    read: () => Vec3;
    write?: (value: Vec3) => void;
    description?: string;
}> = (props) => {
    const { label, live, read, write, description } = props;
    return (
        <PhysicsRead live={live} read={read}>
            {(value, mutate) => (
                <Vector3PropertyLine
                    label={label}
                    value={JSON.parse(value)}
                    disabled={!write}
                    description={description}
                    onChange={write ? (next) => mutate(() => write(ToVec3(next))) : ReadOnly}
                />
            )}
        </PhysicsRead>
    );
};

const EntityLink: FunctionComponent<{ label: string; entity: object; name: string; selectionService: ISelectionService }> = (props) => {
    const { label, entity, name, selectionService } = props;
    return <LinkPropertyLine label={label} value={name} onLink={() => (selectionService.selectedEntity = entity)} />;
};

function BodyHint(body: PhysicsBody): string | undefined {
    // Instance counts are JS-only in Lite, so hints are safe even outside PhysicsRead's native-call gate.
    const count = getPhysicsBodyInstanceCount(body);
    return count > 1 ? `Applies to all ${count} instances` : undefined;
}

/**
 * Renders a live world's counts and scene navigation.
 * @param props The world, scene and navigation service.
 * @returns Live counts and a scene link.
 */
export const PhysicsWorldGeneralProperties: FunctionComponent<WorldProps> = (props) => {
    const { scene, world, selectionService } = props;
    const live = () => IsPhysicsWorldLive(scene, world);
    return (
        <PhysicsRead live={live} read={() => [GetPhysicsWorldBodies(world).length, GetPhysicsWorldConstraints(world).length, scene.name || "Scene"]}>
            {(value) => {
                const [bodies, constraints, sceneName] = JSON.parse(value) as [number, number, string];
                return (
                    <>
                        <TextPropertyLine label="Bodies" value={String(bodies)} />
                        <TextPropertyLine label="Constraints" value={String(constraints)} />
                        <EntityLink label="Scene" name={sceneName} entity={scene} selectionService={selectionService} />
                    </>
                );
            }}
        </PhysicsRead>
    );
};

/**
 * Renders editable gravity, timestep and independently preserved velocity limits.
 * @param props The world and owning scene.
 * @returns Guarded simulation controls.
 */
export const PhysicsWorldSimulationProperties: FunctionComponent<WorldProps> = (props) => {
    const { scene, world } = props;
    const live = () => IsPhysicsWorldLive(scene, world);
    return (
        <>
            <PhysicsVector label="Gravity" live={live} read={() => getPhysicsGravity(world)} write={(value) => setPhysicsGravity(world, value)} />
            <PhysicsNumber
                label="Timestep"
                live={live}
                read={() => getPhysicsTimestep(world)}
                write={(value) => setPhysicsTimestep(world, value)}
                min={0}
                step={0.001}
                description="0 uses the frame delta"
            />
            <PhysicsNumber
                label="Max Linear Velocity"
                live={live}
                read={() => getPhysicsVelocityLimits(world).maxLinear}
                write={(value) => setPhysicsVelocityLimits(world, value, getPhysicsVelocityLimits(world).maxAngular)}
                min={0}
            />
            <PhysicsNumber
                label="Max Angular Velocity"
                live={live}
                read={() => getPhysicsVelocityLimits(world).maxAngular}
                write={(value) => setPhysicsVelocityLimits(world, getPhysicsVelocityLimits(world).maxLinear, value)}
                min={0}
            />
        </>
    );
};

/**
 * Renders body navigation, motion/prestep editing and thin-instance semantics.
 * @param props The body, owning world and navigation service.
 * @returns Body identity and motion controls.
 */
export const PhysicsBodyGeneralProperties: FunctionComponent<BodyProps> = (props) => {
    const { scene, world, body, selectionService } = props;
    const live = () => IsPhysicsBodyLive(scene, world, body);
    return (
        <PhysicsRead
            live={live}
            read={() => `${body.node.name},${body.motionType},${getPhysicsBodyPrestepType(body)},${getPhysicsBodyInstanceCount(body)},${GetPhysicsWorldDisplayName(scene, world)}`}
        >
            {(_value, mutate) => {
                const count = getPhysicsBodyInstanceCount(body);
                return (
                    <>
                        <EntityLink label="Node" name={body.node.name || "Unnamed Node"} entity={body.node} selectionService={selectionService} />
                        <EntityLink label="World" name={GetPhysicsWorldDisplayName(scene, world)} entity={world} selectionService={selectionService} />
                        <NumberDropdownPropertyLine
                            label="Motion Type"
                            value={body.motionType}
                            options={
                                PhysicsMotionTypeOptions.some((option) => option.value === body.motionType)
                                    ? PhysicsMotionTypeOptions
                                    : [...PhysicsMotionTypeOptions, { label: GetPhysicsEnumName(PhysicsMotionType, body.motionType), value: body.motionType }]
                            }
                            description={BodyHint(body)}
                            onChange={(value) => mutate(() => setPhysicsBodyMotionType(world, body, value as PhysicsMotionType))}
                        />
                        <NumberDropdownPropertyLine
                            label="Prestep Type"
                            value={getPhysicsBodyPrestepType(body)}
                            options={
                                PhysicsPrestepTypeOptions.some((option) => option.value === getPhysicsBodyPrestepType(body))
                                    ? PhysicsPrestepTypeOptions
                                    : [
                                          ...PhysicsPrestepTypeOptions,
                                          { label: GetPhysicsEnumName(PhysicsPrestepType, getPhysicsBodyPrestepType(body)), value: getPhysicsBodyPrestepType(body) },
                                      ]
                            }
                            description={BodyHint(body)}
                            onChange={(value) => mutate(() => setPhysicsBodyPrestepType(body, value as PhysicsPrestepType))}
                        />
                        <TextPropertyLine label="Instances" value={String(count)} />
                        {count > 1 ? (
                            <MessageBar intent="info" title={`Instance 0 of ${count}`} message={`Values shown for instance 0; edits apply to all ${count} instances.`} />
                        ) : null}
                    </>
                );
            }}
        </PhysicsRead>
    );
};

/**
 * Renders the freshly resolved base shape, parameters and shared-shape controls.
 * @param props The body and owning world.
 * @returns Base-shape properties or a missing-shape message.
 */
export const PhysicsBodyShapeProperties: FunctionComponent<BodyProps> = (props) => {
    const { scene, world, body } = props;
    const live = () => IsPhysicsBodyLive(scene, world, body);
    const shapeLive = () => live() && !!getPhysicsBodyShape(body);
    return (
        <PhysicsRead
            live={live}
            read={() => {
                const shape = getPhysicsBodyShape(body);
                if (!shape) {
                    return null;
                }
                ShapeScratch.type = getPhysicsShapeType(shape);
                ShapeScratch.parameters = getPhysicsShapeParameters(shape);
                ShapeScratch.users = GetShapeUserCount(world, shape);
                return ShapeScratch;
            }}
        >
            {(value) => {
                const info = JSON.parse(value) as { type: number; parameters: ReturnType<typeof getPhysicsShapeParameters>; users: number } | null;
                if (!info) {
                    return <MessageBar intent="info" message="No shape attached" />;
                }
                const parameters = info.parameters;
                const materialFields = [
                    ["Dynamic Friction", "friction"],
                    ["Static Friction", "staticFriction"],
                    ["Restitution", "restitution"],
                ] as const;
                return (
                    <>
                        <TextPropertyLine label="Type" value={GetPhysicsShapeTypeName(info.type)} />
                        {getPhysicsBodyInstanceCount(body) > 1 ? (
                            <MessageBar intent="info" message="Only the base shape is reported; per-instance shapes are not available." />
                        ) : null}
                        {parameters ? (
                            <>
                                {(["center", "pointA", "pointB", "extents"] as const)
                                    .filter((key) => parameters[key])
                                    .map((key) => (
                                        <Vector3PropertyLine
                                            key={key}
                                            label={{ center: "Center", pointA: "Point A", pointB: "Point B", extents: "Extents" }[key]}
                                            value={parameters[key]!}
                                            disabled
                                            onChange={ReadOnly}
                                        />
                                    ))}
                                {parameters.radius !== undefined ? <TextPropertyLine label="Radius" value={String(parameters.radius)} /> : null}
                                {parameters.rotation ? (
                                    <QuaternionPropertyLine label="Rotation" value={parameters.rotation} useEuler useDegrees disabled onChange={ReadOnly} />
                                ) : null}
                            </>
                        ) : (
                            <MessageBar intent="info" message={`Parameters not available for ${GetPhysicsShapeTypeName(info.type)} shapes`} />
                        )}
                        {info.users > 1 ? <MessageBar intent="warning" message={`Shape shared by ${info.users} bodies; material and filter edits affect all of them`} /> : null}
                        {materialFields.map(([label, field]) => (
                            <PhysicsNumber
                                key={field}
                                label={label}
                                live={shapeLive}
                                read={() => getPhysicsShapeMaterialToRef(world, getPhysicsBodyShape(body)!, MaterialScratch)[field]}
                                write={(next) => {
                                    const shape = getPhysicsBodyShape(body)!;
                                    getPhysicsShapeMaterialToRef(world, shape, MaterialScratch);
                                    MaterialScratch[field] = next;
                                    setPhysicsShapeMaterial(world, shape, MaterialScratch.friction, MaterialScratch.restitution, MaterialScratch.staticFriction);
                                }}
                                min={0}
                                max={1}
                                step={0.01}
                                description={BodyHint(body)}
                            />
                        ))}
                        <PhysicsNumber
                            label="Membership Mask"
                            live={shapeLive}
                            read={() => getPhysicsShapeFilterMembershipMask(world, getPhysicsBodyShape(body)!) >>> 0}
                            write={(next) => setPhysicsShapeFilterMembershipMask(world, getPhysicsBodyShape(body)!, next >>> 0)}
                            min={0}
                            max={0xffffffff}
                            step={1}
                            description={BodyHint(body)}
                        />
                        <PhysicsNumber
                            label="Collide Mask"
                            live={shapeLive}
                            read={() => getPhysicsShapeFilterCollideMask(world, getPhysicsBodyShape(body)!) >>> 0}
                            write={(next) => setPhysicsShapeFilterCollideMask(world, getPhysicsBodyShape(body)!, next >>> 0)}
                            min={0}
                            max={0xffffffff}
                            step={1}
                            description={BodyHint(body)}
                        />
                        <PhysicsNumber label="Density" live={shapeLive} read={() => getPhysicsShapeDensity(world, getPhysicsBodyShape(body)!)} />
                        {info.type === PhysicsShapeType.CONTAINER ? (
                            <PhysicsNumber label="Child Count" live={shapeLive} read={() => getPhysicsShapeChildCount(world, getPhysicsBodyShape(body)!)} />
                        ) : null}
                    </>
                );
            }}
        </PhysicsRead>
    );
};

/**
 * Renders damping and Lite's gravity-factor control.
 * @param props The body and owning world.
 * @returns Damping and gravity-factor controls.
 */
export const PhysicsBodyDampingProperties: FunctionComponent<BodyProps> = (props) => {
    const { scene, world, body } = props;
    const live = () => IsPhysicsBodyLive(scene, world, body);
    const description = BodyHint(body);
    return (
        <>
            <PhysicsNumber
                label="Linear Damping"
                live={live}
                read={() => getPhysicsBodyLinearDamping(world, body, 0)}
                write={(value) => setPhysicsBodyLinearDamping(world, body, value)}
                min={0}
                max={1}
                step={0.01}
                description={description}
            />
            <PhysicsNumber
                label="Angular Damping"
                live={live}
                read={() => getPhysicsBodyAngularDamping(world, body, 0)}
                write={(value) => setPhysicsBodyAngularDamping(world, body, value)}
                min={0}
                max={1}
                step={0.01}
                description={description}
            />
            <PhysicsNumber
                label="Gravity Factor"
                live={live}
                read={() => getPhysicsBodyGravityFactor(world, body, 0)}
                write={(value) => setPhysicsBodyGravityFactor(world, body, value)}
                step={0.1}
                description={description}
            />
        </>
    );
};

/**
 * Renders instance-zero velocities with labelled fan-out writes.
 * @param props The body and owning world.
 * @returns Linear and angular velocity editors.
 */
export const PhysicsBodyVelocityProperties: FunctionComponent<BodyProps> = (props) => {
    const { scene, world, body } = props;
    const live = () => IsPhysicsBodyLive(scene, world, body);
    return (
        <>
            <PhysicsVector
                label="Linear Velocity"
                live={live}
                read={() => getPhysicsBodyLinearVelocityToRef(world, body, VectorScratch, 0)}
                write={(value) => setPhysicsBodyLinearVelocity(world, body, value)}
                description={BodyHint(body)}
            />
            <PhysicsVector
                label="Angular Velocity"
                live={live}
                read={() => getPhysicsBodyAngularVelocityToRef(world, body, VectorScratch, 0)}
                write={(value) => setPhysicsBodyAngularVelocity(world, body, value)}
                description={BodyHint(body)}
            />
        </>
    );
};

/**
 * Isolates mass failures and preserves current unedited mass properties and rotation locks.
 * @param props The body and owning world.
 * @returns Mass controls and read-only inertia orientation.
 */
export const PhysicsBodyMassProperties: FunctionComponent<BodyProps> = (props) => {
    const { scene, world, body } = props;
    return (
        <PhysicsRead live={() => IsPhysicsBodyLive(scene, world, body)} read={() => getPhysicsBodyMassPropertiesToRef(world, body, MassScratch, 0)}>
            {(value, mutate) => {
                const mass = JSON.parse(value) as Required<PhysicsMassProperties>;
                return (
                    <>
                        <NumberInputPropertyLine
                            label="Mass"
                            value={mass.mass}
                            min={0}
                            step={0.01}
                            description={BodyHint(body)}
                            onChange={(next) => {
                                if (Number.isFinite(next)) {
                                    mutate(() => EditMassProperties(world, body, { mass: next }));
                                }
                            }}
                        />
                        <Vector3PropertyLine
                            label="Center of Mass"
                            value={mass.centerOfMass}
                            description={BodyHint(body)}
                            onChange={(next) => {
                                const centerOfMass = ToVec3(next);
                                if (IsFiniteVector3(centerOfMass)) {
                                    mutate(() => EditMassProperties(world, body, { centerOfMass }));
                                }
                            }}
                        />
                        <Vector3PropertyLine
                            label="Inertia"
                            value={mass.inertia}
                            description={[BodyHint(body), "Locked axes read 0"].filter(Boolean).join("; ")}
                            onChange={(next) => {
                                const inertia = ToVec3(next);
                                if (IsFiniteVector3(inertia)) {
                                    mutate(() => EditMassProperties(world, body, { inertia }));
                                }
                            }}
                        />
                        <QuaternionPropertyLine label="Inertia Orientation" value={mass.inertiaOrientation} useEuler useDegrees disabled onChange={ReadOnly} />
                    </>
                );
            }}
        </PhysicsRead>
    );
};

/**
 * Lists live constraints incident to the selected body.
 * @param props The body and navigation service.
 * @returns Links to its live constraints.
 */
export const PhysicsBodyConstraintProperties: FunctionComponent<BodyProps> = (props) => {
    const { scene, world, body, selectionService } = props;
    return (
        <PhysicsRead
            live={() => IsPhysicsBodyLive(scene, world, body)}
            read={() =>
                GetBodyConstraints(world, body)
                    .map((constraint) => `${GetEntityId(constraint)}:${GetPhysicsConstraintDisplayName(constraint)}`)
                    .join(",")
            }
        >
            {() =>
                GetBodyConstraints(world, body).map((constraint) => (
                    <EntityLink
                        key={GetEntityId(constraint)}
                        label="Constraint"
                        entity={constraint}
                        name={GetPhysicsConstraintDisplayName(constraint)}
                        selectionService={selectionService}
                    />
                ))
            }
        </PhysicsRead>
    );
};

/**
 * Renders constraint identity, endpoint navigation, collision and native enable state.
 * @param props The constraint, owning world and navigation service.
 * @returns Constraint identity and enable controls.
 */
export const PhysicsConstraintGeneralProperties: FunctionComponent<ConstraintProps> = (props) => {
    const { scene, world, constraint, selectionService } = props;
    const live = () => IsPhysicsConstraintLive(scene, world, constraint);
    return (
        <PhysicsRead live={live} read={() => `${GetPhysicsConstraintDisplayName(constraint)},${isPhysicsConstraintEnabled(world, constraint)}`}>
            {(value, mutate) => (
                <>
                    <TextPropertyLine label="Type" value={GetPhysicsConstraintTypeName(constraint.type)} />
                    <EntityLink label="Body A" entity={constraint.bodyA} name={GetPhysicsBodyDisplayName(constraint.bodyA)} selectionService={selectionService} />
                    <EntityLink label="Body B" entity={constraint.bodyB} name={GetPhysicsBodyDisplayName(constraint.bodyB)} selectionService={selectionService} />
                    <SwitchPropertyLine
                        label="Enabled"
                        controlled
                        value={(JSON.parse(value) as string).endsWith(",true")}
                        onChange={(enabled) => mutate(() => setPhysicsConstraintEnabled(world, constraint, enabled))}
                    />
                    <TextPropertyLine label="Collision" value={String(constraint.options.collision ?? false)} />
                    {getPhysicsBodyInstanceCount(constraint.bodyA) > 1 || getPhysicsBodyInstanceCount(constraint.bodyB) > 1 ? (
                        <MessageBar intent="info" message="Constraint binds instance 0 only." />
                    ) : null}
                </>
            )}
        </PhysicsRead>
    );
};

/**
 * Renders immutable body-local constraint frames and optional distance.
 * @param props The constraint and owning world.
 * @returns Read-only local frames.
 */
export const PhysicsConstraintFrameProperties: FunctionComponent<ConstraintProps> = (props) => {
    const { scene, world, constraint } = props;
    return (
        <PhysicsRead live={() => IsPhysicsConstraintLive(scene, world, constraint)} read={() => constraint.options}>
            {(value) => {
                const options = JSON.parse(value) as PhysicsConstraint["options"];
                return (
                    <>
                        {(["pivotA", "pivotB", "axisA", "axisB", "perpAxisA", "perpAxisB"] as const).map((key) => (
                            <Vector3PropertyLine
                                key={key}
                                label={{ pivotA: "Pivot A", pivotB: "Pivot B", axisA: "Axis A", axisB: "Axis B", perpAxisA: "Perp Axis A", perpAxisB: "Perp Axis B" }[key]}
                                value={options[key] ?? Zero}
                                disabled
                                onChange={ReadOnly}
                            />
                        ))}
                        {constraint.type === PhysicsConstraintType.DISTANCE || options.maxDistance !== undefined ? (
                            <TextPropertyLine label="Max Distance" value={String(options.maxDistance ?? 0)} />
                        ) : null}
                    </>
                );
            }}
        </PhysicsRead>
    );
};

/**
 * Renders authored limits without introducing unsupported native pivot/limit editing.
 * @param props The constraint and owning world.
 * @returns Read-only limit rows or a no-limits message.
 */
export const PhysicsConstraintLimitProperties: FunctionComponent<ConstraintProps> = (props) => {
    const { scene, world, constraint } = props;
    return (
        <PhysicsRead live={() => IsPhysicsConstraintLive(scene, world, constraint)} read={() => constraint.limits ?? null}>
            {(value) =>
                constraint.limits?.length ? (
                    (JSON.parse(value) as NonNullable<PhysicsConstraint["limits"]>).map((limit, index) => (
                        <TextPropertyLine
                            key={index}
                            label={GetPhysicsConstraintAxisName(limit.axis)}
                            value={(
                                [
                                    ["Min", limit.minLimit],
                                    ["Max", limit.maxLimit],
                                    ["Stiffness", limit.stiffness],
                                    ["Damping", limit.damping],
                                ] as const
                            )
                                .filter(([, number]) => number !== undefined)
                                .map(([label, number]) => `${label}: ${number}`)
                                .join(", ")}
                        />
                    ))
                ) : (
                    <MessageBar intent="info" message="No limits" />
                )
            }
        </PhysicsRead>
    );
};

/**
 * Lists all node bodies, or the full Inspector's no-body guidance.
 * @param props The node, scene and navigation service.
 * @returns Body links or physics documentation guidance.
 */
export const NodePhysicsProperties: FunctionComponent<{ scene: SceneContext; node: SceneNode; selectionService: ISelectionService }> = (props) => {
    const { scene, node, selectionService } = props;
    return (
        <PhysicsRead
            live={() => true}
            read={() =>
                GetNodePhysicsBodies(scene, node)
                    .map((body) => `${GetEntityId(body)}:${GetPhysicsBodyDisplayName(body)}:${GetSceneWorldIndex(scene, body)}`)
                    .join(",")
            }
        >
            {() => {
                const bodies = GetNodePhysicsBodies(scene, node);
                return bodies.length ? (
                    bodies.map((body) => (
                        <EntityLink
                            key={GetEntityId(body)}
                            label={`Physics Body (World [${GetSceneWorldIndex(scene, body)}])`}
                            name={GetPhysicsBodyDisplayName(body)}
                            entity={body}
                            selectionService={selectionService}
                        />
                    ))
                ) : (
                    <MessageBar
                        intent="info"
                        title="No Physics Body"
                        message="To modify physics properties, attach a physics body to this node."
                        docLink="https://doc.babylonjs.com/features/featuresDeepDive/physics/rigidBodies"
                    />
                );
            }}
        </PhysicsRead>
    );
};

function GetSceneWorldIndex(scene: SceneContext, body: PhysicsBody): number {
    const world = GetPhysicsBodyWorld(scene, body);
    return world ? GetScenePhysicsWorlds(scene).indexOf(world) : -1;
}

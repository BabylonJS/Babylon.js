import {
    getPhysicsWorlds,
    getPhysicsBodies,
    getPhysicsConstraints,
    getPhysicsBodyWorld,
    getPhysicsBodyShape,
    getPhysicsBodyInstanceCount,
    PhysicsMotionType,
    PhysicsPrestepType,
    PhysicsShapeType,
    PhysicsConstraintType,
    PhysicsConstraintAxis,
    type EngineContext,
    type SceneContext,
    type SceneNode,
    type PhysicsWorld,
    type PhysicsBody,
    type PhysicsConstraint,
    type PhysicsShape,
} from "@babylonjs/lite";

import { GetSceneContexts } from "./sceneEntityUtils";

/**
 * Copies the scene's registered physics worlds without native reads.
 * @param scene The inspected scene.
 * @returns A detached world list.
 */
export function GetScenePhysicsWorlds(scene: SceneContext): PhysicsWorld[] {
    return [...getPhysicsWorlds(scene)];
}

/**
 * Copies the world's registered bodies without native reads.
 * @param world The inspected world.
 * @returns A detached body list.
 */
export function GetPhysicsWorldBodies(world: PhysicsWorld): PhysicsBody[] {
    return [...getPhysicsBodies(world)];
}

/**
 * Copies only constraints whose two bodies remain registered.
 * @param world The inspected world.
 * @returns Its constraints with live endpoints.
 */
export function GetPhysicsWorldConstraints(world: PhysicsWorld): PhysicsConstraint[] {
    const bodies = getPhysicsBodies(world);
    return [...getPhysicsConstraints(world)].filter((constraint) => bodies.includes(constraint.bodyA) && bodies.includes(constraint.bodyB));
}

/**
 * Tests world list membership, the sole world liveness signal.
 * @param scene The owning scene.
 * @param world The candidate world.
 * @returns Whether the world remains registered.
 */
export function IsPhysicsWorldLive(scene: SceneContext, world: PhysicsWorld): boolean {
    return getPhysicsWorlds(scene).includes(world);
}

/**
 * Tests world and body list membership immediately before a native operation.
 * @param scene The owning scene.
 * @param world The owning world.
 * @param body The candidate body.
 * @returns Whether the world and body remain registered.
 */
export function IsPhysicsBodyLive(scene: SceneContext, world: PhysicsWorld, body: PhysicsBody): boolean {
    return IsPhysicsWorldLive(scene, world) && getPhysicsBodies(world).includes(body);
}

/**
 * Tests world, constraint and both endpoint bodies' list membership.
 * @param scene The owning scene.
 * @param world The owning world.
 * @param constraint The candidate constraint.
 * @returns Whether the constraint and both endpoints are live.
 */
export function IsPhysicsConstraintLive(scene: SceneContext, world: PhysicsWorld, constraint: PhysicsConstraint): boolean {
    return (
        IsPhysicsWorldLive(scene, world) &&
        getPhysicsConstraints(world).includes(constraint) &&
        getPhysicsBodies(world).includes(constraint.bodyA) &&
        getPhysicsBodies(world).includes(constraint.bodyB)
    );
}

/**
 * Captures copied, JS-only discovery lists for Explorer watch comparisons.
 * @param scene The inspected scene.
 * @returns Worlds with their copied bodies and live constraints.
 */
export function GetScenePhysicsSnapshot(scene: SceneContext) {
    return {
        worlds: GetScenePhysicsWorlds(scene).map((world) => ({
            world,
            bodies: GetPhysicsWorldBodies(world),
            constraints: GetPhysicsWorldConstraints(world),
        })),
    };
}

/**
 * Gets the registered worlds across all inspected scenes.
 * @param engine The inspected engine.
 * @returns Its physics worlds.
 */
export function GetEnginePhysicsWorlds(engine: EngineContext): PhysicsWorld[] {
    return GetSceneContexts(engine).flatMap(GetScenePhysicsWorlds);
}

/**
 * Gets the registered bodies across all inspected scenes.
 * @param engine The inspected engine.
 * @returns Its physics bodies.
 */
export function GetEnginePhysicsBodies(engine: EngineContext): PhysicsBody[] {
    return GetEnginePhysicsWorlds(engine).flatMap(GetPhysicsWorldBodies);
}

/**
 * Finds a world's registered scene without using internal Lite fields.
 * @param engine The inspected engine.
 * @param world The world to locate.
 * @returns Its registered scene, if any.
 */
export function GetPhysicsWorldScene(engine: EngineContext, world: PhysicsWorld): SceneContext | undefined {
    return GetSceneContexts(engine).find((scene) => IsPhysicsWorldLive(scene, world));
}

/**
 * Gets a body's public owning world only while it is registered in the scene.
 * @param scene The inspected scene.
 * @param body The body to locate.
 * @returns Its live world, if any.
 */
export function GetPhysicsBodyWorld(scene: SceneContext, body: PhysicsBody): PhysicsWorld | undefined {
    const world = getPhysicsBodyWorld(body);
    return IsPhysicsBodyLive(scene, world, body) ? world : undefined;
}

/**
 * Finds the live world owning a constraint with live endpoints.
 * @param scene The inspected scene.
 * @param constraint The constraint to locate.
 * @returns Its live world, if any.
 */
export function GetPhysicsConstraintWorld(scene: SceneContext, constraint: PhysicsConstraint): PhysicsWorld | undefined {
    return getPhysicsWorlds(scene).find((world) => IsPhysicsConstraintLive(scene, world, constraint));
}

/**
 * Gets every registered body bound to a node, including bodies in different worlds.
 * @param scene The inspected scene.
 * @param node The node to locate.
 * @returns Its registered bodies.
 */
export function GetNodePhysicsBodies(scene: SceneContext, node: SceneNode): PhysicsBody[] {
    return GetScenePhysicsWorlds(scene)
        .flatMap(GetPhysicsWorldBodies)
        .filter((body) => body.node === node);
}

/**
 * Gets live constraints incident to a body.
 * @param world The inspected world.
 * @param body The endpoint body.
 * @returns Its live constraints.
 */
export function GetBodyConstraints(world: PhysicsWorld, body: PhysicsBody): PhysicsConstraint[] {
    return GetPhysicsWorldConstraints(world).filter((constraint) => constraint.bodyA === body || constraint.bodyB === body);
}

/**
 * Counts base-shape users within one world's live body list.
 * @param world The inspected world.
 * @param shape The base shape to count.
 * @returns The number of bodies sharing it in this world.
 */
export function GetShapeUserCount(world: PhysicsWorld, shape: PhysicsShape): number {
    let count = 0;
    for (const body of getPhysicsBodies(world)) {
        if (getPhysicsBodyShape(body) === shape) {
            count++;
        }
    }
    return count;
}

function EnumOptions(values: Readonly<Record<string, number>>) {
    return Object.entries(values).map(([name, value]) => ({
        label: name
            .toLowerCase()
            .split("_")
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(" "),
        value,
    }));
}

/** Motion choices derived from Lite's exported enum, not numeric assumptions. */
export const PhysicsMotionTypeOptions = EnumOptions(PhysicsMotionType);
/** Prestep choices derived from Lite's exported enum. */
export const PhysicsPrestepTypeOptions = EnumOptions(PhysicsPrestepType);

/**
 * Formats enum values, preserving unknown numeric values for forward compatibility.
 * @param values The exported Lite enum.
 * @param value The numeric enum value.
 * @returns Its friendly name or an unknown-value label.
 */
export function GetPhysicsEnumName(values: Readonly<Record<string, number>>, value: number): string {
    return EnumOptions(values).find((option) => option.value === value)?.label ?? `Unknown (${value})`;
}

/**
 * Formats a shape type.
 * @param value The numeric shape type.
 * @returns Its friendly name.
 */
export const GetPhysicsShapeTypeName = (value: number) => GetPhysicsEnumName(PhysicsShapeType, value);
/**
 * Formats a constraint type.
 * @param value The numeric constraint type.
 * @returns Its friendly name.
 */
export const GetPhysicsConstraintTypeName = (value: number) => GetPhysicsEnumName(PhysicsConstraintType, value);
/**
 * Formats a constraint limit axis.
 * @param value The numeric limit axis.
 * @returns Its friendly name.
 */
export const GetPhysicsConstraintAxisName = (value: number) => GetPhysicsEnumName(PhysicsConstraintAxis, value);

/**
 * Gets a scene-local world label.
 * @param scene The owning scene.
 * @param world The world to label.
 * @returns Its numbered label.
 */
export function GetPhysicsWorldDisplayName(scene: SceneContext, world: PhysicsWorld): string {
    return `Physics World [${getPhysicsWorlds(scene).indexOf(world)}]`;
}

/**
 * Gets a body's watched node name and thin-instance count.
 * @param body The body to label.
 * @returns Its node name and optional thin-instance suffix.
 */
export function GetPhysicsBodyDisplayName(body: PhysicsBody): string {
    // Explorer discovery and labels rely on Lite's instance-count getter remaining JS-only.
    const count = getPhysicsBodyInstanceCount(body);
    return `${body.node.name || "Unnamed Node"} (Body)${count > 1 ? ` ×${count}` : ""}`;
}

/**
 * Gets a constraint's type and watched endpoint names.
 * @param constraint The constraint to label.
 * @returns Its type and endpoint label.
 */
export function GetPhysicsConstraintDisplayName(constraint: PhysicsConstraint): string {
    return `${GetPhysicsConstraintTypeName(constraint.type)} (${constraint.bodyA.node.name || "Unnamed Node"} ↔ ${constraint.bodyB.node.name || "Unnamed Node"})`;
}

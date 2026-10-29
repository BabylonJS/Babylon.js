/**
 * @vitest-environment jsdom
 */
import {
    type PhysicsBody,
    type PhysicsConstraint,
    type PhysicsWorld,
    type PhysicsShape,
    type SceneContext,
    type PhysicsMassProperties,
    type PhysicsShapeMaterial,
    type Vec3,
} from "@babylonjs/lite";
import { act, type FunctionComponent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const State = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    const worlds = new Map<SceneContext, PhysicsWorld[]>();
    const bodies = new Map<PhysicsWorld, PhysicsBody[]>();
    const constraints = new Map<PhysicsWorld, PhysicsConstraint[]>();
    return {
        worlds,
        bodies,
        constraints,
        scenes: [] as SceneContext[],
        shapes: new Map<PhysicsBody, PhysicsShape | null>(),
        owners: new Map<PhysicsBody, PhysicsWorld>(),
        instances: new Map<PhysicsBody, number>(),
        material: { friction: 0.2, staticFriction: 0.7, restitution: 0.3 },
        mass: { mass: 2, centerOfMass: { x: 1, y: 2, z: 3 }, inertia: { x: 3, y: 4, z: 5 }, inertiaOrientation: { x: 0, y: 0, z: 0, w: 1 } },
        massRead: vi.fn(),
        materialRead: vi.fn(),
        linearRead: vi.fn(),
        angularRead: vi.fn(),
        gravityRead: vi.fn(),
        linearVelocityRead: vi.fn(),
        angularVelocityRead: vi.fn(),
        enabledRead: vi.fn(),
        densityRead: vi.fn(),
        childCountRead: vi.fn(),
        membershipRead: vi.fn(),
        collideRead: vi.fn(),
        setMass: vi.fn(),
        setMaterial: vi.fn(),
        setMembership: vi.fn(),
        setCollide: vi.fn(),
        setMotion: vi.fn(),
        setPrestep: vi.fn(),
        setLinear: vi.fn(),
        setAngular: vi.fn(),
        setGravity: vi.fn(),
        setLinearVelocity: vi.fn(),
        setAngularVelocity: vi.fn(),
        setEnabled: vi.fn(),
        setWorldGravity: vi.fn(),
        setTimestep: vi.fn(),
        setLimits: vi.fn(),
        worldGravity: vi.fn(),
        timestep: vi.fn(),
        limits: vi.fn(),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    getRenderingContexts: () => State.scenes,
    getRenderingContextKind: () => "scene",
    getPhysicsWorlds: (scene: SceneContext) => State.worlds.get(scene) ?? [],
    getPhysicsBodies: (world: PhysicsWorld) => State.bodies.get(world) ?? [],
    getPhysicsConstraints: (world: PhysicsWorld) => State.constraints.get(world) ?? [],
    getPhysicsBodyWorld: (body: PhysicsBody) => State.owners.get(body),
    getPhysicsBodyShape: (body: PhysicsBody) => State.shapes.get(body) ?? null,
    getPhysicsBodyInstanceCount: (body: PhysicsBody) => State.instances.get(body) ?? 1,
    getPhysicsBodyPrestepType: () => 1,
    getPhysicsBodyMassPropertiesToRef: State.massRead,
    getPhysicsBodyLinearDamping: State.linearRead,
    getPhysicsBodyAngularDamping: State.angularRead,
    getPhysicsBodyGravityFactor: State.gravityRead,
    getPhysicsBodyLinearVelocityToRef: State.linearVelocityRead,
    getPhysicsBodyAngularVelocityToRef: State.angularVelocityRead,
    getPhysicsShapeType: (shape: { type: number }) => shape.type,
    getPhysicsShapeParameters: (shape: { parameters: object | null }) => shape.parameters,
    getPhysicsShapeMaterialToRef: State.materialRead,
    getPhysicsShapeFilterMembershipMask: State.membershipRead,
    getPhysicsShapeFilterCollideMask: State.collideRead,
    getPhysicsShapeDensity: State.densityRead,
    getPhysicsShapeChildCount: State.childCountRead,
    isPhysicsConstraintEnabled: State.enabledRead,
    getPhysicsGravity: State.worldGravity,
    getPhysicsTimestep: State.timestep,
    getPhysicsVelocityLimits: State.limits,
    setPhysicsBodyMassProperties: State.setMass,
    setPhysicsShapeMaterial: State.setMaterial,
    setPhysicsShapeFilterMembershipMask: State.setMembership,
    setPhysicsShapeFilterCollideMask: State.setCollide,
    setPhysicsBodyMotionType: State.setMotion,
    setPhysicsBodyPrestepType: State.setPrestep,
    setPhysicsBodyLinearDamping: State.setLinear,
    setPhysicsBodyAngularDamping: State.setAngular,
    setPhysicsBodyGravityFactor: State.setGravity,
    setPhysicsBodyLinearVelocity: State.setLinearVelocity,
    setPhysicsBodyAngularVelocity: State.setAngularVelocity,
    setPhysicsConstraintEnabled: State.setEnabled,
    setPhysicsGravity: State.setWorldGravity,
    setPhysicsTimestep: State.setTimestep,
    setPhysicsVelocityLimits: State.setLimits,
}));

// Keep these tests focused on Inspector's API wiring, not shared control internals.
type ControlProps = { label: string; value: unknown; description?: string; disabled?: boolean; onChange?: (value: never) => void; onLink?: () => void };
const Control: FunctionComponent<ControlProps> = (props) => {
    const { label, value, disabled, description, onChange, onLink } = props;
    return (
        <button aria-label={label} data-value={JSON.stringify(value)} title={description} disabled={disabled} onClick={() => (onLink ? onLink() : onChange?.(NextValue as never))}>
            {label}
        </button>
    );
};
let NextValue: unknown;
vi.mock("shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine", () => ({ NumberInputPropertyLine: (props: ControlProps) => <Control {...props} /> }));
vi.mock("shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine", () => ({ NumberDropdownPropertyLine: (props: ControlProps) => <Control {...props} /> }));
vi.mock("shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine", () => ({ SwitchPropertyLine: (props: ControlProps) => <Control {...props} /> }));
vi.mock("shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine", () => ({ LinkPropertyLine: (props: ControlProps) => <Control {...props} /> }));
vi.mock("shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine", () => ({
    Vector3PropertyLine: (props: ControlProps) => <Control {...props} />,
    QuaternionPropertyLine: (props: ControlProps) => <Control {...props} />,
}));

import * as Utils from "../../src/lite/physicsUtils";
import * as Properties from "../../src/lite/components/properties/physicsProperties";
import { PhysicsExplorerServiceDefinition } from "../../src/lite/services/panes/scene/physicsExplorerService";
import { PhysicsPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/physicsPropertiesService";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { getPhysicsConstraintDebug } from "@babylonjs/lite";
import { CreateP9Engine, CreateP9Mesh, CreateP9Selection, CreateP9Watcher, RenderP9Properties } from "./liteP9TestUtils";

const Renders: ReturnType<typeof RenderP9Properties>[] = [];
const NativeReads = () => [
    State.massRead,
    State.materialRead,
    State.linearRead,
    State.angularRead,
    State.gravityRead,
    State.linearVelocityRead,
    State.angularVelocityRead,
    State.enabledRead,
    State.densityRead,
    State.childCountRead,
    State.membershipRead,
    State.collideRead,
    State.worldGravity,
    State.timestep,
    State.limits,
];

function Fixture() {
    const h = CreateP9Engine();
    const world = {} as PhysicsWorld;
    const shape = {
        type: 3,
        parameters: { center: { x: 0, y: 0, z: 0 }, extents: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, radius: 2 },
    } as unknown as PhysicsShape;
    const body = { node: CreateP9Mesh("A"), motionType: 2 } as PhysicsBody;
    const other = { node: CreateP9Mesh("B"), motionType: 0 } as PhysicsBody;
    const constraint = {
        bodyA: body,
        bodyB: other,
        type: 3,
        options: { axisA: { x: 1, y: 0, z: 0 }, axisB: { x: 1, y: 0, z: 0 }, perpAxisA: { x: 0, y: 1, z: 0 }, perpAxisB: { x: 0, y: 1, z: 0 } },
        limits: [{ axis: 3, minLimit: -1, maxLimit: 2, stiffness: 3, damping: 4 }],
    } as PhysicsConstraint;
    State.scenes.push(h.scene);
    State.worlds.set(h.scene, [world]);
    State.bodies.set(world, [body, other]);
    State.constraints.set(world, [constraint]);
    State.owners.set(body, world);
    State.owners.set(other, world);
    State.shapes.set(body, shape);
    State.shapes.set(other, shape);
    h.scene.meshes.push(body.node as ReturnType<typeof CreateP9Mesh>, other.node as ReturnType<typeof CreateP9Mesh>);
    const { watcher } = CreateP9Watcher();
    const selectionService = CreateP9Selection();
    return { ...h, world, shape, body, other, constraint, watcher, selectionService };
}

function Render(content: Parameters<typeof RenderP9Properties>[0], h: ReturnType<typeof Fixture>) {
    const render = RenderP9Properties(content, h.watcher);
    Renders.push(render);
    return render.container;
}

function Edit(container: HTMLElement, label: string, value: unknown) {
    NextValue = value;
    const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    expect(button, label).not.toBeNull();
    act(() => button!.click());
}

function Value(container: HTMLElement, label: string) {
    return JSON.parse(container.querySelector(`button[aria-label="${label}"]`)!.getAttribute("data-value")!);
}

beforeEach(() => {
    vi.clearAllMocks();
    State.scenes.length = 0;
    State.worlds.clear();
    State.bodies.clear();
    State.constraints.clear();
    State.shapes.clear();
    State.owners.clear();
    State.instances.clear();
    State.setMass.mockReset();
    Object.assign(State.material, { friction: 0.2, staticFriction: 0.7, restitution: 0.3 });
    State.massRead.mockImplementation((_world, _body, out: Required<PhysicsMassProperties>) => {
        Object.assign(out, State.mass);
        return out;
    });
    State.materialRead.mockImplementation((_world, _shape, out: PhysicsShapeMaterial) => Object.assign(out, State.material));
    State.linearRead.mockReturnValue(0.1);
    State.angularRead.mockReturnValue(0.2);
    State.gravityRead.mockReturnValue(1.5);
    State.linearVelocityRead.mockImplementation((_world, _body, out: Vec3) => Object.assign(out, { x: 1, y: 2, z: 3 }));
    State.angularVelocityRead.mockImplementation((_world, _body, out: Vec3) => Object.assign(out, { x: 4, y: 5, z: 6 }));
    State.enabledRead.mockReturnValue(true);
    State.membershipRead.mockReturnValue(0xffffffff);
    State.collideRead.mockReturnValue(3);
    State.densityRead.mockReturnValue(8);
    State.childCountRead.mockReturnValue(4);
    State.worldGravity.mockReturnValue({ x: 0, y: -9.81, z: 0 });
    State.timestep.mockReturnValue(0.016);
    State.limits.mockReturnValue({ maxLinear: 100, maxAngular: 200 });
});
afterEach(() => Renders.splice(0).forEach((render) => render.dispose()));

describe("Lite physics discovery and Explorer", () => {
    it("builds body membership once per snapshot rather than scanning bodies for each constraint endpoint", () => {
        const h = Fixture();
        const bodies = Array.from({ length: 1000 }, (_, index) => ({ node: CreateP9Mesh(String(index)) }) as PhysicsBody);
        const constraints = bodies.slice(1).map((body) => ({ ...h.constraint, bodyA: bodies[0], bodyB: body }));
        constraints.push({ ...h.constraint, bodyA: bodies[0], bodyB: h.other });
        State.bodies.set(h.world, bodies);
        State.constraints.set(h.world, constraints);
        const includes = vi.spyOn(bodies, "includes");
        const iterator = vi.spyOn(bodies, Symbol.iterator);
        expect(Utils.GetScenePhysicsSnapshot(h.scene).worlds[0].constraints).toHaveLength(999);
        expect(includes).not.toHaveBeenCalled();
        expect(iterator).toHaveBeenCalledOnce();
        iterator.mockClear();
        expect(Utils.GetPhysicsWorldConstraints(h.world)).toHaveLength(999);
        expect(includes).not.toHaveBeenCalled();
        expect(iterator).toHaveBeenCalledOnce();
    });

    it("uses only list membership, copies snapshots and filters dead constraint endpoints without native reads", () => {
        const h = Fixture();
        const snapshot = Utils.GetScenePhysicsSnapshot(h.scene);
        expect(snapshot.worlds[0]).toEqual({ world: h.world, bodies: [h.body, h.other], constraints: [h.constraint] });
        expect(snapshot.worlds[0].bodies).not.toBe(State.bodies.get(h.world));
        expect(Utils.IsPhysicsWorldLive(h.scene, h.world)).toBe(true);
        expect(Utils.IsPhysicsBodyLive(h.scene, h.world, h.body)).toBe(true);
        expect(Utils.IsPhysicsConstraintLive(h.scene, h.world, h.constraint)).toBe(true);
        expect(Utils.GetPhysicsBodyWorld(h.scene, h.body)).toBe(h.world);
        expect(Utils.GetPhysicsConstraintWorld(h.scene, h.constraint)).toBe(h.world);
        expect(Utils.GetPhysicsWorldScene(h.engine, h.world)).toBe(h.scene);
        expect(Utils.GetEnginePhysicsBodies(h.engine)).toEqual([h.body, h.other]);
        expect(Utils.GetBodyConstraints(h.world, h.body)).toEqual([h.constraint]);
        expect(Utils.GetShapeUserCount(h.world, h.shape)).toBe(2);
        State.bodies.set(h.world, [h.body]);
        expect(Utils.GetPhysicsWorldConstraints(h.world)).toEqual([]);
        expect(Utils.IsPhysicsConstraintLive(h.scene, h.world, h.constraint)).toBe(false);
        State.bodies.set(h.world, [h.body, h.other]);
        State.constraints.set(h.world, []);
        expect(Utils.IsPhysicsConstraintLive(h.scene, h.world, h.constraint)).toBe(false);
        State.worlds.set(h.scene, []);
        expect(Utils.IsPhysicsBodyLive(h.scene, h.world, h.body)).toBe(false);
        NativeReads().forEach((read) => expect(read).not.toHaveBeenCalled());
    });

    it("labels thin bodies and unknown enums and consumes stable Lite debug defaults", () => {
        const h = Fixture();
        State.instances.set(h.body, 3);
        expect(Utils.GetPhysicsBodyDisplayName(h.body)).toBe("A (Body) ×3");
        expect(Utils.GetPhysicsWorldDisplayName(h.scene, h.world)).toBe("Physics World [0]");
        expect(Utils.GetPhysicsConstraintDisplayName(h.constraint)).toBe("Hinge (A ↔ B)");
        expect(Utils.GetPhysicsShapeTypeName(99)).toBe("Unknown (99)");
        expect(Utils.GetPhysicsConstraintTypeName(99)).toBe("Unknown (99)");
        expect(Utils.GetPhysicsConstraintAxisName(99)).toBe("Unknown (99)");
        const debug = getPhysicsConstraintDebug(h.constraint);
        expect(debug).toBe(getPhysicsConstraintDebug(h.constraint));
        expect(debug.pivotA).toEqual({ x: 0, y: 0, z: 0 });
        expect(debug.pivotB).toEqual({ x: 0, y: 0, z: 0 });
    });

    it("discovers async worlds, nested subgroups, endpoint removal/re-addition, watched names and clears stale selections", () => {
        const h = Fixture();
        State.worlds.set(h.scene, []);
        let provider!: RenderingContextNodeProvider<SceneContext>;
        const unregister = vi.fn();
        const explorer = {
            addRenderingContextNodeProvider: (value: typeof provider) => {
                provider = value;
                return { dispose: unregister };
            },
        } as unknown as IEngineExplorerService;
        const service = PhysicsExplorerServiceDefinition.factory(explorer, h.watcher, { engine: h.engine }, h.selectionService)!;
        expect(provider.order).toBe(350);
        expect(provider.getNodes(h.scene)).toEqual([]);
        State.worlds.set(h.scene, [h.world]);
        h.watcher.refresh();
        const physics = BuildExplorerTree(provider.getNodes(h.scene)).nodes[0];
        const world = physics.children![0];
        expect(world.children!.map((group) => group.getDisplayInfo().name)).toEqual(["Bodies", "Constraints"]);
        const info = world.children![1].children![0].getDisplayInfo();
        const changed = vi.fn();
        info.onChange!.add(changed);
        h.body.node.name = "Renamed";
        h.watcher.refresh();
        expect(info.name).toBe("Hinge (Renamed ↔ B)");
        expect(changed).toHaveBeenCalledOnce();
        h.selectionService.selectedEntity = h.constraint;
        State.bodies.set(h.world, [h.body]);
        h.watcher.refresh();
        expect(h.selectionService.selectedEntity).toBeNull();
        expect(provider.getSnapshot(h.scene)).not.toContain(h.constraint);
        State.bodies.set(h.world, [h.body, h.other]);
        h.watcher.refresh();
        expect(provider.getSnapshot(h.scene)).toContain(h.constraint);
        for (const entity of [h.constraint, h.body, h.world]) {
            h.selectionService.selectedEntity = entity;
            State.worlds.set(h.scene, []);
            h.watcher.refresh();
            expect(h.selectionService.selectedEntity).toBeNull();
            State.worlds.set(h.scene, [h.world]);
            h.watcher.refresh();
        }
        info.dispose?.();
        service.dispose?.();
        expect(unregister).toHaveBeenCalledOnce();
        NativeReads().forEach((read) => expect(read).not.toHaveBeenCalled());
    });

    it("registers four lazy property contributions with live identity predicates", () => {
        const h = Fixture();
        const add = vi.fn().mockImplementation(() => ({ dispose: vi.fn() }));
        const service = PhysicsPropertiesServiceDefinition.factory({ addSectionContent: add } as unknown as IPropertiesService, { engine: h.engine }, h.selectionService)!;
        const entries = add.mock.calls.map(([entry]) => entry);
        expect(entries.map((entry) => entry.key)).toEqual([
            "Babylon Lite Physics World Properties",
            "Babylon Lite Physics Body Properties",
            "Babylon Lite Physics Constraint Properties",
            "Babylon Lite Node Physics Properties",
        ]);
        expect(entries[1].content.map((entry: { section: string }) => entry.section)).toEqual(["General", "Shape", "Damping", "Velocity", "Mass", "Constraints"]);
        [h.world, h.body, h.constraint, h.body.node].forEach((entity, index) => expect(entries[index].predicate(entity)).toBe(true));
        State.bodies.set(h.world, [h.body]);
        expect(entries[2].predicate(h.constraint)).toBe(false);
        State.worlds.set(h.scene, []);
        expect(entries[0].predicate(h.world)).toBe(false);
        expect(entries[1].predicate(h.body)).toBe(false);
        service.dispose?.();
        add.mock.results.forEach((result) => expect(result.value.dispose).toHaveBeenCalledOnce());
    });
});

describe("Lite physics property parity", () => {
    it("edits gravity and timestep, preserves the other velocity limit and gates stale world callbacks", () => {
        const h = Fixture();
        const container = Render(
            <>
                <Properties.PhysicsWorldGeneralProperties {...h} />
                <Properties.PhysicsWorldSimulationProperties {...h} />
            </>,
            h
        );
        expect(container.textContent).toContain("Bodies2Constraints1");
        Edit(container, "Gravity", { x: 1, y: -2, z: 3 });
        expect(State.setWorldGravity).toHaveBeenCalledWith(h.world, { x: 1, y: -2, z: 3 });
        Edit(container, "Timestep", 0);
        expect(State.setTimestep).toHaveBeenCalledWith(h.world, 0);
        Edit(container, "Max Linear Velocity", 17);
        expect(State.setLimits).toHaveBeenLastCalledWith(h.world, 17, 200);
        Edit(container, "Max Angular Velocity", 18);
        expect(State.setLimits).toHaveBeenLastCalledWith(h.world, 100, 18);
        NativeReads().forEach((read) => read.mockClear());
        State.worlds.set(h.scene, []);
        Edit(container, "Max Linear Velocity", 99);
        act(() => h.watcher.refresh());
        NativeReads().forEach((read) => expect(read).not.toHaveBeenCalled());
        expect(State.setLimits).toHaveBeenCalledTimes(2);
        expect(container.textContent).toBe("");
    });

    it("shows all body fields with instance-zero values, editable fan-out hints, and complete mass writes", () => {
        const h = Fixture();
        State.instances.set(h.body, 3);
        const container = Render(
            <>
                <Properties.PhysicsBodyGeneralProperties {...h} />
                <Properties.PhysicsBodyDampingProperties {...h} />
                <Properties.PhysicsBodyVelocityProperties {...h} />
                <Properties.PhysicsBodyMassProperties {...h} />
                <Properties.PhysicsBodyConstraintProperties {...h} />
            </>,
            h
        );
        expect(container.textContent).toContain("Instance 0 of 3");
        expect(Value(container, "Motion Type")).toBe(2);
        expect(Value(container, "Prestep Type")).toBe(1);
        expect(Value(container, "Linear Damping")).toBe(0.1);
        expect(Value(container, "Angular Damping")).toBe(0.2);
        expect(Value(container, "Gravity Factor")).toBe(1.5);
        expect(Value(container, "Linear Velocity")).toEqual({ x: 1, y: 2, z: 3 });
        expect(Value(container, "Inertia")).toEqual(State.mass.inertia);
        for (const label of [
            "Motion Type",
            "Prestep Type",
            "Linear Damping",
            "Angular Damping",
            "Gravity Factor",
            "Linear Velocity",
            "Angular Velocity",
            "Mass",
            "Center of Mass",
        ]) {
            expect(container.querySelector(`[aria-label="${label}"]`)?.getAttribute("title")).toBe("Applies to all 3 instances");
        }
        Edit(container, "Motion Type", 1);
        expect(State.setMotion).toHaveBeenCalledWith(h.world, h.body, 1);
        Edit(container, "Prestep Type", 2);
        expect(State.setPrestep).toHaveBeenCalledWith(h.body, 2);
        Edit(container, "Linear Damping", 0.4);
        expect(State.setLinear).toHaveBeenCalledWith(h.world, h.body, 0.4);
        Edit(container, "Angular Damping", 0.5);
        expect(State.setAngular).toHaveBeenCalledWith(h.world, h.body, 0.5);
        Edit(container, "Gravity Factor", -2);
        expect(State.setGravity).toHaveBeenCalledWith(h.world, h.body, -2);
        const vector = { x: 7, y: 8, z: 9 };
        Edit(container, "Linear Velocity", vector);
        expect(State.setLinearVelocity).toHaveBeenCalledWith(h.world, h.body, vector);
        Edit(container, "Angular Velocity", vector);
        expect(State.setAngularVelocity).toHaveBeenCalledWith(h.world, h.body, vector);
        Edit(container, "Mass", 3);
        expect(State.setMass).toHaveBeenLastCalledWith(h.world, h.body, { ...State.mass, mass: 3 });
        Edit(container, "Center of Mass", vector);
        expect(State.setMass).toHaveBeenLastCalledWith(h.world, h.body, { ...State.mass, centerOfMass: vector });
        Edit(container, "Inertia", vector);
        expect(State.setMass).toHaveBeenLastCalledWith(h.world, h.body, { ...State.mass, inertia: vector });
        Edit(container, "Node", null);
        expect(h.selectionService.selectedEntity).toBe(h.body.node);
        Edit(container, "World", null);
        expect(h.selectionService.selectedEntity).toBe(h.world);
        Edit(container, "Constraint", null);
        expect(h.selectionService.selectedEntity).toBe(h.constraint);
        for (const read of [State.linearRead, State.angularRead, State.gravityRead]) {
            read.mock.calls.forEach((args) => expect(args[2]).toBe(0));
        }
        for (const read of [State.linearVelocityRead, State.angularVelocityRead]) {
            read.mock.calls.forEach((args) => expect(args[3]).toBe(0));
            expect(new Set(read.mock.calls.map((args) => args[2])).size).toBe(1);
        }
    });

    it("rejects non-finite mass and vector components while preserving valid mass writes", () => {
        const h = Fixture();
        const container = Render(<Properties.PhysicsBodyMassProperties {...h} />, h);
        for (const invalid of [NaN, Infinity, -Infinity]) {
            Edit(container, "Mass", invalid);
            for (const label of ["Center of Mass", "Inertia"]) {
                for (const axis of ["x", "y", "z"]) {
                    Edit(container, label, { x: 1, y: 2, z: 3, [axis]: invalid });
                }
                for (let index = 0; index < 3; index++) {
                    const tuple = [1, 2, 3];
                    tuple[index] = invalid;
                    Edit(container, label, tuple);
                }
            }
        }
        expect(State.setMass).not.toHaveBeenCalled();
        Edit(container, "Mass", 0);
        expect(State.setMass).toHaveBeenLastCalledWith(h.world, h.body, { ...State.mass, mass: 0 });
        Edit(container, "Center of Mass", [0, -2, 3]);
        expect(State.setMass).toHaveBeenLastCalledWith(h.world, h.body, { ...State.mass, centerOfMass: { x: 0, y: -2, z: 3 } });
        Edit(container, "Inertia", { x: 0, y: 4, z: 5 });
        expect(State.setMass).toHaveBeenLastCalledWith(h.world, h.body, { ...State.mass, inertia: { x: 0, y: 4, z: 5 } });
        expect(State.setMass).toHaveBeenCalledTimes(3);
    });

    it.each([1, 3])("reads back sequential edits while preserving unedited fields for %i instance(s)", (count) => {
        const h = Fixture();
        State.instances.set(h.body, count);
        let instances = Array.from({ length: count }, () => structuredClone(State.mass));
        State.massRead.mockImplementation((_world, _body, out, index) => Object.assign(out, structuredClone(instances[index])));
        State.setMass.mockImplementation((_world, _body, properties: PhysicsMassProperties) => {
            // Match Lite: omitted properties are rebuilt, not merged with previous edits.
            instances = instances.map(() => ({ ...structuredClone(State.mass), ...structuredClone(properties) }));
        });
        const container = Render(<Properties.PhysicsBodyMassProperties {...h} />, h);
        Edit(container, "Mass", 7);
        const center = { x: 8, y: 9, z: 10 };
        Edit(container, "Center of Mass", center);
        expect(Value(container, "Mass")).toBe(7);
        expect(Value(container, "Center of Mass")).toEqual(center);
        expect(Value(container, "Inertia")).toEqual(State.mass.inertia);
        // Change current values without a watcher tick: the next write must read them again.
        instances.forEach((instance) => (instance.mass = 11));
        const inertia = { x: 3, y: 12, z: 13 };
        Edit(container, "Inertia", inertia);
        for (const instance of instances) {
            expect(instance).toEqual({ ...State.mass, mass: 11, centerOfMass: center, inertia });
        }
        expect(Value(container, "Mass")).toBe(11);
        State.setMass.mockReset();
    });

    it("refuses a thin fan-out mass edit before writing if it would replace another instance's unedited values", () => {
        const h = Fixture();
        State.instances.set(h.body, 3);
        const instances = [structuredClone(State.mass), { ...structuredClone(State.mass), inertia: { x: 6, y: 7, z: 8 } }, structuredClone(State.mass)];
        const before = structuredClone(instances);
        State.massRead.mockImplementation((_world, _body, out, index) => Object.assign(out, instances[index]));
        const container = Render(<Properties.PhysicsBodyMassProperties {...h} />, h);
        Edit(container, "Mass", 7);
        expect(State.setMass).not.toHaveBeenCalled();
        expect(instances).toEqual(before);
        expect(container.textContent).toContain("instances have different unedited values");
    });

    it.each([0, 1])("refuses mass edits when instance %i has locked/zero inertia, without overwriting the pre-lock restoration tensor", (lockedIndex) => {
        const h = Fixture();
        State.instances.set(h.body, 2);
        const instances = [structuredClone(State.mass), structuredClone(State.mass)];
        instances[lockedIndex].inertia.x = 0;
        const before = structuredClone(instances);
        State.massRead.mockImplementation((_world, _body, out, index) => Object.assign(out, instances[index]));
        const container = Render(<Properties.PhysicsBodyMassProperties {...h} />, h);
        for (const [label, value] of [
            ["Mass", 7],
            ["Center of Mass", { x: 8, y: 9, z: 10 }],
            ["Inertia", { x: 11, y: 12, z: 13 }],
        ] as const) {
            Edit(container, label, value);
            expect(State.setMass).not.toHaveBeenCalled();
            expect(instances).toEqual(before);
            expect(container.textContent).toContain("Cannot safely edit mass properties with zero inertia");
        }
    });

    it("updates body and node world links when an earlier world is removed, with the selected body still live", () => {
        const h = Fixture();
        const earlier = {} as PhysicsWorld;
        State.worlds.set(h.scene, [earlier, h.world]);
        const container = Render(
            <>
                <Properties.PhysicsBodyGeneralProperties {...h} />
                <Properties.NodePhysicsProperties {...h} node={h.body.node} />
            </>,
            h
        );
        h.selectionService.selectedEntity = h.body;
        expect(Value(container, "World")).toBe("Physics World [1]");
        expect(Value(container, "Physics Body (World [1])")).toBe("A (Body)");
        State.worlds.set(h.scene, [h.world]);
        act(() => h.watcher.refresh());
        expect(Value(container, "World")).toBe("Physics World [0]");
        expect(Value(container, "Physics Body (World [0])")).toBe("A (Body)");
        expect(h.selectionService.selectedEntity).toBe(h.body);
    });

    it("uses fresh shapes for edits, preserves the other material values, sanitizes masks and explains sharing", () => {
        const h = Fixture();
        State.instances.set(h.body, 3);
        const container = Render(<Properties.PhysicsBodyShapeProperties {...h} />, h);
        expect(container.textContent).toContain("Shape shared by 2 bodies");
        for (const label of ["Center", "Extents", "Rotation"]) {
            expect(container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.disabled).toBe(true);
        }
        Edit(container, "Dynamic Friction", 0.9);
        expect(State.setMaterial).toHaveBeenLastCalledWith(h.world, h.shape, 0.9, 0.3, 0.7);
        Edit(container, "Static Friction", 0.8);
        expect(State.setMaterial).toHaveBeenLastCalledWith(h.world, h.shape, 0.2, 0.3, 0.8);
        Edit(container, "Restitution", 0.6);
        expect(State.setMaterial).toHaveBeenLastCalledWith(h.world, h.shape, 0.2, 0.6, 0.7);
        Edit(container, "Membership Mask", 4294967297);
        expect(State.setMembership).toHaveBeenLastCalledWith(h.world, h.shape, 1);
        Edit(container, "Collide Mask", -1);
        expect(State.setCollide).toHaveBeenLastCalledWith(h.world, h.shape, 0xffffffff);
        Edit(container, "Collide Mask", NaN);
        expect(State.setCollide).toHaveBeenCalledOnce();
        const replacement = { type: 5, parameters: null } as unknown as PhysicsShape;
        State.shapes.set(h.body, replacement);
        Edit(container, "Dynamic Friction", 0.4);
        expect(State.setMaterial).toHaveBeenLastCalledWith(h.world, replacement, 0.4, 0.3, 0.7);
        expect(container.textContent).toContain("Parameters not available for Container shapes");
        expect(container.textContent).toContain("Child Count4");
        State.shapes.set(h.body, null);
        act(() => h.watcher.refresh());
        expect(container.textContent).toContain("No shape attached");
        expect(container.querySelector('[aria-label="Dynamic Friction"]')).toBeNull();
    });

    it("isolates mass read errors, surfaces native write errors, and never reads or writes a dead body", () => {
        const h = Fixture();
        State.massRead.mockImplementation(() => {
            throw new Error("Mass unavailable");
        });
        const container = Render(
            <>
                <Properties.PhysicsBodyDampingProperties {...h} />
                <Properties.PhysicsBodyMassProperties {...h} />
                <Properties.PhysicsBodyShapeProperties {...h} />
                <Properties.PhysicsBodyVelocityProperties {...h} />
            </>,
            h
        );
        expect(container.textContent).toContain("Mass unavailable");
        expect(Value(container, "Linear Damping")).toBe(0.1);
        State.setLinear.mockImplementationOnce(() => {
            throw new Error("Native write failed");
        });
        Edit(container, "Linear Damping", 0.5);
        expect(container.textContent).toContain("Native write failed");
        NativeReads().forEach((read) => read.mockClear());
        State.bodies.set(h.world, [h.other]);
        Edit(container, "Dynamic Friction", 0.1);
        act(() => h.watcher.refresh());
        NativeReads().forEach((read) => expect(read).not.toHaveBeenCalled());
        expect(State.setMaterial).not.toHaveBeenCalled();
        expect(container.textContent).toBe("");
    });

    it("renders constraint identity, frames, limits and enabled editing, but never calls native after endpoint loss", () => {
        const h = Fixture();
        State.instances.set(h.other, 3);
        const container = Render(
            <>
                <Properties.PhysicsConstraintGeneralProperties {...h} />
                <Properties.PhysicsConstraintFrameProperties {...h} />
                <Properties.PhysicsConstraintLimitProperties {...h} />
            </>,
            h
        );
        expect(container.textContent).toContain("TypeHinge");
        expect(container.textContent).toContain("Constraint binds instance 0 only.");
        expect(container.textContent).toContain("Min: -1, Max: 2, Stiffness: 3, Damping: 4");
        expect(Value(container, "Pivot A")).toEqual({ x: 0, y: 0, z: 0 });
        expect(Value(container, "Axis A")).toEqual({ x: 1, y: 0, z: 0 });
        Edit(container, "Enabled", false);
        expect(State.setEnabled).toHaveBeenCalledExactlyOnceWith(h.world, h.constraint, false);
        Edit(container, "Body A", null);
        expect(h.selectionService.selectedEntity).toBe(h.body);
        Edit(container, "Body B", null);
        expect(h.selectionService.selectedEntity).toBe(h.other);
        State.enabledRead.mockClear();
        State.bodies.set(h.world, [h.other]);
        Edit(container, "Enabled", true);
        act(() => h.watcher.refresh());
        expect(State.enabledRead).not.toHaveBeenCalled();
        expect(container.textContent).toBe("");
    });

    it("shows distance, no limits, node body links across worlds and no-body guidance", () => {
        const h = Fixture();
        Object.assign(h.constraint, { type: 2, limits: [], options: { maxDistance: 7 } });
        const container = Render(
            <>
                <Properties.PhysicsConstraintFrameProperties {...h} />
                <Properties.PhysicsConstraintLimitProperties {...h} />
                <Properties.NodePhysicsProperties {...h} node={h.body.node} />
            </>,
            h
        );
        expect(container.textContent).toContain("Max Distance7");
        expect(container.textContent).toContain("No limits");
        Edit(container, "Physics Body (World [0])", null);
        expect(h.selectionService.selectedEntity).toBe(h.body);
        State.bodies.set(h.world, [h.other]);
        act(() => h.watcher.refresh());
        expect(container.textContent).toContain("No Physics Body");
        State.bodies.set(h.world, [h.body, h.other]);
        const world2 = {} as PhysicsWorld;
        const body2 = { node: h.body.node } as PhysicsBody;
        State.worlds.get(h.scene)!.push(world2);
        State.bodies.set(world2, [body2]);
        State.owners.set(body2, world2);
        act(() => h.watcher.refresh());
        Edit(container, "Physics Body (World [1])", null);
        expect(h.selectionService.selectedEntity).toBe(body2);
    });
});

import { Vector3 } from "core/Maths/math.vector";
import { type TransformNode } from "core/Meshes/transformNode";
import { PhysicsPrestepType } from "core/Physics/v2/IPhysicsEnginePlugin";
import { HavokPlugin } from "core/Physics/v2/Plugins/havokPlugin";
import { type PhysicsBody } from "core/Physics/v2/physicsBody";
import { PhysicsRaycastResult } from "core/Physics/physicsRaycastResult";
import { FloatingOriginCurrentScene } from "core/Materials/floatingOriginMatrixOverrides";
import { type Scene } from "core/scene";
import { afterEach, describe, expect, it, vi } from "vitest";

interface TestWorldRegion {
    world: bigint;
    floatingOrigin: Vector3;
    gravity: number[];
}

function createPlugin(worldRegions: TestWorldRegion[], initialBodyCounts: ReadonlyMap<bigint, number>) {
    const bodyCounts = new Map(initialBodyCounts);
    const executionOrder: string[] = [];
    const hknp = {
        HP_Body_GetAngularVelocity: vi.fn(() => [0, [0, 0, 0]]),
        HP_Body_GetLinearVelocity: vi.fn(() => [0, [0, 0, 0]]),
        HP_Body_GetWorldTransformOffset: vi.fn(() => [0, 0]),
        HP_Body_SetAngularVelocity: vi.fn(),
        HP_Body_SetLinearVelocity: vi.fn(),
        HP_Body_SetQTransform: vi.fn(),
        HP_World_AddBody: vi.fn((world: bigint) => {
            bodyCounts.set(world, (bodyCounts.get(world) ?? 0) + 1);
        }),
        HP_World_GetCollisionEvents: vi.fn(() => {
            executionOrder.push("collisions");
            return [0, 0];
        }),
        HP_World_GetNumBodies: vi.fn((world: bigint) => [0, bodyCounts.get(world) ?? 0]),
        HP_World_GetTriggerEvents: vi.fn(() => {
            executionOrder.push("triggers");
            return [0, 0];
        }),
        HP_World_Release: vi.fn(),
        HP_World_RemoveBody: vi.fn((world: bigint) => {
            bodyCounts.set(world, (bodyCounts.get(world) ?? 0) - 1);
        }),
        HP_World_SetIdealStepTime: vi.fn(),
        HP_World_Step: vi.fn(() => {
            executionOrder.push("step");
        }),
    };
    hknp.HP_World_Release.mockImplementation(() => {
        executionOrder.push("release");
    });
    const plugin = Object.assign(Object.create(HavokPlugin.prototype), {
        _hknp: hknp,
        _worldRegions: worldRegions,
        _worldRegionsPendingRelease: new Set(),
        _bodyCollisionObservable: new Map(),
        _bodies: new Map(),
        _fixedTimeStep: 1 / 60,
        _floatingOriginWorldRadius: 100_000,
        _useDeltaForWorldStep: false,
    }) as HavokPlugin;

    return { plugin, hknp, executionOrder };
}

function createBody(worldRegion: TestWorldRegion): PhysicsBody {
    return {
        _pluginData: { hpBodyId: [1n], worldRegion },
        _pluginDataInstances: [],
    } as unknown as PhysicsBody;
}

describe("HavokPlugin world region lifecycle", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("releases a non-default world region when its last body is removed", () => {
        const defaultRegion = { world: 1n, floatingOrigin: Vector3.Zero(), gravity: [0, 0, 0] };
        const distantRegion = { world: 2n, floatingOrigin: new Vector3(200_000, 0, 0), gravity: [0, 0, 0] };
        const worldRegions = [defaultRegion, distantRegion];
        const { plugin, hknp, executionOrder } = createPlugin(worldRegions, new Map([[distantRegion.world, 1]]));

        plugin.removeBody(createBody(distantRegion));
        expect(hknp.HP_World_Release).not.toHaveBeenCalled();

        plugin.executeStep(1 / 60, []);

        expect(hknp.HP_World_Release).toHaveBeenCalledExactlyOnceWith(distantRegion.world);
        expect(worldRegions).toEqual([defaultRegion]);
        expect(executionOrder.at(-1)).toBe("release");
    });

    it("keeps a non-default world region while it still contains a body", () => {
        const defaultRegion = { world: 1n, floatingOrigin: Vector3.Zero(), gravity: [0, 0, 0] };
        const distantRegion = { world: 2n, floatingOrigin: new Vector3(200_000, 0, 0), gravity: [0, 0, 0] };
        const worldRegions = [defaultRegion, distantRegion];
        const { plugin, hknp } = createPlugin(worldRegions, new Map([[distantRegion.world, 2]]));

        plugin.removeBody(createBody(distantRegion));
        plugin.executeStep(1 / 60, []);

        expect(hknp.HP_World_Release).not.toHaveBeenCalled();
        expect(worldRegions).toEqual([defaultRegion, distantRegion]);
    });

    it("never releases the default world region", () => {
        const defaultRegion = { world: 1n, floatingOrigin: Vector3.Zero(), gravity: [0, 0, 0] };
        const worldRegions = [defaultRegion];
        const { plugin, hknp } = createPlugin(worldRegions, new Map([[defaultRegion.world, 1]]));

        plugin.removeBody(createBody(defaultRegion));
        plugin.executeStep(1 / 60, []);

        expect(hknp.HP_World_Release).not.toHaveBeenCalled();
        expect(worldRegions).toEqual([defaultRegion]);
    });

    it("releases an empty non-default region after a body teleports to another region", () => {
        const defaultRegion = { world: 1n, floatingOrigin: Vector3.Zero(), gravity: [0, 0, 0] };
        const previousRegion = { world: 2n, floatingOrigin: new Vector3(200_000, 0, 0), gravity: [0, 0, 0] };
        const destinationRegion = { world: 3n, floatingOrigin: new Vector3(500_000, 0, 0), gravity: [0, 0, 0] };
        const worldRegions = [defaultRegion, previousRegion, destinationRegion];
        const { plugin, hknp } = createPlugin(
            worldRegions,
            new Map([
                [previousRegion.world, 1],
                [destinationRegion.world, 0],
            ])
        );
        const transformNode = {
            parent: null,
            position: destinationRegion.floatingOrigin.clone(),
            rotation: Vector3.Zero(),
            rotationQuaternion: null,
        } as unknown as TransformNode;
        const body = {
            _pluginData: { hpBodyId: [1n], worldRegion: previousRegion },
            _pluginDataInstances: [],
            getPrestepType: () => PhysicsPrestepType.TELEPORT,
            numInstances: 0,
            transformNode,
        } as unknown as PhysicsBody;
        vi.spyOn(FloatingOriginCurrentScene, "getScene").mockReturnValue({ floatingOriginMode: true } as Scene);

        plugin.setPhysicsBodyTransformation(body, transformNode);

        expect(hknp.HP_World_Release).toHaveBeenCalledWith(previousRegion.world);
        expect(worldRegions).toEqual([defaultRegion, destinationRegion]);
        expect(body._pluginData.worldRegion).toBe(destinationRegion);
    });
});

describe("HavokPlugin queries with no available world region", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Reproduces https://forum.babylonjs.com/t/havok-crash-in-raycast-worldregion-floatingorigin/63815
    // When the world regions array is empty (e.g. a query is issued after the plugin has been disposed,
    // which clears _worldRegions), reading `this._worldRegions[0].floatingOrigin` used to crash.
    it("does not crash when raycasting while the world regions array is empty", () => {
        const { plugin, hknp } = createPlugin([], new Map());
        const result = new PhysicsRaycastResult();

        expect(() => plugin.raycast(new Vector3(0, 0, 0), new Vector3(0, 0, 10), result)).not.toThrow();

        expect(result.hasHit).toBe(false);
        expect(hknp.HP_World_Release).not.toHaveBeenCalled();
    });

    it("populates every result of a multi-raycast with no hit when there is no world region", () => {
        const { plugin } = createPlugin([], new Map());
        const results = [new PhysicsRaycastResult(), new PhysicsRaycastResult()];

        expect(() => plugin.raycast(new Vector3(0, 0, 0), new Vector3(0, 0, 10), results)).not.toThrow();

        expect(results.every((r) => !r.hasHit)).toBe(true);
    });

    it("does not crash when a disposed plugin is raycasted", () => {
        const worldRegions = [{ world: 1n, floatingOrigin: Vector3.Zero(), gravity: [0, 0, 0] }];
        const { plugin } = createPlugin(worldRegions, new Map());
        // dispose() empties _worldRegions, mirroring the real teardown path.
        worldRegions.length = 0;
        const result = new PhysicsRaycastResult();

        expect(() => plugin.raycast(new Vector3(0, 0, 0), new Vector3(0, 0, 10), result)).not.toThrow();
        expect(result.hasHit).toBe(false);
    });

    // After dispose() the worlds are released and _worldRegions is cleared, but a body kept alive by the caller
    // still holds a stale worldRegion reference. Passing it as ignoreBody must NOT be used to query Havok, or we
    // would call into an already-released world handle. The mock hknp has no HP_World_CastRayWithCollector, so
    // reaching the native query would throw - not throwing proves we bailed out before touching Havok.
    it("does not query Havok when world regions are empty but ignoreBody carries a stale region", () => {
        const staleRegion = { world: 99n, floatingOrigin: new Vector3(1, 2, 3), gravity: [0, 0, 0] };
        const { plugin } = createPlugin([], new Map());
        const ignoreBody = { _pluginData: { hpBodyId: [7n], worldRegion: staleRegion } } as unknown as PhysicsBody;
        const result = new PhysicsRaycastResult();

        expect(() => plugin.raycast(new Vector3(0, 0, 0), new Vector3(0, 0, 10), result, { ignoreBody })).not.toThrow();
        expect(result.hasHit).toBe(false);
    });
});

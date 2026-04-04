/**
 * SelectionOutlineLayer + Instanced Meshes — Bug Reproduction
 *
 * Bug: addSelection() registers instanceSelectionId on the SOURCE mesh
 * (via sourceMesh.registerInstancedBuffer), but clearSelection() only
 * iterates _selection (which contains the InstancedMesh, not the source).
 * The source mesh's instancedBuffers and _userInstancedBuffersStorage
 * retain a stale instanceSelectionId key. On the next render,
 * _processInstancedBuffers iterates that key, reads deleted storage,
 * and crashes: "Cannot read properties of undefined (reading 'instanceSelectionId')"
 */

import "core/Meshes/instancedMesh";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import type { Mesh } from "core/Meshes/mesh";

describe("SelectionOutlineLayer instanced buffer cleanup", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const SELECTION_ID = "instanceSelectionId";

    /**
     * Simulates what clearSelection does to a mesh it finds in _selection.
     * This is an exact copy of the cleanup logic in ThinSelectionOutlineLayer.clearSelection().
     */
    function simulateClearSelectionForMesh(mesh: Mesh): void {
        if (mesh._userInstancedBuffersStorage) {
            mesh._userInstancedBuffersStorage.vertexBuffers[SELECTION_ID]?.dispose();
            delete mesh._userInstancedBuffersStorage.data[SELECTION_ID];
            delete mesh._userInstancedBuffersStorage.vertexBuffers[SELECTION_ID];
            delete mesh._userInstancedBuffersStorage.strides[SELECTION_ID];
            delete mesh._userInstancedBuffersStorage.sizes[SELECTION_ID];

            if (Object.keys(mesh._userInstancedBuffersStorage.vertexBuffers).length === 0) {
                mesh._userInstancedBuffersStorage = undefined!;
            }
        }
        if (mesh.instancedBuffers?.[SELECTION_ID] !== undefined) {
            delete mesh.instancedBuffers[SELECTION_ID];
        }
    }

    test("addSelection registers instanceSelectionId on source mesh, not the instance in _selection", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        // addSelection pushes `instance` to _selection, but registers on `source`
        source.registerInstancedBuffer(SELECTION_ID, 1);
        instance.instancedBuffers[SELECTION_ID] = 1;

        // Source has the buffer registered
        expect(source.instancedBuffers[SELECTION_ID]).toBeDefined();
        expect(source._userInstancedBuffersStorage).toBeDefined();
        expect(source._userInstancedBuffersStorage.data[SELECTION_ID]).toBeDefined();

        // clearSelection only processes the instance (which was in _selection)
        simulateClearSelectionForMesh(instance as unknown as Mesh);

        // Instance is cleaned up
        expect(instance.instancedBuffers[SELECTION_ID]).toBeUndefined();

        // BUG: Source mesh still has stale instanceSelectionId key and storage
        expect(SELECTION_ID in source.instancedBuffers).toBe(true);
        expect(source._userInstancedBuffersStorage).toBeDefined();
    });

    test("_processInstancedBuffers crashes on stale instanceSelectionId after clearSelection", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        // Simulate addSelection
        source.registerInstancedBuffer(SELECTION_ID, 1);
        instance.instancedBuffers[SELECTION_ID] = 1;

        // Simulate clearSelection (only processes the instance, not the source)
        simulateClearSelectionForMesh(instance as unknown as Mesh);

        // Source still has stale key — _processInstancedBuffers iterates it
        // and reads source._userInstancedBuffersStorage.data["instanceSelectionId"]
        // which was NOT deleted (clearSelection didn't touch the source).
        //
        // However, if _userInstancedBuffersStorage WAS cleaned up on the source
        // (e.g. because it was also in _selection), then data[kind] is undefined
        // and .length crashes.
        //
        // Reproduce the crash: clean up storage on source (as if clearSelection
        // had processed it) but leave the instancedBuffers key
        delete source._userInstancedBuffersStorage.data[SELECTION_ID];
        delete source._userInstancedBuffersStorage.strides[SELECTION_ID];
        delete source._userInstancedBuffersStorage.sizes[SELECTION_ID];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processInstancedBuffers = (source as any)._processInstancedBuffers;
        expect(processInstancedBuffers).toBeDefined();

        // This is the crash: iterates "instanceSelectionId" in source.instancedBuffers,
        // reads source._userInstancedBuffersStorage.data["instanceSelectionId"] → undefined,
        // then accesses .length → TypeError
        expect(() => {
            processInstancedBuffers.call(source, [instance], true);
        }).toThrow();
    });

    test("clearSelection should also clean up source mesh when instance is in _selection", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        // Simulate addSelection
        source.registerInstancedBuffer(SELECTION_ID, 1);
        instance.instancedBuffers[SELECTION_ID] = 1;

        // Simulate FIXED clearSelection: also clean up the source mesh
        simulateClearSelectionForMesh(instance as unknown as Mesh);

        // FIX: clearSelection should also process sourceMesh for InstancedMesh entries
        const sourceMesh = instance.sourceMesh;
        if (sourceMesh._userInstancedBuffersStorage) {
            delete sourceMesh._userInstancedBuffersStorage.data[SELECTION_ID];
            delete sourceMesh._userInstancedBuffersStorage.vertexBuffers[SELECTION_ID];
            delete sourceMesh._userInstancedBuffersStorage.strides[SELECTION_ID];
            delete sourceMesh._userInstancedBuffersStorage.sizes[SELECTION_ID];
        }
        if (sourceMesh.instancedBuffers?.[SELECTION_ID] !== undefined) {
            delete sourceMesh.instancedBuffers[SELECTION_ID];
        }

        // After fix: source has no stale key
        expect(SELECTION_ID in source.instancedBuffers).toBe(false);

        // _processInstancedBuffers should not crash
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processInstancedBuffers = (source as any)._processInstancedBuffers;
        expect(() => {
            processInstancedBuffers.call(source, [instance], true);
        }).not.toThrow();
    });
});

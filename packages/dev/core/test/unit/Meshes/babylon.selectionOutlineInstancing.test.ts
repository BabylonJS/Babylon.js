/**
 * SelectionOutlineLayer + Instanced Meshes — Bug Reproduction & Fix Validation
 *
 * Bug: addSelection() registers instanceSelectionId on the source mesh
 * (via sourceMesh.registerInstancedBuffer), but clearSelection() only
 * iterates _selection (which contains the InstancedMesh, not the source).
 * The source retains a stale instanceSelectionId key that crashes
 * _processInstancedBuffers on the next render.
 */

import "core/Meshes/instancedMesh";
import "core/Layers/effectLayerSceneComponent";
import "core/Rendering/depthRendererSceneComponent";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { FreeCamera } from "core/Cameras/freeCamera";
import type { Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { SelectionOutlineLayer } from "core/Layers/selectionOutlineLayer";

const SELECTION_ID = "instanceSelectionId";

describe("SelectionOutlineLayer instanced buffer cleanup", () => {
    let engine: NullEngine;
    let scene: Scene;
    let layer: SelectionOutlineLayer;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        scene.activeCamera = new FreeCamera("cam", Vector3.Zero(), scene);
        layer = new SelectionOutlineLayer("test", scene);
    });

    afterEach(() => {
        layer.dispose();
        scene.dispose();
        engine.dispose();
    });

    // Verifies the precondition: addSelection touches the source mesh
    test("addSelection registers instanceSelectionId on source mesh", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        layer.addSelection([instance]);

        expect(source.instancedBuffers).toBeDefined();
        expect(SELECTION_ID in source.instancedBuffers).toBe(true);
        expect(source._userInstancedBuffersStorage).toBeDefined();
        expect(source._userInstancedBuffersStorage.data[SELECTION_ID]).toBeDefined();
    });

    // Core bug: clearSelection must remove the stale key from the source
    test("clearSelection removes instanceSelectionId from source mesh instancedBuffers", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        layer.addSelection([instance]);
        layer.clearSelection();

        // The key must be gone — if it remains, _processInstancedBuffers will
        // iterate it and crash reading deleted storage
        if (source.instancedBuffers) {
            expect(SELECTION_ID in source.instancedBuffers).toBe(false);
        }
    });

    // Core bug: clearSelection must clean up source mesh GPU storage
    test("clearSelection removes instanceSelectionId from source mesh storage", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        layer.addSelection([instance]);
        layer.clearSelection();

        if (source._userInstancedBuffersStorage) {
            expect(source._userInstancedBuffersStorage.data[SELECTION_ID]).toBeUndefined();
            expect(source._userInstancedBuffersStorage.strides[SELECTION_ID]).toBeUndefined();
            expect(source._userInstancedBuffersStorage.sizes[SELECTION_ID]).toBeUndefined();
        }
    });

    // The actual crash: _processInstancedBuffers after clearSelection when
    // the source's _userInstancedBuffersStorage has been partially cleaned up
    test("_processInstancedBuffers does not crash after add + clear cycle", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const inst1 = source.createInstance("inst1");
        const inst2 = source.createInstance("inst2");

        // Cycle: add instance, clear, then call _processInstancedBuffers.
        // Without the fix, source.instancedBuffers still has the stale key,
        // and source._userInstancedBuffersStorage.data[kind] was deleted by
        // clearSelection when it processed the source (which it shouldn't
        // have found, but may in some code paths). The definitive crash path
        // is: stale key + deleted storage.data → undefined.length → TypeError.
        layer.addSelection([inst1]);
        layer.clearSelection();

        // After clearSelection, force a stale-state scenario on the source:
        // delete storage entries but leave the instancedBuffers key.
        // This is what happens when clearSelection partially cleans up.
        if (source.instancedBuffers && SELECTION_ID in source.instancedBuffers) {
            if (source._userInstancedBuffersStorage) {
                delete source._userInstancedBuffersStorage.data[SELECTION_ID];
                delete source._userInstancedBuffersStorage.strides[SELECTION_ID];
                delete source._userInstancedBuffersStorage.sizes[SELECTION_ID];
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processInstancedBuffers = (source as any)._processInstancedBuffers;
        expect(processInstancedBuffers).toBeDefined();

        // With the fix, the key was already deleted by clearSelection,
        // so this forced corruption has no effect. Without the fix, the key
        // persists and this crashes.
        expect(() => {
            processInstancedBuffers.call(source, [inst1, inst2], true);
        }).not.toThrow();
    });

    // _disposeMesh must clean up _instancedBufferSources to prevent GC leaks
    test("_disposeMesh removes source mesh from tracking when instance is disposed", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const instance = source.createInstance("inst");

        layer.addSelection([instance]);

        // Source is registered on the thin layer's tracking set
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thinLayer = (layer as any)._thinEffectLayer;
        expect(thinLayer._instancedBufferSources.has(source)).toBe(true);

        // Simulate the effect layer being notified of mesh disposal
        // (in practice, the scene component calls this when a mesh is disposed)
        layer._disposeMesh(instance as unknown as Mesh);

        // Source should be removed from tracking
        expect(thinLayer._instancedBufferSources.has(source)).toBe(false);
    });

    // Edge case: multiple instances from the same source — disposing one
    // must not remove the source from tracking while another is still selected
    test("_disposeMesh keeps source tracked when another instance from same source is still selected", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        const inst1 = source.createInstance("inst1");
        const inst2 = source.createInstance("inst2");

        layer.addSelection([inst1, inst2]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thinLayer = (layer as any)._thinEffectLayer;
        expect(thinLayer._instancedBufferSources.has(source)).toBe(true);

        // Dispose one instance — source should remain tracked
        layer._disposeMesh(inst1 as unknown as Mesh);
        expect(thinLayer._instancedBufferSources.has(source)).toBe(true);

        // clearSelection should still clean up the source
        layer.clearSelection();
        if (source.instancedBuffers) {
            expect(SELECTION_ID in source.instancedBuffers).toBe(false);
        }
    });

    // Source mesh passed directly (hasInstances, not isAnInstance)
    test("clearSelection cleans up source mesh passed directly to addSelection", () => {
        const source = MeshBuilder.CreateBox("source", { size: 1 }, scene);
        source.createInstance("inst");

        // Pass source mesh directly — it has hasInstances=true,
        // so addSelection registers instanceSelectionId on itself
        layer.addSelection([source]);
        expect(SELECTION_ID in source.instancedBuffers).toBe(true);

        layer.clearSelection();

        if (source.instancedBuffers) {
            expect(SELECTION_ID in source.instancedBuffers).toBe(false);
        }
    });
});

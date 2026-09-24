import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";

describe("Scene entity collection blocking", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("collects entities normally when no block is requested", () => {
        const mesh = scene._executeWithBlockedEntityCollection(false, () => new Mesh("mesh", scene));

        expect(scene.meshes).toEqual([mesh]);
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("blocks collection only for the requested scope", () => {
        const mesh = scene._executeWithBlockedEntityCollection(true, () => new Mesh("mesh", scene));

        expect(scene.meshes).toHaveLength(0);
        expect(scene._blockEntityCollection).toBe(false);
        mesh.dispose();
    });

    it("does not weaken a pre-existing block in nested scopes", () => {
        scene._blockEntityCollection = true;

        scene._executeWithBlockedEntityCollection(false, () => {
            expect(scene._blockEntityCollection).toBe(true);
            scene._executeWithBlockedEntityCollection(true, () => {
                expect(scene._blockEntityCollection).toBe(true);
            });
            expect(scene._blockEntityCollection).toBe(true);
        });

        expect(scene._blockEntityCollection).toBe(true);
    });

    it("restores the previous state when entity construction throws", () => {
        const error = new Error("Entity construction failed");
        const addMesh = vi.spyOn(scene, "addMesh").mockImplementation(() => {
            throw error;
        });

        expect(() => scene._executeWithBlockedEntityCollection(false, () => new Mesh("mesh", scene))).toThrow(error);
        expect(addMesh).toHaveBeenCalledOnce();
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("restores the previous state when an asynchronous scope rejects", async () => {
        const error = new Error("Async entity construction failed");

        await expect(
            scene._executeWithBlockedEntityCollectionAsync(true, async () => {
                expect(scene._blockEntityCollection).toBe(true);
                throw error;
            })
        ).rejects.toThrow(error);
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("restores overlapping asynchronous scopes in completion order", async () => {
        let resolveFirst!: () => void;
        let resolveSecond!: () => void;
        const first = scene._executeWithBlockedEntityCollectionAsync(
            true,
            async () =>
                await new Promise<void>((resolve) => {
                    resolveFirst = resolve;
                })
        );
        const second = scene._executeWithBlockedEntityCollectionAsync(
            true,
            async () =>
                await new Promise<void>((resolve) => {
                    resolveSecond = resolve;
                })
        );

        expect(scene._blockEntityCollection).toBe(true);
        resolveFirst();
        await first;
        expect(scene._blockEntityCollection).toBe(true);
        resolveSecond();
        await second;
        expect(scene._blockEntityCollection).toBe(false);
    });
});

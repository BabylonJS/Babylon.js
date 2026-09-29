import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Camera } from "core/Cameras/camera";
import { type FrameGraph } from "core/FrameGraph/frameGraph";
import { type FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";
import { FrameGraphCullObjectsTask } from "core/FrameGraph/Tasks/Misc/cullObjectsTask";
import { type Scene } from "core/scene";
import { type ISpriteManager } from "core/Sprites/spriteManager";

describe("FrameGraphCullObjectsTask sprite manager selection", () => {
    let scene: Scene;
    let task: FrameGraphCullObjectsTask;
    let spriteManager: ISpriteManager;
    let executeEnabled: () => void;
    let executeDisabled: () => void;

    beforeEach(() => {
        scene = {
            _activeMeshesFrozen: false,
            meshes: [],
            skipFrustumClipping: false,
        } as unknown as Scene;
        const frameGraph = {
            addObjectListPass: vi.fn((_name: string, whenTaskDisabled = false) => ({
                setObjectList: vi.fn(),
                setExecuteFunc: vi.fn((execute: () => void) => {
                    if (whenTaskDisabled) {
                        executeDisabled = execute;
                    } else {
                        executeEnabled = execute;
                    }
                }),
            })),
        } as unknown as FrameGraph;
        task = new FrameGraphCullObjectsTask("cull", frameGraph, scene);
        task.camera = {
            layerMask: 0xffffffff,
            _frustumPlanes: [],
            _updateFrustumPlanes: vi.fn(),
        } as unknown as Camera;
        spriteManager = {} as ISpriteManager;
    });

    it.each(["omitted", "null", "empty", "subset"] as const)("preserves a %s selection through enabled, frozen, and disabled paths", (selectionKind) => {
        let spriteManagers: ISpriteManager[] | null | undefined;
        switch (selectionKind) {
            case "null":
                spriteManagers = null;
                break;
            case "empty":
                spriteManagers = [];
                break;
            case "subset":
                spriteManagers = [spriteManager];
                break;
        }
        const objectList: FrameGraphObjectList = {
            meshes: [],
            particleSystems: [],
        };
        if (selectionKind !== "omitted") {
            objectList.spriteManagers = spriteManagers;
        }
        task.objectList = objectList;

        task.record();

        expect(task.outputObjectList.spriteManagers).toBe(spriteManagers);

        task.outputObjectList.spriteManagers = spriteManagers === null ? [] : null;
        executeEnabled();
        expect(task.outputObjectList.spriteManagers).toBe(spriteManagers);

        const frozenMeshes = task.outputObjectList.meshes;
        scene._activeMeshesFrozen = true;
        task.outputObjectList.spriteManagers = spriteManagers === null ? [] : null;
        executeEnabled();
        expect(task.outputObjectList.meshes).toBe(frozenMeshes);
        expect(task.outputObjectList.spriteManagers).toBe(spriteManagers);

        task.outputObjectList.spriteManagers = spriteManagers === null ? [] : null;
        executeDisabled();
        expect(task.outputObjectList.spriteManagers).toBe(spriteManagers);
    });
});

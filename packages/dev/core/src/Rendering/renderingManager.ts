import type { Nullable } from "../types";
import type { SmartArray } from "../Misc/smartArray";
import type { ISpriteManager } from "../Sprites/spriteManager";
import type { IParticleSystem } from "../Particles/IParticleSystem";
import { RenderingGroup } from "./renderingGroup";

import type { Scene } from "../scene";
import type { Camera } from "../Cameras/camera";
import type { Material } from "../Materials/material";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";

/**
 * Interface describing the different options available in the rendering manager
 * regarding Auto Clear between groups.
 */
export interface IRenderingManagerAutoClearSetup {
    /**
     * Defines whether or not autoclear is enable.
     */
    autoClear: boolean;
    /**
     * Defines whether or not to autoclear the depth buffer.
     */
    depth: boolean;
    /**
     * Defines whether or not to autoclear the stencil buffer.
     */
    stencil: boolean;
}

/**
 * This class is used by the onRenderingGroupObservable
 */
export class RenderingGroupInfo {
    /**
     * The Scene that being rendered
     */
    scene: Scene;

    /**
     * The camera currently used for the rendering pass
     */
    camera: Nullable<Camera>;

    /**
     * The ID of the renderingGroup being processed
     */
    renderingGroupId: number;
}

/**
 * This is the manager responsible of all the rendering for meshes sprites and particles.
 * It is enable to manage the different groups as well as the different necessary sort functions.
 * This should not be used directly aside of the few static configurations
 */
export class RenderingManager {
    /**
     * The max id used for rendering groups (not included)
     */
    public static MAX_RENDERINGGROUPS = 4;

    /**
     * The min id used for rendering groups (included)
     */
    public static MIN_RENDERINGGROUPS = 0;

    /**
     * Used to globally prevent autoclearing scenes.
     */
    public static AUTOCLEAR = true;

    /**
     * @internal
     */
    public _useSceneAutoClearSetup = false;

    private _scene: Scene;
    private _renderingGroups = new Array<RenderingGroup>();
    private _depthStencilBufferAlreadyCleaned: boolean;

    private _autoClearDepthStencil: { [id: number]: IRenderingManagerAutoClearSetup } = {};
    private _customOpaqueSortCompareFn: { [id: number]: Nullable<(a: SubMesh, b: SubMesh) => number> } = {};
    private _customAlphaTestSortCompareFn: { [id: number]: Nullable<(a: SubMesh, b: SubMesh) => number> } = {};
    private _customTransparentSortCompareFn: { [id: number]: Nullable<(a: SubMesh, b: SubMesh) => number> } = {};
    private _renderingGroupInfo: Nullable<RenderingGroupInfo> = new RenderingGroupInfo();

    private _maintainStateBetweenFrames = false;
    /**
     * Gets or sets a boolean indicating that the manager will not reset between frames.
     * This means that if a mesh becomes invisible or transparent it will not be visible until this boolean is set to false again.
     * By default, the rendering manager will dispatch all active meshes per frame (moving them to the transparent, opaque or alpha testing lists).
     * By turning this property on, you will accelerate the rendering by keeping all these lists unchanged between frames.
     */
    public get maintainStateBetweenFrames() {
        return this._maintainStateBetweenFrames;
    }

    public set maintainStateBetweenFrames(value: boolean) {
        if (value === this._maintainStateBetweenFrames) {
            return;
        }

        this._maintainStateBetweenFrames = value;
        if (!this._maintainStateBetweenFrames) {
            this.restoreDispachedFlags();
        }
    }

    /**
     * Restore wasDispatched flags on the lists of elements to render.
     */
    public restoreDispachedFlags() {
        for (const mesh of this._scene.meshes) {
            if (mesh.subMeshes) {
                for (const subMesh of mesh.subMeshes) {
                    subMesh._wasDispatched = false;
                }
            }
        }

        if (this._scene.spriteManagers) {
            for (const spriteManager of this._scene.spriteManagers) {
                spriteManager._wasDispatched = false;
            }
        }

        for (const particleSystem of this._scene.particleSystems) {
            particleSystem._wasDispatched = false;
        }
    }

    /**
     * Instantiates a new rendering group for a particular scene
     * @param scene Defines the scene the groups belongs to
     */
    constructor(scene: Scene) {
        this._scene = scene;

        for (let i = RenderingManager.MIN_RENDERINGGROUPS; i < RenderingManager.MAX_RENDERINGGROUPS; i++) {
            this._autoClearDepthStencil[i] = { autoClear: true, depth: true, stencil: true };
        }
    }

    /**
     * @returns the rendering group with the specified id.
     * @param id the id of the rendering group (0 by default)
     */
    public getRenderingGroup(id: number): RenderingGroup {
        const renderingGroupId = id || 0;

        this._prepareRenderingGroup(renderingGroupId);

        return this._renderingGroups[renderingGroupId];
    }

    private _clearDepthStencilBuffer(depth = true, stencil = true): void {
        if (this._depthStencilBufferAlreadyCleaned) {
            return;
        }

        this._scene.getEngine().clear(null, false, depth, stencil);
        this._depthStencilBufferAlreadyCleaned = true;
    }

    /**
     * Renders the entire managed groups. This is used by the scene or the different render targets.
     * @internal
     */
    public render(
        customRenderFunction: Nullable<
            (
                opaqueSubMeshes: SmartArray<SubMesh>,
                transparentSubMeshes: SmartArray<SubMesh>,
                alphaTestSubMeshes: SmartArray<SubMesh>,
                depthOnlySubMeshes: SmartArray<SubMesh>
            ) => void
        >,
        activeMeshes: Nullable<AbstractMesh[]>,
        renderParticles: boolean,
        renderSprites: boolean
    ): void {
        // Update the observable context (not null as it only goes away on dispose)
        const info = this._renderingGroupInfo!;
        info.scene = this._scene;
        info.camera = this._scene.activeCamera;

        // Dispatch sprites
        if (this._scene.spriteManagers && renderSprites) {
            for (let index = 0; index < this._scene.spriteManagers.length; index++) {
                const manager = this._scene.spriteManagers[index];
                this.dispatchSprites(manager);
            }
        }

        // Render
        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            this._depthStencilBufferAlreadyCleaned = index === RenderingManager.MIN_RENDERINGGROUPS;
            const renderingGroup = this._renderingGroups[index];
            if (!renderingGroup || renderingGroup._empty) {
                continue;
            }

            const renderingGroupMask = 1 << index;
            info.renderingGroupId = index;

            // Before Observable
            this._scene.onBeforeRenderingGroupObservable.notifyObservers(info, renderingGroupMask);

            // Clear depth/stencil if needed
            if (RenderingManager.AUTOCLEAR) {
                const autoClear = this._useSceneAutoClearSetup ? this._scene.getAutoClearDepthStencilSetup(index) : this._autoClearDepthStencil[index];

                if (autoClear && autoClear.autoClear) {
                    this._clearDepthStencilBuffer(autoClear.depth, autoClear.stencil);
                }
            }

            // Render
            for (const step of this._scene._beforeRenderingGroupDrawStage) {
                step.action(index);
            }
            renderingGroup.render(customRenderFunction, renderSprites, renderParticles, activeMeshes);
            for (const step of this._scene._afterRenderingGroupDrawStage) {
                step.action(index);
            }

            // After Observable
            this._scene.onAfterRenderingGroupObservable.notifyObservers(info, renderingGroupMask);
        }
    }

    /**
     * Resets the different information of the group to prepare a new frame
     * @internal
     */
    public reset(): void {
        if (this.maintainStateBetweenFrames) {
            return;
        }

        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            const renderingGroup = this._renderingGroups[index];
            if (renderingGroup) {
                renderingGroup.prepare();
            }
        }
    }

    /**
     * Resets the sprites information of the group to prepare a new frame
     * @internal
     */
    public resetSprites(): void {
        if (this.maintainStateBetweenFrames) {
            return;
        }

        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            const renderingGroup = this._renderingGroups[index];
            if (renderingGroup) {
                renderingGroup.prepareSprites();
            }
        }
    }

    /**
     * Dispose and release the group and its associated resources.
     * @internal
     */
    public dispose(): void {
        this.freeRenderingGroups();
        this._renderingGroups.length = 0;
        this._renderingGroupInfo = null;
    }

    /**
     * Clear the info related to rendering groups preventing retention points during dispose.
     */
    public freeRenderingGroups(): void {
        for (let index = RenderingManager.MIN_RENDERINGGROUPS; index < RenderingManager.MAX_RENDERINGGROUPS; index++) {
            const renderingGroup = this._renderingGroups[index];
            if (renderingGroup) {
                renderingGroup.dispose();
            }
        }
    }

    private _prepareRenderingGroup(renderingGroupId: number): void {
        if (this._renderingGroups[renderingGroupId] === undefined) {
            this._renderingGroups[renderingGroupId] = new RenderingGroup(
                renderingGroupId,
                this._scene,
                this._customOpaqueSortCompareFn[renderingGroupId],
                this._customAlphaTestSortCompareFn[renderingGroupId],
                this._customTransparentSortCompareFn[renderingGroupId]
            );
        }
    }

    /**
     * Add a sprite manager to the rendering manager in order to render it this frame.
     * @param spriteManager Define the sprite manager to render
     */
    public dispatchSprites(spriteManager: ISpriteManager) {
        if (this.maintainStateBetweenFrames && spriteManager._wasDispatched) {
            return;
        }
        spriteManager._wasDispatched = true;
        this.getRenderingGroup(spriteManager.renderingGroupId).dispatchSprites(spriteManager);
    }

    /**
     * Add a particle system to the rendering manager in order to render it this frame.
     * @param particleSystem Define the particle system to render
     */
    public dispatchParticles(particleSystem: IParticleSystem) {
        if (this.maintainStateBetweenFrames && particleSystem._wasDispatched) {
            return;
        }
        particleSystem._wasDispatched = true;
        this.getRenderingGroup(particleSystem.renderingGroupId).dispatchParticles(particleSystem);
    }

    /**
     * Add a submesh to the manager in order to render it this frame
     * @param subMesh The submesh to dispatch
     * @param mesh Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
     * @param material Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
     */
    public dispatch(subMesh: SubMesh, mesh?: AbstractMesh, material?: Nullable<Material>): void {
        if (mesh === undefined) {
            mesh = subMesh.getMesh();
        }
        if (this.maintainStateBetweenFrames && subMesh._wasDispatched) {
            return;
        }
        subMesh._wasDispatched = true;
        this.getRenderingGroup(mesh.renderingGroupId).dispatch(subMesh, mesh, material);
    }

    /**
     * Overrides the default sort function applied in the rendering group to prepare the meshes.
     * This allowed control for front to back rendering or reversely depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    public setRenderingOrder(
        renderingGroupId: number,
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null
    ) {
        this._customOpaqueSortCompareFn[renderingGroupId] = opaqueSortCompareFn;
        this._customAlphaTestSortCompareFn[renderingGroupId] = alphaTestSortCompareFn;
        this._customTransparentSortCompareFn[renderingGroupId] = transparentSortCompareFn;

        if (this._renderingGroups[renderingGroupId]) {
            const group = this._renderingGroups[renderingGroupId];
            group.opaqueSortCompareFn = this._customOpaqueSortCompareFn[renderingGroupId];
            group.alphaTestSortCompareFn = this._customAlphaTestSortCompareFn[renderingGroupId];
            group.transparentSortCompareFn = this._customTransparentSortCompareFn[renderingGroupId];
        }
    }

    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     * @param depth Automatically clears depth between groups if true and autoClear is true.
     * @param stencil Automatically clears stencil between groups if true and autoClear is true.
     */
    public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean, depth = true, stencil = true): void {
        this._autoClearDepthStencil[renderingGroupId] = {
            autoClear: autoClearDepthStencil,
            depth: depth,
            stencil: stencil,
        };
    }

    /**
     * Gets the current auto clear configuration for one rendering group of the rendering
     * manager.
     * @param index the rendering group index to get the information for
     * @returns The auto clear setup for the requested rendering group
     */
    public getAutoClearDepthStencilSetup(index: number): IRenderingManagerAutoClearSetup {
        return this._autoClearDepthStencil[index];
    }
}

import { SmartArray, SmartArrayNoDuplicate } from "../Misc/smartArray";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Nullable, DeepImmutable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import type { IParticleSystem } from "../Particles/IParticleSystem";
import type { IEdgesRenderer } from "./edgesRenderer";
import type { ISpriteManager } from "../Sprites/spriteManager";
import { Constants } from "../Engines/constants";
import type { Material } from "../Materials/material";
import type { Scene } from "../scene";
import type { Camera } from "../Cameras/camera";

/**
 * This represents the object necessary to create a rendering group.
 * This is exclusively used and created by the rendering manager.
 * To modify the behavior, you use the available helpers in your scene or meshes.
 * @internal
 */
export class RenderingGroup {
    private static _ZeroVector: DeepImmutable<Vector3> = Vector3.Zero();
    private _scene: Scene;
    private _opaqueSubMeshes = new SmartArray<SubMesh>(256);
    private _transparentSubMeshes = new SmartArray<SubMesh>(256);
    private _alphaTestSubMeshes = new SmartArray<SubMesh>(256);
    private _depthOnlySubMeshes = new SmartArray<SubMesh>(256);
    private _particleSystems = new SmartArray<IParticleSystem>(256);
    private _spriteManagers = new SmartArray<ISpriteManager>(256);

    private _opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
    private _alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
    private _transparentSortCompareFn: (a: SubMesh, b: SubMesh) => number;

    private _renderOpaque: (subMeshes: SmartArray<SubMesh>) => void;
    private _renderAlphaTest: (subMeshes: SmartArray<SubMesh>) => void;
    private _renderTransparent: (subMeshes: SmartArray<SubMesh>) => void;

    /** @internal */
    public _empty = true;

    /** @internal */
    public _edgesRenderers = new SmartArrayNoDuplicate<IEdgesRenderer>(16);

    public onBeforeTransparentRendering: () => void;

    /**
     * Set the opaque sort comparison function.
     * If null the sub meshes will be render in the order they were created
     */
    public set opaqueSortCompareFn(value: Nullable<(a: SubMesh, b: SubMesh) => number>) {
        if (value) {
            this._opaqueSortCompareFn = value;
        } else {
            this._opaqueSortCompareFn = RenderingGroup.PainterSortCompare;
        }
        this._renderOpaque = this._renderOpaqueSorted;
    }

    /**
     * Set the alpha test sort comparison function.
     * If null the sub meshes will be render in the order they were created
     */
    public set alphaTestSortCompareFn(value: Nullable<(a: SubMesh, b: SubMesh) => number>) {
        if (value) {
            this._alphaTestSortCompareFn = value;
        } else {
            this._alphaTestSortCompareFn = RenderingGroup.PainterSortCompare;
        }
        this._renderAlphaTest = this._renderAlphaTestSorted;
    }

    /**
     * Set the transparent sort comparison function.
     * If null the sub meshes will be render in the order they were created
     */
    public set transparentSortCompareFn(value: Nullable<(a: SubMesh, b: SubMesh) => number>) {
        if (value) {
            this._transparentSortCompareFn = value;
        } else {
            this._transparentSortCompareFn = RenderingGroup.defaultTransparentSortCompare;
        }
        this._renderTransparent = this._renderTransparentSorted;
    }

    /**
     * Creates a new rendering group.
     * @param index The rendering group index
     * @param scene
     * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
     * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
     * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
     */
    constructor(
        public index: number,
        scene: Scene,
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null
    ) {
        this._scene = scene;

        this.opaqueSortCompareFn = opaqueSortCompareFn;
        this.alphaTestSortCompareFn = alphaTestSortCompareFn;
        this.transparentSortCompareFn = transparentSortCompareFn;
    }

    /**
     * Render all the sub meshes contained in the group.
     * @param customRenderFunction Used to override the default render behaviour of the group.
     * @param renderSprites
     * @param renderParticles
     * @param activeMeshes
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
        renderSprites: boolean,
        renderParticles: boolean,
        activeMeshes: Nullable<AbstractMesh[]>
    ): void {
        if (customRenderFunction) {
            customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, this._depthOnlySubMeshes);
            return;
        }

        const engine = this._scene.getEngine();

        // Depth only
        if (this._depthOnlySubMeshes.length !== 0) {
            engine.setColorWrite(false);
            this._renderAlphaTest(this._depthOnlySubMeshes);
            engine.setColorWrite(true);
        }

        // Opaque
        if (this._opaqueSubMeshes.length !== 0) {
            this._renderOpaque(this._opaqueSubMeshes);
        }

        // Alpha test
        if (this._alphaTestSubMeshes.length !== 0) {
            this._renderAlphaTest(this._alphaTestSubMeshes);
        }

        const stencilState = engine.getStencilBuffer();
        engine.setStencilBuffer(false);

        // Sprites
        if (renderSprites) {
            this._renderSprites();
        }

        // Particles
        if (renderParticles) {
            this._renderParticles(activeMeshes);
        }

        if (this.onBeforeTransparentRendering) {
            this.onBeforeTransparentRendering();
        }

        // Transparent
        if (this._transparentSubMeshes.length !== 0 || this._scene.useOrderIndependentTransparency) {
            engine.setStencilBuffer(stencilState);
            if (this._scene.useOrderIndependentTransparency) {
                const excludedMeshes = this._scene.depthPeelingRenderer!.render(this._transparentSubMeshes);
                if (excludedMeshes.length) {
                    // Render leftover meshes that could not be processed by depth peeling
                    this._renderTransparent(excludedMeshes);
                }
            } else {
                this._renderTransparent(this._transparentSubMeshes);
            }
            engine.setAlphaMode(Constants.ALPHA_DISABLE);
        }

        // Set back stencil to false in case it changes before the edge renderer.
        engine.setStencilBuffer(false);

        // Edges
        if (this._edgesRenderers.length) {
            for (let edgesRendererIndex = 0; edgesRendererIndex < this._edgesRenderers.length; edgesRendererIndex++) {
                this._edgesRenderers.data[edgesRendererIndex].render();
            }

            engine.setAlphaMode(Constants.ALPHA_DISABLE);
        }

        // Restore Stencil state.
        engine.setStencilBuffer(stencilState);
    }

    /**
     * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
     * @param subMeshes The submeshes to render
     */
    private _renderOpaqueSorted(subMeshes: SmartArray<SubMesh>): void {
        RenderingGroup._RenderSorted(subMeshes, this._opaqueSortCompareFn, this._scene.activeCamera, false);
    }

    /**
     * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
     * @param subMeshes The submeshes to render
     */
    private _renderAlphaTestSorted(subMeshes: SmartArray<SubMesh>): void {
        RenderingGroup._RenderSorted(subMeshes, this._alphaTestSortCompareFn, this._scene.activeCamera, false);
    }

    /**
     * Renders the opaque submeshes in the order from the transparentSortCompareFn.
     * @param subMeshes The submeshes to render
     */
    private _renderTransparentSorted(subMeshes: SmartArray<SubMesh>): void {
        RenderingGroup._RenderSorted(subMeshes, this._transparentSortCompareFn, this._scene.activeCamera, true);
    }

    /**
     * Renders the submeshes in a specified order.
     * @param subMeshes The submeshes to sort before render
     * @param sortCompareFn The comparison function use to sort
     * @param camera The camera position use to preprocess the submeshes to help sorting
     * @param transparent Specifies to activate blending if true
     */
    private static _RenderSorted(
        subMeshes: SmartArray<SubMesh>,
        sortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>,
        camera: Nullable<Camera>,
        transparent: boolean
    ): void {
        let subIndex = 0;
        let subMesh: SubMesh;
        const cameraPosition = camera ? camera.globalPosition : RenderingGroup._ZeroVector;

        if (transparent) {
            for (; subIndex < subMeshes.length; subIndex++) {
                subMesh = subMeshes.data[subIndex];
                subMesh._alphaIndex = subMesh.getMesh().alphaIndex;
                subMesh._distanceToCamera = Vector3.Distance(subMesh.getBoundingInfo().boundingSphere.centerWorld, cameraPosition);
            }
        }

        const sortedArray = subMeshes.length === subMeshes.data.length ? subMeshes.data : subMeshes.data.slice(0, subMeshes.length);

        if (sortCompareFn) {
            sortedArray.sort(sortCompareFn);
        }

        const scene = sortedArray[0].getMesh().getScene();
        for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
            subMesh = sortedArray[subIndex];

            if (scene._activeMeshesFrozenButKeepClipping && !subMesh.isInFrustum(scene._frustumPlanes)) {
                continue;
            }

            if (transparent) {
                const material = subMesh.getMaterial();

                if (material && material.needDepthPrePass) {
                    const engine = material.getScene().getEngine();
                    engine.setColorWrite(false);
                    engine.setAlphaMode(Constants.ALPHA_DISABLE);
                    subMesh.render(false);
                    engine.setColorWrite(true);
                }
            }

            subMesh.render(transparent);
        }
    }

    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are rendered back to front if in the same alpha index.
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static defaultTransparentSortCompare(a: SubMesh, b: SubMesh): number {
        // Alpha index first
        if (a._alphaIndex > b._alphaIndex) {
            return 1;
        }
        if (a._alphaIndex < b._alphaIndex) {
            return -1;
        }

        // Then distance to camera
        return RenderingGroup.backToFrontSortCompare(a, b);
    }

    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are rendered back to front.
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static backToFrontSortCompare(a: SubMesh, b: SubMesh): number {
        // Then distance to camera
        if (a._distanceToCamera < b._distanceToCamera) {
            return 1;
        }
        if (a._distanceToCamera > b._distanceToCamera) {
            return -1;
        }

        return 0;
    }

    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are rendered front to back (prevent overdraw).
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static frontToBackSortCompare(a: SubMesh, b: SubMesh): number {
        // Then distance to camera
        if (a._distanceToCamera < b._distanceToCamera) {
            return -1;
        }
        if (a._distanceToCamera > b._distanceToCamera) {
            return 1;
        }

        return 0;
    }

    /**
     * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
     * are grouped by material then geometry.
     *
     * @param a The first submesh
     * @param b The second submesh
     * @returns The result of the comparison
     */
    public static PainterSortCompare(a: SubMesh, b: SubMesh): number {
        const meshA = a.getMesh();
        const meshB = b.getMesh();

        if (meshA.material && meshB.material) {
            return meshA.material.uniqueId - meshB.material.uniqueId;
        }

        return meshA.uniqueId - meshB.uniqueId;
    }

    /**
     * Resets the different lists of submeshes to prepare a new frame.
     */
    public prepare(): void {
        this._opaqueSubMeshes.reset();
        this._transparentSubMeshes.reset();
        this._alphaTestSubMeshes.reset();
        this._depthOnlySubMeshes.reset();
        this._particleSystems.reset();
        this.prepareSprites();
        this._edgesRenderers.reset();
        this._empty = true;
    }

    /**
     * Resets the different lists of sprites to prepare a new frame.
     */
    public prepareSprites(): void {
        this._spriteManagers.reset();
    }

    public dispose(): void {
        this._opaqueSubMeshes.dispose();
        this._transparentSubMeshes.dispose();
        this._alphaTestSubMeshes.dispose();
        this._depthOnlySubMeshes.dispose();
        this._particleSystems.dispose();
        this._spriteManagers.dispose();
        this._edgesRenderers.dispose();
    }

    /**
     * Inserts the submesh in its correct queue depending on its material.
     * @param subMesh The submesh to dispatch
     * @param [mesh] Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
     * @param [material] Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
     */
    public dispatch(subMesh: SubMesh, mesh?: AbstractMesh, material?: Nullable<Material>): void {
        // Get mesh and materials if not provided
        if (mesh === undefined) {
            mesh = subMesh.getMesh();
        }
        if (material === undefined) {
            material = subMesh.getMaterial();
        }

        if (material === null || material === undefined) {
            return;
        }

        if (material.needAlphaBlendingForMesh(mesh)) {
            // Transparent
            this._transparentSubMeshes.push(subMesh);
        } else if (material.needAlphaTesting()) {
            // Alpha test
            if (material.needDepthPrePass) {
                this._depthOnlySubMeshes.push(subMesh);
            }

            this._alphaTestSubMeshes.push(subMesh);
        } else {
            if (material.needDepthPrePass) {
                this._depthOnlySubMeshes.push(subMesh);
            }

            this._opaqueSubMeshes.push(subMesh); // Opaque
        }

        mesh._renderingGroup = this;

        if (mesh._edgesRenderer && mesh._edgesRenderer.isEnabled) {
            this._edgesRenderers.pushNoDuplicate(mesh._edgesRenderer);
        }

        this._empty = false;
    }

    public dispatchSprites(spriteManager: ISpriteManager) {
        this._spriteManagers.push(spriteManager);
        this._empty = false;
    }

    public dispatchParticles(particleSystem: IParticleSystem) {
        this._particleSystems.push(particleSystem);
        this._empty = false;
    }

    private _renderParticles(activeMeshes: Nullable<AbstractMesh[]>): void {
        if (this._particleSystems.length === 0) {
            return;
        }

        // Particles
        const activeCamera = this._scene.activeCamera;
        this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
        for (let particleIndex = 0; particleIndex < this._particleSystems.length; particleIndex++) {
            const particleSystem = this._particleSystems.data[particleIndex];

            if ((activeCamera && activeCamera.layerMask & particleSystem.layerMask) === 0) {
                continue;
            }

            const emitter: any = particleSystem.emitter;
            if (!emitter.position || !activeMeshes || activeMeshes.indexOf(emitter) !== -1) {
                this._scene._activeParticles.addCount(particleSystem.render(), false);
            }
        }
        this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
    }

    private _renderSprites(): void {
        if (!this._scene.spritesEnabled || this._spriteManagers.length === 0) {
            return;
        }

        // Sprites
        const activeCamera = this._scene.activeCamera;
        this._scene.onBeforeSpritesRenderingObservable.notifyObservers(this._scene);
        for (let id = 0; id < this._spriteManagers.length; id++) {
            const spriteManager = this._spriteManagers.data[id];

            if ((activeCamera && activeCamera.layerMask & spriteManager.layerMask) !== 0) {
                spriteManager.render();
            }
        }
        this._scene.onAfterSpritesRenderingObservable.notifyObservers(this._scene);
    }
}

import { type FrameGraph, type FrameGraphObjectList, type FrameGraphTextureHandle, type Mesh, type Observer } from "core/index";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";
import { _IblShadowsVoxelRenderer } from "core/Rendering/IBLShadows/iblShadowsVoxelRenderer";
import { FrameGraphTask } from "../../../frameGraphTask";

/**
 * Task used to voxelize shadow casting objects for IBL shadows.
 * @internal
 */
export class FrameGraphIblShadowsVoxelizationTask extends FrameGraphTask {
    /**
     * Observable raised when voxelization completes.
     */
    public readonly onVoxelizationCompleteObservable = new Observable<void>();

    /**
     * Input object list containing the meshes to voxelize.
     */
    public objectList: FrameGraphObjectList;

    /**
     * World-space voxel grid size.
     */
    public voxelGridSize = 1;

    /**
     * Voxel grid resolution exponent. Actual resolution is 2^resolutionExp.
     */
    private _resolutionExp = 6;
    /**
     * Sets voxel grid resolution exponent. Actual resolution is 2^resolutionExp.
     */
    public set resolutionExp(value: number) {
        const newValue = Math.round(Math.max(1, Math.min(value, 8)));
        if (newValue === this._resolutionExp) {
            return;
        }
        this._resolutionExp = newValue;
        if (this._voxelRenderer) {
            this._voxelRenderer.voxelResolutionExp = this._resolutionExp;
        }
        this.dirty = true;
    }
    /**
     * Gets voxel grid resolution exponent. Actual resolution is 2^resolutionExp.
     */
    public get resolutionExp(): number {
        return this._resolutionExp;
    }

    /**
     * Enables tri-planar voxelization mode.
     */
    public triPlanarVoxelization = true;

    /**
     * Indicates whether voxelization should be refreshed.
     */
    public dirty = true;

    private _refreshRate = -1;

    /**
     * Controls how often voxelization is refreshed.
     * - -1: manual only (requires setting `dirty = true`)
     * - 0: every frame
     * - 1: skip 1 frame between updates
     * - N: skip N frames between updates
     */
    public get refreshRate(): number {
        return this._refreshRate;
    }

    public set refreshRate(value: number) {
        this._refreshRate = Math.max(-1, Math.round(value));
    }

    /**
     * World-to-voxel normalization matrix used by tracing.
     */
    public readonly worldScaleMatrix = Matrix.Identity();

    /**
     * Output voxel grid texture handle.
     */
    public readonly outputVoxelGridTexture: FrameGraphTextureHandle;

    private _voxelRenderer?: _IblShadowsVoxelRenderer;
    private _voxelRendererResolutionExp?: number;
    private _voxelRendererTriPlanar?: boolean;
    private _voxelizationCompleteObserver: Observer<void> | null = null;
    private _voxelRTTextureHandle?: FrameGraphTextureHandle;
    private _voxelGridTextureHandle?: FrameGraphTextureHandle;
    private _frameCounter = 0;

    /**
     * Creates a new voxelization task.
     * @param name The task name.
     * @param frameGraph The frame graph this task belongs to.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputVoxelGridTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    /**
     * Gets the class name.
     * @returns The class name.
     */
    public override getClassName(): string {
        return "FrameGraphIblShadowsVoxelizationTask";
    }

    /**
     * Checks whether the task has all required inputs.
     * @returns True when ready.
     */
    public override isReady(): boolean {
        return true;
    }

    /**
     * Requests a voxelization update on the next eligible frame.
     */
    public requestVoxelizationUpdate(): void {
        this.dirty = true;
    }

    /**
     * Recomputes voxel world bounds from the current object list and updates worldScaleMatrix.
     */
    public updateSceneBounds(): void {
        this._updateWorldScaleMatrix();
    }

    /**
     * Records the voxelization passes.
     */
    public override record() {
        if (this.objectList === undefined) {
            throw new Error(`FrameGraphIblShadowsVoxelizationTask ${this.name}: objectList is required`);
        }

        this._ensureVoxelRenderer();
        this._updateWorldScaleMatrix();

        this._updateOutputTextureHandlesFromRenderer();

        const voxelRT = this._voxelRenderer!.getRT();
        const voxelRTInternalTexture = voxelRT.getInternalTexture();
        if (!voxelRTInternalTexture) {
            throw new Error(`FrameGraphIblShadowsVoxelizationTask ${this.name}: voxel renderer RT texture is unavailable`);
        }
        this._voxelRTTextureHandle = this._frameGraph.textureManager.importTexture(`${this.name} Voxel RT`, voxelRTInternalTexture, this._voxelRTTextureHandle);

        const pass = this._frameGraph.addRenderPass(this.name);
        pass.setRenderTarget(this._voxelRTTextureHandle);
        pass.addDependencies(this.outputVoxelGridTexture);
        pass.setExecuteFunc((context) => {
            context.restoreDefaultFramebuffer();

            this._frameCounter++;
            const shouldRefreshFromRate = this.refreshRate >= 0 && (this._frameCounter - 1) % (this.refreshRate + 1) === 0;

            if (this._voxelRenderer!.isVoxelizationInProgress()) {
                this._voxelRenderer!.processVoxelization();
                return;
            }

            if (this.dirty || shouldRefreshFromRate) {
                const meshes = this.objectList!.meshes as Mesh[];
                if (meshes.length === 0) {
                    return;
                }

                this._ensureVoxelRenderer();
                this._updateWorldScaleMatrix();
                this._voxelRenderer!.setWorldScaleMatrix(this.worldScaleMatrix);
                this._voxelRenderer!.updateVoxelGrid(meshes, false);
                this.dirty = false;
            }

            if (this._voxelRenderer!.isVoxelizationInProgress()) {
                this._voxelRenderer!.processVoxelization();
            }
        });
    }

    /**
     * Disposes internal resources.
     */
    public override dispose(): void {
        this._detachVoxelizationObserver();
        this._voxelRenderer?.dispose();
        this._voxelRenderer = undefined;
        this.onVoxelizationCompleteObservable.clear();
        super.dispose();
    }

    private _ensureVoxelRenderer(): void {
        const needsNewRenderer = !this._voxelRenderer || this._voxelRendererResolutionExp !== this.resolutionExp || this._voxelRendererTriPlanar !== this.triPlanarVoxelization;

        if (!needsNewRenderer) {
            return;
        }

        this._voxelRenderer?.dispose();
        this._voxelRenderer = new _IblShadowsVoxelRenderer(this._frameGraph.scene, {} as never, this.resolutionExp, this.triPlanarVoxelization);
        this._attachVoxelizationObserver();
        this._voxelRendererResolutionExp = this.resolutionExp;
        this._voxelRendererTriPlanar = this.triPlanarVoxelization;
    }

    private _attachVoxelizationObserver(): void {
        this._detachVoxelizationObserver();

        if (!this._voxelRenderer) {
            return;
        }

        this._voxelizationCompleteObserver = this._voxelRenderer.onVoxelizationCompleteObservable.add(() => {
            this._updateOutputTextureHandlesFromRenderer();
            this.onVoxelizationCompleteObservable.notifyObservers();
        });
    }

    private _detachVoxelizationObserver(): void {
        if (this._voxelRenderer && this._voxelizationCompleteObserver) {
            this._voxelRenderer.onVoxelizationCompleteObservable.remove(this._voxelizationCompleteObserver);
        }

        this._voxelizationCompleteObserver = null;
    }

    private _updateWorldScaleMatrix(): void {
        const meshes = this.objectList?.meshes as Mesh[] | undefined;
        if (!meshes || meshes.length === 0 || !isFinite(this.voxelGridSize) || this.voxelGridSize <= 0) {
            this.worldScaleMatrix.copyFrom(Matrix.Identity());
            return;
        }

        const bounds = {
            min: new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
            max: new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE),
        };

        for (const mesh of meshes) {
            const localBounds = mesh.getHierarchyBoundingVectors(true);
            bounds.min = Vector3.Minimize(bounds.min, localBounds.min);
            bounds.max = Vector3.Maximize(bounds.max, localBounds.max);
        }

        const size = bounds.max.subtract(bounds.min);
        this.voxelGridSize = Math.max(size.x, size.y, size.z);

        const halfSize = this.voxelGridSize / 2.0;
        const centerOffset = bounds.max.add(bounds.min).multiplyByFloats(-0.5, -0.5, -0.5);
        const invWorldScaleMatrix = Matrix.Compose(new Vector3(1.0 / halfSize, 1.0 / halfSize, 1.0 / halfSize), new Quaternion(), Vector3.Zero());
        const invTranslationMatrix = Matrix.Compose(new Vector3(1.0, 1.0, 1.0), new Quaternion(), centerOffset);
        invTranslationMatrix.multiplyToRef(invWorldScaleMatrix, this.worldScaleMatrix);
    }

    private _updateOutputTextureHandlesFromRenderer(): void {
        const voxelTexture = this._voxelRenderer!.getVoxelGrid();
        const voxelInternalTexture = voxelTexture.getInternalTexture();
        if (!voxelInternalTexture) {
            throw new Error(`FrameGraphIblShadowsVoxelizationTask ${this.name}: voxel renderer texture is unavailable`);
        }

        this._voxelGridTextureHandle = this._frameGraph.textureManager.importTexture(`${this.name} Voxel Grid`, voxelInternalTexture, this._voxelGridTextureHandle);
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputVoxelGridTexture, this._voxelGridTextureHandle);
    }
}

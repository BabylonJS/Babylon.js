import type { Scene } from "core/scene";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Mesh } from "core/Meshes/mesh";
import type { Nullable } from "core/types";
import type { Observer } from "./observable";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "core/Engines/constants";
import type { WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import { BindMorphTargetParameters } from "core/Materials/materialHelper.functions";
import type { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { WebGPUShaderProcessor } from "core/Engines/WebGPU/webgpuShaderProcessor";
import type { EffectLayer } from "core/Layers";

/**
 * Options for the snapshot rendering helper
 */
export interface SnapshotRenderingHelpersOptions {
    /**
     * Maximum number of influences for morph target managers
     * In FAST snapshot mode, the number of influences must be fixed and cannot change from one frame to the next.
     * morphTargetsNumMaxInfluences is the maximum number of non-zero influences allowed in a morph target manager.
     * The final value defined for a morph target manager is: Math.min(morphTargetManager.numTargets, morphTargetsNumMaxInfluences)
     * Default: 20
     */
    morphTargetsNumMaxInfluences?: number;
}

/**
 * A helper class to simplify work with FAST snapshot mode (WebGPU only - can be used in WebGL too, but won't do anything).
 */
export class SnapshotRenderingHelper {
    private _engine: AbstractEngine;
    private _scene: Scene;
    private _options: SnapshotRenderingHelpersOptions;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _onBeforeRenderObserverUpdateLayer: Nullable<Observer<Scene>>;
    private _onResizeObserver: Nullable<Observer<AbstractEngine>>;

    /**
     * Creates a new snapshot rendering helper
     * Note that creating an instance of the helper will set the snapshot rendering mode to SNAPSHOTRENDERING_FAST but will not enable snapshot rendering (engine.snapshotRendering is not updated).
     * Note also that fixMeshes() is called as part of the construction
     * @param scene The scene to use the helper in
     * @param options The options for the helper
     */
    constructor(scene: Scene, options?: SnapshotRenderingHelpersOptions) {
        this._scene = scene;
        this._engine = scene.getEngine();

        if (!this._engine.isWebGPU) {
            return;
        }

        this._options = {
            morphTargetsNumMaxInfluences: 20,
            ...options,
        };

        this._engine.snapshotRenderingMode = Constants.SNAPSHOTRENDERING_FAST;

        this.fixMeshes();

        this._onResizeObserver = this._engine.onResizeObservable.add(() => {
            const save = this._engine.snapshotRendering;
            this._engine.snapshotRendering = false;
            if (save) {
                this.enableSnapshotRendering();
            }
        });

        this._scene.onBeforeRenderObservable.add(() => {
            if (!this._engine.snapshotRendering || this._engine.snapshotRenderingMode !== Constants.SNAPSHOTRENDERING_FAST) {
                return;
            }

            // Animate skeletons
            scene.skeletons.forEach((skeleton) => skeleton.prepare(true));

            for (const mesh of scene.meshes) {
                if (mesh.infiniteDistance) {
                    mesh.transferToEffect(mesh.computeWorldMatrix(true));
                }

                if (mesh.skeleton) {
                    mesh.transferToEffect(mesh.computeWorldMatrix(true));
                }

                if (mesh.morphTargetManager && mesh.subMeshes) {
                    // Make sure morph target animations work
                    for (const subMesh of mesh.subMeshes) {
                        const dw = subMesh._drawWrapper;
                        const effect = dw.effect;
                        if (effect) {
                            const dataBuffer = (dw.drawContext as WebGPUDrawContext).buffers[WebGPUShaderProcessor.LeftOvertUBOName];
                            const ubLeftOver = (effect._pipelineContext as WebGPUPipelineContext)?.uniformBuffer;
                            if (dataBuffer && ubLeftOver && ubLeftOver.setDataBuffer(dataBuffer)) {
                                mesh.morphTargetManager._bind(effect);
                                BindMorphTargetParameters(mesh, effect);
                                ubLeftOver.update();
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Enable snapshot rendering
     * Use this method instead of engine.snapshotRendering=true, to make sure everything is ready before enabling snapshot rendering.
     */
    public enableSnapshotRendering() {
        if (!this._engine.isWebGPU) {
            return;
        }

        this._scene.executeWhenReady(() => {
            this._executeAtFrame(this._engine.frameId + 2, () => {
                this._engine.snapshotRendering = true;
            });
        });
    }

    /**
     * Disable snapshot rendering
     */
    public disableSnapshotRendering() {
        if (!this._engine.isWebGPU) {
            return;
        }

        this._engine.snapshotRendering = false;
    }

    /**
     * Fix meshes for snapshot rendering.
     * This method will make sure that some features are disabled or fixed to make sure snapshot rendering works correctly.
     * @param meshes List of meshes to fix. If not provided, all meshes in the scene will be fixed.
     */
    public fixMeshes(meshes?: AbstractMesh[]) {
        if (!this._engine.isWebGPU) {
            return;
        }

        meshes = meshes || this._scene.meshes;

        for (const mesh of meshes) {
            (mesh as Mesh).ignoreCameraMaxZ = false;
            if (mesh.morphTargetManager) {
                mesh.morphTargetManager.numMaxInfluencers = Math.min(mesh.morphTargetManager.numTargets, this._options.morphTargetsNumMaxInfluences!);
            }
        }
    }

    /**
     * Update the meshes used in an effect layer to ensure that snapshot rendering works correctly for these meshes in this layer.
     * @param effectLayer The effect layer
     * @param autoUpdate If true, the helper will automatically update the effect layer meshes with each frame. If false, you'll need to call this method manually when the camera or layer meshes move or rotate.
     */
    public updateMeshesForEffectLayer(effectLayer: EffectLayer, autoUpdate = true) {
        if (!this._engine.isWebGPU) {
            return;
        }

        const renderPassId = effectLayer.mainTexture.renderPassId;

        if (autoUpdate) {
            this._onBeforeRenderObserverUpdateLayer = this._scene.onBeforeRenderObservable.add(() => {
                this._updateMeshMatricesForRenderPassId(renderPassId);
            });
        } else {
            this._updateMeshMatricesForRenderPassId(renderPassId);
        }
    }

    /**
     * Dispose the helper
     */
    public dispose() {
        if (!this._engine.isWebGPU) {
            return;
        }

        this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        this._onBeforeRenderObserver = null;

        this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserverUpdateLayer);
        this._onBeforeRenderObserverUpdateLayer = null;

        this._engine.onResizeObservable.remove(this._onResizeObserver);
        this._onResizeObserver = null;
    }

    private _updateMeshMatricesForRenderPassId(renderPassId: number) {
        const sceneTransformationMatrix = this._scene.getTransformMatrix();

        for (let i = 0; i < this._scene.meshes.length; ++i) {
            const mesh = this._scene.meshes[i];
            if (!mesh.subMeshes) {
                continue;
            }

            for (let j = 0; j < mesh.subMeshes.length; ++j) {
                const dw = mesh.subMeshes[j]._getDrawWrapper(renderPassId);
                const effect = dw?.effect;
                if (effect) {
                    const dataBuffer = (dw.drawContext as WebGPUDrawContext).buffers[WebGPUShaderProcessor.LeftOvertUBOName];
                    const ubLeftOver = (effect._pipelineContext as WebGPUPipelineContext)?.uniformBuffer;
                    if (dataBuffer && ubLeftOver && ubLeftOver.setDataBuffer(dataBuffer)) {
                        effect.setMatrix("viewProjection", sceneTransformationMatrix);
                        effect.setMatrix("world", mesh.computeWorldMatrix());
                        ubLeftOver.update();
                    }
                }
            }
        }
    }

    private _executeAtFrame(frameId: number, func: () => void) {
        const obs = this._engine.onEndFrameObservable.add(() => {
            if (this._engine.frameId >= frameId) {
                this._engine.onEndFrameObservable.remove(obs);
                func();
            }
        });
    }
}

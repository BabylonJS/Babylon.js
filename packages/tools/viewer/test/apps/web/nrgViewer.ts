/**
 * TEMPORARY TEST FILE — NOT FOR COMMIT
 *
 * Demonstrates extending Viewer and ViewerElement to add NodeRenderGraph support
 * via the protected API (_setActiveFrameGraph, _bindObjectList).
 *
 * Usage (HTML):
 *   <nrg-viewer source="..." node-render-graph="#SNIPPETID"></nrg-viewer>
 *
 * Or programmatically:
 *   const el = document.querySelector("nrg-viewer");
 *   el.viewerDetails.viewer.nodeRenderGraph = "#SNIPPETID";
 *   el.viewerDetails.viewer.nodeRenderGraph = null; // revert to default
 */

import {
    Constants,
    NodeRenderGraphGenerateMipmapsBlock,
    NodeRenderGraphGeometryRendererBlock,
    ThinTexture,
    Texture,
    type AbstractMesh,
    type IDisposable,
    type LoadAssetContainerOptions,
    type Nullable,
} from "core/index";
import type { FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";
import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { AbortError } from "core/Misc/error";
import { type Model, Viewer } from "../../../src/viewer";
import { ViewerElement } from "../../../src/viewerElement";
import { observePromise, type ViewerLoadModelOptions } from "../../../src/viewerBase";
import { customElement, property } from "lit/decorators.js";

// ──────────────────────────────────────────────────────────────────────────────
// NRGViewer — Viewer subclass that adds NodeRenderGraph support
// ──────────────────────────────────────────────────────────────────────────────

export class NRGViewer extends Viewer {
    private _snippetId: Nullable<string> = null;
    private _nrg: Nullable<NodeRenderGraph> = null;
    private _wiringDisposables: IDisposable[] = [];
    private _nrgAbortController: Nullable<AbortController> = null;
    private _refractionTexture: Nullable<Texture> = null;
    private _sssIrradianceThinTexture: Nullable<ThinTexture> = null;
    private _sssDepthThinTexture: Nullable<ThinTexture> = null;

    /**
     * The active NodeRenderGraph snippet ID, or null to use default rendering.
     */
    public get nodeRenderGraph(): Nullable<string> {
        return this._snippetId;
    }

    public set nodeRenderGraph(snippetId: Nullable<string>) {
        if (snippetId !== this._snippetId) {
            this._snippetId = snippetId;
            this._loadNodeRenderGraph(snippetId);
        }
    }

    private _loadNodeRenderGraph(snippetId: Nullable<string>): void {
        observePromise(this._loadNodeRenderGraphAsync(snippetId));
    }

    private async _loadNodeRenderGraphAsync(snippetId: Nullable<string>): Promise<void> {
        // Abort any in-flight NRG load.
        this._nrgAbortController?.abort(new AbortError("NRG load superseded"));
        const abortController = new AbortController();
        this._nrgAbortController = abortController;

        // Tear down the current NRG and restore default rendering.
        this._tearDownNRG();

        if (!snippetId) {
            return;
        }

        try {
            // Dynamic import — zero bundle cost in the base viewer.
            // allBlocks.ts calls RegisterAllNodeRenderGraphBlocks() on import, which is required
            // before ParseFromSnippetAsync so that GetClass() can resolve every block type in
            // the snippet. Without it, unrecognised block classes are silently skipped during
            // deserialization, breaking the connection chain to the Output block.
            const [{ NodeRenderGraph }] = await Promise.all([import("core/FrameGraph/Node/nodeRenderGraph"), import("core/FrameGraph/Node/Blocks/allBlocks")]);

            abortController.signal.throwIfAborted();

            const nrg = await NodeRenderGraph.ParseFromSnippetAsync(snippetId, this._scene, { autoFillExternalInputs: true }, undefined, /* skipBuild */ true);

            abortController.signal.throwIfAborted();

            await nrg.buildAsync();

            abortController.signal.throwIfAborted();

            this._nrg = nrg;
            this._wireNRG(nrg);
            this._setActiveFrameGraph(nrg.frameGraph);
        } catch (e) {
            if (!(e instanceof AbortError)) {
                throw e;
            }
        }
    }

    /**
     * Wires ObjectList input blocks and material outputs for the loaded NRG.
     * Override or replace this method to provide your own filter logic and
     * material update callbacks.
     *
     * Each _bindObjectList() call sets up live scene observers that keep the block's
     * mesh list current as meshes are added, removed, or change material.
     *
     * To wire NRG outputs back into materials, subscribe to scene.onAfterRenderObservable
     * (or another suitable observable) and read from nrg.frameGraph inside the callback.
     */
    protected _wireNRG(nrg: NodeRenderGraph): void {
        const disposables: IDisposable[] = [];

        // ── Evict the standard TransmissionHelper ─────────────────────────────
        //
        // If a model with transmission was loaded BEFORE the NRG was activated,
        // the glTF loader will have created a TransmissionHelper and registered it
        // on scene._transmissionHelper. That helper watches onNewMeshAddedObservable
        // and races our _bindObjectList callback: whichever fires last wins, and the
        // helper stamps its own (stale) opaque render target onto every new
        // transmission mesh. Dispose it now so our NRG-driven refraction owns the field.
        //
        // Subsequent model loads while the NRG is active are protected by
        // dontUseTransmissionHelper: true in _loadModel, so the helper is not recreated.
        // When the NRG is torn down (_tearDownNRG), dontUseTransmissionHelper reverts to
        // false and the next model load recreates the helper normally.
        (this._scene as unknown as { _transmissionHelper?: IDisposable })._transmissionHelper?.dispose();

        // ── Helpers ───────────────────────────────────────────────────────────

        const isTransmission = (mesh: AbstractMesh) => {
            const mat = mesh.material;
            return (
                (mat instanceof OpenPBRMaterial && (mat.transmissionWeight > 0 || mat.subsurfaceWeight > 0)) || (mat instanceof PBRMaterial && mat.subSurface.isRefractionEnabled)
            );
        };

        const applyRefractionTexture = (mesh: AbstractMesh) => {
            // Only assign the NRG's 2D refraction texture to OpenPBR materials.
            //
            // OpenPBR's WGSL declares `backgroundRefractionSampler` as `texture_2d<f32>`
            // unconditionally — assigning our 2D NRG output is always safe.
            //
            // PBRMaterial is intentionally skipped. When subSurface.refractionTexture is null
            // and isRefractionEnabled is true, PBR falls back to scene.environmentTexture (a
            // cube map) and compiles the shader with SS_REFRACTIONMAP_3D = true
            // (texture_cube<f32>). If we then assign our 2D texture before the effect
            // recompiles, WebGPU raises a dimension-mismatch error on CreateBindGroup.
            // Leaving PBR materials alone means they consistently use the env-cube, keeping
            // shader and bound texture in sync. With useOpenPBR: true (the NRGViewer default)
            // there are no PBR transmission materials anyway.
            if (!this._refractionTexture) {
                return;
            }
            if (mesh.material instanceof OpenPBRMaterial) {
                mesh.material.backgroundRefractionTexture = this._refractionTexture;
            }
        };

        // ── Material updates from NRG outputs ─────────────────────────────────
        //
        // IMPORTANT: this section must come BEFORE the _bindObjectList setup below.
        // _bindObjectList calls rebuild() immediately on registration, which calls
        // applyRefractionTexture. If _refractionTexture is still null at that point
        // (because updateRefractionTexture() hasn't run yet), materials will fall back
        // to the environment cube map. Initialising _refractionTexture first avoids that.
        //
        // Re-run after every rebuild: engine resize triggers a rebuild which allocates
        // new internal textures, so the wrapper and material assignments must be refreshed.
        // After a rebuild, re-apply to currentTransmissionMeshes (maintained below) rather
        // than iterating all scene meshes.
        let currentTransmissionMeshes: AbstractMesh[] = [];

        const refractionMipMapsBlock = nrg.getBlockByName<NodeRenderGraphGenerateMipmapsBlock>("Generate Refraction mipmaps");
        if (refractionMipMapsBlock) {
            const updateRefractionTexture = () => {
                const internalTexture = nrg.frameGraph.textureManager.getTextureFromHandle(refractionMipMapsBlock.task.outputTexture);
                if (!internalTexture) {
                    // onBuildObservable fires after _allocateTextures, so a null handle here is
                    // unexpected. Leave _refractionTexture unchanged; the next successful rebuild
                    // will correct it.
                    return;
                }

                internalTexture.incrementReferences();
                internalTexture.useMipMaps = true;
                const texture = new Texture("", this._scene, { internalTexture: internalTexture, noMipmap: true });

                texture.name = "Refraction texture wrapper";
                texture.anisotropicFilteringLevel = 1;
                texture.updateSamplingMode(Constants.TEXTURE_TRILINEAR_SAMPLINGMODE);
                texture.lodGenerationScale = 1;
                texture.lodGenerationOffset = -4;
                texture.gammaSpace = false;
                texture.coordinatesMode = Constants.TEXTURE_PROJECTION_MODE;

                this._refractionTexture?.dispose();
                this._refractionTexture = texture;

                for (const mesh of currentTransmissionMeshes) {
                    applyRefractionTexture(mesh);
                }
            };

            // Initialise _refractionTexture now, before _bindObjectList registers below.
            updateRefractionTexture();
            const buildObserver = nrg.onBuildObservable.add(updateRefractionTexture);
            disposables.push({ dispose: () => nrg.onBuildObservable.remove(buildObserver) });

            // When a new model finishes loading the canvas often resizes (reframe, UI update),
            // which triggers an NRG rebuild via rebuildGraphOnEngineResize. That rebuild runs
            // updateRefractionTexture() while currentTransmissionMeshes may be in flux, so the
            // material assignment can be left pointing at an orphaned InternalTexture.
            // Re-apply after every model change so the final settled state is always correct.
            const modelChangedObserver = this.onModelChanged.add(() => {
                for (const mesh of currentTransmissionMeshes) {
                    applyRefractionTexture(mesh);
                }
            });
            disposables.push({ dispose: () => this.onModelChanged.remove(modelChangedObserver) });
        }

        // ── SSS textures from geometry renderer ───────────────────────────────
        //
        // There is at most one GeometryRendererBlock in the graph. Extract its irradiance
        // and screen-depth outputs after every build and assign them to all OpenPBR
        // materials with subsurfaceWeight > 0, enabling the shader's
        // USE_IRRADIANCE_TEXTURE_FOR_SCATTERING path.
        //
        // Ordering: updateSSSTextures() is called BEFORE _bindObjectList below so the
        // wrappers are valid when the immediate rebuild fires applySSSTextures.
        const sssGeometryBlock = nrg.getBlocksByPredicate<NodeRenderGraphGeometryRendererBlock>((b) => b instanceof NodeRenderGraphGeometryRendererBlock)[0] ?? null;

        if (sssGeometryBlock) {
            let currentSSSmeshes: AbstractMesh[] = [];

            const isSSS = (mesh: AbstractMesh) =>
                mesh.material instanceof OpenPBRMaterial && (mesh.material.subsurfaceWeight > 0 || (mesh.material.transmissionWeight > 0 && mesh.material.transmissionDepth > 0));

            const applySSSTextures = (mesh: AbstractMesh) => {
                if (mesh.material instanceof OpenPBRMaterial) {
                    mesh.material.sssIrradianceTexture = this._sssIrradianceThinTexture;
                    mesh.material.sssDepthTexture = this._sssDepthThinTexture;
                }
            };

            const updateSSSTextures = () => {
                const irradianceInternal = nrg.frameGraph.textureManager.getTextureFromHandle(sssGeometryBlock.task.geometryIrradianceTexture);
                const depthInternal = nrg.frameGraph.textureManager.getTextureFromHandle(sssGeometryBlock.task.geometryScreenDepthTexture);
                if (!irradianceInternal || !depthInternal) {
                    return;
                }

                irradianceInternal.incrementReferences();
                depthInternal.incrementReferences();

                const irradianceThin = new ThinTexture(irradianceInternal);
                const depthThin = new ThinTexture(depthInternal);

                this._sssIrradianceThinTexture?.dispose();
                this._sssDepthThinTexture?.dispose();
                this._sssIrradianceThinTexture = irradianceThin;
                this._sssDepthThinTexture = depthThin;

                for (const mesh of currentSSSmeshes) {
                    applySSSTextures(mesh);
                }
            };

            // Initialise before _bindObjectList fires its immediate rebuild.
            updateSSSTextures();
            const sssBuildObserver = nrg.onBuildObservable.add(updateSSSTextures);
            disposables.push({ dispose: () => nrg.onBuildObservable.remove(sssBuildObserver) });

            // Re-apply after every model change (same race fence as refraction).
            const sssModelChangedObserver = this.onModelChanged.add(() => {
                for (const mesh of currentSSSmeshes) {
                    applySSSTextures(mesh);
                }
            });
            disposables.push({ dispose: () => this.onModelChanged.remove(sssModelChangedObserver) });

            disposables.push(
                this._bindObjectList((meshes) => {
                    currentSSSmeshes = meshes;
                    for (const mesh of meshes) {
                        applySSSTextures(mesh);
                    }
                }, isSSS)
            );
        }

        // ── ObjectList input blocks ────────────────────────────────────────────
        //
        // Find external ObjectList blocks by name and bind each to a custom filter.
        // autoFillExternalInputs already handles unnamed / unrecognised blocks by
        // assigning them the live scene.meshes reference.
        //
        // The transmission block's callback also tracks the live transmission mesh list
        // so the refraction texture can be (re-)applied whenever membership changes.
        for (const block of nrg.getInputBlocks()) {
            if (!block.isObjectList() || !block.isExternal) {
                continue;
            }

            const name: string = block.name.toLowerCase();
            let filter: Nullable<(mesh: AbstractMesh) => boolean> = null;

            if (name.includes("transmission")) {
                filter = isTransmission;
            } else if (name.includes("opaque")) {
                filter = (mesh) => !isTransmission(mesh);
            } else if (name.includes("all objects")) {
                filter = () => true;
            }

            if (filter) {
                // autoFillExternalInputs already assigned a FrameGraphObjectList to block.value
                // before buildAsync(). We mutate its .meshes property in place rather than
                // replacing block.value, which would clear the downstream output connection.
                const objectList = block.value as FrameGraphObjectList;
                const isTransmissionBlock = name.includes("transmission");

                disposables.push(
                    this._bindObjectList((meshes) => {
                        objectList.meshes = meshes;
                        if (isTransmissionBlock) {
                            // Track the live list and re-apply the refraction texture to any
                            // mesh that just entered the transmission bucket.
                            currentTransmissionMeshes = meshes;
                            for (const mesh of meshes) {
                                applyRefractionTexture(mesh);
                            }
                        }
                    }, filter)
                );
            }
        }

        // ── Snapshot-rendering guard ───────────────────────────────────────────
        //
        // The NRG rebuild triggered by engine resize sets frameGraph.pausedExecution = true
        // for the duration of buildAsync (which includes a waitForReadiness poll loop).
        // While pausedExecution is true, frameGraph.execute() is a no-op, so the engine
        // renders only the clear colour — not the scene. If the WebGPU snapshot helper
        // happens to capture a frame during this window it records the blank/background
        // frame as the snapshot, which then replays until the camera moves again.
        //
        // enableSnapshotRendering() already gates its capture on scene.executeWhenReady(),
        // which only fires once scene.isReady() returns true. Registering the frame graph
        // here as a scene readiness check adds the constraint that pausedExecution must be
        // false AND all tasks must be ready before the scene is considered ready. The
        // snapshot helper therefore cannot capture a frame during any NRG rebuild.
        const frameGraphReadyCheck = {
            isReady: () => !nrg.frameGraph.pausedExecution && nrg.frameGraph.isReady(),
        };
        this._scene.addIsReadyCheck(frameGraphReadyCheck);
        disposables.push({ dispose: () => this._scene.removeIsReadyCheck(frameGraphReadyCheck) });

        this._wiringDisposables = disposables;
    }

    private _tearDownNRG(): void {
        for (const d of this._wiringDisposables) {
            d.dispose();
        }
        this._wiringDisposables = [];
        this._nrg?.dispose();
        this._nrg = null;
        this._setActiveFrameGraph(null); // restores normal rendering + re-evaluates SSAO
    }

    protected override async _loadModel(source: string | File | ArrayBufferView, options?: LoadAssetContainerOptions, abortSignal?: AbortSignal): Promise<Model> {
        // Build a new options object — never mutate the caller's object.
        // useOpenPBR sits on ViewerLoadModelOptions; viewer.ts reads it via a cast on the options arg.
        // useOpenPBR is the DEFAULT here (true), but ...options spreads after so the caller can
        // override it — e.g. the material-type dropdown passing useOpenPBR: false to select PBR.
        const opts: ViewerLoadModelOptions & LoadAssetContainerOptions = {
            useOpenPBR: true,
            ...options,
            // Suppress the standard TransmissionHelper only when a frame graph is active —
            // the NRG handles transmission rendering directly in that case.
            // When no frame graph is active, fall back to the default TransmissionHelper behaviour.
            ...(this._scene.frameGraph !== null && {
                pluginOptions: {
                    ...options?.pluginOptions,
                    gltf: { dontUseTransmissionHelper: true, ...options?.pluginOptions?.gltf },
                },
            }),
        };

        return super._loadModel(source, opts, abortSignal);
    }

    public override dispose(): void {
        this._nrgAbortController?.abort();
        this._tearDownNRG();
        this._refractionTexture?.dispose();
        this._refractionTexture = null;
        this._sssIrradianceThinTexture?.dispose();
        this._sssIrradianceThinTexture = null;
        this._sssDepthThinTexture?.dispose();
        this._sssDepthThinTexture = null;
        super.dispose();
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// NRGViewerElement — custom element backed by NRGViewer
// ──────────────────────────────────────────────────────────────────────────────

@customElement("nrg-viewer")
export class NRGViewerElement extends ViewerElement<NRGViewer> {
    /**
     * The NodeRenderGraph snippet ID to load, e.g. "#CCDXLX".
     * Set to empty string or remove the attribute to revert to default rendering.
     */
    @property({ attribute: "node-render-graph" })
    public nodeRenderGraph: Nullable<string> = null;

    public constructor(options = {}) {
        super(NRGViewer, options);
    }

    protected override updated(changedProperties: Map<PropertyKey, unknown>): void {
        super.updated(changedProperties);
        if (changedProperties.has("nodeRenderGraph") && this._viewer) {
            this._viewer.nodeRenderGraph = this.nodeRenderGraph || null;
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "nrg-viewer": NRGViewerElement;
    }
}

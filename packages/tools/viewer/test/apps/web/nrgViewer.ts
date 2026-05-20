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

import { type AbstractMesh, type IDisposable, type Nullable } from "core/index";
import type { FrameGraphTextureHandle } from "core/FrameGraph/frameGraphTypes";
import type { FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";
import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { AbortError } from "core/Misc/error";
import { Viewer } from "../../../src/viewer";
import { ViewerElement } from "../../../src/viewerElement";
import { observePromise } from "../../../src/viewerBase";
import { customElement, property } from "lit/decorators.js";

// ──────────────────────────────────────────────────────────────────────────────
// NRGViewer — Viewer subclass that adds NodeRenderGraph support
// ──────────────────────────────────────────────────────────────────────────────

export class NRGViewer extends Viewer {
    private _snippetId: Nullable<string> = null;
    private _nrg: Nullable<NodeRenderGraph> = null;
    private _wiringDisposables: IDisposable[] = [];
    private _nrgAbortController: Nullable<AbortController> = null;

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
        this._nrgAbortController?.abort();
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
            const [{ NodeRenderGraph }] = await Promise.all([
                import("core/FrameGraph/Node/nodeRenderGraph"),
                import("core/FrameGraph/Node/Blocks/allBlocks"),
            ]);

            abortController.signal.throwIfAborted();

            const nrg = await NodeRenderGraph.ParseFromSnippetAsync(
                snippetId,
                this._scene,
                { autoFillExternalInputs: true },
                undefined,
                /* skipBuild */ true
            );

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
    private _wireNRG(nrg: NodeRenderGraph): void {
        const disposables: IDisposable[] = [];

        // ── ObjectList input blocks ────────────────────────────────────────────
        //
        // Find external ObjectList blocks by name and bind each to a custom filter.
        // autoFillExternalInputs already handles unnamed / unrecognised blocks by
        // assigning them the live scene.meshes reference.
        const isTransmission = (mesh: AbstractMesh) => {
            const mat = mesh.material;
            return (
                (mat instanceof OpenPBRMaterial && (mat.transmissionWeight > 0 || mat.subsurfaceWeight > 0)) ||
                (mat instanceof PBRMaterial && mat.subSurface.isRefractionEnabled)
            );
        };

        for (const block of nrg.getInputBlocks()) {
            if (!block.isObjectList() || !block.isExternal) {
                continue;
            }

            const name: string = block.name.toLowerCase();
            let filter: Nullable<(mesh: AbstractMesh) => boolean> = null;

            if (name.includes("transmission")) {
                filter = (mesh) => isTransmission(mesh);
            } else if (name.includes("opaque")) {
                // All non-transmission meshes — used as the refraction RTT source.
                filter = (mesh) => !isTransmission(mesh);
            } else if (name.includes("all objects")) {
                filter = (mesh) => true;
            }

            if (filter) {
                // autoFillExternalInputs already assigned a FrameGraphObjectList to block.value
                // before buildAsync(). We mutate its .meshes property in place rather than
                // replacing block.value, which would clear the downstream output connection.
                const objectList = block.value as FrameGraphObjectList;
                disposables.push(this._bindObjectList((meshes) => { objectList.meshes = meshes; }, filter));
            }
        }

        // ── Material updates from NRG outputs ─────────────────────────────────
        //
        // To read a texture produced by the NRG and apply it to materials, subscribe
        // to an observable that fires after the graph executes. For example:
        //
          // outputs[0].value on a texture output block is a FrameGraphTextureHandle (a number).
          const handle = nrg.getBlockByName("Refraction Texture")?.outputs[0]?.value as FrameGraphTextureHandle | undefined;
          const observer = this._scene.onAfterRenderObservable.add(() => {
              if (handle === undefined) {
                  return;
              }
              // getTextureFromHandle returns Nullable<InternalTexture> — the raw GPU texture.
              // refractionTexture / backgroundRefractionTexture both expect Nullable<BaseTexture>,
              // so a RenderTargetTexture wrapper is needed before assigning to a material.
              const internalTexture: Nullable<InternalTexture> = nrg.frameGraph.textureManager.getTextureFromHandle(handle);
              for (const mesh of this._scene.meshes) {
                  if (isTransmission(mesh)) {
                      if (mesh.material instanceof PBRMaterial) {
                          // refractionTexture lives on the subSurface component, not the material directly.
                          mesh.material.subSurface.refractionTexture = internalTexture as never;
                      } else if (mesh.material instanceof OpenPBRMaterial) {
                          mesh.material.backgroundRefractionTexture = internalTexture as never;
                      }
                  }
              }
          });
          disposables.push({ dispose: () => this._scene.onAfterRenderObservable.remove(observer) });

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

    public override dispose(): void {
        this._nrgAbortController?.abort();
        this._tearDownNRG();
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

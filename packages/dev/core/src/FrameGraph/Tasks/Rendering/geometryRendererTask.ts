import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";
import { Color4 } from "core/Maths/math.color";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { TextureClearType } from "core/Materials/materialHelper.geometryrendering";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { Constants } from "core/Engines/constants";
import { FrameGraphTask } from "../../frameGraphTask";
import type { FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";

export interface IFrameGraphGeometryRendererTextureDescription {
    type: number;
    textureType: number;
    textureFormat: number;
}

const clearColors: Color4[] = [new Color4(0, 0, 0, 0), new Color4(1, 1, 1, 1), new Color4(1e8, 1e8, 1e8, 1e8)];

export class FrameGraphGeometryRendererTask extends FrameGraphTask {
    public depthTexture?: FrameGraphTextureHandle;

    private _camera: Camera;

    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._rtt.activeCamera = this.camera;
    }

    public objectList: FrameGraphObjectList;

    public depthTest = true;

    public depthWrite = true;

    public size: { width: number; height: number } = { width: 100, height: 100 };

    public sizeIsPercentage = true;

    public samples = 1;

    public textureDescriptions: IFrameGraphGeometryRendererTextureDescription[] = [];

    public readonly outputDepthTexture: FrameGraphTextureHandle;

    public readonly geometryViewDepthTexture: FrameGraphTextureHandle;

    public readonly geometryScreenDepthTexture: FrameGraphTextureHandle;

    public readonly geometryViewNormalTexture: FrameGraphTextureHandle;

    public readonly geometryWorldNormalTexture: FrameGraphTextureHandle;

    public readonly geometryLocalPositionTexture: FrameGraphTextureHandle;

    public readonly geometryWorldPositionTexture: FrameGraphTextureHandle;

    public readonly geometryAlbedoTexture: FrameGraphTextureHandle;

    public readonly geometryReflectivityTexture: FrameGraphTextureHandle;

    public readonly geometryVelocityTexture: FrameGraphTextureHandle;

    public readonly geometryLinearVelocityTexture: FrameGraphTextureHandle;

    public get renderTargetTexture() {
        return this._rtt;
    }

    public override get name() {
        return this._name;
    }

    public override set name(value: string) {
        this._name = value;
        if (this._rtt) {
            this._rtt.name = value + "_internal_rtt";
        }
    }

    private _engine: AbstractEngine;
    private _scene: Scene;
    private _rtt: RenderTargetTexture;
    private _clearAttachmentsLayout: Map<TextureClearType, number[]>;
    private _allAttachmentsLayout: number[];

    constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph);

        this._scene = scene;
        this._engine = this._scene.getEngine();

        this._rtt = new RenderTargetTexture(name, 1, scene, {
            delayAllocation: true,
        });
        this._rtt.skipInitialClear = true;
        this._rtt.renderSprites = false;
        this._rtt.renderParticles = false;

        this.name = name;
        this._clearAttachmentsLayout = new Map();
        this._allAttachmentsLayout = [];

        this.outputDepthTexture = this._frameGraph.createDanglingHandle();
        this.geometryViewDepthTexture = this._frameGraph.createDanglingHandle();
        this.geometryScreenDepthTexture = this._frameGraph.createDanglingHandle();
        this.geometryViewNormalTexture = this._frameGraph.createDanglingHandle();
        this.geometryWorldNormalTexture = this._frameGraph.createDanglingHandle();
        this.geometryLocalPositionTexture = this._frameGraph.createDanglingHandle();
        this.geometryWorldPositionTexture = this._frameGraph.createDanglingHandle();
        this.geometryAlbedoTexture = this._frameGraph.createDanglingHandle();
        this.geometryReflectivityTexture = this._frameGraph.createDanglingHandle();
        this.geometryVelocityTexture = this._frameGraph.createDanglingHandle();
        this.geometryLinearVelocityTexture = this._frameGraph.createDanglingHandle();
    }

    public get excludedSkinnedMeshFromVelocityTexture() {
        return MaterialHelperGeometryRendering.GetConfiguration(this._rtt.renderPassId).excludedSkinnedMesh;
    }

    public override isReady() {
        return this._rtt.isReadyForRendering();
    }

    public record() {
        if (this.textureDescriptions.length === 0 || this.objectList === undefined) {
            throw new Error(`FrameGraphGeometryRendererTask ${this.name}: object list and at least one geometry texture description must be provided`);
        }

        const outputTextureHandle = this._createMultiRenderTargetTexture();

        const depthEnabled = this._checkDepthTextureCompatibility();

        this._buildClearAttachmentsLayout();

        this._registerForRenderPassId(this._rtt.renderPassId);

        const outputTextureDescription = this._frameGraph.getTextureDescription(outputTextureHandle);

        this._rtt._size = outputTextureDescription.size;

        // Create pass
        MaterialHelperGeometryRendering.MarkAsDirty(this._rtt.renderPassId, this.objectList.meshes || this._scene.meshes);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);

        let handle = outputTextureHandle + 1;
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            switch (geometryDescription.type) {
                case Constants.PREPASS_DEPTH_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryViewDepthTexture, handle++);
                    break;
                case Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryScreenDepthTexture, handle++);
                    break;
                case Constants.PREPASS_NORMAL_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryViewNormalTexture, handle++);
                    break;
                case Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryWorldNormalTexture, handle++);
                    break;
                case Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryLocalPositionTexture, handle++);
                    break;
                case Constants.PREPASS_POSITION_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryWorldPositionTexture, handle++);
                    break;
                case Constants.PREPASS_ALBEDO_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryAlbedoTexture, handle++);
                    break;
                case Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryReflectivityTexture, handle++);
                    break;
                case Constants.PREPASS_VELOCITY_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryVelocityTexture, handle++);
                    break;
                case Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE:
                    this._frameGraph.resolveDanglingHandle(this.geometryLinearVelocityTexture, handle++);
                    break;
            }
        }

        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(this.depthTexture);
        }

        pass.setExecuteFunc((context) => {
            this._rtt.renderList = this.objectList.meshes;
            this._rtt.particleSystemList = this.objectList.particleSystems;

            this._scene.incrementRenderId();
            this._scene.resetCachedMaterial();

            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);

            this._clearAttachmentsLayout.forEach((layout, clearType) => {
                context.clearColorAttachments(clearColors[clearType], layout);
            });

            context.bindAttachments(this._allAttachmentsLayout);

            context.render(this._rtt);
        });
    }

    public override dispose(): void {
        MaterialHelperGeometryRendering.DeleteConfiguration(this._rtt.renderPassId);
        this._rtt.dispose();
        super.dispose();
    }

    private _createMultiRenderTargetTexture(): FrameGraphTextureHandle {
        const types: number[] = [];
        const formats: number[] = [];
        const labels: string[] = [];
        const useSRGBBuffers: boolean[] = [];

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);

            if (index === -1) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: unknown texture type ${description.type}`);
            }

            types[i] = description.textureType;
            formats[i] = description.textureFormat;
            labels[i] = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index].name;
            useSRGBBuffers[i] = false;
        }

        return this._frameGraph.createRenderTargetTexture(
            this.name,
            {
                size: this.size,
                sizeIsPercentage: this.sizeIsPercentage,
                options: {
                    createMipMaps: false,
                    generateDepthBuffer: false,
                    textureCount: this.textureDescriptions.length,
                    samples: this.samples,
                    types,
                    formats,
                    useSRGBBuffers,
                    labels,
                },
            },
            true
        );
    }

    private _checkDepthTextureCompatibility(): boolean {
        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            if (this.depthTexture === backbufferDepthStencilTextureHandle) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth/stencil back buffer is not allowed as a depth texture`);
            }

            const depthTextureDescription = this._frameGraph.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== this.samples) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            this._frameGraph.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);

            depthEnabled = true;
        }

        return depthEnabled;
    }

    private _buildClearAttachmentsLayout() {
        const clearAttachmentsLayout = new Map<TextureClearType, boolean[]>();
        const allAttachmentsLayout: boolean[] = [];

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            let layout = clearAttachmentsLayout.get(geometryDescription.clearType);
            if (layout === undefined) {
                layout = [];
                clearAttachmentsLayout.set(geometryDescription.clearType, layout);
                for (let j = 0; j < i; j++) {
                    layout[j] = false;
                }
            }

            clearAttachmentsLayout.forEach((layout, clearType) => {
                layout.push(clearType === geometryDescription.clearType);
            });

            allAttachmentsLayout.push(true);
        }

        this._clearAttachmentsLayout = new Map();

        clearAttachmentsLayout.forEach((layout, clearType) => {
            this._clearAttachmentsLayout.set(clearType, this._engine.buildTextureLayout(layout));
        });

        this._allAttachmentsLayout = this._engine.buildTextureLayout(allAttachmentsLayout);
    }

    private _registerForRenderPassId(renderPassId: number) {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            configuration.defines[geometryDescription.defineIndex] = i;
        }
    }
}

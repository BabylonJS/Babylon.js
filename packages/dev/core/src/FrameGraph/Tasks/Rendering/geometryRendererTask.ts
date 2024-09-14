import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphTextureId, FrameGraphObjectListId, FrameGraphTextureHandle } from "../../frameGraphTypes";
import { backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";
import { Constants } from "core/Engines/constants";
import { Color4 } from "core/Maths/math.color";
import type { AbstractEngine } from "core/Engines/abstractEngine";

export interface IFrameGraphGeometryRendererTextureDescription {
    type: number;
    textureType: number;
    textureFormat: number;
}

const enum TextureClearType {
    Zero = 0,
    One = 1,
    MaxViewZ = 2,
}

const clearColors: Color4[] = [new Color4(0, 0, 0, 0), new Color4(1, 1, 1, 1), new Color4(1e8, 1e8, 1e8, 1e8)];

const geometryTextureDescriptions = [
    {
        type: Constants.PREPASS_IRRADIANCE_TEXTURE_TYPE,
        name: "Irradiance",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_POSITION_TEXTURE_TYPE,
        name: "Position",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
        name: "Velocity",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
        name: "Reflectivity",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_DEPTH_TEXTURE_TYPE /* this is the Z coordinate in view space */,
        name: "Depth",
        clearType: TextureClearType.MaxViewZ,
    },
    {
        type: Constants.PREPASS_NORMAL_TEXTURE_TYPE,
        name: "Normal",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE,
        name: "Albedo",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
        name: "WorldNormal",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
        name: "LocalPosition",
        clearType: TextureClearType.Zero,
    },
    {
        type: Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE,
        name: "ScreenDepth",
        clearType: TextureClearType.One,
    },
    {
        type: Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE,
        name: "VelocityLinear",
        clearType: TextureClearType.Zero,
    },
];

export class FrameGraphGeometryRendererTask implements IFrameGraphTask {
    public depthTexture?: FrameGraphTextureId;

    private _camera: Camera;

    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._rtt.activeCamera = this.camera;
    }

    public objectList: FrameGraphObjectListId;

    public depthTest = true;

    public depthWrite = true;

    public size: { width: number; height: number } = { width: 100, height: 100 };
    public sizeIsPercentage = true;
    public samples = 1;
    public descriptions: IFrameGraphGeometryRendererTextureDescription[] = [];

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public readonly outputDepthTextureReference: FrameGraphTaskOutputReference = [this, "outputDepth"];

    public readonly geometryViewDepthTextureReference: FrameGraphTaskOutputReference = [this, "geometryViewDepth"];

    public readonly geometryScreenDepthTextureReference: FrameGraphTaskOutputReference = [this, "geometryScreenDepth"];

    public readonly geometryNormalTextureReference: FrameGraphTaskOutputReference = [this, "geometryNormal"];

    public readonly geometryPositionTextureReference: FrameGraphTaskOutputReference = [this, "geometryPosition"];

    public readonly geometryAlbedoTextureReference: FrameGraphTaskOutputReference = [this, "geometryAlbedo"];

    public readonly geometryReflectivityTextureReference: FrameGraphTaskOutputReference = [this, "geometryReflectivity"];

    public readonly geometryVelocityTextureReference: FrameGraphTaskOutputReference = [this, "geometryVelocity"];

    public disabled = false;

    public get renderTargetTexture() {
        return this._rtt;
    }

    private _name: string;

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this._rtt.name = value + "_internal_rtt";
    }

    private _engine: AbstractEngine;
    private _scene: Scene;
    private _rtt: RenderTargetTexture;
    private _clearAttachmentsLayout: Map<TextureClearType, number[]>;
    private _allAttachmentsLayout: number[];

    constructor(name: string, scene: Scene) {
        this._scene = scene;
        this._engine = this._scene.getEngine();
        this._rtt = new RenderTargetTexture(name, 1, scene, {
            delayAllocation: true,
        });
        this._rtt.skipInitialClear = true;
        this.name = name;
        this._clearAttachmentsLayout = new Map();
        this._allAttachmentsLayout = [];
    }

    public isReadyFrameGraph() {
        return this._rtt.isReadyForRendering();
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.descriptions.length === 0 || this.objectList === undefined) {
            throw new Error(`FrameGraphGeometryRendererTask ${this.name}: object list and at least one geometry texture description must be provided`);
        }

        const outputTextureHandle = this._createMultiRenderTargetTexture(frameGraph);

        const depthEnabled = this._checkDepthTextureCompatibility(frameGraph);

        this._buildClearAttachmentsLayout();

        const outputTextureDescription = frameGraph.getTextureDescription(outputTextureHandle);

        this._rtt._size = outputTextureDescription.size;

        // Create pass
        const objectList = frameGraph.getObjectList(this.objectList);

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);

        pass.setOutputTexture(outputTextureHandle, 0, this.geometryViewDepthTextureReference[1]);
        pass.setOutputTexture(outputTextureHandle, 0, this.geometryScreenDepthTextureReference[1]);
        pass.setOutputTexture(outputTextureHandle, 0, this.geometryNormalTextureReference[1]);
        pass.setOutputTexture(outputTextureHandle, 0, this.geometryPositionTextureReference[1]);
        pass.setOutputTexture(outputTextureHandle, 0, this.geometryAlbedoTextureReference[1]);
        pass.setOutputTexture(outputTextureHandle, 0, this.geometryReflectivityTextureReference[1]);
        pass.setOutputTexture(outputTextureHandle, 0, this.geometryVelocityTextureReference[1]);

        if (this.depthTexture !== undefined) {
            pass.setRenderTargetDepth(frameGraph.getTextureHandle(this.depthTexture));
        }

        pass.setExecuteFunc((context) => {
            this._rtt.renderList = objectList.meshes;
            this._rtt.particleSystemList = objectList.particleSystems;

            this._scene.incrementRenderId();

            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);

            this._clearAttachmentsLayout.forEach((layout, clearType) => {
                context.clearColorAttachments(clearColors[clearType], layout);
            });

            context.bindAttachments(this._allAttachmentsLayout);

            context.render(this._rtt);
        });
    }

    public disposeFrameGraph(): void {
        this._rtt.dispose();
    }

    private _createMultiRenderTargetTexture(frameGraph: FrameGraph): FrameGraphTextureHandle {
        const types: number[] = [];
        const formats: number[] = [];
        const labels: string[] = [];

        for (let i = 0; i < this.descriptions.length; i++) {
            const description = this.descriptions[i];
            const index = geometryTextureDescriptions.findIndex((f) => f.type === description.type);

            if (index === -1) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: unknown texture type ${description.type}`);
            }

            types[i] = description.textureType;
            formats[i] = description.textureFormat;
            labels[i] = geometryTextureDescriptions[index].name;
        }

        return frameGraph.createRenderTargetTexture(this.name, {
            size: this.size,
            sizeIsPercentage: this.sizeIsPercentage,
            options: {
                createMipMaps: false,
                generateDepthBuffer: false,
                textureCount: this.descriptions.length,
                samples: this.samples,
                types,
                formats,
                labels,
            },
        });
    }

    private _checkDepthTextureCompatibility(frameGraph: FrameGraph): boolean {
        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            const depthTextureHandle = frameGraph.getTextureHandle(this.depthTexture);
            if (depthTextureHandle === backbufferDepthStencilTextureHandle) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth/stencil back buffer is not allowed as a depth texture`);
            }

            const depthTextureDescription = frameGraph.getTextureDescription(depthTextureHandle);
            if (depthTextureDescription.options.samples !== this.samples) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            depthEnabled = true;
        }

        return depthEnabled;
    }

    private _buildClearAttachmentsLayout() {
        const clearAttachmentsLayout = new Map<TextureClearType, boolean[]>();
        const allAttachmentsLayout: boolean[] = [];

        for (let i = 0; i < this.descriptions.length; i++) {
            const description = this.descriptions[i];
            const index = geometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = geometryTextureDescriptions[index];

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
}

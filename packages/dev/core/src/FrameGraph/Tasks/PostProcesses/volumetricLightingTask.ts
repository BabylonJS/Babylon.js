import type { Camera, DirectionalLight, FrameGraph, FrameGraphObjectList, FrameGraphTextureHandle } from "core/index";
import { FrameGraphVolumetricLightingBlendVolumeTask } from "./volumetricLightingBlendVolumeTask";
import { Matrix, TmpVectors, Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { FrameGraphTask } from "../../frameGraphTask";
import { Constants } from "core/Engines/constants";
import { FrameGraphClearTextureTask } from "../Texture/clearTextureTask";
import { FrameGraphObjectRendererTask } from "../Rendering/objectRendererTask";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

const InvViewProjectionMatrix = new Matrix();

/**
 * A frame graph task that performs volumetric lighting.
 */
export class FrameGraphVolumetricLightingTask extends FrameGraphTask {
    /**
     * The target texture to which the volumetric lighting will be applied.
     */
    public targetTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use when blending the volumetric lighting texture with targetTexture.
     */
    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The depth texture used for volumetric lighting calculations.
     * It must be the depth texture used to generate targetTexture.
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * The camera used for volumetric lighting calculations.
     */
    public camera: Camera;

    /**
     * The mesh representing the lighting volume.
     * This is the mesh that will be rendered to create the volumetric lighting effect.
     */
    public lightingVolumeMesh: FrameGraphObjectList;

    /**
     * The directional light used for volumetric lighting.
     */
    public light: DirectionalLight;

    /**
     * The lighting volume texture (optional).
     * If not provided, a new texture will be created, with the same size, format and type as targetTexture.
     * This is the texture that will store the volumetric lighting information, before being blended to targetTexture.
     */
    public lightingVolumeTexture?: FrameGraphTextureHandle;

    private _extinctionPhaseG = new Vector4(0, 0, 0, 0);

    /**
     * The phase G parameter for the volumetric lighting effect (default: 0).
     * This parameter controls the anisotropy of the scattering.
     * A value of 0 means isotropic scattering, while a value of 1 means forward scattering and -1 means backward scattering.
     */
    public get phaseG() {
        return this._extinctionPhaseG.w;
    }

    public set phaseG(value: number) {
        this._extinctionPhaseG.w = value;
        this._renderLightingVolumeMaterial.setVector4("extinctionPhaseG", this._extinctionPhaseG);
    }

    /**
     * Whether to enable extinction in the volumetric lighting effect (default: false).
     * Read-only property set in the constructor.
     */
    public readonly enableExtinction: boolean;

    /**
     * The extinction coefficient for the volumetric lighting effect (default: (0, 0, 0) - no extinction).
     * This parameter controls how much light is absorbed and scattered as it travels through the medium.
     * Will only have an effect if enableExtinction is set to true in the constructor!
     */
    public get extinction() {
        return this._blendLightingVolumeTask.postProcess.extinction;
    }

    public set extinction(value: Vector3) {
        this._extinctionPhaseG.x = Math.max(value.x, 1e-6);
        this._extinctionPhaseG.y = Math.max(value.y, 1e-6);
        this._extinctionPhaseG.z = Math.max(value.z, 1e-6);
        this._renderLightingVolumeMaterial.setVector4("extinctionPhaseG", this._extinctionPhaseG);
        this._blendLightingVolumeTask.postProcess.extinction.copyFromFloats(this._extinctionPhaseG.x, this._extinctionPhaseG.y, this._extinctionPhaseG.z);
    }

    private _lightPower = new Color3(1, 1, 1);

    /**
     * The light power/color for the volumetric lighting effect (default: (1, 1, 1)).
     * This parameter controls the intensity and color of the light used for volumetric lighting.
     */
    public get lightPower() {
        return this._lightPower;
    }

    public set lightPower(value: Color3) {
        this._lightPower.copyFrom(value);
        this._renderLightingVolumeMaterial.setColor3("lightPower", this._lightPower);
    }

    public override get name() {
        return this._name;
    }

    public override set name(name: string) {
        this._name = name;
        if (this._renderLightingVolumeMaterial) {
            this._renderLightingVolumeMaterial.name = `${name} - render lighting volume`;
        }
        if (this._clearLightingVolumeTextureTask) {
            this._clearLightingVolumeTextureTask.name = `${name} - clear lighting volume texture`;
        }
        if (this._renderLightingVolumeTask) {
            this._renderLightingVolumeTask.name = `${name} - render lighting volume`;
        }
        if (this._blendLightingVolumeTask) {
            this._blendLightingVolumeTask.name = `${name} - blend lighting volume`;
        }
    }

    /**
     * The output texture of the task. It will be the same as targetTexture.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    private readonly _clearLightingVolumeTextureTask: FrameGraphClearTextureTask;
    private readonly _renderLightingVolumeTask: FrameGraphObjectRendererTask;
    private readonly _blendLightingVolumeTask: FrameGraphVolumetricLightingBlendVolumeTask;
    private _renderLightingVolumeMaterial: ShaderMaterial;

    /**
     * Creates a new FrameGraphVolumetricLightingTask.
     * @param name The name of the task.
     * @param frameGraph The frame graph to which the task belongs.
     * @param enableExtinction Whether to enable extinction in the volumetric lighting effect (default: false). If you don't plan to set extinction to something different than (0, 0, 0), you can disable this to save some performance.
     */
    constructor(name: string, frameGraph: FrameGraph, enableExtinction = false) {
        super(name, frameGraph);

        this.enableExtinction = enableExtinction;

        const isWebGPU = this._frameGraph.engine.isWebGPU;

        this._renderLightingVolumeMaterial = new ShaderMaterial(`${name} - render lighting volume`, this._frameGraph.scene, "volumetricLightingRenderVolume", {
            attributes: ["position"],
            uniformBuffers: ["Scene", "Mesh"],
            uniforms: ["world", "viewProjection", "vEyePosition", "lightDir", "invViewProjection", "outputTextureSize", "extinctionPhaseG", "lightPower", "textureRatio"],
            samplers: ["depthTexture"],
            defines: enableExtinction ? ["USE_EXTINCTION"] : [],
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            needAlphaBlending: true,
        });
        this._renderLightingVolumeMaterial.backFaceCulling = false;
        this._renderLightingVolumeMaterial.alphaMode = Constants.ALPHA_ADD;
        this._renderLightingVolumeMaterial.onBindObservable.add(() => {
            this._renderLightingVolumeMaterial.bindEyePosition(this._renderLightingVolumeMaterial.getEffect());
        });

        this._clearLightingVolumeTextureTask = new FrameGraphClearTextureTask(`clear lighting volume texture`, frameGraph);
        this._renderLightingVolumeTask = new FrameGraphObjectRendererTask(`render lighting volume`, frameGraph, frameGraph.scene);
        this._blendLightingVolumeTask = new FrameGraphVolumetricLightingBlendVolumeTask(`blend lighting volume texture`, frameGraph, enableExtinction);

        this.onTexturesAllocatedObservable.add(() => {
            this._renderLightingVolumeMaterial.setInternalTexture("depthTexture", frameGraph.textureManager.getTextureFromHandle(this.depthTexture)!);
        });

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();

        // Triggers the setters to set the uniforms
        this.phaseG = this._extinctionPhaseG.w;
        this.extinction = new Vector3(this.extinction.x, this.extinction.y, this.extinction.z);
        this.lightPower = this._lightPower;
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public override initAsync(): Promise<unknown> {
        if (this._frameGraph.engine.isWebGPU) {
            return Promise.all([import("../../../ShadersWGSL/volumetricLightingRenderVolume.vertex"), import("../../../ShadersWGSL/volumetricLightingRenderVolume.fragment")]);
        }

        return Promise.all([import("../../../Shaders/volumetricLightingRenderVolume.vertex"), import("../../../Shaders/volumetricLightingRenderVolume.fragment")]);
    }

    public override isReady() {
        return (
            this._renderLightingVolumeMaterial.isReady() &&
            this._clearLightingVolumeTextureTask.isReady() &&
            this._renderLightingVolumeMaterial.isReady() &&
            this._blendLightingVolumeTask.isReady()
        );
    }

    public override getClassName(): string {
        return "FrameGraphVolumetricLightingTask";
    }

    public record(skipCreationOfDisabledPasses = false) {
        if (this.targetTexture === undefined || this.depthTexture === undefined || this.camera === undefined || this.lightingVolumeMesh === undefined || this.light === undefined) {
            throw new Error(`FrameGraphVolumetricLightingTask "${this.name}": targetTexture, depthTexture, camera, lightingVolumeMesh and light are required`);
        }
        if (!this.lightingVolumeMesh.meshes || this.lightingVolumeMesh.meshes.length === 0) {
            throw new Error(`FrameGraphVolumetricLightingTask "${this.name}": lightingVolumeMesh is empty`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);

        const textureManager = this._frameGraph.textureManager;

        let lightingVolumeTexture = this.lightingVolumeTexture;
        if (!lightingVolumeTexture) {
            const targetTextureCreationOptions = textureManager.getTextureCreationOptions(this.targetTexture);

            targetTextureCreationOptions.options.labels = ["InScattering"];
            targetTextureCreationOptions.options.samples = 1;

            lightingVolumeTexture = textureManager.createRenderTargetTexture(`${this.name} - lighting volume texture`, targetTextureCreationOptions);
        }

        this.lightingVolumeMesh.meshes[0].material = this._renderLightingVolumeMaterial;

        const targetTextureSize = textureManager.getTextureAbsoluteDimensions(this.targetTexture);
        const volumeTextureSize = textureManager.getTextureAbsoluteDimensions(lightingVolumeTexture);

        this._renderLightingVolumeMaterial.setVector2(
            "textureRatio",
            new Vector2(targetTextureSize.width / volumeTextureSize.width, targetTextureSize.height / volumeTextureSize.height)
        );
        this._renderLightingVolumeMaterial.setVector2("outputTextureSize", new Vector2(volumeTextureSize.width, volumeTextureSize.height));

        const passUpdateMaterial = this._frameGraph.addPass(this.name);

        passUpdateMaterial.setExecuteFunc(() => {
            this.camera.getTransformationMatrix().invertToRef(InvViewProjectionMatrix);

            this._renderLightingVolumeMaterial.setMatrix("invViewProjection", InvViewProjectionMatrix);
            this._renderLightingVolumeMaterial.setVector3("lightDir", this.light.direction.normalizeToRef(TmpVectors.Vector3[0]));
        });

        this._clearLightingVolumeTextureTask.clearColor = true;
        this._clearLightingVolumeTextureTask.clearStencil = this.enableExtinction;
        this._clearLightingVolumeTextureTask.color = new Color4(0, 0, 0, 1);
        this._clearLightingVolumeTextureTask.stencilValue = 0;
        this._clearLightingVolumeTextureTask.targetTexture = lightingVolumeTexture;
        this._clearLightingVolumeTextureTask.record(true);

        this._renderLightingVolumeTask.targetTexture = this._clearLightingVolumeTextureTask.outputTexture;
        this._renderLightingVolumeTask.objectList = this.lightingVolumeMesh;
        this._renderLightingVolumeTask.camera = this.camera;
        this._renderLightingVolumeTask.disableImageProcessing = true;
        this._renderLightingVolumeTask.depthTest = false;
        this._renderLightingVolumeTask.record(true);

        this._blendLightingVolumeTask.sourceTexture = this._renderLightingVolumeTask.outputTexture;
        this._blendLightingVolumeTask.sourceSamplingMode = this.sourceSamplingMode;
        this._blendLightingVolumeTask.targetTexture = this.targetTexture;
        this._blendLightingVolumeTask.depthTexture = this.depthTexture;
        this._blendLightingVolumeTask.camera = this.camera;
        this._blendLightingVolumeTask.record(true);

        if (!skipCreationOfDisabledPasses) {
            const disabledPass = this._frameGraph.addPass(this.name + "_disabled", true);

            disabledPass.setExecuteFunc(() => {});
        }
    }

    public override dispose() {
        this._renderLightingVolumeMaterial?.dispose();
        this._clearLightingVolumeTextureTask.dispose();
        this._renderLightingVolumeTask.dispose();
        this._blendLightingVolumeTask.dispose();
        super.dispose();
    }
}

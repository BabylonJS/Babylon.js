// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph, FrameGraphObjectList, IShadowLight, WritableObject, FrameGraphTextureHandle, Camera } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { ShadowGenerator } from "../../../Lights/Shadows/shadowGenerator";

/**
 * Task used to generate shadows from a list of objects.
 */
export class FrameGraphShadowGeneratorTask extends FrameGraphTask {
    /**
     * The object list that generates shadows.
     */
    public objectList: FrameGraphObjectList;

    private _light: IShadowLight;
    /**
     * The light to generate shadows from.
     */
    public get light(): IShadowLight {
        return this._light;
    }

    public set light(value: IShadowLight) {
        if (value === this._light) {
            return;
        }

        this._light = value;
        this._setupShadowGenerator();
    }

    private _camera: Camera;
    /**
     * Gets or sets the camera used to generate the shadow generator.
     */
    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._setupShadowGenerator();
    }

    private _mapSize = 1024;
    /**
     * The size of the shadow map.
     */
    public get mapSize() {
        return this._mapSize;
    }

    public set mapSize(value: number) {
        if (value === this._mapSize) {
            return;
        }

        this._mapSize = value;
        this._setupShadowGenerator();
    }

    private _useFloat32TextureType = false;
    /**
     * If true, the shadow map will use a 32 bits float texture type (else, 16 bits float is used if supported).
     */
    public get useFloat32TextureType() {
        return this._useFloat32TextureType;
    }

    public set useFloat32TextureType(value: boolean) {
        if (value === this._useFloat32TextureType) {
            return;
        }

        this._useFloat32TextureType = value;
        this._setupShadowGenerator();
    }

    private _useRedTextureFormat = true;
    /**
     * If true, the shadow map will use a red texture format (else, a RGBA format is used).
     */
    public get useRedTextureFormat() {
        return this._useRedTextureFormat;
    }

    public set useRedTextureFormat(value: boolean) {
        if (value === this._useRedTextureFormat) {
            return;
        }

        this._useRedTextureFormat = value;
        this._setupShadowGenerator();
    }

    private _bias = 0.01;
    /**
     * The bias to apply to the shadow map.
     */
    public get bias() {
        return this._bias;
    }

    public set bias(value: number) {
        if (value === this._bias) {
            return;
        }

        this._bias = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.bias = value;
        }
    }

    private _normalBias = 0;
    /**
     * The normal bias to apply to the shadow map.
     */
    public get normalBias() {
        return this._normalBias;
    }

    public set normalBias(value: number) {
        if (value === this._normalBias) {
            return;
        }

        this._normalBias = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.normalBias = value;
        }
    }

    private _darkness = 0;
    /**
     * The darkness of the shadows.
     */
    public get darkness() {
        return this._darkness;
    }

    public set darkness(value: number) {
        if (value === this._darkness) {
            return;
        }

        this._darkness = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.darkness = value;
        }
    }

    private _transparencyShadow = false;
    /**
     * Gets or sets the ability to have transparent shadow
     */
    public get transparencyShadow() {
        return this._transparencyShadow;
    }

    public set transparencyShadow(value: boolean) {
        if (value === this._transparencyShadow) {
            return;
        }

        this._transparencyShadow = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.transparencyShadow = value;
        }
    }

    private _enableSoftTransparentShadow = false;
    /**
     * Enables or disables shadows with varying strength based on the transparency
     */
    public get enableSoftTransparentShadow() {
        return this._enableSoftTransparentShadow;
    }

    public set enableSoftTransparentShadow(value: boolean) {
        if (value === this._enableSoftTransparentShadow) {
            return;
        }

        this._enableSoftTransparentShadow = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.enableSoftTransparentShadow = value;
        }
    }

    private _useOpacityTextureForTransparentShadow = false;
    /**
     * If this is true, use the opacity texture's alpha channel for transparent shadows instead of the diffuse one
     */
    public get useOpacityTextureForTransparentShadow() {
        return this._useOpacityTextureForTransparentShadow;
    }

    public set useOpacityTextureForTransparentShadow(value: boolean) {
        if (value === this._useOpacityTextureForTransparentShadow) {
            return;
        }

        this._useOpacityTextureForTransparentShadow = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.useOpacityTextureForTransparentShadow = value;
        }
    }

    private _filter = ShadowGenerator.FILTER_PCF;
    /**
     * The filter to apply to the shadow map.
     */
    public get filter() {
        return this._filter;
    }

    public set filter(value: number) {
        if (value === this._filter) {
            return;
        }

        this._filter = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.filter = value;
        }
    }

    private _filteringQuality = ShadowGenerator.QUALITY_HIGH;
    /**
     * The filtering quality to apply to the filter.
     */
    public get filteringQuality() {
        return this._filteringQuality;
    }

    public set filteringQuality(value: number) {
        if (value === this._filteringQuality) {
            return;
        }

        this._filteringQuality = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.filteringQuality = value;
        }
    }

    /**
     * The shadow generator.
     */
    public readonly shadowGenerator: ShadowGenerator;

    /**
     * The shadow map texture.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    protected _shadowGenerator: ShadowGenerator | undefined;

    protected _createShadowGenerator() {
        this._shadowGenerator = new ShadowGenerator(this._mapSize, this._light, this._useFloat32TextureType, undefined, this._useRedTextureFormat);
    }

    protected _setupShadowGenerator() {
        this._shadowGenerator?.dispose();
        this._shadowGenerator = undefined;
        if (this._light !== undefined) {
            this._createShadowGenerator();
            const shadowGenerator = this._shadowGenerator as ShadowGenerator | undefined;
            if (shadowGenerator === undefined) {
                return;
            }
            shadowGenerator.bias = this._bias;
            shadowGenerator.normalBias = this._normalBias;
            shadowGenerator.darkness = this._darkness;
            shadowGenerator.transparencyShadow = this._transparencyShadow;
            shadowGenerator.enableSoftTransparentShadow = this._enableSoftTransparentShadow;
            shadowGenerator.useOpacityTextureForTransparentShadow = this._useOpacityTextureForTransparentShadow;
            shadowGenerator.filter = this._filter;
            shadowGenerator.filteringQuality = this._filteringQuality;

            const shadowMap = shadowGenerator.getShadowMap()!;
            shadowMap._disableEngineStages = true;
            shadowMap.cameraForLOD = this._camera;

            (this.shadowGenerator as WritableObject<ShadowGenerator | undefined>) = shadowGenerator;
        }
    }

    public override isReady(): boolean {
        return !!this._shadowGenerator && !!this._shadowGenerator.getShadowMap()?.isReadyForRendering();
    }

    /**
     * Creates a new shadow generator task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param _scene The scene to create the shadow generator for.
     */
    constructor(name: string, frameGraph: FrameGraph, _scene: Scene) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public record() {
        if (this.light === undefined || this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphShadowGeneratorTask ${this.name}: light, objectList and camera are required`);
        }

        // Make sure the renderList / particleSystemList are set when FrameGraphShadowGeneratorTask.isReady() is called!
        const shadowMap = this._shadowGenerator!.getShadowMap()!;

        shadowMap.renderList = this.objectList.meshes;
        shadowMap.particleSystemList = this.objectList.particleSystems;

        const shadowTextureHandle = this._frameGraph.textureManager.importTexture(`${this.name} shadowmap`, this._shadowGenerator!.getShadowMap()!.getInternalTexture()!);

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, shadowTextureHandle);

        const pass = this._frameGraph.addPass(this.name);

        pass.setExecuteFunc((context) => {
            if (!this.light.isEnabled() || !this.light.shadowEnabled) {
                return;
            }

            const shadowMap = this._shadowGenerator!.getShadowMap()!;

            shadowMap.renderList = this.objectList.meshes;
            shadowMap.particleSystemList = this.objectList.particleSystems;

            context.renderUnmanaged(shadowMap);
        });

        const passDisabled = this._frameGraph.addPass(this.name + "_disabled", true);

        passDisabled.setExecuteFunc((_context) => {});
    }

    public override dispose() {
        this._shadowGenerator?.dispose();
        this._shadowGenerator = undefined;
    }
}

// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph, FrameGraphObjectList, IShadowLight, WritableObject, AbstractEngine } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { ShadowGenerator } from "../../../Lights/Shadows/shadowGenerator";

/**
 * Task used to generate shadows from a list of objects.
 */
export class FrameGraphShadowGeneratorTask extends FrameGraphTask {
    /**
     * The object list to cull.
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
        this._createShadowGenerator();
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
        this._createShadowGenerator();
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
        this._createShadowGenerator();
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
        this._createShadowGenerator();
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

    /**
     * The output shadow generator.
     */
    public readonly outputShadowGenerator: ShadowGenerator;

    private _shadowGenerator: ShadowGenerator | undefined;

    private _createShadowGenerator() {
        this._shadowGenerator?.dispose();
        this._shadowGenerator = undefined;
        if (this._light !== undefined) {
            this._shadowGenerator = new ShadowGenerator(this._mapSize, this._light, this._useFloat32TextureType, undefined, this._useRedTextureFormat);
            this._shadowGenerator.bias = this._bias;
            this._shadowGenerator.filter = this._filter;
            this._shadowGenerator.getShadowMap()!._disableEngineStages = true;
            (this.outputShadowGenerator as WritableObject<ShadowGenerator>) = this._shadowGenerator;
        }
    }

    public override isReady(): boolean {
        return !!this._shadowGenerator && !!this._shadowGenerator.getShadowMap()?.isReadyForRendering();
    }

    private _engine: AbstractEngine;

    /**
     * Creates a new shadow generator task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene to create the shadow generator for.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph);

        this._engine = scene.getEngine();
    }

    public record() {
        if (this.light === undefined || this.objectList === undefined) {
            throw new Error(`FrameGraphShadowGeneratorTask ${this.name}: light and objectList are required`);
        }

        const pass = this._frameGraph.addPass(this.name);

        pass.setExecuteFunc((_context) => {
            const shadowMap = this._shadowGenerator!.getShadowMap()!;

            shadowMap.renderList = this.objectList.meshes;
            shadowMap.particleSystemList = this.objectList.particleSystems;

            const currentRenderTarget = this._engine._currentRenderTarget;

            if (this.light.isEnabled() && this.light.shadowEnabled) {
                shadowMap.render();
            }

            if (this._engine._currentRenderTarget !== currentRenderTarget) {
                if (!currentRenderTarget) {
                    this._engine.restoreDefaultFramebuffer();
                } else {
                    this._engine.bindFramebuffer(currentRenderTarget);
                }
            }
        });

        const passDisabled = this._frameGraph.addPass(this.name + "_disabled", true);

        passDisabled.setExecuteFunc((_context) => {});
    }

    public override dispose() {
        this._shadowGenerator?.dispose();
        this._shadowGenerator = undefined;
    }
}

import type { FrameGraphTextureHandle, FrameGraph, Scene } from "core/index";
import { CascadedShadowGenerator } from "../../../Lights/Shadows/cascadedShadowGenerator";
import { FrameGraphShadowGeneratorTask } from "./shadowGeneratorTask";
import { DirectionalLight } from "../../../Lights/directionalLight";
import { DepthTextureType, ThinMinMaxReducer } from "../../../Misc/thinMinMaxReducer";
import { FrameGraphPostProcessTask } from "../PostProcesses/postProcessTask";
import { Constants } from "../../../Engines/constants";
import { textureSizeIsObject } from "../../../Materials/Textures/textureCreationOptions";

/**
 * Task used to generate a cascaded shadow map from a list of objects.
 */
export class FrameGraphCascadedShadowGeneratorTask extends FrameGraphShadowGeneratorTask {
    protected override _shadowGenerator: CascadedShadowGenerator | undefined;

    /**
     * Checks if a shadow generator task is a cascaded shadow generator task.
     * @param task The task to check.
     * @returns True if the task is a cascaded shadow generator task, else false.
     */
    public static IsCascadedShadowGenerator(task: FrameGraphShadowGeneratorTask): task is FrameGraphCascadedShadowGeneratorTask {
        return (task as FrameGraphCascadedShadowGeneratorTask).numCascades !== undefined;
    }

    /**
     * The depth texture used by the autoCalcDepthBounds feature (optional if autoCalcDepthBounds is set to false)
     * This texture is used to compute the min/max depth bounds of the scene to setup the cascaded shadow generator.
     * Warning: Do not set a texture if you are not using the autoCalcDepthBounds feature, to avoid generating a depth texture that will not be used.
     */
    public depthTexture?: FrameGraphTextureHandle;

    /**
     * The type of the depth texture used by the autoCalcDepthBounds feature.
     */
    public depthTextureType: DepthTextureType = DepthTextureType.NormalizedViewDepth;

    private _numCascades = CascadedShadowGenerator.DEFAULT_CASCADES_COUNT;
    /**
     * The number of cascades.
     */
    public get numCascades() {
        return this._numCascades;
    }

    public set numCascades(value: number) {
        if (value === this._numCascades) {
            return;
        }

        this._numCascades = value;
        this._setupShadowGenerator();
    }

    private _debug = false;
    /**
     * Gets or sets a value indicating whether the shadow generator should display the cascades.
     */
    public get debug() {
        return this._debug;
    }

    public set debug(value: boolean) {
        if (value === this._debug) {
            return;
        }

        this._debug = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.debug = value;
        }
    }

    private _stabilizeCascades = false;
    /**
     * Gets or sets a value indicating whether the shadow generator should stabilize the cascades.
     */
    public get stabilizeCascades() {
        return this._stabilizeCascades;
    }

    public set stabilizeCascades(value: boolean) {
        if (value === this._stabilizeCascades) {
            return;
        }

        this._stabilizeCascades = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.stabilizeCascades = value;
        }
    }

    private _lambda = 0.5;
    /**
     * Gets or sets the lambda parameter of the shadow generator.
     */
    public get lambda() {
        return this._lambda;
    }

    public set lambda(value: number) {
        if (value === this._lambda) {
            return;
        }

        this._lambda = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.lambda = value;
        }
    }

    private _cascadeBlendPercentage = 0.1;
    /**
     * Gets or sets the cascade blend percentage.
     */
    public get cascadeBlendPercentage() {
        return this._cascadeBlendPercentage;
    }

    public set cascadeBlendPercentage(value: number) {
        if (value === this._cascadeBlendPercentage) {
            return;
        }

        this._cascadeBlendPercentage = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.cascadeBlendPercentage = value;
        }
    }

    private _depthClamp = true;
    /**
     * Gets or sets a value indicating whether the shadow generator should use depth clamping.
     */
    public get depthClamp() {
        return this._depthClamp;
    }

    public set depthClamp(value: boolean) {
        if (value === this._depthClamp) {
            return;
        }

        this._depthClamp = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.depthClamp = value;
        }
    }

    private _autoCalcDepthBounds = false;
    /**
     * Gets or sets a value indicating whether the shadow generator should automatically calculate the depth bounds.
     */
    public get autoCalcDepthBounds() {
        return this._autoCalcDepthBounds;
    }

    public set autoCalcDepthBounds(value: boolean) {
        if (value === this._autoCalcDepthBounds) {
            return;
        }

        this._autoCalcDepthBounds = value;
        this._currentAutoCalcDepthBoundsCounter = this._autoCalcDepthBoundsRefreshRate;

        if (!value) {
            this._shadowGenerator?.setMinMaxDistance(0, 1);
        }

        // All passes but the last one are related to min/max reduction and should be enabled/disabled depending on autoCalcDepthBounds value
        const passes = this.passes;
        for (let i = 0; i < passes.length - 1; ++i) {
            passes[i].disabled = !value;
        }
    }

    private _currentAutoCalcDepthBoundsCounter = 0;
    private _autoCalcDepthBoundsRefreshRate = 1;
    /**
     * Defines the refresh rate of the min/max computation used when autoCalcDepthBounds is set to true
     * Use 0 to compute just once, 1 to compute on every frame, 2 to compute every two frames and so on...
     */
    public get autoCalcDepthBoundsRefreshRate() {
        return this._autoCalcDepthBoundsRefreshRate;
    }

    public set autoCalcDepthBoundsRefreshRate(value: number) {
        this._autoCalcDepthBoundsRefreshRate = value;
        this._currentAutoCalcDepthBoundsCounter = this._autoCalcDepthBoundsRefreshRate;
    }

    private _shadowMaxZ = 10000;
    /**
     * Gets or sets the maximum shadow Z value.
     */
    public get shadowMaxZ() {
        return this._shadowMaxZ;
    }

    public set shadowMaxZ(value: number) {
        if (value === this._shadowMaxZ) {
            return;
        }

        this._shadowMaxZ = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.shadowMaxZ = value;
        }
    }

    protected readonly _thinMinMaxReducer: ThinMinMaxReducer;

    /**
     * Creates a new shadow generator task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene to create the shadow generator for.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._thinMinMaxReducer = new ThinMinMaxReducer(scene);

        this._thinMinMaxReducer.onAfterReductionPerformed.add((minmax: { min: number; max: number }) => {
            if (!this._shadowGenerator) {
                return;
            }

            const camera = this.camera;

            let min = minmax.min,
                max = minmax.max;

            if (min >= max) {
                min = 0;
                max = 1;
            } else if (camera && this.depthTextureType !== DepthTextureType.NormalizedViewDepth) {
                if (this.depthTextureType === DepthTextureType.ScreenDepth) {
                    const engine = this._frameGraph.engine;
                    const projectionMatrix = camera.getProjectionMatrix();
                    const p2z = projectionMatrix.m[10];
                    const p3z = projectionMatrix.m[14];

                    if (!engine.isNDCHalfZRange) {
                        // Convert to NDC depth
                        min = min * 2 - 1;
                        max = max * 2 - 1;
                    }

                    // Convert to view depth
                    min = p3z / (min - p2z);
                    max = p3z / (max - p2z);
                }

                // Convert to normalized view depth
                const zNear = camera.minZ;
                const zFar = camera.maxZ;

                min = (min - zNear) / (zFar - zNear);
                max = (max - zNear) / (zFar - zNear);
            }

            if (min !== this._shadowGenerator.minDistance || max !== this._shadowGenerator.maxDistance) {
                this._shadowGenerator.setMinMaxDistance(min, max);
            }
        });
    }

    protected override _createShadowGenerator() {
        if (!(this.light instanceof DirectionalLight)) {
            throw new Error(`FrameGraphCascadedShadowGeneratorTask ${this.name}: the CSM shadow generator only supports directional lights.`);
        }
        this._shadowGenerator = new CascadedShadowGenerator(this.mapSize, this.light, this.useFloat32TextureType, this.camera, this.useRedTextureFormat);
        this._shadowGenerator.numCascades = this._numCascades;
    }

    protected override _setupShadowGenerator() {
        super._setupShadowGenerator();

        const shadowGenerator = this._shadowGenerator;
        if (shadowGenerator === undefined) {
            return;
        }

        shadowGenerator.debug = this._debug;
        shadowGenerator.stabilizeCascades = this._stabilizeCascades;
        shadowGenerator.lambda = this._lambda;
        shadowGenerator.cascadeBlendPercentage = this._cascadeBlendPercentage;
        shadowGenerator.depthClamp = this._depthClamp;
        shadowGenerator.shadowMaxZ = this._shadowMaxZ;
    }

    public override record() {
        if (this.light === undefined || this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCascadedShadowGeneratorTask ${this.name}: light, objectList and camera are required`);
        }

        if (this.depthTexture !== undefined) {
            const depthTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.depthTexture);

            const size = !depthTextureCreationOptions.sizeIsPercentage
                ? textureSizeIsObject(depthTextureCreationOptions.size)
                    ? depthTextureCreationOptions.size
                    : { width: depthTextureCreationOptions.size, height: depthTextureCreationOptions.size }
                : this._frameGraph.textureManager.getAbsoluteDimensions(depthTextureCreationOptions.size);

            const width = size.width;
            const height = size.height;

            depthTextureCreationOptions.sizeIsPercentage = false;
            depthTextureCreationOptions.options.formats = [Constants.TEXTUREFORMAT_RG];
            depthTextureCreationOptions.options.samples = 1;

            this._thinMinMaxReducer.setTextureDimensions(width, height, this.depthTextureType);

            const reductionSteps = this._thinMinMaxReducer.reductionSteps;

            let targetTexture: FrameGraphTextureHandle;

            this._frameGraph.addPass(`${this.name} Before Min Max Reduction`).setExecuteFunc((context) => {
                context.pushDebugGroup(`Min Max Reduction`);
            });

            for (let i = 0; i < reductionSteps.length - 1; ++i) {
                const reductionStep = reductionSteps[i];

                depthTextureCreationOptions.size = { width: reductionSteps[i + 1].textureWidth, height: reductionSteps[i + 1].textureHeight };

                const postProcess = new FrameGraphPostProcessTask(reductionStep.name, this._frameGraph, reductionStep);

                postProcess.sourceTexture = i == 0 ? this.depthTexture : targetTexture!;
                postProcess.sourceSamplingMode = Constants.TEXTURE_NEAREST_NEAREST;
                postProcess.targetTexture = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} ${reductionStep.name}`, depthTextureCreationOptions);

                postProcess.record(true);

                targetTexture = postProcess.outputTexture;
            }

            this._frameGraph.addPass(`${this.name} After Min Max Reduction`).setExecuteFunc((context) => {
                context.popDebugGroup();
                if (this._autoCalcDepthBounds && this._currentAutoCalcDepthBoundsCounter >= 0) {
                    if (++this._currentAutoCalcDepthBoundsCounter >= this._autoCalcDepthBoundsRefreshRate) {
                        const minMaxTexture = context.getTextureFromHandle(targetTexture!);
                        if (minMaxTexture) {
                            this._thinMinMaxReducer.readMinMax(minMaxTexture);
                        }
                    }
                    this._currentAutoCalcDepthBoundsCounter %= this._autoCalcDepthBoundsRefreshRate;
                    if (this._autoCalcDepthBoundsRefreshRate === 0) {
                        this._currentAutoCalcDepthBoundsCounter = -1;
                    }
                }
            });
        }

        super.record();
    }

    public override dispose() {
        super.dispose();
        this._thinMinMaxReducer.dispose();
    }
}

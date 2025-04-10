import { CascadedShadowGenerator } from "../../../Lights/Shadows/cascadedShadowGenerator";
import { FrameGraphShadowGeneratorTask } from "./shadowGeneratorTask";
import { DirectionalLight } from "../../../Lights/directionalLight";

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
        if (this._shadowGenerator) {
            this._shadowGenerator.autoCalcDepthBounds = value;
        }
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
        shadowGenerator.autoCalcDepthBounds = this._autoCalcDepthBounds;
        shadowGenerator.shadowMaxZ = this._shadowMaxZ;
    }
}

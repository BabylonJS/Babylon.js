import type { Effect } from "@babylonjs/core/Materials/effect";

import { spritesheetBlockType } from "../../../blockTypes.js";
import { babylonDemoEffectsNamespace } from "../../../blockNamespaces.js";
import { shaderProgram, uniforms } from "./spritesheetBlock.fragment.js";
import {
    DisableableShaderBinding,
    type RuntimeData,
    ConnectionPointType,
    type IDisableableBlock,
    DisableableShaderBlock,
    type SmartFilter,
    createStrongRef,
    BlockDisableStrategy,
} from "@babylonjs/smart-filters";

/**
 * The shader bindings for the Spritesheet block.
 */
export class SpritesheetShaderBinding extends DisableableShaderBinding {
    private readonly _inputTexture: RuntimeData<ConnectionPointType.Texture>;
    private readonly _time: RuntimeData<ConnectionPointType.Float>;
    private readonly _rows: RuntimeData<ConnectionPointType.Float>;
    private readonly _cols: RuntimeData<ConnectionPointType.Float>;
    private readonly _frames: RuntimeData<ConnectionPointType.Float>;

    /**
     * Creates a new shader binding instance for the SpriteSheet block.
     * @param parentBlock - The parent block
     * @param inputTexture - The input texture
     * @param time - The time passed since the start of the effect
     * @param rows - The number of rows in the sprite sheet
     * @param cols - The number of columns in the sprite sheet
     * @param frames - The number of frames to show
     */
    constructor(
        parentBlock: IDisableableBlock,
        inputTexture: RuntimeData<ConnectionPointType.Texture>,
        time: RuntimeData<ConnectionPointType.Float>,
        rows: RuntimeData<ConnectionPointType.Float>,
        cols: RuntimeData<ConnectionPointType.Float>,
        frames: RuntimeData<ConnectionPointType.Float>
    ) {
        super(parentBlock);
        this._inputTexture = inputTexture;
        this._time = time;
        this._rows = rows;
        this._cols = cols;
        this._frames = frames;
    }

    /**
     * Binds all the required data to the shader when rendering.
     * @param effect - defines the effect to bind the data to
     */
    public override bind(effect: Effect): void {
        super.bind(effect);
        effect.setTexture(this.getRemappedName(uniforms.input), this._inputTexture.value);
        effect.setFloat(this.getRemappedName(uniforms.time), this._time.value);
        effect.setFloat(this.getRemappedName(uniforms.rows), this._rows.value);
        effect.setFloat(this.getRemappedName(uniforms.cols), this._cols.value);

        // Apply default value for frame count if it was not provided
        effect.setFloat(
            this.getRemappedName(uniforms.frames),
            this._frames.value > 0 ? this._frames.value : this._rows.value * this._cols.value
        );
    }
}

/**
 * A block that animates a sprite sheet texture.
 */
export class SpritesheetBlock extends DisableableShaderBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = spritesheetBlockType;

    /**
     * The namespace of the block.
     */
    public static override Namespace = babylonDemoEffectsNamespace;

    /**
     * The input texture connection point
     */
    public readonly input = this._registerInput("input", ConnectionPointType.Texture);

    /**
     * The time connection point to animate the effect.
     */
    public readonly time = this._registerOptionalInput("time", ConnectionPointType.Float, createStrongRef(0.0));

    /**
     * The number of rows in the sprite sheet, as a connection point.
     */
    public readonly rows = this._registerOptionalInput("rows", ConnectionPointType.Float, createStrongRef(1.0));

    /**
     * The number of columns in the sprite sheet, as a connection point.
     */
    public readonly columns = this._registerOptionalInput("columns", ConnectionPointType.Float, createStrongRef(1.0));

    /**
     * The number of frames to animate from the beginning, as a connection point.
     * Defaults to rows * columns at runtime.
     */
    public readonly frames = this._registerOptionalInput("frames", ConnectionPointType.Float, createStrongRef(0.0));

    /**
     * The shader program (vertex and fragment code) to use to render the block
     */
    public static override ShaderCode = shaderProgram;

    /**
     * Instantiates a new Block.
     * @param smartFilter - The smart filter this block belongs to
     * @param name - The friendly name of the block
     */
    constructor(smartFilter: SmartFilter, name: string) {
        super(smartFilter, name, false, BlockDisableStrategy.Manual);
    }

    /**
     * Get the class instance that binds all the required data to the shader (effect) when rendering.
     * @returns The class instance that binds the data to the effect
     */
    public getShaderBinding(): DisableableShaderBinding {
        const input = this._confirmRuntimeDataSupplied(this.input);
        const rows = this.rows.runtimeData;
        const columns = this.columns.runtimeData;
        const time = this.time.runtimeData;
        const frames = this.frames.runtimeData;

        return new SpritesheetShaderBinding(this, input, time, rows, columns, frames);
    }
}

import type { Effect } from "core/Materials/effect.js";
import type { Nullable } from "core/types.js";

import type { SmartFilter } from "../smartFilter.js";
import type { ShaderProgram } from "../utils/shaderCodeUtils.js";
import type { RuntimeData } from "../connection/connectionPoint.js";
import { ShaderBlock } from "../blockFoundation/shaderBlock.js";
import { ShaderBinding } from "../runtime/shaderRuntime.js";
import { ConnectionPointType } from "../connection/connectionPointType.js";

/**
 * The shader bindings for the OptimizedShader block.
 * @internal
 */
export class OptimizedShaderBinding extends ShaderBinding {
    private _shaderBindings: ShaderBinding[];
    private _inputTextures: { [name: string]: RuntimeData<ConnectionPointType.Texture> };

    /**
     * Creates a new shader binding instance for the OptimizedShader block.
     * @param shaderBindings - The list of shader bindings to process
     * @param inputTextures - The list of input textures to bind
     */
    constructor(shaderBindings: ShaderBinding[], inputTextures: { [name: string]: RuntimeData<ConnectionPointType.Texture> }) {
        super();

        this._shaderBindings = shaderBindings;
        this._inputTextures = inputTextures;
    }

    /**
     * Binds all the required data to the shader when rendering.
     * @param effect - defines the effect to bind the data to
     * @param width - defines the width of the output
     * @param height - defines the height of the output
     */
    public override bind(effect: Effect, width: number, height: number): void {
        for (const shaderBinding of this._shaderBindings) {
            shaderBinding.bind(effect, width, height);
        }

        for (const name in this._inputTextures) {
            const texture = this._inputTextures[name];
            // texture can't be undefined, so let's add "!" to make Typescript happy
            effect.setTexture(this.getRemappedName(name), texture!.value);
        }
    }
}

/**
 * A block used by the smart filter optimizer to group shader blocks together.
 * Should be for internal use only.
 * @internal
 */
export class OptimizedShaderBlock extends ShaderBlock {
    private _shaderBindings: Nullable<ShaderBinding[]>;
    private _inputTextures: { [name: string]: RuntimeData<ConnectionPointType.Texture> } = {};
    private _shaderProgram: ShaderProgram;

    /**
     * The class name of the block.
     */
    public static override ClassName = "OptimizedShaderBlock";

    /**
     * Returns if the block is an input block.
     */
    public override get isInput(): boolean {
        return false;
    }

    /**
     * Creates a new OptimizedShaderBlock.
     * @param smartFilter - The smart filter to add the block to
     * @param name - The name of the block
     */
    constructor(smartFilter: SmartFilter, name: string) {
        super(smartFilter, name, true);

        this._shaderBindings = null;
        this._shaderProgram = undefined as any;
    }

    /**
     * Gets the shader program to use to render the block.
     * @returns The shader program to use to render the block
     */
    public override getShaderProgram(): ShaderProgram {
        return this._shaderProgram;
    }

    /**
     * Sets the shader program to use to render the block.
     * @param shaderProgram - The shader program to use to render the block
     */
    public setShaderProgram(shaderProgram: ShaderProgram): void {
        this._shaderProgram = shaderProgram;
    }

    /**
     * Sets the list of shader bindings to use to render the block.
     * @param shaderBindings - The list of shader bindings to use to render the block
     */
    public setShaderBindings(shaderBindings: ShaderBinding[]): void {
        this._shaderBindings = shaderBindings;
    }

    /**
     * Get the class instance that binds all the required data to the shader (effect) when rendering.
     * @returns The class instance that binds the data to the effect
     */
    public getShaderBinding(): ShaderBinding {
        if (this._shaderBindings === null) {
            throw new Error("Shader bindings not set!");
        }

        for (const input of this.inputs) {
            const name = input.name;

            if (input.type === ConnectionPointType.Texture) {
                /**
                 * These are the inputs created by the OptimizedShaderBlock
                 * We pass them to OptimizedShaderBinding so that their value can be set appropriately at runtime (in the bind method)
                 */
                this._inputTextures[name] = input.runtimeData as RuntimeData<ConnectionPointType.Texture>;
            }
        }

        return new OptimizedShaderBinding(this._shaderBindings, this._inputTextures);
    }
}

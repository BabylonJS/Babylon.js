import type { SmartFilter } from "../smartFilter.js";
import type { ConnectionPoint } from "../connection/connectionPoint.js";

import { ConnectionPointType } from "../connection/connectionPointType.js";
import { CreateStrongRef } from "../runtime/strongRef.js";
import { ShaderBlock } from "./shaderBlock.js";
import { InjectAutoSampleDisableCode } from "../utils/shaderCodeUtils.js";
import { BlockDisableStrategy } from "./blockDisableStrategy.js";

// Re-export for backward compatibility
export { BlockDisableStrategy } from "./blockDisableStrategy.js";

/**
 * The interface that describes the disableable block.
 */
export interface IDisableableBlock {
    /**
     * The disabled connection point of the block.
     */
    disabled: ConnectionPoint<ConnectionPointType.Boolean>;
}

/**
 * A ShaderBlock that can be disabled. The optimizer can optionally remove disabled blocks from the graph,
 * or they can be controlled by the disabled connection point at runtime. If disabled, they pass the
 * mainInputTexture through to the output connection point.
 */
export abstract class DisableableShaderBlock extends ShaderBlock implements IDisableableBlock {
    /**
     * The disabled connection point of the block.
     */
    public readonly disabled = this._registerOptionalInput("disabled", ConnectionPointType.Boolean, CreateStrongRef(false));

    /**
     * The strategy to use for making this block disableable.
     */
    public readonly blockDisableStrategy: BlockDisableStrategy;

    // The shader code is a static per block type. When an instance of a block is created, we may need to alter
    // that code based on the block's disable strategy. We only want to do this once per block type, or we could
    // incorrectly modify the shader code multiple times (once per block instance). Here we use a static boolean
    // which will be per block type to track if we've already modified the shader code for this block type.
    // This is more memory efficient than the alternative of making a copy of the shader code for each block instance
    // and modifying each copy.
    private static _HasModifiedShaderCode = false;
    private get _hasModifiedShaderCode() {
        return (this.constructor as typeof DisableableShaderBlock)._HasModifiedShaderCode;
    }
    private set _hasModifiedShaderCode(value: boolean) {
        (this.constructor as typeof DisableableShaderBlock)._HasModifiedShaderCode = value;
    }

    /**
     * Gets the shader program to use to render the block.
     * @returns The shader program to use to render the block
     */
    public override getShaderProgram() {
        const shaderProgram = super.getShaderProgram();

        // If we haven't already modified the shader code for this block type, do so now
        if (!this._hasModifiedShaderCode) {
            this._hasModifiedShaderCode = true;

            // Apply the disable strategy
            switch (this.blockDisableStrategy) {
                case BlockDisableStrategy.AutoSample:
                    InjectAutoSampleDisableCode(shaderProgram);
                    break;
            }
        }

        return shaderProgram;
    }

    /**
     * Instantiates a new block.
     * @param smartFilter - Defines the smart filter the block belongs to
     * @param name - Defines the name of the block
     * @param disableOptimization - Defines if the block should not be optimized (default: false)
     * @param disableStrategy - Defines the strategy to use for making this block disableable (default: BlockDisableStrategy.AutoSample)
     */
    constructor(smartFilter: SmartFilter, name: string, disableOptimization = false, disableStrategy = BlockDisableStrategy.AutoSample) {
        super(smartFilter, name, disableOptimization);
        this.blockDisableStrategy = disableStrategy;
    }
}

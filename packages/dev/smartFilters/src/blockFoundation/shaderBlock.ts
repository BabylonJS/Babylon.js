import type { ThinRenderTargetTexture } from "core/Materials/Textures/thinRenderTargetTexture.js";
import "core/Engines/Extensions/engine.renderTarget.js";

import type { InitializationData, SmartFilter } from "../smartFilter.js";
import type { ShaderProgram } from "../utils/shaderCodeUtils.js";
import type { ShaderBinding } from "../runtime/shaderRuntime.js";
import type { ConnectionPoint } from "../connection/connectionPoint.js";
import { ShaderRuntime } from "../runtime/shaderRuntime.js";
import { ConnectionPointType } from "../connection/connectionPointType.js";
import { CreateCommand } from "../command/command.js";
import { UndecorateSymbol } from "../utils/shaderCodeUtils.js";
import { RegisterFinalRenderCommand } from "../utils/renderTargetUtils.js";
import { BaseBlock } from "./baseBlock.js";
import { TextureFormat, TextureType, type OutputTextureOptions } from "./textureOptions.js";
import { EditableInPropertyPage, PropertyTypeForEdition } from "../editorUtils/editableInPropertyPage.js";
import type { Nullable } from "core/types.js";

const OutputTexturePropertiesGroupName = "OUTPUT TEXTURE PROPERTIES";

/**
 * This is the base class for all shader blocks.
 *
 * It contains the redundant part of wrapping a shader for a full screen pass.
 *
 * The only required function to implement is the bind function.
 */
export abstract class ShaderBlock extends BaseBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = "ShaderBlock";

    /**
     * Get the class instance that binds all the required data to the shader (effect) when rendering.
     * It should throw an error if required inputs are missing.
     * @returns The class instance that binds the data to the effect
     */
    public abstract getShaderBinding(): ShaderBinding;

    /**
     * The shader program (vertex and fragment code) to use to render the block
     */
    public static ShaderCode: ShaderProgram;

    /**
     * The output connection point of the block.
     */
    public readonly output = this._registerOutput("output", ConnectionPointType.Texture);

    /**
     * The options used when creating the texture this block outputs to
     */
    @EditableInPropertyPage("Ratio", PropertyTypeForEdition.Float, OutputTexturePropertiesGroupName, {
        min: 0.1,
        max: 10.0,
        notifiers: { rebuild: true },
        subPropertyName: "ratio",
    })
    @EditableInPropertyPage("Format", PropertyTypeForEdition.List, OutputTexturePropertiesGroupName, {
        notifiers: { rebuild: true },
        subPropertyName: "format",
        options: [
            { label: "R", value: TextureFormat.R },
            { label: "RG", value: TextureFormat.RG },
            { label: "RGBA", value: TextureFormat.RGBA },
        ],
    })
    @EditableInPropertyPage("Type", PropertyTypeForEdition.List, OutputTexturePropertiesGroupName, {
        notifiers: { rebuild: true },
        subPropertyName: "type",
        options: [
            { label: "UByte", value: TextureType.UNSIGNED_BYTE },
            { label: "Float", value: TextureType.FLOAT },
            { label: "Half Float", value: TextureType.HALF_FLOAT },
        ],
    })
    public outputTextureOptions: OutputTextureOptions = {
        ratio: 1,
        format: TextureFormat.RGBA,
        type: TextureType.UNSIGNED_BYTE,
    };

    /**
     * Disconnects the block from the graph.
     * @param disconnectedConnections - Stores the connections that have been broken in the process. You can reconnect them later if needed.
     */
    public override disconnectFromGraph(disconnectedConnections?: [ConnectionPoint, ConnectionPoint][]): void {
        const input = this._getConnectionForMainInputTexture();

        for (const endpoint of this.output.endpoints) {
            disconnectedConnections?.push([endpoint, this.output]);
            input.connectTo(endpoint);
        }
    }

    protected _getConnectionForMainInputTexture(): ConnectionPoint {
        const mainInputTextureName = this.getShaderProgram().fragment.mainInputTexture;
        if (!mainInputTextureName) {
            throw `The block named "${this.name}" does not have a main input texture defined!`;
        }

        const mainInputTexture = this.findInput(UndecorateSymbol(mainInputTextureName));
        if (!mainInputTexture || !mainInputTexture.connectedTo) {
            throw `The main input texture "${mainInputTextureName}" of block named "${this.name}" is not connected!`;
        }

        return mainInputTexture.connectedTo;
    }

    /**
     * Instantiates a new block.
     * @param smartFilter - Defines the smart filter the block belongs to
     * @param name - Defines the name of the block
     * @param disableOptimization - Defines if the block should not be optimized (default: false)
     */
    constructor(smartFilter: SmartFilter, name: string, disableOptimization = false) {
        super(smartFilter, name, disableOptimization);
    }

    /**
     * Gets the shader program to use to render the block.
     * @returns The shader program to use to render the block
     */
    public getShaderProgram() {
        return (this.constructor as typeof ShaderBlock).ShaderCode;
    }

    /**
     * Generates the commands needed to execute the block at runtime and gathers promises for initialization work
     * @param initializationData - The initialization data to use
     * @param finalOutput - Defines if the block is the final output of the smart filter
     */
    public override generateCommandsAndGatherInitPromises(initializationData: InitializationData, finalOutput: boolean): void {
        const runtime = initializationData.runtime;
        const shaderBlockRuntime = new ShaderRuntime(runtime.effectRenderer, this.getShaderProgram(), this.getShaderBinding());
        initializationData.initializationPromises.push(shaderBlockRuntime.onReadyAsync);
        runtime.registerResource(shaderBlockRuntime);

        if (finalOutput) {
            RegisterFinalRenderCommand(initializationData.outputBlock, runtime, this, shaderBlockRuntime);
        } else {
            const renderTargetTexture = this.output.runtimeData?.value as Nullable<ThinRenderTargetTexture>;
            if (!renderTargetTexture) {
                throw new Error(`${this.blockType} did not have a render target texture.`);
            }

            runtime.registerCommand(
                CreateCommand(`${this.blockType}.render`, this, () => {
                    shaderBlockRuntime.renderToTargetTexture(renderTargetTexture);
                })
            );
        }

        super.generateCommandsAndGatherInitPromises(initializationData, finalOutput);
    }
}

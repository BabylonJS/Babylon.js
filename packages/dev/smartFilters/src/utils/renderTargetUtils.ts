import { CreateCommand } from "../command/command.js";
import type { BaseBlock } from "../blockFoundation/baseBlock.js";
import type { ShaderRuntime } from "../runtime/shaderRuntime.js";
import type { InternalSmartFilterRuntime } from "../runtime/smartFilterRuntime.js";
import type { OutputBlock } from "../blockFoundation/outputBlock.js";

/**
 * Registers the final command of the command queue - the one that draws to either the canvas or
 * renderTargetTexture.
 * @param outputBlock - The output block.
 * @param runtime - The smart filter runtime to use.
 * @param commandOwner - The owner of the command.
 * @param shaderBlockRuntime - The shader block runtime to use.
 */
export function RegisterFinalRenderCommand(outputBlock: OutputBlock, runtime: InternalSmartFilterRuntime, commandOwner: BaseBlock, shaderBlockRuntime: ShaderRuntime): void {
    const commandOwnerBlockType = commandOwner.blockType;
    if (outputBlock.renderTargetWrapper) {
        runtime.registerCommand(
            CreateCommand(`${commandOwnerBlockType}.renderToFinalTexture`, commandOwner, () => {
                shaderBlockRuntime.renderToTargetWrapper(outputBlock);
            })
        );
    } else {
        runtime.registerCommand(
            CreateCommand(`${commandOwnerBlockType}.renderToCanvas`, commandOwner, () => {
                shaderBlockRuntime.renderToCanvas();
            })
        );
    }
}

import { createCommand } from "../command/command.js";
import type { BaseBlock } from "../blockFoundation/baseBlock.js";
import type { ShaderRuntime } from "../runtime/shaderRuntime";
import type { InternalSmartFilterRuntime } from "../runtime/smartFilterRuntime";
import type { OutputBlock } from "../blockFoundation/outputBlock.js";

/**
 * Registers the final command of the command queue - the one that draws to either the canvas or
 * renderTargetTexture.
 * @param outputBlock - The output block.
 * @param runtime - The smart filter runtime to use.
 * @param commandOwner - The owner of the command.
 * @param shaderBlockRuntime - The shader block runtime to use.
 */
export function registerFinalRenderCommand(
    outputBlock: OutputBlock,
    runtime: InternalSmartFilterRuntime,
    commandOwner: BaseBlock,
    shaderBlockRuntime: ShaderRuntime
): void {
    const commandOwnerBlockType = commandOwner.blockType;
    if (outputBlock.renderTargetWrapper) {
        runtime.registerCommand(
            createCommand(`${commandOwnerBlockType}.renderToFinalTexture`, commandOwner, () => {
                shaderBlockRuntime.renderToTargetWrapper(outputBlock);
            })
        );
    } else {
        runtime.registerCommand(
            createCommand(`${commandOwnerBlockType}.renderToCanvas`, commandOwner, () => {
                shaderBlockRuntime.renderToCanvas();
            })
        );
    }
}

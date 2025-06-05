import { Logger } from "publishedBabylonCore/Misc/logger.js";
import type { CommandBuffer } from "./commandBuffer";

/**
 * Logs all the commands associated to a command buffer.
 * @param commandBuffer - The command buffer to log
 */
export function logCommands(commandBuffer: Readonly<CommandBuffer>) {
    Logger.Log("----- Command buffer commands -----");
    commandBuffer.visitCommands((command) => {
        Logger.Log(`  Owner: ${command.owner.blockType} (${command.owner.name}) - Command: ${command.name}`);
    });
    Logger.Log("-----------------------------------");
}

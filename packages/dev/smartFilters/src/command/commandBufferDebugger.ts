import { Logger } from "core/Misc/logger.js";
import type { CommandBuffer } from "./commandBuffer.js";

/**
 * Logs all the commands associated to a command buffer.
 * @param commandBuffer - The command buffer to log
 */
export function LogCommands(commandBuffer: Readonly<CommandBuffer>) {
    Logger.Log("----- Command buffer commands -----");
    commandBuffer.visitCommands((command) => {
        Logger.Log(`  Owner: ${command.owner.blockType} (${command.owner.name}) - Command: ${command.name}`);
    });
    Logger.Log("-----------------------------------");
}

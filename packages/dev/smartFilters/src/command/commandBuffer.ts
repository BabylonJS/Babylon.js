import type { Command } from "./command";

/**
 * Represents the action to run when calling `visitCommands` on a @see CommandBuffer.
 */
export type CommandsVisitor = (command: Command) => void;

/**
 * @see CommandsVisitor used to execute the commands of a @see CommandBuffer.
 * @param command - The command to execute.
 */
function executeCommandsVisitor(command: Command) {
    command.action();
}

/**
 * A command buffer is a list of commands to execute.
 * This is used to store the list of tasks the current smart filter needs to execute.
 */
export class CommandBuffer {
    private readonly _commands: Command[] = [];

    /**
     * Creates a new command buffer.
     * @param args - the list of commands to add to the command buffer
     */
    constructor(...args: Command[]) {
        for (const command of args) {
            this.push(command);
        }
    }

    /**
     * Adds a command to the command buffer.
     * @param command - the command to add
     */
    public push(command: Command) {
        this._commands.push(command);
    }

    /**
     * Clears the command buffer and empty the list of commands.
     */
    public clear() {
        this._commands.length = 0;
    }

    /**
     * Visits all the commands in the command buffer.
     * @param commandVisitor - The action to execute on each command
     */
    public visitCommands(commandVisitor: CommandsVisitor): void {
        for (const command of this._commands) {
            commandVisitor(command);
        }
    }

    /**
     * Execute all the commands in the command buffer.
     */
    public execute() {
        this.visitCommands(executeCommandsVisitor);
    }

    /**
     * Dispose the resources associated to the command buffer.
     */
    public dispose() {
        this.clear();
    }
}

import { type IDisposable } from "core/index";
import { type IService } from "../../modularity/serviceDefinition";

/**
 * The type of a bridge command argument, which determines how
 * the CLI processes the value before sending it to the browser.
 * @experimental
 * @internal
 */
export type BridgeCommandArgType = "string" | "file";

/**
 * Describes an argument for a bridge command.
 * @experimental
 * @internal
 */
export type BridgeCommandArg = {
    /**
     * The name of the argument.
     */
    name: string;

    /**
     * A description of the argument.
     */
    description: string;

    /**
     * Whether the argument is required.
     */
    required?: boolean;

    /**
     * The type of the argument. Defaults to "string".
     * When set to "file", the CLI reads the file at the given path
     * and passes its contents as the argument value.
     */
    type?: BridgeCommandArgType;
};

/**
 * Describes a command that can be invoked from the bridge.
 * @experimental
 * @internal
 */
export type BridgeCommandDescriptor = {
    /**
     * A unique identifier for the command.
     */
    id: string;

    /**
     * A human-readable description of what the command does.
     */
    description: string;

    /**
     * The arguments that this command accepts.
     */
    args?: BridgeCommandArg[];

    /**
     * Executes the command with the given arguments and returns a result string.
     * @param args A map of argument names to their values.
     * @returns A promise that resolves to the result string.
     */
    executeAsync: (args: Record<string, string>) => Promise<string>;
};

/**
 * The service identity for the bridge command registry.
 * @experimental
 * @internal
 */
export const BridgeCommandRegistryIdentity = Symbol("BridgeCommandRegistry");

/**
 * A registry for commands that can be invoked from the bridge.
 * @experimental
 * @internal
 */
export interface IBridgeCommandRegistry extends IService<typeof BridgeCommandRegistryIdentity> {
    /**
     * Registers a command that can be invoked from the bridge.
     * @param descriptor The command descriptor.
     * @returns A disposable token that unregisters the command when disposed.
     */
    addCommand(descriptor: BridgeCommandDescriptor): IDisposable;
}

import { type IDisposable } from "core/index";
import { type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

/**
 * Describes an argument for an inspectable command.
 */
export type InspectableCommandArg = {
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
};

/**
 * Describes a command that can be invoked from the CLI.
 */
export type InspectableCommandDescriptor = {
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
    args?: InspectableCommandArg[];

    /**
     * Executes the command with the given arguments and returns a result string.
     * @param args A map of argument names to their values.
     * @returns A promise that resolves to the result string.
     */
    executeAsync: (args: Record<string, string>) => Promise<string>;
};

/**
 * The service identity for the inspectable command registry.
 */
export const InspectableCommandRegistryIdentity = Symbol("InspectableCommandRegistry");

/**
 * A registry for commands that can be invoked from the Inspector CLI.
 * @experimental
 */
export interface IInspectableCommandRegistry extends IService<typeof InspectableCommandRegistryIdentity> {
    /**
     * Registers a command that can be invoked from the Inspector CLI.
     * @param descriptor The command descriptor.
     * @returns A disposable token that unregisters the command when disposed.
     */
    addCommand(descriptor: InspectableCommandDescriptor): IDisposable;
}

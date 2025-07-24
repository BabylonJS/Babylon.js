import type { Nullable } from "core/types.js";
import { ConnectionPointType, type ConnectionPointValue } from "../connection/connectionPointType.js";
import type { InitializationData, SmartFilter } from "../smartFilter.js";
import type { ICommandOwner } from "../command/command.js";
import { ConnectionPoint, type RuntimeData } from "../connection/connectionPoint.js";
import { ConnectionPointWithDefault } from "../connection/connectionPointWithDefault.js";
import { ConnectionPointDirection } from "../connection/connectionPointDirection.js";
import { UniqueIdGenerator } from "../utils/uniqueIdGenerator.js";

/**
 * Defines a callback function that is triggered when visiting a block,
 * It also carries over extra data preventing the need to use global variables or closures.
 */
export type BlockVisitor<T extends object> = (block: BaseBlock, extraData: T) => void;

/**
 * This class represents the base class for all smart filter blocks.
 *
 * It defines the basic structure of a smart filter block and provides the base implementation for
 * managing the connection points.
 *
 * It enforces common behavior for all smart filter blocks.
 */
export abstract class BaseBlock implements ICommandOwner {
    protected static _AlreadyVisitedBlocks = new Set<BaseBlock>();

    /**
     * The class name of the block.
     */
    public static ClassName = "BaseBlock";

    /**
     * The namespace of the block, which is used to reduce name collisions between blocks and also to group blocks in the editor UI.
     * By convention, sub namespaces are separated by a period (e.g. "Babylon.Demo.Effects").
     */
    public static Namespace: Nullable<string> = null;

    /**
     * The smart filter the block belongs to.
     */
    public readonly smartFilter: SmartFilter;

    /**
     * Global unique id of the block (This is unique for the current session).
     */
    public uniqueId: number;

    /**
     * The name of the block. This is used to identify the block in the smart filter or in debug.
     */
    public readonly name: string;

    /**
     * The type of the block - used when serializing / deserializing the block, and in the editor.
     * For programmatically created blocks, this should be the class name of the block.
     * For custom blocks, this is specified in the block definition.
     */
    public get blockType(): string {
        return this.getClassName();
    }

    /**
     * The namespace of the block, which is used to reduce name collisions between blocks and also to group blocks in the editor UI.
     * By convention, sub namespaces are separated by a period (e.g. "Babylon.Demo.Effects").
     */
    public get namespace(): Nullable<string> {
        // Note that we use a static property instead of doing this.constructor.name to avoid problems with minifiers that would change the name of the class
        return (this.constructor as typeof BaseBlock).Namespace;
    }

    /**
     * User provided comments about the block. It can be used to document the block.
     */
    public comments: Nullable<string> = null;

    private readonly _inputs: ConnectionPoint[] = [];
    private readonly _outputs: ConnectionPoint[] = [];

    /**
     * Instantiates a new block.
     * @param smartFilter - Defines the smart filter the block belongs to
     * @param name - Defines the name of the block
     * @param disableOptimization - Defines if the block is optimizable or not
     */
    constructor(
        smartFilter: SmartFilter,
        name: string,
        public readonly disableOptimization = false
    ) {
        this.uniqueId = UniqueIdGenerator.UniqueId;
        this.name = name;
        this.smartFilter = smartFilter;

        // Register the block in the smart filter
        smartFilter.registerBlock(this);
    }

    /**
     * Returns the inputs connection points of the current block.
     */
    public get inputs(): ReadonlyArray<ConnectionPoint> {
        return this._inputs;
    }

    /**
     * Returns the outputs connection points of the current block.
     */
    public get outputs(): ReadonlyArray<ConnectionPoint> {
        return this._outputs;
    }

    /**
     * Returns if the block is an input block.
     */
    public get isInput(): boolean {
        return this._inputs.length === 0;
    }

    /**
     * Returns if the block is an output block.
     */
    public get isOutput(): boolean {
        return this._outputs.length === 0;
    }

    /**
     * @returns the class name of the block
     */
    public getClassName(): string {
        // Note that we use a static property instead of doing this.constructor.name to avoid problems with minifiers that would change the name of the class
        return (this.constructor as typeof BaseBlock).ClassName;
    }

    /**
     * Checks if the block is an "ancestor" of another giving block.
     * @param block - Defines the block to check against
     * @returns True if the block is an ancestor of the given block, otherwise false
     */
    public isAnAncestorOf(block: BaseBlock): boolean {
        for (const output of this._outputs) {
            if (!output.endpoints.length) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock === block) {
                    return true;
                }
                if (endpoint.ownerBlock.isAnAncestorOf(block)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected _visitInputs<T extends object>(extraData: T, callback: BlockVisitor<T>, alreadyVisited: Set<BaseBlock>): void {
        for (const input of this.inputs) {
            if (!input.connectedTo) {
                continue;
            }

            const block = input.connectedTo.ownerBlock;

            block.visit(extraData, callback, alreadyVisited);
        }
    }

    /**
     * Visits the block and its inputs recursively.
     * When starting from the smart filter output block, this will visit all the blocks in the smart filter.
     * Note that it's a depth first visit: the callback is called on the block AFTER visiting its inputs.
     * @param extraData - The extra data to pass to the callback
     * @param callback - The callback to call on each block
     * @param alreadyVisitedBlocks  - Defines the set of blocks already visited (if not provided, a new set will be created)
     */
    public visit<T extends object>(extraData: T, callback: BlockVisitor<T>, alreadyVisitedBlocks?: Set<BaseBlock>): void {
        if (!alreadyVisitedBlocks) {
            alreadyVisitedBlocks = BaseBlock._AlreadyVisitedBlocks;
            alreadyVisitedBlocks.clear();
        }

        if (!alreadyVisitedBlocks.has(this)) {
            alreadyVisitedBlocks.add(this);

            this._visitInputs(extraData, callback, alreadyVisitedBlocks);

            callback(this, extraData);
        }
    }

    /**
     * Finds the input connection point with the given name.
     * @param name - Name of the input to find
     * @returns The connection point with the given name or null if not found
     */
    public findInput<U extends ConnectionPointType>(name: string): Nullable<ConnectionPoint<U>> {
        for (const input of this._inputs) {
            if (input.name === name) {
                return input as ConnectionPoint<U>;
            }
        }

        return null;
    }

    /**
     * Disconnects the block from the graph.
     * @param _disconnectedConnections - Stores the connections that have been broken in the process. You can reconnect them later if needed.
     */
    public disconnectFromGraph(_disconnectedConnections?: [ConnectionPoint, ConnectionPoint][]): void {}

    /**
     * Prepares the block for runtime.
     * This is called by the smart filter just before creating the smart filter runtime, and by the optimizer.
     */
    public prepareForRuntime(): void {}

    /**
     * Propagates the runtime data - telling all outputs to propagate their runtime data forward through the graph
     */
    public propagateRuntimeData(): void {
        for (const output of this._outputs) {
            output.propagateRuntimeData();
        }
    }

    /**
     * Generates the commands needed to execute the block at runtime and gathers promises for initialization work
     * @param initializationData - The initialization data to use
     * @param _finalOutput - Defines if the block is the final output of the smart filter
     */
    public generateCommandsAndGatherInitPromises(initializationData: InitializationData, _finalOutput: boolean): void {
        // Check if any inputs are Textures which aren't yet ready, and if so, ensure init waits for them to be ready
        for (const input of this._inputs) {
            if (input.type === ConnectionPointType.Texture) {
                const texture = input.runtimeData?.value as ConnectionPointValue<ConnectionPointType.Texture>;
                if (texture && !texture.isReady()) {
                    const internalTexture = texture.getInternalTexture();
                    if (internalTexture) {
                        const textureReadyPromise = new Promise<void>((resolve, reject) => {
                            internalTexture.onLoadedObservable.add(() => {
                                resolve();
                            });
                            internalTexture.onErrorObservable.add((error) => {
                                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                                reject(error);
                            });
                        });
                        initializationData.initializationPromises.push(textureReadyPromise);
                    }
                }
            }
        }
    }

    /**
     * Disconnects all the inputs and outputs from the Block.
     */
    public disconnect(): void {
        // Detach inputs
        for (const input of this._inputs) {
            input.connectedTo?.disconnectFrom(input);
        }

        // Detach outputs
        for (const output of this._outputs) {
            output.disconnectAllEndpoints();
        }
    }

    /**
     * Registers a new input connection point in the block which must have a connection before the graph can be used.
     * @param name - Defines the name of the input connection point
     * @param type - Defines the type of the input connection point
     * @param defaultValue - Defines the optional default value of the input connection point to use if not connection is made
     * @returns The new ConnectionPoint
     * @internal
     */
    public _registerInput<U extends ConnectionPointType>(name: string, type: U, defaultValue: Nullable<RuntimeData<U>> = null): ConnectionPoint<U> {
        const input = new ConnectionPoint(name, this, type, ConnectionPointDirection.Input, defaultValue);
        this._inputs.push(input);
        return input;
    }

    /**
     * Registers a new input connection point in the block which doesn't require a connection because it has a default value.
     * @param name - Defines the name of the input connection point
     * @param type - Defines the type of the input connection point
     * @param defaultValue - Defines the default value to use if nothing is connected to this connection point
     * @returns The new ConnectionPointWithDefault
     * @internal
     */
    public _registerOptionalInput<U extends ConnectionPointType>(name: string, type: U, defaultValue: RuntimeData<U>): ConnectionPointWithDefault<U> {
        const input = new ConnectionPointWithDefault(name, this, type, ConnectionPointDirection.Input, defaultValue);
        this._inputs.push(input);
        return input;
    }

    /**
     * Registers a new output connection point in the block.
     * @param name - Defines the name of the output connection point
     * @param type - Defines the type of the output connection point
     * @returns The new output connection point
     * @internal
     */
    public _registerOutput<U extends ConnectionPointType>(name: string, type: U): ConnectionPoint<U> {
        const output = new ConnectionPoint(name, this, type, ConnectionPointDirection.Output);
        this._outputs.push(output);
        return output;
    }

    /**
     * Registers a new output connection point in the block that always has runtimeData because it has a default value and doesn't allow it to be overwritten with null.
     * @param name - Defines the name of the output connection point
     * @param type - Defines the type of the output connection point
     * @param initialValue - Defines the initial value of the output connection point
     * @returns The new output connection point with a default value
     * @internal
     */
    public _registerOutputWithDefault<U extends ConnectionPointType>(name: string, type: U, initialValue: RuntimeData<U>): ConnectionPointWithDefault<U> {
        const output = new ConnectionPointWithDefault(name, this, type, ConnectionPointDirection.Output, initialValue);
        this._outputs.push(output);
        return output;
    }

    /**
     * Gets the required RuntimeData for the given input, throwing with a clear message if it is null
     * @param input - The input to get the runtime data for
     * @returns The runtimeData or throws if it was undefined
     */
    protected _confirmRuntimeDataSupplied<U extends ConnectionPointType = ConnectionPointType>(input: ConnectionPoint<U>): RuntimeData<U> {
        if (!input.runtimeData) {
            throw new Error(`The ${ConnectionPointType[input.type]} input named "${input.name}" is missing for the ${this.getClassName()} named "${this.name}"`);
        }
        return input.runtimeData;
    }
}

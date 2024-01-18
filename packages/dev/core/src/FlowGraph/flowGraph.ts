import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphContext } from "./flowGraphContext";
import { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphCoordinator } from "./flowGraphCoordinator";
import type { FlowGraphSignalConnection } from "./flowGraphSignalConnection";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { ISerializedFlowGraph, IObjectAccessor } from "./typeDefinitions";
import { FlowGraphMeshPickEventBlock } from "./Blocks/Event/flowGraphMeshPickEventBlock";
import { _isADescendantOf } from "./utils";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import { defaultValueParseFunction } from "./serialization";

export enum FlowGraphState {
    /**
     * The graph is stopped
     */
    Stopped,
    /**
     * The graph is running
     */
    Started,
}

/**
 * @experimental
 * Parameters used to create a flow graph.
 */
export interface IFlowGraphParams {
    /**
     * The scene that the flow graph belongs to.
     */
    scene: Scene;
    /**
     * The event coordinator used by the flow graph.
     */
    coordinator: FlowGraphCoordinator;
}

/**
 * @experimental
 * Options for parsing a flow graph.
 */
export interface IFlowGraphParseOptions {
    /**
     * A function that parses complex values in a scene.
     * @param key the key of the value
     * @param serializationObject the object to read the value from
     * @param scene the scene to read the value from
     */
    valueParseFunction?: (key: string, serializationObject: any, scene: Scene) => any;
    /**
     * The flow graph coordinator.
     */
    coordinator: FlowGraphCoordinator;
    /**
     * A function that converts a path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
}
/**
 * @experimental
 * Class used to represent a flow graph.
 * A flow graph is a graph of blocks that can be used to create complex logic.
 * Blocks can be added to the graph and connected to each other.
 * The graph can then be started, which will init and start all of its event blocks.
 */
export class FlowGraph {
    /** @internal */
    public _eventBlocks: FlowGraphEventBlock[] = [];
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    /**
     * @internal
     */
    public readonly _scene: Scene;
    private _coordinator: FlowGraphCoordinator;
    private _executionContexts: FlowGraphContext[] = [];

    /**
     * The state of the graph
     */
    state: FlowGraphState = FlowGraphState.Stopped;

    /**
     * Construct a Flow Graph
     * @param params construction parameters. currently only the scene
     */
    public constructor(params: IFlowGraphParams) {
        this._scene = params.scene;
        this._coordinator = params.coordinator;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(() => this.dispose());
    }

    /**
     * Create a context. A context represents one self contained execution for the graph, with its own variables.
     * @returns the context, where you can get and set variables
     */
    public createContext() {
        const context = new FlowGraphContext({ scene: this._scene, coordinator: this._coordinator });
        this._executionContexts.push(context);
        return context;
    }

    /**
     * Returns the execution context at a given index
     * @param index the index of the context
     * @returns the execution context at that index
     */
    public getContext(index: number) {
        return this._executionContexts[index];
    }

    /**
     * Add an event block. When the graph is started, it will start listening to events
     * from the block and execute the graph when they are triggered.
     * @param block the event block to be added
     */
    public addEventBlock(block: FlowGraphEventBlock): void {
        this._eventBlocks.push(block);
    }

    /**
     * Starts the flow graph. Initializes the event blocks and starts listening to events.
     */
    public start() {
        if (this.state === FlowGraphState.Started) {
            return;
        }
        this.state = FlowGraphState.Started;
        if (this._executionContexts.length === 0) {
            this.createContext();
        }
        for (const context of this._executionContexts) {
            const contextualOrder = this._getContextualOrder();
            for (const block of contextualOrder) {
                block._startPendingTasks(context);
            }
        }
    }

    private _getContextualOrder(): FlowGraphEventBlock[] {
        const order: FlowGraphEventBlock[] = [];

        for (const block1 of this._eventBlocks) {
            // If the block is a mesh pick, guarantee that picks of children meshes come before picks of parent meshes
            if (block1.getClassName() === FlowGraphMeshPickEventBlock.ClassName) {
                const mesh1 = (block1 as FlowGraphMeshPickEventBlock)._getReferencedMesh();
                let i = 0;
                for (; i < order.length; i++) {
                    const block2 = order[i];
                    const mesh2 = (block2 as FlowGraphMeshPickEventBlock)._getReferencedMesh();
                    if (mesh1 && mesh2 && _isADescendantOf(mesh1, mesh2)) {
                        break;
                    }
                }
                order.splice(i, 0, block1);
            } else {
                order.push(block1);
            }
        }
        return order;
    }

    /**
     * Disposes of the flow graph. Cancels any pending tasks and removes all event listeners.
     */
    public dispose() {
        if (this.state === FlowGraphState.Stopped) {
            return;
        }
        this.state = FlowGraphState.Stopped;
        for (const context of this._executionContexts) {
            context._clearPendingBlocks();
        }
        this._executionContexts.length = 0;
        this._eventBlocks.length = 0;
        this._scene.onDisposeObservable.remove(this._sceneDisposeObserver);
        this._sceneDisposeObserver = null;
    }

    /**
     * Executes a function in all blocks of a flow graph, starting with the event blocks.
     * @param visitor the function to execute.
     */
    public visitAllBlocks(visitor: (block: FlowGraphBlock) => void) {
        const visitList: FlowGraphBlock[] = [];
        const idsAddedToVisitList = new Set<string>();
        for (const block of this._eventBlocks) {
            visitList.push(block);
            idsAddedToVisitList.add(block.uniqueId);
        }

        while (visitList.length > 0) {
            const block = visitList.pop()!;
            visitor(block);

            for (const dataIn of block.dataInputs) {
                for (const connection of dataIn._connectedPoint) {
                    if (!idsAddedToVisitList.has(connection._ownerBlock.uniqueId)) {
                        visitList.push(connection._ownerBlock);
                        idsAddedToVisitList.add(connection._ownerBlock.uniqueId);
                    }
                }
            }
            if (block instanceof FlowGraphExecutionBlock) {
                for (const signalOut of block.signalOutputs) {
                    for (const connection of signalOut._connectedPoint) {
                        if (!idsAddedToVisitList.has(connection._ownerBlock.uniqueId)) {
                            visitList.push(connection._ownerBlock);
                            idsAddedToVisitList.add(connection._ownerBlock.uniqueId);
                        }
                    }
                }
            }
        }
    }

    /**
     * Serializes a graph
     * @param serializationObject the object to write the values in
     * @param valueSerializeFunction a function to serialize complex values
     */
    public serialize(serializationObject: any = {}, valueSerializeFunction?: (key: string, value: any, serializationObject: any) => void) {
        serializationObject.allBlocks = [];
        this.visitAllBlocks((block) => {
            const serializedBlock: any = {};
            block.serialize(serializedBlock);
            serializationObject.allBlocks.push(serializedBlock);
        });
        serializationObject.executionContexts = [];
        for (const context of this._executionContexts) {
            const serializedContext: any = {};
            context.serialize(serializedContext, valueSerializeFunction);
            serializationObject.executionContexts.push(serializedContext);
        }
    }

    /**
     * Given a list of blocks, find an output data connection that has a specific unique id
     * @param blocks a list of flow graph blocks
     * @param uniqueId the unique id of a connection
     * @returns the connection that has this unique id. throws an error if none was found
     */
    public static GetDataOutConnectionByUniqueId(blocks: FlowGraphBlock[], uniqueId: string): FlowGraphDataConnection<any> {
        for (const block of blocks) {
            for (const dataOut of block.dataOutputs) {
                if (dataOut.uniqueId === uniqueId) {
                    return dataOut;
                }
            }
        }
        throw new Error("Could not find data out connection with unique id " + uniqueId);
    }

    /**
     * Given a list of blocks, find an input signal connection that has a specific unique id
     * @param blocks a list of flow graph blocks
     * @param uniqueId the unique id of a connection
     * @returns the connection that has this unique id. throws an error if none was found
     */
    public static GetSignalInConnectionByUniqueId(blocks: FlowGraphBlock[], uniqueId: string): FlowGraphSignalConnection {
        for (const block of blocks) {
            if (block instanceof FlowGraphExecutionBlock) {
                for (const signalIn of block.signalInputs) {
                    if (signalIn.uniqueId === uniqueId) {
                        return signalIn;
                    }
                }
            }
        }
        throw new Error("Could not find signal in connection with unique id " + uniqueId);
    }

    /**
     * Parses a graph from a given serialization object
     * @param serializationObject the object where the values are written
     * @param options options for parsing the graph
     * @returns the parsed graph
     */
    public static Parse(serializationObject: ISerializedFlowGraph, options: IFlowGraphParseOptions): FlowGraph {
        const graph = options.coordinator.createGraph();
        const blocks: FlowGraphBlock[] = [];
        const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
        // Parse all blocks
        for (const serializedBlock of serializationObject.allBlocks) {
            const block = FlowGraphBlock.Parse(serializedBlock, { scene: options.coordinator.config.scene, pathConverter: options.pathConverter, valueParseFunction });
            blocks.push(block);
            if (block instanceof FlowGraphEventBlock) {
                graph.addEventBlock(block);
            }
        }
        // After parsing all blocks, connect them
        for (const block of blocks) {
            for (const dataIn of block.dataInputs) {
                for (const serializedConnection of dataIn.connectedPointIds) {
                    const connection = FlowGraph.GetDataOutConnectionByUniqueId(blocks, serializedConnection);
                    dataIn.connectTo(connection);
                }
            }
            if (block instanceof FlowGraphExecutionBlock) {
                for (const signalOut of block.signalOutputs) {
                    for (const serializedConnection of signalOut.connectedPointIds) {
                        const connection = FlowGraph.GetSignalInConnectionByUniqueId(blocks, serializedConnection);
                        signalOut.connectTo(connection);
                    }
                }
            }
        }
        for (const serializedContext of serializationObject.executionContexts) {
            FlowGraphContext.Parse(serializedContext, { graph, valueParseFunction });
        }
        return graph;
    }
}

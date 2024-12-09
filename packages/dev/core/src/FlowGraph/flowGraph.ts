import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphCoordinator } from "./flowGraphCoordinator";
import type { IObjectAccessor } from "./typeDefinitions";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { PointerInfo } from "core/Events/pointerEvents";
import type { IAssetContainer } from "core/IAssetContainer";

export const enum FlowGraphState {
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
    valueParseFunction?: (key: string, serializationObject: any, assetsContainer: IAssetContainer, scene: Scene) => any;
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
    private _sceneOnBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _meshPickedObserver: Nullable<Observer<PointerInfo>>;
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
        this._initializeGlobalEvents();
    }

    private _initializeGlobalEvents() {
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(() => this.dispose());
        this._sceneOnBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            if (this.state === FlowGraphState.Started) {
                for (const context of this._executionContexts) {
                    context._notifyPendingBlocksOnTick();
                }
            }
        });

        this._meshPickedObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (this.state === FlowGraphState.Started && pointerInfo.pickInfo?.pickedMesh) {
                for (const context of this._executionContexts) {
                    context._notifyPendingBlocksOnPointer(pointerInfo);
                }
            }
        });
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
        // if already started, sort and add to the pending
        if (this.state === FlowGraphState.Started) {
            this._startPendingEvents();
        }
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
        this._startPendingEvents();
    }

    private _startPendingEvents() {
        for (const context of this._executionContexts) {
            const contextualOrder = this._getContextualOrder();
            for (const block of contextualOrder) {
                block._startPendingTasks(context);
            }
        }
    }

    private _getContextualOrder(): FlowGraphEventBlock[] {
        return this._eventBlocks.sort((a, b) => b.initPriority - a.initPriority);
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
        this._scene.onBeforeRenderObservable.remove(this._sceneOnBeforeRenderObserver);
        this._scene.onPointerObservable.remove(this._meshPickedObserver);
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
}

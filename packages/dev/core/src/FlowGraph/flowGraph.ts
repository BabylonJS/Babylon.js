import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import type { FlowGraphCoordinator } from "./flowGraphCoordinator";
import type { IObjectAccessor } from "./typeDefinitions";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { IAssetContainer } from "core/IAssetContainer";
import { FlowGraphEventType } from "./flowGraphEventType";
import type { IFlowGraphEventTrigger } from "./flowGraphSceneEventCoordinator";
import { FlowGraphSceneEventCoordinator } from "./flowGraphSceneEventCoordinator";
import type { FlowGraphMeshPickEventBlock } from "./Blocks/Event/flowGraphMeshPickEventBlock";
import { _IsDescendantOf } from "./utils";

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
    pathConverter?: IPathToObjectConverter<IObjectAccessor>;
}
/**
 * Class used to represent a flow graph.
 * A flow graph is a graph of blocks that can be used to create complex logic.
 * Blocks can be added to the graph and connected to each other.
 * The graph can then be started, which will init and start all of its event blocks.
 *
 * @experimental FlowGraph is still in development and is subject to change.
 */
export class FlowGraph {
    /**
     * An observable that is triggered when the state of the graph changes.
     */
    public onStateChangedObservable: Observable<FlowGraphState> = new Observable();
    /** @internal */
    public _eventBlocks: { [keyof in FlowGraphEventType]: FlowGraphEventBlock[] } = {
        [FlowGraphEventType.SceneReady]: [],
        [FlowGraphEventType.SceneDispose]: [],
        [FlowGraphEventType.SceneBeforeRender]: [],
        [FlowGraphEventType.MeshPick]: [],
        [FlowGraphEventType.PointerDown]: [],
        [FlowGraphEventType.PointerUp]: [],
        [FlowGraphEventType.PointerMove]: [],
        [FlowGraphEventType.PointerOver]: [],
        [FlowGraphEventType.PointerOut]: [],
        [FlowGraphEventType.SceneAfterRender]: [],
        [FlowGraphEventType.NoTrigger]: [],
    };
    /**
     * @internal
     */
    public readonly _scene: Scene;
    private _coordinator: FlowGraphCoordinator;
    private _executionContexts: FlowGraphContext[] = [];
    private _sceneEventCoordinator: FlowGraphSceneEventCoordinator;
    private _eventObserver: Nullable<Observer<IFlowGraphEventTrigger>>;

    /**
     * The state of the graph
     */
    private _state: FlowGraphState = FlowGraphState.Stopped;

    /**
     * The state of the graph
     */
    public get state() {
        return this._state;
    }

    /**
     * The state of the graph
     */
    public set state(value: FlowGraphState) {
        this._state = value;
        this.onStateChangedObservable.notifyObservers(value);
    }

    /**
     * Construct a Flow Graph
     * @param params construction parameters. currently only the scene
     */
    public constructor(params: IFlowGraphParams) {
        this._scene = params.scene;
        this._sceneEventCoordinator = new FlowGraphSceneEventCoordinator(this._scene);
        this._coordinator = params.coordinator;

        this._eventObserver = this._sceneEventCoordinator.onEventTriggeredObservable.add((event) => {
            for (const context of this._executionContexts) {
                const order = this._getContextualOrder(event.type, context);
                for (const block of order) {
                    // iterate contexts
                    if (!block._executeEvent(context, event.payload)) {
                        break;
                    }
                }
            }
            // custom behavior(s) of specific events
            switch (event.type) {
                case FlowGraphEventType.SceneReady:
                    this._sceneEventCoordinator.sceneReadyTriggered = true;
                    break;
                case FlowGraphEventType.SceneBeforeRender:
                    for (const context of this._executionContexts) {
                        context._notifyOnTick(event.payload);
                    }
                    break;
                case FlowGraphEventType.SceneDispose:
                    this.dispose();
                    break;
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
        if (block.type === FlowGraphEventType.PointerOver || block.type === FlowGraphEventType.PointerOut) {
            this._scene.constantlyUpdateMeshUnderPointer = true;
        }

        // don't add if NoTrigger, but still start the pending tasks
        if (block.type !== FlowGraphEventType.NoTrigger) {
            this._eventBlocks[block.type].push(block);
        }
        // if already started, sort and add to the pending
        if (this.state === FlowGraphState.Started) {
            for (const context of this._executionContexts) {
                block._startPendingTasks(context);
            }
        } else {
            this.onStateChangedObservable.addOnce((state) => {
                if (state === FlowGraphState.Started) {
                    for (const context of this._executionContexts) {
                        block._startPendingTasks(context);
                    }
                }
            });
        }
    }

    /**
     * Starts the flow graph. Initializes the event blocks and starts listening to events.
     */
    public start() {
        if (this.state === FlowGraphState.Started) {
            return;
        }
        if (this._executionContexts.length === 0) {
            this.createContext();
        }
        this.onStateChangedObservable.add((state) => {
            if (state === FlowGraphState.Started) {
                this._startPendingEvents();
                // the only event we need to check is the scene ready event. If the scene is already ready when the graph starts, we should start the pending tasks.
                if (this._scene.isReady(true)) {
                    this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.SceneReady });
                }
            }
        });
        this.state = FlowGraphState.Started;
    }

    private _startPendingEvents() {
        for (const context of this._executionContexts) {
            for (const type in this._eventBlocks) {
                const order = this._getContextualOrder(type as FlowGraphEventType, context);
                for (const block of order) {
                    block._startPendingTasks(context);
                }
            }
        }
    }

    private _getContextualOrder(type: FlowGraphEventType, context: FlowGraphContext): FlowGraphEventBlock[] {
        const order = this._eventBlocks[type].sort((a, b) => b.initPriority - a.initPriority);

        if (type === FlowGraphEventType.MeshPick) {
            const meshPickOrder = [] as FlowGraphEventBlock[];
            for (const block1 of order) {
                // If the block is a mesh pick, guarantee that picks of children meshes come before picks of parent meshes
                const mesh1 = (block1 as FlowGraphMeshPickEventBlock).asset.getValue(context);
                let i = 0;
                for (; i < order.length; i++) {
                    const block2 = order[i];
                    const mesh2 = (block2 as FlowGraphMeshPickEventBlock).asset.getValue(context);
                    if (mesh1 && mesh2 && _IsDescendantOf(mesh1, mesh2)) {
                        break;
                    }
                }
                meshPickOrder.splice(i, 0, block1);
            }
            return meshPickOrder;
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
        for (const type in this._eventBlocks) {
            this._eventBlocks[type as FlowGraphEventType].length = 0;
        }
        this._eventObserver?.remove();
        this._sceneEventCoordinator.dispose();
    }

    /**
     * Executes a function in all blocks of a flow graph, starting with the event blocks.
     * @param visitor the function to execute.
     */
    public visitAllBlocks(visitor: (block: FlowGraphBlock) => void) {
        const visitList: FlowGraphBlock[] = [];
        const idsAddedToVisitList = new Set<string>();
        for (const type in this._eventBlocks) {
            for (const block of this._eventBlocks[type as FlowGraphEventType]) {
                visitList.push(block);
                idsAddedToVisitList.add(block.uniqueId);
            }
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

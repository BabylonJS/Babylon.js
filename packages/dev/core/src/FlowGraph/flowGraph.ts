import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphCoordinator } from "./flowGraphCoordinator";
import type { IObjectAccessor } from "./typeDefinitions";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { IAssetContainer } from "core/IAssetContainer";
import { FlowGraphEventType } from "./flowGraphEventType";
import type { IFlowGraphEventTrigger } from "./flowGraphSceneEventCoordinator";
import { FlowGraphSceneEventCoordinator } from "./flowGraphSceneEventCoordinator";
import type { FlowGraphMeshPickEventBlock } from "./Blocks/Event/flowGraphMeshPickEventBlock";
import { _IsDescendantOf } from "./utils";
import type { IFlowGraphValidationResult } from "./flowGraphValidator";
import { ValidateFlowGraphWithBlockList } from "./flowGraphValidator";

export const enum FlowGraphState {
    /**
     * The graph is stopped
     */
    Stopped,
    /**
     * The graph is running
     */
    Started,
    /**
     * The graph is paused (contexts kept, pending tasks cancelled)
     */
    Paused,
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
     * @param assetsContainer the assets container to read assets from
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
     * All blocks that belong to this graph, including unreachable ones.
     * @internal
     */
    public _allBlocks: FlowGraphBlock[] = [];
    /**
     * @internal
     */
    public readonly _scene: Scene;

    /**
     * The scene associated with this flow graph.
     */
    public get scene(): Scene {
        return this._scene;
    }
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
    }

    private _attachEventObserver() {
        if (this._eventObserver) {
            return;
        }
        this._eventObserver = this._sceneEventCoordinator.onEventTriggeredObservable.add((event) => {
            if (event.type === FlowGraphEventType.SceneDispose) {
                this.dispose();
                return;
            }

            if (this.state !== FlowGraphState.Started) {
                return;
            }

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
            }
        });
    }

    private _detachEventObserver() {
        this._eventObserver?.remove();
        this._eventObserver = null;
    }

    /**
     * Sets a new scene for this flow graph, re-wiring all event listeners.
     * This is useful when the scene the flow graph should listen to changes
     * (e.g. when a new scene is loaded in an editor preview).
     * If the graph is currently running, it will be stopped first and must be
     * restarted manually after calling this method.
     * @param scene the new scene to attach to
     */
    public setScene(scene: Scene): void {
        if (scene === this._scene) {
            return;
        }
        if (this.state === FlowGraphState.Started) {
            this.stop();
        }
        // Tear down old event coordinator
        this._detachEventObserver();
        this._sceneEventCoordinator.dispose();
        // Rebuild with the new scene
        (this as { _scene: Scene })._scene = scene;
        this._scene.constantlyUpdateMeshUnderPointer = true; // ensure pointer info is always up to date for event blocks that need it
        this._sceneEventCoordinator = new FlowGraphSceneEventCoordinator(this._scene);
        // Pre-attach the event observer so that events from the new
        // coordinator are routed to the graph immediately.  The handler
        // guards against processing events while the graph is stopped,
        // but having the observer in place ensures no events are lost
        // when start() is called shortly after.
        this._attachEventObserver();
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
     * Returns all blocks registered in this graph, including disconnected ones.
     * @returns a read-only array of all blocks
     */
    public getAllBlocks(): readonly FlowGraphBlock[] {
        return this._allBlocks;
    }

    /**
     * Register a block with the graph. This does not wire any connections;
     * it simply ensures the block is tracked so that serialization, editor
     * display, and validation see it even when it is not reachable from an
     * event block.
     * @param block the block to register
     */
    public addBlock(block: FlowGraphBlock): void {
        if (this._allBlocks.indexOf(block) === -1) {
            this._allBlocks.push(block);
        }
    }

    /**
     * Remove a block from the graph. Disconnects all of its ports and, if it
     * is an event block, unregisters it from the event-block lists.
     * @param block the block to remove
     */
    public removeBlock(block: FlowGraphBlock): void {
        const idx = this._allBlocks.indexOf(block);
        if (idx !== -1) {
            this._allBlocks.splice(idx, 1);
        }
        // If it is an event block, remove from the event-block registry
        if (block instanceof FlowGraphExecutionBlock && "type" in block) {
            const eventBlock = block as unknown as FlowGraphEventBlock;
            const list = this._eventBlocks[eventBlock.type];
            if (list) {
                const eIdx = list.indexOf(eventBlock);
                if (eIdx !== -1) {
                    list.splice(eIdx, 1);
                }
            }
        }
        // If the block has pending async tasks (e.g. event subscriptions),
        // cancel them in all active execution contexts so deletion takes
        // effect immediately even while the graph is running.
        if (block instanceof FlowGraphAsyncExecutionBlock) {
            for (const context of this._executionContexts) {
                block._cancelPendingTasks(context);
                block._resetAfterCanceled(context);
            }
        }
        // Disconnect all ports
        for (const input of block.dataInputs) {
            input.disconnectFromAll();
        }
        for (const output of block.dataOutputs) {
            output.disconnectFromAll();
        }
        if (block instanceof FlowGraphExecutionBlock) {
            for (const signalIn of block.signalInputs) {
                signalIn.disconnectFromAll();
            }
            for (const signalOut of block.signalOutputs) {
                signalOut.disconnectFromAll();
            }
        }
    }

    /**
     * Add an event block. When the graph is started, it will start listening to events
     * from the block and execute the graph when they are triggered.
     * @param block the event block to be added
     */
    public addEventBlock(block: FlowGraphEventBlock): void {
        this.addBlock(block);
        if (block.type === FlowGraphEventType.PointerOver || block.type === FlowGraphEventType.PointerOut) {
            this._scene.constantlyUpdateMeshUnderPointer = true;
        }

        this._eventBlocks[block.type].push(block);

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
     * Stops the flow graph. Cancels all pending tasks and clears execution contexts,
     * but keeps event blocks so the graph can be restarted.
     */
    public stop() {
        if (this.state === FlowGraphState.Stopped) {
            return;
        }
        this._detachEventObserver();
        this.state = FlowGraphState.Stopped;
        for (const context of this._executionContexts) {
            context._clearPendingBlocks();
            context._clearPendingActivation();
        }
        this._executionContexts.length = 0;
    }

    /**
     * Pauses the flow graph. Cancels pending tasks but keeps execution contexts and event blocks.
     * Call start() to resume.
     */
    public pause() {
        if (this.state !== FlowGraphState.Started) {
            return;
        }
        this._detachEventObserver();
        this.state = FlowGraphState.Paused;
        for (const context of this._executionContexts) {
            context._clearPendingBlocks();
        }
    }

    /**
     * Starts the flow graph. Initializes the event blocks and starts listening to events.
     * Can also be called to resume from a paused state.
     */
    public start() {
        if (this.state === FlowGraphState.Started) {
            return;
        }
        const resumingFromPause = this.state === FlowGraphState.Paused;
        if (this._executionContexts.length === 0) {
            this.createContext();
        }
        this._attachEventObserver();
        this.state = FlowGraphState.Started;
        this._startPendingEvents();
        // On a fresh start (not resume), fire the SceneReady event.
        // The coordinator's own scene-ready observer may have already
        // fired (and been lost) while the graph was stopped, so reset
        // the flag and handle the ready state ourselves.
        if (!resumingFromPause) {
            this._sceneEventCoordinator.sceneReadyTriggered = false;
            if (this._scene.isReady(true)) {
                this._sceneEventCoordinator.sceneReadyTriggered = true;
                this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.SceneReady });
            } else {
                // Scene isn't ready yet (e.g. pending shader compilations after
                // a scene swap).  Use executeWhenReady(true) which restarts the
                // readiness check loop — a plain addOnce on onReadyObservable
                // may never fire if the check loop already completed.
                this._scene.executeWhenReady(() => {
                    if (this.state === FlowGraphState.Started && !this._sceneEventCoordinator.sceneReadyTriggered) {
                        this._sceneEventCoordinator.sceneReadyTriggered = true;
                        this._sceneEventCoordinator.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.SceneReady });
                    }
                }, true);
            }
        }
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
            context._clearPendingActivation();
        }
        this._executionContexts.length = 0;
        for (const type in this._eventBlocks) {
            this._eventBlocks[type as FlowGraphEventType].length = 0;
        }
        this._allBlocks.length = 0;
        this._detachEventObserver();
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
     * Validates the flow graph and returns all issues found.
     * Uses the tracked block list for complete validation including unreachable block detection.
     * @returns The validation result containing errors and warnings.
     */
    public validate(): IFlowGraphValidationResult {
        return ValidateFlowGraphWithBlockList(this, this._allBlocks);
    }

    /**
     * Serializes a graph
     * @param serializationObject the object to write the values in
     * @param valueSerializeFunction a function to serialize complex values
     */
    public serialize(serializationObject: any = {}, valueSerializeFunction?: (key: string, value: any, serializationObject: any) => void) {
        serializationObject.allBlocks = [];
        // Collect all blocks: traversal-reachable ones plus any registered
        // orphans in _allBlocks (e.g. disconnected blocks in the editor).
        const seen = new Set<string>();
        const serializeBlock = (block: FlowGraphBlock) => {
            if (seen.has(block.uniqueId)) {
                return;
            }
            seen.add(block.uniqueId);
            const serializedBlock: any = {};
            block.serialize(serializedBlock);
            serializationObject.allBlocks.push(serializedBlock);
        };
        this.visitAllBlocks(serializeBlock);
        for (const block of this._allBlocks) {
            serializeBlock(block);
        }
        serializationObject.executionContexts = [];
        for (const context of this._executionContexts) {
            const serializedContext: any = {};
            context.serialize(serializedContext, valueSerializeFunction);
            serializationObject.executionContexts.push(serializedContext);
        }
    }
}

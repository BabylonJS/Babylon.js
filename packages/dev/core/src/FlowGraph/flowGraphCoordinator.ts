import { type EventState, type IReadonlyObservable, type Observer, Observable } from "core/Misc/observable";
import { type Scene } from "../scene";
import { FlowGraph } from "./flowGraph";
import { type IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import { type IObjectAccessor } from "./typeDefinitions";
import { type IAssetContainer } from "core/IAssetContainer";
import { Logger } from "core/Misc/logger";
import { type Nullable } from "core/types";
import { type AudioEngineV2 } from "../AudioV2/abstractAudio/audioEngineV2";
import { type StaticSound } from "../AudioV2/abstractAudio/staticSound";
import { type IFlowGraphHostResolver, GetDefaultEventReferenceKey, GetDefaultEventReference } from "./flowGraphHostResolver";
import { type IFlowGraphSoundAsset } from "./flowGraphSoundAssets";

interface ISoundAssetEntry {
    asset: IFlowGraphSoundAsset;
    sound: Nullable<StaticSound>;
}

/**
 * Audio engine created by coordinators when no audio engine exists. It is shared by all coordinators
 * that need a fallback engine and disposed when the last of them is disposed.
 */
let FallbackAudioEnginePromise: Nullable<Promise<AudioEngineV2>> = null;
let FallbackAudioEngine: Nullable<AudioEngineV2> = null;
let FallbackAudioEngineUsers = 0;

function DisposeUnusedFallbackAudioEngine(): void {
    if (FallbackAudioEngineUsers > 0 || !FallbackAudioEngine) {
        return;
    }
    const engine = FallbackAudioEngine;
    FallbackAudioEngine = null;
    FallbackAudioEnginePromise = null;
    engine.dispose();
}

async function GetFallbackAudioEngineAsync(): Promise<AudioEngineV2> {
    if (!FallbackAudioEnginePromise) {
        FallbackAudioEnginePromise = (async () => {
            try {
                const { CreateAudioEngineAsync } = await import("../AudioV2/webAudio/webAudioEngine");
                const engine = await CreateAudioEngineAsync();
                FallbackAudioEngine = engine;
                // All users may have been disposed while the engine was being created.
                DisposeUnusedFallbackAudioEngine();
                return engine;
            } catch (e) {
                FallbackAudioEnginePromise = null;
                throw e;
            }
        })();
    }
    return await FallbackAudioEnginePromise;
}

/**
 * Parameters used to create a flow graph engine.
 */
export interface IFlowGraphCoordinatorConfiguration {
    /**
     * The scene that the flow graph engine belongs to.
     */
    scene: Scene;
    /**
     * Optional resolver letting the environment hosting the graphs decide how runtime entities are
     * represented as opaque reference values. When omitted, a neutral built-in representation is used.
     */
    hostResolver?: IFlowGraphHostResolver;
}

/**
 * Parameters used to parse a flow graph coordinator.
 */
export interface IFlowGraphCoordinatorParseOptions {
    /**
     * A function that will be called to parse the value of a property.
     * @param key the key of the property
     * @param serializationObject the serialization object where the property is located
     * @param assetsContainer the assets container
     * @param scene the scene that the block is being parsed in
     */
    valueParseFunction?: (key: string, serializationObject: any, assetsContainer: IAssetContainer, scene: Scene) => any;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter?: IPathToObjectConverter<IObjectAccessor>;
    /**
     * The scene that the flow graph coordinator belongs to.
     */
    scene: Scene;
    /**
     * The audio engine used to load the serialized sound assets.
     * When omitted, the most recently created audio engine is used, and a new one is created if none exists.
     */
    audioEngine?: AudioEngineV2;
}
/**
 * This class holds all of the existing flow graphs and is responsible for creating new ones.
 * It also handles starting/stopping multiple graphs and communication between them through an Event Coordinator
 * This is the entry point for the flow graph system.
 * @experimental This class is still in development and is subject to change.
 */
export class FlowGraphCoordinator {
    /**
     * The maximum number of events per type.
     * This is used to limit the number of events that can be created in a single scene.
     * This is to prevent infinite loops.
     */
    public static MaxEventsPerType: number = 30;

    /**
     * The maximum number of execution of a specific event in a single frame.
     */
    public static MaxEventTypeExecutionPerFrame: number = 30;
    /**
     * @internal
     * A list of all the coordinators per scene. Will be used by the inspector
     */
    public static readonly SceneCoordinators: Map<Scene, FlowGraphCoordinator[]> = new Map();

    /**
     * Observable raised when a flow graph is added to any coordinator. Used by the inspector to keep
     * the flow graph list in sync. The payload is the newly added flow graph.
     */
    public static get OnFlowGraphAddedObservable(): IReadonlyObservable<FlowGraph> {
        return this._OnFlowGraphAddedObservable;
    }
    private static readonly _OnFlowGraphAddedObservable = new Observable<FlowGraph>();

    /**
     * Observable raised when a flow graph is removed from any coordinator. Used by the inspector to keep
     * the flow graph list in sync. The payload is the removed flow graph.
     */
    public static get OnFlowGraphRemovedObservable(): IReadonlyObservable<FlowGraph> {
        return this._OnFlowGraphRemovedObservable;
    }
    private static readonly _OnFlowGraphRemovedObservable = new Observable<FlowGraph>();

    /**
     * When set to true (default) custom events will be dispatched synchronously.
     * This means that the events will be dispatched immediately when they are triggered.
     */
    public dispatchEventsSynchronously: boolean = true;

    private readonly _flowGraphs: FlowGraph[] = [];

    private _customEventsMap: Map<string, Observable<any>> = new Map();

    private readonly _soundAssets = new Map<string, ISoundAssetEntry>();

    private _usesFallbackAudioEngine = false;

    /**
     * Observable raised with the name of a sound asset when its loaded sound changes,
     * i.e. when the asset finishes loading, is replaced or is removed.
     */
    public readonly onSoundAssetChangedObservable = new Observable<string>();

    private _eventExecutionCounter: Map<string, number> = new Map();

    private _disposeObserver!: Observer<Scene>;
    private _onBeforeRenderObserver!: Observer<Scene>;
    private _executeOnNextFrame: { id: string; data?: any; uniqueId: number }[] = [];
    private _eventUniqueId: number = 0;

    /**
     * Stack of custom-event dispatches currently in progress. Each entry pairs the
     * dispatched event id with the Observable's EventState so that
     * `event/stopPropagation` can stop the remaining handlers of an in-flight
     * dispatch. A stack (rather than a single value) tolerates re-entrant
     * dispatching, e.g. an event handler synchronously sending another event.
     * @internal
     */
    public _eventDispatchStack: { eventId: string; state: EventState; propagationStopped: boolean }[] = [];

    public constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphCoordinatorConfiguration
    ) {
        this._attachToScene(this.config.scene);
    }

    private _attachToScene(scene: Scene): void {
        // When the scene is disposed, dispose all graphs currently running on it.
        this._disposeObserver = scene.onDisposeObservable.add(() => {
            this.dispose();
        });

        this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            // Reset the event execution counter at the beginning of each frame.
            this._eventExecutionCounter.clear();
            // duplicate the _executeOnNextFrame array to avoid modifying it while iterating over it
            const executeOnNextFrame = this._executeOnNextFrame.slice(0);
            if (executeOnNextFrame.length) {
                // Execute the events that were triggered on the next frame.
                for (const event of executeOnNextFrame) {
                    this.notifyCustomEvent(event.id, event.data, false);
                    // remove the event from the array
                    const index = this._executeOnNextFrame.findIndex((e) => e.uniqueId === event.uniqueId);
                    if (index !== -1) {
                        this._executeOnNextFrame.splice(index, 1);
                    }
                }
            }
        });

        // Add itself to the SceneCoordinators list for the Inspector.
        let coordinators = FlowGraphCoordinator.SceneCoordinators.get(scene);
        if (!coordinators) {
            coordinators = [];
            FlowGraphCoordinator.SceneCoordinators.set(scene, coordinators);
        }
        coordinators.push(this);
    }

    private _detachFromScene(scene: Scene): void {
        this._disposeObserver.remove();
        this._onBeforeRenderObserver.remove();
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(scene);
        if (!coordinators) {
            return;
        }
        const index = coordinators.indexOf(this);
        if (index !== -1) {
            coordinators.splice(index, 1);
        }
    }

    /**
     * Reattaches this coordinator's lifecycle observers to another scene.
     * @param scene new scene owned by the coordinator
     * @param updateGraphs whether existing graphs should also be reattached
     * @internal
     */
    public _setScene(scene: Scene, updateGraphs = true): void {
        const previousScene = this.config.scene;
        if (scene === previousScene) {
            return;
        }
        this._detachFromScene(previousScene);
        this.config.scene = scene;
        if (updateGraphs) {
            for (const graph of this._flowGraphs) {
                graph.setScene(scene);
            }
        }
        this._attachToScene(scene);
    }

    /**
     * Creates a new flow graph and adds it to the list of existing flow graphs
     * @param name - optional name for the new graph. If not provided, an auto-generated name is used.
     * @returns a new flow graph
     */
    public createGraph(name?: string): FlowGraph {
        const graphName = name ?? `Graph ${this._flowGraphs.length + 1}`;
        const graph = new FlowGraph({ scene: this.config.scene, coordinator: this, name: graphName });
        this._flowGraphs.push(graph);
        FlowGraphCoordinator._OnFlowGraphAddedObservable.notifyObservers(graph);
        return graph;
    }

    /**
     * Removes a flow graph from the list of existing flow graphs and disposes it
     * @param graph the graph to remove
     */
    public removeGraph(graph: FlowGraph) {
        const index = this._flowGraphs.indexOf(graph);
        if (index !== -1) {
            graph.dispose();
            this._flowGraphs.splice(index, 1);
            FlowGraphCoordinator._OnFlowGraphRemovedObservable.notifyObservers(graph);
        }
    }

    /**
     * Starts all graphs
     */
    public start() {
        for (const graph of this._flowGraphs) {
            graph.start();
        }
    }

    /**
     * Disposes all graphs
     */
    public dispose() {
        for (const graph of this._flowGraphs) {
            graph.dispose();
            FlowGraphCoordinator._OnFlowGraphRemovedObservable.notifyObservers(graph);
        }
        this._flowGraphs.length = 0;
        for (const entry of this._soundAssets.values()) {
            entry.sound?.dispose();
        }
        this._soundAssets.clear();
        this.onSoundAssetChangedObservable.clear();
        if (this._usesFallbackAudioEngine) {
            this._usesFallbackAudioEngine = false;
            FallbackAudioEngineUsers--;
            DisposeUnusedFallbackAudioEngine();
        }
        this._detachFromScene(this.config.scene);
    }

    /**
     * Gets the sound assets declared on this coordinator.
     * Declared sound assets are serialized with the coordinator.
     */
    public get soundAssets(): IFlowGraphSoundAsset[] {
        return Array.from(this._soundAssets.values(), (entry) => ({ ...entry.asset }));
    }

    /**
     * Gets the loaded sound of a declared sound asset.
     * @param name the name of the sound asset
     * @returns the loaded sound, or null if the asset is not declared or not loaded yet
     */
    public getSoundAsset(name: string): Nullable<StaticSound> {
        return this._soundAssets.get(name)?.sound ?? null;
    }

    /**
     * Declares a sound asset on this coordinator and loads its sound.
     * An existing asset with the same name is replaced and its sound is disposed, so audio blocks that
     * reference the asset by name will play the new sound.
     * If loading fails, the asset stays declared (and serialized) without a sound, and the error is rethrown.
     * @param asset the sound asset to declare
     * @param audioEngine the audio engine used to load the sound. When omitted, the most recently created audio engine is used.
     * If no audio engine exists, a fallback engine is created; it is shared between coordinators and disposed with the last coordinator using it.
     * @returns a promise that resolves with the loaded sound
     */
    public async addSoundAssetAsync(asset: IFlowGraphSoundAsset, audioEngine?: AudioEngineV2): Promise<StaticSound> {
        // Copy the descriptor so that changes made by the caller while the sound loads do not affect this load.
        const entry: ISoundAssetEntry = { asset: { name: asset.name, url: asset.url }, sound: null };
        const { name, url } = entry.asset;
        this.removeSoundAsset(name);
        this._soundAssets.set(name, entry);

        const { CreateSoundAsync, LastCreatedAudioEngine } = await import("../AudioV2/abstractAudio/audioEngineV2");
        this._throwIfSoundAssetChanged(entry);
        let engine: AudioEngineV2;
        if (audioEngine && audioEngine !== FallbackAudioEngine) {
            engine = audioEngine;
        } else {
            // A fallback engine is already listed by LastCreatedAudioEngine while it initializes, so join a pending
            // fallback before treating the last created engine as owned by someone else. Once the fallback is ready,
            // an engine created later by the application takes precedence.
            const isFallbackPending = !!FallbackAudioEnginePromise && !FallbackAudioEngine;
            const lastEngine = audioEngine ?? (isFallbackPending ? null : LastCreatedAudioEngine());
            if (lastEngine && lastEngine !== FallbackAudioEngine) {
                engine = lastEngine;
            } else {
                if (!this._usesFallbackAudioEngine) {
                    this._usesFallbackAudioEngine = true;
                    FallbackAudioEngineUsers++;
                }
                engine = await GetFallbackAudioEngineAsync();
                this._throwIfSoundAssetChanged(entry);
            }
        }

        const sound = await CreateSoundAsync(name, url, {}, engine);
        if (this._soundAssets.get(name) !== entry) {
            sound.dispose();
            this._throwIfSoundAssetChanged(entry);
        }
        entry.sound = sound;
        this.onSoundAssetChangedObservable.notifyObservers(name);
        return sound;
    }

    private _throwIfSoundAssetChanged(entry: ISoundAssetEntry): void {
        if (this._soundAssets.get(entry.asset.name) !== entry) {
            throw new Error(`Sound asset "${entry.asset.name}" was removed or replaced before it finished loading.`);
        }
    }

    /**
     * Removes a declared sound asset and disposes its sound.
     * @param name the name of the sound asset to remove
     */
    public removeSoundAsset(name: string): void {
        const entry = this._soundAssets.get(name);
        if (!entry) {
            return;
        }
        entry.sound?.dispose();
        this._soundAssets.delete(name);
        this.onSoundAssetChangedObservable.notifyObservers(name);
    }

    /**
     * Serializes this coordinator to a JSON object.
     * @param serializationObject the object to serialize to
     * @param valueSerializeFunction the function to use to serialize the value
     */
    public serialize(serializationObject: any, valueSerializeFunction?: (key: string, value: any, serializationObject: any) => void) {
        serializationObject._flowGraphs = [];
        for (const graph of this._flowGraphs) {
            const serializedGraph: any = {};
            graph.serialize(serializedGraph, valueSerializeFunction);
            serializationObject._flowGraphs.push(serializedGraph);
        }
        serializationObject.dispatchEventsSynchronously = this.dispatchEventsSynchronously;
        if (this._soundAssets.size > 0) {
            serializationObject.soundAssets = this.soundAssets;
        } else {
            delete serializationObject.soundAssets;
        }
        delete serializationObject.referenceProvenance;
    }

    /**
     * Gets the list of flow graphs
     */
    public get flowGraphs() {
        return this._flowGraphs;
    }

    /**
     * Get an observable that will be notified when the event with the given id is fired.
     * @param id the id of the event
     * @returns the observable for the event
     */
    public getCustomEventObservable(id: string): Observable<any> {
        let observable = this._customEventsMap.get(id);
        if (!observable) {
            // receive event is initialized before scene start, so no need to notify if triggered. but possible!
            observable = new Observable<any>(/*undefined, true*/);
            this._customEventsMap.set(id, observable);
        }
        return observable;
    }

    /**
     * Notifies the observable for the given event id with the given data.
     * @param id the id of the event
     * @param data the data to send with the event
     * @param async if true, the event will be dispatched asynchronously
     */
    public notifyCustomEvent(id: string, data: any, async: boolean = !this.dispatchEventsSynchronously) {
        if (async) {
            this._executeOnNextFrame.push({ id, data, uniqueId: this._eventUniqueId++ });
            return;
        }
        // check if we are not exceeding the max number of events
        if (this._eventExecutionCounter.has(id)) {
            const count = this._eventExecutionCounter.get(id)!;
            this._eventExecutionCounter.set(id, count + 1);
            if (count >= FlowGraphCoordinator.MaxEventTypeExecutionPerFrame) {
                if (count === FlowGraphCoordinator.MaxEventTypeExecutionPerFrame) {
                    Logger.Warn(`FlowGraphCoordinator: Too many executions of event "${id}".`);
                }
                return;
            }
        } else {
            this._eventExecutionCounter.set(id, 1);
        }
        const observable = this._customEventsMap.get(id);
        if (observable) {
            observable.notifyObservers(data);
        }
    }

    /**
     * @internal
     * Marks the beginning of a custom-event dispatch. Called by event receiver
     * blocks from within their Observable callback so that the dispatch's
     * EventState becomes reachable by `event/stopPropagation` while the receiver
     * flow executes synchronously.
     * @param eventId the id of the event being dispatched
     * @param state the Observable EventState for this dispatch
     */
    public _beginEventDispatch(eventId: string, state: EventState): void {
        this._eventDispatchStack.push({ eventId, state, propagationStopped: false });
    }

    /**
     * @internal
     * Marks the end of the most recent custom-event dispatch started with
     * {@link _beginEventDispatch}.
     */
    public _endEventDispatch(): { eventId: string; state: EventState; propagationStopped: boolean } | undefined {
        return this._eventDispatchStack.pop();
    }

    /**
     * Stops the propagation of an in-flight custom event, preventing any event
     * handler nodes that have not been activated yet from running for the current
     * dispatch.
     *
     * The `event` argument is the opaque event reference produced by an event block on its `event`
     * output. If it does not reference an event that is currently being dispatched, this is a no-op.
     *
     * Babylon custom events have no scene-graph propagation layer, so there are
     * no transitive activations to cancel when `stopImmediate` is false. When it
     * is true, the remaining handlers in the Observable dispatch are skipped.
     * @param event the event reference to stop propagation for
     * @param stopImmediate whether to also stop remaining immediate handlers
     */
    public stopEventPropagation(event: string, stopImmediate: boolean): void {
        if (typeof event !== "string") {
            return;
        }
        const decode = this.config.hostResolver?.decodeEventReference ?? GetDefaultEventReferenceKey;
        const eventId = decode(event);
        if (eventId === undefined) {
            return;
        }
        // Find the most recent matching in-flight dispatch and skip its remaining observers.
        for (let i = this._eventDispatchStack.length - 1; i >= 0; i--) {
            if (this._eventDispatchStack[i].eventId === eventId) {
                this._eventDispatchStack[i].propagationStopped = true;
                if (stopImmediate) {
                    this._eventDispatchStack[i].state.skipNextObservers = true;
                }
                return;
            }
        }
    }

    /**
     * @internal
     * Encodes an event source key as the opaque reference exposed on an event block's `event`
     * output, delegating to the host resolver when one is configured.
     * @param key the event source key
     * @returns the event reference
     */
    public _getEventReference(key: string): string {
        const encode = this.config.hostResolver?.encodeEventReference;
        return encode ? encode(key) : GetDefaultEventReference(key);
    }
}

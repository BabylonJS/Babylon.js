import { serialize } from "../Misc/decorators";
import { RandomGUID } from "../Misc/guid";
import { type Scene } from "../scene";
import { type FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import { type FlowGraphBlock } from "./flowGraphBlock";
import { type FlowGraphDataConnection } from "./flowGraphDataConnection";
import { type FlowGraph } from "./flowGraph";
import { defaultValueSerializationFunction } from "./serialization";
import { type FlowGraphCoordinator } from "./flowGraphCoordinator";
import { Observable } from "../Misc/observable";
import { type AssetType, type FlowGraphAssetType, GetFlowGraphAssetWithType } from "./flowGraphAssetsContext";
import { type IAssetContainer } from "core/IAssetContainer";
import { type Nullable } from "core/types";
import { FlowGraphAction, FlowGraphLogger } from "./flowGraphLogger";
import { type IFlowGraphOnTickEventPayload } from "./Blocks/Event/flowGraphSceneTickEventBlock";
import { type FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
import { type FlowGraphSignalConnection } from "./flowGraphSignalConnection";

/**
 * Represents a pending signal activation that was paused by a breakpoint.
 */
export interface IFlowGraphPendingActivation {
    /** The block that was about to execute */
    readonly block: FlowGraphExecutionBlock;
    /** The context in which execution was paused */
    readonly context: FlowGraphContext;
    /** The signal connection that triggered the execution */
    readonly signal: FlowGraphSignalConnection;
}
/**
 * Construction parameters for the context.
 */
export interface IFlowGraphContextConfiguration {
    /**
     * The scene that the flow graph context belongs to.
     */
    readonly scene: Scene;
    /**
     * The event coordinator used by the flow graph context.
     */
    readonly coordinator: FlowGraphCoordinator;

    /**
     * The assets context used by the flow graph context.
     * If none is provided, a default one will be created.
     */
    readonly assetsContext?: IAssetContainer;
}

/**
 * Options for parsing a context.
 */
export interface IFlowGraphContextParseOptions {
    /**
     * A function that parses a value from a serialization object.
     * @param key the key of the value
     * @param serializationObject the object containing the value
     * @param assetsContainer the assets container
     * @param scene the current scene
     * @returns
     */
    readonly valueParseFunction?: (key: string, serializationObject: any, assetsContainer: IAssetContainer, scene: Scene) => any;
    /**
     * The graph that the context is being parsed in.
     */
    readonly graph: FlowGraph;
}
/**
 * The context represents the current state and execution of the flow graph.
 * It contains both user-defined variables, which are derived from
 * a more general variable definition, and execution variables that
 * are set by the blocks.
 */
export class FlowGraphContext {
    /**
     * A randomly generated GUID for each context.
     */
    @serialize()
    public uniqueId = RandomGUID();
    /**
     * These are the variables defined by a user.
     */
    private _userVariables: { [key: string]: any } = {};
    /**
     * These are the variables set by the blocks.
     */
    private _executionVariables: { [key: string]: any } = {};

    /**
     * A context-specific global variables, available to all blocks in the context.
     */
    private _globalContextVariables: { [key: string]: any } = {};
    /**
     * These are the values for the data connection points
     */
    private _connectionValues: { [key: string]: any } = {};
    /**
     * These are the variables set by the graph.
     */
    private readonly _configuration: IFlowGraphContextConfiguration;
    /**
     * These are blocks that have currently pending tasks/listeners that need to be cleaned up.
     */
    private _pendingBlocks: FlowGraphAsyncExecutionBlock[] = [];
    /**
     * A monotonically increasing ID for each execution.
     * Incremented for every block executed.
     */
    private _executionId = 0;
    /**
     * Observable that is triggered when a node is executed.
     */
    public onNodeExecutedObservable: Observable<FlowGraphBlock> = new Observable<FlowGraphBlock>();

    /**
     * Observable triggered when a breakpoint is hit.
     * Observers receive the pending activation (block, context, signal) that was paused.
     */
    public onBreakpointHitObservable: Observable<IFlowGraphPendingActivation> = new Observable<IFlowGraphPendingActivation>();

    /**
     * A predicate called before each execution block runs.
     * If it returns true, execution is paused before the block and a
     * pending activation is stored, which can be resumed via
     * {@link continueExecution} or {@link stepExecution}.
     *
     * Set to `null` to disable breakpoint checking.
     */
    public breakpointPredicate: Nullable<(block: FlowGraphExecutionBlock) => boolean> = null;

    /**
     * The activation that is currently paused due to a breakpoint hit.
     * `null` when execution is not paused on a breakpoint.
     */
    private _pendingActivation: Nullable<IFlowGraphPendingActivation> = null;

    /**
     * When true, the next activation will pause regardless of the breakpoint predicate.
     * Set by {@link stepExecution}.
     */
    private _stepMode: boolean = false;

    /**
     * When set, the breakpoint check is skipped for this specific block uniqueId
     * on the very next call to {@link _shouldBreak}. Used by continue/step to avoid
     * immediately re-hitting the breakpoint on the block being resumed.
     */
    private _skipBreakpointForBlockId: Nullable<string> = null;

    /**
     * The assets context used by the flow graph context.
     * Note that it can be shared between flow graph contexts.
     */
    public assetsContext: IAssetContainer;

    /**
     * Whether to treat data as right-handed.
     * This is used when serializing data from a right-handed system, while running the context in a left-handed system, for example in glTF parsing.
     * Default is false.
     */
    public treatDataAsRightHanded = false;

    private _enableLogging = false;

    /**
     * The logger used by the context to log actions.
     */
    public logger: Nullable<FlowGraphLogger>;

    /**
     * Enable logging on this context
     */
    public get enableLogging() {
        return this._enableLogging;
    }

    public set enableLogging(value: boolean) {
        if (this._enableLogging === value) {
            return;
        }
        this._enableLogging = value;
        if (this._enableLogging) {
            this.logger = new FlowGraphLogger();
            this.logger.logToConsole = true;
        } else {
            this.logger = null;
        }
    }

    constructor(params: IFlowGraphContextConfiguration) {
        this._configuration = params;
        this.assetsContext = params.assetsContext ?? params.scene;
    }

    /**
     * Check if a user-defined variable is defined.
     * @param name the name of the variable
     * @returns true if the variable is defined
     */
    public hasVariable(name: string) {
        return name in this._userVariables;
    }

    /**
     * Set a user-defined variable.
     * @param name the name of the variable
     * @param value the value of the variable
     */
    public setVariable(name: string, value: any) {
        this._userVariables[name] = value;
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.ContextVariableSet,
            payload: {
                name,
                value,
            },
        });
    }

    /**
     * Get an assets from the assets context based on its type and index in the array
     * @param type The type of the asset
     * @param index The index of the asset
     * @returns The asset or null if not found
     */
    public getAsset<T extends FlowGraphAssetType>(type: T, index: number): Nullable<AssetType<T>> {
        return GetFlowGraphAssetWithType(this.assetsContext, type, index);
    }

    /**
     * Get a user-defined variable.
     * @param name the name of the variable
     * @returns the value of the variable
     */
    public getVariable(name: string): any {
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.ContextVariableGet,
            payload: {
                name,
                value: this._userVariables[name],
            },
        });
        return this._userVariables[name];
    }

    /**
     * Gets all user variables map
     */
    public get userVariables() {
        return this._userVariables;
    }

    /**
     * Get the scene that the context belongs to.
     * @returns the scene
     */
    public getScene() {
        return this._configuration.scene;
    }

    private _getUniqueIdPrefixedName(obj: FlowGraphBlock, name: string): string {
        return `${obj.uniqueId}_${name}`;
    }

    /**
     * @internal
     * @param name name of the variable
     * @param defaultValue default value to return if the variable is not defined
     * @returns the variable value or the default value if the variable is not defined
     */
    public _getGlobalContextVariable<T>(name: string, defaultValue: T): T {
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.GlobalVariableGet,
            payload: {
                name,
                defaultValue,
                possibleValue: this._globalContextVariables[name],
            },
        });
        if (this._hasGlobalContextVariable(name)) {
            return this._globalContextVariables[name];
        } else {
            return defaultValue;
        }
    }

    /**
     * Set a global context variable
     * @internal
     * @param name the name of the variable
     * @param value the value of the variable
     */
    public _setGlobalContextVariable<T>(name: string, value: T) {
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.GlobalVariableSet,
            payload: { name, value },
        });
        this._globalContextVariables[name] = value;
    }

    /**
     * Delete a global context variable
     * @internal
     * @param name the name of the variable
     */
    public _deleteGlobalContextVariable(name: string) {
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.GlobalVariableDelete,
            payload: { name },
        });
        delete this._globalContextVariables[name];
    }

    /**
     * Check if a global context variable is defined
     * @internal
     * @param name the name of the variable
     * @returns true if the variable is defined
     */
    public _hasGlobalContextVariable(name: string) {
        return name in this._globalContextVariables;
    }

    /**
     * Set an internal execution variable
     * @internal
     * @param name
     * @param value
     */
    public _setExecutionVariable(block: FlowGraphBlock, name: string, value: any) {
        this._executionVariables[this._getUniqueIdPrefixedName(block, name)] = value;
    }

    /**
     * Get an internal execution variable
     * @internal
     * @param name
     * @returns
     */
    public _getExecutionVariable<T>(block: FlowGraphBlock, name: string, defaultValue: T): T {
        if (this._hasExecutionVariable(block, name)) {
            return this._executionVariables[this._getUniqueIdPrefixedName(block, name)];
        } else {
            return defaultValue;
        }
    }

    /**
     * Delete an internal execution variable
     * @internal
     * @param block
     * @param name
     */
    public _deleteExecutionVariable(block: FlowGraphBlock, name: string) {
        delete this._executionVariables[this._getUniqueIdPrefixedName(block, name)];
    }

    /**
     * Check if an internal execution variable is defined
     * @internal
     * @param block
     * @param name
     * @returns
     */
    public _hasExecutionVariable(block: FlowGraphBlock, name: string) {
        return this._getUniqueIdPrefixedName(block, name) in this._executionVariables;
    }

    /**
     * Check if a connection value is defined
     * @internal
     * @param connectionPoint
     * @returns
     */
    public _hasConnectionValue(connectionPoint: FlowGraphDataConnection<any>) {
        return connectionPoint.uniqueId in this._connectionValues;
    }

    /**
     * Set a connection value
     * @internal
     * @param connectionPoint
     * @param value
     */
    public _setConnectionValue<T>(connectionPoint: FlowGraphDataConnection<T>, value: T) {
        this._connectionValues[connectionPoint.uniqueId] = value;
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.SetConnectionValue,
            payload: {
                connectionPointId: connectionPoint.uniqueId,
                value,
            },
        });
    }

    /**
     * Set a connection value by key
     * @internal
     * @param key the key of the connection value
     * @param value the value of the connection
     */
    public _setConnectionValueByKey<T>(key: string, value: T) {
        this._connectionValues[key] = value;
    }

    /**
     * Get a connection value
     * @internal
     * @param connectionPoint
     * @returns
     */
    public _getConnectionValue<T>(connectionPoint: FlowGraphDataConnection<T>): T {
        this.logger?.addLogItem({
            time: Date.now(),
            className: this.getClassName(),
            uniqueId: this.uniqueId,
            action: FlowGraphAction.GetConnectionValue,
            payload: {
                connectionPointId: connectionPoint.uniqueId,
                value: this._connectionValues[connectionPoint.uniqueId],
            },
        });
        return this._connectionValues[connectionPoint.uniqueId];
    }

    /**
     * Get the configuration
     * @internal
     * @param name
     * @param value
     */
    public get configuration() {
        return this._configuration;
    }

    /**
     * Check if there are any pending blocks in this context
     * @returns true if there are pending blocks
     */
    public get hasPendingBlocks() {
        return this._pendingBlocks.length > 0;
    }

    /**
     * Add a block to the list of blocks that have pending tasks.
     * @internal
     * @param block
     */
    public _addPendingBlock(block: FlowGraphAsyncExecutionBlock) {
        // check if block is already in the array
        if (this._pendingBlocks.includes(block)) {
            return;
        }
        this._pendingBlocks.push(block);
        // sort pending blocks by priority
        this._pendingBlocks.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Remove a block from the list of blocks that have pending tasks.
     * @internal
     * @param block
     */
    public _removePendingBlock(block: FlowGraphAsyncExecutionBlock) {
        const index = this._pendingBlocks.indexOf(block);
        if (index !== -1) {
            this._pendingBlocks.splice(index, 1);
        }
    }

    /**
     * Clear all pending blocks.
     * @internal
     */
    public _clearPendingBlocks() {
        for (const block of this._pendingBlocks) {
            block._cancelPendingTasks(this);
        }
        this._pendingBlocks.length = 0;
    }

    /**
     * @internal
     * Function that notifies the node executed observable
     * @param node
     */
    public _notifyExecuteNode(node: FlowGraphBlock) {
        this.onNodeExecutedObservable.notifyObservers(node);
        this.logger?.addLogItem({
            time: Date.now(),
            className: node.getClassName(),
            uniqueId: node.uniqueId,
            action: FlowGraphAction.ExecuteBlock,
        });
    }

    public _notifyOnTick(framePayload: IFlowGraphOnTickEventPayload) {
        // set the values as global variables
        this._setGlobalContextVariable("timeSinceStart", framePayload.timeSinceStart);
        this._setGlobalContextVariable("deltaTime", framePayload.deltaTime);
        // iterate the pending blocks and run each one's onFrame function
        for (const block of this._pendingBlocks) {
            block._executeOnTick?.(this);
        }
    }

    /**
     * @internal
     */
    public _increaseExecutionId() {
        this._executionId++;
    }
    /**
     * A monotonically increasing ID for each execution.
     * Incremented for every block executed.
     */
    public get executionId() {
        return this._executionId;
    }

    // ── Breakpoint API ─────────────────────────────────────────────────

    /**
     * Check whether the given block should break before executing.
     * Called by the signal connection infrastructure.
     * @internal
     * @param block the block about to execute
     * @param signal the signal that is triggering the execution
     * @returns true if execution should be paused (breakpoint hit)
     */
    public _shouldBreak(block: FlowGraphExecutionBlock, signal: FlowGraphSignalConnection): boolean {
        // If continue/step just resumed this specific block, let it through
        if (this._skipBreakpointForBlockId === block.uniqueId) {
            this._skipBreakpointForBlockId = null;
            return false;
        }

        // If already paused on a breakpoint, silently block further execution
        // without overwriting the pending activation or re-notifying observers.
        if (this._pendingActivation) {
            return true;
        }

        if (this._stepMode) {
            this._stepMode = false;
            this._pendingActivation = { block, context: this, signal };
            this.onBreakpointHitObservable.notifyObservers(this._pendingActivation);
            return true;
        }
        if (this.breakpointPredicate && this.breakpointPredicate(block)) {
            this._pendingActivation = { block, context: this, signal };
            this.onBreakpointHitObservable.notifyObservers(this._pendingActivation);
            return true;
        }
        return false;
    }

    /**
     * Returns the currently paused activation, or null if not paused.
     */
    public get pendingActivation(): Nullable<IFlowGraphPendingActivation> {
        return this._pendingActivation;
    }

    /**
     * Resume execution from a breakpoint hit.
     * The paused block and all downstream blocks will execute normally until
     * the next breakpoint (if any) is hit.
     */
    public continueExecution(): void {
        const pending = this._pendingActivation;
        if (!pending) {
            return;
        }
        this._pendingActivation = null;
        // Tell _shouldBreak to skip the breakpoint for this block on re-entry
        this._skipBreakpointForBlockId = pending.block.uniqueId;
        pending.signal._activateSignal(this);
        // Clear in case no re-entry happened (shouldn't linger)
        this._skipBreakpointForBlockId = null;
    }

    /**
     * Execute exactly the paused block and then pause again before the next
     * execution block fires. If no activation is pending, this is a no-op.
     */
    public stepExecution(): void {
        const pending = this._pendingActivation;
        if (!pending) {
            return;
        }
        this._pendingActivation = null;
        // Enable step mode so the very next input-signal activation will pause
        this._stepMode = true;
        // Tell _shouldBreak to skip the breakpoint for this block on re-entry
        this._skipBreakpointForBlockId = pending.block.uniqueId;
        pending.signal._activateSignal(this);
        // If nothing further executed (end of chain), clear step mode
        this._stepMode = false;
        this._skipBreakpointForBlockId = null;
    }

    /**
     * Discard any pending breakpoint activation without resuming.
     * Used when stopping or resetting the graph.
     * @internal
     */
    public _clearPendingActivation(): void {
        this._pendingActivation = null;
        this._stepMode = false;
        this._skipBreakpointForBlockId = null;
    }

    /**
     * Serializes a context
     * @param serializationObject the object to write the values in
     * @param valueSerializationFunction a function to serialize complex values
     */
    public serialize(serializationObject: any = {}, valueSerializationFunction: (key: string, value: any, serializationObject: any) => void = defaultValueSerializationFunction) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject._userVariables = {};
        for (const key in this._userVariables) {
            valueSerializationFunction(key, this._userVariables[key], serializationObject._userVariables);
        }
        serializationObject._connectionValues = {};
        for (const key in this._connectionValues) {
            valueSerializationFunction(key, this._connectionValues[key], serializationObject._connectionValues);
        }
        // serialize assets context, if not scene
        if (this.assetsContext !== this.getScene()) {
            serializationObject._assetsContext = {
                meshes: this.assetsContext.meshes.map((m) => m.id),
                materials: this.assetsContext.materials.map((m) => m.id),
                textures: this.assetsContext.textures.map((m) => m.name),
                animations: this.assetsContext.animations.map((m) => m.name),
                lights: this.assetsContext.lights.map((m) => m.id),
                cameras: this.assetsContext.cameras.map((m) => m.id),
                sounds: this.assetsContext.sounds?.map((m) => m.name),
                skeletons: this.assetsContext.skeletons.map((m) => m.id),
                particleSystems: this.assetsContext.particleSystems.map((m) => m.name),
                geometries: this.assetsContext.geometries.map((m) => m.id),
                multiMaterials: this.assetsContext.multiMaterials.map((m) => m.id),
                transformNodes: this.assetsContext.transformNodes.map((m) => m.id),
            };
        }
    }

    /**
     * @returns the class name of the object.
     */
    public getClassName() {
        return "FlowGraphContext";
    }
}

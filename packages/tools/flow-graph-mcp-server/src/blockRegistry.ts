/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Complete registry of all Flow Graph block types available in Babylon.js.
 * Each entry describes the block's className, category, and its signal/data connections.
 *
 * This is a static catalog — the MCP server has **no Babylon.js runtime dependency**.
 */

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Describes a signal connection point (execution flow) on a block.
 */
export interface ISignalConnectionInfo {
    /** Name of the signal connection (e.g. "in", "out", "onTrue") */
    name: string;
    /** Brief description of what the signal does */
    description?: string;
}

/**
 * Describes a data connection point on a block.
 */
export interface IDataConnectionInfo {
    /** Name of the data connection (e.g. "message", "condition") */
    name: string;
    /** The rich type name (e.g. "any", "number", "boolean", "Vector3") */
    type: string;
    /** Whether this connection is optional */
    isOptional?: boolean;
    /** Brief description */
    description?: string;
}

/**
 * Describes a block type in the Flow Graph catalog.
 */
export interface IFlowGraphBlockTypeInfo {
    /** The serialized class name (e.g. "FlowGraphBranchBlock") */
    className: string;
    /** Category for grouping */
    category: "Event" | "Execution" | "ControlFlow" | "Animation" | "Data" | "Math" | "Vector" | "Matrix" | "Combine" | "Extract" | "Conversion" | "Utility";
    /** Human-readable description */
    description: string;
    /** Signal input connection points */
    signalInputs: ISignalConnectionInfo[];
    /** Signal output connection points */
    signalOutputs: ISignalConnectionInfo[];
    /** Data input connection points */
    dataInputs: IDataConnectionInfo[];
    /** Data output connection points */
    dataOutputs: IDataConnectionInfo[];
    /** Configurable properties (config object keys) */
    config?: Record<string, string>;
}

// ─── Block Registry ───────────────────────────────────────────────────────

export const FlowGraphBlockRegistry: Record<string, IFlowGraphBlockTypeInfo> = {
    // ═══════════════════════════════════════════════════════════════════
    //  EVENT BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    SceneReadyEvent: {
        className: "FlowGraphSceneReadyEventBlock",
        category: "Event",
        description: "Triggers when the scene is ready (all assets loaded). This is the most common entry point for a flow graph.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (use for initialization logic)" },
            { name: "done", description: "Fires when the event actually triggers (scene ready). USE THIS for event-driven logic." },
            { name: "error", description: "Fires on error" },
        ],
        dataInputs: [],
        dataOutputs: [
            {
                name: "event",
                type: "string",
                description: "KHR_interactivity event reference for this lifecycle event (stable string ref usable with ref/extractProperty and event equality)",
            },
        ],
    },

    SceneTickEvent: {
        className: "FlowGraphSceneTickEventBlock",
        category: "Event",
        description: "Triggers every frame (scene render loop). Provides elapsed time and delta time.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires every frame when the tick event occurs. USE THIS for per-frame logic." },
            { name: "error", description: "Fires on error" },
        ],
        dataInputs: [],
        dataOutputs: [
            { name: "timeSinceStart", type: "number", description: "Total time since the scene started (seconds)" },
            { name: "deltaTime", type: "number", description: "Time since last frame (seconds)" },
            {
                name: "event",
                type: "string",
                description: "KHR_interactivity event reference for this lifecycle event (stable string ref usable with ref/extractProperty and event equality)",
            },
        ],
    },

    MeshPickEvent: {
        className: "FlowGraphMeshPickEventBlock",
        category: "Event",
        description: "Triggers when a mesh is picked (clicked) by the user.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization). NOT on each pick." },
            { name: "done", description: "Fires each time the mesh is picked. USE THIS to react to clicks." },
            { name: "error" },
        ],
        dataInputs: [
            { name: "asset", type: "any", description: "The target mesh to listen for picks on", isOptional: true },
            { name: "pointerType", type: "any", description: "PointerEventTypes filter (default: POINTERPICK)", isOptional: true },
        ],
        dataOutputs: [
            { name: "pickedPoint", type: "Vector3", description: "World-space pick point" },
            { name: "pickOrigin", type: "Vector3", description: "Ray origin" },
            { name: "pointerId", type: "number", description: "Pointer identifier" },
            { name: "pickedMesh", type: "any", description: "The mesh that was picked" },
        ],
        config: {
            stopPropagation: "boolean — whether to stop event propagation",
            targetMesh: "AbstractMesh reference — default target mesh",
        },
    },

    PointerOverEvent: {
        className: "FlowGraphPointerOverEventBlock",
        category: "Event",
        description: "Triggers when the pointer moves over a mesh.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the pointer enters the mesh. USE THIS for hover logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "targetMesh", type: "any", description: "The mesh to watch", isOptional: true }],
        dataOutputs: [
            { name: "pointerId", type: "number" },
            { name: "meshUnderPointer", type: "any", description: "The mesh under the pointer" },
        ],
        config: { stopPropagation: "boolean", targetMesh: "AbstractMesh reference" },
    },

    PointerOutEvent: {
        className: "FlowGraphPointerOutEventBlock",
        category: "Event",
        description: "Triggers when the pointer moves off a mesh.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the pointer leaves the mesh. USE THIS for hover-out logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "targetMesh", type: "any", description: "The mesh to watch", isOptional: true }],
        dataOutputs: [
            { name: "pointerId", type: "number" },
            { name: "meshOutOfPointer", type: "any", description: "The mesh the pointer left" },
        ],
        config: { stopPropagation: "boolean", targetMesh: "AbstractMesh reference" },
    },

    // NOTE: PointerEvent is defined in FlowGraphBlockNames but has no standalone implementation;
    // use MeshPickEvent or the specific pointer event blocks below.

    PointerDownEvent: {
        className: "FlowGraphPointerDownEventBlock",
        category: "Event",
        description: "Triggers when a pointer button is pressed down on a mesh.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the pointer is pressed. USE THIS for press logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "targetMesh", type: "any", description: "The mesh to watch", isOptional: true }],
        dataOutputs: [
            { name: "pointerId", type: "number" },
            { name: "pickedMesh", type: "any", description: "The mesh that was pressed" },
            { name: "pickedPoint", type: "any", description: "The 3D point where the press occurred" },
        ],
        config: { stopPropagation: "boolean", targetMesh: "AbstractMesh reference" },
    },

    PointerUpEvent: {
        className: "FlowGraphPointerUpEventBlock",
        category: "Event",
        description: "Triggers when a pointer button is released on a mesh.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the pointer is released. USE THIS for release logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "targetMesh", type: "any", description: "The mesh to watch", isOptional: true }],
        dataOutputs: [
            { name: "pointerId", type: "number" },
            { name: "pickedMesh", type: "any", description: "The mesh that was released" },
            { name: "pickedPoint", type: "any", description: "The 3D point where the release occurred" },
        ],
        config: { stopPropagation: "boolean", targetMesh: "AbstractMesh reference" },
    },

    PointerMoveEvent: {
        className: "FlowGraphPointerMoveEventBlock",
        category: "Event",
        description: "Triggers when the pointer moves over a mesh.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the pointer moves. USE THIS for move logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "targetMesh", type: "any", description: "The mesh to watch", isOptional: true }],
        dataOutputs: [
            { name: "pointerId", type: "number" },
            { name: "meshUnderPointer", type: "any", description: "The mesh under the pointer" },
            { name: "pickedPoint", type: "any", description: "The 3D point under the pointer" },
        ],
        config: { stopPropagation: "boolean", targetMesh: "AbstractMesh reference" },
    },

    KeyDownEvent: {
        className: "FlowGraphKeyDownEventBlock",
        category: "Event",
        description: "Triggers when a keyboard key is pressed down. Can optionally ignore auto-repeat events.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the matching key-down event occurs. USE THIS for keyboard logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "key", type: "string", description: "KeyboardEvent.code value to match, such as KeyA or Space. Leave empty for any key.", isOptional: true }],
        dataOutputs: [
            { name: "keyCode", type: "string", description: "KeyboardEvent.code for the pressed key" },
            { name: "keyValue", type: "string", description: "KeyboardEvent.key for the pressed key" },
            { name: "shiftKey", type: "boolean", description: "Whether Shift was held" },
            { name: "ctrlKey", type: "boolean", description: "Whether Ctrl was held" },
            { name: "altKey", type: "boolean", description: "Whether Alt/Option was held" },
            { name: "metaKey", type: "boolean", description: "Whether Meta/Cmd/Windows key was held" },
            { name: "commandOrCtrl", type: "boolean", description: "Whether the platform command modifier was held" },
            { name: "isRepeat", type: "boolean", description: "True when this key-down event is an auto-repeat event" },
        ],
        config: {
            stopPropagation: "boolean — whether to stop event propagation",
            ignoreRepeat: "boolean — when true, ignores auto-repeat key-down events",
        },
    },

    KeyUpEvent: {
        className: "FlowGraphKeyUpEventBlock",
        category: "Event",
        description: "Triggers when a keyboard key is released.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the matching key-up event occurs. USE THIS for keyboard logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "key", type: "string", description: "KeyboardEvent.code value to match, such as KeyA or Space. Leave empty for any key.", isOptional: true }],
        dataOutputs: [
            { name: "keyCode", type: "string", description: "KeyboardEvent.code for the released key" },
            { name: "keyValue", type: "string", description: "KeyboardEvent.key for the released key" },
            { name: "shiftKey", type: "boolean", description: "Whether Shift was held" },
            { name: "ctrlKey", type: "boolean", description: "Whether Ctrl was held" },
            { name: "altKey", type: "boolean", description: "Whether Alt/Option was held" },
            { name: "metaKey", type: "boolean", description: "Whether Meta/Cmd/Windows key was held" },
            { name: "commandOrCtrl", type: "boolean", description: "Whether the platform command modifier was held" },
        ],
        config: { stopPropagation: "boolean — whether to stop event propagation" },
    },

    PhysicsCollisionEvent: {
        className: "FlowGraphPhysicsCollisionEventBlock",
        category: "Event",
        description: "Triggers when a physics body collides with another body.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time a collision occurs. USE THIS for collision logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "body", type: "any", description: "The PhysicsBody to watch for collisions" }],
        dataOutputs: [
            { name: "otherBody", type: "any", description: "The other body in the collision" },
            { name: "point", type: "Vector3", description: "Collision contact point" },
            { name: "normal", type: "Vector3", description: "Collision normal" },
            { name: "impulse", type: "number", description: "Collision impulse magnitude" },
            { name: "distance", type: "number", description: "Penetration distance" },
        ],
    },

    AudioSoundEndedEvent: {
        className: "FlowGraphSoundEndedEventBlock",
        category: "Event",
        description: "Triggers when a sound finishes playing.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the sound ends. USE THIS for sound-ended logic." },
            { name: "error" },
        ],
        dataInputs: [{ name: "sound", type: "any", description: "The sound to watch" }],
        dataOutputs: [],
    },

    SendCustomEvent: {
        className: "FlowGraphSendCustomEventBlock",
        category: "Event",
        description: "Sends a custom event that can be received by ReceiveCustomEvent blocks. Execution block with signal flow.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [],
        dataOutputs: [],
        config: {
            eventId: "string — the custom event identifier",
            eventData: "Record<string, { type: RichType }> — dynamic data inputs are created from this",
        },
    },

    ReceiveCustomEvent: {
        className: "FlowGraphReceiveCustomEventBlock",
        category: "Event",
        description: "Receives a custom event sent by SendCustomEvent blocks. Creates dynamic data outputs from eventData config.",
        signalInputs: [],
        signalOutputs: [
            { name: "out", description: "Fires once at graph startup (initialization)" },
            { name: "done", description: "Fires each time the custom event is received. USE THIS for event handling." },
            { name: "error" },
        ],
        dataInputs: [],
        dataOutputs: [
            {
                name: "event",
                type: "string",
                description: "KHR_interactivity event reference for the received custom event (stable string ref usable with ref/extractProperty and event equality)",
            },
        ],
        config: {
            eventId: "string — must match the sender's eventId",
            eventData: "Record<string, { type: RichType }> — dynamic data outputs are created from this",
        },
    },

    StopEventPropagation: {
        className: "FlowGraphStopEventPropagationBlock",
        category: "Event",
        description:
            "Stops propagation of an in-flight custom event (KHR_interactivity event/stopPropagation). Skips the remaining handler nodes of the currently-dispatching event referenced by the `event` input.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "event", type: "string", description: "Event reference (from an event block's `event` output) whose propagation should be stopped" },
            { name: "stopImmediate", type: "boolean", description: "Also stop remaining immediate handlers (default: false)", isOptional: true },
        ],
        dataOutputs: [],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  EXECUTION BLOCKS — General
    // ═══════════════════════════════════════════════════════════════════

    ConsoleLog: {
        className: "FlowGraphConsoleLogBlock",
        category: "Execution",
        description: "Logs a message to the browser console. Supports template strings with {placeholder} syntax.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "message", type: "any", description: "The message to log" },
            { name: "logType", type: "any", description: 'Log level: "log", "warn", or "error"', isOptional: true },
        ],
        dataOutputs: [],
        config: { messageTemplate: "string — template with {placeholder} names that become additional data inputs" },
    },

    SetProperty: {
        className: "FlowGraphSetPropertyBlock",
        category: "Execution",
        description: "Sets a property on a scene object (e.g. mesh.position, light.intensity). Generic and powerful.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "object", type: "any", description: "The target object (mesh, light, camera, etc.)" },
            { name: "value", type: "any", description: "The value to set" },
            { name: "propertyName", type: "any", description: "The property path (e.g. 'position', 'intensity')", isOptional: true },
            { name: "customSetFunction", type: "any", description: "Custom setter function", isOptional: true },
        ],
        dataOutputs: [],
        config: {
            propertyName: "string — the property name to set",
            target: "any — default target object",
        },
    },

    SetVariable: {
        className: "FlowGraphSetVariableBlock",
        category: "Execution",
        description: "Sets a context variable that can be read by GetVariable blocks. Variables persist across executions.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "value", type: "any", description: "The value to store in the variable" }],
        dataOutputs: [],
        config: {
            variable: "string — the variable name to set (mutually exclusive with 'variables')",
            variables: "string[] — multiple variable names to set (creates one input per name)",
        },
    },

    // ═══════════════════════════════════════════════════════════════════
    //  CONTROL FLOW BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    Branch: {
        className: "FlowGraphBranchBlock",
        category: "ControlFlow",
        description: "If/else branching. Routes execution to onTrue or onFalse based on a boolean condition.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "onTrue", description: "Fires when condition is true" }, { name: "onFalse", description: "Fires when condition is false" }, { name: "error" }],
        dataInputs: [{ name: "condition", type: "boolean", description: "The branching condition" }],
        dataOutputs: [],
    },

    ForLoop: {
        className: "FlowGraphForLoopBlock",
        category: "ControlFlow",
        description: "Executes a loop body for each index from startIndex to endIndex.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "executionFlow", description: "Fires for each iteration" }, { name: "completed", description: "Fires when the loop finishes" }, { name: "error" }],
        dataInputs: [
            { name: "startIndex", type: "any", description: "Loop start index (default 0)" },
            { name: "endIndex", type: "any", description: "Loop end index (exclusive)" },
            { name: "step", type: "number", description: "Step increment (default 1)", isOptional: true },
        ],
        dataOutputs: [{ name: "index", type: "FlowGraphInteger", description: "Current loop index" }],
        config: {
            initialIndex: "number — initial index override",
            incrementIndexWhenLoopDone: "boolean — whether to increment the index when the loop is done",
        },
    },

    WhileLoop: {
        className: "FlowGraphWhileLoopBlock",
        category: "ControlFlow",
        description: "Executes the loop body while the condition is true.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "executionFlow", description: "Fires for each iteration" }, { name: "completed", description: "Fires when the loop exits" }, { name: "error" }],
        dataInputs: [{ name: "condition", type: "boolean", description: "Loop condition — continues while true" }],
        dataOutputs: [],
        config: { doWhile: "boolean — if true, executes the body at least once before checking the condition" },
    },

    Sequence: {
        className: "FlowGraphSequenceBlock",
        category: "ControlFlow",
        description: "Executes multiple output signals in order (out_0, out_1, ...). Like a sequential pipeline.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "error" }],
        dataInputs: [],
        dataOutputs: [],
        config: { outputSignalCount: "number — how many sequential outputs to create (default 1). Creates out_0, out_1, ..." },
    },

    Switch: {
        className: "FlowGraphSwitchBlock",
        category: "ControlFlow",
        description: "Routes execution based on a case value. Like a switch/case statement with a default.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "default", description: "Fires when no case matches" }, { name: "error" }],
        dataInputs: [{ name: "case", type: "any", description: "The value to switch on" }],
        dataOutputs: [],
        config: { cases: "T[] — array of case values. Creates signal output 'out_{value}' for each case" },
    },

    MultiGate: {
        className: "FlowGraphMultiGateBlock",
        category: "ControlFlow",
        description: "Routes execution to one of N outputs each time it is triggered. Can be sequential, random, or looping.",
        signalInputs: [{ name: "in" }, { name: "reset", description: "Resets the gate index" }],
        signalOutputs: [{ name: "error" }],
        dataInputs: [],
        dataOutputs: [{ name: "lastIndex", type: "FlowGraphInteger", description: "Index of the last output fired" }],
        config: {
            outputSignalCount: "number — how many outputs to create (out_0, out_1, ...)",
            isRandom: "boolean — if true, picks outputs randomly",
            isLoop: "boolean — if true, loops back to the first output after the last",
        },
    },

    WaitAll: {
        className: "FlowGraphWaitAllBlock",
        category: "ControlFlow",
        description: "Waits for all N signal inputs to fire before triggering the output. Useful for synchronization.",
        signalInputs: [{ name: "reset", description: "Resets all input states" }],
        signalOutputs: [{ name: "out", description: "Fires when all inputs have triggered" }, { name: "completed" }, { name: "error" }],
        dataInputs: [],
        dataOutputs: [{ name: "remainingInputs", type: "FlowGraphInteger", description: "How many inputs are still pending" }],
        config: { inputSignalCount: "number — how many signal inputs to create (in_0, in_1, ...)" },
    },

    SetDelay: {
        className: "FlowGraphSetDelayBlock",
        category: "ControlFlow",
        description: "Triggers the 'done' signal after a specified duration (in seconds). The 'out' signal fires immediately.",
        signalInputs: [{ name: "in" }, { name: "cancel", description: "Cancels the pending delay" }],
        signalOutputs: [{ name: "out", description: "Fires immediately" }, { name: "done", description: "Fires after the delay" }, { name: "error" }],
        dataInputs: [{ name: "duration", type: "number", description: "Delay duration in seconds" }],
        dataOutputs: [{ name: "lastDelayIndex", type: "FlowGraphInteger", description: "Index of the last delay set" }],
    },

    CancelDelay: {
        className: "FlowGraphCancelDelayBlock",
        category: "ControlFlow",
        description: "Cancels a pending delay created by SetDelay.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "delayIndex", type: "FlowGraphInteger", description: "Index of the delay to cancel" }],
        dataOutputs: [],
    },

    CallCounter: {
        className: "FlowGraphCallCounterBlock",
        category: "ControlFlow",
        description: "Counts how many times it has been triggered. Can be reset.",
        signalInputs: [{ name: "in" }, { name: "reset", description: "Resets the counter to 0" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [],
        dataOutputs: [{ name: "count", type: "number", description: "Current call count" }],
    },

    Debounce: {
        className: "FlowGraphDebounceBlock",
        category: "ControlFlow",
        description: "Only fires the output after the input has been triggered N times (debounce count). Then resets.",
        signalInputs: [{ name: "in" }, { name: "reset", description: "Resets the debounce counter" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "count", type: "number", description: "Number of triggers before firing" }],
        dataOutputs: [{ name: "currentCount", type: "number", description: "Current trigger count" }],
    },

    Throttle: {
        className: "FlowGraphThrottleBlock",
        category: "ControlFlow",
        description: "Limits execution to at most once per duration period (in seconds).",
        signalInputs: [{ name: "in" }, { name: "reset", description: "Resets the throttle timer" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "duration", type: "number", description: "Minimum time between executions (seconds)" }],
        dataOutputs: [{ name: "lastRemainingTime", type: "number", description: "Time remaining until next allowed execution" }],
    },

    DoN: {
        className: "FlowGraphDoNBlock",
        category: "ControlFlow",
        description: "Fires the output only the first N times it is triggered, then stops. Can be reset.",
        signalInputs: [{ name: "in" }, { name: "reset", description: "Resets the execution counter" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "maxExecutions", type: "FlowGraphInteger", description: "Maximum number of times to fire" }],
        dataOutputs: [{ name: "executionCount", type: "FlowGraphInteger", description: "How many times it has fired" }],
        config: { startIndex: "FlowGraphInteger — initial count value" },
    },

    FlipFlop: {
        className: "FlowGraphFlipFlopBlock",
        category: "ControlFlow",
        description: "Alternates between onOn and onOff signals each time it is triggered. Like a toggle switch.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "onOn", description: "Fires on odd triggers" }, { name: "onOff", description: "Fires on even triggers" }, { name: "error" }],
        dataInputs: [],
        dataOutputs: [{ name: "value", type: "boolean", description: "Current toggle state" }],
        config: { startValue: "boolean — initial toggle state (default false)" },
    },

    // ═══════════════════════════════════════════════════════════════════
    //  ANIMATION BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    PlayAnimation: {
        className: "FlowGraphPlayAnimationBlock",
        category: "Animation",
        description: "Plays an animation or animation group. Provides current frame and event outputs.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [
            { name: "out", description: "Fires immediately when play starts" },
            { name: "done", description: "Fires when the animation finishes" },
            { name: "error" },
            { name: "animationLoopEvent", description: "Fires each time the animation loops" },
            { name: "animationEndEvent", description: "Fires when the animation ends" },
            { name: "animationGroupLoopEvent", description: "Fires when an animation group loops" },
        ],
        dataInputs: [
            { name: "speed", type: "number", description: "Playback speed (default 0)" },
            { name: "loop", type: "boolean", description: "Whether to loop (default false)" },
            { name: "from", type: "number", description: "Start frame (default 0)" },
            { name: "to", type: "number", description: "End frame (default 0 = full range)" },
            { name: "animationGroup", type: "any", description: "AnimationGroup to play" },
            { name: "animation", type: "any", description: "Animation or Animation[] to play", isOptional: true },
            { name: "object", type: "any", description: "Target object for the animation", isOptional: true },
        ],
        dataOutputs: [
            { name: "currentFrame", type: "number", description: "Current animation frame" },
            { name: "currentTime", type: "number", description: "Current animation time" },
            { name: "currentAnimationGroup", type: "any", description: "The active animation group" },
        ],
        config: { animationGroup: "AnimationGroup — default animation group" },
    },

    StopAnimation: {
        className: "FlowGraphStopAnimationBlock",
        category: "Animation",
        description: "Stops a playing animation group.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "done" }, { name: "error" }],
        dataInputs: [
            { name: "animationGroup", type: "any", description: "The animation group to stop" },
            { name: "stopAtFrame", type: "number", description: "Frame to stop at (-1 = current)", isOptional: true },
        ],
        dataOutputs: [],
    },

    PauseAnimation: {
        className: "FlowGraphPauseAnimationBlock",
        category: "Animation",
        description: "Pauses a playing animation group.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "animationToPause", type: "any", description: "The animation group to pause" }],
        dataOutputs: [],
    },

    ValueInterpolation: {
        className: "FlowGraphInterpolationBlock",
        category: "Animation",
        description: "Creates an Animation object from keyframe values. Use with PlayAnimation to animate properties. " + "Takes duration/value pairs for each keyframe.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "easingFunction", type: "any", description: "Optional easing function from Easing block", isOptional: true },
            { name: "propertyName", type: "any", description: "Property name(s) to animate", isOptional: true },
            { name: "customBuildAnimation", type: "any", description: "Custom animation builder function", isOptional: true },
        ],
        dataOutputs: [{ name: "animation", type: "any", description: "The generated Animation object" }],
        config: {
            keyFramesCount: "number — number of keyframes (creates duration_N and value_N inputs for each)",
            duration: "number — default duration per keyframe",
            propertyName: "string|string[] — property path(s) to animate",
            animationType: "number|FlowGraphTypes — type of animated value (e.g. BABYLON.Animation.ANIMATIONTYPE_VECTOR3)",
        },
    },

    Easing: {
        className: "FlowGraphEasingBlock",
        category: "Animation",
        description: "Creates an easing function for use with ValueInterpolation. Supports all Babylon.js easing types.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "type", type: "any", description: "EasingFunctionType enum value (default 11 = BezierCurve)" },
            { name: "mode", type: "number", description: "Easing mode: 0=EaseIn, 1=EaseOut, 2=EaseInOut" },
            { name: "parameters", type: "any", description: "Easing parameters as number array (default [1,0,0,1])", isOptional: true },
        ],
        dataOutputs: [{ name: "easingFunction", type: "any", description: "The easing function object" }],
    },

    BezierCurveEasing: {
        className: "FlowGraphBezierCurveEasing",
        category: "Animation",
        description: "Creates a bezier curve easing function with two control points.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "mode", type: "number", description: "Easing mode: 0=EaseIn, 1=EaseOut, 2=EaseInOut" },
            { name: "controlPoint1", type: "Vector2", description: "First control point" },
            { name: "controlPoint2", type: "Vector2", description: "Second control point" },
        ],
        dataOutputs: [{ name: "easingFunction", type: "any", description: "The bezier easing function object" }],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  DATA BLOCKS — General
    // ═══════════════════════════════════════════════════════════════════

    Constant: {
        className: "FlowGraphConstantBlock",
        category: "Data",
        description: "Outputs a constant value. The type is deduced from the config value. Supports numbers, strings, booleans, vectors, colors, etc.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [{ name: "output", type: "any", description: "The constant value" }],
        config: { value: "any — the constant value (e.g. 42, 'hello', { value: [1,2,3], className: 'Vector3' })" },
    },

    GetVariable: {
        className: "FlowGraphGetVariableBlock",
        category: "Data",
        description: "Reads a context variable set by SetVariable. Variables persist across executions of the graph.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [{ name: "value", type: "any", description: "The variable's current value" }],
        config: {
            variable: "string — the variable name to read",
            initialValue: "any — default value if the variable hasn't been set",
        },
    },

    GetProperty: {
        className: "FlowGraphGetPropertyBlock",
        category: "Data",
        description: "Reads a property from a scene object (e.g. mesh.position, light.intensity).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "object", type: "any", description: "The target object" },
            { name: "propertyName", type: "any", description: "The property name to read", isOptional: true },
            { name: "customGetFunction", type: "any", description: "Custom getter function", isOptional: true },
        ],
        dataOutputs: [
            { name: "value", type: "any", description: "The property value" },
            { name: "isValid", type: "boolean", description: "Whether the property was found" },
        ],
        config: {
            propertyName: "string — property path to read",
            object: "any — default target object",
            resetToDefaultWhenUndefined: "boolean — reset to default when undefined",
        },
    },

    GetAsset: {
        className: "FlowGraphGetAssetBlock",
        category: "Data",
        description: "Retrieves an asset (mesh, material, texture, etc.) from the scene's asset context by type and index.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "type", type: "any", description: "FlowGraphAssetType — the kind of asset to retrieve" },
            { name: "index", type: "any", description: "Index of the asset in the collection", isOptional: true },
        ],
        dataOutputs: [{ name: "value", type: "any", description: "The retrieved asset" }],
        config: {
            type: "FlowGraphAssetType — asset type enum",
            index: "number — asset index in the collection",
            useIndexAsUniqueId: "boolean — whether to use index as uniqueId lookup",
        },
    },

    Conditional: {
        className: "FlowGraphConditionalBlock",
        category: "Data",
        description: "Ternary operator — returns onTrue if condition is true, onFalse otherwise. Pure data block (no signals).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "condition", type: "boolean", description: "The condition to evaluate" },
            { name: "onTrue", type: "any", description: "Value returned when condition is true" },
            { name: "onFalse", type: "any", description: "Value returned when condition is false" },
        ],
        dataOutputs: [{ name: "output", type: "any", description: "The selected value" }],
    },

    TransformCoordinatesSystem: {
        className: "FlowGraphTransformCoordinatesSystemBlock",
        category: "Data",
        description: "Transforms coordinates from one coordinate system to another using two TransformNodes.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "sourceSystem", type: "any", description: "Source TransformNode" },
            { name: "destinationSystem", type: "any", description: "Destination TransformNode" },
            { name: "inputCoordinates", type: "Vector3", description: "Coordinates to transform" },
        ],
        dataOutputs: [{ name: "outputCoordinates", type: "Vector3", description: "Transformed coordinates" }],
    },

    JsonPointerParser: {
        className: "FlowGraphJsonPointerParserBlock",
        category: "Data",
        description: "Resolves a JSON pointer path to an object and property. Used internally for glTF interop.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [
            { name: "value", type: "any" },
            { name: "isValid", type: "boolean" },
            { name: "object", type: "any" },
            { name: "propertyName", type: "any" },
            { name: "setFunction", type: "any", description: "Setter function for the resolved property (used internally by interpolation/animation)" },
            { name: "getFunction", type: "any", description: "Getter function for the resolved property" },
            { name: "generateAnimationsFunction", type: "any", description: "Builds animation property info for the resolved property" },
        ],
        config: { jsonPointer: "string — the JSON pointer path" },
    },

    DataSwitch: {
        className: "FlowGraphDataSwitchBlock",
        category: "Data",
        description: "Selects a data value based on a case. Like a data-only switch/case.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "case", type: "any", description: "The case value to match" },
            { name: "default", type: "any", description: "Default value if no case matches" },
        ],
        dataOutputs: [{ name: "value", type: "any", description: "The selected value" }],
        config: {
            cases: "number[] — case values. Creates data input 'in_{value}' for each case",
            treatCasesAsIntegers: "boolean — whether to treat case values as integers",
        },
    },

    // ═══════════════════════════════════════════════════════════════════
    //  UTILITY DATA BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    Context: {
        className: "FlowGraphContextBlock",
        category: "Utility",
        description: "Provides access to the flow graph execution context (user variables, execution ID).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [
            { name: "userVariables", type: "any", description: "All user variables as a dictionary" },
            { name: "executionId", type: "number", description: "Current execution ID" },
        ],
    },

    IsKeyPressed: {
        className: "FlowGraphIsKeyPressedBlock",
        category: "Utility",
        description: "Outputs whether a keyboard key is currently held down, optionally requiring modifier keys.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "key", type: "string", description: "KeyboardEvent.code value to check, such as KeyA, Space, ShiftLeft, or ControlLeft" },
            { name: "withShift", type: "boolean", description: "Require Shift to also be held", isOptional: true },
            { name: "withCtrl", type: "boolean", description: "Require Ctrl to also be held", isOptional: true },
            { name: "withAlt", type: "boolean", description: "Require Alt/Option to also be held", isOptional: true },
            { name: "withMeta", type: "boolean", description: "Require Meta/Cmd/Windows key to also be held", isOptional: true },
            { name: "withCommandOrCtrl", type: "boolean", description: "Require Cmd on macOS or Ctrl on Windows/Linux", isOptional: true },
        ],
        dataOutputs: [{ name: "isPressed", type: "boolean", description: "True when the requested key and modifiers are currently held" }],
    },

    ArrayIndex: {
        className: "FlowGraphArrayIndexBlock",
        category: "Utility",
        description: "Retrieves an element from an array by index.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "array", type: "any", description: "The source array" },
            { name: "index", type: "any", description: "The index to retrieve" },
        ],
        dataOutputs: [{ name: "value", type: "any", description: "The element at the specified index" }],
    },

    IndexOf: {
        className: "FlowGraphIndexOfBlock",
        category: "Utility",
        description: "Finds the index of an element in an array.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "object", type: "any", description: "The element to search for" },
            { name: "array", type: "any", description: "The array to search in" },
        ],
        dataOutputs: [{ name: "index", type: "FlowGraphInteger", description: "The index of the element (-1 if not found)" }],
    },

    CodeExecution: {
        className: "FlowGraphCodeExecutionBlock",
        category: "Utility",
        description:
            "Executes an arbitrary JavaScript function inside the flow graph — the 'escape hatch' for any logic " +
            "not covered by dedicated blocks. This is a DATA block (no signal inputs/outputs); it evaluates " +
            "lazily when its 'result' output is read by a downstream block. " +
            "The function signature is: (value: any, context: FlowGraphContext) => any. " +
            "The 'value' input can carry any data (a mesh, a number, an object with multiple fields, etc.), " +
            "and 'context' is the FlowGraphContext giving access to the scene via context.assetsContext. " +
            "Use the FunctionReference block to create the function from an object + method name, " +
            "or provide the function via the scene's glue code / code generator. " +
            "Common use cases: physics (applyImpulse, setLinearVelocity), mesh cloning (mesh.clone), " +
            "reading/writing complex properties, invoking any Babylon.js API not exposed as a dedicated block.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            {
                name: "function",
                type: "any",
                description:
                    "A CodeExecutionFunction: (value, context) => result. " +
                    "Can come from a FunctionReference block or be set in glue code. " +
                    "For physics impulse example: (v, ctx) => { v.mesh.physicsBody.applyImpulse(v.impulse, v.point); return true; }",
            },
            {
                name: "value",
                type: "any",
                description: "The input value passed as the first argument to the function. " + "Can be any type — a mesh, a Vector3, or a composite object with multiple fields.",
            },
        ],
        dataOutputs: [{ name: "result", type: "any", description: "The return value of the function" }],
    },

    FunctionReference: {
        className: "FlowGraphFunctionReference",
        category: "Utility",
        description:
            "Creates a callable function reference. Two modes of use:\n" +
            "MODE A — Object method lookup: connect 'functionName' and 'object' data inputs. " +
            "The block does object[functionName].bind(context) and outputs the bound function.\n" +
            "MODE B — Inline code (config.code): put arbitrary JavaScript in config.code. " +
            "The code generator will compile it into a real function and inject it at runtime. " +
            "Leave 'functionName' and 'object' data inputs UNCONNECTED when using Mode B. " +
            "The code has access to 'scene' (the Babylon.js scene) and 'BABYLON' (the namespace). " +
            "The function signature is (value, fgContext) => result. Return a value if needed.\n" +
            "Connect the 'output' to a CodeExecution block's 'function' input. " +
            "This is a DATA block — it evaluates lazily when its output is read.",
        signalInputs: [],
        signalOutputs: [],
        config: {
            code:
                "string — Optional. Arbitrary JavaScript code compiled into a function by the code generator. " +
                "Has access to 'scene' (via closure) and any BABYLON API. " +
                "Example: const ball = scene.getMeshByName('ball'); ball.physicsBody.applyImpulse(...); return 1;",
        },
        dataInputs: [
            {
                name: "functionName",
                type: "string",
                description: "Dot-separated path to the method on the object (e.g. 'physicsBody.applyImpulse', 'clone'). " + "Leave unconnected when using config.code.",
            },
            { name: "object", type: "any", description: "The object containing the function (e.g. a mesh from GetAsset). Leave unconnected when using config.code." },
            { name: "context", type: "any", description: "Optional 'this' context for the function call", isOptional: true },
        ],
        dataOutputs: [{ name: "output", type: "any", description: "The bound function reference, ready to be called or connected to CodeExecution" }],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  MATH BLOCKS — Constants
    // ═══════════════════════════════════════════════════════════════════

    E: {
        className: "FlowGraphEBlock",
        category: "Math",
        description: "Outputs the mathematical constant e (≈ 2.718).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    PI: {
        className: "FlowGraphPIBlock",
        category: "Math",
        description: "Outputs the mathematical constant π (≈ 3.14159).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    Inf: {
        className: "FlowGraphInfBlock",
        category: "Math",
        description: "Outputs positive infinity.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    NaN: {
        className: "FlowGraphNaNBlock",
        category: "Math",
        description: "Outputs NaN (Not a Number).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    Random: {
        className: "FlowGraphRandomBlock",
        category: "Math",
        description: "Outputs a random number between min and max.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "min", type: "number", description: "Minimum value (default 0)", isOptional: true },
            { name: "max", type: "number", description: "Maximum value (default 1)", isOptional: true },
        ],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
        config: { min: "number", max: "number", seed: "number — random seed for deterministic results" },
    },

    // ═══════════════════════════════════════════════════════════════════
    //  MATH BLOCKS — Arithmetic (Unary)
    // ═══════════════════════════════════════════════════════════════════

    ...makeUnaryMathBlock("Abs", "FlowGraphAbsBlock", "Absolute value of the input."),
    ...makeUnaryMathBlock("Sign", "FlowGraphSignBlock", "Returns -1, 0, or 1 based on the sign of the input."),
    ...makeUnaryMathBlock("Trunc", "FlowGraphTruncBlock", "Truncates the input to an integer (removes decimal part)."),
    ...makeUnaryMathBlock("Floor", "FlowGraphFloorBlock", "Rounds the input down to the nearest integer."),
    ...makeUnaryMathBlock("Ceil", "FlowGraphCeilBlock", "Rounds the input up to the nearest integer."),
    ...makeUnaryMathBlock("Round", "FlowGraphRoundBlock", "Rounds the input to the nearest integer."),
    ...makeUnaryMathBlock("Fraction", "FlowGraphFractBlock", "Returns the fractional part of the input."),
    ...makeUnaryMathBlock("Negation", "FlowGraphNegationBlock", "Negates the input value."),
    ...makeUnaryMathBlock("Saturate", "FlowGraphSaturateBlock", "Clamps the input to the range [0, 1]."),

    // ─── Checks ───────────────────────────────────────────────────────
    ...makeUnaryMathBlock("IsNaN", "FlowGraphIsNaNBlock", "Returns true if the input is NaN.", "boolean"),
    ...makeUnaryMathBlock("IsInfinity", "FlowGraphIsInfBlock", "Returns true if the input is infinite.", "boolean"),

    // ─── Angle Conversion ─────────────────────────────────────────────
    ...makeUnaryMathBlock("DegToRad", "FlowGraphDegToRadBlock", "Converts degrees to radians."),
    ...makeUnaryMathBlock("RadToDeg", "FlowGraphRadToDegBlock", "Converts radians to degrees."),

    // ─── Trigonometry ─────────────────────────────────────────────────
    ...makeUnaryMathBlock("Sin", "FlowGraphSinBlock", "Sine of the input (in radians)."),
    ...makeUnaryMathBlock("Cos", "FlowGraphCosBlock", "Cosine of the input (in radians)."),
    ...makeUnaryMathBlock("Tan", "FlowGraphTanBlock", "Tangent of the input (in radians)."),
    ...makeUnaryMathBlock("Asin", "FlowGraphASinBlock", "Arcsine (inverse sine) of the input."),
    ...makeUnaryMathBlock("Acos", "FlowGraphACosBlock", "Arccosine (inverse cosine) of the input."),
    ...makeUnaryMathBlock("Atan", "FlowGraphATanBlock", "Arctangent (inverse tangent) of the input."),
    ...makeUnaryMathBlock("Sinh", "FlowGraphSinhBlock", "Hyperbolic sine."),
    ...makeUnaryMathBlock("Cosh", "FlowGraphCoshBlock", "Hyperbolic cosine."),
    ...makeUnaryMathBlock("Tanh", "FlowGraphTanhBlock", "Hyperbolic tangent."),
    ...makeUnaryMathBlock("Asinh", "FlowGraphASinhBlock", "Inverse hyperbolic sine."),
    ...makeUnaryMathBlock("Acosh", "FlowGraphACoshBlock", "Inverse hyperbolic cosine."),
    ...makeUnaryMathBlock("Atanh", "FlowGraphATanhBlock", "Inverse hyperbolic tangent."),

    // ─── Logarithmic & Power ──────────────────────────────────────────
    ...makeUnaryMathBlock("Exponential", "FlowGraphExponentialBlock", "e raised to the power of the input (e^x)."),
    ...makeUnaryMathBlock("Log", "FlowGraphLogBlock", "Natural logarithm (base e)."),
    ...makeUnaryMathBlock("Log2", "FlowGraphLog2Block", "Base-2 logarithm."),
    ...makeUnaryMathBlock("Log10", "FlowGraphLog10Block", "Base-10 logarithm."),
    ...makeUnaryMathBlock("SquareRoot", "FlowGraphSquareRootBlock", "Square root of the input."),
    ...makeUnaryMathBlock("CubeRoot", "FlowGraphCubeRootBlock", "Cube root of the input."),

    // ─── Bitwise Unary ────────────────────────────────────────────────
    ...makeUnaryMathBlock("BitwiseNot", "FlowGraphBitwiseNotBlock", "Bitwise NOT of the input.", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeUnaryMathBlock("LeadingZeros", "FlowGraphLeadingZerosBlock", "Count of leading zero bits.", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeUnaryMathBlock("TrailingZeros", "FlowGraphTrailingZerosBlock", "Count of trailing zero bits.", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeUnaryMathBlock("OneBitsCounter", "FlowGraphOneBitsCounterBlock", "Count of set (1) bits.", "FlowGraphInteger", "FlowGraphInteger"),

    // ═══════════════════════════════════════════════════════════════════
    //  MATH BLOCKS — Arithmetic (Binary)
    // ═══════════════════════════════════════════════════════════════════

    ...makeBinaryMathBlock("Add", "FlowGraphAddBlock", "Adds two values (a + b). Works with numbers, vectors, and matrices."),
    ...makeBinaryMathBlock("Subtract", "FlowGraphSubtractBlock", "Subtracts b from a (a - b)."),
    ...makeBinaryMathBlock("Multiply", "FlowGraphMultiplyBlock", "Multiplies two values (a * b)."),
    ...makeBinaryMathBlock("Divide", "FlowGraphDivideBlock", "Divides a by b (a / b)."),
    ...makeBinaryMathBlock("Modulo", "FlowGraphModuloBlock", "Remainder of a / b."),
    ...makeBinaryMathBlock("Min", "FlowGraphMinBlock", "Returns the smaller of a and b."),
    ...makeBinaryMathBlock("Max", "FlowGraphMaxBlock", "Returns the larger of a and b."),
    ...makeBinaryMathBlock("Power", "FlowGraphPowerBlock", "Raises a to the power of b (a^b)."),
    ...makeBinaryMathBlock("Atan2", "FlowGraphATan2Block", "Two-argument arctangent atan2(a, b)."),

    // ─── Comparison ───────────────────────────────────────────────────
    ...makeBinaryMathBlock("Equality", "FlowGraphEqualityBlock", "Returns true if a equals b.", "boolean"),
    ...makeBinaryMathBlock("LessThan", "FlowGraphLessThanBlock", "Returns true if a < b.", "boolean"),
    ...makeBinaryMathBlock("LessThanOrEqual", "FlowGraphLessThanOrEqualBlock", "Returns true if a <= b.", "boolean"),
    ...makeBinaryMathBlock("GreaterThan", "FlowGraphGreaterThanBlock", "Returns true if a > b.", "boolean"),
    ...makeBinaryMathBlock("GreaterThanOrEqual", "FlowGraphGreaterThanOrEqualBlock", "Returns true if a >= b.", "boolean"),

    // ─── Bitwise Binary ───────────────────────────────────────────────
    ...makeBinaryMathBlock("BitwiseAnd", "FlowGraphBitwiseAndBlock", "Bitwise AND.", "FlowGraphInteger", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeBinaryMathBlock("BitwiseOr", "FlowGraphBitwiseOrBlock", "Bitwise OR.", "FlowGraphInteger", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeBinaryMathBlock("BitwiseXor", "FlowGraphBitwiseXorBlock", "Bitwise XOR.", "FlowGraphInteger", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeBinaryMathBlock("BitwiseLeftShift", "FlowGraphBitwiseLeftShiftBlock", "Left bit shift.", "FlowGraphInteger", "FlowGraphInteger", "FlowGraphInteger"),
    ...makeBinaryMathBlock("BitwiseRightShift", "FlowGraphBitwiseRightShiftBlock", "Right bit shift.", "FlowGraphInteger", "FlowGraphInteger", "FlowGraphInteger"),

    // ─── Ternary Math ─────────────────────────────────────────────────
    Clamp: {
        className: "FlowGraphClampBlock",
        category: "Math",
        description: "Clamps value a between b (min) and c (max).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "any", description: "Value to clamp" },
            { name: "b", type: "any", description: "Minimum" },
            { name: "c", type: "any", description: "Maximum" },
        ],
        dataOutputs: [
            { name: "value", type: "any" },
            { name: "isValid", type: "boolean" },
        ],
    },

    MathInterpolation: {
        className: "FlowGraphMathInterpolationBlock",
        category: "Math",
        description: "Linear interpolation: lerp(a, b, c) — returns a + (b - a) * c.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "any", description: "Start value" },
            { name: "b", type: "any", description: "End value" },
            { name: "c", type: "any", description: "Interpolation factor (0-1)" },
        ],
        dataOutputs: [
            { name: "value", type: "any" },
            { name: "isValid", type: "boolean" },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  VECTOR / QUATERNION BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    ...makeUnaryMathBlock("Length", "FlowGraphLengthBlock", "Returns the length (magnitude) of a vector.", "number"),
    ...makeUnaryMathBlock("Normalize", "FlowGraphNormalizeBlock", "Returns a normalized (unit-length) version of the vector."),
    ...makeUnaryMathBlock("Conjugate", "FlowGraphConjugateBlock", "Returns the conjugate of a quaternion.", "Quaternion", "Quaternion"),

    Dot: {
        className: "FlowGraphDotBlock",
        category: "Vector",
        description: "Computes the dot product of two vectors.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "any", description: "First vector" },
            { name: "b", type: "any", description: "Second vector" },
        ],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    Cross: {
        className: "FlowGraphCrossBlock",
        category: "Vector",
        description: "Computes the cross product of two Vector3 values.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Vector3" },
            { name: "b", type: "Vector3" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    Rotate2D: {
        className: "FlowGraphRotate2DBlock",
        category: "Vector",
        description: "Rotates a 2D vector by an angle (in radians).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Vector2", description: "The vector to rotate" },
            { name: "b", type: "number", description: "Angle in radians" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector2" },
            { name: "isValid", type: "boolean" },
        ],
    },

    Rotate3D: {
        className: "FlowGraphRotate3DBlock",
        category: "Vector",
        description: "Rotates a 3D vector by a quaternion rotation.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Vector3", description: "The vector to rotate" },
            { name: "b", type: "Quaternion", description: "The rotation quaternion" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    TransformVector: {
        className: "FlowGraphTransformVectorBlock",
        category: "Vector",
        description: "Transforms a vector by a matrix.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "any", description: "The vector to transform" },
            { name: "b", type: "any", description: "The transformation matrix" },
        ],
        dataOutputs: [
            { name: "value", type: "any" },
            { name: "isValid", type: "boolean" },
        ],
    },

    TransformCoordinates: {
        className: "FlowGraphTransformCoordinatesBlock",
        category: "Vector",
        description: "Transforms a Vector3 position by a Matrix (like Vector3.TransformCoordinates).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Vector3", description: "The position to transform" },
            { name: "b", type: "Matrix", description: "The transformation matrix" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    AngleBetween: {
        className: "FlowGraphAngleBetweenBlock",
        category: "Vector",
        description: "Computes the angle between two quaternions.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Quaternion" },
            { name: "b", type: "Quaternion" },
        ],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    QuaternionFromAxisAngle: {
        className: "FlowGraphQuaternionFromAxisAngleBlock",
        category: "Vector",
        description: "Creates a quaternion from an axis and angle.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Vector3", description: "Rotation axis" },
            { name: "b", type: "number", description: "Rotation angle in radians" },
        ],
        dataOutputs: [
            { name: "value", type: "Quaternion" },
            { name: "isValid", type: "boolean" },
        ],
    },

    AxisAngleFromQuaternion: {
        className: "FlowGraphAxisAngleFromQuaternionBlock",
        category: "Vector",
        description: "Decomposes a quaternion into an axis and angle.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "Quaternion" }],
        dataOutputs: [
            { name: "axis", type: "Vector3" },
            { name: "angle", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    QuaternionFromDirections: {
        className: "FlowGraphQuaternionFromDirectionsBlock",
        category: "Vector",
        description: "Creates a quaternion that rotates one direction to another.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Vector3", description: "From direction" },
            { name: "b", type: "Vector3", description: "To direction" },
        ],
        dataOutputs: [
            { name: "value", type: "Quaternion" },
            { name: "isValid", type: "boolean" },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  MATRIX BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    ...makeUnaryMathBlock("Transpose", "FlowGraphTransposeBlock", "Transposes a matrix.", "Matrix", "Matrix"),
    ...makeUnaryMathBlock("Determinant", "FlowGraphDeterminantBlock", "Computes the determinant of a matrix.", "number", "Matrix"),
    ...makeUnaryMathBlock("InvertMatrix", "FlowGraphInvertMatrixBlock", "Inverts a matrix.", "Matrix", "Matrix"),

    MatrixMultiplication: {
        className: "FlowGraphMatrixMultiplicationBlock",
        category: "Matrix",
        description: "Multiplies two matrices together.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "a", type: "Matrix" },
            { name: "b", type: "Matrix" },
        ],
        dataOutputs: [
            { name: "value", type: "Matrix" },
            { name: "isValid", type: "boolean" },
        ],
    },

    MatrixDecompose: {
        className: "FlowGraphMatrixDecompose",
        category: "Matrix",
        description: "Decomposes a matrix into position, rotation (quaternion), and scale.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Matrix" }],
        dataOutputs: [
            { name: "position", type: "Vector3" },
            { name: "rotationQuaternion", type: "Quaternion" },
            { name: "scaling", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    MatrixCompose: {
        className: "FlowGraphMatrixCompose",
        category: "Matrix",
        description: "Composes a matrix from position, rotation (quaternion), and scale.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "position", type: "Vector3" },
            { name: "rotationQuaternion", type: "Quaternion" },
            { name: "scaling", type: "Vector3" },
        ],
        dataOutputs: [{ name: "value", type: "Matrix" }],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  COMBINE BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    CombineVector2: {
        className: "FlowGraphCombineVector2Block",
        category: "Combine",
        description: "Combines two numbers into a Vector2.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "input_0", type: "number", description: "X component" },
            { name: "input_1", type: "number", description: "Y component" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector2" },
            { name: "isValid", type: "boolean" },
        ],
    },

    CombineVector3: {
        className: "FlowGraphCombineVector3Block",
        category: "Combine",
        description: "Combines three numbers into a Vector3.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "input_0", type: "number", description: "X component" },
            { name: "input_1", type: "number", description: "Y component" },
            { name: "input_2", type: "number", description: "Z component" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    CombineVector4: {
        className: "FlowGraphCombineVector4Block",
        category: "Combine",
        description: "Combines four numbers into a Vector4.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [
            { name: "input_0", type: "number", description: "X component" },
            { name: "input_1", type: "number", description: "Y component" },
            { name: "input_2", type: "number", description: "Z component" },
            { name: "input_3", type: "number", description: "W component" },
        ],
        dataOutputs: [
            { name: "value", type: "Vector4" },
            { name: "isValid", type: "boolean" },
        ],
    },

    CombineMatrix: {
        className: "FlowGraphCombineMatrixBlock",
        category: "Combine",
        description: "Combines 16 numbers into a 4x4 Matrix.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: Array.from({ length: 16 }, (_, i) => ({
            name: `input_${i}`,
            type: "number",
            description: `Matrix element [${Math.floor(i / 4)}][${i % 4}]`,
        })),
        dataOutputs: [
            { name: "value", type: "Matrix" },
            { name: "isValid", type: "boolean" },
        ],
        config: { inputIsColumnMajor: "boolean — whether inputs are in column-major order" },
    },

    CombineMatrix2D: {
        className: "FlowGraphCombineMatrix2DBlock",
        category: "Combine",
        description: "Combines 4 float values into a 2x2 Matrix2D.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: Array.from({ length: 4 }, (_, i) => ({
            name: `input_${i}`,
            type: "number",
            description: `Matrix element ${i}`,
        })),
        dataOutputs: [
            { name: "value", type: "Matrix2D" },
            { name: "isValid", type: "boolean" },
        ],
        config: { inputIsColumnMajor: "boolean — whether inputs are in column-major order" },
    },

    CombineMatrix3D: {
        className: "FlowGraphCombineMatrix3DBlock",
        category: "Combine",
        description: "Combines 9 float values into a 3x3 Matrix3D.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: Array.from({ length: 9 }, (_, i) => ({
            name: `input_${i}`,
            type: "number",
            description: `Matrix element [${Math.floor(i / 3)}][${i % 3}]`,
        })),
        dataOutputs: [
            { name: "value", type: "Matrix3D" },
            { name: "isValid", type: "boolean" },
        ],
        config: { inputIsColumnMajor: "boolean — whether inputs are in column-major order" },
    },

    // ═══════════════════════════════════════════════════════════════════
    //  EXTRACT BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    ExtractVector2: {
        className: "FlowGraphExtractVector2Block",
        category: "Extract",
        description: "Extracts the X and Y components from a Vector2.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Vector2" }],
        dataOutputs: [
            { name: "output_0", type: "number", description: "X" },
            { name: "output_1", type: "number", description: "Y" },
        ],
    },

    ExtractVector3: {
        className: "FlowGraphExtractVector3Block",
        category: "Extract",
        description: "Extracts the X, Y, and Z components from a Vector3.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Vector3" }],
        dataOutputs: [
            { name: "output_0", type: "number", description: "X" },
            { name: "output_1", type: "number", description: "Y" },
            { name: "output_2", type: "number", description: "Z" },
        ],
    },

    ExtractVector4: {
        className: "FlowGraphExtractVector4Block",
        category: "Extract",
        description: "Extracts the X, Y, Z, and W components from a Vector4.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Vector4" }],
        dataOutputs: [
            { name: "output_0", type: "number", description: "X" },
            { name: "output_1", type: "number", description: "Y" },
            { name: "output_2", type: "number", description: "Z" },
            { name: "output_3", type: "number", description: "W" },
        ],
    },

    ExtractMatrix: {
        className: "FlowGraphExtractMatrixBlock",
        category: "Extract",
        description: "Extracts all 16 elements from a 4x4 Matrix.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Matrix" }],
        dataOutputs: Array.from({ length: 16 }, (_, i) => ({
            name: `output_${i}`,
            type: "number",
            description: `Matrix element [${Math.floor(i / 4)}][${i % 4}]`,
        })),
    },

    ExtractMatrix2D: {
        className: "FlowGraphExtractMatrix2DBlock",
        category: "Extract",
        description: "Extracts all 4 elements from a 2x2 Matrix2D.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Matrix2D" }],
        dataOutputs: Array.from({ length: 4 }, (_, i) => ({
            name: `output_${i}`,
            type: "number",
            description: `Matrix element ${i}`,
        })),
    },

    ExtractMatrix3D: {
        className: "FlowGraphExtractMatrix3DBlock",
        category: "Extract",
        description: "Extracts all 9 elements from a 3x3 Matrix3D.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "Matrix3D" }],
        dataOutputs: Array.from({ length: 9 }, (_, i) => ({
            name: `output_${i}`,
            type: "number",
            description: `Matrix element [${Math.floor(i / 3)}][${i % 3}]`,
        })),
    },

    // ═══════════════════════════════════════════════════════════════════
    //  TYPE CONVERSION BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    BooleanToFloat: {
        className: "FlowGraphBooleanToFloat",
        category: "Conversion",
        description: "Converts a boolean to a float (true → 1.0, false → 0.0).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "boolean" }],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    BooleanToInt: {
        className: "FlowGraphBooleanToInt",
        category: "Conversion",
        description: "Converts a boolean to an integer (true → 1, false → 0).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "boolean" }],
        dataOutputs: [
            { name: "value", type: "FlowGraphInteger" },
            { name: "isValid", type: "boolean" },
        ],
    },

    FloatToBoolean: {
        className: "FlowGraphFloatToBoolean",
        category: "Conversion",
        description: "Converts a float to a boolean (0 → false, nonzero → true).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "number" }],
        dataOutputs: [
            { name: "value", type: "boolean" },
            { name: "isValid", type: "boolean" },
        ],
    },

    IntToBoolean: {
        className: "FlowGraphIntToBoolean",
        category: "Conversion",
        description: "Converts an integer to a boolean (0 → false, nonzero → true).",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "FlowGraphInteger" }],
        dataOutputs: [
            { name: "value", type: "boolean" },
            { name: "isValid", type: "boolean" },
        ],
    },

    IntToFloat: {
        className: "FlowGraphIntToFloat",
        category: "Conversion",
        description: "Converts an integer to a float.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "FlowGraphInteger" }],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    FloatToInt: {
        className: "FlowGraphFloatToInt",
        category: "Conversion",
        description: "Converts a float to an integer.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "a", type: "number" }],
        dataOutputs: [
            { name: "value", type: "FlowGraphInteger" },
            { name: "isValid", type: "boolean" },
        ],
        config: { roundingMode: '"floor" | "ceil" | "round" — how to round the float value' },
    },

    // ═══════════════════════════════════════════════════════════════════
    //  PHYSICS — EXECUTION BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    PhysicsApplyForce: {
        className: "FlowGraphApplyForceBlock",
        category: "Execution",
        description: "Applies a force to a physics body at a given location.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "body", type: "any", description: "The PhysicsBody to apply force to" },
            { name: "force", type: "Vector3", description: "Force vector" },
            { name: "location", type: "Vector3", description: "World-space location to apply force at" },
        ],
        dataOutputs: [],
    },

    PhysicsApplyImpulse: {
        className: "FlowGraphApplyImpulseBlock",
        category: "Execution",
        description: "Applies an impulse to a physics body at a given location.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "body", type: "any", description: "The PhysicsBody to apply impulse to" },
            { name: "impulse", type: "Vector3", description: "Impulse vector" },
            { name: "location", type: "Vector3", description: "World-space location to apply impulse at" },
        ],
        dataOutputs: [],
    },

    PhysicsSetLinearVelocity: {
        className: "FlowGraphSetLinearVelocityBlock",
        category: "Execution",
        description: "Sets the linear velocity of a physics body.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "body", type: "any", description: "The PhysicsBody" },
            { name: "velocity", type: "Vector3", description: "New linear velocity" },
        ],
        dataOutputs: [],
    },

    PhysicsSetAngularVelocity: {
        className: "FlowGraphSetAngularVelocityBlock",
        category: "Execution",
        description: "Sets the angular velocity of a physics body.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "body", type: "any", description: "The PhysicsBody" },
            { name: "velocity", type: "Vector3", description: "New angular velocity" },
        ],
        dataOutputs: [],
    },

    PhysicsSetMotionType: {
        className: "FlowGraphSetPhysicsMotionTypeBlock",
        category: "Execution",
        description: "Sets the motion type of a physics body (Static=0, Animated=1, Dynamic=2).",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "body", type: "any", description: "The PhysicsBody" },
            { name: "motionType", type: "number", description: "Motion type: Static (0), Animated (1), Dynamic (2)" },
        ],
        dataOutputs: [],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  PHYSICS — DATA BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    PhysicsGetLinearVelocity: {
        className: "FlowGraphGetLinearVelocityBlock",
        category: "Data",
        description: "Gets the linear velocity of a physics body.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "body", type: "any", description: "The PhysicsBody" }],
        dataOutputs: [
            { name: "value", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    PhysicsGetAngularVelocity: {
        className: "FlowGraphGetAngularVelocityBlock",
        category: "Data",
        description: "Gets the angular velocity of a physics body.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "body", type: "any", description: "The PhysicsBody" }],
        dataOutputs: [
            { name: "value", type: "Vector3" },
            { name: "isValid", type: "boolean" },
        ],
    },

    PhysicsGetMassProperties: {
        className: "FlowGraphGetPhysicsMassPropertiesBlock",
        category: "Data",
        description: "Gets mass, center of mass, and inertia of a physics body.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "body", type: "any", description: "The PhysicsBody" }],
        dataOutputs: [
            { name: "mass", type: "number" },
            { name: "centerOfMass", type: "Vector3" },
            { name: "inertia", type: "Vector3" },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  AUDIO — EXECUTION BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    AudioPlaySound: {
        className: "FlowGraphPlaySoundBlock",
        category: "Execution",
        description: "Plays a sound with optional volume, offset, and loop control.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "sound", type: "any", description: "The sound to play" },
            { name: "volume", type: "number", description: "Playback volume (default: 1)" },
            { name: "startOffset", type: "number", description: "Start offset in seconds (default: 0)" },
            { name: "loop", type: "boolean", description: "Whether to loop (default: false)" },
        ],
        dataOutputs: [],
    },

    AudioStopSound: {
        className: "FlowGraphStopSoundBlock",
        category: "Execution",
        description: "Stops a currently playing sound.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "sound", type: "any", description: "The sound to stop" }],
        dataOutputs: [],
    },

    AudioPauseSound: {
        className: "FlowGraphPauseSoundBlock",
        category: "Execution",
        description: "Pauses a currently playing sound.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [{ name: "sound", type: "any", description: "The sound to pause" }],
        dataOutputs: [],
    },

    AudioSetVolume: {
        className: "FlowGraphSetSoundVolumeBlock",
        category: "Execution",
        description: "Sets the volume of a sound.",
        signalInputs: [{ name: "in" }],
        signalOutputs: [{ name: "out" }, { name: "error" }],
        dataInputs: [
            { name: "sound", type: "any", description: "The sound" },
            { name: "volume", type: "number", description: "Volume level (default: 1)" },
        ],
        dataOutputs: [],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  AUDIO — DATA BLOCKS
    // ═══════════════════════════════════════════════════════════════════

    AudioGetVolume: {
        className: "FlowGraphGetSoundVolumeBlock",
        category: "Data",
        description: "Gets the current volume of a sound.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "sound", type: "any", description: "The sound" }],
        dataOutputs: [
            { name: "value", type: "number" },
            { name: "isValid", type: "boolean" },
        ],
    },

    AudioIsSoundPlaying: {
        className: "FlowGraphIsSoundPlayingBlock",
        category: "Data",
        description: "Returns whether a sound is currently playing.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "sound", type: "any", description: "The sound" }],
        dataOutputs: [
            { name: "value", type: "boolean" },
            { name: "isValid", type: "boolean" },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════
    //  UTILITY / DEBUG
    // ═══════════════════════════════════════════════════════════════════

    DebugBlock: {
        className: "FlowGraphDebugBlock",
        category: "Utility",
        description: "Pass-through block that logs its input value for debugging. Output equals input.",
        signalInputs: [],
        signalOutputs: [],
        dataInputs: [{ name: "input", type: "any" }],
        dataOutputs: [{ name: "output", type: "any" }],
    },
};

// ─── Helper factory functions ─────────────────────────────────────────────

function makeUnaryMathBlock(name: string, className: string, description: string, outputType: string = "any", inputType: string = "any"): Record<string, IFlowGraphBlockTypeInfo> {
    return {
        [name]: {
            className,
            category: "Math",
            description,
            signalInputs: [],
            signalOutputs: [],
            dataInputs: [{ name: "a", type: inputType, description: "Input value" }],
            dataOutputs: [
                { name: "value", type: outputType },
                { name: "isValid", type: "boolean" },
            ],
        },
    };
}

function makeBinaryMathBlock(
    name: string,
    className: string,
    description: string,
    outputType: string = "any",
    inputAType: string = "any",
    inputBType: string = "any"
): Record<string, IFlowGraphBlockTypeInfo> {
    return {
        [name]: {
            className,
            category: "Math",
            description,
            signalInputs: [],
            signalOutputs: [],
            dataInputs: [
                { name: "a", type: inputAType, description: "First operand" },
                { name: "b", type: inputBType, description: "Second operand" },
            ],
            dataOutputs: [
                { name: "value", type: outputType },
                { name: "isValid", type: "boolean" },
            ],
        },
    };
}

// ─── Catalog Helpers ──────────────────────────────────────────────────────

/**
 * Returns a Markdown summary of all block types grouped by category.
 * @returns A Markdown-formatted string listing every block type grouped by category.
 */
export function GetBlockCatalogSummary(): string {
    const byCategory = new Map<string, string[]>();
    for (const [key, info] of Object.entries(FlowGraphBlockRegistry)) {
        if (!byCategory.has(info.category)) {
            byCategory.set(info.category, []);
        }
        byCategory.get(info.category)!.push(`  ${key} (${info.className}): ${info.description.split(".")[0]}`);
    }

    const lines: string[] = [];
    for (const [cat, entries] of byCategory) {
        lines.push(`\n## ${cat}\n`);
        lines.push(...entries);
    }
    return lines.join("\n");
}

/**
 * Returns detailed info about a specific block type.
 * @param blockType - The block type key or className to look up.
 * @returns The block type info, or undefined if not found.
 */
export function GetBlockTypeDetails(blockType: string): IFlowGraphBlockTypeInfo | undefined {
    // Try exact match first
    if (FlowGraphBlockRegistry[blockType]) {
        return FlowGraphBlockRegistry[blockType];
    }
    // Try by className
    for (const info of Object.values(FlowGraphBlockRegistry)) {
        if (info.className === blockType) {
            return info;
        }
    }
    return undefined;
}

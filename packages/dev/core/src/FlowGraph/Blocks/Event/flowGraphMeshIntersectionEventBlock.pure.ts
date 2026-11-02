/** This file must only contain pure code and pure imports */

import { type AbstractMesh } from "../../../Meshes/abstractMesh.pure";
import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "../../flowGraphContext";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { type FlowGraphSignalConnection } from "../../flowGraphSignalConnection.pure";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeBoolean } from "../../flowGraphRichTypes.pure";
import { FlowGraphEventType } from "../../flowGraphEventType";
import { type Nullable } from "../../../types";
import { RegisterClass } from "../../../Misc/typeStore";

/** Event source key used to build this block's event reference. */
const EventKey = "meshIntersection";

interface IIntersectionState {
    /** The target meshes intersecting the source mesh after the last check, in target order. */
    intersecting: AbstractMesh[];
    /** Membership set of `intersecting`. */
    intersectingSet: Set<AbstractMesh>;
    /** Reused list that collects the intersecting meshes during a check. */
    scratch: AbstractMesh[];
    /** Membership set of `scratch`. */
    scratchSet: Set<AbstractMesh>;
    /** Reused set of the targets already checked during a check, used to skip duplicate targets. */
    visited: Set<unknown>;
}

function IsCheckableMesh(value: any): value is AbstractMesh {
    return !!value && typeof value.intersectsMesh === "function" && !value.isDisposed() && value.isEnabled();
}

/**
 * @experimental
 * An event block that fires when a source mesh starts or stops intersecting one of a list of target meshes.
 * The intersection is checked before each frame using the meshes' bounding volumes, so no physics engine is required.
 * The `onEnter` signal fires when a target starts intersecting the source and `onExit` fires when it stops.
 * The `out` and `done` signals fire on both transitions; use `isIntersecting` to tell them apart.
 * Disabled or disposed meshes are treated as not intersecting.
 */
export class FlowGraphMeshIntersectionEventBlock extends FlowGraphEventBlock {
    /**
     * Input connection: The mesh to check for intersections.
     */
    public readonly sourceMesh: FlowGraphDataConnection<AbstractMesh>;

    /**
     * Input connection: The mesh, or array of meshes, checked against the source mesh.
     */
    public readonly targetMeshes: FlowGraphDataConnection<AbstractMesh | AbstractMesh[]>;

    /**
     * Input connection: Whether to use the oriented bounding boxes instead of the axis-aligned ones. Defaults to false.
     */
    public readonly usePreciseIntersection: FlowGraphDataConnection<boolean>;

    /**
     * Output connection: The target mesh that started or stopped intersecting the source mesh.
     */
    public readonly otherMesh: FlowGraphDataConnection<AbstractMesh>;

    /**
     * Output connection: True if the last transition was an enter, false if it was an exit.
     */
    public readonly isIntersecting: FlowGraphDataConnection<boolean>;

    /**
     * Output signal: Fires when a target mesh starts intersecting the source mesh.
     */
    public readonly onEnter: FlowGraphSignalConnection;

    /**
     * Output signal: Fires when a target mesh stops intersecting the source mesh.
     */
    public readonly onExit: FlowGraphSignalConnection;

    public override readonly type: FlowGraphEventType = FlowGraphEventType.SceneBeforeRender;

    /** @returns the mesh intersection event key */
    public override get eventKey(): string {
        return EventKey;
    }

    /**
     * Constructs a new FlowGraphMeshIntersectionEventBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.sourceMesh = this.registerDataInput("sourceMesh", RichTypeAny);
        this.targetMeshes = this.registerDataInput("targetMeshes", RichTypeAny);
        this.usePreciseIntersection = this.registerDataInput("usePreciseIntersection", RichTypeBoolean, false);
        this.otherMesh = this.registerDataOutput("otherMesh", RichTypeAny);
        this.isIntersecting = this.registerDataOutput("isIntersecting", RichTypeBoolean, false);
        this.onEnter = this._registerSignalOutput("onEnter");
        this.onExit = this._registerSignalOutput("onExit");
    }

    /**
     * @internal
     */
    public override _preparePendingTasks(_context: FlowGraphContext): void {
        // The intersection state is created lazily on the first check.
    }

    /**
     * @internal
     */
    public override _executeEvent(context: FlowGraphContext, _payload: any): boolean {
        let state = context._getExecutionVariable<Nullable<IIntersectionState>>(this, "_intersectionState", null);
        if (!state) {
            state = { intersecting: [], intersectingSet: new Set(), scratch: [], scratchSet: new Set(), visited: new Set() };
            context._setExecutionVariable(this, "_intersectionState", state);
        }

        const previous = state.intersecting;
        const previousSet = state.intersectingSet;
        const current = state.scratch;
        const currentSet = state.scratchSet;
        current.length = 0;
        currentSet.clear();
        state.visited.clear();

        // The check is not triggered by a signal, so start a new execution frame to refresh cached data blocks feeding the inputs.
        context._increaseExecutionId();
        const source = this.sourceMesh.getValue(context);
        if (IsCheckableMesh(source)) {
            const targets = this.targetMeshes.getValue(context);
            const precise = !!this.usePreciseIntersection.getValue(context);
            // Before-render runs before the frame's render id advances, so a cached world matrix can miss in-place transform changes.
            source.computeWorldMatrix(true);
            if (Array.isArray(targets)) {
                for (let i = 0; i < targets.length; i++) {
                    this._checkTarget(source, targets[i], precise, state);
                }
            } else {
                this._checkTarget(source, targets, precise, state);
            }
        }

        // Swap the lists before firing signals so re-entrant checks see a consistent state.
        state.intersecting = current;
        state.intersectingSet = currentSet;
        state.scratch = previous;
        state.scratchSet = previousSet;

        for (let i = 0; i < previous.length; i++) {
            if (!currentSet.has(previous[i])) {
                this._fireTransition(context, previous[i], false);
            }
        }
        for (let i = 0; i < current.length; i++) {
            if (!previousSet.has(current[i])) {
                this._fireTransition(context, current[i], true);
            }
        }
        return true;
    }

    private _checkTarget(source: AbstractMesh, target: unknown, precise: boolean, state: IIntersectionState): void {
        if (target === source || state.visited.has(target)) {
            return;
        }
        state.visited.add(target);
        if (!IsCheckableMesh(target)) {
            return;
        }
        target.computeWorldMatrix(true);
        if (source.intersectsMesh(target, precise)) {
            state.scratch.push(target);
            state.scratchSet.add(target);
        }
    }

    private _fireTransition(context: FlowGraphContext, other: AbstractMesh, entered: boolean): void {
        this.otherMesh.setValue(other, context);
        this.isIntersecting.setValue(entered, context);
        context._notifyExecuteNode(this);
        (entered ? this.onEnter : this.onExit)._activateSignal(context);
        this.done._activateSignal(context);
        this.out._activateSignal(context);
    }

    /**
     * @internal
     */
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        context._setExecutionVariable(this, "_intersectionState", null);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.MeshIntersectionEvent;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphMeshIntersectionEventBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphMeshIntersectionEventBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.MeshIntersectionEvent, FlowGraphMeshIntersectionEventBlock);
}

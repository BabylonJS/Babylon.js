import { type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeNumber, RichTypeString, RichTypeVector3 } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { Matrix, Vector3 } from "core/Maths/math.vector.pure";
import { GetInteractivityObjectReference } from "./flowGraphObjectReferenceBlock";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection.pure";

/**
 * Configuration for a KHR event reference output.
 */
export interface IFlowGraphEventReferenceBlockConfiguration extends IFlowGraphBlockConfiguration {
    /** Stable key shared by equivalent event operations. */
    eventKey: string;
}

/**
 * Produces the opaque reference associated with a KHR event operation.
 */
export class FlowGraphEventReferenceBlock extends FlowGraphExecutionBlock {
    private readonly _assetInverse = Matrix.Identity();
    private readonly _selectionPointValue = Vector3.Zero();
    private readonly _selectionRayOriginValue = Vector3.Zero();
    /** Output flow activated after event values are captured. */
    public readonly out: FlowGraphSignalConnection;
    /** Runtime node associated with the event. */
    public readonly node: FlowGraphDataConnection<object | undefined>;
    /** Controller index associated with the event. */
    public readonly controllerIndexInput: FlowGraphDataConnection<number>;
    /** Selection point associated with the event. */
    public readonly selectionPointInput: FlowGraphDataConnection<Vector3>;
    /** Selection ray origin associated with the event. */
    public readonly selectionRayOriginInput: FlowGraphDataConnection<Vector3>;
    /** Opaque node reference. */
    public readonly nodeReference: FlowGraphDataConnection<string>;
    /** Retained controller index. */
    public readonly controllerIndex: FlowGraphDataConnection<number>;
    /** Retained selection point. */
    public readonly selectionPoint: FlowGraphDataConnection<Vector3>;
    /** Retained selection ray origin. */
    public readonly selectionRayOrigin: FlowGraphDataConnection<Vector3>;
    /** Opaque event reference. */
    public readonly value: FlowGraphDataConnection<string>;

    constructor(public override config: IFlowGraphEventReferenceBlockConfiguration) {
        super(config);
        const nanVector = new Vector3(NaN, NaN, NaN);
        this.node = this.registerDataInput("node", RichTypeAny);
        this.controllerIndexInput = this.registerDataInput("controllerIndexInput", RichTypeNumber, -1);
        this.selectionPointInput = this.registerDataInput("selectionPointInput", RichTypeVector3, nanVector);
        this.selectionRayOriginInput = this.registerDataInput("selectionRayOriginInput", RichTypeVector3, nanVector);
        this.nodeReference = this.registerDataOutput("nodeReference", RichTypeString, "");
        this.controllerIndex = this.registerDataOutput("controllerIndex", RichTypeNumber, -1);
        this.selectionPoint = this.registerDataOutput("selectionPoint", RichTypeVector3, nanVector);
        this.selectionRayOrigin = this.registerDataOutput("selectionRayOrigin", RichTypeVector3, nanVector);
        this.value = this.registerDataOutput("value", RichTypeString, "");
        this.out = this._registerSignalOutput("out");
    }

    /** @internal */
    public override _execute(context: FlowGraphContext): void {
        this.nodeReference.setValue(GetInteractivityObjectReference(context, this.node.getValue(context)), context);
        const pointerId = this.controllerIndexInput.getValue(context);
        if (pointerId < 0) {
            this.controllerIndex.setValue(-1, context);
        } else {
            const controllerIndices = context._getGlobalContextVariable("khrInteractivityControllerIndices", new Map<number, number>()) as Map<number, number>;
            let controllerIndex = controllerIndices.get(pointerId);
            if (controllerIndex === undefined) {
                controllerIndex = controllerIndices.size;
                controllerIndices.set(pointerId, controllerIndex);
                context._setGlobalContextVariable("khrInteractivityControllerIndices", controllerIndices);
            }
            this.controllerIndex.setValue(controllerIndex, context);
        }
        const node = this.node.getValue(context) as { parent?: any; getWorldMatrix?: () => Matrix } | undefined;
        let root = node?.parent;
        while (root?.parent) {
            root = root.parent;
        }
        if (root?.getWorldMatrix) {
            root.getWorldMatrix().invertToRef(this._assetInverse);
            Vector3.TransformCoordinatesToRef(this.selectionPointInput.getValue(context), this._assetInverse, this._selectionPointValue);
            Vector3.TransformCoordinatesToRef(this.selectionRayOriginInput.getValue(context), this._assetInverse, this._selectionRayOriginValue);
            this.selectionPoint.setValue(this._selectionPointValue, context);
            this.selectionRayOrigin.setValue(this._selectionRayOriginValue, context);
        } else {
            this.selectionPoint.setValue(this.selectionPointInput.getValue(context), context);
            this.selectionRayOrigin.setValue(this.selectionRayOriginInput.getValue(context), context);
        }
        this.value.setValue(context.getEventReference(this.config.eventKey), context);
        this.out._activateSignal(context);
    }

    /** @returns the serialized class name */
    public override getClassName(): string {
        return "FlowGraphEventReferenceBlock";
    }
}

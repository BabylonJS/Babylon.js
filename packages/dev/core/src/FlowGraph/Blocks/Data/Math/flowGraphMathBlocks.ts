import { RegisterClass } from "core/Misc";
import type { IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { FlowGraphBlock } from "../../../flowGraphBlock";
import type { FlowGraphContext } from "../../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny } from "../../../flowGraphRichTypes";

export class FlowGraphAddBlock extends FlowGraphBlock {
    public readonly a: FlowGraphDataConnection<any>;
    public readonly b: FlowGraphDataConnection<any>;
    public readonly val: FlowGraphDataConnection<any>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.a = this._registerDataInput("a", RichTypeAny);
        this.b = this._registerDataInput("b", RichTypeAny);
        this.val = this._registerDataOutput("result", RichTypeAny);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const aval = this.a.getValue(_context);
        const bval = this.b.getValue(_context);
        const result = this._polymorphicAdd(aval, bval);
        this.val.setValue(result, _context);
    }

    private _polymorphicAdd(a: any, b: any) {
        const aClassName = this._getClassNameOf(a);
        const bClassName = this._getClassNameOf(b);
        if (
            (aClassName === "Vector2" && bClassName === "Vector2") ||
            (aClassName === "Vector3" && bClassName === "Vector3") ||
            (aClassName === "Vector4" && bClassName === "Vector4")
        ) {
            return a.add(b);
        } else {
            return a + b;
        }
    }

    private _getClassNameOf(v: any) {
        if (v.getClassName) {
            return v.getClassName();
        }
        return "";
    }

    public static ClassName = "FGAddBlock";
    public getClassName(): string {
        return FlowGraphAddBlock.ClassName;
    }
}
RegisterClass(FlowGraphAddBlock.ClassName, FlowGraphAddBlock);

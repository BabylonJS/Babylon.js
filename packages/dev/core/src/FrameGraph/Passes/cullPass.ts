import type { Nullable, AbstractEngine, IFrameGraphPass, FrameGraphContext, FrameGraphObjectList, FrameGraphTask } from "core/index";
import { FrameGraphPass } from "./pass";

/**
 * Cull pass used to filter objects that are not visible.
 */
export class FrameGraphCullPass extends FrameGraphPass<FrameGraphContext> {
    protected readonly _engine: AbstractEngine;
    protected _objectList: FrameGraphObjectList;

    /**
     * Checks if a pass is a cull pass.
     * @param pass The pass to check.
     * @returns True if the pass is a cull pass, else false.
     */
    public static IsCullPass(pass: IFrameGraphPass): pass is FrameGraphCullPass {
        return (pass as FrameGraphCullPass).setObjectList !== undefined;
    }

    /**
     * Gets the object list used by the cull pass.
     */
    public get objectList(): FrameGraphObjectList {
        return this._objectList;
    }

    /**
     * Sets the object list to use for culling.
     * @param objectList The object list to use for culling.
     */
    public setObjectList(objectList: FrameGraphObjectList) {
        this._objectList = objectList;
    }

    /** @internal */
    constructor(name: string, parentTask: FrameGraphTask, context: FrameGraphContext, engine: AbstractEngine) {
        super(name, parentTask, context);
        this._engine = engine;
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._objectList !== undefined ? null : "Object list is not set (call setObjectList to set it)";
    }
}

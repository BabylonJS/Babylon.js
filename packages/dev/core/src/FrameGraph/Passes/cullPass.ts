import type { Nullable } from "../../types";
import { FrameGraphPass } from "./pass";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { IFrameGraphPass, IFrameGraphTask } from "../frameGraphTypes";
import type { FrameGraphContext } from "../frameGraphContext";
import type { FrameGraphObjectList } from "../frameGraphObjectList";

export class FrameGraphCullPass extends FrameGraphPass<FrameGraphContext> {
    protected _engine: AbstractEngine;
    protected _objectList: FrameGraphObjectList;

    public static IsCullPass(pass: IFrameGraphPass): pass is FrameGraphCullPass {
        return (pass as FrameGraphCullPass).setObjectList !== undefined;
    }

    /** @internal */
    public get objectList(): FrameGraphObjectList {
        return this._objectList;
    }

    /** @internal */
    constructor(name: string, parentTask: IFrameGraphTask, context: FrameGraphContext, engine: AbstractEngine) {
        super(name, parentTask, context);
        this._engine = engine;
    }

    public setObjectList(objectList: FrameGraphObjectList) {
        this._objectList = objectList;
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._objectList !== undefined ? null : "Object list is not set (call setObjectList to set it)";
    }
}

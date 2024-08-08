import type { Nullable } from "../../types";
import type { FrameGraphContext } from "../frameGraphContext";

export interface IFrameGraphPass {
    name: string;
    setExecuteFunc(func: (context: FrameGraphContext) => void): void;
    _execute(): void;
    _isValid(): Nullable<string>;
}

import type { ComponentType } from "react";
import type { IService } from "../modularity/serviceDefinition";

export const ViewHostIdentity = Symbol("ViewHost");
export interface IViewHost extends IService<typeof ViewHostIdentity> {
    mainView: ComponentType | undefined;
}

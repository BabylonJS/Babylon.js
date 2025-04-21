import type { ComponentType } from "react";
import type { Service } from "../modularity/serviceDefinition";

export const ViewHost = Symbol("ViewHost");
export interface ViewHost extends Service<typeof ViewHost> {
    mainView: ComponentType | undefined;
}

import { Nullable } from "core/types";
import { GraphFrame } from "../graphFrame";
import { GraphNode } from "../graphNode";

import { NodeLink } from "../nodeLink";
import { NodePort } from "../nodePort";
import { FramePortData } from "../types/framePortData";

export class ISelectionChangedOptions {
    selection: Nullable<GraphNode | NodeLink | GraphFrame | NodePort | FramePortData>;
    forceKeepSelection?: boolean;
    marqueeSelection?: boolean;
}
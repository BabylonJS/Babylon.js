import type { Nullable } from "core/types";
import type { GraphFrame } from "../graphFrame";
import type { GraphNode } from "../graphNode";
import type { GraphStickyNote } from "../graphStickyNote";

import type { NodeLink } from "../nodeLink";
import type { NodePort } from "../nodePort";
import type { FramePortData } from "../types/framePortData";

export interface ISelectionChangedOptions {
    selection: Nullable<GraphNode | NodeLink | GraphFrame | NodePort | FramePortData | GraphStickyNote>;
    forceKeepSelection?: boolean;
    marqueeSelection?: boolean;
}

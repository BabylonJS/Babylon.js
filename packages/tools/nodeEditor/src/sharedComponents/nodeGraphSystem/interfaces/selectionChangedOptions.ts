import { Nullable } from "core/types";
import { FramePortData } from "node-editor/diagram/graphCanvas";
import { GraphFrame } from "node-editor/diagram/graphFrame";
import { GraphNode } from "node-editor/diagram/graphNode";
import { NodePort } from "node-editor/diagram/nodePort";
import { NodeLink } from "../nodeLink";

export class ISelectionChangedOptions {
    selection: Nullable<GraphNode | NodeLink | GraphFrame | NodePort | FramePortData>;
    forceKeepSelection?: boolean;
    marqueeSelection?: boolean;
}
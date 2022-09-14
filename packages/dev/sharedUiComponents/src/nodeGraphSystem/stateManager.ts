import type { Vector2 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { FrameNodePort } from "./frameNodePort";
import type { GraphFrame } from "./graphFrame";
import type { GraphNode } from "./graphNode";
import type { INodeContainer } from "./interfaces/nodeContainer";
import type { INodeData } from "./interfaces/nodeData";
import type { IPortData } from "./interfaces/portData";
import type { ISelectionChangedOptions } from "./interfaces/selectionChangedOptions";
import type { NodePort } from "./nodePort";

export class StateManager {
    data: any;
    hostDocument: Document;
    lockObject: any;

    onSelectionChangedObservable = new Observable<Nullable<ISelectionChangedOptions>>();
    onFrameCreatedObservable = new Observable<GraphFrame>();
    onUpdateRequiredObservable = new Observable<Nullable<any>>();
    onGraphNodeRemovalObservable = new Observable<GraphNode>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();
    onCandidateLinkMoved = new Observable<Nullable<Vector2>>();
    onCandidatePortSelectedObservable = new Observable<Nullable<NodePort | FrameNodePort>>();
    onNewNodeCreatedObservable = new Observable<GraphNode>();
    onRebuildRequiredObservable = new Observable<boolean>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onExposePortOnFrameObservable = new Observable<GraphNode>();
    onGridSizeChanged = new Observable<void>();
    onNewBlockRequiredObservable = new Observable<{ type: string; targetX: number; targetY: number; needRepositioning?: boolean }>();

    exportData: (data: any, frame?: Nullable<GraphFrame>) => string;
    isElbowConnectionAllowed: (nodeA: FrameNodePort | NodePort, nodeB: FrameNodePort | NodePort) => boolean;
    applyNodePortDesign: (data: IPortData, element: HTMLElement, img: HTMLImageElement) => void;

    storeEditorData: (serializationObject: any, frame?: Nullable<GraphFrame>) => void;

    getEditorDataMap: () => { [key: number]: number };

    createDefaultInputData: (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => Nullable<{ data: INodeData; name: string }>;
}

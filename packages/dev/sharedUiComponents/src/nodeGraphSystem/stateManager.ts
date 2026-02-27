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
import type { HistoryStack } from "../historyStack";
import type { Scene } from "core/scene";

export class StateManager {
    data: any;
    hostDocument: Document;
    lockObject: any;
    modalIsDisplayed: boolean;
    historyStack: HistoryStack;
    activeNode: Nullable<GraphNode>;

    onSearchBoxRequiredObservable = new Observable<{ x: number; y: number }>();
    onSelectionChangedObservable = new Observable<Nullable<ISelectionChangedOptions>>();
    onFrameCreatedObservable = new Observable<GraphFrame>();
    onUpdateRequiredObservable = new Observable<Nullable<any>>();
    onGraphNodeRemovalObservable = new Observable<GraphNode>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();
    onCandidateLinkMoved = new Observable<Nullable<Vector2>>();
    onCandidatePortSelectedObservable = new Observable<Nullable<NodePort | FrameNodePort>>();
    onNewNodeCreatedObservable = new Observable<GraphNode>();
    onRebuildRequiredObservable = new Observable<void>();
    onNodeMovedObservable = new Observable<GraphNode>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onExposePortOnFrameObservable = new Observable<GraphNode>();
    onGridSizeChanged = new Observable<void>();
    onNewBlockRequiredObservable = new Observable<{ type: string; targetX: number; targetY: number; needRepositioning?: boolean; smartAdd?: boolean }>();
    onHighlightNodeObservable = new Observable<{ data: any; active: boolean }>();
    onPreviewCommandActivated = new Observable<boolean>();

    exportData: (data: any, frame?: Nullable<GraphFrame>) => string;
    isElbowConnectionAllowed: (nodeA: FrameNodePort | NodePort, nodeB: FrameNodePort | NodePort) => boolean;
    isDebugConnectionAllowed: (nodeA: FrameNodePort | NodePort, nodeB: FrameNodePort | NodePort) => boolean;
    applyNodePortDesign: (data: IPortData, element: HTMLElement, imgHost: HTMLImageElement, pip: HTMLDivElement) => boolean;

    getPortColor: (portData: IPortData) => string;

    storeEditorData: (serializationObject: any, frame?: Nullable<GraphFrame>) => void;

    getEditorDataMap: () => { [key: number]: number };

    getScene?: () => Scene;

    createDefaultInputData: (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => Nullable<{ data: INodeData; name: string }>;

    private _isRebuildQueued: boolean;

    queueRebuildCommand() {
        if (this._isRebuildQueued) {
            return;
        }

        this._isRebuildQueued = true;

        setTimeout(() => {
            this.onRebuildRequiredObservable.notifyObservers();
            this._isRebuildQueued = false;
        }, 1);
    }
}

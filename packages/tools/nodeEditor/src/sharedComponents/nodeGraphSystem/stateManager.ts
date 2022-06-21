import { Vector2 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";
import { Nullable } from "core/types";
import { GraphFrame } from "node-editor/diagram/graphFrame";
import { GraphNode } from "node-editor/diagram/graphNode";
import { NodePort } from "node-editor/diagram/nodePort";
import { FrameNodePort } from "./frameNodePort";
import { ISelectionChangedOptions } from "./interfaces/selectionChangedOptions";

export class StateManager {    
    onSelectionChangedObservable = new Observable<Nullable<ISelectionChangedOptions>>();    
    onFrameCreatedObservable = new Observable<GraphFrame>();
    onUpdateRequiredObservable = new Observable<Nullable<any>>();
    onGraphNodeRemovalObservable = new Observable<GraphNode>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();    
    onCandidateLinkMoved = new Observable<Nullable<Vector2>>();    
    onCandidatePortSelectedObservable = new Observable<Nullable<NodePort | FrameNodePort>>();
    onNewNodeCreatedObservable = new Observable<GraphNode>();
    onRebuildRequiredObservable = new Observable<boolean>();
    onNewBlockRequiredObservable = new Observable<{ type: string; targetX: number; targetY: number; needRepositioning?: boolean }>();    

    isElbowConnectionAllowed: (nodeA: FrameNodePort | NodePort, nodeB: FrameNodePort | NodePort) => boolean;
}
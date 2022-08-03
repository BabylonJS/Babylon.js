import type { StateManager } from "../stateManager";
import type { INodeData } from "./nodeData";

export interface IPropertyComponentProps {
    stateManager: StateManager;
    nodeData: INodeData;
}

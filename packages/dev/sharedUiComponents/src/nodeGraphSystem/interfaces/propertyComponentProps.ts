import { StateManager } from "../stateManager";
import { INodeData } from "./nodeData";

export interface IPropertyComponentProps {
    stateManager: StateManager;
    nodeData: INodeData;
}

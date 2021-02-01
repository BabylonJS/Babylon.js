import { GlobalState } from "../../globalState";
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';

export interface IPropertyComponentProps {
    globalState: GlobalState;
    block: NodeMaterialBlock;
}
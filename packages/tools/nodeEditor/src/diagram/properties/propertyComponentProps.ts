import { GlobalState } from "../../globalState";
import { NodeMaterialBlock } from 'core/Materials/Node/nodeMaterialBlock';

export interface IPropertyComponentProps {
    globalState: GlobalState;
    block: NodeMaterialBlock;
}
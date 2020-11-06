import { GlobalState } from "../../globalState";
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { BabylonFileLoaderConfiguration } from 'babylonjs';

export interface IPropertyComponentProps {
    globalState: GlobalState;
    block: NodeMaterialBlock;
    guiBlock?: BABYLON.GUI.Container | BABYLON.GUI.Control;
}
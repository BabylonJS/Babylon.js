import { GlobalState } from "../../globalState";

export interface IPropertyComponentProps {
    globalState: GlobalState;
    guiBlock: BABYLON.GUI.Container | BABYLON.GUI.Control;
}
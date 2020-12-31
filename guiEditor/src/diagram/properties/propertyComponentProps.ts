import { Control } from "babylonjs-gui/2D/controls/control";
import { GlobalState } from "../../globalState";
import { GUINode } from "../guiNode";

export interface IPropertyComponentProps {
    globalState: GlobalState;
    guiBlock: Control;
}

export interface IContainerComponentProps {
    globalState: GlobalState;
    guiNode: GUINode;
}
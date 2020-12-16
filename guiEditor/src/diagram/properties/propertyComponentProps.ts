import { Control } from "babylonjs-gui/2D/controls/control";
import { GlobalState } from "../../globalState";

export interface IPropertyComponentProps {
    globalState: GlobalState;
    guiBlock: Control;
}
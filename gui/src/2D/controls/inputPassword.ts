import { InputText } from "./inputText";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/**
 * Class used to create a password control
 */
export class InputPassword extends InputText {
    protected _beforeRenderText(text: string): string {
        let txt = "";
        for (let i = 0; i < text.length; i++) {
            txt += "\u2022";
        }
        return txt;
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.InputPassword"] = InputPassword;
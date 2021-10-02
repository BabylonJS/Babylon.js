import { InputText } from "./inputText";
import { RegisterClass } from 'babylonjs/Misc/typeStore';
import { TextWrapper } from './textWrapper';

/**
 * Class used to create a password control
 */
export class InputPassword extends InputText {
    protected _beforeRenderText(textWrapper: TextWrapper): TextWrapper {
        const pwdTextWrapper = new TextWrapper();
        let txt = "";
        for (let i = 0; i < textWrapper.length; i++) {
            txt += "\u2022";
        }
        pwdTextWrapper.text = txt;
        return pwdTextWrapper;
    }
}
RegisterClass("BABYLON.GUI.InputPassword", InputPassword);
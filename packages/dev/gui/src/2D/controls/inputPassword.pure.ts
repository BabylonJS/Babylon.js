import { InputText } from "./inputText.pure";
import { RegisterClass } from "core/Misc/typeStore";
import { TextWrapper } from "./textWrapper";

/**
 * Class used to create a password control
 */
export class InputPassword extends InputText {
    protected override _getTypeName(): string {
        return "InputPassword";
    }

    protected override _beforeRenderText(textWrapper: TextWrapper): TextWrapper {
        const pwdTextWrapper = new TextWrapper();
        let txt = "";
        for (let i = 0; i < textWrapper.length; i++) {
            txt += "\u2022";
        }
        pwdTextWrapper.text = txt;
        return pwdTextWrapper;
    }
}

let _Registered = false;
/**
 * Registers the InputPassword class with the type store for serialization support.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterInputPassword(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.GUI.InputPassword", InputPassword);
}

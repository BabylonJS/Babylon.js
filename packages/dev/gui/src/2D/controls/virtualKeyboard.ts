import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";

import { StackPanel } from "./stackPanel";
import { Button } from "./button";
import type { Container } from "./container";
import type { TextBlock } from "./textBlock";
import type { InputText } from "./inputText";
import { RegisterClass } from "core/Misc/typeStore";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import { InputTextArea } from "./inputTextArea";
import type { Control } from "./control";

/**
 * Class used to store key control properties
 */
export class KeyPropertySet {
    /** Width */
    width?: string;
    /** Height */
    height?: string;
    /** Left padding */
    paddingLeft?: string;
    /** Right padding */
    paddingRight?: string;
    /** Top padding */
    paddingTop?: string;
    /** Bottom padding */
    paddingBottom?: string;
    /** Foreground color */
    color?: string;
    /** Background color */
    background?: string;
}

type ConnectedInputText = {
    input: InputText;
    onFocusObserver: Nullable<Observer<Control>>;
    onBlurObserver: Nullable<Observer<Control>>;
};

/**
 * Class used to create virtual keyboard
 */
export class VirtualKeyboard extends StackPanel {
    /** Observable raised when a key is pressed */
    public onKeyPressObservable = new Observable<string>();

    /** Gets or sets default key button width */
    public defaultButtonWidth = "40px";
    /** Gets or sets default key button height */
    public defaultButtonHeight = "40px";

    /** Gets or sets default key button left padding */
    public defaultButtonPaddingLeft = "2px";
    /** Gets or sets default key button right padding */
    public defaultButtonPaddingRight = "2px";
    /** Gets or sets default key button top padding */
    public defaultButtonPaddingTop = "2px";
    /** Gets or sets default key button bottom padding */
    public defaultButtonPaddingBottom = "2px";

    /** Gets or sets default key button foreground color */
    public defaultButtonColor = "#DDD";
    /** Gets or sets default key button background color */
    public defaultButtonBackground = "#070707";

    /** Gets or sets shift button foreground color */
    public shiftButtonColor = "#7799FF";
    /** Gets or sets shift button thickness*/
    public selectedShiftThickness = 1;

    /** Gets shift key state */
    public shiftState = 0;

    protected override _getTypeName(): string {
        return "VirtualKeyboard";
    }

    private _createKey(key: string, propertySet: Nullable<KeyPropertySet>) {
        const button = Button.CreateSimpleButton(key, key);

        button.width = propertySet && propertySet.width ? propertySet.width : this.defaultButtonWidth;
        button.height = propertySet && propertySet.height ? propertySet.height : this.defaultButtonHeight;
        button.color = propertySet && propertySet.color ? propertySet.color : this.defaultButtonColor;
        button.background = propertySet && propertySet.background ? propertySet.background : this.defaultButtonBackground;
        button.paddingLeft = propertySet && propertySet.paddingLeft ? propertySet.paddingLeft : this.defaultButtonPaddingLeft;
        button.paddingRight = propertySet && propertySet.paddingRight ? propertySet.paddingRight : this.defaultButtonPaddingRight;
        button.paddingTop = propertySet && propertySet.paddingTop ? propertySet.paddingTop : this.defaultButtonPaddingTop;
        button.paddingBottom = propertySet && propertySet.paddingBottom ? propertySet.paddingBottom : this.defaultButtonPaddingBottom;

        button.thickness = 0;
        button.isFocusInvisible = true;

        button.shadowColor = this.shadowColor;
        button.shadowBlur = this.shadowBlur;
        button.shadowOffsetX = this.shadowOffsetX;
        button.shadowOffsetY = this.shadowOffsetY;

        button.onPointerUpObservable.add(() => {
            this.onKeyPressObservable.notifyObservers(key);
        });

        return button;
    }

    /**
     * Adds a new row of keys
     * @param keys defines the list of keys to add
     * @param propertySets defines the associated property sets
     */
    public addKeysRow(keys: Array<string>, propertySets?: Array<KeyPropertySet>): void {
        const panel = new StackPanel();
        panel.isVertical = false;
        panel.isFocusInvisible = true;

        let maxKey: Nullable<Button> = null;
        for (let i = 0; i < keys.length; i++) {
            let properties = null;

            if (propertySets && propertySets.length === keys.length) {
                properties = propertySets[i];
            }

            const key = this._createKey(keys[i], properties);
            if (!maxKey || key.heightInPixels > maxKey.heightInPixels) {
                maxKey = key;
            }

            panel.addControl(key);
        }

        panel.height = maxKey ? maxKey.height : this.defaultButtonHeight;

        this.addControl(panel);
    }

    /**
     * Set the shift key to a specific state
     * @param shiftState defines the new shift state
     */
    public applyShiftState(shiftState: number): void {
        if (!this.children) {
            return;
        }

        for (let i = 0; i < this.children.length; i++) {
            const row = this.children[i];
            if (!row || !(<Container>row).children) {
                continue;
            }

            const rowContainer = <Container>row;
            for (let j = 0; j < rowContainer.children.length; j++) {
                const button = rowContainer.children[j] as Button;

                if (!button || !button.children[0]) {
                    continue;
                }

                const button_tblock = button.children[0] as TextBlock;

                if (button_tblock.text === "\u21E7") {
                    button.color = shiftState ? this.shiftButtonColor : this.defaultButtonColor;
                    button.thickness = shiftState > 1 ? this.selectedShiftThickness : 0;
                }

                button_tblock.text = shiftState > 0 ? button_tblock.text.toUpperCase() : button_tblock.text.toLowerCase();
            }
        }
    }

    private _currentlyConnectedInputText: Nullable<InputText | InputTextArea> = null;
    private _connectedInputTexts: ConnectedInputText[] = [];
    private _onKeyPressObserver: Nullable<Observer<string>> = null;

    /** Gets the input text control currently attached to the keyboard */
    public get connectedInputText(): Nullable<InputText | InputTextArea> {
        return this._currentlyConnectedInputText;
    }

    /**
     * Connects the keyboard with an input text control
     *
     * @param input defines the target control
     */
    public connect(input: InputText): void {
        const inputTextAlreadyConnected = this._connectedInputTexts.some((a) => a.input === input);
        if (inputTextAlreadyConnected) {
            return;
        }

        if (this._onKeyPressObserver === null) {
            this._onKeyPressObserver = this.onKeyPressObservable.add((key) => {
                if (!this._currentlyConnectedInputText) {
                    return;
                }

                this._currentlyConnectedInputText._host.focusedControl = this._currentlyConnectedInputText;

                switch (key) {
                    case "\u21E7":
                        this.shiftState++;
                        if (this.shiftState > 2) {
                            this.shiftState = 0;
                        }
                        this.applyShiftState(this.shiftState);
                        return;
                    case "\u2190":
                        if (this._currentlyConnectedInputText instanceof InputTextArea) {
                            this._currentlyConnectedInputText.alternativeProcessKey("Backspace");
                        } else {
                            this._currentlyConnectedInputText.processKey(8);
                        }
                        return;
                    case "\u21B5":
                        if (this._currentlyConnectedInputText instanceof InputTextArea) {
                            this._currentlyConnectedInputText.alternativeProcessKey("Enter");
                        } else {
                            this._currentlyConnectedInputText.processKey(13);
                        }
                        return;
                }
                if (this._currentlyConnectedInputText instanceof InputTextArea) {
                    this._currentlyConnectedInputText.alternativeProcessKey("", this.shiftState ? key.toUpperCase() : key);
                } else {
                    this._currentlyConnectedInputText.processKey(-1, this.shiftState ? key.toUpperCase() : key);
                }

                if (this.shiftState === 1) {
                    this.shiftState = 0;
                    this.applyShiftState(this.shiftState);
                }
            });
        }

        this.isVisible = false;
        this._currentlyConnectedInputText = input;
        input._connectedVirtualKeyboard = this;

        // Events hooking
        const onFocusObserver: Nullable<Observer<Control>> = input.onFocusObservable.add(() => {
            this._currentlyConnectedInputText = input;
            input._connectedVirtualKeyboard = this;
            this.isVisible = true;
        });

        const onBlurObserver: Nullable<Observer<Control>> = input.onBlurObservable.add(() => {
            input._connectedVirtualKeyboard = null;
            this._currentlyConnectedInputText = null;
            this.isVisible = false;
        });

        this._connectedInputTexts.push({
            input,
            onBlurObserver,
            onFocusObserver,
        });
    }

    /**
     * Disconnects the keyboard from connected InputText controls
     *
     * @param input optionally defines a target control, otherwise all are disconnected
     */
    public disconnect(input?: InputText): void {
        if (input) {
            // .find not available on IE
            const filtered = this._connectedInputTexts.filter((a) => a.input === input);
            if (filtered.length === 1) {
                this._removeConnectedInputObservables(filtered[0]);

                this._connectedInputTexts = this._connectedInputTexts.filter((a) => a.input !== input);
                if (this._currentlyConnectedInputText === input) {
                    this._currentlyConnectedInputText = null;
                }
            }
        } else {
            for (const connectedInputText of this._connectedInputTexts) {
                this._removeConnectedInputObservables(connectedInputText);
            }
            this._connectedInputTexts.length = 0;
        }

        if (this._connectedInputTexts.length === 0) {
            this._currentlyConnectedInputText = null;
            this.onKeyPressObservable.remove(this._onKeyPressObserver);
            this._onKeyPressObserver = null;
        }
    }

    private _removeConnectedInputObservables(connectedInputText: ConnectedInputText): void {
        connectedInputText.input._connectedVirtualKeyboard = null;
        connectedInputText.input.onFocusObservable.remove(connectedInputText.onFocusObserver);
        connectedInputText.input.onBlurObservable.remove(connectedInputText.onBlurObserver);
    }

    /**
     * Release all resources
     */
    public override dispose(): void {
        super.dispose();

        this.disconnect();
    }

    // Statics

    /**
     * Creates a new keyboard using a default layout
     *
     * @param name defines control name
     * @returns a new VirtualKeyboard
     */
    public static CreateDefaultLayout(name?: string): VirtualKeyboard {
        const returnValue = new VirtualKeyboard(name);

        returnValue.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "\u2190"]);
        returnValue.addKeysRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]);
        returnValue.addKeysRow(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\u21B5"]);
        returnValue.addKeysRow(["\u21E7", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]);
        returnValue.addKeysRow([" "], [{ width: "200px" }]);

        return returnValue;
    }

    /**
     * @internal
     */
    public override _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        super._parseFromContent(serializedObject, host);
        for (const row of this.children) {
            if (row.getClassName() === "StackPanel") {
                const stackPanel = row as StackPanel;
                for (const key of stackPanel.children) {
                    if (key.getClassName() === "Button" && key.name) {
                        key.onPointerUpObservable.add(() => {
                            this.onKeyPressObservable.notifyObservers(key.name as string);
                        });
                    }
                }
            }
        }
    }
}

RegisterClass("BABYLON.GUI.VirtualKeyboard", VirtualKeyboard);

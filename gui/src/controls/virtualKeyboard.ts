/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    export class KeyPropertySet {
        width?: string;
        height?: string;
        paddingLeft?: string;
        paddingRight?: string;
        paddingTop?: string;
        paddingBottom?: string;
        color?: string;
        background?: string;
    }

    export class VirtualKeyboard extends StackPanel {
        public onKeyPressObservable = new Observable<string>();

        public defaultButtonWidth = "40px";
        public defaultButtonHeight = "40px";

        public defaultButtonPaddingLeft= "2px";
        public defaultButtonPaddingRight = "2px";
        public defaultButtonPaddingTop = "2px";
        public defaultButtonPaddingBottom = "2px";    
        
        public defaultButtonColor = "#DDD";
        public defaultButtonBackground = "#070707";    
        
        protected _getTypeName(): string {
            return "VirtualKeyboard";
        }

        private _createKey(key: string, propertySet?: KeyPropertySet) {
            var button = Button.CreateSimpleButton(key, key);
            
           
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
        
            button.onPointerUpObservable.add(() => {
                this.onKeyPressObservable.notifyObservers(key);
            });
    
            return button;
        }

        public addKeysRow(keys: Array<string>, propertySets?: Array<KeyPropertySet>): void {
            let panel = new StackPanel();
            panel.isVertical = false;
            panel.isFocusInvisible = true;
        
            for(var i = 0; i < keys.length; i++) {
                let properties = null;

                if (propertySets && propertySets.length === keys.length) {
                    properties = propertySets[i];
                }

                panel.addControl(this._createKey(keys[i], properties));
            }
        
            this.addControl(panel);
        }

        private _connectedInputText: InputText;
        private _onFocusObserver: Observer<InputText>;
        private _onBlurObserver: Observer<InputText>;
        private _onKeyPressObserver: Observer<string>;

        public get connectedInputText(): InputText {
            return this._connectedInputText;
        }

        public connect(input: InputText): void {
            this.isVisible = false;
            this._connectedInputText = input;
            
            // Events hooking
            this._onFocusObserver = input.onFocusObservable.add(() => {
                this.isVisible = true;
            });
    
            this._onBlurObserver = input.onBlurObservable.add(() => {
                this.isVisible = false;
            });		

            this._onKeyPressObserver = this.onKeyPressObservable.add((key) => {
                switch (key) {
                    case "\u2190":
                        this._connectedInputText.processKey(8);
                        return;
                    case "\u21B5":
                        this._connectedInputText.processKey(13);
                        return;                        
                }

                this._connectedInputText.processKey(-1, key);
            });
        }

        public disconnect(): void {
            if (!this._connectedInputText) {
                return;
            }

            this._connectedInputText.onFocusObservable.remove(this._onFocusObserver);
            this._connectedInputText.onBlurObservable.remove(this._onBlurObserver);
            this.onKeyPressObservable.remove(this._onKeyPressObserver);

            this._connectedInputText = null;
        }

        // Statics
        public static CreateDefaultLayout(): VirtualKeyboard {
            let returnValue = new VirtualKeyboard();

            returnValue.addKeysRow(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0","\u2190"]);
            returnValue.addKeysRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]);
            returnValue.addKeysRow(["a", "s", "d", "f", "g", "h", "j", "k", "l",";","'","\u21B5"]);
            returnValue.addKeysRow(["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]);
            returnValue.addKeysRow([" "], [{ width: "200px"}]);
        
            return returnValue;
        }
    }
}
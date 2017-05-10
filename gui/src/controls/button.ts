/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Button extends Rectangle {      
        constructor(public name: string) {
            super(name);
        }

        // While being a container, the button behaves like a control.
        public _processPicking(x: number, y: number, type: number): boolean {
            if (!this._contains(x, y)) {
                return false;
            }

            this._processObservables(type);

            return true;
        }

        // Statics
        public static CreateImageButton(name: string, text: string, imageUrl: string): Button {
            var result = new Button(name);

            // Adding text
            var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
            textBlock.textWrapping = true;
            textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.marginLeft = "20%";
            result.addControl(textBlock);   

            // Adding image
            var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
            iconImage.width = "20%";
            iconImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
            iconImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            result.addControl(iconImage);            

            return result;
        }
    }    
}
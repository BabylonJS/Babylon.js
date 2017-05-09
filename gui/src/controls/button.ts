/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Button extends Rectangle {      
        constructor(public name: string) {
            super(name);
        }

        // Statics
        public static CreateImageButton(name: string, text: string, imageUrl: string): Button {
            var result = new Button(name);

            // Adding text
            var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
            textBlock.textWrapping = true;
            textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.marginLeft = 0.2;
            result.addControl(textBlock);   

            // Adding image
            var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
            iconImage.width = 0.2;
            iconImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
            iconImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            result.addControl(iconImage);            

            return result;
        }
    }    
}
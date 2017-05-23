/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Button extends Rectangle {      
        constructor(public name: string) {
            super(name);
            this.thickness = 1;
            this.isPointerBlocker = true;
        }

        // While being a container, the button behaves like a control.
        public _processPicking(x: number, y: number, type: number): boolean {
            if (!this.contains(x, y)) {
                return false;
            }

            this._processObservables(type);

            return true;
        }

        protected _onPointerEnter(): void {
            this.scaleX += 0.01;
            this.scaleY += 0.01;
            super._onPointerEnter();
        }

        protected _onPointerOut(): void {
            this.scaleX -= 0.01;
            this.scaleY -= 0.01;

            super._onPointerOut();
        }

        protected _onPointerDown(): void {
            this.scaleX -= 0.05;
            this.scaleY -= 0.05;

            super._onPointerDown();
        }

        protected _onPointerUp (): void {
            this.scaleX += 0.05;
            this.scaleY += 0.05;

            super._onPointerUp();
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

        public static CreateSimpleButton(name: string, text: string): Button {
            var result = new Button(name);

            // Adding text
            var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
            textBlock.textWrapping = true;
            textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            result.addControl(textBlock);           

            return result;
        }
    }    
}
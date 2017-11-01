/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Button extends Rectangle {    
        public pointerEnterAnimation: () => void;
        public pointerOutAnimation: () => void;
        public pointerDownAnimation: () => void;
        public pointerUpAnimation: () => void;

        constructor(public name?: string) {
            super(name);
          
            this.thickness = 1;
            this.isPointerBlocker = true;

            this.pointerEnterAnimation = () => {
                this.alpha -= 0.1;
            }

            this.pointerOutAnimation = () => {
                this.alpha += 0.1;
            }    

            this.pointerDownAnimation = () => {
                this.scaleX -= 0.05;
                this.scaleY -= 0.05;
            }

            this.pointerUpAnimation = () => {
                this.scaleX += 0.05;
                this.scaleY += 0.05;
            }                      
        }

        protected _getTypeName(): string {
            return "Button";
        }

        // While being a container, the button behaves like a control.
        public _processPicking(x: number, y: number, type: number, buttonIndex: number): boolean {
            if (!this.isHitTestVisible || !this.isVisible || this.notRenderable) {
                return false;
            }

            if (!super.contains(x, y)) {
                return false;
            }

            this._processObservables(type, x, y, buttonIndex);

            return true;
        }

        public _onPointerEnter(target: Control): boolean {
            if (!super._onPointerEnter(target)) {
                return false;
            }

            if (this.pointerEnterAnimation) {
                this.pointerEnterAnimation();
            }

            return true;
        }

        public _onPointerOut(target: Control): void {
            if (this.pointerOutAnimation) {
                this.pointerOutAnimation();
            }

            super._onPointerOut(target);
        }

        public _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean {
            if (!super._onPointerDown(target, coordinates, buttonIndex)) {
                return false;
            }


            if (this.pointerDownAnimation) {
                this.pointerDownAnimation();
            }

            return true;
        }

        public _onPointerUp(target: Control, coordinates: Vector2, buttonIndex: number): void {
            if (this.pointerUpAnimation) {
                this.pointerUpAnimation();
            }

            super._onPointerUp(target, coordinates, buttonIndex);
        }        

        // Statics
        public static CreateImageButton(name: string, text: string, imageUrl: string): Button {
            var result = new Button(name);

            // Adding text
            var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
            textBlock.textWrapping = true;
            textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            textBlock.paddingLeft = "20%";
            result.addControl(textBlock);   

            // Adding image
            var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
            iconImage.width = "20%";
            iconImage.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
            iconImage.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            result.addControl(iconImage);            

            return result;
        }

        public static CreateImageOnlyButton(name: string, imageUrl: string): Button {
            var result = new Button(name);

            // Adding image
            var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
            iconImage.stretch = BABYLON.GUI.Image.STRETCH_FILL;
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
        
        public static CreateImageWithCenterTextButton(name: string, text: string, imageUrl: string): Button {
            var result = new Button(name);

            // Adding image
            var iconImage = new BABYLON.GUI.Image(name + "_icon", imageUrl);
            iconImage.stretch = BABYLON.GUI.Image.STRETCH_FILL;
            result.addControl(iconImage);         
            
            // Adding text
            var textBlock = new BABYLON.GUI.TextBlock(name + "_button", text);
            textBlock.textWrapping = true;
            textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            result.addControl(textBlock);   

            return result;
        }
    }    
}

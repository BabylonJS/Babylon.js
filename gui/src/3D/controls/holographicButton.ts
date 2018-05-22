/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _backPlate: Mesh;
        private _textPlate: Mesh;
        private _frontPlate: Mesh;
        private _backFluentMaterial: FluentMaterial;
        private _frontFluentMaterial: FluentMaterial;
        private _text: string;
        // private _imageUrl: string;

        /**
         * Gets or sets text for the button
         */
        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            if (this._text === value) {
                return;
            }

            this._text = value;
            this._rebuildContent();
        }

        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string) {
            super(name);

            // Default animations

            this.pointerEnterAnimation = () => {
                if (!this.mesh) {
                    return;
                }
                this._frontPlate.setEnabled(true);
            }

            this.pointerOutAnimation = () => {
                if (!this.mesh) {
                    return;
                }
                this._frontPlate.setEnabled(false);
            }                      
        }
    
        protected _getTypeName(): string {
            return "HolographicButton";
        }        

        private _rebuildContent(): void {
            let panel = new StackPanel();
            panel.isVertical = true;

            if (this._text) {
                let text = new BABYLON.GUI.TextBlock();
                text.text = this._text;
                text.color = "white";
                text.height = "30px";
                text.fontSize = 24;
                panel.addControl(text);
            }

            if (this._frontPlate) {
                this.content = panel;
            }
        }

        // Mesh association
        protected _createNode(scene: Scene): TransformNode {
            this._backPlate = MeshBuilder.CreateBox(this.name + "BackMesh", {
                width: 1.0, 
                height: 1.0,
                depth: 0.08
            }, scene); 

            this._frontPlate = MeshBuilder.CreateBox(this.name + "FrontMesh", {
                width: 1.0, 
                height: 1.0,
                depth: 0.08
            }, scene); 

            this._frontPlate.parent = this._backPlate;
            this._frontPlate.position.z = -0.08;
            this._frontPlate.isPickable = false;
            this._frontPlate.setEnabled(false);

            this._textPlate= <Mesh>super._createNode(scene);
            this._textPlate.parent = this._backPlate;
            this._textPlate.position.z = -0.08;
            this._textPlate.isPickable = false;            
           
            return this._backPlate;
        }

        protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
            (<any>this._currentMaterial).emissiveTexture = facadeTexture;
            (<any>this._currentMaterial).opacityTexture = facadeTexture;
        }        

        protected _affectMaterial(mesh: Mesh) {
            this._backFluentMaterial = new FluentMaterial(this.name + "Back Material", mesh.getScene());
            mesh.material = this._backFluentMaterial;

            this._frontFluentMaterial = new FluentMaterial(this.name + "Front Material", mesh.getScene());
            this._frontPlate.material = this._frontFluentMaterial;
            this._frontFluentMaterial.innerGlowColorIntensity = 0; // No inner glow
            this._frontFluentMaterial.alpha = 0.5; // Additive
            this._frontFluentMaterial.renderBorders = true;

            super._affectMaterial(this._textPlate);
            this._rebuildContent();
        }
    }
}
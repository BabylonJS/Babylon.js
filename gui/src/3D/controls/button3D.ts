/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a button in 3D
     */
    export class Button3D extends Control3D {
        /** @hidden */
        protected _currentMaterial: Material;
        private _facadeTexture: AdvancedDynamicTexture;
        private _content: Control;

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
                (<StandardMaterial>this._currentMaterial).emissiveColor = Color3.Red();
            }

            this.pointerOutAnimation = () => {
                (<StandardMaterial>this._currentMaterial).emissiveColor = Color3.Black();
            }    

            this.pointerDownAnimation = () => {
                if (!this.mesh) {
                    return;
                }

                this.mesh.scaling.scaleInPlace(0.95);
            }

            this.pointerUpAnimation = () => {
                if (!this.mesh) {
                    return;
                }

                this.mesh.scaling.scaleInPlace(1.0 / 0.95);
            }                     
        }

        /**
         * Gets or sets the GUI 2D content used to display the button's facade
         */
        public get content(): Control {
            return this._content;
        }

        public set content(value: Control) {
            if (!this._host || !this._host.utilityLayer) {
                return;
            }

            if (!this._facadeTexture) {
                this._facadeTexture = new BABYLON.GUI.AdvancedDynamicTexture("Facade", 512, 512, this._host.utilityLayer.utilityLayerScene, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
                this._facadeTexture.rootContainer.scaleX = 2;
                this._facadeTexture.rootContainer.scaleY = 2;
                this._facadeTexture.premulAlpha = true;
            }
            
            this._facadeTexture.addControl(value);
        
            (<any>this._currentMaterial).emissiveTexture = this._facadeTexture;
        }

        protected _getTypeName(): string {
            return "Button3D";
        }        

        // Mesh association
        protected _createMesh(scene: Scene): Mesh {
            var faceUV = new Array(6);

            for (var i = 0; i < 6; i++) {
                faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
            }
            faceUV[1] = new BABYLON.Vector4(0, 0, 1, 1);

            let mesh = MeshBuilder.CreateBox(this.name + "Mesh", {
                width: 1.0, 
                height: 1.0,
                depth: 0.1,
                faceUV: faceUV
            }, scene); 
           
            return mesh;
        }

        protected _affectMaterial(mesh: Mesh) {
            let material = new StandardMaterial(this.name + "Material", mesh.getScene());
            material.specularColor = Color3.Black();

            mesh.material = material;
            this._currentMaterial = material;
        }
    }
}
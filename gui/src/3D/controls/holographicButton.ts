/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _frontPlate: Mesh;
        private _fluentMaterial: FluentMaterial;

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
                this._frontPlate.edgesRenderer!.isEnabled = true;
            }

            this.pointerOutAnimation = () => {
                if (!this.mesh) {
                    return;
                }
                this._frontPlate.edgesRenderer!.isEnabled = false;
            }                      
        }
    
        protected _getTypeName(): string {
            return "HolographicButton";
        }        

        // Mesh association
        protected _createNode(scene: Scene): TransformNode {
            var mesh = <Mesh>super._createNode(scene);

            this._frontPlate= <Mesh>super._createNode(scene);
            this._frontPlate.parent = mesh;
            this._frontPlate.position.z = -0.05;
            this._frontPlate.isPickable = false;

            this._frontPlate.edgesWidth = 1.0;
            this._frontPlate.edgesColor = new Color4(1.0, 1.0, 1.0, 1.0);
            this._frontPlate.enableEdgesRendering();
            this._frontPlate.edgesRenderer!.isEnabled = false;
            
            return mesh;
        }

        protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
            (<any>this._currentMaterial).emissiveTexture = facadeTexture;
            (<any>this._currentMaterial).opacityTexture = facadeTexture;
        }        

        protected _affectMaterial(mesh: Mesh) {
            super._affectMaterial(this._frontPlate);
            this._fluentMaterial = new FluentMaterial(this.name + "Material", mesh.getScene());

            mesh.material = this._fluentMaterial;
        }
    }
}
/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _frontPlate: Mesh;

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

        // Mesh association
        protected _createNode(scene: Scene): TransformNode {
            var mesh = <Mesh>super._createNode(scene);

            this._frontPlate= <Mesh>super._createNode(scene);
            this._frontPlate.parent = mesh;
            this._frontPlate.position.z = -0.05;
            this._frontPlate.setEnabled(false);
            this._frontPlate.isPickable = false;
            this._frontPlate.visibility = 0.001;

            this._frontPlate.edgesWidth = 1.0;
            this._frontPlate.edgesColor = new Color4(1.0, 1.0, 1.0, 1.0);
            this._frontPlate.enableEdgesRendering();
            
            return mesh;
        }

        protected _affectMaterial(mesh: Mesh) {
            this._currentMaterial = new FluentMaterial(this.name + "Material", mesh.getScene());

            mesh.material = this._currentMaterial;
        }
    }
}
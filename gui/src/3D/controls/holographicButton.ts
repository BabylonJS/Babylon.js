/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a holographic button in 3D
     */
    export class HolographicButton extends Button3D {
        private _edgesRenderer: EdgesRenderer;
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
                this._edgesRenderer.isEnabled = true;
            }

            this.pointerOutAnimation = () => {
                if (!this.mesh) {
                    return;
                }
                this._edgesRenderer.isEnabled = false;
            }                      
        }
    
        protected _getTypeName(): string {
            return "HolographicButton";
        }        

        // Mesh association
        protected _createMesh(scene: Scene): Mesh {
            var mesh = super._createMesh(scene);

            mesh.edgesWidth = 0.5;
            mesh.edgesColor = new Color4(1.0, 1.0, 1.0, 1.0);
            mesh.enableEdgesRendering();
            this._edgesRenderer = mesh.edgesRenderer!;
            this._edgesRenderer.isEnabled = false
            
            return mesh;
        }

        protected _affectMaterial(mesh: Mesh) {
            this._currentMaterial = new FluentMaterial(this.name + "Material", mesh.getScene());

            mesh.material = this._currentMaterial;
        }
    }
}
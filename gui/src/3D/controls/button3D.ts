/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create a button in 3D
     */
    export class Button3D extends Control3D {
        
        /**
         * Creates a new button
         * @param name defines the control name
         */
        constructor(name?: string) {
            super(name);
        }

        protected _getTypeName(): string {
            return "Button3D";
        }        

        // Mesh association
        protected _createMesh(scene: Scene): Mesh {
            return MeshBuilder.CreateBox(this.name + "Mesh", {
                width: 1.0, 
                height: 1.0,
                depth: 0.1
            }, scene);            
        }
    }
}
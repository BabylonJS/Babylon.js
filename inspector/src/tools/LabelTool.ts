module INSPECTOR {
     
    export class LabelTool extends AbstractTool {

        /** True if label are displayed, false otherwise */
        private _isDisplayed         : boolean            = false;
        private _labels              : Array<HTMLElement> = [];
        private _camera              : BABYLON.Camera;
        private _transformationMatrix: BABYLON.Matrix     = BABYLON.Matrix.Identity();

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-tags', parent, inspector, 'Display mesh names on the canvas');            
        }

        // Action : Display/hide mesh names on the canvas
        public action() {
            if (this._isDisplayed) {
                // hide all labels
            }
        }
        
        private _update() {
            this._camera       = this._inspector.scene.activeCamera;
            let engine         = this._inspector.scene.getEngine();
            let viewport       = this._camera.viewport;
            let globalViewport = viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            this._camera.getViewMatrix().multiplyToRef(this._camera.getProjectionMatrix(), this._transformationMatrix);
                    
            // Old method
            // let meshes = this._camera.getActiveMeshes();
            // let projectedPosition: BABYLON.Vector3;
            // for (let index = 0; index < meshes.length; index++) {
            //     let mesh = meshes.data[index];

            //     let position = mesh.getBoundingInfo().boundingSphere.center;
            //     projectedPosition = BABYLON.Vector3.Project(position, mesh.getWorldMatrix(), this._transformationMatrix, globalViewport);

            //     this._renderLabel(mesh.name, projectedPosition, 12,
            //         () => { mesh.renderOverlay = !mesh.renderOverlay },
            //         () => { return mesh.renderOverlay ? 'red' : 'black'; });
            // }
        }
    }
}
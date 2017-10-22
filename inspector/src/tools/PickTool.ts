module INSPECTOR {
     
    export class PickTool extends AbstractTool {
        
        private _isActive : boolean = false;
        private _pickHandler: (evt: PointerEvent) => void;

        constructor(parent:HTMLElement, inspector:Inspector) {
            super('fa-mouse-pointer', parent, inspector, 'Select a mesh in the scene');
            
            // Create handler
            this._pickHandler = this._pickMesh.bind(this);
        }

        // Action : find the corresponding tree item in the correct tab and display it
        public action() {
            if (this._isActive) {
                this._deactivate();
            } else {                 
                this.toHtml().classList.add('active');            
                // Add event handler : pick on a mesh in the scene
                this._inspector.scene.getEngine().getRenderingCanvas().addEventListener('click', this._pickHandler);
                this._isActive = true;
            }
        }
        
        /** Deactivate this tool */
        private _deactivate() {
            this.toHtml().classList.remove('active');            
            // Remove event handler
            this._inspector.scene.getEngine().getRenderingCanvas().removeEventListener('click', this._pickHandler);
            this._isActive = false;
        }
        
        /** Pick a mesh in the scene */
        private _pickMesh(evt: PointerEvent) {
            let pos = this._updatePointerPosition(evt);
            let pi = this._inspector.scene.pick(pos.x, pos.y, (mesh:BABYLON.AbstractMesh) => {return true});
            
            if (pi.pickedMesh) {
                this._inspector.displayObjectDetails(pi.pickedMesh);
            }
            this._deactivate();
        }
        
        private _updatePointerPosition(evt: PointerEvent) : {x:number, y:number}{
            let canvasRect =  this._inspector.scene.getEngine().getRenderingCanvasClientRect();
            let pointerX = evt.clientX - canvasRect.left;
            let pointerY = evt.clientY - canvasRect.top;
            return {x:pointerX, y:pointerY};
        };
    }
}
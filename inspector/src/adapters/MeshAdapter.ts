module INSPECTOR {
    
    export class MeshAdapter 
        extends Adapter 
        implements IToolVisible, IToolDebug, IToolBoundingBox, IToolInfo{

        /** Keep track of the axis of the actual object */ 
        private _axis : Array<BABYLON.Mesh> = [];
        
        constructor(obj:BABYLON.AbstractMesh) {
            super(obj);
        }
        
        /** Returns the name displayed in the tree */
        public id() : string {
            let str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        }
        
        /** Returns the type of this object - displayed in the tree */
        public type() : string{
            return Helpers.GET_TYPE(this._obj);
        }
        
        /** Returns the list of properties to be displayed for this adapter */
        public getProperties() : Array<PropertyLine> {
           let propertiesLines : Array<PropertyLine> = [];
                
            for (let dirty of PROPERTIES['Mesh'].properties) {
                let infos = new Property(dirty, this._obj);
                propertiesLines.push(new PropertyLine(infos));
            }
            return propertiesLines; 
        }
        
        public getTools() : Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new Checkbox(this));
            tools.push(new DebugArea(this));  
            tools.push(new BoundingBox(this));   
            tools.push(new Info(this));   
            return tools;
        }
        
        public setVisible(b:boolean) {
            this._obj.setEnabled(b);
            this._obj.isVisible = b;
        }        
        public isVisible() : boolean {
            return this._obj.isEnabled() && this._obj.isVisible;
        }
        public isBoxVisible() : boolean {
            return (this._obj as BABYLON.AbstractMesh).showBoundingBox;
        }
        public setBoxVisible(b:boolean) {            
            return (this._obj as BABYLON.AbstractMesh).showBoundingBox = b;
        }
 
        public debug(b:boolean) {
            // Draw axis the first time
            if (this._axis.length == 0) {
                this._drawAxis();
            }
            // Display or hide axis
            for (let ax of this._axis) {
                ax.setEnabled(b);
            }
        }

        /** Returns some information about this mesh */
        public getInfo() : string {
            return `${(this._obj as BABYLON.AbstractMesh).getTotalVertices()} vertices`;
        }
        
        /** Overrides super.highlight */
        public highlight(b:boolean) {
            this.actualObject.renderOutline = b;
			this.actualObject.outlineWidth = 0.25;
			this.actualObject.outlineColor = BABYLON.Color3.Yellow();
        }
        /** Draw X, Y and Z axis for the actual object if this adapter.
         * Should be called only one time as it will fill this._axis
         */
        private _drawAxis() {
            this._obj.computeWorldMatrix();
            var m = this._obj.getWorldMatrix();
            
            // Axis
            var x = new BABYLON.Vector3(8,0,0);
            var y = new BABYLON.Vector3(0,8,0);
            var z = new BABYLON.Vector3(0,0,8);
            
            // Draw an axis of the given color
            let _drawAxis = (color, start, end) : BABYLON.LinesMesh => {
                let axis = BABYLON.Mesh.CreateLines("###axis###", [
                    start,
                    end
                ], this._obj.getScene());
                axis.color = color;
                axis.renderingGroupId = 1;
                return axis;
            };
            
            // X axis
            let xAxis = _drawAxis(
                    BABYLON.Color3.Red(), 
                    this._obj.getAbsolutePosition(),
                    BABYLON.Vector3.TransformCoordinates(x, m));
            xAxis.position.subtractInPlace(this._obj.position);
            xAxis.parent = this._obj;
            this._axis.push(xAxis);
            // Y axis        
            let yAxis = _drawAxis(
                    BABYLON.Color3.Green(), 
                    this._obj.getAbsolutePosition(),
                    BABYLON.Vector3.TransformCoordinates(y, m));
            yAxis.parent = this._obj;
            yAxis.position.subtractInPlace(this._obj.position);
            this._axis.push(yAxis);
            // Z axis
            let zAxis = _drawAxis(
                    BABYLON.Color3.Blue(), 
                    this._obj.getAbsolutePosition(),
                    BABYLON.Vector3.TransformCoordinates(z, m));
            zAxis.parent = this._obj;
            zAxis.position.subtractInPlace(this._obj.position);
            this._axis.push(zAxis);
        }
    }
}
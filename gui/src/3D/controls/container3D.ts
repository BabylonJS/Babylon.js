/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create containers for controls
     */
    export class Container3D extends Control3D {
        /**
         * Gets the list of child controls
         */
        protected _children = new Array<Control3D>();

        /**
         * Creates a new container
         * @param name defines the container name
         */
        constructor(name?: string) {
            super(name);
        }

        /**
         * Gets a boolean indicating if the given control is in the children of this control
         * @param control defines the control to check
         * @returns true if the control is in the child list
         */
        public containsControl(control: Control3D): boolean {
            return this._children.indexOf(control) !== -1;
        }

        /**
         * Adds a control to the children of this control
         * @param control defines the control to add
         * @returns the current container
         */
        public addControl(control: Control3D): Container3D {
           var index = this._children.indexOf(control);

            if (index !== -1) {
                return this;
            }
            control.parent = this;
            control._host = this._host;

            this._children.push(control);

            if (this._host.utilityLayer) {
                control._prepareNode(this._host.utilityLayer.utilityLayerScene);

                if (control.node) {
                    control.node.parent = this.node;
                }

                this._arrangeChildren();
            }

            return this;
        }


        /**
         * This function will be called everytime a new control is added 
         */
        protected _arrangeChildren() {
        }

        protected _createNode(scene: Scene): Nullable<TransformNode> {
            return new TransformNode("ContainerNode", scene);
        }

        /**
         * Removes the control from the children of this control
         * @param control defines the control to remove
         * @returns the current container
         */
        public removeControl(control: Control3D): Container3D {
            var index = this._children.indexOf(control);

            if (index !== -1) {
                this._children.splice(index, 1);

                control.parent = null;
            }

            return this;
        }

        protected _getTypeName(): string {
            return "Container3D";
        }
        
        /**
         * Releases all associated resources
         */
        public dispose() {
            for (var control of this._children) {
                control.dispose();
            }

            this._children = [];

            super.dispose();
        }
    }
}
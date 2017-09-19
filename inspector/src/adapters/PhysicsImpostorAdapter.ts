module INSPECTOR {

    export class PhysicsImpostorAdapter
        extends Adapter
        implements IToolVisible {

        private _viewer:BABYLON.Debug.PhysicsViewer;
        private _isVisible = false;

        constructor(obj: BABYLON.PhysicsImpostor, viewer:BABYLON.Debug.PhysicsViewer) {
            super(obj);
            this._viewer = viewer;
        }

        /** Returns the name displayed in the tree */
        public id(): string {
            let str = '';
            let physicsImposter = (<BABYLON.PhysicsImpostor>this._obj);
            if (physicsImposter && physicsImposter.object) {
                str = (<BABYLON.AbstractMesh>physicsImposter.object).name;
            } // otherwise nothing displayed        
            return str;
        }

        /** Returns the type of this object - displayed in the tree */
        public type(): string {
            return Helpers.GET_TYPE(this._obj);
        }

        /** Returns the list of properties to be displayed for this adapter */
        public getProperties(): Array<PropertyLine> {
            return Helpers.GetAllLinesProperties(this._obj);
        }

        public getTools(): Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new Checkbox(this));
            return tools;
        }

        public setVisible(b: boolean) {
            this._isVisible = b;
            if(b){
                this._viewer.showImpostor(this._obj);
            }else{
                this._viewer.hideImpostor(this._obj);
            }
        }
        
        public isVisible(): boolean {
            return this._isVisible;
        }
        
    }
}
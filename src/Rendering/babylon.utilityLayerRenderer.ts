module BABYLON {
    /**
     * Renders a layer on top of an existing scene
     */
    export class UtilityLayerRenderer implements IDisposable {
        /** 
         * The scene that is rendered on top of the original scene
         */ 
        public utilityLayerScene:Scene;

        /**
         *  If the utility layer should automatically be rendered on top of existing scene
        */
        public shouldRender:boolean = true;

        private _afterRenderObservable:Nullable<Observer<Scene>>;
        /**
         * Instantiates a UtilityLayerRenderer
         * @param originalScene the original scene that will be rendered on top of
         */
        constructor(/** the original scene that will be rendered on top of */ public originalScene:Scene){
            // Create scene which will be rendered in the foreground and remove it from being referenced by engine to avoid interfering with existing app
            this.utilityLayerScene = new BABYLON.Scene(originalScene.getEngine());
            originalScene.getEngine().scenes.pop();

            // Render directly on top of existing scene without clearing
            this.utilityLayerScene.clearColor = new BABYLON.Color4(0,0,0,0);
            this.utilityLayerScene.autoClear = false;

            this._afterRenderObservable = this.originalScene.onAfterRenderObservable.add(()=>{
                if(this.shouldRender){
                    this.render();
                }
            })
        }

        /**
         * Renders the utility layers scene on top of the original scene
         */
        public render(){
            this._updateCamera();
            this.utilityLayerScene.render();
        }

        /**
         * Disposes of the renderer
         */
        public dispose(){
            if(this._afterRenderObservable){
                this.originalScene.onAfterRenderObservable.remove(this._afterRenderObservable);
            }
            this.utilityLayerScene.dispose();
        }

        private _updateCamera(){
            this.utilityLayerScene.activeCamera=this.originalScene.activeCamera;
        }
    }
}
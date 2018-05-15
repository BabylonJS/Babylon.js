module BABYLON {
    /**
     * Renders a layer on top of an existing scene
     */
    export class UtilityLayerRenderer implements IDisposable {
        /** 
         * The scene that is rendered on top of the original scene
         */ 
        public utilityLayerScene:Scene
        /**
         * Instantiates a UtilityLayerRenderer
         * @param originalScene the original scene that will be rendered on top of
         */
        constructor(/** the original scene that will be rendered on top of */ public originalScene:Scene){
            // Create scene which will be rendered in the foreground and remove it from being referenced by engine to avoid interfering with existing app
            this.utilityLayerScene = new BABYLON.Scene(originalScene.getEngine());
            originalScene.getEngine().scenes.pop();

            // Render directly on top of existing scene
            this.utilityLayerScene.clearColor = new BABYLON.Color4(0,0,0,0);
            this.utilityLayerScene.autoClear = false;
        }
        /**
         * Renders the utility layers scene on top of the original scene
         */
        public render(){
            this._updateCamera()
            this.utilityLayerScene.render()
        }
        /**
         * @hidden
         */
        public _updateCamera(){
            this.utilityLayerScene.activeCamera=this.originalScene.activeCamera
        }
        /**
         * Disposes of the renderer
         */
        public dispose(){
            this.utilityLayerScene.dispose();
        }
    }
}
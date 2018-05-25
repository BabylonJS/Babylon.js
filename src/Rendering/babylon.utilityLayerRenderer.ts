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

        private _afterRenderObserver:Nullable<Observer<Scene>>;
        private _sceneDisposeObserver:Nullable<Observer<Scene>>;
        /**
         * Instantiates a UtilityLayerRenderer
         * @param originalScene the original scene that will be rendered on top of
         */
        constructor(/** the original scene that will be rendered on top of */ public originalScene:Scene){
            // Create scene which will be rendered in the foreground and remove it from being referenced by engine to avoid interfering with existing app
            this.utilityLayerScene = new BABYLON.Scene(originalScene.getEngine());
            originalScene.getEngine().scenes.pop();

            /*
              Occlusion of the pointer/laser of controller
                    Overlay: No occlusion?
                    Non-overlay: works as expected
                Putting the laser to hit the utility layer
                    Can I update the picked point from the prepointer event?
                Duplicate picking events
                    Handled in utility layer
                What is the api contract of onPointerObservable
?
             */

            // Detach controls on utility scene, events will be fired by logic below to handle picking priority
            this.utilityLayerScene.detachControl();
            originalScene.onPrePointerObservable.add((prePointerInfo, eventState)=>{
                var originalScenePick = prePointerInfo.ray ? originalScene.pickWithRay(prePointerInfo.ray) : originalScene.pick(originalScene.pointerX, originalScene.pointerY);
                var utilityScenePick = prePointerInfo.ray ? this.utilityLayerScene.pickWithRay(prePointerInfo.ray) : this.utilityLayerScene.pick(originalScene.pointerX, originalScene.pointerY);

                // allow every non pointer down event to flow to the utility layer
                if(prePointerInfo.type != BABYLON.PointerEventTypes.POINTERDOWN){
                    this.utilityLayerScene.onPrePointerObservable.notifyObservers(prePointerInfo)
                    if(!prePointerInfo.skipOnPointerObservable){
                        this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick))
                    }
                    return;
                }

                if(this.utilityLayerScene.autoClearDepthAndStencil){
                    // If this layer is an overlay, check if this layer was hit and if so, skip pointer events for the main scene
                    if(utilityScenePick && utilityScenePick.hit){
                        this.utilityLayerScene.onPrePointerObservable.notifyObservers(prePointerInfo)
                        if(!prePointerInfo.skipOnPointerObservable){
                            this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick))
                        }
                        prePointerInfo.skipOnPointerObservable = true;
                    }
                }else{
                    // If the layer can be occluded by the original scene, only fire pointer events to the first layer that hit they ray
                    if(originalScenePick && utilityScenePick){
                        if(utilityScenePick.distance < originalScenePick.distance){
                            this.utilityLayerScene.onPrePointerObservable.notifyObservers(prePointerInfo)
                            if(!prePointerInfo.skipOnPointerObservable){
                                this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick))
                            }
                            prePointerInfo.skipOnPointerObservable = true;
                        }
                    }
                }
                
            })

            // Render directly on top of existing scene without clearing
            this.utilityLayerScene.autoClear = false;

            this._afterRenderObserver = this.originalScene.onAfterRenderObservable.add(()=>{
                if(this.shouldRender){
                    this.render();
                }
            });

            this._sceneDisposeObserver = this.originalScene.onDisposeObservable.add(()=>{
                this.dispose();
            })
            
            this._updateCamera();
        }

        /**
         * Renders the utility layers scene on top of the original scene
         */
        public render(){
            this._updateCamera();
            this.utilityLayerScene.render(false);
        }

        /**
         * Disposes of the renderer
         */
        public dispose(){
            if(this._afterRenderObserver){
                this.originalScene.onAfterRenderObservable.remove(this._afterRenderObserver);
            }
            if(this._sceneDisposeObserver){
                this.originalScene.onDisposeObservable.remove(this._sceneDisposeObserver);
            }
            this.utilityLayerScene.dispose();
        }

        private _updateCamera(){
            this.utilityLayerScene.activeCamera = this.originalScene.activeCamera;
        }
    }
}
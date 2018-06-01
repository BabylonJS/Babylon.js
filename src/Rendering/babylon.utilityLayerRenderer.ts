module BABYLON {
    /**
     * Renders a layer on top of an existing scene
     */
    export class UtilityLayerRenderer implements IDisposable {
        private _pointerCaptures: {[pointerId:number]: boolean} = {};
        private _lastPointerEvents: {[pointerId:number]: number} = {};

        /** 
         * The scene that is rendered on top of the original scene
         */ 
        public utilityLayerScene:Scene;

        /**
         *  If the utility layer should automatically be rendered on top of existing scene
        */
        public shouldRender:boolean = true;
        /**
         * If set to true, only pointer down onPointerObservable events will be blocked when picking is occluded by original scene
         */
        public onlyCheckPointerDownEvents = true;

        /**
         * If set to false, only pointerUp, pointerDown and pointerMove will be sent to the utilityLayerScene (false by default)
         */
        public processAllEvents = false;

        private _afterRenderObserver:Nullable<Observer<Scene>>;
        private _sceneDisposeObserver:Nullable<Observer<Scene>>;
        private _originalPointerObserver:Nullable<Observer<PointerInfoPre>>;
        /**
         * Instantiates a UtilityLayerRenderer
         * @param originalScene the original scene that will be rendered on top of
         */
        constructor(/** the original scene that will be rendered on top of */ public originalScene:Scene){
            // Create scene which will be rendered in the foreground and remove it from being referenced by engine to avoid interfering with existing app
            this.utilityLayerScene = new BABYLON.Scene(originalScene.getEngine());
            originalScene.getEngine().scenes.pop();

            // Detach controls on utility scene, events will be fired by logic below to handle picking priority
            this.utilityLayerScene.detachControl();
            this._originalPointerObserver = originalScene.onPrePointerObservable.add((prePointerInfo, eventState) => {

                if (!this.processAllEvents) {
                    if (prePointerInfo.type !== BABYLON.PointerEventTypes.POINTERMOVE
                        && prePointerInfo.type !== BABYLON.PointerEventTypes.POINTERUP
                        && prePointerInfo.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                        return;
                    }
                }

                var utilityScenePick = prePointerInfo.ray ? this.utilityLayerScene.pickWithRay(prePointerInfo.ray) : this.utilityLayerScene.pick(originalScene.pointerX, originalScene.pointerY);
                if(!prePointerInfo.ray && utilityScenePick){
                    prePointerInfo.ray = utilityScenePick.ray;
                }

                // always fire the prepointer oversvable
                this.utilityLayerScene.onPrePointerObservable.notifyObservers(prePointerInfo)

                // allow every non pointer down event to flow to the utility layer
                if(this.onlyCheckPointerDownEvents && prePointerInfo.type != BABYLON.PointerEventTypes.POINTERDOWN){
                    if(!prePointerInfo.skipOnPointerObservable){
                        this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick))
                    }
                    return;
                }

                if(this.utilityLayerScene.autoClearDepthAndStencil){
                    // If this layer is an overlay, check if this layer was hit and if so, skip pointer events for the main scene
                    if(utilityScenePick && utilityScenePick.hit){
                        
                        if(!prePointerInfo.skipOnPointerObservable){
                            this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick))
                        }
                        prePointerInfo.skipOnPointerObservable = true;
                    }
                }else{
                    var originalScenePick = prePointerInfo.ray ? originalScene.pickWithRay(prePointerInfo.ray) : originalScene.pick(originalScene.pointerX, originalScene.pointerY);
                    let pointerEvent = <PointerEvent>(prePointerInfo.event);

                    // If the layer can be occluded by the original scene, only fire pointer events to the first layer that hit they ray
                    if(originalScenePick && utilityScenePick){
                        if (utilityScenePick.distance === 0) {
                            if (prePointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                                this._pointerCaptures[pointerEvent.pointerId] = true;
                            } else if (prePointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
                                this._pointerCaptures[pointerEvent.pointerId] = false;
                            }
                        }

                        if (!this._pointerCaptures[pointerEvent.pointerId] && (utilityScenePick.distance < originalScenePick.distance || originalScenePick.distance === 0)){
                            if(!prePointerInfo.skipOnPointerObservable){
                                this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, utilityScenePick))
                                this._lastPointerEvents[pointerEvent.pointerId] = pointerEvent.pointerType;
                            }
                            prePointerInfo.skipOnPointerObservable = utilityScenePick.distance > 0;
                        } else if (!this._pointerCaptures[pointerEvent.pointerId] && (utilityScenePick.distance > originalScenePick.distance)) {
                            // We need to send a last pointup to the utilityLayerScene to make sure animations can complete
                            if (this._lastPointerEvents[pointerEvent.pointerId] !== BABYLON.PointerEventTypes.POINTERUP) {
                                this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(BABYLON.PointerEventTypes.POINTERUP, prePointerInfo.event, utilityScenePick))
                                this._lastPointerEvents[pointerEvent.pointerId] = BABYLON.PointerEventTypes.POINTERUP;                                
                            }
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
            if(this._originalPointerObserver){
                this.originalScene.onPrePointerObservable.remove(this._originalPointerObserver);
            }
            this.utilityLayerScene.dispose();
        }

        private _updateCamera(){
            this.utilityLayerScene.activeCamera = this.originalScene.activeCamera;
        }
    }
}
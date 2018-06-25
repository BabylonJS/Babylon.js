module BABYLON {
    /**
     * Renders a layer on top of an existing scene
     */
    export class UtilityLayerRenderer implements IDisposable {
        private _pointerCaptures: {[pointerId:number]: boolean} = {};
        private _lastPointerEvents: {[pointerId:number]: number} = {};
        private static _defaultUtilityLayer:Nullable<UtilityLayerRenderer> = null;
        public static get defaultUtilityLayer():UtilityLayerRenderer{
            if(UtilityLayerRenderer._defaultUtilityLayer == null){
                UtilityLayerRenderer._defaultUtilityLayer = new UtilityLayerRenderer(BABYLON.Engine.LastCreatedScene!);
                UtilityLayerRenderer._defaultUtilityLayer.originalScene.onDisposeObservable.add(()=>{
                    UtilityLayerRenderer._defaultUtilityLayer = null;
                });
            }
            return UtilityLayerRenderer._defaultUtilityLayer;
        }

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

        /**
         * Observable raised when the pointer move from the utility layer scene to the main scene
         */
        public onPointerOutObservable = new Observable<number>();

        /** Gets or sets a predicate that will be used to indicate utility meshes present in the main scene */
        public mainSceneTrackerPredicate: (mesh: Nullable<AbstractMesh>) => boolean;

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

                let pointerEvent = <PointerEvent>(prePointerInfo.event);
                if (originalScene!.isPointerCaptured(pointerEvent.pointerId)) {
                    this._pointerCaptures[pointerEvent.pointerId] = false;
                    return;
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
                    if (prePointerInfo.type === BABYLON.PointerEventTypes.POINTERUP && this._pointerCaptures[pointerEvent.pointerId]) {
                        this._pointerCaptures[pointerEvent.pointerId] = false;
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
                    if (originalScenePick && utilityScenePick){
                        
                        // No pick in utility scene
                        if (utilityScenePick.distance === 0 && originalScenePick.pickedMesh) {
                            if (this.mainSceneTrackerPredicate && this.mainSceneTrackerPredicate(originalScenePick.pickedMesh)) {
                                // We touched an utility mesh present in the main scene
                                this._notifyObservers(prePointerInfo, originalScenePick, pointerEvent);
                                prePointerInfo.skipOnPointerObservable = true;                             
                            } else if (prePointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                                this._pointerCaptures[pointerEvent.pointerId] = true;
                            } 
                        } else if (!this._pointerCaptures[pointerEvent.pointerId] && (utilityScenePick.distance < originalScenePick.distance || originalScenePick.distance === 0)){
                            // We pick something in utility scene or the pick in utility is closer than the one in main scene
                            this._notifyObservers(prePointerInfo, utilityScenePick, pointerEvent);
                            prePointerInfo.skipOnPointerObservable = utilityScenePick.distance > 0;
                        } else if (!this._pointerCaptures[pointerEvent.pointerId] && (utilityScenePick.distance > originalScenePick.distance)) {
                            // We have a pick in both scenes but main is closer than utility

                            // We touched an utility mesh present in the main scene
                            if (this.mainSceneTrackerPredicate && this.mainSceneTrackerPredicate(originalScenePick.pickedMesh)) {
                                this._notifyObservers(prePointerInfo, originalScenePick, pointerEvent);
                                prePointerInfo.skipOnPointerObservable = true;                             
                            } else if (this._lastPointerEvents[pointerEvent.pointerId]) {
                                // We need to send a last pointerup to the utilityLayerScene to make sure animations can complete
                                this.onPointerOutObservable.notifyObservers(pointerEvent.pointerId);
                                delete this._lastPointerEvents[pointerEvent.pointerId];
                            }
                        }
                        
                        if (prePointerInfo.type === BABYLON.PointerEventTypes.POINTERUP && this._pointerCaptures[pointerEvent.pointerId]) {
                            this._pointerCaptures[pointerEvent.pointerId] = false;
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

        private _notifyObservers(prePointerInfo: PointerInfoPre, pickInfo: PickingInfo, pointerEvent: PointerEvent) {
            if (!prePointerInfo.skipOnPointerObservable){
                this.utilityLayerScene.onPointerObservable.notifyObservers(new PointerInfo(prePointerInfo.type, prePointerInfo.event, pickInfo))
                this._lastPointerEvents[pointerEvent.pointerId] = pointerEvent.pointerType;
            }
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
            this.onPointerOutObservable.clear();

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
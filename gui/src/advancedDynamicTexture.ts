/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export interface IFocusableControl {
        onFocus(): void;
        onBlur(): void;
        processKeyboard(evt: KeyboardEvent): void;
    }

    export class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty = false;
        private _renderObserver: Nullable<Observer<Camera>>;
        private _resizeObserver: Nullable<Observer<Engine>>;
        private _preKeyboardObserver: Nullable<Observer<KeyboardInfoPre>>;
        private _pointerMoveObserver: Nullable<Observer<PointerInfoPre>>;
        private _pointerObserver: Nullable<Observer<PointerInfo>>;
        private _canvasPointerOutObserver: Nullable<Observer<Engine>>;
        private _background: string;
        public _rootContainer = new Container("root");
        public _lastPickedControl: Control;
        public _lastControlOver: Nullable<Control>;
        public _lastControlDown: Nullable<Control>;
        public _capturingControl: Nullable<Control>;
        public _shouldBlockPointer: boolean;
        public _layerToDispose: Nullable<Layer>;
        public _linkedControls = new Array<Control>();
        private _isFullscreen = false;
        private _fullscreenViewport = new Viewport(0, 0, 1, 1);
        private _idealWidth = 0;
        private _idealHeight = 0;
        private _renderAtIdealSize = false;
        private _focusedControl: Nullable<IFocusableControl>;
        private _blockNextFocusCheck = false;

        public get background(): string {
            return this._background;
        }

        public set background(value: string) {
            if (this._background === value) {
                return;
            }

            this._background = value;
            this.markAsDirty();
        }

        public get idealWidth(): number {
            return this._idealWidth;
        }

        public set idealWidth(value: number) {
            if (this._idealWidth === value) {
                return;
            }

            this._idealWidth = value;
            this.markAsDirty();
            this._rootContainer._markAllAsDirty();
        }

        public get idealHeight(): number {
            return this._idealHeight;
        }

        public set idealHeight(value: number) {
            if (this._idealHeight === value) {
                return;
            }

            this._idealHeight = value;
            this.markAsDirty();
            this._rootContainer._markAllAsDirty();
        }     

        public get renderAtIdealSize(): boolean {
            return this._renderAtIdealSize;
        }

        public set renderAtIdealSize(value: boolean) {
            if (this._renderAtIdealSize === value) {
                return;
            }

            this._renderAtIdealSize = value;
            this._onResize();
        }    

        public get layer(): Nullable<Layer> {
            return this._layerToDispose;
        }   

        public get rootContainer(): Container {
            return this._rootContainer;
        }

        public get focusedControl(): Nullable<IFocusableControl> {
            return this._focusedControl;
        }

        public set focusedControl(control: Nullable<IFocusableControl>) {
            if (this._focusedControl == control) {
                return;
            }

            if (this._focusedControl) {
                this._focusedControl.onBlur();
            }

            if (control) {
                control.onFocus();
            }

            this._focusedControl = control;
        }
        
        public get isForeground(): boolean {
            if (!this.layer) {
                return true;
            }
            return (!this.layer.isBackground);
        }

        public set isForeground(value: boolean) {
            if (!this.layer) {
                return;
            }            
            if (this.layer.isBackground === !value) {
                return;
            }
            this.layer.isBackground = !value;
        }   
       
        constructor(name: string, width = 0, height = 0, scene: Nullable<Scene>, generateMipMaps = false, samplingMode = Texture.NEAREST_SAMPLINGMODE) {
            super(name, {width: width, height: height}, scene, generateMipMaps, samplingMode, Engine.TEXTUREFORMAT_RGBA);

            scene = this.getScene();

            if (!scene || !this._texture) {
                return;
            }

            this._renderObserver = scene.onBeforeCameraRenderObservable.add((camera: Camera) => this._checkUpdate(camera));
            this._preKeyboardObserver = scene.onPreKeyboardObservable.add(info => {
                if (!this._focusedControl) {
                    return;
                }

                if (info.type === KeyboardEventTypes.KEYDOWN) {
                    this._focusedControl.processKeyboard(info.event);
                }

                info.skipOnPointerObservable = true;
            });

            this._rootContainer._link(null, this);

            this.hasAlpha = true;

            if (!width || !height) {
                this._resizeObserver = scene.getEngine().onResizeObservable.add(() => this._onResize());
                this._onResize();
            }

            this._texture.isReady = true;
        }

        public executeOnAllControls(func: (control: Control) => void, container?: Container) {
            if (!container) {
                container = this._rootContainer;
            }

            for (var child of container.children) {               
                if ((<any>child).children) {
                    this.executeOnAllControls(func, (<Container>child));
                    continue;
                }
                func(child);
            }
        }

        public markAsDirty() {
            this._isDirty = true;
        }

        public addControl(control: Control): AdvancedDynamicTexture {
            this._rootContainer.addControl(control);

            return this;
        }

        public removeControl(control: Control): AdvancedDynamicTexture {
            this._rootContainer.removeControl(control);
            return this;
        }

        public dispose(): void {
            let scene = this.getScene();

            if (!scene) {
                return;
            }

            scene.onBeforeCameraRenderObservable.remove(this._renderObserver);

            if (this._resizeObserver) {
                scene.getEngine().onResizeObservable.remove(this._resizeObserver);
            }

            if (this._pointerMoveObserver) {
                scene.onPrePointerObservable.remove(this._pointerMoveObserver);
            }

            if (this._pointerObserver) {
                scene.onPointerObservable.remove(this._pointerObserver);
            }

            if (this._preKeyboardObserver) {
                scene.onPreKeyboardObservable.remove(this._preKeyboardObserver);
            }

            if (this._canvasPointerOutObserver) {
                scene.getEngine().onCanvasPointerOutObservable.remove(this._canvasPointerOutObserver);
            }

            if (this._layerToDispose) {
                this._layerToDispose.texture = null;
                this._layerToDispose.dispose();
                this._layerToDispose = null;
            }

            this._rootContainer.dispose();

            super.dispose();
        }

        private _onResize(): void {
            let scene = this.getScene();
            
            if (!scene) {
                return;
            }            

            // Check size
            var engine = scene.getEngine();
            var textureSize = this.getSize();
            var renderWidth = engine.getRenderWidth();
            var renderHeight = engine.getRenderHeight();

            if (this._renderAtIdealSize) {
                if (this._idealWidth) {
                    renderHeight = (renderHeight * this._idealWidth) / renderWidth;
                    renderWidth = this._idealWidth;
                } else if (this._idealHeight) {
                    renderWidth = (renderWidth * this._idealHeight) / renderHeight;
                    renderHeight = this._idealHeight;                    
                }
            }

            if (textureSize.width !== renderWidth || textureSize.height !== renderHeight) {
                this.scaleTo(renderWidth, renderHeight);

                this.markAsDirty();

                if (this._idealWidth || this._idealHeight) {
                    this._rootContainer._markAllAsDirty();
                }                
            }
        }

        public _getGlobalViewport(scene: Scene): Viewport {
            var engine = scene.getEngine();
            return this._fullscreenViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
        }

        private _checkUpdate(camera: Camera): void {
            if (this._layerToDispose) {
                if ((camera.layerMask & this._layerToDispose.layerMask) === 0) {
                    return;
                }
            }

            if (this._isFullscreen && this._linkedControls.length) {
                var scene = this.getScene();

                if (!scene) {
                    return;
                }

                var globalViewport = this._getGlobalViewport(scene);

                for (var control of this._linkedControls) {
                    if (!control.isVisible) {
                        continue;
                    }

                    var mesh = control._linkedMesh;

                    if (!mesh || mesh.isDisposed()) {
                        Tools.SetImmediate(()=>{
                            control.linkWithMesh(null);
                        });
                        
                        continue;
                    }
                    
                    var position = mesh.getBoundingInfo().boundingSphere.center;
                    var projectedPosition = Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);

                    if (projectedPosition.z < 0 || projectedPosition.z > 1) {
                        control.notRenderable = true;
                        continue;
                    }
                    control.notRenderable = false;
                    control._moveToProjectedPosition(projectedPosition);
                }
            }

            if (!this._isDirty && !this._rootContainer.isDirty) {
                return;
            }
            this._isDirty = false;

            this._render();
            this.update();
        }

        private _render(): void {
            var textureSize = this.getSize();
            var renderWidth = textureSize.width;
            var renderHeight = textureSize.height;

            // Clear
            var context = this.getContext();
            context.clearRect(0, 0, renderWidth, renderHeight);
            if (this._background) {
                context.save();
                context.fillStyle = this._background;
                context.fillRect(0, 0, renderWidth, renderHeight);
                context.restore();
            }

            // Render
            context.font = "18px Arial";
            context.strokeStyle = "white";
            var measure = new Measure(0, 0, renderWidth, renderHeight);
            this._rootContainer._draw(measure, context);
        }

        private _doPicking(x: number, y: number, type: number, buttonIndex: number): void {
            var scene = this.getScene();

            if (!scene) {
                return;
            }

            var engine = scene.getEngine();
            var textureSize = this.getSize();

            if (this._isFullscreen) {
                x = x * (textureSize.width / engine.getRenderWidth());
                y = y * (textureSize.height / engine.getRenderHeight());
            }
            
            if (this._capturingControl) {
                this._capturingControl._processObservables(type, x, y, buttonIndex);
                return;
            }

            if (!this._rootContainer._processPicking(x, y, type, buttonIndex)) {

                if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (this._lastControlOver) {
                        this._lastControlOver._onPointerOut(this._lastControlOver);
                    }
                    
                    this._lastControlOver = null;
                }
            }

            this._manageFocus();
        }

        public attach(): void {
            var scene = this.getScene();
            if (!scene) {
                return;
            }

            this._pointerMoveObserver = scene.onPrePointerObservable.add((pi, state) => {
                if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE 
                    && pi.type !== BABYLON.PointerEventTypes.POINTERUP
                    && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                    return;
                }

                if (!scene) {
                    return;
                }

                let camera = scene.cameraToUseForPointers || scene.activeCamera;

                if (!camera) {
                    return;
                }
                let engine = scene.getEngine();
                let viewport = camera.viewport;
                let x = (scene.pointerX / engine.getHardwareScalingLevel() - viewport.x * engine.getRenderWidth()) / viewport.width;
                let y = (scene.pointerY / engine.getHardwareScalingLevel() - viewport.y * engine.getRenderHeight()) / viewport.height;

                this._shouldBlockPointer = false;
                this._doPicking(x, y, pi.type, pi.event.button);

                pi.skipOnPointerObservable = this._shouldBlockPointer;
            });

            this._attachToOnPointerOut(scene);
        }

        public attachToMesh(mesh: AbstractMesh, supportPointerMove = true): void {
            var scene = this.getScene();
            if (!scene) {
                return;
            }            
            this._pointerObserver = scene.onPointerObservable.add((pi, state) => {
                if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE 
                    && pi.type !== BABYLON.PointerEventTypes.POINTERUP
                    && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                    return;
                }

                if (pi.pickInfo && pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                    var uv = pi.pickInfo.getTextureCoordinates();

                    if (uv) {
                        let size = this.getSize();
                        this._doPicking(uv.x * size.width, (1.0 - uv.y) * size.height, pi.type, pi.event.button);
                    }
                } else if (pi.type === BABYLON.PointerEventTypes.POINTERUP) {
                    if (this._lastControlDown) {
                        this._lastControlDown.forcePointerUp();
                    }
                    this._lastControlDown = null;  

                    this.focusedControl = null;
                } else if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (this._lastControlOver) {
                        this._lastControlOver._onPointerOut(this._lastControlOver);
                    }              
                    this._lastControlOver = null;
                }
            });

            mesh.enablePointerMoveEvents = supportPointerMove;
            this._attachToOnPointerOut(scene);
        }
        
        public moveFocusToControl(control: IFocusableControl): void {
            this.focusedControl = control;
            this._lastPickedControl = <any>control;
            this._blockNextFocusCheck = true;
        }
        
        private _manageFocus(): void {
            if (this._blockNextFocusCheck) {
                this._blockNextFocusCheck = false;
                this._lastPickedControl = <any>this._focusedControl;
                return;
            }

            // Focus management
            if (this._focusedControl) {
                if (this._focusedControl !== (<any>this._lastPickedControl)) {
                    if (this._lastPickedControl.isFocusInvisible) {
                        return;
                    }

                    this.focusedControl = null;
                }
            }
        }

        private _attachToOnPointerOut(scene: Scene): void {
            this._canvasPointerOutObserver = scene.getEngine().onCanvasPointerOutObservable.add(() => {
                if (this._lastControlOver) {
                    this._lastControlOver._onPointerOut(this._lastControlOver);
                }            
                this._lastControlOver = null;

                if (this._lastControlDown) {
                    this._lastControlDown.forcePointerUp();
                }
                this._lastControlDown = null;                
            });
        }

        // Statics
        public static CreateForMesh(mesh: AbstractMesh, width = 1024, height = 1024, supportPointerMove = true): AdvancedDynamicTexture {
            var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, Texture.TRILINEAR_SAMPLINGMODE);

            var material = new BABYLON.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
            material.backFaceCulling = false;
            material.diffuseColor = BABYLON.Color3.Black();
            material.specularColor = BABYLON.Color3.Black();
            material.emissiveTexture = result;
            material.opacityTexture = result;

            mesh.material = material;

            result.attachToMesh(mesh, supportPointerMove);

            return result;
        }

        public static CreateFullscreenUI(name: string, foreground: boolean = true, scene: Nullable<Scene> = null): AdvancedDynamicTexture {
            var result = new AdvancedDynamicTexture(name, 0, 0, scene, false, Texture.BILINEAR_SAMPLINGMODE);

            // Display
            var layer = new BABYLON.Layer(name + "_layer", null, scene, !foreground);
            layer.texture = result;

            result._layerToDispose = layer;
            result._isFullscreen = true;

            // Attach
            result.attach();

            return result;
        }
    }    
}

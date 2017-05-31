/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty = false;
        private _renderObserver: Observer<Camera>;
        private _resizeObserver: Observer<Engine>;
        private _pointerMoveObserver: Observer<PointerInfoPre>;
        private _pointerObserver: Observer<PointerInfo>;
        private _background: string;
        public _rootContainer = new Container("root");
        public _lastControlOver: Control;
        public _lastControlDown: Control;
        public _shouldBlockPointer: boolean;
        public _layerToDispose: Layer;
        public _linkedControls = new Array<Control>();
        private _isFullscreen = false;
        private _fullscreenViewport = new Viewport(0, 0, 1, 1);
        private _idealWidth = 0;
        private _idealHeight = 0;

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
       
        constructor(name: string, width = 0, height = 0, scene: Scene, generateMipMaps = false, samplingMode = Texture.NEAREST_SAMPLINGMODE) {
            super(name, {width: width, height: height}, scene, generateMipMaps, samplingMode, Engine.TEXTUREFORMAT_RGBA);

            this._renderObserver = this.getScene().onBeforeCameraRenderObservable.add((camera: Camera) => this._checkUpdate(camera));

            this._rootContainer._link(null, this);

            this.hasAlpha = true;

            if (!width || !height) {
                this._resizeObserver = this.getScene().getEngine().onResizeObservable.add(() => this._onResize());
                this._onResize();
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

        public dispose() {
            this.getScene().onBeforeCameraRenderObservable.remove(this._renderObserver);

            if (this._resizeObserver) {
                this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver);
            }

            if (this._pointerMoveObserver) {
                this.getScene().onPrePointerObservable.remove(this._pointerMoveObserver);
            }

            if (this._pointerObserver) {
                this.getScene().onPointerObservable.remove(this._pointerObserver);
            }

            if (this._layerToDispose) {
                this._layerToDispose.texture = null;
                this._layerToDispose.dispose();
                this._layerToDispose = null;
            }

            super.dispose();
        }

        private _onResize(): void {
            // Check size
            var engine = this.getScene().getEngine();
            var textureSize = this.getSize();
            var renderWidth = engine.getRenderWidth();
            var renderHeight = engine.getRenderHeight();

            if (textureSize.width !== renderWidth || textureSize.height !== renderHeight) {
                this.scaleTo(renderWidth, renderHeight);
                this.markAsDirty();
            }
        }

        private _checkUpdate(camera: Camera): void {
            if (this._isFullscreen && this._linkedControls.length) {
                var scene = this.getScene();
                var engine = scene.getEngine();
                var globalViewport = this._fullscreenViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

                for (var control of this._linkedControls) {
                    var mesh = control._linkedMesh;
                    
                    var position = mesh.getBoundingInfo().boundingSphere.center;
                    var projectedPosition = Vector3.Project(position, mesh.getWorldMatrix(), scene.getTransformMatrix(), globalViewport);

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
            var measure = new Measure(0, 0, renderWidth, renderHeight);
            this._rootContainer._draw(measure, context);
        }

        private _doPicking(x: number, y: number, type: number): void {
            if (!this._rootContainer._processPicking(x, y, type)) {

                if (type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (this._lastControlOver && this._lastControlOver.onPointerOutObservable.hasObservers()) {
                        this._lastControlOver.onPointerOutObservable.notifyObservers(this._lastControlOver);
                    }
                    
                    this._lastControlOver = null;
                }
            }
        }

        public attach(): void {
            var scene = this.getScene();
            this._pointerMoveObserver = scene.onPrePointerObservable.add((pi, state) => {
                if (pi.type !== BABYLON.PointerEventTypes.POINTERMOVE 
                    && pi.type !== BABYLON.PointerEventTypes.POINTERUP
                    && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                    return;
                }

                this._shouldBlockPointer = false;
                this._doPicking(scene.pointerX, scene.pointerY, pi.type);

                pi.skipOnPointerObservable = this._shouldBlockPointer && pi.type !== BABYLON.PointerEventTypes.POINTERUP;
            });
        }

        public attachToMesh(mesh: AbstractMesh): void {
            var scene = this.getScene();
            this._pointerObserver = scene.onPointerObservable.add((pi, state) => {
                if (pi.type !== BABYLON.PointerEventTypes.POINTERUP && pi.type !== BABYLON.PointerEventTypes.POINTERDOWN) {
                    return;
                }

                if (pi.pickInfo.hit && pi.pickInfo.pickedMesh === mesh) {
                    var uv = pi.pickInfo.getTextureCoordinates();
                    var size = this.getSize();
                    this._doPicking(uv.x * size.width, (1.0 - uv.y) * size.height, pi.type);
                }
            });
        }

        // Statics
        public static CreateForMesh(mesh: AbstractMesh, width = 1024, height = 1024): AdvancedDynamicTexture {
            var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, Texture.TRILINEAR_SAMPLINGMODE);

            var material = new BABYLON.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
            material.backFaceCulling = false;
            material.diffuseColor = BABYLON.Color3.Black();
            material.specularColor = BABYLON.Color3.Black();
            material.emissiveTexture = result;
            material.opacityTexture = result;

            mesh.material = material;

            result.attachToMesh(mesh);

            return result;
        }

        public static CreateFullscreenUI(name: string, foreground: boolean = true, scene: Scene): AdvancedDynamicTexture {
            var result = new AdvancedDynamicTexture(name, 0, 0, scene);

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
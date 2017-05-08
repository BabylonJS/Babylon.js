/// <reference path="../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class AdvancedDynamicTexture extends DynamicTexture {
        private _isDirty = false;
        private _renderObserver: Observer<Scene>;
        private _resizeObserver: Observer<Engine>;
        private _background: string;
        private _rootContainer = new Container("root");

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
       
        constructor(name: string, width = 0, height = 0, scene: Scene, generateMipMaps = false, samplingMode = Texture.NEAREST_SAMPLINGMODE) {
            super(name, {width: width, height: height}, scene, generateMipMaps, samplingMode, Engine.TEXTUREFORMAT_RGBA);

            this._renderObserver = this.getScene().onBeforeRenderObservable.add(() => this._checkUpdate());

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
            this.getScene().onBeforeRenderObservable.remove(this._renderObserver);

            if (this._resizeObserver) {
                this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver);
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

        private _checkUpdate(): void {
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
            var measure = new Measure(0, 0, renderWidth, renderHeight);
            this._rootContainer._draw(measure, context);
        }

        // Statics
        public static CreateForMesh(mesh: AbstractMesh, width = 1024, height = 1024): AdvancedDynamicTexture {
            var result = new AdvancedDynamicTexture(mesh.name + " AdvancedDynamicTexture", width, height, mesh.getScene(), true, Texture.TRILINEAR_SAMPLINGMODE);

            var material = new BABYLON.StandardMaterial("AdvancedDynamicTextureMaterial", mesh.getScene());
            material.backFaceCulling = false;
            material.emissiveTexture = result;
            material.opacityTexture = result;

            mesh.material = material;

            return result;
        }

        public static CreateFullscreenUI(name: string, foreground: boolean = true, scene: Scene): AdvancedDynamicTexture {
            var result = new AdvancedDynamicTexture(name, 0, 0, scene);

            // Display
            var layer = new BABYLON.Layer(name + "_layer", null, scene, !foreground);
            layer.texture = result;

            return result;
        }
    }    
}
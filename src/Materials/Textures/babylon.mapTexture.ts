module BABYLON {

    export class MapTexture extends Texture {
        private _rectPackingMap: RectPackingMap;
        private _size: ISize;

        private _replacedViewport: Viewport;

        constructor(name: string, scene: Scene, size: ISize, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, useMipMap: boolean=false) {
            super(null, scene, !useMipMap, false, samplingMode);

            this.name = name;
            this._size = size;
            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;

            // Create the rectPackMap that will allocate portion of the texture
            this._rectPackingMap = new RectPackingMap(new Size(size.width, size.height));

            // Create the texture that will store the content
            this._texture = scene.getEngine().createRenderTargetTexture(size, { generateMipMaps: !this.noMipmap, type: Engine.TEXTURETYPE_UNSIGNED_INT });
        }

        /**
         * Allocate a rectangle of a given size in the texture map
         * @param size the size of the rectangle to allocation
         * @return the PackedRect instance corresponding to the allocated rect or null is there was not enough space to allocate it.
         */
        public allocateRect(size: Size): PackedRect {
            return this._rectPackingMap.addRect(size);
        }

        /**
         * Free a given rectangle from the texture map
         * @param rectInfo the instance corresponding to the rect to free.
         */
        public freeRect(rectInfo: PackedRect) {
            if (rectInfo) {
                rectInfo.freeContent();
            }
        }

        /**
         * Return the available space in the range of [O;1]. 0 being not space left at all, 1 being an empty texture map.
         * This is the cumulated space, not the biggest available surface. Due to fragmentation you may not allocate a rect corresponding to this surface.
         * @returns {} 
         */
        public get freeSpace(): number {
            return this._rectPackingMap.freeSpace;
        }

        /**
         * Bind the texture to the rendering engine to render in the zone of a given rectangle.
         * Use this method when you want to render into the texture map with a clipspace set to the location and size of the given rect.
         * Don't forget to call unbindTexture when you're done rendering
         * @param rect the zone to render to
         * @param clear true to clear the portion's color/depth data
         */
        public bindTextureForRect(rect: PackedRect, clear: boolean) {
            return this.bindTextureForPosSize(rect.pos, rect.contentSize, clear);
        }

        /**
         * Bind the texture to the rendering engine to render in the zone of the given size at the given position.
         * Use this method when you want to render into the texture map with a clipspace set to the location and size of the given rect.
         * Don't forget to call unbindTexture when you're done rendering
         * @param pos the position into the texture
         * @param size the portion to fit the clip space to
         * @param clear true to clear the portion's color/depth data
         */
        public bindTextureForPosSize(pos: Vector2, size: Size, clear: boolean) {

            let engine = this.getScene().getEngine();
            engine.bindFramebuffer(this._texture);
            this._replacedViewport = engine.setDirectViewport(pos.x, pos.y, size.width, size.height);
            if (clear) {
                // We only want to clear the part of the texture we're binding to, only the scissor can help us to achieve that
                engine.scissorClear(pos.x, pos.y, size.width, size.height, new Color4(0, 0, 0, 0)); 
            }
        }

        /**
         * Unbind the texture map from the rendering engine.
         * Call this method when you're done rendering. A previous call to bindTextureForRect has to be made.
         * @param dumpForDebug if set to true the content of the texture map will be dumped to a picture file that will be sent to the internet browser.
         */
        public unbindTexture(dumpForDebug?:boolean) {
            // Dump ?
            if (dumpForDebug) {
                Tools.DumpFramebuffer(this._size.width, this._size.height, this.getScene().getEngine());
            }

            let engine = this.getScene().getEngine();

            if (this._replacedViewport) {
                engine.setViewport(this._replacedViewport);
                this._replacedViewport = null;
            }

            engine.unBindFramebuffer(this._texture);
        }

        public get canRescale(): boolean {
            return false;
        }

        // Note, I don't know what behavior this method should have: clone the underlying texture/rectPackingMap or just reference them?
        // Anyway, there's not much point to use this method for this kind of texture I guess
        public clone(): MapTexture {
            return null;
        }
    }
} 
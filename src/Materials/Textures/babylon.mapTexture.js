var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var MapTexture = (function (_super) {
        __extends(MapTexture, _super);
        function MapTexture(name, scene, size, samplingMode, useMipMap) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (useMipMap === void 0) { useMipMap = false; }
            _super.call(this, null, scene, !useMipMap, false, samplingMode);
            this.name = name;
            this._size = size;
            this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            // Create the rectPackMap that will allocate portion of the texture
            this._rectPackingMap = new BABYLON.RectPackingMap(new BABYLON.Size(size.width, size.height));
            // Create the texture that will store the content
            this._texture = scene.getEngine().createRenderTargetTexture(size, { generateMipMaps: !this.noMipmap, type: BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT });
        }
        /**
         * Allocate a rectangle of a given size in the texture map
         * @param size the size of the rectangle to allocation
         * @return the PackedRect instance corresponding to the allocated rect or null is there was not enough space to allocate it.
         */
        MapTexture.prototype.allocateRect = function (size) {
            return this._rectPackingMap.addRect(size);
        };
        /**
         * Free a given rectangle from the texture map
         * @param rectInfo the instance corresponding to the rect to free.
         */
        MapTexture.prototype.freeRect = function (rectInfo) {
            if (rectInfo) {
                rectInfo.freeContent();
            }
        };
        Object.defineProperty(MapTexture.prototype, "freeSpace", {
            /**
             * Return the available space in the range of [O;1]. 0 being not space left at all, 1 being an empty texture map.
             * This is the cumulated space, not the biggest available surface. Due to fragmentation you may not allocate a rect corresponding to this surface.
             * @returns {}
             */
            get: function () {
                return this._rectPackingMap.freeSpace;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Bind the texture to the rendering engine to render in the zone of a given rectangle.
         * Use this method when you want to render into the texture map with a clipspace set to the location and size of the given rect.
         * Don't forget to call unbindTexture when you're done rendering
         * @param rect the zone to render to
         * @param clear true to clear the portion's color/depth data
         */
        MapTexture.prototype.bindTextureForRect = function (rect, clear) {
            return this.bindTextureForPosSize(rect.pos, rect.contentSize, clear);
        };
        /**
         * Bind the texture to the rendering engine to render in the zone of the given size at the given position.
         * Use this method when you want to render into the texture map with a clipspace set to the location and size of the given rect.
         * Don't forget to call unbindTexture when you're done rendering
         * @param pos the position into the texture
         * @param size the portion to fit the clip space to
         * @param clear true to clear the portion's color/depth data
         */
        MapTexture.prototype.bindTextureForPosSize = function (pos, size, clear) {
            var engine = this.getScene().getEngine();
            engine.bindFramebuffer(this._texture);
            this._replacedViewport = engine.setDirectViewport(pos.x, pos.y, size.width, size.height);
            if (clear) {
                // We only want to clear the part of the texture we're binding to, only the scissor can help us to achieve that
                engine.scissorClear(pos.x, pos.y, size.width, size.height, new BABYLON.Color4(0, 0, 0, 0));
            }
        };
        /**
         * Unbind the texture map from the rendering engine.
         * Call this method when you're done rendering. A previous call to bindTextureForRect has to be made.
         * @param dumpForDebug if set to true the content of the texture map will be dumped to a picture file that will be sent to the internet browser.
         */
        MapTexture.prototype.unbindTexture = function (dumpForDebug) {
            // Dump ?
            if (dumpForDebug) {
                BABYLON.Tools.DumpFramebuffer(this._size.width, this._size.height, this.getScene().getEngine());
            }
            var engine = this.getScene().getEngine();
            if (this._replacedViewport) {
                engine.setViewport(this._replacedViewport);
                this._replacedViewport = null;
            }
            engine.unBindFramebuffer(this._texture);
        };
        Object.defineProperty(MapTexture.prototype, "canRescale", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        // Note, I don't know what behavior this method should have: clone the underlying texture/rectPackingMap or just reference them?
        // Anyway, there's not much point to use this method for this kind of texture I guess
        MapTexture.prototype.clone = function () {
            return null;
        };
        return MapTexture;
    }(BABYLON.Texture));
    BABYLON.MapTexture = MapTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.mapTexture.js.map
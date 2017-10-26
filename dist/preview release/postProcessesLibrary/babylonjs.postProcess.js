var babylonDependency; try { babylonDependency = BABYLON || (typeof require !== 'undefined' && require("../babylon.max")); } catch (e) { babylonDependency = BABYLON || (typeof require !== 'undefined' && require("babylonjs")); } 
var BABYLON = babylonDependency;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __extends = (this && this.__extends) || (function () {
            var extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return function (d, b) {
                extendStatics(d, b);
                function __() { this.constructor = d; }
                d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
            };
        })();
        


var BABYLON;
(function (BABYLON) {
    /**
     * AsciiArtFontTexture is the helper class used to easily create your ascii art font texture.
     *
     * It basically takes care rendering the font front the given font size to a texture.
     * This is used later on in the postprocess.
     */
    var AsciiArtFontTexture = /** @class */ (function (_super) {
        __extends(AsciiArtFontTexture, _super);
        /**
         * Create a new instance of the Ascii Art FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param text the caracter set to use in the rendering.
         * @param scene the scene that owns the texture
         */
        function AsciiArtFontTexture(name, font, text, scene) {
            var _this = _super.call(this, scene) || this;
            _this.name = name;
            _this._text == text;
            _this._font == font;
            _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            //this.anisotropicFilteringLevel = 1;
            // Get the font specific info.
            var maxCharHeight = _this.getFontHeight(font);
            var maxCharWidth = _this.getFontWidth(font);
            _this._charSize = Math.max(maxCharHeight.height, maxCharWidth);
            // This is an approximate size, but should always be able to fit at least the maxCharCount.
            var textureWidth = Math.ceil(_this._charSize * text.length);
            var textureHeight = _this._charSize;
            // Create the texture that will store the font characters.
            _this._texture = scene.getEngine().createDynamicTexture(textureWidth, textureHeight, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
            //scene.getEngine().setclamp
            var textureSize = _this.getSize();
            // Create a canvas with the final size: the one matching the texture.
            var canvas = document.createElement("canvas");
            canvas.width = textureSize.width;
            canvas.height = textureSize.height;
            var context = canvas.getContext("2d");
            context.textBaseline = "top";
            context.font = font;
            context.fillStyle = "white";
            context.imageSmoothingEnabled = false;
            // Sets the text in the texture.
            for (var i = 0; i < text.length; i++) {
                context.fillText(text[i], i * _this._charSize, -maxCharHeight.offset);
            }
            // Flush the text in the dynamic texture.
            _this.getScene().getEngine().updateDynamicTexture(_this._texture, canvas, false, true);
            return _this;
        }
        Object.defineProperty(AsciiArtFontTexture.prototype, "charSize", {
            /**
             * Gets the size of one char in the texture (each char fits in size * size space in the texture).
             */
            get: function () {
                return this._charSize;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Gets the max char width of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char width
         */
        AsciiArtFontTexture.prototype.getFontWidth = function (font) {
            var fontDraw = document.createElement("canvas");
            var ctx = fontDraw.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = font;
            return ctx.measureText("W").width;
        };
        // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
        /**
         * Gets the max char height of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char height
         */
        AsciiArtFontTexture.prototype.getFontHeight = function (font) {
            var fontDraw = document.createElement("canvas");
            var ctx = fontDraw.getContext('2d');
            ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'white';
            ctx.font = font;
            ctx.fillText('jH|', 0, 0);
            var pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
            var start = -1;
            var end = -1;
            for (var row = 0; row < fontDraw.height; row++) {
                for (var column = 0; column < fontDraw.width; column++) {
                    var index = (row * fontDraw.width + column) * 4;
                    if (pixels[index] === 0) {
                        if (column === fontDraw.width - 1 && start !== -1) {
                            end = row;
                            row = fontDraw.height;
                            break;
                        }
                        continue;
                    }
                    else {
                        if (start === -1) {
                            start = row;
                        }
                        break;
                    }
                }
            }
            return { height: (end - start) + 1, offset: start - 1 };
        };
        /**
         * Clones the current AsciiArtTexture.
         * @return the clone of the texture.
         */
        AsciiArtFontTexture.prototype.clone = function () {
            return new AsciiArtFontTexture(this.name, this._font, this._text, this.getScene());
        };
        /**
         * Parses a json object representing the texture and returns an instance of it.
         * @param source the source JSON representation
         * @param scene the scene to create the texture for
         * @return the parsed texture
         */
        AsciiArtFontTexture.Parse = function (source, scene) {
            var texture = BABYLON.SerializationHelper.Parse(function () { return new AsciiArtFontTexture(source.name, source.font, source.text, scene); }, source, scene, null);
            return texture;
        };
        __decorate([
            BABYLON.serialize("font")
        ], AsciiArtFontTexture.prototype, "_font", void 0);
        __decorate([
            BABYLON.serialize("text")
        ], AsciiArtFontTexture.prototype, "_text", void 0);
        return AsciiArtFontTexture;
    }(BABYLON.BaseTexture));
    BABYLON.AsciiArtFontTexture = AsciiArtFontTexture;
    /**
     * AsciiArtPostProcess helps rendering everithing in Ascii Art.
     *
     * Simmply add it to your scene and let the nerd that lives in you have fun.
     * Example usage: var pp = new AsciiArtPostProcess("myAscii", "20px Monospace", camera);
     */
    var AsciiArtPostProcess = /** @class */ (function (_super) {
        __extends(AsciiArtPostProcess, _super);
        /**
         * Instantiates a new Ascii Art Post Process.
         * @param name the name to give to the postprocess
         * @camera the camera to apply the post process to.
         * @param options can either be the font name or an option object following the IAsciiArtPostProcessOptions format
         */
        function AsciiArtPostProcess(name, camera, options) {
            var _this = _super.call(this, name, 'asciiart', ['asciiArtFontInfos', 'asciiArtOptions'], ['asciiArtFont'], {
                width: camera.getEngine().getRenderWidth(),
                height: camera.getEngine().getRenderHeight()
            }, camera, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, camera.getEngine(), true) || this;
            /**
             * This defines the amount you want to mix the "tile" or caracter space colored in the ascii art.
             * This number is defined between 0 and 1;
             */
            _this.mixToTile = 0;
            /**
             * This defines the amount you want to mix the normal rendering pass in the ascii art.
             * This number is defined between 0 and 1;
             */
            _this.mixToNormal = 0;
            // Default values.
            var font = "40px Monospace";
            var characterSet = " `-.'_:,\"=^;<+!*?/cL\\zrs7TivJtC{3F)Il(xZfY5S2eajo14[nuyE]P6V9kXpKwGhqAUbOd8#HRDB0$mgMW&Q%N@";
            // Use options.
            if (options) {
                if (typeof (options) === "string") {
                    font = options;
                }
                else {
                    font = options.font || font;
                    characterSet = options.characterSet || characterSet;
                    _this.mixToTile = options.mixToTile || _this.mixToTile;
                    _this.mixToNormal = options.mixToNormal || _this.mixToNormal;
                }
            }
            _this._asciiArtFontTexture = new AsciiArtFontTexture(name, font, characterSet, camera.getScene());
            var textureSize = _this._asciiArtFontTexture.getSize();
            _this.onApply = function (effect) {
                effect.setTexture("asciiArtFont", _this._asciiArtFontTexture);
                effect.setFloat4("asciiArtFontInfos", _this._asciiArtFontTexture.charSize, characterSet.length, textureSize.width, textureSize.height);
                effect.setFloat4("asciiArtOptions", _this.width, _this.height, _this.mixToNormal, _this.mixToTile);
            };
            return _this;
        }
        return AsciiArtPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.AsciiArtPostProcess = AsciiArtPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.asciiArtPostProcess.js.map

BABYLON.Effect.ShadersStore['asciiartPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D asciiArtFont;\n\nuniform vec4 asciiArtFontInfos;\nuniform vec4 asciiArtOptions;\n\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,vec3(0.2126,0.7152,0.0722)),0.,1.);\n}\n\nvoid main(void) \n{\nfloat caracterSize=asciiArtFontInfos.x;\nfloat numChar=asciiArtFontInfos.y-1.0;\nfloat fontx=asciiArtFontInfos.z;\nfloat fonty=asciiArtFontInfos.w;\nfloat screenx=asciiArtOptions.x;\nfloat screeny=asciiArtOptions.y;\nfloat tileX=float(floor((gl_FragCoord.x)/caracterSize))*caracterSize/screenx;\nfloat tileY=float(floor((gl_FragCoord.y)/caracterSize))*caracterSize/screeny;\nvec2 tileUV=vec2(tileX,tileY);\nvec4 tileColor=texture2D(textureSampler,tileUV);\nvec4 baseColor=texture2D(textureSampler,vUV);\nfloat tileLuminance=getLuminance(tileColor.rgb);\nfloat offsetx=(float(floor(tileLuminance*numChar)))*caracterSize/fontx;\nfloat offsety=0.0;\nfloat x=float(mod(gl_FragCoord.x,caracterSize))/fontx;\nfloat y=float(mod(gl_FragCoord.y,caracterSize))/fonty;\nvec4 finalColor=texture2D(asciiArtFont,vec2(offsetx+x,offsety+(caracterSize/fonty-y)));\nfinalColor.rgb*=tileColor.rgb;\nfinalColor.a=1.0;\nfinalColor=mix(finalColor,tileColor,asciiArtOptions.w);\nfinalColor=mix(finalColor,baseColor,asciiArtOptions.z);\ngl_FragColor=finalColor;\n}";




var BABYLON;
(function (BABYLON) {
    /**
     * DigitalRainFontTexture is the helper class used to easily create your digital rain font texture.
     *
     * It basically takes care rendering the font front the given font size to a texture.
     * This is used later on in the postprocess.
     */
    var DigitalRainFontTexture = /** @class */ (function (_super) {
        __extends(DigitalRainFontTexture, _super);
        /**
         * Create a new instance of the Digital Rain FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param text the caracter set to use in the rendering.
         * @param scene the scene that owns the texture
         */
        function DigitalRainFontTexture(name, font, text, scene) {
            var _this = _super.call(this, scene) || this;
            _this.name = name;
            _this._text == text;
            _this._font == font;
            _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            //this.anisotropicFilteringLevel = 1;
            // Get the font specific info.
            var maxCharHeight = _this.getFontHeight(font);
            var maxCharWidth = _this.getFontWidth(font);
            _this._charSize = Math.max(maxCharHeight.height, maxCharWidth);
            // This is an approximate size, but should always be able to fit at least the maxCharCount.
            var textureWidth = _this._charSize;
            var textureHeight = Math.ceil(_this._charSize * text.length);
            // Create the texture that will store the font characters.
            _this._texture = scene.getEngine().createDynamicTexture(textureWidth, textureHeight, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
            //scene.getEngine().setclamp
            var textureSize = _this.getSize();
            // Create a canvas with the final size: the one matching the texture.
            var canvas = document.createElement("canvas");
            canvas.width = textureSize.width;
            canvas.height = textureSize.height;
            var context = canvas.getContext("2d");
            context.textBaseline = "top";
            context.font = font;
            context.fillStyle = "white";
            context.imageSmoothingEnabled = false;
            // Sets the text in the texture.
            for (var i = 0; i < text.length; i++) {
                context.fillText(text[i], 0, i * _this._charSize - maxCharHeight.offset);
            }
            // Flush the text in the dynamic texture.
            _this.getScene().getEngine().updateDynamicTexture(_this._texture, canvas, false, true);
            return _this;
        }
        Object.defineProperty(DigitalRainFontTexture.prototype, "charSize", {
            /**
             * Gets the size of one char in the texture (each char fits in size * size space in the texture).
             */
            get: function () {
                return this._charSize;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Gets the max char width of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char width
         */
        DigitalRainFontTexture.prototype.getFontWidth = function (font) {
            var fontDraw = document.createElement("canvas");
            var ctx = fontDraw.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = font;
            return ctx.measureText("W").width;
        };
        // More info here: https://videlais.com/2014/03/16/the-many-and-varied-problems-with-measuring-font-height-for-html5-canvas/
        /**
         * Gets the max char height of a font.
         * @param font the font to use, use the W3C CSS notation
         * @return the max char height
         */
        DigitalRainFontTexture.prototype.getFontHeight = function (font) {
            var fontDraw = document.createElement("canvas");
            var ctx = fontDraw.getContext('2d');
            ctx.fillRect(0, 0, fontDraw.width, fontDraw.height);
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'white';
            ctx.font = font;
            ctx.fillText('jH|', 0, 0);
            var pixels = ctx.getImageData(0, 0, fontDraw.width, fontDraw.height).data;
            var start = -1;
            var end = -1;
            for (var row = 0; row < fontDraw.height; row++) {
                for (var column = 0; column < fontDraw.width; column++) {
                    var index = (row * fontDraw.width + column) * 4;
                    if (pixels[index] === 0) {
                        if (column === fontDraw.width - 1 && start !== -1) {
                            end = row;
                            row = fontDraw.height;
                            break;
                        }
                        continue;
                    }
                    else {
                        if (start === -1) {
                            start = row;
                        }
                        break;
                    }
                }
            }
            return { height: (end - start) + 1, offset: start - 1 };
        };
        /**
         * Clones the current DigitalRainFontTexture.
         * @return the clone of the texture.
         */
        DigitalRainFontTexture.prototype.clone = function () {
            return new DigitalRainFontTexture(this.name, this._font, this._text, this.getScene());
        };
        /**
         * Parses a json object representing the texture and returns an instance of it.
         * @param source the source JSON representation
         * @param scene the scene to create the texture for
         * @return the parsed texture
         */
        DigitalRainFontTexture.Parse = function (source, scene) {
            var texture = BABYLON.SerializationHelper.Parse(function () { return new DigitalRainFontTexture(source.name, source.font, source.text, scene); }, source, scene, null);
            return texture;
        };
        __decorate([
            BABYLON.serialize("font")
        ], DigitalRainFontTexture.prototype, "_font", void 0);
        __decorate([
            BABYLON.serialize("text")
        ], DigitalRainFontTexture.prototype, "_text", void 0);
        return DigitalRainFontTexture;
    }(BABYLON.BaseTexture));
    BABYLON.DigitalRainFontTexture = DigitalRainFontTexture;
    /**
     * DigitalRainPostProcess helps rendering everithing in digital rain.
     *
     * Simmply add it to your scene and let the nerd that lives in you have fun.
     * Example usage: var pp = new DigitalRainPostProcess("digitalRain", "20px Monospace", camera);
     */
    var DigitalRainPostProcess = /** @class */ (function (_super) {
        __extends(DigitalRainPostProcess, _super);
        /**
         * Instantiates a new Digital Rain Post Process.
         * @param name the name to give to the postprocess
         * @camera the camera to apply the post process to.
         * @param options can either be the font name or an option object following the IDigitalRainPostProcessOptions format
         */
        function DigitalRainPostProcess(name, camera, options) {
            var _this = _super.call(this, name, 'digitalrain', ['digitalRainFontInfos', 'digitalRainOptions', 'cosTimeZeroOne', 'matrixSpeed'], ['digitalRainFont'], {
                width: camera.getEngine().getRenderWidth(),
                height: camera.getEngine().getRenderHeight()
            }, camera, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, camera.getEngine(), true) || this;
            /**
             * This defines the amount you want to mix the "tile" or caracter space colored in the digital rain.
             * This number is defined between 0 and 1;
             */
            _this.mixToTile = 0;
            /**
             * This defines the amount you want to mix the normal rendering pass in the digital rain.
             * This number is defined between 0 and 1;
             */
            _this.mixToNormal = 0;
            // Default values.
            var font = "15px Monospace";
            var characterSet = "古池や蛙飛び込む水の音ふるいけやかわずとびこむみずのおと初しぐれ猿も小蓑をほしげ也はつしぐれさるもこみのをほしげなり江戸の雨何石呑んだ時鳥えどのあめなんごくのんだほととぎす";
            // Use options.
            if (options) {
                if (typeof (options) === "string") {
                    font = options;
                }
                else {
                    font = options.font || font;
                    _this.mixToTile = options.mixToTile || _this.mixToTile;
                    _this.mixToNormal = options.mixToNormal || _this.mixToNormal;
                }
            }
            _this._digitalRainFontTexture = new DigitalRainFontTexture(name, font, characterSet, camera.getScene());
            var textureSize = _this._digitalRainFontTexture.getSize();
            var alpha = 0.0;
            var cosTimeZeroOne = 0.0;
            var matrix = new BABYLON.Matrix();
            for (var i = 0; i < 16; i++) {
                matrix.m[i] = Math.random();
            }
            _this.onApply = function (effect) {
                effect.setTexture("digitalRainFont", _this._digitalRainFontTexture);
                effect.setFloat4("digitalRainFontInfos", _this._digitalRainFontTexture.charSize, characterSet.length, textureSize.width, textureSize.height);
                effect.setFloat4("digitalRainOptions", _this.width, _this.height, _this.mixToNormal, _this.mixToTile);
                effect.setMatrix("matrixSpeed", matrix);
                alpha += 0.003;
                cosTimeZeroOne = alpha;
                effect.setFloat('cosTimeZeroOne', cosTimeZeroOne);
            };
            return _this;
        }
        return DigitalRainPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.DigitalRainPostProcess = DigitalRainPostProcess;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.digitalRainPostProcess.js.map

BABYLON.Effect.ShadersStore['digitalrainPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform sampler2D digitalRainFont;\n\nuniform vec4 digitalRainFontInfos;\nuniform vec4 digitalRainOptions;\nuniform mat4 matrixSpeed;\nuniform float cosTimeZeroOne;\n\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,vec3(0.2126,0.7152,0.0722)),0.,1.);\n}\n\nvoid main(void) \n{\nfloat caracterSize=digitalRainFontInfos.x;\nfloat numChar=digitalRainFontInfos.y-1.0;\nfloat fontx=digitalRainFontInfos.z;\nfloat fonty=digitalRainFontInfos.w;\nfloat screenx=digitalRainOptions.x;\nfloat screeny=digitalRainOptions.y;\nfloat ratio=screeny/fonty;\nfloat columnx=float(floor((gl_FragCoord.x)/caracterSize));\nfloat tileX=float(floor((gl_FragCoord.x)/caracterSize))*caracterSize/screenx;\nfloat tileY=float(floor((gl_FragCoord.y)/caracterSize))*caracterSize/screeny;\nvec2 tileUV=vec2(tileX,tileY);\nvec4 tileColor=texture2D(textureSampler,tileUV);\nvec4 baseColor=texture2D(textureSampler,vUV);\nfloat tileLuminance=getLuminance(tileColor.rgb);\nint st=int(mod(columnx,4.0));\nfloat speed=cosTimeZeroOne*(sin(tileX*314.5)*0.5+0.6); \nfloat x=float(mod(gl_FragCoord.x,caracterSize))/fontx;\nfloat y=float(mod(speed+gl_FragCoord.y/screeny,1.0));\ny*=ratio;\nvec4 finalColor=texture2D(digitalRainFont,vec2(x,1.0-y));\nvec3 high=finalColor.rgb*(vec3(1.2,1.2,1.2)*pow(1.0-y,30.0));\nfinalColor.rgb*=vec3(pow(tileLuminance,5.0),pow(tileLuminance,1.5),pow(tileLuminance,3.0));\nfinalColor.rgb+=high;\nfinalColor.rgb=clamp(finalColor.rgb,0.,1.);\nfinalColor.a=1.0;\nfinalColor=mix(finalColor,tileColor,digitalRainOptions.w);\nfinalColor=mix(finalColor,baseColor,digitalRainOptions.z);\ngl_FragColor=finalColor;\n}";


(function universalModuleDefinition(root, factory) {
                if (root && root["BABYLON"]) {
                    return;
                }
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define([], factory);
    else if(typeof exports === 'object')
        exports["BJSPostProcess"] = factory();
    else {
        root["BABYLON"] = factory();
    }
})(this, function() {
    return BABYLON;
});

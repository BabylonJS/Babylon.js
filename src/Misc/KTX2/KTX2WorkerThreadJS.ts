// @ts-nocheck
// tslint:disable
export function workerFunc() {

    var COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
    var COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
    var COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
    var COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
    var COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
    var COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
    var COMPRESSED_RGBA8_ETC2_EAC = 0x9278;
    var COMPRESSED_RGB8_ETC2 = 0x9274;
    var COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;
    var RGBAFormat = 0x3FF;
    
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();

    /**
     * Transcoder
     */
    var sourceTextureFormat;
    (function (sourceTextureFormat) {
        sourceTextureFormat[sourceTextureFormat["ETC1S"] = 0] = "ETC1S";
        sourceTextureFormat[sourceTextureFormat["UASTC4x4"] = 1] = "UASTC4x4";
    })(sourceTextureFormat || (sourceTextureFormat = {}));

    var transcodeTarget;
    (function (transcodeTarget) {
        transcodeTarget[transcodeTarget["ASTC_4x4_RGBA"] = 0] = "ASTC_4x4_RGBA";
        transcodeTarget[transcodeTarget["BC7_M5_RGBA"] = 1] = "BC7_M5_RGBA";
        transcodeTarget[transcodeTarget["BC3_RGBA"] = 2] = "BC3_RGBA";
        transcodeTarget[transcodeTarget["BC1_RGB"] = 3] = "BC1_RGB";
        transcodeTarget[transcodeTarget["PVRTC1_4_RGBA"] = 4] = "PVRTC1_4_RGBA";
        transcodeTarget[transcodeTarget["PVRTC1_4_RGB"] = 5] = "PVRTC1_4_RGB";
        transcodeTarget[transcodeTarget["ETC2_RGBA"] = 6] = "ETC2_RGBA";
        transcodeTarget[transcodeTarget["ETC1_RGB"] = 7] = "ETC1_RGB";
        transcodeTarget[transcodeTarget["RGBA32"] = 8] = "RGBA32";
    })(transcodeTarget || (transcodeTarget = {}));

    var Transcoder = /** @class */ (function () {
        function Transcoder() {
        }
        Transcoder.CanTranscode = function (src, dst) {
            return false;
        };
        Transcoder.prototype.initialize = function () {
        };
        Transcoder.prototype.needMemoryManager = function () {
            return false;
        };
        Transcoder.prototype.setMemoryManager = function (memoryMgr) {
        };
        Transcoder.prototype.transcode = function (src, dst, level, width, height, uncompressedByteLength, ktx2Reader, imageDesc, encodedData) {
            return Promise.resolve(null);
        };
        return Transcoder;
    }());

    /**
     * WASMMemoryManager
     */
    var WASMMemoryManager = /** @class */ (function () {
        function WASMMemoryManager(initialMemoryPages) {
            if (initialMemoryPages === void 0) { initialMemoryPages = (1 * 1024 * 1024) >> 16; }
            this._numPages = initialMemoryPages;
            this._memory = new WebAssembly.Memory({ initial: this._numPages });
            this._memoryViewByteLength = this._numPages << 16;
            this._memoryViewOffset = 0;
            this._memoryView = new Uint8Array(this._memory.buffer, this._memoryViewOffset, this._memoryViewByteLength);
        }
        WASMMemoryManager.LoadWASM = function (path) {
            var _this = this;
            return new Promise(function (resolve) {
                var id = _this._RequestId++;
                var wasmLoadedHandler = function (msg) {
                    if (msg.data.action === "wasmLoaded" && msg.data.id === id) {
                        self.removeEventListener("message", wasmLoadedHandler);
                        resolve(msg.data.wasmBinary);
                    }
                };
                self.addEventListener("message", wasmLoadedHandler);
                postMessage({ action: "loadWASM", path: path, id: id });
            });
        };
        Object.defineProperty(WASMMemoryManager.prototype, "wasmMemory", {
            get: function () {
                return this._memory;
            },
            enumerable: false,
            configurable: true
        });
        WASMMemoryManager.prototype.getMemoryView = function (numPages, offset, byteLength) {
            if (offset === void 0) { offset = 0; }
            byteLength = byteLength !== null && byteLength !== void 0 ? byteLength : numPages << 16;
            if (this._numPages < numPages) {
                this._memory.grow(numPages - this._numPages);
                this._numPages = numPages;
                this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
                this._memoryViewByteLength = byteLength;
                this._memoryViewOffset = offset;
            }
            else {
                this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
                this._memoryViewByteLength = byteLength;
                this._memoryViewOffset = offset;
            }
            return this._memoryView;
        };
        WASMMemoryManager._RequestId = 0;
        return WASMMemoryManager;
    }());
                    
    /**
     * TranscoderManager
     */
    var TranscoderManager = /** @class */ (function () {
        function TranscoderManager() {
        }
        TranscoderManager.registerTranscoder = function (transcoder) {
            TranscoderManager._Transcoders.push(transcoder);
        };
        TranscoderManager.prototype.findTranscoder = function (src, dst) {
            var transcoder = null;
            for (var i = 0; i < TranscoderManager._Transcoders.length; ++i) {
                if (TranscoderManager._Transcoders[i].CanTranscode(src, dst)) {
                    var key = sourceTextureFormat[src] + "_" + transcodeTarget[dst];
                    transcoder = TranscoderManager._transcoderInstances[key];
                    if (!transcoder) {
                        transcoder = new TranscoderManager._Transcoders[i]();
                        transcoder.initialize();
                        if (transcoder.needMemoryManager()) {
                            if (!this._wasmMemoryManager) {
                                this._wasmMemoryManager = new WASMMemoryManager();
                            }
                            transcoder.setMemoryManager(this._wasmMemoryManager);
                        }
                        TranscoderManager._transcoderInstances[key] = transcoder;
                    }
                    break;
                }
            }
            return transcoder;
        };
        TranscoderManager._Transcoders = [];
        TranscoderManager._transcoderInstances = {};
        return TranscoderManager;
    }());

    /**
     * LiteTranscoder
     */
    var LiteTranscoder = /** @class */ (function (_super) {
        __extends(LiteTranscoder, _super);
        function LiteTranscoder() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LiteTranscoder.prototype._loadModule = function () {
            var _this = this;
            if (this._modulePromise) {
                return this._modulePromise;
            }
            this._modulePromise = new Promise(function (resolve) {
                WASMMemoryManager.LoadWASM(_this._modulePath).then(function (wasmBinary) {
                    WebAssembly.instantiate(wasmBinary, { env: { memory: _this._memoryManager.wasmMemory } }).then(function (moduleWrapper) {
                        resolve({ module: moduleWrapper.instance.exports });
                    });
                });
            });
            return this._modulePromise;
        };
        Object.defineProperty(LiteTranscoder.prototype, "memoryManager", {
            get: function () {
                return this._memoryManager;
            },
            enumerable: false,
            configurable: true
        });
        LiteTranscoder.prototype.setModulePath = function (modulePath) {
            this._modulePath = modulePath;
        };
        LiteTranscoder.prototype.needMemoryManager = function () {
            return true;
        };
        LiteTranscoder.prototype.setMemoryManager = function (memoryMgr) {
            this._memoryManager = memoryMgr;
        };
        LiteTranscoder.prototype.transcode = function (src, dst, level, width, height, uncompressedByteLength, ktx2Reader, imageDesc, encodedData) {
            var _this = this;
            return this._loadModule().then(function (moduleWrapper) {
                var transcoder = moduleWrapper.module;
                var nBlocks = ((width + 3) >> 2) * ((height + 3) >> 2);
                var texMemoryPages = ((nBlocks * 16 + 65535) >> 16) + 1;
                var textureView = _this.memoryManager.getMemoryView(texMemoryPages, 65536, nBlocks * 16);
                textureView.set(encodedData);
                return transcoder.transcode(nBlocks) === 0 ? textureView.slice() : null;
            });
        };
        return LiteTranscoder;
    }(Transcoder));
    
    /**
     * LiteTranscoder_UASTC_BC7
     */
    var LiteTranscoder_UASTC_BC7 = /** @class */ (function (_super) {
        __extends(LiteTranscoder_UASTC_BC7, _super);
        function LiteTranscoder_UASTC_BC7() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LiteTranscoder_UASTC_BC7.CanTranscode = function (src, dst) {
            return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.BC7_M5_RGBA;
        };
        LiteTranscoder_UASTC_BC7.prototype.initialize = function () {
            this.setModulePath(LiteTranscoder_UASTC_BC7.WasmModuleURL);
        };
        /**
         * URL to use when loading the wasm module for the transcoder
         */
        LiteTranscoder_UASTC_BC7.WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_bc7.wasm";
        return LiteTranscoder_UASTC_BC7;
    }(LiteTranscoder));
    
    /**
     * LiteTranscoder_UASTC_ASTC
     */
    var LiteTranscoder_UASTC_ASTC = /** @class */ (function (_super) {
        __extends(LiteTranscoder_UASTC_ASTC, _super);
        function LiteTranscoder_UASTC_ASTC() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LiteTranscoder_UASTC_ASTC.CanTranscode = function (src, dst) {
            return src === sourceTextureFormat.UASTC4x4 && dst === transcodeTarget.ASTC_4x4_RGBA;
        };
        LiteTranscoder_UASTC_ASTC.prototype.initialize = function () {
            this.setModulePath(LiteTranscoder_UASTC_ASTC.WasmModuleURL);
        };
        /**
         * URL to use when loading the wasm module for the transcoder
         */
        LiteTranscoder_UASTC_ASTC.WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/uastc_astc.wasm";
        return LiteTranscoder_UASTC_ASTC;
    }(LiteTranscoder));
    
    /**
     * MSCTranscoder
     */
    var MSCTranscoder = /** @class */ (function (_super) {
        __extends(MSCTranscoder, _super);
        function MSCTranscoder() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MSCTranscoder.prototype._getMSCBasisTranscoder = function () {
            var _this = this;
            if (this._mscBasisTranscoderPromise) {
                return this._mscBasisTranscoderPromise;
            }
            this._mscBasisTranscoderPromise = new Promise(function (resolve) {
                importScripts(MSCTranscoder.JSModuleURL);
                WASMMemoryManager.LoadWASM(MSCTranscoder.WasmModuleURL).then(function (wasmBinary) {
                    MSC_TRANSCODER({ wasmBinary: wasmBinary }).then(function (basisModule) {
                        basisModule.initTranscoders();
                        _this._mscBasisModule = basisModule;
                        resolve();
                    });
                });
            });
            return this._mscBasisTranscoderPromise;
        };
        MSCTranscoder.CanTranscode = function (src, dst) {
            return true;
        };
        MSCTranscoder.prototype.transcode = function (src, dst, level, width, height, uncompressedByteLength, ktx2Reader, imageDesc, encodedData) {
            var _this = this;
            var isVideo = false;
            return this._getMSCBasisTranscoder().then(function () {
                var basisModule = _this._mscBasisModule;
                var TranscodeTarget = basisModule.TranscodeTarget;
                var TextureFormat = basisModule.TextureFormat;
                var ImageInfo = basisModule.ImageInfo;
                var transcoder = src === sourceTextureFormat.UASTC4x4 ? new basisModule.UastcImageTranscoder() : new basisModule.BasisLzEtc1sImageTranscoder();
                var texFormat = src === sourceTextureFormat.UASTC4x4 ? TextureFormat.UASTC4x4 : TextureFormat.ETC1S;
                var imageInfo = new ImageInfo(texFormat, width, height, level);
                var targetFormat = TranscodeTarget[transcodeTarget[dst]]; // works because the labels of the sourceTextureFormat enum are the same than the property names used in TranscodeTarget!
                if (!basisModule.isFormatSupported(targetFormat, texFormat)) {
                    throw new Error("MSCTranscoder: Transcoding from \"" + sourceTextureFormat[src] + "\" to \"" + transcodeTarget[dst] + "\" not supported by current transcoder build.");
                }
                var result;
                if (src === sourceTextureFormat.ETC1S) {
                    var sgd = ktx2Reader.supercompressionGlobalData;
                    transcoder.decodePalettes(sgd.endpointCount, sgd.endpointsData, sgd.selectorCount, sgd.selectorsData);
                    transcoder.decodeTables(sgd.tablesData);
                    imageInfo.flags = imageDesc.imageFlags;
                    imageInfo.rgbByteOffset = 0;
                    imageInfo.rgbByteLength = imageDesc.rgbSliceByteLength;
                    imageInfo.alphaByteOffset = imageDesc.alphaSliceByteOffset > 0 ? imageDesc.rgbSliceByteLength : 0;
                    imageInfo.alphaByteLength = imageDesc.alphaSliceByteLength;
                    result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, isVideo);
                }
                else {
                    imageInfo.flags = 0;
                    imageInfo.rgbByteOffset = 0;
                    imageInfo.rgbByteLength = uncompressedByteLength;
                    imageInfo.alphaByteOffset = 0;
                    imageInfo.alphaByteLength = 0;
                    result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, ktx2Reader.hasAlpha, isVideo);
                }
                if (result && result.transcodedImage !== undefined) {
                    var textureData = result.transcodedImage.get_typed_memory_view().slice();
                    result.transcodedImage.delete();
                    return textureData;
                }
                return null;
            });
        };
        /**
         * URL to use when loading the MSC transcoder
         */
        MSCTranscoder.JSModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/msc_basis_transcoder.js";
        /**
         * URL to use when loading the wasm module for the transcoder
         */
        MSCTranscoder.WasmModuleURL = "https://preview.babylonjs.com/ktx2Transcoders/msc_basis_transcoder.wasm";
        return MSCTranscoder;
    }(Transcoder));

    TranscoderManager.registerTranscoder(LiteTranscoder_UASTC_ASTC);
    TranscoderManager.registerTranscoder(LiteTranscoder_UASTC_BC7);
    TranscoderManager.registerTranscoder(MSCTranscoder);

    /**
     * DataReader
     */
    var DataReader = /** @class */ (function () {
        /**
         * Constructor
         * @param buffer The buffer to read
         */
        function DataReader(buffer) {
            /**
             * Indicates the endianness of the data in the buffer
             */
            this.littleEndian = true;
            this.buffer = buffer;
        }
        Object.defineProperty(DataReader.prototype, "byteOffset", {
            /**
             * The current byte offset from the beginning of the data buffer.
             */
            get: function () {
                return this._dataByteOffset;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Loads the given byte length.
         * @param byteLength The byte length to load
         * @returns A promise that resolves when the load is complete
         */
        DataReader.prototype.loadAsync = function (byteLength) {
            var _this = this;
            delete this._dataView;
            delete this._dataByteOffset;
            if (!this.buffer) {
                return Promise.resolve();
            }
            else {
                return this.buffer.readAsync(this.byteOffset, byteLength).then(function (data) {
                    _this._dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
                    _this._dataByteOffset = 0;
                });
            }
        };
        /**
         * Sets the given buffer
         * @param buffer The buffer to set
         * @param byteOffset The starting offset in the buffer
         * @param byteLength The byte length of the buffer
         * @returns This instance
         */
        DataReader.prototype.setBuffer = function (buffer, byteOffset, byteLength) {
            if (buffer.buffer) {
                this._dataView = new DataView(buffer.buffer, byteOffset !== null && byteOffset !== void 0 ? byteOffset : buffer.byteOffset, byteLength !== null && byteLength !== void 0 ? byteLength : buffer.byteLength);
            }
            else {
                this._dataView = new DataView(buffer, byteOffset !== null && byteOffset !== void 0 ? byteOffset : 0, byteLength !== null && byteLength !== void 0 ? byteLength : buffer.byteLength);
            }
            this._dataByteOffset = 0;
            return this;
        };
        /**
         * Read a unsigned 8-bit integer from the currently loaded data range.
         * @returns The 8-bit integer read
         */
        DataReader.prototype.readUint8 = function () {
            var value = this._dataView.getUint8(this._dataByteOffset);
            this._dataByteOffset += 1;
            return value;
        };
        /**
         * Read a signed 8-bit integer from the currently loaded data range.
         * @returns The 8-bit integer read
         */
        DataReader.prototype.readInt8 = function () {
            var value = this._dataView.getInt8(this._dataByteOffset);
            this._dataByteOffset += 1;
            return value;
        };
        /**
         * Read a unsigned 16-bit integer from the currently loaded data range.
         * @returns The 16-bit integer read
         */
        DataReader.prototype.readUint16 = function () {
            var value = this._dataView.getUint16(this._dataByteOffset, this.littleEndian);
            this._dataByteOffset += 2;
            return value;
        };
        /**
         * Read a signed 16-bit integer from the currently loaded data range.
         * @returns The 16-bit integer read
         */
        DataReader.prototype.readInt16 = function () {
            var value = this._dataView.getInt16(this._dataByteOffset, this.littleEndian);
            this._dataByteOffset += 2;
            return value;
        };
        /**
         * Read a unsigned 32-bit integer from the currently loaded data range.
         * @returns The 32-bit integer read
         */
        DataReader.prototype.readUint32 = function () {
            var value = this._dataView.getUint32(this._dataByteOffset, this.littleEndian);
            this._dataByteOffset += 4;
            return value;
        };
        /**
         * Read a signed 32-bit integer from the currently loaded data range.
         * @returns The 32-bit integer read
         */
        DataReader.prototype.readInt32 = function () {
            var value = this._dataView.getInt32(this._dataByteOffset, this.littleEndian);
            this._dataByteOffset += 4;
            return value;
        };
        /**
         * Read a unsigned 32-bit integer from the currently loaded data range.
         * @returns The 32-bit integer read
         */
        DataReader.prototype.readUint64 = function () {
            // split 64-bit number into two 32-bit (4-byte) parts
            var left = this._dataView.getUint32(this._dataByteOffset, this.littleEndian);
            var right = this._dataView.getUint32(this._dataByteOffset + 4, this.littleEndian);
            // combine the two 32-bit values
            var combined = this.littleEndian ? left + (Math.pow(2, 32) * right) : (Math.pow(2, 32) * left) + right;
            /*if (!Number.isSafeInteger(combined)) {
                console.warn('DataReader: ' + combined + ' exceeds MAX_SAFE_INTEGER. Precision may be lost.');
            }*/
            this._dataByteOffset += 8;
            return combined;
        };
        /**
         * Read a byte array from the currently loaded data range.
         * @param byteLength The byte length to read
         * @returns The byte array read
         */
        DataReader.prototype.readUint8Array = function (byteLength) {
            var value = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._dataByteOffset, byteLength);
            this._dataByteOffset += byteLength;
            return value;
        };
        /**
         * Read a string from the currently loaded data range.
         * @param byteLength The byte length to read
         * @returns The string read
         */
        DataReader.prototype.readString = function (byteLength) {
            return StringTools.Decode(this.readUint8Array(byteLength));
        };
        /**
         * Skips the given byte length the currently loaded data range.
         * @param byteLength The byte length to skip
         * @returns This instance
         */
        DataReader.prototype.skipBytes = function (byteLength) {
            this._dataByteOffset += byteLength;
            return this;
        };
        return DataReader;
    }());

    /**
     * KTX2FileReader
     */
    var supercompressionScheme;
    (function (supercompressionScheme) {
        supercompressionScheme[supercompressionScheme["None"] = 0] = "None";
        supercompressionScheme[supercompressionScheme["BasisLZ"] = 1] = "BasisLZ";
        supercompressionScheme[supercompressionScheme["ZStandard"] = 2] = "ZStandard";
        supercompressionScheme[supercompressionScheme["ZLib"] = 3] = "ZLib";
    })(supercompressionScheme || (supercompressionScheme = {}));
    var dfdModel;
    (function (dfdModel) {
        dfdModel[dfdModel["ETC1S"] = 163] = "ETC1S";
        dfdModel[dfdModel["UASTC"] = 166] = "UASTC";
    })(dfdModel || (dfdModel = {}));
    var dfdChannel_ETC1S;
    (function (dfdChannel_ETC1S) {
        dfdChannel_ETC1S[dfdChannel_ETC1S["RGB"] = 0] = "RGB";
        dfdChannel_ETC1S[dfdChannel_ETC1S["RRR"] = 3] = "RRR";
        dfdChannel_ETC1S[dfdChannel_ETC1S["GGG"] = 4] = "GGG";
        dfdChannel_ETC1S[dfdChannel_ETC1S["AAA"] = 15] = "AAA";
    })(dfdChannel_ETC1S || (dfdChannel_ETC1S = {}));
    var dfdChannel_UASTC;
    (function (dfdChannel_UASTC) {
        dfdChannel_UASTC[dfdChannel_UASTC["RGB"] = 0] = "RGB";
        dfdChannel_UASTC[dfdChannel_UASTC["RGBA"] = 3] = "RGBA";
        dfdChannel_UASTC[dfdChannel_UASTC["RRR"] = 4] = "RRR";
        dfdChannel_UASTC[dfdChannel_UASTC["RRRG"] = 5] = "RRRG";
    })(dfdChannel_UASTC || (dfdChannel_UASTC = {}));
    /**
     * Based on https://github.com/mrdoob/three.js/blob/dfb5c23ce126ec845e4aa240599915fef5375797/examples/jsm/loaders/KTX2Loader.js
     * @hidden
     */
    var KTX2FileReader = /** @class */ (function () {
        /**
         * Will throw an exception if the file can't be parsed
         */
        function KTX2FileReader(data) {
            this._data = data;
            this._parseData();
        }
        Object.defineProperty(KTX2FileReader.prototype, "data", {
            get: function () {
                return this._data;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KTX2FileReader.prototype, "header", {
            get: function () {
                return this._header;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KTX2FileReader.prototype, "levels", {
            get: function () {
                return this._levels;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KTX2FileReader.prototype, "dfdBlock", {
            get: function () {
                return this._dfdBlock;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KTX2FileReader.prototype, "supercompressionGlobalData", {
            get: function () {
                return this._supercompressionGlobalData;
            },
            enumerable: false,
            configurable: true
        });
        KTX2FileReader.prototype._parseData = function () {
            var offsetInFile = 12; // skip the header
            /**
             * Get the header
             */
            var hdrReader = new DataReader().setBuffer(this._data, offsetInFile, 17 * 4);
            var header = this._header = {
                vkFormat: hdrReader.readUint32(),
                typeSize: hdrReader.readUint32(),
                pixelWidth: hdrReader.readUint32(),
                pixelHeight: hdrReader.readUint32(),
                pixelDepth: hdrReader.readUint32(),
                layerCount: hdrReader.readUint32(),
                faceCount: hdrReader.readUint32(),
                levelCount: hdrReader.readUint32(),
                supercompressionScheme: hdrReader.readUint32(),
                dfdByteOffset: hdrReader.readUint32(),
                dfdByteLength: hdrReader.readUint32(),
                kvdByteOffset: hdrReader.readUint32(),
                kvdByteLength: hdrReader.readUint32(),
                sgdByteOffset: hdrReader.readUint64(),
                sgdByteLength: hdrReader.readUint64(),
            };
            if (header.pixelDepth > 0) {
                throw new Error("Failed to parse KTX2 file - Only 2D textures are currently supported.");
            }
            if (header.layerCount > 1) {
                throw new Error("Failed to parse KTX2 file - Array textures are not currently supported.");
            }
            if (header.faceCount > 1) {
                //throw new Error(`Failed to parse KTX2 file - Cube textures are not currently supported.`);
            }
            console.log(header);
            offsetInFile += hdrReader.byteOffset;
            /**
             * Get the levels
             */
            var levelCount = Math.max(1, header.levelCount);
            var levelReader = new DataReader().setBuffer(this._data, offsetInFile, levelCount * 3 * (2 * 4));
            var levels = this._levels = [];
            while (levelCount--) {
                levels.push({
                    byteOffset: levelReader.readUint64(),
                    byteLength: levelReader.readUint64(),
                    uncompressedByteLength: levelReader.readUint64(),
                });
            }
            offsetInFile += levelReader.byteOffset;
            console.log(levels);
            /**
             * Get the data format descriptor (DFD) blocks
             */
            var dfdReader = new DataReader().setBuffer(this._data, header.dfdByteOffset, header.dfdByteLength);
            var dfdBlock = this._dfdBlock = {
                vendorId: dfdReader.skipBytes(4 /* skip totalSize */).readUint16(),
                descriptorType: dfdReader.readUint16(),
                versionNumber: dfdReader.readUint16(),
                descriptorBlockSize: dfdReader.readUint16(),
                colorModel: dfdReader.readUint8(),
                colorPrimaries: dfdReader.readUint8(),
                transferFunction: dfdReader.readUint8(),
                flags: dfdReader.readUint8(),
                texelBlockDimension: {
                    x: dfdReader.readUint8() + 1,
                    y: dfdReader.readUint8() + 1,
                    z: dfdReader.readUint8() + 1,
                    w: dfdReader.readUint8() + 1,
                },
                bytesPlane: [
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                    dfdReader.readUint8(),
                ],
                numSamples: 0,
                samples: new Array(),
            };
            dfdBlock.numSamples = (dfdBlock.descriptorBlockSize - 24) / 16;
            for (var i = 0; i < dfdBlock.numSamples; i++) {
                var sample = {
                    bitOffset: dfdReader.readUint16(),
                    bitLength: dfdReader.readUint8() + 1,
                    channelType: dfdReader.readUint8(),
                    channelFlags: 0,
                    samplePosition: [
                        dfdReader.readUint8(),
                        dfdReader.readUint8(),
                        dfdReader.readUint8(),
                        dfdReader.readUint8(),
                    ],
                    sampleLower: dfdReader.readUint32(),
                    sampleUpper: dfdReader.readUint32(),
                };
                sample.channelFlags = (sample.channelType & 0xF0) >> 4;
                sample.channelType = sample.channelType & 0x0F;
                dfdBlock.samples.push(sample);
            }
            console.log(dfdBlock);
            /*if (header.vkFormat !== KhronosTextureContainer2.VK_FORMAT_UNDEFINED &&
                 !(header.supercompressionScheme === supercompressionScheme.BasisLZ ||
                    dfdBlock.colorModel === dfdModel.UASTC)) {
                throw new Error(`Failed to upload - Only Basis Universal supercompression is currently supported.`);
            }*/
            /**
             * Get the Supercompression Global Data (sgd)
             */
            var sgd = this._supercompressionGlobalData = {};
            if (header.sgdByteLength > 0) {
                var sgdReader = new DataReader().setBuffer(this._data, header.sgdByteOffset, header.sgdByteLength);
                sgd.endpointCount = sgdReader.readUint16();
                sgd.selectorCount = sgdReader.readUint16();
                sgd.endpointsByteLength = sgdReader.readUint32();
                sgd.selectorsByteLength = sgdReader.readUint32();
                sgd.tablesByteLength = sgdReader.readUint32();
                sgd.extendedByteLength = sgdReader.readUint32();
                sgd.imageDescs = [];
                var imageCount = this._getImageCount();
                for (var i = 0; i < imageCount; i++) {
                    sgd.imageDescs.push({
                        imageFlags: sgdReader.readUint32(),
                        rgbSliceByteOffset: sgdReader.readUint32(),
                        rgbSliceByteLength: sgdReader.readUint32(),
                        alphaSliceByteOffset: sgdReader.readUint32(),
                        alphaSliceByteLength: sgdReader.readUint32(),
                    });
                }
                var endpointsByteOffset = header.sgdByteOffset + sgdReader.byteOffset;
                var selectorsByteOffset = endpointsByteOffset + sgd.endpointsByteLength;
                var tablesByteOffset = selectorsByteOffset + sgd.selectorsByteLength;
                var extendedByteOffset = tablesByteOffset + sgd.tablesByteLength;
                sgd.endpointsData = new Uint8Array(this._data.buffer, endpointsByteOffset, sgd.endpointsByteLength);
                sgd.selectorsData = new Uint8Array(this._data.buffer, selectorsByteOffset, sgd.selectorsByteLength);
                sgd.tablesData = new Uint8Array(this._data.buffer, tablesByteOffset, sgd.tablesByteLength);
                sgd.extendedData = new Uint8Array(this._data.buffer, extendedByteOffset, sgd.extendedByteLength);
            }
            console.log("sgd", sgd);
        };
        KTX2FileReader.prototype._getImageCount = function () {
            var layerPixelDepth = Math.max(this._header.pixelDepth, 1);
            for (var i = 1; i < this._header.levelCount; i++) {
                layerPixelDepth += Math.max(this._header.pixelDepth >> i, 1);
            }
            return Math.max(this._header.layerCount, 1) * this._header.faceCount * layerPixelDepth;
        };
        Object.defineProperty(KTX2FileReader.prototype, "textureFormat", {
            get: function () {
                return this._dfdBlock.colorModel === dfdModel.UASTC ? sourceTextureFormat.UASTC4x4 : sourceTextureFormat.ETC1S;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KTX2FileReader.prototype, "hasAlpha", {
            get: function () {
                var tformat = this.textureFormat;
                switch (tformat) {
                    case sourceTextureFormat.ETC1S:
                        return this._dfdBlock.numSamples === 2 && (this._dfdBlock.samples[0].channelType === dfdChannel_ETC1S.AAA || this._dfdBlock.samples[1].channelType === dfdChannel_ETC1S.AAA);
                    case sourceTextureFormat.UASTC4x4:
                        return this._dfdBlock.samples[0].channelType === dfdChannel_UASTC.RGBA;
                }
                return false;
            },
            enumerable: false,
            configurable: true
        });
        KTX2FileReader.prototype.getHasAlpha = function () {
            var tformat = this.textureFormat;
            switch (tformat) {
                case sourceTextureFormat.ETC1S:
                    return this._dfdBlock.numSamples === 2 && (this._dfdBlock.samples[0].channelType === dfdChannel_ETC1S.AAA || this._dfdBlock.samples[1].channelType === dfdChannel_ETC1S.AAA);
                case sourceTextureFormat.UASTC4x4:
                    return this._dfdBlock.samples[0].channelType === dfdChannel_UASTC.RGBA;
            }
            return false;
        };
        KTX2FileReader.IsValid = function (data) {
            if (data.byteLength >= 12) {
                // '«', 'K', 'T', 'X', ' ', '2', '0', '»', '\r', '\n', '\x1A', '\n'
                var identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
                if (identifier[0] === 0xAB && identifier[1] === 0x4B && identifier[2] === 0x54 && identifier[3] === 0x58 && identifier[4] === 0x20 && identifier[5] === 0x32 &&
                    identifier[6] === 0x30 && identifier[7] === 0xBB && identifier[8] === 0x0D && identifier[9] === 0x0A && identifier[10] === 0x1A && identifier[11] === 0x0A) {
                    return true;
                }
            }
            return false;
        };
        return KTX2FileReader;
    }());

    var transcoderMgr = new TranscoderManager();
    onmessage = function (event) {
        switch (event.data.action) {
            case "init":
                postMessage({ action: "init" });
                break;
            case "createMipmaps":
                try {
                    var kfr = new KTX2FileReader(event.data.data);
                    _createMipmaps(kfr, event.data.caps).then(function (mipmaps) {
                        postMessage({ action: "mipmapsCreated", success: true, id: event.data.id, mipmaps: mipmaps.mipmaps }, mipmaps.mipmapsData);
                    }).catch(function (reason) {
                        postMessage({ action: "mipmapsCreated", success: false, id: event.data.id, msg: reason });
                    });
                }
                catch (err) {
                    postMessage({ action: "mipmapsCreated", success: false, id: event.data.id, msg: err });
                }
                break;
        }
    };
    var _createMipmaps = function (kfr, caps) {
        var width = kfr.header.pixelWidth;
        var height = kfr.header.pixelHeight;
        var srcTexFormat = kfr.textureFormat;
        var isPowerOfTwo = function (value) {
            return (value & (value - 1)) === 0 && value !== 0;
        };

        // PVRTC1 transcoders (from both ETC1S and UASTC) only support power of 2 dimensions.
        var pvrtcTranscodable = isPowerOfTwo(width) && isPowerOfTwo(height);
        var targetFormat = transcodeTarget.BC7_M5_RGBA;
        var transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;
        if (caps.astc) {
            targetFormat = transcodeTarget.ASTC_4x4_RGBA;
            transcodedFormat = COMPRESSED_RGBA_ASTC_4x4_KHR;
        }
        else if (caps.bptc && srcTexFormat === sourceTextureFormat.UASTC4x4) {
            targetFormat = transcodeTarget.BC7_M5_RGBA;
            transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;
        }
        else if (caps.s3tc) {
            targetFormat = kfr.hasAlpha ? transcodeTarget.BC3_RGBA : transcodeTarget.BC1_RGB;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA_S3TC_DXT5_EXT : COMPRESSED_RGB_S3TC_DXT1_EXT;
        }
        else if (caps.pvrtc && pvrtcTranscodable) {
            targetFormat = kfr.hasAlpha ? transcodeTarget.PVRTC1_4_RGBA : transcodeTarget.PVRTC1_4_RGB;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA_PVRTC_4BPPV1_IMG : COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        }
        else if (caps.etc2) {
            targetFormat = kfr.hasAlpha ? transcodeTarget.ETC2_RGBA : transcodeTarget.ETC1_RGB /* subset of ETC2 */;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA8_ETC2_EAC : COMPRESSED_RGB8_ETC2;
        }
        else if (caps.etc1) {
            targetFormat = transcodeTarget.ETC1_RGB;
            transcodedFormat = COMPRESSED_RGB_ETC1_WEBGL;
        }
        else {
            targetFormat = transcodeTarget.RGBA32;
            transcodedFormat = RGBAFormat;
        }
        var transcoder = transcoderMgr.findTranscoder(srcTexFormat, targetFormat);
        if (transcoder === null) {
            throw new Error("no transcoder found to transcode source texture format \"" + sourceTextureFormat[srcTexFormat] + "\" to format \"" + transcodeTarget[targetFormat] + "\"");
        }
        var mipmaps = [];
        var texturePromises = [];
        var mipmapsData = [];
        var firstImageDescIndex = 0;
        for (var level = 0; level < kfr.header.levelCount; level++) {
            if (level > 0) {
                firstImageDescIndex += Math.max(kfr.header.layerCount, 1) * kfr.header.faceCount * Math.max(kfr.header.pixelDepth >> (level - 1), 1);
            }
            var levelWidth = width / Math.pow(2, level);
            var levelHeight = height / Math.pow(2, level);
            var numImagesInLevel = kfr.header.faceCount; // note that cubemap are not supported yet (see KTX2FileReader), so faceCount == 1
            var levelImageByteLength = ((levelWidth + 3) >> 2) * ((levelHeight + 3) >> 2) * kfr.dfdBlock.bytesPlane[0];
            var levelUncompressedByteLength = kfr.levels[level].uncompressedByteLength;
            var levelDataBuffer = kfr.data.buffer;
            var levelDataOffset = kfr.levels[level].byteOffset;
            var imageOffsetInLevel = 0;
            if (kfr.header.supercompressionScheme === supercompressionScheme.ZStandard) {
                //levelDataBuffer = this.zstd.decode(new Uint8Array(levelDataBuffer, levelDataOffset, levelByteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }
            var _loop_1 = function (imageIndex) {
                var encodedData = void 0;
                var imageDesc = null;
                if (kfr.header.supercompressionScheme === supercompressionScheme.BasisLZ) {
                    imageDesc = kfr.supercompressionGlobalData.imageDescs[firstImageDescIndex + imageIndex];
                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageDesc.rgbSliceByteOffset, imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength);
                }
                else {
                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageOffsetInLevel, levelImageByteLength);
                    imageOffsetInLevel += levelImageByteLength;
                }
                var mipmap = {
                    data: null,
                    width: levelWidth,
                    height: levelHeight,
                    transcodedFormat: transcodedFormat
                };
                var transcodedData = transcoder.transcode(srcTexFormat, targetFormat, level, levelWidth, levelHeight, levelUncompressedByteLength, kfr, imageDesc, encodedData).
                    then(function (data) {
                    mipmap.data = data;
                    if (data) {
                        mipmapsData.push(data.buffer);
                    }
                    return data;
                });
                mipmaps.push(mipmap);
                texturePromises.push(transcodedData);
            };
            for (var imageIndex = 0; imageIndex < numImagesInLevel; imageIndex++) {
                _loop_1(imageIndex);
            }
        }
        return Promise.all(texturePromises).then(function () {
            return { mipmaps: mipmaps, mipmapsData: mipmapsData };
        });
    };
}

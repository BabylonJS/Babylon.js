module BABYLON {
    /**
     * Keeps track of all the buffer info used in engine.
     */
    class BufferPointer {
        public active: boolean;
        public index: number;
        public size: number;
        public type: number;
        public normalized: boolean;
        public stride: number;
        public offset: number;
        public buffer: WebGLBuffer;
    }

    /**
     * Interface for attribute information associated with buffer instanciation
     */
    export class InstancingAttributeInfo {
        /**
         * Index/offset of the attribute in the vertex shader
         */
        index: number;

        /**
         * size of the attribute, 1, 2, 3 or 4
         */
        attributeSize: number;

        /**
         * type of the attribute, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
         * default is FLOAT
         */
        attribyteType: number;

        /**
         * normalization of fixed-point data. behavior unclear, use FALSE, default is FALSE
         */
        normalized: boolean;

        /**
         * Offset of the data in the Vertex Buffer acting as the instancing buffer
         */
        offset: number;

        /**
         * Name of the GLSL attribute, for debugging purpose only
         */
        attributeName: string;
    }

    /**
     * Define options used to create a render target texture
     */
    export class RenderTargetCreationOptions {
        /**
         * Specifies is mipmaps must be generated
         */
        generateMipMaps?: boolean;
        /** Specifies whether or not a depth should be allocated in the texture (true by default) */
        generateDepthBuffer?: boolean;
        /** Specifies whether or not a stencil should be allocated in the texture (false by default)*/
        generateStencilBuffer?: boolean;
        /** Defines texture type (int by default) */
        type?: number;
        /** Defines sampling mode (trilinear by default) */
        samplingMode?: number;
        /** Defines format (RGBA by default) */
        format?: number;
    }

    /**
     * Define options used to create a depth texture
     */
    export class DepthTextureCreationOptions {
        /** Specifies whether or not a stencil should be allocated in the texture */
        generateStencil?: boolean;
        /** Specifies whether or not bilinear filtering is enable on the texture */
        bilinearFiltering?: boolean;
        /** Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode */
        comparisonFunction?: number;
        /** Specifies if the created texture is a cube texture */
        isCube?: boolean;
    }

    /**
     * Class used to describe the capabilities of the engine relatively to the current browser
     */
    export class EngineCapabilities {
        /** Maximum textures units per fragment shader */
        public maxTexturesImageUnits: number;
        /** Maximum texture units per vertex shader */
        public maxVertexTextureImageUnits: number;
        /** Maximum textures units in the entire pipeline */
        public maxCombinedTexturesImageUnits: number;
        /** Maximum texture size */
        public maxTextureSize: number;
        /** Maximum cube texture size */
        public maxCubemapTextureSize: number;
        /** Maximum render texture size */
        public maxRenderTextureSize: number;
        /** Maximum number of vertex attributes */
        public maxVertexAttribs: number;
        /** Maximum number of varyings */
        public maxVaryingVectors: number;
        /** Maximum number of uniforms per vertex shader */
        public maxVertexUniformVectors: number;
        /** Maximum number of uniforms per fragment shader */
        public maxFragmentUniformVectors: number;
        /** Defines if standard derivates (dx/dy) are supported */
        public standardDerivatives: boolean;
        /** Defines if s3tc texture compression is supported */
        public s3tc: Nullable<WEBGL_compressed_texture_s3tc>;
        /** Defines if pvrtc texture compression is supported */
        public pvrtc: any; //WEBGL_compressed_texture_pvrtc;
        /** Defines if etc1 texture compression is supported */
        public etc1: any; //WEBGL_compressed_texture_etc1;
        /** Defines if etc2 texture compression is supported */
        public etc2: any; //WEBGL_compressed_texture_etc;
        /** Defines if astc texture compression is supported */
        public astc: any; //WEBGL_compressed_texture_astc;
        /** Defines if float textures are supported */
        public textureFloat: boolean;
        /** Defines if vertex array objects are supported */
        public vertexArrayObject: boolean;
        /** Gets the webgl extension for anisotropic filtering (null if not supported) */
        public textureAnisotropicFilterExtension: Nullable<EXT_texture_filter_anisotropic>;
        /** Gets the maximum level of anisotropy supported */
        public maxAnisotropy: number;
        /** Defines if instancing is supported */
        public instancedArrays: boolean;
        /** Defines if 32 bits indices are supported */
        public uintIndices: boolean;
        /** Defines if high precision shaders are supported */
        public highPrecisionShaderSupported: boolean;
        /** Defines if depth reading in the fragment shader is supported */
        public fragmentDepthSupported: boolean;
        /** Defines if float texture linear filtering is supported*/
        public textureFloatLinearFiltering: boolean;
        /** Defines if rendering to float textures is supported */
        public textureFloatRender: boolean;
        /** Defines if half float textures are supported*/
        public textureHalfFloat: boolean;
        /** Defines if half float texture linear filtering is supported*/
        public textureHalfFloatLinearFiltering: boolean;
        /** Defines if rendering to half float textures is supported */
        public textureHalfFloatRender: boolean;
        /** Defines if textureLOD shader command is supported */
        public textureLOD: boolean;
        /** Defines if draw buffers extension is supported */
        public drawBuffersExtension: boolean;
        /** Defines if depth textures are supported */
        public depthTextureExtension: boolean;
        /** Defines if float color buffer are supported */
        public colorBufferFloat: boolean;
        /** Gets disjoint timer query extension (null if not supported) */
        public timerQuery: EXT_disjoint_timer_query;
        /** Defines if timestamp can be used with timer query */
        public canUseTimestampForTimerQuery: boolean;
    }

    /** Interface defining initialization parameters for Engine class */
    export interface EngineOptions extends WebGLContextAttributes {
        /** 
         * Defines if the engine should no exceed a specified device ratio
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
         */
        limitDeviceRatio?: number;
        /** 
         * Defines if webvr should be enabled automatically 
         * @see http://doc.babylonjs.com/how_to/webvr_camera
         */
        autoEnableWebVR?: boolean;
        /** 
         * Defines if webgl2 should be turned off even if supported 
         * @see http://doc.babylonjs.com/features/webgl2
         */
        disableWebGL2Support?: boolean;
        /** 
         * Defines if webaudio should be initialized as well
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
         */
        audioEngine?: boolean;
        /** 
         * Defines if animations should run using a deterministic lock step
         * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
         */
        deterministicLockstep?: boolean;
        /** Defines the maximum steps to use with deterministic lock step mode */
        lockstepMaxSteps?: number;
        /** 
         * Defines that engine should ignore context lost events
         * If this event happens when this parameter is true, you will have to reload the page to restore rendering
         */
        doNotHandleContextLost?: boolean;
    }

    /**
     * Defines the interface used by display changed events
     */
    export interface IDisplayChangedEventArgs {
        /** Gets the vrDisplay object (if any) */
        vrDisplay: Nullable<any>;
        /** Gets a boolean indicating if webVR is supported */
        vrSupported: boolean;
    }

    /**
     * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio
     */
    export class Engine {
        /** Use this array to turn off some WebGL2 features on known buggy browsers version */
        public static ExceptionList = [
            { key: "Chrome/63.0", capture: "63\\.0\\.3239\\.(\\d+)", captureConstraint: 108, targets: ["uniformBuffer"] },
            { key: "Firefox/58", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
            { key: "Firefox/59", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
            { key: "Macintosh", capture: null, captureConstraint: null, targets: ["textureBindingOptimization"] },
            { key: "iPhone", capture: null, captureConstraint: null, targets: ["textureBindingOptimization"] },
            { key: "iPad", capture: null, captureConstraint: null, targets: ["textureBindingOptimization"] }
        ];

        /** Gets the list of created engines */
        public static Instances = new Array<Engine>();

        /**
         * Gets the latest created engine
         */
        public static get LastCreatedEngine(): Nullable<Engine> {
            if (Engine.Instances.length === 0) {
                return null;
            }

            return Engine.Instances[Engine.Instances.length - 1];
        }

        /**
         * Gets the latest created scene
         */
        public static get LastCreatedScene(): Nullable<Scene> {
            var lastCreatedEngine = Engine.LastCreatedEngine;
            if (!lastCreatedEngine) {
                return null;
            }

            if (lastCreatedEngine.scenes.length === 0) {
                return null;
            }

            return lastCreatedEngine.scenes[lastCreatedEngine.scenes.length - 1];
        }

        /**
         * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
         * @param flag defines which part of the materials must be marked as dirty
         * @param predicate defines a predicate used to filter which materials should be affected
         */
        public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
            for (var engineIndex = 0; engineIndex < Engine.Instances.length; engineIndex++) {
                var engine = Engine.Instances[engineIndex];

                for (var sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                    engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
                }
            }
        }

        /**
         * Hidden
         */
        public static _TextureLoaders: IInternalTextureLoader[] = [];

        // Const statics
        /** Defines that alpha blending is disabled */
        public static readonly ALPHA_DISABLE = 0;
        /** Defines that alpha blending to SRC ALPHA * SRC + DEST */
        public static readonly ALPHA_ADD = 1;
        /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
        public static readonly ALPHA_COMBINE = 2;
        /** Defines that alpha blending to DEST - SRC * DEST */
        public static readonly ALPHA_SUBTRACT = 3;
        /** Defines that alpha blending to SRC * DEST */
        public static readonly ALPHA_MULTIPLY = 4;
        /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC) * DEST */
        public static readonly ALPHA_MAXIMIZED = 5;
        /** Defines that alpha blending to SRC + DEST */
        public static readonly ALPHA_ONEONE = 6;
        /** Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST */
        public static readonly ALPHA_PREMULTIPLIED = 7;
        /** 
         * Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST
         * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
         */
        public static readonly ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
        /** Defines that alpha blending to CST * SRC + (1 - CST) * DEST */
        public static readonly ALPHA_INTERPOLATE = 9;
        /** 
         * Defines that alpha blending to SRC + (1 - SRC) * DEST 
         * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
         */
        public static readonly ALPHA_SCREENMODE = 10;

        /** Defines that the ressource is not delayed*/
        public static readonly DELAYLOADSTATE_NONE = 0;
        /** Defines that the ressource was successfully delay loaded */
        public static readonly DELAYLOADSTATE_LOADED = 1;
        /** Defines that the ressource is currently delay loading */
        public static readonly DELAYLOADSTATE_LOADING = 2;
        /** Defines that the ressource is delayed and has not started loading */
        public static readonly DELAYLOADSTATE_NOTLOADED = 4;

        // Depht or Stencil test Constants.
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
        public static readonly NEVER = 0x0200;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
        public static readonly ALWAYS = 0x0207;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
        public static readonly LESS = 0x0201;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
        public static readonly EQUAL = 0x0202;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
        public static readonly LEQUAL = 0x0203;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
        public static readonly GREATER = 0x0204;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
        public static readonly GEQUAL = 0x0206;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
        public static readonly NOTEQUAL = 0x0205;

        // Stencil Actions Constants.
        /** Passed to stencilOperation to specify that stencil value must be kept */
        public static readonly KEEP = 0x1E00;
        /** Passed to stencilOperation to specify that stencil value must be replaced */
        public static readonly REPLACE = 0x1E01;
        /** Passed to stencilOperation to specify that stencil value must be incremented */
        public static readonly INCR = 0x1E02;
        /** Passed to stencilOperation to specify that stencil value must be decremented */
        public static readonly DECR = 0x1E03;
        /** Passed to stencilOperation to specify that stencil value must be inverted */
        public static readonly INVERT = 0x150A;
        /** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
        public static readonly INCR_WRAP = 0x8507;
        /** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
        public static readonly DECR_WRAP = 0x8508;

        /** Texture is not repeating outside of 0..1 UVs */
        public static readonly TEXTURE_CLAMP_ADDRESSMODE = 0;
        /** Texture is repeating outside of 0..1 UVs */
        public static readonly TEXTURE_WRAP_ADDRESSMODE = 1;
        /** Texture is repeating and mirrored */
        public static readonly TEXTURE_MIRROR_ADDRESSMODE = 2;

        /** ALPHA */
        public static readonly TEXTUREFORMAT_ALPHA = 0;
        /** LUMINANCE */
        public static readonly TEXTUREFORMAT_LUMINANCE = 1;
        /** LUMINANCE_ALPHA */
        public static readonly TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
        /** RGB */
        public static readonly TEXTUREFORMAT_RGB = 4;
        /** RGBA */
        public static readonly TEXTUREFORMAT_RGBA = 5;
        /** RED */
        public static readonly TEXTUREFORMAT_RED = 6;
        /** RED (2nd reference) */
        public static readonly TEXTUREFORMAT_R = 6;
        /** RG */
        public static readonly TEXTUREFORMAT_RG = 7;
        /** RED_INTEGER */
        public static readonly TEXTUREFORMAT_RED_INTEGER = 8;
        /** RED_INTEGER (2nd reference) */
        public static readonly TEXTUREFORMAT_R_INTEGER = 8;
        /** RG_INTEGER */
        public static readonly TEXTUREFORMAT_RG_INTEGER = 9;
        /** RGB_INTEGER */
        public static readonly TEXTUREFORMAT_RGB_INTEGER = 10;
        /** RGBA_INTEGER */
        public static readonly TEXTUREFORMAT_RGBA_INTEGER = 11;

        /** UNSIGNED_BYTE */
        public static readonly TEXTURETYPE_UNSIGNED_BYTE = 0;
        /** UNSIGNED_BYTE (2nd reference) */
        public static readonly TEXTURETYPE_UNSIGNED_INT = 0;
        /** FLOAT */
        public static readonly TEXTURETYPE_FLOAT = 1;
        /** HALF_FLOAT */
        public static readonly TEXTURETYPE_HALF_FLOAT = 2;
        /** BYTE */
        public static readonly TEXTURETYPE_BYTE = 3;
        /** SHORT */
        public static readonly TEXTURETYPE_SHORT = 4;
        /** UNSIGNED_SHORT */
        public static readonly TEXTURETYPE_UNSIGNED_SHORT = 5;
        /** INT */
        public static readonly TEXTURETYPE_INT = 6;
        /** UNSIGNED_INT */
        public static readonly TEXTURETYPE_UNSIGNED_INTEGER = 7;
        /** UNSIGNED_SHORT_4_4_4_4 */
        public static readonly TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = 8;
        /** UNSIGNED_SHORT_5_5_5_1 */
        public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = 9;
        /** UNSIGNED_SHORT_5_6_5 */
        public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = 10;
        /** UNSIGNED_INT_2_10_10_10_REV */
        public static readonly TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = 11;
        /** UNSIGNED_INT_24_8 */
        public static readonly TEXTURETYPE_UNSIGNED_INT_24_8 = 12;
        /** UNSIGNED_INT_10F_11F_11F_REV */
        public static readonly TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = 13;
        /** UNSIGNED_INT_5_9_9_9_REV */
        public static readonly TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = 14;
        /** FLOAT_32_UNSIGNED_INT_24_8_REV */
        public static readonly TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;

        /** nearest is mag = nearest and min = nearest and mip = linear */
        public static readonly TEXTURE_NEAREST_SAMPLINGMODE = 1; 
        /** Bilinear is mag = linear and min = linear and mip = nearest */
        public static readonly TEXTURE_BILINEAR_SAMPLINGMODE = 2;
        /** Trilinear is mag = linear and min = linear and mip = linear */
        public static readonly TEXTURE_TRILINEAR_SAMPLINGMODE = 3;
        /** nearest is mag = nearest and min = nearest and mip = linear */
        public static readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR = 1; 
        /** Bilinear is mag = linear and min = linear and mip = nearest */
        public static readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST = 2;
        /** Trilinear is mag = linear and min = linear and mip = linear */
        public static readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR = 3;
        /** mag = nearest and min = nearest and mip = nearest */
        public static readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST = 4;
        /** mag = nearest and min = linear and mip = nearest */
        public static readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST = 5;
        /** mag = nearest and min = linear and mip = linear */
        public static readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR = 6;
        /** mag = nearest and min = linear and mip = none */
        public static readonly TEXTURE_NEAREST_LINEAR = 7;
        /** mag = nearest and min = nearest and mip = none */
        public static readonly TEXTURE_NEAREST_NEAREST = 8;
        /** mag = linear and min = nearest and mip = nearest */
        public static readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST = 9;
        /** mag = linear and min = nearest and mip = linear */
        public static readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR = 10;
        /** mag = linear and min = linear and mip = none */
        public static readonly TEXTURE_LINEAR_LINEAR = 11;
        /** mag = linear and min = nearest and mip = none */
        public static readonly TEXTURE_LINEAR_NEAREST = 12;

        /** Explicit coordinates mode */
        public static readonly TEXTURE_EXPLICIT_MODE = 0;
        /** Spherical coordinates mode */
        public static readonly TEXTURE_SPHERICAL_MODE = 1;
        /** Planar coordinates mode */
        public static readonly TEXTURE_PLANAR_MODE = 2;
        /** Cubic coordinates mode */
        public static readonly TEXTURE_CUBIC_MODE = 3;
        /** Projection coordinates mode */
        public static readonly TEXTURE_PROJECTION_MODE = 4;
        /** Skybox coordinates mode */
        public static readonly TEXTURE_SKYBOX_MODE = 5;
        /** Inverse Cubic coordinates mode */
        public static readonly TEXTURE_INVCUBIC_MODE = 6;
        /** Equirectangular coordinates mode */
        public static readonly TEXTURE_EQUIRECTANGULAR_MODE = 7;
        /** Equirectangular Fixed coordinates mode */
        public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MODE = 8;
        /** Equirectangular Fixed Mirrored coordinates mode */
        public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;

        // Texture rescaling mode
        /** Defines that texture rescaling will use a floor to find the closer power of 2 size */
        public static readonly SCALEMODE_FLOOR = 1;
        /** Defines that texture rescaling will look for the nearest power of 2 size */
        public static readonly SCALEMODE_NEAREST = 2;
        /** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
        public static readonly SCALEMODE_CEILING = 3;

        /**
         * Returns the current version of the framework
         */
        public static get Version(): string {
            return "3.3.0-alpha.13";
        }

        // Updatable statics so stick with vars here

        /**
         * Gets or sets the epsilon value used by collision engine
         */
        public static CollisionsEpsilon = 0.001;

        /**
         * Gets or sets the relative url used to load code if using the engine in non-minified mode
         */
        public static CodeRepository = "src/";
        /**
         * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
         */
        public static ShadersRepository = "src/Shaders/";

        // Public members

        /**
         * Gets or sets a boolean that indicates if textures must be forced to power of 2 size even if not required
         */
        public forcePOTTextures = false;

        /**
         * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
         */
        public isFullscreen = false;

        /**
         * Gets a boolean indicating if the pointer is currently locked
         */
        public isPointerLock = false;

        /**
         * Gets or sets a boolean indicating if back faces must be culled (true by default)
         */
        public cullBackFaces = true;

        /**
         * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foregroun
         */
        public renderEvenInBackground = true;

        /**
         * Gets or sets a boolean indicating that cache can be kept between frames
         */
        public preventCacheWipeBetweenFrames = false;

        /** 
         * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
         **/
        public enableOfflineSupport = false;

        /** 
         * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (Babylon.js will always consider the database is up to date)
         **/
        public disableManifestCheck = false;        

        /**
         * Gets the list of created scenes
         */
        public scenes = new Array<Scene>();

        /**
         * Gets the list of created postprocesses
         */
        public postProcesses = new Array<PostProcess>();

        /** Gets or sets a boolean indicating if the engine should validate programs after compilation */
        public validateShaderPrograms = false;

        // Observables

        /**
         * Observable event triggered each time the rendering canvas is resized
         */
        public onResizeObservable = new Observable<Engine>();

        /**
         * Observable event triggered each time the canvas loses focus
         */
        public onCanvasBlurObservable = new Observable<Engine>();

        /**
         * Observable event triggered each time the canvas gains focus
         */
        public onCanvasFocusObservable = new Observable<Engine>();

        /**
         * Observable event triggered each time the canvas receives pointerout event
         */
        public onCanvasPointerOutObservable = new Observable<PointerEvent>();

        /**
         * Observable event triggered before each texture is initialized
         */
        public onBeforeTextureInitObservable = new Observable<Texture>();

        //WebVR

        private _vrDisplay: any = undefined;
        private _vrSupported: boolean = false;
        private _oldSize: Size;
        private _oldHardwareScaleFactor: number;
        private _vrExclusivePointerMode = false;
        private _webVRInitPromise: Promise<IDisplayChangedEventArgs>;

        /**
         * Gets a boolean indicating that the engine is currently in VR exclusive mode for the pointers
         * @see https://docs.microsoft.com/en-us/microsoft-edge/webvr/essentials#mouse-input
         */
        public get isInVRExclusivePointerMode(): boolean {
            return this._vrExclusivePointerMode;
        }

        // Uniform buffers list

        /**
         * Gets or sets a boolean indicating that uniform buffers must be disabled even if they are supported
         */
        public disableUniformBuffers = false;

        /** @hidden */
        public _uniformBuffers = new Array<UniformBuffer>();

        /**
         * Gets a boolean indicating that the engine supports uniform buffers
         * @see http://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         */
        public get supportsUniformBuffers(): boolean {
            return this.webGLVersion > 1 && !this.disableUniformBuffers;
        }

        // Observables

        /**
         * Observable raised when the engine begins a new frame
         */
        public onBeginFrameObservable = new Observable<Engine>();

        /**
         * Observable raised when the engine ends the current frame
         */
        public onEndFrameObservable = new Observable<Engine>();

        /**
         * Observable raised when the engine is about to compile a shader
         */
        public onBeforeShaderCompilationObservable = new Observable<Engine>();

        /**
         * Observable raised when the engine has jsut compiled a shader
         */
        public onAfterShaderCompilationObservable = new Observable<Engine>();

        // Private Members

        /** @hidden */
        public _gl: WebGLRenderingContext;
        private _renderingCanvas: Nullable<HTMLCanvasElement>;
        private _windowIsBackground = false;
        private _webGLVersion = 1.0;

        /**
         * Gets a boolean indicating that only power of 2 textures are supported
         * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
         */
        public get needPOTTextures(): boolean {
            return this._webGLVersion < 2 || this.forcePOTTextures;
        }

        /** @hidden */
        public _badOS = false;

        /** @hidden */
        public _badDesktopOS = false;

        /**
         * Gets or sets a value indicating if we want to disable texture binding optmization.
         * This could be required on some buggy drivers which wants to have textures bound in a progressive order.
         * By default Babylon.js will try to let textures bound where they are and only update the samplers to point where the texture is
         */
        public disableTextureBindingOptimization = false;

        /** 
         * Gets the audio engine 
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
         * @ignorenaming
         */
        public static audioEngine: AudioEngine;

        // Focus
        private _onFocus: () => void;
        private _onBlur: () => void;
        private _onCanvasPointerOut: (event: PointerEvent) => void;
        private _onCanvasBlur: () => void;
        private _onCanvasFocus: () => void;

        private _onFullscreenChange: () => void;
        private _onPointerLockChange: () => void;

        private _onVRDisplayPointerRestricted: () => void;
        private _onVRDisplayPointerUnrestricted: () => void;

        // VRDisplay connection
        private _onVrDisplayConnect: Nullable<(display: any) => void>;
        private _onVrDisplayDisconnect: Nullable<() => void>;
        private _onVrDisplayPresentChange: Nullable<() => void>;

        /**
         * Observable signaled when VR display mode changes
         */
        public onVRDisplayChangedObservable = new Observable<IDisplayChangedEventArgs>();
        /**
         * Observable signaled when VR request present is complete
         */
        public onVRRequestPresentComplete = new Observable<boolean>();
        /**
         * Observable signaled when VR request present starts
         */
        public onVRRequestPresentStart = new Observable<Engine>();

        private _hardwareScalingLevel: number;
        /** @hidden */
        protected _caps: EngineCapabilities;
        private _pointerLockRequested: boolean;
        private _isStencilEnable: boolean;
        private _colorWrite = true;

        private _loadingScreen: ILoadingScreen;

        /** @hidden */
        public _drawCalls = new PerfCounter();
        /** @hidden */
        public _textureCollisions = new PerfCounter();

        private _glVersion: string;
        private _glRenderer: string;
        private _glVendor: string;

        private _videoTextureSupported: boolean;

        private _renderingQueueLaunched = false;
        private _activeRenderLoops = new Array<() => void>();

        // Deterministic lockstepMaxSteps
        private _deterministicLockstep: boolean = false;
        private _lockstepMaxSteps: number = 4;

        // Lost context
        /**
         * Observable signaled when a context lost event is raised
         */
        public onContextLostObservable = new Observable<Engine>();
        /**
         * Observable signaled when a context restored event is raised
         */
        public onContextRestoredObservable = new Observable<Engine>();
        private _onContextLost: (evt: Event) => void;
        private _onContextRestored: (evt: Event) => void;
        private _contextWasLost = false;
        private _doNotHandleContextLost = false;

        /**
         * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
         * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#handling-webgl-context-lost
         */
        public get doNotHandleContextLost(): boolean {
            return this._doNotHandleContextLost;
        }

        public set doNotHandleContextLost(value: boolean) {
            this._doNotHandleContextLost = value;
        }

        // FPS
        private _performanceMonitor = new PerformanceMonitor();
        private _fps = 60;
        private _deltaTime = 0;
        /**
         * Turn this value on if you want to pause FPS computation when in background
         */
        public disablePerformanceMonitorInBackground = false;

        /**
         * Gets the performance monitor attached to this engine
         * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#engineinstrumentation
         */
        public get performanceMonitor(): PerformanceMonitor {
            return this._performanceMonitor;
        }

        // States
        /** @hidden */
        protected _depthCullingState = new _DepthCullingState();
        /** @hidden */
        protected _stencilState = new _StencilState();
        /** @hidden */
        protected _alphaState = new _AlphaState();
        /** @hidden */
        protected _alphaMode = Engine.ALPHA_DISABLE;

        // Cache
        protected _internalTexturesCache = new Array<InternalTexture>();
        /** @hidden */
        protected _activeChannel = 0;
        private _currentTextureChannel = -1;    
        /** @hidden */
        protected _boundTexturesCache: { [key: string]: Nullable<InternalTexture> } = {};
        /** @hidden */
        protected _currentEffect: Nullable<Effect>;
        /** @hidden */
        protected _currentProgram: Nullable<WebGLProgram>;
        private _compiledEffects: { [key: string]: Effect } = {}
        private _vertexAttribArraysEnabled: boolean[] = [];
        /** @hidden */
        protected _cachedViewport: Nullable<Viewport>;
        private _cachedVertexArrayObject: Nullable<WebGLVertexArrayObject>;
        /** @hidden */
        protected _cachedVertexBuffers: any;
        /** @hidden */
        protected _cachedIndexBuffer: Nullable<WebGLBuffer>;
        /** @hidden */
        protected _cachedEffectForVertexBuffers: Nullable<Effect>;
        /** @hidden */
        protected _currentRenderTarget: Nullable<InternalTexture>;
        private _uintIndicesCurrentlySet = false;
        private _currentBoundBuffer = new Array<Nullable<WebGLBuffer>>();
        /** @hidden */
        protected _currentFramebuffer: Nullable<WebGLFramebuffer> = null;
        private _currentBufferPointers = new Array<BufferPointer>();
        private _currentInstanceLocations = new Array<number>();
        private _currentInstanceBuffers = new Array<WebGLBuffer>();
        private _textureUnits: Int32Array;
        private _firstBoundInternalTextureTracker = new DummyInternalTextureTracker();
        private _lastBoundInternalTextureTracker = new DummyInternalTextureTracker();

        private _workingCanvas: Nullable<HTMLCanvasElement>;
        private _workingContext: Nullable<CanvasRenderingContext2D>;
        private _rescalePostProcess: PassPostProcess;

        private _dummyFramebuffer: WebGLFramebuffer;

        private _externalData: StringDictionary<Object>;
        private _bindedRenderFunction: any;

        private _vaoRecordInProgress = false;
        private _mustWipeVertexAttributes = false;

        private _emptyTexture: Nullable<InternalTexture>;
        private _emptyCubeTexture: Nullable<InternalTexture>;
        private _emptyTexture3D: Nullable<InternalTexture>;

        private _frameHandler: number;

        private _nextFreeTextureSlots = new Array<number>();
        private _maxSimultaneousTextures = 0;

        private _activeRequests = new Array<IFileRequest>();

        // Hardware supported Compressed Textures
        private _texturesSupported = new Array<string>();
        private _textureFormatInUse: Nullable<string>;

        /**
         * Gets the list of texture formats supported
         */
        public get texturesSupported(): Array<string> {
            return this._texturesSupported;
        }

        /**
         * Gets the list of texture formats in use
         */
        public get textureFormatInUse(): Nullable<string> {
            return this._textureFormatInUse;
        }

        /**
         * Gets the current viewport
         */
        public get currentViewport(): Nullable<Viewport> {
            return this._cachedViewport;
        }

        /**
         * Gets the default empty texture
         */
        public get emptyTexture(): InternalTexture {
            if (!this._emptyTexture) {
                this._emptyTexture = this.createRawTexture(new Uint8Array(4), 1, 1, Engine.TEXTUREFORMAT_RGBA, false, false, Engine.TEXTURE_NEAREST_SAMPLINGMODE);
            }

            return this._emptyTexture;
        }

        /**
         * Gets the default empty 3D texture
         */        
        public get emptyTexture3D(): InternalTexture {
            if (!this._emptyTexture3D) {
                this._emptyTexture3D = this.createRawTexture3D(new Uint8Array(4), 1, 1, 1, Engine.TEXTUREFORMAT_RGBA, false, false, Engine.TEXTURE_NEAREST_SAMPLINGMODE);
            }

            return this._emptyTexture3D;
        }

        /**
         * Gets the default empty cube texture
         */        
        public get emptyCubeTexture(): InternalTexture {
            if (!this._emptyCubeTexture) {
                var faceData = new Uint8Array(4);
                var cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
                this._emptyCubeTexture = this.createRawCubeTexture(cubeData, 1, Engine.TEXTUREFORMAT_RGBA, Engine.TEXTURETYPE_UNSIGNED_INT, false, false, Engine.TEXTURE_NEAREST_SAMPLINGMODE);
            }

            return this._emptyCubeTexture;
        }

        /**
         * Defines whether the engine has been created with the premultipliedAlpha option on or not.
         */
        public readonly premultipliedAlpha: boolean = true;

        /**
         * Creates a new engine
         * @param canvasOrContext defines the canvas or WebGL context to use for rendering
         * @param antialias defines enable antialiasing (default: false)
         * @param options defines further options to be sent to the getContext() function
         * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
         */
        constructor(canvasOrContext: Nullable<HTMLCanvasElement | WebGLRenderingContext>, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio: boolean = false) {

            // Register promises
            PromisePolyfill.Apply();

            let canvas: Nullable<HTMLCanvasElement> = null;
            Engine.Instances.push(this);

            if (!canvasOrContext) {
                return;
            }

            options = options || {};

            if ((<HTMLCanvasElement>canvasOrContext).getContext) {
                canvas = <HTMLCanvasElement>canvasOrContext;
                this._renderingCanvas = canvas;

                if (antialias != null) {
                    options.antialias = antialias;
                }

                if (options.deterministicLockstep === undefined) {
                    options.deterministicLockstep = false;
                }

                if (options.lockstepMaxSteps === undefined) {
                    options.lockstepMaxSteps = 4;
                }

                if (options.preserveDrawingBuffer === undefined) {
                    options.preserveDrawingBuffer = false;
                }

                if (options.audioEngine === undefined) {
                    options.audioEngine = true;
                }

                if (options.stencil === undefined) {
                    options.stencil = true;
                }

                if (options.premultipliedAlpha === false) {
                    this.premultipliedAlpha = false;
                }

                this._deterministicLockstep = options.deterministicLockstep;
                this._lockstepMaxSteps = options.lockstepMaxSteps;
                this._doNotHandleContextLost = options.doNotHandleContextLost ? true : false;

                // Exceptions
                if (navigator && navigator.userAgent) {
                    let ua = navigator.userAgent;

                    for (var exception of Engine.ExceptionList) {
                        let key = exception.key;
                        let targets = exception.targets;

                        if (ua.indexOf(key) > -1) {
                            if (exception.capture && exception.captureConstraint) {
                                let capture = exception.capture;
                                let constraint = exception.captureConstraint;

                                let regex = new RegExp(capture);
                                let matches = regex.exec(ua);

                                if (matches && matches.length > 0) {
                                    let capturedValue = parseInt(matches[matches.length - 1]);
                                    if (capturedValue >= constraint) {
                                        continue;
                                    }
                                }
                            }

                            for (var target of targets) {
                                switch (target) {
                                    case "uniformBuffer":
                                        this.disableUniformBuffers = true;
                                        break;
                                    case "textureBindingOptimization":
                                        this.disableTextureBindingOptimization = true;
                                        break;
                                }
                            }
                        }
                    }
                }
                
                // GL
                if (!options.disableWebGL2Support) {
                    try {
                        this._gl = <any>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
                        if (this._gl) {
                            this._webGLVersion = 2.0;
                        }
                    } catch (e) {
                        // Do nothing
                    }
                }

                if (!this._gl) {
                    if (!canvas) {
                        throw new Error("The provided canvas is null or undefined.");
                    }
                    try {
                        this._gl = <WebGLRenderingContext>(canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
                    } catch (e) {
                        throw new Error("WebGL not supported");
                    }
                }

                if (!this._gl) {
                    throw new Error("WebGL not supported");
                }

                this._onCanvasFocus = () => {
                    this.onCanvasFocusObservable.notifyObservers(this);
                }

                this._onCanvasBlur = () => {
                    this.onCanvasBlurObservable.notifyObservers(this);
                }

                canvas.addEventListener("focus", this._onCanvasFocus);
                canvas.addEventListener("blur", this._onCanvasBlur);

                this._onBlur = () => {
                    if (this.disablePerformanceMonitorInBackground) {
                        this._performanceMonitor.disable();
                    }
                    this._windowIsBackground = true;
                };

                this._onFocus = () => {
                    if (this.disablePerformanceMonitorInBackground) {
                        this._performanceMonitor.enable();
                    }
                    this._windowIsBackground = false;
                };

                this._onCanvasPointerOut = (ev) => {
                    this.onCanvasPointerOutObservable.notifyObservers(ev);
                };

                window.addEventListener("blur", this._onBlur);
                window.addEventListener("focus", this._onFocus);

                canvas.addEventListener("pointerout", this._onCanvasPointerOut);

                // Context lost
                if (!this._doNotHandleContextLost) {
                    this._onContextLost = (evt: Event) => {
                        evt.preventDefault();
                        this._contextWasLost = true;
                        Tools.Warn("WebGL context lost.");

                        this.onContextLostObservable.notifyObservers(this);
                    };

                    this._onContextRestored = (evt: Event) => {
                        // Adding a timeout to avoid race condition at browser level
                        setTimeout(() => {
                            // Rebuild gl context
                            this._initGLContext();

                            // Rebuild effects
                            this._rebuildEffects();

                            // Rebuild textures
                            this._rebuildInternalTextures();

                            // Rebuild buffers
                            this._rebuildBuffers();

                            // Cache
                            this.wipeCaches(true);

                            Tools.Warn("WebGL context successfully restored.");

                            this.onContextRestoredObservable.notifyObservers(this);

                            this._contextWasLost = false;
                        }, 0);
                    };

                    canvas.addEventListener("webglcontextlost", this._onContextLost, false);
                    canvas.addEventListener("webglcontextrestored", this._onContextRestored, false);
                }
            } else {
                this._gl = <WebGLRenderingContext>canvasOrContext;
                this._renderingCanvas = this._gl.canvas

                if (this._gl.renderbufferStorageMultisample) {
                    this._webGLVersion = 2.0;
                }

                options.stencil = this._gl.getContextAttributes().stencil;
            }

            // Viewport
            var limitDeviceRatio = options.limitDeviceRatio || window.devicePixelRatio || 1.0;
            this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, window.devicePixelRatio || 1.0) : 1.0;
            this.resize();

            this._isStencilEnable = options.stencil ? true : false;
            this._initGLContext();

            if (canvas) {
                // Fullscreen
                this._onFullscreenChange = () => {
                    if (document.fullscreen !== undefined) {
                        this.isFullscreen = document.fullscreen;
                    } else if (document.mozFullScreen !== undefined) {
                        this.isFullscreen = document.mozFullScreen;
                    } else if (document.webkitIsFullScreen !== undefined) {
                        this.isFullscreen = document.webkitIsFullScreen;
                    } else if (document.msIsFullScreen !== undefined) {
                        this.isFullscreen = document.msIsFullScreen;
                    }

                    // Pointer lock
                    if (this.isFullscreen && this._pointerLockRequested && canvas) {
                        canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.msRequestPointerLock ||
                            canvas.mozRequestPointerLock ||
                            canvas.webkitRequestPointerLock;

                        if (canvas.requestPointerLock) {
                            canvas.requestPointerLock();
                        }
                    }
                };

                document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);

                // Pointer lock
                this._onPointerLockChange = () => {
                    this.isPointerLock = (document.mozPointerLockElement === canvas ||
                        document.webkitPointerLockElement === canvas ||
                        document.msPointerLockElement === canvas ||
                        document.pointerLockElement === canvas
                    );
                };

                document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("mspointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);

                this._onVRDisplayPointerRestricted = () => {
                    if (canvas) {
                        canvas.requestPointerLock();
                    }
                }

                this._onVRDisplayPointerUnrestricted = () => {
                    document.exitPointerLock();
                }

                window.addEventListener('vrdisplaypointerrestricted', this._onVRDisplayPointerRestricted, false);
                window.addEventListener('vrdisplaypointerunrestricted', this._onVRDisplayPointerUnrestricted, false);
            }

            if (options.audioEngine && AudioEngine && !Engine.audioEngine) {
                Engine.audioEngine = new AudioEngine();
            }

            // Prepare buffer pointers
            for (var i = 0; i < this._caps.maxVertexAttribs; i++) {
                this._currentBufferPointers[i] = new BufferPointer();
            }

            this._linkTrackers(this._firstBoundInternalTextureTracker, this._lastBoundInternalTextureTracker);

            // Load WebVR Devices
            if (options.autoEnableWebVR) {
                this.initWebVR();
            }

            // Detect if we are running on a faulty buggy OS.
            this._badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);

            // Detect if we are running on a faulty buggy desktop OS.
            this._badDesktopOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            console.log("Babylon.js engine (v" + Engine.Version + ") launched");

            this.enableOfflineSupport = (Database !== undefined);
        }

        private _rebuildInternalTextures(): void {
            let currentState = this._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

            for (var internalTexture of currentState) {
                internalTexture._rebuild();
            }
        }

        private _rebuildEffects(): void {
            for (var key in this._compiledEffects) {
                let effect = <Effect>this._compiledEffects[key];

                effect._prepareEffect();
            }

            Effect.ResetCache();
        }

        private _rebuildBuffers(): void {
            // Index / Vertex
            for (var scene of this.scenes) {
                scene.resetCachedMaterial();
                scene._rebuildGeometries();
                scene._rebuildTextures();
            }

            // Uniforms
            for (var uniformBuffer of this._uniformBuffers) {
                uniformBuffer._rebuild();
            }
        }

        private _initGLContext(): void {
            // Caps
            this._caps = new EngineCapabilities();
            this._caps.maxTexturesImageUnits = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
            this._caps.maxCombinedTexturesImageUnits = this._gl.getParameter(this._gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
            this._caps.maxVertexTextureImageUnits = this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
            this._caps.maxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
            this._caps.maxCubemapTextureSize = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            this._caps.maxRenderTextureSize = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);
            this._caps.maxVertexAttribs = this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS);
            this._caps.maxVaryingVectors = this._gl.getParameter(this._gl.MAX_VARYING_VECTORS);
            this._caps.maxFragmentUniformVectors = this._gl.getParameter(this._gl.MAX_FRAGMENT_UNIFORM_VECTORS);
            this._caps.maxVertexUniformVectors = this._gl.getParameter(this._gl.MAX_VERTEX_UNIFORM_VECTORS);

            // Infos
            this._glVersion = this._gl.getParameter(this._gl.VERSION);

            var rendererInfo: any = this._gl.getExtension("WEBGL_debug_renderer_info");
            if (rendererInfo != null) {
                this._glRenderer = this._gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL);
                this._glVendor = this._gl.getParameter(rendererInfo.UNMASKED_VENDOR_WEBGL);
            }

            if (!this._glVendor) {
                this._glVendor = "Unknown vendor";
            }

            if (!this._glRenderer) {
                this._glRenderer = "Unknown renderer";
            }

            // Constants
            this._gl.HALF_FLOAT_OES = 0x8D61;   // Half floating-point type (16-bit).
            if (this._gl.RGBA16F !== 0x881A) {
                this._gl.RGBA16F = 0x881A;      // RGBA 16-bit floating-point color-renderable internal sized format.
            }
            if (this._gl.RGBA32F !== 0x8814) {
                this._gl.RGBA32F = 0x8814;      // RGBA 32-bit floating-point color-renderable internal sized format.
            }
            if (this._gl.DEPTH24_STENCIL8 !== 35056) {
                this._gl.DEPTH24_STENCIL8 = 35056;
            }

            // Extensions
            this._caps.standardDerivatives = this._webGLVersion > 1 || (this._gl.getExtension('OES_standard_derivatives') !== null);

            this._caps.astc = this._gl.getExtension('WEBGL_compressed_texture_astc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_astc');
            this._caps.s3tc = this._gl.getExtension('WEBGL_compressed_texture_s3tc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
            this._caps.pvrtc = this._gl.getExtension('WEBGL_compressed_texture_pvrtc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
            this._caps.etc1 = this._gl.getExtension('WEBGL_compressed_texture_etc1') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_etc1');
            this._caps.etc2 = this._gl.getExtension('WEBGL_compressed_texture_etc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_etc') ||
                this._gl.getExtension('WEBGL_compressed_texture_es3_0'); // also a requirement of OpenGL ES 3

            this._caps.textureAnisotropicFilterExtension = this._gl.getExtension('EXT_texture_filter_anisotropic') || this._gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this._gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
            this._caps.maxAnisotropy = this._caps.textureAnisotropicFilterExtension ? this._gl.getParameter(this._caps.textureAnisotropicFilterExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
            this._caps.uintIndices = this._webGLVersion > 1 || this._gl.getExtension('OES_element_index_uint') !== null;
            this._caps.fragmentDepthSupported = this._webGLVersion > 1 || this._gl.getExtension('EXT_frag_depth') !== null;
            this._caps.highPrecisionShaderSupported = true;
            this._caps.timerQuery = this._gl.getExtension('EXT_disjoint_timer_query_webgl2') || this._gl.getExtension("EXT_disjoint_timer_query");
            if (this._caps.timerQuery) {
                if (this._webGLVersion === 1) {
                    this._gl.getQuery = (<any>this._caps.timerQuery).getQueryEXT.bind(this._caps.timerQuery);
                }
                this._caps.canUseTimestampForTimerQuery = this._gl.getQuery(this._caps.timerQuery.TIMESTAMP_EXT, this._caps.timerQuery.QUERY_COUNTER_BITS_EXT) > 0;
            }

            // Checks if some of the format renders first to allow the use of webgl inspector.
            this._caps.colorBufferFloat = this._webGLVersion > 1 && this._gl.getExtension('EXT_color_buffer_float');

            this._caps.textureFloat = (this._webGLVersion > 1 || this._gl.getExtension('OES_texture_float')) ? true : false;
            this._caps.textureFloatLinearFiltering = this._caps.textureFloat && this._gl.getExtension('OES_texture_float_linear') ? true : false;
            this._caps.textureFloatRender = this._caps.textureFloat && this._canRenderToFloatFramebuffer() ? true: false;

            this._caps.textureHalfFloat = (this._webGLVersion > 1 || this._gl.getExtension('OES_texture_half_float')) ? true: false;
            this._caps.textureHalfFloatLinearFiltering = (this._webGLVersion > 1 || (this._caps.textureHalfFloat && this._gl.getExtension('OES_texture_half_float_linear'))) ? true : false;
            if (this._webGLVersion > 1) {
                this._gl.HALF_FLOAT_OES = 0x140B;
            }
            this._caps.textureHalfFloatRender = this._caps.textureHalfFloat && this._canRenderToHalfFloatFramebuffer();

            this._caps.textureLOD = (this._webGLVersion > 1 || this._gl.getExtension('EXT_shader_texture_lod')) ? true: false;

            // Draw buffers
            if (this._webGLVersion > 1) {
                this._caps.drawBuffersExtension = true;
            } else {
                var drawBuffersExtension = this._gl.getExtension('WEBGL_draw_buffers');

                if (drawBuffersExtension !== null) {
                    this._caps.drawBuffersExtension = true;
                    this._gl.drawBuffers = drawBuffersExtension.drawBuffersWEBGL.bind(drawBuffersExtension);
                    this._gl.DRAW_FRAMEBUFFER = this._gl.FRAMEBUFFER;

                    for (var i = 0; i < 16; i++) {
                        (<any>this._gl)["COLOR_ATTACHMENT" + i + "_WEBGL"] = (<any>drawBuffersExtension)["COLOR_ATTACHMENT" + i + "_WEBGL"];
                    }
                } else {
                    this._caps.drawBuffersExtension = false;
                }
            }

            // Depth Texture
            if (this._webGLVersion > 1) {
                this._caps.depthTextureExtension = true;
            } else {
                var depthTextureExtension = this._gl.getExtension('WEBGL_depth_texture');

                if (depthTextureExtension != null) {
                    this._caps.depthTextureExtension = true;
                    this._gl.UNSIGNED_INT_24_8 = depthTextureExtension.UNSIGNED_INT_24_8_WEBGL;
                }
            }

            // Vertex array object
            if (this._webGLVersion > 1) {
                this._caps.vertexArrayObject = true;
            } else {
                var vertexArrayObjectExtension = this._gl.getExtension('OES_vertex_array_object');

                if (vertexArrayObjectExtension != null) {
                    this._caps.vertexArrayObject = true;
                    this._gl.createVertexArray = vertexArrayObjectExtension.createVertexArrayOES.bind(vertexArrayObjectExtension);
                    this._gl.bindVertexArray = vertexArrayObjectExtension.bindVertexArrayOES.bind(vertexArrayObjectExtension);
                    this._gl.deleteVertexArray = vertexArrayObjectExtension.deleteVertexArrayOES.bind(vertexArrayObjectExtension);
                } else {
                    this._caps.vertexArrayObject = false;
                }
            }
            // Instances count
            if (this._webGLVersion > 1) {
                this._caps.instancedArrays = true;
            } else {
                var instanceExtension = <ANGLE_instanced_arrays>this._gl.getExtension('ANGLE_instanced_arrays');

                if (instanceExtension != null) {
                    this._caps.instancedArrays = true;
                    this._gl.drawArraysInstanced = instanceExtension.drawArraysInstancedANGLE.bind(instanceExtension);
                    this._gl.drawElementsInstanced = instanceExtension.drawElementsInstancedANGLE.bind(instanceExtension);
                    this._gl.vertexAttribDivisor = instanceExtension.vertexAttribDivisorANGLE.bind(instanceExtension);
                } else {
                    this._caps.instancedArrays = false;
                }
            }

            // Intelligently add supported compressed formats in order to check for.
            // Check for ASTC support first as it is most powerful and to be very cross platform.
            // Next PVRTC & DXT, which are probably superior to ETC1/2.
            // Likely no hardware which supports both PVR & DXT, so order matters little.
            // ETC2 is newer and handles ETC1 (no alpha capability), so check for first.
            if (this._caps.astc) this.texturesSupported.push('-astc.ktx');
            if (this._caps.s3tc) this.texturesSupported.push('-dxt.ktx');
            if (this._caps.pvrtc) this.texturesSupported.push('-pvrtc.ktx');
            if (this._caps.etc2) this.texturesSupported.push('-etc2.ktx');
            if (this._caps.etc1) this.texturesSupported.push('-etc1.ktx');

            if (this._gl.getShaderPrecisionFormat) {
                var highp = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);

                if (highp) {
                    this._caps.highPrecisionShaderSupported = highp.precision !== 0;
                }
            }

            // Depth buffer
            this.setDepthBuffer(true);
            this.setDepthFunctionToLessOrEqual();
            this.setDepthWrite(true);

            // Texture maps
            this._maxSimultaneousTextures = this._caps.maxCombinedTexturesImageUnits;
            for (let slot = 0; slot < this._maxSimultaneousTextures; slot++) {
                this._nextFreeTextureSlots.push(slot);
            }
        }

        /**
         * Gets version of the current webGL context
         */
        public get webGLVersion(): number {
            return this._webGLVersion;
        }

        /**
         * Returns true if the stencil buffer has been enabled through the creation option of the context.
         */
        public get isStencilEnable(): boolean {
            return this._isStencilEnable;
        }

        private _prepareWorkingCanvas(): void {
            if (this._workingCanvas) {
                return;
            }

            this._workingCanvas = document.createElement("canvas");
            let context = this._workingCanvas.getContext("2d");

            if (context) {
                this._workingContext = context;
            }
        }

        /**
         * Reset the texture cache to empty state
         */
        public resetTextureCache() {
            for (var key in this._boundTexturesCache) {
                if (!this._boundTexturesCache.hasOwnProperty(key)) {
                    continue;
                }
                let boundTexture = this._boundTexturesCache[key];
                if (boundTexture) {
                    this._removeDesignatedSlot(boundTexture);
                }
                this._boundTexturesCache[key] = null;
            }       
            
            if (!this.disableTextureBindingOptimization) {
                this._nextFreeTextureSlots = [];
                for (let slot = 0; slot < this._maxSimultaneousTextures; slot++) {
                    this._nextFreeTextureSlots.push(slot);
                }
            }

            this._currentTextureChannel = -1;
        }

        /**
         * Gets a boolean indicating that the engine is running in deterministic lock step mode
         * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
         * @returns true if engine is in deterministic lock step mode
         */
        public isDeterministicLockStep(): boolean {
            return this._deterministicLockstep;
        }

        /**
         * Gets the max steps when engine is running in deterministic lock step
         * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
         * @returns the max steps
         */
        public getLockstepMaxSteps(): number {
            return this._lockstepMaxSteps;
        }

        /**
         * Gets an object containing information about the current webGL context
         * @returns an object containing the vender, the renderer and the version of the current webGL context
         */
        public getGlInfo() {
            return {
                vendor: this._glVendor,
                renderer: this._glRenderer,
                version: this._glVersion
            }
        }

        /**
         * Gets current aspect ratio
         * @param camera defines the camera to use to get the aspect ratio
         * @param useScreen defines if screen size must be used (or the current render target if any)
         * @returns a number defining the aspect ratio
         */
        public getAspectRatio(camera: Camera, useScreen = false): number {
            var viewport = camera.viewport;
            return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
        }

        /**
         * Gets current screen aspect ratio
         * @returns a number defining the aspect ratio
         */
        public getScreenAspectRatio(): number {
            return (this.getRenderWidth(true)) / (this.getRenderHeight(true));
        }        

        /**
         * Gets the current render width
         * @param useScreen defines if screen size must be used (or the current render target if any)
         * @returns a number defining the current render width
         */
        public getRenderWidth(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget.width;
            }

            return this._gl.drawingBufferWidth;
        }

        /**
         * Gets the current render height
         * @param useScreen defines if screen size must be used (or the current render target if any)
         * @returns a number defining the current render height
         */        
        public getRenderHeight(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget.height;
            }

            return this._gl.drawingBufferHeight;
        }

        /**
         * Gets the HTML canvas attached with the current webGL context
         * @returns a HTML canvas
         */
        public getRenderingCanvas(): Nullable<HTMLCanvasElement> {
            return this._renderingCanvas;
        }

        /**
         * Gets the client rect of the HTML canvas attached with the current webGL context
         * @returns a client rectanglee
         */
        public getRenderingCanvasClientRect(): Nullable<ClientRect> {
            if (!this._renderingCanvas) {
                return null;
            }
            return this._renderingCanvas.getBoundingClientRect();
        }

        /**
         * Defines the hardware scaling level.
         * By default the hardware scaling level is computed from the window device ratio.
         * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
         * @param level defines the level to use
         */
        public setHardwareScalingLevel(level: number): void {
            this._hardwareScalingLevel = level;
            this.resize();
        }

        /**
         * Gets the current hardware scaling level.
         * By default the hardware scaling level is computed from the window device ratio.
         * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
         * @returns a number indicating the current hardware scaling level
         */        
        public getHardwareScalingLevel(): number {
            return this._hardwareScalingLevel;
        }

        /**
         * Gets the list of loaded textures
         * @returns an array containing all loaded textures
         */
        public getLoadedTexturesCache(): InternalTexture[] {
            return this._internalTexturesCache;
        }

        /**
         * Gets the object containing all engine capabilities
         * @returns the EngineCapabilities object
         */
        public getCaps(): EngineCapabilities {
            return this._caps;
        }

        /** @hidden */
        public get drawCalls(): number {
            Tools.Warn("drawCalls is deprecated. Please use SceneInstrumentation class");
            return 0;
        }

        /** @hidden */
        public get drawCallsPerfCounter(): Nullable<PerfCounter> {
            Tools.Warn("drawCallsPerfCounter is deprecated. Please use SceneInstrumentation class");
            return null;
        }

        /**
         * Gets the current depth function
         * @returns a number defining the depth function
         */
        public getDepthFunction(): Nullable<number> {
            return this._depthCullingState.depthFunc;
        }

        /**
         * Sets the current depth function
         * @param depthFunc defines the function to use
         */
        public setDepthFunction(depthFunc: number) {
            this._depthCullingState.depthFunc = depthFunc;
        }

        /**
         * Sets the current depth function to GREATER
         */        
        public setDepthFunctionToGreater(): void {
            this._depthCullingState.depthFunc = this._gl.GREATER;
        }

        /**
         * Sets the current depth function to GEQUAL
         */        
        public setDepthFunctionToGreaterOrEqual(): void {
            this._depthCullingState.depthFunc = this._gl.GEQUAL;
        }

        /**
         * Sets the current depth function to LESS
         */          
        public setDepthFunctionToLess(): void {
            this._depthCullingState.depthFunc = this._gl.LESS;
        }

        /**
         * Sets the current depth function to LEQUAL
         */                
        public setDepthFunctionToLessOrEqual(): void {
            this._depthCullingState.depthFunc = this._gl.LEQUAL;
        }

        /**
         * Gets a boolean indicating if stencil buffer is enabled
         * @returns the current stencil buffer state
         */
        public getStencilBuffer(): boolean {
            return this._stencilState.stencilTest;
        }

        /**
         * Enable or disable the stencil buffer
         * @param enable defines if the stencil buffer must be enabled or disabled
         */
        public setStencilBuffer(enable: boolean): void {
            this._stencilState.stencilTest = enable;
        }

        /**
         * Gets the current stencil mask
         * @returns a number defining the new stencil mask to use
         */
        public getStencilMask(): number {
            return this._stencilState.stencilMask;
        }

        /**
         * Sets the current stencil mask
         * @param mask defines the new stencil mask to use
         */        
        public setStencilMask(mask: number): void {
            this._stencilState.stencilMask = mask;
        }

        /**
         * Gets the current stencil function
         * @returns a number defining the stencil function to use
         */        
        public getStencilFunction(): number {
            return this._stencilState.stencilFunc;
        }

        /**
         * Gets the current stencil reference value
         * @returns a number defining the stencil reference value to use
         */             
        public getStencilFunctionReference(): number {
            return this._stencilState.stencilFuncRef;
        }

        /**
         * Gets the current stencil mask
         * @returns a number defining the stencil mask to use
         */                 
        public getStencilFunctionMask(): number {
            return this._stencilState.stencilFuncMask;
        }

        /**
         * Sets the current stencil function
         * @param stencilFunc defines the new stencil function to use
         */             
        public setStencilFunction(stencilFunc: number) {
            this._stencilState.stencilFunc = stencilFunc;
        }

        /**
         * Sets the current stencil reference
         * @param reference defines the new stencil reference to use
         */            
        public setStencilFunctionReference(reference: number) {
            this._stencilState.stencilFuncRef = reference;
        }

        /**
         * Sets the current stencil mask
         * @param mask defines the new stencil mask to use
         */            
        public setStencilFunctionMask(mask: number) {
            this._stencilState.stencilFuncMask = mask;
        }

        /**
         * Gets the current stencil operation when stencil fails
         * @returns a number defining stencil operation to use when stencil fails
         */           
        public getStencilOperationFail(): number {
            return this._stencilState.stencilOpStencilFail;
        }

        /**
         * Gets the current stencil operation when depth fails
         * @returns a number defining stencil operation to use when depth fails
         */           
        public getStencilOperationDepthFail(): number {
            return this._stencilState.stencilOpDepthFail;
        }

        /**
         * Gets the current stencil operation when stencil passes
         * @returns a number defining stencil operation to use when stencil passes
         */         
        public getStencilOperationPass(): number {
            return this._stencilState.stencilOpStencilDepthPass;
        }

        /**
         * Sets the stencil operation to use when stencil fails
         * @param operation defines the stencil operation to use when stencil fails
         */         
        public setStencilOperationFail(operation: number): void {
            this._stencilState.stencilOpStencilFail = operation;
        }

        /**
         * Sets the stencil operation to use when depth fails
         * @param operation defines the stencil operation to use when depth fails
         */         
        public setStencilOperationDepthFail(operation: number): void {
            this._stencilState.stencilOpDepthFail = operation;
        }

        /**
         * Sets the stencil operation to use when stencil passes
         * @param operation defines the stencil operation to use when stencil passes
         */        
        public setStencilOperationPass(operation: number): void {
            this._stencilState.stencilOpStencilDepthPass = operation;
        }

        /**
         * Sets a boolean indicating if the dithering state is enabled or disabled
         * @param value defines the dithering state
         */
        public setDitheringState(value: boolean): void {
            if (value) {
                this._gl.enable(this._gl.DITHER);
            } else {
                this._gl.disable(this._gl.DITHER);
            }
        }

        /**
         * Sets a boolean indicating if the rasterizer state is enabled or disabled
         * @param value defines the rasterizer state
         */        
        public setRasterizerState(value: boolean): void {
            if (value) {
                this._gl.disable(this._gl.RASTERIZER_DISCARD);
            } else {
                this._gl.enable(this._gl.RASTERIZER_DISCARD);
            }
        }

        /**
         * stop executing a render loop function and remove it from the execution array
         * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
         */
        public stopRenderLoop(renderFunction?: () => void): void {
            if (!renderFunction) {
                this._activeRenderLoops = [];
                return;
            }

            var index = this._activeRenderLoops.indexOf(renderFunction);

            if (index >= 0) {
                this._activeRenderLoops.splice(index, 1);
            }
        }

        /** @hidden */
        public _renderLoop(): void {
            if (!this._contextWasLost) {
                var shouldRender = true;
                if (!this.renderEvenInBackground && this._windowIsBackground) {
                    shouldRender = false;
                }

                if (shouldRender) {
                    // Start new frame
                    this.beginFrame();

                    for (var index = 0; index < this._activeRenderLoops.length; index++) {
                        var renderFunction = this._activeRenderLoops[index];

                        renderFunction();
                    }

                    // Present
                    this.endFrame();
                }
            }

            if (this._activeRenderLoops.length > 0) {
                // Register new frame
                var requester = null;
                if (this._vrDisplay && this._vrDisplay.isPresenting)
                    requester = this._vrDisplay;
                this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction, requester);
            } else {
                this._renderingQueueLaunched = false;
            }
        }

        /**
         * Register and execute a render loop. The engine can have more than one render function
         * @param renderFunction defines the function to continuously execute
         */
        public runRenderLoop(renderFunction: () => void): void {
            if (this._activeRenderLoops.indexOf(renderFunction) !== -1) {
                return;
            }

            this._activeRenderLoops.push(renderFunction);

            if (!this._renderingQueueLaunched) {
                this._renderingQueueLaunched = true;
                this._bindedRenderFunction = this._renderLoop.bind(this);
                this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction);
            }
        }

        /**
         * Toggle full screen mode
         * @param requestPointerLock defines if a pointer lock should be requested from the user
         * @param options defines an option object to be sent to the requestFullscreen function
         */
        public switchFullscreen(requestPointerLock: boolean): void {
            if (this.isFullscreen) {
                Tools.ExitFullscreen();
            } else {
                this._pointerLockRequested = requestPointerLock;
                if (this._renderingCanvas) {
                    Tools.RequestFullscreen(this._renderingCanvas);
                }
            }
        }

        /**
         * Clear the current render buffer or the current render target (if any is set up)
         * @param color defines the color to use 
         * @param backBuffer defines if the back buffer must be cleared
         * @param depth defines if the depth buffer must be cleared
         * @param stencil defines if the stencil buffer must be cleared
         */
        public clear(color: Nullable<Color4>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
            this.applyStates();

            var mode = 0;
            if (backBuffer && color) {
                this._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
                mode |= this._gl.COLOR_BUFFER_BIT;
            }
            if (depth) {
                this._gl.clearDepth(1.0);
                mode |= this._gl.DEPTH_BUFFER_BIT;
            }
            if (stencil) {
                this._gl.clearStencil(0);
                mode |= this._gl.STENCIL_BUFFER_BIT;
            }
            this._gl.clear(mode);
        }

        /**
         * Executes a scissor clear (ie. a clear on a specific portion of the screen)
         * @param x defines the x-coordinate of the top left corner of the clear rectangle
         * @param y defines the y-coordinate of the corner of the clear rectangle 
         * @param width defines the width of the clear rectangle
         * @param height defines the height of the clear rectangle
         * @param clearColor defines the clear color
         */
        public scissorClear(x: number, y: number, width: number, height: number, clearColor: Color4): void {
            let gl = this._gl;

            // Save state
            var curScissor = gl.getParameter(gl.SCISSOR_TEST);
            var curScissorBox = gl.getParameter(gl.SCISSOR_BOX);

            // Change state
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(x, y, width, height);

            // Clear
            this.clear(clearColor, true, true, true);

            // Restore state
            gl.scissor(curScissorBox[0], curScissorBox[1], curScissorBox[2], curScissorBox[3]);

            if (curScissor === true) {
                gl.enable(gl.SCISSOR_TEST);
            } else {
                gl.disable(gl.SCISSOR_TEST);
            }
        }

        private _viewportCached = new BABYLON.Vector4(0, 0, 0, 0);
        
        /** @hidden */
        public _viewport(x: number, y: number, width: number, height: number): void {
            if (x !== this._viewportCached.x ||
                y !== this._viewportCached.y ||
                width !== this._viewportCached.z ||
                height !== this._viewportCached.w)
            {
                this._viewportCached.x = x;
                this._viewportCached.y = y;
                this._viewportCached.z = width;
                this._viewportCached.w = height;

                this._gl.viewport(x, y, width, height);
            }
        }

        /**
         * Set the WebGL's viewport
         * @param viewport defines the viewport element to be used
         * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
         * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
         */
        public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void {
            var width = requiredWidth || this.getRenderWidth();
            var height = requiredHeight || this.getRenderHeight();
            var x = viewport.x || 0;
            var y = viewport.y || 0;

            this._cachedViewport = viewport;

            this._viewport(x * width, y * height, width * viewport.width, height * viewport.height);
        }

        /**
         * Directly set the WebGL Viewport
         * @param x defines the x coordinate of the viewport (in screen space)
         * @param y defines the y coordinate of the viewport (in screen space)
         * @param width defines the width of the viewport (in screen space)
         * @param height defines the height of the viewport (in screen space)
         * @return the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
         */
        public setDirectViewport(x: number, y: number, width: number, height: number): Nullable<Viewport> {
            let currentViewport = this._cachedViewport;
            this._cachedViewport = null;

            this._viewport(x, y, width, height);

            return currentViewport;
        }

        /**
         * Begin a new frame
         */
        public beginFrame(): void {
            this.onBeginFrameObservable.notifyObservers(this);
            this._measureFps();
        }

        /**
         * Enf the current frame
         */
        public endFrame(): void {
            // Force a flush in case we are using a bad OS.
            if (this._badOS) {
                this.flushFramebuffer();
            }

            // Submit frame to the vr device, if enabled
            if (this._vrDisplay && this._vrDisplay.isPresenting) {
                // TODO: We should only submit the frame if we read frameData successfully.
                this._vrDisplay.submitFrame();
            }

            this.onEndFrameObservable.notifyObservers(this);
        }

        /**
         * Resize the view according to the canvas' size
         */
        public resize(): void {
            // We're not resizing the size of the canvas while in VR mode & presenting
            if (!(this._vrDisplay && this._vrDisplay.isPresenting)) {
                var width = this._renderingCanvas ? this._renderingCanvas.clientWidth : window.innerWidth;
                var height = this._renderingCanvas ? this._renderingCanvas.clientHeight : window.innerHeight;

                this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel);
            }
        }

        /**
         * Force a specific size of the canvas
         * @param width defines the new canvas' width
         * @param height defines the new canvas' height
         */
        public setSize(width: number, height: number): void {
            if (!this._renderingCanvas) {
                return;
            }

            if (this._renderingCanvas.width === width && this._renderingCanvas.height === height) {
                return;
            }

            this._renderingCanvas.width = width;
            this._renderingCanvas.height = height;

            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];

                for (var camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    var cam = scene.cameras[camIndex];

                    cam._currentRenderId = 0;
                }
            }

            if (this.onResizeObservable.hasObservers) {
                this.onResizeObservable.notifyObservers(this);
            }
        }

        // WebVR functions

        /**
         * Gets a boolean indicating if a webVR device was detected
         * @returns true if a webVR device was detected
         */
        public isVRDevicePresent(): boolean {
            return !!this._vrDisplay;
        }

        /**
         * Gets the current webVR device
         * @returns the current webVR device (or null)
         */
        public getVRDevice(): any {
            return this._vrDisplay;
        }

        /**
         * Initializes a webVR display and starts listening to display change events
         * The onVRDisplayChangedObservable will be notified upon these changes
         * @returns The onVRDisplayChangedObservable
         */
        public initWebVR(): Observable<IDisplayChangedEventArgs> {
            this.initWebVRAsync();
            return this.onVRDisplayChangedObservable;
        }

        /**
         * Initializes a webVR display and starts listening to display change events
         * The onVRDisplayChangedObservable will be notified upon these changes
         * @returns A promise containing a VRDisplay and if vr is supported
         */
        public initWebVRAsync(): Promise<IDisplayChangedEventArgs> {
            var notifyObservers = () => {
                var eventArgs = {
                    vrDisplay: this._vrDisplay,
                    vrSupported: this._vrSupported
                };
                this.onVRDisplayChangedObservable.notifyObservers(eventArgs);
                this._webVRInitPromise = new Promise((res)=>{res(eventArgs)});
            }

            if (!this._onVrDisplayConnect) {
                this._onVrDisplayConnect = (event) => {
                    this._vrDisplay = event.display;
                    notifyObservers();
                };
                this._onVrDisplayDisconnect = () => {
                    this._vrDisplay.cancelAnimationFrame(this._frameHandler);
                    this._vrDisplay = undefined;
                    this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction);
                    notifyObservers();
                };
                this._onVrDisplayPresentChange = () => {
                    this._vrExclusivePointerMode = this._vrDisplay && this._vrDisplay.isPresenting;
                }
                window.addEventListener('vrdisplayconnect', this._onVrDisplayConnect);
                window.addEventListener('vrdisplaydisconnect', this._onVrDisplayDisconnect);
                window.addEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
            }
            this._webVRInitPromise = this._webVRInitPromise || this._getVRDisplaysAsync();
            this._webVRInitPromise.then(notifyObservers);
            return this._webVRInitPromise;
        }

        /**
         * Call this function to switch to webVR mode
         * Will do nothing if webVR is not supported or if there is no webVR device
         * @see http://doc.babylonjs.com/how_to/webvr_camera
         */
        public enableVR() {
            if (this._vrDisplay && !this._vrDisplay.isPresenting) {
                var onResolved = () => {
                    this.onVRRequestPresentComplete.notifyObservers(true);
                    this._onVRFullScreenTriggered();
                };
                var onRejected = () => {
                    this.onVRRequestPresentComplete.notifyObservers(false);
                };

                this.onVRRequestPresentStart.notifyObservers(this);
                this._vrDisplay.requestPresent([{ source: this.getRenderingCanvas() }]).then(onResolved).catch(onRejected);
            }
        }

        /**
         * Call this function to leave webVR mode
         * Will do nothing if webVR is not supported or if there is no webVR device
         * @see http://doc.babylonjs.com/how_to/webvr_camera
         */
        public disableVR() {
            if (this._vrDisplay && this._vrDisplay.isPresenting) {
                this._vrDisplay.exitPresent().then(this._onVRFullScreenTriggered).catch(this._onVRFullScreenTriggered);
            }
        }

        private _onVRFullScreenTriggered = () => {
            if (this._vrDisplay && this._vrDisplay.isPresenting) {
                //get the old size before we change
                this._oldSize = new Size(this.getRenderWidth(), this.getRenderHeight());
                this._oldHardwareScaleFactor = this.getHardwareScalingLevel();

                //get the width and height, change the render size
                var leftEye = this._vrDisplay.getEyeParameters('left');
                this.setHardwareScalingLevel(1);
                this.setSize(leftEye.renderWidth * 2, leftEye.renderHeight);
            } else {
                this.setHardwareScalingLevel(this._oldHardwareScaleFactor);
                this.setSize(this._oldSize.width, this._oldSize.height);
            }
        }

        private _getVRDisplaysAsync():Promise<IDisplayChangedEventArgs> {
            return new Promise((res, rej)=>{    
                if (navigator.getVRDisplays) {
                    navigator.getVRDisplays().then((devices: Array<any>)=>{
                        this._vrSupported = true;
                        // note that devices may actually be an empty array. This is fine;
                        // we expect this._vrDisplay to be undefined in this case.
                        this._vrDisplay = devices[0];
                        res({
                            vrDisplay: this._vrDisplay,
                            vrSupported: this._vrSupported
                        });
                    });
                } else {
                    this._vrDisplay = undefined;
                    this._vrSupported = false;
                    res({
                        vrDisplay: this._vrDisplay,
                        vrSupported: this._vrSupported
                    });
                }
            });
        }

        /**
         * Binds the frame buffer to the specified texture.
         * @param texture The texture to render to or null for the default canvas
         * @param faceIndex The face of the texture to render to in case of cube texture
         * @param requiredWidth The width of the target to render to
         * @param requiredHeight The height of the target to render to
         * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
         * @param depthStencilTexture The depth stencil texture to use to render
         * @param lodLevel defines le lod level to bind to the frame buffer
         */
        public bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean, depthStencilTexture?: InternalTexture, lodLevel = 0): void {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            }
            this._currentRenderTarget = texture;
            this.bindUnboundFramebuffer(texture._MSAAFramebuffer ? texture._MSAAFramebuffer : texture._framebuffer);
            var gl = this._gl;
            if (texture.isCube) {
                if (faceIndex === undefined) {
                    faceIndex = 0;
                }
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, lodLevel);

                if (depthStencilTexture) {
                    if (depthStencilTexture._generateStencilBuffer) {
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, depthStencilTexture._webGLTexture, lodLevel);
                    }
                    else {
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, depthStencilTexture._webGLTexture, lodLevel);
                    }
                }
            }

            if (this._cachedViewport && !forceFullscreenViewport) {
                this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
            } else {
                if (!requiredWidth) {
                    requiredWidth = texture.width;
                    if (lodLevel) {
                        requiredWidth = requiredWidth / Math.pow(2, lodLevel);
                    }
                }
                if (!requiredHeight) {
                    requiredHeight = texture.height;
                    if (lodLevel) {
                        requiredHeight = requiredHeight / Math.pow(2, lodLevel);
                    }
                }

                this._viewport(0, 0, requiredWidth, requiredHeight);
            }

            this.wipeCaches();
        }

        private bindUnboundFramebuffer(framebuffer: Nullable<WebGLFramebuffer>) {
            if (this._currentFramebuffer !== framebuffer) {
                this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
                this._currentFramebuffer = framebuffer;
            }
        }

        /**
         * Unbind the current render target texture from the webGL context
         * @param texture defines the render target texture to unbind
         * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
         * @param onBeforeUnbind defines a function which will be called before the effective unbind
         */
        public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
            this._currentRenderTarget = null;

            // If MSAA, we need to bitblt back to main texture
            var gl = this._gl;

            if (texture._MSAAFramebuffer) {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, texture._MSAAFramebuffer);
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, texture._framebuffer);
                gl.blitFramebuffer(0, 0, texture.width, texture.height,
                    0, 0, texture.width, texture.height,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);
            }

            if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
                this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
                gl.generateMipmap(gl.TEXTURE_2D);
                this._bindTextureDirectly(gl.TEXTURE_2D, null);
            }

            if (onBeforeUnbind) {
                if (texture._MSAAFramebuffer) {
                    // Bind the correct framebuffer
                    this.bindUnboundFramebuffer(texture._framebuffer);
                }
                onBeforeUnbind();
            }

            this.bindUnboundFramebuffer(null);
        }

        /**
         * Unbind a list of render target textures from the webGL context
         * This is used only when drawBuffer extension or webGL2 are active
         * @param textures defines the render target textures to unbind
         * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
         * @param onBeforeUnbind defines a function which will be called before the effective unbind
         */        
        public unBindMultiColorAttachmentFramebuffer(textures: InternalTexture[], disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
            this._currentRenderTarget = null;

            // If MSAA, we need to bitblt back to main texture
            var gl = this._gl;


            if (textures[0]._MSAAFramebuffer) {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, textures[0]._MSAAFramebuffer);
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, textures[0]._framebuffer);

                var attachments = textures[0]._attachments;
                if (!attachments) {
                    attachments = new Array(textures.length);
                    textures[0]._attachments = attachments;
                }

                for (var i = 0; i < textures.length; i++) {
                    var texture = textures[i];

                    for (var j = 0; j < attachments.length; j++) {
                        attachments[j] = gl.NONE;
                    }

                    attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
                    gl.readBuffer(attachments[i]);
                    gl.drawBuffers(attachments);
                    gl.blitFramebuffer(0, 0, texture.width, texture.height,
                        0, 0, texture.width, texture.height,
                        gl.COLOR_BUFFER_BIT, gl.NEAREST);

                }
                for (var i = 0; i < attachments.length; i++) {
                    attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
                }
                gl.drawBuffers(attachments);
            }

            for (var i = 0; i < textures.length; i++) {
                var texture = textures[i];
                if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
                    this._bindTextureDirectly(gl.TEXTURE_2D, texture);
                    gl.generateMipmap(gl.TEXTURE_2D);
                    this._bindTextureDirectly(gl.TEXTURE_2D, null);
                }
            }

            if (onBeforeUnbind) {
                if (textures[0]._MSAAFramebuffer) {
                    // Bind the correct framebuffer
                    this.bindUnboundFramebuffer(textures[0]._framebuffer);
                }
                onBeforeUnbind();
            }

            this.bindUnboundFramebuffer(null);
        }

        /**
         * Force the mipmap generation for the given render target texture
         * @param texture defines the render target texture to use
         */
        public generateMipMapsForCubemap(texture: InternalTexture) {
            if (texture.generateMipMaps) {
                var gl = this._gl;
                this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
            }
        }

        /**
         * Force a webGL flush (ie. a flush of all waiting webGL commands)
         */
        public flushFramebuffer(): void {
            this._gl.flush();
        }

        /**
         * Unbind the current render target and bind the default framebuffer
         */
        public restoreDefaultFramebuffer(): void {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            } else {
                this.bindUnboundFramebuffer(null);
            }
            if (this._cachedViewport) {
                this.setViewport(this._cachedViewport);
            }

            this.wipeCaches();
        }

        // UBOs

        /**
         * Create an uniform buffer
         * @see http://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         * @param elements defines the content of the uniform buffer
         * @returns the webGL uniform buffer
         */
        public createUniformBuffer(elements: FloatArray): WebGLBuffer {
            var ubo = this._gl.createBuffer();

            if (!ubo) {
                throw new Error("Unable to create uniform buffer");
            }

            this.bindUniformBuffer(ubo);

            if (elements instanceof Float32Array) {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, <Float32Array>elements, this._gl.STATIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), this._gl.STATIC_DRAW);
            }

            this.bindUniformBuffer(null);

            ubo.references = 1;
            return ubo;
        }

        /**
         * Create a dynamic uniform buffer
         * @see http://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         * @param elements defines the content of the uniform buffer
         * @returns the webGL uniform buffer
         */        
        public createDynamicUniformBuffer(elements: FloatArray): WebGLBuffer {
            var ubo = this._gl.createBuffer();

            if (!ubo) {
                throw new Error("Unable to create dynamic uniform buffer");
            }

            this.bindUniformBuffer(ubo);

            if (elements instanceof Float32Array) {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, <Float32Array>elements, this._gl.DYNAMIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), this._gl.DYNAMIC_DRAW);
            }

            this.bindUniformBuffer(null);

            ubo.references = 1;
            return ubo;
        }

        /**
         * Update an existing uniform buffer
         * @see http://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         * @param uniformBuffer defines the target uniform buffer
         * @param elements defines the content to update
         * @param offset defines the offset in the uniform buffer where update should start
         * @param count defines the size of the data to update
         */
        public updateUniformBuffer(uniformBuffer: WebGLBuffer, elements: FloatArray, offset?: number, count?: number): void {
            this.bindUniformBuffer(uniformBuffer);

            if (offset === undefined) {
                offset = 0;
            }

            if (count === undefined) {
                if (elements instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, <Float32Array>elements);
                } else {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, new Float32Array(<number[]>elements));
                }
            } else {
                if (elements instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, <Float32Array>elements.subarray(offset, offset + count));
                } else {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, new Float32Array(<number[]>elements).subarray(offset, offset + count));
                }
            }

            this.bindUniformBuffer(null);
        }


        // VBOs
        private _resetVertexBufferBinding(): void {
            this.bindArrayBuffer(null);
            this._cachedVertexBuffers = null;
        }

        /**
         * Creates a vertex buffer
         * @param data the data for the vertex buffer
         * @returns the new WebGL static buffer
         */
        public createVertexBuffer(data: DataArray): WebGLBuffer {
            var vbo = this._gl.createBuffer();

            if (!vbo) {
                throw new Error("Unable to create vertex buffer");
            }

            this.bindArrayBuffer(vbo);

            if (data instanceof Array) {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(data), this._gl.STATIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, <ArrayBuffer>data, this._gl.STATIC_DRAW);
            }

            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        }

        /**
         * Creates a dynamic vertex buffer
         * @param data the data for the dynamic vertex buffer
         * @returns the new WebGL dynamic buffer
         */
        public createDynamicVertexBuffer(data: DataArray): WebGLBuffer {
            var vbo = this._gl.createBuffer();

            if (!vbo) {
                throw new Error("Unable to create dynamic vertex buffer");
            }

            this.bindArrayBuffer(vbo);

            if (data instanceof Array) {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(data), this._gl.DYNAMIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, <ArrayBuffer>data, this._gl.DYNAMIC_DRAW);
            }

            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        }

        /**
         * Update a dynamic index buffer
         * @param indexBuffer defines the target index buffer
         * @param indices defines the data to update
         * @param offset defines the offset in the target index buffer where update should start
         */
        public updateDynamicIndexBuffer(indexBuffer: WebGLBuffer, indices: IndicesArray, offset: number = 0): void {
            // Force cache update
            this._currentBoundBuffer[this._gl.ELEMENT_ARRAY_BUFFER] = null;
            this.bindIndexBuffer(indexBuffer);
            var arrayBuffer;

            if (indices instanceof Uint16Array || indices instanceof Uint32Array) {
                arrayBuffer = indices;
            } else {
                arrayBuffer = indexBuffer.is32Bits ? new Uint32Array(indices) : new Uint16Array(indices);
            }

            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, this._gl.DYNAMIC_DRAW);

            this._resetIndexBufferBinding();
        }

        /**
         * Updates a dynamic vertex buffer.
         * @param vertexBuffer the vertex buffer to update
         * @param data the data used to update the vertex buffer
         * @param byteOffset the byte offset of the data
         * @param byteLength the byte length of the data
         */
        public updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
            this.bindArrayBuffer(vertexBuffer);

            if (byteOffset === undefined) {
                byteOffset = 0;
            }

            if (byteLength === undefined) {
                if (data instanceof Array) {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data));
                } else {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, <ArrayBuffer>data);
                }
            } else {
                if (data instanceof Array) {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(data).subarray(byteOffset, byteOffset + byteLength));
                } else {
                    if (data instanceof ArrayBuffer) {
                        data = new Uint8Array(data, byteOffset, byteLength);
                    } else {
                        data = new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
                    }

                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, <ArrayBuffer>data);
                }
            }

            this._resetVertexBufferBinding();
        }

        private _resetIndexBufferBinding(): void {
            this.bindIndexBuffer(null);
            this._cachedIndexBuffer = null;
        }

        /**
         * Creates a new index buffer
         * @param indices defines the content of the index buffer
         * @param updatable defines if the index buffer must be updatable
         * @returns a new webGL buffer
         */
        public createIndexBuffer(indices: IndicesArray, updatable?: boolean): WebGLBuffer {
            var vbo = this._gl.createBuffer();

            if (!vbo) {
                throw new Error("Unable to create index buffer");
            }

            this.bindIndexBuffer(vbo);

            // Check for 32 bits indices
            var arrayBuffer;
            var need32Bits = false;

            if (indices instanceof Uint16Array) {
                arrayBuffer = indices;
            } else {
                //check 32 bit support
                if (this._caps.uintIndices) {
                    if (indices instanceof Uint32Array) {
                        arrayBuffer = indices;
                        need32Bits = true;
                    } else {
                        //number[] or Int32Array, check if 32 bit is necessary
                        for (var index = 0; index < indices.length; index++) {
                            if (indices[index] > 65535) {
                                need32Bits = true;
                                break;
                            }
                        }

                        arrayBuffer = need32Bits ? new Uint32Array(indices) : new Uint16Array(indices);
                    }
                } else {
                    //no 32 bit support, force conversion to 16 bit (values greater 16 bit are lost)
                    arrayBuffer = new Uint16Array(indices);
                }
            }

            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, updatable ? this._gl.DYNAMIC_DRAW : this._gl.STATIC_DRAW);
            this._resetIndexBufferBinding();
            vbo.references = 1;
            vbo.is32Bits = need32Bits;
            return vbo;
        }

        /**
         * Bind a webGL buffer to the webGL context
         * @param buffer defines the buffer to bind
         */
        public bindArrayBuffer(buffer: Nullable<WebGLBuffer>): void {
            if (!this._vaoRecordInProgress) {
                this._unbindVertexArrayObject();
            }
            this.bindBuffer(buffer, this._gl.ARRAY_BUFFER);
        }

        /**
         * Bind an uniform buffer to the current webGL context
         * @param buffer defines the buffer to bind
         */
        public bindUniformBuffer(buffer: Nullable<WebGLBuffer>): void {
            this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, buffer);
        }

        /**
         * Bind a buffer to the current webGL context at a given location
         * @param buffer defines the buffer to bind
         * @param location defines the index where to bind the buffer
         */        
        public bindUniformBufferBase(buffer: WebGLBuffer, location: number): void {
            this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, location, buffer);
        }

        /**
         * Bind a specific block at a given index in a specific shader program
         * @param shaderProgram defines the shader program
         * @param blockName defines the block name
         * @param index defines the index where to bind the block
         */
        public bindUniformBlock(shaderProgram: WebGLProgram, blockName: string, index: number): void {
            var uniformLocation = this._gl.getUniformBlockIndex(shaderProgram, blockName);

            this._gl.uniformBlockBinding(shaderProgram, uniformLocation, index);
        };

        private bindIndexBuffer(buffer: Nullable<WebGLBuffer>): void {
            if (!this._vaoRecordInProgress) {
                this._unbindVertexArrayObject();
            }
            this.bindBuffer(buffer, this._gl.ELEMENT_ARRAY_BUFFER);
        }

        private bindBuffer(buffer: Nullable<WebGLBuffer>, target: number): void {
            if (this._vaoRecordInProgress || this._currentBoundBuffer[target] !== buffer) {
                this._gl.bindBuffer(target, buffer);
                this._currentBoundBuffer[target] = buffer;
            }
        }

        /**
         * update the bound buffer with the given data
         * @param data defines the data to update
         */
        public updateArrayBuffer(data: Float32Array): void {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
        }

        private _vertexAttribPointer(buffer: WebGLBuffer, indx: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
            var pointer = this._currentBufferPointers[indx];

            var changed = false;
            if (!pointer.active) {
                changed = true;
                pointer.active = true;
                pointer.index = indx;
                pointer.size = size;
                pointer.type = type;
                pointer.normalized = normalized;
                pointer.stride = stride;
                pointer.offset = offset;
                pointer.buffer = buffer;
            } else {
                if (pointer.buffer !== buffer) { pointer.buffer = buffer; changed = true; }
                if (pointer.size !== size) { pointer.size = size; changed = true; }
                if (pointer.type !== type) { pointer.type = type; changed = true; }
                if (pointer.normalized !== normalized) { pointer.normalized = normalized; changed = true; }
                if (pointer.stride !== stride) { pointer.stride = stride; changed = true; }
                if (pointer.offset !== offset) { pointer.offset = offset; changed = true; }
            }

            if (changed || this._vaoRecordInProgress) {
                this.bindArrayBuffer(buffer);
                this._gl.vertexAttribPointer(indx, size, type, normalized, stride, offset);
            }
        }

        private _bindIndexBufferWithCache(indexBuffer: Nullable<WebGLBuffer>): void {
            if (indexBuffer == null) {
                return;
            }
            if (this._cachedIndexBuffer !== indexBuffer) {
                this._cachedIndexBuffer = indexBuffer;
                this.bindIndexBuffer(indexBuffer);
                this._uintIndicesCurrentlySet = indexBuffer.is32Bits;
            }
        }

        private _bindVertexBuffersAttributes(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, effect: Effect): void {
            var attributes = effect.getAttributesNames();

            if (!this._vaoRecordInProgress) {
                this._unbindVertexArrayObject();
            }

            this.unbindAllAttributes();

            for (var index = 0; index < attributes.length; index++) {
                var order = effect.getAttributeLocation(index);

                if (order >= 0) {
                    var vertexBuffer = vertexBuffers[attributes[index]];

                    if (!vertexBuffer) {
                        continue;
                    }

                    this._gl.enableVertexAttribArray(order);
                    if (!this._vaoRecordInProgress) {
                        this._vertexAttribArraysEnabled[order] = true;
                    }

                    var buffer = vertexBuffer.getBuffer();
                    if (buffer) {
                        this._vertexAttribPointer(buffer, order, vertexBuffer.getSize(), vertexBuffer.type, vertexBuffer.normalized, vertexBuffer.byteStride, vertexBuffer.byteOffset);

                        if (vertexBuffer.getIsInstanced()) {
                            this._gl.vertexAttribDivisor(order, vertexBuffer.getInstanceDivisor());
                            if (!this._vaoRecordInProgress) {
                                this._currentInstanceLocations.push(order);
                                this._currentInstanceBuffers.push(buffer);
                            }
                        }
                    }
                }
            }
        }

        /**
         * Records a vertex array object
         * @see http://doc.babylonjs.com/features/webgl2#vertex-array-objects
         * @param vertexBuffers defines the list of vertex buffers to store
         * @param indexBuffer defines the index buffer to store
         * @param effect defines the effect to store
         * @returns the new vertex array object
         */
        public recordVertexArrayObject(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: Nullable<WebGLBuffer>, effect: Effect): WebGLVertexArrayObject {
            var vao = this._gl.createVertexArray();

            this._vaoRecordInProgress = true;

            this._gl.bindVertexArray(vao);

            this._mustWipeVertexAttributes = true;
            this._bindVertexBuffersAttributes(vertexBuffers, effect);

            this.bindIndexBuffer(indexBuffer);

            this._vaoRecordInProgress = false;
            this._gl.bindVertexArray(null);

            return vao;
        }

        /**
         * Bind a specific vertex array object
         * @see http://doc.babylonjs.com/features/webgl2#vertex-array-objects
         * @param vertexArrayObject defines the vertex array object to bind
         * @param indexBuffer defines the index buffer to bind
         */
        public bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObject, indexBuffer: Nullable<WebGLBuffer>): void {
            if (this._cachedVertexArrayObject !== vertexArrayObject) {
                this._cachedVertexArrayObject = vertexArrayObject;

                this._gl.bindVertexArray(vertexArrayObject);
                this._cachedVertexBuffers = null;
                this._cachedIndexBuffer = null;

                this._uintIndicesCurrentlySet = indexBuffer != null && indexBuffer.is32Bits;
                this._mustWipeVertexAttributes = true;
            }
        }

        /**
         * Bind webGl buffers directly to the webGL context
         * @param vertexBuffer defines the vertex buffer to bind
         * @param indexBuffer defines the index buffer to bind
         * @param vertexDeclaration defines the vertex declaration to use with the vertex buffer
         * @param vertexStrideSize defines the vertex stride of the vertex buffer
         * @param effect defines the effect associated with the vertex buffer
         */
        public bindBuffersDirectly(vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
            if (this._cachedVertexBuffers !== vertexBuffer || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffer;
                this._cachedEffectForVertexBuffers = effect;

                let attributesCount = effect.getAttributesCount();

                this._unbindVertexArrayObject();
                this.unbindAllAttributes();

                var offset = 0;
                for (var index = 0; index < attributesCount; index++) {

                    if (index < vertexDeclaration.length) {

                        var order = effect.getAttributeLocation(index);

                        if (order >= 0) {
                            this._gl.enableVertexAttribArray(order);
                            this._vertexAttribArraysEnabled[order] = true;
                            this._vertexAttribPointer(vertexBuffer, order, vertexDeclaration[index], this._gl.FLOAT, false, vertexStrideSize, offset);
                        }

                        offset += vertexDeclaration[index] * 4;
                    }
                }
            }

            this._bindIndexBufferWithCache(indexBuffer);
        }

        private _unbindVertexArrayObject(): void {
            if (!this._cachedVertexArrayObject) {
                return;
            }

            this._cachedVertexArrayObject = null;
            this._gl.bindVertexArray(null);
        }

        /**
         * Bind a list of vertex buffers to the webGL context
         * @param vertexBuffers defines the list of vertex buffers to bind
         * @param indexBuffer defines the index buffer to bind
         * @param effect defines the effect associated with the vertex buffers
         */
        public bindBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, indexBuffer: Nullable<WebGLBuffer>, effect: Effect): void {
            if (this._cachedVertexBuffers !== vertexBuffers || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffers;
                this._cachedEffectForVertexBuffers = effect;

                this._bindVertexBuffersAttributes(vertexBuffers, effect);
            }

            this._bindIndexBufferWithCache(indexBuffer);
        }

        /**
         * Unbind all instance attributes
         */
        public unbindInstanceAttributes() {
            var boundBuffer;
            for (var i = 0, ul = this._currentInstanceLocations.length; i < ul; i++) {
                var instancesBuffer = this._currentInstanceBuffers[i];
                if (boundBuffer != instancesBuffer && instancesBuffer.references) {
                    boundBuffer = instancesBuffer;
                    this.bindArrayBuffer(instancesBuffer);
                }
                var offsetLocation = this._currentInstanceLocations[i];
                this._gl.vertexAttribDivisor(offsetLocation, 0);
            }
            this._currentInstanceBuffers.length = 0;
            this._currentInstanceLocations.length = 0;
        }

        /**
         * Release and free the memory of a vertex array object
         * @param vao defines the vertex array object to delete
         */
        public releaseVertexArrayObject(vao: WebGLVertexArrayObject) {
            this._gl.deleteVertexArray(vao);
        }

        /** @hidden */
        public _releaseBuffer(buffer: WebGLBuffer): boolean {
            buffer.references--;

            if (buffer.references === 0) {
                this._gl.deleteBuffer(buffer);
                return true;
            }

            return false;
        }

        /**
         * Creates a webGL buffer to use with instanciation
         * @param capacity defines the size of the buffer
         * @returns the webGL buffer
         */
        public createInstancesBuffer(capacity: number): WebGLBuffer {
            var buffer = this._gl.createBuffer();

            if (!buffer) {
                throw new Error("Unable to create instance buffer");
            }

            buffer.capacity = capacity;

            this.bindArrayBuffer(buffer);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
            return buffer;
        }

        /**
         * Delete a webGL buffer used with instanciation
         * @param buffer defines the webGL buffer to delete
         */
        public deleteInstancesBuffer(buffer: WebGLBuffer): void {
            this._gl.deleteBuffer(buffer);
        }

        /**
         * Update the content of a webGL buffer used with instanciation and bind it to the webGL context
         * @param instancesBuffer defines the webGL buffer to update and bind
         * @param data defines the data to store in the buffer
         * @param offsetLocations defines the offsets or attributes information used to determine where data must be stored in the buffer
         */
        public updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
            this.bindArrayBuffer(instancesBuffer);
            if (data) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
            }

            if ((<any>offsetLocations[0]).index !== undefined) {
                let stride = 0;
                for (let i = 0; i < offsetLocations.length; i++) {
                    let ai = <InstancingAttributeInfo>offsetLocations[i];
                    stride += ai.attributeSize * 4;
                }
                for (let i = 0; i < offsetLocations.length; i++) {
                    let ai = <InstancingAttributeInfo>offsetLocations[i];

                    if (!this._vertexAttribArraysEnabled[ai.index]) {
                        this._gl.enableVertexAttribArray(ai.index);
                        this._vertexAttribArraysEnabled[ai.index] = true;
                    }

                    this._vertexAttribPointer(instancesBuffer, ai.index, ai.attributeSize, ai.attribyteType || this._gl.FLOAT, ai.normalized || false, stride, ai.offset);
                    this._gl.vertexAttribDivisor(ai.index, 1);
                    this._currentInstanceLocations.push(ai.index);
                    this._currentInstanceBuffers.push(instancesBuffer);
                }
            } else {
                for (let index = 0; index < 4; index++) {
                    let offsetLocation = <number>offsetLocations[index];

                    if (!this._vertexAttribArraysEnabled[offsetLocation]) {
                        this._gl.enableVertexAttribArray(offsetLocation);
                        this._vertexAttribArraysEnabled[offsetLocation] = true;
                    }

                    this._vertexAttribPointer(instancesBuffer, offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                    this._gl.vertexAttribDivisor(offsetLocation, 1);
                    this._currentInstanceLocations.push(offsetLocation);
                    this._currentInstanceBuffers.push(instancesBuffer);
                }
            }
        }

        /**
         * Apply all cached states (depth, culling, stencil and alpha)
         */
        public applyStates() {
            this._depthCullingState.apply(this._gl);
            this._stencilState.apply(this._gl);
            this._alphaState.apply(this._gl);
        }

        /**
         * Send a draw order
         * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
         * @param indexStart defines the starting index
         * @param indexCount defines the number of index to draw
         * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
         */
        public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
            this.drawElementsType(useTriangles ? Material.TriangleFillMode : Material.WireFrameFillMode, indexStart, indexCount, instancesCount);
        }

        /**
         * Draw a list of points
         * @param verticesStart defines the index of first vertex to draw
         * @param verticesCount defines the count of vertices to draw
         * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
         */
        public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
            this.drawArraysType(Material.PointFillMode, verticesStart, verticesCount, instancesCount);
        }

        /**
         * Draw a list of unindexed primitives
         * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
         * @param verticesStart defines the index of first vertex to draw 
         * @param verticesCount defines the count of vertices to draw
         * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
         */
        public drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void {
            this.drawArraysType(useTriangles ? Material.TriangleFillMode : Material.WireFrameFillMode, verticesStart, verticesCount, instancesCount);
        }

        /**
         * Draw a list of indexed primitives
         * @param fillMode defines the primitive to use
         * @param indexStart defines the starting index
         * @param indexCount defines the number of index to draw
         * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
         */
        public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();

            this._drawCalls.addCount(1, false);
            // Render

            const drawMode = this._drawMode(fillMode);
            var indexFormat = this._uintIndicesCurrentlySet ? this._gl.UNSIGNED_INT : this._gl.UNSIGNED_SHORT;
            var mult = this._uintIndicesCurrentlySet ? 4 : 2;
            if (instancesCount) {
                this._gl.drawElementsInstanced(drawMode, indexCount, indexFormat, indexStart * mult, instancesCount);
            } else {
                this._gl.drawElements(drawMode, indexCount, indexFormat, indexStart * mult);
            }
        }

        /**
         * Draw a list of unindexed primitives
         * @param fillMode defines the primitive to use
         * @param verticesStart defines the index of first vertex to draw 
         * @param verticesCount defines the count of vertices to draw
         * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
         */
        public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();
            this._drawCalls.addCount(1, false);

            const drawMode = this._drawMode(fillMode);
            if (instancesCount) {
                this._gl.drawArraysInstanced(drawMode, verticesStart, verticesCount, instancesCount);
            } else {
                this._gl.drawArrays(drawMode, verticesStart, verticesCount);
            }
        }

        private _drawMode(fillMode: number): number {
            switch (fillMode) {
                // Triangle views
                case Material.TriangleFillMode:
                    return this._gl.TRIANGLES;
                case Material.PointFillMode:
                    return this._gl.POINTS;
                case Material.WireFrameFillMode:
                    return this._gl.LINES;
                // Draw modes
                case Material.PointListDrawMode:
                    return this._gl.POINTS
                case Material.LineListDrawMode:
                    return this._gl.LINES;
                case Material.LineLoopDrawMode:
                    return this._gl.LINE_LOOP
                case Material.LineStripDrawMode:
                    return this._gl.LINE_STRIP
                case Material.TriangleStripDrawMode:
                    return this._gl.TRIANGLE_STRIP
                case Material.TriangleFanDrawMode:
                    return this._gl.TRIANGLE_FAN;
                default:
                    return this._gl.TRIANGLES;
            }
        }

        // Shaders
        
        /** @hidden */
        public _releaseEffect(effect: Effect): void {
            if (this._compiledEffects[effect._key]) {
                delete this._compiledEffects[effect._key];

                this._deleteProgram(effect.getProgram());
            }
        }

        /** @hidden */
        public _deleteProgram(program: WebGLProgram): void {
            if (program) {
                program.__SPECTOR_rebuildProgram = null;

                if (program.transformFeedback) {
                    this.deleteTransformFeedback(program.transformFeedback);
                    program.transformFeedback = null;
                }

                this._gl.deleteProgram(program);
            }
        }


        /**
         * Create a new effect (used to store vertex/fragment shaders)
         * @param baseName defines the base name of the effect (The name of file without .fragment.fx or .vertex.fx)
         * @param attributesNamesOrOptions defines either a list of attribute names or an EffectCreationOptions object
         * @param uniformsNamesOrEngine defines either a list of uniform names or the engine to use
         * @param samplers defines an array of string used to represent textures
         * @param defines defines the string containing the defines to use to compile the shaders
         * @param fallbacks defines the list of potential fallbacks to use if shader conmpilation fails
         * @param onCompiled defines a function to call when the effect creation is successful
         * @param onError defines a function to call when the effect creation has failed
         * @param indexParameters defines an object containing the index values to use to compile shaders (like the maximum number of simultaneous lights)
         * @returns the new Effect
         */
        public createEffect(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any): Effect {
            var vertex = baseName.vertexElement || baseName.vertex || baseName;
            var fragment = baseName.fragmentElement || baseName.fragment || baseName;

            var name = vertex + "+" + fragment + "@" + (defines ? defines : (<EffectCreationOptions>attributesNamesOrOptions).defines);
            if (this._compiledEffects[name]) {
                var compiledEffect = <Effect>this._compiledEffects[name];
                if (onCompiled && compiledEffect.isReady()) {
                    onCompiled(compiledEffect);
                }

                return compiledEffect;
            }
            var effect = new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters);
            effect._key = name;
            this._compiledEffects[name] = effect;

            return effect;
        }

        private _compileShader(source: string, type: string, defines: Nullable<string>, shaderVersion: string): WebGLShader {
            return this._compileRawShader(shaderVersion + (defines ? defines + "\n" : "") + source, type);
        };
    
        private _compileRawShader(source: string, type: string): WebGLShader {
            var gl = this._gl;
            var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
    
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                let log = gl.getShaderInfoLog(shader);
                if (log) {
                    throw new Error(log);
                }
            }
    
            if (!shader) {
                throw new Error("Something went wrong while compile the shader.");
            }
    
            return shader;
        };

        /**
         * Directly creates a webGL program
         * @param vertexCode defines the vertex shader code to use
         * @param fragmentCode defines the fragment shader code to use
         * @param context defines the webGL context to use (if not set, the current one will be used)
         * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
         * @returns the new webGL program
         */
        public createRawShaderProgram(vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
            context = context || this._gl;

            var vertexShader = this._compileRawShader(vertexCode, "vertex");
            var fragmentShader = this._compileRawShader(fragmentCode, "fragment");

            return this._createShaderProgram(vertexShader, fragmentShader, context, transformFeedbackVaryings);
        }

        /**
         * Creates a webGL program
         * @param vertexCode  defines the vertex shader code to use
         * @param fragmentCode defines the fragment shader code to use
         * @param defines defines the string containing the defines to use to compile the shaders
         * @param context defines the webGL context to use (if not set, the current one will be used)
         * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
         * @returns the new webGL program
         */
        public createShaderProgram(vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
            context = context || this._gl;

            this.onBeforeShaderCompilationObservable.notifyObservers(this);

            var shaderVersion = (this._webGLVersion > 1) ? "#version 300 es\n#define WEBGL2 \n" : "";
            var vertexShader = this._compileShader(vertexCode, "vertex", defines, shaderVersion);
            var fragmentShader = this._compileShader(fragmentCode, "fragment", defines, shaderVersion);

            let program = this._createShaderProgram(vertexShader, fragmentShader, context, transformFeedbackVaryings);

            this.onAfterShaderCompilationObservable.notifyObservers(this);

            return program;
        }

        private _createShaderProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader, context: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
            var shaderProgram = context.createProgram();

            if (!shaderProgram) {
                throw new Error("Unable to create program");
            }

            context.attachShader(shaderProgram, vertexShader);
            context.attachShader(shaderProgram, fragmentShader);

            if (this.webGLVersion > 1 && transformFeedbackVaryings) {
                let transformFeedback = this.createTransformFeedback();

                this.bindTransformFeedback(transformFeedback);
                this.setTranformFeedbackVaryings(shaderProgram, transformFeedbackVaryings);
                shaderProgram.transformFeedback = transformFeedback;
            }

            context.linkProgram(shaderProgram);

            if (this.webGLVersion > 1 && transformFeedbackVaryings) {
                this.bindTransformFeedback(null);
            }

            var linked = context.getProgramParameter(shaderProgram, context.LINK_STATUS);

            if (!linked) {
                var error = context.getProgramInfoLog(shaderProgram);
                if (error) {
                    throw new Error(error);
                }
            }

            if (this.validateShaderPrograms) {
                context.validateProgram(shaderProgram);
                var validated = context.getProgramParameter(shaderProgram, context.VALIDATE_STATUS);

                if(!validated) {
                    var error = context.getProgramInfoLog(shaderProgram);
                    if (error) {
                        throw new Error(error);
                    }
                }
            }

            context.deleteShader(vertexShader);
            context.deleteShader(fragmentShader);

            return shaderProgram;
        }

        /**
         * Gets the list of webGL uniform locations associated with a specific program based on a list of uniform names
         * @param shaderProgram defines the webGL program to use
         * @param uniformsNames defines the list of uniform names
         * @returns an array of webGL uniform locations 
         */
        public getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
            var results = new Array<Nullable<WebGLUniformLocation>>();

            for (var index = 0; index < uniformsNames.length; index++) {
                results.push(this._gl.getUniformLocation(shaderProgram, uniformsNames[index]));
            }

            return results;
        }

        /**
         * Gets the lsit of active attributes for a given webGL program
         * @param shaderProgram defines the webGL program to use
         * @param attributesNames defines the list of attribute names to get
         * @returns an array of indices indicating the offset of each attribute
         */
        public getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[] {
            var results = [];

            for (var index = 0; index < attributesNames.length; index++) {
                try {
                    results.push(this._gl.getAttribLocation(shaderProgram, attributesNames[index]));
                } catch (e) {
                    results.push(-1);
                }
            }

            return results;
        }

        /**
         * Activates an effect, mkaing it the current one (ie. the one used for rendering)
         * @param effect defines the effect to activate
         */
        public enableEffect(effect: Nullable<Effect>): void {
            if (!effect || effect === this._currentEffect) {
                return;
            }

            // Use program
            this.bindSamplers(effect);

            this._currentEffect = effect;

            if (effect.onBind) {
                effect.onBind(effect);
            }
            if (effect._onBindObservable) {
                effect._onBindObservable.notifyObservers(effect);
            }
        }

        /**
         * Set the value of an uniform to an array of int32
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of int32 to store
         */
        public setIntArray(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
            if (!uniform)
                return;

            this._gl.uniform1iv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of int32 (stored as vec2)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of int32 to store
         */        
        public setIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
            if (!uniform || array.length % 2 !== 0)
                return;

            this._gl.uniform2iv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of int32 (stored as vec3)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of int32 to store
         */              
        public setIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
            if (!uniform || array.length % 3 !== 0)
                return;

            this._gl.uniform3iv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of int32 (stored as vec4)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of int32 to store
         */          
        public setIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
            if (!uniform || array.length % 4 !== 0)
                return;

            this._gl.uniform4iv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of float32
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of float32 to store
         */         
        public setFloatArray(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniform1fv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of float32 (stored as vec2)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of float32 to store
         */           
        public setFloatArray2(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void {
            if (!uniform || array.length % 2 !== 0)
                return;

            this._gl.uniform2fv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of float32 (stored as vec3)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of float32 to store
         */                 
        public setFloatArray3(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void {
            if (!uniform || array.length % 3 !== 0)
                return;

            this._gl.uniform3fv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of float32 (stored as vec4)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of float32 to store
         */                 
        public setFloatArray4(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void {
            if (!uniform || array.length % 4 !== 0)
                return;

            this._gl.uniform4fv(uniform, array);
        }

        /**
         * Set the value of an uniform to an array of number
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of number to store
         */             
        public setArray(uniform: Nullable<WebGLUniformLocation>, array: number[]): void {
            if (!uniform)
                return;

            this._gl.uniform1fv(uniform, <any>array);
        }

        /**
         * Set the value of an uniform to an array of number (stored as vec2)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of number to store
         */               
        public setArray2(uniform: Nullable<WebGLUniformLocation>, array: number[]): void {
            if (!uniform || array.length % 2 !== 0)
                return;

            this._gl.uniform2fv(uniform, <any>array);
        }

        /**
         * Set the value of an uniform to an array of number (stored as vec3)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of number to store
         */              
        public setArray3(uniform: Nullable<WebGLUniformLocation>, array: number[]): void {
            if (!uniform || array.length % 3 !== 0)
                return;

            this._gl.uniform3fv(uniform, <any>array);
        }

        /**
         * Set the value of an uniform to an array of number (stored as vec4)
         * @param uniform defines the webGL uniform location where to store the value
         * @param array defines the array of number to store
         */          
        public setArray4(uniform: Nullable<WebGLUniformLocation>, array: number[]): void {
            if (!uniform || array.length % 4 !== 0)
                return;

            this._gl.uniform4fv(uniform, <any>array);
        }

        /**
         * Set the value of an uniform to an array of float32 (stored as matrices)
         * @param uniform defines the webGL uniform location where to store the value
         * @param matrices defines the array of float32 to store
         */          
        public setMatrices(uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix4fv(uniform, false, matrices);
        }

        /**
         * Set the value of an uniform to a matrix
         * @param uniform defines the webGL uniform location where to store the value
         * @param matrix defines the matrix to store
         */             
        public setMatrix(uniform: Nullable<WebGLUniformLocation>, matrix: Matrix): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix4fv(uniform, false, matrix.toArray());
        }

        /**
         * Set the value of an uniform to a matrix (3x3)
         * @param uniform defines the webGL uniform location where to store the value
         * @param matrix defines the Float32Array representing the 3x3 matrix to store
         */           
        public setMatrix3x3(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix3fv(uniform, false, matrix);
        }

        /**
         * Set the value of an uniform to a matrix (2x2)
         * @param uniform defines the webGL uniform location where to store the value
         * @param matrix defines the Float32Array representing the 2x2 matrix to store
         */    
        public setMatrix2x2(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix2fv(uniform, false, matrix);
        }

        /**
         * Set the value of an uniform to a number (int)
         * @param uniform defines the webGL uniform location where to store the value
         * @param value defines the int number to store
         */           
        public setInt(uniform: Nullable<WebGLUniformLocation>, value: number): void {
            if (!uniform)
                return;

            this._gl.uniform1i(uniform, value);
        }

        /**
         * Set the value of an uniform to a number (float)
         * @param uniform defines the webGL uniform location where to store the value
         * @param value defines the float number to store
         */           
        public setFloat(uniform: Nullable<WebGLUniformLocation>, value: number): void {
            if (!uniform)
                return;

            this._gl.uniform1f(uniform, value);
        }

        /**
         * Set the value of an uniform to a vec2
         * @param uniform defines the webGL uniform location where to store the value
         * @param x defines the 1st component of the value
         * @param y defines the 2nd component of the value
         */
        public setFloat2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): void {
            if (!uniform)
                return;

            this._gl.uniform2f(uniform, x, y);
        }

        /**
         * Set the value of an uniform to a vec3
         * @param uniform defines the webGL uniform location where to store the value
         * @param x defines the 1st component of the value
         * @param y defines the 2nd component of the value
         * @param z defines the 3rd component of the value
         */        
        public setFloat3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): void {
            if (!uniform)
                return;

            this._gl.uniform3f(uniform, x, y, z);
        }

        /**
         * Set the value of an uniform to a boolean
         * @param uniform defines the webGL uniform location where to store the value
         * @param bool defines the boolean to store
         */          
        public setBool(uniform: Nullable<WebGLUniformLocation>, bool: number): void {
            if (!uniform)
                return;

            this._gl.uniform1i(uniform, bool);
        }

        /**
         * Set the value of an uniform to a vec4
         * @param uniform defines the webGL uniform location where to store the value
         * @param x defines the 1st component of the value
         * @param y defines the 2nd component of the value
         * @param z defines the 3rd component of the value
         * @param w defines the 4th component of the value
         */           
        public setFloat4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): void {
            if (!uniform)
                return;

            this._gl.uniform4f(uniform, x, y, z, w);
        }

        /**
         * Set the value of an uniform to a Color3
         * @param uniform defines the webGL uniform location where to store the value
         * @param color3 defines the color to store
         */            
        public setColor3(uniform: Nullable<WebGLUniformLocation>, color3: Color3): void {
            if (!uniform)
                return;

            this._gl.uniform3f(uniform, color3.r, color3.g, color3.b);
        }

        /**
         * Set the value of an uniform to a Color3 and an alpha value
         * @param uniform defines the webGL uniform location where to store the value
         * @param color3 defines the color to store
         * @param alpha defines the alpha component to store
         */         
        public setColor4(uniform: Nullable<WebGLUniformLocation>, color3: Color3, alpha: number): void {
            if (!uniform)
                return;

            this._gl.uniform4f(uniform, color3.r, color3.g, color3.b, alpha);
        }

        /**
         * Sets a Color4 on a uniform variable
         * @param uniform defines the uniform location
         * @param color4 defines the value to be set
         */
        public setDirectColor4(uniform: Nullable<WebGLUniformLocation>, color4: Color4): void {
            if (!uniform)
                return;

            this._gl.uniform4f(uniform, color4.r, color4.g, color4.b, color4.a);
        }        

        // States

        /**
         * Set various states to the webGL context
         * @param culling defines backface culling state
         * @param zOffset defines the value to apply to zOffset (0 by default)
         * @param force defines if states must be applied even if cache is up to date
         * @param reverseSide defines if culling must be reversed (CCW instead of CW and CW instead of CCW)
         */
        public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
            // Culling
            if (this._depthCullingState.cull !== culling || force) {
                this._depthCullingState.cull = culling;
            }

            // Cull face
            var cullFace = this.cullBackFaces ? this._gl.BACK : this._gl.FRONT;
            if (this._depthCullingState.cullFace !== cullFace || force) {
                this._depthCullingState.cullFace = cullFace;
            }

            // Z offset
            this.setZOffset(zOffset);

            // Front face
            var frontFace = reverseSide ? this._gl.CW : this._gl.CCW;
            if (this._depthCullingState.frontFace !== frontFace || force) {
                this._depthCullingState.frontFace = frontFace;
            }
        }

        /**
         * Set the z offset to apply to current rendering
         * @param value defines the offset to apply
         */
        public setZOffset(value: number): void {
            this._depthCullingState.zOffset = value;
        }

        /**
         * Gets the current value of the zOffset
         * @returns the current zOffset state
         */
        public getZOffset(): number {
            return this._depthCullingState.zOffset;
        }

        /**
         * Enable or disable depth buffering
         * @param enable defines the state to set
         */
        public setDepthBuffer(enable: boolean): void {
            this._depthCullingState.depthTest = enable;
        }

        /**
         * Gets a boolean indicating if depth writing is enabled
         * @returns the current depth writing state
         */
        public getDepthWrite(): boolean {
            return this._depthCullingState.depthMask;
        }

        /**
         * Enable or disable depth writing
         * @param enable defines the state to set
         */
        public setDepthWrite(enable: boolean): void {
            this._depthCullingState.depthMask = enable;
        }
        
        /**
         * Enable or disable color writing
         * @param enable defines the state to set
         */
        public setColorWrite(enable: boolean): void {
            this._gl.colorMask(enable, enable, enable, enable);
            this._colorWrite = enable;
        }

        /**
         * Gets a boolean indicating if color writing is enabled
         * @returns the current color writing state
         */        
        public getColorWrite(): boolean {
            return this._colorWrite;
        }

        /**
         * Sets alpha constants used by some alpha blending modes
         * @param r defines the red component
         * @param g defines the green component
         * @param b defines the blue component
         * @param a defines the alpha component
         */
        public setAlphaConstants(r: number, g: number, b: number, a: number) {
            this._alphaState.setAlphaBlendConstants(r, g, b, a);
        }

        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the BABYLON.Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
         */
        public setAlphaMode(mode: number, noDepthWriteChange: boolean = false): void {
            if (this._alphaMode === mode) {
                return;
            }

            switch (mode) {
                case Engine.ALPHA_DISABLE:
                    this._alphaState.alphaBlend = false;
                    break;
                case Engine.ALPHA_PREMULTIPLIED:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_PREMULTIPLIED_PORTERDUFF:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_COMBINE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_ONEONE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_ADD:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_SUBTRACT:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_MULTIPLY:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_MAXIMIZED:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_INTERPOLATE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.CONSTANT_COLOR, this._gl.ONE_MINUS_CONSTANT_COLOR, this._gl.CONSTANT_ALPHA, this._gl.ONE_MINUS_CONSTANT_ALPHA);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_SCREENMODE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                    this._alphaState.alphaBlend = true;
                    break;
            }
            if (!noDepthWriteChange) {
                this.setDepthWrite(mode === Engine.ALPHA_DISABLE);
            }
            this._alphaMode = mode;
        }

        /**
         * Gets the current alpha mode
         * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
         * @returns the current alpha mode
         */
        public getAlphaMode(): number {
            return this._alphaMode;
        }

        // Textures

        /**
         * Clears the list of texture accessible through engine.
         * This can help preventing texture load conflict due to name collision.
         */
        public clearInternalTexturesCache() {
            this._internalTexturesCache = [];
        }

        /**
         * Force the entire cache to be cleared
         * You should not have to use this function unless your engine needs to share the webGL context with another engine
         * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
         */
        public wipeCaches(bruteForce?: boolean): void {
            if (this.preventCacheWipeBetweenFrames && !bruteForce) {
                return;
            }
            this._currentEffect = null;
            this._unpackFlipYCached = null;
            this._viewportCached.x = 0;
            this._viewportCached.y = 0;
            this._viewportCached.z = 0;
            this._viewportCached.w = 0;

            if (bruteForce) {
                this.resetTextureCache();
                this._currentProgram = null;

                this._stencilState.reset();
                this._depthCullingState.reset();
                this.setDepthFunctionToLessOrEqual();
                this._alphaState.reset();
            }

            this._resetVertexBufferBinding();
            this._cachedIndexBuffer = null;
            this._cachedEffectForVertexBuffers = null;
            this._unbindVertexArrayObject();
            this.bindIndexBuffer(null);
        }

        /**
         * Set the compressed texture format to use, based on the formats you have, and the formats
         * supported by the hardware / browser.
         *
         * Khronos Texture Container (.ktx) files are used to support this.  This format has the
         * advantage of being specifically designed for OpenGL.  Header elements directly correspond
         * to API arguments needed to compressed textures.  This puts the burden on the container
         * generator to house the arcane code for determining these for current & future formats.
         *
         * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
         * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
         *
         * Note: The result of this call is not taken into account when a texture is base64.
         *
         * @param formatsAvailable defines the list of those format families you have created
         * on your server.  Syntax: '-' + format family + '.ktx'.  (Case and order do not matter.)
         *
         * Current families are astc, dxt, pvrtc, etc2, & etc1.
         * @returns The extension selected.
         */
        public setTextureFormatToUse(formatsAvailable: Array<string>): Nullable<string> {
            for (var i = 0, len1 = this.texturesSupported.length; i < len1; i++) {
                for (var j = 0, len2 = formatsAvailable.length; j < len2; j++) {
                    if (this._texturesSupported[i] === formatsAvailable[j].toLowerCase()) {
                        return this._textureFormatInUse = this._texturesSupported[i];
                    }
                }
            }
            // actively set format to nothing, to allow this to be called more than once
            // and possibly fail the 2nd time
            this._textureFormatInUse = null;
            return null;
        }

        private _getSamplingParameters(samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
            var gl = this._gl;
            var magFilter = gl.NEAREST;
            var minFilter = gl.NEAREST;
    
            switch (samplingMode) {
                case Engine.TEXTURE_BILINEAR_SAMPLINGMODE:
                    magFilter = gl.LINEAR;
                    if (generateMipMaps) {
                        minFilter = gl.LINEAR_MIPMAP_NEAREST;
                    } else {
                        minFilter = gl.LINEAR;
                    }
                    break;
                case Engine.TEXTURE_TRILINEAR_SAMPLINGMODE:
                    magFilter = gl.LINEAR;
                    if (generateMipMaps) {
                        minFilter = gl.LINEAR_MIPMAP_LINEAR;
                    } else {
                        minFilter = gl.LINEAR;
                    }
                    break;
                case Engine.TEXTURE_NEAREST_SAMPLINGMODE:
                    magFilter = gl.NEAREST;
                    if (generateMipMaps) {
                        minFilter = gl.NEAREST_MIPMAP_LINEAR;
                    } else {
                        minFilter = gl.NEAREST;
                    }
                    break;
                case Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                    magFilter = gl.NEAREST;
                    if (generateMipMaps) {
                        minFilter = gl.NEAREST_MIPMAP_NEAREST;
                    } else {
                        minFilter = gl.NEAREST;
                    }
                    break;
                case Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                    magFilter = gl.NEAREST;
                    if (generateMipMaps) {
                        minFilter = gl.LINEAR_MIPMAP_NEAREST;
                    } else {
                        minFilter = gl.LINEAR;
                    }
                    break;
                case Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                    magFilter = gl.NEAREST;
                    if (generateMipMaps) {
                        minFilter = gl.LINEAR_MIPMAP_LINEAR;
                    } else {
                        minFilter = gl.LINEAR;
                    }
                    break;
                case Engine.TEXTURE_NEAREST_LINEAR:
                    magFilter = gl.NEAREST;
                    minFilter = gl.LINEAR;
                    break;
                case Engine.TEXTURE_NEAREST_NEAREST:
                    magFilter = gl.NEAREST;
                    minFilter = gl.NEAREST;
                    break;
                case Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                    magFilter = gl.LINEAR;
                    if (generateMipMaps) {
                        minFilter = gl.NEAREST_MIPMAP_NEAREST;
                    } else {
                        minFilter = gl.NEAREST;
                    }
                    break;
                case Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                    magFilter = gl.LINEAR;
                    if (generateMipMaps) {
                        minFilter = gl.NEAREST_MIPMAP_LINEAR;
                    } else {
                        minFilter = gl.NEAREST;
                    }
                    break;
                case Engine.TEXTURE_LINEAR_LINEAR:
                    magFilter = gl.LINEAR;
                    minFilter = gl.LINEAR;
                    break;
                case Engine.TEXTURE_LINEAR_NEAREST:
                    magFilter = gl.LINEAR;
                    minFilter = gl.NEAREST;
                    break;
            }
    
            return {
                min: minFilter,
                mag: magFilter
            }
        }
    
        private _partialLoadImg(url: string, index: number, loadedImages: HTMLImageElement[], scene: Nullable<Scene>,
            onfinish: (images: HTMLImageElement[]) => void, onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null) {
    
            var img: HTMLImageElement;
    
            var onload = () => {
                loadedImages[index] = img;
                (<any>loadedImages)._internalCount++;
    
                if (scene) {
                    scene._removePendingData(img);
                }
    
                if ((<any>loadedImages)._internalCount === 6) {
                    onfinish(loadedImages);
                }
            };
    
            var onerror = (message?: string, exception?: any) => {
                if (scene) {
                    scene._removePendingData(img);
                }
    
                if (onErrorCallBack) {
                    onErrorCallBack(message, exception);
                }
            };
    
            img = Tools.LoadImage(url, onload, onerror, scene ? scene.database : null);
            if (scene) {
                scene._addPendingData(img);
            }
        }

        private _cascadeLoadImgs(rootUrl: string, scene: Nullable<Scene>,
            onfinish: (images: HTMLImageElement[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void> = null) {
    
            var loadedImages: HTMLImageElement[] = [];
            (<any>loadedImages)._internalCount = 0;
    
            for (let index = 0; index < 6; index++) {
                this._partialLoadImg(files[index], index, loadedImages, scene, onfinish, onError);
            }
        };

        /** @hidden */
        public _createTexture(): WebGLTexture {
            let texture = this._gl.createTexture();

            if (!texture) {
                throw new Error("Unable to create texture");
            }

            return texture;
        }

        /**
         * Usually called from BABYLON.Texture.ts.
         * Passed information to create a WebGLTexture
         * @param urlArg defines a value which contains one of the following:
         * * A conventional http URL, e.g. 'http://...' or 'file://...'
         * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
         * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
         * @param invertY when true, image is flipped when loaded.  You probably want true. Ignored for compressed textures.  Must be flipped in the file
         * @param scene needed for loading to the correct scene
         * @param samplingMode mode with should be used sample / access the texture (Default: BABYLON.Texture.TRILINEAR_SAMPLINGMODE)
         * @param onLoad optional callback to be called upon successful completion
         * @param onError optional callback to be called upon failure
         * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
         * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
         * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
         * @param forcedExtension defines the extension to use to pick the right loader
         * @returns a InternalTexture for assignment back into BABYLON.Texture
         */
        public createTexture(urlArg: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<Scene>, samplingMode: number = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE,
            onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null,
            buffer: Nullable<string | ArrayBuffer | HTMLImageElement | Blob> = null, fallback: Nullable<InternalTexture> = null, format: Nullable<number> = null,
            forcedExtension: Nullable<string> = null): InternalTexture {
            var url = String(urlArg); // assign a new string, so that the original is still available in case of fallback
            var fromData = url.substr(0, 5) === "data:";
            var fromBlob = url.substr(0, 5) === "blob:";
            var isBase64 = fromData && url.indexOf("base64") !== -1;

            let texture = fallback ? fallback : new InternalTexture(this, InternalTexture.DATASOURCE_URL);

            // establish the file extension, if possible
            var lastDot = url.lastIndexOf('.');
            var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? url.substring(lastDot).toLowerCase() : "");

            let loader: Nullable<IInternalTextureLoader> = null;
            for (let availableLoader of Engine._TextureLoaders) {
                if (availableLoader.canLoad(extension, this._textureFormatInUse, fallback, isBase64, buffer ? true : false)) {
                    loader = availableLoader;
                    break;
                }
            }

            if (loader) {
                url = loader.transformUrl(url, this._textureFormatInUse);
            }

            if (scene) {
                scene._addPendingData(texture);
            }
            texture.url = url;
            texture.generateMipMaps = !noMipmap;
            texture.samplingMode = samplingMode;
            texture.invertY = invertY;

            if (!this._doNotHandleContextLost) {
                // Keep a link to the buffer only if we plan to handle context lost
                texture._buffer = buffer;
            }

            let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
            if (onLoad && !fallback) {
                onLoadObserver = texture.onLoadedObservable.add(onLoad);
            }

            if (!fallback) this._internalTexturesCache.push(texture);

            let onInternalError = (message?: string, exception?: any) => {
                if (scene) {
                    scene._removePendingData(texture);
                }

                let customFallback = false;
                if (loader) {
                    const fallbackUrl = loader.getFallbackTextureUrl(url, this._textureFormatInUse);
                    if (fallbackUrl) {
                        // Add Back
                        customFallback = true;
                        this.createTexture(urlArg, noMipmap, invertY, scene, samplingMode, null, onError, buffer, texture);
                    }
                }

                if (!customFallback) {
                    if (onLoadObserver) {
                        texture.onLoadedObservable.remove(onLoadObserver);
                    }
                    if (Tools.UseFallbackTexture) {
                        this.createTexture(Tools.fallbackTexture, noMipmap, invertY, scene, samplingMode, null, onError, buffer, texture);
                    }
                }

                if (onError) {
                    onError(message || "Unknown error", exception);
                }
            }

            // processing for non-image formats
            if (loader) {
                var callback = (data: string | ArrayBuffer) => {
                    loader!.loadData(data as ArrayBuffer, texture, (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => {
                        this._prepareWebGLTexture(texture, scene, width, height, invertY, !loadMipmap, isCompressed, () => {
                                done();
                                return false;
                            }, 
                            samplingMode);
                    });
                }

                if (!buffer) {
                    this._loadFile(url, callback, undefined, scene ? scene.database : undefined, true, (request?: XMLHttpRequest, exception?: any) => {
                        onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                    });
                } else {
                    callback(buffer as ArrayBuffer);
                }
            } else {
                var onload = (img: HTMLImageElement) => {
                    if (fromBlob && !this._doNotHandleContextLost) {
                        // We need to store the image if we need to rebuild the texture
                        // in case of a webgl context lost
                        texture._buffer = img;
                    }

                    this._prepareWebGLTexture(texture, scene, img.width, img.height, invertY, noMipmap, false, (potWidth, potHeight, continuationCallback) => {
                        let gl = this._gl;
                        var isPot = (img.width === potWidth && img.height === potHeight);
                        let internalFormat = format ? this._getInternalFormat(format) : ((extension === ".jpg") ? gl.RGB : gl.RGBA);

                        if (isPot) {
                            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, img);
                            return false;
                        }

                        let maxTextureSize = this._caps.maxTextureSize;

                        if (img.width > maxTextureSize || img.height > maxTextureSize) {
                            this._prepareWorkingCanvas();
                            if (!this._workingCanvas || !this._workingContext) {
                                return false;
                            }

                            this._workingCanvas.width = potWidth;
                            this._workingCanvas.height = potHeight;
        
                            this._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, this._workingCanvas);
    
                            texture.width = potWidth;
                            texture.height = potHeight;

                            return false;
                        } else {
                            // Using shaders when possible to rescale because canvas.drawImage is lossy
                            let source = new InternalTexture(this, InternalTexture.DATASOURCE_TEMP);
                            this._bindTextureDirectly(gl.TEXTURE_2D, source, true);
                            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, img);

                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                            this._rescaleTexture(source, texture, scene, internalFormat, () => {
                                this._releaseTexture(source);
                                this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);

                                continuationCallback();
                            });
                        }

                        return true;
                    }, samplingMode);
                };

                if (!fromData || isBase64) {
                    if (buffer instanceof HTMLImageElement) {
                        onload(buffer);
                    } else {
                        Tools.LoadImage(url, onload, onInternalError, scene ? scene.database : null);
                    }
                }
                else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || buffer instanceof Blob) {
                    Tools.LoadImage(buffer, onload, onInternalError, scene ? scene.database : null);
                }
                else {
                    onload(<HTMLImageElement>buffer);
                }
            }

            return texture;
        }

        private _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<Scene>, internalFormat: number, onComplete: () => void): void {
            let rtt = this.createRenderTargetTexture({
                width: destination.width,
                height: destination.height,
            }, {
                    generateMipMaps: false,
                    type: Engine.TEXTURETYPE_UNSIGNED_INT,
                    samplingMode: Engine.TEXTURE_BILINEAR_SAMPLINGMODE,
                    generateDepthBuffer: false,
                    generateStencilBuffer: false
                }
            );

            if (!this._rescalePostProcess) {
                this._rescalePostProcess = new PassPostProcess("rescale", 1, null, Engine.TEXTURE_BILINEAR_SAMPLINGMODE, this, false, Engine.TEXTURETYPE_UNSIGNED_INT);
            }

            this._rescalePostProcess.getEffect().executeWhenCompiled(() => {
                this._rescalePostProcess.onApply = function (effect) {
                    effect._bindTexture("textureSampler", source);
                }

                let hostingScene = scene;

                if (!hostingScene) {
                    hostingScene = this.scenes[this.scenes.length - 1];
                }
                hostingScene.postProcessManager.directRender([this._rescalePostProcess], rtt, true);

                this._bindTextureDirectly(this._gl.TEXTURE_2D, destination, true);
                this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

                this.unBindFramebuffer(rtt);
                this._releaseTexture(rtt);

                if (onComplete) {
                    onComplete();
                }
            });
        }

        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT by default)
         */
        public updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, type = Engine.TEXTURETYPE_UNSIGNED_INT): void {            if (!texture) {
                return;
            }
            // babylon's internalSizedFomat but gl's texImage2D internalFormat
            var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type, format);
            // babylon's internalFormat but gl's texImage2D format
            var internalFormat = this._getInternalFormat(format);
            var textureType = this._getWebGLTextureType(type);
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);
            this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

            if (!this._doNotHandleContextLost) {
                texture._bufferView = data;
                texture.format = format;
                texture.type = type;
                texture.invertY = invertY;
                texture._compression = compression;
            }

            if (texture.width % 4 !== 0) {
                this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
            }
            
            if (compression && data) {
                this._gl.compressedTexImage2D(this._gl.TEXTURE_2D, 0, (<any>this.getCaps().s3tc)[compression], texture.width, texture.height, 0, <DataView>data);
            } else {
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, data);
            }

            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            //  this.resetTextureCache();
            texture.isReady = true;
        }

        /**
         * Creates a raw texture
         * @param data defines the data to store in the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param format defines the format of the data
         * @param generateMipMaps defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (BABYLON.Texture.NEAREST_SAMPLINGMODE by default)
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @returns the raw texture inside an InternalTexture
         */
        public createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, type: number = Engine.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RAW);
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = width;
            texture.height = height;
            texture.format = format;
            texture.generateMipMaps = generateMipMaps;
            texture.samplingMode = samplingMode;
            texture.invertY = invertY;
            texture._compression = compression;
            texture.type = type;

            if (!this._doNotHandleContextLost) {
                texture._bufferView = data;
            }

            this.updateRawTexture(texture, data, format, invertY, compression, type);
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);

            // Filters
            var filters = this._getSamplingParameters(samplingMode, generateMipMaps);

            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);

            if (generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);


            this._internalTexturesCache.push(texture);

            return texture;
        }

        private _unpackFlipYCached: Nullable<boolean> = null;
        /** @hidden */
        public _unpackFlipY(value: boolean) {
            if (this._unpackFlipYCached !== value) {
                this._unpackFlipYCached = value;
                this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, value ? 1 : 0);
            }
        }

        /** @hidden */
        public _getUnpackAlignement(): number {
            return this._gl.getParameter(this._gl.UNPACK_ALIGNMENT);
        }

        /**
         * Creates a dynamic texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param generateMipMaps defines if the engine should generate the mip levels
         * @param samplingMode defines the required sampling mode (BABYLON.Texture.NEAREST_SAMPLINGMODE by default)
         * @returns the dynamic texture inside an InternalTexture
         */
        public createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_DYNAMIC)
            texture.baseWidth = width;
            texture.baseHeight = height;

            if (generateMipMaps) {
                width = this.needPOTTextures ? Tools.GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
                height = this.needPOTTextures ? Tools.GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
            }

            //  this.resetTextureCache();
            texture.width = width;
            texture.height = height;
            texture.isReady = false;
            texture.generateMipMaps = generateMipMaps;
            texture.samplingMode = samplingMode;

            this.updateTextureSamplingMode(samplingMode, texture);

            this._internalTexturesCache.push(texture);

            return texture;
        }

        /**
         * Update the sampling mode of a given texture
         * @param samplingMode defines the required sampling mode
         * @param texture defines the texture to update
         */
        public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
            var filters = this._getSamplingParameters(samplingMode, texture.generateMipMaps);

            if (texture.isCube) {
                this._setTextureParameterInteger(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MAG_FILTER, filters.mag, texture);
                this._setTextureParameterInteger(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
            } else if (texture.is3D) {
                this._setTextureParameterInteger(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, filters.mag, texture);
                this._setTextureParameterInteger(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
            } else {
                this._setTextureParameterInteger(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag, texture);
                this._setTextureParameterInteger(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            }

            texture.samplingMode = samplingMode;
        }

        /**
         * Update the content of a dynamic texture
         * @param texture defines the texture to update
         * @param canvas defines the canvas containing the source
         * @param invertY defines if data must be stored with Y axis inverted
         * @param premulAlpha defines if alpha is stored as premultiplied
         * @param format defines the format of the data
         */
        public updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha: boolean = false, format?: number): void {
            if (!texture) {
                return;
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);
            this._unpackFlipY(invertY);
            if (premulAlpha) {
                this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
            }
            let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, internalFormat, this._gl.UNSIGNED_BYTE, canvas);
            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            if (premulAlpha) {
                this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
            }
            texture.isReady = true;
        }

        /**
         * Update a video texture
         * @param texture defines the texture to update
         * @param video defines the video element to use
         * @param invertY defines if data must be stored with Y axis inverted
         */
        public updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
            if (!texture || texture._isDisabled) {
                return;
            }

            var wasPreviouslyBound = this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);
            this._unpackFlipY(!invertY); // Video are upside down by default

            try {
                // Testing video texture support
                if (this._videoTextureSupported === undefined) {
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);

                    if (this._gl.getError() !== 0) {
                        this._videoTextureSupported = false;
                    } else {
                        this._videoTextureSupported = true;
                    }
                }

                // Copy video through the current working canvas if video texture is not supported
                if (!this._videoTextureSupported) {
                    if (!texture._workingCanvas) {
                        texture._workingCanvas = document.createElement("canvas");
                        let context = texture._workingCanvas.getContext("2d");

                        if (!context) {
                            throw new Error("Unable to get 2d context");
                        }

                        texture._workingContext = context;
                        texture._workingCanvas.width = texture.width;
                        texture._workingCanvas.height = texture.height;
                    }

                    texture._workingContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, texture.width, texture.height);
                    
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, texture._workingCanvas);
                } else {
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);
                }

                if (texture.generateMipMaps) {
                    this._gl.generateMipmap(this._gl.TEXTURE_2D);
                }

                if (!wasPreviouslyBound) {
                    this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                }
                //    this.resetTextureCache();
                texture.isReady = true;

            } catch (ex) {
                // Something unexpected
                // Let's disable the texture
                texture._isDisabled = true;
            }
        }

        /**
         * Updates a depth texture Comparison Mode and Function.
         * If the comparison Function is equal to 0, the mode will be set to none.
         * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
         * @param texture The texture to set the comparison function for
         * @param comparisonFunction The comparison function to set, 0 if no comparison required
         */
        public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
            if (this.webGLVersion === 1) {
                Tools.Error("WebGL 1 does not support texture comparison.");
                return;
            }

            var gl = this._gl;

            if (texture.isCube) {
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);

                if (comparisonFunction === 0) {
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, Engine.LEQUAL);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.NONE);
                }
                else {
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
                }

                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
            } else {
                this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);

                if (comparisonFunction === 0) {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, Engine.LEQUAL);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
                }
                else {
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
                }

                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            }

            texture._comparisonFunction = comparisonFunction;
        }

        private _setupDepthStencilTexture(internalTexture: InternalTexture, size: number | { width: number, height: number }, generateStencil: boolean, bilinearFiltering: boolean, comparisonFunction: number) : void {
            var width = (<{ width: number, height: number }>size).width || <number>size;
            var height = (<{ width: number, height: number }>size).height || <number>size;
            internalTexture.baseWidth = width;
            internalTexture.baseHeight = height;
            internalTexture.width = width;
            internalTexture.height = height;
            internalTexture.isReady = true;
            internalTexture.samples = 1;
            internalTexture.generateMipMaps = false;
            internalTexture._generateDepthBuffer = true;
            internalTexture._generateStencilBuffer = generateStencil;
            internalTexture.samplingMode = bilinearFiltering ? Engine.TEXTURE_BILINEAR_SAMPLINGMODE : Engine.TEXTURE_NEAREST_SAMPLINGMODE;
            internalTexture.type = Engine.TEXTURETYPE_UNSIGNED_INT;
            internalTexture._comparisonFunction = comparisonFunction;
            
            var gl = this._gl;
            var target = internalTexture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
            var samplingParameters = this._getSamplingParameters(internalTexture.samplingMode, false);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            if (comparisonFunction === 0) {
                gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, Engine.LEQUAL);
                gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            }
            else {
                gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }
        }

        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @returns The texture
         */
        public createDepthStencilTexture(size: number | { width: number, height: number }, options: DepthTextureCreationOptions) : InternalTexture {
            if (options.isCube) {
                let width = (<{ width: number, height: number }>size).width || <number>size;
                return this._createDepthStencilCubeTexture(width, options);
            }
            else {
                return this._createDepthStencilTexture(size, options);
            }
        }

        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @returns The texture
         */
        private _createDepthStencilTexture(size: number | { width: number, height: number }, options: DepthTextureCreationOptions) : InternalTexture {
            var internalTexture = new InternalTexture(this, InternalTexture.DATASOURCE_DEPTHTEXTURE);

            if (!this._caps.depthTextureExtension) {
                Tools.Error("Depth texture is not supported by your browser or hardware.");
                return internalTexture;
            }

            var internalOptions = {
                bilinearFiltering: false,
                comparisonFunction: 0,
                generateStencil: false,
                ...options
            }

            var gl = this._gl;
            this._bindTextureDirectly(gl.TEXTURE_2D, internalTexture, true);

            this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

            if (this.webGLVersion > 1) {
                if (internalOptions.generateStencil) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, internalTexture.width, internalTexture.height, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
                }
                else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, internalTexture.width, internalTexture.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
                }
            }
            else {
                if (internalOptions.generateStencil) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, internalTexture.width, internalTexture.height, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
                }
                else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, internalTexture.width, internalTexture.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
                }
            }

            this._bindTextureDirectly(gl.TEXTURE_2D, null);

            return internalTexture;
        }

        /**
         * Creates a depth stencil cube texture.
         * This is only available in WebGL 2.
         * @param size The size of face edge in the cube texture.
         * @param options The options defining the cube texture.
         * @returns The cube texture
         */
        private _createDepthStencilCubeTexture(size: number, options: DepthTextureCreationOptions) : InternalTexture {
            var internalTexture = new InternalTexture(this, InternalTexture.DATASOURCE_UNKNOWN);
            internalTexture.isCube = true;

            if (this.webGLVersion === 1) {
                Tools.Error("Depth cube texture is not supported by WebGL 1.");
                return internalTexture;
            }

            var internalOptions = {
                bilinearFiltering: false,
                comparisonFunction: 0,
                generateStencil: false,
                ...options
            }

            var gl = this._gl;
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, internalTexture, true);

            this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

            // Create the depth/stencil buffer
            for (var face = 0; face < 6; face++) {
                if (internalOptions.generateStencil) {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.DEPTH24_STENCIL8, size, size, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
                }
                else {
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
                }
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            return internalTexture;
        }

        /**
         * Sets the frame buffer Depth / Stencil attachement of the render target to the defined depth stencil texture.
         * @param renderTarget The render target to set the frame buffer for
         */
        public setFrameBufferDepthStencilTexture(renderTarget: RenderTargetTexture): void {
            // Create the framebuffer
            var internalTexture = renderTarget.getInternalTexture();
            if (!internalTexture || !internalTexture._framebuffer || !renderTarget.depthStencilTexture) {
                return;
            }

            var gl = this._gl;
            var depthStencilTexture = renderTarget.depthStencilTexture;

            this.bindUnboundFramebuffer(internalTexture._framebuffer);
            if (depthStencilTexture.isCube) {
                if (depthStencilTexture._generateStencilBuffer) {
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X, depthStencilTexture._webGLTexture, 0);
                }
                else {
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_CUBE_MAP_POSITIVE_X, depthStencilTexture._webGLTexture, 0);
                }
            }
            else {
                if (depthStencilTexture._generateStencilBuffer) {
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthStencilTexture._webGLTexture, 0);
                }
                else {
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthStencilTexture._webGLTexture, 0);
                }
            }
            this.bindUnboundFramebuffer(null);
        }

        /**
         * Creates a new render target texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target texture stored in an InternalTexture
         */
        public createRenderTargetTexture(size: number | { width: number, height: number }, options: boolean | RenderTargetCreationOptions): InternalTexture {
            let fullOptions = new RenderTargetCreationOptions();

            if (options !== undefined && typeof options === "object") {
                fullOptions.generateMipMaps = options.generateMipMaps;
                fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
                fullOptions.type = options.type === undefined ? Engine.TEXTURETYPE_UNSIGNED_INT : options.type;
                fullOptions.samplingMode = options.samplingMode === undefined ? Engine.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
                fullOptions.format = options.format === undefined ? Engine.TEXTUREFORMAT_RGBA : options.format;
            } else {
                fullOptions.generateMipMaps = <boolean>options;
                fullOptions.generateDepthBuffer = true;
                fullOptions.generateStencilBuffer = false;
                fullOptions.type = Engine.TEXTURETYPE_UNSIGNED_INT;
                fullOptions.samplingMode = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE;
                fullOptions.format = Engine.TEXTUREFORMAT_RGBA;
            }

            if (fullOptions.type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
                // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                fullOptions.samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
            }
            else if (fullOptions.type === Engine.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
                // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
                fullOptions.samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
            }
            var gl = this._gl;

            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);
            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);

            var width = (<{ width: number, height: number }>size).width || <number>size;
            var height = (<{ width: number, height: number }>size).height || <number>size;

            var filters = this._getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps ? true : false);

            if (fullOptions.type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                fullOptions.type = Engine.TEXTURETYPE_UNSIGNED_INT;
                Tools.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(fullOptions.type, fullOptions.format), width, height, 0, this._getInternalFormat(fullOptions.format), this._getWebGLTextureType(fullOptions.type), null);

            // Create the framebuffer
            var currentFrameBuffer = this._currentFramebuffer;
            var framebuffer = gl.createFramebuffer();
            this.bindUnboundFramebuffer(framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, 0);

            texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer ? true : false, fullOptions.generateDepthBuffer, width, height);

            if (fullOptions.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }

            // Unbind
            this._bindTextureDirectly(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(currentFrameBuffer);

            texture._framebuffer = framebuffer;
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = width;
            texture.height = height;
            texture.isReady = true;
            texture.samples = 1;
            texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
            texture.samplingMode = fullOptions.samplingMode;
            texture.type = fullOptions.type;
            texture.format = fullOptions.format;
            texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
            texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

            // this.resetTextureCache();

            this._internalTexturesCache.push(texture);

            return texture;
        }

        /**
         * Create a multi render target texture
         * @see http://doc.babylonjs.com/features/webgl2#multiple-render-target
         * @param size defines the size of the texture
         * @param options defines the creation options
         * @returns the cube texture as an InternalTexture
         */
        public createMultipleRenderTarget(size: any, options: IMultiRenderTargetOptions): InternalTexture[] {
            var generateMipMaps = false;
            var generateDepthBuffer = true;
            var generateStencilBuffer = false;
            var generateDepthTexture = false;
            var textureCount = 1;

            var defaultType = Engine.TEXTURETYPE_UNSIGNED_INT;
            var defaultSamplingMode = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE;

            var types = new Array<number>();
            var samplingModes = new Array<number>();

            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps === undefined ? false: options.generateMipMaps;
                generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                generateStencilBuffer = options.generateStencilBuffer === undefined ? false: options.generateStencilBuffer;
                generateDepthTexture = options.generateDepthTexture === undefined ? false: options.generateDepthTexture;
                textureCount = options.textureCount || 1;

                if (options.types) {
                    types = options.types;
                }
                if (options.samplingModes) {
                    samplingModes = options.samplingModes;
                }

            }
            var gl = this._gl;
            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            this.bindUnboundFramebuffer(framebuffer);

            var width = size.width || size;
            var height = size.height || size;

            var textures = [];
            var attachments = []

            var depthStencilBuffer = this._setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height);

            for (var i = 0; i < textureCount; i++) {
                var samplingMode = samplingModes[i] || defaultSamplingMode;
                var type = types[i] || defaultType;

                if (type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
                    // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                    samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
                }
                else if (type === Engine.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
                    // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
                    samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
                }

                var filters = this._getSamplingParameters(samplingMode, generateMipMaps);
                if (type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                    type = Engine.TEXTURETYPE_UNSIGNED_INT;
                    Tools.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
                }

                var texture = new InternalTexture(this, InternalTexture.DATASOURCE_MULTIRENDERTARGET);
                var attachment = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

                textures.push(texture);
                attachments.push(attachment);

                gl.activeTexture((<any>gl)["TEXTURE" + i]);
                gl.bindTexture(gl.TEXTURE_2D, texture._webGLTexture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(type), width, height, 0, gl.RGBA, this._getWebGLTextureType(type), null);

                gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture._webGLTexture, 0);

                if (generateMipMaps) {
                    this._gl.generateMipmap(this._gl.TEXTURE_2D);
                }

                // Unbind
                this._bindTextureDirectly(gl.TEXTURE_2D, null);

                texture._framebuffer = framebuffer;
                texture._depthStencilBuffer = depthStencilBuffer;
                texture.baseWidth = width;
                texture.baseHeight = height;
                texture.width = width;
                texture.height = height;
                texture.isReady = true;
                texture.samples = 1;
                texture.generateMipMaps = generateMipMaps;
                texture.samplingMode = samplingMode;
                texture.type = type;
                texture._generateDepthBuffer = generateDepthBuffer;
                texture._generateStencilBuffer = generateStencilBuffer;
                texture._attachments = attachments;

                this._internalTexturesCache.push(texture);
            }

            if (generateDepthTexture && this._caps.depthTextureExtension) {
                // Depth texture
                var depthTexture = new InternalTexture(this, InternalTexture.DATASOURCE_MULTIRENDERTARGET);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, depthTexture._webGLTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    this.webGLVersion < 2 ? gl.DEPTH_COMPONENT : gl.DEPTH_COMPONENT16,
                    width,
                    height,
                    0,
                    gl.DEPTH_COMPONENT,
                    gl.UNSIGNED_SHORT,
                    null
                );

                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    depthTexture._webGLTexture,
                    0
                );

                depthTexture._framebuffer = framebuffer;
                depthTexture.baseWidth = width;
                depthTexture.baseHeight = height;
                depthTexture.width = width;
                depthTexture.height = height;
                depthTexture.isReady = true;
                depthTexture.samples = 1;
                depthTexture.generateMipMaps = generateMipMaps;
                depthTexture.samplingMode = gl.NEAREST;
                depthTexture._generateDepthBuffer = generateDepthBuffer;
                depthTexture._generateStencilBuffer = generateStencilBuffer;

                textures.push(depthTexture)
                this._internalTexturesCache.push(depthTexture);
            }

            gl.drawBuffers(attachments);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            this.resetTextureCache();

            return textures;
        }

        private _setupFramebufferDepthAttachments(generateStencilBuffer: boolean, generateDepthBuffer: boolean, width: number, height: number, samples = 1): Nullable<WebGLRenderbuffer> {
            var depthStencilBuffer: Nullable<WebGLRenderbuffer> = null;
            var gl = this._gl;

            // Create the depth/stencil buffer
            if (generateStencilBuffer) {
                depthStencilBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilBuffer);

                if (samples > 1) {
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH24_STENCIL8, width, height);
                } else {
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
                }

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilBuffer);
            }
            else if (generateDepthBuffer) {
                depthStencilBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilBuffer);

                if (samples > 1) {
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, width, height);
                } else {
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                }

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthStencilBuffer);
            }

            return depthStencilBuffer;
        }

        /**
         * Updates the sample count of a render target texture
         * @see http://doc.babylonjs.com/features/webgl2#multisample-render-targets
         * @param texture defines the texture to update
         * @param samples defines the sample count to set
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        public updateRenderTargetTextureSampleCount(texture: Nullable<InternalTexture>, samples: number): number {
            if (this.webGLVersion < 2 || !texture) {
                return 1;
            }

            if (texture.samples === samples) {
                return samples;
            }

            var gl = this._gl;

            samples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));

            // Dispose previous render buffers
            if (texture._depthStencilBuffer) {
                gl.deleteRenderbuffer(texture._depthStencilBuffer);
                texture._depthStencilBuffer = null;
            }

            if (texture._MSAAFramebuffer) {
                gl.deleteFramebuffer(texture._MSAAFramebuffer);
                texture._MSAAFramebuffer = null;
            }

            if (texture._MSAARenderBuffer) {
                gl.deleteRenderbuffer(texture._MSAARenderBuffer);
                texture._MSAARenderBuffer = null;
            }

            if (samples > 1) {
                let framebuffer = gl.createFramebuffer();

                if (!framebuffer) {
                    throw new Error("Unable to create multi sampled framebuffer");
                }

                texture._MSAAFramebuffer = framebuffer;
                this.bindUnboundFramebuffer(texture._MSAAFramebuffer);

                var colorRenderbuffer = gl.createRenderbuffer();

                if (!colorRenderbuffer) {
                    throw new Error("Unable to create multi sampled framebuffer");
                }

                gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, this._getRGBAMultiSampleBufferFormat(texture.type), texture.width, texture.height);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);

                texture._MSAARenderBuffer = colorRenderbuffer;
            } else {
                this.bindUnboundFramebuffer(texture._framebuffer);
            }

            texture.samples = samples;
            texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(texture._generateStencilBuffer, texture._generateDepthBuffer, texture.width, texture.height, samples);

            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            return samples;
        }

        /**
         * Update the sample count for a given multiple render target texture
         * @see http://doc.babylonjs.com/features/webgl2#multisample-render-targets
         * @param textures defines the textures to update
         * @param samples defines the sample count to set
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        public updateMultipleRenderTargetTextureSampleCount(textures: Nullable<InternalTexture[]>, samples: number): number {
            if (this.webGLVersion < 2 || !textures || textures.length == 0) {
                return 1;
            }

            if (textures[0].samples === samples) {
                return samples;
            }

            var gl = this._gl;

            samples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));

            // Dispose previous render buffers
            if (textures[0]._depthStencilBuffer) {
                gl.deleteRenderbuffer(textures[0]._depthStencilBuffer);
                textures[0]._depthStencilBuffer = null;
            }

            if (textures[0]._MSAAFramebuffer) {
                gl.deleteFramebuffer(textures[0]._MSAAFramebuffer);
                textures[0]._MSAAFramebuffer = null;
            }

            for (var i = 0; i < textures.length; i++) {
                if (textures[i]._MSAARenderBuffer) {
                    gl.deleteRenderbuffer(textures[i]._MSAARenderBuffer);
                    textures[i]._MSAARenderBuffer = null;
                }
            }

            if (samples > 1) {
                let framebuffer = gl.createFramebuffer();

                if (!framebuffer) {
                    throw new Error("Unable to create multi sampled framebuffer");
                }

                this.bindUnboundFramebuffer(framebuffer);

                let depthStencilBuffer = this._setupFramebufferDepthAttachments(textures[0]._generateStencilBuffer, textures[0]._generateDepthBuffer, textures[0].width, textures[0].height, samples);

                var attachments = [];

                for (var i = 0; i < textures.length; i++) {
                    var texture = textures[i];
                    var attachment = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

                    var colorRenderbuffer = gl.createRenderbuffer();

                    if (!colorRenderbuffer) {
                        throw new Error("Unable to create multi sampled framebuffer");
                    }

                    gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, this._getRGBAMultiSampleBufferFormat(texture.type), texture.width, texture.height);

                    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, colorRenderbuffer);

                    texture._MSAAFramebuffer = framebuffer;
                    texture._MSAARenderBuffer = colorRenderbuffer;
                    texture.samples = samples;
                    texture._depthStencilBuffer = depthStencilBuffer;
                    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                    attachments.push(attachment);
                }
                gl.drawBuffers(attachments);
            } else {
                this.bindUnboundFramebuffer(textures[0]._framebuffer);
            }

            this.bindUnboundFramebuffer(null);

            return samples;
        }

        /** @hidden */
        public _uploadCompressedDataToTextureDirectly(texture: InternalTexture, internalFormat: number, width: number, height: number, data: ArrayBufferView, faceIndex: number = 0, lod: number = 0) {
            var gl = this._gl;

            var target = gl.TEXTURE_2D;
            if (texture.isCube) {
                target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
            }

            this._gl.compressedTexImage2D(target, lod, internalFormat, width, height, 0, <DataView>data);
        }

        /** @hidden */
        public _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
            var gl = this._gl;

            var textureType = this._getWebGLTextureType(texture.type);
            var format = this._getInternalFormat(texture.format);
            var internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, format);

            this._unpackFlipY(texture.invertY);

            var target = gl.TEXTURE_2D;
            if (texture.isCube) {
                target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
            }

            const lodMaxWidth = Math.round(Scalar.Log2(texture.width));
            const lodMaxHeight = Math.round(Scalar.Log2(texture.height));
            const width = Math.pow(2, Math.max(lodMaxWidth - lod, 0));
            const height = Math.pow(2, Math.max(lodMaxHeight - lod, 0));

            gl.texImage2D(target, lod, internalFormat, width, height, 0, format, textureType, imageData);
        }

        /** @hidden */
        public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
            var gl = this._gl;
            var bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

            this._bindTextureDirectly(bindTarget, texture, true);

            this._uploadDataToTextureDirectly(texture, imageData, faceIndex, lod);

            this._bindTextureDirectly(bindTarget, null, true);
        }

        /** @hidden */
        public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement, faceIndex: number = 0, lod: number = 0) {
            var gl = this._gl;

            var textureType = this._getWebGLTextureType(texture.type);
            var format = this._getInternalFormat(texture.format);
            var internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, format);

            var bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

            this._bindTextureDirectly(bindTarget, texture, true);
            this._unpackFlipY(texture.invertY);

            var target = gl.TEXTURE_2D;
            if (texture.isCube) {
                target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
            }

            gl.texImage2D(target, lod, internalFormat, format, textureType, image);
            this._bindTextureDirectly(bindTarget, null, true);
        }

        /**
         * Creates a new render target cube texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target cube texture stored in an InternalTexture
         */
        public createRenderTargetCubeTexture(size: number, options?: Partial<RenderTargetCreationOptions>): InternalTexture {
            let fullOptions = {
              generateMipMaps: true,
              generateDepthBuffer: true,
              generateStencilBuffer: false,
              type: Engine.TEXTURETYPE_UNSIGNED_INT,
              samplingMode: Engine.TEXTURE_TRILINEAR_SAMPLINGMODE,
              format: Engine.TEXTUREFORMAT_RGBA,
              ...options
            };
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;

            if (fullOptions.type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
              // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
              fullOptions.samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
            }
            else if (fullOptions.type === Engine.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
              // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
              fullOptions.samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
            }
            var gl = this._gl

            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);

            var filters = this._getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps);

            if (fullOptions.type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
              fullOptions.type = Engine.TEXTURETYPE_UNSIGNED_INT;
              Tools.Warn("Float textures are not supported. Cube render target forced to TEXTURETYPE_UNESIGNED_BYTE type");
            }

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            for (var face = 0; face < 6; face++) {
                gl.texImage2D((gl.TEXTURE_CUBE_MAP_POSITIVE_X + face), 0, this._getRGBABufferInternalSizedFormat(fullOptions.type, fullOptions.format), size, size, 0, this._getInternalFormat(fullOptions.format), this._getWebGLTextureType(fullOptions.type), null);
            }

            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            this.bindUnboundFramebuffer(framebuffer);

            texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer, fullOptions.generateDepthBuffer, size, size);

            // MipMaps
            if (fullOptions.generateMipMaps) {
              gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }

            // Unbind
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            texture._framebuffer = framebuffer;
            texture.width = size;
            texture.height = size;
            texture.isReady = true;
            texture.isCube = true;
            texture.samples = 1;
            texture.generateMipMaps = fullOptions.generateMipMaps;
            texture.samplingMode = fullOptions.samplingMode;
            texture.type = fullOptions.type;
            texture.format = fullOptions.format;
            texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
            texture._generateStencilBuffer = fullOptions.generateStencilBuffer;

            this._internalTexturesCache.push(texture);

            return texture;
        }

        /**
         * Create a cube texture from prefiltered data (ie. the mipmaps contain ready to use data for PBR reflection)
         * @param rootUrl defines the url where the file to load is located
         * @param scene defines the current scene
         * @param lodScale defines scale to apply to the mip map selection
         * @param lodOffset defines offset to apply to the mip map selection
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials defines wheter or not to create polynomails harmonics for the texture
         * @returns the cube texture as an InternalTexture
         */
        public createPrefilteredCubeTexture(rootUrl: string, scene: Nullable<Scene>, lodScale: number, lodOffset: number,
            onLoad: Nullable<(internalTexture: Nullable<InternalTexture>) => void> = null,
            onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null,
            createPolynomials: boolean = true): InternalTexture {
            var callback = (loadData: any) => {
                if (!loadData) {
                    if (onLoad) {
                        onLoad(null);
                    }
                    return;
                }

                let texture = loadData.texture as InternalTexture;
                if (!createPolynomials) {
                    texture._sphericalPolynomial = new BABYLON.SphericalPolynomial();
                }
                else if(loadData.info.sphericalPolynomial){
                    texture._sphericalPolynomial = loadData.info.sphericalPolynomial;
                }
                texture._dataSource = InternalTexture.DATASOURCE_CUBEPREFILTERED;

                if (this._caps.textureLOD) {
                    // Do not add extra process if texture lod is supported.
                    if (onLoad) {
                        onLoad(texture);
                    }
                    return;
                }

                const mipSlices = 3;

                var gl = this._gl;
                const width = loadData.width;
                if (!width) {
                    return;
                }

                const textures: BaseTexture[] = [];
                for (let i = 0; i < mipSlices; i++) {
                    //compute LOD from even spacing in smoothness (matching shader calculation)
                    let smoothness = i / (mipSlices - 1);
                    let roughness = 1 - smoothness;

                    let minLODIndex = lodOffset; // roughness = 0
                    let maxLODIndex = Scalar.Log2(width) * lodScale + lodOffset; // roughness = 1

                    let lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
                    let mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));

                    var glTextureFromLod = new InternalTexture(this, InternalTexture.DATASOURCE_TEMP);
                    glTextureFromLod.type = texture.type;
                    glTextureFromLod.format = texture.format;
                    glTextureFromLod.width = Math.pow(2, Math.max( Scalar.Log2(width) - mipmapIndex, 0));
                    glTextureFromLod.height = glTextureFromLod.width;
                    glTextureFromLod.isCube = true;
                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, glTextureFromLod, true);

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    if (loadData.isDDS) {
                        var info: DDSInfo = loadData.info;
                        var data: any = loadData.data;
                        this._unpackFlipY(info.isCompressed);

                        DDSTools.UploadDDSLevels(this, glTextureFromLod, data, info, true, 6, mipmapIndex);
                    }
                    else {
                        Tools.Warn("DDS is the only prefiltered cube map supported so far.")
                    }

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

                    // Wrap in a base texture for easy binding.
                    const lodTexture = new BaseTexture(scene);
                    lodTexture.isCube = true;
                    lodTexture._texture = glTextureFromLod;

                    glTextureFromLod.isReady = true;
                    textures.push(lodTexture);
                }

                texture._lodTextureHigh = textures[2];
                texture._lodTextureMid = textures[1];
                texture._lodTextureLow = textures[0];

                if (onLoad) {
                    onLoad(texture);
                }
            };

            return this.createCubeTexture(rootUrl, scene, null, false, callback, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset);
        }

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials if a polynomial sphere should be created for the cube texture
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         * @param fallback defines texture to use while falling back when (compressed) texture file not found.
         * @returns the cube texture as an InternalTexture
         */
        public createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials = false, lodScale: number = 0, lodOffset: number = 0, fallback: Nullable<InternalTexture> = null): InternalTexture {
            var gl = this._gl;

            var texture = fallback ? fallback : new InternalTexture(this, InternalTexture.DATASOURCE_CUBE);
            texture.isCube = true;
            texture.url = rootUrl;
            texture.generateMipMaps = !noMipmap;
            texture._lodGenerationScale = lodScale;
            texture._lodGenerationOffset = lodOffset;

            if (!this._doNotHandleContextLost) {
                texture._extension = forcedExtension;
                texture._files = files;
            }

            var lastDot = rootUrl.lastIndexOf('.');
            var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");

            let loader: Nullable<IInternalTextureLoader> = null;
            for (let availableLoader of Engine._TextureLoaders) {
                if (availableLoader.canLoad(extension, this._textureFormatInUse, fallback, false, false)) {
                    loader = availableLoader;
                    break;
                }
            }

            let onInternalError = (request?: XMLHttpRequest, exception?: any) => {
                if (loader) {
                    const fallbackUrl = loader.getFallbackTextureUrl(rootUrl, this._textureFormatInUse);
                    if (fallbackUrl) {
                        this.createCubeTexture(fallbackUrl, scene, files, noMipmap, onLoad, onError, format, extension, createPolynomials, lodScale, lodOffset, texture);
                    }
                }

                if (onError && request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            }

            if (loader) {
                rootUrl = loader.transformUrl(rootUrl, this._textureFormatInUse);

                const onloaddata = (data: any) => {
                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
                    loader!.loadCubeData(data, texture, createPolynomials, onLoad, onError);
                };
                if (files && files.length === 6) {
                    if (loader.supportCascades) {
                        this._cascadeLoadFiles(scene, onloaddata, files, onError);
                    }
                    else if (onError) {
                        onError("Textures type does not support cascades.");
                    }
                }
                else {
                    this._loadFile(rootUrl, onloaddata, undefined, undefined, true, onInternalError);
                }
            }
            else {
                if (!files) {
                    throw new Error("Cannot load cubemap because files were not defined");
                }

                this._cascadeLoadImgs(rootUrl, scene, imgs => {
                    var width = this.needPOTTextures ? Tools.GetExponentOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize) : imgs[0].width;
                    var height = width;

                    this._prepareWorkingCanvas();

                    if (!this._workingCanvas || !this._workingContext) {
                        return;
                    }
                    this._workingCanvas.width = width;
                    this._workingCanvas.height = height;

                    var faces = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
                    this._unpackFlipY(false);

                    let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;
                    for (var index = 0; index < faces.length; index++) {
                        this._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                        gl.texImage2D(faces[index], 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, this._workingCanvas);
                    }

                    if (!noMipmap) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }

                    this._setCubeMapTextureParams(!noMipmap);

                    texture.width = width;
                    texture.height = height;
                    texture.isReady = true;
                    if (format) {
                        texture.format = format;
                    }

                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();

                    if (onLoad) {
                        onLoad();
                    }
                }, files, onError);
            }

            this._internalTexturesCache.push(texture);

            return texture;
        }

        /**
         * @hidden
         */
        public _setCubeMapTextureParams(loadMipmap: boolean): void {
            var gl = this._gl;
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            //  this.resetTextureCache();
        }

        /**
         * Update a raw cube texture
         * @param texture defines the texture to udpdate
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param level defines which level of the texture to update
         */
        public updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string> = null, level = 0): void {
            texture._bufferViewArray = data;
            texture.format = format;
            texture.type = type;
            texture.invertY = invertY;
            texture._compression = compression;

            var gl = this._gl;
            var textureType = this._getWebGLTextureType(type);
            var internalFormat = this._getInternalFormat(format);
            var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

            var needConversion = false;
            if (internalFormat === gl.RGB) {
                internalFormat = gl.RGBA;
                needConversion = true;
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
            this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

            if (texture.width % 4 !== 0) {
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            }

            // Data are known to be in +X +Y +Z -X -Y -Z
            for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                let faceData = data[faceIndex];

                if (compression) {
                    gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, (<any>(this.getCaps().s3tc))[compression], texture.width, texture.height, 0, <DataView>faceData);
                } else {
                    if (needConversion) {
                        faceData = this._convertRGBtoRGBATextureData(faceData, texture.width, texture.height, type);
                    }
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, faceData);
                }
            }

            var isPot = !this.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
            if (isPot && texture.generateMipMaps && level === 0) {
                this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);

            // this.resetTextureCache();
            texture.isReady = true;
        }

        /**
         * Creates a new raw cube texture
         * @param data defines the array of data to use to create each face
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type of the data (like BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT)
         * @param generateMipMaps  defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like BABYLON.Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compression used (null by default)
         * @returns the cube texture as an InternalTexture
         */
        public createRawCubeTexture(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number,
                                    generateMipMaps: boolean, invertY: boolean, samplingMode: number,
                                    compression: Nullable<string> = null): InternalTexture {
            var gl = this._gl;
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_CUBERAW);
            texture.isCube = true;
            texture.format = format;
            texture.type = type;
            if (!this._doNotHandleContextLost) {
                texture._bufferViewArray = data;
            }

            var textureType = this._getWebGLTextureType(type);
            var internalFormat = this._getInternalFormat(format);

            if (internalFormat === gl.RGB) {
                internalFormat = gl.RGBA;
            }

            // Mipmap generation needs a sized internal format that is both color-renderable and texture-filterable
            if (textureType === gl.FLOAT && !this._caps.textureFloatLinearFiltering) {
                generateMipMaps = false;
                samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
                BABYLON.Tools.Warn("Float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
            }
            else if (textureType === this._gl.HALF_FLOAT_OES && !this._caps.textureHalfFloatLinearFiltering) {
                generateMipMaps = false;
                samplingMode = Engine.TEXTURE_NEAREST_SAMPLINGMODE;
                BABYLON.Tools.Warn("Half float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
            }
            else if (textureType === gl.FLOAT && !this._caps.textureFloatRender) {
                generateMipMaps = false;
                BABYLON.Tools.Warn("Render to float textures is not supported. Mipmap generation forced to false.");
            }
            else if (textureType === gl.HALF_FLOAT && !this._caps.colorBufferFloat) {
                generateMipMaps = false;
                BABYLON.Tools.Warn("Render to half float textures is not supported. Mipmap generation forced to false.");
            }

            var width = size;
            var height = width;

            texture.width = width;
            texture.height = height;

            // Double check on POT to generate Mips.
            var isPot = !this.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
            if (!isPot) {
                generateMipMaps = false;
            }

            // Upload data if needed. The texture won't be ready until then.
            if (data) {
                this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);

            // Filters
            if (data && generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
            }

            var filters = this._getSamplingParameters(samplingMode, generateMipMaps);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            texture.generateMipMaps = generateMipMaps;

            return texture;
        }

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @param samplingMode defines the required sampling mode (like BABYLON.Texture.NEAREST_SAMPLINGMODE)
         * @param invertY defines if data must be stored with Y axis inverted
         * @returns the cube texture as an InternalTexture
         */        
        public createRawCubeTextureFromUrl(url: string, scene: Scene, size: number, format: number, type: number, noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
            mipmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>,
            onLoad: Nullable<() => void> = null,
            onError: Nullable<(message?: string, exception?: any) => void> = null,
            samplingMode = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE,
            invertY = false): InternalTexture {

            var gl = this._gl;
            var texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode);
            scene._addPendingData(texture);
            texture.url = url;
            this._internalTexturesCache.push(texture);

            var onerror = (request?: XMLHttpRequest, exception?: any) => {
                scene._removePendingData(texture);
                if (onError && request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            };

            var internalCallback = (data: any) => {
                var width = texture.width;
                var faceDataArrays = callback(data);

                if (!faceDataArrays) {
                    return;
                }

                if (mipmapGenerator) {
                    var textureType = this._getWebGLTextureType(type);
                    var internalFormat = this._getInternalFormat(format);
                    var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

                    var needConversion = false;
                    if (internalFormat === gl.RGB) {
                        internalFormat = gl.RGBA;
                        needConversion = true;
                    }

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
                    this._unpackFlipY(false);

                    var mipData = mipmapGenerator(faceDataArrays);
                    for (var level = 0; level < mipData.length; level++) {
                        var mipSize = width >> level;

                        for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                            let mipFaceData = mipData[level][faceIndex];
                            if (needConversion) {
                                mipFaceData = this._convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                            }
                            gl.texImage2D(faceIndex, level, internalSizedFomat, mipSize, mipSize, 0, internalFormat, textureType, mipFaceData);
                        }
                    }

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
                }
                else {
                    this.updateRawCubeTexture(texture, faceDataArrays, format, type, invertY);
                }

                texture.isReady = true;
                // this.resetTextureCache();
                scene._removePendingData(texture);

                if (onLoad) {
                    onLoad();
                }
            };

            this._loadFile(url, data => {
                internalCallback(data);
            }, undefined, scene.database, true, onerror);

            return texture;
        };

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        public updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, textureType = Engine.TEXTURETYPE_UNSIGNED_INT): void {
            var internalType = this._getWebGLTextureType(textureType);
            var internalFormat = this._getInternalFormat(format);
            var internalSizedFomat = this._getRGBABufferInternalSizedFormat(textureType, format);

            this._bindTextureDirectly(this._gl.TEXTURE_3D, texture, true);
            this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

            if (!this._doNotHandleContextLost) {
                texture._bufferView = data;
                texture.format = format;
                texture.invertY = invertY;
                texture._compression = compression;
            }

            if (texture.width % 4 !== 0) {
                this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
            }

            if (compression && data) {
                this._gl.compressedTexImage3D(this._gl.TEXTURE_3D, 0, (<any>this.getCaps().s3tc)[compression], texture.width, texture.height, texture.depth, 0, data);
            } else {
                this._gl.texImage3D(this._gl.TEXTURE_3D, 0, internalSizedFomat, texture.width, texture.height, texture.depth, 0, internalFormat, internalType, data);
            }

            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_3D);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
            // this.resetTextureCache();
            texture.isReady = true;
        }

        /**
         * Creates a new raw 3D texture
         * @param data defines the data used to create the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the depth of the texture
         * @param format defines the format of the texture
         * @param generateMipMaps defines if the engine must generate mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like BABYLON.Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compressed used (can be null)
         * @param textureType defines the compressed used (can be null)
         * @returns a new raw 3D texture (stored in an InternalTexture)
         */
        public createRawTexture3D(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, textureType = Engine.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RAW3D);
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.baseDepth = depth;
            texture.width = width;
            texture.height = height;
            texture.depth = depth;
            texture.format = format;
            texture.type = textureType;
            texture.generateMipMaps = generateMipMaps;
            texture.samplingMode = samplingMode;
            texture.is3D = true;

            if (!this._doNotHandleContextLost) {
                texture._bufferView = data;
            }

            this.updateRawTexture3D(texture, data, format, invertY, compression, textureType);
            this._bindTextureDirectly(this._gl.TEXTURE_3D, texture, true);

            // Filters
            var filters = this._getSamplingParameters(samplingMode, generateMipMaps);

            this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
            this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, filters.min);

            if (generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_3D);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_3D, null);

            this._internalTexturesCache.push(texture);

            return texture;
        }

        private _prepareWebGLTextureContinuation(texture: InternalTexture, scene: Nullable<Scene>, noMipmap: boolean, isCompressed: boolean, samplingMode: number): void {
            var gl = this._gl;
            if (!gl) {
                return;
            }

            var filters = this._getSamplingParameters(samplingMode, !noMipmap);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

            if (!noMipmap && !isCompressed) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }

            this._bindTextureDirectly(gl.TEXTURE_2D, null);

            // this.resetTextureCache();
            if (scene) {
                scene._removePendingData(texture);
            }

            texture.onLoadedObservable.notifyObservers(texture);
            texture.onLoadedObservable.clear();
        }

        private _prepareWebGLTexture(texture: InternalTexture, scene: Nullable<Scene>, width: number, height: number, invertY: boolean, noMipmap: boolean, isCompressed: boolean,
            processFunction: (width: number, height: number, continuationCallback: () => void) => boolean, samplingMode: number = Engine.TEXTURE_TRILINEAR_SAMPLINGMODE): void {
            var maxTextureSize = this.getCaps().maxTextureSize;    
            var potWidth = Math.min(maxTextureSize, this.needPOTTextures ? Tools.GetExponentOfTwo(width, maxTextureSize) : width);
            var potHeight = Math.min(maxTextureSize, this.needPOTTextures ? Tools.GetExponentOfTwo(height, maxTextureSize) : height);

            var gl = this._gl;
            if (!gl) {
                return;
            }

            if (!texture._webGLTexture) {
                //  this.resetTextureCache();
                if (scene) {
                    scene._removePendingData(texture);
                }

                return;
            }

            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
            this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = potWidth;
            texture.height = potHeight;
            texture.isReady = true;

            if (processFunction(potWidth, potHeight, () => {
                this._prepareWebGLTextureContinuation(texture, scene, noMipmap, isCompressed, samplingMode);
            })) {
                // Returning as texture needs extra async steps
                return;
            }

            this._prepareWebGLTextureContinuation(texture, scene, noMipmap, isCompressed, samplingMode);
        }

        private _convertRGBtoRGBATextureData(rgbData: any, width: number, height: number, textureType: number): ArrayBufferView {
            // Create new RGBA data container.
            var rgbaData: any;
            if (textureType === Engine.TEXTURETYPE_FLOAT) {
                rgbaData = new Float32Array(width * height * 4);
            }
            else {
                rgbaData = new Uint32Array(width * height * 4);
            }

            // Convert each pixel.
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    let index = (y * width + x) * 3;
                    let newIndex = (y * width + x) * 4;

                    // Map Old Value to new value.
                    rgbaData[newIndex + 0] = rgbData[index + 0];
                    rgbaData[newIndex + 1] = rgbData[index + 1];
                    rgbaData[newIndex + 2] = rgbData[index + 2];

                    // Add fully opaque alpha channel.
                    rgbaData[newIndex + 3] = 1;
                }
            }

            return rgbaData;
        }

        /** @hidden */
        public _releaseFramebufferObjects(texture: InternalTexture): void {
            var gl = this._gl;

            if (texture._framebuffer) {
                gl.deleteFramebuffer(texture._framebuffer);
                texture._framebuffer = null;
            }

            if (texture._depthStencilBuffer) {
                gl.deleteRenderbuffer(texture._depthStencilBuffer);
                texture._depthStencilBuffer = null;
            }

            if (texture._MSAAFramebuffer) {
                gl.deleteFramebuffer(texture._MSAAFramebuffer);
                texture._MSAAFramebuffer = null;
            }

            if (texture._MSAARenderBuffer) {
                gl.deleteRenderbuffer(texture._MSAARenderBuffer);
                texture._MSAARenderBuffer = null;
            }
        }

        /** @hidden */
        public _releaseTexture(texture: InternalTexture): void {
            var gl = this._gl;

            this._releaseFramebufferObjects(texture);

            gl.deleteTexture(texture._webGLTexture);

            // Unbind channels
            this.unbindAllTextures();

            var index = this._internalTexturesCache.indexOf(texture);
            if (index !== -1) {
                this._internalTexturesCache.splice(index, 1);
            }

            // Integrated fixed lod samplers.
            if (texture._lodTextureHigh) {
                texture._lodTextureHigh.dispose();
            }
            if (texture._lodTextureMid) {
                texture._lodTextureMid.dispose();
            }
            if (texture._lodTextureLow) {
                texture._lodTextureLow.dispose();
            }

            // Set output texture of post process to null if the texture has been released/disposed
            this.scenes.forEach((scene)=>{
                scene.postProcesses.forEach((postProcess)=>{
                    if(postProcess._outputTexture == texture){
                        postProcess._outputTexture = null;
                    }
                });
                scene.cameras.forEach((camera)=>{
                    camera._postProcesses.forEach((postProcess)=>{
                        if(postProcess){
                            if(postProcess._outputTexture == texture){
                                postProcess._outputTexture = null;
                            }
                        }
                    });
                });
            })
        }

        private setProgram(program: WebGLProgram): void {
            if (this._currentProgram !== program) {
                this._gl.useProgram(program);
                this._currentProgram = program;
            }
        }

        private _boundUniforms: { [key: number]: WebGLUniformLocation } = {};

        /**
         * Binds an effect to the webGL context
         * @param effect defines the effect to bind
         */
        public bindSamplers(effect: Effect): void {
            this.setProgram(effect.getProgram());

            var samplers = effect.getSamplers();
            for (var index = 0; index < samplers.length; index++) {
                var uniform = effect.getUniform(samplers[index]);

                if (uniform) {
                    this._boundUniforms[index] = uniform;
                }
            }
            this._currentEffect = null;
        }

        private _moveBoundTextureOnTop(internalTexture: InternalTexture): void {
            if (this.disableTextureBindingOptimization || this._lastBoundInternalTextureTracker.previous === internalTexture) {
                return;
            }

            // Remove
            this._linkTrackers(internalTexture.previous, internalTexture.next);

            // Bind last to it
            this._linkTrackers(this._lastBoundInternalTextureTracker.previous, internalTexture);

            // Bind to dummy
            this._linkTrackers(internalTexture, this._lastBoundInternalTextureTracker);
        }

        private _getCorrectTextureChannel(channel: number, internalTexture: Nullable<InternalTexture>): number {
            if (!internalTexture) {
                return -1;
            }

            internalTexture._initialSlot = channel;

            if (this.disableTextureBindingOptimization) { // We want texture sampler ID === texture channel
                if (channel !== internalTexture._designatedSlot) {
                    this._textureCollisions.addCount(1, false);
                }
            } else {
                if (channel !== internalTexture._designatedSlot) {
                    if (internalTexture._designatedSlot > -1) { // Texture is already assigned to a slot
                        return internalTexture._designatedSlot;
                    } else {
                        // No slot for this texture, let's pick a new one (if we find a free slot)
                        if (this._nextFreeTextureSlots.length) {
                            return this._nextFreeTextureSlots[0];
                        }

                        // We need to recycle the oldest bound texture, sorry.
                        this._textureCollisions.addCount(1, false);
                        return this._removeDesignatedSlot(<InternalTexture>this._firstBoundInternalTextureTracker.next);
                    }
                }
            }

            return channel;
        }

        private _linkTrackers(previous: Nullable<IInternalTextureTracker>, next: Nullable<IInternalTextureTracker>) {
            previous!.next = next;
            next!.previous = previous;
        }

        private _removeDesignatedSlot(internalTexture: InternalTexture): number {
            let currentSlot = internalTexture._designatedSlot;
            if (currentSlot === -1) {
                return -1;
            }

            internalTexture._designatedSlot = -1;

            if (this.disableTextureBindingOptimization) {
                return -1;
            }

            // Remove from bound list
            this._linkTrackers(internalTexture.previous, internalTexture.next);

            // Free the slot
            this._boundTexturesCache[currentSlot] = null;
            this._nextFreeTextureSlots.push(currentSlot);

            return currentSlot;
        }

        private _activateCurrentTexture() {
            if (this._currentTextureChannel !== this._activeChannel) {
                this._gl.activeTexture(this._gl.TEXTURE0 + this._activeChannel);
                this._currentTextureChannel = this._activeChannel;
            }
        }

        /** @hidden */
        protected _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>, forTextureDataUpdate = false, force = false): boolean {
            var wasPreviouslyBound = false;
            if (forTextureDataUpdate && texture && texture._designatedSlot > -1) {
                this._activeChannel = texture._designatedSlot;
            }

            let currentTextureBound = this._boundTexturesCache[this._activeChannel];
            let isTextureForRendering = texture && texture._initialSlot > -1;

            if (currentTextureBound !== texture || force) {
                if (currentTextureBound) {
                    this._removeDesignatedSlot(currentTextureBound);
                }

                this._activateCurrentTexture();

                this._gl.bindTexture(target, texture ? texture._webGLTexture : null);
                this._boundTexturesCache[this._activeChannel] = texture;

                if (texture) {
                    if (!this.disableTextureBindingOptimization) {
                        let slotIndex = this._nextFreeTextureSlots.indexOf(this._activeChannel);
                        if (slotIndex > -1) {
                            this._nextFreeTextureSlots.splice(slotIndex, 1);
                        }

                        this._linkTrackers(this._lastBoundInternalTextureTracker.previous, texture);
                        this._linkTrackers(texture, this._lastBoundInternalTextureTracker);
                    }

                    texture._designatedSlot = this._activeChannel;
                }
            } else if (forTextureDataUpdate) {
                wasPreviouslyBound = true;
                this._activateCurrentTexture();
            }

            if (isTextureForRendering && !forTextureDataUpdate) {
                this._bindSamplerUniformToChannel(texture!._initialSlot, this._activeChannel);
            }

            return wasPreviouslyBound;
        }

        /** @hidden */
        public _bindTexture(channel: number, texture: Nullable<InternalTexture>): void {
            if (channel < 0) {
                return;
            }

            if (texture) {
                channel = this._getCorrectTextureChannel(channel, texture);
            }

            this._activeChannel = channel;
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);
        }

        /**
         * Sets a texture to the webGL context from a postprocess
         * @param channel defines the channel to use
         * @param postProcess defines the source postprocess
         */
        public setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>): void {
            this._bindTexture(channel, postProcess ? postProcess._textures.data[postProcess._currentRenderTextureInd] : null);
        }

        /**
         * Binds the output of the passed in post process to the texture channel specified
         * @param channel The channel the texture should be bound to
         * @param postProcess The post process which's output should be bound
         */
        public setTextureFromPostProcessOutput(channel: number, postProcess: Nullable<PostProcess>): void {
            this._bindTexture(channel, postProcess ? postProcess._outputTexture : null);
        }

        /**
         * Unbind all textures from the webGL context
         */
        public unbindAllTextures(): void {
            for (var channel = 0; channel < this._maxSimultaneousTextures; channel++) {
                this._activeChannel = channel;
                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
                if (this.webGLVersion > 1) {
                    this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
                }
            }
        }

        /**
         * Sets a texture to the according uniform.
         * @param channel The texture channel
         * @param uniform The uniform to set
         * @param texture The texture to apply
         */
        public setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>): void {
            if (channel < 0) {
                return;
            }

            if (uniform) {
                this._boundUniforms[channel] = uniform;
            }

            this._setTexture(channel, texture);
        }

        /**
         * Sets a depth stencil texture from a render target to the according uniform.
         * @param channel The texture channel
         * @param uniform The uniform to set
         * @param texture The render target texture containing the depth stencil texture to apply
         */
        public setDepthStencilTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<RenderTargetTexture>): void {
            if (channel < 0) {
                return;
            }

            if (uniform) {
                this._boundUniforms[channel] = uniform;
            }

            if (!texture || !texture.depthStencilTexture) {
                this._setTexture(channel, null);
            }
            else {
                this._setTexture(channel, texture, false, true);
            }
        }

        private _bindSamplerUniformToChannel(sourceSlot: number, destination: number) {
            let uniform = this._boundUniforms[sourceSlot];
            if (uniform._currentState === destination) {
                return;
            }
            this._gl.uniform1i(uniform, destination);
            uniform._currentState = destination;
        }

        private _getTextureWrapMode(mode: number): number {
            switch(mode) {
                case Engine.TEXTURE_WRAP_ADDRESSMODE:
                    return this._gl.REPEAT;
                case Engine.TEXTURE_CLAMP_ADDRESSMODE:
                    return this._gl.CLAMP_TO_EDGE;
                case Engine.TEXTURE_MIRROR_ADDRESSMODE:
                    return this._gl.MIRRORED_REPEAT;
            }
            return this._gl.REPEAT;
        }

        private _setTexture(channel: number, texture: Nullable<BaseTexture>, isPartOfTextureArray = false, depthStencilTexture = false): boolean {
            // Not ready?
            if (!texture) {
                if (this._boundTexturesCache[channel] != null) {
                    this._activeChannel = channel;
                    this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                    this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
                    if (this.webGLVersion > 1) {
                        this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
                    }
                }
                return false;
            }

            // Video
            if ((<VideoTexture>texture).video) {
                this._activeChannel = channel;
                (<VideoTexture>texture).update();
            } else if (texture.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) { // Delay loading
                texture.delayLoad();
                return false;
            }

            let internalTexture: InternalTexture;
            if (depthStencilTexture) {
                internalTexture = (<RenderTargetTexture>texture).depthStencilTexture!;
            }
            else if (texture.isReady()) {
                internalTexture = <InternalTexture>texture.getInternalTexture();
            }
            else if (texture.isCube) {
                internalTexture = this.emptyCubeTexture;
            }
            else if (texture.is3D) {
                internalTexture = this.emptyTexture3D;
            }
            else {
                internalTexture = this.emptyTexture;
            }

            if (!isPartOfTextureArray) {
                channel = this._getCorrectTextureChannel(channel, internalTexture);
            }

            let needToBind = true;
            if (this._boundTexturesCache[channel] === internalTexture) {
                this._moveBoundTextureOnTop(internalTexture);
                if (!isPartOfTextureArray) {
                    this._bindSamplerUniformToChannel(internalTexture._initialSlot, channel);
                }
                
                needToBind = false;
            }

            this._activeChannel = channel;

            if (internalTexture && internalTexture.is3D) {
                if (needToBind) {
                    this._bindTextureDirectly(this._gl.TEXTURE_3D, internalTexture, isPartOfTextureArray);
                }

                if (internalTexture && internalTexture._cachedWrapU !== texture.wrapU) {
                    internalTexture._cachedWrapU = texture.wrapU;
                    this._setTextureParameterInteger(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_S, this._getTextureWrapMode(texture.wrapU), internalTexture);
                }

                if (internalTexture && internalTexture._cachedWrapV !== texture.wrapV) {
                    internalTexture._cachedWrapV = texture.wrapV;
                    this._setTextureParameterInteger(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_T, this._getTextureWrapMode(texture.wrapV), internalTexture);
                }

                if (internalTexture && internalTexture._cachedWrapR !== texture.wrapR) {
                    internalTexture._cachedWrapR = texture.wrapR;
                    this._setTextureParameterInteger(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_R, this._getTextureWrapMode(texture.wrapR), internalTexture);
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_3D, texture);
            }
            else if (internalTexture && internalTexture.isCube) {
                if (needToBind) {
                    this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, internalTexture, isPartOfTextureArray);
                }                

                if (internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                    internalTexture._cachedCoordinatesMode = texture.coordinatesMode;
                    // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
                    var textureWrapMode = (texture.coordinatesMode !== Engine.TEXTURE_CUBIC_MODE && texture.coordinatesMode !== Engine.TEXTURE_SKYBOX_MODE) ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE;
                    this._setTextureParameterInteger(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_S, textureWrapMode, internalTexture);
                    this._setTextureParameterInteger(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_T, textureWrapMode);
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_CUBE_MAP, texture);
            } else {
                if (needToBind) {               
                    this._bindTextureDirectly(this._gl.TEXTURE_2D, internalTexture, isPartOfTextureArray);
                }

                if (internalTexture && internalTexture._cachedWrapU !== texture.wrapU) {
                    internalTexture._cachedWrapU = texture.wrapU;
                    this._setTextureParameterInteger(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._getTextureWrapMode(texture.wrapU), internalTexture);
                }

                if (internalTexture && internalTexture._cachedWrapV !== texture.wrapV) {
                    internalTexture._cachedWrapV = texture.wrapV;
                    this._setTextureParameterInteger(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._getTextureWrapMode(texture.wrapV), internalTexture);
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_2D, texture);
            }

            return true;
        }

        /**
         * Sets an array of texture to the webGL context
         * @param channel defines the channel where the texture array must be set
         * @param uniform defines the associated uniform location
         * @param textures defines the array of textures to bind
         */
        public setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: BaseTexture[]): void {
            if (channel < 0 || !uniform) {
                return;
            }

            if (!this._textureUnits || this._textureUnits.length !== textures.length) {
                this._textureUnits = new Int32Array(textures.length);
            }
            for (let i = 0; i < textures.length; i++) {
                this._textureUnits[i] = this._getCorrectTextureChannel(channel + i, textures[i].getInternalTexture());
            }
            this._gl.uniform1iv(uniform, this._textureUnits);

            for (var index = 0; index < textures.length; index++) {
                this._setTexture(this._textureUnits[index], textures[index], true);
            }
        }

        /** @hidden */
        public _setAnisotropicLevel(target: number, texture: BaseTexture) {
            var internalTexture = texture.getInternalTexture();

            if (!internalTexture) {
                return;
            }

            var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;
            var value = texture.anisotropicFilteringLevel;

            if (internalTexture.samplingMode !== Engine.TEXTURE_LINEAR_LINEAR_MIPNEAREST
                && internalTexture.samplingMode !== Engine.TEXTURE_LINEAR_LINEAR_MIPLINEAR
                && internalTexture.samplingMode !== Engine.TEXTURE_LINEAR_LINEAR) {
                value = 1; // Forcing the anisotropic to 1 because else webgl will force filters to linear
            }

            if (anisotropicFilterExtension && internalTexture._cachedAnisotropicFilteringLevel !== value) {
                this._setTextureParameterFloat(target, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(value, this._caps.maxAnisotropy), internalTexture);
                internalTexture._cachedAnisotropicFilteringLevel = value;
            }
        }

        private _setTextureParameterFloat(target: number, parameter: number, value: number, texture: InternalTexture): void {
            this._bindTextureDirectly(target, texture, true, true);
            this._gl.texParameterf(target, parameter, value);
        }

        private _setTextureParameterInteger(target: number, parameter: number, value: number, texture?: InternalTexture) {
            if (texture) {
                this._bindTextureDirectly(target, texture, true, true);
            }
            this._gl.texParameteri(target, parameter, value);
        }

        /**
         * Reads pixels from the current frame buffer. Please note that this function can be slow
         * @param x defines the x coordinate of the rectangle where pixels must be read
         * @param y defines the y coordinate of the rectangle where pixels must be read
         * @param width defines the width of the rectangle where pixels must be read
         * @param height defines the height of the rectangle where pixels must be read
         * @returns a Uint8Array containing RGBA colors
         */
        public readPixels(x: number, y: number, width: number, height: number): Uint8Array {
            var data = new Uint8Array(height * width * 4);
            this._gl.readPixels(x, y, width, height, this._gl.RGBA, this._gl.UNSIGNED_BYTE, data);
            return data;
        }

        /**
         * Add an externaly attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        public addExternalData<T>(key: string, data: T): boolean {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return this._externalData.add(key, data);
        }

        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        public getExternalData<T>(key: string): T {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return <T>this._externalData.get(key);
        }

        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        public getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return <T>this._externalData.getOrAddWithFactory(key, factory);
        }

        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        public removeExternalData(key: string): boolean {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }

            return this._externalData.remove(key);
        }

        /**
         * Unbind all vertex attributes from the webGL context
         */
        public unbindAllAttributes() {
            if (this._mustWipeVertexAttributes) {
                this._mustWipeVertexAttributes = false;

                for (var i = 0; i < this._caps.maxVertexAttribs; i++) {
                    this._gl.disableVertexAttribArray(i);
                    this._vertexAttribArraysEnabled[i] = false;
                    this._currentBufferPointers[i].active = false;
                }
                return;
            }

            for (var i = 0, ul = this._vertexAttribArraysEnabled.length; i < ul; i++) {
                if (i >= this._caps.maxVertexAttribs || !this._vertexAttribArraysEnabled[i]) {
                    continue;
                }

                this._gl.disableVertexAttribArray(i);
                this._vertexAttribArraysEnabled[i] = false;
                this._currentBufferPointers[i].active = false;
            }
        }

        /**
         * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
         */
        public releaseEffects() {
            for (var name in this._compiledEffects) {
                this._deleteProgram(this._compiledEffects[name]._program)
            }

            this._compiledEffects = {};
        }

        /**
         * Dispose and release all associated resources
         */
        public dispose(): void {
            this.hideLoadingUI();

            this.stopRenderLoop();

            // Release postProcesses
            while (this.postProcesses.length) {
                this.postProcesses[0].dispose();
            }

            // Empty texture
            if (this._emptyTexture) {
                this._releaseTexture(this._emptyTexture);
                this._emptyTexture = null;
            }
            if (this._emptyCubeTexture) {
                this._releaseTexture(this._emptyCubeTexture);
                this._emptyCubeTexture = null;
            }

            // Rescale PP
            if (this._rescalePostProcess) {
                this._rescalePostProcess.dispose();
            }

            // Release scenes
            while (this.scenes.length) {
                this.scenes[0].dispose();
            }

            // Release audio engine
            if (Engine.audioEngine) {
                Engine.audioEngine.dispose();
            }

            // Release effects
            this.releaseEffects();

            // Unbind
            this.unbindAllAttributes();
            this._boundUniforms = [];

            if (this._dummyFramebuffer) {
                this._gl.deleteFramebuffer(this._dummyFramebuffer);
            }

            //WebVR
            this.disableVR();

            // Events
            if (Tools.IsWindowObjectExist()) {
                window.removeEventListener("blur", this._onBlur);
                window.removeEventListener("focus", this._onFocus);
                window.removeEventListener('vrdisplaypointerrestricted', this._onVRDisplayPointerRestricted);
                window.removeEventListener('vrdisplaypointerunrestricted', this._onVRDisplayPointerUnrestricted);
                if (this._renderingCanvas) {
                    this._renderingCanvas.removeEventListener("focus", this._onCanvasFocus);
                    this._renderingCanvas.removeEventListener("blur", this._onCanvasBlur);
                    this._renderingCanvas.removeEventListener("pointerout", this._onCanvasPointerOut);

                    if (!this._doNotHandleContextLost) {
                        this._renderingCanvas.removeEventListener("webglcontextlost", this._onContextLost);
                        this._renderingCanvas.removeEventListener("webglcontextrestored", this._onContextRestored);
                    }
                }
                document.removeEventListener("fullscreenchange", this._onFullscreenChange);
                document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
                document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
                document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
                document.removeEventListener("pointerlockchange", this._onPointerLockChange);
                document.removeEventListener("mspointerlockchange", this._onPointerLockChange);
                document.removeEventListener("mozpointerlockchange", this._onPointerLockChange);
                document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange);

                if (this._onVrDisplayConnect) {
                    window.removeEventListener('vrdisplayconnect', this._onVrDisplayConnect);
                    if (this._onVrDisplayDisconnect) {
                        window.removeEventListener('vrdisplaydisconnect', this._onVrDisplayDisconnect);
                    }

                    if (this._onVrDisplayPresentChange) {
                        window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
                    }
                    this._onVrDisplayConnect = null;
                    this._onVrDisplayDisconnect = null;
                }
            }

            // Remove from Instances
            var index = Engine.Instances.indexOf(this);

            if (index >= 0) {
                Engine.Instances.splice(index, 1);
            }

            this._workingCanvas = null;
            this._workingContext = null;
            this._currentBufferPointers = [];
            this._renderingCanvas = null;
            this._currentProgram = null;
            this._bindedRenderFunction = null;

            this.onResizeObservable.clear();
            this.onCanvasBlurObservable.clear();
            this.onCanvasFocusObservable.clear();
            this.onCanvasPointerOutObservable.clear();
            this.onBeginFrameObservable.clear();
            this.onEndFrameObservable.clear();

            Effect.ResetCache();

            // Abort active requests
            for (let request of this._activeRequests) {
                request.abort();
            }
        }

        // Loading screen

        /**
         * Display the loading screen
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */
        public displayLoadingUI(): void {
            if (!Tools.IsWindowObjectExist()) {
                return;
            }
            const loadingScreen = this.loadingScreen;
            if (loadingScreen) {
                loadingScreen.displayLoadingUI();
            }
        }

        /**
         * Hide the loading screen
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */        
        public hideLoadingUI(): void {
            if (!Tools.IsWindowObjectExist()) {
                return;
            }
            const loadingScreen = this.loadingScreen;
            if (loadingScreen) {
                loadingScreen.hideLoadingUI();
            }
        }

        /**
         * Gets the current loading screen object
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */
        public get loadingScreen(): ILoadingScreen {
            if (!this._loadingScreen && DefaultLoadingScreen && this._renderingCanvas)
                this._loadingScreen = new DefaultLoadingScreen(this._renderingCanvas)
            return this._loadingScreen;
        }

        /**
         * Sets the current loading screen object
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */
        public set loadingScreen(loadingScreen: ILoadingScreen) {
            this._loadingScreen = loadingScreen;
        }

        /**
         * Sets the current loading screen text
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */        
        public set loadingUIText(text: string) {
            this.loadingScreen.loadingUIText = text;
        }

        /**
         * Sets the current loading screen background color
         * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
         */         
        public set loadingUIBackgroundColor(color: string) {
            this.loadingScreen.loadingUIBackgroundColor = color;
        }

        /**
         * Attach a new callback raised when context lost event is fired
         * @param callback defines the callback to call
         */
        public attachContextLostEvent(callback: ((event: WebGLContextEvent) => void)): void {
            if (this._renderingCanvas) {
                this._renderingCanvas.addEventListener("webglcontextlost", <any>callback, false);
            }
        }

        /**
         * Attach a new callback raised when context restored event is fired
         * @param callback defines the callback to call
         */
        public attachContextRestoredEvent(callback: ((event: WebGLContextEvent) => void)): void {
            if (this._renderingCanvas) {
                this._renderingCanvas.addEventListener("webglcontextrestored", <any>callback, false);
            }
        }

        /**
         * Gets the source code of the vertex shader associated with a specific webGL program
         * @param program defines the program to use
         * @returns a string containing the source code of the vertex shader associated with the program
         */
        public getVertexShaderSource(program: WebGLProgram): Nullable<string> {
            var shaders = this._gl.getAttachedShaders(program);

            if (!shaders) {
                return null;
            }

            return this._gl.getShaderSource(shaders[0]);
        }

        /**
         * Gets the source code of the fragment shader associated with a specific webGL program
         * @param program defines the program to use
         * @returns a string containing the source code of the fragment shader associated with the program
         */        
        public getFragmentShaderSource(program: WebGLProgram): Nullable<string> {
            var shaders = this._gl.getAttachedShaders(program);

            if (!shaders) {
                return null;
            }

            return this._gl.getShaderSource(shaders[1]);
        }

        /**
         * Get the current error code of the webGL context
         * @returns the error code
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
         */
        public getError(): number {
            return this._gl.getError();
        }

        // FPS

        /**
         * Gets the current framerate
         * @returns a number representing the framerate
         */
        public getFps(): number {
            return this._fps;
        }

        /**
         * Gets the time spent between current and previous frame
         * @returns a number representing the delta time in ms
         */
        public getDeltaTime(): number {
            return this._deltaTime;
        }

        private _measureFps(): void {
            this._performanceMonitor.sampleFrame();
            this._fps = this._performanceMonitor.averageFPS;
            this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
        }

        /** @hidden */
        public _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0): ArrayBufferView {
            let gl = this._gl;
            if (!this._dummyFramebuffer) {
                let dummy = gl.createFramebuffer();

                if (!dummy) {
                    throw new Error("Unable to create dummy framebuffer");
                }

                this._dummyFramebuffer = dummy;
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._dummyFramebuffer);

            if (faceIndex > -1) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, level);
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, level);
            }

            let readType = (texture.type !== undefined) ? this._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;
            let buffer: ArrayBufferView;

            switch (readType) {
                case gl.UNSIGNED_BYTE:
                    buffer = new Uint8Array(4 * width * height);
                    readType = gl.UNSIGNED_BYTE;
                    break;
                default:
                    buffer = new Float32Array(4 * width * height);
                    readType = gl.FLOAT;
                    break;
            }

            gl.readPixels(0, 0, width, height, gl.RGBA, readType, <DataView>buffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._currentFramebuffer);

            return buffer;
        }

        private _canRenderToFloatFramebuffer(): boolean {
            if (this._webGLVersion > 1) {
                return this._caps.colorBufferFloat;
            }
            return this._canRenderToFramebuffer(Engine.TEXTURETYPE_FLOAT);
        }

        private _canRenderToHalfFloatFramebuffer(): boolean {
            if (this._webGLVersion > 1) {
                return this._caps.colorBufferFloat;
            }
            return this._canRenderToFramebuffer(Engine.TEXTURETYPE_HALF_FLOAT);
        }

        // Thank you : http://stackoverflow.com/questions/28827511/webgl-ios-render-to-floating-point-texture
        private _canRenderToFramebuffer(type: number): boolean {
            let gl = this._gl;

            //clear existing errors
            while (gl.getError() !== gl.NO_ERROR) { }

            let successful = true;

            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(type), 1, 1, 0, gl.RGBA, this._getWebGLTextureType(type), null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            let fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

            successful = successful && (status === gl.FRAMEBUFFER_COMPLETE);
            successful = successful && (gl.getError() === gl.NO_ERROR);

            //try render by clearing frame buffer's color buffer
            if (successful) {
                gl.clear(gl.COLOR_BUFFER_BIT);
                successful = successful && (gl.getError() === gl.NO_ERROR);
            }

            //try reading from frame to ensure render occurs (just creating the FBO is not sufficient to determine if rendering is supported)
            if (successful) {
                //in practice it's sufficient to just read from the backbuffer rather than handle potentially issues reading from the texture
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                let readFormat = gl.RGBA;
                let readType = gl.UNSIGNED_BYTE;
                let buffer = new Uint8Array(4);
                gl.readPixels(0, 0, 1, 1, readFormat, readType, buffer);
                successful = successful && (gl.getError() === gl.NO_ERROR);
            }

            //clean up
            gl.deleteTexture(texture);
            gl.deleteFramebuffer(fb);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            //clear accumulated errors
            while (!successful && (gl.getError() !== gl.NO_ERROR)) { }

            return successful;
        }

        /** @hidden */
        public _getWebGLTextureType(type: number): number {
            if (this._webGLVersion === 1) {
                switch (type) {
                    case Engine.TEXTURETYPE_FLOAT:
                        return this._gl.FLOAT;
                    case Engine.TEXTURETYPE_HALF_FLOAT:
                        return this._gl.HALF_FLOAT_OES;
                    case Engine.TEXTURETYPE_UNSIGNED_BYTE:
                        return this._gl.UNSIGNED_BYTE;
                }
                return this._gl.UNSIGNED_BYTE;
            }

            switch (type) {
                case Engine.TEXTURETYPE_BYTE:
                    return this._gl.BYTE;
                case Engine.TEXTURETYPE_UNSIGNED_BYTE:
                    return this._gl.UNSIGNED_BYTE;
                case Engine.TEXTURETYPE_SHORT:
                    return this._gl.SHORT;
                case Engine.TEXTURETYPE_UNSIGNED_SHORT:
                    return this._gl.UNSIGNED_SHORT;
                case Engine.TEXTURETYPE_INT:
                    return this._gl.INT;
                case Engine.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                    return this._gl.UNSIGNED_INT;
                case Engine.TEXTURETYPE_FLOAT:
                    return this._gl.FLOAT;
                case Engine.TEXTURETYPE_HALF_FLOAT:
                    return this._gl.HALF_FLOAT;
                case Engine.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                    return this._gl.UNSIGNED_SHORT_4_4_4_4;
                case Engine.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                    return this._gl.UNSIGNED_SHORT_5_5_5_1;
                case Engine.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                    return this._gl.UNSIGNED_SHORT_5_6_5;
                case Engine.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                    return this._gl.UNSIGNED_INT_2_10_10_10_REV;
                case Engine.TEXTURETYPE_UNSIGNED_INT_24_8:
                    return this._gl.UNSIGNED_INT_24_8;
                case Engine.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                    return this._gl.UNSIGNED_INT_10F_11F_11F_REV;
                case Engine.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                    return this._gl.UNSIGNED_INT_5_9_9_9_REV;
                case Engine.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV:
                    return this._gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
            }

            return this._gl.UNSIGNED_BYTE;
        };

        private _getInternalFormat(format: number): number {
            var internalFormat = this._gl.RGBA;

            switch (format) {
                case Engine.TEXTUREFORMAT_ALPHA:
                    internalFormat = this._gl.ALPHA;
                    break;
                case Engine.TEXTUREFORMAT_LUMINANCE:
                    internalFormat = this._gl.LUMINANCE;
                    break;
                case Engine.TEXTUREFORMAT_LUMINANCE_ALPHA:
                    internalFormat = this._gl.LUMINANCE_ALPHA;
                    break;
                case Engine.TEXTUREFORMAT_RED:
                    internalFormat = this._gl.RED;
                    break;
                case Engine.TEXTUREFORMAT_RG:
                    internalFormat = this._gl.RG;
                    break;
                case Engine.TEXTUREFORMAT_RGB:
                    internalFormat = this._gl.RGB;
                    break;
                case Engine.TEXTUREFORMAT_RGBA:
                    internalFormat = this._gl.RGBA;
                    break;
            }

            if (this._webGLVersion > 1) {
                switch (format) {
                    case Engine.TEXTUREFORMAT_RED_INTEGER:
                        internalFormat = this._gl.RED_INTEGER;
                        break;
                    case Engine.TEXTUREFORMAT_RG_INTEGER:
                        internalFormat = this._gl.RG_INTEGER;
                        break;
                    case Engine.TEXTUREFORMAT_RGB_INTEGER:
                        internalFormat = this._gl.RGB_INTEGER;
                        break;
                    case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                        internalFormat = this._gl.RGBA_INTEGER;
                        break;
                }
            }

            return internalFormat;
        }        

        /** @hidden */
        public _getRGBABufferInternalSizedFormat(type: number, format?: number): number {
            if (this._webGLVersion === 1) {
                if (format !== undefined) {
                    switch(format) {
                        case Engine.TEXTUREFORMAT_ALPHA:
                            return this._gl.ALPHA; 
                        case Engine.TEXTUREFORMAT_LUMINANCE:
                            return this._gl.LUMINANCE;
                        case Engine.TEXTUREFORMAT_LUMINANCE_ALPHA:
                            return this._gl.LUMINANCE_ALPHA;
                    }                    
                }
                return this._gl.RGBA;
            }

            switch (type) {
                case Engine.TEXTURETYPE_BYTE:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED:
                            return this._gl.R8_SNORM;
                        case Engine.TEXTUREFORMAT_RG:
                            return this._gl.RG8_SNORM;
                        case Engine.TEXTUREFORMAT_RGB:
                            return this._gl.RGB8_SNORM;
                        case Engine.TEXTUREFORMAT_RED_INTEGER:
                            return this._gl.R8I;
                        case Engine.TEXTUREFORMAT_RG_INTEGER:
                            return this._gl.RG8I;
                        case Engine.TEXTUREFORMAT_RGB_INTEGER:
                            return this._gl.RGB8I;
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGBA8I;
                        default:
                            return this._gl.RGBA8_SNORM;
                    }
                case Engine.TEXTURETYPE_UNSIGNED_BYTE:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED:
                            return this._gl.R8;
                        case Engine.TEXTUREFORMAT_RG:
                            return this._gl.RG8;
                        case Engine.TEXTUREFORMAT_RGB:
                            return this._gl.RGB8; // By default. Other possibilities are RGB565, SRGB8.
                        case Engine.TEXTUREFORMAT_RGBA:
                            return this._gl.RGBA8; // By default. Other possibilities are RGB5_A1, RGBA4, SRGB8_ALPHA8.
                        case Engine.TEXTUREFORMAT_RED_INTEGER:
                            return this._gl.R8UI;
                        case Engine.TEXTUREFORMAT_RG_INTEGER:
                            return this._gl.RG8UI;
                        case Engine.TEXTUREFORMAT_RGB_INTEGER:
                            return this._gl.RGB8UI;
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGBA8UI;
                        default:
                            return this._gl.RGBA8;
                        }
                case Engine.TEXTURETYPE_SHORT:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED_INTEGER:
                            return this._gl.R16I;
                        case Engine.TEXTUREFORMAT_RG_INTEGER:
                            return this._gl.RG16I;
                        case Engine.TEXTUREFORMAT_RGB_INTEGER:
                            return this._gl.RGB16I;
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGBA16I;
                        default:
                            return this._gl.RGBA16I;
                    }
                case Engine.TEXTURETYPE_UNSIGNED_SHORT:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED_INTEGER:
                            return this._gl.R16UI;
                        case Engine.TEXTUREFORMAT_RG_INTEGER:
                            return this._gl.RG16UI;
                        case Engine.TEXTUREFORMAT_RGB_INTEGER:
                            return this._gl.RGB16UI;
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGBA16UI;
                        default:
                            return this._gl.RGBA16UI;
                    }
                case Engine.TEXTURETYPE_INT:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED_INTEGER:
                            return this._gl.R32I;
                        case Engine.TEXTUREFORMAT_RG_INTEGER:
                            return this._gl.RG32I;
                        case Engine.TEXTUREFORMAT_RGB_INTEGER:
                            return this._gl.RGB32I;
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGBA32I;
                        default:
                            return this._gl.RGBA32I;
                    }
                case Engine.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED_INTEGER:
                            return this._gl.R32UI;
                        case Engine.TEXTUREFORMAT_RG_INTEGER:
                            return this._gl.RG32UI;
                        case Engine.TEXTUREFORMAT_RGB_INTEGER:
                            return this._gl.RGB32UI;
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGBA32UI;
                        default:
                            return this._gl.RGBA32UI;
                    }
                case Engine.TEXTURETYPE_FLOAT:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED:
                            return this._gl.R32F; // By default. Other possibility is R16F.
                        case Engine.TEXTUREFORMAT_RG:
                            return this._gl.RG32F; // By default. Other possibility is RG16F.
                        case Engine.TEXTUREFORMAT_RGB:
                            return this._gl.RGB32F; // By default. Other possibilities are RGB16F, R11F_G11F_B10F, RGB9_E5.
                        case Engine.TEXTUREFORMAT_RGBA:
                            return this._gl.RGBA32F; // By default. Other possibility is RGBA16F.
                        default:
                            return this._gl.RGBA32F;
                    }
                case Engine.TEXTURETYPE_HALF_FLOAT:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RED:
                            return this._gl.R16F;
                        case Engine.TEXTUREFORMAT_RG:
                            return this._gl.RG16F;
                        case Engine.TEXTUREFORMAT_RGB:
                            return this._gl.RGB16F; // By default. Other possibilities are R11F_G11F_B10F, RGB9_E5.
                        case Engine.TEXTUREFORMAT_RGBA:
                            return this._gl.RGBA16F;
                        default:
                            return this._gl.RGBA16F;
                    }
                case Engine.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                    return this._gl.RGB565;
                case Engine.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                    return this._gl.R11F_G11F_B10F;
                case Engine.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                    return this._gl.RGB9_E5;
                case Engine.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                    return this._gl.RGBA4;
                case Engine.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                    return this._gl.RGB5_A1;
                case Engine.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                    switch (format) {
                        case Engine.TEXTUREFORMAT_RGBA:
                            return this._gl.RGB10_A2; // By default. Other possibility is RGB5_A1.
                        case Engine.TEXTUREFORMAT_RGBA_INTEGER:
                            return this._gl.RGB10_A2UI;
                        default:
                            return this._gl.RGB10_A2;
                    }
            }

            return this._gl.RGBA8;
        };

        /** @hidden */
        public _getRGBAMultiSampleBufferFormat(type: number): number {
            if (type === Engine.TEXTURETYPE_FLOAT) {
                return this._gl.RGBA32F;
            }
            else if (type === Engine.TEXTURETYPE_HALF_FLOAT) {
                return this._gl.RGBA16F;
            }

            return this._gl.RGBA8;
        };

        /** @hidden */
        public _loadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, database?: Database, useArrayBuffer?: boolean, onError?: (request?: XMLHttpRequest, exception?: any) => void): IFileRequest {
            let request = Tools.LoadFile(url, onSuccess, onProgress, database, useArrayBuffer, onError);
            this._activeRequests.push(request);
            request.onCompleteObservable.add(request => {
                this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
            });
            return request;
        }

        /** @hidden */
        public _loadFileAsync(url: string, database?: Database, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
            return new Promise((resolve, reject) => {
                this._loadFile(url, (data) => {
                    resolve(data);
                }, undefined, database, useArrayBuffer, (request, exception) => {
                    reject(exception);
                })
            });
        }

        private _partialLoadFile(url: string, index: number, loadedFiles: (string | ArrayBuffer)[], scene: Nullable<Scene>, onfinish: (files: (string | ArrayBuffer)[]) => void, onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null): void {
            var onload = (data: string | ArrayBuffer) => {
                loadedFiles[index] = data;
                (<any>loadedFiles)._internalCount++;

                if ((<any>loadedFiles)._internalCount === 6) {
                    onfinish(loadedFiles);
                }
            };

            const onerror = (request?: XMLHttpRequest, exception?: any) => {
                if (onErrorCallBack && request) {
                    onErrorCallBack(request.status + " " + request.statusText, exception);
                }
            };

            this._loadFile(url, onload, undefined, undefined, true, onerror);
        }

        private _cascadeLoadFiles(scene: Nullable<Scene>, onfinish: (images: (string | ArrayBuffer)[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void> = null): void {
            var loadedFiles: (string | ArrayBuffer)[] = [];
            (<any>loadedFiles)._internalCount = 0;

            for (let index = 0; index < 6; index++) {
                this._partialLoadFile(files[index], index, loadedFiles, scene, onfinish, onError);
            }
        }

        // Statics

        /**
         * Gets a boolean indicating if the engine can be instanciated (ie. if a webGL context can be found)
         * @returns true if the engine can be created
         * @ignorenaming
         */
        public static isSupported(): boolean {
            try {
                var tempcanvas = document.createElement("canvas");
                var gl = tempcanvas.getContext("webgl") || tempcanvas.getContext("experimental-webgl");

                return gl != null && !!window.WebGLRenderingContext;
            } catch (e) {
                return false;
            }
        }
    }
}

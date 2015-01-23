declare module BABYLON {
    class _DepthCullingState {
        private _isDepthTestDirty;
        private _isDepthMaskDirty;
        private _isDepthFuncDirty;
        private _isCullFaceDirty;
        private _isCullDirty;
        private _depthTest;
        private _depthMask;
        private _depthFunc;
        private _cull;
        private _cullFace;
        public isDirty : boolean;
        public cullFace : number;
        public cull : boolean;
        public depthFunc : number;
        public depthMask : boolean;
        public depthTest : boolean;
        public reset(): void;
        public apply(gl: WebGLRenderingContext): void;
    }
    class _AlphaState {
        private _isAlphaBlendDirty;
        private _isBlendFunctionParametersDirty;
        private _alphaBlend;
        private _blendFunctionParameters;
        public isDirty : boolean;
        public alphaBlend : boolean;
        public setAlphaBlendFunctionParameters(value0: number, value1: number, value2: number, value3: number): void;
        public reset(): void;
        public apply(gl: WebGLRenderingContext): void;
    }
    class EngineCapabilities {
        public maxTexturesImageUnits: number;
        public maxTextureSize: number;
        public maxCubemapTextureSize: number;
        public maxRenderTextureSize: number;
        public standardDerivatives: boolean;
        public s3tc: any;
        public textureFloat: boolean;
        public textureAnisotropicFilterExtension: any;
        public maxAnisotropy: number;
        public instancedArrays: any;
        public uintIndices: boolean;
    }
    /**
    * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio.
    */
    class Engine {
        private static _ALPHA_DISABLE;
        private static _ALPHA_ADD;
        private static _ALPHA_COMBINE;
        private static _DELAYLOADSTATE_NONE;
        private static _DELAYLOADSTATE_LOADED;
        private static _DELAYLOADSTATE_LOADING;
        private static _DELAYLOADSTATE_NOTLOADED;
        private static _TEXTUREFORMAT_ALPHA;
        private static _TEXTUREFORMAT_LUMINANCE;
        private static _TEXTUREFORMAT_LUMINANCE_ALPHA;
        private static _TEXTUREFORMAT_RGB;
        private static _TEXTUREFORMAT_RGBA;
        private static _TEXTURETYPE_UNSIGNED_INT;
        private static _TEXTURETYPE_FLOAT;
        static ALPHA_DISABLE : number;
        static ALPHA_ADD : number;
        static ALPHA_COMBINE : number;
        static DELAYLOADSTATE_NONE : number;
        static DELAYLOADSTATE_LOADED : number;
        static DELAYLOADSTATE_LOADING : number;
        static DELAYLOADSTATE_NOTLOADED : number;
        static TEXTUREFORMAT_ALPHA : number;
        static TEXTUREFORMAT_LUMINANCE : number;
        static TEXTUREFORMAT_LUMINANCE_ALPHA : number;
        static TEXTUREFORMAT_RGB : number;
        static TEXTUREFORMAT_RGBA : number;
        static TEXTURETYPE_UNSIGNED_INT : number;
        static TEXTURETYPE_FLOAT : number;
        static Version : string;
        static Epsilon: number;
        static CollisionsEpsilon: number;
        static ShadersRepository: string;
        public isFullscreen: boolean;
        public isPointerLock: boolean;
        public cullBackFaces: boolean;
        public renderEvenInBackground: boolean;
        public scenes: Scene[];
        public _gl: WebGLRenderingContext;
        private _renderingCanvas;
        private _windowIsBackground;
        private _audioEngine;
        private _onBlur;
        private _onFocus;
        private _onFullscreenChange;
        private _onPointerLockChange;
        private _hardwareScalingLevel;
        private _caps;
        private _pointerLockRequested;
        private _alphaTest;
        private _resizeLoadingUI;
        private _loadingDiv;
        private _loadingTextDiv;
        private _loadingDivBackgroundColor;
        private _drawCalls;
        private _glVersion;
        private _glRenderer;
        private _glVendor;
        private _renderingQueueLaunched;
        private _activeRenderLoops;
        private fpsRange;
        private previousFramesDuration;
        private fps;
        private deltaTime;
        private _depthCullingState;
        private _alphaState;
        private _alphaMode;
        private _loadedTexturesCache;
        public _activeTexturesCache: BaseTexture[];
        private _currentEffect;
        private _compiledEffects;
        private _vertexAttribArrays;
        private _cachedViewport;
        private _cachedVertexBuffers;
        private _cachedIndexBuffer;
        private _cachedEffectForVertexBuffers;
        private _currentRenderTarget;
        private _canvasClientRect;
        private _uintIndicesCurrentlySet;
        private _workingCanvas;
        private _workingContext;
        /**
        * @constructor
        * @param {HTMLCanvasElement} canvas - the canvas to be used for rendering
        * @param {boolean} [antialias] - enable antialias
        * @param options - further options to be sent to the getContext function
        */
        constructor(canvas: HTMLCanvasElement, antialias?: boolean, options?: any);
        public getGlInfo(): {
            vendor: string;
            renderer: string;
            version: string;
        };
        public getAudioEngine(): AudioEngine;
        public getAspectRatio(camera: Camera): number;
        public getRenderWidth(): number;
        public getRenderHeight(): number;
        public getRenderingCanvas(): HTMLCanvasElement;
        public getRenderingCanvasClientRect(): ClientRect;
        public setHardwareScalingLevel(level: number): void;
        public getHardwareScalingLevel(): number;
        public getLoadedTexturesCache(): WebGLTexture[];
        public getCaps(): EngineCapabilities;
        public drawCalls : number;
        public resetDrawCalls(): void;
        public setDepthFunctionToGreater(): void;
        public setDepthFunctionToGreaterOrEqual(): void;
        public setDepthFunctionToLess(): void;
        public setDepthFunctionToLessOrEqual(): void;
        /**
        * stop executing a render loop function and remove it from the execution array
        * @param {Function} [renderFunction] the function to be removed. If not provided all functions will be removed.
        */
        public stopRenderLoop(renderFunction?: () => void): void;
        public _renderLoop(): void;
        /**
        * Register and execute a render loop. The engine can have more than one render function.
        * @param {Function} renderFunction - the function to continuesly execute starting the next render loop.
        * @example
        * engine.runRenderLoop(function () {
        *      scene.render()
        * })
        */
        public runRenderLoop(renderFunction: () => void): void;
        /**
        * Toggle full screen mode.
        * @param {boolean} requestPointerLock - should a pointer lock be requested from the user
        */
        public switchFullscreen(requestPointerLock: boolean): void;
        public clear(color: any, backBuffer: boolean, depthStencil: boolean): void;
        /**
        * Set the WebGL's viewport
        * @param {BABYLON.Viewport} viewport - the viewport element to be used.
        * @param {number} [requiredWidth] - the width required for rendering. If not provided the rendering canvas' width is used.
        * @param {number} [requiredHeight] - the height required for rendering. If not provided the rendering canvas' height is used.
        */
        public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void;
        public setDirectViewport(x: number, y: number, width: number, height: number): void;
        public beginFrame(): void;
        public endFrame(): void;
        /**
        * resize the view according to the canvas' size.
        * @example
        *   window.addEventListener("resize", function () {
        *      engine.resize();
        *   });
        */
        public resize(): void;
        /**
        * force a specific size of the canvas
        * @param {number} width - the new canvas' width
        * @param {number} height - the new canvas' height
        */
        public setSize(width: number, height: number): void;
        public bindFramebuffer(texture: WebGLTexture): void;
        public unBindFramebuffer(texture: WebGLTexture): void;
        public flushFramebuffer(): void;
        public restoreDefaultFramebuffer(): void;
        private _resetVertexBufferBinding();
        public createVertexBuffer(vertices: number[]): WebGLBuffer;
        public createDynamicVertexBuffer(capacity: number): WebGLBuffer;
        public updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: any, offset?: number): void;
        private _resetIndexBufferBinding();
        public createIndexBuffer(indices: number[]): WebGLBuffer;
        public bindBuffers(vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void;
        public bindMultiBuffers(vertexBuffers: VertexBuffer[], indexBuffer: WebGLBuffer, effect: Effect): void;
        public _releaseBuffer(buffer: WebGLBuffer): boolean;
        public createInstancesBuffer(capacity: number): WebGLBuffer;
        public deleteInstancesBuffer(buffer: WebGLBuffer): void;
        public updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[]): void;
        public unBindInstancesBuffer(instancesBuffer: WebGLBuffer, offsetLocations: number[]): void;
        public applyStates(): void;
        public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void;
        public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void;
        public _releaseEffect(effect: Effect): void;
        public createEffect(baseName: any, attributesNames: string[], uniformsNames: string[], samplers: string[], defines: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect;
        public createEffectForParticles(fragmentName: string, uniformsNames?: string[], samplers?: string[], defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect;
        public createShaderProgram(vertexCode: string, fragmentCode: string, defines: string): WebGLProgram;
        public getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[];
        public getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[];
        public enableEffect(effect: Effect): void;
        public setArray(uniform: WebGLUniformLocation, array: number[]): void;
        public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void;
        public setMatrix(uniform: WebGLUniformLocation, matrix: Matrix): void;
        public setFloat(uniform: WebGLUniformLocation, value: number): void;
        public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void;
        public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void;
        public setBool(uniform: WebGLUniformLocation, bool: number): void;
        public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void;
        public setColor3(uniform: WebGLUniformLocation, color3: Color3): void;
        public setColor4(uniform: WebGLUniformLocation, color3: Color3, alpha: number): void;
        public setState(culling: boolean, force?: boolean): void;
        public setDepthBuffer(enable: boolean): void;
        public getDepthWrite(): boolean;
        public setDepthWrite(enable: boolean): void;
        public setColorWrite(enable: boolean): void;
        public setAlphaMode(mode: number): void;
        public getAlphaMode(): number;
        public setAlphaTesting(enable: boolean): void;
        public getAlphaTesting(): boolean;
        public wipeCaches(): void;
        public setSamplingMode(texture: WebGLTexture, samplingMode: number): void;
        public createTexture(url: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode?: number, onLoad?: () => void, onError?: () => void, buffer?: any): WebGLTexture;
        public createRawTexture(data: ArrayBufferView, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number): WebGLTexture;
        public createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): WebGLTexture;
        public updateDynamicTexture(texture: WebGLTexture, canvas: HTMLCanvasElement, invertY: boolean): void;
        public updateVideoTexture(texture: WebGLTexture, video: HTMLVideoElement, invertY: boolean): void;
        public createRenderTargetTexture(size: any, options: any): WebGLTexture;
        public createCubeTexture(rootUrl: string, scene: Scene, extensions: string[], noMipmap?: boolean): WebGLTexture;
        public _releaseTexture(texture: WebGLTexture): void;
        public bindSamplers(effect: Effect): void;
        public _bindTexture(channel: number, texture: WebGLTexture): void;
        public setTextureFromPostProcess(channel: number, postProcess: PostProcess): void;
        public setTexture(channel: number, texture: BaseTexture): void;
        public _setAnisotropicLevel(key: number, texture: BaseTexture): void;
        public readPixels(x: number, y: number, width: number, height: number): Uint8Array;
        public dispose(): void;
        public displayLoadingUI(): void;
        public loadingUIText : string;
        public loadingUIBackgroundColor : string;
        public hideLoadingUI(): void;
        public getFps(): number;
        public getDeltaTime(): number;
        private _measureFps();
        static isSupported(): boolean;
    }
}
interface Window {
    mozIndexedDB(func: any): any;
    webkitIndexedDB(func: any): any;
    IDBTransaction(func: any): any;
    webkitIDBTransaction(func: any): any;
    msIDBTransaction(func: any): any;
    IDBKeyRange(func: any): any;
    webkitIDBKeyRange(func: any): any;
    msIDBKeyRange(func: any): any;
    URL: HTMLURL;
    webkitURL: HTMLURL;
    webkitRequestAnimationFrame(func: any): any;
    mozRequestAnimationFrame(func: any): any;
    oRequestAnimationFrame(func: any): any;
    WebGLRenderingContext: WebGLRenderingContext;
    MSGesture: MSGesture;
}
interface HTMLURL {
    createObjectURL(param1: any, param2?: any): any;
}
interface Document {
    exitFullscreen(): void;
    webkitCancelFullScreen(): void;
    mozCancelFullScreen(): void;
    msCancelFullScreen(): void;
    webkitIsFullScreen: boolean;
    mozFullScreen: boolean;
    msIsFullScreen: boolean;
    fullscreen: boolean;
    mozPointerLockElement: HTMLElement;
    msPointerLockElement: HTMLElement;
    webkitPointerLockElement: HTMLElement;
    pointerLockElement: HTMLElement;
}
interface HTMLCanvasElement {
    requestPointerLock(): void;
    msRequestPointerLock(): void;
    mozRequestPointerLock(): void;
    webkitRequestPointerLock(): void;
}
interface CanvasRenderingContext2D {
    imageSmoothingEnabled: boolean;
    mozImageSmoothingEnabled: boolean;
    oImageSmoothingEnabled: boolean;
    webkitImageSmoothingEnabled: boolean;
}
interface WebGLTexture {
    isReady: boolean;
    isCube: boolean;
    url: string;
    noMipmap: boolean;
    samplingMode: number;
    references: number;
    generateMipMaps: boolean;
    _size: number;
    _baseWidth: number;
    _baseHeight: number;
    _width: number;
    _height: number;
    _workingCanvas: HTMLCanvasElement;
    _workingContext: CanvasRenderingContext2D;
    _framebuffer: WebGLFramebuffer;
    _depthBuffer: WebGLRenderbuffer;
    _cachedCoordinatesMode: number;
    _cachedWrapU: number;
    _cachedWrapV: number;
}
interface WebGLBuffer {
    references: number;
    capacity: number;
    is32Bits: boolean;
}
interface MouseEvent {
    movementX: number;
    movementY: number;
    mozMovementX: number;
    mozMovementY: number;
    webkitMovementX: number;
    webkitMovementY: number;
    msMovementX: number;
    msMovementY: number;
}
interface MSStyleCSSProperties {
    webkitTransform: string;
    webkitTransition: string;
}
interface Navigator {
    getVRDevices: () => any;
    mozGetVRDevices: (any: any) => any;
    isCocoonJS: boolean;
}
declare module BABYLON {
    /**
    * Node is the basic class for all scene objects (Mesh, Light Camera).
    */
    class Node {
        public parent: Node;
        public name: string;
        public id: string;
        public state: string;
        public animations: Animation[];
        public onReady: (node: Node) => void;
        private _childrenFlag;
        private _isEnabled;
        private _isReady;
        public _currentRenderId: number;
        public _waitingParentId: string;
        private _scene;
        public _cache: any;
        /**
        * @constructor
        * @param {string} name - the name and id to be given to this node
        * @param {BABYLON.Scene} the scene this node will be added to
        */
        constructor(name: string, scene: Scene);
        public getScene(): Scene;
        public getEngine(): Engine;
        public getWorldMatrix(): Matrix;
        public _initCache(): void;
        public updateCache(force?: boolean): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _isSynchronized(): boolean;
        public isSynchronizedWithParent(): boolean;
        public isSynchronized(updateCache?: boolean): boolean;
        public hasNewParent(update?: boolean): boolean;
        /**
        * Is this node ready to be used/rendered
        * @return {boolean} is it ready
        */
        public isReady(): boolean;
        /**
        * Is this node enabled.
        * If the node has a parent and is enabled, the parent will be inspected as well.
        * @return {boolean} whether this node (and its parent) is enabled.
        * @see setEnabled
        */
        public isEnabled(): boolean;
        /**
        * Set the enabled state of this node.
        * @param {boolean} value - the new enabled state
        * @see isEnabled
        */
        public setEnabled(value: boolean): void;
        /**
        * Is this node a descendant of the given node.
        * The function will iterate up the hierarchy until the ancestor was found or no more parents defined.
        * @param {BABYLON.Node} ancestor - The parent node to inspect
        * @see parent
        */
        public isDescendantOf(ancestor: Node): boolean;
        public _getDescendants(list: Node[], results: Node[]): void;
        /**
        * Will return all nodes that have this node as parent.
        * @return {BABYLON.Node[]} all children nodes of all types.
        */
        public getDescendants(): Node[];
        public _setReady(state: boolean): void;
    }
}
declare module BABYLON {
    interface IDisposable {
        dispose(): void;
    }
    /**
    * Represents a scene to be rendered by the engine.
    * @see http://doc.babylonjs.com/page.php?p=21911
    */
    class Scene {
        static FOGMODE_NONE: number;
        static FOGMODE_EXP: number;
        static FOGMODE_EXP2: number;
        static FOGMODE_LINEAR: number;
        static MinDeltaTime: number;
        static MaxDeltaTime: number;
        public autoClear: boolean;
        public clearColor: any;
        public ambientColor: Color3;
        /**
        * A function to be executed before rendering this scene
        * @type {Function}
        */
        public beforeRender: () => void;
        /**
        * A function to be executed after rendering this scene
        * @type {Function}
        */
        public afterRender: () => void;
        /**
        * A function to be executed when this scene is disposed.
        * @type {Function}
        */
        public onDispose: () => void;
        public beforeCameraRender: (camera: Camera) => void;
        public afterCameraRender: (camera: Camera) => void;
        public forceWireframe: boolean;
        public forcePointsCloud: boolean;
        public forceShowBoundingBoxes: boolean;
        public clipPlane: Plane;
        public animationsEnabled: boolean;
        private _onPointerMove;
        private _onPointerDown;
        public onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        public cameraToUseForPointers: Camera;
        private _pointerX;
        private _pointerY;
        private _meshUnderPointer;
        private _onKeyDown;
        private _onKeyUp;
        /**
        * is fog enabled on this scene.
        * @type {boolean}
        */
        public fogEnabled: boolean;
        public fogMode: number;
        public fogColor: Color3;
        public fogDensity: number;
        public fogStart: number;
        public fogEnd: number;
        /**
        * is shadow enabled on this scene.
        * @type {boolean}
        */
        public shadowsEnabled: boolean;
        /**
        * is light enabled on this scene.
        * @type {boolean}
        */
        public lightsEnabled: boolean;
        /**
        * All of the lights added to this scene.
        * @see BABYLON.Light
        * @type {BABYLON.Light[]}
        */
        public lights: Light[];
        /**
        * All of the cameras added to this scene.
        * @see BABYLON.Camera
        * @type {BABYLON.Camera[]}
        */
        public cameras: Camera[];
        public activeCameras: Camera[];
        public activeCamera: Camera;
        /**
        * All of the (abstract) meshes added to this scene.
        * @see BABYLON.AbstractMesh
        * @type {BABYLON.AbstractMesh[]}
        */
        public meshes: AbstractMesh[];
        private _geometries;
        public materials: Material[];
        public multiMaterials: MultiMaterial[];
        public defaultMaterial: StandardMaterial;
        public texturesEnabled: boolean;
        public textures: BaseTexture[];
        public particlesEnabled: boolean;
        public particleSystems: ParticleSystem[];
        public spriteManagers: SpriteManager[];
        public layers: Layer[];
        public skeletonsEnabled: boolean;
        public skeletons: Skeleton[];
        public lensFlaresEnabled: boolean;
        public lensFlareSystems: LensFlareSystem[];
        public collisionsEnabled: boolean;
        public gravity: Vector3;
        public postProcessesEnabled: boolean;
        public postProcessManager: PostProcessManager;
        public postProcessRenderPipelineManager: PostProcessRenderPipelineManager;
        public renderTargetsEnabled: boolean;
        public customRenderTargets: RenderTargetTexture[];
        public useDelayedTextureLoading: boolean;
        public importedMeshesFiles: String[];
        public database: any;
        /**
        * This scene's action manager
        * @type {BABYLON.ActionManager}
        */
        public actionManager: ActionManager;
        public _actionManagers: ActionManager[];
        private _meshesForIntersections;
        public proceduralTexturesEnabled: boolean;
        public _proceduralTextures: ProceduralTexture[];
        public mainSoundTrack: SoundTrack;
        public soundTracks: SoundTrack[];
        private _engine;
        private _totalVertices;
        public _activeVertices: number;
        public _activeParticles: number;
        private _lastFrameDuration;
        private _evaluateActiveMeshesDuration;
        private _renderTargetsDuration;
        public _particlesDuration: number;
        private _renderDuration;
        public _spritesDuration: number;
        private _animationRatio;
        private _animationStartDate;
        public _cachedMaterial: Material;
        private _renderId;
        private _executeWhenReadyTimeoutId;
        public _toBeDisposed: SmartArray<IDisposable>;
        private _onReadyCallbacks;
        private _pendingData;
        private _onBeforeRenderCallbacks;
        private _onAfterRenderCallbacks;
        private _activeMeshes;
        private _processedMaterials;
        private _renderTargets;
        public _activeParticleSystems: SmartArray<ParticleSystem>;
        private _activeSkeletons;
        private _activeBones;
        private _renderingManager;
        private _physicsEngine;
        public _activeAnimatables: Animatable[];
        private _transformMatrix;
        private _pickWithRayInverseMatrix;
        private _scaledPosition;
        private _scaledVelocity;
        private _boundingBoxRenderer;
        private _outlineRenderer;
        private _viewMatrix;
        private _projectionMatrix;
        private _frustumPlanes;
        private _selectionOctree;
        private _pointerOverMesh;
        private _debugLayer;
        private _depthRenderer;
        /**
        * @constructor
        * @param {BABYLON.Engine} engine - the engine to be used to render this scene.
        */
        constructor(engine: Engine);
        public debugLayer : DebugLayer;
        /**
        * The mesh that is currently under the pointer.
        * @return {BABYLON.AbstractMesh} mesh under the pointer/mouse cursor or null if none.
        */
        public meshUnderPointer : AbstractMesh;
        /**
        * Current on-screen X position of the pointer
        * @return {number} X position of the pointer
        */
        public pointerX : number;
        /**
        * Current on-screen Y position of the pointer
        * @return {number} Y position of the pointer
        */
        public pointerY : number;
        public getCachedMaterial(): Material;
        public getBoundingBoxRenderer(): BoundingBoxRenderer;
        public getOutlineRenderer(): OutlineRenderer;
        public getEngine(): Engine;
        public getTotalVertices(): number;
        public getActiveVertices(): number;
        public getActiveParticles(): number;
        public getActiveBones(): number;
        public getLastFrameDuration(): number;
        public getEvaluateActiveMeshesDuration(): number;
        public getActiveMeshes(): SmartArray<Mesh>;
        public getRenderTargetsDuration(): number;
        public getRenderDuration(): number;
        public getParticlesDuration(): number;
        public getSpritesDuration(): number;
        public getAnimationRatio(): number;
        public getRenderId(): number;
        private _updatePointerPosition(evt);
        public attachControl(): void;
        public detachControl(): void;
        public isReady(): boolean;
        public resetCachedMaterial(): void;
        public registerBeforeRender(func: () => void): void;
        public unregisterBeforeRender(func: () => void): void;
        public registerAfterRender(func: () => void): void;
        public unregisterAfterRender(func: () => void): void;
        public _addPendingData(data: any): void;
        public _removePendingData(data: any): void;
        public getWaitingItemsCount(): number;
        /**
        * Registers a function to be executed when the scene is ready.
        * @param {Function} func - the function to be executed.
        */
        public executeWhenReady(func: () => void): void;
        public _checkIsReady(): void;
        /**
        * Will start the animation sequence of a given target
        * @param target - the target
        * @param {number} from - from which frame should animation start
        * @param {number} to - till which frame should animation run.
        * @param {boolean} [loop] - should the animation loop
        * @param {number} [speedRatio] - the speed in which to run the animation
        * @param {Function} [onAnimationEnd] function to be executed when the animation ended.
        * @param {BABYLON.Animatable} [animatable] an animatable object. If not provided a new one will be created from the given params.
        * @return {BABYLON.Animatable} the animatable object created for this animation
        * @see BABYLON.Animatable
        * @see http://doc.babylonjs.com/page.php?p=22081
        */
        public beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, animatable?: Animatable): Animatable;
        public beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable;
        public getAnimatableByTarget(target: any): Animatable;
        /**
        * Will stop the animation of the given target
        * @param target - the target
        * @see beginAnimation
        */
        public stopAnimation(target: any): void;
        private _animate();
        public getViewMatrix(): Matrix;
        public getProjectionMatrix(): Matrix;
        public getTransformMatrix(): Matrix;
        public setTransformMatrix(view: Matrix, projection: Matrix): void;
        /**
        * sets the active camera of the scene using its ID
        * @param {string} id - the camera's ID
        * @return {BABYLON.Camera|null} the new active camera or null if none found.
        * @see activeCamera
        */
        public setActiveCameraByID(id: string): Camera;
        /**
        * sets the active camera of the scene using its name
        * @param {string} name - the camera's name
        * @return {BABYLON.Camera|null} the new active camera or null if none found.
        * @see activeCamera
        */
        public setActiveCameraByName(name: string): Camera;
        /**
        * get a material using its id
        * @param {string} the material's ID
        * @return {BABYLON.Material|null} the material or null if none found.
        */
        public getMaterialByID(id: string): Material;
        /**
        * get a material using its name
        * @param {string} the material's name
        * @return {BABYLON.Material|null} the material or null if none found.
        */
        public getMaterialByName(name: string): Material;
        public getCameraByID(id: string): Camera;
        /**
        * get a camera using its name
        * @param {string} the camera's name
        * @return {BABYLON.Camera|null} the camera or null if none found.
        */
        public getCameraByName(name: string): Camera;
        /**
        * get a light node using its name
        * @param {string} the light's name
        * @return {BABYLON.Light|null} the light or null if none found.
        */
        public getLightByName(name: string): Light;
        /**
        * get a light node using its ID
        * @param {string} the light's id
        * @return {BABYLON.Light|null} the light or null if none found.
        */
        public getLightByID(id: string): Light;
        /**
        * get a geometry using its ID
        * @param {string} the geometry's id
        * @return {BABYLON.Geometry|null} the geometry or null if none found.
        */
        public getGeometryByID(id: string): Geometry;
        /**
        * add a new geometry to this scene.
        * @param {BABYLON.Geometry} geometry - the geometry to be added to the scene.
        * @param {boolean} [force] - force addition, even if a geometry with this ID already exists
        * @return {boolean} was the geometry added or not
        */
        public pushGeometry(geometry: Geometry, force?: boolean): boolean;
        public getGeometries(): Geometry[];
        /**
        * Get a the first added mesh found of a given ID
        * @param {string} id - the id to search for
        * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
        */
        public getMeshByID(id: string): AbstractMesh;
        /**
        * Get a the last added mesh found of a given ID
        * @param {string} id - the id to search for
        * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
        */
        public getLastMeshByID(id: string): AbstractMesh;
        /**
        * Get a the last added node (Mesh, Camera, Light) found of a given ID
        * @param {string} id - the id to search for
        * @return {BABYLON.Node|null} the node found or null if not found at all.
        */
        public getLastEntryByID(id: string): Node;
        public getNodeByName(name: string): Node;
        public getMeshByName(name: string): AbstractMesh;
        public getLastSkeletonByID(id: string): Skeleton;
        public getSkeletonById(id: string): Skeleton;
        public getSkeletonByName(name: string): Skeleton;
        public isActiveMesh(mesh: Mesh): boolean;
        private _evaluateSubMesh(subMesh, mesh);
        private _evaluateActiveMeshes();
        private _activeMesh(mesh);
        public updateTransformMatrix(force?: boolean): void;
        private _renderForCamera(camera);
        private _processSubCameras(camera);
        private _checkIntersections();
        public render(): void;
        private _updateAudioParameters();
        public enableDepthRenderer(): DepthRenderer;
        public disableDepthRenderer(): void;
        public dispose(): void;
        public _getNewPosition(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, finalPosition: Vector3, excludedMesh?: AbstractMesh): void;
        private _collideWithWorld(position, velocity, collider, maximumRetry, finalPosition, excludedMesh?);
        public createOrUpdateSelectionOctree(maxCapacity?: number, maxDepth?: number): Octree<AbstractMesh>;
        public createPickingRay(x: number, y: number, world: Matrix, camera: Camera): Ray;
        private _internalPick(rayFunction, predicate, fastCheck?);
        public pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean, camera?: Camera): PickingInfo;
        public pickWithRay(ray: Ray, predicate: (mesh: Mesh) => boolean, fastCheck?: boolean): PickingInfo;
        public setPointerOverMesh(mesh: AbstractMesh): void;
        public getPointerOverMesh(): AbstractMesh;
        public getPhysicsEngine(): PhysicsEngine;
        public enablePhysics(gravity: Vector3, plugin?: IPhysicsEnginePlugin): boolean;
        public disablePhysicsEngine(): void;
        public isPhysicsEnabled(): boolean;
        public setGravity(gravity: Vector3): void;
        public createCompoundImpostor(parts: any, options: PhysicsBodyCreationOptions): any;
        public deleteCompoundImpostor(compound: any): void;
        private _getByTags(list, tagsQuery);
        public getMeshesByTags(tagsQuery: string): Mesh[];
        public getCamerasByTags(tagsQuery: string): Camera[];
        public getLightsByTags(tagsQuery: string): Light[];
        public getMaterialByTags(tagsQuery: string): Material[];
    }
}
declare module BABYLON {
    class Action {
        public triggerOptions: any;
        public trigger: number;
        public _actionManager: ActionManager;
        private _nextActiveAction;
        private _child;
        private _condition;
        private _triggerParameter;
        constructor(triggerOptions: any, condition?: Condition);
        public _prepare(): void;
        public getTriggerParameter(): any;
        public _executeCurrent(evt: ActionEvent): void;
        public execute(evt: ActionEvent): void;
        public then(action: Action): Action;
        public _getProperty(propertyPath: string): string;
        public _getEffectiveTarget(target: any, propertyPath: string): any;
    }
}
declare module BABYLON {
    /**
    * ActionEvent is the event beint sent when an action is triggered.
    */
    class ActionEvent {
        public source: AbstractMesh;
        public pointerX: number;
        public pointerY: number;
        public meshUnderPointer: AbstractMesh;
        public sourceEvent: any;
        /**
        * @constructor
        * @param source The mesh that triggered the action.
        * @param pointerX the X mouse cursor position at the time of the event
        * @param pointerY the Y mouse cursor position at the time of the event
        * @param meshUnderPointer The mesh that is currently pointed at (can be null)
        * @param sourceEvent the original (browser) event that triggered the ActionEvent
        */
        constructor(source: AbstractMesh, pointerX: number, pointerY: number, meshUnderPointer: AbstractMesh, sourceEvent?: any);
        /**
        * Helper function to auto-create an ActionEvent from a source mesh.
        * @param source the source mesh that triggered the event
        * @param evt {Event} The original (browser) event
        */
        static CreateNew(source: AbstractMesh, evt?: Event): ActionEvent;
        /**
        * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
        * @param scene the scene where the event occurred
        * @param evt {Event} The original (browser) event
        */
        static CreateNewFromScene(scene: Scene, evt: Event): ActionEvent;
    }
    /**
    * Action Manager manages all events to be triggered on a given mesh or the global scene.
    * A single scene can have many Action Managers to handle predefined actions on specific meshes.
    */
    class ActionManager {
        private static _NothingTrigger;
        private static _OnPickTrigger;
        private static _OnLeftPickTrigger;
        private static _OnRightPickTrigger;
        private static _OnCenterPickTrigger;
        private static _OnPointerOverTrigger;
        private static _OnPointerOutTrigger;
        private static _OnEveryFrameTrigger;
        private static _OnIntersectionEnterTrigger;
        private static _OnIntersectionExitTrigger;
        private static _OnKeyDownTrigger;
        private static _OnKeyUpTrigger;
        static NothingTrigger : number;
        static OnPickTrigger : number;
        static OnLeftPickTrigger : number;
        static OnRightPickTrigger : number;
        static OnCenterPickTrigger : number;
        static OnPointerOverTrigger : number;
        static OnPointerOutTrigger : number;
        static OnEveryFrameTrigger : number;
        static OnIntersectionEnterTrigger : number;
        static OnIntersectionExitTrigger : number;
        static OnKeyDownTrigger : number;
        static OnKeyUpTrigger : number;
        public actions: Action[];
        private _scene;
        constructor(scene: Scene);
        public dispose(): void;
        public getScene(): Scene;
        /**
        * Does this action manager handles actions of any of the given triggers
        * @param {number[]} triggers - the triggers to be tested
        * @return {boolean} whether one (or more) of the triggers is handeled
        */
        public hasSpecificTriggers(triggers: number[]): boolean;
        /**
        * Does this action manager has pointer triggers
        * @return {boolean} whether or not it has pointer triggers
        */
        public hasPointerTriggers : boolean;
        /**
        * Does this action manager has pick triggers
        * @return {boolean} whether or not it has pick triggers
        */
        public hasPickTriggers : boolean;
        /**
        * Registers an action to this action manager
        * @param {BABYLON.Action} action - the action to be registered
        * @return {BABYLON.Action} the action amended (prepared) after registration
        */
        public registerAction(action: Action): Action;
        /**
        * Process a specific trigger
        * @param {number} trigger - the trigger to process
        * @param evt {BABYLON.ActionEvent} the event details to be processed
        */
        public processTrigger(trigger: number, evt: ActionEvent): void;
        public _getEffectiveTarget(target: any, propertyPath: string): any;
        public _getProperty(propertyPath: string): string;
    }
}
declare module BABYLON {
    class Condition {
        public _actionManager: ActionManager;
        public _evaluationId: number;
        public _currentResult: boolean;
        constructor(actionManager: ActionManager);
        public isValid(): boolean;
        public _getProperty(propertyPath: string): string;
        public _getEffectiveTarget(target: any, propertyPath: string): any;
    }
    class ValueCondition extends Condition {
        public propertyPath: string;
        public value: any;
        public operator: number;
        private static _IsEqual;
        private static _IsDifferent;
        private static _IsGreater;
        private static _IsLesser;
        static IsEqual : number;
        static IsDifferent : number;
        static IsGreater : number;
        static IsLesser : number;
        public _actionManager: ActionManager;
        private _target;
        private _property;
        constructor(actionManager: ActionManager, target: any, propertyPath: string, value: any, operator?: number);
        public isValid(): boolean;
    }
    class PredicateCondition extends Condition {
        public predicate: () => boolean;
        public _actionManager: ActionManager;
        constructor(actionManager: ActionManager, predicate: () => boolean);
        public isValid(): boolean;
    }
    class StateCondition extends Condition {
        public value: string;
        public _actionManager: ActionManager;
        private _target;
        constructor(actionManager: ActionManager, target: any, value: string);
        public isValid(): boolean;
    }
}
declare module BABYLON {
    class SwitchBooleanAction extends Action {
        public propertyPath: string;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class SetStateAction extends Action {
        public value: string;
        private _target;
        constructor(triggerOptions: any, target: any, value: string, condition?: Condition);
        public execute(): void;
    }
    class SetValueAction extends Action {
        public propertyPath: string;
        public value: any;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class IncrementValueAction extends Action {
        public propertyPath: string;
        public value: any;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class PlayAnimationAction extends Action {
        public from: number;
        public to: number;
        public loop: boolean;
        private _target;
        constructor(triggerOptions: any, target: any, from: number, to: number, loop?: boolean, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class StopAnimationAction extends Action {
        private _target;
        constructor(triggerOptions: any, target: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
    class DoNothingAction extends Action {
        constructor(triggerOptions?: any, condition?: Condition);
        public execute(): void;
    }
    class CombineAction extends Action {
        public children: Action[];
        constructor(triggerOptions: any, children: Action[], condition?: Condition);
        public _prepare(): void;
        public execute(evt: ActionEvent): void;
    }
    class ExecuteCodeAction extends Action {
        public func: (evt: ActionEvent) => void;
        constructor(triggerOptions: any, func: (evt: ActionEvent) => void, condition?: Condition);
        public execute(evt: ActionEvent): void;
    }
    class SetParentAction extends Action {
        private _parent;
        private _target;
        constructor(triggerOptions: any, target: any, parent: any, condition?: Condition);
        public _prepare(): void;
        public execute(): void;
    }
}
declare module BABYLON {
    class InterpolateValueAction extends Action {
        public propertyPath: string;
        public value: any;
        public duration: number;
        public stopOtherAnimations: boolean;
        private _target;
        private _property;
        constructor(triggerOptions: any, target: any, propertyPath: string, value: any, duration?: number, condition?: Condition, stopOtherAnimations?: boolean);
        public _prepare(): void;
        public execute(): void;
    }
}
declare module BABYLON {
    class Animatable {
        public target: any;
        public fromFrame: number;
        public toFrame: number;
        public loopAnimation: boolean;
        public speedRatio: number;
        public onAnimationEnd: any;
        private _localDelayOffset;
        private _pausedDelay;
        private _animations;
        private _paused;
        private _scene;
        public animationStarted: boolean;
        constructor(scene: Scene, target: any, fromFrame?: number, toFrame?: number, loopAnimation?: boolean, speedRatio?: number, onAnimationEnd?: any, animations?: any);
        public appendAnimations(target: any, animations: Animation[]): void;
        public getAnimationByTargetProperty(property: string): Animation;
        public pause(): void;
        public restart(): void;
        public stop(): void;
        public _animate(delay: number): boolean;
    }
}
declare module BABYLON {
    class Animation {
        public name: string;
        public targetProperty: string;
        public framePerSecond: number;
        public dataType: number;
        public loopMode: number;
        private _keys;
        private _offsetsCache;
        private _highLimitsCache;
        private _stopped;
        public _target: any;
        private _easingFunction;
        public targetPropertyPath: string[];
        public currentFrame: number;
        static CreateAndStartAnimation(name: string, mesh: AbstractMesh, tartgetProperty: string, framePerSecond: number, totalFrame: number, from: any, to: any, loopMode?: number): void;
        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: number, loopMode?: number);
        public isStopped(): boolean;
        public getKeys(): any[];
        public getEasingFunction(): IEasingFunction;
        public setEasingFunction(easingFunction: EasingFunction): void;
        public floatInterpolateFunction(startValue: number, endValue: number, gradient: number): number;
        public quaternionInterpolateFunction(startValue: Quaternion, endValue: Quaternion, gradient: number): Quaternion;
        public vector3InterpolateFunction(startValue: Vector3, endValue: Vector3, gradient: number): Vector3;
        public vector2InterpolateFunction(startValue: Vector2, endValue: Vector2, gradient: number): Vector2;
        public color3InterpolateFunction(startValue: Color3, endValue: Color3, gradient: number): Color3;
        public matrixInterpolateFunction(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        public clone(): Animation;
        public setKeys(values: any[]): void;
        private _getKeyValue(value);
        private _interpolate(currentFrame, repeatCount, loopMode, offsetValue?, highLimitValue?);
        public animate(delay: number, from: number, to: number, loop: boolean, speedRatio: number): boolean;
        private static _ANIMATIONTYPE_FLOAT;
        private static _ANIMATIONTYPE_VECTOR3;
        private static _ANIMATIONTYPE_QUATERNION;
        private static _ANIMATIONTYPE_MATRIX;
        private static _ANIMATIONTYPE_COLOR3;
        private static _ANIMATIONTYPE_VECTOR2;
        private static _ANIMATIONLOOPMODE_RELATIVE;
        private static _ANIMATIONLOOPMODE_CYCLE;
        private static _ANIMATIONLOOPMODE_CONSTANT;
        static ANIMATIONTYPE_FLOAT : number;
        static ANIMATIONTYPE_VECTOR3 : number;
        static ANIMATIONTYPE_VECTOR2 : number;
        static ANIMATIONTYPE_QUATERNION : number;
        static ANIMATIONTYPE_MATRIX : number;
        static ANIMATIONTYPE_COLOR3 : number;
        static ANIMATIONLOOPMODE_RELATIVE : number;
        static ANIMATIONLOOPMODE_CYCLE : number;
        static ANIMATIONLOOPMODE_CONSTANT : number;
    }
}
declare module BABYLON {
    interface IEasingFunction {
        ease(gradient: number): number;
    }
    class EasingFunction implements IEasingFunction {
        private static _EASINGMODE_EASEIN;
        private static _EASINGMODE_EASEOUT;
        private static _EASINGMODE_EASEINOUT;
        static EASINGMODE_EASEIN : number;
        static EASINGMODE_EASEOUT : number;
        static EASINGMODE_EASEINOUT : number;
        private _easingMode;
        public setEasingMode(easingMode: number): void;
        public getEasingMode(): number;
        public easeInCore(gradient: number): number;
        public ease(gradient: number): number;
    }
    class CircleEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class BackEase extends EasingFunction implements IEasingFunction {
        public amplitude: number;
        constructor(amplitude?: number);
        public easeInCore(gradient: number): number;
    }
    class BounceEase extends EasingFunction implements IEasingFunction {
        public bounces: number;
        public bounciness: number;
        constructor(bounces?: number, bounciness?: number);
        public easeInCore(gradient: number): number;
    }
    class CubicEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class ElasticEase extends EasingFunction implements IEasingFunction {
        public oscillations: number;
        public springiness: number;
        constructor(oscillations?: number, springiness?: number);
        public easeInCore(gradient: number): number;
    }
    class ExponentialEase extends EasingFunction implements IEasingFunction {
        public exponent: number;
        constructor(exponent?: number);
        public easeInCore(gradient: number): number;
    }
    class PowerEase extends EasingFunction implements IEasingFunction {
        public power: number;
        constructor(power?: number);
        public easeInCore(gradient: number): number;
    }
    class QuadraticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class QuarticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class QuinticEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class SineEase extends EasingFunction implements IEasingFunction {
        public easeInCore(gradient: number): number;
    }
    class BezierCurveEase extends EasingFunction implements IEasingFunction {
        public x1: number;
        public y1: number;
        public x2: number;
        public y2: number;
        constructor(x1?: number, y1?: number, x2?: number, y2?: number);
        public easeInCore(gradient: number): number;
    }
}
declare module BABYLON {
    class Analyser {
        public SMOOTHING: number;
        public FFT_SIZE: number;
        public BARGRAPHAMPLITUDE: number;
        private _byteFreqs;
        private _byteTime;
        private _floatFreqs;
        private _webAudioAnalyser;
        private _debugCanvas;
        private _debugCanvasContext;
        private _debugCanvasWidth;
        private _debugCanvasHeight;
        private _scene;
        private _registerFunc;
        private _audioEngine;
        constructor(scene: Scene);
        public getFrequencyBinCount(): number;
        public getByteFrequencyData(): Uint8Array;
        public getByteTimeDomainData(): Uint8Array;
        public getFloatFrequencyData(): Uint8Array;
        public drawDebugCanvas(): void;
        public stopDebugCanvas(): void;
        public connectAudioNodes(inputAudioNode: AudioNode, outputAudioNode: AudioNode): void;
    }
}
declare module BABYLON {
    class AudioEngine {
        public audioContext: AudioContext;
        public canUseWebAudio: boolean;
        public masterGain: GainNode;
        constructor();
        public dispose(): void;
        public getGlobalVolume(): number;
        public setGlobalVolume(newVolume: number): void;
        public connectToAnalyser(analyser: Analyser): void;
    }
}
declare module BABYLON {
    class Sound {
        public autoplay: boolean;
        public loop: boolean;
        public useCustomAttenuation: boolean;
        public soundTrackId: number;
        public spatialSound: boolean;
        public refDistance: number;
        public rolloffFactor: number;
        public maxDistance: number;
        public distanceModel: string;
        public panningModel: string;
        private _startTime;
        private _startOffset;
        private _position;
        private _localDirection;
        private _volume;
        private _isLoaded;
        private _isReadyToPlay;
        private _isPlaying;
        private _isDirectional;
        private _audioEngine;
        private _readyToPlayCallback;
        private _audioBuffer;
        private _soundSource;
        private _soundPanner;
        private _soundGain;
        private _audioNode;
        private _coneInnerAngle;
        private _coneOuterAngle;
        private _coneOuterGain;
        private _scene;
        private _name;
        private _connectedMesh;
        private _customAttenuationFunction;
        private _registerFunc;
        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound
        * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel
        */
        constructor(name: string, urlOrArrayBuffer: any, scene: Scene, readyToPlayCallback?: () => void, options?: any);
        public dispose(): void;
        private _soundLoaded(audioData);
        public updateOptions(options: any): void;
        private _createSpatialParameters();
        public connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode): void;
        /**
        * Transform this sound into a directional source
        * @param coneInnerAngle Size of the inner cone in degree
        * @param coneOuterAngle Size of the outer cone in degree
        * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
        */
        public setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number): void;
        public setPosition(newPosition: Vector3): void;
        public setLocalDirectionToMesh(newLocalDirection: Vector3): void;
        private _updateDirection();
        public updateDistanceFromListener(): void;
        public setAttenuationFunction(callback: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number): void;
        /**
        * Play the sound
        * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
        */
        public play(time?: number): void;
        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        public stop(time?: number): void;
        public pause(): void;
        public setVolume(newVolume: number): void;
        public getVolume(): number;
        public attachToMesh(meshToConnectTo: AbstractMesh): void;
        private _onRegisterAfterWorldMatrixUpdate(connectedMesh);
    }
}
declare module BABYLON {
    class SoundTrack {
        private _audioEngine;
        private _trackGain;
        private _trackConvolver;
        private _scene;
        public id: number;
        public soundCollection: Sound[];
        private _isMainTrack;
        constructor(scene: Scene, options?: any);
        public dispose(): void;
        public AddSound(sound: Sound): void;
        public RemoveSound(sound: Sound): void;
        public setVolume(newVolume: number): void;
    }
}
declare module BABYLON {
    class Bone {
        public name: string;
        public children: Bone[];
        public animations: Animation[];
        private _skeleton;
        private _matrix;
        private _baseMatrix;
        private _worldTransform;
        private _absoluteTransform;
        private _invertedAbsoluteTransform;
        private _parent;
        constructor(name: string, skeleton: Skeleton, parentBone: Bone, matrix: Matrix);
        public getParent(): Bone;
        public getLocalMatrix(): Matrix;
        public getBaseMatrix(): Matrix;
        public getWorldMatrix(): Matrix;
        public getInvertedAbsoluteTransform(): Matrix;
        public getAbsoluteMatrix(): Matrix;
        public updateMatrix(matrix: Matrix): void;
        private _updateDifferenceMatrix();
        public markAsDirty(): void;
    }
}
declare module BABYLON {
    class Skeleton {
        public name: string;
        public id: string;
        public bones: Bone[];
        private _scene;
        private _isDirty;
        private _transformMatrices;
        private _animatables;
        private _identity;
        constructor(name: string, id: string, scene: Scene);
        public getTransformMatrices(): Float32Array;
        public _markAsDirty(): void;
        public prepare(): void;
        public getAnimatables(): IAnimatable[];
        public clone(name: string, id: string): Skeleton;
    }
}
declare module BABYLON {
    class AnaglyphArcRotateCamera extends ArcRotateCamera {
        private _eyeSpace;
        private _leftCamera;
        private _rightCamera;
        constructor(name: string, alpha: number, beta: number, radius: number, target: any, eyeSpace: number, scene: any);
        public _update(): void;
        public _updateCamera(camera: ArcRotateCamera): void;
    }
    class AnaglyphFreeCamera extends FreeCamera {
        private _eyeSpace;
        private _leftCamera;
        private _rightCamera;
        private _transformMatrix;
        constructor(name: string, position: Vector3, eyeSpace: number, scene: Scene);
        public _getSubCameraPosition(eyeSpace: any, result: any): void;
        public _update(): void;
        public _updateCamera(camera: FreeCamera): void;
    }
}
declare module BABYLON {
    class ArcRotateCamera extends Camera {
        public alpha: number;
        public beta: number;
        public radius: number;
        public target: any;
        public inertialAlphaOffset: number;
        public inertialBetaOffset: number;
        public inertialRadiusOffset: number;
        public lowerAlphaLimit: any;
        public upperAlphaLimit: any;
        public lowerBetaLimit: number;
        public upperBetaLimit: number;
        public lowerRadiusLimit: any;
        public upperRadiusLimit: any;
        public angularSensibility: number;
        public wheelPrecision: number;
        public keysUp: number[];
        public keysDown: number[];
        public keysLeft: number[];
        public keysRight: number[];
        public zoomOnFactor: number;
        public targetScreenOffset: Vector2;
        private _keys;
        private _viewMatrix;
        private _attachedElement;
        private _onPointerDown;
        private _onPointerUp;
        private _onPointerMove;
        private _wheel;
        private _onMouseMove;
        private _onKeyDown;
        private _onKeyUp;
        private _onLostFocus;
        private _reset;
        private _onGestureStart;
        private _onGesture;
        private _MSGestureHandler;
        public onCollide: (collidedMesh: AbstractMesh) => void;
        public checkCollisions: boolean;
        public collisionRadius: Vector3;
        private _collider;
        private _previousPosition;
        private _collisionVelocity;
        private _newPosition;
        private _previousAlpha;
        private _previousBeta;
        private _previousRadius;
        public pinchPrecision: number;
        private _touchStart;
        private _touchMove;
        private _touchEnd;
        private _pinchStart;
        private _pinchMove;
        private _pinchEnd;
        constructor(name: string, alpha: number, beta: number, radius: number, target: any, scene: Scene);
        public _getTargetPosition(): Vector3;
        public _initCache(): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _isSynchronizedViewMatrix(): boolean;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
        public _update(): void;
        public setPosition(position: Vector3): void;
        public _getViewMatrix(): Matrix;
        public zoomOn(meshes?: AbstractMesh[]): void;
        public focusOn(meshesOrMinMaxVectorAndDistance: any): void;
    }
}
declare module BABYLON {
    class Camera extends Node {
        public position: Vector3;
        static PERSPECTIVE_CAMERA: number;
        static ORTHOGRAPHIC_CAMERA: number;
        public upVector: Vector3;
        public orthoLeft: any;
        public orthoRight: any;
        public orthoBottom: any;
        public orthoTop: any;
        public fov: number;
        public minZ: number;
        public maxZ: number;
        public inertia: number;
        public mode: number;
        public isIntermediate: boolean;
        public viewport: Viewport;
        public subCameras: any[];
        public layerMask: number;
        private _computedViewMatrix;
        public _projectionMatrix: Matrix;
        private _worldMatrix;
        public _postProcesses: PostProcess[];
        public _postProcessesTakenIndices: any[];
        constructor(name: string, position: Vector3, scene: Scene);
        public _initCache(): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _updateFromScene(): void;
        public _isSynchronized(): boolean;
        public _isSynchronizedViewMatrix(): boolean;
        public _isSynchronizedProjectionMatrix(): boolean;
        public attachControl(element: HTMLElement): void;
        public detachControl(element: HTMLElement): void;
        public _update(): void;
        public attachPostProcess(postProcess: PostProcess, insertAt?: number): number;
        public detachPostProcess(postProcess: PostProcess, atIndices?: any): number[];
        public getWorldMatrix(): Matrix;
        public _getViewMatrix(): Matrix;
        public getViewMatrix(): Matrix;
        public _computeViewMatrix(force?: boolean): Matrix;
        public getProjectionMatrix(force?: boolean): Matrix;
        public dispose(): void;
    }
}
declare module BABYLON {
    class DeviceOrientationCamera extends FreeCamera {
        private _offsetX;
        private _offsetY;
        private _orientationGamma;
        private _orientationBeta;
        private _initialOrientationGamma;
        private _initialOrientationBeta;
        private _attachedCanvas;
        private _orientationChanged;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void;
        public detachControl(canvas: HTMLCanvasElement): void;
        public _checkInputs(): void;
    }
}
declare module BABYLON {
    class FollowCamera extends TargetCamera {
        public radius: number;
        public rotationOffset: number;
        public heightOffset: number;
        public cameraAcceleration: number;
        public maxCameraSpeed: number;
        public target: AbstractMesh;
        constructor(name: string, position: Vector3, scene: Scene);
        private getRadians(degrees);
        private follow(cameraTarget);
        public _update(): void;
    }
}
declare module BABYLON {
    class FreeCamera extends TargetCamera {
        public ellipsoid: Vector3;
        public keysUp: number[];
        public keysDown: number[];
        public keysLeft: number[];
        public keysRight: number[];
        public checkCollisions: boolean;
        public applyGravity: boolean;
        public angularSensibility: number;
        public onCollide: (collidedMesh: AbstractMesh) => void;
        private _keys;
        private _collider;
        private _needMoveForGravity;
        private _oldPosition;
        private _diffPosition;
        private _newPosition;
        private _attachedElement;
        private _localDirection;
        private _transformedDirection;
        private _onMouseDown;
        private _onMouseUp;
        private _onMouseOut;
        private _onMouseMove;
        private _onKeyDown;
        private _onKeyUp;
        public _onLostFocus: (e: FocusEvent) => any;
        public _waitingLockedTargetId: string;
        constructor(name: string, position: Vector3, scene: Scene);
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
        public _collideWithWorld(velocity: Vector3): void;
        public _checkInputs(): void;
        public _decideIfNeedsToMove(): boolean;
        public _updatePosition(): void;
        public _update(): void;
    }
}
declare module BABYLON {
    class GamepadCamera extends FreeCamera {
        private _gamepad;
        private _gamepads;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        private _onNewGameConnected(gamepad);
        public _checkInputs(): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class TargetCamera extends Camera {
        public cameraDirection: Vector3;
        public cameraRotation: Vector2;
        public rotation: Vector3;
        public speed: number;
        public noRotationConstraint: boolean;
        public lockedTarget: any;
        public _currentTarget: Vector3;
        public _viewMatrix: Matrix;
        public _camMatrix: Matrix;
        public _cameraTransformMatrix: Matrix;
        public _cameraRotationMatrix: Matrix;
        public _referencePoint: Vector3;
        public _transformedReferencePoint: Vector3;
        public _lookAtTemp: Matrix;
        public _tempMatrix: Matrix;
        public _reset: () => void;
        public _waitingLockedTargetId: string;
        constructor(name: string, position: Vector3, scene: Scene);
        public _getLockedTargetPosition(): Vector3;
        public _initCache(): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _isSynchronizedViewMatrix(): boolean;
        public _computeLocalCameraSpeed(): number;
        public setTarget(target: Vector3): void;
        public getTarget(): Vector3;
        public _decideIfNeedsToMove(): boolean;
        public _updatePosition(): void;
        public _update(): void;
        public _getViewMatrix(): Matrix;
    }
}
declare module BABYLON {
    class TouchCamera extends FreeCamera {
        private _offsetX;
        private _offsetY;
        private _pointerCount;
        private _pointerPressed;
        private _attachedCanvas;
        private _onPointerDown;
        private _onPointerUp;
        private _onPointerMove;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void;
        public detachControl(canvas: HTMLCanvasElement): void;
        public _checkInputs(): void;
    }
}
declare module BABYLON {
    class VirtualJoysticksCamera extends FreeCamera {
        private _leftjoystick;
        private _rightjoystick;
        constructor(name: string, position: Vector3, scene: Scene);
        public _checkInputs(): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class OculusCamera extends FreeCamera {
        private _leftCamera;
        private _rightCamera;
        private _offsetOrientation;
        private _deviceOrientationHandler;
        constructor(name: string, position: Vector3, scene: Scene);
        public _update(): void;
        public _updateCamera(camera: FreeCamera): void;
        public _onOrientationEvent(evt: DeviceOrientationEvent): void;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
    }
}
declare module BABYLON {
    class OculusGamepadCamera extends FreeCamera {
        private _leftCamera;
        private _rightCamera;
        private _offsetOrientation;
        private _deviceOrientationHandler;
        private _gamepad;
        private _gamepads;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        private _onNewGameConnected(gamepad);
        public _update(): void;
        public _checkInputs(): void;
        public _updateCamera(camera: FreeCamera): void;
        public _onOrientationEvent(evt: DeviceOrientationEvent): void;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class VRDeviceOrientationCamera extends OculusCamera {
        public _alpha: number;
        public _beta: number;
        public _gamma: number;
        constructor(name: string, position: Vector3, scene: Scene);
        public _onOrientationEvent(evt: DeviceOrientationEvent): void;
    }
}
declare var HMDVRDevice: any;
declare var PositionSensorVRDevice: any;
declare module BABYLON {
    class WebVRCamera extends OculusCamera {
        public _hmdDevice: any;
        public _sensorDevice: any;
        public _cacheState: any;
        public _cacheQuaternion: Quaternion;
        public _cacheRotation: Vector3;
        public _vrEnabled: boolean;
        constructor(name: string, position: Vector3, scene: Scene);
        private _getWebVRDevices(devices);
        public _update(): void;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
    }
}
declare module BABYLON {
    class Collider {
        public radius: Vector3;
        public retry: number;
        public velocity: Vector3;
        public basePoint: Vector3;
        public epsilon: number;
        public collisionFound: boolean;
        public velocityWorldLength: number;
        public basePointWorld: Vector3;
        public velocityWorld: Vector3;
        public normalizedVelocity: Vector3;
        public initialVelocity: Vector3;
        public initialPosition: Vector3;
        public nearestDistance: number;
        public intersectionPoint: Vector3;
        public collidedMesh: AbstractMesh;
        private _collisionPoint;
        private _planeIntersectionPoint;
        private _tempVector;
        private _tempVector2;
        private _tempVector3;
        private _tempVector4;
        private _edge;
        private _baseToVertex;
        private _destinationPoint;
        private _slidePlaneNormal;
        private _displacementVector;
        public _initialize(source: Vector3, dir: Vector3, e: number): void;
        public _checkPointInTriangle(point: Vector3, pa: Vector3, pb: Vector3, pc: Vector3, n: Vector3): boolean;
        public _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): boolean;
        public _testTriangle(faceIndex: number, subMesh: SubMesh, p1: Vector3, p2: Vector3, p3: Vector3): void;
        public _collide(subMesh: any, pts: Vector3[], indices: number[], indexStart: number, indexEnd: number, decal: number): void;
        public _getResponse(pos: Vector3, vel: Vector3): void;
    }
}
declare module BABYLON {
    class IntersectionInfo {
        public bu: number;
        public bv: number;
        public distance: number;
        public faceId: number;
        constructor(bu: number, bv: number, distance: number);
    }
    class PickingInfo {
        public hit: boolean;
        public distance: number;
        public pickedPoint: Vector3;
        public pickedMesh: AbstractMesh;
        public bu: number;
        public bv: number;
        public faceId: number;
        public getNormal(): Vector3;
        public getTextureCoordinates(): Vector2;
    }
}
declare module BABYLON {
    class BoundingBox {
        public minimum: Vector3;
        public maximum: Vector3;
        public vectors: Vector3[];
        public center: Vector3;
        public extendSize: Vector3;
        public directions: Vector3[];
        public vectorsWorld: Vector3[];
        public minimumWorld: Vector3;
        public maximumWorld: Vector3;
        private _worldMatrix;
        constructor(minimum: Vector3, maximum: Vector3);
        public getWorldMatrix(): Matrix;
        public _update(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        public intersectsPoint(point: Vector3): boolean;
        public intersectsSphere(sphere: BoundingSphere): boolean;
        public intersectsMinMax(min: Vector3, max: Vector3): boolean;
        static Intersects(box0: BoundingBox, box1: BoundingBox): boolean;
        static IntersectsSphere(minPoint: Vector3, maxPoint: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean;
        static IsCompletelyInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
        static IsInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
    }
}
declare module BABYLON {
    class BoundingInfo {
        public minimum: Vector3;
        public maximum: Vector3;
        public boundingBox: BoundingBox;
        public boundingSphere: BoundingSphere;
        constructor(minimum: Vector3, maximum: Vector3);
        public _update(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        public _checkCollision(collider: Collider): boolean;
        public intersectsPoint(point: Vector3): boolean;
        public intersects(boundingInfo: BoundingInfo, precise: boolean): boolean;
    }
}
declare module BABYLON {
    class BoundingSphere {
        public minimum: Vector3;
        public maximum: Vector3;
        public center: Vector3;
        public radius: number;
        public centerWorld: Vector3;
        public radiusWorld: number;
        private _tempRadiusVector;
        constructor(minimum: Vector3, maximum: Vector3);
        public _update(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public intersectsPoint(point: Vector3): boolean;
        static Intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean;
    }
}
declare module BABYLON {
    interface IOctreeContainer<T> {
        blocks: OctreeBlock<T>[];
    }
    class Octree<T> {
        public maxDepth: number;
        public blocks: OctreeBlock<T>[];
        public dynamicContent: T[];
        private _maxBlockCapacity;
        private _selectionContent;
        private _creationFunc;
        constructor(creationFunc: (entry: T, block: OctreeBlock<T>) => void, maxBlockCapacity?: number, maxDepth?: number);
        public update(worldMin: Vector3, worldMax: Vector3, entries: T[]): void;
        public addMesh(entry: T): void;
        public select(frustumPlanes: Plane[], allowDuplicate?: boolean): SmartArray<T>;
        public intersects(sphereCenter: Vector3, sphereRadius: number, allowDuplicate?: boolean): SmartArray<T>;
        public intersectsRay(ray: Ray): SmartArray<T>;
        static _CreateBlocks<T>(worldMin: Vector3, worldMax: Vector3, entries: T[], maxBlockCapacity: number, currentDepth: number, maxDepth: number, target: IOctreeContainer<T>, creationFunc: (entry: T, block: OctreeBlock<T>) => void): void;
        static CreationFuncForMeshes: (entry: AbstractMesh, block: OctreeBlock<AbstractMesh>) => void;
        static CreationFuncForSubMeshes: (entry: SubMesh, block: OctreeBlock<SubMesh>) => void;
    }
}
declare module BABYLON {
    class OctreeBlock<T> {
        public entries: T[];
        public blocks: OctreeBlock<T>[];
        private _depth;
        private _maxDepth;
        private _capacity;
        private _minPoint;
        private _maxPoint;
        private _boundingVectors;
        private _creationFunc;
        constructor(minPoint: Vector3, maxPoint: Vector3, capacity: number, depth: number, maxDepth: number, creationFunc: (entry: T, block: OctreeBlock<T>) => void);
        public capacity : number;
        public minPoint : Vector3;
        public maxPoint : Vector3;
        public addEntry(entry: T): void;
        public addEntries(entries: T[]): void;
        public select(frustumPlanes: Plane[], selection: SmartArray<T>, allowDuplicate?: boolean): void;
        public intersects(sphereCenter: Vector3, sphereRadius: number, selection: SmartArray<T>, allowDuplicate?: boolean): void;
        public intersectsRay(ray: Ray, selection: SmartArray<T>): void;
        public createInnerBlocks(): void;
    }
}
declare module BABYLON {
    class DebugLayer {
        private _scene;
        private _enabled;
        private _labelsEnabled;
        private _displayStatistics;
        private _displayTree;
        private _displayLogs;
        private _globalDiv;
        private _statsDiv;
        private _statsSubsetDiv;
        private _optionsDiv;
        private _optionsSubsetDiv;
        private _logDiv;
        private _logSubsetDiv;
        private _treeDiv;
        private _treeSubsetDiv;
        private _drawingCanvas;
        private _drawingContext;
        private _syncPositions;
        private _syncData;
        private _onCanvasClick;
        private _clickPosition;
        private _ratio;
        private _identityMatrix;
        private _showUI;
        private _needToRefreshMeshesTree;
        public shouldDisplayLabel: (node: Node) => boolean;
        public shouldDisplayAxis: (mesh: Mesh) => boolean;
        public axisRatio: number;
        public accentColor: string;
        public customStatsFunction: () => string;
        constructor(scene: Scene);
        private _refreshMeshesTreeContent();
        private _renderSingleAxis(zero, unit, unitText, label, color);
        private _renderAxis(projectedPosition, mesh, globalViewport);
        private _renderLabel(text, projectedPosition, labelOffset, onClick, getFillStyle);
        private _isClickInsideRect(x, y, width, height);
        public isVisible(): boolean;
        public hide(): void;
        public show(showUI?: boolean): void;
        private _clearLabels();
        private _generateheader(root, text);
        private _generateTexBox(root, title, color);
        private _generateAdvancedCheckBox(root, leftTitle, rightTitle, initialState, task, tag?);
        private _generateCheckBox(root, title, initialState, task, tag?);
        private _generateRadio(root, title, name, initialState, task, tag?);
        private _generateDOMelements();
        private _displayStats();
    }
}
declare module BABYLON {
    class Layer {
        public name: string;
        public texture: Texture;
        public isBackground: boolean;
        public color: Color4;
        public onDispose: () => void;
        private _scene;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        private _indexBuffer;
        private _effect;
        constructor(name: string, imgUrl: string, scene: Scene, isBackground?: boolean, color?: Color4);
        public render(): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class LensFlare {
        public size: number;
        public position: number;
        public color: Color3;
        public texture: Texture;
        private _system;
        constructor(size: number, position: number, color: any, imgUrl: string, system: LensFlareSystem);
        public dispose: () => void;
    }
}
declare module BABYLON {
    class LensFlareSystem {
        public name: string;
        public lensFlares: LensFlare[];
        public borderLimit: number;
        public meshesSelectionPredicate: (mesh: Mesh) => boolean;
        private _scene;
        private _emitter;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        private _indexBuffer;
        private _effect;
        private _positionX;
        private _positionY;
        private _isEnabled;
        constructor(name: string, emitter: any, scene: Scene);
        public isEnabled : boolean;
        public getScene(): Scene;
        public getEmitter(): any;
        public getEmitterPosition(): Vector3;
        public computeEffectivePosition(globalViewport: Viewport): boolean;
        public _isVisible(): boolean;
        public render(): boolean;
        public dispose(): void;
    }
}
declare module BABYLON {
    class DirectionalLight extends Light implements IShadowLight {
        public direction: Vector3;
        public position: Vector3;
        private _transformedDirection;
        public transformedPosition: Vector3;
        private _worldMatrix;
        constructor(name: string, direction: Vector3, scene: Scene);
        public getAbsolutePosition(): Vector3;
        public setDirectionToTarget(target: Vector3): Vector3;
        public computeTransformedPosition(): boolean;
        public transferToEffect(effect: Effect, directionUniformName: string): void;
        public _getWorldMatrix(): Matrix;
    }
}
declare module BABYLON {
    class HemisphericLight extends Light {
        public direction: Vector3;
        public groundColor: Color3;
        private _worldMatrix;
        constructor(name: string, direction: Vector3, scene: Scene);
        public setDirectionToTarget(target: Vector3): Vector3;
        public getShadowGenerator(): ShadowGenerator;
        public transferToEffect(effect: Effect, directionUniformName: string, groundColorUniformName: string): void;
        public _getWorldMatrix(): Matrix;
    }
}
declare module BABYLON {
    interface IShadowLight {
        position: Vector3;
        direction: Vector3;
        transformedPosition: Vector3;
        name: string;
        computeTransformedPosition(): boolean;
        getScene(): Scene;
        _shadowGenerator: ShadowGenerator;
    }
    class Light extends Node {
        public diffuse: Color3;
        public specular: Color3;
        public intensity: number;
        public range: number;
        public includedOnlyMeshes: AbstractMesh[];
        public excludedMeshes: AbstractMesh[];
        public _shadowGenerator: ShadowGenerator;
        private _parentedWorldMatrix;
        public _excludedMeshesIds: string[];
        public _includedOnlyMeshesIds: string[];
        constructor(name: string, scene: Scene);
        public getShadowGenerator(): ShadowGenerator;
        public getAbsolutePosition(): Vector3;
        public transferToEffect(effect: Effect, uniformName0?: string, uniformName1?: string): void;
        public _getWorldMatrix(): Matrix;
        public canAffectMesh(mesh: AbstractMesh): boolean;
        public getWorldMatrix(): Matrix;
        public dispose(): void;
    }
}
declare module BABYLON {
    class PointLight extends Light {
        public position: Vector3;
        private _worldMatrix;
        private _transformedPosition;
        constructor(name: string, position: Vector3, scene: Scene);
        public getAbsolutePosition(): Vector3;
        public transferToEffect(effect: Effect, positionUniformName: string): void;
        public getShadowGenerator(): ShadowGenerator;
        public _getWorldMatrix(): Matrix;
    }
}
declare module BABYLON {
    class SpotLight extends Light implements IShadowLight {
        public position: Vector3;
        public direction: Vector3;
        public angle: number;
        public exponent: number;
        public transformedPosition: Vector3;
        private _transformedDirection;
        private _worldMatrix;
        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, scene: Scene);
        public getAbsolutePosition(): Vector3;
        public setDirectionToTarget(target: Vector3): Vector3;
        public computeTransformedPosition(): boolean;
        public transferToEffect(effect: Effect, positionUniformName: string, directionUniformName: string): void;
        public _getWorldMatrix(): Matrix;
    }
}
declare module BABYLON {
    class ShadowGenerator {
        private static _FILTER_NONE;
        private static _FILTER_VARIANCESHADOWMAP;
        private static _FILTER_POISSONSAMPLING;
        static FILTER_NONE : number;
        static FILTER_VARIANCESHADOWMAP : number;
        static FILTER_POISSONSAMPLING : number;
        public filter: number;
        public useVarianceShadowMap : boolean;
        public usePoissonSampling : boolean;
        private _light;
        private _scene;
        private _shadowMap;
        private _darkness;
        private _transparencyShadow;
        private _effect;
        private _viewMatrix;
        private _projectionMatrix;
        private _transformMatrix;
        private _worldViewProjection;
        private _cachedPosition;
        private _cachedDirection;
        private _cachedDefines;
        constructor(mapSize: number, light: IShadowLight);
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        public getShadowMap(): RenderTargetTexture;
        public getLight(): IShadowLight;
        public getTransformMatrix(): Matrix;
        public getDarkness(): number;
        public setDarkness(darkness: number): void;
        public setTransparencyShadow(hasShadow: boolean): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    interface ISceneLoaderPlugin {
        extensions: string;
        importMesh: (meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => boolean;
        load: (scene: Scene, data: string, rootUrl: string) => boolean;
    }
    class SceneLoader {
        private static _ForceFullSceneLoadingForIncremental;
        private static _ShowLoadingScreen;
        static ForceFullSceneLoadingForIncremental : boolean;
        static ShowLoadingScreen : boolean;
        private static _registeredPlugins;
        private static _getPluginForFilename(sceneFilename);
        static RegisterPlugin(plugin: ISceneLoaderPlugin): void;
        static ImportMesh(meshesNames: any, rootUrl: string, sceneFilename: string, scene: Scene, onsuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, progressCallBack?: () => void, onerror?: (scene: Scene, e: any) => void): void;
        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        */
        static Load(rootUrl: string, sceneFilename: any, engine: Engine, onsuccess?: (scene: Scene) => void, progressCallBack?: any, onerror?: (scene: Scene) => void): void;
        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        */
        static Append(rootUrl: string, sceneFilename: any, scene: Scene, onsuccess?: (scene: Scene) => void, progressCallBack?: any, onerror?: (scene: Scene) => void): void;
    }
}
declare module BABYLON.Internals {
}
declare module BABYLON {
    class EffectFallbacks {
        private _defines;
        private _currentRank;
        private _maxRank;
        public addFallback(rank: number, define: string): void;
        public isMoreFallbacks : boolean;
        public reduce(currentDefines: string): string;
    }
    class Effect {
        public name: any;
        public defines: string;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onBind: (effect: Effect) => void;
        private _engine;
        private _uniformsNames;
        private _samplers;
        private _isReady;
        private _compilationError;
        private _attributesNames;
        private _attributes;
        private _uniforms;
        public _key: string;
        private _program;
        private _valueCache;
        constructor(baseName: any, attributesNames: string[], uniformsNames: string[], samplers: string[], engine: any, defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void);
        public isReady(): boolean;
        public getProgram(): WebGLProgram;
        public getAttributesNames(): string[];
        public getAttributeLocation(index: number): number;
        public getAttributeLocationByName(name: string): number;
        public getAttributesCount(): number;
        public getUniformIndex(uniformName: string): number;
        public getUniform(uniformName: string): WebGLUniformLocation;
        public getSamplers(): string[];
        public getCompilationError(): string;
        public _loadVertexShader(vertex: any, callback: (data: any) => void): void;
        public _loadFragmentShader(fragment: any, callback: (data: any) => void): void;
        private _prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks?);
        public _bindTexture(channel: string, texture: WebGLTexture): void;
        public setTexture(channel: string, texture: BaseTexture): void;
        public setTextureFromPostProcess(channel: string, postProcess: PostProcess): void;
        public _cacheFloat2(uniformName: string, x: number, y: number): void;
        public _cacheFloat3(uniformName: string, x: number, y: number, z: number): void;
        public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): void;
        public setArray(uniformName: string, array: number[]): Effect;
        public setMatrices(uniformName: string, matrices: Float32Array): Effect;
        public setMatrix(uniformName: string, matrix: Matrix): Effect;
        public setFloat(uniformName: string, value: number): Effect;
        public setBool(uniformName: string, bool: boolean): Effect;
        public setVector2(uniformName: string, vector2: Vector2): Effect;
        public setFloat2(uniformName: string, x: number, y: number): Effect;
        public setVector3(uniformName: string, vector3: Vector3): Effect;
        public setFloat3(uniformName: string, x: number, y: number, z: number): Effect;
        public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect;
        public setColor3(uniformName: string, color3: Color3): Effect;
        public setColor4(uniformName: string, color3: Color3, alpha: number): Effect;
        static ShadersStore: {};
    }
}
declare module BABYLON {
    class Material {
        public name: string;
        private static _TriangleFillMode;
        private static _WireFrameFillMode;
        private static _PointFillMode;
        static TriangleFillMode : number;
        static WireFrameFillMode : number;
        static PointFillMode : number;
        public id: string;
        public checkReadyOnEveryCall: boolean;
        public checkReadyOnlyOnce: boolean;
        public state: string;
        public alpha: number;
        public backFaceCulling: boolean;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onDispose: () => void;
        public onBind: (material: Material) => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;
        public _effect: Effect;
        public _wasPreviouslyReady: boolean;
        private _scene;
        private _fillMode;
        public pointSize: number;
        public wireframe : boolean;
        public pointsCloud : boolean;
        public fillMode : number;
        constructor(name: string, scene: Scene, doNotAdd?: boolean);
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        public getEffect(): Effect;
        public getScene(): Scene;
        public needAlphaBlending(): boolean;
        public needAlphaTesting(): boolean;
        public getAlphaTestTexture(): BaseTexture;
        public trackCreation(onCompiled: (effect: Effect) => void, onError: (effect: Effect, errors: string) => void): void;
        public _preBind(): void;
        public bind(world: Matrix, mesh: Mesh): void;
        public bindOnlyWorldMatrix(world: Matrix): void;
        public unbind(): void;
        public dispose(forceDisposeEffect?: boolean): void;
    }
}
declare module BABYLON {
    class MultiMaterial extends Material {
        public subMaterials: Material[];
        constructor(name: string, scene: Scene);
        public getSubMaterial(index: any): Material;
        public isReady(mesh?: AbstractMesh): boolean;
    }
}
declare module BABYLON {
    class ShaderMaterial extends Material {
        private _shaderPath;
        private _options;
        private _textures;
        private _floats;
        private _floatsArrays;
        private _colors3;
        private _colors4;
        private _vectors2;
        private _vectors3;
        private _matrices;
        private _cachedWorldViewMatrix;
        private _renderId;
        constructor(name: string, scene: Scene, shaderPath: any, options: any);
        public needAlphaBlending(): boolean;
        public needAlphaTesting(): boolean;
        private _checkUniform(uniformName);
        public setTexture(name: string, texture: Texture): ShaderMaterial;
        public setFloat(name: string, value: number): ShaderMaterial;
        public setFloats(name: string, value: number[]): ShaderMaterial;
        public setColor3(name: string, value: Color3): ShaderMaterial;
        public setColor4(name: string, value: Color4): ShaderMaterial;
        public setVector2(name: string, value: Vector2): ShaderMaterial;
        public setVector3(name: string, value: Vector3): ShaderMaterial;
        public setMatrix(name: string, value: Matrix): ShaderMaterial;
        public isReady(): boolean;
        public bindOnlyWorldMatrix(world: Matrix): void;
        public bind(world: Matrix): void;
        public dispose(forceDisposeEffect?: boolean): void;
    }
}
declare module BABYLON {
    class FresnelParameters {
        public isEnabled: boolean;
        public leftColor: Color3;
        public rightColor: Color3;
        public bias: number;
        public power: number;
    }
    class StandardMaterial extends Material {
        public diffuseTexture: BaseTexture;
        public ambientTexture: BaseTexture;
        public opacityTexture: BaseTexture;
        public reflectionTexture: BaseTexture;
        public emissiveTexture: BaseTexture;
        public specularTexture: BaseTexture;
        public bumpTexture: BaseTexture;
        public ambientColor: Color3;
        public diffuseColor: Color3;
        public specularColor: Color3;
        public specularPower: number;
        public emissiveColor: Color3;
        public useAlphaFromDiffuseTexture: boolean;
        public useSpecularOverAlpha: boolean;
        public fogEnabled: boolean;
        public diffuseFresnelParameters: FresnelParameters;
        public opacityFresnelParameters: FresnelParameters;
        public reflectionFresnelParameters: FresnelParameters;
        public emissiveFresnelParameters: FresnelParameters;
        private _cachedDefines;
        private _renderTargets;
        private _worldViewProjectionMatrix;
        private _globalAmbientColor;
        private _scaledDiffuse;
        private _scaledSpecular;
        private _renderId;
        constructor(name: string, scene: Scene);
        public needAlphaBlending(): boolean;
        public needAlphaTesting(): boolean;
        private _shouldUseAlphaFromDiffuseTexture();
        public getAlphaTestTexture(): BaseTexture;
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        public unbind(): void;
        public bindOnlyWorldMatrix(world: Matrix): void;
        public bind(world: Matrix, mesh: Mesh): void;
        public getAnimatables(): IAnimatable[];
        public dispose(forceDisposeEffect?: boolean): void;
        public clone(name: string): StandardMaterial;
        static DiffuseTextureEnabled: boolean;
        static AmbientTextureEnabled: boolean;
        static OpacityTextureEnabled: boolean;
        static ReflectionTextureEnabled: boolean;
        static EmissiveTextureEnabled: boolean;
        static SpecularTextureEnabled: boolean;
        static BumpTextureEnabled: boolean;
        static FresnelEnabled: boolean;
    }
}
declare module BABYLON {
    class BaseTexture {
        public name: string;
        public delayLoadState: number;
        public hasAlpha: boolean;
        public getAlphaFromRGB: boolean;
        public level: number;
        public isCube: boolean;
        public isRenderTarget: boolean;
        public animations: Animation[];
        public onDispose: () => void;
        public coordinatesIndex: number;
        public coordinatesMode: number;
        public wrapU: number;
        public wrapV: number;
        public anisotropicFilteringLevel: number;
        public _cachedAnisotropicFilteringLevel: number;
        private _scene;
        public _texture: WebGLTexture;
        constructor(scene: Scene);
        public getScene(): Scene;
        public getTextureMatrix(): Matrix;
        public getReflectionTextureMatrix(): Matrix;
        public getInternalTexture(): WebGLTexture;
        public isReady(): boolean;
        public getSize(): ISize;
        public getBaseSize(): ISize;
        public scale(ratio: number): void;
        public canRescale : boolean;
        public _removeFromCache(url: string, noMipmap: boolean): void;
        public _getFromCache(url: string, noMipmap: boolean, sampling?: number): WebGLTexture;
        public delayLoad(): void;
        public releaseInternalTexture(): void;
        public clone(): BaseTexture;
        public dispose(): void;
    }
}
declare module BABYLON {
    class CubeTexture extends BaseTexture {
        public url: string;
        public coordinatesMode: number;
        private _noMipmap;
        private _extensions;
        private _textureMatrix;
        constructor(rootUrl: string, scene: Scene, extensions?: string[], noMipmap?: boolean);
        public clone(): CubeTexture;
        public delayLoad(): void;
        public getReflectionTextureMatrix(): Matrix;
    }
}
declare module BABYLON {
    class DynamicTexture extends Texture {
        private _generateMipMaps;
        private _canvas;
        private _context;
        constructor(name: string, options: any, scene: Scene, generateMipMaps: boolean, samplingMode?: number);
        public canRescale : boolean;
        public scale(ratio: number): void;
        public getContext(): CanvasRenderingContext2D;
        public clear(): void;
        public update(invertY?: boolean): void;
        public drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY?: boolean, update?: boolean): void;
        public clone(): DynamicTexture;
    }
}
declare module BABYLON {
    class MirrorTexture extends RenderTargetTexture {
        public mirrorPlane: Plane;
        private _transformMatrix;
        private _mirrorMatrix;
        private _savedViewMatrix;
        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean);
        public clone(): MirrorTexture;
    }
}
declare module BABYLON {
    class RawTexture extends Texture {
        constructor(data: ArrayBufferView, width: number, height: number, format: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number);
        static CreateLuminanceTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateLuminanceAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
    }
}
declare module BABYLON {
    class RenderTargetTexture extends Texture {
        public renderList: AbstractMesh[];
        public renderParticles: boolean;
        public renderSprites: boolean;
        public coordinatesMode: number;
        public onBeforeRender: () => void;
        public onAfterRender: () => void;
        public activeCamera: Camera;
        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
        private _size;
        public _generateMipMaps: boolean;
        private _renderingManager;
        public _waitingRenderList: string[];
        private _doNotChangeAspectRatio;
        private _currentRefreshId;
        private _refreshRate;
        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, doNotChangeAspectRatio?: boolean, type?: number);
        public resetRefreshCounter(): void;
        public refreshRate : number;
        public _shouldRender(): boolean;
        public isReady(): boolean;
        public getRenderSize(): number;
        public canRescale : boolean;
        public scale(ratio: number): void;
        public resize(size: any, generateMipMaps?: boolean): void;
        public render(useCameraPostProcess?: boolean): void;
        public clone(): RenderTargetTexture;
    }
}
declare module BABYLON {
    class Texture extends BaseTexture {
        static NEAREST_SAMPLINGMODE: number;
        static BILINEAR_SAMPLINGMODE: number;
        static TRILINEAR_SAMPLINGMODE: number;
        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;
        static SKYBOX_MODE: number;
        static CLAMP_ADDRESSMODE: number;
        static WRAP_ADDRESSMODE: number;
        static MIRROR_ADDRESSMODE: number;
        public url: string;
        public uOffset: number;
        public vOffset: number;
        public uScale: number;
        public vScale: number;
        public uAng: number;
        public vAng: number;
        public wAng: number;
        private _noMipmap;
        public _invertY: boolean;
        private _rowGenerationMatrix;
        private _cachedTextureMatrix;
        private _projectionModeMatrix;
        private _t0;
        private _t1;
        private _t2;
        private _cachedUOffset;
        private _cachedVOffset;
        private _cachedUScale;
        private _cachedVScale;
        private _cachedUAng;
        private _cachedVAng;
        private _cachedWAng;
        private _cachedCoordinatesMode;
        public _samplingMode: number;
        private _buffer;
        private _deleteBuffer;
        constructor(url: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: () => void, onError?: () => void, buffer?: any, deleteBuffer?: boolean);
        public delayLoad(): void;
        private _prepareRowForTextureGeneration(x, y, z, t);
        public getTextureMatrix(): Matrix;
        public getReflectionTextureMatrix(): Matrix;
        public clone(): Texture;
        static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: () => void, onError?: () => void): Texture;
    }
}
declare module BABYLON {
    class VideoTexture extends Texture {
        public video: HTMLVideoElement;
        private _autoLaunch;
        private _lastUpdate;
        constructor(name: string, urls: string[], size: any, scene: Scene, generateMipMaps: boolean, invertY: boolean, samplingMode?: number);
        public update(): boolean;
    }
}
declare module BABYLON {
    class CustomProceduralTexture extends ProceduralTexture {
        private _animate;
        private _time;
        private _config;
        private _texturePath;
        constructor(name: string, texturePath: any, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        private loadJson(jsonUrl);
        public isReady(): boolean;
        public render(useCameraPostProcess?: boolean): void;
        public updateTextures(): void;
        public updateShaderUniforms(): void;
        public animate : boolean;
    }
}
declare module BABYLON {
    class ProceduralTexture extends Texture {
        private _size;
        public _generateMipMaps: boolean;
        private _doNotChangeAspectRatio;
        private _currentRefreshId;
        private _refreshRate;
        private _vertexBuffer;
        private _indexBuffer;
        private _effect;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _uniforms;
        private _samplers;
        private _fragment;
        public _textures: Texture[];
        private _floats;
        private _floatsArrays;
        private _colors3;
        private _colors4;
        private _vectors2;
        private _vectors3;
        private _matrices;
        private _fallbackTexture;
        private _fallbackTextureUsed;
        constructor(name: string, size: any, fragment: any, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public reset(): void;
        public isReady(): boolean;
        public resetRefreshCounter(): void;
        public setFragment(fragment: any): void;
        public refreshRate : number;
        public _shouldRender(): boolean;
        public getRenderSize(): number;
        public resize(size: any, generateMipMaps: any): void;
        private _checkUniform(uniformName);
        public setTexture(name: string, texture: Texture): ProceduralTexture;
        public setFloat(name: string, value: number): ProceduralTexture;
        public setFloats(name: string, value: number[]): ProceduralTexture;
        public setColor3(name: string, value: Color3): ProceduralTexture;
        public setColor4(name: string, value: Color4): ProceduralTexture;
        public setVector2(name: string, value: Vector2): ProceduralTexture;
        public setVector3(name: string, value: Vector3): ProceduralTexture;
        public setMatrix(name: string, value: Matrix): ProceduralTexture;
        public render(useCameraPostProcess?: boolean): void;
        public clone(): ProceduralTexture;
        public dispose(): void;
    }
}
declare module BABYLON {
    class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale;
        private _woodColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public ampScale : number;
        public woodColor : Color3;
    }
    class FireProceduralTexture extends ProceduralTexture {
        private _time;
        private _speed;
        private _shift;
        private _autoGenerateTime;
        private _fireColors;
        private _alphaThreshold;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public render(useCameraPostProcess?: boolean): void;
        static PurpleFireColors : Color3[];
        static GreenFireColors : Color3[];
        static RedFireColors : Color3[];
        static BlueFireColors : Color3[];
        public fireColors : Color3[];
        public time : number;
        public speed : Vector2;
        public shift : number;
        public alphaThreshold : number;
    }
    class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor;
        private _cloudColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public skyColor : Color3;
        public cloudColor : Color3;
    }
    class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors;
        private _herb1;
        private _herb2;
        private _herb3;
        private _groundColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public grassColors : Color3[];
        public groundColor : Color3;
    }
    class RoadProceduralTexture extends ProceduralTexture {
        private _roadColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public roadColor : Color3;
    }
    class BrickProceduralTexture extends ProceduralTexture {
        private _numberOfBricksHeight;
        private _numberOfBricksWidth;
        private _jointColor;
        private _brickColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public numberOfBricksHeight : number;
        public cloudColor : number;
        public numberOfBricksWidth : number;
        public jointColor : Color3;
        public brickColor : Color3;
    }
    class MarbleProceduralTexture extends ProceduralTexture {
        private _numberOfTilesHeight;
        private _numberOfTilesWidth;
        private _amplitude;
        private _marbleColor;
        private _jointColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public numberOfTilesHeight : number;
        public numberOfTilesWidth : number;
        public jointColor : Color3;
        public marbleColor : Color3;
    }
}
declare module BABYLON {
    class Color3 {
        public r: number;
        public g: number;
        public b: number;
        constructor(r?: number, g?: number, b?: number);
        public toString(): string;
        public toArray(array: number[], index?: number): void;
        public toColor4(alpha?: number): Color4;
        public asArray(): number[];
        public toLuminance(): number;
        public multiply(otherColor: Color3): Color3;
        public multiplyToRef(otherColor: Color3, result: Color3): void;
        public equals(otherColor: Color3): boolean;
        public scale(scale: number): Color3;
        public scaleToRef(scale: number, result: Color3): void;
        public add(otherColor: Color3): Color3;
        public addToRef(otherColor: Color3, result: Color3): void;
        public subtract(otherColor: Color3): Color3;
        public subtractToRef(otherColor: Color3, result: Color3): void;
        public clone(): Color3;
        public copyFrom(source: Color3): void;
        public copyFromFloats(r: number, g: number, b: number): void;
        static FromArray(array: number[], offset?: number): Color3;
        static FromInts(r: number, g: number, b: number): Color3;
        static Lerp(start: Color3, end: Color3, amount: number): Color3;
        static Red(): Color3;
        static Green(): Color3;
        static Blue(): Color3;
        static Black(): Color3;
        static White(): Color3;
        static Purple(): Color3;
        static Magenta(): Color3;
        static Yellow(): Color3;
        static Gray(): Color3;
    }
    class Color4 {
        public r: number;
        public g: number;
        public b: number;
        public a: number;
        constructor(r: number, g: number, b: number, a: number);
        public addInPlace(right: any): void;
        public asArray(): number[];
        public toArray(array: number[], index?: number): void;
        public add(right: Color4): Color4;
        public subtract(right: Color4): Color4;
        public subtractToRef(right: Color4, result: Color4): void;
        public scale(scale: number): Color4;
        public scaleToRef(scale: number, result: Color4): void;
        public toString(): string;
        public clone(): Color4;
        public copyFrom(source: Color4): void;
        static Lerp(left: Color4, right: Color4, amount: number): Color4;
        static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void;
        static FromArray(array: number[], offset?: number): Color4;
        static FromInts(r: number, g: number, b: number, a: number): Color4;
    }
    class Vector2 {
        public x: number;
        public y: number;
        constructor(x: number, y: number);
        public toString(): string;
        public toArray(array: number[], index?: number): void;
        public asArray(): number[];
        public copyFrom(source: Vector2): void;
        public copyFromFloats(x: number, y: number): void;
        public add(otherVector: Vector2): Vector2;
        public addVector3(otherVector: Vector3): Vector2;
        public subtract(otherVector: Vector2): Vector2;
        public subtractInPlace(otherVector: Vector2): void;
        public multiplyInPlace(otherVector: Vector2): void;
        public multiply(otherVector: Vector2): Vector2;
        public multiplyToRef(otherVector: Vector2, result: Vector2): void;
        public multiplyByFloats(x: number, y: number): Vector2;
        public divide(otherVector: Vector2): Vector2;
        public divideToRef(otherVector: Vector2, result: Vector2): void;
        public negate(): Vector2;
        public scaleInPlace(scale: number): Vector2;
        public scale(scale: number): Vector2;
        public equals(otherVector: Vector2): boolean;
        public length(): number;
        public lengthSquared(): number;
        public normalize(): Vector2;
        public clone(): Vector2;
        static Zero(): Vector2;
        static FromArray(array: number[], offset?: number): Vector2;
        static FromArrayToRef(array: number[], offset: number, result: Vector2): void;
        static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2;
        static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2;
        static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        static Lerp(start: Vector2, end: Vector2, amount: number): Vector2;
        static Dot(left: Vector2, right: Vector2): number;
        static Normalize(vector: Vector2): Vector2;
        static Minimize(left: Vector2, right: Vector2): Vector2;
        static Maximize(left: Vector2, right: Vector2): Vector2;
        static Transform(vector: Vector2, transformation: Matrix): Vector2;
        static Distance(value1: Vector2, value2: Vector2): number;
        static DistanceSquared(value1: Vector2, value2: Vector2): number;
    }
    class Vector3 {
        public x: number;
        public y: number;
        public z: number;
        constructor(x: number, y: number, z: number);
        public toString(): string;
        public asArray(): number[];
        public toArray(array: number[], index?: number): void;
        public addInPlace(otherVector: Vector3): void;
        public add(otherVector: Vector3): Vector3;
        public addToRef(otherVector: Vector3, result: Vector3): void;
        public subtractInPlace(otherVector: Vector3): void;
        public subtract(otherVector: Vector3): Vector3;
        public subtractToRef(otherVector: Vector3, result: Vector3): void;
        public subtractFromFloats(x: number, y: number, z: number): Vector3;
        public subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        public negate(): Vector3;
        public scaleInPlace(scale: number): Vector3;
        public scale(scale: number): Vector3;
        public scaleToRef(scale: number, result: Vector3): void;
        public equals(otherVector: Vector3): boolean;
        public equalsWithEpsilon(otherVector: Vector3): boolean;
        public equalsToFloats(x: number, y: number, z: number): boolean;
        public multiplyInPlace(otherVector: Vector3): void;
        public multiply(otherVector: Vector3): Vector3;
        public multiplyToRef(otherVector: Vector3, result: Vector3): void;
        public multiplyByFloats(x: number, y: number, z: number): Vector3;
        public divide(otherVector: Vector3): Vector3;
        public divideToRef(otherVector: Vector3, result: Vector3): void;
        public MinimizeInPlace(other: Vector3): void;
        public MaximizeInPlace(other: Vector3): void;
        public length(): number;
        public lengthSquared(): number;
        public normalize(): Vector3;
        public clone(): Vector3;
        public copyFrom(source: Vector3): void;
        public copyFromFloats(x: number, y: number, z: number): void;
        static FromArray(array: number[], offset?: number): Vector3;
        static FromArrayToRef(array: number[], offset: number, result: Vector3): void;
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector3): void;
        static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        static Zero(): Vector3;
        static Up(): Vector3;
        static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3;
        static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        static TransformNormal(vector: Vector3, transformation: Matrix): Vector3;
        static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        static Dot(left: Vector3, right: Vector3): number;
        static Cross(left: Vector3, right: Vector3): Vector3;
        static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void;
        static Normalize(vector: Vector3): Vector3;
        static NormalizeToRef(vector: Vector3, result: Vector3): void;
        static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3;
        static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, transform: Matrix): Vector3;
        static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3;
        static Minimize(left: Vector3, right: Vector3): Vector3;
        static Maximize(left: Vector3, right: Vector3): Vector3;
        static Distance(value1: Vector3, value2: Vector3): number;
        static DistanceSquared(value1: Vector3, value2: Vector3): number;
        static Center(value1: Vector3, value2: Vector3): Vector3;
    }
    class Vector4 {
        public x: number;
        public y: number;
        public z: number;
        public w: number;
        constructor(x: number, y: number, z: number, w: number);
        public toString(): string;
        public asArray(): number[];
        public toArray(array: number[], index?: number): void;
        public addInPlace(otherVector: Vector4): void;
        public add(otherVector: Vector4): Vector4;
        public addToRef(otherVector: Vector4, result: Vector4): void;
        public subtractInPlace(otherVector: Vector4): void;
        public subtract(otherVector: Vector4): Vector4;
        public subtractToRef(otherVector: Vector4, result: Vector4): void;
        public subtractFromFloats(x: number, y: number, z: number, w: number): Vector4;
        public subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void;
        public negate(): Vector4;
        public scaleInPlace(scale: number): Vector4;
        public scale(scale: number): Vector4;
        public scaleToRef(scale: number, result: Vector4): void;
        public equals(otherVector: Vector4): boolean;
        public equalsWithEpsilon(otherVector: Vector4): boolean;
        public equalsToFloats(x: number, y: number, z: number, w: number): boolean;
        public multiplyInPlace(otherVector: Vector4): void;
        public multiply(otherVector: Vector4): Vector4;
        public multiplyToRef(otherVector: Vector4, result: Vector4): void;
        public multiplyByFloats(x: number, y: number, z: number, w: number): Vector4;
        public divide(otherVector: Vector4): Vector4;
        public divideToRef(otherVector: Vector4, result: Vector4): void;
        public MinimizeInPlace(other: Vector4): void;
        public MaximizeInPlace(other: Vector4): void;
        public length(): number;
        public lengthSquared(): number;
        public normalize(): Vector4;
        public clone(): Vector4;
        public copyFrom(source: Vector4): void;
        public copyFromFloats(x: number, y: number, z: number, w: number): void;
        static FromArray(array: number[], offset?: number): Vector4;
        static FromArrayToRef(array: number[], offset: number, result: Vector4): void;
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector4): void;
        static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void;
        static Zero(): Vector4;
        static Normalize(vector: Vector4): Vector4;
        static NormalizeToRef(vector: Vector4, result: Vector4): void;
        static Minimize(left: Vector4, right: Vector4): Vector4;
        static Maximize(left: Vector4, right: Vector4): Vector4;
        static Distance(value1: Vector4, value2: Vector4): number;
        static DistanceSquared(value1: Vector4, value2: Vector4): number;
        static Center(value1: Vector4, value2: Vector4): Vector4;
    }
    class Quaternion {
        public x: number;
        public y: number;
        public z: number;
        public w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        public toString(): string;
        public asArray(): number[];
        public equals(otherQuaternion: Quaternion): boolean;
        public clone(): Quaternion;
        public copyFrom(other: Quaternion): void;
        public copyFromFloats(x: number, y: number, z: number, w: number): void;
        public add(other: Quaternion): Quaternion;
        public subtract(other: Quaternion): Quaternion;
        public scale(value: number): Quaternion;
        public multiply(q1: Quaternion): Quaternion;
        public multiplyToRef(q1: Quaternion, result: Quaternion): void;
        public length(): number;
        public normalize(): void;
        public toEulerAngles(): Vector3;
        public toEulerAnglesToRef(result: Vector3): void;
        public toRotationMatrix(result: Matrix): void;
        public fromRotationMatrix(matrix: Matrix): void;
        static Inverse(q: Quaternion): Quaternion;
        static Identity(): Quaternion;
        static RotationAxis(axis: Vector3, angle: number): Quaternion;
        static FromArray(array: number[], offset?: number): Quaternion;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
    }
    class Matrix {
        private static _tempQuaternion;
        private static _xAxis;
        private static _yAxis;
        private static _zAxis;
        public m: Float32Array;
        public isIdentity(): boolean;
        public determinant(): number;
        public toArray(): Float32Array;
        public asArray(): Float32Array;
        public invert(): void;
        public invertToRef(other: Matrix): void;
        public setTranslation(vector3: Vector3): void;
        public multiply(other: Matrix): Matrix;
        public copyFrom(other: Matrix): void;
        public copyToArray(array: Float32Array, offset?: number): void;
        public multiplyToRef(other: Matrix, result: Matrix): void;
        public multiplyToArray(other: Matrix, result: Float32Array, offset: number): void;
        public equals(value: Matrix): boolean;
        public clone(): Matrix;
        public decompose(scale: Vector3, rotation: Quaternion, translation: Vector3): boolean;
        static FromArray(array: number[], offset?: number): Matrix;
        static FromArrayToRef(array: number[], offset: number, result: Matrix): void;
        static FromValuesToRef(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number, result: Matrix): void;
        static FromValues(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number): Matrix;
        static Compose(scale: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        static Identity(): Matrix;
        static IdentityToRef(result: Matrix): void;
        static Zero(): Matrix;
        static RotationX(angle: number): Matrix;
        static Invert(source: Matrix): Matrix;
        static RotationXToRef(angle: number, result: Matrix): void;
        static RotationY(angle: number): Matrix;
        static RotationYToRef(angle: number, result: Matrix): void;
        static RotationZ(angle: number): Matrix;
        static RotationZToRef(angle: number, result: Matrix): void;
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void;
        static Scaling(x: number, y: number, z: number): Matrix;
        static ScalingToRef(x: number, y: number, z: number, result: Matrix): void;
        static Translation(x: number, y: number, z: number): Matrix;
        static TranslationToRef(x: number, y: number, z: number, result: Matrix): void;
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        static OrthoOffCenterLHToRef(left: number, right: any, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix): void;
        static GetFinalMatrix(viewport: Viewport, world: Matrix, view: Matrix, projection: Matrix, zmin: number, zmax: number): Matrix;
        static Transpose(matrix: Matrix): Matrix;
        static Reflection(plane: Plane): Matrix;
        static ReflectionToRef(plane: Plane, result: Matrix): void;
    }
    class Plane {
        public normal: Vector3;
        public d: number;
        constructor(a: number, b: number, c: number, d: number);
        public asArray(): number[];
        public clone(): Plane;
        public normalize(): void;
        public transform(transformation: Matrix): Plane;
        public dotCoordinate(point: any): number;
        public copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): void;
        public isFrontFacingTo(direction: Vector3, epsilon: number): boolean;
        public signedDistanceTo(point: Vector3): number;
        static FromArray(array: number[]): Plane;
        static FromPoints(point1: any, point2: any, point3: any): Plane;
        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane;
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point: Vector3): number;
    }
    class Viewport {
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        constructor(x: number, y: number, width: number, height: number);
        public toGlobal(engine: any): Viewport;
    }
    class Frustum {
        static GetPlanes(transform: Matrix): Plane[];
        static GetPlanesToRef(transform: Matrix, frustumPlanes: Plane[]): void;
    }
    class Ray {
        public origin: Vector3;
        public direction: Vector3;
        public length: number;
        private _edge1;
        private _edge2;
        private _pvec;
        private _tvec;
        private _qvec;
        constructor(origin: Vector3, direction: Vector3, length?: number);
        public intersectsBoxMinMax(minimum: Vector3, maximum: Vector3): boolean;
        public intersectsBox(box: BoundingBox): boolean;
        public intersectsSphere(sphere: any): boolean;
        public intersectsTriangle(vertex0: Vector3, vertex1: Vector3, vertex2: Vector3): IntersectionInfo;
        static CreateNew(x: number, y: number, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Ray;
        /**
        * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
        * transformed to the given world matrix.
        * @param origin The origin point
        * @param end The end point
        * @param world a matrix to transform the ray to. Default is the identity matrix.
        */
        static CreateNewFromTo(origin: Vector3, end: Vector3, world?: Matrix): Ray;
        static Transform(ray: Ray, matrix: Matrix): Ray;
    }
    enum Space {
        LOCAL = 0,
        WORLD = 1,
    }
    class Axis {
        static X: Vector3;
        static Y: Vector3;
        static Z: Vector3;
    }
    class BezierCurve {
        static interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number;
    }
    enum Orientation {
        CW = 0,
        CCW = 1,
    }
    class Angle {
        private _radians;
        constructor(radians: number);
        public degrees: () => number;
        public radians: () => number;
        static BetweenTwoPoints(a: Vector2, b: Vector2): Angle;
        static FromRadians(radians: number): Angle;
        static FromDegrees(degrees: number): Angle;
    }
    class Arc2 {
        public startPoint: Vector2;
        public midPoint: Vector2;
        public endPoint: Vector2;
        public centerPoint: Vector2;
        public radius: number;
        public angle: Angle;
        public startAngle: Angle;
        public orientation: Orientation;
        constructor(startPoint: Vector2, midPoint: Vector2, endPoint: Vector2);
    }
    class PathCursor {
        private path;
        private _onchange;
        public value: number;
        public animations: Animation[];
        constructor(path: Path2);
        public getPoint(): Vector3;
        public moveAhead(step?: number): void;
        public moveBack(step?: number): void;
        public move(step: number): void;
        private ensureLimits();
        private markAsDirty(propertyName);
        private raiseOnChange();
        public onchange(f: (cursor: PathCursor) => void): void;
    }
    class Path2 {
        private _points;
        private _length;
        public closed: boolean;
        constructor(x: number, y: number);
        public addLineTo(x: number, y: number): Path2;
        public addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments?: number): Path2;
        public close(): Path2;
        public length(): number;
        public getPoints(): Vector2[];
        public getPointAtLengthPosition(normalizedLengthPosition: number): Vector2;
        static StartingAt(x: number, y: number): Path2;
    }
}
declare module BABYLON {
    class AbstractMesh extends Node implements IDisposable {
        private static _BILLBOARDMODE_NONE;
        private static _BILLBOARDMODE_X;
        private static _BILLBOARDMODE_Y;
        private static _BILLBOARDMODE_Z;
        private static _BILLBOARDMODE_ALL;
        static BILLBOARDMODE_NONE : number;
        static BILLBOARDMODE_X : number;
        static BILLBOARDMODE_Y : number;
        static BILLBOARDMODE_Z : number;
        static BILLBOARDMODE_ALL : number;
        public definedFacingForward: boolean;
        public position: Vector3;
        public rotation: Vector3;
        public rotationQuaternion: Quaternion;
        public scaling: Vector3;
        public billboardMode: number;
        public visibility: number;
        public alphaIndex: number;
        public infiniteDistance: boolean;
        public isVisible: boolean;
        public isPickable: boolean;
        public showBoundingBox: boolean;
        public showSubMeshesBoundingBox: boolean;
        public onDispose: any;
        public checkCollisions: boolean;
        public isBlocker: boolean;
        public skeleton: Skeleton;
        public renderingGroupId: number;
        public material: Material;
        public receiveShadows: boolean;
        public actionManager: ActionManager;
        public renderOutline: boolean;
        public outlineColor: Color3;
        public outlineWidth: number;
        public renderOverlay: boolean;
        public overlayColor: Color3;
        public overlayAlpha: number;
        public hasVertexAlpha: boolean;
        public useVertexColors: boolean;
        public applyFog: boolean;
        public useOctreeForRenderingSelection: boolean;
        public useOctreeForPicking: boolean;
        public useOctreeForCollisions: boolean;
        public layerMask: number;
        public _physicImpostor: number;
        public _physicsMass: number;
        public _physicsFriction: number;
        public _physicRestitution: number;
        public ellipsoid: Vector3;
        public ellipsoidOffset: Vector3;
        private _collider;
        private _oldPositionForCollisions;
        private _diffPositionForCollisions;
        private _newPositionForCollisions;
        private _localScaling;
        private _localRotation;
        private _localTranslation;
        private _localBillboard;
        private _localPivotScaling;
        private _localPivotScalingRotation;
        private _localWorld;
        public _worldMatrix: Matrix;
        private _rotateYByPI;
        private _absolutePosition;
        private _collisionsTransformMatrix;
        private _collisionsScalingMatrix;
        public _positions: Vector3[];
        private _isDirty;
        public _masterMesh: AbstractMesh;
        public _boundingInfo: BoundingInfo;
        private _pivotMatrix;
        public _isDisposed: boolean;
        public _renderId: number;
        public subMeshes: SubMesh[];
        public _submeshesOctree: Octree<SubMesh>;
        public _intersectionsInProgress: AbstractMesh[];
        private _onAfterWorldMatrixUpdate;
        public _waitingActions: any;
        constructor(name: string, scene: Scene);
        public isBlocked : boolean;
        public getLOD(camera: Camera): AbstractMesh;
        public getTotalVertices(): number;
        public getIndices(): number[];
        public getVerticesData(kind: string): number[];
        public isVerticesDataPresent(kind: string): boolean;
        public getBoundingInfo(): BoundingInfo;
        public _preActivate(): void;
        public _activate(renderId: number): void;
        public getWorldMatrix(): Matrix;
        public worldMatrixFromCache : Matrix;
        public absolutePosition : Vector3;
        public rotate(axis: Vector3, amount: number, space: Space): void;
        public translate(axis: Vector3, distance: number, space: Space): void;
        public getAbsolutePosition(): Vector3;
        public setAbsolutePosition(absolutePosition: Vector3): void;
        /**
        * Perform relative position change from the point of view of behind the front of the mesh.
        * This is performed taking into account the meshes current rotation, so you do not have to care.
        * Supports definition of mesh facing forward or backward.
        * @param {number} amountRight
        * @param {number} amountUp
        * @param {number} amountForward
        */
        public movePOV(amountRight: number, amountUp: number, amountForward: number): void;
        /**
        * Calculate relative position change from the point of view of behind the front of the mesh.
        * This is performed taking into account the meshes current rotation, so you do not have to care.
        * Supports definition of mesh facing forward or backward.
        * @param {number} amountRight
        * @param {number} amountUp
        * @param {number} amountForward
        */
        public calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3;
        /**
        * Perform relative rotation change from the point of view of behind the front of the mesh.
        * Supports definition of mesh facing forward or backward.
        * @param {number} flipBack
        * @param {number} twirlClockwise
        * @param {number} tiltRight
        */
        public rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): void;
        /**
        * Calculate relative rotation change from the point of view of behind the front of the mesh.
        * Supports definition of mesh facing forward or backward.
        * @param {number} flipBack
        * @param {number} twirlClockwise
        * @param {number} tiltRight
        */
        public calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3;
        public setPivotMatrix(matrix: Matrix): void;
        public getPivotMatrix(): Matrix;
        public _isSynchronized(): boolean;
        public _initCache(): void;
        public markAsDirty(property: string): void;
        public _updateBoundingInfo(): void;
        public _updateSubMeshesBoundingInfo(matrix: Matrix): void;
        public computeWorldMatrix(force?: boolean): Matrix;
        /**
        * If you'd like to be callbacked after the mesh position, rotation or scaling has been updated
        * @param func: callback function to add
        */
        public registerAfterWorldMatrixUpdate(func: (mesh: AbstractMesh) => void): void;
        public unregisterAfterWorldMatrixUpdate(func: (mesh: AbstractMesh) => void): void;
        public setPositionWithLocalVector(vector3: Vector3): void;
        public getPositionExpressedInLocalSpace(): Vector3;
        public locallyTranslate(vector3: Vector3): void;
        public lookAt(targetPoint: Vector3, yawCor: number, pitchCor: number, rollCor: number): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public isCompletelyInFrustum(camera?: Camera): boolean;
        public intersectsMesh(mesh: AbstractMesh, precise?: boolean): boolean;
        public intersectsPoint(point: Vector3): boolean;
        public setPhysicsState(impostor?: any, options?: PhysicsBodyCreationOptions): any;
        public getPhysicsImpostor(): number;
        public getPhysicsMass(): number;
        public getPhysicsFriction(): number;
        public getPhysicsRestitution(): number;
        public getPositionInCameraSpace(camera?: Camera): Vector3;
        public getDistanceToCamera(camera?: Camera): number;
        public applyImpulse(force: Vector3, contactPoint: Vector3): void;
        public setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3, options?: any): void;
        public updatePhysicsBodyPosition(): void;
        public moveWithCollisions(velocity: Vector3): void;
        /**
        * This function will create an octree to help select the right submeshes for rendering, picking and collisions
        * Please note that you must have a decent number of submeshes to get performance improvements when using octree
        */
        public createOrUpdateSubmeshesOctree(maxCapacity?: number, maxDepth?: number): Octree<SubMesh>;
        public _collideForSubMesh(subMesh: SubMesh, transformMatrix: Matrix, collider: Collider): void;
        public _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): void;
        public _checkCollision(collider: Collider): void;
        public _generatePointsArray(): boolean;
        public intersects(ray: Ray, fastCheck?: boolean): PickingInfo;
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): AbstractMesh;
        public releaseSubMeshes(): void;
        public dispose(doNotRecurse?: boolean): void;
    }
}
declare module BABYLON {
    class CSG {
        private polygons;
        public matrix: Matrix;
        public position: Vector3;
        public rotation: Vector3;
        public scaling: Vector3;
        static FromMesh(mesh: Mesh): CSG;
        private static FromPolygons(polygons);
        public clone(): CSG;
        private toPolygons();
        public union(csg: CSG): CSG;
        public unionInPlace(csg: CSG): void;
        public subtract(csg: CSG): CSG;
        public subtractInPlace(csg: CSG): void;
        public intersect(csg: CSG): CSG;
        public intersectInPlace(csg: CSG): void;
        public inverse(): CSG;
        public inverseInPlace(): void;
        public copyTransformAttributes(csg: CSG): CSG;
        public buildMeshGeometry(name: string, scene: Scene, keepSubMeshes: boolean): Mesh;
        public toMesh(name: string, material: Material, scene: Scene, keepSubMeshes: boolean): Mesh;
    }
}
declare module BABYLON {
    class Geometry implements IGetSetVerticesData {
        public id: string;
        public delayLoadState: number;
        public delayLoadingFile: string;
        private _scene;
        private _engine;
        private _meshes;
        private _totalVertices;
        private _indices;
        private _vertexBuffers;
        public _delayInfo: any;
        private _indexBuffer;
        public _boundingInfo: BoundingInfo;
        public _delayLoadingFunction: (any: any, Geometry: any) => void;
        constructor(id: string, scene: Scene, vertexData?: VertexData, updatable?: boolean, mesh?: Mesh);
        public getScene(): Scene;
        public getEngine(): Engine;
        public isReady(): boolean;
        public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
        public setVerticesData(kind: string, data: number[], updatable?: boolean, stride?: number): void;
        public updateVerticesDataDirectly(kind: string, data: Float32Array, offset: number): void;
        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean): void;
        public getTotalVertices(): number;
        public getVerticesData(kind: string): number[];
        public getVertexBuffer(kind: string): VertexBuffer;
        public getVertexBuffers(): VertexBuffer[];
        public isVerticesDataPresent(kind: string): boolean;
        public getVerticesDataKinds(): string[];
        public setIndices(indices: number[], totalVertices?: number): void;
        public getTotalIndices(): number;
        public getIndices(): number[];
        public getIndexBuffer(): any;
        public releaseForMesh(mesh: Mesh, shouldDispose?: boolean): void;
        public applyToMesh(mesh: Mesh): void;
        private _applyToMesh(mesh);
        public load(scene: Scene, onLoaded?: () => void): void;
        public dispose(): void;
        public copy(id: string): Geometry;
        static ExtractFromMesh(mesh: Mesh, id: string): Geometry;
        static RandomId(): string;
    }
    module Geometry.Primitives {
        class _Primitive extends Geometry {
            private _beingRegenerated;
            private _canBeRegenerated;
            constructor(id: string, scene: Scene, vertexData?: VertexData, canBeRegenerated?: boolean, mesh?: Mesh);
            public canBeRegenerated(): boolean;
            public regenerate(): void;
            public asNewGeometry(id: string): Geometry;
            public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
            public setVerticesData(kind: string, data: number[], updatable?: boolean): void;
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Box extends _Primitive {
            public size: number;
            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Sphere extends _Primitive {
            public segments: number;
            public diameter: number;
            constructor(id: string, scene: Scene, segments: number, diameter: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Cylinder extends _Primitive {
            public height: number;
            public diameterTop: number;
            public diameterBottom: number;
            public tessellation: number;
            public subdivisions: number;
            constructor(id: string, scene: Scene, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions?: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Torus extends _Primitive {
            public diameter: number;
            public thickness: number;
            public tessellation: number;
            constructor(id: string, scene: Scene, diameter: number, thickness: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Ground extends _Primitive {
            public width: number;
            public height: number;
            public subdivisions: number;
            constructor(id: string, scene: Scene, width: number, height: number, subdivisions: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class TiledGround extends _Primitive {
            public xmin: number;
            public zmin: number;
            public xmax: number;
            public zmax: number;
            public subdivisions: {
                w: number;
                h: number;
            };
            public precision: {
                w: number;
                h: number;
            };
            constructor(id: string, scene: Scene, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
                w: number;
                h: number;
            }, precision: {
                w: number;
                h: number;
            }, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class Plane extends _Primitive {
            public size: number;
            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
        class TorusKnot extends _Primitive {
            public radius: number;
            public tube: number;
            public radialSegments: number;
            public tubularSegments: number;
            public p: number;
            public q: number;
            constructor(id: string, scene: Scene, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, canBeRegenerated?: boolean, mesh?: Mesh);
            public _regenerateVertexData(): VertexData;
            public copy(id: string): Geometry;
        }
    }
}
declare module BABYLON {
    class GroundMesh extends Mesh {
        public generateOctree: boolean;
        private _worldInverse;
        public _subdivisions: number;
        constructor(name: string, scene: Scene);
        public subdivisions : number;
        public optimize(chunksCount: number): void;
        public getHeightAtCoordinates(x: number, z: number): number;
    }
}
declare module BABYLON {
    /**
    * Creates an instance based on a source mesh.
    */
    class InstancedMesh extends AbstractMesh {
        private _sourceMesh;
        private _currentLOD;
        constructor(name: string, source: Mesh);
        public receiveShadows : boolean;
        public material : Material;
        public visibility : number;
        public skeleton : Skeleton;
        public getTotalVertices(): number;
        public sourceMesh : Mesh;
        public getVerticesData(kind: string): number[];
        public isVerticesDataPresent(kind: string): boolean;
        public getIndices(): number[];
        public _positions : Vector3[];
        public refreshBoundingInfo(): void;
        public _preActivate(): void;
        public _activate(renderId: number): void;
        public getLOD(camera: Camera): AbstractMesh;
        public _syncSubMeshes(): void;
        public _generatePointsArray(): boolean;
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh;
        public dispose(doNotRecurse?: boolean): void;
    }
}
declare module BABYLON {
    class LinesMesh extends Mesh {
        public color: Color3;
        public alpha: number;
        private _colorShader;
        private _ib;
        private _indicesLength;
        private _indices;
        constructor(name: string, scene: Scene, updatable?: boolean);
        public material : Material;
        public isPickable : boolean;
        public checkCollisions : boolean;
        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): void;
        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): void;
        public intersects(ray: Ray, fastCheck?: boolean): any;
        public dispose(doNotRecurse?: boolean): void;
    }
}
declare module BABYLON {
    class _InstancesBatch {
        public mustReturn: boolean;
        public visibleInstances: InstancedMesh[][];
        public renderSelf: boolean[];
    }
    class Mesh extends AbstractMesh implements IGetSetVerticesData {
        public delayLoadState: number;
        public instances: InstancedMesh[];
        public delayLoadingFile: string;
        public _binaryInfo: any;
        private _LODLevels;
        public _geometry: Geometry;
        private _onBeforeRenderCallbacks;
        private _onAfterRenderCallbacks;
        public _delayInfo: any;
        public _delayLoadingFunction: (any: any, Mesh: any) => void;
        public _visibleInstances: any;
        private _renderIdForInstances;
        private _batchCache;
        private _worldMatricesInstancesBuffer;
        private _worldMatricesInstancesArray;
        private _instancesBufferSize;
        public _shouldGenerateFlatShading: boolean;
        private _preActivateId;
        /**
        * @constructor
        * @param {string} name - The value used by scene.getMeshByName() to do a lookup.
        * @param {Scene} scene - The scene to add this mesh to.
        * @param {Node} parent - The parent of this mesh, if it has one
        * @param {Mesh} source - An optional Mesh from which geometry is shared, cloned.
        * @param {boolean} doNotCloneChildren - When cloning, skip cloning child meshes of source, default False.
        *                  When false, achieved by calling a clone(), also passing False.
        *                  This will make creation of children, recursive.
        */
        constructor(name: string, scene: Scene, parent?: Node, source?: Mesh, doNotCloneChildren?: boolean);
        public hasLODLevels : boolean;
        private _sortLODLevels();
        /**
        * Add a mesh as LOD level triggered at the given distance.
        * @param {number} distance - the distance from the center of the object to show this level
        * @param {BABYLON.Mesh} mesh - the mesh to be added as LOD level
        * @return {BABYLON.Mesh} this mesh (for chaining)
        */
        public addLODLevel(distance: number, mesh: Mesh): Mesh;
        /**
        * Remove a mesh from the LOD array
        * @param {BABYLON.Mesh} mesh - the mesh to be removed.
        * @return {BABYLON.Mesh} this mesh (for chaining)
        */
        public removeLODLevel(mesh: Mesh): Mesh;
        public getLOD(camera: Camera, boundingSphere?: BoundingSphere): AbstractMesh;
        public geometry : Geometry;
        public getTotalVertices(): number;
        public getVerticesData(kind: string): number[];
        public getVertexBuffer(kind: any): VertexBuffer;
        public isVerticesDataPresent(kind: string): boolean;
        public getVerticesDataKinds(): string[];
        public getTotalIndices(): number;
        public getIndices(): number[];
        public isBlocked : boolean;
        public isReady(): boolean;
        public isDisposed(): boolean;
        public _preActivate(): void;
        public _registerInstanceForRenderId(instance: InstancedMesh, renderId: number): void;
        public refreshBoundingInfo(): void;
        public _createGlobalSubMesh(): SubMesh;
        public subdivide(count: number): void;
        public setVerticesData(kind: any, data: any, updatable?: boolean, stride?: number): void;
        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void;
        public updateVerticesDataDirectly(kind: string, data: Float32Array, offset?: number, makeItUnique?: boolean): void;
        public makeGeometryUnique(): void;
        public setIndices(indices: number[], totalVertices?: number): void;
        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): void;
        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): void;
        public registerBeforeRender(func: () => void): void;
        public unregisterBeforeRender(func: () => void): void;
        public registerAfterRender(func: () => void): void;
        public unregisterAfterRender(func: () => void): void;
        public _getInstancesRenderList(subMeshId: number): _InstancesBatch;
        public _renderWithInstances(subMesh: SubMesh, fillMode: number, batch: _InstancesBatch, effect: Effect, engine: Engine): void;
        public render(subMesh: SubMesh): void;
        public getEmittedParticleSystems(): ParticleSystem[];
        public getHierarchyEmittedParticleSystems(): ParticleSystem[];
        public getChildren(): Node[];
        public _checkDelayState(): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public setMaterialByID(id: string): void;
        public getAnimatables(): IAnimatable[];
        public bakeTransformIntoVertices(transform: Matrix): void;
        public _resetPointsArrayCache(): void;
        public _generatePointsArray(): boolean;
        public clone(name: string, newParent?: Node, doNotCloneChildren?: boolean): Mesh;
        public dispose(doNotRecurse?: boolean): void;
        public applyDisplacementMap(url: string, minHeight: number, maxHeight: number): void;
        public applyDisplacementMapFromBuffer(buffer: Uint8Array, heightMapWidth: number, heightMapHeight: number, minHeight: number, maxHeight: number): void;
        public convertToFlatShadedMesh(): void;
        public createInstance(name: string): InstancedMesh;
        public synchronizeInstances(): void;
        /**
        * Simplify the mesh according to the given array of settings.
        * Function will return immediately and will simplify async.
        * @param settings a collection of simplification settings.
        * @param parallelProcessing should all levels calculate parallel or one after the other.
        * @param type the type of simplification to run.
        * successCallback optional success callback to be called after the simplification finished processing all settings.
        */
        public simplify(settings: ISimplificationSettings[], parallelProcessing?: boolean, type?: SimplificationType, successCallback?: () => void): void;
        static CreateBox(name: string, size: number, scene: Scene, updatable?: boolean): Mesh;
        static CreateSphere(name: string, segments: number, diameter: number, scene: Scene, updatable?: boolean): Mesh;
        static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: any, scene: Scene, updatable?: any): Mesh;
        static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene: Scene, updatable?: boolean): Mesh;
        static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene: Scene, updatable?: boolean): Mesh;
        static CreateLines(name: string, points: Vector3[], scene: Scene, updatable?: boolean): LinesMesh;
        static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean): Mesh;
        static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable?: boolean): Mesh;
        static CreateTiledGround(name: string, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
            w: number;
            h: number;
        }, precision: {
            w: number;
            h: number;
        }, scene: Scene, updatable?: boolean): Mesh;
        static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean): GroundMesh;
        static MinMax(meshes: AbstractMesh[]): {
            min: Vector3;
            max: Vector3;
        };
        static Center(meshesOrMinMaxVector: any): Vector3;
        static MergeMeshes(meshes: Mesh[], disposeSource?: boolean, allow32BitsIndices?: boolean): Mesh;
    }
}
declare module BABYLON {
    interface IGetSetVerticesData {
        isVerticesDataPresent(kind: string): boolean;
        getVerticesData(kind: string): number[];
        getIndices(): number[];
        setVerticesData(kind: string, data: number[], updatable?: boolean): void;
        updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void;
        setIndices(indices: number[]): void;
    }
    class VertexData {
        public positions: number[];
        public normals: number[];
        public uvs: number[];
        public uv2s: number[];
        public colors: number[];
        public matricesIndices: number[];
        public matricesWeights: number[];
        public indices: number[];
        public set(data: number[], kind: string): void;
        public applyToMesh(mesh: Mesh, updatable?: boolean): void;
        public applyToGeometry(geometry: Geometry, updatable?: boolean): void;
        public updateMesh(mesh: Mesh, updateExtends?: boolean, makeItUnique?: boolean): void;
        public updateGeometry(geometry: Geometry, updateExtends?: boolean, makeItUnique?: boolean): void;
        private _applyTo(meshOrGeometry, updatable?);
        private _update(meshOrGeometry, updateExtends?, makeItUnique?);
        public transform(matrix: Matrix): void;
        public merge(other: VertexData): void;
        static ExtractFromMesh(mesh: Mesh): VertexData;
        static ExtractFromGeometry(geometry: Geometry): VertexData;
        private static _ExtractFrom(meshOrGeometry);
        static CreateBox(size: number): VertexData;
        static CreateSphere(segments: number, diameter: number): VertexData;
        static CreateCylinder(height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions?: number): VertexData;
        static CreateTorus(diameter: any, thickness: any, tessellation: any): VertexData;
        static CreateLines(points: Vector3[]): VertexData;
        static CreateGround(width: number, height: number, subdivisions: number): VertexData;
        static CreateTiledGround(xmin: number, zmin: number, xmax: number, zmax: number, subdivisions?: {
            w: number;
            h: number;
        }, precision?: {
            w: number;
            h: number;
        }): VertexData;
        static CreateGroundFromHeightMap(width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, buffer: Uint8Array, bufferWidth: number, bufferHeight: number): VertexData;
        static CreatePlane(size: number): VertexData;
        static CreateTorusKnot(radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number): VertexData;
        static ComputeNormals(positions: number[], indices: number[], normals: number[]): void;
    }
}
declare module BABYLON.Internals {
    class MeshLODLevel {
        public distance: number;
        public mesh: Mesh;
        constructor(distance: number, mesh: Mesh);
    }
}
declare module BABYLON {
    /**
    * A simplifier interface for future simplification implementations.
    */
    interface ISimplifier {
        /**
        * Simplification of a given mesh according to the given settings.
        * Since this requires computation, it is assumed that the function runs async.
        * @param settings The settings of the simplification, including quality and distance
        * @param successCallback A callback that will be called after the mesh was simplified.
        * @param errorCallback in case of an error, this callback will be called. optional.
        */
        simplify(settings: ISimplificationSettings, successCallback: (simplifiedMeshes: Mesh) => void, errorCallback?: () => void): void;
    }
    /**
    * Expected simplification settings.
    * Quality should be between 0 and 1 (1 being 100%, 0 being 0%);
    */
    interface ISimplificationSettings {
        quality: number;
        distance: number;
    }
    class SimplificationSettings implements ISimplificationSettings {
        public quality: number;
        public distance: number;
        constructor(quality: number, distance: number);
    }
    /**
    * The implemented types of simplification.
    * At the moment only Quadratic Error Decimation is implemented.
    */
    enum SimplificationType {
        QUADRATIC = 0,
    }
    class DecimationTriangle {
        public vertices: number[];
        public normal: Vector3;
        public error: number[];
        public deleted: boolean;
        public isDirty: boolean;
        public borderFactor: number;
        constructor(vertices: number[]);
    }
    class DecimationVertex {
        public position: Vector3;
        public normal: Vector3;
        public uv: Vector2;
        public id: any;
        public q: QuadraticMatrix;
        public isBorder: boolean;
        public triangleStart: number;
        public triangleCount: number;
        public color: Color4;
        constructor(position: Vector3, normal: Vector3, uv: Vector2, id: any);
    }
    class QuadraticMatrix {
        public data: number[];
        constructor(data?: number[]);
        public det(a11: any, a12: any, a13: any, a21: any, a22: any, a23: any, a31: any, a32: any, a33: any): number;
        public addInPlace(matrix: QuadraticMatrix): void;
        public addArrayInPlace(data: number[]): void;
        public add(matrix: QuadraticMatrix): QuadraticMatrix;
        static FromData(a: number, b: number, c: number, d: number): QuadraticMatrix;
        static DataFromNumbers(a: number, b: number, c: number, d: number): number[];
    }
    class Reference {
        public vertexId: number;
        public triangleId: number;
        constructor(vertexId: number, triangleId: number);
    }
    /**
    * An implementation of the Quadratic Error simplification algorithm.
    * Original paper : http://www1.cs.columbia.edu/~cs4162/html05s/garland97.pdf
    * Ported mostly from QSlim and http://voxels.blogspot.de/2014/05/quadric-mesh-simplification-with-source.html to babylon JS
    * @author RaananW
    */
    class QuadraticErrorSimplification implements ISimplifier {
        private _mesh;
        private triangles;
        private vertices;
        private references;
        private initialised;
        public syncIterations: number;
        public aggressiveness: number;
        public decimationIterations: number;
        constructor(_mesh: Mesh);
        public simplify(settings: ISimplificationSettings, successCallback: (simplifiedMeshes: Mesh) => void): void;
        private runDecimation(settings, successCallback);
        private initWithMesh(mesh, callback);
        private init(callback);
        private reconstructMesh();
        private isFlipped(vertex1, index2, point, deletedArray, borderFactor, delTr);
        private updateTriangles(vertexId, vertex, deletedArray, deletedTriangles);
        private identifyBorder();
        private updateMesh(identifyBorders?);
        private vertexError(q, point);
        private calculateError(vertex1, vertex2, pointResult?, normalResult?, uvResult?, colorResult?);
    }
}
declare module BABYLON {
    class Polygon {
        static Rectangle(xmin: number, ymin: number, xmax: number, ymax: number): Vector2[];
        static Circle(radius: number, cx?: number, cy?: number, numberOfSides?: number): Vector2[];
        static Parse(input: string): Vector2[];
        static StartingAt(x: number, y: number): Path2;
    }
    class PolygonMeshBuilder {
        private _swctx;
        private _points;
        private _name;
        private _scene;
        constructor(name: string, contours: Path2, scene: Scene);
        constructor(name: string, contours: Vector2[], scene: Scene);
        public addHole(hole: Vector2[]): PolygonMeshBuilder;
        public build(updatable?: boolean): Mesh;
    }
}
declare module BABYLON {
    class SubMesh {
        public materialIndex: number;
        public verticesStart: number;
        public verticesCount: number;
        public indexStart: any;
        public indexCount: number;
        public linesIndexCount: number;
        private _mesh;
        private _renderingMesh;
        private _boundingInfo;
        private _linesIndexBuffer;
        public _lastColliderWorldVertices: Vector3[];
        public _trianglePlanes: Plane[];
        public _lastColliderTransformMatrix: Matrix;
        public _renderId: number;
        public _alphaIndex: number;
        public _distanceToCamera: number;
        public _id: number;
        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: any, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
        public getBoundingInfo(): BoundingInfo;
        public getMesh(): AbstractMesh;
        public getRenderingMesh(): Mesh;
        public getMaterial(): Material;
        public refreshBoundingInfo(): void;
        public _checkCollision(collider: Collider): boolean;
        public updateBoundingInfo(world: Matrix): void;
        public isInFrustum(frustumPlanes: Plane[]): boolean;
        public render(): void;
        public getLinesIndexBuffer(indices: number[], engine: any): WebGLBuffer;
        public canIntersects(ray: Ray): boolean;
        public intersects(ray: Ray, positions: Vector3[], indices: number[], fastCheck?: boolean): IntersectionInfo;
        public clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh;
        public dispose(): void;
        static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh;
    }
}
declare module BABYLON {
    class VertexBuffer {
        private _mesh;
        private _engine;
        private _buffer;
        private _data;
        private _updatable;
        private _kind;
        private _strideSize;
        constructor(engine: any, data: number[], kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number);
        public isUpdatable(): boolean;
        public getData(): number[];
        public getBuffer(): WebGLBuffer;
        public getStrideSize(): number;
        public create(data?: number[]): void;
        public update(data: number[]): void;
        public updateDirectly(data: Float32Array, offset: number): void;
        public dispose(): void;
        private static _PositionKind;
        private static _NormalKind;
        private static _UVKind;
        private static _UV2Kind;
        private static _ColorKind;
        private static _MatricesIndicesKind;
        private static _MatricesWeightsKind;
        static PositionKind : string;
        static NormalKind : string;
        static UVKind : string;
        static UV2Kind : string;
        static ColorKind : string;
        static MatricesIndicesKind : string;
        static MatricesWeightsKind : string;
    }
}
declare module BABYLON {
    class Particle {
        public position: Vector3;
        public direction: Vector3;
        public color: Color4;
        public colorStep: Color4;
        public lifeTime: number;
        public age: number;
        public size: number;
        public angle: number;
        public angularSpeed: number;
        public copyTo(other: Particle): void;
    }
}
declare module BABYLON {
    class ParticleSystem implements IDisposable {
        public name: string;
        static BLENDMODE_ONEONE: number;
        static BLENDMODE_STANDARD: number;
        public id: string;
        public renderingGroupId: number;
        public emitter: any;
        public emitRate: number;
        public manualEmitCount: number;
        public updateSpeed: number;
        public targetStopDuration: number;
        public disposeOnStop: boolean;
        public minEmitPower: number;
        public maxEmitPower: number;
        public minLifeTime: number;
        public maxLifeTime: number;
        public minSize: number;
        public maxSize: number;
        public minAngularSpeed: number;
        public maxAngularSpeed: number;
        public particleTexture: Texture;
        public onDispose: () => void;
        public updateFunction: (particles: Particle[]) => void;
        public blendMode: number;
        public forceDepthWrite: boolean;
        public gravity: Vector3;
        public direction1: Vector3;
        public direction2: Vector3;
        public minEmitBox: Vector3;
        public maxEmitBox: Vector3;
        public color1: Color4;
        public color2: Color4;
        public colorDead: Color4;
        public textureMask: Color4;
        public startDirectionFunction: (emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3) => void;
        public startPositionFunction: (worldMatrix: Matrix, positionToUpdate: Vector3) => void;
        private particles;
        private _capacity;
        private _scene;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _stockParticles;
        private _newPartsExcess;
        private _vertexBuffer;
        private _indexBuffer;
        private _vertices;
        private _effect;
        private _customEffect;
        private _cachedDefines;
        private _scaledColorStep;
        private _colorDiff;
        private _scaledDirection;
        private _scaledGravity;
        private _currentRenderId;
        private _alive;
        private _started;
        private _stopped;
        private _actualFrame;
        private _scaledUpdateSpeed;
        constructor(name: string, capacity: number, scene: Scene, customEffect?: Effect);
        public recycleParticle(particle: Particle): void;
        public getCapacity(): number;
        public isAlive(): boolean;
        public isStarted(): boolean;
        public start(): void;
        public stop(): void;
        public _appendParticleVertex(index: number, particle: Particle, offsetX: number, offsetY: number): void;
        private _update(newParticles);
        private _getEffect();
        public animate(): void;
        public render(): number;
        public dispose(): void;
        public clone(name: string, newEmitter: any): ParticleSystem;
    }
}
declare module BABYLON {
    interface IPhysicsEnginePlugin {
        initialize(iterations?: number): any;
        setGravity(gravity: Vector3): void;
        runOneStep(delta: number): void;
        registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        unregisterMesh(mesh: AbstractMesh): any;
        applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        dispose(): void;
        isSupported(): boolean;
        updateBodyPosition(mesh: AbstractMesh): void;
    }
    interface PhysicsBodyCreationOptions {
        mass: number;
        friction: number;
        restitution: number;
    }
    interface PhysicsCompoundBodyPart {
        mesh: Mesh;
        impostor: number;
    }
    class PhysicsEngine {
        public gravity: Vector3;
        private _currentPlugin;
        constructor(plugin?: IPhysicsEnginePlugin);
        public _initialize(gravity?: Vector3): void;
        public _runOneStep(delta: number): void;
        public _setGravity(gravity: Vector3): void;
        public _registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        public _registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        public _unregisterMesh(mesh: AbstractMesh): void;
        public _applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        public _createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        public _updateBodyPosition(mesh: AbstractMesh): void;
        public dispose(): void;
        public isSupported(): boolean;
        static NoImpostor: number;
        static SphereImpostor: number;
        static BoxImpostor: number;
        static PlaneImpostor: number;
        static MeshImpostor: number;
        static CapsuleImpostor: number;
        static ConeImpostor: number;
        static CylinderImpostor: number;
        static ConvexHullImpostor: number;
        static Epsilon: number;
    }
}
declare module BABYLON {
    class CannonJSPlugin implements IPhysicsEnginePlugin {
        public checkWithEpsilon: (value: number) => number;
        private _world;
        private _registeredMeshes;
        private _physicsMaterials;
        public initialize(iterations?: number): void;
        private _checkWithEpsilon(value);
        public runOneStep(delta: number): void;
        public setGravity(gravity: Vector3): void;
        public registerMesh(mesh: AbstractMesh, impostor: number, options?: PhysicsBodyCreationOptions): any;
        private _createSphere(radius, mesh, options?);
        private _createBox(x, y, z, mesh, options?);
        private _createPlane(mesh, options?);
        private _createConvexPolyhedron(rawVerts, rawFaces, mesh, options?);
        private _addMaterial(friction, restitution);
        private _createRigidBodyFromShape(shape, mesh, mass, friction, restitution);
        public registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        private _unbindBody(body);
        public unregisterMesh(mesh: AbstractMesh): void;
        public applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        public updateBodyPosition: (mesh: AbstractMesh) => void;
        public createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3): boolean;
        public dispose(): void;
        public isSupported(): boolean;
    }
}
declare module BABYLON {
    class OimoJSPlugin implements IPhysicsEnginePlugin {
        private _world;
        private _registeredMeshes;
        private _checkWithEpsilon(value);
        public initialize(iterations?: number): void;
        public setGravity(gravity: Vector3): void;
        public registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsBodyCreationOptions): any;
        public registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any;
        private _createBodyAsCompound(part, options, initialMesh);
        public unregisterMesh(mesh: AbstractMesh): void;
        private _unbindBody(body);
        /**
        * Update the body position according to the mesh position
        * @param mesh
        */
        public updateBodyPosition: (mesh: AbstractMesh) => void;
        public applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void;
        public createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean;
        public dispose(): void;
        public isSupported(): boolean;
        private _getLastShape(body);
        public runOneStep(time: number): void;
    }
}
declare module BABYLON {
    class AnaglyphPostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class BlackAndWhitePostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class BlurPostProcess extends PostProcess {
        public direction: Vector2;
        public blurWidth: number;
        constructor(name: string, direction: Vector2, blurWidth: number, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class ConvolutionPostProcess extends PostProcess {
        public kernel: number[];
        constructor(name: string, kernel: number[], ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
        static EdgeDetect0Kernel: number[];
        static EdgeDetect1Kernel: number[];
        static EdgeDetect2Kernel: number[];
        static SharpenKernel: number[];
        static EmbossKernel: number[];
        static GaussianKernel: number[];
    }
}
declare module BABYLON {
    class DisplayPassPostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class FilterPostProcess extends PostProcess {
        public kernelMatrix: Matrix;
        constructor(name: string, kernelMatrix: Matrix, ratio: number, camera?: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class FxaaPostProcess extends PostProcess {
        public texelWidth: number;
        public texelHeight: number;
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class OculusDistortionCorrectionPostProcess extends PostProcess {
        public aspectRatio: number;
        private _isRightEye;
        private _distortionFactors;
        private _postProcessScaleFactor;
        private _lensCenterOffset;
        private _scaleIn;
        private _scaleFactor;
        private _lensCenter;
        constructor(name: string, camera: Camera, isRightEye: boolean, cameraSettings: any);
    }
}
declare module BABYLON {
    class PassPostProcess extends PostProcess {
        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
    }
}
declare module BABYLON {
    class PostProcess {
        public name: string;
        public onApply: (Effect: any) => void;
        public onBeforeRender: (Effect: any) => void;
        public onSizeChanged: () => void;
        public onActivate: (Camera: any) => void;
        public width: number;
        public height: number;
        public renderTargetSamplingMode: number;
        private _camera;
        private _scene;
        private _engine;
        private _renderRatio;
        private _reusable;
        public _textures: SmartArray<WebGLTexture>;
        public _currentRenderTextureInd: number;
        private _effect;
        constructor(name: string, fragmentUrl: string, parameters: string[], samplers: string[], ratio: number, camera: Camera, samplingMode: number, engine?: Engine, reusable?: boolean);
        public isReusable(): boolean;
        public activate(camera: Camera, sourceTexture?: WebGLTexture): void;
        public apply(): Effect;
        public dispose(camera: Camera): void;
    }
}
declare module BABYLON {
    class PostProcessManager {
        private _scene;
        private _indexBuffer;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        constructor(scene: Scene);
        public _prepareFrame(sourceTexture?: WebGLTexture): boolean;
        public _finalizeFrame(doNotPresent?: boolean, targetTexture?: WebGLTexture): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class RefractionPostProcess extends PostProcess {
        public color: Color3;
        public depth: number;
        public colorLevel: number;
        private _refRexture;
        constructor(name: string, refractionTextureUrl: string, color: Color3, depth: number, colorLevel: number, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
        public dispose(camera: Camera): void;
    }
}
declare module BABYLON {
    class PostProcessRenderEffect {
        private _engine;
        private _postProcesses;
        private _getPostProcess;
        private _singleInstance;
        private _cameras;
        private _indicesForCamera;
        private _renderPasses;
        private _renderEffectAsPasses;
        public _name: string;
        public applyParameters: (postProcess: PostProcess) => void;
        constructor(engine: Engine, name: string, getPostProcess: () => PostProcess, singleInstance?: boolean);
        public _update(): void;
        public addPass(renderPass: PostProcessRenderPass): void;
        public removePass(renderPass: PostProcessRenderPass): void;
        public addRenderEffectAsPass(renderEffect: PostProcessRenderEffect): void;
        public getPass(passName: string): void;
        public emptyPasses(): void;
        public _attachCameras(cameras: Camera): any;
        public _attachCameras(cameras: Camera[]): any;
        public _detachCameras(cameras: Camera): any;
        public _detachCameras(cameras: Camera[]): any;
        public _enable(cameras: Camera): any;
        public _enable(cameras: Camera[]): any;
        public _disable(cameras: Camera): any;
        public _disable(cameras: Camera[]): any;
        public getPostProcess(camera?: Camera): PostProcess;
        private _linkParameters();
        private _linkTextures(effect);
    }
}
declare module BABYLON {
    class PostProcessRenderPass {
        private _enabled;
        private _renderList;
        private _renderTexture;
        private _scene;
        private _refCount;
        public _name: string;
        constructor(scene: Scene, name: string, size: number, renderList: Mesh[], beforeRender: () => void, afterRender: () => void);
        public _incRefCount(): number;
        public _decRefCount(): number;
        public _update(): void;
        public setRenderList(renderList: Mesh[]): void;
        public getRenderTexture(): RenderTargetTexture;
    }
}
declare module BABYLON {
    class PostProcessRenderPipeline {
        private _engine;
        private _renderEffects;
        private _renderEffectsForIsolatedPass;
        private _cameras;
        public _name: string;
        private static PASS_EFFECT_NAME;
        private static PASS_SAMPLER_NAME;
        constructor(engine: Engine, name: string);
        public addEffect(renderEffect: PostProcessRenderEffect): void;
        public _enableEffect(renderEffectName: string, cameras: Camera): any;
        public _enableEffect(renderEffectName: string, cameras: Camera[]): any;
        public _disableEffect(renderEffectName: string, cameras: Camera): any;
        public _disableEffect(renderEffectName: string, cameras: Camera[]): any;
        public _attachCameras(cameras: Camera, unique: boolean): any;
        public _attachCameras(cameras: Camera[], unique: boolean): any;
        public _detachCameras(cameras: Camera): any;
        public _detachCameras(cameras: Camera[]): any;
        public _enableDisplayOnlyPass(passName: any, cameras: Camera): any;
        public _enableDisplayOnlyPass(passName: any, cameras: Camera[]): any;
        public _disableDisplayOnlyPass(cameras: Camera): any;
        public _disableDisplayOnlyPass(cameras: Camera[]): any;
        public _update(): void;
    }
}
declare module BABYLON {
    class PostProcessRenderPipelineManager {
        private _renderPipelines;
        constructor();
        public addPipeline(renderPipeline: PostProcessRenderPipeline): void;
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera, unique?: boolean): any;
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera[], unique?: boolean): any;
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera): any;
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera[]): any;
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): any;
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): any;
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): any;
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): any;
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera): any;
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera[]): any;
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera): any;
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera[]): any;
        public update(): void;
    }
}
declare module BABYLON {
    class BoundingBoxRenderer {
        public frontColor: Color3;
        public backColor: Color3;
        public showBackLines: boolean;
        public renderList: SmartArray<BoundingBox>;
        private _scene;
        private _colorShader;
        private _vb;
        private _ib;
        constructor(scene: Scene);
        public reset(): void;
        public render(): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class DepthRenderer {
        private _scene;
        private _depthMap;
        private _effect;
        private _viewMatrix;
        private _projectionMatrix;
        private _transformMatrix;
        private _worldViewProjection;
        private _cachedDefines;
        constructor(scene: Scene, type?: number);
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        public getDepthMap(): RenderTargetTexture;
        public dispose(): void;
    }
}
declare module BABYLON {
    class OutlineRenderer {
        private _scene;
        private _effect;
        private _cachedDefines;
        constructor(scene: Scene);
        public render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay?: boolean): void;
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean;
    }
}
declare module BABYLON {
    class RenderingGroup {
        public index: number;
        private _scene;
        private _opaqueSubMeshes;
        private _transparentSubMeshes;
        private _alphaTestSubMeshes;
        private _activeVertices;
        constructor(index: number, scene: Scene);
        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>) => void): boolean;
        public prepare(): void;
        public dispatch(subMesh: SubMesh): void;
    }
}
declare module BABYLON {
    class RenderingManager {
        static MAX_RENDERINGGROUPS: number;
        private _scene;
        private _renderingGroups;
        private _depthBufferAlreadyCleaned;
        constructor(scene: Scene);
        private _renderParticles(index, activeMeshes);
        private _renderSprites(index);
        private _clearDepthBuffer();
        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>) => void, activeMeshes: AbstractMesh[], renderParticles: boolean, renderSprites: boolean): void;
        public reset(): void;
        public dispatch(subMesh: SubMesh): void;
    }
}
declare module BABYLON {
    class Sprite {
        public name: string;
        public position: Vector3;
        public color: Color4;
        public size: number;
        public angle: number;
        public cellIndex: number;
        public invertU: number;
        public invertV: number;
        public disposeWhenFinishedAnimating: boolean;
        public animations: Animation[];
        private _animationStarted;
        private _loopAnimation;
        private _fromIndex;
        private _toIndex;
        private _delay;
        private _direction;
        private _frameCount;
        private _manager;
        private _time;
        constructor(name: string, manager: SpriteManager);
        public playAnimation(from: number, to: number, loop: boolean, delay: number): void;
        public stopAnimation(): void;
        public _animate(deltaTime: number): void;
        public dispose(): void;
    }
}
declare module BABYLON {
    class SpriteManager {
        public name: string;
        public cellSize: number;
        public sprites: Sprite[];
        public renderingGroupId: number;
        public onDispose: () => void;
        public fogEnabled: boolean;
        private _capacity;
        private _spriteTexture;
        private _epsilon;
        private _scene;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        private _indexBuffer;
        private _vertices;
        private _effectBase;
        private _effectFog;
        constructor(name: string, imgUrl: string, capacity: number, cellSize: number, scene: Scene, epsilon?: number);
        private _appendSpriteVertex(index, sprite, offsetX, offsetY, rowSize);
        public render(): void;
        public dispose(): void;
    }
}
declare module BABYLON.Internals {
    class AndOrNotEvaluator {
        static Eval(query: string, evaluateCallback: (val: any) => boolean): boolean;
        private static _HandleParenthesisContent(parenthesisContent, evaluateCallback);
        private static _SimplifyNegation(booleanString);
    }
}
declare module BABYLON {
    interface IAssetTask {
        onSuccess: (task: IAssetTask) => void;
        onError: (task: IAssetTask) => void;
        isCompleted: boolean;
        run(scene: Scene, onSuccess: () => void, onError: () => void): any;
    }
    class MeshAssetTask implements IAssetTask {
        public name: string;
        public meshesNames: any;
        public rootUrl: string;
        public sceneFilename: string;
        public loadedMeshes: AbstractMesh[];
        public loadedParticleSystems: ParticleSystem[];
        public loadedSkeletons: Skeleton[];
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        constructor(name: string, meshesNames: any, rootUrl: string, sceneFilename: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class TextFileAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public text: string;
        constructor(name: string, url: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class BinaryFileAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public data: ArrayBuffer;
        constructor(name: string, url: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class ImageAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public image: HTMLImageElement;
        constructor(name: string, url: string);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class TextureAssetTask implements IAssetTask {
        public name: string;
        public url: string;
        public noMipmap: boolean;
        public invertY: boolean;
        public samplingMode: number;
        public onSuccess: (task: IAssetTask) => void;
        public onError: (task: IAssetTask) => void;
        public isCompleted: boolean;
        public texture: Texture;
        constructor(name: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode?: number);
        public run(scene: Scene, onSuccess: () => void, onError: () => void): void;
    }
    class AssetsManager {
        private _tasks;
        private _scene;
        private _waitingTasksCount;
        public onFinish: (tasks: IAssetTask[]) => void;
        public onTaskSuccess: (task: IAssetTask) => void;
        public onTaskError: (task: IAssetTask) => void;
        public useDefaultLoadingScreen: boolean;
        constructor(scene: Scene);
        public addMeshTask(taskName: string, meshesNames: any, rootUrl: string, sceneFilename: string): IAssetTask;
        public addTextFileTask(taskName: string, url: string): IAssetTask;
        public addBinaryFileTask(taskName: string, url: string): IAssetTask;
        public addImageTask(taskName: string, url: string): IAssetTask;
        public addTextureTask(taskName: string, url: string, noMipmap?: boolean, invertY?: boolean, samplingMode?: number): IAssetTask;
        private _decreaseWaitingTasksCount();
        private _runTask(task);
        public reset(): AssetsManager;
        public load(): AssetsManager;
    }
}
declare module BABYLON {
    class Database {
        private callbackManifestChecked;
        private currentSceneUrl;
        private db;
        private enableSceneOffline;
        private enableTexturesOffline;
        private manifestVersionFound;
        private mustUpdateRessources;
        private hasReachedQuota;
        private isSupported;
        private idbFactory;
        static isUASupportingBlobStorage: boolean;
        constructor(urlToScene: string, callbackManifestChecked: (boolean: any) => any);
        static parseURL: (url: string) => string;
        static ReturnFullUrlLocation: (url: string) => string;
        public checkManifestFile(): void;
        public openAsync(successCallback: any, errorCallback: any): void;
        public loadImageFromDB(url: string, image: HTMLImageElement): void;
        private _loadImageFromDBAsync(url, image, notInDBCallback);
        private _saveImageIntoDBAsync(url, image);
        private _checkVersionFromDB(url, versionLoaded);
        private _loadVersionFromDBAsync(url, callback, updateInDBCallback);
        private _saveVersionIntoDBAsync(url, callback);
        private loadFileFromDB(url, sceneLoaded, progressCallBack, errorCallback, useArrayBuffer?);
        private _loadFileFromDBAsync(url, callback, notInDBCallback, useArrayBuffer?);
        private _saveFileIntoDBAsync(url, callback, progressCallback, useArrayBuffer?);
    }
}
declare module BABYLON {
    class FilesInput {
        private engine;
        private currentScene;
        private canvas;
        private sceneLoadedCallback;
        private progressCallback;
        private additionnalRenderLoopLogicCallback;
        private textureLoadingCallback;
        private startingProcessingFilesCallback;
        private elementToMonitor;
        static FilesTextures: any[];
        static FilesToLoad: any[];
        constructor(p_engine: Engine, p_scene: Scene, p_canvas: HTMLCanvasElement, p_sceneLoadedCallback: any, p_progressCallback: any, p_additionnalRenderLoopLogicCallback: any, p_textureLoadingCallback: any, p_startingProcessingFilesCallback: any);
        public monitorElementForDragNDrop(p_elementToMonitor: HTMLElement): void;
        private renderFunction();
        private drag(e);
        private drop(eventDrop);
        private loadFiles(event);
    }
}
declare module BABYLON {
    class Gamepads {
        private babylonGamepads;
        private oneGamepadConnected;
        private isMonitoring;
        private gamepadEventSupported;
        private gamepadSupportAvailable;
        private _callbackGamepadConnected;
        private buttonADataURL;
        private static gamepadDOMInfo;
        constructor(ongamedpadconnected: (gamepad: Gamepad) => void);
        private _insertGamepadDOMInstructions();
        private _insertGamepadDOMNotSupported();
        public dispose(): void;
        private _onGamepadConnected(evt);
        private _addNewGamepad(gamepad);
        private _onGamepadDisconnected(evt);
        private _startMonitoringGamepads();
        private _stopMonitoringGamepads();
        private _checkGamepadsStatus();
        private _updateGamepadObjects();
    }
    class StickValues {
        public x: any;
        public y: any;
        constructor(x: any, y: any);
    }
    class Gamepad {
        public id: string;
        public index: number;
        public browserGamepad: any;
        private _leftStick;
        private _rightStick;
        private _onleftstickchanged;
        private _onrightstickchanged;
        constructor(id: string, index: number, browserGamepad: any);
        public onleftstickchanged(callback: (values: StickValues) => void): void;
        public onrightstickchanged(callback: (values: StickValues) => void): void;
        public leftStick : StickValues;
        public rightStick : StickValues;
        public update(): void;
    }
    class GenericPad extends Gamepad {
        public id: string;
        public index: number;
        public gamepad: any;
        private _buttons;
        private _onbuttondown;
        private _onbuttonup;
        public onbuttondown(callback: (buttonPressed: number) => void): void;
        public onbuttonup(callback: (buttonReleased: number) => void): void;
        constructor(id: string, index: number, gamepad: any);
        private _setButtonValue(newValue, currentValue, buttonIndex);
        public update(): void;
    }
    enum Xbox360Button {
        A = 0,
        B = 1,
        X = 2,
        Y = 3,
        Start = 4,
        Back = 5,
        LB = 6,
        RB = 7,
        LeftStick = 8,
        RightStick = 9,
    }
    enum Xbox360Dpad {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3,
    }
    class Xbox360Pad extends Gamepad {
        private _leftTrigger;
        private _rightTrigger;
        private _onlefttriggerchanged;
        private _onrighttriggerchanged;
        private _onbuttondown;
        private _onbuttonup;
        private _ondpaddown;
        private _ondpadup;
        private _buttonA;
        private _buttonB;
        private _buttonX;
        private _buttonY;
        private _buttonBack;
        private _buttonStart;
        private _buttonLB;
        private _buttonRB;
        private _buttonLeftStick;
        private _buttonRightStick;
        private _dPadUp;
        private _dPadDown;
        private _dPadLeft;
        private _dPadRight;
        public onlefttriggerchanged(callback: (value: number) => void): void;
        public onrighttriggerchanged(callback: (value: number) => void): void;
        public leftTrigger : number;
        public rightTrigger : number;
        public onbuttondown(callback: (buttonPressed: Xbox360Button) => void): void;
        public onbuttonup(callback: (buttonReleased: Xbox360Button) => void): void;
        public ondpaddown(callback: (dPadPressed: Xbox360Dpad) => void): void;
        public ondpadup(callback: (dPadReleased: Xbox360Dpad) => void): void;
        private _setButtonValue(newValue, currentValue, buttonType);
        private _setDPadValue(newValue, currentValue, buttonType);
        public buttonA : number;
        public buttonB : number;
        public buttonX : number;
        public buttonY : number;
        public buttonStart : number;
        public buttonBack : number;
        public buttonLB : number;
        public buttonRB : number;
        public buttonLeftStick : number;
        public buttonRightStick : number;
        public dPadUp : number;
        public dPadDown : number;
        public dPadLeft : number;
        public dPadRight : number;
        public update(): void;
    }
}
interface Navigator {
    getGamepads(func?: any): any;
    webkitGetGamepads(func?: any): any;
    msGetGamepads(func?: any): any;
    webkitGamepads(func?: any): any;
}
declare module BABYLON {
    class SceneOptimization {
        public priority: number;
        public apply: (scene: Scene) => boolean;
        constructor(priority?: number);
    }
    class TextureOptimization extends SceneOptimization {
        public priority: number;
        public maximumSize: number;
        constructor(priority?: number, maximumSize?: number);
        public apply: (scene: Scene) => boolean;
    }
    class HardwareScalingOptimization extends SceneOptimization {
        public priority: number;
        public maximumScale: number;
        private _currentScale;
        constructor(priority?: number, maximumScale?: number);
        public apply: (scene: Scene) => boolean;
    }
    class ShadowsOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class PostProcessesOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class LensFlaresOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class ParticlesOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class RenderTargetsOptimization extends SceneOptimization {
        public apply: (scene: Scene) => boolean;
    }
    class MergeMeshesOptimization extends SceneOptimization {
        private _canBeMerged;
        public apply: (scene: Scene) => boolean;
    }
    class SceneOptimizerOptions {
        public targetFrameRate: number;
        public trackerDuration: number;
        public optimizations: SceneOptimization[];
        constructor(targetFrameRate?: number, trackerDuration?: number);
        static LowDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
        static ModerateDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
        static HighDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions;
    }
    class SceneOptimizer {
        static _CheckCurrentState(scene: Scene, options: SceneOptimizerOptions, currentPriorityLevel: number, onSuccess?: () => void, onFailure?: () => void): void;
        static OptimizeAsync(scene: Scene, options?: SceneOptimizerOptions, onSuccess?: () => void, onFailure?: () => void): void;
    }
}
declare module BABYLON {
    class SceneSerializer {
        static Serialize(scene: Scene): any;
    }
}
declare module BABYLON {
    class SmartArray<T> {
        public data: T[];
        public length: number;
        private _id;
        private _duplicateId;
        constructor(capacity: number);
        public push(value: any): void;
        public pushNoDuplicate(value: any): void;
        public sort(compareFn: any): void;
        public reset(): void;
        public concat(array: any): void;
        public concatWithNoDuplicate(array: any): void;
        public indexOf(value: any): number;
        private static _GlobalId;
    }
}
declare module BABYLON {
    class Tags {
        static EnableFor(obj: any): void;
        static DisableFor(obj: any): void;
        static HasTags(obj: any): boolean;
        static GetTags(obj: any): any;
        static AddTagsTo(obj: any, tagsString: string): void;
        static _AddTagTo(obj: any, tag: string): void;
        static RemoveTagsFrom(obj: any, tagsString: string): void;
        static _RemoveTagFrom(obj: any, tag: string): void;
        static MatchesQuery(obj: any, tagsQuery: string): boolean;
    }
}
declare module BABYLON {
    interface IAnimatable {
        animations: Animation[];
    }
    interface ISize {
        width: number;
        height: number;
    }
    class Tools {
        static BaseUrl: string;
        static GetExponantOfTwo: (value: number, max: number) => number;
        static GetFilename(path: string): string;
        static GetDOMTextContent(element: HTMLElement): string;
        static ToDegrees(angle: number): number;
        static ToRadians(angle: number): number;
        static ExtractMinAndMaxIndexed(positions: number[], indices: number[], indexStart: number, indexCount: number): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static ExtractMinAndMax(positions: number[], start: number, count: number): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static MakeArray(obj: any, allowsNullUndefined?: boolean): any[];
        static GetPointerPrefix(): string;
        static QueueNewFrame(func: any): void;
        static RequestFullscreen(element: any): void;
        static ExitFullscreen(): void;
        static CleanUrl(url: string): string;
        static LoadImage(url: string, onload: any, onerror: any, database: any): HTMLImageElement;
        static LoadFile(url: string, callback: (data: any) => void, progressCallBack?: () => void, database?: any, useArrayBuffer?: boolean, onError?: () => void): void;
        static ReadFileAsDataURL(fileToLoad: any, callback: any, progressCallback: any): void;
        static ReadFile(fileToLoad: any, callback: any, progressCallBack: any, useArrayBuffer?: boolean): void;
        static Clamp(value: number, min?: number, max?: number): number;
        static Sign(value: number): number;
        static Format(value: number, decimals?: number): string;
        static CheckExtends(v: Vector3, min: Vector3, max: Vector3): void;
        static WithinEpsilon(a: number, b: number, epsilon?: number): boolean;
        static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void;
        static IsEmpty(obj: any): boolean;
        static RegisterTopRootEvents(events: {
            name: string;
            handler: EventListener;
        }[]): void;
        static UnregisterTopRootEvents(events: {
            name: string;
            handler: EventListener;
        }[]): void;
        static CreateScreenshot(engine: Engine, camera: Camera, size: any): void;
        static ValidateXHRData(xhr: XMLHttpRequest, dataType?: number): boolean;
        private static _NoneLogLevel;
        private static _MessageLogLevel;
        private static _WarningLogLevel;
        private static _ErrorLogLevel;
        private static _LogCache;
        static OnNewCacheEntry: (entry: string) => void;
        static NoneLogLevel : number;
        static MessageLogLevel : number;
        static WarningLogLevel : number;
        static ErrorLogLevel : number;
        static AllLogLevel : number;
        private static _AddLogEntry(entry);
        private static _FormatMessage(message);
        static Log: (message: string) => void;
        private static _LogDisabled(message);
        private static _LogEnabled(message);
        static Warn: (message: string) => void;
        private static _WarnDisabled(message);
        private static _WarnEnabled(message);
        static Error: (message: string) => void;
        private static _ErrorDisabled(message);
        private static _ErrorEnabled(message);
        static LogCache : string;
        static LogLevels : number;
        private static _PerformanceNoneLogLevel;
        private static _PerformanceUserMarkLogLevel;
        private static _PerformanceConsoleLogLevel;
        private static _performance;
        static PerformanceNoneLogLevel : number;
        static PerformanceUserMarkLogLevel : number;
        static PerformanceConsoleLogLevel : number;
        static PerformanceLogLevel : number;
        static _StartPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _EndPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _StartUserMark(counterName: string, condition?: boolean): void;
        static _EndUserMark(counterName: string, condition?: boolean): void;
        static _StartPerformanceConsole(counterName: string, condition?: boolean): void;
        static _EndPerformanceConsole(counterName: string, condition?: boolean): void;
        static StartPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static EndPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static Now : number;
        static GetFps(): number;
    }
    /**
    * An implementation of a loop for asynchronous functions.
    */
    class AsyncLoop {
        public iterations: number;
        private _fn;
        private _successCallback;
        public index: number;
        private _done;
        /**
        * Constroctor.
        * @param iterations the number of iterations.
        * @param _fn the function to run each iteration
        * @param _successCallback the callback that will be called upon succesful execution
        * @param offset starting offset.
        */
        constructor(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset?: number);
        /**
        * Execute the next iteration. Must be called after the last iteration was finished.
        */
        public executeNext(): void;
        /**
        * Break the loop and run the success callback.
        */
        public breakLoop(): void;
        /**
        * Helper function
        */
        static Run(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset?: number): AsyncLoop;
        /**
        * A for-loop that will run a given number of iterations synchronous and the rest async.
        * @param iterations total number of iterations
        * @param syncedIterations number of synchronous iterations in each async iteration.
        * @param fn the function to call each iteration.
        * @param callback a success call back that will be called when iterating stops.
        * @param breakFunction a break condition (optional)
        * @param timeout timeout settings for the setTimeout function. default - 0.
        * @constructor
        */
        static SyncAsyncForLoop(iterations: number, syncedIterations: number, fn: (iteration: number) => void, callback: () => void, breakFunction?: () => boolean, timeout?: number): void;
    }
}
declare module BABYLON.Internals {
    interface DDSInfo {
        width: number;
        height: number;
        mipmapCount: number;
        isFourCC: boolean;
        isRGB: boolean;
        isLuminance: boolean;
        isCube: boolean;
    }
    class DDSTools {
        static GetDDSInfo(arrayBuffer: any): DDSInfo;
        private static GetRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        private static GetRGBArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        private static GetLuminanceArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer);
        static UploadDDSLevels(gl: WebGLRenderingContext, ext: any, arrayBuffer: any, info: DDSInfo, loadMipmaps: boolean, faces: number): void;
    }
}
declare module BABYLON.Internals {
    class TGATools {
        private static _TYPE_NO_DATA;
        private static _TYPE_INDEXED;
        private static _TYPE_RGB;
        private static _TYPE_GREY;
        private static _TYPE_RLE_INDEXED;
        private static _TYPE_RLE_RGB;
        private static _TYPE_RLE_GREY;
        private static _ORIGIN_MASK;
        private static _ORIGIN_SHIFT;
        private static _ORIGIN_BL;
        private static _ORIGIN_BR;
        private static _ORIGIN_UL;
        private static _ORIGIN_UR;
        static GetTGAHeader(data: Uint8Array): any;
        static UploadContent(gl: WebGLRenderingContext, data: Uint8Array): void;
        static _getImageData8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData24bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageData32bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageDataGrey8bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
        static _getImageDataGrey16bits(header: any, palettes: Uint8Array, pixel_data: Uint8Array, y_start: number, y_step: number, y_end: number, x_start: number, x_step: number, x_end: number): Uint8Array;
    }
}
declare module BABYLON {
    enum JoystickAxis {
        X = 0,
        Y = 1,
        Z = 2,
    }
    class VirtualJoystick {
        public reverseLeftRight: boolean;
        public reverseUpDown: boolean;
        public deltaPosition: Vector3;
        public pressed: boolean;
        private static _globalJoystickIndex;
        private static vjCanvas;
        private static vjCanvasContext;
        private static vjCanvasWidth;
        private static vjCanvasHeight;
        private static halfWidth;
        private static halfHeight;
        private _action;
        private _axisTargetedByLeftAndRight;
        private _axisTargetedByUpAndDown;
        private _joystickSensibility;
        private _inversedSensibility;
        private _rotationSpeed;
        private _inverseRotationSpeed;
        private _rotateOnAxisRelativeToMesh;
        private _joystickPointerID;
        private _joystickColor;
        private _joystickPointerPos;
        private _joystickPointerStartPos;
        private _deltaJoystickVector;
        private _leftJoystick;
        private _joystickIndex;
        private _touches;
        constructor(leftJoystick?: boolean);
        public setJoystickSensibility(newJoystickSensibility: number): void;
        private _onPointerDown(e);
        private _onPointerMove(e);
        private _onPointerUp(e);
        /**
        * Change the color of the virtual joystick
        * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
        */
        public setJoystickColor(newColor: string): void;
        public setActionOnTouch(action: () => any): void;
        public setAxisForLeftRight(axis: JoystickAxis): void;
        public setAxisForUpDown(axis: JoystickAxis): void;
        private _clearCanvas();
        private _drawVirtualJoystick();
        public releaseCanvas(): void;
    }
}
declare module BABYLON.VirtualJoystick {
    class Collection<T> {
        private _count;
        private _collection;
        constructor();
        public Count(): number;
        public add<T>(key: string, item: T): number;
        public remove(key: string): number;
        public item(key: string): any;
        public forEach<T>(block: (item: T) => void): void;
    }
}

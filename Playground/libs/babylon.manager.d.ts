declare module BABYLON {
    /**
     * Babylon scene manager class
     * @class SceneManager - All rights reserved (c) 2020 Mackey Kinard
     */
    class SceneManager {
        /** Gets the toolkit framework version number */
        static get Version(): string;
        /** Gets the toolkit framework copyright notice */
        static get Copyright(): string;
        /** Set the allow user input flag */
        static EnableUserInput: boolean;
        /** Enable the main page render loop */
        static RenderLoopReady: boolean;
        /** Pauses the main page render loop */
        static PauseRenderLoop: boolean;
        /** Set the preload auto update progress flag */
        static AutoUpdateProgress: boolean;
        /** Gets the running status of the default audio context */
        static HasAudioContext(): boolean;
        /** Returns a Promise that resolves after the specfied time */
        static WaitForSeconds: (seconds: number) => Promise<void>;
        /** Register handler that is triggered when then engine has been resized (engine.html) */
        static OnEngineResizeObservable: Observable<Engine>;
        /** Register handler that is triggered when the scene has been loaded (engine.html) */
        static OnLoadCompleteObservable: Observable<Engine>;
        /** Registers an handler for window state show scene loader function (engine.html) */
        static RegisterOnShowSceneLoader(func: (show: boolean) => void): void;
        /** Registers an handler for window socket disconnect event (engine.html) */
        static RegisterOnUpdateSceneLoader(func: (status: string, details: string, state: number) => void): void;
        /** Registers an handler for window state show scene loader function (engine.html) */
        static RegisterOnTickSceneLoader(func: (percent: number) => void): void;
        /** Loads a babylon scene file using the page loader window hooks (engine.html) */
        static LoadSceneFile(sceneFile: string, queryString?: string): void;
        /** Shows the top page scene loader (engine.html) */
        static ShowParentLoader(show: boolean, duration?: number): void;
        /** Get the system render quality local storage setting. */
        static GetRenderQuality(): BABYLON.RenderQuality;
        /** Set the system render quality local storage setting. */
        static SetRenderQuality(quality: BABYLON.RenderQuality): void;
        /** Get the system virtual reality local storage setting. */
        static GetVirtualRealityEnabled(): boolean;
        /** Set the system virtual reality local storage setting. */
        static SetVirtualRealityEnabled(enabled: boolean): void;
        /** Get an item from top window local storage. */
        static GetLocalStorageItem(key: string): string;
        /** Set an item to top window local storage. */
        static SetLocalStorageItem(key: string, value: string): void;
        /** Get an item from top window session storage. */
        static GetSessionStorageItem(key: string): string;
        /** Set an item to top window session storage. */
        static SetSessionStorageItem(key: string, value: string): void;
        /** Store data object in the window state cache */
        static SetWindowState(name: string, data: any): void;
        /** Retrieve data object from the window state cache */
        static GetWindowState<T>(name: string): T;
        /** Post a safe message to top or local window */
        static PostWindowMessage(msg: any, targetOrigin: string, transfer?: Transferable[]): void;
        private static SceneParsingEnabled;
        /** Enable scene loader parsing plugin */
        static EnableSceneParsing(enabled: boolean): void;
        /** Is scene loader parsing plugin enabled */
        static IsSceneParsingEnabled(): boolean;
        private static AdvDynamicTexture;
        /** Get the default fullscreen user interface advanced dynamic texture */
        static GetFullscreenUI(scene: BABYLON.Scene): BABYLON.GUI.AdvancedDynamicTexture;
        /** Get the scene default ambient skybox mesh */
        static GetAmbientSkybox(scene: BABYLON.Scene): BABYLON.AbstractMesh;
        /** Get the scene default intenisty factor */
        static GetIntensityFactor(): number;
        /** Are scene manager debugging services available. */
        static IsDebugMode(): boolean;
        /** Send log data directly to the console. */
        static ConsoleLog(...data: any[]): void;
        /** Send info data directly to the console. */
        static ConsoleInfo(...data: any[]): void;
        /** Send warning data directly to the console. */
        static ConsoleWarn(...data: any[]): void;
        /** Send error data directly to the console. */
        static ConsoleError(...data: any[]): void;
        /** Logs a message to the console using the babylon logging system. */
        static LogMessage(message: string): void;
        /** Logs a warning to the console using babylon logging system. */
        static LogWarning(warning: string): void;
        /** Logs a error to the console using babylon logging system. */
        static LogError(error: string): void;
        /** Are unversial windows platform services available. */
        static IsWindows(): boolean;
        /** Are mobile cordova platform services available. */
        static IsCordova(): boolean;
        /** Are web assembly platform services available. */
        static IsWebAssembly(): boolean;
        /** Is oculus browser platform agent. */
        static IsOculusBrowser(): boolean;
        /** Is samsung browser platform agent. */
        static IsSamsungBrowser(): boolean;
        /** Is windows phone platform agent. */
        static IsWindowsPhone(): boolean;
        /** Is blackberry web platform agent. */
        static IsBlackBerry(): boolean;
        /** Is opera web platform agent. */
        static IsOperaMini(): boolean;
        /** Is android web platform agent. */
        static IsAndroid(): boolean;
        /** Is web os platform agent. */
        static IsWebOS(): boolean;
        /** Is ios web platform agent. */
        static IsIOS(): boolean;
        /** Is iphone web platform agent. */
        static IsIPHONE(): boolean;
        /** Is ipad web platform agent. */
        static IsIPAD(): boolean;
        /** Is ipod web platform agent. */
        static IsIPOD(): boolean;
        /** Is internet explorer 11 platform agent. */
        static IsIE11(): boolean;
        /** Is mobile web platform agent. */
        static IsMobile(): boolean;
        /** Are playstation services available. */
        static IsPlaystation(): boolean;
        /** Are xbox console services available. */
        static IsXboxConsole(): boolean;
        /** Are xbox live platform services available. */
        static IsXboxLive(): boolean;
        /** Get the current time in seconds */
        static GetTime(): number;
        /** Get the total game time in seconds */
        static GetGameTime(): number;
        /** Get the current delta time in seconds */
        static GetDeltaSeconds(scene: BABYLON.Scene): number;
        /** Get the delta time animation ratio for 60 fps */
        static GetAnimationRatio(scene: BABYLON.Scene): number;
        /** Delays a function call using request animation frames. Returns a handle object */
        static SetTimeout(timeout: number, func: () => void): any;
        /** Calls request animation frame delay with handle to cancel pending timeout call */
        static ClearTimeout(handle: any): void;
        /** Repeats a function call using request animation frames. Retuns a handle object */
        static SetInterval(interval: number, func: () => void): any;
        /** Calls request animation frame repeast with handle to clear pending interval call. */
        static ClearInterval(handle: any): void;
        /** Run a function on the next render loop. */
        static RunOnce(scene: BABYLON.Scene, func: () => void, timeout?: number): void;
        /** Popup debug layer in window. */
        static PopupDebug(scene: BABYLON.Scene): void;
        /** Toggle debug layer on and off. */
        static ToggleDebug(scene: BABYLON.Scene, embed?: boolean, parent?: HTMLElement): void;
        /** Disposes entire scene and release all resources */
        static DisposeScene(scene: BABYLON.Scene, clearColor?: BABYLON.Color4): void;
        /** Safely destroy transform node */
        static SafeDestroy(transform: BABYLON.TransformNode, delay?: number, disable?: boolean): void;
        /** Open alert message dialog. */
        static AlertMessage(text: string, title?: string): any;
        /**  Gets the names query string from page url. */
        static GetQueryStringParam(name: string, url: string): string;
        /** Gets the current engine WebGL version string info. */
        static GetWebGLVersionString(scene: BABYLON.Scene): string;
        /** Gets the current engine WebGL version number info. */
        static GetWebGLVersionNumber(scene: BABYLON.Scene): number;
        /** Get the root url the last scene properties was loaded from */
        static GetRootUrl(scene: BABYLON.Scene): string;
        /** Sets the root url the last scene properties was loaded from */
        static SetRootUrl(scene: BABYLON.Scene, url: string): void;
        /** Get the file name the last scene properties was loaded from */
        static GetSceneFile(scene: BABYLON.Scene): string;
        /** Sets the file name the last scene properties was loaded from */
        static SetSceneFile(scene: BABYLON.Scene, fileName: string): void;
        /** Get the right hand loader flag the last scene properties was loaded from */
        static GetRightHanded(scene: BABYLON.Scene): boolean;
        /** Sets the right hand loader flag the last scene properties was loaded from */
        static SetRightHanded(scene: BABYLON.Scene, righty: boolean): void;
        /** Set the Windows Runtime preferred launch windowing mode. (Example: Windows.UI.ViewManagement.ApplicationViewWindowingMode.fullScreen = 1) */
        static SetWindowsLaunchMode(mode?: number): void;
        /** Show the default page error message. */
        static ShowPageErrorMessage(message: string, title?: string, timeout?: number): void;
        /** Quit the Windows Runtime host application. */
        static QuitWindowsApplication(): void;
        /** Loads a file as text (IFileRequest) */
        static LoadTextFile(url: string, onSuccess: (data: string) => void, onProgress?: (data: any) => void, onError?: (request?: WebRequest, exception?: any) => void): BABYLON.IFileRequest;
        /** Load a text based file */
        static LoadTextFileAsync(url: string): Promise<string>;
        /** Post data to server (XmlHttpRequest) */
        static PostDataToServer(url: string, data: string | Document | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array>, contentType?: string, onSuccess?: (status: int) => void, onFailure?: (reason: any) => void): XMLHttpRequest;
        /** Post data to server asynchronously */
        static PostDataToServerAsync(url: string, data: string | Document | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array>, contentType?: string): Promise<number>;
        /** Shows the default page scene loader. */
        static ShowSceneLoader(): void;
        /** Hides the default page scene loader. */
        static HideSceneLoader(): void;
        /** Update the default page scene loader status. */
        static UpdateLoaderStatus(status: string, details: string, state: number): void;
        /** Gets all the created engine instances */
        static GetEngineInstances(): BABYLON.Engine[];
        /** Get the last create engine instance */
        static GetLastCreatedEngine(): BABYLON.Engine;
        /** Get the last created scene instance */
        static GetLastCreatedScene(): BABYLON.Scene;
        /** Get managed asset container. */
        static GetAssetContainer(scene: BABYLON.Scene, name: string): BABYLON.AssetContainer;
        /** Set managed asset container. */
        static SetAssetContainer(scene: BABYLON.Scene, name: string, container: BABYLON.AssetContainer): void;
        /** Clear all managed asset containers. */
        static ClearAssetContainers(scene: BABYLON.Scene): void;
        /** Gets the specified mesh by name from scene. */
        static GetMesh(scene: BABYLON.Scene, name: string): BABYLON.Mesh;
        /** Gets the specified mesh by id from scene. */
        static GetMeshByID(scene: BABYLON.Scene, id: string): BABYLON.Mesh;
        /** Gets the specified abstract mesh by name from scene. */
        static GetAbstractMesh(scene: BABYLON.Scene, name: string): BABYLON.AbstractMesh;
        /** Gets the specified abstract mesh by id from scene. */
        static GetAbstractMeshByID(scene: BABYLON.Scene, id: string): BABYLON.AbstractMesh;
        /** Gets the specified transform node by name from scene. */
        static GetTransformNode(scene: BABYLON.Scene, name: string): BABYLON.TransformNode;
        /** Gets the specified transform node by id from scene. */
        static GetTransformNodeByID(scene: BABYLON.Scene, id: string): BABYLON.TransformNode;
        /** Gets the transform node child detail mesh. */
        static GetTransformDetailMesh(transform: TransformNode): BABYLON.AbstractMesh;
        /** Gets the transform node primitive meshes. */
        static GetPrimitiveMeshes(transform: TransformNode): BABYLON.AbstractMesh[];
        /** Gets the specified transform node primary layer index. */
        static GetTransformLayer(transform: BABYLON.TransformNode): number;
        /** Gets the specified transform node primary tag name. */
        static GetTransformTag(transform: BABYLON.TransformNode): string;
        /** Check if the transform has the specified query tag match */
        static HasTransformTags(transform: BABYLON.TransformNode, query: string): boolean;
        /** Are half or full texture floats supported */
        static TextureFloatSupported(scene: BABYLON.Scene): boolean;
        /** Registers an on pick trigger click action */
        static RegisterClickAction(scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh, func: () => void): BABYLON.IAction;
        /** Unregisters an on pick trigger click action */
        static UnregisterClickAction(mesh: BABYLON.AbstractMesh, action: BABYLON.IAction): boolean;
        /** Starts a targeted float animation for tweening.  */
        static StartTweenAnimation(scene: BABYLON.Scene, name: string, targetObject: any, targetProperty: string, startValue: number, endValue: number, defaultSpeedRatio?: number, defaultFrameRate?: number, defaultLoopMode?: number, defaultEasingFunction?: BABYLON.EasingFunction, onAnimationComplete?: () => void): BABYLON.Animatable;
        /** Get first material with name. (Uses starts with text searching) */
        static GetMaterialWithName(scene: BABYLON.Scene, name: string): BABYLON.Material;
        /** Get all materials with name. (Uses starts with text searching) */
        static GetAllMaterialsWithName(scene: BABYLON.Scene, name: string): BABYLON.Material[];
        /** Instantiate the specified prefab asset hierarchy into the scene. (Cloned Hierarchy) */
        static InstantiatePrefab(container: BABYLON.AssetContainer, prefabName: string, newName: string, makeNewMaterials?: boolean, cloneAnimations?: boolean): BABYLON.TransformNode;
        /** Clones the specified transform node asset into the scene. (Transform Node) */
        static CloneTransformNode(container: BABYLON.AssetContainer, nodeName: string, cloneName: string): BABYLON.TransformNode;
        /** Clones the specified abstract mesh asset into the scene. (Abtract Mesh) */
        static CloneAbstractMesh(container: BABYLON.AssetContainer, nodeName: string, cloneName: string): BABYLON.AbstractMesh;
        /** Creates an instance of the specified mesh asset into the scene. (Mesh Instance) */
        static CreateInstancedMesh(container: BABYLON.AssetContainer, meshName: string, instanceName: string): BABYLON.InstancedMesh;
        /** Registers a script componment with the scene manager. */
        static RegisterScriptComponent(instance: BABYLON.ScriptComponent, alias: string, validate?: boolean): void;
        /** Destroys a script component instance. */
        static DestroyScriptComponent(instance: BABYLON.ScriptComponent): void;
        /** Finds a script component on the transform with the specfied class name. */
        static FindScriptComponent<T extends BABYLON.ScriptComponent>(transform: BABYLON.TransformNode, klass: string): T;
        /** Finds all script components on the transform with the specfied class name. */
        static FindAllScriptComponents<T extends BABYLON.ScriptComponent>(transform: BABYLON.TransformNode, klass: string): T[];
        /** Finds the transform object metedata in the scene. */
        static FindSceneMetadata(transform: BABYLON.TransformNode): any;
        /** Finds the specfied camera rig in the scene. */
        static FindSceneCameraRig(transform: BABYLON.TransformNode): BABYLON.FreeCamera;
        /** Finds the specfied light rig in the scene. */
        static FindSceneLightRig(transform: BABYLON.TransformNode): BABYLON.Light;
        /** Finds the first transform with the specified script component. */
        static FindTransformWithScript(scene: BABYLON.Scene, klass: string): BABYLON.TransformNode;
        /** Finds all transforms with the specified script component. */
        static FindAllTransformsWithScript(scene: BABYLON.Scene, klass: string): BABYLON.TransformNode[];
        /** Finds the specfied child transform in the scene. */
        static FindChildTransformNode(parent: BABYLON.TransformNode, name: string, searchType?: BABYLON.SearchType, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode;
        /** Finds the first child transform with matching tags. */
        static FindChildTransformWithTags(parent: BABYLON.TransformNode, query: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode;
        /** Finds all child transforms with matching tags. */
        static FindAllChildTransformsWithTags(parent: BABYLON.TransformNode, query: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode[];
        /** Finds the first child transform with the specified script component. */
        static FindChildTransformWithScript(parent: BABYLON.TransformNode, klass: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode;
        /** Finds all child transforms with the specified script component. */
        static FindAllChildTransformsWithScript(parent: BABYLON.TransformNode, klass: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode[];
        /** Searches all nodes for the first instance of the specified script component. */
        static SearchForScriptComponentByName<T extends BABYLON.ScriptComponent>(scene: BABYLON.Scene, klass: string): T;
        /** Searches all nodes for all instances of the specified script component. */
        static SearchForAllScriptComponentsByName<T extends BABYLON.ScriptComponent>(scene: BABYLON.Scene, klass: string): T[];
        /** Moves entity using vector position with camera collisions. */
        static MoveWithCollisions(entity: BABYLON.AbstractMesh, velocity: BABYLON.Vector3): void;
        /** Moves entity using vector position using translations. */
        static MoveWithTranslation(entity: BABYLON.TransformNode, velocity: BABYLON.Vector3): void;
        /** Turns entity using quaternion rotations in radians. */
        static TurnWithRotation(entity: BABYLON.TransformNode, radians: number, space?: BABYLON.Space): void;
        /** Callback to setup ammo.js plugin properties when activated on the scene. */
        static OnSetupPhysicsPlugin: (scene: BABYLON.Scene, plugin: BABYLON.AmmoJSPlugin) => void;
        /** Get ammo.js total memory heap size */
        static GetPhysicsHeapSize(): number;
        /** Confiures ammo.js physcis engine advanced sweeping and collision detection options on the scene. */
        static ConfigurePhysicsEngine(scene: BABYLON.Scene, deltaWorldStep?: boolean, subTimeStep?: number, maxWorldSweep?: number, ccdEnabled?: boolean, ccdPenetration?: number, gravityLevel?: BABYLON.Vector3): void;
        /** Gets the current ammo.js physics world. */
        static GetPhysicsEngine(scene: BABYLON.Scene): BABYLON.IPhysicsEngine;
        /** Gets the current ammo.js physics world. */
        static GetPhysicsWorld(scene: BABYLON.Scene): any;
        private static TempVRayDest;
        private static TempVRayOrigin;
        private static TempShapeVector;
        private static TempPhysicsWorld;
        private static TempTransformFrom;
        private static TempTransformTo;
        private static TempCastEndPoint;
        private static TempRaycastResult;
        private static ClosestRayResultCallback;
        private static ClosestConvexResultCallback;
        /** Perform a ammo.js physics world ray testing direction length with optional group filter mask. */
        static PhysicsRaycast(scene: BABYLON.Scene, origin: BABYLON.Vector3, direction: BABYLON.Vector3, length: number, group?: number, mask?: number): BABYLON.Nullable<BABYLON.RaycastHitResult>;
        /** Perform a ammo.js physics world ray testing destination point with optional group filter mask. */
        static PhysicsRaycastToPoint(scene: BABYLON.Scene, origin: BABYLON.Vector3, destination: BABYLON.Vector3, group?: number, mask?: number): BABYLON.Nullable<BABYLON.RaycastHitResult>;
        /** Perform a ammo.js physics world shape testing direction length with optional group filter mask. */
        static PhysicsShapecast(scene: BABYLON.Scene, btConvexShape: any, origin: BABYLON.Vector3, direction: BABYLON.Vector3, length: number, group?: number, mask?: number): BABYLON.Nullable<BABYLON.RaycastHitResult>;
        /** Perform a ammo.js physics world shape testing diestination point with optional group filter mask. */
        static PhysicsShapecastToPoint(scene: BABYLON.Scene, btConvexShape: any, origin: BABYLON.Vector3, destination: BABYLON.Vector3, group?: number, mask?: number): BABYLON.Nullable<BABYLON.RaycastHitResult>;
        /** Creates a validated entity parent child physics impostor */
        static CreatePhysicsImpostor(scene: BABYLON.Scene, entity: BABYLON.AbstractMesh, type: number, options: BABYLON.PhysicsImpostorParameters, reparent?: boolean): void;
        /** Gets the physics impostor type as a string. */
        static GetPhysicsImposterType(type: number): string;
        /** Creates a ammo.js physics box collision shape */
        static CreatePhysicsBoxShape(halfextents: BABYLON.Vector3): any;
        /** Creates a ammo.js physics sphere collision shape */
        static CreatePhysicsSphereShape(radius: number): any;
        /** Creates a ammo.js physics capsule collision shape */
        static CreatePhysicsCapsuleShape(radius: number, height: number): any;
        /** Creates a ammo.js physics compound collision shape */
        static CreatePhysicsCompoundShape(enableDynamicAabbTree?: boolean): any;
        /** Creates a ammo.js physics empty concave collision shape */
        static CreatePhysicsEmptyShape(): any;
        static MAX_AGENT_COUNT: number;
        static MAX_AGENT_RADIUS: number;
        private static NavigationMesh;
        private static CrowdInterface;
        private static PluginInstance;
        /** Register handler that is triggered when the navigation mesh is ready */
        static OnNavMeshReadyObservable: Observable<Mesh>;
        /** Get recast total memory heap size */
        static GetRecastHeapSize(): number;
        /** Gets the recast navigation plugin tools. (Singleton Instance) */
        static GetNavigationTools(): BABYLON.RecastJSPlugin;
        /** Gets the recast navigation crowd interface. (Singleton Instance) */
        static GetCrowdInterface(scene: BABYLON.Scene): BABYLON.ICrowd;
        /** Has the recast baked navigation data. (Navigation Helper) */
        static HasNavigationData(): boolean;
        /** Gets the current recast navigation mesh. (Navigation Helper) */
        static GetNavigationMesh(): BABYLON.Mesh;
        /** Bake the recast navigation mesh from geometry. (Navigation Helper) */
        static BakeNavigationMesh(scene: BABYLON.Scene, meshes: BABYLON.Mesh[], properties: BABYLON.INavMeshParameters, debug?: boolean, color?: BABYLON.Color3, collisionMesh?: boolean): BABYLON.Mesh;
        /** Load the recast navigation mesh binary data. (Navigation Helper) */
        static LoadNavigationMesh(scene: BABYLON.Scene, data: Uint8Array, debug?: boolean, color?: BABYLON.Color3, timeSteps?: number, collisionMesh?: boolean): BABYLON.Mesh;
        /** Save the recast navigation mesh binary data. (Navigation Helper) */
        static SaveNavigationMesh(): Uint8Array;
        /** Computes a recast navigation path. (Navigation Helper) */
        static ComputeNavigationPath(start: BABYLON.Vector3, end: BABYLON.Vector3, closetPoint?: boolean): BABYLON.Vector3[];
        /** Animate movement along a navigation path. (Navigation Helper) */
        static MoveAlongNavigationPath(scene: BABYLON.Scene, agent: BABYLON.TransformNode, path: BABYLON.Vector3[], speed?: number, easing?: BABYLON.EasingFunction, callback?: () => void): BABYLON.Animation;
        /** Creates a cylinder obstacle and add it to the navigation. (Navigation Helper) */
        static AddNavigationCylinderObstacle(position: BABYLON.Vector3, radius: number, height: number): BABYLON.IObstacle;
        /** Creates an oriented box obstacle and add it to the navigation. (Navigation Helper) */
        static AddNavigationBoxObstacle(position: BABYLON.Vector3, extent: BABYLON.Vector3, angle: number): BABYLON.IObstacle;
        /** Removes an obstacle created by addCylinderObstacle or addBoxObstacle. (Navigation Helper) */
        static RemoveNavigationObstacle(obstacle: BABYLON.IObstacle): void;
        /** Global gamepad manager */
        static GamepadManager: BABYLON.GamepadManager;
        /** Global gamepad connect event handler */
        static GamepadConnected: (pad: BABYLON.Gamepad, state: BABYLON.EventState) => void;
        /** Global gamepad disconnect event handler */
        static GamepadDisconnected: (pad: BABYLON.Gamepad, state: BABYLON.EventState) => void;
        /** Configure user input state in the scene. */
        static ConfigureUserInput(scene: BABYLON.Scene, options?: {
            pointerLock?: boolean;
            preventDefault?: boolean;
            useCapture?: boolean;
            enableVirtualJoystick?: boolean;
            disableRightStick?: boolean;
        }): void;
        /** Disables user input state in the scene. */
        static DisableUserInput(scene: BABYLON.Scene, useCapture?: boolean): void;
        /** Toggle full screen scene mode. */
        static ToggleFullscreenMode(scene: BABYLON.Scene, requestPointerLock?: boolean): void;
        /** Enter full screen scene mode. */
        static EnterFullscreenMode(scene: BABYLON.Scene, requestPointerLock?: boolean): void;
        /** Exit full screen scene mode. */
        static ExitFullscreenMode(scene: BABYLON.Scene): void;
        /** Locks user pointer state in the scene. */
        static LockMousePointer(scene: BABYLON.Scene, lock: boolean): void;
        private static PointerLockedFlag;
        static IsPointerLocked(): boolean;
        private static LockMousePointerObserver;
        static IsPointerLockHandled(): boolean;
        /** Get user input state from the scene. */
        static GetUserInput(input: BABYLON.UserInputAxis, player?: BABYLON.PlayerNumber): number;
        /** Set a keyboard up event handler. */
        static OnKeyboardUp(callback: (keycode: number) => void): void;
        /** Set a keyboard down event handler. */
        static OnKeyboardDown(callback: (keycode: number) => void): void;
        /** Set a keyboard press event handler. */
        static OnKeyboardPress(keycode: number, callback: () => void): void;
        /** Get the specified keyboard input by keycode. */
        static GetKeyboardInput(keycode: number): boolean;
        /** Set a pointer up event handler. */
        static OnPointerUp(callback: (button: number) => void): void;
        /** Set a pointer down event handler. */
        static OnPointerDown(callback: (button: number) => void): void;
        /** Set a pointer press event handler. */
        static OnPointerPress(button: number, callback: () => void): void;
        /** Get the specified pointer input by button. */
        static GetPointerInput(button: number): boolean;
        /** Get left virtual joystick. */
        static GetLeftJoystick(): BABYLON.VirtualJoystick;
        /** Get right virtual joystick. */
        static GetRightJoystick(): BABYLON.VirtualJoystick;
        /** Get joystick button pressed. */
        static GetJoystickPress(button: number): boolean;
        /** Dispose virtual joystick setup. */
        static DisposeVirtualJoysticks(): void;
        /** Set on gamepad button up event handler. */
        static OnGamepadButtonUp(callback: (button: number) => void, player?: BABYLON.PlayerNumber): void;
        /** Set on gamepad button down event handler. */
        static OnGamepadButtonDown(callback: (button: number) => void, player?: BABYLON.PlayerNumber): void;
        /** Set on gamepad button press event handler. */
        static OnGamepadButtonPress(button: number, callback: () => void, player?: BABYLON.PlayerNumber): void;
        /** Get the specified gamepad input by button. */
        static GetGamepadButtonInput(button: number, player?: BABYLON.PlayerNumber): boolean;
        /** Set on gamepad direction pad up event handler. */
        static OnGamepadDirectionUp(callback: (direction: number) => void, player?: BABYLON.PlayerNumber): void;
        /** Set on gamepad direction pad down event handler. */
        static OnGamepadDirectionDown(callback: (direction: number) => void, player?: BABYLON.PlayerNumber): void;
        /** Set on gamepad direction pad press event handler. */
        static OnGamepadDirectionPress(direction: number, callback: () => void, player?: BABYLON.PlayerNumber): void;
        /** Get the specified gamepad direction input by number. */
        static GetGamepadDirectionInput(direction: number, player?: BABYLON.PlayerNumber): boolean;
        /** Set on gamepad trigger left event handler. */
        static OnGamepadTriggerLeft(callback: (value: number) => void, player?: BABYLON.PlayerNumber): void;
        /** Set on gamepad trigger right event handler. */
        static OnGamepadTriggerRight(callback: (value: number) => void, player?: BABYLON.PlayerNumber): void;
        /** Get the specified gamepad trigger input by number. */
        static GetGamepadTriggerInput(trigger: number, player?: BABYLON.PlayerNumber): number;
        /** Get the specified gamepad type. */
        static GetGamepadType(player?: BABYLON.PlayerNumber): BABYLON.GamepadType;
        /** Get the specified gamepad. */
        static GetGamepad(player?: BABYLON.PlayerNumber): BABYLON.Gamepad;
        private static input;
        private static keymap;
        private static wheel;
        private static mousex;
        private static mousey;
        private static vertical;
        private static horizontal;
        private static mousex2;
        private static mousey2;
        private static vertical2;
        private static horizontal2;
        private static mousex3;
        private static mousey3;
        private static vertical3;
        private static horizontal3;
        private static mousex4;
        private static mousey4;
        private static vertical4;
        private static horizontal4;
        private static a_mousex;
        private static x_wheel;
        private static x_mousex;
        private static x_mousey;
        private static x_vertical;
        private static x_horizontal;
        private static k_mousex;
        private static k_mousey;
        private static k_vertical;
        private static k_horizontal;
        private static j_mousex;
        private static j_mousey;
        private static j_vertical;
        private static j_horizontal;
        private static g_mousex1;
        private static g_mousey1;
        private static g_vertical1;
        private static g_horizontal1;
        private static g_mousex2;
        private static g_mousey2;
        private static g_vertical2;
        private static g_horizontal2;
        private static g_mousex3;
        private static g_mousey3;
        private static g_vertical3;
        private static g_horizontal3;
        private static g_mousex4;
        private static g_mousey4;
        private static g_vertical4;
        private static g_horizontal4;
        private static mouseButtonPress;
        private static mouseButtonDown;
        private static mouseButtonUp;
        private static keyButtonPress;
        private static keyButtonDown;
        private static keyButtonUp;
        private static leftJoystick;
        private static rightJoystick;
        private static virtualJoystick;
        private static previousPosition;
        private static preventDefault;
        private static rightHanded;
        private static gamepad1;
        private static gamepad1Type;
        private static gamepad1ButtonPress;
        private static gamepad1ButtonDown;
        private static gamepad1ButtonUp;
        private static gamepad1DpadPress;
        private static gamepad1DpadDown;
        private static gamepad1DpadUp;
        private static gamepad1LeftTrigger;
        private static gamepad1RightTrigger;
        private static gamepad2;
        private static gamepad2Type;
        private static gamepad2ButtonPress;
        private static gamepad2ButtonDown;
        private static gamepad2ButtonUp;
        private static gamepad2DpadPress;
        private static gamepad2DpadDown;
        private static gamepad2DpadUp;
        private static gamepad2LeftTrigger;
        private static gamepad2RightTrigger;
        private static gamepad3;
        private static gamepad3Type;
        private static gamepad3ButtonPress;
        private static gamepad3ButtonDown;
        private static gamepad3ButtonUp;
        private static gamepad3DpadPress;
        private static gamepad3DpadDown;
        private static gamepad3DpadUp;
        private static gamepad3LeftTrigger;
        private static gamepad3RightTrigger;
        private static gamepad4;
        private static gamepad4Type;
        private static gamepad4ButtonPress;
        private static gamepad4ButtonDown;
        private static gamepad4ButtonUp;
        private static gamepad4DpadPress;
        private static gamepad4DpadDown;
        private static gamepad4DpadUp;
        private static gamepad4LeftTrigger;
        private static gamepad4RightTrigger;
        private static debugLayerVisible;
        private static tickKeyboardInput;
        private static updateUserInput;
        private static resetUserInput;
        private static resetKeyMapHandler;
        private static inputKeyDownHandler;
        private static inputKeyUpHandler;
        private static inputPointerWheelHandler;
        private static inputPointerDownHandler;
        private static inputPointerUpHandler;
        private static inputPointerMoveHandler;
        private static inputVirtualJoysticks;
        private static inputOneButtonDownHandler;
        private static inputOneButtonUpHandler;
        private static inputOneXboxDPadDownHandler;
        private static inputOneShockDPadDownHandler;
        private static inputOneXboxDPadUpHandler;
        private static inputOneShockDPadUpHandler;
        private static inputOneXboxLeftTriggerHandler;
        private static inputOneXboxRightTriggerHandler;
        private static inputOneLeftStickHandler;
        private static inputOneRightStickHandler;
        private static inputTwoButtonDownHandler;
        private static inputTwoButtonUpHandler;
        private static inputTwoXboxDPadDownHandler;
        private static inputTwoShockDPadDownHandler;
        private static inputTwoXboxDPadUpHandler;
        private static inputTwoShockDPadUpHandler;
        private static inputTwoXboxLeftTriggerHandler;
        private static inputTwoXboxRightTriggerHandler;
        private static inputTwoLeftStickHandler;
        private static inputTwoRightStickHandler;
        private static inputThreeButtonDownHandler;
        private static inputThreeButtonUpHandler;
        private static inputThreeXboxDPadDownHandler;
        private static inputThreeShockDPadDownHandler;
        private static inputThreeXboxDPadUpHandler;
        private static inputThreeShockDPadUpHandler;
        private static inputThreeXboxLeftTriggerHandler;
        private static inputThreeXboxRightTriggerHandler;
        private static inputThreeLeftStickHandler;
        private static inputThreeRightStickHandler;
        private static inputFourButtonDownHandler;
        private static inputFourButtonUpHandler;
        private static inputFourXboxDPadDownHandler;
        private static inputFourShockDPadDownHandler;
        private static inputFourXboxDPadUpHandler;
        private static inputFourShockDPadUpHandler;
        private static inputFourXboxLeftTriggerHandler;
        private static inputFourXboxRightTriggerHandler;
        private static inputFourLeftStickHandler;
        private static inputFourRightStickHandler;
        private static inputManagerGamepadConnected;
        private static inputManagerGamepadDisconnected;
        private static inputManagerLeftControllerMainButton;
        private static inputManagerLeftControllerPadState;
        private static inputManagerLeftControllerPadValues;
        private static inputManagerLeftControllerAuxButton;
        private static inputManagerLeftControllerTriggered;
        private static inputManagerRightControllerMainButton;
        private static inputManagerRightControllerPadState;
        private static inputManagerRightControllerPadValues;
        private static inputManagerRightControllerAuxButton;
        private static inputManagerRightControllerTriggered;
        private static inputManagerControllerConnected;
    }
}
/**
 * Babylon Scene Manager Alias
 */
declare const SM: typeof BABYLON.SceneManager;

declare module BABYLON {
    /**
     * Babylon metadata parser class (Internal use only)
     * @class MetadataParser - All rights reserved (c) 2020 Mackey Kinard
     */
    class MetadataParser {
        private _physicList;
        private _shadowList;
        private _freezeList;
        private _scriptList;
        private _babylonScene;
        constructor(scene: BABYLON.Scene);
        /** Parse the scene component metadata. Note: Internal use only */
        parseSceneComponents(entity: BABYLON.TransformNode): void;
        /** Post process pending scene components. Note: Internal use only */
        postProcessSceneComponents(preloadList: Array<BABYLON.ScriptComponent>, readyList: Array<BABYLON.ScriptComponent>): void;
        private static DoParseSceneComponents;
        private static DoProcessPendingScripts;
        private static DoProcessPendingShadows;
        private static DoProcessPendingPhysics;
        private static DoProcessPendingFreezes;
        private static SetupCameraComponent;
        private static SetupLightComponent;
    }
}

/**
 * RequestAnimationFrame() Original Shim By: Paul Irish (Internal use only)
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @class TimerPlugin - All rights reserved (c) 2020 Mackey Kinard
 */
declare var TimerPlugin: any;

declare module BABYLON {
    /**
     * Babylon script component class
     * @class ScriptComponent - All rights reserved (c) 2020 Mackey Kinard
     */
    abstract class ScriptComponent {
        private _update;
        private _late;
        private _after;
        private _fixed;
        private _ready;
        private _lateUpdate;
        private _properties;
        private _awoken;
        private _started;
        private _scene;
        private _transform;
        private _scriptReady;
        private _registeredClassname;
        private _lateUpdateObserver;
        private _fixedUpdateObserver;
        /** Gets the current scene object */
        get scene(): BABYLON.Scene;
        /** Gets the transform node entity */
        get transform(): BABYLON.TransformNode;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        /** Sets the script component property bag value */
        protected setProperty(name: string, propertyValue: any): void;
        /** Gets the script component property bag value */
        protected getProperty<T>(name: string, defaultValue?: T): T;
        /** Gets the script component class name */
        getClassName(): string;
        /** Gets the script component ready state */
        getReadyState(): boolean;
        /** Get the current time in seconds */
        getTime(): number;
        /** Get the total game time in seconds */
        getGameTime(): number;
        /** Get the current delta time in seconds */
        getDeltaSeconds(): number;
        /** Get the delta time animation ratio for 60 fps */
        getAnimationRatio(): number;
        /** Gets the safe transform mesh entity */
        getTransformMesh(): BABYLON.Mesh;
        /** Gets the safe transform abstract mesh entity */
        getAbstractMesh(): BABYLON.AbstractMesh;
        /** Gets the safe transform instanced mesh entity */
        getInstancedMesh(): BABYLON.InstancedMesh;
        /** Gets the transform primitive meshes */
        getPrimitiveMeshes(): BABYLON.AbstractMesh[];
        /** Get the transform object metedata in the scene. */
        getMetadata(): any;
        /** Get a script component on the transform with the specfied class name. */
        getComponent<T extends BABYLON.ScriptComponent>(klass: string): T;
        /** Get all script components on the transform with the specfied class name. */
        getComponents<T extends BABYLON.ScriptComponent>(klass: string): T[];
        /** Gets the attached transform light rig */
        getLightRig(): BABYLON.Light;
        /** Gets the attached transform camera rig */
        getCameraRig(): BABYLON.FreeCamera;
        /** Gets a script component transform primary tag name. */
        getTransformTag(): string;
        /** Check if the transform has the specified query tag match */
        hasTransformTags(query: string): boolean;
        /** Get the specfied child transform in the scene. */
        getChildNode(name: string, searchType?: BABYLON.SearchType, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode;
        /** Get the first child transform with matching tags. */
        getChildWithTags(query: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode;
        /** Get all child transforms with matching tags. */
        getChildrenWithTags(query: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode[];
        /** Get the first child transform with the specified script component. */
        getChildWithScript(klass: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode;
        /** Get all child transforms with the specified script component. */
        getChildrenWithScript(klass: string, directDecendantsOnly?: boolean, predicate?: (node: BABYLON.Node) => boolean): BABYLON.TransformNode[];
        /** Registers an on pick tricgger click action */
        registerOnClickAction(func: () => void): BABYLON.IAction;
        /** Unregisters an on pick tricgger click action */
        unregisterOnClickAction(action: BABYLON.IAction): boolean;
        /** Sets the intersect mesh for trigger volume collision detection */
        setTriggerIntersectMesh(mesh: BABYLON.AbstractMesh): void;
        /** Register handler that is triggered when the a volume has entered */
        onTriggerEnterObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a volume contact is active */
        onTriggerStayObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a volume contact has exited */
        onTriggerExitObservable: Observable<AbstractMesh>;
        private intersectMesh;
        private triggerVolumeList;
        useTriggerVolumePrecision: boolean;
        includeTriggerVolumeDescendants: boolean;
        getTriggerVolumeList(): BABYLON.TriggerVolume[];
        resetTriggerVolumeList(): void;
        registerTriggerVolume(volume: BABYLON.AbstractMesh): void;
        unregisterTriggerVolume(volume: BABYLON.AbstractMesh): void;
        private registerComponentInstance;
        private delayComponentInstance;
        private destroyComponentInstance;
        private static RegisterInstance;
        private static UpdateInstance;
        private static LateInstance;
        private static AfterInstance;
        private static FixedInstance;
        private static ReadyInstance;
        private static DestroyInstance;
        private static ParseAutoProperties;
        private static UnpackObjectProperty;
    }
}

declare module BABYLON {
    /**
     * Babylon universal shader defines pro class
     * @class UniversalShaderDefines - All rights reserved (c) 2020 Mackey Kinard
     */
    class UniversalShaderDefines {
        private _defines;
        constructor();
        getDefines(): any;
        defineBoolean(name: string): void;
        defineNumeric(name: string, value: number): void;
        static ShaderIndexer: number;
    }
    /**
     * Babylon universal albedo chunks pro class
     * @class UniversalAlbedoChunks - All rights reserved (c) 2020 Mackey Kinard
     */
    class UniversalAlbedoChunks {
        constructor();
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
        Vertex_After_WorldPosComputed: string;
        Vertex_MainEnd: string;
        Fragment_Begin: string;
        Fragment_Definitions: string;
        Fragment_MainBegin: string;
        Fragment_Custom_Albedo: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_Lights: string;
        Fragment_Before_Fog: string;
        Fragment_Before_FragColor: string;
        Fragment_MetallicRoughness: string;
        Fragment_MicroSurface: string;
    }
    /**
     * Babylon universal albedo material pro class
     * @class UniversalAlbedoMaterial - All rights reserved (c) 2020 Mackey Kinard
     */
    class UniversalAlbedoMaterial extends BABYLON.PBRMaterial {
        protected universalMaterial: boolean;
        protected locals: BABYLON.UniversalShaderDefines;
        protected terrainInfo: any;
        private _defines;
        private _uniforms;
        private _samplers;
        private _attributes;
        private _textures;
        private _vectors4;
        private _floats;
        private _createdShaderName;
        protected enableShaderChunks: boolean;
        protected materialShaderChunks: BABYLON.UniversalAlbedoChunks;
        protected updateShaderChunks(): void;
        constructor(name: string, scene: Scene);
        getShaderName(): string;
        getShaderChunk(): string;
        getShaderDefines(): BABYLON.PBRMaterialDefines;
        getCustomAttributes(): string[];
        getTexture(name: string): BABYLON.Texture;
        getVector4(name: string): BABYLON.Vector4;
        getFloat(name: string): number;
        setTexture(name: string, texture: BABYLON.Texture, initialize?: boolean): BABYLON.UniversalAlbedoMaterial;
        setVector4(name: string, value: BABYLON.Vector4, initialize?: boolean): BABYLON.UniversalAlbedoMaterial;
        setFloat(name: string, value: number, initialize?: boolean): BABYLON.UniversalAlbedoMaterial;
        addAttribute(attributeName: string): void;
        checkUniform(uniformName: string): void;
        checkSampler(samplerName: string): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        clone(cloneName: string): BABYLON.UniversalAlbedoMaterial;
        serialize(): any;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): BABYLON.UniversalAlbedoMaterial;
        protected customShaderChunkResolve(): void;
        private _buildCustomShader;
        private _createShaderChunks;
        private dumpEffect;
        private _attachAfterBind;
    }
    /**
     * Babylon universal terrain material pro class
     * @class UniversalTerrainMaterial
     */
    class UniversalTerrainMaterial extends BABYLON.UniversalAlbedoMaterial {
        constructor(name: string, scene: BABYLON.Scene);
        getShaderName(): string;
        getShaderChunk(): string;
        protected updateShaderChunks(): void;
        private formatTerrainVertexDefintions;
        private formatTerrainVertexMainEnd;
        private formatTerrainFragmentDefintions;
        private formatTerrainFragmentUpdateColor;
    }
}

declare module BABYLON {
    /**
     * Babylon system class
     * @class System - All rights reserved (c) 2020 Mackey Kinard
     */
    enum System {
        Deg2Rad,
        Rad2Deg,
        Epsilon = 0.00001,
        SingleEpsilon = 1.401298e-45,
        EpsilonNormalSqrt = 1e-15,
        Kph2Mph = 0.621371,
        Mph2Kph = 1.60934,
        Mps2Kph = 3.6,
        Meter2Inch = 39.3701,
        Inch2Meter = 0.0254,
        Gravity = 9.81,
        Gravity3G = 29.400000000000002,
        SkidFactor = 0.25,
        MaxInteger = 2147483647,
        WalkingVelocity = 4.4,
        TerminalVelocity = 55,
        SmoothDeltaFactor = 0.2,
        ToLinearSpace = 2.2,
        ToGammaSpace = 0.45454545454545453
    }
    enum Handedness {
        Default = -1,
        Right = 0,
        Left = 1
    }
    enum SearchType {
        ExactMatch = 0,
        StartsWith = 1,
        EndsWith = 2,
        IndexOf = 3
    }
    enum PlayerNumber {
        Auto = 0,
        One = 1,
        Two = 2,
        Three = 3,
        Four = 4
    }
    enum PlayerControl {
        FirstPerson = 0,
        ThirdPerson = 1
    }
    enum RenderQuality {
        High = 0,
        Medium = 1,
        Low = 2
    }
    enum GamepadType {
        None = -1,
        Generic = 0,
        Xbox360 = 1,
        DualShock = 2,
        PoseController = 3
    }
    enum JoystickButton {
        Left = 0,
        Right = 1
    }
    enum Xbox360Trigger {
        Left = 0,
        Right = 1
    }
    enum MovementType {
        DirectVelocity = 0,
        AppliedForces = 1
    }
    enum CollisionContact {
        Top = 0,
        Left = 1,
        Right = 2,
        Bottom = 3
    }
    enum IntersectionPrecision {
        AABB = 0,
        OBB = 1
    }
    enum CollisionFilters {
        DefaultFilter = 1,
        StaticFilter = 2,
        KinematicFilter = 4,
        DebrisFilter = 8,
        SensorTrigger = 16,
        CharacterFilter = 32,
        GroundFilter = 64,
        AllFilter = -1
    }
    enum CollisionState {
        ACTIVE_TAG = 1,
        ISLAND_SLEEPING = 2,
        WANTS_DEACTIVATION = 3,
        DISABLE_DEACTIVATION = 4,
        DISABLE_SIMULATION = 5
    }
    enum CollisionFlags {
        CF_STATIC_OBJECT = 1,
        CF_KINEMATIC_OBJECT = 2,
        CF_NO_CONTACT_RESPONSE = 4,
        CF_CUSTOM_MATERIAL_CALLBACK = 8,
        CF_CHARACTER_OBJECT = 16,
        CF_DISABLE_VISUALIZE_OBJECT = 32,
        CF_DISABLE_SPU_COLLISION_PROCESSING = 64,
        CF_HAS_CONTACT_STIFFNESS_DAMPING = 128,
        CF_HAS_CUSTOM_DEBUG_RENDERING_COLOR = 256,
        CF_HAS_FRICTION_ANCHOR = 512,
        CF_HAS_COLLISION_SOUND_TRIGGER = 1024
    }
    enum UserInputPointer {
        Left = 0,
        Middle = 1,
        Right = 2
    }
    enum UserInputAxis {
        Horizontal = 0,
        Vertical = 1,
        ClientX = 2,
        ClientY = 3,
        MouseX = 4,
        MouseY = 5,
        Wheel = 6
    }
    enum UserInputKey {
        BackSpace = 8,
        Tab = 9,
        Enter = 13,
        Shift = 16,
        Ctrl = 17,
        Alt = 18,
        Pause = 19,
        Break = 19,
        CapsLock = 20,
        Escape = 27,
        SpaceBar = 32,
        PageUp = 33,
        PageDown = 34,
        End = 35,
        Home = 36,
        LeftArrow = 37,
        UpArrow = 38,
        RightArrow = 39,
        DownArrow = 40,
        Insert = 45,
        Delete = 46,
        Num0 = 48,
        Num1 = 49,
        Num2 = 50,
        Num3 = 51,
        Num4 = 52,
        Num5 = 53,
        Num6 = 54,
        Num7 = 55,
        Num8 = 56,
        Num9 = 57,
        A = 65,
        B = 66,
        C = 67,
        D = 68,
        E = 69,
        F = 70,
        G = 71,
        H = 72,
        I = 73,
        J = 74,
        K = 75,
        L = 76,
        M = 77,
        N = 78,
        O = 79,
        P = 80,
        Q = 81,
        R = 82,
        S = 83,
        T = 84,
        U = 85,
        V = 86,
        W = 87,
        X = 88,
        Y = 89,
        Z = 90,
        LeftWindowKey = 91,
        RightWindowKey = 92,
        SelectKey = 93,
        Numpad0 = 96,
        Numpad1 = 97,
        Numpad2 = 98,
        Numpad3 = 99,
        Numpad4 = 100,
        Numpad5 = 101,
        Numpad6 = 102,
        Numpad7 = 103,
        Numpad8 = 104,
        Numpad9 = 105,
        Multiply = 106,
        Add = 107,
        Subtract = 109,
        DecimalPoint = 110,
        Divide = 111,
        F1 = 112,
        F2 = 113,
        F3 = 114,
        F4 = 115,
        F5 = 116,
        F6 = 117,
        F7 = 118,
        F8 = 119,
        F9 = 120,
        F10 = 121,
        F11 = 122,
        F12 = 123,
        NumLock = 144,
        ScrollLock = 145,
        SemiColon = 186,
        EqualSign = 187,
        Comma = 188,
        Dash = 189,
        Period = 190,
        ForwardSlash = 191,
        GraveAccent = 192,
        OpenBracket = 219,
        BackSlash = 220,
        CloseBraket = 221,
        SingleQuote = 222
    }
    interface UserInputPress {
        index: number;
        action: () => void;
    }
    type UserInputAction = (index: number) => void;
    class UserInputOptions {
        static KeyboardSmoothing: boolean;
        static KeyboardMoveSensibility: number;
        static KeyboardMoveDeadZone: number;
        static GamepadDeadStickValue: number;
        static GamepadLStickXInverted: boolean;
        static GamepadLStickYInverted: boolean;
        static GamepadRStickXInverted: boolean;
        static GamepadRStickYInverted: boolean;
        static GamepadLStickSensibility: number;
        static GamepadRStickSensibility: number;
        static JoystickRightHandleColor: string;
        static JoystickLeftSensibility: number;
        static JoystickRightSensibility: number;
        static JoystickDeadStickValue: number;
        static PointerAngularSensibility: number;
        static PointerWheelDeadZone: number;
        static PointerMouseDeadZone: number;
        static PointerMouseInverted: boolean;
        static UseArrowKeyRotation: boolean;
        static UseCanvasElement: boolean;
    }
    /**
     * Unity Export Interfaces
     */
    interface IUnityTransform {
        type: string;
        id: string;
        tag: string;
        name: string;
        layer: number;
    }
    interface IUnityCurve {
        type: string;
        length: number;
        prewrapmode: string;
        postwrapmode: string;
        animation: any;
    }
    interface IUnityMaterial {
        type: string;
        id: string;
        name: string;
        shader: string;
        gltf: number;
    }
    interface IUnityTexture {
        type: string;
        name: string;
        width: number;
        height: number;
        filename: string;
        wrapmode: string;
        filtermode: string;
        anisolevel: number;
    }
    interface IUnityCubemap {
        type: string;
        name: string;
        info: any;
        width: number;
        height: number;
        filename: string;
        extension: string;
        wrapmode: string;
        filtermode: string;
        anisolevel: number;
        texelsizex: number;
        texelsizey: number;
        dimension: number;
        format: number;
        mipmapbias: number;
        mipmapcount: number;
    }
    interface IUnityAudioClip {
        type: string;
        name: string;
        filename: string;
        length: number;
        channels: number;
        frequency: number;
        samples: number;
    }
    interface IUnityVideoClip {
        type: string;
        name: string;
        filename: string;
        length: number;
        width: number;
        height: number;
        framerate: number;
        framecount: number;
        audiotracks: number;
    }
    interface IUnityFontAsset {
        type: string;
        filename: string;
        format: string;
    }
    interface IUnityTextAsset {
        type: string;
        filename: string;
        base64: string;
    }
    interface IUnityDefaultAsset {
        type: string;
        filename: string;
        base64: string;
    }
    interface IUnityVector2 {
        x: number;
        y: number;
    }
    interface IUnityVector3 {
        x: number;
        y: number;
        z: number;
    }
    interface IUnityVector4 {
        x: number;
        y: number;
        z: number;
        w: number;
    }
    interface IUnityColor {
        r: number;
        g: number;
        b: number;
        a: number;
    }
    /**
     * Asset Preloader Interface (https://doc.babylonjs.com/divingDeeper/importers/assetManager)
     */
    interface IAssetPreloader {
        addPreloaderTasks(assetsManager: BABYLON.AssetsManager): void;
    }
    /**
     * Trigger Volume State
     * @class TriggerVolume - All rights reserved (c) 2020 Mackey Kinard
     */
    class TriggerVolume {
        mesh: BABYLON.AbstractMesh;
        state: number;
    }
    /**
     * Event Message Bus (Use Static Singleton Pattern)
     * @class EventMessageBus - All rights reserved (c) 2020 Mackey Kinard
     */
    class EventMessageBus {
        AddListener<T>(messageName: string, handler: (data: T) => void): void;
        RemoveListener(messageName: string, handler: (data: any) => void): void;
        RaiseMessage(messageName: string, data?: any): void;
        private ListenerDictionary;
    }
    /**
     * Prefab Object Pool (Use Static Singleton Pattern)
     * @class PrefabObjectPool - All rights reserved (c) 2020 Mackey Kinard
     */
    class PrefabObjectPool {
        private assetContainer;
        private prefabName;
        private makeNewMaterials;
        private cloneAnimations;
        constructor(container: BABYLON.AssetContainer, prefabName: string, makeNewMaterials?: boolean, cloneAnimations?: boolean);
        /** Get a prefab instance from the object pool or create a new one if none available */
        GetInstance(position?: BABYLON.Vector3, rotation?: BABYLON.Quaternion): BABYLON.TransformNode;
        /** Return the prefab instance to the available object pool state */
        ReturnInstance(instance: BABYLON.TransformNode): void;
        /** Pre populate the prefab object pool by the specified count */
        PrePopulatePool(count: number): void;
        private AvailableInstances;
        private CreateNewInstance;
    }
    /**
     * Physics Raycast Classes
     * @class RaycastHitResult - All rights reserved (c) 2020 Mackey Kinard
     */
    class RaycastHitResult {
        private _hit;
        private _dest;
        private _origin;
        private _hitPoint;
        private _hitNormal;
        private _hitDistance;
        private _collisionObject;
        get hasHit(): boolean;
        get hitPoint(): BABYLON.Vector3;
        get hitNormal(): BABYLON.Vector3;
        get hitDistance(): number;
        get collisionObject(): any;
        get rayDestination(): BABYLON.Vector3;
        get rayOrigin(): BABYLON.Vector3;
        constructor();
        reset(origin: BABYLON.Vector3, destination: BABYLON.Vector3): void;
        update(hit: boolean, pointX: number, pointY: number, pointZ: number, normalX: number, normalY: number, normalZ: number, collisionObject?: any): void;
    }
    /**
     * Lines Mesh Render Classes
     * @class LinesMeshRenderer - All rights reserved (c) 2020 Mackey Kinard
     */
    class LinesMeshRenderer {
        private _numPoints;
        private _pointMesh;
        private _pointSize;
        private _pointType;
        private _linesName;
        private _linesMesh;
        private _babylonScene;
        get pointMesh(): BABYLON.Mesh;
        get linesMesh(): BABYLON.LinesMesh;
        constructor(name: string, scene: BABYLON.Scene, pointType?: number, pointSize?: number);
        dispose(doNotRecurse?: boolean): void;
        hidePoint(hide?: boolean): void;
        drawPoint(position: BABYLON.Vector3): void;
        drawLine(points: BABYLON.Vector3[], color?: BABYLON.Color3): void;
    }
    /**
     * Babylon Utility Classes
     * @class Utilities - All rights reserved (c) 2020 Mackey Kinard
     */
    class Utilities {
        private static UpVector;
        private static AuxVector;
        private static ZeroVector;
        private static TempMatrix;
        private static TempVector2;
        private static TempVector3;
        private static TempQuaternion;
        private static PrintElement;
        private static LoadingState;
        static OnPreloaderProgress: (remainingCount: number, totalCount: number, lastFinishedTask: BABYLON.AbstractAssetTask) => void;
        static OnPreloaderComplete: (tasks: BABYLON.AbstractAssetTask[]) => void;
        static IsLayerMasked(mask: number, layer: number): boolean;
        static GetLoadingState(): number;
        static Approximately(a: number, b: number): boolean;
        static MoveTowardsVector2(current: BABYLON.Vector2, target: BABYLON.Vector2, maxDelta: number): BABYLON.Vector2;
        static MoveTowardsVector2ToRef(current: BABYLON.Vector2, target: BABYLON.Vector2, maxDelta: number, result: BABYLON.Vector2): void;
        static MoveTowardsVector3(current: BABYLON.Vector3, target: BABYLON.Vector3, maxDelta: number): BABYLON.Vector3;
        static MoveTowardsVector3ToRef(current: BABYLON.Vector3, target: BABYLON.Vector3, maxDelta: number, result: BABYLON.Vector3): void;
        static MoveTowardsVector4(current: BABYLON.Vector4, target: BABYLON.Vector4, maxDelta: number): BABYLON.Vector4;
        static MoveTowardsVector4ToRef(current: BABYLON.Vector4, target: BABYLON.Vector4, maxDelta: number, result: BABYLON.Vector4): void;
        /**  Clamps a vector2 magnitude to a max length. */
        static ClampMagnitudeVector2(vector: BABYLON.Vector2, length: number): BABYLON.Vector2;
        /**  Clamps a vector2 magnitude to a max length. */
        static ClampMagnitudeVector2ToRef(vector: BABYLON.Vector2, length: number, result: BABYLON.Vector2): void;
        /**  Clamps a vector3 magnitude to a max length. */
        static ClampMagnitudeVector3(vector: BABYLON.Vector3, length: number): BABYLON.Vector3;
        /**  Clamps a vector3 magnitude to a max length. */
        static ClampMagnitudeVector3ToRef(vector: BABYLON.Vector3, length: number, result: BABYLON.Vector3): void;
        /** Zero pad a number to string */
        static ZeroPad(num: number, places: number): string;
        /** TODO */
        static LerpLog(a: number, b: number, t: number): number;
        /** TODO */
        static LerpExp(a: number, b: number, t: number): number;
        static LerpClamp(a: number, b: number, t: number): number;
        /** TODO */
        static LerpUnclamp(a: number, b: number, t: number): number;
        /** Returns the angle in degrees between the from and to vectors. */
        static GetAngle(from: BABYLON.Vector3, to: BABYLON.Vector3): number;
        /** TODO */
        static ClampAngle(angle: number, min: number, max: number): number;
        /** Gradually changes a number towards a desired goal over time. (Note: Uses currentVelocity.x as output variable) */
        static SmoothDamp(current: number, target: number, smoothTime: number, maxSpeed: number, deltaTime: number, currentVelocity: BABYLON.Vector2): number;
        /** Gradually changes an angle given in degrees towards a desired goal angle over time. (Note: Uses currentVelocity.x as output variable) */
        static SmoothDampAngle(current: number, target: number, smoothTime: number, maxSpeed: number, deltaTime: number, currentVelocity: BABYLON.Vector2): number;
        /** Gradually changes a vector towards a desired goal over time. (Note: Uses currentVelocity.xy as output variable) */
        static SmoothDampVector2(current: BABYLON.Vector2, target: BABYLON.Vector2, smoothTime: number, maxSpeed: number, deltaTime: number, currentVelocity: BABYLON.Vector2): BABYLON.Vector2;
        /** Gradually changes a vector result towards a desired goal over time. (Note: Uses currentVelocity.xy as output variable) */
        static SmoothDampVector2ToRef(current: BABYLON.Vector2, target: BABYLON.Vector2, smoothTime: number, maxSpeed: number, deltaTime: number, currentVelocity: BABYLON.Vector2, result: BABYLON.Vector2): void;
        /** Gradually changes a vector towards a desired goal over time. (Note: Uses currentVelocity.xyz as output variable) */
        static SmoothDampVector3(current: BABYLON.Vector3, target: BABYLON.Vector3, smoothTime: number, maxSpeed: number, deltaTime: number, currentVelocity: BABYLON.Vector3): BABYLON.Vector3;
        /** Gradually changes a vector result towards a desired goal over time. (Note: Uses currentVelocity.xyz as output variable) */
        static SmoothDampVector3ToRef(current: BABYLON.Vector3, target: BABYLON.Vector3, smoothTime: number, maxSpeed: number, deltaTime: number, currentVelocity: BABYLON.Vector3, result: BABYLON.Vector3): void;
        /** Returns a new Matrix as a rotation matrix from the Euler angles in degrees (x, y, z). */
        static ToMatrix(x: number, y: number, z: number): BABYLON.Matrix;
        /** Sets a Matrix result as a rotation matrix from the Euler angles in degrees (x, y, z). */
        static ToMatrixToRef(x: number, y: number, z: number, result: BABYLON.Matrix): void;
        /** Set the passed matrix "result" as the interpolated values for "gradient" (float) between the ones of the matrices "startValue" and "endValue". */
        static FastMatrixLerp(startValue: BABYLON.Matrix, endValue: BABYLON.Matrix, gradient: number, result: BABYLON.Matrix): void;
        /** Set the passed matrix "result" as the spherical interpolated values for "gradient" (float) between the ones of the matrices "startValue" and "endValue". */
        static FastMatrixSlerp(startValue: BABYLON.Matrix, endValue: BABYLON.Matrix, gradient: number, result: BABYLON.Matrix): void;
        /** Returns a new Vector Euler in degress set from the passed qauternion. */
        static ToEuler(quaternion: BABYLON.Quaternion): BABYLON.Vector3;
        /** Sets a Vector Euler result in degress set from the passed qauternion. */
        static ToEulerToRef(quaternion: BABYLON.Quaternion, result: BABYLON.Vector3): void;
        /** Returns a new Quaternion set from the passed Euler float angles in degrees (x, y, z). */
        static FromEuler(x: number, y: number, z: number): BABYLON.Quaternion;
        /** Sets a Quaternion result set from the passed Euler float angles in degrees (x, y, z). */
        static FromEulerToRef(x: number, y: number, z: number, result: BABYLON.Quaternion): void;
        /** Computes the difference in quaternion values */
        static QuaternionDiff(source: BABYLON.Quaternion, other: BABYLON.Quaternion): BABYLON.Quaternion;
        /** Computes the difference in quaternion values to a result value */
        static QuaternionDiffToRef(source: BABYLON.Quaternion, other: BABYLON.Quaternion, result: BABYLON.Quaternion): void;
        /** Subtracts one quaternion from another to a result value */
        static QuaternionSubtractToRef(source: BABYLON.Quaternion, other: BABYLON.Quaternion, result: BABYLON.Quaternion): void;
        /** Multplies a quaternion by a vector (rotates vector) */
        static RotateVector(vec: BABYLON.Vector3, quat: BABYLON.Quaternion): BABYLON.Vector3;
        /** Multplies a quaternion by a vector (rotates vector) */
        static RotateVectorToRef(vec: BABYLON.Vector3, quat: BABYLON.Quaternion, result: BABYLON.Vector3): void;
        /** Returns a new Quaternion set from the passed vector direction. */
        static LookRotation(direction: BABYLON.Vector3): BABYLON.Quaternion;
        /** Returns a new Quaternion set from the passed vector direction. */
        static LookRotationToRef(direction: BABYLON.Vector3, result: BABYLON.Quaternion): void;
        /** Returns a new vector3 degrees converted from radions */
        static Vector3Rad2Deg(vector: BABYLON.Vector3): BABYLON.Vector3;
        /** Sets a vector3 result degrees converted from radions */
        static Vector3Rad2DegToRef(vector: BABYLON.Vector3, result: BABYLON.Vector3): void;
        /** Multiply the quaternion by a vector */
        static MultiplyQuaternionByVector(quaternion: BABYLON.Quaternion, vector: BABYLON.Vector3): BABYLON.Vector3;
        /** Multiply the quaternion by a vector to result */
        static MultiplyQuaternionByVectorToRef(quaternion: BABYLON.Quaternion, vector: BABYLON.Vector3, result: BABYLON.Vector3): void;
        /** Validate and switch Quaternion rotation to Euler rotation. */
        static ValidateTransformRotation(transform: BABYLON.TransformNode): void;
        /** Validate and switch Euler rotation to Quaternion rotation. */
        static ValidateTransformQuaternion(transform: BABYLON.TransformNode): void;
        /** Get the smoothed keyboard input value. */
        static GetKeyboardInputValue(scene: BABYLON.Scene, currentValue: number, targetValue: number): number;
        /** Generate a randome number. */
        static GenerateRandonNumber(min: number, max: number, decimals?: number): number;
        /** Projects a vector onto another vector */
        static ProjectVector(vector: BABYLON.Vector3, onnormal: BABYLON.Vector3): BABYLON.Vector3;
        /** Projects a vector onto another vector and sets result */
        static ProjectVectorToRef(vector: BABYLON.Vector3, onnormal: BABYLON.Vector3, result: BABYLON.Vector3): void;
        /** Projects a vector onto a plane defined by a normal orthogonal to the plane */
        static ProjectVectorOnPlane(vector: BABYLON.Vector3, planenormal: BABYLON.Vector3): BABYLON.Vector3;
        /** Projects a vector onto a plane defined by a normal orthogonal to the plane and sets result */
        static ProjectVectorOnPlaneToRef(vector: BABYLON.Vector3, planenormal: BABYLON.Vector3, result: BABYLON.Vector3): void;
        /** TODO */
        static DownloadEnvironment(cubemap: BABYLON.CubeTexture, success?: () => void, failure?: () => void): void;
        static HasOwnProperty(object: any, property: string): boolean;
        static GetFilenameFromUrl(url: string): string;
        static GetUrlParameter(key: string): string;
        static CreateFontFace(scene: BABYLON.Scene, family: string, asset: BABYLON.IUnityFontAsset, descriptors?: FontFaceDescriptors, oncomplete?: (fontFace: FontFace) => void): FontFace;
        static CreateFontFaceElement(scene: BABYLON.Scene, family: string, asset: BABYLON.IUnityFontAsset, options?: string): HTMLStyleElement;
        /** TODO */
        static PrintToScreen(text: string, color?: string): void;
        private static TmpHullMatrix;
        private static TmpAmmoVectorA;
        private static TmpAmmoVectorB;
        private static TmpAmmoVectorC;
        private static TmpAmmoVectorD;
        private static TmpAmmoNormalA;
        private static TmpAmmoNormalB;
        private static TmpAmmoNormalC;
        static AddMeshVerts(btTriangleMesh: any, topLevelObject: BABYLON.IPhysicsEnabledObject, object: BABYLON.IPhysicsEnabledObject, scaling?: boolean, normals?: boolean): number;
        static AddHullVerts(btConvexHullShape: any, topLevelObject: BABYLON.IPhysicsEnabledObject, object: BABYLON.IPhysicsEnabledObject, scaling?: boolean): number;
        static CreateImpostorCustomShape(scene: BABYLON.Scene, impostor: BABYLON.PhysicsImpostor, type: number, showDebugColliders?: boolean, colliderVisibility?: number, colliderRenderGroup?: number, useTriangleNormals?: boolean): any;
        static UseTriangleNormals(): boolean;
        static ShowDebugColliders(): boolean;
        static ColliderVisibility(): number;
        static ColliderRenderGroup(): number;
        static CollisionWireframe(): boolean;
        static GetColliderMaterial(scene: BABYLON.Scene): BABYLON.Material;
        static CalculateCombinedFriction(friction0: number, friction1: number): number;
        static CalculateCombinedRestitution(restitution0: number, restitution1: number): number;
        /** TODO */
        static GetDirectTargetAngle(transform: BABYLON.TransformNode, worldSpaceTarget: BABYLON.Vector3): number;
        /** TODO */
        static GetSmoothTargetAngle(transform: BABYLON.TransformNode, worldSpaceTarget: BABYLON.Vector3): number;
        /** TODO */
        static CalculatCatmullRom(p0: BABYLON.Vector3, p1: BABYLON.Vector3, p2: BABYLON.Vector3, p3: BABYLON.Vector3, i: number): BABYLON.Vector3;
        /** TODO */
        static CalculatCatmullRomToRef(p0: BABYLON.Vector3, p1: BABYLON.Vector3, p2: BABYLON.Vector3, p3: BABYLON.Vector3, i: number, result: BABYLON.Vector3): void;
        /** TODO */
        static StartsWith(source: string, word: string): boolean;
        /** TODO */
        static EndsWith(source: string, word: string): boolean;
        /** TODO */
        static ReplaceAll(source: string, word: string, replace: string): string;
        /** TODO */
        static IsNullOrEmpty(source: string): boolean;
        /** TODO */
        static SafeStringPush(array: string[], value: string): void;
        /** TODO */
        static ParseColor3(source: BABYLON.IUnityColor, defaultValue?: BABYLON.Color3, toLinearSpace?: boolean): BABYLON.Color3;
        /** TODO */
        static ParseColor4(source: BABYLON.IUnityColor, defaultValue?: BABYLON.Color4, toLinearSpace?: boolean): BABYLON.Color4;
        /** TODO */
        static ParseVector2(source: BABYLON.IUnityVector2, defaultValue?: BABYLON.Vector2): BABYLON.Vector2;
        /** TODO */
        static ParseVector3(source: BABYLON.IUnityVector3, defaultValue?: BABYLON.Vector3): BABYLON.Vector3;
        /** TODO */
        static ParseVector4(source: BABYLON.IUnityVector4, defaultValue?: BABYLON.Vector4): BABYLON.Vector4;
        /** TODO */
        static ParseSound(source: BABYLON.IUnityAudioClip, scene: BABYLON.Scene, name: string, callback?: Nullable<() => void>, options?: BABYLON.ISoundOptions): BABYLON.Sound;
        /** TODO */
        static ParseTexture(source: BABYLON.IUnityTexture, scene: BABYLON.Scene, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, buffer?: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob>, deleteBuffer?: boolean, format?: number): BABYLON.Texture;
        static ParseCubemap(source: BABYLON.IUnityCubemap, scene: BABYLON.Scene): BABYLON.CubeTexture;
        /** TODO */
        static ParseTextAsset(source: BABYLON.IUnityTextAsset, defaultValue?: string): string;
        /** TODO */
        static ParseJsonAsset<T>(source: BABYLON.IUnityTextAsset, defaultValue?: string, reviver?: (this: any, key: string, value: any) => any): T;
        /** TODO */
        static ParseTransformByID(source: BABYLON.IUnityTransform, scene: BABYLON.Scene, defaultValue?: BABYLON.TransformNode): BABYLON.TransformNode;
        static ParseTransformByName(source: BABYLON.IUnityTransform, scene: BABYLON.Scene, defaultValue?: BABYLON.TransformNode): BABYLON.TransformNode;
        /** TODO */
        static ParseChildTransform(parent: BABYLON.TransformNode, source: BABYLON.IUnityTransform, defaultValue?: BABYLON.TransformNode): BABYLON.TransformNode;
        /** Gets the transform node abosulte position */
        static GetAbsolutePosition(transform: BABYLON.TransformNode | BABYLON.Camera, offsetPosition?: BABYLON.Vector3, computeMatrix?: boolean): BABYLON.Vector3;
        /** Gets the transform node abosulte position */
        static GetAbsolutePositionToRef(transform: BABYLON.TransformNode | BABYLON.Camera, result: BABYLON.Vector3, offsetPosition?: BABYLON.Vector3, computeMatrix?: boolean): void;
        /** Transforms position from local space to world space. (Using TransformCoordinates) */
        static TransformPoint(owner: BABYLON.TransformNode | BABYLON.Camera, position: BABYLON.Vector3, computeMatrix?: boolean): BABYLON.Vector3;
        /** Inverse transforms position from world space to local space. (Using TransformCoordinates) */
        static InverseTransformPoint(owner: BABYLON.TransformNode | BABYLON.Camera, position: BABYLON.Vector3, computeMatrix?: boolean): BABYLON.Vector3;
        /** Transforms position from local space to world space. (Using TransformCoordinates) */
        static TransformPointToRef(owner: BABYLON.TransformNode | BABYLON.Camera, position: BABYLON.Vector3, result: BABYLON.Vector3, computeMatrix?: boolean): void;
        /** Inverse transforms position from world space to local space. (Using TransformCoordinates) */
        static InverseTransformPointToRef(owner: BABYLON.TransformNode | BABYLON.Camera, position: BABYLON.Vector3, result: BABYLON.Vector3, computeMatrix?: boolean): void;
        /** Transforms direction from local space to world space. (Using TransformNormal) */
        static TransformDirection(owner: BABYLON.TransformNode | BABYLON.Camera, direction: BABYLON.Vector3, computeMatrix?: boolean): BABYLON.Vector3;
        /** Inverse transforms direction from world space to local space. (Using TransformNormal) */
        static InverseTransformDirection(owner: BABYLON.TransformNode | BABYLON.Camera, direction: BABYLON.Vector3, computeMatrix?: boolean): BABYLON.Vector3;
        /** Transforms direction from local space to world space. (Using TransformNormal) */
        static TransformDirectionToRef(owner: BABYLON.TransformNode | BABYLON.Camera, direction: BABYLON.Vector3, result: BABYLON.Vector3, computeMatrix?: boolean): void;
        /** Inverse transforms direction from world space to local space. (Using TransformNormal) */
        static InverseTransformDirectionToRef(owner: BABYLON.TransformNode | BABYLON.Camera, direction: BABYLON.Vector3, result: BABYLON.Vector3, computeMatrix?: boolean): void;
        /** Recomputes the meshes bounding center pivot point */
        static RecomputeCenterPivotPoint(owner: BABYLON.AbstractMesh): void;
        /** Gets any direction vector of the owner in world space. */
        static GetDirectionVector(owner: BABYLON.TransformNode | BABYLON.Camera, vector: BABYLON.Vector3): BABYLON.Vector3;
        /** Gets any direction vector of the owner in world space. */
        static GetDirectionVectorToRef(owner: BABYLON.TransformNode | BABYLON.Camera, vector: BABYLON.Vector3, result: BABYLON.Vector3): void;
        /** Gets the blue axis of the owner in world space. */
        static GetForwardVector(owner: BABYLON.TransformNode | BABYLON.Camera): BABYLON.Vector3;
        /** Gets the blue axis of the owner in world space. */
        static GetForwardVectorToRef(owner: BABYLON.TransformNode | BABYLON.Camera, result: BABYLON.Vector3): void;
        /** Gets the red axis of the owner in world space. */
        static GetRightVector(owner: BABYLON.TransformNode | BABYLON.Camera): BABYLON.Vector3;
        /** Gets the red axis of the owner in world space. */
        static GetRightVectorToRef(owner: BABYLON.TransformNode | BABYLON.Camera, result: BABYLON.Vector3): void;
        /** Gets the green axis of the owner in world space. */
        static GetUpVector(owner: BABYLON.TransformNode | BABYLON.Camera): BABYLON.Vector3;
        /** Gets the green axis of the owner in world space. */
        static GetUpVectorToRef(owner: BABYLON.TransformNode | BABYLON.Camera, result: BABYLON.Vector3): void;
        /** Blend float buffer values */
        static BlendFloatValue(source: number, value: number, weight: number): number;
        /** Blend vector2 buffer values */
        static BlendVector2Value(source: BABYLON.Vector2, value: BABYLON.Vector2, weight: number): void;
        /** Blend vector3 buffer values */
        static BlendVector3Value(source: BABYLON.Vector3, value: BABYLON.Vector3, weight: number): void;
        /** Blend quaternion buffer values */
        static BlendQuaternionValue(source: BABYLON.Quaternion, value: BABYLON.Quaternion, weight: number): void;
        /** Set animation target property */
        static SetAnimationTargetProperty(animation: BABYLON.Animation, property: string): void;
        /** Gets the float "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationFloat(animation: BABYLON.Animation, time: number): number;
        /** Set the passed vector2 "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationVector2(animation: BABYLON.Animation, time: number): BABYLON.Vector2;
        /** Set the passed vector3 "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationVector3(animation: BABYLON.Animation, time: number): BABYLON.Vector3;
        /** Set the passed quaternion "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationQuaternion(animation: BABYLON.Animation, time: number): BABYLON.Quaternion;
        /** Set the passed matrix "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationMatrix(animation: BABYLON.Animation, time: number): BABYLON.Matrix;
        /** Creates a targeted float animation for tweening.  */
        static CreateTweenAnimation(name: string, targetProperty: string, startValue: number, endValue: number, frameRate?: number, loopMode?: number): BABYLON.Animation;
        /** Gets the last key frame index value. */
        static GetLastKeyFrameIndex(animation: BABYLON.Animation): number;
        /** Private internal frame interpolation helper */
        private static InterpolateAnimation;
        /** Initialize default shader material properties */
        static InitializeShaderMaterial(material: BABYLON.ShaderMaterial, binding?: boolean, clipPlanes?: BABYLON.Nullable<boolean>): void;
        /** Transforms position from world space into screen space. */
        static WorldToScreenPoint(scene: BABYLON.Scene, position: BABYLON.Vector3, camera?: BABYLON.Camera): BABYLON.Vector3;
        /** Transforms a point from screen space into world space. */
        static ScreenToWorldPoint(scene: BABYLON.Scene, position: BABYLON.Vector3): BABYLON.Vector3;
        /** TODO */
        static ConvertAmmoVector3(btVector: any): BABYLON.Vector3;
        /** TODO */
        static ConvertAmmoVector3ToRef(btVector: any, result: BABYLON.Vector3): void;
        /** TODO */
        static ConvertAmmoQuaternion(btVector: any): BABYLON.Quaternion;
        /** TODO */
        static ConvertAmmoQuaternionToRef(btQuaternion: any, result: BABYLON.Quaternion): void;
        static CloneSkeletonPrefab(scene: BABYLON.Scene, skeleton: BABYLON.Skeleton, name: string, id?: string, root?: BABYLON.TransformNode): BABYLON.Skeleton;
        /** Get all loaded scene transform nodes. */
        static GetSceneTransforms(scene: BABYLON.Scene): BABYLON.TransformNode[];
        /** Parse scene component metadata. */
        static PostParseSceneComponents(scene: BABYLON.Scene, transforms: BABYLON.TransformNode[], preloadList: Array<BABYLON.ScriptComponent>, readyList: Array<BABYLON.ScriptComponent>): void;
        /**
         * Gets the specified asset container mesh.
         * @param container defines the asset container
         * @param meshName defines the mesh name to get
         * @returns the mesh from the container
         */
        static GetAssetContainerMesh(container: BABYLON.AssetContainer, meshName: string): BABYLON.Mesh;
        /**
         * Gets the specified asset container transform node.
         * @param container defines the asset container
         * @param nodeName defines the transform node name to get
         * @returns the transform node from the container
         */
        static GetAssetContainerNode(container: BABYLON.AssetContainer, nodeName: string): BABYLON.TransformNode;
        /**
         * Clones the specified asset container item.
         * Associcated skeletons and animation groups will all be cloned. (Internal Use Only)
         * @param container defines the asset container
         * @param assetName defines the asset item name to clone
         * @param nameFunction defines an optional function used to get new names for clones
         * @param cloneAnimations defines an option to clone any animation groups (true by default)
         * @param makeNewMaterials defines an optional boolean that defines if materials must be cloned as well (false by default)
         * @returns the transform node that was duplicated
         */
        static CloneAssetContainerItem(container: BABYLON.AssetContainer, assetName: string, nameFunction?: (sourceName: string) => string, makeNewMaterials?: boolean, cloneAnimations?: boolean): BABYLON.TransformNode;
        static InstantiateHierarchy(node: BABYLON.TransformNode, newParent?: BABYLON.Nullable<BABYLON.TransformNode>, onNewNodeCreated?: (source: BABYLON.TransformNode, clone: BABYLON.TransformNode) => void): BABYLON.Nullable<BABYLON.TransformNode>;
        static InstantiateNodeHierarchy(node: BABYLON.TransformNode, newParent?: BABYLON.Nullable<BABYLON.TransformNode>, onNewNodeCreated?: (source: BABYLON.TransformNode, clone: BABYLON.TransformNode) => void): BABYLON.Nullable<BABYLON.TransformNode>;
        static InstantiateMeshHierarchy(mesh: BABYLON.Mesh, newParent: BABYLON.Nullable<BABYLON.TransformNode>, createInstance: boolean, onNewNodeCreated?: (source: BABYLON.TransformNode, clone: BABYLON.TransformNode) => void): BABYLON.Nullable<BABYLON.TransformNode>;
        /** Computes the transition duration blending speed */
        static ComputeBlendingSpeed(rate: number, duration: number, dampen?: boolean): number;
        static CalculateCameraDistance(farClipPlane: number, lodPercent: number, clipPlaneScale?: number): number;
        /** TODO */
        static InstantiateClass(className: string): any;
        /** TODO */
        static GetSimpleClassName(obj: any): string;
        /** TODO */
        static DisposeEntity(entity: BABYLON.AbstractMesh): void;
        /** TODO */
        static SearchTransformNodes(name: string, nodes: BABYLON.Node[], searchType?: BABYLON.SearchType): BABYLON.Node;
        /** TODO */
        static SearchTransformNodeForTags(query: string, nodes: BABYLON.Node[]): BABYLON.Node;
        /** TODO */
        static SearchAllTransformNodesForTags(query: string, nodes: BABYLON.Node[]): BABYLON.Node[];
        /** TODO */
        static SearchTransformNodeForScript(klass: string, nodes: BABYLON.Node[]): BABYLON.Node;
        /** TODO */
        static SearchAllTransformNodesForScript(klass: string, nodes: BABYLON.Node[]): BABYLON.Node[];
        /** TODO */
        static CreateGuid(suffix?: string): string;
        /** TODO */
        static ValidateTransformGuid(node: TransformNode): void;
        /** TODO */
        static AddShadowCastersToLight(light: BABYLON.IShadowLight, transforms: BABYLON.TransformNode[], includeChildren?: boolean): void;
        /** TODO */
        static RegisterInstancedMeshBuffers(mesh: BABYLON.Mesh): void;
        /** TODO */
        static CloneValue(source: any, destinationObject: any): any;
        /** TODO */
        static CloneEntityMetadata(source: any): any;
        /** TODO */
        static DeepCopyProperties(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void;
        /** TODO */
        static ValidateTransformMetadata(transform: BABYLON.TransformNode): void;
    }
}
/**
 * Babylon Utilties Alias
 */
declare const UTIL: typeof BABYLON.Utilities;

declare const CVTOOLS_NAME = "CVTOOLS_unity_metadata";
declare const CVTOOLS_MESH = "CVTOOLS_babylon_mesh";
declare const CVTOOLS_HAND = "CVTOOLS_left_handed";
/**
 * Babylon Toolkit Editor - Loader Class
 * @class CVTOOLS_unity_metadata - All rights reserved (c) 2020 Mackey Kinard
 * [Specification](https://github.com/MackeyK24/glTF/tree/master/extensions/2.0/Vendor/CVTOOLS_unity_metadata)
 */
declare class CubeTextureLoader {
    name: string;
    mapkey: string;
    material: BABYLON.Material;
    extension: string;
    prefiltered: boolean;
    boundingBoxSize: BABYLON.Vector3;
    boundingBoxPosition: BABYLON.Vector3;
}
declare class CVTOOLS_unity_metadata implements BABYLON.GLTF2.IGLTFLoaderExtension {
    /** The name of this extension. */
    readonly name = "CVTOOLS_unity_metadata";
    /** Defines whether this extension is enabled. */
    enabled: boolean;
    private _loader;
    private _babylonScene;
    private _loaderScene;
    private _assetsManager;
    private _parserList;
    private _masterList;
    private _detailList;
    private _shaderList;
    private _readyList;
    private _preloadList;
    private _materialMap;
    private _lightmapMap;
    private _reflectionMap;
    private _reflectionCache;
    private _assetContainer;
    private _activeMeshes;
    private _parseScene;
    private _leftHanded;
    private _disposeRoot;
    private _sceneParsed;
    private _preWarmTime;
    private _hideLoader;
    private _fileName;
    private _rootUrl;
    /** @hidden */
    constructor(loader: BABYLON.GLTF2.GLTFLoader);
    /** @hidden */
    dispose(): void;
    /** @hidden */
    onLoading(): void;
    /** @hidden */
    onReady(): void;
    /** @hidden */
    onComplete(): void;
    /** @hidden */
    onValidate(): void;
    /** @hidden */
    onCleanup(): void;
    /** @hidden */
    setupLoader(): void;
    /** @hidden */
    startParsing(): void;
    /** @hidden */
    loadSceneAsync(context: string, scene: BABYLON.GLTF2.IScene): BABYLON.Nullable<Promise<void>>;
    private loadSceneExAsync;
    private _processActiveMeshes;
    private _processUnityMeshes;
    private _processPreloadTimeout;
    /** @hidden */
    loadNodeAsync(context: string, node: BABYLON.GLTF2.INode, assign: (babylonMesh: BABYLON.TransformNode) => void): BABYLON.Nullable<Promise<BABYLON.TransformNode>>;
    /** @hidden */
    loadMaterialPropertiesAsync(context: string, material: BABYLON.GLTF2.IMaterial, babylonMaterial: BABYLON.Material): BABYLON.Nullable<Promise<void>>;
    private _getCachedMaterialByIndex;
    private _getCachedLightmapByIndex;
    /** @hidden */
    createMaterial(context: string, material: BABYLON.GLTF2.IMaterial, babylonDrawMode: number): BABYLON.Nullable<BABYLON.Material>;
    /** @hidden */
    loadDataUrlAsync(context: string, uri: string): Promise<ArrayBufferView>;
    /** @hidden */
    _loadSkinAsync(context: string, node: BABYLON.GLTF2.INode, skin: BABYLON.GLTF2.ISkin): Promise<void>;
    /** @hidden */
    loadAnimationAsync(context: string, animation: BABYLON.GLTF2.IAnimation): Promise<BABYLON.AnimationGroup>;
    /** @hidden */
    _loadMeshPrimitiveAsync(context: string, name: string, node: BABYLON.GLTF2.INode, mesh: BABYLON.GLTF2.IMesh, primitive: BABYLON.GLTF2.IMeshPrimitive, assign: (babylonMesh: BABYLON.AbstractMesh) => void): Promise<BABYLON.AbstractMesh>;
    private _setupBabylonMesh;
    private _processLevelOfDetail;
    private _setupBabylonMaterials;
    private _processShaderMaterials;
    private preProcessSceneProperties;
    private postProcessSceneProperties;
    private _preloadRawMaterialsAsync;
    private _parseMultiMaterialAsync;
    private _parseShaderMaterialPropertiesAsync;
    private _parseDiffuseMaterialPropertiesAsync;
    private _parseCommonConstantProperties;
}
/**
 * Babylon Toolkit Editor - Loader Class
 * @class CVTOOLS_babylon_mesh - All rights reserved (c) 2020 Mackey Kinard
 * [Specification](https://github.com/MackeyK24/glTF/tree/master/extensions/2.0/Vendor/CVTOOLS_unity_metadata)
 */
declare class CVTOOLS_babylon_mesh implements BABYLON.GLTF2.IGLTFLoaderExtension {
    /** The name of this extension. */
    readonly name = "CVTOOLS_babylon_mesh";
    /** Defines whether this extension is enabled. */
    enabled: boolean;
    private _loader;
    /** @hidden */
    constructor(loader: BABYLON.GLTF2.GLTFLoader);
    /** @hidden */
    dispose(): void;
}
/**
 * Babylon Toolkit Editor - Loader Class
 * @class CVTOOLS_left_handed - All rights reserved (c) 2020 Mackey Kinard
 * [Specification](https://github.com/MackeyK24/glTF/tree/master/extensions/2.0/Vendor/CVTOOLS_unity_metadata)
 */
declare class CVTOOLS_left_handed implements BABYLON.GLTF2.IGLTFLoaderExtension {
    /** The name of this extension. */
    readonly name = "CVTOOLS_left_handed";
    /** Defines whether this extension is enabled. */
    enabled: boolean;
    private _loader;
    /** @hidden */
    constructor(loader: BABYLON.GLTF2.GLTFLoader);
    /** @hidden */
    dispose(): void;
}

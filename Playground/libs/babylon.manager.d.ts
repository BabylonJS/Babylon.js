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
        /** Pauses the main page render loop */
        static PauseRenderLoop: boolean;
        /** Register handler that is triggered when the fonts have been loaded (engine.html) */
        static OnFontsReadyObservable: Observable<Engine>;
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
        static ShowParentLoader(show: boolean): void;
        /** Get the system render quality setting. */
        static GetRenderQuality(): BABYLON.RenderQuality;
        /** Set the system render quality setting. */
        static SetRenderQuality(quality: BABYLON.RenderQuality): void;
        /** Store data object in the window state cache */
        static SetWindowState(name: string, data: any): void;
        /** Retrieve data object from the window state cache */
        static GetWindowState<T>(name: string): T;
        /** Post a safe message to top or local window */
        static PostWindowMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void;
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
        /** Get the delta time animation ratio multiplier */
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
        /** Post data to server */
        static PostDataToServer(url: string, data: string | Document | Blob | ArrayBufferView | ArrayBuffer | FormData | URLSearchParams | ReadableStream<Uint8Array>, contentType?: string, onComplete?: (status: int) => void): XMLHttpRequest;
        /** Shows the default page scene loader. */
        static ShowDefaultLoader(show: boolean): void;
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
        static StartTweenAnimation(scene: BABYLON.Scene, name: string, targetObject: any, targetProperty: string, startValue: number, endValue: number, speedRatio?: number, frameRate?: number, loopMode?: number, easingFunction?: BABYLON.EasingFunction, onAnimationComplete?: () => void): BABYLON.Animatable;
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
        /** Finds all transforms with the specified script component. */
        static FindTransformsWithScript(scene: BABYLON.Scene, klass: string): BABYLON.TransformNode;
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
        /** Searches all nodes for the instance of the specified script component. */
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
        static ConfigurePhysicsEngine(scene: BABYLON.Scene, deltaWorldStep?: boolean, maxPhysicsStep?: number, maxWorldSweep?: number, ccdEnabled?: boolean, ccdPenetration?: number, gravityLevel?: BABYLON.Vector3): void;
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
        /** Register handler that is triggered when the audio clip is ready */
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
        static BakeNavigationMesh(scene: BABYLON.Scene, meshes: BABYLON.Mesh[], properties: BABYLON.INavMeshParameters, debug?: boolean, color?: BABYLON.Color3): BABYLON.Mesh;
        /** Load the recast navigation mesh binary data. (Navigation Helper) */
        static LoadNavigationMesh(scene: BABYLON.Scene, data: Uint8Array, debug?: boolean, color?: BABYLON.Color3, timeSteps?: number): BABYLON.Mesh;
        /** Save the recast navigation mesh binary data. (Navigation Helper) */
        static SaveNavigationMesh(): Uint8Array;
        /** Computes a recast navigation path. (Navigation Helper) */
        static ComputeNavigationPath(start: BABYLON.Vector3, end: BABYLON.Vector3, closetPoint?: boolean): BABYLON.Vector3[];
        /** Animate movement along a navigation path. (Navigation Helper) */
        static MoveAlongNavigationPath(scene: BABYLON.Scene, agent: BABYLON.TransformNode, path: BABYLON.Vector3[], speed?: number, easing?: BABYLON.EasingFunction, callback?: () => void): BABYLON.Animation;
        /** Global gamepad manager */
        static GamepadManager: BABYLON.GamepadManager;
        /** Global gamepad connect event handler */
        static GamepadConnected: (pad: BABYLON.Gamepad, state: BABYLON.EventState) => void;
        /** Global gamepad disconnect event handler */
        static GamepadDisconnected: (pad: BABYLON.Gamepad, state: BABYLON.EventState) => void;
        /** Enable user input state in the scene. */
        static EnableUserInput(scene: BABYLON.Scene, options?: {
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
        postProcessSceneComponents(): void;
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
        private _lateUpdate;
        private _properties;
        private _awoken;
        private _started;
        private _scene;
        private _transform;
        private _registeredClassname;
        /** Gets the current scene object */
        get scene(): BABYLON.Scene;
        /** Gets the transform node entity */
        get transform(): BABYLON.TransformNode;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        /** Sets the script component property bag value */
        protected setProperty(name: string, propertyValue: any): void;
        /** Gets the script component property bag value */
        protected getProperty<T>(name: string, defaultValue?: T): T;
        /** Gets the registered script component class name */
        getClassName(): string;
        /** Get the current time in seconds */
        getTime(): number;
        /** Get the total game time in seconds */
        getGameTime(): number;
        /** Get the current delta time in seconds */
        getDeltaSeconds(): number;
        /** Get the delta time animation ratio multiplier */
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
        /** Register handler that is triggered after the scene has rendered and is ready to go */
        registerOnSceneReady(func: (eventData: BABYLON.Scene, eventState: BABYLON.EventState) => void): void;
        /** Registers an on pick tricgger click action */
        registerOnClickAction(func: () => void): BABYLON.IAction;
        /** Unregisters an on pick tricgger click action */
        unregisterOnClickAction(action: BABYLON.IAction): boolean;
        /** Register handler that is triggered after each physics fixed update step */
        registerOnFixedUpdate(func: (impostor: BABYLON.PhysicsImpostor) => void): boolean;
        /** Unregister observer that is triggered after each physics fixed update step */
        unregisterOnFixedUpdate(func: (impostor: BABYLON.PhysicsImpostor) => void): boolean;
        /** Register handler that is triggered when the a volume has entered */
        onTriggerEnterObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a volume contact is active */
        onTriggerStayObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a volume contact has exited */
        onTriggerExitObservable: Observable<AbstractMesh>;
        private triggerMesh;
        private triggerVolumeList;
        useTriggerVolumePrecision: boolean;
        includeTriggerVolumeDescendants: boolean;
        getTriggerVolumeList(): BABYLON.TriggerVolume[];
        resetTriggerVolumeList(): void;
        registerTriggerVolume(volume: BABYLON.AbstractMesh): void;
        unregisterTriggerVolume(volume: BABYLON.AbstractMesh): void;
        private registerComponentInstance;
        private destroyComponentInstance;
        private static RegisterInstance;
        private static UpdateInstance;
        private static LateInstance;
        private static AfterInstance;
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
        getClassName(): string;
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
        private _attachAfterBind;
    }
    /**
     * Babylon universal terrain material pro class
     * @class UniversalTerrainMaterial
     */
    class UniversalTerrainMaterial extends BABYLON.UniversalAlbedoMaterial {
        constructor(name: string, scene: BABYLON.Scene);
        getClassName(): string;
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
        None = 0,
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
        static IsLayerMasked(mask: number, layer: number): boolean;
        static GetLoadingState(): number;
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
        static QuaternionDiff(value1: BABYLON.Quaternion, value2: BABYLON.Quaternion): BABYLON.Quaternion;
        /** Computes the difference in quaternion values to a result value */
        static QuaternionDiffToRef(value1: BABYLON.Quaternion, value2: BABYLON.Quaternion, result: BABYLON.Quaternion): void;
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
        /** Get the smoothed keyboard input value  */
        static GetKeyboardInputValue(scene: BABYLON.Scene, currentValue: number, targetValue: number): number;
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
        static AddMeshVerts(btTriangleMesh: any, topLevelObject: BABYLON.IPhysicsEnabledObject, object: BABYLON.IPhysicsEnabledObject, scaling?: boolean): number;
        static AddHullVerts(btConvexHullShape: any, topLevelObject: BABYLON.IPhysicsEnabledObject, object: BABYLON.IPhysicsEnabledObject, scaling?: boolean): number;
        static CreateImpostorCustomShape(scene: BABYLON.Scene, impostor: BABYLON.PhysicsImpostor, type: number, showDebugColliders?: boolean, colliderVisibility?: number): any;
        static ShowDebugColliders(): boolean;
        static ColliderVisibility(): number;
        static CollisionWireframe(): boolean;
        static GetColliderMaterial(scene: BABYLON.Scene): BABYLON.Material;
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
        static GetAbsolutePosition(transform: BABYLON.TransformNode, offsetPosition?: BABYLON.Vector3, computeMatrix?: boolean): BABYLON.Vector3;
        /** Gets the transform node abosulte position */
        static GetAbsolutePositionToRef(transform: BABYLON.TransformNode, result: BABYLON.Vector3, offsetPosition?: BABYLON.Vector3, computeMatrix?: boolean): void;
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
        static SampleAnimationFloat(animation: BABYLON.Animation, frame: number): number;
        /** Set the passed vector2 "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationVector2(animation: BABYLON.Animation, frame: number): BABYLON.Vector2;
        /** Set the passed vector3 "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationVector3(animation: BABYLON.Animation, frame: number): BABYLON.Vector3;
        /** Set the passed quaternion "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationQuaternion(animation: BABYLON.Animation, frame: number): BABYLON.Quaternion;
        /** Set the passed matrix "result" as the sampled key frame value for the specfied animation track. */
        static SampleAnimationMatrix(animation: BABYLON.Animation, frame: number): BABYLON.Matrix;
        /** Creates a targeted float animation for tweening.  */
        static CreateFloatAnimation(name: string, targetProperty: string, startValue: number, endValue: number, frameRate?: number, loopMode?: number): BABYLON.Animation;
        /** Gets the last key frame index value. */
        static GetLastKeyFrameIndex(animation: BABYLON.Animation): number;
        /** Private internal frame interpolation helper */
        private static InterpolateAnimation;
        /** Initialize default shader material properties */
        static InitializeShaderMaterial(material: BABYLON.ShaderMaterial, binding?: boolean): void;
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
        static ParseSceneComponents(scene: BABYLON.Scene, transforms: BABYLON.TransformNode[]): void;
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
declare class CVTOOLS_unity_metadata implements BABYLON.GLTF2.IGLTFLoaderExtension {
    /** The name of this extension. */
    readonly name = "CVTOOLS_unity_metadata";
    /** Defines whether this extension is enabled. */
    enabled: boolean;
    private static LastRootUrl;
    private static LastParseScene;
    private static LastBabylonScene;
    private _loader;
    private _parserList;
    private _masterList;
    private _detailList;
    private _shaderList;
    private _materialMap;
    private _lightmapMap;
    private _reflectionMap;
    private _activeMeshes;
    private _parseScene;
    private _leftHanded;
    private _disposeRoot;
    private _sceneParsed;
    private _rootUrl;
    /** @hidden */
    constructor(loader: BABYLON.GLTF2.GLTFLoader);
    /** @hidden */
    dispose(): void;
    /** @hidden */
    onLoading(): void;
    /** @hidden */
    loadSceneAsync(context: string, scene: BABYLON.GLTF2.IScene): BABYLON.Nullable<Promise<void>>;
    /** @hidden */
    onReady(): void;
    private _processActiveMeshes;
    private _processUnityMeshes;
    /** @hidden */
    loadNodeAsync(context: string, node: BABYLON.GLTF2.INode, assign: (babylonMesh: BABYLON.TransformNode) => void): BABYLON.Nullable<Promise<BABYLON.TransformNode>>;
    /** @hidden */
    loadMaterialPropertiesAsync(context: string, material: BABYLON.GLTF2.IMaterial, babylonMaterial: BABYLON.Material): BABYLON.Nullable<Promise<void>>;
    private _getCachedLightmapByIndex;
    private _getCachedMaterialByIndex;
    private _getCachedCubemapByUrl;
    /** @hidden */
    createMaterial(context: string, material: BABYLON.GLTF2.IMaterial, babylonDrawMode: number): BABYLON.Nullable<BABYLON.Material>;
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

declare module BABYLON {
    /**
     * Babylon animation state pro class (Unity Style Mechanim Animation System)
     * @class AnimationState - All rights reserved (c) 2020 Mackey Kinard
     */
    class AnimationState extends BABYLON.ScriptComponent {
        private static FPS;
        private static TIME;
        private static EXIT;
        private static MOTION;
        private _frametime;
        private _layercount;
        private _updatemode;
        private _hasrootmotion;
        private _processmotion;
        private _initialtargetblending;
        private _hastransformhierarchy;
        private _leftfeetbottomheight;
        private _rightfeetbottomheight;
        private _runtimecontroller;
        private _executed;
        private _checkers;
        private _source;
        private _machine;
        private _deltaPosition;
        private _deltaRotation;
        private _deltaAngleY;
        private _positionWeight;
        private _rootBoneWeight;
        private _rotationWeight;
        private _rootQuatWeight;
        private _positionHolder;
        private _rootBoneHolder;
        private _rotationHolder;
        private _rootQuatHolder;
        private _rootMotionMatrix;
        private _rootMotionScaling;
        private _rootMotionRotation;
        private _rootMotionPosition;
        private _lastMotionRotation;
        private _lastMotionPosition;
        private _quatRotationDiff;
        private _quatRotateVector;
        private _dirtyMotionMatrix;
        private _dirtyBlenderMatrix;
        private _targetPosition;
        private _targetRotation;
        private _targetScaling;
        private _updateMatrix;
        private _blenderMatrix;
        private _blendWeights;
        private _data;
        private _anims;
        private _numbers;
        private _booleans;
        private _triggers;
        private _parameters;
        speedRatio: number;
        applyRootMotion: boolean;
        enableAnimation: boolean;
        hasRootMotion(): boolean;
        getAnimationTime(): number;
        getDeltaPosition(): BABYLON.Vector3;
        getDeltaRotation(): BABYLON.Quaternion;
        getRuntimeController(): string;
        protected m_avatarMask: Map<string, number>;
        protected m_defaultGroup: BABYLON.AnimationGroup;
        protected m_animationTargets: BABYLON.TargetedAnimation[];
        protected awake(): void;
        protected late(): void;
        protected destroy(): void;
        /** Register handler that is triggered when the animation ik setup has been triggered */
        onAnimationIKObservable: Observable<number>;
        /** Register handler that is triggered when the animation end has been triggered */
        onAnimationEndObservable: Observable<number>;
        /** Register handler that is triggered when the animation loop has been triggered */
        onAnimationLoopObservable: Observable<number>;
        /** Register handler that is triggered when the animation event has been triggered */
        onAnimationEventObservable: Observable<IAnimatorEvent>;
        /** Register handler that is triggered when the animation frame has been updated */
        onAnimationUpdateObservable: Observable<TransformNode>;
        playAnimation(state: string, transitionDuration?: number, animationLayer?: number, frameRate?: number): boolean;
        getBool(name: string): boolean;
        setBool(name: string, value: boolean): void;
        getFloat(name: string): float;
        setFloat(name: string, value: float): void;
        getInteger(name: string): int;
        setInteger(name: string, value: int): void;
        getTrigger(name: string): boolean;
        setTrigger(name: string): void;
        resetTrigger(name: string): void;
        private getMachineState;
        private setMachineState;
        getCurrentState(layer: number): BABYLON.MachineState;
        getAnimationGroup(name: string): BABYLON.AnimationGroup;
        getAnimationGroups(): Map<string, BABYLON.AnimationGroup>;
        setAnimationGroups(groups: BABYLON.AnimationGroup[], remapTargets?: boolean): void;
        getRootMotionAngle(): number;
        getRootMotionSpeed(): number;
        getForwardMoveSpeed(absolute?: boolean): number;
        private awakeStateMachine;
        private lateStateMachine;
        private destroyStateMachine;
        private updateAnimationState;
        private updateAnimationCurves;
        private updateAnimationTargets;
        private updateBlendableTargets;
        private finalizeAnimationTargets;
        private checkStateMachine;
        private checkStateTransitions;
        private setCurrentAnimationState;
        private checkAvatarTransformPath;
        private filterTargetAvatarMask;
        private sortWeightedBlendingList;
        private computeWeightedFrameRatio;
        private setupTreeBranches;
        private parseTreeBranches;
        private parse1DSimpleTreeBranches;
        private parse2DSimpleDirectionalTreeBranches;
        private parse2DFreeformDirectionalTreeBranches;
        private parse2DFreeformCartesianTreeBranches;
    }
    class BlendTreeValue {
        source: BABYLON.IBlendTreeChild;
        motion: string;
        posX: number;
        posY: number;
        weight: number;
        constructor(config: {
            source: BABYLON.IBlendTreeChild;
            motion: string;
            posX?: number;
            posY?: number;
            weight?: number;
        });
    }
    class BlendTreeUtils {
        static ClampValue(num: number, min: number, max: number): number;
        static GetSignedAngle(a: BABYLON.Vector2, b: BABYLON.Vector2): number;
        static GetLinearInterpolation(x0: number, y0: number, x1: number, y1: number, x: number): number;
        static GetRightNeighbourIndex(inputX: number, blendTreeArray: BABYLON.BlendTreeValue[]): number;
    }
    class BlendTreeSystem {
        static Calculate1DSimpleBlendTree(inputX: number, blendTreeArray: BABYLON.BlendTreeValue[]): void;
        static Calculate2DFreeformDirectional(inputX: number, inputY: number, blendTreeArray: BABYLON.BlendTreeValue[]): void;
        static Calculate2DFreeformCartesian(inputX: number, inputY: number, blendTreeArray: BABYLON.BlendTreeValue[]): void;
        private static TempVector2_IP;
        private static TempVector2_POSI;
        private static TempVector2_POSJ;
        private static TempVector2_POSIP;
        private static TempVector2_POSIJ;
    }
    class MachineState {
        hash: number;
        name: string;
        tag: string;
        time: number;
        type: BABYLON.MotionType;
        rate: number;
        length: number;
        layer: string;
        layerIndex: number;
        played: number;
        machine: string;
        motionid: number;
        interrupted: boolean;
        apparentSpeed: number;
        averageAngularSpeed: number;
        averageDuration: number;
        averageSpeed: number[];
        cycleOffset: number;
        cycleOffsetParameter: string;
        cycleOffsetParameterActive: boolean;
        iKOnFeet: boolean;
        mirror: boolean;
        mirrorParameter: string;
        irrorParameterActive: boolean;
        speed: number;
        speedParameter: string;
        speedParameterActive: boolean;
        blendtree: BABYLON.IBlendTree;
        transitions: BABYLON.ITransition[];
        behaviours: BABYLON.IBehaviour[];
        events: BABYLON.IAnimatorEvent[];
        constructor();
    }
    class TransitionCheck {
        result: string;
        offest: number;
        blending: number;
        triggered: string[];
    }
    class AnimationMixer {
        influenceBuffer: number;
        positionBuffer: BABYLON.Vector3;
        rotationBuffer: BABYLON.Quaternion;
        scalingBuffer: BABYLON.Vector3;
        originalMatrix: BABYLON.Matrix;
        blendingFactor: number;
        blendingSpeed: number;
        rootPosition: BABYLON.Vector3;
        rootRotation: BABYLON.Quaternion;
    }
    class BlendingWeights {
        primary: BABYLON.IBlendTreeChild;
        secondary: BABYLON.IBlendTreeChild;
    }
    enum MotionType {
        Clip = 0,
        Tree = 1
    }
    enum ConditionMode {
        If = 1,
        IfNot = 2,
        Greater = 3,
        Less = 4,
        Equals = 6,
        NotEqual = 7
    }
    enum InterruptionSource {
        None = 0,
        Source = 1,
        Destination = 2,
        SourceThenDestination = 3,
        DestinationThenSource = 4
    }
    enum BlendTreeType {
        Simple1D = 0,
        SimpleDirectional2D = 1,
        FreeformDirectional2D = 2,
        FreeformCartesian2D = 3,
        Direct = 4,
        Clip = 5
    }
    enum BlendTreePosition {
        Lower = 0,
        Upper = 1
    }
    enum AnimatorParameterType {
        Float = 1,
        Int = 3,
        Bool = 4,
        Trigger = 9
    }
    interface IAnimatorEvent {
        id: number;
        clip: string;
        time: number;
        function: string;
        intParameter: number;
        floatParameter: number;
        stringParameter: string;
        objectIdParameter: string;
        objectNameParameter: string;
    }
    interface IAvatarMask {
        hash: number;
        maskName: string;
        maskType: string;
        transformCount: number;
        transformPaths: string[];
    }
    interface IAnimationLayer {
        hash: number;
        name: string;
        index: number;
        entry: string;
        machine: string;
        iKPass: boolean;
        avatarMask: BABYLON.IAvatarMask;
        blendingMode: number;
        defaultWeight: number;
        syncedLayerIndex: number;
        syncedLayerAffectsTiming: boolean;
        animationTime: number;
        animationNormal: number;
        animationFirstRun: boolean;
        animationEndFrame: boolean;
        animationLoopFrame: boolean;
        animationLoopEvents: any;
        animationStateMachine: BABYLON.MachineState;
    }
    interface IAnimationCurve {
        length: number;
        preWrapMode: string;
        postWrapMode: string;
        keyframes: BABYLON.IAnimationKeyframe[];
    }
    interface IAnimationKeyframe {
        time: number;
        value: number;
        inTangent: number;
        outTangent: number;
        tangentMode: number;
    }
    interface IBehaviour {
        hash: number;
        name: string;
        layerIndex: number;
        properties: any;
    }
    interface ITransition {
        hash: number;
        anyState: boolean;
        layerIndex: number;
        machineLayer: string;
        machineName: string;
        canTransitionToSelf: boolean;
        destination: string;
        duration: number;
        exitTime: number;
        hasExitTime: boolean;
        fixedDuration: boolean;
        intSource: BABYLON.InterruptionSource;
        isExit: boolean;
        mute: boolean;
        name: string;
        offset: number;
        orderedInt: boolean;
        solo: boolean;
        conditions: BABYLON.ICondition[];
    }
    interface ICondition {
        hash: number;
        mode: BABYLON.ConditionMode;
        parameter: string;
        threshold: number;
    }
    interface IBlendTree {
        hash: number;
        name: string;
        state: string;
        children: BABYLON.IBlendTreeChild[];
        layerIndex: number;
        apparentSpeed: number;
        averageAngularSpeed: number;
        averageDuration: number;
        averageSpeed: number[];
        blendParameterX: string;
        blendParameterY: string;
        blendType: BABYLON.BlendTreeType;
        isAnimatorMotion: boolean;
        isHumanMotion: boolean;
        isLooping: boolean;
        minThreshold: number;
        maxThreshold: number;
        useAutomaticThresholds: boolean;
        valueParameterX: number;
        valueParameterY: number;
    }
    interface IBlendTreeChild {
        hash: number;
        layerIndex: number;
        cycleOffset: number;
        directBlendParameter: string;
        apparentSpeed: number;
        averageAngularSpeed: number;
        averageDuration: number;
        averageSpeed: number[];
        mirror: boolean;
        type: BABYLON.MotionType;
        motion: string;
        positionX: number;
        positionY: number;
        threshold: number;
        timescale: number;
        subtree: BABYLON.IBlendTree;
        weight: number;
        ratio: number;
        track: BABYLON.AnimationGroup;
    }
}

declare module BABYLON {
    /**
     * Babylon audio source manager pro class
     * @class AudioSource - All rights reserved (c) 2020 Mackey Kinard
     */
    class AudioSource extends BABYLON.ScriptComponent {
        private _audio;
        private _name;
        private _file;
        private _loop;
        private _mute;
        private _volume;
        private _pitch;
        private _priority;
        private _panstereo;
        private _mindistance;
        private _maxdistance;
        private _rolloffmode;
        private _rollofffactor;
        private _playonawake;
        private _spatialblend;
        private _reverbzonemix;
        private _lastmutedvolume;
        private _bypasseffects;
        private _bypassreverbzones;
        private _bypasslistenereffects;
        private _initializedReadyInstance;
        getSoundClip(): BABYLON.Sound;
        getAudioElement(): HTMLAudioElement;
        /** Register handler that is triggered when the audio clip is ready */
        onReadyObservable: Observable<Sound>;
        protected awake(): void;
        protected destroy(): void;
        protected awakeAudioSource(): void;
        protected destroyAudioSource(): void;
        /**
         * Gets the ready status for track
         */
        isReady(): boolean;
        /**
         * Gets the playing status for track
         */
        isPlaying(): boolean;
        /**
         * Gets the paused status for track
         */
        isPaused(): boolean;
        /**
         * Play the sound track
         * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
         * @param offset (optional) Start the sound at a specific time in seconds
         * @param length (optional) Sound duration (in seconds)
         */
        play(time?: number, offset?: number, length?: number): boolean;
        /**
         * Pause the sound track
         */
        pause(): boolean;
        /**
         * Stop the sound track
         * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
         */
        stop(time?: number): boolean;
        /**
         * Mute the sound track
         * @param time (optional) Mute the sound after X seconds. Start immediately (0) by default.
         */
        mute(time?: number): boolean;
        /**
         * Unmute the sound track
         * @param time (optional) Unmute the sound after X seconds. Start immediately (0) by default.
         */
        unmute(time?: number): boolean;
        /**
         * Gets the volume of the track
         */
        getVolume(): number;
        /**
         * Sets the volume of the track
         * @param volume Define the new volume of the sound
         * @param time Define time for gradual change to new volume
         */
        setVolume(volume: number, time?: number): boolean;
        /**
         * Gets the spatial sound option of the track
         */
        getSpatialSound(): boolean;
        /**
         * Gets the spatial sound option of the track
         * @param value Define the value of the spatial sound
         */
        setSpatialSound(value: boolean): void;
        /**
         * Sets the sound track playback speed
         * @param rate the audio playback rate
         */
        setPlaybackSpeed(rate: number): void;
        /**
         * Gets the current time of the track
         */
        getCurrentTrackTime(): number;
    }
}

declare module BABYLON {
    /**
     * Babylon kinematic character controller pro class (Native Bullet Physics 2.82)
     * @class CharacterController - All rights reserved (c) 2020 Mackey Kinard
     */
    class CharacterController extends BABYLON.ScriptComponent {
        private static MARGIN_FACTOR;
        private _abstractMesh;
        private _avatarRadius;
        private _avatarHeight;
        private _centerOffset;
        private _skinWidth;
        private _stepOffset;
        private _slopeLimit;
        private _capsuleSegments;
        private _minMoveDistance;
        private _isPhysicsReady;
        private _maxCollisions;
        private _useGhostSweepTest;
        private _tmpCollisionContacts;
        updatePosition: boolean;
        getInternalCharacter(): any;
        getAvatarRadius(): number;
        getAvatarHeight(): number;
        getSkinWidth(): number;
        getStepOffset(): number;
        getUseSweepTest(): any;
        getMinMoveDistance(): number;
        setMinMoveDistance(distance: number): void;
        getVerticalVelocity(): number;
        getAddedMargin(): number;
        setAddedMargin(margin: number): void;
        setMaxJumpHeight(maxJumpHeight: number): void;
        setFallingSpeed(fallSpeed: number): void;
        getSlopeLimit(): number;
        setSlopeLimit(slopeRadians: number): void;
        setUpAxis(axis: number): void;
        getGravity(): number;
        setGravity(gravity: number): void;
        isGrounded(): boolean;
        isReady(): boolean;
        canJump(): boolean;
        protected m_character: any;
        protected m_ghostShape: any;
        protected m_ghostObject: any;
        protected m_ghostCollision: any;
        protected m_ghostTransform: any;
        protected m_ghostPosition: any;
        protected m_startPosition: any;
        protected m_startTransform: any;
        protected m_walkDirection: any;
        protected m_warpPosition: any;
        protected m_turningRate: number;
        protected m_moveDeltaX: number;
        protected m_moveDeltaZ: number;
        protected m_physicsEngine: BABYLON.IPhysicsEngine;
        protected m_collisionPosition: BABYLON.Vector3;
        protected internalWarp(position: any): void;
        protected internalJump(): void;
        protected internalSetJumpSpeed(speed: number): void;
        protected internalSetWalkDirection(direction: any): void;
        protected internalSetVelocityForTimeInterval(velocity: any, interval: number): void;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected destroy(): void;
        protected awakeMovementState(): void;
        protected startMovementState(): void;
        protected syncMovementState(): void;
        protected updateMovementState(): void;
        protected parseGhostCollisionContacts(): void;
        protected destroyMovementState(): void;
        /** Register handler that is triggered when the transform position has been updated */
        onUpdatePositionObservable: Observable<TransformNode>;
        /** Register handler that is triggered when the a collision contact has entered */
        onCollisionEnterObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a collision contact is active */
        onCollisionStayObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a collision contact has exited */
        onCollisionExitObservable: Observable<AbstractMesh>;
        /** Sets the maximum number of simultaneous contact notfications to dispatch per frame. Defaults value is 4. (Advanved Use Only) */
        setMaxNotifications(max: number): void;
        /** Sets character collision activation state using physics ghost object. (Advanved Use Only) */
        setActivationState(state: number): void;
        /** Gets character collision group filter using physics ghost object. (Advanved Use Only) */
        getCollisionFilterGroup(): number;
        /** Sets character collision group filter using physics ghost object. (Advanved Use Only) */
        setCollisionFilterGroup(group: number): void;
        /** Gets character collision mask filter using physics ghost object. (Advanved Use Only) */
        getCollisionFilterMask(): number;
        /** Sets the character collision mask filter using physics ghost object. (Advanved Use Only) */
        setCollisionFilterMask(mask: number): void;
        /** Gets the chracter contact processing threshold using physics ghost object. (Advanved Use Only) */
        getContactProcessingThreshold(): number;
        /** Sets character contact processing threshold using physics ghost object. (Advanved Use Only) */
        setContactProcessingThreshold(threshold: number): void;
        /** Manually set the position of the physics ghost object world transform. (Advanved Use Only) */
        setGhostWorldPosition(position: BABYLON.Nullable<BABYLON.Vector3>): void;
        /** Translates the kinematic character with the specfied movement velocity. */
        move(velocity: BABYLON.Vector3): void;
        /** Jumps the kinematic chacracter with the specified jump speed. */
        jump(speed: number): void;
        /** Warps the kinematic chacracter to the specified warp position. */
        warp(position: BABYLON.Vector3): void;
    }
}

declare module BABYLON {
    /**
     * Babylon navigation agent pro class (Unity Style Navigation Agent System)
     * @class NavigationAgent - All rights reserved (c) 2020 Mackey Kinard
     */
    class NavigationAgent extends BABYLON.ScriptComponent {
        private static TARGET_ANGLE_FACTOR;
        private static ANGULAR_SPEED_RATIO;
        private type;
        private speed;
        private baseOffset;
        private avoidRadius;
        private avoidHeight;
        private acceleration;
        private areaMask;
        private autoRepath;
        private autoBraking;
        private autoTraverseOffMeshLink;
        private avoidancePriority;
        private obstacleAvoidanceType;
        private distanceToTarget;
        private moveDirection;
        private resetPosition;
        private lastPosition;
        private currentPosition;
        private currentVelocity;
        private currentWaypoint;
        heightOffset: number;
        angularSpeed: number;
        updatePosition: boolean;
        distanceEpsilon: number;
        velocityEpsilon: number;
        stoppingDistance: number;
        isNavigating(): boolean;
        getAgentType(): number;
        getAgentState(): number;
        getAgentIndex(): number;
        getAgentRadius(): number;
        getAgentHeight(): number;
        getAgentSpeed(): number;
        getAgentOffset(): number;
        getTargetDistance(): number;
        protected m_agentState: number;
        protected m_agentIndex: number;
        protected m_agentGhost: BABYLON.TransformNode;
        protected m_agentParams: BABYLON.IAgentParameters;
        protected m_agentRotation: BABYLON.Quaternion;
        protected m_agentMovement: BABYLON.Vector3;
        protected m_agentDirection: BABYLON.Vector3;
        protected m_agentQuaternion: BABYLON.Quaternion;
        protected m_agentDestination: BABYLON.Vector3;
        protected awake(): void;
        protected update(): void;
        protected destroy(): void;
        /** Register handler that is triggered before the navigation update */
        onPreUpdateObservable: Observable<TransformNode>;
        /** Register handler that is triggered after the navigation update */
        onPostUpdateObservable: Observable<TransformNode>;
        /** Register handler that is triggered when the navigation is complete */
        onNavCompleteObservable: Observable<TransformNode>;
        private awakeNavigationAgent;
        private updateNavigationAgent;
        private destroyNavigationAgent;
        /** Move agent relative to current position. */
        move(offset: BABYLON.Vector3, closetPoint?: boolean): void;
        /** Teleport agent to destination point. */
        teleport(destination: BABYLON.Vector3, closetPoint?: boolean): void;
        /** Sets agent current destination point. */
        setDestination(destination: BABYLON.Vector3, closetPoint?: boolean, resetAgent?: boolean): void;
        /** Gets agent current world space velocity. */
        getAgentVelocity(): BABYLON.Vector3;
        /** Gets agent current world space velocity. */
        getAgentVelocityToRef(result: BABYLON.Vector3): void;
        /** Gets agent current world space position. */
        getAgentPosition(): BABYLON.Vector3;
        /** Gets agent current world space position. */
        getAgentPositionToRef(result: BABYLON.Vector3): void;
        /** Gets agent current waypoint position. */
        getAgentWaypoint(): BABYLON.Vector3;
        /** Gets agent current waypoint position. */
        getAgentWaypointToRef(result: BABYLON.Vector3): void;
        /** Reset the agent to transform world space position. */
        resetAgentPosition(): void;
        /** Cancel current waypoint path navigation. */
        cancelNavigation(): void;
    }
    /**
     *  Recast Detour Crowd Agent States
     */
    enum CrowdAgentState {
        DT_CROWDAGENT_STATE_INVALID = 0,
        DT_CROWDAGENT_STATE_WALKING = 1,
        DT_CROWDAGENT_STATE_OFFMESH = 2
    }
}

declare module BABYLON {
    /**
     * Babylon raycast vehicle controller pro class (Native Bullet Physics 2.82)
     * @class RaycastVehicle - All rights reserved (c) 2020 Mackey Kinard
     */
    class RaycastVehicle {
        private _centerMass;
        private _chassisMesh;
        private _tempVectorPos;
        lockedWheelIndexes: number[];
        getInternalVehicle(): any;
        getUpAxis(): number;
        getRightAxis(): number;
        getForwardAxis(): number;
        getForwardVector(): any;
        getNumWheels(): number;
        getWheelInfo(wheel: number): any;
        resetSuspension(): void;
        setPitchControl(pitch: number): void;
        setEngineForce(power: number, wheel: number): void;
        setBrakingForce(brake: number, wheel: number): void;
        getWheelTransform(wheel: number): any;
        updateWheelTransform(wheel: number, interpolate: boolean): void;
        getUserConstraintType(): number;
        setUserConstraintType(userConstraintType: number): void;
        setUserConstraintId(uid: number): void;
        getUserConstraintId(): number;
        getRawCurrentSpeedKph(): number;
        getRawCurrentSpeedMph(): number;
        getAbsCurrentSpeedKph(): number;
        getAbsCurrentSpeedMph(): number;
        getVehicleTuningSystem(): any;
        getChassisWorldTransform(): any;
        protected m_vehicle: any;
        protected m_vehicleTuning: any;
        protected m_vehicleRaycaster: any;
        protected m_vehicleColliders: any[];
        protected m_tempTransform: any;
        protected m_tempPosition: any;
        protected m_wheelDirectionCS0: any;
        protected m_wheelAxleCS: any;
        constructor(entity: BABYLON.AbstractMesh, world: any, center: BABYLON.Vector3, defaultAngularFactor?: BABYLON.Vector3);
        dispose(): void;
        /** Gets the rigidbody raycast vehicle controller for the entity. Note: Wheel collider metadata informaion is required for raycast vehicle control. */
        static GetInstance(scene: BABYLON.Scene, rigidbody: BABYLON.RigidbodyPhysics, defaultAngularFactor?: BABYLON.Vector3): BABYLON.RaycastVehicle;
        /** Gets vehicle enable multi raycast flag using physics vehicle object. (Advanved Use Only) */
        getEnableMultiRaycast(): boolean;
        /** Sets vehicle enable multi raycast flag using physics vehicle object. (Advanved Use Only) */
        setEnableMultiRaycast(flag: boolean): void;
        /** Gets vehicle stable force using physics vehicle object. (Advanved Use Only) */
        getStabilizingForce(): number;
        /** Sets vehicle stable force using physics vehicle object. (Advanved Use Only) */
        setStabilizingForce(force: number): void;
        /** Gets vehicle smooth flying impulse force using physics vehicle object. (Advanved Use Only) */
        getSmoothFlyingImpulse(): number;
        /** Sets vehicle smooth flying impulse using physics vehicle object. (Advanved Use Only) */
        setSmoothFlyingImpulse(impulse: number): void;
        /** Gets vehicle track connection accel force using physics vehicle object. (Advanved Use Only) */
        getTrackConnectionAccel(): number;
        /** Sets vehicle track connection accel force using physics vehicle object. (Advanved Use Only) */
        setTrackConnectionAccel(force: number): void;
        /** Gets vehicle min wheel contact count using physics vehicle object. (Advanved Use Only) */
        getMinimumWheelContacts(): number;
        /** Sets vehicle min wheel contact count using physics vehicle object. (Advanved Use Only) */
        setMinimumWheelContacts(force: number): void;
        /** Gets vehicle interpolate mesh normals flag using physics raycaster object. (Advanved Use Only) */
        getInterpolateNormals(): boolean;
        /** Sets the vehicle interpolate mesh normals using physics raycaster object. (Advanved Use Only) */
        setInterpolateNormals(flag: boolean): void;
        /** Gets vehicle shape testing mode using physics raycaster object. (Advanved Use Only) */
        getShapeTestingMode(): boolean;
        /** Sets the vehicle shape testing mode using physics raycaster object. (Advanved Use Only) */
        setShapeTestingMode(mode: boolean): void;
        /** Gets vehicle shape testing size using physics raycaster object. (Advanved Use Only) */
        getShapeTestingSize(): float;
        /** Sets the vehicle shape testing mode using physics raycaster object. (Advanved Use Only) */
        setShapeTestingSize(size: float): void;
        /** Gets vehicle shape test point count using physics raycaster object. (Advanved Use Only) */
        getShapeTestingCount(): float;
        /** Sets the vehicle shape test point count using physics raycaster object. (Advanved Use Only) */
        setShapeTestingCount(count: float): void;
        /** Gets vehicle sweep penetration amount using physics raycaster object. (Advanved Use Only) */
        getSweepPenetration(): float;
        /** Sets the vehicle sweep penetration amount using physics raycaster object. (Advanved Use Only) */
        setSweepPenetration(amount: float): void;
        /** Gets vehicle collision group filter using physics raycaster object. (Advanved Use Only) */
        getCollisionFilterGroup(): number;
        /** Sets vehicle collision group filter using physics raycaster object. (Advanved Use Only) */
        setCollisionFilterGroup(group: number): void;
        /** Gets vehicle collision mask filter using physics raycaster object. (Advanved Use Only) */
        getCollisionFilterMask(): number;
        /** Sets the vehicle collision mask filter using physics raycaster object. (Advanved Use Only) */
        setCollisionFilterMask(mask: number): void;
        /** Gets the internal wheel index by id string. */
        getWheelIndexByID(id: string): number;
        /** Gets the internal wheel index by name string. */
        getWheelIndexByName(name: string): number;
        /** Gets the internal wheel collider information. */
        getWheelColliderInfo(wheel: number): number;
        /** Sets the internal wheel hub transform mesh by index. Used to rotate and bounce wheels. */
        setWheelTransformMesh(wheel: number, transform: BABYLON.TransformNode): void;
        getVisualSteeringAngle(wheel: number): number;
        setVisualSteeringAngle(angle: number, wheel: number): void;
        getPhysicsSteeringAngle(wheel: number): number;
        setPhysicsSteeringAngle(angle: number, wheel: number): void;
        protected setupWheelInformation(defaultAngularFactor?: BABYLON.Vector3): void;
        protected updateWheelInformation(): void;
        protected lockedWheelInformation(wheel: number): boolean;
        protected deleteWheelInformation(): void;
    }
}

declare module BABYLON {
    /**
     * Babylon realtime reflection system pro class (Unity Style Realtime Reflection Probes)
     * @class RealtimeReflection - All rights reserved (c) 2020 Mackey Kinard
     */
    class RealtimeReflection extends BABYLON.ScriptComponent {
        private static SKYBOX_FLAG;
        private abstractMesh;
        private renderList;
        private probeList;
        private refreshMode;
        private cullingMask;
        private clearFlags;
        private probeid;
        private resolution;
        private materialIndex;
        private boxPos;
        private boxSize;
        private boxProjection;
        private reflectionProbe;
        getProbeList(): BABYLON.AbstractMesh[];
        getRenderList(): BABYLON.AbstractMesh[];
        gerReflectionProbe(): BABYLON.ReflectionProbe;
        protected awake(): void;
        protected start(): void;
        protected destroy(): void;
        protected awakeRealtimReflections(): void;
        protected startRealtimReflections(): void;
        protected destroyRealtimReflections(): void;
    }
}

declare module BABYLON {
    /**
     * Babylon full rigidbody physics pro class (Native Bullet Physics 2.82)
     * @class RigidbodyPhysics - All rights reserved (c) 2020 Mackey Kinard
     */
    class RigidbodyPhysics extends BABYLON.ScriptComponent {
        private static TempAmmoVector;
        private static TempAmmoVectorAux;
        private static TempCenterTransform;
        private _abstractMesh;
        private _isKinematic;
        private _maxCollisions;
        private _isPhysicsReady;
        private _centerOfMass;
        private _tmpLinearFactor;
        private _tmpAngularFactor;
        private _tmpCenterOfMass;
        private _tmpGravityVector;
        private _tmpCollisionContacts;
        get isKinematic(): boolean;
        get centerOfMass(): BABYLON.Vector3;
        protected m_physicsWorld: any;
        protected m_physicsEngine: BABYLON.IPhysicsEngine;
        protected m_raycastVehicle: any;
        protected awake(): void;
        protected update(): void;
        protected after(): void;
        protected destroy(): void;
        protected awakeRigidbodyState(): void;
        protected updateRigidbodyState(): void;
        protected afterRigidbodyState(): void;
        protected destroyRigidbodyState(): void;
        protected syncronizeVehicleController(): void;
        protected parseBodyCollisionContacts(): void;
        protected resetBodyCollisionContacts(): void;
        /** Register handler that is triggered when the a collision contact has entered */
        onCollisionEnterObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a collision contact is active */
        onCollisionStayObservable: Observable<AbstractMesh>;
        /** Register handler that is triggered when the a collision contact has exited */
        onCollisionExitObservable: Observable<AbstractMesh>;
        /** Sets entity gravity value using physics impostor body. */
        setGravity(gravity: BABYLON.Vector3): void;
        /** Gets entity gravity value using physics impostor body. */
        getGravity(): BABYLON.Nullable<BABYLON.Vector3>;
        /** Gets entity gravity value using physics impostor body. */
        getGravityToRef(result: BABYLON.Vector3): void;
        /** Gets mass of entity using physics impostor. */
        getMass(): number;
        /** Sets mass to entity using physics impostor. */
        setMass(mass: number): void;
        /** Gets entity friction level using physics impostor. */
        getFriction(): number;
        /** Applies friction to entity using physics impostor. */
        setFriction(friction: number): void;
        /** Gets restitution of entity using physics impostor. */
        getRestitution(): number;
        /** Sets restitution to entity using physics impostor. */
        setRestitution(restitution: number): void;
        /** Gets entity linear velocity using physics impostor. */
        getLinearVelocity(): BABYLON.Nullable<BABYLON.Vector3>;
        /** Sets entity linear velocity using physics impostor. */
        setLinearVelocity(velocity: BABYLON.Vector3): void;
        /** Gets entity angular velocity using physics impostor. */
        getAngularVelocity(): BABYLON.Nullable<BABYLON.Vector3>;
        /** Sets entity angular velocity using physics impostor. */
        setAngularVelocity(velocity: BABYLON.Vector3): void;
        /** Gets the native physics world transform object using physics impostor body. (Advanved Use Only) */
        getWorldTransform(): any;
        /** Gets the entity world transform position using physics impostor body. (Advanved Use Only) */
        getTransformPositionToRef(result: BABYLON.Vector3): void;
        /** Gets the entity world transform rotation using physics impostor body. (Advanved Use Only) */
        getTransformRotationToRef(result: BABYLON.Quaternion): void;
        clearForces(): void;
        applyTorque(torque: BABYLON.Vector3): void;
        applyLocalTorque(torque: BABYLON.Vector3): void;
        applyImpulse(impulse: BABYLON.Vector3, rel_pos: BABYLON.Vector3): void;
        applyCentralImpulse(impulse: BABYLON.Vector3): void;
        applyTorqueImpulse(torque: BABYLON.Vector3): void;
        applyForce(force: BABYLON.Vector3, rel_pos: BABYLON.Vector3): void;
        applyCentralForce(force: BABYLON.Vector3): void;
        applyCentralLocalForce(force: BABYLON.Vector3): void;
        /** gets rigidbody center of mass */
        getCenterOfMassTransform(): BABYLON.Vector3;
        /** Sets rigidbody center of mass */
        setCenterOfMassTransform(center: BABYLON.Vector3): void;
        /** Gets entity linear factor using physics impostor body. */
        getLinearFactor(): BABYLON.Vector3;
        /** Sets entity linear factor using physics impostor body. */
        setLinearFactor(factor: BABYLON.Vector3): void;
        /** Gets entity angular factor using physics impostor body. */
        getAngularFactor(): BABYLON.Vector3;
        /** Sets entity angular factor using physics impostor body. */
        setAngularFactor(factor: BABYLON.Vector3): void;
        /** Gets entity angular damping using physics impostor body. */
        getAngularDamping(): number;
        /** Gets entity linear damping using physics impostor body. */
        getLinearDamping(): number;
        /** Sets entity drag damping using physics impostor body. */
        setDamping(linear: number, angular: number): void;
        /** Sets entity sleeping threshold using physics impostor body. */
        setSleepingThresholds(linear: number, angular: number): void;
        /** Checks if rigidbody has wheel collider metadata for the entity. Note: Wheel collider metadata informaion is required for vehicle control. */
        hasWheelColliders(): boolean;
        /** Sets the maximum number of simultaneous contact notfications to dispatch per frame. Defaults value is 4. (Advanved Use Only) */
        setMaxNotifications(max: number): void;
        /** Sets entity collision activation state using physics impostor body. (Advanved Use Only) */
        setActivationState(state: number): void;
        /** Gets entity collision filter group using physics impostor body. (Advanved Use Only) */
        getCollisionFilterGroup(): number;
        /** Sets entity collision filter group using physics impostor body. (Advanved Use Only) */
        setCollisionFilterGroup(group: number): void;
        /** Gets entity collision filter mask using physics impostor body. (Advanved Use Only) */
        getCollisionFilterMask(): number;
        /** Sets entity collision filter mask using physics impostor body. (Advanved Use Only) */
        setCollisionFilterMask(mask: number): void;
        /** Gets the entity collision shape type using physics impostor body. (Advanved Use Only) */
        getCollisionShapeType(): number;
        /** Gets the entity collision shape margin using physics impostor body. (Advanved Use Only) */
        getCollisionShapeMargin(): number;
        /** Sets entity collision shape margin using physics impostor body. (Advanved Use Only) */
        setCollisionShapeMargin(margin: number): void;
        /** Gets the entity contact processing threshold using physics impostor body. (Advanved Use Only) */
        getContactProcessingThreshold(): number;
        /** Sets entity contact processing threshold using physics impostor body. (Advanved Use Only) */
        setContactProcessingThreshold(threshold: number): void;
        /** TODO */
        static CreatePhysicsMetadata(mass: number, drag?: number, angularDrag?: number, centerMass?: Vector3): any;
        /** TODO */
        static CreateCollisionMetadata(type: string, trigger?: boolean, convexmesh?: boolean, restitution?: number, dynamicfriction?: number, staticfriction?: number): any;
        /** TODO */
        static CreatePhysicsProperties(mass: number, drag?: number, angularDrag?: number, useGravity?: boolean, isKinematic?: boolean): any;
        /** TODO */
        static SetupPhysicsComponent(scene: BABYLON.Scene, entity: BABYLON.AbstractMesh): void;
        private static ConfigRigidbodyPhysics;
    }
    /**
     * Babylon collision contact info pro class (Native Bullet Physics 2.82)
     * @class CollisionContactInfo - All rights reserved (c) 2020 Mackey Kinard
     */
    class CollisionContactInfo {
        mesh: BABYLON.AbstractMesh;
        state: number;
        reset: boolean;
    }
}

declare module BABYLON {
    /**
     * Babylon shuriken particle system pro class (Unity Style Shuriken Particle System)
     * @class ShurikenParticles - All rights reserved (c) 2020 Mackey Kinard
     */
    class ShurikenParticles extends BABYLON.ScriptComponent {
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected destroy(): void;
    }
}

declare module BABYLON {
    /**
     * Babylon window socket controller pro class (Socket.IO)
     * @class SocketController - All rights reserved (c) 2020 Mackey Kinard
     */
    class SocketController {
        /** Registers an handler for window socket connect event */
        static RegisterOnSocketConnect(func: () => void): void;
        /** Registers an handler for window socket disconnect event */
        static RegisterOnSocketDisconnect(func: () => void): void;
        /** Connects a window state socket */
        static ConnectWindowSocket(connection: string): SocketIOClient.Socket;
        /** Get the window state socket */
        static GetWindowSocket(): SocketIOClient.Socket;
    }
}

declare module BABYLON {
    /**
     * Babylon web video player pro class (Unity Style Shuriken Particle System)
     * @class WebVideoPlayer - All rights reserved (c) 2020 Mackey Kinard
     */
    class WebVideoPlayer extends BABYLON.ScriptComponent {
        getVideoMaterial(): BABYLON.StandardMaterial;
        getVideoTexture(): BABYLON.VideoTexture;
        getVideoElement(): HTMLVideoElement;
        getVideoScreen(): BABYLON.AbstractMesh;
        protected m_abstractMesh: BABYLON.AbstractMesh;
        protected m_videoTexture: BABYLON.VideoTexture;
        protected m_videoMaterial: BABYLON.StandardMaterial;
        protected awake(): void;
        protected destroy(): void;
        protected awakeWebVideoPlayer(): void;
        protected destroyWebVideoPlayer(): void;
        /** Set web video player source */
        setVideoSource(src: string | string[] | HTMLVideoElement, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number, settings?: BABYLON.VideoTextureSettings, volume?: number, speed?: number): void;
    }
}

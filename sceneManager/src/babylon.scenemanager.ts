module BABYLON {

    export class SceneManager {
        public static GetInstance(scene: BABYLON.Scene): BABYLON.SceneManager {
            return ((<any>scene).manager) ? (<any>scene).manager as BABYLON.SceneManager : null;
        }

        public static CreateScene(name: string, engine: BABYLON.Engine): BABYLON.Scene {
            var result: BABYLON.Scene = new BABYLON.Scene(engine);
            BABYLON.SceneManager.parseSceneMetadata("/", name, result);
            return result;
        }

        public static LoadScene(rootUrl: string, sceneFilename: string, engine: BABYLON.Engine, onsuccess?: (scene: BABYLON.Scene) => void, progressCallBack?: any, onerror?: (scene: BABYLON.Scene) => void): void {
            var onparse = (scene: BABYLON.Scene) => {
                BABYLON.SceneManager.parseSceneMetadata(rootUrl, sceneFilename, scene);
                if (onsuccess) onsuccess(scene);
            };
            BABYLON.SceneLoader.Append(rootUrl, sceneFilename, new BABYLON.Scene(engine), onparse, progressCallBack, onerror);
        }

        public static ImportMesh(meshesNames: any, rootUrl: string, sceneFilename: string, scene: BABYLON.Scene, onsuccess?: (meshes: BABYLON.AbstractMesh[], particleSystems: BABYLON.ParticleSystem[], skeletons: BABYLON.Skeleton[]) => void, progressCallBack?: () => void, onerror?: (scene: BABYLON.Scene, message: string, exception?: any) => void): void {
            var onparse = (meshes: BABYLON.AbstractMesh[], particleSystems: BABYLON.ParticleSystem[], skeletons: BABYLON.Skeleton[]) => {
                BABYLON.SceneManager.parseMeshMetadata(meshes, scene);
                if (onsuccess) onsuccess(meshes, particleSystems, skeletons);
            };
            BABYLON.SceneLoader.ImportMesh(meshesNames, rootUrl, sceneFilename, scene, onparse, progressCallBack, onerror);
        }

        public static RegisterLoader(handler: (root: string, name: string) => void): void {
            BABYLON.SceneManager.loader = handler;
        }

        // *********************************** //
        // * Babylon Scene Manager Component * //
        // *********************************** //

        public onrender: () => void = null;
        public controller: BABYLON.SceneController = null;

        private _ie: boolean = false;
        private _url: string = "";
        private _filename: string = "";
        private _render: () => void = null;
        private _running: boolean = false;
        private _markup: string = "";
        private _gui: string = "None";
        private _input: boolean = false;
        private _scene: BABYLON.Scene = null;
        private _navmesh: BABYLON.AbstractMesh = null;
        private _navigation: Navigation = null;

        private static keymap: any = {};
        private static clientx: number = 0;
        private static clienty: number = 0;
        private static mousex: number = 0;
        private static mousey: number = 0;
        private static vertical: number = 0;
        private static horizontal: number = 0;
        private static x_mousex: number = 0;
        private static x_mousey: number = 0;
        private static x_vertical: number = 0;
        private static x_horizontal: number = 0;
        private static k_mousex: number = 0;
        private static k_mousey: number = 0;
        private static k_vertical: number = 0;
        private static k_horizontal: number = 0;
        private static j_mousex: number = 0;
        private static j_mousey: number = 0;
        private static j_vertical: number = 0;
        private static j_horizontal: number = 0;
        private static g_mousex: number = 0;
        private static g_mousey: number = 0;
        private static g_vertical: number = 0;
        private static g_horizontal: number = 0;
        private static engine: BABYLON.Engine = null;
        private static gamepad: BABYLON.Gamepad = null;
        private static gamepads: BABYLON.Gamepads = null;
        private static gamepadType: BABYLON.GamepadType = BABYLON.GamepadType.None;
        private static gamepadConnected: (pad: BABYLON.Gamepad, kind: BABYLON.GamepadType) => void = null;
        private static gamepadButtonPress: BABYLON.UserInputPress[] = [];
        private static gamepadButtonDown: BABYLON.UserInputAction[] = [];
        private static gamepadButtonUp: BABYLON.UserInputAction[] = [];
        private static gamepadDpadPress: BABYLON.UserInputPress[] = [];
        private static gamepadDpadDown: BABYLON.UserInputAction[] = [];
        private static gamepadDpadUp: BABYLON.UserInputAction[] = [];
        private static gamepadLeftTrigger: BABYLON.UserInputAction[] = [];
        private static gamepadRightTrigger: BABYLON.UserInputAction[] = [];
        private static mouseButtonPress: BABYLON.UserInputPress[] = [];
        private static mouseButtonDown: BABYLON.UserInputAction[] = [];
        private static mouseButtonUp: BABYLON.UserInputAction[] = [];
        private static keyButtonPress: BABYLON.UserInputPress[] = [];
        private static keyButtonDown: BABYLON.UserInputAction[] = [];
        private static keyButtonUp: BABYLON.UserInputAction[] = [];
        private static leftJoystick: BABYLON.VirtualJoystick = null;
        private static rightJoystick: BABYLON.VirtualJoystick = null;
        private static previousPosition: { x: number, y: number } = null;
        private static preventDefault: boolean = false;
        private static rightHanded: boolean = true;
        private static loader: (root: string, name: string) => void = null;

        public constructor(rootUrl: string, sceneFilename: string, scene: BABYLON.Scene) {
            if (scene == null) throw new Error("Null host scene obejct specified.");
            this._ie = document.all ? true : false
            this._url = rootUrl;
            this._filename = sceneFilename;
            this._scene = scene;
            this._input = false;
            this._navmesh = null;
            this._navigation = null;

            // Reset scene manager engine instance
            BABYLON.SceneManager.engine = this._scene.getEngine();
            BABYLON.SceneManager.rightHanded = this._scene.useRightHandedSystem;

            // Parse, create and store component instances
            var ticklist: BABYLON.IScriptComponent[] = [];
            BABYLON.SceneManager.parseSceneCameras(this._scene.cameras, this._scene, ticklist);
            BABYLON.SceneManager.parseSceneLights(this._scene.lights, this._scene, ticklist);
            BABYLON.SceneManager.parseSceneMeshes(this._scene.meshes, this._scene, ticklist);

            // Parse and intialize scene raw metadata properties
            if (this._scene.metadata != null && this._scene.metadata.properties != null) {
                if (this._scene.metadata.properties.controllerPresent) {
                    var sceneController: BABYLON.SceneComponent = this.findSceneController();
                    if (sceneController != null && sceneController instanceof BABYLON.SceneController) {
                        this.controller = (sceneController as BABYLON.SceneController);
                    } else {
                        var msg2: string = "Failed to locate valid BABYLON.SceneController metadata instance";
                        if (console) console.warn(msg2);
                    }
                }
                // Parse scene html markup
                if (this._scene.metadata.properties.interfaceMode != null) {
                    this._gui = this._scene.metadata.properties.interfaceMode;
                    if (this._scene.metadata.properties.userInterface != null) {
                        var ui: any = this._scene.metadata.properties.userInterface;
                        if (window && ui.embedded && ui.base64 != null) {
                            this._markup = window.atob(ui.base64);
                            if (this._scene.metadata.properties.autoDraw === true && this._gui != null && this._gui !== "" && this._gui !== "None" && this._markup != null && this._markup !== "") {
                                this.drawSceneMarkup(this._markup);
                            }
                        }
                    }
                }
                // Parse scene navigation mesh
                if (this._scene.metadata.properties.hasNavigationMesh != null && this._scene.metadata.properties.hasNavigationMesh == true) {
                    this._navmesh = this._scene.getMeshByName("sceneNavigationMesh");
                    if (this._navmesh != null) {
                        var navigation: Navigation = this.getNavigationTool();
                        var zoneNodes: any = navigation.buildNodes(this._navmesh);
                        if (zoneNodes != null) {
                            navigation.setZoneData(this.getNavigationZone(), zoneNodes);
                        } else {
                            if (console) console.warn("Failed to set scene navigation zone");
                        }
                    } else {
                        if (console) console.warn("Failed to load scene navigation mesh");
                    }
                }
                // Parse scene terrain heightmaps
                if (this._scene.metadata.properties.hasTerrainMeshes != null && this._scene.metadata.properties.hasTerrainMeshes == true) {
                    var terrains: BABYLON.Mesh[] = this._scene.getMeshesByTags("[TERRAIN]");
                    if (terrains != null) {
                        terrains.forEach((terrain) => {
                            terrain.isVisible = true;
                            terrain.visibility = 1;
                            terrain.checkCollisions = false;
                            if (terrain.metadata != null && terrain.metadata.properties != null) {
                                if (terrain.metadata.properties.heightmapBase64) {
                                    var tempBase64: string = terrain.metadata.properties.heightmapBase64;
                                    var terrainWidth: number = terrain.metadata.properties.width;
                                    var terrainLength: number = terrain.metadata.properties.length;
                                    var terrainHeight: number = terrain.metadata.properties.height;
                                    var physicsState: boolean = terrain.metadata.properties.physicsState;
                                    var physicsMass: number = terrain.metadata.properties.physicsMass;
                                    var physicsFriction: number = terrain.metadata.properties.physicsFriction;
                                    var physicsRestitution: number = terrain.metadata.properties.physicsRestitution;
                                    var physicsImpostor: number = terrain.metadata.properties.physicsImpostor;
                                    var groundTessellation: number = terrain.metadata.properties.groundTessellation;
                                    BABYLON.SceneManager.createGroundTerrain((terrain.name + "_Ground"), tempBase64, {
                                        width: terrainWidth,
                                        height: terrainLength,
                                        minHeight: 0,
                                        maxHeight: terrainHeight,
                                        updatable: false,
                                        subdivisions: groundTessellation,
                                        onReady: (mesh: BABYLON.Mesh) => {
                                            tempBase64 = null;
                                            mesh.isVisible = false;
                                            mesh.visibility = 0.75;
                                            mesh.checkCollisions = true;
                                            mesh.position = BABYLON.Vector3.Zero();
                                            mesh.rotation = terrain.rotation.clone();
                                            mesh.scaling = terrain.scaling.clone();
                                            mesh.parent = terrain;
                                            if (physicsState) mesh.setPhysicsState(physicsImpostor, { mass: physicsMass, friction: physicsFriction, restitution: physicsRestitution });
                                            terrain.metadata.properties.heightmapBase64 = 0; // Note: Clear Internal Heightmap Metadata
                                        }
                                    }, this._scene);
                                }
                            }
                        });
                    } else {
                        if (console) console.warn("Failed to load scene terrain mesh(s)");
                    }
                }
            }

            // Register scene component ticklist
            if (ticklist.length > 0) {
                ticklist.sort((left, right): number => {
                    if (left.order < right.order) return -1;
                    if (left.order > right.order) return 1;
                    return 0;
                });
                ticklist.forEach((scriptComponent) => {
                    scriptComponent.instance.register();
                });
            }

            // Scene component start, update and destroy proxies 
            var instance: BABYLON.SceneManager = this;
            this._render = function () {
                if (instance != null) {
                    if (instance._input) {
                        BABYLON.SceneManager.updateUserInputState();
                    }
                    if (instance._scene != null) {
                        instance._scene.render();
                    }
                    if (instance.onrender != null) {
                        instance.onrender();
                    }
                }
            };
            this._scene.onDispose = function () {
                if (instance != null) {
                    instance.dispose();
                }
            };
        }
        public get ie():boolean {
            return this._ie;
        }
        public get url():string {
            return this._url;
        }
        public dispose(): void {
            this.disableUserInput();
            this._gui = null;
            this._render = null;
            this._markup = null;
            this._navmesh = null;
            this._navigation = null;
            this.onrender = null;
            this.controller = null;
            var scenex: any = (<any>this._scene);
            if (scenex.manager) scenex.manager = null;
            scenex = null;
            this._scene = null;
        }
        public isRunning(): boolean {
            return this._running
        }
        public loadLevel(name: string, path: string = null): void {
            if (BABYLON.SceneManager.loader != null) {
                var folder: string = (path != null && path !== "") ? path : this.getScenePath();
                this.stop();
                this.clearSceneMarkup();
                this._scene.dispose();
                BABYLON.SceneManager.loader(folder, name);
            } else {
                throw new Error("No scene loader function registered.");
            }
        }
        public toggleDebug(): void {
            if (this._scene.debugLayer.isVisible()) {
                this._scene.debugLayer.hide();
            } else {
                this._scene.debugLayer.show();
            }
        }
        public getSceneName(): string {
            return this._filename;
        }
        public getScenePath(): string {
            var result: string = "/";
            if (this.url != null && this.url !== "") {
                result = this.url;
            } else {
                if (this._scene.database != null && this._scene.database.currentSceneUrl != null) {
                    var xurl: string = this._scene.database.currentSceneUrl;
                    result = xurl.substr(0, xurl.lastIndexOf("/")) + "/";
                }
            }
            return result;
        }
        public getObjectMetadata(owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): BABYLON.ObjectMetadata {
            var result: BABYLON.ObjectMetadata = null;
            if (owner.metadata != null && owner.metadata.api) {
                var metadata: BABYLON.IObjectMetadata = owner.metadata as BABYLON.IObjectMetadata;
                result = new BABYLON.ObjectMetadata(metadata);
            }
            return result;
        }
        public showFullscreen(): void {
            BABYLON.Tools.RequestFullscreen(document.documentElement);
            document.documentElement.focus();
        }

        // ********************************** //
        // *  Scene Manager Helper Support  * //
        // ********************************** //

        public start(): void {
            this._running = true;
            this._scene.getEngine().runRenderLoop(this._render);
        }
        public stop(): void {
            this._running = false;
            this._scene.getEngine().stopRenderLoop(this._render);
        }
        public toggle(): void {
            if (!this._running) {
                this.resumeAudio();
                this.start();
            } else {
                this.pauseAudio();
                this.stop();
            }
        }
        public stepFrame(): void {
            if (!this._running) {
                this._render();
            } else {
                this.toggle();
            }
        }
        public pauseAudio(): void {
            if (this._scene.audioEnabled === true) {
                this._scene.audioEnabled = false;
            }
        }
        public resumeAudio(): void {
            if (this._scene.audioEnabled === false) {
                this._scene.audioEnabled = true;
            }
        }

        // ********************************* //
        // *  Scene Markup Helper Support  * //
        // ********************************* //

        public getGuiMode(): string {
            return this._gui;
        }
        public getSceneMarkup(): string {
            return this._markup;
        }
        public drawSceneMarkup(markup: string): void {
            if (this._gui === "Html") {
                var element: Element = document.getElementById("gui");
                if (element == null) {
                    var gui: HTMLDivElement = document.createElement("div");
                    gui.id = "gui";
                    gui.style.width = "100%";
                    gui.style.height = "100%";
                    gui.style.opacity = "1";
                    gui.style.zIndex = "10";
                    gui.style.outline = "none";
                    gui.style.backgroundColor = "transparent";
                    document.body.appendChild(gui);
                    gui.innerHTML = markup;
                } else {
                    element.innerHTML = markup;
                }
            } else {
                var msg2: string = "Scene controller gui disabled.";
                if (console) console.warn(msg2);
            }
        }
        public clearSceneMarkup(): void {
            if (this._gui === "Html") {
                var element: Element = document.getElementById("gui");
                if (element != null) {
                    element.innerHTML = "";
                }
            } else {
                var msg2: string = "Scene controller gui disabled.";
                if (console) console.warn(msg2);
            }
        }

        // ************************************* //
        // *   Scene Component Helper Support  * //
        // ************************************* //

        public addSceneComponent(owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light, klass: string, enableUpdate: boolean = true, propertyBag: any = {}): BABYLON.SceneComponent {
            var result: BABYLON.SceneComponent = null;
            if (owner == null) throw new Error("Null owner scene obejct specified.");
            if (klass == null || klass === "") throw new Error("Null scene obejct klass specified.");
            if (owner.metadata == null || !owner.metadata.api) {
                var metadata: BABYLON.IObjectMetadata = {
                    api: true,
                    type: "Babylon",
                    objectName: "Scene Component",
                    objectId: "0",
                    tagName: "Untagged",
                    layerIndex: 0,
                    layerName: "Default",
                    areaIndex: -1,
                    navAgent: null,
                    meshLink: null,
                    meshObstacle: null,
                    components: [],
                    properties: {}
                };
                owner.metadata = metadata;
            }
            var ownercomps: BABYLON.IScriptComponent[] = null;
            if (owner.metadata != null && owner.metadata.api) {
                if (owner.metadata.disposal == null || owner.metadata.disposal === false) {
                    owner.onDispose = () => { BABYLON.SceneManager.destroySceneComponents(owner); };
                    owner.metadata.disposal = true;
                }
                var metadata: BABYLON.IObjectMetadata = owner.metadata as BABYLON.IObjectMetadata;
                if (metadata.components != null) {
                    ownercomps = metadata.components;
                } else {
                    ownercomps = [];
                }
                if (ownercomps != null) {
                    var SceneComponentClass = BABYLON.SceneManager.createComponentClass(klass);
                    if (SceneComponentClass != null) {
                        result = new SceneComponentClass(owner, this._scene, enableUpdate, propertyBag);
                        if (result != null) {
                            var compscript: BABYLON.IScriptComponent = {
                                order: 1000,
                                name: "BabylonScriptComponent",
                                klass: klass,
                                update: enableUpdate,
                                controller: false,
                                properties: propertyBag,
                                instance: result,
                                tag: {}
                            };
                            ownercomps.push(compscript);
                            result.register();
                        } else {
                            if (console) console.error("Failed to create component instance");
                        }
                    } else {
                        if (console) console.error("Failed to create component class");
                    }
                } else {
                    if (console) console.error("Failed to parse metadata components");
                }
            } else {
                if (console) console.error("Null owner object metadata");
            }
            return result;
        }
        public findSceneComponent(klass: string, owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): any {
            var result: BABYLON.SceneComponent = null;
            if (owner.metadata != null && owner.metadata.api) {
                var metadata: BABYLON.IObjectMetadata = owner.metadata as BABYLON.IObjectMetadata;
                if (metadata.components != null && metadata.components.length > 0) {
                    for (var ii: number = 0; ii < metadata.components.length; ii++) {
                        var ownerscript: BABYLON.IScriptComponent = metadata.components[ii];
                        if (ownerscript.instance != null && ownerscript.klass === klass) {
                            result = ownerscript.instance;
                            break;
                        }
                    }
                }
            }
            return result;
        }
        public findSceneComponents(klass: string, owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light): any[] {
            var result: BABYLON.SceneComponent[] = [];
            if (owner.metadata != null && owner.metadata.api) {
                var metadata: BABYLON.IObjectMetadata = owner.metadata as BABYLON.IObjectMetadata;
                if (metadata.components != null && metadata.components.length > 0) {
                    for (var ii: number = 0; ii < metadata.components.length; ii++) {
                        var ownerscript: BABYLON.IScriptComponent = metadata.components[ii];
                        if (ownerscript.instance != null && ownerscript.klass === klass) {
                            result.push(ownerscript.instance);
                        }
                    }
                }
            }
            return result;
        }
        public findSceneController(): any {
            var meshes: BABYLON.AbstractMesh[] = this._scene.meshes;
            var result: BABYLON.SceneComponent = null;
            if (meshes != null && meshes.length > 0) {
                for (var ii: number = 0; ii < meshes.length; ii++) {
                    var mesh: AbstractMesh = meshes[ii];
                    if (mesh.metadata != null && mesh.metadata.api) {
                        var metadata: BABYLON.IObjectMetadata = mesh.metadata as BABYLON.IObjectMetadata;
                        if (metadata.components != null && metadata.components.length > 0) {
                            for (var iii: number = 0; iii < metadata.components.length; iii++) {
                                var meshscript: IScriptComponent = metadata.components[iii];
                                if (meshscript.instance != null && meshscript.controller === true) {
                                    result = meshscript.instance;
                                    break;
                                }
                            }
                        }
                    }
                    if (result != null) break;
                }
            }
            return result;
        }
        public createSceneController(klass: string): BABYLON.SceneController {
            if (this.controller == null) {
                this.controller = this.addSceneComponent(new BABYLON.Mesh("SceneController", this._scene), klass) as BABYLON.SceneController;
                if (this.controller != null) {
                    this.controller.ready();
                }
            } else {
                throw new Error("Scene controller already exists.");
            }
            return this.controller;
        }

        // ********************************* //
        // *   Scene Input State Support   * //
        // ********************************* //

        public resetUserInput(): void {
            BABYLON.SceneManager.keymap = {};
            BABYLON.SceneManager.clientx = 0;
            BABYLON.SceneManager.clienty = 0;
            BABYLON.SceneManager.mousex = 0;
            BABYLON.SceneManager.mousey = 0;
            BABYLON.SceneManager.vertical = 0;
            BABYLON.SceneManager.horizontal = 0;
            BABYLON.SceneManager.x_mousex = 0;
            BABYLON.SceneManager.x_mousey = 0;
            BABYLON.SceneManager.x_vertical = 0;
            BABYLON.SceneManager.x_horizontal = 0;
            BABYLON.SceneManager.k_mousex = 0;
            BABYLON.SceneManager.k_mousey = 0;
            BABYLON.SceneManager.k_vertical = 0;
            BABYLON.SceneManager.k_horizontal = 0;
            BABYLON.SceneManager.j_mousex = 0;
            BABYLON.SceneManager.j_mousey = 0;
            BABYLON.SceneManager.j_vertical = 0;
            BABYLON.SceneManager.j_horizontal = 0;
            BABYLON.SceneManager.g_mousex = 0;
            BABYLON.SceneManager.g_mousey = 0;
            BABYLON.SceneManager.g_vertical = 0;
            BABYLON.SceneManager.g_horizontal = 0;
            BABYLON.SceneManager.preventDefault = false;
            BABYLON.SceneManager.gamepadButtonUp = [];
            BABYLON.SceneManager.gamepadButtonDown = [];
            BABYLON.SceneManager.gamepadButtonPress = [];
            BABYLON.SceneManager.gamepadDpadUp = [];
            BABYLON.SceneManager.gamepadDpadDown = [];
            BABYLON.SceneManager.gamepadDpadPress = [];
            BABYLON.SceneManager.gamepadLeftTrigger = [];
            BABYLON.SceneManager.gamepadRightTrigger = [];
            BABYLON.SceneManager.mouseButtonUp = [];
            BABYLON.SceneManager.mouseButtonDown = [];
            BABYLON.SceneManager.mouseButtonPress = [];
            BABYLON.SceneManager.keyButtonUp = [];
            BABYLON.SceneManager.keyButtonDown = [];
            BABYLON.SceneManager.keyButtonPress = [];
        }
        public enableUserInput(preventDefault: boolean = false, useCapture: boolean = false, gamepadConnected: (pad: BABYLON.Gamepad, kind: BABYLON.GamepadType) => void = null): void {
            if (!this._input) {
                this.resetUserInput();
                document.documentElement.tabIndex = 1;
                document.documentElement.addEventListener("keyup", BABYLON.SceneManager.inputKeyUpHandler, useCapture);
                document.documentElement.addEventListener("keydown", BABYLON.SceneManager.inputKeyDownHandler, useCapture);
                document.documentElement.addEventListener("pointerup", BABYLON.SceneManager.inputPointerUpHandler, useCapture);
                //document.documentElement.addEventListener("pointerout", BABYLON.SceneManager.inputPointerUpHandler, useCapture); - ???
                document.documentElement.addEventListener("pointerdown", BABYLON.SceneManager.inputPointerDownHandler, useCapture);
                document.documentElement.addEventListener("pointermove", BABYLON.SceneManager.inputPointerMoveHandler, useCapture);
                BABYLON.SceneManager.preventDefault = preventDefault;
                if (BABYLON.SceneManager.gamepads == null) {
                    BABYLON.SceneManager.gamepadConnected = gamepadConnected;
                    BABYLON.SceneManager.gamepads = new BABYLON.Gamepads((pad: BABYLON.Gamepad) => { BABYLON.SceneManager.inputGamepadConnected(pad); });
                }
                if (BABYLON.SceneManager.leftJoystick == null) {
                    //BABYLON.SceneManager.leftJoystick = new BABYLON.VirtualJoystick(true);
                    //BABYLON.SceneManager.leftJoystick.setAxisForUpDown(JoystickAxis.Z);
                    //BABYLON.SceneManager.leftJoystick.setAxisForLeftRight(JoystickAxis.X);
                    //BABYLON.SceneManager.leftJoystick.setJoystickSensibility(0.15);
                }
                if (BABYLON.SceneManager.rightJoystick == null) {
                    //BABYLON.SceneManager.rightJoystick = new BABYLON.VirtualJoystick(false);
                    //BABYLON.SceneManager.rightJoystick.setAxisForUpDown(JoystickAxis.X);
                    //BABYLON.SceneManager.rightJoystick.setAxisForLeftRight(JoystickAxis.Y);
                    //BABYLON.SceneManager.rightJoystick.reverseUpDown = true;
                    //BABYLON.SceneManager.rightJoystick.setJoystickSensibility(0.05);
                    //BABYLON.SceneManager.rightJoystick.setJoystickColor("yellow");
                }
                this._input = true;
                document.documentElement.focus();
            }
        }
        public disableUserInput(useCapture: boolean = false): void {
            if (this._input) {
                document.documentElement.removeEventListener("keyup", BABYLON.SceneManager.inputKeyUpHandler, useCapture);
                document.documentElement.removeEventListener("keydown", BABYLON.SceneManager.inputKeyDownHandler, useCapture);
                document.documentElement.removeEventListener("pointerup", BABYLON.SceneManager.inputPointerUpHandler, useCapture);
                //document.documentElement.removeEventListener("pointerout", BABYLON.SceneManager.inputPointerUpHandler, useCapture); - ???
                document.documentElement.removeEventListener("pointerdown", BABYLON.SceneManager.inputPointerDownHandler, useCapture);
                document.documentElement.removeEventListener("pointermove", BABYLON.SceneManager.inputPointerMoveHandler, useCapture);
                BABYLON.SceneManager.preventDefault = false;
                this.resetUserInput();
                this._input = false;
            }
        }
        public getUserInput(input: BABYLON.UserInputAxis): number {
            var result: number = 0;
            if (this._input) {
                switch (input) {
                    case BABYLON.UserInputAxis.Vertical:
                    case BABYLON.UserInputAxis.Horizontal:
                        result = (input === BABYLON.UserInputAxis.Horizontal) ? BABYLON.SceneManager.horizontal : BABYLON.SceneManager.vertical;
                        break;
                    case BABYLON.UserInputAxis.MouseX:
                    case BABYLON.UserInputAxis.MouseY:
                        result = (input === BABYLON.UserInputAxis.MouseX) ? BABYLON.SceneManager.mousex : BABYLON.SceneManager.mousey;
                        break;
                    case BABYLON.UserInputAxis.ClientX:
                    case BABYLON.UserInputAxis.ClientY:
                        result = (input === BABYLON.UserInputAxis.ClientX) ? BABYLON.SceneManager.clientx : BABYLON.SceneManager.clienty;
                        break;
                }
            }
            return result;
        }

        // ********************************* //
        // *  Scene Keycode State Support  * //
        // ********************************* //

        public onKeyUp(callback: (keycode: number) => void): void {
            if (this._input) BABYLON.SceneManager.keyButtonUp.push(callback);
        }
        public onKeyDown(callback: (keycode: number) => void): void {
            if (this._input) BABYLON.SceneManager.keyButtonDown.push(callback);
        }
        public onKeyPress(keycode: number, callback: () => void): void {
            if (this._input) BABYLON.SceneManager.keyButtonPress.push({ index: keycode, action: callback });
        }
        public getKeyInput(keycode: number): boolean {
            var result: boolean = false;
            if (this._input) {
                var key: string = "k" + keycode.toString();
                if (BABYLON.SceneManager.keymap[key] != null) {
                    result = BABYLON.SceneManager.keymap[key];
                }
            }
            return result;
        }

        // ********************************* //
        // *   Scene Mouse State Support   * //
        // ********************************* //

        public onPointerUp(callback: (button: number) => void): void {
            if (this._input) BABYLON.SceneManager.mouseButtonUp.push(callback);
        }
        public onPointerDown(callback: (button: number) => void): void {
            if (this._input) BABYLON.SceneManager.mouseButtonDown.push(callback);
        }
        public onPointerPress(button: number, callback: () => void): void {
            if (this._input) BABYLON.SceneManager.mouseButtonPress.push({ index: button, action: callback });
        }
        public getPointerInput(button: number): boolean {
            var result: boolean = false;
            if (this._input) {
                var key: string = "p" + button.toString();
                if (BABYLON.SceneManager.keymap[key] != null) {
                    result = BABYLON.SceneManager.keymap[key];
                }
            }
            return result;
        }

        // ********************************* //
        // *  Scene Gamepad State Support  * //
        // ********************************* //

        public onButtonUp(callback: (button: number) => void): void {
            if (this._input) BABYLON.SceneManager.gamepadButtonUp.push(callback);
        }
        public onButtonDown(callback: (button: number) => void): void {
            if (this._input) BABYLON.SceneManager.gamepadButtonDown.push(callback);
        }
        public onButtonPress(button: number, callback: () => void): void {
            if (this._input) BABYLON.SceneManager.gamepadButtonPress.push({ index: button, action: callback });
        }
        public getButtonInput(button: number): boolean {
            var result: boolean = false;
            if (this._input) {
                var key: string = "b" + button.toString();
                if (BABYLON.SceneManager.keymap[key] != null) {
                    result = BABYLON.SceneManager.keymap[key];
                }
            }
            return result;
        }
        public onDpadUp(callback: (direction: number) => void): void {
            if (this._input) BABYLON.SceneManager.gamepadDpadUp.push(callback);
        }
        public onDpadDown(callback: (direction: number) => void): void {
            if (this._input) BABYLON.SceneManager.gamepadDpadDown.push(callback);
        }
        public onDpadPress(direction: number, callback: () => void): void {
            if (this._input) BABYLON.SceneManager.gamepadDpadPress.push({ index: direction, action: callback });
        }
        public getDpadInput(direction: number): boolean {
            var result: boolean = false;
            if (this._input) {
                var key: string = "d" + direction.toString();
                if (BABYLON.SceneManager.keymap[key] != null) {
                    result = BABYLON.SceneManager.keymap[key];
                }
            }
            return result;
        }
        public onTriggerLeft(callback: (value: number) => void): void {
            if (this._input) BABYLON.SceneManager.gamepadLeftTrigger.push(callback);
        }
        public onTriggerRight(callback: (value: number) => void): void {
            if (this._input) BABYLON.SceneManager.gamepadRightTrigger.push(callback);
        }
        public getTriggerInput(trigger: number): number {
            var result: number = 0;
            if (this._input) {
                var key: string = "t" + trigger.toString();
                if (BABYLON.SceneManager.keymap[key] != null) {
                    result = BABYLON.SceneManager.keymap[key];
                }
            }
            return result;
        }
        public getConnectedGamepad(): BABYLON.Gamepad {
            return (this._input) ? BABYLON.SceneManager.gamepad : null;
        }
        public getConnectedGamepadType(): BABYLON.GamepadType {
            return (this._input) ? BABYLON.SceneManager.gamepadType : BABYLON.GamepadType.None;
        }
        public disposeConnectedGamepad(): void {
            if (this._input) {
                if (BABYLON.SceneManager.gamepads != null) {
                    BABYLON.SceneManager.gamepads.dispose();
                    BABYLON.SceneManager.gamepads = null;
                }
                BABYLON.SceneManager.gamepad = null;
                BABYLON.SceneManager.gamepadType = BABYLON.GamepadType.None;
                BABYLON.SceneManager.gamepadConnected = null;
            }
        }

        // ********************************** //
        // *  Scene Joystick State Support  * //
        // ********************************** //

        public getLeftVirtualJoystick(): BABYLON.VirtualJoystick {
            return (this._input) ? BABYLON.SceneManager.leftJoystick : null;
        }
        public getRightVirtualJoystick(): BABYLON.VirtualJoystick {
            return (this._input) ? BABYLON.SceneManager.rightJoystick : null;
        }
        public disposeVirtualJoysticks(): void {
            if (this._input) {
                if (BABYLON.SceneManager.leftJoystick != null) {
                    BABYLON.SceneManager.leftJoystick.releaseCanvas();
                    BABYLON.SceneManager.leftJoystick = null;
                }
                if (BABYLON.SceneManager.rightJoystick != null) {
                    BABYLON.SceneManager.rightJoystick.releaseCanvas();
                    BABYLON.SceneManager.rightJoystick = null;
                }
            }
        }

        // ************************************ //
        // *   Update Camera Helper Support   * //
        // ************************************ //

        public updateCameraPosition(camera: BABYLON.FreeCamera, horizontal: number, vertical: number, speed: number): void {
            if (camera != null) {
                var local = camera._computeLocalCameraSpeed() * speed;
                var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);
                var deltaTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(horizontal * local, 0, -vertical * local), cameraTransform);
                camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
            }
        }
        public updateCameraRotation(camera: BABYLON.FreeCamera, mousex: number, mousey: number, speed: number): void {
            if (camera != null) {
                camera.cameraRotation = camera.cameraRotation.add(new BABYLON.Vector2(mousey * speed, mousex * speed));
            }
        }
        public updateCameraUserInput(camera: BABYLON.FreeCamera, movementSpeed: number, rotationSpeed: number): void {
            if (camera != null) {
                var horizontal: number = this.getUserInput(BABYLON.UserInputAxis.Horizontal);
                var vertical: number = this.getUserInput(BABYLON.UserInputAxis.Vertical);
                var mousex: number = this.getUserInput(BABYLON.UserInputAxis.MouseX);
                var mousey: number = this.getUserInput(BABYLON.UserInputAxis.MouseY);
                this.updateCameraPosition(camera, horizontal, -vertical, movementSpeed);
                this.updateCameraRotation(camera, mousex, mousey, rotationSpeed);
            }
        }

        // *********************************** //
        // *  Scene Navigation Mesh Support  * //
        // *********************************** //

        public hasNavigationMesh(): boolean {
            return (this._navmesh != null);
        }
        public setNavigationMesh(mesh: BABYLON.AbstractMesh): void {
            this._navmesh = mesh;
        }
        public getNavigationMesh(): BABYLON.AbstractMesh {
            return this._navmesh;
        }
        public getNavigationTool(): Navigation {
            // Babylon Navigation Mesh Tool
            // https://github.com/wanadev/babylon-navigation-mesh
            if (this._navigation == null) {
                this._navigation = new Navigation();
            }
            return this._navigation;
        }
        public getNavigationZone(): string {
            return "scene";
        }
        public getNavigationPath(agent: BABYLON.AbstractMesh, destination: BABYLON.Vector3): BABYLON.Vector3[] {
            if (this._navigation == null || this._navmesh == null) return null;
            var zone: string = this.getNavigationZone();
            var group: number = this._navigation.getGroup(zone, agent.position);
            return this._navigation.findPath(agent.position, destination, zone, group);
        }
        public setNavigationPath(agent: BABYLON.AbstractMesh, path: BABYLON.Vector3[], speed?: number, loop?: boolean, callback?: () => void): void {
            if (path && path.length > 1) {
                var length = 0;
                var direction = [{
                    frame: 0,
                    value: agent.position
                }];
                for (var i = 0; i < path.length; i++) {
                    length += BABYLON.Vector3.Distance(direction[i].value, path[i]);
                    direction.push({
                        frame: length,
                        value: path[i]
                    });
                }
                var move: BABYLON.Animation = new BABYLON.Animation("Move", "position", 3, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                move.setKeys(direction);
                agent.animations.push(move);
                this._scene.beginAnimation(agent, 0, length, loop, speed, callback);
            }
        }
        public getNavigationAgent(agent: BABYLON.AbstractMesh): BABYLON.NavigationAgent {
            return new BABYLON.NavigationAgent(agent);
        }
        public getNavigationAgents(): BABYLON.Mesh[] {
            return this._scene.getMeshesByTags("[NAVAGENT]");
        }
        public getNavigationAreaTable(): BABYLON.INavigationArea[] {
            return (this._navmesh.metadata != null && this._navmesh.metadata.properties != null && this._navmesh.metadata.properties.table != null) ? this._navmesh.metadata.properties.table : [];
        }
        public getNavigationAreaIndexes(): number[] {
            return (this._navmesh.metadata != null && this._navmesh.metadata.properties != null && this._navmesh.metadata.properties.areas != null) ? this._navmesh.metadata.properties.areas : [];
        }
        public getNavigationAreaName(index: number): string {
            var result: string = "";
            if (this._navmesh.metadata != null && this._navmesh.metadata.properties != null && this._navmesh.metadata.properties.table != null) {
                var areaTable: BABYLON.INavigationArea[] = this._navmesh.metadata.properties.table;
                if (areaTable != null) {
                    for (var ii: number = 0; ii < areaTable.length; ii++) {
                        if (areaTable[ii].index === index) {
                            result = areaTable[ii].area;
                            break;
                        }
                    }
                }
            }
            return result;
        }
        public getNavigationAreaCost(index: number): number {
            var result: number = -1;
            if (this._navmesh.metadata != null && this._navmesh.metadata.properties != null) {
                var areaTable: INavigationArea[] = this._navmesh.metadata.properties.table;
                if (areaTable != null) {
                    for (var ii: number = 0; ii < areaTable.length; ii++) {
                        if (areaTable[ii].index === index) {
                            result = areaTable[ii].cost;
                            break;
                        }
                    }
                }
            }
            return result;
        }

        // ********************************** //
        // *  Private Input Helper Support  * //
        // ********************************** //

        private static inputKeyDownHandler(e: KeyboardEvent): any {
            var key: string = "k" + e.keyCode.toString();
            var pressed: boolean = false;
            if (BABYLON.SceneManager.keymap[key] != null) {
                pressed = BABYLON.SceneManager.keymap[key];
            }
            BABYLON.SceneManager.keymap[key] = true;
            switch (e.keyCode) {
                case 39: // Right
                case 68: // D-Key
                    BABYLON.SceneManager.k_horizontal = 1;
                    break;
                case 37: // Left
                case 65: // A-Key
                    BABYLON.SceneManager.k_horizontal = -1;
                    break;
                case 38: // Forward
                case 87: // W-Key
                    BABYLON.SceneManager.k_vertical = 1;
                    break;
                case 40: // Back
                case 83: // S-Key
                    BABYLON.SceneManager.k_vertical = -1;
                    break;
            }
            if (BABYLON.SceneManager.keyButtonDown != null && BABYLON.SceneManager.keyButtonDown.length > 0) {
                BABYLON.SceneManager.keyButtonDown.forEach((callback) => {
                    callback(e.keyCode);
                });
            }
            if (!pressed) {
                if (BABYLON.SceneManager.keyButtonPress != null && BABYLON.SceneManager.keyButtonPress.length > 0) {
                    BABYLON.SceneManager.keyButtonPress.forEach((press) => {
                        if (press.index === e.keyCode) {
                            press.action();
                        }
                    });
                }
            }
            if (BABYLON.SceneManager.preventDefault) e.preventDefault();
            return true;
        }
        private static inputKeyUpHandler(e: KeyboardEvent): any {
            var key: string = "k" + e.keyCode.toString();
            BABYLON.SceneManager.keymap[key] = false;
            switch (e.keyCode) {
                case 39: // Right
                case 37: // Left
                case 68: // D-Key
                case 65: // A-Key
                    BABYLON.SceneManager.k_horizontal = 0;
                    break;
                case 38: // Forward
                case 40: // Back
                case 87: // W-Key
                case 83: // S-Key
                    BABYLON.SceneManager.k_vertical = 0;
                    break;
            }
            if (BABYLON.SceneManager.keyButtonUp != null && BABYLON.SceneManager.keyButtonUp.length > 0) {
                BABYLON.SceneManager.keyButtonUp.forEach((callback) => {
                    callback(e.keyCode);
                });
            }
            if (BABYLON.SceneManager.preventDefault) e.preventDefault();
            return true;
        }

        private static inputPointerDownHandler(e: PointerEvent): any {
            if (e.button === 0) {
                BABYLON.SceneManager.previousPosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            }
            var key: string = "p" + e.button.toString();
            var pressed: boolean = false;
            if (BABYLON.SceneManager.keymap[key] != null) {
                pressed = BABYLON.SceneManager.keymap[key];
            }
            BABYLON.SceneManager.keymap[key] = true;
            if (BABYLON.SceneManager.mouseButtonDown != null && BABYLON.SceneManager.mouseButtonDown.length > 0) {
                BABYLON.SceneManager.mouseButtonDown.forEach((callback) => {
                    callback(e.button);
                });
            }
            if (!pressed) {
                if (BABYLON.SceneManager.mouseButtonPress != null && BABYLON.SceneManager.mouseButtonPress.length > 0) {
                    BABYLON.SceneManager.mouseButtonPress.forEach((press) => {
                        if (press.index === e.button) {
                            press.action();
                        }
                    });
                }
            }
            if (BABYLON.SceneManager.preventDefault) e.preventDefault();
            return true;
        }
        private static inputPointerUpHandler(e: PointerEvent): any {
            if (e.button === 0) {
                BABYLON.SceneManager.previousPosition = null;
                BABYLON.SceneManager.k_mousex = 0;
                BABYLON.SceneManager.k_mousey = 0;
            }
            var key: string = "p" + e.button.toString();
            BABYLON.SceneManager.keymap[key] = false;
            if (BABYLON.SceneManager.mouseButtonUp != null && BABYLON.SceneManager.mouseButtonUp.length > 0) {
                BABYLON.SceneManager.mouseButtonUp.forEach((callback) => {
                    callback(e.button);
                });
            }
            if (BABYLON.SceneManager.preventDefault) e.preventDefault();
            return true;
        }
        private static inputPointerMoveHandler(e: PointerEvent): any {
            if (e.button === 0 && BABYLON.SceneManager.previousPosition != null) {
                BABYLON.SceneManager.clientx = e.clientX;
                BABYLON.SceneManager.clienty = e.clientY;
                var offsetX = e.clientX - BABYLON.SceneManager.previousPosition.x;
                var offsetY = e.clientY - BABYLON.SceneManager.previousPosition.y;
                BABYLON.SceneManager.previousPosition = {
                    x: e.clientX,
                    y: e.clientY
                };
                var mousex: number = offsetX / BABYLON.UserInputOptions.PointerAngularSensibility;
                var mousey: number = offsetY / BABYLON.UserInputOptions.PointerAngularSensibility;
                if (mousex != 0) {
                    BABYLON.SceneManager.k_mousex = mousex;
                }
                if (mousey != 0) {
                    if (BABYLON.SceneManager.rightHanded) {
                        BABYLON.SceneManager.k_mousey = -mousey;
                    } else {
                        BABYLON.SceneManager.k_mousey = mousey;
                    }
                }
            }
            if (BABYLON.SceneManager.preventDefault) e.preventDefault();
            return true;
        }

        private static inputButtonDownHandler(button: number): void {
            if (BABYLON.SceneManager.gamepad != null) {
                var key: string = "b" + button.toString();
                var pressed: boolean = false;
                if (BABYLON.SceneManager.keymap[key] != null) {
                    pressed = BABYLON.SceneManager.keymap[key];
                }
                BABYLON.SceneManager.keymap[key] = true;
                if (BABYLON.SceneManager.gamepadButtonDown != null && BABYLON.SceneManager.gamepadButtonDown.length > 0) {
                    BABYLON.SceneManager.gamepadButtonDown.forEach((callback) => {
                        callback(button);
                    });
                }
                if (!pressed) {
                    if (BABYLON.SceneManager.gamepadButtonPress != null && BABYLON.SceneManager.gamepadButtonPress.length > 0) {
                        BABYLON.SceneManager.gamepadButtonPress.forEach((press) => {
                            if (press.index === button) {
                                press.action();
                            }
                        });
                    }
                }
            }
        }
        private static inputButtonUpHandler(button: number): void {
            if (BABYLON.SceneManager.gamepad != null) {
                var key: string = "b" + button.toString();
                BABYLON.SceneManager.keymap[key] = false;
                if (BABYLON.SceneManager.gamepadButtonUp != null && BABYLON.SceneManager.gamepadButtonUp.length > 0) {
                    BABYLON.SceneManager.gamepadButtonUp.forEach((callback) => {
                        callback(button);
                    });
                }
            }
        }
        private static inputXboxDPadDownHandler(dPadPressed: BABYLON.Xbox360Dpad): void {
            if (BABYLON.SceneManager.gamepad != null) {
                var key: string = "d" + dPadPressed.toString();
                var pressed: boolean = false;
                if (BABYLON.SceneManager.keymap[key] != null) {
                    pressed = BABYLON.SceneManager.keymap[key];
                }
                BABYLON.SceneManager.keymap[key] = true;
                if (BABYLON.SceneManager.gamepadDpadDown != null && BABYLON.SceneManager.gamepadDpadDown.length > 0) {
                    BABYLON.SceneManager.gamepadDpadDown.forEach((callback) => {
                        callback(dPadPressed);
                    });
                }
                if (!pressed) {
                    if (BABYLON.SceneManager.gamepadDpadPress != null && BABYLON.SceneManager.gamepadDpadPress.length > 0) {
                        BABYLON.SceneManager.gamepadDpadPress.forEach((press) => {
                            if (press.index === dPadPressed) {
                                press.action();
                            }
                        });
                    }
                }
            }
        }
        private static inputXboxDPadUpHandler(dPadReleased: BABYLON.Xbox360Dpad): void {
            if (BABYLON.SceneManager.gamepad != null) {
                var key: string = "d" + dPadReleased.toString();
                BABYLON.SceneManager.keymap[key] = false;
                if (BABYLON.SceneManager.gamepadDpadUp != null && BABYLON.SceneManager.gamepadDpadUp.length > 0) {
                    BABYLON.SceneManager.gamepadDpadUp.forEach((callback) => {
                        callback(dPadReleased);
                    });
                }
            }
        }
        private static inputXboxLeftTriggerHandler(value: number): void {
            if (BABYLON.SceneManager.gamepad != null) {
                BABYLON.SceneManager.keymap["t0"] = value;
                if (BABYLON.SceneManager.gamepadLeftTrigger != null && BABYLON.SceneManager.gamepadLeftTrigger.length > 0) {
                    BABYLON.SceneManager.gamepadLeftTrigger.forEach((callback) => {
                        callback(value);
                    });
                }
            }
        }
        private static inputXboxRightTriggerHandler(value: number): void {
            if (BABYLON.SceneManager.gamepad != null) {
                BABYLON.SceneManager.keymap["t1"] = value;
                if (BABYLON.SceneManager.gamepadRightTrigger != null && BABYLON.SceneManager.gamepadRightTrigger.length > 0) {
                    BABYLON.SceneManager.gamepadRightTrigger.forEach((callback) => {
                        callback(value);
                    });
                }
            }
        }
        private static inputLeftStickHandler(values: BABYLON.StickValues): void {
            if (BABYLON.SceneManager.gamepad != null) {
                var LSValues = values;
                var normalizedLX = LSValues.x / BABYLON.UserInputOptions.GamepadMovementSensibility;
                var normalizedLY = LSValues.y / BABYLON.UserInputOptions.GamepadMovementSensibility;
                LSValues.x = Math.abs(normalizedLX) >= BABYLON.UserInputOptions.GamepadDeadStickValue ? 0 + normalizedLX : 0;
                LSValues.y = Math.abs(normalizedLY) >= BABYLON.UserInputOptions.GamepadDeadStickValue ? 0 + normalizedLY : 0;
                BABYLON.SceneManager.g_horizontal = (BABYLON.UserInputOptions.GamepadLStickXInverted) ? -LSValues.x : LSValues.x;
                BABYLON.SceneManager.g_vertical = (BABYLON.UserInputOptions.GamepadLStickYInverted) ? LSValues.y : -LSValues.y;
            }
        }
        private static inputRightStickHandler(values: BABYLON.StickValues): void {
            if (BABYLON.SceneManager.gamepad != null) {
                var RSValues = values;
                var normalizedRX = RSValues.x / BABYLON.UserInputOptions.GamepadAngularSensibility;
                var normalizedRY = RSValues.y / BABYLON.UserInputOptions.GamepadAngularSensibility;
                RSValues.x = Math.abs(normalizedRX) >= BABYLON.UserInputOptions.GamepadDeadStickValue ? 0 + normalizedRX : 0;
                RSValues.y = Math.abs(normalizedRY) >= BABYLON.UserInputOptions.GamepadDeadStickValue ? 0 + normalizedRY : 0;
                BABYLON.SceneManager.g_mousex = (BABYLON.UserInputOptions.GamepadRStickXInverted) ? -RSValues.x : RSValues.x;
                BABYLON.SceneManager.g_mousey = (BABYLON.UserInputOptions.GamepadRStickYInverted) ? -RSValues.y : RSValues.y;
            }
        }
        private static inputGamepadConnected(pad: BABYLON.Gamepad) {
            if (pad.index === 0) {
                BABYLON.SceneManager.gamepad = pad;
                console.log("[Scene Manager] - Gamepad Connected: " + BABYLON.SceneManager.gamepad.id);
                if ((<string>BABYLON.SceneManager.gamepad.id).search("Xbox 360") !== -1 || (<string>BABYLON.SceneManager.gamepad.id).search("Xbox One") !== -1 || (<string>BABYLON.SceneManager.gamepad.id).search("xinput") !== -1) {
                    BABYLON.SceneManager.gamepadType = BABYLON.GamepadType.Xbox360;
                    var xbox360Pad: BABYLON.Xbox360Pad = BABYLON.SceneManager.gamepad as BABYLON.Xbox360Pad;
                    xbox360Pad.onbuttonup(BABYLON.SceneManager.inputButtonUpHandler);
                    xbox360Pad.onbuttondown(BABYLON.SceneManager.inputButtonDownHandler);
                    xbox360Pad.onleftstickchanged(BABYLON.SceneManager.inputLeftStickHandler);
                    xbox360Pad.onrightstickchanged(BABYLON.SceneManager.inputRightStickHandler);
                    xbox360Pad.ondpadup(BABYLON.SceneManager.inputXboxDPadUpHandler);
                    xbox360Pad.ondpaddown(BABYLON.SceneManager.inputXboxDPadDownHandler);
                    xbox360Pad.onlefttriggerchanged(BABYLON.SceneManager.inputXboxLeftTriggerHandler);
                    xbox360Pad.onrighttriggerchanged(BABYLON.SceneManager.inputXboxRightTriggerHandler);
                } else {
                    BABYLON.SceneManager.gamepadType = BABYLON.GamepadType.Generic;
                    var genericPad: BABYLON.GenericPad = BABYLON.SceneManager.gamepad as BABYLON.GenericPad;
                    genericPad.onbuttonup(BABYLON.SceneManager.inputButtonUpHandler);
                    genericPad.onbuttondown(BABYLON.SceneManager.inputButtonDownHandler);
                    genericPad.onleftstickchanged(BABYLON.SceneManager.inputLeftStickHandler);
                    genericPad.onrightstickchanged(BABYLON.SceneManager.inputRightStickHandler);
                }
                if (BABYLON.SceneManager.gamepadConnected != null) {
                    BABYLON.SceneManager.gamepadConnected(BABYLON.SceneManager.gamepad, BABYLON.SceneManager.gamepadType);
                }
            }
        }

        // ************************************** //
        // *  Private User Input State Support  * //
        // ************************************** //

        private static updateUserInputState(): void {
            // Reset global user input state  buffers
            BABYLON.SceneManager.x_horizontal = 0;
            BABYLON.SceneManager.x_vertical = 0;
            BABYLON.SceneManager.x_mousex = 0;
            BABYLON.SceneManager.x_mousey = 0;
            // Update user input state by order of precedence
            if (BABYLON.SceneManager.k_horizontal !== 0) {
                BABYLON.SceneManager.x_horizontal = BABYLON.SceneManager.k_horizontal;
            } else if (BABYLON.SceneManager.j_horizontal !== 0) {
                BABYLON.SceneManager.x_horizontal = BABYLON.SceneManager.j_horizontal;
            } else if (BABYLON.SceneManager.g_horizontal !== 0) {
                BABYLON.SceneManager.x_horizontal = BABYLON.SceneManager.g_horizontal;
            }
            if (BABYLON.SceneManager.k_vertical !== 0) {
                BABYLON.SceneManager.x_vertical = BABYLON.SceneManager.k_vertical;
            } else if (BABYLON.SceneManager.j_vertical !== 0) {
                BABYLON.SceneManager.x_vertical = BABYLON.SceneManager.j_vertical;
            } else if (BABYLON.SceneManager.g_vertical !== 0) {
                BABYLON.SceneManager.x_vertical = BABYLON.SceneManager.g_vertical;
            }
            if (BABYLON.SceneManager.k_mousex !== 0) {
                BABYLON.SceneManager.x_mousex = BABYLON.SceneManager.k_mousex;
            } else if (BABYLON.SceneManager.j_mousex !== 0) {
                BABYLON.SceneManager.x_mousex = BABYLON.SceneManager.j_mousex;
            } else if (BABYLON.SceneManager.g_mousex !== 0) {
                BABYLON.SceneManager.x_mousex = BABYLON.SceneManager.g_mousex;
            }
            if (BABYLON.SceneManager.k_mousey !== 0) {
                BABYLON.SceneManager.x_mousey = BABYLON.SceneManager.k_mousey;
            } else if (BABYLON.SceneManager.j_mousey !== 0) {
                BABYLON.SceneManager.x_mousey = BABYLON.SceneManager.j_mousey;
            } else if (BABYLON.SceneManager.g_mousey !== 0) {
                BABYLON.SceneManager.x_mousey = BABYLON.SceneManager.g_mousey;
            }
            // Update global user input state buffers
            BABYLON.SceneManager.horizontal = BABYLON.SceneManager.x_horizontal;
            BABYLON.SceneManager.vertical = BABYLON.SceneManager.x_vertical;
            BABYLON.SceneManager.mousex = BABYLON.SceneManager.x_mousex;
            BABYLON.SceneManager.mousey = BABYLON.SceneManager.x_mousey;
        }

        // *********************************** //
        // *  Private Scene Parsing Support  * //
        // *********************************** //

        private static parseSceneMetadata(rootUrl: string, sceneFilename: any, scene: BABYLON.Scene): void {
            var scenex: any = <any>scene;
            if (scenex.manager == null) {
                var manager: BABYLON.SceneManager = new BABYLON.SceneManager(rootUrl, sceneFilename, scene);
                scenex.manager = manager;
                if (manager.controller != null) {
                    manager.controller.ready();
                }
            } else {
                if (console) console.warn("Scene already has already been parsed.");
            }
        }
        private static parseMeshMetadata(meshes: BABYLON.AbstractMesh[], scene: BABYLON.Scene): void {
            var scenex: any = <any>scene;
            if (scenex.manager != null) {
                var manager: BABYLON.SceneManager = scenex.manager as BABYLON.SceneManager;
                var ticklist: BABYLON.IScriptComponent[] = [];
                BABYLON.SceneManager.parseSceneMeshes(meshes, scene, ticklist);
                if (ticklist.length > 0) {
                    ticklist.sort((left, right): number => {
                        if (left.order < right.order) return -1;
                        if (left.order > right.order) return 1;
                        return 0;
                    });
                    ticklist.forEach((scriptComponent) => {
                        scriptComponent.instance.register();
                    });
                }
            } else {
                if (console) console.warn("No scene manager detected for current scene");
            }
        }
        private static parseSceneCameras(cameras: BABYLON.Camera[], scene: BABYLON.Scene, ticklist: BABYLON.IScriptComponent[]): void {
            if (cameras != null && cameras.length > 0) {
                cameras.forEach((camera) => {
                    if (camera.metadata != null && camera.metadata.api) {
                        if (camera.metadata.disposal == null || camera.metadata.disposal === false) {
                            camera.onDispose = () => { BABYLON.SceneManager.destroySceneComponents(camera); };
                            camera.metadata.disposal = true;
                        }
                        var metadata: BABYLON.IObjectMetadata = camera.metadata as BABYLON.IObjectMetadata;
                        if (metadata.components != null && metadata.components.length > 0) {
                            metadata.components.forEach((camerascript) => {
                                if (camerascript.klass != null && camerascript.klass !== "" && camerascript.klass !== "BABYLON.ScriptComponent" && camerascript.klass !== "BABYLON.SceneController") {
                                    var CameraComponentClass = BABYLON.SceneManager.createComponentClass(camerascript.klass);
                                    if (CameraComponentClass != null) {
                                        camerascript.instance = new CameraComponentClass(camera, scene, camerascript.update, camerascript.properties);
                                        if (camerascript.instance != null) {
                                            ticklist.push(camerascript);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
        private static parseSceneLights(lights: BABYLON.Light[], scene: BABYLON.Scene, ticklist: BABYLON.IScriptComponent[]): void {
            if (lights != null && lights.length > 0) {
                lights.forEach((light) => {
                    if (light.metadata != null && light.metadata.api) {
                        if (light.metadata.disposal == null || light.metadata.disposal === false) {
                            light.onDispose = () => { BABYLON.SceneManager.destroySceneComponents(light); };
                            light.metadata.disposal = true;
                        }
                        var metadata: BABYLON.IObjectMetadata = light.metadata as BABYLON.IObjectMetadata;
                        if (metadata.components != null && metadata.components.length > 0) {
                            metadata.components.forEach((lightscript) => {
                                if (lightscript.klass != null && lightscript.klass !== "" && lightscript.klass !== "BABYLON.ScriptComponent" && lightscript.klass !== "BABYLON.SceneController") {
                                    var LightComponentClass = BABYLON.SceneManager.createComponentClass(lightscript.klass);
                                    if (LightComponentClass != null) {
                                        lightscript.instance = new LightComponentClass(light, scene, lightscript.update, lightscript.properties);
                                        if (lightscript.instance != null) {
                                            ticklist.push(lightscript);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
        private static parseSceneMeshes(meshes: BABYLON.AbstractMesh[], scene: BABYLON.Scene, ticklist: BABYLON.IScriptComponent[]): void {
            if (meshes != null && meshes.length > 0) {
                meshes.forEach((mesh) => {
                    if (mesh.metadata != null && mesh.metadata.api) {
                        if (mesh.metadata.disposal == null || mesh.metadata.disposal === false) {
                            mesh.onDispose = () => { BABYLON.SceneManager.destroySceneComponents(mesh); };
                            mesh.metadata.disposal = true;
                        }
                        var metadata: BABYLON.IObjectMetadata = mesh.metadata as BABYLON.IObjectMetadata;
                        if (metadata.components != null && metadata.components.length > 0) {
                            metadata.components.forEach((meshscript) => {
                                if (meshscript.klass != null && meshscript.klass !== "" && meshscript.klass !== "BABYLON.ScriptComponent" && meshscript.klass !== "BABYLON.SceneController") {
                                    var MeshComponentClass = BABYLON.SceneManager.createComponentClass(meshscript.klass);
                                    if (MeshComponentClass != null) {
                                        meshscript.instance = new MeshComponentClass(mesh, scene, meshscript.update, meshscript.properties);
                                        if (meshscript.instance != null) {
                                            ticklist.push(meshscript);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
        private static destroySceneComponents(owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light, destroyMetadata: boolean = true): void {
            if (owner != null && owner.metadata != null && owner.metadata.api) {
                var metadata: BABYLON.IObjectMetadata = owner.metadata as BABYLON.IObjectMetadata;
                if (metadata.components != null && metadata.components.length > 0) {
                    metadata.components.forEach((ownerscript) => {
                        if (ownerscript.instance != null) {
                            ownerscript.instance.dispose();
                            ownerscript.instance = null;
                        }
                    });
                    if (destroyMetadata) {
                        owner.metadata.components = null;
                    }
                }
                if (destroyMetadata) {
                    if (owner.metadata.properties != null) {
                        owner.metadata.properties = null;
                    }
                    owner.metadata = null;
                }
            }
        }

        // *********************************** //
        // * Private Ground Creation Support * //
        // *********************************** //

        private static createGroundTerrain(name: string, url: string, options: { width?: number, height?: number, subdivisions?: number, minHeight?: number, maxHeight?: number, updatable?: boolean, onReady?: (mesh: GroundMesh) => void }, scene: Scene): GroundMesh {
            var width = options.width || 10.0;
            var height = options.height || 10.0;
            var subdivisions = options.subdivisions || 1 | 0;
            var minHeight = options.minHeight || 0.0;
            var maxHeight = options.maxHeight || 10.0;
            var updatable = options.updatable;
            var onReady = options.onReady;

            var ground = new GroundMesh(name, scene);
            ground._subdivisionsX = subdivisions;
            ground._subdivisionsY = subdivisions;
            ground._width = width;
            ground._height = height;
            ground._maxX = ground._width / 2.0;
            ground._maxZ = ground._height / 2.0;
            ground._minX = -ground._maxX;
            ground._minZ = -ground._maxZ;

            ground._setReady(false);

            var onload = img => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var bufferWidth = img.width;
                var bufferHeight = img.height;
                canvas.width = bufferWidth;
                canvas.height = bufferHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = <Uint8Array>(<any>context.getImageData(0, 0, bufferWidth, bufferHeight).data);
                var vertexData = BABYLON.SceneManager.parseTerrainHeightmap({
                    width, height,
                    subdivisions,
                    minHeight, maxHeight,
                    buffer, bufferWidth, bufferHeight
                });

                vertexData.applyToMesh(ground, updatable);

                ground._setReady(true);

                //execute ready callback, if set
                if (onReady) {
                    onReady(ground);
                }
            };

            Tools.LoadImage(url, onload, () => { }, scene.database);

            return ground;
        }
        private static parseTerrainHeightmap(options: { width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, buffer: Uint8Array, bufferWidth: number, bufferHeight: number }): VertexData {
            var indices = [];
            var positions = [];
            var normals = [];
            var uvs = [];
            var row, col;

            // Heightmap
            var floatView = new Float32Array(options.buffer.buffer);

            // Vertices
            for (row = 0; row <= options.subdivisions; row++) {
                for (col = 0; col <= options.subdivisions; col++) {
                    var position = new Vector3((col * options.width) / options.subdivisions - (options.width / 2.0), 0, ((options.subdivisions - row) * options.height) / options.subdivisions - (options.height / 2.0));

                    // Compute height
                    var heightMapX = (((position.x + options.width / 2) / options.width) * (options.bufferWidth - 1)) | 0;
                    var heightMapY = ((1.0 - (position.z + options.height / 2) / options.height) * (options.bufferHeight - 1)) | 0;

                    // Unpack height
                    var pos = (heightMapX + heightMapY * options.bufferWidth);
                    var gradient = floatView[pos];

                    position.y = options.minHeight + (options.maxHeight - options.minHeight) * gradient;

                    // Add  vertex
                    positions.push(position.x, position.y, position.z);
                    normals.push(0, 0, 0);
                    uvs.push(col / options.subdivisions, 1.0 - row / options.subdivisions);
                }
            }

            // Indices
            for (row = 0; row < options.subdivisions; row++) {
                for (col = 0; col < options.subdivisions; col++) {
                    indices.push(col + 1 + (row + 1) * (options.subdivisions + 1));
                    indices.push(col + 1 + row * (options.subdivisions + 1));
                    indices.push(col + row * (options.subdivisions + 1));

                    indices.push(col + (row + 1) * (options.subdivisions + 1));
                    indices.push(col + 1 + (row + 1) * (options.subdivisions + 1));
                    indices.push(col + row * (options.subdivisions + 1));
                }
            }

            // Normals
            VertexData.ComputeNormals(positions, indices, normals);

            // Result
            var vertexData = new VertexData();

            vertexData.indices = indices;
            vertexData.positions = positions;
            vertexData.normals = normals;
            vertexData.uvs = uvs;

            return vertexData;
        }

        // ********************************** //
        // * Private Class Creation Support * //
        // ********************************** //

        private static createComponentClass(klass: string): any {
            return BABYLON.SceneManager.createObjectFromString(klass, "function");
        }
        private static createObjectFromString(str: string, type: string): any {
            type = type || "object";  // can pass "function"
            var arr = str.split(".");
            var fn = (window || this);
            for (var i = 0, len = arr.length; i < len; i++) {
                try {
                    fn = fn[arr[i]];
                } catch (ex) {
                    break;
                }
            }
            if (typeof fn !== type) {
                fn = null;
                if (console) console.warn(type + " not found: " + str);
            }
            return fn;
        }
    }
}
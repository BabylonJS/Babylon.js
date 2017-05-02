module BABYLON {

    /* Babylon Scene Component Interfaces */
    export interface IScriptComponent {
		order:number;
		name:string;
		klass:string;
		update:boolean;
		controller:boolean;
		properties:any;
		instance:BABYLON.SceneComponent;
		tag:any;
    }

    /* Babylon Base Scene Component Class */
    export abstract class SceneComponent {
        public readonly engine:BABYLON.Engine = null;
        public readonly scene:BABYLON.Scene = null;
        public register:() => void = null;
        public disposer:() => void = null;
        public tick:boolean = false;

        private _ticker:() => void = null;
        private _started = false;
        private _initialized = false;
        private _properties:any = null;

        public constructor(host:BABYLON.Scene, enableUpdate:boolean, propertyBag:any) {
            if (host == null) throw new Error("Null host scene obejct specified.");
            this.tick = enableUpdate;
            this.scene = host;
            this.engine = host.getEngine();
            this._properties = propertyBag;
            this._started = false;
            this._initialized = false;

            /* Scene Component Instance Handlers */
            var instance:BABYLON.SceneComponent = this;
            instance.register = function() { instance.registerInstance(instance); };
            instance.disposer = function() { instance.disposeInstance(instance); };
            instance._ticker = function() { instance.updateInstance(instance); };
        }

        /* Scene Component Life Cycle Functions */
        public abstract start():void;
        public abstract update():void;
        public abstract destroy():void;

        /* Scene Component Helper Member Functions */
        public getManager(): BABYLON.SceneManager {
            var scenex:any = this.scene;
            return (scenex.manager) ? (scenex.manager as BABYLON.SceneManager) : null;
        }
        public getProperty<T>(name:string, defaultValue:T = null): T {
            var result:any = null
            if (this._properties != null) {
                result = this._properties[name];
            }
            if (result == null) result = defaultValue;
            return (result != null) ? result as T : null;
        }

        /* Private Scene Component Instance Worker Functions */
        private registerInstance(instance:BABYLON.SceneComponent):void {
            instance.scene.registerBeforeRender(instance._ticker);
        }
        private updateInstance(instance:BABYLON.SceneComponent) : void {
            if (!instance._started) {
                /* First frame starts component */
                instance.start();
                instance._started = true;
            } else if (instance._started && instance.tick) {
                /* All other frames tick component */
                instance.update();
            }
        }
        private disposeInstance(instance:BABYLON.SceneComponent) {
            instance.scene.unregisterBeforeRender(instance._ticker);
            instance.destroy();
            instance.tick = false;
            instance._ticker = null;
            instance._started = false;
            instance._properties = null;
            instance.register = null;
            instance.disposer = null;
        }
    }

    /* Babylon Base Camera Scene Component Class */
    export abstract class CameraComponent extends BABYLON.SceneComponent {
        public readonly camera: BABYLON.Camera;
        public constructor(owner: BABYLON.Camera, scene:BABYLON.Scene, enableUpdate:boolean, propertyBag:any) {
            if (owner == null) throw new Error("Null owner scene obejct specified.");
            super(scene, enableUpdate, propertyBag);
            this.camera = owner;
        }
        public getGameObject(): BABYLON.UnityGameObject {
            return this.getManager().getSceneGameObject(this.camera);
        }
        public findComponent(klass:string) : any {
            return this.getManager().findSceneComponent(klass, this.camera);
        }
        public findComponents(klass:string) : any[] {
            return this.getManager().findSceneComponents(klass, this.camera);
        }
    }

    /* Babylon Base Light Scene Component Class */
    export abstract class LightComponent extends BABYLON.SceneComponent {
        public readonly light: BABYLON.Light;
        public constructor(owner: BABYLON.Light, scene:BABYLON.Scene, enableUpdate:boolean, propertyBag:any) {
            if (owner == null) throw new Error("Null owner scene obejct specified.");
            super(scene, enableUpdate, propertyBag);
            this.light = owner;
        }
        public getGameObject(): BABYLON.UnityGameObject {
            return this.getManager().getSceneGameObject(this.light);
        }
        public findComponent(klass:string) : any {
            return this.getManager().findSceneComponent(klass, this.light);
        }
        public findComponents(klass:string) : any[] {
            return this.getManager().findSceneComponents(klass, this.light);
        }
    }

    /* Babylon Base Mesh Scene Component Class */
    export abstract class MeshComponent extends BABYLON.SceneComponent {
        public readonly mesh:BABYLON.AbstractMesh;
        public constructor(owner: BABYLON.AbstractMesh, scene:BABYLON.Scene, enableUpdate:boolean, propertyBag:any) {
            if (owner == null) throw new Error("Null owner scene obejct specified.");
            super(scene, enableUpdate, propertyBag);
            this.mesh = owner;
        }
        public getGameObject(): BABYLON.UnityGameObject {
            return this.getManager().getSceneGameObject(this.mesh);
        }
        public findComponent(klass:string) : any {
            return this.getManager().findSceneComponent(klass, this.mesh);
        }
        public findComponents(klass:string) : any[] {
            return this.getManager().findSceneComponents(klass, this.mesh);
        }
    }
    
    /* Babylon Base Scene Controller Class */
    export abstract class SceneController extends BABYLON.MeshComponent {
        public abstract ready():void;
        public constructor(owner: BABYLON.AbstractMesh, scene:BABYLON.Scene, enableUpdate:boolean, propertyBag:any) {
            super(owner, scene, enableUpdate, propertyBag);
        }
    }

    /* Babylon Scene Component Manager */
    export class SceneManager {
        public onrender: () => void = null;
        public controller:BABYLON.SceneController = null;

        private _scene:BABYLON.Scene = null;
        private _render: () => void = null;
        private _running:boolean = false;
        private _audioPause:boolean = false;
        private _markup: string = "";
        private _gui:string = "None";
        private static loader:(root:string, name:string) => void = null;

        public constructor(host:BABYLON.Scene) {
            if (host == null) throw new Error("Null host scene obejct specified.");
            this._scene = host;

            // Parse, create and store component instances
            var ticklist:BABYLON.IScriptComponent[] = [];
            BABYLON.SceneManager.parseSceneCameras(this._scene.cameras, this._scene, ticklist);
            BABYLON.SceneManager.parseSceneLights(this._scene.lights, this._scene, ticklist);
            BABYLON.SceneManager.parseSceneMeshes(this._scene.meshes, this._scene, ticklist);

            // Parse and intialize scene metadata properties
            if (this._scene.metadata != null && this._scene.metadata.properties != null) {
                if (this._scene.metadata.properties.controllerPresent) {
                    var sceneController:BABYLON.SceneComponent = this.findSceneController(this._scene.meshes, this._scene);
                    if (sceneController != null && sceneController instanceof BABYLON.SceneController) {
                        this.controller = (sceneController as BABYLON.SceneController);
                    } else {
                        var msg2:string = "Failed to locate valid BABYLON.SceneController metadata instance";
                        if (console.warn) console.warn(msg2);
                        else console.log("Warning: " + msg2);
                    }
                }
                if (this._scene.metadata.properties.interfaceMode != null) {
                    this._gui = this._scene.metadata.properties.interfaceMode;
                    if (this._scene.metadata.properties.userInterface != null) {
                        var ui:any = this._scene.metadata.properties.userInterface;
                        if (ui.embedded && ui.base64 != null) {
                            this._markup = window.atob(ui.base64);
                            if (this._scene.metadata.properties.autoDraw == true && this._gui != null && this._gui !== "" && this._gui !== "None" && this._markup != null && this._markup !== "") {
                                this.drawSceneMarkup(this._markup);
                            }
                        }
                    }
                }
            }

            // Register scene component ticklist
            if (ticklist.length > 0) {
                ticklist.sort((left, right):number => {
                    if (left.order < right.order) return -1;
                    if (left.order > right.order) return 1; 
                    return 0;
                });
                ticklist.forEach((scriptComponent)=>{
                    scriptComponent.instance.register();
                });
            }

            // Scene component start, update and destroy proxies 
            var instance:BABYLON.SceneManager = this;
            this._render = function() { 
                instance._scene.render();
                if (instance.onrender != null) {
                    instance.onrender();
                }
            };
            this._scene.onDispose = function() { instance.dispose(); };
        }

        public dispose():void {
            if (this._scene.cameras != null  && this._scene.cameras.length > 0) {
                this._scene.cameras.forEach((camera)=>{
                    this.detroySceneComponents(camera);
                });
            }
            if (this._scene.lights != null && this._scene.lights.length > 0) {
                this._scene.lights.forEach((light)=>{
                    this.detroySceneComponents(light);
                });
            }
            if (this._scene.meshes != null && this._scene.meshes.length > 0) {
                this._scene.meshes.forEach((mesh)=>{
                    this.detroySceneComponents(mesh);
                });
            }
            var scenex:any = (<any>this._scene);
            if (scenex.manager) scenex.manager = null;
            scenex = null;
            this._scene = null;
        }
        
        // *********************************** //
        // *   Scene Manager Helper Support  * //
        // *********************************** //
        
        public start():void {
            if (!this._running) {
                this._scene.getEngine().runRenderLoop(this._render);
                this._running = true;
            }
        }
        public stop():void {
            this._scene.getEngine().stopRenderLoop(this._render);
            this._running = false;
        }
        public toggle():void {
            if (this._running) {
                this.pauseAudio();
                this.stop();
            } else {
                this.resumeAudio();
                this.start();
            }
        }
        public isRunning():boolean {
            return this._running
        }
        public loadLevel(name:string, path:string = null):void {
            if (BABYLON.SceneManager.hasSceneLoader()) {
                var folder:string = path;
                if (folder == null) {
                    if (this._scene.database != null && this._scene.database.currentSceneUrl != null) {
                        var url:string = this._scene.database.currentSceneUrl;
                        folder = url.substr(0, url.lastIndexOf("/")) + "/";
                    } else {
                        folder = "/";
                    }
                }
                this.stop();
                this.clearSceneMarkup();
                this._scene.dispose();
                BABYLON.SceneManager.loader(folder, name);
            } else {
                throw new Error("No scene loader function registered.");
            }
        }
        public pauseAudio():void {
            if (this._audioPause == false) {
                this._audioPause = true;
                if (this._scene.mainSoundTrack.soundCollection != null && this._scene.mainSoundTrack.soundCollection.length > 0) {
                    var tracks:BABYLON.Sound[] = this._scene.mainSoundTrack.soundCollection;
                    for (var i = 0, len = tracks.length; i < len; i++) {
                        var sound:BABYLON.Sound = tracks[i];
                        if (sound.isPlaying) {
                            sound.pause();
                        }
                    }
                }            
            }
        }
        public resumeAudio():void {
            if (this._audioPause == true) {
                this._audioPause = false;
                if (this._scene.mainSoundTrack.soundCollection != null && this._scene.mainSoundTrack.soundCollection.length > 0) {
                    var tracks:BABYLON.Sound[] = this._scene.mainSoundTrack.soundCollection;
                    for (var i = 0, len = tracks.length; i < len; i++) {
                        var sound:BABYLON.Sound = tracks[i];
                        if (sound.isPaused) {
                            sound.play();
                        }
                    }
                }            
            }
        }
        public showFullscreen():void {
            BABYLON.Tools.RequestFullscreen(document.documentElement);
        }

        // ********************************** //
        // *   Scene Markup Helper Support  * //
        // ********************************** //

        public getGuiMode():string {
            return this._gui;
        }
        public getSceneMarkup():string {
            return this._markup;
        }
        public drawSceneMarkup(markup:string):void {
            if (this._gui === "Html") {
                var element:Element = document.getElementById("gui");
                if (element == null) {
                    var gui:HTMLDivElement = document.createElement("div");
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
                var msg2:string = "Scene controller gui disabled.";
                if (console.warn) console.warn(msg2);
                else console.log("Warning: " + msg2);
            }
        }
        public clearSceneMarkup():void {
            if (this._gui === "Html") {
                var element:Element = document.getElementById("gui");
                if (element != null) {
                    element.innerHTML = "";
                }
            } else {
                var msg2:string = "Scene controller gui disabled.";
                if (console.warn) console.warn(msg2);
                else console.log("Warning: " + msg2);
            }
        }

        // ************************************ //
        // *    Game Object Helper Support    * //
        // ************************************ //

        public getSceneGameObject(owner:BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light) : BABYLON.UnityGameObject {
            if (owner.metadata != null && owner.metadata.unity) {
                var bag:any = (owner.metadata.properties != null) ? owner.metadata.properties : {};
                var result:BABYLON.UnityGameObject = new BABYLON.UnityGameObject(bag);
                result.type = owner.metadata.type;
                result.objectId = owner.metadata.objectId;
                result.objectName = owner.metadata.objectName;
                result.tagName = owner.metadata.tagName;
                result.layerIndex = owner.metadata.layerIndex;
                result.layerName = owner.metadata.layerName;
                return result;
            } else {
                return null; // Note: No Unity Metadata
            }
        }

        // ************************************* //
        // *   Scene Component Helper Support  * //
        // ************************************* //

        public findSceneController(meshes: BABYLON.AbstractMesh[], scene:BABYLON.Scene): any {
            var result:BABYLON.SceneComponent = null;
            if (meshes != null && meshes.length > 0) {
                for(var ii:number = 0; ii < meshes.length; ii++) {
                    var mesh:AbstractMesh = meshes[ii];
                    if (mesh.metadata != null && mesh.metadata.unity) {
                        if (mesh.metadata.components != null) {
                            var meshcomps:BABYLON.IScriptComponent[] = mesh.metadata.components as BABYLON.IScriptComponent[];
                            if (meshcomps != null && meshcomps.length > 0) {
                                for(var iii:number = 0; iii < meshcomps.length; iii++) {
                                    var meshscript:IScriptComponent = meshcomps[iii];
                                    if (meshscript.instance != null && meshscript.controller == true) {
                                        result = meshscript.instance;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (result != null) break;
                }
            }
            return result;
        }

        public findSceneComponent(klass:string, owner:BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light) : any {
            var result:BABYLON.SceneComponent = null;
            if (owner.metadata != null && owner.metadata.unity) {
                if (owner.metadata.components != null) {
                    var ownercomps:BABYLON.IScriptComponent[] = owner.metadata.components as BABYLON.IScriptComponent[];
                    if (ownercomps != null && ownercomps.length > 0) {
                        for (var ii:number = 0; ii < ownercomps.length; ii++) {
                            var ownerscript:BABYLON.IScriptComponent = ownercomps[ii];
                            if (ownerscript.instance != null && ownerscript.klass === klass) {
                                result = ownerscript.instance;
                                break;
                            }
                        }
                    }
                }
            }
            return result;
        }

        public findSceneComponents(klass:string, owner:BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light) : any[] {
            var result:BABYLON.SceneComponent[] = [];
            if (owner.metadata != null && owner.metadata.unity) {
                if (owner.metadata.components != null) {
                    var ownercomps:BABYLON.IScriptComponent[] = owner.metadata.components as BABYLON.IScriptComponent[];
                    if (ownercomps != null && ownercomps.length > 0) {
                        for (var ii:number = 0; ii < ownercomps.length; ii++) {
                            var ownerscript:BABYLON.IScriptComponent = ownercomps[ii];
                            if (ownerscript.instance != null && ownerscript.klass === klass) {
                                result.push(ownerscript.instance);
                            }
                        }
                    }
                }
            }
            return result;
        }

        public detroySceneComponents(owner:BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light) : void {
            if (owner.metadata != null && owner.metadata.unity) {
                if (owner.metadata.components != null) {
                    var ownercomps:BABYLON.IScriptComponent[] = owner.metadata.components as BABYLON.IScriptComponent[];
                    if (ownercomps != null && ownercomps.length > 0) {
                        ownercomps.forEach((ownerscript)=>{
                            if (ownerscript.instance != null) {
                                ownerscript.instance.disposer();
                                ownerscript.instance = null;
                            }
                        });
                    }
                }
            }
        }

        // ********************************** //
        // * Static Scene Component Support * //
        // ********************************** //

        public static hasSceneLoader():boolean {
            return (BABYLON.SceneManager.loader != null);
        }

        public static registerSceneLoader(handler:(root:string, name:string) => void):void {
            BABYLON.SceneManager.loader = handler;
        }

        public static parseSceneCameras(cameras: BABYLON.Camera[], scene:BABYLON.Scene, ticklist:BABYLON.IScriptComponent[]): void {
            if (cameras != null && cameras.length > 0) {
                cameras.forEach((camera)=>{
                    if (camera.metadata != null && camera.metadata.unity) {
                        if (camera.metadata.components != null) {
                            var cameracomps:BABYLON.IScriptComponent[] = camera.metadata.components as BABYLON.IScriptComponent[];
                            if (cameracomps != null && cameracomps.length > 0) {
                                cameracomps.forEach((camerascript)=>{
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
                    }
                });
            }
        }

        public static parseSceneLights(lights: BABYLON.Light[], scene:BABYLON.Scene, ticklist:BABYLON.IScriptComponent[]): void {
            if (lights != null && lights.length > 0) {
                lights.forEach((light)=>{
                    if (light.metadata != null && light.metadata.unity) {
                        if (light.metadata.components != null) {
                            var lightcomps:BABYLON.IScriptComponent[] = light.metadata.components as BABYLON.IScriptComponent[];
                            if (lightcomps != null && lightcomps.length > 0) {
                                lightcomps.forEach((lightscript)=>{
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
                    }
                });
            }
        }

        public static parseSceneMeshes(meshes: BABYLON.AbstractMesh[], scene:BABYLON.Scene, ticklist:BABYLON.IScriptComponent[]): void {
            if (meshes != null && meshes.length > 0) {
                meshes.forEach((mesh)=>{
                    if (mesh.metadata != null && mesh.metadata.unity) {
                        if (mesh.metadata.components != null) {
                            var meshcomps:BABYLON.IScriptComponent[] = mesh.metadata.components as BABYLON.IScriptComponent[];
                            if (meshcomps != null && meshcomps.length > 0) {
                                meshcomps.forEach((meshscript)=>{
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
                    }
                });
            }
        }

        // ********************************** //
        // * Private Class Creation Support * //
        // ********************************** //

        private static createComponentClass(klass:string):any {
            return BABYLON.SceneManager.createObjectFromString(klass, "function");
        }
        private static createObjectFromString(str:string, type:string):any {
            type = type || "object";  // can pass "function"
            var arr = str.split(".");
            var fn = (window || this);
            for (var i = 0, len = arr.length; i < len; i++) {
                try {
                    fn = fn[arr[i]];
                } catch(ex) {
                    break;
                }
            }
            if (typeof fn !== type) {
                fn = null;
                if (console.warn) console.warn(type + " not found: " + str);
                else console.log("Warning: " + type + " not found: " + str);
            }
            return  fn;
        }
    }

    // *********************************** //
    // * Managed Unity Game Object Proxy * //
    // *********************************** //

    export class UnityGameObject {
		public type:string;
		public objectId:string;
		public objectName:string;
		public tagName:string;
		public layerIndex:number;
		public layerName:string;
        private _properties:any = null;
        public constructor(propertyBag:any) {
            this._properties = propertyBag;
        }
        public getProperty<T>(name:string, defaultValue:T = null): T {
            var result:any = null
            if (this._properties != null) {
                result = this._properties[name];
            }
            if (result == null) result = defaultValue;
            return (result != null) ? result as T : null;
        }
    }

    // *********************************** //
    // * Managed Unity Scene File Loader * //
    // *********************************** //

    export class UnitySceneLoader implements BABYLON.ISceneLoaderPlugin {
        public extensions = ".babylon";
		public plugin : BABYLON.ISceneLoaderPlugin;

        public constructor() {
            this.plugin = <BABYLON.ISceneLoaderPlugin>BABYLON.SceneLoader.GetPluginForExtension(".babylon");        
        }

        public importMesh(meshesNames: any, scene: BABYLON.Scene, data: any, rootUrl: string, meshes: BABYLON.AbstractMesh[], particleSystems: BABYLON.ParticleSystem[], skeletons: BABYLON.Skeleton[]): boolean {
            const result:boolean = this.plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons);
            if (scene != null && scene.metadata != null && scene.metadata.unity) {
                var scenex:any = <any>scene;
                if (scenex.manager != null) {
                    var manager:BABYLON.SceneManager = scenex.manager as BABYLON.SceneManager;
                    var ticklist:BABYLON.IScriptComponent[] = [];
                    BABYLON.SceneManager.parseSceneMeshes(meshes, scene, ticklist);
                    if (ticklist.length > 0) {
                        ticklist.sort((left, right):number => {
                            if (left.order < right.order) return -1;
                            if (left.order > right.order) return 1; 
                            return 0;
                        });
                        ticklist.forEach((scriptComponent)=>{
                            scriptComponent.instance.register();
                        });
                    }
                } else {
                    var msg:string = "Import Mesh - No manager detected for current scene.";
                    if (console.warn) console.warn(msg);
                    else console.log("Warning: " + msg);
                }          
            }
            return true;
        }

        public load(scene: BABYLON.Scene, data: string, rootUrl: string): boolean {
			const result:boolean = this.plugin.load(scene, data, rootUrl);
            if (scene != null && scene.metadata != null && scene.metadata.unity) {
                var manager:BABYLON.SceneManager = new BABYLON.SceneManager(scene);
                (<any>scene).manager = manager;
                if (manager.controller != null) {
                     manager.controller.ready();
                }
            }
			return result;
        }
    }

    /* Register Managed Unity Scene Loader Plugin */
    BABYLON.SceneLoader.RegisterPlugin(new BABYLON.UnitySceneLoader());
}
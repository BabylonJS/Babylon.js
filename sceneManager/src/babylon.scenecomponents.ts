module BABYLON {

    export abstract class SceneComponent {
        public register: () => void = null;
        public dispose: () => void = null;
        public tick: boolean = false;

        private _engine: BABYLON.Engine = null;
        private _scene: BABYLON.Scene = null;
        private _before: () => void = null;
        private _after: () => void = null;
        private _started: boolean = false;
        private _initialized: boolean = false;
        private _properties: any = null;
        private _manager: BABYLON.SceneManager = null;
        private _owned: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light = null;

        public constructor(owner: BABYLON.AbstractMesh | BABYLON.Camera | BABYLON.Light, host: BABYLON.Scene, enableUpdate: boolean = true, propertyBag: any = {}) {
            if (owner == null) throw new Error("Null owner scene obejct specified.");
            if (host == null) throw new Error("Null host scene obejct specified.");
            this._owned = owner;
            this._started = false;
            this._manager = null;
            this._initialized = false;
            this._properties = propertyBag;
            this._engine = host.getEngine();
            this._scene = host;
            this.tick = enableUpdate;

            /* Scene Component Instance Handlers */
            var instance: BABYLON.SceneComponent = this;
            instance.register = function () { instance.registerInstance(instance); };
            instance._before = function () { instance.updateInstance(instance); };
            instance._after = function () { instance.afterInstance(instance); };
            instance.dispose = function () { instance.disposeInstance(instance); };
        }

        public get scene(): BABYLON.Scene { 
            return this._scene;
        }

        public get engine(): BABYLON.Engine { 
            return this._engine;
        }

        /* Scene Component Life Cycle Functions */
        public start(): void { }
        public update(): void { }
        public after(): void { }
        public destroy(): void { }

        /* Scene Component Helper Member Functions */
        public get manager(): BABYLON.SceneManager {
            if (this._manager == null) {
                this._manager = BABYLON.SceneManager.GetInstance(this.scene);
            }
            return this._manager;
        }
        public setProperty(name: string, propertyValue: any): void {
            if (this._properties != null) {
                this._properties[name] = propertyValue;
            }
        }
        public getProperty<T>(name: string, defaultValue: T = null): T {
            var result: any = null
            if (this._properties != null) {
                result = this._properties[name];
            }
            if (result == null) result = defaultValue;
            return (result != null) ? result as T : null;
        }
        public findComponent(klass: string): any {
            return this.manager.findSceneComponent(klass, this._owned);
        }
        public findComponents(klass: string): any[] {
            return this.manager.findSceneComponents(klass, this._owned);
        }
        public getOwnerMetadata(): BABYLON.ObjectMetadata {
            return this.manager.getObjectMetadata(this._owned);
        }

        /* Private Scene Component Instance Worker Functions */
        private registerInstance(instance: BABYLON.SceneComponent): void {
            instance.scene.registerBeforeRender(instance._before);
            instance.scene.registerAfterRender(instance._after);
        }
        private updateInstance(instance: BABYLON.SceneComponent): void {
            if (!instance._started) {
                /* First frame starts component */
                instance.start();
                instance._started = true;
            } else if (instance._started && instance.tick) {
                /* All other frames tick component */
                instance.update();
            }
        }
        private afterInstance(instance: BABYLON.SceneComponent): void {
            if (instance._started && instance.tick) {
                instance.after();
            }
        }
        private disposeInstance(instance: BABYLON.SceneComponent) {
            instance.scene.unregisterBeforeRender(instance._before);
            instance.scene.unregisterAfterRender(instance._after);
            instance.destroy();
            instance.tick = false;
            instance._before = null;
            instance._after = null;
            instance._started = false;
            instance._properties = null;
            instance._engine = null;
            instance._scene = null;
            instance._manager = null;
            instance.register = null;
            instance.dispose = null;
        }
    }

    export abstract class CameraComponent extends BABYLON.SceneComponent {
        private _camera: BABYLON.UniversalCamera;
        public constructor(owner: BABYLON.UniversalCamera, scene: BABYLON.Scene, enableUpdate: boolean = true, propertyBag: any = {}) {
            super(owner, scene, enableUpdate, propertyBag);
            this._camera = owner;
        }
        public get camera():BABYLON.UniversalCamera {
            return this._camera;
        }
    }

    export abstract class LightComponent extends BABYLON.SceneComponent {
        private _light: BABYLON.Light;
        public constructor(owner: BABYLON.Light, scene: BABYLON.Scene, enableUpdate: boolean = true, propertyBag: any = {}) {
            super(owner, scene, enableUpdate, propertyBag);
            this._light = owner;
        }
        public get light():BABYLON.Light {
            return this._light;
        }
    }

    export abstract class MeshComponent extends BABYLON.SceneComponent {
        private _mesh:BABYLON.AbstractMesh;
        public constructor(owner: BABYLON.AbstractMesh, scene: BABYLON.Scene, enableUpdate: boolean = true, propertyBag: any = {}) {
            super(owner, scene, enableUpdate, propertyBag);
            this._mesh = owner;
        }
        public get mesh():BABYLON.AbstractMesh {
            return this._mesh;
        }
    }

    export abstract class SceneController extends BABYLON.MeshComponent {
        public abstract ready(): void;
        public constructor(owner: BABYLON.AbstractMesh, scene: BABYLON.Scene, enableUpdate: boolean = true, propertyBag: any = {}) {
            super(owner, scene, enableUpdate, propertyBag);
        }
    }

    export class ObjectMetadata {
        public get type(): string {
            return this._metadata.type;
        }
        public get objectId(): string {
            return this._metadata.objectId;
        }
        public get objectName(): string {
            return this._metadata.objectName;
        }
        public get tagName(): string {
            return this._metadata.tagName;
        }
        public get layerIndex(): number {
            return this._metadata.layerIndex;
        }
        public get layerName(): string {
            return this._metadata.layerName;
        }
        public get areaIndex(): number {
            return this._metadata.areaIndex;
        }
        public get navAgent(): BABYLON.INavigationAgent {
            return this._metadata.navAgent;
        }
        public get meshLink(): BABYLON.INavigationLink {
            return this._metadata.meshLink;
        }
        public get meshObstacle(): BABYLON.INavigationObstacle {
            return this._metadata.meshObstacle;
        }
        private _metadata: IObjectMetadata = null;
        public constructor(data: IObjectMetadata) {
            this._metadata = data;
        }
        public setProperty(name: string, propertyValue: any): void {
            if (this._metadata.properties != null) {
                this._metadata.properties[name] = propertyValue;
            }
        }
        public getProperty<T>(name: string, defaultValue: T = null): T {
            var result: any = null
            if (this._metadata.properties != null) {
                result = this._metadata.properties[name];
            }
            if (result == null) result = defaultValue;
            return (result != null) ? result as T : null;
        }
    }

    export enum GamepadType {
        None = -1,
        Generic = 0,
        Xbox360 = 1
    }

    export enum Xbox360Trigger {
        Left = 0,
        Right = 1
    }

    export enum UserInputPointer {
        Left = 0,
        Middle = 1,
        Right = 2
    }

    export enum UserInputAxis {
        Horizontal = 0,
        Vertical = 1,
        ClientX = 2,
        ClientY = 3,
        MouseX = 4,
        MouseY = 5
    }

    export enum UserInputKey {
        Backspace = 8,
        Tab = 9,
        Enter = 13,
        Shift = 16,
        Ctrl = 17,
        Alt = 18,
        Pause = 19,
        Break = 19,
        CapsLock = 20,
        Escape = 27,
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

    export type UserInputAction = (index: number) => void;

    export interface UserInputPress {
        index: number;
        action: () => void;
    }

    export interface IScriptComponent {
        order: number;
        name: string;
        klass: string;
        update: boolean;
        controller: boolean;
        properties: any;
        instance: BABYLON.SceneComponent;
        tag: any;
    }

    export interface INavigationArea {
        index: number;
        area: string;
        cost: number;
    }

    export interface INavigationAgent {
        name: string;
        radius: number;
        height: number;
        speed: number;
        acceleration: number;
        angularSpeed: number;
        areaMask: number;
        autoBraking: boolean;
        autoTraverseOffMeshLink: boolean;
        avoidancePriority: number;
        baseOffset: number;
        obstacleAvoidanceType: string;
        stoppingDistance: number;
    }

    export interface INavigationLink {
        name: string;
        activated: boolean;
        area: number;
        autoUpdatePositions: boolean;
        biDirectional: boolean;
        costOverride: number;
        occupied: boolean;
        start: any;
        end: any;
    }

    export interface INavigationObstacle {
        name: string;
        carving: boolean;
        carveOnlyStationary: boolean;
        carvingMoveThreshold: number;
        carvingTimeToStationary: number;
        shap: string;
        radius: number;
        center: number[];
        size: number[];
    }

    export interface IObjectTransform {
        position: BABYLON.Vector3;
        rotation: BABYLON.Vector3;
        scale: BABYLON.Vector3;
    }

    export interface IObjectMetadata {
        api: boolean;
        type: string;
        objectName: string;
        objectId: string;
        tagName: string;
        layerIndex: number;
        layerName: string;
        areaIndex: number;
        navAgent: BABYLON.INavigationAgent;
        meshLink: BABYLON.INavigationLink;
        meshObstacle: BABYLON.INavigationObstacle;
        components: BABYLON.IScriptComponent[];
        properties: any;
    }

    export class UserInputOptions {
        public static PointerAngularSensibility: number = 10.0;
        public static GamepadDeadStickValue: number = 0.25;
        public static GamepadLStickXInverted: boolean = false;
        public static GamepadLStickYInverted: boolean = false;
        public static GamepadRStickXInverted: boolean = false;
        public static GamepadRStickYInverted: boolean = false;
        public static GamepadAngularSensibility = 1.0;
        public static GamepadMovementSensibility = 1.0;
    }
}

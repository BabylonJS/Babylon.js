declare namespace PROJECT {
    /**
     * Babylon network entity (Colyseus Universal Game Room)
     * @class ColyseusGameServer - All rights reserved (c) 2020 Mackey Kinard
    */
    class ColyseusGameServer extends UNITY.ScriptComponent {
        static MAX_FRAME_RATE: number;
        projectName: string;
        autoJoinRoom: boolean;
        playerUserName: string;
        defaultRoomName: string;
        roomLogicModule: string;
        maxClientsAllowed: number;
        patchUpdateRateFps: number;
        roomSimulateRateFps: number;
        networkBufferingTime: number;
        private soloSession;
        private colyseusAvailable;
        private networkRoomConnected;
        private hostSessionName;
        private joinRoomId;
        private client;
        private static StaticInstance;
        static get Instance(): PROJECT.ColyseusGameServer;
        isSoloSession(): boolean;
        isHostSession(): boolean;
        getColyseusClient(): Colyseus.Client;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected awake(): void;
        protected update(): void;
        protected destroy(): void;
        joinRoom(): Promise<void>;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class ColyseusNetworkAvatar
    */
    class ColyseusNetworkAvatar extends UNITY.ScriptComponent implements UNITY.IAssetPreloader {
        static FONT_PADDING: number;
        static HEIGHT_PADDING: number;
        private controlMode;
        private defaultAvatar;
        private maleAnimationRig;
        private femaleAnimationRig;
        private castRealtimeShadow;
        private disposeOfMannequin;
        private pixelOffsetX;
        private pixelOffsetY;
        private playerJoined;
        private preloadLocation;
        private ambientMaterial;
        private avatarArmature;
        private avatarSkeleton;
        private avatarHandness;
        private avatarGender;
        private avatarLabel;
        private avatarLoaded;
        private animator;
        private avatarReady;
        manageLabelTexture: boolean;
        textureResolution: number;
        maxLabelWidth: number;
        minLabelWidth: number;
        labelOffsetX: number;
        labelOffsetY: number;
        labelHeight: number;
        labelColor: BABYLON.Color3;
        labelAlpha: number;
        rectColor: BABYLON.Color3;
        rectAlpha: number;
        fontFamily: string;
        fontStyle: string;
        fontSize: number;
        fillRect: boolean;
        protected awake(): void;
        protected ready(): void;
        protected update(): void;
        protected destroy(): void;
        private isSafariBrowser;
        private createAvatarLabel;
        private createRoundedRect;
        private getResizedFontString;
        private setupLocalPlayerAvatar;
        private setupRemotePlayerAvatar;
        private configurePlayerAvatarRig;
        /** Load runtime player avatar from specfied location */
        private loadRuntimePlayerAvatar;
        /** Add asset preloader tasks (https://doc.babylonjs.com/divingDeeper/importers/assetManager) */
        addPreloaderTasks(assetsManager: UNITY.PreloadAssetsManager): void;
    }
}
declare namespace PROJECT {
    /**
     * Babylon network entity (Colyseus Universal Game Room)
     * @class ColyseusNetworkEntity - All rights reserved (c) 2020 Mackey Kinard
     */
    class ColyseusNetworkEntity extends UNITY.ScriptComponent {
        autoCreate: boolean;
        remotePrefab: string;
        assetContainer: string;
        movementEpsilon: number;
        movementMethod: BABYLON.EntityMovementType;
        interpolationMode: BABYLON.EntityInterpolation;
        interpolationHandler: string;
        syncTransformNode: boolean;
        runtimeAttributes: BABYLON.EntityAttribute[];
        private creationAttributes;
        private bufferedAttributes;
        private networkEntityCreated;
        protected update(): void;
        protected destroy(): void;
        createEntity(): void;
    }
}
declare namespace BABYLON {
    type UniversalGameRoom = Colyseus.Room<BABYLON.IColyseusRoomState>;
    enum RemoteFunctionCallTarget {
        All = 0,
        Others = 1
    }
    enum NetworkEntityType {
        None = 0,
        Local = 1,
        Remote = 2
    }
    enum EntityMovementType {
        ClientAuthority = 0,
        ServerAuthority = 1
    }
    enum EntityInterpolation {
        Default = 0,
        Hermite = 1,
        Custom = 2
    }
    class EntityAttribute {
        key: string;
        value: string;
    }
    /**
     * Babylon network management system class (Colyseus Universal Game Room)
     * Supports network users, entities, attributes, remote function calls, custom messages, custom methods and custom room logic modules.
     * @class NetworkManager - All rights reserved (c) 2020 Mackey Kinard
     */
    class NetworkManager {
        private static RootNode;
        private static DefaultRoom;
        private static UserReference;
        private static NetworkServerTime;
        private static NetworkEntityQueue;
        private static CustomHandlerMap;
        private static SendPositionBuffer;
        private static SendRotationBuffer;
        private static SendLinearBuffer;
        private static SendAngularBuffer;
        static SceneReference: BABYLON.Scene;
        static InterpolationBuffer: number;
        static OnConnectObservable: Observable<IColyseusNetworkUser>;
        static OnDisconnectObservable: Observable<IColyseusNetworkUser>;
        static OnJoinRoomObservable: Observable<IColyseusNetworkUser>;
        static OnLeaveRoomObservable: Observable<number>;
        static OnCreateEntityObservable: Observable<IColyseusNetworkEntity>;
        static OnRemoveEntityObservable: Observable<IColyseusNetworkEntity>;
        static OnChatMessageObservable: Observable<IColyseusChatMessage>;
        static OnPingReceivedObservable: Observable<any>;
        static OnErrorMessageObservable: Observable<UNITY.RoomErrorMessage>;
        static OnRemoteProcedureCallObservable: Observable<any>;
        static RegisterCustomInterpolationHandler(name: string, handler: (entity: BABYLON.IColyseusNetworkEntity, transform: BABYLON.TransformNode, deltaTime: number) => void): void;
        /** Is the colyseus network library is available */
        static IsAvailable(): boolean;
        /** Is the default universal game room attached to the scene */
        static IsRoomAttached(): boolean;
        /** Has client received a join room confirmation message from the default universal game room */
        static HasJoinedRoom(): boolean;
        /** Gets the current user in the default universal game room */
        static GetCurrentUser(): BABYLON.IColyseusNetworkUser;
        /** Gets the attached default universal game room */
        static GetDefaultRoom(): BABYLON.UniversalGameRoom;
        /** Gets the network server time of the attached default universal game room (Seconds) */
        static GetNetworkTime(): number;
        /** Is local network entity */
        static IsLocalNetworkEntity(entity: BABYLON.TransformNode): boolean;
        /** Is remote network entity */
        static IsRemoteNetworkEntity(entity: BABYLON.TransformNode): boolean;
        /** Gets the network entity type */
        static GetNetworkEntityType(entity: BABYLON.TransformNode): number;
        /** Attaches default universal game room to the specified scene */
        static AttachDefaultRoom(scene: BABYLON.Scene, room: BABYLON.UniversalGameRoom): void;
        /** Detaches default universal game room from the scene */
        static DetachDefaultRoom(): void;
        /** Gets a network user in the default universal game room */
        static GetNetworkUser(id: string): BABYLON.IColyseusNetworkUser;
        /** Gets a network entity in the default universal game room */
        static GetNetworkEntity(id: string): BABYLON.IColyseusNetworkEntity;
        /** Creates a network entity in the default universal game room */
        static CreateNetworkEntity(localTransform: BABYLON.TransformNode, remotePrefab: string, assetContainer: string, movementEpsilon: number, movementType: BABYLON.EntityMovementType, interpolationMode: BABYLON.EntityInterpolation, autoSyncTransform: boolean, customHandlerName: string, bufferedAttributes: any, createAttributes?: any): void;
        /** Removes a network entity from the default universal game room */
        static RemoveNetworkEntity(entityId: string): void;
        /** Sets a user attribute on the default universal game room */
        static SetUserAttributes(userId: string, attributesToSet: any): void;
        /** Sets a entity attribute on the default universal game room */
        static SetEntityAttributes(entityId: string, attributesToSet: any): void;
        /** Calls a custom server method on the default universal game room */
        static CallCustomMethod(method: string, ...args: any[]): void;
        /** Executs a remote function call on the default universal game room */
        static ExecuteRemoteFunctionCall(target: BABYLON.RemoteFunctionCallTarget, entityId: string, func: string, ...args: any[]): void;
        /** Gets the current chat message queue items for the default universal game room */
        static GetChatMessages(): BABYLON.IColyseusChatMessage[];
        /** Send a chat message to the default universal game room */
        static SendChatMessage(message: string): void;
        private static OnSceneBeforeRenderUpdate;
        private static OnDispatchChatQueueMessages;
        private static ProcessNetworkEntities;
        private static SendDataPacketToServer;
        private static UpdateRemoteEntity;
        private static CreateNetworkPacketData;
        private static JoinDefaultRoomHandler;
        private static AddNetworkEntityHandler;
        private static ProcessNetworkEntityHandler;
        private static ProcessRemoteEntityChanges;
        private static RemoveNetworkEntityHandler;
    }
    /**
     * Babylon universal game room controller (Colyseus Universal Game Room)
     * Supports network users, entities, attributes, remote function calls, custom messages, custom methods and custom room logic modules.
     * @class RoomController - All rights reserved (c) 2020 Mackey Kinard
     */
    class RoomController {
        static SendPing(room: BABYLON.UniversalGameRoom): void;
        static SendChat(room: BABYLON.UniversalGameRoom, message: string): void;
        static CallCustomMethod(room: BABYLON.UniversalGameRoom, method: string, ...args: any[]): void;
        static SetUserAttributes(room: BABYLON.UniversalGameRoom, userId: string, attributesToSet: any): void;
        static SetEntityAttributes(room: BABYLON.UniversalGameRoom, entityId: string, attributesToSet: any): void;
        static CreateNetworkEntity(room: BABYLON.UniversalGameRoom, ownerName: string, localTransform: BABYLON.TransformNode, remotePrefab: string, assetContainer: string, movementEpsilon: number, movementType: BABYLON.EntityMovementType, interpolationMode: BABYLON.EntityInterpolation, autoSyncTransform: boolean, customHandlerName: string, bufferedAttributes: any, createAttributes?: any): void;
        static RemoveNetworkEntity(room: BABYLON.UniversalGameRoom, entityId: string): void;
        static ExecuteRemoteFunctionCall(room: BABYLON.UniversalGameRoom, target: BABYLON.RemoteFunctionCallTarget, entityId: string, func: string, ...args: any[]): void;
    }
    /**
     * Network support classes and interfaces (Colyseus Universal Game Room)
     * Supports network users, entities, attributes, remote function calls, custom messages, custom methods and custom room logic modules.
     */
    interface IColyseusNetworkEntity {
        id: string;
        ownerId: string;
        creationId: string;
        timestamp: number;
        attributes: Map<string, string>;
        xPos: number;
        yPos: number;
        zPos: number;
        xRot: number;
        yRot: number;
        zRot: number;
        wRot: number;
        xVel: number;
        yVel: number;
        zVel: number;
        xAng: number;
        yAng: number;
        zAng: number;
        aux00: number;
        aux01: number;
        aux02: number;
        aux03: number;
        aux04: number;
        aux05: number;
        aux06: number;
        aux07: number;
        aux08: number;
        aux09: number;
        aux10: number;
        aux11: number;
        aux12: number;
        aux13: number;
        aux14: number;
        aux15: number;
        aux16: number;
        aux17: number;
        aux18: number;
        aux19: number;
        speed: number;
    }
    interface IColyseusNetworkUser {
        id: string;
        name: string;
        sessionId: string;
        connected: boolean;
        timestamp: number;
        attributes: Map<string, string>;
    }
    interface IColyseusChatMessage {
        sessionId: string;
        name: string;
        message: string;
        timestamp: number;
    }
    interface IColyseusChatQueue {
        messages: BABYLON.IColyseusChatMessage[];
    }
    interface IColyseusRoomState {
        entities: Map<string, BABYLON.IColyseusNetworkEntity>;
        users: Map<string, BABYLON.IColyseusNetworkUser>;
        queue: Map<string, BABYLON.IColyseusChatQueue>;
        attributes: Map<string, string>;
    }
    /**
     * Network Interpolation Buffer
     * https://github.com/virbela/buffered-interpolation
     */
    enum BufferState {
        INITIALIZING = 0,
        BUFFERING = 1,
        PLAYING = 2
    }
    enum BufferMode {
        MODE_LERP = 0,
        MODE_HERMITE = 1
    }
    interface frame {
        position: Vector3;
        velocity: Vector3;
        scale: Vector3;
        quaternion: Quaternion;
        aux00: number;
        aux01: number;
        aux02: number;
        aux03: number;
        aux04: number;
        aux05: number;
        aux06: number;
        aux07: number;
        aux08: number;
        aux09: number;
        aux10: number;
        aux11: number;
        aux12: number;
        aux13: number;
        aux14: number;
        aux15: number;
        aux16: number;
        aux17: number;
        aux18: number;
        aux19: number;
        speed: number;
        time: number;
    }
    class InterpolationBuffer {
        state: BufferState;
        mode: BufferMode;
        buffer: frame[];
        originFrame: frame;
        position: Vector3;
        scale: Vector3;
        quaternion: Quaternion;
        aux00: number;
        aux01: number;
        aux02: number;
        aux03: number;
        aux04: number;
        aux05: number;
        aux06: number;
        aux07: number;
        aux08: number;
        aux09: number;
        aux10: number;
        aux11: number;
        aux12: number;
        aux13: number;
        aux14: number;
        aux15: number;
        aux16: number;
        aux17: number;
        aux18: number;
        aux19: number;
        speed: number;
        time: number;
        bufferTime: number;
        bufferAttribs: any;
        getPosition(): Vector3;
        getQuaternion(): Quaternion;
        getScale(): Vector3;
        constructor(mode?: BufferMode, bufferTime?: number, bufferAttribs?: any);
        hermiteToolkit(target: Vector3, t: number, p1: Vector3, p2: Vector3, v1: Vector3, v2: Vector3): void;
        hermiteBabylon(target: Vector3, t: number, p1: Vector3, p2: Vector3, v1: Vector3, v2: Vector3): void;
        hermiteLegacy(target: Vector3, t: number, p1: Vector3, p2: Vector3, v1: Vector3, v2: Vector3): void;
        lerp(target: Vector3, v1: Vector3, v2: Vector3, alpha: number): void;
        slerp(target: Quaternion, r1: Quaternion, r2: Quaternion, alpha: number): void;
        updateOriginFrameToBufferTail(): void;
        appendBuffer(position?: Vector3, velocity?: Vector3, quaternion?: Quaternion, scale?: Vector3, aux00?: number, aux01?: number, aux02?: number, aux03?: number, aux04?: number, aux05?: number, aux06?: number, aux07?: number, aux08?: number, aux09?: number, aux10?: number, aux11?: number, aux12?: number, aux13?: number, aux14?: number, aux15?: number, aux16?: number, aux17?: number, aux18?: number, aux19?: number, speed?: number): void;
        update(delta: number): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class AutoBodyGarage
    */
    class AutoBodyGarage extends UNITY.ScriptComponent {
        private m_bodyMaterial;
        private m_bodyAbtractMesh;
        protected awake(): void;
        setupVehicleMaterials(bodyColor: BABYLON.Color3, wheelColor?: BABYLON.Color3, wheelType?: number, decalIndex?: number): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class CheckpointManager
    */
    class CheckpointManager extends UNITY.ScriptComponent {
        private checkPointList;
        private checkPointCount;
        private checkPointIndex;
        private nextCheckPoint;
        private startRaceTime;
        private totalRaceTime;
        private lapNumber;
        private lapTimer;
        private lapTimes;
        private playerID;
        private playerName;
        private raceOver;
        register(id: number, name: string): void;
        getLapTimes(): number[];
        getLapNumber(): number;
        getCheckPoint(): number;
        getPlayerName(): string;
        getPlayerID(): number;
        getRaceTime(): number;
        getRaceOver(): boolean;
        protected start(): void;
        private nextCheckPointName;
        protected update(): void;
        protected late(): void;
        startRaceTimer(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class NetworkCarPrediction
    */
    class NetworkCarPrediction extends UNITY.ScriptComponent {
        private autoRegister;
        private handlerName;
        private extrapolateTimeMs;
        protected awake(): void;
        register(): void;
        private HandleUpdate;
        private LegacyHandleUpdate;
    }
}
declare namespace PROJECT {
    interface ITrackNode {
        radius: number;
        position: UNITY.IUnityVector3;
        rotation: UNITY.IUnityVector4;
        localPosition: BABYLON.Vector3;
        localRotation: BABYLON.Quaternion;
        localDistance: number;
    }
    interface IControlPoint {
        speed: number;
        tvalue: number;
        position: UNITY.IUnityVector3;
    }
    class RoutePoint {
        position: BABYLON.Vector3;
        direction: BABYLON.Vector3;
    }
    class PlayerRaceStats {
        id: number;
        name: string;
        position: number;
    }
    /**
    * Babylon Script Component
    * @class BT_RaceTrackManager
    */
    class RaceTrackManager extends UNITY.ScriptComponent {
        static TrackLength: number;
        static TotalLapCount: number;
        static WinnerTransform: BABYLON.TransformNode;
        private static CheckPointTag;
        private static CheckPointList;
        private static LeaderBoardList;
        private static PlayerVehicleList;
        private trackNodes;
        private raceLineData_1;
        private raceLineData_2;
        private raceLineData_3;
        private raceLineData_4;
        private raceLineData_5;
        private raceLineColor_1;
        private raceLineColor_2;
        private raceLineColor_3;
        private raceLineColor_4;
        private raceLineColor_5;
        private debugMeshLines_1;
        private debugMeshLines_2;
        private debugMeshLines_3;
        private debugMeshLines_4;
        private debugMeshLines_5;
        private p0n;
        private p1n;
        private p2n;
        private p3n;
        private i;
        private static _EventBus;
        static get Bus(): UNITY.EventMessageBus;
        drawDebugLines: boolean;
        getTrackNodes(): PROJECT.ITrackNode[];
        getControlPoints(line: number): PROJECT.IControlPoint[];
        protected awake(): void;
        protected start(): void;
        protected after(): void;
        protected destroy(): void;
        getRoutePoint(distance: number): PROJECT.RoutePoint;
        getRoutePointToRef(distance: number, result: PROJECT.RoutePoint): void;
        getRoutePosition(distance: number): BABYLON.Vector3;
        getRoutePositionToRef(distance: number, result: BABYLON.Vector3): void;
        /** Gets the checkpoint tag identifier */
        static GetCheckpointTag(): string;
        /** Get the checkpoint position list */
        static GetCheckpointList(): BABYLON.AbstractMesh[];
        /** Get the total number of checkpoints */
        static GetCheckpointCount(): number;
        /** Calculates the fraction distance to next checkpoint */
        private static GetCheckpointDistance;
        /** Register vehicle with track manager */
        static RegisterVehicle(vehicle: BABYLON.TransformNode): void;
        /** Gets the registered player vehicles */
        static GetPlayerVehicles(): BABYLON.TransformNode[];
        /** Register player with track manager */
        static RegisterPlayer(id: number, name: string): void;
        /** Update player leaderboard information */
        static UpdateLeaderboard(id: number, lap: number, checkpoint: number, position: BABYLON.Vector3): void;
        /** Get player leaderboard position */
        static GetLeaderboardPosition(id: number): number;
        /** Get leaderboard position list */
        static GetLeaderboardPositionList(): PROJECT.PlayerRaceStats[];
        /** Sort leaderboard position list */
        private static SortLeaderboardPositionList;
    }
}
declare namespace PROJECT {
    /**
     * Babylon remote vehicle controller class (Colyseus Universal Game Room)
    * @class RemoteCarController
    */
    class RemoteCarController extends UNITY.ScriptComponent {
        private static ShowSensorLines;
        centerOfMass: number;
        burnoutWheelPitch: number;
        linkTrackManager: boolean;
        playVehicleSounds: boolean;
        smokeTexture: BABYLON.Texture;
        skidThreashold: number;
        smokeIntensity: number;
        wheelDrawVelocity: number;
        smokeOpacity: number;
        smokeDonuts: number;
        private steeringWheelHub;
        private steeringWheelAxis;
        private maxSteeringAngle;
        private maxSteeringSpeed;
        private _animator;
        private _engineAudioSource;
        private _skidAudioSource;
        private brakeLightsMesh;
        private brakeLightsTrans;
        private reverseLightsMesh;
        private reverseLightsTrans;
        private frontLeftWheelTrans;
        private frontRightWheelTrans;
        private backLeftWheelTrans;
        private backRightWheelTrans;
        private frontLeftWheelMesh;
        private frontRightWheelMesh;
        private backLeftWheelMesh;
        private backRightWheelMesh;
        private frontLeftWheelEmitter;
        private frontRightWheelEmitter;
        private backLeftWheelEmitter;
        private backRightWheelEmitter;
        private frontLeftWheelParticle;
        private frontRightWheelParticle;
        private backLeftWheelParticle;
        private backRightWheelParticle;
        private frontLeftContact;
        private frontRightContact;
        private rearLeftContact;
        private rearRightContact;
        private frontLeftContactTag;
        private frontRightContactTag;
        private rearLeftContactTag;
        private rearRightContactTag;
        private frontLeftContactPoint;
        private frontRightContactPoint;
        private rearLeftContactPoint;
        private rearRightContactPoint;
        private frontLeftContactNormal;
        private frontRightContactNormal;
        private rearLeftContactNormal;
        private rearRightContactNormal;
        private frontLeftSensorLine;
        private frontRightSensorLine;
        private rearLeftSensorLine;
        private rearRightSensorLine;
        private startRaycastPosition;
        private endRaycastPosition;
        private smokeIntensityFactor;
        private downDirection;
        private downDistance;
        private lastPitch;
        private lastBrake;
        private lastReverse;
        private lastBurnout;
        private lastSteering;
        private lastSKID_FL;
        private lastSKID_FR;
        private lastSKID_RL;
        private lastSKID_RR;
        private lastSPIN_FL;
        private lastSPIN_FR;
        private lastSPIN_RL;
        private lastSPIN_RR;
        private PITCH_FL;
        private PITCH_FR;
        private PITCH_RL;
        private PITCH_RR;
        private WHEEL_SKID_PITCH;
        getFrontLeftWheelContact(): boolean;
        getFrontRightWheelContact(): boolean;
        getRearLeftWheelContact(): boolean;
        getRearRightWheelContact(): boolean;
        getFrontLeftWheelContactTag(): string;
        getFrontRightWheelContactTag(): string;
        getRearLeftWheelContactTag(): string;
        getRearRightWheelContactTag(): string;
        getFrontLeftWheelContactPoint(): BABYLON.Vector3;
        getFrontRightWheelContactPoint(): BABYLON.Vector3;
        getRearLeftWheelContactPoint(): BABYLON.Vector3;
        getRearRightWheelContactPoint(): BABYLON.Vector3;
        getFrontLeftWheelContactNormal(): BABYLON.Vector3;
        getFrontRightWheelContactNormal(): BABYLON.Vector3;
        getRearLeftWheelContactNormal(): BABYLON.Vector3;
        getRearRightWheelContactNormal(): BABYLON.Vector3;
        protected m_frontLeftWheelSkid: number;
        protected m_frontRightWheelSkid: number;
        protected m_backLeftWheelSkid: number;
        protected m_backRightWheelSkid: number;
        protected m_velocityOffset: BABYLON.Vector3;
        protected m_linearVelocity: BABYLON.Vector3;
        protected m_lastPosition: BABYLON.Vector3;
        protected m_positionCenter: BABYLON.Vector3;
        protected m_scaledVelocity: number;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected destroy(): void;
        protected updateVehicleProperties(): void;
        private castWheelContactRays;
        private createSmokeParticleSystem;
    }
}
declare namespace PROJECT {
    /**
     * Babylon skidmark section class (Native Bullet Physics 2.82)
     * @class SkidMarkSection
     */
    class SkidMarkSection {
        Pos: BABYLON.Vector3;
        Normal: BABYLON.Vector3;
        Tangent: BABYLON.Vector4;
        Posl: BABYLON.Vector3;
        Posr: BABYLON.Vector3;
        Intensity: number;
        LastIndex: number;
    }
    /**
     * Babylon Script Component
     * @class SkidMarkManager
     */
    class SkidMarkManager extends UNITY.ScriptComponent {
        private static MAX_MARKS;
        private static GROUND_OFFSET;
        private static GPU_TRIANGLES;
        private static MARK_COLOR;
        private static MARK_WIDTH;
        private static TEX_INTENSITY;
        private static MIN_DISTANCE;
        private static MIN_SQR_DISTANCE;
        private static TEXTURE_MARKS;
        private static SkidBufferPositions;
        private static SkidBufferNormals;
        private static SkidBufferTangents;
        private static SkidBufferColors;
        private static SkidBufferUvs;
        private static SkidBufferIndices;
        private static SkidMarkSections;
        private static SkidMarkIndex;
        private static SkidMarkMesh;
        private static SkidMarkUpdated;
        private static TempVector3_POS;
        private static TempVector3_DIR;
        private static TempVector3_XDIR;
        private static TempVector3_SDIR;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected start(): void;
        protected update(): void;
        static AddSkidMarkSegment(pos: BABYLON.Vector3, normal: BABYLON.Vector3, intensity: number, lastIndex: number): BABYLON.Nullable<number>;
        private static CreateSkidMarkManager;
        private static AddSkidMarkVertexData;
        private static UpdateSkidMarkManager;
    }
}
declare namespace PROJECT {
    /**
     * Babylon standard rigidbody vehicle controller class (Native Bullet Physics 2.82)
     * @class StandardCarController
     */
    class StandardCarController extends UNITY.ScriptComponent {
        static DEFAULT_SPEED_FACTOR: number;
        static DEFAULT_PITCH_FACTOR: number;
        MIN_RPM: number;
        MAX_RPM: number;
        private _animator;
        private _rigidbody;
        private _engineAudioSource;
        private _skidAudioSource;
        private steeringWheelHub;
        private steeringWheelAxis;
        private maxSteeringAngle;
        private maxSteeringSpeed;
        private gearIndex;
        private downShift;
        private skiddingTime;
        private shiftingTime;
        private shiftingBrake;
        private engineForce;
        private handBraking;
        private linearDamping;
        private angularDamping;
        private forwardSpeed;
        private absoluteSpeed;
        private americanSpeed;
        private gradientSpeed;
        private frontWheelPower;
        private backWheelPower;
        private wheelBrakingForce;
        private enginePitchLevel;
        private smokeIntensityFactor;
        private raycastVehicle;
        private brakeLightsMesh;
        private brakeLightsTrans;
        private reverseLightsMesh;
        private reverseLightsTrans;
        private frontLeftWheelTrans;
        private frontRightWheelTrans;
        private backLeftWheelTrans;
        private backRightWheelTrans;
        private frontLeftWheelMesh;
        private frontRightWheelMesh;
        private backLeftWheelMesh;
        private backRightWheelMesh;
        private frontLeftWheelEmitter;
        private frontRightWheelEmitter;
        private backLeftWheelEmitter;
        private backRightWheelEmitter;
        private frontLeftWheelParticle;
        private frontRightWheelParticle;
        private backLeftWheelParticle;
        private backRightWheelParticle;
        private frontLeftWheelCollider;
        private frontRightWheelCollider;
        private backLeftWheelCollider;
        private backRightWheelCollider;
        private engineTorqueCurve;
        private physicsSteerAngleL;
        private physicsSteerAngleR;
        private visualSteerAngleL;
        private visualSteerAngleR;
        private visualSteerBoostL;
        private visualSteerBoostR;
        private wheelRadius;
        private clutchSlip;
        private engineRPM;
        private pitchRPM;
        private shiftRPM;
        private SKID_FL;
        private SKID_FR;
        private SKID_RL;
        private SKID_RR;
        private PITCH_FL;
        private PITCH_FR;
        private PITCH_RL;
        private PITCH_RR;
        private FRONT_LEFT;
        private FRONT_RIGHT;
        private BACK_LEFT;
        private BACK_RIGHT;
        private WHEEL_SKID_PITCH;
        private SPIN_FL_Rotation;
        private SPIN_FR_Rotation;
        private SPIN_RL_Rotation;
        private SPIN_RR_Rotation;
        getFootBraking(): boolean;
        getHandBraking(): boolean;
        getLinearVelocity(): BABYLON.Vector3;
        getCurrentForward(): number;
        getCurrentTurning(): number;
        getCurrentSkidding(): boolean;
        getCurrentDonuts(): boolean;
        getReverseThrottle(): boolean;
        getEnginePitchLevel(): number;
        getCurrentBurnout(): boolean;
        getFrontLeftSkid(): number;
        getFrontRightSkid(): number;
        getBackLeftSkid(): number;
        getBackRightSkid(): number;
        getWheelSkidPitch(): number;
        getRigidbodyPhysics(): UNITY.RigidbodyPhysics;
        getRaycastVehicle(): UNITY.RaycastVehicle;
        getGradientSpeed(): number;
        getForwardSpeed(): number;
        getAbsoluteSpeed(): number;
        getAmericanSpeed(): number;
        getNormalizedSpeed(): number;
        getTopEngineSpeed(): number;
        getMaxReversePower(): number;
        getCurrentGearIndex(): number;
        getCurrentEngineRPM(): number;
        getCurrentEngineForce(): number;
        getCurrentEnginePitch(): number;
        getGearShiftRatioCount(): number;
        getSmokeTextureMask(): BABYLON.Texture;
        getBrakeLightsMesh(): BABYLON.TransformNode;
        getReverseLightsMesh(): BABYLON.TransformNode;
        getFrontLeftWheelNode(): BABYLON.TransformNode;
        getFrontRightWheelNode(): BABYLON.TransformNode;
        getBackLeftWheelNode(): BABYLON.TransformNode;
        getBackRightWheelNode(): BABYLON.TransformNode;
        getWheelBurnoutEnabled(): boolean;
        getWheelDonutsEnabled(): boolean;
        getCurrentDonutSpinTime(): number;
        getSmokeIntensityFactor(): number;
        getWheelVelocityOffset(): BABYLON.Vector3;
        smokeTexture: BABYLON.Texture;
        skidThreashold: number;
        wheelDrawVelocity: number;
        smokeIntensity: number;
        smokeOpacity: number;
        smokeDonuts: number;
        maxBurnoutFactor: number;
        maxSteerBoost: number;
        overSteerSpeed: number;
        overSteerTimeout: number;
        topEngineSpeed: number;
        powerCoefficient: number;
        frictionLerpSpeed: number;
        topSpeedDampener: number;
        lowSpeedSteering: number;
        highSpeedSteering: number;
        stableGravityFactor: number;
        smoothFlyingForce: number;
        transmissionRatio: number;
        differentialRatio: number;
        maxFrontBraking: number;
        maxReversePower: number;
        minBrakingForce: number;
        maxBrakingForce: number;
        handBrakingForce: number;
        handBrakingTimer: number;
        linearBrakingForce: number;
        angularBrakingForce: number;
        burnoutFrictionSlip: number;
        burnoutTimeDelay: number;
        burnoutWheelPitch: number;
        burnoutCoefficient: number;
        burnoutTriggerMark: number;
        enableBurnouts: boolean;
        penaltyGroundTag: string;
        minPenaltySpeed: number;
        linearWheelDrag: number;
        frictionWheelSlip: number;
        showSensorLines: boolean;
        linkTrackManager: boolean;
        playVehicleSounds: boolean;
        postNetworkAttributes: boolean;
        wheelDriveType: number;
        gearBoxMultiplier: number;
        gearBoxMaxPitching: number;
        gearBoxShiftChange: number;
        gearBoxShiftDelay: number;
        gearBoxShiftRatios: number[];
        gearBoxShiftRanges: number[];
        throttleBrakingForce: number;
        throttleEngineSpeed: number;
        brakeRecoveryDelay: number;
        brakeRecoverySpeed: number;
        skidRecoverySpeed: number;
        burnoutLerpSpeed: number;
        ackermanWheelBase: number;
        ackermanRearTrack: number;
        ackermanTurnRadius: number;
        ackermanTurnFactor: number;
        protected m_frontLeftWheel: UNITY.HavokWheelInfo;
        protected m_frontRightWheel: UNITY.HavokWheelInfo;
        protected m_backLeftWheel: UNITY.HavokWheelInfo;
        protected m_backRightWheel: UNITY.HavokWheelInfo;
        protected m_frontLeftWheelSkid: number;
        protected m_frontRightWheelSkid: number;
        protected m_backLeftWheelSkid: number;
        protected m_backRightWheelSkid: number;
        protected m_angularDampener: BABYLON.Vector3;
        protected m_velocityOffset: BABYLON.Vector3;
        protected m_linearVelocity: BABYLON.Vector3;
        protected m_lastPosition: BABYLON.Vector3;
        protected m_scaledVelocity: number;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected destroy(): void;
        protected awakeVehicleState(): void;
        protected initVehicleState(): void;
        protected updateVehicleState(): void;
        protected destroyVehicleState(): void;
        private burnoutTimer;
        private restoreTimer;
        private cooldownTimer;
        private wheelDonuts;
        private wheelBurnout;
        private wheelSkidding;
        private donutSpinTime;
        private currentForward;
        private currentTurning;
        private currentSkidding;
        private currentDonuts;
        private animatorSteerAngle;
        /** Drives the raycast vehicle with the specfied movement properties. */
        drive(throttle: number, steering: number, braking: boolean, donuts: boolean, booster?: number, autopilot?: boolean): void;
        private syncVehicleState;
        private writeTransformMetadata;
        private getVehicleEngineTorque;
        private createSmokeParticleSystem;
        private updateCurrentSkidInfo;
        private updateCurrentBrakeDamping;
        private updateLinearBrakeDamping;
        private updateAngularBrakeDamping;
        private updateCurrentRotationDelta;
        private updateCurrentRotationBoost;
        private updateCurrentFrictionSlip;
        private frontLeftContact;
        private frontRightContact;
        private rearLeftContact;
        private rearRightContact;
        private frontLeftContactTag;
        private frontRightContactTag;
        private rearLeftContactTag;
        private rearRightContactTag;
        private frontLeftContactPoint;
        private frontRightContactPoint;
        private rearLeftContactPoint;
        private rearRightContactPoint;
        private frontLeftContactNormal;
        private frontRightContactNormal;
        private rearLeftContactNormal;
        private rearRightContactNormal;
        private frontLeftSensorLine;
        private frontRightSensorLine;
        private rearLeftSensorLine;
        private rearRightSensorLine;
        private frontLeftFrictionLerping;
        private frontRightFrictionLerping;
        private rearLeftFrictionLerping;
        private rearRightFrictionLerping;
        private frontLeftFrictionPenalty;
        private frontRightFrictionPenalty;
        private rearLeftFrictionPenalty;
        private rearRightFrictionPenalty;
        private startRaycastPosition;
        private endRaycastPosition;
        private downDirection;
        private downDistance;
        getFrontLeftWheelContact(): boolean;
        getFrontRightWheelContact(): boolean;
        getRearLeftWheelContact(): boolean;
        getRearRightWheelContact(): boolean;
        getFrontLeftWheelContactTag(): string;
        getFrontRightWheelContactTag(): string;
        getRearLeftWheelContactTag(): string;
        getRearRightWheelContactTag(): string;
        getFrontLeftWheelContactPoint(): BABYLON.Vector3;
        getFrontRightWheelContactPoint(): BABYLON.Vector3;
        getRearLeftWheelContactPoint(): BABYLON.Vector3;
        getRearRightWheelContactPoint(): BABYLON.Vector3;
        getFrontLeftWheelContactNormal(): BABYLON.Vector3;
        getFrontRightWheelContactNormal(): BABYLON.Vector3;
        getRearLeftWheelContactNormal(): BABYLON.Vector3;
        getRearRightWheelContactNormal(): BABYLON.Vector3;
        private castWheelContactRays;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class VehicleCameraManager
    */
    class VehicleCameraManager extends UNITY.ScriptComponent {
        enableCamera: boolean;
        followTarget: boolean;
        followHeight: number;
        pitchingAngle: number;
        rotationDamping: number;
        minimumDistance: number;
        maximumDistance: number;
        buttonCamera: number;
        keyboardCamera: number;
        tickRemoteEntities: boolean;
        private firstPerson;
        private cameraPivot;
        private targetEulers;
        private cameraRotation;
        private cameraPivotOffset;
        private autoAttachCamera;
        protected m_cameraTransform: BABYLON.TransformNode;
        protected m_inputController: PROJECT.VehicleInputController;
        protected m_standardController: PROJECT.StandardCarController;
        protected m_firstPersonOffset: BABYLON.Vector3;
        protected awake(): void;
        protected start(): void;
        protected late(): void;
        protected destroy(): void;
        protected awakeCameraManager(): void;
        protected initCameraManager(): void;
        protected lateUpdateCameraManager(): void;
        protected destroyCameraManager(): void;
        attachPlayerCamera(player: UNITY.PlayerNumber): void;
        togglePlayerCamera(): void;
        firstPersonCamera(): void;
        thirdPersonCamera(): void;
    }
}
declare namespace PROJECT {
    /**
     * Babylon Script Component
     * @class VehicleInputController
     */
    interface ISteeringWheelDevice {
        deviceName: string;
        forwardButton: number;
        backwardButton: number;
        leftHandBrake: number;
        rightHandBrake: number;
        leftDonutBoost: number;
        rightDonutBoost: number;
    }
    class VehicleInputController extends UNITY.ScriptComponent {
        private playerDeltaX;
        private playerDeltaY;
        private playerMouseX;
        private playerMouseY;
        private ackermanRadius;
        private recoveryRadius;
        private waypointPosition;
        private waypointCount;
        private waypointIndex;
        private noMovementTime;
        private reverseFixMode;
        private recoveryFixMode;
        private nextTargetSpeed;
        private prevTargetSpeed;
        private vehicleResetCheck;
        private randomSkillFactor;
        private showChaseRabbit;
        private showSensorLines;
        private steeringWheelMode;
        private rabbitTrackerLine;
        private rabbitTrackerColor;
        private greenTrackingColor;
        private redTrackingColor;
        private localTargetPosition;
        private avoidPositionOffset;
        private avoidanceLerp;
        private avoidanceTimer;
        private avoidanceValue;
        private randomTurning;
        private randomBoosting;
        private randomDistance;
        private lastCheckpoint;
        private mainCenterSensorLine;
        private mainRightSensorLine;
        private mainLeftSensorLine;
        private angleRightSensorLine;
        private angleLeftSensorLine;
        private sideRightSensorLine;
        private sideLeftSensorLine;
        private backRightSensorLine;
        private backLeftSensorLine;
        private sidewaysOffsetVector;
        private backBumperEdgeVector;
        private sensorStartPos;
        private sensorPointPos;
        private sensorAnglePos;
        private rsideStartPos;
        private rsidePointPos;
        private lsideStartPos;
        private lsidePointPos;
        private tempScaleVector;
        private rbackStartPos;
        private rbackPointPos;
        private lbackStartPos;
        private lbackPointPos;
        private trackVehiclePosition;
        private trackRabbitPosition;
        getPlayerDeltaX(): number;
        getPlayerDeltaY(): number;
        getPlayerMouseX(): number;
        getPlayerMouseY(): number;
        getWaypointIndex(): number;
        getChaseRabbitMesh(): BABYLON.Mesh;
        resetChaseRabbitMesh(): void;
        getChasePointMesh(): BABYLON.Mesh;
        resetChasePointMesh(): void;
        enableInput: boolean;
        resetTiming: number;
        playerNumber: UNITY.PlayerNumber;
        pedelForward: number;
        triggerForward: number;
        keyboardForawrd: number;
        auxKeyboardForawrd: number;
        pedalBackward: number;
        triggerBackwards: number;
        keyboardBackwards: number;
        auxKeyboardBackwards: number;
        buttonHandbrake: number;
        keyboardHandbrake: number;
        leftWheelHandbrake: number;
        rightWheelHandbrake: number;
        buttonDonut: number;
        keyboardDonut: number;
        leftWheelDonut: number;
        rightWheelDonut: number;
        raceLineNode: number;
        minLookAhead: number;
        maxLookAhead: number;
        driverSkillLevel: number;
        chaseRabbitSpeed: number;
        throttleSensitivity: number;
        steeringSensitivity: number;
        brakingSensitivity: number;
        brakingTurnAngle: number;
        brakingSpeedLimit: number;
        skiddingSpeedLimit: number;
        linearDampenForce: number;
        driveSpeedMultiplier: number;
        driveLineDistance: number;
        resetMovingTimeout: number;
        reverseThrottleTime: number;
        maxRaceTrackSpeed: number;
        trackManagerIdentity: string;
        vehicleTag: string;
        obstacleTag: string;
        sensorLength: number;
        spacerWidths: number;
        angleFactors: number;
        initialOffsetX: number;
        initialOffsetY: number;
        initialOffsetZ: number;
        sidewaysLength: number;
        sidewaysOffset: number;
        backBumperEdge: number;
        powerBoosting: number;
        wonderDistance: number;
        avoidanceFactor: number;
        avoidanceSpeed: number;
        avoidanceTimeout: number;
        avoidanceDistance: number;
        private reversingFlag;
        private reversingTime;
        private reversingWait;
        private reversingFor;
        protected m_chasePointMesh: BABYLON.Mesh;
        protected m_chaseRabbitMesh: BABYLON.Mesh;
        protected m_circuitInterfaces: PROJECT.ITrackNode[];
        protected m_circuitRaceLine_1: PROJECT.IControlPoint[];
        protected m_circuitRaceLine_2: PROJECT.IControlPoint[];
        protected m_circuitRaceLine_3: PROJECT.IControlPoint[];
        protected m_circuitRaceLine_4: PROJECT.IControlPoint[];
        protected m_circuitRaceLine_5: PROJECT.IControlPoint[];
        protected m_rigidbodyPhysics: UNITY.RigidbodyPhysics;
        protected m_checkpointManager: PROJECT.CheckpointManager;
        protected m_standardCarController: PROJECT.StandardCarController;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected destroy(): void;
        protected awakeVehicleController(): void;
        protected initVehicleController(): void;
        protected updateVehicleController(): void;
        protected updateManualInputDrive(): void;
        protected updateAutoPilotDrive(): void;
        protected getDriverSkillFactor(): number;
        protected getCurrentTrackNode(index: number): PROJECT.ITrackNode;
        protected getCurrentControlPoint(lane: number, index: number): PROJECT.IControlPoint;
        protected getRandomNumber(min: number, max: number): number;
        protected generateRandonNumber(min: number, max: number, decimals?: number): number;
        protected destroyVehicleController(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class VehicleNetworkLabel
    */
    class VehicleNetworkLabel extends UNITY.ScriptComponent {
        label: BABYLON.GUI.TextBlock;
        rect: BABYLON.GUI.Rectangle;
        autoCreate: boolean;
        offsetX: number;
        offsetY: number;
        labelColor: BABYLON.Color3;
        borderColor: BABYLON.Color3;
        backgroundColor: BABYLON.Color3;
        labelCreated: boolean;
        protected update(): void;
        createLabel(name: string): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
     * Babylon toolkit default camera system class
     * @class DefaultCameraSystem - All rights reserved (c) 2020 Mackey Kinard
     * https://doc.babylonjs.com/divingDeeper/postProcesses/defaultRenderingPipeline
     */
    class DefaultCameraSystem extends UNITY.ScriptComponent {
        protected static PlayerOneCamera: BABYLON.FreeCamera;
        protected static PlayerTwoCamera: BABYLON.FreeCamera;
        protected static PlayerThreeCamera: BABYLON.FreeCamera;
        protected static PlayerFourCamera: BABYLON.FreeCamera;
        protected static XRExperienceHelper: BABYLON.WebXRDefaultExperience;
        private static multiPlayerView;
        private static multiPlayerCount;
        private static multiPlayerCameras;
        private static stereoCameras;
        private static startupMode;
        private static cameraReady;
        private static renderingPipeline;
        private static screenSpacePipeline;
        static GetRenderingPipeline(): BABYLON.DefaultRenderingPipeline;
        static GetScreenSpacePipeline(): BABYLON.SSAORenderingPipeline;
        static IsCameraSystemReady(): boolean;
        /** Register handler that is triggered when the webxr experience helper has been created */
        static OnXRExperienceHelperObservable: BABYLON.Observable<BABYLON.WebXRDefaultExperience>;
        private mainCamera;
        private cameraType;
        private cameraInertia;
        private cameraController;
        private immersiveOptions;
        private arcRotateConfig;
        private multiPlayerSetup;
        private fullScreenToggle;
        private editorPostProcessing;
        isMainCamera(): boolean;
        getCameraType(): number;
        protected m_cameraRig: BABYLON.TargetCamera;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected destroy(): void;
        protected awakeCameraSystemState(): void;
        protected startCameraSystemState(): Promise<void>;
        protected updateCameraSystemState(): void;
        protected cleanCameraSystemState(): void;
        protected destroyCameraSystemState(): void;
        /** Get the WebXR default experience helper */
        static GetWebXR(): BABYLON.WebXRDefaultExperience;
        /** Is universal camera system in WebXR mode */
        static IsInWebXR(): boolean;
        /** Setup navigation mesh for WebXR */
        private static SetupNavigationWebXR;
        /** Get main camera rig for the scene */
        static GetMainCamera(scene: BABYLON.Scene, detach?: boolean): BABYLON.FreeCamera;
        /** Get universal camera rig for desired player */
        static GetPlayerCamera(scene: BABYLON.Scene, player?: UNITY.PlayerNumber, detach?: boolean): BABYLON.FreeCamera;
        /** Get camera transform node for desired player */
        static GetCameraTransform(scene: BABYLON.Scene, player?: UNITY.PlayerNumber): BABYLON.TransformNode;
        /** Are stereo side side camera services available. */
        static IsStereoCameras(): boolean;
        /** Are local multi player view services available. */
        static IsMultiPlayerView(): boolean;
        /** Get the current local multi player count */
        static GetMultiPlayerCount(): number;
        /** Activates current local multi player cameras. */
        static ActivateMultiPlayerCameras(scene: BABYLON.Scene): boolean;
        /** Disposes current local multiplayer cameras */
        static DisposeMultiPlayerCameras(): void;
        /** Sets the multi player camera view layout */
        static SetMultiPlayerViewLayout(scene: BABYLON.Scene, totalNumPlayers: number): boolean;
    }
    /*********************************************/
    /** Camera Editor Properties Support Classes */
    /*********************************************/
    interface IEditorArcRtotate {
        alpha: number;
        beta: number;
        radius: number;
        target: UNITY.IUnityVector3;
    }
    interface IEditorPostProcessing {
        usePostProcessing: boolean;
        highDynamicRange: boolean;
        screenAntiAliasing: PROJECT.IEditorAntiAliasing;
        focalDepthOfField: PROJECT.IEditorDepthOfField;
        chromaticAberration: PROJECT.IEditorChromaticAberration;
        glowLayerProperties: PROJECT.IEditorGlowLayer;
        grainEffectProperties: PROJECT.IEditorGrainEffect;
        sharpEffectProperties: PROJECT.IEditorSharpenEffect;
        bloomEffectProperties: PROJECT.IEditorBloomProcessing;
        imageProcessingConfig: PROJECT.IEditorImageProcessing;
        screenSpaceRendering: PROJECT.IEditorScreenSpace;
    }
    interface IEditorScreenSpace {
        SSAO: boolean;
        SSAORatio: number;
        combineRatio: number;
        totalStrength: number;
        radius: number;
        area: number;
        fallOff: number;
        baseValue: number;
    }
    interface IEditorAntiAliasing {
        msaaSamples: number;
        fxaaEnabled: boolean;
        fxaaScaling: boolean;
        fxaaSamples: number;
    }
    interface IEditorDepthOfField {
        depthOfField: boolean;
        blurLevel: number;
        focalStop: number;
        focalLength: number;
        focusDistance: number;
        maxLensSize: number;
    }
    interface IEditorChromaticAberration {
        aberrationEnabled: boolean;
        aberrationAmount: number;
        adaptScaleViewport: boolean;
        alphaMode: number;
        alwaysForcePOT: boolean;
        pixelPerfectMode: boolean;
        fullscreenViewport: boolean;
    }
    interface IEditorGlowLayer {
        glowEnabled: boolean;
        glowIntensity: number;
        blurKernelSize: number;
    }
    interface IEditorGrainEffect {
        grainEnabled: boolean;
        grainAnimated: boolean;
        grainIntensity: number;
        adaptScaleViewport: boolean;
    }
    interface IEditorSharpenEffect {
        sharpenEnabled: boolean;
        sharpEdgeAmount: number;
        sharpColorAmount: number;
        adaptScaleViewport: boolean;
    }
    interface IEditorBloomProcessing {
        bloomEnabled: boolean;
        bloomKernel: number;
        bloomScale: number;
        bloomWeight: number;
        bloomThreshold: number;
    }
    interface IEditorColorCurves {
        curvesEnabled: boolean;
        globalDen: number;
        globalExp: number;
        globalHue: number;
        globalSat: number;
        highlightsDen: number;
        highlightsExp: number;
        highlightsHue: number;
        highlightsSat: number;
        midtonesDen: number;
        midtonesExp: number;
        midtonesHue: number;
        midtonesSat: number;
        shadowsDen: number;
        shadowsExp: number;
        shadowsHue: number;
        shadowsSat: number;
    }
    interface IEditorImageProcessing {
        imageProcessing: boolean;
        imageContrast: number;
        imageExposure: number;
        toneMapping: boolean;
        toneMapType: number;
        vignetteEnabled: boolean;
        vignetteBlendMode: number;
        vignetteCameraFov: number;
        vignetteStretch: number;
        vignetteCentreX: number;
        vignetteCentreY: number;
        vignetteWeight: number;
        vignetteColor: UNITY.IUnityColor;
        useColorGrading: boolean;
        setGradingTexture: any;
        imagingColorCurves: PROJECT.IEditorColorCurves;
    }
}
declare namespace PROJECT {
    /**
     * Babylon Script Component
     * @class DebugInformation
     */
    class DebugInformation extends UNITY.ScriptComponent {
        private keys;
        private show;
        private popup;
        private views;
        private xbox;
        private color;
        protected awake(): void;
        protected start(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class UserInterface
    */
    class UserInterface extends UNITY.ScriptComponent {
        static IsCanvasReady(): boolean;
        static GetCanvasElement(name: string): BABYLON.GUI.Control;
        static ShowCanvasElement(element: BABYLON.GUI.Control, fadeSpeedRatio?: number, onAnimationComplete?: () => void): BABYLON.Animatable;
        static HideCanvasElement(element: BABYLON.GUI.Control, fadeSpeedRatio?: number, onAnimationComplete?: () => void): BABYLON.Animatable;
        static SetSceneController(scene: BABYLON.Scene): void;
        static GetAdvancedTexture(): BABYLON.GUI.AdvancedDynamicTexture;
        static GetBackgroundTexture(): BABYLON.GUI.AdvancedDynamicTexture;
        static OnFontFacesReady: BABYLON.Observable<any>;
        static OnFontFacesLoaded: BABYLON.Observable<any>;
        static OnParseNodeObject: BABYLON.Observable<any>;
        static OnInterfaceLoaded: BABYLON.Observable<BABYLON.GUI.AdvancedDynamicTexture>;
        private static SceneController;
        private static AdvancedTexture;
        private static BackgroundTexture;
        private static FontFacesAttached;
        private static FontFacesPreloaded;
        private exportLowerCase;
        private backgroundData;
        private textureSampleMode;
        private idealRenderingSize;
        private viewportRenderSize;
        private customViewportSize;
        private defaultImageLocation;
        private defaultImageControl;
        private isManagedTexture;
        private scaleTextureSize;
        private setAdaptiveScale;
        private drawAtIdealSize;
        private useSmallestIdeal;
        private fontFamilyList;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected awake(): void;
        protected start(): void;
        protected destroy(): void;
        protected engineResize(): void;
        protected setupProperties(): void;
        protected setupInterface(): void;
        protected attachWebFonts(): void;
        protected preloadWebFonts(): void;
        protected parseNodeObject(object: any): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class AssetExporter
    */
    class AssetExporter extends UNITY.ScriptComponent {
        protected awake(): void;
        protected start(): void;
        protected fixed(): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected ready(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class AssetPreloader
    */
    class AssetPreloader extends UNITY.ScriptComponent implements UNITY.IAssetPreloader {
        private parentMeshes;
        private importMeshes;
        private assetContainers;
        protected destroy(): void;
        /** Add asset preloader tasks (https://doc.babylonjs.com/divingDeeper/importers/assetManager) */
        addPreloaderTasks(assetsManager: UNITY.PreloadAssetsManager): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class NodeMaterialInstance
    */
    class NodeMaterialInstance extends UNITY.ScriptComponent {
        private nodeMaterialData;
        private setCustomRootUrl;
        getMaterialInstance(): BABYLON.NodeMaterial;
        protected m_nodeMaterial: BABYLON.NodeMaterial;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class NodeMaterialParticle
    */
    class NodeMaterialParticle extends UNITY.ScriptComponent {
        private nodeMaterialEditor;
        protected awake(): void;
        protected start(): void;
        protected setupNodeMaterial(materialInstance: BABYLON.NodeMaterial): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected fixed(): void;
        protected ready(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class NodeMaterialProcess
    */
    class NodeMaterialProcess extends UNITY.ScriptComponent {
        private nodeMaterialEditor;
        private numberOfSamples;
        private samplingMode;
        private textureType;
        private textureFormat;
        private sizeRatio;
        private resuable;
        getPostProcess(): BABYLON.PostProcess;
        protected m_postProcess: BABYLON.PostProcess;
        protected start(): void;
        protected setupNodeMaterial(materialInstance: BABYLON.NodeMaterial): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class NodeMaterialTexture
    */
    class NodeMaterialTexture extends UNITY.ScriptComponent {
        private nodeMaterialEditor;
        private textureSize;
        getProceduralTexture(): BABYLON.ProceduralTexture;
        protected m_proceduralTexture: BABYLON.ProceduralTexture;
        protected start(): void;
        protected setupNodeMaterial(materialInstance: BABYLON.NodeMaterial): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class MobileInputController
    */
    class MobileInputController extends UNITY.ScriptComponent {
        static get Instance(): PROJECT.MobileInputController;
        private static StaticInstance;
        private controlType;
        private sideMargins;
        private bottomMargins;
        private readyTimeout;
        private leftBaseElement;
        private rightBaseElement;
        private leftStickStyle;
        private rightStickStyle;
        private invertLeftStickY;
        private invertRightStickY;
        private centerLeftJoystick;
        private enableLeftJoystick;
        private enableRightJoystick;
        private disableMouseRotation;
        private updateCameraInput;
        getLeftStick(): UNITY.TouchJoystickHandler;
        getRightStick(): UNITY.TouchJoystickHandler;
        getLeftStickEnabled(): boolean;
        getRightStickEnabled(): boolean;
        getLeftStickElement(): HTMLDivElement;
        getRightStickElement(): HTMLDivElement;
        showLeftStickElement(show: boolean): void;
        showRightStickElement(show: boolean): void;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected m_leftStick: UNITY.TouchJoystickHandler;
        protected m_rightStick: UNITY.TouchJoystickHandler;
        protected start(): void;
        protected ready(): void;
        protected update(): void;
        protected destroy(): void;
        protected createHtmlElements(): void;
    }
    /**
     * Manage the joystick inputs to control a free camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     */
    class FreeCameraTouchJoystickInput implements BABYLON.ICameraInput<BABYLON.FreeCamera> {
        /**
         * Define the camera the input is attached to.
         */
        camera: BABYLON.FreeCamera;
        /**
         * Define the joystick controlling the input
         */
        controller: BABYLON.Nullable<PROJECT.MobileInputController>;
        /**
         * Defines the joystick rotation sensiblity.
         * This is the threshold from when rotation starts to be accounted for to prevent jittering.
         */
        joystickAngularSensibility: number;
        /**
         * Defines the joystick move sensiblity.
         * This is the threshold from when moving starts to be accounted for for to prevent jittering.
         */
        joystickMoveSensibility: number;
        /**
         * Defines the minimum value at which any analog stick input is ignored.
         * Note: This value should only be a value between 0 and 1.
         */
        deadzoneDelta: number;
        private _yAxisScale;
        /**
         * Gets or sets a boolean indicating that Yaxis (for right stick) should be inverted
         */
        get invertYAxis(): boolean;
        set invertYAxis(value: boolean);
        private LSValues;
        private RSValues;
        private _cameraTransform;
        private _deltaTransform;
        private _vector3;
        private _vector2;
        private _attached;
        /**
         * Attach the input controls to a specific dom element to get the input from.
         */
        attachControl(): void;
        /**
         * Detach the current controls from the specified dom element.
         */
        detachControl(): void;
        /**
         * Update the current camera state depending on the inputs that have been used this frame.
         * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
         */
        checkInputs(): void;
        /**
         * Gets the class name of the current input.
         * @returns the class name
         */
        getClassName(): string;
        /**
         * Get the friendly name associated with the input class.
         * @returns the input friendly name
         */
        getSimpleName(): string;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class MobileOccludeMaterial
    */
    class MobileOccludeMaterial extends UNITY.ScriptComponent {
        private applyToMaterial;
        protected awake(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class MobileShadowMaterial
    */
    class MobileShadowMaterial extends UNITY.ScriptComponent {
        private createNewMaterial;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class BallSocketJoint
    */
    class BallSocketJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        pivotA: BABYLON.Vector3;
        pivotB: BABYLON.Vector3;
        axisA: BABYLON.Vector3;
        axisB: BABYLON.Vector3;
        constraint: BABYLON.BallAndSocketConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class DistanceJoint
    */
    class DistanceJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        maxDistance: number;
        constraint: BABYLON.DistanceConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class FixedHingeJoint
    */
    class FixedHingeJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        pivotA: BABYLON.Vector3;
        pivotB: BABYLON.Vector3;
        constraint: BABYLON.HingeConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class LockedJoint
    */
    class LockedJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        pivotA: BABYLON.Vector3;
        pivotB: BABYLON.Vector3;
        axisA: BABYLON.Vector3;
        axisB: BABYLON.Vector3;
        constraint: BABYLON.LockConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class PrismaticJoint
    */
    class PrismaticJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        pivotA: BABYLON.Vector3;
        pivotB: BABYLON.Vector3;
        axisA: BABYLON.Vector3;
        axisB: BABYLON.Vector3;
        constraint: BABYLON.PrismaticConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class SixdofJoint
    */
    class SixdofJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        pivotA: BABYLON.Vector3;
        pivotB: BABYLON.Vector3;
        perpAxisA: BABYLON.Vector3;
        perpAxisB: BABYLON.Vector3;
        axisLimits: BABYLON.Physics6DoFLimit[];
        constraint: BABYLON.Physics6DoFConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class SliderJoint
    */
    class SliderJoint extends UNITY.ScriptComponent {
        bodyA: BABYLON.TransformNode;
        bodyB: BABYLON.TransformNode;
        pivotA: BABYLON.Vector3;
        pivotB: BABYLON.Vector3;
        axisA: BABYLON.Vector3;
        axisB: BABYLON.Vector3;
        constraint: BABYLON.SliderConstraint;
        collisionsEnabled: boolean;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class RemotePlayerController
    */
    class RemotePlayerController extends UNITY.ScriptComponent {
        updateStateParams: boolean;
        smoothMotionTime: number;
        smoothInputVectors: boolean;
        private animationState;
        private animationStateParams;
        protected awake(): void;
        protected update(): void;
        protected destroy(): void;
        private attachAnimationController;
        private validateAnimationStateParams;
    }
}
declare namespace PROJECT {
    /**
     * Babylon toolkit standard player controller class
     * @class StandardPlayerController - All rights reserved (c) 2020 Mackey Kinard
    */
    class StandardPlayerController extends UNITY.ScriptComponent {
        static MIN_VERTICAL_VELOCITY: number;
        static MIN_GROUND_DISTANCE: number;
        static MIN_MOVE_EPSILON: number;
        static MIN_TIMER_OFFSET: number;
        static MIN_SLOPE_LIMIT: number;
        static PLAYER_HEIGHT: string;
        enableInput: boolean;
        attachCamera: boolean;
        rotateCamera: boolean;
        mouseWheel: boolean;
        toggleView: boolean;
        freeLooking: boolean;
        requireSprintButton: boolean;
        gravitationalForce: number;
        terminalVelocity: number;
        minFallVelocity: number;
        airbornTimeout: number;
        detectionRadius: number;
        verticalOffset: number;
        forwardOffset: number;
        maxAngle: number;
        speedFactor: number;
        rootMotion: boolean;
        moveSpeed: number;
        walkSpeed: number;
        lookSpeed: number;
        jumpSpeed: number;
        jumpDelay: number;
        eyesHeight: number;
        pivotHeight: number;
        maxDistance: number;
        scrollSpeed: number;
        topLookLimit: number;
        downLookLimit: number;
        lowTurnSpeed: number;
        highTurnSpeed: number;
        smoothMotionTime: number;
        smoothInputVectors: boolean;
        smoothAcceleration: boolean;
        accelerationSpeed: number;
        decelerationSpeed: number;
        avatarSkinTag: string;
        climbVolumeTag: string;
        vaultVolumeTag: string;
        maxHeightRanges: any;
        useClimbSystem: boolean;
        distanceFactor: number;
        cameraSmoothing: number;
        cameraCollisions: boolean;
        inputMagnitude: number;
        landingEpsilon: number;
        minimumDistance: number;
        movementAllowed: boolean;
        playerInputX: number;
        playerInputZ: number;
        playerMouseX: number;
        playerMouseY: number;
        runKeyRequired: boolean;
        ignoreTriggerTags: string;
        buttonRun: number;
        keyboardRun: number;
        buttonJump: number;
        keyboardJump: number;
        buttonCamera: number;
        keyboardCamera: number;
        postNetworkAttributes: boolean;
        playerNumber: UNITY.PlayerNumber;
        boomPosition: BABYLON.Vector3;
        airbornVelocity: BABYLON.Vector3;
        movementVelocity: BABYLON.Vector3;
        targetCameraOffset: BABYLON.Vector3;
        isAnimationEnabled(): boolean;
        isRunButtonPressed(): boolean;
        isJumpButtonPressed(): boolean;
        getPlayerJumped(): boolean;
        getPlayerJumping(): boolean;
        getPlayerFalling(): boolean;
        getPlayerSliding(): boolean;
        getPlayerGrounded(): boolean;
        getFallTriggered(): boolean;
        getMovementSpeed(): number;
        getCameraBoomNode(): BABYLON.TransformNode;
        getCameraTransform(): BABYLON.TransformNode;
        getAnimationState(): UNITY.AnimationState;
        getVerticalVelocity(): number;
        getCharacterController(): UNITY.CharacterController;
        getPlayerLookRotation(): BABYLON.Vector3;
        getPlayerMoveDirection(): PROJECT.PlayerMoveDirection;
        getInputMovementVector(): BABYLON.Vector3;
        getInputMagnitudeValue(): number;
        getCameraPivotPosition(): BABYLON.Vector3;
        getCameraPivotRotation(): BABYLON.Quaternion;
        rayClimbOffset: number;
        rayClimbLength: number;
        getClimbContact(): boolean;
        getClimbContactNode(): BABYLON.TransformNode;
        getClimbContactPoint(): BABYLON.Vector3;
        getClimbContactAngle(): number;
        getClimbContactNormal(): BABYLON.Vector3;
        getClimbContactDistance(): number;
        canClimbObstaclePredicate: (action: number) => boolean;
        rayHeightOffset: number;
        rayHeightLength: number;
        getHeightContact(): boolean;
        getHeightContactNode(): BABYLON.TransformNode;
        getHeightContactPoint(): BABYLON.Vector3;
        getHeightContactAngle(): number;
        getHeightContactNormal(): BABYLON.Vector3;
        getHeightContactDistance(): number;
        setGavityForce(gravity: number): void;
        setFallingSpeed(velocity: number): void;
        private physicsWorld;
        private abstractMesh;
        private cameraDistance;
        private forwardCamera;
        private avatarRadius;
        private groundingMesh;
        private groundingObject;
        private groundingCallback;
        private dollyDirection;
        private cameraEulers;
        private rotationEulers;
        private cameraPivotOffset;
        private cameraForwardVector;
        private cameraRightVector;
        private desiredForwardVector;
        private desiredRightVector;
        private scaledCamDirection;
        private scaledMaxDirection;
        private parentNodePosition;
        private maximumCameraPos;
        private tempWorldPosition;
        private cameraRaycastShape;
        private defaultRaycastGroup;
        private defaultRaycastMask;
        private cameraRaycastMask;
        private avatarSkins;
        private cameraNode;
        private cameraPivot;
        private navigationAgent;
        private characterController;
        private verticalVelocity;
        private movementSpeed;
        private isRunPressed;
        private isJumpPressed;
        private isCharacterSliding;
        private isCharacterFalling;
        private isCharacterGrounded;
        private isCharacterFallTriggered;
        private isCharacterJumpFrame;
        private isCharacterJumping;
        private isCharacterLanding;
        private isCharacterRising;
        private isCharacterNavigating;
        private navigationAngularSpeed;
        private updateStateParams;
        private animationStateParams;
        private sphereCollisionShape;
        private hasGroundedContact;
        private showDebugColliders;
        private colliderVisibility;
        private colliderRenderGroup;
        private deltaTime;
        private minJumpTimer;
        private delayJumpTimer;
        private playerControl;
        private canPlayerJump;
        private animationState;
        private lastJumpVelocity;
        private inputMovementVector;
        private playerLookRotation;
        private playerRotationVector;
        private playerMovementVelocity;
        private playerRotationQuaternion;
        private playerMoveDirection;
        private forwardDirection;
        private downDirection;
        private climbContact;
        private climbContactNode;
        private climbContactAngle;
        private climbContactPoint;
        private climbContactNormal;
        private climbContactDistance;
        private climbSensorLine;
        private offsetClimbRaycastPosition;
        private startClimbRaycastPosition;
        private endClimbRaycastPosition;
        private heightContact;
        private heightContactNode;
        private heightContactAngle;
        private heightContactPoint;
        private heightContactNormal;
        private heightContactDistance;
        private heightSensorLine;
        private offsetHeightRaycastPosition;
        private startHeightRaycastPosition;
        private endHeightRaycastPosition;
        protected m_velocityOffset: BABYLON.Vector3;
        protected m_actualVelocity: BABYLON.Vector3;
        protected m_linearVelocity: BABYLON.Vector3;
        protected m_lastPosition: BABYLON.Vector3;
        protected m_positionCenter: BABYLON.Vector3;
        protected m_scaledVelocity: number;
        protected playerDrawVelocity: number;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected awake(): void;
        protected start(): void;
        protected after(): void;
        protected update(): void;
        protected destroy(): void;
        /** Register handler that is triggered before the controller has been updated */
        onPreUpdateObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered before the controller movement has been applied */
        onBeforeMoveObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after the controller has been updated */
        onPostUpdateObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after player input has been updated */
        onPlayerInputObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered when player position should be updated */
        onPlayerPositionObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after performing action has been updated */
        onUpdateActionObservable: BABYLON.Observable<BABYLON.TransformNode>;
        private _deltaMotionPosition;
        getDeltaMotionPosition(): BABYLON.Vector3;
        private _deltaMotionRotation;
        getDeltaMotionRotation(): BABYLON.Quaternion;
        private isPerformingAction;
        private isRootMotionAction;
        private isActionInterruptable;
        private afterActionHandler;
        private performActionTimer;
        private performActionNumber;
        private playerRotationSpeed;
        private rotatePlayerTowards;
        private matchStartTime;
        private matchTargetTime;
        private matchTargetOffset;
        private matchTargetHeight;
        private lockTargetHeight;
        private lastStartHeight;
        private lastTargetHeight;
        private lastTargetNormal;
        private lastTargetRotation;
        private lastDeltaPosition;
        private lastDeltaRotation;
        getIsPerformingAction(): boolean;
        getIsRootMotionAction(): boolean;
        getIsActionInterruptable(): boolean;
        playActionAnimation(action: number, interruptableAction?: boolean, enableRootMotion?: boolean, afterActionComplete?: () => void): void;
        resetActionAnimationState(): void;
        private updateAnimationActionState;
        /** Set the player world position */
        setWorldPosition(x: number, y: number, z: number): void;
        /** TODO */
        setPlayerControl(mode: PROJECT.PlayerInputControl): void;
        /** TODO */
        togglePlayerControl(): void;
        private showAvatarSkins;
        /** TODO */
        attachPlayerCamera(player: UNITY.PlayerNumber): void;
        private _ikLeftController;
        private _ikLeftFootTarget;
        private _ikLeftPoleTarget;
        private _ikRightController;
        private _ikRightFootTarget;
        private _ikRightPoleTarget;
        private abstractSkinMesh;
        private rootBoneTransform;
        private leftFootTransform;
        private leftFootPolePos;
        private leftFootBendAxis;
        private leftFootPoleAngle;
        private leftFootMaxAngle;
        private rightFootTransform;
        private rightFootPolePos;
        private rightFootBendAxis;
        private rightFootPoleAngle;
        private rightFootMaxAngle;
        getLeftFootTarget(): BABYLON.TransformNode;
        getRightFootTarget(): BABYLON.TransformNode;
        getLeftFootController(): BABYLON.BoneIKController;
        getRightFootController(): BABYLON.BoneIKController;
        attachBoneControllers(): void;
        private attachAnimationController;
        /** TODO */
        enableCharacterController(state: boolean): void;
        /** TODO */
        resetPlayerRotation(): void;
        /** TODO */
        resetPlayerJumpingState(): void;
        private awakePlayerController;
        private startPlayerController;
        private updatePlayerPosition;
        private updatePlayerController;
        private afterPlayerController;
        private updateCharacterController;
        private updateCameraController;
        getBoomArmMaxDistance(): number;
        setBoomArmMaxDistance(distance: number): void;
        setSmoothBoomArmLength(length: number, speed: number, updateMaxDistance?: boolean): void;
        private smoothBoomArmLength;
        private smoothBoomArmSpeed;
        private updateSmoothBoomArmLength;
        private castPhysicsClimbingVolumeRay;
        private castPhysicsHeightCheckVolumeRay;
        private getCheckedVerticalVelocity;
        private destroyPlayerController;
        private validateAnimationStateParams;
    }
    /**
    * Babylon Interface Definition
    * @interface AnimationStateParams
    */
    interface AnimationStateParams {
        moveDirection: string;
        inputMagnitude: string;
        horizontalInput: string;
        verticalInput: string;
        mouseXInput: string;
        mouseYInput: string;
        heightInput: string;
        speedInput: string;
        jumpFrame: string;
        jumpState: string;
        actionState: string;
        fallingState: string;
        slidingState: string;
        groundedState: string;
    }
    /**
    * Babylon Enum Definition
    * @interface PlayerInputControl
    */
    enum PlayerInputControl {
        FirstPersonStrafing = 0,
        ThirdPersonStrafing = 1
    }
    /**
    * Babylon Enum Definition
    * @interface PlayerMoveDirection
    */
    enum PlayerMoveDirection {
        Stationary = 0,
        Forward = 1,
        ForwardLeft = 2,
        ForwardRight = 3,
        Backward = 4,
        BackwardLeft = 5,
        BackwardRight = 6,
        StrafingLeft = 7,
        StrafingRight = 8
    }
    /**
    * Babylon Enum Definition
    * @interface ActionAnimationType
    */
    enum ActionAnimationType {
        Neutral = 0,
        StepUp = 1,
        JumpUp = 2,
        ClimbUp = 3,
        VaultOver = 4
    }
}
declare namespace PROJECT {
    /**
     * Babylon toolkit third person player controller class
     * @class ThirdPersonPlayerController - All rights reserved (c) 2020 Mackey Kinard
    */
    class ThirdPersonPlayerController extends UNITY.ScriptComponent {
        static MIN_VERTICAL_VELOCITY: number;
        static MIN_GROUND_DISTANCE: number;
        static MIN_MOVE_EPSILON: number;
        static MIN_TIMER_OFFSET: number;
        static MIN_SLOPE_LIMIT: number;
        static PLAYER_HEIGHT: string;
        enableInput: boolean;
        attachCamera: boolean;
        rotateCamera: boolean;
        mouseWheel: boolean;
        freeLooking: boolean;
        requireSprintButton: boolean;
        gravitationalForce: number;
        terminalVelocity: number;
        minFallVelocity: number;
        airbornTimeout: number;
        detectionRadius: number;
        verticalOffset: number;
        forwardOffset: number;
        maxAngle: number;
        speedFactor: number;
        rootMotion: boolean;
        moveSpeed: number;
        walkSpeed: number;
        lookSpeed: number;
        jumpSpeed: number;
        jumpDelay: number;
        eyesHeight: number;
        pivotHeight: number;
        maxDistance: number;
        scrollSpeed: number;
        topLookLimit: number;
        downLookLimit: number;
        lowTurnSpeed: number;
        highTurnSpeed: number;
        smoothMotionTime: number;
        smoothInputVectors: boolean;
        smoothAcceleration: boolean;
        accelerationSpeed: number;
        decelerationSpeed: number;
        climbVolumeTag: string;
        vaultVolumeTag: string;
        maxHeightRanges: any;
        useClimbSystem: boolean;
        distanceFactor: number;
        cameraSmoothing: number;
        cameraCollisions: boolean;
        inputMagnitude: number;
        landingEpsilon: number;
        minimumDistance: number;
        movementAllowed: boolean;
        playerInputX: number;
        playerInputZ: number;
        playerMouseX: number;
        playerMouseY: number;
        runKeyRequired: boolean;
        ignoreTriggerTags: string;
        buttonRun: number;
        keyboardRun: number;
        buttonJump: number;
        keyboardJump: number;
        buttonCamera: number;
        keyboardCamera: number;
        postNetworkAttributes: boolean;
        playerNumber: UNITY.PlayerNumber;
        boomPosition: BABYLON.Vector3;
        airbornVelocity: BABYLON.Vector3;
        movementVelocity: BABYLON.Vector3;
        targetCameraOffset: BABYLON.Vector3;
        isAnimationEnabled(): boolean;
        isRunButtonPressed(): boolean;
        isJumpButtonPressed(): boolean;
        getPlayerJumped(): boolean;
        getPlayerJumping(): boolean;
        getPlayerFalling(): boolean;
        getPlayerSliding(): boolean;
        getPlayerGrounded(): boolean;
        getFallTriggered(): boolean;
        getMovementSpeed(): number;
        getCameraBoomNode(): BABYLON.TransformNode;
        getCameraTransform(): BABYLON.TransformNode;
        getAnimationState(): UNITY.AnimationState;
        getVerticalVelocity(): number;
        getCharacterController(): UNITY.CharacterController;
        getPlayerLookRotation(): BABYLON.Vector3;
        getPlayerMoveDirection(): PROJECT.PlayerMoveDirection;
        getInputMovementVector(): BABYLON.Vector3;
        getInputMagnitudeValue(): number;
        getCameraPivotPosition(): BABYLON.Vector3;
        getCameraPivotRotation(): BABYLON.Quaternion;
        rayClimbOffset: number;
        rayClimbLength: number;
        getClimbContact(): boolean;
        getClimbContactNode(): BABYLON.TransformNode;
        getClimbContactPoint(): BABYLON.Vector3;
        getClimbContactAngle(): number;
        getClimbContactNormal(): BABYLON.Vector3;
        getClimbContactDistance(): number;
        canClimbObstaclePredicate: (action: number) => boolean;
        rayHeightOffset: number;
        rayHeightLength: number;
        getHeightContact(): boolean;
        getHeightContactNode(): BABYLON.TransformNode;
        getHeightContactPoint(): BABYLON.Vector3;
        getHeightContactAngle(): number;
        getHeightContactNormal(): BABYLON.Vector3;
        getHeightContactDistance(): number;
        setGavityForce(gravity: number): void;
        setFallingSpeed(velocity: number): void;
        private physicsWorld;
        private abstractMesh;
        private cameraDistance;
        private forwardCamera;
        private avatarRadius;
        private groundingMesh;
        private groundingObject;
        private groundingCallback;
        private dollyDirection;
        private cameraEulers;
        private rotationEulers;
        private cameraPivotOffset;
        private cameraForwardVector;
        private cameraRightVector;
        private desiredForwardVector;
        private desiredRightVector;
        private scaledCamDirection;
        private scaledMaxDirection;
        private parentNodePosition;
        private maximumCameraPos;
        private tempWorldPosition;
        private cameraRaycastShape;
        private defaultRaycastGroup;
        private defaultRaycastMask;
        private cameraRaycastMask;
        private avatarSkins;
        private cameraNode;
        private cameraPivot;
        private navigationAgent;
        private characterController;
        private verticalVelocity;
        private movementSpeed;
        private isRunPressed;
        private isJumpPressed;
        private isCharacterSliding;
        private isCharacterFalling;
        private isCharacterGrounded;
        private isCharacterFallTriggered;
        private isCharacterJumpFrame;
        private isCharacterJumping;
        private isCharacterRising;
        private isCharacterLanding;
        private isCharacterNavigating;
        private navigationAngularSpeed;
        private updateStateParams;
        private animationStateParams;
        private sphereCollisionShape;
        private hasGroundedContact;
        private showDebugColliders;
        private colliderVisibility;
        private colliderRenderGroup;
        private deltaTime;
        private minJumpTimer;
        private delayJumpTimer;
        private canPlayerJump;
        private animationState;
        private lastJumpVelocity;
        private inputMovementVector;
        private playerLookRotation;
        private playerRotationVector;
        private playerMovementVelocity;
        private playerRotationQuaternion;
        private playerMoveDirection;
        private forwardDirection;
        private downDirection;
        private climbContact;
        private climbContactNode;
        private climbContactAngle;
        private climbContactPoint;
        private climbContactNormal;
        private climbContactDistance;
        private climbSensorLine;
        private offsetClimbRaycastPosition;
        private startClimbRaycastPosition;
        private endClimbRaycastPosition;
        private heightContact;
        private heightContactNode;
        private heightContactAngle;
        private heightContactPoint;
        private heightContactNormal;
        private heightContactDistance;
        private heightSensorLine;
        private offsetHeightRaycastPosition;
        private startHeightRaycastPosition;
        private endHeightRaycastPosition;
        protected m_velocityOffset: BABYLON.Vector3;
        protected m_actualVelocity: BABYLON.Vector3;
        protected m_linearVelocity: BABYLON.Vector3;
        protected m_lastPosition: BABYLON.Vector3;
        protected m_positionCenter: BABYLON.Vector3;
        protected m_scaledVelocity: number;
        protected playerDrawVelocity: number;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected awake(): void;
        protected start(): void;
        protected after(): void;
        protected update(): void;
        protected destroy(): void;
        /** Register handler that is triggered before the controller has been updated */
        onPreUpdateObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered before the controller movement has been applied */
        onBeforeMoveObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after the controller has been updated */
        onPostUpdateObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after player input has been updated */
        onPlayerInputObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered when player position should be updated */
        onPlayerPositionObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after performing action has been updated */
        onUpdateActionObservable: BABYLON.Observable<BABYLON.TransformNode>;
        /** Register handler that is triggered after animation state has been updated */
        onAnimationStateObservable: BABYLON.Observable<BABYLON.TransformNode>;
        private _deltaMotionPosition;
        getDeltaMotionPosition(): BABYLON.Vector3;
        private _deltaMotionRotation;
        getDeltaMotionRotation(): BABYLON.Quaternion;
        private isPerformingAction;
        private isRootMotionAction;
        private isActionInterruptable;
        private afterActionHandler;
        private performActionTimer;
        private performActionNumber;
        private playerRotationSpeed;
        private rotatePlayerTowards;
        private matchStartTime;
        private matchTargetTime;
        private matchTargetOffset;
        private matchTargetHeight;
        private lockTargetHeight;
        private lastStartHeight;
        private lastTargetHeight;
        private lastTargetNormal;
        private lastTargetRotation;
        private lastDeltaPosition;
        private lastDeltaRotation;
        getIsPerformingAction(): boolean;
        getIsRootMotionAction(): boolean;
        getIsActionInterruptable(): boolean;
        playActionAnimation(action: number, interruptableAction?: boolean, enableRootMotion?: boolean, afterActionComplete?: () => void): void;
        resetActionAnimationState(): void;
        private updateAnimationActionState;
        /** Set the player world position */
        setWorldPosition(x: number, y: number, z: number): void;
        /** TODO */
        attachPlayerCamera(player: UNITY.PlayerNumber): void;
        private _ikLeftController;
        private _ikLeftFootTarget;
        private _ikLeftPoleTarget;
        private _ikRightController;
        private _ikRightFootTarget;
        private _ikRightPoleTarget;
        private abstractSkinMesh;
        private rootBoneTransform;
        private leftFootTransform;
        private leftFootPolePos;
        private leftFootBendAxis;
        private leftFootPoleAngle;
        private leftFootMaxAngle;
        private rightFootTransform;
        private rightFootPolePos;
        private rightFootBendAxis;
        private rightFootPoleAngle;
        private rightFootMaxAngle;
        getLeftFootTarget(): BABYLON.TransformNode;
        getRightFootTarget(): BABYLON.TransformNode;
        getLeftFootController(): BABYLON.BoneIKController;
        getRightFootController(): BABYLON.BoneIKController;
        attachBoneControllers(): void;
        private attachAnimationController;
        /** TODO */
        enableCharacterController(state: boolean): void;
        /** TODO */
        resetPlayerRotation(): void;
        /** TODO */
        resetPlayerJumpingState(): void;
        private awakePlayerController;
        private startPlayerController;
        private updatePlayerPosition;
        private updatePlayerController;
        private afterPlayerController;
        private updateCharacterController;
        private updateCameraController;
        getBoomArmMaxDistance(): number;
        setBoomArmMaxDistance(distance: number): void;
        setSmoothBoomArmLength(length: number, speed: number, updateMaxDistance?: boolean): void;
        private smoothBoomArmLength;
        private smoothBoomArmSpeed;
        private updateSmoothBoomArmLength;
        private castPhysicsClimbingVolumeRay;
        private castPhysicsHeightCheckVolumeRay;
        private getCheckedVerticalVelocity;
        private destroyPlayerController;
        private validateAnimationStateParams;
    }
    /**
    * Babylon Enum Definition
    * @interface ThirdPersonControl
    */
    enum ThirdPersonControl {
        ThirdPersonTurning = 0,
        ThirdPersonForward = 1
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class FxParticleSystem
    */
    class FxParticleSystem extends UNITY.ScriptComponent {
        getParticleEmitter(): BABYLON.AbstractMesh;
        getParticleSystem(): BABYLON.ParticleSystem | BABYLON.GPUParticleSystem;
        protected m_particleEmitter: BABYLON.AbstractMesh;
        protected m_particleSystem: BABYLON.ParticleSystem | BABYLON.GPUParticleSystem;
        protected awake(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
     * Babylon water material system pro class (Babylon Water Material)
     * @class SkyMaterialSystem - All rights reserved (c) 2020 Mackey Kinard
     */
    class SkyMaterialSystem extends UNITY.ScriptComponent {
        private skyfog;
        private skysize;
        private probesize;
        private reflections;
        private reflectlevel;
        private skytintcolor;
        getSkyboxMesh(): BABYLON.AbstractMesh;
        getSkyMaterial(): BABYLON.SkyMaterial;
        getReflectionProbe(): BABYLON.ReflectionProbe;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected destroy(): void;
        protected m_skyboxMesh: BABYLON.Mesh;
        protected m_skyMaterial: BABYLON.SkyMaterial;
        protected m_reflectProbe: BABYLON.ReflectionProbe;
        protected awakeSkyboxMaterial(): void;
        protected destroySkyboxMaterial(): void;
        /** Set Skybox Mesh tint color. (Box Mesh Vertex Colors) */
        setSkyboxTintColor(color: BABYLON.Color3): void;
    }
}
declare namespace PROJECT {
    /**
     * Babylon water material system pro class (Babylon Water Material)
     * @class WaterMaterialSystem - All rights reserved (c) 2020 Mackey Kinard
     */
    class WaterMaterialSystem extends UNITY.ScriptComponent {
        private waterTag;
        private targetSize;
        private renderSize;
        private depthFactor;
        private reflectSkybox;
        private subDivisions;
        private heightOffset;
        private windDirection;
        private windForce;
        private waveSpeed;
        private waveLength;
        private waveHeight;
        private bumpHeight;
        private bumpSuperimpose;
        private bumpAffectsReflection;
        private waterColor;
        private colorBlendFactor;
        private waterColor2;
        private colorBlendFactor2;
        private disableClipPlane;
        private fresnelSeparate;
        getWaterGeometry(): BABYLON.AbstractMesh;
        getWaterMaterial(): BABYLON.WaterMaterial;
        protected m_waterGeometry: BABYLON.AbstractMesh;
        protected m_waterMaterial: BABYLON.WaterMaterial;
        protected awake(): void;
        protected start(): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected destroy(): void;
    }
}
declare namespace BABYLON {
    /**
     * Babylon windows platform pro class
     * @class WindowsPlatform - All rights reserved (c) 2020 Mackey Kinard
     */
    class WindowsPlatform {
        /** Is xbox live user signed in if platform services enabled. (WinRT) */
        static IsXboxLiveUserSignedIn(systemUser?: Windows.System.User, player?: UNITY.PlayerNumber): boolean;
        /** Validated sign in xbox live user if platform services available. (WinRT) */
        static XboxLiveUserSignIn(player?: UNITY.PlayerNumber, oncomplete?: (result: Microsoft.Xbox.Services.System.SignInResult) => void, onerror?: (error: any) => void, onprogress?: (progress: any) => void): void;
        /** Silent sign in xbox live user if platform services available. (WinRT) */
        static XboxLiveUserSilentSignIn(player?: UNITY.PlayerNumber, oncomplete?: (result: Microsoft.Xbox.Services.System.SignInResult) => void, onerror?: (error: any) => void, onprogress?: (progress: any) => void): Windows.Foundation.Projections.Promise<void>;
        /** Dialog sign in xbox live user if platform services available. (WinRT) */
        static XboxLiveUserDialogSignIn(player?: UNITY.PlayerNumber, oncomplete?: (result: Microsoft.Xbox.Services.System.SignInResult) => void, onerror?: (error: any) => void, onprogress?: (progress: any) => void): Windows.Foundation.Projections.Promise<void>;
        /** Loads a xbox live user profile if platform services available. (WinRT) */
        static LoadXboxLiveUserProfile(player?: UNITY.PlayerNumber, oncomplete?: (result: Microsoft.Xbox.Services.Social.XboxUserProfile) => void, onerror?: (error: any) => void, onprogress?: (progress: any) => void): Windows.Foundation.Projections.Promise<void>;
        /** Get xbox live user if platform services available. (WinRT) */
        static GetXboxLiveUser(player?: UNITY.PlayerNumber): Microsoft.Xbox.Services.System.XboxLiveUser;
        /** Get xbox live user if platform services available. (WinRT) */
        static GetXboxLiveSystemUser(systemUser: Windows.System.User, player?: UNITY.PlayerNumber): Microsoft.Xbox.Services.System.XboxLiveUser;
        /** Get xbox live user context if platform services available. (WinRT) */
        static GetXboxLiveUserContext(player?: UNITY.PlayerNumber): Microsoft.Xbox.Services.XboxLiveContext;
        /** Resets xbox live user context if platform services available. (WinRT) */
        static ResetXboxLiveUserContext(player?: UNITY.PlayerNumber): void;
        /** Get xbox live context property if platform services available. (WinRT) */
        static GetXboxLiveContextProperty(name: any): any;
        /** Get xbox live context property if platform services available. (WinRT) */
        static SetXboxLiveContextProperty(name: any, property: any): void;
        /** Resets xbox live property context bag if platform services available. (WinRT) */
        static ResetXboxLivePropertyContexts(): void;
        /** Sets the Xbox User Sign Out Complete Handler (WinRT) */
        static SetXboxLiveSignOutHandler(handler?: (result: Microsoft.Xbox.Services.System.SignOutCompletedEventArgs) => void): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class PaintShop
    */
    class PaintShop extends UNITY.ScriptComponent {
        static CAR_MATERIAL_01: string;
        static CAR_MATERIAL_02: string;
        static CAR_MATERIAL_03: string;
        static CAR_MATERIAL_04: string;
        static CAR_MATERIAL_05: string;
        static CAR_MATERIAL_06: string;
        static CAR_MATERIAL_07: string;
        static CAR_MATERIAL_08: string;
        static CAR_MATERIAL_09: string;
        static CAR_MATERIAL_10: string;
        static CAR_MATERIAL_11: string;
        static CAR_MATERIAL_12: string;
        static CAR_MATERIAL_13: string;
        static CAR_MATERIAL_14: string;
        static CAR_MATERIAL_15: string;
        static CAR_MATERIAL_16: string;
        static CAR_MATERIAL_17: string;
        static CAR_MATERIAL_18: string;
        static CAR_MATERIAL_19: string;
        static CAR_MATERIAL_20: string;
        private carMaterial;
        private raceCarBody;
        private raceCarDriver;
        protected awake(): void;
        protected destroy(): void;
        setCarMaterial(oneBasedIndex: number): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class RacingHud
    */
    class RacingHud extends UNITY.ScriptComponent {
        protected awake(): void;
        protected start(): void;
        protected fixed(): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected ready(): void;
        protected destroy(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component (Written By: Mackey Kinard)
    * @class Camera_BigScreens
    */
    class Camera_BigScreens extends UNITY.ScriptComponent {
        private static _StaticInstance;
        static get Instance(): Camera_BigScreens;
        private static FRONT_CAMERA_PADDING;
        private static REAR_CAMERA_PADDING;
        private resolution;
        private interval;
        private cycle;
        private timer;
        private points;
        private screens;
        private player;
        private camera;
        private main;
        private rearCamera;
        private frontCamera;
        private currentPoint;
        private currentMount;
        private currentPlayer;
        private keepAspectRatio;
        private setFixedLocations;
        private renderTexture;
        private screenMaterial;
        private focusPlayerVehicle;
        private syncCameraTransform;
        private lookCameraTransform;
        private positionVectorBuffer;
        private positionOffsetBuffer;
        private relativePositionBuffer;
        private relativeRotationBuffer;
        AutoSwitchCamera: boolean;
        SwitchActiveView(updatePlayer?: number, updateMount?: number): void;
        ActivateMainCamera(): void;
        ActivatePlayerCamera(): void;
        GetPlayerFocusVehicle(): BABYLON.TransformNode;
        constructor(transform: BABYLON.TransformNode, scene: BABYLON.Scene, properties?: any);
        protected start(): void;
        protected update(): void;
        protected late(): void;
        protected destroy(): void;
        protected initCameraSetup(): void;
        private canvasWidth;
        private canvasHeight;
        private static RTT_RATIO;
        protected initScreenTextures(): void;
        protected updateCamerTimer(): void;
        protected updateCurrentPoint(updatePoint?: number): void;
        protected updateCurrentPlayer(updatePlayer?: number): void;
        protected updateCurrentMount(updateMount?: number): void;
        protected updateCameraPosition(): void;
        protected switchCameraLocation(updatePlayer?: number, updateMount?: number): void;
        protected setFixedCameraLocation(updatePoint?: number): void;
        protected setCameraClosestToPlayer(): void;
        protected setPlayerFocusCameraMount(): void;
        protected getCameraClosestToPlayer(player: BABYLON.TransformNode): number;
        protected getDistanceToClosestCamera(player: BABYLON.TransformNode, camera: number): number;
        protected getTransformNodesWithName(scene: BABYLON.Scene, name: string): BABYLON.TransformNode[];
    }
    interface ICameraMount {
        positionOffset: number;
        positionSpeed: number;
        rotationSpeed: number;
        lookAtVehicle: boolean;
        smoothSpeeds: boolean;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Script Component
    * @class SpectatorCameraView
    */
    class SpectatorCameraView extends UNITY.ScriptComponent {
        private attachPlayerCamera;
        private autoSwitchCameras;
        protected awake(): void;
        protected start(): void;
        protected fixed(): void;
        protected update(): void;
        protected late(): void;
        protected after(): void;
        protected ready(): void;
        protected destroy(): void;
        protected initSpectatorView(): void;
        protected startSpectatorView(): void;
    }
}
declare namespace PROJECT {
    /**
    * Babylon Shader Material
    * @class VertexSplat
    */
    class VertexSplat extends UNITY.UniversalAlbedoMaterial {
        constructor(name: string, scene: BABYLON.Scene);
        getShaderName(): string;
        getShaderChunk(): string;
        getCustomAttributes(): string[];
        protected updateShaderChunks(): void;
        protected awake(): void;
        protected after(): void;
    }
}
declare namespace UNITY {
    /**
     * Babylon character controller pro class (Unity Style Character Controller System)
     * @class CharacterController - All rights reserved (c) 2020 Mackey Kinard
     */
    class CharacterController extends UNITY.ScriptComponent {
        private _abstractMesh;
        private _avatarRadius;
        private _avatarHeight;
        private _centerOffset;
        private _slopeLimit;
        private _skinWidth;
        private _stepOffset;
        private _capsuleSegments;
        private _minMoveDistance;
        private _isPhysicsReady;
        private _maxCollisions;
        private _createCylinderShape;
        private _movementVelocity;
        private _tmpPositionBuffer;
        updatePosition: boolean;
        syncGhostToTransform: boolean;
        preCreateCylinderShape(): void;
        getAvatarRadius(): number;
        getAvatarHeight(): number;
        getSkinWidth(): number;
        getStepOffset(): number;
        getCenterOffset(): BABYLON.Vector3;
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
        syncMovementState(): void;
        syncTransformToGhostPosition(): void;
        syncGhostToTransformPosition(): void;
        setGhostCollisionState(collision: boolean): void;
        /** Sets the kinematic character position to the specified location. */
        set(x: number, y: number, z: number): void;
        /** Translates the kinematic character with the specfied velocity. */
        move(velocity: BABYLON.Vector3): void;
        /** Jumps the kinematic chacracter with the specified speed. */
        jump(speed: number): void;
        /** Warps the kinematic chacracter to the specified position. */
        warp(position: BABYLON.Vector3): void;
    }
}

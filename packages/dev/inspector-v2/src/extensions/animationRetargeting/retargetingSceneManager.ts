import type { Nullable } from "core/types";
import type { IRetargetOptions } from "core/Animations/animatorAvatar";

import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Engine } from "core/Engines/engine";
import { Vector3 } from "core/Maths/math.vector";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { ShadowOnlyMaterial } from "materials/shadowOnly/shadowOnlyMaterial";
import { GridMaterial } from "materials/grid/gridMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Observable } from "core/Misc/observable";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Scene } from "core/scene";

import { Avatar } from "./avatar";
import { AnimationSource } from "./animation";
import { HTMLConsole } from "./htmlConsole";
import { Avatars, Animations } from "./data";
import type { NamingSchemeManager } from "./namingSchemeManager";
import { FindAvatarFromPath, FindAnimationFromPath, SaveSnippet, TestPlaygroundCode } from "./helperFunctions";

export type { GizmoType } from "./avatar";

export interface IRetargetingParams {
    // Avatar
    avatarPath: string;
    avatarUpdateRestPose: boolean;
    avatarRescaleAvatar: boolean;
    avatarAnimSpeed: number;
    // Animation
    animationPath: string;
    animationUpdateRestPose: boolean;
    animationSpeed: number;
    // Retarget
    fixAnimations: boolean;
    checkHierarchy: boolean;
    retargetAnimationKeys: boolean;
    fixRootPosition: boolean;
    fixGroundReference: boolean;
    fixGroundReferenceDynamicRefNode: boolean;
    rootNodeName: string;
    groundReferenceNodeName: string;
    groundReferenceVerticalAxis: "" | "X" | "Y" | "Z";
}

const Camera1LayerMask = 0x1fffffff;
const Camera2LayerMask = 0x2fffffff;
const SharedLayerMask = 0x30000000;
const ShadowLayerMask1 = 0x10000000;
const ShadowLayerMask2 = 0x20000000;

export class RetargetingSceneManager {
    private _engine: Nullable<Engine> = null;
    private _scene: Nullable<Scene> = null;

    public avatar: Nullable<Avatar> = null;
    public animationSource: Nullable<AnimationSource> = null;
    public htmlConsole!: HTMLConsole;

    private _retargetOptions: Nullable<IRetargetOptions> = null;
    private _lastRetargetParams: Nullable<IRetargetingParams> = null;
    private _isRetargeted = false;

    public readonly onRetargetDoneObservable = new Observable<void>();

    public get isRetargeted(): boolean {
        return this._isRetargeted;
    }

    public get scene(): Nullable<Scene> {
        return this._scene;
    }

    public constructor() {}

    public initialize(canvas: HTMLCanvasElement): void {
        this._engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.htmlConsole = new HTMLConsole();
        this._scene = new Scene(this._engine);
        this._scene.environmentTexture = CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.env", this._scene);

        const camera1 = new ArcRotateCamera("camera1", 1.57, Math.PI / 2.2, 11.5, new Vector3(0, 0.8, 0), this._scene);
        camera1.wheelPrecision = 50;
        camera1.layerMask = Camera1LayerMask;
        camera1.minZ = 0.02;
        camera1.viewport.width = 0.5;
        camera1.attachControl(true);

        const camera2 = camera1.clone("camera2") as ArcRotateCamera;
        camera2.wheelPrecision = 50;
        camera2.layerMask = Camera2LayerMask;
        camera2.minZ = 0.02;
        camera2.viewport.x = 0.5;
        camera2.viewport.width = 0.5;
        camera2.attachControl(true);

        this._scene.activeCameras = [camera1, camera2];

        // Shadow-only ground planes (left / right)
        const sm = new ShadowOnlyMaterial("shadowMat", this._scene);
        const groundShadow1 = MeshBuilder.CreateGround("groundShadow1", { width: 40, height: 40 }, this._scene);
        groundShadow1.position.y = 0.01;
        groundShadow1.material = sm;
        groundShadow1.receiveShadows = true;
        groundShadow1.layerMask = ShadowLayerMask1;

        const groundShadow2 = MeshBuilder.CreateGround("groundShadow2", { width: 40, height: 40 }, this._scene);
        groundShadow2.position.y = 0.01;
        groundShadow2.material = sm;
        groundShadow2.receiveShadows = true;
        groundShadow2.layerMask = ShadowLayerMask2;

        // Shared grid ground
        const gridMaterial = new GridMaterial("grid", this._scene);
        gridMaterial.mainColor.setAll(0.7);
        gridMaterial.lineColor.setAll(0.2);
        gridMaterial.gridRatio = 0.4;
        gridMaterial.majorUnitFrequency = 1000;
        const ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, this._scene);
        ground.material = gridMaterial;
        ground.layerMask = SharedLayerMask;

        // Directional lights (one per viewport)
        const light1 = new DirectionalLight("dirLight1", new Vector3(-1, -4, -2), this._scene);
        light1.shadowMaxZ = 7;
        light1.autoUpdateExtends = false;
        light1.orthoLeft = -1.1;
        light1.orthoRight = 5;
        light1.orthoBottom = -3;
        light1.orthoTop = 4;
        light1.includeOnlyWithLayerMask = Camera1LayerMask;

        const light2 = light1.clone("dirLight2") as DirectionalLight;
        light2.includeOnlyWithLayerMask = Camera2LayerMask;

        const shadowGen1 = new ShadowGenerator(2048, light1);
        shadowGen1.usePercentageCloserFiltering = true;
        shadowGen1.getShadowMap()!.activeCamera = camera1;
        shadowGen1.bias = 0.01;

        const shadowGen2 = new ShadowGenerator(2048, light2);
        shadowGen2.usePercentageCloserFiltering = true;
        shadowGen2.getShadowMap()!.activeCamera = camera2;
        shadowGen2.bias = 0.01;

        // Create Avatar and AnimationSource (separate classes)
        this.avatar = new Avatar(this._scene, camera1, shadowGen1);
        this.animationSource = new AnimationSource(this._scene, camera2, shadowGen2);

        // Delegate bone-click picking to the correct half of the split viewport.
        this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                const x = this._scene!.pointerX;
                const halfWidth = this._engine!.getRenderWidth() / 2;
                if (x <= halfWidth) {
                    this.avatar?.handleBoneClick(x, this._scene!.pointerY);
                } else {
                    this.animationSource?.handleBoneClick(x, this._scene!.pointerY);
                }
            }
        });

        this._engine.runRenderLoop(() => this._scene?.render());
    }

    public retarget(params: IRetargetingParams, namingSchemeManager: NamingSchemeManager): void {
        const { avatar, animationSource } = this;
        if (!avatar?.animatorAvatar || !animationSource?.animationGroup) {
            return;
        }

        this._lastRetargetParams = params;

        avatar.prepareRetargeting();
        animationSource.prepareRetargeting();

        const avatarName = FindAvatarFromPath(params.avatarPath);
        const animationName = FindAnimationFromPath(params.animationPath);
        const sourceScheme = Animations[animationName]?.namingScheme;
        const targetScheme = Avatars[avatarName]?.namingScheme;
        if (!sourceScheme || !targetScheme) {
            return;
        }

        this._retargetOptions = {
            animationGroupName: "avatar",
            fixAnimations: params.fixAnimations,
            checkHierarchy: params.checkHierarchy,
            retargetAnimationKeys: params.retargetAnimationKeys,
            fixRootPosition: params.fixRootPosition,
            fixGroundReference: params.fixGroundReference,
            fixGroundReferenceDynamicRefNode: params.fixGroundReferenceDynamicRefNode,
            rootNodeName: params.rootNodeName === "Auto" ? "" : params.rootNodeName,
            groundReferenceNodeName: params.groundReferenceNodeName,
            groundReferenceVerticalAxis: params.groundReferenceVerticalAxis,
            mapNodeNames: namingSchemeManager.getRemapping(sourceScheme, targetScheme),
        };

        const retargetedGroup = avatar.animatorAvatar.retargetAnimationGroup(animationSource.animationGroup, this._retargetOptions);

        this._isRetargeted = true;
        avatar.setRetargetedAnimation(retargetedGroup, params.avatarAnimSpeed);
        animationSource.play(params.animationSpeed);

        this.onRetargetDoneObservable.notifyObservers();
    }

    public exportToPlayground(): void {
        if (!this._isRetargeted || !this._retargetOptions || !this._lastRetargetParams || !this.avatar || !this.animationSource) {
            return;
        }

        const epsilon = 1e-4;
        const params = this._lastRetargetParams;

        const boneTransformations = this.avatar.buildExportData(params.avatarPath, params.avatarUpdateRestPose, epsilon);
        const animationTransformNodes = this.animationSource.buildExportData(params.animationPath, params.animationUpdateRestPose, epsilon);

        const mapNodes: string[] = [];
        const map = this._retargetOptions.mapNodeNames;
        if (map) {
            for (const [source, target] of map) {
                mapNodes.push(source, target);
            }
        }

        const optionsCopy = { ...this._retargetOptions, mapNodeNames: undefined };
        const code = TestPlaygroundCode.replace("%avatarPath%", params.avatarPath.replace(/"/g, '\\"'))
            .replace("%animationPath%", params.animationPath.replace(/"/g, '\\"'))
            .replace("%retargetOptions%", JSON.stringify(optionsCopy, undefined, 8))
            .replace("%avatarRestPoseUpdate%", JSON.stringify(boneTransformations))
            .replace("%animationRestPoseUpdate%", JSON.stringify(animationTransformNodes))
            .replace("%nameRemapping%", JSON.stringify(mapNodes));

        SaveSnippet(code);
    }

    public resize(): void {
        this._engine?.resize();
    }

    public dispose(): void {
        this.avatar?.dispose();
        this.animationSource?.dispose();
        this.htmlConsole.dispose();
        this._scene?.dispose();
        this._engine?.dispose();
        this.avatar = null;
        this.animationSource = null;
        this._scene = null;
        this._engine = null;
    }
}

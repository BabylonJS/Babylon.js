import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import type { Scene } from "../scene";
import type { Nullable } from "../types";
import type { Bone } from "../Bones/bone";
import type { Skeleton } from "../Bones/skeleton";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import type { LinesMesh } from "../Meshes/linesMesh";
import { CreateLineSystem } from "../Meshes/Builders/linesBuilder";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Material } from "../Materials/material";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import { DynamicTexture } from "../Materials/Textures/dynamicTexture";
import { VertexBuffer } from "../Buffers/buffer";
import { Effect } from "../Materials/effect";

import type { ISkeletonViewerOptions, IBoneWeightShaderOptions, ISkeletonMapShaderOptions, ISkeletonMapShaderColorMapKnot } from "./ISkeletonViewer";
import type { Observer } from "../Misc/observable";

import { CreateSphere } from "../Meshes/Builders/sphereBuilder";
import { ExtrudeShapeCustom } from "../Meshes/Builders/shapeBuilder";
import { TransformNode } from "../Meshes/transformNode";
import { Logger } from "core/Misc/logger";

/**
 * Class used to render a debug view of a given skeleton
 * @see http://www.babylonjs-playground.com/#1BZJVJ#8
 */
export class SkeletonViewer {
    /** public Display constants BABYLON.SkeletonViewer.DISPLAY_LINES */
    public static readonly DISPLAY_LINES = 0;
    /** public Display constants BABYLON.SkeletonViewer.DISPLAY_SPHERES */
    public static readonly DISPLAY_SPHERES = 1;
    /** public Display constants BABYLON.SkeletonViewer.DISPLAY_SPHERE_AND_SPURS */
    public static readonly DISPLAY_SPHERE_AND_SPURS = 2;

    /** public static method to create a BoneWeight Shader
     * @param options The constructor options
     * @param scene The scene that the shader is scoped to
     * @returns The created ShaderMaterial
     * @see http://www.babylonjs-playground.com/#1BZJVJ#395
     */
    static CreateBoneWeightShader(options: IBoneWeightShaderOptions, scene: Scene): ShaderMaterial {
        const skeleton: Skeleton = options.skeleton;
        const colorBase: Color3 = options.colorBase ?? Color3.Black();
        const colorZero: Color3 = options.colorZero ?? Color3.Blue();
        const colorQuarter: Color3 = options.colorQuarter ?? Color3.Green();
        const colorHalf: Color3 = options.colorHalf ?? Color3.Yellow();
        const colorFull: Color3 = options.colorFull ?? Color3.Red();
        const targetBoneIndex: number = options.targetBoneIndex ?? 0;

        Effect.ShadersStore["boneWeights:" + skeleton.name + "VertexShader"] = `precision highp float;

        attribute vec3 position;
        attribute vec2 uv;

        uniform mat4 view;
        uniform mat4 projection;
        uniform mat4 worldViewProjection;

        #include<bonesDeclaration>
        #if NUM_BONE_INFLUENCERS == 0
            attribute vec4 matricesIndices;
            attribute vec4 matricesWeights;
        #endif
        #include<bakedVertexAnimationDeclaration>

        #include<instancesDeclaration>

        varying vec3 vColor;

        uniform vec3 colorBase;
        uniform vec3 colorZero;
        uniform vec3 colorQuarter;
        uniform vec3 colorHalf;
        uniform vec3 colorFull;

        uniform float targetBoneIndex;

        void main() {
            vec3 positionUpdated = position;

            #include<instancesVertex>
            #include<bonesVertex>
            #include<bakedVertexAnimation>

            vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

            vec3 color = colorBase;
            float totalWeight = 0.;
            if(matricesIndices[0] == targetBoneIndex && matricesWeights[0] > 0.){
                totalWeight += matricesWeights[0];
            }
            if(matricesIndices[1] == targetBoneIndex && matricesWeights[1] > 0.){
                totalWeight += matricesWeights[1];
            }
            if(matricesIndices[2] == targetBoneIndex && matricesWeights[2] > 0.){
                totalWeight += matricesWeights[2];
            }
            if(matricesIndices[3] == targetBoneIndex && matricesWeights[3] > 0.){
                totalWeight += matricesWeights[3];
            }

            color = mix(color, colorZero, smoothstep(0., 0.25, totalWeight));
            color = mix(color, colorQuarter, smoothstep(0.25, 0.5, totalWeight));
            color = mix(color, colorHalf, smoothstep(0.5, 0.75, totalWeight));
            color = mix(color, colorFull, smoothstep(0.75, 1.0, totalWeight));
            vColor = color;

        gl_Position = projection * view * worldPos;
        }`;
        Effect.ShadersStore["boneWeights:" + skeleton.name + "FragmentShader"] = `
            precision highp float;
            varying vec3 vPosition;

            varying vec3 vColor;

            void main() {
                vec4 color = vec4(vColor, 1.0);
                gl_FragColor = color;
            }
        `;
        const shader: ShaderMaterial = new ShaderMaterial(
            "boneWeight:" + skeleton.name,
            scene,
            {
                vertex: "boneWeights:" + skeleton.name,
                fragment: "boneWeights:" + skeleton.name,
            },
            {
                attributes: ["position", "normal", "matricesIndices", "matricesWeights"],
                uniforms: [
                    "world",
                    "worldView",
                    "worldViewProjection",
                    "view",
                    "projection",
                    "viewProjection",
                    "colorBase",
                    "colorZero",
                    "colorQuarter",
                    "colorHalf",
                    "colorFull",
                    "targetBoneIndex",
                ],
            }
        );

        shader.setColor3("colorBase", colorBase);
        shader.setColor3("colorZero", colorZero);
        shader.setColor3("colorQuarter", colorQuarter);
        shader.setColor3("colorHalf", colorHalf);
        shader.setColor3("colorFull", colorFull);
        shader.setFloat("targetBoneIndex", targetBoneIndex);

        shader.getClassName = (): string => {
            return "BoneWeightShader";
        };

        shader.transparencyMode = Material.MATERIAL_OPAQUE;

        return shader;
    }

    /** public static method to create a BoneWeight Shader
     * @param options The constructor options
     * @param scene The scene that the shader is scoped to
     * @returns The created ShaderMaterial
     */
    static CreateSkeletonMapShader(options: ISkeletonMapShaderOptions, scene: Scene) {
        const skeleton: Skeleton = options.skeleton;
        const colorMap: ISkeletonMapShaderColorMapKnot[] = options.colorMap ?? [
            {
                color: new Color3(1, 0.38, 0.18),
                location: 0,
            },
            {
                color: new Color3(0.59, 0.18, 1.0),
                location: 0.2,
            },
            {
                color: new Color3(0.59, 1, 0.18),
                location: 0.4,
            },
            {
                color: new Color3(1, 0.87, 0.17),
                location: 0.6,
            },
            {
                color: new Color3(1, 0.17, 0.42),
                location: 0.8,
            },
            {
                color: new Color3(0.17, 0.68, 1.0),
                location: 1.0,
            },
        ];

        const bufferWidth: number = skeleton.bones.length + 1;
        const colorMapBuffer: number[] = SkeletonViewer._CreateBoneMapColorBuffer(bufferWidth, colorMap, scene);
        const shader = new ShaderMaterial(
            "boneWeights:" + skeleton.name,
            scene,
            {
                vertexSource:
                    `precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

            uniform mat4 view;
            uniform mat4 projection;
            uniform mat4 worldViewProjection;
            uniform float colorMap[` +
                    skeleton.bones.length * 4 +
                    `];

            #include<bonesDeclaration>
            #if NUM_BONE_INFLUENCERS == 0
                attribute vec4 matricesIndices;
                attribute vec4 matricesWeights;
            #endif
            #include<bakedVertexAnimationDeclaration>
            #include<instancesDeclaration>

            varying vec3 vColor;

            void main() {
                vec3 positionUpdated = position;

                #include<instancesVertex>
                #include<bonesVertex>
                #include<bakedVertexAnimation>

                vec3 color = vec3(0.);
                bool first = true;

                for (int i = 0; i < 4; i++) {
                    int boneIdx = int(matricesIndices[i]);
                    float boneWgt = matricesWeights[i];

                    vec3 c = vec3(colorMap[boneIdx * 4 + 0], colorMap[boneIdx * 4 + 1], colorMap[boneIdx * 4 + 2]);

                    if (boneWgt > 0.) {
                        if (first) {
                            first = false;
                            color = c;
                        } else {
                            color = mix(color, c, boneWgt);
                        }
                    }
                }

                vColor = color;

                vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

                gl_Position = projection * view * worldPos;
            }`,
                fragmentSource: `
            precision highp float;
            varying vec3 vColor;

            void main() {
                vec4 color = vec4( vColor, 1.0 );
                gl_FragColor = color;
            }
            `,
            },
            {
                attributes: ["position", "normal", "matricesIndices", "matricesWeights"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "colorMap"],
            }
        );

        shader.setFloats("colorMap", colorMapBuffer);

        shader.getClassName = (): string => {
            return "SkeletonMapShader";
        };

        shader.transparencyMode = Material.MATERIAL_OPAQUE;

        return shader;
    }

    /** private static method to create a BoneWeight Shader
     * @param size The size of the buffer to create (usually the bone count)
     * @param colorMap The gradient data to generate
     * @param scene The scene that the shader is scoped to
     * @returns an Array of floats from the color gradient values
     */
    private static _CreateBoneMapColorBuffer(size: number, colorMap: ISkeletonMapShaderColorMapKnot[], scene: Scene) {
        const tempGrad = new DynamicTexture("temp", { width: size, height: 1 }, scene, false);
        const ctx = tempGrad.getContext();
        const grad = ctx.createLinearGradient(0, 0, size, 0);

        colorMap.forEach((stop) => {
            grad.addColorStop(stop.location, stop.color.toHexString());
        });

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, 1);
        tempGrad.update();
        const buffer: number[] = [];
        const data: Uint8ClampedArray = ctx.getImageData(0, 0, size, 1).data;
        const rUnit = 1 / 255;
        for (let i = 0; i < data.length; i++) {
            buffer.push(data[i] * rUnit);
        }
        tempGrad.dispose();
        return buffer;
    }

    /** If SkeletonViewer scene scope. */
    private _scene: Scene;

    /** Gets or sets the color used to render the skeleton */
    public color: Color3 = Color3.White();

    /** Array of the points of the skeleton fo the line view. */
    private _debugLines = new Array<Array<Vector3>>();

    /** The SkeletonViewers Mesh. */
    private _debugMesh: Nullable<LinesMesh>;

    /** The local axes Meshes. */
    private _localAxes: Nullable<LinesMesh> = null;

    /** If SkeletonViewer is enabled. */
    private _isEnabled = true;

    /** If SkeletonViewer is ready. */
    private _ready: boolean;

    /** SkeletonViewer render observable. */
    private _obs: Nullable<Observer<Scene>> = null;

    /** The Utility Layer to render the gizmos in. */
    private _utilityLayer: Nullable<UtilityLayerRenderer>;

    private _boneIndices: Set<number>;

    /** Gets the Scene. */
    get scene(): Scene {
        return this._scene;
    }
    /** Gets the utilityLayer. */
    get utilityLayer(): Nullable<UtilityLayerRenderer> {
        return this._utilityLayer;
    }
    /** Checks Ready Status. */
    get isReady(): Boolean {
        return this._ready;
    }
    /** Sets Ready Status. */
    set ready(value: boolean) {
        this._ready = value;
    }
    /** Gets the debugMesh */
    get debugMesh(): Nullable<AbstractMesh> | Nullable<LinesMesh> {
        return this._debugMesh;
    }
    /** Sets the debugMesh */
    set debugMesh(value: Nullable<AbstractMesh> | Nullable<LinesMesh>) {
        this._debugMesh = value as any;
    }
    /** Gets the displayMode */
    get displayMode(): number {
        return this.options.displayMode || SkeletonViewer.DISPLAY_LINES;
    }
    /** Sets the displayMode */
    set displayMode(value: number) {
        if (value > SkeletonViewer.DISPLAY_SPHERE_AND_SPURS) {
            value = SkeletonViewer.DISPLAY_LINES;
        }
        this.options.displayMode = value;
    }
    /**
     * Creates a new SkeletonViewer
     * @param skeleton defines the skeleton to render
     * @param mesh defines the mesh attached to the skeleton
     * @param scene defines the hosting scene
     * @param autoUpdateBonesMatrices defines a boolean indicating if bones matrices must be forced to update before rendering (true by default)
     * @param renderingGroupId defines the rendering group id to use with the viewer
     * @param options All of the extra constructor options for the SkeletonViewer
     */
    constructor(
        /** defines the skeleton to render */
        public skeleton: Skeleton,
        /** defines the mesh attached to the skeleton */
        public mesh: Nullable<AbstractMesh>,
        /** The Scene scope*/
        scene: Scene,
        /** defines a boolean indicating if bones matrices must be forced to update before rendering (true by default)  */
        public autoUpdateBonesMatrices: boolean = true,
        /** defines the rendering group id to use with the viewer */
        public renderingGroupId: number = 3,
        /** is the options for the viewer */
        public options: Partial<ISkeletonViewerOptions> = {}
    ) {
        this._scene = scene;
        this._ready = false;

        //Defaults
        options.pauseAnimations = options.pauseAnimations ?? true;
        options.returnToRest = options.returnToRest ?? false;
        options.displayMode = options.displayMode ?? SkeletonViewer.DISPLAY_LINES;
        options.displayOptions = options.displayOptions ?? {};
        options.displayOptions.midStep = options.displayOptions.midStep ?? 0.235;
        options.displayOptions.midStepFactor = options.displayOptions.midStepFactor ?? 0.155;
        options.displayOptions.sphereBaseSize = options.displayOptions.sphereBaseSize ?? 0.15;
        options.displayOptions.sphereScaleUnit = options.displayOptions.sphereScaleUnit ?? 2;
        options.displayOptions.sphereFactor = options.displayOptions.sphereFactor ?? 0.865;
        options.displayOptions.spurFollowsChild = options.displayOptions.spurFollowsChild ?? false;
        options.displayOptions.showLocalAxes = options.displayOptions.showLocalAxes ?? false;
        options.displayOptions.localAxesSize = options.displayOptions.localAxesSize ?? 0.075;
        options.computeBonesUsingShaders = options.computeBonesUsingShaders ?? true;
        options.useAllBones = options.useAllBones ?? true;

        this._boneIndices = new Set();

        if (!options.useAllBones) {
            const initialMeshBoneIndices = mesh?.getVerticesData(VertexBuffer.MatricesIndicesKind);
            const initialMeshBoneWeights = mesh?.getVerticesData(VertexBuffer.MatricesWeightsKind);

            if (initialMeshBoneIndices && initialMeshBoneWeights) {
                for (let i = 0; i < initialMeshBoneIndices.length; ++i) {
                    const index = initialMeshBoneIndices[i],
                        weight = initialMeshBoneWeights[i];
                    if (weight !== 0) {
                        this._boneIndices.add(index);
                    }
                }
            }
        }

        /* Create Utility Layer */
        this._utilityLayer = new UtilityLayerRenderer(this._scene, false);
        this._utilityLayer.pickUtilitySceneFirst = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = true;

        let displayMode = this.options.displayMode || 0;
        if (displayMode > SkeletonViewer.DISPLAY_SPHERE_AND_SPURS) {
            displayMode = SkeletonViewer.DISPLAY_LINES;
        }
        this.displayMode = displayMode;
        //Prep the Systems
        this.update();
        this._bindObs();
    }

    /** The Dynamic bindings for the update functions */
    private _bindObs(): void {
        switch (this.displayMode) {
            case SkeletonViewer.DISPLAY_LINES: {
                this._obs = this.scene.onBeforeRenderObservable.add(() => {
                    this._displayLinesUpdate();
                });
                break;
            }
        }
    }

    /** Update the viewer to sync with current skeleton state, only used to manually update. */
    public update(): void {
        switch (this.displayMode) {
            case SkeletonViewer.DISPLAY_LINES: {
                this._displayLinesUpdate();
                break;
            }
            case SkeletonViewer.DISPLAY_SPHERES: {
                this._buildSpheresAndSpurs(true);
                break;
            }
            case SkeletonViewer.DISPLAY_SPHERE_AND_SPURS: {
                this._buildSpheresAndSpurs(false);
                break;
            }
        }

        this._buildLocalAxes();
    }

    /** Gets or sets a boolean indicating if the viewer is enabled */
    public set isEnabled(value: boolean) {
        if (this.isEnabled === value) {
            return;
        }

        this._isEnabled = value;

        if (this.debugMesh) {
            this.debugMesh.setEnabled(value);
        }

        if (value && !this._obs) {
            this._bindObs();
        } else if (!value && this._obs) {
            this.scene.onBeforeRenderObservable.remove(this._obs);
            this._obs = null;
        }
    }

    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    private _getBonePosition(position: Vector3, bone: Bone, meshMat: Matrix, x = 0, y = 0, z = 0): void {
        const tmat = TmpVectors.Matrix[0];
        const parentBone = bone.getParent();
        tmat.copyFrom(bone.getLocalMatrix());

        if (x !== 0 || y !== 0 || z !== 0) {
            const tmat2 = TmpVectors.Matrix[1];
            Matrix.IdentityToRef(tmat2);
            tmat2.setTranslationFromFloats(x, y, z);
            tmat2.multiplyToRef(tmat, tmat);
        }

        if (parentBone) {
            tmat.multiplyToRef(parentBone.getAbsoluteMatrix(), tmat);
        }

        tmat.multiplyToRef(meshMat, tmat);

        position.x = tmat.m[12];
        position.y = tmat.m[13];
        position.z = tmat.m[14];
    }

    private _getLinesForBonesWithLength(bones: Bone[], mesh: Nullable<AbstractMesh>): void {
        const len = bones.length;

        let matrix;
        let meshPos;
        if (mesh) {
            matrix = mesh.getWorldMatrix();
            meshPos = mesh.position;
        } else {
            matrix = new Matrix();
            meshPos = bones[0].position;
        }
        let idx = 0;
        for (let i = 0; i < len; i++) {
            const bone = bones[i];
            let points = this._debugLines[idx];

            if (bone._index === -1 || (!this._boneIndices.has(bone.getIndex()) && !this.options.useAllBones)) {
                continue;
            }
            if (!points) {
                points = [Vector3.Zero(), Vector3.Zero()];
                this._debugLines[idx] = points;
            }
            this._getBonePosition(points[0], bone, matrix);
            this._getBonePosition(points[1], bone, matrix, 0, bone.length, 0);
            points[0].subtractInPlace(meshPos);
            points[1].subtractInPlace(meshPos);
            idx++;
        }
    }

    private _getLinesForBonesNoLength(bones: Bone[]): void {
        const len = bones.length;
        let boneNum = 0;

        const mesh = this.mesh;
        let transformNode;
        let meshPos;
        if (mesh) {
            transformNode = mesh;
            meshPos = mesh.position;
        } else {
            transformNode = new TransformNode("");
            meshPos = bones[0].position;
        }
        for (let i = len - 1; i >= 0; i--) {
            const childBone = bones[i];
            const parentBone = childBone.getParent();
            if (!parentBone || (!this._boneIndices.has(childBone.getIndex()) && !this.options.useAllBones)) {
                continue;
            }
            let points = this._debugLines[boneNum];
            if (!points) {
                points = [Vector3.Zero(), Vector3.Zero()];
                this._debugLines[boneNum] = points;
            }
            childBone.getAbsolutePositionToRef(transformNode, points[0]);
            parentBone.getAbsolutePositionToRef(transformNode, points[1]);
            points[0].subtractInPlace(meshPos);
            points[1].subtractInPlace(meshPos);
            boneNum++;
        }
        if (!mesh) {
            transformNode.dispose();
        }
    }

    /**
     * function to revert the mesh and scene back to the initial state.
     * @param animationState
     */
    private _revert(animationState: boolean): void {
        if (this.options.pauseAnimations) {
            this.scene.animationsEnabled = animationState;
            this.utilityLayer!.utilityLayerScene!.animationsEnabled = animationState;
        }
    }

    /**
     * function to get the absolute bind pose of a bone by accumulating transformations up the bone hierarchy.
     * @param bone
     * @param matrix
     */
    private _getAbsoluteBindPoseToRef(bone: Nullable<Bone>, matrix: Matrix) {
        if (bone === null || bone._index === -1) {
            matrix.copyFrom(Matrix.Identity());
            return;
        }

        this._getAbsoluteBindPoseToRef(bone.getParent(), matrix);
        bone.getBindMatrix().multiplyToRef(matrix, matrix);
        return;
    }

    /**
     * function to build and bind sphere joint points and spur bone representations.
     * @param spheresOnly
     */
    private _buildSpheresAndSpurs(spheresOnly = true): void {
        if (this._debugMesh) {
            this._debugMesh.dispose();
            this._debugMesh = null;
            this.ready = false;
        }

        this._ready = false;
        const utilityLayerScene = this.utilityLayer?.utilityLayerScene!;
        const bones: Bone[] = this.skeleton.bones;
        const spheres: Array<[Mesh, Bone]> = [];
        const spurs: Mesh[] = [];

        const animationState = this.scene.animationsEnabled;

        try {
            if (this.options.pauseAnimations) {
                this.scene.animationsEnabled = false;
                utilityLayerScene.animationsEnabled = false;
            }

            if (this.options.returnToRest) {
                this.skeleton.returnToRest();
            }

            if (this.autoUpdateBonesMatrices) {
                this.skeleton.computeAbsoluteMatrices();
            }

            let longestBoneLength = Number.NEGATIVE_INFINITY;
            const displayOptions = this.options.displayOptions || {};

            for (let i = 0; i < bones.length; i++) {
                const bone = bones[i];

                if (bone._index === -1 || (!this._boneIndices.has(bone.getIndex()) && !this.options.useAllBones)) {
                    continue;
                }

                const boneAbsoluteBindPoseTransform = new Matrix();
                this._getAbsoluteBindPoseToRef(bone, boneAbsoluteBindPoseTransform);

                const anchorPoint = new Vector3();

                boneAbsoluteBindPoseTransform.decompose(undefined, undefined, anchorPoint);

                bone.children.forEach((bc) => {
                    const childAbsoluteBindPoseTransform: Matrix = new Matrix();
                    bc.getLocalMatrix().multiplyToRef(boneAbsoluteBindPoseTransform, childAbsoluteBindPoseTransform);
                    const childPoint = new Vector3();
                    childAbsoluteBindPoseTransform.decompose(undefined, undefined, childPoint);
                    const distanceFromParent = Vector3.Distance(anchorPoint, childPoint);
                    if (distanceFromParent > longestBoneLength) {
                        longestBoneLength = distanceFromParent;
                    }
                    if (spheresOnly) {
                        return;
                    }

                    const dir = childPoint.clone().subtract(anchorPoint.clone());
                    const h = dir.length();
                    const up = dir.normalize().scale(h);

                    const midStep = displayOptions.midStep || 0.165;
                    const midStepFactor = displayOptions.midStepFactor || 0.215;

                    const up0 = up.scale(midStep);

                    const spur = ExtrudeShapeCustom(
                        "skeletonViewer",
                        {
                            shape: [new Vector3(1, -1, 0), new Vector3(1, 1, 0), new Vector3(-1, 1, 0), new Vector3(-1, -1, 0), new Vector3(1, -1, 0)],
                            path: [Vector3.Zero(), up0, up],
                            scaleFunction: (i: number) => {
                                switch (i) {
                                    case 0:
                                    case 2:
                                        return 0;
                                    case 1:
                                        return h * midStepFactor;
                                }
                                return 0;
                            },
                            sideOrientation: Mesh.DEFAULTSIDE,
                            updatable: false,
                        },
                        utilityLayerScene
                    );

                    const numVertices = spur.getTotalVertices();
                    const mwk: number[] = [],
                        mik: number[] = [];

                    for (let i = 0; i < numVertices; i++) {
                        mwk.push(1, 0, 0, 0);

                        // Select verts at end of spur (ie vert 10 to 14) and bind to child
                        // bone if spurFollowsChild is enabled.
                        if (displayOptions.spurFollowsChild && i > 9) {
                            mik.push(bc.getIndex(), 0, 0, 0);
                        } else {
                            mik.push(bone.getIndex(), 0, 0, 0);
                        }
                    }

                    spur.position = anchorPoint.clone();

                    spur.setVerticesData(VertexBuffer.MatricesWeightsKind, mwk, false);
                    spur.setVerticesData(VertexBuffer.MatricesIndicesKind, mik, false);
                    spur.convertToFlatShadedMesh();

                    spurs.push(spur);
                });

                const sphereBaseSize = displayOptions.sphereBaseSize || 0.2;

                const sphere = CreateSphere(
                    "skeletonViewer",
                    {
                        segments: 6,
                        diameter: sphereBaseSize,
                        updatable: true,
                    },
                    utilityLayerScene
                );

                const numVertices = sphere.getTotalVertices();

                const mwk: number[] = [],
                    mik: number[] = [];

                for (let i = 0; i < numVertices; i++) {
                    mwk.push(1, 0, 0, 0);
                    mik.push(bone.getIndex(), 0, 0, 0);
                }

                sphere.setVerticesData(VertexBuffer.MatricesWeightsKind, mwk, false);
                sphere.setVerticesData(VertexBuffer.MatricesIndicesKind, mik, false);

                sphere.position = anchorPoint.clone();
                spheres.push([sphere, bone]);
            }

            const sphereScaleUnit = displayOptions.sphereScaleUnit || 2;
            const sphereFactor = displayOptions.sphereFactor || 0.85;

            const meshes = [];
            for (let i = 0; i < spheres.length; i++) {
                const [sphere, bone] = spheres[i];
                const scale = 1 / (sphereScaleUnit / longestBoneLength);

                let _stepsOut = 0;
                let _b = bone;

                while (_b.getParent() && (_b.getParent() as Bone).getIndex() !== -1) {
                    _stepsOut++;
                    _b = _b.getParent() as Bone;
                }
                sphere.scaling.scaleInPlace(scale * Math.pow(sphereFactor, _stepsOut));
                meshes.push(sphere);
            }

            this.debugMesh = Mesh.MergeMeshes(meshes.concat(spurs), true, true);
            if (this.debugMesh) {
                this.debugMesh.renderingGroupId = this.renderingGroupId;
                this.debugMesh.skeleton = this.skeleton;
                this.debugMesh.parent = this.mesh;
                this.debugMesh.computeBonesUsingShaders = this.options.computeBonesUsingShaders ?? true;
                this.debugMesh.alwaysSelectAsActiveMesh = true;
            }

            const light = this.utilityLayer!._getSharedGizmoLight();
            light.intensity = 0.7;

            this._revert(animationState);
            this.ready = true;
        } catch (err) {
            Logger.Error(err);
            this._revert(animationState);
            this.dispose();
        }
    }

    private _buildLocalAxes(): void {
        if (this._localAxes) {
            this._localAxes.dispose();
        }

        this._localAxes = null;

        const displayOptions = this.options.displayOptions || {};

        if (!displayOptions.showLocalAxes) {
            return;
        }

        const targetScene = this._utilityLayer!.utilityLayerScene;
        const size = displayOptions.localAxesSize || 0.075;
        const lines = [];
        const colors = [];
        const red = new Color4(1, 0, 0, 1);
        const green = new Color4(0, 1, 0, 1);
        const blue = new Color4(0, 0, 1, 1);

        const mwk: number[] = [];
        const mik: number[] = [];
        const vertsPerBone = 6;

        for (const i in this.skeleton.bones) {
            const bone = this.skeleton.bones[i];

            if (bone._index === -1 || (!this._boneIndices.has(bone.getIndex()) && !this.options.useAllBones)) {
                continue;
            }

            const boneAbsoluteBindPoseTransform = new Matrix();
            const boneOrigin = new Vector3();

            this._getAbsoluteBindPoseToRef(bone, boneAbsoluteBindPoseTransform);
            boneAbsoluteBindPoseTransform.decompose(undefined, TmpVectors.Quaternion[0], boneOrigin);

            const m = new Matrix();
            TmpVectors.Quaternion[0].toRotationMatrix(m);

            const boneAxisX = Vector3.TransformCoordinates(new Vector3(0 + size, 0, 0), m);
            const boneAxisY = Vector3.TransformCoordinates(new Vector3(0, 0 + size, 0), m);
            const boneAxisZ = Vector3.TransformCoordinates(new Vector3(0, 0, 0 + size), m);

            const axisX = [boneOrigin, boneOrigin.add(boneAxisX)];
            const axisY = [boneOrigin, boneOrigin.add(boneAxisY)];
            const axisZ = [boneOrigin, boneOrigin.add(boneAxisZ)];

            const linePoints = [axisX, axisY, axisZ];
            const lineColors = [
                [red, red],
                [green, green],
                [blue, blue],
            ];

            lines.push(...linePoints);
            colors.push(...lineColors);

            for (let j = 0; j < vertsPerBone; j++) {
                mwk.push(1, 0, 0, 0);
                mik.push(bone.getIndex(), 0, 0, 0);
            }
        }

        this._localAxes = CreateLineSystem("localAxes", { lines: lines, colors: colors, updatable: true }, targetScene);
        this._localAxes.setVerticesData(VertexBuffer.MatricesWeightsKind, mwk, false);
        this._localAxes.setVerticesData(VertexBuffer.MatricesIndicesKind, mik, false);
        this._localAxes.skeleton = this.skeleton;
        this._localAxes.renderingGroupId = this.renderingGroupId + 1;
        this._localAxes.parent = this.mesh;
        this._localAxes.computeBonesUsingShaders = this.options.computeBonesUsingShaders ?? true;
    }

    /** Update the viewer to sync with current skeleton state, only used for the line display. */
    private _displayLinesUpdate(): void {
        if (!this._utilityLayer) {
            return;
        }

        if (this.autoUpdateBonesMatrices) {
            this.skeleton.computeAbsoluteMatrices();
        }

        if (this.skeleton.bones[0].length === undefined) {
            this._getLinesForBonesNoLength(this.skeleton.bones);
        } else {
            this._getLinesForBonesWithLength(this.skeleton.bones, this.mesh);
        }

        const targetScene = this._utilityLayer.utilityLayerScene;

        if (targetScene) {
            if (!this._debugMesh) {
                this._debugMesh = CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: null }, targetScene);
                this._debugMesh.renderingGroupId = this.renderingGroupId;
            } else {
                CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: this._debugMesh }, targetScene);
            }
            if (this.mesh) {
                this._debugMesh.position.copyFrom(this.mesh.position);
            } else {
                this._debugMesh.position.copyFrom(this.skeleton.bones[0].position);
            }
            this._debugMesh.color = this.color;
        }
    }
    /** Changes the displayMode of the skeleton viewer
     * @param mode The displayMode numerical value
     */
    public changeDisplayMode(mode: number): void {
        const wasEnabled = this.isEnabled ? true : false;
        if (this.displayMode !== mode) {
            this.isEnabled = false;
            if (this._debugMesh) {
                this._debugMesh.dispose();
                this._debugMesh = null;
                this.ready = false;
            }
            this.displayMode = mode;

            this.update();
            this._bindObs();
            this.isEnabled = wasEnabled;
        }
    }

    /** Sets a display option of the skeleton viewer
     *
     * | Option           | Type    | Default | Description |
     * | ---------------- | ------- | ------- | ----------- |
     * | midStep          | float   | 0.235   | A percentage between a bone and its child that determines the widest part of a spur. Only used when `displayMode` is set to `DISPLAY_SPHERE_AND_SPURS`. |
     * | midStepFactor    | float   | 0.15    | Mid step width expressed as a factor of the length. A value of 0.5 makes the spur width half of the spur length. Only used when `displayMode` is set to `DISPLAY_SPHERE_AND_SPURS`. |
     * | sphereBaseSize   | float   | 2       | Sphere base size. Only used when `displayMode` is set to `DISPLAY_SPHERE_AND_SPURS`. |
     * | sphereScaleUnit  | float   | 0.865   | Sphere scale factor used to scale spheres in relation to the longest bone. Only used when `displayMode` is set to `DISPLAY_SPHERE_AND_SPURS`. |
     * | spurFollowsChild | boolean | false   | Whether a spur should attach its far end to the child bone. |
     * | showLocalAxes    | boolean | false   | Displays local axes on all bones. |
     * | localAxesSize    | float   | 0.075   | Determines the length of each local axis. |
     *
     * @param option String of the option name
     * @param value The numerical option value
     */
    public changeDisplayOptions(option: string, value: number): void {
        const wasEnabled = this.isEnabled ? true : false;
        (this.options.displayOptions as any)[option] = value;
        this.isEnabled = false;
        if (this._debugMesh) {
            this._debugMesh.dispose();
            this._debugMesh = null;
            this.ready = false;
        }
        this.update();
        this._bindObs();
        this.isEnabled = wasEnabled;
    }

    /** Release associated resources */
    public dispose(): void {
        this.isEnabled = false;
        if (this._debugMesh) {
            this._debugMesh.dispose();
            this._debugMesh = null;
        }

        if (this._utilityLayer) {
            this._utilityLayer.dispose();
            this._utilityLayer = null;
        }

        this.ready = false;
    }
}

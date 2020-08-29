import { Vector3, Matrix, TmpVectors, Quaternion } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { Scene } from "../scene";
import { Nullable } from "../types";
import { Bone } from "../Bones/bone";
import { Skeleton } from "../Bones/skeleton";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { LinesMesh } from "../Meshes/linesMesh";
import { LinesBuilder } from "../Meshes/Builders/linesBuilder";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Material } from '../Materials/material';
import { StandardMaterial } from '../Materials/standardMaterial';
import { ShaderMaterial } from '../Materials/shaderMaterial';
import { DynamicTexture } from '../Materials/Textures/dynamicTexture';
import { VertexBuffer } from '../Meshes/buffer';

import { ISkeletonViewerOptions, IBoneWeightShaderOptions, ISkeletonMapShaderOptions, ISkeletonMapShaderColorMapKnot } from './ISkeletonViewer';
import { Observer } from '../Misc/observable';

import { SphereBuilder } from '../Meshes/Builders/sphereBuilder';
import { ShapeBuilder } from '../Meshes/Builders/shapeBuilder';

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
     */
    static CreateBoneWeightShader(options: IBoneWeightShaderOptions, scene: Scene): ShaderMaterial {

        let skeleton: Skeleton = options.skeleton;
        let colorBase: Color3 = options.colorBase ?? Color3.Black();
        let colorZero: Color3 = options.colorZero ?? Color3.Blue();
        let colorQuarter: Color3 = options.colorQuarter ?? Color3.Green();
        let colorHalf: Color3 = options.colorHalf ?? Color3.Yellow();
        let colorFull: Color3 = options.colorFull ?? Color3.Red();
        let targetBoneIndex: number = options.targetBoneIndex ?? 0;

        let shader: ShaderMaterial = new ShaderMaterial('boneWeights:' + skeleton.name, scene,
        {
            vertexSource:
            `precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

            uniform mat4 view;
            uniform mat4 projection;
            uniform mat4 worldViewProjection;

            #include<bonesDeclaration>
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


                gl_Position = projection * view * worldPos;
            }`,
            fragmentSource:
            `
            precision highp float;
            varying vec3 vPosition;

            varying vec3 vColor;

            void main() {
                vec4 color = vec4(vColor, 1.0);
                gl_FragColor = color;
            }
            `
        },
        {
            attributes: ['position', 'normal'],
            uniforms: [
                'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'viewProjection',
                'colorBase', 'colorZero', 'colorQuarter', 'colorHalf', 'colorFull', 'targetBoneIndex'
            ]
        });

        shader.setColor3('colorBase', colorBase);
        shader.setColor3('colorZero', colorZero);
        shader.setColor3('colorQuarter', colorQuarter);
        shader.setColor3('colorHalf', colorHalf);
        shader.setColor3('colorFull', colorFull);
        shader.setFloat('targetBoneIndex', targetBoneIndex);
        shader.transparencyMode = Material.MATERIAL_OPAQUE;

        return shader;
    }

    /** public static method to create a BoneWeight Shader
     * @param options The constructor options
     * @param scene The scene that the shader is scoped to
     * @returns The created ShaderMaterial
     */
    static CreateSkeletonMapShader(options: ISkeletonMapShaderOptions, scene: Scene) {

        let skeleton: Skeleton = options.skeleton;
        let colorMap: ISkeletonMapShaderColorMapKnot[] = options.colorMap ?? [
            {
                color: new Color3(1, 0.38, 0.18),
                location : 0
            },
            {
                color: new Color3(.59, 0.18, 1.00),
                location : 0.2
            },
            {
                color: new Color3(0.59, 1, 0.18),
                location : 0.4
            },
            {
               color: new Color3(1, 0.87, 0.17),
                location : 0.6
            },
            {
                color: new Color3(1, 0.17, 0.42),
                location : 0.8
            },
            {
                color: new Color3(0.17, 0.68, 1.0),
                location : 1.0
            }
        ];

        let bufferWidth: number = skeleton.bones.length + 1;
        let colorMapBuffer: number[] = SkeletonViewer._CreateBoneMapColorBuffer(bufferWidth, colorMap, scene);
        colorMapBuffer.forEach((v, idx) => colorMapBuffer[idx] = v / 255);

        let shader = new ShaderMaterial('boneWeights:' + skeleton.name, scene,
        {
            vertexSource:
            `precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

            uniform mat4 view;
            uniform mat4 projection;
            uniform mat4 worldViewProjection;
            uniform float colorMap[` + ((skeleton.bones.length) * 4) + `];

            #include<bonesDeclaration>
            #include<instancesDeclaration>

            varying vec3 vColor;

            void main() {
                vec3 positionUpdated = position;

                #include<instancesVertex>
                #include<bonesVertex>

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
            fragmentSource:
            `
            precision highp float;
            varying vec3 vColor;

            void main() {
                vec4 color = vec4( vColor, 1.0 );
                gl_FragColor = color;
            }
            `
        },
        {
            attributes: ['position', 'normal'],
            uniforms: [
                'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'viewProjection',
                'colorMap'
            ]
        });

        shader.onBindObservable.add(() => {
            shader.setFloats('colorMap', colorMapBuffer);
        });

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
        let tempGrad = new DynamicTexture('temp', {width: size, height: 1}, scene, false);
        let ctx = tempGrad.getContext();
        let grad = ctx.createLinearGradient(0, 0, size, 0);

        colorMap.forEach((stop) => {
            grad.addColorStop(stop.location, stop.color.toHexString());
        });

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, 1);
        tempGrad.update();
        let buffer: number[] = [];
        let data: Uint8ClampedArray = ctx.getImageData(0, 0, size, 1).data;
        let rUnit = 1 / 255;
        for (let i = 0; i < data.length; i++) {
            buffer.push(data[i] * rUnit);
        }
        tempGrad.dispose();
        return buffer;
    }

    /** If SkeletonViewer scene scope. */
    private _scene : Scene;

    /** Gets or sets the color used to render the skeleton */
    public color: Color3 = Color3.White();

    /** Array of the points of the skeleton fo the line view. */
    private _debugLines = new Array<Array<Vector3>>();

    /** The SkeletonViewers Mesh. */
    private _debugMesh: Nullable<LinesMesh>;

    /** If SkeletonViewer is enabled. */
    private _isEnabled = false;

    /** If SkeletonViewer is ready. */
    private _ready : boolean;

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
         this._debugMesh = (value as any);
    }
    /** Gets the material */
    get material(): StandardMaterial {
        return this.material;
    }
    /** Sets the material */
    set material(value: StandardMaterial) {
         this.material = value;
    }
    /** Gets the material */
    get displayMode(): number {
        return this.options.displayMode || SkeletonViewer.DISPLAY_LINES;
    }
    /** Sets the material */
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
        public mesh: AbstractMesh,
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
        options.currentStateIsRestPose = options.currentStateIsRestPose ?? false;
        options.returnToRest = ( options.currentStateIsRestPose) ? false : options.returnToRest ?? ( options.currentStateIsRestPose) ? false : true;
        options.displayMode = options.displayMode ?? SkeletonViewer.DISPLAY_LINES;
        options.displayOptions = options.displayOptions ?? {};
        options.displayOptions.midStep = options.displayOptions.midStep ?? 0.235;
        options.displayOptions.midStepFactor = options.displayOptions.midStepFactor ?? 0.155;
        options.displayOptions.sphereBaseSize = options.displayOptions.sphereBaseSize ?? 0.15;
        options.displayOptions.sphereScaleUnit = options.displayOptions.sphereScaleUnit ?? 2;
        options.displayOptions.sphereFactor = options.displayOptions.sphereFactor ?? 0.865;
        options.computeBonesUsingShaders = options.computeBonesUsingShaders ?? true;
        options.useAllBones = options.useAllBones ?? true;        
                
        const initialMeshBoneIndices = mesh.getVerticesData(VertexBuffer.MatricesIndicesKind);
        const initialMeshBoneWeights = mesh.getVerticesData(VertexBuffer.MatricesWeightsKind);        
        const baseNodeBoneIndices = []
        this._boneIndices = new Set(); 

        if (options.useAllBones) {   
            for (let i = 0; i < skeleton.bones.length; ++i){
                baseNodeBoneIndices.push(skeleton.bones[i].getIndex(), 0, 0, 0)
            }                    
            for (let i = 0; i < baseNodeBoneIndices.length; ++i) {
                this._boneIndices.add(baseNodeBoneIndices[i]);   
            }            
        }else {
            if (initialMeshBoneIndices && initialMeshBoneWeights) {
                for (let i = 0; i < initialMeshBoneIndices.length; ++i) {
                    const index = initialMeshBoneIndices[i], weight = initialMeshBoneWeights[i];
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
        switch (this.displayMode){
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
        switch (this.displayMode){
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
        var tmat = TmpVectors.Matrix[0];
        var parentBone = bone.getParent();
        tmat.copyFrom(bone.getLocalMatrix());

        if (x !== 0 || y !== 0 || z !== 0) {
            var tmat2 = TmpVectors.Matrix[1];
            Matrix.IdentityToRef(tmat2);
            tmat2.setTranslationFromFloats(x, y, z);
            tmat2.multiplyToRef(tmat, tmat);
        }

        if (parentBone) {
            tmat.multiplyToRef(parentBone.getAbsoluteTransform(), tmat);
        }

        tmat.multiplyToRef(meshMat, tmat);

        position.x = tmat.m[12];
        position.y = tmat.m[13];
        position.z = tmat.m[14];
    }

    private _getLinesForBonesWithLength(bones: Bone[], meshMat: Matrix): void {
        var len = bones.length;

        let mesh = this.mesh._effectiveMesh;
        var meshPos = mesh.position;
        let idx = 0;
        for (var i = 0; i < len; i++) {
            var bone = bones[i];
            var points = this._debugLines[idx];
            if (bone._index === -1 || !this._boneIndices.has(bone.getIndex())) {
                continue;
            }
            if (!points) {
                points = [Vector3.Zero(), Vector3.Zero()];
                this._debugLines[idx] = points;
            }
            this._getBonePosition(points[0], bone, meshMat);
            this._getBonePosition(points[1], bone, meshMat, 0, bone.length, 0);
            points[0].subtractInPlace(meshPos);
            points[1].subtractInPlace(meshPos);
            idx++;
        }
    }

    private _getLinesForBonesNoLength(bones: Bone[]): void {
        var len = bones.length;
        var boneNum = 0;

        let mesh = this.mesh._effectiveMesh;
        var meshPos = mesh.position;
        for (var i = len - 1; i >= 0; i--) {
            var childBone = bones[i];
            var parentBone = childBone.getParent();
            if (!parentBone || !this._boneIndices.has(childBone.getIndex())) {
                continue;
            }
            var points = this._debugLines[boneNum];
            if (!points) {
                points = [Vector3.Zero(), Vector3.Zero()];
                this._debugLines[boneNum] = points;
            }
            childBone.getAbsolutePositionToRef(mesh, points[0]);
            parentBone.getAbsolutePositionToRef(mesh, points[1]);
            points[0].subtractInPlace(meshPos);
            points[1].subtractInPlace(meshPos);
            boneNum++;
        }
    }

    /** function to revert the mesh and scene back to the initial state. */
    private _revert(animationState: boolean): void {
        if (this.options.pauseAnimations) {
            this.scene.animationsEnabled = animationState;
        }
    }

    /** function to build and bind sphere joint points and spur bone representations. */
    private _buildSpheresAndSpurs(spheresOnly = true): void {

        if (this._debugMesh) {
            this._debugMesh.dispose();
            this._debugMesh = null;
            this.ready = false;
        }

        this._ready = false;
        let scene = this.scene;
        let bones: Bone[] = this.skeleton.bones;
        let spheres: Array<[Mesh, Bone]> = [];
        let spurs: Mesh[] = [];

        const animationState = scene.animationsEnabled;

        try {
            if (this.options.pauseAnimations) {
                scene.animationsEnabled = false;
            }

            if(this.options.currentStateIsRestPose){
                let _s = Vector3.Zero()
                let _r = Quaternion.Identity()
                let _t = Vector3.Zero()                
                this.skeleton.bones.forEach( b =>{                    
                    b.getLocalMatrix().decompose(_s, _r, _t)
                    b.setRestPose(Matrix.Compose(_s, _r, _t))
                 })
            }else{
                if (this.options.returnToRest) {
                    this.skeleton.returnToRest();
                }
            }

            if (this.autoUpdateBonesMatrices) {
                this.skeleton.computeAbsoluteTransforms();
            }           

            let longestBoneLength = Number.NEGATIVE_INFINITY;
            let getAbsoluteRestPose = function(bone: Nullable<Bone>, matrix: Matrix) {
                if (bone === null || bone._index === -1) {
                    matrix.copyFrom(Matrix.Identity());                    
                    return;
                }
                getAbsoluteRestPose(bone.getParent(), matrix);
                bone.getBindPose().multiplyToRef(matrix, matrix);
                return;
            };

            let displayOptions = this.options.displayOptions || {};

            for (let i = 0; i < bones.length; i++) {
                let bone = bones[i]; 
                
                if (bone._index === -1 || !this._boneIndices.has(bone.getIndex())){
                    continue;
                }

                let boneAbsoluteRestTransform = new Matrix();
                getAbsoluteRestPose(bone, boneAbsoluteRestTransform);

                let anchorPoint = new Vector3();
                boneAbsoluteRestTransform.decompose(undefined, undefined, anchorPoint);

                bone.children.forEach((bc, i) => {
                    let childAbsoluteRestTransform : Matrix = new Matrix();
                    bc.getRestPose().multiplyToRef(boneAbsoluteRestTransform, childAbsoluteRestTransform);
                    let childPoint = new Vector3();
                    childAbsoluteRestTransform.decompose(undefined, undefined, childPoint);
                    let distanceFromParent = Vector3.Distance(anchorPoint, childPoint);
                    if (distanceFromParent > longestBoneLength) {
                        longestBoneLength = distanceFromParent;
                    }
                    if (spheresOnly) {
                        return;
                    }

                    let dir = childPoint.clone().subtract(anchorPoint.clone());
                    let h = dir.length();
                    let up = dir.normalize().scale(h);

                    let midStep = displayOptions.midStep || 0.165;
                    let midStepFactor = displayOptions.midStepFactor || 0.215;

                    let up0 = up.scale(midStep);

                    let spur = ShapeBuilder.ExtrudeShapeCustom('skeletonViewer',
                    {
                        shape:  [
                                    new Vector3(1, -1,  0),
                                    new Vector3(1,  1,  0),
                                    new Vector3(-1,  1,  0),
                                    new Vector3(-1, -1,  0),
                                    new Vector3(1, -1,  0)
                                ],
                        path:   [ Vector3.Zero(), up0, up ],
                        scaleFunction:
                                (i: number) => {
                                    switch (i){
                                        case 0:
                                        case 2:
                                        return 0;
                                        case 1:
                                        return h * midStepFactor;
                                    }
                                    return 0;
                                },
                        sideOrientation: Mesh.DEFAULTSIDE,
                        updatable: false
                    },  scene);

                    spur.convertToFlatShadedMesh();

                    let numVertices = spur.getTotalVertices();
                    let mwk: number[] = [], mik: number[] = [];

                    for (let i = 0; i < numVertices; i++) {
                        mwk.push(1, 0, 0, 0);
                        mik.push(bone.getIndex(), 0, 0, 0);
                    }
                    spur.position = anchorPoint.clone();

                    spur.setVerticesData(VertexBuffer.MatricesWeightsKind, mwk, false);
                    spur.setVerticesData(VertexBuffer.MatricesIndicesKind, mik, false);

                    spurs.push(spur);
                });

                let sphereBaseSize = displayOptions.sphereBaseSize || 0.2;

                let sphere = SphereBuilder.CreateSphere('skeletonViewer', {
                    segments: 6,
                    diameter: sphereBaseSize,
                    updatable: true
                }, scene);

                const numVertices = sphere.getTotalVertices();

                let mwk: number[] = [], mik: number[] = [];

                for (let i = 0; i < numVertices; i++) {
                    mwk.push(1, 0, 0, 0);
                    mik.push(bone.getIndex(), 0, 0, 0);
                }

                sphere.setVerticesData(VertexBuffer.MatricesWeightsKind, mwk, false);
                sphere.setVerticesData(VertexBuffer.MatricesIndicesKind, mik, false);
                console.log('Anchor Point', anchorPoint)
                sphere.position = anchorPoint.clone();
                spheres.push([sphere, bone]);
            }

            let sphereScaleUnit = displayOptions.sphereScaleUnit || 2;
            let sphereFactor = displayOptions.sphereFactor || 0.85;

            const meshes = [];
            for (let i = 0; i < spheres.length; i++) {
                let [sphere, bone] = spheres[i];
                let scale = 1 / (sphereScaleUnit / longestBoneLength);

                let _stepsOut = 0;
                let _b = bone;

                while ((_b.getParent()) && (_b.getParent() as Bone).getIndex() !== -1) {
                    _stepsOut++;
                    _b = (_b.getParent() as Bone);
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

            this._revert(animationState);
            this.ready = true;
        } catch (err) {
            console.error(err);
            this._revert(animationState);
            this.dispose();
        }
    }

    /** Update the viewer to sync with current skeleton state, only used for the line display. */
    private  _displayLinesUpdate(): void {
        if (!this._utilityLayer) {
            return;
        }

        if (this.autoUpdateBonesMatrices) {
            this.skeleton.computeAbsoluteTransforms();
        }

        let mesh = this.mesh._effectiveMesh;

        if (this.skeleton.bones[0].length === undefined) {
            this._getLinesForBonesNoLength(this.skeleton.bones);
        } else {
            this._getLinesForBonesWithLength(this.skeleton.bones, mesh.getWorldMatrix());
        }

        console.log(this._debugLines)

        const targetScene = this._utilityLayer.utilityLayerScene;

        if (targetScene) {
            if (!this._debugMesh) {
                this._debugMesh = LinesBuilder.CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: null }, targetScene);
                this._debugMesh.renderingGroupId = this.renderingGroupId;
            } else {
                LinesBuilder.CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: this._debugMesh }, targetScene);
            }
            this._debugMesh.position.copyFrom(this.mesh.position);
            this._debugMesh.color = this.color;
        }
    }
    /** Changes the displayMode of the skeleton viewer
     * @param mode The displayMode numerical value
     */
    public changeDisplayMode(mode: number): void {
        let wasEnabled = (this.isEnabled) ? true : false;
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

    /** Changes the displayMode of the skeleton viewer
     * @param option String of the option name
     * @param value The numerical option value
     */
    public changeDisplayOptions(option: string, value: number): void {
        let wasEnabled = (this.isEnabled) ? true : false;
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
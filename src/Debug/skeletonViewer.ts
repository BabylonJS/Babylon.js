import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { Scene } from "../scene";
import { Nullable } from "../types";
import { Bone } from "../Bones/bone";
import { Skeleton } from "../Bones/skeleton";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { LinesMesh } from "../Meshes/linesMesh";
import { LinesBuilder } from "../Meshes/Builders/linesBuilder";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";

/**
     * Class used to render a debug view of a given skeleton
     * @see http://www.babylonjs-playground.com/#1BZJVJ#8
     */
export class SkeletonViewer {
    /** Gets or sets the color used to render the skeleton */
    public color: Color3 = Color3.White();

    private _scene: Scene;
    private _debugLines = new Array<Array<Vector3>>();
    private _debugMesh: Nullable<LinesMesh>;
    private _isEnabled = false;
    private _renderFunction: () => void;
    private _utilityLayer: Nullable<UtilityLayerRenderer>;

    /**
     * Returns the mesh used to render the bones
     */
    public get debugMesh(): Nullable<LinesMesh> {
        return this._debugMesh;
    }

    /**
     * Creates a new SkeletonViewer
     * @param skeleton defines the skeleton to render
     * @param mesh defines the mesh attached to the skeleton
     * @param scene defines the hosting scene
     * @param autoUpdateBonesMatrices defines a boolean indicating if bones matrices must be forced to update before rendering (true by default)
     * @param renderingGroupId defines the rendering group id to use with the viewer
     */
    constructor(
        /** defines the skeleton to render */
        public skeleton: Skeleton,
        /** defines the mesh attached to the skeleton */
        public mesh: AbstractMesh,
        scene: Scene,
        /** defines a boolean indicating if bones matrices must be forced to update before rendering (true by default)  */
        public autoUpdateBonesMatrices = true,
        /** defines the rendering group id to use with the viewer */
        public renderingGroupId = 1,
        /** defines an optional utility layer to render the helper on */
    ) {
        this._scene = scene;

        this._utilityLayer = new UtilityLayerRenderer(this._scene, false);
        this._utilityLayer.pickUtilitySceneFirst = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = true;

        this.update();

        this._renderFunction = this.update.bind(this);
    }

    /** Gets or sets a boolean indicating if the viewer is enabled */
    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;

        if (value) {
            this._scene.registerBeforeRender(this._renderFunction);
        } else {
            this._scene.unregisterBeforeRender(this._renderFunction);
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
        for (var i = 0; i < len; i++) {
            var bone = bones[i];
            var points = this._debugLines[i];
            if (!points) {
                points = [Vector3.Zero(), Vector3.Zero()];
                this._debugLines[i] = points;
            }
            this._getBonePosition(points[0], bone, meshMat);
            this._getBonePosition(points[1], bone, meshMat, 0, bone.length, 0);
            points[0].subtractInPlace(meshPos);
            points[1].subtractInPlace(meshPos);
        }
    }

    private _getLinesForBonesNoLength(bones: Bone[], meshMat: Matrix): void {
        var len = bones.length;
        var boneNum = 0;

        let mesh = this.mesh._effectiveMesh;
        var meshPos = mesh.position;
        for (var i = len - 1; i >= 0; i--) {
            var childBone = bones[i];
            var parentBone = childBone.getParent();
            if (!parentBone) {
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

    /** Update the viewer to sync with current skeleton state */
    public update() {
        if (!this._utilityLayer) {
            return;
        }

        if (this.autoUpdateBonesMatrices) {
            this.skeleton.computeAbsoluteTransforms();
        }

        let mesh = this.mesh._effectiveMesh;

        if (this.skeleton.bones[0].length === undefined) {
            this._getLinesForBonesNoLength(this.skeleton.bones, mesh.getWorldMatrix());
        } else {
            this._getLinesForBonesWithLength(this.skeleton.bones, mesh.getWorldMatrix());
        }
        const targetScene = this._utilityLayer.utilityLayerScene;

        if (!this._debugMesh) {
            this._debugMesh = LinesBuilder.CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: null }, targetScene);
            this._debugMesh.renderingGroupId = this.renderingGroupId;
        } else {
            LinesBuilder.CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: this._debugMesh }, targetScene);
        }
        this._debugMesh.position.copyFrom(this.mesh.position);
        this._debugMesh.color = this.color;
    }

    /** Release associated resources */
    public dispose() {

        this.isEnabled = false;

        if (this._debugMesh) {
            this.isEnabled = false;
            this._debugMesh.dispose();
            this._debugMesh = null;
        }

        if (this._utilityLayer) {
            this._utilityLayer.dispose();
            this._utilityLayer = null;
        }
    }
}
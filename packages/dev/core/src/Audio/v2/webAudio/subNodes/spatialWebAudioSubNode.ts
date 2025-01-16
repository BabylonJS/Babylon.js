import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { TransformNode } from "../../../../Meshes/transformNode";
import type { Nullable } from "../../../../types";
import { _SpatialAudioDefaults } from "../../abstractAudio";
import { _SpatialAudioSubNode } from "../../abstractAudio/subNodes/spatialAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

const TempMatrix = new Matrix();
const TempQuaternion = new Quaternion();
const TempVector = new Vector3();

function d2r(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function r2d(radians: number): number {
    return (radians * 180) / Math.PI;
}

/** @internal */
export async function _CreateSpatialAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_SpatialAudioSubNode> {
    return new _SpatialWebAudioSubNode(engine);
}

/** @internal */
class _SpatialWebAudioSubNode extends _SpatialAudioSubNode {
    private _position = Vector3.Zero();
    private _rotationAngles: Vector3 = _SpatialAudioDefaults.Rotation.clone();
    private _rotationAnglesDirty = false;
    private _rotationQuaternion: Quaternion = _SpatialAudioDefaults.RotationQuaternion.clone();

    /** @internal */
    public readonly node: PannerNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new PannerNode(engine.audioContext);
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return d2r(this.node.coneInnerAngle);
    }

    public set coneInnerAngle(value: number) {
        this.node.coneInnerAngle = r2d(value);
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return d2r(this.node.coneOuterAngle);
    }

    public set coneOuterAngle(value: number) {
        this.node.coneOuterAngle = r2d(value);
    }

    /** @internal */
    public get coneOuterVolume(): number {
        return this.node.coneOuterGain;
    }

    public set coneOuterVolume(value: number) {
        this.node.coneOuterGain = value;
    }

    /** @internal */
    public get distanceModel(): "linear" | "inverse" | "exponential" {
        return this.node.distanceModel;
    }

    public set distanceModel(value: "linear" | "inverse" | "exponential") {
        this.node.distanceModel = value;

        // Wiggle the max distance to make the change take effect.
        const maxDistance = this.node.maxDistance;
        this.node.maxDistance = maxDistance + 0.001;
        this.node.maxDistance = maxDistance;
    }

    /** @internal */
    public get maxDistance(): number {
        return this.node.maxDistance;
    }

    public set maxDistance(value: number) {
        this.node.maxDistance = value;
    }

    /** @internal */
    public get panningModel(): "equalpower" | "HRTF" {
        return this.node.panningModel;
    }

    public set panningModel(value: "equalpower" | "HRTF") {
        this.node.panningModel = value;
    }

    /** @internal */
    public get position(): Vector3 {
        return this._position;
    }

    public set position(value: Vector3) {
        this.node.positionX.value = this._position.x = value.x;
        this.node.positionY.value = this._position.y = value.y;
        this.node.positionZ.value = this._position.z = value.z;
    }

    /** @internal */
    public get referenceDistance(): number {
        return this.node.refDistance;
    }

    public set referenceDistance(value: number) {
        this.node.refDistance = value;
    }

    /** @internal */
    public get rolloffFactor(): number {
        return this.node.rolloffFactor;
    }

    public set rolloffFactor(value: number) {
        this.node.rolloffFactor = value;
    }

    /** @internal */
    public get rotation(): Vector3 {
        if (this._rotationAnglesDirty) {
            this._rotationAnglesDirty = false;
            this._rotationQuaternion.toEulerAnglesToRef(this._rotationAngles);
        }

        return this._rotationAngles;
    }

    public set rotation(value: Vector3) {
        Quaternion.FromEulerAnglesToRef(value.x, value.y, value.z, TempQuaternion);
        this.rotationQuaternion = TempQuaternion;
        this._rotationAnglesDirty = true;
    }

    /** @internal */
    public get rotationQuaternion(): Quaternion {
        return this._rotationQuaternion;
    }

    public set rotationQuaternion(value: Quaternion) {
        this._rotationQuaternion.copyFrom(value);

        const mat = Matrix.FromQuaternionToRef(value, TempMatrix);
        const orientation = Vector3.TransformNormalToRef(Vector3.Right(), mat, TempVector);

        this.node.orientationX.value = orientation.x;
        this.node.orientationY.value = orientation.y;
        this.node.orientationZ.value = orientation.z;
    }

    /** @internal */
    public get transformNode(): Nullable<TransformNode> {
        // TODO: Implement `transformNode` property.
        return null;
    }

    public set transformNode(value: Nullable<TransformNode>) {
        // TODO: Implement `transformNode` property.
    }

    /** @internal */
    public get inNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get outNode(): AudioNode {
        return this.node;
    }

    protected override _connect(node: IWebAudioInNode): void {
        super._connect(node);

        if (node.inNode) {
            this.node.connect(node.inNode);
        }
    }

    protected override _disconnect(node: IWebAudioInNode): void {
        super._disconnect(node);

        if (node.inNode) {
            this.node.disconnect(node.inNode);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "SpatialWebAudioSubNode";
    }
}

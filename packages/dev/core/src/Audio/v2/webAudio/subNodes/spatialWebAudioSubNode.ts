import { Matrix, Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { TransformNode } from "../../../../Meshes/transformNode";
import type { Nullable } from "../../../../types";
import { _SpatialAudioDefault, _SpatialAudioSubNode } from "../../subNodes/spatialAudioSubNode";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

const TempMatrix = new Matrix();
const TempQuaternion = new Quaternion();
const TempVector = new Vector3();

/** @internal */
export async function _CreateSpatialAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_SpatialAudioSubNode> {
    return new _SpatialWebAudioSubNode(engine);
}

/** @internal */
class _SpatialWebAudioSubNode extends _SpatialAudioSubNode {
    private _rotationQuaternion: Quaternion = _SpatialAudioDefault.RotationQuaternion.clone();
    private _rotationAngles: Vector3 = _SpatialAudioDefault.Rotation.clone();
    private _rotationAnglesDirty = false;

    /** @internal */
    public readonly node: PannerNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        this.node = new PannerNode(engine.audioContext);
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return this.node.coneInnerAngle;
    }

    public set coneInnerAngle(value: number) {
        this.node.coneInnerAngle = value;
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return this.node.coneOuterAngle;
    }

    public set coneOuterAngle(value: number) {
        this.node.coneOuterAngle = value;
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
        return new Vector3(this.node.positionX.value, this.node.positionY.value, this.node.positionZ.value);
    }

    public set position(value: Vector3) {
        this.node.positionX.value = value.x;
        this.node.positionY.value = value.y;
        this.node.positionZ.value = value.z;
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

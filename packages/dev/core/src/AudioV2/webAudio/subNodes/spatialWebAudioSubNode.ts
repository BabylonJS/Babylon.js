import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector";
import { _SpatialAudioSubNode } from "../../abstractAudio/subNodes/spatialAudioSubNode";
import { _SpatialAudioDefaults } from "../../abstractAudio/subProperties/abstractSpatialAudio";
import type { _WebAudioEngine } from "../webAudioEngine";
import type { IWebAudioInNode } from "../webAudioNode";

const TmpMatrix = Matrix.Zero();
const TmpQuaternion = new Quaternion();
const TmpVector = Vector3.Zero();

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
export class _SpatialWebAudioSubNode extends _SpatialAudioSubNode {
    private _lastPosition: Vector3 = Vector3.Zero();
    private _lastRotation: Vector3 = Vector3.Zero();
    private _lastRotationQuaternion: Quaternion = new Quaternion();

    /** @internal */
    public readonly position = _SpatialAudioDefaults.position.clone();
    /** @internal */
    public readonly rotation: Vector3 = _SpatialAudioDefaults.rotation.clone();
    /** @internal */
    public readonly rotationQuaternion: Quaternion = _SpatialAudioDefaults.rotationQuaternion.clone();

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
    public get inNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public get outNode(): AudioNode {
        return this.node;
    }

    /** @internal */
    public updatePosition(): void {
        if (this._lastPosition.equalsWithEpsilon(this.position)) {
            return;
        }

        this.node.positionX.value = this.position.x;
        this.node.positionY.value = this.position.y;
        this.node.positionZ.value = this.position.z;

        this._lastPosition.copyFrom(this.position);
    }

    /** @internal */
    public updateRotation(): void {
        if (!this._lastRotationQuaternion.equalsWithEpsilon(this.rotationQuaternion)) {
            TmpQuaternion.copyFrom(this.rotationQuaternion);
            this._lastRotationQuaternion.copyFrom(this.rotationQuaternion);
        } else if (!this._lastRotation.equalsWithEpsilon(this.rotation)) {
            Quaternion.FromEulerAnglesToRef(this.rotation.x, this.rotation.y, this.rotation.z, TmpQuaternion);
            this._lastRotation.copyFrom(this.rotation);
        } else {
            return;
        }

        Matrix.FromQuaternionToRef(TmpQuaternion, TmpMatrix);
        Vector3.TransformNormalToRef(Vector3.RightReadOnly, TmpMatrix, TmpVector);

        this.node.orientationX.value = TmpVector.x;
        this.node.orientationY.value = TmpVector.y;
        this.node.orientationZ.value = TmpVector.z;
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node.inNode) {
            this.node.connect(node.inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node.inNode) {
            this.node.disconnect(node.inNode);
        }

        return true;
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialWebAudioSubNode";
    }
}

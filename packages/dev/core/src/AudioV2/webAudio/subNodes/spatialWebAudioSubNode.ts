import { Matrix, Quaternion, Vector3 } from "../../../Maths/math.vector.pure";
import { _SpatialAudioSubNode } from "../../abstractAudio/subNodes/spatialAudioSubNode";
import { _SpatialAudioDefaults } from "../../abstractAudio/subProperties/abstractSpatialAudio";
import { _WebAudioParameterComponent } from "../components/webAudioParameterComponent";
import { type _WebAudioEngine } from "../webAudioEngine";
import { type IWebAudioInNode } from "../webAudioNode";

const TmpMatrix = Matrix.Zero();
const TmpQuaternion = new Quaternion();

function D2r(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function R2d(radians: number): number {
    return (radians * 180) / Math.PI;
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/require-await
export async function _CreateSpatialAudioSubNodeAsync(engine: _WebAudioEngine): Promise<_SpatialAudioSubNode> {
    return new _SpatialWebAudioSubNode(engine);
}

/** @internal */
export class _SpatialWebAudioSubNode extends _SpatialAudioSubNode {
    private _attenuation: _WebAudioParameterComponent;
    private readonly _attenuationNode: GainNode;
    private readonly _inputNode: GainNode;
    private _lastOrientation: Vector3 = Vector3.Zero();
    private _lastPosition: Vector3 = Vector3.Zero();
    private _lastRotation: Vector3 = Vector3.Zero();
    private _lastRotationQuaternion: Quaternion = new Quaternion();
    private _orientationX: _WebAudioParameterComponent;
    private _orientationY: _WebAudioParameterComponent;
    private _orientationZ: _WebAudioParameterComponent;
    private _panningEnabled = _SpatialAudioDefaults.panningEnabled;
    private _positionX: _WebAudioParameterComponent;
    private _positionY: _WebAudioParameterComponent;
    private _positionZ: _WebAudioParameterComponent;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly orientation: Vector3 = _SpatialAudioDefaults.orientation.clone();
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

        this._inputNode = new GainNode(engine._audioContext);
        this._attenuationNode = new GainNode(engine._audioContext);
        this._attenuation = new _WebAudioParameterComponent(engine, this._attenuationNode.gain);
        this.node = new PannerNode(engine._audioContext);

        this._orientationX = new _WebAudioParameterComponent(engine, this.node.orientationX);
        this._orientationY = new _WebAudioParameterComponent(engine, this.node.orientationY);
        this._orientationZ = new _WebAudioParameterComponent(engine, this.node.orientationZ);

        this._positionX = new _WebAudioParameterComponent(engine, this.node.positionX);
        this._positionY = new _WebAudioParameterComponent(engine, this.node.positionY);
        this._positionZ = new _WebAudioParameterComponent(engine, this.node.positionZ);

        this._connectActiveInput();
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._attenuation.dispose();
        this._orientationX.dispose();
        this._orientationY.dispose();
        this._orientationZ.dispose();
        this._positionX.dispose();
        this._positionY.dispose();
        this._positionZ.dispose();

        this._inputNode.disconnect();
        this._attenuationNode.disconnect();
        this.node.disconnect();
    }

    /** @internal */
    public get coneInnerAngle(): number {
        return D2r(this.node.coneInnerAngle);
    }

    public set coneInnerAngle(value: number) {
        this.node.coneInnerAngle = R2d(value);
    }

    /** @internal */
    public get coneOuterAngle(): number {
        return D2r(this.node.coneOuterAngle);
    }

    public set coneOuterAngle(value: number) {
        this.node.coneOuterAngle = R2d(value);
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

        this._updateAttenuation();
    }

    /** @internal */
    public get minDistance(): number {
        return this.node.refDistance;
    }

    public set minDistance(value: number) {
        this.node.refDistance = value;
        this._updateAttenuation();
    }

    /** @internal */
    public get maxDistance(): number {
        return this.node.maxDistance;
    }

    public set maxDistance(value: number) {
        this.node.maxDistance = value;
        this._updateAttenuation();
    }

    /** @internal */
    public get panningEnabled(): boolean {
        return this._panningEnabled;
    }

    public set panningEnabled(value: boolean) {
        if (this._panningEnabled === value) {
            return;
        }

        this._panningEnabled = value;
        this._connectActiveInput();
        this._updateAttenuation();
    }

    /** @internal */
    public get panningModel(): "equalpower" | "HRTF" {
        return this.node.panningModel;
    }

    public set panningModel(value: "equalpower" | "HRTF") {
        this.node.panningModel = value;
    }

    /** @internal */
    public get rolloffFactor(): number {
        return this.node.rolloffFactor;
    }

    public set rolloffFactor(value: number) {
        this.node.rolloffFactor = value;
        this._updateAttenuation();
    }

    /** @internal */
    public get _inNode(): AudioNode {
        return this._inputNode;
    }

    /** @internal */
    public get _outNode(): AudioNode {
        return this._panningEnabled ? this.node : this._attenuationNode;
    }

    /** @internal */
    public _updatePosition(): void {
        if (this._lastPosition.equalsWithEpsilon(this.position)) {
            this._updateAttenuation();
            return;
        }

        this._positionX.targetValue = this.position.x;
        this._positionY.targetValue = this.position.y;
        this._positionZ.targetValue = this.position.z;

        this._lastPosition.copyFrom(this.position);
        this._updateAttenuation();
    }

    /** @internal */
    public _updateRotation(): void {
        let rotated = false;
        if (!this._lastRotationQuaternion.equalsWithEpsilon(this.rotationQuaternion)) {
            TmpQuaternion.copyFrom(this.rotationQuaternion);
            this._lastRotationQuaternion.copyFrom(this.rotationQuaternion);
            rotated = true;
        } else if (!this._lastRotation.equalsWithEpsilon(this.rotation)) {
            Quaternion.FromEulerAnglesToRef(this.rotation.x, this.rotation.y, this.rotation.z, TmpQuaternion);
            this._lastRotation.copyFrom(this.rotation);
            rotated = true;
        } else if (this._lastOrientation.equalsWithEpsilon(this.orientation)) {
            return;
        }

        if (rotated) {
            Matrix.FromQuaternionToRef(TmpQuaternion, TmpMatrix);
            Vector3.TransformNormalToRef(Vector3.RightReadOnly, TmpMatrix, this.orientation);
        }

        this._orientationX.targetValue = this.orientation.x;
        this._orientationY.targetValue = this.orientation.y;
        this._orientationZ.targetValue = this.orientation.z;
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node._inNode) {
            this.node.connect(node._inNode);
            this._attenuationNode.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node._inNode) {
            this.node.disconnect(node._inNode);
            this._attenuationNode.disconnect(node._inNode);
        }

        return true;
    }

    /** @internal */
    public getClassName(): string {
        return "_SpatialWebAudioSubNode";
    }

    private _connectActiveInput(): void {
        this._inputNode.disconnect();

        if (this._panningEnabled) {
            this._inputNode.connect(this.node);
        } else {
            this._inputNode.connect(this._attenuationNode);
        }
    }

    private _updateAttenuation(): void {
        if (this._panningEnabled) {
            this._attenuation.targetValue = 1;
            return;
        }

        const listenerPosition = this.engine.listener.position;
        const deltaX = this.position.x - listenerPosition.x;
        const deltaY = this.position.y - listenerPosition.y;
        const deltaZ = this.position.z - listenerPosition.z;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        const minDistance = Math.max(this.minDistance, 0);
        let attenuation = 1;

        switch (this.distanceModel) {
            case "linear":
                {
                    const maxDistance = Math.max(this.maxDistance, minDistance);
                    const clampedDistance = Math.min(Math.max(distance, minDistance), maxDistance);

                    attenuation =
                        maxDistance === minDistance ? (distance <= minDistance ? 1 : 0) : 1 - (this.rolloffFactor * (clampedDistance - minDistance)) / (maxDistance - minDistance);
                }
                break;
            case "inverse":
                if (minDistance === 0) {
                    attenuation = 0;
                    break;
                }

                attenuation = minDistance / (minDistance + this.rolloffFactor * (Math.max(distance, minDistance) - minDistance));
                break;
            case "exponential":
                if (minDistance === 0) {
                    attenuation = 0;
                    break;
                }

                attenuation = Math.pow(Math.max(distance, minDistance) / minDistance, -this.rolloffFactor);
                break;
        }

        this._attenuation.targetValue = Math.min(Math.max(attenuation, 0), 1);
    }
}

/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import { Vector3 } from "../../Maths/math.vector";
import type { AbstractMesh } from "../../Meshes";
import type { Nullable } from "../../types";

export abstract class AbstractAudioListener extends AbstractAudioNode {
    public constructor(parent: AbstractAudioNode) {
        super(parent.engine, AudioNodeType.InputOutput);

        this.setParent(parent);
    }

    private _position = Vector3.Zero();
    private _forward = Vector3.Forward();
    private _up = Vector3.Up();

    public get position(): Vector3 {
        return this._position;
    }

    public set position(value: Vector3) {
        this._position.copyFrom(value);
    }

    public get forward(): Vector3 {
        return this._forward;
    }

    public set forward(value: Vector3) {
        this._forward.copyFrom(value);
    }

    public get up(): Vector3 {
        return this._up;
    }

    public set up(value: Vector3) {
        this._up.copyFrom(value);
    }

    private _attachedMesh: Nullable<AbstractMesh> = null;

    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attachedMesh;
    }

    public attachToMesh(mesh: AbstractMesh) {
        this._attachedMesh = mesh;
    }
}

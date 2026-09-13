/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Runtime evaluation of FBX constraints as a Babylon behavior. Attached to the constrained node, it solves the
 * constraint before every render (and once when attached) the way the FBX SDK evaluates FbxConstraint: the
 * targets' world transforms are blended by weight and drive the node's local transform.
 *
 * All maths happen in FBX space, i.e. relative to the loader's root node, so the handedness conversion applied
 * at the root never enters the solve.
 */
import { type Behavior } from "core/Behaviors/behavior";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type TransformNode } from "core/Meshes/transformNode.pure";
import { type FBXConstraintData } from "./interpreter/constraints";
import { eulerToMatrixXYZ } from "./interpreter/transform";

const DEG2RAD = Math.PI / 180;

/** Resolved target of a constraint. */
export interface FBXConstraintBehaviorTarget {
    node: TransformNode;
    weight: number;
    /** Offset matrix for parent constraints (in the target's space) */
    offset: Matrix;
}

/** Options resolved by the loader when creating the behavior. */
export interface FBXConstraintBehaviorOptions {
    /** Root of the loaded asset; world matrices are made relative to it */
    root: TransformNode;
    targets: FBXConstraintBehaviorTarget[];
    upNode: Nullable<TransformNode>;
    /** Scene up axis in FBX space */
    sceneUp: Vector3;
}

/** Babylon behavior evaluating an FBX aim, parent, position, rotation or scale constraint. */
export class FBXConstraintBehavior implements Behavior<TransformNode> {
    public readonly name: string;
    public attachedNode: Nullable<TransformNode> = null;
    /** Set to false to pause the constraint without detaching it */
    public enabled = true;

    private _observer: Nullable<Observer<Scene>> = null;
    private readonly _tmp = {
        world: new Matrix(),
        invRoot: new Matrix(),
        parent: new Matrix(),
        local: new Matrix(),
        scale: new Vector3(),
        rotation: new Quaternion(),
        translation: new Vector3(),
    };

    public constructor(
        public readonly constraint: FBXConstraintData,
        private readonly _options: FBXConstraintBehaviorOptions
    ) {
        this.name = `fbxConstraint:${constraint.name}`;
    }

    public init(): void {}

    public attach(target: TransformNode): void {
        this.attachedNode = target;
        const scene = target.getScene();
        this._observer = scene.onBeforeRenderObservable.add(() => this.evaluate());
        this.evaluate();
    }

    public detach(): void {
        if (this._observer && this.attachedNode) {
            this.attachedNode.getScene().onBeforeRenderObservable.remove(this._observer);
        }
        this._observer = null;
        this.attachedNode = null;
    }

    /**
     * World matrix of a node relative to the asset root (FBX space).
     * @param node node to evaluate
     * @param out matrix receiving the result
     * @returns `out`
     */
    private _fbxWorld(node: TransformNode, out: Matrix): Matrix {
        node.computeWorldMatrix(true).multiplyToRef(this._tmp.invRoot, out);
        return out;
    }

    /** Solves the constraint and writes the node's local transform. */
    public evaluate(): void {
        const node = this.attachedNode;
        const c = this.constraint;
        if (!node || !this.enabled || !c.active || c.weight <= 0 || this._options.targets.length === 0) {
            return;
        }
        this._options.root.computeWorldMatrix(true).invertToRef(this._tmp.invRoot);
        const parent = node.parent as Nullable<TransformNode>;
        if (parent && typeof parent.computeWorldMatrix === "function") {
            this._fbxWorld(parent, this._tmp.parent);
        } else {
            Matrix.IdentityToRef(this._tmp.parent);
        }
        const invParent = Matrix.Invert(this._tmp.parent);

        if (!node.rotationQuaternion) {
            node.rotationQuaternion = Quaternion.FromEulerVector(node.rotation);
        }

        switch (c.type) {
            case "position":
                this._solvePosition(node, invParent);
                break;
            case "rotation":
                this._solveRotation(node, invParent);
                break;
            case "scale":
                this._solveScale(node);
                break;
            case "parent":
                this._solveParent(node, invParent);
                break;
            case "aim":
                this._solveAim(node, invParent);
                break;
            default:
                break;
        }
    }

    private _blendTargets(): { position: Vector3; rotation: Quaternion; scale: Vector3; total: number } {
        const position = Vector3.Zero();
        const scale = Vector3.Zero();
        let rotation = new Quaternion(0, 0, 0, 1);
        let total = 0;
        for (const target of this._options.targets) {
            if (target.weight <= 0) {
                continue;
            }
            target.offset.multiplyToRef(this._fbxWorld(target.node, this._tmp.world), this._tmp.local);
            this._tmp.local.decompose(this._tmp.scale, this._tmp.rotation, this._tmp.translation);
            const next = total + target.weight;
            position.addInPlace(this._tmp.translation.scale(target.weight));
            scale.addInPlace(this._tmp.scale.scale(target.weight));
            rotation = total === 0 ? this._tmp.rotation.clone() : Quaternion.Slerp(rotation, this._tmp.rotation, target.weight / next);
            total = next;
        }
        if (total > 0) {
            position.scaleInPlace(1 / total);
            scale.scaleInPlace(1 / total);
        }
        return { position, rotation, scale, total };
    }

    private _applyWeighted(current: Vector3, desired: Vector3, mask: readonly boolean[]): Vector3 {
        const w = this.constraint.weight;
        return new Vector3(
            mask[0] ? current.x + (desired.x - current.x) * w : current.x,
            mask[1] ? current.y + (desired.y - current.y) * w : current.y,
            mask[2] ? current.z + (desired.z - current.z) * w : current.z
        );
    }

    private _applyRotation(node: TransformNode, desiredLocal: Quaternion, mask: readonly boolean[]): void {
        const current = node.rotationQuaternion!;
        let result = desiredLocal;
        if (!(mask[0] && mask[1] && mask[2])) {
            const currentEuler = current.toEulerAngles();
            const desiredEuler = desiredLocal.toEulerAngles();
            result = Quaternion.FromEulerAngles(mask[0] ? desiredEuler.x : currentEuler.x, mask[1] ? desiredEuler.y : currentEuler.y, mask[2] ? desiredEuler.z : currentEuler.z);
        }
        if (this.constraint.weight < 1) {
            result = Quaternion.Slerp(current, result, this.constraint.weight);
        }
        current.copyFrom(result);
    }

    private _solvePosition(node: TransformNode, invParent: Matrix): void {
        const { position, total } = this._blendTargets();
        if (total === 0) {
            return;
        }
        const local = Vector3.TransformCoordinates(position, invParent);
        local.addInPlace(new Vector3(...this.constraint.offsetTranslation));
        node.position.copyFrom(this._applyWeighted(node.position, local, this.constraint.affectTranslation));
    }

    private _solveRotation(node: TransformNode, invParent: Matrix): void {
        const { rotation, total } = this._blendTargets();
        if (total === 0) {
            return;
        }
        const offset = eulerToMatrixXYZ(this.constraint.offsetRotation[0] * DEG2RAD, this.constraint.offsetRotation[1] * DEG2RAD, this.constraint.offsetRotation[2] * DEG2RAD);
        const world = Matrix.FromQuaternionToRef(rotation, new Matrix());
        const localMatrix = offset.multiply(world).multiply(invParent);
        localMatrix.decompose(this._tmp.scale, this._tmp.rotation, this._tmp.translation);
        this._applyRotation(node, this._tmp.rotation.clone(), this.constraint.affectRotation);
    }

    private _solveScale(node: TransformNode): void {
        const { scale, total } = this._blendTargets();
        if (total === 0) {
            return;
        }
        this._tmp.parent.decompose(this._tmp.scale, this._tmp.rotation, this._tmp.translation);
        const parentScale = this._tmp.scale;
        const local = new Vector3(
            (parentScale.x !== 0 ? scale.x / parentScale.x : scale.x) * this.constraint.offsetScale[0],
            (parentScale.y !== 0 ? scale.y / parentScale.y : scale.y) * this.constraint.offsetScale[1],
            (parentScale.z !== 0 ? scale.z / parentScale.z : scale.z) * this.constraint.offsetScale[2]
        );
        node.scaling.copyFrom(this._applyWeighted(node.scaling, local, this.constraint.affectScale));
    }

    private _solveParent(node: TransformNode, invParent: Matrix): void {
        const { position, rotation, scale, total } = this._blendTargets();
        if (total === 0) {
            return;
        }
        const world = Matrix.Compose(scale, rotation, position);
        const localMatrix = world.multiply(invParent);
        localMatrix.decompose(this._tmp.scale, this._tmp.rotation, this._tmp.translation);
        node.position.copyFrom(this._applyWeighted(node.position, this._tmp.translation, this.constraint.affectTranslation));
        this._applyRotation(node, this._tmp.rotation.clone(), this.constraint.affectRotation);
        node.scaling.copyFrom(this._applyWeighted(node.scaling, this._tmp.scale, this.constraint.affectScale));
    }

    private _solveAim(node: TransformNode, invParent: Matrix): void {
        const c = this.constraint;
        const { position: targetPosition, total } = this._blendTargets();
        if (total === 0) {
            return;
        }
        // The node's own world position (after animation) is the origin of the aim.
        const nodeWorld = this._fbxWorld(node, this._tmp.world);
        const origin = nodeWorld.getTranslation();
        const forward = targetPosition.subtract(origin);
        if (forward.lengthSquared() < 1e-20) {
            return;
        }
        forward.normalize();

        // Up direction in world space
        let up: Vector3;
        switch (c.worldUpType) {
            case 1: // aim the up vector at the up node
                up = this._options.upNode ? this._fbxWorld(this._options.upNode, this._tmp.local).getTranslation().subtract(origin) : this._options.sceneUp.clone();
                break;
            case 2: // copy the up vector from the up node's orientation
                if (this._options.upNode) {
                    this._fbxWorld(this._options.upNode, this._tmp.local).decompose(this._tmp.scale, this._tmp.rotation, this._tmp.translation);
                    up = new Vector3(...c.worldUpVector);
                    up.rotateByQuaternionToRef(this._tmp.rotation, up);
                } else {
                    up = this._options.sceneUp.clone();
                }
                break;
            case 3: // explicit world vector
                up = new Vector3(...c.worldUpVector);
                break;
            case 4: // none: keep the current roll by using the node's current up
                up = Vector3.TransformNormal(new Vector3(...c.upVector), nodeWorld);
                break;
            default: // scene up
                up = this._options.sceneUp.clone();
                break;
        }
        if (up.lengthSquared() < 1e-20 || Math.abs(Vector3.Dot(up.normalizeToNew(), forward)) > 0.9999) {
            // Degenerate up: pick any perpendicular vector
            up = Math.abs(forward.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
        }

        // World basis (forward, up, side) and the matching local basis (aimVector, upVector, side)
        const worldBasis = FBXConstraintBehavior._orthonormalBasis(forward, up);
        const localBasis = FBXConstraintBehavior._orthonormalBasis(new Vector3(...c.aimVector), new Vector3(...c.upVector));
        if (!worldBasis || !localBasis) {
            return;
        }
        // rotation R with R(localBasis) = worldBasis: R = localBasis^T * worldBasis (row-vector convention)
        const rotationWorld = localBasis.transpose().multiply(worldBasis);
        const offset = eulerToMatrixXYZ(c.offsetRotation[0] * DEG2RAD, c.offsetRotation[1] * DEG2RAD, c.offsetRotation[2] * DEG2RAD);
        const localMatrix = offset.multiply(rotationWorld).multiply(invParent);
        localMatrix.decompose(this._tmp.scale, this._tmp.rotation, this._tmp.translation);
        this._applyRotation(node, this._tmp.rotation.clone(), c.affectRotation);
    }

    /**
     * Builds a rotation matrix whose rows are `first`, `second` made orthogonal to it, and their cross product.
     * @param first primary axis
     * @param second secondary axis
     * @returns the basis, or null when the axes are parallel or degenerate
     */
    private static _orthonormalBasis(first: Vector3, second: Vector3): Nullable<Matrix> {
        const a = first.normalizeToNew();
        const b = second.subtract(a.scale(Vector3.Dot(a, second)));
        if (a.lengthSquared() < 1e-20 || b.lengthSquared() < 1e-20) {
            return null;
        }
        b.normalize();
        const cr = Vector3.Cross(a, b);
        return Matrix.FromValues(a.x, a.y, a.z, 0, b.x, b.y, b.z, 0, cr.x, cr.y, cr.z, 0, 0, 0, 0, 1);
    }
}

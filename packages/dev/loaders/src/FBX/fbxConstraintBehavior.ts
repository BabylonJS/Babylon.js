/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Runtime evaluation of FBX constraints. An `FBXConstraintBehavior` is attached to each constrained node; all
 * behaviors of a scene register with one `FBXConstraintSolver`, which solves them from a single
 * `onBeforeRenderObservable` observer in dependency order (a constraint whose target or parent is driven by another
 * constraint is solved after it) and reuses scratch objects, so solving allocates nothing per frame.
 *
 * Each solve blends from the node's unconstrained transform of the current frame (the value animation wrote, or
 * the value captured before the constraint first ran for static nodes), never from the previous solve's output,
 * so a 50% weight stays a 50% blend instead of converging on the target.
 *
 * All maths happen in FBX space, i.e. relative to the loader's root node, so the handedness conversion applied
 * at the root never enters the solve.
 */
import { type Behavior } from "core/Behaviors/behavior";
import { type Nullable } from "core/types";
import { type Node } from "core/node";
import { type Observer } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type TransformNode } from "core/Meshes/transformNode.pure";
import { type FBXConstraintData } from "./interpreter/constraints";
import { eulerToMatrixXYZ } from "./interpreter/transform";

const DEG2RAD = Math.PI / 180;

/** Resolved target of a constraint. */
export interface FBXConstraintBehaviorTarget {
    /** Target node */
    node: TransformNode;
    /** Normalized target weight (0..1) */
    weight: number;
    /** Offset matrix for parent constraints (in the target's space) */
    offset: Matrix;
}

/** Options resolved by the loader when creating the behavior. */
export interface FBXConstraintBehaviorOptions {
    /** Root of the loaded asset; world matrices are made relative to it */
    root: TransformNode;
    /** Resolved targets of the constraint, in file order */
    targets: FBXConstraintBehaviorTarget[];
    /** World up object of an aim constraint, when it has one */
    upNode: Nullable<TransformNode>;
    /** Scene up axis in FBX space */
    sceneUp: Vector3;
}

/** Scratch objects shared by every solve; the solver runs on one thread, one constraint at a time. */
const Scratch = {
    invRoot: new Matrix(),
    parent: new Matrix(),
    invParent: new Matrix(),
    world: new Matrix(),
    local: new Matrix(),
    mA: new Matrix(),
    mB: new Matrix(),
    mC: new Matrix(),
    mD: new Matrix(),
    position: new Vector3(),
    scale: new Vector3(),
    translation: new Vector3(),
    decomposedScale: new Vector3(),
    localValue: new Vector3(),
    up: new Vector3(),
    forward: new Vector3(),
    origin: new Vector3(),
    axisA: new Vector3(),
    axisB: new Vector3(),
    axisC: new Vector3(),
    eulerA: new Vector3(),
    eulerB: new Vector3(),
    rotation: new Quaternion(),
    decomposedRotation: new Quaternion(),
    result: new Quaternion(),
};

const Solvers = new WeakMap<Scene, FBXConstraintSolver>();

/**
 * Solves every FBX constraint of a scene before each render, in dependency order. Created on demand by the first
 * `FBXConstraintBehavior` attached in the scene and removed with the last one.
 */
export class FBXConstraintSolver {
    private readonly _scene: Scene;
    private readonly _behaviors: FBXConstraintBehavior[] = [];
    private _ordered: FBXConstraintBehavior[] = [];
    private _cyclic: FBXConstraintBehavior[] = [];
    private _dirty = false;
    private _observer: Nullable<Observer<Scene>> = null;

    private constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Solver of a scene, if any constraint behavior is attached in it.
     * @param scene - Scene to look up
     * @returns The solver, or undefined
     */
    public static Get(scene: Scene): FBXConstraintSolver | undefined {
        return Solvers.get(scene);
    }

    /**
     * Solver of a scene, created when missing.
     * @param scene - Scene to look up
     * @returns The solver
     */
    public static GetOrCreate(scene: Scene): FBXConstraintSolver {
        let solver = Solvers.get(scene);
        if (!solver) {
            solver = new FBXConstraintSolver(scene);
            Solvers.set(scene, solver);
        }
        return solver;
    }

    /** Registered behaviors in solve order (a target's constraint before the constraints that read it). */
    public get constraints(): readonly FBXConstraintBehavior[] {
        this._ensureOrder();
        return this._ordered;
    }

    /**
     * Behaviors that take part in a dependency cycle (A targets B while B targets A). They are solved after all
     * acyclic constraints, in registration order, so each sees the other's result from the previous solve.
     */
    public get cyclicConstraints(): readonly FBXConstraintBehavior[] {
        this._ensureOrder();
        return this._cyclic;
    }

    /**
     * Adds a behavior to the solve set.
     * @param behavior - Behavior to add
     */
    public register(behavior: FBXConstraintBehavior): void {
        if (this._behaviors.indexOf(behavior) >= 0) {
            return;
        }
        this._behaviors.push(behavior);
        this._dirty = true;
        if (!this._observer) {
            this._observer = this._scene.onBeforeRenderObservable.add(() => this.solve());
        }
    }

    /**
     * Removes a behavior from the solve set; the solver disposes itself with the last one.
     * @param behavior - Behavior to remove
     */
    public unregister(behavior: FBXConstraintBehavior): void {
        const index = this._behaviors.indexOf(behavior);
        if (index < 0) {
            return;
        }
        this._behaviors.splice(index, 1);
        this._dirty = true;
        if (this._behaviors.length === 0) {
            if (this._observer) {
                this._scene.onBeforeRenderObservable.remove(this._observer);
                this._observer = null;
            }
            Solvers.delete(this._scene);
        }
    }

    /** Marks the solve order stale, e.g. after re-parenting a constrained node. */
    public invalidateOrder(): void {
        this._dirty = true;
    }

    /** Solves every registered constraint once, in dependency order. */
    public solve(): void {
        this._ensureOrder();
        for (const behavior of this._ordered) {
            behavior.evaluate();
        }
    }

    private _ensureOrder(): void {
        if (!this._dirty) {
            return;
        }
        this._dirty = false;
        const behaviors = this._behaviors;
        const count = behaviors.length;
        // dependencies[i] lists the behaviors that must be solved before behaviors[i]
        const dependencies: number[][] = behaviors.map(() => []);
        for (let i = 0; i < count; i++) {
            const reads = behaviors[i].dependencyNodes();
            for (let j = 0; j < count; j++) {
                if (i === j) {
                    continue;
                }
                const driven = behaviors[j].attachedNode;
                if (driven && reads.some((node) => FBXConstraintSolver._IsAncestorOrSelf(driven, node))) {
                    dependencies[i].push(j);
                }
            }
        }
        // Kahn's algorithm; whatever is left when no free behavior remains sits on a cycle.
        const remaining = dependencies.map((deps) => deps.length);
        const done = behaviors.map(() => false);
        const ordered: FBXConstraintBehavior[] = [];
        let progressed = true;
        while (progressed) {
            progressed = false;
            for (let i = 0; i < count; i++) {
                if (done[i] || remaining[i] > 0) {
                    continue;
                }
                done[i] = true;
                ordered.push(behaviors[i]);
                progressed = true;
                for (let k = 0; k < count; k++) {
                    if (!done[k] && dependencies[k].indexOf(i) >= 0) {
                        remaining[k]--;
                    }
                }
            }
        }
        const cyclic: FBXConstraintBehavior[] = [];
        for (let i = 0; i < count; i++) {
            if (!done[i]) {
                cyclic.push(behaviors[i]);
                ordered.push(behaviors[i]);
            }
        }
        this._ordered = ordered;
        this._cyclic = cyclic;
    }

    private static _IsAncestorOrSelf(ancestor: TransformNode, node: Nullable<Node>): boolean {
        let current: Nullable<Node> = node;
        while (current) {
            if (current === ancestor) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }
}

/** Babylon behavior evaluating an FBX aim, parent, position, rotation or scale constraint. */
export class FBXConstraintBehavior implements Behavior<TransformNode> {
    /** Behavior name (`fbxConstraint:` followed by the constraint name) */
    public readonly name: string;
    /** Node the behavior is attached to */
    public attachedNode: Nullable<TransformNode> = null;
    /** Set to false to pause the constraint without detaching it */
    public enabled = true;

    private readonly _offsetTranslation: Vector3;
    private readonly _offsetRotation: Matrix;
    private readonly _offsetScale: Vector3;
    private readonly _localBasisTransposed: Nullable<Matrix>;
    /** Unconstrained transform of the current frame, blended towards the constraint's result. */
    private readonly _base = { position: new Vector3(), rotation: new Quaternion(), scaling: new Vector3() };
    /** What the last solve wrote; a node still holding it has not been animated since, so `_base` stays valid. */
    private readonly _lastWritten = { position: new Vector3(NaN, NaN, NaN), rotation: new Quaternion(NaN, NaN, NaN, NaN), scaling: new Vector3(NaN, NaN, NaN) };

    /**
     * Creates the behavior.
     * @param constraint - Constraint data extracted from the file
     * @param _options - Resolved targets and scene information
     */
    public constructor(
        /** Constraint data extracted from the file */
        public readonly constraint: FBXConstraintData,
        private readonly _options: FBXConstraintBehaviorOptions
    ) {
        this.name = `fbxConstraint:${constraint.name}`;
        this._offsetTranslation = new Vector3(constraint.offsetTranslation[0], constraint.offsetTranslation[1], constraint.offsetTranslation[2]);
        this._offsetRotation = eulerToMatrixXYZ(constraint.offsetRotation[0] * DEG2RAD, constraint.offsetRotation[1] * DEG2RAD, constraint.offsetRotation[2] * DEG2RAD);
        this._offsetScale = new Vector3(constraint.offsetScale[0], constraint.offsetScale[1], constraint.offsetScale[2]);
        const localBasis = new Matrix();
        this._localBasisTransposed = FBXConstraintBehavior._OrthonormalBasisToRef(
            new Vector3(constraint.aimVector[0], constraint.aimVector[1], constraint.aimVector[2]),
            new Vector3(constraint.upVector[0], constraint.upVector[1], constraint.upVector[2]),
            localBasis
        )
            ? localBasis.transpose()
            : null;
    }

    /** Nothing to initialize */
    public init(): void {}

    /**
     * Registers the behavior with the scene's solver and solves the constraint once.
     * @param target - Node to constrain
     */
    public attach(target: TransformNode): void {
        this.attachedNode = target;
        FBXConstraintSolver.GetOrCreate(target.getScene()).register(this);
        this.evaluate();
    }

    /** Unregisters the behavior; the node keeps its last solved transform. */
    public detach(): void {
        if (this.attachedNode) {
            FBXConstraintSolver.Get(this.attachedNode.getScene())?.unregister(this);
        }
        this.attachedNode = null;
        this._lastWritten.position.set(NaN, NaN, NaN);
        this._lastWritten.rotation.set(NaN, NaN, NaN, NaN);
        this._lastWritten.scaling.set(NaN, NaN, NaN);
    }

    /**
     * Nodes whose world transform the solve reads: the targets, the up node and the constrained node's parent.
     * @returns The nodes, used by the solver to order constraints
     */
    public dependencyNodes(): Nullable<Node>[] {
        const nodes: Nullable<Node>[] = this._options.targets.map((t) => t.node);
        nodes.push(this._options.upNode);
        nodes.push(this.attachedNode ? this.attachedNode.parent : null);
        return nodes;
    }

    /** Solves the constraint and writes the node's local transform. */
    public evaluate(): void {
        const node = this.attachedNode;
        const c = this.constraint;
        if (!node || !this.enabled || !c.active || c.weight <= 0 || this._options.targets.length === 0) {
            return;
        }
        this._options.root.computeWorldMatrix(true).invertToRef(Scratch.invRoot);
        const parent = node.parent as Nullable<TransformNode>;
        if (parent && typeof parent.computeWorldMatrix === "function") {
            this._fbxWorld(parent, Scratch.parent);
        } else {
            Matrix.IdentityToRef(Scratch.parent);
        }
        Scratch.parent.invertToRef(Scratch.invParent);

        if (!node.rotationQuaternion) {
            node.rotationQuaternion = Quaternion.FromEulerVector(node.rotation);
        }
        this._captureBase(node);

        switch (c.type) {
            case "position":
                this._solvePosition(node);
                break;
            case "rotation":
                this._solveRotation(node);
                break;
            case "scale":
                this._solveScale(node);
                break;
            case "parent":
                this._solveParent(node);
                break;
            case "aim":
                this._solveAim(node);
                break;
            default:
                break;
        }
    }

    /**
     * World matrix of a node relative to the asset root (FBX space).
     * @param node - node to evaluate
     * @param out - matrix receiving the result
     * @returns `out`
     */
    private _fbxWorld(node: TransformNode, out: Matrix): Matrix {
        node.computeWorldMatrix(true).multiplyToRef(Scratch.invRoot, out);
        return out;
    }

    /**
     * Takes the node's current transform as the unconstrained value unless it is still the previous solve's output.
     * @param node - Constrained node
     */
    private _captureBase(node: TransformNode): void {
        if (!node.position.equals(this._lastWritten.position)) {
            this._base.position.copyFrom(node.position);
        }
        if (!node.rotationQuaternion!.equals(this._lastWritten.rotation)) {
            this._base.rotation.copyFrom(node.rotationQuaternion!);
        }
        if (!node.scaling.equals(this._lastWritten.scaling)) {
            this._base.scaling.copyFrom(node.scaling);
        }
    }

    /**
     * Weighted blend of the targets' world transforms (relative to the root).
     * @param position - Receives the blended translation
     * @param rotation - Receives the blended rotation
     * @param scale - Receives the blended scale
     * @returns The total target weight, 0 when no target contributes
     */
    private _blendTargets(position: Vector3, rotation: Quaternion, scale: Vector3): number {
        position.set(0, 0, 0);
        scale.set(0, 0, 0);
        rotation.set(0, 0, 0, 1);
        let total = 0;
        for (const target of this._options.targets) {
            if (target.weight <= 0) {
                continue;
            }
            target.offset.multiplyToRef(this._fbxWorld(target.node, Scratch.world), Scratch.local);
            Scratch.local.decompose(Scratch.decomposedScale, Scratch.decomposedRotation, Scratch.translation);
            const next = total + target.weight;
            position.addInPlace(Scratch.translation.scaleInPlace(target.weight));
            scale.addInPlace(Scratch.decomposedScale.scaleInPlace(target.weight));
            if (total === 0) {
                rotation.copyFrom(Scratch.decomposedRotation);
            } else {
                Quaternion.SlerpToRef(rotation, Scratch.decomposedRotation, target.weight / next, rotation);
            }
            total = next;
        }
        if (total > 0) {
            position.scaleInPlace(1 / total);
            scale.scaleInPlace(1 / total);
        }
        return total;
    }

    private _applyWeighted(base: Vector3, desired: Vector3, mask: readonly boolean[], out: Vector3): void {
        const w = this.constraint.weight;
        out.set(mask[0] ? base.x + (desired.x - base.x) * w : base.x, mask[1] ? base.y + (desired.y - base.y) * w : base.y, mask[2] ? base.z + (desired.z - base.z) * w : base.z);
    }

    private _applyRotation(node: TransformNode, desiredLocal: Quaternion, mask: readonly boolean[]): void {
        const base = this._base.rotation;
        const result = Scratch.result;
        result.copyFrom(desiredLocal);
        if (!(mask[0] && mask[1] && mask[2])) {
            base.toEulerAnglesToRef(Scratch.eulerA);
            desiredLocal.toEulerAnglesToRef(Scratch.eulerB);
            Quaternion.FromEulerAnglesToRef(
                mask[0] ? Scratch.eulerB.x : Scratch.eulerA.x,
                mask[1] ? Scratch.eulerB.y : Scratch.eulerA.y,
                mask[2] ? Scratch.eulerB.z : Scratch.eulerA.z,
                result
            );
        }
        if (this.constraint.weight < 1) {
            Quaternion.SlerpToRef(base, result, this.constraint.weight, result);
        }
        node.rotationQuaternion!.copyFrom(result);
        this._lastWritten.rotation.copyFrom(result);
    }

    private _writePosition(node: TransformNode, desiredLocal: Vector3): void {
        this._applyWeighted(this._base.position, desiredLocal, this.constraint.affectTranslation, node.position);
        this._lastWritten.position.copyFrom(node.position);
    }

    private _writeScaling(node: TransformNode, desiredLocal: Vector3): void {
        this._applyWeighted(this._base.scaling, desiredLocal, this.constraint.affectScale, node.scaling);
        this._lastWritten.scaling.copyFrom(node.scaling);
    }

    private _solvePosition(node: TransformNode): void {
        if (this._blendTargets(Scratch.position, Scratch.rotation, Scratch.scale) === 0) {
            return;
        }
        Vector3.TransformCoordinatesToRef(Scratch.position, Scratch.invParent, Scratch.localValue);
        Scratch.localValue.addInPlace(this._offsetTranslation);
        this._writePosition(node, Scratch.localValue);
    }

    private _solveRotation(node: TransformNode): void {
        if (this._blendTargets(Scratch.position, Scratch.rotation, Scratch.scale) === 0) {
            return;
        }
        Matrix.FromQuaternionToRef(Scratch.rotation, Scratch.mA);
        this._offsetRotation.multiplyToRef(Scratch.mA, Scratch.mB);
        Scratch.mB.multiplyToRef(Scratch.invParent, Scratch.mC);
        Scratch.mC.decompose(Scratch.decomposedScale, Scratch.decomposedRotation, Scratch.translation);
        this._applyRotation(node, Scratch.decomposedRotation, this.constraint.affectRotation);
    }

    private _solveScale(node: TransformNode): void {
        if (this._blendTargets(Scratch.position, Scratch.rotation, Scratch.scale) === 0) {
            return;
        }
        Scratch.parent.decompose(Scratch.decomposedScale, Scratch.decomposedRotation, Scratch.translation);
        const parentScale = Scratch.decomposedScale;
        const scale = Scratch.scale;
        Scratch.localValue.set(
            (parentScale.x !== 0 ? scale.x / parentScale.x : scale.x) * this._offsetScale.x,
            (parentScale.y !== 0 ? scale.y / parentScale.y : scale.y) * this._offsetScale.y,
            (parentScale.z !== 0 ? scale.z / parentScale.z : scale.z) * this._offsetScale.z
        );
        this._writeScaling(node, Scratch.localValue);
    }

    private _solveParent(node: TransformNode): void {
        if (this._blendTargets(Scratch.position, Scratch.rotation, Scratch.scale) === 0) {
            return;
        }
        Matrix.ComposeToRef(Scratch.scale, Scratch.rotation, Scratch.position, Scratch.mA);
        Scratch.mA.multiplyToRef(Scratch.invParent, Scratch.mB);
        Scratch.mB.decompose(Scratch.decomposedScale, Scratch.decomposedRotation, Scratch.translation);
        this._writePosition(node, Scratch.translation);
        this._applyRotation(node, Scratch.decomposedRotation, this.constraint.affectRotation);
        this._writeScaling(node, Scratch.decomposedScale);
    }

    private _solveAim(node: TransformNode): void {
        const c = this.constraint;
        if (!this._localBasisTransposed || this._blendTargets(Scratch.position, Scratch.rotation, Scratch.scale) === 0) {
            return;
        }
        // The node's own world position (after animation) is the origin of the aim.
        const nodeWorld = this._fbxWorld(node, Scratch.world);
        nodeWorld.getTranslationToRef(Scratch.origin);
        Scratch.position.subtractToRef(Scratch.origin, Scratch.forward);
        if (Scratch.forward.lengthSquared() < 1e-20) {
            return;
        }
        Scratch.forward.normalize();

        // Up direction in world space
        const up = Scratch.up;
        switch (c.worldUpType) {
            case 1: // aim the up vector at the up node
                if (this._options.upNode) {
                    this._fbxWorld(this._options.upNode, Scratch.local).getTranslationToRef(up);
                    up.subtractInPlace(Scratch.origin);
                } else {
                    up.copyFrom(this._options.sceneUp);
                }
                break;
            case 2: // copy the up vector from the up node's orientation
                if (this._options.upNode) {
                    this._fbxWorld(this._options.upNode, Scratch.local).decompose(Scratch.decomposedScale, Scratch.decomposedRotation, Scratch.translation);
                    up.set(c.worldUpVector[0], c.worldUpVector[1], c.worldUpVector[2]);
                    up.rotateByQuaternionToRef(Scratch.decomposedRotation, up);
                } else {
                    up.copyFrom(this._options.sceneUp);
                }
                break;
            case 3: // explicit world vector
                up.set(c.worldUpVector[0], c.worldUpVector[1], c.worldUpVector[2]);
                break;
            case 4: // none: keep the current roll by using the node's current up
                Scratch.localValue.set(c.upVector[0], c.upVector[1], c.upVector[2]);
                Vector3.TransformNormalToRef(Scratch.localValue, nodeWorld, up);
                break;
            default: // scene up
                up.copyFrom(this._options.sceneUp);
                break;
        }
        if (up.lengthSquared() < 1e-20 || Math.abs(Vector3.Dot(up.normalizeToRef(Scratch.localValue), Scratch.forward)) > 0.9999) {
            // Degenerate up: pick any perpendicular vector
            if (Math.abs(Scratch.forward.y) < 0.9) {
                up.set(0, 1, 0);
            } else {
                up.set(1, 0, 0);
            }
        }

        // World basis (forward, up, side); the local basis (aimVector, upVector, side) is fixed per constraint.
        if (!FBXConstraintBehavior._OrthonormalBasisToRef(Scratch.forward, up, Scratch.mA)) {
            return;
        }
        // rotation R with R(localBasis) = worldBasis: R = localBasis^T * worldBasis (row-vector convention)
        this._localBasisTransposed.multiplyToRef(Scratch.mA, Scratch.mB);
        this._offsetRotation.multiplyToRef(Scratch.mB, Scratch.mC);
        Scratch.mC.multiplyToRef(Scratch.invParent, Scratch.mD);
        Scratch.mD.decompose(Scratch.decomposedScale, Scratch.decomposedRotation, Scratch.translation);
        this._applyRotation(node, Scratch.decomposedRotation, c.affectRotation);
    }

    /**
     * Builds a rotation matrix whose rows are `first`, `second` made orthogonal to it, and their cross product.
     * @param first - primary axis
     * @param second - secondary axis
     * @param out - matrix receiving the basis
     * @returns false when the axes are parallel or degenerate (`out` is then unchanged)
     */
    private static _OrthonormalBasisToRef(first: Vector3, second: Vector3, out: Matrix): boolean {
        const a = Scratch.axisA;
        const b = Scratch.axisB;
        const cr = Scratch.axisC;
        first.normalizeToRef(a);
        second.subtractToRef(a.scaleToRef(Vector3.Dot(a, second), b), b);
        if (a.lengthSquared() < 1e-20 || b.lengthSquared() < 1e-20) {
            return false;
        }
        b.normalize();
        Vector3.CrossToRef(a, b, cr);
        Matrix.FromValuesToRef(a.x, a.y, a.z, 0, b.x, b.y, b.z, 0, cr.x, cr.y, cr.z, 0, 0, 0, 0, 1, out);
        return true;
    }
}

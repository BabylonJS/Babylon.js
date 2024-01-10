/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Scene } from "./scene";
import type { Nullable } from "./types";
import { Matrix, Vector3 } from "./Maths/math.vector";
import type { Engine } from "./Engines/engine";
import type { IBehaviorAware, Behavior } from "./Behaviors/behavior";
import { SerializationHelper, serialize } from "./Misc/decorators";
import type { Observer } from "./Misc/observable";
import { Observable } from "./Misc/observable";
import { EngineStore } from "./Engines/engineStore";
import { _WarnImport } from "./Misc/devTools";
import type { AbstractActionManager } from "./Actions/abstractActionManager";
import type { IInspectable } from "./Misc/iInspectable";
import type { AbstractScene } from "./abstractScene";
import type { IAccessibilityTag } from "./IAccessibilityTag";
import type { AnimationRange } from "./Animations/animationRange";
import type { AnimationPropertiesOverride } from "./Animations/animationPropertiesOverride";
import type { AbstractMesh } from "./Meshes/abstractMesh";
import type { Animation } from "./Animations/animation";
import type { Animatable } from "./Animations/animatable";

/**
 * Defines how a node can be built from a string name.
 */
export type NodeConstructor = (name: string, scene: Scene, options?: any) => () => Node;

/** @internal */
class _InternalNodeDataInfo {
    public _doNotSerialize = false;
    public _isDisposed = false;
    public _sceneRootNodesIndex = -1;
    public _isEnabled = true;
    public _isParentEnabled = true;
    public _isReady = true;
    public _onEnabledStateChangedObservable = new Observable<boolean>();
    public _onClonedObservable = new Observable<Node>();
}

/**
 * Node is the basic class for all scene objects (Mesh, Light, Camera.)
 */
export class Node implements IBehaviorAware<Node> {
    protected _isDirty = false;

    /**
     * @internal
     */
    public static _AnimationRangeFactory = (_name: string, _from: number, _to: number): AnimationRange => {
        throw _WarnImport("AnimationRange");
    };

    private static _NodeConstructors: { [key: string]: any } = {};

    /**
     * Add a new node constructor
     * @param type defines the type name of the node to construct
     * @param constructorFunc defines the constructor function
     */
    public static AddNodeConstructor(type: string, constructorFunc: NodeConstructor) {
        this._NodeConstructors[type] = constructorFunc;
    }

    /**
     * Returns a node constructor based on type name
     * @param type defines the type name
     * @param name defines the new node name
     * @param scene defines the hosting scene
     * @param options defines optional options to transmit to constructors
     * @returns the new constructor or null
     */
    public static Construct(type: string, name: string, scene: Scene, options?: any): Nullable<() => Node> {
        const constructorFunc = this._NodeConstructors[type];

        if (!constructorFunc) {
            return null;
        }

        return constructorFunc(name, scene, options);
    }

    private _nodeDataStorage = new _InternalNodeDataInfo();

    /**
     * Gets or sets the name of the node
     */
    @serialize()
    public name: string;

    /**
     * Gets or sets the id of the node
     */
    @serialize()
    public id: string;

    /**
     * Gets or sets the unique id of the node
     */
    @serialize()
    public uniqueId: number;

    /**
     * Gets or sets a string used to store user defined state for the node
     */
    @serialize()
    public state = "";

    /**
     * Gets or sets an object used to store user defined information for the node
     */
    @serialize()
    public metadata: any = null;

    /** @internal */
    public _internalMetadata: any;

    /**
     * For internal use only. Please do not use.
     */
    public reservedDataStore: any = null;

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/toolsAndResources/inspector#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    /**
     * Gets or sets the accessibility tag to describe the node for accessibility purpose.
     */
    public set accessibilityTag(value: Nullable<IAccessibilityTag>) {
        this._accessibilityTag = value;
        this.onAccessibilityTagChangedObservable.notifyObservers(value);
    }

    public get accessibilityTag() {
        return this._accessibilityTag;
    }

    protected _accessibilityTag: Nullable<IAccessibilityTag> = null;

    /**
     * Observable fired when an accessibility tag is changed
     */
    public onAccessibilityTagChangedObservable = new Observable<Nullable<IAccessibilityTag>>();

    /**
     * Gets or sets a boolean used to define if the node must be serialized
     */
    public get doNotSerialize() {
        if (this._nodeDataStorage._doNotSerialize) {
            return true;
        }

        if (this._parentNode) {
            return this._parentNode.doNotSerialize;
        }

        return false;
    }

    public set doNotSerialize(value: boolean) {
        this._nodeDataStorage._doNotSerialize = value;
    }

    /** @internal */
    public _parentContainer: Nullable<AbstractScene> = null;

    /**
     * Gets a list of Animations associated with the node
     */
    public animations: Animation[] = [];
    protected _ranges: { [name: string]: Nullable<AnimationRange> } = {};

    /**
     * Callback raised when the node is ready to be used
     */
    public onReady: Nullable<(node: Node) => void> = null;

    /** @internal */
    public _currentRenderId = -1;
    private _parentUpdateId = -1;
    /** @internal */
    public _childUpdateId = -1;

    /** @internal */
    public _waitingParentId: Nullable<string> = null;
    /** @internal */
    public _waitingParentInstanceIndex: Nullable<string> = null;
    /** @internal */
    public _waitingParsedUniqueId: Nullable<number> = null;
    /** @internal */
    public _scene: Scene;
    /** @internal */
    public _cache: any = {};

    protected _parentNode: Nullable<Node> = null;

    /** @internal */
    protected _children: Nullable<Node[]> = null;

    /** @internal */
    public _worldMatrix = Matrix.Identity();
    /** @internal */
    public _worldMatrixDeterminant = 0;
    /** @internal */
    public _worldMatrixDeterminantIsDirty = true;

    /**
     * Gets a boolean indicating if the node has been disposed
     * @returns true if the node was disposed
     */
    public isDisposed(): boolean {
        return this._nodeDataStorage._isDisposed;
    }

    /**
     * Gets or sets the parent of the node (without keeping the current position in the scene)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/parent
     */
    public set parent(parent: Nullable<Node>) {
        if (this._parentNode === parent) {
            return;
        }

        const previousParentNode = this._parentNode;

        // Remove self from list of children of parent
        if (this._parentNode && this._parentNode._children !== undefined && this._parentNode._children !== null) {
            const index = this._parentNode._children.indexOf(this);
            if (index !== -1) {
                this._parentNode._children.splice(index, 1);
            }

            if (!parent && !this._nodeDataStorage._isDisposed) {
                this._addToSceneRootNodes();
            }
        }

        // Store new parent
        this._parentNode = parent;

        // Add as child to new parent
        if (this._parentNode) {
            if (this._parentNode._children === undefined || this._parentNode._children === null) {
                this._parentNode._children = new Array<Node>();
            }
            this._parentNode._children.push(this);

            if (!previousParentNode) {
                this._removeFromSceneRootNodes();
            }
        }

        // Enabled state
        this._syncParentEnabledState();
    }

    public get parent(): Nullable<Node> {
        return this._parentNode;
    }

    /**
     * @internal
     */
    public _serializeAsParent(serializationObject: any): void {
        serializationObject.parentId = this.uniqueId;
    }

    /** @internal */
    public _addToSceneRootNodes() {
        if (this._nodeDataStorage._sceneRootNodesIndex === -1) {
            this._nodeDataStorage._sceneRootNodesIndex = this._scene.rootNodes.length;
            this._scene.rootNodes.push(this);
        }
    }

    /** @internal */
    public _removeFromSceneRootNodes() {
        if (this._nodeDataStorage._sceneRootNodesIndex !== -1) {
            const rootNodes = this._scene.rootNodes;
            const lastIdx = rootNodes.length - 1;
            rootNodes[this._nodeDataStorage._sceneRootNodesIndex] = rootNodes[lastIdx];
            rootNodes[this._nodeDataStorage._sceneRootNodesIndex]._nodeDataStorage._sceneRootNodesIndex = this._nodeDataStorage._sceneRootNodesIndex;
            this._scene.rootNodes.pop();
            this._nodeDataStorage._sceneRootNodesIndex = -1;
        }
    }

    private _animationPropertiesOverride: Nullable<AnimationPropertiesOverride> = null;

    /**
     * Gets or sets the animation properties override
     */
    public get animationPropertiesOverride(): Nullable<AnimationPropertiesOverride> {
        if (!this._animationPropertiesOverride) {
            return this._scene.animationPropertiesOverride;
        }
        return this._animationPropertiesOverride;
    }

    public set animationPropertiesOverride(value: Nullable<AnimationPropertiesOverride>) {
        this._animationPropertiesOverride = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "Node" string
     */
    public getClassName(): string {
        return "Node";
    }

    /** @internal */
    public readonly _isNode = true;

    /**
     * An event triggered when the mesh is disposed
     */
    public onDisposeObservable = new Observable<Node>();

    private _onDisposeObserver: Nullable<Observer<Node>> = null;
    /**
     * Sets a callback that will be raised when the node will be disposed
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    /**
     * An event triggered when the enabled state of the node changes
     */
    public get onEnabledStateChangedObservable(): Observable<boolean> {
        return this._nodeDataStorage._onEnabledStateChangedObservable;
    }

    /**
     * An event triggered when the node is cloned
     */
    public get onClonedObservable(): Observable<Node> {
        return this._nodeDataStorage._onClonedObservable;
    }

    /**
     * Creates a new Node
     * @param name the name and id to be given to this node
     * @param scene the scene this node will be added to
     */
    constructor(name: string, scene: Nullable<Scene> = null) {
        this.name = name;
        this.id = name;
        this._scene = <Scene>(scene || EngineStore.LastCreatedScene);
        this.uniqueId = this._scene.getUniqueId();
        this._initCache();
    }

    /**
     * Gets the scene of the node
     * @returns a scene
     */
    public getScene(): Scene {
        return this._scene;
    }

    /**
     * Gets the engine of the node
     * @returns a Engine
     */
    public getEngine(): Engine {
        return this._scene.getEngine();
    }

    // Behaviors
    private _behaviors = new Array<Behavior<Node>>();

    /**
     * Attach a behavior to the node
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     * @param behavior defines the behavior to attach
     * @param attachImmediately defines that the behavior must be attached even if the scene is still loading
     * @returns the current Node
     */
    public addBehavior(behavior: Behavior<Node>, attachImmediately = false): Node {
        const index = this._behaviors.indexOf(behavior);

        if (index !== -1) {
            return this;
        }

        behavior.init();
        if (this._scene.isLoading && !attachImmediately) {
            // We defer the attach when the scene will be loaded
            this._scene.onDataLoadedObservable.addOnce(() => {
                behavior.attach(this);
            });
        } else {
            behavior.attach(this);
        }
        this._behaviors.push(behavior);

        return this;
    }

    /**
     * Remove an attached behavior
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     * @param behavior defines the behavior to attach
     * @returns the current Node
     */
    public removeBehavior(behavior: Behavior<Node>): Node {
        const index = this._behaviors.indexOf(behavior);

        if (index === -1) {
            return this;
        }

        this._behaviors[index].detach();
        this._behaviors.splice(index, 1);

        return this;
    }

    /**
     * Gets the list of attached behaviors
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     */
    public get behaviors(): Behavior<Node>[] {
        return this._behaviors;
    }

    /**
     * Gets an attached behavior by name
     * @param name defines the name of the behavior to look for
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     * @returns null if behavior was not found else the requested behavior
     */
    public getBehaviorByName(name: string): Nullable<Behavior<Node>> {
        for (const behavior of this._behaviors) {
            if (behavior.name === name) {
                return behavior;
            }
        }

        return null;
    }

    /**
     * Returns the latest update of the World matrix
     * @returns a Matrix
     */
    public getWorldMatrix(): Matrix {
        if (this._currentRenderId !== this._scene.getRenderId()) {
            this.computeWorldMatrix();
        }
        return this._worldMatrix;
    }

    /** @internal */
    public _getWorldMatrixDeterminant(): number {
        if (this._worldMatrixDeterminantIsDirty) {
            this._worldMatrixDeterminantIsDirty = false;
            this._worldMatrixDeterminant = this._worldMatrix.determinant();
        }
        return this._worldMatrixDeterminant;
    }

    /**
     * Returns directly the latest state of the mesh World matrix.
     * A Matrix is returned.
     */
    public get worldMatrixFromCache(): Matrix {
        return this._worldMatrix;
    }

    // override it in derived class if you add new variables to the cache
    // and call the parent class method
    /** @internal */
    public _initCache() {
        this._cache = {};
        this._cache.parent = undefined;
    }

    /**
     * @internal
     */
    public updateCache(force?: boolean): void {
        if (!force && this.isSynchronized()) {
            return;
        }

        this._cache.parent = this.parent;

        this._updateCache();
    }

    /**
     * @internal
     */
    public _getActionManagerForTrigger(trigger?: number, _initialCall = true): Nullable<AbstractActionManager> {
        if (!this.parent) {
            return null;
        }

        return this.parent._getActionManagerForTrigger(trigger, false);
    }

    // override it in derived class if you add new variables to the cache
    // and call the parent class method if !ignoreParentClass
    /**
     * @internal
     */
    public _updateCache(_ignoreParentClass?: boolean): void {}

    // override it in derived class if you add new variables to the cache
    /** @internal */
    public _isSynchronized(): boolean {
        return true;
    }

    /** @internal */
    public _markSyncedWithParent() {
        if (this._parentNode) {
            this._parentUpdateId = this._parentNode._childUpdateId;
        }
    }

    /** @internal */
    public isSynchronizedWithParent(): boolean {
        if (!this._parentNode) {
            return true;
        }

        if (this._parentNode._isDirty || this._parentUpdateId !== this._parentNode._childUpdateId) {
            return false;
        }

        return this._parentNode.isSynchronized();
    }

    /** @internal */
    public isSynchronized(): boolean {
        if (this._cache.parent !== this._parentNode) {
            this._cache.parent = this._parentNode;
            return false;
        }

        if (this._parentNode && !this.isSynchronizedWithParent()) {
            return false;
        }

        return this._isSynchronized();
    }

    /**
     * Is this node ready to be used/rendered
     * @param _completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @returns true if the node is ready
     */
    public isReady(_completeCheck = false): boolean {
        return this._nodeDataStorage._isReady;
    }

    /**
     * Flag the  node as dirty (Forcing it to update everything)
     * @param _property helps children apply precise "dirtyfication"
     * @returns this node
     */
    public markAsDirty(_property?: string): Node {
        this._currentRenderId = Number.MAX_VALUE;
        this._isDirty = true;
        return this;
    }

    /**
     * Is this node enabled?
     * If the node has a parent, all ancestors will be checked and false will be returned if any are false (not enabled), otherwise will return true
     * @param checkAncestors indicates if this method should check the ancestors. The default is to check the ancestors. If set to false, the method will return the value of this node without checking ancestors
     * @returns whether this node (and its parent) is enabled
     */
    public isEnabled(checkAncestors: boolean = true): boolean {
        if (checkAncestors === false) {
            return this._nodeDataStorage._isEnabled;
        }

        if (!this._nodeDataStorage._isEnabled) {
            return false;
        }

        return this._nodeDataStorage._isParentEnabled;
    }

    /** @internal */
    protected _syncParentEnabledState() {
        this._nodeDataStorage._isParentEnabled = this._parentNode ? this._parentNode.isEnabled() : true;

        if (this._children) {
            this._children.forEach((c) => {
                c._syncParentEnabledState(); // Force children to update accordingly
            });
        }
    }

    /**
     * Set the enabled state of this node
     * @param value defines the new enabled state
     */
    public setEnabled(value: boolean): void {
        if (this._nodeDataStorage._isEnabled === value) {
            return;
        }
        this._nodeDataStorage._isEnabled = value;
        this._syncParentEnabledState();
        this._nodeDataStorage._onEnabledStateChangedObservable.notifyObservers(value);
    }

    /**
     * Is this node a descendant of the given node?
     * The function will iterate up the hierarchy until the ancestor was found or no more parents defined
     * @param ancestor defines the parent node to inspect
     * @returns a boolean indicating if this node is a descendant of the given node
     */
    public isDescendantOf(ancestor: Node): boolean {
        if (this.parent) {
            if (this.parent === ancestor) {
                return true;
            }

            return this.parent.isDescendantOf(ancestor);
        }
        return false;
    }

    /**
     * @internal
     */
    public _getDescendants(results: Node[], directDescendantsOnly: boolean = false, predicate?: (node: Node) => boolean): void {
        if (!this._children) {
            return;
        }

        for (let index = 0; index < this._children.length; index++) {
            const item = this._children[index];

            if (!predicate || predicate(item)) {
                results.push(item);
            }

            if (!directDescendantsOnly) {
                item._getDescendants(results, false, predicate);
            }
        }
    }

    /**
     * Will return all nodes that have this node as ascendant
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns all children nodes of all types
     */
    public getDescendants<T extends Node>(directDescendantsOnly?: boolean, predicate?: (node: Node) => node is T): T[];

    /**
     * Will return all nodes that have this node as ascendant
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns all children nodes of all types
     */
    public getDescendants(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): Node[];

    /**
     * Will return all nodes that have this node as ascendant
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns all children nodes of all types
     */
    public getDescendants(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): Node[] {
        const results: Node[] = [];

        this._getDescendants(results, directDescendantsOnly, predicate);

        return results;
    }

    /**
     * Get all child-meshes of this node
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: false)
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns an array of AbstractMesh
     */
    public getChildMeshes<T extends AbstractMesh>(directDescendantsOnly?: boolean, predicate?: (node: Node) => node is T): T[];

    /**
     * Get all child-meshes of this node
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: false)
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns an array of AbstractMesh
     */
    public getChildMeshes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[];

    /**
     * Get all child-meshes of this node
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: false)
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns an array of AbstractMesh
     */
    public getChildMeshes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[] {
        const results: Array<AbstractMesh> = [];
        this._getDescendants(results, directDescendantsOnly, (node: Node) => {
            return (!predicate || predicate(node)) && (<AbstractMesh>node).cullingStrategy !== undefined;
        });
        return results;
    }

    /**
     * Get all direct children of this node
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: true)
     * @returns an array of Node
     */
    public getChildren<T extends Node>(predicate?: (node: Node) => node is T, directDescendantsOnly?: boolean): T[];

    /**
     * Get all direct children of this node
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: true)
     * @returns an array of Node
     */
    public getChildren(predicate?: (node: Node) => boolean, directDescendantsOnly?: boolean): Node[];

    /**
     * Get all direct children of this node
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: true)
     * @returns an array of Node
     */
    public getChildren(predicate?: (node: Node) => boolean, directDescendantsOnly = true): Node[] {
        return this.getDescendants(directDescendantsOnly, predicate);
    }

    /**
     * @internal
     */
    public _setReady(state: boolean): void {
        if (state === this._nodeDataStorage._isReady) {
            return;
        }

        if (!state) {
            this._nodeDataStorage._isReady = false;
            return;
        }

        if (this.onReady) {
            this.onReady(this);
        }
        this._nodeDataStorage._isReady = true;
    }

    /**
     * Get an animation by name
     * @param name defines the name of the animation to look for
     * @returns null if not found else the requested animation
     */
    public getAnimationByName(name: string): Nullable<Animation> {
        for (let i = 0; i < this.animations.length; i++) {
            const animation = this.animations[i];

            if (animation.name === name) {
                return animation;
            }
        }

        return null;
    }

    /**
     * Creates an animation range for this node
     * @param name defines the name of the range
     * @param from defines the starting key
     * @param to defines the end key
     */
    public createAnimationRange(name: string, from: number, to: number): void {
        // check name not already in use
        if (!this._ranges[name]) {
            this._ranges[name] = Node._AnimationRangeFactory(name, from, to);
            for (let i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
                if (this.animations[i]) {
                    this.animations[i].createRange(name, from, to);
                }
            }
        }
    }

    /**
     * Delete a specific animation range
     * @param name defines the name of the range to delete
     * @param deleteFrames defines if animation frames from the range must be deleted as well
     */
    public deleteAnimationRange(name: string, deleteFrames = true): void {
        for (let i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
            if (this.animations[i]) {
                this.animations[i].deleteRange(name, deleteFrames);
            }
        }
        this._ranges[name] = null; // said much faster than 'delete this._range[name]'
    }

    /**
     * Get an animation range by name
     * @param name defines the name of the animation range to look for
     * @returns null if not found else the requested animation range
     */
    public getAnimationRange(name: string): Nullable<AnimationRange> {
        return this._ranges[name] || null;
    }

    /**
     * Clone the current node
     * @param name Name of the new clone
     * @param newParent New parent for the clone
     * @param doNotCloneChildren Do not clone children hierarchy
     * @returns the new transform node
     */
    public clone(name: string, newParent: Nullable<Node>, doNotCloneChildren?: boolean): Nullable<Node> {
        const result = SerializationHelper.Clone(() => new Node(name, this.getScene()), this);

        if (newParent) {
            result.parent = newParent;
        }

        if (!doNotCloneChildren) {
            // Children
            const directDescendants = this.getDescendants(true);
            for (let index = 0; index < directDescendants.length; index++) {
                const child = directDescendants[index];

                child.clone(name + "." + child.name, result);
            }
        }

        return result;
    }

    /**
     * Gets the list of all animation ranges defined on this node
     * @returns an array
     */
    public getAnimationRanges(): Nullable<AnimationRange>[] {
        const animationRanges: Nullable<AnimationRange>[] = [];
        let name: string;
        for (name in this._ranges) {
            animationRanges.push(this._ranges[name]);
        }
        return animationRanges;
    }

    /**
     * Will start the animation sequence
     * @param name defines the range frames for animation sequence
     * @param loop defines if the animation should loop (false by default)
     * @param speedRatio defines the speed factor in which to run the animation (1 by default)
     * @param onAnimationEnd defines a function to be executed when the animation ended (undefined by default)
     * @returns the object created for this animation. If range does not exist, it will return null
     */
    public beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Nullable<Animatable> {
        const range = this.getAnimationRange(name);

        if (!range) {
            return null;
        }

        return this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
    }

    /**
     * Serialize animation ranges into a JSON compatible object
     * @returns serialization object
     */
    public serializeAnimationRanges(): any {
        const serializationRanges = [];
        for (const name in this._ranges) {
            const localRange = this._ranges[name];
            if (!localRange) {
                continue;
            }
            const range: any = {};
            range.name = name;
            range.from = localRange.from;
            range.to = localRange.to;
            serializationRanges.push(range);
        }
        return serializationRanges;
    }

    /**
     * Computes the world matrix of the node
     * @param _force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
     * @returns the world matrix
     */
    public computeWorldMatrix(_force?: boolean): Matrix {
        if (!this._worldMatrix) {
            this._worldMatrix = Matrix.Identity();
        }
        return this._worldMatrix;
    }

    /**
     * Releases resources associated with this node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        this._nodeDataStorage._isDisposed = true;

        if (!doNotRecurse) {
            const nodes = this.getDescendants(true);
            for (const node of nodes) {
                node.dispose(doNotRecurse, disposeMaterialAndTextures);
            }
        }

        if (!this.parent) {
            this._removeFromSceneRootNodes();
        } else {
            this.parent = null;
        }

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();

        this.onEnabledStateChangedObservable.clear();
        this.onClonedObservable.clear();

        // Behaviors
        for (const behavior of this._behaviors) {
            behavior.detach();
        }

        this._behaviors.length = 0;

        this.metadata = null;
    }

    /**
     * Parse animation range data from a serialization object and store them into a given node
     * @param node defines where to store the animation ranges
     * @param parsedNode defines the serialization object to read data from
     * @param _scene defines the hosting scene
     */
    public static ParseAnimationRanges(node: Node, parsedNode: any, _scene: Scene): void {
        if (parsedNode.ranges) {
            for (let index = 0; index < parsedNode.ranges.length; index++) {
                const data = parsedNode.ranges[index];
                node.createAnimationRange(data.name, data.from, data.to);
            }
        }
    }
    /**
     * Return the minimum and maximum world vectors of the entire hierarchy under current node
     * @param includeDescendants Include bounding info from descendants as well (true by default)
     * @param predicate defines a callback function that can be customize to filter what meshes should be included in the list used to compute the bounding vectors
     * @returns the new bounding vectors
     */
    public getHierarchyBoundingVectors(includeDescendants = true, predicate: Nullable<(abstractMesh: AbstractMesh) => boolean> = null): { min: Vector3; max: Vector3 } {
        // Ensures that all world matrix will be recomputed.
        this.getScene().incrementRenderId();

        this.computeWorldMatrix(true);

        let min: Vector3;
        let max: Vector3;

        const thisAbstractMesh = this as Node as AbstractMesh;
        if (thisAbstractMesh.getBoundingInfo && thisAbstractMesh.subMeshes) {
            // If this is an abstract mesh get its bounding info
            const boundingInfo = thisAbstractMesh.getBoundingInfo();
            min = boundingInfo.boundingBox.minimumWorld.clone();
            max = boundingInfo.boundingBox.maximumWorld.clone();
        } else {
            min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        }

        if (includeDescendants) {
            const descendants = this.getDescendants(false);

            for (const descendant of descendants) {
                const childMesh = <AbstractMesh>descendant;
                childMesh.computeWorldMatrix(true);

                // Filters meshes based on custom predicate function.
                if (predicate && !predicate(childMesh)) {
                    continue;
                }

                //make sure we have the needed params to get mix and max
                if (!childMesh.getBoundingInfo || childMesh.getTotalVertices() === 0) {
                    continue;
                }

                const childBoundingInfo = childMesh.getBoundingInfo();
                const boundingBox = childBoundingInfo.boundingBox;

                const minBox = boundingBox.minimumWorld;
                const maxBox = boundingBox.maximumWorld;

                Vector3.CheckExtends(minBox, min, max);
                Vector3.CheckExtends(maxBox, min, max);
            }
        }

        return {
            min: min,
            max: max,
        };
    }
}

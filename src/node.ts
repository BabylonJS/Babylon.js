import { Scene } from "./scene";
import { Nullable } from "./types";
import { Matrix, Vector3 } from "./Maths/math.vector";
import { Engine } from "./Engines/engine";
import { IBehaviorAware, Behavior } from "./Behaviors/behavior";
import { serialize } from "./Misc/decorators";
import { Observable, Observer } from "./Misc/observable";
import { EngineStore } from "./Engines/engineStore";
import { _DevTools } from './Misc/devTools';
import { AbstractActionManager } from './Actions/abstractActionManager';
import { IInspectable } from './Misc/iInspectable';

declare type Animatable = import("./Animations/animatable").Animatable;
declare type AnimationPropertiesOverride = import("./Animations/animationPropertiesOverride").AnimationPropertiesOverride;
declare type Animation = import("./Animations/animation").Animation;
declare type AnimationRange = import("./Animations/animationRange").AnimationRange;
declare type AbstractMesh = import("./Meshes/abstractMesh").AbstractMesh;

/**
 * Defines how a node can be built from a string name.
 */
export type NodeConstructor = (name: string, scene: Scene, options?: any) => () => Node;

/**
 * Node is the basic class for all scene objects (Mesh, Light, Camera.)
 */
export class Node implements IBehaviorAware<Node> {
    /** @hidden */
    public static _AnimationRangeFactory = (name: string, from: number, to: number): AnimationRange => {
        throw _DevTools.WarnImport("AnimationRange");
    }

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
        let constructorFunc = this._NodeConstructors[type];

        if (!constructorFunc) {
            return null;
        }

        return constructorFunc(name, scene, options);
    }

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

    /**
     * For internal use only. Please do not use.
     */
    public reservedDataStore: any = null;

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/how_to/debug_layer#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    private _doNotSerialize = false;
    /**
     * Gets or sets a boolean used to define if the node must be serialized
     */
    public get doNotSerialize() {
        if (this._doNotSerialize) {
            return true;
        }

        if (this._parentNode) {
            return this._parentNode.doNotSerialize;
        }

        return false;
    }

    public set doNotSerialize(value: boolean) {
        this._doNotSerialize = value;
    }

    /** @hidden */
    public _isDisposed = false;

    /**
     * Gets a list of Animations associated with the node
     */
    public animations = new Array<Animation>();
    protected _ranges: { [name: string]: Nullable<AnimationRange> } = {};

    /**
     * Callback raised when the node is ready to be used
     */
    public onReady: Nullable<(node: Node) => void> = null;

    private _isEnabled = true;
    private _isParentEnabled = true;
    private _isReady = true;
    /** @hidden */
    public _currentRenderId = -1;
    private _parentUpdateId = -1;
    /** @hidden */
    public _childUpdateId = -1;

    /** @hidden */
    public _waitingParentId: Nullable<string> = null;
    /** @hidden */
    public _scene: Scene;
    /** @hidden */
    public _cache: any = {};

    private _parentNode: Nullable<Node> = null;
    private _children: Nullable<Node[]> = null;

    /** @hidden */
    public _worldMatrix = Matrix.Identity();
    /** @hidden */
    public _worldMatrixDeterminant = 0;
    /** @hidden */
    public _worldMatrixDeterminantIsDirty = true;

    /** @hidden */
    private _sceneRootNodesIndex = -1;

    /**
     * Gets a boolean indicating if the node has been disposed
     * @returns true if the node was disposed
     */
    public isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Gets or sets the parent of the node (without keeping the current position in the scene)
     * @see https://doc.babylonjs.com/how_to/parenting
     */
    public set parent(parent: Nullable<Node>) {
        if (this._parentNode === parent) {
            return;
        }

        const previousParentNode = this._parentNode;

        // Remove self from list of children of parent
        if (this._parentNode && this._parentNode._children !== undefined && this._parentNode._children !== null) {
            var index = this._parentNode._children.indexOf(this);
            if (index !== -1) {
                this._parentNode._children.splice(index, 1);
            }

            if (!parent && !this._isDisposed) {
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

    /** @hidden */
    public _addToSceneRootNodes() {
        if (this._sceneRootNodesIndex === -1) {
            this._sceneRootNodesIndex = this._scene.rootNodes.length;
            this._scene.rootNodes.push(this);
        }
    }

    /** @hidden */
    public _removeFromSceneRootNodes() {
        if (this._sceneRootNodesIndex !== -1) {
            const rootNodes = this._scene.rootNodes;
            const lastIdx = rootNodes.length - 1;
            rootNodes[this._sceneRootNodesIndex] = rootNodes[lastIdx];
            rootNodes[this._sceneRootNodesIndex]._sceneRootNodesIndex = this._sceneRootNodesIndex;
            this._scene.rootNodes.pop();
            this._sceneRootNodesIndex = -1;
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

    /** @hidden */
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
     * @see https://doc.babylonjs.com/features/behaviour
     * @param behavior defines the behavior to attach
     * @param attachImmediately defines that the behavior must be attached even if the scene is still loading
     * @returns the current Node
     */
    public addBehavior(behavior: Behavior<Node>, attachImmediately = false): Node {
        var index = this._behaviors.indexOf(behavior);

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
     * @see https://doc.babylonjs.com/features/behaviour
     * @param behavior defines the behavior to attach
     * @returns the current Node
     */
    public removeBehavior(behavior: Behavior<Node>): Node {
        var index = this._behaviors.indexOf(behavior);

        if (index === -1) {
            return this;
        }

        this._behaviors[index].detach();
        this._behaviors.splice(index, 1);

        return this;
    }

    /**
     * Gets the list of attached behaviors
     * @see https://doc.babylonjs.com/features/behaviour
     */
    public get behaviors(): Behavior<Node>[] {
        return this._behaviors;
    }

    /**
     * Gets an attached behavior by name
     * @param name defines the name of the behavior to look for
     * @see https://doc.babylonjs.com/features/behaviour
     * @returns null if behavior was not found else the requested behavior
     */
    public getBehaviorByName(name: string): Nullable<Behavior<Node>> {
        for (var behavior of this._behaviors) {
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

    /** @hidden */
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
    /** @hidden */
    public _initCache() {
        this._cache = {};
        this._cache.parent = undefined;
    }

    /** @hidden */
    public updateCache(force?: boolean): void {
        if (!force && this.isSynchronized()) {
            return;
        }

        this._cache.parent = this.parent;

        this._updateCache();
    }

    /** @hidden */
    public _getActionManagerForTrigger(trigger?: number, initialCall = true): Nullable<AbstractActionManager> {
        if (!this.parent) {
            return null;
        }

        return this.parent._getActionManagerForTrigger(trigger, false);
    }

    // override it in derived class if you add new variables to the cache
    // and call the parent class method if !ignoreParentClass
    /** @hidden */
    public _updateCache(ignoreParentClass?: boolean): void {
    }

    // override it in derived class if you add new variables to the cache
    /** @hidden */
    public _isSynchronized(): boolean {
        return true;
    }

    /** @hidden */
    public _markSyncedWithParent() {
        if (this._parentNode) {
            this._parentUpdateId = this._parentNode._childUpdateId;
        }
    }

    /** @hidden */
    public isSynchronizedWithParent(): boolean {
        if (!this._parentNode) {
            return true;
        }

        if (this._parentUpdateId !== this._parentNode._childUpdateId) {
            return false;
        }

        return this._parentNode.isSynchronized();
    }

    /** @hidden */
    public isSynchronized(): boolean {
        if (this._cache.parent != this._parentNode) {
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
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @return true if the node is ready
     */
    public isReady(completeCheck = false): boolean {
        return this._isReady;
    }

    /**
     * Is this node enabled?
     * If the node has a parent, all ancestors will be checked and false will be returned if any are false (not enabled), otherwise will return true
     * @param checkAncestors indicates if this method should check the ancestors. The default is to check the ancestors. If set to false, the method will return the value of this node without checking ancestors
     * @return whether this node (and its parent) is enabled
     */
    public isEnabled(checkAncestors: boolean = true): boolean {
        if (checkAncestors === false) {
            return this._isEnabled;
        }

        if (!this._isEnabled) {
            return false;
        }

        return this._isParentEnabled;
    }

    /** @hidden */
    protected _syncParentEnabledState() {
        this._isParentEnabled = this._parentNode ? this._parentNode.isEnabled() : true;

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
        this._isEnabled = value;

        this._syncParentEnabledState();
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

    /** @hidden */
    public _getDescendants(results: Node[], directDescendantsOnly: boolean = false, predicate?: (node: Node) => boolean): void {
        if (!this._children) {
            return;
        }

        for (var index = 0; index < this._children.length; index++) {
            var item = this._children[index];

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
     * @return all children nodes of all types
     */
    public getDescendants(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): Node[] {
        var results = new Array<Node>();

        this._getDescendants(results, directDescendantsOnly, predicate);

        return results;
    }

    /**
     * Get all child-meshes of this node
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: false)
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @returns an array of AbstractMesh
     */
    public getChildMeshes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[] {
        var results: Array<AbstractMesh> = [];
        this._getDescendants(results, directDescendantsOnly, (node: Node) => {
            return ((!predicate || predicate(node)) && ((<AbstractMesh>node).cullingStrategy !== undefined));
        });
        return results;
    }

    /**
     * Get all direct children of this node
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: true)
     * @returns an array of Node
     */
    public getChildren(predicate?: (node: Node) => boolean, directDescendantsOnly = true): Node[] {
        return this.getDescendants(directDescendantsOnly, predicate);
    }

    /** @hidden */
    public _setReady(state: boolean): void {
        if (state === this._isReady) {
            return;
        }

        if (!state) {
            this._isReady = false;
            return;
        }

        if (this.onReady) {
            this.onReady(this);
        }
        this._isReady = true;
    }

    /**
     * Get an animation by name
     * @param name defines the name of the animation to look for
     * @returns null if not found else the requested animation
     */
    public getAnimationByName(name: string): Nullable<Animation> {
        for (var i = 0; i < this.animations.length; i++) {
            var animation = this.animations[i];

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
            for (var i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
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
        for (var i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
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
     * Gets the list of all animation ranges defined on this node
     * @returns an array
     */
    public getAnimationRanges(): Nullable<AnimationRange>[] {
        var animationRanges: Nullable<AnimationRange>[] = [];
        var name: string;
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
        var range = this.getAnimationRange(name);

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
        var serializationRanges = [];
        for (var name in this._ranges) {
            var localRange = this._ranges[name];
            if (!localRange) {
                continue;
            }
            var range: any = {};
            range.name = name;
            range.from = localRange.from;
            range.to = localRange.to;
            serializationRanges.push(range);
        }
        return serializationRanges;
    }

    /**
     * Computes the world matrix of the node
     * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
     * @returns the world matrix
     */
    public computeWorldMatrix(force?: boolean): Matrix {
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
        this._isDisposed = true;

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

        // Behaviors
        for (var behavior of this._behaviors) {
            behavior.detach();
        }

        this._behaviors = [];
    }

    /**
     * Parse animation range data from a serialization object and store them into a given node
     * @param node defines where to store the animation ranges
     * @param parsedNode defines the serialization object to read data from
     * @param scene defines the hosting scene
     */
    public static ParseAnimationRanges(node: Node, parsedNode: any, scene: Scene): void {
        if (parsedNode.ranges) {
            for (var index = 0; index < parsedNode.ranges.length; index++) {
                var data = parsedNode.ranges[index];
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
    public getHierarchyBoundingVectors(includeDescendants = true, predicate: Nullable<(abstractMesh: AbstractMesh) => boolean> = null): { min: Vector3, max: Vector3 } {
        // Ensures that all world matrix will be recomputed.
        this.getScene().incrementRenderId();

        this.computeWorldMatrix(true);

        let min: Vector3;
        let max: Vector3;

        let thisAbstractMesh = (this as Node as AbstractMesh);
        if (thisAbstractMesh.getBoundingInfo && thisAbstractMesh.subMeshes) {
            // If this is an abstract mesh get its bounding info
            let boundingInfo = thisAbstractMesh.getBoundingInfo();
            min = boundingInfo.boundingBox.minimumWorld.clone();
            max = boundingInfo.boundingBox.maximumWorld.clone();
        } else {
            min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        }

        if (includeDescendants) {
            let descendants = this.getDescendants(false);

            for (var descendant of descendants) {
                let childMesh = <AbstractMesh>descendant;
                childMesh.computeWorldMatrix(true);

                // Filters meshes based on custom predicate function.
                if (predicate && !predicate(childMesh)) {
                    continue;
                }

                //make sure we have the needed params to get mix and max
                if (!childMesh.getBoundingInfo || childMesh.getTotalVertices() === 0) {
                    continue;
                }

                let childBoundingInfo = childMesh.getBoundingInfo();
                let boundingBox = childBoundingInfo.boundingBox;

                var minBox = boundingBox.minimumWorld;
                var maxBox = boundingBox.maximumWorld;

                Vector3.CheckExtends(minBox, min, max);
                Vector3.CheckExtends(maxBox, min, max);
            }
        }

        return {
            min: min,
            max: max
        };
    }
}

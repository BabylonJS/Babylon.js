﻿module BABYLON {

    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    export class Node {
        @serialize()
        public name: string;

        @serialize()
        public id: string;

        @serialize()
        public uniqueId: number;

        @serialize()
        public state = "";

        @serialize()
        public metadata: any = null;

        public doNotSerialize = false;

        public animations = new Array<Animation>();
        private _ranges: { [name: string]: Nullable<AnimationRange> } = {};

        public onReady: (node: Node) => void;

        private _isEnabled = true;
        private _isReady = true;
        public _currentRenderId = -1;
        private _parentRenderId = -1;

        public _waitingParentId: Nullable<string>;

        private _scene: Scene;
        public _cache: any;

        private _parentNode: Nullable<Node>;
        private _children: Node[];

        public set parent(parent: Nullable<Node>) {
            if (this._parentNode === parent) {
                return;
            }

            // Remove self from list of children of parent
            if (this._parentNode && this._parentNode._children !== undefined && this._parentNode._children !== null) {
                var index = this._parentNode._children.indexOf(this);
                if (index !== -1) {
                    this._parentNode._children.splice(index, 1);
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
            }
        }

        public get parent(): Nullable<Node> {
            return this._parentNode;
        }

        public getClassName(): string {
            return "Node";
        }

        /**
        * An event triggered when the mesh is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<Node>();

        private _onDisposeObserver: Nullable<Observer<Node>>;
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
         * @constructor
         * @param {string} name - the name and id to be given to this node
         * @param {BABYLON.Scene} the scene this node will be added to
         */
        constructor(name: string, scene: Nullable<Scene> = null) {
            this.name = name;
            this.id = name;
            this._scene = <Scene>(scene || Engine.LastCreatedScene);
            this.uniqueId = this._scene.getUniqueId();
            this._initCache();
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getEngine(): Engine {
            return this._scene.getEngine();
        }

        // Behaviors
        private _behaviors = new Array<Behavior<Node>>();

        public addBehavior(behavior: Behavior<Node>): Node {
            var index = this._behaviors.indexOf(behavior);

            if (index !== -1) {
                return this;
            }

            behavior.init();
            if (this._scene.isLoading) {
                // We defer the attach when the scene will be loaded
                var observer = this._scene.onDataLoadedObservable.add(() => {
                    behavior.attach(this);
                    setTimeout(() => {
                        // Need to use a timeout to avoid removing an observer while iterating the list of observers
                        this._scene.onDataLoadedObservable.remove(observer);
                    }, 0);
                });
            } else {
                behavior.attach(this);
            }
            this._behaviors.push(behavior);

            return this;
        }

        public removeBehavior(behavior: Behavior<Node>): Node {
            var index = this._behaviors.indexOf(behavior);

            if (index === -1) {
                return this;
            }

            this._behaviors[index].detach();
            this._behaviors.splice(index, 1);

            return this;
        }

        public get behaviors(): Behavior<Node>[] {
            return this._behaviors;
        }

        public getBehaviorByName(name: string): Nullable<Behavior<Node>> {
            for (var behavior of this._behaviors) {
                if (behavior.name === name) {
                    return behavior;
                }
            }

            return null;
        }

        // override it in derived class
        public getWorldMatrix(): Matrix {
            return Matrix.Identity();
        }

        // override it in derived class if you add new variables to the cache
        // and call the parent class method
        public _initCache() {
            this._cache = {};
            this._cache.parent = undefined;
        }

        public updateCache(force?: boolean): void {
            if (!force && this.isSynchronized())
                return;

            this._cache.parent = this.parent;

            this._updateCache();
        }

        // override it in derived class if you add new variables to the cache
        // and call the parent class method if !ignoreParentClass
        public _updateCache(ignoreParentClass?: boolean): void {
        }

        // override it in derived class if you add new variables to the cache
        public _isSynchronized(): boolean {
            return true;
        }

        public _markSyncedWithParent() {
            if (this.parent) {
                this._parentRenderId = this.parent._currentRenderId;
            }
        }

        public isSynchronizedWithParent(): boolean {
            if (!this.parent) {
                return true;
            }

            if (this._parentRenderId !== this.parent._currentRenderId) {
                return false;
            }

            return this.parent.isSynchronized();
        }

        public isSynchronized(updateCache?: boolean): boolean {
            var check = this.hasNewParent();

            check = check || !this.isSynchronizedWithParent();

            check = check || !this._isSynchronized();

            if (updateCache)
                this.updateCache(true);

            return !check;
        }

        public hasNewParent(update?: boolean): boolean {
            if (this._cache.parent === this.parent)
                return false;

            if (update)
                this._cache.parent = this.parent;

            return true;
        }

        /**
         * Is this node ready to be used/rendered
         * @return {boolean} is it ready
         */
        public isReady(): boolean {
            return this._isReady;
        }

        /**
         * Is this node enabled. 
         * If the node has a parent, all ancestors will be checked and false will be returned if any are false (not enabled), otherwise will return true.
         * @param {boolean} [checkAncestors=true] - Indicates if this method should check the ancestors. The default is to check the ancestors. If set to false, the method will return the value of this node without checking ancestors.
         * @return {boolean} whether this node (and its parent) is enabled.
         * @see setEnabled
         */
        public isEnabled(checkAncestors: boolean = true): boolean {
            if (checkAncestors === false) {
                return this._isEnabled;
            }

            if (this._isEnabled === false) {
                return false;
            }

            if (this.parent !== undefined && this.parent !== null) {
                return this.parent.isEnabled(checkAncestors);
            }

            return true;
        }

        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        public setEnabled(value: boolean): void {
            this._isEnabled = value;
        }

        /**
         * Is this node a descendant of the given node.
         * The function will iterate up the hierarchy until the ancestor was found or no more parents defined.
         * @param {BABYLON.Node} ancestor - The parent node to inspect
         * @see parent
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
         * Evaluate the list of children and determine if they should be considered as descendants considering the given criterias
         * @param {BABYLON.Node[]} results the result array containing the nodes matching the given criterias
         * @param {boolean} directDescendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         */
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
         * Will return all nodes that have this node as ascendant.
         * @param {boolean} directDescendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        public getDescendants(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): Node[] {
            var results = new Array<Node>();

            this._getDescendants(results, directDescendantsOnly, predicate);

            return results;
        }

        /**
         * Get all child-meshes of this node.
         */
        public getChildMeshes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[] {
            var results: Array<AbstractMesh> = [];
            this._getDescendants(results, directDescendantsOnly, (node: Node) => {
                return ((!predicate || predicate(node)) && (node instanceof AbstractMesh));
            });
            return results;
        }

        /**
         * Get all child-transformNodes of this node.
         */
        public getChildTransformNodes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): TransformNode[] {
            var results: Array<TransformNode> = [];
            this._getDescendants(results, directDescendantsOnly, (node: Node) => {
                return ((!predicate || predicate(node)) && (node instanceof TransformNode));
            });
            return results;
        }

        /**
         * Get all direct children of this node.
        */
        public getChildren(predicate?: (node: Node) => boolean): Node[] {
            return this.getDescendants(true, predicate);
        }

        public _setReady(state: boolean): void {
            if (state === this._isReady) {
                return;
            }

            if (!state) {
                this._isReady = false;
                return;
            }

            this._isReady = true;
            if (this.onReady) {
                this.onReady(this);
            }
        }

        public getAnimationByName(name: string): Nullable<Animation> {
            for (var i = 0; i < this.animations.length; i++) {
                var animation = this.animations[i];

                if (animation.name === name) {
                    return animation;
                }
            }

            return null;
        }

        public createAnimationRange(name: string, from: number, to: number): void {
            // check name not already in use
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
                for (var i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
                    if (this.animations[i]) {
                        this.animations[i].createRange(name, from, to);
                    }
                }
            }
        }

        public deleteAnimationRange(name: string, deleteFrames = true): void {
            for (var i = 0, nAnimations = this.animations.length; i < nAnimations; i++) {
                if (this.animations[i]) {
                    this.animations[i].deleteRange(name, deleteFrames);
                }
            }
            this._ranges[name] = null; // said much faster than 'delete this._range[name]' 
        }

        public getAnimationRange(name: string): Nullable<AnimationRange> {
            return this._ranges[name];
        }

        public beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): void {
            var range = this.getAnimationRange(name);

            if (!range) {
                return;
            }

            this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        }

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

        // override it in derived class
        public computeWorldMatrix(force?: boolean): Matrix {
            return Matrix.Identity();
        }

        public dispose(): void {
            this.parent = null;

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();

            // Behaviors
            for (var behavior of this._behaviors) {
                behavior.detach();
            }

            this._behaviors = [];
        }

        public static ParseAnimationRanges(node: Node, parsedNode: any, scene: Scene): void {
            if (parsedNode.ranges) {
                for (var index = 0; index < parsedNode.ranges.length; index++) {
                    var data = parsedNode.ranges[index];
                    node.createAnimationRange(data.name, data.from, data.to);
                }
            }
        }
    }
} 

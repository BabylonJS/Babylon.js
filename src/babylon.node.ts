module BABYLON {

    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    export class Node {
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
         * Gets or sets a boolean used to define if the node must be serialized
         */
        public doNotSerialize = false;
        
        /** @ignore */
        public _isDisposed = false;        

        /**
         * Gets a list of {BABYLON.Animation} associated with the node
         */
        public animations = new Array<Animation>();
        private _ranges: { [name: string]: Nullable<AnimationRange> } = {};

        /**
         * Callback raised when the node is ready to be used
         */
        public onReady: (node: Node) => void;

        private _isEnabled = true;
        private _isReady = true;
        /** @ignore */
        public _currentRenderId = -1;
        private _parentRenderId = -1;

        /** @ignore */
        public _waitingParentId: Nullable<string>;

        private _scene: Scene;
        /** @ignore */
        public _cache: any;

        private _parentNode: Nullable<Node>;
        private _children: Node[];

        /**
         * Gets a boolean indicating if the node has been disposed
         * @returns true if the node was disposed
         */
        public isDisposed(): boolean {
            return this._isDisposed;
        }        

        /**
         * Gets or sets the parent of the node
         */
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

        
        private _animationPropertiesOverride: Nullable<AnimationPropertiesOverride> = null;

        /**
         * Gets or sets the animation properties override
         */
        public get animationPropertiesOverride(): Nullable<AnimationPropertiesOverride> {
            return this._animationPropertiesOverride;
        }

        public set animationPropertiesOverride(value: Nullable<AnimationPropertiesOverride>) {
            this._animationPropertiesOverride = value;
        }

        /**
         * Gets a string idenfifying the name of the class
         * @returns "Node" string
         */
        public getClassName(): string {
            return "Node";
        }

        /**
        * An event triggered when the mesh is disposed
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<Node>();

        private _onDisposeObserver: Nullable<Observer<Node>>;
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

        /**
         * Gets the scene of the node
         * @returns a {BABYLON.Scene}
         */
        public getScene(): Scene {
            return this._scene;
        }

        /**
         * Gets the engine of the node
         * @returns a {BABYLON.Engine}
         */
        public getEngine(): Engine {
            return this._scene.getEngine();
        }

        // Behaviors
        private _behaviors = new Array<Behavior<Node>>();

        /**
         * Attach a behavior to the node
         * @see http://doc.babylonjs.com/features/behaviour
         * @param behavior defines the behavior to attach
         * @returns the current Node
         */
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

        /**
         * Remove an attached behavior
         * @see http://doc.babylonjs.com/features/behaviour
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
         * @see http://doc.babylonjs.com/features/behaviour
         */
        public get behaviors(): Behavior<Node>[] {
            return this._behaviors;
        }

        /**
         * Gets an attached behavior by name
         * @param name defines the name of the behavior to look for
         * @see http://doc.babylonjs.com/features/behaviour
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
         * Returns the world matrix of the node
         * @returns a matrix containing the node's world matrix
         */
        public getWorldMatrix(): Matrix {
            return Matrix.Identity();
        }

        // override it in derived class if you add new variables to the cache
        // and call the parent class method
        /** @ignore */
        public _initCache() {
            this._cache = {};
            this._cache.parent = undefined;
        }

        /** @ignore */
        public updateCache(force?: boolean): void {
            if (!force && this.isSynchronized())
                return;

            this._cache.parent = this.parent;

            this._updateCache();
        }

        // override it in derived class if you add new variables to the cache
        // and call the parent class method if !ignoreParentClass
        /** @ignore */
        public _updateCache(ignoreParentClass?: boolean): void {
        }

        // override it in derived class if you add new variables to the cache
        /** @ignore */
        public _isSynchronized(): boolean {
            return true;
        }

        /** @ignore */
        public _markSyncedWithParent() {
            if (this.parent) {
                this._parentRenderId = this.parent._currentRenderId;
            }
        }

        /** @ignore */
        public isSynchronizedWithParent(): boolean {
            if (!this.parent) {
                return true;
            }

            if (this._parentRenderId !== this.parent._currentRenderId) {
                return false;
            }

            return this.parent.isSynchronized();
        }

        /** @ignore */
        public isSynchronized(updateCache?: boolean): boolean {
            var check = this.hasNewParent();

            check = check || !this.isSynchronizedWithParent();

            check = check || !this._isSynchronized();

            if (updateCache)
                this.updateCache(true);

            return !check;
        }

        /** @ignore */
        public hasNewParent(update?: boolean): boolean {
            if (this._cache.parent === this.parent)
                return false;

            if (update)
                this._cache.parent = this.parent;

            return true;
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
         * Set the enabled state of this node
         * @param value defines the new enabled state
         * @see isEnabled
         */
        public setEnabled(value: boolean): void {
            this._isEnabled = value;
        }

        /**
         * Is this node a descendant of the given node?
         * The function will iterate up the hierarchy until the ancestor was found or no more parents defined
         * @param ancestor defines the parent node to inspect
         * @see parent
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

        /** @ignore */
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
         * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
         * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
         * @returns an array of {BABYLON.AbstractMesh}
         */
        public getChildMeshes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[] {
            var results: Array<AbstractMesh> = [];
            this._getDescendants(results, directDescendantsOnly, (node: Node) => {
                return ((!predicate || predicate(node)) && (node instanceof AbstractMesh));
            });
            return results;
        }

        /**
         * Get all child-transformNodes of this node
         * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
         * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
         * @returns an array of {BABYLON.TransformNode}
         */
        public getChildTransformNodes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): TransformNode[] {
            var results: Array<TransformNode> = [];
            this._getDescendants(results, directDescendantsOnly, (node: Node) => {
                return ((!predicate || predicate(node)) && (node instanceof TransformNode));
            });
            return results;
        }

        /**
         * Get all direct children of this node
         * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
         * @returns an array of {BABYLON.Node}
         */
        public getChildren(predicate?: (node: Node) => boolean): Node[] {
            return this.getDescendants(true, predicate);
        }

        /** @ignore */
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
                this._ranges[name] = new AnimationRange(name, from, to);
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
            return this._ranges[name];
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
            return Matrix.Identity();
        }

        /**
         * Releases resources associated with this node.
         * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
         * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
         */
        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
            if (!doNotRecurse) {
                const nodes = this.getDescendants(true);
                for (const node of nodes) {
                    node.dispose(doNotRecurse, disposeMaterialAndTextures);
                }
            } else {
                const transformNodes = this.getChildTransformNodes(true);
                for (const transformNode of transformNodes) {
                    transformNode.parent = null;
                    transformNode.computeWorldMatrix(true);
                }
            }

            this.parent = null;

            // Callback
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();

            // Behaviors
            for (var behavior of this._behaviors) {
                behavior.detach();
            }

            this._behaviors = [];
            this._isDisposed = true;
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
    }
} 

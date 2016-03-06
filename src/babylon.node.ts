module BABYLON {

    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    export class Node {
        public parent: Node;

        @serialize()
        public name: string;

        @serialize()
        public id: string;

        @serialize()
        public uniqueId: number;

        @serialize()
        public state = "";

        public animations = new Array<Animation>();
        private _ranges: { [name: string]: AnimationRange; } = {};

        public onReady: (node: Node) => void;

        private _childrenFlag = -1;
        private _isEnabled = true;
        private _isReady = true;
        public _currentRenderId = -1;
        private _parentRenderId = -1;

        public _waitingParentId: string;

        private _scene: Scene;
        public _cache;

        /**
         * @constructor
         * @param {string} name - the name and id to be given to this node
         * @param {BABYLON.Scene} the scene this node will be added to
         */
        constructor(name: string, scene: Scene) {
            this.name = name;
            this.id = name;
            this._scene = scene;
            this._initCache();
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getEngine(): Engine {
            return this._scene.getEngine();
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
            this._parentRenderId = this.parent._currentRenderId;
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
         * If the node has a parent and is enabled, the parent will be inspected as well.
         * @return {boolean} whether this node (and its parent) is enabled.
         * @see setEnabled
         */
        public isEnabled(): boolean {
            if (!this._isEnabled) {
                return false;
            }

            if (this.parent) {
                return this.parent.isEnabled();
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

        public _getDescendants(list: Node[], results: Node[], directDecendantsOnly: boolean = false): void {
            for (var index = 0; index < list.length; index++) {
                var item = list[index];
                if ((directDecendantsOnly && item.parent === this) || (!directDecendantsOnly && item.isDescendantOf(this))) {
                    results.push(item);
                }
            }
        }

        /**
         * Will return all nodes that have this node as parent.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        public getDescendants(directDecendantsOnly?: boolean): Node[] {
            var results = [];
            this._getDescendants(this._scene.meshes, results, directDecendantsOnly);
            this._getDescendants(this._scene.lights, results, directDecendantsOnly);
            this._getDescendants(this._scene.cameras, results, directDecendantsOnly);

            return results;
        }
        
        /**
         * @Deprecated, legacy support.
         * use getDecendants instead.
         */
        public getChildren(): Node[] {
            return this.getDescendants(true);
        }
        
        /**
         * Get all child-meshes of this node.
         */
        public getChildMeshes(directDecendantsOnly?: boolean): AbstractMesh[] {
            var results: Array<AbstractMesh> = [];
            this._getDescendants(this._scene.meshes, results, directDecendantsOnly);
            return results;
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

        public getAnimationByName(name: string): Animation {
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
            this._ranges[name] = undefined; // said much faster than 'delete this._range[name]' 
        }

        public getAnimationRange(name: string): AnimationRange {
            return this._ranges[name];
        }

        public beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): void {
            var range = this.getAnimationRange(name);

            if (!range) {
                return null;
            }

            this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        }

        public serializeAnimationRanges(): any {
            var serializationRanges = [];
            for (var name in this._ranges) {
                var range: any = {};
                range.name = name;
                range.from = this._ranges[name].from;
                range.to = this._ranges[name].to;
                serializationRanges.push(range);
            }
            return serializationRanges;
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
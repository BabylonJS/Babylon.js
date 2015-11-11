﻿module BABYLON {

    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    export class Node {
        public parent: Node;
        public name: string;
        public id: string;
        public uniqueId: number;
        public state = "";

        public animations = new Array<Animation>();

        public onReady: (node: Node) => void;

        private _childrenFlag = -1;
        private _isEnabled = true;
        private _isReady = true;
        public _currentRenderId = -1;
        private _parentRenderId = -1;

        public _waitingParentId: string;

        private _scene: Scene;
        public _cache;

        // enable POV at node level; not initialized, since not every light and camera has position & direction / rotation
        public definedFacingForward = true;
        public position : Vector3; // for meshes, all cameras (only TargetCamera sub-classes POV capable),  SpotLight, DirectionalLight, & PointLight (not POV capable)
        public rotation : Vector3; // for meshes & TargetCamera sub-classes
        public rotationQuaternion: Quaternion; // for meshes only
        public direction: Vector3; // for SpotLight, DirectionalLight & HemisphericLight (POV rotation only)
        
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

        public _getDescendants(list: Node[], results: Node[]): void {
            for (var index = 0; index < list.length; index++) {
                var item = list[index];
                if (item.isDescendantOf(this)) {
                    results.push(item);
                }
            }
        }

        /**
         * Will return all nodes that have this node as parent.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        public getDescendants(): Node[] {
            var results = [];
            this._getDescendants(this._scene.meshes, results);
            this._getDescendants(this._scene.lights, results);
            this._getDescendants(this._scene.cameras, results);

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
        // ================================== Point of View Movement =================================
        /**
         * Perform relative position change from the point of view of behind the front of the node.
         * This is performed taking into account the nodes current rotation / direction, so you do not have to care.
         * Supports definition of node facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         */
        public movePOV(amountRight: number, amountUp: number, amountForward: number): void {
            if (!this.position) return;
            this.position.addInPlace(this.calcMovePOV(amountRight, amountUp, amountForward));
        }

        /**
         * Calculate relative position change from the point of view of behind the front of the node.
         * This is performed taking into account the nodes current rotation / direction, so you do not have to care.
         * Supports definition of node facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         */
        public calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3 {
            var vecInput = this.rotation ? this.rotation : this.direction;
            if (!vecInput) return;
            
            var rotMatrix = new Matrix();
            var rotQuaternion = (this.rotationQuaternion) ? this.rotationQuaternion : Quaternion.RotationYawPitchRoll(vecInput.y, vecInput.x, vecInput.z);
            rotQuaternion.toRotationMatrix(rotMatrix);

            var translationDelta = Vector3.Zero();
            var defForwardMult = this.definedFacingForward ? -1 : 1;
            Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
            return translationDelta;
        }
        
        // ================================== Point of View Rotation =================================
        /**
         * Perform relative rotation change from the point of view of behind the front of the node.
         * Supports definition of node facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         */
        public rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): void {
            var vecInput = this.rotation ? this.rotation : this.direction;
            if (!vecInput) return;
            
            vecInput.addInPlace(this.calcRotatePOV(flipBack, twirlClockwise, tiltRight));
        }

        /**
         * Calculate relative rotation change from the point of view of behind the front of the node.
         * Supports definition of node facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         */
        public calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3 {
            var defForwardMult = this.definedFacingForward ? 1 : -1;
            return new Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
        }
    }
} 
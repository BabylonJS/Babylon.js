module BABYLON {
    export class Node {
        public parent: Node;
        public name: string;
        public id: string;
        public state = "";

        public animations = new Array<Animation>();

        public onReady: (node: Node) => void;

        private _childrenFlag = -1;
        private _isEnabled = true;
        private _isReady = true;
        public _currentRenderId = -1;

        private _scene: Scene;
        public _cache;

        constructor(name: string, scene) {
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

        public isSynchronizedWithParent(): boolean {
            return this.parent ? this.parent._currentRenderId <= this._currentRenderId : true;
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

        public isReady(): boolean {
            return this._isReady;
        }

        public isEnabled(): boolean {
            if (!this._isEnabled) {
                return false;
            }

            if (this.parent) {
                return this.parent.isEnabled();
            }

            return true;
        }

        public setEnabled(value: boolean): void {
            this._isEnabled = value;
        }

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

        public getDescendants(): Node[] {
            var results = [];
            this._getDescendants(this._scene.meshes, results);
            this._getDescendants(this._scene.lights, results);
            this._getDescendants(this._scene.cameras, results);

            return results;
        }

        public _setReady(state: boolean): void {
            if (state == this._isReady) {
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
    }
} 
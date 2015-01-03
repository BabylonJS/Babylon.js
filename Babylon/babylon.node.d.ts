declare module BABYLON {
    class Node {
        public parent: Node;
        public name: string;
        public id: string;
        public state: string;
        public animations: Animation[];
        public onReady: (node: Node) => void;
        private _childrenFlag;
        private _isEnabled;
        private _isReady;
        public _currentRenderId: number;
        public _waitingParentId: string;
        private _scene;
        public _cache: any;
        constructor(name: string, scene: any);
        public getScene(): Scene;
        public getEngine(): Engine;
        public getWorldMatrix(): Matrix;
        public _initCache(): void;
        public updateCache(force?: boolean): void;
        public _updateCache(ignoreParentClass?: boolean): void;
        public _isSynchronized(): boolean;
        public isSynchronizedWithParent(): boolean;
        public isSynchronized(updateCache?: boolean): boolean;
        public hasNewParent(update?: boolean): boolean;
        public isReady(): boolean;
        public isEnabled(): boolean;
        public setEnabled(value: boolean): void;
        public isDescendantOf(ancestor: Node): boolean;
        public _getDescendants(list: Node[], results: Node[]): void;
        public getDescendants(): Node[];
        public _setReady(state: boolean): void;
    }
}

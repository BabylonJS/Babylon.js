// globalThis.debugNode receives the selected node in the inspector
// eslint-disable-next-line @typescript-eslint/naming-convention
export function setDebugNode(node: any) {
    if (typeof globalThis !== "undefined") {
        (globalThis as any).debugNode = node;
        // GC to avoid memory leak on global reference
        if (typeof node._scene !== "undefined" && node._scene.onDisposeObservable) {
            node._scene.onDisposeObservable.add(() => {
                (globalThis as any).debugNode = null;
            });
        }
    }
}

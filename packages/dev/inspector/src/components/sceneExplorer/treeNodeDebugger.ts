// globalThis.debugNode will be able to receive any object selected in the inspector
declare global {
    interface GlobalThis {
        debugNode: any;
    }
}

// globalThis.debugNode receives the selected node in the inspector
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

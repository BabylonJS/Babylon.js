// window.debugNode will be able to receive any object selected in the inspector
declare global {
    interface Window {
        debugNode: any;
    }
}

export function setDebugNode(node: any) {
    // Prevents a NodeJS env to crash on a non existing window
    if (typeof window !== "undefined") {
        window.debugNode = node;
    }
}

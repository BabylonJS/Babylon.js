declare global {
    interface Window {debugNode: any;}
}

export function setDebugNode(node: any){
    window.debugNode = node;
}

export interface INodeData {
    data: any;
    name: string;
    uniqueId: string;
    getClassName: () => string;
    dispose: () => void;
}
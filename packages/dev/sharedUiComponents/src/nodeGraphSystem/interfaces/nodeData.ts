export interface INodeData {
    data: any;
    name: string;
    uniqueId: number;
    getClassName: () => string;
    dispose: () => void;
}
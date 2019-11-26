export interface INodeLocationInfo {
    blockId: number;
    x: number;
    y: number;
}

export interface IEditorData {
    locations: INodeLocationInfo[];
    x: number;
    y: number;
    zoom: number;
}
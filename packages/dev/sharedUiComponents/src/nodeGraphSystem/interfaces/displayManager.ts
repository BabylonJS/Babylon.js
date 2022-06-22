import { INodeData } from "./nodeData";
import { IPortData } from "./portData";

export interface IDisplayManager {
    getHeaderClass(data: INodeData): string;
    shouldDisplayPortLabels(data: IPortData): boolean;
    updatePreviewContent(data: INodeData, contentArea: HTMLDivElement): void;
    getBackgroundColor(data: INodeData): string;
    getHeaderText(data: INodeData): string;
}

import type { Nullable } from "core/types";
import type { StateManager } from "../stateManager";
import type { INodeData } from "./nodeData";
import type { IPortData } from "./portData";

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface VisualContentDescription {
    [key: string]: HTMLElement;
}

export interface IDisplayManager {
    getHeaderClass(data: INodeData): string;
    shouldDisplayPortLabels(data: IPortData): boolean;
    updatePreviewContent(data: INodeData, contentArea: HTMLDivElement): void;
    updateFullVisualContent?(data: INodeData, visualContent: VisualContentDescription): void;
    getBackgroundColor(data: INodeData): string;
    getHeaderText(data: INodeData): string;
    onSelectionChanged?(data: INodeData, selectedData: Nullable<INodeData>, manager: StateManager): void;
    onDispose?(nodeData: INodeData, manager: StateManager): void;
}

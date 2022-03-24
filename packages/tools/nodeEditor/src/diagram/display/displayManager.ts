import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";

export interface IDisplayManager {
    getHeaderClass(block: NodeMaterialBlock): string;
    shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
    updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    getBackgroundColor(block: NodeMaterialBlock): string;
    getHeaderText(block: NodeMaterialBlock): string;
}

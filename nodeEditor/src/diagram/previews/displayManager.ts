import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';

export interface IDisplayManager {
    getHeaderClass(block: NodeMaterialBlock): string;
    shouldDisplayPortLabels(block: NodeMaterialBlock): boolean;
    setPreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void;
    getBackgroundColor(block: NodeMaterialBlock): string;
    getHeaderText(block: NodeMaterialBlock): string;
}
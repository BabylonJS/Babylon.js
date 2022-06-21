export interface IDisplayManager {
    getHeaderClass(data: any): string;
    shouldDisplayPortLabels(data: any): boolean;
    updatePreviewContent(data: any, contentArea: HTMLDivElement): void;
    getBackgroundColor(data: any): string;
    getHeaderText(data: any): string;
}

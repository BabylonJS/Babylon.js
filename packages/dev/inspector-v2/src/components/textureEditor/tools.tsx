import type { IMetadata, IToolData, IToolType } from "./textureEditor";

export interface ITool extends IToolData {
    instance: IToolType;
}

interface IToolBarProps {
    tools: ITool[];
    addTool(url: string): void;
    changeTool(toolIndex: number): void;
    activeToolIndex: number;
    metadata: IMetadata;
    setMetadata(data: any): void;
    pickerOpen: boolean;
    setPickerOpen(open: boolean): void;
    pickerRef: React.RefObject<HTMLDivElement>;
    hasAlpha: boolean;
}

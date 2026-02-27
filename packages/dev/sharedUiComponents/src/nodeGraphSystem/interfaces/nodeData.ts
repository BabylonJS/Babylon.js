import type { Nullable } from "core/types";
import type { IPortData } from "./portData";

export interface INodeData {
    data: any;
    name: string;
    uniqueId: number;
    isInput: boolean;
    comments: string;
    executionTime?: number;

    refreshCallback?: () => void;

    prepareHeaderIcon: (iconDiv: HTMLDivElement, img: HTMLImageElement) => void;
    getClassName: () => string;
    dispose: () => void;

    getPortByName: (name: string) => Nullable<IPortData>;

    inputs: IPortData[];
    outputs: IPortData[];

    invisibleEndpoints?: Nullable<any[]>;

    isConnectedToOutput?: () => boolean;

    isActive?: boolean;
    setIsActive?: (value: boolean) => void;
    canBeActivated?: boolean;

    onInputCountChanged?: () => void;
    onInputRemoved?: (index: number) => void;
}

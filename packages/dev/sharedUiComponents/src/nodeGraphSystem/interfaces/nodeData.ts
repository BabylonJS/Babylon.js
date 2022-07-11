import type { Nullable } from "core/types";
import type { IPortData } from "./portData";

export interface INodeData {
    data: any;
    name: string;
    uniqueId: number;
    isInput: boolean;
    comments: string;

    prepareHeaderIcon: (iconDiv: HTMLDivElement, img: HTMLImageElement) => void;
    getClassName: () => string;
    dispose: () => void;

    getPortByName: (name: string) => Nullable<IPortData>;

    inputs: IPortData[];
    outputs: IPortData[];
}

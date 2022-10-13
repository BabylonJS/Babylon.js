import type { ComponentType } from "react";

// Define layout typing
export type LayoutTab = {
    id: string;
    component: ComponentType;
};

export type LayoutTabsRow = {
    id: string;
    height: string;
    selectedTab: string;
    tabs: LayoutTab[];
};

export type LayoutColumn = {
    id: string;
    width: string;
    rows: LayoutTabsRow[];
};

export type Layout = {
    columns?: LayoutColumn[];
};

export type TabDrag = {
    rowNumber: number;
    columnNumber: number;
    tabs: { id: string }[];
};

export enum ElementTypes {
    RESIZE_BAR = "0",
    TAB = "1",
    TAB_GROUP = "2",
    NONE = "2",
}

export enum ResizeDirections {
    ROW = "row",
    COLUMN = "column",
}

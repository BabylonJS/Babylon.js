import type { Layout } from "./types";

export const getPosInLayout = (layout: Layout, column: number, row?: number) => {
    const columnLayout = layout.columns[column];
    if (!columnLayout) {
        throw new Error("Attempted to get an invalid layout column");
    }
    if (row === undefined) {
        return columnLayout;
    }
    return columnLayout.rows[row];
};

/**
 * Add a percentage string to a number
 */
export const addPercentageStringToNumber = (p1: string, p2: number): number => {
    // Convert both values to numbers
    const np1 = Number.parseFloat(p1.replace("%", ""));
    const np2 = p2;

    const nr = np1 + np2;
    return nr;
};

/**
 * Get the percentage of a position relative to a bounding rect
 * @param x
 * @param y
 * @param rect
 * @returns
 */
export const getPercentageInsideRect = (x: number, y: number, rect: DOMRect): { xPercentage: number; yPercentage: number } => {
    const xPercentage = (x - rect.left) / rect.width;
    const yPercentage = (y - rect.top) / rect.height;
    return { xPercentage, yPercentage };
};

/**
 * Parses a percentage string into a number
 * @param p the percentage string
 */
export const parsePercentage = (p: string): number => {
    return Number.parseFloat(p.replace("%", ""));
};

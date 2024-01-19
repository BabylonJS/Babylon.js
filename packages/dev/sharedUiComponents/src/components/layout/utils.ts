import type { Layout, LayoutColumn, LayoutTabsRow } from "./types";

/**
 * Given a column and row number in the layout, return the corresponding column/row
 * @param layout
 * @param column
 * @param row
 * @returns
 */
export const getPosInLayout = (layout: Layout, column: number, row?: number): LayoutColumn | LayoutTabsRow => {
    if (!layout.columns) {
        throw new Error("Attempted to get position on empty layout");
    }
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
 * Remove a row in position row, column from the layout, and redistribute heights of remaining rows
 * @param layout
 * @param column
 * @param row
 */
export const removeLayoutRowAndRedistributePercentages = (layout: Layout, column: number, row: number) => {
    if (!layout.columns) {
        throw new Error("Attempted to get position on empty layout");
    }
    const columnLayout = layout.columns[column];
    if (!columnLayout) {
        throw new Error("Attempted to get an invalid layout column");
    }
    const rowLayout = columnLayout.rows[row];
    if (!rowLayout) {
        throw new Error("Attempted to get an invalid layout row");
    }
    const rowHeight = rowLayout.height;
    if (rowHeight === undefined) {
        throw new Error("Attempted to remove a row with no height");
    }
    // Remove row from layout
    columnLayout.rows.splice(row, 1);

    // Redistribute this row's height to the remaining rows
    const percToAdd = parsePercentage(rowHeight) / columnLayout.rows.length;
    columnLayout.rows.forEach((row: any) => {
        row.height = addPercentageStringToNumber(row.height, percToAdd) + "%";
    });
};

/**
 * Add a percentage string to a number
 * @param p1 the percentage string
 * @param p2 the number
 * @returns the sum of the percentage string and the number
 */
export const addPercentageStringToNumber = (p1: string, p2: number): number => {
    // Convert both values to numbers
    const np1 = Number.parseFloat(p1.replace("%", ""));
    const np2 = p2;

    const nr = np1 + np2;
    return nr;
};

/**
 * Parses a percentage string into a number
 * @param p the percentage string
 * @returns the parsed number
 */
export const parsePercentage = (p: string): number => {
    return Number.parseFloat(p.replace("%", ""));
};

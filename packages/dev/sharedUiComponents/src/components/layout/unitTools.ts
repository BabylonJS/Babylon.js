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

/**
 * Add two strings that represent percentage values and return the string
 * that represents the addition
 */
export const addPercentages = (p1: string, p2: string): string => {
    // Convert both values to numbers
    const np1 = Number.parseFloat(p1.replace("%", ""));
    const np2 = Number.parseFloat(p2.replace("%", ""));

    const nr = np1 + np2;
    const r = nr.toFixed(2) + "%";
    return r;
};

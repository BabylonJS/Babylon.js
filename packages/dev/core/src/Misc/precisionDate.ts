import { IsWindowObjectExist } from "./domManagement";

const now = IsWindowObjectExist() && window.performance && window.performance.now ? () => window.performance.now() : () => Date.now();

/**
 * Class containing a set of static utilities functions for precision date
 */
export class PrecisionDate {
    /**
     * Gets either window.performance.now() if supported or Date.now() else
     */
    public static get Now(): number {
        return now();
    }
}

import { IsWindowObjectExist } from "./domManagement";

/**
 * Class containing a set of static utilities functions for precision date
 */
export class PrecisionDate {
    /**
     * Gets either window.performance.now() if supported or Date.now() else
     */
    public static get Now(): number {
        return PrecisionDate._Now();
    }

    /**
     * Since Now is a property, we're using a private variable with a lambda to check which now function to use once
     */
    private static readonly _Now = IsWindowObjectExist() && window.performance && window.performance.now ? () => window.performance.now() : () => Date.now();
}

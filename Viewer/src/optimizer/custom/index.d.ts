import { extendedUpgrade } from "./extended";
/**
 *
 * @param name the name of the custom optimizer configuration
 * @param upgrade set to true if you want to upgrade optimizer and false if you want to degrade
 */
export declare function getCustomOptimizerByName(name: string, upgrade?: boolean): typeof extendedUpgrade;

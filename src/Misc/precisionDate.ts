import { DomManagement } from './domManagement';

/**
 * Class containing a set of static utilities functions for precision date
 */
export class PrecisionDate {
    /**
     * Gets either window.performance.now() if supported or Date.now() else
     */
    public static get Now(): number {
        if (DomManagement.IsWindowObjectExist() && window.performance && window.performance.now) {
            return window.performance.now();
        }

        return Date.now();
    }
}

declare module INSPECTOR {
    class Scheduler {
        private static _instance;
        /** The number of the set interval */
        private _timer;
        /** Is this scheduler in pause ? */
        pause: boolean;
        /** All properties are refreshed every 250ms */
        static REFRESH_TIME: number;
        /** The list of data to update */
        private _updatableProperties;
        constructor();
        static getInstance(): Scheduler;
        /** Add a property line to be updated every X ms */
        add(prop: PropertyLine): void;
        /** Removes the given property from the list of properties to update */
        remove(prop: PropertyLine): void;
        private _update();
    }
}

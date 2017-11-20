module INSPECTOR {

    export class Scheduler {

        private static _instance: Scheduler;

        /** Is this scheduler in pause ? */
        public pause: boolean = false;

        /** All properties are refreshed every 250ms */
        public static REFRESH_TIME: number = 250;

        /** The list of data to update */
        private _updatableProperties: Array<PropertyLine> = [];

        constructor () {
            setInterval(this._update.bind(this), Scheduler.REFRESH_TIME);
        }

        public static getInstance() : Scheduler {
            if (!Scheduler._instance) {
                Scheduler._instance = new Scheduler();
            }
            return Scheduler._instance;
        }

        /** Add a property line to be updated every X ms */
        public add(prop:PropertyLine) {
            this._updatableProperties.push(prop);
        }
        
        /** Removes the given property from the list of properties to update */
        public remove(prop:PropertyLine) {
            let index = this._updatableProperties.indexOf(prop);
            if (index != -1) {
                this._updatableProperties.splice(index, 1);
            }
        }

        private _update() {
            // If not in pause, update 
            if (!this.pause) {
                for (let prop of this._updatableProperties) {
                    prop.update();
                }
            }
        }
    }
}
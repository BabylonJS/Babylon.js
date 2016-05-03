module BABYLON {
    /**
     * This class implement a typical dictionary using a string as key and the generic type T as value.
     * The underlying implemetation relies on an associative array to ensure the best performances.
     * The value can be anything including 'null' but except 'undefined'
     */
    export class StringDictionary<T> {
        /**
         * Get a value based from its key
         * @param key the given key to get the matching value from
         * @return the value if found, otherwise undefined is returned
         */
        public get(key: string): T {
            var val = this._data[key];
            if (val !== undefined) {
                return val;
            }
            return undefined;
        }

        /**
         * Get a value from its key or add it if it doesn't exist.
         * This method will ensure you that a given key/data will be present in the dictionary.
         * @param key the given key to get the matchin value from
         * @param factory the factory that will create the value if the key is not present in the dictionary.
         * The factory will only be invoked if there's no data for the given key.
         * @return the value corresponding to the key.
         */
        public getOrAddWithFactory(key: string, factory: (key: string) => T): T {
            var val = this.get(key);
            if (val !== undefined) {
                return val;
            }

            val = factory(key);
            if (val) {
                this.add(key, val);
            }

            return val;
        }

        /**
         * Get a value from its key if present in the dictionary otherwise add it
         * @param key the key to get the value from
         * @param val if there's no such key/value pair in the dictionary add it with this value
         * @return the value corresponding to the key
         */
        public getOrAdd(key: string, val: T): T {
            var curVal = this.get(key);
            if (curVal !== undefined) {
                return curVal;
            }

            this.add(key, val);
            return val;
        }

        /**
         * Check if there's a given key in the dictionary
         * @param key the key to check for
         * @return true if the key is present, false otherwise
         */
        public contains(key): boolean {
            return this._data[key] !== undefined;
        }

        /**
         * Add a new key and its corresponding value
         * @param key the key to add
         * @param value the value corresponding to the key
         * @return true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
         */
        public add(key: string, value: T): boolean {
            if (this._data[key] !== undefined) {
                return false;
            }
            this._data[key] = value;
            ++this._count;
            return true;
        }


        public set(key: string, value: T): boolean {
            if (this._data[key] === undefined) {
                return false;
            }
            this._data[key] = value;
            return true;
        }

        /**
         * Remove a key/value from the dictionary.
         * @param key the key to remove
         * @return true if the item was successfully deleted, false if no item with such key exist in the dictionary
         */
        public remove(key: string): boolean {
            if (this.contains(key)) {
                delete this._data[key];
                --this._count;
                return true;
            }
            return false;
        }

        /**
         * Clear the whole content of the dictionary
         */
        public clear() {
            this._data = {}
            this._count = 0;
        }

        public get count() {
            return this._count;
        }

        /**
         * Execute a callback on each key/val of the dictionary.
         * Note that you can remove any element in this dictionary in the callback implementation
         * @param callback the callback to execute on a given key/value pair
         */
        public forEach(callback: (key: string, val: T) => void) {
            for (let cur in this._data) {
                var val = this._data[cur];
                callback(cur, val);
            }
        }

        /**
         * Execute a callback on every occurence of the dictionary until it returns a valid TRes object.
         * If the callback returns null or undefined the method will iterate to the next key/value pair
         * Note that you can remove any element in this dictionary in the callback implementation
         * @param callback the callback to execute, if it return a valid T instanced object the enumeration will stop and the object will be returned
         */
        public first<TRes>(callback: (key: string, val: T) => TRes) {
            for (let cur in this._data) {
                var val = this._data[cur];
                var res = callback(cur, val);
                if (res) {
                    return res;
                }
            }
            return null;
        }

        private _count = 0;
        private _data = {};
    }
}
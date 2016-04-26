var BABYLON;
(function (BABYLON) {
    /**
    * The purpose of this class is to store float32 based elements of a given size (defined by the stride argument) in a dynamic fashion, that is, you can add/free elements. You can then access to a defragmented/packed version of the underlying Float32Array by calling the pack() method.
    * The intent is to maintain through time data that will be bound to a WebGlBuffer with the ability to change add/remove elements.
    * It was first built to effiently maintain the WebGlBuffer that contain instancing based data.
    * Allocating an Element will return a instance of DynamicFloatArrayEntry which contains the offset into the Float32Array of where the element starts, you are then responsible to copy your data using this offset.
    * Beware, calling pack() may change the offset of some Entries because this method will defrag the Float32Array to replace empty elements by moving allocated ones at their location.
     * This method will return an ArrayBufferView on the existing Float32Array that describes the occupied elements. Use this View to update the WebGLBuffer and NOT the "buffer" field of the class. The pack() method won't shrink/reallocate the buffer to keep it GC friendly, all the empty space will be put at the end of the buffer, the method just ensure there're no "free holes".
    */
    var DynamicFloatArray = (function () {
        /**
         * Construct an instance of the dynamic float array
         * @param stride size of one entry in float (i.e. not bytes!)
         * @param initialEntryCount the number of available entries at construction
         */
        function DynamicFloatArray(stride, initialEntryCount) {
            this.stride = stride;
            this.entryCount = initialEntryCount;
            this.buffer = new Float32Array(stride * initialEntryCount);
            this.lastOccupied = 0;
            this.firstFree = 0;
            this.allEntries = new Array(initialEntryCount);
            this.freeEntries = new Array(initialEntryCount);
            for (var i = 0; i < initialEntryCount; i++) {
                var entry = new DynamicFloatArrayEntry();
                entry.offset = i * stride;
                this.allEntries[i] = entry;
                this.freeEntries[initialEntryCount - i - 1] = entry;
            }
        }
        DynamicFloatArray.prototype.allocElement = function () {
            if (this.freeEntries.length === 0) {
                this._growBuffer();
            }
            var entry = this.freeEntries.pop();
            this.lastOccupied = Math.max(entry.offset, this.lastOccupied);
            if (entry.offset === this.firstFree) {
                if (this.freeEntries.length > 0) {
                    this.firstFree = this.freeEntries[this.freeEntries.length - 1].offset;
                }
                else {
                    this.firstFree += this.stride;
                }
            }
            return entry;
        };
        DynamicFloatArray.prototype.freeElement = function (entry) {
            this.firstFree = Math.min(entry.offset, this.firstFree);
            this.freeEntries.push(entry);
        };
        /**
         * This method will pack all the occupied elements into a linear sequence and put all the free space at the end.
         * Instances of DynamicFloatArrayEntry may have their 'offset' member changed as data could be copied from one location to another, so be sure to read/write your data based on the value inside this member after you called pack().
         * @return the subarray that is the view of the occupied elements area, you can use it as a source to update a WebGLBuffer
         */
        DynamicFloatArray.prototype.pack = function () {
            // no free slot? no need to pack
            if (this.freeEntries.length === 0) {
                return this.buffer;
            }
            // If the buffer is already packed the last occupied will always be lower than the first free
            if (this.lastOccupied < this.firstFree) {
                var elementsBuffer_1 = this.buffer.subarray(0, this.lastOccupied + this.stride);
                return elementsBuffer_1;
            }
            var s = this.stride;
            // Make sure there's a free element at the very end, we need it to create a range where we'll move the occupied elements that may appear before
            var lastFree = new DynamicFloatArrayEntry();
            lastFree.offset = this.entryCount * s;
            this.freeEntries.push(lastFree);
            var sortedFree = this.freeEntries.sort(function (a, b) { return a.offset - b.offset; });
            var sortedAll = this.allEntries.sort(function (a, b) { return a.offset - b.offset; });
            var firstFreeSlotOffset = sortedFree[0].offset;
            var freeZoneSize = 1;
            // The sortedFree array is sorted in reverse, first free at the end, last free at the beginning, so we loop from the end to beginning
            var prevOffset = sortedFree[0].offset;
            for (var i = 1; i < sortedFree.length; i++) {
                var curFree = sortedFree[i];
                var curOffset = curFree.offset;
                // Compute the distance between this offset and the previous
                var distance = curOffset - prevOffset;
                // If the distance is the stride size, they are adjacents, it good, move to the next
                if (distance === s) {
                    // Free zone is one element bigger
                    ++freeZoneSize;
                    // as we're about to iterate to the next, the cur becomes the prev...
                    prevOffset = curOffset;
                    continue;
                }
                // Distance is bigger, which means there's x element between the previous free and this one
                var occupiedRange = (distance / s) - 1;
                // Two cases the free zone is smaller than the data to move or bigger
                // Copy what can fit in the free zone
                var curMoveOffset = curOffset - s;
                var copyCount = Math.min(freeZoneSize, occupiedRange);
                for (var j = 0; j < copyCount; j++) {
                    var freeI = firstFreeSlotOffset / s;
                    var curI = curMoveOffset / s;
                    var moveEntry = sortedAll[curI];
                    this._moveEntry(moveEntry, firstFreeSlotOffset);
                    var replacedEntry = sortedAll[freeI];
                    // set the offset of the element entry we replace with a value that will make it discard at the end of the method
                    replacedEntry.offset = curMoveOffset;
                    // Swap the entry we moved and the one it replaced in the sorted array to reflect the action we've made
                    sortedAll[freeI] = moveEntry;
                    sortedAll[curI] = replacedEntry;
                    curMoveOffset -= s;
                    firstFreeSlotOffset += s;
                }
                // Free Zone is smaller or equal so it's no longer a free zone, set the new one to the current location
                if (freeZoneSize <= occupiedRange) {
                    firstFreeSlotOffset = curOffset;
                    freeZoneSize = 1;
                }
                else {
                    freeZoneSize = ((curOffset - firstFreeSlotOffset) / s) + 1;
                }
                // as we're about to iterate to the next, the cur becomes the prev...
                prevOffset = curOffset;
            }
            var elementsBuffer = this.buffer.subarray(0, firstFreeSlotOffset);
            this.lastOccupied = firstFreeSlotOffset - s;
            this.firstFree = firstFreeSlotOffset;
            sortedFree.pop(); // Remove the last free because that's the one we added at the start of the method
            this.freeEntries = sortedFree.sort(function (a, b) { return b.offset - a.offset; });
            this.allEntries = sortedAll;
            return elementsBuffer;
        };
        DynamicFloatArray.prototype._moveEntry = function (entry, destOffset) {
            for (var i = 0; i < this.stride; i++) {
                this.buffer[destOffset + i] = this.buffer[entry.offset + i];
            }
            entry.offset = destOffset;
        };
        DynamicFloatArray.prototype._growBuffer = function () {
            // Allocate the new buffer with 50% more entries, copy the content of the current one
            var newEntryCount = this.entryCount * 1.5;
            var newBuffer = new Float32Array(newEntryCount * this.stride);
            newBuffer.set(this.buffer);
            var addedCount = newEntryCount - this.entryCount;
            this.allEntries.length += addedCount;
            this.freeEntries.length += addedCount;
            for (var i = this.entryCount; i < newEntryCount; i++) {
                var entry = new DynamicFloatArrayEntry();
                entry.offset = i * this.stride;
                this.allEntries[i] = entry;
                this.freeEntries[i] = entry;
            }
            this.buffer = newBuffer;
            this.entryCount = newEntryCount;
        };
        return DynamicFloatArray;
    }());
    BABYLON.DynamicFloatArray = DynamicFloatArray;
    var DynamicFloatArrayEntry = (function () {
        function DynamicFloatArrayEntry() {
        }
        return DynamicFloatArrayEntry;
    }());
    BABYLON.DynamicFloatArrayEntry = DynamicFloatArrayEntry;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.dynamicFloatArray.js.map
var BABYLON;
(function (BABYLON) {
    var DynamicFloatArrayElementInfo = (function () {
        function DynamicFloatArrayElementInfo() {
        }
        return DynamicFloatArrayElementInfo;
    })();
    BABYLON.DynamicFloatArrayElementInfo = DynamicFloatArrayElementInfo;
    /**
    * The purpose of this class is to store float32 based elements of a given size (defined by the stride argument) in a dynamic fashion, that is, you can add/free elements. You can then access to a defragmented/packed version of the underlying Float32Array by calling the pack() method.
    * The intent is to maintain through time data that will be bound to a WebGlBuffer with the ability to change add/remove elements.
    * It was first built to efficiently maintain the WebGlBuffer that contain instancing based data.
    * Allocating an Element will return a instance of DynamicFloatArrayElement which contains the offset into the Float32Array of where the element starts, you are then responsible to copy your data using this offset.
    * Beware, calling pack() may change the offset of some Entries because this method will defragment the Float32Array to replace empty elements by moving allocated ones at their location.
     * This method will return an ArrayBufferView on the existing Float32Array that describes the used elements. Use this View to update the WebGLBuffer and NOT the "buffer" field of the class. The pack() method won't shrink/reallocate the buffer to keep it GC friendly, all the empty space will be put at the end of the buffer, the method just ensure there are no "free holes".
    */
    var DynamicFloatArray = (function () {
        /**
         * Construct an instance of the dynamic float array
         * @param stride size of one element in float (i.e. not bytes!)
         * @param initialElementCount the number of available entries at construction
         */
        function DynamicFloatArray(stride, initialElementCount) {
            this._stride = stride;
            this.buffer = new Float32Array(stride * initialElementCount);
            this._lastUsed = 0;
            this._firstFree = 0;
            this._allEntries = new Array(initialElementCount);
            this._freeEntries = new Array(initialElementCount);
            for (var i = 0; i < initialElementCount; i++) {
                var element = new DynamicFloatArrayElementInfo();
                element.offset = i * stride;
                this._allEntries[i] = element;
                this._freeEntries[initialElementCount - i - 1] = element;
            }
        }
        /**
         * Allocate an element in the array.
         * @return the element info instance that contains the offset into the main buffer of the element's location.
         * Beware, this offset may change when you call pack()
         */
        DynamicFloatArray.prototype.allocElement = function () {
            if (this._freeEntries.length === 0) {
                this._growBuffer();
            }
            var el = this._freeEntries.pop();
            this._lastUsed = Math.max(el.offset, this._lastUsed);
            if (el.offset === this._firstFree) {
                if (this._freeEntries.length > 0) {
                    this._firstFree = this._freeEntries[this._freeEntries.length - 1].offset;
                }
                else {
                    this._firstFree += this._stride;
                }
            }
            return el;
        };
        /**
         * Free the element corresponding to the given element info
         * @param elInfo the element that describe the allocated element
         */
        DynamicFloatArray.prototype.freeElement = function (elInfo) {
            this._firstFree = Math.min(elInfo.offset, this._firstFree);
            this._freeEntries.push(elInfo);
        };
        /**
         * This method will pack all the used elements into a linear sequence and put all the free space at the end.
         * Instances of DynamicFloatArrayElement may have their 'offset' member changed as data could be copied from one location to another, so be sure to read/write your data based on the value inside this member after you called pack().
         * @return the subArray that is the view of the used elements area, you can use it as a source to update a WebGLBuffer
         */
        DynamicFloatArray.prototype.pack = function () {
            // no free slot? no need to pack
            if (this._freeEntries.length === 0) {
                return this.buffer;
            }
            // If the buffer is already packed the last used will always be lower than the first free
            if (this._lastUsed < this._firstFree) {
                var elementsBuffer_1 = this.buffer.subarray(0, this._lastUsed + this._stride);
                return elementsBuffer_1;
            }
            var s = this._stride;
            // Make sure there's a free element at the very end, we need it to create a range where we'll move the used elements that may appear before
            var lastFree = new DynamicFloatArrayElementInfo();
            lastFree.offset = this.totalElementCount * s;
            this._freeEntries.push(lastFree);
            var sortedFree = this._freeEntries.sort(function (a, b) { return a.offset - b.offset; });
            var sortedAll = this._allEntries.sort(function (a, b) { return a.offset - b.offset; });
            var firstFreeSlotOffset = sortedFree[0].offset;
            var freeZoneSize = 1;
            var occupiedZoneSize = this.usedElementCount * s;
            var prevOffset = sortedFree[0].offset;
            for (var i = 1; i < sortedFree.length; i++) {
                // If the first free (which means everything before is occupied) is greater or equal the occupied zone size, it means everything is defragmented, we can quit
                if (firstFreeSlotOffset >= occupiedZoneSize) {
                    break;
                }
                var curFree = sortedFree[i];
                var curOffset = curFree.offset;
                // Compute the distance between this offset and the previous
                var distance = curOffset - prevOffset;
                // If the distance is the stride size, they are adjacent, it good, move to the next
                if (distance === s) {
                    // Free zone is one element bigger
                    ++freeZoneSize;
                    // as we're about to iterate to the next, the cur becomes the previous...
                    prevOffset = curOffset;
                    continue;
                }
                // Distance is bigger, which means there's x element between the previous free and this one
                var usedRange = (distance / s) - 1;
                // Two cases the free zone is smaller than the data to move or bigger
                // Copy what can fit in the free zone
                var curMoveOffset = curOffset - s;
                var copyCount = Math.min(freeZoneSize, usedRange);
                for (var j = 0; j < copyCount; j++) {
                    var freeI = firstFreeSlotOffset / s;
                    var curI = curMoveOffset / s;
                    var moveEl = sortedAll[curI];
                    this._moveElement(moveEl, firstFreeSlotOffset);
                    var replacedEl = sortedAll[freeI];
                    // set the offset of the element we replaced with a value that will make it discard at the end of the method
                    replacedEl.offset = curMoveOffset;
                    // Swap the element we moved and the one it replaced in the sorted array to reflect the action we've made
                    sortedAll[freeI] = moveEl;
                    sortedAll[curI] = replacedEl;
                    curMoveOffset -= s;
                    firstFreeSlotOffset += s;
                }
                // Free Zone is smaller or equal so it's no longer a free zone, set the new one to the current location
                if (freeZoneSize <= usedRange) {
                    firstFreeSlotOffset = curMoveOffset + s;
                    freeZoneSize = 1;
                }
                else {
                    freeZoneSize = ((curOffset - firstFreeSlotOffset) / s) + 1;
                }
                // as we're about to iterate to the next, the cur becomes the previous...
                prevOffset = curOffset;
            }
            var elementsBuffer = this.buffer.subarray(0, firstFreeSlotOffset);
            this._lastUsed = firstFreeSlotOffset - s;
            this._firstFree = firstFreeSlotOffset;
            sortedFree.pop(); // Remove the last free because that's the one we added at the start of the method
            this._freeEntries = sortedFree.sort(function (a, b) { return b.offset - a.offset; });
            this._allEntries = sortedAll;
            return elementsBuffer;
        };
        DynamicFloatArray.prototype._moveElement = function (element, destOffset) {
            for (var i = 0; i < this._stride; i++) {
                this.buffer[destOffset + i] = this.buffer[element.offset + i];
            }
            element.offset = destOffset;
        };
        DynamicFloatArray.prototype._growBuffer = function () {
            // Allocate the new buffer with 50% more entries, copy the content of the current one
            var newElCount = Math.floor(this.totalElementCount * 1.5);
            var newBuffer = new Float32Array(newElCount * this._stride);
            newBuffer.set(this.buffer);
            var curCount = this.totalElementCount;
            var addedCount = newElCount - this.totalElementCount;
            for (var i = 0; i < addedCount; i++) {
                var element = new DynamicFloatArrayElementInfo();
                element.offset = (curCount + i) * this.stride;
                this._allEntries.push(element);
                this._freeEntries[addedCount - i - 1] = element;
            }
            this._firstFree = curCount * this.stride;
            this.buffer = newBuffer;
        };
        Object.defineProperty(DynamicFloatArray.prototype, "totalElementCount", {
            /**
             * Get the total count of entries that can fit in the current buffer
             * @returns the elements count
             */
            get: function () {
                return this._allEntries.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DynamicFloatArray.prototype, "freeElementCount", {
            /**
             * Get the count of free entries that can still be allocated without resizing the buffer
             * @returns the free elements count
             */
            get: function () {
                return this._freeEntries.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DynamicFloatArray.prototype, "usedElementCount", {
            /**
             * Get the count of allocated elements
             * @returns the allocated elements count
             */
            get: function () {
                return this._allEntries.length - this._freeEntries.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DynamicFloatArray.prototype, "stride", {
            /**
             * Return the size of one element in float
             * @returns the size in float
             */
            get: function () {
                return this._stride;
            },
            enumerable: true,
            configurable: true
        });
        return DynamicFloatArray;
    })();
    BABYLON.DynamicFloatArray = DynamicFloatArray;
})(BABYLON || (BABYLON = {}));

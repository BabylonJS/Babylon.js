var BABYLON;
(function (BABYLON) {
    var DynamicFloatArrayElementInfo = (function () {
        function DynamicFloatArrayElementInfo() {
        }
        return DynamicFloatArrayElementInfo;
    }());
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
            this.compareValueOffset = null;
            this.sortingAscending = true;
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
            // The opposite may not be true, we can have a lastUsed greater than firstFree but the array still packed, because when an element is freed, lastUsed is not updated (for speed reason) so we may have a lastUsed of a freed element. But that's ok, well soon realize this case.
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
            var occupiedZoneSize = (this.usedElementCount + 1) * s;
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
                    freeZoneSize = 1 + copyCount;
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
        DynamicFloatArray.prototype.sort = function () {
            var _this = this;
            if (!this.compareValueOffset) {
                throw new Error("The DynamicFloatArray.sort() method needs a valid 'compareValueOffset' property");
            }
            var count = this.usedElementCount;
            // Do we have to (re)create the sort table?
            if (!this._sortTable || this._sortTable.length < count) {
                // Small heuristic... We don't want to allocate totalElementCount right away because it may have 50 for 3 used elements, but on the other side we don't want to allocate just 3 when we just need 2, so double this value to give us some air to breath...
                var newCount = Math.min(this.totalElementCount, count * 2);
                this._sortTable = new Array(newCount);
                this._sortedTable = new Array(newCount);
            }
            // Because, you know...
            this.pack();
            //let stride = this.stride;
            //for (let i = 0; i < count; i++) {
            //    let si = this._sortTable[i];
            //    if (!si) {
            //        si = new SortInfo();
            //        this._sortTable[i] = si;
            //    }
            //    si.entry = this._allEntries[i];
            //    si.compareData = this.buffer[si.entry.offset + this.compareValueOffset];
            //    si.swapedOffset = null;
            //    this._sortedTable[i] = si;
            //}
            var curOffset = 0;
            var stride = this.stride;
            for (var i = 0; i < count; i++, curOffset += stride) {
                var si = this._sortTable[i];
                if (!si) {
                    si = new SortInfo();
                    this._sortTable[i] = si;
                }
                si.compareData = this.buffer[curOffset + this.compareValueOffset];
                si.offset = curOffset;
                si.swapedOffset = null;
                this._sortedTable[i] = si;
            }
            // Let's sort the sorted table, we want to keep a track of the original one (that's why we have two buffers)
            if (this.sortingAscending) {
                this._sortedTable.sort(function (a, b) { return a.compareData - b.compareData; });
            }
            else {
                this._sortedTable.sort(function (a, b) { return b.compareData - a.compareData; });
            }
            var swapElements = function (src, dst) {
                for (var i = 0; i < stride; i++) {
                    var tps = _this.buffer[dst + i];
                    _this.buffer[dst + i] = _this.buffer[src + i];
                    _this.buffer[src + i] = tps;
                }
            };
            // The fun part begin, sortedTable give us the ordered layout to obtain, to get that we have to move elements, but when we move an element: 
            //  it replaces an existing one.I don't want to allocate a new Float32Array and do a raw copy, because it's awful (GC - wise), 
            //  and I still want something with a good algorithm complexity.
            // So here's the deal: we are going to swap elements, but we have to track the change of location of the element being replaced, 
            //  we need sortTable for that, it contains the original layout of SortInfo object, not the sorted one.
            // The best way is to use an extra field in SortInfo, because potentially every element can be replaced.
            // When we'll look for and element, we'll check if its swapedOffset is set, if so we reiterate the operation with the one there 
            //  until we find a SortInfo object without a swapedOffset which means we got the right location
            // Yes, we may have to do multiple iterations to find the right location, but hey, it won't be huge: <3 in most cases, and it's better 
            //  than a double allocation of the whole float32Array or a O(n²/2) typical algorithm.
            for (var i = 0; i < count; i++) {
                // Get the element to move
                var sourceSI = this._sortedTable[i];
                var destSI = this._sortTable[i];
                var sourceOff = sourceSI.offset;
                // If the source changed location, find the new one
                if (sourceSI.swapedOffset) {
                    // Follow the swapedOffset until there's none, it will mean that curSI contains the new location in its offset member
                    var curSI = sourceSI;
                    while (curSI.swapedOffset) {
                        curSI = this._sortTable[curSI.swapedOffset / stride];
                    }
                    // Finally get the right location
                    sourceOff = curSI.offset;
                }
                // Tag the element being replaced with its new location
                destSI.swapedOffset = sourceOff;
                // Swap elements (only if needed)
                if (sourceOff !== destSI.offset) {
                    swapElements(sourceOff, destSI.offset);
                }
                // Update the offset in the corresponding DFAE
                //sourceSI.entry.offset = destSI.entry.offset;
                this._allEntries[sourceSI.offset / stride].offset = destSI.offset;
            }
            this._allEntries.sort(function (a, b) { return a.offset - b.offset; });
            return true;
        };
        return DynamicFloatArray;
    }());
    BABYLON.DynamicFloatArray = DynamicFloatArray;
    var SortInfo = (function () {
        function SortInfo() {
            this.compareData = this.offset = this.swapedOffset = null;
        }
        return SortInfo;
    }());
})(BABYLON || (BABYLON = {}));

module BABYLON {
    /**
    * The purpose of this class is to store float32 based elements of a given size (defined by the stride argument) in a dynamic fashion, that is, you can add/free elements. You can then access to a defragmented/packed version of the underlying Float32Array by calling the pack() method.
    * The intent is to maintain through time data that will be bound to a WebGlBuffer with the ability to change add/remove elements.
    * It was first built to effiently maintain the WebGlBuffer that contain instancing based data.
    * Allocating an Element will return a instance of DynamicFloatArrayElement which contains the offset into the Float32Array of where the element starts, you are then responsible to copy your data using this offset.
    * Beware, calling pack() may change the offset of some Entries because this method will defrag the Float32Array to replace empty elements by moving allocated ones at their location.
     * This method will return an ArrayBufferView on the existing Float32Array that describes the used elements. Use this View to update the WebGLBuffer and NOT the "buffer" field of the class. The pack() method won't shrink/reallocate the buffer to keep it GC friendly, all the empty space will be put at the end of the buffer, the method just ensure there're no "free holes". 
    */
    export class DynamicFloatArray {
        /**
         * Construct an instance of the dynamic float array
         * @param stride size of one element in float (i.e. not bytes!)
         * @param initialElementCount the number of available entries at construction
         */
        constructor(stride: number, initialElementCount: number) {
            this._stride = stride;
            this.buffer = new Float32Array(stride * initialElementCount);
            this._lastUsed = 0;
            this._firstFree = 0;
            this._allEntries = new Array<DynamicFloatArrayElementInfo>(initialElementCount);
            this._freeEntries = new Array<DynamicFloatArrayElementInfo>(initialElementCount);

            for (let i = 0; i < initialElementCount; i++) {
                let element = new DynamicFloatArrayElementInfo();
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
        allocElement(): DynamicFloatArrayElementInfo {
            if (this._freeEntries.length === 0) {
                this._growBuffer();
            }

            let el = this._freeEntries.pop();
            this._lastUsed = Math.max(el.offset, this._lastUsed);

            if (el.offset === this._firstFree) {
                if (this._freeEntries.length > 0) {
                    this._firstFree = this._freeEntries[this._freeEntries.length - 1].offset;
                } else {
                    this._firstFree += this._stride;
                }
            }
            return el;
        }

        /**
         * Free the element corresponding to the given element info
         * @param elInfo the element that describe the allocated element
         */
        freeElement(elInfo: DynamicFloatArrayElementInfo) {
            this._firstFree = Math.min(elInfo.offset, this._firstFree);
            this._freeEntries.push(elInfo);
        }

        /**
         * This method will pack all the used elements into a linear sequence and put all the free space at the end.
         * Instances of DynamicFloatArrayElement may have their 'offset' member changed as data could be copied from one location to another, so be sure to read/write your data based on the value inside this member after you called pack().
         * @return the subarray that is the view of the used elements area, you can use it as a source to update a WebGLBuffer
         */
        pack(): Float32Array {

            // no free slot? no need to pack
            if (this._freeEntries.length === 0) {
                return this.buffer;
            }

            // If the buffer is already packed the last used will always be lower than the first free
            if (this._lastUsed < this._firstFree) {
                let elementsBuffer = this.buffer.subarray(0, this._lastUsed + this._stride);
                return elementsBuffer;
            }

            let s = this._stride;

            // Make sure there's a free element at the very end, we need it to create a range where we'll move the used elements that may appear before
            let lastFree = new DynamicFloatArrayElementInfo();
            lastFree.offset = this.totalElementCount * s;
            this._freeEntries.push(lastFree);

            let sortedFree = this._freeEntries.sort((a, b) => a.offset - b.offset);
            let sortedAll = this._allEntries.sort((a, b) => a.offset - b.offset);

            let firstFreeSlotOffset = sortedFree[0].offset;
            let freeZoneSize = 1;

            // The sortedFree array is sorted in reverse, first free at the end, last free at the beginning, so we loop from the end to beginning
            let prevOffset = sortedFree[0].offset;
            for (let i = 1; i < sortedFree.length; i++) {
                let curFree = sortedFree[i];
                let curOffset = curFree.offset;

                // Compute the distance between this offset and the previous
                let distance = curOffset - prevOffset;

                // If the distance is the stride size, they are adjacents, it good, move to the next
                if (distance === s) {
                    // Free zone is one element bigger
                    ++freeZoneSize;

                    // as we're about to iterate to the next, the cur becomes the prev...
                    prevOffset = curOffset;

                    continue;
                }

                // Distance is bigger, which means there's x element between the previous free and this one
                let usedRange = (distance / s) - 1;

                // Two cases the free zone is smaller than the data to move or bigger

                // Copy what can fit in the free zone
                let curMoveOffset = curOffset - s;
                let copyCount = Math.min(freeZoneSize, usedRange);
                for (let j = 0; j < copyCount; j++) {
                    let freeI = firstFreeSlotOffset / s;
                    let curI = curMoveOffset / s;

                    let moveEl = sortedAll[curI];
                    this._moveElement(moveEl, firstFreeSlotOffset);
                    let replacedEl = sortedAll[freeI];

                    // set the offset of the element element we replace with a value that will make it discard at the end of the method
                    replacedEl.offset = curMoveOffset;

                    // Swap the element we moved and the one it replaced in the sorted array to reflect the action we've made
                    sortedAll[freeI] = moveEl;
                    sortedAll[curI] = replacedEl;

                    curMoveOffset -= s;
                    firstFreeSlotOffset += s;
                }

                // Free Zone is smaller or equal so it's no longer a free zone, set the new one to the current location
                if (freeZoneSize <= usedRange) {
                    firstFreeSlotOffset = curOffset;
                    freeZoneSize = 1;
                }

                // Free Zone was bigger, the firstFreeSlotOffset is already up to date, but we need to update the its size
                else {
                    freeZoneSize = ((curOffset - firstFreeSlotOffset) / s) + 1;
                }

                // as we're about to iterate to the next, the cur becomes the prev...
                prevOffset = curOffset;
            }

            let elementsBuffer = this.buffer.subarray(0, firstFreeSlotOffset);
            this._lastUsed = firstFreeSlotOffset - s;
            this._firstFree = firstFreeSlotOffset;
            sortedFree.pop();             // Remove the last free because that's the one we added at the start of the method
            this._freeEntries = sortedFree.sort((a, b) => b.offset - a.offset);
            this._allEntries = sortedAll;

            return elementsBuffer;
        }

        private _moveElement(element: DynamicFloatArrayElementInfo, destOffset: number) {
            for (let i = 0; i < this._stride; i++) {
                this.buffer[destOffset + i] = this.buffer[element.offset + i];
            }

            element.offset = destOffset;
        }

        private _growBuffer() {
            // Allocate the new buffer with 50% more entries, copy the content of the current one
            let newElCount = this.totalElementCount * 1.5;
            let newBuffer = new Float32Array(newElCount * this._stride);
            newBuffer.set(this.buffer);

            let addedCount = newElCount - this.totalElementCount;
            this._allEntries.length += addedCount;
            this._freeEntries.length += addedCount;

            for (let i = this.totalElementCount; i < newElCount; i++) {
                let el = new DynamicFloatArrayElementInfo();
                el.offset = i * this._stride;

                this._allEntries[i] = el;
                this._freeEntries[i] = el;
            }

            this.buffer = newBuffer;
            this.totalElementCount = newElCount;
        }

        /**
         * This is the main buffer, all elements are stored inside, you use the DynamicFloatArrayElement instance of a given element to know its location into this buffer, then you have the responsability to perform write operations in this buffer at the right location!
         * Don't use this buffer for a WebGL bufferSubData() operation, but use the one returned by the pack() method.
         */
        buffer: Float32Array;

        /**
         * Get the total count of entries that can fit in the current buffer
         * @returns the elements count
         */
        get totalElementCount(): number {
            return this._allEntries.length;
        }

        /**
         * Get the count of free entries that can still be allocated without resizing the buffer
         * @returns the free elements count
         */
        get freeElementCount(): number {
            return this._freeEntries.length;
        }

        /**
         * Get the count of allocated elements
         * @returns the allocated elements count
         */
        get usedElementCount(): number {
            return this._allEntries.length - this._freeEntries.length;
        }

        /**
         * Return the size of one element in float
         * @returns the size in float
         */
        get stride(): number {
            return this._stride;
        }

        private _allEntries: Array<DynamicFloatArrayElementInfo>;
        private _freeEntries: Array<DynamicFloatArrayElementInfo>;
        private _stride: number;
        private _lastUsed: number;
        private _firstFree: number;
    }

    export class DynamicFloatArrayElementInfo {
        offset: number;
    }
}
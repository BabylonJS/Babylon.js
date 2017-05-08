module BABYLON {

    /**
     * This class describe a rectangle that were added to the map.
     * You have access to its coordinates either in pixel or normalized (UV)
     */
    export class PackedRect {
        constructor(root: RectPackingMap, parent: PackedRect, pos: Vector2, size: Size) {
            this._pos         = pos;
            this._size        = size;
            this._root        = root;
            this._parent      = parent;
            this._contentSize = null;
            this._bottomNode  = null;
            this._leftNode    = null;
            this._initialSize = null;
            this._rightNode   = null;
        }

        /**
         * @returns the position of this node into the map
         */
        public get pos(): Vector2 {
            return this._pos;
        }

        /**
         * @returns the size of the rectangle this node handles
         */
        public get contentSize(): Size {
            return this._contentSize;
        }

        /**
         * Retrieve the inner position (considering the margin) and stores it into the res object
         * @param res must be a valid Vector2 that will contain the inner position after this call
         */
        public getInnerPosToRef(res: Vector2) {
            let m = this._root._margin;
            res.x = this._pos.x + m;
            res.y = this._pos.y + m;
        }

        /**
         * Retrieve the inner size (considering the margin) and stores it into the res object
         * @param res must be a valid Size that will contain the inner size after this call
         */
        public getInnerSizeToRef(res: Size) {
            let m = this._root._margin;
            res.width = this._contentSize.width - (m*2);
            res.height = this._contentSize.height - (m*2);
        }

        /**
         * Compute the UV of the top/left, top/right, bottom/right, bottom/left points of the rectangle this node handles into the map
         * @returns And array of 4 Vector2, containing UV coordinates for the four corners of the Rectangle into the map
         */
        public get UVs(): Vector2[] {
            if (!this._contentSize) {
                throw new Error("Can't compute UVs for this object because it's nor allocated");
            }
            return this.getUVsForCustomSize(this._contentSize);
        }

        /**
         * You may have allocated the PackedRect using over-provisioning (you allocated more than you need in order to prevent frequent deallocations/reallocations) 
         * and then using only a part of the PackRect.
         * This method will return the UVs for this part by given the custom size of what you really use
         * @param customSize must be less/equal to the allocated size, UV will be compute from this 
         */
        public getUVsForCustomSize(customSize: Size): Vector2[] {
            var mainWidth = this._root._size.width;
            var mainHeight = this._root._size.height;
            let margin = this._root._margin;

            var topLeft = new Vector2((this._pos.x+margin) / mainWidth, (this._pos.y+margin) / mainHeight);
            var rightBottom = new Vector2((this._pos.x + customSize.width + margin - 1) / mainWidth, (this._pos.y + customSize.height + margin - 1) / mainHeight);
            var uvs = new Array<Vector2>();
            uvs.push(topLeft);
            uvs.push(new Vector2(rightBottom.x, topLeft.y));
            uvs.push(rightBottom);
            uvs.push(new Vector2(topLeft.x, rightBottom.y));

            return uvs;
        }

        /**
         * Free this rectangle from the map.
         * Call this method when you no longer need the rectangle to be in the map.
         */
        public freeContent() {
            if (!this.contentSize) {
                return;
            }

            this._contentSize = null;

            // If everything below is also free, reset the whole node, and attempt to reset parents if they also become free
            this.attemptDefrag();
        }


        protected get isUsed(): boolean {
            return this._contentSize != null || this._leftNode != null;
        }

        protected findAndSplitNode(contentSize: Size): PackedRect {
            var node = this.findNode(contentSize);

            // Not enough space...
            if (!node) {
                return null;
            }

            node.splitNode(contentSize);
            return node;
        }

        private findNode(size: Size): PackedRect {
            var resNode: PackedRect = null;
            let margin = this._root._margin * 2;

            // If this node is used, recurse to each of his subNodes to find an available one in its branch
            if (this.isUsed) {
                if (this._leftNode) {
                    resNode = this._leftNode.findNode(size);
                }
                if (!resNode && this._rightNode) {
                    resNode = this._rightNode.findNode(size);
                }
                if (!resNode && this._bottomNode) {
                    resNode = this._bottomNode.findNode(size);
                }
            }

            // The node is free, but was previously allocated (_initialSize is set), rely on initialSize to make the test as it's the space we have
            else if (this._initialSize) {
                if (((size.width+margin) <= this._initialSize.width) && ((size.height+margin) <= this._initialSize.height))
                {
                    resNode = this;
                } else {
                    return null;
                }
            }

            // The node is free and empty, rely on its size for the test
            else if (((size.width+margin) <= this._size.width) && ((size.height+margin) <= this._size.height)) {
                resNode = this;
            }
            return resNode;
        }

        private static  TpsSize = Size.Zero();
        private splitNode(contentSize: Size): PackedRect {
            let cs = PackedRect.TpsSize;
            let margin = this._root._margin*2;
            cs.copyFrom(contentSize);
            cs.width += margin;
            cs.height += margin;

            // If there's no contentSize but an initialSize it means this node were previously allocated, but freed, we need to create a _leftNode as subNode and use to allocate the space we need (and this node will have a right/bottom subNode for the space left as this._initialSize may be greater than contentSize)
            if (!this._contentSize && this._initialSize) {
                this._contentSize = cs.clone();
                this._leftNode = new PackedRect(this._root, this, new Vector2(this._pos.x, this._pos.y), new Size(this._initialSize.width, this._initialSize.height));
                return this._leftNode.splitNode(contentSize);
            } else {
                this._contentSize = cs.clone();
                this._initialSize = cs.clone();

                if (cs.width !== this._size.width) {
                    this._rightNode = new PackedRect(this._root, this, new Vector2(this._pos.x + cs.width, this._pos.y), new Size(this._size.width - cs.width, cs.height));
                }

                if (cs.height !== this._size.height) {
                    this._bottomNode = new PackedRect(this._root, this, new Vector2(this._pos.x, this._pos.y + cs.height), new Size(this._size.width, this._size.height - cs.height));
                }
                return this;
            }
        }

        private attemptDefrag() {
            if (!this.isUsed && this.isRecursiveFree) {
                this.clearNode();

                if (this._parent) {
                    this._parent.attemptDefrag();
                }
            }
        }

        private clearNode() {
            this._initialSize = null;
            this._rightNode = null;
            this._bottomNode = null;
        }

        private get isRecursiveFree() {
            return !this.contentSize && (!this._leftNode || this._leftNode.isRecursiveFree) && (!this._rightNode || this._rightNode.isRecursiveFree) && (!this._bottomNode || this._bottomNode.isRecursiveFree);
        }

        protected evalFreeSize(size: number): number {
            var levelSize = 0;

            if (!this.isUsed) {
                let margin = this._root._margin;
                let is = this._initialSize;
                if (is) {
                    levelSize = is.surface - (is.width*margin) - (is.height*margin);
                } else {
                    let size = this._size;
                    levelSize = size.surface - (size.width*margin) - (size.height*margin);
                }
            }

            if (this._rightNode) {
                levelSize += this._rightNode.evalFreeSize(0);
            }

            if (this._bottomNode) {
                levelSize += this._bottomNode.evalFreeSize(0);
            }

            return levelSize + size;
        }

        protected _root: RectPackingMap;
        protected _parent: PackedRect;
        private _contentSize: Size;
        private _initialSize: Size;
        private _leftNode: PackedRect;
        private _rightNode: PackedRect;
        private _bottomNode: PackedRect;

        private _pos: Vector2;
        protected _size: Size;
    }

    /**
     * The purpose of this class is to pack several Rectangles into a big map, while trying to fit everything as optimally as possible.
     * This class is typically used to build lightmaps, sprite map or to pack several little textures into a big one.
     * Note that this class allows allocated Rectangles to be freed: that is the map is dynamically maintained so you can add/remove rectangle based on their life-cycle.
     * In case you need a margin around the allocated rect, specify the amount in the margin argument during construction.
     * In such case you will have to rely on innerPositionToRef and innerSizeToRef calls to get the proper size
     */
    export class RectPackingMap extends PackedRect {
        /**
         * Create an instance of the object with a dimension using the given size
         * @param size The dimension of the rectangle that will contain all the sub ones.
         * @param margin The margin (empty space) created (in pixels) around the allocated Rectangles
         */
        constructor(size: Size, margin=0) {
            super(null, null, Vector2.Zero(), size);

            this._margin = margin;
            this._root = this;
        }

        /**
         * Add a rectangle, finding the best location to store it into the map
         * @param size the dimension of the rectangle to store
         * @return the Node containing the rectangle information, or null if we couldn't find a free spot
         */
        public addRect(size: Size): PackedRect {
            var node = this.findAndSplitNode(size);
            return node;
        }

        /**
         * Return the current space free normalized between [0;1]
         * @returns {} 
         */
        public get freeSpace(): number {
            var freeSize = 0;
            freeSize = this.evalFreeSize(freeSize);

            return freeSize / (this._size.width * this._size.height);
        }

        public _margin: number;
    }
}
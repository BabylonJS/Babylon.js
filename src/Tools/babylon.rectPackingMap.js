var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
  * This class describe a rectangle that were added to the map.
  * You have access to its coordinates either in pixel or normalized (UV)
  */
    var PackedRect = (function () {
        function PackedRect(root, parent, pos, size) {
            this._pos = pos;
            this._size = size;
            this._root = root;
            this._parent = parent;
        }
        Object.defineProperty(PackedRect.prototype, "pos", {
            /**
             * @returns the position of this node into the map
             */
            get: function () {
                return this._pos;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PackedRect.prototype, "contentSize", {
            /**
             * @returns the size of the rectangle this node handles
             */
            get: function () {
                return this._contentSize;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PackedRect.prototype, "UVs", {
            /**
             * Compute the UV of the top/left, top/right, bottom/right, bottom/left points of the rectangle this node handles into the map
             * @returns And array of 4 Vector2, containing UV coordinates for the four corners of the Rectangle into the map
             */
            get: function () {
                return this.getUVsForCustomSize(this._root._size);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * You may have allocated the PackedRect using over-provisioning (you allocated more than you need in order to prevent frequent deallocations/reallocations) and then using only a part of the PackRect.
         * This method will return the UVs for this part by given the custom size of what you really use
         * @param customSize must be less/equal to the allocated size, UV will be compute from this
         */
        PackedRect.prototype.getUVsForCustomSize = function (customSize) {
            var mainWidth = this._root._size.width;
            var mainHeight = this._root._size.height;
            var topLeft = new BABYLON.Vector2(this._pos.x / mainWidth, this._pos.y / mainHeight);
            var rightBottom = new BABYLON.Vector2((this._pos.x + customSize.width - 1) / mainWidth, (this._pos.y + customSize.height - 1) / mainHeight);
            var uvs = new Array();
            uvs.push(topLeft);
            uvs.push(new BABYLON.Vector2(rightBottom.x, topLeft.y));
            uvs.push(rightBottom);
            uvs.push(new BABYLON.Vector2(topLeft.x, rightBottom.y));
            return uvs;
        };
        /**
         * Free this rectangle from the map.
         * Call this method when you no longer need the rectangle to be in the map.
         */
        PackedRect.prototype.freeContent = function () {
            if (!this.contentSize) {
                return;
            }
            this._contentSize = null;
            // If everything below is also free, reset the whole node, and attempt to reset parents if they also become free
            this.attemptDefrag();
        };
        Object.defineProperty(PackedRect.prototype, "isUsed", {
            get: function () {
                return this._contentSize != null || this._leftNode != null;
            },
            enumerable: true,
            configurable: true
        });
        PackedRect.prototype.findAndSplitNode = function (contentSize) {
            var node = this.findNode(contentSize);
            // Not enough space...
            if (!node) {
                return null;
            }
            node.splitNode(contentSize);
            return node;
        };
        PackedRect.prototype.findNode = function (size) {
            var resNode = null;
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
            else if (this._initialSize && (size.width <= this._initialSize.width) && (size.height <= this._initialSize.height)) {
                resNode = this;
            }
            else if ((size.width <= this._size.width) && (size.height <= this._size.height)) {
                resNode = this;
            }
            return resNode;
        };
        PackedRect.prototype.splitNode = function (contentSize) {
            // If there's no contentSize but an initialSize it means this node were previously allocated, but freed, we need to create a _leftNode as subNode and use to allocate the space we need (and this node will have a right/bottom subNode for the space left as this._initialSize may be greater than contentSize)
            if (!this._contentSize && this._initialSize) {
                this._leftNode = new PackedRect(this._root, this, new BABYLON.Vector2(this._pos.x, this._pos.y), new BABYLON.Size(this._initialSize.width, this._initialSize.height));
                return this._leftNode.splitNode(contentSize);
            }
            else {
                this._contentSize = contentSize.clone();
                this._initialSize = contentSize.clone();
                if (contentSize.width !== this._size.width) {
                    this._rightNode = new PackedRect(this._root, this, new BABYLON.Vector2(this._pos.x + contentSize.width, this._pos.y), new BABYLON.Size(this._size.width - contentSize.width, contentSize.height));
                }
                if (contentSize.height !== this._size.height) {
                    this._bottomNode = new PackedRect(this._root, this, new BABYLON.Vector2(this._pos.x, this._pos.y + contentSize.height), new BABYLON.Size(this._size.width, this._size.height - contentSize.height));
                }
                return this;
            }
        };
        PackedRect.prototype.attemptDefrag = function () {
            if (!this.isUsed && this.isRecursiveFree) {
                this.clearNode();
                if (this._parent) {
                    this._parent.attemptDefrag();
                }
            }
        };
        PackedRect.prototype.clearNode = function () {
            this._initialSize = null;
            this._rightNode = null;
            this._bottomNode = null;
        };
        Object.defineProperty(PackedRect.prototype, "isRecursiveFree", {
            get: function () {
                return !this.contentSize && (!this._leftNode || this._leftNode.isRecursiveFree) && (!this._rightNode || this._rightNode.isRecursiveFree) && (!this._bottomNode || this._bottomNode.isRecursiveFree);
            },
            enumerable: true,
            configurable: true
        });
        PackedRect.prototype.evalFreeSize = function (size) {
            var levelSize = 0;
            if (!this.isUsed) {
                if (this._initialSize) {
                    levelSize = this._initialSize.surface;
                }
                else {
                    levelSize = this._size.surface;
                }
            }
            if (this._rightNode) {
                levelSize += this._rightNode.evalFreeSize(0);
            }
            if (this._bottomNode) {
                levelSize += this._bottomNode.evalFreeSize(0);
            }
            return levelSize + size;
        };
        return PackedRect;
    }());
    BABYLON.PackedRect = PackedRect;
    /**
     * The purpose of this class is to pack several Rectangles into a big map, while trying to fit everything as optimally as possible.
     * This class is typically used to build lightmaps, sprite map or to pack several little textures into a big one.
     * Note that this class allows allocated Rectangles to be freed: that is the map is dynamically maintained so you can add/remove rectangle based on their life-cycle.
     */
    var RectPackingMap = (function (_super) {
        __extends(RectPackingMap, _super);
        /**
         * Create an instance of the object with a dimension using the given size
         * @param size The dimension of the rectangle that will contain all the sub ones.
         */
        function RectPackingMap(size) {
            _super.call(this, null, null, BABYLON.Vector2.Zero(), size);
            this._root = this;
        }
        /**
         * Add a rectangle, finding the best location to store it into the map
         * @param size the dimension of the rectangle to store
         * @return the Node containing the rectangle information, or null if we couldn't find a free spot
         */
        RectPackingMap.prototype.addRect = function (size) {
            var node = this.findAndSplitNode(size);
            return node;
        };
        Object.defineProperty(RectPackingMap.prototype, "freeSpace", {
            /**
             * Return the current space free normalized between [0;1]
             * @returns {}
             */
            get: function () {
                var freeSize = 0;
                freeSize = this.evalFreeSize(freeSize);
                return freeSize / (this._size.width * this._size.height);
            },
            enumerable: true,
            configurable: true
        });
        return RectPackingMap;
    }(PackedRect));
    BABYLON.RectPackingMap = RectPackingMap;
})(BABYLON || (BABYLON = {}));

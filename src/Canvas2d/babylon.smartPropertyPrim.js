var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var Prim2DClassInfo = (function () {
        function Prim2DClassInfo() {
        }
        return Prim2DClassInfo;
    })();
    BABYLON.Prim2DClassInfo = Prim2DClassInfo;
    var Prim2DPropInfo = (function () {
        function Prim2DPropInfo() {
        }
        Prim2DPropInfo.PROPKIND_MODEL = 1;
        Prim2DPropInfo.PROPKIND_INSTANCE = 2;
        Prim2DPropInfo.PROPKIND_DYNAMIC = 3;
        return Prim2DPropInfo;
    })();
    BABYLON.Prim2DPropInfo = Prim2DPropInfo;
    /**
     * Custom type of the propertyChanged observable
     */
    var PropertyChangedInfo = (function () {
        function PropertyChangedInfo() {
        }
        return PropertyChangedInfo;
    })();
    BABYLON.PropertyChangedInfo = PropertyChangedInfo;
    var ClassTreeInfo = (function () {
        function ClassTreeInfo(baseClass, type, classContentFactory) {
            this._baseClass = baseClass;
            this._type = type;
            this._subClasses = new Array();
            this._levelContent = new BABYLON.StringDictionary();
            this._classContentFactory = classContentFactory;
        }
        Object.defineProperty(ClassTreeInfo.prototype, "classContent", {
            get: function () {
                if (!this._classContent) {
                    this._classContent = this._classContentFactory(this._baseClass ? this._baseClass.classContent : null);
                }
                return this._classContent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "type", {
            get: function () {
                return this._type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "levelContent", {
            get: function () {
                return this._levelContent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClassTreeInfo.prototype, "fullContent", {
            get: function () {
                if (!this._fullContent) {
                    var dic = new BABYLON.StringDictionary();
                    var curLevel = this;
                    while (curLevel) {
                        curLevel.levelContent.forEach(function (k, v) { return dic.add(k, v); });
                        curLevel = curLevel._baseClass;
                    }
                    this._fullContent = dic;
                }
                return this._fullContent;
            },
            enumerable: true,
            configurable: true
        });
        ClassTreeInfo.prototype.getLevelOf = function (type) {
            // Are we already there?
            if (type === this._type) {
                return this;
            }
            var baseProto = Object.getPrototypeOf(type);
            var curProtoContent = this.getOrAddType(Object.getPrototypeOf(baseProto), baseProto);
            if (!curProtoContent) {
                this.getLevelOf(baseProto);
            }
            return this.getOrAddType(baseProto, type);
        };
        ClassTreeInfo.prototype.getOrAddType = function (baseType, type) {
            // Are we at the level corresponding to the baseType?
            // If so, get or add the level we're looking for
            if (baseType === this._type) {
                for (var _i = 0, _a = this._subClasses; _i < _a.length; _i++) {
                    var subType = _a[_i];
                    if (subType.type === type) {
                        return subType.node;
                    }
                }
                var node = new ClassTreeInfo(this, type, this._classContentFactory);
                var info = { type: type, node: node };
                this._subClasses.push(info);
                return info.node;
            }
            // Recurse down to keep looking for the node corresponding to the baseTypeName
            for (var _b = 0, _c = this._subClasses; _b < _c.length; _b++) {
                var subType = _c[_b];
                var info = subType.node.getOrAddType(baseType, type);
                if (info) {
                    return info;
                }
            }
            return null;
        };
        ClassTreeInfo.get = function (type) {
            var dic = type["__classTreeInfo"];
            if (!dic) {
                return null;
            }
            return dic.getLevelOf(type);
        };
        ClassTreeInfo.getOrRegister = function (type, classContentFactory) {
            var dic = type["__classTreeInfo"];
            if (!dic) {
                dic = new ClassTreeInfo(null, type, classContentFactory);
                type["__classTreeInfo"] = dic;
            }
            return dic;
        };
        return ClassTreeInfo;
    })();
    BABYLON.ClassTreeInfo = ClassTreeInfo;
    var SmartPropertyPrim = (function () {
        function SmartPropertyPrim() {
            this._flags = 0;
            this._modelKey = null;
            this._instanceDirtyFlags = 0;
            this._levelBoundingInfo = new BABYLON.BoundingInfo2D();
            this.animations = new Array();
        }
        Object.defineProperty(SmartPropertyPrim.prototype, "isDisposed", {
            /**
             * Check if the object is disposed or not.
             * @returns true if the object is dispose, false otherwise.
             */
            get: function () {
                return this._isFlagSet(SmartPropertyPrim.flagIsDisposed);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyPrim.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
            this._setFlags(SmartPropertyPrim.flagIsDisposed);
            return true;
        };
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        SmartPropertyPrim.prototype.getAnimatables = function () {
            return new Array();
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "modelKey", {
            /**
             * Property giving the Model Key associated to the property.
             * This value is constructed from the type of the primitive and all the name/value of its properties declared with the modelLevelProperty decorator
             * @returns the model key string.
             */
            get: function () {
                var _this = this;
                // No need to compute it?
                if (!this._isFlagSet(SmartPropertyPrim.flagModelDirty) && this._modelKey) {
                    return this._modelKey;
                }
                var modelKey = "Class:" + BABYLON.Tools.getClassName(this) + ";";
                var propDic = this.propDic;
                propDic.forEach(function (k, v) {
                    if (v.kind === Prim2DPropInfo.PROPKIND_MODEL) {
                        var propVal = _this[v.name];
                        // Special case, array, this WON'T WORK IN ALL CASES, all entries have to be of the same type and it must be a BJS well known one
                        if (propVal && propVal.constructor === Array) {
                            var firstVal = propVal[0];
                            if (!firstVal) {
                                propVal = 0;
                            }
                            else {
                                propVal = BABYLON.Tools.hashCodeFromStream(BABYLON.Tools.arrayOrStringFeeder(propVal));
                            }
                        }
                        modelKey += v.name + ":" + ((propVal != null) ? ((v.typeLevelCompare) ? BABYLON.Tools.getClassName(propVal) : propVal.toString()) : "[null]") + ";";
                    }
                });
                this._clearFlags(SmartPropertyPrim.flagModelDirty);
                this._modelKey = modelKey;
                return modelKey;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyPrim.prototype, "isDirty", {
            /**
             * States if the Primitive is dirty and should be rendered again next time.
             * @returns true is dirty, false otherwise
             */
            get: function () {
                return (this._instanceDirtyFlags !== 0) || this._areSomeFlagsSet(SmartPropertyPrim.flagModelDirty | SmartPropertyPrim.flagPositioningDirty | SmartPropertyPrim.flagLayoutDirty);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyPrim.prototype, "propDic", {
            /**
             * Access the dictionary of properties metadata. Only properties decorated with XXXXLevelProperty are concerned
             * @returns the dictionary, the key is the property name as declared in Javascript, the value is the metadata object
             */
            get: function () {
                if (!this._propInfo) {
                    var cti = ClassTreeInfo.get(Object.getPrototypeOf(this));
                    if (!cti) {
                        throw new Error("Can't access the propDic member in class definition, is this class SmartPropertyPrim based?");
                    }
                    this._propInfo = cti.fullContent;
                }
                return this._propInfo;
            },
            enumerable: true,
            configurable: true
        });
        SmartPropertyPrim._createPropInfo = function (target, propName, propId, dirtyBoundingInfo, dirtyParentBoundingBox, typeLevelCompare, kind) {
            var dic = ClassTreeInfo.getOrRegister(target, function () { return new Prim2DClassInfo(); });
            var node = dic.getLevelOf(target);
            var propInfo = node.levelContent.get(propId.toString());
            if (propInfo) {
                throw new Error("The ID " + propId + " is already taken by another property declaration named: " + propInfo.name);
            }
            // Create, setup and add the PropInfo object to our prop dictionary
            propInfo = new Prim2DPropInfo();
            propInfo.id = propId;
            propInfo.flagId = Math.pow(2, propId);
            propInfo.kind = kind;
            propInfo.name = propName;
            propInfo.dirtyBoundingInfo = dirtyBoundingInfo;
            propInfo.dirtyParentBoundingInfo = dirtyParentBoundingBox;
            propInfo.typeLevelCompare = typeLevelCompare;
            node.levelContent.add(propName, propInfo);
            return propInfo;
        };
        SmartPropertyPrim._checkUnchanged = function (curValue, newValue) {
            // Nothing to nothing: nothing to do!
            if ((curValue === null && newValue === null) || (curValue === undefined && newValue === undefined)) {
                return true;
            }
            // Check value unchanged
            if ((curValue != null) && (newValue != null)) {
                if (typeof (curValue.equals) == "function") {
                    if (curValue.equals(newValue)) {
                        return true;
                    }
                }
                else {
                    if (curValue === newValue) {
                        return true;
                    }
                }
            }
            return false;
        };
        SmartPropertyPrim.prototype._triggerPropertyChanged = function (propInfo, newValue) {
            if (this.isDisposed) {
                return;
            }
            if (!propInfo) {
                return;
            }
            this._handlePropChanged(undefined, newValue, propInfo.name, propInfo, propInfo.typeLevelCompare);
        };
        SmartPropertyPrim.prototype._boundingBoxDirty = function () {
            this._setFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);
            // Escalate the dirty flag in the instance hierarchy, stop when a renderable group is found or at the end
            if (this instanceof BABYLON.Prim2DBase) {
                var curprim = this;
                while (curprim) {
                    curprim._setFlags(SmartPropertyPrim.flagBoundingInfoDirty);
                    if (curprim.isSizeAuto) {
                        curprim.onPrimitivePropertyDirty(BABYLON.Prim2DBase.sizeProperty.flagId);
                        curprim._setFlags(SmartPropertyPrim.flagPositioningDirty);
                    }
                    if (curprim instanceof BABYLON.Group2D) {
                        if (curprim.isRenderableGroup) {
                            break;
                        }
                    }
                    curprim = curprim.parent;
                }
            }
        };
        SmartPropertyPrim.prototype._handlePropChanged = function (curValue, newValue, propName, propInfo, typeLevelCompare) {
            // If the property change also dirty the boundingInfo, update the boundingInfo dirty flags
            if (propInfo.dirtyBoundingInfo) {
                this._boundingBoxDirty();
            }
            else if (propInfo.dirtyParentBoundingInfo) {
                var p = this._parent;
                if (p != null) {
                    p._boundingBoxDirty();
                }
            }
            // Trigger property changed
            var info = SmartPropertyPrim.propChangedInfo;
            info.oldValue = curValue;
            info.newValue = newValue;
            info.propertyName = propName;
            var propMask = propInfo.flagId;
            this.propertyChanged.notifyObservers(info, propMask);
            // If the property belong to a group, check if it's a cached one, and dirty its render sprite accordingly
            if (this instanceof BABYLON.Group2D) {
                this.handleGroupChanged(propInfo);
            }
            // Check for parent layout dirty
            if (this instanceof BABYLON.Prim2DBase) {
                var p = this._parent;
                if (p != null && p.layoutEngine && (p.layoutEngine.layoutDirtyOnPropertyChangedMask & propInfo.flagId) !== 0) {
                    p._setLayoutDirty();
                }
            }
            // For type level compare, if there's a change of type it's a change of model, otherwise we issue an instance change
            var instanceDirty = false;
            if (typeLevelCompare && curValue != null && newValue != null) {
                var cvProto = curValue.__proto__;
                var nvProto = newValue.__proto__;
                instanceDirty = (cvProto === nvProto);
            }
            // Set the dirty flags
            if (!instanceDirty && (propInfo.kind === Prim2DPropInfo.PROPKIND_MODEL)) {
                if (!this.isDirty) {
                    this._setFlags(SmartPropertyPrim.flagModelDirty);
                }
            }
            else if (instanceDirty || (propInfo.kind === Prim2DPropInfo.PROPKIND_INSTANCE) || (propInfo.kind === Prim2DPropInfo.PROPKIND_DYNAMIC)) {
                this.onPrimitivePropertyDirty(propMask);
            }
        };
        SmartPropertyPrim.prototype.onPrimitivePropertyDirty = function (propFlagId) {
            this.onPrimBecomesDirty();
            this._instanceDirtyFlags |= propFlagId;
        };
        SmartPropertyPrim.prototype.handleGroupChanged = function (prop) {
        };
        /**
         * Check if a given set of properties are dirty or not.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return true if at least one property is dirty, false if none of them are.
         */
        SmartPropertyPrim.prototype.checkPropertiesDirty = function (flags) {
            return (this._instanceDirtyFlags & flags) !== 0;
        };
        /**
         * Clear a given set of properties.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return the new set of property still marked as dirty
         */
        SmartPropertyPrim.prototype.clearPropertiesDirty = function (flags) {
            this._instanceDirtyFlags &= ~flags;
            return this._instanceDirtyFlags;
        };
        SmartPropertyPrim.prototype._resetPropertiesDirty = function () {
            this._instanceDirtyFlags = 0;
            this._clearFlags(SmartPropertyPrim.flagPrimInDirtyList | SmartPropertyPrim.flagNeedRefresh);
        };
        Object.defineProperty(SmartPropertyPrim.prototype, "levelBoundingInfo", {
            /**
             * Retrieve the boundingInfo for this Primitive, computed based on the primitive itself and NOT its children
             */
            get: function () {
                if (this._isFlagSet(SmartPropertyPrim.flagLevelBoundingInfoDirty)) {
                    this.updateLevelBoundingInfo();
                    this._clearFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);
                }
                return this._levelBoundingInfo;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This method must be overridden by a given Primitive implementation to compute its boundingInfo
         */
        SmartPropertyPrim.prototype.updateLevelBoundingInfo = function () {
        };
        /**
         * Property method called when the Primitive becomes dirty
         */
        SmartPropertyPrim.prototype.onPrimBecomesDirty = function () {
        };
        SmartPropertyPrim._hookProperty = function (propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox, kind) {
            return function (target, propName, descriptor) {
                var propInfo = SmartPropertyPrim._createPropInfo(target, propName, propId, dirtyBoundingInfo, dirtyParentBoundingBox, typeLevelCompare, kind);
                if (piStore) {
                    piStore(propInfo);
                }
                var getter = descriptor.get, setter = descriptor.set;
                // Overload the property setter implementation to add our own logic
                descriptor.set = function (val) {
                    // check for disposed first, do nothing
                    if (this.isDisposed) {
                        return;
                    }
                    var curVal = getter.call(this);
                    if (SmartPropertyPrim._checkUnchanged(curVal, val)) {
                        return;
                    }
                    // Cast the object we're working one
                    var prim = this;
                    // Change the value
                    setter.call(this, val);
                    // Notify change, dirty flags update
                    prim._handlePropChanged(curVal, val, propName, propInfo, typeLevelCompare);
                };
            };
        };
        /**
         * Add an externally attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        SmartPropertyPrim.prototype.addExternalData = function (key, data) {
            if (!this._externalData) {
                this._externalData = new BABYLON.StringDictionary();
            }
            return this._externalData.add(key, data);
        };
        /**
         * Get an externally attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        SmartPropertyPrim.prototype.getExternalData = function (key) {
            if (!this._externalData) {
                return null;
            }
            return this._externalData.get(key);
        };
        /**
         * Get an externally attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        SmartPropertyPrim.prototype.getOrAddExternalDataWithFactory = function (key, factory) {
            if (!this._externalData) {
                this._externalData = new BABYLON.StringDictionary();
            }
            return this._externalData.getOrAddWithFactory(key, factory);
        };
        /**
         * Remove an externally attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        SmartPropertyPrim.prototype.removeExternalData = function (key) {
            if (!this._externalData) {
                return false;
            }
            return this._externalData.remove(key);
        };
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        SmartPropertyPrim.prototype._isFlagSet = function (flag) {
            return (this._flags & flag) !== 0;
        };
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        SmartPropertyPrim.prototype._areAllFlagsSet = function (flags) {
            return (this._flags & flags) === flags;
        };
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        SmartPropertyPrim.prototype._areSomeFlagsSet = function (flags) {
            return (this._flags & flags) !== 0;
        };
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        SmartPropertyPrim.prototype._clearFlags = function (flags) {
            this._flags &= ~flags;
        };
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        SmartPropertyPrim.prototype._setFlags = function (flags) {
            var cur = this._flags;
            this._flags |= flags;
            return cur;
        };
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        SmartPropertyPrim.prototype._changeFlags = function (flags, state) {
            if (state) {
                this._flags |= flags;
            }
            else {
                this._flags &= ~flags;
            }
        };
        SmartPropertyPrim.propChangedInfo = new PropertyChangedInfo();
        SmartPropertyPrim.flagIsDisposed = 0x0000001; // set if the object is already disposed
        SmartPropertyPrim.flagLevelBoundingInfoDirty = 0x0000002; // set if the primitive's level bounding box (not including children) is dirty
        SmartPropertyPrim.flagModelDirty = 0x0000004; // set if the model must be changed
        SmartPropertyPrim.flagLayoutDirty = 0x0000008; // set if the layout must be computed
        SmartPropertyPrim.flagLevelVisible = 0x0000010; // set if the primitive is set as visible for its level only
        SmartPropertyPrim.flagBoundingInfoDirty = 0x0000020; // set if the primitive's overall bounding box (including children) is dirty
        SmartPropertyPrim.flagIsPickable = 0x0000040; // set if the primitive can be picked during interaction
        SmartPropertyPrim.flagIsVisible = 0x0000080; // set if the primitive is concretely visible (use the levelVisible of parents)
        SmartPropertyPrim.flagVisibilityChanged = 0x0000100; // set if there was a transition between visible/hidden status
        SmartPropertyPrim.flagPositioningDirty = 0x0000200; // set if the primitive positioning must be computed
        SmartPropertyPrim.flagTrackedGroup = 0x0000400; // set if the group2D is tracking a scene node
        SmartPropertyPrim.flagWorldCacheChanged = 0x0000800; // set if the cached bitmap of a world space canvas changed
        SmartPropertyPrim.flagChildrenFlatZOrder = 0x0001000; // set if all the children (direct and indirect) will share the same Z-Order
        SmartPropertyPrim.flagZOrderDirty = 0x0002000; // set if the Z-Order for this prim and its children must be recomputed
        SmartPropertyPrim.flagActualOpacityDirty = 0x0004000; // set if the actualOpactity should be recomputed
        SmartPropertyPrim.flagPrimInDirtyList = 0x0008000; // set if the primitive is in the primDirtyList
        SmartPropertyPrim.flagIsContainer = 0x0010000; // set if the primitive is a container
        SmartPropertyPrim.flagNeedRefresh = 0x0020000; // set if the primitive wasn't successful at refresh
        SmartPropertyPrim.flagActualScaleDirty = 0x0040000; // set if the actualScale property needs to be recomputed
        SmartPropertyPrim.flagDontInheritParentScale = 0x0080000; // set if the actualScale must not use its parent's scale to be computed
        SmartPropertyPrim.flagGlobalTransformDirty = 0x0100000; // set if the global transform must be recomputed due to a local transform change
        SmartPropertyPrim.flagLayoutBoundingInfoDirty = 0x0100000; // set if the layout bounding info is dirty
        SmartPropertyPrim = __decorate([
            BABYLON.className("SmartPropertyPrim")
        ], SmartPropertyPrim);
        return SmartPropertyPrim;
    })();
    BABYLON.SmartPropertyPrim = SmartPropertyPrim;
    function modelLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyPrim._hookProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox, Prim2DPropInfo.PROPKIND_MODEL);
    }
    BABYLON.modelLevelProperty = modelLevelProperty;
    function instanceLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyPrim._hookProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox, Prim2DPropInfo.PROPKIND_INSTANCE);
    }
    BABYLON.instanceLevelProperty = instanceLevelProperty;
    function dynamicLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyPrim._hookProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox, Prim2DPropInfo.PROPKIND_DYNAMIC);
    }
    BABYLON.dynamicLevelProperty = dynamicLevelProperty;
})(BABYLON || (BABYLON = {}));

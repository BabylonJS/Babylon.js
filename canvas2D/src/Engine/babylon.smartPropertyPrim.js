var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    }());
    BABYLON.Prim2DClassInfo = Prim2DClassInfo;
    var Prim2DPropInfo = (function () {
        function Prim2DPropInfo() {
        }
        Prim2DPropInfo.PROPKIND_MODEL = 1;
        Prim2DPropInfo.PROPKIND_INSTANCE = 2;
        Prim2DPropInfo.PROPKIND_DYNAMIC = 3;
        return Prim2DPropInfo;
    }());
    BABYLON.Prim2DPropInfo = Prim2DPropInfo;
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
                    var dic_1 = new BABYLON.StringDictionary();
                    var curLevel = this;
                    while (curLevel) {
                        curLevel.levelContent.forEach(function (k, v) { return dic_1.add(k, v); });
                        curLevel = curLevel._baseClass;
                    }
                    this._fullContent = dic_1;
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
    }());
    BABYLON.ClassTreeInfo = ClassTreeInfo;
    var DataBinding = (function () {
        function DataBinding() {
            this._converter = null;
            this._mode = DataBinding.MODE_DEFAULT;
            this._uiElementId = null;
            this._dataSource = null;
            this._currentDataSource = null;
            this._propertyPathName = null;
            this._stringFormat = null;
            this._updateSourceTrigger = DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            this._boundTo = null;
            this._owner = null;
            this._updateCounter = 0;
        }
        Object.defineProperty(DataBinding.prototype, "converter", {
            /**
             * Provide a callback that will convert the value obtained by the Data Binding to the type of the SmartProperty it's bound to.
             * If no value are set, then it's assumed that the sourceValue is of the same type as the SmartProperty's one.
             * If the SmartProperty type is a basic data type (string, boolean or number) and no converter is specified but the sourceValue is of a different type, the conversion will be implicitly made, if possible.
             * @param sourceValue the source object retrieve by the Data Binding mechanism
             * @returns the object of a compatible type with the SmartProperty it's bound to
             */
            get: function () {
                return this._converter;
            },
            set: function (value) {
                if (this._converter === value) {
                    return;
                }
                this._converter = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "mode", {
            /**
             * Set the mode to use for the data flow in the binding. Set one of the MODE_xxx static member of this class. If not specified then MODE_DEFAULT will be used
             */
            get: function () {
                if (this._mode === DataBinding.MODE_DEFAULT) {
                    return this._boundTo.bindingMode;
                }
                return this._mode;
            },
            set: function (value) {
                if (this._mode === value) {
                    return;
                }
                this._mode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "uiElementId", {
            /**
             * You can override the Data Source object with this member which is the Id of a uiElement existing in the UI Logical tree.
             * If not set and source no set too, then the dataSource property will be used.
             */
            get: function () {
                return this._uiElementId;
            },
            set: function (value) {
                if (this._uiElementId === value) {
                    return;
                }
                this._uiElementId = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "dataSource", {
            /**
             * You can override the Data Source object with this member which is the source object to use directly.
             * If not set and uiElement no set too, then the dataSource property of the SmartPropertyBase object will be used.
             */
            get: function () {
                return this._dataSource;
            },
            set: function (value) {
                if (this._dataSource === value) {
                    return;
                }
                this._dataSource = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "propertyPathName", {
            /**
             * The path & name of the property to get from the source object.
             * Once the Source object is evaluated (it's either the one got from uiElementId, source or dataSource) you can specify which property of this object is the value to bind to the smartProperty.
             * If nothing is set then the source object will be used.
             * You can specify an indirect property using the format "firstProperty.indirectProperty" like "address.postalCode" if the source is a Customer object which contains an address property and the Address class contains a postalCode property.
             * If the property is an Array and you want to address a particular element then use the 'arrayProperty[index]' notation. For example "phoneNumbers[0]" to get the first element of the phoneNumber property which is an array.
             */
            get: function () {
                return this._propertyPathName;
            },
            set: function (value) {
                if (this._propertyPathName === value) {
                    return;
                }
                if (this._owner) {
                }
                this._propertyPathName = value;
                if (this._owner) {
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "stringFormat", {
            /**
             * If the Smart Property is of the string type, you can use the string interpolation notation to provide how the sourceValue will be formatted, reference to the source value must be made via the token: ${value}. For instance `Customer Name: ${value}`
             */
            get: function () {
                return this._stringFormat;
            },
            set: function (value) {
                if (this._stringFormat === value) {
                    return;
                }
                this._stringFormat = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataBinding.prototype, "updateSourceTrigger", {
            /**
             * Specify how the source should be updated, use one of the UPDATESOURCETRIGGER_xxx member of this class, if not specified then UPDATESOURCETRIGGER_DEFAULT will be used.
             */
            get: function () {
                return this._updateSourceTrigger;
            },
            set: function (value) {
                if (this._updateSourceTrigger === value) {
                    return;
                }
                this._updateSourceTrigger = value;
            },
            enumerable: true,
            configurable: true
        });
        DataBinding.prototype.canUpdateTarget = function (resetUpdateCounter) {
            if (resetUpdateCounter) {
                this._updateCounter = 0;
            }
            var mode = this.mode;
            if (mode === DataBinding.MODE_ONETIME) {
                return this._updateCounter === 0;
            }
            if (mode === DataBinding.MODE_ONEWAYTOSOURCE) {
                return false;
            }
            return true;
        };
        DataBinding.prototype.updateTarget = function () {
            var value = this._getActualDataSource();
            var properties = this.propertyPathName.split(".");
            for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                var propertyName = properties_1[_i];
                value = value[propertyName];
            }
            this._storeBoundValue(this._owner, value);
        };
        DataBinding.prototype._storeBoundValue = function (watcher, value) {
            if ((++this._updateCounter > 1) && (this.mode === DataBinding.MODE_ONETIME)) {
                return;
            }
            var newValue = value;
            if (this._converter) {
                newValue = this._converter(value);
            }
            if (this._stringFormat) {
                newValue = this._stringFormat(newValue);
            }
            watcher[this._boundTo.name] = newValue;
        };
        DataBinding.prototype._getActualDataSource = function () {
            if (this.dataSource) {
                return this.dataSource;
            }
            if (this.uiElementId) {
                // TODO Find UIElement
                return null;
            }
            return this._owner.dataSource;
        };
        DataBinding.prototype._registerDataSource = function (updateTarget) {
            var ds = this._getActualDataSource();
            if (ds === this._currentDataSource) {
                return;
            }
            if (this._currentDataSource) {
                BindingHelper.unregisterDataSource(this._currentDataSource, this, 0);
            }
            if (ds) {
                BindingHelper.registerDataSource(ds, this);
                if (updateTarget && this.canUpdateTarget(true)) {
                    this.updateTarget();
                }
            }
            this._currentDataSource = ds;
        };
        DataBinding.prototype._unregisterDataSource = function () {
            var ds = this._getActualDataSource();
            if (ds) {
                BindingHelper.unregisterDataSource(ds, this, 0);
            }
        };
        /**
         * Use the mode specified in the SmartProperty declaration
         */
        DataBinding.MODE_DEFAULT = 1;
        /**
         * Update the binding target only once when the Smart Property's value is first accessed
         */
        DataBinding.MODE_ONETIME = 2;
        /**
         * Update the smart property when the source changes.
         * The source won't be updated if the smart property value is set.
         */
        DataBinding.MODE_ONEWAY = 3;
        /**
         * Only update the source when the target's data is changing.
         */
        DataBinding.MODE_ONEWAYTOSOURCE = 4;
        /**
         * Update the bind target when the source changes and update the source when the Smart Property value is set.
         */
        DataBinding.MODE_TWOWAY = 5;
        /**
         * Use the Update Source Trigger defined in the SmartProperty declaration
         */
        DataBinding.UPDATESOURCETRIGGER_DEFAULT = 1;
        /**
         * Update the source as soon as the Smart Property has a value change
         */
        DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED = 2;
        /**
         * Update the source when the binding target loses focus
         */
        DataBinding.UPDATESOURCETRIGGER_LOSTFOCUS = 3;
        /**
         * Update the source will be made by explicitly calling the UpdateFromDataSource method
         */
        DataBinding.UPDATESOURCETRIGGER_EXPLICIT = 4;
        DataBinding = __decorate([
            BABYLON.className("DataBinding", "BABYLON")
        ], DataBinding);
        return DataBinding;
    }());
    BABYLON.DataBinding = DataBinding;
    var SmartPropertyBase = (function (_super) {
        __extends(SmartPropertyBase, _super);
        function SmartPropertyBase() {
            _super.call(this);
            this._dataSource = null;
            this._dataSourceObserver = null;
            this._instanceDirtyFlags = 0;
            this._isDisposed = false;
            this._bindings = null;
            this._hasBinding = 0;
            this._bindingSourceChanged = 0;
            this._disposeObservable = null;
        }
        Object.defineProperty(SmartPropertyBase.prototype, "disposeObservable", {
            get: function () {
                if (!this._disposeObservable) {
                    this._disposeObservable = new BABYLON.Observable();
                }
                return this._disposeObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SmartPropertyBase.prototype, "isDisposed", {
            /**
             * Check if the object is disposed or not.
             * @returns true if the object is dispose, false otherwise.
             */
            get: function () {
                return this._isDisposed;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyBase.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            if (this._disposeObservable && this._disposeObservable.hasObservers()) {
                this._disposeObservable.notifyObservers(this);
            }
            this._isDisposed = true;
            return true;
        };
        /**
         * Check if a given set of properties are dirty or not.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return true if at least one property is dirty, false if none of them are.
         */
        SmartPropertyBase.prototype.checkPropertiesDirty = function (flags) {
            return (this._instanceDirtyFlags & flags) !== 0;
        };
        /**
         * Clear a given set of properties.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return the new set of property still marked as dirty
         */
        SmartPropertyBase.prototype.clearPropertiesDirty = function (flags) {
            this._instanceDirtyFlags &= ~flags;
            return this._instanceDirtyFlags;
        };
        SmartPropertyBase.prototype._resetPropertiesDirty = function () {
            this._instanceDirtyFlags = 0;
        };
        /**
         * Add an externally attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        SmartPropertyBase.prototype.addExternalData = function (key, data) {
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
        SmartPropertyBase.prototype.getExternalData = function (key) {
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
        SmartPropertyBase.prototype.getOrAddExternalDataWithFactory = function (key, factory) {
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
        SmartPropertyBase.prototype.removeExternalData = function (key) {
            if (!this._externalData) {
                return false;
            }
            return this._externalData.remove(key);
        };
        SmartPropertyBase._hookProperty = function (propId, piStore, kind, settings) {
            return function (target, propName, descriptor) {
                if (!settings) {
                    settings = {};
                }
                var propInfo = SmartPropertyBase._createPropInfo(target, propName, propId, kind, settings);
                if (piStore) {
                    piStore(propInfo);
                }
                var getter = descriptor.get, setter = descriptor.set;
                var typeLevelCompare = (settings.typeLevelCompare !== undefined) ? settings.typeLevelCompare : false;
                // Overload the property setter implementation to add our own logic
                descriptor.set = function (val) {
                    if (!setter) {
                        throw Error("Property '" + propInfo.name + "' of type '" + BABYLON.Tools.getFullClassName(this) + "' has no setter defined but was invoked as if it had one.");
                    }
                    // check for disposed first, do nothing
                    if (this.isDisposed) {
                        return;
                    }
                    var curVal = getter.call(this);
                    if (SmartPropertyBase._checkUnchanged(curVal, val)) {
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
        SmartPropertyBase._createPropInfo = function (target, propName, propId, kind, settings) {
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
            propInfo.bindingMode = (settings.bindingMode !== undefined) ? settings.bindingMode : DataBinding.MODE_TWOWAY;
            propInfo.bindingUpdateSourceTrigger = (settings.bindingUpdateSourceTrigger !== undefined) ? settings.bindingUpdateSourceTrigger : DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            propInfo.dirtyBoundingInfo = (settings.dirtyBoundingInfo !== undefined) ? settings.dirtyBoundingInfo : false;
            propInfo.dirtyParentBoundingInfo = (settings.dirtyParentBoundingBox !== undefined) ? settings.dirtyParentBoundingBox : false;
            propInfo.typeLevelCompare = (settings.typeLevelCompare !== undefined) ? settings.typeLevelCompare : false;
            node.levelContent.add(propName, propInfo);
            return propInfo;
        };
        Object.defineProperty(SmartPropertyBase.prototype, "propDic", {
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
        SmartPropertyBase._checkUnchanged = function (curValue, newValue) {
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
        SmartPropertyBase.prototype._handlePropChanged = function (curValue, newValue, propName, propInfo, typeLevelCompare) {
            // Trigger property changed
            var info = SmartPropertyBase.propChangeGuarding ? new BABYLON.PropertyChangedInfo() : SmartPropertyPrim.propChangedInfo;
            info.oldValue = curValue;
            info.newValue = newValue;
            info.propertyName = propName;
            var propMask = propInfo ? propInfo.flagId : -1;
            try {
                SmartPropertyBase.propChangeGuarding = true;
                this.propertyChanged.notifyObservers(info, propMask);
            }
            finally {
                SmartPropertyBase.propChangeGuarding = false;
            }
        };
        SmartPropertyBase.prototype._triggerPropertyChanged = function (propInfo, newValue) {
            if (this.isDisposed) {
                return;
            }
            if (!propInfo) {
                return;
            }
            this._handlePropChanged(undefined, newValue, propInfo.name, propInfo, propInfo.typeLevelCompare);
        };
        Object.defineProperty(SmartPropertyBase.prototype, "dataSource", {
            /**
             * Set the object from which Smart Properties using Binding will take/update their data from/to.
             * When the object is part of a graph (with parent/children relationship) if the dataSource of a given instance is not specified, then the parent's one is used.
             */
            get: function () {
                // Don't access to _dataSource directly but via a call to the _getDataSource method which can be overloaded in inherited classes
                return this._getDataSource();
            },
            set: function (value) {
                if (this._dataSource === value) {
                    return;
                }
                var oldValue = this._dataSource;
                this._dataSource = value;
                if (this._bindings && value != null) {
                    // Register the bindings
                    for (var _i = 0, _a = this._bindings; _i < _a.length; _i++) {
                        var binding = _a[_i];
                        if (binding != null) {
                            binding._registerDataSource(true);
                        }
                    }
                }
                this.onPropertyChanged("dataSource", oldValue, value);
            },
            enumerable: true,
            configurable: true
        });
        // Inheriting classes can overload this method to provides additional logic for dataSource access
        SmartPropertyBase.prototype._getDataSource = function () {
            return this._dataSource;
        };
        SmartPropertyBase.prototype.createSimpleDataBinding = function (propInfo, propertyPathName, mode) {
            if (mode === void 0) { mode = DataBinding.MODE_DEFAULT; }
            var binding = new DataBinding();
            binding.propertyPathName = propertyPathName;
            binding.mode = mode;
            return this.createDataBinding(propInfo, binding);
        };
        SmartPropertyBase.prototype.createDataBinding = function (propInfo, binding) {
            if (!this._bindings) {
                this._bindings = new Array();
            }
            if (!binding || binding._owner != null) {
                throw Error("A valid/unused Binding must be passed.");
            }
            // Unregister a potentially existing binding for this property
            this.removeDataBinding(propInfo);
            // register the binding
            binding._owner = this;
            binding._boundTo = propInfo;
            this._bindings[propInfo.id] = binding;
            this._hasBinding |= propInfo.flagId;
            binding._registerDataSource(true);
            return binding;
        };
        SmartPropertyBase.prototype.removeDataBinding = function (propInfo) {
            if ((this._hasBinding & propInfo.flagId) === 0) {
                return false;
            }
            var curBinding = this._bindings[propInfo.id];
            curBinding._unregisterDataSource();
            this._bindings[propInfo.id] = null;
            this._hasBinding &= ~propInfo.flagId;
            return true;
        };
        SmartPropertyBase.prototype.updateFromDataSource = function () {
            for (var _i = 0, _a = this._bindings; _i < _a.length; _i++) {
                var binding = _a[_i];
                if (binding) {
                }
            }
        };
        SmartPropertyBase.propChangedInfo = new BABYLON.PropertyChangedInfo();
        SmartPropertyBase.propChangeGuarding = false;
        SmartPropertyBase = __decorate([
            BABYLON.className("SmartPropertyBase", "BABYLON")
        ], SmartPropertyBase);
        return SmartPropertyBase;
    }(BABYLON.PropertyChangedBase));
    BABYLON.SmartPropertyBase = SmartPropertyBase;
    var BindingInfo = (function () {
        function BindingInfo(binding, level, isLast) {
            this.binding = binding;
            this.level = level;
            this.isLast = isLast;
        }
        return BindingInfo;
    }());
    var MonitoredObjectData = (function () {
        function MonitoredObjectData(monitoredObject) {
            var _this = this;
            this.monitoredObject = monitoredObject;
            this.monitoredIntermediateProperties = new BABYLON.StringDictionary();
            this.observer = this.monitoredObject.propertyChanged.add(function (e, s) { _this.propertyChangedHandler(e.propertyName, e.oldValue, e.newValue); });
            this.boundProperties = new BABYLON.StringDictionary();
            this.monitoredIntermediateMask = 0;
            this.boundPropertiesMask = 0;
        }
        MonitoredObjectData.prototype.propertyChangedHandler = function (propName, oldValue, newValue) {
            var propId = BindingHelper._getPropertyID(this.monitoredObject, propName);
            var propIdStr = propId.toString();
            // Loop through all the registered bindings for this property that had a value change
            if ((this.boundPropertiesMask & propId) !== 0) {
                var bindingInfos = this.boundProperties.get(propIdStr);
                for (var _i = 0, bindingInfos_1 = bindingInfos; _i < bindingInfos_1.length; _i++) {
                    var bi = bindingInfos_1[_i];
                    if (!bi.isLast) {
                        BindingHelper.unregisterDataSource(this.monitoredObject, bi.binding, bi.level);
                        BindingHelper.registerDataSource(bi.binding._currentDataSource, bi.binding);
                    }
                    if (bi.binding.canUpdateTarget(false)) {
                        bi.binding.updateTarget();
                    }
                }
            }
        };
        return MonitoredObjectData;
    }());
    var BindingHelper = (function () {
        function BindingHelper() {
        }
        BindingHelper.registerDataSource = function (dataSource, binding) {
            var properties = binding.propertyPathName.split(".");
            var ownerMod = null;
            var ownerInterPropId = 0;
            var propertyOwner = dataSource;
            var _loop_1 = function(i) {
                var propName = properties[i];
                var propId = BindingHelper._getPropertyID(propertyOwner, propName);
                var propIdStr = propId.toString();
                var mod = void 0;
                if (ownerMod) {
                    var o_1 = ownerMod;
                    var po_1 = propertyOwner;
                    var oii_1 = ownerInterPropId;
                    mod = ownerMod.monitoredIntermediateProperties.getOrAddWithFactory(oii_1.toString(), function (k) {
                        o_1.monitoredIntermediateMask |= oii_1;
                        return BindingHelper._getMonitoredObjectData(po_1);
                    });
                }
                else {
                    mod = BindingHelper._getMonitoredObjectData(propertyOwner);
                }
                var m = mod;
                var bindingInfos = mod.boundProperties.getOrAddWithFactory(propIdStr, function (k) {
                    m.boundPropertiesMask |= propId;
                    return new Array();
                });
                var bi = BABYLON.Tools.first(bindingInfos, function (cbi) { return cbi.binding === binding; });
                if (!bi) {
                    bindingInfos.push(new BindingInfo(binding, i, (i + 1) === properties.length));
                }
                ownerMod = mod;
                ownerInterPropId = propId;
                propertyOwner = propertyOwner[propName];
            };
            for (var i = 0; i < properties.length; i++) {
                _loop_1(i);
            }
        };
        BindingHelper.unregisterDataSource = function (dataSource, binding, level) {
            var properties = binding.propertyPathName.split(".");
            var propertyOwner = dataSource;
            var mod = BindingHelper._getMonitoredObjectData(propertyOwner);
            for (var i = 0; i < properties.length; i++) {
                var propName = properties[i];
                var propId = BindingHelper._getPropertyID(propertyOwner, propName);
                var propIdStr = propId.toString();
                if (i >= level) {
                    mod = BindingHelper._unregisterBinding(mod, propId, binding);
                }
                else {
                    mod = mod.monitoredIntermediateProperties.get(propIdStr);
                }
                propertyOwner = propertyOwner[propName];
            }
        };
        BindingHelper._unregisterBinding = function (mod, propertyID, binding) {
            var propertyIDStr = propertyID.toString();
            var res = null;
            // Check if the property is registered as an intermediate and remove it
            if ((mod.monitoredIntermediateMask & propertyID) !== 0) {
                res = mod.monitoredIntermediateProperties.get(propertyIDStr);
                mod.monitoredIntermediateProperties.remove(propertyIDStr);
                // Update the mask
                mod.monitoredIntermediateMask &= ~propertyID;
            }
            // Check if the property is registered as a final property and remove it
            if ((mod.boundPropertiesMask & propertyID) !== 0) {
                var bindingInfos = mod.boundProperties.get(propertyIDStr);
                // Find the binding and remove it
                var bi = BABYLON.Tools.first(bindingInfos, function (cbi) { return cbi.binding === binding; });
                if (bi) {
                    var bii = bindingInfos.indexOf(bi);
                    bindingInfos.splice(bii, 1);
                }
                // If the array is empty, update the mask
                if (bindingInfos.length === 0) {
                    mod.boundPropertiesMask &= ~propertyID;
                }
            }
            // Check if the MOD is empty and unregister the observer and remove it from the list of MODs
            if (mod.boundPropertiesMask === 0 && mod.monitoredIntermediateMask === 0) {
                // Unregister the observer on Property Change
                mod.monitoredObject.propertyChanged.remove(mod.observer);
                // Remove the MOD from the dic
                var objectId = BindingHelper._getObjectId(mod.monitoredObject);
                BindingHelper._monitoredObjects.remove(objectId);
            }
            return res;
        };
        BindingHelper._getMonitoredObjectData = function (object) {
            var objectId = BindingHelper._getObjectId(object);
            var mod = BindingHelper._monitoredObjects.getOrAddWithFactory(objectId, function (k) { return new MonitoredObjectData(object); });
            return mod;
        };
        BindingHelper._getObjectId = function (obj) {
            var id = obj["__bindingHelperObjectId__"];
            if (id == null) {
                id = BABYLON.Tools.RandomId();
                obj["__bindingHelperObjectId__"] = id;
                return id;
            }
            return id;
        };
        BindingHelper._getObjectTypePropertyIDs = function (obj) {
            var fullName = BABYLON.Tools.getFullClassName(obj);
            if (!fullName) {
                throw Error("Types involved in Data Binding must be decorated with the @className decorator");
            }
            var d = BindingHelper._propertiesID.getOrAddWithFactory(fullName, function () { return new BABYLON.StringDictionary(); });
            return d;
        };
        BindingHelper._getPropertyID = function (object, propName) {
            var otd = BindingHelper._getObjectTypePropertyIDs(object);
            // Make sure we have a WatchedPropertyData for this property of this object type. This will contains the flagIg of the watched property.
            // We use this flagId to flag for each watched instance which properties are watched, as final or intermediate and which directions are used
            var propData = otd.getOrAddWithFactory(propName, function (k) { return 1 << otd.count; });
            return propData;
        };
        BindingHelper._propertiesID = new BABYLON.StringDictionary();
        BindingHelper._monitoredObjects = new BABYLON.StringDictionary();
        return BindingHelper;
    }());
    var SmartPropertyPrim = (function (_super) {
        __extends(SmartPropertyPrim, _super);
        function SmartPropertyPrim() {
            _super.call(this);
            this._flags = 0;
            this._modelKey = null;
            this._levelBoundingInfo = new BABYLON.BoundingInfo2D();
            this._boundingInfo = new BABYLON.BoundingInfo2D();
            this.animations = new Array();
        }
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        SmartPropertyPrim.prototype.dispose = function () {
            if (this.isDisposed) {
                return false;
            }
            _super.prototype.dispose.call(this);
            // Don't set to null, it may upset somebody...
            this.animations.splice(0);
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
            _super.prototype._handlePropChanged.call(this, curValue, newValue, propName, propInfo, typeLevelCompare);
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
                var propMask = propInfo.flagId;
                this.onPrimitivePropertyDirty(propMask);
            }
        };
        SmartPropertyPrim.prototype.onPrimitivePropertyDirty = function (propFlagId) {
            this.onPrimBecomesDirty();
            this._instanceDirtyFlags |= propFlagId;
        };
        SmartPropertyPrim.prototype.handleGroupChanged = function (prop) {
        };
        SmartPropertyPrim.prototype._resetPropertiesDirty = function () {
            _super.prototype._resetPropertiesDirty.call(this);
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
        SmartPropertyPrim.SMARTPROPERTYPRIM_PROPCOUNT = 0;
        SmartPropertyPrim.flagFREE001 = 0x0000001; // set if the object is already disposed
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
            BABYLON.className("SmartPropertyPrim", "BABYLON")
        ], SmartPropertyPrim);
        return SmartPropertyPrim;
    }(SmartPropertyBase));
    BABYLON.SmartPropertyPrim = SmartPropertyPrim;
    function dependencyProperty(propId, piStore, mode, updateSourceTrigger) {
        if (mode === void 0) { mode = DataBinding.MODE_TWOWAY; }
        if (updateSourceTrigger === void 0) { updateSourceTrigger = DataBinding.UPDATESOURCETRIGGER_PROPERTYCHANGED; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { bindingMode: mode, bindingUpdateSourceTrigger: updateSourceTrigger });
    }
    BABYLON.dependencyProperty = dependencyProperty;
    function modelLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_MODEL, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.modelLevelProperty = modelLevelProperty;
    function instanceLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_INSTANCE, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.instanceLevelProperty = instanceLevelProperty;
    function dynamicLevelProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, dirtyParentBoundingBox) {
        if (typeLevelCompare === void 0) { typeLevelCompare = false; }
        if (dirtyBoundingInfo === void 0) { dirtyBoundingInfo = false; }
        if (dirtyParentBoundingBox === void 0) { dirtyParentBoundingBox = false; }
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
    BABYLON.dynamicLevelProperty = dynamicLevelProperty;
})(BABYLON || (BABYLON = {}));

declare module BABYLON {
    /**
       * A class storing a Matrix2D for 2D transformations
       * The stored matrix is a 3*3 Matrix2D
       * I   [0,1]   [mX, mY]   R   [ CosZ, SinZ]  T    [ 0,  0]  S   [Sx,  0]
       * D = [2,3] = [nX, nY]   O = [-SinZ, CosZ]  R =  [ 0,  0]  C = [ 0, Sy]
       * X   [4,5]   [tX, tY]   T   [  0  ,  0  ]  N    [Tx, Ty]  L   [ 0,  0]
       *
       * IDX = index, zero based. ROT = Z axis Rotation. TRN = Translation. SCL = Scale.
       */
    class Matrix2D {
        static Zero(): Matrix2D;
        static FromValuesToRef(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number, result: Matrix2D): void;
        static FromMatrix(source: Matrix): Matrix2D;
        static FromMatrixToRef(source: Matrix, result: Matrix2D): void;
        static Rotation(angle: number): Matrix2D;
        static RotationToRef(angle: number, result: Matrix2D): void;
        static Translation(x: number, y: number): Matrix2D;
        static TranslationToRef(x: number, y: number, result: Matrix2D): void;
        static Scaling(x: number, y: number): Matrix2D;
        static ScalingToRef(x: number, y: number, result: Matrix2D): void;
        m: Float32Array;
        static Identity(): Matrix2D;
        static IdentityToRef(res: Matrix2D): void;
        static FromQuaternion(quaternion: Quaternion): Matrix2D;
        static FromQuaternionToRef(quaternion: Quaternion, result: Matrix2D): void;
        static Compose(scale: Vector2, rotation: number, translation: Vector2): Matrix2D;
        static Invert(source: Matrix2D): Matrix2D;
        clone(): Matrix2D;
        copyFrom(other: Matrix2D): void;
        getTranslation(): Vector2;
        setTranslation(translation: Vector2): void;
        determinant(): number;
        invertToThis(): void;
        invert(): Matrix2D;
        invertToRef(res: Matrix2D): void;
        multiplyToThis(other: Matrix2D): void;
        multiply(other: Matrix2D): Matrix2D;
        multiplyToRef(other: Matrix2D, result: Matrix2D): void;
        transformFloats(x: number, y: number): Vector2;
        transformFloatsToRef(x: number, y: number, r: Vector2): void;
        transformPoint(p: Vector2): Vector2;
        transformPointToRef(p: Vector2, r: Vector2): void;
        private static _decomp;
        decompose(scale: Vector2, translation: Vector2): number;
    }
    /**
     * Stores information about a 2D Triangle.
     * This class stores the 3 vertices but also the center and radius of the triangle
     */
    class Tri2DInfo {
        /**
         * Construct an instance of Tri2DInfo, you can either pass null to a, b and c and the instance will be allocated "clear", or give actual triangle info and the center/radius will be computed
         */
        constructor(a: Vector2, b: Vector2, c: Vector2);
        a: Vector2;
        b: Vector2;
        c: Vector2;
        center: Vector2;
        radius: number;
        static Zero(): Tri2DInfo;
        set(a: Vector2, b: Vector2, c: Vector2): void;
        transformInPlace(transform: Matrix2D): void;
        doesContain(p: Vector2): boolean;
        private _updateCenterRadius();
    }
    /**
     * Stores an array of 2D Triangles.
     * Internally the data is stored as a Float32Array to minimize the memory footprint.
     * This can use the Tri2DInfo class as proxy for storing/retrieving data.
     * The array can't grow, it's fixed size.
     */
    class Tri2DArray {
        constructor(count: number);
        /**
         * Clear the content and allocate a new array to store the given count of triangles
         * @param count The new count of triangles to store
         */
        clear(count: number): void;
        /**
         * Store a given triangle at the given index
         * @param index the 0 based index to store the triangle in the array
         * @param a the A vertex of the triangle
         * @param b the B vertex of the triangle
         * @param c the C vertex of the triangle
         */
        storeTriangle(index: number, a: Vector2, b: Vector2, c: Vector2): void;
        /**
         * Store a triangle in a Tri2DInfo object
         * @param index the index of the triangle to store
         * @param tri2dInfo the instance that will contain the data, it must be already allocated with its inner object also allocated
         */
        storeToTri2DInfo(index: number, tri2dInfo: Tri2DInfo): void;
        /**
         * Transform the given triangle and store its result in the array
         * @param index The index to store the result to
         * @param tri2dInfo The triangle to transform
         * @param transform The transformation matrix
         */
        transformAndStoreToTri2DInfo(index: number, tri2dInfo: Tri2DInfo, transform: Matrix2D): void;
        /**
         * Get the element count that can be stored in this array
         * @returns {}
         */
        readonly count: number;
        /**
         * Check if a given point intersects with at least one of the triangles stored in the array.
         * If true is returned the point is intersecting with at least one triangle, false if it doesn't intersect with any of them
         * @param p The point to check
         */
        doesContain(p: Vector2): boolean;
        /**
         * Make a intersection test between two sets of triangles. The triangles of setB will be transformed to the frame of reference of the setA using the given bToATransform matrix.
         * If true is returned at least one triangle intersects with another of the other set, otherwise false is returned.
         * @param setA The first set of triangles
         * @param setB The second set of triangles
         * @param bToATransform The transformation matrix to transform the setB triangles into the frame of reference of the setA
         */
        static doesIntersect(setA: Tri2DArray, setB: Tri2DArray, bToATransform: Matrix2D): boolean;
        private static _checkInitStatics();
        private _count;
        private _array;
        private static tempV;
        private static tempT;
    }
}

declare module BABYLON {
    class PropertyChangedInfo {
        /**
         * Previous value of the property
         */
        oldValue: any;
        /**
         * New value of the property
         */
        newValue: any;
        /**
         * Name of the property that changed its value
         */
        propertyName: string;
    }
    /**
     * Custom type of the propertyChanged observable
     */
    /**
     * Property Changed interface
     */
    interface IPropertyChanged {
        /**
         * PropertyChanged observable
         */
        propertyChanged: Observable<PropertyChangedInfo>;
    }
    /**
     * The purpose of this class is to provide a base implementation of the IPropertyChanged interface for the user to avoid rewriting a code needlessly.
     * Typical use of this class is to check for equality in a property set(), then call the onPropertyChanged method if values are different after the new value is set. The protected method will notify observers of the change.
     * Remark: onPropertyChanged detects reentrant code and acts in a way to make sure everything is fine, fast and allocation friendly (when there no reentrant code which should be 99% of the time)
     */
    abstract class PropertyChangedBase implements IPropertyChanged {
        /**
         * Protected method to call when there's a change of value in a property set
         * @param propName the name of the concerned property
         * @param oldValue its old value
         * @param newValue its new value
         * @param mask an optional observable mask
         */
        protected onPropertyChanged<T>(propName: string, oldValue: T, newValue: T, mask?: number): void;
        /**
         * An observable that is triggered when a property (using of the XXXXLevelProperty decorator) has its value changing.
         * You can add an observer that will be triggered only for a given set of Properties using the Mask feature of the Observable and the corresponding Prim2DPropInfo.flagid value (e.g. Prim2DBase.positionProperty.flagid|Prim2DBase.rotationProperty.flagid to be notified only about position or rotation change)
         */
        readonly propertyChanged: Observable<PropertyChangedInfo>;
        _propertyChanged: Observable<PropertyChangedInfo>;
        private static pci;
        private static calling;
    }
}

declare module BABYLON {
    class C2DLogging {
        static snooze: boolean;
        static logFrameRender(frameCount: number): void;
        static setPostMessage(message: () => string): void;
        static _startFrameRender(): void;
        static _endFrameRender(): void;
        private static _logFramesCount;
    }
    function logProp<T>(message?: string, alsoGet?: boolean, setNoProlog?: boolean, getNoProlog?: boolean): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
    function logMethod(message?: string, noProlog?: boolean): (target: any, key: any, descriptor: any) => any;
}

declare module BABYLON {
    /**
     * Class for the ObservableArray.onArrayChanged observable
     */
    class ArrayChanged<T> {
        constructor();
        /**
         * Contain the action that were made on the ObservableArray, it's one of the ArrayChanged.xxxAction members.
         * Note the action's value can be used in the "mask" field of the Observable to only be notified about given action(s)
         */
        action: number;
        /**
         * Only valid if the action is newItemsAction
         */
        newItems: {
            index: number;
            value: T;
        }[];
        /**
         * Only valid if the action is removedItemsAction
         */
        removedItems: {
            index: number;
            value: T;
        }[];
        /**
         * Only valid if the action is changedItemAction
         */
        changedItems: {
            index: number;
            value: T;
        }[];
        /**
         * Get the index of the first item inserted
         */
        newStartingIndex: number;
        /**
         * Get the index of the first item removed
         */
        removedStartingIndex: number;
        /**
         * Get the index of the first changed item
         */
        changedStartingIndex: number;
        /**
         * The content of the array was totally cleared
         */
        static readonly clearAction: number;
        /**
         * A new item was added, the newItems field contains the key/value pairs
         */
        static readonly newItemsAction: number;
        /**
         * An existing item was removed, the removedKey field contains its key
         */
        static readonly removedItemsAction: number;
        /**
         * One or many items in the array were changed, the
         */
        static readonly changedItemAction: number;
        /**
         * The array's content was totally changed
         * Depending on the method that used this mode the ChangedArray object may contains more information
         */
        static readonly replacedArrayAction: number;
        /**
         * The length of the array changed
         */
        static readonly lengthChangedAction: number;
        private static _clearAction;
        private static _newItemsAction;
        private static _removedItemsAction;
        private static _replacedArrayAction;
        private static _lengthChangedAction;
        private static _changedItemAction;
        clear(): void;
    }
    class OAWatchedObjectChangedInfo<T> {
        object: T;
        propertyChanged: PropertyChangedInfo;
    }
    /**
     * This class mimics the Javascript Array and TypeScript Array<T> classes, adding new features concerning the Observable pattern.
     *
     */
    class ObservableArray<T> extends PropertyChangedBase {
        /**
         * Create an Observable Array.
         * @param watchObjectsPropertyChange
         * @param array and optional array that will be encapsulated by this ObservableArray instance. That's right, it's NOT a copy!
         */
        constructor(watchObjectsPropertyChange: boolean, array?: Array<T>);
        /**
          * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
          */
        length: number;
        getAt(index: number): T;
        setAt(index: number, value: T): boolean;
        /**
          * Returns a string representation of an array.
          */
        toString(): string;
        toLocaleString(): string;
        /**
          * Appends new elements to an array, and returns the new length of the array.
          * @param items New elements of the Array.
          */
        push(...items: T[]): number;
        /**
          * Removes the last element from an array and returns it.
          */
        pop(): T;
        /**
          * Combines two or more arrays.
          * @param items Additional items to add to the end of array1.
          */
        concat(...items: T[]): ObservableArray<T>;
        /**
          * Adds all the elements of an array separated by the specified separator string.
          * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
          */
        join(separator?: string): string;
        /**
          * Reverses the elements in an Array.
         * The arrayChanged action is
          */
        reverse(): T[];
        /**
          * Removes the first element from an array and returns it, shift all subsequents element one element before.
         * The ArrayChange action is replacedArrayAction, the whole array changes and must be reevaluate as such, the removed element is in removedItems.
         *
          */
        shift(): T;
        /**
          * Returns a section of an array.
          * @param start The beginning of the specified portion of the array.
          * @param end The end of the specified portion of the array.
          */
        slice(start?: number, end?: number): ObservableArray<T>;
        /**
          * Sorts an array.
          * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
         * On the contrary of the Javascript Array's implementation, this method returns nothing
          */
        sort(compareFn?: (a: T, b: T) => number): void;
        /**
          * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
          * @param start The zero-based location in the array from which to start removing elements.
          * @param deleteCount The number of elements to remove.
          * @param items Elements to insert into the array in place of the deleted elements.
          */
        splice(start: number, deleteCount: number, ...items: T[]): T[];
        /**
          * Inserts new elements at the start of an array.
          * @param items  Elements to insert at the start of the Array.
          * The ChangedArray action is replacedArrayAction, newItems contains the list of the added items
          */
        unshift(...items: T[]): number;
        /**
          * Returns the index of the first occurrence of a value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
          */
        indexOf(searchElement: T, fromIndex?: number): number;
        /**
          * Returns the index of the last occurrence of a specified value in an array.
          * @param searchElement The value to locate in the array.
          * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
          */
        lastIndexOf(searchElement: T, fromIndex?: number): number;
        /**
          * Determines whether all the members of an array satisfy the specified test.
          * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        every(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
        /**
          * Determines whether the specified callback function returns true for any element of an array.
          * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        some(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
        /**
          * Performs the specified action for each element in an array.
          * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
          * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
        /**
          * Calls a defined callback function on each element of an array, and returns an array that contains the results.
          * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
        /**
          * Returns the elements of an array that meet the condition specified in a callback function.
          * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
          * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
          */
        filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
        /**
          * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T;
        /**
          * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
          * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.
          * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
          */
        reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T;
        readonly arrayChanged: Observable<ArrayChanged<T>>;
        protected getArrayChangedObject(): ArrayChanged<T>;
        protected feedNotifArray(array: {
            index: number;
            value: T;
        }[], startindIndex: number, ...items: T[]): void;
        protected callArrayChanged(ac: ArrayChanged<T>): void;
        readonly watchedObjectChanged: Observable<OAWatchedObjectChangedInfo<T>>;
        private _addWatchedElement(...items);
        private _removeWatchedElement(...items);
        protected onWatchedObjectChanged(key: string, object: T, propChanged: PropertyChangedInfo): void;
        private _array;
        private _arrayChanged;
        private dci;
        private _callingArrayChanged;
        private _watchedObjectChanged;
        private _woci;
        private _callingWatchedObjectChanged;
        private _watchObjectsPropertyChange;
        private _watchedObjectList;
    }
}

declare module BABYLON {
    /**
     * Class for the ObservableStringDictionary.onDictionaryChanged observable
     */
    class DictionaryChanged<T> {
        /**
         * Contain the action that were made on the dictionary, it's one of the DictionaryChanged.xxxAction members.
         * Note the action's value can be used in the "mask" field of the Observable to only be notified about given action(s)
         */
        action: number;
        /**
         * Only valid if the action is newItemAction
         */
        newItem: {
            key: string;
            value: T;
        };
        /**
         * Only valid if the action is removedItemAction
         */
        removedKey: string;
        /**
         * Only valid if the action is itemValueChangedAction
         */
        changedItem: {
            key: string;
            oldValue: T;
            newValue: T;
        };
        /**
         * The content of the dictionary was totally cleared
         */
        static readonly clearAction: number;
        /**
         * A new item was added, the newItem field contains the key/value pair
         */
        static readonly newItemAction: number;
        /**
         * An existing item was removed, the removedKey field contains its key
         */
        static readonly removedItemAction: number;
        /**
         * An existing item had a value change, the changedItem field contains the key/value
         */
        static readonly itemValueChangedAction: number;
        /**
         * The dictionary's content was reset and replaced by the content of another dictionary.
         * DictionaryChanged<T> contains no further information about this action
         */
        static readonly replacedAction: number;
        private static _clearAction;
        private static _newItemAction;
        private static _removedItemAction;
        private static _itemValueChangedAction;
        private static _replacedAction;
    }
    class OSDWatchedObjectChangedInfo<T> {
        key: string;
        object: T;
        propertyChanged: PropertyChangedInfo;
    }
    class ObservableStringDictionary<T> extends StringDictionary<T> implements IPropertyChanged {
        constructor(watchObjectsPropertyChange: boolean);
        /**
         * This will clear this dictionary and copy the content from the 'source' one.
         * If the T value is a custom object, it won't be copied/cloned, the same object will be used
         * @param source the dictionary to take the content from and copy to this dictionary
         */
        copyFrom(source: StringDictionary<T>): void;
        /**
         * Get a value from its key or add it if it doesn't exist.
         * This method will ensure you that a given key/data will be present in the dictionary.
         * @param key the given key to get the matching value from
         * @param factory the factory that will create the value if the key is not present in the dictionary.
         * The factory will only be invoked if there's no data for the given key.
         * @return the value corresponding to the key.
         */
        getOrAddWithFactory(key: string, factory: (key: string) => T): T;
        /**
         * Add a new key and its corresponding value
         * @param key the key to add
         * @param value the value corresponding to the key
         * @return true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
         */
        add(key: string, value: T): boolean;
        getAndRemove(key: string): T;
        private _add(key, value, fireNotif, registerWatcher);
        private _addWatchedElement(key, el);
        private _removeWatchedElement(key, el);
        set(key: string, value: T): boolean;
        /**
         * Remove a key/value from the dictionary.
         * @param key the key to remove
         * @return true if the item was successfully deleted, false if no item with such key exist in the dictionary
         */
        remove(key: string): boolean;
        private _remove(key, fireNotif, element?);
        /**
         * Clear the whole content of the dictionary
         */
        clear(): void;
        readonly propertyChanged: Observable<PropertyChangedInfo>;
        protected onPropertyChanged<T>(propName: string, oldValue: T, newValue: T, mask?: number): void;
        readonly dictionaryChanged: Observable<DictionaryChanged<T>>;
        protected onDictionaryChanged(action: number, newItem: {
            key: string;
            value: T;
        }, removedKey: string, changedItem: {
            key: string;
            oldValue: T;
            newValue: T;
        }): void;
        readonly watchedObjectChanged: Observable<OSDWatchedObjectChangedInfo<T>>;
        protected onWatchedObjectChanged(key: string, object: T, propChanged: PropertyChangedInfo): void;
        private _propertyChanged;
        private static pci;
        private static callingPropChanged;
        private _dictionaryChanged;
        private dci;
        private _callingDicChanged;
        private _watchedObjectChanged;
        private _woci;
        private _callingWatchedObjectChanged;
        private _watchObjectsPropertyChange;
        private _watchedObjectList;
    }
}

declare module BABYLON {
    /**
     * This class given information about a given character.
     */
    class CharInfo {
        /**
         * The normalized ([0;1]) top/left position of the character in the texture
         */
        topLeftUV: Vector2;
        /**
         * The normalized ([0;1]) right/bottom position of the character in the texture
         */
        bottomRightUV: Vector2;
        xOffset: number;
        yOffset: number;
        xAdvance: number;
        charWidth: number;
    }
    /**
     * This is an abstract base class to hold a Texture that will contain a FontMap
     */
    abstract class BaseFontTexture extends Texture {
        constructor(url: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, premultipliedAlpha?: boolean);
        /**
         * Is the Font is using Super Sampling (each font texel is doubled).
         */
        readonly isSuperSampled: boolean;
        /**
         * Is the Font was rendered using the Signed Distance Field algorithm
         * @returns {}
         */
        readonly isSignedDistanceField: boolean;
        /**
         * True if the font was drawn using multiplied alpha
         */
        readonly isPremultipliedAlpha: boolean;
        /**
         * Get the Width (in pixel) of the Space character
         */
        readonly spaceWidth: number;
        /**
         * Get the Line height (in pixel)
         */
        readonly lineHeight: number;
        /**
         * When the FontTexture is retrieved through the FontCache, there's a reference counter that is incremented for each use.
         * You also have the possibility to extend the lifetime of the FontTexture when passing it to another object by calling this method
         * Don't forget to call the corresponding decCachedFontTextureCounter method when you no longer have use of the FontTexture.
         * Each call to incCachedFontTextureCounter must have a corresponding call to decCachedFontTextureCounter.
         */
        abstract incCachedFontTextureCounter(): any;
        /**
         * Decrement the reference counter, if it reaches 0 the FontTexture is disposed
         */
        abstract decCachedFontTextureCounter(): any;
        /**
         * Is the font dynamically updated, if true is returned then you have to call the update() before using the font in rendering if new character were adding using getChar()
         */
        readonly abstract isDynamicFontTexture: boolean;
        /**
         * Will fetch the new characters retrieved with getChar() to the texture.
         * If there were no new char, this call is harmless and quit in no time.
         * If there were new chars a texture lock/update is made, which is a costy operation.
         */
        abstract update(): void;
        /**
         * Measure the width/height that will take a given text
         * @param text the text to measure
         * @param tabulationSize the size (in space character) of the tabulation character, default value must be 4
         */
        measureText(text: string, tabulationSize?: number): Size;
        /**
         * Retrieve the CharInfo object for a given character
         * @param char the character to retrieve the CharInfo object from (e.g.: "A", "a", etc.)
         */
        abstract getChar(char: string): CharInfo;
        protected _charInfos: StringDictionary<CharInfo>;
        protected _lineHeight: number;
        protected _spaceWidth: any;
        protected _superSample: boolean;
        protected _signedDistanceField: boolean;
        protected _isPremultipliedAlpha: boolean;
        protected _cachedFontId: string;
    }
    class BitmapFontInfo {
        kerningDic: StringDictionary<number>;
        charDic: StringDictionary<CharInfo>;
        textureSize: Size;
        atlasName: string;
        padding: Vector4;
        lineHeight: number;
        baseLine: number;
        textureUrl: string;
        textureFile: string;
    }
    interface IBitmapFontLoader {
        loadFont(fontDataContent: any, scene: Scene, invertY: boolean): {
            bfi: BitmapFontInfo;
            errorMsg: string;
            errorCode: number;
        };
    }
    class BitmapFontTexture extends BaseFontTexture {
        constructor(scene: Scene, bmFontUrl: string, textureUrl?: string, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, premultipliedAlpha?: boolean, onLoad?: () => void, onError?: (msg: string, code: number) => void);
        static GetCachedFontTexture(scene: Scene, fontTexture: BitmapFontTexture): BitmapFontTexture;
        static ReleaseCachedFontTexture(scene: Scene, fontTexture: BitmapFontTexture): void;
        /**
         * Is the font dynamically updated, if true is returned then you have to call the update() before using the font in rendering if new character were adding using getChar()
         */
        readonly isDynamicFontTexture: boolean;
        /**
         * This method does nothing for a BitmapFontTexture object as it's a static texture
         */
        update(): void;
        /**
         * Retrieve the CharInfo object for a given character
         * @param char the character to retrieve the CharInfo object from (e.g.: "A", "a", etc.)
         */
        getChar(char: string): CharInfo;
        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        incCachedFontTextureCounter(): void;
        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        decCachedFontTextureCounter(): void;
        private _usedCounter;
        static addLoader(fileExtension: string, plugin: IBitmapFontLoader): void;
        static plugins: StringDictionary<IBitmapFontLoader[]>;
    }
    /**
     * This class is a special kind of texture which generates on the fly characters of a given css style "fontName".
     * The generated texture will be updated when new characters will be retrieved using the getChar() method, but you have
     *  to call the update() method for the texture to fetch these changes, you can harmlessly call update any time you want, if no
     *  change were made, nothing will happen.
     * The Font Texture can be rendered in three modes: normal size, super sampled size (x2) or using Signed Distance Field rendering.
     * Signed Distance Field should be prefered because the texture can be rendered using AlphaTest instead of Transparency, which is way more faster. More about SDF here (http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf).
     * The only flaw of SDF is that the rendering quality may not be the best or the edges too sharp is the font thickness is too thin.
     */
    class FontTexture extends BaseFontTexture {
        private _canvas;
        private _context;
        private _lineHeightSuper;
        private _xMargin;
        private _yMargin;
        private _offset;
        private _baseLine;
        private _currentFreePosition;
        private _curCharCount;
        private _lastUpdateCharCount;
        private _spaceWidthSuper;
        private _sdfCanvas;
        private _sdfContext;
        private _sdfScale;
        private _usedCounter;
        debugMode: boolean;
        readonly isDynamicFontTexture: boolean;
        static GetCachedFontTexture(scene: Scene, fontName: string, supersample?: boolean, signedDistanceField?: boolean, bilinearFiltering?: boolean): FontTexture;
        static ReleaseCachedFontTexture(scene: Scene, fontName: string, supersample?: boolean, signedDistanceField?: boolean, bilinearFiltering?: boolean): void;
        /**
         * Create a new instance of the FontTexture class
         * @param name the name of the texture
         * @param font the font to use, use the W3C CSS notation
         * @param scene the scene that owns the texture
         * @param maxCharCount the approximative maximum count of characters that could fit in the texture. This is an approximation because most of the fonts are proportional (each char has its own Width). The 'W' character's width is used to compute the size of the texture based on the given maxCharCount
         * @param samplingMode the texture sampling mode
         * @param superSample if true the FontTexture will be created with a font of a size twice bigger than the given one but all properties (lineHeight, charWidth, etc.) will be according to the original size. This is made to improve the text quality.
         */
        constructor(name: string, font: string, scene: Scene, maxCharCount?: number, samplingMode?: number, superSample?: boolean, signedDistanceField?: boolean);
        private _saveToImage(url);
        /**
         * Make sure the given char is present in the font map.
         * @param char the character to get or add
         * @return the CharInfo instance corresponding to the given character
         */
        getChar(char: string): CharInfo;
        private _computeSDFChar(source);
        private getSuperSampleFont(font);
        private getFontHeight(font, chars);
        readonly canRescale: boolean;
        getContext(): CanvasRenderingContext2D;
        /**
         * Call this method when you've call getChar() at least one time, this will update the texture if needed.
         * Don't be afraid to call it, if no new character was added, this method simply does nothing.
         */
        update(): void;
        clone(): FontTexture;
        /**
         * For FontTexture retrieved using GetCachedFontTexture, use this method when you transfer this object's lifetime to another party in order to share this resource.
         * When the other party is done with this object, decCachedFontTextureCounter must be called.
         */
        incCachedFontTextureCounter(): void;
        /**
         * Use this method only in conjunction with incCachedFontTextureCounter, call it when you no longer need to use this shared resource.
         */
        decCachedFontTextureCounter(): void;
    }
    function BitmapFontLoaderPlugin(fileExtension: string, plugin: IBitmapFontLoader): (target: Object) => void;
}

declare module BABYLON {
    /**
     * Stores 2D Bounding Information.
     * This class handles a circle area and a bounding rectangle one.
     */
    class BoundingInfo2D {
        /**
         * The coordinate of the center of the bounding info
         */
        center: Vector2;
        /**
         * The radius of the bounding circle, from the center of the bounded object
         */
        radius: number;
        /**
         * The extent of the bounding rectangle, from the center of the bounded object.
         * This is an absolute value in both X and Y of the vector which describe the right/top corner of the rectangle, you can easily reconstruct the whole rectangle by negating X &| Y.
         */
        extent: Vector2;
        constructor();
        /**
         * Create a BoundingInfo2D object from a given size
         * @param size the size that will be used to set the extend, radius will be computed from it.
         */
        static CreateFromSize(size: Size): BoundingInfo2D;
        /**
         * Create a BoundingInfo2D object from a given radius
         * @param radius the radius to use, the extent will be computed from it.
         */
        static CreateFromRadius(radius: number): BoundingInfo2D;
        /**
         * Create a BoundingInfo2D object from a list of points.
         * The resulted object will be the smallest bounding area that includes all the given points.
         * @param points an array of points to compute the bounding object from.
         */
        static CreateFromPoints(points: Vector2[]): BoundingInfo2D;
        /**
         * Update a BoundingInfo2D object using the given Size as input
         * @param size the bounding data will be computed from this size.
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        static CreateFromSizeToRef(size: Size, b: BoundingInfo2D): void;
        /**
         * Update a BoundingInfo2D object using the given radius as input
         * @param radius the bounding data will be computed from this radius
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        static CreateFromRadiusToRef(radius: number, b: BoundingInfo2D): void;
        /**
         * Update a BoundingInfo2D object using the given points array as input
         * @param points the point array to use to update the bounding data
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        static CreateFromPointsToRef(points: Vector2[], b: BoundingInfo2D): void;
        /**
         * Update a BoundingInfo2D object using the given min/max values as input
         * @param xmin the smallest x coordinate
         * @param xmax the biggest x coordinate
         * @param ymin the smallest y coordinate
         * @param ymax the buggest y coordinate
         * @param b must be a valid/allocated object, it will contain the result of the operation
         */
        static CreateFromMinMaxToRef(xmin: number, xmax: number, ymin: number, ymax: number, b: BoundingInfo2D): void;
        toString(): string;
        /**
         * Duplicate this instance and return a new one
         * @return the duplicated instance
         */
        clone(): BoundingInfo2D;
        clear(): void;
        copyFrom(src: BoundingInfo2D): void;
        equals(other: BoundingInfo2D): boolean;
        /**
         * return the max extend of the bounding info
         */
        max(): Vector2;
        /**
         * return the min/max extend of the bounding info.
         * x, y, z, w are left, bottom, right and top
         */
        minMax(): Vector4;
        /**
         * Update a vector2 with the max extend of the bounding info
         * @param result must be a valid/allocated vector2 that will contain the result of the operation
         */
        maxToRef(result: Vector2): void;
        /**
         * Update a vector4 with the min/max extend of the bounding info
         * x, y, z, w are left, bottom, right and top
         * @param result must be a valid/allocated vector4 that will contain the result of the operation
         */
        minMaxToRef(result: Vector4): void;
        /**
         * Return the size of the boundingInfo rect surface
         */
        size(): Size;
        /**
         * Stores in the result object the size of the boundingInfo rect surface
         * @param result
         */
        sizeToRef(result: Size): void;
        /**
         * Inflate the boundingInfo with the given vector
         * @param offset the extent will be incremented with offset and the radius will be computed again
         */
        inflate(offset: Vector2): void;
        /**
         * Apply a transformation matrix to this BoundingInfo2D and return a new instance containing the result
         * @param matrix the transformation matrix to apply
         * @return the new instance containing the result of the transformation applied on this BoundingInfo2D
         */
        transform(matrix: Matrix2D): BoundingInfo2D;
        /**
         * Compute the union of this BoundingInfo2D with a given one, returns a new BoundingInfo2D as a result
         * @param other the second BoundingInfo2D to compute the union with this one
         * @return a new instance containing the result of the union
         */
        union(other: BoundingInfo2D): BoundingInfo2D;
        worldAABBIntersectionTest(other: BoundingInfo2D): boolean;
        private static _transform;
        /**
         * Transform this BoundingInfo2D with a given matrix and store the result in an existing BoundingInfo2D instance.
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param matrix The matrix to use to compute the transformation
         * @param result A VALID (i.e. allocated) BoundingInfo2D object where the result will be stored
         */
        transformToRef(matrix: Matrix2D, result: BoundingInfo2D): void;
        private _updateWorldAABB(worldMatrix);
        worldMatrixAccess: () => Matrix2D;
        readonly worldAABBDirtyObservable: Observable<BoundingInfo2D>;
        readonly isWorldAABBDirty: boolean;
        dirtyWorldAABB(): void;
        /**
         * Retrieve the world AABB, the Vector4's data is x=xmin, y=ymin, z=xmax, w=ymax
         */
        readonly worldAABB: Vector4;
        /**
         * Compute the union of this BoundingInfo2D with another one and store the result in a third valid BoundingInfo2D object
         * This is a GC friendly version, try to use it as much as possible, specially if your transformation is inside a loop, allocate the result object once for good outside of the loop and use it every time.
         * @param other the second object used to compute the union
         * @param result a VALID BoundingInfo2D instance (i.e. allocated) where the result will be stored
         */
        unionToRef(other: BoundingInfo2D, result: BoundingInfo2D): void;
        /**
         * Check if the given point is inside the BoundingInfo.
         * The test is first made on the radius, then inside the rectangle described by the extent
         * @param pickPosition the position to test
         * @return true if the point is inside, false otherwise
         */
        doesIntersect(pickPosition: Vector2): boolean;
        private _worldAABBDirtyObservable;
        private _worldAABBDirty;
        private _worldAABB;
    }
}

declare module BABYLON {
    /**
     * The base class for all implementation of a Primitive Collision Manager
     */
    abstract class PrimitiveCollisionManagerBase {
        constructor(owner: Canvas2D);
        abstract _addActor(actor: Prim2DBase, deep: boolean): ActorInfoBase;
        abstract _removeActor(actor: Prim2DBase): any;
        abstract _update(): any;
        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the left border
         */
        readonly abstract leftBorderIntersectedActors: ObservableStringDictionary<Prim2DBase>;
        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the bottom border
         */
        readonly abstract bottomBorderIntersectedActors: ObservableStringDictionary<Prim2DBase>;
        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the right border
         */
        readonly abstract rightBorderIntersectedActors: ObservableStringDictionary<Prim2DBase>;
        /**
         * If collisionManagerUseBorders is true during the Canvas creation, this dictionary contains all the primitives intersecting with the top border
         */
        readonly abstract topBorderIntersectedActors: ObservableStringDictionary<Prim2DBase>;
        /**
         * This dictionary contains all the couple of intersecting primitives
         */
        readonly abstract intersectedActors: ObservableStringDictionary<{
            a: Prim2DBase;
            b: Prim2DBase;
        }>;
        /**
         * Renders the World AABB of all Actors
         */
        abstract debugRenderAABB: boolean;
        /**
         * Renders the area of the Clusters
         */
        abstract debugRenderClusters: boolean;
        /**
         * Display stats about the PCM on screen
         */
        abstract debugStats: boolean;
        static allocBasicPCM(owner: Canvas2D, enableBorders: boolean): PrimitiveCollisionManagerBase;
        protected _owner: Canvas2D;
    }
    /**
     * Base class of an Actor
     */
    abstract class ActorInfoBase {
        /**
         * Access the World AABB of the Actor, the vector4 is x:left, y: bottom, z: right, w: top
         */
        readonly abstract worldAABB: Vector4;
        /**
         * Return true if the actor is enable, false otherwise
         */
        readonly abstract isEnabled: boolean;
        /**
         * Return true is the actor boundingInfo is use, false if its levelBoundingInfo is used.
         */
        readonly abstract isDeep: boolean;
        /**
         * Return the primitive of the actor
         */
        readonly abstract prim: Prim2DBase;
        /**
         * Return a dictionary containing all the actors intersecting with this one
         */
        readonly abstract intersectWith: ObservableStringDictionary<ActorInfoBase>;
    }
}

declare module BABYLON {
    interface ILayoutData {
    }
    class LayoutEngineBase implements ILockable {
        constructor();
        updateLayout(prim: Prim2DBase): void;
        readonly isChildPositionAllowed: boolean;
        isLocked(): boolean;
        lock(): boolean;
        layoutDirtyOnPropertyChangedMask: any;
        private _isLocked;
    }
    class CanvasLayoutEngine extends LayoutEngineBase {
        private static _singleton;
        static readonly Singleton: CanvasLayoutEngine;
        constructor();
        updateLayout(prim: Prim2DBase): void;
        private _doUpdate(prim);
        readonly isChildPositionAllowed: boolean;
    }
    class StackPanelLayoutEngine extends LayoutEngineBase {
        constructor();
        static readonly Horizontal: StackPanelLayoutEngine;
        static readonly Vertical: StackPanelLayoutEngine;
        private static _horizontal;
        private static _vertical;
        isHorizontal: boolean;
        private _isHorizontal;
        private static stackPanelLayoutArea;
        private static dstOffset;
        private static dstArea;
        private static computeCounter;
        updateLayout(prim: Prim2DBase): void;
        readonly isChildPositionAllowed: boolean;
    }
    /**
     * GridData is used specify what row(s) and column(s) a primitive is placed in when its parent is using a Grid Panel Layout.
     */
    class GridData implements ILayoutData {
        /**
         * the row number of the grid
         **/
        row: number;
        /**
         * the column number of the grid
         **/
        column: number;
        /**
         * the number of rows a primitive will occupy
         **/
        rowSpan: number;
        /**
         * the number of columns a primitive will occupy
         **/
        columnSpan: number;
        /**
         * Create a Grid Data that describes where a primitive will be placed in a Grid Panel Layout.
         * @param row the row number of the grid
         * @param column the column number of the grid
         * @param rowSpan the number of rows a primitive will occupy
         * @param columnSpan the number of columns a primitive will occupy
         **/
        constructor(row: number, column: number, rowSpan?: number, columnSpan?: number);
    }
    class GridPanelLayoutEngine extends LayoutEngineBase {
        constructor(settings: {
            rows: [{
                height: string;
            }];
            columns: [{
                width: string;
            }];
        });
        private _rows;
        private _columns;
        private _children;
        private _rowBottoms;
        private _columnLefts;
        private _rowHeights;
        private _columnWidths;
        private static dstOffset;
        private static dstArea;
        private static dstAreaPos;
        updateLayout(prim: Prim2DBase): void;
        readonly isChildPositionAllowed: boolean;
        private _getMaxChildHeightInRow(rowNum);
        private _getMaxChildWidthInColumn(colNum);
        private _updateGrid(prim);
    }
}

declare module BABYLON {
    /**
     * This interface is used to implement a lockable instance pattern.
     * Classes that implements it may be locked at any time, making their content immutable from now on.
     * You also can query if a given instance is locked or not.
     * This allow instances to be shared among several 'consumers'.
     */
    interface ILockable {
        /**
         * Query the lock state
         * @returns returns true if the object is locked and immutable, false if it's not
         */
        isLocked(): boolean;
        /**
         * A call to this method will definitely lock the instance, making its content immutable
         * @returns the previous lock state of the object. so if true is returned the object  were already locked and this method does nothing, if false is returned it means the object wasn't locked and this call locked it for good.
         */
        lock(): boolean;
    }
    /**
     * This interface defines the IBrush2D contract.
     * Classes implementing a new type of Brush2D must implement this interface
     */
    interface IBrush2D extends ILockable {
        /**
         * Define if the brush will use transparency / alpha blending
         * @returns true if the brush use transparency
         */
        isTransparent(): boolean;
        /**
         * It is critical for each instance of a given Brush2D type to return a unique string that identifies it because the Border instance will certainly be part of the computed ModelKey for a given Primitive
         * @returns A string identifier that uniquely identify the instance
         */
        toString(): string;
    }
    /**
     * Base class implementing the ILocable interface.
     * The particularity of this class is to call the protected onLock() method when the instance is about to be locked for good.
     */
    class LockableBase implements ILockable {
        isLocked(): boolean;
        private _isLocked;
        lock(): boolean;
        /**
         * Protected handler that will be called when the instance is about to be locked.
         */
        protected onLock(): void;
    }
    class SolidColorBrush2D extends LockableBase implements IBrush2D {
        constructor(color: Color4, lock?: boolean);
        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        isTransparent(): boolean;
        /**
         * The color used by this instance to render
         * @returns the color object. Note that it's not a clone of the actual object stored in the instance so you MUST NOT modify it, otherwise unexpected behavior might occurs.
         */
        color: Color4;
        /**
         * Return a unique identifier of the instance, which is simply the hexadecimal representation (CSS Style) of the solid color.
         */
        toString(): string;
        private _color;
    }
    class GradientColorBrush2D extends LockableBase implements IBrush2D {
        constructor(color1: Color4, color2: Color4, translation?: Vector2, rotation?: number, scale?: number, lock?: boolean);
        /**
         * Return true if the brush is transparent, false if it's totally opaque
         */
        isTransparent(): boolean;
        /**
         * First color, the blend will start from this color
         */
        color1: Color4;
        /**
         * Second color, the blend will end to this color
         */
        color2: Color4;
        /**
         * Translation vector to apply on the blend
         * Default is [0;0]
         */
        translation: Vector2;
        /**
         * Rotation in radian to apply to the brush
         * Default direction of the brush is vertical, you can change this using this property.
         * Default is 0.
         */
        rotation: number;
        /**
         * Scale factor to apply to the gradient.
         * Default is 1: no scale.
         */
        scale: number;
        /**
         * Return a string describing the brush
         */
        toString(): string;
        /**
         * Build a unique key string for the given parameters
         */
        static BuildKey(color1: Color4, color2: Color4, translation: Vector2, rotation: number, scale: number): string;
        private _color1;
        private _color2;
        private _translation;
        private _rotation;
        private _scale;
    }
}

declare module BABYLON {
    class Prim2DClassInfo {
    }
    class Prim2DPropInfo {
        static PROPKIND_MODEL: number;
        static PROPKIND_INSTANCE: number;
        static PROPKIND_DYNAMIC: number;
        id: number;
        flagId: number;
        kind: number;
        name: string;
        dirtyBoundingInfo: boolean;
        dirtyParentBoundingInfo: boolean;
        typeLevelCompare: boolean;
        bindingMode: number;
        bindingUpdateSourceTrigger: number;
    }
    class ClassTreeInfo<TClass, TProp> {
        constructor(baseClass: ClassTreeInfo<TClass, TProp>, type: Object, classContentFactory: (base: TClass) => TClass);
        readonly classContent: TClass;
        readonly type: Object;
        readonly levelContent: StringDictionary<TProp>;
        readonly fullContent: StringDictionary<TProp>;
        getLevelOf(type: Object): ClassTreeInfo<TClass, TProp>;
        getOrAddType(baseType: Object, type: Object): ClassTreeInfo<TClass, TProp>;
        static get<TClass, TProp>(type: Object): ClassTreeInfo<TClass, TProp>;
        static getOrRegister<TClass, TProp>(type: Object, classContentFactory: (base: TClass) => TClass): ClassTreeInfo<TClass, TProp>;
        private _type;
        private _classContent;
        private _baseClass;
        private _subClasses;
        private _levelContent;
        private _fullContent;
        private _classContentFactory;
    }
    class DataBinding {
        /**
         * Use the mode specified in the SmartProperty declaration
         */
        static MODE_DEFAULT: number;
        /**
         * Update the binding target only once when the Smart Property's value is first accessed
         */
        static MODE_ONETIME: number;
        /**
         * Update the smart property when the source changes.
         * The source won't be updated if the smart property value is set.
         */
        static MODE_ONEWAY: number;
        /**
         * Only update the source when the target's data is changing.
         */
        static MODE_ONEWAYTOSOURCE: number;
        /**
         * Update the bind target when the source changes and update the source when the Smart Property value is set.
         */
        static MODE_TWOWAY: number;
        /**
         * Use the Update Source Trigger defined in the SmartProperty declaration
         */
        static UPDATESOURCETRIGGER_DEFAULT: number;
        /**
         * Update the source as soon as the Smart Property has a value change
         */
        static UPDATESOURCETRIGGER_PROPERTYCHANGED: number;
        /**
         * Update the source when the binding target loses focus
         */
        static UPDATESOURCETRIGGER_LOSTFOCUS: number;
        /**
         * Update the source will be made by explicitly calling the UpdateFromDataSource method
         */
        static UPDATESOURCETRIGGER_EXPLICIT: number;
        constructor();
        /**
         * Provide a callback that will convert the value obtained by the Data Binding to the type of the SmartProperty it's bound to.
         * If no value are set, then it's assumed that the sourceValue is of the same type as the SmartProperty's one.
         * If the SmartProperty type is a basic data type (string, boolean or number) and no converter is specified but the sourceValue is of a different type, the conversion will be implicitly made, if possible.
         * @param sourceValue the source object retrieve by the Data Binding mechanism
         * @returns the object of a compatible type with the SmartProperty it's bound to
         */
        converter: (sourceValue: any) => any;
        /**
         * Set the mode to use for the data flow in the binding. Set one of the MODE_xxx static member of this class. If not specified then MODE_DEFAULT will be used
         */
        mode: number;
        /**
         * You can override the Data Source object with this member which is the Id of a uiElement existing in the UI Logical tree.
         * If not set and source no set too, then the dataSource property will be used.
         */
        uiElementId: string;
        /**
         * You can override the Data Source object with this member which is the source object to use directly.
         * If not set and uiElement no set too, then the dataSource property of the SmartPropertyBase object will be used.
         */
        dataSource: IPropertyChanged;
        /**
         * The path & name of the property to get from the source object.
         * Once the Source object is evaluated (it's either the one got from uiElementId, source or dataSource) you can specify which property of this object is the value to bind to the smartProperty.
         * If nothing is set then the source object will be used.
         * You can specify an indirect property using the format "firstProperty.indirectProperty" like "address.postalCode" if the source is a Customer object which contains an address property and the Address class contains a postalCode property.
         * If the property is an Array and you want to address a particular element then use the 'arrayProperty[index]' notation. For example "phoneNumbers[0]" to get the first element of the phoneNumber property which is an array.
         */
        propertyPathName: string;
        /**
         * If the Smart Property is of the string type, you can use the string interpolation notation to provide how the sourceValue will be formatted, reference to the source value must be made via the token: ${value}. For instance `Customer Name: ${value}`
         */
        stringFormat: (value: any) => string;
        /**
         * Specify how the source should be updated, use one of the UPDATESOURCETRIGGER_xxx member of this class, if not specified then UPDATESOURCETRIGGER_DEFAULT will be used.
         */
        updateSourceTrigger: number;
        canUpdateTarget(resetUpdateCounter: boolean): boolean;
        updateTarget(): void;
        _storeBoundValue(watcher: SmartPropertyBase, value: any): void;
        private _getActualDataSource();
        _registerDataSource(updateTarget: boolean): void;
        _unregisterDataSource(): void;
        /**
         * The PropInfo of the property the binding is bound to
         */
        _boundTo: Prim2DPropInfo;
        _owner: SmartPropertyBase;
        private _converter;
        private _mode;
        private _uiElementId;
        private _dataSource;
        _currentDataSource: IPropertyChanged;
        private _propertyPathName;
        private _stringFormat;
        private _updateSourceTrigger;
        private _updateCounter;
    }
    abstract class SmartPropertyBase extends PropertyChangedBase {
        constructor();
        readonly disposeObservable: Observable<SmartPropertyBase>;
        /**
         * Check if the object is disposed or not.
         * @returns true if the object is dispose, false otherwise.
         */
        readonly isDisposed: boolean;
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        dispose(): boolean;
        /**
         * Check if a given set of properties are dirty or not.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return true if at least one property is dirty, false if none of them are.
         */
        checkPropertiesDirty(flags: number): boolean;
        /**
         * Clear a given set of properties.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return the new set of property still marked as dirty
         */
        protected clearPropertiesDirty(flags: number): number;
        _resetPropertiesDirty(): void;
        /**
         * Add an externally attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        addExternalData<T>(key: string, data: T): boolean;
        /**
         * Get an externally attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        getExternalData<T>(key: string): T;
        /**
         * Get an externally attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T;
        /**
         * Remove an externally attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        removeExternalData(key: any): boolean;
        static _hookProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, kind: number, settings?: {
            bindingMode?: number;
            bindingUpdateSourceTrigger?: number;
            typeLevelCompare?: boolean;
            dirtyBoundingInfo?: boolean;
            dirtyParentBoundingBox?: boolean;
        }): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
        private static _createPropInfo(target, propName, propId, kind, settings);
        /**
         * Access the dictionary of properties metadata. Only properties decorated with XXXXLevelProperty are concerned
         * @returns the dictionary, the key is the property name as declared in Javascript, the value is the metadata object
         */
        protected readonly propDic: StringDictionary<Prim2DPropInfo>;
        private static _checkUnchanged(curValue, newValue);
        private static propChangedInfo;
        private static propChangeGuarding;
        protected _handlePropChanged<T>(curValue: T, newValue: T, propName: string, propInfo: Prim2DPropInfo, typeLevelCompare: boolean): void;
        protected _triggerPropertyChanged(propInfo: Prim2DPropInfo, newValue: any): void;
        /**
         * Set the object from which Smart Properties using Binding will take/update their data from/to.
         * When the object is part of a graph (with parent/children relationship) if the dataSource of a given instance is not specified, then the parent's one is used.
         */
        dataSource: IPropertyChanged;
        protected _getDataSource(): IPropertyChanged;
        createSimpleDataBinding(propInfo: Prim2DPropInfo, propertyPathName: string, mode?: number): DataBinding;
        createDataBinding(propInfo: Prim2DPropInfo, binding: DataBinding): DataBinding;
        removeDataBinding(propInfo: Prim2DPropInfo): boolean;
        updateFromDataSource(): void;
        private _dataSource;
        private _dataSourceObserver;
        private _isDisposed;
        private _externalData;
        protected _instanceDirtyFlags: number;
        private _propInfo;
        _bindings: Array<DataBinding>;
        private _hasBinding;
        private _bindingSourceChanged;
        private _disposeObservable;
    }
    abstract class SmartPropertyPrim extends SmartPropertyBase {
        static SMARTPROPERTYPRIM_PROPCOUNT: number;
        constructor();
        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        dispose(): boolean;
        /**
         * Animation array, more info: http://doc.babylonjs.com/tutorials/Animations
         */
        animations: Animation[];
        /**
         * return a unique identifier for the Canvas2D
         */
        readonly uid: string;
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        getAnimatables(): IAnimatable[];
        /**
         * Property giving the Model Key associated to the property.
         * This value is constructed from the type of the primitive and all the name/value of its properties declared with the modelLevelProperty decorator
         * @returns the model key string.
         */
        readonly modelKey: string;
        /**
         * States if the Primitive is dirty and should be rendered again next time.
         * @returns true is dirty, false otherwise
         */
        readonly isDirty: boolean;
        protected _boundingBoxDirty(): void;
        protected _handlePropChanged<T>(curValue: T, newValue: T, propName: string, propInfo: Prim2DPropInfo, typeLevelCompare: boolean): void;
        protected onPrimitivePropertyDirty(propFlagId: number): void;
        protected handleGroupChanged(prop: Prim2DPropInfo): void;
        _resetPropertiesDirty(): void;
        /**
         * Retrieve the boundingInfo for this Primitive, computed based on the primitive itself and NOT its children
         */
        readonly levelBoundingInfo: BoundingInfo2D;
        /**
         * This method must be overridden by a given Primitive implementation to compute its boundingInfo
         */
        protected updateLevelBoundingInfo(): boolean;
        /**
         * Property method called when the Primitive becomes dirty
         */
        protected onPrimBecomesDirty(): void;
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        _isFlagSet(flag: number): boolean;
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        _areAllFlagsSet(flags: number): boolean;
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        _areSomeFlagsSet(flags: number): boolean;
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        _clearFlags(flags: number): void;
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        _setFlags(flags: number): number;
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        _changeFlags(flags: number, state: boolean): void;
        _getFlagsDebug(flags: number): string;
        static flagNoPartOfLayout: number;
        static flagLevelBoundingInfoDirty: number;
        static flagModelDirty: number;
        static flagLayoutDirty: number;
        static flagLevelVisible: number;
        static flagBoundingInfoDirty: number;
        static flagIsPickable: number;
        static flagIsVisible: number;
        static flagVisibilityChanged: number;
        static flagPositioningDirty: number;
        static flagTrackedGroup: number;
        static flagWorldCacheChanged: number;
        static flagChildrenFlatZOrder: number;
        static flagZOrderDirty: number;
        static flagActualOpacityDirty: number;
        static flagPrimInDirtyList: number;
        static flagIsContainer: number;
        static flagNeedRefresh: number;
        static flagActualScaleDirty: number;
        static flagDontInheritParentScale: number;
        static flagGlobalTransformDirty: number;
        static flagLayoutBoundingInfoDirty: number;
        static flagCollisionActor: number;
        static flagModelUpdate: number;
        static flagLocalTransformDirty: number;
        static flagUsePositioning: number;
        static flagComputingPositioning: number;
        static flagAlignPrimitive: number;
        private _uid;
        private _flags;
        private _modelKey;
        protected _levelBoundingInfo: BoundingInfo2D;
        protected _boundingInfo: BoundingInfo2D;
        protected _layoutBoundingInfo: BoundingInfo2D;
    }
    function dependencyProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, mode?: number, updateSourceTrigger?: number): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
    function modelLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare?: boolean, dirtyBoundingInfo?: boolean, dirtyParentBoundingBox?: boolean): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
    function instanceLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare?: boolean, dirtyBoundingInfo?: boolean, dirtyParentBoundingBox?: boolean): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
    function dynamicLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare?: boolean, dirtyBoundingInfo?: boolean, dirtyParentBoundingBox?: boolean): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
}

declare module BABYLON {
    class PrepareRender2DContext {
        constructor();
        /**
         * True if the primitive must be refreshed no matter what
         * This mode is needed because sometimes the primitive doesn't change by itself, but external changes make a refresh of its InstanceData necessary
         */
        forceRefreshPrimitive: boolean;
    }
    class Render2DContext {
        constructor(renderMode: number);
        /**
         * Define which render Mode should be used to render the primitive: one of Render2DContext.RenderModeXxxx property
         */
        readonly renderMode: number;
        /**
         * If true hardware instancing is supported and must be used for the rendering. The groupInfoPartData._partBuffer must be used.
         * If false rendering on a per primitive basis must be made. The following properties must be used
         *  - groupInfoPartData._partData: contains the primitive instances data to render
         *  - partDataStartIndex: the index into instanceArrayData of the first instance to render.
         *  - partDataCount: the number of primitive to render
         */
        useInstancing: boolean;
        /**
         * If specified, must take precedence from the groupInfoPartData. partIndex is the same as groupInfoPardData
         */
        instancedBuffers: WebGLBuffer[];
        /**
         * To use when instancedBuffers is specified, gives the count of instances to draw
         */
        instancesCount: number;
        /**
         * Contains the data related to the primitives instances to render
         */
        groupInfoPartData: GroupInfoPartData[];
        /**
         * The index into groupInfoPartData._partData of the first primitive to render. This is an index, not an offset: it represent the nth primitive which is the first to render.
         */
        partDataStartIndex: number;
        /**
         * The exclusive end index, you have to render the primitive instances until you reach this one, but don't render this one!
         */
        partDataEndIndex: number;
        /**
         * The set of primitives to render is opaque.
         * This is the first rendering pass. All Opaque primitives are rendered. Depth Compare and Write are both enabled.
         */
        static readonly RenderModeOpaque: number;
        /**
         * The set of primitives to render is using Alpha Test (aka masking).
         * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeOpaque and is depth independent (i.e. primitives are not sorted by depth). Depth Compare and Write are both enabled.
         */
        static readonly RenderModeAlphaTest: number;
        /**
         * The set of primitives to render is transparent.
         * Alpha Blend is enabled, the AlphaMode must be manually set, the render occurs after the RenderModeAlphaTest and is depth dependent (i.e. primitives are stored by depth and rendered back to front). Depth Compare is on, but Depth write is Off.
         */
        static readonly RenderModeTransparent: number;
        private static _renderModeOpaque;
        private static _renderModeAlphaTest;
        private static _renderModeTransparent;
        private _renderMode;
    }
    /**
     * This class store information for the pointerEventObservable Observable.
     * The Observable is divided into many sub events (using the Mask feature of the Observable pattern): PointerOver, PointerEnter, PointerDown, PointerMouseWheel, PointerMove, PointerUp, PointerDown, PointerLeave, PointerGotCapture and PointerLostCapture.
     */
    class PrimitivePointerInfo {
        private static _pointerOver;
        private static _pointerEnter;
        private static _pointerDown;
        private static _pointerMouseWheel;
        private static _pointerMove;
        private static _pointerUp;
        private static _pointerOut;
        private static _pointerLeave;
        private static _pointerGotCapture;
        private static _pointerLostCapture;
        private static _mouseWheelPrecision;
        /**
         * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive.
         * Bubbles: yes
         */
        static readonly PointerOver: number;
        /**
         * This event type is raised when a pointing device is moved into the hit test boundaries of a primitive or one of its descendants.
         * Bubbles: no
         */
        static readonly PointerEnter: number;
        /**
         * This event type is raised when a pointer enters the active button state (non-zero value in the buttons property). For mouse it's when the device transitions from no buttons depressed to at least one button depressed. For touch/pen this is when a physical contact is made.
         * Bubbles: yes
         */
        static readonly PointerDown: number;
        /**
         * This event type is raised when the pointer is a mouse and it's wheel is rolling
         * Bubbles: yes
         */
        static readonly PointerMouseWheel: number;
        /**
         * This event type is raised when a pointer change coordinates or when a pointer changes button state, pressure, tilt, or contact geometry and the circumstances produce no other pointers events.
         * Bubbles: yes
         */
        static readonly PointerMove: number;
        /**
         * This event type is raised when the pointer leaves the active buttons states (zero value in the buttons property). For mouse, this is when the device transitions from at least one button depressed to no buttons depressed. For touch/pen, this is when physical contact is removed.
         * Bubbles: yes
         */
        static readonly PointerUp: number;
        /**
         * This event type is raised when a pointing device is moved out of the hit test the boundaries of a primitive.
         * Bubbles: yes
         */
        static readonly PointerOut: number;
        /**
         * This event type is raised when a pointing device is moved out of the hit test boundaries of a primitive and all its descendants.
         * Bubbles: no
         */
        static readonly PointerLeave: number;
        /**
         * This event type is raised when a primitive receives the pointer capture. This event is fired at the element that is receiving pointer capture. Subsequent events for that pointer will be fired at this element.
         * Bubbles: yes
         */
        static readonly PointerGotCapture: number;
        /**
         * This event type is raised after pointer capture is released for a pointer.
         * Bubbles: yes
         */
        static readonly PointerLostCapture: number;
        static readonly MouseWheelPrecision: number;
        /**
         * Event Type, one of the static PointerXXXX property defined above (PrimitivePointerInfo.PointerOver to PrimitivePointerInfo.PointerLostCapture)
         */
        eventType: number;
        /**
         * Position of the pointer relative to the bottom/left of the Canvas
         */
        canvasPointerPos: Vector2;
        /**
         * Position of the pointer relative to the bottom/left of the primitive that registered the Observer
         */
        primitivePointerPos: Vector2;
        /**
         * The primitive where the event was initiated first (in case of bubbling)
         */
        relatedTarget: Prim2DBase;
        /**
         * Position of the pointer relative to the bottom/left of the relatedTarget
         */
        relatedTargetPointerPos: Vector2;
        /**
         * An observable can set this property to true to stop bubbling on the upper levels
         */
        cancelBubble: boolean;
        /**
         * True if the Control keyboard key is down
         */
        ctrlKey: boolean;
        /**
         * true if the Shift keyboard key is down
         */
        shiftKey: boolean;
        /**
         * true if the Alt keyboard key is down
         */
        altKey: boolean;
        /**
         * true if the Meta keyboard key is down
         */
        metaKey: boolean;
        /**
         * For button, buttons, refer to https://www.w3.org/TR/pointerevents/#button-states
         */
        button: number;
        /**
         * For button, buttons, refer to https://www.w3.org/TR/pointerevents/#button-states
         */
        buttons: number;
        /**
         * The amount of mouse wheel rolled
         */
        mouseWheelDelta: number;
        /**
         * Id of the Pointer involved in the event
         */
        pointerId: number;
        width: number;
        height: number;
        presssure: number;
        tilt: Vector2;
        /**
         * true if the involved pointer is captured for a particular primitive, false otherwise.
         */
        isCaptured: boolean;
        constructor();
        updateRelatedTarget(prim: Prim2DBase, primPointerPos: Vector2): void;
        static getEventTypeName(mask: number): string;
    }
    /**
     * Defines the horizontal and vertical alignment information for a Primitive.
     */
    class PrimitiveAlignment {
        constructor(changeCallback?: () => void);
        /**
         * Alignment is made relative to the left edge of the Primitive. Valid for horizontal alignment only.
         */
        static readonly AlignLeft: number;
        /**
         * Alignment is made relative to the top edge of the Primitive. Valid for vertical alignment only.
         */
        static readonly AlignTop: number;
        /**
         * Alignment is made relative to the right edge of the Primitive. Valid for horizontal alignment only.
         */
        static readonly AlignRight: number;
        /**
         * Alignment is made relative to the bottom edge of the Primitive. Valid for vertical alignment only.
         */
        static readonly AlignBottom: number;
        /**
         * Alignment is made to center the content from equal distance to the opposite edges of the Primitive
         */
        static readonly AlignCenter: number;
        /**
         * The content is stretched toward the opposite edges of the Primitive
         */
        static readonly AlignStretch: number;
        private static _AlignLeft;
        private static _AlignTop;
        private static _AlignRight;
        private static _AlignBottom;
        private static _AlignCenter;
        private static _AlignStretch;
        /**
         * Get/set the horizontal alignment. Use one of the AlignXXX static properties of this class
         */
        horizontal: number;
        /**
         * Get/set the vertical alignment. Use one of the AlignXXX static properties of this class
         */
        vertical: number;
        private onChangeCallback();
        private _changedCallback;
        private _horizontal;
        private _vertical;
        /**
         * Set the horizontal alignment from a string value.
         * @param text can be either: 'left','right','center','stretch'
         */
        setHorizontal(text: string): void;
        /**
         * Set the vertical alignment from a string value.
         * @param text can be either: 'top','bottom','center','stretch'
         */
        setVertical(text: string): void;
        /**
         * Set the horizontal and or vertical alignments from a string value.
         * @param text can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        fromString(value: string): void;
        copyFrom(pa: PrimitiveAlignment): void;
        clone(): PrimitiveAlignment;
        readonly isDefault: boolean;
    }
    /**
     * Stores information about a Primitive that was intersected
     */
    class PrimitiveIntersectedInfo {
        prim: Prim2DBase;
        intersectionLocation: Vector2;
        constructor(prim: Prim2DBase, intersectionLocation: Vector2);
    }
    /**
     * Define a thickness toward every edges of a Primitive to allow margin and padding.
     * The thickness can be expressed as pixels, percentages, inherit the value of the parent primitive or be auto.
     */
    class PrimitiveThickness {
        constructor(parentAccess: () => PrimitiveThickness, changedCallback?: () => void);
        /**
         * Set the thickness from a string value
         * @param thickness format is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        fromString(thickness: string): void;
        /**
         * Set the thickness from multiple string
         * Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         * @param top the top thickness to set
         * @param left the left thickness to set
         * @param right the right thickness to set
         * @param bottom the bottom thickness to set
         */
        fromStrings(top: string, left: string, right: string, bottom: string): PrimitiveThickness;
        /**
         * Set the thickness from pixel values
         * @param top the top thickness in pixels to set
         * @param left the left thickness in pixels to set
         * @param right the right thickness in pixels to set
         * @param bottom the bottom thickness in pixels to set
         */
        fromPixels(top: number, left: number, right: number, bottom: number): PrimitiveThickness;
        /**
         * Apply the same pixel value to all edges
         * @param margin the value to set, in pixels.
         */
        fromUniformPixels(margin: number): PrimitiveThickness;
        copyFrom(pt: PrimitiveThickness): void;
        /**
         * Set all edges in auto
         */
        auto(): PrimitiveThickness;
        private _clear();
        private _extractString(value, emitChanged);
        private _setStringValue(value, index, emitChanged);
        private _setPixels(value, index, emitChanged);
        private _setPercentage(value, index, emitChanged);
        private _getStringValue(index);
        private _isType(index, type);
        private _getType(index, processInherit);
        private _setType(index, type);
        setTop(value: number | string): void;
        setLeft(value: number | string): void;
        setRight(value: number | string): void;
        setBottom(value: number | string): void;
        /**
         * Get/set the top thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        top: string;
        /**
         * Get/set the left thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        left: string;
        /**
         * Get/set the right thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        right: string;
        /**
         * Get/set the bottom thickness. Possible values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        bottom: string;
        /**
         * Get/set the top thickness in pixel.
         */
        topPixels: number;
        /**
         * Get/set the left thickness in pixel.
         */
        leftPixels: number;
        /**
         * Get/set the right thickness in pixel.
         */
        rightPixels: number;
        /**
         * Get/set the bottom thickness in pixel.
         */
        bottomPixels: number;
        /**
         * Get/set the top thickness in percentage.
         * The get will return a valid value only if the edge type is percentage.
         * The Set will change the edge mode if needed
         */
        topPercentage: number;
        /**
         * Get/set the left thickness in percentage.
         * The get will return a valid value only if the edge mode is percentage.
         * The Set will change the edge mode if needed
         */
        leftPercentage: number;
        /**
         * Get/set the right thickness in percentage.
         * The get will return a valid value only if the edge mode is percentage.
         * The Set will change the edge mode if needed
         */
        rightPercentage: number;
        /**
         * Get/set the bottom thickness in percentage.
         * The get will return a valid value only if the edge mode is percentage.
         * The Set will change the edge mode if needed
         */
        bottomPercentage: number;
        /**
         * Get/set the top mode. The setter shouldn't be used, other setters with value should be preferred
         */
        topMode: number;
        /**
         * Get/set the left mode. The setter shouldn't be used, other setters with value should be preferred
         */
        leftMode: number;
        /**
         * Get/set the right mode. The setter shouldn't be used, other setters with value should be preferred
         */
        rightMode: number;
        /**
         * Get/set the bottom mode. The setter shouldn't be used, other setters with value should be preferred
         */
        bottomMode: number;
        readonly isDefault: boolean;
        private _parentAccess;
        private _changedCallback;
        private _pixels;
        private _percentages;
        private _flags;
        static Auto: number;
        static Inherit: number;
        static Percentage: number;
        static Pixel: number;
        static ComputeH: number;
        static ComputeV: number;
        static ComputeAll: number;
        private _computePixels(index, sourceArea, emitChanged);
        private onChangeCallback();
        /**
         * Compute the positioning/size of an area considering the thickness of this object and a given alignment
         * @param sourceArea the source area where the content must be sized/positioned
         * @param contentSize the content size to position/resize
         * @param alignment the alignment setting
         * @param dstOffset the position of the content, x, y, z, w are left, bottom, right, top
         * @param dstArea the new size of the content
         */
        computeWithAlignment(sourceArea: Size, contentSize: Size, alignment: PrimitiveAlignment, contentScale: Vector2, dstOffset: Vector4, dstArea: Size, computeLayoutArea?: boolean, computeAxis?: number): void;
        /**
         * Compute an area and its position considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param dstOffset the position of the resulting area
         * @param dstArea the size of the resulting area
         */
        compute(sourceArea: Size, dstOffset: Vector4, dstArea: Size, computeLayoutArea?: boolean): void;
        /**
         * Compute an area considering this thickness properties based on a given source area
         * @param sourceArea the source area
         * @param result the resulting area
         */
        computeArea(sourceArea: Size, sourceScale: Vector2, result: Size): void;
        enlarge(sourceArea: Size, sourceScale: Vector2, dstOffset: Vector4, enlargedArea: Size): void;
    }
    /**
     * Main class used for the Primitive Intersection API
     */
    class IntersectInfo2D {
        constructor();
        /**
         * Set the pick position, relative to the primitive where the intersection test is made
         */
        pickPosition: Vector2;
        /**
         * If true the intersection will stop at the first hit, if false all primitives will be tested and the intersectedPrimitives array will be filled accordingly (false default)
         */
        findFirstOnly: boolean;
        /**
         * If true the intersection test will also be made on hidden primitive (false default)
         */
        intersectHidden: boolean;
        _globalPickPosition: Vector2;
        _localPickPosition: Vector2;
        /**
         * The topmost intersected primitive
         */
        topMostIntersectedPrimitive: PrimitiveIntersectedInfo;
        /**
         * The array containing all intersected primitive, in no particular order.
         */
        intersectedPrimitives: Array<PrimitiveIntersectedInfo>;
        /**
         * true if at least one primitive intersected during the test
         */
        readonly isIntersected: boolean;
        isPrimIntersected(prim: Prim2DBase): Vector2;
        _exit(firstLevel: boolean): void;
    }
    class Prim2DBase extends SmartPropertyPrim {
        static PRIM2DBASE_PROPCOUNT: number;
        static _bigInt: number;
        constructor(settings: {
            parent?: Prim2DBase;
            id?: string;
            children?: Array<Prim2DBase>;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            alignToPixel?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            layoutEngine?: LayoutEngineBase | string;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        /**
         * Return the ChangedDictionary observable of the StringDictionary containing the primitives intersecting with this one
         */
        readonly intersectWithObservable: Observable<DictionaryChanged<ActorInfoBase>>;
        /**
         * Return the ObservableStringDictionary containing all the primitives intersecting with this one.
         * The key is the primitive uid, the value is the ActorInfo object
         * @returns {}
         */
        readonly intersectWith: ObservableStringDictionary<ActorInfoBase>;
        readonly actionManager: ActionManager;
        /**
         * From 'this' primitive, traverse up (from parent to parent) until the given predicate is true
         * @param predicate the predicate to test on each parent
         * @return the first primitive where the predicate was successful
         */
        traverseUp(predicate: (p: Prim2DBase) => boolean): Prim2DBase;
        /**
         * Retrieve the owner Canvas2D
         */
        readonly owner: Canvas2D;
        /**
         * Get the parent primitive (can be the Canvas, only the Canvas has no parent)
         */
        readonly parent: Prim2DBase;
        /**
         * The array of direct children primitives
         */
        readonly children: Prim2DBase[];
        /**
         * The identifier of this primitive, may not be unique, it's for information purpose only
         */
        id: string;
        /**
         * Metadata of the position property
         */
        static positionProperty: Prim2DPropInfo;
        /**
         * Metadata of the left property
         */
        static xProperty: Prim2DPropInfo;
        /**
         * Metadata of the bottom property
         */
        static yProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualPosition property
         */
        static actualPositionProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualX (Left) property
         */
        static actualXProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualY (Bottom) property
         */
        static actualYProperty: Prim2DPropInfo;
        /**
         * Metadata of the size property
         */
        static sizeProperty: Prim2DPropInfo;
        /**
         * Metadata of the width property
         */
        static widthProperty: Prim2DPropInfo;
        /**
         * Metadata of the height property
         */
        static heightProperty: Prim2DPropInfo;
        /**
         * Metadata of the rotation property
         */
        static rotationProperty: Prim2DPropInfo;
        /**
         * Metadata of the scale property
         */
        static scaleProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualSize property
         */
        static actualSizeProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualWidth property
         */
        static actualWidthProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualHeight property
         */
        static actualHeightProperty: Prim2DPropInfo;
        /**
         * Metadata of the origin property
         */
        static originProperty: Prim2DPropInfo;
        /**
         * Metadata of the levelVisible property
         */
        static levelVisibleProperty: Prim2DPropInfo;
        /**
         * Metadata of the isVisible property
         */
        static isVisibleProperty: Prim2DPropInfo;
        /**
         * Metadata of the zOrder property
         */
        static zOrderProperty: Prim2DPropInfo;
        /**
         * Metadata of the margin property
         */
        static marginProperty: Prim2DPropInfo;
        /**
         * Metadata of the margin property
         */
        static paddingProperty: Prim2DPropInfo;
        /**
         * Metadata of the marginAlignment property
         */
        static marginAlignmentProperty: Prim2DPropInfo;
        /**
         * Metadata of the opacity property
         */
        static opacityProperty: Prim2DPropInfo;
        /**
         * Metadata of the scaleX property
         */
        static scaleXProperty: Prim2DPropInfo;
        /**
         * Metadata of the scaleY property
         */
        static scaleYProperty: Prim2DPropInfo;
        /**
         * Metadata of the actualScale property
         */
        static actualScaleProperty: Prim2DPropInfo;
        /**
         * DO NOT INVOKE for internal purpose only
         */
        actualPosition: Vector2;
        private static _nullPosition;
        private static _nullSize;
        /**
         * Shortcut to actualPosition.x
         */
        /**
         * DO NOT INVOKE for internal purpose only
         */
        actualX: number;
        /**
         * Shortcut to actualPosition.y
         */
        /**
        * DO NOT INVOKE for internal purpose only
        */
        actualY: number;
        /**
         * Position of the primitive, relative to its parent.
         * BEWARE: if you change only position.x or y it won't trigger a property change and you won't have the expected behavior.
         * Use this property to set a new Vector2 object, otherwise to change only the x/y use Prim2DBase.x or y properties.
         * Setting this property may have no effect is specific alignment are in effect.
         */
        position: Vector2;
        /**
         * Direct access to the position.x value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        x: number;
        /**
         * Direct access to the position.y value of the primitive
         * Use this property when you only want to change one component of the position property
         */
        y: number;
        private static boundinbBoxReentrency;
        protected static nullSize: Size;
        size: Size;
        protected internalGetSize(): Size;
        protected internalSetSize(value: Size): void;
        width: number;
        height: number;
        rotation: number;
        scale: number;
        actualSize: Size;
        actualWidth: number;
        actualHeight: number;
        readonly actualZOffset: number;
        /**
         * Get or set the minimal size the Layout Engine should respect when computing the primitive's actualSize.
         * The Primitive's size won't be less than specified.
         * The default value depends of the Primitive type
         */
        minSize: Size;
        /**
         * Get or set the maximal size the Layout Engine should respect when computing the primitive's actualSize.
         * The Primitive's size won't be more than specified.
         * The default value depends of the Primitive type
         */
        maxSize: Size;
        /**
         * The origin defines the normalized coordinate of the center of the primitive, from the bottom/left corner.
         * The origin is used only to compute transformation of the primitive, it has no meaning in the primitive local frame of reference
         * For instance:
         * 0,0 means the center is bottom/left. Which is the default for Canvas2D instances
         * 0.5,0.5 means the center is at the center of the primitive, which is default of all types of Primitives
         * 0,1 means the center is top/left
         * @returns The normalized center.
         */
        origin: Vector2;
        levelVisible: boolean;
        isVisible: boolean;
        zOrder: number;
        readonly isManualZOrder: boolean;
        margin: PrimitiveThickness;
        /**
         * Set the margin from a string value
         * @param value is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.
         */
        setMargin(value: string): void;
        /**
         * Check for both margin and marginAlignment, return true if at least one of them is specified with a non default value
         */
        readonly _hasMargin: boolean;
        padding: PrimitiveThickness;
        /**
         * Set the padding from a string value
         * @param value is "top: <value>, left:<value>, right:<value>, bottom:<value>" or "<value>" (same for all edges) each are optional, auto will be set if it's omitted.
         * Values are: 'auto', 'inherit', 'XX%' for percentage, 'XXpx' or 'XX' for pixels.         */
        setPadding(value: string): void;
        private readonly _hasPadding;
        marginAlignment: PrimitiveAlignment;
        /**
         * Set the margin's horizontal and or vertical alignments from a string value.
         * @param value can be: [<h:|horizontal:><left|right|center|stretch>], [<v:|vertical:><top|bottom|center|stretch>]
         */
        setMarginalignment(value: string): void;
        /**
         * Check if there a marginAlignment specified (non null and not default)
         */
        readonly _hasMarginAlignment: boolean;
        protected _updatePositioningState(): void;
        opacity: number;
        scaleX: number;
        scaleY: number;
        protected _spreadActualScaleDirty(): void;
        /**
         * Returns the actual scale of this Primitive, the value is computed from the scale property of this primitive, multiplied by the actualScale of its parent one (if any). The Vector2 object returned contains the scale for both X and Y axis
         */
        readonly actualScale: Vector2;
        /**
         * Get the actual Scale of the X axis, shortcut for this.actualScale.x
         */
        readonly actualScaleX: number;
        /**
         * This method stores the actual global scale (including DesignMode and DPR related scales) in the given Vector2
         * @param res the object that will receive the actual global scale: this is actualScale * DPRScale * DesignModeScale
         */
        getActualGlobalScaleToRef(res: Vector2): void;
        /**
         * Get the actual Scale of the Y axis, shortcut for this.actualScale.y
         */
        readonly actualScaleY: number;
        /**
         * Get the actual opacity level, this property is computed from the opacity property, multiplied by the actualOpacity of its parent (if any)
         */
        readonly actualOpacity: number;
        /**
         * Get/set the layout engine to use for this primitive.
         * The default layout engine is the CanvasLayoutEngine.
         */
        layoutEngine: LayoutEngineBase;
        /**
         * Get/set the layout are of this primitive.
         * The Layout area is the zone allocated by the Layout Engine for this particular primitive. Margins/Alignment will be computed based on this area.
         * The setter should only be called by a Layout Engine class.
         */
        layoutArea: Size;
        /**
         * Get/set the layout area position (relative to the parent primitive).
         * The setter should only be called by a Layout Engine class.
         */
        layoutAreaPos: Vector2;
        /**
         * Define if the Primitive can be subject to intersection test or not (default is true)
         */
        isPickable: boolean;
        /**
         * Define if the Primitive acts as a container or not
         * A container will encapsulate its children for interaction event.
         * If it's not a container events will be process down to children if the primitive is not pickable.
         * Default value is true
         */
        isContainer: boolean;
        /**
         * Return the depth level of the Primitive into the Canvas' Graph. A Canvas will be 0, its direct children 1, and so on.
         */
        readonly hierarchyDepth: number;
        /**
         * Retrieve the Group that is responsible to render this primitive
         */
        readonly renderGroup: Group2D;
        /**
         * Get the global transformation matrix of the primitive
         */
        readonly globalTransform: Matrix2D;
        /**
         * return the global position of the primitive, relative to its canvas
         */
        getGlobalPosition(): Vector2;
        /**
         * return the global position of the primitive, relative to its canvas
         * @param v the valid Vector2 object where the global position will be stored
         */
        getGlobalPositionByRef(v: Vector2): void;
        /**
         * Get invert of the global transformation matrix of the primitive
         */
        readonly invGlobalTransform: Matrix2D;
        /**
         * Get the local transformation of the primitive
         */
        readonly localTransform: Matrix2D;
        readonly localLayoutTransform: Matrix2D;
        /**
         * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
         */
        alignToPixel: boolean;
        private static _bMinMax;
        private static _bMax;
        private static _bSize;
        private static _tpsBB;
        private static _tpsBB2;
        /**
         * Get the boundingInfo associated to the primitive and its children.
         */
        readonly boundingInfo: BoundingInfo2D;
        /**
         * Get the boundingInfo of the primitive's content arranged by a layout Engine
         * If a particular child is not arranged by layout, it's boundingInfo is used instead to produce something as accurate as possible
         */
        readonly layoutBoundingInfo: BoundingInfo2D;
        /**
         * Determine if the size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the size is automatically computed, false if it were manually specified.
         */
        readonly isSizeAuto: boolean;
        /**
         * Determine if the horizontal size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the horizontal size is automatically computed, false if it were manually specified.
         */
        readonly isHorizontalSizeAuto: boolean;
        /**
         * Determine if the vertical size is automatically computed or fixed because manually specified.
         * Use the actualSize property to get the final/real size of the primitive
         * @returns true if the vertical size is automatically computed, false if it were manually specified.
         */
        readonly isVerticalSizeAuto: boolean;
        /**
         * Return true if this prim has an auto size which is set by the children's global bounding box
         */
        readonly isSizedByContent: boolean;
        /**
         * Determine if the position is automatically computed or fixed because manually specified.
         * Use the actualPosition property to get the final/real position of the primitive
         * @returns true if the position is automatically computed, false if it were manually specified.
         */
        readonly isPositionAuto: boolean;
        /**
         * Interaction with the primitive can be create using this Observable. See the PrimitivePointerInfo class for more information
         */
        readonly pointerEventObservable: Observable<PrimitivePointerInfo>;
        readonly zActualOrderChangedObservable: Observable<number>;
        displayDebugAreas: boolean;
        private static _updatingDebugArea;
        private _updateDebugArea();
        findById(id: string): Prim2DBase;
        protected onZOrderChanged(): void;
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        /**
         * Capture all the Events of the given PointerId for this primitive.
         * Don't forget to call releasePointerEventsCapture when done.
         * @param pointerId the Id of the pointer to capture the events from.
         */
        setPointerEventCapture(pointerId: number): boolean;
        /**
         * Release a captured pointer made with setPointerEventCapture.
         * @param pointerId the Id of the pointer to release the capture from.
         */
        releasePointerEventsCapture(pointerId: number): boolean;
        private static _bypassGroup2DExclusion;
        /**
         * Make an intersection test with the primitive, all inputs/outputs are stored in the IntersectInfo2D class, see its documentation for more information.
         * @param intersectInfo contains the settings of the intersection to perform, to setup before calling this method as well as the result, available after a call to this method.
         */
        intersect(intersectInfo: IntersectInfo2D): boolean;
        intersectOtherPrim(other: Prim2DBase): boolean;
        readonly triList: Tri2DArray;
        protected updateTriArray(): void;
        /**
         * Move a child object into a new position regarding its siblings to change its rendering order.
         * You can also use the shortcut methods to move top/bottom: moveChildToTop, moveChildToBottom, moveToTop, moveToBottom.
         * @param child the object to move
         * @param previous the object which will be before "child", if child has to be the first among sibling, set "previous" to null.
         */
        moveChild(child: Prim2DBase, previous: Prim2DBase): boolean;
        /**
         * Move the given child so it's displayed on the top of all its siblings
         * @param child the primitive to move to the top
         */
        moveChildToTop(child: Prim2DBase): boolean;
        /**
         * Move the given child so it's displayed on the bottom of all its siblings
         * @param child the primitive to move to the top
         */
        moveChildToBottom(child: Prim2DBase): boolean;
        /**
         * Move this primitive to be at the top among all its sibling
         */
        moveToTop(): boolean;
        /**
         * Move this primitive to be at the bottom among all its sibling
         */
        moveToBottom(): boolean;
        private addChild(child);
        /**
         * Dispose the primitive, remove it from its parent.
         */
        dispose(): boolean;
        protected onPrimBecomesDirty(): void;
        _needPrepare(): boolean;
        _prepareRender(context: PrepareRender2DContext): void;
        _prepareRenderPre(context: PrepareRender2DContext): void;
        _prepareRenderPost(context: PrepareRender2DContext): void;
        protected _canvasPreInit(settings: any): void;
        protected static _isCanvasInit: boolean;
        protected static CheckParent(parent: Prim2DBase): void;
        protected updateCachedStatesOf(list: Prim2DBase[], recurse: boolean): void;
        private _parentLayoutDirty();
        protected _setLayoutDirty(): void;
        private _checkUseMargin();
        protected _positioningDirty(): void;
        protected _spreadActualOpacityChanged(): void;
        private _changeLayoutEngine(engine);
        private static _t0;
        private static _t1;
        private static _t2;
        private static _v0;
        private static _v30;
        private static _iv2;
        private static _ts0;
        private _updateLocalTransform();
        private static _transMtx;
        protected updateCachedStates(recurse: boolean): void;
        private static _icPos;
        private static _icZone;
        private static _icArea;
        private static _size;
        private static _size2;
        private static _size3;
        private static _size4;
        private static _pv0;
        private static _curContentArea;
        private static _piv;
        private static _tbi;
        private static _pv1;
        private static _pv2;
        private _updatePositioning();
        /**
         * Get the content are of this primitive, this area is computed the primitive size and using the padding property.
         * Children of this primitive will be positioned relative to the bottom/left corner of this area.
         */
        readonly contentArea: Size;
        _patchHierarchy(owner: Canvas2D): void;
        protected onSetOwner(): void;
        private static _zOrderChangedNotifList;
        private static _zRebuildReentrency;
        private _updateZOrder();
        private static _totalCount;
        private _updatePrimitiveLinearPosition(prevLinPos);
        private _updatePrimitiveZOrder(startPos, startZ, deltaZ);
        private _updatePrimitiveFlatZOrder(newZ);
        private _setZOrder(newZ, directEmit);
        protected _updateRenderMode(): void;
        /**
         * This method is used to alter the contentArea of the Primitive before margin is applied.
         * In most of the case you won't need to override this method, but it can prove some usefulness, check the Rectangle2D class for a concrete application.
         * @param primSize the current size of the primitive
         * @param initialContentPosition the position of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing! x, y, z, w area left, bottom, right, top
         * @param initialContentArea the size of the initial content area to compute, a valid object is passed, you have to set its properties. PLEASE ROUND the values, we're talking about pixels and fraction of them is not a good thing!
         */
        protected _getInitialContentAreaToRef(primSize: Size, initialContentPosition: Vector4, initialContentArea: Size): void;
        /**
         * This method is used to calculate the new size of the primitive based on the content which must stay the same
         * Check the Rectangle2D implementation for a concrete application.
         * @param primSize the current size of the primitive
         * @param newPrimSize the new size of the primitive. PLEASE ROUND THE values, we're talking about pixels and fraction of them are not our friends!
         */
        protected _getActualSizeFromContentToRef(primSize: Size, paddingOffset: Vector4, newPrimSize: Size): void;
        /**
         * Get/set the layout data to use for this primitive.
         */
        layoutData: ILayoutData;
        private _owner;
        private _parent;
        private _actionManager;
        protected _children: Array<Prim2DBase>;
        private _renderGroup;
        protected _hierarchyDepth: number;
        protected _zOrder: number;
        private _manualZOrder;
        protected _zMax: number;
        private _firstZDirtyIndex;
        private _primLinearPosition;
        private _margin;
        private _padding;
        private _marginAlignment;
        _pointerEventObservable: Observable<PrimitivePointerInfo>;
        private _actualZOrderChangedObservable;
        private _id;
        private _position;
        private _actualPosition;
        protected _size: Size;
        protected _actualSize: Size;
        private _internalSize;
        protected _minSize: Size;
        protected _maxSize: Size;
        protected _desiredSize: Size;
        private _layoutEngine;
        private _marginOffset;
        private _paddingOffset;
        private _parentPaddingOffset;
        private _parentContentArea;
        private _lastAutoSizeArea;
        private _layoutAreaPos;
        private _layoutArea;
        private _layoutData;
        private _contentArea;
        private _rotation;
        private _scale;
        protected _postScale: Vector2;
        private _origin;
        protected _opacity: number;
        private _actualOpacity;
        private _actualScale;
        private _displayDebugAreas;
        private _debugAreaGroup;
        private _actorInfo;
        protected _parentTransformStep: number;
        protected _globalTransformStep: number;
        protected _globalTransformProcessStep: number;
        protected _prepareProcessStep: number;
        protected _updateCachesProcessStep: number;
        protected _localTransform: Matrix2D;
        protected _localLayoutTransform: Matrix2D;
        protected _globalTransform: Matrix2D;
        protected _invGlobalTransform: Matrix2D;
        protected _primTriArrayDirty: boolean;
        protected _primTriArray: Tri2DArray;
    }
}

declare module BABYLON {
    const enum ShaderDataType {
        Vector2 = 0,
        Vector3 = 1,
        Vector4 = 2,
        float = 3,
        Color3 = 4,
        Color4 = 5,
        Size = 6,
    }
    class GroupInstanceInfo {
        constructor(owner: Group2D, mrc: ModelRenderCache, partCount: number);
        incPrimCount(): void;
        dispose(): boolean;
        readonly isDisposed: boolean;
        private _isDisposed;
        owner: Group2D;
        modelRenderCache: ModelRenderCache;
        partIndexFromId: StringDictionary<number>;
        readonly hasOpaqueData: boolean;
        readonly hasAlphaTestData: boolean;
        readonly hasTransparentData: boolean;
        opaqueDirty: boolean;
        readonly opaqueData: GroupInfoPartData[];
        alphaTestDirty: boolean;
        readonly alphaTestData: GroupInfoPartData[];
        transparentOrderDirty: boolean;
        transparentDirty: boolean;
        readonly transparentData: TransparentGroupInfoPartData[];
        sortTransparentData(): void;
        readonly usedShaderCategories: string[];
        readonly strides: number[];
        private _partCount;
        private _primCount;
        private _strides;
        private _usedShaderCategories;
        private _opaqueData;
        private _alphaTestData;
        private _transparentData;
    }
    class TransparentSegment {
        constructor();
        dispose(engine: Engine): void;
        groupInsanceInfo: GroupInstanceInfo;
        startZ: number;
        endZ: number;
        startDataIndex: number;
        endDataIndex: number;
        partBuffers: WebGLBuffer[];
    }
    class GroupInfoPartData {
        _partData: DynamicFloatArray;
        _partBuffer: WebGLBuffer;
        _partBufferSize: number;
        constructor(stride: number);
        dispose(engine: Engine): boolean;
        private _isDisposed;
    }
    class TransparentGroupInfoPartData extends GroupInfoPartData {
        constructor(stride: number, zoff: number);
    }
    class ModelRenderCache {
        constructor(engine: Engine, modelKey: string);
        dispose(): boolean;
        readonly isDisposed: boolean;
        addRef(): number;
        readonly modelKey: string;
        updateModelRenderCache(prim: Prim2DBase): boolean;
        /**
         * Render the model instances
         * @param instanceInfo
         * @param context
         * @return must return true is the rendering succeed, false if the rendering couldn't be done (asset's not yet ready, like Effect)
         */
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        protected getPartIndexFromId(partId: number): number;
        protected loadInstancingAttributes(partId: number, effect: Effect): InstancingAttributeInfo[];
        private static v2;
        private static v3;
        private static v4;
        protected setupUniforms(effect: Effect, partIndex: number, data: DynamicFloatArray, elementCount: number): void;
        protected _engine: Engine;
        private _modelKey;
        private _nextKey;
        private _refCounter;
        _partData: ModelRenderCachePartData[];
        _partsClassInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>[];
    }
    class ModelRenderCachePartData {
        _partId: number;
        _zBiasOffset: number;
        _partDataStride: number;
        _partUsedCategories: string[];
        _partJoinedUsedCategories: string;
    }
}

declare module BABYLON {
    class InstanceClassInfo {
        constructor(base: InstanceClassInfo);
        mapProperty(propInfo: InstancePropInfo, push: boolean): void;
        getInstancingAttributeInfos(effect: Effect, categories: string[]): InstancingAttributeInfo[];
        getShaderAttributes(categories: string[]): string[];
        private _getBaseOffset(categories);
        static _CurCategories: string;
        private _baseInfo;
        private _nextOffset;
        private _attributes;
    }
    class InstancePropInfo {
        attributeName: string;
        category: string;
        size: number;
        instanceOffset: StringDictionary<number>;
        dataType: ShaderDataType;
        curCategory: string;
        curCategoryOffset: number;
        delimitedCategory: string;
        constructor();
        setSize(val: any): void;
        writeData(array: Float32Array, offset: number, val: any): void;
    }
    function instanceData<T>(category?: string, shaderAttributeName?: string): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void;
    class InstanceDataBase {
        constructor(partId: number, dataElementCount: number);
        id: number;
        isVisible: boolean;
        zBias: Vector2;
        transformX: Vector4;
        transformY: Vector4;
        renderingInfo: Vector3;
        opacity: number;
        getClassTreeInfo(): ClassTreeInfo<InstanceClassInfo, InstancePropInfo>;
        allocElements(): void;
        freeElements(): void;
        dataElementCount: number;
        groupInstanceInfo: GroupInstanceInfo;
        arrayLengthChanged: boolean;
        curElement: number;
        renderMode: number;
        dataElements: DynamicFloatArrayElementInfo[];
        dataBuffer: DynamicFloatArray;
        typeInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>;
        private _dataElementCount;
    }
    abstract class RenderablePrim2D extends Prim2DBase {
        static RENDERABLEPRIM2D_PROPCOUNT: number;
        static isAlphaTestProperty: Prim2DPropInfo;
        static isTransparentProperty: Prim2DPropInfo;
        readonly isAlphaTest: boolean;
        readonly isTransparent: boolean;
        readonly renderMode: number;
        constructor(settings?: {
            parent?: Prim2DBase;
            id?: string;
            origin?: Vector2;
            isVisible?: boolean;
        });
        /**
         * Dispose the primitive and its resources, remove it from its parent
         */
        dispose(): boolean;
        private _cleanupInstanceDataParts();
        _prepareRenderPre(context: PrepareRender2DContext): void;
        private _createModelRenderCache();
        private _createModelDataParts();
        private _setupModelRenderCache(parts);
        protected onZOrderChanged(): void;
        protected _mustUpdateInstance(): boolean;
        protected _useTextureAlpha(): boolean;
        protected _shouldUseAlphaFromTexture(): boolean;
        protected _isPrimAlphaTest(): boolean;
        protected _isPrimTransparent(): boolean;
        private _updateInstanceDataParts(gii);
        _updateTransparentSegmentIndices(ts: TransparentSegment): void;
        _getNextPrimZOrder(): number;
        _getPrevPrimZOrder(): number;
        private static _toz;
        /**
         * Get the info for a given effect based on the dataPart metadata
         * @param dataPartId partId in part list to get the info
         * @param vertexBufferAttributes vertex buffer attributes to manually add
         * @param uniforms uniforms to manually add
         * @param useInstanced specified if Instanced Array should be used, if null the engine caps will be used (so true if WebGL supports it, false otherwise), but you have the possibility to override the engine capability. However, if you manually set true but the engine does not support Instanced Array, this method will return null
         */
        protected getDataPartEffectInfo(dataPartId: number, vertexBufferAttributes: string[], uniforms?: string[], useInstanced?: boolean): {
            attributes: string[];
            uniforms: string[];
            defines: string;
        };
        protected readonly modelRenderCache: ModelRenderCache;
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): void;
        protected createInstanceDataParts(): InstanceDataBase[];
        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[];
        protected beforeRefreshForLayoutConstruction(part: InstanceDataBase): any;
        protected afterRefreshForLayoutConstruction(part: InstanceDataBase, obj: any): void;
        protected applyActualScaleOnTransform(): boolean;
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private static _uV;
        private static _s;
        private static _r;
        private static _t;
        private static _iV2;
        /**
         * Update the instanceDataBase level properties of a part
         * @param part the part to update
         * @param positionOffset to use in multi part per primitive (e.g. the Text2D has N parts for N letter to display), this give the offset to apply (e.g. the position of the letter from the bottom/left corner of the text).
         */
        protected updateInstanceDataPart(part: InstanceDataBase, positionOffset?: Vector2): void;
        protected _updateRenderMode(): void;
        private _modelRenderCache;
        private _transparentPrimitiveInfo;
        protected _instanceDataParts: InstanceDataBase[];
        private _renderMode;
    }
}

declare module BABYLON {
    abstract class Shape2D extends RenderablePrim2D {
        static SHAPE2D_BORDERPARTID: number;
        static SHAPE2D_FILLPARTID: number;
        static SHAPE2D_CATEGORY_BORDER: string;
        static SHAPE2D_CATEGORY_BORDERSOLID: string;
        static SHAPE2D_CATEGORY_BORDERGRADIENT: string;
        static SHAPE2D_CATEGORY_FILLSOLID: string;
        static SHAPE2D_CATEGORY_FILLGRADIENT: string;
        static SHAPE2D_PROPCOUNT: number;
        static borderProperty: Prim2DPropInfo;
        static fillProperty: Prim2DPropInfo;
        static borderThicknessProperty: Prim2DPropInfo;
        border: IBrush2D;
        /**
         * Get/set the brush to render the Fill part of the Primitive
         */
        fill: IBrush2D;
        borderThickness: number;
        constructor(settings?: {
            fill?: IBrush2D | string;
            border?: IBrush2D | string;
            borderThickness?: number;
        });
        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[];
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private _updateTransparencyStatus();
        protected _mustUpdateInstance(): boolean;
        protected _isPrimTransparent(): boolean;
        private _oldTransparent;
        private _isTransparent;
        private _border;
        private _borderThickness;
        private _fill;
    }
    class Shape2DInstanceData extends InstanceDataBase {
        fillSolidColor: Color4;
        fillGradientColor1: Color4;
        fillGradientColor2: Color4;
        fillGradientTY: Vector4;
        borderThickness: number;
        borderSolidColor: Color4;
        borderGradientColor1: Color4;
        borderGradientColor2: Color4;
        borderGradientTY: Vector4;
    }
}

declare module BABYLON {
    class Group2D extends Prim2DBase {
        static GROUP2D_PROPCOUNT: number;
        static sizeProperty: Prim2DPropInfo;
        static actualSizeProperty: Prim2DPropInfo;
        /**
         * Default behavior, the group will use the caching strategy defined at the Canvas Level
         */
        static GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY: number;
        /**
         * When used, this group's content won't be cached, no matter which strategy used.
         * If the group is part of a WorldSpace Canvas, its content will be drawn in the Canvas cache bitmap.
         */
        static GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE: number;
        /**
         * When used, the group's content will be cached in the nearest cached parent group/canvas
         */
        static GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP: number;
        /**
         * You can specify this behavior to any cached Group2D to indicate that you don't want the cached content to be resized when the Group's actualScale is changing. It will draw the content stretched or shrink which is faster than a resize. This setting is obviously for performance consideration, don't use it if you want the best rendering quality
         */
        static GROUPCACHEBEHAVIOR_NORESIZEONSCALE: number;
        private static GROUPCACHEBEHAVIOR_OPTIONMASK;
        /**
         * Create an Logical or Renderable Group.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - trackNode: if you want the ScreenSpaceCanvas to track the position of a given Scene Node, use this setting to specify the Node to track
         * - trackNodeOffset: if you use trackNode you may want to specify a 3D Offset to apply to shift the Canvas
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. If null the size will be computed from its content, default is null.
         *  - cacheBehavior: Define how the group should behave regarding the Canvas's cache strategy, default is Group2D.GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY
         * - layoutEngine: either an instance of a layout engine based class (StackPanel.Vertical, StackPanel.Horizontal) or a string ('canvas' for Canvas layout, 'StackPanel' or 'HorizontalStackPanel' for horizontal Stack Panel layout, 'VerticalStackPanel' for vertical Stack Panel layout).
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersect, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            trackNode?: Node;
            trackNodeOffset?: Vector3;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            size?: Size;
            width?: number;
            height?: number;
            cacheBehavior?: number;
            layoutEngine?: LayoutEngineBase | string;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        static _createCachedCanvasGroup(owner: Canvas2D): Group2D;
        protected applyCachedTexture(vertexData: VertexData, material: StandardMaterial): void;
        /**
         * Allow you to access the information regarding the cached rectangle of the Group2D into the MapTexture.
         * If the `noWorldSpaceNode` options was used at the creation of a WorldSpaceCanvas, the rendering of the canvas must be made by the caller, so typically you want to bind the cacheTexture property to some material/mesh and you MUST use the Group2D.cachedUVs property to get the UV coordinates to use for your quad that will display the Canvas and NOT the PackedRect.UVs property which are incorrect because the allocated surface may be bigger (due to over-provisioning or shrinking without deallocating) than what the Group is actually using.
         */
        readonly cachedRect: PackedRect;
        /**
         * The UVs into the MapTexture that map the cached group
         */
        readonly cachedUVs: Vector2[];
        readonly cachedUVsChanged: Observable<Vector2[]>;
        /**
         * Access the texture that maintains a cached version of the Group2D.
         * This is useful only if you're not using a WorldSpaceNode for your WorldSpace Canvas and therefore need to perform the rendering yourself.
         */
        readonly cacheTexture: MapTexture;
        /**
         * Call this method to remove this Group and its children from the Canvas
         */
        dispose(): boolean;
        /**
         * @returns Returns true if the Group render content, false if it's a logical group only
         */
        readonly isRenderableGroup: boolean;
        /**
         * @returns only meaningful for isRenderableGroup, will be true if the content of the Group is cached into a texture, false if it's rendered every time
         */
        readonly isCachedGroup: boolean;
        /**
         * Get/Set the size of the group. If null the size of the group will be determine from its content.
         * BEWARE: if the Group is a RenderableGroup and its content is cache the texture will be resized each time the group is getting bigger. For performance reason the opposite won't be true: the texture won't shrink if the group does.
         */
        size: Size;
        readonly viewportSize: ISize;
        /**
         * Get/set the Cache Behavior, used in case the Canvas Cache Strategy is set to CACHESTRATEGY_ALLGROUPS. Can be either GROUPCACHEBEHAVIOR_CACHEINPARENTGROUP, GROUPCACHEBEHAVIOR_DONTCACHEOVERRIDE or GROUPCACHEBEHAVIOR_FOLLOWCACHESTRATEGY. See their documentation for more information.
         * GROUPCACHEBEHAVIOR_NORESIZEONSCALE can also be set if you set it at creation time.
         * It is critical to understand than you HAVE TO play with this behavior in order to achieve a good performance/memory ratio. Caching all groups would certainly be the worst strategy of all.
         */
        readonly cacheBehavior: number;
        _addPrimToDirtyList(prim: Prim2DBase): void;
        _renderCachedCanvas(): void;
        /**
         * Get/set the Scene's Node that should be tracked, the group's position will follow the projected position of the Node.
         */
        trackedNode: Node;
        /**
         * Get/set the offset of the tracked node in the tracked node's local space.
         */
        trackedNodeOffset: Vector3;
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        protected updateLevelBoundingInfo(): boolean;
        protected _prepareGroupRender(context: PrepareRender2DContext): void;
        protected _groupRender(): void;
        _setCacheGroupDirty(): void;
        private _updateTransparentData();
        private _renderTransparentData();
        private _prepareContext(engine, context, gii);
        protected _setRenderingScale(scale: number): void;
        private static _uV;
        private static _s;
        private static _v1;
        private static _s2;
        private _bindCacheTarget();
        private _unbindCacheTarget();
        protected _spreadActualScaleDirty(): void;
        protected static _unS: Vector2;
        protected handleGroupChanged(prop: Prim2DPropInfo): void;
        private detectGroupStates();
        readonly _cachedTexture: MapTexture;
        private _trackedNode;
        private _trackedNodeOffset;
        protected _isRenderableGroup: boolean;
        protected _isCachedGroup: boolean;
        private _cacheGroupDirty;
        private _cacheBehavior;
        private _viewportPosition;
        private _viewportSize;
        _renderableData: RenderableGroupData;
    }
    class RenderableGroupData {
        constructor();
        dispose(owner: Canvas2D): void;
        addNewTransparentPrimitiveInfo(prim: RenderablePrim2D, gii: GroupInstanceInfo): TransparentPrimitiveInfo;
        removeTransparentPrimitiveInfo(tpi: TransparentPrimitiveInfo): void;
        transparentPrimitiveZChanged(tpi: TransparentPrimitiveInfo): void;
        _primDirtyList: Array<Prim2DBase>;
        _primNewDirtyList: Array<Prim2DBase>;
        _childrenRenderableGroups: Array<Group2D>;
        _renderGroupInstancesInfo: StringDictionary<GroupInstanceInfo>;
        _cacheNode: PackedRect;
        _cacheTexture: MapTexture;
        _cacheRenderSprite: Sprite2D;
        _cacheNodeUVs: Vector2[];
        _cacheNodeUVsChangedObservable: Observable<Vector2[]>;
        _cacheSize: Size;
        _useMipMap: boolean;
        _anisotropicLevel: number;
        _noResizeOnScale: boolean;
        _transparentListChanged: boolean;
        _transparentPrimitives: Array<TransparentPrimitiveInfo>;
        _transparentSegments: Array<TransparentSegment>;
        _renderingScale: number;
    }
    class TransparentPrimitiveInfo {
        _primitive: RenderablePrim2D;
        _groupInstanceInfo: GroupInstanceInfo;
        _transparentSegment: TransparentSegment;
    }
}

declare module BABYLON {
    class WireFrame2DRenderCache extends ModelRenderCache {
        effectsReady: boolean;
        vb: WebGLBuffer;
        vtxCount: number;
        instancingAttributes: InstancingAttributeInfo[];
        effect: Effect;
        effectInstanced: Effect;
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        updateModelRenderCache(prim: Prim2DBase): boolean;
        dispose(): boolean;
    }
    class WireFrameVertex2D {
        x: number;
        y: number;
        r: number;
        g: number;
        b: number;
        a: number;
        constructor(p: Vector2, c?: Color4);
        fromVector2(p: Vector2): void;
        fromColor3(c: Color3): void;
        fromColor4(c: Color4): void;
    }
    class WireFrameGroup2D {
        /**
         * Construct a WireFrameGroup2D object
         * @param id a unique ID among the Groups added to a given WireFrame2D primitive, if you don't specify an id, a random one will be generated. The id is immutable.
         * @param defaultColor specify the default color that will be used when a vertex is pushed, white will be used if not specified.
         */
        constructor(id?: string, defaultColor?: Color4);
        readonly uid: string;
        /**
         * Retrieve the ID of the group
         */
        readonly id: string;
        /**
         * Push a vertex in the array of vertices.
         * If you're previously called startLineStrip, the vertex will be pushed twice in order to describe the end of a line and the start of a new one.
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        pushVertex(p: Vector2, c?: Color4): void;
        /**
         * Start to store a Line Strip. The given vertex will be pushed in the array. The you have to call pushVertex to add subsequent vertices describing the strip and don't forget to call endLineStrip to close the strip!!!
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        startLineStrip(p: Vector2, c?: Color4): void;
        /**
         * Close the Strip by storing a last vertex
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        endLineStrip(p: Vector2, c?: Color4): void;
        /**
         * Access to the array of Vertices, you can manipulate its content but BEWARE of what you're doing!
         */
        readonly vertices: Array<WireFrameVertex2D>;
        private _uid;
        private _id;
        private _defaultColor;
        private _vertices;
        private _buildingStrip;
    }
    class WireFrame2D extends RenderablePrim2D {
        static WIREFRAME2D_MAINPARTID: number;
        static wireFrameGroupsProperty: Prim2DPropInfo;
        readonly wireFrameGroups: StringDictionary<WireFrameGroup2D>;
        /**
         * If you change the content of the wireFrameGroups you MUST call this method for the changes to be reflected during rendering
         */
        wireFrameGroupsDirty(): void;
        size: Size;
        protected updateLevelBoundingInfo(): boolean;
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        /**
         * Create an WireFrame 2D primitive
         * @param wireFrameGroups an array of WireFrameGroup.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - size: the size of the sprite displayed in the canvas, if not specified the spriteSize will be used
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - alignToPixel: the rendered lines will be aligned to the rendering device' pixels
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(wireFrameGroups: Array<WireFrameGroup2D>, settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            size?: Size;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            alignToPixel?: boolean;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        /**
         * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
         */
        alignToPixel: boolean;
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): WireFrame2DRenderCache;
        _updateVertexBuffer(mrc: WireFrame2DRenderCache): void;
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private _computeMinMaxTrans();
        protected createInstanceDataParts(): InstanceDataBase[];
        private _vtxTransparent;
        private _wireFrameGroups;
        private _alignToPixel;
    }
    class WireFrame2DInstanceData extends InstanceDataBase {
        constructor(partId: number);
    }
}

declare module BABYLON {
    class Rectangle2DRenderCache extends ModelRenderCache {
        effectsReady: boolean;
        fillVB: WebGLBuffer;
        fillIB: WebGLBuffer;
        fillIndicesCount: number;
        instancingFillAttributes: InstancingAttributeInfo[];
        effectFill: Effect;
        effectFillInstanced: Effect;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        borderIndicesCount: number;
        instancingBorderAttributes: InstancingAttributeInfo[];
        effectBorder: Effect;
        effectBorderInstanced: Effect;
        constructor(engine: Engine, modelKey: string);
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        dispose(): boolean;
    }
    class Rectangle2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number);
        properties: Vector3;
    }
    class Rectangle2D extends Shape2D {
        static actualSizeProperty: Prim2DPropInfo;
        static notRoundedProperty: Prim2DPropInfo;
        static roundRadiusProperty: Prim2DPropInfo;
        notRounded: boolean;
        roundRadius: number;
        private static _i0;
        private static _i1;
        private static _i2;
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        protected updateLevelBoundingInfo(): boolean;
        /**
         * Create an Rectangle 2D Shape primitive. May be a sharp rectangle (with sharp corners), or a rounded one.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y settings can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the primitive will be aligned to the target rendering device's pixel
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height settings can be set. Default will be [10;10].
         * - roundRadius: if the rectangle has rounded corner, set their radius, default is 0 (to get a sharp edges rectangle).
         * - fill: the brush used to draw the fill content of the rectangle, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the rectangle, you can set null to draw nothing (but you will have to set a fill brush), default is null. can also be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            alignToPixel?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            size?: Size;
            width?: number;
            height?: number;
            roundRadius?: number;
            fill?: IBrush2D | string;
            border?: IBrush2D | string;
            borderThickness?: number;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        static roundSubdivisions: number;
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        protected updateTriArray(): void;
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): Rectangle2DRenderCache;
        protected _getInitialContentAreaToRef(primSize: Size, initialContentPosition: Vector4, initialContentArea: Size): void;
        protected _getActualSizeFromContentToRef(primSize: Size, paddingOffset: Vector4, newPrimSize: Size): void;
        protected createInstanceDataParts(): InstanceDataBase[];
        private static _riv0;
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private _notRounded;
        private _roundRadius;
    }
}

declare module BABYLON {
    class Ellipse2DRenderCache extends ModelRenderCache {
        effectsReady: boolean;
        fillVB: WebGLBuffer;
        fillIB: WebGLBuffer;
        fillIndicesCount: number;
        instancingFillAttributes: InstancingAttributeInfo[];
        effectFillInstanced: Effect;
        effectFill: Effect;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        borderIndicesCount: number;
        instancingBorderAttributes: InstancingAttributeInfo[];
        effectBorderInstanced: Effect;
        effectBorder: Effect;
        constructor(engine: Engine, modelKey: string);
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        dispose(): boolean;
    }
    class Ellipse2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number);
        properties: Vector3;
    }
    class Ellipse2D extends Shape2D {
        static acutalSizeProperty: Prim2DPropInfo;
        static subdivisionsProperty: Prim2DPropInfo;
        subdivisions: number;
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        protected updateLevelBoundingInfo(): boolean;
        /**
         * Create an Ellipse 2D Shape primitive
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id: a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the primitive will be aligned to the target rendering device's pixel
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height properties can be set. Default will be [10;10].
         * - subdivision: the number of subdivision to create the ellipse perimeter, default is 64.
         * - fill: the brush used to draw the fill content of the ellipse, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the ellipse, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the group must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            alignToPixel?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            size?: Size;
            width?: number;
            height?: number;
            subdivisions?: number;
            fill?: IBrush2D | string;
            border?: IBrush2D | string;
            borderThickness?: number;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        protected updateTriArray(): void;
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): Ellipse2DRenderCache;
        protected createInstanceDataParts(): InstanceDataBase[];
        private static _riv0;
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private _subdivisions;
    }
}

declare module BABYLON {
    class Sprite2DRenderCache extends ModelRenderCache {
        effectsReady: boolean;
        vb: WebGLBuffer;
        ib: WebGLBuffer;
        instancingAttributes: InstancingAttributeInfo[];
        texture: Texture;
        effect: Effect;
        effectInstanced: Effect;
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        dispose(): boolean;
    }
    class Sprite2D extends RenderablePrim2D {
        static SPRITE2D_MAINPARTID: number;
        static SHAPE2D_CATEGORY_SCALE9: string;
        static textureProperty: Prim2DPropInfo;
        static useAlphaFromTextureProperty: Prim2DPropInfo;
        static actualSizeProperty: Prim2DPropInfo;
        static spriteSizeProperty: Prim2DPropInfo;
        static spriteLocationProperty: Prim2DPropInfo;
        static spriteFrameProperty: Prim2DPropInfo;
        static invertYProperty: Prim2DPropInfo;
        static spriteScale9Property: Prim2DPropInfo;
        texture: Texture;
        useAlphaFromTexture: boolean;
        size: Size;
        spriteSize: Size;
        spriteLocation: Vector2;
        spriteFrame: number;
        invertY: boolean;
        readonly isScale9: boolean;
        protected updateLevelBoundingInfo(): boolean;
        /**
         * Get the animatable array (see http://doc.babylonjs.com/tutorials/Animations)
         */
        getAnimatables(): IAnimatable[];
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        readonly isSizeAuto: boolean;
        /**
         * Create an 2D Sprite primitive
         * @param texture the texture that stores the sprite to render
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - size: the size of the sprite displayed in the canvas, if not specified the spriteSize will be used
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the sprite's texels will be aligned to the rendering viewport pixels, ensuring the best rendering quality but slow animations won't be done as smooth as if you set false. If false a texel could lies between two pixels, being blended by the texture sampling mode you choose, the rendering result won't be as good, but very slow animation will be overall better looking. Default is true: content will be aligned.
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - spriteSize: the size of the sprite (in pixels) as it is stored in the texture, if null the size of the given texture will be used, default is null.
         * - spriteLocation: the location (in pixels) in the texture of the top/left corner of the Sprite to display, default is null (0,0)
         * - scale9: draw the sprite as a Scale9 sprite, see http://yannickloriot.com/2013/03/9-patch-technique-in-cocos2d/ for more info. x, y, w, z are left, bottom, right, top coordinate of the resizable box
         * - invertY: if true the texture Y will be inverted, default is false.
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(texture: Texture, settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            size?: Size;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            alignToPixel?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            spriteSize?: Size;
            spriteLocation?: Vector2;
            spriteScaleFactor?: Vector2;
            scale9?: Vector4;
            invertY?: boolean;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): Sprite2DRenderCache;
        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[];
        protected createInstanceDataParts(): InstanceDataBase[];
        private static _prop;
        private static layoutConstructMode;
        protected beforeRefreshForLayoutConstruction(part: InstanceDataBase): any;
        protected afterRefreshForLayoutConstruction(part: InstanceDataBase, obj: any): void;
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        protected _mustUpdateInstance(): boolean;
        protected _useTextureAlpha(): boolean;
        protected _shouldUseAlphaFromTexture(): boolean;
        private _updateSpriteScaleFactor();
        private _texture;
        private _oldTextureHasAlpha;
        private _useAlphaFromTexture;
        private _useSize;
        private _spriteLocation;
        private _spriteSize;
        private _spriteFrame;
        private _scale9;
        private _invertY;
    }
    class Sprite2DInstanceData extends InstanceDataBase {
        constructor(partId: number);
        topLeftUV: Vector2;
        sizeUV: Vector2;
        scaleFactor: Vector2;
        textureSize: Vector2;
        properties: Vector3;
        scale9: Vector4;
    }
}

declare module BABYLON {
    /**
     * Interface to create your own Loader of Atlas Data file.
     * Call the AtlasPictureInfoFactory.addLoader to addd your loader instance
     */
    interface IAtlasLoader {
        loadFile(content: any): {
            api: AtlasPictureInfo;
            errorMsg: string;
            errorCode: number;
        };
    }
    /**
     * This class will contains information about a sub picture present in an Atlas Picture.
     */
    class AtlasSubPictureInfo {
        /**
         * Name of the SubPicture, generally the filename of the initial picture file.
         */
        name: string;
        /**
         * Location of the bottom/left corner of the sub picture from the bottom/left corner the Atlas Picture
         */
        location: Vector2;
        /**
         * Size in pixel of the sub picture
         */
        size: Size;
    }
    /**
     * This class represent an Atlas Picture, it contains the information of all the sub pictures and the Texture that stores the bitmap.
     * You get an instance of this class using methods of the AtlasPictureInfoFactory
     */
    class AtlasPictureInfo {
        /**
         * Creates many sprite from the Atlas Picture
         * @param filterCallback a predicate if true is returned then the corresponding sub picture will be used to create a sprite.
         * The Predicate has many parameters:
         *  - index: just an index incremented at each sub picture submitted for Sprite creation
         *  - name: the sub picture's name
         *  - aspi: the AtlasSubPictureInfo corresponding to the submitted sub picture
         *  - settings: the Sprite2D creation settings, you can alter this JSON object but BEWARE, the alterations will be kept for subsequent Sprite2D creations!
         * @param spriteSettings The Sprite2D settings to use for Sprite creation, this JSON object will be passed to the filterCallback for you to alter it, if needed.
         */
        createSprites(filterCallback: (index: number, name: string, aspi: AtlasSubPictureInfo, settings: any) => boolean, spriteSettings: {
            parent?: Prim2DBase;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            size?: Size;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            scale9?: Vector4;
            invertY?: boolean;
            alignToPixel?: boolean;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
        }): Array<Sprite2D>;
        /**
         * Create one Sprite from a sub picture
         * @param subPictureName the name of the sub picture to use
         * @param spriteSettings the Sprite2D settings to use for the Sprite instance creation
         */
        createSprite(subPictureName: string, spriteSettings: {
            parent?: Prim2DBase;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            size?: Size;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            scale9?: Vector4;
            invertY?: boolean;
            alignToPixel?: boolean;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
        }): Sprite2D;
        /**
         * Size of the Atlas Picture
         */
        atlasSize: Size;
        /**
         * String Dictionary of all the sub pictures, the key is the sub picture's name, the value is the info object
         */
        subPictures: StringDictionary<AtlasSubPictureInfo>;
        /**
         * The Texture associated to the Atlas Picture info
         */
        texture: Texture;
    }
    /**
     * This if the Factory class containing static method to create Atlas Pictures Info objects or add new loaders
     */
    class AtlasPictureInfoFactory {
        /**
         * Add a custom loader
         * @param fileExtension must be the file extension (without the dot) of the file that is loaded by this loader (e.g.: json)
         * @param plugin the instance of the loader
         */
        static addLoader(fileExtension: string, plugin: IAtlasLoader): void;
        /**
         * Load an Atlas Picture Info object from a data file at a given url and with a given texture
         * @param texture the texture containing the atlas bitmap
         * @param url the URL of the Atlas Info data file
         * @param onLoad a callback that will be called when the AtlasPictureInfo object will be loaded and ready
         * @param onError a callback that will be called in case of error
         */
        static loadFromUrl(texture: Texture, url: string, onLoad: (api: AtlasPictureInfo) => void, onError?: (msg: string, code: number) => void): any;
        private static plugins;
    }
    /**
     * Use this decorator when you declare an Atlas Loader Class for the loader to register itself automatically.
     * @param fileExtension the extension of the file that the plugin is loading (there can be many plugin for the same extension)
     * @param plugin an instance of the plugin class to add to the AtlasPictureInfoFactory
     */
    function AtlasLoaderPlugin(fileExtension: string, plugin: IAtlasLoader): (target: Object) => void;
}

declare module BABYLON {
    class Text2DRenderCache extends ModelRenderCache {
        effectsReady: boolean;
        vb: WebGLBuffer;
        ib: WebGLBuffer;
        instancingAttributes: InstancingAttributeInfo[];
        fontTexture: BaseFontTexture;
        effect: Effect;
        effectInstanced: Effect;
        fontPremulAlpha: boolean;
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        dispose(): boolean;
    }
    class Text2DInstanceData extends InstanceDataBase {
        constructor(partId: number, dataElementCount: number);
        topLeftUV: Vector2;
        sizeUV: Vector2;
        textureSize: Vector2;
        color: Color4;
        superSampleFactor: number;
    }
    class Text2D extends RenderablePrim2D {
        static TEXT2D_MAINPARTID: number;
        static TEXT2D_CATEGORY_SDF: string;
        static TEXT2D_CATEGORY_FONTTEXTURE: string;
        static fontProperty: Prim2DPropInfo;
        static defaultFontColorProperty: Prim2DPropInfo;
        static textProperty: Prim2DPropInfo;
        static sizeProperty: Prim2DPropInfo;
        static fontSuperSampleProperty: Prim2DPropInfo;
        static fontSignedDistanceFieldProperty: Prim2DPropInfo;
        static textureIsPremulAlphaProperty: Prim2DPropInfo;
        static fontTextureProperty: Prim2DPropInfo;
        /**
         * Alignment is made relative to the left edge of the Content Area. Valid for horizontal alignment only.
         */
        static readonly AlignLeft: number;
        /**
         * Alignment is made relative to the top edge of the Content Area. Valid for vertical alignment only.
         */
        static readonly AlignTop: number;
        /**
         * Alignment is made relative to the right edge of the Content Area. Valid for horizontal alignment only.
         */
        static readonly AlignRight: number;
        /**
         * Alignment is made relative to the bottom edge of the Content Area. Valid for vertical alignment only.
         */
        static readonly AlignBottom: number;
        /**
         * Alignment is made to center the text from equal distance to the opposite edges of the Content Area
         */
        static readonly AlignCenter: number;
        private static _AlignLeft;
        private static _AlignTop;
        private static _AlignRight;
        private static _AlignBottom;
        private static _AlignCenter;
        fontName: string;
        defaultFontColor: Color4;
        text: string;
        size: Size;
        readonly fontSuperSample: boolean;
        readonly fontSignedDistanceField: boolean;
        textureIsPremulAlpha: boolean;
        readonly isSizeAuto: boolean;
        readonly isVerticalSizeAuto: boolean;
        readonly isHorizontalSizeAuto: boolean;
        /**
         * Get the area that bounds the text associated to the primitive
         */
        readonly textSize: Size;
        protected onSetOwner(): void;
        readonly fontTexture: BaseFontTexture;
        /**
         * Dispose the primitive, remove it from its parent
         */
        dispose(): boolean;
        protected updateLevelBoundingInfo(): boolean;
        /**
         * You can get/set the text alignment through this property
         */
        textAlignment: string;
        /**
         * Create a Text primitive
         * @param text the text to display
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the primitive will be aligned to the target rendering device's pixel
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fontName: the name/size/style of the font to use, following the CSS notation. Default is "12pt Arial".
         * - fontSuperSample: if true the text will be rendered with a superSampled font (the font is twice the given size). Use this settings if the text lies in world space or if it's scaled in.
         * - signedDistanceField: if true the text will be rendered using the SignedDistanceField technique. This technique has the advantage to be rendered order independent (then much less drawing calls), but only works on font that are a little more than one pixel wide on the screen but the rendering quality is excellent whatever the font size is on the screen (which is the purpose of this technique). Outlining/Shadow is not supported right now. If you can, you should use this mode, the quality and the performances are the best. Note that fontSuperSample has no effect when this mode is on.
         * - bitmapFontTexture: set a BitmapFontTexture to use instead of a fontName.
         * - defaultFontColor: the color by default to apply on each letter of the text to display, default is plain white.
         * - useBilinearFiltering: if true a FontTexture using Bilinear filtering will be used, if false a FontTexture using Nearest filtering will be used. If not specified then bilinear will be chosen for Signed Distance Field mode or a Text2D inside a WorldSpaceCanvas2D, otherwise nearest will be chose.
         * - areaSize: the size of the area in which to display the text, default is auto-fit from text content.
         * - tabulationSize: number of space character to insert when a tabulation is encountered, default is 4
         * - isVisible: true if the text must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         * - textAlignmentH: align text horizontally (Text2D.AlignLeft, Text2D.AlignCenter, Text2D.AlignRight)
         * - textAlignmentV: align text vertically (Text2D.AlignTop, Text2D.AlignCenter, Text2D.AlignBottom)
         * - textAlignment: a string defining the text alignment, text can be: [<h:|horizontal:><left|right|center>], [<v:|vertical:><top|bottom|center>]
         * - wordWrap: if true the text will wrap inside content area
         */
        constructor(text: string, settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            alignToPixel?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            fontName?: string;
            fontSuperSample?: boolean;
            fontSignedDistanceField?: boolean;
            bitmapFontTexture?: BitmapFontTexture;
            defaultFontColor?: Color4;
            useBilinearFiltering?: boolean;
            size?: Size;
            tabulationSize?: number;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
            textAlignmentH?: number;
            textAlignmentV?: number;
            textAlignment?: string;
            wordWrap?: boolean;
        });
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): Text2DRenderCache;
        protected createInstanceDataParts(): InstanceDataBase[];
        protected beforeRefreshForLayoutConstruction(part: InstanceDataBase): any;
        protected afterRefreshForLayoutConstruction(part: InstanceDataBase, obj: any): void;
        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[];
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private _isWhiteSpaceCharHoriz(char);
        private _isWhiteSpaceCharVert(char);
        private _updateCharCount();
        private _setTextAlignmentfromString(value);
        private _setTextAlignmentHorizontal(text);
        private _setTextAlignmentVertical(text);
        protected _useTextureAlpha(): boolean;
        protected _shouldUseAlphaFromTexture(): boolean;
        private _fontTexture;
        private _tabulationSize;
        private _charCount;
        private _fontName;
        private _fontSuperSample;
        private _fontSDF;
        private _defaultFontColor;
        private _text;
        private _textSize;
        private _wordWrap;
        private _textAlignment;
        private _sizeSetByUser;
        private _textureIsPremulAlpha;
        private _useBilinearFiltering;
        private _fontBilinearFiltering;
        textAlignmentH: number;
        textAlignmentV: number;
    }
}

declare module BABYLON {
    class Lines2DRenderCache extends ModelRenderCache {
        effectsReady: boolean;
        fillVB: WebGLBuffer;
        fillIB: WebGLBuffer;
        fillIndicesCount: number;
        instancingFillAttributes: InstancingAttributeInfo[];
        effectFill: Effect;
        effectFillInstanced: Effect;
        borderVB: WebGLBuffer;
        borderIB: WebGLBuffer;
        borderIndicesCount: number;
        instancingBorderAttributes: InstancingAttributeInfo[];
        effectBorder: Effect;
        effectBorderInstanced: Effect;
        constructor(engine: Engine, modelKey: string);
        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean;
        dispose(): boolean;
    }
    class Lines2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number);
        boundingMin: Vector2;
        boundingMax: Vector2;
    }
    class Lines2D extends Shape2D {
        /**
         * No Cap to apply on the extremity
         */
        static readonly NoCap: number;
        /**
         * A round cap, will use the line thickness as diameter
         */
        static readonly RoundCap: number;
        /**
         * Creates a triangle at the extremity.
         */
        static readonly TriangleCap: number;
        /**
         * Creates a Square anchor at the extremity, the square size is twice the thickness of the line
         */
        static readonly SquareAnchorCap: number;
        /**
         * Creates a round anchor at the extremity, the diameter is twice the thickness of the line
         */
        static readonly RoundAnchorCap: number;
        /**
         * Creates a diamond anchor at the extremity.
         */
        static readonly DiamondAnchorCap: number;
        /**
         * Creates an arrow anchor at the extremity. the arrow base size is twice the thickness of the line
         */
        static readonly ArrowCap: number;
        static pointsProperty: Prim2DPropInfo;
        static fillThicknessProperty: Prim2DPropInfo;
        static closedProperty: Prim2DPropInfo;
        static startCapProperty: Prim2DPropInfo;
        static endCapProperty: Prim2DPropInfo;
        points: Vector2[];
        fillThickness: number;
        closed: boolean;
        startCap: number;
        endCap: number;
        private static _prevA;
        private static _prevB;
        private static _curA;
        private static _curB;
        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean;
        protected readonly boundingMin: Vector2;
        protected readonly boundingMax: Vector2;
        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[];
        protected updateLevelBoundingInfo(): boolean;
        /**
         * Create an 2D Lines Shape primitive. The defined lines may be opened or closed (see below)
         * @param points an array that describe the points to use to draw the line, must contain at least two entries.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the primitive will be aligned to the target rendering device's pixel
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - fillThickness: the thickness of the fill part of the line, can be null to draw nothing (but a border brush must be given), default is 1.
         * - closed: if false the lines are said to be opened, the first point and the latest DON'T connect. if true the lines are said to be closed, the first and last point will be connected by a line. For instance you can define the 4 points of a rectangle, if you set closed to true a 4 edges rectangle will be drawn. If you set false, only three edges will be drawn, the edge formed by the first and last point won't exist. Default is false.
         * - startCap: Draw a cap of the given type at the start of the first line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - endCap: Draw a cap of the given type at the end of the last line, you can't define a Cap if the Lines2D is closed. Default is Lines2D.NoCap.
         * - fill: the brush used to draw the fill content of the lines, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the lines, you can set null to draw nothing (but you will have to set a fill brush), default is null. can be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(points: Vector2[], settings?: {
            parent?: Prim2DBase;
            children?: Array<Prim2DBase>;
            id?: string;
            position?: Vector2;
            x?: number;
            y?: number;
            rotation?: number;
            scale?: number;
            scaleX?: number;
            scaleY?: number;
            dontInheritParentScale?: boolean;
            alignToPixel?: boolean;
            opacity?: number;
            zOrder?: number;
            origin?: Vector2;
            fillThickness?: number;
            closed?: boolean;
            startCap?: number;
            endCap?: number;
            fill?: IBrush2D | string;
            border?: IBrush2D | string;
            borderThickness?: number;
            isVisible?: boolean;
            isPickable?: boolean;
            isContainer?: boolean;
            childrenFlatZOrder?: boolean;
            levelCollision?: boolean;
            deepCollision?: boolean;
            layoutData?: ILayoutData;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: number | string;
        });
        protected createModelRenderCache(modelKey: string): ModelRenderCache;
        private _perp(v, res);
        private _direction(a, b, res);
        private static _miterTps;
        private _computeMiter(tangent, miter, a, b);
        private _intersect(x1, y1, x2, y2, x3, y3, x4, y4);
        private _updateMinMax(array, offset);
        private static _startDir;
        private static _endDir;
        private _store(array, contour, index, max, p, n, halfThickness, borderThickness, detectFlip?);
        private _getCapSize(type, border?);
        private static _tpsV;
        private _storeVertex(vb, baseOffset, index, basePos, rotation, vertex, contour);
        private _storeIndex(ib, baseOffset, index, vertexIndex);
        private _buildCap(vb, vbi, ib, ibi, pos, thickness, borderThickness, type, capDir, contour);
        private _buildLine(vb, contour, ht, bt?);
        protected setupModelRenderCache(modelRenderCache: ModelRenderCache): Lines2DRenderCache;
        protected updateTriArray(): void;
        private _computeLines2D();
        readonly size: Size;
        protected createInstanceDataParts(): InstanceDataBase[];
        protected applyActualScaleOnTransform(): boolean;
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean;
        private static _noCap;
        private static _roundCap;
        private static _triangleCap;
        private static _squareAnchorCap;
        private static _roundAnchorCap;
        private static _diamondAnchorCap;
        private static _arrowCap;
        private static _roundCapSubDiv;
        private _fillVB;
        private _fillIB;
        private _borderVB;
        private _borderIB;
        private _boundingMin;
        private _boundingMax;
        private _closed;
        private _startCap;
        private _endCap;
        private _fillThickness;
        private _points;
    }
}

declare module BABYLON {
    class Canvas2DEngineBoundData {
        GetOrAddModelCache<TInstData>(key: string, factory: (key: string) => ModelRenderCache): ModelRenderCache;
        private _modelCache;
        DisposeModelRenderCache(modelRenderCache: ModelRenderCache): boolean;
    }
    abstract class Canvas2D extends Group2D {
        /**
         * In this strategy only the direct children groups of the Canvas will be cached, their whole content (whatever the sub groups they have) into a single bitmap.
         * This strategy doesn't allow primitives added directly as children of the Canvas.
         * You typically want to use this strategy of a screenSpace fullscreen canvas: you don't want a bitmap cache taking the whole screen resolution but still want the main contents (say UI in the topLeft and rightBottom for instance) to be efficiently cached.
         */
        static CACHESTRATEGY_TOPLEVELGROUPS: number;
        /**
         * In this strategy each group will have its own cache bitmap (except if a given group explicitly defines the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors).
         * This strategy is typically used if the canvas has some groups that are frequently animated. Unchanged ones will have a steady cache and the others will be refreshed when they change, reducing the redraw operation count to their content only.
         * When using this strategy, group instances can rely on the DONTCACHEOVERRIDE or CACHEINPARENTGROUP behaviors to minimize the amount of cached bitmaps.
         * Note that in this mode the Canvas itself is not cached, it only contains the sprites of its direct children group to render, there's no point to cache the whole canvas, sprites will be rendered pretty efficiently, the memory cost would be too great for the value of it.
         */
        static CACHESTRATEGY_ALLGROUPS: number;
        /**
         * In this strategy the whole canvas is cached into a single bitmap containing every primitives it owns, at the exception of the ones that are owned by a group having the DONTCACHEOVERRIDE behavior (these primitives will be directly drawn to the viewport at each render for screenSpace Canvas or be part of the Canvas cache bitmap for worldSpace Canvas).
         */
        static CACHESTRATEGY_CANVAS: number;
        /**
         * This strategy is used to recompose/redraw the canvas entirely at each viewport render.
         * Use this strategy if memory is a concern above rendering performances and/or if the canvas is frequently animated (hence reducing the benefits of caching).
         * Note that you can't use this strategy for WorldSpace Canvas, they need at least a top level group caching.
         */
        static CACHESTRATEGY_DONTCACHE: number;
        /**
         * Observable Mask to be notified before rendering is made
         */
        static RENDEROBSERVABLE_PRE: number;
        /**
         * Observable Mask to be notified after rendering is made
         */
        static RENDEROBSERVABLE_POST: number;
        private static _INSTANCES;
        constructor(scene: Scene, settings?: {
            id?: string;
            children?: Array<Prim2DBase>;
            size?: Size;
            renderingPhase?: {
                camera: Camera;
                renderingGroupID: number;
            };
            designSize?: Size;
            designUseHorizAxis?: boolean;
            isScreenSpace?: boolean;
            cachingStrategy?: number;
            enableInteraction?: boolean;
            enableCollisionManager?: boolean;
            customCollisionManager?: (owner: Canvas2D, enableBorders: boolean) => PrimitiveCollisionManagerBase;
            collisionManagerUseBorders?: boolean;
            origin?: Vector2;
            isVisible?: boolean;
            backgroundRoundRadius?: number;
            backgroundFill?: IBrush2D | string;
            backgroundBorder?: IBrush2D | string;
            backgroundBorderThickNess?: number;
        });
        readonly drawCallsOpaqueCounter: PerfCounter;
        readonly drawCallsAlphaTestCounter: PerfCounter;
        readonly drawCallsTransparentCounter: PerfCounter;
        readonly groupRenderCounter: PerfCounter;
        readonly updateTransparentDataCounter: PerfCounter;
        readonly updateCachedStateCounter: PerfCounter;
        readonly updateLayoutCounter: PerfCounter;
        readonly updatePositioningCounter: PerfCounter;
        readonly updateLocalTransformCounter: PerfCounter;
        readonly updateGlobalTransformCounter: PerfCounter;
        readonly boundingInfoRecomputeCounter: PerfCounter;
        readonly layoutBoundingInfoUpdateCounter: PerfCounter;
        readonly canvasRenderTimeCounter: PerfCounter;
        static readonly instances: Array<Canvas2D>;
        readonly primitiveCollisionManager: PrimitiveCollisionManagerBase;
        protected _canvasPreInit(settings: any): void;
        static _zMinDelta: number;
        private _setupInteraction(enable);
        /**
         * If you set your own WorldSpaceNode to display the Canvas2D you have to provide your own implementation of this method which computes the local position in the Canvas based on the given 3D World one.
         * Beware that you have to take under consideration the origin and unitScaleFactor in your calculations! Good luck!
         */
        worldSpaceToNodeLocal: (worldPos: Vector3) => Vector2;
        /**
         * If you use a custom WorldSpaceCanvasNode you have to override this property to update the UV of your object to reflect the changes due to a resizing of the cached bitmap
         */
        worldSpaceCacheChanged: () => void;
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        _setPointerCapture(pointerId: number, primitive: Prim2DBase): boolean;
        /**
         * Internal method, you should use the Prim2DBase version instead
         */
        _releasePointerCapture(pointerId: number, primitive: Prim2DBase): boolean;
        /**
         * Determine if the given pointer is captured or not
         * @param pointerId the Id of the pointer
         * @return true if it's captured, false otherwise
         */
        isPointerCaptured(pointerId: number): boolean;
        private getCapturedPrimitive(pointerId);
        private static _interInfo;
        private _handlePointerEventForInteraction(eventData, localPosition, eventState);
        private _updatePointerInfo(eventData, localPosition);
        private _updateIntersectionList(mouseLocalPos, isCapture, force);
        private _updateOverStatus(force);
        private _updatePrimPointerPos(prim);
        private _notifDebugMode;
        private _debugExecObserver(prim, mask);
        private _bubbleNotifyPrimPointerObserver(prim, mask, eventData);
        private _triggerActionManager(prim, ppi, mask, eventData);
        /**
         * Don't forget to call the dispose method when you're done with the Canvas instance.
         * But don't worry, if you dispose its scene, the canvas will be automatically disposed too.
         */
        dispose(): boolean;
        /**
         * Accessor to the Scene that owns the Canvas
         * @returns The instance of the Scene object
         */
        readonly scene: Scene;
        /**
         * Accessor to the Engine that drives the Scene used by this Canvas
         * @returns The instance of the Engine object
         */
        readonly engine: Engine;
        /**
         * And observable called during the Canvas rendering process.
         * This observable is called twice per render, each time with a different mask:
         *  - 1: before render is executed
         *  - 2: after render is executed
         */
        readonly renderObservable: Observable<Canvas2D>;
        /**
         * Accessor of the Caching Strategy used by this Canvas.
         * See Canvas2D.CACHESTRATEGY_xxxx static members for more information
         * @returns the value corresponding to the used strategy.
         */
        readonly cachingStrategy: number;
        /**
         * Return true if the Canvas is a Screen Space one, false if it's a World Space one.
         * @returns {}
         */
        readonly isScreenSpace: boolean;
        /**
         * Only valid for World Space Canvas, returns the scene node that displays the canvas
         */
        worldSpaceCanvasNode: Node;
        /**
         * Check if the WebGL Instanced Array extension is supported or not
         */
        readonly supportInstancedArray: boolean;
        /**
         * Property that defines the fill object used to draw the background of the Canvas.
         * Note that Canvas with a Caching Strategy of
         * @returns If the background is not set, null will be returned, otherwise a valid fill object is returned.
         */
        backgroundFill: IBrush2D;
        /**
         * Property that defines the border object used to draw the background of the Canvas.
         * @returns If the background is not set, null will be returned, otherwise a valid border object is returned.
         */
        backgroundBorder: IBrush2D;
        /**
         * Property that defines the thickness of the border object used to draw the background of the Canvas.
         * @returns If the background is not set, null will be returned, otherwise a valid number matching the thickness is returned.
         */
        backgroundBorderThickness: number;
        /**
         * You can set the roundRadius of the background
         * @returns The current roundRadius
         */
        backgroundRoundRadius: number;
        /**
         * Enable/Disable interaction for this Canvas
         * When enabled the Prim2DBase.pointerEventObservable property will notified when appropriate events occur
         */
        interactionEnabled: boolean;
        readonly fitRenderingDevice: boolean;
        readonly designSize: Size;
        readonly designSizeUseHorizAxis: boolean;
        designSizeUseHorizeAxis: boolean;
        /**
         * Return
         */
        readonly overPrim: Prim2DBase;
        /**
         * Access the babylon.js' engine bound data, do not invoke this method, it's for internal purpose only
         * @returns {}
         */
        readonly _engineData: Canvas2DEngineBoundData;
        readonly unitScaleFactor: number;
        createCanvasProfileInfoCanvas(): Canvas2D;
        /**
         * Instanced Array will be create if there's at least this number of parts/prim that can fit into it
         */
        minPartCountToUseInstancedArray: number;
        private checkBackgroundAvailability();
        private _initPerfMetrics();
        private _fetchPerfMetrics();
        private _updateProfileCanvas();
        _addDrawCallCount(count: number, renderMode: number): void;
        _addGroupRenderCount(count: number): void;
        _addUpdateTransparentDataCount(count: number): void;
        addUpdateCachedStateCounter(count: number): void;
        addUpdateLayoutCounter(count: number): void;
        addUpdatePositioningCounter(count: number): void;
        addupdateLocalTransformCounter(count: number): void;
        addUpdateGlobalTransformCounter(count: number): void;
        addLayoutBoundingInfoUpdateCounter(count: number): void;
        private _renderObservable;
        private __engineData;
        private _interactionEnabled;
        private _primPointerInfo;
        private _updateRenderId;
        private _intersectionRenderId;
        private _hoverStatusRenderId;
        private _pickStartingPosition;
        private _pickedDownPrim;
        private _pickStartingTime;
        private _previousIntersectionList;
        private _actualIntersectionList;
        private _previousOverPrimitive;
        private _actualOverPrimitive;
        private _capturedPointers;
        private _scenePrePointerObserver;
        private _scenePointerObserver;
        protected _worldSpaceNode: Node;
        private _mapCounter;
        private _background;
        private _scene;
        private _engine;
        private _fitRenderingDevice;
        private _isScreenSpace;
        private _cachedCanvasGroup;
        private _cachingStrategy;
        private _hierarchyLevelMaxSiblingCount;
        private _groupCacheMaps;
        private _renderingGroupObserver;
        private _beforeRenderObserver;
        private _afterRenderObserver;
        private _supprtInstancedArray;
        protected _unitScaleFactor: number;
        private _trackedGroups;
        protected _trackNode: Node;
        protected _trackNodeOffset: Vector3;
        protected _trackNodeBillboard: boolean;
        protected _maxAdaptiveWorldSpaceCanvasSize: number;
        private _designSize;
        private _designUseHorizAxis;
        _primitiveCollisionManager: PrimitiveCollisionManagerBase;
        _canvasLevelScale: Vector2;
        _renderingSize: Size;
        private _curHWScale;
        private _drawCallsOpaqueCounter;
        private _drawCallsAlphaTestCounter;
        private _drawCallsTransparentCounter;
        private _groupRenderCounter;
        private _updateTransparentDataCounter;
        private _updateCachedStateCounter;
        private _updateLayoutCounter;
        private _updatePositioningCounter;
        private _updateGlobalTransformCounter;
        private _updateLocalTransformCounter;
        private _boundingInfoRecomputeCounter;
        private _layoutBoundingInfoUpdateCounter;
        private _canvasRenderTimeCounter;
        private _profilingCanvas;
        private _profileInfoText;
        private static _v;
        private static _cv1;
        private static _m;
        private static _mI;
        private static tS;
        private static tT;
        private static tR;
        private static _tmpMtx;
        private static _tmpVec3;
        private _updateTrackedNodes();
        /**
         * Call this method change you want to have layout related data computed and up to date (layout area, primitive area, local/global transformation matrices)
         */
        updateCanvasLayout(forceRecompute: boolean): void;
        private _updateAdaptiveSizeWorldCanvas();
        private static _pCLS;
        private _updateCanvasState(forceRecompute);
        /**
         * Method that renders the Canvas, you should not invoke
         */
        private _render();
        /**
         * Internal method that allocate a cache for the given group.
         * Caching is made using a collection of MapTexture where many groups have their bitmap cache stored inside.
         * @param group The group to allocate the cache of.
         * @return custom type with the PackedRect instance giving information about the cache location into the texture and also the MapTexture instance that stores the cache.
         */
        _allocateGroupCache(group: Group2D, parent: Group2D, minSize?: Size, useMipMap?: boolean, anisotropicLevel?: number): {
            node: PackedRect;
            texture: MapTexture;
            sprite: Sprite2D;
        };
        /**
         * Define the default size used for both the width and height of a MapTexture to allocate.
         * Note that some MapTexture might be bigger than this size if the first node to allocate is bigger in width or height
         */
        private static _groupTextureCacheSize;
        /**
         * Internal method used to register a Scene Node to track position for the given group
         * Do not invoke this method, for internal purpose only.
         * @param group the group to track its associated Scene Node
         */
        _registerTrackedNode(group: Group2D): void;
        /**
         * Internal method used to unregister a tracked Scene Node
         * Do not invoke this method, it's for internal purpose only.
         * @param group the group to unregister its tracked Scene Node from.
         */
        _unregisterTrackedNode(group: Group2D): void;
        /**
         * Get a Solid Color Brush instance matching the given color.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that use the given color
         */
        static GetSolidColorBrush(color: Color4): IBrush2D;
        /**
         * Get a Solid Color Brush instance matching the given color expressed as a CSS formatted hexadecimal value.
         * @param color The color to retrieve
         * @return A shared instance of the SolidColorBrush2D class that uses the given color
         */
        static GetSolidColorBrushFromHex(hexValue: string): IBrush2D;
        /**
         * Get a Gradient Color Brush
         * @param color1 starting color
         * @param color2 engine color
         * @param translation translation vector to apply. default is [0;0]
         * @param rotation rotation in radian to apply to the brush, initial direction is top to bottom. rotation is counter clockwise. default is 0.
         * @param scale scaling factor to apply. default is 1.
         */
        static GetGradientColorBrush(color1: Color4, color2: Color4, translation?: Vector2, rotation?: number, scale?: number): IBrush2D;
        /**
         * Create a solid or gradient brush from a string value.
         * @param brushString should be either
         *  - "solid: #RRGGBBAA" or "#RRGGBBAA"
         *  - "gradient: #FF808080, #FFFFFFF[, [10:20], 180, 1]" for color1, color2, translation, rotation (degree), scale. The last three are optionals, but if specified must be is this order. "gradient:" can be omitted.
         */
        static GetBrushFromString(brushString: string): IBrush2D;
        private static _solidColorBrushes;
        private static _gradientColorBrushes;
    }
    class WorldSpaceCanvas2D extends Canvas2D {
        /**
         * Create a new 2D WorldSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a world transformation information to place it in the world space.
         * This kind of canvas can't have its Primitives directly drawn in the Viewport, they need to be cached in a bitmap at some point, as a consequence the DONT_CACHE strategy is unavailable. For now only CACHESTRATEGY_CANVAS is supported, but the remaining strategies will be soon.
         * @param scene the Scene that owns the Canvas
         * @param size the dimension of the Canvas in World Space
         * @param settings a combination of settings, possible ones are
         * - children: an array of direct children primitives
         * - id: a text identifier, for information purpose only, default is null.
         * - unitScaleFactor: if specified the created canvas will be with a width of size.width*unitScaleFactor and a height of size.height.unitScaleFactor. If not specified, the unit of 1 is used. You can use this setting when you're dealing with a 3D world with small coordinates and you need a Canvas having bigger coordinates (typically to display text with better quality).
         * - worldPosition the position of the Canvas in World Space, default is [0,0,0]
         * - worldRotation the rotation of the Canvas in World Space, default is Quaternion.Identity()
         * - trackNode: if you want the WorldSpaceCanvas to track the position/rotation/scale of a given Scene Node, use this setting to specify the Node to track
         * - trackNodeOffset: if you use trackNode you may want to specify a 3D Offset to apply to shift the Canvas
         * - trackNodeBillboard: if true the WorldSpaceCanvas will always face the screen
         * - sideOrientation: Unexpected behavior occur if the value is different from Mesh.DEFAULTSIDE right now, so please use this one, which is the default.
         * - cachingStrategy Must be CACHESTRATEGY_CANVAS for now, which is the default.
         * - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is false (the opposite of ScreenSpace).
         * - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - maxAdaptiveCanvasSize: set the max size (width and height) of the bitmap that will contain the cached version of the WorldSpace Canvas. Default is 1024 or less if it's not supported. In any case the value you give will be clipped by the maximum that WebGL supports on the running device. You can set any size, more than 1024 if you want, but testing proved it's a good max value for non "retina" like screens.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(scene: Scene, size: Size, settings?: {
            children?: Array<Prim2DBase>;
            id?: string;
            unitScaleFactor?: number;
            worldPosition?: Vector3;
            worldRotation?: Quaternion;
            trackNode?: Node;
            trackNodeOffset?: Vector3;
            trackNodeBillboard?: boolean;
            sideOrientation?: number;
            cachingStrategy?: number;
            enableInteraction?: boolean;
            isVisible?: boolean;
            backgroundRoundRadius?: number;
            backgroundFill?: IBrush2D | string;
            backgroundBorder?: IBrush2D | string;
            backgroundBorderThickNess?: number;
            customWorldSpaceNode?: Node;
            maxAdaptiveCanvasSize?: number;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
        });
        dispose(): boolean;
        trackNode: Node;
        trackNodeOffset: Vector3;
        trackNodeBillboard: boolean;
        private _customWorldSpaceNode;
    }
    class ScreenSpaceCanvas2D extends Canvas2D {
        /**
         * Create a new 2D ScreenSpace Rendering Canvas, it is a 2D rectangle that has a size (width/height) and a position relative to the bottom/left corner of the screen.
         * ScreenSpace Canvas will be drawn in the Viewport as a 2D Layer lying to the top of the 3D Scene. Typically used for traditional UI.
         * All caching strategies will be available.
         * PLEASE NOTE: the origin of a Screen Space Canvas is set to [0;0] (bottom/left) which is different than the default origin of a Primitive which is centered [0.5;0.5]
         * @param scene the Scene that owns the Canvas
         * @param settings a combination of settings, possible ones are
         *  - children: an array of direct children primitives
         *  - id: a text identifier, for information purpose only
         *  - x: the position along the x axis (horizontal), relative to the left edge of the viewport. you can alternatively use the position setting.
         *  - y: the position along the y axis (vertically), relative to the bottom edge of the viewport. you can alternatively use the position setting.
         *  - position: the position of the canvas, relative from the bottom/left of the scene's viewport. Alternatively you can set the x and y properties directly. Default value is [0, 0]
         *  - width: the width of the Canvas. you can alternatively use the size setting.
         *  - height: the height of the Canvas. you can alternatively use the size setting.
         *  - size: the Size of the canvas. Alternatively the width and height properties can be set. If null two behaviors depend on the cachingStrategy: if it's CACHESTRATEGY_CACHECANVAS then it will always auto-fit the rendering device, in all the other modes it will fit the content of the Canvas
         *  - renderingPhase: you can specify for which camera and which renderGroup this canvas will render to enable interleaving of 3D/2D content through the use of renderinGroup. As a rendering Group is rendered for each camera, you have to specify in the scope of which camera you want the canvas' render to be made. Default behavior will render the Canvas at the very end of the render loop.
         *  - designSize: if you want to set the canvas content based on fixed coordinates whatever the final canvas dimension would be, set this. For instance a designSize of 360*640 will give you the possibility to specify all the children element in this frame. The Canvas' true size will be the HTMLCanvas' size: for instance it could be 720*1280, then a uniform scale of 2 will be applied on the Canvas to keep the absolute coordinates working as expecting. If the ratios of the designSize and the true Canvas size are not the same, then the scale is computed following the designUseHorizAxis member by using either the size of the horizontal axis or the vertical axis.
         *  - designUseHorizAxis: you can set this member if you use designSize to specify which axis is priority to compute the scale when the ratio of the canvas' size is different from the designSize's one.
         *  - cachingStrategy: either CACHESTRATEGY_TOPLEVELGROUPS, CACHESTRATEGY_ALLGROUPS, CACHESTRATEGY_CANVAS, CACHESTRATEGY_DONTCACHE. Please refer to their respective documentation for more information. Default is Canvas2D.CACHESTRATEGY_DONTCACHE
         *  - enableInteraction: if true the pointer events will be listened and rerouted to the appropriate primitives of the Canvas2D through the Prim2DBase.onPointerEventObservable observable property. Default is true.
         *  - isVisible: true if the canvas must be visible, false for hidden. Default is true.
         * - backgroundRoundRadius: the round radius of the background, either backgroundFill or backgroundBorder must be specified.
         * - backgroundFill: the brush to use to create a background fill for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorder: the brush to use to create a background border for the canvas. can be a string value (see BABYLON.Canvas2D.GetBrushFromString) or a IBrush2D instance.
         * - backgroundBorderThickness: if a backgroundBorder is specified, its thickness can be set using this property
         * - customWorldSpaceNode: if specified the Canvas will be rendered in this given Node. But it's the responsibility of the caller to set the "worldSpaceToNodeLocal" property to compute the hit of the mouse ray into the node (in world coordinate system) as well as rendering the cached bitmap in the node itself. The properties cachedRect and cachedTexture of Group2D will give you what you need to do that.
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see BABYLON.PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see BABYLON.PrimitiveThickness.fromString)
         */
        constructor(scene: Scene, settings?: {
            children?: Array<Prim2DBase>;
            id?: string;
            x?: number;
            y?: number;
            position?: Vector2;
            origin?: Vector2;
            width?: number;
            height?: number;
            size?: Size;
            renderingPhase?: {
                camera: Camera;
                renderingGroupID: number;
            };
            designSize?: Size;
            designUseHorizAxis?: boolean;
            cachingStrategy?: number;
            cacheBehavior?: number;
            enableInteraction?: boolean;
            enableCollisionManager?: boolean;
            customCollisionManager?: (owner: Canvas2D, enableBorders: boolean) => PrimitiveCollisionManagerBase;
            collisionManagerUseBorders?: boolean;
            isVisible?: boolean;
            backgroundRoundRadius?: number;
            backgroundFill?: IBrush2D | string;
            backgroundBorder?: IBrush2D | string;
            backgroundBorderThickNess?: number;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
        });
    }
}

declare module BABYLON {
    /**
     * This is the class that is used to display a World Space Canvas into a 3D scene
     */
    class WorldSpaceCanvas2DNode extends Mesh {
        constructor(name: string, scene: Scene, canvas: Canvas2D);
        dispose(): void;
        private _canvas;
    }
}

declare module BABYLON {
    interface ICommand {
        canExecute(parameter: any): boolean;
        execute(parameter: any): void;
        canExecuteChanged: Observable<void>;
    }
    class Command implements ICommand {
        constructor(execute: (p) => void, canExecute: (p) => boolean);
        canExecute(parameter: any): boolean;
        execute(parameter: any): void;
        readonly canExecuteChanged: Observable<void>;
        private _lastCanExecuteResult;
        private _execute;
        private _canExecute;
        private _canExecuteChanged;
    }
    abstract class UIElement extends SmartPropertyBase {
        static readonly enabledState: string;
        static readonly disabledState: string;
        static readonly mouseOverState: string;
        static UIELEMENT_PROPCOUNT: number;
        static parentProperty: Prim2DPropInfo;
        static widthProperty: Prim2DPropInfo;
        static heightProperty: Prim2DPropInfo;
        static minWidthProperty: Prim2DPropInfo;
        static minHeightProperty: Prim2DPropInfo;
        static maxWidthProperty: Prim2DPropInfo;
        static maxHeightProperty: Prim2DPropInfo;
        static actualWidthProperty: Prim2DPropInfo;
        static actualHeightProperty: Prim2DPropInfo;
        static marginProperty: Prim2DPropInfo;
        static paddingProperty: Prim2DPropInfo;
        static marginAlignmentProperty: Prim2DPropInfo;
        static paddingAlignmentProperty: Prim2DPropInfo;
        static isEnabledProperty: Prim2DPropInfo;
        static isFocusedProperty: Prim2DPropInfo;
        static isMouseOverProperty: Prim2DPropInfo;
        constructor(settings: {
            id?: string;
            parent?: UIElement;
            templateName?: string;
            styleName?: string;
            minWidth?: number;
            minHeight?: number;
            maxWidth?: number;
            maxHeight?: number;
            width?: number;
            height?: number;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
            paddingHAlignment?: number;
            paddingVAlignment?: number;
            paddingAlignment?: string;
        });
        dispose(): boolean;
        /**
         * Animation array, more info: http://doc.babylonjs.com/tutorials/Animations
         */
        animations: Animation[];
        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        getAnimatables(): IAnimatable[];
        findById(id: string): UIElement;
        readonly ownerWindow: Window;
        style: string;
        /**
         * A string that identifies the UIElement.
         * The id is optional and there's possible collision with other UIElement's id as the uniqueness is not supported.
         */
        id: string;
        /**
         * Return a unique id automatically generated.
         * This property is mainly used for serialization to ensure a perfect way of identifying a UIElement
         */
        readonly uid: string;
        readonly hierarchyDepth: number;
        parent: UIElement;
        width: number;
        height: number;
        minWidth: number;
        readonly minHheight: number;
        minHeight: number;
        maxWidth: number;
        maxHeight: number;
        actualWidth: number;
        actualHeight: number;
        margin: PrimitiveThickness;
        readonly _hasMargin: boolean;
        padding: PrimitiveThickness;
        private readonly _hasPadding;
        marginAlignment: PrimitiveAlignment;
        /**
         * Check if there a marginAlignment specified (non null and not default)
         */
        readonly _hasMarginAlignment: boolean;
        paddingAlignment: PrimitiveAlignment;
        /**
         * Check if there a marginAlignment specified (non null and not default)
         */
        readonly _hasPaddingAlignment: boolean;
        isVisible: boolean;
        isEnabled: boolean;
        isFocused: boolean;
        isMouseOver: boolean;
        isFocusScope: boolean;
        isFocusable: boolean;
        protected getFocusScope(): UIElement;
        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        _isFlagSet(flag: number): boolean;
        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        _areAllFlagsSet(flags: number): boolean;
        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        _areSomeFlagsSet(flags: number): boolean;
        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        _clearFlags(flags: number): void;
        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        _setFlags(flags: number): number;
        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        _changeFlags(flags: number, state: boolean): void;
        private _assignTemplate(templateName);
        _createVisualTree(): void;
        _patchUIElement(ownerWindow: Window, parent: UIElement): void;
        protected _getDataSource(): IPropertyChanged;
        protected createVisualTree(): void;
        protected readonly visualPlaceholder: Prim2DBase;
        protected readonly visualTemplateRoot: Prim2DBase;
        protected readonly visualChildrenPlaceholder: Prim2DBase;
        protected readonly _position: Vector2;
        protected abstract _getChildren(): Array<UIElement>;
        static flagVisualToBuild: number;
        static flagIsVisible: number;
        static flagIsFocus: number;
        static flagIsFocusScope: number;
        static flagIsFocusable: number;
        static flagIsEnabled: number;
        static flagIsMouseOver: number;
        protected _visualPlaceholder: Group2D;
        protected _visualTemplateRoot: Prim2DBase;
        protected _visualChildrenPlaceholder: Prim2DBase;
        private _renderingTemplateName;
        protected _renderingTemplate: UIElementRenderingTemplateBase;
        private _parent;
        private _hierarchyDepth;
        private _flags;
        private _style;
        private _ownerWindow;
        private _id;
        private _uid;
        private _actualWidth;
        private _actualHeight;
        private _minWidth;
        private _minHeight;
        private _maxWidth;
        private _maxHeight;
        private _width;
        private _height;
        private _margin;
        private _padding;
        private _marginAlignment;
        private _paddingAlignment;
        private static _enableState;
        private static _disabledState;
        private static _mouseOverState;
    }
    abstract class UIElementStyle {
        abstract removeStyle(uiel: UIElement): any;
        abstract applyStyle(uiel: UIElement): any;
        readonly name: string;
    }
    class GUIManager {
        static registerDataTemplate(className: string, factory: (parent: UIElement, dataObject: any) => UIElement): void;
        static getStyle(uiElType: string, styleName: string): UIElementStyle;
        static registerStyle(uiElType: string, templateName: string, style: UIElementStyle): void;
        static stylesByUIElement: StringDictionary<StringDictionary<UIElementStyle>>;
        static DefaultStyleName: string;
        static getRenderingTemplate(uiElType: string, templateName: string): () => UIElementRenderingTemplateBase;
        static registerRenderingTemplate(uiElType: string, templateName: string, factory: () => UIElementRenderingTemplateBase): void;
        static renderingTemplatesByUIElement: StringDictionary<StringDictionary<() => UIElementRenderingTemplateBase>>;
        static DefaultTemplateName: string;
        private static _defaultTemplateName;
        private static _defaultStyleName;
    }
    abstract class UIElementRenderingTemplateBase {
        attach(owner: UIElement): void;
        detach(): void;
        readonly owner: UIElement;
        abstract createVisualTree(owner: UIElement, visualPlaceholder: Group2D): {
            root: Prim2DBase;
            contentPlaceholder: Prim2DBase;
        };
        private _owner;
    }
    function registerWindowRenderingTemplate(uiElType: string, templateName: string, factory: () => UIElementRenderingTemplateBase): (target: Object) => void;
}

declare module BABYLON {
    class StackPanel extends UIElement {
        static STACKPANEL_PROPCOUNT: number;
        static orientationHorizontalProperty: Prim2DPropInfo;
        constructor(settings?: {
            id?: string;
            parent?: UIElement;
            children?: Array<UIElement>;
            templateName?: string;
            styleName?: string;
            isOrientationHorizontal?: any;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
            paddingHAlignment?: number;
            paddingVAlignment?: number;
            paddingAlignment?: string;
        });
        isOrientationHorizontal: boolean;
        protected createVisualTree(): void;
        readonly children: Array<UIElement>;
        protected _getChildren(): Array<UIElement>;
        private _childrenPlaceholder;
        private _children;
        private _isOrientationHorizontal;
    }
    class DefaultStackPanelRenderingTemplate extends UIElementRenderingTemplateBase {
        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): {
            root: Prim2DBase;
            contentPlaceholder: Prim2DBase;
        };
        attach(owner: UIElement): void;
    }
}

declare module BABYLON {
    abstract class Control extends UIElement {
        static CONTROL_PROPCOUNT: number;
        static backgroundProperty: Prim2DPropInfo;
        static borderProperty: Prim2DPropInfo;
        static borderThicknessProperty: Prim2DPropInfo;
        static fontNameProperty: Prim2DPropInfo;
        static foregroundProperty: Prim2DPropInfo;
        constructor(settings: {
            id?: string;
            templateName?: string;
            styleName?: string;
        });
        background: StringDictionary<IBrush2D>;
        border: IBrush2D;
        borderThickness: number;
        fontName: string;
        foreground: IBrush2D;
        private _background;
        private _border;
        private _borderThickness;
        private _fontName;
        private _foreground;
    }
}

declare module BABYLON {
    abstract class ContentControl extends Control {
        static CONTENTCONTROL_PROPCOUNT: number;
        static contentProperty: Prim2DPropInfo;
        constructor(settings?: {
            id?: string;
            templateName?: string;
            styleName?: string;
            content?: any;
        });
        dispose(): boolean;
        content: any;
        protected readonly _contentUIElement: UIElement;
        _createVisualTree(): void;
        private _buildContentUIElement();
        private _contentPlaceholder;
        private _content;
        private __contentUIElement;
        protected _getChildren(): Array<UIElement>;
    }
}

declare module BABYLON {
    class FocusManager {
        constructor();
        setFocusOn(el: UIElement, focusScope: UIElement): void;
        private _rootScope;
        private _focusScopes;
        private _activeScope;
    }
    class Window extends ContentControl {
        static WINDOW_PROPCOUNT: number;
        static leftProperty: Prim2DPropInfo;
        static bottomProperty: Prim2DPropInfo;
        static positionProperty: Prim2DPropInfo;
        static isActiveProperty: Prim2DPropInfo;
        constructor(scene: Scene, settings?: {
            id?: string;
            templateName?: string;
            styleName?: string;
            content?: any;
            left?: number;
            bottom?: number;
            minWidth?: number;
            minHeight?: number;
            maxWidth?: number;
            maxHeight?: number;
            width?: number;
            height?: number;
            worldPosition?: Vector3;
            worldRotation?: Quaternion;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
            paddingHAlignment?: number;
            paddingVAlignment?: number;
            paddingAlignment?: string;
        });
        readonly canvas: Canvas2D;
        left: number;
        bottom: number;
        position: Vector2;
        isActive: boolean;
        readonly focusManager: FocusManager;
        protected readonly _position: Vector2;
        protected createVisualTree(): void;
        _registerVisualToBuild(uiel: UIElement): void;
        private _overPrimChanged(oldPrim, newPrim);
        private _canvasPreRender();
        private _canvasDisposed();
        private _sceneData;
        private _canvas;
        private _left;
        private _bottom;
        private _isActive;
        private _isWorldSpaceCanvas;
        private _renderObserver;
        private _disposeObserver;
        private _UIElementVisualToBuildList;
        private _mouseOverUIElement;
        private static getSceneData(scene);
        private static _sceneData;
    }
    class DefaultWindowRenderingTemplate extends UIElementRenderingTemplateBase {
        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): {
            root: Prim2DBase;
            contentPlaceholder: Prim2DBase;
        };
    }
}

declare module BABYLON {
    class Label extends Control {
        static textProperty: Prim2DPropInfo;
        constructor(settings?: {
            id?: string;
            parent?: UIElement;
            templateName?: string;
            styleName?: string;
            text?: string;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
        });
        protected readonly _position: Vector2;
        private static _emptyArray;
        protected _getChildren(): UIElement[];
        protected createVisualTree(): void;
        text: string;
        private _text;
    }
    class DefaultLabelRenderingTemplate extends UIElementRenderingTemplateBase {
        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): {
            root: Prim2DBase;
            contentPlaceholder: Prim2DBase;
        };
    }
}

declare module BABYLON {
    class Button extends ContentControl {
        static readonly pushedState: string;
        static BUTTON_PROPCOUNT: number;
        static isPushedProperty: Prim2DPropInfo;
        static isDefaultProperty: Prim2DPropInfo;
        static isOutlineProperty: Prim2DPropInfo;
        constructor(settings?: {
            id?: string;
            parent?: UIElement;
            templateName?: string;
            styleName?: string;
            content?: any;
            marginTop?: number | string;
            marginLeft?: number | string;
            marginRight?: number | string;
            marginBottom?: number | string;
            margin?: number | string;
            marginHAlignment?: number;
            marginVAlignment?: number;
            marginAlignment?: string;
            paddingTop?: number | string;
            paddingLeft?: number | string;
            paddingRight?: number | string;
            paddingBottom?: number | string;
            padding?: string;
            paddingHAlignment?: number;
            paddingVAlignment?: number;
            paddingAlignment?: string;
        });
        isPushed: boolean;
        isDefault: boolean;
        isOutline: boolean;
        readonly clickObservable: Observable<Button>;
        _raiseClick(): void;
        protected createVisualTree(): void;
        readonly normalStateBackground: ObservableStringDictionary<IBrush2D>;
        readonly defaultStateBackground: ObservableStringDictionary<IBrush2D>;
        readonly normalStateBorder: ObservableStringDictionary<IBrush2D>;
        readonly defaultStateBorder: ObservableStringDictionary<IBrush2D>;
        private _normalStateBackground;
        private _normalStateBorder;
        private _defaultStateBackground;
        private _defaultStateBorder;
        private _isPushed;
        private _isDefault;
        private _isOutline;
        private _clickObservable;
        private static _pushedState;
    }
    class DefaultButtonRenderingTemplate extends UIElementRenderingTemplateBase {
        createVisualTree(owner: UIElement, visualPlaceholder: Group2D): {
            root: Prim2DBase;
            contentPlaceholder: Prim2DBase;
        };
        attach(owner: UIElement): void;
        stateChange(): void;
        private _rect;
    }
}

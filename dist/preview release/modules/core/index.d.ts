declare module 'babylonjs/core' {
    class EffectFallbacks {
        private _defines;
        private _currentRank;
        private _maxRank;
        private _mesh;
        unBindMesh(): void;
        addFallback(rank: number, define: string): void;
        addCPUSkinningFallback(rank: number, mesh: AbstractMesh): void;
        readonly isMoreFallbacks: boolean;
        reduce(currentDefines: string): string;
    }
    class EffectCreationOptions {
        attributes: string[];
        uniformsNames: string[];
        uniformBuffersNames: string[];
        samplers: string[];
        defines: any;
        fallbacks: Nullable<EffectFallbacks>;
        onCompiled: Nullable<(effect: Effect) => void>;
        onError: Nullable<(effect: Effect, errors: string) => void>;
        indexParameters: any;
        maxSimultaneousLights: number;
        transformFeedbackVaryings: Nullable<string[]>;
    }
    class Effect {
        name: any;
        defines: string;
        onCompiled: Nullable<(effect: Effect) => void>;
        onError: Nullable<(effect: Effect, errors: string) => void>;
        onBind: Nullable<(effect: Effect) => void>;
        uniqueId: number;
        onCompileObservable: Observable<Effect>;
        onErrorObservable: Observable<Effect>;
        onBindObservable: Observable<Effect>;
        private static _uniqueIdSeed;
        private _engine;
        private _uniformBuffersNames;
        private _uniformsNames;
        private _samplers;
        private _isReady;
        private _compilationError;
        private _attributesNames;
        private _attributes;
        private _uniforms;
        _key: string;
        private _indexParameters;
        private _fallbacks;
        private _vertexSourceCode;
        private _fragmentSourceCode;
        private _vertexSourceCodeOverride;
        private _fragmentSourceCodeOverride;
        private _transformFeedbackVaryings;
        _program: WebGLProgram;
        private _valueCache;
        private static _baseCache;
        constructor(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: Nullable<string[]>, engine?: Engine, defines?: Nullable<string>, fallbacks?: Nullable<EffectFallbacks>, onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any);
        readonly key: string;
        isReady(): boolean;
        getEngine(): Engine;
        getProgram(): WebGLProgram;
        getAttributesNames(): string[];
        getAttributeLocation(index: number): number;
        getAttributeLocationByName(name: string): number;
        getAttributesCount(): number;
        getUniformIndex(uniformName: string): number;
        getUniform(uniformName: string): Nullable<WebGLUniformLocation>;
        getSamplers(): string[];
        getCompilationError(): string;
        executeWhenCompiled(func: (effect: Effect) => void): void;
        _loadVertexShader(vertex: any, callback: (data: any) => void): void;
        _loadFragmentShader(fragment: any, callback: (data: any) => void): void;
        private _dumpShadersSource(vertexCode, fragmentCode, defines);
        private _processShaderConversion(sourceCode, isFragment, callback);
        private _processIncludes(sourceCode, callback);
        private _processPrecision(source);
        _rebuildProgram(vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void): void;
        getSpecificUniformLocations(names: string[]): Nullable<WebGLUniformLocation>[];
        _prepareEffect(): void;
        readonly isSupported: boolean;
        _bindTexture(channel: string, texture: InternalTexture): void;
        setTexture(channel: string, texture: Nullable<BaseTexture>): void;
        setTextureArray(channel: string, textures: BaseTexture[]): void;
        setTextureFromPostProcess(channel: string, postProcess: Nullable<PostProcess>): void;
        _cacheMatrix(uniformName: string, matrix: Matrix): boolean;
        _cacheFloat2(uniformName: string, x: number, y: number): boolean;
        _cacheFloat3(uniformName: string, x: number, y: number, z: number): boolean;
        _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): boolean;
        bindUniformBuffer(buffer: WebGLBuffer, name: string): void;
        bindUniformBlock(blockName: string, index: number): void;
        setInt(uniformName: string, value: number): Effect;
        setIntArray(uniformName: string, array: Int32Array): Effect;
        setIntArray2(uniformName: string, array: Int32Array): Effect;
        setIntArray3(uniformName: string, array: Int32Array): Effect;
        setIntArray4(uniformName: string, array: Int32Array): Effect;
        setFloatArray(uniformName: string, array: Float32Array): Effect;
        setFloatArray2(uniformName: string, array: Float32Array): Effect;
        setFloatArray3(uniformName: string, array: Float32Array): Effect;
        setFloatArray4(uniformName: string, array: Float32Array): Effect;
        setArray(uniformName: string, array: number[]): Effect;
        setArray2(uniformName: string, array: number[]): Effect;
        setArray3(uniformName: string, array: number[]): Effect;
        setArray4(uniformName: string, array: number[]): Effect;
        setMatrices(uniformName: string, matrices: Float32Array): Effect;
        setMatrix(uniformName: string, matrix: Matrix): Effect;
        setMatrix3x3(uniformName: string, matrix: Float32Array): Effect;
        setMatrix2x2(uniformName: string, matrix: Float32Array): Effect;
        setFloat(uniformName: string, value: number): Effect;
        setBool(uniformName: string, bool: boolean): Effect;
        setVector2(uniformName: string, vector2: Vector2): Effect;
        setFloat2(uniformName: string, x: number, y: number): Effect;
        setVector3(uniformName: string, vector3: Vector3): Effect;
        setFloat3(uniformName: string, x: number, y: number, z: number): Effect;
        setVector4(uniformName: string, vector4: Vector4): Effect;
        setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect;
        setColor3(uniformName: string, color3: Color3): Effect;
        setColor4(uniformName: string, color3: Color3, alpha: number): Effect;
        static ShadersStore: {
            [key: string]: string;
        };
        static IncludesShadersStore: {
            [key: string]: string;
        };
        static ResetCache(): void;
    }
}

declare module 'babylonjs/core' {
    type Nullable<T> = T | null;
    type float = number;
    type double = number;
    type int = number;
    type FloatArray = number[] | Float32Array;
    type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;
}

declare module 'babylonjs/core' {
    class KeyboardEventTypes {
        static _KEYDOWN: number;
        static _KEYUP: number;
        static readonly KEYDOWN: number;
        static readonly KEYUP: number;
    }
    class KeyboardInfo {
        type: number;
        event: KeyboardEvent;
        constructor(type: number, event: KeyboardEvent);
    }
    /**
     * This class is used to store keyboard related info for the onPreKeyboardObservable event.
     * Set the skipOnKeyboardObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onKeyboardObservable
     */
    class KeyboardInfoPre extends KeyboardInfo {
        constructor(type: number, event: KeyboardEvent);
        skipOnPointerObservable: boolean;
    }
}

declare module 'babylonjs/core' {
    class PointerEventTypes {
        static _POINTERDOWN: number;
        static _POINTERUP: number;
        static _POINTERMOVE: number;
        static _POINTERWHEEL: number;
        static _POINTERPICK: number;
        static _POINTERTAP: number;
        static _POINTERDOUBLETAP: number;
        static readonly POINTERDOWN: number;
        static readonly POINTERUP: number;
        static readonly POINTERMOVE: number;
        static readonly POINTERWHEEL: number;
        static readonly POINTERPICK: number;
        static readonly POINTERTAP: number;
        static readonly POINTERDOUBLETAP: number;
    }
    class PointerInfoBase {
        type: number;
        event: PointerEvent | MouseWheelEvent;
        constructor(type: number, event: PointerEvent | MouseWheelEvent);
    }
    /**
     * This class is used to store pointer related info for the onPrePointerObservable event.
     * Set the skipOnPointerObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onPointerObservable
     */
    class PointerInfoPre extends PointerInfoBase {
        constructor(type: number, event: PointerEvent | MouseWheelEvent, localX: number, localY: number);
        localPosition: Vector2;
        skipOnPointerObservable: boolean;
    }
    /**
     * This type contains all the data related to a pointer event in Babylon.js.
     * The event member is an instance of PointerEvent for all types except PointerWheel and is of type MouseWheelEvent when type equals PointerWheel. The different event types can be found in the PointerEventTypes class.
     */
    class PointerInfo extends PointerInfoBase {
        pickInfo: Nullable<PickingInfo>;
        constructor(type: number, event: PointerEvent | MouseWheelEvent, pickInfo: Nullable<PickingInfo>);
    }
}

declare module 'babylonjs/core' {
    const ToGammaSpace: number;
    const ToLinearSpace = 2.2;
    const Epsilon = 0.001;
    class Color3 {
        r: number;
        g: number;
        b: number;
        /**
         * Creates a new Color3 object from red, green, blue values, all between 0 and 1.
         */
        constructor(r?: number, g?: number, b?: number);
        /**
         * Returns a string with the Color3 current values.
         */
        toString(): string;
        /**
         * Returns the string "Color3".
         */
        getClassName(): string;
        /**
         * Returns the Color3 hash code.
         */
        getHashCode(): number;
        /**
         * Stores in the passed array from the passed starting index the red, green, blue values as successive elements.
         * Returns the Color3.
         */
        toArray(array: FloatArray, index?: number): Color3;
        /**
         * Returns a new Color4 object from the current Color3 and the passed alpha.
         */
        toColor4(alpha?: number): Color4;
        /**
         * Returns a new array populated with 3 numeric elements : red, green and blue values.
         */
        asArray(): number[];
        /**
         * Returns the luminance value (float).
         */
        toLuminance(): number;
        /**
         * Multiply each Color3 rgb values by the passed Color3 rgb values in a new Color3 object.
         * Returns this new object.
         */
        multiply(otherColor: Color3): Color3;
        /**
         * Multiply the rgb values of the Color3 and the passed Color3 and stores the result in the object "result".
         * Returns the current Color3.
         */
        multiplyToRef(otherColor: Color3, result: Color3): Color3;
        /**
         * Boolean : True if the rgb values are equal to the passed ones.
         */
        equals(otherColor: Color3): boolean;
        /**
         * Boolean : True if the rgb values are equal to the passed ones.
         */
        equalsFloats(r: number, g: number, b: number): boolean;
        /**
         * Multiplies in place each rgb value by scale.
         * Returns the updated Color3.
         */
        scale(scale: number): Color3;
        /**
         * Multiplies the rgb values by scale and stores the result into "result".
         * Returns the unmodified current Color3.
         */
        scaleToRef(scale: number, result: Color3): Color3;
        /**
         * Returns a new Color3 set with the added values of the current Color3 and of the passed one.
         */
        add(otherColor: Color3): Color3;
        /**
         * Stores the result of the addition of the current Color3 and passed one rgb values into "result".
         * Returns the unmodified current Color3.
         */
        addToRef(otherColor: Color3, result: Color3): Color3;
        /**
         * Returns a new Color3 set with the subtracted values of the passed one from the current Color3 .
         */
        subtract(otherColor: Color3): Color3;
        /**
         * Stores the result of the subtraction of passed one from the current Color3 rgb values into "result".
         * Returns the unmodified current Color3.
         */
        subtractToRef(otherColor: Color3, result: Color3): Color3;
        /**
         * Returns a new Color3 copied the current one.
         */
        clone(): Color3;
        /**
         * Copies the rgb values from the source in the current Color3.
         * Returns the updated Color3.
         */
        copyFrom(source: Color3): Color3;
        /**
         * Updates the Color3 rgb values from the passed floats.
         * Returns the Color3.
         */
        copyFromFloats(r: number, g: number, b: number): Color3;
        /**
         * Updates the Color3 rgb values from the passed floats.
         * Returns the Color3.
         */
        set(r: number, g: number, b: number): Color3;
        /**
         * Returns the Color3 hexadecimal code as a string.
         */
        toHexString(): string;
        /**
         * Returns a new Color3 converted to linear space.
         */
        toLinearSpace(): Color3;
        /**
         * Converts the Color3 values to linear space and stores the result in "convertedColor".
         * Returns the unmodified Color3.
         */
        toLinearSpaceToRef(convertedColor: Color3): Color3;
        /**
         * Returns a new Color3 converted to gamma space.
         */
        toGammaSpace(): Color3;
        /**
         * Converts the Color3 values to gamma space and stores the result in "convertedColor".
         * Returns the unmodified Color3.
         */
        toGammaSpaceToRef(convertedColor: Color3): Color3;
        /**
         * Creates a new Color3 from the string containing valid hexadecimal values.
         */
        static FromHexString(hex: string): Color3;
        /**
         * Creates a new Vector3 from the startind index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Color3;
        /**
         * Creates a new Color3 from integer values ( < 256).
         */
        static FromInts(r: number, g: number, b: number): Color3;
        /**
         * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3.
         */
        static Lerp(start: Color3, end: Color3, amount: number): Color3;
        static Red(): Color3;
        static Green(): Color3;
        static Blue(): Color3;
        static Black(): Color3;
        static White(): Color3;
        static Purple(): Color3;
        static Magenta(): Color3;
        static Yellow(): Color3;
        static Gray(): Color3;
        static Teal(): Color3;
        static Random(): Color3;
    }
    class Color4 {
        r: number;
        g: number;
        b: number;
        a: number;
        /**
         * Creates a new Color4 object from the passed float values ( < 1) : red, green, blue, alpha.
         */
        constructor(r?: number, g?: number, b?: number, a?: number);
        /**
         * Adds in place the passed Color4 values to the current Color4.
         * Returns the updated Color4.
         */
        addInPlace(right: Color4): Color4;
        /**
         * Returns a new array populated with 4 numeric elements : red, green, blue, alpha values.
         */
        asArray(): number[];
        /**
         * Stores from the starting index in the passed array the Color4 successive values.
         * Returns the Color4.
         */
        toArray(array: number[], index?: number): Color4;
        /**
         * Returns a new Color4 set with the added values of the current Color4 and of the passed one.
         */
        add(right: Color4): Color4;
        /**
         * Returns a new Color4 set with the subtracted values of the passed one from the current Color4.
         */
        subtract(right: Color4): Color4;
        /**
         * Subtracts the passed ones from the current Color4 values and stores the results in "result".
         * Returns the Color4.
         */
        subtractToRef(right: Color4, result: Color4): Color4;
        /**
         * Creates a new Color4 with the current Color4 values multiplied by scale.
         */
        scale(scale: number): Color4;
        /**
         * Multiplies the current Color4 values by scale and stores the result in "result".
         * Returns the Color4.
         */
        scaleToRef(scale: number, result: Color4): Color4;
        /**
          * Multipy an RGBA Color4 value by another and return a new Color4 object
          * @param color The Color4 (RGBA) value to multiply by
          * @returns A new Color4.
          */
        multiply(color: Color4): Color4;
        /**
         * Multipy an RGBA Color4 value by another and push the result in a reference value
         * @param color The Color4 (RGBA) value to multiply by
         * @param result The Color4 (RGBA) to fill the result in
         * @returns the result Color4.
         */
        multiplyToRef(color: Color4, result: Color4): Color4;
        /**
         * Returns a string with the Color4 values.
         */
        toString(): string;
        /**
         * Returns the string "Color4"
         */
        getClassName(): string;
        /**
         * Return the Color4 hash code as a number.
         */
        getHashCode(): number;
        /**
         * Creates a new Color4 copied from the current one.
         */
        clone(): Color4;
        /**
         * Copies the passed Color4 values into the current one.
         * Returns the updated Color4.
         */
        copyFrom(source: Color4): Color4;
        /**
         * Copies the passed float values into the current one.
         * Returns the updated Color4.
         */
        copyFromFloats(r: number, g: number, b: number, a: number): Color4;
        /**
         * Copies the passed float values into the current one.
         * Returns the updated Color4.
         */
        set(r: number, g: number, b: number, a: number): Color4;
        /**
         * Returns a string containing the hexadecimal Color4 code.
         */
        toHexString(): string;
        /**
         * Returns a new Color4 converted to linear space.
         */
        toLinearSpace(): Color4;
        /**
         * Converts the Color4 values to linear space and stores the result in "convertedColor".
         * Returns the unmodified Color4.
         */
        toLinearSpaceToRef(convertedColor: Color4): Color4;
        /**
         * Returns a new Color4 converted to gamma space.
         */
        toGammaSpace(): Color4;
        /**
         * Converts the Color4 values to gamma space and stores the result in "convertedColor".
         * Returns the unmodified Color4.
         */
        toGammaSpaceToRef(convertedColor: Color4): Color4;
        /**
         * Creates a new Color4 from the valid hexadecimal value contained in the passed string.
         */
        static FromHexString(hex: string): Color4;
        /**
         * Creates a new Color4 object set with the linearly interpolated values of "amount" between the left Color4 and the right Color4.
         */
        static Lerp(left: Color4, right: Color4, amount: number): Color4;
        /**
         * Set the passed "result" with the linearly interpolated values of "amount" between the left Color4 and the right Color4.
         */
        static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void;
        /**
         * Creates a new Color4 from the starting index element of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Color4;
        /**
         * Creates a new Color4 from the passed integers ( < 256 ).
         */
        static FromInts(r: number, g: number, b: number, a: number): Color4;
        static CheckColors4(colors: number[], count: number): number[];
    }
    class Vector2 {
        x: number;
        y: number;
        /**
         * Creates a new Vector2 from the passed x and y coordinates.
         */
        constructor(x: number, y: number);
        /**
         * Returns a string with the Vector2 coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Vector2"
         */
        getClassName(): string;
        /**
         * Returns the Vector2 hash code as a number.
         */
        getHashCode(): number;
        /**
         * Sets the Vector2 coordinates in the passed array or Float32Array from the passed index.
         * Returns the Vector2.
         */
        toArray(array: FloatArray, index?: number): Vector2;
        /**
         * Returns a new array with 2 elements : the Vector2 coordinates.
         */
        asArray(): number[];
        /**
         *  Sets the Vector2 coordinates with the passed Vector2 coordinates.
         * Returns the updated Vector2.
         */
        copyFrom(source: Vector2): Vector2;
        /**
         * Sets the Vector2 coordinates with the passed floats.
         * Returns the updated Vector2.
         */
        copyFromFloats(x: number, y: number): Vector2;
        /**
         * Sets the Vector2 coordinates with the passed floats.
         * Returns the updated Vector2.
         */
        set(x: number, y: number): Vector2;
        /**
         * Returns a new Vector2 set with the addition of the current Vector2 and the passed one coordinates.
         */
        add(otherVector: Vector2): Vector2;
        /**
         * Sets the "result" coordinates with the addition of the current Vector2 and the passed one coordinates.
         * Returns the Vector2.
         */
        addToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Set the Vector2 coordinates by adding the passed Vector2 coordinates.
         * Returns the updated Vector2.
         */
        addInPlace(otherVector: Vector2): Vector2;
        /**
         * Returns a new Vector2 by adding the current Vector2 coordinates to the passed Vector3 x, y coordinates.
         */
        addVector3(otherVector: Vector3): Vector2;
        /**
         * Returns a new Vector2 set with the subtracted coordinates of the passed one from the current Vector2.
         */
        subtract(otherVector: Vector2): Vector2;
        /**
         * Sets the "result" coordinates with the subtraction of the passed one from the current Vector2 coordinates.
         * Returns the Vector2.
         */
        subtractToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Sets the current Vector2 coordinates by subtracting from it the passed one coordinates.
         * Returns the updated Vector2.
         */
        subtractInPlace(otherVector: Vector2): Vector2;
        /**
         * Multiplies in place the current Vector2 coordinates by the passed ones.
         * Returns the updated Vector2.
         */
        multiplyInPlace(otherVector: Vector2): Vector2;
        /**
         * Returns a new Vector2 set with the multiplication of the current Vector2 and the passed one coordinates.
         */
        multiply(otherVector: Vector2): Vector2;
        /**
         * Sets "result" coordinates with the multiplication of the current Vector2 and the passed one coordinates.
         * Returns the Vector2.
         */
        multiplyToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Returns a new Vector2 set with the Vector2 coordinates multiplied by the passed floats.
         */
        multiplyByFloats(x: number, y: number): Vector2;
        /**
         * Returns a new Vector2 set with the Vector2 coordinates divided by the passed one coordinates.
         */
        divide(otherVector: Vector2): Vector2;
        /**
         * Sets the "result" coordinates with the Vector2 divided by the passed one coordinates.
         * Returns the Vector2.
         */
        divideToRef(otherVector: Vector2, result: Vector2): Vector2;
        /**
         * Divides the current Vector3 coordinates by the passed ones.
         * Returns the updated Vector3.
         */
        divideInPlace(otherVector: Vector2): Vector2;
        /**
         * Returns a new Vector2 with current Vector2 negated coordinates.
         */
        negate(): Vector2;
        /**
         * Multiply the Vector2 coordinates by scale.
         * Returns the updated Vector2.
         */
        scaleInPlace(scale: number): Vector2;
        /**
         * Returns a new Vector2 scaled by "scale" from the current Vector2.
         */
        scale(scale: number): Vector2;
        /**
         * Boolean : True if the passed vector coordinates strictly equal the current Vector2 ones.
         */
        equals(otherVector: Vector2): boolean;
        /**
         * Boolean : True if the passed vector coordinates are close to the current ones by a distance of epsilon.
         */
        equalsWithEpsilon(otherVector: Vector2, epsilon?: number): boolean;
        /**
         * Returns the vector length (float).
         */
        length(): number;
        /**
         * Returns the vector squared length (float);
         */
        lengthSquared(): number;
        /**
         * Normalize the vector.
         * Returns the updated Vector2.
         */
        normalize(): Vector2;
        /**
         * Returns a new Vector2 copied from the Vector2.
         */
        clone(): Vector2;
        /**
         * Returns a new Vector2(0, 0)
         */
        static Zero(): Vector2;
        /**
         * Returns a new Vector2(1, 1)
         */
        static One(): Vector2;
        /**
         * Returns a new Vector2 set from the passed index element of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Vector2;
        /**
         * Sets "result" from the passed index element of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector2): void;
        /**
         * Retuns a new Vector2 located for "amount" (float) on the CatmullRom  spline defined by the passed four Vector2.
         */
        static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2;
        /**
         * Returns a new Vector2 set with same the coordinates than "value" ones if the vector "value" is in the square defined by "min" and "max".
         * If a coordinate of "value" is lower than "min" coordinates, the returned Vector2 is given this "min" coordinate.
         * If a coordinate of "value" is greater than "max" coordinates, the returned Vector2 is given this "max" coordinate.
         */
        static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2;
        /**
         * Returns a new Vector2 located for "amount" (float) on the Hermite spline defined by the vectors "value1", "value3", "tangent1", "tangent2".
         */
        static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2;
        /**
         * Returns a new Vector2 located for "amount" (float) on the linear interpolation between the vector "start" adn the vector "end".
         */
        static Lerp(start: Vector2, end: Vector2, amount: number): Vector2;
        /**
         * Returns the dot product (float) of the vector "left" and the vector "right".
         */
        static Dot(left: Vector2, right: Vector2): number;
        /**
         * Returns a new Vector2 equal to the normalized passed vector.
         */
        static Normalize(vector: Vector2): Vector2;
        /**
         * Returns a new Vecto2 set with the minimal coordinate values from the "left" and "right" vectors.
         */
        static Minimize(left: Vector2, right: Vector2): Vector2;
        /**
         * Returns a new Vecto2 set with the maximal coordinate values from the "left" and "right" vectors.
         */
        static Maximize(left: Vector2, right: Vector2): Vector2;
        /**
         * Returns a new Vecto2 set with the transformed coordinates of the passed vector by the passed transformation matrix.
         */
        static Transform(vector: Vector2, transformation: Matrix): Vector2;
        /**
         * Transforms the passed vector coordinates by the passed transformation matrix and stores the result in the vector "result" coordinates.
         */
        static TransformToRef(vector: Vector2, transformation: Matrix, result: Vector2): void;
        /**
         * Boolean : True if the point "p" is in the triangle defined by the vertors "p0", "p1", "p2"
         */
        static PointInTriangle(p: Vector2, p0: Vector2, p1: Vector2, p2: Vector2): boolean;
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".
         */
        static Distance(value1: Vector2, value2: Vector2): number;
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".
         */
        static DistanceSquared(value1: Vector2, value2: Vector2): number;
        /**
         * Returns a new Vecto2 located at the center of the vectors "value1" and "value2".
         */
        static Center(value1: Vector2, value2: Vector2): Vector2;
        /**
         * Returns the shortest distance (float) between the point "p" and the segment defined by the two points "segA" and "segB".
         */
        static DistanceOfPointFromSegment(p: Vector2, segA: Vector2, segB: Vector2): number;
    }
    class Vector3 {
        x: number;
        y: number;
        z: number;
        /**
         * Creates a new Vector3 object from the passed x, y, z (floats) coordinates.
         * A Vector3 is the main object used in 3D geometry.
         * It can represent etiher the coordinates of a point the space, either a direction.
         */
        constructor(x: number, y: number, z: number);
        /**
         * Returns a string with the Vector3 coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Vector3"
         */
        getClassName(): string;
        /**
         * Returns the Vector hash code.
         */
        getHashCode(): number;
        /**
         * Returns a new array with three elements : the coordinates the Vector3.
         */
        asArray(): number[];
        /**
         * Populates the passed array or Float32Array from the passed index with the successive coordinates of the Vector3.
         * Returns the Vector3.
         */
        toArray(array: FloatArray, index?: number): Vector3;
        /**
         * Returns a new Quaternion object, computed from the Vector3 coordinates.
         */
        toQuaternion(): Quaternion;
        /**
         * Adds the passed vector to the current Vector3.
         * Returns the updated Vector3.
         */
        addInPlace(otherVector: Vector3): Vector3;
        /**
         * Returns a new Vector3, result of the addition the current Vector3 and the passed vector.
         */
        add(otherVector: Vector3): Vector3;
        /**
         * Adds the current Vector3 to the passed one and stores the result in the vector "result".
         * Returns the current Vector3.
         */
        addToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Subtract the passed vector from the current Vector3.
         * Returns the updated Vector3.
         */
        subtractInPlace(otherVector: Vector3): Vector3;
        /**
         * Returns a new Vector3, result of the subtraction of the passed vector from the current Vector3.
         */
        subtract(otherVector: Vector3): Vector3;
        /**
         * Subtracts the passed vector from the current Vector3 and stores the result in the vector "result".
         * Returns the current Vector3.
         */
        subtractToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Returns a new Vector3 set with the subtraction of the passed floats from the current Vector3 coordinates.
         */
        subtractFromFloats(x: number, y: number, z: number): Vector3;
        /**
         * Subtracts the passed floats from the current Vector3 coordinates and set the passed vector "result" with this result.
         * Returns the current Vector3.
         */
        subtractFromFloatsToRef(x: number, y: number, z: number, result: Vector3): Vector3;
        /**
         * Returns a new Vector3 set with the current Vector3 negated coordinates.
         */
        negate(): Vector3;
        /**
         * Multiplies the Vector3 coordinates by the float "scale".
         * Returns the updated Vector3.
         */
        scaleInPlace(scale: number): Vector3;
        /**
         * Returns a new Vector3 set with the current Vector3 coordinates multiplied by the float "scale".
         */
        scale(scale: number): Vector3;
        /**
         * Multiplies the current Vector3 coordinates by the float "scale" and stores the result in the passed vector "result" coordinates.
         * Returns the current Vector3.
         */
        scaleToRef(scale: number, result: Vector3): Vector3;
        /**
         * Boolean : True if the current Vector3 and the passed vector coordinates are strictly equal.
         */
        equals(otherVector: Vector3): boolean;
        /**
         * Boolean : True if the current Vector3 and the passed vector coordinates are distant less than epsilon.
         */
        equalsWithEpsilon(otherVector: Vector3, epsilon?: number): boolean;
        /**
         * Boolean : True if the current Vector3 coordinate equal the passed floats.
         */
        equalsToFloats(x: number, y: number, z: number): boolean;
        /**
         * Muliplies the current Vector3 coordinates by the passed ones.
         * Returns the updated Vector3.
         */
        multiplyInPlace(otherVector: Vector3): Vector3;
        /**
         * Returns a new Vector3, result of the multiplication of the current Vector3 by the passed vector.
         */
        multiply(otherVector: Vector3): Vector3;
        /**
         * Multiplies the current Vector3 by the passed one and stores the result in the passed vector "result".
         * Returns the current Vector3.
         */
        multiplyToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Returns a new Vector3 set witth the result of the mulliplication of the current Vector3 coordinates by the passed floats.
         */
        multiplyByFloats(x: number, y: number, z: number): Vector3;
        /**
         * Returns a new Vector3 set witth the result of the division of the current Vector3 coordinates by the passed ones.
         */
        divide(otherVector: Vector3): Vector3;
        /**
         * Divides the current Vector3 coordinates by the passed ones and stores the result in the passed vector "result".
         * Returns the current Vector3.
         */
        divideToRef(otherVector: Vector3, result: Vector3): Vector3;
        /**
         * Divides the current Vector3 coordinates by the passed ones.
         * Returns the updated Vector3.
         */
        divideInPlace(otherVector: Vector3): Vector3;
        /**
         * Updates the current Vector3 with the minimal coordinate values between its and the passed vector ones.
         * Returns the updated Vector3.
         */
        MinimizeInPlace(other: Vector3): Vector3;
        /**
         * Updates the current Vector3 with the maximal coordinate values between its and the passed vector ones.
         * Returns the updated Vector3.
         */
        MaximizeInPlace(other: Vector3): Vector3;
        /**
         * Return true is the vector is non uniform meaning x, y or z are not all the same.
         */
        readonly isNonUniform: boolean;
        /**
         * Returns the length of the Vector3 (float).
         */
        length(): number;
        /**
         * Returns the squared length of the Vector3 (float).
         */
        lengthSquared(): number;
        /**
         * Normalize the current Vector3.
         * Returns the updated Vector3.
         * /!\ In place operation.
         */
        normalize(): Vector3;
        /**
         * Normalize the current Vector3 to a new vector.
         * @returns the new Vector3.
         */
        normalizeToNew(): Vector3;
        /**
         * Normalize the current Vector3 to the reference.
         * @param the reference to update.
         * @returns the updated Vector3.
         */
        normalizeToRef(reference: Vector3): Vector3;
        /**
         * Returns a new Vector3 copied from the current Vector3.
         */
        clone(): Vector3;
        /**
         * Copies the passed vector coordinates to the current Vector3 ones.
         * Returns the updated Vector3.
         */
        copyFrom(source: Vector3): Vector3;
        /**
         * Copies the passed floats to the current Vector3 coordinates.
         * Returns the updated Vector3.
         */
        copyFromFloats(x: number, y: number, z: number): Vector3;
        /**
         * Copies the passed floats to the current Vector3 coordinates.
         * Returns the updated Vector3.
         */
        set(x: number, y: number, z: number): Vector3;
        /**
         *
         */
        static GetClipFactor(vector0: Vector3, vector1: Vector3, axis: Vector3, size: number): number;
        /**
         * Returns a new Vector3 set from the index "offset" of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Vector3;
        /**
         * Returns a new Vector3 set from the index "offset" of the passed Float32Array.
         * This function is deprecated.  Use FromArray instead.
         */
        static FromFloatArray(array: Float32Array, offset?: number): Vector3;
        /**
         * Sets the passed vector "result" with the element values from the index "offset" of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector3): void;
        /**
         * Sets the passed vector "result" with the element values from the index "offset" of the passed Float32Array.
         * This function is deprecated.  Use FromArrayToRef instead.
         */
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector3): void;
        /**
         * Sets the passed vector "result" with the passed floats.
         */
        static FromFloatsToRef(x: number, y: number, z: number, result: Vector3): void;
        /**
         * Returns a new Vector3 set to (0.0, 0.0, 0.0).
         */
        static Zero(): Vector3;
        /**
         * Returns a new Vector3 set to (1.0, 1.0, 1.0).
         */
        static One(): Vector3;
        /**
         * Returns a new Vector3 set to (0.0, 1.0, 0.0)
         */
        static Up(): Vector3;
        /**
         * Returns a new Vector3 set to (0.0, 0.0, 1.0)
         */
        static Forward(): Vector3;
        /**
         * Returns a new Vector3 set to (1.0, 0.0, 0.0)
         */
        static Right(): Vector3;
        /**
         * Returns a new Vector3 set to (-1.0, 0.0, 0.0)
         */
        static Left(): Vector3;
        /**
         * Returns a new Vector3 set with the result of the transformation by the passed matrix of the passed vector.
         * This method computes tranformed coordinates only, not transformed direction vectors.
         */
        static TransformCoordinates(vector: Vector3, transformation: Matrix): Vector3;
        /**
         * Sets the passed vector "result" coordinates with the result of the transformation by the passed matrix of the passed vector.
         * This method computes tranformed coordinates only, not transformed direction vectors.
         */
        static TransformCoordinatesToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        /**
         * Sets the passed vector "result" coordinates with the result of the transformation by the passed matrix of the passed floats (x, y, z).
         * This method computes tranformed coordinates only, not transformed direction vectors.
         */
        static TransformCoordinatesFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        /**
         * Returns a new Vector3 set with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormal(vector: Vector3, transformation: Matrix): Vector3;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalToRef(vector: Vector3, transformation: Matrix, result: Vector3): void;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed floats (x, y, z).
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, transformation: Matrix, result: Vector3): void;
        /**
         * Returns a new Vector3 located for "amount" on the CatmullRom interpolation spline defined by the vectors "value1", "value2", "value3", "value4".
         */
        static CatmullRom(value1: Vector3, value2: Vector3, value3: Vector3, value4: Vector3, amount: number): Vector3;
        /**
         * Returns a new Vector3 set with the coordinates of "value", if the vector "value" is in the cube defined by the vectors "min" and "max".
         * If a coordinate value of "value" is lower than one of the "min" coordinate, then this "value" coordinate is set with the "min" one.
         * If a coordinate value of "value" is greater than one of the "max" coordinate, then this "value" coordinate is set with the "max" one.
         */
        static Clamp(value: Vector3, min: Vector3, max: Vector3): Vector3;
        /**
         * Returns a new Vector3 located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2".
         */
        static Hermite(value1: Vector3, tangent1: Vector3, value2: Vector3, tangent2: Vector3, amount: number): Vector3;
        /**
         * Returns a new Vector3 located for "amount" (float) on the linear interpolation between the vectors "start" and "end".
         */
        static Lerp(start: Vector3, end: Vector3, amount: number): Vector3;
        /**
         * Sets the passed vector "result" with the result of the linear interpolation from the vector "start" for "amount" to the vector "end".
         */
        static LerpToRef(start: Vector3, end: Vector3, amount: number, result: Vector3): void;
        /**
         * Returns the dot product (float) between the vectors "left" and "right".
         */
        static Dot(left: Vector3, right: Vector3): number;
        /**
         * Returns a new Vector3 as the cross product of the vectors "left" and "right".
         * The cross product is then orthogonal to both "left" and "right".
         */
        static Cross(left: Vector3, right: Vector3): Vector3;
        /**
         * Sets the passed vector "result" with the cross product of "left" and "right".
         * The cross product is then orthogonal to both "left" and "right".
         */
        static CrossToRef(left: Vector3, right: Vector3, result: Vector3): void;
        /**
         * Returns a new Vector3 as the normalization of the passed vector.
         */
        static Normalize(vector: Vector3): Vector3;
        /**
         * Sets the passed vector "result" with the normalization of the passed first vector.
         */
        static NormalizeToRef(vector: Vector3, result: Vector3): void;
        private static _viewportMatrixCache;
        static Project(vector: Vector3, world: Matrix, transform: Matrix, viewport: Viewport): Vector3;
        static UnprojectFromTransform(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, transform: Matrix): Vector3;
        static Unproject(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix): Vector3;
        static UnprojectToRef(source: Vector3, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix, result: Vector3): void;
        static UnprojectFloatsToRef(sourceX: float, sourceY: float, sourceZ: float, viewportWidth: number, viewportHeight: number, world: Matrix, view: Matrix, projection: Matrix, result: Vector3): void;
        static Minimize(left: Vector3, right: Vector3): Vector3;
        static Maximize(left: Vector3, right: Vector3): Vector3;
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".
         */
        static Distance(value1: Vector3, value2: Vector3): number;
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".
         */
        static DistanceSquared(value1: Vector3, value2: Vector3): number;
        /**
         * Returns a new Vector3 located at the center between "value1" and "value2".
         */
        static Center(value1: Vector3, value2: Vector3): Vector3;
        /**
         * Given three orthogonal normalized left-handed oriented Vector3 axis in space (target system),
         * RotationFromAxis() returns the rotation Euler angles (ex : rotation.x, rotation.y, rotation.z) to apply
         * to something in order to rotate it from its local system to the given target system.
         * Note : axis1, axis2 and axis3 are normalized during this operation.
         * Returns a new Vector3.
         */
        static RotationFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3): Vector3;
        /**
         * The same than RotationFromAxis but updates the passed ref Vector3 parameter instead of returning a new Vector3.
         */
        static RotationFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Vector3): void;
    }
    class Vector4 {
        x: number;
        y: number;
        z: number;
        w: number;
        /**
         * Creates a Vector4 object from the passed floats.
         */
        constructor(x: number, y: number, z: number, w: number);
        /**
         * Returns the string with the Vector4 coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Vector4".
         */
        getClassName(): string;
        /**
         * Returns the Vector4 hash code.
         */
        getHashCode(): number;
        /**
         * Returns a new array populated with 4 elements : the Vector4 coordinates.
         */
        asArray(): number[];
        /**
         * Populates the passed array from the passed index with the Vector4 coordinates.
         * Returns the Vector4.
         */
        toArray(array: FloatArray, index?: number): Vector4;
        /**
         * Adds the passed vector to the current Vector4.
         * Returns the updated Vector4.
         */
        addInPlace(otherVector: Vector4): Vector4;
        /**
         * Returns a new Vector4 as the result of the addition of the current Vector4 and the passed one.
         */
        add(otherVector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" with the result of the addition of the current Vector4 and the passed one.
         * Returns the current Vector4.
         */
        addToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Subtract in place the passed vector from the current Vector4.
         * Returns the updated Vector4.
         */
        subtractInPlace(otherVector: Vector4): Vector4;
        /**
         * Returns a new Vector4 with the result of the subtraction of the passed vector from the current Vector4.
         */
        subtract(otherVector: Vector4): Vector4;
        /**
         * Sets the passed vector "result" with the result of the subtraction of the passed vector from the current Vector4.
         * Returns the current Vector4.
         */
        subtractToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the result of the subtraction of the passed floats from the current Vector4 coordinates.
         */
        subtractFromFloats(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Sets the passed vector "result" set with the result of the subtraction of the passed floats from the current Vector4 coordinates.
         * Returns the current Vector4.
         */
        subtractFromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the current Vector4 negated coordinates.
         */
        negate(): Vector4;
        /**
         * Multiplies the current Vector4 coordinates by scale (float).
         * Returns the updated Vector4.
         */
        scaleInPlace(scale: number): Vector4;
        /**
         * Returns a new Vector4 set with the current Vector4 coordinates multiplied by scale (float).
         */
        scale(scale: number): Vector4;
        /**
         * Sets the passed vector "result" with the current Vector4 coordinates multiplied by scale (float).
         * Returns the current Vector4.
         */
        scaleToRef(scale: number, result: Vector4): Vector4;
        /**
         * Boolean : True if the current Vector4 coordinates are stricly equal to the passed ones.
         */
        equals(otherVector: Vector4): boolean;
        /**
         * Boolean : True if the current Vector4 coordinates are each beneath the distance "epsilon" from the passed vector ones.
         */
        equalsWithEpsilon(otherVector: Vector4, epsilon?: number): boolean;
        /**
         * Boolean : True if the passed floats are strictly equal to the current Vector4 coordinates.
         */
        equalsToFloats(x: number, y: number, z: number, w: number): boolean;
        /**
         * Multiplies in place the current Vector4 by the passed one.
         * Returns the updated Vector4.
         */
        multiplyInPlace(otherVector: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the multiplication result of the current Vector4 and the passed one.
         */
        multiply(otherVector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" with the multiplication result of the current Vector4 and the passed one.
         * Returns the current Vector4.
         */
        multiplyToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the multiplication result of the passed floats and the current Vector4 coordinates.
         */
        multiplyByFloats(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Returns a new Vector4 set with the division result of the current Vector4 by the passed one.
         */
        divide(otherVector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" with the division result of the current Vector4 by the passed one.
         * Returns the current Vector4.
         */
        divideToRef(otherVector: Vector4, result: Vector4): Vector4;
        /**
         * Divides the current Vector3 coordinates by the passed ones.
         * Returns the updated Vector3.
         */
        divideInPlace(otherVector: Vector4): Vector4;
        /**
         * Updates the Vector4 coordinates with the minimum values between its own and the passed vector ones.
         */
        MinimizeInPlace(other: Vector4): Vector4;
        /**
         * Updates the Vector4 coordinates with the maximum values between its own and the passed vector ones.
         */
        MaximizeInPlace(other: Vector4): Vector4;
        /**
         * Returns the Vector4 length (float).
         */
        length(): number;
        /**
         * Returns the Vector4 squared length (float).
         */
        lengthSquared(): number;
        /**
         * Normalizes in place the Vector4.
         * Returns the updated Vector4.
         */
        normalize(): Vector4;
        /**
         * Returns a new Vector3 from the Vector4 (x, y, z) coordinates.
         */
        toVector3(): Vector3;
        /**
         * Returns a new Vector4 copied from the current one.
         */
        clone(): Vector4;
        /**
         * Updates the current Vector4 with the passed one coordinates.
         * Returns the updated Vector4.
         */
        copyFrom(source: Vector4): Vector4;
        /**
         * Updates the current Vector4 coordinates with the passed floats.
         * Returns the updated Vector4.
         */
        copyFromFloats(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Updates the current Vector4 coordinates with the passed floats.
         * Returns the updated Vector4.
         */
        set(x: number, y: number, z: number, w: number): Vector4;
        /**
         * Returns a new Vector4 set from the starting index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Vector4;
        /**
         * Updates the passed vector "result" from the starting index of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector4): void;
        /**
         * Updates the passed vector "result" from the starting index of the passed Float32Array.
         */
        static FromFloatArrayToRef(array: Float32Array, offset: number, result: Vector4): void;
        /**
         * Updates the passed vector "result" coordinates from the passed floats.
         */
        static FromFloatsToRef(x: number, y: number, z: number, w: number, result: Vector4): void;
        /**
         * Returns a new Vector4 set to (0.0, 0.0, 0.0, 0.0)
         */
        static Zero(): Vector4;
        /**
         * Returns a new Vector4 set to (1.0, 1.0, 1.0, 1.0)
         */
        static One(): Vector4;
        /**
         * Returns a new normalized Vector4 from the passed one.
         */
        static Normalize(vector: Vector4): Vector4;
        /**
         * Updates the passed vector "result" from the normalization of the passed one.
         */
        static NormalizeToRef(vector: Vector4, result: Vector4): void;
        static Minimize(left: Vector4, right: Vector4): Vector4;
        static Maximize(left: Vector4, right: Vector4): Vector4;
        /**
         * Returns the distance (float) between the vectors "value1" and "value2".
         */
        static Distance(value1: Vector4, value2: Vector4): number;
        /**
         * Returns the squared distance (float) between the vectors "value1" and "value2".
         */
        static DistanceSquared(value1: Vector4, value2: Vector4): number;
        /**
         * Returns a new Vector4 located at the center between the vectors "value1" and "value2".
         */
        static Center(value1: Vector4, value2: Vector4): Vector4;
        /**
         * Returns a new Vector4 set with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormal(vector: Vector4, transformation: Matrix): Vector4;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed vector.
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalToRef(vector: Vector4, transformation: Matrix, result: Vector4): void;
        /**
         * Sets the passed vector "result" with the result of the normal transformation by the passed matrix of the passed floats (x, y, z, w).
         * This methods computes transformed normalized direction vectors only.
         */
        static TransformNormalFromFloatsToRef(x: number, y: number, z: number, w: number, transformation: Matrix, result: Vector4): void;
    }
    interface ISize {
        width: number;
        height: number;
    }
    class Size implements ISize {
        width: number;
        height: number;
        /**
         * Creates a Size object from the passed width and height (floats).
         */
        constructor(width: number, height: number);
        toString(): string;
        /**
         * Returns the string "Size"
         */
        getClassName(): string;
        /**
         * Returns the Size hash code.
         */
        getHashCode(): number;
        /**
         * Updates the current size from the passed one.
         * Returns the updated Size.
         */
        copyFrom(src: Size): void;
        /**
         * Updates in place the current Size from the passed floats.
         * Returns the updated Size.
         */
        copyFromFloats(width: number, height: number): Size;
        /**
         * Updates in place the current Size from the passed floats.
         * Returns the updated Size.
         */
        set(width: number, height: number): Size;
        /**
         * Returns a new Size set with the multiplication result of the current Size and the passed floats.
         */
        multiplyByFloats(w: number, h: number): Size;
        /**
         * Returns a new Size copied from the passed one.
         */
        clone(): Size;
        /**
         * Boolean : True if the current Size and the passed one width and height are strictly equal.
         */
        equals(other: Size): boolean;
        /**
         * Returns the surface of the Size : width * height (float).
         */
        readonly surface: number;
        /**
         * Returns a new Size set to (0.0, 0.0)
         */
        static Zero(): Size;
        /**
         * Returns a new Size set as the addition result of the current Size and the passed one.
         */
        add(otherSize: Size): Size;
        /**
         * Returns a new Size set as the subtraction result of  the passed one from the current Size.
         */
        subtract(otherSize: Size): Size;
        /**
         * Returns a new Size set at the linear interpolation "amount" between "start" and "end".
         */
        static Lerp(start: Size, end: Size, amount: number): Size;
    }
    class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;
        /**
         * Creates a new Quaternion from the passed floats.
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * Returns a string with the Quaternion coordinates.
         */
        toString(): string;
        /**
         * Returns the string "Quaternion".
         */
        getClassName(): string;
        /**
         * Returns the Quaternion hash code.
         */
        getHashCode(): number;
        /**
         * Returns a new array populated with 4 elements : the Quaternion coordinates.
         */
        asArray(): number[];
        /**
         * Boolean : True if the current Quaterion and the passed one coordinates are strictly equal.
         */
        equals(otherQuaternion: Quaternion): boolean;
        /**
         * Returns a new Quaternion copied from the current one.
         */
        clone(): Quaternion;
        /**
         * Updates the current Quaternion from the passed one coordinates.
         * Returns the updated Quaterion.
         */
        copyFrom(other: Quaternion): Quaternion;
        /**
         * Updates the current Quaternion from the passed float coordinates.
         * Returns the updated Quaterion.
         */
        copyFromFloats(x: number, y: number, z: number, w: number): Quaternion;
        /**
         * Updates the current Quaternion from the passed float coordinates.
         * Returns the updated Quaterion.
         */
        set(x: number, y: number, z: number, w: number): Quaternion;
        /**
         * Returns a new Quaternion as the addition result of the passed one and the current Quaternion.
         */
        add(other: Quaternion): Quaternion;
        /**
         * Returns a new Quaternion as the subtraction result of the passed one from the current Quaternion.
         */
        subtract(other: Quaternion): Quaternion;
        /**
         * Returns a new Quaternion set by multiplying the current Quaterion coordinates by the float "scale".
         */
        scale(value: number): Quaternion;
        /**
         * Returns a new Quaternion set as the quaternion mulplication result of the current one with the passed one "q1".
         */
        multiply(q1: Quaternion): Quaternion;
        /**
         * Sets the passed "result" as the quaternion mulplication result of the current one with the passed one "q1".
         * Returns the current Quaternion.
         */
        multiplyToRef(q1: Quaternion, result: Quaternion): Quaternion;
        /**
         * Updates the current Quaternion with the quaternion mulplication result of itself with the passed one "q1".
         * Returns the updated Quaternion.
         */
        multiplyInPlace(q1: Quaternion): Quaternion;
        /**
         * Sets the passed "ref" with the conjugation of the current Quaternion.
         * Returns the current Quaternion.
         */
        conjugateToRef(ref: Quaternion): Quaternion;
        /**
         * Conjugates in place the current Quaternion.
         * Returns the updated Quaternion.
         */
        conjugateInPlace(): Quaternion;
        /**
         * Returns a new Quaternion as the conjugate of the current Quaternion.
         */
        conjugate(): Quaternion;
        /**
         * Returns the Quaternion length (float).
         */
        length(): number;
        /**
         * Normalize in place the current Quaternion.
         * Returns the updated Quaternion.
         */
        normalize(): Quaternion;
        /**
         * Returns a new Vector3 set with the Euler angles translated from the current Quaternion.
         */
        toEulerAngles(order?: string): Vector3;
        /**
         * Sets the passed vector3 "result" with the Euler angles translated from the current Quaternion.
         * Returns the current Quaternion.
         */
        toEulerAnglesToRef(result: Vector3, order?: string): Quaternion;
        /**
         * Updates the passed rotation matrix with the current Quaternion values.
         * Returns the current Quaternion.
         */
        toRotationMatrix(result: Matrix): Quaternion;
        /**
         * Updates the current Quaternion from the passed rotation matrix values.
         * Returns the updated Quaternion.
         */
        fromRotationMatrix(matrix: Matrix): Quaternion;
        /**
         * Returns a new Quaternion set from the passed rotation matrix values.
         */
        static FromRotationMatrix(matrix: Matrix): Quaternion;
        /**
         * Updates the passed quaternion "result" with the passed rotation matrix values.
         */
        static FromRotationMatrixToRef(matrix: Matrix, result: Quaternion): void;
        /**
         * Returns a new Quaternion set to (0.0, 0.0, 0.0).
         */
        static Zero(): Quaternion;
        /**
         * Returns a new Quaternion as the inverted current Quaternion.
         */
        static Inverse(q: Quaternion): Quaternion;
        /**
         * Returns the identity Quaternion.
         */
        static Identity(): Quaternion;
        static IsIdentity(quaternion: Quaternion): boolean;
        /**
         * Returns a new Quaternion set from the passed axis (Vector3) and angle in radians (float).
         */
        static RotationAxis(axis: Vector3, angle: number): Quaternion;
        /**
         * Sets the passed quaternion "result" from the passed axis (Vector3) and angle in radians (float).
         */
        static RotationAxisToRef(axis: Vector3, angle: number, result: Quaternion): Quaternion;
        /**
         * Retuns a new Quaternion set from the starting index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Quaternion;
        /**
         * Returns a new Quaternion set from the passed Euler float angles (y, x, z).
         */
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion;
        /**
         * Sets the passed quaternion "result" from the passed float Euler angles (y, x, z).
         */
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void;
        /**
         * Returns a new Quaternion from the passed float Euler angles expressed in z-x-z orientation
         */
        static RotationAlphaBetaGamma(alpha: number, beta: number, gamma: number): Quaternion;
        /**
         * Sets the passed quaternion "result" from the passed float Euler angles expressed in z-x-z orientation
         */
        static RotationAlphaBetaGammaToRef(alpha: number, beta: number, gamma: number, result: Quaternion): void;
        /**
         * Returns a new Quaternion as the quaternion rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system.
         * cf to Vector3.RotationFromAxis() documentation.
         * Note : axis1, axis2 and axis3 are normalized during this operation.
         */
        static RotationQuaternionFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Quaternion): Quaternion;
        /**
         * Sets the passed quaternion "ref" with the quaternion rotation value to reach the target (axis1, axis2, axis3) orientation as a rotated XYZ system.
         * cf to Vector3.RotationFromAxis() documentation.
         * Note : axis1, axis2 and axis3 are normalized during this operation.
         */
        static RotationQuaternionFromAxisToRef(axis1: Vector3, axis2: Vector3, axis3: Vector3, ref: Quaternion): void;
        static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion;
        static SlerpToRef(left: Quaternion, right: Quaternion, amount: number, result: Quaternion): void;
        /**
         * Returns a new Quaternion located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2".
         */
        static Hermite(value1: Quaternion, tangent1: Quaternion, value2: Quaternion, tangent2: Quaternion, amount: number): Quaternion;
    }
    class Matrix {
        private static _tempQuaternion;
        private static _xAxis;
        private static _yAxis;
        private static _zAxis;
        private static _updateFlagSeed;
        private static _identityReadOnly;
        private _isIdentity;
        private _isIdentityDirty;
        updateFlag: number;
        m: Float32Array;
        _markAsUpdated(): void;
        constructor();
        /**
         * Boolean : True is the matrix is the identity matrix
         */
        isIdentity(considerAsTextureMatrix?: boolean): boolean;
        /**
         * Returns the matrix determinant (float).
         */
        determinant(): number;
        /**
         * Returns the matrix underlying array.
         */
        toArray(): Float32Array;
        /**
        * Returns the matrix underlying array.
        */
        asArray(): Float32Array;
        /**
         * Inverts in place the Matrix.
         * Returns the Matrix inverted.
         */
        invert(): Matrix;
        /**
         * Sets all the matrix elements to zero.
         * Returns the Matrix.
         */
        reset(): Matrix;
        /**
         * Returns a new Matrix as the addition result of the current Matrix and the passed one.
         */
        add(other: Matrix): Matrix;
        /**
         * Sets the passed matrix "result" with the ddition result of the current Matrix and the passed one.
         * Returns the Matrix.
         */
        addToRef(other: Matrix, result: Matrix): Matrix;
        /**
         * Adds in place the passed matrix to the current Matrix.
         * Returns the updated Matrix.
         */
        addToSelf(other: Matrix): Matrix;
        /**
         * Sets the passed matrix with the current inverted Matrix.
         * Returns the unmodified current Matrix.
         */
        invertToRef(other: Matrix): Matrix;
        /**
         * Inserts the translation vector (using 3 x floats) in the current Matrix.
         * Returns the updated Matrix.
         */
        setTranslationFromFloats(x: number, y: number, z: number): Matrix;
        /**
 * Inserts the translation vector in the current Matrix.
 * Returns the updated Matrix.
 */
        setTranslation(vector3: Vector3): Matrix;
        /**
         * Returns a new Vector3 as the extracted translation from the Matrix.
         */
        getTranslation(): Vector3;
        /**
         * Fill a Vector3 with the extracted translation from the Matrix.
         */
        getTranslationToRef(result: Vector3): Matrix;
        /**
         * Remove rotation and scaling part from the Matrix.
         * Returns the updated Matrix.
         */
        removeRotationAndScaling(): Matrix;
        /**
         * Returns a new Matrix set with the multiplication result of the current Matrix and the passed one.
         */
        multiply(other: Matrix): Matrix;
        /**
         * Updates the current Matrix from the passed one values.
         * Returns the updated Matrix.
         */
        copyFrom(other: Matrix): Matrix;
        /**
         * Populates the passed array from the starting index with the Matrix values.
         * Returns the Matrix.
         */
        copyToArray(array: Float32Array, offset?: number): Matrix;
        /**
         * Sets the passed matrix "result" with the multiplication result of the current Matrix and the passed one.
         */
        multiplyToRef(other: Matrix, result: Matrix): Matrix;
        /**
         * Sets the Float32Array "result" from the passed index "offset" with the multiplication result of the current Matrix and the passed one.
         */
        multiplyToArray(other: Matrix, result: Float32Array, offset: number): Matrix;
        /**
         * Boolean : True is the current Matrix and the passed one values are strictly equal.
         */
        equals(value: Matrix): boolean;
        /**
         * Returns a new Matrix from the current Matrix.
         */
        clone(): Matrix;
        /**
         * Returns the string "Matrix"
         */
        getClassName(): string;
        /**
         * Returns the Matrix hash code.
         */
        getHashCode(): number;
        /**
         * Decomposes the current Matrix into :
         * - a scale vector3 passed as a reference to update,
         * - a rotation quaternion passed as a reference to update,
         * - a translation vector3 passed as a reference to update.
         * Returns the boolean `true`.
         */
        decompose(scale: Vector3, rotation: Quaternion, translation: Vector3): boolean;
        /**
         * Returns a new Matrix as the extracted rotation matrix from the current one.
         */
        getRotationMatrix(): Matrix;
        /**
         * Extracts the rotation matrix from the current one and sets it as the passed "result".
         * Returns the current Matrix.
         */
        getRotationMatrixToRef(result: Matrix): Matrix;
        /**
         * Returns a new Matrix set from the starting index of the passed array.
         */
        static FromArray(array: ArrayLike<number>, offset?: number): Matrix;
        /**
         * Sets the passed "result" matrix from the starting index of the passed array.
         */
        static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Matrix): void;
        /**
         * Sets the passed "result" matrix from the starting index of the passed Float32Array by multiplying each element by the float "scale".
         */
        static FromFloat32ArrayToRefScaled(array: Float32Array, offset: number, scale: number, result: Matrix): void;
        /**
         * Sets the passed matrix "result" with the 16 passed floats.
         */
        static FromValuesToRef(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number, result: Matrix): void;
        /**
         * Returns the index-th row of the current matrix as a new Vector4.
         */
        getRow(index: number): Nullable<Vector4>;
        /**
         * Sets the index-th row of the current matrix with the passed Vector4 values.
         * Returns the updated Matrix.
         */
        setRow(index: number, row: Vector4): Matrix;
        /**
         * Compute the transpose of the matrix.
         * Returns a new Matrix.
         */
        transpose(): Matrix;
        /**
         * Compute the transpose of the matrix.
         * Returns the current matrix.
         */
        transposeToRef(result: Matrix): Matrix;
        /**
         * Sets the index-th row of the current matrix with the passed 4 x float values.
         * Returns the updated Matrix.
         */
        setRowFromFloats(index: number, x: number, y: number, z: number, w: number): Matrix;
        /**
         * Static identity matrix to be used as readonly matrix
         * Must not be updated.
         */
        static readonly IdentityReadOnly: Matrix;
        /**
         * Returns a new Matrix set from the 16 passed floats.
         */
        static FromValues(initialM11: number, initialM12: number, initialM13: number, initialM14: number, initialM21: number, initialM22: number, initialM23: number, initialM24: number, initialM31: number, initialM32: number, initialM33: number, initialM34: number, initialM41: number, initialM42: number, initialM43: number, initialM44: number): Matrix;
        /**
         * Returns a new Matrix composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).
         */
        static Compose(scale: Vector3, rotation: Quaternion, translation: Vector3): Matrix;
        /**
       * Update a Matrix with values composed by the passed scale (vector3), rotation (quaternion) and translation (vector3).
       */
        static ComposeToRef(scale: Vector3, rotation: Quaternion, translation: Vector3, result: Matrix): void;
        /**
         * Returns a new indentity Matrix.
         */
        static Identity(): Matrix;
        /**
         * Sets the passed "result" as an identity matrix.
         */
        static IdentityToRef(result: Matrix): void;
        /**
         * Returns a new zero Matrix.
         */
        static Zero(): Matrix;
        /**
         * Returns a new rotation matrix for "angle" radians around the X axis.
         */
        static RotationX(angle: number): Matrix;
        /**
         * Returns a new Matrix as the passed inverted one.
         */
        static Invert(source: Matrix): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the X axis.
         */
        static RotationXToRef(angle: number, result: Matrix): void;
        /**
         * Returns a new rotation matrix for "angle" radians around the Y axis.
         */
        static RotationY(angle: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the Y axis.
         */
        static RotationYToRef(angle: number, result: Matrix): void;
        /**
         * Returns a new rotation matrix for "angle" radians around the Z axis.
         */
        static RotationZ(angle: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the Z axis.
         */
        static RotationZToRef(angle: number, result: Matrix): void;
        /**
         * Returns a new rotation matrix for "angle" radians around the passed axis.
         */
        static RotationAxis(axis: Vector3, angle: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix for "angle" radians around the passed axis.
         */
        static RotationAxisToRef(axis: Vector3, angle: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a rotation matrix from the Euler angles (y, x, z).
         */
        static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Matrix;
        /**
         * Sets the passed matrix "result" as a rotation matrix from the Euler angles (y, x, z).
         */
        static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a scaling matrix from the passed floats (x, y, z).
         */
        static Scaling(x: number, y: number, z: number): Matrix;
        /**
         * Sets the passed matrix "result" as a scaling matrix from the passed floats (x, y, z).
         */
        static ScalingToRef(x: number, y: number, z: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a translation matrix from the passed floats (x, y, z).
         */
        static Translation(x: number, y: number, z: number): Matrix;
        /**
         * Sets the passed matrix "result" as a translation matrix from the passed floats (x, y, z).
         */
        static TranslationToRef(x: number, y: number, z: number, result: Matrix): void;
        /**
         * Returns a new Matrix whose values are the interpolated values for "gradien" (float) between the ones of the matrices "startValue" and "endValue".
         */
        static Lerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        /**
         * Returns a new Matrix whose values are computed by :
         * - decomposing the the "startValue" and "endValue" matrices into their respective scale, rotation and translation matrices,
         * - interpolating for "gradient" (float) the values between each of these decomposed matrices between the start and the end,
         * - recomposing a new matrix from these 3 interpolated scale, rotation and translation matrices.
         */
        static DecomposeLerp(startValue: Matrix, endValue: Matrix, gradient: number): Matrix;
        /**
         * Returns a new rotation Matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Left-Handed system.
         */
        static LookAtLH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        /**
         * Sets the passed "result" Matrix as a rotation matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Left-Handed system.
         */
        static LookAtLHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        /**
         * Returns a new rotation Matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Right-Handed system.
         */
        static LookAtRH(eye: Vector3, target: Vector3, up: Vector3): Matrix;
        /**
         * Sets the passed "result" Matrix as a rotation matrix used to rotate a mesh so as it looks at the target Vector3, from the eye Vector3, the UP vector3 being orientated like "up".
         * This methods works for a Left-Handed system.
         */
        static LookAtRHToRef(eye: Vector3, target: Vector3, up: Vector3, result: Matrix): void;
        /**
         * Returns a new Matrix as a left-handed orthographic projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.
         */
        static OrthoLH(width: number, height: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a left-handed orthographic projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.
         */
        static OrthoLHToRef(width: number, height: number, znear: number, zfar: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a left-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterLH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a left-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterLHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a right-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterRH(left: number, right: number, bottom: number, top: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a right-handed orthographic projection matrix computed from the passed floats : left, right, top and bottom being the coordinates of the projection plane, z near and far limits.
         */
        static OrthoOffCenterRHToRef(left: number, right: number, bottom: number, top: number, znear: number, zfar: number, result: Matrix): void;
        /**
         * Returns a new Matrix as a left-handed perspective projection matrix computed from the passed floats : width and height of the projection plane, z near and far limits.
         */
        static PerspectiveLH(width: number, height: number, znear: number, zfar: number): Matrix;
        /**
         * Returns a new Matrix as a left-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovLH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a left-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovLHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed?: boolean): void;
        /**
         * Returns a new Matrix as a right-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovRH(fov: number, aspect: number, znear: number, zfar: number): Matrix;
        /**
         * Sets the passed matrix "result" as a right-handed perspective projection matrix computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovRHToRef(fov: number, aspect: number, znear: number, zfar: number, result: Matrix, isVerticalFovFixed?: boolean): void;
        /**
         * Sets the passed matrix "result" as a left-handed perspective projection matrix  for WebVR computed from the passed floats : vertical angle of view (fov), width/height ratio (aspect), z near and far limits.
         */
        static PerspectiveFovWebVRToRef(fov: {
            upDegrees: number;
            downDegrees: number;
            leftDegrees: number;
            rightDegrees: number;
        }, znear: number, zfar: number, result: Matrix, rightHanded?: boolean): void;
        /**
         * Returns the final transformation matrix : world * view * projection * viewport
         */
        static GetFinalMatrix(viewport: Viewport, world: Matrix, view: Matrix, projection: Matrix, zmin: number, zmax: number): Matrix;
        /**
         * Returns a new Float32Array array with 4 elements : the 2x2 matrix extracted from the passed Matrix.
         */
        static GetAsMatrix2x2(matrix: Matrix): Float32Array;
        /**
         * Returns a new Float32Array array with 9 elements : the 3x3 matrix extracted from the passed Matrix.
         */
        static GetAsMatrix3x3(matrix: Matrix): Float32Array;
        /**
         * Compute the transpose of the passed Matrix.
         * Returns a new Matrix.
         */
        static Transpose(matrix: Matrix): Matrix;
        /**
         * Compute the transpose of the passed Matrix and store it in the result matrix.
         */
        static TransposeToRef(matrix: Matrix, result: Matrix): void;
        /**
         * Returns a new Matrix as the reflection  matrix across the passed plane.
         */
        static Reflection(plane: Plane): Matrix;
        /**
         * Sets the passed matrix "result" as the reflection matrix across the passed plane.
         */
        static ReflectionToRef(plane: Plane, result: Matrix): void;
        /**
         * Sets the passed matrix "mat" as a rotation matrix composed from the 3 passed  left handed axis.
         */
        static FromXYZAxesToRef(xaxis: Vector3, yaxis: Vector3, zaxis: Vector3, result: Matrix): void;
        /**
         * Sets the passed matrix "result" as a rotation matrix according to the passed quaternion.
         */
        static FromQuaternionToRef(quat: Quaternion, result: Matrix): void;
    }
    class Plane {
        normal: Vector3;
        d: number;
        /**
         * Creates a Plane object according to the passed floats a, b, c, d and the plane equation : ax + by + cz + d = 0
         */
        constructor(a: number, b: number, c: number, d: number);
        /**
         * Returns the plane coordinates as a new array of 4 elements [a, b, c, d].
         */
        asArray(): number[];
        /**
         * Returns a new plane copied from the current Plane.
         */
        clone(): Plane;
        /**
         * Returns the string "Plane".
         */
        getClassName(): string;
        /**
         * Returns the Plane hash code.
         */
        getHashCode(): number;
        /**
         * Normalize the current Plane in place.
         * Returns the updated Plane.
         */
        normalize(): Plane;
        /**
         * Returns a new Plane as the result of the transformation of the current Plane by the passed matrix.
         */
        transform(transformation: Matrix): Plane;
        /**
         * Returns the dot product (float) of the point coordinates and the plane normal.
         */
        dotCoordinate(point: Vector3): number;
        /**
         * Updates the current Plane from the plane defined by the three passed points.
         * Returns the updated Plane.
         */
        copyFromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
        /**
         * Boolean : True is the vector "direction"  is the same side than the plane normal.
         */
        isFrontFacingTo(direction: Vector3, epsilon: number): boolean;
        /**
         * Returns the signed distance (float) from the passed point to the Plane.
         */
        signedDistanceTo(point: Vector3): number;
        /**
         * Returns a new Plane from the passed array.
         */
        static FromArray(array: ArrayLike<number>): Plane;
        /**
         * Returns a new Plane defined by the three passed points.
         */
        static FromPoints(point1: Vector3, point2: Vector3, point3: Vector3): Plane;
        /**
         * Returns a new Plane the normal vector to this plane at the passed origin point.
         * Note : the vector "normal" is updated because normalized.
         */
        static FromPositionAndNormal(origin: Vector3, normal: Vector3): Plane;
        /**
         * Returns the signed distance between the plane defined by the normal vector at the "origin"" point and the passed other point.
         */
        static SignedDistanceToPlaneFromPositionAndNormal(origin: Vector3, normal: Vector3, point: Vector3): number;
    }
    class Viewport {
        x: number;
        y: number;
        width: number;
        height: number;
        /**
         * Creates a Viewport object located at (x, y) and sized (width, height).
         */
        constructor(x: number, y: number, width: number, height: number);
        toGlobal(renderWidthOrEngine: number | Engine, renderHeight: number): Viewport;
        /**
         * Returns a new Viewport copied from the current one.
         */
        clone(): Viewport;
    }
    class Frustum {
        /**
         * Returns a new array of 6 Frustum planes computed by the passed transformation matrix.
         */
        static GetPlanes(transform: Matrix): Plane[];
        static GetNearPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetFarPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetLeftPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetRightPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetTopPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        static GetBottomPlaneToRef(transform: Matrix, frustumPlane: Plane): void;
        /**
         * Sets the passed array "frustumPlanes" with the 6 Frustum planes computed by the passed transformation matrix.
         */
        static GetPlanesToRef(transform: Matrix, frustumPlanes: Plane[]): void;
    }
    enum Space {
        LOCAL = 0,
        WORLD = 1,
        BONE = 2,
    }
    class Axis {
        static X: Vector3;
        static Y: Vector3;
        static Z: Vector3;
    }
    class BezierCurve {
        /**
         * Returns the cubic Bezier interpolated value (float) at "t" (float) from the passed x1, y1, x2, y2 floats.
         */
        static interpolate(t: number, x1: number, y1: number, x2: number, y2: number): number;
    }
    enum Orientation {
        CW = 0,
        CCW = 1,
    }
    class Angle {
        private _radians;
        /**
         * Creates an Angle object of "radians" radians (float).
         */
        constructor(radians: number);
        /**
         * Returns the Angle value in degrees (float).
         */
        degrees: () => number;
        /**
         * Returns the Angle value in radians (float).
         */
        radians: () => number;
        /**
         * Returns a new Angle object valued with the angle value in radians between the two passed vectors.
         */
        static BetweenTwoPoints(a: Vector2, b: Vector2): Angle;
        /**
         * Returns a new Angle object from the passed float in radians.
         */
        static FromRadians(radians: number): Angle;
        /**
         * Returns a new Angle object from the passed float in degrees.
         */
        static FromDegrees(degrees: number): Angle;
    }
    class Arc2 {
        startPoint: Vector2;
        midPoint: Vector2;
        endPoint: Vector2;
        centerPoint: Vector2;
        radius: number;
        angle: Angle;
        startAngle: Angle;
        orientation: Orientation;
        /**
         * Creates an Arc object from the three passed points : start, middle and end.
         */
        constructor(startPoint: Vector2, midPoint: Vector2, endPoint: Vector2);
    }
    class Path2 {
        private _points;
        private _length;
        closed: boolean;
        /**
         * Creates a Path2 object from the starting 2D coordinates x and y.
         */
        constructor(x: number, y: number);
        /**
         * Adds a new segment until the passed coordinates (x, y) to the current Path2.
         * Returns the updated Path2.
         */
        addLineTo(x: number, y: number): Path2;
        /**
         * Adds _numberOfSegments_ segments according to the arc definition (middle point coordinates, end point coordinates, the arc start point being the current Path2 last point) to the current Path2.
         * Returns the updated Path2.
         */
        addArcTo(midX: number, midY: number, endX: number, endY: number, numberOfSegments?: number): Path2;
        /**
         * Closes the Path2.
         * Returns the Path2.
         */
        close(): Path2;
        /**
         * Returns the Path2 total length (float).
         */
        length(): number;
        /**
         * Returns the Path2 internal array of points.
         */
        getPoints(): Vector2[];
        /**
         * Returns a new Vector2 located at a percentage of the Path2 total length on this path.
         */
        getPointAtLengthPosition(normalizedLengthPosition: number): Vector2;
        /**
         * Returns a new Path2 starting at the coordinates (x, y).
         */
        static StartingAt(x: number, y: number): Path2;
    }
    class Path3D {
        path: Vector3[];
        private _curve;
        private _distances;
        private _tangents;
        private _normals;
        private _binormals;
        private _raw;
        /**
        * new Path3D(path, normal, raw)
        * Creates a Path3D. A Path3D is a logical math object, so not a mesh.
        * please read the description in the tutorial :  http://doc.babylonjs.com/tutorials/How_to_use_Path3D
        * path : an array of Vector3, the curve axis of the Path3D
        * normal (optional) : Vector3, the first wanted normal to the curve. Ex (0, 1, 0) for a vertical normal.
        * raw (optional, default false) : boolean, if true the returned Path3D isn't normalized. Useful to depict path acceleration or speed.
        */
        constructor(path: Vector3[], firstNormal?: Nullable<Vector3>, raw?: boolean);
        /**
         * Returns the Path3D array of successive Vector3 designing its curve.
         */
        getCurve(): Vector3[];
        /**
         * Returns an array populated with tangent vectors on each Path3D curve point.
         */
        getTangents(): Vector3[];
        /**
         * Returns an array populated with normal vectors on each Path3D curve point.
         */
        getNormals(): Vector3[];
        /**
         * Returns an array populated with binormal vectors on each Path3D curve point.
         */
        getBinormals(): Vector3[];
        /**
         * Returns an array populated with distances (float) of the i-th point from the first curve point.
         */
        getDistances(): number[];
        /**
         * Forces the Path3D tangent, normal, binormal and distance recomputation.
         * Returns the same object updated.
         */
        update(path: Vector3[], firstNormal?: Nullable<Vector3>): Path3D;
        private _compute(firstNormal);
        private _getFirstNonNullVector(index);
        private _getLastNonNullVector(index);
        private _normalVector(v0, vt, va);
    }
    class Curve3 {
        private _points;
        private _length;
        /**
         * Returns a Curve3 object along a Quadratic Bezier curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#quadratic-bezier-curve
         * @param v0 (Vector3) the origin point of the Quadratic Bezier
         * @param v1 (Vector3) the control point
         * @param v2 (Vector3) the end point of the Quadratic Bezier
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        static CreateQuadraticBezier(v0: Vector3, v1: Vector3, v2: Vector3, nbPoints: number): Curve3;
        /**
         * Returns a Curve3 object along a Cubic Bezier curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#cubic-bezier-curve
         * @param v0 (Vector3) the origin point of the Cubic Bezier
         * @param v1 (Vector3) the first control point
         * @param v2 (Vector3) the second control point
         * @param v3 (Vector3) the end point of the Cubic Bezier
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        static CreateCubicBezier(v0: Vector3, v1: Vector3, v2: Vector3, v3: Vector3, nbPoints: number): Curve3;
        /**
         * Returns a Curve3 object along a Hermite Spline curve : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#hermite-spline
         * @param p1 (Vector3) the origin point of the Hermite Spline
         * @param t1 (Vector3) the tangent vector at the origin point
         * @param p2 (Vector3) the end point of the Hermite Spline
         * @param t2 (Vector3) the tangent vector at the end point
         * @param nbPoints (integer) the wanted number of points in the curve
         */
        static CreateHermiteSpline(p1: Vector3, t1: Vector3, p2: Vector3, t2: Vector3, nbPoints: number): Curve3;
        /**
         * Returns a Curve3 object along a CatmullRom Spline curve :
         * @param points (array of Vector3) the points the spline must pass through. At least, four points required.
         * @param nbPoints (integer) the wanted number of points between each curve control points.
         */
        static CreateCatmullRomSpline(points: Vector3[], nbPoints: number): Curve3;
        /**
         * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
         * A Curve3 is designed from a series of successive Vector3.
         * Tuto : http://doc.babylonjs.com/tutorials/How_to_use_Curve3#curve3-object
         */
        constructor(points: Vector3[]);
        /**
         * Returns the Curve3 stored array of successive Vector3
         */
        getPoints(): Vector3[];
        /**
         * Returns the computed length (float) of the curve.
         */
        length(): number;
        /**
         * Returns a new instance of Curve3 object : var curve = curveA.continue(curveB);
         * This new Curve3 is built by translating and sticking the curveB at the end of the curveA.
         * curveA and curveB keep unchanged.
         */
        continue(curve: Curve3): Curve3;
        private _computeLength(path);
    }
    class PositionNormalVertex {
        position: Vector3;
        normal: Vector3;
        constructor(position?: Vector3, normal?: Vector3);
        clone(): PositionNormalVertex;
    }
    class PositionNormalTextureVertex {
        position: Vector3;
        normal: Vector3;
        uv: Vector2;
        constructor(position?: Vector3, normal?: Vector3, uv?: Vector2);
        clone(): PositionNormalTextureVertex;
    }
    class Tmp {
        static Color3: Color3[];
        static Vector2: Vector2[];
        static Vector3: Vector3[];
        static Vector4: Vector4[];
        static Quaternion: Quaternion[];
        static Matrix: Matrix[];
    }
}

declare module 'babylonjs/core' {
    class Scalar {
        /**
         * Two pi constants convenient for computation.
         */
        static TwoPi: number;
        /**
         * Boolean : true if the absolute difference between a and b is lower than epsilon (default = 1.401298E-45)
         */
        static WithinEpsilon(a: number, b: number, epsilon?: number): boolean;
        /**
         * Returns a string : the upper case translation of the number i to hexadecimal.
         */
        static ToHex(i: number): string;
        /**
         * Returns -1 if value is negative and +1 is value is positive.
         * Returns the value itself if it's equal to zero.
         */
        static Sign(value: number): number;
        /**
         * Returns the value itself if it's between min and max.
         * Returns min if the value is lower than min.
         * Returns max if the value is greater than max.
         */
        static Clamp(value: number, min?: number, max?: number): number;
        /**
         * Returns the log2 of value.
         */
        static Log2(value: number): number;
        /**
        * Loops the value, so that it is never larger than length and never smaller than 0.
        *
        * This is similar to the modulo operator but it works with floating point numbers.
        * For example, using 3.0 for t and 2.5 for length, the result would be 0.5.
        * With t = 5 and length = 2.5, the result would be 0.0.
        * Note, however, that the behaviour is not defined for negative numbers as it is for the modulo operator
        */
        static Repeat(value: number, length: number): number;
        /**
        * Normalize the value between 0.0 and 1.0 using min and max values
        */
        static Normalize(value: number, min: number, max: number): number;
        /**
        * Denormalize the value from 0.0 and 1.0 using min and max values
        */
        static Denormalize(normalized: number, min: number, max: number): number;
        /**
        * Calculates the shortest difference between two given angles given in degrees.
        */
        static DeltaAngle(current: number, target: number): number;
        /**
        * PingPongs the value t, so that it is never larger than length and never smaller than 0.
        *
        * The returned value will move back and forth between 0 and length
        */
        static PingPong(tx: number, length: number): number;
        /**
        * Interpolates between min and max with smoothing at the limits.
        *
        * This function interpolates between min and max in a similar way to Lerp. However, the interpolation will gradually speed up
        * from the start and slow down toward the end. This is useful for creating natural-looking animation, fading and other transitions.
        */
        static SmoothStep(from: number, to: number, tx: number): number;
        /**
        * Moves a value current towards target.
        *
        * This is essentially the same as Mathf.Lerp but instead the function will ensure that the speed never exceeds maxDelta.
        * Negative values of maxDelta pushes the value away from target.
        */
        static MoveTowards(current: number, target: number, maxDelta: number): number;
        /**
        * Same as MoveTowards but makes sure the values interpolate correctly when they wrap around 360 degrees.
        *
        * Variables current and target are assumed to be in degrees. For optimization reasons, negative values of maxDelta
        *  are not supported and may cause oscillation. To push current away from a target angle, add 180 to that angle instead.
        */
        static MoveTowardsAngle(current: number, target: number, maxDelta: number): number;
        /**
            * Creates a new scalar with values linearly interpolated of "amount" between the start scalar and the end scalar.
            */
        static Lerp(start: number, end: number, amount: number): number;
        /**
        * Same as Lerp but makes sure the values interpolate correctly when they wrap around 360 degrees.
        * The parameter t is clamped to the range [0, 1]. Variables a and b are assumed to be in degrees.
        */
        static LerpAngle(start: number, end: number, amount: number): number;
        /**
        * Calculates the linear parameter t that produces the interpolant value within the range [a, b].
        */
        static InverseLerp(a: number, b: number, value: number): number;
        /**
         * Returns a new scalar located for "amount" (float) on the Hermite spline defined by the scalars "value1", "value3", "tangent1", "tangent2".
         */
        static Hermite(value1: number, tangent1: number, value2: number, tangent2: number, amount: number): number;
        /**
        * Returns a random float number between and min and max values
        */
        static RandomRange(min: number, max: number): number;
        /**
        * This function returns percentage of a number in a given range.
        *
        * RangeToPercent(40,20,60) will return 0.5 (50%)
        * RangeToPercent(34,0,100) will return 0.34 (34%)
        */
        static RangeToPercent(number: number, min: number, max: number): number;
        /**
        * This function returns number that corresponds to the percentage in a given range.
        *
        * PercentToRange(0.34,0,100) will return 34.
        */
        static PercentToRange(percent: number, min: number, max: number): number;
        /**
         * Returns the angle converted to equivalent value between -Math.PI and Math.PI radians.
         * @param angle The angle to normalize in radian.
         * @return The converted angle.
         */
        static NormalizeRadians(angle: number): number;
    }
}

export interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    webkitURL: typeof URL;
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
    oRequestAnimationFrame(callback: FrameRequestCallback): number;
    WebGLRenderingContext: WebGLRenderingContext;
    MSGesture: MSGesture;
    CANNON: any;
    SIMD: any;
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
    PointerEvent: any;
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
    mozURL: typeof URL;
    msURL: typeof URL;
    VRFrameData: any;
}
export interface WebGLRenderingContext {
    drawArraysInstanced(mode: number, first: number, count: number, primcount: number): void;
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, primcount: number): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    createVertexArray(): any;
    bindVertexArray(vao?: WebGLVertexArrayObject | null): void;
    deleteVertexArray(vao: WebGLVertexArrayObject): void;
    blitFramebuffer(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number, dstX1: number, dstY1: number, mask: number, filter: number): void;
    renderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;
    bindBufferBase(target: number, index: number, buffer: WebGLBuffer | null): void;
    getUniformBlockIndex(program: WebGLProgram, uniformBlockName: string): number;
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: number, uniformBlockBinding: number): void;
    createQuery(): WebGLQuery;
    deleteQuery(query: WebGLQuery): void;
    beginQuery(target: number, query: WebGLQuery): void;
    endQuery(target: number): void;
    getQueryParameter(query: WebGLQuery, pname: number): any;
    getQuery(target: number, pname: number): any;
    MAX_SAMPLES: number;
    RGBA8: number;
    READ_FRAMEBUFFER: number;
    DRAW_FRAMEBUFFER: number;
    UNIFORM_BUFFER: number;
    HALF_FLOAT_OES: number;
    RGBA16F: number;
    RGBA32F: number;
    DEPTH24_STENCIL8: number;
    drawBuffers(buffers: number[]): void;
    readBuffer(src: number): void;
    readonly COLOR_ATTACHMENT0: number;
    readonly COLOR_ATTACHMENT1: number;
    readonly COLOR_ATTACHMENT2: number;
    readonly COLOR_ATTACHMENT3: number;
    ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    ANY_SAMPLES_PASSED: number;
    QUERY_RESULT_AVAILABLE: number;
    QUERY_RESULT: number;
}
export interface Document {
    mozCancelFullScreen(): void;
    msCancelFullScreen(): void;
    mozFullScreen: boolean;
    msIsFullScreen: boolean;
    fullscreen: boolean;
    mozPointerLockElement: HTMLElement;
    msPointerLockElement: HTMLElement;
    webkitPointerLockElement: HTMLElement;
}
export interface HTMLCanvasElement {
    msRequestPointerLock?(): void;
    mozRequestPointerLock?(): void;
    webkitRequestPointerLock?(): void;
}
export interface CanvasRenderingContext2D {
    msImageSmoothingEnabled: boolean;
}
export interface WebGLBuffer {
    references: number;
    capacity: number;
    is32Bits: boolean;
}
export interface WebGLProgram {
    transformFeedback?: WebGLTransformFeedback | null;
    __SPECTOR_rebuildProgram?: ((vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void) => void) | null;
}
export interface MouseEvent {
    mozMovementX: number;
    mozMovementY: number;
    webkitMovementX: number;
    webkitMovementY: number;
    msMovementX: number;
    msMovementY: number;
}
export interface Navigator {
    getVRDisplays: () => any;
    mozGetVRDevices: (any: any) => any;
    webkitGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    mozGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    msGetUserMedia(constraints: MediaStreamConstraints, successCallback: NavigatorUserMediaSuccessCallback, errorCallback: NavigatorUserMediaErrorCallback): void;
    webkitGetGamepads(): Gamepad[];
    msGetGamepads(): Gamepad[];
    webkitGamepads(): Gamepad[];
}
export interface HTMLVideoElement {
    mozSrcObject: any;
}
export interface Screen {
    orientation: string;
    mozOrientation: string;
}
export interface Math {
    fround(x: number): number;
    imul(a: number, b: number): number;
}
export interface SIMDglobal {
    SIMD: SIMD;
    Math: Math;
    Uint8Array: Uint8ArrayConstructor;
    Float32Array: Float32ArrayConstructor;
}
export interface SIMD {
    Float32x4: SIMD.Float32x4Constructor;
    Int32x4: SIMD.Int32x4Constructor;
    Int16x8: SIMD.Int16x8Constructor;
    Int8x16: SIMD.Int8x16Constructor;
    Uint32x4: SIMD.Uint32x4Constructor;
    Uint16x8: SIMD.Uint16x8Constructor;
    Uint8x16: SIMD.Uint8x16Constructor;
    Bool32x4: SIMD.Bool32x4Constructor;
    Bool16x8: SIMD.Bool16x8Constructor;
    Bool8x16: SIMD.Bool8x16Constructor;
}
export interface GamepadPose {
    hasOrientation: boolean;
    hasPosition: boolean;
    position?: Float32Array;
    linearVelocity?: Float32Array;
    linearAcceleration?: Float32Array;
    orientation?: Float32Array;
    angularVelocity?: Float32Array;
    angularAcceleration?: Float32Array;
}
declare namespace SIMD {
    interface Float32x4 {
        constructor: Float32x4Constructor;
        valueOf(): Float32x4;
        toLocaleString(): string;
        toString(): string;
    }
    interface Float32x4Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number): Float32x4;
        prototype: Float32x4;
        extractLane(simd: SIMD.Float32x4, lane: number): number;
        swizzle(a: SIMD.Float32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Float32x4;
        shuffle(a: SIMD.Float32x4, b: SIMD.Float32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Float32x4;
        check(a: SIMD.Float32x4): SIMD.Float32x4;
        splat(n: number): SIMD.Float32x4;
        replaceLane(simd: SIMD.Float32x4, lane: number, value: number): SIMD.Float32x4;
        select(selector: SIMD.Bool32x4, a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        equal(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        notEqual(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        lessThan(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        lessThanOrEqual(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        greaterThan(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        greaterThanOrEqual(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Bool32x4;
        add(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        sub(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        mul(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        div(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        neg(a: SIMD.Float32x4): SIMD.Float32x4;
        abs(a: SIMD.Float32x4): SIMD.Float32x4;
        min(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        max(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        minNum(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        maxNum(a: SIMD.Float32x4, b: SIMD.Float32x4): SIMD.Float32x4;
        reciprocalApproximation(a: SIMD.Float32x4): SIMD.Float32x4;
        reciprocalSqrtApproximation(a: SIMD.Float32x4): SIMD.Float32x4;
        sqrt(a: SIMD.Float32x4): SIMD.Float32x4;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        load1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        load2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        load3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Float32x4;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        store1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        store2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        store3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Float32x4): SIMD.Float32x4;
        fromInt32x4(value: SIMD.Int32x4): SIMD.Float32x4;
        fromUint32x4(value: SIMD.Uint32x4): SIMD.Float32x4;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Float32x4;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Float32x4;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Float32x4;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Float32x4;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Float32x4;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Float32x4;
    }
    interface Int32x4 {
        constructor: Int32x4Constructor;
        valueOf(): Int32x4;
        toLocaleString(): string;
        toString(): string;
    }
    interface Int32x4Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number): Int32x4;
        prototype: Int32x4;
        extractLane(simd: SIMD.Int32x4, lane: number): number;
        swizzle(a: SIMD.Int32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Int32x4;
        shuffle(a: SIMD.Int32x4, b: SIMD.Int32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Int32x4;
        check(a: SIMD.Int32x4): SIMD.Int32x4;
        splat(n: number): SIMD.Int32x4;
        replaceLane(simd: SIMD.Int32x4, lane: number, value: number): SIMD.Int32x4;
        select(selector: SIMD.Bool32x4, a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        equal(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        notEqual(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        lessThan(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        lessThanOrEqual(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        greaterThan(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        greaterThanOrEqual(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Bool32x4;
        and(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        or(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        xor(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        not(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        add(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        sub(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        mul(a: SIMD.Int32x4, b: SIMD.Int32x4): SIMD.Int32x4;
        neg(a: SIMD.Int32x4): SIMD.Int32x4;
        shiftLeftByScalar(a: SIMD.Int32x4, bits: number): SIMD.Int32x4;
        shiftRightByScalar(a: SIMD.Int32x4, bits: number): SIMD.Int32x4;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        load1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        load2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        load3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int32x4;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        store1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        store2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        store3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int32x4): SIMD.Int32x4;
        fromFloat32x4(value: SIMD.Float32x4): SIMD.Int32x4;
        fromUint32x4(value: SIMD.Uint32x4): SIMD.Int32x4;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Int32x4;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Int32x4;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Int32x4;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Int32x4;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Int32x4;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Int32x4;
    }
    interface Int16x8 {
        constructor: Int16x8Constructor;
        valueOf(): Int16x8;
        toLocaleString(): string;
        toString(): string;
    }
    interface Int16x8Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number): Int16x8;
        prototype: Int16x8;
        extractLane(simd: SIMD.Int16x8, lane: number): number;
        swizzle(a: SIMD.Int16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Int16x8;
        shuffle(a: SIMD.Int16x8, b: SIMD.Int16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Int16x8;
        check(a: SIMD.Int16x8): SIMD.Int16x8;
        splat(n: number): SIMD.Int16x8;
        replaceLane(simd: SIMD.Int16x8, lane: number, value: number): SIMD.Int16x8;
        select(selector: SIMD.Bool16x8, a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        equal(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        notEqual(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        lessThan(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        lessThanOrEqual(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        greaterThan(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        greaterThanOrEqual(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Bool16x8;
        and(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        or(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        xor(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        not(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        add(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        sub(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        mul(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        neg(a: SIMD.Int16x8): SIMD.Int16x8;
        shiftLeftByScalar(a: SIMD.Int16x8, bits: number): SIMD.Int16x8;
        shiftRightByScalar(a: SIMD.Int16x8, bits: number): SIMD.Int16x8;
        addSaturate(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        subSaturate(a: SIMD.Int16x8, b: SIMD.Int16x8): SIMD.Int16x8;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int16x8;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int16x8): SIMD.Int16x8;
        fromUint16x8(value: SIMD.Uint16x8): SIMD.Int16x8;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Int16x8;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Int16x8;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Int16x8;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Int16x8;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Int16x8;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Int16x8;
    }
    interface Int8x16 {
        constructor: Int8x16Constructor;
        valueOf(): Int8x16;
        toLocaleString(): string;
        toString(): string;
    }
    interface Int8x16Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number, s8?: number, s9?: number, s10?: number, s11?: number, s12?: number, s13?: number, s14?: number, s15?: number): Int8x16;
        prototype: Int8x16;
        extractLane(simd: SIMD.Int8x16, lane: number): number;
        swizzle(a: SIMD.Int8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Int8x16;
        shuffle(a: SIMD.Int8x16, b: SIMD.Int8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Int8x16;
        check(a: SIMD.Int8x16): SIMD.Int8x16;
        splat(n: number): SIMD.Int8x16;
        replaceLane(simd: SIMD.Int8x16, lane: number, value: number): SIMD.Int8x16;
        select(selector: SIMD.Bool8x16, a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        equal(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        notEqual(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        lessThan(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        lessThanOrEqual(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        greaterThan(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        greaterThanOrEqual(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Bool8x16;
        and(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        or(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        xor(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        not(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        add(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        sub(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        mul(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        neg(a: SIMD.Int8x16): SIMD.Int8x16;
        shiftLeftByScalar(a: SIMD.Int8x16, bits: number): SIMD.Int8x16;
        shiftRightByScalar(a: SIMD.Int8x16, bits: number): SIMD.Int8x16;
        addSaturate(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        subSaturate(a: SIMD.Int8x16, b: SIMD.Int8x16): SIMD.Int8x16;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Int8x16;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Int8x16): SIMD.Int8x16;
        fromUint8x16(value: SIMD.Uint8x16): SIMD.Int8x16;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Int8x16;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Int8x16;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Int8x16;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Int8x16;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Int8x16;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Int8x16;
    }
    interface Uint32x4 {
        constructor: Uint32x4Constructor;
        valueOf(): Uint32x4;
        toLocaleString(): string;
        toString(): string;
    }
    interface Uint32x4Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number): Uint32x4;
        prototype: Uint32x4;
        extractLane(simd: SIMD.Uint32x4, lane: number): number;
        swizzle(a: SIMD.Uint32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Uint32x4;
        shuffle(a: SIMD.Uint32x4, b: SIMD.Uint32x4, l1: number, l2: number, l3: number, l4: number): SIMD.Uint32x4;
        check(a: SIMD.Uint32x4): SIMD.Uint32x4;
        splat(n: number): SIMD.Uint32x4;
        replaceLane(simd: SIMD.Uint32x4, lane: number, value: number): SIMD.Uint32x4;
        select(selector: SIMD.Bool32x4, a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        equal(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        notEqual(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        lessThan(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        lessThanOrEqual(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        greaterThan(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        greaterThanOrEqual(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Bool32x4;
        and(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        or(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        xor(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        not(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        add(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        sub(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        mul(a: SIMD.Uint32x4, b: SIMD.Uint32x4): SIMD.Uint32x4;
        shiftLeftByScalar(a: SIMD.Uint32x4, bits: number): SIMD.Uint32x4;
        shiftRightByScalar(a: SIMD.Uint32x4, bits: number): SIMD.Uint32x4;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        load1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        load2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        load3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint32x4;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        store1(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        store2(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        store3(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint32x4): SIMD.Uint32x4;
        fromFloat32x4(value: SIMD.Float32x4): SIMD.Uint32x4;
        fromInt32x4(value: SIMD.Int32x4): SIMD.Uint32x4;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Uint32x4;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Uint32x4;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Uint32x4;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Uint32x4;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Uint32x4;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Uint32x4;
    }
    interface Uint16x8 {
        constructor: Uint16x8Constructor;
        valueOf(): Uint16x8;
        toLocaleString(): string;
        toString(): string;
    }
    interface Uint16x8Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number): Uint16x8;
        prototype: Uint16x8;
        extractLane(simd: SIMD.Uint16x8, lane: number): number;
        swizzle(a: SIMD.Uint16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Uint16x8;
        shuffle(a: SIMD.Uint16x8, b: SIMD.Uint16x8, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number): SIMD.Uint16x8;
        check(a: SIMD.Uint16x8): SIMD.Uint16x8;
        splat(n: number): SIMD.Uint16x8;
        replaceLane(simd: SIMD.Uint16x8, lane: number, value: number): SIMD.Uint16x8;
        select(selector: SIMD.Bool16x8, a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        equal(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        notEqual(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        lessThan(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        lessThanOrEqual(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        greaterThan(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        greaterThanOrEqual(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Bool16x8;
        and(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        or(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        xor(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        not(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        add(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        sub(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        mul(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        shiftLeftByScalar(a: SIMD.Uint16x8, bits: number): SIMD.Uint16x8;
        shiftRightByScalar(a: SIMD.Uint16x8, bits: number): SIMD.Uint16x8;
        addSaturate(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        subSaturate(a: SIMD.Uint16x8, b: SIMD.Uint16x8): SIMD.Uint16x8;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint16x8;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint16x8): SIMD.Uint16x8;
        fromInt16x8(value: SIMD.Int16x8): SIMD.Uint16x8;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Uint16x8;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Uint16x8;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Uint16x8;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Uint16x8;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Uint16x8;
        fromUint8x16Bits(value: SIMD.Uint8x16): SIMD.Uint16x8;
    }
    interface Uint8x16 {
        constructor: Uint8x16Constructor;
        valueOf(): Uint8x16;
        toLocaleString(): string;
        toString(): string;
    }
    interface Uint8x16Constructor {
        (s0?: number, s1?: number, s2?: number, s3?: number, s4?: number, s5?: number, s6?: number, s7?: number, s8?: number, s9?: number, s10?: number, s11?: number, s12?: number, s13?: number, s14?: number, s15?: number): Uint8x16;
        prototype: Uint8x16;
        extractLane(simd: SIMD.Uint8x16, lane: number): number;
        swizzle(a: SIMD.Uint8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Uint8x16;
        shuffle(a: SIMD.Uint8x16, b: SIMD.Uint8x16, l1: number, l2: number, l3: number, l4: number, l5: number, l6: number, l7: number, l8: number, l9: number, l10: number, l11: number, l12: number, l13: number, l14: number, l15: number, l16: number): SIMD.Uint8x16;
        check(a: SIMD.Uint8x16): SIMD.Uint8x16;
        splat(n: number): SIMD.Uint8x16;
        replaceLane(simd: SIMD.Uint8x16, lane: number, value: number): SIMD.Uint8x16;
        select(selector: SIMD.Bool8x16, a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        equal(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        notEqual(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        lessThan(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        lessThanOrEqual(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        greaterThan(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        greaterThanOrEqual(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Bool8x16;
        and(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        or(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        xor(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        not(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        add(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        sub(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        mul(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        shiftLeftByScalar(a: SIMD.Uint8x16, bits: number): SIMD.Uint8x16;
        shiftRightByScalar(a: SIMD.Uint8x16, bits: number): SIMD.Uint8x16;
        addSaturate(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        subSaturate(a: SIMD.Uint8x16, b: SIMD.Uint8x16): SIMD.Uint8x16;
        load(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number): SIMD.Uint8x16;
        store(tarray: Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array, index: number, value: SIMD.Uint8x16): SIMD.Uint8x16;
        fromInt8x16(value: SIMD.Int8x16): SIMD.Uint8x16;
        fromFloat32x4Bits(value: SIMD.Float32x4): SIMD.Uint8x16;
        fromInt32x4Bits(value: SIMD.Int32x4): SIMD.Uint8x16;
        fromInt16x8Bits(value: SIMD.Int16x8): SIMD.Uint8x16;
        fromInt8x16Bits(value: SIMD.Int8x16): SIMD.Uint8x16;
        fromUint32x4Bits(value: SIMD.Uint32x4): SIMD.Uint8x16;
        fromUint16x8Bits(value: SIMD.Uint16x8): SIMD.Uint8x16;
    }
    interface Bool32x4 {
        constructor: Bool32x4Constructor;
        valueOf(): Bool32x4;
        toLocaleString(): string;
        toString(): string;
    }
    interface Bool32x4Constructor {
        (s0?: boolean, s1?: boolean, s2?: boolean, s3?: boolean): Bool32x4;
        prototype: Bool32x4;
        extractLane(simd: SIMD.Bool32x4, lane: number): boolean;
        check(a: SIMD.Bool32x4): SIMD.Bool32x4;
        splat(n: boolean): SIMD.Bool32x4;
        replaceLane(simd: SIMD.Bool32x4, lane: number, value: boolean): SIMD.Bool32x4;
        allTrue(a: SIMD.Bool32x4): boolean;
        anyTrue(a: SIMD.Bool32x4): boolean;
        and(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
        or(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
        xor(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
        not(a: SIMD.Bool32x4, b: SIMD.Bool32x4): SIMD.Bool32x4;
    }
    interface Bool16x8 {
        constructor: Bool16x8Constructor;
        valueOf(): Bool16x8;
        toLocaleString(): string;
        toString(): string;
    }
    interface Bool16x8Constructor {
        (s0?: boolean, s1?: boolean, s2?: boolean, s3?: boolean, s4?: boolean, s5?: boolean, s6?: boolean, s7?: boolean): Bool16x8;
        prototype: Bool16x8;
        extractLane(simd: SIMD.Bool16x8, lane: number): boolean;
        check(a: SIMD.Bool16x8): SIMD.Bool16x8;
        splat(n: boolean): SIMD.Bool16x8;
        replaceLane(simd: SIMD.Bool16x8, lane: number, value: boolean): SIMD.Bool16x8;
        allTrue(a: SIMD.Bool16x8): boolean;
        anyTrue(a: SIMD.Bool16x8): boolean;
        and(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
        or(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
        xor(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
        not(a: SIMD.Bool16x8, b: SIMD.Bool16x8): SIMD.Bool16x8;
    }
    interface Bool8x16 {
        constructor: Bool8x16Constructor;
        valueOf(): Bool8x16;
        toLocaleString(): string;
        toString(): string;
    }
    interface Bool8x16Constructor {
        (s0?: boolean, s1?: boolean, s2?: boolean, s3?: boolean, s4?: boolean, s5?: boolean, s6?: boolean, s7?: boolean, s8?: boolean, s9?: boolean, s10?: boolean, s11?: boolean, s12?: boolean, s13?: boolean, s14?: boolean, s15?: boolean): Bool8x16;
        prototype: Bool8x16;
        extractLane(simd: SIMD.Bool8x16, lane: number): boolean;
        check(a: SIMD.Bool8x16): SIMD.Bool8x16;
        splat(n: boolean): SIMD.Bool8x16;
        replaceLane(simd: SIMD.Bool8x16, lane: number, value: boolean): SIMD.Bool8x16;
        allTrue(a: SIMD.Bool8x16): boolean;
        anyTrue(a: SIMD.Bool8x16): boolean;
        and(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
        or(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
        xor(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
        not(a: SIMD.Bool8x16, b: SIMD.Bool8x16): SIMD.Bool8x16;
    }
}
export interface EXT_disjoint_timer_query {
    QUERY_COUNTER_BITS_EXT: number;
    TIME_ELAPSED_EXT: number;
    TIMESTAMP_EXT: number;
    GPU_DISJOINT_EXT: number;
    QUERY_RESULT_EXT: number;
    QUERY_RESULT_AVAILABLE_EXT: number;
    queryCounterEXT(query: WebGLQuery, target: number): void;
    createQueryEXT(): WebGLQuery;
    beginQueryEXT(target: number, query: WebGLQuery): void;
    endQueryEXT(target: number): void;
    getQueryObjectEXT(query: WebGLQuery, target: number): any;
    deleteQueryEXT(query: WebGLQuery): void;
}

export interface WebGLRenderingContext {
    readonly RASTERIZER_DISCARD: number;
    readonly TEXTURE_3D: number;
    readonly TEXTURE_2D_ARRAY: number;
    readonly TEXTURE_WRAP_R: number;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ArrayBufferView, offset: number): void;
    texImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: ImageBitmap | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): void;
    compressedTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, data: ArrayBufferView, offset?: number, length?: number): void;
    readonly TRANSFORM_FEEDBACK: number;
    readonly INTERLEAVED_ATTRIBS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER: number;
    createTransformFeedback(): WebGLTransformFeedback;
    deleteTransformFeedback(transformFeedbac: WebGLTransformFeedback): void;
    bindTransformFeedback(target: number, transformFeedback: WebGLTransformFeedback | null): void;
    beginTransformFeedback(primitiveMode: number): void;
    endTransformFeedback(): void;
    transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: number): void;
}
export interface ImageBitmap {
    readonly width: number;
    readonly height: number;
    close(): void;
}
export interface WebGLQuery extends WebGLObject {
}
declare var WebGLQuery: {
    prototype: WebGLQuery;
    new (): WebGLQuery;
};
export interface WebGLSampler extends WebGLObject {
}
declare var WebGLSampler: {
    prototype: WebGLSampler;
    new (): WebGLSampler;
};
export interface WebGLSync extends WebGLObject {
}
declare var WebGLSync: {
    prototype: WebGLSync;
    new (): WebGLSync;
};
export interface WebGLTransformFeedback extends WebGLObject {
}
declare var WebGLTransformFeedback: {
    prototype: WebGLTransformFeedback;
    new (): WebGLTransformFeedback;
};
export interface WebGLVertexArrayObject extends WebGLObject {
}
declare var WebGLVertexArrayObject: {
    prototype: WebGLVertexArrayObject;
    new (): WebGLVertexArrayObject;
};

declare module 'babylonjs/core' {
    function expandToProperty(callback: string, targetKey?: Nullable<string>): (target: any, propertyKey: string) => void;
    function serialize(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsTexture(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsColor3(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsFresnelParameters(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsVector2(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsVector3(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsMeshReference(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsColorCurves(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsColor4(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsImageProcessingConfiguration(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    function serializeAsQuaternion(sourceName?: string): (target: any, propertyKey: string | symbol) => void;
    class SerializationHelper {
        static Serialize<T>(entity: T, serializationObject?: any): any;
        static Parse<T>(creationFunction: () => T, source: any, scene: Nullable<Scene>, rootUrl?: Nullable<string>): T;
        static Clone<T>(creationFunction: () => T, source: T): T;
        static Instanciate<T>(creationFunction: () => T, source: T): T;
    }
}

declare module 'babylonjs/core' {
    /**
     * A class serves as a medium between the observable and its observers
     */
    class EventState {
        /**
        * If the callback of a given Observer set skipNextObservers to true the following observers will be ignored
        */
        constructor(mask: number, skipNextObservers?: boolean, target?: any, currentTarget?: any);
        initalize(mask: number, skipNextObservers?: boolean, target?: any, currentTarget?: any): EventState;
        /**
         * An Observer can set this property to true to prevent subsequent observers of being notified
         */
        skipNextObservers: boolean;
        /**
         * Get the mask value that were used to trigger the event corresponding to this EventState object
         */
        mask: number;
        /**
         * The object that originally notified the event
         */
        target?: any;
        /**
         * The current object in the bubbling phase
         */
        currentTarget?: any;
    }
    /**
     * Represent an Observer registered to a given Observable object.
     */
    class Observer<T> {
        callback: (eventData: T, eventState: EventState) => void;
        mask: number;
        scope: any;
        constructor(callback: (eventData: T, eventState: EventState) => void, mask: number, scope?: any);
    }
    /**
     * Represent a list of observers registered to multiple Observables object.
     */
    class MultiObserver<T> {
        private _observers;
        private _observables;
        dispose(): void;
        static Watch<T>(observables: Observable<T>[], callback: (eventData: T, eventState: EventState) => void, mask?: number, scope?: any): MultiObserver<T>;
    }
    /**
     * The Observable class is a simple implementation of the Observable pattern.
     * There's one slight particularity though: a given Observable can notify its observer using a particular mask value, only the Observers registered with this mask value will be notified.
     * This enable a more fine grained execution without having to rely on multiple different Observable objects.
     * For instance you may have a given Observable that have four different types of notifications: Move (mask = 0x01), Stop (mask = 0x02), Turn Right (mask = 0X04), Turn Left (mask = 0X08).
     * A given observer can register itself with only Move and Stop (mask = 0x03), then it will only be notified when one of these two occurs and will never be for Turn Left/Right.
     */
    class Observable<T> {
        _observers: Observer<T>[];
        private _eventState;
        private _onObserverAdded;
        constructor(onObserverAdded?: (observer: Observer<T>) => void);
        /**
         * Create a new Observer with the specified callback
         * @param callback the callback that will be executed for that Observer
         * @param mask the mask used to filter observers
         * @param insertFirst if true the callback will be inserted at the first position, hence executed before the others ones. If false (default behavior) the callback will be inserted at the last position, executed after all the others already present.
         * @param scope optional scope for the callback to be called from
         */
        add(callback: (eventData: T, eventState: EventState) => void, mask?: number, insertFirst?: boolean, scope?: any): Nullable<Observer<T>>;
        /**
         * Remove an Observer from the Observable object
         * @param observer the instance of the Observer to remove. If it doesn't belong to this Observable, false will be returned.
         */
        remove(observer: Nullable<Observer<T>>): boolean;
        /**
         * Remove a callback from the Observable object
         * @param callback the callback to remove. If it doesn't belong to this Observable, false will be returned.
         * @param scope optional scope. If used only the callbacks with this scope will be removed.
        */
        removeCallback(callback: (eventData: T, eventState: EventState) => void, scope?: any): boolean;
        /**
         * Notify all Observers by calling their respective callback with the given data
         * Will return true if all observers were executed, false if an observer set skipNextObservers to true, then prevent the subsequent ones to execute
         * @param eventData
         * @param mask
         */
        notifyObservers(eventData: T, mask?: number, target?: any, currentTarget?: any): boolean;
        /**
         * Notify a specific observer
         * @param eventData
         * @param mask
         */
        notifyObserver(observer: Observer<T>, eventData: T, mask?: number): void;
        /**
         * return true is the Observable has at least one Observer registered
         */
        hasObservers(): boolean;
        /**
        * Clear the list of observers
        */
        clear(): void;
        /**
        * Clone the current observable
        */
        clone(): Observable<T>;
        /**
         * Does this observable handles observer registered with a given mask
         * @param {number} trigger - the mask to be tested
         * @return {boolean} whether or not one observer registered with the given mask is handeled
        **/
        hasSpecificMask(mask?: number): boolean;
    }
}

declare module 'babylonjs/core' {
    class SmartArray<T> {
        data: Array<T>;
        length: number;
        protected _id: number;
        [index: number]: T;
        constructor(capacity: number);
        push(value: T): void;
        forEach(func: (content: T) => void): void;
        sort(compareFn: (a: T, b: T) => number): void;
        reset(): void;
        dispose(): void;
        concat(array: any): void;
        indexOf(value: T): number;
        contains(value: T): boolean;
        private static _GlobalId;
    }
    class SmartArrayNoDuplicate<T> extends SmartArray<T> {
        private _duplicateId;
        [index: number]: T;
        push(value: T): void;
        pushNoDuplicate(value: T): boolean;
        reset(): void;
        concatWithNoDuplicate(array: any): void;
    }
}

declare module 'babylonjs/core' {
    interface IAnimatable {
        animations: Array<Animation>;
    }
    class LoadFileError extends Error {
        request: XMLHttpRequest | undefined;
        private static _setPrototypeOf;
        constructor(message: string, request?: XMLHttpRequest | undefined);
    }
    class RetryStrategy {
        static ExponentialBackoff(maxRetries?: number, baseInterval?: number): (url: string, request: XMLHttpRequest, retryIndex: number) => number;
    }
    interface IFileRequest {
        /**
         * Raised when the request is complete (success or error).
         */
        onCompleteObservable: Observable<IFileRequest>;
        /**
         * Aborts the request for a file.
         */
        abort: () => void;
    }
    class Tools {
        static BaseUrl: string;
        static DefaultRetryStrategy: (url: string, request: XMLHttpRequest, retryIndex: number) => number;
        /**
         * Default behaviour for cors in the application.
         * It can be a string if the expected behavior is identical in the entire app.
         * Or a callback to be able to set it per url or on a group of them (in case of Video source for instance)
         */
        static CorsBehavior: string | ((url: string | string[]) => string);
        static UseFallbackTexture: boolean;
        /**
         * Use this object to register external classes like custom textures or material
         * to allow the laoders to instantiate them
         */
        static RegisteredExternalClasses: {
            [key: string]: Object;
        };
        static fallbackTexture: string;
        /**
         * Interpolates between a and b via alpha
         * @param a The lower value (returned when alpha = 0)
         * @param b The upper value (returned when alpha = 1)
         * @param alpha The interpolation-factor
         * @return The mixed value
         */
        static Mix(a: number, b: number, alpha: number): number;
        static Instantiate(className: string): any;
        static SetImmediate(action: () => void): void;
        static IsExponentOfTwo(value: number): boolean;
        /**
         * Find the next highest power of two.
         * @param x Number to start search from.
         * @return Next highest power of two.
         */
        static CeilingPOT(x: number): number;
        /**
         * Find the next lowest power of two.
         * @param x Number to start search from.
         * @return Next lowest power of two.
         */
        static FloorPOT(x: number): number;
        /**
         * Find the nearest power of two.
         * @param x Number to start search from.
         * @return Next nearest power of two.
         */
        static NearestPOT(x: number): number;
        static GetExponentOfTwo(value: number, max: number, mode?: number): number;
        static GetFilename(path: string): string;
        static GetFolderPath(uri: string): string;
        static GetDOMTextContent(element: HTMLElement): string;
        static ToDegrees(angle: number): number;
        static ToRadians(angle: number): number;
        static EncodeArrayBufferTobase64(buffer: ArrayBuffer): string;
        static ExtractMinAndMaxIndexed(positions: FloatArray, indices: IndicesArray, indexStart: number, indexCount: number, bias?: Nullable<Vector2>): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static ExtractMinAndMax(positions: FloatArray, start: number, count: number, bias?: Nullable<Vector2>, stride?: number): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static Vector2ArrayFeeder(array: Array<Vector2> | Float32Array): (i: number) => Nullable<Vector2>;
        static ExtractMinAndMaxVector2(feeder: (index: number) => Vector2, bias?: Nullable<Vector2>): {
            minimum: Vector2;
            maximum: Vector2;
        };
        static MakeArray(obj: any, allowsNullUndefined?: boolean): Nullable<Array<any>>;
        static GetPointerPrefix(): string;
        /**
         * @param func - the function to be called
         * @param requester - the object that will request the next frame. Falls back to window.
         */
        static QueueNewFrame(func: () => void, requester?: any): number;
        static RequestFullscreen(element: HTMLElement): void;
        static ExitFullscreen(): void;
        static SetCorsBehavior(url: string | string[], element: {
            crossOrigin: string | null;
        }): void;
        static CleanUrl(url: string): string;
        static PreprocessUrl: (url: string) => string;
        static LoadImage(url: any, onLoad: (img: HTMLImageElement) => void, onError: (message?: string, exception?: any) => void, database: Nullable<Database>): HTMLImageElement;
        static LoadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, database?: Database, useArrayBuffer?: boolean, onError?: (request?: XMLHttpRequest, exception?: any) => void): IFileRequest;
        /**
         * Load a script (identified by an url). When the url returns, the
         * content of this file is added into a new script element, attached to the DOM (body element)
         */
        static LoadScript(scriptUrl: string, onSuccess: () => void, onError?: (message?: string, exception?: any) => void): void;
        static ReadFileAsDataURL(fileToLoad: Blob, callback: (data: any) => void, progressCallback: (this: MSBaseReader, ev: ProgressEvent) => any): IFileRequest;
        static ReadFile(fileToLoad: File, callback: (data: any) => void, progressCallBack?: (this: MSBaseReader, ev: ProgressEvent) => any, useArrayBuffer?: boolean): IFileRequest;
        static FileAsURL(content: string): string;
        static Format(value: number, decimals?: number): string;
        static CheckExtends(v: Vector3, min: Vector3, max: Vector3): void;
        static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void;
        static IsEmpty(obj: any): boolean;
        static RegisterTopRootEvents(events: {
            name: string;
            handler: Nullable<(e: FocusEvent) => any>;
        }[]): void;
        static UnregisterTopRootEvents(events: {
            name: string;
            handler: Nullable<(e: FocusEvent) => any>;
        }[]): void;
        static DumpFramebuffer(width: number, height: number, engine: Engine, successCallback?: (data: string) => void, mimeType?: string, fileName?: string): void;
        static EncodeScreenshotCanvasData(successCallback?: (data: string) => void, mimeType?: string, fileName?: string): void;
        static CreateScreenshot(engine: Engine, camera: Camera, size: any, successCallback?: (data: string) => void, mimeType?: string): void;
        static CreateScreenshotUsingRenderTarget(engine: Engine, camera: Camera, size: any, successCallback?: (data: string) => void, mimeType?: string, samples?: number, antialiasing?: boolean, fileName?: string): void;
        static ValidateXHRData(xhr: XMLHttpRequest, dataType?: number): boolean;
        /**
         * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
         * Be aware Math.random() could cause collisions, but:
         * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
         */
        static RandomId(): string;
        private static _NoneLogLevel;
        private static _MessageLogLevel;
        private static _WarningLogLevel;
        private static _ErrorLogLevel;
        private static _LogCache;
        static errorsCount: number;
        static OnNewCacheEntry: (entry: string) => void;
        static readonly NoneLogLevel: number;
        static readonly MessageLogLevel: number;
        static readonly WarningLogLevel: number;
        static readonly ErrorLogLevel: number;
        static readonly AllLogLevel: number;
        private static _AddLogEntry(entry);
        private static _FormatMessage(message);
        private static _LogDisabled(message);
        private static _LogEnabled(message);
        private static _WarnDisabled(message);
        private static _WarnEnabled(message);
        private static _ErrorDisabled(message);
        private static _ErrorEnabled(message);
        static Log: (message: string) => void;
        static Warn: (message: string) => void;
        static Error: (message: string) => void;
        static readonly LogCache: string;
        static ClearLogCache(): void;
        static LogLevels: number;
        static IsWindowObjectExist(): boolean;
        private static _PerformanceNoneLogLevel;
        private static _PerformanceUserMarkLogLevel;
        private static _PerformanceConsoleLogLevel;
        private static _performance;
        static readonly PerformanceNoneLogLevel: number;
        static readonly PerformanceUserMarkLogLevel: number;
        static readonly PerformanceConsoleLogLevel: number;
        static PerformanceLogLevel: number;
        static _StartPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _EndPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _StartUserMark(counterName: string, condition?: boolean): void;
        static _EndUserMark(counterName: string, condition?: boolean): void;
        static _StartPerformanceConsole(counterName: string, condition?: boolean): void;
        static _EndPerformanceConsole(counterName: string, condition?: boolean): void;
        static StartPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static EndPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static readonly Now: number;
        /**
         * This method will return the name of the class used to create the instance of the given object.
         * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator.
         * @param object the object to get the class name from
         * @return the name of the class, will be "object" for a custom data type not using the @className decorator
         */
        static GetClassName(object: any, isType?: boolean): string;
        static First<T>(array: Array<T>, predicate: (item: T) => boolean): Nullable<T>;
        /**
         * This method will return the name of the full name of the class, including its owning module (if any).
         * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator or implementing a method getClassName():string (in which case the module won't be specified).
         * @param object the object to get the class name from
         * @return a string that can have two forms: "moduleName.className" if module was specified when the class' Name was registered or "className" if there was not module specified.
         */
        static getFullClassName(object: any, isType?: boolean): Nullable<string>;
        /**
         * This method can be used with hashCodeFromStream when your input is an array of values that are either: number, string, boolean or custom type implementing the getHashCode():number method.
         * @param array
         */
        static arrayOrStringFeeder(array: any): (i: number) => number;
        /**
         * Compute the hashCode of a stream of number
         * To compute the HashCode on a string or an Array of data types implementing the getHashCode() method, use the arrayOrStringFeeder method.
         * @param feeder a callback that will be called until it returns null, each valid returned values will be used to compute the hash code.
         * @return the hash code computed
         */
        static hashCodeFromStream(feeder: (index: number) => number): number;
    }
    /**
     * This class is used to track a performance counter which is number based.
     * The user has access to many properties which give statistics of different nature
     *
     * The implementer can track two kinds of Performance Counter: time and count
     * For time you can optionally call fetchNewFrame() to notify the start of a new frame to monitor, then call beginMonitoring() to start and endMonitoring() to record the lapsed time. endMonitoring takes a newFrame parameter for you to specify if the monitored time should be set for a new frame or accumulated to the current frame being monitored.
     * For count you first have to call fetchNewFrame() to notify the start of a new frame to monitor, then call addCount() how many time required to increment the count value you monitor.
     */
    class PerfCounter {
        static Enabled: boolean;
        /**
         * Returns the smallest value ever
         */
        readonly min: number;
        /**
         * Returns the biggest value ever
         */
        readonly max: number;
        /**
         * Returns the average value since the performance counter is running
         */
        readonly average: number;
        /**
         * Returns the average value of the last second the counter was monitored
         */
        readonly lastSecAverage: number;
        /**
         * Returns the current value
         */
        readonly current: number;
        readonly total: number;
        readonly count: number;
        constructor();
        /**
         * Call this method to start monitoring a new frame.
         * This scenario is typically used when you accumulate monitoring time many times for a single frame, you call this method at the start of the frame, then beginMonitoring to start recording and endMonitoring(false) to accumulated the recorded time to the PerfCounter or addCount() to accumulate a monitored count.
         */
        fetchNewFrame(): void;
        /**
         * Call this method to monitor a count of something (e.g. mesh drawn in viewport count)
         * @param newCount the count value to add to the monitored count
         * @param fetchResult true when it's the last time in the frame you add to the counter and you wish to update the statistics properties (min/max/average), false if you only want to update statistics.
         */
        addCount(newCount: number, fetchResult: boolean): void;
        /**
         * Start monitoring this performance counter
         */
        beginMonitoring(): void;
        /**
         * Compute the time lapsed since the previous beginMonitoring() call.
         * @param newFrame true by default to fetch the result and monitor a new frame, if false the time monitored will be added to the current frame counter
         */
        endMonitoring(newFrame?: boolean): void;
        private _fetchResult();
        private _startMonitoringTime;
        private _min;
        private _max;
        private _average;
        private _current;
        private _totalValueCount;
        private _totalAccumulated;
        private _lastSecAverage;
        private _lastSecAccumulated;
        private _lastSecTime;
        private _lastSecValueCount;
    }
    /**
     * Use this className as a decorator on a given class definition to add it a name and optionally its module.
     * You can then use the Tools.getClassName(obj) on an instance to retrieve its class name.
     * This method is the only way to get it done in all cases, even if the .js file declaring the class is minified
     * @param name The name of the class, case should be preserved
     * @param module The name of the Module hosting the class, optional, but strongly recommended to specify if possible. Case should be preserved.
     */
    function className(name: string, module?: string): (target: Object) => void;
    /**
    * An implementation of a loop for asynchronous functions.
    */
    class AsyncLoop {
        iterations: number;
        private _fn;
        private _successCallback;
        index: number;
        private _done;
        /**
         * Constroctor.
         * @param iterations the number of iterations.
         * @param _fn the function to run each iteration
         * @param _successCallback the callback that will be called upon succesful execution
         * @param offset starting offset.
         */
        constructor(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset?: number);
        /**
         * Execute the next iteration. Must be called after the last iteration was finished.
         */
        executeNext(): void;
        /**
         * Break the loop and run the success callback.
         */
        breakLoop(): void;
        /**
         * Helper function
         */
        static Run(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset?: number): AsyncLoop;
        /**
         * A for-loop that will run a given number of iterations synchronous and the rest async.
         * @param iterations total number of iterations
         * @param syncedIterations number of synchronous iterations in each async iteration.
         * @param fn the function to call each iteration.
         * @param callback a success call back that will be called when iterating stops.
         * @param breakFunction a break condition (optional)
         * @param timeout timeout settings for the setTimeout function. default - 0.
         * @constructor
         */
        static SyncAsyncForLoop(iterations: number, syncedIterations: number, fn: (iteration: number) => void, callback: () => void, breakFunction?: () => boolean, timeout?: number): void;
    }
}

declare module 'babylonjs/core' {
    class _AlphaState {
        private _isAlphaBlendDirty;
        private _isBlendFunctionParametersDirty;
        private _isBlendEquationParametersDirty;
        private _isBlendConstantsDirty;
        private _alphaBlend;
        private _blendFunctionParameters;
        private _blendEquationParameters;
        private _blendConstants;
        /**
         * Initializes the state.
         */
        constructor();
        readonly isDirty: boolean;
        alphaBlend: boolean;
        setAlphaBlendConstants(r: number, g: number, b: number, a: number): void;
        setAlphaBlendFunctionParameters(value0: number, value1: number, value2: number, value3: number): void;
        setAlphaEquationParameters(rgb: number, alpha: number): void;
        reset(): void;
        apply(gl: WebGLRenderingContext): void;
    }
}

declare module 'babylonjs/core' {
    class _DepthCullingState {
        private _isDepthTestDirty;
        private _isDepthMaskDirty;
        private _isDepthFuncDirty;
        private _isCullFaceDirty;
        private _isCullDirty;
        private _isZOffsetDirty;
        private _isFrontFaceDirty;
        private _depthTest;
        private _depthMask;
        private _depthFunc;
        private _cull;
        private _cullFace;
        private _zOffset;
        private _frontFace;
        /**
         * Initializes the state.
         */
        constructor();
        readonly isDirty: boolean;
        zOffset: number;
        cullFace: Nullable<number>;
        cull: Nullable<boolean>;
        depthFunc: Nullable<number>;
        depthMask: boolean;
        depthTest: boolean;
        frontFace: Nullable<number>;
        reset(): void;
        apply(gl: WebGLRenderingContext): void;
    }
}

declare module 'babylonjs/core' {
    class _StencilState {
        private _isStencilTestDirty;
        private _isStencilMaskDirty;
        private _isStencilFuncDirty;
        private _isStencilOpDirty;
        private _stencilTest;
        private _stencilMask;
        private _stencilFunc;
        private _stencilFuncRef;
        private _stencilFuncMask;
        private _stencilOpStencilFail;
        private _stencilOpDepthFail;
        private _stencilOpStencilDepthPass;
        readonly isDirty: boolean;
        stencilFunc: number;
        stencilFuncRef: number;
        stencilFuncMask: number;
        stencilOpStencilFail: number;
        stencilOpDepthFail: number;
        stencilOpStencilDepthPass: number;
        stencilMask: number;
        stencilTest: boolean;
        constructor();
        reset(): void;
        apply(gl: WebGLRenderingContext): void;
    }
}

declare module 'babylonjs/core' {
    class InstancingAttributeInfo {
        /**
         * Index/offset of the attribute in the vertex shader
         */
        index: number;
        /**
         * size of the attribute, 1, 2, 3 or 4
         */
        attributeSize: number;
        /**
         * type of the attribute, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
         * default is FLOAT
         */
        attribyteType: number;
        /**
         * normalization of fixed-point data. behavior unclear, use FALSE, default is FALSE
         */
        normalized: boolean;
        /**
         * Offset of the data in the Vertex Buffer acting as the instancing buffer
         */
        offset: number;
        /**
         * Name of the GLSL attribute, for debugging purpose only
         */
        attributeName: string;
    }
    /**
     * Define options used to create a render target texture
     */
    class RenderTargetCreationOptions {
        generateMipMaps?: boolean;
        generateDepthBuffer?: boolean;
        generateStencilBuffer?: boolean;
        type?: number;
        samplingMode?: number;
    }
    /**
     * Regroup several parameters relative to the browser in use
     */
    class EngineCapabilities {
        /** The maximum textures image */
        maxTexturesImageUnits: number;
        maxVertexTextureImageUnits: number;
        maxCombinedTexturesImageUnits: number;
        /** The maximum texture size */
        maxTextureSize: number;
        maxCubemapTextureSize: number;
        maxRenderTextureSize: number;
        maxVertexAttribs: number;
        maxVaryingVectors: number;
        maxVertexUniformVectors: number;
        maxFragmentUniformVectors: number;
        standardDerivatives: boolean;
        s3tc: Nullable<WEBGL_compressed_texture_s3tc>;
        pvrtc: any;
        etc1: any;
        etc2: any;
        astc: any;
        textureFloat: boolean;
        vertexArrayObject: boolean;
        textureAnisotropicFilterExtension: Nullable<EXT_texture_filter_anisotropic>;
        maxAnisotropy: number;
        instancedArrays: boolean;
        uintIndices: boolean;
        highPrecisionShaderSupported: boolean;
        fragmentDepthSupported: boolean;
        textureFloatLinearFiltering: boolean;
        textureFloatRender: boolean;
        textureHalfFloat: boolean;
        textureHalfFloatLinearFiltering: boolean;
        textureHalfFloatRender: boolean;
        textureLOD: boolean;
        drawBuffersExtension: boolean;
        depthTextureExtension: boolean;
        colorBufferFloat: boolean;
        timerQuery: EXT_disjoint_timer_query;
        canUseTimestampForTimerQuery: boolean;
    }
    interface EngineOptions extends WebGLContextAttributes {
        limitDeviceRatio?: number;
        autoEnableWebVR?: boolean;
        disableWebGL2Support?: boolean;
        audioEngine?: boolean;
        deterministicLockstep?: boolean;
        lockstepMaxSteps?: number;
        doNotHandleContextLost?: boolean;
    }
    interface IDisplayChangedEventArgs {
        vrDisplay: any;
        vrSupported: boolean;
    }
    /**
     * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio.
     */
    class Engine {
        /** Use this array to turn off some WebGL2 features on known buggy browsers version */
        static ExceptionList: ({
            key: string;
            capture: string;
            captureConstraint: number;
            targets: string[];
        } | {
            key: string;
            capture: null;
            captureConstraint: null;
            targets: string[];
        })[];
        static Instances: Engine[];
        static readonly LastCreatedEngine: Nullable<Engine>;
        static readonly LastCreatedScene: Nullable<Scene>;
        /**
         * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
         */
        static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void;
        private static _ALPHA_DISABLE;
        private static _ALPHA_ADD;
        private static _ALPHA_COMBINE;
        private static _ALPHA_SUBTRACT;
        private static _ALPHA_MULTIPLY;
        private static _ALPHA_MAXIMIZED;
        private static _ALPHA_ONEONE;
        private static _ALPHA_PREMULTIPLIED;
        private static _ALPHA_PREMULTIPLIED_PORTERDUFF;
        private static _ALPHA_INTERPOLATE;
        private static _ALPHA_SCREENMODE;
        private static _DELAYLOADSTATE_NONE;
        private static _DELAYLOADSTATE_LOADED;
        private static _DELAYLOADSTATE_LOADING;
        private static _DELAYLOADSTATE_NOTLOADED;
        private static _TEXTUREFORMAT_ALPHA;
        private static _TEXTUREFORMAT_LUMINANCE;
        private static _TEXTUREFORMAT_LUMINANCE_ALPHA;
        private static _TEXTUREFORMAT_RGB;
        private static _TEXTUREFORMAT_RGBA;
        private static _TEXTURETYPE_UNSIGNED_INT;
        private static _TEXTURETYPE_FLOAT;
        private static _TEXTURETYPE_HALF_FLOAT;
        private static _NEVER;
        private static _ALWAYS;
        private static _LESS;
        private static _EQUAL;
        private static _LEQUAL;
        private static _GREATER;
        private static _GEQUAL;
        private static _NOTEQUAL;
        static readonly NEVER: number;
        static readonly ALWAYS: number;
        static readonly LESS: number;
        static readonly EQUAL: number;
        static readonly LEQUAL: number;
        static readonly GREATER: number;
        static readonly GEQUAL: number;
        static readonly NOTEQUAL: number;
        private static _KEEP;
        private static _REPLACE;
        private static _INCR;
        private static _DECR;
        private static _INVERT;
        private static _INCR_WRAP;
        private static _DECR_WRAP;
        static readonly KEEP: number;
        static readonly REPLACE: number;
        static readonly INCR: number;
        static readonly DECR: number;
        static readonly INVERT: number;
        static readonly INCR_WRAP: number;
        static readonly DECR_WRAP: number;
        static readonly ALPHA_DISABLE: number;
        static readonly ALPHA_ONEONE: number;
        static readonly ALPHA_ADD: number;
        static readonly ALPHA_COMBINE: number;
        static readonly ALPHA_SUBTRACT: number;
        static readonly ALPHA_MULTIPLY: number;
        static readonly ALPHA_MAXIMIZED: number;
        static readonly ALPHA_PREMULTIPLIED: number;
        static readonly ALPHA_PREMULTIPLIED_PORTERDUFF: number;
        static readonly ALPHA_INTERPOLATE: number;
        static readonly ALPHA_SCREENMODE: number;
        static readonly DELAYLOADSTATE_NONE: number;
        static readonly DELAYLOADSTATE_LOADED: number;
        static readonly DELAYLOADSTATE_LOADING: number;
        static readonly DELAYLOADSTATE_NOTLOADED: number;
        static readonly TEXTUREFORMAT_ALPHA: number;
        static readonly TEXTUREFORMAT_LUMINANCE: number;
        static readonly TEXTUREFORMAT_LUMINANCE_ALPHA: number;
        static readonly TEXTUREFORMAT_RGB: number;
        static readonly TEXTUREFORMAT_RGBA: number;
        static readonly TEXTURETYPE_UNSIGNED_INT: number;
        static readonly TEXTURETYPE_FLOAT: number;
        static readonly TEXTURETYPE_HALF_FLOAT: number;
        private static _SCALEMODE_FLOOR;
        private static _SCALEMODE_NEAREST;
        private static _SCALEMODE_CEILING;
        static readonly SCALEMODE_FLOOR: number;
        static readonly SCALEMODE_NEAREST: number;
        static readonly SCALEMODE_CEILING: number;
        static readonly Version: string;
        static CollisionsEpsilon: number;
        static CodeRepository: string;
        static ShadersRepository: string;
        forcePOTTextures: boolean;
        isFullscreen: boolean;
        isPointerLock: boolean;
        cullBackFaces: boolean;
        renderEvenInBackground: boolean;
        preventCacheWipeBetweenFrames: boolean;
        enableOfflineSupport: boolean;
        scenes: Scene[];
        postProcesses: PostProcess[];
        /**
         * Observable event triggered each time the rendering canvas is resized
         */
        onResizeObservable: Observable<Engine>;
        /**
         * Observable event triggered each time the canvas loses focus
         */
        onCanvasBlurObservable: Observable<Engine>;
        /**
         * Observable event triggered each time the canvas gains focus
         */
        onCanvasFocusObservable: Observable<Engine>;
        /**
         * Observable event triggered each time the canvas receives pointerout event
         */
        onCanvasPointerOutObservable: Observable<Engine>;
        /**
         * Observable event triggered before each texture is initialized
         */
        onBeforeTextureInitObservable: Observable<Texture>;
        private _vrDisplay;
        private _vrSupported;
        private _oldSize;
        private _oldHardwareScaleFactor;
        private _vrExclusivePointerMode;
        readonly isInVRExclusivePointerMode: boolean;
        disableUniformBuffers: boolean;
        _uniformBuffers: UniformBuffer[];
        readonly supportsUniformBuffers: boolean;
        /**
         * Observable raised when the engine begins a new frame
         */
        onBeginFrameObservable: Observable<Engine>;
        /**
         * Observable raised when the engine ends the current frame
         */
        onEndFrameObservable: Observable<Engine>;
        /**
         * Observable raised when the engine is about to compile a shader
         */
        onBeforeShaderCompilationObservable: Observable<Engine>;
        /**
         * Observable raised when the engine has jsut compiled a shader
         */
        onAfterShaderCompilationObservable: Observable<Engine>;
        private _gl;
        private _renderingCanvas;
        private _windowIsBackground;
        private _webGLVersion;
        readonly needPOTTextures: boolean;
        private _badOS;
        readonly badOS: boolean;
        private _badDesktopOS;
        readonly badDesktopOS: boolean;
        static audioEngine: AudioEngine;
        private _onFocus;
        private _onBlur;
        private _onCanvasPointerOut;
        private _onCanvasBlur;
        private _onCanvasFocus;
        private _onFullscreenChange;
        private _onPointerLockChange;
        private _onVRDisplayPointerRestricted;
        private _onVRDisplayPointerUnrestricted;
        private _onVrDisplayConnect;
        private _onVrDisplayDisconnect;
        private _onVrDisplayPresentChange;
        onVRDisplayChangedObservable: Observable<IDisplayChangedEventArgs>;
        onVRRequestPresentComplete: Observable<boolean>;
        onVRRequestPresentStart: Observable<Engine>;
        private _hardwareScalingLevel;
        protected _caps: EngineCapabilities;
        private _pointerLockRequested;
        private _alphaTest;
        private _isStencilEnable;
        private _colorWrite;
        private _loadingScreen;
        _drawCalls: PerfCounter;
        _textureCollisions: PerfCounter;
        private _glVersion;
        private _glRenderer;
        private _glVendor;
        private _videoTextureSupported;
        private _renderingQueueLaunched;
        private _activeRenderLoops;
        private _deterministicLockstep;
        private _lockstepMaxSteps;
        onContextLostObservable: Observable<Engine>;
        onContextRestoredObservable: Observable<Engine>;
        private _onContextLost;
        private _onContextRestored;
        private _contextWasLost;
        private _doNotHandleContextLost;
        private _performanceMonitor;
        private _fps;
        private _deltaTime;
        /**
         * Turn this value on if you want to pause FPS computation when in background
         */
        disablePerformanceMonitorInBackground: boolean;
        readonly performanceMonitor: PerformanceMonitor;
        protected _depthCullingState: _DepthCullingState;
        protected _stencilState: _StencilState;
        protected _alphaState: _AlphaState;
        protected _alphaMode: number;
        private _internalTexturesCache;
        protected _activeChannel: number;
        protected _boundTexturesCache: {
            [key: string]: Nullable<InternalTexture>;
        };
        protected _boundTexturesStack: InternalTexture[];
        protected _currentEffect: Nullable<Effect>;
        protected _currentProgram: Nullable<WebGLProgram>;
        private _compiledEffects;
        private _vertexAttribArraysEnabled;
        protected _cachedViewport: Nullable<Viewport>;
        private _cachedVertexArrayObject;
        protected _cachedVertexBuffers: any;
        protected _cachedIndexBuffer: Nullable<WebGLBuffer>;
        protected _cachedEffectForVertexBuffers: Nullable<Effect>;
        protected _currentRenderTarget: Nullable<InternalTexture>;
        private _uintIndicesCurrentlySet;
        private _currentBoundBuffer;
        protected _currentFramebuffer: Nullable<WebGLFramebuffer>;
        private _currentBufferPointers;
        private _currentInstanceLocations;
        private _currentInstanceBuffers;
        private _textureUnits;
        private _workingCanvas;
        private _workingContext;
        private _rescalePostProcess;
        private _dummyFramebuffer;
        private _externalData;
        private _bindedRenderFunction;
        private _vaoRecordInProgress;
        private _mustWipeVertexAttributes;
        private _emptyTexture;
        private _emptyCubeTexture;
        private _emptyTexture3D;
        private _frameHandler;
        private _nextFreeTextureSlots;
        private _activeRequests;
        private _texturesSupported;
        private _textureFormatInUse;
        readonly texturesSupported: Array<string>;
        readonly textureFormatInUse: Nullable<string>;
        readonly currentViewport: Nullable<Viewport>;
        readonly emptyTexture: InternalTexture;
        readonly emptyTexture3D: InternalTexture;
        readonly emptyCubeTexture: InternalTexture;
        /**
         * @constructor
         * @param {HTMLCanvasElement | WebGLRenderingContext} canvasOrContext - the canvas or the webgl context to be used for rendering
         * @param {boolean} [antialias] - enable antialias
         * @param options - further options to be sent to the getContext function
         */
        constructor(canvasOrContext: Nullable<HTMLCanvasElement | WebGLRenderingContext>, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio?: boolean);
        private _rebuildInternalTextures();
        private _rebuildEffects();
        private _rebuildBuffers();
        private _initGLContext();
        readonly webGLVersion: number;
        /**
         * Returns true if the stencil buffer has been enabled through the creation option of the context.
         */
        readonly isStencilEnable: boolean;
        private _prepareWorkingCanvas();
        resetTextureCache(): void;
        isDeterministicLockStep(): boolean;
        getLockstepMaxSteps(): number;
        getGlInfo(): {
            vendor: string;
            renderer: string;
            version: string;
        };
        getAspectRatio(camera: Camera, useScreen?: boolean): number;
        getRenderWidth(useScreen?: boolean): number;
        getRenderHeight(useScreen?: boolean): number;
        getRenderingCanvas(): Nullable<HTMLCanvasElement>;
        getRenderingCanvasClientRect(): Nullable<ClientRect>;
        setHardwareScalingLevel(level: number): void;
        getHardwareScalingLevel(): number;
        getLoadedTexturesCache(): InternalTexture[];
        getCaps(): EngineCapabilities;
        /** The number of draw calls submitted last frame */
        readonly drawCalls: number;
        readonly drawCallsPerfCounter: Nullable<PerfCounter>;
        getDepthFunction(): Nullable<number>;
        setDepthFunction(depthFunc: number): void;
        setDepthFunctionToGreater(): void;
        setDepthFunctionToGreaterOrEqual(): void;
        setDepthFunctionToLess(): void;
        setDepthFunctionToLessOrEqual(): void;
        getStencilBuffer(): boolean;
        setStencilBuffer(enable: boolean): void;
        getStencilMask(): number;
        setStencilMask(mask: number): void;
        getStencilFunction(): number;
        getStencilFunctionReference(): number;
        getStencilFunctionMask(): number;
        setStencilFunction(stencilFunc: number): void;
        setStencilFunctionReference(reference: number): void;
        setStencilFunctionMask(mask: number): void;
        getStencilOperationFail(): number;
        getStencilOperationDepthFail(): number;
        getStencilOperationPass(): number;
        setStencilOperationFail(operation: number): void;
        setStencilOperationDepthFail(operation: number): void;
        setStencilOperationPass(operation: number): void;
        setDitheringState(value: boolean): void;
        setRasterizerState(value: boolean): void;
        /**
         * stop executing a render loop function and remove it from the execution array
         * @param {Function} [renderFunction] the function to be removed. If not provided all functions will be removed.
         */
        stopRenderLoop(renderFunction?: () => void): void;
        _renderLoop(): void;
        /**
         * Register and execute a render loop. The engine can have more than one render function.
         * @param {Function} renderFunction - the function to continuously execute starting the next render loop.
         * @example
         * engine.runRenderLoop(function () {
         *      scene.render()
         * })
         */
        runRenderLoop(renderFunction: () => void): void;
        /**
         * Toggle full screen mode.
         * @param {boolean} requestPointerLock - should a pointer lock be requested from the user
         * @param {any} options - an options object to be sent to the requestFullscreen function
         */
        switchFullscreen(requestPointerLock: boolean): void;
        clear(color: Nullable<Color4>, backBuffer: boolean, depth: boolean, stencil?: boolean): void;
        scissorClear(x: number, y: number, width: number, height: number, clearColor: Color4): void;
        /**
         * Set the WebGL's viewport
         * @param {BABYLON.Viewport} viewport - the viewport element to be used.
         * @param {number} [requiredWidth] - the width required for rendering. If not provided the rendering canvas' width is used.
         * @param {number} [requiredHeight] - the height required for rendering. If not provided the rendering canvas' height is used.
         */
        setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void;
        /**
         * Directly set the WebGL Viewport
         * The x, y, width & height are directly passed to the WebGL call
         * @return the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state.
         */
        setDirectViewport(x: number, y: number, width: number, height: number): Nullable<Viewport>;
        beginFrame(): void;
        endFrame(): void;
        /**
         * resize the view according to the canvas' size.
         * @example
         *   window.addEventListener("resize", function () {
         *      engine.resize();
         *   });
         */
        resize(): void;
        /**
         * force a specific size of the canvas
         * @param {number} width - the new canvas' width
         * @param {number} height - the new canvas' height
         */
        setSize(width: number, height: number): void;
        isVRDevicePresent(): boolean;
        getVRDevice(): any;
        initWebVR(): Observable<{
            vrDisplay: any;
            vrSupported: any;
        }>;
        enableVR(): void;
        disableVR(): void;
        private _onVRFullScreenTriggered;
        private _getVRDisplays(callback);
        bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void;
        private bindUnboundFramebuffer(framebuffer);
        unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps?: boolean, onBeforeUnbind?: () => void): void;
        unBindMultiColorAttachmentFramebuffer(textures: InternalTexture[], disableGenerateMipMaps?: boolean, onBeforeUnbind?: () => void): void;
        generateMipMapsForCubemap(texture: InternalTexture): void;
        flushFramebuffer(): void;
        restoreDefaultFramebuffer(): void;
        createUniformBuffer(elements: FloatArray): WebGLBuffer;
        createDynamicUniformBuffer(elements: FloatArray): WebGLBuffer;
        updateUniformBuffer(uniformBuffer: WebGLBuffer, elements: FloatArray, offset?: number, count?: number): void;
        private _resetVertexBufferBinding();
        createVertexBuffer(vertices: FloatArray): WebGLBuffer;
        createDynamicVertexBuffer(vertices: FloatArray): WebGLBuffer;
        updateDynamicIndexBuffer(indexBuffer: WebGLBuffer, indices: IndicesArray, offset?: number): void;
        updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: FloatArray, offset?: number, count?: number): void;
        private _resetIndexBufferBinding();
        createIndexBuffer(indices: IndicesArray, updatable?: boolean): WebGLBuffer;
        bindArrayBuffer(buffer: Nullable<WebGLBuffer>): void;
        bindUniformBuffer(buffer: Nullable<WebGLBuffer>): void;
        bindUniformBufferBase(buffer: WebGLBuffer, location: number): void;
        bindUniformBlock(shaderProgram: WebGLProgram, blockName: string, index: number): void;
        private bindIndexBuffer(buffer);
        private bindBuffer(buffer, target);
        updateArrayBuffer(data: Float32Array): void;
        private vertexAttribPointer(buffer, indx, size, type, normalized, stride, offset);
        private _bindIndexBufferWithCache(indexBuffer);
        private _bindVertexBuffersAttributes(vertexBuffers, effect);
        recordVertexArrayObject(vertexBuffers: {
            [key: string]: VertexBuffer;
        }, indexBuffer: Nullable<WebGLBuffer>, effect: Effect): WebGLVertexArrayObject;
        bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObject, indexBuffer: Nullable<WebGLBuffer>): void;
        bindBuffersDirectly(vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void;
        private _unbindVertexArrayObject();
        bindBuffers(vertexBuffers: {
            [key: string]: Nullable<VertexBuffer>;
        }, indexBuffer: Nullable<WebGLBuffer>, effect: Effect): void;
        unbindInstanceAttributes(): void;
        releaseVertexArrayObject(vao: WebGLVertexArrayObject): void;
        _releaseBuffer(buffer: WebGLBuffer): boolean;
        createInstancesBuffer(capacity: number): WebGLBuffer;
        deleteInstancesBuffer(buffer: WebGLBuffer): void;
        updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void;
        applyStates(): void;
        draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void;
        drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void;
        drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void;
        drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void;
        drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void;
        private DrawMode(fillMode);
        _releaseEffect(effect: Effect): void;
        _deleteProgram(program: WebGLProgram): void;
        /**
         * @param baseName The base name of the effect (The name of file without .fragment.fx or .vertex.fx)
         * @param samplers An array of string used to represent textures
         */
        createEffect(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any): Effect;
        createEffectForParticles(fragmentName: string, uniformsNames?: string[], samplers?: string[], defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect;
        createRawShaderProgram(vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings?: Nullable<string[]>): WebGLProgram;
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings?: Nullable<string[]>): WebGLProgram;
        private _createShaderProgram(vertexShader, fragmentShader, context, transformFeedbackVaryings?);
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): Nullable<WebGLUniformLocation>[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[];
        enableEffect(effect: Nullable<Effect>): void;
        setIntArray(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void;
        setFloatArray(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setFloatArray2(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setFloatArray3(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setFloatArray4(uniform: Nullable<WebGLUniformLocation>, array: Float32Array): void;
        setArray(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setArray2(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setArray3(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setArray4(uniform: Nullable<WebGLUniformLocation>, array: number[]): void;
        setMatrices(uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): void;
        setMatrix(uniform: Nullable<WebGLUniformLocation>, matrix: Matrix): void;
        setMatrix3x3(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void;
        setMatrix2x2(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void;
        setInt(uniform: Nullable<WebGLUniformLocation>, value: number): void;
        setFloat(uniform: Nullable<WebGLUniformLocation>, value: number): void;
        setFloat2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): void;
        setFloat3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): void;
        setBool(uniform: Nullable<WebGLUniformLocation>, bool: number): void;
        setFloat4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: Nullable<WebGLUniformLocation>, color3: Color3): void;
        setColor4(uniform: Nullable<WebGLUniformLocation>, color3: Color3, alpha: number): void;
        setState(culling: boolean, zOffset?: number, force?: boolean, reverseSide?: boolean): void;
        setZOffset(value: number): void;
        getZOffset(): number;
        setDepthBuffer(enable: boolean): void;
        getDepthWrite(): boolean;
        setDepthWrite(enable: boolean): void;
        setColorWrite(enable: boolean): void;
        getColorWrite(): boolean;
        setAlphaConstants(r: number, g: number, b: number, a: number): void;
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;
        getAlphaMode(): number;
        setAlphaTesting(enable: boolean): void;
        getAlphaTesting(): boolean;
        wipeCaches(bruteForce?: boolean): void;
        /**
         * Set the compressed texture format to use, based on the formats you have, and the formats
         * supported by the hardware / browser.
         *
         * Khronos Texture Container (.ktx) files are used to support this.  This format has the
         * advantage of being specifically designed for OpenGL.  Header elements directly correspond
         * to API arguments needed to compressed textures.  This puts the burden on the container
         * generator to house the arcane code for determining these for current & future formats.
         *
         * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
         * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
         *
         * Note: The result of this call is not taken into account when a texture is base64.
         *
         * @param {Array<string>} formatsAvailable- The list of those format families you have created
         * on your server.  Syntax: '-' + format family + '.ktx'.  (Case and order do not matter.)
         *
         * Current families are astc, dxt, pvrtc, etc2, & etc1.
         * @returns The extension selected.
         */
        setTextureFormatToUse(formatsAvailable: Array<string>): Nullable<string>;
        _createTexture(): WebGLTexture;
        /**
         * Usually called from BABYLON.Texture.ts.  Passed information to create a WebGLTexture.
         * @param {string} urlArg- This contains one of the following:
         *                         1. A conventional http URL, e.g. 'http://...' or 'file://...'
         *                         2. A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
         *                         3. An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
         *
         * @param {boolean} noMipmap- When true, no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file.
         * @param {boolean} invertY- When true, image is flipped when loaded.  You probably want true. Ignored for compressed textures.  Must be flipped in the file.
         * @param {Scene} scene- Needed for loading to the correct scene.
         * @param {number} samplingMode- Mode with should be used sample / access the texture.  Default: TRILINEAR
         * @param {callback} onLoad- Optional callback to be called upon successful completion.
         * @param {callback} onError- Optional callback to be called upon failure.
         * @param {ArrayBuffer | HTMLImageElement} buffer- A source of a file previously fetched as either an ArrayBuffer (compressed or image format) or HTMLImageElement (image format)
         * @param {WebGLTexture} fallback- An internal argument in case the function must be called again, due to etc1 not having alpha capabilities.
         * @param {number} format-  Internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures.
         *
         * @returns {WebGLTexture} for assignment back into BABYLON.Texture
         */
        createTexture(urlArg: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<Scene>, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message: string, exception: any) => void>, buffer?: Nullable<ArrayBuffer | HTMLImageElement>, fallBack?: Nullable<InternalTexture>, format?: Nullable<number>): InternalTexture;
        private _rescaleTexture(source, destination, scene, internalFormat, onComplete);
        private _getInternalFormat(format);
        updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression?: Nullable<string>, type?: number): void;
        createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression?: Nullable<string>, type?: number): InternalTexture;
        createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture;
        updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void;
        updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha?: boolean, format?: number): void;
        updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void;
        createRenderTargetTexture(size: number | {
            width: number;
            height: number;
        }, options: boolean | RenderTargetCreationOptions): InternalTexture;
        createMultipleRenderTarget(size: any, options: any): InternalTexture[];
        private _setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height, samples?);
        updateRenderTargetTextureSampleCount(texture: Nullable<InternalTexture>, samples: number): number;
        updateMultipleRenderTargetTextureSampleCount(textures: Nullable<InternalTexture[]>, samples: number): number;
        _uploadDataToTexture(target: number, lod: number, internalFormat: number, width: number, height: number, format: number, type: number, data: ArrayBufferView): void;
        _uploadCompressedDataToTexture(target: number, lod: number, internalFormat: number, width: number, height: number, data: ArrayBufferView): void;
        createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): InternalTexture;
        createPrefilteredCubeTexture(rootUrl: string, scene: Nullable<Scene>, scale: number, offset: number, onLoad?: Nullable<(internalTexture: Nullable<InternalTexture>) => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number, forcedExtension?: any): InternalTexture;
        createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad?: Nullable<(data?: any) => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number, forcedExtension?: any): InternalTexture;
        private setCubeMapTextureParams(gl, loadMipmap);
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression?: Nullable<string>, level?: number): void;
        createRawCubeTexture(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression?: Nullable<string>): InternalTexture;
        createRawCubeTextureFromUrl(url: string, scene: Scene, size: number, format: number, type: number, noMipmap: boolean, callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>, mipmmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, samplingMode?: number, invertY?: boolean): InternalTexture;
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression?: Nullable<string>): void;
        createRawTexture3D(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression?: Nullable<string>): InternalTexture;
        private _prepareWebGLTextureContinuation(texture, scene, noMipmap, isCompressed, samplingMode);
        private _prepareWebGLTexture(texture, scene, width, height, invertY, noMipmap, isCompressed, processFunction, samplingMode?);
        private _convertRGBtoRGBATextureData(rgbData, width, height, textureType);
        _releaseFramebufferObjects(texture: InternalTexture): void;
        _releaseTexture(texture: InternalTexture): void;
        private setProgram(program);
        private _boundUniforms;
        bindSamplers(effect: Effect): void;
        private _activateTextureChannel(channel);
        private _moveBoundTextureOnTop(internalTexture);
        private _removeDesignatedSlot(internalTexture);
        _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>, doNotBindUniformToTextureChannel?: boolean): void;
        _bindTexture(channel: number, texture: Nullable<InternalTexture>): void;
        setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>): void;
        unbindAllTextures(): void;
        setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>): void;
        private _getCorrectTextureChannel(channel, internalTexture);
        private _bindSamplerUniformToChannel(sourceSlot, destination);
        private _setTexture(channel, texture, isPartOfTextureArray?);
        setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: BaseTexture[]): void;
        _setAnisotropicLevel(key: number, texture: BaseTexture): void;
        readPixels(x: number, y: number, width: number, height: number): Uint8Array;
        /**
         * Add an externaly attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        addExternalData<T>(key: string, data: T): boolean;
        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        getExternalData<T>(key: string): T;
        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T;
        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        removeExternalData(key: string): boolean;
        unbindAllAttributes(): void;
        releaseEffects(): void;
        dispose(): void;
        displayLoadingUI(): void;
        hideLoadingUI(): void;
        loadingScreen: ILoadingScreen;
        loadingUIText: string;
        loadingUIBackgroundColor: string;
        attachContextLostEvent(callback: ((event: WebGLContextEvent) => void)): void;
        attachContextRestoredEvent(callback: ((event: WebGLContextEvent) => void)): void;
        getVertexShaderSource(program: WebGLProgram): Nullable<string>;
        getFragmentShaderSource(program: WebGLProgram): Nullable<string>;
        getError(): number;
        getFps(): number;
        getDeltaTime(): number;
        private _measureFps();
        _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex?: number): ArrayBufferView;
        private _canRenderToFloatFramebuffer();
        private _canRenderToHalfFloatFramebuffer();
        private _canRenderToFramebuffer(type);
        _getWebGLTextureType(type: number): number;
        _getRGBABufferInternalSizedFormat(type: number): number;
        _getRGBAMultiSampleBufferFormat(type: number): number;
        createQuery(): WebGLQuery;
        deleteQuery(query: WebGLQuery): Engine;
        isQueryResultAvailable(query: WebGLQuery): boolean;
        getQueryResult(query: WebGLQuery): number;
        beginOcclusionQuery(algorithmType: number, query: WebGLQuery): Engine;
        endOcclusionQuery(algorithmType: number): Engine;
        private _createTimeQuery();
        private _deleteTimeQuery(query);
        private _getTimeQueryResult(query);
        private _getTimeQueryAvailability(query);
        private _currentNonTimestampToken;
        startTimeQuery(): Nullable<_TimeToken>;
        endTimeQuery(token: _TimeToken): int;
        private getGlAlgorithmType(algorithmType);
        createTransformFeedback(): WebGLTransformFeedback;
        deleteTransformFeedback(value: WebGLTransformFeedback): void;
        bindTransformFeedback(value: Nullable<WebGLTransformFeedback>): void;
        beginTransformFeedback(usePoints?: boolean): void;
        endTransformFeedback(): void;
        setTranformFeedbackVaryings(program: WebGLProgram, value: string[]): void;
        bindTransformFeedbackBuffer(value: Nullable<WebGLBuffer>): void;
        _loadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, database?: Database, useArrayBuffer?: boolean, onError?: (request?: XMLHttpRequest, exception?: any) => void): IFileRequest;
        private _partialLoadFile(url, index, loadedFiles, scene, onfinish, onErrorCallBack?);
        private _cascadeLoadFiles(rootUrl, scene, onfinish, files, onError?);
        static isSupported(): boolean;
    }
}

declare module 'babylonjs/core' {
    /**
     * Node is the basic class for all scene objects (Mesh, Light Camera).
     */
    class Node {
        name: string;
        id: string;
        uniqueId: number;
        state: string;
        metadata: any;
        doNotSerialize: boolean;
        animations: Animation[];
        private _ranges;
        onReady: (node: Node) => void;
        private _isEnabled;
        private _isReady;
        _currentRenderId: number;
        private _parentRenderId;
        _waitingParentId: Nullable<string>;
        private _scene;
        _cache: any;
        private _parentNode;
        private _children;
        parent: Nullable<Node>;
        getClassName(): string;
        /**
        * An event triggered when the mesh is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Node>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
         * @constructor
         * @param {string} name - the name and id to be given to this node
         * @param {BABYLON.Scene} the scene this node will be added to
         */
        constructor(name: string, scene?: Nullable<Scene>);
        getScene(): Scene;
        getEngine(): Engine;
        private _behaviors;
        addBehavior(behavior: Behavior<Node>): Node;
        removeBehavior(behavior: Behavior<Node>): Node;
        readonly behaviors: Behavior<Node>[];
        getBehaviorByName(name: string): Nullable<Behavior<Node>>;
        getWorldMatrix(): Matrix;
        _initCache(): void;
        updateCache(force?: boolean): void;
        _updateCache(ignoreParentClass?: boolean): void;
        _isSynchronized(): boolean;
        _markSyncedWithParent(): void;
        isSynchronizedWithParent(): boolean;
        isSynchronized(updateCache?: boolean): boolean;
        hasNewParent(update?: boolean): boolean;
        /**
         * Is this node ready to be used/rendered
         * @return {boolean} is it ready
         */
        isReady(): boolean;
        /**
         * Is this node enabled.
         * If the node has a parent, all ancestors will be checked and false will be returned if any are false (not enabled), otherwise will return true.
         * @param {boolean} [checkAncestors=true] - Indicates if this method should check the ancestors. The default is to check the ancestors. If set to false, the method will return the value of this node without checking ancestors.
         * @return {boolean} whether this node (and its parent) is enabled.
         * @see setEnabled
         */
        isEnabled(checkAncestors?: boolean): boolean;
        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        setEnabled(value: boolean): void;
        /**
         * Is this node a descendant of the given node.
         * The function will iterate up the hierarchy until the ancestor was found or no more parents defined.
         * @param {BABYLON.Node} ancestor - The parent node to inspect
         * @see parent
         */
        isDescendantOf(ancestor: Node): boolean;
        /**
         * Evaluate the list of children and determine if they should be considered as descendants considering the given criterias
         * @param {BABYLON.Node[]} results the result array containing the nodes matching the given criterias
         * @param {boolean} directDescendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         */
        _getDescendants(results: Node[], directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): void;
        /**
         * Will return all nodes that have this node as ascendant.
         * @param {boolean} directDescendantsOnly if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered.
         * @param predicate: an optional predicate that will be called on every evaluated children, the predicate must return true for a given child to be part of the result, otherwise it will be ignored.
         * @return {BABYLON.Node[]} all children nodes of all types.
         */
        getDescendants(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): Node[];
        /**
         * Get all child-meshes of this node.
         */
        getChildMeshes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): AbstractMesh[];
        /**
         * Get all child-transformNodes of this node.
         */
        getChildTransformNodes(directDescendantsOnly?: boolean, predicate?: (node: Node) => boolean): TransformNode[];
        /**
         * Get all direct children of this node.
        */
        getChildren(predicate?: (node: Node) => boolean): Node[];
        _setReady(state: boolean): void;
        getAnimationByName(name: string): Nullable<Animation>;
        createAnimationRange(name: string, from: number, to: number): void;
        deleteAnimationRange(name: string, deleteFrames?: boolean): void;
        getAnimationRange(name: string): Nullable<AnimationRange>;
        beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): void;
        serializeAnimationRanges(): any;
        computeWorldMatrix(force?: boolean): Matrix;
        dispose(): void;
        static ParseAnimationRanges(node: Node, parsedNode: any, scene: Scene): void;
    }
}

declare module 'babylonjs/core' {
    class BoundingSphere {
        minimum: Vector3;
        maximum: Vector3;
        center: Vector3;
        radius: number;
        centerWorld: Vector3;
        radiusWorld: number;
        private _tempRadiusVector;
        constructor(minimum: Vector3, maximum: Vector3);
        _update(world: Matrix): void;
        isInFrustum(frustumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;
        static Intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean;
    }
}

declare module 'babylonjs/core' {
    class BoundingBox implements ICullable {
        minimum: Vector3;
        maximum: Vector3;
        vectors: Vector3[];
        center: Vector3;
        centerWorld: Vector3;
        extendSize: Vector3;
        extendSizeWorld: Vector3;
        directions: Vector3[];
        vectorsWorld: Vector3[];
        minimumWorld: Vector3;
        maximumWorld: Vector3;
        private _worldMatrix;
        constructor(minimum: Vector3, maximum: Vector3);
        getWorldMatrix(): Matrix;
        setWorldMatrix(matrix: Matrix): BoundingBox;
        _update(world: Matrix): void;
        isInFrustum(frustumPlanes: Plane[]): boolean;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersectsSphere(sphere: BoundingSphere): boolean;
        intersectsMinMax(min: Vector3, max: Vector3): boolean;
        static Intersects(box0: BoundingBox, box1: BoundingBox): boolean;
        static IntersectsSphere(minPoint: Vector3, maxPoint: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean;
        static IsCompletelyInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
        static IsInFrustum(boundingVectors: Vector3[], frustumPlanes: Plane[]): boolean;
    }
}

declare module 'babylonjs/core' {
    interface ICullable {
        isInFrustum(frustumPlanes: Plane[]): boolean;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
    }
    class BoundingInfo implements ICullable {
        minimum: Vector3;
        maximum: Vector3;
        boundingBox: BoundingBox;
        boundingSphere: BoundingSphere;
        private _isLocked;
        constructor(minimum: Vector3, maximum: Vector3);
        isLocked: boolean;
        update(world: Matrix): void;
        /**
         * Recreate the bounding info to be centered around a specific point given a specific extend.
         * @param center New center of the bounding info
         * @param extend New extend of the bounding info
         */
        centerOn(center: Vector3, extend: Vector3): BoundingInfo;
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Gets the world distance between the min and max points of the bounding box
         */
        readonly diagonalLength: number;
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        _checkCollision(collider: Collider): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersects(boundingInfo: BoundingInfo, precise: boolean): boolean;
    }
}

declare module 'babylonjs/core' {
    class TransformNode extends Node {
        static BILLBOARDMODE_NONE: number;
        static BILLBOARDMODE_X: number;
        static BILLBOARDMODE_Y: number;
        static BILLBOARDMODE_Z: number;
        static BILLBOARDMODE_ALL: number;
        private _rotation;
        private _rotationQuaternion;
        protected _scaling: Vector3;
        protected _isDirty: boolean;
        private _transformToBoneReferal;
        billboardMode: number;
        scalingDeterminant: number;
        infiniteDistance: boolean;
        position: Vector3;
        _poseMatrix: Matrix;
        private _localWorld;
        _worldMatrix: Matrix;
        _worldMatrixDeterminant: number;
        private _absolutePosition;
        private _pivotMatrix;
        private _pivotMatrixInverse;
        private _postMultiplyPivotMatrix;
        protected _isWorldMatrixFrozen: boolean;
        /**
        * An event triggered after the world matrix is updated
        * @type {BABYLON.Observable}
        */
        onAfterWorldMatrixUpdateObservable: Observable<TransformNode>;
        constructor(name: string, scene?: Nullable<Scene>, isPure?: boolean);
        /**
          * Rotation property : a Vector3 depicting the rotation value in radians around each local axis X, Y, Z.
          * If rotation quaternion is set, this Vector3 will (almost always) be the Zero vector!
          * Default : (0.0, 0.0, 0.0)
          */
        rotation: Vector3;
        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
         * Default : (1.0, 1.0, 1.0)
         */
        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
         * Default : (1.0, 1.0, 1.0)
        */
        scaling: Vector3;
        /**
         * Rotation Quaternion property : this a Quaternion object depicting the mesh rotation by using a unit quaternion.
         * It's null by default.
         * If set, only the rotationQuaternion is then used to compute the mesh rotation and its property `.rotation\ is then ignored and set to (0.0, 0.0, 0.0)
         */
        rotationQuaternion: Nullable<Quaternion>;
        /**
         * Returns the latest update of the World matrix
         * Returns a Matrix.
         */
        getWorldMatrix(): Matrix;
        /**
         * Returns the latest update of the World matrix determinant.
         */
        protected _getWorldMatrixDeterminant(): number;
        /**
         * Returns directly the latest state of the mesh World matrix.
         * A Matrix is returned.
         */
        readonly worldMatrixFromCache: Matrix;
        /**
         * Copies the paramater passed Matrix into the mesh Pose matrix.
         * Returns the AbstractMesh.
         */
        updatePoseMatrix(matrix: Matrix): TransformNode;
        /**
         * Returns the mesh Pose matrix.
         * Returned object : Matrix
         */
        getPoseMatrix(): Matrix;
        _isSynchronized(): boolean;
        _initCache(): void;
        markAsDirty(property: string): TransformNode;
        /**
         * Returns the current mesh absolute position.
         * Retuns a Vector3.
         */
        readonly absolutePosition: Vector3;
        /**
         * Sets a new pivot matrix to the mesh.
         * Returns the AbstractMesh.
        */
        setPivotMatrix(matrix: Matrix, postMultiplyPivotMatrix?: boolean): TransformNode;
        /**
         * Returns the mesh pivot matrix.
         * Default : Identity.
         * A Matrix is returned.
         */
        getPivotMatrix(): Matrix;
        /**
         * Prevents the World matrix to be computed any longer.
         * Returns the AbstractMesh.
         */
        freezeWorldMatrix(): TransformNode;
        /**
         * Allows back the World matrix computation.
         * Returns the AbstractMesh.
         */
        unfreezeWorldMatrix(): this;
        /**
         * True if the World matrix has been frozen.
         * Returns a boolean.
         */
        readonly isWorldMatrixFrozen: boolean;
        /**
            * Retuns the mesh absolute position in the World.
            * Returns a Vector3.
            */
        getAbsolutePosition(): Vector3;
        /**
         * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
         * Returns the AbstractMesh.
         */
        setAbsolutePosition(absolutePosition: Vector3): TransformNode;
        /**
           * Sets the mesh position in its local space.
           * Returns the AbstractMesh.
           */
        setPositionWithLocalVector(vector3: Vector3): TransformNode;
        /**
         * Returns the mesh position in the local space from the current World matrix values.
         * Returns a new Vector3.
         */
        getPositionExpressedInLocalSpace(): Vector3;
        /**
         * Translates the mesh along the passed Vector3 in its local space.
         * Returns the AbstractMesh.
         */
        locallyTranslate(vector3: Vector3): TransformNode;
        private static _lookAtVectorCache;
        /**
         * Orients a mesh towards a target point. Mesh must be drawn facing user.
         * @param targetPoint the position (must be in same space as current mesh) to look at
         * @param yawCor optional yaw (y-axis) correction in radians
         * @param pitchCor optional pitch (x-axis) correction in radians
         * @param rollCor optional roll (z-axis) correction in radians
         * @param space the choosen space of the target
         * @returns the TransformNode.
         */
        lookAt(targetPoint: Vector3, yawCor?: number, pitchCor?: number, rollCor?: number, space?: Space): TransformNode;
        /**
          * Returns a new Vector3 what is the localAxis, expressed in the mesh local space, rotated like the mesh.
          * This Vector3 is expressed in the World space.
          */
        getDirection(localAxis: Vector3): Vector3;
        /**
         * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
         * localAxis is expressed in the mesh local space.
         * result is computed in the Wordl space from the mesh World matrix.
         * Returns the AbstractMesh.
         */
        getDirectionToRef(localAxis: Vector3, result: Vector3): TransformNode;
        setPivotPoint(point: Vector3, space?: Space): TransformNode;
        /**
         * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.
         */
        getPivotPoint(): Vector3;
        /**
         * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.
         * Returns the AbstractMesh.
         */
        getPivotPointToRef(result: Vector3): TransformNode;
        /**
         * Returns a new Vector3 set with the mesh pivot point World coordinates.
         */
        getAbsolutePivotPoint(): Vector3;
        /**
         * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.
         * Returns the AbstractMesh.
         */
        getAbsolutePivotPointToRef(result: Vector3): TransformNode;
        /**
         * Defines the passed node as the parent of the current node.
         * The node will remain exactly where it is and its position / rotation will be updated accordingly
         * Returns the TransformNode.
         */
        setParent(node: Nullable<Node>): TransformNode;
        private _nonUniformScaling;
        readonly nonUniformScaling: boolean;
        _updateNonUniformScalingState(value: boolean): boolean;
        /**
         * Attach the current TransformNode to another TransformNode associated with a bone
         * @param bone Bone affecting the TransformNode
         * @param affectedTransformNode TransformNode associated with the bone
         */
        attachToBone(bone: Bone, affectedTransformNode: TransformNode): TransformNode;
        detachFromBone(): TransformNode;
        private static _rotationAxisCache;
        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
         * The passed axis is also normalized.
         * Returns the AbstractMesh.
         */
        rotate(axis: Vector3, amount: number, space?: Space): TransformNode;
        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
         * The passed axis is also normalized.
         * Returns the AbstractMesh.
         * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
         */
        rotateAround(point: Vector3, axis: Vector3, amount: number): TransformNode;
        /**
         * Translates the mesh along the axis vector for the passed distance in the given space.
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Returns the AbstractMesh.
         */
        translate(axis: Vector3, distance: number, space?: Space): TransformNode;
        /**
         * Adds a rotation step to the mesh current rotation.
         * x, y, z are Euler angles expressed in radians.
         * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.
         * This means this rotation is made in the mesh local space only.
         * It's useful to set a custom rotation order different from the BJS standard one YXZ.
         * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.
         * ```javascript
         * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
         * ```
         * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.
         * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.
         * Returns the AbstractMesh.
         */
        addRotation(x: number, y: number, z: number): TransformNode;
        /**
         * Computes the mesh World matrix and returns it.
         * If the mesh world matrix is frozen, this computation does nothing more than returning the last frozen values.
         * If the parameter `force` is let to `false` (default), the current cached World matrix is returned.
         * If the parameter `force`is set to `true`, the actual computation is done.
         * Returns the mesh World Matrix.
         */
        computeWorldMatrix(force?: boolean): Matrix;
        protected _afterComputeWorldMatrix(): void;
        /**
        * If you'd like to be called back after the mesh position, rotation or scaling has been updated.
        * @param func: callback function to add
        *
        * Returns the TransformNode.
        */
        registerAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode;
        /**
         * Removes a registered callback function.
         * Returns the TransformNode.
         */
        unregisterAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode;
        /**
         * Clone the current transform node
         * Returns the new transform node
         * @param name Name of the new clone
         * @param newParent New parent for the clone
         * @param doNotCloneChildren Do not clone children hierarchy
         */
        clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Nullable<TransformNode>;
        serialize(currentSerializationObject?: any): any;
        /**
         * Returns a new TransformNode object parsed from the source provided.
         * The parameter `parsedMesh` is the source.
         * The parameter `rootUrl` is a string, it's the root URL to prefix the `delayLoadingFile` property with
         */
        static Parse(parsedTransformNode: any, scene: Scene, rootUrl: string): TransformNode;
        /**
         * Disposes the TransformNode.
         * By default, all the children are also disposed unless the parameter `doNotRecurse` is set to `true`.
         * Returns nothing.
         */
        dispose(doNotRecurse?: boolean): void;
    }
}

declare module 'babylonjs/core' {
    class AbstractMesh extends TransformNode implements IDisposable, ICullable, IGetSetVerticesData {
        static OCCLUSION_TYPE_NONE: number;
        static OCCLUSION_TYPE_OPTIMISTIC: number;
        static OCCLUSION_TYPE_STRICT: number;
        static OCCLUSION_ALGORITHM_TYPE_ACCURATE: number;
        static OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE: number;
        static readonly BILLBOARDMODE_NONE: number;
        static readonly BILLBOARDMODE_X: number;
        static readonly BILLBOARDMODE_Y: number;
        static readonly BILLBOARDMODE_Z: number;
        static readonly BILLBOARDMODE_ALL: number;
        private _facetPositions;
        private _facetNormals;
        private _facetPartitioning;
        private _facetNb;
        private _partitioningSubdivisions;
        private _partitioningBBoxRatio;
        private _facetDataEnabled;
        private _facetParameters;
        private _bbSize;
        private _subDiv;
        private _facetDepthSort;
        private _facetDepthSortEnabled;
        private _depthSortedIndices;
        private _depthSortedFacets;
        private _facetDepthSortFunction;
        private _facetDepthSortFrom;
        private _facetDepthSortOrigin;
        private _invertedMatrix;
        /**
         * Read-only : the number of facets in the mesh
         */
        readonly facetNb: number;
        /**
         * The number (integer) of subdivisions per axis in the partioning space
         */
        partitioningSubdivisions: number;
        /**
         * The ratio (float) to apply to the bouding box size to set to the partioning space.
         * Ex : 1.01 (default) the partioning space is 1% bigger than the bounding box.
         */
        partitioningBBoxRatio: number;
        /**
         * Boolean : must the facet be depth sorted on next call to `updateFacetData()` ?
         * Works only for updatable meshes.
         * Doesn't work with multi-materials.
         */
        mustDepthSortFacets: boolean;
        /**
         * The location (Vector3) where the facet depth sort must be computed from.
         * By default, the active camera position.
         * Used only when facet depth sort is enabled.
         */
        facetDepthSortFrom: Vector3;
        /**
         * Read-only boolean : is the feature facetData enabled ?
         */
        readonly isFacetDataEnabled: boolean;
        _updateNonUniformScalingState(value: boolean): boolean;
        /**
        * An event triggered when this mesh collides with another one
        * @type {BABYLON.Observable}
        */
        onCollideObservable: Observable<AbstractMesh>;
        private _onCollideObserver;
        onCollide: () => void;
        /**
        * An event triggered when the collision's position changes
        * @type {BABYLON.Observable}
        */
        onCollisionPositionChangeObservable: Observable<Vector3>;
        private _onCollisionPositionChangeObserver;
        onCollisionPositionChange: () => void;
        /**
        * An event triggered when material is changed
        * @type {BABYLON.Observable}
        */
        onMaterialChangedObservable: Observable<AbstractMesh>;
        definedFacingForward: boolean;
        /**
        * This property determines the type of occlusion query algorithm to run in WebGl, you can use:

        * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE which is mapped to GL_ANY_SAMPLES_PASSED.

        * or

        * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE (Default Value) which is mapped to GL_ANY_SAMPLES_PASSED_CONSERVATIVE which is a false positive algorithm that is faster than GL_ANY_SAMPLES_PASSED but less accurate.

        * for more info check WebGl documentations
        */
        occlusionQueryAlgorithmType: number;
        /**
         * This property is responsible for starting the occlusion query within the Mesh or not, this property is also used     to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:

        * OCCLUSION_TYPE_NONE (Default Value): this option means no occlusion query whith the Mesh.

        * OCCLUSION_TYPE_OPTIMISTIC: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.

            * OCCLUSION_TYPE_STRICT: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         */
        occlusionType: number;
        /**
        * This number indicates the number of allowed retries before stop the occlusion query, this is useful if the        occlusion query is taking long time before to the query result is retireved, the query result indicates if the object is visible within the scene or not and based on that Babylon.Js engine decideds to show or hide the object.

        * The default value is -1 which means don't break the query and wait till the result.
        */
        occlusionRetryCount: number;
        private _occlusionInternalRetryCounter;
        protected _isOccluded: boolean;
        /**
        * Property isOccluded : Gets or sets whether the mesh is occluded or not, it is used also to set the intial state of the mesh to be occluded or not.
        */
        isOccluded: boolean;
        private _isOcclusionQueryInProgress;
        /**
        * Flag to check the progress status of the query
        */
        readonly isOcclusionQueryInProgress: boolean;
        private _occlusionQuery;
        visibility: number;
        alphaIndex: number;
        isVisible: boolean;
        isPickable: boolean;
        showBoundingBox: boolean;
        showSubMeshesBoundingBox: boolean;
        isBlocker: boolean;
        enablePointerMoveEvents: boolean;
        renderingGroupId: number;
        private _material;
        material: Nullable<Material>;
        private _receiveShadows;
        receiveShadows: boolean;
        renderOutline: boolean;
        outlineColor: Color3;
        outlineWidth: number;
        renderOverlay: boolean;
        overlayColor: Color3;
        overlayAlpha: number;
        private _hasVertexAlpha;
        hasVertexAlpha: boolean;
        private _useVertexColors;
        useVertexColors: boolean;
        private _computeBonesUsingShaders;
        computeBonesUsingShaders: boolean;
        private _numBoneInfluencers;
        numBoneInfluencers: number;
        private _applyFog;
        applyFog: boolean;
        useOctreeForRenderingSelection: boolean;
        useOctreeForPicking: boolean;
        useOctreeForCollisions: boolean;
        private _layerMask;
        layerMask: number;
        /**
         * True if the mesh must be rendered in any case.
         */
        alwaysSelectAsActiveMesh: boolean;
        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
        */
        actionManager: Nullable<ActionManager>;
        physicsImpostor: Nullable<PhysicsImpostor>;
        private _checkCollisions;
        private _collisionMask;
        private _collisionGroup;
        ellipsoid: Vector3;
        ellipsoidOffset: Vector3;
        private _collider;
        private _oldPositionForCollisions;
        private _diffPositionForCollisions;
        collisionMask: number;
        collisionGroup: number;
        edgesWidth: number;
        edgesColor: Color4;
        _edgesRenderer: Nullable<EdgesRenderer>;
        private _collisionsTransformMatrix;
        private _collisionsScalingMatrix;
        _masterMesh: Nullable<AbstractMesh>;
        _boundingInfo: Nullable<BoundingInfo>;
        _isDisposed: boolean;
        _renderId: number;
        subMeshes: SubMesh[];
        _submeshesOctree: Octree<SubMesh>;
        _intersectionsInProgress: AbstractMesh[];
        _unIndexed: boolean;
        _lightSources: Light[];
        readonly _positions: Nullable<Vector3[]>;
        _waitingActions: any;
        _waitingFreezeWorldMatrix: Nullable<boolean>;
        private _skeleton;
        _bonesTransformMatrices: Nullable<Float32Array>;
        skeleton: Nullable<Skeleton>;
        constructor(name: string, scene?: Nullable<Scene>);
        /**
         * Boolean : true if the mesh has been disposed.
         */
        isDisposed(): boolean;
        /**
         * Returns the string "AbstractMesh"
         */
        getClassName(): string;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        _rebuild(): void;
        _resyncLightSources(): void;
        _resyncLighSource(light: Light): void;
        _removeLightSource(light: Light): void;
        private _markSubMeshesAsDirty(func);
        _markSubMeshesAsLightDirty(): void;
        _markSubMeshesAsAttributesDirty(): void;
        _markSubMeshesAsMiscDirty(): void;
        /**
        * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
        * Default : (1.0, 1.0, 1.0)
        */
        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.
         * Default : (1.0, 1.0, 1.0)
         */
        scaling: Vector3;
        /**
         * Disables the mesh edger rendering mode.
         * Returns the AbstractMesh.
         */
        disableEdgesRendering(): AbstractMesh;
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible.
         * Returns the AbstractMesh.
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): AbstractMesh;
        /**
         * Returns true if the mesh is blocked. Used by the class Mesh.
         * Returns the boolean `false` by default.
         */
        readonly isBlocked: boolean;
        /**
         * Returns the mesh itself by default, used by the class Mesh.
         * Returned type : AbstractMesh
         */
        getLOD(camera: Camera): AbstractMesh;
        /**
         * Returns 0 by default, used by the class Mesh.
         * Returns an integer.
         */
        getTotalVertices(): number;
        /**
         * Returns null by default, used by the class Mesh.
         * Returned type : integer array
         */
        getIndices(): Nullable<IndicesArray>;
        /**
         * Returns the array of the requested vertex data kind. Used by the class Mesh. Returns null here.
         * Returned type : float array or Float32Array
         */
        getVerticesData(kind: string): Nullable<FloatArray>;
        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
         * The `data` are either a numeric array either a Float32Array.
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater.
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
         * Note that a new underlying VertexBuffer object is created each call.
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): AbstractMesh;
        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.
         * The `data` are either a numeric array either a Float32Array.
         * No new underlying VertexBuffer object is created.
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): AbstractMesh;
        /**
         * Sets the mesh indices.
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
         * This method creates a new index buffer each call.
         * Returns the Mesh.
         */
        setIndices(indices: IndicesArray, totalVertices: Nullable<number>): AbstractMesh;
        /** Returns false by default, used by the class Mesh.
         *  Returns a boolean
        */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Returns the mesh BoundingInfo object or creates a new one and returns it if undefined.
         * Returns a BoundingInfo
         */
        getBoundingInfo(): BoundingInfo;
        /**
         * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units).
         * @param includeDescendants Take the hierarchy's bounding box instead of the mesh's bounding box.
         */
        normalizeToUnitCube(includeDescendants?: boolean): AbstractMesh;
        /**
         * Sets a mesh new object BoundingInfo.
         * Returns the AbstractMesh.
         */
        setBoundingInfo(boundingInfo: BoundingInfo): AbstractMesh;
        readonly useBones: boolean;
        _preActivate(): void;
        _preActivateForIntermediateRendering(renderId: number): void;
        _activate(renderId: number): void;
        /**
         * Returns the latest update of the World matrix
         * Returns a Matrix.
         */
        getWorldMatrix(): Matrix;
        /**
         * Returns the latest update of the World matrix determinant.
         */
        protected _getWorldMatrixDeterminant(): number;
        /**
         * Perform relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         *
         * Returns the AbstractMesh.
         */
        movePOV(amountRight: number, amountUp: number, amountForward: number): AbstractMesh;
        /**
         * Calculate relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         *
         * Returns a new Vector3.
         */
        calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3;
        /**
         * Perform relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         *
         * Returns the AbstractMesh.
         */
        rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): AbstractMesh;
        /**
         * Calculate relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         *
         * Returns a new Vector3.
         */
        calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3;
        /**
         * Return the minimum and maximum world vectors of the entire hierarchy under current mesh
         * @param includeDescendants Include bounding info from descendants as well (true by default).
         */
        getHierarchyBoundingVectors(includeDescendants?: boolean): {
            min: Vector3;
            max: Vector3;
        };
        /**
         * Updates the mesh BoundingInfo object and all its children BoundingInfo objects also.
         * Returns the AbstractMesh.
         */
        _updateBoundingInfo(): AbstractMesh;
        /**
         * Update a mesh's children BoundingInfo objects only.
         * Returns the AbstractMesh.
         */
        _updateSubMeshesBoundingInfo(matrix: Matrix): AbstractMesh;
        protected _afterComputeWorldMatrix(): void;
        /**
         * Returns `true` if the mesh is within the frustum defined by the passed array of planes.
         * A mesh is in the frustum if its bounding box intersects the frustum.
         * Boolean returned.
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Returns `true` if the mesh is completely in the frustum defined be the passed array of planes.
         * A mesh is completely in the frustum if its bounding box it completely inside the frustum.
         * Boolean returned.
         */
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * True if the mesh intersects another mesh or a SolidParticle object.
         * Unless the parameter `precise` is set to `true` the intersection is computed according to Axis Aligned Bounding Boxes (AABB), else according to OBB (Oriented BBoxes)
         * includeDescendants can be set to true to test if the mesh defined in parameters intersects with the current mesh or any child meshes
         * Returns a boolean.
         */
        intersectsMesh(mesh: AbstractMesh | SolidParticle, precise?: boolean, includeDescendants?: boolean): boolean;
        /**
         * Returns true if the passed point (Vector3) is inside the mesh bounding box.
         * Returns a boolean.
         */
        intersectsPoint(point: Vector3): boolean;
        getPhysicsImpostor(): Nullable<PhysicsImpostor>;
        getPositionInCameraSpace(camera?: Nullable<Camera>): Vector3;
        /**
         * Returns the distance from the mesh to the active camera.
         * Returns a float.
         */
        getDistanceToCamera(camera?: Nullable<Camera>): number;
        applyImpulse(force: Vector3, contactPoint: Vector3): AbstractMesh;
        setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3, options?: any): AbstractMesh;
        /**
         * Property checkCollisions : Boolean, whether the camera should check the collisions against the mesh.
         * Default `false`.
         */
        checkCollisions: boolean;
        /**
         * Gets Collider object used to compute collisions (not physics)
         */
        readonly collider: Collider;
        moveWithCollisions(displacement: Vector3): AbstractMesh;
        private _onCollisionPositionChange;
        /**
        * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.
        * Please note that you must have a decent number of submeshes to get performance improvements when using an octree.
        * Returns an Octree of submeshes.
        */
        createOrUpdateSubmeshesOctree(maxCapacity?: number, maxDepth?: number): Octree<SubMesh>;
        _collideForSubMesh(subMesh: SubMesh, transformMatrix: Matrix, collider: Collider): AbstractMesh;
        _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): AbstractMesh;
        _checkCollision(collider: Collider): AbstractMesh;
        _generatePointsArray(): boolean;
        /**
         * Checks if the passed Ray intersects with the mesh.
         * Returns an object PickingInfo.
         */
        intersects(ray: Ray, fastCheck?: boolean): PickingInfo;
        /**
         * Clones the mesh, used by the class Mesh.
         * Just returns `null` for an AbstractMesh.
         */
        clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Nullable<AbstractMesh>;
        /**
         * Disposes all the mesh submeshes.
         * Returns the AbstractMesh.
         */
        releaseSubMeshes(): AbstractMesh;
        /**
         * Disposes the AbstractMesh.
         * By default, all the mesh children are also disposed unless the parameter `doNotRecurse` is set to `true`.
         * Returns nothing.
         */
        dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void;
        /**
         * Adds the passed mesh as a child to the current mesh.
         * Returns the AbstractMesh.
         */
        addChild(mesh: AbstractMesh): AbstractMesh;
        /**
         * Removes the passed mesh from the current mesh children list.
         * Returns the AbstractMesh.
         */
        removeChild(mesh: AbstractMesh): AbstractMesh;
        /**
         *  Initialize the facet data arrays : facetNormals, facetPositions and facetPartitioning.
         * Returns the AbstractMesh.
         */
        private _initFacetData();
        /**
         * Updates the mesh facetData arrays and the internal partitioning when the mesh is morphed or updated.
         * This method can be called within the render loop.
         * You don't need to call this method by yourself in the render loop when you update/morph a mesh with the methods CreateXXX() as they automatically manage this computation.
         * Returns the AbstractMesh.
         */
        updateFacetData(): AbstractMesh;
        /**
         * Returns the facetLocalNormals array.
         * The normals are expressed in the mesh local space.
         */
        getFacetLocalNormals(): Vector3[];
        /**
         * Returns the facetLocalPositions array.
         * The facet positions are expressed in the mesh local space.
         */
        getFacetLocalPositions(): Vector3[];
        /**
         * Returns the facetLocalPartioning array.
         */
        getFacetLocalPartitioning(): number[][];
        /**
         * Returns the i-th facet position in the world system.
         * This method allocates a new Vector3 per call.
         */
        getFacetPosition(i: number): Vector3;
        /**
         * Sets the reference Vector3 with the i-th facet position in the world system.
         * Returns the AbstractMesh.
         */
        getFacetPositionToRef(i: number, ref: Vector3): AbstractMesh;
        /**
         * Returns the i-th facet normal in the world system.
         * This method allocates a new Vector3 per call.
         */
        getFacetNormal(i: number): Vector3;
        /**
         * Sets the reference Vector3 with the i-th facet normal in the world system.
         * Returns the AbstractMesh.
         */
        getFacetNormalToRef(i: number, ref: Vector3): this;
        /**
         * Returns the facets (in an array) in the same partitioning block than the one the passed coordinates are located (expressed in the mesh local system).
         */
        getFacetsAtLocalCoordinates(x: number, y: number, z: number): Nullable<number[]>;
        /**
         * Returns the closest mesh facet index at (x,y,z) World coordinates, null if not found.
         * If the parameter projected (vector3) is passed, it is set as the (x,y,z) World projection on the facet.
         * If checkFace is true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned.
         * If facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position.
         * If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position.
         */
        getClosestFacetAtCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace?: boolean, facing?: boolean): Nullable<number>;
        /**
         * Returns the closest mesh facet index at (x,y,z) local coordinates, null if not found.
         * If the parameter projected (vector3) is passed, it is set as the (x,y,z) local projection on the facet.
         * If checkFace is true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned.
         * If facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position.
         * If facing si false and checkFace is true, only the facet "turning their backs"  to (x, y, z) are returned : negative dot (x, y, z) * facet position.
         */
        getClosestFacetAtLocalCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace?: boolean, facing?: boolean): Nullable<number>;
        /**
         * Returns the object "parameter" set with all the expected parameters for facetData computation by ComputeNormals()
         */
        getFacetDataParameters(): any;
        /**
         * Disables the feature FacetData and frees the related memory.
         * Returns the AbstractMesh.
         */
        disableFacetData(): AbstractMesh;
        /**
         * Updates the AbstractMesh indices array. Actually, used by the Mesh object.
         * Returns the mesh.
         */
        updateIndices(indices: IndicesArray): AbstractMesh;
        /**
         * The mesh Geometry. Actually used by the Mesh object.
         * Returns a blank geometry object.
         */
        /**
         * Creates new normals data for the mesh.
         * @param updatable.
         */
        createNormals(updatable: boolean): void;
        /**
         * Align the mesh with a normal.
         * Returns the mesh.
         */
        alignWithNormal(normal: Vector3, upDirection?: Vector3): AbstractMesh;
        protected checkOcclusionQuery(): void;
    }
}

declare module 'babylonjs/core' {
    class Light extends Node {
        private static _LIGHTMAP_DEFAULT;
        private static _LIGHTMAP_SPECULAR;
        private static _LIGHTMAP_SHADOWSONLY;
        /**
         * If every light affecting the material is in this lightmapMode,
         * material.lightmapTexture adds or multiplies
         * (depends on material.useLightmapAsShadowmap)
         * after every other light calculations.
         */
        static readonly LIGHTMAP_DEFAULT: number;
        /**
         * material.lightmapTexture as only diffuse lighting from this light
         * adds pnly specular lighting from this light
         * adds dynamic shadows
         */
        static readonly LIGHTMAP_SPECULAR: number;
        /**
         * material.lightmapTexture as only lighting
         * no light calculation from this light
         * only adds dynamic shadows from this light
         */
        static readonly LIGHTMAP_SHADOWSONLY: number;
        private static _INTENSITYMODE_AUTOMATIC;
        private static _INTENSITYMODE_LUMINOUSPOWER;
        private static _INTENSITYMODE_LUMINOUSINTENSITY;
        private static _INTENSITYMODE_ILLUMINANCE;
        private static _INTENSITYMODE_LUMINANCE;
        /**
         * Each light type uses the default quantity according to its type:
         *      point/spot lights use luminous intensity
         *      directional lights use illuminance
         */
        static readonly INTENSITYMODE_AUTOMATIC: number;
        /**
         * lumen (lm)
         */
        static readonly INTENSITYMODE_LUMINOUSPOWER: number;
        /**
         * candela (lm/sr)
         */
        static readonly INTENSITYMODE_LUMINOUSINTENSITY: number;
        /**
         * lux (lm/m^2)
         */
        static readonly INTENSITYMODE_ILLUMINANCE: number;
        /**
         * nit (cd/m^2)
         */
        static readonly INTENSITYMODE_LUMINANCE: number;
        private static _LIGHTTYPEID_POINTLIGHT;
        private static _LIGHTTYPEID_DIRECTIONALLIGHT;
        private static _LIGHTTYPEID_SPOTLIGHT;
        private static _LIGHTTYPEID_HEMISPHERICLIGHT;
        /**
         * Light type const id of the point light.
         */
        static readonly LIGHTTYPEID_POINTLIGHT: number;
        /**
         * Light type const id of the directional light.
         */
        static readonly LIGHTTYPEID_DIRECTIONALLIGHT: number;
        /**
         * Light type const id of the spot light.
         */
        static readonly LIGHTTYPEID_SPOTLIGHT: number;
        /**
         * Light type const id of the hemispheric light.
         */
        static readonly LIGHTTYPEID_HEMISPHERICLIGHT: number;
        diffuse: Color3;
        specular: Color3;
        intensity: number;
        range: number;
        /**
         * Cached photometric scale default to 1.0 as the automatic intensity mode defaults to 1.0 for every type
         * of light.
         */
        private _photometricScale;
        private _intensityMode;
        /**
         * Gets the photometric scale used to interpret the intensity.
         * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
         */
        /**
         * Sets the photometric scale used to interpret the intensity.
         * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
         */
        intensityMode: number;
        private _radius;
        /**
         * Gets the light radius used by PBR Materials to simulate soft area lights.
         */
        /**
         * sets the light radius used by PBR Materials to simulate soft area lights.
         */
        radius: number;
        /**
         * Defines the rendering priority of the lights. It can help in case of fallback or number of lights
         * exceeding the number allowed of the materials.
         */
        private _renderPriority;
        renderPriority: number;
        /**
         * Defines wether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
         * the current shadow generator.
         */
        shadowEnabled: boolean;
        private _includedOnlyMeshes;
        includedOnlyMeshes: AbstractMesh[];
        private _excludedMeshes;
        excludedMeshes: AbstractMesh[];
        private _excludeWithLayerMask;
        excludeWithLayerMask: number;
        private _includeOnlyWithLayerMask;
        includeOnlyWithLayerMask: number;
        private _lightmapMode;
        lightmapMode: number;
        private _parentedWorldMatrix;
        _shadowGenerator: Nullable<IShadowGenerator>;
        _excludedMeshesIds: string[];
        _includedOnlyMeshesIds: string[];
        _uniformBuffer: UniformBuffer;
        /**
         * Creates a Light object in the scene.
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         */
        constructor(name: string, scene: Scene);
        protected _buildUniformLayout(): void;
        /**
         * Returns the string "Light".
         */
        getClassName(): string;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        setEnabled(value: boolean): void;
        /**
         * Returns the Light associated shadow generator.
         */
        getShadowGenerator(): Nullable<IShadowGenerator>;
        /**
         * Returns a Vector3, the absolute light position in the World.
         */
        getAbsolutePosition(): Vector3;
        transferToEffect(effect: Effect, lightIndex: string): void;
        _getWorldMatrix(): Matrix;
        /**
         * Boolean : True if the light will affect the passed mesh.
         */
        canAffectMesh(mesh: AbstractMesh): boolean;
        /**
         * Returns the light World matrix.
         */
        getWorldMatrix(): Matrix;
        /**
         * Sort function to order lights for rendering.
         * @param a First Light object to compare to second.
         * @param b Second Light object to compare first.
         * @return -1 to reduce's a's index relative to be, 0 for no change, 1 to increase a's index relative to b.
         */
        static compareLightsPriority(a: Light, b: Light): number;
        /**
         * Disposes the light.
         */
        dispose(): void;
        /**
         * Returns the light type ID (integer).
         */
        getTypeID(): number;
        /**
         * Returns the intensity scaled by the Photometric Scale according to the light type and intensity mode.
         */
        getScaledIntensity(): number;
        /**
         * Returns a new Light object, named "name", from the current one.
         */
        clone(name: string): Nullable<Light>;
        /**
         * Serializes the current light into a Serialization object.
         * Returns the serialized object.
         */
        serialize(): any;
        /**
         * Creates a new typed light from the passed type (integer) : point light = 0, directional light = 1, spot light = 2, hemispheric light = 3.
         * This new light is named "name" and added to the passed scene.
         */
        static GetConstructorFromName(type: number, name: string, scene: Scene): Nullable<() => Light>;
        /**
         * Parses the passed "parsedLight" and returns a new instanced Light from this parsing.
         */
        static Parse(parsedLight: any, scene: Scene): Nullable<Light>;
        private _hookArrayForExcluded(array);
        private _hookArrayForIncludedOnly(array);
        private _resyncMeshes();
        _markMeshesAsLightDirty(): void;
        /**
         * Recomputes the cached photometric scale if needed.
         */
        private _computePhotometricScale();
        /**
         * Returns the Photometric Scale according to the light type and intensity mode.
         */
        private _getPhotometricScale();
        _reorderLightsInScene(): void;
    }
}

declare module 'babylonjs/core' {
    class Camera extends Node {
        inputs: CameraInputsManager<Camera>;
        private static _PERSPECTIVE_CAMERA;
        private static _ORTHOGRAPHIC_CAMERA;
        private static _FOVMODE_VERTICAL_FIXED;
        private static _FOVMODE_HORIZONTAL_FIXED;
        private static _RIG_MODE_NONE;
        private static _RIG_MODE_STEREOSCOPIC_ANAGLYPH;
        private static _RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL;
        private static _RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
        private static _RIG_MODE_STEREOSCOPIC_OVERUNDER;
        private static _RIG_MODE_VR;
        private static _RIG_MODE_WEBVR;
        static readonly PERSPECTIVE_CAMERA: number;
        static readonly ORTHOGRAPHIC_CAMERA: number;
        /**
         * This is the default FOV mode for perspective cameras.
         * This setting aligns the upper and lower bounds of the viewport to the upper and lower bounds of the camera frustum.
         *
         */
        static readonly FOVMODE_VERTICAL_FIXED: number;
        /**
         * This setting aligns the left and right bounds of the viewport to the left and right bounds of the camera frustum.
         *
         */
        static readonly FOVMODE_HORIZONTAL_FIXED: number;
        static readonly RIG_MODE_NONE: number;
        static readonly RIG_MODE_STEREOSCOPIC_ANAGLYPH: number;
        static readonly RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL: number;
        static readonly RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED: number;
        static readonly RIG_MODE_STEREOSCOPIC_OVERUNDER: number;
        static readonly RIG_MODE_VR: number;
        static readonly RIG_MODE_WEBVR: number;
        static ForceAttachControlToAlwaysPreventDefault: boolean;
        static UseAlternateWebVRRendering: boolean;
        position: Vector3;
        upVector: Vector3;
        orthoLeft: Nullable<number>;
        orthoRight: Nullable<number>;
        orthoBottom: Nullable<number>;
        orthoTop: Nullable<number>;
        /**
         * default : 0.8
         * FOV is set in Radians.
         */
        fov: number;
        minZ: number;
        maxZ: number;
        inertia: number;
        mode: number;
        isIntermediate: boolean;
        viewport: Viewport;
        /**
        * Restricts the camera to viewing objects with the same layerMask.
        * A camera with a layerMask of 1 will render meshes with no layerMask and meshes with a layerMask of 1.
        */
        layerMask: number;
        /**
        * default : FOVMODE_VERTICAL_FIXED
        * fovMode sets the camera frustum bounds to the viewport bounds.
        */
        fovMode: number;
        cameraRigMode: number;
        interaxialDistance: number;
        isStereoscopicSideBySide: boolean;
        _cameraRigParams: any;
        _rigCameras: Camera[];
        _rigPostProcess: Nullable<PostProcess>;
        protected _webvrViewMatrix: Matrix;
        _skipRendering: boolean;
        _alternateCamera: Camera;
        customRenderTargets: RenderTargetTexture[];
        onViewMatrixChangedObservable: Observable<Camera>;
        onProjectionMatrixChangedObservable: Observable<Camera>;
        onAfterCheckInputsObservable: Observable<Camera>;
        onRestoreStateObservable: Observable<Camera>;
        private _computedViewMatrix;
        _projectionMatrix: Matrix;
        private _doNotComputeProjectionMatrix;
        private _worldMatrix;
        _postProcesses: PostProcess[];
        private _transformMatrix;
        _activeMeshes: SmartArray<AbstractMesh>;
        private _globalPosition;
        private _frustumPlanes;
        private _refreshFrustumPlanes;
        constructor(name: string, position: Vector3, scene: Scene);
        private _storedFov;
        private _stateStored;
        /**
         * Store current camera state (fov, position, etc..)
         */
        storeState(): Camera;
        /**
         * Restores the camera state values if it has been stored. You must call storeState() first
         */
        protected _restoreStateValues(): boolean;
        /**
         * Restored camera state. You must call storeState() first
         */
        restoreState(): boolean;
        getClassName(): string;
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        readonly globalPosition: Vector3;
        getActiveMeshes(): SmartArray<AbstractMesh>;
        isActiveMesh(mesh: Mesh): boolean;
        _initCache(): void;
        _updateCache(ignoreParentClass?: boolean): void;
        _isSynchronized(): boolean;
        _isSynchronizedViewMatrix(): boolean;
        _isSynchronizedProjectionMatrix(): boolean;
        attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        detachControl(element: HTMLElement): void;
        update(): void;
        _checkInputs(): void;
        readonly rigCameras: Camera[];
        readonly rigPostProcess: Nullable<PostProcess>;
        private _cascadePostProcessesToRigCams();
        attachPostProcess(postProcess: PostProcess, insertAt?: Nullable<number>): number;
        detachPostProcess(postProcess: PostProcess): void;
        getWorldMatrix(): Matrix;
        _getViewMatrix(): Matrix;
        getViewMatrix(force?: boolean): Matrix;
        freezeProjectionMatrix(projection?: Matrix): void;
        unfreezeProjectionMatrix(): void;
        getProjectionMatrix(force?: boolean): Matrix;
        getTranformationMatrix(): Matrix;
        private updateFrustumPlanes();
        isInFrustum(target: ICullable): boolean;
        isCompletelyInFrustum(target: ICullable): boolean;
        getForwardRay(length?: number, transform?: Matrix, origin?: Vector3): Ray;
        dispose(): void;
        readonly leftCamera: Nullable<FreeCamera>;
        readonly rightCamera: Nullable<FreeCamera>;
        getLeftTarget(): Nullable<Vector3>;
        getRightTarget(): Nullable<Vector3>;
        setCameraRigMode(mode: number, rigParams: any): void;
        private _getVRProjectionMatrix();
        protected _updateCameraRotationMatrix(): void;
        protected _updateWebVRCameraRotationMatrix(): void;
        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        protected _getWebVRProjectionMatrix(): Matrix;
        /**
         * This function MUST be overwritten by the different WebVR cameras available.
         * The context in which it is running is the RIG camera. So 'this' is the TargetCamera, left or right.
         */
        protected _getWebVRViewMatrix(): Matrix;
        setCameraRigParameter(name: string, value: any): void;
        /**
         * needs to be overridden by children so sub has required properties to be copied
         */
        createRigCamera(name: string, cameraIndex: number): Nullable<Camera>;
        /**
         * May need to be overridden by children
         */
        _updateRigCameras(): void;
        _setupInputs(): void;
        serialize(): any;
        clone(name: string): Camera;
        getDirection(localAxis: Vector3): Vector3;
        getDirectionToRef(localAxis: Vector3, result: Vector3): void;
        static GetConstructorFromName(type: string, name: string, scene: Scene, interaxial_distance?: number, isStereoscopicSideBySide?: boolean): () => Camera;
        computeWorldMatrix(): Matrix;
        static Parse(parsedCamera: any, scene: Scene): Camera;
    }
}

declare module 'babylonjs/core' {
    class RenderingManager {
        /**
         * The max id used for rendering groups (not included)
         */
        static MAX_RENDERINGGROUPS: number;
        /**
         * The min id used for rendering groups (included)
         */
        static MIN_RENDERINGGROUPS: number;
        /**
         * Used to globally prevent autoclearing scenes.
         */
        static AUTOCLEAR: boolean;
        private _scene;
        private _renderingGroups;
        private _depthStencilBufferAlreadyCleaned;
        private _autoClearDepthStencil;
        private _customOpaqueSortCompareFn;
        private _customAlphaTestSortCompareFn;
        private _customTransparentSortCompareFn;
        private _renderinGroupInfo;
        constructor(scene: Scene);
        private _clearDepthStencilBuffer(depth?, stencil?);
        render(customRenderFunction: Nullable<(opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>) => void>, activeMeshes: Nullable<AbstractMesh[]>, renderParticles: boolean, renderSprites: boolean): void;
        reset(): void;
        dispose(): void;
        private _prepareRenderingGroup(renderingGroupId);
        dispatchSprites(spriteManager: SpriteManager): void;
        dispatchParticles(particleSystem: IParticleSystem): void;
        /**
         * @param subMesh The submesh to dispatch
         * @param [mesh] Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
         * @param [material] Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
         */
        dispatch(subMesh: SubMesh, mesh?: AbstractMesh, material?: Nullable<Material>): void;
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        setRenderingOrder(renderingGroupId: number, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         * @param depth Automatically clears depth between groups if true and autoClear is true.
         * @param stencil Automatically clears stencil between groups if true and autoClear is true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean, depth?: boolean, stencil?: boolean): void;
    }
}

declare module 'babylonjs/core' {
    class RenderingGroup {
        index: number;
        private _scene;
        private _opaqueSubMeshes;
        private _transparentSubMeshes;
        private _alphaTestSubMeshes;
        private _depthOnlySubMeshes;
        private _particleSystems;
        private _spriteManagers;
        private _opaqueSortCompareFn;
        private _alphaTestSortCompareFn;
        private _transparentSortCompareFn;
        private _renderOpaque;
        private _renderAlphaTest;
        private _renderTransparent;
        private _edgesRenderers;
        onBeforeTransparentRendering: () => void;
        /**
         * Set the opaque sort comparison function.
         * If null the sub meshes will be render in the order they were created
         */
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        /**
         * Set the alpha test sort comparison function.
         * If null the sub meshes will be render in the order they were created
         */
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        /**
         * Set the transparent sort comparison function.
         * If null the sub meshes will be render in the order they were created
         */
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number>;
        /**
         * Creates a new rendering group.
         * @param index The rendering group index
         * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
         * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
         * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
         */
        constructor(index: number, scene: Scene, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>);
        /**
         * Render all the sub meshes contained in the group.
         * @param customRenderFunction Used to override the default render behaviour of the group.
         * @returns true if rendered some submeshes.
         */
        render(customRenderFunction: Nullable<(opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>) => void>, renderSprites: boolean, renderParticles: boolean, activeMeshes: Nullable<AbstractMesh[]>): void;
        /**
         * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderOpaqueSorted(subMeshes);
        /**
         * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderAlphaTestSorted(subMeshes);
        /**
         * Renders the opaque submeshes in the order from the transparentSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        private renderTransparentSorted(subMeshes);
        /**
         * Renders the submeshes in a specified order.
         * @param subMeshes The submeshes to sort before render
         * @param sortCompareFn The comparison function use to sort
         * @param cameraPosition The camera position use to preprocess the submeshes to help sorting
         * @param transparent Specifies to activate blending if true
         */
        private static renderSorted(subMeshes, sortCompareFn, camera, transparent);
        /**
         * Renders the submeshes in the order they were dispatched (no sort applied).
         * @param subMeshes The submeshes to render
         */
        private static renderUnsorted(subMeshes);
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front if in the same alpha index.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        static defaultTransparentSortCompare(a: SubMesh, b: SubMesh): number;
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        static backToFrontSortCompare(a: SubMesh, b: SubMesh): number;
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered front to back (prevent overdraw).
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        static frontToBackSortCompare(a: SubMesh, b: SubMesh): number;
        /**
         * Resets the different lists of submeshes to prepare a new frame.
         */
        prepare(): void;
        dispose(): void;
        /**
         * Inserts the submesh in its correct queue depending on its material.
         * @param subMesh The submesh to dispatch
         * @param [mesh] Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
         * @param [material] Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
         */
        dispatch(subMesh: SubMesh, mesh?: AbstractMesh, material?: Nullable<Material>): void;
        dispatchSprites(spriteManager: SpriteManager): void;
        dispatchParticles(particleSystem: IParticleSystem): void;
        private _renderParticles(activeMeshes);
        private _renderSprites();
    }
}

declare module 'babylonjs/core' {
    interface IDisposable {
        dispose(): void;
    }
    interface IActiveMeshCandidateProvider {
        getMeshes(scene: Scene): AbstractMesh[];
        readonly checksIsEnabled: boolean;
    }
    /**
     * This class is used by the onRenderingGroupObservable
     */
    class RenderingGroupInfo {
        /**
         * The Scene that being rendered
         */
        scene: Scene;
        /**
         * The camera currently used for the rendering pass
         */
        camera: Nullable<Camera>;
        /**
         * The ID of the renderingGroup being processed
         */
        renderingGroupId: number;
        /**
         * The rendering stage, can be either STAGE_PRECLEAR, STAGE_PREOPAQUE, STAGE_PRETRANSPARENT, STAGE_POSTTRANSPARENT
         */
        renderStage: number;
        /**
         * Stage corresponding to the very first hook in the renderingGroup phase: before the render buffer may be cleared
         * This stage will be fired no matter what
         */
        static STAGE_PRECLEAR: number;
        /**
         * Called before opaque object are rendered.
         * This stage will be fired only if there's 3D Opaque content to render
         */
        static STAGE_PREOPAQUE: number;
        /**
         * Called after the opaque objects are rendered and before the transparent ones
         * This stage will be fired only if there's 3D transparent content to render
         */
        static STAGE_PRETRANSPARENT: number;
        /**
         * Called after the transparent object are rendered, last hook of the renderingGroup phase
         * This stage will be fired no matter what
         */
        static STAGE_POSTTRANSPARENT: number;
    }
    /**
     * Represents a scene to be rendered by the engine.
     * @see http://doc.babylonjs.com/page.php?p=21911
     */
    class Scene implements IAnimatable {
        private static _FOGMODE_NONE;
        private static _FOGMODE_EXP;
        private static _FOGMODE_EXP2;
        private static _FOGMODE_LINEAR;
        private static _uniqueIdCounter;
        static MinDeltaTime: number;
        static MaxDeltaTime: number;
        /** The fog is deactivated */
        static readonly FOGMODE_NONE: number;
        /** The fog density is following an exponential function */
        static readonly FOGMODE_EXP: number;
        /** The fog density is following an exponential function faster than FOGMODE_EXP */
        static readonly FOGMODE_EXP2: number;
        /** The fog density is following a linear function. */
        static readonly FOGMODE_LINEAR: number;
        autoClear: boolean;
        autoClearDepthAndStencil: boolean;
        clearColor: Color4;
        ambientColor: Color3;
        _environmentBRDFTexture: BaseTexture;
        protected _environmentTexture: BaseTexture;
        /**
         * Texture used in all pbr material as the reflection texture.
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to reference from here than from all the materials.
         */
        /**
         * Texture used in all pbr material as the reflection texture.
         * As in the majority of the scene they are the same (exception for multi room and so on),
         * this is easier to set here than in all the materials.
         */
        environmentTexture: BaseTexture;
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Default image processing configuration used either in the rendering
         * Forward main pass or through the imageProcessingPostProcess if present.
         * As in the majority of the scene they are the same (exception for multi camera),
         * this is easier to reference from here than from all the materials and post process.
         *
         * No setter as we it is a shared configuration, you can set the values instead.
         */
        readonly imageProcessingConfiguration: ImageProcessingConfiguration;
        forceWireframe: boolean;
        private _forcePointsCloud;
        forcePointsCloud: boolean;
        forceShowBoundingBoxes: boolean;
        clipPlane: Nullable<Plane>;
        animationsEnabled: boolean;
        useConstantAnimationDeltaTime: boolean;
        constantlyUpdateMeshUnderPointer: boolean;
        hoverCursor: string;
        defaultCursor: string;
        /**
         * This is used to call preventDefault() on pointer down
         * in order to block unwanted artifacts like system double clicks
         */
        preventDefaultOnPointerDown: boolean;
        metadata: any;
        loadingPluginName: string;
        private _spritePredicate;
        /**
        * An event triggered when the scene is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Scene>;
        private _onDisposeObserver;
        /** A function to be executed when this scene is disposed. */
        onDispose: () => void;
        /**
        * An event triggered before rendering the scene (right after animations and physics)
        * @type {BABYLON.Observable}
        */
        onBeforeRenderObservable: Observable<Scene>;
        private _onBeforeRenderObserver;
        /** A function to be executed before rendering this scene */
        beforeRender: Nullable<() => void>;
        /**
        * An event triggered after rendering the scene
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<Scene>;
        private _onAfterRenderObserver;
        /** A function to be executed after rendering this scene */
        afterRender: Nullable<() => void>;
        /**
        * An event triggered before animating the scene
        * @type {BABYLON.Observable}
        */
        onBeforeAnimationsObservable: Observable<Scene>;
        /**
        * An event triggered after animations processing
        * @type {BABYLON.Observable}
        */
        onAfterAnimationsObservable: Observable<Scene>;
        /**
        * An event triggered before draw calls are ready to be sent
        * @type {BABYLON.Observable}
        */
        onBeforeDrawPhaseObservable: Observable<Scene>;
        /**
        * An event triggered after draw calls have been sent
        * @type {BABYLON.Observable}
        */
        onAfterDrawPhaseObservable: Observable<Scene>;
        /**
        * An event triggered when physic simulation is about to be run
        * @type {BABYLON.Observable}
        */
        onBeforePhysicsObservable: Observable<Scene>;
        /**
        * An event triggered when physic simulation has been done
        * @type {BABYLON.Observable}
        */
        onAfterPhysicsObservable: Observable<Scene>;
        /**
        * An event triggered when the scene is ready
        * @type {BABYLON.Observable}
        */
        onReadyObservable: Observable<Scene>;
        /**
        * An event triggered before rendering a camera
        * @type {BABYLON.Observable}
        */
        onBeforeCameraRenderObservable: Observable<Camera>;
        private _onBeforeCameraRenderObserver;
        beforeCameraRender: () => void;
        /**
        * An event triggered after rendering a camera
        * @type {BABYLON.Observable}
        */
        onAfterCameraRenderObservable: Observable<Camera>;
        private _onAfterCameraRenderObserver;
        afterCameraRender: () => void;
        /**
        * An event triggered when active meshes evaluation is about to start
        * @type {BABYLON.Observable}
        */
        onBeforeActiveMeshesEvaluationObservable: Observable<Scene>;
        /**
        * An event triggered when active meshes evaluation is done
        * @type {BABYLON.Observable}
        */
        onAfterActiveMeshesEvaluationObservable: Observable<Scene>;
        /**
        * An event triggered when particles rendering is about to start
        * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onBeforeParticlesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when particles rendering is done
        * Note: This event can be trigger more than once per frame (because particles can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onAfterParticlesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when sprites rendering is about to start
        * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onBeforeSpritesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when sprites rendering is done
        * Note: This event can be trigger more than once per frame (because sprites can be rendered by render target textures as well)
        * @type {BABYLON.Observable}
        */
        onAfterSpritesRenderingObservable: Observable<Scene>;
        /**
        * An event triggered when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed
        * @type {BABYLON.Observable}
        */
        onDataLoadedObservable: Observable<Scene>;
        /**
        * An event triggered when a camera is created
        * @type {BABYLON.Observable}
        */
        onNewCameraAddedObservable: Observable<Camera>;
        /**
        * An event triggered when a camera is removed
        * @type {BABYLON.Observable}
        */
        onCameraRemovedObservable: Observable<Camera>;
        /**
        * An event triggered when a light is created
        * @type {BABYLON.Observable}
        */
        onNewLightAddedObservable: Observable<Light>;
        /**
        * An event triggered when a light is removed
        * @type {BABYLON.Observable}
        */
        onLightRemovedObservable: Observable<Light>;
        /**
        * An event triggered when a geometry is created
        * @type {BABYLON.Observable}
        */
        onNewGeometryAddedObservable: Observable<Geometry>;
        /**
        * An event triggered when a geometry is removed
        * @type {BABYLON.Observable}
        */
        onGeometryRemovedObservable: Observable<Geometry>;
        /**
        * An event triggered when a transform node is created
        * @type {BABYLON.Observable}
        */
        onNewTransformNodeAddedObservable: Observable<TransformNode>;
        /**
        * An event triggered when a transform node is removed
        * @type {BABYLON.Observable}
        */
        onTransformNodeRemovedObservable: Observable<TransformNode>;
        /**
        * An event triggered when a mesh is created
        * @type {BABYLON.Observable}
        */
        onNewMeshAddedObservable: Observable<AbstractMesh>;
        /**
        * An event triggered when a mesh is removed
        * @type {BABYLON.Observable}
        */
        onMeshRemovedObservable: Observable<AbstractMesh>;
        /**
        * An event triggered when render targets are about to be rendered
        * Can happen multiple times per frame.
        * @type {BABYLON.Observable}
        */
        OnBeforeRenderTargetsRenderObservable: Observable<Scene>;
        /**
        * An event triggered when render targets were rendered.
        * Can happen multiple times per frame.
        * @type {BABYLON.Observable}
        */
        OnAfterRenderTargetsRenderObservable: Observable<Scene>;
        /**
        * An event triggered before calculating deterministic simulation step
        * @type {BABYLON.Observable}
        */
        onBeforeStepObservable: Observable<Scene>;
        /**
        * An event triggered after calculating deterministic simulation step
        * @type {BABYLON.Observable}
        */
        onAfterStepObservable: Observable<Scene>;
        /**
         * This Observable will be triggered for each stage of each renderingGroup of each rendered camera.
         * The RenderinGroupInfo class contains all the information about the context in which the observable is called
         * If you wish to register an Observer only for a given set of renderingGroup, use the mask with a combination of the renderingGroup index elevated to the power of two (1 for renderingGroup 0, 2 for renderingrOup1, 4 for 2 and 8 for 3)
         */
        onRenderingGroupObservable: Observable<RenderingGroupInfo>;
        animations: Animation[];
        pointerDownPredicate: (Mesh: AbstractMesh) => boolean;
        pointerUpPredicate: (Mesh: AbstractMesh) => boolean;
        pointerMovePredicate: (Mesh: AbstractMesh) => boolean;
        private _onPointerMove;
        private _onPointerDown;
        private _onPointerUp;
        /** Deprecated. Use onPointerObservable instead */
        onPointerMove: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        /** Deprecated. Use onPointerObservable instead */
        onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        /** Deprecated. Use onPointerObservable instead */
        onPointerUp: (evt: PointerEvent, pickInfo: Nullable<PickingInfo>) => void;
        /** Deprecated. Use onPointerObservable instead */
        onPointerPick: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        private _gamepadManager;
        readonly gamepadManager: GamepadManager;
        /**
         * This observable event is triggered when any ponter event is triggered. It is registered during Scene.attachControl() and it is called BEFORE the 3D engine process anything (mesh/sprite picking for instance).
         * You have the possibility to skip the process and the call to onPointerObservable by setting PointerInfoPre.skipOnPointerObservable to true
         */
        onPrePointerObservable: Observable<PointerInfoPre>;
        /**
         * Observable event triggered each time an input event is received from the rendering canvas
         */
        onPointerObservable: Observable<PointerInfo>;
        readonly unTranslatedPointer: Vector2;
        /** The distance in pixel that you have to move to prevent some events */
        static DragMovementThreshold: number;
        /** Time in milliseconds to wait to raise long press events if button is still pressed */
        static LongPressDelay: number;
        /** Time in milliseconds with two consecutive clicks will be considered as a double click */
        static DoubleClickDelay: number;
        /** If you need to check double click without raising a single click at first click, enable this flag */
        static ExclusiveDoubleClickMode: boolean;
        private _initClickEvent;
        private _initActionManager;
        private _delayedSimpleClick;
        private _delayedSimpleClickTimeout;
        private _previousDelayedSimpleClickTimeout;
        private _meshPickProceed;
        private _previousButtonPressed;
        private _currentPickResult;
        private _previousPickResult;
        private _totalPointersPressed;
        private _doubleClickOccured;
        /** Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position */
        cameraToUseForPointers: Nullable<Camera>;
        private _pointerX;
        private _pointerY;
        private _unTranslatedPointerX;
        private _unTranslatedPointerY;
        private _startingPointerPosition;
        private _previousStartingPointerPosition;
        private _startingPointerTime;
        private _previousStartingPointerTime;
        private _timeAccumulator;
        private _currentStepId;
        private _currentInternalStep;
        _mirroredCameraPosition: Nullable<Vector3>;
        /**
         * This observable event is triggered when any keyboard event si raised and registered during Scene.attachControl()
         * You have the possibility to skip the process and the call to onKeyboardObservable by setting KeyboardInfoPre.skipOnPointerObservable to true
         */
        onPreKeyboardObservable: Observable<KeyboardInfoPre>;
        /**
         * Observable event triggered each time an keyboard event is received from the hosting window
         */
        onKeyboardObservable: Observable<KeyboardInfo>;
        private _onKeyDown;
        private _onKeyUp;
        private _onCanvasFocusObserver;
        private _onCanvasBlurObserver;
        /**
        * use right-handed coordinate system on this scene.
        * @type {boolean}
        */
        private _useRightHandedSystem;
        useRightHandedSystem: boolean;
        setStepId(newStepId: number): void;
        getStepId(): number;
        getInternalStep(): number;
        private _fogEnabled;
        /**
        * is fog enabled on this scene.
        */
        fogEnabled: boolean;
        private _fogMode;
        fogMode: number;
        fogColor: Color3;
        fogDensity: number;
        fogStart: number;
        fogEnd: number;
        /**
        * is shadow enabled on this scene.
        * @type {boolean}
        */
        private _shadowsEnabled;
        shadowsEnabled: boolean;
        /**
        * is light enabled on this scene.
        * @type {boolean}
        */
        private _lightsEnabled;
        lightsEnabled: boolean;
        /**
        * All of the lights added to this scene.
        * @see BABYLON.Light
        * @type {BABYLON.Light[]}
        */
        lights: Light[];
        /** All of the cameras added to this scene. */
        cameras: Camera[];
        /** All of the active cameras added to this scene. */
        activeCameras: Camera[];
        /** The current active camera */
        activeCamera: Nullable<Camera>;
        /**
        * All of the tranform nodes added to this scene.
        * @see BABYLON.TransformNode
        * @type {BABYLON.TransformNode[]}
        */
        transformNodes: TransformNode[];
        /**
        * All of the (abstract) meshes added to this scene.
        * @see BABYLON.AbstractMesh
        * @type {BABYLON.AbstractMesh[]}
        */
        meshes: AbstractMesh[];
        /**
        * All of the animation groups added to this scene.
        * @see BABYLON.AnimationGroup
        * @type {BABYLON.AnimationGroup[]}
        */
        animationGroups: AnimationGroup[];
        private _geometries;
        materials: Material[];
        multiMaterials: MultiMaterial[];
        private _defaultMaterial;
        /** The default material used on meshes when no material is affected */
        /** The default material used on meshes when no material is affected */
        defaultMaterial: Material;
        private _texturesEnabled;
        texturesEnabled: boolean;
        textures: BaseTexture[];
        particlesEnabled: boolean;
        particleSystems: IParticleSystem[];
        spritesEnabled: boolean;
        spriteManagers: SpriteManager[];
        layers: Layer[];
        highlightLayers: HighlightLayer[];
        private _skeletonsEnabled;
        skeletonsEnabled: boolean;
        skeletons: Skeleton[];
        morphTargetManagers: MorphTargetManager[];
        lensFlaresEnabled: boolean;
        lensFlareSystems: LensFlareSystem[];
        collisionsEnabled: boolean;
        private _workerCollisions;
        collisionCoordinator: ICollisionCoordinator;
        /** Defines the gravity applied to this scene */
        gravity: Vector3;
        postProcesses: PostProcess[];
        postProcessesEnabled: boolean;
        postProcessManager: PostProcessManager;
        private _postProcessRenderPipelineManager;
        readonly postProcessRenderPipelineManager: PostProcessRenderPipelineManager;
        renderTargetsEnabled: boolean;
        dumpNextRenderTargets: boolean;
        customRenderTargets: RenderTargetTexture[];
        useDelayedTextureLoading: boolean;
        importedMeshesFiles: String[];
        probesEnabled: boolean;
        reflectionProbes: ReflectionProbe[];
        database: Database;
        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
        */
        actionManager: ActionManager;
        _actionManagers: ActionManager[];
        private _meshesForIntersections;
        proceduralTexturesEnabled: boolean;
        _proceduralTextures: ProceduralTexture[];
        private _mainSoundTrack;
        soundTracks: SoundTrack[];
        private _audioEnabled;
        private _headphone;
        readonly mainSoundTrack: SoundTrack;
        VRHelper: VRExperienceHelper;
        simplificationQueue: SimplificationQueue;
        private _engine;
        private _totalVertices;
        _activeIndices: PerfCounter;
        _activeParticles: PerfCounter;
        _activeBones: PerfCounter;
        private _animationRatio;
        private _animationTimeLast;
        private _animationTime;
        animationTimeScale: number;
        _cachedMaterial: Nullable<Material>;
        _cachedEffect: Nullable<Effect>;
        _cachedVisibility: Nullable<number>;
        private _renderId;
        private _executeWhenReadyTimeoutId;
        private _intermediateRendering;
        private _viewUpdateFlag;
        private _projectionUpdateFlag;
        private _alternateViewUpdateFlag;
        private _alternateProjectionUpdateFlag;
        _toBeDisposed: SmartArray<Nullable<IDisposable>>;
        private _activeRequests;
        private _pendingData;
        private _isDisposed;
        dispatchAllSubMeshesOfActiveMeshes: boolean;
        private _activeMeshes;
        private _processedMaterials;
        private _renderTargets;
        _activeParticleSystems: SmartArray<IParticleSystem>;
        private _activeSkeletons;
        private _softwareSkinnedMeshes;
        private _renderingManager;
        private _physicsEngine;
        _activeAnimatables: Animatable[];
        private _transformMatrix;
        private _sceneUbo;
        private _alternateSceneUbo;
        private _pickWithRayInverseMatrix;
        private _boundingBoxRenderer;
        private _outlineRenderer;
        private _viewMatrix;
        private _projectionMatrix;
        private _alternateViewMatrix;
        private _alternateProjectionMatrix;
        private _alternateTransformMatrix;
        private _useAlternateCameraConfiguration;
        private _alternateRendering;
        _forcedViewPosition: Nullable<Vector3>;
        readonly _isAlternateRenderingEnabled: boolean;
        private _frustumPlanes;
        readonly frustumPlanes: Plane[];
        requireLightSorting: boolean;
        private _selectionOctree;
        private _pointerOverMesh;
        private _pointerOverSprite;
        private _debugLayer;
        private _depthRenderer;
        private _geometryBufferRenderer;
        private _pickedDownMesh;
        private _pickedUpMesh;
        private _pickedDownSprite;
        private _externalData;
        private _uid;
        /**
         * @constructor
         * @param {BABYLON.Engine} engine - the engine to be used to render this scene.
         */
        constructor(engine: Engine);
        readonly debugLayer: DebugLayer;
        workerCollisions: boolean;
        readonly selectionOctree: Octree<AbstractMesh>;
        /**
         * The mesh that is currently under the pointer.
         * @return {BABYLON.AbstractMesh} mesh under the pointer/mouse cursor or null if none.
         */
        readonly meshUnderPointer: Nullable<AbstractMesh>;
        /**
         * Current on-screen X position of the pointer
         * @return {number} X position of the pointer
         */
        readonly pointerX: number;
        /**
         * Current on-screen Y position of the pointer
         * @return {number} Y position of the pointer
         */
        readonly pointerY: number;
        getCachedMaterial(): Nullable<Material>;
        getCachedEffect(): Nullable<Effect>;
        getCachedVisibility(): Nullable<number>;
        isCachedMaterialInvalid(material: Material, effect: Effect, visibility?: number): boolean;
        getBoundingBoxRenderer(): BoundingBoxRenderer;
        getOutlineRenderer(): OutlineRenderer;
        getEngine(): Engine;
        getTotalVertices(): number;
        readonly totalVerticesPerfCounter: PerfCounter;
        getActiveIndices(): number;
        readonly totalActiveIndicesPerfCounter: PerfCounter;
        getActiveParticles(): number;
        readonly activeParticlesPerfCounter: PerfCounter;
        getActiveBones(): number;
        readonly activeBonesPerfCounter: PerfCounter;
        getInterFramePerfCounter(): number;
        readonly interFramePerfCounter: Nullable<PerfCounter>;
        getLastFrameDuration(): number;
        readonly lastFramePerfCounter: Nullable<PerfCounter>;
        getEvaluateActiveMeshesDuration(): number;
        readonly evaluateActiveMeshesDurationPerfCounter: Nullable<PerfCounter>;
        getActiveMeshes(): SmartArray<AbstractMesh>;
        getRenderTargetsDuration(): number;
        getRenderDuration(): number;
        readonly renderDurationPerfCounter: Nullable<PerfCounter>;
        getParticlesDuration(): number;
        readonly particlesDurationPerfCounter: Nullable<PerfCounter>;
        getSpritesDuration(): number;
        readonly spriteDuractionPerfCounter: Nullable<PerfCounter>;
        getAnimationRatio(): number;
        getRenderId(): number;
        incrementRenderId(): void;
        private _updatePointerPosition(evt);
        private _createUbo();
        private _createAlternateUbo();
        /**
         * Use this method to simulate a pointer move on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        simulatePointerMove(pickResult: PickingInfo): Scene;
        private _processPointerMove(pickResult, evt);
        /**
         * Use this method to simulate a pointer down on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        simulatePointerDown(pickResult: PickingInfo): Scene;
        private _processPointerDown(pickResult, evt);
        /**
         * Use this method to simulate a pointer up on a mesh
         * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
         */
        simulatePointerUp(pickResult: PickingInfo): Scene;
        private _processPointerUp(pickResult, evt, clickInfo);
        /**
        * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
        * @param attachUp defines if you want to attach events to pointerup
        * @param attachDown defines if you want to attach events to pointerdown
        * @param attachMove defines if you want to attach events to pointermove
        */
        attachControl(attachUp?: boolean, attachDown?: boolean, attachMove?: boolean): void;
        detachControl(): void;
        isReady(): boolean;
        resetCachedMaterial(): void;
        registerBeforeRender(func: () => void): void;
        unregisterBeforeRender(func: () => void): void;
        registerAfterRender(func: () => void): void;
        unregisterAfterRender(func: () => void): void;
        private _executeOnceBeforeRender(func);
        /**
         * The provided function will run before render once and will be disposed afterwards.
         * A timeout delay can be provided so that the function will be executed in N ms.
         * The timeout is using the browser's native setTimeout so time percision cannot be guaranteed.
         * @param func The function to be executed.
         * @param timeout optional delay in ms
         */
        executeOnceBeforeRender(func: () => void, timeout?: number): void;
        _addPendingData(data: any): void;
        _removePendingData(data: any): void;
        getWaitingItemsCount(): number;
        readonly isLoading: boolean;
        /**
         * Registers a function to be executed when the scene is ready.
         * @param {Function} func - the function to be executed.
         */
        executeWhenReady(func: () => void): void;
        _checkIsReady(): void;
        /**
         * Will start the animation sequence of a given target
         * @param target - the target
         * @param {number} from - from which frame should animation start
         * @param {number} to - till which frame should animation run.
         * @param {boolean} [loop] - should the animation loop
         * @param {number} [speedRatio] - the speed in which to run the animation
         * @param {Function} [onAnimationEnd] function to be executed when the animation ended.
         * @param {BABYLON.Animatable} [animatable] an animatable object. If not provided a new one will be created from the given params.
         * Returns {BABYLON.Animatable} the animatable object created for this animation
         * See BABYLON.Animatable
         */
        beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, animatable?: Animatable): Animatable;
        /**
         * Begin a new animation on a given node
         * @param {BABYLON.Node} node defines the root node where the animation will take place
         * @param {BABYLON.Animation[]} defines the list of animations to start
         * @param {number} from defines the initial value
         * @param {number} to defines the final value
         * @param {boolean} loop defines if you want animation to loop (off by default)
         * @param {number} speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of created animatables
         */
        beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable;
        /**
         * Begin a new animation on a given node and its hierarchy
         * @param {BABYLON.Node} node defines the root node where the animation will take place
         * @param {boolean} directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used.
         * @param {BABYLON.Animation[]} defines the list of animations to start
         * @param {number} from defines the initial value
         * @param {number} to defines the final value
         * @param {boolean} loop defines if you want animation to loop (off by default)
         * @param {number} speedRatio defines the speed ratio to apply to all animations
         * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
         * @returns the list of animatables created for all nodes
         */
        beginDirectHierarchyAnimation(target: Node, directDescendantsOnly: boolean, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable[];
        getAnimatableByTarget(target: any): Nullable<Animatable>;
        readonly animatables: Animatable[];
        /**
         * Will stop the animation of the given target
         * @param target - the target
         * @param animationName - the name of the animation to stop (all animations will be stopped is empty)
         * @see beginAnimation
         */
        stopAnimation(target: any, animationName?: string): void;
        /**
         * Stops and removes all animations that have been applied to the scene
         */
        stopAllAnimations(): void;
        private _animate();
        _switchToAlternateCameraConfiguration(active: boolean): void;
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
        getTransformMatrix(): Matrix;
        setTransformMatrix(view: Matrix, projection: Matrix): void;
        _setAlternateTransformMatrix(view: Matrix, projection: Matrix): void;
        getSceneUniformBuffer(): UniformBuffer;
        getUniqueId(): number;
        addMesh(newMesh: AbstractMesh): void;
        removeMesh(toRemove: AbstractMesh): number;
        addTransformNode(newTransformNode: TransformNode): void;
        removeTransformNode(toRemove: TransformNode): number;
        removeSkeleton(toRemove: Skeleton): number;
        removeMorphTargetManager(toRemove: MorphTargetManager): number;
        removeLight(toRemove: Light): number;
        removeCamera(toRemove: Camera): number;
        addLight(newLight: Light): void;
        sortLightsByPriority(): void;
        addCamera(newCamera: Camera): void;
        /**
         * Switch active camera
         * @param {Camera} newCamera - new active camera
         * @param {boolean} attachControl - call attachControl for the new active camera (default: true)
         */
        switchActiveCamera(newCamera: Camera, attachControl?: boolean): void;
        /**
         * sets the active camera of the scene using its ID
         * @param {string} id - the camera's ID
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        setActiveCameraByID(id: string): Nullable<Camera>;
        /**
         * sets the active camera of the scene using its name
         * @param {string} name - the camera's name
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        setActiveCameraByName(name: string): Nullable<Camera>;
        /**
         * get an animation group using its name
         * @param {string} the material's name
         * @return {BABYLON.AnimationGroup|null} the animation group or null if none found.
         */
        getAnimationGroupByName(name: string): Nullable<AnimationGroup>;
        /**
         * get a material using its id
         * @param {string} the material's ID
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        getMaterialByID(id: string): Nullable<Material>;
        /**
         * get a material using its name
         * @param {string} the material's name
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        getMaterialByName(name: string): Nullable<Material>;
        getLensFlareSystemByName(name: string): Nullable<LensFlareSystem>;
        getLensFlareSystemByID(id: string): Nullable<LensFlareSystem>;
        getCameraByID(id: string): Nullable<Camera>;
        getCameraByUniqueID(uniqueId: number): Nullable<Camera>;
        /**
         * get a camera using its name
         * @param {string} the camera's name
         * @return {BABYLON.Camera|null} the camera or null if none found.
         */
        getCameraByName(name: string): Nullable<Camera>;
        /**
         * get a bone using its id
         * @param {string} the bone's id
         * @return {BABYLON.Bone|null} the bone or null if not found
         */
        getBoneByID(id: string): Nullable<Bone>;
        /**
        * get a bone using its id
        * @param {string} the bone's name
        * @return {BABYLON.Bone|null} the bone or null if not found
        */
        getBoneByName(name: string): Nullable<Bone>;
        /**
         * get a light node using its name
         * @param {string} the light's name
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        getLightByName(name: string): Nullable<Light>;
        /**
         * get a light node using its ID
         * @param {string} the light's id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        getLightByID(id: string): Nullable<Light>;
        /**
         * get a light node using its scene-generated unique ID
         * @param {number} the light's unique id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        getLightByUniqueID(uniqueId: number): Nullable<Light>;
        /**
         * get a particle system by id
         * @param id {number} the particle system id
         * @return {BABYLON.IParticleSystem|null} the corresponding system or null if none found.
         */
        getParticleSystemByID(id: string): Nullable<IParticleSystem>;
        /**
         * get a geometry using its ID
         * @param {string} the geometry's id
         * @return {BABYLON.Geometry|null} the geometry or null if none found.
         */
        getGeometryByID(id: string): Nullable<Geometry>;
        /**
         * add a new geometry to this scene.
         * @param {BABYLON.Geometry} geometry - the geometry to be added to the scene.
         * @param {boolean} [force] - force addition, even if a geometry with this ID already exists
         * @return {boolean} was the geometry added or not
         */
        pushGeometry(geometry: Geometry, force?: boolean): boolean;
        /**
         * Removes an existing geometry
         * @param {BABYLON.Geometry} geometry - the geometry to be removed from the scene.
         * @return {boolean} was the geometry removed or not
         */
        removeGeometry(geometry: Geometry): boolean;
        getGeometries(): Geometry[];
        /**
         * Get the first added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        getMeshByID(id: string): Nullable<AbstractMesh>;
        getMeshesByID(id: string): Array<AbstractMesh>;
        /**
         * Get the first added transform node found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.TransformNode|null} the transform node found or null if not found at all.
         */
        getTransformNodeByID(id: string): Nullable<TransformNode>;
        getTransformNodesByID(id: string): Array<TransformNode>;
        /**
         * Get a mesh with its auto-generated unique id
         * @param {number} uniqueId - the unique id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        getMeshByUniqueID(uniqueId: number): Nullable<AbstractMesh>;
        /**
         * Get a the last added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        getLastMeshByID(id: string): Nullable<AbstractMesh>;
        /**
         * Get a the last added node (Mesh, Camera, Light) found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.Node|null} the node found or null if not found at all.
         */
        getLastEntryByID(id: string): Nullable<Node>;
        getNodeByID(id: string): Nullable<Node>;
        getNodeByName(name: string): Nullable<Node>;
        getMeshByName(name: string): Nullable<AbstractMesh>;
        getTransformNodeByName(name: string): Nullable<TransformNode>;
        getSoundByName(name: string): Nullable<Sound>;
        getLastSkeletonByID(id: string): Nullable<Skeleton>;
        getSkeletonById(id: string): Nullable<Skeleton>;
        getSkeletonByName(name: string): Nullable<Skeleton>;
        getMorphTargetManagerById(id: number): Nullable<MorphTargetManager>;
        isActiveMesh(mesh: AbstractMesh): boolean;
        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @return The highlight layer if found otherwise null.
         */
        getHighlightLayerByName(name: string): Nullable<HighlightLayer>;
        /**
         * Return a unique id as a string which can serve as an identifier for the scene
         */
        readonly uid: string;
        /**
         * Add an externaly attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        addExternalData<T>(key: string, data: T): boolean;
        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        getExternalData<T>(key: string): Nullable<T>;
        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T;
        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        removeExternalData(key: string): boolean;
        private _evaluateSubMesh(subMesh, mesh);
        _isInIntermediateRendering(): boolean;
        private _activeMeshCandidateProvider;
        setActiveMeshCandidateProvider(provider: IActiveMeshCandidateProvider): void;
        getActiveMeshCandidateProvider(): IActiveMeshCandidateProvider;
        private _activeMeshesFrozen;
        /**
         * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
         */
        freezeActiveMeshes(): Scene;
        /**
         * Use this function to restart evaluating active meshes on every frame
         */
        unfreezeActiveMeshes(): this;
        private _evaluateActiveMeshes();
        private _activeMesh(sourceMesh, mesh);
        updateTransformMatrix(force?: boolean): void;
        updateAlternateTransformMatrix(alternateCamera: Camera): void;
        private _renderForCamera(camera);
        private _processSubCameras(camera);
        private _checkIntersections();
        render(): void;
        private _updateAudioParameters();
        audioEnabled: boolean;
        private _disableAudio();
        private _enableAudio();
        headphone: boolean;
        private _switchAudioModeForHeadphones();
        private _switchAudioModeForNormalSpeakers();
        enableDepthRenderer(): DepthRenderer;
        disableDepthRenderer(): void;
        enableGeometryBufferRenderer(ratio?: number): Nullable<GeometryBufferRenderer>;
        disableGeometryBufferRenderer(): void;
        freezeMaterials(): void;
        unfreezeMaterials(): void;
        dispose(): void;
        readonly isDisposed: boolean;
        disposeSounds(): void;
        getWorldExtends(): {
            min: Vector3;
            max: Vector3;
        };
        createOrUpdateSelectionOctree(maxCapacity?: number, maxDepth?: number): Octree<AbstractMesh>;
        createPickingRay(x: number, y: number, world: Matrix, camera: Nullable<Camera>, cameraViewSpace?: boolean): Ray;
        createPickingRayToRef(x: number, y: number, world: Matrix, result: Ray, camera: Nullable<Camera>, cameraViewSpace?: boolean): Scene;
        createPickingRayInCameraSpace(x: number, y: number, camera?: Camera): Ray;
        createPickingRayInCameraSpaceToRef(x: number, y: number, result: Ray, camera?: Camera): Scene;
        private _internalPick(rayFunction, predicate?, fastCheck?);
        private _internalMultiPick(rayFunction, predicate?);
        private _internalPickSprites(ray, predicate?, fastCheck?, camera?);
        private _tempPickingRay;
        /** Launch a ray to try to pick a mesh in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean, camera?: Nullable<Camera>): Nullable<PickingInfo>;
        /** Launch a ray to try to pick a sprite in the scene
         * @param x position on screen
         * @param y position on screen
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): Nullable<PickingInfo>;
        private _cachedRayForTransform;
        /** Use the given ray to pick a mesh in the scene
         * @param ray The ray to use to pick meshes
         * @param predicate Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true
         * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
         */
        pickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): Nullable<PickingInfo>;
        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param x X position on screen
         * @param y Y position on screen
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
         */
        multiPick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, camera?: Camera): Nullable<PickingInfo[]>;
        /**
         * Launch a ray to try to pick a mesh in the scene
         * @param ray Ray to use
         * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
         */
        multiPickWithRay(ray: Ray, predicate: (mesh: AbstractMesh) => boolean): Nullable<PickingInfo[]>;
        setPointerOverMesh(mesh: Nullable<AbstractMesh>): void;
        getPointerOverMesh(): Nullable<AbstractMesh>;
        setPointerOverSprite(sprite: Nullable<Sprite>): void;
        getPointerOverSprite(): Nullable<Sprite>;
        getPhysicsEngine(): Nullable<PhysicsEngine>;
        /**
         * Enables physics to the current scene
         * @param {BABYLON.Vector3} [gravity] - the scene's gravity for the physics engine
         * @param {BABYLON.IPhysicsEnginePlugin} [plugin] - The physics engine to be used. defaults to OimoJS.
         * @return {boolean} was the physics engine initialized
         */
        enablePhysics(gravity?: Nullable<Vector3>, plugin?: IPhysicsEnginePlugin): boolean;
        disablePhysicsEngine(): void;
        isPhysicsEnabled(): boolean;
        deleteCompoundImpostor(compound: any): void;
        _rebuildGeometries(): void;
        _rebuildTextures(): void;
        createDefaultCameraOrLight(createArcRotateCamera?: boolean, replace?: boolean, attachCameraControls?: boolean): void;
        createDefaultSkybox(environmentTexture?: BaseTexture, pbr?: boolean, scale?: number, blur?: number): Nullable<Mesh>;
        createDefaultEnvironment(options: Partial<IEnvironmentHelperOptions>): Nullable<EnvironmentHelper>;
        createDefaultVRExperience(webVROptions?: VRExperienceHelperOptions): VRExperienceHelper;
        private _getByTags(list, tagsQuery, forEach?);
        getMeshesByTags(tagsQuery: string, forEach?: (mesh: AbstractMesh) => void): Mesh[];
        getCamerasByTags(tagsQuery: string, forEach?: (camera: Camera) => void): Camera[];
        getLightsByTags(tagsQuery: string, forEach?: (light: Light) => void): Light[];
        getMaterialByTags(tagsQuery: string, forEach?: (material: Material) => void): Material[];
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        setRenderingOrder(renderingGroupId: number, opaqueSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, alphaTestSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>, transparentSortCompareFn?: Nullable<(a: SubMesh, b: SubMesh) => number>): void;
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         * @param depth Automatically clears depth between groups if true and autoClear is true.
         * @param stencil Automatically clears stencil between groups if true and autoClear is true.
         */
        setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean, depth?: boolean, stencil?: boolean): void;
        /**
         * Will flag all materials as dirty to trigger new shader compilation
         * @param predicate If not null, it will be used to specifiy if a material has to be marked as dirty
         */
        markAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void;
        _loadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void, useDatabase?: boolean, useArrayBuffer?: boolean, onError?: (request?: XMLHttpRequest, exception?: any) => void): IFileRequest;
    }
}

declare module 'babylonjs/core' {
    class Buffer {
        private _engine;
        private _buffer;
        private _data;
        private _updatable;
        private _strideSize;
        private _instanced;
        private _instanceDivisor;
        constructor(engine: any, data: FloatArray, updatable: boolean, stride: number, postponeInternalCreation?: boolean, instanced?: boolean);
        createVertexBuffer(kind: string, offset: number, size: number, stride?: number): VertexBuffer;
        isUpdatable(): boolean;
        getData(): Nullable<FloatArray>;
        getBuffer(): Nullable<WebGLBuffer>;
        getStrideSize(): number;
        getIsInstanced(): boolean;
        instanceDivisor: number;
        create(data?: Nullable<FloatArray>): void;
        _rebuild(): void;
        update(data: FloatArray): void;
        updateDirectly(data: Float32Array, offset: number, vertexCount?: number): void;
        dispose(): void;
    }
}

declare module 'babylonjs/core' {
    class VertexBuffer {
        private _buffer;
        private _kind;
        private _offset;
        private _size;
        private _stride;
        private _ownsBuffer;
        constructor(engine: any, data: FloatArray | Buffer, kind: string, updatable: boolean, postponeInternalCreation?: boolean, stride?: number, instanced?: boolean, offset?: number, size?: number);
        _rebuild(): void;
        /**
         * Returns the kind of the VertexBuffer (string).
         */
        getKind(): string;
        /**
         * Boolean : is the VertexBuffer updatable ?
         */
        isUpdatable(): boolean;
        /**
         * Returns an array of numbers or a Float32Array containing the VertexBuffer data.
         */
        getData(): Nullable<FloatArray>;
        /**
         * Returns the WebGLBuffer associated to the VertexBuffer.
         */
        getBuffer(): Nullable<WebGLBuffer>;
        /**
         * Returns the stride of the VertexBuffer (integer).
         */
        getStrideSize(): number;
        /**
         * Returns the offset (integer).
         */
        getOffset(): number;
        /**
         * Returns the VertexBuffer total size (integer).
         */
        getSize(): number;
        /**
         * Boolean : is the WebGLBuffer of the VertexBuffer instanced now ?
         */
        getIsInstanced(): boolean;
        /**
         * Returns the instancing divisor, zero for non-instanced (integer).
         */
        getInstanceDivisor(): number;
        /**
         * Creates the underlying WebGLBuffer from the passed numeric array or Float32Array.
         * Returns the created WebGLBuffer.
         */
        create(data?: FloatArray): void;
        /**
         * Updates the underlying WebGLBuffer according to the passed numeric array or Float32Array.
         * Returns the updated WebGLBuffer.
         */
        update(data: FloatArray): void;
        /**
         * Updates directly the underlying WebGLBuffer according to the passed numeric array or Float32Array.
         * Returns the directly updated WebGLBuffer.
         */
        updateDirectly(data: Float32Array, offset: number): void;
        /**
         * Disposes the VertexBuffer and the underlying WebGLBuffer.
         */
        dispose(): void;
        private static _PositionKind;
        private static _NormalKind;
        private static _TangentKind;
        private static _UVKind;
        private static _UV2Kind;
        private static _UV3Kind;
        private static _UV4Kind;
        private static _UV5Kind;
        private static _UV6Kind;
        private static _ColorKind;
        private static _MatricesIndicesKind;
        private static _MatricesWeightsKind;
        private static _MatricesIndicesExtraKind;
        private static _MatricesWeightsExtraKind;
        static readonly PositionKind: string;
        static readonly NormalKind: string;
        static readonly TangentKind: string;
        static readonly UVKind: string;
        static readonly UV2Kind: string;
        static readonly UV3Kind: string;
        static readonly UV4Kind: string;
        static readonly UV5Kind: string;
        static readonly UV6Kind: string;
        static readonly ColorKind: string;
        static readonly MatricesIndicesKind: string;
        static readonly MatricesWeightsKind: string;
        static readonly MatricesIndicesExtraKind: string;
        static readonly MatricesWeightsExtraKind: string;
    }
}

declare module 'babylonjs/core' {
    class InternalTexture {
        static DATASOURCE_UNKNOWN: number;
        static DATASOURCE_URL: number;
        static DATASOURCE_TEMP: number;
        static DATASOURCE_RAW: number;
        static DATASOURCE_DYNAMIC: number;
        static DATASOURCE_RENDERTARGET: number;
        static DATASOURCE_MULTIRENDERTARGET: number;
        static DATASOURCE_CUBE: number;
        static DATASOURCE_CUBERAW: number;
        static DATASOURCE_CUBEPREFILTERED: number;
        static DATASOURCE_RAW3D: number;
        isReady: boolean;
        isCube: boolean;
        is3D: boolean;
        url: string;
        samplingMode: number;
        generateMipMaps: boolean;
        samples: number;
        type: number;
        format: number;
        onLoadedObservable: Observable<InternalTexture>;
        width: number;
        height: number;
        depth: number;
        baseWidth: number;
        baseHeight: number;
        baseDepth: number;
        invertY: boolean;
        _initialSlot: number;
        _designatedSlot: number;
        _dataSource: number;
        _buffer: Nullable<ArrayBuffer | HTMLImageElement>;
        _bufferView: Nullable<ArrayBufferView>;
        _bufferViewArray: Nullable<ArrayBufferView[]>;
        _size: number;
        _extension: string;
        _files: Nullable<string[]>;
        _workingCanvas: HTMLCanvasElement;
        _workingContext: CanvasRenderingContext2D;
        _framebuffer: Nullable<WebGLFramebuffer>;
        _depthStencilBuffer: Nullable<WebGLRenderbuffer>;
        _MSAAFramebuffer: Nullable<WebGLFramebuffer>;
        _MSAARenderBuffer: Nullable<WebGLRenderbuffer>;
        _attachments: Nullable<number[]>;
        _cachedCoordinatesMode: Nullable<number>;
        _cachedWrapU: Nullable<number>;
        _cachedWrapV: Nullable<number>;
        _cachedWrapR: Nullable<number>;
        _cachedAnisotropicFilteringLevel: Nullable<number>;
        _isDisabled: boolean;
        _compression: Nullable<string>;
        _generateStencilBuffer: boolean;
        _generateDepthBuffer: boolean;
        _sphericalPolynomial: Nullable<SphericalPolynomial>;
        _lodGenerationScale: number;
        _lodGenerationOffset: number;
        _lodTextureHigh: BaseTexture;
        _lodTextureMid: BaseTexture;
        _lodTextureLow: BaseTexture;
        _webGLTexture: Nullable<WebGLTexture>;
        _references: number;
        private _engine;
        readonly dataSource: number;
        constructor(engine: Engine, dataSource: number);
        incrementReferences(): void;
        updateSize(width: int, height: int, depth?: int): void;
        _rebuild(): void;
        private _swapAndDie(target);
        dispose(): void;
    }
}

declare module 'babylonjs/core' {
    class BaseTexture {
        static DEFAULT_ANISOTROPIC_FILTERING_LEVEL: number;
        name: string;
        private _hasAlpha;
        hasAlpha: boolean;
        getAlphaFromRGB: boolean;
        level: number;
        coordinatesIndex: number;
        private _coordinatesMode;
        coordinatesMode: number;
        wrapU: number;
        wrapV: number;
        wrapR: number;
        anisotropicFilteringLevel: number;
        isCube: boolean;
        is3D: boolean;
        gammaSpace: boolean;
        invertZ: boolean;
        lodLevelInAlpha: boolean;
        lodGenerationOffset: number;
        lodGenerationScale: number;
        isRenderTarget: boolean;
        readonly uid: string;
        toString(): string;
        getClassName(): string;
        animations: Animation[];
        /**
        * An event triggered when the texture is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<BaseTexture>;
        private _onDisposeObserver;
        onDispose: () => void;
        delayLoadState: number;
        private _scene;
        _texture: Nullable<InternalTexture>;
        private _uid;
        readonly isBlocking: boolean;
        constructor(scene: Nullable<Scene>);
        getScene(): Nullable<Scene>;
        getTextureMatrix(): Matrix;
        getReflectionTextureMatrix(): Matrix;
        getInternalTexture(): Nullable<InternalTexture>;
        isReadyOrNotBlocking(): boolean;
        isReady(): boolean;
        getSize(): ISize;
        getBaseSize(): ISize;
        scale(ratio: number): void;
        readonly canRescale: boolean;
        _getFromCache(url: Nullable<string>, noMipmap: boolean, sampling?: number): Nullable<InternalTexture>;
        _rebuild(): void;
        delayLoad(): void;
        clone(): Nullable<BaseTexture>;
        readonly textureType: number;
        readonly textureFormat: number;
        readPixels(faceIndex?: number): Nullable<ArrayBufferView>;
        releaseInternalTexture(): void;
        sphericalPolynomial: Nullable<SphericalPolynomial>;
        readonly _lodTextureHigh: Nullable<BaseTexture>;
        readonly _lodTextureMid: Nullable<BaseTexture>;
        readonly _lodTextureLow: Nullable<BaseTexture>;
        dispose(): void;
        serialize(): any;
        static WhenAllReady(textures: BaseTexture[], callback: () => void): void;
    }
}

declare module 'babylonjs/core' {
    class Texture extends BaseTexture {
        static NEAREST_SAMPLINGMODE: number;
        static NEAREST_NEAREST_MIPLINEAR: number;
        static BILINEAR_SAMPLINGMODE: number;
        static LINEAR_LINEAR_MIPNEAREST: number;
        static TRILINEAR_SAMPLINGMODE: number;
        static LINEAR_LINEAR_MIPLINEAR: number;
        static NEAREST_NEAREST_MIPNEAREST: number;
        static NEAREST_LINEAR_MIPNEAREST: number;
        static NEAREST_LINEAR_MIPLINEAR: number;
        static NEAREST_LINEAR: number;
        static NEAREST_NEAREST: number;
        static LINEAR_NEAREST_MIPNEAREST: number;
        static LINEAR_NEAREST_MIPLINEAR: number;
        static LINEAR_LINEAR: number;
        static LINEAR_NEAREST: number;
        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;
        static SKYBOX_MODE: number;
        static INVCUBIC_MODE: number;
        static EQUIRECTANGULAR_MODE: number;
        static FIXED_EQUIRECTANGULAR_MODE: number;
        static FIXED_EQUIRECTANGULAR_MIRRORED_MODE: number;
        static CLAMP_ADDRESSMODE: number;
        static WRAP_ADDRESSMODE: number;
        static MIRROR_ADDRESSMODE: number;
        url: Nullable<string>;
        uOffset: number;
        vOffset: number;
        uScale: number;
        vScale: number;
        uAng: number;
        vAng: number;
        wAng: number;
        readonly noMipmap: boolean;
        private _noMipmap;
        _invertY: boolean;
        private _rowGenerationMatrix;
        private _cachedTextureMatrix;
        private _projectionModeMatrix;
        private _t0;
        private _t1;
        private _t2;
        private _cachedUOffset;
        private _cachedVOffset;
        private _cachedUScale;
        private _cachedVScale;
        private _cachedUAng;
        private _cachedVAng;
        private _cachedWAng;
        private _cachedProjectionMatrixId;
        private _cachedCoordinatesMode;
        _samplingMode: number;
        private _buffer;
        private _deleteBuffer;
        protected _format: Nullable<number>;
        private _delayedOnLoad;
        private _delayedOnError;
        private _onLoadObservable;
        protected _isBlocking: boolean;
        isBlocking: boolean;
        readonly samplingMode: number;
        constructor(url: Nullable<string>, scene: Nullable<Scene>, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, buffer?: any, deleteBuffer?: boolean, format?: number);
        updateURL(url: string): void;
        delayLoad(): void;
        updateSamplingMode(samplingMode: number): void;
        private _prepareRowForTextureGeneration(x, y, z, t);
        getTextureMatrix(): Matrix;
        getReflectionTextureMatrix(): Matrix;
        clone(): Texture;
        readonly onLoadObservable: Observable<Texture>;
        serialize(): any;
        getClassName(): string;
        dispose(): void;
        static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<() => void>, format?: number): Texture;
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<BaseTexture>;
        static LoadFromDataString(name: string, buffer: any, scene: Scene, deleteBuffer?: boolean, noMipmap?: boolean, invertY?: boolean, samplingMode?: number, onLoad?: Nullable<() => void>, onError?: Nullable<(message?: string, exception?: any) => void>, format?: number): Texture;
    }
}

declare module 'babylonjs/core' {
    class _InstancesBatch {
        mustReturn: boolean;
        visibleInstances: Nullable<InstancedMesh[]>[];
        renderSelf: boolean[];
    }
    class Mesh extends AbstractMesh implements IGetSetVerticesData {
        static _FRONTSIDE: number;
        static _BACKSIDE: number;
        static _DOUBLESIDE: number;
        static _DEFAULTSIDE: number;
        static _NO_CAP: number;
        static _CAP_START: number;
        static _CAP_END: number;
        static _CAP_ALL: number;
        /**
         * Mesh side orientation : usually the external or front surface
         */
        static readonly FRONTSIDE: number;
        /**
         * Mesh side orientation : usually the internal or back surface
         */
        static readonly BACKSIDE: number;
        /**
         * Mesh side orientation : both internal and external or front and back surfaces
         */
        static readonly DOUBLESIDE: number;
        /**
         * Mesh side orientation : by default, `FRONTSIDE`
         */
        static readonly DEFAULTSIDE: number;
        /**
         * Mesh cap setting : no cap
         */
        static readonly NO_CAP: number;
        /**
         * Mesh cap setting : one cap at the beginning of the mesh
         */
        static readonly CAP_START: number;
        /**
         * Mesh cap setting : one cap at the end of the mesh
         */
        static readonly CAP_END: number;
        /**
         * Mesh cap setting : two caps, one at the beginning  and one at the end of the mesh
         */
        static readonly CAP_ALL: number;
        /**
         * An event triggered before rendering the mesh
         * @type {BABYLON.Observable}
         */
        onBeforeRenderObservable: Observable<Mesh>;
        /**
        * An event triggered after rendering the mesh
        * @type {BABYLON.Observable}
        */
        onAfterRenderObservable: Observable<Mesh>;
        /**
        * An event triggered before drawing the mesh
        * @type {BABYLON.Observable}
        */
        onBeforeDrawObservable: Observable<Mesh>;
        private _onBeforeDrawObserver;
        onBeforeDraw: () => void;
        delayLoadState: number;
        instances: InstancedMesh[];
        delayLoadingFile: string;
        _binaryInfo: any;
        private _LODLevels;
        onLODLevelSelection: (distance: number, mesh: Mesh, selectedLevel: Mesh) => void;
        private _morphTargetManager;
        morphTargetManager: Nullable<MorphTargetManager>;
        _geometry: Nullable<Geometry>;
        _delayInfo: Array<string>;
        _delayLoadingFunction: (any: any, mesh: Mesh) => void;
        _visibleInstances: any;
        private _renderIdForInstances;
        private _batchCache;
        private _instancesBufferSize;
        private _instancesBuffer;
        private _instancesData;
        private _overridenInstanceCount;
        private _effectiveMaterial;
        _shouldGenerateFlatShading: boolean;
        private _preActivateId;
        _originalBuilderSideOrientation: number;
        overrideMaterialSideOrientation: Nullable<number>;
        private _areNormalsFrozen;
        private _sourcePositions;
        private _sourceNormals;
        private _source;
        readonly source: Nullable<Mesh>;
        isUnIndexed: boolean;
        /**
         * @constructor
         * @param {string} name The value used by scene.getMeshByName() to do a lookup.
         * @param {Scene} scene The scene to add this mesh to.
         * @param {Node} parent The parent of this mesh, if it has one
         * @param {Mesh} source An optional Mesh from which geometry is shared, cloned.
         * @param {boolean} doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
         *                  When false, achieved by calling a clone(), also passing False.
         *                  This will make creation of children, recursive.
         * @param {boolean} clonePhysicsImpostor When cloning, include cloning mesh physics impostor, default True.
         */
        constructor(name: string, scene?: Nullable<Scene>, parent?: Nullable<Node>, source?: Nullable<Mesh>, doNotCloneChildren?: boolean, clonePhysicsImpostor?: boolean);
        /**
         * Returns the string "Mesh".
         */
        getClassName(): string;
        /**
         * Returns a string.
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        toString(fullDetails?: boolean): string;
        /**
         * True if the mesh has some Levels Of Details (LOD).
         * Returns a boolean.
         */
        readonly hasLODLevels: boolean;
        private _sortLODLevels();
        /**
         * Add a mesh as LOD level triggered at the given distance.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * @param {number} distance The distance from the center of the object to show this level
         * @param {Mesh} mesh The mesh to be added as LOD level
         * @return {Mesh} This mesh (for chaining)
         */
        addLODLevel(distance: number, mesh: Mesh): Mesh;
        /**
         * Returns the LOD level mesh at the passed distance or null if not found.
         * It is related to the method `addLODLevel(distance, mesh)`.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * Returns an object Mesh or `null`.
         */
        getLODLevelAtDistance(distance: number): Nullable<Mesh>;
        /**
         * Remove a mesh from the LOD array
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * @param {Mesh} mesh The mesh to be removed.
         * @return {Mesh} This mesh (for chaining)
         */
        removeLODLevel(mesh: Mesh): Mesh;
        /**
         * Returns the registered LOD mesh distant from the parameter `camera` position if any, else returns the current mesh.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         */
        getLOD(camera: Camera, boundingSphere?: BoundingSphere): AbstractMesh;
        /**
         * Returns the mesh internal Geometry object.
         */
        readonly geometry: Nullable<Geometry>;
        /**
         * Returns a positive integer : the total number of vertices within the mesh geometry or zero if the mesh has no geometry.
         */
        getTotalVertices(): number;
        /**
         * Returns an array of integers or floats, or a Float32Array, depending on the requested `kind` (positions, indices, normals, etc).
         * If `copywhenShared` is true (default false) and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * You can force the copy with forceCopy === true
         * Returns null if the mesh has no geometry or no vertex buffer.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        /**
         * Returns the mesh VertexBuffer object from the requested `kind` : positions, indices, normals, etc.
         * Returns `null` if the mesh has no geometry.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        getVertexBuffer(kind: string): Nullable<VertexBuffer>;
        /**
         * Returns a boolean depending on the existence of the Vertex Data for the requested `kind`.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        isVerticesDataPresent(kind: string): boolean;
        /**
         * Returns a boolean defining if the vertex data for the requested `kind` is updatable.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        isVertexBufferUpdatable(kind: string): boolean;
        /**
         * Returns a string : the list of existing `kinds` of Vertex Data for this mesh.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        getVerticesDataKinds(): string[];
        /**
         * Returns a positive integer : the total number of indices in this mesh geometry.
         * Returns zero if the mesh has no geometry.
         */
        getTotalIndices(): number;
        /**
         * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
         * If the parameter `copyWhenShared` is true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * Returns an empty array if the mesh has no geometry.
         */
        getIndices(copyWhenShared?: boolean): Nullable<IndicesArray>;
        readonly isBlocked: boolean;
        /**
         * Boolean : true once the mesh is ready after all the delayed process (loading, etc) are complete.
         */
        isReady(): boolean;
        /**
         * Boolean : true if the normals aren't to be recomputed on next mesh `positions` array update.
         * This property is pertinent only for updatable parametric shapes.
         */
        readonly areNormalsFrozen: boolean;
        /**
         * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc.
         * It has no effect at all on other shapes.
         * It prevents the mesh normals from being recomputed on next `positions` array update.
         * Returns the Mesh.
         */
        freezeNormals(): Mesh;
        /**
         * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc.
         * It has no effect at all on other shapes.
         * It reactivates the mesh normals computation if it was previously frozen.
         * Returns the Mesh.
         */
        unfreezeNormals(): Mesh;
        /**
         * Overrides instance count. Only applicable when custom instanced InterleavedVertexBuffer are used rather than InstancedMeshs
         */
        overridenInstanceCount: number;
        _preActivate(): Mesh;
        _preActivateForIntermediateRendering(renderId: number): Mesh;
        _registerInstanceForRenderId(instance: InstancedMesh, renderId: number): Mesh;
        /**
         * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
         * This means the mesh underlying bounding box and sphere are recomputed.
         * Returns the Mesh.
         */
        refreshBoundingInfo(): Mesh;
        _refreshBoundingInfo(applySkeleton: boolean): Mesh;
        private _getPositionData(applySkeleton);
        _createGlobalSubMesh(force: boolean): Nullable<SubMesh>;
        subdivide(count: number): void;
        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
         * The `data` are either a numeric array either a Float32Array.
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater.
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
         * Note that a new underlying VertexBuffer object is created each call.
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): Mesh;
        markVerticesDataAsUpdatable(kind: string, updatable?: boolean): void;
        /**
         * Sets the mesh VertexBuffer.
         * Returns the Mesh.
         */
        setVerticesBuffer(buffer: VertexBuffer): Mesh;
        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.
         * The `data` are either a numeric array either a Float32Array.
         * No new underlying VertexBuffer object is created.
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         *
         * Returns the Mesh.
         */
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh;
        /**
         * This method updates the vertex positions of an updatable mesh according to the `positionFunction` returned values.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#other-shapes-updatemeshpositions
         * The parameter `positionFunction` is a simple JS function what is passed the mesh `positions` array. It doesn't need to return anything.
         * The parameter `computeNormals` is a boolean (default true) to enable/disable the mesh normal recomputation after the vertex position update.
         * Returns the Mesh.
         */
        updateMeshPositions(positionFunction: (data: FloatArray) => void, computeNormals?: boolean): Mesh;
        /**
         * Creates a un-shared specific occurence of the geometry for the mesh.
         * Returns the Mesh.
         */
        makeGeometryUnique(): Mesh;
        /**
         * Sets the mesh indices.
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * Type is Uint16Array by default unless the mesh has more than 65536 vertices.
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
         * This method creates a new index buffer each call.
         * Returns the Mesh.
         */
        setIndices(indices: IndicesArray, totalVertices?: Nullable<number>, updatable?: boolean): Mesh;
        /**
         * Update the current index buffer
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array)
         * Returns the Mesh.
         */
        updateIndices(indices: IndicesArray, offset?: number): Mesh;
        /**
         * Invert the geometry to move from a right handed system to a left handed one.
         * Returns the Mesh.
         */
        toLeftHanded(): Mesh;
        _bind(subMesh: SubMesh, effect: Effect, fillMode: number): Mesh;
        _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number, alternate?: boolean): Mesh;
        /**
         * Registers for this mesh a javascript function called just before the rendering process.
         * This function is passed the current mesh.
         * Return the Mesh.
         */
        registerBeforeRender(func: (mesh: AbstractMesh) => void): Mesh;
        /**
         * Disposes a previously registered javascript function called before the rendering.
         * This function is passed the current mesh.
         * Returns the Mesh.
         */
        unregisterBeforeRender(func: (mesh: AbstractMesh) => void): Mesh;
        /**
         * Registers for this mesh a javascript function called just after the rendering is complete.
         * This function is passed the current mesh.
         * Returns the Mesh.
         */
        registerAfterRender(func: (mesh: AbstractMesh) => void): Mesh;
        /**
         * Disposes a previously registered javascript function called after the rendering.
         * This function is passed the current mesh.
         * Return the Mesh.
         */
        unregisterAfterRender(func: (mesh: AbstractMesh) => void): Mesh;
        _getInstancesRenderList(subMeshId: number): _InstancesBatch;
        _renderWithInstances(subMesh: SubMesh, fillMode: number, batch: _InstancesBatch, effect: Effect, engine: Engine): Mesh;
        _processRendering(subMesh: SubMesh, effect: Effect, fillMode: number, batch: _InstancesBatch, hardwareInstancedRendering: boolean, onBeforeDraw: (isInstance: boolean, world: Matrix, effectiveMaterial?: Material) => void, effectiveMaterial?: Material): Mesh;
        /**
         * Triggers the draw call for the mesh.
         * Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager.
         * Returns the Mesh.
         */
        render(subMesh: SubMesh, enableAlphaMode: boolean): Mesh;
        private _onBeforeDraw(isInstance, world, effectiveMaterial?);
        /**
         * Returns an array populated with ParticleSystem objects whose the mesh is the emitter.
         */
        getEmittedParticleSystems(): IParticleSystem[];
        /**
         * Returns an array populated with ParticleSystem objects whose the mesh or its children are the emitter.
         */
        getHierarchyEmittedParticleSystems(): IParticleSystem[];
        _checkDelayState(): Mesh;
        private _queueLoad(scene);
        /**
         * Boolean, true is the mesh in the frustum defined by the Plane objects from the `frustumPlanes` array parameter.
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Sets the mesh material by the material or multiMaterial `id` property.
         * The material `id` is a string identifying the material or the multiMaterial.
         * This method returns the Mesh.
         */
        setMaterialByID(id: string): Mesh;
        /**
         * Returns as a new array populated with the mesh material and/or skeleton, if any.
         */
        getAnimatables(): IAnimatable[];
        /**
         * Modifies the mesh geometry according to the passed transformation matrix.
         * This method returns nothing but it really modifies the mesh even if it's originally not set as updatable.
         * The mesh normals are modified accordingly the same transformation.
         * tuto : http://doc.babylonjs.com/tutorials/How_Rotations_and_Translations_Work#baking-transform
         * Note that, under the hood, this method sets a new VertexBuffer each call.
         * Returns the Mesh.
         */
        bakeTransformIntoVertices(transform: Matrix): Mesh;
        /**
         * Modifies the mesh geometry according to its own current World Matrix.
         * The mesh World Matrix is then reset.
         * This method returns nothing but really modifies the mesh even if it's originally not set as updatable.
         * tuto : tuto : http://doc.babylonjs.com/resources/baking_transformations
         * Note that, under the hood, this method sets a new VertexBuffer each call.
         * Returns the Mesh.
         */
        bakeCurrentTransformIntoVertices(): Mesh;
        readonly _positions: Nullable<Vector3[]>;
        _resetPointsArrayCache(): Mesh;
        _generatePointsArray(): boolean;
        /**
         * Returns a new Mesh object generated from the current mesh properties.
         * This method must not get confused with createInstance().
         * The parameter `name` is a string, the name given to the new mesh.
         * The optional parameter `newParent` can be any Node object (default `null`).
         * The optional parameter `doNotCloneChildren` (default `false`) allows/denies the recursive cloning of the original mesh children if any.
         * The parameter `clonePhysicsImpostor` (default `true`)  allows/denies the cloning in the same time of the original mesh `body` used by the physics engine, if any.
         */
        clone(name: string, newParent?: Node, doNotCloneChildren?: boolean, clonePhysicsImpostor?: boolean): Mesh;
        /**
         * Disposes the Mesh.
         * By default, all the mesh children are also disposed unless the parameter `doNotRecurse` is set to `true`.
         * Returns nothing.
         */
        dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void;
        /**
         * Modifies the mesh geometry according to a displacement map.
         * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
         * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
         * This method returns nothing.
         * The parameter `url` is a string, the URL from the image file is to be downloaded.
         * The parameters `minHeight` and `maxHeight` are the lower and upper limits of the displacement.
         * The parameter `onSuccess` is an optional Javascript function to be called just after the mesh is modified. It is passed the modified mesh and must return nothing.
         * The parameter `uvOffset` is an optional vector2 used to offset UV.
         * The parameter `uvScale` is an optional vector2 used to scale UV.
         *
         * Returns the Mesh.
         */
        applyDisplacementMap(url: string, minHeight: number, maxHeight: number, onSuccess?: (mesh: Mesh) => void, uvOffset?: Vector2, uvScale?: Vector2): Mesh;
        /**
         * Modifies the mesh geometry according to a displacementMap buffer.
         * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
         * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
         * This method returns nothing.
         * The parameter `buffer` is a `Uint8Array` buffer containing series of `Uint8` lower than 255, the red, green, blue and alpha values of each successive pixel.
         * The parameters `heightMapWidth` and `heightMapHeight` are positive integers to set the width and height of the buffer image.
         * The parameters `minHeight` and `maxHeight` are the lower and upper limits of the displacement.
         * The parameter `uvOffset` is an optional vector2 used to offset UV.
         * The parameter `uvScale` is an optional vector2 used to scale UV.
         *
         * Returns the Mesh.
         */
        applyDisplacementMapFromBuffer(buffer: Uint8Array, heightMapWidth: number, heightMapHeight: number, minHeight: number, maxHeight: number, uvOffset?: Vector2, uvScale?: Vector2): Mesh;
        /**
         * Modify the mesh to get a flat shading rendering.
         * This means each mesh facet will then have its own normals. Usually new vertices are added in the mesh geometry to get this result.
         * This method returns the Mesh.
         * Warning : the mesh is really modified even if not set originally as updatable and, under the hood, a new VertexBuffer is allocated.
         */
        convertToFlatShadedMesh(): Mesh;
        /**
         * This method removes all the mesh indices and add new vertices (duplication) in order to unfold facets into buffers.
         * In other words, more vertices, no more indices and a single bigger VBO.
         * The mesh is really modified even if not set originally as updatable. Under the hood, a new VertexBuffer is allocated.
         * Returns the Mesh.
         */
        convertToUnIndexedMesh(): Mesh;
        /**
         * Inverses facet orientations and inverts also the normals with `flipNormals` (default `false`) if true.
         * This method returns the Mesh.
         * Warning : the mesh is really modified even if not set originally as updatable. A new VertexBuffer is created under the hood each call.
         */
        flipFaces(flipNormals?: boolean): Mesh;
        /**
         * Creates a new InstancedMesh object from the mesh model.
         * An instance shares the same properties and the same material than its model.
         * Only these properties of each instance can then be set individually :
         * - position
         * - rotation
         * - rotationQuaternion
         * - setPivotMatrix
         * - scaling
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_Instances
         * Warning : this method is not supported for Line mesh and LineSystem
         */
        createInstance(name: string): InstancedMesh;
        /**
         * Synchronises all the mesh instance submeshes to the current mesh submeshes, if any.
         * After this call, all the mesh instances have the same submeshes than the current mesh.
         * This method returns the Mesh.
         */
        synchronizeInstances(): Mesh;
        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async. It returns the Mesh.
         * @param settings a collection of simplification settings.
         * @param parallelProcessing should all levels calculate parallel or one after the other.
         * @param type the type of simplification to run.
         * @param successCallback optional success callback to be called after the simplification finished processing all settings.
         */
        simplify(settings: Array<ISimplificationSettings>, parallelProcessing?: boolean, simplificationType?: SimplificationType, successCallback?: (mesh?: Mesh, submeshIndex?: number) => void): Mesh;
        /**
         * Optimization of the mesh's indices, in case a mesh has duplicated vertices.
         * The function will only reorder the indices and will not remove unused vertices to avoid problems with submeshes.
         * This should be used together with the simplification to avoid disappearing triangles.
         * Returns the Mesh.
         * @param successCallback an optional success callback to be called after the optimization finished.
         */
        optimizeIndices(successCallback?: (mesh?: Mesh) => void): Mesh;
        serialize(serializationObject: any): void;
        _syncGeometryWithMorphTargetManager(): void;
        /**
         * Returns a new Mesh object parsed from the source provided.
         * The parameter `parsedMesh` is the source.
         * The parameter `rootUrl` is a string, it's the root URL to prefix the `delayLoadingFile` property with
         */
        static Parse(parsedMesh: any, scene: Scene, rootUrl: string): Mesh;
        /**
         * Creates a ribbon mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The ribbon is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         *
         * Please read this full tutorial to understand how to design a ribbon : http://doc.babylonjs.com/tutorials/Ribbon_Tutorial
         * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.
         * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array.
         * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array.
         * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path.
         * It's the offset to join together the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11.
         * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#ribbon
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateRibbon(name: string, pathArray: Vector3[][], closeArray: boolean | undefined, closePath: boolean, offset: number, scene?: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates a plane polygonal mesh.  By default, this is a disc.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `radius` sets the radius size (float) of the polygon (default 0.5).
         * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateDisc(name: string, radius: number, tessellation: number, scene?: Nullable<Scene>, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a box mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `size` sets the size (float) of each box side (default 1).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateBox(name: string, size: number, scene?: Nullable<Scene>, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a sphere mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `diameter` sets the diameter size (float) of the sphere (default 1).
         * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateSphere(name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a cylinder or a cone mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).
         * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).
         * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.
         * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
         * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: any, scene?: Scene, updatable?: any, sideOrientation?: number): Mesh;
        /**
         * Creates a torus mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `diameter` sets the diameter size (float) of the torus (default 1).
         * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5).
         * The parameter `tessellation` sets the number of torus sides (postive integer, default 16).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a torus knot mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `radius` sets the global radius size (float) of the torus knot (default 2).
         * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32).
         * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32).
         * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a line mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.
         * The parameter `points` is an array successive Vector3.
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * When updating an instance, remember that only point positions can change, not the number of points.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLines(name: string, points: Vector3[], scene?: Nullable<Scene>, updatable?: boolean, instance?: Nullable<LinesMesh>): LinesMesh;
        /**
         * Creates a dashed line mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.
         * The parameter `points` is an array successive Vector3.
         * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200).
         * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3).
         * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1).
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines
         * When updating an instance, remember that only point positions can change, not the number of points.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateDashedLines(name: string, points: Vector3[], dashSize: number, gapSize: number, dashNb: number, scene?: Nullable<Scene>, updatable?: boolean, instance?: LinesMesh): LinesMesh;
        /**
         * Creates a polygon mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.
         * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors.
         * You can set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         * Remember you can only change the shape positions, not their number when updating a polygon.
         */
        static CreatePolygon(name: string, shape: Vector3[], scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number): Mesh;
        /**
          * Creates an extruded polygon mesh, with depth in the Y direction.
          * Please consider using the same method from the MeshBuilder class instead.
         */
        static ExtrudePolygon(name: string, shape: Vector3[], depth: number, scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates an extruded shape mesh.
         * The extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead.
         *
         * Please read this full tutorial to understand how to design an extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
         * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.
         * The parameter `scale` (float, default 1) is the value to scale the shape.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static ExtrudeShape(name: string, shape: Vector3[], path: Vector3[], scale: number, rotation: number, cap: number, scene?: Nullable<Scene>, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates an custom extruded shape mesh.
         * The custom extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead.
         *
         * Please read this full tutorial to understand how to design a custom extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.
         * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path
         * and the distance of this point from the begining of the path :
         * ```javascript
         * var rotationFunction = function(i, distance) {
         *     // do things
         *     return rotationValue; }
         * ```
         * It must returns a float value that will be the rotation in radians applied to the shape on each path point.
         * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path
         * and the distance of this point from the begining of the path :
         * ```javascript
         * var scaleFunction = function(i, distance) {
         *     // do things
         *    return scaleValue;}
         * ```
         * It must returns a float value that will be the scale value applied to the shape on each path point.
         * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`.
         * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static ExtrudeShapeCustom(name: string, shape: Vector3[], path: Vector3[], scaleFunction: Function, rotationFunction: Function, ribbonCloseArray: boolean, ribbonClosePath: boolean, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates lathe mesh.
         * The lathe is a shape with a symetry axis : a 2D model shape is rotated around this axis to design the lathe.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be
         * rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero.
         * The parameter `radius` (positive float, default 1) is the radius value of the lathe.
         * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateLathe(name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a plane mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `size` sets the size (float) of both sides of the plane at once (default 1).
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        /**
         * Creates a ground mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground.
         * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateGround(name: string, width: number, height: number, subdivisions: number, scene?: Scene, updatable?: boolean): Mesh;
        /**
         * Creates a tiled ground mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates.
         * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates.
         * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height. Each subdivision is called a tile.
         * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height of each tile.
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTiledGround(name: string, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
            w: number;
            h: number;
        }, precision: {
            w: number;
            h: number;
        }, scene: Scene, updatable?: boolean): Mesh;
        /**
         * Creates a ground mesh from a height map.
         * tuto : http://doc.babylonjs.com/tutorials/14._Height_Map
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `url` sets the URL of the height map image resource.
         * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.
         * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.
         * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.
         * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.
         * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).
         * This function is passed the newly built mesh :
         * ```javascript
         * function(mesh) { // do things
         *     return; }
         * ```
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean, onReady?: (mesh: GroundMesh) => void): GroundMesh;
        /**
         * Creates a tube mesh.
         * The tube is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `path` is a required array of successive Vector3. It is the curve used as the axis of the tube.
         * The parameter `radius` (positive float, default 1) sets the tube radius size.
         * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface.
         * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overwrittes the parameter `radius`.
         * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path.
         * It must return a radius value (positive float) :
         * ```javascript
         * var radiusFunction = function(i, distance) {
         *     // do things
         *     return radius; }
         * ```
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL
         * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#tube
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateTube(name: string, path: Vector3[], radius: number, tessellation: number, radiusFunction: {
            (i: number, distance: number): number;
        }, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        /**
         * Creates a polyhedron mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial
         *  to choose the wanted type.
         * The parameter `size` (positive float, default 1) sets the polygon size.
         * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value).
         * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`.
         * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
         * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`).
         * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors
         * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreatePolyhedron(name: string, options: {
            type?: number;
            size?: number;
            sizeX?: number;
            sizeY?: number;
            sizeZ?: number;
            custom?: any;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            updatable?: boolean;
            sideOrientation?: number;
        }, scene: Scene): Mesh;
        /**
         * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided.
         * Please consider using the same method from the MeshBuilder class instead.
         * The parameter `radius` sets the radius size (float) of the icosphere (default 1).
         * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`).
         * The parameter `subdivisions` sets the number of subdivisions (postive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size.
         * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface.
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         */
        static CreateIcoSphere(name: string, options: {
            radius?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            updatable?: boolean;
        }, scene: Scene): Mesh;
        /**
         * Creates a decal mesh.
         * Please consider using the same method from the MeshBuilder class instead.
         * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal.
         * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates.
         * The parameter `normal` (Vector3, default Vector3.Up) sets the normal of the mesh where the decal is applied onto in World coordinates.
         * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling.
         * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal.
         */
        static CreateDecal(name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number): Mesh;
        /**
         * @returns original positions used for CPU skinning.  Useful for integrating Morphing with skeletons in same mesh.
         */
        setPositionsForCPUSkinning(): Float32Array;
        /**
         * @returns original normals used for CPU skinning.  Useful for integrating Morphing with skeletons in same mesh.
         */
        setNormalsForCPUSkinning(): Float32Array;
        /**
         * Updates the vertex buffer by applying transformation from the bones.
         * Returns the Mesh.
         *
         * @param {skeleton} skeleton to apply
         */
        applySkeleton(skeleton: Skeleton): Mesh;
        /**
         * Returns an object `{min:` Vector3`, max:` Vector3`}`
         * This min and max Vector3 are the minimum and maximum vectors of each mesh bounding box from the passed array, in the World system
         */
        static MinMax(meshes: AbstractMesh[]): {
            min: Vector3;
            max: Vector3;
        };
        /**
         * Returns a Vector3, the center of the `{min:` Vector3`, max:` Vector3`}` or the center of MinMax vector3 computed from a mesh array.
         */
        static Center(meshesOrMinMaxVector: {
            min: Vector3;
            max: Vector3;
        } | AbstractMesh[]): Vector3;
        /**
         * Merge the array of meshes into a single mesh for performance reasons.
         * @param {Array<Mesh>} meshes - The vertices source.  They should all be of the same material.  Entries can empty
         * @param {boolean} disposeSource - When true (default), dispose of the vertices from the source meshes
         * @param {boolean} allow32BitsIndices - When the sum of the vertices > 64k, this must be set to true.
         * @param {Mesh} meshSubclass - When set, vertices inserted into this Mesh.  Meshes can then be merged into a Mesh sub-class.
         * @param {boolean} subdivideWithSubMeshes - When true (false default), subdivide mesh to his subMesh array with meshes source.
         */
        static MergeMeshes(meshes: Array<Mesh>, disposeSource?: boolean, allow32BitsIndices?: boolean, meshSubclass?: Mesh, subdivideWithSubMeshes?: boolean): Nullable<Mesh>;
    }
}

declare module 'babylonjs/core' {
    class BaseSubMesh {
        _materialDefines: Nullable<MaterialDefines>;
        _materialEffect: Nullable<Effect>;
        readonly effect: Nullable<Effect>;
        setEffect(effect: Nullable<Effect>, defines?: Nullable<MaterialDefines>): void;
    }
    class SubMesh extends BaseSubMesh implements ICullable {
        materialIndex: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;
        linesIndexCount: number;
        private _mesh;
        private _renderingMesh;
        private _boundingInfo;
        private _linesIndexBuffer;
        _lastColliderWorldVertices: Nullable<Vector3[]>;
        _trianglePlanes: Plane[];
        _lastColliderTransformMatrix: Matrix;
        _renderId: number;
        _alphaIndex: number;
        _distanceToCamera: number;
        _id: number;
        private _currentMaterial;
        static AddToMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean): SubMesh;
        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
        readonly IsGlobal: boolean;
        /**
         * Returns the submesh BoudingInfo object.
         */
        getBoundingInfo(): BoundingInfo;
        /**
         * Sets the submesh BoundingInfo.
         * Return the SubMesh.
         */
        setBoundingInfo(boundingInfo: BoundingInfo): SubMesh;
        /**
         * Returns the mesh of the current submesh.
         */
        getMesh(): AbstractMesh;
        /**
         * Returns the rendering mesh of the submesh.
         */
        getRenderingMesh(): Mesh;
        /**
         * Returns the submesh material.
         */
        getMaterial(): Nullable<Material>;
        /**
         * Sets a new updated BoundingInfo object to the submesh.
         * Returns the SubMesh.
         */
        refreshBoundingInfo(): SubMesh;
        _checkCollision(collider: Collider): boolean;
        /**
         * Updates the submesh BoundingInfo.
         * Returns the Submesh.
         */
        updateBoundingInfo(world: Matrix): SubMesh;
        /**
         * True is the submesh bounding box intersects the frustum defined by the passed array of planes.
         * Boolean returned.
         */
        isInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * True is the submesh bounding box is completely inside the frustum defined by the passed array of planes.
         * Boolean returned.
         */
        isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
        /**
         * Renders the submesh.
         * Returns it.
         */
        render(enableAlphaMode: boolean): SubMesh;
        /**
         * Returns a new Index Buffer.
         * Type returned : WebGLBuffer.
         */
        getLinesIndexBuffer(indices: IndicesArray, engine: Engine): WebGLBuffer;
        /**
         * True is the passed Ray intersects the submesh bounding box.
         * Boolean returned.
         */
        canIntersects(ray: Ray): boolean;
        /**
         * Returns an object IntersectionInfo.
         */
        intersects(ray: Ray, positions: Vector3[], indices: IndicesArray, fastCheck?: boolean): Nullable<IntersectionInfo>;
        _rebuild(): void;
        /**
         * Creates a new Submesh from the passed Mesh.
         */
        clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh;
        /**
         * Disposes the Submesh.
         * Returns nothing.
         */
        dispose(): void;
        /**
         * Creates a new Submesh from the passed parameters :
         * - materialIndex (integer) : the index of the main mesh material.
         * - startIndex (integer) : the index where to start the copy in the mesh indices array.
         * - indexCount (integer) : the number of indices to copy then from the startIndex.
         * - mesh (Mesh) : the main mesh to create the submesh from.
         * - renderingMesh (optional Mesh) : rendering mesh.
         */
        static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh;
    }
}

declare module 'babylonjs/core' {
    class MaterialDefines {
        private _keys;
        private _isDirty;
        _renderId: number;
        _areLightsDirty: boolean;
        _areAttributesDirty: boolean;
        _areTexturesDirty: boolean;
        _areFresnelDirty: boolean;
        _areMiscDirty: boolean;
        _areImageProcessingDirty: boolean;
        _normals: boolean;
        _uvs: boolean;
        _needNormals: boolean;
        _needUVs: boolean;
        readonly isDirty: boolean;
        markAsProcessed(): void;
        markAsUnprocessed(): void;
        markAllAsDirty(): void;
        markAsImageProcessingDirty(): void;
        markAsLightDirty(): void;
        markAsAttributesDirty(): void;
        markAsTexturesDirty(): void;
        markAsFresnelDirty(): void;
        markAsMiscDirty(): void;
        rebuild(): void;
        isEqual(other: MaterialDefines): boolean;
        cloneTo(other: MaterialDefines): void;
        reset(): void;
        toString(): string;
    }
    class Material implements IAnimatable {
        private static _TriangleFillMode;
        private static _WireFrameFillMode;
        private static _PointFillMode;
        private static _PointListDrawMode;
        private static _LineListDrawMode;
        private static _LineLoopDrawMode;
        private static _LineStripDrawMode;
        private static _TriangleStripDrawMode;
        private static _TriangleFanDrawMode;
        static readonly TriangleFillMode: number;
        static readonly WireFrameFillMode: number;
        static readonly PointFillMode: number;
        static readonly PointListDrawMode: number;
        static readonly LineListDrawMode: number;
        static readonly LineLoopDrawMode: number;
        static readonly LineStripDrawMode: number;
        static readonly TriangleStripDrawMode: number;
        static readonly TriangleFanDrawMode: number;
        private static _ClockWiseSideOrientation;
        private static _CounterClockWiseSideOrientation;
        static readonly ClockWiseSideOrientation: number;
        static readonly CounterClockWiseSideOrientation: number;
        private static _TextureDirtyFlag;
        private static _LightDirtyFlag;
        private static _FresnelDirtyFlag;
        private static _AttributesDirtyFlag;
        private static _MiscDirtyFlag;
        static readonly TextureDirtyFlag: number;
        static readonly LightDirtyFlag: number;
        static readonly FresnelDirtyFlag: number;
        static readonly AttributesDirtyFlag: number;
        static readonly MiscDirtyFlag: number;
        id: string;
        name: string;
        checkReadyOnEveryCall: boolean;
        checkReadyOnlyOnce: boolean;
        state: string;
        alpha: number;
        protected _backFaceCulling: boolean;
        backFaceCulling: boolean;
        sideOrientation: number;
        onCompiled: (effect: Effect) => void;
        onError: (effect: Effect, errors: string) => void;
        getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;
        doNotSerialize: boolean;
        storeEffectOnSubMeshes: boolean;
        animations: Array<Animation>;
        /**
        * An event triggered when the material is disposed.
        * @type {BABYLON.Observable}
        */
        onDisposeObservable: Observable<Material>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
        * An event triggered when the material is bound.
        * @type {BABYLON.Observable}
        */
        onBindObservable: Observable<AbstractMesh>;
        private _onBindObserver;
        onBind: (Mesh: AbstractMesh) => void;
        /**
        * An event triggered when the material is unbound.
        * @type {BABYLON.Observable}
        */
        onUnBindObservable: Observable<Material>;
        private _alphaMode;
        alphaMode: number;
        private _needDepthPrePass;
        needDepthPrePass: boolean;
        disableDepthWrite: boolean;
        forceDepthWrite: boolean;
        separateCullingPass: boolean;
        private _fogEnabled;
        fogEnabled: boolean;
        pointSize: number;
        zOffset: number;
        wireframe: boolean;
        pointsCloud: boolean;
        fillMode: number;
        _effect: Nullable<Effect>;
        _wasPreviouslyReady: boolean;
        private _useUBO;
        private _scene;
        private _fillMode;
        private _cachedDepthWriteState;
        protected _uniformBuffer: UniformBuffer;
        constructor(name: string, scene: Scene, doNotAdd?: boolean);
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         * subclasses should override adding information pertainent to themselves
         */
        toString(fullDetails?: boolean): string;
        /**
         * Child classes can use it to update shaders
         */
        getClassName(): string;
        readonly isFrozen: boolean;
        freeze(): void;
        unfreeze(): void;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: BaseSubMesh, useInstances?: boolean): boolean;
        getEffect(): Nullable<Effect>;
        getScene(): Scene;
        needAlphaBlending(): boolean;
        needAlphaBlendingForMesh(mesh: AbstractMesh): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        markDirty(): void;
        _preBind(effect?: Effect, overrideOrientation?: Nullable<number>): boolean;
        bind(world: Matrix, mesh?: Mesh): void;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        bindOnlyWorldMatrix(world: Matrix): void;
        bindSceneUniformBuffer(effect: Effect, sceneUbo: UniformBuffer): void;
        bindView(effect: Effect): void;
        bindViewProjection(effect: Effect): void;
        protected _afterBind(mesh?: Mesh): void;
        unbind(): void;
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        clone(name: string): Nullable<Material>;
        getBindedMeshes(): AbstractMesh[];
        /**
         * Force shader compilation including textures ready check
         */
        forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<{
            alphaTest: Nullable<boolean>;
            clipPlane: boolean;
        }>): void;
        markAsDirty(flag: number): void;
        protected _markAllSubMeshesAsDirty(func: (defines: MaterialDefines) => void): void;
        protected _markAllSubMeshesAsImageProcessingDirty(): void;
        protected _markAllSubMeshesAsTexturesDirty(): void;
        protected _markAllSubMeshesAsFresnelDirty(): void;
        protected _markAllSubMeshesAsLightsDirty(): void;
        protected _markAllSubMeshesAsAttributesDirty(): void;
        protected _markAllSubMeshesAsMiscDirty(): void;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        serialize(): any;
        static ParseMultiMaterial(parsedMultiMaterial: any, scene: Scene): MultiMaterial;
        static Parse(parsedMaterial: any, scene: Scene, rootUrl: string): any;
    }
}

declare module 'babylonjs/core' {
    class UniformBuffer {
        private _engine;
        private _buffer;
        private _data;
        private _bufferData;
        private _dynamic?;
        private _uniformLocations;
        private _uniformSizes;
        private _uniformLocationPointer;
        private _needSync;
        private _noUBO;
        private _currentEffect;
        private static _MAX_UNIFORM_SIZE;
        private static _tempBuffer;
        /**
         * Wrapper for updateUniform.
         * @method updateMatrix3x3
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Float32Array} matrix
         */
        updateMatrix3x3: (name: string, matrix: Float32Array) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Float32Array} matrix
         */
        updateMatrix2x2: (name: string, matrix: Float32Array) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         */
        updateFloat: (name: string, x: number) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateFloat2: (name: string, x: number, y: number, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateFloat3: (name: string, x: number, y: number, z: number, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         * @param {number} w
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateFloat4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Matrix} A 4x4 matrix.
         */
        updateMatrix: (name: string, mat: Matrix) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector3} vector
         */
        updateVector3: (name: string, vector: Vector3) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector4} vector
         */
        updateVector4: (name: string, vector: Vector4) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateColor3: (name: string, color: Color3, suffix?: string) => void;
        /**
         * Wrapper for updateUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {number} alpha
         * @param {string} [suffix] Suffix to add to the uniform name.
         */
        updateColor4: (name: string, color: Color3, alpha: number, suffix?: string) => void;
        /**
         * Uniform buffer objects.
         *
         * Handles blocks of uniform on the GPU.
         *
         * If WebGL 2 is not available, this class falls back on traditionnal setUniformXXX calls.
         *
         * For more information, please refer to :
         * https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
         */
        constructor(engine: Engine, data?: number[], dynamic?: boolean);
        /**
         * Indicates if the buffer is using the WebGL2 UBO implementation,
         * or just falling back on setUniformXXX calls.
         */
        readonly useUbo: boolean;
        /**
         * Indicates if the WebGL underlying uniform buffer is in sync
         * with the javascript cache data.
         */
        readonly isSync: boolean;
        /**
         * Indicates if the WebGL underlying uniform buffer is dynamic.
         * Also, a dynamic UniformBuffer will disable cache verification and always
         * update the underlying WebGL uniform buffer to the GPU.
         */
        isDynamic(): boolean;
        /**
         * The data cache on JS side.
         */
        getData(): Float32Array;
        /**
         * The underlying WebGL Uniform buffer.
         */
        getBuffer(): Nullable<WebGLBuffer>;
        /**
         * std140 layout specifies how to align data within an UBO structure.
         * See https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=159
         * for specs.
         */
        private _fillAlignment(size);
        /**
         * Adds an uniform in the buffer.
         * Warning : the subsequents calls of this function must be in the same order as declared in the shader
         * for the layout to be correct !
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number|number[]} size Data size, or data directly.
         */
        addUniform(name: string, size: number | number[]): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Matrix} mat A 4x4 matrix.
         */
        addMatrix(name: string, mat: Matrix): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         */
        addFloat2(name: string, x: number, y: number): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {number} x
         * @param {number} y
         * @param {number} z
         */
        addFloat3(name: string, x: number, y: number, z: number): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         */
        addColor3(name: string, color: Color3): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Color3} color
         * @param {number} alpha
         */
        addColor4(name: string, color: Color3, alpha: number): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         * @param {Vector3} vector
         */
        addVector3(name: string, vector: Vector3): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         */
        addMatrix3x3(name: string): void;
        /**
         * Wrapper for addUniform.
         * @param {string} name Name of the uniform, as used in the uniform block in the shader.
         */
        addMatrix2x2(name: string): void;
        /**
         * Effectively creates the WebGL Uniform Buffer, once layout is completed with `addUniform`.
         */
        create(): void;
        _rebuild(): void;
        /**
         * Updates the WebGL Uniform Buffer on the GPU.
         * If the `dynamic` flag is set to true, no cache comparison is done.
         * Otherwise, the buffer will be updated only if the cache differs.
         */
        update(): void;
        /**
         * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
         * @param {string} uniformName Name of the uniform, as used in the uniform block in the shader.
         * @param {number[]|Float32Array} data Flattened data
         * @param {number} size Size of the data.
         */
        updateUniform(uniformName: string, data: FloatArray, size: number): void;
        private _updateMatrix3x3ForUniform(name, matrix);
        private _updateMatrix3x3ForEffect(name, matrix);
        private _updateMatrix2x2ForEffect(name, matrix);
        private _updateMatrix2x2ForUniform(name, matrix);
        private _updateFloatForEffect(name, x);
        private _updateFloatForUniform(name, x);
        private _updateFloat2ForEffect(name, x, y, suffix?);
        private _updateFloat2ForUniform(name, x, y, suffix?);
        private _updateFloat3ForEffect(name, x, y, z, suffix?);
        private _updateFloat3ForUniform(name, x, y, z, suffix?);
        private _updateFloat4ForEffect(name, x, y, z, w, suffix?);
        private _updateFloat4ForUniform(name, x, y, z, w, suffix?);
        private _updateMatrixForEffect(name, mat);
        private _updateMatrixForUniform(name, mat);
        private _updateVector3ForEffect(name, vector);
        private _updateVector3ForUniform(name, vector);
        private _updateVector4ForEffect(name, vector);
        private _updateVector4ForUniform(name, vector);
        private _updateColor3ForEffect(name, color, suffix?);
        private _updateColor3ForUniform(name, color, suffix?);
        private _updateColor4ForEffect(name, color, alpha, suffix?);
        private _updateColor4ForUniform(name, color, alpha, suffix?);
        /**
         * Sets a sampler uniform on the effect.
         * @param {string} name Name of the sampler.
         * @param {Texture} texture
         */
        setTexture(name: string, texture: Nullable<BaseTexture>): void;
        /**
         * Directly updates the value of the uniform in the cache AND on the GPU.
         * @param {string} uniformName Name of the uniform, as used in the uniform block in the shader.
         * @param {number[]|Float32Array} data Flattened data
         */
        updateUniformDirectly(uniformName: string, data: FloatArray): void;
        /**
         * Binds this uniform buffer to an effect.
         * @param {Effect} effect
         * @param {string} name Name of the uniform block in the shader.
         */
        bindToEffect(effect: Effect, name: string): void;
        /**
         * Disposes the uniform buffer.
         */
        dispose(): void;
    }
}

declare module 'babylonjs/core' {
    interface IGetSetVerticesData {
        isVerticesDataPresent(kind: string): boolean;
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        getIndices(copyWhenShared?: boolean): Nullable<IndicesArray>;
        setVerticesData(kind: string, data: FloatArray, updatable: boolean): void;
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): void;
        setIndices(indices: IndicesArray, totalVertices: Nullable<number>, updatable?: boolean): void;
    }
    class VertexData {
        positions: Nullable<FloatArray>;
        normals: Nullable<FloatArray>;
        tangents: Nullable<FloatArray>;
        uvs: Nullable<FloatArray>;
        uvs2: Nullable<FloatArray>;
        uvs3: Nullable<FloatArray>;
        uvs4: Nullable<FloatArray>;
        uvs5: Nullable<FloatArray>;
        uvs6: Nullable<FloatArray>;
        colors: Nullable<FloatArray>;
        matricesIndices: Nullable<FloatArray>;
        matricesWeights: Nullable<FloatArray>;
        matricesIndicesExtra: Nullable<FloatArray>;
        matricesWeightsExtra: Nullable<FloatArray>;
        indices: Nullable<IndicesArray>;
        set(data: FloatArray, kind: string): void;
        /**
         * Associates the vertexData to the passed Mesh.
         * Sets it as updatable or not (default `false`).
         * Returns the VertexData.
         */
        applyToMesh(mesh: Mesh, updatable?: boolean): VertexData;
        /**
         * Associates the vertexData to the passed Geometry.
         * Sets it as updatable or not (default `false`).
         * Returns the VertexData.
         */
        applyToGeometry(geometry: Geometry, updatable?: boolean): VertexData;
        /**
         * Updates the associated mesh.
         * Returns the VertexData.
         */
        updateMesh(mesh: Mesh, updateExtends?: boolean, makeItUnique?: boolean): VertexData;
        /**
         * Updates the associated geometry.
         * Returns the VertexData.
         */
        updateGeometry(geometry: Geometry, updateExtends?: boolean, makeItUnique?: boolean): VertexData;
        private _applyTo(meshOrGeometry, updatable?);
        private _update(meshOrGeometry, updateExtends?, makeItUnique?);
        /**
         * Transforms each position and each normal of the vertexData according to the passed Matrix.
         * Returns the VertexData.
         */
        transform(matrix: Matrix): VertexData;
        /**
         * Merges the passed VertexData into the current one.
         * Returns the modified VertexData.
         */
        merge(other: VertexData, options?: {
            tangentLength?: number;
        }): VertexData;
        private _mergeElement(source, other, length?, defaultValue?);
        /**
         * Serializes the VertexData.
         * Returns a serialized object.
         */
        serialize(): any;
        /**
         * Returns the object VertexData associated to the passed mesh.
         */
        static ExtractFromMesh(mesh: Mesh, copyWhenShared?: boolean, forceCopy?: boolean): VertexData;
        /**
         * Returns the object VertexData associated to the passed geometry.
         */
        static ExtractFromGeometry(geometry: Geometry, copyWhenShared?: boolean, forceCopy?: boolean): VertexData;
        private static _ExtractFrom(meshOrGeometry, copyWhenShared?, forceCopy?);
        /**
         * Creates the vertexData of the Ribbon.
         */
        static CreateRibbon(options: {
            pathArray: Vector3[][];
            closeArray?: boolean;
            closePath?: boolean;
            offset?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
            invertUV?: boolean;
            uvs?: Vector2[];
            colors?: Color4[];
        }): VertexData;
        /**
         * Creates the VertexData of the Box.
         */
        static CreateBox(options: {
            size?: number;
            width?: number;
            height?: number;
            depth?: number;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Sphere.
         */
        static CreateSphere(options: {
            segments?: number;
            diameter?: number;
            diameterX?: number;
            diameterY?: number;
            diameterZ?: number;
            arc?: number;
            slice?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Cylinder or Cone.
         */
        static CreateCylinder(options: {
            height?: number;
            diameterTop?: number;
            diameterBottom?: number;
            diameter?: number;
            tessellation?: number;
            subdivisions?: number;
            arc?: number;
            faceColors?: Color4[];
            faceUV?: Vector4[];
            hasRings?: boolean;
            enclose?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Torus.
         */
        static CreateTorus(options: {
            diameter?: number;
            thickness?: number;
            tessellation?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the LineSystem.
         */
        static CreateLineSystem(options: {
            lines: Vector3[][];
            colors?: Nullable<Color4[][]>;
        }): VertexData;
        /**
         * Create the VertexData of the DashedLines.
         */
        static CreateDashedLines(options: {
            points: Vector3[];
            dashSize?: number;
            gapSize?: number;
            dashNb?: number;
        }): VertexData;
        /**
         * Creates the VertexData of the Ground.
         */
        static CreateGround(options: {
            width?: number;
            height?: number;
            subdivisions?: number;
            subdivisionsX?: number;
            subdivisionsY?: number;
        }): VertexData;
        /**
         * Creates the VertexData of the TiledGround.
         */
        static CreateTiledGround(options: {
            xmin: number;
            zmin: number;
            xmax: number;
            zmax: number;
            subdivisions?: {
                w: number;
                h: number;
            };
            precision?: {
                w: number;
                h: number;
            };
        }): VertexData;
        /**
         * Creates the VertexData of the Ground designed from a heightmap.
         */
        static CreateGroundFromHeightMap(options: {
            width: number;
            height: number;
            subdivisions: number;
            minHeight: number;
            maxHeight: number;
            colorFilter: Color3;
            buffer: Uint8Array;
            bufferWidth: number;
            bufferHeight: number;
        }): VertexData;
        /**
         * Creates the VertexData of the Plane.
         */
        static CreatePlane(options: {
            size?: number;
            width?: number;
            height?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Disc or regular Polygon.
         */
        static CreateDisc(options: {
            radius?: number;
            tessellation?: number;
            arc?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Re-creates the VertexData of the Polygon for sideOrientation.
         */
        static CreatePolygon(polygon: Mesh, sideOrientation: number, fUV?: Vector4[], fColors?: Color4[], frontUVs?: Vector4, backUVs?: Vector4): VertexData;
        /**
         * Creates the VertexData of the IcoSphere.
         */
        static CreateIcoSphere(options: {
            radius?: number;
            radiusX?: number;
            radiusY?: number;
            radiusZ?: number;
            flat?: boolean;
            subdivisions?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Polyhedron.
         */
        static CreatePolyhedron(options: {
            type?: number;
            size?: number;
            sizeX?: number;
            sizeY?: number;
            sizeZ?: number;
            custom?: any;
            faceUV?: Vector4[];
            faceColors?: Color4[];
            flat?: boolean;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * Creates the VertexData of the Torus Knot.
         */
        static CreateTorusKnot(options: {
            radius?: number;
            tube?: number;
            radialSegments?: number;
            tubularSegments?: number;
            p?: number;
            q?: number;
            sideOrientation?: number;
            frontUVs?: Vector4;
            backUVs?: Vector4;
        }): VertexData;
        /**
         * @param {any} - positions (number[] or Float32Array)
         * @param {any} - indices   (number[] or Uint16Array)
         * @param {any} - normals   (number[] or Float32Array)
         * options (optional) :
         * facetPositions : optional array of facet positions (vector3)
         * facetNormals : optional array of facet normals (vector3)
         * facetPartitioning : optional partitioning array. facetPositions is required for facetPartitioning computation
         * subDiv : optional partitioning data about subdivsions on  each axis (int), required for facetPartitioning computation
         * ratio : optional partitioning ratio / bounding box, required for facetPartitioning computation
         * bbSize : optional bounding box size data, required for facetPartitioning computation
         * bInfo : optional bounding info, required for facetPartitioning computation
         * useRightHandedSystem: optional boolean to for right handed system computation
         * depthSort : optional boolean to enable the facet depth sort computation
         * distanceTo : optional Vector3 to compute the facet depth from this location
         * depthSortedFacets : optional array of depthSortedFacets to store the facet distances from the reference location
         */
        static ComputeNormals(positions: any, indices: any, normals: any, options?: {
            facetNormals?: any;
            facetPositions?: any;
            facetPartitioning?: any;
            ratio?: number;
            bInfo?: any;
            bbSize?: Vector3;
            subDiv?: any;
            useRightHandedSystem?: boolean;
            depthSort?: boolean;
            distanceTo?: Vector3;
            depthSortedFacets?: any;
        }): void;
        private static _ComputeSides(sideOrientation, positions, indices, normals, uvs, frontUVs?, backUVs?);
        /**
         * Creates a new VertexData from the imported parameters.
         */
        static ImportVertexData(parsedVertexData: any, geometry: Geometry): void;
    }
}

declare module 'babylonjs/core' {
    class Geometry implements IGetSetVerticesData {
        id: string;
        delayLoadState: number;
        delayLoadingFile: Nullable<string>;
        onGeometryUpdated: (geometry: Geometry, kind?: string) => void;
        private _scene;
        private _engine;
        private _meshes;
        private _totalVertices;
        private _indices;
        private _vertexBuffers;
        private _isDisposed;
        private _extend;
        private _boundingBias;
        _delayInfo: Array<string>;
        private _indexBuffer;
        private _indexBufferIsUpdatable;
        _boundingInfo: Nullable<BoundingInfo>;
        _delayLoadingFunction: Nullable<(any: any, geometry: Geometry) => void>;
        _softwareSkinningRenderId: number;
        private _vertexArrayObjects;
        private _updatable;
        _positions: Nullable<Vector3[]>;
        /**
         *  The Bias Vector to apply on the bounding elements (box/sphere), the max extend is computed as v += v * bias.x + bias.y, the min is computed as v -= v * bias.x + bias.y
         * @returns The Bias Vector
         */
        boundingBias: Vector2;
        static CreateGeometryForMesh(mesh: Mesh): Geometry;
        constructor(id: string, scene: Scene, vertexData?: VertexData, updatable?: boolean, mesh?: Nullable<Mesh>);
        readonly extend: {
            minimum: Vector3;
            maximum: Vector3;
        };
        getScene(): Scene;
        getEngine(): Engine;
        isReady(): boolean;
        readonly doNotSerialize: boolean;
        _rebuild(): void;
        setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): void;
        removeVerticesData(kind: string): void;
        setVerticesBuffer(buffer: VertexBuffer): void;
        updateVerticesDataDirectly(kind: string, data: Float32Array, offset: number): void;
        updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean): void;
        private updateBoundingInfo(updateExtends, data);
        _bind(effect: Nullable<Effect>, indexToBind?: Nullable<WebGLBuffer>): void;
        getTotalVertices(): number;
        getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray>;
        /**
         * Returns a boolean defining if the vertex data for the requested `kind` is updatable.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        isVertexBufferUpdatable(kind: string): boolean;
        getVertexBuffer(kind: string): Nullable<VertexBuffer>;
        getVertexBuffers(): Nullable<{
            [key: string]: VertexBuffer;
        }>;
        isVerticesDataPresent(kind: string): boolean;
        getVerticesDataKinds(): string[];
        updateIndices(indices: IndicesArray, offset?: number): void;
        setIndices(indices: IndicesArray, totalVertices?: Nullable<number>, updatable?: boolean): void;
        getTotalIndices(): number;
        getIndices(copyWhenShared?: boolean): Nullable<IndicesArray>;
        getIndexBuffer(): Nullable<WebGLBuffer>;
        _releaseVertexArrayObject(effect?: Nullable<Effect>): void;
        releaseForMesh(mesh: Mesh, shouldDispose?: boolean): void;
        applyToMesh(mesh: Mesh): void;
        private updateExtend(data?, stride?);
        private _applyToMesh(mesh);
        private notifyUpdate(kind?);
        load(scene: Scene, onLoaded?: () => void): void;
        private _queueLoad(scene, onLoaded?);
        /**
         * Invert the geometry to move from a right handed system to a left handed one.
         */
        toLeftHanded(): void;
        _resetPointsArrayCache(): void;
        _generatePointsArray(): boolean;
        isDisposed(): boolean;
        private _disposeVertexArrayObjects();
        dispose(): void;
        copy(id: string): Geometry;
        serialize(): any;
        private toNumberArray(origin);
        serializeVerticeData(): any;
        static ExtractFromMesh(mesh: Mesh, id: string): Nullable<Geometry>;
        /**
         * You should now use Tools.RandomId(), this method is still here for legacy reasons.
         * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
         * Be aware Math.random() could cause collisions, but:
         * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
         */
        static RandomId(): string;
        static ImportGeometry(parsedGeometry: any, mesh: Mesh): void;
        private static _CleanMatricesWeights(parsedGeometry, mesh);
        static Parse(parsedVertexData: any, scene: Scene, rootUrl: string): Nullable<Geometry>;
    }
    class _PrimitiveGeometry extends Geometry {
        private _canBeRegenerated;
        private _beingRegenerated;
        constructor(id: string, scene: Scene, _canBeRegenerated?: boolean, mesh?: Nullable<Mesh>);
        canBeRegenerated(): boolean;
        regenerate(): void;
        asNewGeometry(id: string): Geometry;
        setAllVerticesData(vertexData: VertexData, updatable?: boolean): void;
        setVerticesData(kind: string, data: FloatArray, updatable?: boolean): void;
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
    }
    class RibbonGeometry extends _PrimitiveGeometry {
        pathArray: Vector3[][];
        closeArray: boolean;
        closePath: boolean;
        offset: number;
        side: number;
        constructor(id: string, scene: Scene, pathArray: Vector3[][], closeArray: boolean, closePath: boolean, offset: number, canBeRegenerated?: boolean, mesh?: Mesh, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
    }
    class BoxGeometry extends _PrimitiveGeometry {
        size: number;
        side: number;
        constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedBox: any, scene: Scene): Nullable<BoxGeometry>;
    }
    class SphereGeometry extends _PrimitiveGeometry {
        segments: number;
        diameter: number;
        side: number;
        constructor(id: string, scene: Scene, segments: number, diameter: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedSphere: any, scene: Scene): Nullable<SphereGeometry>;
    }
    class DiscGeometry extends _PrimitiveGeometry {
        radius: number;
        tessellation: number;
        side: number;
        constructor(id: string, scene: Scene, radius: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
    }
    class CylinderGeometry extends _PrimitiveGeometry {
        height: number;
        diameterTop: number;
        diameterBottom: number;
        tessellation: number;
        subdivisions: number;
        side: number;
        constructor(id: string, scene: Scene, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions?: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedCylinder: any, scene: Scene): Nullable<CylinderGeometry>;
    }
    class TorusGeometry extends _PrimitiveGeometry {
        diameter: number;
        thickness: number;
        tessellation: number;
        side: number;
        constructor(id: string, scene: Scene, diameter: number, thickness: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedTorus: any, scene: Scene): Nullable<TorusGeometry>;
    }
    class GroundGeometry extends _PrimitiveGeometry {
        width: number;
        height: number;
        subdivisions: number;
        constructor(id: string, scene: Scene, width: number, height: number, subdivisions: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedGround: any, scene: Scene): Nullable<GroundGeometry>;
    }
    class TiledGroundGeometry extends _PrimitiveGeometry {
        xmin: number;
        zmin: number;
        xmax: number;
        zmax: number;
        subdivisions: {
            w: number;
            h: number;
        };
        precision: {
            w: number;
            h: number;
        };
        constructor(id: string, scene: Scene, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: {
            w: number;
            h: number;
        }, precision: {
            w: number;
            h: number;
        }, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
    }
    class PlaneGeometry extends _PrimitiveGeometry {
        size: number;
        side: number;
        constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedPlane: any, scene: Scene): Nullable<PlaneGeometry>;
    }
    class TorusKnotGeometry extends _PrimitiveGeometry {
        radius: number;
        tube: number;
        radialSegments: number;
        tubularSegments: number;
        p: number;
        q: number;
        side: number;
        constructor(id: string, scene: Scene, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, canBeRegenerated?: boolean, mesh?: Nullable<Mesh>, side?: number);
        _regenerateVertexData(): VertexData;
        copy(id: string): Geometry;
        serialize(): any;
        static Parse(parsedTorusKnot: any, scene: Scene): Nullable<TorusKnotGeometry>;
    }
}

declare module 'babylonjs/core' {
    class PostProcessManager {
        private _scene;
        private _indexBuffer;
        private _vertexBuffers;
        constructor(scene: Scene);
        private _prepareBuffers();
        private _buildIndexBuffer();
        _rebuild(): void;
        _prepareFrame(sourceTexture?: Nullable<InternalTexture>, postProcesses?: Nullable<PostProcess[]>): boolean;
        directRender(postProcesses: PostProcess[], targetTexture?: Nullable<InternalTexture>, forceFullscreenViewport?: boolean): void;
        _finalizeFrame(doNotPresent?: boolean, targetTexture?: InternalTexture, faceIndex?: number, postProcesses?: PostProcess[], forceFullscreenViewport?: boolean): void;
        dispose(): void;
    }
}

declare module 'babylonjs/core' {
    /**
     * Performance monitor tracks rolling average frame-time and frame-time variance over a user defined sliding-window
     */
    class PerformanceMonitor {
        private _enabled;
        private _rollingFrameTime;
        private _lastFrameTimeMs;
        /**
         * constructor
         * @param frameSampleSize The number of samples required to saturate the sliding window
         */
        constructor(frameSampleSize?: number);
        /**
         * Samples current frame
         * @param timeMs A timestamp in milliseconds of the current frame to compare with other frames
         */
        sampleFrame(timeMs?: number): void;
        /**
         * Returns the average frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
         * @return Average frame time in milliseconds
         */
        readonly averageFrameTime: number;
        /**
         * Returns the variance frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
         * @return Frame time variance in milliseconds squared
         */
        readonly averageFrameTimeVariance: number;
        /**
         * Returns the frame time of the most recent frame
         * @return Frame time in milliseconds
         */
        readonly instantaneousFrameTime: number;
        /**
         * Returns the average framerate in frames per second over the sliding window (or the subset of frames sampled so far)
         * @return Framerate in frames per second
         */
        readonly averageFPS: number;
        /**
         * Returns the average framerate in frames per second using the most recent frame time
         * @return Framerate in frames per second
         */
        readonly instantaneousFPS: number;
        /**
         * Returns true if enough samples have been taken to completely fill the sliding window
         * @return true if saturated
         */
        readonly isSaturated: boolean;
        /**
         * Enables contributions to the sliding window sample set
         */
        enable(): void;
        /**
         * Disables contributions to the sliding window sample set
         * Samples will not be interpolated over the disabled period
         */
        disable(): void;
        /**
         * Returns true if sampling is enabled
         * @return true if enabled
         */
        readonly isEnabled: boolean;
        /**
         * Resets performance monitor
         */
        reset(): void;
    }
    /**
     * RollingAverage
     *
     * Utility to efficiently compute the rolling average and variance over a sliding window of samples
     */
    class RollingAverage {
        /**
         * Current average
         */
        average: number;
        /**
         * Current variance
         */
        variance: number;
        protected _samples: Array<number>;
        protected _sampleCount: number;
        protected _pos: number;
        protected _m2: number;
        /**
         * constructor
         * @param length The number of samples required to saturate the sliding window
         */
        constructor(length: number);
        /**
         * Adds a sample to the sample set
         * @param v The sample value
         */
        add(v: number): void;
        /**
         * Returns previously added values or null if outside of history or outside the sliding window domain
         * @param i Index in history. For example, pass 0 for the most recent value and 1 for the value before that
         * @return Value previously recorded with add() or null if outside of range
         */
        history(i: number): number;
        /**
         * Returns true if enough samples have been taken to completely fill the sliding window
         * @return true if sample-set saturated
         */
        isSaturated(): boolean;
        /**
         * Resets the rolling average (equivalent to 0 samples taken so far)
         */
        reset(): void;
        /**
         * Wraps a value around the sample range boundaries
         * @param i Position in sample range, for example if the sample length is 5, and i is -3, then 2 will be returned.
         * @return Wrapped position in sample range
         */
        protected _wrapPosition(i: number): number;
    }
}

declare module 'babylonjs/core' {
    /**
     * Interface to follow in your material defines to integrate easily the
     * Image proccessing functions.
     */
    interface IImageProcessingConfigurationDefines {
        IMAGEPROCESSING: boolean;
        VIGNETTE: boolean;
        VIGNETTEBLENDMODEMULTIPLY: boolean;
        VIGNETTEBLENDMODEOPAQUE: boolean;
        TONEMAPPING: boolean;
        CONTRAST: boolean;
        EXPOSURE: boolean;
        COLORCURVES: boolean;
        COLORGRADING: boolean;
        COLORGRADING3D: boolean;
        SAMPLER3DGREENDEPTH: boolean;
        SAMPLER3DBGRMAP: boolean;
        IMAGEPROCESSINGPOSTPROCESS: boolean;
    }
    /**
     * This groups together the common properties used for image processing either in direct forward pass
     * or through post processing effect depending on the use of the image processing pipeline in your scene
     * or not.
     */
    class ImageProcessingConfiguration {
        /**
         * Color curves setup used in the effect if colorCurvesEnabled is set to true
         */
        colorCurves: Nullable<ColorCurves>;
        private _colorCurvesEnabled;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        colorCurvesEnabled: boolean;
        /**
         * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
         */
        colorGradingTexture: Nullable<BaseTexture>;
        private _colorGradingEnabled;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Sets wether the color grading effect is enabled.
         */
        colorGradingEnabled: boolean;
        private _colorGradingWithGreenDepth;
        /**
         * Gets wether the color grading effect is using a green depth for the 3d Texture.
         */
        /**
         * Sets wether the color grading effect is using a green depth for the 3d Texture.
         */
        colorGradingWithGreenDepth: boolean;
        private _colorGradingBGR;
        /**
         * Gets wether the color grading texture contains BGR values.
         */
        /**
         * Sets wether the color grading texture contains BGR values.
         */
        colorGradingBGR: boolean;
        _exposure: number;
        /**
         * Gets the Exposure used in the effect.
         */
        /**
         * Sets the Exposure used in the effect.
         */
        exposure: number;
        private _toneMappingEnabled;
        /**
         * Gets wether the tone mapping effect is enabled.
         */
        /**
         * Sets wether the tone mapping effect is enabled.
         */
        toneMappingEnabled: boolean;
        protected _contrast: number;
        /**
         * Gets the contrast used in the effect.
         */
        /**
         * Sets the contrast used in the effect.
         */
        contrast: number;
        /**
         * Vignette stretch size.
         */
        vignetteStretch: number;
        /**
         * Vignette centre X Offset.
         */
        vignetteCentreX: number;
        /**
         * Vignette centre Y Offset.
         */
        vignetteCentreY: number;
        /**
         * Vignette weight or intensity of the vignette effect.
         */
        vignetteWeight: number;
        /**
         * Color of the vignette applied on the screen through the chosen blend mode (vignetteBlendMode)
         * if vignetteEnabled is set to true.
         */
        vignetteColor: Color4;
        /**
         * Camera field of view used by the Vignette effect.
         */
        vignetteCameraFov: number;
        private _vignetteBlendMode;
        /**
         * Gets the vignette blend mode allowing different kind of effect.
         */
        /**
         * Sets the vignette blend mode allowing different kind of effect.
         */
        vignetteBlendMode: number;
        private _vignetteEnabled;
        /**
         * Gets wether the vignette effect is enabled.
         */
        /**
         * Sets wether the vignette effect is enabled.
         */
        vignetteEnabled: boolean;
        private _applyByPostProcess;
        /**
         * Gets wether the image processing is applied through a post process or not.
         */
        /**
         * Sets wether the image processing is applied through a post process or not.
         */
        applyByPostProcess: boolean;
        private _isEnabled;
        /**
         * Gets wether the image processing is enabled or not.
         */
        /**
         * Sets wether the image processing is enabled or not.
         */
        isEnabled: boolean;
        /**
        * An event triggered when the configuration changes and requires Shader to Update some parameters.
        * @type {BABYLON.Observable}
        */
        onUpdateParameters: Observable<ImageProcessingConfiguration>;
        /**
         * Method called each time the image processing information changes requires to recompile the effect.
         */
        protected _updateParameters(): void;
        getClassName(): string;
        /**
         * Prepare the list of uniforms associated with the Image Processing effects.
         * @param uniformsList The list of uniforms used in the effect
         * @param defines the list of defines currently in use
         */
        static PrepareUniforms(uniforms: string[], defines: IImageProcessingConfigurationDefines): void;
        /**
         * Prepare the list of samplers associated with the Image Processing effects.
         * @param uniformsList The list of uniforms used in the effect
         * @param defines the list of defines currently in use
         */
        static PrepareSamplers(samplersList: string[], defines: IImageProcessingConfigurationDefines): void;
        /**
         * Prepare the list of defines associated to the shader.
         * @param defines the list of defines to complete
         */
        prepareDefines(defines: IImageProcessingConfigurationDefines, forPostProcess?: boolean): void;
        /**
         * Returns true if all the image processing information are ready.
         */
        isReady(): boolean;
        /**
         * Binds the image processing to the shader.
         * @param effect The effect to bind to
         */
        bind(effect: Effect, aspectRatio?: number): void;
        /**
         * Clones the current image processing instance.
         * @return The cloned image processing
         */
        clone(): ImageProcessingConfiguration;
        /**
         * Serializes the current image processing instance to a json representation.
         * @return a JSON representation
         */
        serialize(): any;
        /**
         * Parses the image processing from a json representation.
         * @param source the JSON source to parse
         * @return The parsed image processing
         */
        static Parse(source: any): ImageProcessingConfiguration;
        private static _VIGNETTEMODE_MULTIPLY;
        private static _VIGNETTEMODE_OPAQUE;
        /**
         * Used to apply the vignette as a mix with the pixel color.
         */
        static readonly VIGNETTEMODE_MULTIPLY: number;
        /**
         * Used to apply the vignette as a replacement of the pixel color.
         */
        static readonly VIGNETTEMODE_OPAQUE: number;
    }
}

declare module 'babylonjs/core' {
    /**
     * This represents a color grading texture. This acts as a lookup table LUT, useful during post process
     * It can help converting any input color in a desired output one. This can then be used to create effects
     * from sepia, black and white to sixties or futuristic rendering...
     *
     * The only supported format is currently 3dl.
     * More information on LUT: https://en.wikipedia.org/wiki/3D_lookup_table/
     */
    class ColorGradingTexture extends BaseTexture {
        /**
         * The current texture matrix. (will always be identity in color grading texture)
         */
        private _textureMatrix;
        /**
         * The texture URL.
         */
        url: string;
        /**
         * Empty line regex stored for GC.
         */
        private static _noneEmptyLineRegex;
        private _engine;
        /**
         * Instantiates a ColorGradingTexture from the following parameters.
         *
         * @param url The location of the color gradind data (currently only supporting 3dl)
         * @param scene The scene the texture will be used in
         */
        constructor(url: string, scene: Scene);
        /**
         * Returns the texture matrix used in most of the material.
         * This is not used in color grading but keep for troubleshooting purpose (easily swap diffuse by colorgrading to look in).
         */
        getTextureMatrix(): Matrix;
        /**
         * Occurs when the file being loaded is a .3dl LUT file.
         */
        private load3dlTexture();
        /**
         * Starts the loading process of the texture.
         */
        private loadTexture();
        /**
         * Clones the color gradind texture.
         */
        clone(): ColorGradingTexture;
        /**
         * Called during delayed load for textures.
         */
        delayLoad(): void;
        /**
         * Parses a color grading texture serialized by Babylon.
         * @param parsedTexture The texture information being parsedTexture
         * @param scene The scene to load the texture in
         * @param rootUrl The root url of the data assets to load
         * @return A color gradind texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<ColorGradingTexture>;
        /**
         * Serializes the LUT texture to json format.
         */
        serialize(): any;
    }
}

declare module 'babylonjs/core' {
    /**
     * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
     * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
     * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
     * corresponding to low luminance, medium luminance, and high luminance areas respectively.
     */
    class ColorCurves {
        private _dirty;
        private _tempColor;
        private _globalCurve;
        private _highlightsCurve;
        private _midtonesCurve;
        private _shadowsCurve;
        private _positiveCurve;
        private _negativeCurve;
        private _globalHue;
        private _globalDensity;
        private _globalSaturation;
        private _globalExposure;
        /**
         * Gets the global Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the global Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        globalHue: number;
        /**
         * Gets the global Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the global Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        globalDensity: number;
        /**
         * Gets the global Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the global Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        globalSaturation: number;
        private _highlightsHue;
        private _highlightsDensity;
        private _highlightsSaturation;
        private _highlightsExposure;
        /**
         * Gets the highlights Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the highlights Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        highlightsHue: number;
        /**
         * Gets the highlights Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the highlights Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        highlightsDensity: number;
        /**
         * Gets the highlights Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the highlights Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        highlightsSaturation: number;
        /**
         * Gets the highlights Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        /**
         * Sets the highlights Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        highlightsExposure: number;
        private _midtonesHue;
        private _midtonesDensity;
        private _midtonesSaturation;
        private _midtonesExposure;
        /**
         * Gets the midtones Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the midtones Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        midtonesHue: number;
        /**
         * Gets the midtones Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the midtones Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        midtonesDensity: number;
        /**
         * Gets the midtones Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the midtones Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        midtonesSaturation: number;
        /**
         * Gets the midtones Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        /**
         * Sets the midtones Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        midtonesExposure: number;
        private _shadowsHue;
        private _shadowsDensity;
        private _shadowsSaturation;
        private _shadowsExposure;
        /**
         * Gets the shadows Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        /**
         * Sets the shadows Hue value.
         * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
         */
        shadowsHue: number;
        /**
         * Gets the shadows Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        /**
         * Sets the shadows Density value.
         * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
         * Values less than zero provide a filter of opposite hue.
         */
        shadowsDensity: number;
        /**
         * Gets the shadows Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        /**
         * Sets the shadows Saturation value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
         */
        shadowsSaturation: number;
        /**
         * Gets the shadows Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        /**
         * Sets the shadows Exposure value.
         * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
         */
        shadowsExposure: number;
        getClassName(): string;
        /**
         * Binds the color curves to the shader.
         * @param colorCurves The color curve to bind
         * @param effect The effect to bind to
         */
        static Bind(colorCurves: ColorCurves, effect: Effect, positiveUniform?: string, neutralUniform?: string, negativeUniform?: string): void;
        /**
         * Prepare the list of uniforms associated with the ColorCurves effects.
         * @param uniformsList The list of uniforms used in the effect
         */
        static PrepareUniforms(uniformsList: string[]): void;
        /**
         * Returns color grading data based on a hue, density, saturation and exposure value.
         * @param filterHue The hue of the color filter.
         * @param filterDensity The density of the color filter.
         * @param saturation The saturation.
         * @param exposure The exposure.
         * @param result The result data container.
         */
        private getColorGradingDataToRef(hue, density, saturation, exposure, result);
        /**
         * Takes an input slider value and returns an adjusted value that provides extra control near the centre.
         * @param value The input slider value in range [-100,100].
         * @returns Adjusted value.
         */
        private static applyColorGradingSliderNonlinear(value);
        /**
         * Returns an RGBA Color4 based on Hue, Saturation and Brightness (also referred to as value, HSV).
         * @param hue The hue (H) input.
         * @param saturation The saturation (S) input.
         * @param brightness The brightness (B) input.
         * @result An RGBA color represented as Vector4.
         */
        private static fromHSBToRef(hue, saturation, brightness, result);
        /**
         * Returns a value clamped between min and max
         * @param value The value to clamp
         * @param min The minimum of value
         * @param max The maximum of value
         * @returns The clamped value.
         */
        private static clamp(value, min, max);
        /**
         * Clones the current color curve instance.
         * @return The cloned curves
         */
        clone(): ColorCurves;
        /**
         * Serializes the current color curve instance to a json representation.
         * @return a JSON representation
         */
        serialize(): any;
        /**
         * Parses the color curve from a json representation.
         * @param source the JSON source to parse
         * @return The parsed curves
         */
        static Parse(source: any): ColorCurves;
    }
}

declare module 'babylonjs/core' {
    interface Behavior<T extends Node> {
        name: string;
        init(): void;
        attach(node: T): void;
        detach(): void;
    }
}

declare module 'babylonjs/core' {
    class MaterialHelper {
        static BindEyePosition(effect: Effect, scene: Scene): void;
        static PrepareDefinesForMergedUV(texture: BaseTexture, defines: any, key: string): void;
        static BindTextureMatrix(texture: BaseTexture, uniformBuffer: UniformBuffer, key: string): void;
        static PrepareDefinesForMisc(mesh: AbstractMesh, scene: Scene, useLogarithmicDepth: boolean, pointsCloud: boolean, fogEnabled: boolean, defines: any): void;
        static PrepareDefinesForFrameBoundValues(scene: Scene, engine: Engine, defines: any, useInstances: boolean, forceAlphaTest?: boolean): void;
        static PrepareDefinesForAttributes(mesh: AbstractMesh, defines: any, useVertexColor: boolean, useBones: boolean, useMorphTargets?: boolean, useVertexAlpha?: boolean): boolean;
        static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: any, specularSupported: boolean, maxSimultaneousLights?: number, disableLighting?: boolean): boolean;
        static PrepareUniformsAndSamplersList(uniformsListOrOptions: string[] | EffectCreationOptions, samplersList?: string[], defines?: any, maxSimultaneousLights?: number): void;
        static HandleFallbacksForShadows(defines: any, fallbacks: EffectFallbacks, maxSimultaneousLights?: number, rank?: number): number;
        static PrepareAttributesForMorphTargets(attribs: string[], mesh: AbstractMesh, defines: any): void;
        static PrepareAttributesForBones(attribs: string[], mesh: AbstractMesh, defines: any, fallbacks: EffectFallbacks): void;
        static PrepareAttributesForInstances(attribs: string[], defines: any): void;
        static BindLightShadow(light: Light, scene: Scene, mesh: AbstractMesh, lightIndex: string, effect: Effect): void;
        static BindLightProperties(light: Light, effect: Effect, lightIndex: number): void;
        static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: any, maxSimultaneousLights?: number, usePhysicalLightFalloff?: boolean): void;
        static BindFogParameters(scene: Scene, mesh: AbstractMesh, effect: Effect): void;
        static BindBonesParameters(mesh?: AbstractMesh, effect?: Effect): void;
        static BindMorphTargetParameters(abstractMesh: AbstractMesh, effect: Effect): void;
        static BindLogDepth(defines: any, effect: Effect, scene: Scene): void;
        static BindClipPlane(effect: Effect, scene: Scene): void;
    }
}

declare module 'babylonjs/core' {
    class PushMaterial extends Material {
        protected _activeEffect: Effect;
        constructor(name: string, scene: Scene);
        getEffect(): Effect;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        bindOnlyWorldMatrix(world: Matrix): void;
        bind(world: Matrix, mesh?: Mesh): void;
        protected _afterBind(mesh: Mesh, effect?: Nullable<Effect>): void;
        protected _mustRebind(scene: Scene, effect: Effect, visibility?: number): boolean;
    }
}

declare module 'babylonjs/core' {
    class StandardMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
        MAINUV1: boolean;
        MAINUV2: boolean;
        DIFFUSE: boolean;
        DIFFUSEDIRECTUV: number;
        AMBIENT: boolean;
        AMBIENTDIRECTUV: number;
        OPACITY: boolean;
        OPACITYDIRECTUV: number;
        OPACITYRGB: boolean;
        REFLECTION: boolean;
        EMISSIVE: boolean;
        EMISSIVEDIRECTUV: number;
        SPECULAR: boolean;
        SPECULARDIRECTUV: number;
        BUMP: boolean;
        BUMPDIRECTUV: number;
        PARALLAX: boolean;
        PARALLAXOCCLUSION: boolean;
        SPECULAROVERALPHA: boolean;
        CLIPPLANE: boolean;
        ALPHATEST: boolean;
        DEPTHPREPASS: boolean;
        ALPHAFROMDIFFUSE: boolean;
        POINTSIZE: boolean;
        FOG: boolean;
        SPECULARTERM: boolean;
        DIFFUSEFRESNEL: boolean;
        OPACITYFRESNEL: boolean;
        REFLECTIONFRESNEL: boolean;
        REFRACTIONFRESNEL: boolean;
        EMISSIVEFRESNEL: boolean;
        FRESNEL: boolean;
        NORMAL: boolean;
        UV1: boolean;
        UV2: boolean;
        VERTEXCOLOR: boolean;
        VERTEXALPHA: boolean;
        NUM_BONE_INFLUENCERS: number;
        BonesPerMesh: number;
        INSTANCES: boolean;
        GLOSSINESS: boolean;
        ROUGHNESS: boolean;
        EMISSIVEASILLUMINATION: boolean;
        LINKEMISSIVEWITHDIFFUSE: boolean;
        REFLECTIONFRESNELFROMSPECULAR: boolean;
        LIGHTMAP: boolean;
        LIGHTMAPDIRECTUV: number;
        USELIGHTMAPASSHADOWMAP: boolean;
        REFLECTIONMAP_3D: boolean;
        REFLECTIONMAP_SPHERICAL: boolean;
        REFLECTIONMAP_PLANAR: boolean;
        REFLECTIONMAP_CUBIC: boolean;
        REFLECTIONMAP_PROJECTION: boolean;
        REFLECTIONMAP_SKYBOX: boolean;
        REFLECTIONMAP_EXPLICIT: boolean;
        REFLECTIONMAP_EQUIRECTANGULAR: boolean;
        REFLECTIONMAP_EQUIRECTANGULAR_FIXED: boolean;
        REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED: boolean;
        INVERTCUBICMAP: boolean;
        LOGARITHMICDEPTH: boolean;
        REFRACTION: boolean;
        REFRACTIONMAP_3D: boolean;
        REFLECTIONOVERALPHA: boolean;
        TWOSIDEDLIGHTING: boolean;
        SHADOWFLOAT: boolean;
        MORPHTARGETS: boolean;
        MORPHTARGETS_NORMAL: boolean;
        MORPHTARGETS_TANGENT: boolean;
        NUM_MORPH_INFLUENCERS: number;
        NONUNIFORMSCALING: boolean;
        PREMULTIPLYALPHA: boolean;
        IMAGEPROCESSING: boolean;
        VIGNETTE: boolean;
        VIGNETTEBLENDMODEMULTIPLY: boolean;
        VIGNETTEBLENDMODEOPAQUE: boolean;
        TONEMAPPING: boolean;
        CONTRAST: boolean;
        COLORCURVES: boolean;
        COLORGRADING: boolean;
        COLORGRADING3D: boolean;
        SAMPLER3DGREENDEPTH: boolean;
        SAMPLER3DBGRMAP: boolean;
        IMAGEPROCESSINGPOSTPROCESS: boolean;
        EXPOSURE: boolean;
        constructor();
        setReflectionMode(modeToEnable: string): void;
    }
    class StandardMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: Nullable<BaseTexture>;
        private _ambientTexture;
        ambientTexture: Nullable<BaseTexture>;
        private _opacityTexture;
        opacityTexture: Nullable<BaseTexture>;
        private _reflectionTexture;
        reflectionTexture: Nullable<BaseTexture>;
        private _emissiveTexture;
        emissiveTexture: Nullable<BaseTexture>;
        private _specularTexture;
        specularTexture: Nullable<BaseTexture>;
        private _bumpTexture;
        bumpTexture: Nullable<BaseTexture>;
        private _lightmapTexture;
        lightmapTexture: Nullable<BaseTexture>;
        private _refractionTexture;
        refractionTexture: Nullable<BaseTexture>;
        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        emissiveColor: Color3;
        specularPower: number;
        private _useAlphaFromDiffuseTexture;
        useAlphaFromDiffuseTexture: boolean;
        private _useEmissiveAsIllumination;
        useEmissiveAsIllumination: boolean;
        private _linkEmissiveWithDiffuse;
        linkEmissiveWithDiffuse: boolean;
        private _useSpecularOverAlpha;
        useSpecularOverAlpha: boolean;
        private _useReflectionOverAlpha;
        useReflectionOverAlpha: boolean;
        private _disableLighting;
        disableLighting: boolean;
        private _useParallax;
        useParallax: boolean;
        private _useParallaxOcclusion;
        useParallaxOcclusion: boolean;
        parallaxScaleBias: number;
        private _roughness;
        roughness: number;
        indexOfRefraction: number;
        invertRefractionY: boolean;
        private _useLightmapAsShadowmap;
        useLightmapAsShadowmap: boolean;
        private _diffuseFresnelParameters;
        diffuseFresnelParameters: FresnelParameters;
        private _opacityFresnelParameters;
        opacityFresnelParameters: FresnelParameters;
        private _reflectionFresnelParameters;
        reflectionFresnelParameters: FresnelParameters;
        private _refractionFresnelParameters;
        refractionFresnelParameters: FresnelParameters;
        private _emissiveFresnelParameters;
        emissiveFresnelParameters: FresnelParameters;
        private _useReflectionFresnelFromSpecular;
        useReflectionFresnelFromSpecular: boolean;
        private _useGlossinessFromSpecularMapAlpha;
        useGlossinessFromSpecularMapAlpha: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        private _invertNormalMapX;
        invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        private _invertNormalMapY;
        invertNormalMapY: boolean;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        private _twoSidedLighting;
        twoSidedLighting: boolean;
        /**
         * Default configuration related to image processing available in the standard Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the Standard Material.
         * @param configuration
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: number;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: number;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
        customShaderNameResolve: (shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines) => string;
        protected _renderTargets: SmartArray<RenderTargetTexture>;
        protected _worldViewProjectionMatrix: Matrix;
        protected _globalAmbientColor: Color3;
        protected _useLogarithmicDepth: boolean;
        constructor(name: string, scene: Scene);
        getClassName(): string;
        useLogarithmicDepth: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        protected _shouldUseAlphaFromDiffuseTexture(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        /**
         * Child classes can use it to update shaders
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        buildUniformLayout(): void;
        unbind(): void;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        clone(name: string): StandardMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial;
        static _DiffuseTextureEnabled: boolean;
        static DiffuseTextureEnabled: boolean;
        static _AmbientTextureEnabled: boolean;
        static AmbientTextureEnabled: boolean;
        static _OpacityTextureEnabled: boolean;
        static OpacityTextureEnabled: boolean;
        static _ReflectionTextureEnabled: boolean;
        static ReflectionTextureEnabled: boolean;
        static _EmissiveTextureEnabled: boolean;
        static EmissiveTextureEnabled: boolean;
        static _SpecularTextureEnabled: boolean;
        static SpecularTextureEnabled: boolean;
        static _BumpTextureEnabled: boolean;
        static BumpTextureEnabled: boolean;
        static _LightmapTextureEnabled: boolean;
        static LightmapTextureEnabled: boolean;
        static _RefractionTextureEnabled: boolean;
        static RefractionTextureEnabled: boolean;
        static _ColorGradingTextureEnabled: boolean;
        static ColorGradingTextureEnabled: boolean;
        static _FresnelEnabled: boolean;
        static FresnelEnabled: boolean;
    }
}

import {EngineInstrumentation,SceneInstrumentation,_TimeToken} from 'babylonjs/instrumentation';
import {Particle,IParticleSystem,ParticleSystem,BoxParticleEmitter,ConeParticleEmitter,SphereParticleEmitter,SphereDirectedParticleEmitter,IParticleEmitterType} from 'babylonjs/particles';
import {GPUParticleSystem} from 'babylonjs/gpuParticles';
import {FramingBehavior,BouncingBehavior,AutoRotationBehavior} from 'babylonjs/cameraBehaviors';
import {NullEngineOptions,NullEngine} from 'babylonjs/nullEngine';
import {TextureTools} from 'babylonjs/textureTools';
import {SolidParticle,ModelShape,DepthSortedParticle,SolidParticleSystem} from 'babylonjs/solidParticles';
import {Collider,CollisionWorker,ICollisionCoordinator,SerializedMesh,SerializedSubMesh,SerializedGeometry,BabylonMessage,SerializedColliderToWorker,WorkerTaskType,WorkerReply,CollisionReplyPayload,InitPayload,CollidePayload,UpdatePayload,WorkerReplyType,CollisionCoordinatorWorker,CollisionCoordinatorLegacy} from 'babylonjs/collisions';
import {IntersectionInfo,PickingInfo,Ray} from 'babylonjs/picking';
import {SpriteManager,Sprite} from 'babylonjs/sprites';
import {AnimationRange,AnimationEvent,PathCursor,Animation,TargetedAnimation,AnimationGroup,RuntimeAnimation,Animatable,IEasingFunction,EasingFunction,CircleEase,BackEase,BounceEase,CubicEase,ElasticEase,ExponentialEase,PowerEase,QuadraticEase,QuarticEase,QuinticEase,SineEase,BezierCurveEase} from 'babylonjs/animations';
import {Condition,ValueCondition,PredicateCondition,StateCondition,Action,ActionEvent,ActionManager,InterpolateValueAction,SwitchBooleanAction,SetStateAction,SetValueAction,IncrementValueAction,PlayAnimationAction,StopAnimationAction,DoNothingAction,CombineAction,ExecuteCodeAction,SetParentAction,PlaySoundAction,StopSoundAction} from 'babylonjs/actions';
import {GroundMesh,InstancedMesh,LinesMesh} from 'babylonjs/additionalMeshes';
import {ShaderMaterial} from 'babylonjs/shaderMaterial';
import {MeshBuilder} from 'babylonjs/meshBuilder';
import {PBRBaseMaterial,PBRBaseSimpleMaterial,PBRMaterial,PBRMetallicRoughnessMaterial,PBRSpecularGlossinessMaterial} from 'babylonjs/pbrMaterial';
import {CameraInputTypes,ICameraInput,CameraInputsMap,CameraInputsManager,TargetCamera} from 'babylonjs/targetCamera';
import {ArcRotateCameraKeyboardMoveInput,ArcRotateCameraMouseWheelInput,ArcRotateCameraPointersInput,ArcRotateCameraInputsManager,ArcRotateCamera} from 'babylonjs/arcRotateCamera';
import {FreeCameraMouseInput,FreeCameraKeyboardMoveInput,FreeCameraInputsManager,FreeCamera} from 'babylonjs/freeCamera';
import {HemisphericLight} from 'babylonjs/hemisphericLight';
import {IShadowLight,ShadowLight,PointLight} from 'babylonjs/pointLight';
import {DirectionalLight} from 'babylonjs/directionalLight';
import {SpotLight} from 'babylonjs/spotLight';
import {CubeTexture,RenderTargetTexture,IMultiRenderTargetOptions,MultiRenderTarget,MirrorTexture,RefractionTexture,DynamicTexture,VideoTexture,RawTexture} from 'babylonjs/additionalTextures';
import {AudioEngine,Sound,SoundTrack,Analyser} from 'babylonjs/audio';
import {ILoadingScreen,DefaultLoadingScreen,SceneLoaderProgressEvent,ISceneLoaderPluginExtensions,ISceneLoaderPluginFactory,ISceneLoaderPlugin,ISceneLoaderPluginAsync,SceneLoader,FilesInput} from 'babylonjs/loader';
import {IShadowGenerator,ShadowGenerator} from 'babylonjs/shadows';
import {StringDictionary} from 'babylonjs/stringDictionary';
import {Tags,AndOrNotEvaluator} from 'babylonjs/userData';
import {FresnelParameters} from 'babylonjs/fresnel';
import {MultiMaterial} from 'babylonjs/multiMaterial';
import {Database} from 'babylonjs/offline';
import {FreeCameraTouchInput,TouchCamera} from 'babylonjs/touchCamera';
import {ProceduralTexture,CustomProceduralTexture} from 'babylonjs/procedural';
import {FreeCameraGamepadInput,ArcRotateCameraGamepadInput,GamepadManager,StickValues,GamepadButtonChanges,Gamepad,GenericPad,Xbox360Button,Xbox360Dpad,Xbox360Pad,PoseEnabledControllerType,MutableGamepadButton,ExtendedGamepadButton,PoseEnabledControllerHelper,PoseEnabledController,WebVRController,OculusTouchController,ViveController,GenericController,WindowsMotionController} from 'babylonjs/gamepad';
import {FollowCamera,ArcFollowCamera,UniversalCamera,GamepadCamera} from 'babylonjs/additionalCameras';
import {DepthRenderer} from 'babylonjs/depthRenderer';
import {GeometryBufferRenderer} from 'babylonjs/geometryBufferRenderer';
import {PostProcessOptions,PostProcess,PassPostProcess} from 'babylonjs/postProcesses';
import {BlurPostProcess} from 'babylonjs/additionalPostProcess_blur';
import {FxaaPostProcess} from 'babylonjs/additionalPostProcess_fxaa';
import {HighlightsPostProcess} from 'babylonjs/additionalPostProcess_highlights';
import {RefractionPostProcess,BlackAndWhitePostProcess,ConvolutionPostProcess,FilterPostProcess,VolumetricLightScatteringPostProcess,ColorCorrectionPostProcess,TonemappingOperator,TonemapPostProcess,DisplayPassPostProcess,ImageProcessingPostProcess} from 'babylonjs/additionalPostProcesses';
import {PostProcessRenderPipelineManager,PostProcessRenderPass,PostProcessRenderEffect,PostProcessRenderPipeline} from 'babylonjs/renderingPipeline';
import {SSAORenderingPipeline,SSAO2RenderingPipeline,LensRenderingPipeline,StandardRenderingPipeline} from 'babylonjs/additionalRenderingPipeline';
import {DefaultRenderingPipeline} from 'babylonjs/defaultRenderingPipeline';
import {Bone,BoneIKController,BoneLookController,Skeleton} from 'babylonjs/bones';
import {SphericalPolynomial,SphericalHarmonics,CubeMapToSphericalPolynomialTools,CubeMapInfo,PanoramaToCubeMapTools,HDRInfo,HDRTools,HDRCubeTexture} from 'babylonjs/hdr';
import {CSG} from 'babylonjs/csg';
import {Polygon,PolygonMeshBuilder} from 'babylonjs/polygonMesh';
import {LensFlare,LensFlareSystem} from 'babylonjs/lensFlares';
import {PhysicsJointData,PhysicsJoint,DistanceJoint,MotorEnabledJoint,HingeJoint,Hinge2Joint,IMotorEnabledJoint,DistanceJointData,SpringJointData,PhysicsImpostorParameters,IPhysicsEnabledObject,PhysicsImpostor,PhysicsImpostorJoint,PhysicsEngine,IPhysicsEnginePlugin,PhysicsHelper,PhysicsRadialExplosionEvent,PhysicsGravitationalFieldEvent,PhysicsUpdraftEvent,PhysicsVortexEvent,PhysicsRadialImpulseFalloff,PhysicsUpdraftMode,PhysicsForceAndContactPoint,PhysicsRadialExplosionEventData,PhysicsGravitationalFieldEventData,PhysicsUpdraftEventData,PhysicsVortexEventData,CannonJSPlugin,OimoJSPlugin} from 'babylonjs/physics';
import {TGATools,DDSInfo,DDSTools,KhronosTextureContainer} from 'babylonjs/textureFormats';
import {Debug,RayHelper,DebugLayer,BoundingBoxRenderer} from 'babylonjs/debug';
import {MorphTarget,MorphTargetManager} from 'babylonjs/morphTargets';
import {IOctreeContainer,Octree,OctreeBlock} from 'babylonjs/octrees';
import {SIMDHelper} from 'babylonjs/simd';
import {VRDistortionCorrectionPostProcess,AnaglyphPostProcess,StereoscopicInterlacePostProcess,FreeCameraDeviceOrientationInput,ArcRotateCameraVRDeviceOrientationInput,VRCameraMetrics,DevicePose,PoseControlled,WebVROptions,WebVRFreeCamera,DeviceOrientationCamera,VRDeviceOrientationFreeCamera,VRDeviceOrientationGamepadCamera,VRDeviceOrientationArcRotateCamera,AnaglyphFreeCamera,AnaglyphArcRotateCamera,AnaglyphGamepadCamera,AnaglyphUniversalCamera,StereoscopicFreeCamera,StereoscopicArcRotateCamera,StereoscopicGamepadCamera,StereoscopicUniversalCamera,VRTeleportationOptions,VRExperienceHelperOptions,VRExperienceHelper} from 'babylonjs/vr';
import {JoystickAxis,VirtualJoystick,VirtualJoysticksCamera,FreeCameraVirtualJoystickInput} from 'babylonjs/virtualJoystick';
import {ISimplifier,ISimplificationSettings,SimplificationSettings,ISimplificationTask,SimplificationQueue,SimplificationType,DecimationTriangle,DecimationVertex,QuadraticMatrix,Reference,QuadraticErrorSimplification,MeshLODLevel,SceneOptimization,TextureOptimization,HardwareScalingOptimization,ShadowsOptimization,PostProcessesOptimization,LensFlaresOptimization,ParticlesOptimization,RenderTargetsOptimization,MergeMeshesOptimization,SceneOptimizerOptions,SceneOptimizer} from 'babylonjs/optimizations';
import {OutlineRenderer,EdgesRenderer,IHighlightLayerOptions,HighlightLayer} from 'babylonjs/highlights';
import {SceneSerializer} from 'babylonjs/serialization';
import {AssetTaskState,AbstractAssetTask,IAssetsProgressEvent,AssetsProgressEvent,MeshAssetTask,TextFileAssetTask,BinaryFileAssetTask,ImageAssetTask,ITextureAssetTask,TextureAssetTask,CubeTextureAssetTask,HDRCubeTextureAssetTask,AssetsManager} from 'babylonjs/assetsManager';
import {ReflectionProbe} from 'babylonjs/probes';
import {BackgroundMaterial} from 'babylonjs/backgroundMaterial';
import {Layer} from 'babylonjs/layer';
import {IEnvironmentHelperOptions,EnvironmentHelper} from 'babylonjs/environmentHelper';

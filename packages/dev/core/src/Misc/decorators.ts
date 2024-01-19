/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import { Tags } from "../Misc/tags";
import type { Nullable } from "../types";
import { Quaternion, Vector2, Vector3, Matrix } from "../Maths/math.vector";
import { _WarnImport } from "./devTools";
import type { IAnimatable } from "../Animations/animatable.interface";
import { Color4, Color3 } from "../Maths/math.color";

import type { Scene } from "../scene";
import type { Camera } from "../Cameras/camera";

import type { ImageProcessingConfiguration } from "../Materials/imageProcessingConfiguration";
import type { FresnelParameters } from "../Materials/fresnelParameters";
import type { ColorCurves } from "../Materials/colorCurves";
import type { BaseTexture } from "../Materials/Textures/baseTexture";

const __decoratorInitialStore = {};
const __mergedStore = {};

/** @internal */
export interface CopySourceOptions {
    /*
     * if a texture is used in more than one channel (e.g diffuse and opacity),
     * only clone it once and reuse it on the other channels. Default false
     */
    cloneTexturesOnlyOnce?: boolean;
}

const _copySource = function <T>(creationFunction: () => T, source: T, instanciate: boolean, options: CopySourceOptions = {}): T {
    const destination = creationFunction();

    // Tags
    if (Tags && Tags.HasTags(source)) {
        Tags.AddTagsTo(destination, Tags.GetTags(source, true));
    }

    const classStore = getMergedStore(destination);

    // Map from source texture uniqueId to destination texture
    const textureMap: Record<number, any> = {};

    // Properties
    for (const property in classStore) {
        const propertyDescriptor = classStore[property];
        const sourceProperty = (<any>source)[property];
        const propertyType = propertyDescriptor.type;

        if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
            switch (propertyType) {
                case 0: // Value
                case 6: // Mesh reference
                case 11: // Camera reference
                    (<any>destination)[property] = sourceProperty;
                    break;
                case 1: // Texture
                    if (options.cloneTexturesOnlyOnce && textureMap[sourceProperty.uniqueId]) {
                        (<any>destination)[property] = textureMap[sourceProperty.uniqueId];
                    } else {
                        (<any>destination)[property] = instanciate || sourceProperty.isRenderTarget ? sourceProperty : sourceProperty.clone();
                        textureMap[sourceProperty.uniqueId] = (<any>destination)[property];
                    }
                    break;
                case 2: // Color3
                case 3: // FresnelParameters
                case 4: // Vector2
                case 5: // Vector3
                case 7: // Color Curves
                case 10: // Quaternion
                case 12: // Matrix
                    (<any>destination)[property] = instanciate ? sourceProperty : sourceProperty.clone();
                    break;
            }
        }
    }

    return destination;
};

function getDirectStore(target: any): any {
    const classKey = target.getClassName();

    if (!(<any>__decoratorInitialStore)[classKey]) {
        (<any>__decoratorInitialStore)[classKey] = {};
    }

    return (<any>__decoratorInitialStore)[classKey];
}

/**
 * @returns the list of properties flagged as serializable
 * @param target host object
 */
function getMergedStore(target: any): any {
    const classKey = target.getClassName();

    if ((<any>__mergedStore)[classKey]) {
        return (<any>__mergedStore)[classKey];
    }

    (<any>__mergedStore)[classKey] = {};

    const store = (<any>__mergedStore)[classKey];
    let currentTarget = target;
    let currentKey = classKey;
    while (currentKey) {
        const initialStore = (<any>__decoratorInitialStore)[currentKey];
        for (const property in initialStore) {
            store[property] = initialStore[property];
        }

        let parent: any;
        let done = false;

        do {
            parent = Object.getPrototypeOf(currentTarget);
            if (!parent.getClassName) {
                done = true;
                break;
            }

            if (parent.getClassName() !== currentKey) {
                break;
            }

            currentTarget = parent;
        } while (parent);

        if (done) {
            break;
        }

        currentKey = parent.getClassName();
        currentTarget = parent;
    }

    return store;
}

function generateSerializableMember(type: number, sourceName?: string) {
    return (target: any, propertyKey: string | symbol) => {
        const classStore = getDirectStore(target);

        if (!classStore[propertyKey]) {
            classStore[propertyKey] = { type: type, sourceName: sourceName };
        }
    };
}

function generateExpandMember(setCallback: string, targetKey: Nullable<string> = null) {
    return (target: any, propertyKey: string) => {
        const key = targetKey || "_" + propertyKey;
        Object.defineProperty(target, propertyKey, {
            get: function (this: any) {
                return this[key];
            },
            set: function (this: any, value) {
                // does this object (i.e. vector3) has an equals function? use it!
                // Note - not using "with epsilon" here, it is expected te behave like the internal cache does.
                if (typeof this.equals === "function") {
                    if (this.equals(value)) {
                        return;
                    }
                }
                if (this[key] === value) {
                    return;
                }
                this[key] = value;

                target[setCallback].apply(this);
            },
            enumerable: true,
            configurable: true,
        });
    };
}

export function expandToProperty(callback: string, targetKey: Nullable<string> = null) {
    return generateExpandMember(callback, targetKey);
}

export function serialize(sourceName?: string) {
    return generateSerializableMember(0, sourceName); // value member
}

export function serializeAsTexture(sourceName?: string) {
    return generateSerializableMember(1, sourceName); // texture member
}

export function serializeAsColor3(sourceName?: string) {
    return generateSerializableMember(2, sourceName); // color3 member
}

export function serializeAsFresnelParameters(sourceName?: string) {
    return generateSerializableMember(3, sourceName); // fresnel parameters member
}

export function serializeAsVector2(sourceName?: string) {
    return generateSerializableMember(4, sourceName); // vector2 member
}

export function serializeAsVector3(sourceName?: string) {
    return generateSerializableMember(5, sourceName); // vector3 member
}

export function serializeAsMeshReference(sourceName?: string) {
    return generateSerializableMember(6, sourceName); // mesh reference member
}

export function serializeAsColorCurves(sourceName?: string) {
    return generateSerializableMember(7, sourceName); // color curves
}

export function serializeAsColor4(sourceName?: string) {
    return generateSerializableMember(8, sourceName); // color 4
}

export function serializeAsImageProcessingConfiguration(sourceName?: string) {
    return generateSerializableMember(9, sourceName); // image processing
}

export function serializeAsQuaternion(sourceName?: string) {
    return generateSerializableMember(10, sourceName); // quaternion member
}

export function serializeAsMatrix(sourceName?: string) {
    return generateSerializableMember(12, sourceName); // matrix member
}

/**
 * Decorator used to define property that can be serialized as reference to a camera
 * @param sourceName defines the name of the property to decorate
 * @returns Property Decorator
 */
export function serializeAsCameraReference(sourceName?: string) {
    return generateSerializableMember(11, sourceName); // camera reference member
}

/**
 * Class used to help serialization objects
 */
export class SerializationHelper {
    /**
     * Gets or sets a boolean to indicate if the UniqueId property should be serialized
     */
    public static AllowLoadingUniqueId = false;

    /**
     * @internal
     */
    public static _ImageProcessingConfigurationParser = (sourceProperty: any): ImageProcessingConfiguration => {
        throw _WarnImport("ImageProcessingConfiguration");
    };

    /**
     * @internal
     */
    public static _FresnelParametersParser = (sourceProperty: any): FresnelParameters => {
        throw _WarnImport("FresnelParameters");
    };

    /**
     * @internal
     */
    public static _ColorCurvesParser = (sourceProperty: any): ColorCurves => {
        throw _WarnImport("ColorCurves");
    };

    /**
     * @internal
     */
    public static _TextureParser = (sourceProperty: any, scene: Scene, rootUrl: string): Nullable<BaseTexture> => {
        throw _WarnImport("Texture");
    };

    /**
     * Appends the serialized animations from the source animations
     * @param source Source containing the animations
     * @param destination Target to store the animations
     */
    public static AppendSerializedAnimations(source: IAnimatable, destination: any): void {
        if (source.animations) {
            destination.animations = [];
            for (let animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                const animation = source.animations[animationIndex];

                destination.animations.push(animation.serialize());
            }
        }
    }

    /**
     * Static function used to serialized a specific entity
     * @param entity defines the entity to serialize
     * @param serializationObject defines the optional target object where serialization data will be stored
     * @returns a JSON compatible object representing the serialization of the entity
     */
    public static Serialize<T>(entity: T, serializationObject?: any): any {
        if (!serializationObject) {
            serializationObject = {};
        }

        // Tags
        if (Tags) {
            serializationObject.tags = Tags.GetTags(entity);
        }

        const serializedProperties = getMergedStore(entity);

        // Properties
        for (const property in serializedProperties) {
            const propertyDescriptor = serializedProperties[property];
            const targetPropertyName = propertyDescriptor.sourceName || property;
            const propertyType = propertyDescriptor.type;
            const sourceProperty = (<any>entity)[property];

            if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
                switch (propertyType) {
                    case 0: // Value
                        serializationObject[targetPropertyName] = sourceProperty;
                        break;
                    case 1: // Texture
                        serializationObject[targetPropertyName] = sourceProperty.serialize();
                        break;
                    case 2: // Color3
                        serializationObject[targetPropertyName] = sourceProperty.asArray();
                        break;
                    case 3: // FresnelParameters
                        serializationObject[targetPropertyName] = sourceProperty.serialize();
                        break;
                    case 4: // Vector2
                        serializationObject[targetPropertyName] = sourceProperty.asArray();
                        break;
                    case 5: // Vector3
                        serializationObject[targetPropertyName] = sourceProperty.asArray();
                        break;
                    case 6: // Mesh reference
                        serializationObject[targetPropertyName] = sourceProperty.id;
                        break;
                    case 7: // Color Curves
                        serializationObject[targetPropertyName] = sourceProperty.serialize();
                        break;
                    case 8: // Color 4
                        serializationObject[targetPropertyName] = (<Color4>sourceProperty).asArray();
                        break;
                    case 9: // Image Processing
                        serializationObject[targetPropertyName] = (<ImageProcessingConfiguration>sourceProperty).serialize();
                        break;
                    case 10: // Quaternion
                        serializationObject[targetPropertyName] = (<Quaternion>sourceProperty).asArray();
                        break;
                    case 11: // Camera reference
                        serializationObject[targetPropertyName] = (<Camera>sourceProperty).id;
                        break;
                    case 12: // Matrix
                        serializationObject[targetPropertyName] = (<Matrix>sourceProperty).asArray();
                        break;
                }
            }
        }

        return serializationObject;
    }

    /**
     * Given a source json and a destination object in a scene, this function will parse the source and will try to apply its content to the destination object
     * @param source the source json data
     * @param destination the destination object
     * @param scene the scene where the object is
     * @param rootUrl root url to use to load assets
     */
    public static ParseProperties(source: any, destination: any, scene: Nullable<Scene>, rootUrl: Nullable<string>) {
        if (!rootUrl) {
            rootUrl = "";
        }

        const classStore = getMergedStore(destination);

        // Properties
        for (const property in classStore) {
            const propertyDescriptor = classStore[property];
            const sourceProperty = source[propertyDescriptor.sourceName || property];
            const propertyType = propertyDescriptor.type;

            if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
                const dest = <any>destination;
                switch (propertyType) {
                    case 0: // Value
                        dest[property] = sourceProperty;
                        break;
                    case 1: // Texture
                        if (scene) {
                            dest[property] = SerializationHelper._TextureParser(sourceProperty, scene, rootUrl);
                        }
                        break;
                    case 2: // Color3
                        dest[property] = Color3.FromArray(sourceProperty);
                        break;
                    case 3: // FresnelParameters
                        dest[property] = SerializationHelper._FresnelParametersParser(sourceProperty);
                        break;
                    case 4: // Vector2
                        dest[property] = Vector2.FromArray(sourceProperty);
                        break;
                    case 5: // Vector3
                        dest[property] = Vector3.FromArray(sourceProperty);
                        break;
                    case 6: // Mesh reference
                        if (scene) {
                            dest[property] = scene.getLastMeshById(sourceProperty);
                        }
                        break;
                    case 7: // Color Curves
                        dest[property] = SerializationHelper._ColorCurvesParser(sourceProperty);
                        break;
                    case 8: // Color 4
                        dest[property] = Color4.FromArray(sourceProperty);
                        break;
                    case 9: // Image Processing
                        dest[property] = SerializationHelper._ImageProcessingConfigurationParser(sourceProperty);
                        break;
                    case 10: // Quaternion
                        dest[property] = Quaternion.FromArray(sourceProperty);
                        break;
                    case 11: // Camera reference
                        if (scene) {
                            dest[property] = scene.getCameraById(sourceProperty);
                        }
                        break;
                    case 12: // Matrix
                        dest[property] = Matrix.FromArray(sourceProperty);
                        break;
                }
            }
        }
    }

    /**
     * Creates a new entity from a serialization data object
     * @param creationFunction defines a function used to instanciated the new entity
     * @param source defines the source serialization data
     * @param scene defines the hosting scene
     * @param rootUrl defines the root url for resources
     * @returns a new entity
     */
    public static Parse<T>(creationFunction: () => T, source: any, scene: Nullable<Scene>, rootUrl: Nullable<string> = null): T {
        const destination = creationFunction();

        // Tags
        if (Tags) {
            Tags.AddTagsTo(destination, source.tags);
        }

        SerializationHelper.ParseProperties(source, destination, scene, rootUrl);

        return destination;
    }

    /**
     * Clones an object
     * @param creationFunction defines the function used to instanciate the new object
     * @param source defines the source object
     * @param options defines the options to use
     * @returns the cloned object
     */
    public static Clone<T>(creationFunction: () => T, source: T, options: CopySourceOptions = {}): T {
        return _copySource(creationFunction, source, false, options);
    }

    /**
     * Instanciates a new object based on a source one (some data will be shared between both object)
     * @param creationFunction defines the function used to instanciate the new object
     * @param source defines the source object
     * @returns the new object
     */
    public static Instanciate<T>(creationFunction: () => T, source: T): T {
        return _copySource(creationFunction, source, true);
    }
}

/** @internal */
declare const _native: any;

/**
 * Decorator used to redirect a function to a native implementation if available.
 * @internal
 */
export function nativeOverride<T extends (...params: any[]) => boolean>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...params: Parameters<T>) => unknown>,
    predicate?: T
) {
    // Cache the original JS function for later.
    const jsFunc = descriptor.value!;

    // Override the JS function to check for a native override on first invocation. Setting descriptor.value overrides the function at the early stage of code being loaded/imported.
    descriptor.value = (...params: Parameters<T>): unknown => {
        // Assume the resolved function will be the original JS function, then we will check for the Babylon Native context.
        let func = jsFunc;

        // Check if we are executing in a Babylon Native context (e.g. check the presence of the _native global property) and if so also check if a function override is available.
        if (typeof _native !== "undefined" && _native[propertyKey]) {
            const nativeFunc = _native[propertyKey] as (...params: Parameters<T>) => unknown;
            // If a predicate was provided, then we'll need to invoke the predicate on each invocation of the underlying function to determine whether to call the native function or the JS function.
            if (predicate) {
                // The resolved function will execute the predicate and then either execute the native function or the JS function.
                func = (...params: Parameters<T>) => (predicate(...params) ? nativeFunc(...params) : jsFunc(...params));
            } else {
                // The resolved function will directly execute the native function.
                func = nativeFunc;
            }
        }

        // Override the JS function again with the final resolved target function.
        target[propertyKey] = func;

        // The JS function has now been overridden based on whether we're executing in the context of Babylon Native, but we still need to invoke that function.
        // Future invocations of the function will just directly invoke the final overridden function, not any of the decorator setup logic above.
        return func(...params);
    };
}

/**
 * Decorator factory that applies the nativeOverride decorator, but determines whether to redirect to the native implementation based on a filter function that evaluates the function arguments.
 * @param predicate
 * @example @nativeOverride.filter((...[arg1]: Parameters<typeof someClass.someMethod>) => arg1.length > 20)
 *          public someMethod(arg1: string, arg2: number): string {
 * @internal
 */
nativeOverride.filter = function <T extends (...params: any) => boolean>(predicate: T) {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...params: Parameters<T>) => unknown>) =>
        nativeOverride(target, propertyKey, descriptor, predicate);
};

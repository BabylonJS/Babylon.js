import { Tags } from "../Misc/tags";
import { Nullable } from "../types";
import { Quaternion, Vector2, Vector3, Matrix } from "../Maths/math.vector";
import { _DevTools } from './devTools';
import { IAnimatable } from '../Animations/animatable.interface';
import { Color4, Color3 } from '../Maths/math.color';

declare type Scene = import("../scene").Scene;
declare type Camera = import("../Cameras/camera").Camera;

declare type ImageProcessingConfiguration = import("../Materials/imageProcessingConfiguration").ImageProcessingConfiguration;
declare type FresnelParameters = import("../Materials/fresnelParameters").FresnelParameters;
declare type ColorCurves = import("../Materials/colorCurves").ColorCurves;
declare type BaseTexture = import("../Materials/Textures/baseTexture").BaseTexture;

var __decoratorInitialStore = {};
var __mergedStore = {};

var _copySource = function <T>(creationFunction: () => T, source: T, instanciate: boolean): T {
    var destination = creationFunction();

    // Tags
    if (Tags) {
        Tags.AddTagsTo(destination, (<any>source).tags);
    }

    var classStore = getMergedStore(destination);

    // Properties
    for (var property in classStore) {
        var propertyDescriptor = classStore[property];
        var sourceProperty = (<any>source)[property];
        var propertyType = propertyDescriptor.type;

        if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
            switch (propertyType) {
                case 0:     // Value
                case 6:     // Mesh reference
                case 11:    // Camera reference
                    (<any>destination)[property] = sourceProperty;
                    break;
                case 1:     // Texture
                    (<any>destination)[property] = (instanciate || sourceProperty.isRenderTarget) ? sourceProperty : sourceProperty.clone();
                    break;
                case 2:     // Color3
                case 3:     // FresnelParameters
                case 4:     // Vector2
                case 5:     // Vector3
                case 7:     // Color Curves
                case 10:    // Quaternion
                case 12:    // Matrix
                    (<any>destination)[property] = instanciate ? sourceProperty : sourceProperty.clone();
                    break;
            }
        }
    }

    return destination;
};

function getDirectStore(target: any): any {
    var classKey = target.getClassName();

    if (!(<any>__decoratorInitialStore)[classKey]) {
        (<any>__decoratorInitialStore)[classKey] = {};
    }

    return (<any>__decoratorInitialStore)[classKey];
}

/**
 * Return the list of properties flagged as serializable
 * @param target: host object
 */
function getMergedStore(target: any): any {
    let classKey = target.getClassName();

    if ((<any>__mergedStore)[classKey]) {
        return (<any>__mergedStore)[classKey];
    }

    (<any>__mergedStore)[classKey] = {};

    let store = (<any>__mergedStore)[classKey];
    let currentTarget = target;
    let currentKey = classKey;
    while (currentKey) {
        let initialStore = (<any>__decoratorInitialStore)[currentKey];
        for (var property in initialStore) {
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
        }
        while (parent);

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
        var classStore = getDirectStore(target);

        if (!classStore[propertyKey]) {
            classStore[propertyKey] = { type: type, sourceName: sourceName };
        }
    };
}

function generateExpandMember(setCallback: string, targetKey: Nullable<string> = null) {
    return (target: any, propertyKey: string) => {
        var key = targetKey || ("_" + propertyKey);
        Object.defineProperty(target, propertyKey, {
            get: function(this: any) {
                return this[key];
            },
            set: function(this: any, value) {
                if (this[key] === value) {
                    return;
                }
                this[key] = value;

                target[setCallback].apply(this);
            },
            enumerable: true,
            configurable: true
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

    /** @hidden */
    public static _ImageProcessingConfigurationParser = (sourceProperty: any): ImageProcessingConfiguration => {
        throw _DevTools.WarnImport("ImageProcessingConfiguration");
    }

    /** @hidden */
    public static _FresnelParametersParser = (sourceProperty: any): FresnelParameters => {
        throw _DevTools.WarnImport("FresnelParameters");
    }

    /** @hidden */
    public static _ColorCurvesParser = (sourceProperty: any): ColorCurves => {
        throw _DevTools.WarnImport("ColorCurves");
    }

    /** @hidden */
    public static _TextureParser = (sourceProperty: any, scene: Scene, rootUrl: string): Nullable<BaseTexture> => {
        throw _DevTools.WarnImport("Texture");
    }

    /**
     * Appends the serialized animations from the source animations
     * @param source Source containing the animations
     * @param destination Target to store the animations
     */
    public static AppendSerializedAnimations(source: IAnimatable, destination: any): void {
        if (source.animations) {
            destination.animations = [];
            for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                var animation = source.animations[animationIndex];

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

        var serializedProperties = getMergedStore(entity);

        // Properties
        for (var property in serializedProperties) {
            var propertyDescriptor = serializedProperties[property];
            var targetPropertyName = propertyDescriptor.sourceName || property;
            var propertyType = propertyDescriptor.type;
            var sourceProperty = (<any>entity)[property];

            if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
                switch (propertyType) {
                    case 0:     // Value
                        serializationObject[targetPropertyName] = sourceProperty;
                        break;
                    case 1:     // Texture
                        serializationObject[targetPropertyName] = sourceProperty.serialize();
                        break;
                    case 2:     // Color3
                        serializationObject[targetPropertyName] = sourceProperty.asArray();
                        break;
                    case 3:     // FresnelParameters
                        serializationObject[targetPropertyName] = sourceProperty.serialize();
                        break;
                    case 4:     // Vector2
                        serializationObject[targetPropertyName] = sourceProperty.asArray();
                        break;
                    case 5:     // Vector3
                        serializationObject[targetPropertyName] = sourceProperty.asArray();
                        break;
                    case 6:     // Mesh reference
                        serializationObject[targetPropertyName] = sourceProperty.id;
                        break;
                    case 7:     // Color Curves
                        serializationObject[targetPropertyName] = sourceProperty.serialize();
                        break;
                    case 8:     // Color 4
                        serializationObject[targetPropertyName] = (<Color4>sourceProperty).asArray();
                        break;
                    case 9:     // Image Processing
                        serializationObject[targetPropertyName] = (<ImageProcessingConfiguration>sourceProperty).serialize();
                        break;
                    case 10:    // Quaternion
                        serializationObject[targetPropertyName] = (<Quaternion>sourceProperty).asArray();
                        break;
                    case 11:    // Camera reference
                        serializationObject[targetPropertyName] = (<Camera>sourceProperty).id;
                        break;
                    case 12:    // Matrix
                        serializationObject[targetPropertyName] = (<Matrix>sourceProperty).asArray();
                        break;
                }
            }
        }

        return serializationObject;
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
        var destination = creationFunction();

        if (!rootUrl) {
            rootUrl = "";
        }

        // Tags
        if (Tags) {
            Tags.AddTagsTo(destination, source.tags);
        }

        var classStore = getMergedStore(destination);

        // Properties
        for (var property in classStore) {
            var propertyDescriptor = classStore[property];
            var sourceProperty = source[propertyDescriptor.sourceName || property];
            var propertyType = propertyDescriptor.type;

            if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
                var dest = <any>destination;
                switch (propertyType) {
                    case 0:     // Value
                        dest[property] = sourceProperty;
                        break;
                    case 1:     // Texture
                        if (scene) {
                            dest[property] = SerializationHelper._TextureParser(sourceProperty, scene, rootUrl);
                        }
                        break;
                    case 2:     // Color3
                        dest[property] = Color3.FromArray(sourceProperty);
                        break;
                    case 3:     // FresnelParameters
                        dest[property] = SerializationHelper._FresnelParametersParser(sourceProperty);
                        break;
                    case 4:     // Vector2
                        dest[property] = Vector2.FromArray(sourceProperty);
                        break;
                    case 5:     // Vector3
                        dest[property] = Vector3.FromArray(sourceProperty);
                        break;
                    case 6:     // Mesh reference
                        if (scene) {
                            dest[property] = scene.getLastMeshById(sourceProperty);
                        }
                        break;
                    case 7:     // Color Curves
                        dest[property] = SerializationHelper._ColorCurvesParser(sourceProperty);
                        break;
                    case 8:     // Color 4
                        dest[property] = Color4.FromArray(sourceProperty);
                        break;
                    case 9:     // Image Processing
                        dest[property] = SerializationHelper._ImageProcessingConfigurationParser(sourceProperty);
                        break;
                    case 10:    // Quaternion
                        dest[property] = Quaternion.FromArray(sourceProperty);
                        break;
                    case 11:    // Camera reference
                        if (scene) {
                            dest[property] = scene.getCameraById(sourceProperty);
                        }
                    case 12:    // Matrix
                        dest[property] = Matrix.FromArray(sourceProperty);
                        break;
                }
            }
        }

        return destination;
    }

    /**
     * Clones an object
     * @param creationFunction defines the function used to instanciate the new object
     * @param source defines the source object
     * @returns the cloned object
     */
    public static Clone<T>(creationFunction: () => T, source: T): T {
        return _copySource(creationFunction, source, false);
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

import type { FresnelParameters } from "../Materials/fresnelParameters";
import type { ImageProcessingConfiguration } from "../Materials/imageProcessingConfiguration";
import { _WarnImport } from "./devTools";
import type { ColorCurves } from "../Materials/colorCurves";
import type { Scene } from "../scene";
import type { Nullable } from "../types";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { IAnimatable } from "../Animations/animatable.interface";
import { Tags } from "./tags";
import { Color3, Color4 } from "../Maths/math.color";
import { Matrix, Quaternion, Vector2, Vector3 } from "../Maths/math.vector";
import type { Camera } from "../Cameras/camera";
import { GetMergedStore } from "./decorators.functions";

/** @internal */
export interface ICopySourceOptions {
    /*
     * if a texture is used in more than one channel (e.g diffuse and opacity),
     * only clone it once and reuse it on the other channels. Default false
     */
    cloneTexturesOnlyOnce?: boolean;
}

const CopySource = function <T>(creationFunction: () => T, source: T, instanciate: boolean, options: ICopySourceOptions = {}): T {
    const destination = creationFunction();

    // Tags
    if (Tags && Tags.HasTags(source)) {
        Tags.AddTagsTo(destination, Tags.GetTags(source, true));
    }

    const classStore = GetMergedStore(destination);

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
                case 9: // Image processing configuration reference
                case 11: // Camera reference
                    if (typeof sourceProperty.slice === "function") {
                        (<any>destination)[property] = sourceProperty.slice();
                    } else {
                        (<any>destination)[property] = sourceProperty;
                    }
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
                case 8: // Color 4
                case 10: // Quaternion
                case 12: // Matrix
                    (<any>destination)[property] = instanciate ? sourceProperty : sourceProperty.clone();
                    break;
            }
        }
    }

    return destination;
};

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

        const serializedProperties = GetMergedStore(entity);

        // Properties
        for (const property in serializedProperties) {
            const propertyDescriptor = serializedProperties[property];
            const targetPropertyName = propertyDescriptor.sourceName || property;
            const propertyType = propertyDescriptor.type;
            const sourceProperty = (<any>entity)[property];

            if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
                switch (propertyType) {
                    case 0: // Value
                        if (Array.isArray(sourceProperty)) {
                            serializationObject[targetPropertyName] = sourceProperty.slice();
                        } else {
                            serializationObject[targetPropertyName] = sourceProperty;
                        }
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

        const classStore = GetMergedStore(destination);

        // Properties
        for (const property in classStore) {
            const propertyDescriptor = classStore[property];
            const sourceProperty = source[propertyDescriptor.sourceName || property];
            const propertyType = propertyDescriptor.type;

            if (sourceProperty !== undefined && sourceProperty !== null && (property !== "uniqueId" || SerializationHelper.AllowLoadingUniqueId)) {
                const dest = destination;
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
    public static Clone<T>(creationFunction: () => T, source: T, options: ICopySourceOptions = {}): T {
        return CopySource(creationFunction, source, false, options);
    }

    /**
     * Instanciates a new object based on a source one (some data will be shared between both object)
     * @param creationFunction defines the function used to instanciate the new object
     * @param source defines the source object
     * @returns the new object
     */
    public static Instanciate<T>(creationFunction: () => T, source: T): T {
        return CopySource(creationFunction, source, true);
    }
}

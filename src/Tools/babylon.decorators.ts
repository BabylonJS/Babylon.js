﻿module BABYLON {
    var __decoratorInitialStore = {};
    var __mergedStore = {};

    var _copySource = function<T>(creationFunction: () => T, source: T, instanciate: boolean): T {
        var destination = creationFunction();

        // Tags
        if (Tags) {
            Tags.AddTagsTo(destination, (<any>source).tags);
        }

        var classStore = getMergedStore(destination);

        // Properties
        for (var property in classStore) {
            var propertyDescriptor = classStore[property];
            var sourceProperty = source[property];
            var propertyType = propertyDescriptor.type;

            if (sourceProperty !== undefined && sourceProperty !== null) {
                switch (propertyType) {
                    case 0:     // Value
                    case 6:     // Mesh reference
                        destination[property] = sourceProperty;
                        break;
                    case 1:     // Texture
                    case 2:     // Color3
                    case 3:     // FresnelParameters
                    case 4:     // Vector2
                    case 5:     // Vector3
                    case 7:     // Color Curves
                        destination[property] = instanciate?sourceProperty:sourceProperty.clone();
                        break;
                }
            }
        }

        return destination;
    };

    function getDirectStore(target: any): any {
        var classKey = target.getClassName();

        if (!__decoratorInitialStore[classKey]) {
            __decoratorInitialStore[classKey] = {};
        }

        return __decoratorInitialStore[classKey];
    }

    /**
     * Return the list of properties flagged as serializable
     * @param target: host object
     */
    function getMergedStore(target: any): any {
        let classKey = target.getClassName();

        if (__mergedStore[classKey]) {
            return __mergedStore[classKey];
        }

        __mergedStore[classKey] = {};

        let store = __mergedStore[classKey];
        let currentTarget = target;
        let currentKey = classKey;
        while (currentKey) {
            let initialStore = __decoratorInitialStore[currentKey];
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
        }
    }

    function generateExpandMember(setCallback: string, targetKey: string) {
        return (target: any, propertyKey: string) => {
            var key = targetKey || ("_" + propertyKey);
            Object.defineProperty(target, propertyKey, {
                get: function () {
                    return this[key];
                },
                set: function (value) {
                    if (this[key] === value) {
                        return;
                    }
                    this[key] = value;
                    
                    target[setCallback].apply(this);
                },
                enumerable: true,
                configurable: true
            });
        }
    }

    export function expandToProperty(callback: string, targetKey?: string) {
        return generateExpandMember(callback, targetKey);
    }

    export function serialize(sourceName?: string) {
        return generateSerializableMember(0, sourceName); // value member
    }

    export function serializeAsTexture(sourceName?: string) {
        return generateSerializableMember(1, sourceName);// texture member
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


    export class SerializationHelper {

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
                var sourceProperty = entity[property];

                if (sourceProperty !== undefined && sourceProperty !== null) {
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
                    }
                }
            }

            return serializationObject;
        }

        public static Parse<T>(creationFunction: () => T, source: any, scene: Scene, rootUrl?: string): T {
            var destination = creationFunction();

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

                if (sourceProperty !== undefined && sourceProperty !== null) {
                    switch (propertyType) {
                        case 0:     // Value
                            destination[property] = sourceProperty;
                            break;
                        case 1:     // Texture
                            destination[property] = Texture.Parse(sourceProperty, scene, rootUrl);
                            break;
                        case 2:     // Color3
                            destination[property] = Color3.FromArray(sourceProperty);
                            break;
                        case 3:     // FresnelParameters
                            destination[property] = FresnelParameters.Parse(sourceProperty);
                            break;
                        case 4:     // Vector2
                            destination[property] = Vector2.FromArray(sourceProperty);
                            break;
                        case 5:     // Vector3
                            destination[property] = Vector3.FromArray(sourceProperty);
                            break;
                        case 6:     // Mesh reference
                            destination[property] = scene.getLastMeshByID(sourceProperty);
                            break;
                        case 7:     // Color Curves
                            destination[property] = ColorCurves.Parse(sourceProperty);
                            break;
                        case 8:     // Color 4
                            destination[property] = Color4.FromArray(sourceProperty);
                            break;
                        case 9:     // Image Processing
                            destination[property] = ImageProcessingConfiguration.Parse(sourceProperty);
                            break;
                    }
                }
            }

            return destination;
        }

        public static Clone<T>(creationFunction: () => T, source: T): T {
            return _copySource(creationFunction, source, false);
        }

        public static Instanciate<T>(creationFunction: () => T, source: T): T {
            return _copySource(creationFunction, source, true);
        }
    }
}
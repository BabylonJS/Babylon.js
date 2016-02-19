module BABYLON {
    function generateSerializableMember(type: number, sourceName?: string) {
        return (target: any, propertyKey: string | symbol) => {
            if (!target.__serializableMembers) {
                target.__serializableMembers = {};
            }

            target.__serializableMembers[propertyKey] = { type: type, sourceName: sourceName }; 
        }
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

    export class SerializationHelper {

        public static Serialize<T>(entity: T, serializationObject?: any): any {
            if (!serializationObject) {
                serializationObject = {};
            }

            // Tags
            serializationObject.tags = Tags.GetTags(entity);

            // Properties
            for (var property in (<any>entity).__serializableMembers) {
                var propertyDescriptor = (<any>entity).__serializableMembers[property];
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
                    }
                }
            }

            return serializationObject;
        }

        public static Parse<T>(creationFunction: () => T, source: any, scene: Scene, rootUrl?: string): T {
            var destination = creationFunction();

            // Tags
            Tags.AddTagsTo(destination, source.tags);

            // Properties
            for (var property in (<any>destination).__serializableMembers) {
                var propertyDescriptor = (<any>destination).__serializableMembers[property];
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
                    }
                }
            }

            return destination;
        }

        public static Clone<T>(creationFunction: () => T, source: T): T {
            var destination = creationFunction();

            // Tags
            Tags.AddTagsTo(destination, (<any>source).tags);

            // Properties
            for (var property in (<any>destination).__serializableMembers) {
                var propertyDescriptor = (<any>destination).__serializableMembers[property];
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
                            destination[property] = sourceProperty.clone();
                            break;
                    }
                }
            }

            return destination;
        }
    }
}
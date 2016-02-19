var BABYLON;
(function (BABYLON) {
    function generateSerializableMember(type, sourceName) {
        return function (target, propertyKey) {
            if (!target.__serializableMembers) {
                target.__serializableMembers = {};
            }
            target.__serializableMembers[propertyKey] = { type: type, sourceName: sourceName };
        };
    }
    function serialize(sourceName) {
        return generateSerializableMember(0, sourceName); // value member
    }
    BABYLON.serialize = serialize;
    function serializeAsTexture(sourceName) {
        return generateSerializableMember(1, sourceName); // texture member
    }
    BABYLON.serializeAsTexture = serializeAsTexture;
    function serializeAsColor3(sourceName) {
        return generateSerializableMember(2, sourceName); // color3 member
    }
    BABYLON.serializeAsColor3 = serializeAsColor3;
    function serializeAsFresnelParameters(sourceName) {
        return generateSerializableMember(3, sourceName); // fresnel parameters member
    }
    BABYLON.serializeAsFresnelParameters = serializeAsFresnelParameters;
    var SerializationHelper = (function () {
        function SerializationHelper() {
        }
        SerializationHelper.Serialize = function (entity, serializationObject) {
            if (!serializationObject) {
                serializationObject = {};
            }
            // Tags
            serializationObject.tags = BABYLON.Tags.GetTags(entity);
            // Properties
            for (var property in entity.__serializableMembers) {
                var propertyDescriptor = entity.__serializableMembers[property];
                var targetPropertyName = propertyDescriptor.sourceName || property;
                var propertyType = propertyDescriptor.type;
                var sourceProperty = entity[property];
                if (sourceProperty !== undefined && sourceProperty !== null) {
                    switch (propertyType) {
                        case 0:
                            serializationObject[targetPropertyName] = sourceProperty;
                            break;
                        case 1:
                            serializationObject[targetPropertyName] = sourceProperty.serialize();
                            break;
                        case 2:
                            serializationObject[targetPropertyName] = sourceProperty.asArray();
                            break;
                        case 3:
                            serializationObject[targetPropertyName] = sourceProperty.serialize();
                            break;
                    }
                }
            }
            return serializationObject;
        };
        SerializationHelper.Parse = function (creationFunction, source, scene, rootUrl) {
            var destination = creationFunction();
            // Tags
            BABYLON.Tags.AddTagsTo(destination, source.tags);
            // Properties
            for (var property in destination.__serializableMembers) {
                var propertyDescriptor = destination.__serializableMembers[property];
                var sourceProperty = source[propertyDescriptor.sourceName || property];
                var propertyType = propertyDescriptor.type;
                if (sourceProperty !== undefined && sourceProperty !== null) {
                    switch (propertyType) {
                        case 0:
                            destination[property] = sourceProperty;
                            break;
                        case 1:
                            destination[property] = BABYLON.Texture.Parse(sourceProperty, scene, rootUrl);
                            break;
                        case 2:
                            destination[property] = BABYLON.Color3.FromArray(sourceProperty);
                            break;
                        case 3:
                            destination[property] = BABYLON.FresnelParameters.Parse(sourceProperty);
                            break;
                    }
                }
            }
            return destination;
        };
        SerializationHelper.Clone = function (creationFunction, source) {
            var destination = creationFunction();
            // Tags
            BABYLON.Tags.AddTagsTo(destination, source.tags);
            // Properties
            for (var property in destination.__serializableMembers) {
                var propertyDescriptor = destination.__serializableMembers[property];
                var sourceProperty = source[property];
                var propertyType = propertyDescriptor.type;
                if (sourceProperty !== undefined && sourceProperty !== null) {
                    switch (propertyType) {
                        case 0:
                            destination[property] = sourceProperty;
                            break;
                        case 1: // Texture
                        case 2: // Color3
                        case 3:
                            destination[property] = sourceProperty.clone();
                            break;
                    }
                }
            }
            return destination;
        };
        return SerializationHelper;
    })();
    BABYLON.SerializationHelper = SerializationHelper;
})(BABYLON || (BABYLON = {}));

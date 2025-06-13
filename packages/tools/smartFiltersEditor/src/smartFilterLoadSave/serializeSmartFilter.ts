import { SmartFilterSerializer, type SmartFilter } from "@babylonjs/smart-filters";

/**
 * Serializes the provided Smart Filter to a JSON string.
 * @param smartFilter - The Smart Filter to serialize
 * @returns The serialized Smart Filter
 */
export async function serializeSmartFilter(smartFilter: SmartFilter): Promise<string> {
    const serializerModule = await import(
        /* webpackChunkName: "serializers" */ "@babylonjs/smart-filters-blocks/src/registration/blockSerializers.js"
    );
    const serializer = new SmartFilterSerializer(
        serializerModule.blocksUsingDefaultSerialization,
        serializerModule.additionalBlockSerializers
    );

    return JSON.stringify(serializer.serialize(smartFilter), null, 2);
}

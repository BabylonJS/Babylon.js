import { SmartFilterSerializer, type SmartFilter } from "smart-filters";

/**
 * Serializes the provided Smart Filter to a JSON string.
 * @param smartFilter - The Smart Filter to serialize
 * @returns The serialized Smart Filter
 */
export async function SerializeSmartFilter(smartFilter: SmartFilter): Promise<string> {
    const serializerModule = await import(/* webpackChunkName: "serializers" */ "smart-filters-blocks/registration/blockSerializers");
    const serializer = new SmartFilterSerializer(serializerModule.blocksUsingDefaultSerialization, serializerModule.additionalBlockSerializers);

    return JSON.stringify(serializer.serialize(smartFilter), null, 2);
}

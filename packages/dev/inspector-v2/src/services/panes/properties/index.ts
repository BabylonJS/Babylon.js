import { PropertiesServiceDefinition } from "./propertiesService";
import { CommonPropertiesServiceDefinition } from "./common/commonPropertiesService";
import { MeshPropertiesServiceDefinition } from "./mesh/meshPropertiesService";

const PropertiesServiceDefinitions = [PropertiesServiceDefinition, CommonPropertiesServiceDefinition, MeshPropertiesServiceDefinition];

export { PropertiesServiceDefinitions };

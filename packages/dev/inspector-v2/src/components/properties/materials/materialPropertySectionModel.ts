import { type StandardMaterial } from "core/Materials/standardMaterial";

import { type MaterialPropertySectionModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import { CreateColor3MaterialPropertyModel, CreateNumberMaterialPropertyModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyAdapters";

import { usePropertyChangedNotifier } from "../../../contexts/propertyContext";
import { useColor3Property, useProperty } from "../../../hooks/compoundPropertyHooks";
import { GetPropertyDescriptor, IsPropertyReadonly } from "../../../instrumentation/propertyInstrumentation";

/**
 * Observes the lighting and color fields of a StandardMaterial and adapts them to a runtime-neutral section.
 * @param material The selected standard material.
 * @returns Controlled fields backed by the material.
 */
export function useMaterialPropertySectionModel(material: StandardMaterial): MaterialPropertySectionModel {
    const diffuseColor = useColor3Property(material, "diffuseColor");
    const specularColor = useColor3Property(material, "specularColor");
    const specularPower = useProperty(material, "specularPower");
    const emissiveColor = useColor3Property(material, "emissiveColor");
    const ambientColor = useColor3Property(material, "ambientColor");
    const notifyPropertyChanged = usePropertyChangedNotifier();

    const isWritable = (key: "diffuseColor" | "specularColor" | "specularPower" | "emissiveColor" | "ambientColor") => {
        const descriptor = GetPropertyDescriptor(material, key)?.[1];
        return descriptor ? !IsPropertyReadonly(descriptor) : Object.isExtensible(material);
    };
    const setProperty = <KeyT extends "diffuseColor" | "specularColor" | "specularPower" | "emissiveColor" | "ambientColor">(key: KeyT, value: StandardMaterial[KeyT]) => {
        const oldValue = material[key];
        material[key] = value;
        notifyPropertyChanged(material, key, oldValue, value);
    };

    return {
        fields: [
            CreateColor3MaterialPropertyModel({
                id: "Diffuse Color",
                label: "Diffuse Color",
                value: diffuseColor,
                disabled: !isWritable("diffuseColor"),
                onChange: (value) => setProperty("diffuseColor", value),
            }),
            CreateColor3MaterialPropertyModel({
                id: "Specular Color",
                label: "Specular Color",
                value: specularColor,
                disabled: !isWritable("specularColor"),
                onChange: (value) => setProperty("specularColor", value),
            }),
            CreateNumberMaterialPropertyModel({
                id: "Specular Power",
                label: "Specular Power",
                value: specularPower,
                min: 0,
                max: 128,
                step: 0.1,
                disabled: !isWritable("specularPower"),
                onChange: (value) => setProperty("specularPower", value),
            }),
            CreateColor3MaterialPropertyModel({
                id: "Emissive Color",
                label: "Emissive Color",
                value: emissiveColor,
                disabled: !isWritable("emissiveColor"),
                onChange: (value) => setProperty("emissiveColor", value),
            }),
            CreateColor3MaterialPropertyModel({
                id: "Ambient Color",
                label: "Ambient Color",
                value: ambientColor,
                disabled: !isWritable("ambientColor"),
                onChange: (value) => setProperty("ambientColor", value),
            }),
        ],
    };
}

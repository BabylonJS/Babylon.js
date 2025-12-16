import { ChooseTexturePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseTexturePropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { usePropertyChangedNotifier } from "../../../contexts/propertyContext";
import type { Scene } from "core/scene";
import type { FunctionComponent } from "react";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";

/**
 * Helper to bind texture properties without needing defaultValue
 * @param props - The required properties
 * @returns ChooseTexturePropertyLine component
 */
export const BoundTextureProperty: FunctionComponent<{
    label: string;
    target: PBRMaterial;
    propertyKey: keyof PBRMaterial;
    scene: Scene;
    cubeOnly?: boolean;
}> = (props) => {
    const { label, target, propertyKey, scene, cubeOnly } = props;
    const value = useProperty(target, propertyKey);
    const notifyPropertyChanged = usePropertyChangedNotifier();

    return (
        <ChooseTexturePropertyLine
            label={label}
            value={value}
            onChange={(texture) => {
                const oldValue = target[propertyKey];
                (target as any)[propertyKey] = texture;
                notifyPropertyChanged(target, propertyKey, oldValue, texture);
            }}
            scene={scene}
            cubeOnly={cubeOnly}
        />
    );
};

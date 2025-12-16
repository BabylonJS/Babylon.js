import { ChooseTexturePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseTexturePropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { usePropertyChangedNotifier } from "../../../contexts/propertyContext";
import type { Scene } from "core/scene";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";

/**
 * Type alias for objects with texture properties
 */
type TextureHolder<K extends string> = Record<K, Nullable<BaseTexture>>;

/**
 * Props for BoundTextureProperty
 */
type BoundTexturePropertyProps<K extends string> = {
    label: string;
    target: TextureHolder<K>;
    propertyKey: K;
    scene: Scene;
    cubeOnly?: boolean;
};

/**
 * Helper to bind texture properties without needing defaultValue
 * @param props - The required properties
 * @returns ChooseTexturePropertyLine component
 */
export function BoundTextureProperty<K extends string>(props: BoundTexturePropertyProps<K>) {
    const { label, target, propertyKey, scene, cubeOnly } = props;
    const value = useProperty(target, propertyKey);
    const notifyPropertyChanged = usePropertyChangedNotifier();

    return (
        <ChooseTexturePropertyLine
            label={label}
            value={value}
            onChange={(texture) => {
                const oldValue = target[propertyKey];
                target[propertyKey] = texture;
                notifyPropertyChanged(target, propertyKey, oldValue, texture);
            }}
            scene={scene}
            cubeOnly={cubeOnly}
        />
    );
}

import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Material } from "core/Materials/material";
import type { Node } from "core/node";

import { ChooseTexturePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseTexturePropertyLine";
import { ChooseMaterialPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseMaterialPropertyLine";
import { ChooseNodePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/chooseNodePropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { usePropertyChangedNotifier } from "../../../contexts/propertyContext";

/**
 * Type alias for objects with entity properties
 */
type EntityHolder<K extends string, E> = Record<K, Nullable<E>>;

/**
 * Bound texture property using ChooseTexturePropertyLine
 * @returns BoundChooseTexture component
 */
export function BoundChooseTexture<K extends string>(props: { label: string; target: EntityHolder<K, BaseTexture>; propertyKey: K; scene: Scene; cubeOnly?: boolean }) {
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

/**
 * Bound material property using ChooseMaterialPropertyLine
 * @returns BoundChooseMaterial component
 */
export function BoundChooseMaterial<K extends string>(props: {
    label: string;
    target: EntityHolder<K, Material>;
    propertyKey: K;
    scene: Scene;
    filter?: (material: Material) => boolean;
}) {
    const { label, target, propertyKey, scene, filter } = props;
    const value = useProperty(target, propertyKey);
    const notifyPropertyChanged = usePropertyChangedNotifier();

    return (
        <ChooseMaterialPropertyLine
            label={label}
            value={value}
            onChange={(material) => {
                const oldValue = target[propertyKey];
                target[propertyKey] = material;
                notifyPropertyChanged(target, propertyKey, oldValue, material);
            }}
            scene={scene}
            filter={filter}
        />
    );
}

/**
 * Bound node property using ChooseNodePropertyLine
 * @returns BoundChooseNode component
 */
export function BoundChooseNode<K extends string>(props: { label: string; target: EntityHolder<K, Node>; propertyKey: K; scene: Scene; filter?: (node: Node) => boolean }) {
    const { label, target, propertyKey, scene, filter } = props;
    const value = useProperty(target, propertyKey);
    const notifyPropertyChanged = usePropertyChangedNotifier();

    return (
        <ChooseNodePropertyLine
            label={label}
            value={value}
            onChange={(node) => {
                const oldValue = target[propertyKey];
                target[propertyKey] = node;
                notifyPropertyChanged(target, propertyKey, oldValue, node);
            }}
            scene={scene}
            filter={filter}
        />
    );
}

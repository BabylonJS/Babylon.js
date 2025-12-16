import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Material } from "core/Materials/material";
import type { Node } from "core/node";

import { ChooseTexture } from "shared-ui-components/fluent/primitives/chooseTexture";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";
import { usePropertyChangedNotifier } from "../../contexts/propertyContext";
import { ChooseEntity } from "shared-ui-components/fluent/primitives/chooseEntity";
import { useCallback } from "react";

/**
 * Type alias for objects with entity properties
 */
type EntityHolder<K extends string, E> = Record<K, Nullable<E>>;

/**
 * Generic bound entity property that handles useProperty, onChange, and notifyPropertyChanged
 * @returns A PropertyLine with the bound entity chooser
 */
function BoundChooseEntityPropertyLine<K extends string, E>(props: {
    label: string;
    target: EntityHolder<K, E>;
    propertyKey: K;
    children: (value: Nullable<E>, onChange: (entity: Nullable<E>) => void) => React.ReactNode;
}) {
    const { label, target, propertyKey, children } = props;
    const value = useProperty(target, propertyKey);
    const notifyPropertyChanged = usePropertyChangedNotifier();

    const onChange = (entity: Nullable<E>) => {
        const oldValue = target[propertyKey];
        target[propertyKey] = entity;
        notifyPropertyChanged(target, propertyKey, oldValue, entity);
    };

    return <PropertyLine label={label}>{children(value, onChange)}</PropertyLine>;
}

/**
 * Bound texture property
 * @returns A BoundChooseEntity with ChooseTexture
 */
export function BoundChooseTexturePropertyLine<K extends string>(props: { label: string; target: EntityHolder<K, BaseTexture>; propertyKey: K; scene: Scene; cubeOnly?: boolean }) {
    const { label, target, propertyKey, scene, cubeOnly } = props;

    return (
        <BoundChooseEntityPropertyLine label={label} target={target} propertyKey={propertyKey}>
            {(value, onChange) => <ChooseTexture value={value} onChange={onChange} scene={scene} cubeOnly={cubeOnly} />}
        </BoundChooseEntityPropertyLine>
    );
}

/**
 * Bound material property
 * @returns A BoundChooseEntity with Materials from the scene
 */
export function BoundChooseMaterialPropertyLine<K extends string>(props: {
    label: string;
    target: EntityHolder<K, Material>;
    propertyKey: K;
    scene: Scene;
    filter?: (material: Material) => boolean;
}) {
    const { label, target, propertyKey, scene, filter } = props;
    const getMaterials = useCallback(() => scene.materials, [scene.materials]);
    const getName = useCallback((material: Material) => material.name, []);
    return (
        <BoundChooseEntityPropertyLine label={label} target={target} propertyKey={propertyKey}>
            {(value, onChange) => <ChooseEntity value={value} onChange={onChange} filter={filter} getEntities={getMaterials} getName={getName} />}
        </BoundChooseEntityPropertyLine>
    );
}

/**
 * Bound node property
 * @returns A BoundChooseEntity with ChooseNode
 */
export function BoundChooseNodePropertyLine<K extends string>(props: {
    label: string;
    target: EntityHolder<K, Node>;
    propertyKey: K;
    scene: Scene;
    filter?: (node: Node) => boolean;
}) {
    const { label, target, propertyKey, scene, filter } = props;

    const getNodes = useCallback(() => scene.getNodes(), [scene]);
    const getName = useCallback((node: Node) => node.name, []);

    return (
        <BoundChooseEntityPropertyLine label={label} target={target} propertyKey={propertyKey}>
            {(value, onChange) => <ChooseEntity value={value} onChange={onChange} filter={filter} getEntities={getNodes} getName={getName} />}
        </BoundChooseEntityPropertyLine>
    );
}

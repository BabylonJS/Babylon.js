import { type Nullable } from "core/types";
import { useCallback } from "react";
import { type ImmutablePrimitiveProps, type PrimitiveProps } from "./primitive";
import { ResourceSelector } from "./resourceSelector";

type Entity = { uniqueId: number };
const GetEntityId = (entity: Entity) => entity.uniqueId.toString();

/**
 * Props for the EntitySelector component
 */
export type EntitySelectorProps<T extends Entity> = (PrimitiveProps<Nullable<T>> | ImmutablePrimitiveProps<Nullable<T>>) & {
    /**
     * Function to get the list of entities to choose from
     */
    getEntities: () => T[];
    /**
     * Function to get the display name from an entity
     */
    getName: (entity: T) => string;
    /**
     * Optional filter function to filter which entities are shown
     */
    filter?: (entity: T) => boolean;
    /**
     * Callback when the entity link is clicked
     */
    onLink: (entity: T) => void;
    /**
     * Optional default value that enables clearing the current linked entity
     */
    defaultValue?: Nullable<T>;
};

/**
 * A generic primitive component with a ComboBox for selecting from a list of entities.
 * Supports entities with duplicate names by using uniqueId for identity.
 * @param props ChooseEntityProps
 * @returns EntitySelector component
 */
export function EntitySelector<T extends Entity>(props: EntitySelectorProps<T>): JSX.Element {
    const { value, onLink, getEntities, getName, filter, defaultValue, disabled } = props;
    const onChange = (props as PrimitiveProps<Nullable<T>>).onChange as PrimitiveProps<Nullable<T>>["onChange"] | undefined;
    const filterEntity = useCallback((entity: T) => entity.uniqueId !== undefined && (!filter || filter(entity)), [filter]);
    return (
        <ResourceSelector
            value={value}
            getEntities={getEntities}
            getName={getName}
            getId={GetEntityId}
            filter={filterEntity}
            onSelect={onChange}
            onClear={onChange && defaultValue !== undefined ? () => onChange(defaultValue) : undefined}
            onLink={onLink}
            disabled={disabled}
            showEmptySelector
        />
    );
}
EntitySelector.displayName = "EntitySelector";

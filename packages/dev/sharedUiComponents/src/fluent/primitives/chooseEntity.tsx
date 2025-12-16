import type { FunctionComponent } from "react";
import type { Nullable } from "core/types";
import type { PrimitiveProps } from "./primitive";

import { useMemo } from "react";
import { ComboBox } from "./comboBox";

export type ChooseEntityProps<T> = PrimitiveProps<Nullable<T>> & {
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
};

/**
 * A generic primitive component with a ComboBox for selecting from a list of entities.
 * @param props ChooseEntityProps
 * @returns ChooseEntity component
 */
export function ChooseEntity<T>(props: ChooseEntityProps<T>): ReturnType<FunctionComponent> {
    const { value, onChange, getEntities, getName, filter } = props;

    // Get sorted entity names
    const entityOptions = useMemo(() => {
        return getEntities()
            .filter((e) => getName(e) && (!filter || filter(e)))
            .map((e) => getName(e))
            .sort((a, b) => a.localeCompare(b));
    }, [getEntities, getName, filter]);

    const handleEntitySelect = (entityName: string) => {
        const entity = getEntities().find((e) => getName(e) === entityName);
        onChange(entity ?? null);
    };

    // Get current entity name for initial display
    const currentEntityName = value ? getName(value) : "";

    return <ComboBox label="" options={entityOptions} value={currentEntityName} onChange={handleEntitySelect} />;
}
ChooseEntity.displayName = "ChooseEntity";

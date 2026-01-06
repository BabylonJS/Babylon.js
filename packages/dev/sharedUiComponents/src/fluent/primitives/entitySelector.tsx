import type { Nullable } from "core/types";
import type { ImmutablePrimitiveProps, PrimitiveProps } from "./primitive";

import { useMemo } from "react";
import { LinkDismissRegular } from "@fluentui/react-icons";
import { ComboBox } from "./comboBox";
import { Link } from "./link";
import { Button } from "./button";
import { makeStyles, tokens } from "@fluentui/react-components";

type Entity = { uniqueId: number };

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
};

const useStyles = makeStyles({
    linkDiv: {
        display: "flex",
        flexDirection: "row",
        gap: tokens.spacingHorizontalS,
    },
});

/**
 * A generic primitive component with a ComboBox for selecting from a list of entities.
 * Supports entities with duplicate names by using uniqueId for identity.
 * @param props ChooseEntityProps
 * @returns EntitySelector component
 */
export function EntitySelector<T extends Entity>(props: EntitySelectorProps<T>): JSX.Element {
    const { value, onLink, getEntities, getName, filter } = props;

    const onChange = (props as PrimitiveProps<Nullable<T>>).onChange as PrimitiveProps<Nullable<T>>["onChange"] | undefined;

    const classes = useStyles();

    // Build options with uniqueId as key
    const options = useMemo(() => {
        return getEntities()
            .filter((e) => e.uniqueId !== undefined && (!filter || filter(e)))
            .map((entity) => ({
                label: getName(entity),
                value: entity.uniqueId.toString(),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [getEntities, getName, filter]);

    const handleEntitySelect = (key: string) => {
        const entity = getEntities().find((e) => e.uniqueId.toString() === key);
        onChange?.(entity ?? null);
    };

    // Get current entity key for display
    const currentKey = value ? value.uniqueId.toString() : "";

    if (value) {
        return (
            <div className={classes.linkDiv}>
                <Link value={getName(value)} onLink={() => onLink(value)} />
                {onChange && (
                    <Button
                        icon={LinkDismissRegular}
                        onClick={() => {
                            onChange(null);
                        }}
                    />
                )}
            </div>
        );
    } else {
        return <ComboBox label="" options={options} value={currentKey} onChange={handleEntitySelect} />;
    }
}
EntitySelector.displayName = "EntitySelector";

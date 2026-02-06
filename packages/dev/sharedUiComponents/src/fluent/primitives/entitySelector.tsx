import type { Nullable } from "core/types";
import type { ImmutablePrimitiveProps, PrimitiveProps } from "./primitive";

import { makeStyles, tokens, Tooltip } from "@fluentui/react-components";
import { LinkDismissRegular, LinkEditRegular } from "@fluentui/react-icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "./button";
import { ComboBox } from "./comboBox";
import { Link } from "./link";
import { useImpulse } from "../hooks/transientStateHooks";

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
    /**
     * Optional default value that enables clearing the current linked entity
     */
    defaultValue?: T;
};

const useStyles = makeStyles({
    linkDiv: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
        overflow: "hidden",
    },
    link: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
});

/**
 * A generic primitive component with a ComboBox for selecting from a list of entities.
 * Supports entities with duplicate names by using uniqueId for identity.
 * @param props ChooseEntityProps
 * @returns EntitySelector component
 */
export function EntitySelector<T extends Entity>(props: EntitySelectorProps<T>): JSX.Element {
    const { value, onLink, getEntities, getName, filter, defaultValue } = props;

    const onChange = (props as PrimitiveProps<Nullable<T>>).onChange as PrimitiveProps<Nullable<T>>["onChange"] | undefined;

    const classes = useStyles();

    const comboBoxRef = useRef<HTMLInputElement>(null);

    // Build options with uniqueId as key
    const options = useMemo(() => {
        return getEntities()
            .filter((e) => e.uniqueId !== undefined && (!filter || filter(e)))
            .map((entity) => ({
                label: getName(entity)?.toString() || "",
                value: entity.uniqueId.toString(),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [getEntities, getName, filter]);

    const [isEditing, setIsEditing] = useState(false);

    const [enteringEditMode, pulseEnteringEditMode] = useImpulse<true>();

    useEffect(() => {
        if (enteringEditMode) {
            comboBoxRef.current?.focus();
        }
    }, [enteringEditMode]);

    const handleEntitySelect = (key: string) => {
        const entity = getEntities().find((e) => e.uniqueId.toString() === key);
        onChange?.(entity ?? null);
        setIsEditing(false);
    };

    // Get current entity key for display
    const currentKey = value ? value.uniqueId.toString() : "";

    if (value && !isEditing) {
        // If there is a value and we are not editing, show the link view
        return (
            <div className={classes.linkDiv}>
                <Tooltip content={getName(value)} relationship="label">
                    <Link className={classes.link} value={getName(value)} onLink={() => onLink(value)} />
                </Tooltip>
                {/* Only allow changing the linked entity if an onChange handler is provided */}
                {onChange &&
                    (defaultValue !== undefined ? (
                        // If the defaultValue is specified, then allow resetting to the default
                        <Tooltip content="Unlink" relationship="label">
                            <Button
                                icon={LinkDismissRegular}
                                onClick={() => {
                                    pulseEnteringEditMode(true);
                                    onChange(defaultValue);
                                }}
                            />
                        </Tooltip>
                    ) : (
                        // Otherwise, just allow editing to a new value
                        <Tooltip content="Edit Link" relationship="label">
                            <Button
                                icon={LinkEditRegular}
                                onClick={() => {
                                    pulseEnteringEditMode(true);
                                    setIsEditing(true);
                                }}
                            />
                        </Tooltip>
                    ))}
            </div>
        );
    } else {
        // Otherwise, show the ComboBox for selection
        return <ComboBox ref={comboBoxRef} defaultOpen={enteringEditMode} label="" options={options} value={currentKey} onChange={handleEntitySelect} />;
    }
}
EntitySelector.displayName = "EntitySelector";

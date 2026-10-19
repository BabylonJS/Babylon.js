import { makeStyles, tokens, Tooltip } from "@fluentui/react-components";
import { LinkDismissRegular, LinkEditRegular } from "@fluentui/react-icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { useImpulse } from "../hooks/transientStateHooks";
import { Button } from "./button";
import { ComboBox } from "./comboBox";
import { Link } from "./link";

/**
 * Runtime-neutral selection and navigation for an optionally linked resource.
 * The caller supplies stable IDs and only the mutation callbacks its runtime supports.
 */
export type ResourceSelectorProps<T> = {
    /** Currently linked resource, or null when unlinked. */
    value: T | null;
    /** Returns candidate resources for selection. */
    getEntities: () => readonly T[];
    /** Returns the resource's display name. */
    getName: (entity: T) => string;
    /** Returns a stable identity for each candidate, including duplicate display names. */
    getId: (entity: T) => string;
    /** Restricts the selectable candidates. */
    filter?: (entity: T) => boolean;
    /** Assigns a selected resource; receives null if an option became stale. */
    onSelect?: (entity: T | null) => void;
    /** Clears the current link, when supported. Takes precedence over the edit action. */
    onClear?: () => void;
    /** Navigates to the linked resource, when supported. */
    onLink?: (entity: T) => void;
    /** Disables link mutations and selection while an operation is pending. */
    disabled?: boolean;
    /** Accessible name when the visible label is supplied by a containing property line. */
    ariaLabel?: string;
    /** Keeps the Babylon entity selector visible even when its immutable value is empty. */
    showEmptySelector?: boolean;
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
 * Displays a linked resource with one unlink-or-edit action, or a selector when unlinked.
 * @param props Resource identity, selection, navigation, and supported actions.
 * @returns The linked value or its replacement selector.
 */
export function ResourceSelector<T>(props: ResourceSelectorProps<T>): JSX.Element {
    const { value, getEntities, getName, getId, filter, onSelect, onClear, onLink, disabled, ariaLabel, showEmptySelector } = props;
    const classes = useStyles();
    const comboBoxRef = useRef<HTMLInputElement>(null);
    const options = useMemo(
        () =>
            getEntities()
                .filter((entity) => !filter || filter(entity))
                .map((entity) => ({ label: getName(entity)?.toString() || "", value: getId(entity) }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [getEntities, getName, getId, filter]
    );
    const [isEditing, setIsEditing] = useState(false);
    const [enteringEditMode, pulseEnteringEditMode] = useImpulse<true>();

    useEffect(() => {
        if (enteringEditMode) {
            comboBoxRef.current?.focus();
        }
    }, [enteringEditMode]);

    if (value !== null && !isEditing) {
        return (
            <div className={classes.linkDiv}>
                <Tooltip content={getName(value)} relationship="label">
                    <Link
                        className={classes.link}
                        value={getName(value)}
                        onLink={onLink ? () => onLink(value) : undefined}
                        aria-label={onLink && ariaLabel ? `${ariaLabel}: open ${getName(value)}` : undefined}
                    />
                </Tooltip>
                {onClear ? (
                    <Tooltip content="Unlink" relationship="label">
                        <Button
                            icon={LinkDismissRegular}
                            ariaLabel={ariaLabel ? `Clear ${ariaLabel}` : "Unlink"}
                            disabled={disabled}
                            onClick={() => {
                                pulseEnteringEditMode(true);
                                onClear();
                            }}
                        />
                    </Tooltip>
                ) : onSelect ? (
                    <Tooltip content="Edit Link" relationship="label">
                        <Button
                            icon={LinkEditRegular}
                            ariaLabel={ariaLabel ? `Change ${ariaLabel}` : "Edit Link"}
                            disabled={disabled}
                            onClick={() => {
                                pulseEnteringEditMode(true);
                                setIsEditing(true);
                            }}
                        />
                    </Tooltip>
                ) : undefined}
            </div>
        );
    }

    if (!onSelect && !showEmptySelector) {
        return <Link value="None" />;
    }

    return (
        <ComboBox
            ref={comboBoxRef}
            defaultOpen={enteringEditMode}
            label=""
            ariaLabel={ariaLabel}
            disabled={disabled}
            options={options}
            value={value !== null ? getId(value) : ""}
            onChange={(id) => {
                onSelect?.(getEntities().find((entity) => getId(entity) === id) ?? null);
                setIsEditing(false);
            }}
        />
    );
}
ResourceSelector.displayName = "ResourceSelector";

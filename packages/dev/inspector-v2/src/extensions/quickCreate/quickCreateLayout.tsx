import type { FunctionComponent, ReactNode } from "react";
import { useState, useCallback } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import type { ISelectionService } from "../../services/selectionService";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { useToast } from "shared-ui-components/fluent/primitives/toast";
import { SettingsPopover } from "./settingsPopover";
import { LinkToEntity } from "../../components/properties/linkToEntityPropertyLine";

type CreatedEntity = { name: string };

const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
    row: { display: "flex", alignItems: "center", gap: "4px" },
    rightAligned: { marginLeft: "auto" },
});

type QuickCreateSectionProps = {
    children: ReactNode;
};

/**
 * Container component for quick create sections that provides consistent column layout with spacing
 * @param props - Component props
 * @returns React component
 */
export const QuickCreateSection: FunctionComponent<QuickCreateSectionProps> = ({ children }) => {
    const classes = useStyles();
    return <div className={classes.section}>{children}</div>;
};

type QuickCreateRowProps = {
    children: ReactNode;
};

/**
 * Container component for quick create rows that provides consistent row layout for button + settings popover
 * @param props - Component props
 * @returns React component
 */
export const QuickCreateRow: FunctionComponent<QuickCreateRowProps> = ({ children }) => {
    const classes = useStyles();
    return <div className={classes.row}>{children}</div>;
};

type QuickCreateItemProps = {
    /** The selection service used by the go-to-entity button */
    selectionService: ISelectionService;
    /** Label for the quick-create button */
    label: string;
    /** Called when the quick-create button is clicked. Return the created entity (or a Promise that resolves to it) for toast + go-to. */
    onCreate: () => CreatedEntity | Promise<CreatedEntity>;
    /** Optional override for the settings popover's Create button. If omitted, the popover's Create button calls `onCreate`. */
    onSettingsCreate?: () => CreatedEntity | Promise<CreatedEntity>;
    /** Optional settings popover content (form fields). When provided, a settings popover with a Create button is rendered next to the quick-create button. */
    children?: ReactNode;
};

/**
 * Reusable row component for entity creation. Renders a quick-create button, an optional settings popover
 * (with a baked-in Create button), and a "go to entity" button. Manages its own state for the last created entity
 * and shows a toast on creation.
 * @param props - The label, creation handler, selection service, and optional settings content
 * @returns A row with a button, optional settings popover, and go-to-entity button
 */
export const QuickCreateItem: FunctionComponent<QuickCreateItemProps> = ({ selectionService, label, onCreate, onSettingsCreate, children }) => {
    const [lastCreatedEntity, setLastCreatedEntity] = useState<{ name: string } | null>(null);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const { showToast } = useToast();
    const classes = useStyles();

    const handleCreate = useCallback(
        async (factory: () => CreatedEntity | Promise<CreatedEntity>) => {
            try {
                const entity = await factory();
                setLastCreatedEntity(entity);
                showToast(`Created ${entity.name}`);
            } catch (e) {
                showToast(`Creation failed: ${e instanceof Error ? e.message : String(e)}`);
            }
        },
        [showToast]
    );

    return (
        <div className={classes.row}>
            <Button onClick={() => void handleCreate(onCreate)} label={label} />
            {children && (
                <SettingsPopover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    {children}
                    <Button
                        appearance="primary"
                        onClick={() => {
                            setPopoverOpen(false);
                            void handleCreate(onSettingsCreate ?? onCreate);
                        }}
                        label="Create"
                    />
                </SettingsPopover>
            )}
            <div className={classes.rightAligned}>
                <LinkToEntity entity={lastCreatedEntity} selectionService={selectionService} />
            </div>
        </div>
    );
};

import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { LinkDismissRegular, LinkEditRegular } from "@fluentui/react-icons";
import { type ReactElement, useMemo, useState } from "react";

import { Button } from "../../primitives/button";
import { ComboBox } from "../../primitives/comboBox";
import { Link } from "../../primitives/link";
import { Tooltip } from "../../primitives/tooltip";
import { PropertyLine } from "./propertyLine";

/** Directional mutations supported by a texture binding. */
export type TextureBindingWriteCapabilities<TextureT> = Readonly<{
    assign?: (texture: TextureT) => void;
    clear?: () => void;
}>;

/** Runtime-neutral presentation and mutation props for a material texture binding. */
export type MaterialTextureBindingProps<TextureT> = Readonly<{
    id: string;
    label: string;
    value: TextureT | null;
    candidates: readonly TextureT[];
    getDisplayName: (texture: TextureT) => string;
    getKind: (texture: TextureT) => string;
    acceptedKinds: readonly string[];
    isCandidateAccepted?: (texture: TextureT) => boolean;
    getId?: (texture: TextureT) => string;
    write?: TextureBindingWriteCapabilities<TextureT>;
    navigate?: (texture: TextureT) => void;
    pending?: boolean;
    error?: string;
    expandedContent?: ReactElement;
}>;

const useStyles = makeStyles({
    content: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
    },
    link: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
});

/**
 * Displays a runtime-neutral, direction-aware material texture binding.
 * @param props The binding props. Missing assign, clear, or navigation callbacks remove those actions.
 * @returns A texture binding property line.
 */
export const MaterialTextureBindingPropertyLine = <TextureT,>(props: MaterialTextureBindingProps<TextureT>): JSX.Element => {
    const classes = useStyles();
    const [editing, setEditing] = useState(false);
    const candidates = useMemo(
        () => props.candidates.filter((texture) => props.acceptedKinds.includes(props.getKind(texture)) && (props.isCandidateAccepted?.(texture) ?? true)),
        [props.acceptedKinds, props.candidates, props.getKind, props.isCandidateAccepted]
    );
    const getId = (texture: TextureT) => props.getId?.(texture) ?? String(props.candidates.indexOf(texture));
    const options = candidates.map((texture) => ({ label: props.getDisplayName(texture), value: getId(texture) }));

    const content = (
        <div className={classes.content}>
            {props.value && !editing ? (
                <>
                    <Link
                        className={classes.link}
                        value={props.getDisplayName(props.value)}
                        onLink={props.navigate ? () => props.navigate?.(props.value!) : undefined}
                        aria-label={props.navigate ? `${props.label}: open ${props.getDisplayName(props.value)}` : undefined}
                    />
                    {props.write?.clear ? (
                        <Tooltip content="Unlink">
                            <Button icon={LinkDismissRegular} ariaLabel={`Clear ${props.label}`} disabled={props.pending} onClick={() => props.write?.clear?.()} />
                        </Tooltip>
                    ) : undefined}
                    {props.write?.assign ? (
                        <Tooltip content="Edit Link">
                            <Button icon={LinkEditRegular} ariaLabel={`Change ${props.label}`} disabled={props.pending} onClick={() => setEditing(true)} />
                        </Tooltip>
                    ) : undefined}
                </>
            ) : props.write?.assign ? (
                <ComboBox
                    label=""
                    ariaLabel={props.label}
                    disabled={props.pending}
                    value={props.value ? getId(props.value) : ""}
                    options={options}
                    onChange={(id) => {
                        const selected = candidates.find((texture) => getId(texture) === id);
                        if (selected) {
                            props.write?.assign?.(selected);
                            setEditing(false);
                        }
                    }}
                />
            ) : (
                <Link value="None" />
            )}
            {props.pending ? <Body1 role="status">Applying…</Body1> : undefined}
        </div>
    );

    return (
        <div role={props.error ? "alert" : undefined} aria-label={props.error ? `${props.label}: ${props.error}` : undefined} aria-busy={props.pending}>
            {props.expandedContent ? (
                <PropertyLine label={props.label} uniqueId={props.id} description={props.error} expandedContent={props.expandedContent}>
                    {content}
                </PropertyLine>
            ) : (
                <PropertyLine label={props.label} uniqueId={props.id} description={props.error}>
                    {content}
                </PropertyLine>
            )}
        </div>
    );
};

import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { type ReactElement, useMemo } from "react";

import { ResourceSelector } from "../../primitives/resourceSelector";
import { PropertyLine } from "./propertyLine";

const useStyles = makeStyles({
    content: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
    },
});

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

/**
 * Displays a runtime-neutral, direction-aware material texture binding.
 * @param props The binding props. Missing assign, clear, or navigation callbacks remove those actions.
 * @returns A texture binding property line.
 */
export const MaterialTextureBindingPropertyLine = <TextureT,>(props: MaterialTextureBindingProps<TextureT>): JSX.Element => {
    const classes = useStyles();
    const candidates = useMemo(
        () => props.candidates.filter((texture) => props.acceptedKinds.includes(props.getKind(texture)) && (props.isCandidateAccepted?.(texture) ?? true)),
        [props.acceptedKinds, props.candidates, props.getKind, props.isCandidateAccepted]
    );
    const getId = (texture: TextureT) => props.getId?.(texture) ?? String(props.candidates.indexOf(texture));

    const content = (
        <div className={classes.content}>
            <ResourceSelector
                value={props.value}
                getEntities={() => candidates}
                getName={props.getDisplayName}
                getId={getId}
                onSelect={props.write?.assign ? (texture) => texture && props.write?.assign?.(texture) : undefined}
                onClear={props.write?.clear}
                onLink={props.navigate}
                disabled={props.pending}
                ariaLabel={props.label}
            />
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

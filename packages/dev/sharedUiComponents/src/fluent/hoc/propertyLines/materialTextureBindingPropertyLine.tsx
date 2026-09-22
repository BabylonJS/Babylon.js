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

/** Runtime-neutral presentation and mutation model for a material texture binding. */
export type MaterialTextureBindingModel<TextureT> = Readonly<{
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
 * @param props The binding model. Missing assign, clear, or navigation callbacks remove those actions.
 * @returns A texture binding property line.
 */
export const MaterialTextureBindingPropertyLine = <TextureT,>(props: { model: MaterialTextureBindingModel<TextureT> }): JSX.Element => {
    const { model } = props;
    const classes = useStyles();
    const [editing, setEditing] = useState(false);
    const candidates = useMemo(
        () => model.candidates.filter((texture) => model.acceptedKinds.includes(model.getKind(texture)) && (model.isCandidateAccepted?.(texture) ?? true)),
        [model.acceptedKinds, model.candidates, model.getKind, model.isCandidateAccepted]
    );
    const getId = (texture: TextureT) => model.getId?.(texture) ?? String(model.candidates.indexOf(texture));
    const options = candidates.map((texture) => ({ label: model.getDisplayName(texture), value: getId(texture) }));

    const content = (
        <div className={classes.content}>
            {model.value && !editing ? (
                <>
                    <Link
                        className={classes.link}
                        value={model.getDisplayName(model.value)}
                        onLink={model.navigate ? () => model.navigate?.(model.value!) : undefined}
                        aria-label={model.navigate ? `${model.label}: open ${model.getDisplayName(model.value)}` : undefined}
                    />
                    {model.write?.clear ? (
                        <Tooltip content="Unlink">
                            <Button icon={LinkDismissRegular} ariaLabel={`Clear ${model.label}`} disabled={model.pending} onClick={() => model.write?.clear?.()} />
                        </Tooltip>
                    ) : undefined}
                    {model.write?.assign ? (
                        <Tooltip content="Edit Link">
                            <Button icon={LinkEditRegular} ariaLabel={`Change ${model.label}`} disabled={model.pending} onClick={() => setEditing(true)} />
                        </Tooltip>
                    ) : undefined}
                </>
            ) : model.write?.assign ? (
                <ComboBox
                    label=""
                    ariaLabel={model.label}
                    disabled={model.pending}
                    value={model.value ? getId(model.value) : ""}
                    options={options}
                    onChange={(id) => {
                        const selected = candidates.find((texture) => getId(texture) === id);
                        if (selected) {
                            model.write?.assign?.(selected);
                            setEditing(false);
                        }
                    }}
                />
            ) : (
                <Link value="None" />
            )}
            {model.pending ? <Body1 role="status">Applying…</Body1> : undefined}
        </div>
    );

    return (
        <div role={model.error ? "alert" : undefined} aria-label={model.error ? `${model.label}: ${model.error}` : undefined} aria-busy={model.pending}>
            {model.expandedContent ? (
                <PropertyLine label={model.label} uniqueId={model.id} description={model.error} expandedContent={model.expandedContent}>
                    {content}
                </PropertyLine>
            ) : (
                <PropertyLine label={model.label} uniqueId={model.id} description={model.error}>
                    {content}
                </PropertyLine>
            )}
        </div>
    );
};

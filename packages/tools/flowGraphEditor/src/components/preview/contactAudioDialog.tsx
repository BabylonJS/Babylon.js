import * as React from "react";
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Dropdown, Label, Option, Body1, makeStyles } from "@fluentui/react-components";
import { ContactPairs, type IContactAudioAsset, type IContactAudioDocument } from "../../contactAudio";
import { CreateContactAudioDefaults, type ContactAudioRuntime, type IContactObject } from "../../contactAudioRuntime";

const useStyles = makeStyles({
    surface: { width: "min(560px, calc(100vw - 32px))", height: "min(720px, calc(100dvh - 32px))", boxSizing: "border-box", overflow: "hidden" },
    body: { height: "100%", minHeight: 0 },
    content: { display: "flex", flexDirection: "column", gap: "12px", minHeight: 0, overflowY: "auto" },
    error: { color: "var(--colorPaletteRedForeground1)" },
    row: { display: "flex", flexWrap: "wrap", gap: "8px" },
});

/**
 * Guided contact cue authoring for source-preserving glTF scenes.
 * @returns guided authoring dialog
 */
export function ContactAudioDialog(props: {
    objects: IContactObject[];
    data: IContactAudioDocument;
    runtime: ContactAudioRuntime;
    selectedNode?: number;
    onClose: () => void;
    onSaveAsync: (objects: number[], partners: number[], asset: IContactAudioAsset | null, cue?: string) => Promise<void>;
}) {
    const styles = useStyles();
    const defaults = React.useMemo(CreateContactAudioDefaults, []);
    const [assets, setAssets] = React.useState([...props.data.audio, ...defaults.filter((asset) => !props.data.audio.some((entry) => entry.uri === asset.uri))]);
    const [assetIndex, setAssetIndex] = React.useState(0);
    const [objects, setObjects] = React.useState<number[]>(
        props.objects.some((entry) => entry.shape.node === props.selectedNode && entry.shape.type === "sphere") ? [props.selectedNode!] : []
    );
    const [partners, setPartners] = React.useState<number[]>([]);
    const [eachOther, setEachOther] = React.useState(true);
    const [cue, setCue] = React.useState<string | undefined>();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");
    const alive = React.useRef(true);
    React.useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            props.runtime.stopAudition(true);
        };
    }, [props.runtime]);
    const label = (node: number) => props.objects.find((entry) => entry.shape.node === node)?.label ?? `Missing glTF node ${node}`;
    const ruleLabel = (value: string) => {
        const rule = props.data.rules.find((entry) => entry.cue === value)!;
        const each = rule.objects.length === rule.partners.length && rule.objects.every((node) => rule.partners.includes(node));
        const asset = props.data.audio[props.data.sources[props.data.emitters[rule.emitter].sources[0]].audio];
        return `${asset.name}: ${rule.objects.length} ball${rule.objects.length === 1 ? "" : "s"} → ${each ? "each other" : `${rule.partners.length} other object${rule.partners.length === 1 ? "" : "s"}`}`;
    };
    const targetNodes = eachOther ? objects : partners;
    let pairCount = 0;
    try {
        pairCount = ContactPairs({ objects, partners: targetNodes }).length;
    } catch {
        /* The chooser explains the limit below. */
    }
    const runAsync = async (action: () => Promise<void>) => {
        setBusy(true);
        setError("");
        try {
            await action();
        } catch (err) {
            if (alive.current) {
                setError(err instanceof Error ? err.message : String(err));
            }
        } finally {
            if (alive.current) {
                setBusy(false);
            }
        }
    };
    const selectRule = (value?: string) => {
        const rule = props.data.rules.find((entry) => entry.cue === value);
        setCue(rule?.cue);
        setError("");
        if (rule) {
            setObjects(rule.objects);
            setPartners(rule.partners);
            setEachOther(rule.objects.length === rule.partners.length && rule.objects.every((node) => rule.partners.includes(node)));
            const audio = props.data.sources[props.data.emitters[rule.emitter].sources[0]].audio;
            setAssetIndex(audio);
        } else {
            setObjects([]);
            setPartners([]);
            setEachOther(true);
        }
    };
    return (
        <Dialog
            open
            onOpenChange={(_, data) => {
                if (!data.open && !busy) {
                    props.onClose();
                }
            }}
        >
            <DialogSurface className={styles.surface}>
                <DialogBody className={styles.body}>
                    <DialogTitle>Add sound reaction</DialogTitle>
                    <DialogContent className={styles.content}>
                        <Body1>Play a sound when the selected balls first touch their contact objects. Stop the preview and click a ball to preselect it.</Body1>
                        <Label htmlFor="contact-saved-rule">Reaction</Label>
                        <Dropdown
                            id="contact-saved-rule"
                            aria-label="Sound reaction"
                            disabled={busy}
                            selectedOptions={[cue ?? "new"]}
                            value={cue ? ruleLabel(cue) : "New reaction"}
                            onOptionSelect={(_, data) => selectRule(data.optionValue)}
                        >
                            <Option value="new">New reaction</Option>
                            {props.data.rules.map((rule) => (
                                <Option key={rule.cue} value={rule.cue}>
                                    {ruleLabel(rule.cue)}
                                </Option>
                            ))}
                        </Dropdown>
                        <Label htmlFor="contact-objects">Balls</Label>
                        <Dropdown
                            id="contact-objects"
                            aria-label="Contact balls"
                            multiselect
                            disabled={busy}
                            selectedOptions={objects.map(String)}
                            value={objects.map(label).join(", ")}
                            placeholder="Choose one or more balls"
                            onOptionSelect={(_, data) => setObjects(data.selectedOptions.map(Number))}
                        >
                            {props.objects
                                .filter((entry) => entry.shape.type === "sphere")
                                .map((entry) => (
                                    <Option key={entry.shape.node} value={String(entry.shape.node)}>
                                        {entry.label}
                                    </Option>
                                ))}
                        </Dropdown>
                        <Label htmlFor="contact-with">Contact with</Label>
                        <Dropdown
                            id="contact-with"
                            aria-label="Contact with"
                            disabled={busy}
                            selectedOptions={[eachOther ? "each" : "other"]}
                            value={eachOther ? "Each other" : "Other objects"}
                            onOptionSelect={(_, data) => setEachOther(data.optionValue === "each")}
                        >
                            <Option value="each">Each other</Option>
                            <Option value="other">Other objects</Option>
                        </Dropdown>
                        {!eachOther && (
                            <>
                                <Label htmlFor="contact-partners">Platforms or other balls</Label>
                                <Dropdown
                                    id="contact-partners"
                                    aria-label="Contact partners"
                                    multiselect
                                    disabled={busy}
                                    selectedOptions={partners.map(String)}
                                    value={partners.map(label).join(", ")}
                                    placeholder="Choose contact objects"
                                    onOptionSelect={(_, data) => setPartners(data.selectedOptions.map(Number))}
                                >
                                    {props.objects
                                        .filter((entry) => !objects.includes(entry.shape.node))
                                        .map((entry) => (
                                            <Option key={entry.shape.node} value={String(entry.shape.node)}>
                                                {entry.label}
                                            </Option>
                                        ))}
                                </Dropdown>
                            </>
                        )}
                        <Body1>
                            {pairCount
                                ? `${pairCount} distinct contact pair${pairCount === 1 ? "" : "s"}.`
                                : "Choose at least two balls for Each other, or choose balls and other contact objects. Maximum 256 pairs."}
                        </Body1>
                        <Label htmlFor="contact-sound">Sound</Label>
                        <Dropdown
                            id="contact-sound"
                            aria-label="Contact sound"
                            disabled={busy}
                            selectedOptions={[String(assetIndex)]}
                            value={assets[assetIndex]?.name ?? "Choose a sound"}
                            onOptionSelect={(_, data) => setAssetIndex(Number(data.optionValue))}
                        >
                            {assets.map((asset, index) => (
                                <Option
                                    key={index}
                                    value={String(index)}
                                >{`${asset.name} (${index < props.data.audio.length ? "saved" : defaults.some((entry) => entry.uri === asset.uri) ? "built in" : "imported"})`}</Option>
                            ))}
                        </Dropdown>
                        <div className={styles.row}>
                            <Button disabled={busy || !assets[assetIndex]} onClick={() => void runAsync(async () => await props.runtime.auditionAsync(assets[assetIndex]))}>
                                Listen
                            </Button>
                            <label>
                                Choose audio file
                                <input
                                    aria-label="Choose audio file"
                                    type="file"
                                    accept=".mp3,.aac,.m4a,.mp4,.ogg,.opus,audio/mpeg,audio/aac,audio/mp4,audio/ogg"
                                    disabled={busy}
                                    onChange={(event) => {
                                        const file = event.currentTarget.files?.[0];
                                        event.currentTarget.value = "";
                                        if (file) {
                                            void runAsync(async () => {
                                                const asset = await props.runtime.importAudioAsync(file);
                                                if (!alive.current) {
                                                    return;
                                                }
                                                const existing = assets.findIndex((entry) => entry.uri === asset.uri);
                                                if (existing >= 0) {
                                                    setAssetIndex(existing);
                                                } else {
                                                    setAssets([...assets, asset]);
                                                    setAssetIndex(assets.length);
                                                }
                                            });
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <Body1>MP3, AAC/M4A, or Ogg Opus: up to 10 MB and 30 seconds, mono or stereo. Original encoded audio is embedded in the downloaded asset.</Body1>
                        <details>
                            <summary>Contact limits</summary>
                            <Body1>
                                Contacts use sphere and box bounds sampled once per rendered frame. Box bounds can extend beyond the visible surface; fast objects can pass through
                                between frames. Skinned, multi-primitive, sheared, and stretched spherical objects are unavailable.
                            </Body1>
                        </details>
                        <Body1>Sound reactions are supported by this editor. Other viewers can open the scene but may not play these sounds.</Body1>
                        {error && (
                            <Body1 role="alert" className={styles.error}>
                                {error}
                            </Body1>
                        )}
                    </DialogContent>
                    <DialogActions>
                        {cue && (
                            <Button disabled={busy} onClick={() => void runAsync(async () => await props.onSaveAsync([], [], null, cue))}>
                                Remove reaction
                            </Button>
                        )}
                        <Button disabled={busy} onClick={props.onClose}>
                            Cancel
                        </Button>
                        <Button
                            appearance="primary"
                            disabled={busy || !pairCount || !assets[assetIndex]}
                            onClick={() => void runAsync(async () => await props.onSaveAsync(objects, targetNodes, assets[assetIndex], cue))}
                        >
                            {busy ? "Preparing…" : "Save sound reaction"}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}

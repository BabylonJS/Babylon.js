import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { IExtension } from "../extensibility/extensionManager";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";
import type { PersonMetadata } from "../extensibility/extensionFeed";

import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Avatar,
    AvatarGroup,
    AvatarGroupItem,
    Body1,
    Body1Strong,
    Button,
    Caption1,
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
    Dialog,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Divider,
    makeStyles,
    Persona,
    PresenceBadge,
    Spinner,
    Tab,
    TabList,
    tokens,
    Tooltip,
} from "@fluentui/react-components";
import { Fade } from "@fluentui/react-motion-components-preview";
import {
    AddRegular,
    AppsAddInRegular,
    ArrowDownloadRegular,
    BranchForkRegular,
    BugRegular,
    CheckmarkCircleFilled,
    CheckmarkCircleRegular,
    DeleteRegular,
    DismissRegular,
    LinkRegular,
    PresenceAvailableRegular,
} from "@fluentui/react-icons";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Logger } from "core/Misc/logger";

import { TeachingMoment } from "../components/teachingMoment";
import { useExtensionManager } from "../contexts/extensionManagerContext";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { ShellServiceIdentity } from "./shellService";
import { Link } from "shared-ui-components/fluent/primitives/link";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    extensionButton: {},
    extensionsDialogSurface: {
        height: "auto",
        width: "70vw",
        maxWidth: "600px",
        maxHeight: "70vh",
        backgroundColor: tokens.colorNeutralBackground2,
    },
    extensionDialogBody: {
        maxWidth: "100%",
        maxHeight: "100%",
    },
    extensionDialogContent: {
        marginLeft: `calc(-1 * ${tokens.spacingHorizontalM})`,
        marginRight: `calc(-1 * ${tokens.spacingHorizontalS})`,
    },
    extensionHeader: {},
    extensionItem: {},
    extensionCardPreview: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalL,
        //backgroundColor: tokens.colorNeutralBackground2,
    },
    extensionIntro: {
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalM,
    },
    extensionDescription: {
        display: "flex",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalS,
        // padding: `${tokens.spacingVerticalM} 0`,
    },
    extensionButtonContainer: {
        marginLeft: "auto",
        alignSelf: "flex-start",
    },
    spinner: {
        animationDuration: "1s",
        animationName: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
    },
});

function AsPersonMetadata(person: string | PersonMetadata): PersonMetadata {
    if (typeof person === "string") {
        return { name: person } satisfies PersonMetadata;
    }
    return person;
}

function userPeopleMetadata(people: readonly (string | PersonMetadata)[] = []) {
    const [peopleMetadataEx, setPeopleMetadataEx] = useState<(PersonMetadata & { avatarUrl?: string })[]>(people.map(AsPersonMetadata));

    useEffect(() => {
        people.forEach(async (person, index) => {
            const personMetadata = AsPersonMetadata(person);
            if (personMetadata.forumUserName) {
                try {
                    const json = await (await fetch(`https://forum.babylonjs.com/u/${personMetadata.forumUserName}.json`)).json();
                    const avatarRelativeUrl = json.user?.avatar_template?.replace("{size}", "96");
                    if (avatarRelativeUrl) {
                        const avatarUrl = `https://forum.babylonjs.com${avatarRelativeUrl}`;
                        setPeopleMetadataEx((prev) => {
                            const newMetadata = [...prev];
                            newMetadata[index] = { ...newMetadata[index], avatarUrl };
                            return newMetadata;
                        });
                    }
                } catch {
                    // Ignore, non-fatal
                }
            }
        });
    }, [people]);

    return peopleMetadataEx;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const useTeachingMoment = MakePopoverTeachingMoment("Extensions");

const WebSiteResource: FunctionComponent<{ url: string; icon: JSX.Element; label: string }> = (props) => {
    const { url, icon, label } = props;
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {/* <Body1 underline>{label}</Body1> */}
            <Tooltip content={label} relationship="label" positioning="before" withArrow>
                <div style={{ display: "flex", flexDirection: "row", columnGap: tokens.spacingHorizontalS, alignItems: "center" }}>
                    {icon}
                    <Link url={url} value={url} />
                </div>
            </Tooltip>
        </div>
    );
};

const ExtensionDetails: FunctionComponent<{ extension: IExtension }> = memo((props) => {
    const { extension } = props;
    const { metadata } = extension;

    const hasPreviewDetails = metadata.homepage || metadata.repository || metadata.bugs || metadata.author || (metadata.contributors && metadata.contributors.length > 0);
    const subHeader = [metadata.version ? `${metadata.version}` : null, metadata.license ? `${metadata.license}` : null].filter(Boolean).join(" | ");

    const classes = useStyles();

    const [canInstall, setCanInstall] = useState(false);
    const [canUninstall, setCanUninstall] = useState(false);
    const [isStateChanging, setIsStateChanging] = useState(false);

    useEffect(() => {
        const updateState = () => {
            setCanInstall(!extension.isInstalled && !extension.isStateChanging);
            setCanUninstall(extension.isInstalled && !extension.isStateChanging);
            setIsStateChanging(extension.isStateChanging);
        };

        const stateChangedHandlerRegistration = extension.addStateChangedHandler(updateState);
        updateState();

        return stateChangedHandlerRegistration.dispose;
    }, [extension]);

    const [author] = userPeopleMetadata(useMemo(() => (metadata.author ? [metadata.author] : []), [metadata.author]));
    const contributors = userPeopleMetadata(metadata.contributors);

    const install = useCallback(async () => {
        try {
            await extension.installAsync();
        } catch {
            // Ignore errors. Other parts of the infrastructure handle them and communicate them to the user.
        }
    }, [extension]);

    const uninstall = useCallback(async () => {
        try {
            await extension.uninstallAsync();
        } catch {
            // Ignore errors. Other parts of the infrastructure handle them and communicate them to the user.
        }
    }, [extension]);

    return (
        <AccordionItem className={classes.extensionItem} value={extension.metadata.name}>
            <AccordionHeader className={classes.extensionHeader} expandIconPosition="end">
                <div style={{ display: "flex", flexDirection: "row", columnGap: tokens.spacingHorizontalS, alignItems: "center" }}>
                    <Body1Strong>{extension.metadata.name}</Body1Strong>
                    {/* <CheckmarkCircleFilled /> */}
                    {/* <PresenceAvailableRegular /> */}
                    <Fade visible={extension.isInstalled}>
                        <PresenceBadge size="small" />
                    </Fade>
                </div>
            </AccordionHeader>
            <AccordionPanel>
                <Card>
                    <CardHeader header={<Body1>{metadata.description}</Body1>} description={<Caption1 italic>{subHeader}</Caption1>} />
                    {hasPreviewDetails && (
                        <CardPreview className={classes.extensionCardPreview}>
                            <div style={{ display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS }}>
                                {metadata.homepage && <WebSiteResource url={metadata.homepage} icon={<LinkRegular />} label="Homepage" />}
                                {metadata.repository && <WebSiteResource url={metadata.repository} icon={<BranchForkRegular />} label="Repository" />}
                                {metadata.bugs && <WebSiteResource url={metadata.bugs} icon={<BugRegular />} label="Report Issues" />}
                            </div>
                            {/* <div style={{ display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalS }}> */}
                            <div style={{ display: "flex", flexDirection: "row", columnGap: tokens.spacingHorizontalXL }}>
                                {author && (
                                    <>
                                        {/* <Body1 underline>Author</Body1>
                                        <div style={{ display: "flex", flexDirection: "row", columnGap: tokens.spacingHorizontalS, alignItems: "center" }}>
                                            <Avatar name={metadata.author} />
                                            <Body1>{metadata.author}</Body1>
                                        </div> */}
                                        <Persona name={author.name} secondaryText="Author" />
                                    </>
                                )}
                                {contributors.length > 0 && (
                                    <>
                                        {/* <Body1 underline>Contributors</Body1> */}
                                        <AvatarGroup layout="stack">
                                            {contributors.map((contributor) => (
                                                <Tooltip key={contributor.name} content={contributor.name} relationship="label" withArrow>
                                                    <AvatarGroupItem name={contributor.name} />
                                                </Tooltip>
                                            ))}
                                        </AvatarGroup>
                                    </>
                                )}
                            </div>
                            {/* {subHeader && <Caption1>{subHeader}</Caption1>} */}
                        </CardPreview>
                    )}
                    <CardFooter>
                        {canInstall && (
                            <Button appearance="primary" size="small" icon={<ArrowDownloadRegular />} onClick={install}>
                                Get
                            </Button>
                        )}
                        {canUninstall && (
                            <Button appearance="secondary" size="small" icon={<DeleteRegular />} onClick={uninstall}>
                                Remove
                            </Button>
                        )}
                        {isStateChanging && <Spinner className={classes.spinner} size="extra-small" />}
                    </CardFooter>
                </Card>
            </AccordionPanel>
        </AccordionItem>

        // <div style={{ display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM }}>
        //     <div className={classes.extensionDescription}>
        //         <Body1>{metadata.description}</Body1>
        //         <div className={classes.extensionButtonContainer}>
        //             {canInstall && (
        //                 <Button appearance="primary" size="small" icon={<AddRegular />} onClick={install}>
        //                     Get
        //                 </Button>
        //             )}
        //             {canUninstall && (
        //                 <Button appearance="secondary" size="small" icon={<DeleteRegular />} onClick={uninstall}>
        //                     Remove
        //                 </Button>
        //             )}
        //             {isStateChanging && <Spinner className={classes.spinner} size="extra-small" />}
        //         </div>
        //     </div>

        //     {metadata.homepage && <WebSiteResource url={metadata.homepage} icon={<LinkRegular />} label="Homepage" />}
        //     {metadata.repository && <WebSiteResource url={metadata.repository} icon={<BranchForkRegular />} label="Repository" />}
        //     {metadata.bugs && <WebSiteResource url={metadata.bugs} icon={<BugRegular />} label="Report Issues" />}
        // </div>
    );
});

type TabValue = "available" | "installed";

export const ExtensionListServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "ExtensionList",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToolbarItem({
            key: "ExtensionList",
            horizontalLocation: "right",
            verticalLocation: "top",
            suppressTeachingMoment: true,
            order: -200,
            component: () => {
                const classes = useStyles();

                const [selectedTab, setSelectedTab] = useState<TabValue>("available");
                const extensionManager = useExtensionManager();
                const [extensions, setExtensions] = useState<IExtension[]>([]);

                useEffect(() => {
                    if (extensionManager) {
                        const populateExtensionsAsync = async () => {
                            const query = await extensionManager.queryExtensionsAsync(undefined, undefined, selectedTab === "installed");
                            const extensions = await query.getExtensionsAsync(0, query.totalCount);
                            setExtensions(extensions);
                        };

                        // eslint-disable-next-line github/no-then
                        populateExtensionsAsync().catch((error) => {
                            Logger.Warn(`Failed to populate extensions: ${error}`);
                        });
                    }
                }, [extensionManager, selectedTab]);

                const teachingMoment = useTeachingMoment();

                return (
                    <>
                        <TeachingMoment
                            {...teachingMoment}
                            title="Extensions"
                            description="Extensions provide new optional features that can be useful to your specific task or workflow. Click this button to manage extensions."
                        />
                        <Dialog>
                            <DialogTrigger disableButtonEnhancement>
                                <Tooltip content="Manage Extensions" relationship="label">
                                    <Button ref={teachingMoment.targetRef} className={classes.extensionButton} appearance="subtle" icon={<AppsAddInRegular />} />
                                </Tooltip>
                            </DialogTrigger>
                            <DialogSurface className={classes.extensionsDialogSurface}>
                                <DialogBody className={classes.extensionDialogBody}>
                                    <DialogTitle
                                        action={
                                            <DialogTrigger action="close">
                                                <Button appearance="subtle" aria-label="close" icon={<DismissRegular />} />
                                            </DialogTrigger>
                                        }
                                    >
                                        <>
                                            Extensions
                                            <TabList
                                                className={classes.extensionDialogContent}
                                                selectedValue={selectedTab}
                                                onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
                                                    setSelectedTab(data.value as TabValue);
                                                }}
                                            >
                                                <Tab value={"available" satisfies TabValue}>Available</Tab>
                                                <Tab value={"installed" satisfies TabValue}>Installed</Tab>
                                            </TabList>
                                        </>
                                    </DialogTitle>
                                    <DialogContent className={classes.extensionDialogContent}>
                                        <Accordion collapsible>
                                            {extensions.map((extension) => (
                                                <ExtensionDetails key={extension.metadata.name} extension={extension} />
                                            ))}
                                        </Accordion>
                                    </DialogContent>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                    </>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};

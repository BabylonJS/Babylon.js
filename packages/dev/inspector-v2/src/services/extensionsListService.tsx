import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { IExtension } from "../extensibility/extensionManager";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";

import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Body1,
    Body1Strong,
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    makeStyles,
    Spinner,
    Tab,
    TabList,
    tokens,
    Tooltip,
} from "@fluentui/react-components";
import { AppsAddInRegular, DismissRegular } from "@fluentui/react-icons";
import { memo, useCallback, useEffect, useState } from "react";

import { Logger } from "core/Misc";

import { TeachingMoment } from "../components/teachingMoment";
import { useExtensionManager } from "../contexts/extensionManagerContext";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { ShellServiceIdentity } from "./shellService";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    extensionButton: {},
    extensionsDialogSurface: {
        height: "auto",
        width: "70vw",
        maxWidth: "600px",
        maxHeight: "70vh",
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
    extensionPanel: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
        backgroundColor: tokens.colorNeutralBackground2,
    },
    extensionIntro: {
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalM,
    },
    extensionDescription: {
        padding: `${tokens.spacingVerticalM} 0`,
    },
    extensionButtonContainer: {
        display: "flex",
        columnGap: tokens.spacingHorizontalS,
    },
    spinner: {
        animationDuration: "1s",
        animationName: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
    },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
const useTeachingMoment = MakePopoverTeachingMoment("Extensions");

const ExtensionDetails: FunctionComponent<{ extension: IExtension }> = memo((props) => {
    const classes = useStyles();

    const [canInstall, setCanInstall] = useState(false);
    const [canUninstall, setCanUninstall] = useState(false);
    const [isStateChanging, setIsStateChanging] = useState(false);

    useEffect(() => {
        const extension = props.extension;
        const updateState = () => {
            setCanInstall(!extension.isInstalled && !extension.isStateChanging);
            setCanUninstall(extension.isInstalled && !extension.isStateChanging);
            setIsStateChanging(extension.isStateChanging);
        };

        const stateChangedHandlerRegistration = extension.addStateChangedHandler(updateState);
        updateState();

        return stateChangedHandlerRegistration.dispose;
    }, [props.extension]);

    const install = useCallback(async () => {
        try {
            await props.extension.installAsync();
        } catch {
            // Ignore errors. Other parts of the infrastructure handle them and communicate them to the user.
        }
    }, [props.extension]);

    const uninstall = useCallback(async () => {
        try {
            await props.extension.uninstallAsync();
        } catch {
            // Ignore errors. Other parts of the infrastructure handle them and communicate them to the user.
        }
    }, [props.extension]);

    return (
        <>
            <div className={classes.extensionDescription}>
                <Body1>{props.extension.metadata.description}</Body1>
            </div>

            <div className={classes.extensionButtonContainer}>
                {canInstall && (
                    <Button appearance="primary" size="small" onClick={install}>
                        Install
                    </Button>
                )}
                {canUninstall && (
                    <Button appearance="primary" size="small" onClick={uninstall}>
                        Uninstall
                    </Button>
                )}
                {isStateChanging && <Spinner className={classes.spinner} size="extra-small" />}
            </div>
        </>
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
                                        {/* <ProgressBar /> */}
                                        <Accordion collapsible>
                                            {extensions.map((extension) => (
                                                <AccordionItem className={classes.extensionItem} key={extension.metadata.name} value={extension.metadata.name}>
                                                    <AccordionHeader className={classes.extensionHeader} expandIconPosition="end">
                                                        <Body1Strong>{extension.metadata.name}</Body1Strong>
                                                    </AccordionHeader>
                                                    <AccordionPanel className={classes.extensionPanel}>
                                                        <ExtensionDetails extension={extension} />
                                                    </AccordionPanel>
                                                </AccordionItem>
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

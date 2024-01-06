import * as React from "react";
import { FileButtonLineComponent } from "../lines/FileButtonLineComponent";
import { JoinClassNames } from "../classNames";

import style from "./CommandDropdown.modules.scss";

interface ICommandDropdownComponentProps {
    icon?: string;
    tooltip: string;
    defaultValue?: string;
    items: {
        label: string;
        icon?: string;
        fileButton?: boolean;
        onClick?: () => void;
        onCheck?: (value: boolean) => void;
        storeKey?: string;
        isActive?: boolean;
        defaultValue?: boolean | string;
        subItems?: string[];
    }[];
    toRight?: boolean;
}

export class CommandDropdownComponent extends React.Component<ICommandDropdownComponentProps, { isExpanded: boolean; activeState: string }> {
    public constructor(props: ICommandDropdownComponentProps) {
        super(props);

        this.state = { isExpanded: false, activeState: "" };
    }

    public render() {
        return (
            <>
                {this.state.isExpanded && (
                    <div
                        className={style.commandDropdownBlocker}
                        onClick={() => {
                            this.setState({ isExpanded: false });
                        }}
                    ></div>
                )}
                <div className={style.commandDropdownRoot}>
                    <div
                        className={JoinClassNames(style, "commandDropdown", this.state.isExpanded ? "activated" : "")}
                        title={this.props.tooltip}
                        onClick={() => {
                            this.setState({ isExpanded: false });
                            const newState = !this.state.isExpanded;
                            const pgHost = document.getElementById("embed-host");

                            if (pgHost) {
                                pgHost.style.zIndex = newState ? "0" : "10";
                            }

                            this.setState({ isExpanded: newState });
                        }}
                    >
                        {this.props.icon && (
                            <div className={style.commandDropdownIcon}>
                                <img src={this.props.icon} />
                            </div>
                        )}
                        {!this.props.icon && <div className={style.commandDropdownActive}></div>}
                    </div>
                    {this.state.isExpanded && (
                        <div className={JoinClassNames(style, "commandDropdownContent", this.props.toRight ? "toRight" : "")}>
                            {this.props.items.map((m) => {
                                if (!m.fileButton) {
                                    return (
                                        <div
                                            className={JoinClassNames(style, "commandDropdownLabel", m.isActive ? "active" : "")}
                                            key={m.label}
                                            onClick={() => {
                                                if (!m.onClick) {
                                                    this.forceUpdate();
                                                    return;
                                                }
                                                if (!m.subItems) {
                                                    m.onClick();

                                                    this.setState({ isExpanded: false, activeState: m.label });
                                                }
                                            }}
                                            title={m.label}
                                        >
                                            {!m.icon && <div className={style.commandDropdownLabelText}>{(m.isActive ? "> " : "") + m.label}</div>}
                                            {m.icon && (
                                                <div className={style.commandDropdownIcon}>
                                                    <img src={m.icon} />
                                                </div>
                                            )}
                                            {m.onCheck && (
                                                <input
                                                    type="checkBox"
                                                    className={style.commandDropdownLabelCheck}
                                                    onChange={(evt) => {
                                                        this.forceUpdate();
                                                        m.onCheck!(evt.target.checked);
                                                    }}
                                                    checked={false}
                                                />
                                            )}
                                            {m.subItems && <div className={style.commandDropdownArrow}>{">"}</div>}
                                            {m.subItems && (
                                                <div className={style.subItems}>
                                                    {m.subItems.map((s) => {
                                                        return (
                                                            <div
                                                                key={s}
                                                                className={style.subItem}
                                                                onClick={() => {
                                                                    m.onClick!();
                                                                    this.setState({ isExpanded: false });
                                                                }}
                                                            >
                                                                <div>{s}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    // eslint-disable-next-line no-console
                                    return <FileButtonLineComponent key={m.label} label="Load" onClick={(file) => console.log("file btn clicked")} accept=".json" />;
                                }
                            })}
                        </div>
                    )}
                </div>
            </>
        );
    }
}

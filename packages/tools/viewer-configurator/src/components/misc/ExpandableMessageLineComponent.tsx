import type { FunctionComponent } from "react";
import { useCallback, useMemo, useState } from "react";
import { FontAwesomeIconButton } from "./FontAwesomeIconButton";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

const TextStyle: React.CSSProperties = {
    alignSelf: "flex-start",
    marginTop: "2px",
    textAlign: "left",
    fontSize: "12px",
    fontStyle: "italic",
    opacity: 0.6,
};

const TruncatedTextStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
};

const IconStyle: React.CSSProperties = {
    alignSelf: "flex-start",
};

export const ExpandableMessageLineComponent: FunctionComponent<{ text: string }> = (props) => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
    const textStyle = useMemo(() => {
        return expanded ? TextStyle : { ...TruncatedTextStyle, ...TextStyle };
    }, [expanded]);
    const icon = useMemo(() => (expanded ? faMinus : faPlus), [expanded]);

    return (
        <>
            <div style={textStyle}>{props.text}</div>
            <FontAwesomeIconButton style={IconStyle} icon={icon} onClick={toggleExpanded} />
        </>
    );
};

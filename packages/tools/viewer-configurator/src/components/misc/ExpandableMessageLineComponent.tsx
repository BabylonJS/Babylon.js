import type { FunctionComponent } from "react";
import { useCallback, useMemo, useState } from "react";
import { FontAwesomeIconButton } from "./FontAwesomeIconButton";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

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
    opacity: 0.6,
    transform: "scale(0.8)",
};

export const ExpandableMessageLineComponent: FunctionComponent<{ text: string }> = (props) => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
    const textStyle = useMemo(() => {
        return expanded ? TextStyle : { ...TruncatedTextStyle, ...TextStyle };
    }, [expanded]);
    const icon = useMemo(() => (expanded ? faChevronUp : faChevronDown), [expanded]);

    return (
        <>
            <div style={textStyle}>{props.text}</div>
            <FontAwesomeIconButton style={IconStyle} icon={icon} onClick={toggleExpanded} />
        </>
    );
};

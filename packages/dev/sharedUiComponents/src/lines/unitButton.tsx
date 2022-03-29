interface IUnitButtonProps {
    unit: string;
    locked?: boolean;
    onClick?: (unit: string) => void;
}

export function UnitButton(props: IUnitButtonProps) {
    return (
        <button
            className={"unit"}
            onClick={() => {
                if (props.onClick && !props.locked) props.onClick(props.unit || "");
            }}
            disabled={props.locked}
        >
            {props.unit}
        </button>
    );
}

import { useRef } from "react";
import type { FunctionComponent } from "react";
import { ButtonLine } from "./buttonLine";
import type { ButtonProps } from "../primitives/button";
import { ArrowUploadRegular } from "@fluentui/react-icons";

type FileUploadLineProps = Omit<ButtonProps, "onClick" | "label"> & {
    onClick: (files: FileList) => void;
    label: string; // Require a label when button is the entire line (by default, label is optional on a button)
    accept: string;
};

export const FileUploadLine: FunctionComponent<FileUploadLineProps> = (props) => {
    FileUploadLine.displayName = "FileUploadLine";
    const inputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const files = evt.target.files;
        if (files && files.length) {
            props.onClick(files);
        }
        evt.target.value = "";
    };

    return (
        <>
            <ButtonLine onClick={handleButtonClick} icon={ArrowUploadRegular} label={props.label}></ButtonLine>
            <input ref={inputRef} type="file" accept={props.accept} style={{ display: "none" }} onChange={handleChange} />
        </>
    );
};

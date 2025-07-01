import { useRef } from "react";
import type { FunctionComponent } from "react";
import { ButtonLine } from "./buttonLine";
import type { ButtonLineProps } from "./buttonLine";

type FileUploadLineProps = Omit<ButtonLineProps, "onClick"> & {
    onClick: (file: File) => void;
    accept: string;
};

export const FileUploadLine: FunctionComponent<FileUploadLineProps> = (props) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const files = evt.target.files;
        if (files && files.length) {
            props.onClick(files[0]);
        }
        evt.target.value = "";
    };

    return (
        <>
            <ButtonLine onClick={handleButtonClick} label={props.label}></ButtonLine>
            <input ref={inputRef} type="file" accept={props.accept} style={{ display: "none" }} onChange={handleChange} />
        </>
    );
};

import type { FunctionComponent } from "react";
import { LineContainer } from "./propertyLines/propertyLine";
import { UploadButton } from "../primitives/uploadButton";
import type { ButtonProps } from "../primitives/button";

type FileUploadLineProps = Omit<ButtonProps, "onClick" | "label"> & {
    onClick: (files: FileList) => void;
    label: string; // Require a label when button is the entire line (by default, label is optional on an UploadButton
    accept: string;
};

/**
 * A full-width line with an upload button.
 * For just the button without the line wrapper, use UploadButton directly.
 * @returns An UploadButton wrapped in a LineContainer
 */
export const FileUploadLine: FunctionComponent<FileUploadLineProps> = ({ onClick, label, accept, ...buttonProps }) => {
    FileUploadLine.displayName = "FileUploadLine";

    return (
        <LineContainer uniqueId={`${label}_upload`} label={label}>
            <UploadButton onUpload={onClick} accept={accept} label={label} {...buttonProps} />
        </LineContainer>
    );
};

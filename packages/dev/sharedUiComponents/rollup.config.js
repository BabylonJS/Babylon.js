import scss from "rollup-plugin-scss";
import typescript from "@rollup/plugin-typescript";
import multi from "@rollup/plugin-multi-entry";
import image from "@rollup/plugin-image";

export default {
    input: {
        include: ["./src/**/*.*"],
        exclude: ["./src/**/*.d.ts"],
    },
    output: {
        file: "./dist/index.js",
        // format: "esm",
        sourcemap: true,
    },
    external: [/^core\//, /^gui\//, /^react\//, "react", "react-dom", "@fortawesome/react-fontawesome", "@fortawesome/free-solid-svg-icons"],
    plugins: [
        multi(),
        image(),
        typescript({ tsconfig: "./tsconfig.build.json", outputToFilesystem: true, declarationDir: "." }),
        scss(), // will output compiled styles to output.css
    ],
};

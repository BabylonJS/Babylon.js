import { dirname, join } from "path";
const path = require("path");

module.exports = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: [
        getAbsolutePath("@storybook/addon-links"),
        getAbsolutePath("@storybook/addon-essentials"),
        getAbsolutePath("@storybook/addon-interactions"),
        "@storybook/addon-webpack5-compiler-swc",
    ],
    framework: getAbsolutePath("@storybook/react-webpack5"),

    webpackFinal: async (config, { configType }) => {
        // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
        // You can change the configuration based on that.
        // 'PRODUCTION' is used when building the static version of storybook.

        // Make whatever fine-grained changes you need

        config.resolve.alias = {
            ...config.resolve.alias,
            core: path.resolve("../core/dist"),
        };

        config.module.rules.push({
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
            sideEffects: true,
            options: {
                configFile: __dirname + "/../tsconfig.build.json",
            },
        });

        config.module.rules.push({
            test: /\.scss$/,
            use: [
                "style-loader",
                {
                    loader: "css-loader",
                    options: {
                        modules: true,
                    },
                },
                "sass-loader",
            ],
            include: path.resolve(__dirname, "../"),
        });

        // Return the altered config
        return config;
    },

    docs: {
        autodocs: true,
    },
};

function getAbsolutePath(value) {
    return dirname(require.resolve(join(value, "package.json")));
}


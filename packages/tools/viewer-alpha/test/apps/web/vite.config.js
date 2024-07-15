import { defineConfig, loadEnv } from "vite";
import { readFileSync } from "fs";
import path from "path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const source = env.source ?? "dev";

    return {
        // plugins: [
        //     {
        //         name: "configure-server",
        //         configureServer(server) {
        //             server.middlewares.use((req, res, next) => {
        //                 if (req.url === "/") {
        //                     const indexPath = path.join(__dirname, "index.html");
        //                     const indexHtml = readFileSync(indexPath, "utf-8");
        //                     res.end(indexHtml);
        //                 } else {
        //                     next();
        //                 }
        //             });
        //         },
        //     },
        // ],
        server: {
            port: env.VIEWER_PORT ?? 1342,
        },
        resolve: {
            alias: {
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
            },
        },
    };
});

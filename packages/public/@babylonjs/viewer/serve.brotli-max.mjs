// Local-testing static server that mirrors `serve .` but forces on-the-fly
// Brotli at maximum quality (11) instead of the default quality (4) used by
// `serve`'s bundled `compression` middleware. This more closely matches the
// output size of a real CDN serving pre-compressed .br assets.
//
// Usage: npm run start:prod:brotli  (serves this folder on port 1343)

import { createServer } from "node:http";
import { constants } from "node:zlib";
import handler from "serve-handler";
import compression from "compression";

const port = Number(process.env.PORT) || 1343;

const compress = compression({
    brotli: {
        params: {
            [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        },
    },
});

const server = createServer((request, response) => {
    compress(request, response, () => {
        void handler(request, response);
    });
});

server.listen(port, () => {
    console.log(`Serving "." with max-quality Brotli at http://localhost:${port}`);
});

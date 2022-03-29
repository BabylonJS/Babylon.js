// Import Dependencies.
var gulp = require("gulp");
var fs = require("fs");

/**
 * Tests the whats new file to ensure changes have been made in the PR.
 */
gulp.task("tests-whatsnew", function(done) {
    // Check status on azure
    if (!process.env["AZURE_PULLREQUESTID"]) {
        // Only checks on Travis
        if (!process.env.TRAVIS) {
            done();
            return;
        }

        // Only checks on Pull Requests
        if (process.env.TRAVIS_PULL_REQUEST == "false") {
            done();
            return;
        }

        // Do not check deploy
        if (process.env.TRAVIS_BRANCH == "preview") {
            done();
            return;
        }
    }

    // Only on PR not once in.
    if (process.env.BROWSER_STACK_USERNAME !== "$(babylon.browserStack.userName)") {
        done();
        return;
    };

    // Compare what's new with the current one in the preview release folder.
    const https = require("https");
    const url = "https://rawgit.com/BabylonJS/Babylon.js/master/dist/preview%20release/what's%20new.md";
    https.get(url, res => {
        res.setEncoding("utf8");
        let oldData = "";
        res.on("data", data => {
            oldData += data;
        });
        res.on("end", () => {
            fs.readFile("../../dist/preview release/what's new.md", "utf-8", function(err, newData) {
                
            console.log(newData)
                if (err || oldData != newData) {
                    done();
                    return;
                }

                console.error("What's new file did not change.");
                process.exit(1);
            });
        });
    });
});
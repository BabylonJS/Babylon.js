var fs = require("fs-extra");

var rmDir = function(dirPath) {
    fs.removeSync(dirPath);
}

module.exports = function(dirPath) {
    // Retry cause sometimes locked on my mac :-)
    try {
        rmDir(dirPath);
    }
    catch (e) {
        try {
            rmDir(dirPath);
        }
        catch (e) {
            try {
                rmDir(dirPath);
            }
            catch (e) {
                // Something is definitely wrong here.
                throw e;
            }
        } 
    }
};
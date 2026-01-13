/*
Executed before prepare stage.
Renames entitlements file if project name changes.
*/

var path = require('path');
var fs = require('fs');
var ConfigXmlHelper = require('./lib/configXmlHelper.js');

module.exports = function(ctx) {
    run(ctx);
};

function run(ctx) {
    var projectRoot = ctx.opts.projectRoot;
    var iosProjectPath = path.join(projectRoot, 'platforms', 'ios');
    var configXmlHelper = new ConfigXmlHelper(ctx);
    var newProjectName = configXmlHelper.getProjectName();
    var oldProjectName = getOldProjectName(iosProjectPath);

    if (!oldProjectName || oldProjectName === newProjectName) return;

    console.log('Project name changed. Renaming entitlements file.');

    var oldEntitlementsPath = path.join(iosProjectPath, oldProjectName, 'Resources', oldProjectName + '.entitlements');
    var newEntitlementsPath = path.join(iosProjectPath, oldProjectName, 'Resources', newProjectName + '.entitlements');

    try {
        if (fs.existsSync(oldEntitlementsPath)) {
            fs.renameSync(oldEntitlementsPath, newEntitlementsPath);
            console.log('Renamed entitlements file to match new project name.');
        }
    } catch (err) {
        console.warn('Failed to rename entitlements file.');
        console.warn(err);
    }
}

function getOldProjectName(projectDir) {
    try {
        var files = fs.readdirSync(projectDir);
        for (var file of files) {
            if (path.extname(file) === '.xcodeproj') {
                return path.basename(file, '.xcodeproj');
            }
        }
    } catch (err) {}
    return '';
}

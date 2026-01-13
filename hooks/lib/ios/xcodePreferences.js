/*
Activates Universal Links support:
- Deployment target set to iOS 9.0
- Single .entitlements file added to project PBXFileReferences
- Code Sign Entitlements preference updated
*/

var path = require('path');
var compare = require('node-version-compare');
var ConfigXmlHelper = require('../configXmlHelper.js');
const xcode = require('xcode');
const fileSystem = require('fs');
const glob = require('glob');
const shelljs = require('shelljs');

var IOS_DEPLOYMENT_TARGET = '8.0';
var COMMENT_KEY = /_comment$/;
var context;

module.exports = {
    enableAssociativeDomainsCapability
};

// ---------------- Public API ----------------

function enableAssociativeDomainsCapability(cordovaContext) {
    context = cordovaContext;

    var projectFile = loadProjectFile();

    activateAssociativeDomains(projectFile.xcode);

    addPbxReference(projectFile.xcode);

    projectFile.write();
}

// ---------------- Xcode modifications ----------------

function activateAssociativeDomains(xcodeProject) {
    var configurations = nonComments(xcodeProject.pbxXCBuildConfigurationSection());
    var entitlementsFilePath = pathToEntitlementsFile();
    var deploymentTargetIsUpdated;

    for (var config in configurations) {
        var buildSettings = configurations[config].buildSettings;

        buildSettings['CODE_SIGN_ENTITLEMENTS'] = '"' + entitlementsFilePath + '"';

        if (buildSettings['IPHONEOS_DEPLOYMENT_TARGET']) {
            if (compare(buildSettings['IPHONEOS_DEPLOYMENT_TARGET'], IOS_DEPLOYMENT_TARGET) === -1) {
                buildSettings['IPHONEOS_DEPLOYMENT_TARGET'] = IOS_DEPLOYMENT_TARGET;
                deploymentTargetIsUpdated = true;
            }
        } else {
            buildSettings['IPHONEOS_DEPLOYMENT_TARGET'] = IOS_DEPLOYMENT_TARGET;
            deploymentTargetIsUpdated = true;
        }
    }

    if (deploymentTargetIsUpdated) {
        console.log('iOS deployment target updated to: ' + IOS_DEPLOYMENT_TARGET);
    }

    console.log('Code Sign Entitlements set to: ' + entitlementsFilePath);
}

function addPbxReference(xcodeProject) {
    var fileReferenceSection = nonComments(xcodeProject.pbxFileReferenceSection());
    var entitlementsFileName = path.basename(pathToEntitlementsFile());

    if (!isPbxReferenceAlreadySet(fileReferenceSection, entitlementsFileName)) {
        console.log('Adding entitlements file to project references');
        xcodeProject.addResourceFile(entitlementsFileName);
    } else {
        console.log('Entitlements file already in references');
    }
}

function isPbxReferenceAlreadySet(fileReferenceSection, fileName) {
    for (var uuid in fileReferenceSection) {
        var fileRefEntry = fileReferenceSection[uuid];
        if (fileRefEntry.path && fileRefEntry.path.includes(fileName)) return true;
    }
    return false;
}

// ---------------- Helpers ----------------

function loadProjectFile() {
    var projectPath = path.join(iosPlatformPath(), '*.xcodeproj', 'project.pbxproj');
    var projectFiles = glob.sync(projectPath);

    if (!projectFiles.length) throw new Error('No Xcode project found');

    const pbxPath = projectFiles[0];
    const xcodeproj = xcode.project(pbxPath);
    xcodeproj.parseSync();

    return {
        xcode: xcodeproj,
        write() {
            fs.writeFileSync(pbxPath, xcodeproj.writeSync());
        }
    };
}

function nonComments(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !COMMENT_KEY.test(k)));
}

function iosPlatformPath() {
    return path.join(projectRoot(), 'platforms', 'ios');
}

function projectRoot() {
    return context.opts.projectRoot;
}

function pathToEntitlementsFile() {
    var configXmlHelper = new ConfigXmlHelper(context);
    var projectName = configXmlHelper.getProjectName();
    return path.join(projectName, 'Resources', projectName + '.entitlements');
}

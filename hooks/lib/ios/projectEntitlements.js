/*
Script creates a single entitlements file with the list of hosts from config.xml.
File name is: ProjectName.entitlements
Location: ProjectName/Resources/
*/

var path = require('path');
var fs = require('fs');
var plist = require('plist');
var mkpath = require('mkpath');
var ConfigXmlHelper = require('../configXmlHelper.js');

var ASSOCIATED_DOMAINS = 'com.apple.developer.associated-domains';
var context;
var projectName;

module.exports = {
    generateAssociatedDomainsEntitlements: generateEntitlements
};

// ---------------- Public API ----------------

function generateEntitlements(cordovaContext, pluginPreferences) {
    context = cordovaContext;

    var currentEntitlements = getEntitlementsFileContent();
    var newEntitlements = injectPreferences(currentEntitlements, pluginPreferences);

    saveContentToEntitlementsFile(newEntitlements);
}

// ---------------- Entitlements logic ----------------

function saveContentToEntitlementsFile(content) {
    var plistContent = plist.build(content);
    var filePath = pathToEntitlementsFile();

    // ensure directory exists
    mkpath.sync(path.dirname(filePath));

    fs.writeFileSync(filePath, plistContent, 'utf8');
}

function getEntitlementsFileContent() {
    var filePath = pathToEntitlementsFile();
    try {
        var content = fs.readFileSync(filePath, 'utf8');
        return plist.parse(content);
    } catch (err) {
        return {};
    }
}

function injectPreferences(currentEntitlements, pluginPreferences) {
    currentEntitlements[ASSOCIATED_DOMAINS] = generateAssociatedDomainsContent(pluginPreferences);
    return currentEntitlements;
}

function generateAssociatedDomainsContent(pluginPreferences) {
    var domainsList = [];
    pluginPreferences.hosts.forEach(function(host) {
        var link = 'applinks:' + host.name;
        if (!domainsList.includes(link)) {
            domainsList.push(link);
        }
    });
    return domainsList;
}

// ---------------- Path helpers ----------------

function pathToEntitlementsFile() {
    return path.join(getProjectRoot(), 'platforms', 'ios', getProjectName(), 'Resources', getProjectName() + '.entitlements');
}

function getProjectRoot() {
    return context.opts.projectRoot;
}

function getProjectName() {
    if (!projectName) {
        var configXmlHelper = new ConfigXmlHelper(context);
        projectName = configXmlHelper.getProjectName();
    }
    return projectName;
}

'use strict';

const jsforce = require('jsforce');
const fs = require('fs');

const DEFAULT_USER_CONFIG_PATH = './user_config.yaml';
const DEFAULT_APP_CONFIG_PATH = './app_config.yaml';
const COMMAND_OPTION_HELP = '-h';
const COMMAND_OPTION_CONFIG = '-c';
const PACKAGE_XML_FILE_NAME = 'Package.xml';

let userConfigPath = DEFAULT_USER_CONFIG_PATH;
let excludeFlag = false;
let paramList = [];
let paramCnt = 0;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === COMMAND_OPTION_CONFIG) {
    if (i + 1 >= process.argv.length) {
      usage();
    }
    userConfigPath = process.argv[i + 1];
  } else if (process.argv[i] === COMMAND_OPTION_HELP) {
    usage();
  } else {
    paramList.push(process.argv[i]);
  }
}

loadUserConfig(userConfigPath);
loadAppConfig();

let userConfig = global.userConfig;
let appConfig = global.appConfig;

let outputPath = '';
if (userConfig.outputPath) {
  outputPath = userConfig.outputPath;
} else {
  outputPath = PACKAGE_XML_FILE_NAME;
}

let conn = new jsforce.Connection({loginUrl: userConfig.loginUrl, version: userConfig.apiVersion});
(async () => {
  await conn.login(userConfig.userName, userConfig.password, function (err, userInfo) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });

  let xmlNameList = [];
  await conn.metadata.describe(userConfig.apiVersion, function (err, metadata) {
    if (err) {
      return console.error('err', err);
    }
    for (let i = 0; i < metadata.metadataObjects.length; i++) {
      let meta = metadata.metadataObjects[i];
      xmlNameList.push(meta.xmlName);
    }
  });

  let objectNameList = [];
  let metadataType = [{ type: 'CustomObject', folder: null }];
  await conn.metadata.list(metadataType, userConfig.apiVersion, function (err, metadata) {
    if (err) {
      return console.error('err', err);
    }
    for (const meta of metadata) {
      objectNameList.push(meta.fullName);
    }
  });

  let excludeMetadataTypeSet = new Set();
  if (userConfig.excludeMetadataType) {
    for (let excludeMetadataType of userConfig.excludeMetadataType) {
      excludeMetadataTypeSet.add(excludeMetadataType);
    }
  }
  let includeObjectSet = undefined;
  if (userConfig.includeObject) {
    includeObjectSet = new Set();
    for (let includeObject of userConfig.includeObject) {
      includeObjectSet.add(includeObject);
    }
  }

  let documentFolderNameList = [];
  let documentNameList = [];
  let reportFolderNameList = [];
  let reportNameList = [];
  let dashboardFolderNameList = [];
  let dashboardNameList = [];
  let emailFolderNameList = [];
  let emailNameList = [];

  let paramList = [
    ['DocumentFolder', 'Document', documentFolderNameList, documentNameList],
    ['ReportFolder', 'Report', reportFolderNameList, reportNameList],
    ['DashboardFolder', 'Dashboard', dashboardFolderNameList, dashboardNameList],
    ['EmailFolder', 'EmailTemplate', emailFolderNameList, emailNameList],
  ];

  for (let param of paramList) {
    await conn.metadata.list([{ type: param[0] }], userConfig.apiVersion, function (err, metadataList) {
      if (err) {
        return console.error(err);
      }

      if (!Array.isArray(metadataList)) {
        metadataList = [metadataList];
      }
      for (let metadata of metadataList) {
        if (metadata) {
          param[2].push(metadata.fullName);
        }
      }
    });

    for (let folderName of param[2]) {
      await conn.metadata.list([{ type: param[1], folder: folderName }], userConfig.apiVersion, function (err, metadataList) {
        if (err) {
          return console.error(err);
        }

        if (!Array.isArray(metadataList)) {
          metadataList = [metadataList];
        }
        param[3].push(folderName);
        for (let metadata of metadataList) {
          if (metadata) {
            param[3].push(metadata.fullName);
          }
        }
      });
    }
  }

  let content = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  content += '<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n';
  for (let xmlName of xmlNameList.sort()) {
    if (excludeMetadataTypeSet.has(xmlName)) continue;

    if (xmlName === 'CustomObject') {
      if (objectNameList.length > 0) {
        content += '    <types>\n';
        for (let objectName of objectNameList.sort()) {
          if (!includeObjectSet || includeObjectSet.has(objectName)) {
            content += '        <members>' + objectName + '</members>\n';
          }
        }
        content += '        <name>' + xmlName + '</name>\n';
        content += '    </types>\n';
      }
    } else if (xmlName === 'Document') {
      if (documentNameList.length > 0) {
        content += '    <types>\n';
        for (let documentName of documentNameList.sort()) {
          content += '        <members>' + documentName + '</members>\n';
        }
        content += '        <name>' + xmlName + '</name>\n';
        content += '    </types>\n';
      }
    } else if (xmlName === 'Report') {
      if (reportNameList.length > 0) {
        content += '    <types>\n';
        for (let reportName of reportNameList.sort()) {
          content += '        <members>' + reportName + '</members>\n';
        }
        content += '        <name>' + xmlName + '</name>\n';
        content += '    </types>\n';
      }
    } else if (xmlName === 'Dashboard') {
      if (dashboardNameList.length > 0) {
        content += '    <types>\n';
        for (let dashboardName of dashboardNameList.sort()) {
          content += '        <members>' + dashboardName + '</members>\n';
        }
        content += '        <name>' + xmlName + '</name>\n';
        content += '    </types>\n';
      }
    } else if (xmlName === 'EmailTemplate') {
      if (emailNameList.length > 0) {
        content += '    <types>\n';
        for (let emailName of emailNameList.sort()) {
          content += '        <members>' + emailName + '</members>\n';
        }
        content += '        <name>' + xmlName + '</name>\n';
        content += '    </types>\n';
      }
    } else if (xmlName === 'StandardValueSet') {
      if (appConfig.standardValueSetNames.length > 0) {
        content += '    <types>\n';
        for (let standardValueSetName of appConfig.standardValueSetNames.sort()) {
          content +=
            '        <members>' + standardValueSetName + '</members>\n';
        }
        content += '        <name>' + xmlName + '</name>\n';
        content += '    </types>\n';
      }
    } else {
      content += '    <types>\n';
      content += '        <members>*</members>\n';
      content += '        <name>' + xmlName + '</name>\n';
      content += '    </types>\n';
    }
  }

  content += '    <version>' + userConfig.apiVersion + '</version>\n';
  content += '</Package>\n';

  await fs.writeFile(outputPath, content, (err) => {
    if (err) throw err;
    console.log('Done.');
  });
})();

function loadYamlFile(fileName) {
  let existsFile = fs.existsSync(fileName);
  if (!existsFile) {
    console.error('File not found. filePath: ' + fileName);
    process.exit(1);
  }
  const yaml = require('js-yaml');
  const yamlText = fs.readFileSync(fileName, 'utf8');
  return yaml.load(yamlText);
}

function loadUserConfig(userConfigPath) {
  let userConfigPathWork = userConfigPath;
  if (userConfigPathWork === undefined) {
    userConfigPathWork = path.join(__dirname, DEFAULT_USER_CONFIG_PATH);
  }
  const path = require('path');
  const config = loadYamlFile(userConfigPathWork);
  global.userConfig = config;
}

function loadAppConfig() {
  let appConfigPathWork = global.userConfig.appConfigPath;
  if (appConfigPathWork === undefined) {
    appConfigPathWork = DEFAULT_APP_CONFIG_PATH;
  }

  const path = require('path');
  const config = loadYamlFile(path.join(__dirname, appConfigPathWork));
  global.appConfig = config;
}

function usage() {
  console.log('usage: generate-packagexml.js [-options]');
  console.log('    -h              output usage information');
  console.log('    -c <pathname>   specifies a config file path (default is ./user_config.yaml)');
  process.exit(0);
}

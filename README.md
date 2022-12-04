# generate-packagexml
<p align="center">
  <img src="https://img.shields.io/badge/Salesforce-00a1e0.svg">
  <img src="https://img.shields.io/badge/JavaScript-yellow.svg?logo=JavaScript&logoColor=white">
  <img src="https://img.shields.io/badge/NodeJS-339933.svg?logo=Node.js&logoColor=white">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg">
</p>
Generate package.xml for salesforce with all metadata types.
It also automatically generates members of CustomObject/Document/Report/Dashboard/EmailTemplate metadata types that cannot be specified with an asterisk.

## Installation
Install [Node.js](https://nodejs.org/) and place the following files in any directory.

* generate-packagexml.js
* user_config.yaml
* app_config.yaml
* package.json
* package-lock.json

Install required libraries.
```
$ npm ci
```

## Edit config file
Open user_config.yaml and edit login URL, user name, and password to match your environment.
```
loginUrl: "https://test.salesforce.com"
apiVersion : "56.0"
userName: "(LOGIN USER NAME)"
password: "(LOGIN PASSWORD)"
```
Change package.xml output path as necessary.
```
outputPath: "Package.xml"
```
If the retrieving fails because of unsupported metadata types, please add the corresponding metadata type to 'excludeMetadataType'.
```
excludeMetadataType:  [
  "EventRelayConfig",
  "PortalDelegablePermissionSet",
]
```

## Usage
Execute a generate-packagexml.js with Node.js in a terminal. If there is no option, It uses the default config file. (default is "./user_config.yaml")
```
$ node generate-packagexml.js
```
When 'Done.' appears in the console, Package.xml is created.

If you want to use a non-default configuration file, specify the file with the -c option.
```
$ node generate-packagexml.js -c YourConfigFile.yaml
```

## Note
- StandardValueSet members are specified in app_config.yaml. If additional members are added in future versions, please modify app_config.yaml.

## License
generate-packagexml.js is licensed under the MIT license.


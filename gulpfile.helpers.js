var gutil = require('gulp-util'),
  log = gutil.log,
  colors = gutil.colors,
  path = require('path'),
  join = path.join;

module.exports = {
  renameByFlags: function (flags) {
    return function (path) {
      path.basename += flags.compressing ? '.min' : '';
    };
  },

  /**
   * Returns name and version of bower files
   * @param  {Array} filePaths      file paths of bower files
   * @param  {Array} fileExtensions Multi array file extension to filter for
   * @return {Array}                each entry is a string with file name
   *                                and version
   */
  getNameAndVersionList: function (filePaths, fileExtensions) {
    var fileNameParts = [],
      pkgName = '',
      fileName = '',
      fileNameExt = '',
      pathToBowerJson = '',
      bowerJSON,
      fileExtensionsFlat = [].concat.apply([], fileExtensions),
      dateStamp = new Date().toISOString(),
      i,
      j,
      extensionSet,
      extensionSetKeyEntry,
      filesNameAndVersionList,
      dictionaryExtensionToList = {},
      extensionKey,
      key;

    filesNameAndVersionList = {};

    // Create an object like
    // {'css-less' : [], 'js': []}
    // if fileExtensions was [['css', 'less'], ['js']]
    for (i = 0; i < fileExtensions.length; i++) {
      extensionSet = fileExtensions[i];
      extensionSetKeyEntry = extensionSet.join('-');

      filesNameAndVersionList[extensionSetKeyEntry] = [dateStamp];
      // have each extension point to its entry in the above list, like
      // {'css' : 'css-less', 'less' : 'css-less', 'js' : 'js'}
      // this makes it easier for further processing
      for (j = 0; j < extensionSet.length; j++) {
        dictionaryExtensionToList[extensionSet[j]] = extensionSetKeyEntry;
      }
    }

    for (i = 0; i < filePaths.length; i++) {
      fileNameExt = path.extname(filePaths[i]).substr(1);

      // disregard files with the wrong file extension
      if (fileExtensionsFlat.indexOf(fileNameExt) === -1) {
        continue;
      }
      fileName = path.basename(filePaths[i]);

      fileNameParts = filePaths[i].split(path.sep);
      extensionKey = dictionaryExtensionToList[fileNameExt];

      if (fileNameParts[0] === 'bower_components') {
        pkgName = fileNameParts[1];
        pathToBowerJson = './' + fileNameParts[0] + '/' + fileNameParts[1] +
          '/bower.json';
        bowerJSON = require(pathToBowerJson);

        filesNameAndVersionList[extensionKey].push(
          pkgName + ' ' + fileName + ' v' + bowerJSON.version
        );
      }
      // in this case we should have normally a file pattern
      else {
        filesNameAndVersionList[extensionKey].push(filePaths[i]);
      }
    }

    for (key in filesNameAndVersionList) {
      if (filesNameAndVersionList.hasOwnProperty(key)) {
        filesNameAndVersionList[key] =
          '/*\n * ' +
          filesNameAndVersionList[key].join('\n * - ') +
          '\n */\n\n';
      }
    }
    return filesNameAndVersionList;
  },

  /**
   * Error handler for gulp pipes
   * @param  {Object} err gulp error object
   */
  onError: function (err) {
    gutil.beep();
    log(colors.red(err.name + ' in Plugin ' + colors.underline(err.plugin)));
    log(err.message);
  },

  /**
   * Used to prefix the paths stored in the objects 'src' and 'build'
   * with their appropiate base path's ('./src' or './build')
   * @param {String} prefix
   * @param {Object} object
   * @param {Array} keys
   */
  addPrefixToObjectsKeyEntries: function (prefix, object, keys) {
    var i = 0,
      j,
      len = keys.length,
      firstLvlKey,
      secondLvlKey,
      keyValue,
      pathPrefix,
      newArrayKeyValue;

    for (; i < len; i++) {
      firstLvlKey = keys[i];

      for (secondLvlKey in object[firstLvlKey]) {

        if (object[firstLvlKey].hasOwnProperty(secondLvlKey)) {
          keyValue = object[firstLvlKey][secondLvlKey];

          if (keyValue instanceof Array) {
            newArrayKeyValue = [];

            for (j = 0; j < keyValue.length; j++) {
              pathPrefix = '';

              // in case the path starts with an '!' for negation
              if (keyValue[j].indexOf('!') === 0) {
                keyValue[j] = keyValue[j].substr(1);
                pathPrefix = '!';
              }
              newArrayKeyValue.push(pathPrefix + join(prefix, keyValue[j]));
            }
            object[firstLvlKey][secondLvlKey] = newArrayKeyValue;
          } else {
            object[firstLvlKey][secondLvlKey] = join(prefix, keyValue);
          }
        }
      }
    }
  }
};

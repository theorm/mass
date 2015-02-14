var join = require('path').join,
  assetsDir = 'assets',
  buildDir = './build',
  appDir = './',
  fontsDir = 'fonts',
  imagesDir = 'images',
  srcDir = './src',
  scriptsDir = 'scripts',
  specsDir = 'specs',
  stylesheetsDir = 'stylesheets',
  vendorDir = 'vendor',
  templatesDir = 'views',
  helpers = require('./gulpfile.helpers.js'),
  isDebug = process.env.NODE_ENV === 'debug',
  isProduction = process.env.NODE_ENV === 'production',
  fileNames = {
    vendorCSS: 'vendor.css',
    vendorJS: 'vendor.js',
    appJS: 'app.js'
  },

  // application directories which get merged into
  // the 'src' and 'build' objects below
  dirs = {
    app: appDir,
    assets: join(appDir, assetsDir),
    fonts: join(appDir, assetsDir, fontsDir),
    assetsImages: join(appDir, assetsDir, imagesDir),
    pages: appDir,
    scripts: join(appDir, scriptsDir),
    specs: join(appDir, specsDir),
    stylesheets: join(appDir, stylesheetsDir),
    templates: join(appDir, templatesDir),
    vendorStylesheets: join(appDir, vendorDir, stylesheetsDir),
    vendorScripts: join(appDir, vendorDir, scriptsDir),
    vendorAssetsFonts: join(appDir, assetsDir, fontsDir),
    vendorAssetsImages: join(appDir, assetsDir, imagesDir, vendorDir),
  },
  // application file patterns which get merged into
  // the 'src' and 'build' objects below
  files = {
    assetsImages: join(dirs.assets, imagesDir, '**'),
    // only the index pages as they are considered as the
    // ng-app starting points
    appPage: join(dirs.app, '**/index.+(jade|html)'),
    scripts: [
      // first load modules to avoid namespace conflicts
      join(dirs.scripts, '**/*.module.js'),
      join(dirs.scripts, '**/*.js')
    ],
    specs: join(appDir, specsDir, '**/*.spec.js'),
    stylesheets: join(dirs.stylesheets, '**/*.+(less|css)'),
    templates: join(dirs.templates, '**/*.+(jade|html)'),
    vendorAssetsFonts: join(dirs.vendorAssetsFonts, '*.+(eot|svg|ttf|woff)'),
    vendorStylesheets: join(dirs.vendorStylesheets, '*.css'),
    vendorScripts: join(dirs.vendorScripts, '*.js'),
    serverScripts: [
      '**/*.js',
      '!' + join(dirs.app, '**')
    ],
    fonts: join(dirs.fonts, '*.+(eot|svg|ttf|woff)'),
  },
  // files in the src folder
  src = {},
  // files in the build folder
  build = {};

// add common directories and files to src and build
// the JSON stuff around it is necessary to avoid treating
// the new properties as shallow copies
src.dirs = JSON.parse(JSON.stringify(dirs));
build.dirs = JSON.parse(JSON.stringify(dirs));

src.files = JSON.parse(JSON.stringify(files));
build.files = JSON.parse(JSON.stringify(files));

// Prefix each entry the 'src' and 'build' objects with their respective paths
// This way it does not have to be added to every single entry when
// it is defined
//
// E.g. src.files.scripts
// Before: '/**/*.js'
// After: './build/**/*.js'
helpers.addPrefixToObjectsKeyEntries(buildDir, build, ['files', 'dirs']);
helpers.addPrefixToObjectsKeyEntries(srcDir, src, ['files', 'dirs']);

// add some specific entries for src
src.files.stylesheetsLess =
  join(srcDir, dirs.stylesheets, 'app.less');

var packageJson = require('./package.json');
var bowerJson = require('./bower.json');

module.exports = {

  // PATHS TO FILES AND DIRECTORIES
  buildDir: buildDir,
  build: build,
  buildFiles: join(buildDir, '**'),
  srcDir: srcDir,
  src: src,
  fileNames: fileNames,
  mainBowerFiles: require('main-bower-files')(),
  packageJSON: packageJson,
  bowerJSON: bowerJson,

  // GULP PLUGIN CONFIGS
  useJade: false, // set to true if you write in Jade instead of HTML
  browserify: {
    // enables source maps if not in production
    debug: !isProduction
  },
  browserSync: {
    proxy: 'localhost:' + packageJson.settings.port,
    logLevel: isDebug ? 'debug' : 'info',
    open: false,
    ghostMode: {
      clicks: true,
      location: true,
      forms: true,
      scroll: true
    }
  },
  concatjs: {
    newLine: '\r\n'
  },
  imagemin: {
    'progressive': true,
    'optimizationLevel': 2
  },
  less: {
    paths: [join(srcDir, appDir)]
  },
  mocha: {
    reporter: 'dot'
  },
  ngAnnotate: {
    'single_quotes': true,
    'add': true
  },
  nodemon: {
    script: 'server.js',
    watch: [
      'server.js'
    ],
    ext: 'js',
    verbose: isDebug
  },
  templateCache: {
    module: bowerJson.name,
    filename: 'ng-templates.js'
  },
  uglifyVendor: {
    preserveComments: 'some',
    mangle : false, //true
    compress: {
      // XXX keep this off. It is a memroy and processor heavy operation
      // on Macbook 15'' it takes 2.5 minutes longer
      // on AWS micro instance it runs out of memory
      unused: false,
    }
  },
  uglify: {
    mangle : false
  },
};

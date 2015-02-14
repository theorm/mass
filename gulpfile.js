var join = require('path').join,
  gulp = require('gulp'),
  // bind all gulp plugins to p and make them easily accessible
  p = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
  }),
  h = require('./gulpfile.helpers.js'),
  cfg = require('./gulpfile.config.js'),
  runSequence = require('run-sequence'),
  lazypipe = require('lazypipe'),
  browserSync = require('browser-sync'),
  del = require('del'),
  reload = browserSync.reload,
  isProduction = process.env.NODE_ENV === 'production',
  flags = {
    compressing: isProduction,
    revisioning: isProduction
  },
  ngAnnotate = require('gulp-ng-annotate'),
  templateCache = require('gulp-angular-templatecache'),
  htmlify = require('gulp-angular-htmlify');

// ----------------
// # TASKS
//

// LINTING AND CODE STYLE

function commonLintTasks(lintType) {
  return lazypipe()
    .pipe(p.cached, 'lint-' + lintType)
    .pipe(p.plumber, h.onError)
    // .pipe(p.jscs)
    .pipe(p.jshint)
    .pipe(p.jshint.reporter, 'jshint-stylish');
}

gulp.task('lint-jscs-config', function () {
  return gulp.src('gulpfile.*')
    .pipe(commonLintTasks('config')());
});

gulp.task('lint-jscs-scripts', function () {
  return gulp.src(cfg.src.files.scripts)
    .pipe(commonLintTasks('scripts')());
});

gulp.task('lint-jscs-specs', function () {
  return gulp.src(cfg.src.files.specs)
    .pipe(commonLintTasks('specs')());
});

// STYLES

gulp.task('stylesheets', function () {
  return gulp.src(cfg.src.files.stylesheetsLess)
    .pipe(p.changed(cfg.build.dirs.stylesheets))
    .pipe(p.plumber(h.onError))
    .pipe(p.if(!flags.compressing, p.sourcemaps.init()))
    .pipe(p.less(cfg.less))
    .pipe(p.rename(h.renameByFlags(flags)))
    .pipe(
      p.autoprefixer(
        'last 2 version', 'ie 8', 'ie 9',
        'Firefox > 20', 'Opera 12.1', 'iOS 6', 'Android 3'))
    .pipe(p.if(flags.revisioning, p.rev()))
    .pipe(p.if(!flags.compressing, p.sourcemaps.write()))
    .pipe(p.if(flags.compressing, p.csso()))
    .pipe(gulp.dest(cfg.build.dirs.stylesheets))
    .pipe(reload({
      stream: true
    }));
});

// GENERATE TEMPLATE CACHE FILE FOR NG FROM TEMPLATES

gulp.task('ng-templates-cache', function () {
  return gulp.src(cfg.src.files.templates)
    .pipe(p.plumber(h.onError))
    .pipe(p.if(cfg.useJade, p.jade()))
    .pipe(htmlify())
    .pipe(templateCache(cfg.templateCache))
    .pipe(gulp.dest(cfg.build.dirs.scripts));
});

gulp.task('app-page-compile', function () {
  return gulp.src(cfg.src.files.appPage)
    .pipe(p.changed(cfg.build.dirs.app))
    .pipe(p.plumber(h.onError))
    .pipe(p.if(cfg.useJade, p.jade()))
    .pipe(htmlify())
    .pipe(gulp.dest(cfg.build.dirs.app));
});

// INJECT CSS TO LANDING PAGES

gulp.task('app-page-inject-css', function () {
  return gulp.src(cfg.build.files.appPage)
    .pipe(
      p.inject(
        gulp.src(join(cfg.build.dirs.stylesheets, 'vendor.*'), {
          read: false
        }), {
          starttag: '<!-- inject:vendor:css -->',
          ignorePath: cfg.build.dirs.app
        }
      )
    )
    .pipe(
      p.inject(
        gulp.src(join(cfg.build.dirs.stylesheets, 'app.*'), {
          read: false
        }), {
          starttag: '<!-- inject:app:css -->',
          ignorePath: cfg.build.dirs.app
        }
      )
    )
    .pipe(gulp.dest(cfg.build.dirs.app));
});

// INJECT JS TO LANDING PAGES

gulp.task('app-page-inject-js', function () {
  return gulp.src(cfg.build.files.appPage)
    .pipe(
      p.inject(
        gulp.src(join(cfg.build.dirs.scripts, 'vendor.*'), {
          read: false
        }), {
          starttag: '<!-- inject:vendor:js -->',
          ignorePath: cfg.build.dirs.app
        }
      )
    )
    .pipe(
      p.inject(
        gulp.src(join(cfg.build.dirs.scripts, 'app.*'), {
          read: false
        }), {
          starttag: '<!-- inject:app:js -->',
          ignorePath: cfg.build.dirs.app
        }
      )
    )
    .pipe(gulp.dest(cfg.build.dirs.app));
});

// INJECT TEMPLATE CACHE FILES TO LANDING PAGES

gulp.task('app-page-inject-ng-templates', function () {
  return gulp.src(cfg.build.files.appPage)
    .pipe(
      p.inject(
        gulp.src(join(cfg.build.dirs.scripts, 'ng-templates.js'), {
          read: false
        }), {
          starttag: '<!-- inject:ng-templates:js -->',
          ignorePath: cfg.build.dirs.app
        }
      )
    )
    .pipe(gulp.dest(join(cfg.build.dirs.app)));
});

// VENDOR

gulp.task('vendor-files', function () {
  var vendorFiles = cfg.mainBowerFiles,
    dateStampComment = '/*! ' + new Date().toISOString() + ' */\n',
    fileListHeaders = {
      'js': dateStampComment,
      'css-less': dateStampComment
    },
    assetsImagesChannel,
    assetsFontsChannel,
    stylesheetChannel,
    scriptChannel;

  vendorFiles.push(cfg.src.files.vendorStylesheets);
  vendorFiles.push(cfg.src.files.vendorScripts);

  if (!flags.compressing) {
    fileListHeaders =
      h.getNameAndVersionList(vendorFiles, [['js'], ['css', 'less']]);
  }

  assetsFontsChannel = lazypipe()
    .pipe(p.changed, cfg.build.dirs.vendorAssetsFonts)
    .pipe(gulp.dest, cfg.build.dirs.vendorAssetsFonts);

  assetsImagesChannel = lazypipe()
    .pipe(p.changed, cfg.build.dirs.vendorAssetsImages)
    .pipe(gulp.dest, cfg.build.dirs.vendorAssetsImages);

  scriptChannel = lazypipe()
    .pipe(p.concat, cfg.fileNames.vendorJS, cfg.concatjs)
    .pipe(function () {
      return p.rename(h.renameByFlags(flags));
    })
    .pipe(p.header, fileListHeaders['js'])
    .pipe(function () {
      return p.if(flags.compressing, p.uglify(cfg.uglifyVendor));
    })
    .pipe(function () {
      return p.if(flags.revisioning, p.rev());
    })
    .pipe(gulp.dest, cfg.build.dirs.scripts);

  stylesheetChannel = lazypipe()
    .pipe(function () {
      return p.if(/[.]less$/, p.less(cfg.less));
    })
    .pipe(p.concat, cfg.fileNames.vendorCSS)
    .pipe(function () {
      return p.rename(h.renameByFlags(flags));
    })
    .pipe(p.header, fileListHeaders['css-less'])
    .pipe(function () {
      return p.autoprefixer(
        'last 2 version', 'ie 8', 'ie 9',
        'Firefox > 20', 'Opera 12.1', 'iOS 6', 'Android 3');
    })
    .pipe(function () {
      return p.if(flags.revisioning, p.rev());
    })
    .pipe(gulp.dest, cfg.build.dirs.stylesheets);

  return gulp.src(vendorFiles)
    .pipe(p.plumber(h.onError))
    .pipe(p.if(/[.]js$/, scriptChannel()))
    .pipe(p.if(/[.]less|css$/, stylesheetChannel()))
    .pipe(p.if(/[.]png|jpg|jpeg|gif$/, assetsImagesChannel()))
    .pipe(p.if(/[.]eot|svg|ttf|woff$/, assetsFontsChannel()));
});

// SCRIPTS
gulp.task('scripts', [], function () {
  return gulp.src(cfg.src.files.scripts)
    .pipe(p.if(!flags.compressing, p.sourcemaps.init()))
    .pipe(p.plumber(h.onError))
    .pipe(p.concat(cfg.fileNames.appJS))
    .pipe(ngAnnotate(cfg.ngAnnotate))
    .pipe(p.rename(h.renameByFlags(flags)))
    .pipe(p.header('(function(){\n\'use strict\';\n'))
    .pipe(p.footer('}());'))
    .pipe(p.if(flags.compressing, p.uglify(cfg.uglify)))
    .pipe(p.if(flags.revisioning, p.rev()))
    .pipe(p.if(!flags.compressing, p.sourcemaps.write()))
    .pipe(gulp.dest(cfg.build.dirs.scripts));
});

// SPECS

gulp.task('specs', ['lint-jscs-specs'], function () {
  return gulp.src(
      cfg.src.files.specs, {
        read: false
      })
    .pipe(p.plumber(h.onError))
    .pipe(p.mocha(cfg.mocha));
});

gulp.task('assets', function () {
  gulp.src(cfg.src.files.assetsImages)
    .pipe(p.changed(cfg.build.dirs.assetsImages))
    .pipe(gulp.dest(cfg.build.dirs.assetsImages));

  gulp.src(cfg.src.files.fonts)
    .pipe(gulp.dest(cfg.build.dirs.fonts));
});

//
// # BUILD TOOL TASKS
//

// IMAGEMIN

gulp.task('imagemin', function () {
  gulp.src(cfg.build.files.assetsImages)
    .pipe(p.imagemin(cfg.imagemin))
    .pipe(gulp.dest(cfg.build.dirs.assetsImages));
});

gulp.task('totalSize', function () {
  return gulp.src(cfg.buildFiles)
    .pipe(p.size({
      'title': 'Total project size'
    }));
});

gulp.task('clean', function (cb) {
  return del([cfg.buildDir], cb);
});

// Nodemon - monitor changes of server files and reload watching browsers

gulp.task('nodemon', function (cb) {
  var called = false;
  return p.nodemon(cfg.nodemon).on('start', function () {
    if (!called) {
      called = true;
      cb();
    }
  }).on('restart', function () {
    // timeout has to be set, to be able to refresh
    // see https://github.com/vohof/gulp-livereload/issues/28
    setTimeout(function () {
      reload();
    }, 1000);
  });
});

// browser-sync injects changed JS and CSS files without having to reload the
// complete page as opposed to Nodemon
gulp.task('browser-sync', ['nodemon'], function () {
  browserSync.init(null, cfg.browserSync);
});

//
// # COMPOUND TASKS
//

gulp.task('app-page', function () {
  runSequence(
    'app-page-compile',
    'app-page-inject');
});

gulp.task('app-page-inject', function () {
  runSequence(
    'app-page-inject-css',
    'app-page-inject-js',
    'app-page-inject-ng-templates');
});

gulp.task('build', function (callback) {
  runSequence(
    ['clean', 'lint-jscs-config', 'specs'], [
      'stylesheets', 'assets', 'vendor-files', 'scripts',
      'ng-templates-cache'
    ],
    // imagemin waits for images served from
    // bower components (done in vendor-files)
    // pages waits for css and js files to include
    ['app-page', 'imagemin'],
    'totalSize',
    callback);
});

gulp.task('skinny-build', function (callback) {
  runSequence(['clean'],
    ['clean', 'nginx', 'stylesheets', 'assets'],
    ['vendor-files', 'scripts', 'ng-templates-cache'],
    // imagemin waits for images served from
    // bower components (done in vendor-files)
    // pages waits for css and js files to include
    ['app-page', 'imagemin'],
    ['totalSize'],
    callback);
});

gulp.task('dev', function () {
  runSequence('build', 'browser-sync', 'watchAll');
});

gulp.task('watch', function () {
  runSequence('browser-sync', 'watchAll');
});

gulp.task('watchAll', function () {
  gulp.watch(cfg.src.files.appPage, ['app-page', reload]);
  gulp.watch(cfg.src.files.templates, ['ng-templates-cache', reload]);
  gulp.watch(cfg.src.files.specs, ['specs']);
  gulp.watch(cfg.src.files.scripts, ['scripts', reload]);
  gulp.watch(cfg.src.files.stylesheets, ['stylesheets']);
  gulp.watch(cfg.src.files.assetsImages, ['assets', 'imagemin', reload]);
});

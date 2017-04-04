var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
//var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var jasmine = require('gulp-jasmine');
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var PATH = require('path');

/*
gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("dist"));
});
*/

gulp.task("default", function () {
 return tsProject.src()
  .pipe(sourcemaps.init())
  .pipe(tsProject())
  .js
  .pipe(sourcemaps.write({
      // Return relative source map root directories per file.
      sourceRoot: function (file) {
        var sourceFile = PATH.join(file.cwd, file.sourceMap.file);
        console.log(file.cwd, file.sourceMap.file, PATH.dirname(sourceFile));
        console.log(PATH.relative(PATH.dirname(sourceFile), file.cwd));
        return PATH.relative(PATH.dirname(sourceFile), file.cwd);
      }
    }))
  .pipe(gulp.dest("dist"));
});


gulp.task('test', ["default"], function () {
 return gulp.src('dist/tests/**/*.js').pipe(jasmine());
});

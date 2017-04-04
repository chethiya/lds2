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

/*
gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("dist"));
});
*/

gulp.task("default", function () {
 return browserify({
  basedir: '.',
  debug: true,
  entries: ['src/main.ts'],
  cache: {},
  packageCache: {}
 })
  .plugin(tsify)
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(sourcemaps.init({ loadMaps: true }))
  .pipe(uglify())
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest("dist/js"));
});

gulp.task('test', function () {
 tsProject.src()
  .pipe(sourcemaps.init())
  .pipe(tsProject())
  .js
  //.pipe(sourcemaps.init())
  .pipe(sourcemaps.write("."))
  .pipe(gulp.dest("dist/src"));

 gulp.src('tests/**/*.ts')
  .pipe(sourcemaps.init())
  .pipe(ts({
   "module": "commonjs",
   "target": "es5",
   "noImplicitAny": true,
   "noImplicitReturns": true,
   "noImplicitThis": true,
   "strictNullChecks": true,
   "inlineSourceMap": true,
  }))
  .pipe(sourcemaps.write("."))
  .pipe(gulp.dest('dist/tests'));


 return gulp.src('dist/tests/**/*.js').pipe(jasmine());
});

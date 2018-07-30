const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('scripts', () => {
  gulp.src('./src/lib/atomic/*.js')
      .pipe(concat('atomic.build.js'))
      .pipe(gulp.dest('dist'))
});

gulp.task('watch', () => {
  gulp.watch('./src/lib/atomic/*.js', ['scripts'])
});


gulp.task('default', ['scripts']);
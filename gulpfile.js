var gulp = require('gulp'),
	csso = require('gulp-csso'),
	imagemin = require('gulp-imagemin'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename');

gulp.task('default', function() {
	gulp.src('./kladr/css/style.css')
		.pipe(csso())
		.pipe(rename('jquery.kladr.min.css'))
		.pipe(gulp.dest('./'));

	gulp.src(['./kladr/js/core.js', './kladr/js/plugin.js'])
		.pipe(concat('jquery.kladr.js'))
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('./'));
});
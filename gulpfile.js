var gulp = require('gulp'),
	csso = require('gulp-csso'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	wrap = require('gulp-wrap-umd');

gulp.task('default', function () {

	// Javascript
	gulp.src([
			'./kladr/js/core.js',
			'./kladr/js/kladr.js',
			'./kladr/js/kladr_zip.js'
		])
		.pipe(concat('jquery.kladr.js'))
		.pipe(wrap({
			exports: 'jQuery',
			namespace: 'jQuery',
			deps: [
				{
					name: 'jquery',
					globalName: 'jQuery',
					paramName: 'jQuery'
				}
			]
		}))
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('./'));

	// CSS
	gulp.src('./kladr/css/style.css')
		.pipe(csso())
		.pipe(rename('jquery.kladr.min.css'))
		.pipe(gulp.dest('./'));
});

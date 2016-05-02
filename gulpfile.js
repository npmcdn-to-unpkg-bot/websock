'use strict';

// const mocha = require('mocha');
const mocha = require('gulp-mocha');
const gulp = require('gulp');
const nodemon = require('gulp-nodemon')
const istanbul = require('gulp-istanbul');
const browserSync = require('browser-sync').create();

gulp.task('serve', function () {
  nodemon({
    script: 'example/server.js',
    ext: 'js',
    env: { 'NODE_ENV': 'dev' }
  }).on('change', function (argument) {
    console.log('changed');
  })
})

gulp.task('pre-test', function () {
  return gulp.src(['lib/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function cb () {
  return gulp.src('test/*.js', {read: false})
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: ['html', 'text', 'text-summary', 'lcov'],
      reportOpts: {
        lcov: {dir: 'lcovonly', file: 'lcov.info'}
      },
      reportOpts: { dir: './coverage' },
    }))
    .on('error', (err) => {
      console.log(err)
      process.exit();
    })
    .on('end', () => {
      process.exit();
    });
});

gulp.task('web', function() {
  browserSync.init({
    server: {
      baseDir: "./example"
    }
  });

  gulp.watch([
    "example/*.js", 
    "example/*.html"
    ]) 
    .on('change', function (argument) {
      browserSync.reload({ stream: true })
    });
});
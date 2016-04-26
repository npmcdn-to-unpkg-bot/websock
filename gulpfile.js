'use strict';

const gulp = require('gulp');
const nodemon = require('gulp-nodemon')

gulp.task('serve', function () {
  nodemon({
    script: 'lib/server.js',
    ext: 'js',
    env: { 'NODE_ENV': 'dev' }
  }).on('change', function (argument) {
    console.log('changed');
  })
})
//引入插件
var gulp = require('gulp'),
    minifyCss = require('gulp-minify-css'),
    stripDebug = require('gulp-strip-debug'),// 该插件用来去掉console和debugger语句
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    less = require('gulp-less'),
    plumber = require('gulp-plumber'), // less报错时不退出watch
    cache = require('gulp-cached'); // 只生成有改动的文件

// 任务处理的文件路径配置
var paths = {
    js: [
        'mobile/js/**'
    ],
    css: [
        'mobile/css/**'
    ],
    img: [
        'mobile/img/**'
    ]
};

var output = "../mobile" ;//output

/* 开发环境 */

gulp.task('scripts', function(){
     gulp.src(paths.js)
        .pipe(gulp.dest(output + '/js'));
});

gulp.task('less', function(){
    gulp.src(paths.css)
        .pipe(cache('lessing'))
        .pipe(plumber())
        .pipe(less()).on('error', errorHandler)
        .pipe(gulp.dest(output + '/css'));
});

gulp.task('images', function(){
    gulp.src(paths.img)
        .pipe(cache('imagesing'))
        .pipe(gulp.dest(output + '/img')); 

})
/* 部署环境 */
gulp.task('release', function() {
    gulp.src(paths.js)
        .pipe(cache('scriptsing'))
        .on('error', errorHandler)
        .pipe(uglify())
        .pipe(gulp.dest(output + '/js'));

    gulp.src(paths.css)
        .pipe(cache('lessing'))
        .pipe(plumber())
        .pipe(less()).on('error', errorHandler)
        .pipe(minifyCss())
        .pipe(gulp.dest(output + '/css'));

    gulp.src(paths.img)
        .pipe(cache('imagesing'))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            optimizationLevel: 2
        }))
        .pipe(gulp.dest(output + '/img')); 

});

/*错误处理*/
function errorHandler (error) {
  console.log(error.toString());
  this.emit('end');
}

/* watch */
gulp.task('watch',function(){
    gulp.watch(paths.css, ['less']);
    gulp.watch(paths.js, ['scripts']);
});


gulp.task('default', ['less','images','scripts','watch']);


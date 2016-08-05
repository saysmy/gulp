//引入插件
var gulp = require('gulp'),
    minifyCss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    less = require('gulp-less'),
    plumber = require('gulp-plumber'), // less报错时不退出watch
    cache = require('gulp-cached'), // 只生成有改动的文件
    connect = require('gulp-connect'),
    clean = require('gulp-clean'),
    fs = require('fs'), //获取真实路径
    runSequence = require('run-sequence'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    gulpif = require('gulp-if');

// 任务处理的文件路径配置
var src = {
        js: [
            fs.realpathSync('mobile/js') + '/**'
        ],
        css: [
            fs.realpathSync('mobile/css') + '/**/*.less'
        ],
        img: [
            'mobile/img/**'
        ]
    },
    dest = {
        jscss: [
            fs.realpathSync('../mobile/js') + '/**/*.js',
            fs.realpathSync('../mobile/css') + '/**/*.css'
        ]
    };

var output = '../mobile',  //output
    isRelease = false ;


/*清除*/
gulp.task('clean', function(){
    return gulp.src(dest.jscss, {read: false})
        .pipe(clean({force: true}));
})

gulp.task('scripts', function(){
    return gulp.src(src.js)
        .pipe(cache('scriptsing'))
        .pipe( gulpif(isRelease, uglify()) )
        .on('error', errorHandler)
        .pipe(rev())
        .pipe(gulp.dest(output + '/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/js/'));
});

gulp.task('less', function(){

    return gulp.src(src.css)
        .pipe(cache('lessing'))
        .pipe(plumber())
        .pipe(less()).on('error', errorHandler)
        .pipe( gulpif(isRelease, minifyCss()) )
        .pipe(rev())
        .pipe(gulp.dest(output + '/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/css/'));
});

gulp.task('images', function(){

    return gulp.src(src.img)
        .pipe(cache('imagesing'))
        .pipe( gulpif(
            isRelease, imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()],
                optimizationLevel: 2
            })
        ))
        .pipe(rev())
        .pipe(gulp.dest(output + '/img'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/img/'));

});
gulp.task('rev', function() {
    gulp.src(['./rev/**/*.json', '../../videochat/web/protected/modules/mobile/views/**' ]) 
        .pipe( revCollector({
            replaceReved: true
        }) )      
        .pipe(gulp.dest( fs.realpathSync('../../videochat/web/protected/modules/mobile/views/') ));

    gulp.src(['./rev/img/*.json', '../mobile/css/*' ])  
        .pipe( revCollector({
            replaceReved: true
        }) )   
        .pipe(gulp.dest( fs.realpathSync('../mobile/css/') ));

    gulp.src(['./rev/img/*.json', '../mobile/js/*' ])  
        .pipe( revCollector({
            replaceReved: true
        }) )   
        .pipe(gulp.dest( fs.realpathSync('../mobile/js/') ));     
});

//使用connect启动一个Web服务器
gulp.task('server', function () {
  connect.server();
});

/*错误处理*/
function errorHandler (error) {
  console.log(error.toString());
  this.emit('end');
}

/* 测试以及线上环境 */
gulp.task('release', function() {
    isRelease = true;
    return runSequence(
            'clean',
            ['images','less', 'scripts'], 
            ['rev']
        );
});

/* 本地开发环境 */
gulp.task('dev', function(){

    return runSequence(
            'clean',
            ['images','less', 'scripts'], 
            ['rev'],
            function(){

                var less_watcher = gulp.watch(src.css, function(){
                    gulp.start('less');
                });
                /*less_watcher.on('change', function(event) {
                  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
                })*/

                var js_watcher = gulp.watch(src.js, function(){
                    gulp.start('scripts');
                });
                /*js_watcher.on('change', function(event) {
                  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
                })*/

            }
        );

});

gulp.task('default', function(){
    gulp.start('dev');
})


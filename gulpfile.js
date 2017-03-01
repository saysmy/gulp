//引入插件
var gulp = require('gulp'),
    cleanCss = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    less = require('gulp-less'),
    plumber = require('gulp-plumber'), // less报错时不退出watch
    connect = require('gulp-connect'),
    clean = require('gulp-clean'),
    fs = require('fs'), //获取真实路径
    runSequence = require('run-sequence'),
    rev = require('gulp-rev'),  
    revCollector = require('gulp-rev-collector'),
    gulpif = require('gulp-if'),
    changed = require('gulp-changed'),
    debug = require('gulp-debug');

// 任务处理的文件路径配置
var src = {
        js: [
            fs.realpathSync('../src/mobile/js') + '/**/*.js'
        ],
        css: [
            fs.realpathSync('../src/mobile/css') + '/**/*.less'
        ],
        img: [
            '../src/mobile/img/**'
        ],
        base: '../src/mobile/'
    },
    dest = {
        jscss: [
            fs.realpathSync('../mobile/js') + '/**/*.js',
            fs.realpathSync('../mobile/css') + '/**/*.css'
        ]
    },
    pc_src = {
        js: [
            fs.realpathSync('../src/pc/js') + '/**/*.js'
        ],
        less: [
            fs.realpathSync('../src/pc/css') + '/**/*.less'
        ],
        css: [
            fs.realpathSync('../src/pc/css') + '/**/*.css'
        ],
        cssall: [
            fs.realpathSync('../src/pc/css') + '/**'
        ],
        img: [
            '../src/pc/img/**'
        ],
        base: '../src/pc/'
    },
    pc_dest = {
        jscss: [
            fs.realpathSync('../pc/v3/js') + '/**/*.js',
            fs.realpathSync('../pc/v3/css') + '/**/*.css'
        ]
    },
    output = '../mobile',
    pc_output = '../pc/v3';

var isRelease = false ;

/*--------------------- mobile --------------------*/
/*清除*/
gulp.task('clean', function(){
    return gulp.src(dest.jscss, {read: false})
        .pipe(clean({force: true}));
})

gulp.task('scripts', function(){
    return gulp.src(src.js, {base: src.base })
        .pipe( gulpif(!isRelease, changed(output) ) )
        //.pipe(sourcemaps.init())
        .pipe( gulpif(isRelease, uglify()) )
        .on('error', errorHandler)
        .pipe( gulpif(isRelease, rev() ) )
        .pipe(debug({title: 'js:'}))
        //.pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest(output))
        .pipe( gulpif(isRelease, rev.manifest() ) )
        .pipe( gulpif(isRelease, gulp.dest('./rev/mobile/js/') ) );
});

gulp.task('less', function(){

    return gulp.src(src.css, {base: src.base })
        .pipe( gulpif(!isRelease, changed(output, {extension: '.css'}) ) )
        .pipe(less()).on('error', errorHandler)
        .pipe(plumber())
        .pipe( gulpif(isRelease, cleanCss()) )
        .pipe( gulpif(isRelease, rev() ) )
        .pipe(debug({title: 'css:'}))
        .pipe(gulp.dest(output))
        .pipe( gulpif(isRelease, rev.manifest() ) )
        .pipe( gulpif(isRelease, gulp.dest('./rev/mobile/css/') ) );
});

gulp.task('images', function(){

    return gulp.src(src.img, {base: src.base })
        .pipe(gulpif(!isRelease, changed(output)) )
        .pipe(rev())
        .pipe(gulp.dest(output))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/mobile/img/'));

});
gulp.task('rev', function() {
    gulp.src(['./rev/mobile/**/*.json', '../../videochat/web/protected/modules/mobile/views/**/*.php' ]) 
        .pipe( revCollector({
            replaceReved: true
        }) )      
        .pipe(gulp.dest( fs.realpathSync('../../videochat/web/protected/modules/mobile/views/') ));

    gulp.src(['./rev/mobile/img/*.json', '../mobile/css/*' ])  
        .pipe( revCollector({
            replaceReved: true
        }) )   
        .pipe(gulp.dest( fs.realpathSync('../mobile/css/') ));

    gulp.src(['./rev/mobile/img/*.json', '../mobile/js/*' ])  
        .pipe( revCollector({
            replaceReved: true
        }) )   
        .pipe(gulp.dest( fs.realpathSync('../mobile/js/') ));     
});


/* 测试以及线上环境 */
gulp.task('release', function() {
    isRelease = true;
    return runSequence(
            ['images','less', 'scripts'], 
            ['rev']
        );
});

/* 本地开发环境 */
gulp.task('dev', function(){

    return runSequence(
            ['images','less', 'scripts'], 
            function(){

                var less_watcher = gulp.watch(src.css, ['less']);
                less_watcher.on('change', function(event) {
                  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
                })

                var js_watcher = gulp.watch(src.js, ['scripts']);
                js_watcher.on('change', function(event) {
                  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
                })

            }
        );

});

gulp.task('default', function(){
    gulp.start('dev');
})

/*------------------------------- PC -------------------------------------*/

/*清除*/
gulp.task('pc_clean', function(){
    return gulp.src(pc_dest.jscss, {read: false})
        .pipe(clean({force: true}));
})

gulp.task('pc_scripts', function(){
    return gulp.src(pc_src.js, {base: pc_src.base })
        .pipe(gulpif(!isRelease, changed(pc_output) ) )
        .pipe( gulpif(isRelease, uglify()) )
        .on('error', errorHandler)
        .pipe(rev())
        .pipe(debug({title: 'js:'}))
        .pipe(gulp.dest(pc_output))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/pc/js/'));
});

gulp.task('pc_less', function(){
    
    return gulp.src(pc_src.less, {base: pc_src.base })
        .pipe(gulpif(!isRelease, changed(pc_output , {extension: '.css'}) ) )
        .pipe(plumber())
        .pipe(less()).on('error', errorHandler)
        .pipe( gulpif(isRelease, cleanCss({compatibility: 'ie7'})) )
        .pipe(rev())
        .pipe(debug({title: 'css:'}))
        .pipe(gulp.dest(pc_output))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/pc/css/'));
});
gulp.task('pc_css', function(){

    return gulp.src(pc_src.css, {base: pc_src.base })
        .pipe( gulpif(!isRelease, changed(pc_output , {extension: '.css'} )) )
        .pipe(plumber())
        .pipe( gulpif(isRelease, cleanCss({compatibility: 'ie7'})) )
        .pipe(rev())
        .pipe(debug({title: 'css:'}))
        .pipe(gulp.dest(pc_output))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/pc/css/'));
});

gulp.task('pc_images', function(){

    return gulp.src(pc_src.img, {base: pc_src.base })
        .pipe(gulpif(!isRelease, changed(pc_output ) ) )
        .pipe(rev())
        .pipe(gulp.dest(pc_output))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/pc/img/'));

});
gulp.task('pc_rev', function() {
    gulp.src(['./rev/pc/**/*.json', '../../videochat/web/protected/views/**/*.php' ]) 
        .pipe( revCollector({
            replaceReved: true
        }) )      
        .pipe(gulp.dest( fs.realpathSync('../../videochat/web/protected/views/') ));

    gulp.src(['./rev/pc/img/*.json', '../pc/v3/css/*' ])  
        .pipe( revCollector({
            replaceReved: true
        }) )   
        .pipe(gulp.dest( fs.realpathSync('../pc/v3/css/') ));

    gulp.src(['./rev/pc/img/*.json', '../pc/v3/js/*' ])  
        .pipe( revCollector({
            replaceReved: true
        }) )   
        .pipe(gulp.dest( fs.realpathSync('../pc/v3/js/') ));     
});

/* 测试以及线上环境 */
gulp.task('pc_release', function() {
    isRelease = true;
    return runSequence(
            ['pc_images','pc_less','pc_css', 'pc_scripts'], 
            ['pc_rev']
        );
});

/* 本地开发环境 */
gulp.task('pc_dev', function(){

    return runSequence(
            ['pc_images','pc_less','pc_css', 'pc_scripts'], 
            function(){
                //watch监听需要监听路径，不能监听具体后缀名文件，所以此处用cssall
                var less_watcher = gulp.watch(pc_src.cssall, ['pc_less']);
                less_watcher.on('change', function(event) {
                  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
                })

                var js_watcher = gulp.watch(pc_src.js, ['pc_scripts']);
                js_watcher.on('change', function(event) {
                  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
                })

            }
        );

});

/***************** 移动待发布文件到trunk ***********************/

var file = './file.txt';
gulp.task('move', function() {
    fs.readFile(file, function(err, obj){
        console.log('err:', err);
        var obj = obj.toString().split('\n');

        for(var i = 0; i< obj.length; i++){

            var srcFile = obj[i];
            console.log('dir:', srcFile);
            
            if(srcFile.indexOf('.') == -1){
                srcFile += '/**' ;
            }

            if(srcFile.indexOf('static_guojiang_tv') != -1){
                gulp.src(srcFile, {base: '../'})    
                    .pipe(debug('file:',srcFile))
                    .pipe(gulp.dest( fs.realpathSync('../../trunk/static') ));
            }else{
                gulp.src(srcFile, {base: '../../'})    
                    .pipe(debug('file:',srcFile))
                    .pipe(gulp.dest( fs.realpathSync('../../trunk') ));
            }
            
        }
        
    })  


});


/****************************PC old less2css******************************/
gulp.task('pc_old', function(){

    return gulp.src('../pc/css/**/*.less')
        .pipe(less()).on('error', errorHandler)
        .pipe(plumber())
        .pipe( gulpif(isOldRelease, cleanCss({compatibility: 'ie7'})) )
        .pipe(debug({title: 'css:'}))
        .pipe(gulp.dest('../pc/css'));
});
gulp.task('pc_old_dev', function(){
    isOldRelease = false;
    gulp.start('pc_old');
});
gulp.task('pc_old_release', function(){
    isOldRelease = true;
    gulp.start('pc_old');
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
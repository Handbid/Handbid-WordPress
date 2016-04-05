var gulp = require("gulp"),
    watch = require('gulp-watch'),
    less = require('gulp-less'),
    sourcemaps = require('gulp-sourcemaps'),
    notify = require("gulp-notify"),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),

    LessPluginCleanCSS = require('less-plugin-clean-css'),
    cleancss = new LessPluginCleanCSS({advanced: true}),

    LessPluginAutoPrefix = require('less-plugin-autoprefix'),
    autoprefix = new LessPluginAutoPrefix({browsers: ["last 2 versions"]});


gulp.task('watch', function() {
    gulp.watch('resources/js/**/*.js', ['js']);
    gulp.watch('resources/less/**/*.less', ['less']);
});

gulp.task('js', function() {
    gulp.src([
        'resources/js/details-map.js',
        //'resources/js/smart-app-banner-init.js',
        'resources/js/photoGallery.js',
        'resources/js/slider.js',
        'resources/js/handbid.js',
        'resources/js/auction-details.js',
        'resources/js/tooltip.js',
        'resources/js/login.js',
        'resources/js/mobile-menu.js',
        'resources/js/modal.js'
    ])
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'))
    .pipe(notify("Gulp watch: js task completed."));
});

gulp.task('less', function () {
    gulp.src([
        'resources/less/variables.less',
        'resources/less/buttons.less',
        'resources/less/handbid.less',
        'resources/less/section_nav.less',
        'resources/less/sort_bar.less',
        'resources/less/bidder-info.less',
        'resources/less/auctions.less',
    
        'resources/less/handbid_css.less',
        
        'resources/less/modal.less',
        
        'resources/less/login_modal.less',
        'resources/less/ticket_modal.less',
        'resources/less/credit_card_modal.less',
        'resources/less/bid_modal.less',
        
        'resources/less/responsive-fix.less'
    ])
    .pipe(sourcemaps.init())
    .pipe(less({
        plugins: [autoprefix, cleancss]
    }))
    .pipe(concat('app.min.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/css'))
    .pipe(notify("Gulp watch: less task completed."));
});

gulp.task('default', ['js', 'less', 'watch']);
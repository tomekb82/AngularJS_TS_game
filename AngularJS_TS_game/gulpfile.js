var gulp = require('gulp'),
    ts = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    ngHtml2Js = require("gulp-ng-html2js"),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    less = require('gulp-less'),
    path = require('path'),
    sockjs = require('sockjs'),
    express = require('express');

var paths = {
    appName: 'War',
    dist: 'static/dist',
    vendor: {
        js: [
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/angular/angular.min.js',
            'node_modules/angular-ui-router/release/angular-ui-router.min.js',
            'styles/js/bootstrap.min.js',
            'styles/js/classie.js',
            'styles/js/cbpAnimatedHeader.js',
            'styles/js/jqBootstrapValidation.js',
            'styles/js/contact_me.js',
            'styles/js/agency.js'
        ],
        css: ['styles/**/*.css'],
        fonts: ['styles/font-awesome/fonts/*']
    },
    app: {
        templates: ['app/**/*.html', '!app/*.html'],
        scripts: ['app/**/*.ts'],
        styles: ['styles/**/*.scss','styles/**/*.css'],
        images: ['styles/images/**/*', 'styles/img/**/*']
    }
};

var tsProject = ts.createProject('tsconfig.json', {
    out: paths.appName + '.js'
});

// Templates
gulp.task('dev:build:templates', function () {
    return gulp.src(paths.app.templates)
        .pipe(ngHtml2Js({
            moduleName: paths.appName,
            declareModule: false
        }))
        .pipe(concat(paths.appName + ".tpls.min.js"))
        .pipe(gulp.dest(paths.dist));
});

// Scripts
gulp.task('dev:build:scripts', function () {
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    return tsResult.js
        .pipe(sourcemaps.write({
            sourceRoot: '/app'
        }))
        .pipe(gulp.dest(paths.dist));
});

// Styles
gulp.task('dev:build:styles', function () {
    return gulp.src(paths.app.styles)
        .pipe(sass()).pipe(less())
        .pipe(gulp.dest(paths.dist + '/css'));
});

// Fonts
gulp.task('dev:build:fonts', function () {
    return gulp.src(paths.vendor.fonts)
        .pipe(gulp.dest(paths.dist + '/css/font-awesome/fonts'));
});

// Images
gulp.task('dev:build:images', function () {
    return gulp.src(paths.app.images)
        .pipe(gulp.dest(paths.dist + '/images'));
});

// Vendor
gulp.task('dev:build:vendor', function () {
    return gulp.src(paths.vendor.js)
        .pipe(concat('vendor.min.js'))
        .pipe(gulp.dest(paths.dist))
});

gulp.task('dev:run', ['dev:build:templates', 'dev:build:scripts', 'dev:build:styles', 'dev:build:images', 'dev:build:fonts', 'dev:build:vendor'], function () {

    var app = express();
    app.use('/app', express.static('app'));
    app.use(express.static('static'));

    var tables = [];
    var connections = [];

    app.get('/api/table', function (req, res) {
        res.json(tables);
    });

    var server = app.listen(5000, function () {
    });

    var sendEvent = function (event) {
        console.log('<<event>>', JSON.stringify(event));
        event.type = 'EVENT';
        connections.forEach(function (connection) {
            connection.write(JSON.stringify(event));
        });
    };

    var websocket = sockjs.createServer({sockjs_url: 'sockjs.min.js'});
    websocket.on('connection', function (conn) {

        var username = '';

        connections.push(conn);
        console.log('[new] connections: ' + connections.length);

        conn.on('data', function (message) {
            message = JSON.parse(message);

            if (message.type === 'COMMAND') {
                console.log('<<command>>', JSON.stringify(message));

                if (message.command === 'USER.CREATE') {
                    username = message.data.username;

                    sendEvent({
                        command: message.command,
                        message: 'User ' + username + ' joined.'
                    });

                } else if (message.command === 'TABLE.CREATE') {
                    tables.push({
                        owner: username,
                        players: []
                    });
                    sendEvent({
                        command: message.command,
                        message: 'New table created by ' + username + '.',
                        data: {
                            tableId: tables.length - 1
                        }
                    });

                } else if (message.command === 'TABLE.JOIN') {
                    var table = tables[message.data.tableId];
                    if (table.owner !== username && table.players.filter(function (player) {
                            return player === username;
                        }).length === 0) {
                        table.players.push(username);
                    }
                    sendEvent({
                        command: message.command,
                        message: 'User ' + username + ' joined the table.',
                        data: {
                            tableId: message.data.tableId
                        }
                    });

                } else if (message.command === 'GAME.UPDATE') {
                    var table = tables[message.data.tableId];
                    sendEvent({
                        command: message.command,
                        message: 'Updated game.',
                        data: {
                            tableId: message.data.tableId,
                            players: message.data.players,
                            table: message.data.table,
                            results: message.data.results
                        }
                    });

                } else if (message.command === 'GAME.VISIBILITY') {
                    var table = tables[message.data.tableId];
                    sendEvent({
                        command: message.command,
                        message: 'Toggle visibility.',
                        data: {
                            tableId: message.data.tableId,
                            handsVisible: message.data.handsVisible,
                            scoreVisible: message.data.scoreVisible
                        }
                    });
                }

            }

            if (message.type === 'EVENT') {
                sendEvent(message);
            }
        });

        conn.on('close', function () {
            connections.splice(connections.indexOf(conn), 1);
            console.log('[del] connections: ' + connections.length);
        });

    });

    websocket.installHandlers(server, {prefix: '/ws'});

    gulp.watch(paths.app.templates, {interval: 500}, ['dev:build:templates']);
    gulp.watch(paths.app.scripts, {interval: 500}, ['dev:build:scripts']);
    gulp.watch(paths.app.styles, {interval: 500}, ['dev:build:styles']);
    gulp.watch(paths.app.images, {interval: 500}, ['dev:build:images']);
    gulp.watch(paths.app.images, {interval: 500}, ['dev:build:fonts']);
});

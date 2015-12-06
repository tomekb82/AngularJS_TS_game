/// <reference path="config/App.config.ts" />

module AppModule {
    'use strict';
    angular.module('War', ['ui.router']);

    export var getModule:() => ng.IModule = () => {
        return angular.module('War');
    };

    var app = getModule();

    // run
    app.run(runConfig);
}

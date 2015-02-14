angular.module('mass', ['ngResource', 'ui.router', 'ngMaterial'])
  .config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/mass/');

    $stateProvider
      .state('mass', {
        abstract: true,
        url: '/mass',
        template: '<ui-view></ui-view>'
      })
      .state('mass.hello', {
        url: '/:name',
        templateUrl: 'mass/hello.html',
        controller: 'HelloCtrl'
      });
  })
  .run(function() {

  });

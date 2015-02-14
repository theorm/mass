angular.module('mass')
  .controller('HelloCtrl', function($scope, $stateParams) {
    $scope.name = $stateParams.name || 'Anonymous';
  });

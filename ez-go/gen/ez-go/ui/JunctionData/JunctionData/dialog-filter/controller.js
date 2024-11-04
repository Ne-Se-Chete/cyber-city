angular.module('page', ["ideUI", "ideView"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'ez-go.JunctionData.JunctionData';
	}])
	.controller('PageController', ['$scope', 'messageHub', 'ViewParameters', function ($scope, messageHub, ViewParameters) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};

		let params = ViewParameters.get();
		if (Object.keys(params).length) {
			if (params?.entity?.TimestampFrom) {
				params.entity.TimestampFrom = new Date(params.entity.TimestampFrom);
			}
			if (params?.entity?.TimestampTo) {
				params.entity.TimestampTo = new Date(params.entity.TimestampTo);
			}
			$scope.entity = params.entity ?? {};
			$scope.selectedMainEntityKey = params.selectedMainEntityKey;
			$scope.selectedMainEntityId = params.selectedMainEntityId;
			$scope.optionsJunction = params.optionsJunction;
		}

		$scope.filter = function () {
			let entity = $scope.entity;
			const filter = {
				$filter: {
					equals: {
					},
					notEquals: {
					},
					contains: {
					},
					greaterThan: {
					},
					greaterThanOrEqual: {
					},
					lessThan: {
					},
					lessThanOrEqual: {
					}
				},
			};
			if (entity.Id !== undefined) {
				filter.$filter.equals.Id = entity.Id;
			}
			if (entity.IsRaining !== undefined && entity.isIsRainingIndeterminate === false) {
				filter.$filter.equals.IsRaining = entity.IsRaining;
			}
			if (entity.Junction !== undefined) {
				filter.$filter.equals.Junction = entity.Junction;
			}
			if (entity.TimestampFrom) {
				filter.$filter.greaterThanOrEqual.Timestamp = entity.TimestampFrom;
			}
			if (entity.TimestampTo) {
				filter.$filter.lessThanOrEqual.Timestamp = entity.TimestampTo;
			}
			if (entity.IsFallen !== undefined && entity.isIsFallenIndeterminate === false) {
				filter.$filter.equals.IsFallen = entity.IsFallen;
			}
			if (entity.IsNoisy !== undefined && entity.isIsNoisyIndeterminate === false) {
				filter.$filter.equals.IsNoisy = entity.IsNoisy;
			}
			if (entity.IsAmbulancePassing !== undefined && entity.isIsAmbulancePassingIndeterminate === false) {
				filter.$filter.equals.IsAmbulancePassing = entity.IsAmbulancePassing;
			}
			if (entity.IsFoggy !== undefined && entity.isIsFoggyIndeterminate === false) {
				filter.$filter.equals.IsFoggy = entity.IsFoggy;
			}
			messageHub.postMessage("entitySearch", {
				entity: entity,
				filter: filter
			});
			messageHub.postMessage("clearDetails");
			$scope.cancel();
		};

		$scope.resetFilter = function () {
			$scope.entity = {};
			$scope.filter();
		};

		$scope.cancel = function () {
			messageHub.closeDialogWindow("JunctionData-filter");
		};

		$scope.clearErrorMessage = function () {
			$scope.errorMessage = null;
		};

	}]);
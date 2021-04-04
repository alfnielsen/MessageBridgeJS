"use strict";
var SignalR = jest.genMockFromModule("@microsoft/signalr");
var HubConnection = /** @class */ (function () {
    function HubConnection() {
        this.successCallback = function () { return "failure"; };
    }
    HubConnection.prototype.on = function (methodName, callback) {
        this.successCallback = callback;
        return Promise.resolve();
    };
    HubConnection.prototype.start = function () {
        return Promise.resolve();
    };
    HubConnection.prototype.invoke = function () {
        return Promise.resolve();
    };
    return HubConnection;
}());
var hubConnection = new HubConnection();
var HubConnectionBuilder = function () { return ({
    withUrl: function (url) { return ({
        withAutomaticReconnect: function () { return ({
            build: function () { return hubConnection; },
        }); },
    }); },
}); };
//@ts-ignore
SignalR.HubConnectionBuilder = HubConnectionBuilder;
//@ts-ignore
SignalR.HubConnection = hubConnection;
module.exports = SignalR;

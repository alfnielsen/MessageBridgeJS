var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as signalR from "@microsoft/signalr";
import { MessageBridgeServiceBase } from "./MessageBridgeServiceBase";
var SignalRMessageBridgeService = /** @class */ (function (_super) {
    __extends(SignalRMessageBridgeService, _super);
    function SignalRMessageBridgeService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SignalRMessageBridgeService.prototype.connect = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.wsUri, options)
            .withAutomaticReconnect()
            .build();
        this.connection.on("ReceiveMessage", function (messageString) {
            _this.onMessage(messageString);
        });
        return this.connection
            .start()
            .then(function () {
            _this.connected = true;
        })
            .catch(function (err) {
            _this.onError(err);
        });
    };
    SignalRMessageBridgeService.prototype.sendNetworkMessage = function (msg) {
        var _this = this;
        var _a;
        var msgJson = JSON.stringify(msg);
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.invoke("SendMessage", msgJson).catch(function (err) {
            _this.onError(err);
            return console.error(err.toString());
        });
    };
    return SignalRMessageBridgeService;
}(MessageBridgeServiceBase));
export { SignalRMessageBridgeService };
//# sourceMappingURL=SignalRMessageBridgeService.js.map
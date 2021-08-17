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
import { ConnectionService } from "./ConnectionService";
var MessageBridgeServiceMock = /** @class */ (function (_super) {
    __extends(MessageBridgeServiceMock, _super);
    function MessageBridgeServiceMock() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.wsUri = "";
        return _this;
    }
    MessageBridgeServiceMock.prototype.connect = function (url) {
        var _this = this;
        this.socket = new WebSocket(this.wsUri);
        this.socket.addEventListener("message", function (event) {
            var messageString = event.data;
            _this.onMessage(messageString);
        });
        return new Promise(function (resolve, reject) {
            var _a;
            // Connection opened
            (_a = _this.socket) === null || _a === void 0 ? void 0 : _a.addEventListener("open", function (event) {
                resolve();
            });
        });
    };
    MessageBridgeServiceMock.prototype.sendMessage = function (msg) {
        var _a;
        var msgJson = JSON.stringify(msg);
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(msgJson);
    };
    return MessageBridgeServiceMock;
}(ConnectionService));
export { MessageBridgeServiceMock };
//# sourceMappingURL=WebSocketConnectionService.js.map
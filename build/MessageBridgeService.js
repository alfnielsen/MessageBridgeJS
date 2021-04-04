import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { MessageDirection } from "./MessageDirection";
import { MessageType } from "./MessageType";
var MessageBridgeService = /** @class */ (function () {
    function MessageBridgeService(wsUri) {
        this.wsUri = wsUri;
        this.connected = false;
        this.subscriptionTrackIdList = {};
        this.subscriptionEventList = {};
        this.subscriptionQuery = [];
        this.history = [];
        this.bridgeErrors = [];
    }
    MessageBridgeService.prototype.sendMessage = function (msg, callback) {
        msg.direction = MessageDirection.ToServer;
        if (callback) {
            this.subscriptionTrackIdList[msg.trackId] = callback;
        }
        this.internalSendMessage(msg);
    };
    MessageBridgeService.prototype.subscribeEvent = function (_a) {
        var _this = this;
        var name = _a.name, callback = _a.callback;
        if (!this.subscriptionEventList[name])
            this.subscriptionEventList[name] = [];
        this.subscriptionEventList[name].push(callback);
        return function () {
            var index = _this.subscriptionEventList[name].findIndex(function (x) { return x === callback; });
            _this.subscriptionEventList[name].splice(index, 1);
        };
    };
    MessageBridgeService.prototype.createCommandMessage = function (name, payload, direction) {
        if (direction === void 0) { direction = MessageDirection.ToServer; }
        return Message.create({
            name: name,
            type: MessageType.Command,
            payload: payload,
            direction: direction,
        });
    };
    MessageBridgeService.prototype.createQueryMessage = function (name, payload, direction) {
        if (direction === void 0) { direction = MessageDirection.ToServer; }
        return Message.create({
            name: name,
            type: MessageType.Query,
            payload: payload,
            direction: direction,
        });
    };
    MessageBridgeService.prototype.sendCommand = function (_a) {
        var name = _a.name, payload = _a.payload, callback = _a.callback;
        var msg = this.createCommandMessage(name, payload);
        this.sendMessage(msg, callback);
        return msg;
    };
    MessageBridgeService.prototype.sendQuery = function (_a) {
        var name = _a.name, payload = _a.payload, callback = _a.callback;
        var msg = this.createQueryMessage(name, payload);
        this.sendMessage(msg, callback);
        return msg;
    };
    MessageBridgeService.prototype.subscribeQuery = function (opt) {
        var _this = this;
        //call right away
        this.sendQuery({
            name: opt.name,
            payload: opt.query,
            callback: opt.update,
        });
        //then subscribe
        this.subscriptionQuery.push(opt);
        return /*unsubscribe*/ function () {
            var index = _this.subscriptionQuery.findIndex(function (x) { return x === opt; });
            if (index > 0) {
                _this.subscriptionQuery.splice(index, 1);
            }
        };
    };
    MessageBridgeService.prototype.onError = function (err) { };
    MessageBridgeService.prototype.connect = function () {
        var _this = this;
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.wsUri)
            .withAutomaticReconnect()
            .build();
        this.connection.on("ReceiveMessage", function (messageString) {
            try {
                var messageDto = JSON.parse(messageString);
                _this.handleIncomingMessage(messageDto);
            }
            catch (e) {
                _this.bridgeErrors.push(e);
                console.log("Incerrect message received: " + messageString);
            }
        });
        return this.connection
            .start()
            .then(function () {
            _this.connected = true;
        })
            .catch(function (err) {
            _this.onError(err.toString());
        });
    };
    MessageBridgeService.prototype.handleIncomingMessage = function (messageDto) {
        var msg = Message.fromDto(messageDto);
        this.history.push(msg);
        if (this.subscriptionTrackIdList[msg.trackId]) {
            this.subscriptionTrackIdList[msg.trackId](msg);
            delete this.subscriptionTrackIdList[msg.trackId];
        }
        if (msg.type === MessageType.Event) {
            this.receiveEventMessage(msg);
        }
    };
    MessageBridgeService.prototype.receiveEventMessage = function (eventMsg) {
        var _this = this;
        if (this.subscriptionEventList[eventMsg.name] &&
            this.subscriptionEventList[eventMsg.trackId]) {
            this.subscriptionEventList[eventMsg.trackId].forEach(function (x) { return x(eventMsg); });
        }
        this.subscriptionQuery
            .filter(function (x) { var _a, _b; return (_b = (_a = x.triggers) === null || _a === void 0 ? void 0 : _a.some(function (x) { return x === eventMsg.name; })) !== null && _b !== void 0 ? _b : false; })
            .forEach(function (x) {
            var msg = _this.createQueryMessage(x.name, x.query);
            _this.sendMessage(msg, x.update);
        });
    };
    MessageBridgeService.prototype.internalSendMessage = function (msg) {
        var _this = this;
        var _a;
        this.history.push(msg);
        var msgJson = JSON.stringify(msg);
        (_a = this.connection) === null || _a === void 0 ? void 0 : _a.invoke("SendMessage", msgJson).catch(function (err) {
            _this.bridgeErrors.push(err);
            return console.error(err.toString());
        });
    };
    return MessageBridgeService;
}());
export { MessageBridgeService };

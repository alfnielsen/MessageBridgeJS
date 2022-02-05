import { Message } from './Message';
import { MessageDirection, MessageType, } from './MessageBridgeInterfaces';
var MessageBridgeServiceBase = /** @class */ (function () {
    function MessageBridgeServiceBase(wsUri) {
        this.wsUri = wsUri;
        this.connected = false;
        this.debugLogger = (window === null || window === void 0 ? void 0 : window.console.log) || (function () { }); // set custom logger
        this.debugLogging = {
            messageReceived: false,
            sendingMessage: false,
        };
        this.subscriptionTrackIdList = {};
        this.subscriptionEventList = {};
        this.subscriptionQuery = [];
        this.history = [];
        this.bridgeErrors = [];
    }
    // return this.connection.start();
    MessageBridgeServiceBase.prototype.onMessage = function (messageString) {
        var messageDto;
        try {
            messageDto = typeof messageString === 'string' ? JSON.parse(messageString) : messageString;
        }
        catch (e) {
            this.onError(e);
            console.log('Incorrect message received: ' + messageString);
            return;
        }
        try {
            var msg = Message.fromDto(messageDto);
            if (this.debugLogging.messageReceived) {
                this.debugLogger('Bridge (messageReceived): ', msg);
            }
            this.handleIncomingMessage(msg);
        }
        catch (e) {
            console.log('Error in response handle for message: ' + e);
        }
    };
    MessageBridgeServiceBase.prototype.sendMessage = function (msg, onSuccess, onError) {
        msg.direction = MessageDirection.ToServer;
        if (onSuccess || onError) {
            this.subscriptionTrackIdList[msg.trackId] = { onSuccess: onSuccess, onError: onError };
        }
        this.internalSendMessage(msg);
    };
    MessageBridgeServiceBase.prototype.internalSendMessage = function (msg) {
        this.history.push(msg);
        if (this.debugLogging.sendingMessage) {
            this.debugLogger('Bridge (sendingMessage): ', msg);
        }
        this.sendNetworkMessage(msg);
    };
    MessageBridgeServiceBase.prototype.subscribeEvent = function (_a) {
        var _this = this;
        var name = _a.name, onEvent = _a.onEvent;
        if (!this.subscriptionEventList[name])
            this.subscriptionEventList[name] = [];
        this.subscriptionEventList[name].push(onEvent);
        return function () {
            var index = _this.subscriptionEventList[name].findIndex(function (x) { return x === onEvent; });
            _this.subscriptionEventList[name].splice(index, 1);
        };
    };
    MessageBridgeServiceBase.prototype.createCommandMessage = function (name, payload, direction) {
        if (direction === void 0) { direction = MessageDirection.ToServer; }
        return Message.create({
            name: name,
            type: MessageType.Command,
            payload: payload,
            direction: direction,
        });
    };
    MessageBridgeServiceBase.prototype.createQueryMessage = function (name, payload, direction) {
        if (direction === void 0) { direction = MessageDirection.ToServer; }
        return Message.create({
            name: name,
            type: MessageType.Query,
            payload: payload,
            direction: direction,
        });
    };
    MessageBridgeServiceBase.prototype.createEventMessage = function (name, payload, direction) {
        if (direction === void 0) { direction = MessageDirection.ToServer; }
        return Message.create({
            name: name,
            type: MessageType.Event,
            payload: payload,
            direction: direction,
        });
    };
    MessageBridgeServiceBase.prototype.sendCommand = function (_a) {
        var name = _a.name, payload = _a.payload, onSuccess = _a.onSuccess, onError = _a.onError;
        var msg = this.createCommandMessage(name, payload);
        this.sendMessage(msg, onSuccess, onError);
        return msg;
    };
    MessageBridgeServiceBase.prototype.sendQuery = function (_a) {
        var name = _a.name, payload = _a.payload, onSuccess = _a.onSuccess, onError = _a.onError;
        var msg = this.createQueryMessage(name, payload);
        this.sendMessage(msg, onSuccess, onError);
        return msg;
    };
    MessageBridgeServiceBase.prototype.sendEvent = function (_a) {
        var name = _a.name, payload = _a.payload;
        var msg = this.createEventMessage(name, payload);
        this.sendMessage(msg);
        return msg;
    };
    MessageBridgeServiceBase.prototype.subscribeQuery = function (opt) {
        var _this = this;
        //call right away
        this.sendQuery({
            name: opt.name,
            payload: opt.query,
            onSuccess: opt.onUpdate,
            onError: opt.onError,
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
    // can be overwritten by consumer!
    MessageBridgeServiceBase.prototype.onError = function (err) {
        this.bridgeErrors.push(err);
    };
    MessageBridgeServiceBase.prototype.handleIncomingMessage = function (msg) {
        var _a, _b, _c, _d;
        this.history.push(msg);
        if (this.subscriptionTrackIdList[msg.trackId]) {
            if (msg.type === MessageType.Error) {
                (_b = (_a = this.subscriptionTrackIdList[msg.trackId]).onError) === null || _b === void 0 ? void 0 : _b.call(_a, msg.payload, msg);
            }
            else {
                (_d = (_c = this.subscriptionTrackIdList[msg.trackId]).onSuccess) === null || _d === void 0 ? void 0 : _d.call(_c, msg.payload, msg);
            }
            delete this.subscriptionTrackIdList[msg.trackId];
        }
        if (msg.type === MessageType.Event) {
            this.receiveEventMessage(msg);
        }
    };
    MessageBridgeServiceBase.prototype.receiveEventMessage = function (eventMsg) {
        var _this = this;
        if (this.subscriptionEventList[eventMsg.name]) {
            this.subscriptionEventList[eventMsg.name].forEach(function (callback) { return callback(eventMsg.payload, eventMsg); });
        }
        this.subscriptionQuery
            .filter(function (x) { var _a, _b; return (_b = (_a = x.triggers) === null || _a === void 0 ? void 0 : _a.some(function (x) { return x === eventMsg.name; })) !== null && _b !== void 0 ? _b : false; })
            .forEach(function (x) {
            var msg = _this.createQueryMessage(x.name, x.query);
            _this.sendMessage(msg, x.onUpdate, x.onError);
        });
    };
    return MessageBridgeServiceBase;
}());
export { MessageBridgeServiceBase };
//# sourceMappingURL=MessageBridgeServiceBase.js.map
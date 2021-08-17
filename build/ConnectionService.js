import { Message } from "./Message";
var ConnectionService = /** @class */ (function () {
    function ConnectionService(messageBridgeService) {
        this.messageBridgeService = messageBridgeService;
    }
    ConnectionService.prototype.onMessage = function (messageString) {
        var messageDto;
        try {
            messageDto =
                typeof messageString === "string"
                    ? JSON.parse(messageString)
                    : messageString;
        }
        catch (e) {
            this.messageBridgeService.onError(e);
            console.log("Incorrect message received: " + messageString);
            return;
        }
        try {
            var msg = Message.fromDto(messageDto);
            this.messageBridgeService.handleIncomingMessage(msg);
        }
        catch (e) {
            console.log("Error in response handle for message: " + e);
        }
    };
    return ConnectionService;
}());
export { ConnectionService };
//# sourceMappingURL=ConnectionService.js.map
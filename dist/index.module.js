import{HubConnectionBuilder as e}from"@microsoft/signalr";import{v4 as s}from"uuid";var t,r;function n(e,s=r.ToClient){return e.isError=e.type===t.Error,e.direction??=s,e}function o(e){return{name:e.name,payload:e.payload,type:e.type,direction:e.direction??r.ToClient,trackId:e.trackId??s(),module:e.module,schema:e.schema,created:(new Date).toISOString(),isError:e.type===t.Error}}function i(e){return o({...e,type:t.Command})}function a(e){return o({...e,type:t.Query})}function c(e){return o({...e,type:t.Event})}!function(e){e.Command="Command",e.CommandResponse="CommandResponse",e.Query="Query",e.QueryResponse="QueryResponse",e.Event="Event",e.Error="Error"}(t||(t={})),function(e){e.ToClient="ToClient",e.ToServer="ToServer"}(r||(r={}));class d{constructor(e){this.wsUri=void 0,this.connected=!1,this.trackedRequestMap={},this.subscribedEventListMap={},this.history=[],this.bridgeErrors=[],this.options={timeout:void 0,allowResponseValueWhenCancelled:!1,keepHistoryForReceivedMessages:!1,keepHistoryForSendingMessages:!1,logger:()=>console?.log??(()=>{}),logParseIncomingMessageError:!0,timeoutFromBridgeOptionsMessage:e=>`Timeout after ${e}ms (BridgeOptions.timeout)`,timeoutFromRequestOptionsMessage:e=>`Timeout after ${e}ms (RequestOptions.timeout)`,logParseIncomingMessageErrorFormat:e=>["Bridge-Error (parse messageReceived):",e],logMessageReceived:!1,logMessageReceivedFormat:e=>["Bridge (messageReceived):",e],logSendingMessage:!1,logSendingMessageFormat:e=>["Bridge (sendingMessage):",e]},this.wsUri=e}setOptions(e){this.options={...this.options,...e}}getTrackedRequestMessage(e){return this.trackedRequestMap[e]?.requestMessage}cancelRequest(e){this.trackedRequestMap[e]&&(this.trackedRequestMap[e].requestMessage.cancelled=!0)}onConnect(){this.connected=!0,this.options.onConnect?.()}onError(e,s){void 0!==e&&this.bridgeErrors.push(e),this.options.onError?.(e,s)}onClose(e,s){void 0!==e&&this.bridgeErrors.push(e),this.connected=!1,this.options.onClose?.(e,s)}setOptionalRequestTimeout({requestMessage:e,timeout:s,onTimeout:t}){let r,n;if(void 0!==s?(r=this.options.timeoutFromRequestOptionsMessage?.(s)??`timeout after ${s}`,n=s):void 0!==this.options.timeout&&(r=this.options.timeoutFromBridgeOptionsMessage?.(this.options.timeout)??`timeout after ${this.options.timeout}`,n=this.options.timeout),void 0!==n)return setTimeout(()=>{e.timedOut=!0,t({reason:r,responseMessage:void 0,request:e.payload,requestMessage:e})},n)}sendMessageTracked(e){if(e.requestMessage.cancelled){let s=!0;if(void 0!==e.requestOptions.sendCancelled?s=!e.requestOptions.sendCancelled:this.options.sendCancelledRequest&&(s=!1),s)return Promise.resolve({request:e.requestMessage.payload,requestMessage:e.requestMessage,cancelled:!0})}return new Promise((s,t)=>{this.sendMessagePromiseHandler({...e,handleSuccess:(e,t)=>{s(t)},handleError:(e,r)=>{this.options.throwOnTrackedError?t(r):s(r)}})}).finally(()=>{delete this.trackedRequestMap[e.requestMessage.trackId]})}sendMessage(e){const s=void 0;if(e.requestMessage.cancelled){let t=!0;if(void 0!==e.requestOptions.sendCancelled?t=!e.requestOptions.sendCancelled:this.options.sendCancelledRequest&&(t=!1),t)return Promise.resolve(s)}return new Promise((t,r)=>{this.sendMessagePromiseHandler({...e,handleSuccess:(e,r)=>{t(e?s:r.response)},handleError:(e,n,o)=>{e&&t(s),this.options.avoidThrowOnNonTrackedError?t(o?.payload):r(n)}})})}sendMessagePromiseHandler({handleError:e,handleSuccess:s,requestMessage:t,requestOptions:n}){t.direction=r.ToServer,this.options.interceptSendMessage&&(t=this.options.interceptSendMessage(t));const o=(s,r)=>{i&&clearTimeout(i);const o={response:void 0,responseMessage:void 0,request:t.payload,requestMessage:t,isError:!0,error:r.reason,errorMessage:r.responseMessage,cancelled:t.cancelled||r.requestMessage?.cancelled||r.responseMessage?.cancelled,timedOut:t.timedOut||r.requestMessage?.timedOut||r.responseMessage?.timedOut};s&&this.options.callOnErrorWhenRequestIsCancelled&&n.callOnErrorWhenRequestIsCancelled||(this.onError(o),n.onError?.(o)),e(s,o,r)},i=this.setOptionalRequestTimeout({requestMessage:t,timeout:n.timeout,onTimeout:e=>{const s=this.handleCancelOptions(n,t);o(s,e)}});this.trackedRequestMap[t.trackId]={successTrack:e=>{const{response:r,cancelled:o}=this.handleCancelResponse(n,t,e),a={response:r,responseMessage:e,requestOptions:n,request:t.payload,requestMessage:t,isError:!1,cancelled:t.cancelled||e.cancelled,timedOut:t.timedOut||e.timedOut};i&&clearTimeout(i),(!o||this.options.callOnSuccessWhenRequestIsCancelled||n.callOnSuccessWhenRequestIsCancelled)&&(this.options.onSuccess?.(a),n.onSuccess?.(a)),s(o,a)},errorTrack:e=>{const{response:s,cancelled:r}=this.handleCancelResponse(n,t,e);o(r,{reason:s,responseMessage:e,request:t.payload,requestMessage:t})},requestMessage:t,requestOptions:n},this.internalSendMessage(t)}handleCancelOptions(e,s,t){let r=!1;void 0!==e.resolveCancelledForNonTracked?r=e.resolveCancelledForNonTracked:this.options.resolveCancelledNonTrackedRequest&&(r=!0);let n=!1;return(t?.cancelled||s.cancelled)&&(n=!0),r&&n&&(n=!1),n}handleCancelResponse(e,s,t){const r=this.handleCancelOptions(e,s,t);let n=t?.payload;return r&&(void 0!==e.allowResponseValueWhenCancelled?!0!==e.allowResponseValueWhenCancelled&&(n=void 0):!0!==this.options.allowResponseValueWhenCancelled&&(n=void 0)),{response:n,cancelled:r}}subscribeEvent({name:e,onEvent:s}){if(Array.isArray(e)){const t=e.map(e=>this.subscribeEvent({name:e,onEvent:s}));return()=>t.forEach(e=>e())}return this.subscribedEventListMap[e]||(this.subscribedEventListMap[e]=[]),this.subscribedEventListMap[e].push(s),()=>{const t=this.subscribedEventListMap[e].findIndex(e=>e===s);this.subscribedEventListMap[e].splice(t,1)}}createTrackedMessage(e){const s=e.requestMessage.trackId;let t={trackId:s,requestMessage:e.requestMessage,requestOptions:e.requestOptions,send:()=>this.sendMessage(e),sendTracked:()=>this.sendMessageTracked(e),cancel:()=>{e?.requestMessage&&(e.requestMessage.cancelled=!0),this.cancelRequest(s)}};return this.options.interceptCreatedMessageOptions&&(t=this.options.interceptCreatedMessageOptions(t)),t}createCommand(e){const s=i(e);return this.createTrackedMessage({requestMessage:s,requestOptions:e})}createQuery(e){const s=a(e);return this.createTrackedMessage({requestMessage:s,requestOptions:e})}sendCommand(e){return this.createCommand(e).send()}sendCommandTracked(e){return this.createCommand(e).sendTracked()}sendQuery(e){return this.createQuery(e).send()}sendQueryTracked(e){return this.createQuery(e).sendTracked()}createEvent(e){let s=c(e);s.direction=r.ToServer;let t={trackId:s.trackId,requestMessage:s,requestOptions:e,cancel:()=>{s&&(s.cancelled=!0)},send:()=>{if(s.cancelled)if(void 0!==e.sendCancelled){if(!e.sendCancelled)return}else if(!this.options.sendCancelledRequest)return;this.options.interceptSendMessage&&(s=this.options.interceptSendMessage(s)),this.internalSendMessage(s)}};return this.options.interceptCreatedEventMessageOptions&&(t=this.options.interceptCreatedEventMessageOptions(t)),t}sendEvent(e){return this.createEvent(e).send()}onMessage(e){let s;try{s="string"==typeof e?JSON.parse(e):e}catch(e){return void this.onError(e)}try{let e=n(s);this.options.interceptReceivedMessage&&(e=this.options.interceptReceivedMessage(e)),this.handleIncomingMessage(e)}catch(e){if(this.onError(e),this.options.logger&&this.options.logParseIncomingMessageError){const t=this.options.logParseIncomingMessageErrorFormat?.(s)??[e];this.options.logger(t)}}}internalSendMessage(e){if(this.options.keepHistoryForSendingMessages&&this.history.push(e),this.options.logger&&this.options.logSendingMessage){let s=!0;if(this.options.logSendingMessageFilter&&(s=!!e.name.match(this.options.logSendingMessageFilter)),s){const s=this.options.logSendingMessageFormat?.(e)??[e];this.options.logger(...s)}}this.options.onSend?.(e),this.sendNetworkMessage(e)}handleIncomingMessage(e){if(this.options.keepHistoryForReceivedMessages&&this.history.push(e),this.options.logger&&this.options.logMessageReceived){let s=!0;if(this.options.logMessageReceivedFilter&&(s=!!e.name.match(this.options.logMessageReceivedFilter)),s){const s=this.options.logMessageReceivedFormat?.(e)??[e];this.options.logger(...s)}}this.options.onMessage?.(e);let s=e.type!==t.Error;if(e.type===t.Event)return void this.receiveEventMessage(e);const r=this.trackedRequestMap[e.trackId];r&&(e.type===t.Error?(r.errorTrack(e),s=!0):r.successTrack(e),delete this.trackedRequestMap[e.trackId]),s||this.onError?.(e)}receiveEventMessage(e){this.subscribedEventListMap[e.name]&&this.subscribedEventListMap[e.name].forEach(s=>s(e.payload,e))}}class l extends d{constructor(...e){super(...e),this.connection=void 0}connect(s={}){if(this.connection=(new e).withUrl(this.wsUri,s).withAutomaticReconnect().build(),!this.connection)throw new Error("Failed to create SignalR connection");return this.connection.on("ReceiveMessage",e=>{this.onMessage(e)}),this.connection.onclose(e=>{this.onClose(e)}),this.connection.start().then(()=>{this.onConnect()}).catch(e=>{this.onError(e)})}close(){this.connection?.stop(),this.onClose()}sendNetworkMessage(e){const s=JSON.stringify(e);this.connection?.invoke("SendMessage",s).catch(e=>(this.onError(e),console.error(e.toString())))}}class h extends d{constructor(...e){super(...e),this.socket=void 0,this.connectedCallback=void 0}connect(){return this.socket=new WebSocket(this.wsUri),this.socket.addEventListener("message",e=>{this.onMessage(e.data)}),this.socket.addEventListener("close",e=>{this.onClose(e.reason,e)}),this.socket.addEventListener("error",e=>{this.onError(e,e)}),new Promise((e,s)=>{this.socket?.addEventListener("open",s=>{this.onConnect(),e()})})}close(){this.socket?.close(),this.onClose()}sendNetworkMessage(e){const s=JSON.stringify(e);this.socket?.send(s)}}class u extends d{constructor(...e){super(...e),this.server=void 0}setServer(e){this.server=e}connect(){if(!this.server)throw new Error("No server set");return this.server?.connect(e=>{const s=JSON.parse(JSON.stringify(e));this.onMessage(s),this.onConnect()}),Promise.resolve()}close(){this.onClose()}sendNetworkMessage(e){const s=JSON.parse(JSON.stringify(e));setTimeout(()=>{this.server?.onMessage(s)},10)}}class g{constructor(){this.store={},this.commands={},this.queries={},this.eventListeners={},this.sendMessage=void 0}saveToLocalStorage(e){localStorage.setItem(e,JSON.stringify(this.store))}loadFromLocalStorage(e){const s=localStorage.getItem(e);s&&(this.store=JSON.parse(s))}connect(e){this.sendMessage=e}sendError(e,s,n,i){const a=o({trackId:s,type:t.Error,name:"Error",payload:e,direction:r.ToClient,cancelled:n,timedOut:i});this.sendMessage?.(a)}createMessage(e){return o({...e,direction:r.ToClient})}sendResponse(e){const s=this.createMessage(e);this.sendMessage?.(s)}sendEvent(e,s){const n=o({type:t.Event,name:e,payload:s,direction:r.ToClient});this.sendMessage?.(n)}onMessage(e){if("string"==typeof e)try{e=JSON.parse(e)}catch(s){return this.sendError({message:`Error parsing message: ${s}`,request:e,error:s,stack:s?.stack}),void console.error("Error parsing message",s)}if("Command"===e.type){if(!this.commands[e.name])return void this.sendError({message:`Command ${e.name} not found (Register it with addCommand)`,request:e},e.trackId);this.serverHandleCommand(e)}if("Query"===e.type){if(!this.queries[e.name])return void this.sendError({message:`Query ${e.name} not found (Register it with addQuery)`,request:e},e.trackId);this.serverHandleQuery(e)}if("Event"===e.type){if(!this.eventListeners[e.name])return void this.sendError({message:`Event ${e.name} not found (Register it with addEvent)`,request:e},e.trackId);this.serverHandleEvent(e)}}serverHandleCommand(e){const s=this.commands[e.name],r=e=>{this.sendMessage?.(e)},n=s=>this.createMessage({name:e.name,type:t.CommandResponse,payload:s,trackId:e.trackId}),o=e=>{const s=n(e);r(s)},i=(s,t,r)=>{this.sendError({message:s,request:e},e.trackId,t,r)},a=(e,s)=>{this.sendEvent(e,s)};try{s({requestMessage:e,request:e.payload,store:this.store,error:i,event:a,response:o,createResponseMessage:n,sendResponseMessage:r})}catch(s){i({message:`Error in command handler for '${e.name}'`,requestMessage:e,error:s,stack:s?.stack})}}serverHandleQuery(e){const s=e=>{this.sendMessage?.(e)},r=s=>this.createMessage({name:e.name,type:t.QueryResponse,payload:s,trackId:e.trackId});(0,this.queries[e.name])({requestMessage:e,request:e.payload,store:this.store,error:(s,t,r)=>{this.sendError({message:s,request:e},e.trackId,t,r)},event:(e,s)=>{this.sendEvent(e,s)},response:e=>{const t=r(e);s(t)},createResponseMessage:r,sendResponseMessage:s})}serverHandleEvent(e){(0,this.eventListeners[e.name])({requestMessage:e,request:e.payload,store:this.store,error:s=>{this.sendError({message:s,request:e},e.trackId)},event:(e,s)=>{this.sendEvent(e,s)}})}addCommand(e,s){this.commands[e]=s}addQuery(e,s){this.queries[e]=s}addEventListener(e,s){this.eventListeners[e]=s}}export{u as ClientSideMessageBridgeService,g as InMemoryClientSideServer,d as MessageBridgeServiceBase,r as MessageDirection,t as MessageType,l as SignalRMessageBridgeService,h as WebsocketMessageBridgeService,i as createCommandMessage,c as createEventMessage,o as createMessage,n as createMessageFromDto,a as createQueryMessage};
//# sourceMappingURL=index.module.js.map

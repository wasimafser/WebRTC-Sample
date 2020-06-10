// 'use strict';
//
// var isChannelReady = false;
// var isInitiator = false;
// var isStarted = false;
// var localStream;
// var pc;
// var remoteStream;
// var turnReady;
//
// var pcConfig = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };
//
// // Set up audio and video regardless of what devices are present.
// var sdpConstraints = {
//   offerToReceiveAudio: true,
//   offerToReceiveVideo: true
// };
//
// /////////////////////////////////////////////
//
// const room = JSON.parse(document.getElementById('room').textContent);
// // Could prompt for room name:
// // room = prompt('Enter room name:');
//
// const socket = new WebSocket('ws://'+window.location.host+'/ws/video/'+room+'/')
//
// socket.onclose = function(e) {
//     console.error('Chat socket closed unexpectedly');
// };
//
// // if (room !== '') {
// //   socket.emit('create or join', room);
// //   console.log('Attempted to create or  join room', room);
// // }
// //
// // socket.oncreated = function(room) {
// //   console.log('Created room ' + room);
// //   isInitiator = true;
// // };
// //
// // socket.on('full', function(room) {
// //   console.log('Room ' + room + ' is full');
// // });
// //
// // socket.on('join', function (room){
// //   console.log('Another peer made a request to join room ' + room);
// //   console.log('This peer is the initiator of room ' + room + '!');
// //   isChannelReady = true;
// // });
// //
// // socket.on('joined', function(room) {
// //   console.log('joined: ' + room);
// //   isChannelReady = true;
// // });
// //
// // socket.on('log', function(array) {
// //   console.log.apply(console, array);
// // });
//
// ////////////////////////////////////////////////
//
// function sendMessage(message) {
//   console.log('Client sending message: ', message);
//   socket.send(JSON.stringify({
//     'message': message
//   }));
// }
//
// // This client receives a message
// socket.onmessage = function(e) {
//   const data = JSON.parse(e.data);
//   console.log(data);
//   if (data.join == 0) {
//     isInitiator = true;
//     isChannelReady = true;
//   } else if (data.join == 1) {
//     isChannelReady = true;
//   } else if (data.message) {
//     const message = data.message;
//     console.log('Client received message:', message);
//     if (message === 'got user media') {
//       maybeStart();
//     } else if (message.type === 'offer') {
//       if (!isInitiator && !isStarted) {
//         maybeStart();
//       }
//       pc.setRemoteDescription(new RTCSessionDescription(message));
//       doAnswer();
//     } else if (message.type === 'answer' && isStarted) {
//       pc.setRemoteDescription(new RTCSessionDescription(message));
//     } else if (message.type === 'candidate' && isStarted) {
//       var candidate = new RTCIceCandidate({
//         sdpMLineIndex: message.label,
//         candidate: message.candidate
//       });
//       pc.addIceCandidate(candidate);
//     } else if (message === 'bye' && isStarted) {
//       handleRemoteHangup();
//     }
//   }
// };
//
// ////////////////////////////////////////////////////
//
// var localVideo = document.querySelector('#localVideo');
// var remoteVideo = document.querySelector('#remoteVideo');
//
// navigator.mediaDevices.getUserMedia({
//   audio: false,
//   video: true
// })
// .then(gotStream)
// .catch(function(e) {
//   alert('getUserMedia() error: ' + e.name);
// });
//
// function gotStream(stream) {
//   console.log('Adding local stream.');
//   localStream = stream;
//   localVideo.srcObject = stream;
//   sendMessage('got user media');
//   if (isInitiator) {
//     maybeStart();
//   }
// }
//
// var constraints = {
//   video: true
// };
//
// console.log('Getting user media with constraints', constraints);
//
// if (location.hostname !== 'localhost') {
//   requestTurn(
//     'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
//   );
// }
//
// function maybeStart() {
//   console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
//   if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
//     console.log('>>>>>> creating peer connection');
//     createPeerConnection();
//     pc.addStream(localStream);
//     isStarted = true;
//     console.log('isInitiator', isInitiator);
//     if (isInitiator) {
//       doCall();
//     }
//   } else {
//     console.log("Didn't Start Connection");
//   }
// }
//
// window.onbeforeunload = function() {
//   sendMessage('bye');
// };
//
// /////////////////////////////////////////////////////////
//
// function createPeerConnection() {
//   try {
//     pc = new RTCPeerConnection(null);
//     pc.onicecandidate = handleIceCandidate;
//     pc.onaddstream = handleRemoteStreamAdded;
//     pc.onremovestream = handleRemoteStreamRemoved;
//     console.log('Created RTCPeerConnnection');
//   } catch (e) {
//     console.log('Failed to create PeerConnection, exception: ' + e.message);
//     alert('Cannot create RTCPeerConnection object.');
//     return;
//   }
// }
//
// function handleIceCandidate(event) {
//   console.log('icecandidate event: ', event);
//   if (event.candidate) {
//     sendMessage({
//       type: 'candidate',
//       label: event.candidate.sdpMLineIndex,
//       id: event.candidate.sdpMid,
//       candidate: event.candidate.candidate
//     });
//   } else {
//     console.log('End of candidates.');
//   }
// }
//
// function handleCreateOfferError(event) {
//   console.log('createOffer() error: ', event);
// }
//
// function doCall() {
//   console.log('Sending offer to peer');
//   pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
// }
//
// function doAnswer() {
//   console.log('Sending answer to peer.');
//   pc.createAnswer().then(
//     setLocalAndSendMessage,
//     onCreateSessionDescriptionError
//   );
// }
//
// function setLocalAndSendMessage(sessionDescription) {
//   pc.setLocalDescription(sessionDescription);
//   console.log('setLocalAndSendMessage sending message', sessionDescription);
//   sendMessage(sessionDescription);
// }
//
// function onCreateSessionDescriptionError(error) {
//   trace('Failed to create session description: ' + error.toString());
// }
//
// function requestTurn(turnURL) {
//   var turnExists = false;
//   for (var i in pcConfig.iceServers) {
//     if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
//       turnExists = true;
//       turnReady = true;
//       break;
//     }
//   }
//   if (!turnExists) {
//     console.log('Getting TURN server from ', turnURL);
//     // No TURN server. Get one from computeengineondemand.appspot.com:
//     var xhr = new XMLHttpRequest();
//     xhr.onreadystatechange = function() {
//       if (xhr.readyState === 4 && xhr.status === 200) {
//         var turnServer = JSON.parse(xhr.responseText);
//         console.log('Got TURN server: ', turnServer);
//         pcConfig.iceServers.push({
//           'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
//           'credential': turnServer.password
//         });
//         turnReady = true;
//       }
//     };
//     xhr.open('GET', turnURL, true);
//     xhr.send();
//   }
// }
//
// function handleRemoteStreamAdded(event) {
//   console.log('Remote stream added.');
//   remoteStream = event.stream;
//   remoteVideo.srcObject = remoteStream;
// }
//
// function handleRemoteStreamRemoved(event) {
//   console.log('Remote stream removed. Event: ', event);
// }
//
// function hangup() {
//   console.log('Hanging up.');
//   stop();
//   sendMessage('bye');
// }
//
// function handleRemoteHangup() {
//   console.log('Session terminated.');
//   stop();
//   isInitiator = false;
// }
//
// function stop() {
//   isStarted = false;
//   pc.close();
//   pc = null;
// }

// var channel_name;
//
// // Config variables: change them to point to your own servers
// const SIGNALING_SERVER_URL = 'http://localhost:9999';
// const TURN_SERVER_URL = 'localhost:3478';
// const TURN_SERVER_USERNAME = 'username';
// const TURN_SERVER_CREDENTIAL = 'credential';
// // WebRTC config: you don't have to change this for the example to work
// // If you are testing on localhost, you can just use PC_CONFIG = {}
// const PC_CONFIG = {
//   iceServers: [
//     {
//       urls: 'turn:' + TURN_SERVER_URL + '?transport=tcp',
//       username: TURN_SERVER_USERNAME,
//       credential: TURN_SERVER_CREDENTIAL
//     },
//     {
//       urls: 'turn:' + TURN_SERVER_URL + '?transport=udp',
//       username: TURN_SERVER_USERNAME,
//       credential: TURN_SERVER_CREDENTIAL
//     }
//   ]
// };
//
// // Signaling methods
// // let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });
// const room = JSON.parse(document.getElementById('room').textContent);
// // // Could prompt for room name:
// // // room = prompt('Enter room name:');
// //
// const socket = new WebSocket('ws://'+window.location.host+'/ws/video/'+room+'/')
//
// // Helpful debugging
// socket.onopen = function () {
//     console.log("Connected to chat socket");
// };
// socket.onclose = function () {
//     console.log("Disconnected from chat socket");
// }
//
// socket.onmessage = function(e) {
//   const data = JSON.parse(e.data);
//   // console.log(data);
//   if (data.message) {
//     const message = data.message;
//     if (message === 'ready') {
//       channel_name = data.channel;
//       createPeerConnection();
//       sendOffer();
//     } else {
//       handleSignalingData(message, data.channel);
//     }
//   }
// }
//
// // function ready(){
// //   createPeerConnection();
// //   sendOffer();
// // }
//
// // socket.on('data', (data) => {
// //   console.log('Data received: ',data);
// //   handleSignalingData(data);
// // });
// //
// // socket.on('ready', () => {
// //   console.log('Ready');
// //   // Connection with signaling server is ready, and so is local stream
// //   createPeerConnection();
// //   sendOffer();
// // });
//
// function sendData(data) {
//   // console.log('Client sending data: ', data);
//   socket.send(JSON.stringify({
//     'message': data
//   }));
// }
//
//
// // let sendData = (data) => {
// //   socket.emit('data', data);
// // };
//
// // WebRTC methods
// let pc;
// let localStream;
// let remoteStreamElement = document.querySelector('#remoteVideo');
// var localVideo = document.querySelector('#localVideo');
// // var remoteVideo = document.querySelector('#remoteVideo');
//
// let getLocalStream = () => {
//   navigator.mediaDevices.getUserMedia({ audio: true, video: true })
//     .then((stream) => {
//       console.log('Stream found');
//       localStream = stream;
//       localVideo.srcObject = localStream;
//       // Connect after making sure that local stream is availble
//       sendData('ready');
//     })
//     .catch(error => {
//       console.error('Stream not found: ', error);
//     });
// }
//
// let createPeerConnection = () => {
//   try {
//     // pc = new RTCPeerConnection(PC_CONFIG);
//     pc = new RTCPeerConnection(null);
//     pc.onicecandidate = onIceCandidate;
//     pc.onaddstream = onAddStream;
//     pc.addStream(localStream);
//     console.log('PeerConnection created');
//   } catch (error) {
//     console.error('PeerConnection failed: ', error);
//   }
// };
//
// let sendOffer = () => {
//   console.log('Send offer');
//   pc.createOffer().then(
//     setAndSendLocalDescription,
//     (error) => { console.error('Send offer failed: ', error); }
//   );
// };
//
// let sendAnswer = () => {
//   console.log('Send answer');
//   pc.createAnswer().then(
//     setAndSendLocalDescription,
//     (error) => { console.error('Send answer failed: ', error); }
//   );
// };
//
// let setAndSendLocalDescription = (sessionDescription) => {
//   pc.setLocalDescription(sessionDescription);
//   console.log('Local description set');
//   sendData(sessionDescription);
// };
//
// let onIceCandidate = (event) => {
//   if (event.candidate) {
//     console.log('ICE candidate');
//     sendData({
//       type: 'candidate',
//       candidate: event.candidate
//     });
//   }
// };
//
// let onAddStream = (event) => {
//   console.log('Add stream');
//   remoteStreamElement.srcObject = event.stream;
// };
//
// let handleSignalingData = (data, channel) => {
//   switch (data.type) {
//     case 'offer':
//       createPeerConnection();
//       pc.setRemoteDescription(new RTCSessionDescription(data));
//       sendAnswer();
//       break;
//     case 'answer':
//       // if (channel !== channel_name) {
//       //   pc.setRemoteDescription(new RTCSessionDescription(data));
//       // }
//       if (pc.signalingState !== "stable") {
//         pc.setRemoteDescription(new RTCSessionDescription(data));
//       }
//       // pc.setRemoteDescription(new RTCSessionDescription(data));
//       break;
//     case 'candidate':
//       // if (channel !== channel_name) {
//       //   pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//       // }
//       data.candidate.usernameFragment = null;
//       pc.addIceCandidate(new RTCIceCandidate(data.candidate));
//       break;
//   }
// };
//
// // Start connection
// getLocalStream();

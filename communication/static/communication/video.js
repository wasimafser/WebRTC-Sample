const room = JSON.parse(document.getElementById('room').textContent);

const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')

var localStream;
var remoteStream;

var peerConnection;

var peerConnectionConfig = {
    'iceServers': [
      {'urls': 'stun:stun.services.mozilla.com'},
      {'urls': 'stun:stun.l.google.com:19302'}
    ]
};

var streamConfig = {
  audio: true,
  video: true
};

if (location.hostname !== 'localhost') {
  // requestTurn(
  //   'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  // );
}

var turnReady = false;

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in peerConnectionConfig.iceServers) {
    if (peerConnectionConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        peerConnectionConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
  console.log(peerConnectionConfig);
}

// SOCKET
var ws = 'ws://';
if(window.location.protocol=="https:"){ ws = 'wss://'; }
const socket = new WebSocket(ws+window.location.host+'/ws/video/'+room+'/');

socket.onmessage = async (e) => {
  console.log("RECIEVED FROM SERVER : ", e);
  var data = JSON.parse(e.data);
  // console.log("DATA FROM SERVER : ", data);
  if (!data.message) {
    return;
  }
  if (data.message === 'joined') {
    // console.log("JOINED");
    createPeerConnection();
    // sendOffer();
  } else {
    if (data.message.type){
      var type = data.message.type;
      if (type === 'offer') {
        await peerConnection.setRemoteDescription(data.message);
        const stream = await navigator.mediaDevices.getUserMedia(streamConfig);
          // .then((stream) => {
          //   peerConnection.addStream(stream);
          //   peerConnection.setLocalDescription(
          //     peerConnection.createAnswer()
          //   );
          // });
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream)
        });

        await peerConnection.setLocalDescription(
          await peerConnection.createAnswer()
        );

        send_message(peerConnection.localDescription);
      } else if (type === 'answer') {
        peerConnection.setRemoteDescription(data.message);
      }
    } else if (data.message.candidate) {
      peerConnection.addIceCandidate(data.message);
    }
  }
}

function send_message(data){
  socket.send(JSON.stringify({
    'message': data
  }));
}

// Get local stream and set it to localVideo
navigator.mediaDevices.getUserMedia(streamConfig)
  .then((stream) => {
    console.log('Local Stream Found');
    localStream = stream;
    localVideo.srcObject = localStream;

    // JOIN THE ROOM
    send_message('join');
  });

// CONNECTION FUNCTIONS

function createPeerConnection() {
  try {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = onIceCandidate;
    peerConnection.onnegotiationneeded = onNegotiationNeeded;
    peerConnection.ontrack = gotRemoteStream;
    peerConnection.addStream(localStream);
  } catch (e) {
    console.log("PeerConnection Error : ", e);
  } finally {

  }
}

function onIceCandidate(event) {
  // console.log("IceCandidate : ", event);
  if (event.candidate) {
    send_message(event.candidate);
  }
}

function gotRemoteStream(event) {
  console.log("RemoteSteam : ", event);
  remoteVideo.srcObject = event.streams[0];
}

async function onNegotiationNeeded(event) {
  // console.log("NegotiationNeeded : ", event);
  try {
    await peerConnection.setLocalDescription(
      await peerConnection.createOffer()
    );
    send_message(peerConnection.localDescription);
  } catch (e) {
    console.log("Negotiation Error : ", e);
  } finally {

  }
}

// OFFER AND ANSWER
// function sendOffer() {
//   peerConnection.createOffer().then(
//
//   )
// }

// OTHER IN-VIDEO FUNCTIONS
var toggle_icon = function(icon_id){
  mute_audio_icon = document.getElementById(icon_id);
  if (mute_audio_icon.classList.contains('on')) {
    mute_audio_icon.classList.remove('on');
  }else {
    mute_audio_icon.classList.add('on');
  }
}

function toggle_audio(){
  var audioTracks = localStream.getAudioTracks();
  if (audioTracks.length === 0) {
    return;
  }

  audioTracks.forEach((track, i) => {
    track.enabled = !track.enabled;
  });

  console.log("Audio : ", audioTracks[0].enabled);
  toggle_icon('mute-audio');
}

function toggle_video(){
  var videoTracks = localStream.getVideoTracks();
  if (videoTracks.length === 0) {
    return;
  }

  videoTracks.forEach((track, i) => {
    track.enabled = !track.enabled;
  });

  console.log("Video : ", videoTracks[0].enabled);
  toggle_icon('mute-video');
}

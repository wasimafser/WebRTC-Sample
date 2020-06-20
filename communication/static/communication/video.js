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

var recorder;

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
socket.binaryType = 'arraybuffer';

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
  } else if (data.message === 'rejected') {
    alert("NO ROOM ALLOCATED");
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

    // Recording
    // var record_options = {mimeType: 'video/webm'}
    // recorder = new MediaRecorder(stream, record_options);
    // recorder.ondataavailable = sendRecordingToServer;
    // recorder.start();
    recorder = RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/webm',
      recorderType: MediaStreamRecorder,
      ondataavailable: sendRecordingToServer,

    });
    recorder.startRecording();

    // JOIN THE ROOM
    send_message('join');
  });

// Send Recoding to server

async function sendRecordingToServer(blob) {
  // var reader = new FileReader();
  // reader.readAsArrayBuffer(event.data);
  // reader.onloadend = async function (event) {
  //   console.log(reader.result);
  //   await socket.send(JSON.stringify({
  //     'type': 'video',
  //     'message': reader.result
  //   }));
  // }
  await socket.send(JSON.stringify({
    'type': 'video',
    'message': blob
  }));
}

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
  recorder.getInternalRecorder().addStreams([event.streams[0]]);
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

function toggle_recording(){
  if (recorder !== null) {
    // recorder.stop();
    recorder.stopRecording(function(){
      let blob = recorder.getBlob();
      upload(blob);
      invokeSaveAsDialog(blob);
      recorder = null;
    });
    // recorder = null;
  }
  else {
    // var record_options = {mimeType: 'video/webm'}
    // recorder = new MediaRecorder(localStream, record_options);
    // recorder.ondataavailable = sendRecordingToServer;
    // recorder.start();
    recorder = RecordRTC(stream, {
      type: 'video',
      mimeType: 'video/webm',
      recorderType: MediaStreamRecorder,
      ondataavailable: sendRecordingToServer,

    });
    recorder.startRecording();
  }

  toggle_icon('recording');
}

function upload(blob) {
    var formData = new FormData();
    formData.append("blob", blob);
    // var xhr = new XMLHttpRequest();
    // xhr.open('POST', "http://127.0.0.1:8000/communication/api/recording/", true);
    // xhr.setRequestHeader("X-CSRFToken", "{{ csrf_token }}");
    // // xhr.setRequestHeader("PromptID", String(promptID).split("_")[0]);
    // // xhr.setRequestHeader("length", recordingTime);
    //
    // xhr.onreadystatechange = function () {
    //     if (xhr.readyState == 4 && xhr.status == 200) {
    //             writeMessages($.parseJSON(xhr.response));
    //     } else if (xhr.readyState == 4 && xhr.status == 400 || xhr.readyState == 4 && xhr.status == 500) {
    //         alert("Error while Uploading - The admins have been notified. Please try again later")
    //     }
    // };
    // xhr.send(formData);
    $.ajax({
        type: 'POST',
        url: "{% url 'recording_api' %}",
        data: formData,
        processData: false,
        contentType: false
    }).done(function(data) {
           console.log(data);
    });
}

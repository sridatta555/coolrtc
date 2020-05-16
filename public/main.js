let Peer = require('simple-peer');
let socket = io();
const video = document.querySelector('video');

let client = {}

//get permission 
navigator.mediaDevices.getUserMedia({video: true, audio: true})
.then(stream=>{
    socket.emit("New Client");
    video.srcObject = stream;
    video.play();

    function initPeer(type){
        let peer  = new Peer({initiator: (type==='init') ? true : false, stream: stream, trickle: false});
        peer.on("stream", function(stream){
            CreateVideo(stream);
        })

        peer.on("close", function(){
            document.getElementById("peerVideo").remove();
            peer.destroy();
        })
        return peer;

    }

    function makePeer(){
        client.gotAnswer = false;
        let peer = initPeer('init');
        peer.on("signal", function(data){
            if(!client.gotAnswer){
                socket.emit("Offer", data);
            }
        })

        client.peer = peer;
    }

    function frontAnswer(offer){
        let peer = initPeer('notInit')
        peer.on('signal', (data)=>{
            socket.emit("Answer", data)
        })

        peer.signal(offer);
    }

    function signalAnswer(answer){
        client.gotAnswer = true
        let peer = client.peer
        peer.signal(answer)
    }

    function createVideo(stream){
        let video = document.createElement('video');
        video.id  = 'peerVideo';
        video.srcObject = stream;
        video.setAttribute('class', 'embed-responsive-item')
        document.querySelector('#peerDiv').appendChild(video);
        video.play()
    }

    function sessionActive(){
        document.write('session active please come back later')
    }

    socket.on('BackOffer', frontAnswer)
    socket.on('BackAnswer', signalAnswer)
    socket.on('SessionActive', sessionActive)
    socket.on('CreatePeer', makePeer)
})
.catch(err=> document.write(err))
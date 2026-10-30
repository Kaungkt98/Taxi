import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAD7qLzeAKPf71RJcfWYflu90fR1jxpxk8",
    authDomain: "taxi-9ad55.firebaseapp.com",
    databaseURL: "https://taxi-9ad55-default-rtdb.firebaseio.com",
    projectId: "taxi-9ad55",
    storageBucket: "taxi-9ad55.firebasestorage.app",
    messagingSenderId: "502952606146",
    appId: "1:502952606146:web:ef072563975176ccf17e5b",
    measurementId: "G-77PC8VR2RY"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let localStream;
let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

const statusEl = document.getElementById('status');

// Request ကို စောင့်ဆိုင်းနေခြင်း
onValue(ref(db, 'taxi/request'), async (snapshot) => {
    const req = snapshot.val();
    if (!req) return;

    // TaxiViewer ဘက်က Stop ခလုတ်နှိပ်လိုက်လျှင်
    if (req.type === 'stop') {
        stopLocalMedia();
        statusEl.innerText = "Stream stopped by viewer.";
        return;
    }

    statusEl.innerText = `Request received: ${req.type}`;

    if (req.type === 'location') {
        sendLocation();
    } else {
        await startMedia(req.type);
        await createOffer();
    }
});

// Camera / Mic များကို အပြည့်အစုံ ပြန်ပိတ်ပေးမည့် function
function stopLocalMedia() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
        localVideo.srcObject = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
}

function sendLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            set(ref(db, 'taxi/location'), { lat: lat, lng: lng });
            statusEl.innerText = "Location sent successfully!";
        }, (error) => {
            statusEl.innerText = "Location error: " + error.message;
        });
    } else {
        statusEl.innerText = "Geolocation is not supported by this browser.";
    }
}

async function startMedia(type) {
    try {
        stopLocalMedia();

        if (type === 'mic') {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } else if (type === 'screen') {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } else {
                statusEl.innerText = "Screen sharing is not supported on this mobile browser.";
                return;
            }
        } else if (type === 'front-cam' || type === 'back-cam') {
            const facingMode = (type === 'front-cam') ? 'user' : 'environment';
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode }, 
                audio: true 
            });
        }
        
        document.getElementById('localVideo').srcObject = localStream;
    } catch (err) {
        statusEl.innerText = "Media Error: " + err.message;
        console.error(err);
    }
}

async function createOffer() {
    peerConnection = new RTCPeerConnection(configuration);

    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    peerConnection.onicecandidate = (e) => {
        if (e.candidate) set(ref(db, 'taxi/driverCandidate'), e.candidate.toJSON());
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    set(ref(db, 'taxi/offer'), offer);

    onValue(ref(db, 'taxi/answer'), async (snapshot) => {
        const answer = snapshot.val();
        if (answer && peerConnection && !peerConnection.currentRemoteDescription) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    onValue(ref(db, 'taxi/viewerCandidate'), (snapshot) => {
        const candidate = snapshot.val();
        if (candidate && peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });
}

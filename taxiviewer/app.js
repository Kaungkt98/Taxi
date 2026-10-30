import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// သင့်ရဲ့ Firebase Config ကို ဒီမှာ ထည့်ပါ
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

let peerConnection;
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ခလုတ်နှိပ်တဲ့အခါ Webtaxi ဆီသို့ Request ပို့ရန်
window.sendReq = function(type) {
    document.getElementById('locationInfo').classList.add('hidden');
    document.getElementById('viewStatus').innerText = `တောင်းဆိုနေသည်: ${type} ...`;
    
    set(ref(db, 'taxi/request'), { type: type, time: Date.now() });

    if (type === 'location') {
        onValue(ref(db, 'taxi/location'), (snapshot) => {
            const loc = snapshot.val();
            if (loc) {
                const locEl = document.getElementById('locationInfo');
                locEl.classList.remove('hidden');
                document.getElementById('viewStatus').innerText = "Location ရရှိပြီးပါပြီ။";
                locEl.innerHTML = `Lat: ${loc.lat}, Lng: ${loc.lng} <br><a href="https://maps.google.com/?q=${loc.lat},${loc.lng}" target="_blank" class="text-blue-400 underline">Google Maps မှာကြည့်ရန်</a>`;
            }
        });
    } else {
        listenForOffer();
    }
};

function listenForOffer() {
    onValue(ref(db, 'taxi/offer'), async (snapshot) => {
        const offer = snapshot.val();
        if (!offer) return;

        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.ontrack = (event) => {
            document.getElementById('remoteVideo').srcObject = event.streams[0];
        };

        peerConnection.onicecandidate = (e) => {
            if (e.candidate) set(ref(db, 'taxi/viewerCandidate'), e.candidate.toJSON());
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        set(ref(db, 'taxi/answer'), answer);
    });

    onValue(ref(db, 'taxi/driverCandidate'), (snapshot) => {
        const candidate = snapshot.val();
        if (candidate && peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// သင်ယူလာတဲ့ Firebase Config ကို ဒီနေရာမှာ ထည့်ပါ
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

console.log("Firebase Connected Successfully!");
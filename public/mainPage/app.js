// Firebaseの設定を初期化
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js';

const firebaseConfig = {
    apiKey: "AIzaSyAdCIMrxlj-C0h1fAC8jZ3dtkpBlIZpTvc",
    authDomain: "test-b1eea.firebaseapp.com",
    databaseURL: "https://test-b1eea-default-rtdb.firebaseio.com",
    projectId: "test-b1eea",
    storageBucket: "test-b1eea.appspot.com",
    messagingSenderId: "32628222705",
    appId: "1:32628222705:web:6784cadb557a1f8d301750",
    measurementId: "G-DFPZ7PDY47"
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const email = e.target.email.value;
    const message = e.target.message.value;

    try {
        await addDoc(collection(db, 'contacts'), {
            name: name,
            email: email,
            message: message,
            timestamp: serverTimestamp()
        });

        const sendMail = httpsCallable(functions, 'sendMail');
        await sendMail({ name, email, message });

        alert('メッセージが送信されました。');
    } catch (error) {
        console.error("Error sending message: ", error);
        alert('メッセージの送信に失敗しました。');
    }
});

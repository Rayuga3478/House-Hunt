document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value;
    let userType = document.getElementById("userType").value;

    if (!userType) {
        alert("Please select whether you are a Tenant or an Owner.");
        return;
    }

    alert(
        "Login Successful!\nType: " + userType.charAt(0).toUpperCase() + userType.slice(1)
    );

    // Redirect based on user type
    if (userType === "owner") {
        window.location.href = "owner-dashboard.html";
    } else {
        window.location.href = "tenant-dashboard.html";
    }
});

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// -------------------------
// Firebase Config (YOUR DATA)
// -------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBrlsOxbezP7wfC9t3Bm1Ie9sw_ppv1g5c",
    authDomain: "househunt-bb69f.firebaseapp.com",
    projectId: "househunt-bb69f",
    storageBucket: "househunt-bb69f.firebasestorage.app",
    messagingSenderId: "693298899832",
    appId: "1:693298899832:web:906b18aad5b092dea7b68d"
};

// Initialize Firebase + Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// -------------------------
// EMAIL + PASSWORD LOGIN
// -------------------------
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const userType = document.getElementById("userType").value;

    if (!userType) {
        alert("Please select whether you are a Tenant or an Owner.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("Login successful!");

            if (userType === "tenant") {
                window.location.href = "search.html";
            } else {
                window.location.href = "addProperty.html";
            }
        })
        .catch(error => {
            alert(error.message);
        });
});


// -------------------------
// GOOGLE LOGIN
// -------------------------
document.getElementById("googleLogin").addEventListener("click", function () {

    const userType = document.getElementById("userType").value;

    if (!userType) {
        alert("Please select whether you are a Tenant or an Owner.");
        return;
    }

    signInWithPopup(auth, provider)
        .then(() => {
            alert("Google Login successful!");

            if (userType === "tenant") {
                window.location.href = "search.html";
            } else {
                window.location.href = "addProperty.html";
            }
        })
        .catch(error => {
            alert(error.message);
        });
});

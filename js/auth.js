import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.textContent = '';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Authenticating...';

            try {
                // Try to sign in
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'student-home.html';
            } catch (error) {
                // If user not found, try to register
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    try {
                        await createUserWithEmailAndPassword(auth, email, password);
                        window.location.href = 'student-home.html';
                    } catch (regError) {
                        errorMsg.textContent = regError.message;
                        btn.disabled = false;
                        btn.textContent = 'Sign In / Register';
                    }
                } else {
                    errorMsg.textContent = error.message;
                    btn.disabled = false;
                    btn.textContent = 'Sign In / Register';
                }
            }
        });
    }
});

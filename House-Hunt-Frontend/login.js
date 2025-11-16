// Updated login.js - Integrated with Backend
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.login-btn');
    const originalText = submitBtn.textContent;
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const userType = document.getElementById("userType").value;

    if (!userType) {
        alert("Please select whether you are a Tenant or an Owner.");
        return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        // Call backend API
        const response = await ApiService.login({
            email: email,
            password: password
        });

        console.log('Login successful:', response);

        // Check if returned user role matches selected user type
        const user = response.data.user;
        if (user.role !== userType) {
            alert(`This account is registered as ${user.role}, not ${userType}. Please select the correct user type.`);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        alert("Login Successful!");

        // Redirect based on user role
        if (user.role === "owner") {
            window.location.href = "addProperty.html";
        } else {
            window.location.href = "search.html";
        }
        
    } catch (error) {
        console.error('Login failed:', error);
        alert(error.message || 'Invalid email or password. Please try again.');
        
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Google Login Button
document.getElementById("googleLogin").addEventListener("click", function () {
    const userType = document.getElementById("userType").value;

    if (!userType) {
        alert("Please select whether you are a Tenant or an Owner before using Google login.");
        return;
    }

    // Note: Google OAuth integration would need to be set up on backend
    alert("Google login integration requires backend OAuth setup. Please use email/password login for now.");
});
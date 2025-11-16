// Updated signup.js - Integrated with Backend
document.getElementById("signupForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.signup-btn');
    const originalText = submitBtn.textContent;
    
    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Client-side validation
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        // Call backend API
        const response = await ApiService.signup({
            name: name,
            email: email,
            password: password,
            role: 'tenant' // Default role, can be changed based on user selection
        });

        alert("Account Created Successfully!");
        console.log('Signup successful:', response);

        // Redirect to login page
        window.location.href = "login.html";
        
    } catch (error) {
        console.error('Signup failed:', error);
        alert(error.message || 'Failed to create account. Please try again.');
        
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
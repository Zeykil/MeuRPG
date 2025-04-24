import AuthService from './auth.js'; // Import AuthService

document.addEventListener('DOMContentLoaded', () => {
    const userAvatarImg = document.getElementById('userAvatar');
    const userNameSpan = document.getElementById('userName');
    const logoutOptionDiv = document.getElementById('logoutOption');
    const logoutLink = document.getElementById('logoutLink');
    // Assuming you might have a placeholder for user title/status in the HTML
    // const userTitlePlaceholder = document.getElementById('userTitlePlaceholder');


    // Check if user is authenticated
    const currentUser = AuthService.getCurrentUser();

    if (!currentUser) {
        // If no user is logged in, redirect to login page
        window.location.href = 'login.html';
        return; // Stop execution
    }

    // Populate user profile details
    if (userAvatarImg) {
        // Use user's avatar if available, otherwise use a default
        userAvatarImg.src = currentUser.avatar || '/Inicial/Fotos/default-avatar.png';
    }

    if (userNameSpan) {
        userNameSpan.textContent = currentUser.username;
    }

    // if (userTitlePlaceholder && currentUser.title) { // Assuming user might have a title
    //     userTitlePlaceholder.textContent = currentUser.title;
    // }


    // Toggle logout option visibility on username click
    if (userNameSpan && logoutOptionDiv) {
        userNameSpan.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior if it's a link
            logoutOptionDiv.classList.toggle('visible');
        });

         // Optional: Hide logout option if user clicks outside of it
        document.addEventListener('click', (e) => {
            if (!userAvatarImg.contains(e.target) && !userNameSpan.contains(e.target) && !logoutOptionDiv.contains(e.target)) {
                 logoutOptionDiv.classList.remove('visible');
            }
        });
    }

    // Handle logout
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            AuthService.logout(); // Log the user out
            // AuthService.logout() already redirects to login.html internally based on the provided code
            // window.location.href = 'login.html'; // Redirect to login page after logout
        });
    }

    // Optional: Add other dashboard specific JS logic here
});
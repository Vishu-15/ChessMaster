document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('nav .menu');
    const closeBtn = document.querySelector('.close-btn');

    // Open Sidebar
    menuBtn.addEventListener('click', () => {
        sidebar.style.transform = 'translateX(0%)';
    });

    // Close Sidebar
    closeBtn.addEventListener('click', () => {
        sidebar.style.transform = 'translateX(-100%)';
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.style.transform = 'translateX(-100%)';
        }
    });
});

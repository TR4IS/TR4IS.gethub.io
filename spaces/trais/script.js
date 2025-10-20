/* ===========================================================
   💫 Trais worlD ! - JavaScript
   Handles the animated starfield and parallax scroll effects.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("starfield");
    const ctx = canvas.getContext("2d");

    // --- Resize canvas to full screen ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // --- Create star objects ---
    const stars = [];
    for (let i = 0; i < 500; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            alpha: Math.random(),
            velocity: {
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.2
            }
        });
    }

    // --- Animate stars moving gently ---
    function drawStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(224, 230, 240, ${star.alpha})`;
            ctx.fill();

            // Move star
            star.x += star.velocity.x;
            star.y += star.velocity.y;

            // Bounce off edges
            if (star.x < 0 || star.x > canvas.width) star.velocity.x *= -1;
            if (star.y < 0 || star.y > canvas.height) star.velocity.y *= -1;
        });
        requestAnimationFrame(drawStars);
    }
    drawStars();

    // --- Parallax effect for scroll ---
    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        document.querySelectorAll("[data-speed]").forEach(el => {
            const speed = parseFloat(el.getAttribute("data-speed"));
            const yPos = -scrollY * (speed - 1);
            el.style.transform = `translateY(${yPos}px)`;
        });
    });
});

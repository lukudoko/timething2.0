import React, { useRef, useEffect } from "react";

const WeatherCanvas = () => {
  const canvasRef = useRef(null);
  const cloudImages = ["https://pngimg.com/d/cloud_PNG8.png", "https://clipart.info/images/ccovers/1515003332cloud-png-smoke-transparent-background.png"]; // Add paths to your cloud images
  const clouds = [];
  const numClouds = 15; // Increase the number of clouds for better coverage

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Load cloud images
    const loadedImages = [];
    cloudImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      loadedImages.push(img);
    });

    // Create cloud objects once images are loaded
    loadedImages[0].onload = () => {
      for (let i = 0; i < numClouds; i++) {
        const image = loadedImages[Math.floor(Math.random() * loadedImages.length)];
        const size = Math.random() * 1000 + 200; // Larger clouds: range 200px to 500px
        clouds.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height, // Spread clouds over the full height
          size,
          speed: Math.random() * 0.3 + 0.05, // Slower speed: range 0.05 to 0.35
          image,
        });
      }
    };

    const drawClouds = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

      clouds.forEach((cloud) => {
        ctx.drawImage(cloud.image, cloud.x, cloud.y, cloud.size, cloud.size / 2);
        cloud.x += cloud.speed; // Move clouds to the right
        if (cloud.x > canvas.width) {
          cloud.x = -cloud.size; // Reset position when off-screen
        }
      });
    };

    const animate = () => {
      drawClouds();
      requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none"
    />
  );
};
export default WeatherCanvas;

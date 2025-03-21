"use client"
import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { cn } from "@/utils/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TextEffectPerChar } from "@/components/ui/textAnimation";
import { BorderTrail } from "@/components/core/border-trail";

import "./App.css";

const HomePage = () => {
  const [isTop, setIsTop] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Save the original overflow setting
    const originalOverflow = document.body.style.overflow;
    
    // Enable scrolling for this page
    document.body.style.overflow = 'auto';
    
    const handleScroll = () => {
      setIsTop(window.scrollY);
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Set visibility after a short delay for entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    // Cleanup function to restore original settings and remove event listeners
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen relative bg-black text-white overflow-hidden">
      {/* Enhanced Background with gradient */}
      <div className="fixed top-0 left-0 w-full h-screen bg-gradient-to-b from-blue-900 to-purple-900 opacity-30 -z-10"></div>
      
      {/* Interactive background elements that follow mouse */}
      <motion.div 
        className="fixed w-[500px] h-[500px] rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-20 blur-3xl -z-5"
        animate={{
          x: mousePosition.x - 250,
          y: mousePosition.y - 250,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 50,
          mass: 2
        }}
      />
      
      {/* Background gradient elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Add SVG filter definition */}
        <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
          <defs>
            <filter id="lf-balls">
              <feGaussianBlur in="turbulence" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="color-matrix"
              />
              <feBlend in="SourceGraphic" in2="color-matrix" mode="normal" />
            </filter>
          </defs>
        </svg>
        <div className="g1"></div>
        <div className="g2"></div>
        <div className="g3"></div>
        <div className="g4"></div>
        <div className="g5"></div>
        <div className="g6"></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white opacity-30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>
      
      {/* Cookie notice */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm shadow-md rounded-lg w-11/12 md:w-4/5 lg:w-2/3 xl:w-1/2 border border-gray-800">
        <p className="text-gray-300 text-sm md:text-base py-4 px-4 text-center">
          <img src="" className="inline w-5 mr-2" alt="cookie-icon" />
          We use cookies to provide a personalised experience for our users. Read more from our{' '}
          <a href="" className="text-purple-400 hover:underline">Cookie Policy.</a>
          <span 
            className="ml-2 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              const element = document.querySelector<HTMLElement>(".fixed.bottom-5");
              if (element) {
                element.style.display = 'none';
              }
            }}
          >
            Got it
          </span>
        </p>
      </div>
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 w-full md:w-2/3 text-left relative z-10">
        <AnimatePresence>
          {isVisible && (
            <motion.section 
              className="text-center py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1 
                className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, staggerChildren: 0.1 }}
              >
                Create anime using AI Assistance
              </motion.h1>
              <motion.p 
                className="text-xl mb-8 max-w-2xl mx-auto text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                An AI-Powered animation platform specifically designed for anime. Making it possible for small teams/studios to create high-quality original anime, (e.g., Black characters) easier, cheaper, and faster.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <Link 
                  to="/flows" 
                  className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Create for Free
                </Link>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.section 
          className="mb-20 w-full h-screen relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <iframe
              className="absolute top-0 left-0 w-full h-4/6 rounded-2xl shadow-lg border border-gray-800"
              src="https://www.youtube.com/embed/XGCzjxmM70A?si=vx_S1vLsTkXU8Bdk&start=27&autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=XGCzjxmM70A"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Add any overlay content here, such as text or buttons */}
          </div>
        </motion.section>

        <section className="text-center py-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Why <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Anime?</span></h2>
          <p className="text-xl mb-8 text-gray-300">Creating high-quality anime is expensive,<br /> hard and takes months. We&apos;re changing that!</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <motion.div 
            className={cn(
              "relative bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden card-shine-effect",
              "border border-gray-800"
            )}
            style={{
              backgroundImage: "url('/ComfyUI_00552.png')",
              height: '600px',
            }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div className="relative z-10 p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Super Powerful<br /> Character Builder
              </h3>
              <p className="text-gray-300">
                Allowing you to create<br /> unique characters, in any style.
              </p>
            </div>
          </motion.div>

          <motion.div 
            className={cn(
              "relative bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden card-shine-effect",
              "border border-gray-800"
            )}
            style={{
              backgroundImage: "url('/jabril1.png')",
              height: '600px',
              backgroundSize: 'contain',
              backgroundPosition: 'center top',
            }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div className="relative z-10 p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Powerful video2video AI,<br /> for your action scenes
              </h3>
              <p className="text-gray-300">
                Mimic motion from videos,<br /> and restyle for your action scenes.
              </p>
            </div>
          </motion.div>
        </section>

        <section 
          className="text-center py-20 bg-gray-900/50 backdrop-blur-sm rounded-3xl mb-20 border border-gray-800 relative"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <BorderTrail 
            className="bg-gradient-to-r from-pink-500 to-purple-500" 
            size={4}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: "linear",
            }}
          />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">How it works</h2>
          <p className="text-xl mb-12 text-gray-300">It&apos;s the world&apos;s fastest & easiest way<br /> to create anime, easy as 1, 2, 3</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
            <div className="bg-black/30 p-6 rounded-xl shadow-sm border border-gray-800">
              <h3 className="text-2xl font-bold mb-4 text-white">1. Create your<br /> Characters</h3>
              <p className="text-gray-300">Simply describe or load an image to create unique characters.</p>
            </div>
            <div className="bg-black/30 p-6 rounded-xl shadow-sm border border-gray-800">
              <h3 className="text-2xl font-bold mb-4 text-white">2. Animate your<br /> Characters</h3>
              <p className="text-gray-300">Describe your character animation or use reference videos to create new animations.</p>
            </div>
            <div className="bg-black/30 p-6 rounded-xl shadow-sm border border-gray-800">
              <h3 className="text-2xl font-bold mb-4 text-white">3. Finish Post <br />Production</h3>
              <p className="text-gray-300">We have tons of assets & references, inspiring you to create your best anime.</p>
            </div>
          </div>
        </section>

        <motion.section 
          className="w-relative text-center py-8 px-6 text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-8">The world is waiting <br />for your first video!</h2>
          <motion.a 
            href="/demo" 
            className="inline-block px-8 py-3 border-2 border-white bg-black/10 text-white rounded-full text-lg font-semibold hover:bg-black/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Now
          </motion.a>
        </motion.section>
      </main>
      
      <footer className="text-gray-400 py-12 relative border-t border-gray-800 backdrop-blur-sm z-10">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div>© 2024 Anime AI. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;


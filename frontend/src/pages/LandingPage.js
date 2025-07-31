import React, { useState, useEffect } from 'react';
import { Moon, Sun, Play, Users, BookOpen, Video, Award, Star, ArrowRight, Mail, User, MessageCircle } from 'lucide-react';

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Video, title: "Live Video Conferencing", desc: "Crystal clear HD video calls with up to 500 participants" },
    { icon: BookOpen, title: "Interactive Assignments", desc: "Create, distribute, and grade assignments seamlessly" },
    { icon: Users, title: "Collaboration Tools", desc: "Real-time whiteboard, breakout rooms, and group projects" },
    { icon: Award, title: "Progress Tracking", desc: "Advanced analytics to monitor student performance" }
  ];

  const stats = [
    { number: "", label: "Active Students" },
    { number: "", label: "Educators" },
    { number: "", label: "Uptime" },
    { number: "★", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-all duration-700 text-gray-800 dark:text-white overflow-x-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0">
            <div className="max-w-2xl space-y-8 lg:pr-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4" />
                  <span>Trusted by educators </span>
                </div>
                
                <h2 className="text-5xl lg:text-7xl font-black leading-tight">
                  The Future of{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                    Online Learning
                  </span>{' '}
                  is Here
                </h2>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  EduVerse revolutionizes education by combining the power of real-time collaboration 
                  with intelligent learning management. Create immersive virtual classrooms that 
                  inspire and engage every student.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a href="/login">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105">
                    <span className="flex items-center justify-center space-x-2">
                      <span>Start Teaching</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </a>                                
              </div>
            </div>
            
            {/* Enhanced 3D Illustration */}
            <div className="relative w-full lg:w-1/2 flex justify-center">
              <div className="relative w-96 h-96">
                {/* Main floating card */}
                <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl transform rotate-6 hover:rotate-3 transition-all duration-700 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="p-8 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="w-24 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-purple-400 rounded-full"></div>
                        <div className="w-8 h-8 bg-pink-400 rounded-full"></div>
                        <div className="w-8 h-8 bg-blue-400 rounded-full"></div>
                      </div>
                      <Video className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg animate-bounce"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl shadow-lg animate-pulse"></div>
                <div className="absolute top-1/2 -right-8 w-6 h-6 bg-gradient-to-br from-green-400 to-teal-500 rounded-full shadow-lg animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h3 className="text-4xl lg:text-5xl font-black">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Modern Education
              </span>
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to create engaging, interactive learning experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-200/50 dark:border-gray-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold">{feature.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h3 className="text-4xl lg:text-5xl font-black">
              Ready to Transform Your{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Classroom?
              </span>
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get in touch and let's discuss how EduVerse can revolutionize your teaching experience
            </p>
          </div>
          
          <div className="space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="relative">
              <MessageCircle className="absolute left-4 top-6 w-5 h-5 text-gray-400" />
              <textarea 
                placeholder="Tell us about your educational needs..." 
                rows="6" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              ></textarea>
            </div>
            
            <button 
              onClick={() => alert('Message sent! We\'ll get back to you soon.')}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Send Message
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">EduVerse</span>
            </div>
            
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} EduVerse. Empowering education through innovation.
            </p>
            
            <div className="flex space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
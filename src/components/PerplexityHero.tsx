import { useEffect, useState } from 'react';

interface PerplexityHeroProps {
  className?: string;
}

export const PerplexityHero: React.FC<PerplexityHeroProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`perplexity-hero-container min-h-screen p-8 bg-[#1F2121] ${className || ''}`}>
      {/* Floating dots animation */}
      <div className="floating-dot absolute w-1 h-1 bg-[#20B2AA] rounded-full opacity-30 animate-float-1" />
      <div className="floating-dot absolute w-1 h-1 bg-[#20B2AA] rounded-full opacity-30 animate-float-2" />
      <div className="floating-dot absolute w-1 h-1 bg-[#20B2AA] rounded-full opacity-30 animate-float-3" />
      
      <div className="hero-content max-w-7xl mx-auto pt-16">
        <h1 className={`hero-title text-4xl md:text-5xl lg:text-7xl font-normal text-white text-center mb-16 tracking-tight transition-all duration-800 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          One reliable platform to search all your sources
        </h1>
        
        <div className="features-layout grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] lg:h-[70vh]">
          {/* Large card - Internal knowledge */}
          <div className={`feature-card large bg-[#262626] border border-[#333333] rounded-xl p-10 relative overflow-hidden cursor-pointer transition-all duration-400 ease-out lg:row-span-2 ${
            isVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 -translate-x-12 translate-y-5'
          } hover:border-[#20B2AA] hover:-translate-y-1 hover:shadow-2xl group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#20B2AA]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="feature-icon w-full h-3/5 bg-gradient-to-br from-[#2A2A2A] to-[#333333] rounded-lg mb-8 flex items-center justify-center relative transition-transform duration-300 border border-[#3A3A3A] group-hover:scale-[1.02]">
              <span className="demo-placeholder text-[#20B2AA] text-sm font-medium uppercase tracking-wider opacity-80 animate-pulse">
                [Demo Image: Internal Knowledge Dashboard]
              </span>
            </div>
            
            <h3 className="feature-title text-2xl font-medium text-white mb-4 transition-colors duration-300 group-hover:text-[#20B2AA]">
              Internal knowledge
            </h3>
            <p className="feature-description text-base text-[#A0A0A0] leading-relaxed">
              Connect and access your data. Find deep insights across all your sources using Enterprise that help you make sense of everything. Your data always stays secure with end-to-end encryption and privacy controls.
            </p>
            
            <div className="loading-bar absolute bottom-0 left-0 h-0.5 bg-[#20B2AA] w-0 group-hover:w-full transition-all duration-500 ease-out" />
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:left-full transition-all duration-600 ease-out" />
          </div>

          {/* Small card top - External research */}
          <div className={`feature-card small-top bg-[#262626] border border-[#333333] rounded-xl p-10 relative overflow-hidden cursor-pointer transition-all duration-400 ease-out delay-200 ${
            isVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-12 translate-y-5'
          } hover:border-[#20B2AA] hover:-translate-y-1 hover:shadow-2xl group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#20B2AA]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="feature-icon w-full h-48 bg-gradient-to-br from-[#2A2A2A] to-[#333333] rounded-lg mb-8 flex items-center justify-center relative transition-transform duration-300 border border-[#3A3A3A] group-hover:scale-[1.02]">
              <span className="demo-placeholder text-[#20B2AA] text-sm font-medium uppercase tracking-wider opacity-80 animate-pulse">
                [Demo Image: Web Research]
              </span>
            </div>
            
            <h3 className="feature-title text-xl font-medium text-white mb-4 transition-colors duration-300 group-hover:text-[#20B2AA]">
              External research
            </h3>
            <p className="feature-description text-sm text-[#A0A0A0] leading-relaxed">
              Real-time access to the web. Get verified, comprehensive insights from authoritative sources around the internet rather than generalizations.
            </p>
            
            <div className="loading-bar absolute bottom-0 left-0 h-0.5 bg-[#20B2AA] w-0 group-hover:w-full transition-all duration-500 ease-out" />
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:left-full transition-all duration-600 ease-out" />
          </div>

          {/* Small card bottom - Premium data */}
          <div className={`feature-card small-bottom bg-[#262626] border border-[#333333] rounded-xl p-10 relative overflow-hidden cursor-pointer transition-all duration-400 ease-out delay-400 ${
            isVisible ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-12 translate-y-5'
          } hover:border-[#20B2AA] hover:-translate-y-1 hover:shadow-2xl group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#20B2AA]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="feature-icon w-full h-48 bg-gradient-to-br from-[#2A2A2A] to-[#333333] rounded-lg mb-8 flex items-center justify-center relative transition-transform duration-300 border border-[#3A3A3A] group-hover:scale-[1.02]">
              <span className="demo-placeholder text-[#20B2AA] text-sm font-medium uppercase tracking-wider opacity-80 animate-pulse">
                [Demo Image: Premium Analytics]
              </span>
            </div>
            
            <h3 className="feature-title text-xl font-medium text-white mb-4 transition-colors duration-300 group-hover:text-[#20B2AA]">
              Premium data
            </h3>
            <p className="feature-description text-sm text-[#A0A0A0] leading-relaxed">
              Bring decisions with proprietary data. Internal and external sources from partnerships with professional data providers.
            </p>
            
            <div className="loading-bar absolute bottom-0 left-0 h-0.5 bg-[#20B2AA] w-0 group-hover:w-full transition-all duration-500 ease-out" />
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:left-full transition-all duration-600 ease-out" />
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';

const PerplexityStyleHero = () => {
  return (
    <div className="relative min-h-screen bg-[#1F2121] text-white overflow-hidden">
      {/* Floating dots */}
      <div className="absolute w-1 h-1 bg-[#20B2AA] rounded-full opacity-30 top-[20%] left-[10%] animate-float" style={{ animationDelay: '-1s' }} />
      <div className="absolute w-1 h-1 bg-[#20B2AA] rounded-full opacity-30 top-[60%] right-[15%] animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute w-1 h-1 bg-[#20B2AA] rounded-full opacity-30 bottom-[30%] left-[20%] animate-float" style={{ animationDelay: '-5s' }} />
      
      <div className="min-h-screen p-8 bg-[#1F2121]">
        <div className="max-w-[1400px] mx-auto pt-16">
          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-normal text-white text-center mb-16 tracking-tight opacity-0 animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            One reliable platform to search all your sources
          </h1>
          
          <div className="grid grid-cols-2 grid-rows-2 gap-6 h-[70vh] min-h-[600px] md:grid-cols-1 md:grid-rows-none md:h-auto md:min-h-0">
            {/* Large card - Internal knowledge */}
            <div className="bg-[#262626] border border-[#333333] rounded-xl p-10 relative overflow-hidden cursor-pointer opacity-0 translate-y-5 transition-all duration-[400ms] cubic-bezier-[0.4,0,0.2,1] row-span-2 animate-slideInLeft hover:border-[#20B2AA] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] group md:row-span-1" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(32,178,170,0.03)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.05)] to-transparent transition-left duration-600 group-hover:left-full" />
              
              <div className="w-full h-[70%] bg-gradient-to-br from-[#2A2A2A] to-[#333333] rounded-lg mb-8 flex items-center justify-center relative transition-transform duration-300 border border-[#3A3A3A] group-hover:scale-[1.02]">
                <span className="text-[#20B2AA] text-sm font-medium uppercase tracking-wider opacity-80 animate-pulse">
                  [Demo Image: Internal Knowledge Dashboard]
                </span>
              </div>
              <h3 className="text-2xl font-medium text-white mb-4 transition-colors duration-300 group-hover:text-[#20B2AA]">
                Internal knowledge
              </h3>
              <p className="text-base text-[#A0A0A0] leading-relaxed">
                Connect and access your data. Find deep insights across all your sources using Enterprise that help you make sense of everything. Your data always stays secure with end-to-end encryption and privacy controls.
              </p>
              <div className="absolute bottom-0 left-0 h-0.5 bg-[#20B2AA] w-0 transition-all duration-[2s] ease-out group-hover:w-full" />
            </div>

            {/* Small card top - External research */}
            <div className="bg-[#262626] border border-[#333333] rounded-xl p-10 relative overflow-hidden cursor-pointer opacity-0 translate-y-5 transition-all duration-[400ms] cubic-bezier-[0.4,0,0.2,1] animate-slideInRight hover:border-[#20B2AA] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] group" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(32,178,170,0.03)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.05)] to-transparent transition-left duration-600 group-hover:left-full" />
              
              <div className="w-full h-[60%] bg-gradient-to-br from-[#2A2A2A] to-[#333333] rounded-lg mb-8 flex items-center justify-center relative transition-transform duration-300 border border-[#3A3A3A] group-hover:scale-[1.02] md:h-[200px]">
                <span className="text-[#20B2AA] text-sm font-medium uppercase tracking-wider opacity-80 animate-pulse">
                  [Demo Image: Web Research]
                </span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4 transition-colors duration-300 group-hover:text-[#20B2AA]">
                External research
              </h3>
              <p className="text-sm text-[#A0A0A0] leading-relaxed">
                Real-time access to the web. Get verified, comprehensive insights from authoritative sources around the internet rather than generalizations.
              </p>
              <div className="absolute bottom-0 left-0 h-0.5 bg-[#20B2AA] w-0 transition-all duration-[2s] ease-out group-hover:w-full" />
            </div>

            {/* Small card bottom - Premium data */}
            <div className="bg-[#262626] border border-[#333333] rounded-xl p-10 relative overflow-hidden cursor-pointer opacity-0 translate-y-5 transition-all duration-[400ms] cubic-bezier-[0.4,0,0.2,1] animate-slideInRight hover:border-[#20B2AA] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] group" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(32,178,170,0.03)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.05)] to-transparent transition-left duration-600 group-hover:left-full" />
              
              <div className="w-full h-[60%] bg-gradient-to-br from-[#2A2A2A] to-[#333333] rounded-lg mb-8 flex items-center justify-center relative transition-transform duration-300 border border-[#3A3A3A] group-hover:scale-[1.02] md:h-[200px]">
                <span className="text-[#20B2AA] text-sm font-medium uppercase tracking-wider opacity-80 animate-pulse">
                  [Demo Image: Premium Analytics]
                </span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4 transition-colors duration-300 group-hover:text-[#20B2AA]">
                Premium data
              </h3>
              <p className="text-sm text-[#A0A0A0] leading-relaxed">
                Bring decisions with proprietary data. Internal and external sources from partnerships with professional data providers.
              </p>
              <div className="absolute bottom-0 left-0 h-0.5 bg-[#20B2AA] w-0 transition-all duration-[2s] ease-out group-hover:w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerplexityStyleHero;
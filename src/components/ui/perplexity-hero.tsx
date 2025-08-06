import * as React from "react"
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X, ArrowRight, Search } from 'lucide-react'

const menuItems = [
  { name: 'product', href: '#' },
  { name: 'solutions', href: '#' },
  { name: 'customers', href: '#' },
  { name: 'resources', href: '#' },
  { name: 'pricing', href: '#' },
]

const companyLogos = [
  'vercel', 'stripe', 'snowflake', 'samsung', 'paytm', 'zoom', 'nvidia'
]

export const PerplexityHero = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [typedText, setTypedText] = React.useState('')
  const [showCursor, setShowCursor] = React.useState(true)
  
  const fullText = "how can we improve our product-led growth strategy?"

  // Typing animation effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0
      const typeWriter = () => {
        if (i < fullText.length) {
          setTypedText(fullText.substring(0, i + 1))
          i++
          setTimeout(typeWriter, 100)
        }
      }
      typeWriter()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Cursor blinking effect
  React.useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 1000)

    return () => clearInterval(cursorTimer)
  }, [])

  // Navbar scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      const navbar = document.getElementById('navbar')
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled')
        } else {
          navbar.classList.remove('scrolled')
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#202222] to-[#1a1c1c] text-[#ececec] overflow-hidden">
      {/* Navigation */}
      <nav
        id="navbar"
        data-state={menuState && 'active'}
        className="fixed top-0 left-0 right-0 bg-[rgba(32,34,34,0.85)] backdrop-blur-[20px] border-b border-[#2d2f2f] px-8 py-4 z-[1000] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-xl font-medium text-[#ececec] no-underline tracking-[-0.4px] transition-opacity duration-200 hover:opacity-80"
          >
            perplexity
          </Link>
          
          <ul className="flex gap-10 list-none">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.href}
                  className="text-[#b4b4b4] no-underline text-sm font-normal transition-all duration-200 relative hover:text-[#ececec] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-[#20808d] after:transition-[width] after:duration-300 hover:after:w-full"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          <Button
            asChild
            className="bg-[#20808d] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border-none cursor-pointer relative overflow-hidden hover:bg-[#1a6b75] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(32,128,141,0.3)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] before:transition-[left] before:duration-600 hover:before:left-full"
          >
            <Link to="/">get started</Link>
          </Button>

          <button
            onClick={() => setMenuState(!menuState)}
            className="lg:hidden relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5"
          >
            <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
            <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center px-8 pt-[100px] pb-[80px] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(32,128,141,0.03)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(32,128,141,0.02)_0%,transparent_50%)] animate-backgroundFloat" />
        
        {/* Floating dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-[2px] h-[2px] bg-[#20808d] rounded-full opacity-30 animate-float",
                i === 0 && "top-[20%] left-[10%] animate-delay-0",
                i === 1 && "top-[60%] left-[85%] animate-delay-[3s]",
                i === 2 && "top-[80%] left-[20%] animate-delay-[6s]",
                i === 3 && "top-[30%] left-[70%] animate-delay-[9s]"
              )}
            />
          ))}
        </div>

        <div className="max-w-[1400px] mx-auto grid grid-cols-2 gap-24 items-center relative z-10">
          {/* Hero Text */}
          <div className="animate-slideInLeft pr-8">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.1] mb-8 tracking-[-1px] text-[#ececec]">
              <span className="italic text-[#20808d] relative inline-block animate-textGlow">
                real
              </span>{' '}
              research,{' '}
              <span className="italic text-[#20808d] relative inline-block animate-textGlow">
                real
              </span>
              <br />
              answers, in real time
            </h1>
            
            <p className="text-xl text-[#b4b4b4] mb-10 font-normal leading-[1.6] max-w-[520px]">
              research smarter with real-time, cited insights for confident decisions—all backed with enterprise-grade security.
            </p>

            <div className="flex gap-4 mb-16">
              <Button
                asChild
                className="bg-[#20808d] text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-none cursor-pointer relative overflow-hidden inline-flex items-center gap-2 lg:gap-3 hover:bg-[#1a6b75] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(32,128,141,0.4)] before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] before:transition-[left] before:duration-600 hover:before:left-full"
              >
                <Link to="/" className="flex items-center gap-2 lg:gap-3">
                  get started
                  <ArrowRight className="w-4 lg:w-5 h-4 lg:h-5" />
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="bg-transparent text-[#ececec] border border-[#2d2f2f] px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#1c1e1e] hover:border-[#20808d] hover:-translate-y-[1px]"
              >
                <Link to="#">request a demo</Link>
              </Button>
            </div>
          </div>

          {/* Demo Interface */}
          <div className="animate-slideInRight">
            <div className="bg-[#1c1e1e] border border-[#2d2f2f] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative backdrop-blur-[20px] transform rotate-x-[5deg] transition-transform duration-300 hover:rotate-x-0 w-full max-w-[500px] lg:max-w-[600px] mx-auto lg:mx-0">
              {/* Interface Header */}
              <div className="bg-[#181a1a] border-b border-[#242626] px-5 lg:px-6 py-3 lg:py-4 flex items-center gap-3 lg:gap-4">
                <div className="flex gap-[6px] lg:gap-[8px]">
                  <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-[#ff5f57] animate-dotPulse" />
                  <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-[#ffbd2e] animate-dotPulse animate-delay-[0.3s]" />
                  <div className="w-2.5 lg:w-3 h-2.5 lg:h-3 rounded-full bg-[#28ca42] animate-dotPulse animate-delay-[0.6s]" />
                </div>
                <div className="text-[#6b6b6b] text-xs lg:text-sm font-mono ml-auto">
                  perplexity.ai/search
                </div>
              </div>

              {/* Search Container */}
              <div className="p-6 lg:p-8 bg-[#1c1e1e]">
                <div className="bg-[#181a1a] border border-[#242626] rounded-xl p-4 lg:p-5 flex items-start gap-3 lg:gap-4 mb-5 lg:mb-6 transition-all duration-300 hover:border-[#20808d] hover:shadow-[0_0_0_1px_rgba(32,128,141,0.1)]">
                  <Search className="w-4 lg:w-5 h-4 lg:h-5 text-[#20808d] mt-[2px] animate-searchPulse" />
                  <div className="flex-1 bg-transparent border-none text-[#ececec] text-sm lg:text-base outline-none resize-none font-inherit leading-[1.4]">
                    {typedText}
                    {showCursor && <span className="inline-block w-[2px] h-4 lg:h-5 bg-[#20808d] animate-blink ml-[2px]" />}
                  </div>
                </div>

                <div className="flex gap-2 lg:gap-3 flex-wrap mb-5 lg:mb-6">
                  {['analysis', 'strategy', 'growth metrics'].map((pill, index) => (
                    <div
                      key={pill}
                      className={cn(
                        "bg-[rgba(32,128,141,0.1)] border border-[rgba(32,128,141,0.2)] text-[#20808d] px-3 lg:px-4 py-1 lg:py-2 rounded-[20px] text-xs lg:text-sm font-medium cursor-pointer transition-all duration-200 animate-pillFloat hover:bg-[rgba(32,128,141,0.2)] hover:-translate-y-[1px]",
                        index === 0 && "animate-delay-[0.1s]",
                        index === 1 && "animate-delay-[0.2s]",
                        index === 2 && "animate-delay-[0.3s]"
                      )}
                    >
                      {pill}
                    </div>
                  ))}
                </div>

                <div className="bg-[#181a1a] border border-[#242626] rounded-xl p-5 lg:p-8 min-h-[200px] lg:min-h-[280px] relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(32,128,141,0.1)_0%,rgba(32,128,141,0.05)_100%)] border-2 border-dashed border-[rgba(32,128,141,0.3)] rounded-xl text-[#b4b4b4] text-sm lg:text-base text-center transition-all duration-300 hover:border-[#20808d] hover:bg-[linear-gradient(135deg,rgba(32,128,141,0.15)_0%,rgba(32,128,141,0.08)_100%)]">
                    <div className="text-[32px] lg:text-[48px] mb-3 lg:mb-4 animate-iconBounce">📊</div>
                    <div className="font-medium mb-1 lg:mb-2 text-base lg:text-lg">[DEMO INTERFACE PLACEHOLDER]</div>
                    <div className="text-xs lg:text-sm text-[#6b6b6b]">Add your demo interface screenshot here</div>
                  </div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[linear-gradient(45deg,transparent_30%,rgba(32,128,141,0.05)_50%,transparent_70%)] animate-shimmer opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center animate-fadeInUp">
          <div className="text-[#6b6b6b] text-xs font-normal uppercase tracking-[0.5px] mb-4">
            teams save 10+ hours weekly per employee with enterprise pro
          </div>
          <div className="flex gap-6 items-center justify-center flex-wrap">
            {companyLogos.map((logo) => (
              <div
                key={logo}
                className="bg-[#1c1e1e] border border-[#242626] rounded-lg px-4 py-2 text-[#6b6b6b] text-xs font-medium transition-all duration-300 cursor-pointer hover:bg-[#181a1a] hover:border-[#20808d] hover:text-[#b4b4b4] hover:-translate-y-[2px]"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}
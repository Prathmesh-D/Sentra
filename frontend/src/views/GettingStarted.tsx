import { TbLayoutDashboardFilled } from "react-icons/tb";
import { FaShieldDog } from "react-icons/fa6";
import { MdMoveToInbox, MdOutbox } from "react-icons/md";
import { SiLetsencrypt } from "react-icons/si";
import { IoMdSettings } from "react-icons/io";
import { FaUser } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import { HiLightningBolt } from "react-icons/hi";
import { TiCloudStorage } from "react-icons/ti";
import { useState, useEffect } from "react";

export default function GettingStartedPage() {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts - target the scrollable parent
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    
    // Check if animations have already played in this session
    const animated = sessionStorage.getItem('gettingStartedAnimated');
    if (animated) {
      setHasAnimated(true);
    } else {
      sessionStorage.setItem('gettingStartedAnimated', 'true');
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 overflow-y-auto">
      {/* Hero Section */}
      <div className={`text-center max-w-3xl mx-auto ${!hasAnimated ? 'animate-in fade-in slide-in-from-top-4 duration-700' : ''}`}>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#084d45] via-[#0a6b5e] to-[#084d45] bg-clip-text text-transparent">
          Welcome to Sentra! 🎉
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed font-medium">
          Your personal, secure space where sharing files is both simple and safe. 
          Use the guide below to explore all the features and start encrypting with confidence.
        </p>
      </div>

      {/* Decorative Separator 1 */}
      <div className={`flex items-center justify-center gap-4 my-12 max-w-2xl mx-auto w-full ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '300ms', animationFillMode: 'backwards' } : {}}>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-gray-400"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm animate-pulse">✦</span>
          <span className="text-gray-500 text-lg animate-pulse" style={{ animationDelay: '100ms' }}>✦</span>
          <span className="text-gray-600 text-2xl animate-pulse" style={{ animationDelay: '200ms' }}>✦</span>
          <span className="text-gray-500 text-lg animate-pulse" style={{ animationDelay: '100ms' }}>✦</span>
          <span className="text-gray-400 text-sm animate-pulse">✦</span>
        </div>
        <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-gray-400 to-gray-400"></div>
      </div>

      {/* Key Features Section */}
      <div className="max-w-4xl mx-auto w-full">
        <h2 className={`text-3xl font-bold text-center mb-8 ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''}`} style={!hasAnimated ? { animationDelay: '400ms', animationFillMode: 'backwards' } : {}}>Key Features</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className={`bg-gradient-to-br from-[#b2f7ef]/50 to-[#b2f7ef]/20 border-[3px] border-[#b2f7ef] rounded-xl p-6 hover:shadow-xl hover:shadow-[#b2f7ef]/40 hover:border-[#b2f7ef] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4' : ''}`} style={!hasAnimated ? { animationDelay: '500ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#b2f7ef] flex items-center justify-center shadow-md">
                <SiLetsencrypt className="w-7 h-7 text-[#084d45]" />
              </div>
              <h3 className="text-xl font-semibold text-[#084d45]">Hybrid Encryption</h3>
            </div>
            <p className="text-[#084d45]/80 font-medium">AES + RSA for secure file sharing</p>
          </div>
          
          <div className={`bg-gradient-to-br from-[#97eeff]/50 to-[#97eeff]/20 border-[3px] border-[#97eeff] rounded-xl p-6 hover:shadow-xl hover:shadow-[#97eeff]/40 hover:border-[#97eeff] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in slide-in-from-right-4' : ''}`} style={!hasAnimated ? { animationDelay: '600ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#97eeff] flex items-center justify-center shadow-md">
                <HiLightningBolt className="w-7 h-7 text-[#004452]" />
              </div>
              <h3 className="text-xl font-semibold text-[#004452]">Fast & Efficient</h3>
            </div>
            <p className="text-[#004452]/80 font-medium">Optimized encryption for large files</p>
          </div>
          
          <div className={`bg-gradient-to-br from-[#f7d6e0]/50 to-[#f7d6e0]/20 border-[3px] border-[#f7d6e0] rounded-xl p-6 hover:shadow-xl hover:shadow-[#f7d6e0]/40 hover:border-[#f7d6e0] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4' : ''}`} style={!hasAnimated ? { animationDelay: '700ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#f7d6e0] flex items-center justify-center shadow-md">
                <TiCloudStorage className="w-7 h-7 text-[#8b1e3f]" />
              </div>
              <h3 className="text-xl font-semibold text-[#8b1e3f]">Cloud Storage</h3>
            </div>
            <p className="text-[#8b1e3f]/80 font-medium">Seamlessly upload & sync your files</p>
          </div>
          
          <div className={`bg-gradient-to-br from-[#f2b5d4]/50 to-[#f2b5d4]/20 border-[3px] border-[#f2b5d4] rounded-xl p-6 hover:shadow-xl hover:shadow-[#f2b5d4]/40 hover:border-[#f2b5d4] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in slide-in-from-right-4' : ''}`} style={!hasAnimated ? { animationDelay: '800ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#f2b5d4] flex items-center justify-center shadow-md">
                <GiArtificialIntelligence className="w-7 h-7 text-[#480d2a]" />
              </div>
              <h3 className="text-xl font-semibold text-[#480d2a]">AI File Scoring</h3>
            </div>
            <p className="text-[#480d2a]/80 font-medium">Automatically tag & score files</p>
          </div>
        </div>
      </div>

      {/* Decorative Separator 2 */}
      <div className={`flex items-center justify-center gap-4 my-12 max-w-2xl mx-auto w-full ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '900ms', animationFillMode: 'backwards' } : {}}>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-gray-400"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm animate-pulse">✦</span>
          <span className="text-gray-500 text-lg animate-pulse" style={{ animationDelay: '100ms' }}>✦</span>
          <span className="text-gray-600 text-2xl animate-pulse" style={{ animationDelay: '200ms' }}>✦</span>
          <span className="text-gray-500 text-lg animate-pulse" style={{ animationDelay: '100ms' }}>✦</span>
          <span className="text-gray-400 text-sm animate-pulse">✦</span>
        </div>
        <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-gray-400 to-gray-400"></div>
      </div>
      
      {/* Navigation Guide Section */}
      <div className="max-w-4xl mx-auto w-full">
        <h2 className={`text-3xl font-bold text-center mb-8 ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''}`} style={!hasAnimated ? { animationDelay: '1000ms', animationFillMode: 'backwards' } : {}}>Explore Your Workspace</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Dashboard Card */}
          <div className={`bg-gradient-to-br from-[#b2f7ef]/40 to-[#b2f7ef]/10 border-[3px] border-[#b2f7ef]/80 rounded-xl p-6 hover:shadow-xl hover:shadow-[#b2f7ef]/50 hover:scale-105 hover:border-[#b2f7ef] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1100ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#b2f7ef]/60 flex items-center justify-center transition-transform duration-300 hover:rotate-12 shadow-md">
                <TbLayoutDashboardFilled className="w-6 h-6 text-[#084d45]" />
              </div>
              <h3 className="text-xl font-semibold text-[#084d45]">Dashboard</h3>
            </div>
            <p className="text-[#084d45]/80 font-medium leading-relaxed">
              Your command center. View analytics, recent activity, and quick access to all your encrypted files in one place.
            </p>
          </div>

          {/* Encrypt File Card */}
          <div className={`bg-gradient-to-br from-[#97eeff]/40 to-[#97eeff]/10 border-[3px] border-[#97eeff]/80 rounded-xl p-6 hover:shadow-xl hover:shadow-[#97eeff]/50 hover:scale-105 hover:border-[#97eeff] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1200ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#97eeff]/60 flex items-center justify-center transition-transform duration-300 hover:rotate-12 shadow-md">
                <FaShieldDog className="w-6 h-6 text-[#004452]" />
              </div>
              <h3 className="text-xl font-semibold text-[#004452]">Encrypt</h3>
            </div>
            <p className="text-[#004452]/80 font-medium leading-relaxed">
              Secure your files with military-grade encryption. Upload, encrypt, and share files with confidence using hybrid AES + RSA encryption.
            </p>
          </div>

          {/* Inbox Card */}
          <div className={`bg-gradient-to-br from-[#eff7f6]/60 to-[#eff7f6]/20 border-[3px] border-[#b2f7ef]/80 rounded-xl p-6 hover:shadow-xl hover:shadow-[#b2f7ef]/50 hover:scale-105 hover:border-[#b2f7ef] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1300ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#f2b5d4]/60 flex items-center justify-center transition-transform duration-300 hover:rotate-12 shadow-md">
                <MdMoveToInbox className="w-6 h-6 text-[#480d2a]" />
              </div>
              <h3 className="text-xl font-semibold text-[#480d2a]">Inbox</h3>
            </div>
            <p className="text-[#480d2a]/80 font-medium leading-relaxed">
              Receive encrypted files from others. All incoming files are automatically scanned, scored, and organized for your review.
            </p>
          </div>

          {/* Outbox Card */}
          <div className={`bg-gradient-to-br from-[#f7d6e0]/40 to-[#f7d6e0]/10 border-[3px] border-[#f7d6e0]/80 rounded-xl p-6 hover:shadow-xl hover:shadow-[#f7d6e0]/50 hover:scale-105 hover:border-[#f7d6e0] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1400ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#f7d6e0]/60 flex items-center justify-center transition-transform duration-300 hover:rotate-12 shadow-md">
                <MdOutbox className="w-6 h-6 text-[#8b1e3f]" />
              </div>
              <h3 className="text-xl font-semibold text-[#8b1e3f]">Outbox</h3>
            </div>
            <p className="text-[#8b1e3f]/80 font-medium leading-relaxed">
              Track all your sent files. Monitor delivery status, manage sharing permissions, and revoke access anytime.
            </p>
          </div>

          {/* Settings Card */}
          <div className={`bg-gradient-to-br from-[#f2b5d4]/40 to-[#f2b5d4]/10 border-[3px] border-[#f2b5d4]/80 rounded-xl p-6 hover:shadow-xl hover:shadow-[#f2b5d4]/50 hover:scale-105 hover:border-[#f2b5d4] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1500ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#b2f7ef]/60 flex items-center justify-center transition-transform duration-300 hover:rotate-12 shadow-md">
                <IoMdSettings className="w-6 h-6 text-[#084d45]" />
              </div>
              <h3 className="text-xl font-semibold text-[#084d45]">Settings</h3>
            </div>
            <p className="text-[#084d45]/80 font-medium leading-relaxed">
              Customize your experience. Manage encryption keys, configure security preferences, and personalize your workspace.
            </p>
          </div>

          {/* User Profile Card */}
          <div className={`bg-gradient-to-br from-[#97eeff]/40 to-[#b2f7ef]/10 border-[3px] border-[#97eeff]/80 rounded-xl p-6 hover:shadow-xl hover:shadow-[#97eeff]/50 hover:scale-105 hover:border-[#97eeff] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1600ms', animationFillMode: 'backwards' } : {}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#97eeff]/60 flex items-center justify-center transition-transform duration-300 hover:rotate-12 shadow-md">
                <FaUser className="w-6 h-6 text-[#004452]" />
              </div>
              <h3 className="text-xl font-semibold text-[#004452]">User Profile</h3>
            </div>
            <p className="text-[#004452]/80 font-medium leading-relaxed">
              Manage your account details, update profile information, and configure your personal preferences. Access your security settings here.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Separator 3 */}
      <div className={`flex items-center justify-center gap-4 my-12 max-w-2xl mx-auto w-full ${!hasAnimated ? 'animate-in fade-in zoom-in-95' : ''}`} style={!hasAnimated ? { animationDelay: '1700ms', animationFillMode: 'backwards' } : {}}>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-gray-400"></div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm animate-pulse">✦</span>
          <span className="text-gray-500 text-lg animate-pulse" style={{ animationDelay: '100ms' }}>✦</span>
          <span className="text-gray-600 text-2xl animate-pulse" style={{ animationDelay: '200ms' }}>✦</span>
          <span className="text-gray-500 text-lg animate-pulse" style={{ animationDelay: '100ms' }}>✦</span>
          <span className="text-gray-400 text-sm animate-pulse">✦</span>
        </div>
        <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-gray-400 to-gray-400"></div>
      </div>
    </div>
  )
}

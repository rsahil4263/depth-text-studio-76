import React, { useState, useRef, useEffect } from 'react';
import { History, Plus, Lightbulb, Paperclip, Send, Edit, CheckSquare } from 'lucide-react';

interface AgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditMode = 'creative' | 'precision';

interface Message {
  type: 'user' | 'ai';
  content: string;
  details?: string[];
}

const modeData = {
  creative: {
    greatFor: [
      'Trying out different moods and styles',
      'Enhancing photos without a specific plan',
      'Discovering new creative possibilities'
    ]
  },
  precision: {
    greatFor: [
      'Removing specific objects or blemishes',
      'Professional retouching',
      'Applying a consistent edit across multiple photos'
    ]
  }
};

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ isOpen, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<EditMode>('creative');
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [promptEnhancerEnabled, setPromptEnhancerEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message) return;

    if (!chatStarted) {
      setChatStarted(true);
    }

    const newUserMessage: Message = {
      type: 'user',
      content: message
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = selectedMode === 'creative' 
        ? {
            type: 'ai',
            content: "You got it. I've applied a cinematic look. Here are the adjustments:",
            details: [
              "Increased Saturation by +20.",
              "Adjusted Temperature to +15 for a warmer feel.",
              "Applied a Vignette with -25 intensity.",
              "Added a grain layer (Opacity: 10%) for a filmic texture."
            ]
          }
        : {
            type: 'ai',
            content: "Task complete. The object has been removed. Here is a summary:",
            details: [
              "Created a content-aware fill layer to replace the object.",
              "Used a healing brush to blend edges seamlessly.",
              "Reconstructed texture using a clone stamp tool.",
              "Matched local lighting and color to the surroundings."
            ]
          };

      setMessages(prev => [...prev, aiResponse]);
    }, 1200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const startNewChat = () => {
    setChatStarted(false);
    setMessages([]);
    setInputValue('');
  };

  const showHistory = () => {
    alert("History panel would open here.");
  };

  const showPromptTips = () => {
    alert("Tips:\n\n• Creative: 'Give this a moody, rainy day vibe.'\n• Precision: 'Remove the red car from the background.'");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] min-w-[280px] max-w-[480px] xl:w-[480px] lg:w-[400px] md:w-[350px] sm:w-full bg-[#1F2121] border-l border-[#2A2D2D] flex flex-col z-50">
      {/* Top Bar */}
      <div className="bg-[#191B1B] border-b border-[#2A2D2D] p-4 flex items-center justify-between gap-3 flex-shrink-0">
        <button 
          onClick={showHistory}
          className="flex items-center gap-2 px-3 py-2 text-[#B4BCD0] hover:bg-[#2A2D2D] hover:text-white rounded-lg transition-all text-sm font-medium"
        >
          <History size={16} />
          History
        </button>
        <button 
          onClick={startNewChat}
          className="flex items-center gap-2 px-3 py-2 text-[#B4BCD0] hover:bg-[#2A2D2D] hover:text-white rounded-lg transition-all text-sm font-medium"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {!chatStarted ? (
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-7">
              <div className="w-11 h-11 mx-auto mb-4 bg-gradient-to-br from-[#20B2AA] to-[#48CAE4] rounded-xl flex items-center justify-center shadow-lg shadow-[#20B2AA]/20">
                <Edit size={24} className="text-white" />
              </div>
              <h1 className="text-[22px] font-medium text-white mb-1.5 tracking-tight">Let's Create</h1>
              <p className="text-sm text-[#B4BCD0]">Describe your vision, and let's bring it to life.</p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              <div 
                onClick={() => setSelectedMode('creative')}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedMode === 'creative' 
                    ? 'bg-[#20B2AA]/8 border-[#20B2AA]' 
                    : 'bg-[#242626] border-[#2A2D2D] hover:bg-[#2A2D2D] hover:border-[#20B2AA]'
                }`}
              >
                <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  selectedMode === 'creative' ? 'text-[#20B2AA]' : 'text-white'
                }`}>
                  <Edit size={16} />
                  Creative Flow
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  Chat about ideas, then let's create. Experiment with styles and effects.
                </p>
              </div>

              <div 
                onClick={() => setSelectedMode('precision')}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedMode === 'precision' 
                    ? 'bg-[#20B2AA]/8 border-[#20B2AA]' 
                    : 'bg-[#242626] border-[#2A2D2D] hover:bg-[#2A2D2D] hover:border-[#20B2AA]'
                }`}
              >
                <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  selectedMode === 'precision' ? 'text-[#20B2AA]' : 'text-white'
                }`}>
                  <CheckSquare size={16} />
                  Precision Edit
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  Give specific instructions for a targeted result. Perfect for detailed retouching.
                </p>
              </div>
            </div>

            {/* Great For Section */}
            <div className="mb-7">
              <h3 className="text-sm font-medium text-white mb-3">Great for:</h3>
              <ul className="space-y-2">
                {modeData[selectedMode].greatFor.map((item, index) => (
                  <li key={index} className="text-sm text-[#B4BCD0] pl-4 relative">
                    <span className="absolute left-0 text-[#20B2AA] font-bold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div ref={chatContainerRef} className="flex-1 p-6 flex flex-col gap-5">
            {messages.map((message, index) => (
              <div key={index} className={`max-w-[90%] text-sm leading-relaxed ${
                message.type === 'user' 
                  ? 'self-end bg-[#20B2AA] text-white rounded-[18px_18px_4px_18px] px-4 py-3'
                  : 'self-start bg-[#2A2D2D] text-white rounded-[4px_18px_18px_18px] px-4 py-3 w-full'
              }`}>
                <p>{message.content}</p>
                {message.details && (
                  <ul className="mt-3 pt-3 border-t border-[#444949] space-y-2">
                    {message.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-[#B4BCD0] text-sm flex items-center">
                        <span className="text-[#20B2AA] font-bold mr-2.5 text-sm">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="p-5 border-t border-[#2A2D2D] flex-shrink-0">
        <div className="relative mb-4">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Make this sunset photo more dramatic"
            className="w-full bg-[#242626] border border-[#2A2D2D] rounded-xl px-4 py-3.5 pr-20 text-sm text-white placeholder-[#9CA3AF] resize-none outline-none transition-all focus:border-[#20B2AA] focus:bg-[#2A2D2D] focus:shadow-[0_0_0_3px_rgba(32,178,170,0.1)]"
            rows={1}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-1.5 text-[#B4BCD0] hover:bg-[#2A2D2D] hover:text-[#20B2AA] rounded-md transition-all">
              <Paperclip size={16} />
            </button>
            <button 
              onClick={handleSendMessage}
              className="p-2 bg-[#20B2AA] text-white rounded-lg hover:bg-[#48CAE4] hover:scale-105 transition-all shadow-lg shadow-[#20B2AA]/30"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <button 
            onClick={showPromptTips}
            className="flex items-center gap-2 px-3 py-2 text-[#B4BCD0] hover:bg-[#2A2D2D] hover:text-white rounded-lg transition-all"
          >
            <Lightbulb size={16} />
            Tips
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[#B4BCD0]">Creative Boost</span>
            <button
              onClick={() => setPromptEnhancerEnabled(!promptEnhancerEnabled)}
              className={`relative w-9 h-5 rounded-full transition-all ${
                promptEnhancerEnabled ? 'bg-[#20B2AA]' : 'bg-[#2A2D2D]'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                promptEnhancerEnabled ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );};

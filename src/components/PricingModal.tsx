import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingPlan {
  name: string;
  price: string;
  billing: string;
  description: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  features: string[];
  additionalInfo?: string;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Pro',
    price: '$20.00',
    billing: '$16.67 when billed annually',
    description: 'Upgrade productivity and learning with additional access.',
    isCurrent: true,
    features: [
      '10x as many citations in answers',
      'Access to Perplexity Labs',
      'Unlimited file and photo uploads',
      'Extended access to Perplexity Research',
      'Extended access to Image generation',
      'One subscription for all the latest AI models',
      'Exclusive access to Pro Perks',
      'And much more'
    ],
    additionalInfo: 'Existing subscriber? See billing help',
    buttonText: 'Your current plan',
    buttonVariant: 'secondary'
  },
  {
    name: 'Max',
    price: '$200.00',
    billing: '/ month',
    description: 'Unlock Perplexity\'s full capabilities with early access to new products.',
    isPopular: true,
    features: [
      'Everything in Pro',
      'Early access to Comet, the agentic browser',
      'Unlimited access to Perplexity Labs',
      'Unlimited access to Perplexity Research',
      'Use advanced AI models like OpenAI o3-pro and Anthropic Claude 4 Opus',
      'Priority support'
    ],
    additionalInfo: 'For personal use only, and subject to our policies',
    buttonText: 'Upgrade to Max',
    buttonVariant: 'primary'
  }
];

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Personal');

  if (!isOpen) return null;

  const handleUpgrade = (planName: string) => {
    console.log(`Upgrade to ${planName} clicked`);
    // Implement upgrade logic here
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="relative w-full max-w-4xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/5 rounded-xl p-1 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('Personal')}
                className={cn(
                  "px-8 py-3 rounded-lg font-medium transition-all duration-300 relative overflow-hidden",
                  activeTab === 'Personal'
                    ? "bg-white/10 text-white scale-105"
                    : "text-gray-400 hover:text-white"
                )}
              >
                Personal
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative bg-white/3 border border-white/8 rounded-2xl p-8 transition-all duration-500 backdrop-blur-xl overflow-hidden group hover:border-emerald-500/40 hover:bg-white/6 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl",
                "animate-in slide-in-from-bottom-6 duration-700",
                index === 1 && "delay-200"
              )}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-px -right-px bg-emerald-500/10 backdrop-blur-sm text-emerald-400 px-3 py-1.5 rounded-tr-2xl rounded-bl-xl text-xs font-semibold uppercase tracking-wider border-l border-b border-emerald-500/20 group-hover:bg-emerald-500/15 group-hover:scale-105 transition-all duration-300">
                  Popular
                </div>
              )}

              <div className="relative z-10">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2 animate-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${600 + index * 100}ms` }}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="text-4xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1 animate-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${700 + index * 100}ms` }}>
                  {plan.price}
                </div>

                {/* Billing */}
                <div className="text-gray-400 text-sm mb-4 animate-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${800 + index * 100}ms` }}>
                  {plan.billing}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed mb-8 animate-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${900 + index * 100}ms` }}>
                  {plan.description}
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  className={cn(
                    "w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 mb-8 relative overflow-hidden group/btn animate-in slide-in-from-bottom-4 duration-600",
                    plan.buttonVariant === 'primary'
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 hover:scale-[1.02]"
                      : "bg-white/5 text-white border border-white/15 hover:bg-white/10 hover:border-white/25 hover:-translate-y-0.5 hover:scale-[1.01]"
                  )}
                  style={{ animationDelay: `${1000 + index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-xl scale-0 group-hover/btn:scale-100 transition-transform duration-600" />
                  <span className="relative">{plan.buttonText}</span>
                </button>

                {/* Features List */}
                <ul className="space-y-3 animate-in slide-in-from-bottom-4 duration-600" style={{ animationDelay: `${1200 + index * 100}ms` }}>
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-gray-300 animate-in slide-in-from-bottom-2 duration-400"
                      style={{ animationDelay: `${1300 + index * 100 + featureIndex * 100}ms` }}
                    >
                      <div className="w-5 h-5 bg-emerald-500/15 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-emerald-500/25 group-hover:scale-110 transition-all duration-300">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Additional Info */}
                {plan.additionalInfo && (
                  <div className="mt-6 pt-6 border-t border-white/8">
                    <p className="text-xs text-gray-400">
                      {plan.additionalInfo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
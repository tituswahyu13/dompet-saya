"use client"
import React from 'react';
import * as Lucide from 'lucide-react';

const EMOJI_MAP: Record<string, keyof typeof Lucide> = {
  // Goals
  '🎯': 'Target',
  '🏠': 'Home',
  '🚗': 'Car',
  '🏖️': 'Palmtree',
  '💍': 'Heart',
  '🎓': 'GraduationCap',
  '💻': 'Laptop',
  '🚲': 'Bike',
  '👶': 'Baby',
  '🏥': 'Stethoscope',
  '💰': 'Coins',
  '💎': 'Diamond',
  
  // Wallets
  '💵': 'Banknote',
  '🏦': 'Building2',
  '📱': 'Smartphone',
  '💳': 'CreditCard',
  '📈': 'TrendingUp',
  '🏪': 'Store',
  '🔐': 'Lock',
  '⚖️': 'Scale',
  '⚡': 'Zap',
  '✨': 'Sparkles',
  '⚠️': 'AlertTriangle',
  '🔔': 'Bell',
  '⏰': 'Clock',
  '📋': 'ClipboardList',
  '🛒': 'ShoppingCart'
};

interface MinimalistIconProps extends React.SVGProps<SVGSVGElement> {
  icon: string;
  size?: number | string;
}

export default function MinimalistIcon({ icon, size = 20, className, ...props }: MinimalistIconProps) {
  const iconName = EMOJI_MAP[icon] || icon;
  const LucideIcon = (Lucide as any)[iconName];

  if (LucideIcon) {
    return <LucideIcon size={size} className={className} {...props} />;
  }

  // Fallback to the original icon (emoji) if no mapping found
  return <span style={{ fontSize: size }} className={className}>{icon}</span>;
}

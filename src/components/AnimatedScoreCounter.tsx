import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Award, Sparkles, Trophy, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AnimatedScoreCounterProps {
  value: number; // 0 to max
  max?: number;  // default 100
  duration?: number; // ms, default 1600
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showRing?: boolean;
  showSparkles?: boolean;
  gradeTitle?: string;
  className?: string;
  subText?: string;
}

export const AnimatedScoreCounter: React.FC<AnimatedScoreCounterProps> = ({
  value,
  max = 100,
  duration = 1600,
  size = 'lg',
  label,
  showRing = true,
  showSparkles = true,
  gradeTitle,
  className = '',
  subText
}) => {
  const { isAr } = useLanguage();
  const [displayValue, setDisplayValue] = useState(0);

  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  // Smooth counter effect using requestAnimationFrame
  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const startValue = 0;
    const targetValue = percentage;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic function for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (targetValue - startValue) * easeOutCubic);
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [percentage, duration]);

  // Size configurations
  const dimensions = {
    sm: { circle: 70, stroke: 6, text: 'text-xl', icon: 'w-4 h-4', padding: 'p-2' },
    md: { circle: 100, stroke: 8, text: 'text-2xl', icon: 'w-5 h-5', padding: 'p-3' },
    lg: { circle: 130, stroke: 10, text: 'text-4xl', icon: 'w-6 h-6', padding: 'p-4' },
    xl: { circle: 160, stroke: 12, text: 'text-5xl', icon: 'w-8 h-8', padding: 'p-6' }
  }[size];

  const radius = (dimensions.circle - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  // Determine dynamic color based on score
  let colorClass = 'text-emerald-400 stroke-emerald-500 from-emerald-500/20 to-teal-500/10 border-emerald-500/30';
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (percentage < 50) {
    colorClass = 'text-rose-400 stroke-rose-500 from-rose-500/20 to-red-500/10 border-rose-500/30';
    glowColor = 'rgba(244, 63, 94, 0.4)';
  } else if (percentage < 75) {
    colorClass = 'text-amber-400 stroke-amber-500 from-amber-500/20 to-yellow-500/10 border-amber-500/30';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  } else if (percentage < 90) {
    colorClass = 'text-indigo-400 stroke-indigo-500 from-indigo-500/20 to-blue-500/10 border-indigo-500/30';
    glowColor = 'rgba(99, 102, 241, 0.4)';
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
    >
      {/* Decorative Sparkles for High Scores */}
      {showSparkles && percentage >= 75 && (
        <>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute -top-3 -right-3 text-amber-400 z-10"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute -bottom-2 -left-3 text-emerald-400 z-10"
          >
            <Star className="w-5 h-5 animate-spin-slow" />
          </motion.div>
        </>
      )}

      {/* Main Container */}
      <div className="relative flex items-center justify-center">
        {showRing ? (
          <div className="relative flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg
              width={dimensions.circle}
              height={dimensions.circle}
              className="transform -rotate-90 drop-shadow-md"
            >
              {/* Background Ring */}
              <circle
                cx={dimensions.circle / 2}
                cy={dimensions.circle / 2}
                r={radius}
                className="stroke-slate-800"
                strokeWidth={dimensions.stroke}
                fill="transparent"
              />
              {/* Animated Foreground Ring */}
              <motion.circle
                cx={dimensions.circle / 2}
                cy={dimensions.circle / 2}
                r={radius}
                className={`transition-all duration-300 ease-out ${colorClass.split(' ')[1]}`}
                strokeWidth={dimensions.stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: `drop-shadow(0 0 8px ${glowColor})`
                }}
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              <div className="flex items-baseline justify-center gap-0.5">
                <motion.span 
                  key={displayValue}
                  className={`font-black font-mono tracking-tight ${dimensions.text} ${colorClass.split(' ')[0]}`}
                >
                  {displayValue}
                </motion.span>
                <span className={`font-black font-mono text-sm ${colorClass.split(' ')[0]}`}>%</span>
              </div>
              
              {label && (
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold block mt-0.5 line-clamp-1 max-w-[90%]">
                  {label}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Card-based Counter without ring */
          <div className={`rounded-2xl border bg-gradient-to-b ${colorClass} ${dimensions.padding} shadow-xl text-center space-y-1`}>
            <div className="flex items-center justify-center gap-1.5">
              <Trophy className={`${dimensions.icon} ${colorClass.split(' ')[0]}`} />
              <span className={`font-black font-mono tracking-tight ${dimensions.text} ${colorClass.split(' ')[0]}`}>
                {displayValue}%
              </span>
            </div>
            {label && (
              <span className="text-xs text-slate-300 font-extrabold block">
                {label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Optional Grade Badge below */}
      {gradeTitle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-3 text-center"
        >
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-md ${colorClass}`}>
            <Award className="w-3.5 h-3.5" />
            <span>{gradeTitle}</span>
          </span>
          {subText && (
            <span className="text-[11px] text-slate-400 block mt-1 font-mono">
              {subText}
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

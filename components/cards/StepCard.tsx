import React from "react";

interface StepCardProps {
  steps: Array<{
    label: string;
    description: string;
    icon: React.ReactNode;
  }>;
  currentStep: number;
}

export const StepCard: React.FC<StepCardProps> = ({ steps, currentStep }) => {
  return (
    <div
      className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div
        className="flex justify-center md:justify-center gap-3 py-2 min-w-[340px] md:min-w-0"
        style={{ minWidth: steps.length > 3 ? steps.length * 180 : undefined }}
      >
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-start min-w-[150px] md:min-w-[220px]">
              <div
                className={`flex items-center justify-center w-8 h-8 md:w-16 md:h-16 rounded-full mb-2 transition-all duration-200 ${
                  idx === currentStep
                    ? "bg-black text-white scale-110 shadow-lg"
                    : "bg-zinc-900 text-white opacity-60"
                }`}
              >
                {step.icon}
              </div>
              <div className="text-sm md:text-lg font-semibold text-black dark:text-white text-left md:text-center">
                {step.label}
              </div>
              <div className="text-xs md:text-md text-zinc-500 font-semibold text-left md:text-center">
                {step.description}
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex items-center">
                <span className="mx-2 md:mx-4 text-xl md:text-2xl text-zinc-400">
                  &gt;
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

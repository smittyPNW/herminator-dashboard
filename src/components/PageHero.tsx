import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: ReactNode;
}

export default function PageHero({ eyebrow, title, description, actions, stats }: PageHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,rgba(28,10,44,0.76),rgba(11,4,21,0.68))] px-5 py-5 shadow-[0_24px_90px_rgba(9,2,18,0.25)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(57,230,255,0.05),transparent_40%,rgba(255,79,216,0.08)),repeating-linear-gradient(180deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_5px)] opacity-35" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#ffcaef]">{eyebrow}</p>
          <h1 className="glow-text text-3xl font-black text-white md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#f6c8ea] md:text-[15px]">{description}</p>
          {stats && <div className="mt-4 flex flex-wrap gap-2">{stats}</div>}
        </div>
        {actions ? <div className="relative">{actions}</div> : null}
      </div>
    </header>
  );
}

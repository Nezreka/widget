// src/components/PortfolioWidget.tsx
"use client";

import React, { useState, useEffect } from 'react';

// --- Interfaces & Types ---
export interface PortfolioWidgetSettings {
  accentColor?: string;
  showAnimatedBackground?: boolean;
}

interface PortfolioWidgetProps {
  settings?: PortfolioWidgetSettings;
}

// --- Icons (Refined for a sleeker look) ---
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-80">
    <path d="M3 4.25A2.25 2.25 0 015.25 2h9.5A2.25 2.25 0 0117 4.25v2a.75.75 0 01-1.5 0v-2H4.5v2.25a.75.75 0 01-1.5 0v-2.25z" />
    <path fillRule="evenodd" d="M2 7.25A.75.75 0 012.75 6.5h14.5a.75.75 0 01.75.75v9A.75.75 0 0117.25 17H2.75a.75.75 0 01-.75-.75v-9z" clipRule="evenodd" />
  </svg>
);

const GraduationCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-80">
    <path d="M7.843 2.454A1.5 1.5 0 006.5 3.962V4.5H3.75A2.25 2.25 0 001.5 6.75v8.5A2.25 2.25 0 003.75 17.5h12.5A2.25 2.25 0 0018.5 15.25v-8.5A2.25 2.25 0 0016.25 4.5h-2.75v-.538a1.5 1.5 0 00-1.343-1.508L10 2.19l-2.157.264z" />
    <path d="M6.508 13.498C6.836 13.197 7 12.73 7 12.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .48.164.947.492 1.25L3.125 16.25A.75.75 0 003.75 17.5h12.5a.75.75 0 00.625-1.25l-2.883-2.752c.328-.302.492-.77.492-1.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .48-.164.947-.492 1.25L10 15.43l-3.492-1.932z" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5">
    <path fillRule="evenodd" d="M12.207 2.207a4.5 4.5 0 00-6.364 6.364l6.364-6.364zm-6.364 6.364L2.207 12.207a4.5 4.5 0 106.364 6.364L12.207 14.935m0-6.364l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" clipRule="evenodd" />
  </svg>
);

const CodeBracketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 opacity-80">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);


// --- Settings Panel ---
export const PortfolioSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: PortfolioWidgetSettings | undefined;
  onSave: (newSettings: PortfolioWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [accentColor, setAccentColor] = useState(currentSettings?.accentColor || '#0ea5e9');
  const [showAnimatedBg, setShowAnimatedBg] = useState(currentSettings?.showAnimatedBackground === undefined ? true : currentSettings.showAnimatedBackground);

  const handleSaveSettings = () => {
    onSave({ accentColor, showAnimatedBackground: showAnimatedBg });
  };

  return (
    <div className="space-y-5 text-primary">
      <div>
        <label htmlFor={`portfolio-accent-color-${widgetId}`} className="block text-sm font-medium text-secondary mb-1.5">
          Accent Color:
        </label>
        <input
          type="color"
          id={`portfolio-accent-color-${widgetId}`}
          value={accentColor}
          onChange={(e) => setAccentColor(e.target.value)}
          className="w-full h-10 p-1 border-border-interactive rounded-md cursor-pointer bg-widget"
        />
      </div>
      <div>
        <label htmlFor={`portfolio-animated-bg-${widgetId}`} className="flex items-center text-sm font-medium text-secondary cursor-pointer">
          <input
            type="checkbox"
            id={`portfolio-animated-bg-${widgetId}`}
            checked={showAnimatedBg}
            onChange={(e) => setShowAnimatedBg(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2.5 bg-widget"
          />
          Show Subtle Animated Background
        </label>
      </div>
      <button
        onClick={handleSaveSettings}
        className="w-full mt-3 px-4 py-2.5 bg-accent-primary text-on-accent rounded-lg hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface transition-all duration-150 ease-in-out shadow-md hover:shadow-lg"
      >
        Save Portfolio Settings
      </button>
    </div>
  );
};

// --- Main PortfolioWidget Component ---
const PortfolioWidget: React.FC<PortfolioWidgetProps> = ({ settings }) => {
  const [isVisible, setIsVisible] = useState(false);
  const accentColor = settings?.accentColor || '#0ea5e9';
  const showAnimatedBackground = settings?.showAnimatedBackground === undefined ? true : settings.showAnimatedBackground;

  const name = "Broque Thomas";
  const role = "Full-Stack Web Developer";
  const university = "Southern Oregon University";
  const graduationYear = "2020";
  const previousCompany = "CherieYoung";
  const experienceDuration = "2020 - 2025";

  const skills = [
    "React", "Next.js", "TypeScript", "Node.js", "GraphQL", "PostgreSQL",
    "Tailwind CSS", "Firebase", "AWS", "Docker", "CI/CD", "Agile Methodologies", "RESTful APIs", "Git"
  ];

  const projects = [
    { name: "Widget Dashboard (This Project)", description: "A dynamic, customizable user dashboard with real-time widget updates, persistent layout, and a focus on interactive UI/UX.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "React Hooks"], link: "https://github.com/Nezreka/widget" },
    { name: "Template Designer", description: "A web-based application for users to visually create and customize document or UI templates with a drag-and-drop interface.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "Konva.js"], link: "https://github.com/Nezreka/Template-Designer" },
    { name: "Spotify Plex Playlist Sync", description: "A robust utility to seamlessly synchronize music playlists between Spotify and Plex media server environments.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "Spotify API", "Plex API"], link: "https://github.com/Nezreka/Spotify-Plex-Playlist-Sync" },
    { name: "Plex Music Meta", description: "An application designed to manage, enhance, and correct metadata for extensive music libraries within the Plex ecosystem.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "MusicBrainz API"], link: "https://github.com/Nezreka/Plex-Music-Meta" },
    { name: "Soundcraft Main", description: "The primary user interface and control software for Soundcraft digital audio mixing consoles, enabling professional audio management.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "WebSockets"], link: "https://github.com/Nezreka/Soundcraft-main" },
    { name: "E-commerce Optimization @ CherieYoung", description: "Led key initiatives to enhance performance and integrate new features for a high-traffic e-commerce platform, achieving a 15% uplift in conversion rates.", tech: ["React", "Node.js", "Microservices", "A/B Testing"], link: "#" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sectionTitleClass = "text-2xl md:text-3xl font-bold mb-5 md:mb-8 text-slate-100 flex items-center border-b-2 border-[var(--portfolio-accent-color)]/30 pb-3";
  const cardBaseClass = "bg-slate-800/70 backdrop-blur-md p-6 rounded-xl shadow-xl transition-all duration-300 ease-out hover:shadow-[0_0_30px_-5px_var(--portfolio-accent-color)] hover:ring-2 hover:ring-[var(--portfolio-accent-color)]";
  const textContentClass = "text-slate-300 leading-relaxed text-base";

  const getDelayClass = (index: number) => `delay-${index * 150}`;

  return (
    <div
      className={`w-full h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 overflow-hidden p-0 transition-opacity duration-1000 ease-in-out relative ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ '--portfolio-accent-color': accentColor, '--color-slate-700': 'hsl(222, 47%, 11%)', '--color-slate-800': 'hsl(222, 47%, 18%)' } as React.CSSProperties}
    >
      {showAnimatedBackground && (
        <div className="absolute inset-0 overflow-hidden -z-10 opacity-70">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[var(--portfolio-accent-color)]/5 rounded-full filter blur-3xl animate-pulse-slow "></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/5 rounded-full filter blur-3xl animate-pulse-slower animation-delay-2000"></div>
          <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-purple-600/5 rounded-full filter blur-3xl animate-pulse-medium animation-delay-4000"></div>
        </div>
      )}

      <header
        className={`p-6 md:p-10 bg-slate-900/60 backdrop-blur-lg shadow-2xl relative z-10 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'}`}
        style={{ borderBottom: `4px solid var(--portfolio-accent-color)` }}
      >
        <div className="max-w-6xl mx-auto text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight" style={{ color: 'var(--portfolio-accent-color)' }}>
            {name}
            </h1>
            <p className={`mt-3 text-xl md:text-2xl text-slate-200 font-light transition-all duration-700 ease-out ${getDelayClass(1)} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            {role}
            </p>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-12 md:space-y-16 scrollbar-thin scrollbar-thumb-[var(--portfolio-accent-color)]/60 scrollbar-track-slate-800/30 scrollbar-thumb-rounded-full relative z-0">
        <div className="max-w-6xl mx-auto">
            <section className={`transform transition-all duration-700 ease-out ${getDelayClass(2)} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className={sectionTitleClass}>
                <span className="w-2 h-8 rounded-sm mr-4" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
                About Me
            </h2>
            <p className={`${textContentClass} md:text-lg`}>
                A results-driven Full-Stack Web Developer with a proven ability to design, develop, and deploy sophisticated web applications. My expertise spans from crafting intuitive user interfaces with modern JavaScript frameworks to building robust server-side logic and managing databases. With a degree from {university} and significant contributions at {previousCompany}, I excel in collaborative environments, transforming complex requirements into elegant and efficient solutions. I am actively seeking a challenging role to leverage my skills in creating impactful technology and to contribute to a forward-thinking team.
            </p>
            </section>

            <div className="grid md:grid-cols-2 gap-x-10 gap-y-12 mt-12 md:mt-16">
            <section className={`transform transition-all duration-700 ease-out ${getDelayClass(3)} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <h2 className={sectionTitleClass}>
                <BriefcaseIcon /> <span className="ml-3">Experience</span>
                </h2>
                <div className={`${cardBaseClass} hover:-translate-y-1.5`}>
                <h3 className="text-xl lg:text-2xl font-semibold mb-1" style={{ color: 'var(--portfolio-accent-color)' }}>Web Developer</h3>
                <p className="text-slate-400 text-sm mb-1">{previousCompany}</p>
                <p className="text-slate-400 text-sm mb-4">{experienceDuration}</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-300">
                    <li>Engineered and maintained critical features for enterprise-level web applications, enhancing functionality and user engagement.</li>
                    <li>Actively participated in agile development cycles, contributing to sprint planning, daily stand-ups, and retrospectives.</li>
                    <li>Specialized in front-end architecture using React and Next.js, coupled with robust back-end solutions using Node.js.</li>
                    <li>Championed best practices in code quality, testing, and performance optimization.</li>
                </ul>
                </div>
            </section>

            <section className={`transform transition-all duration-700 ease-out ${getDelayClass(4)} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <h2 className={sectionTitleClass}>
                <GraduationCapIcon /> <span className="ml-3">Education</span>
                </h2>
                <div className={`${cardBaseClass} hover:-translate-y-1.5`}>
                <h3 className="text-xl lg:text-2xl font-semibold mb-1" style={{ color: 'var(--portfolio-accent-color)' }}>B.S. Computer Science</h3>
                <p className="text-slate-400 text-sm mb-1">{university}</p>
                <p className="text-slate-400 text-sm mb-4">Graduated: {graduationYear}</p>
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-300">
                    <li>Comprehensive curriculum in software engineering, algorithms, data structures, and web technologies.</li>
                    <li>Developed a full-stack web application for a capstone project, showcasing practical application of learned concepts.</li>
                    <li>Awarded Dean&apos;s List for academic excellence.</li>
                </ul>
                </div>
            </section>
            </div>

            <section className={`mt-12 md:mt-16 transform transition-all duration-700 ease-out ${getDelayClass(5)} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className={sectionTitleClass}>
                <CodeBracketIcon /> <span className="ml-3">Core Competencies</span>
            </h2>
            <div className="flex flex-wrap gap-3 md:gap-4">
                {skills.map((skill, index) => (
                <span
                    key={index}
                    className={`px-5 py-2.5 text-sm font-medium rounded-lg bg-slate-700/80 text-slate-100 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:text-white transform hover:-translate-y-0.5`}
                    style={{
                        backgroundColor: `color-mix(in srgb, var(--portfolio-accent-color) 18%, var(--color-slate-800))`,
                        border: `1px solid color-mix(in srgb, var(--portfolio-accent-color) 40%, transparent)`
                    }}
                >
                    {skill}
                </span>
                ))}
            </div>
            </section>

            <section className={`mt-12 md:mt-16 transform transition-all duration-700 ease-out ${getDelayClass(6)} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className={sectionTitleClass}>
                 <span className="w-2 h-8 rounded-sm mr-4" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
                Featured Projects
            </h2>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {projects.map((project, index) => (
                <div
                    key={index}
                    className={`${cardBaseClass} group flex flex-col justify-between hover:-translate-y-2`}
                >
                    <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--portfolio-accent-color)] transition-colors duration-300">{project.name}</h3>
                        <p className={`${textContentClass} text-sm mb-4 flex-grow`}>{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {project.tech.map(t => <span key={t} className="text-xs px-3 py-1 bg-slate-700 rounded-full text-slate-300 font-medium">{t}</span>)}
                        </div>
                    </div>
                    {project.link !== "#" && (
                        <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-semibold text-[var(--portfolio-accent-color)] hover:underline group mt-auto self-start transition-transform duration-200 hover:translate-x-1"
                        >
                            Explore Project <LinkIcon />
                        </a>
                    )}
                </div>
                ))}
            </div>
            </section>

            <footer className={`pt-12 md:pt-20 mt-auto text-center transform transition-all duration-1000 ease-out ${getDelayClass(7)} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <p className={`${textContentClass} text-xl md:text-2xl mb-6 font-light`}>
                Ready to build something amazing together?
            </p>
            <a
                href="mailto:broque.thomas.dev@example.com" // Intentionally a placeholder email
                className="inline-block px-10 py-4 text-lg font-semibold rounded-lg text-white shadow-xl transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[var(--portfolio-accent-color)]"
                style={{
                    backgroundColor: 'var(--portfolio-accent-color)',
                    boxShadow: `0 6px 20px 0 color-mix(in srgb, var(--portfolio-accent-color) 30%, transparent)`,
                }}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--portfolio-accent-color) 80%, black)`;
                    e.currentTarget.style.boxShadow = `0 8px 25px 0 color-mix(in srgb, var(--portfolio-accent-color) 40%, transparent)`;
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'var(--portfolio-accent-color)';
                    e.currentTarget.style.boxShadow = `0 6px 20px 0 color-mix(in srgb, var(--portfolio-accent-color) 30%, transparent)`;
                }}
            >
                Let&apos;s Connect
            </a>
            <p className="text-xs text-slate-500 mt-10">
                &copy; {new Date().getFullYear()} Broque Thomas. All rights reserved.
            </p>
            </footer>
        </div>
      </div>
    </div>
  );
};

export default PortfolioWidget;

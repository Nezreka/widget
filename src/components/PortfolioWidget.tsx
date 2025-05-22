// src/components/PortfolioWidget.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- Interfaces & Types ---
export interface PortfolioWidgetSettings {
  accentColor?: string;
  showAnimatedBackground?: boolean; // New setting for a subtle animated background
}

interface PortfolioWidgetProps {
  id: string;
  settings?: PortfolioWidgetSettings;
}

// --- Icons (Refined for a sleeker look) ---
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M3 4.25A2.25 2.25 0 015.25 2h9.5A2.25 2.25 0 0117 4.25v2a.75.75 0 01-1.5 0v-2H4.5v2.25a.75.75 0 01-1.5 0v-2.25z" />
    <path fillRule="evenodd" d="M1.5 10.25a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v7A2.25 2.25 0 0114.75 20h-9.5A2.25 2.25 0 013 17.25v-7a.75.75 0 01-.75-.75V6.5a.75.75 0 010-1.5v.25A2.25 2.25 0 015.25 3h9.5A2.25 2.25 0 0117 5.25v.25a.75.75 0 010 1.5V9.5a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-7A2.25 2.25 0 013.25 1H1.5V.75a.75.75 0 011.5 0V1h.25A2.25 2.25 0 016 3.25v11A2.25 2.25 0 013.75 16H2.25a.75.75 0 010-1.5H4V6H2.25a.75.75 0 01-.75-.75v-.5zM5.25 4.25h9.5V6h-9.5V4.25z" clipRule="evenodd" />
     <path d="M2 7.25A.75.75 0 012.75 6.5h14.5a.75.75 0 01.75.75v9A.75.75 0 0117.25 17H2.75a.75.75 0 01-.75-.75v-9z" />
  </svg>
);

const GraduationCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M7.843 2.454A1.5 1.5 0 006.5 3.962V4.5H3.75A2.25 2.25 0 001.5 6.75v8.5A2.25 2.25 0 003.75 17.5h12.5A2.25 2.25 0 0018.5 15.25v-8.5A2.25 2.25 0 0016.25 4.5h-2.75v-.538a1.5 1.5 0 00-1.343-1.508L10 2.19l-2.157.264z" />
    <path d="M6.508 13.498C6.836 13.197 7 12.73 7 12.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .48.164.947.492 1.25L3.125 16.25A.75.75 0 003.75 17.5h12.5a.75.75 0 00.625-1.25l-2.883-2.752c.328-.302.492-.77.492-1.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .48-.164.947-.492 1.25L10 15.43l-3.492-1.932z" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1 group-hover:animate-pulse">
    <path fillRule="evenodd" d="M12.207 2.207a4.5 4.5 0 00-6.364 6.364l6.364-6.364zm-6.364 6.364L2.207 12.207a4.5 4.5 0 106.364 6.364L12.207 14.935m0-6.364l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
);


// --- Settings Panel ---
export const PortfolioSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: PortfolioWidgetSettings | undefined;
  onSave: (newSettings: PortfolioWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [accentColor, setAccentColor] = useState(currentSettings?.accentColor || '#0ea5e9'); // Default to a sky blue
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
const PortfolioWidget: React.FC<PortfolioWidgetProps> = ({ id, settings }) => {
  const [isVisible, setIsVisible] = useState(false);
  const accentColor = settings?.accentColor || '#0ea5e9'; // Default sky blue
  const showAnimatedBackground = settings?.showAnimatedBackground === undefined ? true : settings.showAnimatedBackground;

  const name = "Broque Thomas";
  const role = "Full-Stack Web Developer";
  const university = "Southern Oregon University";
  const graduationYear = "2020";
  const previousCompany = "CherieYoung";
  const experienceDuration = "2020 - 2025"; 

  const skills = [
    "React", "Next.js", "TypeScript", "Node.js", "GraphQL", "PostgreSQL", 
    "Tailwind CSS", "Firebase", "AWS", "Docker", "CI/CD", "Agile Methodologies"
  ];
  const projects = [
    { name: "Dynamic Dashboard System", description: "Lead development of this highly interactive and customizable user dashboard, featuring real-time widget updates and a persistent layout.", tech: ["Next.js", "TypeScript", "Tailwind CSS"], link: "#" },
    { name: "E-commerce Optimization @ CherieYoung", description: "Spearheaded performance improvements and new feature integrations for a high-traffic e-commerce platform, resulting in a 15% increase in conversion rates.", tech: ["React", "Node.js", "Microservices"], link: "#" },
    { name: "Open Source Contribution: UI Kit", description: "Contributed to a popular open-source UI component library, focusing on accessibility and themeability.", tech: ["TypeScript", "Storybook"], link: "https://github.com/example/ui-kit" }, // Replace with actual link
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced styling classes
  const sectionTitleClass = "text-2xl md:text-3xl font-semibold mb-4 md:mb-6 text-slate-100 flex items-center";
  const cardBaseClass = "bg-slate-800/60 backdrop-blur-sm p-5 md:p-6 rounded-xl shadow-lg transition-all duration-300 ease-out hover:shadow-2xl";
  const textContentClass = "text-slate-300 leading-relaxed";
  
  // Staggered animation helper
  const getDelayClass = (index: number) => `delay-${index * 100}`;

  return (
    <div 
      className={`w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 overflow-hidden p-0 transition-opacity duration-1000 ease-in-out relative ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ '--portfolio-accent-color': accentColor } as React.CSSProperties}
    >
      {showAnimatedBackground && (
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--portfolio-accent-color)]/10 rounded-full filter blur-3xl animate-pulse-slow opacity-50"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full filter blur-3xl animate-pulse-slower opacity-40 animation-delay-2000"></div>
           <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-purple-500/5 rounded-full filter blur-2xl animate-pulse-medium opacity-30 animation-delay-4000"></div>
        </div>
      )}

      {/* Header Section */}
      <header 
        className={`p-6 md:p-8 bg-slate-900/70 backdrop-blur-md shadow-xl relative z-10 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}
        style={{ borderBottom: `3px solid var(--portfolio-accent-color)` }}
      >
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight" style={{ color: 'var(--portfolio-accent-color)' }}>
            {name}
            </h1>
            <p className={`mt-2 text-lg md:text-xl text-slate-300 transition-all duration-700 ease-out ${getDelayClass(1)} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}`}>
            {role}
            </p>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-10 md:space-y-12 scrollbar-thin scrollbar-thumb-[var(--portfolio-accent-color)]/70 scrollbar-track-slate-800/50 relative z-0">
        <div className="max-w-5xl mx-auto">
            {/* About / Bio Section */}
            <section className={`transform transition-all duration-700 ease-out ${getDelayClass(2)} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <h2 className={sectionTitleClass}>
                <span className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
                About Me
            </h2>
            <p className={`${textContentClass} text-base md:text-lg`}>
                A results-oriented Web Developer with a passion for crafting elegant, high-performance digital experiences. 
                With a solid foundation from {university} and hands-on experience at {previousCompany}, I thrive on solving complex problems 
                and building intuitive applications. I'm currently seeking a challenging role where I can contribute to innovative projects and grow alongside a talented team.
            </p>
            </section>

            {/* Experience & Education Section */}
            <div className="grid md:grid-cols-2 gap-8 mt-10 md:mt-12">
            <section className={`transform transition-all duration-700 ease-out ${getDelayClass(3)} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <h2 className={sectionTitleClass}>
                <BriefcaseIcon /> <span className="ml-3">Experience</span>
                </h2>
                <div className={`${cardBaseClass} hover:ring-2 hover:ring-[var(--portfolio-accent-color)]/50`}>
                <h3 className="text-xl font-medium mb-1" style={{ color: 'var(--portfolio-accent-color)' }}>Web Developer</h3>
                <p className="text-slate-400 text-sm mb-1">{previousCompany}</p>
                <p className="text-slate-400 text-sm mb-3">{experienceDuration}</p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300">
                    <li>Developed and maintained critical features for large-scale web applications.</li>
                    <li>Collaborated in agile teams to deliver high-quality software solutions.</li>
                    <li>Focused on front-end architecture, API design, and user experience optimization.</li>
                </ul>
                </div>
            </section>

            <section className={`transform transition-all duration-700 ease-out ${getDelayClass(4)} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <h2 className={sectionTitleClass}>
                <GraduationCapIcon /> <span className="ml-3">Education</span>
                </h2>
                <div className={`${cardBaseClass} hover:ring-2 hover:ring-[var(--portfolio-accent-color)]/50`}>
                <h3 className="text-xl font-medium mb-1" style={{ color: 'var(--portfolio-accent-color)' }}>B.S. Computer Science</h3>
                <p className="text-slate-400 text-sm mb-1">{university}</p>
                <p className="text-slate-400 text-sm mb-3">Graduated: {graduationYear}</p>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300">
                    <li>Coursework focused on software engineering, web development, and data structures.</li>
                    <li>Completed a capstone project involving a full-stack web application.</li>
                    <li>Active member of the university coding club.</li>
                </ul>
                </div>
            </section>
            </div>

            {/* Skills Section */}
            <section className={`mt-10 md:mt-12 transform transition-all duration-700 ease-out ${getDelayClass(5)} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <h2 className={sectionTitleClass}>
                <span className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
                Core Competencies
            </h2>
            <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                <span 
                    key={index} 
                    className={`px-4 py-2 text-sm rounded-lg bg-slate-700/70 text-slate-200 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:text-white`}
                    style={{
                        backgroundColor: `color-mix(in srgb, var(--portfolio-accent-color) 15%, var(--color-slate-700))`,
                        border: `1px solid color-mix(in srgb, var(--portfolio-accent-color) 30%, transparent)`
                    }}
                >
                    {skill}
                </span>
                ))}
            </div>
            </section>

            {/* Projects Section */}
            <section className={`mt-10 md:mt-12 transform transition-all duration-700 ease-out ${getDelayClass(6)} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <h2 className={sectionTitleClass}>
                 <span className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
                Featured Projects
            </h2>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((project, index) => (
                <div 
                    key={index} 
                    className={`${cardBaseClass} group flex flex-col justify-between hover:ring-2 hover:ring-[var(--portfolio-accent-color)]/60 hover:-translate-y-1`}
                >
                    <div>
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--portfolio-accent-color)] transition-colors duration-300">{project.name}</h3>
                        <p className={`${textContentClass} text-sm mb-3`}>{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {project.tech.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-slate-700 rounded-full text-slate-300">{t}</span>)}
                        </div>
                    </div>
                    {project.link !== "#" && (
                        <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center text-sm font-medium text-[var(--portfolio-accent-color)] hover:underline group mt-auto"
                        >
                            Explore Project <ChevronRightIcon />
                        </a>
                    )}
                </div>
                ))}
            </div>
            </section>

            {/* Contact / Footer */}
            <footer className={`pt-10 md:pt-16 mt-auto text-center transform transition-all duration-1000 ease-out ${getDelayClass(7)} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <p className={`${textContentClass} text-base md:text-lg mb-4`}>
                Ready to build something amazing together?
            </p>
            <a 
                href="mailto:broque.thomas.dev@example.com" // Replace with your actual email
                className="inline-block px-8 py-3 text-base font-semibold rounded-lg text-white shadow-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
                style={{ 
                    backgroundColor: 'var(--portfolio-accent-color)',
                    boxShadow: `0 4px 14px 0 color-mix(in srgb, var(--portfolio-accent-color) 40%, transparent)`
                }}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--portfolio-accent-color) 85%, black)`;
                    e.currentTarget.style.boxShadow = `0 6px 20px 0 color-mix(in srgb, var(--portfolio-accent-color) 50%, transparent)`;
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'var(--portfolio-accent-color)';
                    e.currentTarget.style.boxShadow = `0 4px 14px 0 color-mix(in srgb, var(--portfolio-accent-color) 40%, transparent)`;
                }}
            >
                Let's Connect
            </a>
            <p className="text-xs text-slate-500 mt-8">
                &copy; {new Date().getFullYear()} Broque Thomas. All rights reserved.
            </p>
            </footer>
        </div>
      </div>
    </div>
  );
};

export default PortfolioWidget;
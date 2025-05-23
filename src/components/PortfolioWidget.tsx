// src/components/PortfolioWidget.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- Interfaces & Types ---
export interface PortfolioWidgetSettings {
  accentColor?: string;
  showAnimatedBackground?: boolean;
}

interface PortfolioWidgetProps {
  settings?: PortfolioWidgetSettings;
  // Add a prop to inform the widget if it's in a mobile-first, full-span context
  // This helps decide initial project visibility if needed, though the button handles most of it.
  isMobileFullScreen?: boolean;
}

// --- Icons (Refined for a sleeker look) ---
const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${className} opacity-80`}>
    <path d="M3 4.25A2.25 2.25 0 015.25 2h9.5A2.25 2.25 0 0117 4.25v2a.75.75 0 01-1.5 0v-2H4.5v2.25a.75.75 0 01-1.5 0v-2.25z" />
    <path fillRule="evenodd" d="M2 7.25A.75.75 0 012.75 6.5h14.5a.75.75 0 01.75.75v9A.75.75 0 0117.25 17H2.75a.75.75 0 01-.75-.75v-9z" clipRule="evenodd" />
  </svg>
);

const GraduationCapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${className} opacity-80`}>
    <path d="M7.843 2.454A1.5 1.5 0 006.5 3.962V4.5H3.75A2.25 2.25 0 001.5 6.75v8.5A2.25 2.25 0 003.75 17.5h12.5A2.25 2.25 0 0018.5 15.25v-8.5A2.25 2.25 0 0016.25 4.5h-2.75v-.538a1.5 1.5 0 00-1.343-1.508L10 2.19l-2.157.264z" />
    <path d="M6.508 13.498C6.836 13.197 7 12.73 7 12.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .48.164.947.492 1.25L3.125 16.25A.75.75 0 003.75 17.5h12.5a.75.75 0 00.625-1.25l-2.883-2.752c.328-.302.492-.77.492-1.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .48-.164.947-.492 1.25L10 15.43l-3.492-1.932z" />
  </svg>
);

const LinkIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`${className} ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5`}>
    <path fillRule="evenodd" d="M12.207 2.207a4.5 4.5 0 00-6.364 6.364l6.364-6.364zm-6.364 6.364L2.207 12.207a4.5 4.5 0 106.364 6.364L12.207 14.935m0-6.364l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" clipRule="evenodd" />
  </svg>
);

const CodeBracketIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} opacity-80`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

const ChevronUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
    </svg>
);


// --- Settings Panel ---
export const PortfolioSettingsPanel: React.FC<{
  widgetId: string;
  currentSettings: PortfolioWidgetSettings | undefined;
  onSave: (newSettings: PortfolioWidgetSettings) => void;
}> = ({ widgetId, currentSettings, onSave }) => {
  const [accentColor, setAccentColor] = useState(currentSettings?.accentColor || '#0ea5e9'); // sky-500
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
const PortfolioWidget: React.FC<PortfolioWidgetProps> = ({ settings, isMobileFullScreen }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [widgetSize, setWidgetSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  // State to manage showing all projects, especially for compact/mobile view
  const [showAllProjects, setShowAllProjects] = useState(false);

  const accentColor = settings?.accentColor || '#0ea5e9'; // Default to sky-500
  const showAnimatedBackground = settings?.showAnimatedBackground === undefined ? true : settings.showAnimatedBackground;

  const name = "Broque Thomas";
  const role = "Full-Stack Web Developer";
  const university = "Southern Oregon University";
  const graduationYear = "2020";
  const previousCompany = "CherieYoung";
  const experienceDuration = "2020 - 2025";

  const skills = [
    "React", "Next.js", "TypeScript", "Node.js", "GraphQL", "PostgreSQL",
    "Tailwind CSS", "Firebase", "AWS", "Docker", "CI/CD", "Agile", "REST APIs", "Git"
  ];

  const projects = [
    { name: "Widget Dashboard (This Project)", description: "A dynamic, customizable user dashboard with real-time widget updates, persistent layout, and a focus on interactive UI/UX.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "React Hooks"], link: "https://github.com/Nezreka/widget" },
    { name: "Template Designer", description: "A web-based application for users to visually create and customize document or UI templates with a drag-and-drop interface.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "Konva.js"], link: "https://github.com/Nezreka/Template-Designer" },
    { name: "Spotify Plex Playlist Sync", description: "A robust utility to seamlessly synchronize music playlists between Spotify and Plex media server environments.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "Spotify API", "Plex API"], link: "https://github.com/Nezreka/Spotify-Plex-Playlist-Sync" },
    { name: "Plex Music Meta", description: "An application designed to manage, enhance, and correct metadata for extensive music libraries within the Plex ecosystem.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "MusicBrainz API"], link: "https://github.com/Nezreka/Plex-Music-Meta" },
    { name: "Soundcraft Main", description: "The primary user interface and control software for Soundcraft digital audio mixing consoles, enabling professional audio management.", tech: ["Next.js", "TypeScript", "Tailwind CSS", "WebSockets"], link: "https://github.com/Nezreka/Soundcraft-main" },
    { name: "E-commerce Optimization @ CherieYoung", description: "Led key initiatives to enhance performance and integrate new features for a high-traffic e-commerce platform, achieving a 15% uplift in conversion rates.", tech: ["React", "Node.js", "Microservices", "A/B Testing"], link: "#" },
  ];

  // --- Responsive Layout Logic ---
  const BREAKPOINTS = {
    COMPACT_WIDTH: 350,    // approx 11-12 cells * 30px
    DEFAULT_WIDTH: 600,    // approx 20 cells * 30px
    COMPACT_HEIGHT: 400,   // approx 13 cells * 30px
    DEFAULT_HEIGHT: 550,  // approx 18 cells * 30px
  };

  let layoutMode: 'compact' | 'default' | 'detailed' = 'detailed';
  // If isMobileFullScreen is true, we might want to force 'detailed' or a specific mobile-optimized 'detailed' view
  // For now, existing logic will apply, but button will override project list
  if (widgetSize.width < BREAKPOINTS.COMPACT_WIDTH || widgetSize.height < BREAKPOINTS.COMPACT_HEIGHT) {
    layoutMode = 'compact';
  } else if (widgetSize.width < BREAKPOINTS.DEFAULT_WIDTH || widgetSize.height < BREAKPOINTS.DEFAULT_HEIGHT) {
    layoutMode = 'default';
  }
  
  // If it's mobile full screen and compact mode, allow showing all projects via button
  // This ensures that even in compact mode (due to widgetSize), the button can reveal all projects
  const canToggleAllProjects = layoutMode === 'compact' || isMobileFullScreen;


  useEffect(() => {
    const element = widgetRef.current;
    if (!element) return;

    setWidgetSize({ width: element.offsetWidth, height: element.offsetHeight });

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidgetSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    resizeObserver.observe(element);
    return () => resizeObserver.unobserve(element);
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getDelayClass = (index: number, baseDelay = 100) => `delay-${index * baseDelay}`;
  const animatedEntryClass = (index: number, baseDelay = 150) =>
    `transform transition-all duration-700 ease-out ${getDelayClass(index, baseDelay)} ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`;

  // --- Common Styling Classes ---
  const sectionTitleBaseClass = "font-bold text-slate-100 flex items-center border-b-2 pb-2 mb-4";
  const sectionTitleStyle = (size: 'compact' | 'default' | 'detailed') => {
    let s = "text-xl";
    if (size === 'default') s = "text-2xl";
    if (size === 'detailed') s = "text-3xl";
    return `${sectionTitleBaseClass} ${s} border-[var(--portfolio-accent-color)]/40`;
  };

  const cardBaseClass = "bg-slate-800/60 backdrop-blur-md p-4 rounded-xl shadow-xl transition-all duration-300 ease-out hover:shadow-[0_0_35px_-7px_var(--portfolio-accent-color)] hover:ring-2 hover:ring-[var(--portfolio-accent-color)]/80";
  const textContentClass = "text-slate-300 leading-relaxed";


  // --- Render Functions for Layout Modes ---

  const renderHeader = () => (
    <header
      className={`p-4 md:p-6 bg-slate-900/50 backdrop-blur-lg shadow-2xl relative z-10 transform transition-all duration-1000 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
      style={{ borderBottom: `3px solid var(--portfolio-accent-color)` }}
    >
      <div className={`max-w-6xl mx-auto text-center ${layoutMode !== 'compact' ? 'md:text-left' : ''}`}>
          <h1 className={`font-extrabold tracking-tight ${layoutMode === 'compact' ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'}`} style={{ color: 'var(--portfolio-accent-color)' }}>
          {name}
          </h1>
          <p className={`mt-1.5 font-light text-slate-200 ${layoutMode === 'compact' ? 'text-md' : 'text-lg md:text-xl'} ${animatedEntryClass(1, 100)}`}>
          {role}
          </p>
      </div>
    </header>
  );

  const renderAboutMe = () => (
    <section className={animatedEntryClass(2)}>
      <h2 className={sectionTitleStyle(layoutMode)}>
          <span className="w-1.5 h-6 rounded-sm mr-3" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
          About Me
      </h2>
      <p className={`${textContentClass} ${layoutMode === 'detailed' ? 'md:text-lg' : 'text-sm'}`}>
          A results-driven Full-Stack Developer with a passion for creating elegant and efficient solutions. My expertise spans modern JavaScript frameworks, robust back-end logic, and cloud technologies. I thrive in collaborative environments, transforming complex challenges into impactful web applications.
          {layoutMode === 'compact' && " Seeking new opportunities..."}
          {(layoutMode === 'default' || layoutMode === 'detailed') && ` With a degree from ${university} and significant contributions at ${previousCompany}, I am actively seeking a challenging role to leverage my skills and contribute to a forward-thinking team.`}
      </p>
    </section>
  );

  const renderExperienceAndEducation = () => (
    <div className={`grid ${layoutMode === 'detailed' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-x-8 gap-y-8`}>
      <section className={animatedEntryClass(3)}>
          <h2 className={sectionTitleStyle(layoutMode)}>
          <BriefcaseIcon className={layoutMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} /> <span className="ml-2.5">Experience</span>
          </h2>
          <div className={`${cardBaseClass} hover:-translate-y-1`}>
          <h3 className={`font-semibold mb-0.5 ${layoutMode === 'compact' ? 'text-md' : 'text-lg lg:text-xl'}`} style={{ color: 'var(--portfolio-accent-color)' }}>Web Developer</h3>
          <p className={`text-slate-400 mb-0.5 ${layoutMode === 'compact' ? 'text-xs' : 'text-sm'}`}>{previousCompany}</p>
          <p className={`text-slate-400 mb-2 ${layoutMode === 'compact' ? 'text-xs' : 'text-sm'}`}>{experienceDuration}</p>
          {(layoutMode === 'default' || layoutMode === 'detailed') && (
            <ul className={`list-disc list-inside space-y-1.5 text-slate-300 text-sm`}>
                <li>Engineered critical features for enterprise web applications.</li>
                <li>Specialized in React, Next.js, and Node.js solutions.</li>
                <li>Championed code quality and performance optimization.</li>
            </ul>
          )}
          </div>
      </section>

      <section className={animatedEntryClass(4)}>
          <h2 className={sectionTitleStyle(layoutMode)}>
          <GraduationCapIcon className={layoutMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} /> <span className="ml-2.5">Education</span>
          </h2>
          <div className={`${cardBaseClass} hover:-translate-y-1`}>
          <h3 className={`font-semibold mb-0.5 ${layoutMode === 'compact' ? 'text-md' : 'text-lg lg:text-xl'}`} style={{ color: 'var(--portfolio-accent-color)' }}>B.S. Computer Science</h3>
          <p className={`text-slate-400 mb-0.5 ${layoutMode === 'compact' ? 'text-xs' : 'text-sm'}`}>{university}</p>
          <p className={`text-slate-400 mb-2 ${layoutMode === 'compact' ? 'text-xs' : 'text-sm'}`}>Graduated: {graduationYear}</p>
          {(layoutMode === 'default' || layoutMode === 'detailed') && (
            <ul className={`list-disc list-inside space-y-1.5 text-slate-300 text-sm`}>
                <li>Curriculum: Software engineering, algorithms, web tech.</li>
                <li>Capstone: Full-stack web application development.</li>
                <li>Awarded Dean&apos;s List for academic excellence.</li>
            </ul>
          )}
          </div>
      </section>
    </div>
  );

  const renderSkills = () => (
    <section className={animatedEntryClass(5)}>
      <h2 className={sectionTitleStyle(layoutMode)}>
          <CodeBracketIcon className={layoutMode === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} /> <span className="ml-2.5">Core Competencies</span>
      </h2>
      <div className="flex flex-wrap gap-2 md:gap-3">
          {skills.slice(0, layoutMode === 'compact' ? 6 : skills.length).map((skill, index) => (
          <span
              key={index}
              className={`font-medium rounded-md bg-slate-700/70 text-slate-100 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:text-white transform hover:-translate-y-px
                          ${layoutMode === 'compact' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'}`}
              style={{
                  backgroundColor: `color-mix(in srgb, var(--portfolio-accent-color) 15%, var(--color-slate-800))`,
                  border: `1px solid color-mix(in srgb, var(--portfolio-accent-color) 30%, transparent)`
              }}
          >
              {skill}
          </span>
          ))}
          {layoutMode === 'compact' && skills.length > 6 && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-700/70 text-slate-300 shadow-md">... more</span>
          )}
      </div>
    </section>
  );

  const renderProjects = () => {
    // Determine how many projects to show based on layoutMode and showAllProjects state
    let projectsToShow = projects;
    if (canToggleAllProjects && !showAllProjects) {
        projectsToShow = projects.slice(0, 1); // Show 1 project if compact and not "showAll"
    } else if (layoutMode === 'default' && !showAllProjects) { // Keep default behavior if not compact
        projectsToShow = projects.slice(0, 2);
    }
    // If showAllProjects is true, or if it's detailed mode, show all projects.

    return (
        <section className={animatedEntryClass(6)}>
        <h2 className={sectionTitleStyle(layoutMode)}>
            <span className="w-1.5 h-6 rounded-sm mr-3" style={{backgroundColor: 'var(--portfolio-accent-color)'}}></span>
            Featured Projects
        </h2>
        <div className={`grid gap-4 md:gap-6 ${layoutMode === 'detailed' || showAllProjects ? 'lg:grid-cols-2 xl:grid-cols-3' : layoutMode === 'default' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {projectsToShow.map((project, index) => (
            <div
                key={index}
                className={`${cardBaseClass} group flex flex-col justify-between hover:-translate-y-1.5`}
            >
                <div>
                    <h3 className={`font-bold mb-1 group-hover:text-[var(--portfolio-accent-color)] transition-colors duration-300 ${layoutMode === 'compact' && !showAllProjects ? 'text-lg' : 'text-xl'}`}>{project.name}</h3>
                    <p className={`${textContentClass} mb-3 flex-grow ${layoutMode === 'compact' && !showAllProjects ? 'text-xs' : 'text-sm'}`}>
                        {layoutMode === 'compact' && !showAllProjects && project.description.length > 100 ? project.description.substring(0,100) + "..." : project.description}
                    </p>
                    {(layoutMode === 'default' || layoutMode === 'detailed' || showAllProjects) && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {project.tech.slice(0, (layoutMode === 'default' && !showAllProjects) ? 3: project.tech.length).map(t => <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-700 rounded-full text-slate-300 font-medium">{t}</span>)}
                            {(layoutMode === 'default' && !showAllProjects) && project.tech.length > 3 && <span className="text-[10px] px-2 py-0.5 bg-slate-700 rounded-full text-slate-300 font-medium">...</span>}
                        </div>
                    )}
                </div>
                {project.link !== "#" && (
                    <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center font-semibold text-[var(--portfolio-accent-color)] hover:underline group mt-auto self-start transition-transform duration-200 hover:translate-x-0.5 ${layoutMode === 'compact' && !showAllProjects ? 'text-xs' : 'text-sm'}`}
                    >
                        Explore Project <LinkIcon className={layoutMode === 'compact' && !showAllProjects ? 'w-3 h-3' : 'w-4 h-4'} />
                    </a>
                )}
            </div>
            ))}
        </div>
        </section>
    );
  };


  const renderFooter = () => (
    <footer className={`pt-8 md:pt-12 mt-auto text-center ${animatedEntryClass(7)}`}>
      <p className={`${textContentClass} mb-4 font-light ${layoutMode === 'compact' ? 'text-sm' : 'text-lg md:text-xl'}`}>
          Ready to build something amazing?
      </p>
      <a
          href="mailto:broque.thomas.dev@example.com"
          className={`inline-block font-semibold rounded-lg text-white shadow-xl transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-[var(--portfolio-accent-color)]
                      ${layoutMode === 'compact' ? 'px-6 py-2.5 text-sm' : 'px-8 py-3 text-md md:text-lg'}`}
          style={{
              backgroundColor: 'var(--portfolio-accent-color)',
              boxShadow: `0 5px 15px 0 color-mix(in srgb, var(--portfolio-accent-color) 25%, transparent)`,
          }}
          onMouseOver={e => {
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--portfolio-accent-color) 85%, black)`;
              e.currentTarget.style.boxShadow = `0 7px 20px 0 color-mix(in srgb, var(--portfolio-accent-color) 35%, transparent)`;
          }}
          onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'var(--portfolio-accent-color)';
              e.currentTarget.style.boxShadow = `0 5px 15px 0 color-mix(in srgb, var(--portfolio-accent-color) 25%, transparent)`;
          }}
      >
          Let&apos;s Connect
      </a>
      <p className={`mt-8 text-slate-500 ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
          &copy; {new Date().getFullYear()} Broque Thomas. All rights reserved.
      </p>
    </footer>
  );


  return (
    <div
      ref={widgetRef}
      className={`w-full h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-slate-100 overflow-hidden p-0 transition-opacity duration-1000 ease-in-out relative ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ '--portfolio-accent-color': accentColor, '--color-slate-800': 'hsl(222, 47%, 18%)' } as React.CSSProperties}
    >
      {showAnimatedBackground && (
        <div className="absolute inset-0 overflow-hidden -z-10 opacity-60">
          <div className="absolute -top-1/3 -left-1/3 w-3/5 h-3/5 bg-[var(--portfolio-accent-color)]/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-4/5 h-4/5 bg-pink-500/10 rounded-full filter blur-3xl animate-pulse-slower animation-delay-2000"></div>
          <div className="absolute top-1/4 left-1/2 w-2/5 h-2/5 bg-purple-600/10 rounded-full filter blur-3xl animate-pulse-medium animation-delay-4000"></div>
        </div>
      )}

      {renderHeader()}

      <div className={`flex-grow overflow-y-auto space-y-8 md:space-y-12 scrollbar-thin scrollbar-thumb-[var(--portfolio-accent-color)]/50 scrollbar-track-slate-800/20 scrollbar-thumb-rounded-full relative z-0
                      ${layoutMode === 'compact' ? 'p-4' : 'p-6 md:p-8'}`}>
        <div className="max-w-6xl mx-auto">
            {renderAboutMe()}
            {/* Conditionally render Experience/Education and Skills based on layoutMode OR if showAllProjects is true for mobile */}
            {(layoutMode === 'default' || layoutMode === 'detailed' || (canToggleAllProjects && showAllProjects) ) && (
                <>
                    <div className={`mt-8 md:mt-12 ${layoutMode === 'detailed' || (canToggleAllProjects && showAllProjects) ? '' : 'space-y-8'}`}>
                        {renderExperienceAndEducation()}
                    </div>
                    <div className="mt-8 md:mt-12">{renderSkills()}</div>
                </>
            )}
            
            <div className="mt-8 md:mt-12">{renderProjects()}</div>

            {/* "View/Hide Full Portfolio" button for compact mode or mobile full screen */}
            {canToggleAllProjects && (
                <button
                    onClick={() => setShowAllProjects(prev => !prev)}
                    className="mt-6 w-full text-sm py-2.5 rounded-lg bg-[var(--portfolio-accent-color)]/80 hover:bg-[var(--portfolio-accent-color)] text-white font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                >
                    {showAllProjects ? 'Show Less' : 'View Full Portfolio'}
                    {showAllProjects ? <ChevronUpIcon className="ml-2 w-4 h-4" /> : <ChevronDownIcon className="ml-2 w-4 h-4" />}
                </button>
            )}
            {renderFooter()}
        </div>
      </div>
       <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--portfolio-accent-color); opacity: 0.6; border-radius: 10px; border: 1px solid rgba(0,0,0,0.2); }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { opacity: 0.8; }

        @keyframes pulse-slow { 0%, 100% { opacity: 0.8; transform: scale(1) rotate(0deg) translateX(0) translateY(0); } 50% { opacity: 0.5; transform: scale(1.15) rotate(7deg) translateX(10px) translateY(5px); } }
        .animate-pulse-slow { animation: pulse-slow 15s infinite ease-in-out; }
        @keyframes pulse-slower { 0%, 100% { opacity: 0.7; transform: scale(1) rotate(0deg) translateX(0) translateY(0); } 50% { opacity: 0.4; transform: scale(1.1) rotate(-7deg) translateX(-10px) translateY(-5px); } }
        .animate-pulse-slower { animation: pulse-slower 18s infinite ease-in-out; }
        @keyframes pulse-medium { 0%, 100% { opacity: 0.6; transform: scale(1) translateX(0) translateY(0); } 50% { opacity: 0.3; transform: scale(1.08) translateX(5px) translateY(10px); } }
        .animate-pulse-medium { animation: pulse-medium 12s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default PortfolioWidget;

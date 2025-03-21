import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icons } from "./Icons";
import { Helmet } from "react-helmet";

export const Header: React.FC = () => {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setResourcesOpen(false);
        setCommunityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Ainime</title>
      </Helmet>
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background py-2 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo and Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src=""
                alt="Ainime Logo"
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-foreground">Ainime</span>
            </Link>
          </div>

          {/* Links Section */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Marketplace Link */}
            <div className="relative">
              <Link to="/marketplace" className="flex items-center text-sm font-medium text-foreground hover:text-primary-hover transition-colors">
                <span>Marketplace</span>
                <div className="ml-2 rounded-full bg-accent-pink px-2 py-0.5 text-xs font-medium text-accent-pink-foreground">
                  <span>Coming Soon</span>
                </div>
              </Link>
            </div>

            {/* Docs Link */}
            <a 
              href="https://docs.langflow.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-primary-hover transition-colors"
            >
              <span>Docs</span>
            </a>

            {/* Resources Dropdown */}
            <div className="dropdown-container relative">
              <button 
                className="flex items-center text-sm font-medium text-foreground hover:text-primary-hover transition-colors"
                onClick={() => {
                  setResourcesOpen(!resourcesOpen);
                  setCommunityOpen(false);
                }}
              >
                <span>Resources</span>
                <div className={`ml-1 transition-transform duration-200 ${resourcesOpen ? 'rotate-90' : ''}`}>
                  <Icons.ChevronRight className="h-4 w-4" />
                </div>
              </button>
              {resourcesOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-background py-1 shadow-lg">
                  <a href="https://github.com/langflow-ai/langflow" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted">
                    <Icons.Github className="mr-2 h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                  <a href="https://docs.langflow.org/getting-started" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted">
                    <Icons.Globe className="mr-2 h-4 w-4" />
                    <span>Getting Started</span>
                  </a>
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div className="dropdown-container relative">
              <button 
                className="flex items-center text-sm font-medium text-foreground hover:text-primary-hover transition-colors"
                onClick={() => {
                  setCommunityOpen(!communityOpen);
                  setResourcesOpen(false);
                }}
              >
                <span>Community</span>
                <div className={`ml-1 transition-transform duration-200 ${communityOpen ? 'rotate-90' : ''}`}>
                  <Icons.ChevronRight className="h-4 w-4" />
                </div>
              </button>
              {communityOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-background py-1 shadow-lg">
                  <a href="https://discord.gg/EqksyE2EX9" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted">
                    <Icons.Discord className="mr-2 h-4 w-4" />
                    <span>Discord</span>
                  </a>
                  <a href="https://twitter.com/langflow_ai" target="_blank" rel="noopener noreferrer" 
                     className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted">
                    <Icons.Twitter className="mr-2 h-4 w-4" />
                    <span>Twitter</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Icons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Discord Link */}
            <a 
              href="https://bit.ly/langflow" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-foreground hover:text-primary-hover transition-colors"
            >
              <div className="flex items-center justify-center rounded-full bg-muted p-1">
                <Icons.Discord className="h-4 w-4" />
              </div>
              <span className="ml-1 text-xs font-medium">3.2k</span>
            </a>

            {/* YouTube Link */}
            <a 
              href="https://www.youtube.com/@Langflow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-sm text-foreground hover:text-primary-hover transition-colors"
            >
              <div className="flex items-center justify-center rounded-full bg-muted p-1">
                <Icons.YouTube className="h-4 w-4" />
              </div>
              <span className="ml-1 text-xs font-medium">6k</span>
            </a>
          </div>

          {/* Mobile menu button - only shown on small screens */}
          <div className="md:hidden">
            <button className="flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted">
              <Icons.Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Icon components for features
function CodeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function GitBranchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6zM6 18a3 3 0 100-6 3 3 0 000 6zm0-6v-6m12 0v6m-6 6a3 3 0 100-6 3 3 0 000 6zm0-6v6" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

// Feature data
const features = [
  {
    icon: <CodeIcon />,
    title: "Build in Public",
    description: "Share your progress, ideas, and code with the developer community. Every commit tells your story."
  },
  {
    icon: <UsersIcon />,
    title: "Find Collaborators",
    description: "Connect with like-minded developers. Join project spaces or find contributors for your own projects."
  },
  {
    icon: <RocketIcon />,
    title: "Launch Products",
    description: "Showcase your launches to the community. Get feedback, reviews, and early adopters from fellow builders."
  },
  {
    icon: <BriefcaseIcon />,
    title: "Freelance Marketplace",
    description: "Find work or hire developers based on real proof-of-work, not just resumes."
  },
  {
    icon: <GitBranchIcon />,
    title: "Private Git Repos",
    description: "Host your code with built-in version control. Collaborate on private repos within your project spaces."
  },
  {
    icon: <MessageIcon />,
    title: "Developer Q&A",
    description: "Ask technical questions and share knowledge. Build your reputation by helping others solve problems."
  }
];

// How it works steps
const steps = [
  {
    step: "01",
    title: "Create Your Profile",
    description: "Set up your proof-of-work profile showcasing your skills, projects, and tech stack."
  },
  {
    step: "02",
    title: "Share Your Journey",
    description: "Post updates, progress, and ideas. Build your developer identity through real contributions."
  },
  {
    step: "03",
    title: "Collaborate & Ship",
    description: "Join project spaces, find collaborators, and ship products together."
  },
  {
    step: "04",
    title: "Get Discovered",
    description: "Get noticed by companies and collaborators based on your actual work, not keywords."
  }
];

// Testimonials/Stats
const stats = [
  { value: "Proof-of-Work", label: "Based Profiles" },
  { value: "Real-Time", label: "Collaboration" },
  { value: "Open Source", label: "Friendly" },
  { value: "Developer", label: "First Platform" }
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                <span className="text-zinc-950 font-bold text-sm">LD</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">LogoutDev</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">How it works</a>
              <a href="#why" className="text-sm text-zinc-400 hover:text-white transition-colors">Why LogoutDev</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-violet-600/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/50 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-zinc-400">The proof-of-work network for developers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            Where developers
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              build in public
            </span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A proof-of-work platform where developers share projects, collaborate on spaces, 
            launch products, and get hired based on <span className="text-white font-medium">real contributions</span>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-zinc-950 hover:bg-zinc-100 transition-all hover:scale-105"
            >
              Start building today
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-8 py-4 text-base font-semibold text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              Explore features
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-16 pt-8 border-t border-zinc-800/50">
            <p className="text-sm text-zinc-500 mb-6">Combining the best of</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-zinc-500">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="text-lg">𝕏</span>-style conversations
              </span>
              <span className="hidden sm:block w-px h-4 bg-zinc-700" />
              <span className="flex items-center gap-2 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub-style projects
              </span>
              <span className="hidden sm:block w-px h-4 bg-zinc-700" />
              <span className="flex items-center gap-2 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn-style discovery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need to build & ship</h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              A complete platform designed for developers who want to build in public, 
              collaborate effectively, and get discovered for their real work.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/30 border-y border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Get started in minutes and start building your developer identity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-zinc-700 to-transparent" />
                )}
                <div className="text-5xl font-bold text-zinc-800 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why LogoutDev Section */}
      <section id="why" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">LogoutDev</span>?
              </h2>
              <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                Current developer activity is fragmented. Ideas and discussions happen on social platforms, 
                code lives on GitHub, and hiring happens on resume-based platforms. This creates weak hiring 
                signals and poor collaboration discovery.
              </p>
              <ul className="space-y-4">
                {[
                  "Companies evaluate developers by what they build, not what they claim",
                  "Get discovered without relying on resumes or job applications",
                  "Find collaborators who share your tech stack and interests",
                  "Build trust through consistent public contributions"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
                <div className="space-y-6">
                  {/* Mock profile card */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      JD
                    </div>
                    <div>
                      <div className="font-semibold text-white">Jane Developer</div>
                      <div className="text-sm text-zinc-400">Full-stack builder · 127 contributions</div>
                    </div>
                  </div>
                  
                  {/* Mock stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-800">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">12</div>
                      <div className="text-xs text-zinc-500">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">3</div>
                      <div className="text-xs text-zinc-500">Launches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">89</div>
                      <div className="text-xs text-zinc-500">Followers</div>
                    </div>
                  </div>

                  {/* Mock tech stack */}
                  <div>
                    <div className="text-xs text-zinc-500 mb-2">Tech Stack</div>
                    <div className="flex flex-wrap gap-2">
                      {["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"].map((tech) => (
                        <span key={tech} className="px-2 py-1 text-xs rounded-md bg-zinc-800 text-zinc-300">{tech}</span>
                      ))}
                    </div>
                  </div>

                  {/* Mock activity */}
                  <div>
                    <div className="text-xs text-zinc-500 mb-2">Recent Activity</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-zinc-400">Launched <span className="text-white">DevTools Pro</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-zinc-400">Joined <span className="text-white">Open API Project</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/80 p-12 sm:p-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to build in public?
              </h2>
              <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
                Join developers who are shipping products, finding collaborators, 
                and getting discovered for their real work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-zinc-950 hover:bg-zinc-100 transition-all hover:scale-105"
                >
                  Create your profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/50 px-8 py-4 text-base font-semibold text-zinc-300 hover:bg-zinc-800 transition-all"
                >
                  Explore the community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-zinc-950 font-bold text-xs">LD</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">LogoutDev</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="#features" className="text-sm text-zinc-500 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-sm text-zinc-500 hover:text-white transition-colors">How it works</Link>
              <Link href="/explore" className="text-sm text-zinc-500 hover:text-white transition-colors">Explore</Link>
              <Link href="/login" className="text-sm text-zinc-500 hover:text-white transition-colors">Sign in</Link>
            </nav>
            <p className="text-sm text-zinc-600">
              © {new Date().getFullYear()} LogoutDev. Built for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLaunches } from "@/lib/hooks/useLaunches";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import {
  CheckIcon,
  PlusIcon,
  ArrowRightIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CommandLineIcon
} from "@heroicons/react/24/outline";

// Standard Inline SVGs for specialized features
function CodeIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function UsersIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function RocketIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function BriefcaseIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .966-.784 1.75-1.75 1.75H5.5a1.75 1.75 0 01-1.75-1.75v-4.25m16.5 0a2.25 2.25 0 00-2.25-2.25H5.5A2.25 2.25 0 003.25 14.15m17 0V10.5A2.25 2.25 0 0018 8.25h-2.25a2.25 2.25 0 00-2.25-2.25h-3a2.25 2.25 0 00-2.25 2.25H5.5A2.25 2.25 0 003.25 10.5v3.65m17 0V14.15m-17 0v.05" />
    </svg>
  );
}

function GitBranchIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function StarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.173-.439.743-.439.916 0l1.862 4.721a.25.25 0 00.224.168l5.105.354c.48.033.672.63.308.948l-3.87 3.398a.25.25 0 00-.077.237l1.162 4.965c.109.467-.394.832-.803.575L12.3 16.52a.25.25 0 00-.26 0l-4.526 2.74c-.41.248-.912-.117-.803-.575l1.162-4.965a.25.25 0 00-.077-.237l-3.87-3.398a.25.25 0 00.308-.948l5.105-.354a.25.25 0 00.224-.168l1.862-4.721z" />
    </svg>
  );
}

// Feature List
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
    icon: <CodeIcon className="w-6 h-6 rotate-90" />,
    title: "Private Git Repos",
    description: "Host your code with built-in version control. Collaborate on private repos within your project spaces."
  },
  {
    icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
    title: "Developer Q&A",
    description: "Ask technical questions and share knowledge. Build your reputation by helping others solve problems."
  }
];

// Onboarding Steps
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

// Dashboard statistics
const stats = [
  { value: "Proof-of-Work", label: "Based Profiles" },
  { value: "Real-Time", label: "Collaboration" },
  { value: "Open Source", label: "Friendly" },
  { value: "Developer", label: "First Platform" }
];

export default function Home() {
  const router = useRouter();
  const { launches: betaLaunches } = useLaunches({ launch_phase: "beta", limit: 3, sort: "newest" });
  const { launches: liveLaunches } = useLaunches({ launch_phase: "live", limit: 3, sort: "newest" });

  const [email, setEmail] = useState("");
  const [newsSuccess, setNewsSuccess] = useState(false);
  const [newsError, setNewsError] = useState("");

  // Simulated Workspace Playground State
  const [playTab, setPlayTab] = useState<"feed" | "repos" | "launches">("feed");
  const [contributionCount, setContributionCount] = useState(127);
  const [isSimulatingPush, setIsSimulatingPush] = useState(false);
  const [terminalLog, setTerminalLog] = useState("initialized dev_workspace v0.8.2. listening for git events...");
  const [feedLogs, setFeedLogs] = useState([
    { id: "1", name: "Jane Developer", username: "jane_dev", time: "2m ago", message: "Refactored Next.js app/page layouts to match modern dark designs.", commitLink: "d412e87" },
    { id: "2", name: "Gowrish", username: "gowrish", time: "10m ago", message: "Approved workspace invitation request for team space binding.", commitLink: "a89bc21" }
  ]);

  // Contribution grid blocks
  const [contributionBlocks, setContributionBlocks] = useState(
    Array.from({ length: 63 }, (_, i) => {
      const densities = [0, 1, 0, 2, 0, 3, 4, 0, 1, 2, 0, 0, 3, 1, 0, 2, 0, 4, 0, 1, 2, 0, 3, 0, 0, 1, 2, 4, 0, 1, 0, 2, 3, 0, 0, 2, 1, 0, 4, 0, 1, 3, 0, 0, 2, 1, 0, 4, 0, 1, 2, 0, 3, 0, 0, 1, 2, 4, 0, 1, 0, 2, 3];
      return densities[i % densities.length];
    })
  );

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) router.replace("/feed");
  }, [router]);

  // Handle Newsletter Submit
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsError("");
    setNewsSuccess(false);
    if (!email.trim() || !email.includes("@")) {
      setNewsError("Please enter a valid email address.");
      return;
    }
    setNewsSuccess(true);
    setEmail("");
  };

  // Simulating Commit Push Action
  const triggerSimulatePush = () => {
    if (isSimulatingPush) return;
    setIsSimulatingPush(true);
    setTerminalLog("analyzing codebase... checking files... formatting layout...");
    
    setTimeout(() => {
      setTerminalLog("building production bundle... running typescript checks...");
    }, 1200);

    setTimeout(() => {
      setTerminalLog("pushing objects... writing 8 objects... git commit pushed successfully!");
      setContributionCount(prev => prev + 1);
      
      // Increment random element in the grid to show updates
      setContributionBlocks(prev => {
        const next = [...prev];
        const randomIdx = Math.floor(Math.random() * next.length);
        next[randomIdx] = Math.min(4, next[randomIdx] + 1);
        return next;
      });

      // Add a feed item
      const commitHash = Math.random().toString(16).substring(2, 9);
      setFeedLogs(prev => [
        {
          id: String(Date.now()),
          name: "Jane Developer",
          username: "jane_dev",
          time: "Just now",
          message: "Pushed updates to repository settings workspace.",
          commitLink: commitHash
        },
        ...prev.slice(0, 2)
      ]);
      
      setIsSimulatingPush(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white/10 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/5 relative overflow-hidden group">
                <span className="text-zinc-950 font-extrabold text-sm relative z-10 transition-colors">LD</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">LogoutDev</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#why" className="hover:text-white transition-colors">Why LogoutDev</a>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-wider text-zinc-450 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-150 transition-all shadow-md shadow-white/5 hover:scale-[1.03] cursor-pointer"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Grid & Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-[-15%] right-[20%] w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[140px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Pulsing Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 mb-4 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 font-sans tracking-wide">The proof-of-work network for builders</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-white">
            Where developers
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              build in public
            </span>
          </h1>

          <p className="mt-6 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            LogoutDev is a collaborative workspace where developers showcase actual contributions, host Git repos, launch products, and connect based on verified code.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-xs font-bold text-black hover:bg-zinc-150 transition-all hover:scale-[1.03] shadow-md shadow-white/5 cursor-pointer"
            >
              <span>Start building today</span>
              <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 px-7 py-3.5 text-xs font-bold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer"
            >
              Explore features
            </a>
          </div>

          {/* INTERACTIVE MOCK DASHBOARD PLAYGROUND */}
          <div className="mt-16 relative rounded-2xl border border-zinc-800 bg-zinc-900/20 p-1.5 backdrop-blur-md shadow-2xl max-w-4xl mx-auto overflow-hidden">
            {/* Top window bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-850/80 bg-zinc-950/40">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
              </div>
              <div className="text-[10px] text-zinc-550 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>dev_workspace@logoutdev:~</span>
              </div>
              <div className="w-12"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-zinc-950/70 text-left">
              {/* Mock Sidebar */}
              <div className="md:col-span-3 border-r border-zinc-850/60 p-4 space-y-4 bg-zinc-950/20 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 px-2.5 mb-2">Workspace</p>
                  
                  <button
                    onClick={() => setPlayTab("feed")}
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all ${
                      playTab === "feed" ? "bg-zinc-900 text-white font-semibold border border-zinc-850" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 shrink-0" />
                    <span>Developer Feed</span>
                  </button>
                  
                  <button
                    onClick={() => setPlayTab("repos")}
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all ${
                      playTab === "repos" ? "bg-zinc-900 text-white font-semibold border border-zinc-850" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FolderIcon className="w-4 h-4 shrink-0" />
                    <span>Git Repositories</span>
                  </button>
                  
                  <button
                    onClick={() => setPlayTab("launches")}
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all ${
                      playTab === "launches" ? "bg-zinc-900 text-white font-semibold border border-zinc-850" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <RocketIcon className="w-4 h-4 shrink-0" />
                    <span>Launches Hub</span>
                  </button>
                </div>

                {/* Simulated Push Commits Action Widget */}
                <div className="p-3 border border-zinc-850/60 rounded-xl bg-zinc-900/10 space-y-2">
                  <span className="block text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Commit Simulator</span>
                  <button
                    onClick={triggerSimulatePush}
                    disabled={isSimulatingPush}
                    className="w-full bg-white text-black font-bold text-xs py-2 rounded-lg hover:bg-zinc-150 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSimulatingPush ? (
                      <>
                        <Spinner size="sm" className="text-black border-black" />
                        <span>Pushing...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Push Commit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mock Main Panel */}
              <div className="md:col-span-9 p-5 flex flex-col justify-between min-h-[340px]">
                <div>
                  {/* Tab Content: Feed */}
                  {playTab === "feed" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450">Global Activity</h4>
                        <span className="text-[9px] text-zinc-550 font-mono">Live updates</span>
                      </div>
                      
                      <div className="space-y-3">
                        {feedLogs.map((log) => (
                          <div key={log.id} className="flex gap-3 text-xs border border-zinc-850/30 bg-zinc-900/10 p-3 rounded-xl hover:border-zinc-800 transition-all">
                            <Avatar user={{ id: log.id, name: log.name }} size="sm" />
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">{log.name}</span>
                                <span className="text-zinc-500 truncate text-[10px]">@{log.username}</span>
                                <span className="text-[9px] text-zinc-600 shrink-0">• {log.time}</span>
                              </div>
                              <p className="text-zinc-400 text-xs leading-normal">{log.message}</p>
                              {log.commitLink && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-[9px] font-mono text-zinc-500 mt-1">
                                  commit: {log.commitLink}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Repos */}
                  {playTab === "repos" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450">Connected Repositories</h4>
                        <span className="text-[9px] text-zinc-550 font-mono">2 Active</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="border border-zinc-850 bg-zinc-900/20 p-3.5 rounded-xl hover:border-zinc-750 transition-all space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">logoutdev-web</span>
                              <span className="text-[9px] border border-sky-500/20 bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full">Public</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-normal mt-1.5">Web frontend platform for proof-of-work dashboard and launches.</p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-3 border-t border-zinc-900 font-mono">
                            <span>TypeScript</span>
                            <span>Updated 2m ago</span>
                          </div>
                        </div>

                        <div className="border border-zinc-850 bg-zinc-900/20 p-3.5 rounded-xl hover:border-zinc-750 transition-all space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">dev-ops-configs</span>
                              <span className="text-[9px] border border-amber-500/20 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Private</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-normal mt-1.5">Kubernetes deployments, Terraform variables, and secrets binding setup.</p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-3 border-t border-zinc-900 font-mono">
                            <span>Terraform</span>
                            <span>Updated 1h ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Launches */}
                  {playTab === "launches" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450">Products Showcased</h4>
                        <span className="text-[9px] text-zinc-550 font-mono">Launches</span>
                      </div>

                      <div className="space-y-2">
                        <div className="border border-zinc-850 bg-zinc-900/20 p-3 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">DevTools Pro v1.2</span>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Live</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">Advanced browser tools for React debugging and profiling.</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-white block">18 reviews</span>
                            <span className="text-[9px] text-zinc-500 font-mono">4.9 Rating</span>
                          </div>
                        </div>

                        <div className="border border-zinc-850 bg-zinc-900/20 p-3 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">DeployFlow AI</span>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20">Beta</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">Self-healing server deployment agent integrated with Git pushes.</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-sky-350 block">12 / 50</span>
                            <span className="text-[9px] text-zinc-550 font-mono">Approved</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Terminal logs */}
                <div className="mt-4 border-t border-zinc-850/60 pt-3.5">
                  <div className="bg-zinc-950 rounded-xl p-2.5 border border-zinc-850/80 font-mono text-[10px] text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CommandLineIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-emerald-400 font-bold shrink-0">git_events:</span>
                      <span className="truncate text-zinc-400">{terminalLog}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans text-zinc-400 text-[10px] shrink-0 font-semibold pl-3 border-t sm:border-t-0 sm:border-l border-zinc-850 pt-2 sm:pt-0">
                      <span>Jane's Score:</span>
                      <span className="text-white font-bold font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{contributionCount} commits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-zinc-800/40 bg-zinc-900/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center border border-zinc-805 bg-zinc-950/40 p-6 rounded-2xl shadow-sm hover:border-zinc-700 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stat.value}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Launches Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-800/60 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Community Releases</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Beta first, then live</h2>
              <p className="mt-2 max-w-2xl text-xs text-zinc-400 leading-normal">
                Builders gather direct feedback from beta users before transitioning to public releases.
              </p>
            </div>
            <Link
              href="/launches"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-xs font-bold text-zinc-350 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              Explore Launches
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Beta Card */}
            <div className="rounded-3xl border border-zinc-850 bg-zinc-900/10 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-850/60 pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Beta Releases</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">Early access request queues.</p>
                </div>
                <Link href="/launches" className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold">View all &rarr;</Link>
              </div>
              <div className="space-y-3">
                {betaLaunches.length === 0 ? (
                  <div className="py-8 text-center text-zinc-650 text-xs font-mono">No active beta releases</div>
                ) : (
                  betaLaunches.slice(0, 3).map((launch) => {
                    const approved = launch.beta_summary?.approved_count ?? 0;
                    const capacity = launch.beta_summary?.capacity ?? 100;
                    const percent = Math.min(100, Math.round((approved / capacity) * 100));
                    return (
                      <Link
                        key={launch.id}
                        href={`/launches/${launch.id}`}
                        className="block rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-white">{launch.name}</span>
                          <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[9px] font-bold text-sky-300 font-mono">
                            {approved} / {capacity} approved
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{launch.tagline}</p>
                        <div className="mt-3.5 w-full bg-zinc-900 border border-zinc-850 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Card */}
            <div className="rounded-3xl border border-zinc-850 bg-zinc-900/10 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-850/60 pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Showcases</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">Public products with code feedback.</p>
                </div>
                <Link href="/launches" className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold">View all &rarr;</Link>
              </div>
              <div className="space-y-3">
                {liveLaunches.length === 0 ? (
                  <div className="py-8 text-center text-zinc-650 text-xs font-mono">No active public releases</div>
                ) : (
                  liveLaunches.slice(0, 3).map((launch) => (
                    <Link
                      key={launch.id}
                      href={`/launches/${launch.id}`}
                      className="block rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/20"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-white">{launch.name}</span>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                          <span>{launch.review_count} reviews</span>
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">{launch.tagline}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-zinc-900/40 bg-zinc-950">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Everything you need to ship</h2>
            <p className="max-w-2xl text-xs sm:text-sm text-zinc-400 mx-auto leading-relaxed">
              LogoutDev integrates code updates, spaces, and profile metrics to map real developer capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all shadow-sm flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center text-violet-400 mb-4 border border-violet-500/10 group-hover:scale-105 transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-zinc-400 leading-normal">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Timeline Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/10 border-y border-zinc-800/40">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How it works</h2>
            <p className="max-w-2xl text-xs sm:text-sm text-zinc-400 mx-auto leading-relaxed">
              Register, code, ship, and get verified in four simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative p-5 rounded-2xl border border-zinc-850 bg-zinc-950/40 hover:border-zinc-750 transition-all shadow-sm">
                <div className="text-3xl font-extrabold text-zinc-800 font-mono mb-3">{step.step}</div>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why LogoutDev & Mock Activity Grid */}
      <section id="why" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Why <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">LogoutDev</span>?
              </h2>
              
              <p className="text-sm text-zinc-400 leading-relaxed">
                Developer verification is fragmented. Code lives on Github, discussions on social threads, and resumes on recruitment platforms. LogoutDev unites them all in one proof-of-work container.
              </p>
              
              <ul className="space-y-3.5">
                {[
                  "Companies evaluate developers based on verified git contributions",
                  "Direct recruiter discovery without keyword-optimized resume filters",
                  "Find project maintainers matching specific tech stacks",
                  "Build reputation points automatically as you push code changes"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs">
                    <div className="rounded-full bg-emerald-500/10 p-0.5 border border-emerald-500/20 mt-0.5">
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    </div>
                    <span className="text-zinc-350 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Mock Profile Playground Column */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-3xl blur-3xl pointer-events-none" />
              
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-6 shadow-2xl backdrop-blur-sm">
                {/* Profile header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-violet-500/25">
                    JD
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Jane Developer</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Full-Stack Architect · dev_lead</p>
                  </div>
                </div>

                {/* Github-style Green Contribution Grid built in CSS */}
                <div>
                  <div className="text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">Proof of Work Activity Grid</div>
                  <div className="grid grid-flow-col grid-rows-7 gap-1 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                    {contributionBlocks.map((density, idx) => {
                      const colors = [
                        "bg-zinc-900 hover:bg-zinc-800",
                        "bg-emerald-950 hover:bg-emerald-900",
                        "bg-emerald-800 hover:bg-emerald-700",
                        "bg-emerald-600 hover:bg-emerald-500",
                        "bg-emerald-400 hover:bg-emerald-300",
                      ];
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-sm transition-colors cursor-pointer ${colors[density]}`}
                          title={`${density === 0 ? "No" : density * 3} commits on this day`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-zinc-550 mt-2 font-mono px-1">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm bg-zinc-900" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-950" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    </div>
                    <span>More</span>
                  </div>
                </div>

                {/* Tech stack badge row */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider block">Tech Stack Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Next.js", "TypeScript", "Tailwind", "Kubernetes", "PostgreSQL"].map((tech) => (
                      <span key={tech} className="px-2.5 py-0.5 rounded bg-zinc-950 border border-zinc-850 text-[10px] font-semibold text-zinc-400">{tech}</span>
                    ))}
                  </div>
                </div>

                {/* Proposal states */}
                <div className="grid grid-cols-2 gap-3 border-t border-zinc-850/60 pt-4 text-center">
                  <div className="bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-xl">
                    <span className="block text-sm font-extrabold text-white font-mono">14</span>
                    <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">Shipped Repos</span>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-850 p-2.5 rounded-xl">
                    <span className="block text-sm font-extrabold text-emerald-400 font-mono">128</span>
                    <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold">Rep Points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Email Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-cyan-600/10 rounded-3xl blur-3xl pointer-events-none" />
          
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 sm:p-16 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to build in public?</h2>
            
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Create your profile today, host code repos, launch products, and discover developer collaboration networks.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <EnvelopeIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="Enter email to get updates"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setNewsError("");
                      setNewsSuccess(false);
                    }}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-650 focus:border-zinc-750 focus:outline-none focus:ring-1 focus:ring-zinc-750"
                  />
                </div>
                
                <button
                  type="submit"
                  className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-150 transition-all cursor-pointer whitespace-nowrap"
                >
                  Join Newsletter
                </button>
              </div>

              {newsError && (
                <div className="text-rose-455 text-[11px] font-mono flex items-center justify-center gap-1.5">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  <span>{newsError}</span>
                </div>
              )}
              {newsSuccess && (
                <div className="text-emerald-450 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Subscribed successfully! Welcome to LogoutDev updates.</span>
                </div>
              )}
            </form>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-6 py-3 text-xs font-bold text-black hover:bg-zinc-150 transition-all cursor-pointer"
              >
                <span>Create profile</span>
                <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer"
              >
                Explore community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-zinc-500">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
                <span className="text-zinc-950 font-extrabold text-xs">LD</span>
              </div>
              <span className="text-base font-bold text-white tracking-tight">LogoutDev</span>
            </div>
            
            <nav className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
            </nav>
            
            <p className="text-[11px] font-mono text-zinc-650">
              © {new Date().getFullYear()} LogoutDev. Built for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

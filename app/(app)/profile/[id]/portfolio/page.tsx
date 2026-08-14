"use client";

/**
 * Profile portfolio page — /profile/:id/portfolio
 * Displays portfolio items for a user profile
 * Features: Grid layout, empty state, add item CTA for own profile
 */

import { use, useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import PortfolioShowcase from "@/components/profile/PortfolioShowcase";
import { PortfolioItem } from "@/components/profile/PortfolioItem";
import Spinner from "@/components/ui/Spinner";

interface ProfilePortfolioPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Mock portfolio data for demonstration
 * In production, this would be fetched from the API
 */
const MOCK_PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: "1",
    title: "E-commerce Platform",
    description:
      "Full-stack e-commerce solution with React and Node.js. Features include product catalog, shopping cart, payment processing with Stripe, and admin dashboard.",
    image_url: "/portfolio/ecommerce.png",
    tags: ["React", "Node.js", "PostgreSQL", "Stripe"],
    demo_url: "https://demo.example.com",
    repo_url: "https://github.com/user/ecommerce-platform",
  },
  {
    id: "2",
    title: "Task Management App",
    description:
      "Collaborative task management application with real-time updates and team collaboration features. Built with modern React hooks and WebSocket integration.",
    image_url: "/portfolio/taskapp.png",
    tags: ["React", "WebSocket", "Redux", "Tailwind CSS"],
    demo_url: "https://tasks.example.com",
    repo_url: "https://github.com/user/task-manager",
  },
  {
    id: "3",
    title: "AI Content Generator",
    description:
      "Machine learning-powered content generation tool for creating blog posts and social media content. Integrates with OpenAI API and features a user-friendly dashboard.",
    image_url: "/portfolio/ai-content.png",
    tags: ["Python", "FastAPI", "OpenAI", "React", "PostgreSQL"],
    demo_url: "https://ai-content.example.com",
    repo_url: "https://github.com/user/ai-content-gen",
  },
  {
    id: "4",
    title: "Data Analytics Dashboard",
    description:
      "Interactive data visualization dashboard for analyzing business metrics. Real-time data updates with custom chart types and export capabilities.",
    image_url: "/portfolio/analytics.png",
    tags: ["React", "D3.js", "TypeScript", "Node.js"],
    demo_url: "https://analytics.example.com",
    repo_url: "https://github.com/user/analytics-dashboard",
  },
  {
    id: "5",
    title: "Mobile Health Tracker",
    description:
      "Cross-platform mobile app for tracking fitness and health metrics. Features include workout logging, progress tracking, and social sharing.",
    image_url: "/portfolio/health-app.png",
    tags: ["React Native", "Firebase", "Expo"],
    demo_url: "https://health-tracker.example.com",
    repo_url: "https://github.com/user/health-tracker",
  },
  {
    id: "6",
    title: "Real-time Chat Application",
    description:
      "Scalable real-time chat application with user authentication, message persistence, and typing indicators. Built with Socket.io and MongoDB.",
    image_url: "/portfolio/chat-app.png",
    tags: ["Socket.io", "Express", "MongoDB", "React"],
    demo_url: "https://chat.example.com",
    repo_url: "https://github.com/user/chat-app",
  },
];

export default function ProfilePortfolioPage({
  params,
}: ProfilePortfolioPageProps) {
  const { id: username } = use(params);
  const { is_me, loading, error } = useProfile(username);

  // State for showing add modal (would be implemented in real version)
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }

  // For demo purposes, show mock data for all users
  // In production, this would fetch from API based on username
  const portfolioItems = MOCK_PORTFOLIO_ITEMS;

  const handleAddPortfolioItem = () => {
    // TODO: Implement add portfolio item modal
    console.log("Add portfolio item clicked");
    setShowAddModal(true);
  };

  return (
    <div className="py-6 px-4 sm:px-5 max-w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-1">
          Portfolio
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500">
          {is_me
            ? "Showcase your best work and projects"
            : "Featured projects and achievements"}
        </p>
      </div>

      {/* Portfolio Showcase Component */}
      <PortfolioShowcase
        items={portfolioItems}
        isOwnProfile={is_me}
        onAddPortfolioItem={is_me ? handleAddPortfolioItem : undefined}
      />

      {/* Add Portfolio Item Modal - To be implemented */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Portfolio Item
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              This feature is coming soon. You'll be able to add your projects,
              descriptions, images, and links here.
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

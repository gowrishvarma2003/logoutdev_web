"use client";

/**
 * PortfolioItemForm — Form for creating/editing portfolio items
 * Fields: title, description, imageUrl, demoUrl, repoUrl, technologies
 * Handles validation and submission
 */

import { useState, useEffect } from "react";
import { XIcon, CheckIcon } from "@/components/ui/Icons";
import SettingsField, { INPUT_CLASS, TEXTAREA_CLASS } from "./SettingsField";
import PortfolioImageUpload from "./PortfolioImageUpload";

export interface PortfolioItemFormData {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  technologies: string[];
}

interface PortfolioItemFormProps {
  item?: PortfolioItemFormData;
  onSave: (item: PortfolioItemFormData) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export default function PortfolioItemForm({
  item,
  onSave,
  onCancel,
  loading = false,
}: PortfolioItemFormProps) {
  const [formData, setFormData] = useState<PortfolioItemFormData>(
    item || {
      title: "",
      description: "",
      imageUrl: "",
      demoUrl: "",
      repoUrl: "",
      technologies: [],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [techInput, setTechInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.demoUrl && !isValidUrl(formData.demoUrl)) {
      newErrors.demoUrl = "Invalid URL format";
    }
    if (formData.repoUrl && !isValidUrl(formData.repoUrl)) {
      newErrors.repoUrl = "Invalid URL format";
    }
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = "Invalid URL format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddTechnology = () => {
    const tech = techInput.trim().toLowerCase();
    if (tech && !formData.technologies.includes(tech)) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, tech],
      });
      setTechInput("");
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setFormData({
      ...formData,
      technologies: formData.technologies.filter((t) => t !== tech),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <SettingsField
        label="Project Title"
        hint="Name of your project"
        error={errors.title}
        htmlFor="portfolio-title"
        required
      >
        <input
          id="portfolio-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="My Awesome Project"
          className={INPUT_CLASS}
          disabled={isSubmitting}
        />
      </SettingsField>

      {/* Description */}
      <SettingsField
        label="Description"
        hint="What does this project do? (250 characters max)"
        error={errors.description}
        htmlFor="portfolio-description"
        required
      >
        <textarea
          id="portfolio-description"
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value.slice(0, 250),
            })
          }
          placeholder="Describe your project briefly..."
          maxLength={250}
          rows={3}
          className={TEXTAREA_CLASS}
          disabled={isSubmitting}
        />
        <p className="text-xs text-zinc-600 mt-1">
          {formData.description.length} / 250 characters
        </p>
      </SettingsField>

      {/* Image URL - Now with Upload Component */}
      <SettingsField
        label="Project Image"
        hint="Upload or provide an image URL"
        error={errors.imageUrl}
        htmlFor="portfolio-image"
      >
        <PortfolioImageUpload
          currentImage={formData.imageUrl}
          onUpload={(imageUrl) => setFormData({ ...formData, imageUrl })}
          aspectRatio={16 / 9}
          disabled={isSubmitting}
        />
      </SettingsField>

      {/* Demo URL */}
      <SettingsField
        label="Live Demo URL"
        hint="Link to live project or demo"
        error={errors.demoUrl}
        htmlFor="portfolio-demo"
      >
        <input
          id="portfolio-demo"
          type="text"
          value={formData.demoUrl || ""}
          onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
          placeholder="https://myproject.com"
          className={INPUT_CLASS}
          disabled={isSubmitting}
        />
      </SettingsField>

      {/* Repository URL */}
      <SettingsField
        label="Repository URL"
        hint="Link to source code (GitHub, GitLab, etc.)"
        error={errors.repoUrl}
        htmlFor="portfolio-repo"
      >
        <input
          id="portfolio-repo"
          type="text"
          value={formData.repoUrl || ""}
          onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
          placeholder="https://github.com/user/repo"
          className={INPUT_CLASS}
          disabled={isSubmitting}
        />
      </SettingsField>

      {/* Technologies */}
      <SettingsField
        label="Technologies & Tools"
        hint="Add relevant technologies used in this project"
        htmlFor="portfolio-tech"
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id="portfolio-tech"
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTechnology();
                }
              }}
              placeholder="e.g., React, Node.js, TypeScript"
              className={INPUT_CLASS}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={handleAddTechnology}
              disabled={isSubmitting || !techInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              aria-label="Add technology"
            >
              Add
            </button>
          </div>

          {/* Technology tags */}
          {formData.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.technologies.map((tech) => (
                <div
                  key={tech}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTechnology(tech)}
                    disabled={isSubmitting}
                    className="text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-50"
                    aria-label={`Remove ${tech}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsField>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={item ? "Update portfolio item" : "Add portfolio item"}
        >
          <CheckIcon className="w-4 h-4" />
          {isSubmitting ? "Saving..." : item ? "Update" : "Add Item"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 text-zinc-200 font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

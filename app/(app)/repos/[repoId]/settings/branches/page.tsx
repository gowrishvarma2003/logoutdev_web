"use client";

import { useState } from "react";
import { useRepoContext } from "../../layout";
import { useBranches, useBranchProtectionRules } from "@/lib/hooks/useRepos";
import { createBranchProtectionRule, deleteBranchProtectionRule } from "@/lib/services/reposApi";
import Spinner from "@/components/ui/Spinner";
import type { BranchProtectionRule } from "@/lib/types";
import { CheckIcon, ShieldCheckIcon, TrashIcon } from "@heroicons/react/24/outline";

function summarizeRule(rule: BranchProtectionRule) {
  const summary: string[] = [];

  if (rule.require_pr) summary.push("Pull request required");
  if (rule.required_approvals > 0) {
    summary.push(`${rule.required_approvals} approving review${rule.required_approvals === 1 ? "" : "s"}`);
  }
  if (rule.dismiss_stale_reviews) summary.push("Dismiss stale reviews");
  if (rule.require_status_checks) summary.push("Status checks required");
  if (rule.restrict_pushes) summary.push(`Pushes require ${rule.push_role_min}`);
  if (rule.require_linear_history) summary.push("Linear history");
  if (!rule.allow_force_push) summary.push("Blocks force pushes");
  if (!rule.allow_deletions) summary.push("Blocks deletion");

  return summary.length ? summary : ["No restrictions enabled"];
}

const initialFormState = {
  pattern: "",
  requirePr: false,
  approvals: 0,
  dismissStaleReviews: false,
  requireStatusChecks: false,
  requiredStatusContexts: "",
  restrictPushes: false,
  pushRoleMin: "maintain" as "write" | "maintain" | "admin",
  allowForcePush: false,
  allowDeletions: false,
  requireLinearHistory: false,
};

export default function BranchProtectionSettingsPage() {
  const { repo } = useRepoContext();
  const { rules, loading, error, refetch } = useBranchProtectionRules(repo.id);
  const { branches, default_branch } = useBranches(repo.id);

  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const updateForm = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    const branchPattern = form.pattern.trim();
    if (!branchPattern) {
      setFormError("Branch name pattern is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await createBranchProtectionRule(repo.id, {
        branch_pattern: branchPattern,
        require_pr: form.requirePr,
        required_approvals: form.approvals,
        dismiss_stale_reviews: form.dismissStaleReviews,
        require_status_checks: form.requireStatusChecks,
        required_status_contexts: form.requiredStatusContexts
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        restrict_pushes: form.restrictPushes,
        push_role_min: form.pushRoleMin,
        allow_force_push: form.allowForcePush,
        allow_deletions: form.allowDeletions,
        require_linear_history: form.requireLinearHistory,
      });

      setForm(initialFormState);
      setFormSuccess(`Protection rule saved for ${branchPattern}.`);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save rule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this protection rule?")) return;

    try {
      await deleteBranchProtectionRule(repo.id, ruleId);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete rule.");
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <ShieldCheckIcon className="h-6 w-6 text-green-500" />
          Branch protection rules
        </h1>
        <div className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-400">
          {rules.length} active {rules.length === 1 ? "rule" : "rules"}
        </div>
      </div>

      <p className="mb-8 text-sm text-zinc-400">
        Protect important branches by requiring pull requests, reviews, status checks, or stricter push rules before code can change protected refs.
      </p>

      {!repo.can_manage_rules ? (
        <div className="mb-6 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          You can view branch protection rules here, but only maintainers and admins can change them.
        </div>
      ) : null}

      <h2 className="mb-4 text-xl font-semibold text-white">Active rules</h2>
      <div className="mb-10 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/50">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-rose-400">{error}</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No branch protection rules defined yet.</div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {rules.map((rule) => (
              <li key={rule.id} className="flex flex-col gap-4 p-4 hover:bg-zinc-800/50 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-block rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 font-mono font-semibold text-blue-400">
                    {rule.branch_pattern}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                    {summarizeRule(rule).map((item) => (
                      <span key={item} className="flex items-center gap-1">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        {item}
                      </span>
                    ))}
                  </div>
                  {rule.required_status_contexts?.length > 0 ? (
                    <div className="mt-2 text-xs text-zinc-500">
                      Required checks: {rule.required_status_contexts.join(", ")}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(rule.id)}
                  disabled={!repo.can_manage_rules}
                  className="self-start rounded px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50 md:self-center"
                  title="Delete rule"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-zinc-700 bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-800 bg-zinc-800/50 px-6 py-4">
          <h2 className="text-lg font-medium text-white">Add or update protection rule</h2>
        </div>

        <form onSubmit={handleCreate} className="p-6">
          {formError ? (
            <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {formError}
            </div>
          ) : null}
          {formSuccess ? (
            <div className="mb-4 rounded border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {formSuccess}
            </div>
          ) : null}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Branch name pattern <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
              <input
                type="text"
                required
                list="branch-pattern-options"
                value={form.pattern}
                onChange={(event) => updateForm("pattern", event.target.value)}
                placeholder="e.g. main or release/*"
                disabled={!repo.can_manage_rules}
                className="w-full max-w-md rounded border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
              <datalist id="branch-pattern-options">
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name} />
                ))}
                <option value="release/*" />
                <option value="hotfix/*" />
              </datalist>
              <div className="flex flex-wrap gap-2">
                {branches.slice(0, 8).map((branch) => (
                  <button
                    key={branch.name}
                    type="button"
                    onClick={() => updateForm("pattern", branch.name)}
                    disabled={!repo.can_manage_rules}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {branch.name}
                    {branch.name === default_branch ? " (default)" : ""}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Use an exact branch name or a wildcard pattern like release/*.</p>
          </div>

          <div className="mb-6 space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.requirePr}
                onChange={(event) => updateForm("requirePr", event.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Require a pull request before merging</span>
                <span className="mt-0.5 block text-sm text-zinc-400">
                  Direct commits to matching branches are blocked; changes must go through a pull request.
                </span>
              </div>
            </label>

            {form.requirePr ? (
              <div className="ml-7 space-y-4 border-l-2 border-zinc-800 pl-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-300">Required approving reviews:</label>
                  <select
                    value={form.approvals}
                    onChange={(event) => updateForm("approvals", Number(event.target.value))}
                    disabled={!repo.can_manage_rules}
                    className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.dismissStaleReviews}
                    onChange={(event) => updateForm("dismissStaleReviews", event.target.checked)}
                    disabled={!repo.can_manage_rules}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Dismiss stale approvals when new commits are pushed</span>
                </label>
              </div>
            ) : null}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.requireStatusChecks}
                onChange={(event) => updateForm("requireStatusChecks", event.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Require status checks to pass before merging</span>
                <span className="mt-0.5 block text-sm text-zinc-400">Provide a comma-separated list of required check contexts.</span>
              </div>
            </label>
            {form.requireStatusChecks ? (
              <input
                value={form.requiredStatusContexts}
                onChange={(event) => updateForm("requiredStatusContexts", event.target.value)}
                placeholder="build, lint, tests"
                disabled={!repo.can_manage_rules}
                className="ml-7 w-full max-w-md rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
            ) : null}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.restrictPushes}
                onChange={(event) => updateForm("restrictPushes", event.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Restrict who can push</span>
                <span className="mt-0.5 block text-sm text-zinc-400">Use a minimum repo role for direct pushes to this branch.</span>
              </div>
            </label>
            {form.restrictPushes ? (
              <select
                value={form.pushRoleMin}
                onChange={(event) => updateForm("pushRoleMin", event.target.value as "write" | "maintain" | "admin")}
                disabled={!repo.can_manage_rules}
                className="ml-7 w-full max-w-xs rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="write">write</option>
                <option value="maintain">maintain</option>
                <option value="admin">admin</option>
              </select>
            ) : null}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.requireLinearHistory}
                onChange={(event) => updateForm("requireLinearHistory", event.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Require linear history</span>
                <span className="mt-0.5 block text-sm text-zinc-400">Reject merge commits on direct updates to the protected branch.</span>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.allowForcePush}
                onChange={(event) => updateForm("allowForcePush", event.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Allow force pushes</span>
                <span className="mt-0.5 block text-sm text-zinc-400">Permit non-fast-forward updates to the protected branch.</span>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.allowDeletions}
                onChange={(event) => updateForm("allowDeletions", event.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Allow deletions</span>
                <span className="mt-0.5 block text-sm text-zinc-400">Permit deleting the protected branch.</span>
              </div>
            </label>
          </div>

          <div className="border-t border-zinc-800 pt-5">
            <button
              type="submit"
              disabled={isSubmitting || !form.pattern.trim() || !repo.can_manage_rules}
              className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
            >
              {isSubmitting ? <Spinner size="sm" /> : null}
              Create rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

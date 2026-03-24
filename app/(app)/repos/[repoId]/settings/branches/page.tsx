"use client";

import { useState } from "react";
import { useRepoContext } from "../../layout";
import { useBranchProtectionRules } from "@/lib/hooks/useRepos";
import { createBranchProtectionRule, deleteBranchProtectionRule } from "@/lib/services/reposApi";
import Spinner from "@/components/ui/Spinner";
import { ShieldCheckIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function BranchProtectionSettingsPage() {
  const { repo } = useRepoContext();
  const { rules, loading, error, refetch } = useBranchProtectionRules(repo.id);

  const [pattern, setPattern] = useState("");
  const [requirePr, setRequirePr] = useState(false);
  const [approvals, setApprovals] = useState(0);
  const [requireStatusChecks, setRequireStatusChecks] = useState(false);
  const [requiredStatusContexts, setRequiredStatusContexts] = useState("");
  const [restrictPushes, setRestrictPushes] = useState(false);
  const [pushRoleMin, setPushRoleMin] = useState<"write" | "maintain" | "admin">("maintain");
  const [allowForcePush, setAllowForcePush] = useState(false);
  const [allowDeletions, setAllowDeletions] = useState(false);
  const [requireLinearHistory, setRequireLinearHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await createBranchProtectionRule(repo.id, {
        branch_pattern: pattern,
        require_pr: requirePr,
        required_approvals: approvals,
        require_status_checks: requireStatusChecks,
        required_status_contexts: requiredStatusContexts.split(",").map((value) => value.trim()).filter(Boolean),
        restrict_pushes: restrictPushes,
        push_role_min: pushRoleMin,
        allow_force_push: allowForcePush,
        allow_deletions: allowDeletions,
        require_linear_history: requireLinearHistory,
      });
      setPattern("");
      setRequirePr(false);
      setApprovals(0);
      setRequireStatusChecks(false);
      setRequiredStatusContexts("");
      setRestrictPushes(false);
      setPushRoleMin("maintain");
      setAllowForcePush(false);
      setAllowDeletions(false);
      setRequireLinearHistory(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create rule");
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
      alert(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-green-500" />
          Branch protection rules
        </h1>
      </div>

          <p className="mb-8 text-sm text-zinc-400">
        Protect important branches by requiring pull requests, approvals, or status checks before code can be merged.
      </p>
      {!repo.can_manage_rules ? (
        <div className="mb-6 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          You can view branch protection rules here, but only maintainers and admins can change them.
        </div>
      ) : null}

      {/* Existing Rules List */}
      <h2 className="text-xl font-semibold text-white mb-4">Active Rules</h2>
      <div className="mb-10 rounded-md border border-zinc-800 bg-zinc-900/50">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-500">{error}</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No branch protection rules defined yet.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/50">
                <div>
                  <div className="font-mono font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 inline-block mb-2">
                    {rule.branch_pattern}
                  </div>
                  <div className="text-sm text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                    {rule.require_pr ? (
                      <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Requires PR</span>
                    ) : null}
                    {rule.required_approvals > 0 ? (
                      <span className="flex items-center gap-1"><span className="text-green-500">✓</span> {rule.required_approvals} approval(s) needed</span>
                    ) : null}
                    {rule.require_status_checks ? (
                      <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Status checks required</span>
                    ) : null}
                    {rule.restrict_pushes ? (
                      <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Push role: {rule.push_role_min}</span>
                    ) : null}
                    {rule.require_linear_history ? (
                      <span className="flex items-center gap-1"><span className="text-green-500">✓</span> Linear history</span>
                    ) : null}
                    {!rule.require_pr && rule.required_approvals === 0 && (
                      <span className="italic">No specific restrictions set</span>
                    )}
                  </div>
                  {rule.required_status_contexts.length > 0 ? (
                    <div className="mt-2 text-xs text-zinc-500">
                      Required checks: {rule.required_status_contexts.join(", ")}
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  disabled={!repo.can_manage_rules}
                  className="rounded px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  title="Delete rule"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add New Rule Form */}
      <div className="rounded-md border border-zinc-700 bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-800 bg-zinc-800/50 px-6 py-4">
          <h2 className="text-lg font-medium text-white">Add protection rule</h2>
        </div>
        
        <form onSubmit={handleCreate} className="p-6">
          {formError && (
            <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {formError}
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Branch name pattern <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. main or release/*"
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-md"
            />
          </div>

          <div className="mb-6 space-y-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={requirePr}
                onChange={(e) => setRequirePr(e.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Require a pull request before merging</span>
                <span className="block text-sm text-zinc-400 mt-0.5">
                  When enabled, all commits must be made to a non-protected branch and submitted via a pull request before they can be merged.
                </span>
              </div>
            </label>

            {requirePr && (
              <div className="ml-7 pl-4 border-l-2 border-zinc-800 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-300">Required approving reviews:</label>
                  <select
                    value={approvals}
                    onChange={(e) => setApprovals(Number(e.target.value))}
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
              </div>
            )}
            
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={requireStatusChecks}
                onChange={(e) => setRequireStatusChecks(e.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Require status checks to pass before merging</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Provide a comma-separated list of required check contexts.</span>
              </div>
            </label>
            {requireStatusChecks ? (
              <input
                value={requiredStatusContexts}
                onChange={(e) => setRequiredStatusContexts(e.target.value)}
                placeholder="build, lint, tests"
                disabled={!repo.can_manage_rules}
                className="ml-7 w-full max-w-md rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : null}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={restrictPushes}
                onChange={(e) => setRestrictPushes(e.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Restrict who can push</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Use a minimum repo role for direct pushes to this branch.</span>
              </div>
            </label>
            {restrictPushes ? (
              <select
                value={pushRoleMin}
                onChange={(e) => setPushRoleMin(e.target.value as "write" | "maintain" | "admin")}
                disabled={!repo.can_manage_rules}
                className="ml-7 w-full max-w-xs rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="write">write</option>
                <option value="maintain">maintain</option>
                <option value="admin">admin</option>
              </select>
            ) : null}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={requireLinearHistory}
                onChange={(e) => setRequireLinearHistory(e.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Require linear history</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Reject merge commits on direct updates to the protected branch.</span>
              </div>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={allowForcePush}
                onChange={(e) => setAllowForcePush(e.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Allow force push</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Permit non-fast-forward updates to the protected branch.</span>
              </div>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={allowDeletions}
                onChange={(e) => setAllowDeletions(e.target.checked)}
                disabled={!repo.can_manage_rules}
                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-zinc-200">Allow deletions</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Permit deleting the protected branch.</span>
              </div>
            </label>
          </div>

          <div className="border-t border-zinc-800 pt-5">
            <button
              type="submit"
              disabled={isSubmitting || !pattern || !repo.can_manage_rules}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Spinner size="sm" />}
              Create rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

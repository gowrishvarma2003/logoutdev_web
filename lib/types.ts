export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  github_url?: string;
  linkedin_url?: string;
  created_at?: string;
}

export interface PostHashtagEntity {
  id?: string;
  tag: string;
  normalized_tag: string;
  start_index: number;
  end_index: number;
  usage_count?: number;
}

export interface PostMentionEntity {
  id?: string;
  user_id: string;
  username: string;
  display_name?: string | null;
  start_index: number;
  end_index: number;
}

export interface HashtagSuggestion {
  tag: string;
  normalized_tag: string;
  usage_count: number;
  recent_post_count?: number;
  unique_author_count?: number;
}

export interface RelatedHashtag {
  tag: string;
  normalized_tag: string;
  cooccurrence_count: number;
}

export interface UserSuggestion {
  id: string;
  name: string;
  username: string;
  headline?: string | null;
}

export interface EntityRef {
  type: string;
  id: string;
  title: string;
  href?: string | null;
  subtitle?: string | null;
  visibility?: string | null;
  tags?: string[];
}

export interface RelatedEntityRef extends EntityRef {
  reason?: string | null;
}

export interface NextStepItem {
  title: string;
  description: string;
  href: string;
  auth_required: boolean;
  priority: number;
}

export interface SpaceViewerPermissions {
  can_read: boolean;
  can_reply: boolean;
  can_create_discussion: boolean;
  allowed_discussion_categories: DiscussionCategory[];
  can_manage_discussions: boolean;
}

export interface RepositoryCollaborationHome {
  type: "space" | "none";
  space_id?: string;
  href?: string;
  can_contribute: boolean;
  can_start_discussion: boolean;
}

export interface TrustContext {
  label: string;
  user: {
    id: string;
    name: string;
    username?: string | null;
    headline?: string | null;
    href: string;
  };
  proof_score: number;
  proof_band: ProofOfWorkBand;
  open_to_collaborate: boolean;
  strongest_stacks: string[];
  primary_stats: string[];
  secondary_stats: string[];
}

export interface NotificationCta {
  label: string;
  href: string;
}

export interface SuggestedAction {
  type: string;
  title: string;
  description: string;
  primary_cta: NotificationCta;
  secondary_cta?: NotificationCta | null;
  entity_ref?: EntityRef | null;
}

export interface NotificationItem {
  id: string;
  actor?: User | null;
  verb?: string | null;
  preview_text?: string | null;
  event_type: string;
  category: string;
  priority: "action" | "important" | "activity";
  entity_ref: EntityRef;
  secondary_entity_ref?: EntityRef | null;
  action_url?: string | null;
  can_open: boolean;
  group_count: number;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationSummary {
  unread_count: number;
  needs_action_count: number;
  recent: NotificationItem[];
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  next_cursor: string | null;
  suggested_actions: SuggestedAction[];
}

// ─── Developer Profiles ──────────────────────────────────────────────────────

export type ProofOfWorkBand = "Strong" | "Growing" | "Early";

export interface UserProfileSkill {
  id: string;
  user_id: string;
  skill: string;
  rank: number;
  created_at: string;
}

export interface UserFeaturedProject {
  id: string;
  position: number;
  space: {
    id: string;
    name: string;
    slug: string;
    summary: string;
    status: string;
    visibility: string;
    owner_id?: string;
    created_at?: string;
    owner?: User;
  };
}

export interface ProfileStats {
  followers: number;
  following: number;
  posts_count: number;
  projects_created_count: number;
  projects_contributed_count: number;
  discussions_started_count: number;
  updates_posted_count: number;
  launches_published_count: number;
  launch_reviews_received_count: number;
  freelance_projects_posted_count: number;
  freelance_wins_count: number;
  workspaces_from_freelance_count: number;
  accepted_collaborations_count: number;
}

export interface ProofOfWorkSignals {
  score: number;
  band: ProofOfWorkBand;
  factors: {
    shipping_behavior: number;
    review_quality: number;
    collaboration_conversion: number;
    freelance_outcomes: number;
    platform_consistency: number;
  };
}

export interface CareerTimelineItem {
  type: string;
  title: string;
  href?: string | null;
  created_at: string;
}

export interface CareerSummary {
  timeline: CareerTimelineItem[];
  strongest_stacks: string[];
  fit_clusters: string[];
  open_to_collaborate: boolean;
}

export interface ProfileResponse {
  profile: User;
  is_me: boolean;
  stats: ProfileStats;
  skills: UserProfileSkill[];
  featured_projects: UserFeaturedProject[];
  career_summary: CareerSummary;
  fit_clusters: string[];
  open_to_collaborate: boolean;
  related_entities: RelatedEntityRef[];
}

export interface ActivityItem {
  type: "post" | "discussion" | "update" | "launch" | "launch_review" | "freelance_project" | "freelance_win";
  created_at: string;
  item: {
    id: string;
    content?: string;        // post
    title?: string;          // discussion | update
    subtitle?: string;
    category?: string;       // discussion
    status?: string;         // discussion
    type?: string;           // update
    space?: { id: string; name: string; visibility: string };
    href?: string | null;
    stats?: string | null;
    linked_space_id?: string | null;
    linked_entity?: EntityRef | null;
  };
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  like_count: number;
  repost_count: number;
  reply_count: number;
  is_repost: boolean;
  original_post_id: string | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  hashtags?: PostHashtagEntity[];
  mentions?: PostMentionEntity[];
  is_liked_by_me?: boolean;
  is_reposted_by_me?: boolean;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  linked_entity?: EntityRef | null;
}

export type QuestionType = "open" | "mcq";
export type McqMode = "single" | "multi";
export type QuestionStatus = "open" | "closed";
export type QuestionTagType = "role" | "stack" | "topic";

export interface QuestionTag {
  id: string;
  question_id?: string;
  tag_type: QuestionTagType;
  tag: string;
  slug: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  position: number;
  text: string;
  vote_count?: number;
  vote_percent?: number;
  selected_by_me?: boolean;
  is_correct?: boolean;
}

export interface QuestionViewerState {
  is_author: boolean;
  has_answered: boolean;
  can_answer: boolean;
  can_view_locked_content: boolean;
  can_discuss: boolean;
  can_accept_answer: boolean;
}

export interface Question {
  id: string;
  author_id: string;
  type: QuestionType;
  mcq_mode?: McqMode | null;
  title: string;
  body: string;
  status: QuestionStatus;
  answer_count: number;
  discussion_count: number;
  participant_count: number;
  latest_activity_at: string;
  created_at: string;
  updated_at: string;
  author?: User;
  tags: QuestionTag[];
  options?: QuestionOption[];
  viewer_state?: QuestionViewerState;
  accepted_answer_id?: string | null;
  next_steps?: NextStepItem[];
  related_entities?: RelatedEntityRef[];
  trust_context?: TrustContext | null;
}

export interface QuestionAnswer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  author?: User;
  is_upvoted_by_me?: boolean;
}

export interface QuestionDiscussionComment {
  id: string;
  question_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

export interface PostResponse {
  post: Post;
}

export interface HashtagFeedResponse {
  tag: string;
  posts: Post[];
  nextCursor: string | null;
  related_tags: RelatedHashtag[];
}

export interface AuthResponse {
  token: string;
  user: User;
  error?: string;
}

// ─── Project Spaces ──────────────────────────────────────────────────────────

export type SpaceStatus = "idea" | "building" | "shipping" | "paused" | "archived";
export type SpaceVisibility = "public" | "private";
export type RepositoryVisibility = "public" | "private";
export type StackCategory = "frontend" | "backend" | "database" | "infra" | "tooling" | "other";
export type StackMaturity = "planned" | "in-use" | "deprecated";
export type MemberRole = "owner" | "maintainer" | "contributor";
export type RepoRole = "read" | "triage" | "write" | "maintain" | "admin";
export type JoinRequestStatus = "pending" | "accepted" | "rejected" | "need-info" | "withdrawn";
export type DiscussionCategory = "idea" | "decision" | "question" | "blocked" | "retrospective" | "announcement";
export type DiscussionStatus = "open" | "in-progress" | "resolved" | "closed";
export type UpdateType = "milestone" | "devlog" | "release" | "blocker" | "weekly-summary";
export type SpaceIssueStatus = "open" | "triaged" | "in-progress" | "resolved" | "closed";
export type SpaceIssuePriority = "low" | "medium" | "high" | "critical";
export type WorkItemType = "task" | "bug" | "feature" | "docs" | "research";
export type WorkSort = "updated" | "created" | "priority" | "due_date";
export type WorkDueState = "overdue" | "due_soon" | "scheduled" | "none";
export type WorkReadiness = "ready" | "needs_triage";
export type WorkView = "list" | "board" | "calendar" | "workload";
export type MilestoneStatus = "planned" | "active" | "completed" | "archived";
export type HealthBand = "Excellent" | "Healthy" | "Needs Attention";
export type FreelancePricingModel = "fixed" | "hourly";
export type FreelanceExperienceLevel = "any" | "junior" | "mid" | "senior";
export type FreelanceEngagementType = "one_time" | "ongoing";
export type FreelanceLocationMode = "remote" | "hybrid" | "onsite";
export type FreelanceProjectStatus = "open" | "in_review" | "awarded" | "completed" | "cancelled";
export type FreelanceProposalStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
export type LaunchProductType = "web-app" | "mobile-app" | "developer-tool" | "api" | "ai-tool" | "open-source" | "experimental" | "other";
export type LaunchDevelopmentStage = "prototype" | "mvp" | "beta" | "live" | "maintained" | "paused";
export type LaunchPhase = "beta" | "live";
export type LaunchCollaborationMode = "off" | "looking";
export type LaunchStatus = "draft" | "published" | "archived";
export type LaunchReviewRecommendation = "recommend" | "mixed" | "not_recommend";
export type LaunchFeedbackType = "suggestion" | "bug" | "idea";
export type LaunchFeedbackStatus = "open" | "acknowledged" | "planned" | "resolved" | "closed";
export type LaunchFeedbackVisibilityScope = "beta" | "public";
export type LaunchBetaRegistrationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export interface ProjectSpace {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  summary: string;
  description?: string;
  status: SpaceStatus;
  visibility: SpaceVisibility;
  primary_repo_url?: string;
  working_in_public?: boolean;
  current_focus?: string | null;
  open_roles?: string[];
  needed_skills?: string[];
  contribution_guide?: string | null;
  response_sla?: string | null;
  created_at: string;
  updated_at: string;
  owner?: User;
  members?: SpaceMember[];
  stack?: StackEntry[];
  repos?: SpaceRepo[];
  attached_repos?: SpaceRepoAttachment[];
  memberCount?: number;
  follower_count?: number;
  is_following?: boolean;
  linked_launch?: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    launch_phase?: LaunchPhase;
    status: LaunchStatus;
    upvote_count: number;
    review_count: number;
  } | null;
  next_steps?: NextStepItem[];
  related_entities?: RelatedEntityRef[];
  trust_context?: TrustContext | null;
  recent_posts?: Post[];
  viewer_permissions?: SpaceViewerPermissions;
}

export interface Repository {
  id: string;
  owner_id: string;
  space_id?: string | null;
  name: string;
  slug: string;
  visibility: RepositoryVisibility;
  description?: string | null;
  default_branch: string;
  language?: string | null;
  languages?: Array<{
    name: string;
    bytes: number;
    percentage: number;
  }>;
  created_by: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  my_role?: RepoRole;
  effective_role?: RepoRole | null;
  inherited_role?: RepoRole | null;
  direct_role?: RepoRole | null;
  is_outside_collaborator?: boolean;
  permissions?: RepoPermissions;
  can_read?: boolean;
  can_push?: boolean;
  can_open_pr?: boolean;
  can_review?: boolean;
  can_merge?: boolean;
  can_manage_rules?: boolean;
  can_manage_access?: boolean;
  can_archive?: boolean;
  can_delete?: boolean;
  can_manage_general?: boolean;
  can_manage_releases?: boolean;
  can_manage_branches?: boolean;
  can_manage_default_branch?: boolean;
  can_comment?: boolean;
  is_attached?: boolean;
  owner?: User;
  attached_space?: {
    id: string;
    name: string;
    slug: string;
    visibility: SpaceVisibility;
  } | null;
  collaboration_home?: RepositoryCollaborationHome;
  community_files?: Array<{
    key: string;
    path: string;
    name: string;
  }>;
  star_count?: number;
  watcher_count?: number;
  fork_count?: number;
  collaborator_count?: number;
  is_starred?: boolean;
  is_watching?: boolean;
  watch_level?: "all" | "releases" | "ignore" | null;
  protected_default_branch?: {
    branch_pattern: string;
    require_pr: boolean;
    required_approvals: number;
    require_status_checks: boolean;
  } | null;
  forked_from?: {
    id: string;
    name: string;
    slug: string;
    owner?: { id: string; name: string; username: string };
  } | null;
  recommendation?: RepositoryRecommendation | null;
}

export interface RepositoryRecommendation {
  score: number;
  reasons: string[];
  matched_stacks: string[];
  freshness_bucket: string;
  signal_breakdown: {
    collaboration_fit: number;
    stack_fit: number;
    freshness_activity: number;
    social_proof: number;
    completeness_trust: number;
  };
  source: "logoutdev";
}

export interface RepoPermissions {
  can_read: boolean;
  can_push: boolean;
  can_open_pr: boolean;
  can_review: boolean;
  can_merge: boolean;
  can_manage_rules: boolean;
  can_manage_access: boolean;
  can_archive: boolean;
  can_delete: boolean;
  can_manage_general?: boolean;
  can_manage_releases?: boolean;
  can_manage_branches?: boolean;
  can_manage_default_branch?: boolean;
  can_comment?: boolean;
  direct_role?: RepoRole | null;
  inherited_role?: RepoRole | null;
}

export type SpaceRepo = Repository;

export interface SpaceRepoAttachment {
  id: string;
  kind: "managed" | "external";
  label?: string | null;
  position: number;
  is_primary: boolean;
  repo_id?: string | null;
  external_url?: string | null;
  repo?: Repository | null;
}

export interface RepoMember {
  id: string;
  repo_id: string;
  user_id: string;
  role?: RepoRole;
  direct_role?: RepoRole | null;
  inherited_role?: RepoRole | null;
  effective_role?: RepoRole | null;
  source?: string;
  is_outside_collaborator?: boolean;
  granted_by?: string | null;
  created_at: string;
  user?: User;
}

export interface RepoTreeEntry {
  path: string;
  name: string;
  type: "tree" | "blob";
  mode: string;
  oid: string;
}

export interface RepoTreeResponse {
  ref: string;
  path: string;
  entries: RepoTreeEntry[];
}

export interface RepoBlobResponse {
  ref: string;
  path: string;
  size: number;
  is_binary: boolean;
  content?: string;
  encoding?: "utf-8";
}

export interface RepoReadmeResponse {
  readme: (RepoBlobResponse & { path: string }) | null;
}

export interface RepoCommit {
  oid: string;
  short_oid: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_at: string;
}

export interface RepoCommitResponse {
  ref: string;
  page: number;
  limit: number;
  commits: RepoCommit[];
}

export interface RepoBranch {
  name: string;
  oid: string;
  is_default: boolean;
  is_head: boolean;
}

export interface RepoTag {
  name: string;
  oid: string;
  tag_oid?: string;
  type: "annotated" | "lightweight";
  message?: string;
  tagger?: string;
  tagged_at?: string;
}

export interface CommitDiffFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  patch?: string;
}

export interface CommitDetail {
  oid: string;
  short_oid: string;
  parent_oids: string[];
  message: string;
  body: string;
  author_name: string;
  author_email: string;
  authored_at: string;
  stats: {
    additions: number;
    deletions: number;
    files_changed: number;
  };
  files: CommitDiffFile[];
}

export interface RepoRelease {
  id: string;
  repo_id: string;
  tag_name: string;
  title: string;
  body: string;
  is_draft: boolean;
  is_prerelease: boolean;
  created_by: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface RepoForkEntry {
  id: string;
  repo: {
    id: string;
    name: string;
    slug: string;
    visibility: RepositoryVisibility;
    owner?: { id: string; name: string; username: string };
  } | null;
  forker: { id: string; name: string; username: string } | null;
  created_at: string;
}

export interface RepoRefSummary {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  default_branch: string;
  visibility: RepositoryVisibility;
  owner?: {
    id: string;
    name: string;
    username: string;
  } | null;
  space?: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export interface BranchProtectionRule {
  id: string;
  repo_id: string;
  branch_pattern: string;
  require_pr: boolean;
  required_approvals: number;
  dismiss_stale_reviews: boolean;
  require_status_checks: boolean;
  required_status_contexts: string[];
  restrict_pushes: boolean;
  push_role_min: "write" | "maintain" | "admin";
  allow_force_push: boolean;
  allow_deletions: boolean;
  require_linear_history: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: User;
}

export type RepoDiscussionCategory = "general" | "q&a" | "ideas" | "show-and-tell";

export interface RepoDiscussion {
  id: string;
  repo_id: string;
  author_id: string;
  category: RepoDiscussionCategory;
  title: string;
  body: string;
  is_pinned: boolean;
  is_answered: boolean;
  answer_comment_id?: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  comments?: RepoDiscussionComment[];
}

export interface RepoDiscussionComment {
  id: string;
  discussion_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: RepoDiscussionComment[];
}

export interface RepoDiscussionState {
  mode: "space_handoff" | "setup_required";
  message: string;
  collaboration_home: RepositoryCollaborationHome;
  viewer_permissions?: SpaceViewerPermissions;
}

export type PullRequestStatus = "open" | "merged" | "closed";
export type PullRequestReviewStatus = "approved" | "changes_requested" | "commented" | "pending";
export type PullRequestMergeableState = "clean" | "blocked" | "draft" | "dirty" | "unknown" | "head_missing";

export interface PullRequestCompare {
  base_repo_id: string;
  base_branch: string;
  head_repo_id: string;
  head_branch: string;
  head_label: string;
  base_label: string;
  is_cross_repo: boolean;
  base_branch_exists: boolean;
  source_branch_exists: boolean;
  ahead_by: number;
  behind_by: number;
  mergeability_state: PullRequestMergeableState;
  blocking_reasons: string[];
  commits: RepoCommit[];
  diff: {
    stats: {
      additions: number;
      deletions: number;
      files_changed: number;
    };
    files: CommitDiffFile[];
  };
  existing_open_pull_request?: {
    id: string;
    number: number;
    title: string;
    status: PullRequestStatus;
  } | null;
}

export interface PullRequestHeadOption {
  repo_id: string;
  owner_username: string;
  repo_name: string;
  is_same_repo: boolean;
  is_fork: boolean;
  default_branch: string;
  writable_branches: string[];
}

export interface PullRequest {
  id: string;
  repo_id: string;
  source_repo_id: string;
  number: number;
  title: string;
  body: string;
  source_branch: string;
  target_branch: string;
  status: PullRequestStatus;
  is_draft: boolean;
  status_checks?: string[];
  author_id: string;
  merged_by?: string | null;
  merged_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  merger?: User | null;
  base_repo?: RepoRefSummary | null;
  source_repo?: RepoRefSummary | null;
  is_cross_repo?: boolean;
  source_branch_exists?: boolean;
  head_label?: string;
  base_label?: string;
  compare_summary?: {
    ahead_by: number;
    behind_by: number;
    base_branch_exists: boolean;
    source_branch_exists: boolean;
  };
  commits_count?: number;
  mergeable_state?: PullRequestMergeableState;
  review_summary?: {
    approvals_count: number;
    changes_requested_count: number;
    commenters_count: number;
    stale_reviews_count: number;
    latest_by_reviewer: Array<{
      reviewer_id: string;
      reviewer?: User | null;
      status: PullRequestReviewStatus;
      submitted_at: string;
      is_stale: boolean;
    }>;
  };
  rule_evaluation?: {
    protected_branch: boolean;
    required_approvals: number;
    dismiss_stale_reviews?: boolean;
    require_status_checks?: boolean;
    review_summary: PullRequest["review_summary"];
    source_branch_exists?: boolean;
    status_checks: {
      required: string[];
      passed: string[];
      pending: string[];
      satisfied: boolean;
    };
    merge_allowed: boolean;
    mergeable_state: PullRequestMergeableState;
    blocking_reasons: string[];
  };
  reviewer_eligibility?: {
    can_review: boolean;
    can_approve: boolean;
    can_request_changes: boolean;
  };
  stats?: {
    additions: number;
    deletions: number;
    files_changed: number;
  };
}

export interface PullRequestReview {
  id: string;
  pull_request_id: string;
  reviewer_id: string;
  status: PullRequestReviewStatus;
  body?: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  reviewer?: User;
}

export interface PullRequestComment {
  id: string;
  pull_request_id: string;
  review_id?: string | null;
  author_id: string;
  path?: string | null;
  position?: number | null;
  commit_id?: string | null;
  body: string;
  is_resolved: boolean;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: PullRequestComment[];
}

export interface GitAccessToken {
  id: string;
  name: string;
  token_prefix: string;
  scopes: Array<"git:read" | "git:write">;
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
}

export interface RepoAccessOverview {
  access: {
    user_id?: string | null;
    repo_id: string;
    effective_role: RepoRole | null;
    direct_role: RepoRole | null;
    inherited_role: RepoRole | null;
    is_outside_collaborator: boolean;
    permissions: RepoPermissions;
  };
  collaborators: RepoMember[];
}

export interface RepoCollaboratorCandidate {
  id: string;
  name: string;
  email: string;
  username?: string;
  effective_role?: RepoRole | null;
  inherited_role?: RepoRole | null;
  direct_role?: RepoRole | null;
  is_outside_collaborator?: boolean;
}

export interface RepoInsights {
  summary: {
    stars: number;
    watchers: number;
    forks: number;
    pull_requests_total: number;
    open_pull_requests: number;
    merged_pull_requests: number;
    collaborator_count: number;
    commit_count: number;
  };
  contributors: Array<{
    author_name: string;
    author_email: string;
    commit_count: number;
    latest_commit_at: string;
  }>;
  commit_activity: Array<{
    date: string;
    count: number;
  }>;
  maintainers: RepoMember[];
  reviewers: Array<{
    reviewer_id: string;
    review_count: number;
    approvals: number;
  }>;
  collaborators: RepoMember[];
}

export interface StackEntry {
  id: string;
  space_id: string;
  category: StackCategory;
  technology: string;
  maturity: StackMaturity;
}

export interface SpaceMember {
  id: string;
  space_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  user?: User;
}

export interface JoinRequest {
  id: string;
  space_id: string;
  user_id: string;
  message: string;
  skills: string[];
  availability_hours: number | null;
  proof_links: string[];
  status: JoinRequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  applicant?: User;
}

export interface Discussion {
  id: string;
  space_id: string;
  author_id: string;
  title: string;
  body: string;
  category: DiscussionCategory;
  is_pinned: boolean;
  status: DiscussionStatus;
  decision_summary?: string;
  answer_reply_id?: string | null;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: DiscussionReply[];
  answer_reply?: DiscussionReply | null;
  replyCount?: number;
}

export interface DiscussionReply {
  id: string;
  thread_id: string;
  author_id: string;
  parent_reply_id?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface SpaceUpdate {
  id: string;
  space_id: string;
  author_id: string;
  type: UpdateType;
  repo_id?: string | null;
  work_item_id?: string | null;
  title: string;
  content: string;
  what_shipped?: string;
  next_up?: string;
  blockers?: string;
  evidence_links: string[];
  created_at: string;
  updated_at: string;
  author?: User;
  repo?: Repository | null;
  work_item?: SpaceWorkItem | null;
}

export interface SpaceMilestone {
  id: string;
  space_id: string;
  created_by: string;
  title: string;
  description?: string | null;
  status: MilestoneStatus;
  target_date?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  creator?: User | null;
}

export interface SpaceWorkViewerState {
  can_manage: boolean;
  can_edit_content: boolean;
  can_claim: boolean;
  can_start: boolean;
  can_resolve: boolean;
  can_bulk_manage: boolean;
  is_claimed_by_me: boolean;
  is_member: boolean;
}

export interface SpaceWorkSummary {
  total: number;
  open: number;
  unassigned: number;
  blocked: number;
  overdue: number;
  due_soon: number;
  stale: number;
  ready_for_contributor: number;
  needs_triage: number;
  by_status: Record<SpaceIssueStatus, number>;
}

export interface SpaceWorkComment {
  id: string;
  issue_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface SpaceWorkActivityChange {
  field: string;
  label: string;
  from?: string | null;
  to?: string | null;
}

export interface SpaceWorkActivity {
  id: string;
  space_id: string;
  issue_id: string;
  actor_user_id?: string | null;
  event_type: string;
  payload?: {
    source?: string;
    title?: string;
    type?: string;
    update_id?: string;
    comment_id?: string;
    parent_comment_id?: string | null;
    body_preview?: string;
    changes?: SpaceWorkActivityChange[];
  };
  created_at: string;
  actor?: User | null;
}

export interface SpaceWorkItem {
  id: string;
  space_id: string;
  author_id: string;
  assignee_user_id?: string | null;
  repo_id?: string | null;
  milestone_id?: string | null;
  type: WorkItemType;
  title: string;
  body: string;
  status: SpaceIssueStatus;
  priority: SpaceIssuePriority;
  good_first_task?: boolean;
  help_wanted?: boolean;
  blocked_reason?: string | null;
  close_reason?: string | null;
  estimate?: string | null;
  target_date?: string | null;
  needed_skill?: string | null;
  created_at: string;
  updated_at: string;
  due_state?: WorkDueState;
  is_stale?: boolean;
  readiness?: WorkReadiness | null;
  viewer_state?: SpaceWorkViewerState;
  author?: User;
  assignee?: User | null;
  repo?: Pick<Repository, "id" | "name" | "slug" | "visibility"> | null;
  milestone?: Pick<SpaceMilestone, "id" | "title" | "status" | "target_date"> | null;
}

export type SpaceIssue = SpaceWorkItem;

export interface SpaceFollower {
  id: string;
  space_id: string;
  user_id: string;
  created_at: string;
  user?: User;
}

export interface HealthScore {
  score: number;
  band: HealthBand;
  factors: Record<string, number>;
  metrics?: Record<string, number>;
}

export interface DecisionEntry {
  id: string;
  title: string;
  decision_summary: string;
  category: DiscussionCategory;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface FreelanceProjectSkill {
  id: string;
  project_id: string;
  skill: string;
  rank: number;
}

export interface FreelanceProjectViewerState {
  is_owner: boolean;
  can_edit: boolean;
  can_submit_proposal: boolean;
  can_view_proposals: boolean;
  has_submitted_proposal: boolean;
  my_proposal_id?: string | null;
  my_proposal_status?: FreelanceProposalStatus | null;
  can_open_workspace: boolean;
}

export interface FreelanceProject {
  id: string;
  client_id: string;
  linked_space_id?: string | null;
  accepted_proposal_id?: string | null;
  title: string;
  slug: string;
  summary: string;
  description: string;
  pricing_model: FreelancePricingModel;
  currency_code: string;
  budget_min_cents: number;
  budget_max_cents: number;
  experience_level: FreelanceExperienceLevel;
  engagement_type: FreelanceEngagementType;
  duration_weeks?: number | null;
  location_mode: FreelanceLocationMode;
  timezone_note?: string | null;
  status: FreelanceProjectStatus;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  client?: User;
  skills?: FreelanceProjectSkill[];
  linked_space?: {
    id: string;
    slug: string;
    name: string;
    status: SpaceStatus;
    visibility: SpaceVisibility;
  } | null;
  accepted_proposal?: Partial<FreelanceProposal> | null;
  viewer_state?: FreelanceProjectViewerState;
  next_steps?: NextStepItem[];
  related_entities?: RelatedEntityRef[];
  trust_context?: TrustContext | null;
}

export interface FreelanceProposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_note: string;
  pricing_model: FreelancePricingModel;
  currency_code: string;
  bid_amount_cents: number;
  estimated_duration_weeks?: number | null;
  availability_hours?: number | null;
  proof_links: string[];
  status: FreelanceProposalStatus;
  reviewed_at?: string | null;
  withdrawn_at?: string | null;
  created_at: string;
  updated_at: string;
  project?: FreelanceProject;
  freelancer?: User & {
    profile_skills?: UserProfileSkill[];
    featured_projects?: UserFeaturedProject[];
  };
}

export interface FreelanceProjectListResponse {
  projects: FreelanceProject[];
  total: number;
  page: number;
  limit: number;
}

export interface LaunchScreenshot {
  id: string;
  image_url: string;
  caption?: string | null;
  rank: number;
  created_at: string;
}

export interface LaunchTechStackItem {
  id: string;
  technology: string;
  rank: number;
  created_at: string;
}

export interface LaunchViewerState {
  is_owner: boolean;
  is_upvoted_by_me: boolean;
  my_review_id?: string | null;
  can_request_collaboration: boolean;
  can_edit: boolean;
  can_publish: boolean;
  beta_registration_status?: LaunchBetaRegistrationStatus | null;
  can_request_beta: boolean;
  can_access_beta: boolean;
  can_moderate_beta: boolean;
  is_early_supporter: boolean;
  can_submit_feedback: boolean;
  can_submit_review: boolean;
}

export interface LaunchBetaSummary {
  capacity?: number | null;
  approved_count: number;
  pending_count: number;
  remaining_seats?: number | null;
  is_full: boolean;
}

export interface LaunchEarlySupporter {
  id: string;
  name: string;
  username?: string | null;
  headline?: string | null;
  joined_at?: string | null;
}

export interface LaunchBetaRegistration {
  id: string;
  launch_id: string;
  user_id: string;
  status: LaunchBetaRegistrationStatus;
  message?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: User | null;
  reviewer?: User | null;
}

export interface LaunchReview {
  id: string;
  launch_id: string;
  author_id: string;
  headline: string;
  body: string;
  recommendation: LaunchReviewRecommendation;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface LaunchFeedbackComment {
  id: string;
  feedback_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface LaunchFeedbackItem {
  id: string;
  launch_id: string;
  author_id: string;
  type: LaunchFeedbackType;
  title: string;
  body: string;
  status: LaunchFeedbackStatus;
  visibility_scope: LaunchFeedbackVisibilityScope;
  created_at: string;
  updated_at: string;
  author?: User;
  comments?: LaunchFeedbackComment[];
}

export interface Launch {
  id: string;
  builder_id: string;
  linked_space_id?: string | null;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  product_type: LaunchProductType;
  development_stage: LaunchDevelopmentStage;
  launch_phase: LaunchPhase;
  beta_capacity?: number | null;
  beta_access_url?: string | null;
  beta_opened_at?: string | null;
  live_url?: string | null;
  went_live_at?: string | null;
  demo_url?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  docs_url?: string | null;
  collaboration_mode: LaunchCollaborationMode;
  collaboration_note?: string | null;
  collaboration_roles: string[];
  status: LaunchStatus;
  upvote_count: number;
  review_count: number;
  feedback_count: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  builder?: User;
  screenshots?: LaunchScreenshot[];
  tech_stack?: LaunchTechStackItem[];
  linked_space?: {
    id: string;
    name?: string | null;
    slug?: string | null;
    visibility: SpaceVisibility;
    status: SpaceStatus;
  } | null;
  viewer_state?: LaunchViewerState;
  beta_summary?: LaunchBetaSummary;
  early_supporters?: LaunchEarlySupporter[];
  early_supporter_count?: number;
  next_steps?: NextStepItem[];
  related_entities?: RelatedEntityRef[];
  trust_context?: TrustContext | null;
  builder_posts?: Post[];
  linked_space_health?: {
    recent_updates: number;
    active_contributors: number;
  } | null;
  recent_updates?: SpaceUpdate[];
}

export type LaunchListItem = Launch;

export interface LaunchListResponse {
  launches: LaunchListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface LaunchCollaborationRequestPayload {
  message: string;
  skills: string[];
  availability_hours?: number | null;
  proof_links: string[];
}

export type DiscoveryEntityType =
  | "builder"
  | "launch"
  | "space"
  | "question"
  | "freelance_project";

export interface DiscoveryRankExplanation {
  score: number;
  reasons: string[];
  matched_stacks: string[];
  freshness_bucket: string;
  proof_of_work_band: string;
}

export interface DiscoveryEntityMeta {
  eyebrow: string;
  byline?: string | null;
  stats?: string | null;
  updated_at?: string | null;
  collaboration_label?: string | null;
  status_label?: string | null;
  proof_of_work_band?: string | null;
}

export interface DiscoveryEntity {
  id: string;
  type: DiscoveryEntityType;
  title: string;
  subtitle: string;
  href: string;
  visibility: string;
  tags: string[];
  rank_explanation: DiscoveryRankExplanation;
  meta: DiscoveryEntityMeta;
}

export interface DiscoverySection {
  key: string;
  title: string;
  total: number;
  items: DiscoveryEntity[];
  see_all_href: string;
  empty_copy: string;
}

export interface DiscoveryRailModuleItem {
  label: string;
  href: string;
  meta?: string | null;
}

export interface DiscoveryRailModule {
  key: string;
  title: string;
  reason: string;
  items: DiscoveryRailModuleItem[];
}

export interface DiscoveryResult {
  query: string;
  applied_filters: {
    q?: string;
    type: string[];
    stack?: string;
    tag?: string;
    status?: string;
    collab: boolean;
    sort: string;
    viewer_context: string;
  };
  sections: DiscoverySection[];
  rail_modules: DiscoveryRailModule[];
  featured_entities: DiscoveryEntity[];
  suggested_next_filters: string[];
  guest_safe: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

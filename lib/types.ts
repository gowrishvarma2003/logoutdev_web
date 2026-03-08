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
  createdAt?: string;
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
}

export interface ProofOfWorkSignals {
  score: number;
  band: ProofOfWorkBand;
  factors: {
    project_participation: number;
    update_consistency: number;
    discussion_engagement: number;
    feed_consistency: number;
  };
}

export interface ProfileResponse {
  profile: User;
  is_me: boolean;
  stats: ProfileStats;
  skills: UserProfileSkill[];
  featured_projects: UserFeaturedProject[];
}

export interface ActivityItem {
  type: "post" | "discussion" | "update";
  created_at: string;
  item: {
    id: string;
    content?: string;        // post
    title?: string;          // discussion | update
    category?: string;       // discussion
    status?: string;         // discussion
    type?: string;           // update
    space?: { id: string; name: string; visibility: string };
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
export type StackCategory = "frontend" | "backend" | "database" | "infra" | "tooling" | "other";
export type StackMaturity = "planned" | "in-use" | "deprecated";
export type MemberRole = "owner" | "maintainer" | "contributor";
export type RepoRole = "read" | "write" | "admin";
export type JoinRequestStatus = "pending" | "accepted" | "rejected" | "need-info" | "withdrawn";
export type DiscussionCategory = "idea" | "decision" | "question" | "blocked" | "retrospective";
export type DiscussionStatus = "open" | "in-progress" | "resolved" | "closed";
export type UpdateType = "milestone" | "devlog" | "release" | "blocker" | "weekly-summary";
export type SpaceIssueStatus = "open" | "triaged" | "in-progress" | "resolved" | "closed";
export type SpaceIssuePriority = "low" | "medium" | "high" | "critical";
export type HealthBand = "Excellent" | "Healthy" | "Needs Attention";
export type FreelancePricingModel = "fixed" | "hourly";
export type FreelanceExperienceLevel = "any" | "junior" | "mid" | "senior";
export type FreelanceEngagementType = "one_time" | "ongoing";
export type FreelanceLocationMode = "remote" | "hybrid" | "onsite";
export type FreelanceProjectStatus = "open" | "in_review" | "awarded" | "completed" | "cancelled";
export type FreelanceProposalStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
export type LaunchProductType = "web-app" | "mobile-app" | "developer-tool" | "api" | "ai-tool" | "open-source" | "experimental" | "other";
export type LaunchDevelopmentStage = "prototype" | "mvp" | "beta" | "live" | "maintained" | "paused";
export type LaunchCollaborationMode = "off" | "looking";
export type LaunchStatus = "draft" | "published" | "archived";
export type LaunchReviewRecommendation = "recommend" | "mixed" | "not_recommend";
export type LaunchFeedbackType = "suggestion" | "bug" | "idea";
export type LaunchFeedbackStatus = "open" | "acknowledged" | "planned" | "resolved" | "closed";

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
  created_at: string;
  updated_at: string;
  owner?: User;
  members?: SpaceMember[];
  stack?: StackEntry[];
  repos?: SpaceRepo[];
  memberCount?: number;
  linked_launch?: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    status: LaunchStatus;
    upvote_count: number;
    review_count: number;
  } | null;
}

export interface SpaceRepo {
  id: string;
  space_id: string;
  name: string;
  slug: string;
  description?: string | null;
  default_branch: string;
  created_by: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  my_role?: RepoRole;
}

export interface RepoMember {
  id: string;
  repo_id: string;
  user_id: string;
  role: Exclude<RepoRole, "admin">;
  granted_by: string;
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

export interface GitAccessToken {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: DiscussionReply[];
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
  title: string;
  content: string;
  what_shipped?: string;
  next_up?: string;
  blockers?: string;
  evidence_links: string[];
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface SpaceIssue {
  id: string;
  space_id: string;
  author_id: string;
  assignee_user_id?: string | null;
  title: string;
  body: string;
  status: SpaceIssueStatus;
  priority: SpaceIssuePriority;
  created_at: string;
  updated_at: string;
  author?: User;
  assignee?: User | null;
}

export interface HealthScore {
  score: number;
  band: HealthBand;
  factors: Record<string, number>;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

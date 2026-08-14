/**
 * DangerZone Components - Reusable Danger Zone Pattern
 * 
 * These components provide a consistent, reusable pattern for displaying
 * dangerous or destructive actions in settings pages.
 * 
 * COMPONENTS:
 * -----------
 * 
 * 1. DangerZone.tsx
 *    - Container component with red/rose theme
 *    - Warning icon header
 *    - Customizable title and description
 *    - Children slot for DangerAction components
 * 
 * 2. DangerAction.tsx
 *    - Individual action item component
 *    - Title, description, and action button
 *    - Built-in confirmation modal (optional)
 *    - Loading and error states
 *    - Full TypeScript support
 * 
 * USAGE EXAMPLES:
 * ---------------
 * 
 * Basic Usage:
 * 
 *   import DangerZone from "@/components/settings/DangerZone";
 *   import DangerAction from "@/components/settings/DangerAction";
 *   
 *   export default function SettingsPage() {
 *     const handleDeleteAccount = async () => {
 *       // Your delete logic here
 *       await deleteAccount();
 *     };
 *   
 *     return (
 *       <DangerZone>
 *         <DangerAction
 *           title="Delete Account"
 *           description="Permanently delete your account and all data"
 *           buttonText="Delete Account"
 *           onAction={handleDeleteAccount}
 *           requireConfirmation={true}
 *           confirmTitle="Delete Your Account?"
 *           confirmDescription="This action cannot be undone."
 *           confirmButtonText="Delete Account"
 *         />
 *       </DangerZone>
 *     );
 *   }
 * 
 * Multiple Actions:
 * 
 *   <DangerZone title="Danger Zone" description="Destructive actions">
 *     <DangerAction
 *       title="Delete Account"
 *       description="Delete account"
 *       buttonText="Delete"
 *       onAction={handleDeleteAccount}
 *     />
 *     
 *     <DangerAction
 *       title="Clear All Data"
 *       description="Clear all user data"
 *       buttonText="Clear"
 *       onAction={handleClearData}
 *     />
 *   </DangerZone>
 * 
 * No Confirmation:
 * 
 *   <DangerAction
 *     title="Reset Settings"
 *     description="Reset to defaults"
 *     buttonText="Reset"
 *     onAction={handleReset}
 *     requireConfirmation={false}
 *   />
 * 
 * PROPS:
 * ------
 * 
 * DangerZone:
 *   - children (React.ReactNode) - Required. Content (typically DangerAction components)
 *   - title (string) - Optional. Header title. Default: "Danger Zone"
 *   - description (string) - Optional. Header description. Default: "Irreversible and destructive actions"
 * 
 * DangerAction:
 *   - title (string) - Required. Action title
 *   - description (string) - Required. What will happen
 *   - buttonText (string) - Required. Button label
 *   - onAction (function) - Required. Async callback when action is confirmed
 *   - requireConfirmation (boolean) - Optional. Show confirmation modal. Default: true
 *   - confirmTitle (string) - Optional. Modal title. Default: "Confirm Action"
 *   - confirmDescription (string) - Optional. Modal description
 *   - confirmButtonText (string) - Optional. Modal button text. Default: "Confirm"
 *   - disabled (boolean) - Optional. Disable the action. Default: false
 * 
 * STYLING:
 * --------
 * 
 * The components use Tailwind CSS with the rose/red color palette:
 * - Rose-600: Action button (hover: Rose-700)
 * - Rose-500/5: Background tint
 * - Rose-500/30: Border color
 * - Rose-400: Icon color
 * - Rose-300: Text color
 * 
 * FEATURES:
 * ---------
 * 
 * ✓ TypeScript support with full prop interfaces
 * ✓ Built-in confirmation modals with loading states
 * ✓ Error handling and display
 * ✓ Accessible keyboard navigation
 * ✓ Customizable confirmation text
 * ✓ Async action support
 * ✓ Optional confirmation (can be bypassed)
 * ✓ Disabled state support
 * ✓ Responsive design
 * 
 * INTEGRATION:
 * -----------
 * 
 * Already integrated in:
 * - app/(app)/settings/account/page.tsx - Uses DangerZone and DangerAction for account deletion
 * 
 * Can be used in any settings page that has destructive actions:
 * - Team settings (delete team)
 * - Repository settings (delete repo)
 * - Webhook settings (delete webhook)
 * - Integration settings (remove integration)
 */

/**
 * In-app help content, kept as data so the same source both renders the How-To Guide
 * and answers its search box. `docs/USER_GUIDE.md` is the long-form version of the same
 * material; when app behaviour changes, update both.
 *
 * @typedef {object} HelpSection
 * @property {string} id            Stable anchor/accordion key.
 * @property {string} title        What the user sees in the list.
 * @property {string} category     Grouping heading.
 * @property {string[]} keywords   Extra search terms, including words that do not appear
 *                                 in the text (synonyms, what people actually type).
 * @property {string[]} [body]     Plain paragraphs.
 * @property {string[]} [steps]    Ordered instructions.
 * @property {string} [roleNote]   Who can and cannot do this.
 */

/** Section groups, in the order the page renders them. */
export const HELP_CATEGORIES = [
  'Getting started',
  'Your network',
  'Getting things done',
  'Team & collaboration',
  'Money & reporting',
  'Your account',
  'Good to know',
];

/** @type {HelpSection[]} */
export const HELP_SECTIONS = [
  {
    id: 'signing-in',
    title: 'Sign in to URME',
    category: 'Getting started',
    keywords: ['login', 'log in', 'sign in', 'password', 'google', 'oauth', 'locked', 'signup', 'register'],
    steps: [
      'Open the app. If you are not signed in you land on the "Welcome back" screen.',
      'Type your email and password, then press "Log in".',
      'Or press "Continue with Google" at the top and pick your Google account — use the same address your URME account was created with.',
    ],
    body: [
      'A wrong email or password shows a red message above the form. Too many failed attempts can lock the account, and only an admin can unlock it.',
      'There is no self-signup. Accounts are created for you by an admin or the CEO, so if you see "Access Restricted" after signing in, ask them to set your account up.',
      'If your account has two-factor authentication switched on, sign in with email and password rather than Google — the Google route does not show the code prompt and may bounce you back to the login screen.',
    ],
  },
  {
    id: 'two-factor-login',
    title: 'Enter a two-factor code at login',
    category: 'Getting started',
    keywords: ['2fa', 'mfa', 'two factor', 'totp', 'authenticator', 'code', 'six digit', 'google authenticator', 'authy'],
    steps: [
      'Sign in with your email and password as usual.',
      'When the "Two-factor authentication" screen appears, open your authenticator app.',
      'Read the current 6-digit code for URME and type it into the six boxes.',
      'Press "Verify and continue".',
    ],
    body: [
      'Codes expire every 30 seconds. If yours is rejected, wait for the app to show a fresh code and try again.',
    ],
  },
  {
    id: 'reset-password',
    title: 'Reset a forgotten password',
    category: 'Getting started',
    keywords: ['forgot password', 'reset', 'email link', 'recovery', 'change password', 'locked out', 'invalid link'],
    steps: [
      'On the login screen, press "Forgot password?" underneath the password field.',
      'Enter your email address and press "Send reset link".',
      'Open the email and click the link on the same device and browser you want to reset from.',
      'Type the new password twice, then press "Reset password".',
      'Sign in with the new password.',
    ],
    body: [
      'The confirmation message appears whether or not the address is registered, so it never reveals who has an account.',
      'If you see "Invalid reset link", it has expired, was already used, or was opened somewhere that could not read it. Press "Request a new link" and start again.',
      'Already signed in? You can change your password directly under Profile → Account Security instead.',
    ],
  },
  {
    id: 'access-and-subscription',
    title: 'Access, subscriptions and the expiry banner',
    category: 'Getting started',
    keywords: ['subscription', 'expired', 'expiring', 'billing', 'payment', 'stripe', 'reactivate', 'access denied', 'paid through'],
    body: [
      'Admins and the CEO always have access. Standard members need an active subscription — either a status of Active or a paid-through date still in the future.',
      'In the last 14 days before your paid-through date, an amber bar appears across the top of every page with a "Subscribe now" link.',
      'Once access lapses you are sent to a single screen, "Your URME Access Has Expired". Press "Subscribe — $25/month", then ask your admin to reactivate the account.',
      'You can always check your own status under Profile → Subscription.',
    ],
    roleNote: 'Admins and the CEO reactivate other people from the Team page. Standard members cannot change their own subscription.',
  },
  {
    id: 'navigation',
    title: 'Find your way around',
    category: 'Getting started',
    keywords: ['menu', 'sidebar', 'navigation', 'nav', 'mobile', 'collapse', 'hamburger', 'pages'],
    body: [
      'On a computer the menu runs down the left: Search, Dashboard, Pipeline, Businesses, Contacts, Tasks, Templates, Ideas, Events, Sync Hub, Finance, Reports, Team, Settings and Profile.',
      'Press the arrow at the bottom of the menu to shrink it to icons, and again to bring the labels back.',
      'On a phone the menu hides behind the button with three lines in the top-right. Tap it to slide the menu out, then tap anywhere outside to close it.',
    ],
    roleNote: 'Settings only appears for admins and the CEO. Everything else is visible to everyone.',
  },
  {
    id: 'global-search',
    title: 'Search across everything',
    category: 'Getting started',
    keywords: ['search', 'find', 'lookup', 'global search', 'recent searches', 'filter chips'],
    steps: [
      'Press "Search" in the menu, or the magnifying glass in the mobile header.',
      'Start typing. Results group into Businesses, Contacts, Tasks and Events as you type.',
      'Tap a result to jump to it, or press "Show all N results" when a group has more than five matches.',
    ],
    body: [
      'Businesses match on name and industry, contacts on name and company, tasks on title, events on name and location.',
      'Before you type, category chips let you browse one type at a time and your last eight searches appear under "Recent". "Clear All" forgets them.',
    ],
  },
  {
    id: 'quick-capture',
    title: 'Jot something down with Quick Capture',
    category: 'Getting started',
    keywords: ['quick capture', 'lightning', 'fab', 'shortcut', 'new task', 'new idea', 'new lead', 'fast'],
    steps: [
      'Tap the round lightning-bolt button in the bottom-right corner of any page.',
      'Choose Task, Idea or Lead.',
      'Type the title, add optional details, and press "Capture".',
    ],
    body: [
      'A task arrives as "To Do" with medium priority, an idea as a new "Other" idea, and a lead as a business at the New Lead stage. Fill in the rest whenever you have time.',
    ],
  },

  {
    id: 'add-business',
    title: 'Add a business',
    category: 'Your network',
    keywords: ['new business', 'add company', 'create lead', 'tags', 'account manager', 'needs', 'offers', 'industry'],
    steps: [
      'Open Businesses and press "Add Business".',
      'Fill in the Company Name — it is the only required field.',
      'Set the Industry and the Stage (new businesses start at New Lead).',
      'Fill in Needs and Offers. Every AI suggestion and every match depends on these two fields, so they are worth the effort.',
      'Add the main contact, links, address, city and state.',
      'Pick an Account Manager, add tags (type one and press Enter), and write internal notes.',
      'Press "Add Business".',
    ],
    body: [
      'Tags are removed by tapping them. The notes box supports bold, italic, underline, lists and links.',
    ],
  },
  {
    id: 'find-a-business',
    title: 'Search and filter your businesses',
    category: 'Your network',
    keywords: ['filter', 'search businesses', 'stage', 'manager', 'industry', 'city', 'state', 'follow up', 'clear filters'],
    body: [
      'The search box matches company names and industries.',
      'Five dropdowns narrow the list further — Stage, Manager, Industry, City and State — and only offer values that exist in your data.',
      '"Needs Follow-Up" is a separate toggle chip that shows only companies that are overdue a conversation. Tap it again to switch it off.',
      'When dropdown filters are active a "Clear (N)" button appears and resets all five at once.',
    ],
  },
  {
    id: 'improve-with-ai',
    title: 'Use "Improve with AI"',
    category: 'Your network',
    keywords: ['ai', 'improve with ai', 'rewrite', 'sparkle', 'polish', 'copy', 'wording', 'suggestions'],
    body: [
      '"Improve with AI" appears when you add or edit a business, a task, an idea and an event. It rewrites what you have typed into clearer, more compelling wording and drops the result back into the form.',
      'Nothing is saved until you press the save button, so you can read the suggestion over and edit it first. If you do not like it, retype the fields or close the dialog.',
      'A business needs a name before the button will run; a task needs a title or a description; an idea needs a title; an event needs a name or a description.',
    ],
  },
  {
    id: 'duplicate-warnings',
    title: 'Handle a duplicate warning',
    category: 'Your network',
    keywords: ['duplicate', 'already exists', 'same name', 'similar name', 'same email', 'create anyway', 'merge'],
    body: [
      'While you type a name, URME checks what you already have. If something looks like a match, an amber panel lists up to three candidates and why they matched — same name, similar name, or same email.',
      'Press "View" next to a candidate to open the record you already have, or press "Create Anyway" to dismiss the warning and carry on.',
      'The same check runs when you add a contact while logging an interaction; there, tapping a suggestion reuses the existing person instead of creating a second copy.',
      'Duplicate checks do not run during CSV import, so tidy the file up before you upload it.',
    ],
  },
  {
    id: 'csv-import-export',
    title: 'Import and export CSV files',
    category: 'Your network',
    keywords: ['csv', 'import', 'export', 'spreadsheet', 'excel', 'bulk upload', 'download', 'map columns'],
    steps: [
      'To export: press "Export CSV" on Businesses, Events or Finance. The Businesses export contains exactly what is on screen, so filters and search apply.',
      'To import: press "Import CSV" on Businesses and choose a .csv or .txt file.',
      'Check the column mapping. URME guesses from your headings; correct anything wrong and set columns you do not want to "— Skip —".',
      'Press "Import N Businesses" and wait for the progress bar.',
      'Read the summary of how many rows imported, then press "Done".',
    ],
    body: [
      'Imported companies arrive at the New Lead stage tagged "csv-import", so you can find the batch afterwards. Rows without a company name are skipped.',
      'Only businesses can be imported — there is no importer for contacts, tasks or finance entries.',
    ],
  },
  {
    id: 'map-view',
    title: 'See your network on a map',
    category: 'Your network',
    keywords: ['map', 'geocode', 'location', 'pin', 'coordinates', 'city', 'state', 'leaflet'],
    steps: [
      'On Businesses, press the pin icon next to the search box.',
      'If a yellow note says some companies need geocoding, press "Geocode All" to look up coordinates from each one\'s city and state.',
      'Click a dot for a pop-up with the company name, industry, stage and health score.',
      'Press the list icon to go back to cards.',
    ],
    body: [
      'Dot colours follow the health score, green through red. A company with neither a city nor a state cannot be placed on the map. Geocoding takes about a second per company.',
    ],
  },
  {
    id: 'synergy-scanner',
    title: 'Find partnerships with the Synergy Scanner',
    category: 'Your network',
    keywords: ['synergy', 'scanner', 'matches', 'matchmaking', 'introductions', 'intro', 'pairings', 'score', 'ai matching'],
    steps: [
      'Open Businesses and press "Synergy Scanner". You need at least two businesses.',
      'Wait while it thinks — it reviews up to 20 companies and proposes around five pairings.',
      'Read the results on the Dashboard under "Top Matches", or on a company profile under the Matches tab.',
    ],
    body: [
      'Every match gets a synergy score out of 100 and a written reason, both saved.',
      'Matches work off the Needs and Offers fields, so fill those in first. Running the scanner again adds more suggestions rather than replacing the old ones.',
    ],
  },
  {
    id: 'work-a-match',
    title: 'Propose or dismiss a match',
    category: 'Your network',
    keywords: ['match', 'propose intro', 'dismiss', 'mark introduced', 'introduction', 'status'],
    steps: [
      'Open a business profile and choose the Matches tab.',
      'On a suggested match, press "Propose Intro" to move it forward, or "Dismiss" to set it aside.',
      'Once an intro is proposed, press "Mark Introduced" after you have made the connection.',
    ],
    body: [
      'Dismissed matches stay in the list for reference, they just stop counting as suggestions.',
    ],
  },
  {
    id: 'business-profile',
    title: 'Read and edit a business profile',
    category: 'Your network',
    keywords: ['business profile', 'edit business', 'delete business', 'export pdf', 'contact info', 'account manager', 'notes'],
    body: [
      'Click any business card to open its profile. The header carries the stage, the health score, and quick links for email, phone, website and location.',
      'The sparkle button generates an AI relationship brief. The ⋮ button holds "Export PDF", "Edit" and "Delete".',
      '"Export PDF" saves a report with the overview, contact details, description, needs and offers, the last ten interactions and every match.',
      'Deleting a business is permanent and cannot be undone.',
      'Below the header you get Contact Info, the Account Manager, linked events, and the Needs, Offers and Notes cards, then tabs for Activity, Contacts and Matches.',
    ],
  },
  {
    id: 'ai-briefs',
    title: 'Get an AI brief or acquisition strategy',
    category: 'Your network',
    keywords: ['ai brief', 'relationship brief', 'strategy', 'next step', 'outreach draft', 'talking points', 'watchouts', 'regenerate'],
    body: [
      'On a business profile, press the sparkle button for a brief: a summary, the best next step, an outreach draft you can adapt, talking points and watchouts. Contact profiles have the same thing under "Generate".',
      'Clicking a card on the Pipeline board opens a longer AI Acquisition Strategy: a key insight, a priority and timeline, and five sections of concrete actions.',
      'Tick off items under "Immediate Next Steps" as you work, and click the text of a step to highlight related points elsewhere in the plan. Press "Clear highlight" to undo it.',
      'None of this is saved. Copy anything you want to keep — pasting it into the business notes or an interaction log works well. The strategy page also regenerates each time you open it.',
    ],
  },

  {
    id: 'pipeline-stages',
    title: 'Move a business through the pipeline',
    category: 'Getting things done',
    keywords: ['pipeline', 'stage', 'drag', 'drop', 'kanban', 'board', 'new lead', 'partnered', 'move'],
    steps: [
      'Open Pipeline. Each column is a stage and each card is a business.',
      'Press and hold a card, drag it into the target column, and release.',
      'A "Stage updated" message confirms the move.',
    ],
    body: [
      'Clicking a card without dragging opens its AI Acquisition Strategy; "View full profile →" from there opens the business record.',
      'While automatic tasks are switched on, a stage change also creates a follow-up task and notes the move in the company timeline.',
      '"Export Report" saves a PDF of the whole pipeline: counts per stage, the average health score, and a table of every business.',
    ],
  },
  {
    id: 'log-interaction',
    title: 'Log a conversation with a business',
    category: 'Getting things done',
    keywords: ['log interaction', 'meeting', 'call', 'email', 'notes', 'timeline', 'activity', 'attachment', 'outcome', 'follow up'],
    steps: [
      'Open the business profile and choose the Activity tab.',
      'Press "Log Interaction".',
      'Pick the Type — meeting, email, phone call, referral, event, follow-up, introduction or other — and set the date and time.',
      'Choose the Contact Person from the dropdown, or "Add new contact" to create one on the spot.',
      'Give the entry a title and write up what happened. Press "Use Template" to start from a saved template.',
      'Record the outcome or next steps, attach a file if you have one, then press "Log Interaction".',
    ],
    body: [
      'Saving recalculates the health score, sets the last-contact date to today and schedules the next follow-up based on the stage.',
      'Once saved, an interaction cannot be edited or deleted, so read it over first.',
      'When a company has several entries, a dropdown above the timeline filters by type.',
    ],
  },
  {
    id: 'bulk-log-interaction',
    title: 'Log one interaction against several businesses',
    category: 'Getting things done',
    keywords: ['bulk', 'multiple businesses', 'mass', 'batch', 'mixer', 'group', 'dashboard log interaction'],
    steps: [
      'On the Dashboard, press "Log Interaction" in the top-right.',
      'Tick every company involved. Use the search box to narrow the list, or "Select All".',
      'Set the type, date, title, notes and outcome.',
      'Press "Log for N Businesses".',
    ],
    body: [
      'The same entry is written to every company you ticked, and each one\'s health score and follow-up date are recalculated.',
    ],
  },
  {
    id: 'contacts',
    title: 'Add and manage contacts',
    category: 'Getting things done',
    keywords: ['contact', 'person', 'people', 'primary contact', 'add contact', 'linkedin', 'phone', 'email', 'contact brief'],
    steps: [
      'Open Contacts and press "Add Contact".',
      'Choose the Business — every contact belongs to a company — and fill in the Full Name. Both are required.',
      'Add the title, email, phone and notes, then press "Add Contact".',
    ],
    body: [
      'You can also add contacts from a business profile\'s Contacts tab, or while logging an interaction.',
      'A company has one primary contact stored on the company record — the name and email you type into the business form — plus any number of separate contact records with their own profiles. The primary contact does not appear in the Contacts list, so add that person as a contact record too if you want a profile and history for them.',
      'On a contact profile you can edit, delete, generate an AI brief, and read every interaction where that person was selected.',
      'The chips on the Contacts page filter by company but only cover the first 15 businesses — use the search box beyond that.',
    ],
  },
  {
    id: 'tasks',
    title: 'Create and complete tasks',
    category: 'Getting things done',
    keywords: ['task', 'todo', 'to do', 'due date', 'priority', 'overdue', 'done', 'complete', 'xp', 'accountability'],
    steps: [
      'Open Tasks and press "New Task".',
      'Type the title, add a description, set the priority and a due date.',
      'Press "Create Task". New tasks are assigned to you and start in "To Do".',
      'Tap the circle at the left of a task to move it on: To Do → In Progress → Done.',
    ],
    body: [
      'Completing a task fires confetti and adds 10 XP to the team total shown in the bar at the top of the page. The XP figure covers the whole team, not one person.',
      'Tasks cannot be edited after they are created — only their status changes. If the details are wrong, delete the task with the × and create it again.',
      'Tabs split tasks into To Do, In Progress, Done and Overdue.',
    ],
  },
  {
    id: 'task-ai-coach',
    title: 'Talk to the Task AI Coach',
    category: 'Getting things done',
    keywords: ['ai coach', 'chat', 'task help', 'advice', 'blockers', 'productivity'],
    steps: [
      'Start a new task and press "Improve with AI".',
      'Press the "Chat with AI about how to make this task successful →" link that appears.',
      'Read the opening briefing, then type any question and press Enter.',
    ],
    body: [
      'The coach opens with why the task matters, the most critical steps, and one blocker to watch for. The conversation is not saved, so copy anything useful before you leave the page.',
    ],
  },
  {
    id: 'templates',
    title: 'Write and use email templates',
    category: 'Getting things done',
    keywords: ['template', 'email', 'merge fields', 'placeholders', 'intro', 'follow up', 'preview', 'subject'],
    steps: [
      'Open Templates and press "New Template".',
      'Type a title, choose a category and write the subject line.',
      'Tap the merge-field chips to drop placeholders such as {{contact_name}} into the body.',
      'Write the body, press "Preview" to see it with sample data, then press "Create".',
      'To use it: on a business profile, start logging an interaction and press "Use Template" above the notes box.',
    ],
    body: [
      'Merge fields available: contact name, business name, industry, contact title, contact email, your name, your title, today\'s date, next week\'s date, business needs and business offers.',
      'When a template is applied to an interaction, the business name and selected contact name are filled in and the rest are left blank, so read the text before you send it.',
      'URME does not send email. Copy the finished wording into your own mail app.',
      'Three templates — Introduction, Follow Up and Event Invite — are created automatically the first time the page is opened on an empty workspace. The "Used 0x" counter on each card never increases.',
    ],
  },

  {
    id: 'ideas',
    title: 'Share, vote on and discuss ideas',
    category: 'Team & collaboration',
    keywords: ['idea', 'incubator', 'vote', 'upvote', 'comment', 'suggestion', 'brainstorm', 'ai improve'],
    steps: [
      'Open Ideas and press "New Idea".',
      'Type a title, describe it, pick a category and press "Post Idea".',
      'Tap the thumbs-up on any idea to vote, and again to take your vote back.',
      'Tap the speech bubble to open the discussion, type a comment and press "Send".',
    ],
    body: [
      'Ideas are sorted with the most-voted first, and everyone gets one vote each.',
      '"AI Improve" on an idea posts two or three concrete suggestions as a comment from the AI Assistant.',
      'Anyone can edit or delete any idea, including ideas other people posted, so tread carefully.',
    ],
  },
  {
    id: 'events',
    title: 'Plan an event and link businesses to it',
    category: 'Team & collaboration',
    keywords: ['event', 'mixer', 'workshop', 'conference', 'attendees', 'participating', 'calendar', 'google calendar', 'fee'],
    steps: [
      'Open Events and press "New Event".',
      'Fill in the name, description, date, time, location, type, status and objectives, then press "Create Event".',
      'To attach a company: open that business profile and press "Link Event" on the "Events & Engagements" card.',
      'Back on Events, press "N participating businesses" on the card to see who is coming.',
    ],
    body: [
      'Editing an event adds a "Post-Event Notes" field for writing up what happened.',
      'Events split into Upcoming and Archived tabs by date. "Export CSV" downloads all of them.',
      '"Add to Google Calendar" pre-fills the name, description and location, but always uses a placeholder one-hour slot — set the real time in Google Calendar.',
      'Companies are attached from the business side only, and linking cannot be undone from the app.',
    ],
  },
  {
    id: 'event-fees',
    title: 'Collect an event fee or payment',
    category: 'Team & collaboration',
    keywords: ['payment', 'collect', 'fee', 'stripe', 'payment link', 'invoice', 'greyed out'],
    body: [
      'Once a company is linked to an event, the event card shows a "Collect Event Fee" button. The Finance page has the same button under "Collect Payment".',
      'Both open whatever payment link has been configured under Settings. Until one is saved, the button is greyed out and reads "Configure payment link in Settings".',
    ],
    roleNote: 'Only admins and the CEO can set the payment link, on the Settings page.',
  },
  {
    id: 'sync-hub',
    title: 'Start and reply to team threads',
    category: 'Team & collaboration',
    keywords: ['sync hub', 'thread', 'discussion', 'reply', 'message', 'chat', 'pin', 'archive', 'announcement'],
    steps: [
      'Open Sync Hub and press "New Thread".',
      'Type a title and an opening message, choose a category, and optionally link the thread to a business or an event.',
      'Press "Post Thread". It opens straight away.',
      'To reply to any thread, open it, type in the box at the bottom and press the send button — or Ctrl+Enter (Cmd+Enter on a Mac).',
    ],
    body: [
      'The search box matches thread titles and opening messages, and the category chips filter the list. Pinned threads always sort to the top.',
      'Your own replies appear on the right, labelled "You"; the first post is marked "OP".',
    ],
    roleNote: 'Admins and the CEO can pin and archive threads, from the card in the list or the ⋮ menu inside a thread. Standard members can read and reply but see no pin or archive buttons. Archiving cannot be undone.',
  },

  {
    id: 'finance-entries',
    title: 'Log revenue and expenses',
    category: 'Money & reporting',
    keywords: ['finance', 'revenue', 'expense', 'money', 'income', 'cost', 'amount', 'category', 'link event'],
    steps: [
      'Open Finance and press "Log Revenue" or "Log Expense".',
      'Choose the category, then enter the amount and date. Both are required.',
      'Add a description, and for revenue set the payment status: Paid, Pending or Overdue.',
      'In the highlighted box, link the entry to an event and/or a client.',
      'Press "Log Revenue" or "Log Expense".',
    ],
    body: [
      'Linking is what makes the "By Event" profit breakdown work, so it is worth doing every time.',
      'Entries cannot be edited afterwards. To fix one, delete it with the bin icon and log it again.',
    ],
  },
  {
    id: 'receivables',
    title: 'Chase and settle receivables',
    category: 'Money & reporting',
    keywords: ['receivables', 'unpaid', 'outstanding', 'mark paid', 'overdue', 'pending', 'owed', 'debtors'],
    steps: [
      'Open Finance and choose the Receivables tab.',
      'Look for entries flagged Overdue — anything marked overdue, or dated more than 30 days ago, is outlined in red.',
      'When the money arrives, press "Mark Paid". The entry leaves the tab immediately.',
    ],
    body: [
      'The tab shows who owes what, the related event, how long it has been outstanding, and a "Total Outstanding" figure at the bottom.',
    ],
  },
  {
    id: 'finance-reporting',
    title: 'Check profit, tax estimates and exports',
    category: 'Money & reporting',
    keywords: ['profit', 'loss', 'tax', 'estimate', 'quarter', 'by event', 'p&l', 'export pdf', 'export csv'],
    body: [
      'Four cards at the top of Finance show this month\'s revenue, expenses and profit, plus total receivables. A chart compares revenue against expenses over the last four months.',
      'The "By Event" tab shows profit and loss per event, most profitable first. Only entries you linked to an event appear there.',
      'The "Tax Estimate" tab gives a rough quarterly picture: revenue and expenses by category, and a reserve of roughly 25% of net profit. It is an estimate only — it ignores deductions, credits and state obligations, so use your accountant\'s figures for anything that matters.',
      '"Export CSV" downloads every entry; "Export PDF" saves a summary of the current month.',
    ],
  },
  {
    id: 'reports',
    title: 'Read the Reports page',
    category: 'Money & reporting',
    keywords: ['reports', 'analytics', 'charts', 'activity', 'team activity', 'at risk', 'goal', 'weekly summary', 'pipeline movement'],
    body: [
      'The top row counts your businesses, the average health score, interactions this month and revenue this month.',
      'Charts below show activity per week for the last eight weeks, interactions per team member, a breakdown of interaction types, and the businesses that moved this month.',
      '"At-Risk Relationships" lists every active business scoring below 40, worst first. Click a row to open it.',
      'Set a monthly revenue target in the box next to "Revenue vs Goal". It is remembered in your browser only — it is not shared with the team and resets if you clear your browser data.',
      '"Generate Weekly Summary" has the AI write an executive summary of the last seven days plus a few priorities for next week. Press the copy icon to keep it; it is not saved.',
    ],
  },

  {
    id: 'your-profile',
    title: 'Update your own profile',
    category: 'Your account',
    keywords: ['profile', 'photo', 'avatar', 'name', 'job title', 'bio', 'phone', 'skills', 'logout', 'sign out'],
    steps: [
      'Open Profile from the menu.',
      'Hover your photo and click the camera icon to upload a new one — it saves straight away.',
      'Edit your name, job title, phone and bio, then press "Save Profile".',
      'Press "Edit" for the fuller form, which adds LinkedIn, department, location and skills.',
    ],
    body: [
      '"Logout" at the bottom of the profile card signs you out.',
      'Other tabs on this page show your subscription, the businesses you manage, every interaction you have logged, and your app settings.',
    ],
    roleNote: 'Standard members find the name, title, phone and bio fields greyed out with no "Save Profile" button — they can change only their own email and password. Ask an admin to update anything else.',
  },
  {
    id: 'account-security',
    title: 'Change your email, password or turn on 2FA',
    category: 'Your account',
    keywords: ['security', 'password', 'email', 'credentials', '2fa', 'mfa', 'totp', 'qr code', 'authenticator', 'setup key', 'disable 2fa'],
    steps: [
      'Open Profile and find the "Account Security" block on the My Profile tab.',
      'To change your email or password, type the new value and press "Update Credentials". Leave the password blank to keep your current one.',
      'To switch on two-factor, press "Enable 2FA" and scan the QR code with your authenticator app.',
      'If scanning fails, press "Copy setup key" and paste the key into the app instead. "Start over" generates a fresh code.',
      'Type the 6-digit code into the boxes and press "Verify 2FA Code".',
    ],
    body: [
      'Once 2FA is on, signing in with email and password asks for a code, and a "2FA Enabled" badge appears on your Team card.',
      'Press "Disable 2FA" before you wipe or replace the phone holding your authenticator app, or you may lock yourself out.',
    ],
  },
  {
    id: 'team-and-roles',
    title: 'Who can manage whom',
    category: 'Your account',
    keywords: ['roles', 'permissions', 'admin', 'ceo', 'standard member', 'padlock', 'protected', 'invite', 'unlock', 'delete user', 'access'],
    body: [
      'There are three roles: standard member, admin, and CEO. Admins and the CEO can administer other people; standard members cannot.',
      'Two accounts are protected — the super-admin and the CEO. Only the super-admin can administer those two; everyone else can administer standard members only.',
      'A padlock on a Team card means that account is not yours to administer. Standard members see a padlock on everyone else.',
      'Editing your own profile is always allowed, although a standard member\'s own edit is limited to email and password.',
      'Nobody can change roles from inside the app, and nobody can delete their own account.',
    ],
    roleNote: 'Standard members see no "Add Team Member" button, no Unlock buttons, no Delete buttons and no Subscription Management section.',
  },
  {
    id: 'manage-team-members',
    title: 'Add, unlock or remove a team member',
    category: 'Your account',
    keywords: ['add team member', 'invite', 'new user', 'create account', 'unlock', 'locked out', 'delete user', 'remove', 'subscription status'],
    steps: [
      'Open Team and press "Add Team Member".',
      'Fill in the full name, email and a temporary password of at least 8 characters, then press "Create Account". New accounts are always standard members.',
      'Pass the temporary password on and ask them to change it under Profile → Account Security.',
      'To unlock someone, find the card showing a "Locked" badge and press "Unlock".',
      'To reactivate a subscription, open their card and set "Subscription Status" to Active or set a paid-through date in the future.',
      'To remove someone, press "Delete" on their card and confirm.',
    ],
    body: [
      'Delete only appears for standard members — an admin or the CEO cannot be deleted from the app — and never on your own card.',
    ],
    roleNote: 'All of this is for admins and the CEO. Standard members see none of these controls, and nobody can administer the two protected accounts except the super-admin.',
  },
  {
    id: 'admin-settings',
    title: 'Configure payment links and branding',
    category: 'Your account',
    keywords: ['settings', 'payment link', 'button label', 'branding', 'business name', 'company name', 'access denied', 'admin only'],
    steps: [
      'Open Settings from the menu.',
      'Paste the payment link URL, set the button label and write a description of what the payment is for.',
      'Check the preview, add your business name under Business Branding, then press "Save Settings".',
    ],
    body: [
      'Until a payment link is saved, the payment buttons on Finance and on event cards stay greyed out.',
    ],
    roleNote: 'Settings is for admins and the CEO. Standard members do not see it in the menu and get an "Access Denied" screen if they navigate to it.',
  },

  {
    id: 'health-scores',
    title: 'How health scores and follow-up dates work',
    category: 'Good to know',
    keywords: ['health score', 'strong', 'good', 'cooling', 'at risk', 'cold', 'stale', 'follow up date', 'needs attention'],
    body: [
      'The score out of 100 on every business card combines three things: how recently you last spoke (up to 40 points, full marks within a week, nothing after 60 days), how often you have spoken (up to 30 points, full marks at ten interactions), and how far the relationship has progressed (up to 30 points, from 5 for a new lead to 30 for a partnership).',
      'The label follows the number: Strong at 80 and above, Good from 60, Cooling from 40, At Risk from 20, Cold below that.',
      'Scores are recalculated whenever you log an interaction, which also sets the next follow-up date from the stage: 2 days after a scheduled meeting, 5 for a new lead, 7 for contacted or in discussion, 14 for collaborating, 21 for partnered.',
      'The Dashboard\'s "Needs Attention" row uses the stage too — a scheduled meeting goes stale after three days, a new lead after a week, a partnership after three weeks.',
    ],
  },
  {
    id: 'automatic-tasks',
    title: 'Automatic tasks when a stage changes',
    category: 'Good to know',
    keywords: ['automation', 'auto tasks', 'automatic', 'stage change', 'follow up task', 'switch off', 'settings toggle'],
    body: [
      'While "Auto-create tasks on stage change" is on — it is by default, under Profile → Settings — moving a business to a new stage creates a follow-up task for you and notes the move in the company timeline.',
      'Contacted creates "Send intro email", due in 2 days. Meeting Scheduled creates "Prepare meeting agenda", high priority, due tomorrow. In Discussion creates "Draft proposal", due in 5 days. Collaborating creates "Set up collaboration framework", due in 7 days. Partnered creates "Schedule quarterly review", due in 30 days.',
      'Moving a business back to New Lead or to Archived creates nothing. The switch applies to your browser only.',
    ],
  },
  {
    id: 'notifications',
    title: 'Turn on notifications',
    category: 'Good to know',
    keywords: ['notification', 'alerts', 'push', 'reminders', 'browser', 'blocked', 'permission'],
    steps: [
      'Open Profile → Settings.',
      'Switch "Push Notifications" on and allow the browser prompt.',
    ],
    body: [
      'URME then checks, when you open the Dashboard, for tasks that are due or overdue and companies with no contact in 14 days, and shows up to three desktop notifications.',
      'These only appear while URME is open in a browser tab — they are not true background alerts — and the setting applies to that browser only, so turning it on for your laptop does not cover your phone.',
      'If you blocked notifications before, the switch fails with "Notifications blocked". Allow them in your browser\'s site settings first.',
    ],
  },
  {
    id: 'what-you-cannot-undo',
    title: 'What cannot be edited or undone',
    category: 'Good to know',
    keywords: ['undo', 'edit', 'delete', 'mistake', 'permanent', 'cannot', 'limitations', 'missing'],
    body: [
      'Interactions cannot be edited or deleted at all, so read them over before saving.',
      'Tasks and finance entries cannot be edited either, but they can be deleted and re-created.',
      'Deleting a business, contact, event, idea, template or team member is permanent.',
      'Archiving a Sync Hub thread and linking a business to an event are both one-way in the app.',
      'Roles cannot be changed from inside URME at all.',
    ],
  },
  {
    id: 'ai-overview',
    title: 'Where AI shows up, and what it saves',
    category: 'Good to know',
    keywords: ['ai', 'artificial intelligence', 'api key', 'saved', 'llm', 'sparkle', 'summary', 'privacy'],
    body: [
      'AI runs through URME\'s own service. You never enter an API key, and there is nothing to configure.',
      'Saved for later: Synergy Scanner matches, and the suggestions "AI Improve" posts on an idea. Saved only when you press the save button: everything "Improve with AI" writes into a form.',
      'Not saved at all: relationship briefs, contact briefs, acquisition strategies, Task AI Coach conversations and the weekly summary. Copy anything you want to keep.',
      'The AI only knows what you have written down. Filling in Needs and Offers on every business, and logging interactions as you go, is what makes its suggestions worth reading.',
    ],
  },
];

/** Lower-cased haystack for one section, cached by section object. */
const haystackCache = new WeakMap();

function haystack(section) {
  const cached = haystackCache.get(section);
  if (cached) return cached;
  const parts = [
    section.title,
    section.category,
    ...(section.keywords || []),
    ...(section.body || []),
    ...(section.steps || []),
    section.roleNote || '',
  ];
  const built = parts.join(' \n ').toLowerCase();
  haystackCache.set(section, built);
  return built;
}

/**
 * Filter help sections by a free-text query. Every whitespace-separated term has to
 * appear somewhere in the section — title, category, keywords, body, steps or role note —
 * so "csv import" narrows rather than widens.
 *
 * An empty query returns everything, which is what the page shows before anyone types.
 *
 * @param {string} query
 * @param {HelpSection[]} [sections]
 * @returns {HelpSection[]}
 */
export function searchHelpSections(query, sections = HELP_SECTIONS) {
  const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return sections;
  return sections.filter((section) => {
    const text = haystack(section);
    return terms.every((term) => text.includes(term));
  });
}

/**
 * Group sections under `HELP_CATEGORIES`, dropping categories with nothing in them so the
 * page never renders an empty heading. Any section with an unlisted category is kept and
 * appended, rather than silently disappearing from the guide.
 *
 * @param {HelpSection[]} sections
 * @returns {{ category: string, sections: HelpSection[] }[]}
 */
export function groupHelpSections(sections) {
  const known = HELP_CATEGORIES.map((category) => ({
    category,
    sections: sections.filter((section) => section.category === category),
  }));
  const leftovers = sections.filter((section) => !HELP_CATEGORIES.includes(section.category));
  const extra = [...new Set(leftovers.map((section) => section.category))].map((category) => ({
    category,
    sections: leftovers.filter((section) => section.category === category),
  }));
  return [...known, ...extra].filter((group) => group.sections.length > 0);
}

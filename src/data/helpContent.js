/**
 * In-app help content, kept as data so the same source both renders the How-To Guide
 * and answers its search box. `docs/USER_GUIDE.md` is the long-form version of the same
 * material; when app behaviour changes, update both.
 *
 * House style: written for someone who has never opened the app. Short sentences,
 * everyday words, no insider terms. Button and menu names are quoted exactly as they
 * appear on screen. Every section says what the feature is for before how to use it.
 *
 * @typedef {object} HelpSection
 * @property {string} id           Stable anchor/accordion key.
 * @property {string} title        What the user sees in the list.
 * @property {string} category     Grouping heading.
 * @property {string} whatFor      One line: what this is for. Shown before the steps.
 * @property {string[]} keywords   Extra search terms, including words that do not appear
 *                                 in the text (synonyms, what people actually type).
 * @property {string[]} [body]     Context that has to be read before the steps make sense —
 *                                 what a thing is, why it exists.
 * @property {string[]} [steps]    Numbered instructions, one action each.
 * @property {string[]} [afterSteps] Notes that only make sense once the steps are done.
 * @property {string} [tip]        A short, friendly extra.
 * @property {string} [ifStuck]    What to do when it does not work.
 * @property {string} [roleNote]   Who is allowed to do this, and who will not see it.
 */

/** Section groups, in the order the page renders them. */
export const HELP_CATEGORIES = [
  'Getting started',
  'Your businesses and people',
  'Day-to-day work',
  'Working with your team',
  'Money and reports',
  'Your account',
  'Good to know',
];

/** @type {HelpSection[]} */
export const HELP_SECTIONS = [
  {
    id: 'what-is-urme',
    title: 'What is URME?',
    category: 'Getting started',
    whatFor: 'Understanding what this app does before you start clicking.',
    keywords: ['what is', 'overview', 'start here', 'new', 'beginner', 'first time', 'crm', 'intro', 'tap', 'click'],
    body: [
      'URME is an address book that remembers your work for you.',
      'You add each company you meet. You write down every chat, call and meeting you have with them. URME then keeps score: it shows you who you have not spoken to in a while, and reminds you what to do next.',
      'It also plays matchmaker. It reads what each company needs and what each company can give, then suggests pairs who should meet each other.',
      'You will see the word "business" a lot. That just means a company you have added to your list.',
    ],
    tip: 'This guide says "tap". If you are on a computer, "tap" means click.',
  },
  {
    id: 'signing-in',
    title: 'Log in for the first time',
    category: 'Getting started',
    whatFor: 'Getting into the app.',
    keywords: ['login', 'log in', 'sign in', 'password', 'google', 'account', 'welcome back', 'signup', 'register', 'join'],
    steps: [
      'Open URME in your web browser.',
      'You will see a box that says "Welcome back".',
      'Type your email address in the field marked "Email".',
      'Type your password in the field marked "Password".',
      'Press the wide button that says "Log in".',
    ],
    afterSteps: [
      'You land on the Dashboard. That is the home screen.',
      'There is a second way in. Press the button at the very top that says "Continue with Google", then pick your account in the window Google opens. Use the same email address your URME account was made with, or it will not work.',
      'You cannot sign yourself up. Someone at your company sets your account up and gives you your first password.',
    ],
    ifStuck: 'Red writing above the boxes means the email or password was wrong — try again slowly. If it says "Account locked", too many wrong tries have shut you out, so ask an admin to open it back up. If your account needs a 6-digit code, use the email and password route rather than the Google button.',
  },
  {
    id: 'two-factor-login',
    title: 'Type in your 6-digit code',
    category: 'Getting started',
    whatFor: 'Getting past the extra security step, if your account uses one.',
    keywords: ['2fa', 'mfa', 'two factor', 'totp', 'authenticator', 'code', 'six digit', 'google authenticator', 'authy', 'security code'],
    body: [
      'Some accounts ask for a second thing at login, on top of your password. It is a 6-digit number that changes every 30 seconds, and it lives in an app on your phone such as Google Authenticator or Authy.',
      'This is called two-factor. It means someone who steals your password still cannot get in.',
    ],
    steps: [
      'Log in with your email and password as normal.',
      'A screen appears saying "Two-factor authentication", with six empty boxes.',
      'Open the authenticator app on your phone.',
      'Find the 6-digit number listed for URME and type it into the boxes.',
      'Press "Verify and continue".',
    ],
    ifStuck: 'The numbers only last 30 seconds. If yours is refused, wait for your phone to show a fresh one, then type that in instead.',
  },
  {
    id: 'reset-password',
    title: 'Forgot your password?',
    category: 'Getting started',
    whatFor: 'Getting back in when you cannot remember your password.',
    keywords: ['forgot password', 'reset', 'email link', 'recovery', 'change password', 'locked out', 'invalid link', 'new password'],
    steps: [
      'On the login screen, press "Forgot password?". It sits just under the password box.',
      'Type your email address.',
      'Press "Send reset link".',
      'Go to your email inbox and open the message from URME.',
      'Click the link inside it. Do this on the same device and in the same browser you want to log in with.',
      'Type your new password twice — once in "New Password" and again in "Confirm Password".',
      'Press "Reset password", then log in with the new one.',
    ],
    tip: 'The screen always says a link is on its way, even if that email has no account. That is on purpose, so strangers cannot find out who works here.',
    ifStuck: 'If the two passwords do not match, the app tells you and saves nothing — retype them. If you see "Invalid reset link", the link is too old, has been used already, or was opened somewhere it could not be read. Press "Request a new link" and start over. Already logged in and just want a new password? Go to Profile instead.',
  },
  {
    id: 'access-and-subscription',
    title: 'Why the app might stop letting me in',
    category: 'Getting started',
    whatFor: 'Understanding the warning bar about your access running out.',
    keywords: ['subscription', 'expired', 'expiring', 'billing', 'payment', 'stripe', 'reactivate', 'access denied', 'paid through', 'locked out'],
    body: [
      'Most people need an up-to-date subscription to use URME. Bosses (admins and the CEO) always have access.',
      'When your access has less than 14 days left, an orange bar appears across the top of every screen. It says how many days you have and offers a "Subscribe now" link.',
      'If the time runs out completely, you get one screen saying "Your URME Access Has Expired". Nothing else opens until it is sorted.',
    ],
    steps: [
      'Press the button that says "Subscribe — $25/month". It opens a payment page in a new tab.',
      'Pay on that page.',
      'Message an admin at your company and tell them you have paid.',
      'They switch your access back on. Reload URME and you are back in.',
    ],
    tip: 'You can check how long you have left any time. Go to Profile, then press the "Subscription" tab.',
  },
  {
    id: 'navigation',
    title: 'Find your way around the app',
    category: 'Getting started',
    whatFor: 'Knowing where everything lives.',
    keywords: ['menu', 'sidebar', 'navigation', 'nav', 'mobile', 'collapse', 'hamburger', 'pages', 'lost', 'where'],
    body: [
      'On a computer, the menu is the strip down the left-hand side. Every word in it opens a different screen.',
      'Here is what each one holds. "Dashboard" is your home screen. "Pipeline" is a board showing how far along each company is. "Businesses" is your full list of companies. "Contacts" is your list of people. "Tasks" is your to-do list. "Templates" holds pre-written messages. "Ideas" is a suggestions board. "Events" is for parties and meetups. "Sync Hub" is where your team chats. "Finance" is money in and out. "Reports" is charts. "Team" lists everyone you work with. "Profile" is your own account.',
      'On a phone there is no strip. Tap the button with three stacked lines in the top-right corner and the menu slides out. Tap anywhere outside it to close it again.',
    ],
    tip: 'On a computer, the small arrow at the very bottom of the menu shrinks it down to just icons, which gives you more room. Press it again to bring the words back.',
    roleNote: 'One menu word, "Settings", only shows up for admins and the CEO. If you do not see it, you are not missing anything you need.',
  },
  {
    id: 'global-search',
    title: 'Search for anything, anywhere',
    category: 'Getting started',
    whatFor: 'Finding one company, person, task or event fast, without hunting through lists.',
    keywords: ['search', 'find', 'lookup', 'global search', 'recent searches', 'filter chips', 'cant find'],
    steps: [
      'Press "Search" at the top of the menu. On a phone, tap the magnifying glass in the top-right.',
      'Start typing a name. You do not need to finish it.',
      'Results appear straight away, sorted into four headings: Businesses, Contacts, Tasks and Events.',
      'Tap the result you want and the app takes you there.',
    ],
    afterSteps: [
      'If a heading has lots of matches you only see the first five. Press "Show all N results" underneath to see the rest.',
      'Before you type anything, you get shortcut buttons for the four headings, so you can browse one kind of thing at a time. Your last eight searches sit under the word "Recent" — tap one to run it again.',
    ],
    tip: 'You can search companies by name or by industry, people by their name or their company, tasks by title, and events by name or place.',
  },
  {
    id: 'quick-capture',
    title: 'Jot something down in a hurry',
    category: 'Getting started',
    whatFor: 'Saving a thought in a few seconds, before you forget it.',
    keywords: ['quick capture', 'lightning', 'fab', 'shortcut', 'new task', 'new idea', 'new lead', 'fast', 'note'],
    body: [
      'There is a round button with a lightning bolt on it, floating in the bottom-right corner of every screen. It is a shortcut for writing something down without stopping what you are doing.',
    ],
    steps: [
      'Tap the round lightning-bolt button in the bottom-right corner.',
      'Choose what you are saving: "Task", "Idea" or "Lead". ("Lead" means a new company.)',
      'Type a short title in the first box.',
      'Add extra detail in the bigger box if you want. You can leave it empty.',
      'Press "Capture".',
    ],
    tip: 'Whatever you save this way is deliberately bare-bones. Go back and fill in the details later, when you have time.',
  },

  {
    id: 'add-business',
    title: 'Add a company to your list',
    category: 'Your businesses and people',
    whatFor: 'Putting a new company into URME so you can track it.',
    keywords: ['new business', 'add company', 'create lead', 'tags', 'account manager', 'needs', 'offers', 'industry', 'stage'],
    steps: [
      'Press "Businesses" in the menu.',
      'Press "Add Business" in the top-right.',
      'Type the company name in "Company Name". This is the only thing you must fill in.',
      'Pick an "Industry" from the list, and a "Stage" — the stage is how far along you are with them. New companies start at "New Lead".',
      'Fill in "Needs" (what they are looking for) and "Offers" (what they can give other people).',
      'Add the main person there: their name, job title, email and phone number.',
      'Add their website, address, city and state if you know them.',
      'Under "Account Manager", choose whose job it is to look after this company.',
      'Press "Add Business" at the bottom.',
    ],
    afterSteps: [
      '"Tags" are your own labels — type a word, press Enter, and it sticks to the company. Tap a tag to peel it off again. Use them for anything the app does not already have a box for.',
      'The "Notes" box is for private notes your team can see. You can make text bold, add bullet points and paste links in there.',
    ],
    tip: 'Please do fill in "Needs" and "Offers". They are the two boxes the matchmaking works from. Leave them empty and the app cannot suggest anyone for this company.',
  },
  {
    id: 'find-a-business',
    title: 'Narrow down a long list of companies',
    category: 'Your businesses and people',
    whatFor: 'Finding the companies you care about when the list gets too long to scroll.',
    keywords: ['filter', 'search businesses', 'stage', 'manager', 'industry', 'city', 'state', 'follow up', 'clear filters', 'sort'],
    body: [
      'The "Businesses" screen has a search box at the top. Type in it and the list shrinks to companies whose name or industry matches.',
      'Underneath are five drop-down menus: "Stage", "Manager", "Industry", "City" and "State". Pick from any of them to hide everything else. They only offer choices you actually have, so you cannot pick an empty one by mistake.',
      'There is also a rounded button called "Needs Follow-Up". Tap it to show only the companies you have left alone too long. Tap it again to switch it off.',
    ],
    tip: 'Once you have picked some drop-downs, a button appears saying "Clear" with a number on it. Press it to undo all of them at once and see your whole list again.',
  },
  {
    id: 'improve-with-ai',
    title: 'Let the computer improve your writing',
    category: 'Your businesses and people',
    whatFor: 'Turning a rough note into something that reads well, without writing it yourself.',
    keywords: ['ai', 'improve with ai', 'rewrite', 'sparkle', 'polish', 'copy', 'wording', 'suggestions', 'magic', 'robot'],
    body: [
      'In several places you will spot a button called "Improve with AI", with a little sparkle symbol on it. It sends what you typed to a computer helper, which rewrites it more clearly and puts the better version back in the boxes for you.',
      'You will find it when you add or change a company, a task, an idea and an event.',
      'Nothing is saved when you press it. The new wording just sits in the form, so you can read it, change any part you disagree with, and only then press Save.',
    ],
    steps: [
      'Type something rough first — even a few words is enough.',
      'Press "Improve with AI" and wait a moment. The button says "Improving..." while it thinks.',
      'Read what came back and edit anything you do not like.',
      'Press the save button to keep it, or close the window to throw it away.',
    ],
    ifStuck: 'The button needs something to work with. A company needs a name, a task needs a title or description, an idea needs a title, and an event needs a name or description. If you see "Failed to enhance", just press it again.',
  },
  {
    id: 'duplicate-warnings',
    title: 'The orange "possible duplicate" warning',
    category: 'Your businesses and people',
    whatFor: 'Avoiding two copies of the same company or person in your list.',
    keywords: ['duplicate', 'already exists', 'same name', 'similar name', 'same email', 'create anyway', 'merge', 'twice', 'copy'],
    body: [
      'As you type a name, URME quietly checks whether you already have it. If something looks close, an orange box appears listing up to three matches and why it thinks they match — same name, similar name, or same email address.',
      'This is only a warning. The app never blocks you.',
    ],
    steps: [
      'Read the names in the orange box.',
      'If one of them is the company you meant, press "View" next to it. That opens the record you already have, and you can close the form without saving.',
      'If none of them is right, press "Create Anyway" and carry on filling in the form.',
    ],
    tip: 'The same warning shows up when you add a person while writing up a meeting. There, tapping the suggested name reuses that person instead of making a second copy of them.',
    ifStuck: 'This check does not run when you bring in a spreadsheet, so tidy up your file before you upload it.',
  },
  {
    id: 'csv-import-export',
    title: 'Bring in a spreadsheet, or save one out',
    category: 'Your businesses and people',
    whatFor: 'Moving lots of companies in or out at once, instead of typing them one by one.',
    keywords: ['csv', 'import', 'export', 'spreadsheet', 'excel', 'bulk upload', 'download', 'map columns', 'file', 'batch'],
    body: [
      'A CSV is just a simple spreadsheet file. Excel, Numbers and Google Sheets can all make one.',
      'Sending a list out is one press. Bringing one in takes three short steps, because the app has to be told which column in your file is which.',
    ],
    steps: [
      'To save a list out: press "Export CSV" on the Businesses, Events or Finance screen. The file downloads to your computer.',
      'To bring a list in: on the Businesses screen, press "Import CSV".',
      'Tap the dashed box and choose your file.',
      'Check the list of your column names. Next to each one, the app has guessed which URME box it belongs in. Fix any wrong guesses, and set anything you do not want to "— Skip —".',
      'Press the button that says "Import" and the number of rows, then wait for the bar to fill up.',
      'Read how many worked, then press "Done".',
    ],
    tip: 'When you export from Businesses you get exactly what is on screen. So filter the list first and you will only export those companies.',
    ifStuck: 'Every company brought in this way starts at the "New Lead" stage and gets the label "csv-import", so you can find the whole batch afterwards. Rows with no company name are skipped. Only companies can be brought in this way — there is no spreadsheet upload for people, tasks or money.',
  },
  {
    id: 'map-view',
    title: 'See your companies on a map',
    category: 'Your businesses and people',
    whatFor: 'Seeing where your companies are, instead of reading a list of addresses.',
    keywords: ['map', 'geocode', 'location', 'pin', 'coordinates', 'city', 'state', 'leaflet', 'where', 'nearby'],
    steps: [
      'Go to "Businesses".',
      'Next to the search box are two small buttons. Tap the one shaped like a map pin.',
      'A map of the United States appears with a coloured dot for each company.',
      'Tap a dot to see that company\'s name, industry and stage. Tap its name to open it properly.',
      'Tap the other small button, the one shaped like a list, to go back to the normal view.',
    ],
    afterSteps: [
      'The dot colours are the health score: green is a healthy relationship, red means it has gone cold.',
    ],
    ifStuck: 'A yellow message saying some companies "need geocoding" means the app does not know where they are yet. Press "Geocode All" and it works them out from each city and state. It takes about a second per company, so give it a minute. A company with no city and no state cannot go on the map at all.',
  },
  {
    id: 'synergy-scanner',
    title: 'Let the app suggest who should meet',
    category: 'Your businesses and people',
    whatFor: 'Finding pairs of companies who would be useful to each other.',
    keywords: ['synergy', 'scanner', 'matches', 'matchmaking', 'introductions', 'intro', 'pairings', 'score', 'ai matching', 'partner'],
    body: [
      'This is the matchmaking part of URME. It reads what your companies say they need and what they say they offer, then suggests pairs who fit together — like one company needing a photographer and another one being a photographer.',
      'Each suggestion comes with a score out of 100 and a sentence explaining the thinking.',
    ],
    steps: [
      'Go to "Businesses".',
      'Press "Synergy Scanner" near the top. You need at least two companies on your list.',
      'Wait while the button spins. It reads up to 20 companies and usually comes back with about five pairs.',
      'A message tells you how many it found.',
      'To see them, go to the Dashboard and look under "Top Matches", or open a company and press its "Matches" tab.',
    ],
    tip: 'The suggestions are only as good as your "Needs" and "Offers" boxes. Fill those in first and the results get much better.',
    ifStuck: 'If it says "Need at least 2 businesses", add another company first. Running it again adds more suggestions rather than replacing the old ones, so you may see the same pair twice if you press it a lot.',
  },
  {
    id: 'work-a-match',
    title: 'Do something about a suggested match',
    category: 'Your businesses and people',
    whatFor: 'Keeping track of introductions you have offered and actually made.',
    keywords: ['match', 'propose intro', 'dismiss', 'mark introduced', 'introduction', 'status', 'connect'],
    steps: [
      'Open a company and press the "Matches" tab.',
      'Find the suggestion you want to act on.',
      'Press "Propose Intro" once you have offered to introduce them, or "Dismiss" if it is a bad idea.',
      'After you have actually put the two in touch, press "Mark Introduced".',
    ],
    afterSteps: [
      'This is just bookkeeping — the app does not email anyone. Pressing the buttons only records where you are up to, so you and your team can see it later.',
    ],
    tip: 'Dismissed suggestions do not disappear. They stay on the list, just no longer counted as something to do.',
  },
  {
    id: 'business-profile',
    title: 'Understand a company\'s page',
    category: 'Your businesses and people',
    whatFor: 'Finding everything you know about one company in one place.',
    keywords: ['business profile', 'edit business', 'delete business', 'export pdf', 'contact info', 'account manager', 'notes', 'page'],
    body: [
      'Tap any company card and its own page opens. The box at the top holds the name, how far along you are, the health score, and quick links to email, ring or visit them.',
      'Two buttons sit on the right of that box. The one with a sparkle asks the computer for advice. The one with three dots hides a small menu: "Export PDF", "Edit" and "Delete".',
      'Further down are cards for their contact details, whose job it is to look after them, any events they are coming to, and their "Needs", "Offers" and "Notes".',
      'At the bottom are three tabs. "Activity" is the history of every conversation. "Contacts" is the people who work there. "Matches" is who the app thinks they should meet.',
    ],
    steps: [
      'To change any detail: press the three-dots button, choose "Edit", change what you need, then press "Update Business".',
      'To save a summary you can email or print: press the three-dots button and choose "Export PDF".',
      'To remove the company: press the three-dots button, choose "Delete", then confirm.',
    ],
    tip: 'The PDF is handy before a meeting. It packs the company details, the last ten conversations and every suggested match onto one sheet.',
    ifStuck: 'Deleting is forever — there is no undo and no bin to fish it back out of. If you only want it out of the way, edit it and set the stage to "Archived" instead.',
  },
  {
    id: 'ai-briefs',
    title: 'Ask the computer what to do next',
    category: 'Your businesses and people',
    whatFor: 'Getting a short plan for a company or person when you do not know your next move.',
    keywords: ['ai brief', 'relationship brief', 'strategy', 'next step', 'outreach draft', 'talking points', 'watchouts', 'regenerate', 'advice'],
    body: [
      'URME can read everything you have written about a company and hand back advice. You get a summary, one clear "Best Next Step", a draft message you can copy, things worth talking about, and things to be careful of.',
      'There is a longer version too, called the "AI Acquisition Strategy". It gives you a priority, a rough guess at how long the deal will take, and five sections of specific actions.',
    ],
    steps: [
      'For the short version: open a company and press the sparkle button at the top-right of the first box. On a person\'s page, press "Generate" instead.',
      'Read the advice. Press "Regenerate" if you want it to have another go.',
      'For the longer plan: go to "Pipeline" and tap any company card. The plan writes itself as the page opens.',
      'In that plan, tick off the boxes under "Immediate Next Steps" as you do them.',
      'Tap the words of a step to highlight the parts of the plan that go with it. Press "Clear highlight" to undo.',
    ],
    tip: 'None of this advice is saved. If you like it, copy it into the company\'s "Notes" or into a conversation you are writing up, or it is gone when you leave the page. The tick boxes are not saved either.',
  },

  {
    id: 'pipeline-stages',
    title: 'Move a company along the board',
    category: 'Day-to-day work',
    whatFor: 'Showing how far along you are with each company, at a glance.',
    keywords: ['pipeline', 'stage', 'drag', 'drop', 'kanban', 'board', 'new lead', 'partnered', 'move', 'progress'],
    body: [
      '"Pipeline" is a board with six columns. Each column is a step on the journey from stranger to partner: "New Lead", "Contacted", "Meeting Scheduled", "In Discussion", "Collaborating", "Partnered".',
      'Every card on the board is one of your companies. The number at the top of a column tells you how many are sitting in it.',
    ],
    steps: [
      'Press "Pipeline" in the menu.',
      'Find the card you want to move.',
      'Press and hold the card.',
      'Drag it across into the column you want.',
      'Let go. A message says "Stage updated".',
    ],
    tip: 'Moving a card usually creates a follow-up task for you as well, so you do not forget the next step. A short note also goes into that company\'s history.',
    ifStuck: 'Tapping a card without dragging does something different — it opens the computer-written plan for that company. To get to the company\'s normal page from there, press "View full profile".',
  },
  {
    id: 'log-interaction',
    title: 'Write up a chat, call or meeting',
    category: 'Day-to-day work',
    whatFor: 'Recording what was said, so you and your team remember it later.',
    keywords: ['log interaction', 'meeting', 'call', 'email', 'notes', 'timeline', 'activity', 'attachment', 'outcome', 'follow up', 'history'],
    body: [
      'This is the most important habit in URME. Every time you speak to someone, write it down here. The app uses these notes to work out who is going quiet and what needs chasing.',
    ],
    steps: [
      'Open the company and press the "Activity" tab.',
      'Press "Log Interaction".',
      'Under "Type", pick what it was: a meeting, an email, a phone call and so on.',
      'Check the date and time. It is already set to right now, so usually you can leave it.',
      'Under "Contact Person", choose who you spoke to.',
      'Give it a short "Title", like "First call".',
      'In the big "Notes / Details" box, write what was said.',
      'In "Outcome / Next Steps", write what happens next.',
      'Press "Log Interaction" at the bottom.',
    ],
    tip: 'Two shortcuts sit above the boxes. "Add new contact" saves a new person without leaving this form. "Use Template" drops a pre-written message in for you. You can also attach a file at the bottom — press "Attach a file" and pick it.',
    afterSteps: [
      'Each entry in the list has a pencil and a bin on its right-hand edge. The pencil reopens the form as you wrote it, and the bin removes the entry once you confirm. Either way the company\'s score, last-spoken date and conversation count are put back in step.',
    ],
    ifStuck: 'Anybody who can see the company can correct or remove its conversations — they are the team\'s notes, not personal ones. Deleting one is permanent, so read the confirmation.',
  },
  {
    id: 'bulk-log-interaction',
    title: 'Write up one meeting for lots of companies',
    category: 'Day-to-day work',
    whatFor: 'Saving time after an event where you saw many companies at once.',
    keywords: ['bulk', 'multiple businesses', 'mass', 'batch', 'mixer', 'group', 'dashboard log interaction', 'many', 'lots'],
    steps: [
      'Go to the Dashboard.',
      'Press "Log Interaction" in the top-right.',
      'Tick the box next to every company that was there. Use the search box to find them, or press "Select All" to take the whole list.',
      'Fill in the type, date, title, notes and outcome once.',
      'Press the button at the bottom — it says "Log for" and the number of companies you ticked.',
    ],
    afterSteps: [
      'The same note is copied onto every company you ticked, and each of their health scores updates.',
    ],
    tip: 'This is perfect after a networking night. Ten companies written up in one go, instead of opening ten pages.',
  },
  {
    id: 'contacts',
    title: 'Keep track of people, not just companies',
    category: 'Day-to-day work',
    whatFor: 'Storing the individual humans you deal with at each company.',
    keywords: ['contact', 'person', 'people', 'primary contact', 'add contact', 'linkedin', 'phone', 'email', 'contact brief', 'who'],
    body: [
      'A company is a company. A contact is a person who works there. One company can have as many contacts as you like.',
      'There is one wrinkle worth knowing. When you fill in the contact name on the company form, that person is stored on the company itself and is called the "primary contact". They do not get their own page and will not show up in your Contacts list. If you want a proper page and history for them, add them again as a contact.',
    ],
    steps: [
      'Press "Contacts" in the menu.',
      'Press "Add Contact" in the top-right.',
      'Choose the company they work for. You have to pick one.',
      'Type their full name. This is also required.',
      'Add their job title, email, phone and any notes.',
      'Press "Add Contact".',
    ],
    tip: 'You can also add people from a company\'s "Contacts" tab, or while writing up a conversation — whichever is quicker at the time.',
    ifStuck: 'The rounded company buttons on the Contacts screen only cover your first 15 companies. If the one you want is not there, use the search box instead.',
  },
  {
    id: 'tasks',
    title: 'Keep a to-do list',
    category: 'Day-to-day work',
    whatFor: 'Remembering what you promised to do, and when.',
    keywords: ['task', 'todo', 'to do', 'due date', 'priority', 'overdue', 'done', 'complete', 'xp', 'accountability', 'reminder'],
    body: [
      'The "Tasks" screen is a to-do list. Tasks are split across tabs: "To Do", "In Progress", "Done", and "Overdue" if anything is late.',
      'Each task has a priority — Low, Medium, High or Urgent — shown as a small coloured dot. Late tasks turn red.',
    ],
    steps: [
      'Press "Tasks" in the menu.',
      'Press "New Task" in the top-right.',
      'Type what needs doing in "Title".',
      'Add more detail in "Description" if you want.',
      'Pick a "Priority" and a "Due Date".',
      'Press "Create Task".',
      'To move a task on, tap the circle at its left-hand side. It goes from "To Do" to "In Progress" to "Done".',
    ],
    tip: 'Finishing a task fires little paper streamers across the screen and adds 10 points to your team\'s score, shown in the bar at the top. The score covers everyone together, not just you.',
    ifStuck: 'You cannot edit a task once it exists — only move it along or delete it. If you typed it wrong, press the "×" on the right to delete it and make a new one.',
  },
  {
    id: 'task-ai-coach',
    title: 'Get advice on a task',
    category: 'Day-to-day work',
    whatFor: 'Asking for help when you are not sure how to tackle something.',
    keywords: ['ai coach', 'chat', 'task help', 'advice', 'blockers', 'productivity', 'stuck', 'how'],
    body: [
      'URME has a small chat helper for tasks. It tells you why the task matters, the two or three steps that matter most, and one thing likely to trip you up. Then you can ask it questions.',
    ],
    steps: [
      'Start a new task and type a title.',
      'Press "Improve with AI".',
      'A line appears saying "Chat with AI about how to make this task successful". Press it.',
      'Read the advice it opens with.',
      'Type any question at the bottom and press Enter to ask more.',
      'Press the back arrow at the top-left to return to your tasks.',
    ],
    tip: 'The chat is not saved. Copy anything useful out of it before you leave the page.',
  },
  {
    id: 'templates',
    title: 'Save a message you send often',
    category: 'Day-to-day work',
    whatFor: 'Writing a message once and reusing it, instead of retyping it every time.',
    keywords: ['template', 'email', 'merge fields', 'placeholders', 'intro', 'follow up', 'preview', 'subject', 'reuse'],
    body: [
      'A template is a message with blanks in it. The blanks fill themselves in with real names when you use it, so one template covers every company.',
      'A blank looks like {{contact_name}} — two curly brackets around a word. You do not type those yourself; you tap a button and the app inserts them.',
      'Three templates are already there when you start: "Introduction", "Follow Up" and "Event Invite".',
    ],
    steps: [
      'Press "Templates" in the menu.',
      'Press "New Template" in the top-right.',
      'Give it a name in "Title", pick a "Category", and write the subject line.',
      'Tap the small rounded buttons under "Merge Fields — tap to insert" to drop blanks into your message.',
      'Write the message in the big box.',
      'Press "Preview" to see it filled in with pretend details, so you can check it reads properly.',
      'Press "Create".',
    ],
    tip: 'To use one: open a company, start writing up a conversation, and press "Use Template" above the notes box. The company and person\'s names fill themselves in, and the "Used Nx" count on the template\'s card goes up by one. Opening the list or pressing "Preview" does not count.',
    ifStuck: 'URME cannot send email. It only writes the words — copy them into Gmail, Outlook or whatever you use.',
  },

  {
    id: 'ideas',
    title: 'Share an idea with your team',
    category: 'Working with your team',
    whatFor: 'Putting a suggestion somewhere your team can vote on it and discuss it.',
    keywords: ['idea', 'incubator', 'vote', 'upvote', 'comment', 'suggestion', 'brainstorm', 'ai improve', 'share'],
    body: [
      'The "Ideas" screen is a noticeboard. Anyone can post a suggestion, and everyone can vote on it. The most popular ideas float to the top.',
    ],
    steps: [
      'Press "Ideas" in the menu.',
      'Press "New Idea" in the top-right.',
      'Type a "Title" and describe your idea.',
      'Pick a "Category".',
      'Press "Post Idea".',
      'To vote on someone else\'s idea, tap the thumbs-up on its left. Tap again to take your vote back.',
      'To join the conversation, tap the speech-bubble symbol, type a comment and press "Send".',
    ],
    tip: 'Press "AI Improve" on any idea and the computer adds two or three suggestions for making it stronger, as a comment.',
    ifStuck: 'Be careful — anybody can edit or delete anybody\'s idea here, including yours. There is no undo.',
  },
  {
    id: 'events',
    title: 'Plan an event and record who is coming',
    category: 'Working with your team',
    whatFor: 'Organising a meetup and keeping track of which companies attend.',
    keywords: ['event', 'mixer', 'workshop', 'conference', 'attendees', 'participating', 'calendar', 'google calendar', 'fee', 'party'],
    body: [
      '"Events" is for networking nights, workshops, dinners and the like. Events split into two tabs: "Upcoming" for future dates and "Archived" for ones that have been and gone.',
    ],
    steps: [
      'Press "Events" in the menu.',
      'Press "New Event" in the top-right.',
      'Fill in the name, description, date, time and place.',
      'Pick a "Type" (mixer, workshop, dinner and so on) and a "Status" (start with "Planning").',
      'Write what you want out of it in "Objectives".',
      'Tick anybody you already know is coming under "Attending Businesses". This is optional and you can change it later.',
      'Press "Create Event".',
    ],
    tip: 'There are two ways to say a company is coming: tick it under "Attending Businesses" on the event form, or open that company and press "Link Event" on the "Events & Engagements" card. Either way the event shows a line saying how many companies are taking part — tap it to see them. To take one back off, untick it, or press the broken-link symbol next to the event on the company\'s card.',
    ifStuck: 'The "Add to Google Calendar" link uses the date and time you typed, and reads "6:00 PM", "18:00" and "6 - 8pm" alike. Leave "Time" empty, or type something that is not a time, and Google gets an all-day event on the right date instead of a slot.',
  },
  {
    id: 'event-fees',
    title: 'Take a payment',
    category: 'Working with your team',
    whatFor: 'Sending someone to a page where they can pay you.',
    keywords: ['payment', 'collect', 'fee', 'stripe', 'payment link', 'invoice', 'greyed out', 'pay', 'money in'],
    body: [
      'URME does not handle money itself. It just holds a link to a payment page — usually Stripe — and shows a button that opens it.',
      'You will find that button on the "Finance" screen under "Collect Payment", and on any event that has companies attending, where it says "Collect Event Fee".',
    ],
    ifStuck: 'If the button is grey and says "Configure payment link in Settings", nobody has added the payment page address yet. Ask an admin to add it — only they can.',
    roleNote: 'Anyone can press the button. Only admins and the CEO can set up the link behind it.',
  },
  {
    id: 'sync-hub',
    title: 'Chat with your team',
    category: 'Working with your team',
    whatFor: 'Having a conversation about work in a place everyone can find later.',
    keywords: ['sync hub', 'thread', 'discussion', 'reply', 'message', 'chat', 'pin', 'archive', 'announcement', 'team'],
    body: [
      '"Sync Hub" works like a message board. Someone starts a thread about one topic, and everyone replies underneath. Unlike a group chat, nothing scrolls away — you can come back to a thread weeks later.',
    ],
    steps: [
      'Press "Sync Hub" in the menu.',
      'Press "New Thread" in the top-right.',
      'Type a "Title" — a short summary of what you want to talk about.',
      'Write your first message in "Opening Message".',
      'Pick a "Category", and link it to a company or event if it is about one.',
      'Press "Post Thread".',
      'To reply to any thread, tap it, type in the box at the bottom, and press the arrow button.',
    ],
    tip: 'Instead of pressing the arrow, you can hold Ctrl and press Enter to send. On a Mac, hold Cmd and press Enter.',
    roleNote: 'Admins and the CEO can also pin a thread to the top of the list, or archive it to get it out of the way. Archived threads gather under a line at the bottom of the list; expand it and press the restore button, or open the thread and choose "Unarchive Thread", to bring one back. If you do not see those buttons, you are a standard member — you can still read and reply to everything.',
  },

  {
    id: 'finance-entries',
    title: 'Write down money coming in or going out',
    category: 'Money and reports',
    whatFor: 'Keeping a record of what you earned and what you spent.',
    keywords: ['finance', 'revenue', 'expense', 'money', 'income', 'cost', 'amount', 'category', 'link event', 'spent', 'earned'],
    body: [
      'The "Finance" screen has two kinds of entry. "Revenue" is money coming in. "Expense" is money going out. Everything else on the page is worked out from those.',
    ],
    steps: [
      'Press "Finance" in the menu.',
      'Press "Log Revenue" for money in, or "Log Expense" for money out.',
      'Pick a "Category" that best describes it.',
      'Type the "Amount" and check the "Date". Both are needed.',
      'Write a short "Description" so you remember what it was.',
      'For money coming in, set "Payment Status": "Paid" if you have the money, "Pending" if you are still waiting.',
      'In the box with the coloured border, link it to an event and a company if it belongs to one.',
      'Press the button at the bottom to save it.',
    ],
    tip: 'Do link entries to events and companies. It costs two taps and it is the only way the app can tell you whether an event made or lost money.',
    ifStuck: 'You cannot edit an entry after saving. Delete it with the bin symbol and write it again.',
  },
  {
    id: 'receivables',
    title: 'Chase money people owe you',
    category: 'Money and reports',
    whatFor: 'Seeing who has not paid yet, and ticking them off when they do.',
    keywords: ['receivables', 'unpaid', 'outstanding', 'mark paid', 'overdue', 'pending', 'owed', 'debtors', 'chase', 'invoice'],
    body: [
      '"Receivables" is a posh word for money you are owed. This tab lists every bit of income you marked as not paid yet.',
      'Anything over 30 days old is flagged "Overdue" and outlined in red, so the awkward ones are obvious.',
    ],
    steps: [
      'Press "Finance" in the menu.',
      'Press the "Receivables" tab.',
      'Look down the list. Each line shows who owes you, how much, and how long it has been.',
      'When the money arrives, press "Mark Paid" on that line.',
    ],
    tip: 'The total at the very bottom is everything you are still waiting on, added up.',
  },
  {
    id: 'finance-reporting',
    title: 'See whether you are making money',
    category: 'Money and reports',
    whatFor: 'Checking profit, and roughly how much tax to put aside.',
    keywords: ['profit', 'loss', 'tax', 'estimate', 'quarter', 'by event', 'p&l', 'export pdf', 'export csv', 'summary'],
    body: [
      'Four boxes across the top of "Finance" show this month\'s money in, money out, profit, and how much you are owed. If you have spent more than you earned, the profit box turns red and says "Running at a loss".',
      'The "By Event" tab shows which events made money and which lost it. Only entries you linked to an event appear here.',
      'The "Tax Estimate" tab guesses how much to put aside for tax — roughly a quarter of your profit.',
    ],
    tip: '"Export PDF" gives you a tidy one-page summary of the month. "Export CSV" gives you a spreadsheet of every single entry.',
    ifStuck: 'Treat the tax number as a rough guide only, not advice. It ignores all sorts of real-world rules. Ask an accountant before paying anything.',
  },
  {
    id: 'reports',
    title: 'Read the charts',
    category: 'Money and reports',
    whatFor: 'Seeing how the whole team is doing, in pictures rather than lists.',
    keywords: ['reports', 'analytics', 'charts', 'activity', 'team activity', 'at risk', 'goal', 'weekly summary', 'pipeline movement', 'graphs'],
    body: [
      'The "Reports" screen is all charts and needs nothing from you. The numbers along the top count your companies, your average health score, conversations this month and money in this month.',
      'Below that: how busy each week has been, who on the team has logged the most conversations, which kinds of conversation you have most, and which companies moved along this month.',
      '"At-Risk Relationships" is the one to check on a Monday. It lists companies going cold, worst first. Tap any of them to open it.',
    ],
    steps: [
      'Press "Reports" in the menu.',
      'To set a monthly money target, type a number in the small box next to "Revenue vs Goal". The bar underneath fills up as you earn.',
      'To get a written round-up of your week, press "Generate Weekly Summary" and wait a few seconds.',
      'Press the small copy symbol in the corner of that summary to copy it, ready to paste into an email.',
    ],
    tip: 'The money target is remembered only in the browser you typed it in. It is not shared with your team, and it disappears if you clear your browser history.',
  },

  {
    id: 'your-profile',
    title: 'Change your own details',
    category: 'Your account',
    whatFor: 'Updating your name, photo, job title and phone number.',
    keywords: ['profile', 'photo', 'avatar', 'name', 'job title', 'bio', 'phone', 'skills', 'logout', 'sign out', 'me'],
    steps: [
      'Press "Profile" at the bottom of the menu.',
      'To change your photo, hover over the current picture and tap the camera symbol, then choose an image. It saves by itself.',
      'Type over your name, job title, phone number or the "Bio" box.',
      'Press "Save Profile".',
      'To sign out of URME, press "Logout" under those boxes.',
    ],
    afterSteps: [
      'Pressing "Edit" opens a bigger form with a few more boxes, including your LinkedIn address, your department and your skills.',
      'The other tabs on this page show how long your access lasts, the companies you look after, every conversation you have written up, and your own settings.',
    ],
    roleNote: 'If these boxes are greyed out and there is no "Save Profile" button, you are a standard member. You can still change your own email and password further down the page — but ask an admin to change your name, job title or anything else.',
  },
  {
    id: 'account-security',
    title: 'Change your password, or add a 6-digit code',
    category: 'Your account',
    whatFor: 'Keeping your account safe.',
    keywords: ['security', 'password', 'email', 'credentials', '2fa', 'mfa', 'totp', 'qr code', 'authenticator', 'setup key', 'disable 2fa', 'safe'],
    body: [
      'Halfway down your Profile page is a section called "Account Security". Your email address and password live there.',
      'You can also switch on two-factor here. That is the extra 6-digit code at login. It makes your account much harder to break into, because a thief would need your phone as well as your password.',
    ],
    steps: [
      'Press "Profile", then find "Account Security".',
      'To change your email or password, type the new one and press "Update Credentials". Leave the password box empty if you only want to change the email.',
      'To add the 6-digit code, press "Enable 2FA".',
      'A square black-and-white pattern appears. Open an authenticator app on your phone and point its camera at the pattern.',
      'Your phone now shows a 6-digit number for URME. Type it into the six boxes.',
      'Press "Verify 2FA Code". A message says "2FA enabled".',
    ],
    tip: 'If your phone cannot read the pattern, press "Copy setup key" and type or paste that long code into your authenticator app by hand instead.',
    ifStuck: 'Changing phones? Press "Disable 2FA" here first, then set it up again on the new phone. If you skip that, you can be locked out of your own account.',
  },
  {
    id: 'team-and-roles',
    title: 'Who is allowed to do what',
    category: 'Your account',
    whatFor: 'Understanding why you can see some buttons and not others.',
    keywords: ['roles', 'permissions', 'admin', 'ceo', 'standard member', 'padlock', 'protected', 'invite', 'unlock', 'delete user', 'access', 'cant see', 'missing button', 'greyed out'],
    body: [
      'There are three kinds of account. A "standard member" gets on with normal work. An "admin" can also look after other people\'s accounts. The "CEO" is the same as an admin, with its own badge.',
      'Two accounts are protected: the person who runs the whole system, and the CEO. Only the system owner can touch those two. Everyone else can only look after standard members.',
      'A small padlock on somebody\'s card on the "Team" screen means that account is not yours to change. Standard members see a padlock on everybody but themselves.',
      'You can always change your own details, whoever you are.',
    ],
    tip: 'Account types are changed on somebody\'s card, under "Account Type". You can never change your own, and URME refuses a change that would leave nobody in charge.',
    roleNote: 'As a standard member you will not see: the "Add Team Member" button, "Unlock" buttons, "Delete" buttons, the "Account Type" and subscription boxes, the "Settings" menu word, or the pin, archive and restore buttons in Sync Hub. Nothing is broken — they are just not yours to press.',
  },
  {
    id: 'manage-team-members',
    title: 'Add someone, or unlock their account',
    category: 'Your account',
    whatFor: 'Setting up a new colleague, or helping one who is locked out.',
    keywords: ['add team member', 'invite', 'new user', 'create account', 'unlock', 'locked out', 'delete user', 'remove', 'subscription status', 'colleague'],
    steps: [
      'Press "Team" in the menu.',
      'Press "Add Team Member" near the top.',
      'Fill in their full name, their email, and a starter password of at least 8 characters.',
      'Press "Create Account".',
      'Tell them the starter password, and ask them to change it on their Profile page.',
    ],
    afterSteps: [
      'To help somebody who is locked out, find their card — it has a red "Locked" label — and press "Unlock". They can log in again straight away.',
      'To switch someone\'s access back on after they pay, tap their card, then set "Subscription Status" to "Active" or put a future date in "Paid Through Date".',
      'To make somebody an admin or the CEO — or to put them back to a standard member — tap their card, pick a "Role" under "Account Type", and press "Save Changes".',
      'To remove somebody for good, press "Delete" on their card and confirm. Only standard members can be deleted, so change the role first.',
    ],
    tip: 'New accounts are always standard members. That cannot be changed on the invite form, but you can change it on their card afterwards.',
    roleNote: 'This is all admin and CEO work. Standard members will not see any of these buttons. You also cannot delete an admin, the CEO, or your own account.',
    ifStuck: 'No "Delete" button on someone\'s card? That happens when they are an admin or the CEO, when the card is your own, or when you are not allowed to manage them. A role change can also be refused if it would leave the workspace with no admin or CEO at all.',
  },
  {
    id: 'admin-settings',
    title: 'Set up the payment link and company name',
    category: 'Your account',
    whatFor: 'Telling URME where to send people who want to pay you.',
    keywords: ['settings', 'payment link', 'button label', 'branding', 'business name', 'company name', 'access denied', 'admin only', 'setup'],
    steps: [
      'Press "Settings" in the menu.',
      'Paste the web address of your payment page into "Payment Link URL".',
      'Type what the button should say in "Button Label".',
      'Explain what the payment is for in "Payment Description".',
      'Check the preview underneath looks right.',
      'Add your company name under "Business Branding".',
      'Press "Save Settings".',
    ],
    afterSteps: [
      'Until this is filled in, the payment buttons everywhere else in the app stay grey and do nothing.',
    ],
    roleNote: 'Only admins and the CEO can open this screen. Everyone else gets a page saying "Access Denied", which is normal and not a fault.',
  },

  {
    id: 'health-scores',
    title: 'What the coloured score on each company means',
    category: 'Good to know',
    whatFor: 'Reading the little number and colour on every company card.',
    keywords: ['health score', 'strong', 'good', 'cooling', 'at risk', 'cold', 'stale', 'follow up date', 'needs attention', 'colour', 'number'],
    body: [
      'Every company gets a score out of 100. It is the app\'s guess at how healthy your relationship is. Green and high is good. Red and low means you are losing them.',
      'Three things make up the score. How recently you last spoke — this matters most. How many times you have spoken in total. And how far along the company is on the pipeline board.',
      'The words next to the number are just the score in plain English: "Strong" is 80 and up, then "Good", "Cooling", "At Risk", and "Cold" at the bottom.',
      'The score changes on its own each time you write up a conversation. You never set it by hand.',
    ],
    tip: 'The fastest way to raise a score is simply to talk to the company and write it up. There is no trick to it.',
  },
  {
    id: 'automatic-tasks',
    title: 'Tasks that appear on their own',
    category: 'Good to know',
    whatFor: 'Understanding where a to-do you never wrote came from.',
    keywords: ['automation', 'auto tasks', 'automatic', 'stage change', 'follow up task', 'switch off', 'settings toggle', 'appeared', 'mystery'],
    body: [
      'When you move a company along the pipeline board, URME usually writes your next task for you. That is why a task you never typed can turn up in your list.',
      'Move a company to "Contacted" and you get "Send intro email", due in two days. Move it to "Meeting Scheduled" and you get "Prepare meeting agenda", due tomorrow. "In Discussion" gives you "Draft proposal" in five days, "Collaborating" gives you "Set up collaboration framework" in a week, and "Partnered" gives you "Schedule quarterly review" in a month.',
      'A short note also goes into that company\'s history saying it moved.',
    ],
    tip: 'If you would rather write your own tasks, go to Profile, press the "Settings" tab, and switch off "Auto-create tasks on stage change".',
  },
  {
    id: 'notifications',
    title: 'Get reminders on your screen',
    category: 'Good to know',
    whatFor: 'Being nudged about late tasks and companies going quiet.',
    keywords: ['notification', 'alerts', 'push', 'reminders', 'browser', 'blocked', 'permission', 'popup'],
    steps: [
      'Press "Profile" in the menu.',
      'Press the "Settings" tab.',
      'Switch on "Push Notifications".',
      'Your browser asks for permission. Press Allow.',
    ],
    afterSteps: [
      'After that, URME checks for late tasks and companies you have not contacted in two weeks, and pops up to three little reminders on your screen.',
    ],
    tip: 'These only appear while URME is actually open in a tab. Close the app and the reminders stop, so do not rely on them like a phone alarm. Reminders that reach you with URME closed are a separate feature that is not built yet.',
    ifStuck: 'If the switch flicks back and says notifications are blocked, you said No to your browser at some point. Go into your browser\'s site settings, allow notifications for URME, then try the switch again. You also have to do this separately on each device.',
  },
  {
    id: 'what-you-cannot-undo',
    title: 'Things you cannot undo (read before deleting)',
    category: 'Good to know',
    whatFor: 'Knowing which buttons have no take-backs.',
    keywords: ['undo', 'edit', 'delete', 'mistake', 'permanent', 'cannot', 'limitations', 'missing', 'oops', 'recover', 'bin'],
    body: [
      'URME has no bin and no undo button. These ones are worth knowing before you press anything.',
      'Tasks and money entries cannot be edited. You have to delete them and write them again.',
      'Deleting a company, person, event, idea, template, colleague or written-up conversation is permanent.',
      'Some things can be taken back: a written-up conversation can be corrected with its pencil, an archived team thread restored, and a company unlinked from an event.',
    ],
    tip: 'To get a company out of your way without deleting it, edit it and set its stage to "Archived". It leaves your board but keeps all its history.',
  },
  {
    id: 'ai-overview',
    title: 'Where the computer helper appears, and what it keeps',
    category: 'Good to know',
    whatFor: 'Knowing which AI results are saved and which vanish.',
    keywords: ['ai', 'artificial intelligence', 'api key', 'saved', 'llm', 'sparkle', 'summary', 'privacy', 'lost', 'disappeared'],
    body: [
      'Anything with a sparkle symbol on it uses the computer helper. You never need to set it up or pay for it separately.',
      'Some results are kept. Match suggestions from the Synergy Scanner are saved, and so are the notes "AI Improve" adds to an idea.',
      'Some are kept only if you save the form. Everything "Improve with AI" writes into boxes counts as your own typing until you press Save.',
      'And some vanish the moment you leave the page: the advice on a company or person, the longer plan, the task chat, and the weekly round-up.',
    ],
    tip: 'If a result looks useful, copy it somewhere safe before you navigate away. Pasting it into the company\'s "Notes" works well.',
    ifStuck: 'The helper only knows what you have typed into URME. Thin results usually mean thin "Needs" and "Offers" boxes, or no written-up conversations yet.',
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
    section.whatFor || '',
    ...(section.keywords || []),
    ...(section.body || []),
    ...(section.steps || []),
    ...(section.afterSteps || []),
    section.tip || '',
    section.ifStuck || '',
    section.roleNote || '',
  ];
  const built = parts.join(' \n ').toLowerCase();
  haystackCache.set(section, built);
  return built;
}

/**
 * Filter help sections by a free-text query. Every whitespace-separated term has to
 * appear somewhere in the section — title, category, what it is for, keywords, any of the
 * prose, tip, "if it doesn't work" or role note — so "csv import" narrows, not widens.
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

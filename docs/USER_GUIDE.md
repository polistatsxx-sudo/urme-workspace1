# URME User Guide

URME is a mobile-first CRM for business networking and matchmaking. You keep every company
you meet in one place, track the relationship as it moves from a first introduction to a real
partnership, log every conversation, and let the built-in AI suggest who should be introduced
to whom.

This guide walks through every screen in the app and every action you can take on it. It is
written for the people who use URME day to day, not for developers. Where a button only
appears for certain roles, that is called out.

---

## Table of contents

1. [Signing in and account access](#1-signing-in-and-account-access)
2. [Finding your way around](#2-finding-your-way-around)
3. [Dashboard](#3-dashboard)
4. [Pipeline](#4-pipeline)
5. [Businesses (your network)](#5-businesses-your-network)
6. [A single business profile](#6-a-single-business-profile)
7. [AI Acquisition Strategy](#7-ai-acquisition-strategy)
8. [Contacts](#8-contacts)
9. [Tasks](#9-tasks)
10. [Templates](#10-templates)
11. [Ideas](#11-ideas)
12. [Events](#12-events)
13. [Sync Hub](#13-sync-hub)
14. [Finance](#14-finance)
15. [Reports](#15-reports)
16. [Team, roles and account management](#16-team-roles-and-account-management)
17. [Profile](#17-profile)
18. [Settings (admins and the CEO only)](#18-settings-admins-and-the-ceo-only)
19. [Where AI shows up](#19-where-ai-shows-up)
20. [Notifications and automations](#20-notifications-and-automations)
21. [Roles at a glance](#21-roles-at-a-glance)
22. [Tips and FAQ](#22-tips-and-faq)
23. [Things that are limited or missing today](#23-things-that-are-limited-or-missing-today)

---

## 1. Signing in and account access

### 1.1 Log in with email and password

1. Go to the app address. If you are not signed in you land on the **Welcome back** screen.
2. Type your email in the **Email** field and your password in the **Password** field.
3. Press **Log in**.
4. You are taken to the Dashboard.

If the email or password is wrong you get a red message above the form. Repeated failed
attempts are counted, and an account can end up locked — see [1.5](#15-if-your-account-is-locked).

### 1.2 Continue with Google

1. On the login screen, press **Continue with Google** at the top.
2. Pick your Google account in the window Google opens.
3. You are returned to URME already signed in.

Use the same Google account as the email your URME account was created with. Google sign-in does
not show the two-factor code prompt described below, so if your account has two-factor switched on,
sign in with email and password instead — otherwise you may be sent straight back to the login screen.

### 1.3 Two-factor authentication at login

If two-factor authentication (2FA) is switched on for your account:

1. Enter your email and password and press **Log in** as usual.
2. A **Two-factor authentication** screen appears with six empty boxes.
3. Open your authenticator app (Google Authenticator, Authy, 1Password, or similar) and read
   the current 6-digit code for URME.
4. Type the code. The **Verify and continue** button becomes active once all six digits are in.
5. Press **Verify and continue**.

If the code is rejected, wait for your authenticator app to roll over to a fresh code and try
again — codes expire every 30 seconds.

To turn 2FA on or off for yourself, see [17.2](#172-account-security-email-password-and-2fa).

### 1.4 Forgot password / reset password

1. On the login screen, press **Forgot password?** underneath the password field.
2. Enter your email address and press **Send reset link**.
3. The screen confirms that if an account exists for that address, a reset link is on its way.
   You always see this message, whether or not the address is registered.
4. Open the email and click the reset link **on the same device and browser** you want to reset from.
5. The **New password** screen appears. Type the new password twice — once in **New Password**
   and once in **Confirm Password** — then press **Reset password**.
6. You are sent back to the login screen. Sign in with the new password.

If the two passwords do not match you get a "Passwords do not match" message and nothing is saved.

If you see **Invalid reset link**, the link was expired, already used, or opened somewhere that
could not read it. Press **Request a new link** and start again from step 1.

### 1.5 If your account is locked

If your account has been locked, the login screen shows *"Account locked. Contact your admin."*
You cannot unlock yourself. Ask an admin or the CEO to unlock you from the Team page
(see [16.5](#165-unlocking-a-locked-account)).

### 1.6 Access and subscription

Admins and the CEO always have access. Standard members need an active subscription, which
means either their subscription status is set to *Active* or their paid-through date is still
in the future.

- **Access expiring soon.** In the last 14 days before your paid-through date, an amber bar
  appears across the top of every page: *"Your access expires in N days."* Press **Subscribe now**
  in that bar to open the payment page.
- **Access expired.** You are redirected to a single screen, *"Your URME Access Has Expired"*.
  Press **Subscribe — $25/month** to open the payment page in a new tab, then contact your admin
  so they can reactivate the account. There is also a **Log out** link at the bottom of that screen.

Your own subscription status is always visible under **Profile → Subscription**
(see [17.3](#173-subscription-tab)).

### 1.7 No self-signup

There is no "create an account" page. Accounts are created for you by an admin or the CEO from
the Team page. If you sign in with an account that has no URME profile you see an
**Access Restricted** page telling you to contact the administrator.

### 1.8 Logging out

Go to **Profile → My Profile** and press **Logout** (bottom of the profile card). You are signed
out immediately.

---

## 2. Finding your way around

### 2.1 The sidebar

On a computer, the navigation sits down the left-hand side. Every entry is one click:

| Entry | What it opens |
| --- | --- |
| Search | The full-screen search panel |
| Dashboard | Your daily overview |
| Pipeline | The drag-and-drop relationship board |
| Businesses | Every company in your network |
| Contacts | Every named person |
| Tasks | Your to-do list |
| Templates | Reusable email templates |
| Ideas | The team idea board |
| Events | Networking events |
| Sync Hub | Team discussion threads |
| Finance | Revenue, expenses and receivables |
| Reports | Charts and analytics |
| Team | Everyone in the workspace |
| Settings | Payment and branding configuration |
| Profile | Your own account |

**Settings only appears for admins and the CEO.** Every other entry is visible to everyone.

Press the arrow button at the very bottom of the sidebar to collapse it to icons only, and press
it again to expand it.

### 2.2 On a phone

On a small screen the sidebar is hidden behind the **menu** button (three lines) in the top-right
of the header bar. Tap it to slide the menu out, tap any entry to go there, or tap outside the
menu to close it. The magnifying-glass button next to it opens search.

### 2.3 Global search

Search looks across businesses, contacts, tasks and events at once.

1. Press **Search** in the sidebar, or the magnifying-glass button in the mobile header.
2. Type at least part of a name. Results appear as you type, grouped into
   **Businesses**, **Contacts**, **Tasks** and **Events**.
3. Tap a result to jump straight to it. Business and contact results open their profile page;
   event and task results open the Events or Tasks page.
4. If a group has more than five matches, press **Show all N results** to see the rest.

Before you type anything, search offers:

- **Category chips** (Businesses, Contacts, Tasks, Events) — tap one to browse just that type.
  Press **Clear filter** to go back to searching everything.
- **Recent** — your last eight searches. Tap one to run it again, or press **Clear All** to forget them.

What each type matches: businesses by name or industry, contacts by name or business name,
tasks by title, events by name or location.

Press **Cancel** or the back arrow to close search.

### 2.4 Quick Capture

The round lightning-bolt button floats in the bottom-right corner of every page. Use it when you
need to write something down before you forget it.

1. Tap the lightning-bolt button.
2. Choose **Task**, **Idea** or **Lead** at the top of the panel.
3. Type the title (what needs doing / your idea / the business name).
4. Optionally add details in the larger box underneath.
5. Press **Capture**.

A task is created as *To Do* with medium priority, an idea as a new *Other* idea, and a lead as a
business at the *New Lead* stage. You can go and fill in the rest of the details later.

### 2.5 Messages and confirmations

Actions confirm themselves with a small message in the top-right corner — green for success,
red when something failed. Deletions always ask "are you sure?" first.

---

## 3. Dashboard

The Dashboard is the first page you see after signing in. It is read-only apart from one button,
and every card links through to the page behind it.

**Top row of numbers**

- **Active Businesses** — everything in your network that is not archived.
- **Open Tasks** — tasks that are not done, with a count of overdue ones underneath.
- **Upcoming Events** — events dated today or later.
- **Potential Matches** — AI-suggested pairings you have not acted on yet.

**Needs Attention** lists businesses that have gone quiet, newest neglect first. How long counts
as "quiet" depends on the stage — a scheduled meeting goes stale after three days, a new lead
after a week, an established partnership after three weeks. Each card shows how many days it has
been (or *Never contacted*). Tap a card to open that business. When nothing is overdue you see
*"All relationships on track"* instead.

**At-Risk Relationships** shows up to five businesses whose health score has fallen below 40.
Tap a row to open the business.

**Pipeline Health** is a bar chart of how many businesses sit in each stage. **View Pipeline**
opens the board.

**Risks & Opportunities** highlights overdue tasks, high-potential matches and businesses in
active discussion. When there is nothing to flag it says *"All clear — no alerts"*.

**Urgent & Due Soon** lists up to five tasks that are urgent, high priority, or due within three
days. Overdue dates are shown in red.

**Top Matches** shows the four highest-scoring suggested matches with their synergy score and
reason. If it is empty it prompts you to run the Synergy Scanner.

The CEO also sees a small **Manage Workspace Hosting · $25/mo** link at the very bottom of the page,
which opens the hosting payment page in a new tab. Nobody else sees it.

### 3.1 Logging one interaction against several businesses

The **Log Interaction** button in the top-right of the Dashboard is for the case where a single
event — a mixer, a group call, a mass email — touched a lot of companies at once.

1. Press **Log Interaction**.
2. In **Select Businesses**, tick each company involved. Use the search box to narrow the list,
   and **Select All** / **Deselect All** to take everything currently listed.
3. Choose the **Type** (Meeting, Email, Phone Call, Referral, Event, Follow-up, Introduction, Other)
   and set the **Date & Time**.
4. Fill in a **Title**, **Notes / Details** and **Outcome / Next Steps**.
5. Press **Log for N Businesses**.

The same entry is written to every company you ticked, and each one's health score, last-contact
date and next follow-up date are recalculated.

---

## 4. Pipeline

The Pipeline is a board with one column per stage: **New Lead**, **Contacted**,
**Meeting Scheduled**, **In Discussion**, **Collaborating**, **Partnered**. Each card is a
business, and the number in the top-right of a column is how many are in it. Archived businesses
do not appear here.

**Moving a business to another stage**

1. Press and hold a card.
2. Drag it into the target column.
3. Release. A *"Stage updated"* message confirms the move.

If automatic follow-up tasks are switched on (they are by default — see
[20.2](#202-automatic-tasks-when-a-stage-changes)) moving a card also creates the matching task
and writes a note into the business's timeline.

**Opening a business from the board.** Click a card (without dragging) to open its
[AI Acquisition Strategy](#7-ai-acquisition-strategy) page. From there, **View full profile →**
takes you to the full business record.

Each card shows the company name, industry, the assigned account manager, up to two tags, and a
small coloured dot for its health score (green is strong, red is cold).

**Export Report** in the top-right saves a PDF pipeline report: total active businesses, average
health score, a count per stage, and a table of every business with its stage, health score and
last contact date.

---

## 5. Businesses (your network)

**Businesses** in the sidebar lists every company you have. The subtitle tells you how many
there are in total.

Each card shows the name, industry, health score badge, stage badge, the *Needs* and *Offers*
lines, and the assigned account manager. An orange pulsing dot means the company is due a
follow-up. Click a card to open the full profile.

### 5.1 Searching and filtering

- **Search businesses…** matches the company name and the industry.
- **Needs Follow-Up** is a toggle chip. Turn it on to see only companies that are overdue.
- Five dropdown filters narrow the list further: **Stage**, **Manager**, **Industry**, **City**
  and **State**. The Manager, Industry, City and State lists are built from the data you already
  have, so they only offer values that exist.
- When one or more dropdown filters are active, a **Clear (N)** button appears. Press it to reset
  all five at once. (The Needs Follow-Up chip is separate — turn it off by tapping it again.)

### 5.2 Adding a business

1. Press **Add Business**.
2. Fill in **Company Name** — this is the only required field.
3. Optionally set **Industry** (a fixed list of fifteen options) and **Stage** (defaults to *New Lead*).
4. Describe the company in **Description**, and — most importantly for matchmaking — fill in
   **Needs** (what they are looking for) and **Offers** (what they can provide). The Synergy
   Scanner and every AI suggestion depend on these two fields.
5. Add the main person: **Contact Name**, **Title / Role**, **Contact Email**, **Phone**.
6. Add **LinkedIn**, **Website**, **Address**, **City** and **State**.
7. Pick an **Account Manager** from your team.
8. Add **Tags**: type a word and press Enter (or the **Add** button). Tap a tag to remove it.
9. Add internal **Notes**. This box is a rich-text editor — you get bold, italic, underline,
   bulleted and numbered lists, and links.
10. Press **Add Business**.

**Duplicate warning.** As you type the name, URME checks what you already have. If something
looks like a match, an amber panel appears listing up to three candidates with the reason
(*Same name*, *Similar name*, *Same email*). Press **View** next to a candidate to open the
existing record instead, or press **Create Anyway** to dismiss the warning and carry on.

**Improve with AI.** Press this button (next to the save button) once you have at least a company
name. The AI rewrites the **Description**, **Needs** and **Offers** into sharper, more
partner-facing copy and drops the result straight into the form. Nothing is saved until you press
**Add Business**, so you can read it over and edit it first. If you do not like the result, retype
the fields or close the dialog without saving.

### 5.3 Export to CSV

Press **Export CSV**. A spreadsheet file downloads containing whatever is currently on screen —
the filters and search box apply — with these columns: Name, Industry, Stage, Contact, Email,
Phone, City, State, Needs, Offers, Health Score, Last Contact.

### 5.4 Import from CSV

1. Press **Import CSV**.
2. **Step 1 — Select File.** Tap the dashed box and choose a `.csv` or `.txt` file.
3. **Step 2 — Map Columns.** You see the file name and size, the first three rows as a preview,
   and one dropdown per column in your file. URME guesses the mapping from the column headings
   (for example *Company* → Company Name, *Tel* → Contact Phone). Correct anything it got wrong,
   and set columns you do not want to **— Skip —**. Press **Back** to pick a different file.
4. Press **Import N Businesses**.
5. **Step 3 — Import.** A progress bar runs, then a summary tells you how many rows imported and
   how many failed. Press **Done**.

Every imported company arrives at the **New Lead** stage and is tagged `csv-import`, so you can
find the batch afterwards by searching for that tag. Rows with no company name are skipped and
counted as failures. Note that import does **not** run duplicate detection, so de-duplicate your
file before uploading.

### 5.5 Map view

Press the pin icon next to the search box to switch from the list to a map of the United States.
Each company with coordinates appears as a coloured dot — the colour follows its health score.
Click a dot for a pop-up with the name (which links to the profile), industry, stage and health score.
Press the list icon to switch back.

Companies only appear on the map once they have coordinates. If some are missing, a yellow note
says how many. Press **Geocode All** to look up coordinates from the City and State of every
company currently in view; this takes about a second per company, and a *"Geocoding complete"*
message tells you when it is done. Companies without a city or state cannot be placed.

### 5.6 Synergy Scanner (AI matchmaking)

The Synergy Scanner reads what your companies need and offer and proposes partnerships.

1. Press **Synergy Scanner**. You need at least two businesses; otherwise you get
   *"Need at least 2 businesses"*.
2. Wait while the button spins. The AI reviews up to 20 companies and returns roughly five pairings.
3. A message confirms how many matches were found.

Each suggested match is saved with a **synergy score** out of 100 and a written reason. You will
find them on the Dashboard under **Top Matches**, and on each company's profile under the
**Matches** tab, where you can act on them (see [6.9](#69-matches-tab)).

Running the scanner again adds more suggestions rather than replacing the old ones, so you may
see the same pairing twice if you run it repeatedly.

---

## 6. A single business profile

Click any business card to open its profile. **Back to Network** at the top returns you to the list.

### 6.1 The header

The top card shows the company name, its stage badge, its health score badge, the industry,
the description, and quick links for email, phone, website and location.

Two buttons sit on the right:

- The **sparkle** button generates an AI relationship brief (see [6.2](#62-ai-relationship-brief)).
- The **⋮** button opens a menu with **Export PDF**, **Edit** and **Delete**.

Tags, if any, appear along the bottom of the card.

**Export PDF** downloads a one-file profile report: overview (industry, stage, location, health
score), full contact information, description, needs and offers, the last ten interactions, and
every match with its score and status.

**Edit** reopens the same form used to add the business, pre-filled. Change anything and press
**Update Business**. **Improve with AI** and the duplicate warning work here too. If you change
the stage from this form, the same automatic follow-up task is created as when you drag a card on
the Pipeline.

**Delete** asks for confirmation and then removes the company permanently. This cannot be undone.

### 6.2 AI relationship brief

Press the **sparkle** button in the header. The AI reads the company's details plus its five most
recent interactions and returns a panel with:

- a short **summary** of where the relationship stands,
- **Best Next Step** — the single most useful thing to do next,
- **Outreach Draft** — a message you can copy and adapt,
- **Talking Points** — things worth raising,
- **Watchouts** — risks to keep in mind.

Press **Regenerate** in that panel for a fresh take. The brief is generated on demand and is not
saved — it disappears when you leave the page.

### 6.3 Contact Info and Account Manager

**Contact Info** shows the company's primary contact (name, title, email, phone) along with
LinkedIn, website and address. Email and phone are tappable. **Account Manager** shows who owns
the relationship, or *"No manager assigned"* — assign one by editing the business.

### 6.4 Events & Engagements

This card lists every event the company is taking part in, with the event status, date and location.

To connect a company to an event:

1. Press **Link Event**.
2. Choose the event from the dropdown. Events the company is already linked to are not offered.
3. Optionally add a **Note** and a **Link** (a URL). Both are appended to the event's post-event notes.
4. Press **Link Event**.

The company now appears under **participating businesses** on the Events page too. There is no
button to un-link a company once it is linked.

### 6.5 Needs, Offers and Notes

Three cards show the company's **Needs**, **Offers** and internal **Notes** as they were entered.
Edit them through **Edit** in the header menu.

### 6.6 Activity tab — logging an interaction

The **Activity** tab holds the full conversation history, newest first, with a count in the tab label.

1. Press **Log Interaction**.
2. Choose the **Type**: Meeting, Email, Phone Call, Referral, Event, Follow-up, Introduction or Other.
3. Set the **Date & Time** (it defaults to now).
4. Choose the **Contact Person**. The dropdown offers **No contact**, every contact record attached
   to the company, and — unless the same name is already among those records — the company's primary
   contact, marked *(primary contact)*.
5. Give the entry a **Title**.
6. Write up what happened in **Notes / Details** — a rich-text box with bold, italic, underline,
   lists and links.
7. Optionally pick a **Linked Team Member** — who from your side was involved.
8. Record the **Outcome / Next Steps**.
9. Optionally attach a file (see below).
10. Press **Log Interaction**.

Saving an interaction recalculates the company's health score, sets its last-contact date to today,
updates the interaction count, and schedules the next follow-up date based on the stage.

**Adding a contact while you log.** Press **Add new contact** above the contact dropdown, fill in
the full name (required) plus title, email and phone, and press **Create & Link Contact**. The new
person is saved against this company and selected for this interaction. If the name looks like
someone you already have, an amber *"Possible duplicate contact"* box appears — tap the suggested
person to use the existing record instead of creating another.

**Starting from a template.** Press **Use Template** above the notes box, then pick a template.
Its body is dropped into the notes with the business name and contact name filled in automatically.
Press **Close** to dismiss the list without choosing.

**Attaching a file.** Press **Attach a file** at the bottom, choose the file, and wait for
*"File attached"*. Press the **×** next to the file name to remove it before saving. Attachments
appear as clickable links in the timeline.

**Filtering the timeline.** When there is more than one interaction, a dropdown appears above the
list. Choose a type to show only entries of that kind; the count next to it updates. Each entry
shows its icon and type, date and time, notes, the outcome (prefixed *Next:*), the contact and
team member involved, any attachment, and who logged it.

Interactions cannot be edited or deleted once saved.

### 6.7 Contacts tab

Lists the named people attached to this company, each with title, email and phone. Click one to
open their profile. Press **Add Contact** to add another: fill in **Full Name** (required), plus
title, email, phone, LinkedIn URL and notes, then press **Add Contact**.

### 6.8 The two kinds of contact

A company has one **primary contact** stored on the company record itself — that is the name,
title, email and phone you type into the business form, and it is what appears under
**Contact Info**. Separately, it can have any number of **contact records**, which live in the
Contacts list and have their own profile pages.

The primary contact is not a contact record, so it will not appear in the Contacts tab or the
Contacts page. If you want a full profile and interaction history for that person, add them as a
contact record as well.

### 6.9 Matches tab

Lists AI-suggested partnerships involving this company, with a count in the tab label. Each row
shows the other company (a link to its profile), the current status, the reason and the synergy score.

What you can do depends on the status:

- **suggested** — press **Propose Intro** to move it to *intro proposed*, or **Dismiss** to set it
  to *dismissed*.
- **intro proposed** — press **Mark Introduced** to move it to *introduced*.
- **introduced**, **collaborating** and **dismissed** have no further buttons.

Dismissed matches stay in the list; they are just no longer counted as suggested.

---

## 7. AI Acquisition Strategy

Clicking a card on the Pipeline board opens this page. It is a longer, more structured plan than
the relationship brief on the profile page, and it generates itself as soon as the page opens.

The page shows the company name, its stage, industry and location, then:

- **Key Insight** — the one thing that matters most about this relationship.
- **Priority** (high / medium / low) and an **estimated timeline** to closing.
- Five sections: **Immediate Next Steps**, **Outreach & Communication**, **Value Proposition**,
  **Long-Term Partnership Potential** and **Stakeholder Engagement**. Each has a short summary and
  a list of specific points.

**Working through the steps**

- Tick the checkbox next to any item under **Immediate Next Steps** to cross it off. Ticks are
  visual only — they are not saved and disappear when you leave the page.
- Click the *text* of a next step to highlight it. Related points in the other four sections are
  highlighted in yellow and everything else dims, so you can see how one action connects to the
  rest of the plan. Press **Clear highlight** to undo it.

Press **Regenerate** at any time for a different plan. **Pipeline** takes you back to the board,
and **View full profile →** opens the business record.

---

## 8. Contacts

**Contacts** lists every named person across your whole network, with their initials as an avatar,
their title and the company they belong to. Email and phone addresses at the bottom of each card
are tappable — they open your mail app or dialler without opening the contact.

- **Search contacts…** matches the person's name and their email address.
- The chips underneath filter by company. **All Businesses** clears the filter. Only the first
  15 companies are offered as chips.

Tap a card to open the contact's profile.

### 8.1 Adding a contact

1. Press **Add Contact**.
2. Choose the **Business** — required, because every contact belongs to a company.
3. Fill in **Full Name** — also required.
4. Optionally add **Title / Role**, **Email**, **Phone** and **Notes**.
5. Press **Add Contact**.

You can also add contacts from a business profile (see [6.7](#67-contacts-tab)) or while logging an
interaction (see [6.6](#66-activity-tab--logging-an-interaction)).

### 8.2 A contact's profile

The header shows the name, title, a link to their company, and their email, phone and LinkedIn.

- The **pencil** button opens the edit dialog: full name, title, email, phone, LinkedIn URL and
  notes. Press **Save Contact**.
- The **bin** button deletes the contact after a confirmation. This cannot be undone.

**AI Contact Brief.** Press **Generate** to have the AI read the contact's details and recent
interactions and produce a summary, a **Best Next Step**, an **Outreach Draft**, **Talking Points**
and **Watchouts**. Press **Regenerate** for a different version. The brief is not saved.

**Interaction History** at the bottom lists every interaction logged against this person, with the
same type filter as a business timeline. Interactions only appear here if the contact was chosen in
the **Contact Person** dropdown when the interaction was logged.

---

## 9. Tasks

The Tasks page (titled **Accountability Engine**) is your to-do list. The subtitle tells you how
many tasks are completed and how many are overdue.

### 9.1 Creating a task

1. Press **New Task**.
2. Type the **Title** — required.
3. Optionally add a **Description**.
4. Set the **Priority**: Low, Medium (the default), High or Urgent.
5. Set a **Due Date**.
6. Press **Create Task**.

New tasks are assigned to you and start in the *To Do* column.

**Improve with AI.** Press **Improve with AI** once you have a title or a description. The AI
rewrites both into something clearer and more actionable and puts the result back into the form.
Nothing is saved until you press **Create Task**.

**Chat with AI about this task.** After using Improve with AI, a link appears:
*"Chat with AI about how to make this task successful →"*. Press it to open the **Task AI Coach**:

1. The coach opens with a briefing on why the task matters, the two or three most critical steps,
   and one blocker to watch for.
2. Type a question in the box at the bottom and press Enter or the send button.
3. The conversation continues for as long as you like.

Press the back arrow to return to Tasks. The conversation is not saved — leaving the page loses it.

### 9.2 Working through tasks

Tasks are grouped into tabs: **To Do**, **In Progress**, **Done**, and **Overdue** (which only
appears when something is overdue). Each tab shows a count.

- **Change status.** Tap the circle to the left of a task. To Do becomes In Progress, In Progress
  becomes Done, and Done goes back to To Do.
- **Complete a task.** Tapping through to Done fires confetti and a *"Task completed! +10 XP"*
  message.
- **Delete a task.** Press the **×** on the right of the row and confirm.

Each row shows a coloured priority dot, the title, the description, the due date (red when
overdue), the linked business if any, and who it is assigned to.

Tasks cannot be edited after they are created — only their status changes. If the details are wrong,
delete the task and create it again.

### 9.3 Team XP

The bar at the top of the page is a light gamification touch. It counts 10 XP for every completed
task and shows the total for the **whole team**, not just for you. The bar fills up as the number
grows and is full at 500 XP. There is no per-person score and no reward attached to it.

---

## 10. Templates

Templates are reusable message bodies with placeholders that get filled in automatically. Anyone
can create, edit and delete them.

The first time the page is opened on a workspace with no templates, three are created for you:
**Introduction**, **Follow Up** and **Event Invite**.

Each card shows the template title, its category, the subject line, a preview of the body, how many
times it has been used, and pencil (edit) and bin (delete) buttons.

### 10.1 Creating a template

1. Press **New Template**.
2. Type a **Title** — required.
3. Choose a **Category**: Intro, Follow Up, Event Invite, Thank You, Proposal or Custom.
4. Write a **Subject**.
5. Insert merge fields: tap any of the chips under **Merge Fields — tap to insert** and the
   placeholder is appended to the body.
6. Write the **Body** in the rich-text editor.
7. Press **Preview** to see the template with sample data filled in (Jane Smith at Acme Corp).
   Press **Hide Preview** to close it.
8. Press **Create**.

To change a template, press its pencil button, edit, and press **Update**. To remove one, press the
bin button and confirm.

### 10.2 Merge fields

A merge field is written as `{{name}}` and is replaced with real information when the template is
used. The available fields are:

| Chip | Placeholder | Filled with |
| --- | --- | --- |
| Contact Name | `{{contact_name}}` | The person you are writing to |
| Business Name | `{{business_name}}` | Their company |
| Industry | `{{industry}}` | Their industry |
| Contact Title | `{{contact_title}}` | Their job title |
| Contact Email | `{{contact_email}}` | Their email address |
| My Name | `{{my_name}}` | Your name |
| My Title | `{{my_title}}` | Your job title |
| Today | `{{today_date}}` | Today's date, written out |
| Next Week | `{{next_week_date}}` | The same day next week |
| Business Needs | `{{business_needs}}` | What they need |
| Business Offers | `{{business_offers}}` | What they offer |

### 10.3 Using a template

Templates are applied from the **Use Template** link in the interaction log on a business profile
(see [6.6](#66-activity-tab--logging-an-interaction)). In that context the business name and the
selected contact name are filled in; the other placeholders are replaced with blanks, so check the
text before you send it. Copy the finished text out of the notes box into your email client — URME
does not send email itself.

---

## 11. Ideas

The Ideas page (titled **Idea Incubator**) is a shared board for suggestions, sorted with the
most-voted first.

### 11.1 Posting an idea

1. Press **New Idea**.
2. Type a **Title** — required.
3. Describe it in the rich-text **Description** box.
4. Choose a **Category**: Strategy, Partnership, Event Concept, Marketing, Product or Other.
5. Press **Post Idea**.

**Improve with AI** rewrites the title and description into something sharper before you post.
The same button is available when editing an idea.

### 11.2 Voting, discussing and editing

- **Vote.** Tap the thumbs-up on the left. The count goes up and the icon fills in. Tap again to
  take your vote back. One vote per person.
- **Comment.** Tap the speech-bubble icon (with the comment count) to open the discussion, type in
  the box and press **Send** or Enter.
- **AI Improve.** Press **AI Improve** on an idea and the AI posts two or three concrete
  suggestions for strengthening it as a comment from *AI Assistant*, highlighted differently from
  human comments.
- **Edit.** Press the pencil to change the title, description or category, then **Save Changes**.
- **Delete.** Press the bin and confirm.

Anyone can edit, delete and vote on any idea, including ideas other people posted.

---

## 12. Events

The Events page (titled **Event Orchestrator**) tracks networking events. It has two tabs:
**Upcoming** (dated today or later) and **Archived** (dated in the past), each with a count.

### 12.1 Creating an event

1. Press **New Event**.
2. Type the **Event Name** — required.
3. Add a **Description**, the **Date**, and the **Time** as free text (for example `6:00 PM`).
4. Add the **Location**.
5. Choose the **Type**: Mixer, Workshop, Conference, Dinner, Virtual, Showcase or Other.
6. Choose the **Status**: Planning, Confirmed, In Progress, Completed or Cancelled.
7. Write down what you want out of it in **Objectives**.
8. Press **Create Event**.

**Improve with AI** rewrites the name, description and objectives into more polished copy before
you save.

### 12.2 Editing and deleting

Press the **pencil** on an event card to edit it. The edit form has one extra field,
**Post-Event Notes**, for writing up what happened afterwards. Press **Update Event** to save.

Press the **bin** and confirm to delete an event permanently.

### 12.3 What an event card shows

The name and status badge, the description, and then the date, time, location and type. Objectives
appear below a divider, and post-event notes below that in the accent colour.

**Add to Google Calendar** at the bottom of every card opens Google Calendar with the name,
description and location pre-filled. The slot is a placeholder one-hour block on the event date
rather than the actual time you typed, so adjust it in Google Calendar before saving.

### 12.4 Linking businesses to an event

Companies are linked to events from the business side — open the business profile and use
**Link Event** on the **Events & Engagements** card (see [6.4](#64-events--engagements)). There is
no attendee picker on the Events page itself.

Once at least one company is linked, the event card grows two extra sections:

- **Collect Event Fee** — a payment button (see [12.5](#125-collecting-an-event-fee)).
- **N participating businesses** — press it to expand the list. Each row shows the company and its
  account manager; click a row to open the company profile.

### 12.5 Collecting an event fee

The **Collect Event Fee** button opens whatever payment link an admin has configured under
Settings. If no link has been set up yet, the button is greyed out and reads
*"Configure payment link in Settings"* — press it to go to the Settings page (admins and the CEO only).

### 12.6 Export to CSV

**Export CSV** downloads every event — not just the tab you are on — with these columns: Name,
Date, Location, Status, Type, Attendees.

---

## 13. Sync Hub

The Sync Hub is where the team talks. It is a list of threads; open one to read and reply.

### 13.1 Starting a thread

1. Press **New Thread**.
2. Type a **Title** — required.
3. Write the **Opening Message** in the rich-text editor.
4. Choose a **Category**: General, Business, Event, Idea or Announcement.
5. Optionally, under **Link to Context**, attach the thread to a **Business** and/or an **Event**.
   Choose **— None —** for neither.
6. Press **Post Thread**.

The thread opens straight away so you can carry on.

### 13.2 Finding a thread

- **Search threads…** matches the title and the opening message.
- The category chips (**all**, **general**, **business**, **event**, **idea**, **announcement**)
  filter the list. Pinned threads always sort to the top.

Each card in the list shows the title, category badge, any linked business or event, a preview of
the latest reply (or the opening message if there are no replies yet), who started it, when it was
last active, and the reply count.

### 13.3 Reading and replying

Click a thread to open it. The opening post is marked **OP**; replies follow underneath, with your
own replies aligned to the right and labelled *You*.

To reply: type in the box at the bottom and press the send button, or press **Ctrl+Enter**
(**Cmd+Enter** on a Mac). The thread scrolls to your new message.

Press the back arrow at the top to return to the list.

### 13.4 Pinning and archiving (admins and the CEO only)

Pin and archive controls are only visible to admins and the CEO. Regular members see threads and
can reply, but have no pin or archive buttons.

- **From the list:** hover a thread card and use the small **pin** and **archive** buttons on its
  right-hand edge.
- **Inside a thread:** press the **⋮** button in the header and choose **Pin Thread** /
  **Unpin Thread** or **Archive Thread**.

Pinned threads sort to the top of the list for everyone. Archived threads disappear from the main
list; admins and the CEO see them collected under a *"N archived threads"* section at the bottom
of the page, which expands when clicked. There is no un-archive button.

---

## 14. Finance

The Finance page (titled **Finance Hub**) tracks money in and money out.

**Collect Payment** at the top is the same configurable payment button described in
[12.5](#125-collecting-an-event-fee).

**Four summary cards** show this month's **Revenue**, this month's **Expenses**, this month's
**Profit** (which turns red and says *"Running at a loss"* when negative), and total
**Receivables** with a count of how many are pending.

Below them, a bar chart compares revenue against expenses for the last four months.

### 14.1 Logging revenue or an expense

1. Press **Log Revenue** or **Log Expense**.
2. Choose the **Category**. Revenue offers Event Revenue, Matchmaking Fee, Sponsorship, Consulting
   and Other Revenue. Expenses offer Venue Cost, Marketing, Operations, Software/Tools, Travel,
   Payroll and Other Expense.
3. Enter the **Amount** and the **Date** — both required.
4. Add a **Description**.
5. For revenue only, set the **Payment Status**: Paid (the default), Pending or Overdue.
6. In the highlighted **Link to Event or Business** box, pick the event and/or the client this
   entry belongs to. Linking is what makes the *By Event* tab and per-partner revenue work, so it
   is worth doing.
7. Add any **Notes**.
8. Press **Log Revenue** / **Log Expense**.

Entries cannot be edited after saving. To correct one, delete it and log it again.

### 14.2 All Entries tab

Every entry, newest first. Each row shows an up or down arrow, the description (or the category if
there is no description), the date, the category badge, any linked event or business, a *Pending* or
*Overdue* badge where relevant, and the amount in green (revenue) or red (expense).

Press the **bin** on a row and confirm to delete an entry.

### 14.3 Receivables tab

Every revenue entry that is not marked paid, with a count in the tab label. Entries marked overdue,
or dated more than 30 days ago, are flagged **Overdue** and their card is outlined in red. Each row
shows the date, who it is from, the related event, how many days ago it was, and the amount.

Press **Mark Paid** to settle an entry — it leaves this tab immediately. A **Total Outstanding**
row sits at the bottom.

### 14.4 By Event tab

Profit and loss per event, most profitable first. Each card shows the event name, **Net Profit**,
side-by-side **Revenue** and **Expenses** totals, and a bar showing revenue as a share of total
money moved. Only entries you linked to an event appear here.

### 14.5 Tax Estimate tab

A rough quarterly picture for the current calendar quarter:

- **Current Quarter Breakdown** — total revenue, total expenses and net profit for the quarter.
- **Revenue Sources** and **Expense Breakdown** — each category with a bar and a total.
- **Estimated Tax Reserve** — roughly 25% of net profit, split into an indicative federal (~21%)
  and self-employment (~15.3%) figure. If the quarter is at break-even or a loss it says no reserve
  is needed.

This is a rough estimate only. It ignores deductions, credits and state obligations — the page says
as much at the bottom. Use your accountant's numbers for anything that matters.

### 14.6 Exports

- **Export CSV** downloads every entry with these columns: Date, Type, Category, Amount,
  Description, Status, Business.
- **Export PDF** downloads a financial summary PDF for the current month: total revenue, total
  expenses, net, and a table of every entry.

---

## 15. Reports

Reports pulls your network, activity and money together into one page. It is read-only apart from
the revenue goal and the AI summary.

**Top row of numbers:** total businesses, average health score across active businesses,
interactions logged this month, and revenue this month.

**Activity — Last 8 Weeks** is a stacked bar chart of interactions per week, coloured by type
(meetings, calls, emails, follow-ups and notes).

**Team Activity** is a horizontal bar chart of how many interactions each person has logged,
top eight only.

**At-Risk Relationships** lists every active business with a health score below 40, worst first,
with how long since the last contact. Click a row to open the business.

**Interaction Breakdown — This Month** is a pie chart of interaction types.

**Pipeline Movement — This Month** lists the ten businesses changed most recently this month with
their stage and health score. Click one to open it.

**Revenue vs Goal — This Month** compares revenue against a monthly target. Type your target into
the box next to the heading; it is remembered in this browser only (it is not shared with the team,
and it will reset if you switch browsers or clear your browser data). The default is $10,000.

**AI Weekly Summary:** press **Generate Weekly Summary** to have the AI look at the last seven days
— interactions logged, businesses that moved stage, new leads, notable conversations, relationships
going quiet — and write a short executive summary plus two or three priorities for next week. Press
the **copy** icon in the corner of the result to put it on your clipboard. The summary is not saved.

**Export Financial PDF** at the bottom saves this month's finance summary as a PDF, the same report
as the Finance page's Export PDF.

---

## 16. Team, roles and account management

The Team page lists everyone in the workspace. The subtitle shows how many members there are and,
if any account is locked, how many.

Each card shows the photo or initial, the display name, an **ADMIN** or **CEO** badge where
relevant, the job title, email and phone, the working status (Active, On Leave, Inactive), a
**Locked** badge, a **2FA Enabled** badge, the subscription status for standard members, and when
the profile was last updated.

A small **padlock** icon on a card means you are not allowed to administer that account.

### 16.1 The three roles

- **user** — a standard member.
- **admin** — can administer other members.
- **ceo** — the same administrative rights as admin, plus its own badge.

Two accounts are **protected**: the super-admin (Michael Alexander) and the CEO (AJ Macedonia).
Protection is tied to those two specific accounts, not to their role or their email address.

### 16.2 Who can administer whom

| You are | You can administer |
| --- | --- |
| The super-admin (Michael) | Everyone, including the CEO |
| The CEO or an admin | Standard members only — not the super-admin, and not the CEO |
| A standard member | Nobody |

Editing **your own** profile is not "administering" and is always allowed, though what a standard
member can change about themselves is limited — see [16.4](#164-editing-a-members-profile).

### 16.3 Adding a team member

**Admins and the CEO see an Add Team Member button at the top of the Team page. Standard members
do not.**

1. Press **Add Team Member**.
2. Fill in **Full Name**, **Email** and a **Temporary Password** (at least 8 characters).
3. **Role** is fixed to `user` and cannot be changed — only standard members can be created here.
4. Press **Create Account**.

Tell the new member their temporary password and ask them to change it under
**Profile → Account Security**.

The same **Add Team Member** button also appears under **Profile → Team**, which admins and the
CEO have as an extra tab.

### 16.4 Editing a member's profile

Click anywhere on a member's card to open **Edit Team Member**. What you see depends on who you
are and whose card it is:

- **If you may not administer that person**, the dialog just says *"Contact admin to edit this
  profile"*.
- **If you are a standard member opening your own card**, you get a cut-down form with only
  **Email** and **New Password**. Press **Save Security Settings**. Standard members cannot change
  their own name, title, phone or bio — ask an admin.
- **Otherwise** you get the full form:
  1. Upload a photo with the small **+** badge on the avatar.
  2. Edit **Display Name**, **Job Title**, **Phone**, **Bio**, **LinkedIn URL**, **Department**
     and **Location**.
  3. Add **Skills**: type one and press Enter or **Add**; press the **×** on a chip to remove it.
  4. Set the **Status**: Active, On Leave or Inactive.
  5. Press **Save Changes**.

**Subscription Management** — a **Subscription Status** dropdown (None, Active, Expired) and a
**Paid Through Date** — only appears when you may administer that person *and* they are a standard
member. This is how you switch someone's access back on after they pay.

Roles cannot be changed anywhere in the app. Promoting someone to admin or CEO, or demoting them,
has to be done by whoever administers the workspace database.

### 16.5 Unlocking a locked account

If a member's card shows a **Locked** badge and you may administer them, an **Unlock** button
appears at the bottom of the card. Press it and the account is unlocked immediately. Standard
members never see this button.

### 16.6 Deleting an account

A **Delete** button appears on a card only when all of the following are true:

- you may administer that person,
- their role is `user` (admins and the CEO cannot be deleted from the app),
- it is not your own card (you cannot delete yourself).

Press **Delete**, confirm, and the account is removed. This cannot be undone.

The same delete control appears next to eligible members under **Profile → Team**.

### 16.7 What a standard member sees on this page

A standard member can open the Team page and browse the member cards they are allowed to see, but has:

- no **Add Team Member** button,
- a padlock instead of an editable form on everyone else's card,
- no **Unlock** buttons,
- no **Delete** buttons,
- no **Subscription Management** section,
- and on their own card, only email and password fields.

---

## 17. Profile

**Profile** is your own account. The header shows your email address, and the page is split into
tabs. Admins and the CEO get one extra tab, **Team**.

### 17.1 My Profile tab

Your photo, name, email, role and job details sit at the top.

- **Change your photo:** hover the avatar and click the camera icon, then choose an image. It is
  saved straight away.
- **Edit:** opens the same full **Edit Team Member** dialog described in
  [16.4](#164-editing-a-members-profile), for your own account.
- **Full Name**, **Job Title**, **Phone** and **Bio** can be edited inline and saved with
  **Save Profile**. **Standard members find these fields greyed out and have no Save Profile
  button** — they can only change email and password.
- **Logout** signs you out.
- **View Full Team →** at the bottom opens the Team page.

Your LinkedIn URL and skills are shown here read-only if they have been filled in — change them
through the **Edit** dialog.

### 17.2 Account Security: email, password and 2FA

In the **Account Security** block on the My Profile tab:

- **Change your email:** type the new address in **Email** and press **Update Credentials**.
- **Change your password:** type a new one (at least 8 characters) in **New Password** and press
  **Update Credentials**. Leave the field blank to keep your current password.

**Turning on two-factor authentication**

1. Press **Enable 2FA**.
2. A QR code appears. Open your authenticator app and scan it.
3. If scanning fails, use the **Manual setup key** shown underneath — press **Copy setup key** and
   paste it into your authenticator app. **Start over** generates a fresh code if something went wrong.
4. Type the 6-digit code from your app into the six boxes.
5. Press **Verify 2FA Code**. A *"2FA enabled"* message confirms it, and a **2FA Enabled** badge
   appears on your Team card.

From now on, signing in with email and password asks for a code (see [1.3](#13-two-factor-authentication-at-login)).

**Turning it off:** press **Disable 2FA**. Do this before you wipe or replace the phone holding
your authenticator app, or you may lock yourself out.

### 17.3 Subscription tab

Shows whether your access is **Active** (with the paid-through date), **Expires in N days**, or
**Expired**. When it is expired or was never set up, a **Reactivate — $25/month** button opens the
payment page in a new tab. Admins also see a note pointing at the Team page, where they manage
other people's subscriptions.

### 17.4 My Businesses tab

**Managed Businesses** lists every company where you are the account manager, with its stage.
Click one to open it. **Related Events** lists events any of those companies are linked to, marked
*Upcoming* or *Past*, with the company that connects you to each one.

### 17.5 Activity tab

**My Logged Interactions** — every interaction you have logged, anywhere in the app, in the same
timeline format (with the same type filter) as a business profile.

### 17.6 AI Settings tab

Informational only. AI features run through URME's own server-side integration; there is nothing
to configure and you never need to supply a personal API key.

### 17.7 Settings tab

Two switches, both of which apply to you in this browser only:

- **Push Notifications** — see [20.1](#201-browser-notifications).
- **Auto-create tasks on stage change** — see [20.2](#202-automatic-tasks-when-a-stage-changes).

### 17.8 Team tab (admins and the CEO only)

A compact list of team members with name, email, role and job title, an **Add Team Member** button,
and a bin icon next to members you are allowed to delete. It is a shortcut; the full Team page has
more. Note that this particular list hides the super-admin account.

---

## 18. Settings (admins and the CEO only)

**Settings** appears in the sidebar for admins and the CEO. A standard member who navigates to it
directly gets an **Access Denied** screen with a **Back to Dashboard** button.

**Payment Collection** configures the payment button that appears on the Finance page and on event
cards:

1. Paste the **Payment Link URL** — a Stripe payment link or any other payment page URL.
2. Set the **Button Label** (defaults to *Make Payment*).
3. Write a **Payment Description** explaining what the payment is for.
4. A **Preview** shows how the button will look once a URL is entered.

**Business Branding** holds your **Business Name**, used for branding inside the app.

Press **Save Settings** to save everything on the page. Until a payment link is saved, payment
buttons elsewhere in the app stay greyed out.

---

## 19. Where AI shows up

Every AI feature runs through URME's own service. You never enter an API key, and results are
generated fresh each time — nothing here is stored unless the feature explicitly saves it.

| Where | What it does | Saved? |
| --- | --- | --- |
| Businesses → **Synergy Scanner** | Suggests up to five partnerships with a score and reason | Yes, as matches |
| Add / Edit Business → **Improve with AI** | Rewrites description, needs and offers | Only when you save the form |
| Business profile → **sparkle** button | Relationship brief: summary, next step, outreach draft, talking points, watchouts | No |
| Pipeline card → **AI Acquisition Strategy** | Five-section acquisition plan, priority and timeline | No |
| Contact profile → **Generate** | Contact brief: summary, next step, outreach draft, talking points, watchouts | No |
| New / Edit Task → **Improve with AI** | Rewrites the task title and description | Only when you save the task |
| Task AI Coach | A chat about how to land a specific task | No |
| New / Edit Idea → **Improve with AI** | Rewrites the idea title and description | Only when you save the idea |
| Idea card → **AI Improve** | Posts concrete suggestions as a comment | Yes, as a comment |
| New / Edit Event → **Improve with AI** | Rewrites the event name, description and objectives | Only when you save the event |
| Reports → **Generate Weekly Summary** | Executive summary of the week plus priorities | No |

The AI is only as good as what you have written down. Filling in **Needs** and **Offers** on every
business, and logging interactions as you go, is what makes the matches and the briefs useful.

---

## 20. Notifications and automations

### 20.1 Browser notifications

Turn on **Push Notifications** under **Profile → Settings** and allow the browser prompt. URME
then checks, when you open the Dashboard, for tasks that are due or overdue and businesses with no
contact in 14 days, and shows up to three desktop notifications.

Two things to know: these fire only while URME is open in a browser tab — they are not real
background push alerts, and closing the app stops them. And the setting is per browser, so
enabling it on your laptop does not enable it on your phone. If you blocked notifications
previously, the toggle will fail with *"Notifications blocked. Enable in browser settings."* and
you have to allow them in your browser's site settings first.

### 20.2 Automatic tasks when a stage changes

While **Auto-create tasks on stage change** is on (the default, under **Profile → Settings**),
moving a business to a new stage — by dragging it on the Pipeline or changing the stage in the edit
form — creates a follow-up task assigned to you and writes a note into the business's timeline:

| New stage | Task created | Priority | Due |
| --- | --- | --- | --- |
| Contacted | Send intro email to *company* | Medium | in 2 days |
| Meeting Scheduled | Prepare meeting agenda for *company* | High | tomorrow |
| In Discussion | Draft proposal for *company* | Medium | in 5 days |
| Collaborating | Set up collaboration framework with *company* | Medium | in 7 days |
| Partnered | Schedule quarterly review with *company* | Low | in 30 days |

Moving a business back to **New Lead** or to **Archived** creates nothing. Turning the switch off
stops the tasks and the timeline notes; it is per browser, like the notification setting.

### 20.3 Health scores and follow-up dates

The health score out of 100 that you see on every business card is worked out from three things:

- **How recently** you last spoke — up to 40 points, full marks within a week, nothing after 60 days.
- **How often** you have spoken — up to 30 points, full marks at ten or more logged interactions.
- **How far** the relationship has progressed — up to 30 points, from 5 for a new lead to 30 for a
  partnership.

The badge label follows the number: **Strong** (80+), **Good** (60–79), **Cooling** (40–59),
**At Risk** (20–39), **Cold** (under 20).

Scores are recalculated when you log an interaction. A company's next follow-up date is set at the
same time, based on its stage: 2 days after a scheduled meeting, 5 for a new lead, 7 for contacted
or in-discussion, 14 for collaborating, 21 for partnered.

---

## 21. Roles at a glance

| Feature | Standard member | Admin / CEO |
| --- | --- | --- |
| Dashboard, Pipeline, Businesses, Contacts | Full access | Full access |
| Tasks, Ideas, Events, Templates, Finance, Reports | Full access | Full access |
| Sync Hub — read and reply | Yes | Yes |
| Sync Hub — pin and archive threads | No | Yes |
| Settings page (payment link, branding) | No — Access Denied | Yes |
| Team page — view members | Yes | Yes |
| Team page — Add Team Member | No | Yes |
| Team page — edit another member's profile | No (padlock) | Yes, except protected accounts |
| Team page — Unlock a locked account | No | Yes, except protected accounts |
| Team page — Delete an account | No | Yes, standard members only |
| Manage someone's subscription | No | Yes, standard members only |
| Edit your own name, title, phone, bio | No — ask an admin | Yes |
| Change your own email, password and 2FA | Yes | Yes |
| Requires an active subscription to use the app | Yes | No |
| Change anyone's role | Not available in the app | Not available in the app |

Neither an admin nor the CEO can administer the two protected accounts; only the super-admin can.
Nobody can delete their own account from the app.

---

## 22. Tips and FAQ

**I forgot my password — what now?**
Use **Forgot password?** on the login screen. Open the emailed link in the same browser you want to
reset from, then set the new password twice. If the link says it is invalid, it has expired or has
already been used; request a fresh one.

**Why can I not see the Settings entry in the sidebar?**
Settings is for admins and the CEO. Standard members do not see it, and going to the address
directly shows Access Denied.

**Why is there a padlock on a team member's card?**
You are not allowed to administer that account. Standard members see a padlock on everyone else's
card; admins and the CEO see one on the two protected accounts.

**Why can I not edit my own name?**
Standard members can only change their own email and password. Anything else on the profile —
name, job title, phone, bio, skills — has to be changed by an admin or the CEO.

**Why is the Add Team Member button missing?**
Only admins and the CEO can create accounts. There is no self-signup either — ask an admin to
create the account for you.

**Someone is locked out. How do I let them back in?**
Open the Team page as an admin or the CEO, find their card, and press **Unlock**.

**A member says the app kicked them out to a "Access Has Expired" screen.**
Their subscription lapsed. An admin can open their card on the Team page and set **Subscription
Status** to *Active*, or set a **Paid Through Date** in the future.

**Why is the same business listed twice?**
Duplicate detection only warns you when you add a business by hand — it does not run during CSV
import, and you can dismiss the warning with **Create Anyway**. Delete the extra record from its
profile (**⋮ → Delete**).

**Why is nothing showing on the map?**
Companies need coordinates. Switch to map view and press **Geocode All** to look them up from City
and State. A company with neither a city nor a state cannot be placed.

**Why did my AI suggestion disappear?**
Relationship briefs, contact briefs, acquisition strategies, coach conversations and weekly
summaries are generated on the spot and are not saved. Copy anything you want to keep — the weekly
summary has a copy button, and you can paste a brief into a business's notes or an interaction log.

**The Synergy Scanner is not finding anything useful.**
It works from the **Needs** and **Offers** fields. Fill those in for each company (Improve with AI
can help), and note that it only looks at the first 20 businesses in your list per run.

**I made a mistake in an interaction / a task / a finance entry.**
Interactions cannot be edited or deleted. Tasks and finance entries cannot be edited, but they can
be deleted and re-created.

**Can URME send the email in a template?**
No. Templates fill in the wording for you; copy the finished text into your own email client to send it.

**Can I un-archive a Sync Hub thread, or un-link a business from an event?**
Not from the app. Both are one-way today.

**Where do the numbers on the Dashboard come from?**
Everything is computed live from your businesses, tasks, events and matches. Nothing on the
Dashboard needs a refresh button — it updates as you work.

---

## 23. Things that are limited or missing today

Recorded here so nobody hunts for a button that does not exist.

- **No editing after the fact** for interactions (no edit, no delete), tasks (status and delete
  only) or finance entries (mark paid and delete only).
- **Roles cannot be changed in the app.** The Add Team Member form always creates a standard member,
  and there is no role dropdown anywhere.
- **One-way actions:** archiving a Sync Hub thread, and linking a business to an event, cannot be
  reversed from the interface.
- **Events have no attendee picker.** Businesses are attached from the business profile only.
- **"Add to Google Calendar"** uses a placeholder one-hour slot rather than the time typed on the
  event, so adjust the time in Google Calendar.
- **Template use counts always read "Used 0x".** Applying a template does not increase the counter.
- **Browser notifications only work while the app is open**, and are configured per browser.
- **The revenue goal on Reports is stored in your browser**, not shared with the team, and resets
  if you clear your browser data.
- **Task XP is a team-wide total** (10 points per completed task) with no per-person score and
  nothing attached to it.
- **Global search opens the Tasks page** for a task result rather than that specific task.
- **The contact filter chips on the Contacts page cover the first 15 companies only.** Use the
  search box for anything beyond that.
- **Idea permissions are open:** anyone can edit or delete anyone's idea.
- **CSV import creates businesses only** — contacts, tasks and finance entries have no importer.
- **The Acquisition Strategy page regenerates every time you open it**, which uses an AI call each
  visit even if you only wanted to re-read the previous plan.

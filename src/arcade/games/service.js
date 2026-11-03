// Service Cloud games for the Syntacks Arcade (format: src/arcade/format.js).
export default {
  id: 'service',
  title: 'Service Cloud',
  icon: '🎧',
  blurb: 'Cases, routing, SLAs and service agents: run the help desk without dropping a ticket.',
  games: [
    {
      id: 'service-case-journey',
      title: 'Case journey',
      blurb: 'Put a support case’s life in the right order.',
      type: 'order',
      level: 1,
      rounds: [
        {
          q: 'A customer emails support. Put what happens in Salesforce in order.',
          items: ['Email-to-Case creates the case', 'Auto-response rule sends a receipt', 'Omni-Channel routes it to an agent', 'Agent solves it with a Knowledge article', 'Case is closed and a survey goes out'],
          why: 'The case exists first, the customer is acknowledged straight away, then routing, work and closure follow.',
        },
        {
          q: 'A visitor fills in the contact form on the website. Put the steps in order.',
          items: ['Visitor submits the support form', 'Web-to-Case creates the case', 'Assignment rule sets the Billing queue as owner', 'An agent from the Billing queue takes the case', 'Agent replies and closes the case'],
          why: 'Web-to-Case turns the form into a case, the assignment rule picks the owner, and only then can a queue member work it.',
        },
        {
          q: 'A high-priority case is ignored for too long. Put the escalation in order.',
          items: ['High-priority case is created', 'Case stays open past the escalation rule’s age', 'Escalation action reassigns it to the Tier 2 queue', 'A Tier 2 agent picks it up'],
          why: 'Escalation rules watch open cases over time; once the age is passed, the action reassigns or notifies so someone senior steps in.',
        },
        {
          q: 'A customer opens the chat on the help site. Put the bot-to-human handoff in order.',
          items: ['Customer starts a messaging conversation', 'Service agent bot greets them and picks a topic', 'Bot can’t solve it and triggers a handoff', 'Omni-Channel routes the conversation to a human', 'Human agent accepts and reads the transcript'],
          why: 'The bot handles the first contact; when it escalates, Omni-Channel finds a free human who sees the whole conversation so far.',
        },
      ],
    },
    {
      id: 'service-help-desk-101',
      title: 'Help desk 101',
      blurb: 'Warm-up quiz on how cases are born and handled.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'Which feature turns emails sent to your support address into cases?',
          options: ['Web-to-Case', 'Email-to-Case', 'Auto-response rules', 'Escalation rules'],
          answer: 1,
          why: 'Email-to-Case reads emails sent to your routing address and creates a case from each one, keeping the thread on the case.',
        },
        {
          q: 'Why is On-Demand Email-to-Case the usual choice?',
          options: ['It only works with one email provider', 'It creates leads instead of cases', 'It runs inside Salesforce, no email agent to install behind your firewall', 'It processes the inbox once a day'],
          answer: 2,
          why: 'On-Demand Email-to-Case uses Salesforce email services, so you just forward your support mailbox to a Salesforce address.',
        },
        {
          q: 'How many cases can Web-to-Case create in 24 hours?',
          options: ['5,000', '500', '50,000', 'No limit'],
          answer: 0,
          why: 'Web-to-Case captures up to 5,000 cases per 24 hours; extra submissions are queued and processed later.',
        },
        {
          q: 'A new case matches three entries of the active auto-response rule. Which one sends the reply?',
          options: ['All three', 'The last matching entry', 'None, an agent has to approve it', 'Only the first matching entry'],
          answer: 3,
          why: 'Rule entries are evaluated top to bottom and the first match wins, so put the most specific entries at the top.',
        },
        {
          q: 'A customer finds the answer in your Experience Cloud help centre and never opens a case. What is that called?',
          options: ['Case escalation', 'Case deflection', 'Case merge', 'Case assignment'],
          answer: 1,
          why: 'Self-service that stops a case from ever being created is case deflection, and it is the cheapest ticket you will ever handle.',
        },
        {
          q: 'A customer opened the same problem three times. How many cases can you merge in one go?',
          options: ['Two', 'Five', 'Up to three', 'Ten'],
          answer: 2,
          why: 'Case merge combines up to three cases into one master case, so the history ends up in a single place.',
        },
      ],
    },
    {
      id: 'service-tool-belt',
      title: 'Agent tool belt',
      blurb: 'Macro, Quick Text or Knowledge? Grab the right tool.',
      type: 'sort',
      level: 1,
      buckets: ['Macro', 'Quick Text', 'Knowledge article'],
      rounds: [
        {
          text: 'One click sets Status to Waiting on Customer, inserts an email template and sends it',
          bucket: 0,
          why: 'Macros chain several actions on a record, like updating fields and sending an email, into one click.',
        },
        {
          text: 'A saved greeting the agent drops into a messaging reply',
          bucket: 1,
          why: 'Quick Text is a reusable snippet of text for emails, chats and messages, not a series of actions.',
        },
        {
          text: 'A step-by-step troubleshooting guide customers can find on the help site',
          bucket: 2,
          why: 'Knowledge articles hold reusable answers that agents and customers can search.',
        },
        {
          text: 'Moves through draft, published and archived versions',
          bucket: 2,
          why: 'Knowledge articles are versioned: you edit a draft while the published version stays live.',
        },
        {
          text: 'Typed in with ;; while writing an email reply',
          bucket: 1,
          why: 'In Lightning Experience, typing ;; in a supported field opens Quick Text so the agent can insert a snippet.',
        },
        {
          text: 'Runs the same steps on many selected cases at once',
          bucket: 0,
          why: 'Bulk macros apply one macro to a whole batch of cases from a list view.',
        },
        {
          text: 'Filed under a data category like Products > Routers',
          bucket: 2,
          why: 'Data categories classify Knowledge articles and control who can see them.',
        },
        {
          text: 'Flagged as irreversible because it sends an email',
          bucket: 0,
          why: 'A macro that sends an email can’t be undone, so Salesforce marks it irreversible to warn the agent.',
        },
      ],
    },
    {
      id: 'service-name-that-feature',
      title: 'Name that feature',
      blurb: 'Link each Service Cloud feature to its job.',
      type: 'match',
      level: 1,
      rounds: [
        {
          q: 'Match the intake channel to what it does.',
          pairs: [
            ['Email-to-Case', 'Turns emails to the support address into cases'],
            ['Web-to-Case', 'Turns a website form into cases'],
            ['Messaging', 'Chats from your site, your app or messaging apps'],
            ['Service Cloud Voice', 'Phone calls with a live transcript in the console'],
          ],
        },
        {
          q: 'Match the rule to its job.',
          pairs: [
            ['Assignment rules', 'Choose the owner of a new case: a user or a queue'],
            ['Auto-response rules', 'Send the customer an automatic first email'],
            ['Escalation rules', 'Reassign or notify when a case stays open too long'],
            ['Entitlement process', 'Time the SLA steps, like first response'],
          ],
        },
        {
          q: 'Match the console piece to what it gives the agent.',
          pairs: [
            ['Service Console', 'Workspace tabs and subtabs for many cases at once'],
            ['Utility bar', 'Footer with always-on tools like History and Macros'],
            ['Omni-Channel widget', 'Set presence status and accept incoming work'],
            ['Knowledge component', 'Suggested articles next to the open case'],
          ],
        },
      ],
    },
    {
      id: 'service-routing-raid',
      title: 'Routing raid',
      blurb: 'Push the right work to the right agent with Omni-Channel.',
      type: 'quiz',
      level: 2,
      rounds: [
        {
          q: 'An assignment rule already puts new cases in the Support queue. What does Omni-Channel add?',
          options: ['It pushes work from the queue to an available agent with free capacity', 'It sends the customer a receipt', 'It replaces the queue with a public group', 'It closes cases that have no owner'],
          answer: 0,
          why: 'Assignment rules only pick an owner; Omni-Channel then pushes each item to an agent who is online and has room for it.',
        },
        {
          q: 'What limits how much work Omni-Channel gives an agent at the same time?',
          options: ['The role hierarchy', 'The number of queues they belong to', 'The case priority', 'The capacity in their presence configuration'],
          answer: 3,
          why: 'Each work item uses units of capacity; Omni-Channel stops pushing once the agent’s capacity is full.',
        },
        {
          q: 'A Dutch-speaking customer needs help with Product X. Which routing finds the agent who speaks Dutch and knows Product X?',
          options: ['Queue-based routing', 'Skills-based routing', 'Round-robin assignment rule', 'Escalation rule'],
          answer: 1,
          why: 'Skills-based routing matches the skills a work item needs to agents who have them, instead of just picking any queue member.',
        },
        {
          q: 'An agent is logged in to Omni-Channel with a presence status linked to no service channel. What happens?',
          options: ['They get every channel’s work', 'They get only cases', 'They receive no routed work', 'They are logged out'],
          answer: 2,
          why: 'Presence statuses decide which service channels an agent is available for; with no channels linked, nothing is pushed to them.',
        },
        {
          q: 'Two queues have routing priority 1 and 2. Which queue’s work is routed first?',
          options: ['Priority 2', 'Priority 1', 'Whichever has more items', 'They alternate one by one'],
          answer: 1,
          why: 'In a routing configuration a lower number means higher priority, so priority 1 work goes out first.',
        },
        {
          q: 'You want routing logic like “if the case is from a VIP, require the Gold skill”. What do you build?',
          options: ['An auto-response rule', 'A validation rule', 'A case team', 'An Omni-Channel flow with the Route Work action'],
          answer: 3,
          why: 'Omni-Channel flows let you check fields and then route to a queue, an agent or by skills with the Route Work action.',
        },
      ],
    },
    {
      id: 'service-sla-boss-fight',
      title: 'SLA boss fight',
      blurb: 'Find the setting that breaks the support promise.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'Agents keep missing First Response. Which line is wrong?',
          code: 'Entitlement process: Gold Support\nApplies to: Case\nMilestone: First Response\n  Minutes to complete: 60\n  Criteria: Priority = High\n  Warning action: email agent 15 min after target\n  Violation action: alert support manager\n  Success action: update a case field',
          bug: 5,
          why: 'Warning actions are meant to fire before the target time, while the agent can still make it. After the target the milestone is already violated.',
        },
        {
          q: 'This case shows no milestones at all. Why?',
          code: 'Case: 00001042\nAccount: Brightwave Logistics\nContact: Lena Moreau\nEntitlement: (blank)\nExpected process: Gold Support\nMilestones: none',
          bug: 3,
          why: 'The entitlement process comes from the entitlement on the case. No entitlement on the case means no process and no milestone timers.',
        },
        {
          q: 'Cases under this contract never get the phone SLA. Spot the bug.',
          code: 'Service contract: Brightwave Premium\nStart date: 2026-01-01\nEnd date: 2026-12-31\nEntitlement: Phone Support 24/7\nEntitlement start: 2026-01-01\nEntitlement end: 2025-12-31',
          bug: 5,
          why: 'An entitlement that ends before it starts is never active, so cases can’t use it. Match its dates to the contract.',
        },
        {
          q: 'This escalation rule never fires. Which line kills it?',
          code: 'Escalation rule: Overdue High Priority\nActive: true\nEntry criteria: Priority = High AND Status = Closed\nBusiness hours: 24/7 Support\nAge over: 4 hours\nAction: reassign to Tier 2 queue\nNotify: case owner',
          bug: 2,
          why: 'Escalation rules only escalate open cases, so criteria that only match closed cases never trigger. Use Status not equal to Closed.',
        },
        {
          q: 'New Silver entitlements never start any milestones. What’s wrong?',
          code: 'Entitlement: Silver Email Support\nAccount: Northpeak Foods\nType: Email Support\nBusiness hours: Mon–Fri 9–17 CET\nEntitlement process: Silver Support (inactive)\nStart date: 2026-01-01',
          bug: 4,
          why: 'An inactive entitlement process doesn’t run its milestones. Activate the process (or its new version) first.',
        },
        {
          q: 'The promise is “a reply within 1 hour, day or night”, but night cases go hours without an alert. Find the bug.',
          code: 'Entitlement process: Platinum 24/7\nPromise: first reply within 1 hour, any time\nMilestone: First Response\n  Minutes to complete: 60\n  Business hours: Mon–Fri 9–17 CET\n  Violation action: page the on-call lead',
          bug: 4,
          why: 'Milestone clocks only run during the business hours they use. Office hours pause the timer at night and at weekends, so use 24/7 hours.',
        },
      ],
    },
    {
      id: 'service-knowledge-vault',
      title: 'Knowledge vault',
      blurb: 'Crack the vault of Lightning Knowledge.',
      type: 'quiz',
      level: 2,
      rounds: [
        {
          q: 'You edit a published article. What happens to the live version?',
          options: ['It disappears until you publish again', 'It stays live while you work on a new draft version', 'It is archived straight away', 'It is overwritten as you type'],
          answer: 1,
          why: 'Editing creates a draft version; customers keep seeing the published one until the draft is published.',
        },
        {
          q: 'What are data categories for?',
          options: ['Classifying articles and controlling who can see them', 'Translating articles automatically', 'Counting article views', 'Routing cases to agents'],
          answer: 0,
          why: 'Data categories group articles (like Products > Routers) and their visibility settings decide which users see which categories.',
        },
        {
          q: 'Which channel makes an article visible to logged-in customers on your Experience Cloud site?',
          options: ['Internal App', 'Partner', 'Customer', 'Public Knowledge Base'],
          answer: 2,
          why: 'The Customer channel is for customer users of your site; Public Knowledge Base is for guests, Internal App for your own staff.',
        },
        {
          q: 'In Lightning Knowledge, how do you offer different article formats like FAQ and How-to?',
          options: ['A separate custom object per format', 'Different data categories', 'Different channels', 'Record types on the Knowledge object'],
          answer: 3,
          why: 'Lightning Knowledge stores every article on one Knowledge object; record types give each format its own fields and layout.',
        },
        {
          q: 'An agent needs to write and publish articles. What do they need on their user record?',
          options: ['The Knowledge User checkbox', 'The Marketing User checkbox', 'A Service Cloud Voice license', 'Membership of a case team'],
          answer: 0,
          why: 'Authoring articles needs the Knowledge User feature license, plus permissions to create, edit and publish.',
        },
        {
          q: 'Which of these is NOT a publication status of a Knowledge article?',
          options: ['Draft', 'Published', 'Archived', 'Escalated'],
          answer: 3,
          why: 'Articles move from Draft to Published to Archived; escalation is something that happens to cases, not articles.',
        },
      ],
    },
    {
      id: 'service-field-ops',
      title: 'Field ops',
      blurb: 'Send a technician out with Field Service, step by step.',
      type: 'order',
      level: 2,
      rounds: [
        {
          q: 'A customer’s boiler is broken and needs a visit. Put the Field Service steps in order.',
          items: ['Agent logs a case for the broken boiler', 'A work order is created from the case', 'A service appointment is created for the work order', 'Dispatcher schedules a technician from the territory', 'Technician completes the job in the mobile app'],
          why: 'The work order describes the job, the service appointment is the visit, and only a scheduled appointment can be done in the field.',
        },
        {
          q: 'Set up a brand-new region for Field Service. Put the steps in order.',
          items: ['Create the operating hours', 'Create the service territory using those hours', 'Add technicians as territory members', 'Schedule an appointment in the territory'],
          why: 'A territory needs operating hours, technicians join a territory as members, and scheduling needs members to choose from.',
        },
        {
          q: 'Put a service appointment’s default statuses in order.',
          items: ['None', 'Scheduled', 'Dispatched', 'In Progress', 'Completed'],
          why: 'The appointment is booked, sent to the technician, worked on site and then completed.',
        },
        {
          q: 'Remote help didn’t fix it. Put the move from desk to field in order.',
          items: ['Agent tries a fix with a Knowledge article', 'Agent creates a work order', 'A service appointment is booked', 'Technician fixes it on site', 'Customer receives a satisfaction survey'],
          why: 'Try the cheap remote fix first, then plan and do the visit, and measure CSAT once the job is done.',
        },
      ],
    },
    {
      id: 'service-config-glitch-hunt',
      title: 'Glitch hunt',
      blurb: 'Expert configs, one hidden glitch each.',
      type: 'bug',
      level: 3,
      rounds: [
        {
          q: 'Belgian cases never reach the Benelux queue. Which entry is to blame?',
          code: 'Case assignment rule: Support Routing (active)\nEntry 1: Priority = Critical -> Tier 2 queue\nEntry 2: Type = Billing -> Billing queue\nEntry 3: (no criteria) -> General queue\nEntry 4: Country = Belgium -> Benelux queue',
          bug: 3,
          why: 'Entries run top to bottom and the first match wins. A catch-all with no criteria in slot 3 swallows everything, so it belongs last.',
        },
        {
          q: 'Agents have a capacity of 5, yet no Tier 1 case is ever pushed to them. Find the bad setting.',
          code: 'Routing configuration: Tier 1 Cases\nRouting priority: 1\nRouting model: Most Available\nUnits of capacity: 6\nQueue: Tier 1 Support',
          bug: 3,
          why: 'Omni-Channel only pushes an item if it fits in the agent’s free capacity. A case worth 6 units never fits in a capacity of 5.',
        },
        {
          q: 'Emails to support@ never turn into cases. Which line breaks it?',
          code: 'Email-to-Case: enabled\nOn-Demand service: enabled\nRouting address: support@brightwave.example\nCase origin: Email\nCase owner: Support queue\nMailbox forwards support@ to: sales@brightwave.example',
          bug: 5,
          why: 'Your mailbox has to forward to the Salesforce email services address generated for the routing address. Forwarding to another inbox never reaches Salesforce.',
        },
        {
          q: 'The service agent can’t tell customers where their order is. Which line breaks it?',
          code: 'Agent: Brightwave Service Agent\nChannel: Messaging for In-App and Web\nTopic: Order Status\n  Scope: say where an order is and when it arrives\n  Action: Reset Password\nTopic: Escalation\n  Action: hand off to a human via Omni-Channel flow',
          bug: 4,
          why: 'An agent can only use the actions assigned to the topic it picked. Order Status needs an order lookup action, not Reset Password.',
        },
        {
          q: 'Agent Rita can’t pick up cases: the right status isn’t even in her list. Why?',
          code: 'Presence status: Available - Cases\nService channels: Case\nPresence configuration: Tier 1 Agents\nCapacity: 5\nRita’s permission set grants: Available - Messaging only',
          bug: 4,
          why: 'Agents can only choose presence statuses granted through their profile or a permission set. Rita needs access to Available - Cases.',
        },
        {
          q: 'Logged-in customers can’t find this article in the help centre. Which line is wrong?',
          code: 'Article: Reset your router\nStatus: Published\nRecord type: How-to\nData category: Products > Routers\nChannels: Internal App, Partner\nAudience: customers on the help centre',
          bug: 4,
          why: 'Customer users only see articles published to the Customer channel. Internal App and Partner don’t cover them.',
        },
      ],
    },
    {
      id: 'service-expert-linkup',
      title: 'Expert linkup',
      blurb: 'Pair up SLA pieces, agent parts and routing models.',
      type: 'match',
      level: 3,
      rounds: [
        {
          q: 'Match the SLA building block to its job.',
          pairs: [
            ['Service contract', 'The customer’s support agreement that groups entitlements'],
            ['Entitlement', 'Which support a customer gets, like phone 24/7'],
            ['Entitlement process', 'The timeline of milestones applied to a case'],
            ['Milestone', 'One required step with a deadline, like First Response'],
          ],
        },
        {
          q: 'Match the Agentforce part to its role.',
          pairs: [
            ['Topic', 'A job the agent can do, with its scope'],
            ['Action', 'What the agent runs: a flow, Apex or a prompt template'],
            ['Instructions', 'Plain-language guidance on how to behave in a topic'],
            ['Escalation', 'Hands the conversation to a human through Omni-Channel'],
          ],
        },
        {
          q: 'Match the routing option to how it picks the agent.',
          pairs: [
            ['Queue-based routing', 'Pushes work to members of the queue'],
            ['Skills-based routing', 'Finds an agent with the skills the work needs'],
            ['Least Active model', 'Picks the agent with the fewest open items'],
            ['Most Available model', 'Picks the agent with the most free capacity'],
          ],
        },
      ],
    },
  ],
}

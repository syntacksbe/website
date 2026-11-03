// Escape rooms for the Syntacks Arcade (format: src/arcade/format.js, type 'escape').
// Each lock is a round of its own type; a wrong answer costs 20 seconds.
export default {
  games: [
    {
      category: 'limits',
      id: 'limits-escape-midnight-load',
      title: 'Midnight data load',
      blurb: 'Locked in the war room until the failing load runs clean.',
      type: 'escape',
      level: 2,
      time: 240,
      story: 'It’s 23:58. The nightly load of 200 cases keeps crashing and the release manager just locked the war room. Four locks stand between you and the exit.',
      rounds: [
        {
          type: 'bug',
          story: 'Lock 1 is a terminal showing the trigger that runs on every case.',
          q: 'Which line makes the load of 200 cases crash?',
          code: `trigger SetTier on Case (before insert) {
  for (Case c : Trigger.new) {
    Account a = [SELECT Tier__c FROM Account WHERE Id = :c.AccountId];
    c.Priority = a.Tier__c == 'Gold' ? 'High' : 'Medium';
  }
}`,
          bug: 2,
          why: 'A query inside the loop runs 200 times, double the limit of 100 SOQL queries. Query all accounts once into a Map before the loop.',
        },
        {
          type: 'quiz',
          story: 'Lock 2 is a keypad. The note says: “the limit you just broke”.',
          q: 'How many SOQL queries can one synchronous transaction run?',
          options: ['50', '100', '150', '200'],
          answer: 1,
          why: 'Synchronous Apex gets 100 SOQL queries per transaction, asynchronous Apex gets 200.',
        },
        {
          type: 'order',
          story: 'Lock 3 has four sliding tiles: the fix, step by step.',
          q: 'Put the bulkified version of the trigger in order.',
          items: [
            'Collect every AccountId from Trigger.new into a Set',
            'Query those accounts once into a Map<Id, Account>',
            'Loop over the cases and read each account from the Map',
            'Set the priority on each case (no DML needed in before insert)',
          ],
          why: 'Collect, query once, then loop over memory. In a before trigger you change Trigger.new directly, so there is no update statement at all.',
        },
        {
          type: 'quiz',
          story: 'The last lock asks how you’d run tomorrow’s 2 million records.',
          q: 'Which async tool fits a nightly job over 2 million records?',
          options: ['@future method', 'Queueable Apex', 'Batch Apex', 'A record-triggered flow'],
          answer: 2,
          why: 'Batch Apex processes records in chunks (200 by default) and each chunk gets fresh governor limits, so millions of records are fine.',
        },
      ],
    },
    {
      category: 'integration',
      id: 'integration-escape-erp-blackout',
      title: 'ERP blackout',
      blurb: 'The order sync is down and the server room door won’t open.',
      type: 'escape',
      level: 2,
      time: 240,
      story: 'Orders stopped flowing to the ERP an hour ago. You walk into the server room to investigate, and the door locks behind you. Four panels light up.',
      rounds: [
        {
          type: 'quiz',
          story: 'Panel 1: a whiteboard with the original brief.',
          q: 'Orders must reach the ERP in near real time, and the ERP goes down for maintenance every night. Which pattern survives that?',
          options: ['Synchronous callout from the trigger', 'Platform Event with retries and a dead-letter queue', 'A nightly batch export', 'An email to the ERP team'],
          answer: 1,
          why: 'Events decouple Salesforce from the ERP: failed deliveries are retried and parked in a dead-letter queue until the ERP is back.',
        },
        {
          type: 'bug',
          story: 'Panel 2 shows the class that sends the orders.',
          q: 'This throws “You have uncommitted work pending”. Which line causes it?',
          code: `public static void send(Order__c o) {
  o.Status__c = 'Sent';
  update o;
  HttpRequest req = new HttpRequest();
  req.setEndpoint('callout:ERP/orders');
  req.setMethod('POST');
  HttpResponse res = new Http().send(req);
}`,
          bug: 2,
          why: 'You can’t make a callout after DML in the same transaction. Do the callout first, or move it to a Queueable that allows callouts.',
        },
        {
          type: 'match',
          story: 'Panel 3: four sockets and four cables.',
          q: 'Match each OAuth flow to when you’d use it.',
          pairs: [
            ['JWT bearer', 'Server-to-server with a certificate, no user present'],
            ['Client credentials', 'A backend system acting as one integration user'],
            ['Web server', 'A user logs in through the browser and approves'],
            ['Refresh token', 'Get a new access token without logging in again'],
          ],
        },
        {
          type: 'order',
          story: 'The exit door asks you to replay the server-to-server login.',
          q: 'Put the JWT bearer flow in order.',
          items: [
            'The ERP builds a JWT with the client ID and user, signed with its private key',
            'It posts the JWT to the Salesforce token endpoint',
            'Salesforce checks the signature with the certificate on the connected app',
            'Salesforce returns an access token',
            'The ERP calls the REST API with that token',
          ],
          why: 'The certificate on the connected app (or external client app) lets Salesforce verify the signed JWT; no password or browser is involved.',
        },
      ],
    },
    {
      category: 'service',
      id: 'service-escape-sla-vault',
      title: 'The SLA vault',
      blurb: 'Crack the vault before the Gold customer’s milestone breaches.',
      type: 'escape',
      level: 1,
      time: 210,
      story: 'A Gold customer’s case is about to breach its first-response milestone, and the case details are sealed in the support vault. Open four locks before the clock runs out.',
      rounds: [
        {
          type: 'order',
          story: 'Lock 1: the case’s journey, scrambled.',
          q: 'A customer emails support. Put what happens in order.',
          items: [
            'Email-to-Case creates the case',
            'An auto-response rule sends a receipt',
            'Omni-Channel routes it to an available agent',
            'The agent solves it with a Knowledge article',
            'The case is closed',
          ],
          why: 'The case exists first, the customer is acknowledged straight away, and then routing, work and closure follow.',
        },
        {
          type: 'quiz',
          story: 'Lock 2: a riddle about who gets the case.',
          q: 'Gold cases must go to agents who speak Dutch and know billing, and only when they have room. What does that?',
          options: ['Case assignment rules', 'Skills-based routing in Omni-Channel', 'Escalation rules', 'A queue with a list view'],
          answer: 1,
          why: 'Skills-based routing matches the case to an agent with the needed skills and respects each agent’s capacity.',
        },
        {
          type: 'bug',
          story: 'Lock 3 shows the entitlement process.',
          q: 'Gold cases keep breaching the first response. Which setting is wrong?',
          code: `Entitlement process: Gold Support
Milestone: First Response
  Minutes to complete: 60
  Criteria: Priority = Low
  Violation action: alert support manager`,
          bug: 3,
          why: 'The milestone only applies to low-priority cases, so the Gold cases never get the 60-minute target. Match the criteria to the cases it should cover.',
        },
        {
          type: 'quiz',
          story: 'The vault door asks one last question.',
          q: 'What moves a case that stays open too long to a manager automatically?',
          options: ['An escalation rule', 'An auto-response rule', 'A macro', 'A case team'],
          answer: 0,
          why: 'Escalation rules reassign or notify when a case meets criteria for too long; macros and case teams don’t act on their own.',
        },
      ],
    },
    {
      category: 'deployment',
      id: 'deployment-escape-friday-release',
      title: 'Friday 17:55',
      blurb: 'Ship the release before the weekend, or stay locked in.',
      type: 'escape',
      level: 3,
      time: 240,
      story: 'Friday, 17:55. The release has to reach production tonight and the office locks at 18:00 sharp. The door panel won’t open until the deployment is right.',
      rounds: [
        {
          type: 'order',
          story: 'Lock 1: the components, in a pile.',
          q: 'Put the components in a deploy order that works.',
          items: [
            'Custom object Invoice__c',
            'Custom field Invoice__c.Amount__c',
            'Apex class InvoiceService',
            'Apex trigger on Invoice__c',
            'Permission set Invoice_User',
          ],
          why: 'Objects before their fields, classes before the triggers that call them, and the permission set last because it references all of them.',
        },
        {
          type: 'quiz',
          story: 'Lock 2: the test level dial.',
          q: 'You deploy Apex to production with the CLI. Which test level runs every test except managed package tests?',
          options: ['NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'],
          answer: 2,
          why: 'RunLocalTests runs all tests in your org except those from installed managed packages, and is the default for production deploys that include Apex.',
        },
        {
          type: 'bug',
          story: 'Lock 3: the manifest on the screen.',
          q: 'The deploy says the field doesn’t exist. Which line is wrong?',
          code: `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Invoice__c</members>
        <name>CustomObject</name>
    </types>
    <types>
        <members>Amount__c</members>
        <name>CustomField</name>
    </types>
    <version>64.0</version>
</Package>`,
          bug: 7,
          why: 'Custom fields are named with their object: Invoice__c.Amount__c. A bare field name points to nothing.',
        },
        {
          type: 'match',
          story: 'The exit: match each environment to its job.',
          q: 'Match the sandbox to the job.',
          pairs: [
            ['Developer', 'Build one feature, no real data'],
            ['Developer Pro', 'Bigger dev or test work with more storage'],
            ['Partial Copy', 'UAT with a sample of production data'],
            ['Full', 'Performance tests and the final rehearsal'],
          ],
        },
      ],
    },
    {
      category: 'datamodel',
      id: 'datamodel-escape-blueprint-vault',
      title: 'The blueprint vault',
      blurb: 'The data model blueprint is in the vault, and the go-live review starts soon.',
      type: 'escape',
      level: 1,
      time: 240,
      story: 'The go-live review starts in four minutes, and the only copy of the data model blueprint sits in the architect’s vault. The architect is on a plane. Four locks, and you have to open them yourself.',
      rounds: [
        {
          type: 'quiz',
          story: 'Lock 1: a sketch of students and courses, with a question mark in the middle.',
          q: 'A student takes many courses and a course has many students. How do you model that?',
          options: ['A lookup from Student to Course', 'A junction object with two master-detail fields', 'A multi-select picklist of courses on Student', 'A roll-up summary on Course'],
          answer: 1,
          why: 'A junction object (say Enrollment__c) with a master-detail to each side gives you many-to-many, and each enrollment can carry its own data, like a grade.',
        },
        {
          type: 'match',
          story: 'Lock 2: five field types, five labels that fell off.',
          q: 'Match each field type to what it does.',
          pairs: [
            ['Lookup', 'Links to a parent, and can be left empty'],
            ['Master-detail', 'The child is deleted with its parent'],
            ['Roll-up summary', 'Sums or counts the child records on the parent'],
            ['Formula', 'Calculated when the record is read, never stored'],
            ['External ID', 'Lets an upsert find records from another system'],
          ],
          why: 'Roll-up summaries live on the master side of a master-detail. An External ID lets an upsert match records without knowing their Salesforce Id.',
        },
        {
          type: 'sort',
          story: 'Lock 3: one card, two slots.',
          buckets: ['Lookup', 'Master-detail'],
          text: 'An object can have at most two of these.',
          bucket: 1,
          why: 'An object can have up to 40 relationship fields, but only 2 of them can be master-detail.',
        },
        {
          type: 'soql',
          story: 'The vault door is a terminal. It only opens for the right query.',
          q: 'Unpaid invoices with the name of their account, biggest first. Show Name, Amount__c and Account__r.Name.',
          object: 'Invoice__c',
          data: [
            { Id: 'a01A', Name: 'INV-1001', Amount__c: 4200, Status__c: 'Paid', Account__c: '001A', Account__r: { Name: 'Brightwave Energy' } },
            { Id: 'a01B', Name: 'INV-1002', Amount__c: 1850, Status__c: 'Unpaid', Account__c: '001B', Account__r: { Name: 'Copperleaf Foods' } },
            { Id: 'a01C', Name: 'INV-1003', Amount__c: 9700, Status__c: 'Unpaid', Account__c: '001C', Account__r: { Name: 'Northgate Logistics' } },
            { Id: 'a01D', Name: 'INV-1004', Amount__c: 640, Status__c: 'Paid', Account__c: '001D', Account__r: { Name: 'Pixel Harbour' } },
            { Id: 'a01E', Name: 'INV-1005', Amount__c: 3100, Status__c: 'Unpaid', Account__c: '001A', Account__r: { Name: 'Brightwave Energy' } },
            { Id: 'a01F', Name: 'INV-1006', Amount__c: 12500, Status__c: 'Draft', Account__c: '001E', Account__r: { Name: 'Atomium Analytics' } },
            { Id: 'a01G', Name: 'INV-1007', Amount__c: 2275, Status__c: 'Unpaid', Account__c: '001F', Account__r: { Name: 'Waffle Works' } },
          ],
          tokens: ['SELECT Name, Amount__c, Account__r.Name', 'FROM Invoice__c', 'WHERE', "Status__c = 'Unpaid'", 'ORDER BY Amount__c DESC', 'SELECT Name, Amount__c, Account__c.Name', 'ORDER BY Amount__c ASC'],
          answer: "SELECT Name, Amount__c, Account__r.Name FROM Invoice__c WHERE Status__c = 'Unpaid' ORDER BY Amount__c DESC",
          why: 'To walk a custom relationship, swap __c for __r: Account__r.Name. Account__c only holds the Id of the parent.',
        },
      ],
    },
    {
      category: 'sales',
      id: 'sales-escape-quarter-close',
      title: 'Last night of the quarter',
      blurb: 'The sales floor is sealed until the pipeline is clean.',
      type: 'escape',
      level: 2,
      time: 270,
      story: 'It’s 23:40 on the last day of the quarter. The forecast call starts at midnight, and the sales VP sealed the floor until every deal is in shape. Four locks between you and the coffee machine outside.',
      rounds: [
        {
          type: 'wire',
          story: 'Lock 1: a switchboard with loose cables.',
          q: 'When a deal is Closed Won, onboarding needs a kick-off task and the account must become a Customer. Wire it.',
          nodes: [
            { id: 'opp', label: 'Opportunity set to Closed Won', icon: '💰', col: 0 },
            { id: 'flow', label: 'Record-triggered flow', icon: '🌊', col: 1 },
            { id: 'scheduled', label: 'Scheduled flow', icon: '⏰', col: 1 },
            { id: 'task', label: 'Kick-off task for onboarding', icon: '✅', col: 2 },
            { id: 'account', label: 'Account Type set to Customer', icon: '🏢', col: 2 },
            { id: 'rule', label: 'Lead assignment rule', icon: '🧭', col: 2 },
          ],
          answer: [['opp', 'flow'], ['flow', 'task'], ['flow', 'account']],
          why: 'An after-save record-triggered flow on Opportunity fires the moment the stage changes, and it can create the task and update the parent account in one go. A scheduled flow would wait for its next run.',
        },
        {
          type: 'quiz',
          story: 'Lock 2: the forecast board, one column blinking.',
          q: 'Which forecast category does a Closed Won opportunity count in?',
          options: ['Pipeline', 'Best Case', 'Commit', 'Closed'],
          answer: 3,
          why: 'Every stage maps to a forecast category, and Closed Won maps to Closed. Commit, Best Case and Pipeline hold the open deals, from most to least sure.',
        },
        {
          type: 'price',
          story: 'Lock 3: a calculator with the last deal of the quarter on it.',
          q: 'The customer signs tonight for 15 seats at a lower sales price, plus 10% off for signing early. What is the total price?',
          product: 'Lumen dashboard seat',
          qty: 15,
          listPrice: 80,
          currency: 'EUR',
          target: 'net-total',
          steps: [
            { label: 'Sales price changed to €72', kind: 'override', value: 72 },
            { label: 'Discount 10%', kind: 'percent', value: 10 },
          ],
          why: 'The discount works on the €72 sales price, not the €80 list price: €64.80 × 15 = €972.',
        },
        {
          type: 'order',
          story: 'The door asks for the road every deal travels.',
          q: 'Put these default opportunity stages in order.',
          items: ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won'],
          why: 'The default Stage picklist runs from Prospecting to Closed Won (a few stages are skipped here), and each stage brings a default probability that rises as the deal moves on.',
        },
      ],
    },
    {
      category: 'cpq',
      id: 'cpq-escape-pricing-room',
      title: 'The pricing room',
      blurb: 'The year’s biggest quote is locked in the pricing room. Get it out by nine.',
      type: 'escape',
      level: 3,
      time: 300,
      story: 'The biggest quote of the year must reach the customer by 09:00, and the CPQ admin went on holiday with the only key to the pricing room. Five locks, all of them CPQ.',
      rounds: [
        {
          type: 'match',
          story: 'Lock 1: five CPQ objects, five sticky notes on the floor.',
          q: 'Match each CPQ object to its job.',
          pairs: [
            ['Product Option', 'Puts a product inside a bundle'],
            ['Product Feature', 'Groups options on the configuration page'],
            ['Discount Schedule', 'Volume tiers: more units, lower price'],
            ['Price Rule', 'Sets field values during quote calculation'],
            ['Product Rule', 'Validates, selects or filters bundle options'],
          ],
          why: 'Options and features shape the bundle, discount schedules handle volume, price rules change prices while the quote calculates, and product rules guard the configuration.',
        },
        {
          type: 'price',
          story: 'Lock 2: the quote line itself, with the net price scratched out.',
          q: 'A partner quotes 60 gateways with a range discount schedule and an extra discount. What is the net total?',
          product: 'Kestrel gateway',
          qty: 60,
          listPrice: 150,
          currency: 'EUR',
          target: 'net-total',
          steps: [
            { label: 'Discount schedule (range)', kind: 'schedule', type: 'range', tiers: [{ from: 1, pct: 0 }, { from: 50, pct: 10 }, { from: 100, pct: 15 }], stage: 'regular' },
            { label: 'Additional discount 4%', kind: 'percent', value: 4, stage: 'customer' },
            { label: 'Partner discount 10%', kind: 'percent', value: 10, stage: 'partner' },
          ],
          why: '60 units sit in the 50–99 tier, so every unit gets 10%: €135 regular. Additional 4% gives €129.60 customer, partner 10% gives €116.64 net; × 60 = €6,998.40.',
        },
        {
          type: 'bug',
          story: 'Lock 3: the price rule behind the partner discount.',
          q: 'Every quote with a partner now gets the Gold discount, even for Silver accounts. Which line is wrong?',
          code: `Price rule: Gold partner discount
  Active: true
  Evaluation event: On Calculate
  Conditions met: Any
  Condition 1: Account tier equals Gold
  Condition 2: Partner is not blank
  Action: set Partner Discount to 10`,
          bug: 3,
          why: 'With Any, one true condition is enough, so every partner quote gets the discount. All makes the rule fire only when both conditions are true.',
        },
        {
          type: 'conveyor',
          story: 'Lock 4: the fixed rule has to reach production. A belt starts rolling.',
          q: 'Ship a price rule that adds a discount on big seat orders.',
          time: 30,
          items: [
            { name: 'Seat Total', kind: 'SummaryVariable', needs: [] },
            { name: 'Rule: Volume discount', kind: 'PriceRule', needs: [] },
            { name: 'Condition: Seat Total ≥ 100', kind: 'PriceCondition', needs: ['Rule: Volume discount', 'Seat Total'] },
            { name: 'Action: Additional Disc. 5%', kind: 'PriceAction', needs: ['Rule: Volume discount'] },
          ],
          why: 'Price conditions and price actions are children of their price rule, and the condition tests the summary variable, so the rule and the variable ship first.',
        },
        {
          type: 'quiz',
          story: 'The door asks one last question about next year.',
          q: 'Mid-term, the customer adds seats with an amendment. How does CPQ price the new subscription?',
          options: ['The full annual price', 'Prorated to the time left on the contract', 'Free until the renewal', 'On a new, separate contract'],
          answer: 1,
          why: 'Amendments co-term with the original contract: CPQ prorates the new subscription from its start date to the contract end date.',
        },
      ],
    },
    {
      category: 'limits',
      id: 'limits-escape-stuck-lift',
      title: 'Stuck in the lift',
      blurb: 'A CPU timeout froze the org, and the office lift with it.',
      type: 'escape',
      level: 2,
      time: 270,
      story: 'Monday, 07:00. The ERP sync froze the org with a CPU timeout, and the office lift checks badges through that same org. It stopped between floors 3 and 4, with you inside. Four panels, one timer.',
      rounds: [
        {
          type: 'log',
          story: 'Panel 1: the lift’s little screen scrolls a debug log.',
          q: 'The ERP sync updates 200 accounts and dies with “Apex CPU time limit exceeded”. Pin the evidence and name the culprit.',
          log: `61.0 APEX_CODE,DEBUG;APEX_PROFILING,INFO;DB,INFO;SYSTEM,DEBUG
07:00:02.001 (1204411)|EXECUTION_STARTED
07:00:02.001 (1220873)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Cd3E|AccountTrigger on Account trigger event AfterUpdate|__sfdc_trigger/AccountTrigger
07:00:02.003 (3411202)|USER_DEBUG|[3]|DEBUG|Accounts in this chunk: 200
07:00:02.006 (6120554)|SOQL_EXECUTE_BEGIN|[5]|Aggregations:0|SELECT Id, AccountId, MailingCity FROM Contact WHERE AccountId IN :tmpVar1
07:00:02.041 (41337120)|SOQL_EXECUTE_END|[5]|Rows:9800
07:00:02.043 (43870002)|HEAP_ALLOCATE|[5]|Bytes:1960000
07:00:02.044 (44002118)|USER_DEBUG|[8]|DEBUG|Matching contacts to accounts
07:00:02.044 (44117350)|STATEMENT_EXECUTE|[9]
07:00:02.044 (44120871)|STATEMENT_EXECUTE|[10]
07:00:02.044 (44123006)|STATEMENT_EXECUTE|[11]
07:00:02.044 (44125118)|STATEMENT_EXECUTE|[10]
07:00:02.044 (44127260)|STATEMENT_EXECUTE|[11]
07:00:05.512 (3512004417)|USER_DEBUG|[13]|DEBUG|Account 61 of 200, inner loop passes so far: 597800
07:00:12.004 (10004118220)|EXCEPTION_THROWN|[11]|System.LimitException: Apex CPU time limit exceeded
07:00:12.004 (10004331087)|FATAL_ERROR|System.LimitException: Apex CPU time limit exceeded
Trigger.AccountTrigger: line 11, column 1
07:00:12.005 (10005002118)|CUMULATIVE_LIMIT_USAGE
07:00:12.005 (10005002118)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of query rows: 9800 out of 50000
  Number of DML statements: 0 out of 150
  Maximum CPU time: 10016 out of 10000 ******* CLOSE TO LIMIT
  Maximum heap size: 2104331 out of 6000000
07:00:12.005 (10005117260)|CUMULATIVE_LIMIT_USAGE_END
07:00:12.006 (10006220415)|CODE_UNIT_FINISHED|AccountTrigger on Account trigger event AfterUpdate
07:00:12.006 (10006356001)|EXECUTION_FINISHED`,
          clues: [13, 22],
          suspects: [
            'The Contact query on line 5, returning 9,800 rows',
            'A nested loop: every account walks through all 9,800 contacts',
            'The heap filling up with contacts',
            'A DML statement inside the loop',
          ],
          answer: 1,
          why: '61 accounts in, the inner loop has already run almost 600,000 times, and 200 accounts would need close to 2 million passes. Group the contacts in a Map<Id, List<Contact>> by AccountId first, so each account only reads its own.',
        },
        {
          type: 'quiz',
          story: 'Panel 2: a dial labelled “CPU”.',
          q: 'How much CPU time does one synchronous Apex transaction get?',
          options: ['5 seconds', '10 seconds', '60 seconds', '2 minutes'],
          answer: 1,
          why: 'Synchronous Apex gets 10,000 ms of CPU time, asynchronous Apex 60,000 ms. Time spent waiting on the database or a callout doesn’t count.',
        },
        {
          type: 'bug',
          story: 'Panel 3: the fix someone pushed in a hurry.',
          q: 'The loop is fixed, but now the sync fails with “Too many DML statements: 151”. Which line?',
          code: `List<Contact> toUpdate = new List<Contact>();
for (Contact c : contacts) {
  Account a = accountsById.get(c.AccountId);
  c.MailingCity = a.BillingCity;
  update c;
}`,
          bug: 4,
          why: 'An update inside the loop runs once per contact, and one transaction allows 150 DML statements. Add each contact to toUpdate and run one update after the loop.',
        },
        {
          type: 'order',
          story: 'The last panel: everything that runs when the sync saves a record.',
          q: 'Put these steps of the save order in order.',
          items: [
            'Before-save record-triggered flows',
            'Before triggers',
            'Custom validation rules',
            'After triggers',
            'After-save record-triggered flows',
            'Commit to the database',
          ],
          why: 'Before-save flows and before triggers change the record before it’s validated and saved; after triggers and after-save flows see the saved record. All of it shares one transaction, and one CPU budget, until the commit.',
        },
      ],
    },
    {
      category: 'deployment',
      id: 'deployment-escape-sandbox-refresh',
      title: 'Refreshed by mistake',
      blurb: 'Someone refreshed the UAT sandbox an hour before the demo.',
      type: 'escape',
      level: 1,
      time: 240,
      story: 'An hour before the client demo, someone refreshed the UAT sandbox. Your new booking app is gone from it, the demo room is booked, and the projector won’t switch on until the build is back. Four locks.',
      rounds: [
        {
          type: 'quiz',
          story: 'Lock 1: a sticky note on the projector: “what just happened?”',
          q: 'What does a sandbox refresh do?',
          options: ['Merges production changes into the sandbox', 'Rebuilds the sandbox as a fresh copy of production', 'Copies the sandbox to production', 'Refreshes the data but keeps your metadata'],
          answer: 1,
          why: 'A refresh rebuilds the sandbox from production. Anything that was only built in the sandbox is gone, which is why your work belongs in source control.',
        },
        {
          type: 'conveyor',
          story: 'Lock 2: the build is in Git. Load it back on the belt.',
          q: 'Deploy the booking app to the fresh sandbox.',
          time: 40,
          items: [
            { name: 'Booking__c', kind: 'CustomObject', needs: [] },
            { name: 'Booking__c.Room__c', kind: 'CustomField', needs: ['Booking__c'] },
            { name: 'BookingController', kind: 'ApexClass', needs: ['Booking__c.Room__c'] },
            { name: 'bookingCalendar', kind: 'LightningComponentBundle', needs: ['BookingController'] },
            { name: 'Booking_Record_Page', kind: 'FlexiPage', needs: ['Booking__c', 'bookingCalendar'] },
            { name: 'Booking_User', kind: 'PermissionSet', needs: ['Booking__c.Room__c', 'BookingController'] },
          ],
          why: 'The class reads the field, the component calls the class and the record page places the component, so each crate waits for what it points at. The permission set grants the field and the class.',
        },
        {
          type: 'sort',
          story: 'Lock 3: one card, two slots.',
          buckets: ['Metadata', 'Data'],
          text: 'Custom metadata type records',
          bucket: 0,
          why: 'Custom metadata type records are metadata, so they deploy with the rest of the build. Custom setting records are data and need a data load.',
        },
        {
          type: 'match',
          story: 'The projector asks which command does what.',
          q: 'Match each Salesforce CLI command to its job.',
          pairs: [
            ['sf project deploy start', 'Send your local source to an org'],
            ['sf project retrieve start', 'Pull metadata from an org into your project'],
            ['sf org create sandbox', 'Make a new sandbox from production'],
            ['sf apex run test', 'Run Apex tests in an org'],
            ['sf org login web', 'Log in to an org in the browser'],
          ],
          why: 'The sf CLI groups commands by topic: project for your source, org for the orgs themselves, apex for code.',
        },
      ],
    },
  ],
}

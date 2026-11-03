// Integration games for the Syntacks Arcade (format: src/arcade/format.js).
export default {
  id: 'integration',
  title: 'Integration',
  icon: '🔌',
  blurb: 'APIs, events, OAuth and callouts: get systems talking without dropping a packet.',
  games: [
    {
      id: 'integration-pattern-picker',
      title: 'Pattern picker',
      blurb: 'Choose the right integration pattern for each brief.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'A webshop must show live stock from the ERP while the customer waits on the page. Which pattern?',
          options: ['Nightly batch sync', 'Request and reply', 'Fire and forget', 'Change Data Capture'],
          answer: 1,
          why: 'The user waits for the answer, so it has to be a synchronous request and reply, with a short timeout and a fallback message.',
        },
        {
          q: 'When an Opportunity is Closed Won, the ERP must create an order. Sales reps should not wait for the ERP. Which pattern?',
          options: ['Fire and forget', 'Request and reply', 'Salesforce Connect', 'Nightly batch sync'],
          answer: 0,
          why: 'Nobody needs the answer right away, so Salesforce publishes a message (for example a Platform Event) and moves on. The ERP picks it up when it can.',
        },
        {
          q: 'Every night, two million price list rows arrive from the ERP. Which approach fits?',
          options: ['One REST call per row', 'An Outbound Message per row', 'A Platform Event per row', 'Batch data sync with Bulk API 2.0'],
          answer: 3,
          why: 'Big volumes on a schedule are a batch job. Bulk API 2.0 processes the rows asynchronously and costs a handful of API calls instead of millions.',
        },
        {
          q: 'Support agents need to see invoices that live in the ERP, without copying them into Salesforce. What do you use?',
          options: ['A nightly import into a custom object', 'Change Data Capture', 'Salesforce Connect with external objects', 'Outbound Messages'],
          answer: 2,
          why: 'Salesforce Connect shows external data as external objects and reads it live from the source, so nothing is copied or stored in Salesforce.',
        },
        {
          q: 'Five systems need customer updates from Salesforce, and new ones join every year. What keeps this manageable?',
          options: ['A separate callout from Salesforce to each system', 'A middleware layer or event bus in between', 'A CSV export emailed every night', 'One Outbound Message per system, per field'],
          answer: 1,
          why: 'Point-to-point turns five systems into a tangle of links. With middleware or events, Salesforce publishes once and each new system just subscribes.',
        },
        {
          q: 'The ERP must hear about every create, update, delete and undelete on Account, with no custom Apex. Which feature?',
          options: ['Change Data Capture', 'Apex trigger with callouts', 'Scheduled report', 'Remote Site Settings'],
          answer: 0,
          why: 'Enable Account for Change Data Capture and Salesforce publishes a change event for each of those operations automatically.',
        },
      ],
    },
    {
      id: 'integration-api-arsenal',
      title: 'API arsenal',
      blurb: 'Pair every integration tool with the job it was built for.',
      type: 'match',
      level: 1,
      rounds: [
        {
          q: 'Match the API to the job.',
          pairs: [
            ['REST API', 'Create one record from a mobile app with JSON'],
            ['SOAP API', 'Strongly typed WSDL contract for an enterprise tool'],
            ['Bulk API 2.0', 'Load five million rows asynchronously'],
            ['Composite API', 'Up to 25 subrequests in one call, later ones using earlier results'],
          ],
        },
        {
          q: 'Match the event tool to what it does.',
          pairs: [
            ['Platform Event', 'A custom event message you design and publish'],
            ['Change Data Capture', 'Automatic events when records change'],
            ['Pub/Sub API', 'gRPC API to publish and subscribe to events'],
            ['Outbound Message', 'SOAP XML notification to a fixed endpoint, no code'],
          ],
        },
        {
          q: 'Match the callout setting to its role.',
          pairs: [
            ['Named Credential', 'Endpoint URL referenced as callout:Name'],
            ['External Credential', 'Auth protocol and principals behind a Named Credential'],
            ['Remote Site Setting', 'Needed when Apex calls a raw https URL'],
            ['Database.AllowsCallouts', 'Lets a Queueable or Batch Apex class call out'],
          ],
        },
      ],
    },
    {
      id: 'integration-sync-or-async',
      title: 'Sync or async?',
      blurb: 'Drop each scenario into the pattern that fits it.',
      type: 'sort',
      level: 1,
      buckets: ['Request and reply', 'Fire and forget', 'Batch data sync'],
      rounds: [
        {
          text: 'Validate an address while the user fills in the form',
          bucket: 0,
          why: 'The user is waiting for a yes or no before going on, so the call is synchronous.',
        },
        {
          text: 'Check the credit limit before an order can be saved',
          bucket: 0,
          why: 'The save depends on the answer, so Salesforce has to ask and wait for the reply.',
        },
        {
          text: 'Show live parcel tracking on a Case page',
          bucket: 0,
          why: 'The data is fetched live when the agent opens the page: a classic request and reply.',
        },
        {
          text: 'Tell the warehouse an order was placed; no answer needed',
          bucket: 1,
          why: 'Salesforce only needs to drop off the message. The warehouse handles it on its own time.',
        },
        {
          text: 'Publish a Platform Event when a Case is escalated',
          bucket: 1,
          why: 'Publishing an event returns right away; subscribers react later, without blocking the user.',
        },
        {
          text: 'Send an Outbound Message when an Account becomes a customer',
          bucket: 1,
          why: 'Outbound Messages are queued and delivered asynchronously, with automatic retries.',
        },
        {
          text: 'Load last month\'s three million ERP invoices with Bulk API 2.0',
          bucket: 2,
          why: 'Large volumes moved in one go are a batch job, and Bulk API 2.0 is built for exactly that.',
        },
        {
          text: 'Nightly ETL job that copies product prices into Salesforce',
          bucket: 2,
          why: 'A scheduled bulk copy that runs while nobody is waiting is batch data sync.',
        },
      ],
    },
    {
      id: 'integration-upsert-or-bust',
      title: 'Upsert or bust',
      blurb: 'External IDs, idempotency and the API meter.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'After a timeout, the ERP sends the same customer twice. How do you avoid a duplicate Account?',
          options: ['Insert, then clean up with a duplicate rule', 'Ask the ERP to never retry', 'Upsert on an External ID field', 'Query by Account Name first'],
          answer: 2,
          why: 'Upsert matches on the External ID: the first call creates the Account, the replay just updates the same one.',
        },
        {
          q: 'A REST upsert by External ID finds no matching record. What status code comes back?',
          options: ['404 Not Found', '201 Created', '300 Multiple Choices', '400 Bad Request'],
          answer: 1,
          why: 'No match means Salesforce creates the record and answers 201 Created, with the new record Id in the body.',
        },
        {
          q: 'Which External ID field setting makes upsert safe?',
          options: ['Unique', 'Required', 'Encrypted', 'Case sensitive'],
          answer: 0,
          why: 'Unique guarantees at most one match. Without it, two records with the same value make the upsert fail.',
        },
        {
          q: 'What does it mean when an API call is idempotent?',
          options: ['It is always fast', 'Sending it twice has the same effect as sending it once', 'It never counts against API limits', 'It can only read data'],
          answer: 1,
          why: 'Idempotent calls are safe to retry. That is why upsert with an External ID beats a plain insert in any integration with retries.',
        },
        {
          q: 'Where can an admin check how many API requests the org used in the last 24 hours?',
          options: ['Debug logs', 'Login History', 'Sharing Settings', 'Company Information in Setup'],
          answer: 3,
          why: 'Company Information shows API Requests, Last 24 Hours. Integrations can read the same numbers from the REST /limits resource.',
        },
        {
          q: 'Which of these counts against the daily API request allocation?',
          options: ['An Apex callout from Salesforce to the ERP', 'A Flow updating a record', 'A REST query sent by the ERP to Salesforce', 'A user saving a record in Lightning'],
          answer: 2,
          why: 'The allocation counts calls coming into the Salesforce APIs. Outbound Apex callouts have their own per-transaction limits instead.',
        },
      ],
    },
    {
      id: 'integration-callout-crash',
      title: 'Callout crash',
      blurb: 'Find the line that makes each Apex callout blow up.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'This throws "You have uncommitted work pending". Which line causes it?',
          code: `public with sharing class OrderSync {
    public static void send(Order__c o) {
        o.Status__c = 'Sent';
        update o;
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP/orders');
        req.setMethod('POST');
        req.setBody(JSON.serialize(o));
        HttpResponse res = new Http().send(req);
    }
}`,
          bug: 3,
          why: 'DML before a callout in the same transaction is not allowed. Make the callout first, or move it to a Queueable.',
        },
        {
          q: 'The endpoint uses a Named Credential. Which line should not be there?',
          code: `HttpRequest req = new HttpRequest();
req.setEndpoint('callout:ERP_Stock/stock');
req.setMethod('GET');
req.setHeader('Authorization', 'Bearer eyJhbGciOiJSUzI1NiJ9.hardcoded');
req.setTimeout(10000);
HttpResponse res = new Http().send(req);`,
          bug: 3,
          why: 'The Named Credential and its External Credential add the auth header for you. A hardcoded token leaks into the repo and breaks when it expires.',
        },
        {
          q: 'The ERP is slow, so someone raised the timeout. Which line fails?',
          code: `HttpRequest req = new HttpRequest();
req.setEndpoint('callout:ERP/invoices');
req.setMethod('GET');
req.setTimeout(180000);
HttpResponse res = new Http().send(req);`,
          bug: 3,
          why: 'A callout timeout can be at most 120,000 ms (two minutes). For slower work, let the ERP answer later with a callback or an event.',
        },
        {
          q: 'This future method throws a CalloutException. Which line is wrong?',
          code: `public class StockSync {
    @future
    public static void push(Set<Id> productIds) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP/stock');
        req.setMethod('POST');
        req.setBody(JSON.serialize(productIds));
        new Http().send(req);
    }
}`,
          bug: 1,
          why: 'A future method may only call out when it says so: @future(callout=true).',
        },
        {
          q: 'This Queueable is not allowed to call out. Which line needs a fix?',
          code: `public class InvoiceJob implements Queueable {
    private Id invoiceId;
    public InvoiceJob(Id invoiceId) { this.invoiceId = invoiceId; }
    public void execute(QueueableContext ctx) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:ERP/invoices/' + invoiceId);
        req.setMethod('GET');
        HttpResponse res = new Http().send(req);
    }
}`,
          bug: 0,
          why: 'Add Database.AllowsCallouts: "implements Queueable, Database.AllowsCallouts".',
        },
        {
          q: 'Fine with 10 Accounts, crashes with 200. Which line is the problem?',
          code: `public static void syncAll(List<Account> accounts) {
    for (Account a : accounts) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:CRM_Hub/accounts');
        req.setMethod('POST');
        req.setBody(JSON.serialize(a));
        new Http().send(req);
    }
}`,
          bug: [1, 6],
          why: 'One callout per record hits the limit of 100 callouts per transaction. Send the records in one request, or split the work over Queueables.',
        },
      ],
    },
    {
      id: 'integration-token-tactics',
      title: 'Token tactics',
      blurb: 'Pick the OAuth flow and app setup for every login quest.',
      type: 'quiz',
      level: 2,
      rounds: [
        {
          q: 'A nightly server job with no user present calls the Salesforce API. You can upload a certificate to the app. Which flow?',
          options: ['Web server flow', 'Username-password flow', 'JWT bearer flow', 'Device flow'],
          answer: 2,
          why: 'The job signs a JWT with its private key and Salesforce checks it against the uploaded certificate. No password, no browser.',
        },
        {
          q: 'A machine gets a token with only a client ID and secret, and always acts as one chosen user. Which flow is that?',
          options: ['Client credentials flow', 'Web server flow', 'Refresh token flow', 'SAML bearer assertion flow'],
          answer: 0,
          why: 'In the client credentials flow you set a Run As user on the app. Every token acts as that user, so give it as few permissions as possible.',
        },
        {
          q: 'A partner portal sends users to log in to Salesforce in their browser, then calls the API on their behalf. Which flow?',
          options: ['JWT bearer flow', 'Client credentials flow', 'Device flow', 'Web server (authorization code) flow'],
          answer: 3,
          why: 'The user logs in and approves, Salesforce returns a code, and the portal\'s server swaps that code for tokens.',
        },
        {
          q: 'The access token expired. How does a web server flow app get a new one without asking the user again?',
          options: ['Send the user through the login page again', 'Use the refresh token at the token endpoint', 'Extend the session timeout in Setup', 'Reuse the authorization code'],
          answer: 1,
          why: 'Authorization codes are single use. The refresh token, granted with the refresh_token scope, gets fresh access tokens.',
        },
        {
          q: 'What is the next generation of Connected Apps for setting up OAuth clients?',
          options: ['Named Credentials', 'Auth Providers', 'External Client Apps', 'Permission Set Groups'],
          answer: 2,
          why: 'External Client Apps replace Connected Apps for new integrations, with settings that can be packaged and kept apart from org-specific policies.',
        },
        {
          q: 'The JWT bearer flow logs in as a user. Which user should that be?',
          options: ['The admin who built the integration', 'A shared login whose password the team knows', 'Any active sales rep', 'A dedicated API-only integration user with only the permissions it needs'],
          answer: 3,
          why: 'If the key leaks, the damage stays within that user\'s permissions, and nobody leaving the company breaks the integration.',
        },
      ],
    },
    {
      id: 'integration-handshake-sequence',
      title: 'Handshake sequence',
      blurb: 'Put the steps of each integration flow in the right order.',
      type: 'order',
      level: 2,
      rounds: [
        {
          q: 'Order the OAuth JWT bearer flow.',
          items: [
            'Upload the certificate to the app in Salesforce',
            'Build the JWT with iss, sub, aud and exp',
            'Sign the JWT with the private key',
            'POST the JWT to the token endpoint',
            'Call the API with the returned access token',
          ],
          why: 'The certificate goes in first so Salesforce can check the signature. Then the client builds, signs and trades the JWT for an access token.',
        },
        {
          q: 'Order the OAuth web server (authorization code) flow.',
          items: [
            'Redirect the user to the authorize endpoint',
            'User logs in and approves access',
            'Salesforce redirects to the callback URL with a code',
            'The app\'s server swaps the code and secret for tokens',
            'Call the API; store the refresh token safely',
          ],
          why: 'The code only travels through the browser. The tokens are fetched server to server, so the client secret never reaches the browser.',
        },
        {
          q: 'Order a safe callout started from a trigger.',
          items: [
            'After-insert trigger collects the record Ids',
            'Trigger enqueues a Queueable with Database.AllowsCallouts',
            'The Queueable runs in its own transaction and calls the ERP',
            'The Queueable writes the ERP order number back to the record',
          ],
          why: 'Triggers cannot call out synchronously, so the callout moves to a Queueable that runs after the record is saved.',
        },
        {
          q: 'Order what happens to a message when the ERP is down.',
          items: [
            'Middleware receives the event',
            'Call to the ERP fails with a 503',
            'Retry with exponential backoff',
            'After the last attempt, park it in the dead-letter queue',
            'Ops fixes the cause and replays the message',
          ],
          why: 'Retries handle short outages; the dead-letter queue keeps what still fails, so no message is lost and it can be replayed later.',
        },
      ],
    },
    {
      id: 'integration-event-sorter',
      title: 'Event sorter',
      blurb: 'Platform Event, Change Data Capture or Outbound Message: sort the clues.',
      type: 'sort',
      level: 2,
      buckets: ['Platform Event', 'Change Data Capture', 'Outbound Message'],
      rounds: [
        {
          text: 'You design the fields yourself, like Order_Number__c',
          bucket: 0,
          why: 'A Platform Event is your own event definition with the fields you choose.',
        },
        {
          text: 'Published from Apex with EventBus.publish()',
          bucket: 0,
          why: 'Apex, Flow and the APIs can all publish Platform Events; EventBus.publish() is the Apex way.',
        },
        {
          text: 'The object API name ends in __e',
          bucket: 0,
          why: 'Platform Event objects get the __e suffix, like Order_Shipped__e.',
        },
        {
          text: 'Fires on its own when a record is created, updated, deleted or undeleted',
          bucket: 1,
          why: 'Change Data Capture publishes these events for every enabled object, without any code.',
        },
        {
          text: 'The event header lists changeType and changedFields',
          bucket: 1,
          why: 'The ChangeEventHeader tells subscribers what happened and which fields changed.',
        },
        {
          text: 'Subscribers listen on channels like /data/AccountChangeEvent',
          bucket: 1,
          why: 'Change events have their own channel per object under /data/.',
        },
        {
          text: 'SOAP XML to one endpoint that must send back an acknowledgement',
          bucket: 2,
          why: 'An Outbound Message counts as delivered only when the endpoint returns an Ack of true.',
        },
        {
          text: 'Retries an unacknowledged message for up to 24 hours',
          bucket: 2,
          why: 'Undelivered Outbound Messages stay in the queue and are retried until they are 24 hours old.',
        },
      ],
    },
    {
      id: 'integration-payload-patrol',
      title: 'Payload patrol',
      blurb: 'Spot the broken line in raw requests and response handling.',
      type: 'bug',
      level: 3,
      rounds: [
        {
          q: 'The Contact should link to the new Account. Which line breaks the link?',
          code: `POST /services/data/v62.0/composite
{
  "allOrNone": true,
  "compositeRequest": [
    { "method": "POST",
      "url": "/services/data/v62.0/sobjects/Account",
      "referenceId": "newAcc",
      "body": { "Name": "Nebula Bikes" } },
    { "method": "POST",
      "url": "/services/data/v62.0/sobjects/Contact",
      "referenceId": "newCon",
      "body": { "LastName": "Vega", "AccountId": "newAcc.id" } }
  ]
}`,
          bug: 11,
          why: 'References to earlier subrequests need the @{...} syntax: "@{newAcc.id}". Without it, "newAcc.id" is sent as a plain string.',
        },
        {
          q: 'This nightly job resends the full ERP customer list. Which line creates duplicates?',
          code: `POST /services/data/v62.0/jobs/ingest
{
  "object": "Account",
  "externalIdFieldName": "ERP_Id__c",
  "contentType": "CSV",
  "operation": "insert",
  "lineEnding": "LF"
}`,
          bug: 5,
          why: 'Insert creates new Accounts on every run. Use "upsert" so the rows match existing records on ERP_Id__c.',
        },
        {
          q: 'The CSV is uploaded, but the Bulk API 2.0 job never starts. Which line is wrong?',
          code: `PUT /services/data/v62.0/jobs/ingest/750XX0000000001/batches
Content-Type: text/csv

ERP_Id__c,Name
C-1001,Nebula Bikes
C-1002,Orbit Coffee

PATCH /services/data/v62.0/jobs/ingest/750XX0000000001
{ "state": "Closed" }`,
          bug: 8,
          why: 'In Bulk API 2.0 you set the state to "UploadComplete" to start processing. "Closed" belongs to the older Bulk API.',
        },
        {
          q: 'This machine-to-machine call should use the client credentials flow. Which line is wrong?',
          code: `POST /services/oauth2/token
Host: nebula.my.salesforce.com
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id=3MVG9EXAMPLE
&client_secret=EXAMPLESECRET`,
          bug: 4,
          why: 'The grant type must be client_credentials. The password grant also needs a username and password, which a machine integration should not have.',
        },
        {
          q: 'This should publish an Order Shipped event. Which line is wrong?',
          code: `POST /services/data/v62.0/sobjects/Order_Shipped__c
Content-Type: application/json

{
  "Order_Number__c": "ORD-4242",
  "Carrier__c": "Comet Freight"
}`,
          bug: 0,
          why: 'Platform Events end in __e. Posting to Order_Shipped__c targets a custom object, so no event is published.',
        },
        {
          q: 'The ERP is flaky. Which line handles an error the wrong way?',
          code: `Integer code = res.getStatusCode();
if (code == 200 || code == 201) {
    markSynced(rec);
} else if (code == 503 || code == 429) {
    scheduleRetry(rec);
} else if (code == 400) {
    scheduleRetry(rec);
} else {
    sendToDeadLetter(rec);
}`,
          bug: 6,
          why: 'A 400 Bad Request fails the same way every time, so retrying only burns calls. Send it to the dead-letter queue and fix the data.',
        },
      ],
    },
    {
      id: 'integration-boss-fight',
      title: 'Architect boss fight',
      blurb: 'Retries, replays and trade-offs for integration veterans.',
      type: 'quiz',
      level: 3,
      rounds: [
        {
          q: 'You must create 300 related records in one round trip, with later records pointing at earlier ones. Which resource?',
          options: ['Composite', 'sObject Collections', 'Composite Graph', 'One REST call per record'],
          answer: 2,
          why: 'Composite stops at 25 subrequests and sObject Collections cannot reference earlier results. A Composite Graph takes up to 500 nodes and rolls back as a unit.',
        },
        {
          q: 'A Pub/Sub API subscriber was down for a day. How does it catch up on the events it missed?',
          options: ['Subscribe again from the last replay ID it stored', 'Ask Salesforce to resend them', 'Query the event object with SOQL', 'Republish every event from Apex'],
          answer: 0,
          why: 'High-volume events are kept for 72 hours. A subscriber that saves its replay ID can resume right where it stopped.',
        },
        {
          q: 'After a redelivery, the ERP gets the same order event twice. What keeps this safe?',
          options: ['Turn off retries everywhere', 'Send events only during office hours', 'Use bigger payloads', 'An idempotent consumer that checks a unique event or order key'],
          answer: 3,
          why: 'Assume at-least-once delivery. If the consumer skips or upserts on a key it has already seen, a duplicate does no harm.',
        },
        {
          q: 'A message still fails after five retries because its data is bad. What next?',
          options: ['Retry it forever', 'Move it to a dead-letter queue and alert someone', 'Delete it quietly', 'Block all other messages until it passes'],
          answer: 1,
          why: 'A dead-letter queue takes the poison message out of the flow so others keep moving, and keeps it for a fix and a replay.',
        },
        {
          q: 'Why add exponential backoff with jitter to retries?',
          options: ['It makes each retry faster', 'It removes API limits', 'It spreads retries out so a recovering system is not flooded', 'It guarantees exactly-once delivery'],
          answer: 2,
          why: 'Waiting longer each time, plus a random offset, stops every client from hammering the server at the same moment it comes back.',
        },
        {
          q: 'Agents view ERP invoices as external objects through Salesforce Connect. What should you watch?',
          options: ['The invoices fill up data storage', 'Every view queries the ERP live, so its speed and uptime matter', 'Only admins can read external objects', 'The data is copied nightly and can be a day old'],
          answer: 1,
          why: 'External objects are not stored in Salesforce. Each page view or query goes to the ERP, so a slow ERP means a slow page.',
        },
      ],
    },
  ],
}

// Governor limits games for the Syntacks Arcade (format: src/arcade/format.js).
export default {
  id: 'limits',
  title: 'Governor limits',
  icon: '⚡',
  blurb: 'Squeeze every query, row and millisecond out of a single transaction.',
  games: [
    {
      id: 'limits-soql-in-loops',
      title: 'Hunt the loop',
      blurb: 'Find the line that blows up when 200 records arrive at once.',
      type: 'bug',
      level: 1,
      rounds: [
        {
          q: 'This trigger works for one record. Which line breaks it at 200?',
          code: `trigger SetTier on Case (before insert) {
  for (Case c : Trigger.new) {
    Account a = [SELECT Tier__c FROM Account WHERE Id = :c.AccountId];
    c.Priority = a.Tier__c == 'Gold' ? 'High' : 'Medium';
  }
}`,
          bug: 2,
          why: 'A query inside the loop runs once per record: 200 cases mean 200 queries, double the limit of 100. Query all accounts once into a Map before the loop.',
        },
        {
          q: 'A data load inserts 200 contacts. Which line hits "Too many DML statements: 151"?',
          code: `trigger LogNewContacts on Contact (after insert) {
  for (Contact c : Trigger.new) {
    Task t = new Task(WhoId = c.Id, Subject = 'Say hello');
    insert t;
  }
}`,
          bug: 3,
          why: 'One insert per contact means 200 DML statements against a limit of 150. Add the tasks to a List and insert it once after the loop.',
        },
        {
          q: 'Bluequay Logistics runs this nightly on 300 opportunities. Which line kills it?',
          code: `public static void closeStale(List<Opportunity> opps) {
  for (Opportunity o : opps) {
    if (o.CloseDate < Date.today()) {
      o.StageName = 'Closed Lost';
      update o;
    }
  }
}`,
          bug: 4,
          why: 'Each update inside the loop is its own DML statement, so 151 stale deals is game over. Collect the changed records and update the list once.',
        },
        {
          q: 'This stamps open case counts on 150 accounts. Which line burns the query budget?',
          code: `public static void countOpenCases(List<Account> accounts) {
  for (Account a : accounts) {
    a.Open_Cases__c = [SELECT COUNT() FROM Case WHERE AccountId = :a.Id AND IsClosed = false];
  }
  update accounts;
}`,
          bug: 2,
          why: 'One COUNT() per account means 150 queries. Run a single aggregate query with WHERE AccountId IN :ids GROUP BY AccountId and read the counts from a Map.',
        },
        {
          q: 'A data load of 200 web leads routes only one of them. Which line is the culprit?',
          code: `trigger RouteWebLeads on Lead (before insert) {
  Group q = [SELECT Id FROM Group WHERE Type = 'Queue' AND DeveloperName = 'Web_Leads' LIMIT 1];
  Lead l = Trigger.new[0];
  if (l.LeadSource == 'Web') {
    l.OwnerId = q.Id;
  }
}`,
          bug: 2,
          why: 'Trigger.new holds up to 200 records per call, and Trigger.new[0] only touches the first. Loop over every record in Trigger.new.',
        },
        {
          q: 'Which line makes this trigger publish one event at a time?',
          code: `trigger AnnounceShipments on Shipment__c (after update) {
  for (Shipment__c s : Trigger.new) {
    if (s.Status__c == 'Delivered') {
      EventBus.publish(new Delivery__e(Shipment_Id__c = s.Id));
    }
  }
}`,
          bug: 3,
          why: 'Every EventBus.publish call counts against a per-transaction limit, and 200 deliveries mean 200 calls. Add the events to a List and publish it once after the loop.',
        },
      ],
    },
    {
      id: 'limits-know-your-caps',
      title: 'Know your caps',
      blurb: 'The governor limit numbers every Apex developer should know by heart.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'How many SOQL queries can a synchronous transaction run?',
          options: ['50', '100', '150', '200'],
          answer: 1,
          why: 'Synchronous Apex gets 100 SOQL queries, async Apex gets 200. Query number 101 throws a LimitException.',
        },
        {
          q: 'How many DML statements can one transaction issue?',
          options: ['10,000', '200', '150', '100'],
          answer: 2,
          why: 'The cap is 150 DML statements, and together they can touch 10,000 records. One insert of a 200-record list is one statement.',
        },
        {
          q: 'How many rows can all SOQL queries in one transaction return in total?',
          options: ['50,000', '10,000', '100,000', '2,000'],
          answer: 0,
          why: 'Every query in the transaction shares one budget of 50,000 rows. Need more? Move to Batch Apex with a QueryLocator.',
        },
        {
          q: 'How much CPU time does a synchronous transaction get?',
          options: ['6 seconds', '60 seconds', '120 seconds', '10 seconds'],
          answer: 3,
          why: 'Sync gets 10,000 ms of CPU, async 60,000 ms. Time spent in the database or waiting on a callout does not count; your loops do.',
        },
        {
          q: 'What is the heap size limit for asynchronous Apex?',
          options: ['6 MB', '12 MB', '24 MB', '3 MB'],
          answer: 1,
          why: 'Async Apex gets 12 MB of heap, sync gets 6 MB. Big lists of records and long strings eat it fast.',
        },
        {
          q: 'How many HTTP callouts can one transaction make?',
          options: ['10', '50', '100', '150'],
          answer: 2,
          why: 'You get 100 callouts per transaction, and all of them together must finish within 120 seconds.',
        },
      ],
    },
    {
      id: 'limits-sync-or-async',
      title: 'Sync or async?',
      blurb: 'Some limits double when you go async, some never move.',
      type: 'sort',
      level: 1,
      buckets: ['Synchronous limit', 'Asynchronous limit', 'Same in both'],
      rounds: [
        { text: '100 SOQL queries', bucket: 0, why: 'Synchronous Apex can run 100 SOQL queries per transaction.' },
        { text: '200 SOQL queries', bucket: 1, why: 'Async Apex (future, Queueable, batch execute) doubles the query budget to 200.' },
        { text: '6 MB heap', bucket: 0, why: 'Synchronous transactions get 6 MB of heap.' },
        { text: '12 MB heap', bucket: 1, why: 'Async transactions get twice the heap: 12 MB.' },
        { text: '10,000 ms CPU time', bucket: 0, why: 'Synchronous Apex gets 10 seconds of CPU time.' },
        { text: '60,000 ms CPU time', bucket: 1, why: 'Async Apex gets 60 seconds of CPU time, six times the sync budget.' },
        { text: '150 DML statements', bucket: 2, why: 'Going async does not buy you more DML: it stays at 150 statements.' },
        { text: '50,000 query rows', bucket: 2, why: 'The 50,000-row cap is the same in sync and async. Only a batch QueryLocator gets past it.' },
      ],
    },
    {
      id: 'limits-read-the-meters',
      title: 'Read the meters',
      blurb: 'Pair Limits methods, error messages and numbers with what they mean.',
      type: 'match',
      level: 1,
      rounds: [
        {
          q: 'Match each Limits method to what it reports.',
          pairs: [
            ['Limits.getQueries()', 'SOQL queries used so far'],
            ['Limits.getDmlStatements()', 'DML statements used so far'],
            ['Limits.getCpuTime()', 'CPU milliseconds used so far'],
            ['Limits.getHeapSize()', 'Heap bytes used so far'],
          ],
        },
        {
          q: 'Match each error to its most likely cause.',
          pairs: [
            ['Too many SOQL queries: 101', 'A query inside a loop over 200 records'],
            ['Too many DML statements: 151', 'An insert inside a loop'],
            ['Apex CPU time limit exceeded', 'Nested loops over thousands of records'],
            ['Too many query rows: 50001', 'Selecting a huge table without a filter'],
          ],
        },
        {
          q: 'Match each limit to its number.',
          pairs: [
            ['Callouts per transaction', '100'],
            ['Total callout time', '120 seconds'],
            ['@future calls per transaction', '50'],
            ['Records processed by DML', '10,000'],
          ],
        },
      ],
    },
    {
      id: 'limits-pick-your-async',
      title: 'Pick your async',
      blurb: 'Future, Queueable, Batch or Scheduled: pick the right tool for the job.',
      type: 'match',
      level: 2,
      rounds: [
        {
          q: 'Match each async tool to the job it fits best.',
          pairs: [
            ['@future', 'A quick fire-and-forget callout from a trigger'],
            ['Queueable', 'A job that takes sObjects and chains a follow-up job'],
            ['Batch Apex', 'Recalculating 3 million records in chunks'],
            ['Scheduled Apex', 'Starting a cleanup every night at 2 am'],
          ],
        },
        {
          q: 'Match each async tool to its trait.',
          pairs: [
            ['@future', 'Static, returns void, primitive parameters only'],
            ['Queueable', 'System.enqueueJob returns a job ID'],
            ['Batch Apex', 'start, execute and finish methods'],
            ['Scheduled Apex', 'Runs on a cron expression via System.schedule'],
          ],
        },
        {
          q: 'Match each annotation or interface to what it unlocks.',
          pairs: [
            ['@future(callout=true)', 'Callouts from a future method'],
            ['Database.AllowsCallouts', 'Callouts from a batch or Queueable job'],
            ['Database.Stateful', 'Member variables kept across batch chunks'],
            ['Schedulable', 'A class System.schedule can run'],
          ],
        },
      ],
    },
    {
      id: 'limits-combo-order',
      title: 'Combo order',
      blurb: 'Chain the moves of bulk code, batch jobs and callouts in the right order.',
      type: 'order',
      level: 2,
      rounds: [
        {
          q: 'Turn a query-per-record trigger into a bulk-safe one. Put the steps in order.',
          items: [
            'Collect the AccountIds from Trigger.new into a Set',
            'Query all those accounts once into a Map<Id, Account>',
            'Loop over Trigger.new and read each account from the Map',
            'Add the changed records to a List',
            'Update the List once, after the loop',
          ],
          why: 'Collect, query once, loop, then one DML: two statements total whether 1 or 200 records come in.',
        },
        {
          q: 'Put the life of a Batch Apex job in order.',
          items: [
            'Database.executeBatch adds the job to the queue',
            'start runs once and returns a QueryLocator',
            'execute runs once per chunk (200 records by default)',
            'finish runs once after the last chunk',
          ],
          why: 'start feeds the records, each execute is its own transaction with fresh limits, and finish is the place to chain or report.',
        },
        {
          q: 'Rank these per-transaction limits from smallest to largest (synchronous).',
          items: [
            'SOSL queries',
            '@future calls',
            'SOQL queries',
            'DML statements',
            'Records processed by DML',
            'Rows returned by SOQL',
          ],
          why: '20 SOSL, 50 @future, 100 SOQL, 150 DML statements, 10,000 DML rows, 50,000 query rows.',
        },
        {
          q: 'Call an API and save the result without hitting "uncommitted work pending". Order the steps.',
          items: [
            'Build the HttpRequest',
            'Send it with Http.send()',
            'Parse the JSON response',
            'Upsert the records with the result',
          ],
          why: 'A callout after DML in the same transaction throws a CalloutException. Do every callout first and save last.',
        },
      ],
    },
    {
      id: 'limits-trap-room',
      title: 'Trap room',
      blurb: 'Recursion, mixed DML and async traps that only bite in production.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'This trigger ends in "maximum trigger depth exceeded". Which line starts the loop?',
          code: `trigger SyncTotals on Opportunity (after update) {
  Set<Id> accIds = new Set<Id>();
  for (Opportunity o : Trigger.new) accIds.add(o.AccountId);
  List<Opportunity> opps = [SELECT Id FROM Opportunity WHERE AccountId IN :accIds];
  for (Opportunity o : opps) o.Last_Synced__c = System.now();
  update opps;
}`,
          bug: 5,
          why: 'Updating opportunities from an opportunity after-update trigger fires the same trigger again, until it dies at depth 16. Guard with a static Set<Id> of processed records, or set fields in before update.',
        },
        {
          q: 'A job updates 400 orders in one update statement, but only 200 get recalculated. Which line skips the rest?',
          code: `public class OrderTriggerHandler {
  private static Boolean hasRun = false;
  public static void afterUpdate(List<Order__c> orders) {
    if (hasRun) return;
    hasRun = true;
    OrderService.recalculate(orders);
  }
}`,
          bug: 3,
          why: '400 records reach the trigger as two chunks of 200 in the same transaction, and the static Boolean blocks the second one. Track processed Ids in a static Set<Id> instead.',
        },
        {
          q: 'This throws MIXED_DML_OPERATION. On which line does it blow up?',
          code: `public static void activatePartner(Account acc, Id userId, Id permSetId) {
  acc.Partner_Status__c = 'Active';
  update acc;
  insert new PermissionSetAssignment(
    AssigneeId = userId,
    PermissionSetId = permSetId
  );
}`,
          bug: 3,
          why: 'Account is a regular object and PermissionSetAssignment a setup object; they cannot both be changed in one transaction. Move the assignment to a @future method or a Queueable.',
        },
        {
          q: 'Which line throws "You have uncommitted work pending"?',
          code: `public static void createAndSync(Shipment__c s) {
  insert s;
  HttpRequest req = new HttpRequest();
  req.setEndpoint('callout:Carrier_API/shipments');
  req.setMethod('POST');
  req.setBody(JSON.serialize(s));
  HttpResponse res = new Http().send(req);
  s.Carrier_Ref__c = res.getBody();
  update s;
}`,
          bug: 6,
          why: 'The insert opened a transaction, so the callout after it fails. Do the callout before any DML, or move it to a Queueable that implements Database.AllowsCallouts.',
        },
        {
          q: 'Which line fails at runtime?',
          code: `public class StockSync {
  @future(callout=true)
  public static void push(Set<Id> productIds) {
    // ... callout to the warehouse ...
    pushPrices(productIds);
  }

  @future(callout=true)
  public static void pushPrices(Set<Id> productIds) {
    // ... second callout ...
  }
}`,
          bug: 4,
          why: 'A future method cannot call another future method. Use a Queueable for the first step and enqueue the second step from it.',
        },
        {
          q: 'This Queueable fails with "Too many queueable jobs added to the queue". Which line?',
          code: `public class ImportJob implements Queueable {
  public void execute(QueueableContext ctx) {
    ImportService.loadOrders();
    System.enqueueJob(new PriceJob());
    System.enqueueJob(new StockJob());
  }
}`,
          bug: 4,
          why: 'A running async job can enqueue only one Queueable (a synchronous transaction can enqueue 50). Chain StockJob from inside PriceJob.',
        },
      ],
    },
    {
      id: 'limits-async-arena',
      title: 'Async arena',
      blurb: 'Choose and tune future, Queueable, Batch and Scheduled jobs.',
      type: 'quiz',
      level: 2,
      rounds: [
        {
          q: 'A trigger must send whole Account records to an external API. Which tool fits best?',
          options: ['@future(callout=true)', 'Queueable with Database.AllowsCallouts', 'A synchronous callout in the trigger', 'Scheduled Apex'],
          answer: 1,
          why: 'Triggers cannot make synchronous callouts, and @future only takes primitives like Ids. A Queueable takes the records as they are and can call out.',
        },
        {
          q: 'What scope size does Database.executeBatch use when you pass none?',
          options: ['2,000', '100', '200', '50'],
          answer: 2,
          why: 'The default is 200 records per execute; with a QueryLocator you can go up to 2,000. Go lower when each record does heavy work or a callout.',
        },
        {
          q: 'What does each execute call of a batch job get?',
          options: ['Fresh governor limits for its chunk', 'Whatever start left over', 'One shared set of limits for the whole job', 'Unlimited CPU time'],
          answer: 0,
          why: 'Every execute is its own transaction with async limits: 200 queries, 60 s CPU, 12 MB heap.',
        },
        {
          q: 'How many Queueable jobs can one synchronous transaction enqueue?',
          options: ['1', '100', '5', '50'],
          answer: 3,
          why: 'A synchronous transaction can enqueue 50 Queueables; a running async job can enqueue only 1.',
        },
        {
          q: 'A running total must survive from one batch chunk to the next. What do you add?',
          options: ['A static variable', 'A @future method', 'Database.Stateful', 'Database.AllowsCallouts'],
          answer: 2,
          why: 'Without Database.Stateful every execute starts with fresh member variables. Static variables reset too, because each chunk is a new transaction.',
        },
        {
          q: 'Your nightly Schedulable needs to call a REST API. What works?',
          options: ['Call Http.send() directly in execute()', 'Enqueue a Queueable with Database.AllowsCallouts from execute()', 'Put @future on the execute() method', 'Raise the callout timeout to 120 s'],
          answer: 1,
          why: 'Scheduled Apex cannot make synchronous callouts. Let execute() start a Queueable or batch job that implements Database.AllowsCallouts.',
        },
      ],
    },
    {
      id: 'limits-index-or-bust',
      title: 'Index or bust',
      blurb: 'Selective queries, indexes and aggregates for large data volumes.',
      type: 'quiz',
      level: 3,
      rounds: [
        {
          q: 'Above how many records does a non-selective query in a trigger throw "Non-selective query against large object type"?',
          options: ['50,000', '100,000', '200,000', '1,000,000'],
          answer: 2,
          why: 'Once an object holds more than 200,000 records, trigger queries must be selective or they fail. Filter on an indexed field that narrows the result.',
        },
        {
          q: 'Which filter can use a standard index?',
          options: ['WHERE CreatedDate = LAST_N_DAYS:7', "WHERE Status__c != 'Closed'", "WHERE Name LIKE '%quay'", 'WHERE Region__c = null'],
          answer: 0,
          why: 'CreatedDate is indexed by default. Negative operators and leading wildcards cannot use an index, and null filters usually cannot either.',
        },
        {
          q: 'Which of these fields is NOT indexed by default?',
          options: ['Id', 'OwnerId', 'A lookup field', 'A picklist field'],
          answer: 3,
          why: 'Id, Name, OwnerId, CreatedDate, SystemModstamp, RecordTypeId, lookups, master-detail, External ID and unique fields are indexed. Other fields need a custom index from Salesforce Support.',
        },
        {
          q: 'With a standard index, a filter is selective when it matches less than what share of the first million records?',
          options: ['30%', '10%', '5%', '50%'],
          answer: 0,
          why: 'Standard index: 30% of the first million and 15% after that, capped at 1 million rows. A custom index needs 10% and 5%, capped at 333,333.',
        },
        {
          q: '80,000 open cases match SELECT COUNT() FROM Case WHERE IsClosed = false. How many query rows does it cost?',
          options: ['80,000', '1', '50,000, then it fails', '0'],
          answer: 1,
          why: 'COUNT() without GROUP BY counts as one query row. Aggregates like SUM or AVG still count every row they read.',
        },
        {
          q: 'A batch must walk 8 million Order__c records. What should start return?',
          options: ['A List from a plain SOQL query', 'An Iterable built from a Map', 'Nothing: query in execute instead', 'Database.getQueryLocator(...)'],
          answer: 3,
          why: 'A QueryLocator can feed a batch up to 50 million records. A plain query in start is still capped at 50,000 rows.',
        },
      ],
    },
    {
      id: 'limits-boss-fight',
      title: 'Boss fight',
      blurb: 'Large data, CPU spikes and batch traps for seasoned limit hunters.',
      type: 'bug',
      level: 3,
      rounds: [
        {
          q: 'Bluequay Logistics has 300,000 contacts with a phone. Which line fails first?',
          code: `public static void scrubPhones() {
  List<Contact> all = [SELECT Id, Phone FROM Contact WHERE Phone != null];
  for (Contact c : all) {
    c.Phone = PhoneUtil.normalize(c.Phone);
  }
  update all;
}`,
          bug: 1,
          why: 'One transaction can retrieve 50,000 rows, so the query dies long before the update. Move this to Batch Apex with a QueryLocator.',
        },
        {
          q: 'With 10,000 invoices and 10,000 orders this hits the CPU limit. Which line is the culprit?',
          code: `public static void linkInvoices(List<Invoice__c> invoices, List<Order__c> orders) {
  for (Invoice__c inv : invoices) {
    for (Order__c o : orders) {
      if (o.Order_Number__c == inv.Order_Number__c) {
        inv.Order__c = o.Id;
      }
    }
  }
}`,
          bug: [1, 2],
          why: 'The nested loop does 100 million comparisons. Build a Map<String, Order__c> keyed by order number once, then do one lookup per invoice.',
        },
        {
          q: 'Contact holds 2 million records. Which line makes this trigger fail as non-selective?',
          code: `trigger FlagDuplicates on Lead (before insert) {
  Set<String> emails = new Set<String>();
  for (Lead l : Trigger.new) emails.add(l.Email);
  Set<String> known = new Set<String>();
  for (Contact c : [SELECT Email FROM Contact WHERE Status__c != 'Archived']) {
    known.add(c.Email);
  }
  for (Lead l : Trigger.new) {
    l.Is_Duplicate__c = known.contains(l.Email);
  }
}`,
          bug: 4,
          why: 'A != filter cannot use an index, so on a large object the trigger query fails (and would blow past 50,000 rows anyway). Filter on the emails you need: WHERE Email IN :emails.',
        },
        {
          q: 'finish always logs a total of 0. Which line needs fixing?',
          code: `public class TotalBatch implements Database.Batchable<sObject> {
  Decimal total = 0;
  public Database.QueryLocator start(Database.BatchableContext bc) {
    return Database.getQueryLocator('SELECT Amount__c FROM Invoice__c');
  }
  public void execute(Database.BatchableContext bc, List<Invoice__c> scope) {
    for (Invoice__c i : scope) total += i.Amount__c;
  }
  public void finish(Database.BatchableContext bc) {
    System.debug('Total: ' + total);
  }
}`,
          bug: 0,
          why: 'Without Database.Stateful each chunk starts from a fresh copy of the class, so total resets. Add Database.Stateful to the implements list.',
        },
        {
          q: 'Each shipment needs one callout. Which line makes every chunk fail?',
          code: `public class CarrierSyncBatch implements Database.Batchable<sObject>, Database.AllowsCallouts {
  public Database.QueryLocator start(Database.BatchableContext bc) {
    return Database.getQueryLocator('SELECT Id, Tracking__c FROM Shipment__c');
  }
  public void execute(Database.BatchableContext bc, List<Shipment__c> scope) {
    for (Shipment__c s : scope) CarrierApi.refresh(s); // one callout each
    update scope;
  }
  public void finish(Database.BatchableContext bc) {}
}
Database.executeBatch(new CarrierSyncBatch(), 500);`,
          bug: 10,
          why: 'A scope of 500 means 500 callouts per execute, but a transaction allows 100. Use a scope of 100 or less, lower if the API is slow, since all callouts share 120 seconds.',
        },
        {
          q: 'The team expects a warning in the log when a limit is hit. Which line will never do that?',
          code: `public static void processAll(List<Account> accounts) {
  try {
    for (Account a : accounts) {
      AccountService.enrich(a);
    }
  } catch (LimitException e) {
    Logger.warn('Hit a limit, skipping the rest');
  }
}`,
          bug: [5, 6],
          why: 'Governor limit exceptions cannot be caught; the transaction just ends. Compare Limits.getQueries() with Limits.getLimitQueries() before each step and hand the rest to async work.',
        },
      ],
    },
  ],
}

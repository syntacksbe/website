// Log detective games (type 'log', see src/arcade/types/log.check.js).
// In the logs below, a line that starts with » is a clue: caseFile() strips the mark and stores its
// index in `clues`, so the indexes stay right when a log is edited.

function caseFile({ q, log, suspects, answer, why }) {
  const clues = []
  const lines = log.replace(/^\n+|\n+$/g, '').split('\n').map((line, i) => {
    if (!line.startsWith('»')) return line
    clues.push(i)
    return line.slice(1)
  })
  return { q, log: lines.join('\n'), clues, suspects, answer, why }
}

const soqlStakeout = {
  category: 'limits',
  id: 'limits-log-soql-stakeout',
  title: 'The SOQL Stakeout',
  blurb: 'Four crashed transactions, four debug logs. Find what burned the governor limits.',
  type: 'log',
  level: 1,
  rounds: [
    caseFile({
      q: 'Harbourline Logistics: a data load of 200 Opportunities dies with “Too many SOQL queries: 101”. The trigger is short. What is draining the queries?',
      log: `
61.0 APEX_CODE,DEBUG;APEX_PROFILING,INFO;DB,INFO;SYSTEM,DEBUG
14:02:11.002 (2017412)|EXECUTION_STARTED
14:02:11.002 (2034118)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Ab1C|OpportunityTrigger on Opportunity trigger event BeforeInsert|__sfdc_trigger/OpportunityTrigger
14:02:11.004 (4120331)|USER_DEBUG|[3]|DEBUG|Trigger.new size: 200
14:02:11.009 (9412007)|SOQL_EXECUTE_BEGIN|[6]|Aggregations:0|SELECT Id, Region__c FROM Territory__c WHERE Active__c = TRUE
14:02:11.012 (12007553)|SOQL_EXECUTE_END|[6]|Rows:12
»14:02:11.015 (15330120)|SOQL_EXECUTE_BEGIN|[14]|Aggregations:0|SELECT Id, OwnerId, Industry FROM Account WHERE Id = :tmpVar1 LIMIT 1
14:02:11.017 (17004218)|SOQL_EXECUTE_END|[14]|Rows:1
14:02:11.019 (19221874)|SOQL_EXECUTE_BEGIN|[14]|Aggregations:0|SELECT Id, OwnerId, Industry FROM Account WHERE Id = :tmpVar1 LIMIT 1
14:02:11.021 (21093355)|SOQL_EXECUTE_END|[14]|Rows:1
14:02:11.023 (23471902)|SOQL_EXECUTE_BEGIN|[14]|Aggregations:0|SELECT Id, OwnerId, Industry FROM Account WHERE Id = :tmpVar1 LIMIT 1
14:02:11.025 (25310066)|SOQL_EXECUTE_END|[14]|Rows:1
»14:02:11.402 (402117509)|USER_DEBUG|[12]|DEBUG|Loop index: 99
14:02:11.404 (404662310)|SOQL_EXECUTE_BEGIN|[14]|Aggregations:0|SELECT Id, OwnerId, Industry FROM Account WHERE Id = :tmpVar1 LIMIT 1
14:02:11.405 (405019874)|EXCEPTION_THROWN|[14]|System.LimitException: Too many SOQL queries: 101
14:02:11.405 (405337102)|FATAL_ERROR|System.LimitException: Too many SOQL queries: 101
Trigger.OpportunityTrigger: line 14, column 1
14:02:11.406 (406001257)|CUMULATIVE_LIMIT_USAGE
14:02:11.406 (406001257)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 101 out of 100 ******* CLOSE TO LIMIT
  Number of query rows: 111 out of 50000
  Number of DML statements: 0 out of 150
  Maximum CPU time: 388 out of 10000
14:02:11.406 (406112908)|CUMULATIVE_LIMIT_USAGE_END
14:02:11.407 (407220415)|CODE_UNIT_FINISHED|OpportunityTrigger on Opportunity trigger event BeforeInsert
14:02:11.407 (407356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Territory__c query on line 6',
        'The Account query on line 14, run once per record inside the loop',
        'A flow on Opportunity running its own queries',
        'The data load sending 200 records in one batch',
      ],
      answer: 1,
      why: 'Line 14 runs the same Account query on every pass of the loop (index 99 and counting). Query all Accounts once with WHERE Id IN :ids before the loop and read them from a Map.',
    }),
    caseFile({
      q: 'Brightwater Energy: closing 200 Cases from a list view fails with “Too many DML statements: 151”. Which code is guilty?',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
09:41:03.001 (1305512)|EXECUTION_STARTED
09:41:03.001 (1322877)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Bq2D|CaseTrigger on Case trigger event AfterUpdate|__sfdc_trigger/CaseTrigger
09:41:03.003 (3110274)|USER_DEBUG|[4]|DEBUG|Closed cases in batch: 200
09:41:03.006 (6402911)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, Case__c FROM Survey_Invite__c WHERE Case__c IN :tmpVar1
09:41:03.011 (11873002)|SOQL_EXECUTE_END|[9]|Rows:0
»09:41:03.014 (14551230)|DML_BEGIN|[17]|Op:Insert|Type:Survey_Invite__c|Rows:1
09:41:03.019 (19002318)|DML_END|[17]
09:41:03.020 (20114962)|DML_BEGIN|[17]|Op:Insert|Type:Survey_Invite__c|Rows:1
09:41:03.025 (25330871)|DML_END|[17]
09:41:03.026 (26478213)|DML_BEGIN|[17]|Op:Insert|Type:Survey_Invite__c|Rows:1
09:41:03.031 (31007265)|DML_END|[17]
09:41:04.880 (1880412337)|DML_BEGIN|[22]|Op:Update|Type:Account|Rows:37
09:41:04.902 (1902118540)|DML_END|[22]
09:41:04.905 (1905226003)|DML_BEGIN|[17]|Op:Insert|Type:Survey_Invite__c|Rows:1
09:41:04.906 (1906001122)|EXCEPTION_THROWN|[17]|System.LimitException: Too many DML statements: 151
09:41:04.906 (1906213450)|FATAL_ERROR|System.LimitException: Too many DML statements: 151
Trigger.CaseTrigger: line 17, column 1
09:41:04.907 (1907005218)|CUMULATIVE_LIMIT_USAGE
09:41:04.907 (1907005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of query rows: 0 out of 50000
  Number of DML statements: 151 out of 150 ******* CLOSE TO LIMIT
  Number of DML rows: 187 out of 10000
  Maximum CPU time: 1204 out of 10000
09:41:04.907 (1907118342)|CUMULATIVE_LIMIT_USAGE_END
09:41:04.908 (1908220415)|CODE_UNIT_FINISHED|CaseTrigger on Case trigger event AfterUpdate
09:41:04.908 (1908356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Account update on line 22',
        'The Survey_Invite__c query on line 9',
        'The Survey_Invite__c insert on line 17, one record per DML statement',
        'Too many rows: the 10,000 DML row limit',
      ],
      answer: 2,
      why: 'Line 17 inserts one Survey_Invite__c per statement (Rows:1, over and over), while line 22 updates 37 Accounts in one go. Collect the invites in a list and insert them once after the loop.',
    }),
    caseFile({
      q: 'Fernway Retail: the “Recalculate loyalty tier” button suddenly fails for every customer. Nobody changed the code.',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
16:20:45.001 (1022334)|EXECUTION_STARTED
16:20:45.001 (1045122)|CODE_UNIT_STARTED|[EXTERNAL]|apex://LoyaltyController/ACTION$recalculate
16:20:45.002 (2210984)|USER_DEBUG|[11]|DEBUG|Recalculating tier for 001Hn00001LxQ2A
16:20:45.005 (5330127)|SOQL_EXECUTE_BEGIN|[15]|Aggregations:0|SELECT Id, Name, Loyalty_Tier__c FROM Account WHERE Id = :accountId
16:20:45.007 (7114085)|SOQL_EXECUTE_END|[15]|Rows:1
»16:20:45.009 (9002517)|SOQL_EXECUTE_BEGIN|[18]|Aggregations:0|SELECT Id, Amount__c, Account__c FROM Purchase__c
16:20:47.884 (2884501226)|EXCEPTION_THROWN|[18]|System.LimitException: Too many query rows: 50001
16:20:47.884 (2884772210)|FATAL_ERROR|System.LimitException: Too many query rows: 50001
Class.LoyaltyController.recalculate: line 18, column 1
16:20:47.885 (2885013377)|CUMULATIVE_LIMIT_USAGE
16:20:47.885 (2885013377)|LIMIT_USAGE_FOR_NS|(default)|
»  Number of SOQL queries: 2 out of 100
  Number of query rows: 50001 out of 50000 ******* CLOSE TO LIMIT
  Number of DML statements: 0 out of 150
  Maximum CPU time: 2140 out of 10000
  Maximum heap size: 4911022 out of 6000000 ******* CLOSE TO LIMIT
16:20:47.885 (2885118342)|CUMULATIVE_LIMIT_USAGE_END
16:20:47.886 (2886220415)|CODE_UNIT_FINISHED|apex://LoyaltyController/ACTION$recalculate
16:20:47.886 (2886356001)|EXECUTION_FINISHED`,
      suspects: [
        'A SOQL query inside a loop',
        'The heap filling up',
        'The Account query on line 15',
        'The Purchase__c query on line 18 has no WHERE clause',
      ],
      answer: 3,
      why: 'Only 2 queries ran, so it isn’t a loop: line 18 reads every Purchase__c in the org, and the table just passed 50,000 rows. Filter it on the Account (or use an aggregate query).',
    }),
    caseFile({
      q: 'Northpeak Insurance: editing any Account now fails with “maximum trigger depth exceeded”. Who keeps calling whom?',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
11:07:19.001 (1104412)|EXECUTION_STARTED
11:07:19.001 (1120387)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Cz7E|AccountTrigger on Account trigger event AfterUpdate|__sfdc_trigger/AccountTrigger
11:07:19.003 (3220114)|USER_DEBUG|[5]|DEBUG|AccountTrigger guard: isRunning=false
11:07:19.006 (6004418)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, Risk_Score__c FROM Account WHERE Id IN :tmpVar1
11:07:19.008 (8117302)|SOQL_EXECUTE_END|[9]|Rows:1
»11:07:19.010 (10225419)|DML_BEGIN|[14]|Op:Update|Type:Account|Rows:1
11:07:19.011 (11003218)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Cz7E|AccountTrigger on Account trigger event AfterUpdate|__sfdc_trigger/AccountTrigger
»11:07:19.012 (12220114)|USER_DEBUG|[5]|DEBUG|AccountTrigger guard: isRunning=false
11:07:19.014 (14004418)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, Risk_Score__c FROM Account WHERE Id IN :tmpVar1
11:07:19.016 (16117302)|SOQL_EXECUTE_END|[9]|Rows:1
11:07:19.018 (18225419)|DML_BEGIN|[14]|Op:Update|Type:Account|Rows:1
11:07:19.019 (19003218)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Cz7E|AccountTrigger on Account trigger event AfterUpdate|__sfdc_trigger/AccountTrigger
11:07:19.142 (142889301)|DML_BEGIN|[14]|Op:Update|Type:Account|Rows:1
11:07:19.143 (143002871)|EXCEPTION_THROWN|[14]|System.DmlException: Update failed. First exception on row 0 with id 001Hn00001Rk4TQ; first error: CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY, AccountTrigger: maximum trigger depth exceeded
11:07:19.143 (143221087)|FATAL_ERROR|System.DmlException: Update failed. First exception on row 0 with id 001Hn00001Rk4TQ; first error: CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY, AccountTrigger: maximum trigger depth exceeded
Trigger.AccountTrigger: line 14, column 1
11:07:19.144 (144005218)|CUMULATIVE_LIMIT_USAGE
11:07:19.144 (144005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 16 out of 100
  Number of DML statements: 16 out of 150
  Maximum CPU time: 131 out of 10000
11:07:19.144 (144118342)|CUMULATIVE_LIMIT_USAGE_END
11:07:19.145 (145356001)|EXECUTION_FINISHED`,
      suspects: [
        'Another user editing the same Account at the same time',
        'A validation rule on Account',
        'The 16 SOQL queries hitting the query limit',
        'The after-update trigger updates its own Accounts, and its guard is never set',
      ],
      answer: 3,
      why: 'Line 14 updates the Accounts the trigger is already handling, which fires AccountTrigger again, 16 levels deep; the guard prints isRunning=false every time. Set Risk_Score__c in a before-update trigger instead, with no DML at all.',
    }),
  ],
}

const cpuHeap = {
  category: 'limits',
  id: 'limits-log-cpu-heap',
  title: 'Cold Case: CPU and Heap',
  blurb: 'The tough limits: CPU time, heap, stack depth and async jobs. Read the log, not the hunch.',
  type: 'log',
  level: 3,
  rounds: [
    caseFile({
      q: 'Quillmark Publishing: “Find duplicates” on a contact import fails with “Apex CPU time limit exceeded”. Only 2 queries ran. Where did the time go?',
      log: `
61.0 APEX_CODE,FINE;APEX_PROFILING,INFO;DB,INFO;SYSTEM,DEBUG
16:05:04.001 (1203345)|EXECUTION_STARTED
16:05:04.001 (1221980)|CODE_UNIT_STARTED|[EXTERNAL]|apex://DedupeController/ACTION$findDuplicates
16:05:04.003 (3500712)|SOQL_EXECUTE_BEGIN|[21]|Aggregations:0|SELECT Id, Email, LastName FROM Contact WHERE Import_Batch__c = :batchId
16:05:04.088 (88204411)|SOQL_EXECUTE_END|[21]|Rows:200
16:05:04.090 (90312508)|SOQL_EXECUTE_BEGIN|[24]|Aggregations:0|SELECT Id, Email, LastName FROM Contact WHERE Import_Batch__c = null AND Email != null LIMIT 9000
16:05:04.702 (702115220)|SOQL_EXECUTE_END|[24]|Rows:9000
16:05:04.705 (705001233)|METHOD_ENTRY|[30]|01pHn00000Dd8Fa|DedupeService.findMatches(List<Contact>, List<Contact>)
»16:05:04.706 (706223015)|USER_DEBUG|[33]|DEBUG|Comparing 200 new contacts x 9000 existing contacts
16:05:04.709 (709118006)|METHOD_ENTRY|[41]|01pHn00000Dd8Fa|DedupeService.normalize(String)
16:05:04.709 (709223411)|METHOD_EXIT|[41]|01pHn00000Dd8Fa|DedupeService.normalize(String)
»16:05:09.611 (5611007842)|USER_DEBUG|[38]|DEBUG|Outer loop: 61 of 200 new contacts done
16:05:14.012 (10012447120)|EXCEPTION_THROWN|[41]|System.LimitException: Apex CPU time limit exceeded
16:05:14.012 (10012663291)|FATAL_ERROR|System.LimitException: Apex CPU time limit exceeded
Class.DedupeService.normalize: line 41, column 1
Class.DedupeService.findMatches: line 36, column 1
16:05:14.013 (10013005218)|CUMULATIVE_LIMIT_USAGE
16:05:14.013 (10013005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 2 out of 100
  Number of query rows: 9200 out of 50000
  Number of DML statements: 0 out of 150
  Maximum CPU time: 10012 out of 10000 ******* CLOSE TO LIMIT
  Maximum heap size: 2876544 out of 6000000
16:05:14.013 (10013118342)|CUMULATIVE_LIMIT_USAGE_END
16:05:14.014 (10014220415)|CODE_UNIT_FINISHED|apex://DedupeController/ACTION$findDuplicates
16:05:14.014 (10014356001)|EXECUTION_FINISHED`,
      suspects: [
        'The 9,000-row Contact query on line 24 is too slow',
        'A nested loop calling normalize() for every pair: 200 × 9,000',
        'The heap filling up with 9,000 Contacts',
        'Too many query rows',
      ],
      answer: 1,
      why: 'Database time doesn’t count as CPU time; the nested loop does. 1.8 million pairs, each calling normalize(), can’t finish in 10 s: normalize each email once and match through a Map.',
    }),
    caseFile({
      q: 'Driftwood Legal: “Zip all case files” on a big client fails with “Apex heap size too large”. Which line brought in the elephant?',
      log: `
61.0 APEX_CODE,FINE;DB,INFO;SYSTEM,DEBUG
10:15:32.001 (1007211)|EXECUTION_STARTED
10:15:32.001 (1029934)|CODE_UNIT_STARTED|[EXTERNAL]|apex://CaseFilesController/ACTION$zipAll
10:15:32.003 (3111209)|SOQL_EXECUTE_BEGIN|[12]|Aggregations:0|SELECT Id, CaseNumber, Subject FROM Case WHERE AccountId = :accountId
10:15:32.006 (6220431)|SOQL_EXECUTE_END|[12]|Rows:48
»10:15:32.008 (8034557)|SOQL_EXECUTE_BEGIN|[15]|Aggregations:0|SELECT Id, Title, VersionData FROM ContentVersion WHERE FirstPublishLocationId IN :caseIds AND IsLatest = TRUE
10:15:33.912 (1912004415)|SOQL_EXECUTE_END|[15]|Rows:212
10:15:33.914 (1914332008)|HEAP_ALLOCATE|[18]|Bytes:5841220
»10:15:33.915 (1915007711)|USER_DEBUG|[19]|DEBUG|Files loaded: 212, total size 5.6 MB
10:15:33.920 (1920118209)|METHOD_ENTRY|[22]|01pHn00000Ee9Gb|ZipBuilder.addAll(List<ContentVersion>)
10:15:33.931 (1931552013)|HEAP_ALLOCATE|[30]|Bytes:1048576
10:15:33.932 (1932004871)|EXCEPTION_THROWN|[30]|System.LimitException: Apex heap size too large: 6889796
10:15:33.932 (1932227654)|FATAL_ERROR|System.LimitException: Apex heap size too large: 6889796
Class.ZipBuilder.addAll: line 30, column 1
Class.CaseFilesController.zipAll: line 22, column 1
10:15:33.933 (1933005218)|CUMULATIVE_LIMIT_USAGE
10:15:33.933 (1933005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 2 out of 100
  Number of query rows: 260 out of 50000
  Maximum CPU time: 412 out of 10000
  Maximum heap size: 6889796 out of 6000000 ******* CLOSE TO LIMIT
10:15:33.933 (1933118342)|CUMULATIVE_LIMIT_USAGE_END
10:15:33.934 (1934356001)|EXECUTION_FINISHED`,
      suspects: [
        'The 1 MB zip buffer on line 30',
        'The Case query on line 12 returning 48 rows',
        'Line 15 loading the file bodies (VersionData) of 212 files at once',
        'CPU time running out while zipping',
      ],
      answer: 2,
      why: 'Line 15 pulls the binary body of 212 files into memory: 5.6 MB before zipping even starts, so the 1 MB buffer only tips it over. Query Ids only and process the files a few at a time in a Queueable.',
    }),
    caseFile({
      q: 'Silverlake Holdings: rolling up revenue fails with “Maximum stack depth reached: 1001”. The group has only 3 Accounts. Or so they say.',
      log: `
61.0 APEX_CODE,FINE;DB,INFO;SYSTEM,DEBUG
13:48:02.001 (1100342)|EXECUTION_STARTED
13:48:02.001 (1118876)|CODE_UNIT_STARTED|[EXTERNAL]|apex://HierarchyController/ACTION$rollUp
13:48:02.002 (2014553)|SOQL_EXECUTE_BEGIN|[8]|Aggregations:0|SELECT Id, Name, ParentId, AnnualRevenue FROM Account WHERE Group__c = :groupId
13:48:02.009 (9221087)|SOQL_EXECUTE_END|[8]|Rows:3
13:48:02.010 (10335112)|METHOD_ENTRY|[14]|01pHn00000Ff1Hc|AccountHierarchy.sumChildren(Id)
13:48:02.010 (10412097)|USER_DEBUG|[17]|DEBUG|Visiting Silverlake Group (001Hn00001AAa01), ParentId=001Hn00001AAc03
13:48:02.011 (11203548)|METHOD_ENTRY|[22]|01pHn00000Ff1Hc|AccountHierarchy.sumChildren(Id)
13:48:02.011 (11298874)|USER_DEBUG|[17]|DEBUG|Visiting Silverlake Benelux (001Hn00001AAb02), ParentId=001Hn00001AAa01
13:48:02.012 (12001332)|METHOD_ENTRY|[22]|01pHn00000Ff1Hc|AccountHierarchy.sumChildren(Id)
»13:48:02.012 (12117004)|USER_DEBUG|[17]|DEBUG|Visiting Silverlake Antwerp (001Hn00001AAc03), ParentId=001Hn00001AAb02
13:48:02.013 (13002871)|METHOD_ENTRY|[22]|01pHn00000Ff1Hc|AccountHierarchy.sumChildren(Id)
»13:48:02.013 (13110543)|USER_DEBUG|[17]|DEBUG|Visiting Silverlake Group (001Hn00001AAa01), ParentId=001Hn00001AAc03
13:48:02.014 (14001876)|METHOD_ENTRY|[22]|01pHn00000Ff1Hc|AccountHierarchy.sumChildren(Id)
13:48:02.014 (14100218)|USER_DEBUG|[17]|DEBUG|Visiting Silverlake Benelux (001Hn00001AAb02), ParentId=001Hn00001AAa01
13:48:02.395 (395772013)|METHOD_ENTRY|[22]|01pHn00000Ff1Hc|AccountHierarchy.sumChildren(Id)
13:48:02.396 (396004417)|EXCEPTION_THROWN|[22]|System.LimitException: Maximum stack depth reached: 1001
13:48:02.396 (396224015)|FATAL_ERROR|System.LimitException: Maximum stack depth reached: 1001
Class.AccountHierarchy.sumChildren: line 22, column 1
13:48:02.397 (397005218)|CUMULATIVE_LIMIT_USAGE
13:48:02.397 (397005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of query rows: 3 out of 50000
  Maximum CPU time: 286 out of 10000
13:48:02.397 (397118342)|CUMULATIVE_LIMIT_USAGE_END
13:48:02.398 (398356001)|EXECUTION_FINISHED`,
      suspects: [
        'The hierarchy is deeper than 1,000 levels',
        'A loop in the data: the Group’s parent is its own grandchild, Antwerp',
        'The query on line 8 returns too few rows',
        'AnnualRevenue is empty on one Account',
      ],
      answer: 1,
      why: 'Antwerp sits under Benelux under the Group, yet the Group’s ParentId points back at Antwerp, so sumChildren() goes round in circles. Fix the data, and keep a Set of visited Ids so a cycle can’t recurse forever.',
    }),
    caseFile({
      q: 'Ironvale Manufacturing: the nightly price sync batch dies in every chunk with “Too many queueable jobs added to the queue: 2”.',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
03:10:00.001 (1002144)|EXECUTION_STARTED
03:10:00.001 (1020887)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Gg2Jd|PriceSyncBatch
03:10:00.002 (2113098)|USER_DEBUG|[18]|DEBUG|execute(): scope size 200
03:10:00.005 (5004123)|SOQL_EXECUTE_BEGIN|[20]|Aggregations:0|SELECT Id, Product2Id, UnitPrice FROM PricebookEntry WHERE Id IN :tmpVar1
03:10:00.019 (19331002)|SOQL_EXECUTE_END|[20]|Rows:200
03:10:00.021 (21008765)|DML_BEGIN|[26]|Op:Update|Type:PricebookEntry|Rows:200
03:10:00.188 (188220431)|DML_END|[26]
03:10:00.190 (190001276)|METHOD_ENTRY|[29]|01pHn00000Gg2Jd|PriceSyncBatch.notifyErp(List<PricebookEntry>)
03:10:00.191 (191117302)|USER_DEBUG|[44]|DEBUG|Enqueuing ErpPriceJob for records 1–100
»03:10:00.193 (193117302)|USER_DEBUG|[44]|DEBUG|Enqueuing ErpPriceJob for records 101–200
03:10:00.194 (194112876)|EXCEPTION_THROWN|[45]|System.LimitException: Too many queueable jobs added to the queue: 2
03:10:00.194 (194332109)|FATAL_ERROR|System.LimitException: Too many queueable jobs added to the queue: 2
Class.PriceSyncBatch.notifyErp: line 45, column 1
Class.PriceSyncBatch.execute: line 29, column 1
03:10:00.195 (195005218)|CUMULATIVE_LIMIT_USAGE
03:10:00.195 (195005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 200
  Number of DML statements: 1 out of 150
  Maximum CPU time: 640 out of 60000
»  Number of queueable jobs added to the queue: 1 out of 1 ******* CLOSE TO LIMIT
03:10:00.195 (195118342)|CUMULATIVE_LIMIT_USAGE_END
03:10:00.196 (196356001)|EXECUTION_FINISHED`,
      suspects: [
        'The PricebookEntry update on line 26 hitting the DML limit',
        'A batch scope of 200 is too big for the CPU limit',
        'ErpPriceJob failing inside its own callout',
        'notifyErp() enqueues two jobs, but a batch execute() may enqueue only one',
      ],
      answer: 3,
      why: 'Inside a batch execute() the queueable limit is 1, and notifyErp() splits the 200 records into two jobs. Enqueue one job with the whole scope, or call the ERP from the batch itself with Database.AllowsCallouts.',
    }),
  ],
}

const calloutFiles = {
  category: 'integration',
  id: 'integration-log-callout-files',
  title: 'The Callout Files',
  blurb: 'Callouts that fail in the dark: uncommitted work, a 401, a timeout and a JSON error.',
  type: 'log',
  level: 2,
  rounds: [
    caseFile({
      q: 'Pinecrest Freight: “Book shipment” fails with “You have uncommitted work pending”. Reconstruct the order of events.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
15:31:07.001 (1032187)|EXECUTION_STARTED
15:31:07.001 (1050442)|CODE_UNIT_STARTED|[EXTERNAL]|apex://ShipmentController/ACTION$book
15:31:07.003 (3221087)|SOQL_EXECUTE_BEGIN|[10]|Aggregations:0|SELECT Id, Weight_Kg__c, Destination__c FROM Shipment__c WHERE Id = :shipmentId
15:31:07.006 (6100498)|SOQL_EXECUTE_END|[10]|Rows:1
»15:31:07.008 (8331204)|DML_BEGIN|[14]|Op:Update|Type:Shipment__c|Rows:1
15:31:07.031 (31002117)|DML_END|[14]
15:31:07.032 (32118430)|USER_DEBUG|[16]|DEBUG|Status set to Booking, calling carrier
»15:31:07.034 (34220108)|CALLOUT_REQUEST|[19]|System.HttpRequest[Endpoint=callout:Carrier_API/v2/bookings, Method=POST]
15:31:07.034 (34502219)|EXCEPTION_THROWN|[19]|System.CalloutException: You have uncommitted work pending. Please commit or rollback before calling out
15:31:07.034 (34771005)|FATAL_ERROR|System.CalloutException: You have uncommitted work pending. Please commit or rollback before calling out
Class.CarrierClient.book: line 19, column 1
Class.ShipmentController.book: line 17, column 1
15:31:07.035 (35005218)|CUMULATIVE_LIMIT_USAGE
15:31:07.035 (35005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Number of callouts: 0 out of 100
  Maximum CPU time: 48 out of 10000
15:31:07.035 (35118342)|CUMULATIVE_LIMIT_USAGE_END
15:31:07.036 (36356001)|EXECUTION_FINISHED`,
      suspects: [
        'The carrier API is down',
        'The Shipment update on line 14 runs before the callout, in the same transaction',
        'The Named Credential Carrier_API is missing',
        'The org used up its 100 callouts',
      ],
      answer: 1,
      why: 'The update on line 14 left uncommitted work, and Apex won’t call out after DML in the same transaction. Call the carrier first and update the Shipment afterwards, or move the callout to a Queueable.',
    }),
    caseFile({
      q: 'Pinecrest Freight: since Monday the hourly tracking sync fails every time. The code hasn’t changed since March.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
08:00:02.001 (1104772)|EXECUTION_STARTED
08:00:02.001 (1121093)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Hh3Ke|TrackingSyncJob
08:00:02.004 (4002981)|SOQL_EXECUTE_BEGIN|[12]|Aggregations:0|SELECT Id, Tracking_No__c FROM Shipment__c WHERE Status__c = 'In transit' LIMIT 100
08:00:02.010 (10330218)|SOQL_EXECUTE_END|[12]|Rows:37
08:00:02.012 (12118042)|CALLOUT_REQUEST|[24]|System.HttpRequest[Endpoint=callout:Carrier_API/v2/tracking, Method=POST]
08:00:02.013 (13220974)|NAMED_CREDENTIAL_REQUEST|NamedCallout[Named Credential Name=Carrier_API, Endpoint=https://api.carrier.example/v2/tracking, Method=POST, Authentication=OAuth 2.0, Principal=Integration_User]
08:00:02.388 (388104327)|NAMED_CREDENTIAL_RESPONSE|NamedCallout[Status=Unauthorized, StatusCode=401]
»08:00:02.389 (389002115)|CALLOUT_RESPONSE|[24]|System.HttpResponse[Status=Unauthorized, StatusCode=401]
»08:00:02.390 (390117438)|USER_DEBUG|[27]|DEBUG|Carrier error body: {"error":"invalid_grant","error_description":"Refresh token expired"}
08:00:02.392 (392004811)|EXCEPTION_THROWN|[31]|CarrierClient.CarrierException: Tracking sync failed: 401 Unauthorized
08:00:02.392 (392221007)|FATAL_ERROR|CarrierClient.CarrierException: Tracking sync failed: 401 Unauthorized
Class.CarrierClient.track: line 31, column 1
Class.TrackingSyncJob.execute: line 18, column 1
08:00:02.393 (393005218)|CUMULATIVE_LIMIT_USAGE
08:00:02.393 (393005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 200
  Number of callouts: 1 out of 100
  Maximum CPU time: 61 out of 60000
08:00:02.393 (393118342)|CUMULATIVE_LIMIT_USAGE_END
08:00:02.394 (394356001)|EXECUTION_FINISHED`,
      suspects: [
        'The OAuth refresh token behind the Named Credential expired',
        'The carrier moved the endpoint to a new URL',
        'The job sends too many shipments in one call',
        'The integration user lost access to Shipment__c',
      ],
      answer: 0,
      why: 'The call reached the carrier, which answered 401 with invalid_grant: the stored refresh token expired. Re-authenticate the principal on the External Credential; no code change needed.',
    }),
    caseFile({
      q: 'Larkspur Health: submitting an order sometimes fails with “Read timed out”. The ERP team says their system “always answers”.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
11:52:40.001 (1009983)|EXECUTION_STARTED
11:52:40.001 (1027614)|CODE_UNIT_STARTED|[EXTERNAL]|apex://OrderController/ACTION$submit
11:52:40.003 (3118007)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, OrderNumber, (SELECT Id, Quantity FROM OrderItems) FROM Order WHERE Id = :orderId
11:52:40.008 (8221460)|SOQL_EXECUTE_END|[9]|Rows:1
11:52:40.009 (9004127)|USER_DEBUG|[15]|DEBUG|Payload built: 214 order lines, 88 KB
»11:52:40.010 (10117300)|USER_DEBUG|[18]|DEBUG|req.setTimeout(5000)
»11:52:40.011 (11220115)|CALLOUT_REQUEST|[21]|System.HttpRequest[Endpoint=callout:ERP/api/orders, Method=POST]
»11:52:45.013 (5013442106)|EXCEPTION_THROWN|[21]|System.CalloutException: Read timed out
11:52:45.013 (5013661090)|FATAL_ERROR|System.CalloutException: Read timed out
Class.ErpClient.send: line 21, column 1
Class.OrderController.submit: line 12, column 1
11:52:45.014 (5014005218)|CUMULATIVE_LIMIT_USAGE
11:52:45.014 (5014005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of callouts: 1 out of 100
  Maximum CPU time: 74 out of 10000
11:52:45.014 (5014118342)|CUMULATIVE_LIMIT_USAGE_END
11:52:45.015 (5015356001)|EXECUTION_FINISHED`,
      suspects: [
        'The ERP was down',
        'The 88 KB payload is over the request size limit',
        'The code waits only 5 seconds, and big orders take the ERP longer',
        'The org ran out of callouts',
      ],
      answer: 2,
      why: 'The request leaves at 11:52:40 and the timeout hits exactly 5 s later, matching setTimeout(5000). Raise the timeout (up to 120 s) or send big orders asynchronously.',
    }),
    caseFile({
      q: 'Larkspur Health: the stock check suddenly throws a JSON error, even though the call “succeeds” with a 200.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
07:45:18.001 (1033298)|EXECUTION_STARTED
07:45:18.001 (1051776)|CODE_UNIT_STARTED|[EXTERNAL]|apex://StockController/ACTION$check
07:45:18.002 (2210334)|CALLOUT_REQUEST|[14]|System.HttpRequest[Endpoint=callout:Warehouse_API/stock?sku=LH-2231, Method=GET]
07:45:18.311 (311002876)|CALLOUT_RESPONSE|[14]|System.HttpResponse[Status=OK, StatusCode=200]
»07:45:18.312 (312117044)|USER_DEBUG|[16]|DEBUG|Content-Type: text/html; charset=utf-8
»07:45:18.313 (313220917)|USER_DEBUG|[17]|DEBUG|Body: <!DOCTYPE html><html><head><title>Scheduled maintenance</title></head><body>Back at 08:00</body></html>
07:45:18.314 (314008113)|METHOD_ENTRY|[19]|01pHn00000Jj4Lf|StockResponse.parse(String)
07:45:18.315 (315442190)|EXCEPTION_THROWN|[22]|System.JSONException: Unexpected character ('<' (code 60)): expected a valid value (number, String, array, object, 'true', 'false' or 'null') at input location [1,2]
07:45:18.315 (315661207)|FATAL_ERROR|System.JSONException: Unexpected character ('<' (code 60)): expected a valid value (number, String, array, object, 'true', 'false' or 'null') at input location [1,2]
Class.StockResponse.parse: line 22, column 1
Class.StockController.check: line 19, column 1
07:45:18.316 (316005218)|CUMULATIVE_LIMIT_USAGE
07:45:18.316 (316005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 100
  Number of callouts: 1 out of 100
  Maximum CPU time: 22 out of 10000
07:45:18.316 (316118342)|CUMULATIVE_LIMIT_USAGE_END
07:45:18.317 (317356001)|EXECUTION_FINISHED`,
      suspects: [
        'A bug in the StockResponse JSON mapping',
        'The dash in the SKU breaks the URL',
        'The callout timed out',
        'The warehouse returned an HTML maintenance page with status 200',
      ],
      answer: 3,
      why: 'The body is an HTML maintenance page served with a 200, so the parser chokes on the first “<”. Check the Content-Type before parsing and show a friendly “try again later”.',
    }),
  ],
}

const afterDark = {
  category: 'integration',
  id: 'integration-log-after-dark',
  title: 'Callouts After Dark',
  blurb: 'Harder integration cases: callout limits, a doubled path, a trigger callout and a bad payload.',
  type: 'log',
  level: 3,
  rounds: [
    caseFile({
      q: 'Oakhurst Realty: the nightly listing sync to the property portal stops with “Too many callouts: 101”.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
01:30:00.001 (1110287)|EXECUTION_STARTED
01:30:00.001 (1128455)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Kk5Mg|ListingSyncBatch
»01:30:00.002 (2007743)|USER_DEBUG|[15]|DEBUG|execute(): scope size 200
01:30:00.004 (4118320)|CALLOUT_REQUEST|[23]|System.HttpRequest[Endpoint=callout:Portal_API/listings/L-10442, Method=PUT]
01:30:00.191 (191442018)|CALLOUT_RESPONSE|[23]|System.HttpResponse[Status=OK, StatusCode=200]
01:30:00.193 (193004112)|CALLOUT_REQUEST|[23]|System.HttpRequest[Endpoint=callout:Portal_API/listings/L-10443, Method=PUT]
01:30:00.377 (377228109)|CALLOUT_RESPONSE|[23]|System.HttpResponse[Status=OK, StatusCode=200]
01:30:00.379 (379331087)|CALLOUT_REQUEST|[23]|System.HttpRequest[Endpoint=callout:Portal_API/listings/L-10444, Method=PUT]
01:30:00.566 (566007218)|CALLOUT_RESPONSE|[23]|System.HttpResponse[Status=OK, StatusCode=200]
»01:30:19.402 (19402117504)|USER_DEBUG|[21]|DEBUG|Syncing listing 101 of 200
01:30:19.403 (19403002876)|EXCEPTION_THROWN|[23]|System.LimitException: Too many callouts: 101
01:30:19.403 (19403221004)|FATAL_ERROR|System.LimitException: Too many callouts: 101
Class.ListingSyncBatch.execute: line 23, column 1
01:30:19.404 (19404005218)|CUMULATIVE_LIMIT_USAGE
01:30:19.404 (19404005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 200
  Number of callouts: 101 out of 100 ******* CLOSE TO LIMIT
  Maximum CPU time: 940 out of 60000
01:30:19.404 (19404118342)|CUMULATIVE_LIMIT_USAGE_END
01:30:19.405 (19405356001)|EXECUTION_FINISHED`,
      suspects: [
        'The portal rate-limits Salesforce',
        'The batch class is missing Database.AllowsCallouts',
        'Each callout takes too long',
        'One callout per listing, with a batch scope of 200',
      ],
      answer: 3,
      why: 'Each execute() gets 200 listings and sends one PUT per listing, but a transaction allows only 100 callouts. Run the batch with a scope of 100 or less, or use the portal’s bulk endpoint.',
    }),
    caseFile({
      q: 'Oakhurst Realty: after an admin “tidied up” the Named Credential, every price update returns 404.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
10:04:51.001 (1002387)|EXECUTION_STARTED
10:04:51.001 (1020115)|CODE_UNIT_STARTED|[EXTERNAL]|apex://PriceController/ACTION$push
10:04:51.003 (3330981)|SOQL_EXECUTE_BEGIN|[8]|Aggregations:0|SELECT Id, Portal_Id__c, Price__c FROM Listing__c WHERE Id = :listingId
10:04:51.006 (6118432)|SOQL_EXECUTE_END|[8]|Rows:1
10:04:51.007 (7004226)|CALLOUT_REQUEST|[16]|System.HttpRequest[Endpoint=callout:Portal_API/v3/listings/L-10442/price, Method=PATCH]
»10:04:51.008 (8117093)|NAMED_CREDENTIAL_REQUEST|NamedCallout[Named Credential Name=Portal_API, Endpoint=https://api.portal.example/v3/v3/listings/L-10442/price, Method=PATCH]
10:04:51.214 (214330871)|NAMED_CREDENTIAL_RESPONSE|NamedCallout[Status=Not Found, StatusCode=404]
10:04:51.215 (215002118)|CALLOUT_RESPONSE|[16]|System.HttpResponse[Status=Not Found, StatusCode=404]
»10:04:51.216 (216117205)|USER_DEBUG|[19]|DEBUG|Portal said: {"message":"No route for PATCH /v3/v3/listings/L-10442/price"}
10:04:51.217 (217004433)|EXCEPTION_THROWN|[22]|PortalClient.PortalException: Price push failed: 404
10:04:51.217 (217221873)|FATAL_ERROR|PortalClient.PortalException: Price push failed: 404
Class.PortalClient.pushPrice: line 22, column 1
Class.PriceController.push: line 11, column 1
10:04:51.218 (218005218)|CUMULATIVE_LIMIT_USAGE
10:04:51.218 (218005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of callouts: 1 out of 100
  Maximum CPU time: 37 out of 10000
10:04:51.218 (218118342)|CUMULATIVE_LIMIT_USAGE_END
10:04:51.219 (219356001)|EXECUTION_FINISHED`,
      suspects: [
        'The listing L-10442 was deleted on the portal',
        'PATCH isn’t allowed through a Named Credential',
        'The Named Credential URL now ends in /v3 and the code adds /v3 again',
        'The OAuth token expired',
      ],
      answer: 2,
      why: 'The resolved endpoint is /v3/v3/…: the admin moved /v3 into the Named Credential URL while the code still adds it. Keep the API version in one place only.',
    }),
    caseFile({
      q: 'Oakhurst Realty: a developer added a portal call to the Listing trigger. Since then, saving any Listing fails.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
14:26:33.001 (1077290)|EXECUTION_STARTED
»14:26:33.001 (1095443)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Ll6N|ListingTrigger on Listing__c trigger event AfterUpdate|__sfdc_trigger/ListingTrigger
14:26:33.003 (3220871)|USER_DEBUG|[4]|DEBUG|Listings changed: 1
»14:26:33.004 (4002176)|METHOD_ENTRY|[6]|01pHn00000Kk5Mg|PortalClient.pushPrice(Listing__c)
14:26:33.005 (5118439)|SOQL_EXECUTE_BEGIN|[11]|Aggregations:0|SELECT Id, Portal_Id__c, Price__c FROM Listing__c WHERE Id = :tmpVar1
14:26:33.007 (7004228)|SOQL_EXECUTE_END|[11]|Rows:1
14:26:33.008 (8331096)|EXCEPTION_THROWN|[16]|System.CalloutException: Callout from triggers are currently not supported.
14:26:33.008 (8552107)|FATAL_ERROR|System.CalloutException: Callout from triggers are currently not supported.
Class.PortalClient.pushPrice: line 16, column 1
Trigger.ListingTrigger: line 6, column 1
14:26:33.009 (9005218)|CUMULATIVE_LIMIT_USAGE
14:26:33.009 (9005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of callouts: 0 out of 100
  Maximum CPU time: 19 out of 10000
14:26:33.009 (9118342)|CUMULATIVE_LIMIT_USAGE_END
14:26:33.010 (10220415)|CODE_UNIT_FINISHED|ListingTrigger on Listing__c trigger event AfterUpdate
14:26:33.010 (10356001)|EXECUTION_FINISHED`,
      suspects: [
        'The portal’s domain is missing from Remote Site Settings',
        'The trigger calls the portal directly instead of from a Queueable or @future',
        'The trigger should run before update instead of after update',
        'The user’s profile blocks callouts',
      ],
      answer: 1,
      why: 'PortalClient.pushPrice() runs inside ListingTrigger, and a trigger can never wait on an HTTP call. Pass the Ids to a Queueable (or @future(callout=true)) that calls the portal after the save.',
    }),
    caseFile({
      q: 'Oakhurst Realty: the monthly commission import from a partner agency fails, but only for the October file.',
      log: `
61.0 APEX_CODE,DEBUG;CALLOUT,INFO;DB,INFO;SYSTEM,DEBUG
09:12:08.001 (1004982)|EXECUTION_STARTED
09:12:08.001 (1023117)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Mm7Ph|CommissionImportJob
09:12:08.002 (2118442)|CALLOUT_REQUEST|[19]|System.HttpRequest[Endpoint=callout:Partner_API/commissions?month=2026-10, Method=GET]
09:12:08.488 (488002341)|CALLOUT_RESPONSE|[19]|System.HttpResponse[Status=OK, StatusCode=200]
09:12:08.489 (489117820)|USER_DEBUG|[21]|DEBUG|Content-Type: application/json
09:12:08.490 (490004198)|USER_DEBUG|[22]|DEBUG|Rows in payload: 64
09:12:08.492 (492003876)|METHOD_ENTRY|[26]|01pHn00000Mm7Ph|CommissionImportJob.parse(String)
09:12:08.494 (494551207)|EXCEPTION_THROWN|[31]|System.JSONException: Illegal value for primitive
»09:12:08.495 (495002113)|USER_DEBUG|[34]|DEBUG|Parse failed near: "listing":"L-10871","amount":"1.250,00","currency":"EUR"
»09:12:08.495 (495220876)|USER_DEBUG|[35]|DEBUG|Previous row parsed fine: "listing":"L-10870","amount":980.00,"currency":"EUR"
09:12:08.496 (496004417)|EXCEPTION_THROWN|[36]|CommissionImportJob.ImportException: Commission file for 2026-10 could not be parsed
09:12:08.496 (496221090)|FATAL_ERROR|CommissionImportJob.ImportException: Commission file for 2026-10 could not be parsed
Class.CommissionImportJob.parse: line 36, column 1
Class.CommissionImportJob.execute: line 14, column 1
09:12:08.497 (497005218)|CUMULATIVE_LIMIT_USAGE
09:12:08.497 (497005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 200
  Number of callouts: 1 out of 100
  Maximum CPU time: 58 out of 60000
09:12:08.497 (497118342)|CUMULATIVE_LIMIT_USAGE_END
09:12:08.498 (498356001)|EXECUTION_FINISHED`,
      suspects: [
        'One row sends the amount as a text string with a decimal comma',
        'The partner sent HTML instead of JSON',
        'The 64-row payload is too big for the heap',
        'The currency field is missing',
      ],
      answer: 0,
      why: 'Row L-10871 sends amount as the text "1.250,00" while the Apex class expects a Decimal; the row before sends 980.00. Agree the contract with the partner, or read amount as a String and convert it yourself.',
    }),
  ],
}

const redBuild = {
  category: 'deployment',
  id: 'deployment-log-red-build',
  title: 'Red Build at Midnight',
  blurb: 'The release is blocked by failing tests. Read the test logs and find out why.',
  type: 'log',
  level: 2,
  rounds: [
    caseFile({
      q: 'Copperleaf Foods: a new test, QuoteServiceTest, blocks the release. The developer swears the standard price book exists.',
      log: `
61.0 APEX_CODE,FINE;APEX_PROFILING,INFO;DB,INFO;SYSTEM,DEBUG
22:41:17.001 (1014327)|EXECUTION_STARTED
22:41:17.001 (1032876)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Nn8Qi|QuoteServiceTest.createsQuoteLines()
22:41:17.004 (4220871)|DML_BEGIN|[12]|Op:Insert|Type:Product2|Rows:3
22:41:17.039 (39002117)|DML_END|[12]
»22:41:17.041 (41118320)|SOQL_EXECUTE_BEGIN|[15]|Aggregations:0|SELECT Id FROM Pricebook2 WHERE IsStandard = TRUE LIMIT 1
»22:41:17.044 (44227108)|SOQL_EXECUTE_END|[15]|Rows:0
22:41:17.045 (45003218)|EXCEPTION_THROWN|[15]|System.QueryException: List has no rows for assignment to SObject
22:41:17.045 (45221870)|FATAL_ERROR|System.QueryException: List has no rows for assignment to SObject
Class.QuoteServiceTest.createsQuoteLines: line 15, column 1
22:41:17.046 (46005218)|CUMULATIVE_LIMIT_USAGE
22:41:17.046 (46005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 33 out of 10000
22:41:17.046 (46118342)|CUMULATIVE_LIMIT_USAGE_END
22:41:17.047 (47220415)|CODE_UNIT_FINISHED|QuoteServiceTest.createsQuoteLines()
22:41:17.047 (47356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Product2 insert on line 12 failed silently',
        'Code coverage is below 75%',
        'The test queries the standard price book, which a test can’t see',
        'A validation rule on Pricebook2',
      ],
      answer: 2,
      why: 'Without SeeAllData, a test sees no org data, so the Pricebook2 query returns 0 rows. Use Test.getStandardPricebookId() instead.',
    }),
    caseFile({
      q: 'Copperleaf Foods: 14 tests that passed last week now fail during the release validation. All of them fail while creating test data.',
      log: `
61.0 APEX_CODE,FINE;DB,INFO;VALIDATION,INFO;SYSTEM,DEBUG
22:43:02.001 (1008763)|EXECUTION_STARTED
22:43:02.001 (1026214)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Pp9Rj|InvoiceServiceTest.setup()
22:43:02.002 (2117903)|METHOD_ENTRY|[9]|01pHn00000Qq1Sk|TestDataFactory.createAccounts(Integer)
22:43:02.004 (4002871)|DML_BEGIN|[22]|Op:Insert|Type:Account|Rows:5
22:43:02.006 (6118320)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Account:new
»22:43:02.006 (6220871)|VALIDATION_RULE|03dHn000000Rr2T|EU_VAT_Required
»22:43:02.007 (7004198)|VALIDATION_FORMULA|ISPICKVAL(Region__c, "EU") && ISBLANK(VAT_Number__c)|Region__c=EU , VAT_Number__c=null
22:43:02.007 (7117302)|VALIDATION_FAIL
22:43:02.008 (8002176)|CODE_UNIT_FINISHED|Validation:Account:new
22:43:02.009 (9118439)|DML_END|[22]
22:43:02.010 (10221087)|EXCEPTION_THROWN|[22]|System.DmlException: Insert failed. First exception on row 0; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Enter a VAT number for EU accounts.: [VAT_Number__c]
22:43:02.010 (10442190)|FATAL_ERROR|System.DmlException: Insert failed. First exception on row 0; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Enter a VAT number for EU accounts.: [VAT_Number__c]
Class.TestDataFactory.createAccounts: line 22, column 1
Class.InvoiceServiceTest.setup: line 9, column 1
22:43:02.011 (11005218)|CUMULATIVE_LIMIT_USAGE
22:43:02.011 (11005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 41 out of 10000
22:43:02.011 (11118342)|CUMULATIVE_LIMIT_USAGE_END
22:43:02.012 (12356001)|EXECUTION_FINISHED`,
      suspects: [
        'A new validation rule that the test data factory doesn’t satisfy',
        'Tests running in parallel lock the same Accounts',
        'The deploying user lost permission on Account',
        'The org ran out of data storage',
      ],
      answer: 0,
      why: 'The new EU_VAT_Required rule demands a VAT number, and the shared TestDataFactory doesn’t set one, so every test that uses it fails. Fill VAT_Number__c in the factory.',
    }),
    caseFile({
      q: 'Copperleaf Foods: ShippingRulesTest is green in the UAT sandbox but red in production.',
      log: `
61.0 APEX_CODE,FINE;DB,INFO;SYSTEM,DEBUG
22:44:40.001 (1009821)|EXECUTION_STARTED
22:44:40.001 (1027663)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Ss3Ul|ShippingRulesTest.appliesColdChainFee()
22:44:40.003 (3118204)|DML_BEGIN|[10]|Op:Insert|Type:Account|Rows:1
22:44:40.019 (19002387)|DML_END|[10]
»22:44:40.021 (21330876)|USER_DEBUG|[13]|DEBUG|Using RecordTypeId 0125g000000QcFzAAK for Cold_Chain
22:44:40.022 (22004117)|DML_BEGIN|[15]|Op:Insert|Type:Order|Rows:1
22:44:40.031 (31220871)|DML_END|[15]
»22:44:40.032 (32118449)|EXCEPTION_THROWN|[15]|System.DmlException: Insert failed. First exception on row 0; first error: INVALID_CROSS_REFERENCE_KEY, Record Type ID: this ID value isn't valid for the user: 0125g000000QcFzAAK: [RecordTypeId]
22:44:40.032 (32337120)|FATAL_ERROR|System.DmlException: Insert failed. First exception on row 0; first error: INVALID_CROSS_REFERENCE_KEY, Record Type ID: this ID value isn't valid for the user: 0125g000000QcFzAAK: [RecordTypeId]
Class.ShippingRulesTest.appliesColdChainFee: line 15, column 1
22:44:40.033 (33005218)|CUMULATIVE_LIMIT_USAGE
22:44:40.033 (33005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 100
  Number of DML statements: 2 out of 150
  Maximum CPU time: 29 out of 10000
22:44:40.033 (33118342)|CUMULATIVE_LIMIT_USAGE_END
22:44:40.034 (34220415)|CODE_UNIT_FINISHED|ShippingRulesTest.appliesColdChainFee()
22:44:40.034 (34356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Order insert needs a price book',
        'The cold chain fee is calculated wrong',
        'The test user has no access to Orders',
        'The test hard-codes a Record Type Id from the sandbox',
      ],
      answer: 3,
      why: 'Record Type Ids differ per org, and 0125g000000QcFzAAK only exists in UAT. Look it up by developer name with getRecordTypeInfosByDeveloperName().get(\'Cold_Chain\').',
    }),
    caseFile({
      q: 'Copperleaf Foods: LoyaltyPointsTest fails on an assertion, yet the points logic works when you try it by hand.',
      log: `
61.0 APEX_CODE,FINE;DB,INFO;SYSTEM,DEBUG
22:46:05.001 (1003387)|EXECUTION_STARTED
22:46:05.001 (1021109)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Tt4Vm|LoyaltyPointsTest.awardsPointsOnOrder()
22:46:05.002 (2220318)|USER_DEBUG|[8]|DEBUG|Test.startTest()
22:46:05.004 (4117220)|DML_BEGIN|[11]|Op:Insert|Type:Order|Rows:1
22:46:05.006 (6002871)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Uu5W|OrderTrigger on Order trigger event AfterInsert|__sfdc_trigger/OrderTrigger
»22:46:05.007 (7118439)|USER_DEBUG|[7]|DEBUG|Queued @future LoyaltyService.awardPointsAsync for 1 order
22:46:05.008 (8220871)|CODE_UNIT_FINISHED|OrderTrigger on Order trigger event AfterInsert
22:46:05.009 (9004198)|DML_END|[11]
22:46:05.011 (11117302)|SOQL_EXECUTE_BEGIN|[13]|Aggregations:0|SELECT Points__c FROM Account WHERE Id = :tmpVar1
22:46:05.013 (13002176)|SOQL_EXECUTE_END|[13]|Rows:1
»22:46:05.014 (14221087)|USER_DEBUG|[14]|DEBUG|Points before Test.stopTest(): 0
22:46:05.015 (15003218)|EXCEPTION_THROWN|[15]|System.AssertException: Assertion Failed: Expected: 120, Actual: 0
22:46:05.015 (15221870)|FATAL_ERROR|System.AssertException: Assertion Failed: Expected: 120, Actual: 0
Class.LoyaltyPointsTest.awardsPointsOnOrder: line 15, column 1
22:46:05.016 (16005218)|CUMULATIVE_LIMIT_USAGE
22:46:05.016 (16005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Number of future calls: 1 out of 50
22:46:05.016 (16118342)|CUMULATIVE_LIMIT_USAGE_END
22:46:05.017 (17356001)|EXECUTION_FINISHED`,
      suspects: [
        'LoyaltyService gives 0 points to test Orders',
        'The test asserts before Test.stopTest(), so the @future hasn’t run yet',
        'OrderTrigger doesn’t fire in tests',
        'The Account query reads a cached value',
      ],
      answer: 1,
      why: 'Async work queued in a test only runs at Test.stopTest(). Call Test.stopTest() after the insert and before the query, and the 120 points will be there.',
    }),
  ],
}

const blockedSave = {
  category: 'service',
  id: 'service-log-blocked-save',
  title: 'Who Blocked the Save?',
  blurb: 'Agents can’t save their Cases. Validation rule or flow? The debug log knows.',
  type: 'log',
  level: 1,
  rounds: [
    caseFile({
      q: 'Bluefin Telecom: an agent can’t close a Case and wants to know who is blocking the save.',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;WORKFLOW,INFO
10:22:14.001 (1007716)|EXECUTION_STARTED
10:22:14.001 (1025330)|CODE_UNIT_STARTED|[EXTERNAL]|TRIGGERS
10:22:14.002 (2118204)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Vv6X|CaseTrigger on Case trigger event BeforeUpdate|__sfdc_trigger/CaseTrigger
10:22:14.004 (4002871)|USER_DEBUG|[6]|DEBUG|CaseTrigger: status Working -> Closed, nothing to do
10:22:14.005 (5117302)|CODE_UNIT_FINISHED|CaseTrigger on Case trigger event BeforeUpdate
10:22:14.006 (6220318)|CODE_UNIT_FINISHED|TRIGGERS
10:22:14.007 (7004198)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Case:500Hn00001Ww7Y
10:22:14.007 (7118439)|VALIDATION_RULE|03dHn000000Xx8Z|Close_Needs_Root_Cause
»10:22:14.008 (8002176)|VALIDATION_FORMULA|ISPICKVAL(Status, "Closed") && ISBLANK(TEXT(Root_Cause__c))|Status=Closed , Root_Cause__c=null
»10:22:14.008 (8117220)|VALIDATION_FAIL
10:22:14.009 (9002871)|VALIDATION_RULE|03dHn000000Xx9A|Escalated_Needs_Manager
10:22:14.009 (9118320)|VALIDATION_FORMULA|IsEscalated && ISBLANK(Escalation_Manager__c)|IsEscalated=0 , Escalation_Manager__c=null
10:22:14.009 (9220871)|VALIDATION_PASS
10:22:14.010 (10004198)|CODE_UNIT_FINISHED|Validation:Case:500Hn00001Ww7Y
10:22:14.010 (10356001)|EXECUTION_FINISHED`,
      suspects: [
        'CaseTrigger',
        'The validation rule Escalated_Needs_Manager',
        'The validation rule Close_Needs_Root_Cause',
        'A record-triggered flow on Case',
      ],
      answer: 2,
      why: 'Close_Needs_Root_Cause is true (Status=Closed, Root_Cause__c empty) and fails; the other rule passes and the trigger does nothing. The agent needs to pick a root cause.',
    }),
    caseFile({
      q: 'Bluefin Telecom: a team lead tries to reopen an old Case and gets “You can’t do that”. No validation rule mentions reopening.',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;WORKFLOW,INFO
13:05:40.001 (1002298)|EXECUTION_STARTED
13:05:40.001 (1020871)|CODE_UNIT_STARTED|[EXTERNAL]|TRIGGERS
13:05:40.002 (2117302)|FLOW_START_INTERVIEWS_BEGIN|1
13:05:40.002 (2220318)|FLOW_START_INTERVIEW_BEGIN|300Hn00000Yy1B|Case - Before Save - Guard Status
13:05:40.003 (3004198)|FLOW_ELEMENT_BEGIN|FlowDecision|Was_Closed_Long_Ago
»13:05:40.003 (3118439)|FLOW_RULE_DETAIL|300Hn00000Yy1B|Closed_Over_7_Days|true
13:05:40.003 (3220871)|FLOW_ELEMENT_END|FlowDecision|Was_Closed_Long_Ago
13:05:40.004 (4002176)|FLOW_ELEMENT_BEGIN|FlowCustomError|Block_Late_Reopen
»13:05:40.004 (4117220)|FLOW_ELEMENT_ERROR|You can't do that: cases closed more than 7 days ago need a new case.|FlowCustomError|Block_Late_Reopen
13:05:40.004 (4220318)|FLOW_START_INTERVIEW_END|300Hn00000Yy1B|Case - Before Save - Guard Status
13:05:40.005 (5004198)|FLOW_START_INTERVIEWS_END|1
13:05:40.005 (5117302)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Case:500Hn00001Zz2C
13:05:40.005 (5220871)|VALIDATION_RULE|03dHn000000Xx8Z|Close_Needs_Root_Cause
13:05:40.006 (6002176)|VALIDATION_FORMULA|ISPICKVAL(Status, "Closed") && ISBLANK(TEXT(Root_Cause__c))|Status=Working , Root_Cause__c=Hardware
13:05:40.006 (6117220)|VALIDATION_PASS
13:05:40.006 (6220318)|CODE_UNIT_FINISHED|Validation:Case:500Hn00001Zz2C
13:05:40.007 (7004198)|CODE_UNIT_FINISHED|TRIGGERS
13:05:40.007 (7118439)|EXECUTION_FINISHED`,
      suspects: [
        'The validation rule Close_Needs_Root_Cause',
        'The before-save flow “Guard Status”, element Block_Late_Reopen',
        'The team lead can’t edit closed Cases',
        'CaseTrigger',
      ],
      answer: 1,
      why: 'The flow’s decision Closed_Over_7_Days is true, so it runs the Custom Error element Block_Late_Reopen; the validation rule passes. The policy is to open a new Case instead.',
    }),
    caseFile({
      q: 'Bluefin Telecom: Cases from the website form fail to save with “An unhandled fault has occurred in this flow”.',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;WORKFLOW,INFO
17:48:09.000 (512309)|USER_INFO|[EXTERNAL]|005Hn00000Bb4E|support-site@bluefin.example|(GMT+01:00) Central European Standard Time (Europe/Brussels)|GMT+01:00
17:48:09.001 (1004871)|EXECUTION_STARTED
17:48:09.001 (1022098)|CODE_UNIT_STARTED|[EXTERNAL]|TRIGGERS
17:48:09.002 (2118320)|FLOW_START_INTERVIEWS_BEGIN|1
17:48:09.002 (2220871)|FLOW_START_INTERVIEW_BEGIN|300Hn00000Aa3D|Case - After Save - Notify Account Owner
17:48:09.003 (3004117)|FLOW_ELEMENT_BEGIN|FlowRecordLookup|Get_Contact
17:48:09.006 (6118204)|SOQL_EXECUTE_BEGIN|[EXTERNAL]|Aggregations:0|SELECT Id, AccountId, Email FROM Contact WHERE Email = :tmpVar1 LIMIT 1
»17:48:09.008 (8002387)|SOQL_EXECUTE_END|[EXTERNAL]|Rows:0
17:48:09.008 (8117302)|FLOW_ELEMENT_END|FlowRecordLookup|Get_Contact
17:48:09.009 (9220318)|FLOW_ELEMENT_BEGIN|FlowActionCall|Send_Owner_Email
»17:48:09.010 (10004198)|FLOW_ELEMENT_ERROR|The flow failed to access the value for Get_Contact.Account.Owner.Email because it hasn't been set or assigned.|FlowActionCall|Send_Owner_Email
17:48:09.010 (10117220)|FLOW_ELEMENT_END|FlowActionCall|Send_Owner_Email
17:48:09.011 (11002871)|FLOW_START_INTERVIEW_END|300Hn00000Aa3D|Case - After Save - Notify Account Owner
17:48:09.011 (11118439)|FLOW_START_INTERVIEWS_END|1
17:48:09.012 (12220318)|CODE_UNIT_FINISHED|TRIGGERS
17:48:09.012 (12356001)|EXECUTION_FINISHED`,
      suspects: [
        'The site guest user can’t create Cases',
        'The email action is over its daily limit',
        'A validation rule on Case',
        'Get_Contact finds no Contact for the visitor, and the flow uses it anyway',
      ],
      answer: 3,
      why: 'The visitor’s email matches no Contact (Rows:0), so Send_Owner_Email can’t read Get_Contact.Account.Owner.Email. Add a Decision after Get_Contact and a fault path.',
    }),
    caseFile({
      q: 'Bluefin Telecom: escalating a Case fails with an error about the billing country. The agent never touched the Account.',
      log: `
61.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;WORKFLOW,INFO
09:31:55.001 (1006614)|EXECUTION_STARTED
09:31:55.001 (1024387)|CODE_UNIT_STARTED|[EXTERNAL]|TRIGGERS
09:31:55.002 (2117098)|FLOW_START_INTERVIEWS_BEGIN|1
09:31:55.002 (2220544)|FLOW_START_INTERVIEW_BEGIN|300Hn00000Cc5F|Case - After Save - Flag Account At Risk
09:31:55.003 (3004871)|FLOW_ELEMENT_BEGIN|FlowRecordUpdate|Update_Account_Risk
»09:31:55.004 (4117302)|DML_BEGIN|[EXTERNAL]|Op:Update|Type:Account|Rows:1
09:31:55.005 (5220318)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Account:001Hn00001Dd6G
09:31:55.005 (5331087)|VALIDATION_RULE|03dHn000000Ee7H|Billing_Country_Required
»09:31:55.006 (6004198)|VALIDATION_FORMULA|ISBLANK(BillingCountry)|BillingCountry=null
09:31:55.006 (6117220)|VALIDATION_FAIL
09:31:55.006 (6220871)|CODE_UNIT_FINISHED|Validation:Account:001Hn00001Dd6G
09:31:55.007 (7002176)|DML_END|[EXTERNAL]
09:31:55.007 (7117302)|FLOW_ELEMENT_ERROR|This error occurred when the flow tried to update records: FIELD_CUSTOM_VALIDATION_EXCEPTION: Add a billing country before saving this account.|FlowRecordUpdate|Update_Account_Risk
09:31:55.008 (8004198)|FLOW_START_INTERVIEW_END|300Hn00000Cc5F|Case - After Save - Flag Account At Risk
09:31:55.008 (8117220)|FLOW_START_INTERVIEWS_END|1
09:31:55.009 (9220318)|CODE_UNIT_FINISHED|TRIGGERS
09:31:55.009 (9356001)|EXECUTION_FINISHED`,
      suspects: [
        'A validation rule on Case',
        'The flow updates the Account, and the Account’s own validation rule fails',
        'The agent can’t edit the Account',
        'The escalation rule',
      ],
      answer: 1,
      why: 'The Case flow updates the parent Account, which has no billing country, so Billing_Country_Required fails and takes the Case save down with it. Fix the Account, or give the flow a fault path.',
    }),
  ],
}

const lockedRows = {
  category: 'datamodel',
  id: 'datamodel-log-locked-rows',
  title: 'Who Holds the Lock?',
  blurb: 'Saves fail on row locks and setup objects. Find the record everyone is fighting over.',
  type: 'log',
  level: 3,
  rounds: [
    caseFile({
      q: 'Marlowe Utilities: since the web signup went live, Contact saves fail at random with UNABLE_TO_LOCK_ROW, in the signup form and in the nightly batch alike.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
02:14:07.001 (1204411)|EXECUTION_STARTED
02:14:07.001 (1221873)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Gh2Kd|MeterContactBatch
02:14:07.003 (3110542)|SOQL_EXECUTE_BEGIN|[18]|Aggregations:0|SELECT Id, AccountId, Meter_Status__c FROM Contact WHERE Id IN :tmpVar1
02:14:07.019 (19008764)|SOQL_EXECUTE_END|[18]|Rows:200
»02:14:07.021 (21330187)|USER_DEBUG|[21]|DEBUG|Distinct parent Accounts in scope: 1 (001Hn00001Pq8ZA "Web Signups")
02:14:07.024 (24118009)|SOQL_EXECUTE_BEGIN|[24]|Aggregations:0|SELECT COUNT() FROM Contact WHERE AccountId = :parentId
02:14:07.611 (611220453)|SOQL_EXECUTE_END|[24]|Rows:1
»02:14:07.612 (612004871)|USER_DEBUG|[25]|DEBUG|Contacts under 001Hn00001Pq8ZA: 186412
02:14:07.614 (614227310)|USER_DEBUG|[29]|DEBUG|Meter_Status__c set to Read for 200 contacts
02:14:07.615 (615337209)|DML_BEGIN|[31]|Op:Update|Type:Contact|Rows:200
02:14:17.618 (10618220114)|DML_END|[31]
»02:14:17.619 (10619004398)|EXCEPTION_THROWN|[31]|System.DmlException: Update failed. First exception on row 0 with id 003Hn00002Ab3CDAA1; first error: UNABLE_TO_LOCK_ROW, unable to obtain exclusive access to this record or 1 records: 001Hn00001Pq8ZA: []
02:14:17.619 (10619223761)|FATAL_ERROR|System.DmlException: Update failed. First exception on row 0 with id 003Hn00002Ab3CDAA1; first error: UNABLE_TO_LOCK_ROW, unable to obtain exclusive access to this record or 1 records: 001Hn00001Pq8ZA: []
Class.MeterContactBatch.execute: line 31, column 1
02:14:17.620 (10620005218)|CUMULATIVE_LIMIT_USAGE
02:14:17.620 (10620005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 2 out of 200
  Number of DML statements: 1 out of 150
  Maximum CPU time: 344 out of 60000
02:14:17.620 (10620118342)|CUMULATIVE_LIMIT_USAGE_END
02:14:17.621 (10621220415)|CODE_UNIT_FINISHED|MeterContactBatch
02:14:17.621 (10621356001)|EXECUTION_FINISHED`,
      suspects: [
        'The batch scope of 200 records is too big',
        'A sharing rule on Contact',
        'Account data skew: 186,412 Contacts hang under one Account, so every save locks the same parent',
        'A validation rule on Contact',
      ],
      answer: 2,
      why: 'Every Contact save also locks its parent Account, and all of them share “Web Signups”, so the batch and the signup queue behind one record; the update waited 10 seconds and gave up. Spread the Contacts over more Accounts (Salesforce advises under 10,000 children per parent).',
    }),
    caseFile({
      q: 'Saltmarsh Wholesale: the nightly load of 40,000 invoice lines (Bulk API, parallel mode) fails in random batches. Rerun the failed rows on their own and they go through.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
01:30:52.001 (1102874)|EXECUTION_STARTED
01:30:52.001 (1120938)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Jk4Lm|InvoiceLineTrigger on Invoice_Line__c trigger event AfterInsert|__sfdc_trigger/InvoiceLineTrigger
01:30:52.002 (2207714)|USER_DEBUG|[4]|DEBUG|Lines in this chunk: 200
»01:30:52.003 (3301256)|USER_DEBUG|[9]|DEBUG|Parent invoices in this chunk: a05Hn00000Tt7QA, a05Hn00000Tt7QB, a05Hn00000Tt7QC
»01:30:52.004 (4118207)|USER_DEBUG|[10]|DEBUG|First line of a05Hn00000Tt7QB in this chunk: line 141
01:30:52.006 (6118430)|SOQL_EXECUTE_BEGIN|[12]|Aggregations:0|SELECT Id, Last_Line_Added__c FROM Invoice__c WHERE Id IN :tmpVar1
01:30:52.009 (9004417)|SOQL_EXECUTE_END|[12]|Rows:3
01:30:52.011 (11227803)|USER_DEBUG|[16]|DEBUG|Stamping Last_Line_Added__c on 3 invoices
01:30:52.012 (12330871)|DML_BEGIN|[18]|Op:Update|Type:Invoice__c|Rows:3
01:31:02.015 (10015221076)|DML_END|[18]
»01:31:02.016 (10016004871)|EXCEPTION_THROWN|[18]|System.DmlException: Update failed. First exception on row 1 with id a05Hn00000Tt7QBIAZ; first error: UNABLE_TO_LOCK_ROW, unable to obtain exclusive access to this record or 1 records: a05Hn00000Tt7QBIAZ: []
01:31:02.016 (10016223870)|FATAL_ERROR|System.DmlException: Update failed. First exception on row 1 with id a05Hn00000Tt7QBIAZ; first error: UNABLE_TO_LOCK_ROW, unable to obtain exclusive access to this record or 1 records: a05Hn00000Tt7QBIAZ: []
Trigger.InvoiceLineTrigger: line 18, column 1
01:31:02.017 (10017005218)|CUMULATIVE_LIMIT_USAGE
01:31:02.017 (10017005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 61 out of 10000
01:31:02.017 (10017118342)|CUMULATIVE_LIMIT_USAGE_END
01:31:02.018 (10018220415)|CODE_UNIT_FINISHED|InvoiceLineTrigger on Invoice_Line__c trigger event AfterInsert
01:31:02.018 (10018356001)|EXECUTION_FINISHED`,
      suspects: [
        'Two parallel batches hold lines of the same invoice, and both need to lock it',
        'Invoice__c has too many lines for its roll-up summary fields',
        'The trigger runs a SOQL query per line',
        'The integration user lost edit access to Invoice__c',
      ],
      answer: 0,
      why: 'Invoice a05Hn00000Tt7QB starts at line 141 in this chunk, so its first 140 lines sit in another batch running at the same moment. Both lock the same parent, one waits 10 seconds and fails. Sort the file by Invoice__c before the load, or use serial mode.',
    }),
    caseFile({
      q: 'Kestrel Aviation: marking an Employee__c record as “Left” should return their equipment and deactivate their Salesforce user. Instead the save fails.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
15:42:30.001 (1007712)|EXECUTION_STARTED
15:42:30.001 (1025338)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Mn5Op|EmployeeTrigger on Employee__c trigger event AfterUpdate|__sfdc_trigger/EmployeeTrigger
15:42:30.002 (2118204)|USER_DEBUG|[5]|DEBUG|Status changed to Left for 1 employee
15:42:30.004 (4220871)|SOQL_EXECUTE_BEGIN|[8]|Aggregations:0|SELECT Id, Returned__c FROM Equipment_Loan__c WHERE Employee__c IN :tmpVar1
15:42:30.006 (6002387)|SOQL_EXECUTE_END|[8]|Rows:3
15:42:30.007 (7117302)|DML_BEGIN|[10]|Op:Update|Type:Equipment_Loan__c|Rows:3
15:42:30.019 (19220318)|DML_END|[10]
15:42:30.021 (21004198)|SOQL_EXECUTE_BEGIN|[13]|Aggregations:0|SELECT Id, IsActive FROM User WHERE EmployeeNumber IN :tmpVar1
15:42:30.024 (24118439)|SOQL_EXECUTE_END|[13]|Rows:1
»15:42:30.025 (25220871)|DML_BEGIN|[16]|Op:Update|Type:User|Rows:1
15:42:30.026 (26002176)|DML_END|[16]
»15:42:30.026 (26117220)|EXCEPTION_THROWN|[16]|System.DmlException: Update failed. First exception on row 0 with id 005Hn00000Qr6PsIAJ; first error: MIXED_DML_OPERATION, DML operation on setup object is not permitted after you have updated a non-setup object (or vice versa): User, original object: Employee__c: []
15:42:30.026 (26330987)|FATAL_ERROR|System.DmlException: Update failed. First exception on row 0 with id 005Hn00000Qr6PsIAJ; first error: MIXED_DML_OPERATION, DML operation on setup object is not permitted after you have updated a non-setup object (or vice versa): User, original object: Employee__c: []
Trigger.EmployeeTrigger: line 16, column 1
15:42:30.027 (27005218)|CUMULATIVE_LIMIT_USAGE
15:42:30.027 (27005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 2 out of 100
  Number of DML statements: 2 out of 150
  Maximum CPU time: 37 out of 10000
15:42:30.027 (27118342)|CUMULATIVE_LIMIT_USAGE_END
15:42:30.028 (28220415)|CODE_UNIT_FINISHED|EmployeeTrigger on Employee__c trigger event AfterUpdate
15:42:30.028 (28356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Equipment_Loan__c update on line 10 failed',
        'The trigger updates a User, a setup object, in the same transaction as Employee__c',
        'The user is the last active System Administrator',
        'The trigger runs without sharing',
      ],
      answer: 1,
      why: 'User is a setup object, and Salesforce won’t mix setup and non-setup DML in one transaction; the Equipment_Loan__c update went through fine. Deactivate the User from a @future method or a Queueable, which runs in a transaction of its own.',
    }),
  ],
}

const leadConvert = {
  category: 'sales',
  id: 'sales-log-lead-convert',
  title: 'The Lead That Wouldn’t Convert',
  blurb: 'Leads refuse to convert and won deals breed twins. Read the log and name the culprit.',
  type: 'log',
  level: 1,
  rounds: [
    caseFile({
      q: 'Brackenridge Solar: the “Convert to deal” button now fails for every new Lead with an error about the next step.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;SYSTEM,DEBUG
10:15:22.001 (1006431)|EXECUTION_STARTED
10:15:22.001 (1024118)|CODE_UNIT_STARTED|[EXTERNAL]|apex://LeadConvertController/ACTION$convert
10:15:22.003 (3117652)|SOQL_EXECUTE_BEGIN|[8]|Aggregations:0|SELECT MasterLabel FROM LeadStatus WHERE IsConverted = TRUE LIMIT 1
10:15:22.005 (5002387)|SOQL_EXECUTE_END|[8]|Rows:1
10:15:22.006 (6220431)|USER_DEBUG|[12]|DEBUG|Converting 00QHn00000Kd2LmMAJ with status Closed - Converted
10:15:22.009 (9118204)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Account:new
10:15:22.009 (9220871)|VALIDATION_RULE|03dHn000000Fg1Hi|Account_Needs_Industry
10:15:22.010 (10004198)|VALIDATION_FORMULA|ISBLANK(TEXT(Industry))|Industry=Energy
10:15:22.010 (10117302)|VALIDATION_PASS
10:15:22.010 (10220318)|CODE_UNIT_FINISHED|Validation:Account:new
10:15:22.014 (14002176)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Opportunity:new
»10:15:22.014 (14117220)|VALIDATION_RULE|03dHn000000Fg2Jk|Next_Step_Required
»10:15:22.015 (15004871)|VALIDATION_FORMULA|ISBLANK(NextStep)|NextStep=null
10:15:22.015 (15118439)|VALIDATION_FAIL
10:15:22.015 (15220871)|CODE_UNIT_FINISHED|Validation:Opportunity:new
10:15:22.016 (16004417)|EXCEPTION_THROWN|[15]|System.DmlException: ConvertLead failed. First exception on row 0; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Fill in the next step before saving this opportunity.: [NextStep]
10:15:22.016 (16221090)|FATAL_ERROR|System.DmlException: ConvertLead failed. First exception on row 0; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Fill in the next step before saving this opportunity.: [NextStep]
Class.LeadConvertController.convert: line 15, column 1
10:15:22.017 (17005218)|CUMULATIVE_LIMIT_USAGE
10:15:22.017 (17005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 52 out of 10000
10:15:22.017 (17118342)|CUMULATIVE_LIMIT_USAGE_END
10:15:22.018 (18220415)|CODE_UNIT_FINISHED|apex://LeadConvertController/ACTION$convert
10:15:22.018 (18356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Account validation rule Account_Needs_Industry',
        'The Opportunity validation rule Next_Step_Required, which a brand-new deal can’t meet',
        'The converted status Closed - Converted is wrong',
        'The user can’t create Opportunities',
      ],
      answer: 1,
      why: 'With “Require Validation for Converted Leads” on, the new Opportunity has to pass its rules, and a deal fresh from conversion has no NextStep. The Account rule passes. Let new records through, for example with NOT(ISNEW()) in the rule.',
    }),
    caseFile({
      q: 'Brackenridge Solar: after an admin cleaned up the Lead statuses, the auto-convert for web Leads stopped working.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
08:52:40.001 (1003876)|EXECUTION_STARTED
08:52:40.001 (1021445)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Rs7Tu|LeadTrigger on Lead trigger event AfterInsert|__sfdc_trigger/LeadTrigger
08:52:40.002 (2117098)|USER_DEBUG|[6]|DEBUG|Web leads to auto-convert: 1
08:52:40.004 (4220544)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, Name FROM Account WHERE Name = :tmpVar1 LIMIT 1
08:52:40.007 (7004871)|SOQL_EXECUTE_END|[9]|Rows:1
08:52:40.008 (8117302)|USER_DEBUG|[11]|DEBUG|Matched existing Account 001Hn00001Wx3YZ
08:52:40.009 (9220318)|USER_DEBUG|[12]|DEBUG|lc.setAccountId(001Hn00001Wx3YZ), lc.setDoNotCreateOpportunity(false)
»08:52:40.009 (9331087)|USER_DEBUG|[14]|DEBUG|lc.setConvertedStatus('Qualified')
»08:52:40.012 (12004198)|EXCEPTION_THROWN|[16]|System.DmlException: ConvertLead failed. First exception on row 0; first error: INVALID_STATUS, invalid convertedStatus: Qualified: []
08:52:40.012 (12117220)|FATAL_ERROR|System.DmlException: ConvertLead failed. First exception on row 0; first error: INVALID_STATUS, invalid convertedStatus: Qualified: []
Trigger.LeadTrigger: line 16, column 1
08:52:40.013 (13005218)|CUMULATIVE_LIMIT_USAGE
08:52:40.013 (13005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 24 out of 10000
08:52:40.013 (13118342)|CUMULATIVE_LIMIT_USAGE_END
08:52:40.014 (14220415)|CODE_UNIT_FINISHED|LeadTrigger on Lead trigger event AfterInsert
08:52:40.014 (14356001)|EXECUTION_FINISHED`,
      suspects: [
        'The matched Account belongs to another owner',
        'The code hard-codes the status Qualified, which is no longer a converted status',
        'A validation rule on Lead',
        'The web Lead has no Company',
      ],
      answer: 1,
      why: 'setConvertedStatus() needs a Lead status marked as Converted, and after the clean-up Qualified isn’t one. Query LeadStatus WHERE IsConverted = TRUE instead of hard-coding the label.',
    }),
    caseFile({
      q: 'Brackenridge Solar: every deal marked Closed Won now creates two renewal Opportunities instead of one.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;WORKFLOW,INFO;SYSTEM,DEBUG
16:31:09.001 (1004982)|EXECUTION_STARTED
16:31:09.001 (1023117)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Uv8Wx|OpportunityTrigger on Opportunity trigger event AfterUpdate|__sfdc_trigger/OpportunityTrigger
16:31:09.003 (3118442)|USER_DEBUG|[7]|DEBUG|StageName = Closed Won (was Negotiation), creating renewal
16:31:09.005 (5002341)|DML_BEGIN|[12]|Op:Insert|Type:Opportunity|Rows:1
16:31:09.021 (21117820)|DML_END|[12]
16:31:09.022 (22004198)|CODE_UNIT_FINISHED|OpportunityTrigger on Opportunity trigger event AfterUpdate
16:31:09.024 (24003876)|FLOW_START_INTERVIEWS_BEGIN|1
16:31:09.024 (24551207)|FLOW_START_INTERVIEW_BEGIN|300Hn00000Gh4Ij|Opportunity - After Save - Stamp Won Date
16:31:09.025 (25002113)|FLOW_ELEMENT_BEGIN|FlowRecordUpdate|Update_Won_Date
»16:31:09.026 (26220876)|DML_BEGIN|[EXTERNAL]|Op:Update|Type:Opportunity|Rows:1
16:31:09.027 (27004417)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Uv8Wx|OpportunityTrigger on Opportunity trigger event AfterUpdate|__sfdc_trigger/OpportunityTrigger
»16:31:09.028 (28221090)|USER_DEBUG|[7]|DEBUG|StageName = Closed Won (was Closed Won), creating renewal
16:31:09.030 (30005218)|DML_BEGIN|[12]|Op:Insert|Type:Opportunity|Rows:1
16:31:09.044 (44118342)|DML_END|[12]
16:31:09.045 (45220415)|CODE_UNIT_FINISHED|OpportunityTrigger on Opportunity trigger event AfterUpdate
16:31:09.046 (46002387)|DML_END|[EXTERNAL]
16:31:09.046 (46117302)|FLOW_ELEMENT_END|FlowRecordUpdate|Update_Won_Date
16:31:09.047 (47220318)|FLOW_START_INTERVIEW_END|300Hn00000Gh4Ij|Opportunity - After Save - Stamp Won Date
16:31:09.047 (47331087)|FLOW_START_INTERVIEWS_END|1
16:31:09.048 (48356001)|EXECUTION_FINISHED`,
      suspects: [
        'Two reps closed the deal at the same time',
        'A duplicate rule on Opportunity',
        'The flow’s update fires the trigger again, and the trigger only checks the current stage',
        'The renewal Opportunity fires the trigger on insert',
      ],
      answer: 2,
      why: 'The after-save flow updates the same Opportunity, which runs OpportunityTrigger a second time, and the debug shows the stage was already Closed Won. Create the renewal only when the stage changes to Closed Won: compare with Trigger.oldMap.',
    }),
  ],
}

const quoteSave = {
  category: 'cpq',
  id: 'cpq-log-quote-save',
  title: 'Quote Save Saboteurs',
  blurb: 'CPQ quotes won’t save. Tell the package apart from your own automation and name the culprit.',
  type: 'log',
  level: 2,
  rounds: [
    caseFile({
      q: 'Granite Peak Robotics: reps can’t save any quote that includes the Pro Starter bundle. The calculator finishes, then the save fails.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;SYSTEM,DEBUG
11:48:03.001 (1004982)|EXECUTION_STARTED
11:48:03.002 (2117302)|ENTERING_MANAGED_PKG|SBQQ
11:48:03.004 (4220318)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Ab2Cd|QuoteLineTrigger on SBQQ__QuoteLine__c trigger event BeforeInsert|__sfdc_trigger/QuoteLineTrigger
11:48:03.005 (5004198)|USER_DEBUG|[6]|DEBUG|Line 1 of 3: PS-BASE Pro Starter, SBQQ__Bundled__c=false
»11:48:03.005 (5117220)|USER_DEBUG|[6]|DEBUG|Line 2 of 3: PS-SENSOR Sensor Kit, SBQQ__Bundled__c=true, SBQQ__RequiredBy__c=Line 1
11:48:03.005 (5220871)|USER_DEBUG|[6]|DEBUG|Line 3 of 3: SVC-ONBOARD Onboarding, SBQQ__Bundled__c=false
11:48:03.006 (6002176)|CODE_UNIT_FINISHED|QuoteLineTrigger on SBQQ__QuoteLine__c trigger event BeforeInsert
11:48:03.007 (7117302)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:SBQQ__QuoteLine__c:new
11:48:03.007 (7220318)|VALIDATION_RULE|03dHn000000Kl3Mn|Max_Discount_30
11:48:03.008 (8004198)|VALIDATION_FORMULA|SBQQ__NetPrice__c < SBQQ__ListPrice__c * 0.7|SBQQ__NetPrice__c=4200 , SBQQ__ListPrice__c=4800
11:48:03.008 (8117220)|VALIDATION_PASS
11:48:03.008 (8220871)|CODE_UNIT_FINISHED|Validation:SBQQ__QuoteLine__c:new
11:48:03.009 (9002176)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:SBQQ__QuoteLine__c:new
11:48:03.009 (9117302)|VALIDATION_RULE|03dHn000000Kl3Mn|Max_Discount_30
»11:48:03.010 (10004198)|VALIDATION_FORMULA|SBQQ__NetPrice__c < SBQQ__ListPrice__c * 0.7|SBQQ__NetPrice__c=0 , SBQQ__ListPrice__c=450
11:48:03.010 (10117220)|VALIDATION_FAIL
11:48:03.010 (10220871)|CODE_UNIT_FINISHED|Validation:SBQQ__QuoteLine__c:new
11:48:03.011 (11004417)|EXCEPTION_THROWN|[EXTERNAL]|System.DmlException: Insert failed. First exception on row 1; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Discounts over 30% need approval.: []
11:48:03.011 (11221090)|FATAL_ERROR|System.DmlException: Insert failed. First exception on row 1; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Discounts over 30% need approval.: []
11:48:03.012 (12005218)|CUMULATIVE_LIMIT_USAGE
11:48:03.012 (12005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 100
  Number of DML statements: 0 out of 150
  Maximum CPU time: 212 out of 10000
11:48:03.012 (12118342)|CUMULATIVE_LIMIT_USAGE_END
11:48:03.013 (13356001)|EXECUTION_FINISHED`,
      suspects: [
        'A price rule set the Sensor Kit’s price to 0',
        'The validation rule Max_Discount_30 doesn’t skip bundled components, which are priced at 0',
        'The Quote Calculator Plugin',
        'The custom QuoteLineTrigger',
      ],
      answer: 1,
      why: 'The Sensor Kit is a bundled component (SBQQ__Bundled__c = true), so its price is included in the bundle and its net price is 0. The rule reads that as a 100% discount. Add NOT(SBQQ__Bundled__c) to the rule; the trigger only logs.',
    }),
    caseFile({
      q: 'Granite Peak Robotics: ticking Primary on a quote fails with an error about a “revenue type”. There’s no such field on the quote.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;SYSTEM,DEBUG
14:20:37.001 (1008763)|EXECUTION_STARTED
14:20:37.002 (2026214)|ENTERING_MANAGED_PKG|SBQQ
14:20:37.004 (4117903)|DML_BEGIN|[EXTERNAL]|Op:Insert|Type:OpportunityLineItem|Rows:4
14:20:37.005 (5002871)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000St5Uv|OpportunityLineItemTrigger on OpportunityLineItem trigger event BeforeInsert|__sfdc_trigger/OpportunityLineItemTrigger
14:20:37.006 (6118320)|USER_DEBUG|[4]|DEBUG|Products synced from quote a0zHn00000Xy7Za: 4
14:20:37.006 (6220871)|USER_DEBUG|[8]|DEBUG|Margin__c copied for 4 products
14:20:37.007 (7004198)|CODE_UNIT_FINISHED|OpportunityLineItemTrigger on OpportunityLineItem trigger event BeforeInsert
14:20:37.007 (7117302)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:OpportunityLineItem:new
»14:20:37.008 (8002176)|VALIDATION_RULE|03dHn000000Wx6Yz|Revenue_Type_Required
»14:20:37.008 (8117220)|VALIDATION_FORMULA|ISBLANK(TEXT(Revenue_Type__c))|Revenue_Type__c=null
14:20:37.008 (8220318)|VALIDATION_FAIL
14:20:37.009 (9004198)|CODE_UNIT_FINISHED|Validation:OpportunityLineItem:new
14:20:37.009 (9118439)|DML_END|[EXTERNAL]
»14:20:37.010 (10221087)|EXCEPTION_THROWN|[EXTERNAL]|System.DmlException: Insert failed. First exception on row 0; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Choose a revenue type for every product.: [Revenue_Type__c]
14:20:37.010 (10442190)|FATAL_ERROR|System.DmlException: Insert failed. First exception on row 0; first error: FIELD_CUSTOM_VALIDATION_EXCEPTION, Choose a revenue type for every product.: [Revenue_Type__c]
14:20:37.011 (11005218)|CUMULATIVE_LIMIT_USAGE
14:20:37.011 (11005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 0 out of 100
  Number of DML statements: 0 out of 150
  Maximum CPU time: 96 out of 10000
14:20:37.011 (11118342)|CUMULATIVE_LIMIT_USAGE_END
14:20:37.012 (12356001)|EXECUTION_FINISHED`,
      suspects: [
        'A validation rule on the quote',
        'A validation rule on Opportunity Product, hit when CPQ syncs the primary quote’s lines',
        'The custom OpportunityLineItemTrigger',
        'The rep can’t edit the Opportunity',
      ],
      answer: 1,
      why: 'A primary quote syncs its lines to Opportunity products, and Revenue_Type_Required fails on those new products. Nothing on the quote line feeds Revenue_Type__c: add a twin field with the same API name and type on the quote line so CPQ copies it, or relax the rule.',
    }),
    caseFile({
      q: 'Granite Peak Robotics: a one-off batch that fills a new Region__c field on 2,000 quotes dies on its first chunk with a CPU timeout. The batch itself does almost nothing.',
      log: `
64.0 APEX_CODE,DEBUG;APEX_PROFILING,INFO;DB,INFO;SYSTEM,DEBUG
19:05:12.001 (1003387)|EXECUTION_STARTED
19:05:12.001 (1021109)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Yz7Ab|QuoteRegionBatch
19:05:12.003 (3220318)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, SBQQ__Account__r.BillingCountry FROM SBQQ__Quote__c WHERE Id IN :tmpVar1
19:05:12.041 (41117220)|SOQL_EXECUTE_END|[9]|Rows:200
»19:05:12.213 (213002871)|USER_DEBUG|[14]|DEBUG|Region__c set in memory for 200 quotes, CPU so far: 212 ms
»19:05:12.214 (214118439)|DML_BEGIN|[16]|Op:Update|Type:SBQQ__Quote__c|Rows:200
19:05:12.215 (215220871)|ENTERING_MANAGED_PKG|SBQQ
19:05:31.880 (19880004198)|ENTERING_MANAGED_PKG|SBQQ
19:05:52.461 (40461117302)|ENTERING_MANAGED_PKG|SBQQ
19:06:12.197 (60197013002)|ENTERING_MANAGED_PKG|SBQQ
19:06:12.203 (60203221087)|EXCEPTION_THROWN|[EXTERNAL]|System.LimitException: SBQQ:Apex CPU time limit exceeded
»19:06:12.203 (60203442190)|FATAL_ERROR|System.LimitException: SBQQ:Apex CPU time limit exceeded
Class.QuoteRegionBatch.execute: line 16, column 1
19:06:12.204 (60204005218)|CUMULATIVE_LIMIT_USAGE
19:06:12.204 (60204005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 200
  Number of DML statements: 1 out of 150
  Maximum CPU time: 60008 out of 60000 ******* CLOSE TO LIMIT
19:06:12.204 (60204118342)|CUMULATIVE_LIMIT_USAGE_END
19:06:12.205 (60205220415)|CODE_UNIT_FINISHED|QuoteRegionBatch
19:06:12.205 (60205356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Account lookup in the batch’s query',
        'The loop that sets Region__c',
        'CPQ’s own quote triggers, run for all 200 quotes in one update',
        'The batch runs synchronous limits instead of async ones',
      ],
      answer: 2,
      why: 'The batch’s own work took 212 ms; the rest went into the CPQ package, as the SBQQ: prefix on the error shows. For a field CPQ doesn’t price on, switch CPQ’s triggers off around the update with SBQQ.TriggerControl.disable() and enable(), or lower the batch scope.',
    }),
  ],
}

const slaClock = {
  category: 'service',
  id: 'service-log-sla-clock',
  title: 'The Missing SLA',
  blurb: 'Milestones that never start or never stop, and Cases that skip the queue. Find out why.',
  type: 'log',
  level: 2,
  rounds: [
    caseFile({
      q: 'Amberly Water: Cases from Rivergate Council no longer get any SLA milestones. Cases from other customers do.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;SYSTEM,DEBUG
09:12:44.001 (1004871)|EXECUTION_STARTED
09:12:44.001 (1022098)|CODE_UNIT_STARTED|[EXTERNAL]|TRIGGERS
09:12:44.002 (2118320)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Bc3De|CaseTrigger on Case trigger event BeforeInsert|__sfdc_trigger/CaseTrigger
09:12:44.003 (3220871)|USER_DEBUG|[5]|DEBUG|New case for Account 001Hn00001Rg5Ct (Rivergate Council)
09:12:44.005 (5004117)|SOQL_EXECUTE_BEGIN|[9]|Aggregations:0|SELECT Id, Name, Status, EndDate, SlaProcessId FROM Entitlement WHERE AccountId IN :tmpVar1
09:12:44.008 (8118204)|SOQL_EXECUTE_END|[9]|Rows:1
»09:12:44.009 (9002387)|USER_DEBUG|[12]|DEBUG|Entitlement 550Hn000000Ft6Gu "Gold Support": Status=Expired, EndDate=2026-09-30
»09:12:44.009 (9117302)|USER_DEBUG|[16]|DEBUG|No active entitlement, EntitlementId left blank
09:12:44.010 (10220318)|CODE_UNIT_FINISHED|CaseTrigger on Case trigger event BeforeInsert
09:12:44.011 (11004198)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Case:new
09:12:44.011 (11117220)|VALIDATION_RULE|03dHn000000Xx8Z|Close_Needs_Root_Cause
09:12:44.012 (12002871)|VALIDATION_FORMULA|ISPICKVAL(Status, "Closed") && ISBLANK(TEXT(Root_Cause__c))|Status=New , Root_Cause__c=null
09:12:44.012 (12118439)|VALIDATION_PASS
09:12:44.012 (12220871)|CODE_UNIT_FINISHED|Validation:Case:new
09:12:44.014 (14002176)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Bc3De|CaseTrigger on Case trigger event AfterInsert|__sfdc_trigger/CaseTrigger
09:12:44.015 (15117302)|USER_DEBUG|[24]|DEBUG|Case 500Hn00001Gh7Iv saved, EntitlementId=null
09:12:44.015 (15220318)|CODE_UNIT_FINISHED|CaseTrigger on Case trigger event AfterInsert
09:12:44.016 (16004198)|CODE_UNIT_FINISHED|TRIGGERS
09:12:44.016 (16118439)|EXECUTION_FINISHED`,
      suspects: [
        'The entitlement process was deactivated',
        'Rivergate’s only entitlement ended on 30 September, so the Case gets no entitlement',
        'The validation rule Close_Needs_Root_Cause',
        'Milestones only start once a Case is assigned to an agent',
      ],
      answer: 1,
      why: 'Milestones only run on a Case linked to an entitlement with an entitlement process. Gold Support ended on 2026-09-30 and now shows Expired, so the trigger leaves EntitlementId empty. Renew the entitlement with a new end date.',
    }),
    caseFile({
      q: 'Amberly Water: Cases sent in through the partner API land on the integration user and never reach the Tier 1 queue. Cases from the website are routed fine.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;VALIDATION,INFO;SYSTEM,DEBUG
13:40:05.001 (1006614)|EXECUTION_STARTED
13:40:05.001 (1024387)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Hj7Kl|PartnerCaseResource.createCase()
13:40:05.002 (2117098)|USER_DEBUG|[18]|DEBUG|Partner case: subject "Leak at meter 4471", priority High
13:40:05.004 (4220544)|SOQL_EXECUTE_BEGIN|[21]|Aggregations:0|SELECT Id, AccountId FROM Contact WHERE Email = :tmpVar1 LIMIT 1
13:40:05.007 (7004871)|SOQL_EXECUTE_END|[21]|Rows:1
»13:40:05.008 (8117302)|USER_DEBUG|[24]|DEBUG|DMLOptions: none, inserting with default options
13:40:05.009 (9220318)|DML_BEGIN|[25]|Op:Insert|Type:Case|Rows:1
13:40:05.010 (10331087)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Bc3De|CaseTrigger on Case trigger event BeforeInsert|__sfdc_trigger/CaseTrigger
13:40:05.011 (11004198)|USER_DEBUG|[30]|DEBUG|CaseTrigger: OwnerId untouched
13:40:05.011 (11117220)|CODE_UNIT_FINISHED|CaseTrigger on Case trigger event BeforeInsert
13:40:05.012 (12220871)|CODE_UNIT_STARTED|[EXTERNAL]|Validation:Case:new
13:40:05.012 (12331087)|VALIDATION_RULE|03dHn000000Xx8Z|Close_Needs_Root_Cause
13:40:05.013 (13002176)|VALIDATION_FORMULA|ISPICKVAL(Status, "Closed") && ISBLANK(TEXT(Root_Cause__c))|Status=New , Root_Cause__c=null
13:40:05.013 (13117302)|VALIDATION_PASS
13:40:05.013 (13220871)|CODE_UNIT_FINISHED|Validation:Case:new
13:40:05.031 (31004198)|DML_END|[25]
13:40:05.033 (33117220)|SOQL_EXECUTE_BEGIN|[27]|Aggregations:0|SELECT OwnerId, Owner.Name FROM Case WHERE Id = :newCaseId
13:40:05.035 (35002871)|SOQL_EXECUTE_END|[27]|Rows:1
»13:40:05.036 (36118439)|USER_DEBUG|[28]|DEBUG|Case 500Hn00001Lm8No owner: Partner Integration (005Hn00000Jk9Lm)
13:40:05.037 (37220871)|CODE_UNIT_FINISHED|PartnerCaseResource.createCase()
13:40:05.037 (37356001)|EXECUTION_FINISHED`,
      suspects: [
        'The assignment rule has no entry for partner Cases',
        'CaseTrigger overwrites the owner',
        'Omni-Channel is offline for Tier 1',
        'An Apex insert doesn’t run the case assignment rule unless DMLOptions ask for it',
      ],
      answer: 3,
      why: 'Web-to-Case applies the default assignment rule; an Apex insert keeps the running user as owner unless told otherwise. Set dmlOptions.assignmentRuleHeader.useDefaultRule = true and pass it with setOptions() before the insert.',
    }),
    caseFile({
      q: 'Amberly Water: agents answer customers by email within the hour, yet the First Response milestone stays open until it is violated.',
      log: `
64.0 APEX_CODE,DEBUG;DB,INFO;SYSTEM,DEBUG
10:05:18.001 (1002298)|EXECUTION_STARTED
10:05:18.001 (1020871)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Pq9Rs|EmailMessageTrigger on EmailMessage trigger event AfterInsert|__sfdc_trigger/EmailMessageTrigger
10:05:18.002 (2117302)|USER_DEBUG|[6]|DEBUG|Outgoing email on case 500Hn00001St2Uv, Incoming=false
10:05:18.003 (3220318)|SOQL_EXECUTE_BEGIN|[8]|Aggregations:0|SELECT MilestoneType.Name, TargetDate FROM CaseMilestone WHERE CaseId IN :caseIds AND IsCompleted = FALSE
10:05:18.005 (5004198)|SOQL_EXECUTE_END|[8]|Rows:2
»10:05:18.005 (5118439)|USER_DEBUG|[9]|DEBUG|Open milestones on case: First Reply (target 10:30), Resolution (target 17:00)
10:05:18.006 (6220871)|METHOD_ENTRY|[11]|01pHn00000Tu3Vw|MilestoneUtils.completeMilestone(List<Id>, String, Datetime)
»10:05:18.006 (6331087)|USER_DEBUG|[14]|DEBUG|milestoneName = First Response
10:05:18.007 (7002176)|SOQL_EXECUTE_BEGIN|[16]|Aggregations:0|SELECT Id, CompletionDate FROM CaseMilestone cm WHERE CaseId IN :caseIds AND cm.MilestoneType.Name = :milestoneName AND CompletionDate = null LIMIT 1
10:05:18.009 (9117220)|SOQL_EXECUTE_END|[16]|Rows:0
10:05:18.009 (9220318)|USER_DEBUG|[18]|DEBUG|No open milestone found, nothing to complete
10:05:18.010 (10004198)|METHOD_EXIT|[11]|01pHn00000Tu3Vw|MilestoneUtils.completeMilestone(List<Id>, String, Datetime)
10:05:18.010 (10117302)|CUMULATIVE_LIMIT_USAGE
10:05:18.010 (10117302)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 2 out of 100
  Number of DML statements: 0 out of 150
  Maximum CPU time: 18 out of 10000
10:05:18.010 (10220871)|CUMULATIVE_LIMIT_USAGE_END
10:05:18.011 (11004198)|CODE_UNIT_FINISHED|EmailMessageTrigger on EmailMessage trigger event AfterInsert
10:05:18.011 (11118439)|EXECUTION_FINISHED`,
      suspects: [
        'The code looks for “First Response”, but the milestone is now called “First Reply”',
        'Outgoing emails don’t fire EmailMessage triggers',
        'The agent can’t edit CaseMilestone records',
        'The email went out after the target time',
      ],
      answer: 0,
      why: 'The trigger fires and finds two open milestones, but completeMilestone() filters on the name First Response, and the milestone was renamed First Reply, so it matches nothing (Rows:0). Fix the name, and keep it in custom metadata rather than in code.',
    }),
  ],
}

const sandboxOnly = {
  category: 'deployment',
  id: 'deployment-log-sandbox-only',
  title: 'Works in My Sandbox',
  blurb: 'Tests that only pass where they were written. The logs show what the test or the target org is missing.',
  type: 'log',
  level: 1,
  rounds: [
    caseFile({
      q: 'Wrenfield Freight: CarrierSyncTest fails with a null pointer. The developer says the endpoint is set up in a custom setting.',
      log: `
64.0 APEX_CODE,FINE;APEX_PROFILING,INFO;DB,INFO;SYSTEM,DEBUG
21:10:03.001 (1003387)|EXECUTION_STARTED
21:10:03.001 (1021109)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Ab1Cd|CarrierSyncTest.sendsShipment()
21:10:03.003 (3220318)|DML_BEGIN|[9]|Op:Insert|Type:Shipment__c|Rows:1
21:10:03.019 (19117220)|DML_END|[9]
21:10:03.020 (20002871)|USER_DEBUG|[10]|DEBUG|Test.setMock(HttpCalloutMock.class, new CarrierMock())
21:10:03.021 (21118439)|USER_DEBUG|[11]|DEBUG|Test.startTest()
21:10:03.022 (22220871)|METHOD_ENTRY|[12]|01pHn00000Ef2Gh|CarrierSync.send(Id)
21:10:03.023 (23004198)|SOQL_EXECUTE_BEGIN|[15]|Aggregations:0|SELECT Id, Weight_Kg__c FROM Shipment__c WHERE Id = :shipmentId
21:10:03.025 (25117302)|SOQL_EXECUTE_END|[15]|Rows:1
»21:10:03.026 (26220318)|USER_DEBUG|[20]|DEBUG|Carrier_Settings__c.getOrgDefaults(): Id=null, Endpoint__c=null
21:10:03.026 (26331087)|EXCEPTION_THROWN|[22]|System.NullPointerException: Attempt to de-reference a null object
21:10:03.026 (26442190)|FATAL_ERROR|System.NullPointerException: Attempt to de-reference a null object
Class.CarrierSync.send: line 22, column 1
Class.CarrierSyncTest.sendsShipment: line 12, column 1
21:10:03.027 (27005218)|CUMULATIVE_LIMIT_USAGE
21:10:03.027 (27005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Number of callouts: 0 out of 100
21:10:03.027 (27118342)|CUMULATIVE_LIMIT_USAGE_END
21:10:03.028 (28220415)|CODE_UNIT_FINISHED|CarrierSyncTest.sendsShipment()
21:10:03.028 (28356001)|EXECUTION_FINISHED`,
      suspects: [
        'The callout mock is missing',
        'Custom setting records are data, and the test never creates one',
        'Remote Site Settings are missing in the target org',
        'The Shipment__c insert failed',
      ],
      answer: 1,
      why: 'A test sees no org data, and custom setting records are data, so getOrgDefaults() comes back empty and Endpoint__c is null. Insert a Carrier_Settings__c record in the test, or move the endpoint to custom metadata, which tests can read.',
    }),
    caseFile({
      q: 'Wrenfield Freight: the release adds a pluggable notification framework. Every test that saves a Shipment passes in the sandbox and fails in production.',
      log: `
64.0 APEX_CODE,FINE;DB,INFO;SYSTEM,DEBUG
21:14:47.001 (1009821)|EXECUTION_STARTED
21:14:47.001 (1027663)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Ij3Kl|ShipmentServiceTest.marksDelivered()
21:14:47.003 (3118204)|DML_BEGIN|[10]|Op:Insert|Type:Shipment__c|Rows:1
21:14:47.005 (5002387)|CODE_UNIT_STARTED|[EXTERNAL]|01qHn000000Mn4Op|ShipmentTrigger on Shipment__c trigger event AfterInsert|__sfdc_trigger/ShipmentTrigger
21:14:47.006 (6330876)|SOQL_EXECUTE_BEGIN|[7]|Aggregations:0|SELECT DeveloperName, Handler_Class__c FROM Notifier__mdt WHERE Active__c = TRUE
21:14:47.008 (8004117)|SOQL_EXECUTE_END|[7]|Rows:1
»21:14:47.009 (9220871)|USER_DEBUG|[9]|DEBUG|Loading notifier class: ChatShipmentNotifier
»21:14:47.009 (9331087)|USER_DEBUG|[11]|DEBUG|Type.forName('ChatShipmentNotifier') = null
21:14:47.010 (10118449)|EXCEPTION_THROWN|[12]|System.NullPointerException: Attempt to de-reference a null object
21:14:47.010 (10220871)|CODE_UNIT_FINISHED|ShipmentTrigger on Shipment__c trigger event AfterInsert
21:14:47.011 (11002176)|DML_END|[10]
21:14:47.011 (11117302)|EXCEPTION_THROWN|[10]|System.DmlException: Insert failed. First exception on row 0; first error: CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY, ShipmentTrigger: execution of AfterInsert caused by: System.NullPointerException: Attempt to de-reference a null object: Trigger.ShipmentTrigger: line 12, column 1: []
21:14:47.011 (11337120)|FATAL_ERROR|System.DmlException: Insert failed. First exception on row 0; first error: CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY, ShipmentTrigger: execution of AfterInsert caused by: System.NullPointerException: Attempt to de-reference a null object: Trigger.ShipmentTrigger: line 12, column 1: []
Class.ShipmentServiceTest.marksDelivered: line 10, column 1
21:14:47.012 (12005218)|CUMULATIVE_LIMIT_USAGE
21:14:47.012 (12005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 27 out of 10000
21:14:47.012 (12118342)|CUMULATIVE_LIMIT_USAGE_END
21:14:47.013 (13356001)|EXECUTION_FINISHED`,
      suspects: [
        'The Notifier__mdt record names a class that wasn’t part of the deployment',
        'Tests can’t read custom metadata',
        'The test needs SeeAllData=true',
        'The Shipment__c insert hit a validation rule',
      ],
      answer: 0,
      why: 'Type.forName() returns null when no class has that name. The Notifier__mdt record was deployed, but the ChatShipmentNotifier class it names was left out, and the compiler can’t link a class name stored in data. Add the class to the package, and null-check the Type.',
    }),
    caseFile({
      q: 'Wrenfield Freight: EscalationServiceTest passes in the sandbox but fails when the release is validated against production.',
      log: `
64.0 APEX_CODE,FINE;DB,INFO;SYSTEM,DEBUG
21:18:22.001 (1003876)|EXECUTION_STARTED
21:18:22.001 (1021445)|CODE_UNIT_STARTED|[EXTERNAL]|01pHn00000Qr5St|EscalationServiceTest.movesLateShipmentsToQueue()
21:18:22.003 (3117098)|DML_BEGIN|[11]|Op:Insert|Type:Shipment__c|Rows:3
21:18:22.021 (21220544)|DML_END|[11]
21:18:22.022 (22004871)|USER_DEBUG|[13]|DEBUG|Test.startTest()
21:18:22.023 (23117302)|METHOD_ENTRY|[14]|01pHn00000Uv6Wx|EscalationService.escalate(List<Id>)
21:18:22.024 (24220318)|USER_DEBUG|[6]|DEBUG|Late shipments to escalate: 3
»21:18:22.025 (25331087)|SOQL_EXECUTE_BEGIN|[8]|Aggregations:0|SELECT Id FROM Group WHERE Type = 'Queue' AND DeveloperName = 'Late_Shipments' LIMIT 1
»21:18:22.027 (27004198)|SOQL_EXECUTE_END|[8]|Rows:0
21:18:22.027 (27117220)|EXCEPTION_THROWN|[8]|System.QueryException: List has no rows for assignment to SObject
21:18:22.027 (27220871)|FATAL_ERROR|System.QueryException: List has no rows for assignment to SObject
Class.EscalationService.escalate: line 8, column 1
Class.EscalationServiceTest.movesLateShipmentsToQueue: line 14, column 1
21:18:22.028 (28005218)|CUMULATIVE_LIMIT_USAGE
21:18:22.028 (28005218)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 1 out of 100
  Number of DML statements: 1 out of 150
  Maximum CPU time: 31 out of 10000
21:18:22.028 (28118342)|CUMULATIVE_LIMIT_USAGE_END
21:18:22.029 (29220415)|CODE_UNIT_FINISHED|EscalationServiceTest.movesLateShipmentsToQueue()
21:18:22.029 (29356001)|EXECUTION_FINISHED`,
      suspects: [
        'Tests can’t see queues',
        'The test user isn’t a member of the queue',
        'The Late_Shipments queue wasn’t part of the release, so production doesn’t have it',
        'The Shipment__c insert failed',
      ],
      answer: 2,
      why: 'Queues are setup records, which a test can see without SeeAllData. The query returns 0 rows because production has no Late_Shipments queue yet. Add the Queue, with Shipment__c as a supported object, to the package.',
    }),
  ],
}

export default { games: [soqlStakeout, cpuHeap, calloutFiles, afterDark, redBuild, blockedSave, lockedRows, leadConvert, quoteSave, slaClock, sandboxOnly] }

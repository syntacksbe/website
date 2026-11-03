// Data model games for the Syntacks Arcade (format: src/arcade/format.js).
export default {
  id: 'datamodel',
  title: 'Data model',
  icon: '🏛️',
  blurb: 'Objects, relationships and sharing: build a schema that still stands at a million records.',
  games: [
    // ── Level 1 ─────────────────────────────────────────────────────────────
    {
      id: 'datamodel-lookup-or-master',
      title: 'Lookup or master?',
      blurb: 'Pick the relationship that fits each brief.',
      type: 'sort',
      level: 1,
      buckets: ['Lookup', 'Master-detail'],
      rounds: [
        {
          text: 'Invoice lines must disappear when their invoice is deleted.',
          bucket: 1,
          why: 'Master-detail deletes the children with the parent (cascade delete), and lines never exist without an invoice.',
        },
        {
          text: 'A Project (custom object) needs a native roll-up summary that counts its Tasks (custom object).',
          bucket: 1,
          why: 'Between custom objects, roll-up summary fields only work on the master side of a master-detail relationship.',
        },
        {
          text: 'Ticket comments should be visible exactly to the people who can see the ticket.',
          bucket: 1,
          why: 'Detail records inherit sharing and security from their master, so access follows the ticket automatically.',
        },
        {
          text: 'Child records need their own owner and their own org-wide default.',
          bucket: 0,
          why: 'Detail records have no owner and no sharing setting of their own. A lookup keeps the child fully independent.',
        },
        {
          text: 'An expense report points to the User who approved it.',
          bucket: 0,
          why: 'User can never be the master in a master-detail relationship, so a lookup to User is the way.',
        },
        {
          text: 'A child record may be saved without a parent and linked later.',
          bucket: 0,
          why: 'Master-detail always requires a parent. Only a lookup can be left empty.',
        },
        {
          text: 'The object already has two master-detail fields and needs a third parent link.',
          bucket: 0,
          why: 'An object can have at most two master-detail relationships. Any extra parent has to be a lookup.',
        },
        {
          text: 'Deleting the parent should keep the children and just clear the link.',
          bucket: 0,
          why: 'A lookup can clear its value when the parent is deleted. Master-detail would delete the children too.',
        },
      ],
    },
    {
      id: 'datamodel-object-basics',
      title: 'Object spawn point',
      blurb: 'Standard, custom, junction: choose the right building block.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'Students can join many Courses and Courses have many Students. How do you model that?',
          options: [
            'A junction object with a master-detail to Student and one to Course',
            'A multi-select picklist of course names on Student',
            'A lookup from Course to Student',
            'A text field on Course listing student names',
          ],
          answer: 0,
          why: 'Many-to-many needs a junction object in the middle, here Enrollment. Each Enrollment row links one Student to one Course.',
        },
        {
          q: 'You create a new object for fleet vehicles. Which suffix does its API name get?',
          options: ['__r', '__c', '__x', '__b'],
          answer: 1,
          why: "Custom objects and fields end in __c; standard objects like Account have no suffix. __r is a relationship name in queries, __x an external object, __b a big object.",
        },
        {
          q: 'Two support teams use Case but need different page layouts and different Status values. What do you add?',
          options: [
            'A separate custom object per team',
            'A second Case object',
            'Record types on Case',
            'A formula field that hides values',
          ],
          answer: 2,
          why: 'Record types give one object different layouts, picklist values and processes, while reports and automation stay shared.',
        },
        {
          q: 'A B2C shop sells to individuals, not companies. What does a Person Account merge into one record?',
          options: ['Lead and Contact', 'User and Contact', 'Account and Opportunity', 'Account and Contact'],
          answer: 3,
          why: 'A Person Account is an Account and a Contact rolled into one. Plan it well: once enabled, Person Accounts cannot be switched off.',
        },
        {
          q: 'Which object offers the special "hierarchical" relationship field type?',
          options: ['Account', 'User', 'Case', 'Any custom object'],
          answer: 1,
          why: 'Hierarchical relationships exist only on User, for example to point to a manager. Parent Account is a regular lookup to Account.',
        },
        {
          q: 'Two Leads with the same email keep slipping in. Which pair of features stops that?',
          options: [
            'A validation rule and a page layout',
            'A sharing rule and a queue',
            'A roll-up summary and a formula field',
            'A matching rule and a duplicate rule',
          ],
          answer: 3,
          why: 'The matching rule defines when two records look alike; the duplicate rule decides whether to block the save or just warn.',
        },
      ],
    },
    {
      id: 'datamodel-field-forge',
      title: 'Field forge',
      blurb: 'Match each field type to the job it was built for.',
      type: 'match',
      level: 1,
      rounds: [
        {
          q: 'Match the field type to its job.',
          pairs: [
            ['Formula', 'Calculates a value from other fields every time the record is read'],
            ['Roll-up summary', 'Counts or sums child records on a master-detail parent'],
            ['Picklist', 'Offers a short, fixed list of values in a dropdown'],
            ['Lookup', 'Links the record to a record of another object'],
          ],
        },
        {
          q: 'Match the field type to the data it should store.',
          pairs: [
            ['Checkbox', 'Is this customer a VIP? Yes or no'],
            ['Currency', 'Contract value in euros'],
            ['Date/Time', 'When the parcel was scanned, to the minute'],
            ['Long Text Area', 'Pages of free-text meeting notes'],
          ],
        },
        {
          q: 'Match the special field to its superpower.',
          pairs: [
            ['Encrypted text', 'Masked for users without View Encrypted Data'],
            ['External ID', 'Lets an upsert match records by a key from another system'],
            ['Auto Number', 'Gives every record a running number like INV-0001'],
            ['Multi-select picklist', 'Stores several chosen values separated by semicolons'],
          ],
        },
      ],
    },
    {
      id: 'datamodel-schema-smash',
      title: 'Schema smash',
      blurb: 'One line in each schema will break in production. Find it.',
      type: 'bug',
      level: 1,
      rounds: [
        {
          q: 'The invoice total should roll up from its lines. Which line breaks the plan?',
          code: [
            'Object: Invoice__c',
            '  Total__c     Roll-Up Summary (SUM of Line__c.Amount__c)',
            'Object: Line__c',
            '  Invoice__c   Lookup(Invoice__c)',
            '  Amount__c    Currency(16, 2)',
          ].join('\n'),
          bug: 3,
          why: 'Roll-up summary fields need a master-detail relationship between custom objects. With a lookup, the field cannot even be created.',
        },
        {
          q: 'A junction object links Students to Courses. Which line will Salesforce refuse?',
          code: [
            'Object: Student__c',
            'Object: Course__c',
            'Object: Enrollment__c',
            '  Student__c   Master-Detail(Student__c)',
            '  Course__c    Master-Detail(Course__c)',
            '  Mentor__c    Master-Detail(Contact)',
          ].join('\n'),
          bug: 5,
          why: 'An object can have only two master-detail relationships. The mentor link has to be a lookup.',
        },
        {
          q: 'Comments belong to tickets through master-detail. Which line cannot work?',
          code: [
            'Object: Ticket__c        (OWD: Private)',
            'Object: Ticket_Comment__c',
            '  Ticket__c    Master-Detail(Ticket__c)',
            '  Owner        each comment gets its own owner',
            '  Body__c      Long Text Area(32768)',
          ].join('\n'),
          bug: 3,
          why: "Detail records have no owner: ownership and sharing come from the master ticket. Need separate owners? Use a lookup instead.",
        },
        {
          q: 'Customers are in Belgium, numbers like +32 470 12 34 56. Which field type is wrong?',
          code: [
            'Object: Customer__c',
            '  Name         Text(80)',
            '  Phone__c     Number(18, 0)',
            '  Email__c     Email',
            '  VIP__c       Checkbox',
          ].join('\n'),
          bug: 2,
          why: 'A Number field drops the plus sign, spaces and leading zeros. Use the Phone type, which keeps the format and makes the number clickable.',
        },
        {
          q: 'Order lines must move to a new invoice when an order is split. Which line blocks that?',
          code: [
            'Goal: move lines between invoices when an order is split',
            'Object: Line__c',
            '  Invoice__c   Master-Detail(Invoice__c)',
            '               Allow reparenting: off',
            '  Amount__c    Currency(16, 2)',
          ].join('\n'),
          bug: 3,
          why: 'By default a detail record is locked to its first master. Turn on "Allow reparenting" on the master-detail field to move it.',
        },
        {
          q: 'Orders record which partner shop sold them. There are 4,000 shops and new ones every week. Which line is the trap?',
          code: [
            'Object: Order__c',
            '  Customer__c  Lookup(Account)',
            '  Shop__c      Picklist (4,000 shop names, edited weekly)',
            '  Status__c    Picklist (Draft, Placed, Shipped)',
            '  Amount__c    Currency(16, 2)',
          ].join('\n'),
          bug: 2,
          why: 'Picklists are for short, stable lists like Status. Shops grow and have their own data, so give them an object and use a lookup.',
        },
      ],
    },

    // ── Level 2 ─────────────────────────────────────────────────────────────
    {
      id: 'datamodel-access-ladder',
      title: 'Access ladder',
      blurb: 'Stack the layers of security and setup in the right order.',
      type: 'order',
      level: 2,
      rounds: [
        {
          q: 'Build the record-sharing pyramid from the bottom (the baseline) to the top (one record at a time).',
          items: ['Org-wide defaults', 'Role hierarchy', 'Sharing rules', 'Manual sharing'],
          why: 'Org-wide defaults set the most restrictive baseline. The role hierarchy, sharing rules and manual shares then open access, each more targeted than the last.',
        },
        {
          q: 'Line up the data security layers from the broadest gate (the whole org) to the narrowest (one specific record).',
          items: [
            'Org access (login hours, trusted IP ranges)',
            'Object permissions (profiles and permission sets)',
            'Field-level security',
            'Record access (OWD and sharing)',
          ],
          why: 'First you must be let into the org, then onto the object, then see the field, and finally reach the specific record. Field-level security applies to a field on every record of the object; record access is decided one record at a time.',
        },
        {
          q: 'Set up a many-to-many between Student and Course.',
          items: [
            'Create the Enrollment__c junction object',
            'Add the first master-detail, to Student (the primary master)',
            'Add the second master-detail, to Course',
            'Add the Enrollment related list to both parent layouts',
          ],
          why: 'The junction must exist before it can hold relationships, and the first master-detail you create becomes the primary one. Related lists come last.',
        },
        {
          q: 'Turn an existing lookup into a master-detail with a roll-up on the parent.',
          items: [
            'Find child records where the lookup is empty',
            'Fill in the lookup on every one of them',
            'Change the field type from Lookup to Master-Detail',
            'Add the roll-up summary field on the parent',
          ],
          why: 'The conversion fails while any child has no parent, and roll-up summaries can only be built once the master-detail exists.',
        },
      ],
    },
    {
      id: 'datamodel-sharing-showdown',
      title: 'Sharing showdown',
      blurb: 'Who sees what? Pick the right sharing tool.',
      type: 'quiz',
      level: 2,
      rounds: [
        {
          q: 'Opportunity OWD is Private and there are no sharing rules. Who can see the deals that rep Jo owns (ignoring admin permissions)?',
          options: [
            'Only Jo',
            'Jo and the users above Jo in the role hierarchy',
            'Everyone in the same role as Jo',
            'Everyone with the same profile as Jo',
          ],
          answer: 1,
          why: 'Standard objects always grant access through the role hierarchy, so managers above Jo see Jo\'s deals. Peers in the same role do not.',
        },
        {
          q: 'Ana must be able to delete Invoices. Nobody else on her profile should. What do you give her?',
          options: [
            'A criteria-based sharing rule',
            'Manual sharing on every invoice',
            'A permission set with Delete on Invoice',
            'A role above her team',
          ],
          answer: 2,
          why: 'Object permissions come from profiles and permission sets. A permission set adds them to one user without cloning a profile; sharing never grants Delete on its own.',
        },
        {
          q: 'Sharing rules can only open access. Which feature narrows the records a user can see on a custom object?',
          options: [
            'A criteria-based sharing rule',
            'A validation rule',
            'Removing the user from the role hierarchy',
            'A restriction rule',
          ],
          answer: 3,
          why: 'Restriction rules filter which records a user sees, even when OWD and sharing would grant more. Everything else in sharing only adds access.',
        },
        {
          q: 'A field sits on the page layout, yet a user does not see it. What is the most likely cause?',
          options: [
            'Field-level security hides it for that user',
            'The OWD is Private',
            'The user has no role',
            'The record has no owner',
          ],
          answer: 0,
          why: 'Field-level security wins over the layout. If the profile or permission sets give no Read access to the field, it stays hidden everywhere.',
        },
        {
          q: 'Account OWD is Public Read Only. What can every internal user do with any account?',
          options: [
            'Nothing until it is shared',
            'Edit it, but not delete it',
            'View it, but edit only with extra access',
            'Transfer it to themselves',
          ],
          answer: 2,
          why: 'Public Read Only lets everyone view the record. Editing still needs ownership, the role hierarchy, a sharing rule or a manual share.',
        },
        {
          q: 'A big deal needs a solution engineer, a lawyer and a finance partner on board, for that deal only. What fits best?',
          options: [
            'An opportunity team on that deal',
            'Opportunity OWD set to Public Read/Write',
            'A new profile for deal helpers',
            'A sharing rule for all deals over 1 million',
          ],
          answer: 0,
          why: 'Opportunity teams grant access record by record, with a role and access level per member. The other options open far more than one deal.',
        },
      ],
    },
    {
      id: 'datamodel-type-or-object',
      title: 'Record type or object?',
      blurb: 'Is it a variant of the same thing, or a new thing?',
      type: 'sort',
      level: 2,
      buckets: ['Record type', 'Separate object'],
      rounds: [
        {
          text: 'Retail and Wholesale opportunities use the same fields but need different Stage values.',
          bucket: 0,
          why: 'Same object, different picklist values: a record type with its own sales process covers it.',
        },
        {
          text: 'Complaints and questions are both Cases, with different page layouts.',
          bucket: 0,
          why: 'Record types give each kind of Case its own layout while queues, reports and automation stay shared.',
        },
        {
          text: 'Managers want one report that shows both variants side by side, with the same columns.',
          bucket: 0,
          why: 'One object means one report type. Split them into two objects and that simple report gets hard.',
        },
        {
          text: 'Partner and Customer accounts share every field, but need different layouts and picklists.',
          bucket: 0,
          why: 'Same data, different presentation is the textbook case for record types.',
        },
        {
          text: 'One variant needs a different org-wide default than the other.',
          bucket: 1,
          why: 'OWD is set per object, never per record type. Different baselines need different objects.',
        },
        {
          text: 'A team must be blocked from even opening one variant while still using the other.',
          bucket: 1,
          why: 'Record type assignment only controls what users can create, not what they can see. Object permissions need a separate object.',
        },
        {
          text: 'Warehouse visits have 40 fields that customer Cases never use.',
          bucket: 1,
          why: 'When most fields differ, it is a different thing. Cramming it into Case clutters every layout and report.',
        },
        {
          text: 'Equipment and its maintenance visits: each visit belongs to one piece of equipment.',
          bucket: 1,
          why: 'A thing and the events that happen to it are two objects with a parent-child relationship, not two record types.',
        },
      ],
    },
    {
      id: 'datamodel-query-quest',
      title: 'Query quest',
      blurb: 'Hunt the broken line in SOQL queries and sharing setups.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'Line__c has a master-detail Invoice__c. The query should return the invoice status. Which line fails?',
          code: [
            'SELECT Id,',
            '       Amount__c,',
            '       Invoice__c.Status__c',
            'FROM Line__c',
            'WHERE Amount__c > 100',
          ].join('\n'),
          bug: 2,
          why: 'To walk up a custom relationship, swap __c for __r: Invoice__r.Status__c. Invoice__c alone is just the parent Id.',
        },
        {
          q: 'The child relationship name of Line__c on Invoice__c is Lines. Which line fails?',
          code: [
            'SELECT Id, Name,',
            '       (SELECT Id, Amount__c',
            '        FROM Lines__c)',
            'FROM Invoice__c',
          ].join('\n'),
          bug: 2,
          why: 'A subquery uses the child relationship name with __r: FROM Lines__r. Lines__c is not an object or a relationship.',
        },
        {
          q: 'List each energy account with its contacts. Which line fails?',
          code: [
            'SELECT Name,',
            '       (SELECT LastName FROM Contact)',
            'FROM Account',
            "WHERE Industry = 'Energy'",
          ].join('\n'),
          bug: 1,
          why: 'Standard child relationships are plural: FROM Contacts. The object name Contact is not valid inside the subquery.',
        },
        {
          q: 'Notes__c is a Long Text Area. Which line will SOQL reject?',
          code: [
            'SELECT Id, Name',
            'FROM Ticket__c',
            "WHERE Status__c = 'Open'",
            "AND Notes__c LIKE '%refund%'",
          ].join('\n'),
          bug: 3,
          why: 'Long Text Area fields cannot be filtered in a WHERE clause. Search them with SOSL, or keep a short searchable field next to them.',
        },
        {
          q: 'Reps should see only their own deals; managers see their team\'s. Which line ruins it?',
          code: [
            'Goal: reps see only their own deals, managers see their team',
            'Object: Deal__c',
            'OWD: Public Read/Write',
            'Grant access using hierarchies: on',
            'Sharing rules: none',
          ].join('\n'),
          bug: 2,
          why: 'With Public Read/Write everyone can already see and edit every deal. Set the OWD to Private and let the hierarchy open access for managers.',
        },
        {
          q: 'HR sees all salary records; interns must not open the object at all. Which line leaks?',
          code: [
            'Goal: HR reads all Salary__c records, interns never',
            'OWD: Private',
            'Sharing rule: all Salary__c records -> role HR (Read Only)',
            'Profile HR: Read on Salary__c',
            'Profile Intern: Read on Salary__c',
          ].join('\n'),
          bug: 4,
          why: 'Object permissions are the gate. Interns still see records they own or are shared, so remove Read on Salary__c from their profile.',
        },
      ],
    },

    // ── Level 3 ─────────────────────────────────────────────────────────────
    {
      id: 'datamodel-skew-boss',
      title: 'Skew boss fight',
      blurb: 'Large data volumes, skew and external data at expert level.',
      type: 'quiz',
      level: 3,
      rounds: [
        {
          q: 'A catch-all account "Unassigned" holds 300,000 contacts. What is the main risk?',
          options: [
            'The account refuses new contacts at a hard limit',
            'The contacts lose their lookup to the account',
            'Record lock errors and slow sharing recalculation when the children change',
            'Reports can no longer group by account',
          ],
          answer: 2,
          why: 'This is account data skew (Salesforce warns above about 10,000 children). Updating children locks the parent, and sharing changes must recalculate across every child.',
        },
        {
          q: 'An integration user must own 500,000 leads. How do you limit the ownership skew?',
          options: [
            'Give that user no role, or a role of its own at the top of the hierarchy',
            'Put the user at the bottom of a deep role branch',
            'Add the user to as many public groups as possible',
            'Give the user a permission set with View All',
          ],
          answer: 0,
          why: 'An owner with many records deep in the hierarchy makes every role change recalculate huge amounts of sharing. No role, or a lone role at the top, avoids that.',
        },
        {
          q: 'Which custom field is indexed automatically, without asking Salesforce Support?',
          options: [
            'A formula field',
            'A Long Text Area',
            'A multi-select picklist',
            'A field marked as External ID',
          ],
          answer: 3,
          why: 'External ID and unique fields get an index, as do lookups and master-detail fields. Other custom indexes are requested from Salesforce Support.',
        },
        {
          q: 'What is true about skinny tables?',
          options: [
            'Admins create them themselves in Setup',
            'Salesforce Support enables them; they hold often-used fields of one object to avoid joins',
            'They archive old records outside the org',
            'They replace the need for selective filters',
          ],
          answer: 1,
          why: 'A skinny table is a copy of selected fields of one object, kept in sync by Salesforce, that skips the join between standard and custom field tables.',
        },
        {
          q: 'Billions of sensor readings must be kept for years and looked up by device and time. Where do they go?',
          options: [
            'A custom object with lots of custom indexes',
            'A Long Text Area on the device record',
            'A Big Object with an index on device and timestamp',
            'Files attached to each device',
          ],
          answer: 2,
          why: 'Big Objects (__b) scale to billions of rows. Their index is defined when you create them, and queries filter on the index fields.',
        },
        {
          q: 'ERP orders live in an external object (__x) and must link to Accounts by an ERP number stored on Account as a unique External ID. Which relationship?',
          options: ['Indirect lookup', 'External lookup', 'Master-detail', 'Hierarchical'],
          answer: 0,
          why: 'An indirect lookup links an external child to a standard or custom parent through a unique External ID on the parent. An external lookup points to an external object as parent.',
        },
      ],
    },
    {
      id: 'datamodel-scale-arsenal',
      title: 'Scale arsenal',
      blurb: 'Match the large-data problems, tools and trade-offs.',
      type: 'match',
      level: 3,
      rounds: [
        {
          q: 'Match the problem to its symptom.',
          pairs: [
            ['Account data skew', 'One account with tens of thousands of child records'],
            ['Ownership skew', 'One user owns tens of thousands of records of one object'],
            ['Lookup skew', 'Huge numbers of records point to the same lookup target'],
            ['Non-selective query', 'A filter on an unindexed field scans the whole table'],
          ],
        },
        {
          q: 'Match the large-data tool to its job.',
          pairs: [
            ['Skinny table', 'A synced copy of often-used fields of one object, without joins'],
            ['Custom index', 'Asked from Support so a filter on one field becomes selective'],
            ['Big Object', 'Billions of rows, queried on the index defined at creation'],
            ['Bulk API 2.0', 'Loads millions of records asynchronously in batches'],
          ],
        },
        {
          q: 'Match the design choice to its trade-off.',
          pairs: [
            ['Separate Address object with a lookup', 'One source of truth, but every report needs a join'],
            ['Region copied onto each Opportunity by a flow', 'Fast filters, but copies drift when the source changes'],
            ['Cross-object formula showing Account region', 'Always current, recalculated each time it is read'],
            ['Roll-up summary of child amounts', 'A stored total on the master, refreshed when children change'],
          ],
        },
      ],
    },
  ],
}

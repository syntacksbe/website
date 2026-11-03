// Deployment games for the Syntacks Arcade (format: src/arcade/format.js).
export default {
  id: 'deployment',
  title: 'Deployment',
  icon: '🚀',
  blurb: 'Get from sandbox to production without breaking a sweat, or a trigger.',
  games: [
    {
      id: 'deployment-sandbox-match',
      title: 'Sandbox matchmaker',
      blurb: 'Match each sandbox to the job it does best.',
      type: 'match',
      level: 1,
      rounds: [
        {
          q: 'Match the sandbox to the job.',
          pairs: [
            ['Developer', 'Build one feature with config and code, no real data'],
            ['Developer Pro', 'Bigger dev or test work with more storage'],
            ['Partial Copy', 'UAT with a sample of production data'],
            ['Full', 'Performance tests and a final dress rehearsal'],
          ],
        },
        {
          q: 'Match the sandbox to its data storage.',
          pairs: [
            ['Developer', '200 MB'],
            ['Developer Pro', '1 GB'],
            ['Partial Copy', '5 GB'],
            ['Full', 'Same as production'],
          ],
        },
        {
          q: 'Match each org to its clock.',
          pairs: [
            ['Developer sandbox', 'Can be refreshed once a day'],
            ['Partial Copy sandbox', 'Can be refreshed every 5 days'],
            ['Full sandbox', 'Can be refreshed every 29 days'],
            ['Scratch org', 'Expires after 30 days at most'],
          ],
        },
      ],
    },
    {
      id: 'deployment-change-set-quiz',
      title: 'Change set academy',
      blurb: 'Learn the clicks-not-code way to move metadata between orgs.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'Where do you build an outbound change set?',
          options: [
            'In the org you are deploying from',
            'In the org you are deploying to',
            'In the Dev Hub',
            'In any org of your choice',
          ],
          answer: 0,
          why: 'You build and upload it in the source org. It then shows up as an inbound change set in the target org.',
        },
        {
          q: 'Your upload fails because the target org is not in the list. What is missing?',
          options: [
            'A package.xml in the source org',
            'A deployment connection in the target org that allows inbound changes',
            'A scratch org definition file',
            '75% code coverage in the source org',
          ],
          answer: 1,
          why: 'The target org must allow inbound changes from the source org under Deployment Settings. No connection, no upload.',
        },
        {
          q: 'Can Nimbus Bikes send a change set from its sandbox to another company’s production org?',
          options: [
            'Yes, with a deployment connection',
            'Yes, if both orgs share an admin',
            'No, change sets only travel between orgs tied to the same production org',
            'Only with an installation key',
          ],
          answer: 2,
          why: 'Change sets work between a production org and its own sandboxes. To ship to other orgs you need packages or the CLI.',
        },
        {
          q: 'You uploaded a change set and forgot one field. What now?',
          options: [
            'Edit the uploaded change set and upload it again',
            'Add the field to the inbound change set in the target org',
            'Create the field by hand in the target and hope',
            'Clone the change set, add the field, upload the clone',
          ],
          answer: 3,
          why: 'An uploaded change set is locked. Cloning copies its components, so you only add what you missed.',
        },
        {
          q: 'You need to delete an old custom field in production. Can a change set do it?',
          options: [
            'Yes, tick a "delete" box on the component',
            'Yes, but only when sent from a Full sandbox',
            'No, change sets can’t delete or rename components',
            'Yes, if you run all tests',
          ],
          answer: 2,
          why: 'Change sets only add or update. Delete in Setup or with a destructiveChanges.xml through the CLI.',
        },
        {
          q: 'An inbound change set with Apex lands in production a day before release. Smartest move?',
          options: [
            'Deploy it now and see what happens',
            'Validate it now, then quick deploy it in the release window',
            'Clone it into a new outbound change set',
            'Switch off Apex tests in Deployment Settings',
          ],
          answer: 1,
          why: 'Validation runs the tests without saving anything. A recent successful validation can be quick deployed, skipping the tests on release night.',
        },
      ],
    },
    {
      id: 'deployment-env-ladder',
      title: 'Environment ladder',
      blurb: 'Climb from your own sandbox all the way to production.',
      type: 'order',
      level: 1,
      rounds: [
        {
          q: 'Promote a feature up the classic environment ladder.',
          items: ['Developer sandbox', 'Integration', 'UAT', 'Staging', 'Production'],
          why: 'Each step adds more people and more realism. Staging, often a Full sandbox, is the last dress rehearsal before production.',
        },
        {
          q: 'Run a change set from start to finish.',
          items: [
            'Create the outbound change set in the source org',
            'Add the components and their dependencies',
            'Upload it to the target org',
            'Validate the inbound change set',
            'Deploy it',
          ],
          why: 'Outbound is built and uploaded in the source; inbound is validated and deployed in the target.',
        },
        {
          q: 'Build a feature in a scratch org, from zero.',
          items: [
            'Enable Dev Hub in the production org',
            'Create a scratch org from the definition file',
            'Deploy the project source to it and build',
            'Retrieve your changes into the project',
            'Commit them to version control',
            'Delete the scratch org',
          ],
          why: 'Scratch orgs are disposable. Your work only survives once it is retrieved and committed.',
        },
        {
          q: 'Take a feature branch to the integration org.',
          items: [
            'Create a feature branch from main',
            'Commit and push your changes',
            'Open a pull request',
            'Merge after review and green checks',
            'The pipeline deploys main to the integration org',
          ],
          why: 'The pull request is the gate. Only merged code gets deployed, so the integration org always matches main.',
        },
      ],
    },
    {
      id: 'deployment-metadata-sort',
      title: 'Metadata or manual?',
      blurb: 'Spot what rides along in a deployment and what needs a data load or a manual step.',
      type: 'sort',
      level: 1,
      buckets: ['Deploys as metadata', 'Data load or manual step'],
      rounds: [
        {
          text: 'Custom metadata type records with tax rates',
          bucket: 0,
          why: 'Custom metadata records are metadata, so config ships with the release. That is why they beat custom settings for config.',
        },
        {
          text: 'Custom setting records',
          bucket: 1,
          why: 'The custom setting definition deploys, but its rows are data. Load them in every org or script it.',
        },
        {
          text: 'An Apex class and its test class',
          bucket: 0,
          why: 'Apex is classic metadata. In production its tests run during the deploy.',
        },
        {
          text: 'The password on a named credential’s external credential',
          bucket: 1,
          why: 'Secrets never travel in metadata. Set them in each org, pointing at that environment’s account.',
        },
        {
          text: 'A permission set',
          bucket: 0,
          why: 'Permission sets deploy cleanly and are the preferred way to ship access.',
        },
        {
          text: 'Assigning that permission set to 40 users',
          bucket: 1,
          why: 'Assignments are PermissionSetAssignment records, not metadata. Assign them after the deploy, by hand or with a data load.',
        },
        {
          text: 'Products and price book entries',
          bucket: 1,
          why: 'Those are records. Seed them with a data load or a script, in dependency order.',
        },
        {
          text: 'A validation rule',
          bucket: 0,
          why: 'Validation rules are part of the object’s metadata and deploy with it.',
        },
      ],
    },
    {
      id: 'deployment-cli-bugs',
      title: 'CLI glitch hunt',
      blurb: 'Find the command that wrecks the release.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'This deploy to production contains Apex. Which line will production reject?',
          code: `sf org login web --alias prod
sf project deploy start \\
  --manifest manifest/package.xml \\
  --target-org prod \\
  --test-level NoTestRun`,
          bug: 4,
          why: 'NoTestRun only works in sandboxes and dev orgs. Production needs RunLocalTests, RunSpecifiedTests or RunAllTestsInOrg.',
        },
        {
          q: 'Validate tonight, ship in seconds tomorrow. Which line breaks the plan?',
          code: `# Tonight: run the checks and tests, save nothing
sf project deploy validate --manifest manifest/package.xml \\
  --target-org prod --test-level RunLocalTests
# Returns job ID 0AfXX0000000001
# Tomorrow, in the release window:
sf project deploy start --manifest manifest/package.xml --target-org prod`,
          bug: 5,
          why: 'deploy start runs everything again, tests included. Use sf project deploy quick --job-id with the validated job, within 10 days.',
        },
        {
          q: 'The new InvoiceService no longer reads Old_Rate__c, but the version in UAT still does. Which line makes deleting the field fail?',
          code: `# Ship the new InvoiceService and delete Old_Rate__c in one go
sf project deploy start \\
  --manifest manifest/package.xml \\
  --pre-destructive-changes manifest/destructiveChanges.xml \\
  --target-org uat`,
          bug: 3,
          why: 'Pre-destructive changes delete first, while the old class still uses the field. Post-destructive changes delete after the new class has landed.',
        },
        {
          q: 'The pipeline file deploys to UAT on every push to main. Which line is a security hole?',
          code: `name: deploy-uat
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - run: npm install --global @salesforce/cli
      - run: echo "force://PlatformCLI::5Aep861Xk...@zephyr.my.salesforce.com" > auth.txt
      - run: sf org login sfdx-url --sfdx-url-file auth.txt --alias uat
      - run: sf project deploy start --manifest manifest/package.xml --target-org uat`,
          bug: 8,
          why: 'That auth URL logs anyone into the org, and now it lives in the repo. Store it as a pipeline secret.',
        },
        {
          q: 'This pipeline file should only check a pull request against production. Which line ships it for real?',
          code: `name: validate-pr
on:
  pull_request:
    branches: [main]
jobs:
  validate:
    steps:
      - run: echo "$PROD_AUTH_URL" > auth.txt
      - run: sf org login sfdx-url --sfdx-url-file auth.txt --alias prod
      - run: sf project deploy start --manifest manifest/package.xml --target-org prod --test-level RunLocalTests`,
          bug: 9,
          why: 'Without --dry-run (or sf project deploy validate), every pull request deploys straight to production.',
        },
        {
          q: 'You want to pull the latest flow edits from UAT into the repo. Which line does the opposite?',
          code: `# Bring the Invoice Approval flow from UAT into the project
sf project deploy start --metadata Flow:Invoice_Approval --target-org uat
git add force-app
git commit -m "Invoice approval flow from UAT"`,
          bug: 1,
          why: 'deploy pushes your local copy to UAT and overwrites the edits there. sf project retrieve start pulls them down.',
        },
      ],
    },
    {
      id: 'deployment-manifest-bugs',
      title: 'Manifest mayhem',
      blurb: 'Hunt the broken line in manifests, project files and tests.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'This package.xml should deploy the Invoice object and one field. Which line fails?',
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
          why: 'A field needs its object in front: Invoice__c.Amount__c. Otherwise Salesforce can’t tell which Amount__c you mean.',
        },
        {
          q: 'Every Apex class plus one trigger. Which line breaks the manifest?',
          code: `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>ApexClasses</name>
    </types>
    <types>
        <members>InvoiceTrigger</members>
        <name>ApexTrigger</name>
    </types>
    <version>64.0</version>
</Package>`,
          bug: 4,
          why: 'Metadata type names are singular and exact: ApexClass. An unknown type name fails the deploy or retrieve.',
        },
        {
          q: 'This destructiveChanges.xml should remove one old field and all legacy discount classes. Which line won’t work?',
          code: `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Legacy_Discount__c.Old_Rate__c</members>
        <name>CustomField</name>
    </types>
    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>
</Package>`,
          bug: 7,
          why: 'Wildcards don’t work in destructive changes, which keeps you from deleting by accident. List each class by name.',
        },
        {
          q: 'An sfdx-project.json with two folders. Which line is invalid?',
          code: `{
  "packageDirectories": [
    { "path": "core", "default": true },
    { "path": "billing", "default": true }
  ],
  "namespace": "",
  "sourceApiVersion": "64.0"
}`,
          bug: [2, 3],
          why: 'Only one package directory can be the default. That is where the CLI puts newly retrieved metadata.',
        },
        {
          q: 'Billing is an unlocked package that depends on Core. Which line stops the package version from building?',
          code: `{
  "packageDirectories": [
    {
      "path": "billing",
      "default": true,
      "package": "Billing",
      "versionNumber": "1.4.0",
      "dependencies": [{ "package": "Core", "versionNumber": "2.1.0.LATEST" }]
    }
  ],
  "packageAliases": { "Billing": "0HoXX0000000001", "Core": "0HoXX0000000002" }
}`,
          bug: 6,
          why: 'A version number has four parts: major.minor.patch.build. Use "1.4.0.NEXT" so each build gets the next number.',
        },
        {
          q: 'This test passes in Marc’s sandbox but fails when deployed to production. Which line?',
          code: `@isTest
private class InvoiceServiceTest {
    @isTest
    static void calculatesTotal() {
        Account acc = [SELECT Id FROM Account WHERE Id = '001Hp00002XyZaBIAV'];
        Invoice__c inv = new Invoice__c(Account__c = acc.Id, Amount__c = 100);
        insert inv;
        Test.startTest();
        Decimal total = InvoiceService.total(inv.Id);
        Test.stopTest();
        Assert.areEqual(100, total);
    }
}`,
          bug: 4,
          why: 'Record IDs differ in every org, and tests don’t see org data by default. Create the Account inside the test.',
        },
      ],
    },
    {
      id: 'deployment-test-level-match',
      title: 'Test level lineup',
      blurb: 'Pair test levels, commands and files with what they do.',
      type: 'match',
      level: 2,
      rounds: [
        {
          q: 'Match the test level to what it runs.',
          pairs: [
            ['NoTestRun', 'No tests; sandboxes and dev orgs only'],
            ['RunSpecifiedTests', 'Only the listed tests; each class and trigger deployed needs 75% from them'],
            ['RunLocalTests', 'All tests in the org except managed package tests'],
            ['RunAllTestsInOrg', 'Every test, managed package tests included'],
          ],
        },
        {
          q: 'Match the command to its job.',
          pairs: [
            ['sf project deploy validate', 'Run checks and tests, save nothing, return a job ID'],
            ['sf project deploy quick', 'Ship a recently validated job without rerunning tests'],
            ['sf project retrieve start', 'Pull metadata from an org into the project'],
            ['sf org create scratch', 'Spin up a short-lived org from a definition file'],
          ],
        },
        {
          q: 'Match the file to what it holds.',
          pairs: [
            ['package.xml', 'The components to deploy or retrieve'],
            ['destructiveChangesPre.xml', 'Components to delete before the deploy'],
            ['destructiveChangesPost.xml', 'Components to delete after the deploy'],
            ['sfdx-project.json', 'Package directories, API version and package aliases'],
          ],
        },
      ],
    },
    {
      id: 'deployment-package-sort',
      title: 'Package picker',
      blurb: 'Pick the right package type for each job.',
      type: 'sort',
      level: 2,
      buckets: ['Unlocked package', 'Managed package (2GP)', 'Unmanaged package'],
      rounds: [
        {
          text: 'Split a big org into upgradeable modules for internal use',
          bucket: 0,
          why: 'Unlocked packages are made for this: versioned, upgradeable building blocks for your own orgs.',
        },
        {
          text: 'An app sold to many customers on AppExchange',
          bucket: 1,
          why: 'Managed packages are how partners distribute apps on AppExchange, with a namespace and upgrades.',
        },
        {
          text: 'Share a one-off sample app; the installer owns it afterwards',
          bucket: 2,
          why: 'Once installed, unmanaged components are just regular metadata in the org.',
        },
        {
          text: 'The Apex source must stay hidden from the installing org',
          bucket: 1,
          why: 'Managed package code is protected, so subscribers can’t read or change it.',
        },
        {
          text: 'Upgradeable, but admins can still edit the installed metadata',
          bucket: 0,
          why: 'Unlocked package metadata stays editable in the org, but the next upgrade overwrites those edits.',
        },
        {
          text: 'Can depend on metadata that only exists in the target org',
          bucket: 0,
          why: 'An org-dependent unlocked package skips that dependency check. It’s a handy first step when you break up a large org.',
        },
        {
          text: 'No versioned upgrades after install',
          bucket: 2,
          why: 'Unmanaged packages have no upgrade path. They work like a template.',
        },
        {
          text: 'A namespace is mandatory',
          bucket: 1,
          why: 'Managed packages always need a namespace. For unlocked packages it is optional.',
        },
      ],
    },
    {
      id: 'deployment-order-speedrun',
      title: 'Deploy order speedrun',
      blurb: 'Sequence releases, dependencies and data like a pro.',
      type: 'order',
      level: 3,
      rounds: [
        {
          q: 'Release night with the CLI, in order.',
          items: [
            'Validate against production with RunLocalTests',
            'Quick deploy the validated job in the release window',
            'Assign the new permission set to users',
            'Smoke test as a real user',
          ],
          why: 'Validation does the slow part ahead of time. Users need the permission set before a real-user smoke test means anything.',
        },
        {
          q: 'Deploying in separate batches? Order them so every dependency already exists.',
          items: [
            'Custom object Invoice__c',
            'Field Invoice__c.Amount__c',
            'Apex class that reads Amount__c',
            'Permission set granting the field and the class',
          ],
          why: 'A field needs its object, Apex needs the field to compile, and a permission set can only grant things that exist.',
        },
        {
          q: 'Ship an unlocked package version.',
          items: [
            'Create the package version with code coverage',
            'Install the beta in a sandbox or scratch org and test',
            'Promote the version to released',
            'Install it in production',
          ],
          why: 'Beta versions can’t go into production. Promoting needs 75% coverage, which is why you calculate coverage at create time.',
        },
        {
          q: 'Seed a fresh sandbox so every lookup has a target.',
          items: [
            'Account',
            'Project__c (lookup to Account)',
            'Milestone__c (master-detail to Project__c)',
            'Time_Entry__c (master-detail to Milestone__c)',
          ],
          why: 'Parents first, children last. A child record can’t point at a parent that hasn’t been loaded yet.',
        },
      ],
    },
    {
      id: 'deployment-release-boss',
      title: 'Release boss fight',
      blurb: 'Tricky release questions that trip up senior teams.',
      type: 'quiz',
      level: 3,
      rounds: [
        {
          q: 'Org-wide coverage is 82%, but your new trigger has 0%. Will the production deploy pass?',
          options: [
            'Yes, the org average is above 75%',
            'No, every trigger needs at least some coverage',
            'Yes, triggers are exempt from coverage',
            'Only with RunAllTestsInOrg',
          ],
          answer: 1,
          why: 'Production needs 75% overall, all tests passing, and some coverage on every trigger. A 0% trigger blocks the deploy.',
        },
        {
          q: 'Why do teams ship access with permission sets instead of profiles?',
          options: [
            'Profiles can’t be retrieved at all',
            'Permission sets skip Apex tests',
            'A retrieved profile only holds permissions for the components in the same manifest, so profile deploys are easy to get wrong',
            'Profiles only exist in Full sandboxes',
          ],
          answer: 2,
          why: 'What a profile contains depends on what you retrieve with it. Permission sets are self-contained and additive, so they deploy predictably.',
        },
        {
          q: 'A refreshed Full sandbox copies a named credential that points at the production payment API. Best fix?',
          options: [
            'Nothing; sandboxes block all callouts',
            'Hard-code the sandbox URL in the Apex class',
            'Delete the named credential in production',
            'Repoint it to the test endpoint as a post-refresh step',
          ],
          answer: 3,
          why: 'A sandbox is a copy of production config, callouts included. Keep endpoints in named credentials so only one setting changes per environment.',
        },
        {
          q: 'Which orgs support source tracking, so the CLI knows exactly what changed?',
          options: [
            'Scratch orgs and Developer or Developer Pro sandboxes',
            'Production and Full sandboxes',
            'Partial Copy sandboxes only',
            'Any org with a deployment connection',
          ],
          answer: 0,
          why: 'Scratch orgs track source by default; Developer and Developer Pro sandboxes do once it is enabled in production.',
        },
        {
          q: 'A production release breaks invoicing. What does Salesforce give you to roll back?',
          options: [
            'A one-click undo for the last deployment',
            'Automatic rollback after 24 hours',
            'No undo: redeploy the previous version from source control and delete new parts with destructive changes',
            'A sandbox refresh that resets production',
          ],
          answer: 2,
          why: 'Failed deploys roll back on their own, but successful ones stay. Your rollback plan is the last good version in source control.',
        },
        {
          q: 'How does DevOps Center move changes toward production?',
          options: [
            'By cloning change sets automatically',
            'Through work items promoted along pipeline stages, backed by a source control repository',
            'By refreshing each sandbox from the one before it',
            'Through unmanaged packages installed per stage',
          ],
          answer: 1,
          why: 'DevOps Center tracks each change as a work item and promotes it stage by stage, with source control as the record of truth.',
        },
      ],
    },
  ],
}

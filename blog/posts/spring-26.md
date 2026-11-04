---
title: Spring '26
version: 66.0
date: 2026-02-20
tagline: Cursors go GA, deploys learn which tests to run, and connected apps quietly lose their default.
summary: Apex Cursors are GA, RunRelevantTests and Unified Logic Testing arrive in beta, LWC gets GraphQL mutations and template expressions, Flow approvals get a Request Approval component, new connected apps are off by default and legacy host names stop redirecting.
status: draft
sources:
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_apex.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_api.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_lc.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_tools_cli_enhancements.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_ru.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_versioned_updates.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_automated_approvals.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_orchestrator.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_customization.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_security_auth_and_identity.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_security.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_sales.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_service.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_service_case_management.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_voice.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_messaging_service.htm&release=260&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_salesforce_knowledge.htm&release=260&type=5
  - https://developer.salesforce.com/blogs/2026/01/developers-guide-to-the-spring-26-release
  - https://admin.salesforce.com/blog/2025/admin-spring-26-release-dates-countdown
---

Patch 260, API 66.0. Sandbox preview from 9 January 2026, production on the weekends of 16 January, 13 February and 20 February 2026. Flow's release notes moved under a new "Automation" heading, and Sales Cloud and Service Cloud now ship features monthly inside the release window, so the notes keep growing until April.

A quieter patch than it looks. The headline for developers is Apex Cursors going GA; the headline for everyone else is the list of things that stop working.

## What I'd actually use

- [new] **Apex Cursors (GA).** `Database.getCursor` with `fetch(position, count)`, bidirectional, serialisable into Queueable chains and `@AuraEnabled` paging. The first real alternative to Batch Apex and to OFFSET pagination.
- [beta] **RunRelevantTests.** A deploy test level where Salesforce picks the tests that cover your payload. `@IsTest(critical=true)` always runs, `@IsTest(testFor='ApexClass:MyClass')` pins a test to a class. Big orgs: this is your CI time back.
- [new] **GraphQL mutations in LWC.** `executeMutation` from `lightning/graphql` creates, updates and deletes without a controller class.
- [new] **`standard__flow` page reference.** Launch a screen or autolaunched flow from any component and pass inputs through `state`. Goodbye flow-launcher wrappers.
- [new] **Request Approval component** for Flow approval processes, in App Builder and Experience Builder. No custom button, optional first-approver choice and comments.

> Cursors change how I design anything above a few hundred thousand rows. Instead of a Batch class with its own scheduling and its own failure modes, it's a Queueable that carries the cursor position and stops when it's done. Try it on your next data fix before you reach for Batch Apex out of habit.

## Apex

- [new] **Apex Cursors and pagination cursors are GA.** Each `fetch()` still counts against SOQL limits; watch `Limits.getApexCursorRows()`.
- [beta] **RunRelevantTests** test level, also from the CLI with `sf project deploy start --test-level RunRelevantTests`.
- [new] **`ConnectApi.RecordUi.getPicklistValuesByRecordType()`** returns every picklist value for a record type, dependencies and defaults included, in one native call. No more UI API callouts from Apex.
- [new] **Apex REST and `@AuraEnabled` methods as Agentforce actions (GA)**: annotate, generate the OpenAPI spec, deploy, manage in the API Catalog.
- [breaking] **`Blob.toPdf()` moves to the Visualforce PDF renderer.** Available now as a release update, enforced in Summer '26. More fonts and multibyte support, but the default font changes; set `font-family: serif` to keep old layouts.
- [breaking] **At API 66.0, invocable action parameter classes need a visible no-argument constructor** (public, or global when packaged), and REST calls to invocable actions are validated the same way.
- [fix] **`WITH USER_MODE` now works as the Automated Process User** at 66.0.
- [buff] Smaller: `purgeOldAsyncJobs()` takes a count, the Test Discovery API filters by category, DataWeave transformations accept nested SOQL.
- [beta] **Unified Logic Testing**: `sf logic run test --test-category Apex --test-category Flow` runs Apex and Flow tests in one go.
- [buff] **ApexGuru lives inside Code Analyzer** in VS Code and Code Builder, with inline performance hotspots. Also new: `sf package version retrieve` for 2GP and unlocked source, and `--poll-interval` on `apex run test`.

## Lightning Web Components

- [beta] **Complex template expressions**: template literals, ternaries, optional chaining, arithmetic and inline handlers in the template. Salesforce says not for production yet, which is fair.
- [new] **GraphQL mutations** through `executeMutation`, with input types like `ContactCreateInput!`. Recipes are in LWC Recipes.
- [new] **`lwc:on` directive** binds an object of event handlers from JavaScript.
- [buff] **TypeScript for all base components** through `@salesforce/lightning-types`. Compile with `tsc`, deploy the JavaScript.
- [beta] **`lightning-empty-state` and `lightning-illustration`** base components, theme and dark-mode aware. Dark mode for SLDS 2 reaches Enterprise, Professional and Developer in beta.
- [new] **`standard__flow` page reference** and **UI API support for Task and Event**, so activities work in custom components and in screen-flow record fields.
- [new] **Error Console** (Setup › User Interface) collects non-fatal component errors instead of the red error box.
- [fix] **Disconnected DOM nodes are no longer rehydrated.** A framework fix that can surface errors your components were hiding.
- [new] **Live Preview** is the new name of Local Dev; single-component preview is GA. More MCP tools for LWC work in beta.
- [buff] **Lightning Out 2.0** gets host domains and an `app-id`; Lightning Types can define object types from JSON Schema.
- [buff] **Experience Cloud**: custom property types and editors GA, a Request Approval component, 16 standard LWR components, file uploads up to 10 GB with malware scanning in beta.

## Flow and automation

- [new] **Evolve flows with Agentforce**: edit record-triggered and scheduled flows in plain language. AI-drafted flows are GA.
- [buff] **Canvas**: collapsible Decision, Loop, Wait, Path and Async branches, collapse all, native mouse scrolling.
- [buff] **Data Table** gets runtime column sorting and inline editing.
- [new] **Screen components**: Message (info, success, warning, error), native File Preview, a read-only Kanban Board in beta, per-component style overrides, and screen flows openable by URL (GA).
- [buff] **Debugging**: debug settings persist through saves, flow tests pin to a version and travel with clones, isolated test data for triggered flows, compare two versions of a screen flow, run analytics per version.
- [new] **Flow approval processes**: the Request Approval component, approval work items completable on the canvas while debugging, debug one segment, and a Usage tab in the Approvals app. Flow approvals only, Classic approvals don't get it.
- [buff] **Flow Orchestration**: create orchestrations from the Automation app, complete work items while debugging, segment debugging, "Configure Test Output" replaces "Configure Debug".
- [new] **Flow Logs** tab in the Automation app (metrics stored in Data 360, so it needs that set up), and Action Hub shows which agents and prompt templates use an action (beta).
- [breaking] **Flows at API 66.0**: Apex action classes need the no-argument constructor, and before-save flows now reject non-insertable fields with "Invalid target field for field update".
- [nerf] **The "Enforcing No-Argument Constructor" release update is no longer enforced**, recommended only. New update: Sort Apex Batch Action Results by Request Order.
- [new] **MuleSoft for Flow**: document extraction GA, third-party connectors GA with triggers, named credential auth and binary file actions.
- [retired] **Workflow Rules and Process Builder**: nothing new in these notes. Support ended on 31 December 2025; what you have keeps running, unsupported.

## Core config

- [beta] **Setup with Agentforce**: an assistant in Setup for objects, fields, user access and formula explanations.
- [breaking] **Creating new connected apps is disabled by default** in every org. Existing and packaged apps keep working and an admin can re-enable it, but the direction is External Client Apps, which now cover Canvas and migrate SAML apps in a few clicks.
- [new] **Passkeys are GA.** Device activation becomes required for SSO logins when the identity provider's method is weak, phased by provider type.
- [nerf] **OAuth tightening**: API-only users can't bridge into UI sessions through single access, refresh tokens can be restricted by IP, idle lifetime capped at 30 days, PKCE and rotation controls can be locked.
- [breaking] **Sharing recalculation after group and role changes runs asynchronously** for some cases. A release update to fix Apex and flows that assume share rows exist immediately, enforced Spring '27.
- [new] **Named credentials from Apex**: update and delete named credentials, external credentials and auth providers in code. Packaged named credentials become developer-controlled.
- [new] **Delete Salesforce Files** permission, file limit up from 2 GB to 10 GB, malware scan on upload in beta.
- [fix] **List views**: inline edit refuses more than 200 records upfront, blanks sort as the highest value.
- [buff] **Reports and dashboards**: dashboard tables keep the source report's settings, custom disclaimers on exports, custom LWCs in dashboards in beta (enabled by Support).
- [buff] **Ops**: Health Check tracks seven new settings and emails score changes, Backup and Recover is a native app, Privacy Requests for right-to-be-forgotten, Quick Create for full sandboxes above 1 TB, Named Query API GA for custom SOQL as REST endpoints.

## Sales Cloud

- [new] **AI-Powered Selling initial setup**: one click enables the base sales features, agents and seller permissions.
- [new] **Sales Workspace** replaces Seller Home: metrics, recommendations and action items on one page.
- [new] **Sales Methodology** in Pipeline Inspection: key fields, scoring levels and guidance per stage to standardise qualification.
- [buff] **Account Research** results can map to custom text fields; account plan objectives can reference records across the account hierarchy.
- [breaking] **Sales Engagement data moves natively to the platform.** Existing customers migrate from June; the Sales Engagement Performance dashboard is deprecated in October.
- [buff] **Sales Performance Management**: overlapping territory boundaries, financial targets allocated to accounts, quota plans from territory alignments.
- [breaking] **Email and calendar**: authorised email domains, Microsoft Exchange Web Services retires on 1 October 2026 and breaks Lightning Sync, Salesforce for Outlook retires in December 2027, new Sales Dialer licences are no longer sold.
- [new] Agents, if you have them: Inbound Lead Generation, Qualification, Lead Nurturing, Sales Management, and a Sales app in ChatGPT and Gemini in beta.

## Service Cloud

- [new] **Case Timeline** component: emails, chats, messages and milestones in one threaded view.
- [new] **Quick Text in case comments**, case comment translation, Merge Cases from the related list on standard objects, close-case actions per record type.
- [breaking] **Org-wide email addresses must be verified** before case emails go out.
- [fix] Omni-Channel Supervisor is renamed **Command Center for Service** (enhanced Omni-Channel only, name only).
- [buff] **Voice**: transfers routed by an Omni-Channel flow, voicemails and desk-phone calls join unified routing, queued callbacks, Voicemail Drop in beta, 300 custom fields on VoiceCall. **Open CTI is deprecated, retirement 28 February 2028.**
- [retired] **Legacy Chat retired on 14 February 2026.** Enhanced messaging gets WhatsApp templates managed in Salesforce, WhatsApp Flows and payments, and message credits replace the bundled SMS and WhatsApp add-ons. Bring-your-own channels must move to an External Client App.
- [new] **Knowledge**: Knowledge Maps GA for hierarchical articles, Enterprise Knowledge on Data 360 GA, Self Learning Knowledge GA, a better article editor. Unified Knowledge retires in Summer '26.
- [buff] **Entitlements**: rule-based milestone pause (status "Waiting for Customer" and the like), parent and child milestones visible both ways, an SLA summary from Agentforce.
- [retired] The Service Setup app and assistant are gone for new orgs; use Salesforce Go.

## What breaks

- [breaking] **Enforced this release**: the `label` attribute of `apex:inputField` is escaped (already-escaped labels double-escape), and **references to legacy host names stop redirecting** in every org. Old bookmarks, hard-coded instance URLs, SSO endpoints and named credentials return 404.
- [breaking] **Session IDs are removed from outbound messages.** `IncludeSessionId` is ignored and the session element comes back empty, from mid-February 2026 (the release notes say 23 February, the developer blog 16 February). Switch the receiving side to OAuth.
- [breaking] **Connected apps off by default** means every new integration, SSO and DevOps Center setup follows the External Client App pattern.
- [retired] **LWS trusted mode enablement is discontinued** after a short life in Winter '26. New Lightning Web Security distortions come with matching ESLint rules.
- [nerf] **API**: `EventBusSubscriber.Position` and `Tip` are deprecated for string `LastProcessed` and `LastPublished` because replay IDs outgrew integers; Data 360 SOQL results are capped at 12 MB.
- [breaking] **Postponed, so still coming**: Update Instanced URLs in API Traffic moves to Winter '27, the multiple-configuration SAML framework and the Triple DES retirement land in Summer '26, the OAuth username-password flow ends in Winter '27, SOAP `login()` on API 31.0 to 64.0 goes in Summer '27, Salesforce to Salesforce ends in Spring '27.
- [fix] **Re-test**: `Blob.toPdf()` layouts, anything that reads share rows right after a role change, before-save flows that touch non-insertable fields, and verification method precedence (built-in authenticators now come first).

> The host-name update is the one that generates the support tickets. Grep your named credentials, remote site settings, Outlook plug-in configs and every integration partner's config for `.my.salesforce.com` host names that are not your enhanced domain, before the patch lands, not after.

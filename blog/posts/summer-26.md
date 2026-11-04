---
title: Summer '26
version: 67.0
date: 2026-06-13
tagline: The security patch. Apex gets safe defaults, and your old classes don't notice until you bump them.
summary: Apex 67.0 runs in user mode and with sharing by default, WITH SECURITY_ENFORCED is gone, LWC gets state managers and Live Preview, Flow gets formula inputs and a Run Agent element, and API versions 31 to 40 are retired.
status: draft
sources:
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_apex.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_lc.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_api.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_ru.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_actions.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_automated_approvals.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_customization.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_security.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_sales.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_service.htm&release=262&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_service_case_management.htm&release=262&type=5
  - https://developer.salesforce.com/blogs/2026/06/the-salesforce-developers-guide-to-the-summer-26-release
  - https://www.salesforce.com/blog/summer-26-release-architect-highlights/
  - https://www.salesforceben.com/top-8-salesforce-summer-26-features-for-developers/
  - https://www.salesforceben.com/10-new-salesforce-flow-features-in-summer-26/
---

Patch 262, API 67.0. Sandbox preview on 8 May 2026, production in waves from 15 May to 13 June 2026. Two renames on the box: Sales Cloud is now "Agentforce Sales" and Service Cloud is "Agentforce Service" (licences and objects unchanged), and Local Dev for LWC is now "Live Preview".

This is the patch where Apex finally ships with safe defaults. Nothing changes until you set a class to API 67.0, so the real work is the upgrade, not the release day.

## What I'd actually use

- [new] **Apex security defaults at 67.0.** User mode and `with sharing` by default. I'll bump controllers, `@AuraEnabled` and REST classes first and let the test suite find the gaps.
- [new] **State managers for LWC (GA).** Shared state between components, wrapped around Lightning Data Service with its caching. The end of the pubsub-and-pray pattern.
- [new] **Live Preview (GA).** Single-component preview in the browser and a VS Code extension with hot reload that is actually fast at API 67.0.
- [buff] **Flow action inputs in formula and transform mode.** Fewer Assignment elements before every action, and Apex-defined inputs you can fill directly.
- [new] **Field Access Summary.** One read-only tab in Object Manager showing a field's access across profiles, permission sets and groups. The least-privilege audit just lost half its hours.

> Most of what matters here is gated behind the API version. Pick the ten classes that face users or the web, bump them to 67.0, run the tests as different profiles with `System.runAs`, and only then touch the rest. The trigger rule below is the one that bites teams who upgrade everything in one go.

## Apex

- [breaking] **Database operations run in user mode by default** at API 67.0. SOQL, SOSL, DML and `Database` methods enforce the running user's object, field and sharing access. Opt out per statement with `WITH SYSTEM_MODE`, `as system` or `AccessLevel.SYSTEM_MODE`.
- [breaking] **Classes without a sharing keyword default to `with sharing`** at 67.0. Before, they inherited `without sharing`.
- [retired] **`WITH SECURITY_ENFORCED` is removed** at 67.0: the class won't compile. `WITH USER_MODE` replaces it, also checks the WHERE clause and polymorphic fields, and reports every inaccessible field through `QueryException.getInaccessibleFields()`.
- [breaking] **Triggers still run `without sharing`**, but at 67.0 the database operations inside the trigger body run in user mode unless you say otherwise. Move the logic into a handler class with an explicit mode.
- [new] **Multiline strings** with `'''` and **`String.template()`** with `${name}` placeholders filled from a `Map<String, Object>`. Datetimes render in GMT.
- [beta] **Elastic limits for async jobs.** Queueable and `@future` can go up to twice the daily limit, with the overflow throttled. `OrgLimits.getMap()` gets `DailyAsyncApexElasticExecutions` and `DailyAsyncApexProcessed`.
- [pilot] **Integration tests** (developer preview): `@IntegrationTest` with real callouts, `IntegrationTest.commitTestOnly()` and `@TearDown`. Scratch orgs only, feature `ApexIntegrationTests`.
- [beta] **Web Console**: an in-org IDE from Setup for classes, anonymous Apex, trace flags and SOQL. Enable it under Setup › Development › Web Console.
- [beta] **Apex metrics in Setup with Agentforce**: classes on old API versions, compile errors and async usage in one place.
- [new] **`EventBus.publishWithAccessLevel()`** takes an `AccessLevel` and is now the recommended way to publish platform events.
- [fix] **Invocable action parameter classes need a visible no-argument constructor**, `global` when packaged. REST already validated this from API 66.0.
- [beta] **Salesforce DX MCP Server** gains ApexGuru tools that flag SOQL and DML in loops, redundant queries and weak tests from runtime metrics, plus SLDS guideline tools.

## Lightning Web Components

- [new] **State managers (GA).** `defineState` from `@lwc/state` with atoms and computed values, and built-in managers like `lightning/stateManagerRecord` and `lightning/stateManagerObjectInfo` on top of Lightning Data Service.
- [new] **Live Preview (GA)** for single components in the browser and in VS Code or Code Builder. React preview is in beta.
- [buff] **LWC API 67.0** makes hot module reloading faster and lighter, and supports native `<details name>` grouping for accordions without JavaScript.
- [breaking] **Lightning Web Security adds distortions** for `HTMLAnchorElement.href`, `Element.getAttribute`, `innerHTML` and `outerHTML` getters, `MutationObserver.observe`, IndexedDB and `Promise` methods, with matching ESLint rules. **`data:` URIs on anchors are blocked**: switch to `blob:` with `URL.createObjectURL`.
- [pilot] **Dynamic lists** (developer preview): `lightning-dynamic-list-container` virtualises 50 to 5,000 rows with `renderlistitems` and `loadmore`. Dev channel only.
- [new] **`lightning/accApi`** opens, closes and drives the Agentforce side panel from a component.
- [new] **Lightning Out 2.0**: Aura support is GA through the adoption program, embedding works through LWR sites for guests and logged-in users, and a Session Settings preference turns on partitioned cookies.
- [pilot] **Micro-frontends** (developer preview): React, Angular or Vue apps in sandboxed iframes with record context, brand tokens and auto-resize.
- [new] **Command Center page type** in Lightning App Builder: several user-group pages inside one app.
- [buff] **Custom LWCs in Lightning dashboards** go from beta to GA.
- [nerf] **Aura boxcar limit of 250 actions per request is now enforced**, and `lightning-progress-indicator`, `lightning-progress-ring`, `lightning-progress-step` and `lightning-spinner` switch to private internals. Don't reach into their DOM.
- [beta] **Dark mode** for SLDS 2 on Performance and Unlimited, with a dark logo upload.

## Flow and automation

- [new] **Run Agent element.** Use an existing Agentforce agent or build a task-specific one on the canvas; existing AI Agent actions convert automatically.
- [buff] **Custom batch size for scheduled flows**, 1 to 200 on the Start element. It used to be fixed at 200.
- [fix] **Send Email stores the template as a reference instead of an ID**, so deployments stop breaking the action.
- [new] **Date operators in Decision elements**: Is Today, Is Anniversary of Today, Last Number of Days and friends. Date fields only, not DateTime.
- [new] **Show Toast Message** and **Open a Page** actions for screen flows.
- [buff] **Formula mode and transform mode on action inputs**, direct field entry for Apex-defined inputs, Custom and Custom Collection output types, and the timeout path on async actions hidden by default.
- [new] **Flow extensions for Apex actions**: a custom property editor per input, picklist values on Apex action inputs and custom headers through `InvocableActionExtension`.
- [new] **Screen flow components**: Radio Button Group, data-table lookup columns that show record names as links, and styling hooks for custom LWC screen components through the `lightning__FlowScreen` target config.
- [buff] **Builder quality of life**: collapsible fault paths, a redesigned validation panel, visual version comparison including Transform diffs, and an error-rate column in the flow list.
- [nerf] **Agentforce for Flow moves back from GA to beta** because of accuracy on complex flows.
- [buff] **Flow approval processes**: group steps can require unanimous approval, in which case work items can't be reassigned. Approval designers see flow dependencies without the Manage Flow permission.
- [buff] **Flow Orchestration is a standard feature** on Enterprise and up and in Developer orgs, with no usage-based limits (landed mid-February, restated here).

## Core config

- [new] **Field Access Summary** tab in Object Manager: a field's level security across profiles, permission sets and permission set groups.
- [new] **Permission dependency alerts** on save in the enhanced profile user interface.
- [new] **Transaction security policies on profile changes** (Event Monitoring) can track or block critical permission edits. New permission Modify Transaction Security Policy; Customize Application becomes view-only there, enforced in Winter '27.
- [breaking] **Enable Profile Filtering** is a release update, available now and enforced in Winter '27: users without View All Profiles only see their own profile name.
- [buff] **Sharing**: Grant Access Using Hierarchies per queue (on for existing queues, off for new ones), parallel recalculation for criteria-based sharing so OWD changes finish faster, and an async sharing recalculation update enforced in Spring '27.
- [new] **Manage Shared List Views** permission lets people share personal list views without Manage Public List Views, with a toggle to make shared views editable.
- [buff] **Reports**: two row-level formulas per report, brand colour palettes, multi-value text filters with commas, and formulas can be disabled in Excel exports.
- [nerf] **Chatter is off by default in new orgs** on Enterprise, Unlimited and Developer; Slack takes its place. Existing orgs are untouched, but Experience Cloud features that depend on Chatter need it switched on.
- [new] **27 more IANA time zones**, Catalan and Basque interfaces in beta.
- [beta] **Setup with Agentforce** replaces Agent for Setup. The Metadata API context MCP server now has five tools.
- [new] **Hosted MCP servers (GA)** expose org logic through `@InvocableMethod`, flows, Apex REST and the Named Query API, under OAuth and the org's sharing model.

## Sales Cloud

- [buff] **Pipeline Inspection**: an Activity column with a 30-day engagement heatmap (needs conversation insights and activity capture), a Contacts column, deal summaries and alerts, and custom sales methodologies.
- [new] **Sales goals as quantity or currency**, with a "Show metrics as currency" toggle.
- [buff] **Agentforce qualification** now covers Contacts and Person Accounts, with group calendar availability and handoff for the inbound lead agents.
- [new] **Control which fields receive autonomous updates** by editing the Process Field Update Suggestions flow. Autonomous updates only apply to licensed opportunity owners.
- [buff] **Conversation insights move to the platform**, so Flow, Apex and Prompt Builder can read them. Sales Engagement data becomes native, with a migration starting this release.
- [breaking] **Email domain verification**: verify your sending domains, a substitute From address for unverified ones, and the Adopt Authorized Email Domains update enforced in Winter '27. DKIM now protects Reply-To.
- [breaking] **Exchange Web Services ends**: upgrade Einstein Activity Capture, Inbox and Lightning Sync to Microsoft Graph before October 2026.
- [fix] Lead conversion keeps email conversations attached (August wave), and Territory Planning gets a modern interface.

## Service Cloud

- [buff] **Omni-Channel** can prioritise by the original request date and schedule a work item for a later date and time.
- [fix] **Standard case assignment rules run for cases created from Experience Cloud.** No more custom flow to re-route portal cases.
- [beta] **Duplicate case handling**: merge unopened duplicates in Omni-Channel queues, enhanced case merge with matching rules and a Duplicate Cases component, and rich-text case descriptions.
- [new] **Agentforce in Service**: drafted case comments with context, a Find Case Expert action, agentic milestones in beta and SLA-breach risk scoring.
- [buff] **Messaging**: messaging sessions in custom report types on Cases, an automatic first-response-time metric, and inactive sessions end themselves after 5 to 30 minutes.
- [buff] **Knowledge**: AI answers in the Enterprise Knowledge component and article links in case emails (beta). **Unified Knowledge retires in Summer '27.**
- [new] **Service Cloud Voice becomes Salesforce Voice**: SIP routing GA, SLA-based and last-rep routing, voicemail drop and session restoration.

## What breaks

- [breaking] **Enforced this release**: the multiple-configuration SAML framework (single-config SSO stops working), the Salesforce-managed X/Twitter auth provider is gone, batch Apex action results sort by request order, and `Blob.toPdf()` renders with the Visualforce PDF engine (the default font changes from sans-serif to serif).
- [retired] **Platform API versions 31.0 to 40.0 are retired.** SOAP `login()` on versions 31.0 to 64.0 retires in Summer '27, and the Any API Auth permission gates SOAP login by default in new orgs. `login.database.com` stops in June 2026.
- [breaking] **Standard-volume platform events are unsupported from Winter '27.** Run the migration tool to high-volume events now; publishing is blocked while it runs.
- [breaking] **Coming in Winter '27**: the OAuth username-password flow for connected apps goes, profile filtering is enforced, authorized email domains are enforced, and WCAG 2.2 updates change page headers, modals, date pickers and utility bars.
- [breaking] **Coming in Spring '27**: Salesforce to Salesforce ends, instanced URLs in API traffic update, sharing recalculation changes, and non-public fields disappear from Aura action responses. Summer '27 blocks anonymous Apex from managed packages.
- [retired] **Also on the way out**: Salesforce Functions (no longer sold), Lightning Sync (April 2027), Salesforce for Outlook (December 2027), the standard Omni-Channel, SMS and Facebook Messenger channels, and the Optimizer app for orgs not on Hyperforce.
- [nerf] **Infrastructure**: IPv6 starts rolling out (prefer domain allowlists over IP lists), My Domain URLs must route through the Salesforce Edge Network, and public TLS certificates are capped at 200 days since March 2026.

> If you only do one thing after reading this: search your codebase for `WITH SECURITY_ENFORCED` and for classes with no sharing keyword. That list is your 67.0 migration backlog, and the Field Access Summary tab is how you check the results without clicking through forty profiles.

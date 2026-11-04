---
title: Winter '27
version: 68.0
date: 2026-10-09
tagline: Bigger heap, testable flows, and the auth clean-up every old integration has been dreading.
summary: Apex heap goes to 10 and 25 MB, elastic limits reach Batch Apex, Flow gets a real test mode with mocks, LWC template expressions and external web components go GA, and SOAP login, the username-password flow and connected apps all get their end dates.
status: draft
sources:
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_apex.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_api.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_lc.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_lab.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_tools.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_ru.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_builder.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_builder_screen_flows.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_debug.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_flow_error_handling.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_automated_approvals.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_automate_orchestrator.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_permissions.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_customization_general.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_security.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_sales.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_sales_features_core.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_sales_forecasts.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_service.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_service_case_management.htm&release=264&type=5
  - https://help.salesforce.com/s/articleView?id=release-notes.rn_salesforce_knowledge.htm&release=264&type=5
  - https://developer.salesforce.com/blogs/2026/10/developers-guide-to-the-winter-26-release
  - https://admin.salesforce.com/blog/2026/admin-winter-27-release-countdown
---

Patch 264, API 68.0. Sandbox preview from 28 August 2026, production on 4 September, 2 October and 9 October 2026. One thing to know during the preview window: metadata that uses API 68.0 won't deploy to production until production is upgraded, and the sandbox setting "Enforce the Summer '26 Apex heap limit" exists for exactly that reason.

A good patch for developers. The limits go up, Flow becomes testable, and the Developer Console is quietly retired in favour of a real editor in Setup.

## What I'd actually use

- [buff] **Apex heap: 6 MB to 10 MB synchronous, 12 MB to 25 MB asynchronous.** Automatic. A whole family of "Apex heap size too large" tickets just closed itself.
- [beta] **Flow Test Mode.** Saved, reusable test scenarios for autolaunched and record-triggered flows, with mock outputs for Action and Subflow elements. Flow finally gets tests that look like tests.
- [new] **Complex template expressions (GA)** and **`lwc:external` (GA)**. Ternaries and filters in the template, third-party web components without wrappers.
- [new] **Screen flows as mass quick actions** from list views and related lists, receiving the selected record IDs. The number one reason people still wrote Visualforce list buttons.
- [new] **Web Console (GA).** VS Code for Web inside Setup. The Developer Console is hidden by default from now on.

> The heap bump is the feature everyone notices, but the one I'd budget time for is the auth clean-up at the bottom of this page. Between SOAP login, the username-password flow and connected apps losing support, every integration older than two years needs a look before February.

## Apex

- [buff] **Heap limits rise to 10 MB synchronous and 25 MB asynchronous** with no code change. Keep the sandbox toggle on while production is still on Summer '26.
- [buff] **Elastic limits (beta) now cover Batch Apex** as well as Queueable and future, with throttling above the rolling 24-hour limit. You can override the async job limit in non-production orgs to test the behaviour.
- [pilot] **Apex integration tests** (developer preview): `@IntegrationTest` makes real callouts through named credentials and external services, in scratch orgs only, with `@BeforeClass` and `@TearDown`. No rollback, no coverage credit, one class at a time.
- [new] **`Database.QueryOptions` with `withExplicitNamespace(true)`**, bound with `SET OPTIONS :options`, stops subscriber fields from shadowing managed-package fields of the same name in dynamic SOQL.
- [new] **Custom sharing reasons on standard objects from Apex.** Shares with a custom row cause survive owner changes, unlike manual shares.
- [beta] **Apex Symbol API**: a Tooling resource that returns compiler-grade type metadata for IDE completion and for grounding coding agents.
- [buff] **Compile only invalid classes and triggers** from Setup instead of a full-org recompile. The compiler now warns for classes on API 9.0 to 19.0, which will be retired.
- [beta] **Apex Cursors on Data 360 objects**, and `FORMULA()` expressions in SOQL WHERE clauses at API 68.0 (not in production orgs yet).
- [fix] Test Discovery API: `testLevel` replaces `showAllMethods` from API 68.0.
- [new] **Tooling**: Web Console GA, ApexGuru anti-pattern scans and duplicate-code insights in the DX MCP Server, `sf template generate apex class --template Batchable|Queueable`, `sf apex run --debug-level`, and an official Salesforce development plugin for Claude Code.

## Lightning Web Components

- [new] **LWC API 68.0** has no version-specific behaviour changes. Bump it.
- [new] **Complex template expressions are GA**: template literals, ternaries, optional chaining and `items.filter(...)` inside `for:each`. Attribute expressions must be double-quoted and the component must be on API 66.0 or higher.
- [new] **Third-party web components are GA** with `lwc:external`. Needs Lightning Web Security; load libraries as IIFE or UMD through `loadScript`.
- [buff] **State managers get `refresh()`** to refetch list-shaped data such as related lists without a page reload. New `lightning/platformNavigationItemApi` manages console navigation items.
- [breaking] **Under Lightning Web Security, `window.open()` to a same-origin URL now throws.** Use a detached anchor and click it programmatically.
- [beta] **`lightning-ui-embedding`** embeds a deployed React or Angular app in a Lightning or Experience page, props down and events up. Multi-framework apps get Angular templates and second-generation packaging.
- [beta] **Headless experience layer**: a `UiWidgetBundle` plus a `LightningTypeBundle` render an Apex action's output as an interactive card in Agentforce, Claude and Slack.
- [beta] **Page-based quick actions** in App Builder: one reusable action layout with sections and visibility rules. The Follow button can be put back on the dynamic highlights panel.
- [beta] **Lightning reports and dashboards in LWR Experience sites**, plus report row preview in a side panel.
- [breaking] **Experience Cloud**: the "Conceal Personal Information Fields from Guest Users" update adds a `Guest_PersonalInfo_EPIM` field set, enforced in Spring '27. The Experience Delivery and Experience Cloud Agent betas are discontinued.
- [nerf] **`<ai>` and `<design:ai>` tags in component bundles now fail on save.** Existing components keep working.

## Flow and automation

- [beta] **Flow Test Mode** merges debugging and saved test scenarios, with mocked Action and Subflow outputs. Agentforce for Flow can generate scenarios from the terminal.
- [new] **Screen flows as mass actions** on list views and related lists, a new Time screen component, and reactive formulas in conditional visibility.
- [buff] **Builder**: Cosmos theme, denser canvas, an Edit History timeline with restore, auto-generated element labels, collapsible groups, an Unused Resources filter, keyboard navigation with cut, copy and paste, and End elements saved to metadata.
- [new] **Decision types Split by Date and Split by Field Value**, a Collection Filter Criteria resource that returns the first match without a Loop, and the Contains operator on multi-select picklists in Get, Update and Delete Records.
- [new] **Run option "User Context, enforces user permissions"** for screen and autolaunched flows.
- [new] **Flow tags and categories** to filter the flow list, Flow Author in beta to build a flow from a description, and on-canvas performance insights for non-screen flows.
- [fix] **Save-time warnings** for field-length violations and missing required fields in Create Records. Schedule-triggered flows on runtime API 62.0 or lower retry once after ten seconds on a record lock.
- [buff] **Flow approval processes**: the Request Approvals component offers up to ten autolaunched approval processes on one page, admins can debug, suspend and resume submissions, submissions can be deleted for GDPR requests, work items get a private sharing model, and background steps with synchronous actions run synchronously once the process is on API 68.0.
- [buff] **Flow Orchestration**: "Automatically Open Next Work Item" in the work guide, New and Outdated badges without a refresh, and the same synchronous-step change at API 68.0.
- [retired] **Workflow Rules and Process Builder** don't appear in these notes at all. The Automation section is Flow Builder, approvals, orchestration and MuleSoft for Flow.

## Core config

- [breaking] **Profile filtering is enforced**: users only see their own profile name unless they have View All Profiles.
- [new] **Keep Manual Shares When Transferring Records**, a sharing setting that is off by default and stops manual shares from being deleted on owner change.
- [breaking] **Sharing recalculation after group and role changes becomes asynchronous** in some cases. Apex and flows that read share rows immediately need to change before Spring '27.
- [new] **Field history tracking on the User object (GA)**, up to twenty fields. A dedicated View Setup Audit Trail permission arrives as a release update for Spring '27. The Org Health and Usage dashboard sits in Setup for every admin.
- [buff] **List views** can inline-edit fields that aren't on the page layout and views with several record types, behind two user interface settings.
- [new] **REST accepts `latest` as the version** in the URI, EventLogFile gets Composite API event types, the Streaming API emits a per-channel replay watermark, and Bulk API 2.0 adds marketing objects with a refresh operation.
- [nerf] **Security**: refresh tokens expire after 30 idle days, step-up authentication guards sensitive security settings, named credentials accept custom CA certificates, and Security Center monitors MCP servers in beta.
- [breaking] **MFA**: four "Finish Preparing for Enforcement" release updates show up from November 2026 for orgs that had extensions, including phishing-resistant MFA for privileged users and step-up on report exports.
- [beta] **Joined reports with common rows only** and report record preview. Setup with Agentforce gives org-specific remediation advice.

## Sales Cloud

- [new] **Custom signals in Sales Workspace**, written by Flow or Apex as recommendation records with an action and a signal definition, plus escalated-case risk signals on key accounts and reporting on acted and dismissed signals.
- [buff] **Pipeline forecasting** shows deal risks, methodology scores, contact insights and activity heatmaps as columns. A forecasting agent arrived in October to explain pipeline changes.
- [buff] **Enhanced opportunity scoring** uses conversation data and engagement signals, not just opportunity fields.
- [breaking] **Sales Engagement data is native on the platform** with new reports and a sample dashboard. The Sales Engagement Performance dashboard retires in November 2026.
- [new] **Account plans** get a guided setup in Salesforce Go behind one permission set.
- [new] **October additions**: conversation capture, executive briefs, call coaching on video calls, key-field updates from insights, and Salesforce in Claude in beta.
- [retired] **Salesforce for Outlook retires on 30 January 2027**, earlier than the December 2027 date announced before.

## Service Cloud

- [new] **AI writing tools on case comments** (polish, expand, summarise, refine with instructions) driven by a prompt template you can edit. Attachments added in the first 30 seconds show inline under the description.
- [beta] **Case merge** settings are consolidated; enhanced merge uses duplicate and matching rules, and merging from Omni-Channel queues stays in beta.
- [fix] **Case milestones can be deleted** through Data Loader or Apex to clean up wrongly attached ones.
- [buff] **Omni-Channel**: Command Center for Service V2 gains Service Reps and Backlog components, and bots join conversations without the pending-routing round trip.
- [buff] **Work summaries** are generated and saved automatically for voice calls and enhanced messaging sessions, in five more languages. Work Summaries for Case in beta retired on 30 September 2026.
- [new] **Knowledge**: reusable Knowledge Blocks, article creation from any record with your own prompt templates, a similarity score, article cloning, and images of archived and internal articles are no longer served publicly.
- [fix] Service Cloud Voice with partner telephony is now "Partner Contact Center".
- [new] **Messaging**: RCS as a channel, the Conversation Data API can delete and update conversation data from Flow or Apex, and customers get a configurable auto-response when a chat is rerouted.

## What breaks

- [breaking] **Enforced this release**: the Use Any API Auth permission for SOAP `login()` (users without it fail to log in, uniformly in every org from 1 December 2026), profile filtering, and three WCAG 2.2 accessibility updates that change page headers, modals, cards, docked containers, menus, date pickers and utility bars.
- [breaking] **The OAuth username-password flow for connected apps ends on 20 February 2027**, postponed from this release. It will break every integration that still uses it.
- [breaking] **The user-agent and hybrid user-agent flows retire on 20 February 2027** and are already blocked in new orgs. The device flow is restricted to local external client apps with a localhost callback from 30 November 2026.
- [breaking] **Maintain Your Email Verification Exception** replaces the cancelled Adopt Authorized Email Domains update: configure an authorised domain or lose the exception on 1 December 2026.
- [breaking] **Update Instanced URLs in API Traffic** starts phased enforcement in October 2026 for sandboxes and January 2027 for production. Use the My Domain URL everywhere.
- [breaking] **Spring '27 prep**: platform event trigger transactions roll back on unhandled exceptions, non-public system fields are stripped from Aura action responses, the View Setup Audit Trail permission, guest-user personal information concealment, Salesforce to Salesforce retired, and the Salesforce Connect cross-org adapter loses password and OAuth auth (use named credentials).
- [retired] **Summer '27**: connected apps lose support in production (migrate to external client apps), SOAP `login()` on API 31.0 to 64.0 is removed, and anonymous Apex from managed packages is blocked.
- [retired] **API versions 31.0 to 40.0** are deprecated in Summer '27 and retired in Summer '28, when calls return 410. Apex on API 9.0 to 19.0 already gets compiler warnings.
- [nerf] **Integrations that sit idle must re-authenticate** once refresh tokens expire after 30 days.
- [breaking] **Salesforce CLI** no longer prints tokens or passwords in `org display --json`; the temporary secrets flag was removed on 28 October 2026, so CI pipelines use `sf org auth show-access-token`. The CLI needs Node.js 22 or newer.
- [retired] **Developer Console is hidden from Setup** by default; the Web Console replaces it, with Apex read-only in production.

> Pin three dates on the wall: 1 December 2026 for SOAP login permissions, 20 February 2027 for the username-password and user-agent flows, and Summer '27 for connected apps. Inventory every integration user in the org, find the flow each one uses, and move them to external client apps in that order.

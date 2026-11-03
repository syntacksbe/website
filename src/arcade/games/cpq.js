// CPQ games for the Syntacks Arcade (format: src/arcade/format.js).
const lines = (...l) => l.join('\n')

export default {
  id: 'cpq',
  title: 'CPQ',
  icon: '🧾',
  blurb: 'Bundles, rules, discounts and renewals: level up your Salesforce CPQ.',
  games: [
    // 1 ─ Product rule or price rule?
    {
      id: 'cpq-rule-or-rule',
      title: 'Which rule?',
      blurb: 'Product rule or price rule? Pick the right tool.',
      type: 'sort',
      level: 1,
      buckets: ['Product rule', 'Price rule'],
      rounds: [
        {
          text: 'Block the quote when a server is sold without a support plan.',
          bucket: 0,
          why: 'Stopping an invalid configuration is a validation product rule; price rules change field values like prices.',
        },
        {
          text: 'Give every line 10% additional discount when the quote region is EMEA.',
          bucket: 1,
          why: 'Writing a value into a quote line field (here Additional Discount) during calculation is exactly what a price action does.',
        },
        {
          text: 'Auto-add a rack kit when 4 or more servers are picked in the bundle.',
          bucket: 0,
          why: 'Adding, removing or hiding options is a selection product rule.',
        },
        {
          text: 'Look up the install fee per country in a custom table and write it on the line.',
          bucket: 1,
          why: 'Price rules can run lookup queries against a lookup object and push the result into a field.',
        },
        {
          text: 'Warn the rep that a trial licence ends after 30 days, but let them save.',
          bucket: 0,
          why: 'A message that does not block is an alert product rule.',
        },
        {
          text: 'Set the Special Price to a flat €99 when the promo code is LEVELUP.',
          bucket: 1,
          why: 'Overwriting a price field in the waterfall is a price rule job; product rules never touch prices.',
        },
        {
          text: 'Show only the drives that fit the chosen chassis in the option search.',
          bucket: 0,
          why: 'Narrowing what a product search returns is a filter product rule.',
        },
        {
          text: "Copy the bundle's term into a custom field on each child line at calculation time.",
          bucket: 1,
          why: 'Setting field values on quote lines while the calculator runs is a price rule, even when no price changes.',
        },
      ],
    },

    // 2 ─ Bundles, features, options
    {
      id: 'cpq-bundle-builder',
      title: 'Bundle Builder',
      blurb: 'Features, options and quantities: build a bundle that behaves.',
      type: 'quiz',
      level: 1,
      rounds: [
        {
          q: 'In a bundle, what groups related options (say "Storage" or "Support") on the configuration page?',
          options: ['Quote line group', 'Product feature', 'Price book', 'Option constraint'],
          answer: 1,
          why: 'Features are the categories inside a bundle. Each option sits in a feature, and a feature can set min and max option counts.',
        },
        {
          q: 'An "Arcade Cabinet" bundle has quantity 3. Its Joystick option is a Component with quantity 2. How many joysticks land on the quote?',
          options: ['2', '3', '5', '6'],
          answer: 3,
          why: 'Component quantities multiply with the bundle: 2 per cabinet × 3 cabinets = 6. An Accessory would stay at 2.',
        },
        {
          q: 'What does ticking "Bundled" on a product option do?',
          options: [
            'It becomes its own quote line group',
            'It is billed as a subscription',
            'Its price is included in the bundle, so the line is priced at zero',
            'It only shows on the quote document',
          ],
          answer: 2,
          why: 'A bundled option is part of the parent price. It still appears as a line (handy for fulfilment), but at zero.',
        },
        {
          q: 'Every bundle must contain exactly one support plan from the Support feature. What do you set on the feature?',
          options: ['Max Option Count = 1 only', 'Option Type = Accessory', 'Min Option Count = 1 and Max Option Count = 1', 'Bundled on each plan'],
          answer: 2,
          why: 'Min 1 forces a pick and Max 1 caps it, so the rep must choose exactly one plan.',
        },
        {
          q: 'A "Colour" picklist the rep fills in once for the whole bundle, which product rules can then test. What is it?',
          options: ['Configuration attribute', 'Twin field', 'Price dimension', 'Summary variable'],
          answer: 0,
          why: 'Configuration attributes are bundle-level inputs shown at the top or bottom of the configurator, often used in product rule conditions.',
        },
        {
          q: 'The "Pro Lens" option may only be picked once "Camera Body" is selected. What is the quickest setup without writing a rule?',
          options: ['A price rule', 'An option constraint of type Exclusion', 'A discount schedule', 'An option constraint of type Dependency'],
          answer: 3,
          why: 'A Dependency constraint makes the constrained option (lens) selectable only when the constraining option (body) is picked. Exclusion does the opposite.',
        },
      ],
    },

    // 3 ─ Product rule types
    {
      id: 'cpq-rule-dojo',
      title: 'Rule Dojo',
      blurb: 'Block, warn or act: sort each need into the right product rule type.',
      type: 'sort',
      level: 1,
      buckets: ['Validation', 'Alert', 'Selection'],
      rounds: [
        {
          text: 'Stop the save: a Pro licence needs at least 5 seats.',
          bucket: 0,
          why: 'Validation rules show an error and block the save until the problem is fixed.',
        },
        {
          text: 'Suggest the extended warranty, but let the rep carry on without it.',
          bucket: 1,
          why: 'Alert rules show a message the rep can acknowledge and move past.',
        },
        {
          text: 'Auto-add a power cable whenever a monitor is selected.',
          bucket: 2,
          why: 'Selection rules act on options: Add, Remove, Show, Hide, Enable or Disable.',
        },
        {
          text: 'Hide the on-prem installer when the Cloud edition is chosen.',
          bucket: 2,
          why: 'Hiding an option is a selection rule action, not an error.',
        },
        {
          text: 'Throw an error when two operating systems are picked in one bundle.',
          bucket: 0,
          why: 'An invalid combination that must not be saved calls for a validation rule.',
        },
        {
          text: 'Remind the rep that a discount above 30% will need approval, while still allowing the save.',
          bucket: 1,
          why: 'An informational heads-up that does not block is an alert.',
        },
        {
          text: 'Disable the Gold Support option for the Starter edition.',
          bucket: 2,
          why: 'Disable is a selection rule action: the option stays visible but cannot be picked.',
        },
        {
          text: 'Refuse to save when the quote end date is before the start date.',
          bucket: 0,
          why: 'Product rules can test quote fields too; blocking bad data is validation.',
        },
      ],
    },

    // 4 ─ Waterfall and sequences
    {
      id: 'cpq-waterfall-run',
      title: 'Waterfall Run',
      blurb: 'Ride the price waterfall and the calculator events in the right order.',
      type: 'order',
      level: 2,
      rounds: [
        {
          q: 'Climb down the price waterfall: put the quote line price fields in calculation order.',
          items: ['List Unit Price', 'Special Price', 'Regular Price', 'Customer Price', 'Partner Price', 'Net Price'],
          why: 'Each price feeds the next: special (contracted or custom), regular (after discount schedules), customer (after additional discount), partner, then net (after distributor discount).',
        },
        {
          q: 'A line gets several discounts. Order them as the waterfall applies them.',
          items: [
            'Account contracted price sets the special price',
            'Volume discount schedule applies',
            "Rep's additional discount applies",
            'Partner discount applies',
            'Distributor discount applies',
          ],
          why: 'Contracted price lands in Special Price, discount schedules produce Regular Price, the manual discount gives Customer Price, then partner and distributor discounts lead to Net Price.',
        },
        {
          q: 'Price rule evaluation events: put them in the order the quote calculator fires them.',
          items: ['On Initialization', 'Before Calculate', 'On Calculate', 'After Calculate'],
          why: 'On Initialization fires first, before any calculation; After Calculate fires last, once net prices are set, which makes it the spot for final roll-ups.',
        },
        {
          q: 'A customer wants 10 more seats mid-contract. Order the amendment flow.',
          items: [
            'Contract is active with subscriptions',
            'Rep clicks Amend on the contract',
            'CPQ creates an amendment opportunity and quote',
            'Rep adds the seats in the Quote Line Editor',
            'Amendment is contracted and the new subscriptions join the original contract',
          ],
          why: 'Amendments start from an active contract; new lines co-term to its end date, and once contracted their subscriptions are added to that same contract.',
        },
      ],
    },

    // 5 ─ Match pricing methods, rule types, contract terms
    {
      id: 'cpq-combo-matcher',
      title: 'Combo Matcher',
      blurb: 'Link pricing methods, rule types and contract terms to what they do.',
      type: 'match',
      level: 2,
      rounds: [
        {
          q: 'Match each product Pricing Method to where its price comes from.',
          pairs: [
            ['List', 'The price book entry'],
            ['Cost', 'Product cost plus a markup'],
            ['Block', 'A flat price per quantity range'],
            ['Percent of Total', 'A percentage of other lines on the quote'],
          ],
        },
        {
          q: 'Match each product rule type to what it does.',
          pairs: [
            ['Validation', 'Blocks the save with an error'],
            ['Alert', 'Warns, but lets the rep continue'],
            ['Selection', 'Adds, removes, hides or disables options'],
            ['Filter', 'Narrows the products a search shows'],
          ],
        },
        {
          q: 'Match each subscription term to its meaning.',
          pairs: [
            ['Amendment', 'Changes an active contract mid-term'],
            ['Renewal', 'Quotes the next term of a contract'],
            ['Co-termination', 'New lines end on the contract end date'],
            ['Proration', 'Price scaled to a partial term'],
          ],
        },
      ],
    },

    // 6 ─ Discount schedules, block pricing, bundle setup
    {
      id: 'cpq-tier-trouble',
      title: 'Tier Trouble',
      blurb: 'Discount tiers, block prices and bundle limits: find the broken setting.',
      type: 'bug',
      level: 2,
      rounds: [
        {
          q: 'Goal: all units get the rate of the tier the total lands in, so 150 units all get 20% off.',
          code: lines(
            'Discount Schedule: Volume Boost',
            'Type: Slab',
            'Discount Unit: Percent',
            'Tier 1: 1–99 units → 10%',
            'Tier 2: 100–499 units → 20%',
            'Tier 3: 500+ units → 30%',
          ),
          bug: 1,
          why: 'That is a Range schedule: all 150 units get 20%. Slab splits them like tax brackets: 99 units at 10% and 51 units at 20%.',
        },
        {
          q: 'The tiers must cover every quantity. Which lower bound breaks the ladder?',
          code: lines(
            'Discount Schedule: Seat Saver',
            'Type: Range',
            'Tier 1: Lower Bound 1, Upper Bound 50 → 5%',
            'Tier 2: Lower Bound 50, Upper Bound 200 → 10%',
            'Tier 3: Lower Bound 250, Upper Bound 1000 → 15%',
            'Tier 4: Lower Bound 1000 → 20%',
          ),
          bug: 4,
          why: 'Tier 2 ends at 200 but Tier 3 starts at 250, so 200–249 seats fall through the gap. Each lower bound should match the previous upper bound.',
        },
        {
          q: 'Goal: 1–10 users cost a flat €500 in total, 11–25 users a flat €900. The block prices never apply.',
          code: lines(
            'Product: Squad Licence',
            'Pricing Method: List',
            'Block Price 1: 1–10 users → €500',
            'Block Price 2: 11–25 users → €900',
            'Price Book: Standard',
          ),
          bug: 1,
          why: 'Block prices are only used when the Pricing Method is Block. Then 8 users cost €500 in total, not €500 each.',
        },
        {
          q: 'Goal: each Studio Kit bundle includes exactly one support plan.',
          code: lines(
            'Bundle: Studio Kit',
            'Feature: Support',
            'Min Option Count: 1',
            'Max Option Count: 2',
            'Option: Gold Support (Accessory)',
            'Option: Silver Support (Accessory)',
          ),
          bug: 3,
          why: 'Min 1 forces a pick, but Max 2 lets the rep take both plans. Exactly one needs Min 1 and Max 1.',
        },
        {
          q: 'Goal: block the save when a server is quoted without a support plan.',
          code: lines(
            'Product Rule: Server Needs Support',
            'Type: Alert',
            'Evaluation Event: Save',
            'Conditions Met: All',
            'Error Condition 1: Server selected',
            'Error Condition 2: No support plan selected',
            'Message: Add a support plan to every server.',
          ),
          bug: 1,
          why: 'An Alert shows the message but still lets the rep save. To block, the Type must be Validation.',
        },
        {
          q: 'Goal: the longer the subscription term, the bigger the discount, whatever the quantity.',
          code: lines(
            'Product: Cloud Vault',
            'Subscription Pricing: Fixed Price',
            'Subscription Term: 12',
            'Discount Schedule: Loyalty Years',
            'Loyalty Years Tier 1: 12–23 months → 0%',
            'Loyalty Years Tier 2: 24–35 months → 5%',
            'Loyalty Years Tier 3: 36+ months → 10%',
          ),
          bug: 3,
          why: 'The Discount Schedule lookup tiers on quantity. Term-based tiers go in the Term Discount Schedule field, so a 36-month deal gets 10%.',
        },
      ],
    },

    // 7 ─ Advanced Approvals
    {
      id: 'cpq-approval-boss',
      title: 'Approval Boss Fight',
      blurb: 'Steps, chains, variables and smart approvals: get the deal past the bosses.',
      type: 'quiz',
      level: 2,
      rounds: [
        {
          q: 'Two approval rules have Approval Step 1 and one has Approval Step 2. How are they requested?',
          options: [
            'All three at the same time',
            'The two step-1 rules in parallel, then step 2',
            'One by one in alphabetical order',
            'Step 2 first, because it outranks step 1',
          ],
          answer: 1,
          why: 'Rules with the same step number are requested in parallel; the next step starts once the lower step is approved.',
        },
        {
          q: 'What does an approval variable do?',
          options: [
            "Stores the approver's out-of-office delegate",
            'Picks the email template for approval requests',
            'Rolls up quote line data, e.g. counts lines with a discount above 20%, for use in conditions',
            'Ranks approvers by seniority',
          ],
          answer: 2,
          why: 'Approval variables aggregate child records (sum, count, min, max, average), so a rule can fire on "more than 3 lines above 20%".',
        },
        {
          q: 'A quote was approved at 15% discount, then recalled. The rep lowers it to 10% and resubmits. The rule has Smart Approvals on. What happens?',
          options: [
            'The approver who already approved is not asked again',
            'Every approver must approve again',
            'The quote is rejected automatically',
            'The rule switches to a different approver',
          ],
          answer: 0,
          why: 'With Smart Approvals, an approver who already said yes is skipped when the value they approved has not gone up. 10% is below the approved 15%.',
        },
        {
          q: 'Several approval rules must reuse the same sequence: manager, then director, then VP. What do you build?',
          options: ['An approval variable', 'A summary variable', 'A price rule', 'An approval chain'],
          answer: 3,
          why: 'An approval chain is a reusable, ordered sequence of approvals that rules can point to, so you define the ladder once.',
        },
        {
          q: "Each quote must go to the account owner's manager, a different person on every quote. What do you set on the approval rule?",
          options: [
            'One rule per manager',
            'An approval variable',
            'An Approver Field pointing to a user lookup on the quote',
            'A fixed approver user',
          ],
          answer: 2,
          why: 'An approver field makes the approver dynamic: the rule reads the user from a field on the record instead of a fixed name.',
        },
        {
          q: 'A rule must fire when discount > 20% AND (region = EMEA OR deal > €100k). Conditions 1, 2 and 3 are in that order. What do you set?',
          options: [
            'Conditions Met = Custom, Advanced Condition = 1 AND (2 OR 3)',
            'Conditions Met = All',
            'Conditions Met = Any',
            'Two rules with the same step',
          ],
          answer: 0,
          why: 'All would also need EMEA and €100k together; Any would fire on EMEA alone. Mixed logic needs Custom with an advanced condition.',
        },
      ],
    },

    // 8 ─ Subscriptions, proration, MDQ, renewals
    {
      id: 'cpq-time-warp',
      title: 'Time Warp',
      blurb: 'Prorate, co-term, segment and renew: bend subscription time.',
      type: 'quiz',
      level: 3,
      rounds: [
        {
          q: 'A subscription costs €1,200 with a default Subscription Term of 12 months. The quote term is 6 months. What is the prorated price?',
          options: ['€1,200', '€600', '€100', '€2,400'],
          answer: 1,
          why: 'Prorate multiplier = quote term ÷ product term = 6 ÷ 12 = 0.5, so €1,200 × 0.5 = €600.',
        },
        {
          q: 'A 12-month contract runs January to December. In July you amend it to add one seat priced €1,200 per year. What does the seat cost on the amendment?',
          options: ['€600, co-termed to the contract end', '€1,200, a full year', '€0, amendments are free', '€100, one month'],
          answer: 0,
          why: 'Amendment lines end on the contract end date, so the seat covers 6 of 12 months: €1,200 × 6/12 = €600.',
        },
        {
          q: 'A 3-year deal needs a different price, quantity and discount per year. Which CPQ feature fits?',
          options: ['Block pricing', 'Term discount schedule', 'Multi-dimensional quoting with a Year price dimension', 'Percent of Total pricing'],
          answer: 2,
          why: 'MDQ splits one product into segments (year, quarter, month, one-time or custom), each its own quote line with its own price and discount.',
        },
        {
          q: 'Which two values does the Renewal Model field offer?',
          options: ['Monthly and Yearly', 'Evergreen and Renewable', 'Same and Uplift', 'Contract Based and Asset Based'],
          answer: 3,
          why: 'Contract-based renewals renew the subscriptions on a contract; asset-based renewals renew the assets the customer owns.',
        },
        {
          q: 'Renewal Pricing Method is Uplift with a 5% uplift rate. Last term a licence cost €1,000. What is the renewal price?',
          options: ['€1,000', '€950', '€1,050', '€1,500'],
          answer: 2,
          why: 'Uplift raises the previous price by the rate: €1,000 × 1.05 = €1,050. "Same" would keep €1,000; "List" would reprice from the price book.',
        },
        {
          q: 'Which Subscription Type has no end date, so it never generates a renewal?',
          options: ['Renewable', 'Evergreen', 'One-time', 'Fixed Price'],
          answer: 1,
          why: 'Evergreen subscriptions run until cancelled. Renewable ones end and renew; Fixed Price is a Subscription Pricing value, not a type.',
        },
      ],
    },

    // 9 ─ Product and price rule internals
    {
      id: 'cpq-rule-debugger',
      title: 'Rule Debugger',
      blurb: 'Conditions, lookups, events and actions: debug rules like a pro.',
      type: 'bug',
      level: 3,
      rounds: [
        {
          q: 'Goal: 10% off when the region is EMEA and the line is either 10+ units or Hardware.',
          code: lines(
            'Price Rule: EMEA Promo',
            'Evaluation Event: On Calculate',
            'Conditions Met: Custom',
            'Condition 1: Quote Region equals EMEA',
            'Condition 2: Line Quantity ≥ 10',
            'Condition 3: Line Product Family equals Hardware',
            'Advanced Condition: 1 AND (2 OR 4)',
            'Price Action: Additional Discount (%) = 10',
          ),
          bug: 6,
          why: 'The advanced condition uses condition index numbers, and there is no condition 4. It should read 1 AND (2 OR 3).',
        },
        {
          q: "Goal: write each country's install fee from a lookup table onto the line.",
          code: lines(
            'Price Rule: Install Fee by Country',
            'Evaluation Event: On Calculate',
            'Lookup Object: Install_Fee__c',
            'Lookup Query: Line Country__c equals Country__c',
            'Price Action Target Field: Install Fee',
            'Price Action Value: 150',
          ),
          bug: 5,
          why: 'A hard-coded value of 150 ignores the lookup. The action needs a Source Lookup Field (e.g. Fee__c) so each country row supplies its own amount.',
        },
        {
          q: 'Goal: warn the rep in the configurator the moment they change the seat count, not only on save.',
          code: lines(
            'Product Rule: Seat Check',
            'Type: Alert',
            'Scope: Product',
            'Evaluation Event: Save',
            'Conditions Met: All',
            'Error Condition: Seats less than 5',
            'Message: Pro licences start at 5 seats.',
          ),
          bug: 3,
          why: 'Save fires only when the rep saves. Edit (or Always) fires on each change in the configurator.',
        },
        {
          q: 'Goal: when a camera body is selected, add a memory card automatically.',
          code: lines(
            'Product Rule: Card With Camera',
            'Type: Selection',
            'Scope: Product',
            'Evaluation Event: Always',
            'Error Condition: Camera Body selected',
            'Product Action Type: Remove',
            'Product Action Product: 64GB Memory Card',
          ),
          bug: 5,
          why: 'Remove deselects the card. The action type should be Add (or Show & Add if the card starts hidden).',
        },
        {
          q: 'Goal: the price condition fires when the quote has more than 10 hardware units in total.',
          code: lines(
            'Summary Variable: Hardware Units',
            'Target Object: Quote Line',
            'Aggregate Function: Count',
            'Aggregate Field: Quantity',
            'Filter Field: Product Family',
            'Filter Value: Hardware',
            'Price Condition: Hardware Units greater than 10',
          ),
          bug: 2,
          why: 'Count counts lines: 3 lines of 5 units gives 3, not 15. Sum of Quantity gives 15, so the condition fires.',
        },
        {
          q: 'Goal: block the save if the term is under 12 months OR the payment terms are Net 90.',
          code: lines(
            'Product Rule: Term Guard',
            'Type: Validation',
            'Scope: Quote',
            'Evaluation Event: Save',
            'Conditions Met: All',
            'Error Condition 1: Quote Subscription Term less than 12',
            'Error Condition 2: Quote Payment Terms equals Net 90',
            'Message: Minimum 12 months, and no Net 90.',
          ),
          bug: 4,
          why: 'All needs both conditions true, so a 6-month quote on Net 30 slips through. Any fires on either one.',
        },
      ],
    },

    // 10 ─ QLE, twin fields, templates, orders
    {
      id: 'cpq-paper-trail',
      title: 'Paper Trail',
      blurb: 'From Quote Line Editor to PDF to order: follow the data.',
      type: 'quiz',
      level: 3,
      rounds: [
        {
          q: 'You add Region__c (Text) to Product and to Quote Line. Why does CPQ copy the value onto new lines with no automation?',
          options: [
            'A default price rule copies all custom fields',
            'Same API name and compatible type make it a twin field',
            'CPQ copies every Product field to Quote Line',
            'The Line Editor field set syncs it',
          ],
          answer: 1,
          why: 'Twin fields share an API name and data type across objects (Product, Quote Line, Opportunity Product, Order Product), and CPQ copies them along the way.',
        },
        {
          q: 'Which Quote Line field set controls the columns in the Quote Line Editor?',
          options: ['Line Editor', 'Editor Columns', 'Quote Display', 'Visible Lines'],
          answer: 0,
          why: 'Add a field to the Line Editor field set on Quote Line and it shows up as a column in the QLE.',
        },
        {
          q: 'Which template content type prints the table of quote lines?',
          options: ['HTML', 'Quote Terms', 'Line Items', 'Template Top'],
          answer: 2,
          why: "Line Items content renders the quote lines; which columns appear is set by the template's line columns.",
        },
        {
          q: 'A "Hardware warranty" section should print only on quotes that contain hardware. What does the template section use?',
          options: [
            'A Conditional Print Field, a checkbox on the quote',
            'A separate template for every quote',
            'A validation rule on the quote',
            'An approval rule',
          ],
          answer: 0,
          why: 'The section prints only when the quote checkbox named in Conditional Print Field is true, often a formula like "has hardware lines".',
        },
        {
          q: 'The rep clicks Generate Document and saves. Which record holds the generated file?',
          options: ['Quote Template', 'Order', 'Contract', 'Quote Document, linked to the quote'],
          answer: 3,
          why: 'Each generated PDF or Word file is stored as a Quote Document on the quote, so you keep every version sent.',
        },
        {
          q: 'What is the standard CPQ way to create an order from the primary quote?',
          options: [
            'Generate a quote document',
            'Check Ordered on the quote or the opportunity',
            'Clone the opportunity',
            'Run an After Calculate price rule',
          ],
          answer: 1,
          why: 'Ordered = true makes CPQ create an order with order products from the quote lines; twin fields carry custom values across.',
        },
      ],
    },
  ],
}

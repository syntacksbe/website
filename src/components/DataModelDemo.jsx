import { useEffect, useState } from 'react'
import { useGame } from '../game.jsx'
import { useMedia } from '../useMedia.js'
import Quest from './Quest.jsx'

// Grid layout: 4 columns × 2 rows. Relationships only connect neighbouring cells.
const BOX_H = 84
const ROW_TOP = [8, 150]
const CANVAS_H = ROW_TOP[1] + BOX_H + 16
const cx = (col) => col * 25 + 12.5 // % of canvas width
const cy = (row) => ROW_TOP[row] + BOX_H / 2

const KIND_LABEL = { standard: 'Standard', custom: 'Custom', junction: 'Junction', big: 'Big Object' }
const TYPE_LABEL = { md: 'Master-detail', lookup: 'Lookup', big: 'Big Object link' }
const TYPE_FACTS = {
  md: ['Deleting the parent deletes the children', 'Children inherit the parent’s sharing', 'Roll-up summary fields out of the box'],
  lookup: ['Each record keeps its own owner and sharing', 'Delete behaviour is configurable', 'Roll-ups need Flow or code'],
  big: ['Scales to billions of records', 'No triggers, limited reporting', 'Query with async SOQL or aggregates'],
}

const OPTION = {
  md: 'Master-detail',
  lookup: 'Lookup',
  junction: 'Junction object',
  big: 'Big Object / external',
}

const MODELS = [
  {
    id: 'realEstate',
    label: 'Real estate',
    start: 'unit',
    objects: [
      { id: 'owner', label: 'Owner', api: 'Account', kind: 'standard', col: 0, row: 0, volume: '3.1K', fields: [['Name', 'Text'], ['VAT__c', 'Text · External ID'], ['Portfolio_Value__c', 'Roll-up · SUM'], ['Type', 'Picklist']], note: 'Owners are standard Accounts, so you get sharing, reporting and partner portals for free.' },
      { id: 'property', label: 'Property', api: 'Property__c', kind: 'custom', col: 1, row: 0, volume: '1.2K', fields: [['Owner__c', 'Lookup · Account'], ['Address__c', 'Address'], ['Type__c', 'Picklist · Residential, Commercial'], ['Leased_Units__c', 'Roll-up · COUNT']], note: 'Occupancy is a roll-up summary over its units — live numbers, no code.' },
      { id: 'unit', label: 'Unit', api: 'Unit__c', kind: 'custom', col: 2, row: 0, volume: '18K', fields: [['Property__c', 'Master-detail · Property'], ['Floor__c', 'Number'], ['Surface_m2__c', 'Number'], ['Status__c', 'Picklist · Available, Leased']], note: 'The heart of the model: every lease, request and payment traces back to a unit.' },
      { id: 'case', label: 'Maintenance', api: 'Case', kind: 'standard', col: 3, row: 0, volume: '96K', fields: [['Unit__c', 'Lookup · Unit'], ['Priority', 'Picklist'], ['EntitlementId', 'Lookup · Entitlement'], ['Status', 'Picklist']], note: 'Maintenance requests are Cases, so queues, SLAs and entitlements come from Service Cloud.' },
      { id: 'payment', label: 'Rent Payment', api: 'Rent_Payment__c', kind: 'custom', col: 0, row: 1, volume: '1.4M', fields: [['Lease__c', 'Master-detail · Lease'], ['Due_Date__c', 'Date'], ['Amount__c', 'Currency'], ['Paid__c', 'Checkbox']], note: 'Over a million rows: indexed on Due_Date__c, archived after 7 years.' },
      { id: 'lease', label: 'Lease', api: 'Lease__c', kind: 'custom', col: 1, row: 1, volume: '24K', fields: [['Unit__c', 'Lookup · Unit'], ['Start_Date__c', 'Date'], ['Monthly_Rent__c', 'Currency'], ['Outstanding__c', 'Roll-up · SUM']], note: 'Outstanding balance rolls up from unpaid rent payments.' },
      { id: 'leaseTenant', label: 'Lease Tenant', api: 'Lease_Tenant__c', kind: 'junction', col: 2, row: 1, volume: '31K', fields: [['Lease__c', 'Master-detail · Lease'], ['Tenant__c', 'Master-detail · Account'], ['Rent_Share__c', 'Percent'], ['Primary__c', 'Checkbox']], note: 'The junction also carries data of its own: each co-tenant’s share of the rent.' },
      { id: 'tenant', label: 'Tenant', api: 'Account (Person)', kind: 'standard', col: 3, row: 1, volume: '27K', fields: [['PersonEmail', 'Email'], ['PersonMobilePhone', 'Phone'], ['Credit_Check__c', 'Picklist'], ['IsPersonAccount', 'Checkbox']], note: 'Tenants are Person Accounts: one record per human, usable in portals and communities.' },
    ],
    rels: [
      { id: 'property-owner', from: 'property', to: 'owner', type: 'lookup', card: 'n : 1', field: 'Property__c.Owner__c', why: 'Properties change owners; a lookup keeps them independent.' },
      { id: 'unit-property', from: 'unit', to: 'property', type: 'md', card: 'n : 1', field: 'Unit__c.Property__c', why: 'Units can’t exist without their property and power its occupancy roll-up.' },
      { id: 'case-unit', from: 'case', to: 'unit', type: 'lookup', card: 'n : 1', field: 'Case.Unit__c', why: 'Cases keep their own owner and queue routing.' },
      { id: 'lease-unit', from: 'lease', to: 'unit', type: 'lookup', card: 'n : 1', field: 'Lease__c.Unit__c', why: 'Lease history must survive when a unit is renovated or split.' },
      { id: 'payment-lease', from: 'payment', to: 'lease', type: 'md', card: 'n : 1', field: 'Rent_Payment__c.Lease__c', why: 'Payments belong to one lease and roll up into its outstanding balance.' },
      { id: 'lt-lease', from: 'leaseTenant', to: 'lease', type: 'md', card: 'n : 1', field: 'Lease_Tenant__c.Lease__c', why: 'First side of the many-to-many between leases and tenants.' },
      { id: 'lt-tenant', from: 'leaseTenant', to: 'tenant', type: 'md', card: 'n : 1', field: 'Lease_Tenant__c.Tenant__c', why: 'Second side of the many-to-many between leases and tenants.' },
    ],
    challenges: [
      {
        rels: ['unit-property'],
        q: 'Units can’t exist without their property, and every property needs a live count of leased units — without code.',
        answer: 'md',
        options: {
          md: 'Cascade delete, inherited sharing and a native roll-up summary for the count.',
          lookup: 'A lookup can’t power a native roll-up summary — you’d need Flow or code to count units.',
          junction: 'A unit belongs to exactly one property — there’s no many-to-many here.',
        },
      },
      {
        rels: ['lt-lease', 'lt-tenant'],
        q: 'A lease can have several co-tenants, and one tenant can sign several leases over the years.',
        answer: 'junction',
        options: {
          lookup: 'A lookup on Lease holds one tenant — co-tenants would need Tenant_2__c, Tenant_3__c…',
          md: 'Master-detail is still one parent per record — this is many-to-many.',
          junction: 'A Lease_Tenant__c junction with two master-details models many-to-many — and can store each tenant’s rent share.',
        },
      },
      {
        rels: ['lease-unit'],
        q: 'Units get renovated, merged or split. Old leases must keep their history, and deleting a unit must never delete leases.',
        answer: 'lookup',
        options: {
          md: 'Master-detail cascades deletes — removing a unit would wipe its lease history.',
          lookup: 'A lookup with “clear the value” on delete keeps leases independent of the unit’s lifecycle.',
          big: 'Leases are operational records users edit daily — not an archive.',
        },
      },
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance',
    start: 'policy',
    objects: [
      { id: 'broker', label: 'Broker', api: 'Account', kind: 'standard', col: 0, row: 0, volume: '450', fields: [['Name', 'Text'], ['FSMA_Number__c', 'Text · External ID'], ['Commission_Rate__c', 'Percent'], ['IsPartner', 'Checkbox']], note: 'Brokers log in through a partner portal and only see the policies they sold.' },
      { id: 'policy', label: 'Policy', api: 'Policy__c', kind: 'custom', col: 1, row: 0, volume: '820K', fields: [['Policyholder__c', 'Lookup · Account'], ['Policy_Number__c', 'Text · External ID'], ['Premium__c', 'Roll-up · SUM'], ['Status__c', 'Picklist · Active, Lapsed']], note: 'Policy_Number__c is an External ID, so the policy admin system upserts without Salesforce Ids.' },
      { id: 'coverage', label: 'Coverage', api: 'Coverage__c', kind: 'custom', col: 2, row: 0, volume: '2.6M', fields: [['Policy__c', 'Master-detail · Policy'], ['Type__c', 'Picklist · Fire, Theft, Liability'], ['Limit__c', 'Currency'], ['Premium__c', 'Currency']], note: 'Each coverage’s premium rolls up into the policy total.' },
      { id: 'asset', label: 'Insured Asset', api: 'Insured_Asset__c', kind: 'custom', col: 3, row: 0, volume: '910K', fields: [['Type__c', 'Picklist · Vehicle, Home'], ['Registration__c', 'Text · External ID'], ['Value__c', 'Currency'], ['Address__c', 'Address']], note: 'One asset can be covered by several coverages over time.' },
      { id: 'holder', label: 'Policyholder', api: 'Account (Person)', kind: 'standard', col: 0, row: 1, volume: '640K', fields: [['PersonBirthdate', 'Date'], ['Customer_Since__c', 'Date'], ['Risk_Segment__c', 'Picklist'], ['PersonEmail', 'Email']], note: 'Person Accounts give one 360° view per customer across all their policies.' },
      { id: 'party', label: 'Policy Party', api: 'Policy_Party__c', kind: 'junction', col: 1, row: 1, volume: '1.1M', fields: [['Policy__c', 'Master-detail · Policy'], ['Person__c', 'Master-detail · Account'], ['Role__c', 'Picklist · Driver, Beneficiary'], ['From__c', 'Date']], note: 'Named drivers and beneficiaries, each with a role on the policy.' },
      { id: 'claim', label: 'Claim', api: 'Claim__c', kind: 'custom', col: 2, row: 1, volume: '380K', fields: [['Coverage__c', 'Lookup · Coverage'], ['Incident_Date__c', 'Date'], ['Total_Paid__c', 'Roll-up · SUM'], ['Status__c', 'Picklist · Open, Paid']], note: 'Claims are owned by adjusters and shared through their own rules.' },
      { id: 'claimPayment', label: 'Claim Payment', api: 'Claim_Payment__c', kind: 'custom', col: 3, row: 1, volume: '520K', fields: [['Claim__c', 'Master-detail · Claim'], ['Amount__c', 'Currency'], ['Paid_On__c', 'Date'], ['IBAN__c', 'Text · Encrypted']], note: 'Bank details use Shield Platform Encryption.' },
    ],
    rels: [
      { id: 'policy-broker', from: 'policy', to: 'broker', type: 'lookup', card: 'n : 1', field: 'Policy__c.Broker__c', why: 'Brokers change; policies keep their own sharing.' },
      { id: 'policy-holder', from: 'policy', to: 'holder', type: 'lookup', card: 'n : 1', field: 'Policy__c.Policyholder__c', why: 'Customers hold many policies; a lookup avoids ownership skew.' },
      { id: 'coverage-policy', from: 'coverage', to: 'policy', type: 'md', card: 'n : 1', field: 'Coverage__c.Policy__c', why: 'Coverages only exist on a policy and roll up into its premium.' },
      { id: 'coverage-asset', from: 'coverage', to: 'asset', type: 'lookup', card: 'n : 1', field: 'Coverage__c.Insured_Asset__c', why: 'The same car or house is covered again at every renewal.' },
      { id: 'claim-coverage', from: 'claim', to: 'coverage', type: 'lookup', card: 'n : 1', field: 'Claim__c.Coverage__c', why: 'Claims need their own sharing and must survive cancellations.' },
      { id: 'payment-claim', from: 'claimPayment', to: 'claim', type: 'md', card: 'n : 1', field: 'Claim_Payment__c.Claim__c', why: 'Payments belong to one claim and roll up into the total paid.' },
      { id: 'party-policy', from: 'party', to: 'policy', type: 'md', card: 'n : 1', field: 'Policy_Party__c.Policy__c', why: 'First side of the many-to-many between policies and people.' },
      { id: 'party-holder', from: 'party', to: 'holder', type: 'md', card: 'n : 1', field: 'Policy_Party__c.Person__c', why: 'Second side of the many-to-many between policies and people.' },
    ],
    challenges: [
      {
        rels: ['coverage-policy'],
        q: 'Coverages only exist on a policy, and the policy’s total premium must always equal the sum of its coverages.',
        answer: 'md',
        options: {
          md: 'Master-detail gives you the cascade and a native SUM roll-up for the premium.',
          lookup: 'Without master-detail there’s no native roll-up — the total could drift out of sync.',
          big: 'Coverages are edited by underwriters every day — not archive data.',
        },
      },
      {
        rels: ['claim-coverage'],
        q: 'Claims are handled by adjusters who must not see the whole policy, and claims must survive a policy cancellation.',
        answer: 'lookup',
        options: {
          md: 'Master-detail claims inherit the policy’s sharing and are deleted with it.',
          lookup: 'A lookup lets claims have their own owner and sharing — adjusters see claims, not policies.',
          junction: 'A claim is filed against one coverage — no many-to-many needed.',
        },
      },
      {
        rels: ['party-policy', 'party-holder'],
        q: 'A person can be a named driver on several policies, and a policy can have several named drivers.',
        answer: 'junction',
        options: {
          lookup: 'Driver_1__c, Driver_2__c… breaks the day someone adds a fourth driver.',
          junction: 'A Policy_Party__c junction handles any number of people — with a role on each link.',
          md: 'Master-detail allows one parent per record — this relationship is many-to-many.',
        },
      },
    ],
  },
  {
    id: 'mobility',
    label: 'Mobility',
    start: 'vehicle',
    objects: [
      { id: 'customer', label: 'Fleet Customer', api: 'Account', kind: 'standard', col: 0, row: 0, volume: '2.4K', fields: [['Name', 'Text'], ['Fleet_Size__c', 'Roll-up · COUNT'], ['Industry', 'Picklist'], ['Key_Account__c', 'Checkbox']], note: 'Fleet size is counted live from the vehicles under contract.' },
      { id: 'contract', label: 'Contract', api: 'Contract', kind: 'standard', col: 1, row: 0, volume: '19K', fields: [['AccountId', 'Lookup · Account'], ['StartDate', 'Date'], ['ContractTerm', 'Number · months'], ['Monthly_Fee__c', 'Currency']], note: 'Standard Contract gives you activation, approval and renewal processes.' },
      { id: 'vehicle', label: 'Vehicle', api: 'Asset', kind: 'standard', col: 2, row: 0, volume: '64K', fields: [['Contract__c', 'Lookup · Contract'], ['VIN__c', 'Text · External ID'], ['Mileage__c', 'Number'], ['Next_Service__c', 'Date']], note: 'Vehicles are standard Assets, so Field Service work orders link to them natively.' },
      { id: 'telemetry', label: 'Telemetry', api: 'Telemetry__b', kind: 'big', col: 3, row: 0, volume: '50M / yr', fields: [['VIN__c', 'Text · index'], ['Reading_Time__c', 'Date/Time · index'], ['Mileage__c', 'Number'], ['Fuel_Level__c', 'Percent']], note: 'A Big Object indexed on VIN + time. Only daily aggregates land on the Asset.' },
      { id: 'driver', label: 'Driver', api: 'Contact', kind: 'standard', col: 0, row: 1, volume: '41K', fields: [['AccountId', 'Lookup · Account'], ['License_Number__c', 'Text · Encrypted'], ['License_Expiry__c', 'Date'], ['Points__c', 'Number']], note: 'Drivers are Contacts of the fleet customer — ready for a driver self-service portal.' },
      { id: 'assignment', label: 'Vehicle Assignment', api: 'Vehicle_Assignment__c', kind: 'junction', col: 1, row: 1, volume: '220K', fields: [['Driver__c', 'Master-detail · Contact'], ['Vehicle__c', 'Master-detail · Asset'], ['From__c', 'Date/Time'], ['To__c', 'Date/Time']], note: 'Who drove which car, when — the source for fines and damage claims.' },
      { id: 'workOrder', label: 'Work Order', api: 'WorkOrder', kind: 'standard', col: 2, row: 1, volume: '310K', fields: [['AssetId', 'Lookup · Asset'], ['WorkTypeId', 'Lookup · Work Type'], ['Status', 'Picklist'], ['Odometer__c', 'Number']], note: 'Work orders drive the Field Service scheduling engine.' },
      { id: 'appointment', label: 'Service Appointment', api: 'ServiceAppointment', kind: 'standard', col: 3, row: 1, volume: '330K', fields: [['ParentRecordId', 'Lookup · Work Order'], ['SchedStartTime', 'Date/Time'], ['ServiceTerritoryId', 'Lookup · Territory'], ['Status', 'Picklist']], note: 'Scheduled and optimised by Field Service, visible to technicians on mobile.' },
    ],
    rels: [
      { id: 'contract-customer', from: 'contract', to: 'customer', type: 'lookup', card: 'n : 1', field: 'Contract.AccountId', why: 'Standard relationship between a contract and its customer.' },
      { id: 'asset-contract', from: 'vehicle', to: 'contract', type: 'lookup', card: 'n : 1', field: 'Asset.Contract__c', why: 'Vehicles move to a new contract every few years.' },
      { id: 'telemetry-asset', from: 'telemetry', to: 'vehicle', type: 'big', card: 'n : 1', field: 'Telemetry__b.VIN__c', why: 'Linked by VIN — a Big Object can’t hold real lookups, and doesn’t need them.' },
      { id: 'driver-customer', from: 'driver', to: 'customer', type: 'lookup', card: 'n : 1', field: 'Contact.AccountId', why: 'Drivers belong to the fleet customer.' },
      { id: 'va-driver', from: 'assignment', to: 'driver', type: 'md', card: 'n : 1', field: 'Vehicle_Assignment__c.Driver__c', why: 'First side of the many-to-many between drivers and vehicles.' },
      { id: 'va-vehicle', from: 'assignment', to: 'vehicle', type: 'md', card: 'n : 1', field: 'Vehicle_Assignment__c.Vehicle__c', why: 'Second side of the many-to-many between drivers and vehicles.' },
      { id: 'wo-vehicle', from: 'workOrder', to: 'vehicle', type: 'lookup', card: 'n : 1', field: 'WorkOrder.AssetId', why: 'Standard Field Service link from work to the asset.' },
      { id: 'sa-wo', from: 'appointment', to: 'workOrder', type: 'lookup', card: 'n : 1', field: 'ServiceAppointment.ParentRecordId', why: 'Standard Field Service parent relationship.' },
    ],
    challenges: [
      {
        rels: ['va-driver', 'va-vehicle'],
        q: 'Pool cars change drivers every week, and you need the full history of who drove which vehicle, and when.',
        answer: 'junction',
        options: {
          lookup: 'A Driver lookup on the vehicle only shows today’s driver — the history is lost.',
          md: 'Master-detail is one parent per record — drivers and vehicles are many-to-many.',
          junction: 'Vehicle_Assignment__c with from/to dates gives a complete, reportable history.',
        },
      },
      {
        rels: ['telemetry-asset'],
        q: 'Every vehicle sends a mileage and fuel reading every minute — about 50 million records a year.',
        answer: 'big',
        options: {
          md: 'Millions of children under one Asset cause lock contention and data skew — and huge storage costs.',
          lookup: 'Avoids locking, but 50M standard records a year still blow up storage and slow every report.',
          big: 'A Big Object (or external data lake) scales to billions of rows; Salesforce keeps the aggregates.',
        },
      },
      {
        rels: ['asset-contract'],
        q: 'A vehicle moves to a new lease contract every three years, and expired contracts must stay intact for audits.',
        answer: 'lookup',
        options: {
          md: 'Master-detail ties the vehicle’s sharing to one contract, and deleting the contract deletes the vehicle.',
          lookup: 'A lookup lets the vehicle move from contract to contract, with history kept on each contract.',
          junction: 'Only needed if a vehicle can be on several contracts at the same time — here it’s one at a time.',
        },
      },
    ],
  },
]

export default function DataModelDemo() {
  const game = useGame()
  const { has, mark } = game
  const [modelId, setModelId] = useState(MODELS[0].id)
  const model = MODELS.find((m) => m.id === modelId)
  // Questions come first; an industry you already aced opens straight in explore mode.
  const [step, setStep] = useState(() => (has(`dm:ace:${MODELS[0].id}`) ? 3 : 0))
  const [missed, setMissed] = useState([]) // question indexes answered wrong at least once
  const [pick, setPick] = useState(null)
  const [selected, setSelected] = useState({ kind: 'obj', id: model.start })
  const compact = useMedia('(max-width: 760px)')

  const obj = (id) => model.objects.find((o) => o.id === id)
  const total = model.challenges.length
  const exploring = step >= total
  const challenge = exploring ? null : model.challenges[step]
  const solvedCurrent = challenge && pick === challenge.answer

  useEffect(() => {
    mark(`dm:seen:${modelId}`)
    if (MODELS.every((m) => has(`dm:seen:${m.id}`))) mark('dm-explore')
  }, [modelId, has, mark])

  function changeModel(id) {
    const next = MODELS.find((m) => m.id === id)
    setModelId(id)
    setStep(has(`dm:ace:${id}`) ? next.challenges.length : 0)
    setMissed([])
    setPick(null)
    setSelected({ kind: 'obj', id: next.start })
  }

  function retry() {
    setStep(0)
    setMissed([])
    setPick(null)
  }

  function answer(key) {
    if (solvedCurrent) return
    setPick(key)
    if (key !== challenge.answer) {
      if (!missed.includes(step)) setMissed([...missed, step])
      return
    }
    if (step === total - 1 && missed.length === 0) {
      mark(`dm:ace:${model.id}`)
      mark('dm-ace')
      if (MODELS.every((m) => has(`dm:ace:${m.id}`))) mark('dm-all')
    }
  }

  function next() {
    setPick(null)
    setStep(step + 1)
  }

  // Relationships still hidden behind a "?" while their question is open.
  const hidden = new Set(model.challenges.slice(solvedCurrent ? step + 1 : step).flatMap((c) => c.rels))
  const focusRels = challenge
    ? new Set(challenge.rels)
    : selected.kind === 'rel'
      ? new Set([selected.id])
      : new Set(model.rels.filter((r) => r.from === selected.id || r.to === selected.id).map((r) => r.id))
  const focusObjs = new Set(
    model.rels
      .filter((r) => focusRels.has(r.id))
      .flatMap((r) => [r.from, r.to])
      .concat(!challenge && selected.kind === 'obj' ? [selected.id] : []),
  )
  const relName = (id) => {
    const r = model.rels.find((x) => x.id === id)
    return `${obj(r.from).label} → ${obj(r.to).label}`
  }
  const selObj = !challenge && selected.kind === 'obj' ? obj(selected.id) : null
  const selRel = !challenge && selected.kind === 'rel' ? model.rels.find((r) => r.id === selected.id) : null
  const aced = has(`dm:ace:${model.id}`)
  const score = total - missed.length

  return (
    <>
      <div className="seg dm-industries" role="group" aria-label="Industry">
        {MODELS.map((m) => (
          <button type="button" key={m.id} className="good" aria-pressed={m.id === modelId} onClick={() => changeModel(m.id)}>
            {m.label}{has(`dm:ace:${m.id}`) && ' ✓'}
          </button>
        ))}
      </div>

      <div className="dm-layout">
        <div className="demo-panel dm-canvas">
          {compact ? (
            // Phones: no wide diagram — show only the relationships in focus as object pairs.
            <div className="dm-pairs">
              {!challenge && (
                <div className="dm-objects" role="group" aria-label="Objects">
                  {model.objects.map((o) => (
                    <button
                      type="button"
                      key={o.id}
                      className={`dm-object ${o.kind}`}
                      aria-pressed={selObj?.id === o.id}
                      onClick={() => setSelected({ kind: 'obj', id: o.id })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {[...focusRels].map((id) => {
                const r = model.rels.find((x) => x.id === id)
                const isHidden = hidden.has(id)
                return (
                  <div className="dm-pair" key={id}>
                    {[r.from, null, r.to].map((oid, i) =>
                      oid === null ? (
                        <span key="rel" className={`rel-chip on ${isHidden ? 'unknown' : r.type}`}>
                          {isHidden ? '?' : r.type === 'md' ? 'M-D' : r.type === 'big' ? 'VIN' : 'Lookup'}
                        </span>
                      ) : (
                        <span key={oid + i} className={`entity on ${obj(oid).kind}`}>
                          <small>{KIND_LABEL[obj(oid).kind]}</small>
                          <strong>{obj(oid).label}</strong>
                          <code>{obj(oid).api}</code>
                        </span>
                      ),
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <div className="erd-scroll">
                <div className="erd" style={{ height: CANVAS_H }} key={model.id}>
                  <svg className="erd-lines" aria-hidden="true">
                    {model.rels.map((r, i) => {
                      const a = obj(r.from)
                      const b = obj(r.to)
                      const isHidden = hidden.has(r.id)
                      const on = focusRels.has(r.id)
                      const coords = { x1: `${cx(a.col)}%`, y1: cy(a.row), x2: `${cx(b.col)}%`, y2: cy(b.row) }
                      return (
                        <g key={r.id} className={`rel-line ${isHidden ? 'unknown' : r.type}${on ? ' on' : ''}`} style={{ '--i': i }}>
                          <line {...coords} />
                          {on && !isHidden && <line {...coords} className="flow" />}
                        </g>
                      )
                    })}
                  </svg>
    
                  {model.rels.map((r) => {
                    const a = obj(r.from)
                    const b = obj(r.to)
                    const isHidden = hidden.has(r.id)
                    return (
                      <button
                        type="button"
                        key={r.id}
                        className={`rel-chip ${isHidden ? 'unknown' : r.type}${focusRels.has(r.id) ? ' on' : ''}`}
                        style={{ left: `${(cx(a.col) + cx(b.col)) / 2}%`, top: (cy(a.row) + cy(b.row)) / 2 }}
                        onClick={() => exploring && setSelected({ kind: 'rel', id: r.id })}
                        title={isHidden ? 'Answer the question to reveal' : `${TYPE_LABEL[r.type]} · ${r.field}`}
                      >
                        {isHidden ? '?' : r.type === 'md' ? 'M-D' : r.type === 'big' ? 'VIN' : 'Lookup'}
                      </button>
                    )
                  })}
    
                  {model.objects.map((o, i) => (
                    <button
                      type="button"
                      key={o.id}
                      className={`entity ${o.kind}${focusObjs.has(o.id) ? ' on' : ''}${selObj?.id === o.id ? ' selected' : ''}`}
                      style={{ left: `${o.col * 25 + 2.5}%`, top: ROW_TOP[o.row], height: BOX_H, '--i': i }}
                      onClick={() => exploring && setSelected({ kind: 'obj', id: o.id })}
                    >
                      <span className="entity-head">
                        <small>{KIND_LABEL[o.kind]}</small>
                        <span className={`vol${/M/.test(o.volume) ? ' ldv' : ''}`}>{o.volume}</span>
                      </span>
                      <strong>{o.label}</strong>
                      <code>{o.api}</code>
                    </button>
                  ))}
                </div>
              </div>
              <div className="erd-legend" aria-hidden="true">
                <span><i className="lg md" /> Master-detail</span>
                <span><i className="lg lookup" /> Lookup</span>
                <span><i className="lg big" /> Big Object</span>
                <span><span className="vol ldv">1M+</span> large volume</span>
              </div>
            </>
          )}
        </div>

        <aside className="demo-panel dm-side" aria-live="polite">
          <Quest
            steps={model.challenges.map((_, i) => `Q${i + 1}`)}
            current={step}
            hint={exploring ? 'Click any object or line to explore the design.' : null}
          />

          {challenge && (
            <div className="dm-question" key={`${model.id}-${step}`}>
              <p className="dm-rel">{challenge.rels.map(relName).join(' & ')}</p>
              <h4>{challenge.q}</h4>
              <div className="options">
                {Object.keys(challenge.options).map((key, i) => (
                  <button
                    type="button"
                    key={key}
                    className={`option${pick === key ? (key === challenge.answer ? ' right' : ' wrong') : ''}`}
                    onClick={() => answer(key)}
                  >
                    <span className="option-key">{String.fromCharCode(65 + i)}</span>
                    {OPTION[key]}
                  </button>
                ))}
              </div>
              {pick && (
                <p className={pick === challenge.answer ? 'stage-ok' : 'stage-why'}>
                  {pick === challenge.answer ? '✓ ' : '✗ '}{challenge.options[pick]}
                </p>
              )}
              {solvedCurrent && (
                <button type="button" className="btn btn-primary run" onClick={next}>
                  {step + 1 < total ? 'Next question →' : 'See the full model →'}
                </button>
              )}
            </div>
          )}

          {exploring && (
            <div className="dm-explore" key={`${selected.kind}-${selected.id}`}>
              <p className={`dm-score ${aced ? 'ok' : ''}`}>
                {aced
                  ? `🏛️ ${model.label}: aced.`
                  : `${score}/${total} on the first try.`}{' '}
                <button type="button" onClick={retry}>{aced ? 'Play again' : 'Retry for the badge'}</button>
              </p>

              {selObj && (
                <>
                  <h4>
                    {selObj.label} <span className={`kind-tag ${selObj.kind}`}>{KIND_LABEL[selObj.kind]}</span>
                  </h4>
                  <code className="dm-api">{selObj.api} · {selObj.volume} records</code>
                  <table className="fields">
                    <tbody>
                      {selObj.fields.map(([name, type]) => (
                        <tr key={name}><td>{name}</td><td>{type}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="dm-note">{selObj.note}</p>
                </>
              )}

              {selRel && (
                <>
                  <h4>
                    {obj(selRel.from).label} → {obj(selRel.to).label}
                    <span className={`rel-tag ${selRel.type}`}>{TYPE_LABEL[selRel.type]}</span>
                  </h4>
                  <code className="dm-api">{selRel.field} · {selRel.card}</code>
                  <ul className="facts">
                    {TYPE_FACTS[selRel.type].map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <p className="dm-note">{selRel.why}</p>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

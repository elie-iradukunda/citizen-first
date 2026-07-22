import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DASHBOARD_CONTENT = {
  citizen: {
    eyebrow: 'Citizen Dashboard',
    title: 'Report poor service or corruption after scanning an institution QR code',
    description:
      'The citizen scans the QR code, views institution services and staff, submits a complaint with evidence, and tracks the case response.',
    stats: [
      ['Visible services', '8'],
      ['Response window', '3 days'],
      ['Evidence types', '3'],
    ],
    flow: ['Scan QR code', 'Choose service/staff', 'Submit complaint', 'Track case'],
    sections: [
      {
        id: 'scan-services',
        title: 'Scan QR & Services',
        items: [
          'Open the institution page from a QR code posted at the office.',
          'View services offered by the cell, sector, or district office.',
          'Check responsible staff and service availability during the week.',
        ],
      },
      {
        id: 'submit-report',
        title: 'Submit Report',
        items: [
          'Select the service or staff member related to the problem.',
          'Choose poor service or corruption/bribery report.',
          'Provide address and contact details so RIB can identify the reporter.',
        ],
      },
      {
        id: 'my-reports',
        title: 'My Reports',
        items: [
          'See submitted reports and their current status.',
          'Attach documents, photos, or voice evidence where available.',
          'Read responses from RIB officers.',
        ],
      },
      {
        id: 'track-case',
        title: 'Track Case',
        items: [
          'Use the case ID to follow progress.',
          'Know whether the report is pending, in review, responded to, or escalated.',
          'Escalation happens when the response window is missed.',
        ],
      },
    ],
    sampleRows: [
      ['CF-2026-0101', 'Bribery request', 'Submitted to RIB'],
      ['CF-2026-0102', 'Poor service', 'Waiting for response'],
      ['CF-2026-0103', 'Missing answer', 'Escalated'],
    ],
  },
  institution_admin: {
    eyebrow: 'Institution Admin Dashboard',
    title: 'Manage institution services, staff, departments, and QR access',
    description:
      'The institution admin represents an office such as a cell, sector, or district. After approval, the admin configures services and staff so citizens can see clear service information through QR access.',
    stats: [
      ['Registered services', '6'],
      ['Staff members', '12'],
      ['QR status', 'Active'],
    ],
    flow: ['Register services', 'Create departments', 'Register staff', 'Generate QR code'],
    sections: [
      {
        id: 'services',
        title: 'Register Services',
        items: [
          'Add services provided by the institution.',
          'Define service days, time, and required documents.',
          'Make services visible to citizens after QR scan.',
        ],
      },
      {
        id: 'departments',
        title: 'Departments',
        items: [
          'Create departments such as civil status, land, social affairs, or customer care.',
          'Organize staff under the correct department.',
          'Keep office responsibilities clear.',
        ],
      },
      {
        id: 'staff',
        title: 'Register Staff',
        items: [
          'Add workers who provide services at the institution.',
          'Record name, position, phone, and department.',
          'Approve staff accounts for internal service management.',
        ],
      },
      {
        id: 'linking',
        title: 'Link Staff to Services',
        items: [
          'Assign each staff member to the services they provide.',
          'Allow citizens to identify the staff or service involved in a complaint.',
          'Improve accountability by connecting complaints to service responsibility.',
        ],
      },
      {
        id: 'qr-code',
        title: 'Generate QR Code',
        items: [
          'Generate one QR code for the institution office.',
          'Citizens scan the QR code to view services or submit reports.',
          'The QR code connects the public office to RIB follow-up.',
        ],
      },
    ],
    sampleRows: [
      ['Civil status certificate', 'Civil Status', 'Monday-Friday'],
      ['Land document support', 'Land Office', 'Tuesday-Thursday'],
      ['Complaint reception', 'Customer Care', 'Every working day'],
    ],
  },
  rib_officer_1: {
    eyebrow: 'RIB Officer 1 Dashboard',
    title: 'Receive new citizen reports and provide the first RIB response',
    description:
      'RIB Officer 1 receives reports from institution QR codes, reviews evidence, contacts the citizen when needed, and responds within the three-day window.',
    stats: [
      ['New reports', '9'],
      ['Due today', '3'],
      ['Escalations', '2'],
    ],
    flow: ['Receive report', 'Review evidence', 'Respond in 3 days', 'Escalate if needed'],
    sections: [
      {
        id: 'new-reports',
        title: 'New Reports',
        items: [
          'Read reports submitted by citizens after QR scan.',
          'Identify the institution, service, and staff member involved.',
          'Separate poor service complaints from corruption/bribery reports.',
        ],
      },
      {
        id: 'review-evidence',
        title: 'Review Evidence',
        items: [
          'Open documents attached by the citizen.',
          'Review photos or screenshots where available.',
          'Listen to voice evidence submitted by the citizen.',
        ],
      },
      {
        id: 'response-window',
        title: '3-Day Response',
        items: [
          'Every report has a three-day response period.',
          'Cases approaching the deadline are marked for urgent action.',
          'Unanswered cases are prepared for escalation.',
        ],
      },
      {
        id: 'respond',
        title: 'Respond to Citizen',
        items: [
          'Write a first RIB response or request more information.',
          'Update the case status for citizen tracking.',
          'Record follow-up action taken by RIB.',
        ],
      },
      {
        id: 'escalate',
        title: 'Escalate to Officer 2',
        items: [
          'Forward serious, sensitive, or unanswered cases.',
          'Send overdue reports to Officer 2 for stronger follow-up.',
          'Keep escalation history visible in the case record.',
        ],
      },
    ],
    sampleRows: [
      ['CF-2026-0201', 'Bribery request', 'Evidence review'],
      ['CF-2026-0202', 'Poor service', 'Response due today'],
      ['CF-2026-0203', 'Intimidation', 'Escalate'],
    ],
  },
  rib_officer_2: {
    eyebrow: 'RIB Officer 2 Dashboard',
    title: 'Handle escalated and overdue cases for final follow-up',
    description:
      'RIB Officer 2 receives cases not resolved by Officer 1, reviews overdue reports, updates final status, and ensures the citizen receives clear follow-up.',
    stats: [
      ['Escalated reports', '5'],
      ['Overdue cases', '4'],
      ['Final updates', '7'],
    ],
    flow: ['Receive escalation', 'Review overdue case', 'Final follow-up', 'Update status'],
    sections: [
      {
        id: 'escalated-reports',
        title: 'Escalated Reports',
        items: [
          'Receive cases forwarded by RIB Officer 1.',
          'Focus on sensitive corruption and unanswered reports.',
          'Check the full complaint and response history.',
        ],
      },
      {
        id: 'overdue-cases',
        title: 'Overdue Cases',
        items: [
          'Identify cases older than the three-day response period.',
          'Prioritize reports with bribery, intimidation, or strong evidence.',
          'Ensure no citizen report remains silent.',
        ],
      },
      {
        id: 'final-review',
        title: 'Final Review',
        items: [
          'Validate whether Officer 1 responded correctly.',
          'Request additional action where the first response is incomplete.',
          'Prepare a final follow-up note.',
        ],
      },
      {
        id: 'status-update',
        title: 'Case Status Update',
        items: [
          'Mark cases as in review, responded, escalated, or closed.',
          'Keep the citizen tracking page updated.',
          'Maintain a clear record for accountability.',
        ],
      },
      {
        id: 'follow-up',
        title: 'Follow-up Summary',
        items: [
          'Summarize actions taken by RIB.',
          'Show how many escalated reports were handled.',
          'Support presentation of the follow-up workflow.',
        ],
      },
    ],
    sampleRows: [
      ['CF-2026-0301', 'No response after 3 days', 'Final review'],
      ['CF-2026-0302', 'Bribery with evidence', 'Follow-up started'],
      ['CF-2026-0303', 'Officer 1 delayed', 'Status updated'],
    ],
  },
};

function getRoleContent(role) {
  if (DASHBOARD_CONTENT[role]) {
    return DASHBOARD_CONTENT[role];
  }

  // National oversight reviews escalated work; every other review role
  // (RIB workflow-chain leaders, governance leaders) follows the intake view.
  if (role === 'national_admin' || role === 'oversight_admin') {
    return DASHBOARD_CONTENT.rib_officer_2;
  }

  return DASHBOARD_CONTENT.rib_officer_1 ?? DASHBOARD_CONTENT.citizen;
}

function FeatureSection({ section }) {
  return (
    <article id={section.id} className="rounded-[1.2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="font-display text-2xl font-black text-ink">{section.title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate">
        {section.items.map((item) => (
          <li key={item} className="rounded-xl bg-mist px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function PresentationDashboardPage() {
  const { user } = useAuth();
  const content = getRoleContent(user?.role);

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="rounded-[1.4rem] bg-ink p-7 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">{content.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-black leading-tight">
            {content.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78">{content.description}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {content.stats.map(([label, value]) => (
            <article key={label} className="rounded-[1.1rem] border border-ink/10 bg-white p-5 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{label}</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-tide">Simple Workflow</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {content.flow.map((step, index) => (
              <div key={step} className="rounded-xl bg-mist p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-clay">Step {index + 1}</p>
                <p className="mt-2 font-semibold text-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {content.sections.map((section) => (
            <FeatureSection key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-tide">Presentation Data</p>
              <h2 className="mt-2 font-display text-2xl font-black text-ink">Sample records for this role</h2>
            </div>
            <Link to="/report" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">
              Open Report Page
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.16em] text-slate">
                  <th className="pb-3">Record</th>
                  <th className="pb-3">Activity</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {content.sampleRows.map(([record, activity, status]) => (
                  <tr key={record} className="border-b border-ink/10">
                    <td className="py-4 font-semibold text-ink">{record}</td>
                    <td className="py-4 text-slate">{activity}</td>
                    <td className="py-4 text-slate">{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PresentationDashboardPage;

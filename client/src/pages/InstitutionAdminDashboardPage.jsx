import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  ArrowPathIcon,
  LinkIcon,
  PencilSquareIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import DetailsModal, { DetailRow } from '../components/dashboard/DetailsModal';
import { useAuth } from '../context/AuthContext';
import {
  createInstitutionDepartment,
  createInstitutionService,
  createInstitutionStaffMember,
  createStaffServiceLink,
  createTestingUser,
  deleteInstitutionDepartment,
  deleteInstitutionService,
  deleteInstitutionStaffMember,
  deleteStaffServiceLink,
  fetchInstitutionManagement,
  updateInstitutionDepartment,
  updateInstitutionManagement,
  updateInstitutionService,
  updateInstitutionStaffMember,
} from '../lib/registrationApi';

const emptyServiceForm = {
  name: '',
  description: '',
  feeType: 'free',
  officialFeeRwf: '0',
  accessNote: '',
  schedule: '',
  documents: '',
};

const emptyDepartmentForm = {
  name: '',
  description: '',
};

const emptyStaffForm = {
  fullName: '',
  nationalId: '',
  phone: '',
  email: '',
  positionTitle: '',
  positionKinyarwanda: '',
  reportsTo: '',
  description: '',
  createPlatformAccount: false,
  password: '',
};

const emptyTestingUserForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: 'rib_officer_1',
};

const testingUserRoleOptions = [
  { value: 'rib_officer_1', label: 'RIB Officer 1 - intake' },
  { value: 'rib_officer_2', label: 'RIB Officer 2 - escalation' },
  { value: 'institution_admin', label: 'Institution Leader / Admin' },
];

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province, location.country]
    .filter(Boolean)
    .join(', ');
}

function formatFee(service) {
  if (service.feeType === 'paid') {
    return `${Number(service.officialFeeRwf ?? 0).toLocaleString()} RWF (official receipt required)`;
  }

  return 'Free service - no payment allowed';
}

function serviceToForm(service) {
  return {
    name: service.name ?? '',
    description: service.description ?? '',
    feeType: service.feeType === 'paid' ? 'paid' : 'free',
    officialFeeRwf: String(service.officialFeeRwf ?? 0),
    accessNote: service.accessNote ?? '',
    schedule: service.schedule ?? '',
    documents: service.documents ?? '',
  };
}

function serviceFormToPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    feeType: form.feeType,
    officialFeeRwf: form.feeType === 'paid' ? Number(form.officialFeeRwf) || 0 : 0,
    accessNote: form.accessNote.trim(),
    schedule: form.schedule.trim(),
    documents: form.documents.trim(),
  };
}

function staffToForm(employee) {
  return {
    fullName: employee.fullName ?? '',
    nationalId: employee.nationalId ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    positionTitle: employee.positionTitle ?? '',
    positionKinyarwanda: employee.positionKinyarwanda ?? '',
    reportsTo: employee.reportsTo ?? '',
    description: employee.description ?? '',
    status: employee.status ?? 'Active',
  };
}

function Panel({ id, title, subtitle, children, actions, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-28 rounded-[1rem] border border-ink/10 bg-white p-6 shadow-soft ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-ink">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-7 text-slate">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function TextInput({ label, name, value, onChange, placeholder = '', type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-lg border border-ink/10 bg-mist px-3 text-sm outline-none focus:border-tide"
        {...props}
      />
    </label>
  );
}

function SelectInput({ label, name, value, onChange, children, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 h-11 w-full rounded-lg border border-ink/10 bg-mist px-3 text-sm outline-none focus:border-tide"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function ActionButton({ children, type = 'button', onClick, disabled = false, tone = 'gold' }) {
  const tones = {
    gold: 'bg-gold text-white',
    ink: 'bg-ink text-white',
    danger: 'bg-red-600 text-white',
    ghost: 'border border-ink/15 bg-white text-ink',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black shadow-soft transition disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function CardActions({ onView, onEdit, onDelete }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
      <button
        type="button"
        onClick={onView}
        className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
      >
        View Details
      </button>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink"
        >
          <PencilSquareIcon className="h-3.5 w-3.5" />
          Edit
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </button>
      ) : null}
    </div>
  );
}

function FeedbackBanner({ error, success }) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
        error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      {error || success}
    </div>
  );
}

function InstitutionAdminDashboardPage() {
  const location = useLocation();
  const { user } = useAuth();
  const institutionId = user?.institutionId ?? '';

  const [institution, setInstitution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // modal = { type, data } - the single active pop-up form/details window
  const [modal, setModal] = useState(null);
  const [modalForm, setModalForm] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [linkForm, setLinkForm] = useState({ employeeId: '', serviceName: '' });
  const [panelFeedback, setPanelFeedback] = useState({});

  const [createdStaffAccounts, setCreatedStaffAccounts] = useState([]);

  const [testingUserForm, setTestingUserForm] = useState(emptyTestingUserForm);
  const [createdTestingUsers, setCreatedTestingUsers] = useState([]);
  const [testingUserError, setTestingUserError] = useState('');
  const [testingUserSuccess, setTestingUserSuccess] = useState('');
  const [isCreatingTestingUser, setIsCreatingTestingUser] = useState(false);

  const [qrGeneratedAt, setQrGeneratedAt] = useState(() => new Date().toISOString());
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrError, setQrError] = useState('');

  const setFeedback = (panel, error, success) => {
    setPanelFeedback((current) => ({
      ...current,
      [panel]: { error: error ?? '', success: success ?? '' },
    }));
  };

  const loadInstitution = useCallback(() => {
    if (!institutionId) {
      setIsLoading(false);
      setLoadError('No institution is linked to this account.');
      return;
    }

    setIsLoading(true);
    setLoadError('');
    fetchInstitutionManagement(institutionId)
      .then((payload) => {
        setInstitution(payload.item);
      })
      .catch((error) => {
        setLoadError(error.message || 'Institution data could not be loaded.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [institutionId]);

  useEffect(() => {
    loadInstitution();
  }, [loadInstitution]);

  const qrScanUrl = useMemo(() => {
    if (!institution?.slug) {
      return '';
    }

    const origin = typeof window === 'undefined' ? 'https://saccfp.local' : window.location.origin;
    return `${origin}/institutions/${institution.slug}`;
  }, [institution?.slug]);

  useEffect(() => {
    if (!qrScanUrl) {
      setQrCodeDataUrl('');
      return undefined;
    }

    let isActive = true;
    setQrError('');

    QRCode.toDataURL(qrScanUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#022c22',
        light: '#ecfdf5',
      },
    })
      .then((dataUrl) => {
        if (isActive) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (isActive) {
          setQrCodeDataUrl('');
          setQrError('QR code could not be generated. Refresh and try again.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [qrScanUrl, qrGeneratedAt]);

  useEffect(() => {
    if (!location.hash) {
      return undefined;
    }

    const targetId = decodeURIComponent(location.hash.slice(1));
    const timeoutId = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const services = institution?.services ?? [];
  const departments = institution?.departments ?? [];
  const employees = institution?.employees ?? [];
  const staffServiceLinks = institution?.staffServiceLinks ?? [];

  const openModal = (type, data = null, form = null) => {
    setModal({ type, data });
    setModalForm(form);
    setModalError('');
  };

  const closeModal = () => {
    setModal(null);
    setModalForm(null);
    setModalError('');
    setIsSaving(false);
  };

  const updateModalForm = (event) => {
    const { name, value, type, checked } = event.target;
    setModalForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const runModalAction = async (action, successPanel, successMessage) => {
    setIsSaving(true);
    setModalError('');

    try {
      const payload = await action();
      if (payload?.item) {
        setInstitution(payload.item);
      }
      setFeedback(successPanel, '', successMessage);
      closeModal();
    } catch (error) {
      setModalError(error.message || 'The action failed. Try again.');
      setIsSaving(false);
    }
  };

  // --- create handlers (inline forms) ---

  const addService = async (event) => {
    event.preventDefault();
    setFeedback('services');

    try {
      const payload = await createInstitutionService(institutionId, serviceFormToPayload(serviceForm));
      setInstitution(payload.item);
      setServiceForm(emptyServiceForm);
      setFeedback('services', '', `Service "${payload.createdService.name}" was registered.`);
    } catch (error) {
      setFeedback('services', error.message);
    }
  };

  const addDepartment = async (event) => {
    event.preventDefault();
    setFeedback('departments');

    try {
      const payload = await createInstitutionDepartment(institutionId, {
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim(),
      });
      setInstitution(payload.item);
      setDepartmentForm(emptyDepartmentForm);
      setFeedback('departments', '', `Department "${payload.createdDepartment.name}" was created.`);
    } catch (error) {
      setFeedback('departments', error.message);
    }
  };

  const addStaff = async (event) => {
    event.preventDefault();
    setFeedback('staff');

    try {
      const payload = await createInstitutionStaffMember(institutionId, {
        fullName: staffForm.fullName.trim(),
        nationalId: staffForm.nationalId.trim(),
        phone: staffForm.phone.trim(),
        email: staffForm.email.trim(),
        positionTitle: staffForm.positionTitle.trim(),
        positionKinyarwanda: staffForm.positionKinyarwanda.trim(),
        reportsTo: staffForm.reportsTo.trim(),
        description: staffForm.description.trim(),
        status: 'Active',
        createPlatformAccount: staffForm.createPlatformAccount,
        password: staffForm.createPlatformAccount ? staffForm.password : '',
      });
      setInstitution(payload.item);
      setStaffForm(emptyStaffForm);
      if (payload.createdAccount) {
        setCreatedStaffAccounts((current) => [payload.createdAccount, ...current]);
      }
      setFeedback('staff', '', `${payload.createdEmployee.fullName} was registered as staff.`);
    } catch (error) {
      setFeedback('staff', error.message);
    }
  };

  const addStaffServiceLink = async (event) => {
    event.preventDefault();
    setFeedback('linking');

    const employeeId = linkForm.employeeId || employees[0]?.employeeId;
    const serviceName = linkForm.serviceName || services[0]?.name;
    if (!employeeId || !serviceName) {
      setFeedback('linking', 'Register at least one staff member and one service before linking.');
      return;
    }

    try {
      const payload = await createStaffServiceLink(institutionId, { employeeId, serviceName });
      setInstitution(payload.item);
      setFeedback(
        'linking',
        '',
        `${payload.createdLink.employeeName} is now responsible for "${payload.createdLink.serviceName}".`,
      );
    } catch (error) {
      setFeedback('linking', error.message);
    }
  };

  const removeStaffServiceLink = async (linkId) => {
    setFeedback('linking');

    try {
      const payload = await deleteStaffServiceLink(institutionId, linkId);
      setInstitution(payload.item);
      setFeedback('linking', '', 'Staff-service link removed successfully.');
    } catch (error) {
      setFeedback('linking', error.message);
    }
  };

  const addTestingUser = async (event) => {
    event.preventDefault();
    setTestingUserError('');
    setTestingUserSuccess('');
    setIsCreatingTestingUser(true);

    try {
      const response = await createTestingUser({
        fullName: testingUserForm.fullName.trim(),
        email: testingUserForm.email.trim().toLowerCase(),
        password: testingUserForm.password,
        phone: testingUserForm.phone.trim(),
        role: testingUserForm.role,
      });

      setCreatedTestingUsers((current) => [response.item, ...current]);
      setTestingUserSuccess(`${response.item.fullName} can now login as ${response.item.role}.`);
      setTestingUserForm(emptyTestingUserForm);
    } catch (error) {
      setTestingUserError(error.message);
    } finally {
      setIsCreatingTestingUser(false);
    }
  };

  const regenerateQr = () => {
    setQrGeneratedAt(new Date().toISOString());
  };

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-9 lg:px-8">
          <div className="rounded-[1rem] border border-ink/10 bg-white p-8 text-sm font-semibold text-ink shadow-soft">
            Loading institution administration data...
          </div>
        </section>
      </div>
    );
  }

  if (loadError || !institution) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-9 lg:px-8">
          <div className="rounded-[1rem] border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700 shadow-soft">
            {loadError || 'Institution data is unavailable.'}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-9 lg:px-8">
        <div className="rounded-[1rem] bg-ink p-7 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-gold">
                Institution Administration Dashboard
              </p>
              <h1 className="mt-3 max-w-5xl text-4xl font-black leading-tight">
                {institution.institutionName}
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-white/80">
                Manage the live institution record: services with official fees, departments, staff, platform
                accounts, and the public QR access page that citizens scan before reporting.
              </p>
            </div>
            <ActionButton onClick={regenerateQr}>
              <QrCodeIcon className="h-5 w-5" />
              Generate QR
            </ActionButton>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            ['Services', services.length],
            ['Departments', departments.length],
            ['Staff', employees.length],
            ['Linked services', staffServiceLinks.length],
            ['QR status', qrCodeDataUrl ? 'Active' : 'Pending'],
          ].map(([label, value]) => (
            <article key={label} className="rounded-[1rem] border border-ink/10 bg-white p-5 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">{label}</p>
              <p className="mt-3 text-3xl font-black text-ink">{value}</p>
            </article>
          ))}
        </div>

        <Panel
          id="profile"
          title="Institution profile"
          subtitle="Official information shown to citizens after they scan the institution QR code."
          className="mt-6"
          actions={
            <ActionButton
              tone="ghost"
              onClick={() =>
                openModal('edit-profile', institution, {
                  institutionType: institution.institutionType ?? '',
                  officialEmail: institution.officialEmail ?? '',
                  officialPhone: institution.officialPhone ?? '',
                  officeAddress: institution.officeAddress ?? '',
                })
              }
            >
              <PencilSquareIcon className="h-5 w-5" />
              Edit Profile
            </ActionButton>
          }
        >
          <div className="mt-5 grid gap-3 text-sm text-slate md:grid-cols-2">
            {[
              ['Institution', institution.institutionName],
              ['Type', institution.institutionType],
              ['Level', institution.level],
              ['Location', formatLocation(institution.location)],
              ['Phone', institution.officialPhone || 'Not provided'],
              ['Email', institution.officialEmail || 'Not provided'],
              ['Office address', institution.officeAddress || 'Not provided'],
              ['Public URL', `/institutions/${institution.slug}`],
            ].map(([label, value]) => (
              <p key={label} className="rounded-lg bg-mist px-4 py-3">
                <span className="font-bold text-ink">{label}:</span> {value}
              </p>
            ))}
          </div>
          <FeedbackBanner {...(panelFeedback.profile ?? {})} />
        </Panel>

        <Panel
          id="services"
          title="Register services"
          subtitle="Each service shows citizens the official fee, schedule, and required documents, so unofficial payments are visible immediately."
          className="mt-6"
        >
          <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={addService}>
            <TextInput
              label="Service name"
              name="name"
              value={serviceForm.name}
              onChange={(event) => setServiceForm((c) => ({ ...c, name: event.target.value }))}
              required
              minLength={2}
            />
            <SelectInput
              label="Fee type"
              name="feeType"
              value={serviceForm.feeType}
              onChange={(event) => setServiceForm((c) => ({ ...c, feeType: event.target.value }))}
            >
              <option value="free">Free service</option>
              <option value="paid">Paid - official fee</option>
            </SelectInput>
            <TextInput
              label="Official fee (RWF)"
              name="officialFeeRwf"
              type="number"
              min="0"
              value={serviceForm.officialFeeRwf}
              onChange={(event) => setServiceForm((c) => ({ ...c, officialFeeRwf: event.target.value }))}
              disabled={serviceForm.feeType !== 'paid'}
            />
            <TextInput
              label="Weekly schedule"
              name="schedule"
              value={serviceForm.schedule}
              onChange={(event) => setServiceForm((c) => ({ ...c, schedule: event.target.value }))}
              placeholder="Monday to Friday, 08:00 - 15:00"
            />
            <TextInput
              label="Required documents"
              name="documents"
              value={serviceForm.documents}
              onChange={(event) => setServiceForm((c) => ({ ...c, documents: event.target.value }))}
              placeholder="National ID, application reference"
            />
            <TextInput
              label="Payment / access note"
              name="accessNote"
              value={serviceForm.accessNote}
              onChange={(event) => setServiceForm((c) => ({ ...c, accessNote: event.target.value }))}
              placeholder="Official receipted payment only"
            />
            <div className="lg:col-span-3">
              <TextInput
                label="Short description"
                name="description"
                value={serviceForm.description}
                onChange={(event) => setServiceForm((c) => ({ ...c, description: event.target.value }))}
                placeholder="What the citizen receives from this service"
              />
            </div>
            <div className="lg:col-span-3">
              <ActionButton type="submit">
                <PlusIcon className="h-5 w-5" />
                Add Service
              </ActionButton>
            </div>
          </form>

          <FeedbackBanner {...(panelFeedback.services ?? {})} />

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.name} className="rounded-[1rem] border border-ink/10 bg-mist p-5">
                <p className="text-lg font-black text-ink">{service.name}</p>
                <p className="mt-2 text-sm text-slate">{service.description || 'No description yet.'}</p>
                <div className="mt-4 space-y-2 text-sm text-slate">
                  <p>Fee: {formatFee(service)}</p>
                  {service.schedule ? <p>Schedule: {service.schedule}</p> : null}
                  {service.documents ? <p>Documents: {service.documents}</p> : null}
                </div>
                <CardActions
                  onView={() => openModal('view-service', service)}
                  onEdit={() => openModal('edit-service', service, serviceToForm(service))}
                  onDelete={() => openModal('delete-service', service)}
                />
              </article>
            ))}
            {services.length === 0 ? (
              <p className="rounded-[1rem] border border-ink/10 bg-mist p-5 text-sm text-slate">
                No services registered yet. Citizens will see an empty catalog until a service is added.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          id="departments"
          title="Departments"
          subtitle="Departments organize services and staff responsibilities for citizens."
          className="mt-6"
        >
          <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={addDepartment}>
            <TextInput
              label="Department name"
              name="name"
              value={departmentForm.name}
              onChange={(event) => setDepartmentForm((c) => ({ ...c, name: event.target.value }))}
              required
              minLength={2}
            />
            <TextInput
              label="Focus / description"
              name="description"
              value={departmentForm.description}
              onChange={(event) => setDepartmentForm((c) => ({ ...c, description: event.target.value }))}
            />
            <div className="flex items-end">
              <ActionButton type="submit">
                <PlusIcon className="h-5 w-5" />
                Add Department
              </ActionButton>
            </div>
          </form>

          <FeedbackBanner {...(panelFeedback.departments ?? {})} />

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {departments.map((department) => (
              <article key={department.departmentId} className="rounded-[1rem] border border-ink/10 bg-mist p-5">
                <p className="text-lg font-black text-ink">{department.name}</p>
                <p className="mt-2 text-sm text-slate">{department.description || 'No description yet.'}</p>
                <CardActions
                  onView={() => openModal('view-department', department)}
                  onEdit={() =>
                    openModal('edit-department', department, {
                      name: department.name ?? '',
                      description: department.description ?? '',
                    })
                  }
                  onDelete={() => openModal('delete-department', department)}
                />
              </article>
            ))}
            {departments.length === 0 ? (
              <p className="rounded-[1rem] border border-ink/10 bg-mist p-5 text-sm text-slate">
                No departments created yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          id="staff"
          title="Register staff"
          subtitle="Add employees, keep their records updated, and optionally create platform accounts for them."
          className="mt-6"
        >
          <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={addStaff}>
            <TextInput
              label="Full name"
              name="fullName"
              value={staffForm.fullName}
              onChange={(event) => setStaffForm((c) => ({ ...c, fullName: event.target.value }))}
              required
              minLength={4}
            />
            <TextInput
              label="National ID (16 digits)"
              name="nationalId"
              value={staffForm.nationalId}
              onChange={(event) => setStaffForm((c) => ({ ...c, nationalId: event.target.value }))}
              required
              pattern="\d{16}"
              title="National ID must be 16 numeric digits"
            />
            <TextInput
              label="Phone"
              name="phone"
              value={staffForm.phone}
              onChange={(event) => setStaffForm((c) => ({ ...c, phone: event.target.value }))}
              required
            />
            <TextInput
              label="Position title"
              name="positionTitle"
              value={staffForm.positionTitle}
              onChange={(event) => setStaffForm((c) => ({ ...c, positionTitle: event.target.value }))}
              required
              minLength={2}
            />
            <TextInput
              label="Position (Kinyarwanda)"
              name="positionKinyarwanda"
              value={staffForm.positionKinyarwanda}
              onChange={(event) => setStaffForm((c) => ({ ...c, positionKinyarwanda: event.target.value }))}
            />
            <TextInput
              label="Reports to"
              name="reportsTo"
              value={staffForm.reportsTo}
              onChange={(event) => setStaffForm((c) => ({ ...c, reportsTo: event.target.value }))}
            />
            <TextInput
              label="Email"
              name="email"
              type="email"
              value={staffForm.email}
              onChange={(event) => setStaffForm((c) => ({ ...c, email: event.target.value }))}
              required={staffForm.createPlatformAccount}
            />
            <TextInput
              label="Duties / description"
              name="description"
              value={staffForm.description}
              onChange={(event) => setStaffForm((c) => ({ ...c, description: event.target.value }))}
            />
            <div className="flex flex-col justify-end gap-3">
              <label className="flex items-center gap-2 text-sm font-bold text-ink">
                <input
                  type="checkbox"
                  checked={staffForm.createPlatformAccount}
                  onChange={(event) =>
                    setStaffForm((c) => ({ ...c, createPlatformAccount: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-ink/20"
                />
                Create platform login account
              </label>
              {staffForm.createPlatformAccount ? (
                <TextInput
                  label="Temporary password"
                  name="password"
                  type="password"
                  value={staffForm.password}
                  onChange={(event) => setStaffForm((c) => ({ ...c, password: event.target.value }))}
                  minLength={8}
                  required
                />
              ) : null}
            </div>
            <div className="lg:col-span-3">
              <ActionButton type="submit">
                <UserPlusIcon className="h-5 w-5" />
                Add Staff
              </ActionButton>
            </div>
          </form>

          <FeedbackBanner {...(panelFeedback.staff ?? {})} />

          {createdStaffAccounts.length > 0 ? (
            <div className="mt-5 grid gap-3 xl:grid-cols-3">
              {createdStaffAccounts.map((account) => (
                <article key={account.userId} className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate">
                  <p className="font-black text-ink">New staff login created</p>
                  <p className="mt-2 break-all">Email: {account.email}</p>
                  <p className="mt-1 break-all">Access key: {account.accessKey}</p>
                </article>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {employees.map((member) => (
              <article key={member.employeeId} className="rounded-[1rem] border border-ink/10 bg-mist p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-black text-ink">{member.fullName}</p>
                  {member.isLeader ? (
                    <span className="rounded-full bg-gold/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-ink">
                      Leader
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate">{member.positionTitle}</p>
                <p className="mt-3 text-sm text-slate">{member.phone}</p>
                <p className="mt-1 text-sm text-slate">Status: {member.status}</p>
                <CardActions
                  onView={() => openModal('view-staff', member)}
                  onEdit={() => openModal('edit-staff', member, staffToForm(member))}
                  onDelete={member.isLeader ? null : () => openModal('delete-staff', member)}
                />
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          id="linking"
          title="Link staff to services"
          subtitle="Connect each service to the responsible staff member so citizens know who handles each service after scanning the QR code."
          className="mt-6"
        >
          <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]" onSubmit={addStaffServiceLink}>
            <SelectInput
              label="Staff member"
              name="employeeId"
              value={linkForm.employeeId || employees[0]?.employeeId || ''}
              onChange={(event) => setLinkForm((c) => ({ ...c, employeeId: event.target.value }))}
            >
              {employees.map((member) => (
                <option key={member.employeeId} value={member.employeeId}>
                  {member.fullName} - {member.positionTitle}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              label="Service"
              name="serviceName"
              value={linkForm.serviceName || services[0]?.name || ''}
              onChange={(event) => setLinkForm((c) => ({ ...c, serviceName: event.target.value }))}
            >
              {services.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name}
                </option>
              ))}
            </SelectInput>
            <div className="flex items-end">
              <ActionButton type="submit">
                <LinkIcon className="h-5 w-5" />
                Link
              </ActionButton>
            </div>
          </form>

          <FeedbackBanner {...(panelFeedback.linking ?? {})} />

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {staffServiceLinks.map((link) => (
              <article key={link.linkId} className="rounded-[1rem] border border-ink/10 bg-mist p-5">
                <p className="text-lg font-black text-ink">{link.serviceName}</p>
                <p className="mt-2 text-sm text-slate">
                  Responsible staff: {link.employeeName}
                  {link.positionTitle ? ` (${link.positionTitle})` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                  <button
                    type="button"
                    onClick={() => removeStaffServiceLink(link.linkId)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Unlink
                  </button>
                </div>
              </article>
            ))}
            {staffServiceLinks.length === 0 ? (
              <p className="rounded-[1rem] border border-ink/10 bg-mist p-5 text-sm text-slate">
                No staff-service links yet. Link each service to the staff member who handles it.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          id="qr-code"
          title="Generate QR code"
          subtitle="This is a real scannable QR code. It opens the citizen-facing institution page with services, staff, fees, documents, and reporting options."
          className="mt-6"
          actions={
            <ActionButton onClick={regenerateQr}>
              <ArrowPathIcon className="h-5 w-5" />
              Refresh QR
            </ActionButton>
          }
        >
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-[1rem] border border-ink/10 bg-mist p-6">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Real QR code for ${institution.institutionName}`}
                  className="mx-auto h-64 w-64 rounded-xl bg-emerald-50 p-3 shadow-soft"
                />
              ) : (
                <div className="mx-auto grid h-64 w-64 place-items-center rounded-xl border border-ink/10 bg-mist p-6 text-center text-sm font-bold text-slate">
                  {qrError || 'Generating QR code...'}
                </div>
              )}
              <p className="mt-5 text-center text-sm font-bold text-ink">SACCFP QR - {institution.institutionName}</p>
              <p className="mt-1 text-center text-xs text-slate">Generated: {new Date(qrGeneratedAt).toLocaleString()}</p>
              <a
                href={qrScanUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block break-all rounded-lg border border-ink/10 bg-mist px-4 py-3 text-center text-xs font-semibold text-emerald-600"
              >
                {qrScanUrl}
              </a>
            </div>

            <div className="rounded-[1rem] border border-ink/10 bg-mist p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-tide">After citizen scans</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  `${institution.institutionName} profile and official contacts`,
                  `${services.length} services with schedules, fees, and required documents`,
                  `${employees.length} staff members with duties and contact details`,
                  `${departments.length} departments supporting service delivery`,
                  'Poor-service and corruption reporting entry point',
                ].map((item) => (
                  <p key={item} className="rounded-lg bg-white px-4 py-4 text-sm font-semibold leading-6 text-ink">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          id="testing-users"
          title="Create testing users"
          subtitle="Citizen accounts are created only from the citizen registration page. Use this admin area to create presentation accounts for RIB officers and institution leaders."
          className="mt-6"
        >
          <form className="mt-6 grid gap-4 lg:grid-cols-5" onSubmit={addTestingUser}>
            <TextInput
              label="Full name"
              name="fullName"
              value={testingUserForm.fullName}
              onChange={(event) => setTestingUserForm((c) => ({ ...c, fullName: event.target.value }))}
              required
            />
            <TextInput
              label="Email"
              name="email"
              value={testingUserForm.email}
              onChange={(event) => setTestingUserForm((c) => ({ ...c, email: event.target.value }))}
              type="email"
              required
            />
            <TextInput
              label="Password"
              name="password"
              value={testingUserForm.password}
              onChange={(event) => setTestingUserForm((c) => ({ ...c, password: event.target.value }))}
              type="password"
              minLength={8}
              required
            />
            <SelectInput
              label="Role"
              name="role"
              value={testingUserForm.role}
              onChange={(event) => setTestingUserForm((c) => ({ ...c, role: event.target.value }))}
              required
            >
              {testingUserRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
            <TextInput
              label="Phone optional"
              name="phone"
              value={testingUserForm.phone}
              onChange={(event) => setTestingUserForm((c) => ({ ...c, phone: event.target.value }))}
              placeholder="+250788123456"
            />

            <div className="lg:col-span-5">
              <ActionButton type="submit" disabled={isCreatingTestingUser}>
                <UserPlusIcon className="h-5 w-5" />
                {isCreatingTestingUser ? 'Creating User...' : 'Create User'}
              </ActionButton>
            </div>
          </form>

          <FeedbackBanner error={testingUserError} success={testingUserSuccess} />

          {createdTestingUsers.length > 0 ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {createdTestingUsers.map((account) => (
                <article key={account.userId} className="rounded-[1rem] border border-ink/10 bg-mist p-5 text-sm text-slate">
                  <p className="text-lg font-black text-ink">{account.fullName}</p>
                  <p className="mt-2 font-bold text-ink">{account.role}</p>
                  <p className="mt-3 break-all">Email: {account.loginEmail}</p>
                  <p className="mt-1 break-all">Access key: {account.accessKey}</p>
                  <p className="mt-1">Status: {account.status}</p>
                </article>
              ))}
            </div>
          ) : null}
        </Panel>
      </section>

      {/* ---- View details modals ---- */}

      <DetailsModal
        isOpen={modal?.type === 'view-service'}
        title={modal?.data?.name ?? 'Service details'}
        subtitle="Full service information visible to citizens after scanning the QR code."
        onClose={closeModal}
      >
        {modal?.data ? (
          <div className="grid gap-3">
            <DetailRow label="Description" value={modal.data.description || 'Not provided'} />
            <DetailRow label="Fee" value={formatFee(modal.data)} />
            <DetailRow label="Payment note" value={modal.data.accessNote} />
            <DetailRow label="Schedule" value={modal.data.schedule || 'Working days'} />
            <DetailRow label="Required documents" value={modal.data.documents || 'Not specified'} />
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'view-department'}
        title={modal?.data?.name ?? 'Department details'}
        subtitle="Department record registered under this institution."
        onClose={closeModal}
      >
        {modal?.data ? (
          <div className="grid gap-3">
            <DetailRow label="Department ID" value={modal.data.departmentId} />
            <DetailRow label="Description" value={modal.data.description || 'Not provided'} />
            <DetailRow label="Created" value={modal.data.createdAt ? new Date(modal.data.createdAt).toLocaleString() : 'Unknown'} />
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'view-staff'}
        title={modal?.data?.fullName ?? 'Staff details'}
        subtitle="Complete staff record, duties, and platform account status."
        onClose={closeModal}
      >
        {modal?.data ? (
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Position" value={modal.data.positionTitle} />
            <DetailRow label="Position (Kinyarwanda)" value={modal.data.positionKinyarwanda} />
            <DetailRow label="National ID" value={modal.data.nationalId} />
            <DetailRow label="Phone" value={modal.data.phone} />
            <DetailRow label="Email" value={modal.data.email} />
            <DetailRow label="Reports to" value={modal.data.reportsTo} />
            <DetailRow label="Status" value={modal.data.status} />
            <DetailRow label="Role" value={modal.data.isLeader ? 'Institution leader' : 'Staff member'} />
            <div className="md:col-span-2">
              <DetailRow label="Duties" value={modal.data.description || 'Not provided'} />
            </div>
            <div className="md:col-span-2">
              <DetailRow
                label="Platform account"
                value={
                  modal.data.hasPlatformAccount
                    ? `Active login (${modal.data.account?.email ?? 'email hidden'})`
                    : 'No platform login account yet'
                }
              />
            </div>
          </div>
        ) : null}
      </DetailsModal>

      {/* ---- Edit modals ---- */}

      <DetailsModal
        isOpen={modal?.type === 'edit-profile'}
        title="Edit institution profile"
        subtitle="Update the official information citizens see after scanning the QR code."
        onClose={closeModal}
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="ink"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () =>
                    updateInstitutionManagement(institutionId, {
                      institutionType: modalForm.institutionType.trim(),
                      officialEmail: modalForm.officialEmail.trim(),
                      officialPhone: modalForm.officialPhone.trim(),
                      officeAddress: modalForm.officeAddress.trim(),
                      services,
                    }),
                  'profile',
                  'Institution profile updated successfully.',
                )
              }
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </ActionButton>
          </>
        }
      >
        {modalForm ? (
          <div className="grid gap-4">
            <TextInput label="Institution type" name="institutionType" value={modalForm.institutionType} onChange={updateModalForm} />
            <TextInput label="Official email" name="officialEmail" type="email" value={modalForm.officialEmail} onChange={updateModalForm} />
            <TextInput label="Official phone" name="officialPhone" value={modalForm.officialPhone} onChange={updateModalForm} />
            <TextInput label="Office address" name="officeAddress" value={modalForm.officeAddress} onChange={updateModalForm} />
            {modalError ? <p className="text-sm font-semibold text-red-600">{modalError}</p> : null}
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'edit-service'}
        title={`Edit service: ${modal?.data?.name ?? ''}`}
        subtitle="Update the fee, schedule, documents, and description for this service."
        onClose={closeModal}
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="ink"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () => updateInstitutionService(institutionId, modal.data.name, serviceFormToPayload(modalForm)),
                  'services',
                  'Service updated successfully.',
                )
              }
            >
              {isSaving ? 'Saving...' : 'Save Service'}
            </ActionButton>
          </>
        }
      >
        {modalForm ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Service name" name="name" value={modalForm.name} onChange={updateModalForm} />
            <SelectInput label="Fee type" name="feeType" value={modalForm.feeType} onChange={updateModalForm}>
              <option value="free">Free service</option>
              <option value="paid">Paid - official fee</option>
            </SelectInput>
            <TextInput
              label="Official fee (RWF)"
              name="officialFeeRwf"
              type="number"
              min="0"
              value={modalForm.officialFeeRwf}
              onChange={updateModalForm}
              disabled={modalForm.feeType !== 'paid'}
            />
            <TextInput label="Schedule" name="schedule" value={modalForm.schedule} onChange={updateModalForm} />
            <TextInput label="Required documents" name="documents" value={modalForm.documents} onChange={updateModalForm} />
            <TextInput label="Payment / access note" name="accessNote" value={modalForm.accessNote} onChange={updateModalForm} />
            <div className="md:col-span-2">
              <TextInput label="Description" name="description" value={modalForm.description} onChange={updateModalForm} />
            </div>
            {modalError ? <p className="text-sm font-semibold text-red-600 md:col-span-2">{modalError}</p> : null}
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'edit-department'}
        title={`Edit department: ${modal?.data?.name ?? ''}`}
        subtitle="Update the department name or description."
        onClose={closeModal}
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="ink"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () =>
                    updateInstitutionDepartment(institutionId, modal.data.departmentId, {
                      name: modalForm.name.trim(),
                      description: modalForm.description.trim(),
                    }),
                  'departments',
                  'Department updated successfully.',
                )
              }
            >
              {isSaving ? 'Saving...' : 'Save Department'}
            </ActionButton>
          </>
        }
      >
        {modalForm ? (
          <div className="grid gap-4">
            <TextInput label="Department name" name="name" value={modalForm.name} onChange={updateModalForm} />
            <TextInput label="Description" name="description" value={modalForm.description} onChange={updateModalForm} />
            {modalError ? <p className="text-sm font-semibold text-red-600">{modalError}</p> : null}
          </div>
        ) : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'edit-staff'}
        title={`Edit staff: ${modal?.data?.fullName ?? ''}`}
        subtitle="Update the staff record. Changes also update the linked platform account."
        onClose={closeModal}
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="ink"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () =>
                    updateInstitutionStaffMember(institutionId, modal.data.employeeId, {
                      fullName: modalForm.fullName.trim(),
                      phone: modalForm.phone.trim(),
                      email: modalForm.email.trim(),
                      positionTitle: modalForm.positionTitle.trim(),
                      positionKinyarwanda: modalForm.positionKinyarwanda.trim(),
                      reportsTo: modalForm.reportsTo.trim(),
                      description: modalForm.description.trim(),
                      status: modalForm.status,
                    }),
                  'staff',
                  'Staff member updated successfully.',
                )
              }
            >
              {isSaving ? 'Saving...' : 'Save Staff'}
            </ActionButton>
          </>
        }
      >
        {modalForm ? (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Full name" name="fullName" value={modalForm.fullName} onChange={updateModalForm} />
            <TextInput label="Phone" name="phone" value={modalForm.phone} onChange={updateModalForm} />
            <TextInput label="Email" name="email" type="email" value={modalForm.email} onChange={updateModalForm} />
            <TextInput label="Position title" name="positionTitle" value={modalForm.positionTitle} onChange={updateModalForm} />
            <TextInput label="Position (Kinyarwanda)" name="positionKinyarwanda" value={modalForm.positionKinyarwanda} onChange={updateModalForm} />
            <TextInput label="Reports to" name="reportsTo" value={modalForm.reportsTo} onChange={updateModalForm} />
            <SelectInput label="Status" name="status" value={modalForm.status} onChange={updateModalForm}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>
            <TextInput label="Duties / description" name="description" value={modalForm.description} onChange={updateModalForm} />
            {modalError ? <p className="text-sm font-semibold text-red-600 md:col-span-2">{modalError}</p> : null}
          </div>
        ) : null}
      </DetailsModal>

      {/* ---- Delete confirmation modals ---- */}

      <DetailsModal
        isOpen={modal?.type === 'delete-service'}
        title={`Delete service: ${modal?.data?.name ?? ''}`}
        subtitle="Citizens will no longer see this service on the QR public access page."
        onClose={closeModal}
        widthClass="max-w-lg"
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="danger"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () => deleteInstitutionService(institutionId, modal.data.name),
                  'services',
                  'Service deleted successfully.',
                )
              }
            >
              {isSaving ? 'Deleting...' : 'Delete Service'}
            </ActionButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-slate">
          This permanently removes the service record, including its fee rule, schedule, and required documents.
        </p>
        {modalError ? <p className="mt-3 text-sm font-semibold text-red-600">{modalError}</p> : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'delete-department'}
        title={`Delete department: ${modal?.data?.name ?? ''}`}
        subtitle="This removes the department from the institution record."
        onClose={closeModal}
        widthClass="max-w-lg"
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="danger"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () => deleteInstitutionDepartment(institutionId, modal.data.departmentId),
                  'departments',
                  'Department deleted successfully.',
                )
              }
            >
              {isSaving ? 'Deleting...' : 'Delete Department'}
            </ActionButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-slate">
          Staff and services stay registered, but they will no longer reference this department.
        </p>
        {modalError ? <p className="mt-3 text-sm font-semibold text-red-600">{modalError}</p> : null}
      </DetailsModal>

      <DetailsModal
        isOpen={modal?.type === 'delete-staff'}
        title={`Delete staff: ${modal?.data?.fullName ?? ''}`}
        subtitle="The staff record is removed and any linked platform account is deactivated."
        onClose={closeModal}
        widthClass="max-w-lg"
        footer={
          <>
            <ActionButton tone="ghost" onClick={closeModal}>
              Cancel
            </ActionButton>
            <ActionButton
              tone="danger"
              disabled={isSaving}
              onClick={() =>
                runModalAction(
                  () => deleteInstitutionStaffMember(institutionId, modal.data.employeeId),
                  'staff',
                  'Staff member deleted successfully.',
                )
              }
            >
              {isSaving ? 'Deleting...' : 'Delete Staff'}
            </ActionButton>
          </>
        }
      >
        <p className="text-sm leading-7 text-slate">
          Citizens will no longer see this person on the QR access page, and their login (if any) stops working.
        </p>
        {modalError ? <p className="mt-3 text-sm font-semibold text-red-600">{modalError}</p> : null}
      </DetailsModal>
    </div>
  );
}

export default InstitutionAdminDashboardPage;

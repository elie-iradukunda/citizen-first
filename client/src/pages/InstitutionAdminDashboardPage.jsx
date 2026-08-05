import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  QrCodeIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import DetailsModal, { DetailRow } from '../components/dashboard/DetailsModal';
import ExportButton from '../components/dashboard/ExportButton';
import { useAuth } from '../context/AuthContext';
import {
  createInstitutionDepartment,
  createInstitutionService,
  createInstitutionStaffMember,
  createStaffServiceLink,
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
  departmentId: '',
  reportsTo: '',
  description: '',
  createPlatformAccount: false,
  password: '',
};

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
    departmentId: employee.departmentId ?? '',
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

function TextArea({ label, name, value, onChange, placeholder = '', rows = 3, hint = '', ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full resize-y rounded-lg border border-ink/10 bg-mist px-3 py-2.5 text-sm leading-6 outline-none focus:border-tide"
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-slate">{hint}</span> : null}
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

  const [staffSearch, setStaffSearch] = useState('');
  const [staffPage, setStaffPage] = useState(1);
  const STAFF_PAGE_SIZE = 6;

  const [createdStaffAccounts, setCreatedStaffAccounts] = useState([]);

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

  // Staff search + pagination (institution admin manages potentially many staff).
  const filteredStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();
    if (!query) {
      return employees;
    }
    return employees.filter((member) =>
      [member.fullName, member.positionTitle, member.positionKinyarwanda, member.phone, member.email, member.reportsTo]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)),
    );
  }, [employees, staffSearch]);

  const staffTotalPages = Math.max(1, Math.ceil(filteredStaff.length / STAFF_PAGE_SIZE));
  const currentStaffPage = Math.min(staffPage, staffTotalPages);
  const pagedStaff = filteredStaff.slice(
    (currentStaffPage - 1) * STAFF_PAGE_SIZE,
    currentStaffPage * STAFF_PAGE_SIZE,
  );

  // Reset to the first page whenever the search or the underlying list changes.
  useEffect(() => {
    setStaffPage(1);
  }, [staffSearch, employees.length]);

  // Group service links by service so the admin sees, per service, who is
  // responsible (or that no one is assigned yet).
  const linksByService = useMemo(() => {
    return services.map((service) => ({
      service,
      links: staffServiceLinks.filter((link) => link.serviceName === service.name),
    }));
  }, [services, staffServiceLinks]);

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
        departmentId: staffForm.departmentId,
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
            <TextArea
              label="Required documents"
              name="documents"
              value={serviceForm.documents}
              onChange={(event) => setServiceForm((c) => ({ ...c, documents: event.target.value }))}
              placeholder="National ID, application reference (one per line)"
              rows={3}
            />
            <TextArea
              label="Payment / access note"
              name="accessNote"
              value={serviceForm.accessNote}
              onChange={(event) => setServiceForm((c) => ({ ...c, accessNote: event.target.value }))}
              placeholder="Official receipted payment only"
              rows={3}
            />
            <div className="lg:col-span-3">
              <TextArea
                label="Short description"
                name="description"
                value={serviceForm.description}
                onChange={(event) => setServiceForm((c) => ({ ...c, description: event.target.value }))}
                placeholder="What the citizen receives from this service"
                rows={3}
                hint="Shown to citizens on the public QR page."
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
            <TextArea
              label="Focus / description"
              name="description"
              value={departmentForm.description}
              onChange={(event) => setDepartmentForm((c) => ({ ...c, description: event.target.value }))}
              placeholder="What this department is responsible for"
              rows={3}
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
          subtitle="You (the institution admin) add each staff member so citizens can see who delivers each service. Staff do not need to log in — a platform account is optional."
          className="mt-6"
          actions={
            <ExportButton
              dataset="staff"
              label="Export Staff"
              onError={(message) => setFeedback('staff', message, '')}
            />
          }
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
            <SelectInput
              label="Department"
              name="departmentId"
              value={staffForm.departmentId}
              onChange={(event) => setStaffForm((c) => ({ ...c, departmentId: event.target.value }))}
            >
              <option value="">No department yet</option>
              {(institution?.departments ?? []).map((department) => (
                <option key={department.departmentId} value={department.departmentId}>
                  {department.name}
                </option>
              ))}
            </SelectInput>
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
            <div className="lg:col-span-2">
              <TextArea
                label="Duties / description"
                name="description"
                value={staffForm.description}
                onChange={(event) => setStaffForm((c) => ({ ...c, description: event.target.value }))}
                placeholder="What this staff member does (shown to citizens)"
                rows={3}
              />
            </div>
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

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6">
            <div>
              <p className="text-sm font-black text-ink">Registered staff</p>
              <p className="text-xs text-slate">
                {filteredStaff.length} {filteredStaff.length === 1 ? 'person' : 'people'}
                {staffSearch.trim() ? ` matching "${staffSearch.trim()}"` : ''}
              </p>
            </div>
            <label className="relative w-full max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
              <input
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
                placeholder="Search name, position, phone..."
                className="h-11 w-full rounded-lg border border-ink/10 bg-mist pl-9 pr-3 text-sm outline-none focus:border-tide"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {pagedStaff.map((member) => (
              <article key={member.employeeId} className="flex flex-col rounded-[1rem] border border-ink/10 bg-mist p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-white">
                      {(member.fullName || '?').split(' ').map((part) => part[0] || '').join('').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-base font-black leading-tight text-ink">{member.fullName}</p>
                      <p className="text-xs text-slate">{member.positionTitle}</p>
                    </div>
                  </div>
                  {member.isLeader ? (
                    <span className="rounded-full bg-gold/20 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-ink">
                      Leader
                    </span>
                  ) : null}
                </div>
                <dl className="mt-4 space-y-1.5 text-sm text-slate">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate/70">Department</dt>
                    <dd className="font-semibold text-ink">{member.departmentName || 'Not assigned'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate/70">Phone</dt>
                    <dd className="font-semibold text-ink">{member.phone || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate/70">Status</dt>
                    <dd className="font-semibold text-ink">{member.status}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate/70">Login</dt>
                    <dd className="font-semibold text-ink">{member.hasPlatformAccount ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
                <div className="mt-auto">
                  <CardActions
                    onView={() => openModal('view-staff', member)}
                    onEdit={() => openModal('edit-staff', member, staffToForm(member))}
                    onDelete={member.isLeader ? null : () => openModal('delete-staff', member)}
                  />
                </div>
              </article>
            ))}
            {filteredStaff.length === 0 ? (
              <p className="rounded-[1rem] border border-ink/10 bg-mist p-5 text-sm text-slate xl:col-span-3">
                {staffSearch.trim()
                  ? 'No staff match your search.'
                  : 'No staff registered yet. Add employees so citizens can see who delivers each service.'}
              </p>
            ) : null}
          </div>

          {staffTotalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStaffPage((page) => Math.max(1, page - 1))}
                disabled={currentStaffPage <= 1}
                className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs font-bold text-slate">
                Page {currentStaffPage} of {staffTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setStaffPage((page) => Math.min(staffTotalPages, page + 1))}
                disabled={currentStaffPage >= staffTotalPages}
                className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          ) : null}
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
                Assign
              </ActionButton>
            </div>
          </form>

          <FeedbackBanner {...(panelFeedback.linking ?? {})} />

          <div className="mt-8">
            <p className="text-sm font-black text-ink">Responsibility by service</p>
            <p className="text-xs text-slate">
              Every service should have at least one responsible staff member. Citizens see this after scanning the QR.
            </p>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {linksByService.map(({ service, links }) => (
              <article key={service.name} className="rounded-[1rem] border border-ink/10 bg-mist p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-black text-ink">{service.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                      links.length
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {links.length ? `${links.length} assigned` : 'Unassigned'}
                  </span>
                </div>
                {links.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {links.map((link) => (
                      <span
                        key={link.linkId}
                        className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1 pl-3 pr-1.5 text-xs font-semibold text-ink"
                      >
                        {link.employeeName}
                        {link.positionTitle ? (
                          <span className="text-slate/70">· {link.positionTitle}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeStaffServiceLink(link.linkId)}
                          title={`Unlink ${link.employeeName}`}
                          className="grid h-5 w-5 place-items-center rounded-full text-red-500 transition hover:bg-red-50"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate">No staff assigned to this service yet.</p>
                )}
              </article>
            ))}
            {services.length === 0 ? (
              <p className="rounded-[1rem] border border-ink/10 bg-mist p-5 text-sm text-slate xl:col-span-2">
                Register a service first, then assign the staff member who handles it.
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
            <DetailRow label="Department" value={modal.data.departmentName || 'Not assigned'} />
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
            <TextArea label="Required documents" name="documents" value={modalForm.documents} onChange={updateModalForm} rows={2} />
            <TextArea label="Payment / access note" name="accessNote" value={modalForm.accessNote} onChange={updateModalForm} rows={2} />
            <div className="md:col-span-2">
              <TextArea label="Description" name="description" value={modalForm.description} onChange={updateModalForm} rows={3} />
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
            <TextArea label="Description" name="description" value={modalForm.description} onChange={updateModalForm} rows={3} />
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
                      departmentId: modalForm.departmentId,
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
            <SelectInput label="Department" name="departmentId" value={modalForm.departmentId} onChange={updateModalForm}>
              <option value="">No department yet</option>
              {(institution?.departments ?? []).map((department) => (
                <option key={department.departmentId} value={department.departmentId}>
                  {department.name}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Status" name="status" value={modalForm.status} onChange={updateModalForm}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>
            <div className="md:col-span-2">
              <TextArea label="Duties / description" name="description" value={modalForm.description} onChange={updateModalForm} rows={3} />
            </div>
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

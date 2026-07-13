import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardState from '../components/dashboard/DashboardState';
import InstitutionAccessQrPanel from '../components/dashboard/InstitutionAccessQrPanel';
import LocationFieldGroup from '../components/forms/LocationFieldGroup';
import { useRwandaLocation } from '../hooks/useRwandaLocation';
import {
  completeInstitutionRegistration,
  fetchInviteDetail,
  fetchStaffTemplateExamples,
} from '../lib/registrationApi';

const EMPTY_DEPARTMENT = {
  name: '',
  description: '',
};

const EMPTY_EMPLOYEE = {
  leaderCode: '',
  fullName: '',
  nationalId: '',
  positionTitle: '',
  positionKinyarwanda: '',
  phone: '',
  email: '',
  reportsTo: '',
  description: '',
  status: 'Active',
};

const EMPTY_SERVICE = {
  name: '',
  description: '',
};

const CHILD_UNIT_LABEL_BY_LEVEL = {
  province: 'investigation review points',
  district: 'RIB intake points',
  sector: 'evidence triage desks',
  cell: 'QR access points',
  village: null,
};

function getExpectedChildUnitsLabel(level) {
  if (level === 'province') {
    return 'Number of investigation review points under supervisory review';
  }
  if (level === 'district') {
    return 'Number of RIB intake points under investigation review';
  }
  if (level === 'sector') {
    return 'Number of evidence triage desks under RIB intake';
  }
  if (level === 'cell') {
    return 'Number of QR access points under evidence triage';
  }
  return '';
}

function getDefaultLeaderByLevel(level) {
  if (level === 'province') {
    return {
      positionTitle: 'RIB Supervisory Review Lead',
      positionKinyarwanda: 'Umuyobozi ushinzwe isuzuma nigenzura',
    };
  }
  if (level === 'district') {
    return {
      positionTitle: 'Economic and Financial Crimes Investigator',
      positionKinyarwanda: 'Umugenzacyaha wibyaha byubukungu nimari',
    };
  }
  if (level === 'sector') {
    return {
      positionTitle: 'RIB Anti-Corruption Intake Officer',
      positionKinyarwanda: 'Umukozi wakira amakuru ya ruswa',
    };
  }
  if (level === 'cell') {
    return {
      positionTitle: 'Evidence Preservation Officer',
      positionKinyarwanda: 'Umukozi ushinzwe kubika ibimenyetso',
    };
  }
  return {
    positionTitle: 'Public QR Access Officer',
    positionKinyarwanda: 'Umukozi ushinzwe inzira ya QR',
  };
}

function formatWorkflowLevel(level = '') {
  const labels = {
    province: 'Supervisory Review',
    district: 'Investigation Review',
    sector: 'RIB Intake',
    cell: 'Evidence Triage',
    village: 'QR Access',
  };

  return labels[level] ?? level;
}

function InstitutionRegistrationPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') ?? '';
  const [invite, setInvite] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [institutionForm, setInstitutionForm] = useState({
    institutionName: '',
    institutionType: 'RIB Anti-Corruption Workflow Point',
    officialEmail: '',
    officialPhone: '',
    officeAddress: '',
    expectedChildUnits: '',
    leaderFullName: '',
    leaderNationalId: '',
    leaderPhone: '',
    leaderEmail: '',
    leaderPassword: '',
    leaderConfirmPassword: '',
    leaderPositionTitle: '',
    leaderPositionKinyarwanda: '',
    leaderDescription: '',
  });
  const [departments, setDepartments] = useState([EMPTY_DEPARTMENT]);
  const [services, setServices] = useState([EMPTY_SERVICE]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    let isActive = true;

    fetchStaffTemplateExamples()
      .then((payload) => {
        if (isActive) {
          setTemplates(payload.items);
        }
      })
      .catch(() => {
        if (isActive) {
          setTemplates([]);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!inviteToken) {
      setLoadingInvite(false);
      setInviteError('Missing invite token. Use the secure link shared by RIB oversight or your parent workflow level.');
      return () => {
        isActive = false;
      };
    }

    fetchInviteDetail(inviteToken)
      .then((payload) => {
        if (!isActive) {
          return;
        }

        const inviteItem = payload.item;
        setInvite(inviteItem);
        setInviteError('');

        const defaults = getDefaultLeaderByLevel(inviteItem.targetLevel);
        setInstitutionForm((current) => ({
          ...current,
          institutionName: inviteItem.institutionNameHint || current.institutionName,
          leaderPositionTitle: defaults.positionTitle,
          leaderPositionKinyarwanda: defaults.positionKinyarwanda,
        }));
      })
      .catch((error) => {
        if (isActive) {
          setInviteError(error.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoadingInvite(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [inviteToken]);

  const { location, updateLocation, options, catalogAvailable } = useRwandaLocation(
    useMemo(
      () => ({
        country: 'Rwanda',
        province: invite?.location?.province ?? '',
        district: invite?.location?.district ?? '',
        sector: invite?.location?.sector ?? '',
        cell: invite?.location?.cell ?? '',
        village: invite?.location?.village ?? '',
      }),
      [invite],
    ),
  );

  useEffect(() => {
    if (!invite) {
      return;
    }
    if (invite.location.province) {
      updateLocation('province', invite.location.province);
    }
    if (invite.location.district) {
      updateLocation('district', invite.location.district);
    }
    if (invite.location.sector) {
      updateLocation('sector', invite.location.sector);
    }
    if (invite.location.cell) {
      updateLocation('cell', invite.location.cell);
    }
    if (invite.location.village) {
      updateLocation('village', invite.location.village);
    }
  }, [invite, updateLocation]);

  const updateInstitutionField = (event) => {
    const { name, value } = event.target;
    setInstitutionForm((current) => ({ ...current, [name]: value }));
  };

  const updateDepartment = (index, field, value) => {
    setDepartments((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeDepartment = (index) => {
    setDepartments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addDepartment = () => {
    setDepartments((current) => [...current, EMPTY_DEPARTMENT]);
  };

  const updateService = (index, field, value) => {
    setServices((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeService = (index) => {
    setServices((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addService = () => {
    setServices((current) => [...current, EMPTY_SERVICE]);
  };

  const updateEmployee = (index, field, value) => {
    setEmployees((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeEmployee = (index) => {
    setEmployees((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addEmployee = () => {
    setEmployees((current) => [...current, EMPTY_EMPLOYEE]);
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    if (!invite) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSuccessData(null);

    try {
      if (institutionForm.leaderPassword !== institutionForm.leaderConfirmPassword) {
        throw new Error('Leader password confirmation does not match.');
      }

      const requiresChildrenCount = Boolean(CHILD_UNIT_LABEL_BY_LEVEL[invite.targetLevel]);
      let expectedChildUnits;
      if (requiresChildrenCount) {
        expectedChildUnits = Number(institutionForm.expectedChildUnits);
        if (!Number.isInteger(expectedChildUnits) || expectedChildUnits < 1) {
          throw new Error('Expected lower-level units must be a number greater than 0.');
        }
      }

      const response = await completeInstitutionRegistration({
        inviteToken,
        institutionName: institutionForm.institutionName,
        institutionType: institutionForm.institutionType,
        officialEmail: institutionForm.officialEmail,
        officialPhone: institutionForm.officialPhone,
        officeAddress: institutionForm.officeAddress,
        location,
        leader: {
          fullName: institutionForm.leaderFullName,
          nationalId: institutionForm.leaderNationalId,
          phone: institutionForm.leaderPhone,
          email: institutionForm.leaderEmail,
          password: institutionForm.leaderPassword,
          positionTitle: institutionForm.leaderPositionTitle,
          positionKinyarwanda: institutionForm.leaderPositionKinyarwanda,
          description: institutionForm.leaderDescription,
        },
        departments: departments.filter((item) => item.name.trim()),
        expectedChildUnits,
        services: services
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            description: item.description.trim(),
          })),
        employees: employees.filter((item) => item.fullName.trim()),
      });

      setSuccessData(response.item);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Loading invite"
            description="Verifying secure registration token and preparing RIB workflow setup form."
          />
        </section>
      </div>
    );
  }

  if (inviteError || !invite) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState title="Invite verification failed" description={inviteError} />
        </section>
      </div>
    );
  }

  const requiresExpectedChildUnits = Boolean(CHILD_UNIT_LABEL_BY_LEVEL[invite.targetLevel]);
  const expectedChildUnitsLabel = getExpectedChildUnitsLabel(invite.targetLevel);

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-tide">RIB Workflow Registration</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
          Register RIB workflow point, lead, and staff
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate">
          Invite scope: {formatWorkflowLevel(invite.targetLevel)} for {invite.location.province}
          {invite.location.district ? `, ${invite.location.district}` : ''}.
        </p>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
          <form onSubmit={submitRegistration} className="space-y-5 rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft lg:p-8">
            <p className="font-display text-2xl font-black text-ink">RIB Workflow Profile</p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Workflow Point Name</span>
                <input
                  name="institutionName"
                  value={institutionForm.institutionName}
                  onChange={updateInstitutionField}
                  required
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Workflow Type</span>
                <input
                  name="institutionType"
                  value={institutionForm.institutionType}
                  onChange={updateInstitutionField}
                  required
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Official Email</span>
                <input
                  type="email"
                  name="officialEmail"
                  value={institutionForm.officialEmail}
                  onChange={updateInstitutionField}
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Official Phone</span>
                <input
                  name="officialPhone"
                  value={institutionForm.officialPhone}
                  onChange={updateInstitutionField}
                  required
                  placeholder="+250788123456"
                  className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Office Address</span>
              <input
                name="officeAddress"
                value={institutionForm.officeAddress}
                onChange={updateInstitutionField}
                required
                className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
              />
            </label>

            <LocationFieldGroup
              title="Case-study Location"
              location={location}
              updateLocation={updateLocation}
              options={options}
              catalogAvailable={catalogAvailable}
              requiredLevel={invite.targetLevel}
            />

            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <p className="font-display text-xl font-black text-ink">Coverage and Services</p>
              {requiresExpectedChildUnits ? (
                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-semibold text-ink">{expectedChildUnitsLabel}</span>
                  <input
                    type="number"
                    name="expectedChildUnits"
                    value={institutionForm.expectedChildUnits}
                    onChange={updateInstitutionField}
                    min="1"
                    required
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
              ) : (
                <p className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm text-slate">
                  QR access level has no lower workflow point to register.
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">RIB services provided by this workflow point</p>
                <button
                  type="button"
                  onClick={addService}
                  className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink"
                >
                  Add service
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {services.map((service, index) => (
                  <div key={`service-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={service.name}
                      onChange={(event) => updateService(index, 'name', event.target.value)}
                      placeholder="Service name"
                      className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                    />
                    <input
                      value={service.description}
                      onChange={(event) => updateService(index, 'description', event.target.value)}
                      placeholder="Service description"
                      className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                    />
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="rounded-2xl border border-clay/25 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-clay"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <p className="font-display text-xl font-black text-ink">RIB Lead Profile</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Lead Full Name</span>
                  <input
                    name="leaderFullName"
                    value={institutionForm.leaderFullName}
                    onChange={updateInstitutionField}
                    required
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Lead National ID</span>
                  <input
                    name="leaderNationalId"
                    value={institutionForm.leaderNationalId}
                    onChange={updateInstitutionField}
                    required
                    placeholder="16 digits"
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Lead Phone</span>
                  <input
                    name="leaderPhone"
                    value={institutionForm.leaderPhone}
                    onChange={updateInstitutionField}
                    required
                    placeholder="+250788123456"
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Lead Email</span>
                  <input
                    type="email"
                    name="leaderEmail"
                    value={institutionForm.leaderEmail}
                    onChange={updateInstitutionField}
                    required
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Lead Password</span>
                  <input
                    type="password"
                    name="leaderPassword"
                    value={institutionForm.leaderPassword}
                    onChange={updateInstitutionField}
                    required
                    minLength={8}
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Confirm Password</span>
                  <input
                    type="password"
                    name="leaderConfirmPassword"
                    value={institutionForm.leaderConfirmPassword}
                    onChange={updateInstitutionField}
                    required
                    minLength={8}
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Position (English)</span>
                  <input
                    name="leaderPositionTitle"
                    value={institutionForm.leaderPositionTitle}
                    onChange={updateInstitutionField}
                    required
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-ink">Position (Kinyarwanda)</span>
                  <input
                    name="leaderPositionKinyarwanda"
                    value={institutionForm.leaderPositionKinyarwanda}
                    onChange={updateInstitutionField}
                    required
                    className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-xl font-black text-ink">Departments</p>
                <button
                  type="button"
                  onClick={addDepartment}
                  className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink"
                >
                  Add department
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {departments.map((department, index) => (
                  <div key={`department-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={department.name}
                      onChange={(event) => updateDepartment(index, 'name', event.target.value)}
                      placeholder="Department name"
                      className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                    />
                    <input
                      value={department.description}
                      onChange={(event) => updateDepartment(index, 'description', event.target.value)}
                      placeholder="Description"
                      className="rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none focus:border-tide"
                    />
                    <button
                      type="button"
                      onClick={() => removeDepartment(index)}
                      className="rounded-2xl border border-clay/25 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-clay"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-xl font-black text-ink">Employees</p>
                <button
                  type="button"
                  onClick={addEmployee}
                  className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-ink"
                >
                  Add employee
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {employees.map((employee, index) => (
                  <div key={`employee-${index}`} className="rounded-2xl border border-ink/10 bg-mist p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={employee.leaderCode}
                        onChange={(event) => updateEmployee(index, 'leaderCode', event.target.value)}
                        placeholder="RIB lead code (optional)"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                      <input
                        value={employee.fullName}
                        onChange={(event) => updateEmployee(index, 'fullName', event.target.value)}
                        placeholder="Full name"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                      <input
                        value={employee.nationalId}
                        onChange={(event) => updateEmployee(index, 'nationalId', event.target.value)}
                        placeholder="National ID"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                      <input
                        value={employee.positionTitle}
                        onChange={(event) => updateEmployee(index, 'positionTitle', event.target.value)}
                        placeholder="Position title"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                      <input
                        value={employee.positionKinyarwanda}
                        onChange={(event) =>
                          updateEmployee(index, 'positionKinyarwanda', event.target.value)
                        }
                        placeholder="Position in Kinyarwanda"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                      <input
                        value={employee.phone}
                        onChange={(event) => updateEmployee(index, 'phone', event.target.value)}
                        placeholder="+250788123456"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                      <input
                        value={employee.email}
                        onChange={(event) => updateEmployee(index, 'email', event.target.value)}
                        placeholder="Email"
                        className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-tide"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmployee(index)}
                      className="mt-3 rounded-2xl border border-clay/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-clay"
                    >
                      Remove employee
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {submitError ? (
              <div className="rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">
                {submitError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {submitting ? 'Registering RIB workflow...' : 'Complete RIB Workflow Registration'}
            </button>
          </form>

          <div className="space-y-5">
            {successData ? (
              <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
                <p className="font-display text-2xl font-black text-ink">Registration Completed</p>
                <p className="mt-3 text-sm leading-7 text-slate">
                  Workflow ID: {successData.institution.institutionId}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  RIB Lead Login Email: <span className="font-bold text-ink">{successData.leaderUser.email}</span>
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  RIB Lead Access Key: <span className="font-bold text-ink">{successData.leaderUser.accessKey}</span>
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  Next workflow stage to invite:{' '}
                  {successData.leaderUser.nextLevelToInvite
                    ? formatWorkflowLevel(successData.leaderUser.nextLevelToInvite)
                    : 'No next level'}
                </p>
                {successData.hierarchy?.childUnitLabel ? (
                  <p className="mt-2 text-sm leading-7 text-slate">
                    Registered {successData.hierarchy.childUnitLabel}: {successData.hierarchy.registeredChildUnits} of{' '}
                    {successData.hierarchy.expectedChildUnits}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-7 text-slate">
                  Services captured: {successData.servicesCount}
                </p>
                <div className="mt-5">
                  <InstitutionAccessQrPanel
                    institutionSlug={successData.institution.slug}
                    institutionName={successData.institution.institutionName}
                  />
                </div>
              </div>
            ) : (
              <DashboardState
                title="Awaiting submission"
                description="Complete workflow point, lead, departments, and employee details to finalize registration."
              />
            )}

            <div className="rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
              <p className="font-display text-2xl font-black text-ink">RIB Staff Structure Samples</p>
              <div className="mt-4 space-y-3">
                {templates.slice(0, 3).map((item) => (
                  <article key={item.leader_code} className="rounded-xl bg-mist p-4 text-sm text-slate">
                    <p className="font-semibold text-ink">
                      {item.position_title} ({item.position_kinyarwanda})
                    </p>
                    <p className="mt-2">{formatWorkflowLevel(item.institution_level?.toLowerCase())} template</p>
                    <p className="mt-2">Reports to: {item.reports_to}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default InstitutionRegistrationPage;

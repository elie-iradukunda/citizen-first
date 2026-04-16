import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ComplaintEvidencePanel from '../components/dashboard/ComplaintEvidencePanel';
import DashboardState from '../components/dashboard/DashboardState';
import SectionCard from '../components/dashboard/SectionCard';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  acceptCitizenFeedback,
  escalateCitizenComplaint,
  fetchCitizenContext,
  fetchCitizenDashboard,
  submitCitizenComplaint,
} from '../lib/dashboardApi';
import { formatDateTime } from '../lib/time';

const VIEW_MODES = {
  overview: 'Citizen follow-up, visibility, and trusted escalation',
  submit: 'Report service gaps or corruption with full routing clarity',
  services: 'Explore services, official fees, and who can help you',
  leaders: 'See your leadership chain from village up to province',
};

const LEVEL_FLOW = ['village', 'cell', 'sector', 'district', 'province', 'national'];
const ISSUE_CATEGORY_OPTIONS = {
  service_issue: ['Delayed service', 'Missing response', 'Service denial', 'Other service issue'],
  corruption_issue: ['Bribery request', 'Unknown service fee', 'Abuse of authority', 'Other corruption issue'],
};
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 180;

const INITIAL_FILTERS = {
  province: '',
  district: '',
  sector: '',
  cell: '',
  village: '',
};

function buildInitialComplaint(sourceInstitutionSlug = '', submittedVia = 'dashboard') {
  return {
    issueType: 'service_issue',
    category: ISSUE_CATEGORY_OPTIONS.service_issue[0],
    reportingMode: 'verified',
    submittedVia,
    sourceInstitutionSlug,
    serviceName: '',
    targetLeaderEmployeeId: '',
    accusedLeaderEmployeeIds: [],
    evidenceImage: null,
    voiceNote: null,
    message: '',
  };
}

function resetFilterChildren(filters, field) {
  if (field === 'province') return { ...filters, district: '', sector: '', cell: '', village: '' };
  if (field === 'district') return { ...filters, sector: '', cell: '', village: '' };
  if (field === 'sector') return { ...filters, cell: '', village: '' };
  if (field === 'cell') return { ...filters, village: '' };
  return filters;
}

function formatCurrency(value) {
  if (!value) return 'Free';
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLevel(level = '') {
  return level ? level.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : 'Unknown';
}

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province]
    .filter(Boolean)
    .join(', ');
}

function formatFileSize(bytes = 0) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('We could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function ModeLink({ active, to, children }) {
  return (
    <Link
      to={to}
      className={`rounded-full px-5 py-3 text-sm font-bold transition ${
        active ? 'bg-ink text-white' : 'border border-ink/20 bg-white text-ink'
      }`}
    >
      {children}
    </Link>
  );
}

function CitizenDashboardPage({ mode = 'overview' }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const qrInstitutionSlug = searchParams.get('institution') ?? '';
  const qrSource = searchParams.get('source') === 'qr' ? 'qr' : 'dashboard';
  const [dashboard, setDashboard] = useState(null);
  const [context, setContext] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [complaintForm, setComplaintForm] = useState(() => buildInitialComplaint(qrInstitutionSlug, qrSource));
  const [refreshToken, setRefreshToken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [contextError, setContextError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecorderError, setVoiceRecorderError] = useState('');
  const [caseNotes, setCaseNotes] = useState({});
  const [actingComplaintId, setActingComplaintId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeAudioStreamRef = useRef(null);
  const recordingStartedAtRef = useRef(0);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetchCitizenDashboard()
      .then((payload) => {
        if (isActive) {
          setDashboard(payload);
          setHasError(false);
        }
      })
      .catch(() => {
        if (isActive) setHasError(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [refreshToken]);

  useEffect(() => {
    if (filtersInitialized) return;
    setFilters({
      province: user?.location?.province ?? '',
      district: user?.location?.district ?? '',
      sector: user?.location?.sector ?? '',
      cell: user?.location?.cell ?? '',
      village: user?.location?.village ?? '',
    });
    setFiltersInitialized(true);
  }, [filtersInitialized, user?.location]);

  useEffect(() => {
    if (!filtersInitialized) return;
    let isActive = true;
    setContextLoading(true);
    setContextError('');
    fetchCitizenContext({ ...filters, institution: qrInstitutionSlug })
      .then((payload) => {
        if (isActive) setContext(payload);
      })
      .catch((error) => {
        if (isActive) {
          setContext(null);
          setContextError(error.message);
        }
      })
      .finally(() => {
        if (isActive) setContextLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [filtersInitialized, filters, qrInstitutionSlug, refreshToken]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }

      activeAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const allInstitutions = useMemo(() => {
    const items = [...(context?.institutionDirectory ?? [])];
    if (context?.selectedInstitution && !items.some((entry) => entry.institutionSlug === context.selectedInstitution.institutionSlug)) {
      items.unshift(context.selectedInstitution);
    }
    return items;
  }, [context?.institutionDirectory, context?.selectedInstitution]);

  const selectedInstitution = useMemo(
    () => {
      if (complaintForm.sourceInstitutionSlug) {
        return (
          allInstitutions.find((entry) => entry.institutionSlug === complaintForm.sourceInstitutionSlug) ??
          null
        );
      }

      return qrInstitutionSlug ? null : context?.selectedInstitution ?? null;
    },
    [allInstitutions, complaintForm.sourceInstitutionSlug, context?.selectedInstitution, qrInstitutionSlug],
  );

  const complaintTargets = useMemo(() => context?.complaintTargetLeaders ?? [], [context?.complaintTargetLeaders]);
  const accusedLeaderOptions = useMemo(() => context?.accusedLeaderOptions ?? [], [context?.accusedLeaderOptions]);
  const selectedAccusedLeaders = accusedLeaderOptions.filter((entry) =>
    complaintForm.accusedLeaderEmployeeIds.includes(entry.leader.employeeId),
  );
  const corruptionReviewLevel =
    complaintForm.issueType === 'corruption_issue' && selectedAccusedLeaders.length > 0
      ? LEVEL_FLOW[
          Math.max(...selectedAccusedLeaders.map((entry) => LEVEL_FLOW.indexOf(entry.level)).filter((value) => value >= 0)) + 1
        ] ?? 'national'
      : '';
  const selectedInstitutionServices = useMemo(() => selectedInstitution?.services ?? [], [selectedInstitution?.services]);
  const selectedTarget =
    complaintTargets.find((entry) => entry.leader.employeeId === complaintForm.targetLeaderEmployeeId) ?? null;
  const corruptionReviewTarget =
    complaintTargets.find((entry) => entry.level === corruptionReviewLevel) ?? null;
  const options = context?.options ?? {
    provinces: [],
    districts: [],
    sectors: [],
    cells: [],
    villages: [],
  };
  const citizenCases = dashboard?.cases ?? [];
  const citizenTimeline = dashboard?.timeline ?? [];
  const citizenAwareness = dashboard?.awareness ?? [];
  const profile = dashboard?.profile ?? {
    citizenId: user?.citizenId ?? '',
    fullName: user?.fullName ?? 'Citizen',
    nationalId: user?.nationalId ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    location: user?.location ?? {},
  };

  useEffect(() => {
    setComplaintForm((current) => {
      const next = { ...current };
      let changed = false;

      if (current.submittedVia !== qrSource) {
        next.submittedVia = qrSource;
        changed = true;
      }

      if (qrInstitutionSlug && current.sourceInstitutionSlug !== qrInstitutionSlug) {
        next.sourceInstitutionSlug = qrInstitutionSlug;
        changed = true;
      }

      if (
        current.sourceInstitutionSlug &&
        selectedInstitutionServices.length > 0 &&
        !selectedInstitutionServices.some((service) => service.name === current.serviceName)
      ) {
        next.serviceName = selectedInstitutionServices[0].name;
        changed = true;
      }

      if (
        current.issueType === 'service_issue' &&
        !complaintTargets.some((entry) => entry.leader.employeeId === current.targetLeaderEmployeeId)
      ) {
        next.targetLeaderEmployeeId =
          selectedInstitution?.helpLeader?.employeeId ?? complaintTargets[0]?.leader.employeeId ?? '';
        changed = true;
      }

      const validCategories = ISSUE_CATEGORY_OPTIONS[current.issueType];
      if (!validCategories.includes(current.category)) {
        next.category = validCategories[0];
        changed = true;
      }

      const validAccusedIds = new Set(accusedLeaderOptions.map((entry) => entry.leader.employeeId));
      const filteredAccused = current.accusedLeaderEmployeeIds.filter((value) => validAccusedIds.has(value));
      if (filteredAccused.length !== current.accusedLeaderEmployeeIds.length) {
        next.accusedLeaderEmployeeIds = filteredAccused;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [
    accusedLeaderOptions,
    complaintTargets,
    qrInstitutionSlug,
    qrSource,
    selectedInstitution?.helpLeader?.employeeId,
    selectedInstitutionServices,
  ]);

  const updateFilter = (field, value) => {
    setFilters((current) => resetFilterChildren({ ...current, [field]: value }, field));
  };

  const updateComplaintField = (field, value) => {
    setComplaintForm((current) => ({ ...current, [field]: value }));
  };

  const stopActiveAudioStream = () => {
    activeAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    activeAudioStreamRef.current = null;
  };

  const toggleAccusedLeader = (employeeId) => {
    setComplaintForm((current) => {
      const exists = current.accusedLeaderEmployeeIds.includes(employeeId);
      return {
        ...current,
        accusedLeaderEmployeeIds: exists
          ? current.accusedLeaderEmployeeIds.filter((value) => value !== employeeId)
          : [...current.accusedLeaderEmployeeIds, employeeId].slice(0, 5),
      };
    });
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setSubmitError('');
    if (!file.type.startsWith('image/')) {
      setSubmitError('Please choose an image file for issue evidence.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSubmitError('Image evidence must be 2 MB or smaller.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setComplaintForm((current) => ({
        ...current,
        evidenceImage: {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        },
      }));
    } catch (error) {
      setSubmitError(error.message);
    }
  };

  const clearEvidenceImage = () => {
    setComplaintForm((current) => ({ ...current, evidenceImage: null }));
  };

  const startVoiceRecording = async () => {
    setSubmitError('');
    setVoiceRecorderError('');

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setVoiceRecorderError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType =
        typeof MediaRecorder.isTypeSupported === 'function' &&
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
      const recorder = new MediaRecorder(
        stream,
        preferredMimeType ? { mimeType: preferredMimeType } : undefined,
      );

      audioChunksRef.current = [];
      activeAudioStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setComplaintForm((current) => ({ ...current, voiceNote: null }));

      recorder.ondataavailable = (recordingEvent) => {
        if (recordingEvent.data.size > 0) {
          audioChunksRef.current.push(recordingEvent.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecordingVoice(false);
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
        );
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        stopActiveAudioStream();
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          setVoiceRecorderError('No voice note was captured. Please try again.');
          return;
        }

        if (audioBlob.size > MAX_AUDIO_SIZE_BYTES) {
          setVoiceRecorderError('Voice note must be 4 MB or smaller.');
          return;
        }

        if (durationSeconds > MAX_AUDIO_DURATION_SECONDS) {
          setVoiceRecorderError('Voice note must be 3 minutes or shorter.');
          return;
        }

        try {
          const dataUrl = await readFileAsDataUrl(audioBlob);
          setComplaintForm((current) => ({
            ...current,
            voiceNote: {
              name: `voice-note-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
              type: audioBlob.type || 'audio/webm',
              size: audioBlob.size,
              durationSeconds,
              dataUrl,
            },
          }));
        } catch (error) {
          setVoiceRecorderError(error.message);
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
    } catch {
      stopActiveAudioStream();
      setVoiceRecorderError('Microphone access was denied or unavailable.');
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecordingVoice(false);
  };

  const clearVoiceNote = () => {
    setComplaintForm((current) => ({ ...current, voiceNote: null }));
    setVoiceRecorderError('');
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);

    try {
      const response = await submitCitizenComplaint({
        issueType: complaintForm.issueType,
        category: complaintForm.category,
        reportingMode: complaintForm.reportingMode,
        submittedVia: complaintForm.submittedVia,
        sourceInstitutionSlug: complaintForm.sourceInstitutionSlug || undefined,
        serviceName: complaintForm.serviceName || undefined,
        evidenceImage: complaintForm.evidenceImage || undefined,
        voiceNote: complaintForm.voiceNote || undefined,
        targetLeaderEmployeeId:
          complaintForm.issueType === 'service_issue'
            ? complaintForm.targetLeaderEmployeeId || undefined
            : undefined,
        accusedLeaderEmployeeIds:
          complaintForm.issueType === 'corruption_issue'
            ? complaintForm.accusedLeaderEmployeeIds
            : undefined,
        message: complaintForm.message,
      });

      setSubmitSuccess(
        `${response.item.id} submitted to ${formatLevel(response.item.currentLevel)} review.`,
      );
      setVoiceRecorderError('');
      setComplaintForm((current) => ({
        ...buildInitialComplaint(current.sourceInstitutionSlug, current.submittedVia),
        sourceInstitutionSlug: current.sourceInstitutionSlug,
        serviceName:
          current.sourceInstitutionSlug && selectedInstitutionServices.length > 0
            ? selectedInstitutionServices[0].name
            : '',
        targetLeaderEmployeeId:
          selectedInstitution?.helpLeader?.employeeId ?? complaintTargets[0]?.leader.employeeId ?? '',
      }));
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaseAction = async (complaintId, action) => {
    setActionMessage('');
    setActionError('');
    setActingComplaintId(complaintId);

    try {
      const note = caseNotes[complaintId]?.trim() ?? '';
      const result =
        action === 'accept'
          ? await acceptCitizenFeedback(complaintId, { note })
          : await escalateCitizenComplaint(complaintId, { note });

      setActionMessage(result.message);
      setRefreshToken((current) => current + 1);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActingComplaintId('');
    }
  };

  const submitSection = (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <SectionCard title="Submit complaint" subtitle="Choose whether this is a service problem or a corruption report.">
        <form className="space-y-5" onSubmit={submitComplaint}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Issue type</span>
              <select
                value={complaintForm.issueType}
                onChange={(event) => {
                  const nextIssueType = event.target.value;
                  setComplaintForm((current) => ({
                    ...current,
                    issueType: nextIssueType,
                    category: ISSUE_CATEGORY_OPTIONS[nextIssueType][0],
                    targetLeaderEmployeeId:
                      nextIssueType === 'service_issue'
                        ? selectedInstitution?.helpLeader?.employeeId ??
                          complaintTargets[0]?.leader.employeeId ??
                          ''
                        : '',
                    accusedLeaderEmployeeIds: [],
                  }));
                }}
                className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
              >
                <option value="service_issue">Service issue</option>
                <option value="corruption_issue">Corruption issue</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Reporting mode</span>
              <select
                value={complaintForm.reportingMode}
                onChange={(event) => updateComplaintField('reportingMode', event.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
              >
                <option value="verified">Verified</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Issue category</span>
              <select
                value={complaintForm.category}
                onChange={(event) => updateComplaintField('category', event.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
              >
                {ISSUE_CATEGORY_OPTIONS[complaintForm.issueType].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Institution source</span>
              <select
                value={complaintForm.sourceInstitutionSlug}
                onChange={(event) =>
                  setComplaintForm((current) => ({
                    ...current,
                    sourceInstitutionSlug: event.target.value,
                    serviceName: '',
                  }))
                }
                className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
              >
                <option value="">General leadership complaint</option>
                {allInstitutions.map((item) => (
                  <option key={item.institutionSlug} value={item.institutionSlug}>
                    {item.institutionName} ({formatLevel(item.level)})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedInstitution ? (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                <p className="font-semibold text-ink">{selectedInstitution.institutionName}</p>
                <p className="mt-1">
                  {formatLevel(selectedInstitution.level)} | {formatLocation(selectedInstitution.location)}
                </p>
                <p className="mt-1">Source: {complaintForm.submittedVia === 'qr' ? 'QR code' : 'Dashboard'}</p>
              </article>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Related service</span>
                <select
                  value={complaintForm.serviceName}
                  onChange={(event) => updateComplaintField('serviceName', event.target.value)}
                  className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                >
                  <option value="">Select service if relevant</option>
                  {selectedInstitutionServices.map((service) => (
                    <option key={service.name} value={service.name}>
                      {service.name} ({service.feeType === 'paid' ? formatCurrency(service.officialFeeRwf) : 'Free'})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          {complaintForm.issueType === 'service_issue' ? (
            <div className="space-y-3 rounded-2xl bg-mist p-4">
              <p className="text-sm font-semibold text-ink">Who should handle this service issue first?</p>
              <select
                value={complaintForm.targetLeaderEmployeeId}
                onChange={(event) => updateComplaintField('targetLeaderEmployeeId', event.target.value)}
                className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-tide"
                required
              >
                <option value="">Select receiving leader</option>
                {complaintTargets.map((item) => (
                  <option key={item.leader.employeeId} value={item.leader.employeeId}>
                    {item.leader.fullName} ({formatLevel(item.level)} - {item.institutionName})
                  </option>
                ))}
              </select>
              {selectedTarget ? (
                <p className="text-sm text-slate">
                  Routed to <span className="font-semibold text-ink">{selectedTarget.leader.fullName}</span> at the{' '}
                  <span className="font-semibold text-ink">{formatLevel(selectedTarget.level)}</span> level.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl bg-mist p-4">
              <p className="text-sm font-semibold text-ink">
                Choose the accused leader. The system routes the case to the next higher level.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {accusedLeaderOptions.map((item) => {
                  const isSelected = complaintForm.accusedLeaderEmployeeIds.includes(item.leader.employeeId);
                  return (
                    <button
                      key={item.leader.employeeId}
                      type="button"
                      onClick={() => toggleAccusedLeader(item.leader.employeeId)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                        isSelected ? 'border-ink bg-white text-ink' : 'border-transparent bg-white/70 text-slate'
                      }`}
                    >
                      <p className="font-semibold text-ink">{item.leader.fullName}</p>
                      <p className="mt-1">
                        {item.leader.positionTitle} | {item.institutionName}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-tide">
                        {formatLevel(item.level)}
                      </p>
                    </button>
                  );
                })}
              </div>
              {corruptionReviewLevel ? (
                <div className="rounded-2xl border border-gold/30 bg-white px-4 py-3 text-sm text-slate">
                  Routed to <span className="font-semibold text-ink">{formatLevel(corruptionReviewLevel)}</span>{' '}
                  review
                  {corruptionReviewTarget ? (
                    <>
                      {' '}
                      with <span className="font-semibold text-ink">{corruptionReviewTarget.leader.fullName}</span>.
                    </>
                  ) : (
                    '.'
                  )}
                </div>
              ) : null}
            </div>
          )}

          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink">Issue details</span>
            <textarea
              rows={7}
              value={complaintForm.message}
              onChange={(event) => updateComplaintField('message', event.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
              placeholder="Write what happened, where it happened, and which leader or office was involved."
              required
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm font-semibold text-ink">Optional image evidence</p>
              <p className="mt-1 text-sm text-slate">
                Upload a photo showing the issue, office condition, receipt, or any useful evidence.
              </p>
              <label className="mt-4 inline-flex cursor-pointer rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelection}
                  className="hidden"
                />
              </label>
              {complaintForm.evidenceImage ? (
                <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-3 text-sm text-slate">
                  <p className="font-semibold text-ink">{complaintForm.evidenceImage.name}</p>
                  <p className="mt-1">{formatFileSize(complaintForm.evidenceImage.size)}</p>
                  <button
                    type="button"
                    onClick={clearEvidenceImage}
                    className="mt-3 rounded-full border border-ink/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink"
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm font-semibold text-ink">Optional voice note</p>
              <p className="mt-1 text-sm text-slate">
                Record up to 3 minutes so the reviewing leader can hear your explanation clearly.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {!isRecordingVoice ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Record voice
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="rounded-full bg-clay px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Stop recording
                  </button>
                )}
                {complaintForm.voiceNote ? (
                  <button
                    type="button"
                    onClick={clearVoiceNote}
                    className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ink"
                  >
                    Remove voice
                  </button>
                ) : null}
              </div>
              {isRecordingVoice ? (
                <p className="mt-3 text-sm font-semibold text-clay">Recording in progress. Speak clearly, then stop when finished.</p>
              ) : null}
              {voiceRecorderError ? (
                <p className="mt-3 text-sm text-clay">{voiceRecorderError}</p>
              ) : null}
              {complaintForm.voiceNote ? (
                <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-3 text-sm text-slate">
                  <audio controls src={complaintForm.voiceNote.dataUrl} className="w-full" />
                  <p className="mt-3 font-semibold text-ink">{complaintForm.voiceNote.name}</p>
                  <p className="mt-1">
                    {complaintForm.voiceNote.durationSeconds}s | {formatFileSize(complaintForm.voiceNote.size)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <ComplaintEvidencePanel
            image={complaintForm.evidenceImage}
            voiceNote={complaintForm.voiceNote}
            title="Evidence that will be sent with this complaint"
          />

          {submitError ? (
            <p className="rounded-xl border border-clay/25 bg-clay/10 px-3 py-2 text-sm text-clay">{submitError}</p>
          ) : null}
          {submitSuccess ? (
            <p className="rounded-xl border border-pine/25 bg-pine/10 px-3 py-2 text-sm text-pine">{submitSuccess}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isRecordingVoice}
            className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : isRecordingVoice ? 'Stop recording first' : 'Submit complaint'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Selected institution and QR support" subtitle="Service office details, leader support, and QR-linked reporting source.">
        <div className="space-y-4 text-sm text-slate">
          {selectedInstitution ? (
            <>
              <article className="rounded-2xl bg-mist px-4 py-4">
                <p className="font-semibold text-ink">{selectedInstitution.institutionName}</p>
                <p className="mt-1">
                  {formatLevel(selectedInstitution.level)} | {formatLocation(selectedInstitution.location)}
                </p>
                <p className="mt-1">Office: {selectedInstitution.officeAddress || 'Not available'}</p>
                <p className="mt-1">
                  Contact: {selectedInstitution.officialPhone || 'N/A'} | {selectedInstitution.officialEmail || 'N/A'}
                </p>
              </article>
              {selectedInstitution.helpLeader ? (
                <article className="rounded-2xl bg-mist px-4 py-4">
                  <p className="font-semibold text-ink">Leader who can help</p>
                  <p className="mt-1">
                    {selectedInstitution.helpLeader.fullName} ({selectedInstitution.helpLeader.positionTitle})
                  </p>
                </article>
              ) : null}
              {selectedInstitution.institutionQrCodeDataUrl ? (
                <article className="rounded-2xl bg-mist px-4 py-4">
                  <p className="font-semibold text-ink">Institution info QR</p>
                  <img
                    src={selectedInstitution.institutionQrCodeDataUrl}
                    alt={`${selectedInstitution.institutionName} QR code`}
                    className="mt-3 h-40 w-40 rounded-2xl bg-white p-3"
                  />
                </article>
              ) : null}
            </>
          ) : (
            <article className="rounded-2xl bg-mist px-4 py-4">
              Choose an institution if this complaint started from a service office or QR code.
            </article>
          )}
          <article className="rounded-2xl border border-gold/30 bg-gold/15 px-4 py-4 text-ink">
            If a village leader is accused of corruption, the case goes to cell review first. If no response comes within 3 working days, the complaint escalates automatically.
          </article>
        </div>
      </SectionCard>
    </div>
  );

  const servicesSection = (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <SectionCard title="Services in your visible governance area" subtitle="Official fees, free services, and leaders who can help.">
        <div className="grid gap-4 md:grid-cols-2">
          {(context?.services ?? []).length > 0 ? (
            context.services.map((item, index) => (
              <article key={`${item.institutionId}-${item.name}-${index}`} className="rounded-2xl bg-mist p-4">
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-sm text-slate">
                  {item.institutionName} ({formatLevel(item.level)})
                </p>
                <p className="mt-2 text-sm text-slate">{item.description || 'No service description available yet.'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                  <span className="rounded-full bg-white px-3 py-2 text-tide">
                    {item.feeType === 'paid' ? `Paid: ${formatCurrency(item.officialFeeRwf)}` : 'Free service'}
                  </span>
                  <span className="rounded-full bg-white px-3 py-2 text-ink">{formatLocation(item.location)}</span>
                </div>
                <p className="mt-3 text-sm text-slate">{item.accessNote}</p>
                {item.helpLeader ? (
                  <p className="mt-3 text-sm text-slate">
                    Help leader: <span className="font-semibold text-ink">{item.helpLeader.fullName}</span>{' '}
                    ({item.helpLeader.positionTitle})
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to={`/dashboard/citizen/submit?institution=${item.institutionSlug}&source=qr`}
                    className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Report issue
                  </Link>
                  {item.institutionQrCodeDataUrl ? (
                    <span className="rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-tide">
                      QR available
                    </span>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-2xl bg-mist p-4 text-sm text-slate">
              No services found for the selected location.
            </article>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Institution directory" subtitle="Visible offices, contacts, and the leader assigned to support citizens.">
        <div className="space-y-3">
          {allInstitutions.length > 0 ? (
            allInstitutions.map((item) => (
              <article key={item.institutionId} className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
                <p className="font-semibold text-ink">{item.institutionName}</p>
                <p className="mt-1">
                  {formatLevel(item.level)} | {formatLocation(item.location)}
                </p>
                <p className="mt-1">Office: {item.officeAddress || 'Not available'}</p>
                <p className="mt-1">
                  Contact: {item.officialPhone || 'N/A'} | {item.officialEmail || 'N/A'}
                </p>
                <p className="mt-1">Services listed: {item.servicesCount}</p>
                {item.helpLeader ? (
                  <p className="mt-1">
                    Leader: {item.helpLeader.fullName} ({item.helpLeader.positionTitle})
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <article className="rounded-2xl bg-mist px-4 py-4 text-sm text-slate">
              No institutions found for this location filter.
            </article>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const leadersSection = (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <SectionCard title="Leadership chain" subtitle="Village, cell, sector, district, and province leadership visible to this citizen.">
        <div className="grid gap-4 md:grid-cols-2">
          {(context?.leaderChain ?? []).length > 0 ? (
            context.leaderChain.map((entry) => (
              <article key={`${entry.level}-${entry.institutionId}`} className="rounded-2xl bg-mist p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">{formatLevel(entry.level)}</p>
                <p className="mt-1 font-semibold text-ink">{entry.institutionName}</p>
                {entry.leader ? (
                  <>
                    <p className="mt-3 text-sm font-semibold text-ink">
                      {entry.leader.fullName} ({entry.leader.positionTitle})
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      Responsibility: {entry.leader.description || entry.leader.reportsTo || 'Leadership and service oversight.'}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      Contact: {entry.leader.phone || 'N/A'} | {entry.leader.email || 'N/A'}
                    </p>
                    <p className="mt-1 text-sm text-slate">Office: {entry.officeAddress || 'Not available'}</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate">Leader information is not available yet.</p>
                )}
              </article>
            ))
          ) : (
            <article className="rounded-2xl bg-mist p-4 text-sm text-slate">
              No leaders found for the selected location.
            </article>
          )}
        </div>
      </SectionCard>

      <SectionCard title="How complaints move upward" subtitle="The next review office changes automatically depending on who is accused or who fails to respond.">
        <div className="space-y-3 text-sm text-slate">
          {[
            'Village leader corruption goes to cell review.',
            'Cell leader corruption or missed response goes to sector review.',
            'Sector-level failure goes to district review.',
            'District-level failure goes to province review.',
            'Province-level failure goes to national oversight review.',
          ].map((item) => (
            <article key={item} className="rounded-2xl bg-mist px-4 py-3">
              {item}
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const overviewSection = (
    <>
      {actionError ? (
        <div className="mt-8 rounded-2xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay">{actionError}</div>
      ) : null}
      {actionMessage ? (
        <div className="mt-8 rounded-2xl border border-pine/25 bg-pine/10 px-4 py-3 text-sm text-pine">{actionMessage}</div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
        <SectionCard title="My complaints" subtitle="Every complaint keeps its assigned level, feedback, and escalation path visible.">
          <div className="space-y-4">
            {citizenCases.length > 0 ? (
              citizenCases.map((item) => (
                <article key={item.id} className="rounded-2xl bg-mist p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-black text-ink">{item.id}</p>
                      <p className="mt-1 text-sm text-slate">
                        {item.category} | {item.issueType === 'corruption_issue' ? 'Corruption issue' : 'Service issue'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={item.status} />
                      <span className="rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-tide">
                        {formatLevel(item.currentLevel)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate md:grid-cols-2">
                    <p>Assigned reviewer: {item.assignedOfficer}</p>
                    <p>Deadline: {formatDateTime(item.deadlineAt)}</p>
                    <p>Reporting mode: {formatLevel(item.reportingMode)}</p>
                    <p>Submitted via: {item.submittedVia === 'qr' ? 'QR link' : 'Dashboard'}</p>
                    <p>Submitted: {formatDateTime(item.submittedAt)}</p>
                    <p>Last update: {formatDateTime(item.updatedAt)}</p>
                  </div>

                  <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate">{item.message}</p>

                  {item.sourceInstitution ? (
                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate">
                      <p className="font-semibold text-ink">{item.sourceInstitution.institutionName}</p>
                      <p className="mt-1">{item.sourceInstitution.serviceName || 'General institution complaint'}</p>
                    </div>
                  ) : null}

                  {item.accusedLeaders.length > 0 ? (
                    <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate">
                      <p className="font-semibold text-ink">Accused leaders</p>
                      <p className="mt-1">
                        {item.accusedLeaders.map((entry) => `${entry.leaderName} (${formatLevel(entry.level)})`).join(', ')}
                      </p>
                    </div>
                  ) : null}

                  <ComplaintEvidencePanel
                    image={item.evidenceImage}
                    voiceNote={item.voiceNote}
                    title="Evidence submitted with this complaint"
                  />

                  {item.response ? (
                    <div className="mt-3 rounded-2xl border border-pine/20 bg-pine/10 px-4 py-3 text-sm text-slate">
                      <p className="font-semibold text-ink">Latest official feedback</p>
                      <p className="mt-1">
                        {item.response.respondedByName} | {formatLevel(item.response.level)} | {formatDateTime(item.response.respondedAt)}
                      </p>
                      {item.response.actionTaken ? (
                        <p className="mt-1 font-semibold text-ink">Action: {item.response.actionTaken}</p>
                      ) : null}
                      <p className="mt-2 leading-6">{item.response.message}</p>
                    </div>
                  ) : null}

                  {item.canAcceptFeedback || item.canEscalate ? (
                    <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-4">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-ink">Citizen note</span>
                        <textarea
                          rows={3}
                          value={caseNotes[item.id] ?? ''}
                          onChange={(event) =>
                            setCaseNotes((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm outline-none focus:border-tide"
                          placeholder="Write why you accept this feedback or why the next level should review it."
                        />
                      </label>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {item.canAcceptFeedback ? (
                          <button
                            type="button"
                            onClick={() => handleCaseAction(item.id, 'accept')}
                            disabled={actingComplaintId === item.id}
                            className="rounded-full bg-pine px-4 py-2 text-sm font-bold text-white disabled:opacity-70"
                          >
                            {actingComplaintId === item.id ? 'Saving...' : 'Accept feedback'}
                          </button>
                        ) : null}
                        {item.canEscalate ? (
                          <button
                            type="button"
                            onClick={() => handleCaseAction(item.id, 'escalate')}
                            disabled={actingComplaintId === item.id}
                            className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-bold text-ink disabled:opacity-70"
                          >
                            {actingComplaintId === item.id ? 'Escalating...' : `Escalate to ${formatLevel(item.nextEscalationLevel)}`}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <article className="rounded-2xl bg-mist p-5 text-sm text-slate">
                You have not submitted any complaint yet. Use the submit page to report a service issue or corruption case.
              </article>
            )}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Recent timeline" subtitle="Latest visible updates on your complaints.">
            <div className="space-y-3">
              {citizenTimeline.length > 0 ? (
                citizenTimeline.map((item) => (
                  <article key={`${item.title}-${item.time}`} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1">{item.detail}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-tide">{item.time}</p>
                  </article>
                ))
              ) : (
                <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                  Complaint updates will appear here once you submit your first case.
                </article>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Citizen guidance" subtitle="What this dashboard keeps visible for you at every step.">
            <div className="space-y-3">
              {citizenAwareness.map((item) => (
                <article key={item.title} className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="mt-1">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Loading citizen dashboard"
            description="Preparing your profile, services, leaders, and complaint tracking workspace."
          />
        </section>
      </div>
    );
  }

  if (hasError || !dashboard) {
    return (
      <div className="bg-mist">
        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <DashboardState
            title="Citizen dashboard unavailable"
            description="We could not fetch your citizen data. Please confirm the API server is running and try again."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="bg-mist">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-tide">Citizen Dashboard</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-tight text-ink">
              {VIEW_MODES[mode] ?? VIEW_MODES.overview}
            </h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate">
              Citizens can see leaders from village to province, compare official services and fees,
              report service gaps or corruption, and track every response and escalation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ModeLink active={mode === 'overview'} to="/dashboard/citizen">
              Overview
            </ModeLink>
            <ModeLink active={mode === 'submit'} to="/dashboard/citizen/submit">
              Submit issue
            </ModeLink>
            <ModeLink active={mode === 'services'} to="/dashboard/citizen/services">
              Services
            </ModeLink>
            <ModeLink active={mode === 'leaders'} to="/dashboard/citizen/leaders">
              Leaders
            </ModeLink>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} note={item.note} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Citizen identity and location" subtitle="This information follows verified reports for internal accountability.">
            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Citizen</p>
                <p className="mt-1 font-semibold text-ink">{profile.fullName}</p>
                <p className="mt-1">Citizen ID: {profile.citizenId || 'Pending registration ID'}</p>
                <p className="mt-1">National ID: {profile.nationalId || 'Not available'}</p>
              </article>
              <article className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-tide">Contact</p>
                <p className="mt-1">Phone: {profile.phone || 'Not available'}</p>
                <p className="mt-1">Email: {profile.email || 'Not available'}</p>
                <p className="mt-1">Location: {formatLocation(profile.location) || 'Location not available'}</p>
              </article>
            </div>
          </SectionCard>

          <SectionCard title="Complaint routing rules" subtitle="How service and corruption reports move across the governance chain.">
            <div className="space-y-3 text-sm text-slate">
              <article className="rounded-2xl bg-mist px-4 py-3">
                {context?.complaintRoutingGuide?.serviceIssue ??
                  'Service issues go to the leader who should respond first.'}
              </article>
              <article className="rounded-2xl bg-mist px-4 py-3">
                {context?.complaintRoutingGuide?.corruptionIssue ??
                  'Corruption reports go to the next higher level.'}
              </article>
              <article className="rounded-2xl bg-mist px-4 py-3">
                {context?.complaintRoutingGuide?.escalationWindow ??
                  'Every level has 3 working days to respond.'}
              </article>
              {qrSource === 'qr' && context?.selectedInstitution ? (
                <article className="rounded-2xl border border-gold/30 bg-gold/20 px-4 py-3 font-semibold text-ink">
                  QR report detected for {context.selectedInstitution.institutionName}. The report form is prefilled for that institution.
                </article>
              ) : null}
            </div>
          </SectionCard>
        </div>

        <div className="mt-8 rounded-[1.8rem] border border-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-tide">Location filter</p>
          <p className="mt-2 text-sm text-slate">
            Filter your leadership chain and local institution services from province down to village.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <select
              value={filters.province}
              onChange={(event) => updateFilter('province', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select province</option>
              {options.provinces.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.district}
              onChange={(event) => updateFilter('district', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select district</option>
              {options.districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.sector}
              onChange={(event) => updateFilter('sector', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select sector</option>
              {options.sectors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.cell}
              onChange={(event) => updateFilter('cell', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select cell</option>
              {options.cells.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={filters.village}
              onChange={(event) => updateFilter('village', event.target.value)}
              className="rounded-xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-tide"
            >
              <option value="">Select village</option>
              {options.villages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          {contextLoading ? <p className="mt-3 text-sm text-slate">Loading local leaders and institutions...</p> : null}
          {contextError ? <p className="mt-3 text-sm text-clay">{contextError}</p> : null}
        </div>

        {mode === 'submit' ? submitSection : null}
        {mode === 'services' ? servicesSection : null}
        {mode === 'leaders' ? leadersSection : null}
        {mode === 'overview' ? overviewSection : null}
      </section>
    </div>
  );
}

export default CitizenDashboardPage;

import { Router } from 'express';
import { z } from 'zod';
import { complaints } from '../data/mockData.js';

const router = Router();

const createComplaintSchema = z.object({
  category: z.string().min(3),
  institutionId: z.number().int().positive(),
  message: z.string().min(20),
  reportingMode: z.enum(['anonymous', 'verified']),
  citizenReference: z.string().optional(),
});

router.get('/', (_request, response) => {
  response.json({
    items: complaints,
  });
});

router.get('/:id', (request, response) => {
  const complaint = complaints.find((item) => item.id === request.params.id);

  if (!complaint) {
    return response.status(404).json({
      message: 'Complaint not found.',
    });
  }

  return response.json({
    item: complaint,
  });
});

router.post('/', (request, response) => {
  const validationResult = createComplaintSchema.safeParse(request.body);

  if (!validationResult.success) {
    return response.status(400).json({
      message: 'Invalid complaint payload.',
      errors: validationResult.error.flatten(),
    });
  }

  const nextComplaint = {
    id: `CF-${new Date().getFullYear()}-${String(complaints.length + 412).padStart(4, '0')}`,
    category: validationResult.data.category,
    institutionId: validationResult.data.institutionId,
    message: validationResult.data.message,
    reportingMode: validationResult.data.reportingMode,
    citizenReference:
      validationResult.data.citizenReference ??
      `CID-${String(Math.floor(1000 + Math.random() * 9000))}`,
    status: 'submitted',
    currentLevel: 'cell',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedOfficerId: null,
  };

  complaints.unshift(nextComplaint);

  return response.status(201).json({
    message: 'Complaint received successfully.',
    item: nextComplaint,
  });
});

export default router;

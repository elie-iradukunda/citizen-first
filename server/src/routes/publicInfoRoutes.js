import { Router } from 'express';
import {
  assistantQuestionExamples,
  emergencyContacts,
  issueRoutingGuide,
  publicServices,
} from '../data/publicServiceData.js';

const router = Router();

router.get('/services', (_request, response) => {
  response.json({
    items: publicServices,
  });
});

router.get('/emergency-contacts', (_request, response) => {
  response.json({
    items: emergencyContacts,
  });
});

router.get('/routing-guide', (_request, response) => {
  response.json({
    items: issueRoutingGuide,
  });
});

router.get('/assistant-questions', (_request, response) => {
  response.json({
    items: assistantQuestionExamples,
  });
});

export default router;

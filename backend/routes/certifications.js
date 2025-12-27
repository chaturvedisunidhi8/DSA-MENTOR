const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllCertifications,
  getCertificationDetails,
  purchaseCertification,
  startCertification,
  submitCertificationProblem,
  completeCertification,
  getMyCertifications,
  getCertificate
} = require('../controllers/certificationController');

// Public routes
router.get('/', getAllCertifications);
router.get('/certificate/:certificateId', getCertificate);

// Protected routes
router.get('/my-attempts', auth, getMyCertifications);
router.get('/:slug', getCertificationDetails);
router.post('/:slug/purchase', auth, purchaseCertification);
router.post('/:slug/start', auth, startCertification);
router.post('/attempt/:attemptId/submit', auth, submitCertificationProblem);
router.post('/attempt/:attemptId/complete', auth, completeCertification);

module.exports = router;

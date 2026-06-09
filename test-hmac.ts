import { callWorkerForPdf } from './apps/web/src/lib/worker';

process.env.WORKER_URL = "https://metamorfit-worker-alpha.metamorfitnet.workers.dev";
process.env.HMAC_SECRET = "meta_alpha_sec_a7c2e9f1b3d8k9m_42891_abc";

const payload = {
  fullName: "Test User",
  email: "test@example.com",
  identity: {
    goal: "Fat Loss",
    bodyType: "Endomorph"
  },
  metabolicProfile: {
    proteinGrams: 150,
    carbsGrams: 100,
    fatsGrams: 50
  },
  meals: [],
  explanation: "Test explanation"
};

console.log("Testing HMAC Worker endpoint...");

callWorkerForPdf(payload)
  .then(jobId => console.log("SUCCESS! JobId:", jobId))
  .catch(err => console.error("FAILURE:", err.message));

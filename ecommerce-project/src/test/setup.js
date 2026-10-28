import '@testing-library/jest-dom/vitest';
import axios from 'axios';

// Tests must never reach a real backend running on the dev port.
if (axios?.defaults) {
  axios.defaults.adapter = () => Promise.reject(new Error('Network disabled in tests'));
}

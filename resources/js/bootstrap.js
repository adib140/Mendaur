import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set authorization token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

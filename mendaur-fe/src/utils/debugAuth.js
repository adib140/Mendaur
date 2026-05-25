// Debug auth status (disabled for production)
export const debugAuth = () => {
  return {
    hasToken: !!localStorage.getItem('token'),
    hasUser: !!localStorage.getItem('user'),
  };
};

if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth;
}

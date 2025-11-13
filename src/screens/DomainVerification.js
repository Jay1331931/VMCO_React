// src/components/AppleDomainFile.js
import { useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export default function AppleDomainFile() {
  useEffect(() => {
    // Redirect to a different server that serves the plain text
    window.location.href = `${API_BASE_URL}/.well-known/apple-developer-merchantid-domain-association`;
  }, []);

  return null;
}
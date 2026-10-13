import { useState, useEffect } from 'react';
import { tenantApi } from '../api/tenant.api';

export const DEFAULT_SCHOOL_NAME = 'Trường Mẫu Giáo Hướng Dương';
export const DEFAULT_LOGO_URL = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80';

export interface SchoolBranding {
  name: string;
  logoUrl: string | null;
}

/**
 * Hook to retrieve and subscribe to school branding (school name & logo).
 * Automatically updates when branding is changed in SchoolSettingsPage
 * via localStorage and the custom 'school-branding-updated' event.
 */
export const useSchoolBranding = (): SchoolBranding => {
  const [branding, setBranding] = useState<SchoolBranding>(() => {
    return {
      name: localStorage.getItem('school_name') || DEFAULT_SCHOOL_NAME,
      logoUrl: localStorage.getItem('school_logo') || DEFAULT_LOGO_URL,
    };
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const data = await tenantApi.getProfile();
        if (data && isMounted) {
          const logo = data.branding?.logoUrl || localStorage.getItem('school_logo') || DEFAULT_LOGO_URL;
          const name = data.name || localStorage.getItem('school_name') || DEFAULT_SCHOOL_NAME;

          setBranding({ name, logoUrl: logo });
          if (name) localStorage.setItem('school_name', name);
          if (logo) localStorage.setItem('school_logo', logo);
        }
      } catch {
        // Fallback to local storage if API is offline
      }
    };

    fetchProfile();

    const handleBrandingUpdate = () => {
      if (!isMounted) return;
      const storedName = localStorage.getItem('school_name');
      const storedLogo = localStorage.getItem('school_logo');
      setBranding({
        name: storedName || DEFAULT_SCHOOL_NAME,
        logoUrl: storedLogo || DEFAULT_LOGO_URL,
      });
    };

    window.addEventListener('school-branding-updated', handleBrandingUpdate);
    window.addEventListener('storage', handleBrandingUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('school-branding-updated', handleBrandingUpdate);
      window.removeEventListener('storage', handleBrandingUpdate);
    };
  }, []);

  return branding;
};

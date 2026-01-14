import axios from 'axios';
import router from '@/router';

// ✅ Utilisation des variables d'environnement
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
});

// ==========================================
// INTERCEPTEUR REQUEST : Ajouter le token
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Log debug en développement
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token,
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// INTERCEPTEUR RESPONSE : Gérer les erreurs
// ==========================================
api.interceptors.response.use(
  (response) => {
    // ✅ Log debug en développement
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
      });
    }

    return response;
  },
  (error) => {
    // ✅ Log debug en développement
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message,
      });
    }

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          // Token invalide ou expiré → Déconnexion
          console.warn('⚠️ Token invalide ou expiré, déconnexion...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push({ name: 'login', query: { expired: 'true' } });
          break;

        case 403:
          // Accès interdit (mauvais rôle, etc.)
          console.error('🚫 Accès interdit');
          router.push({ name: 'home' });
          break;

        case 404:
          // Ressource non trouvée
          console.error('🔍 Ressource non trouvée');
          break;

        case 422:
          // Erreur de validation (formulaire)
          console.warn('⚠️ Erreur de validation:', error.response.data);
          break;

        case 500:
        case 502:
        case 503:
          // Erreur serveur
          console.error('🔥 Erreur serveur, réessayez plus tard');
          break;

        default:
          console.error('❌ Erreur API:', error.response.data);
      }
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      console.error('📡 Pas de réponse du serveur (timeout ou réseau)');
    } else {
      // Erreur lors de la configuration de la requête
      console.error('⚙️ Erreur lors de la configuration de la requête:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
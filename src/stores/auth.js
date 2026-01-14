import { defineStore } from 'pinia';
import api from '@/services/api';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null, // Message global (ex: "Identifiants incorrects")
    validationErrors: {}, // Erreurs par champ (ex: { email: ['Invalide'] })
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isJoueur: (state) => state.user?.role === 'joueur',
    isRecruteur: (state) => state.user?.role === 'recruteur',
    userFullName: (state) => {
      if (!state.user) return '';
      return `${state.user.first_name} ${state.user.last_name}`;
    },
  },

  actions: {
    /**
     * Connexion utilisateur
     */
    async login(credentials) {
      this.loading = true;
      this.error = null;
      this.validationErrors = {};

      try {
        const response = await api.post('/login', credentials);
        this.setUserData(response.data);

        const redirectRoute = this.isJoueur 
          ? { name: 'dashboard-joueur' } 
          : { name: 'dashboard-recruteur' };
        
        router.push(redirectRoute);
        return { success: true };

      } catch (error) {
        this.handleError(error);
        return { success: false, errors: this.validationErrors };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Inscription utilisateur
     */
    async register(userData) {
      this.loading = true;
      this.error = null;
      this.validationErrors = {};

      try {
        const response = await api.post('/register', userData);
        this.setUserData(response.data);

        const redirectRoute = this.isJoueur 
          ? { name: 'dashboard-joueur' } 
          : { name: 'dashboard-recruteur' };
        
        router.push(redirectRoute);
        return { success: true };

      } catch (error) {
        this.handleError(error);
        // On renvoie l'objet complet pour que le composant puisse l'utiliser
        return { success: false, errors: this.validationErrors, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Gestion centralisée des erreurs API
     */
    handleError(error) {
      if (error.response?.status === 422) {
        // Erreur de validation Laravel
        this.validationErrors = error.response.data.errors;
        this.error = error.response.data.message || 'Veuillez vérifier les champs.';
      } else {
        // Autre erreur (401, 500...)
        this.error = error.response?.data?.message || 'Une erreur est survenue.';
      }
    },

    /**
     * Stocker les données utilisateur et token
     */
    setUserData(data) {
      this.token = data.token || data.access_token; // Supporte les deux formats
      this.user = data.user;
      
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    },

    /**
     * Récupérer les infos utilisateur depuis l'API
     */
    async fetchUser() {
      if (!this.token) return;

      try {
        const response = await api.get('/me');
        this.user = response.data;
        localStorage.setItem('user', JSON.stringify(this.user));
      } catch (error) {
        if (error.response?.status === 401) {
          this.clearAuth();
        }
      }
    },

    async logout() {
      try {
        await api.post('/logout');
      } catch (error) {
        console.error('Erreur Logout', error);
      } finally {
        this.clearAuth();
        router.push({ name: 'home' });
      }
    },

    clearAuth() {
      this.token = null;
      this.user = null;
      this.error = null;
      this.validationErrors = {};
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
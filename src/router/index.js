import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// ✅ CORRECTION : Imports avec chemins corrects
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { title: 'Accueil - ScoutMe' }
  },
  
  // ==========================================
  // ROUTES PUBLIQUES (Authentification)
  // ==========================================
  {
    path: '/role-selection',
    name: 'role-selection',
    component: () => import('@/views/auth/RoleSelection.vue'),
    meta: { 
      title: 'Choisir votre rôle - ScoutMe',
      guest: true // Accessible uniquement si non connecté
    }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/Register.vue'),
    props: route => ({ role: route.query.role }),
    meta: { 
      title: 'Inscription - ScoutMe',
      guest: true
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { 
      title: 'Connexion - ScoutMe',
      guest: true
    }
  },

  // ==========================================
  // ROUTES PUBLIQUES (Recherche)
  // ==========================================
  {
    path: '/joueurs',
    name: 'joueurs-search',
    component: () => import('@/views/public/JoueursSearch.vue'),
    meta: { title: 'Rechercher des joueurs - ScoutMe' }
  },
  {
    path: '/joueurs/:id',
    name: 'joueur-profil',
    component: () => import('@/views/public/JoueurProfil.vue'),
    props: true,
    meta: { title: 'Profil joueur - ScoutMe' }
  },
  {
    path: '/annonces',
    name: 'annonces-list',
    component: () => import('@/views/public/AnnoncesList.vue'),
    meta: { title: 'Annonces de recrutement - ScoutMe' }
  },
  {
    path: '/annonces/:id',
    name: 'annonce-detail',
    component: () => import('@/views/public/AnnonceDetail.vue'),
    props: true,
    meta: { title: 'Détail annonce - ScoutMe' }
  },

  // ==========================================
  // ROUTES PROTÉGÉES - JOUEURS
  // ==========================================
  {
    path: '/dashboard/joueur',
    name: 'dashboard-joueur',
    component: () => import('@/views/joueur/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'joueur',
      title: 'Mon Dashboard - ScoutMe'
    }
  },
  {
    path: '/mon-profil',
    name: 'mon-profil',
    component: () => import('@/views/joueur/MonProfil.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'joueur',
      title: 'Mon Profil - ScoutMe'
    }
  },
  {
    path: '/mes-videos',
    name: 'mes-videos',
    component: () => import('@/views/joueur/MesVideos.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'joueur',
      title: 'Mes Vidéos - ScoutMe'
    }
  },
  {
    path: '/mes-experiences',
    name: 'mes-experiences',
    component: () => import('@/views/joueur/MesExperiences.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'joueur',
      title: 'Mes Expériences - ScoutMe'
    }
  },
  {
    path: '/mes-candidatures',
    name: 'mes-candidatures',
    component: () => import('@/views/joueur/MesCandidatures.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'joueur',
      title: 'Mes Candidatures - ScoutMe'
    }
  },

  // ==========================================
  // ROUTES PROTÉGÉES - RECRUTEURS
  // ==========================================
  {
    path: '/dashboard/recruteur',
    name: 'dashboard-recruteur',
    component: () => import('@/views/recruteur/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'recruteur',
      title: 'Mon Dashboard - ScoutMe'
    }
  },
  {
    path: '/mes-annonces',
    name: 'mes-annonces',
    component: () => import('@/views/recruteur/MesAnnonces.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'recruteur',
      title: 'Mes Annonces - ScoutMe'
    }
  },
  {
    path: '/annonces/create',
    name: 'annonce-create',
    component: () => import('@/views/recruteur/AnnonceCreate.vue'),
    meta: { 
      requiresAuth: true,
      requiresRole: 'recruteur',
      title: 'Créer une annonce - ScoutMe'
    }
  },
  {
    path: '/annonces/:id/edit',
    name: 'annonce-edit',
    component: () => import('@/views/recruteur/AnnonceEdit.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRole: 'recruteur',
      title: 'Modifier annonce - ScoutMe'
    }
  },
  {
    path: '/annonces/:id/candidatures',
    name: 'annonce-candidatures',
    component: () => import('@/views/recruteur/AnnonceCandidatures.vue'),
    props: true,
    meta: { 
      requiresAuth: true,
      requiresRole: 'recruteur',
      title: 'Candidatures reçues - ScoutMe'
    }
  },

  // ==========================================
  // PAGES D'ERREUR
  // ==========================================
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404 - Page non trouvée' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Scroll en haut de page à chaque navigation
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// ==========================================
// NAVIGATION GUARDS
// ==========================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Mettre à jour le titre de la page
  document.title = to.meta.title || 'ScoutMe - Plateforme de recrutement sportif';

  // 1. Si route nécessite l'authentification
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Pas connecté → redirection vers login
      return next({ 
        name: 'login', 
        query: { redirect: to.fullPath } 
      });
    }

    // 2. Vérifier le rôle si nécessaire
    if (to.meta.requiresRole) {
      const userRole = authStore.user?.role;
      
      if (userRole !== to.meta.requiresRole) {
        // Mauvais rôle → redirection vers son dashboard
        const redirectRoute = userRole === 'joueur' 
          ? 'dashboard-joueur' 
          : 'dashboard-recruteur';
        
        return next({ name: redirectRoute });
      }
    }
  }

  // 3. Si route guest (login, register) et déjà connecté
  if (to.meta.guest && authStore.isAuthenticated) {
    const redirectRoute = authStore.isJoueur 
      ? 'dashboard-joueur' 
      : 'dashboard-recruteur';
    
    return next({ name: redirectRoute });
  }

  // 4. Tout est OK, laisser passer
  next();
});

export default router;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Gardé pour les liens des cartes
import Layout from '../components/Layout'; // Supposons que ce composant existe et fonctionne
// --- MODIFICATION : Commentez les imports des services manquants ---
// import { projectService, taskService, resourceService, supplierService } from '../services/api';

// --- Icônes (Gardées car utilisées dans le JSX) ---
const ProjectIcon = () => (
  <svg /* ... */ >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);
const TaskIcon = () => (
 <svg /* ... */ >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const ResourceIcon = () => (
 <svg /* ... */ >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);
const SupplierIcon = () => (
  <svg /* ... */ >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);
// --- Fin Icônes ---

function Dashboard() {
  // États pour stocker les données (initialisés à 0 ou vide)
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0 },
    tasks: { total: 0, pending: 0 },
    resources: { total: 0, low: 0 },
    suppliers: { total: 0, active: 0 },
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  // État de chargement, mis à false car on ne charge rien pour l'instant
  const [loading, setLoading] = useState(false); // <<< MODIFIÉ : false initialement
  const [error, setError] = useState(''); // Gardé pour d'éventuelles futures erreurs

  useEffect(() => {
    const fetchDashboardData = async () => {
      // --- MODIFICATION : Toute la logique de fetch est commentée ---
      /*
      try {
        setLoading(true); // Mettre à true si vous décommentez le fetch
        setError('');

        const [projectsRes, tasksRes, resourcesRes, suppliersRes] = await Promise.all([
          projectService.getAll(),
          taskService.getAll(),
          resourceService.getAll(),
          supplierService.getAll(),
        ]);

        const projects = projectsRes.data;
        const tasks = tasksRes.data;
        const resources = resourcesRes.data;
        const suppliers = suppliersRes.data;

        const activeProjects = projects.filter((p) => p.status === "En cours").length;
        const pendingTasks = tasks.filter((t) => t.status === "À faire" || t.status === "En retard").length;
        const lowResources = resources.filter((r) => r.quantity < 10).length;

        setStats({
          projects: { total: projects.length, active: activeProjects },
          tasks: { total: tasks.length, pending: pendingTasks },
          resources: { total: resources.length, low: lowResources },
          suppliers: { total: suppliers.length, active: suppliers.length },
        });

        const sortedProjects = [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
        setRecentProjects(
          sortedProjects.map((project) => ({
            id: project._id,
            name: project.name,
            updatedAt: project.updatedAt,
            progress: calculateProjectProgress(project, tasks),
          })),
        );

        const upcomingTasksList = [...tasks]
          .filter((task) => task.status !== "Terminé")
          .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
          .slice(0, 4);
        setUpcomingTasks(
          upcomingTasksList.map((task) => ({
            id: task._id,
            description: task.description,
            dueDate: task.endDate,
          })),
        );
      } catch (error) {
        console.error("Erreur lors du chargement des données du tableau de bord:", error);
        setError("Impossible de charger les données du tableau de bord.");
      } finally {
        setLoading(false);
      }
      */
      // --- FIN DE LA SECTION COMMENTÉE ---

      // On ne fait rien ici pour l'instant, le loading reste à false.
    };

    // fetchDashboardData(); // Commenté car la fonction est vide
  }, []); // Le tableau vide est gardé


  // --- MODIFICATION : Fonctions de calcul commentées car dépendent de données non chargées ---
  /*
  const calculateProjectProgress = (project, allTasks) => {
    const projectTasks = allTasks.filter((task) => task.projectId === project._id);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter((task) => task.status === "Terminé").length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };

  const calculateDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  */
  // --- FIN DES COMMENTAIRES ---

  // Affichage pendant le chargement (ne devrait pas s'afficher si loading reste false)
  if (loading) {
    return (
      <Layout>
        <div className="loading">Chargement des données...</div>
      </Layout>
    );
  }

  // Affichage en cas d'erreur (ne devrait pas s'afficher si error reste vide)
   if (error) {
     return (
      <Layout>
        <div className="error-message">{error}</div>
      </Layout>
     )
   }

  // Rendu principal du tableau de bord (affichera les stats à 0)
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Tableau de bord</h1>
         {/* Vous pouvez ajouter ici un message de bienvenue utilisant useAuth() si besoin */}
         {/* const { user } = useAuth(); ... <p>Bienvenue {user?.prenom || user?.userName}!</p> */}
      </div>

      {/* Cartes statistiques (afficheront les valeurs initiales de l'état 'stats') */}
      <div className="dashboard-cards">
        <Link to="/projects" className="dashboard-card"> {/* Le lien peut rester pour la structure */}
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">Projets</span>
            <ProjectIcon className="dashboard-card-icon" />
          </div>
          <div className="dashboard-card-value">{stats.projects.total}</div>
          <div className="dashboard-card-subtitle">{stats.projects.active} projets en cours</div>
        </Link>

        <Link to="/tasks" className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">Tâches</span>
            <TaskIcon className="dashboard-card-icon" />
          </div>
          <div className="dashboard-card-value">{stats.tasks.total}</div>
          <div className="dashboard-card-subtitle">{stats.tasks.pending} tâches en attente</div>
        </Link>

        <Link to="/resources" className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">Ressources</span>
            <ResourceIcon className="dashboard-card-icon" />
          </div>
          <div className="dashboard-card-value">{stats.resources.total}</div>
          <div className="dashboard-card-subtitle">{stats.resources.low} ressources faibles</div>
        </Link>

        <Link to="/suppliers" className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-title">Fournisseurs</span>
            <SupplierIcon className="dashboard-card-icon" />
          </div>
          <div className="dashboard-card-value">{stats.suppliers.total}</div>
          <div className="dashboard-card-subtitle">{stats.suppliers.active} fournisseurs actifs</div>
        </Link>
      </div>

      {/* Sections Projets Récents et Tâches à Venir (seront vides) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Projets récents</h2>
            <p className="card-description">Aperçu des derniers projets créés ou mis à jour</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {/* --- MODIFICATION : La liste est vide, on peut afficher un message --- */}
              {recentProjects.length === 0 ? (
                <p className="text-muted text-center">Aucun projet récent à afficher.</p>
              ) : (
                recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center gap-4">
                    {/* ... structure projet ... */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tâches à venir</h2>
            <p className="card-description">Tâches prévues pour les prochains jours</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
               {/* --- MODIFICATION : La liste est vide, on peut afficher un message --- */}
              {upcomingTasks.length === 0 ? (
                 <p className="text-muted text-center">Aucune tâche à venir.</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4">
                    {/* ... structure tâche ... */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
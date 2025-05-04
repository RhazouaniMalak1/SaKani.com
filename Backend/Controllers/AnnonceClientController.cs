// Dans Controllers/AnnonceClientController.cs

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;               // <<< Requis pour UserManager
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;               // Requis pour ToListAsync, CountAsync, AnyAsync etc.
using Projet1.Data;                                // Requis pour ApplicationDbContext
using Projet1.Dtos;                                // Requis pour UserInfoDto
using Projet1.Models;                              // Requis pour Annonce_Client, Annonce, User
using System;
using System.Collections.Generic;                    // Requis pour IEnumerable<>, List<>
using System.Linq;                                   // Requis pour Where, Select, Distinct
using System.Threading.Tasks;

namespace Projet1.Controllers
{
    // Note: Pas de route de base définie ici, les routes sont spécifiées sur chaque méthode.
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] // Sécurise toutes les méthodes par défaut (authentification requise)
    public class AnnonceClientController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager; // <<< Ajout champ UserManager

        // <<< Mise à jour constructeur pour injecter UserManager >>>
        public AnnonceClientController(ApplicationDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager; // Initialisation de UserManager
        }

        /// <summary>
        /// Récupère le nombre de visiteurs uniques (clients distincts) ayant consulté une annonce spécifique.
        /// Accessible par tout utilisateur authentifié.
        /// </summary>
        /// <param name="annonceId">L'ID de l'annonce concernée.</param>
        /// <returns>Un objet contenant le nombre de visiteurs uniques.</returns>
        [HttpGet("/api/annonces/{annonceId}/visiteur-count")] // Route explicite
        // Pas de [Authorize(Roles=...)] spécifique ici, donc l'autorisation de la classe s'applique (authentifié)
        public async Task<ActionResult<object>> GetVisiteurCountForAnnonce(int annonceId)
        {
            // Vérifier si l'annonce existe
            var annonceExists = await _context.Annonces.AnyAsync(a => a.Id == annonceId);
            if (!annonceExists)
            {
                return NotFound(new { Message = $"Annonce avec l'ID {annonceId} non trouvée." });
            }

            // Compter les visiteurs uniques
            var visiteurCount = await _context.AnnonceClients
                .Where(ac => ac.AnnonceId == annonceId)
                .Select(ac => ac.ClientId)
                .Distinct()
                .CountAsync();

            return Ok(new { VisiteurCount = visiteurCount });
        }


        /// <summary>
        /// Récupère la liste des clients (visiteurs uniques) ayant consulté une annonce spécifique,
        /// incluant leurs rôles.
        /// *** Accessible uniquement par les Admins. ***
        /// </summary>
        /// <param name="annonceId">L'ID de l'annonce concernée.</param>
        /// <returns>Une liste d'informations sur les clients (UserInfoDto) avec leurs rôles.</returns>
        [HttpGet("/api/annonces/{annonceId}/visiteurs")] // Route explicite
        [Authorize(Roles = "Admin")] // <<< RESTRICTION : Seul l'Admin peut accéder
        public async Task<ActionResult<IEnumerable<UserInfoDto>>> GetVisiteursForAnnonce(int annonceId)
        {
            // Vérifier si l'annonce existe
            var annonceExists = await _context.Annonces.AnyAsync(a => a.Id == annonceId);
            if (!annonceExists)
            {
                return NotFound(new { Message = $"Annonce avec l'ID {annonceId} non trouvée." });
            }

            // Étape 1: Obtenir les objets User distincts des visiteurs
            var visiteursDb = await _context.AnnonceClients
                .Where(ac => ac.AnnonceId == annonceId)
                .Include(ac => ac.Client) // Charger l'entité User
                .Select(ac => ac.Client)
                .Where(client => client != null)
                .Distinct()
                .ToListAsync(); // Récupérer les entités User en mémoire

            // Étape 2: Créer les DTOs et récupérer les rôles pour chaque visiteur
            var visiteursDtoList = new List<UserInfoDto>();
            foreach (var visiteur in visiteursDb)
            {
                // Obtenir les rôles pour cet utilisateur spécifique
                var roles = await _userManager.GetRolesAsync(visiteur);

                // Créer le DTO et l'ajouter à la liste
                visiteursDtoList.Add(new UserInfoDto
                {
                    Id = visiteur.Id,
                    UserName = visiteur.UserName,
                    Email = visiteur.Email,
                    Nom = visiteur.Nom,
                    Prenom = visiteur.Prenom,
                    Roles = roles // Assigner la liste de rôles obtenue
                });
            }

            // Retourner la liste des DTOs clients complets
            return Ok(visiteursDtoList);
        }





 /// <summary>
        /// [ADMIN ONLY] Récupère la liste des annonces distinctes consultées par un client spécifique.
        /// </summary>
        /// <param name="clientId">L'ID de l'utilisateur Client dont on veut voir l'historique.</param>
        /// <returns>Une liste d'annonces au format AnnonceReadDto.</returns>
        [HttpGet("/api/clients/{clientId}/annonces-visitees")] // La route reste la même
        [Authorize(Roles = "Admin")] // <<< RESTRICTION : Seul un Admin peut appeler cette méthode
        public async Task<ActionResult<IEnumerable<AnnonceReadDto>>> GetAnnoncesVisiteesParClient(string clientId)
        {
            // Optionnel mais bon : Vérifier si le client spécifié existe
            var clientExists = await _userManager.Users.AnyAsync(u => u.Id == clientId);
            if (!clientExists)
            {
                return NotFound(new { Message = $"Aucun client trouvé avec l'ID {clientId}." });
            }
            // --- Fin vérification existence client ---


            // Requête pour trouver les Annonces distinctes visitées par ce ClientId
            var annoncesVisitees = await _context.AnnonceClients
                .Where(ac => ac.ClientId == clientId) // 1. Filtrer par le ClientId fourni
                .Include(ac => ac.Annonce)           // 2. Charger l'Annonce associée
                .Select(ac => ac.Annonce)            // 3. Sélectionner l'objet Annonce
                .Where(annonce => annonce != null)   // 4. Ignorer si l'annonce a été supprimée physiquement
                .Distinct()                          // 5. Ne garder que les annonces uniques
                .Select(a => new AnnonceReadDto     // 6. Projeter vers le DTO
                {
                    Id = a.Id,
                    Name = a.Name,
                    DateCreation = a.DateCreation,
                    Prix = a.Prix,
                    AdresseProduit = a.AdresseProduit,
                    Statut = a.Statut,
                    Description = a.Description,
                    Image = a.Image,
                    Telephone = a.Telephone,
                    VendeurId = a.VendeurId,
                    AdminId = a.AdminId,
                    DeletionRequested = a.DeletionRequested
                    // IsDeleted n'existe plus
                })
                .ToListAsync();

            // Retourner la liste (peut être vide)
            return Ok(annoncesVisitees);
        }


    } 
} 
















  
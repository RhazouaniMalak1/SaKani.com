// Dans Controllers/AnnoncesController.cs

// --- Using Statements ---
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Projet1.Data;
using Projet1.Dtos; // Assurez-vous que AdminDetailsDto est ici
using Projet1.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting; // <<< AJOUT pour IWebHostEnvironment
using System.IO;  
// --- Fin Using Statements ---

namespace Projet1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnoncesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IWebHostEnvironment _hostingEnvironment;

        public AnnoncesController(ApplicationDbContext context, UserManager<User> userManager,
         IWebHostEnvironment hostingEnvironment)
        {
            _context = context;
            _userManager = userManager;
             _hostingEnvironment = hostingEnvironment; // Stocker l'environnement
        }

        // GET: api/annonces
        /// <summary>
        /// Récupère la liste de toutes les annonces existantes.
        /// </summary>
        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<IEnumerable<AnnonceReadDto>>> GetAnnonces()
        {
            var annonces = await _context.Annonces
                // .Where(a => !a.IsDeleted) // <<< FILTRE SUPPRIMÉ
                .Select(a => new AnnonceReadDto
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
                    DeletionRequested = a.DeletionRequested // MAPPING DeletionRequested
                    // IsDeleted = a.IsDeleted // <<< MAPPING SUPPRIMÉ
                })
                .ToListAsync();

            return Ok(annonces);
        }

        // GET: api/annonces/{id}
        /// <summary>
        /// Récupère une annonce spécifique par son ID.
        /// </summary>
     [HttpGet("{id}")]
        public async Task<ActionResult<AnnonceReadDto>> GetAnnonce(int id)
        {
            // 1. Récupérer l'annonce
            var annonce = await _context.Annonces
                .FirstOrDefaultAsync(a => a.Id == id);

            if (annonce == null)
            {
                return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });
            }

            // --- CORRECTION : Logique d'enregistrement de consultation ---
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!string.IsNullOrEmpty(userId) && User.IsInRole("Client"))
            {
                 try
                 {
                    // Vérifier si ce client a DEJA consulté CETTE annonce
                    // Note: Utilise le nom du DbSet ici (_context.AnnonceClients)
                    bool dejaConsulte = await _context.AnnonceClients
                                                .AnyAsync(ac => ac.ClientId == userId && ac.AnnonceId == id);

                    if (!dejaConsulte)
                    {
                        // *** Utilisez le nom EXACT de votre classe modèle ici ***
                        var nouvelleConsultation = new Annonce_Client // <-- HYPOTHÈSE : Votre modèle s'appelle Annonce_Client
                        {
                            ClientId = userId,
                            AnnonceId = annonce.Id,
                            DateConsultation = DateTime.UtcNow
                        };
                        // *** Utilisez le nom EXACT de votre DbSet ici ***
                        _context.AnnonceClients.Add(nouvelleConsultation); // <-- HYPOTHÈSE : Votre DbSet s'appelle AnnonceClients
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"[Consultation Enregistrée] Client: {userId}, Annonce: {id}");
                    }
                 }
                 catch (Exception ex)
                 {
                     Console.Error.WriteLine($"[ERREUR Enregistrement Consultation] Client: {userId}, Annonce: {id}. Erreur: {ex.Message}");
                 }
            }
            // --- FIN CORRECTION ---

            // 3. Mapper l'annonce vers le DTO de lecture
            var annonceDto = new AnnonceReadDto
            {
                Id = annonce.Id,
                Name = annonce.Name,
                DateCreation = annonce.DateCreation,
                Prix = annonce.Prix,
                AdresseProduit = annonce.AdresseProduit,
                Statut = annonce.Statut,
                Description = annonce.Description,
                Image = annonce.Image,
                Telephone = annonce.Telephone,
                VendeurId = annonce.VendeurId,
                AdminId = annonce.AdminId,
                DeletionRequested = annonce.DeletionRequested
            };

            // 4. Retourner le DTO
            return Ok(annonceDto);
        }

        // POST: api/annonces
        [HttpPost("")] 
       [Authorize(Roles = "Admin,Vendeur", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<AnnonceReadDto>> CreateAnnonce([FromForm] AnnonceCreateDto annonceCreateDto, IFormFile? imageFile)
        //                                                               ^^^^^^^^^^                      ^^^^^^^^^
        {
             // La validation ModelState fonctionne toujours avec [FromForm] pour les DTOs
             if (!ModelState.IsValid) return BadRequest(ModelState);

             var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
             if (string.IsNullOrEmpty(userId)) return Unauthorized(new { Message = "Impossible d'identifier l'utilisateur." });

             string? uniqueFileName = null; // Variable pour stocker le nom de fichier unique

             // --- Logique d'upload de l'image ---
             if (imageFile != null && imageFile.Length > 0)
             {
                 // 1. Définir le chemin du dossier de sauvegarde
                 string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Annonces");
                 // S'assurer que le dossier existe
                 Directory.CreateDirectory(uploadsFolder);

                 // 2. Générer un nom de fichier unique pour éviter les conflits
                 uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(imageFile.FileName);
                 string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                 // 3. Copier le fichier uploadé vers le serveur
                 try
                 {
                     using (var fileStream = new FileStream(filePath, FileMode.Create))
                     {
                         await imageFile.CopyToAsync(fileStream);
                     }
                 }
                 catch (Exception ex)
                 {
                     // Gérer les erreurs d'écriture de fichier
                     Console.Error.WriteLine($"Erreur sauvegarde image: {ex.Message}");
                     // Retourner une erreur ou continuer sans image ? Pour l'instant, on continue sans.
                     uniqueFileName = null; // Assurer que le nom n'est pas sauvegardé si l'upload échoue
                     ModelState.AddModelError("imageFile", "Erreur lors de la sauvegarde de l'image.");
                     // Retourner BadRequest ici si l'image est absolument requise
                     // return BadRequest(ModelState);
                 }
             }
             // --- Fin logique d'upload ---

             // --- Création de l'entité Annonce ---
             var annonce = new Annonce
             {
                 Name = annonceCreateDto.Name,
                 Prix = annonceCreateDto.Prix,
                 AdresseProduit = annonceCreateDto.AdresseProduit,
                 Statut = annonceCreateDto.Statut,
                 Description = annonceCreateDto.Description,
                 // --- MODIFIÉ : Sauvegarder le nom du fichier (ou null) ---
                 Image = uniqueFileName, // Stocke le nom unique ou null si pas d'upload/erreur
                 Telephone = annonceCreateDto.Telephone,
                 DateCreation = DateTime.UtcNow,
                 VendeurId = userId,
                 DeletionRequested = false // Valeur par défaut
             };

             _context.Annonces.Add(annonce);
             await _context.SaveChangesAsync(); // Sauvegarder l'annonce dans la DB

             // --- Mapping vers DTO de retour ---
             var annonceReadDto = new AnnonceReadDto
             {
                  Id = annonce.Id, Name = annonce.Name, DateCreation = annonce.DateCreation, Prix = annonce.Prix,
                  AdresseProduit = annonce.AdresseProduit, Statut = annonce.Statut, Description = annonce.Description,
                  // --- MODIFIÉ : Retourner le nom du fichier stocké ---
                  Image = annonce.Image, // Retourne le nom du fichier ou null
                  Telephone = annonce.Telephone, VendeurId = annonce.VendeurId, AdminId = annonce.AdminId,
                  DeletionRequested = annonce.DeletionRequested
             };

             // Retourner 201 Created avec l'annonce créée (DTO)
             return CreatedAtAction(nameof(GetAnnonce), new { id = annonceReadDto.Id }, annonceReadDto);
        }


        // --- PUT: api/annonces/{id} (MODIFIÉ pour gérer l'upload) ---
        [HttpPut("{id}")]
        // --- MODIFIÉ : Utilisation de [FromForm] ---
        [Authorize(Roles = "Admin,Vendeur", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateAnnonce(int id, [FromForm] AnnonceUpdateDto annonceUpdateDto, IFormFile? imageFile)
        //                                                       ^^^^^^^^^^                                    ^^^^^^^^^
        {
             if (!ModelState.IsValid) return BadRequest(ModelState);

             // Récupérer l'annonce existante (Find n'est pas idéal si on modifie, AsTracking est mieux)
             var annonce = await _context.Annonces.FirstOrDefaultAsync(a => a.Id == id);
             if (annonce == null) return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });

             // Vérification des permissions
             var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
             var isAdmin = User.IsInRole("Admin");
             if (!isAdmin && annonce.VendeurId != currentUserId) return Forbid();

             string? imagePathToSave = annonce.Image; // Garde l'ancien nom par défaut
             string? oldImagePath = annonce.Image;    // Pour supprimer l'ancien fichier si remplacé

             // --- Logique d'upload si une NOUVELLE image est fournie ---
             if (imageFile != null && imageFile.Length > 0)
             {
                 string uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Annonces");
                 Directory.CreateDirectory(uploadsFolder);
                 string uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(imageFile.FileName);
                 string newFilePath = Path.Combine(uploadsFolder, uniqueFileName);

                 try
                 {
                     using (var fileStream = new FileStream(newFilePath, FileMode.Create))
                     {
                         await imageFile.CopyToAsync(fileStream);
                     }
                     imagePathToSave = uniqueFileName; // Mettre à jour avec le nouveau nom

                     // Supprimer l'ancien fichier s'il existait et si le nouveau est sauvegardé
                     if (!string.IsNullOrEmpty(oldImagePath))
                     {
                         string fullOldPath = Path.Combine(uploadsFolder, oldImagePath);
                         if (System.IO.File.Exists(fullOldPath))
                         {
                              try { System.IO.File.Delete(fullOldPath); }
                              catch(Exception ex) { Console.Error.WriteLine($"Erreur suppression ancienne image {oldImagePath}: {ex.Message}"); }
                         }
                     }
                 }
                 catch (Exception ex)
                 {
                     Console.Error.WriteLine($"Erreur sauvegarde nouvelle image: {ex.Message}");
                     ModelState.AddModelError("imageFile", "Erreur lors de la sauvegarde de la nouvelle image.");
                     // Ne pas bloquer la mise à jour des autres champs si l'upload échoue ?
                     // Ou return BadRequest(ModelState); si l'image est critique
                     imagePathToSave = oldImagePath; // Garder l'ancien chemin si upload échoue
                 }
             }
             // --- Fin logique d'upload ---

             // --- Mise à jour des propriétés de l'entité ---
             annonce.Name = annonceUpdateDto.Name;
             annonce.Prix = annonceUpdateDto.Prix;
             annonce.AdresseProduit = annonceUpdateDto.AdresseProduit;
             annonce.Statut = annonceUpdateDto.Statut;
             annonce.Description = annonceUpdateDto.Description;
             annonce.Telephone = annonceUpdateDto.Telephone;
             // --- MODIFIÉ : Mettre à jour le chemin de l'image ---
             annonce.Image = imagePathToSave; // Nouveau nom ou ancien nom si pas de nouvel upload/erreur

             // Mettre à jour AdminId si c'est un admin qui modifie
             if (isAdmin) { annonce.AdminId = currentUserId; }

             // Indiquer que l'entité a été modifiée (pas strictement nécessaire si récupérée avec tracking)
             // _context.Entry(annonce).State = EntityState.Modified;

             try
             {
                 await _context.SaveChangesAsync(); // Sauvegarder les modifications
             }
             catch (DbUpdateConcurrencyException) { /* ... gestion concurrence ... */ throw; }
             catch (DbUpdateException ex) { /* ... autre erreur DB ... */ throw; }

             return NoContent(); // Standard pour PUT réussi
        }

     /// <summary>
        /// Archive une annonce (sans certains champs) puis la supprime physiquement.
        /// Réservé aux Admins.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteAnnonce(int id)
        {
            var annonce = await _context.Annonces.FindAsync(id);
            if (annonce == null)
            {
                return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });
            }

            var adminSuppresseurId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(adminSuppresseurId))
            {
                 return Unauthorized(new { Message = "Impossible d'identifier l'administrateur."});
            }

            // --- Création de l'archive (MODIFIÉE) ---
            var archiveRecord = new ArchiveDesAnnoncesSupprime
            {
                // Copier les données essentielles
                AnnonceId = annonce.Id,
                Name = annonce.Name,
                DateCreationAnnonce = annonce.DateCreation,
                Prix = annonce.Prix,
                AdresseProduit = annonce.AdresseProduit,
                Statut = annonce.Statut,
                Description = annonce.Description,
                Image = annonce.Image,
                Telephone = annonce.Telephone,
                VendeurId = annonce.VendeurId,
                // PAS de DeletionRequestedAnnonce
                // PAS de AdminIdOriginal

                // Ajouter les métadonnées d'archivage
                DateSuppression = DateTime.UtcNow,
                AdminIdSuppresseur = adminSuppresseurId
            };
            // --- Fin Création archive ---

            _context.ArchivesAnnonces.Add(archiveRecord);
            _context.Annonces.Remove(annonce);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine($"ERREUR lors de l'archivage/suppression Annonce {id}: {ex.InnerException?.Message ?? ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Erreur serveur lors de la suppression de l'annonce." });
            }

            return NoContent();
        }


        /// <summary>
        /// Récupère les détails d'un utilisateur Admin et la liste complète des annonces qu'il gère.
        /// </summary>
        [HttpGet("admin/{adminId}/details")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AdminDetailsDto>> GetAdminDetails(string adminId)
        {
            var adminUser = await _userManager.Users
                .Include(u => u.AnnoncesGerees) // Charge les Annonces où Annonce.AdminId = adminId
                .FirstOrDefaultAsync(u => u.Id == adminId);

            if (adminUser == null) return NotFound(new { Message = $"Utilisateur admin avec ID {adminId} non trouvé." });

            var roles = await _userManager.GetRolesAsync(adminUser);
            if (!roles.Contains("Admin")) return BadRequest(new { Message = $"L'utilisateur {adminId} n'est pas un administrateur." });

            var adminDetailsDto = new AdminDetailsDto
            {
                Id = adminUser.Id,
                UserName = adminUser.UserName,
                Nom = adminUser.Nom,
                Prenom = adminUser.Prenom,
                AnnoncesGerees = adminUser.AnnoncesGerees // Pas de filtre IsDeleted ici car déjà filtré par AdminId
                    .Select(a => new AnnonceReadDto
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
                        DeletionRequested = a.DeletionRequested // MAPPING DeletionRequested
                        // IsDeleted non mappé car supprimé
                    }).ToList()
            };

            return Ok(adminDetailsDto);
        }

        /// <summary>
        /// Récupère la liste des annonces créées par un vendeur spécifique.
        /// </summary>
        [HttpGet("vendeur/{vendeurId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<IEnumerable<AnnonceReadDto>>> GetAnnoncesParVendeur(string vendeurId)
        {
            var vendeur = await _userManager.FindByIdAsync(vendeurId);
            if (vendeur == null) return NotFound(new { Message = $"Aucun utilisateur trouvé avec l'ID {vendeurId}." });
            var roles = await _userManager.GetRolesAsync(vendeur);
            if (!roles.Contains("Vendeur")) return BadRequest(new { Message = $"L'utilisateur {vendeurId} n'est pas un vendeur." });

            var annoncesDuVendeur = await _context.Annonces
                .Where(a => a.VendeurId == vendeurId) // Pas de filtre IsDeleted ici
                .Select(a => new AnnonceReadDto
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
                    DeletionRequested = a.DeletionRequested // MAPPING DeletionRequested
                    // IsDeleted non mappé car supprimé
                })
                .ToListAsync();

            return Ok(annoncesDuVendeur);
        }

        /// <summary>
        /// Permet au vendeur propriétaire de demander la suppression de son annonce. Met DeletionRequested à true.
        /// </summary>
        [HttpPatch("{id}/request-deletion")]
        [Authorize(Roles = "Vendeur", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RequestDeletion(int id)
        {
            var annonce = await _context.Annonces.FirstOrDefaultAsync(a => a.Id == id);
            if (annonce == null) return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (annonce.VendeurId != currentUserId) return Forbid();

            // if (annonce.IsDeleted) // <<< VÉRIFICATION SUPPRIMÉE
            // {
            //      return BadRequest(new { Message = $"L'annonce {id} est déjà définitivement supprimée." });
            // }

            if (annonce.DeletionRequested) return Ok(new { Message = $"La demande de suppression pour l'annonce {id} a déjà été enregistrée." });

            annonce.DeletionRequested = true;
            _context.Entry(annonce).State = EntityState.Modified;
            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { throw; } // Simplifié
            return Ok(new { Message = $"Demande de suppression pour l'annonce {id} enregistrée." });
        }

        /// <summary>
        /// [ACTION ADMIN] Supprime DÉFINITIVEMENT une annonce de la base de données.
        /// </summary>
        [HttpPatch("{id}/confirm-soft-delete")] // Gardé PATCH ou changer pour DELETE ?
        [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ConfirmSoftDeleteAndForceDelete(int id)
        {
            var annonce = await _context.Annonces.FirstOrDefaultAsync(a => a.Id == id);
            if (annonce == null) return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });

            _context.Annonces.Remove(annonce); // Suppression physique directe

            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine($"ERREUR Suppression physique Annonce {id} sur confirmation: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Erreur lors de la suppression définitive de l'annonce." });
            }
            return NoContent();
        }

        /// <summary>
        /// [ACTION ADMIN] Récupère les annonces dont la suppression a été demandée par le vendeur.
        /// </summary>
        [HttpGet("pending-deletion")]
        [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<IEnumerable<AnnonceReadDto>>> GetAnnoncesEnAttenteDeSuppression()
        {
            var annoncesEnAttente = await _context.Annonces
                .Where(a => a.DeletionRequested) // <<< FILTRE SIMPLIFIÉ : ne vérifie plus IsDeleted
                .Select(a => new AnnonceReadDto
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
                    DeletionRequested = a.DeletionRequested // Sera true ici
                    // IsDeleted non mappé car supprimé
                })
                .ToListAsync();

            return Ok(annoncesEnAttente);
        }





         [HttpGet("archives")] // Nouvelle route pour les archives
        [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<IEnumerable<AnnonceArchiveeReadDto>>> GetArchives()
        {
            var archives = await _context.ArchivesAnnonces
                .Include(a => a.AdminSuppresseur) // Charger les infos de l'admin qui a supprimé
                .OrderByDescending(a => a.DateSuppression) // Trier par date de suppression (plus récent en premier)
                .Select(a => new AnnonceArchiveeReadDto // <<< MAPPER VERS LE DTO ICI >>>
                {
                    Id = a.Id, // ID de l'archive
                    AnnonceId = a.AnnonceId, // ID de l'annonce originale
                    Name = a.Name,
                    DateCreationAnnonce = a.DateCreationAnnonce,
                    Prix = a.Prix,
                    AdresseProduit = a.AdresseProduit,
                    Statut = a.Statut,
                    Description = a.Description, // Peut être long, optionnel de l'inclure dans la liste
                    Image = a.Image,
                    Telephone = a.Telephone,
                    VendeurId = a.VendeurId,
                    DateSuppression = a.DateSuppression,
                    AdminIdSuppresseur = a.AdminIdSuppresseur,
                    // Concaténer nom/prénom de l'admin ou utiliser username
                    AdminSuppresseurNom = a.AdminSuppresseur != null
                                            ? $"{a.AdminSuppresseur.Prenom} {a.AdminSuppresseur.Nom}".Trim() // Concatène Nom/Prénom
                                            : a.AdminIdSuppresseur // Fallback sur l'ID si l'objet User n'est pas chargé ou null
                })
                .ToListAsync();

            return Ok(archives); // <<< RETOURNER LA LISTE DES DTOs >>>
        }

    } 

} 
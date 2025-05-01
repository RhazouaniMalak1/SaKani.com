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
// --- Fin Using Statements ---

namespace Projet1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnoncesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public AnnoncesController(ApplicationDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
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
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<AnnonceReadDto>> GetAnnonce(int id)
        {
            // 1. Récupérer l'annonce
            var annonce = await _context.Annonces
                // .Where(a => !a.IsDeleted) // <<< FILTRE SUPPRIMÉ
                .FirstOrDefaultAsync(a => a.Id == id);

            if (annonce == null)
            {
                // Message simplifié car plus d'état "supprimé logiquement"
                return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });
            }

            // ... (logique d'enregistrement de consultation) ...
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId) && User.IsInRole("Client"))
            {
                 var nouvelleConsultation = new Annonce_Client { ClientId = userId, AnnonceId = annonce.Id, DateConsultation = DateTime.UtcNow };
                 _context.AnnonceClients.Add(nouvelleConsultation);
                 try { await _context.SaveChangesAsync(); } catch (DbUpdateException ex) { Console.Error.WriteLine($"ERREUR Consultation: {ex.Message}"); }
            }


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
                VendeurId = annonce.VendeurId,
                AdminId = annonce.AdminId,
                DeletionRequested = annonce.DeletionRequested // MAPPING DeletionRequested
                // IsDeleted = annonce.IsDeleted // <<< MAPPING SUPPRIMÉ
            };

            // 4. Retourner le DTO
            return Ok(annonceDto);
        }

        // POST: api/annonces
        [HttpPost]
        [Authorize(Roles = "Vendeur", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<AnnonceReadDto>> CreateAnnonce([FromBody] AnnonceCreateDto annonceCreateDto)
        {
             if (!ModelState.IsValid) return BadRequest(ModelState);
             var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
             if (string.IsNullOrEmpty(userId)) return Unauthorized(new { Message = "Impossible d'identifier l'utilisateur." });

             var annonce = new Annonce
             {
                 Name = annonceCreateDto.Name, Prix = annonceCreateDto.Prix, AdresseProduit = annonceCreateDto.AdresseProduit, Statut = annonceCreateDto.Statut, Description = annonceCreateDto.Description, DateCreation = DateTime.UtcNow, VendeurId = userId
                 // Pas besoin de IsDeleted ou DeletionRequested ici (valeurs par défaut false)
             };
             _context.Annonces.Add(annonce);
             await _context.SaveChangesAsync();

             var annonceReadDto = new AnnonceReadDto
             {
                  Id = annonce.Id, Name = annonce.Name, DateCreation = annonce.DateCreation, Prix = annonce.Prix, AdresseProduit = annonce.AdresseProduit, Statut = annonce.Statut, Description = annonce.Description, VendeurId = annonce.VendeurId, AdminId = annonce.AdminId,
                  DeletionRequested = annonce.DeletionRequested // Mapper la valeur par défaut (false)
                  // IsDeleted non mappé car supprimé
             };
             return CreatedAtAction(nameof(GetAnnonce), new { id = annonceReadDto.Id }, annonceReadDto);
        }

        // PUT: api/annonces/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Vendeur", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateAnnonce(int id, [FromBody] AnnonceUpdateDto annonceUpdateDto)
        {
             if (!ModelState.IsValid) return BadRequest(ModelState);
             var annonce = await _context.Annonces.FindAsync(id);
             if (annonce == null) return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });

             var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
             var isAdmin = User.IsInRole("Admin");

             if (!isAdmin && annonce.VendeurId != currentUserId) return Forbid();

             annonce.Name = annonceUpdateDto.Name;
             annonce.Prix = annonceUpdateDto.Prix;
             annonce.AdresseProduit = annonceUpdateDto.AdresseProduit;
             annonce.Statut = annonceUpdateDto.Statut;
             annonce.Description = annonceUpdateDto.Description;
             // Ne pas modifier DeletionRequested ici

             if (isAdmin) { annonce.AdminId = currentUserId; }

             _context.Entry(annonce).State = EntityState.Modified;
             try { await _context.SaveChangesAsync(); }
             catch (DbUpdateConcurrencyException) { if (!_context.Annonces.Any(e => e.Id == id)) return NotFound(); else throw; }
             return NoContent();
        }

        // DELETE: api/annonces/{id} (Suppression physique standard par Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin", AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteAnnonce(int id)
        {
            var annonce = await _context.Annonces.FindAsync(id);
            if (annonce == null) return NotFound(new { Message = $"Annonce avec l'ID {id} non trouvée." });

            _context.Annonces.Remove(annonce); // Suppression physique directe
            await _context.SaveChangesAsync();

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
                    VendeurId = a.VendeurId,
                    AdminId = a.AdminId,
                    DeletionRequested = a.DeletionRequested // Sera true ici
                    // IsDeleted non mappé car supprimé
                })
                .ToListAsync();

            return Ok(annoncesEnAttente);
        }

    } 

} 
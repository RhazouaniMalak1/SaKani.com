// Dans Controllers/ChatController.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Projet1.Data;
using Projet1.Models;
using Projet1.Dtos; // Assurez-vous que UserSummaryDto est accessible (si dans ce namespace)
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Projet1.Controllers
{
    // --- DTO UserSummaryDto (Déclaré dans le namespace, avant la classe Controller) ---
    // (Alternative: le mettre dans son propre fichier Dtos/UserSummaryDto.cs et ajouter using Projet1.Dtos;)
    public class UserSummaryDto
    {
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; } // Nullable si l'email/username peut manquer
        public string? Nom { get; set; }
        public string? Prenom { get; set; }
        // Ajouter une propriété pour le dernier message/timestamp si vous voulez trier par date
        // public DateTime? LastMessageTimestamp { get; set; }
    }
    // --- Fin DTO ---

     // --- DTO SendMessageDto (Déclaré dans le namespace) ---
    // (Alternative: le mettre dans son propre fichier Dtos/SendMessageDto.cs et ajouter using Projet1.Dtos;)
    public class SendMessageDto
    {
        [Required(ErrorMessage = "L'ID du destinataire est requis.")]
        public string RecipientId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le contenu du message est requis.")]
        [StringLength(1000, MinimumLength = 1, ErrorMessage = "Le contenu doit contenir entre 1 et 1000 caractères.")]
        public string Content { get; set; } = string.Empty;
    }
    // --- Fin DTO ---


    // --- Début Classe Controller ---
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Injectez UserManager si vous voulez récupérer plus d'infos sur les utilisateurs
        // private readonly UserManager<User> _userManager;
        // public ChatController(ApplicationDbContext context, UserManager<User> userManager)
        public ChatController(ApplicationDbContext context) // Constructeur actuel
        {
            _context = context;
            // _userManager = userManager; // Si UserManager est injecté
        }

        /// <summary>
        /// Récupère l'historique des messages entre l'utilisateur connecté et un autre utilisateur.
        /// </summary>
        [HttpGet("history/{otherUserId}")]
        public async Task<ActionResult<IEnumerable<Message>>> GetConversationHistory(string otherUserId, [FromQuery] DateTime? before = null, [FromQuery] int count = 50)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(otherUserId)) return BadRequest("IDs utilisateur invalides.");
            if (count <= 0) count = 50; if (count > 200) count = 200;
            var timestampLimit = before ?? DateTime.UtcNow;

            var messages = await _context.Messages
                .Where(m => (m.SenderId == currentUserId && m.RecipientId == otherUserId) || (m.SenderId == otherUserId && m.RecipientId == currentUserId))
                .Where(m => m.Timestamp < timestampLimit)
                .OrderByDescending(m => m.Timestamp).Take(count).OrderBy(m => m.Timestamp)
                .ToListAsync();

            // Optionnel: Marquer comme lu
             var messagesToMarkAsRead = messages.Where(m => m.RecipientId == currentUserId && m.SenderId == otherUserId && !m.IsRead).ToList();
             if (messagesToMarkAsRead.Any()) {
                foreach(var msg in messagesToMarkAsRead) { msg.IsRead = true; }
                // await _context.SaveChangesAsync(); // Voir commentaires précédents
             }

            return Ok(messages);
        }

        /// <summary>
        /// Récupère les nouveaux messages dans une conversation spécifique depuis un certain timestamp.
        /// </summary>
        [HttpGet("new/{otherUserId}")]
        public async Task<ActionResult<IEnumerable<Message>>> GetNewMessages(string otherUserId, [FromQuery] DateTime sinceUtc)
        {
             var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
             if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(otherUserId)) return BadRequest("IDs utilisateur invalides.");
             var sinceTimestampUtc = DateTime.SpecifyKind(sinceUtc, DateTimeKind.Utc);
             Console.WriteLine($"[ChatController GetNewMessages] Recherche entre {currentUserId} et {otherUserId} depuis {sinceTimestampUtc:o}.");

             var newMessages = await _context.Messages
                 .Where(m => (m.SenderId == currentUserId && m.RecipientId == otherUserId) || (m.SenderId == otherUserId && m.RecipientId == currentUserId))
                 .Where(m => m.Timestamp > sinceTimestampUtc)
                 .OrderBy(m => m.Timestamp).ToListAsync();

             // Optionnel: Marquer comme lu
             var messagesToMarkAsRead = newMessages.Where(m => m.RecipientId == currentUserId && m.SenderId == otherUserId && !m.IsRead).ToList();
             if (messagesToMarkAsRead.Any()) { foreach(var msg in messagesToMarkAsRead) { msg.IsRead = true; } /* await _context.SaveChangesAsync(); */ }
             Console.WriteLine($"[ChatController GetNewMessages] Trouvé {newMessages.Count} nouveau(x) message(s).");
             return Ok(newMessages);
        }

        /// <summary>
        /// Récupère TOUS les nouveaux messages reçus par l'utilisateur connecté depuis un certain timestamp.
        /// </summary>
        [HttpGet("new/all")]
        public async Task<ActionResult<IEnumerable<Message>>> GetAllNewMessages([FromQuery] DateTime sinceUtc)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized("Utilisateur non identifié.");
            var sinceTimestampUtc = DateTime.SpecifyKind(sinceUtc, DateTimeKind.Utc);
            Console.WriteLine($"---[GetAllNewMessages - Polling Global]---");
            Console.WriteLine($"Utilisateur Actuel: {currentUserId}");
            Console.WriteLine($"Recherche depuis (UTC): {sinceTimestampUtc:o}");

            var newMessagesQuery = _context.Messages
                .Where(m => m.RecipientId == currentUserId)
                .Where(m => m.Timestamp > sinceTimestampUtc);

            try { Console.WriteLine($"SQL Query (approx.): {newMessagesQuery.ToQueryString()}"); }
            catch(Exception) { Console.WriteLine("Impossible de générer le SQL pour le log."); }

            var newMessages = await newMessagesQuery.OrderBy(m => m.Timestamp).ToListAsync();
            Console.WriteLine($"[ChatController GetAllNewMessages] Trouvé {newMessages.Count} nouveau(x) message(s) pour {currentUserId} depuis {sinceTimestampUtc:o}.");
            foreach(var msg in newMessages) { Console.WriteLine($"  -> ID: {msg.Id}, De: {msg.SenderId}, Timestamp: {msg.Timestamp:o}"); }
            return Ok(newMessages);
        }


        /// <summary>
        /// Permet à un utilisateur connecté d'envoyer un message à un autre utilisateur via API HTTP.
        /// </summary>
        [HttpPost("send")]
        public async Task<ActionResult<Message>> SendMessageApi([FromBody] SendMessageDto sendMessageDto)
        {
            var senderUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(senderUserId)) return Unauthorized("Expéditeur non identifié.");
            if (sendMessageDto == null || string.IsNullOrWhiteSpace(sendMessageDto.Content) || string.IsNullOrEmpty(sendMessageDto.RecipientId)) return BadRequest("Données invalides.");
            if (senderUserId == sendMessageDto.RecipientId) return BadRequest("Auto-envoi non autorisé.");
            var recipientExists = await _context.Users.AnyAsync(u => u.Id == sendMessageDto.RecipientId);
            if (!recipientExists) return NotFound($"Destinataire {sendMessageDto.RecipientId} non trouvé.");
            Console.WriteLine($"[ChatController SendMessageApi] Reçu de {senderUserId} vers {sendMessageDto.RecipientId}: \"{sendMessageDto.Content}\"");
            var message = new Message { SenderId = senderUserId, RecipientId = sendMessageDto.RecipientId, Content = sendMessageDto.Content.Trim(), Timestamp = DateTime.UtcNow, IsRead = false };
            try { _context.Messages.Add(message); await _context.SaveChangesAsync(); Console.WriteLine($"[ChatController SendMessageApi] Message sauvegardé (ID: {message.Id})."); return Ok(message); }
            catch (DbUpdateException dbEx) { Console.Error.WriteLine($"[ChatController SendMessageApi] Erreur DB: {dbEx.InnerException?.Message ?? dbEx.Message}"); return StatusCode(StatusCodes.Status500InternalServerError, "Erreur DB sauvegarde."); }
            catch (Exception ex) { Console.Error.WriteLine($"[ChatController SendMessageApi] Erreur: {ex.Message}"); return StatusCode(StatusCodes.Status500InternalServerError, "Erreur serveur sauvegarde."); }
        }

        /// <summary>
        /// Marque tous les messages non lus d'un expéditeur spécifique comme lus pour l'utilisateur actuel.
        /// </summary>
        [HttpPost("markasread/{senderId}")]
        public async Task<IActionResult> MarkConversationAsRead(string senderId)
        {
             var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
             if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(senderId)) return BadRequest("IDs invalides.");
             // EF Core 7+ requis pour ExecuteUpdateAsync
             try
             {
                var updatedCount = await _context.Messages
                    .Where(m => m.RecipientId == currentUserId && m.SenderId == senderId && !m.IsRead)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.IsRead, true));
                 if (updatedCount > 0) { Console.WriteLine($"[ChatController MarkAsRead] Marqué {updatedCount} message(s) comme lus."); }
                 else { Console.WriteLine($"[ChatController MarkAsRead] Aucun message non lu trouvé."); }
             }
             catch (Exception ex) {
                 Console.Error.WriteLine($"[ChatController MarkAsRead] Erreur: {ex.Message}");
                 // Retourner une erreur 500 si la mise à jour échoue
                 return StatusCode(StatusCodes.Status500InternalServerError, "Erreur lors de la mise à jour des messages.");
             }
             return NoContent();
        }

        /// <summary>
        /// Récupère la liste des utilisateurs avec qui l'utilisateur actuel a échangé des messages.
        /// </summary>
        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetConversations()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();
            Console.WriteLine($"[ChatController GetConversations] Recherche des conversations pour {currentUserId}");
            try {
                var sentToIds = await _context.Messages.Where(m => m.SenderId == currentUserId).Select(m => m.RecipientId).Distinct().ToListAsync();
                var receivedFromIds = await _context.Messages.Where(m => m.RecipientId == currentUserId).Select(m => m.SenderId).Distinct().ToListAsync();
                var allInterlocutorIds = sentToIds.Union(receivedFromIds).Distinct().ToList();
                Console.WriteLine($"[ChatController GetConversations] Trouvé {allInterlocutorIds.Count} interlocuteur(s).");
                if (!allInterlocutorIds.Any()) return Ok(new List<UserSummaryDto>());
                var usersDetails = await _context.Users
                    .Where(u => allInterlocutorIds.Contains(u.Id))
                    .Select(u => new UserSummaryDto { Id = u.Id, UserName = u.UserName, Nom = u.Nom, Prenom = u.Prenom })
                    .ToListAsync();
                Console.WriteLine($"[ChatController GetConversations] Détails récupérés pour {usersDetails.Count} utilisateur(s).");
                return Ok(usersDetails);
            } catch (Exception ex) {
                Console.Error.WriteLine($"[ChatController GetConversations] Erreur: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, "Erreur lors de la récupération des conversations.");
            }
        }

    } // <<<---- FIN DE LA CLASSE ChatController

} // <<<---- FIN DU NAMESPACE Projet1.Controllers
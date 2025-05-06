// Dans Models/Message.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Projet1.Models
{
    public class Message
    {
        [Key]
        public int Id { get; set; } // Clé primaire du message

        [Required]
        public string SenderId { get; set; } = string.Empty; // ID de l'expéditeur (User.Id)

        [Required]
        public string RecipientId { get; set; } = string.Empty; // ID du destinataire (User.Id)

        [Required]
        [StringLength(1000, MinimumLength = 1)] // Limite de longueur pour le contenu
        public string Content { get; set; } = string.Empty; // Contenu du message

        public DateTime Timestamp { get; set; } = DateTime.UtcNow; // Date/Heure d'envoi (par défaut UTC)

        public bool IsRead { get; set; } = false; // Indicateur si le message a été lu

        // --- Propriétés de Navigation (Optionnel mais utile) ---

        [ForeignKey("SenderId")]
        public virtual User? Sender { get; set; } // L'utilisateur qui a envoyé

        [ForeignKey("RecipientId")]
        public virtual User? Recipient { get; set; } // L'utilisateur qui a reçu
    }
}
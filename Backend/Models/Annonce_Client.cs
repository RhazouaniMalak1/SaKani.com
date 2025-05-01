// Dans Models/Annonce_Client.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // Requis pour [ForeignKey]
using System.Text.Json.Serialization; // Requis pour [JsonIgnore]

namespace Projet1.Models // Assurez-vous que le namespace est correct
{
    // Représente la table de liaison pour la relation plusieurs-à-plusieurs
    // entre User (Client) et Annonce
    public class Annonce_Client
    {
        // --- Clés Étrangères (composant la clé primaire composite) ---
        // Sera configurée dans ApplicationDbContext via Fluent API

        [Required]
        public string ClientId { get; set; } = string.Empty; // FK vers User.Id (Client)

        [Required]
        public int AnnonceId { get; set; } // FK vers Annonce.Id

        // --- Propriété additionnelle de la relation ---
        public DateTime DateConsultation { get; set; } = DateTime.UtcNow;

        // --- Propriétés de Navigation ---

        // Navigation vers le User client (lié via ClientId)
        [ForeignKey("ClientId")]
        [JsonIgnore]
        public virtual User? Client { get; set; } // Lié à la collection User.AnnoncesConsultees

        // Navigation vers l'Annonce consultée (lié via AnnonceId)
        [ForeignKey("AnnonceId")]
        [JsonIgnore]
        public virtual Annonce? Annonce { get; set; } // Lié à la collection Annonce.Consultations
    }
}
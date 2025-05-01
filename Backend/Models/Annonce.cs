// Dans Models/Annonce.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // Requis pour [Column] et [ForeignKey]
using System.Text.Json.Serialization; // Requis pour [JsonIgnore]

namespace Projet1.Models // Assurez-vous que le namespace est correct
{
    public class Annonce
    {
        [Key] // Définit la clé primaire
        public int Id { get; set; } // Clé primaire de type entier

        [Required(ErrorMessage = "Le nom de l'annonce est requis.")]
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères.")]
        public string Name { get; set; } = string.Empty;

        public DateTime DateCreation { get; set; } = DateTime.UtcNow; // Date de création par défaut

        [Required(ErrorMessage = "Le prix est requis.")]
        [Column(TypeName = "decimal(18, 2)")] // Type de données précis pour la monnaie
        public decimal Prix { get; set; }

        [StringLength(255)]
        public string? AdresseProduit { get; set; } // Nullable (optionnel)

        [StringLength(50)]
        public string? Statut { get; set; } // Nullable (optionnel)

        public string? Description { get; set; } // Nullable (optionnel)
         public bool DeletionRequested { get; set; } = false; // 'Pour le client' ====> ASupprimerOuNo

        // --- Clés Étrangères vers User ---
        // Le Vendeur (User) qui a créé l'annonce (obligatoire)
        [Required]
        public string VendeurId { get; set; } = string.Empty; // Type string correspond à User.Id de Identity

        // L'Admin (User) qui gère l'annonce (optionnel)
        public string? AdminId { get; set; } // Nullable, type string correspond à User.Id

        // --- Propriétés de Navigation ---

        // Navigation vers le User vendeur (lié via VendeurId)
        [ForeignKey("VendeurId")]
        [JsonIgnore] // Empêche les boucles de sérialisation JSON
        public virtual User? Vendeur { get; set; } // Lié à la collection User.AnnoncesCrees

        // Navigation vers le User admin (lié via AdminId)
        [ForeignKey("AdminId")]
        [JsonIgnore]
        public virtual User? Admin { get; set; } // Lié à la collection User.AnnoncesGerees

        // Navigation vers les enregistrements de consultation (relation un-à-plusieurs avec la table de liaison)
        [JsonIgnore]
        public virtual ICollection<Annonce_Client> Consultations { get; set; } = new List<Annonce_Client>(); // Initialisation importante
    }
}
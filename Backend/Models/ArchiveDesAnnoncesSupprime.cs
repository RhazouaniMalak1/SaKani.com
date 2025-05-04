// Dans Models/ArchiveDesAnnoncesSupprime.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Projet1.Models
{
    public class ArchiveDesAnnoncesSupprime
    {
        [Key]
        public int Id { get; set; } // Clé primaire archive

        // --- Informations copiées depuis l'Annonce originale ---
        [Required]
        public int AnnonceId { get; set; } // ID original

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public DateTime DateCreationAnnonce { get; set; } // Date création originale

        [Column(TypeName = "decimal(18, 2)")]
        public decimal Prix { get; set; }

        [StringLength(255)]
        public string? AdresseProduit { get; set; }

        [StringLength(50)]
        public string? Statut { get; set; }

        public string? Description { get; set; }
        
        public string? Image { get; set; } // Peut être null si l'original était null

        public string? Telephone { get; set; }

        [Required]
        public string VendeurId { get; set; } = string.Empty; // Vendeur original

        // --- Propriétés supprimées ---
        // public bool DeletionRequestedAnnonce { get; set; } // SUPPRIMÉ
        // public string? AdminIdOriginal { get; set; } // SUPPRIMÉ

        // --- Informations sur l'archivage ---
        [Required]
        public DateTime DateSuppression { get; set; } = DateTime.UtcNow; // Date archivage

        [Required]
        public string AdminIdSuppresseur { get; set; } = string.Empty; // FK Admin suppresseur

        // --- Propriété de Navigation ---
        [ForeignKey("AdminIdSuppresseur")]
        [JsonIgnore]
        public virtual User? AdminSuppresseur { get; set; }
    }
}
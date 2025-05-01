// Dans Dtos/AnnonceUpdateDto.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Projet1.Dtos
{
    public class AnnonceUpdateDto
    {
        [Required(ErrorMessage = "Le nom de l'annonce est requis.")]
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le prix est requis.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Le prix doit être positif.")]
        [Column(TypeName = "decimal(18, 2)")]
        public decimal Prix { get; set; }

        [StringLength(255)]
        public string? AdresseProduit { get; set; }

        [StringLength(50)]
        public string? Statut { get; set; } // Peut-être modifiable par un admin?

        public string? Description { get; set; }

        // Note : On ne permet généralement pas de changer VendeurId.
        // Note : La modification de AdminId pourrait être une action séparée pour un admin.
    }
}
// Dans Dtos/AnnonceCreateDto.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Projet1.Dtos
{
    public class AnnonceCreateDto
    {
        [Required(ErrorMessage = "Le nom de l'annonce est requis.")]
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le prix est requis.")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Le prix doit être positif.")]
        [Column(TypeName = "decimal(18, 2)")] // Répéter ici peut aider la validation/Swagger
        public decimal Prix { get; set; }

        [StringLength(255)]
        public string? AdresseProduit { get; set; }

        [StringLength(50)]
        public string? Statut { get; set; } // Ex: "Neuf", "Occasion", "A valider"?

        public string? Description { get; set; }


        public string? Telephone { get; set; } 

        // Note : VendeurId sera défini côté serveur à partir de l'utilisateur authentifié.
        // Note : AdminId est généralement défini par un autre processus ou pas à la création.
    }
}
// Dans DTOs/RegisterDto.cs
using System.ComponentModel.DataAnnotations;

namespace Projet1.Dtos // <= Namespace mis à jour
{
    // --- Définition de la classe DTO ---
    public class RegisterDto // <= Classe renommée
    {
        [Required(ErrorMessage = "Le nom est requis.")]
        [StringLength(100)]
        public string Nom { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le prénom est requis.")]
        [StringLength(100)]
        public string Prenom { get; set; } = string.Empty;

        [Required(ErrorMessage = "L'adresse email est requise.")]
        [EmailAddress(ErrorMessage = "Veuillez entrer une adresse email valide.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le mot de passe est requis.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Le mot de passe doit comporter entre 6 et 100 caractères.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;

        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "Le mot de passe et la confirmation ne correspondent pas.")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le type d'utilisateur est requis.")]
        public UserType UserType { get; set; } // Utilise l'enum défini ci-dessous
    }

    // --- Définition de l'Enum dans le même fichier et même namespace ---
    // Il est maintenant dans le namespace Projet1.DTOs
    public enum UserType
    {
        Admin = 1,
        Vendeur = 2,
        Client = 3
    }
}
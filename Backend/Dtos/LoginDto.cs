// Dans DTOs/LoginDto.cs
using System.ComponentModel.DataAnnotations;

namespace Projet1.Dtos // <= Namespace mis à jour
{
    public class LoginDto // <= Classe renommée
    {
        [Required(ErrorMessage = "L'adresse email est requise.")]
        [EmailAddress(ErrorMessage = "Veuillez entrer une adresse email valide.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le mot de passe est requis.")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
    }
}
// Dans DTOs/UserInfoDto.cs

using System.Collections.Generic; // Pour IList

namespace Projet1.Dtos // <= Notez le namespace correct
{
    /// <summary>
    /// DTO pour retourner les informations essentielles d'un utilisateur via l'API.
    /// </summary>
    public class UserInfoDto
    {
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Nom { get; set; }
        public string? Prenom { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }
}
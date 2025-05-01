// Dans Dtos/AdminDetailsDto.cs
using System.Collections.Generic; // Requis pour List<>

namespace Projet1.Dtos
{
    /// <summary>
    /// DTO pour retourner les détails d'un administrateur,
    /// y compris une liste simplifiée des annonces qu'il gère.
    /// </summary>
    public class AdminDetailsDto
    {
        public string Id { get; set; } = string.Empty;
        public string? UserName { get; set; }
        public string? Nom { get; set; }
        public string? Prenom { get; set; }

        // Liste des annonces gérées par cet admin (version simplifiée)
        public List<AnnonceReadDto> AnnoncesGerees { get; set; } = new List<AnnonceReadDto>();
    }
}
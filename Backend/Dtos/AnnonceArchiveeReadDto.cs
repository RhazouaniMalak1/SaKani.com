// Dans Dtos/AnnonceArchiveeReadDto.cs
using System;

namespace Projet1.Dtos
{
    /// <summary>
    /// DTO pour afficher les informations d'une annonce archivée via l'API.
    /// </summary>
    public class AnnonceArchiveeReadDto
    {
        public int Id { get; set; } // ID de l'enregistrement d'archive lui-même
        public int AnnonceId { get; set; } // ID de l'annonce originale

        public string Name { get; set; } = string.Empty;
        public DateTime DateCreationAnnonce { get; set; }
        public decimal Prix { get; set; }
        public string? AdresseProduit { get; set; }
        public string? Statut { get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; } 
        public string? Telephone { get; set; } 
        public string VendeurId { get; set; } = string.Empty; // Garder l'ID du vendeur original

        // Informations sur la suppression/archivage
        public DateTime DateSuppression { get; set; }
        public string AdminIdSuppresseur { get; set; } = string.Empty; // ID de l'admin
        public string? AdminSuppresseurNom { get; set; } // Nom/Prénom ou Username de l'admin (optionnel)
    }
}
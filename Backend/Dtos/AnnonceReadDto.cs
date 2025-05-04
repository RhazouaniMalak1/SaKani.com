// Dans Dtos/AnnonceReadDto.cs
using System;

namespace Projet1.Dtos
{
    public class AnnonceReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime DateCreation { get; set; }
        public decimal Prix { get; set; }
        public string? AdresseProduit { get; set; }
        public string? Statut { get; set; }
        public string? Description { get; set; }
        public string? Image { get; set; } 
        public string? Telephone { get; set; } 
        public string VendeurId { get; set; } = string.Empty; // ID du créateur
        public string? AdminId { get; set; } // ID de l'admin gestionnaire (optionnel)
        public bool DeletionRequested { get; set; }// 'Pour le client' ====> ASupprimerOuNo

        // Optionnel : Ajouter des infos simples du vendeur/admin si nécessaire pour l'affichage
        // public string? VendeurNom { get; set; }
    }
}
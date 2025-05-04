// Dans Models/User.cs

using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;        // Requis pour ICollection<>
using System.Text.Json.Serialization;    // Requis pour [JsonIgnore]
// Assurez-vous que les modèles Annonce et Annonce_Client sont accessibles
using Projet1.Models; // <--- Assurez-vous que ce using est présent ou que les classes sont dans le même namespace

namespace Projet1.Models // Assurez-vous que le namespace est correct
{
    // La classe unique pour représenter tous les utilisateurs (Admin, Vendeur, Client)
    public class User : IdentityUser // Hérite Id, UserName, Email, PasswordHash etc. de Identity
    {
        // --- Propriétés Personnalisées ---
        public string? Nom { get; set; }
        public string? Prenom { get; set; }

        // --- Propriétés de Navigation (Relations avec d'autres entités) ---
        // Ces collections représentent les relations qu'un utilisateur PEUT avoir.
        // La pertinence et le remplissage dépendront du RÔLE de l'utilisateur.

        // Relation Vendeur -> Annonce (Un vendeur crée plusieurs annonces)
        // Sera pertinente si l'utilisateur a le rôle "Vendeur".
        [JsonIgnore]
        public virtual ICollection<Annonce> AnnoncesCrees { get; set; } = new List<Annonce>();

        // Relation Admin -> Annonce (Un admin gère plusieurs annonces)
        // Sera pertinente si l'utilisateur a le rôle "Admin" et que la relation est modélisée via Annonce.AdminId.
        [JsonIgnore]
        public virtual ICollection<Annonce> AnnoncesGerees { get; set; } = new List<Annonce>();

        // Relation Client -> Annonce_Client (Un client consulte plusieurs annonces via la table de liaison)
        // Sera pertinente si l'utilisateur a le rôle "Client".
        [JsonIgnore]
        public virtual ICollection<Annonce_Client> AnnoncesConsultees { get; set; } = new List<Annonce_Client>();



      [JsonIgnore] // Important pour éviter les cycles lors de la sérialisation API
        public virtual ICollection<ArchiveDesAnnoncesSupprime> AnnoncesArchiveesParAdmin { get; set; } = new List<ArchiveDesAnnoncesSupprime>();
        // Le mot-clé 'virtual' permet le Lazy Loading si activé.
        // Initialiser les collections évite les NullReferenceExceptions.
    }
}
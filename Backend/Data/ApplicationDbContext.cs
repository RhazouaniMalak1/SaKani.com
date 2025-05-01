// --- Using Statements ---
using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // Pour IdentityDbContext
using Microsoft.EntityFrameworkCore;                   // Pour DbContextOptions, ModelBuilder, DeleteBehavior
using Projet1.Models;                                  // Pour accéder à User, Annonce, Annonce_Client

namespace Projet1.Data // Assurez-vous que le namespace est correct
{
    // --- Définition de la classe ---
    public class ApplicationDbContext : IdentityDbContext<User> // Toujours hériter de IdentityDbContext<User>
    {
        // --- AJOUT DES DBSETS ---
        // Ajoute une propriété DbSet pour chaque entité que EF Core doit gérer.
        // '= null!;' est utilisé pour satisfaire les avertissements de nullabilité de C# 8+.
        public DbSet<Annonce> Annonces { get; set; } = null!;
        public DbSet<Annonce_Client> AnnonceClients { get; set; } = null!;
        // --------------------------

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        { }

        // --- CONFIGURATION DES MODELES (Fluent API) ---
        protected override void OnModelCreating(ModelBuilder builder)
        {
            // TRES IMPORTANT : Appeler la méthode de base EN PREMIER pour configurer Identity
            base.OnModelCreating(builder);

            // --- Configuration pour l'entité Annonce_Client (Table de liaison) ---

            // 1. Définir la clé primaire composite
            builder.Entity<Annonce_Client>()
                .HasKey(ac => new { ac.ClientId, ac.AnnonceId }); // Clé composée des deux FK

            // 2. Configurer la relation plusieurs-à-plusieurs via Annonce_Client

            // Relation Annonce_Client vers User (Client)
            builder.Entity<Annonce_Client>()
                .HasOne(ac => ac.Client)                // Chaque Annonce_Client a un Client (User)
                .WithMany(u => u.AnnoncesConsultees)   // Chaque User (Client) a plusieurs Annonce_Client
                .HasForeignKey(ac => ac.ClientId)        // La clé étrangère dans Annonce_Client est ClientId
                .OnDelete(DeleteBehavior.Cascade);       // Si un User (Client) est supprimé, supprimer ses enregistrements Annonce_Client

            // Relation Annonce_Client vers Annonce
            builder.Entity<Annonce_Client>()
                .HasOne(ac => ac.Annonce)                // Chaque Annonce_Client a une Annonce
                .WithMany(a => a.Consultations)       // Chaque Annonce a plusieurs Annonce_Client (Consultations)
                .HasForeignKey(ac => ac.AnnonceId)       // La clé étrangère dans Annonce_Client est AnnonceId
                .OnDelete(DeleteBehavior.Cascade);       // Si une Annonce est supprimée, supprimer ses enregistrements Annonce_Client

            // --- Configuration pour l'entité Annonce ---

            // 3. Configurer les relations un-à-plusieurs depuis Annonce vers User

            // Relation Annonce vers User (Vendeur)
            builder.Entity<Annonce>()
                .HasOne(a => a.Vendeur)                 // Chaque Annonce a un Vendeur (User)
                .WithMany(u => u.AnnoncesCrees)         // Chaque User (Vendeur) a plusieurs Annonces (créées)
                .HasForeignKey(a => a.VendeurId)        // La clé étrangère dans Annonce est VendeurId
                .OnDelete(DeleteBehavior.Restrict);     // Empêcher la suppression d'un User s'il a encore des annonces (sécurité)
                                                        // Alternative : Cascade si la suppression user doit supprimer ses annonces

            // Relation Annonce vers User (Admin) - Relation optionnelle
            builder.Entity<Annonce>()
                .HasOne(a => a.Admin)                   // Chaque Annonce peut avoir un Admin (User)
                .WithMany(u => u.AnnoncesGerees)       // Chaque User (Admin) peut gérer plusieurs Annonces
                .HasForeignKey(a => a.AdminId)          // La clé étrangère dans Annonce est AdminId (nullable)
                .OnDelete(DeleteBehavior.SetNull);      // Si l'Admin est supprimé, mettre AdminId à null dans les annonces qu'il gérait
                                                        // Alternative : Restrict

            // 4. (Optionnel mais bonne pratique) Spécifier le type de colonne pour le prix
            builder.Entity<Annonce>()
                   .Property(a => a.Prix)
                   .HasColumnType("decimal(18, 2)");

            // --- Autres configurations spécifiques au modèle peuvent être ajoutées ici ---
            // Par exemple, des index, des contraintes uniques, etc.
        }
    }
}
// Dans Data/ApplicationDbContext.cs

using Microsoft.AspNetCore.Identity.EntityFrameworkCore; // Pour IdentityDbContext
using Microsoft.EntityFrameworkCore;                   // Pour DbContextOptions, ModelBuilder, DeleteBehavior
using Projet1.Models;                                  // Pour accéder à User, Annonce, Annonce_Client, ArchiveDesAnnoncesSupprime

namespace Projet1.Data // Assurez-vous que le namespace est correct
{
    // --- Définition de la classe ---
    public class ApplicationDbContext : IdentityDbContext<User> // Toujours hériter de IdentityDbContext<User>
    {
        // --- AJOUT DES DBSETS ---
        public DbSet<Annonce> Annonces { get; set; } = null!;
        public DbSet<Annonce_Client> AnnonceClients { get; set; } = null!;
        // --- AJOUT DbSet Archive ---
        public DbSet<ArchiveDesAnnoncesSupprime> ArchivesAnnonces { get; set; } = null!;
        // --- FIN AJOUT ---

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        { }

        // --- CONFIGURATION DES MODELES (Fluent API) ---
        protected override void OnModelCreating(ModelBuilder builder)
        {
            // TRES IMPORTANT : Appeler la méthode de base EN PREMIER pour configurer Identity
            base.OnModelCreating(builder);

            // --- Configuration pour l'entité Annonce_Client (Table de liaison - EXISTANTE) ---
            builder.Entity<Annonce_Client>(entity =>
            {
                entity.HasKey(ac => new { ac.ClientId, ac.AnnonceId });

                entity.HasOne(ac => ac.Client)
                      .WithMany(u => u.AnnoncesConsultees)
                      .HasForeignKey(ac => ac.ClientId)
                      .OnDelete(DeleteBehavior.Cascade); // Si le client est supprimé, ses consultations disparaissent

                entity.HasOne(ac => ac.Annonce)
                      .WithMany(a => a.Consultations)
                      .HasForeignKey(ac => ac.AnnonceId)
                      .OnDelete(DeleteBehavior.Cascade); // Si l'annonce est supprimée (physiquement), ses consultations disparaissent
            });


            // --- Configuration pour l'entité Annonce (EXISTANTE) ---
            builder.Entity<Annonce>(entity =>
            {
                entity.HasKey(a => a.Id); // Explicite bien que souvent automatique

                // Relation vers Vendeur (User) - Requis
                entity.HasOne(a => a.Vendeur)
                      .WithMany(u => u.AnnoncesCrees) // La collection dans User
                      .HasForeignKey(a => a.VendeurId) // La clé étrangère dans Annonce
                      .IsRequired() // Rendre explicite que VendeurId ne peut pas être null
                      .OnDelete(DeleteBehavior.Restrict); // Empêche de supprimer un Vendeur s'il a des Annonces actives

                // Relation vers Admin (User) - Optionnel (peut être null)
                entity.HasOne(a => a.Admin)
                      .WithMany(u => u.AnnoncesGerees) // La collection dans User
                      .HasForeignKey(a => a.AdminId) // La clé étrangère dans Annonce
                      .IsRequired(false) // Explicite que AdminId peut être null
                      .OnDelete(DeleteBehavior.SetNull); // Si l'Admin est supprimé, mettre AdminId à null

                // Configuration du type de colonne pour le prix
                entity.Property(a => a.Prix).HasColumnType("decimal(18, 2)");

                 // Configuration pour DeletionRequested (si vous voulez un index)
                 entity.HasIndex(a => a.DeletionRequested);
            });


            // --- AJOUT : Configuration pour l'entité ArchiveDesAnnoncesSupprime ---
            builder.Entity<ArchiveDesAnnoncesSupprime>(entity =>
            {
                // Clé primaire simple (Id auto-généré)
                entity.HasKey(e => e.Id);

                // Assurer la cohérence du type de colonne Prix
                entity.Property(e => e.Prix).HasColumnType("decimal(18, 2)");

                // Relation vers l'Admin (User) qui a effectué la suppression - Requis
                entity.HasOne(e => e.AdminSuppresseur) // La propriété de navigation dans Archive...
                      .WithMany(u => u.AnnoncesArchiveesParAdmin) // La collection correspondante dans User
                      .HasForeignKey(e => e.AdminIdSuppresseur) // La clé étrangère dans Archive...
                      .IsRequired() // Un enregistrement d'archive DOIT avoir un admin suppresseur
                      .OnDelete(DeleteBehavior.Restrict); // Empêche de supprimer un Admin s'il a archivé des annonces.
                                                          // Alternative : SetNull si vous rendez AdminIdSuppresseur nullable (peu logique ici)
                                                          // Alternative : Cascade si supprimer l'admin doit supprimer ses archives (dangereux)

                // Index pour améliorer les performances des recherches sur les archives
                entity.HasIndex(e => e.AnnonceId).IsUnique(false); // Index sur l'ID original (non unique car une annonce pourrait théoriquement être supprimée/recréée/resupprimée)
                entity.HasIndex(e => e.AdminIdSuppresseur); // Index sur qui a supprimé
                entity.HasIndex(e => e.DateSuppression); // Index sur quand ça a été supprimé
            });
            // --- FIN AJOUT ---

        }
    }
}